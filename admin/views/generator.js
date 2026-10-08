import { data, loadAll, insert, getHistory, saveHistory } from '../lib/db.js';
import { h, fill, toast, errorMessage, pageHeader, button, link, emptyState, TEMPLATES, LANGUAGES, nextId } from '../lib/ui.js';
import { compose, defaultConfig, normalizeConfig, SECTION_KEYS } from '../lib/resume/engine.js';
import { renderDocument } from '../lib/resume/render.js';

export const title = 'Resume Generator';

const SECTION_LABELS = {
  summary: 'Professional summary', skills: 'Skills', experience: 'Experience',
  projects: 'Projects', education: 'Education', languages: 'Languages'
};

// Survives navigation inside the admin so an in-progress configuration is not lost.
let saved = null;

export default async function view(route) {
  let d = await data();
  if (!d.profiles.length) return emptyState('Create a career profile first.', link('Career Profiles', '#/profiles', 'btn--primary'));

  let config = await initialConfig(d, route.params);
  let result;

  const openLists = new Set(['experiences', 'projects']);
  const configPanel = h('div', { class: 'generator__config' });
  const notices = h('div', { 'aria-live': 'polite' });
  const frame = h('iframe', { class: 'preview-frame', title: 'Resume preview' });
  const info = h('span', { class: 'preview-bar__info' });
  const titleId = nextId('title');
  const titleInput = h('input', { id: titleId, type: 'text', placeholder: 'Optional, e.g. "Ubisoft application"' });

  const editLink = h('a', { class: 'btn' }, 'Edit profile');
  const downloadBtn = button('Download PDF', () => download(), 'btn--primary');

  const update = () => {
    saved = config;
    result = compose(d, config);
    config = result.config;
    renderConfig();
    renderPreview();
  };

  const setConfig = (patch) => {
    config = { ...config, ...patch };
    update();
  };

  // Left column ------------------------------------------------------------------
  function renderConfig() {
    const scrollY = window.scrollY;
    const focusedId = document.activeElement?.id;
    const c = config;

    const profileSel = select('Career profile', c.profileId, d.profiles.map((p) => ({ value: p.id, label: p.name_en })), (v) => {
      const hasManual = ['experiences', 'projects', 'education', 'skills'].some((k) => Object.keys(c[k]).length);
      if (hasManual && !confirm('Switching profile resets your manual selections. Continue?')) return renderConfig();
      config = defaultConfig(d, d.profiles.find((p) => p.id === v));
      update();
    }, 'gen-profile');

    fill(configPanel, 
      panel('Setup',
        profileSel,
        h('div', { class: 'gen-setup' },
          select('Language', c.language, LANGUAGES, (v) => setConfig({ language: v }), 'gen-lang'),
          select('Template', c.template, TEMPLATES, (v) => setConfig({ template: v }), 'gen-tpl'),
          select('Paper', c.paper, [{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }], (v) => setConfig({ paper: v }), 'gen-paper')),
        checkbox('Include all relevant items (lower match threshold)', c.includeAllRelevant, (v) => setConfig({ includeAllRelevant: v }), 'gen-relevant'),
        h('div', { class: 'field' }, h('label', { for: titleId }, 'History title'), titleInput)),

      panel('Sections',
        h('div', { class: 'check-list check-list--inline' }, SECTION_KEYS.map((k) =>
          checkbox(SECTION_LABELS[k], c.sections[k], (v) => setConfig({ sections: { ...c.sections, [k]: v } }), `gen-sec-${k}`))),
        h('div', { class: 'form-grid' },
          number('Max skills', c.limits.skills, (v) => setConfig({ limits: { ...c.limits, skills: v } }), 'gen-maxskills'),
          number('Max auto projects', c.limits.projects, (v) => setConfig({ limits: { ...c.limits, projects: v } }), 'gen-maxproj'))),

      checklist('Experiences', 'experiences', result.candidates.experiences,
        (e) => `${e.role_en} · ${e.company}`),
      checklist('Projects', 'projects', result.candidates.projects, (p) => p.name),
      checklist('Education', 'education', result.candidates.education, (e) => `${e.degree_en} · ${e.institution}`),
      checklist('Skills', 'skills', result.candidates.skills, (t) => t.name_en),

      panel('Presets', presetsBox()),
      h('div', { class: 'generator__reset' },
        button('Reset to profile defaults', () => {
          if (!confirm('Discard manual selections and go back to the profile defaults?')) return;
          config = defaultConfig(d, result.profile);
          update();
        }, 'btn--ghost btn--sm')));

    if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
    window.scrollTo({ top: scrollY });
  }

  function checklist(label, key, candidates, labelOf) {
    if (!candidates.length) return null;
    const manualCount = candidates.filter((c) => c.manual !== undefined).length;
    const details = h('details', { class: 'panel gen-list', open: openLists.has(key) });
    details.addEventListener('toggle', () => {
      if (details.open) openLists.add(key); else openLists.delete(key);
    });
    details.append(
      h('summary', null, h('h2', null, label),
        h('span', { class: 'gen-list__count' }, `${candidates.filter((c) => c.selected).length} selected${manualCount ? ` · ${manualCount} manual` : ''}`)),
      h('div', { class: 'check-list' }, candidates.map((c) => {
        const id = `gen-${key}-${c.item.id}`;
        const input = h('input', { type: 'checkbox', id, checked: c.selected, disabled: c.disabled });
        input.addEventListener('change', () => {
          const overrides = { ...config[key] };
          if (input.checked === c.auto) delete overrides[c.item.id];
          else overrides[c.item.id] = input.checked;
          setConfig({ [key]: overrides });
        });
        const isManual = c.manual !== undefined;
        return h('div', { class: `check-row${c.disabled ? ' check-row--disabled' : ''}` },
          input,
          h('label', { for: id }, labelOf(c.item), h('small', null, c.reason)),
          isManual
            ? button('Manual · reset', () => {
              const overrides = { ...config[key] };
              delete overrides[c.item.id];
              setConfig({ [key]: overrides });
            }, 'btn--ghost btn--sm check-row__state check-row__state--manual', { 'aria-label': `Reset ${labelOf(c.item)} to automatic` })
            : h('span', { class: 'check-row__state' }, c.disabled ? '' : 'Auto'));
      })));
    return details;
  }

  function presetsBox() {
    const presets = d.resume_presets;
    const id = nextId('preset');
    const sel = h('select', { id }, h('option', { value: '' }, presets.length ? 'Choose a preset' : 'No presets yet'),
      presets.map((p) => h('option', { value: p.id }, p.name)));
    return h('div', { class: 'preset-box' },
      h('div', { class: 'field' }, h('label', { for: id }, 'Load preset'), sel),
      h('div', { class: 'preset-box__actions' },
        button('Load', () => {
          const p = presets.find((x) => x.id === sel.value);
          if (!p) return;
          config = normalizeConfig(d, p.config);
          update();
          toast(`Preset "${p.name}" loaded`);
        }, 'btn--sm', { disabled: !presets.length }),
        button('Save current as preset', async () => {
          const name = prompt('Preset name', `${result.profile?.name_en || 'Resume'} · ${config.language.toUpperCase()}`);
          if (!name?.trim()) return;
          try {
            await insert('resume_presets', { name: name.trim(), config });
            toast('Preset saved');
            renderConfig();
          } catch (err) {
            toast(errorMessage(err), 'error');
          }
        }, 'btn--sm')));
  }

  // Right column ---------------------------------------------------------------
  function renderPreview() {
    const { errors, warnings, filename, profile } = result;
    info.textContent = filename;
    editLink.href = profile ? `#/profiles/${profile.id}` : '#/profiles';
    downloadBtn.disabled = errors.length > 0;
    downloadBtn.title = errors.length ? 'Fix the errors above to download' : '';
    fill(notices, 
      errors.length ? h('div', { class: 'notice notice--error', role: 'alert' },
        h('strong', null, 'Cannot generate yet'), h('ul', null, errors.map((e) => h('li', null, e)))) : null,
      warnings.length ? h('details', { class: 'notice notice--warn', open: warnings.length <= 3 },
        h('summary', null, h('strong', null, `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`),
          warnings.length > 3 ? ' · show details' : ''),
        h('ul', null, warnings.map((w) => h('li', null, w)))) : null);
    frame.srcdoc = renderDocument(result.model, filename.replace(/\.pdf$/, ''));
  }

  async function regenerate() {
    try {
      d = await loadAll();
      update();
      toast('Preview regenerated with the latest data');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  async function download() {
    if (result.errors.length) return;
    downloadBtn.disabled = true;
    try {
      await saveHistory({
        title: titleInput.value.trim() || null,
        profile_id: result.profile?.id || null,
        profile_name: result.profile?.name_en || null,
        language: config.language,
        template: config.template,
        paper: config.paper,
        filename: result.filename,
        config,
        snapshot: { model: result.model, warnings: result.warnings }
      });
    } catch (err) {
      toast(`Saved to history failed: ${errorMessage(err)}`, 'error');
    }
    await printFrame(frame, result.filename);
    downloadBtn.disabled = false;
  }

  update();

  return h('div', null,
    pageHeader('Resume Generator', 'Pick a profile, adjust what goes in, then download. Your manual choices always win over the defaults.'),
    h('div', { class: 'generator' },
      configPanel,
      h('div', { class: 'generator__preview' },
        notices,
        h('div', { class: 'preview-bar' },
          info,
          h('div', { class: 'page-header__actions' },
            editLink,
            button('Regenerate preview', regenerate),
            downloadBtn)),
        frame)));
}

async function initialConfig(d, params) {
  const historyId = params.get('history');
  if (historyId) {
    try {
      const row = await getHistory(historyId);
      return normalizeConfig(d, row.config);
    } catch (err) {
      toast(`Could not load that resume: ${errorMessage(err)}`, 'error');
    }
  }
  const presetId = params.get('preset');
  const preset = presetId && d.resume_presets.find((p) => p.id === presetId);
  if (preset) return normalizeConfig(d, preset.config);

  const profileId = params.get('profile');
  if (profileId) {
    if (saved?.profileId === profileId) return normalizeConfig(d, saved);
    return defaultConfig(d, d.profiles.find((p) => p.id === profileId) || d.profiles[0]);
  }
  if (saved) return normalizeConfig(d, saved);
  return defaultConfig(d, d.profiles[0]);
}

/** Prints the iframe document; the browser's "Save as PDF" uses the document title as file name. */
export async function printFrame(frame, filename) {
  const doc = frame.contentDocument;
  if (!doc || doc.readyState !== 'complete') await new Promise((r) => frame.addEventListener('load', r, { once: true }));
  await frame.contentDocument.fonts?.ready;
  const previous = document.title;
  document.title = filename.replace(/\.pdf$/, '');
  frame.contentWindow.focus();
  frame.contentWindow.print();
  setTimeout(() => { document.title = previous; }, 1000);
}

function panel(titleText, ...children) {
  return h('section', { class: 'panel' }, h('h2', { class: 'panel__title' }, titleText), ...children);
}

function select(label, value, options, onChange, id) {
  const el = h('select', { id }, options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(value) }, o.label)));
  el.addEventListener('change', () => onChange(el.value));
  return h('div', { class: 'field' }, h('label', { for: id }, label), el);
}

function checkbox(label, value, onChange, id) {
  const el = h('input', { type: 'checkbox', id, checked: value });
  el.addEventListener('change', () => onChange(el.checked));
  return h('div', { class: 'field field--check' }, el, h('label', { for: id }, label));
}

function number(label, value, onChange, id) {
  const el = h('input', { type: 'number', id, min: 0, max: 30, value });
  el.addEventListener('change', () => onChange(Math.max(0, Math.min(30, parseInt(el.value, 10) || 0))));
  return h('div', { class: 'field' }, h('label', { for: id }, label), el);
}

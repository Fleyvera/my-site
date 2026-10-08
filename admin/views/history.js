import { data, listHistory, getHistory, saveHistory, deleteHistory, update, remove } from '../lib/db.js';
import { h, fill, toast, errorMessage, pageHeader, button, link, emptyState, TEMPLATES } from '../lib/ui.js';
import { compose } from '../lib/resume/engine.js';
import { renderDocument } from '../lib/resume/render.js';
import { printFrame } from './generator.js';
import { navigate } from '../app.js';

export const title = 'Resume History';

const templateLabel = (v) => TEMPLATES.find((t) => t.value === v)?.label || v;
const when = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default async function view(route) {
  if (route.id) return detail(route.id);
  return list();
}

async function duplicate(row) {
  const full = row.snapshot ? row : await getHistory(row.id);
  const { id, created_at, ...rest } = full;
  const copy = await saveHistory({ ...rest, title: `${full.title || full.filename} (copy)` });
  toast('Resume duplicated');
  return copy;
}

async function list() {
  const d = await data();
  const rows = await listHistory();

  const historyPanel = rows.length
    ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', null, h('tr', null, ['Resume', 'Profile', 'Lang', 'Template', 'Created', 'Actions'].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', null, rows.map((r) => h('tr', null,
        h('td', null, h('a', { href: `#/history/${r.id}`, class: 'list-item__title' }, r.title || r.filename),
          r.title ? h('div', { class: 'list-item__meta' }, r.filename) : null),
        h('td', null, r.profile_name || '-'),
        h('td', null, r.language.toUpperCase()),
        h('td', null, `${templateLabel(r.template)} · ${r.paper}`),
        h('td', null, when(r.created_at)),
        h('td', null, h('div', { class: 'row-actions' },
          link('View', `#/history/${r.id}`, 'btn--sm'),
          link('Edit', `#/generator?history=${r.id}`, 'btn--sm'),
          button('Duplicate', async () => {
            try {
              await duplicate(r);
              navigate('#/history');
            } catch (err) {
              toast(errorMessage(err), 'error');
            }
          }, 'btn--sm'),
          button('Delete', async () => {
            if (!confirm(`Delete "${r.title || r.filename}" from history?`)) return;
            try {
              await deleteHistory(r.id);
              navigate('#/history');
            } catch (err) {
              toast(errorMessage(err), 'error');
            }
          }, 'btn--ghost btn--sm btn--danger'))))))))
    : emptyState('No resumes generated yet.', link('Open the generator', '#/generator', 'btn--primary'));

  const presets = d.resume_presets;
  const presetsPanel = presets.length
    ? h('div', null, presets.map((p) => h('div', { class: 'list-item' },
      h('div', { class: 'list-item__main' },
        h('span', { class: 'list-item__title' }, p.name),
        h('div', { class: 'list-item__meta' },
          `${d.profiles.find((x) => x.id === p.config?.profileId)?.name_en || 'Unknown profile'} · ${String(p.config?.language || 'en').toUpperCase()} · ${templateLabel(p.config?.template)}`)),
      h('div', { class: 'list-item__side' },
        link('Use', `#/generator?preset=${p.id}`, 'btn--sm btn--primary'),
        button('Rename', async () => {
          const name = prompt('Preset name', p.name);
          if (!name?.trim() || name.trim() === p.name) return;
          try {
            await update('resume_presets', { id: p.id }, { name: name.trim() });
            navigate('#/history');
          } catch (err) {
            toast(errorMessage(err), 'error');
          }
        }, 'btn--sm'),
        button('Delete', async () => {
          if (!confirm(`Delete preset "${p.name}"?`)) return;
          try {
            await remove('resume_presets', { id: p.id });
            navigate('#/history');
          } catch (err) {
            toast(errorMessage(err), 'error');
          }
        }, 'btn--ghost btn--sm btn--danger')))))
    : h('p', { class: 'panel__desc' }, 'Save a configuration as a preset from the generator to reuse it here.');

  return h('div', null,
    pageHeader('Resume History', 'Every downloaded resume is saved exactly as it was generated.'),
    h('section', { class: 'panel', 'aria-labelledby': 'hist-list' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'hist-list' }, `Resumes (${rows.length})`)),
      historyPanel),
    h('section', { class: 'panel', 'aria-labelledby': 'hist-presets' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'hist-presets' }, `Presets (${presets.length})`)),
      presetsPanel));
}

async function detail(id) {
  let row;
  try {
    row = await getHistory(id);
  } catch {
    return emptyState('Resume not found.', link('Back to history', '#/history'));
  }
  const d = await data();
  const docTitle = row.filename.replace(/\.pdf$/, '');
  const frame = h('iframe', { class: 'preview-frame', title: 'Saved resume preview' });
  const modeInfo = h('p', { class: 'preview-bar__info' });
  const notices = h('div', { 'aria-live': 'polite' });
  let current = { model: row.snapshot.model, filename: row.filename, regenerated: false, errors: [], warnings: row.snapshot.warnings || [] };

  const show = () => {
    frame.srcdoc = renderDocument(current.model, current.filename.replace(/\.pdf$/, ''));
    modeInfo.textContent = current.regenerated
      ? `Regenerated with today's data · ${current.filename}`
      : `Saved snapshot from ${when(row.created_at)} · ${row.filename}`;
    regenBtn.textContent = current.regenerated ? 'Show saved snapshot' : 'Regenerate with current data';
    fill(notices, 
      current.errors.length ? h('div', { class: 'notice notice--error', role: 'alert' },
        h('strong', null, 'The current data has problems'), h('ul', null, current.errors.map((e) => h('li', null, e)))) : null,
      current.warnings.length ? h('div', { class: 'notice notice--warn' },
        h('strong', null, 'Warnings'), h('ul', null, current.warnings.map((w) => h('li', null, w)))) : null);
  };

  const regenBtn = button('', () => {
    if (current.regenerated) {
      current = { model: row.snapshot.model, filename: row.filename, regenerated: false, errors: [], warnings: row.snapshot.warnings || [] };
    } else {
      const result = compose(d, row.config);
      current = { model: result.model, filename: result.filename, regenerated: true, errors: result.errors, warnings: result.warnings, result };
    }
    show();
  });

  const downloadBtn = button('Download PDF', async () => {
    if (current.regenerated) {
      if (current.errors.length) return toast('Fix the errors before downloading the regenerated version.', 'error');
      try {
        await saveHistory({
          title: row.title, profile_id: row.profile_id, profile_name: current.result.profile?.name_en || row.profile_name,
          language: row.language, template: row.template, paper: row.paper, filename: current.filename,
          config: current.result.config, snapshot: { model: current.model, warnings: current.warnings }
        });
        toast('Regenerated version saved to history');
      } catch (err) {
        toast(errorMessage(err), 'error');
      }
    }
    await printFrame(frame, current.filename);
  }, 'btn--primary');

  show();

  return h('div', null,
    h('a', { class: 'back', href: '#/history' }, '← Resume history'),
    pageHeader(row.title || docTitle,
      `${row.profile_name || 'Deleted profile'} · ${row.language.toUpperCase()} · ${templateLabel(row.template)} · ${row.paper}`,
      link('Edit in generator', `#/generator?history=${row.id}`),
      button('Duplicate', async () => {
        try {
          const copy = await duplicate(row);
          navigate(`#/history/${copy.id}`);
        } catch (err) {
          toast(errorMessage(err), 'error');
        }
      }),
      button('Delete', async () => {
        if (!confirm('Delete this resume from history?')) return;
        try {
          await deleteHistory(row.id);
          navigate('#/history');
        } catch (err) {
          toast(errorMessage(err), 'error');
        }
      }, 'btn--danger')),
    notices,
    h('div', { class: 'preview-bar' }, modeInfo, h('div', { class: 'page-header__actions' }, regenBtn, downloadBtn)),
    frame);
}

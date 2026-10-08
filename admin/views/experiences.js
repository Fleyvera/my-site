import { data, insert, update, remove, tagsFor } from '../lib/db.js';
import {
  h, fill, field, toast, errorMessage, statusBadge, pageHeader, button, link, emptyState,
  FOCUS_KEYS, STATUSES, VISIBILITY, monthValue, monthToDate, formatRange, splitList, nextId
} from '../lib/ui.js';
import { saveTo, bilingual, tagPicker } from '../lib/forms.js';
import { navigate } from '../app.js';

export const title = 'Experiences';

export default async function view(route) {
  const d = await data();
  if (route.id) return detail(d, route.id);
  return list(d);
}

function list(d) {
  const add = button('Add experience', async () => {
    try {
      const row = await insert('experiences', {
        company: 'New company', role_en: 'Role', start_date: new Date().toISOString().slice(0, 8) + '01',
        sort: (d.experiences.at(-1)?.sort || 0) + 10
      });
      navigate(`#/experiences/${row.id}`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }, 'btn--primary');

  return h('div', null,
    pageHeader('Experiences', 'Your full employment history. Profiles decide what shows up on each resume.', add),
    d.experiences.length
      ? d.experiences.map((e) => {
        const tags = tagsFor(d, 'experience_tags', 'experience_id', e.id);
        return h('a', { class: 'record', href: `#/experiences/${e.id}` },
          h('div', null,
            h('div', { class: 'record__title' }, `${e.role_en} · ${e.company}`),
            h('div', { class: 'record__meta' }, formatRange(e.start_date, e.end_date, e.is_current),
              tags.length ? ` · ${tags.slice(0, 5).map((t) => t.name_en).join(', ')}${tags.length > 5 ? '…' : ''}` : '')),
          h('div', { class: 'record__badges' },
            e.visibility !== 'default' && h('span', { class: 'badge badge--muted' }, e.visibility === 'hidden' ? 'Hidden' : 'Manual only'),
            h('span', { class: 'badge' }, `Priority ${e.priority}`),
            statusBadge(e.review_status)));
      })
      : emptyState('No experiences yet.', add));
}

function detail(d, id) {
  const e = d.experiences.find((x) => x.id === id);
  if (!e) return emptyState('Experience not found.', link('Back to experiences', '#/experiences'));
  const m = { id };
  const t = 'experiences';

  const currentBox = field({
    label: 'Current position', type: 'checkbox', value: e.is_current,
    onSave: async (v) => {
      await saveTo(t, m, 'is_current', Boolean)(v);
      if (v && e.end_date) await saveTo(t, m, 'end_date')(null);
      endField.querySelector('input').disabled = v;
    }
  });
  const endField = field({ label: 'End month', type: 'month', value: monthValue(e.end_date), onSave: saveTo(t, m, 'end_date', monthToDate) });
  endField.querySelector('input').disabled = e.is_current;

  return h('div', null,
    h('a', { class: 'back', href: '#/experiences' }, '← All experiences'),
    pageHeader(`${e.role_en} · ${e.company}`, 'Every change is saved when you leave the field.',
      button('Delete experience', async () => {
        if (!confirm(`Delete "${e.role_en} · ${e.company}"? This cannot be undone.`)) return;
        try {
          await remove(t, m);
          toast('Experience deleted');
          navigate('#/experiences');
        } catch (err) {
          toast(errorMessage(err), 'error');
        }
      }, 'btn--danger')),

    h('section', { class: 'panel', 'aria-labelledby': 'exp-basics' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'exp-basics' }, 'Basics')),
      h('div', { class: 'form-grid' },
        field({ label: 'Company', value: e.company, required: true, onSave: saveTo(t, m, 'company', (v) => v.trim()) }),
        field({ label: 'Location', value: e.location, onSave: saveTo(t, m, 'location') }),
        field({ label: 'Role (EN)', value: e.role_en, lang: 'en', onSave: saveTo(t, m, 'role_en', (v) => v.trim()) }),
        field({ label: 'Role (PT)', value: e.role_pt, lang: 'pt', onSave: saveTo(t, m, 'role_pt') }),
        field({ label: 'Start month', type: 'month', value: monthValue(e.start_date), onSave: saveTo(t, m, 'start_date', monthToDate) }),
        endField,
        currentBox,
        field({ label: 'Company URL', type: 'url', value: e.company_url, onSave: saveTo(t, m, 'company_url') }),
        field({ label: 'Group key', value: e.group_key, hint: 'Roles with the same key are grouped under one company on the resume (for example "supergeeks").', onSave: saveTo(t, m, 'group_key') }),
        field({ label: 'Employment type', value: e.employment_type, placeholder: 'Full-time, Part-time, Contract...', onSave: saveTo(t, m, 'employment_type') }))),

    h('section', { class: 'panel', 'aria-labelledby': 'exp-rank' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'exp-rank' }, 'Selection & review')),
      h('div', { class: 'form-grid form-grid--3' },
        field({ label: 'Priority', type: 'select', value: e.priority, onSave: saveTo(t, m, 'priority', Number),
          options: [5, 4, 3, 2, 1].map((p) => ({ value: p, label: `${p}${p === 5 ? ' (highest)' : p === 1 ? ' (lowest)' : ''}` })) }),
        field({ label: 'Visibility', type: 'select', value: e.visibility, options: VISIBILITY, onSave: saveTo(t, m, 'visibility', String) }),
        field({ label: 'Review status', type: 'select', value: e.review_status, options: STATUSES, onSave: saveTo(t, m, 'review_status', String) }),
        field({ label: 'Source / verification', value: e.source, wide: true, onSave: saveTo(t, m, 'source') }),
        field({ label: 'Private notes', type: 'textarea', value: e.notes, wide: true, onSave: saveTo(t, m, 'notes') }))),

    h('section', { class: 'panel', 'aria-labelledby': 'exp-desc' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'exp-desc' }, 'Descriptions')),
      h('p', { class: 'panel__desc' }, 'The general description is used when no bullet or focus version fits. Paste curated text from ChatGPT here after reviewing it.'),
      bilingual({ label: 'General description', row: e, base: 'description', table: t, match: m, rows: 4 }),
      h('h3', { class: 'subhead' }, 'Focus versions'),
      h('p', { class: 'panel__desc' }, 'Optional descriptions per focus. Only versions marked "Reviewed" are used on resumes.'),
      focusEditor(e)),

    h('section', { class: 'panel', 'aria-labelledby': 'exp-bullets' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'exp-bullets' }, 'Resume bullets')),
      h('p', { class: 'panel__desc' }, 'Action + what + context (+ verified result). Tag each bullet with the focuses it supports; bullets without focus are general.'),
      bulletsEditor(d, e)),

    h('section', { class: 'panel', 'aria-labelledby': 'exp-tags' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'exp-tags' }, 'Skills & tags')),
      tagPicker(d, 'experience_tags', 'experience_id', id),
      h('div', { class: 'form-grid', style: 'margin-top:14px' },
        field({ label: 'Technologies (comma separated)', value: (e.technologies || []).join(', '), wide: true,
          onSave: saveTo(t, m, 'technologies', splitList) }))),

    h('section', { class: 'panel', 'aria-labelledby': 'exp-projects' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'exp-projects' }, 'Related projects')),
      projectLinks(d, id)));
}

function focusEditor(e) {
  const t = 'experiences';
  const save = async () => {
    try {
      await update(t, { id: e.id }, { focus_descriptions: e.focus_descriptions });
      toast('Saved');
    } catch (err) {
      toast(`Not saved: ${errorMessage(err)}`, 'error');
    }
  };
  const fd = e.focus_descriptions || (e.focus_descriptions = {});
  const wrap = h('div');

  const renderAll = () => {
    fill(wrap, 
      ...FOCUS_KEYS.filter((f) => fd[f.key]).map((f) => {
        const entry = fd[f.key];
        const textField = (lang) => field({
          label: `${f.label} (${lang.toUpperCase()})`, type: 'textarea', rows: 3, value: entry[lang], lang,
          onSave: (v) => { entry[lang] = v; return save(); }
        });
        return h('details', { class: 'focus', open: entry.status !== 'ok' && Boolean(entry.en || entry.pt) },
          h('summary', null, f.label, statusBadge(entry.status) || h('span', { class: 'badge badge--teal' }, 'Reviewed')),
          h('div', null,
            h('div', { class: 'bilingual' }, textField('en'), textField('pt')),
            h('div', { class: 'form-grid' },
              field({ label: 'Status', type: 'select', value: entry.status, options: STATUSES,
                onSave: (v) => { entry.status = v; save().then(renderAll); } }),
              h('div', { class: 'field', style: 'align-self:end' },
                button('Remove focus version', () => {
                  delete fd[f.key];
                  save().then(renderAll);
                }, 'btn--ghost btn--sm')))));
      }),
      addFocus());
  };

  const addFocus = () => {
    const missing = FOCUS_KEYS.filter((f) => !fd[f.key]);
    if (!missing.length) return null;
    const id = nextId('focus');
    const select = h('select', { id }, missing.map((f) => h('option', { value: f.key }, f.label)));
    return h('div', { class: 'inline-add' },
      h('label', { for: id }, 'Add focus version'), select,
      button('Add', () => {
        fd[select.value] = { en: '', pt: '', status: 'needs_review' };
        save().then(renderAll);
      }, 'btn--sm'));
  };

  renderAll();
  return wrap;
}

function bulletsEditor(d, e) {
  const wrap = h('div');
  const bullets = () => d.experience_bullets.filter((b) => b.experience_id === e.id).sort((a, b) => a.sort - b.sort);

  const move = async (b, dir) => {
    const list = bullets();
    const idx = list.indexOf(b);
    const other = list[idx + dir];
    if (!other) return;
    try {
      const [s1, s2] = [b.sort, other.sort === b.sort ? b.sort + dir : other.sort];
      await update('experience_bullets', { id: b.id }, { sort: s2 });
      await update('experience_bullets', { id: other.id }, { sort: s1 });
      renderAll();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const renderAll = () => {
    const list = bullets();
    fill(wrap, 
      ...list.map((b, i) => {
        const m = { id: b.id };
        const focusChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Focus' },
          FOCUS_KEYS.map((f) => {
            const id = nextId('bf');
            const input = h('input', { type: 'checkbox', id, checked: (b.focus || []).includes(f.key) });
            input.addEventListener('change', async () => {
              const next = new Set(b.focus || []);
              if (input.checked) next.add(f.key); else next.delete(f.key);
              await saveTo('experience_bullets', m, 'focus', () => [...next])(null).catch(() => { input.checked = !input.checked; });
            });
            return h('label', { class: 'chip-toggle', for: id }, input, f.label);
          }));
        return h('div', { class: 'bullet' },
          h('div', { class: 'bullet__bar' },
            h('strong', null, `Bullet ${i + 1}`),
            h('div', { class: 'bullet__actions' },
              button('Move up', () => move(b, -1), 'btn--ghost btn--sm', { disabled: i === 0 }),
              button('Move down', () => move(b, 1), 'btn--ghost btn--sm', { disabled: i === list.length - 1 }),
              button('Delete', async () => {
                if (!confirm('Delete this bullet?')) return;
                try {
                  await remove('experience_bullets', m);
                  renderAll();
                } catch (err) {
                  toast(errorMessage(err), 'error');
                }
              }, 'btn--ghost btn--sm btn--danger'))),
          h('div', { class: 'bilingual' },
            field({ label: 'Text (EN)', type: 'textarea', rows: 2, value: b.text_en, lang: 'en', onSave: saveTo('experience_bullets', m, 'text_en') }),
            field({ label: 'Text (PT)', type: 'textarea', rows: 2, value: b.text_pt, lang: 'pt', onSave: saveTo('experience_bullets', m, 'text_pt') })),
          focusChips,
          field({ label: 'Verified (content confirmed as accurate)', type: 'checkbox', value: b.verified,
            onSave: saveTo('experience_bullets', m, 'verified', Boolean) }));
      }),
      button('Add bullet', async () => {
        try {
          await insert('experience_bullets', { experience_id: e.id, sort: (list.at(-1)?.sort || 0) + 1 });
          renderAll();
        } catch (err) {
          toast(errorMessage(err), 'error');
        }
      }, 'btn--sm'));
  };
  renderAll();
  return wrap;
}

function projectLinks(d, experienceId) {
  if (!d.projects.length) return h('p', { class: 'panel__desc' }, 'No projects yet.');
  const linked = new Set(d.experience_projects.filter((r) => r.experience_id === experienceId).map((r) => r.project_id));
  return h('div', { class: 'chips' }, d.projects.map((p) => {
    const id = nextId('ep');
    const input = h('input', { type: 'checkbox', id, checked: linked.has(p.id) });
    input.addEventListener('change', async () => {
      try {
        if (input.checked) await insert('experience_projects', { experience_id: experienceId, project_id: p.id });
        else await remove('experience_projects', { experience_id: experienceId, project_id: p.id });
        toast('Saved');
      } catch (err) {
        input.checked = !input.checked;
        toast(errorMessage(err), 'error');
      }
    });
    return h('label', { class: 'chip-toggle', for: id }, input, p.name);
  }));
}

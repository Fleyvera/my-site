import { data, insert, update, remove, tagsFor } from '../lib/db.js';
import {
  h, field, toast, errorMessage, statusBadge, pageHeader, button, link, emptyState,
  STATUSES, VISIBILITY, splitList
} from '../lib/ui.js';
import { saveTo, bilingual, tagPicker, toInt } from '../lib/forms.js';
import { navigate } from '../app.js';

export const title = 'Projects';

const LINK_KEYS = [
  { key: 'portfolio', label: 'Portfolio URL' },
  { key: 'steam', label: 'Steam URL' },
  { key: 'github', label: 'GitHub URL' },
  { key: 'itch', label: 'itch.io URL' },
  { key: 'other', label: 'Other URL' }
];

export default async function view(route) {
  const d = await data();
  if (route.id) return detail(d, route.id);
  return list(d);
}

function list(d) {
  const add = button('Add project', async () => {
    try {
      const row = await insert('projects', { name: 'New project', sort: (d.projects.at(-1)?.sort || 0) + 10 });
      navigate(`#/projects/${row.id}`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }, 'btn--primary');

  return h('div', null,
    pageHeader('Projects', 'Games and work you can point to. Only links you add here are ever shown.', add),
    d.projects.length
      ? d.projects.map((p) => {
        const tags = tagsFor(d, 'project_tags', 'project_id', p.id);
        return h('a', { class: 'record', href: `#/projects/${p.id}` },
          h('div', null,
            h('div', { class: 'record__title' }, p.name),
            h('div', { class: 'record__meta' },
              [p.role_en, p.company, p.year].filter(Boolean).join(' · '),
              tags.length ? ` · ${tags.slice(0, 5).map((t) => t.name_en).join(', ')}` : '')),
          h('div', { class: 'record__badges' },
            p.visibility !== 'default' && h('span', { class: 'badge badge--muted' }, p.visibility === 'hidden' ? 'Hidden' : 'Manual only'),
            h('span', { class: 'badge' }, `Priority ${p.priority}`),
            statusBadge(p.review_status)));
      })
      : emptyState('No projects yet.', add));
}

function detail(d, id) {
  const p = d.projects.find((x) => x.id === id);
  if (!p) return emptyState('Project not found.', link('Back to projects', '#/projects'));
  const m = { id };
  const t = 'projects';
  const links = p.links || (p.links = {});

  const saveLink = (key) => async (value) => {
    const v = value.trim();
    if (v) links[key] = v; else delete links[key];
    try {
      await update(t, m, { links });
      toast('Saved');
    } catch (err) {
      toast(`Not saved: ${errorMessage(err)}`, 'error');
    }
  };

  return h('div', null,
    h('a', { class: 'back', href: '#/projects' }, '← All projects'),
    pageHeader(p.name, 'Every change is saved when you leave the field.',
      button('Delete project', async () => {
        if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
        try {
          await remove(t, m);
          toast('Project deleted');
          navigate('#/projects');
        } catch (err) {
          toast(errorMessage(err), 'error');
        }
      }, 'btn--danger')),

    h('section', { class: 'panel', 'aria-labelledby': 'pj-basics' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pj-basics' }, 'Basics')),
      h('div', { class: 'form-grid' },
        field({ label: 'Name', value: p.name, onSave: saveTo(t, m, 'name', (v) => v.trim()) }),
        field({ label: 'Company', value: p.company, onSave: saveTo(t, m, 'company') }),
        field({ label: 'Your role (EN)', value: p.role_en, lang: 'en', onSave: saveTo(t, m, 'role_en') }),
        field({ label: 'Your role (PT)', value: p.role_pt, lang: 'pt', onSave: saveTo(t, m, 'role_pt') }),
        field({ label: 'Year', type: 'number', value: p.year, onSave: saveTo(t, m, 'year', toInt) }),
        field({ label: 'Platforms (comma separated)', value: (p.platforms || []).join(', '), onSave: saveTo(t, m, 'platforms', splitList) }),
        field({ label: 'Technologies (comma separated)', value: (p.technologies || []).join(', '), onSave: saveTo(t, m, 'technologies', splitList) }),
        field({ label: 'Thumbnail URL', type: 'url', value: p.thumbnail_url, onSave: saveTo(t, m, 'thumbnail_url') }))),

    h('section', { class: 'panel', 'aria-labelledby': 'pj-links' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pj-links' }, 'Links')),
      h('p', { class: 'panel__desc' }, 'Leave empty when a link does not exist. Empty links never appear on a resume.'),
      h('div', { class: 'form-grid' },
        LINK_KEYS.map((l) => field({ label: l.label, type: 'url', value: links[l.key], onSave: saveLink(l.key) })))),

    h('section', { class: 'panel', 'aria-labelledby': 'pj-desc' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pj-desc' }, 'Descriptions')),
      bilingual({ label: 'Resume description', row: p, base: 'resume_description', table: t, match: m, rows: 2,
        hint: 'One concise line used in Selected Projects.' }),
      bilingual({ label: 'Full description', row: p, base: 'description', table: t, match: m, rows: 3 }),
      h('div', { class: 'form-grid', style: 'margin-top:14px' },
        field({ label: 'Longer portfolio description', type: 'textarea', rows: 4, value: p.portfolio_description, wide: true,
          onSave: saveTo(t, m, 'portfolio_description') }))),

    h('section', { class: 'panel', 'aria-labelledby': 'pj-rank' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pj-rank' }, 'Selection & review')),
      h('div', { class: 'form-grid form-grid--3' },
        field({ label: 'Priority', type: 'select', value: p.priority, onSave: saveTo(t, m, 'priority', Number),
          options: [5, 4, 3, 2, 1].map((n) => ({ value: n, label: String(n) })) }),
        field({ label: 'Visibility', type: 'select', value: p.visibility, options: VISIBILITY, onSave: saveTo(t, m, 'visibility', String) }),
        field({ label: 'Review status', type: 'select', value: p.review_status, options: STATUSES, onSave: saveTo(t, m, 'review_status', String) }),
        field({ label: 'Private notes', type: 'textarea', value: p.notes, wide: true, onSave: saveTo(t, m, 'notes') }))),

    h('section', { class: 'panel', 'aria-labelledby': 'pj-tags' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pj-tags' }, 'Skills & tags')),
      tagPicker(d, 'project_tags', 'project_id', id)));
}

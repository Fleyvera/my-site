import { data, listHistory } from '../lib/db.js';
import { h, pageHeader, link, statusBadge, emptyState, FOCUS_KEYS } from '../lib/ui.js';

export const title = 'Dashboard';

export default async function view() {
  const d = await data();
  let history = [];
  try {
    history = await listHistory();
  } catch {
    history = [];
  }

  const review = reviewQueue(d);

  return h('div', null,
    pageHeader('Dashboard', 'Your career database at a glance.', link('Generate resume', '#/generator', 'btn--primary')),

    h('div', { class: 'stats' },
      stat('Experiences', d.experiences.length, '#/experiences'),
      stat('Projects', d.projects.length, '#/projects'),
      stat('Skills', d.tags.length, '#/skills'),
      stat('Profiles', d.profiles.length, '#/profiles'),
      stat('Resumes generated', history.length, '#/history'),
      stat('Needs review', review.length)),

    h('div', { class: 'grid-2' },
      h('section', { class: 'panel', 'aria-labelledby': 'dash-quick' },
        h('div', { class: 'panel__head' }, h('h2', { id: 'dash-quick' }, 'Quick generate')),
        h('div', { class: 'quick-list' }, d.profiles.map((p) =>
          h('a', { class: 'list-item', href: `#/generator?profile=${p.id}` },
            h('span', { class: 'list-item__title' }, p.name_en), statusBadge(p.review_status))))),

      h('section', { class: 'panel', 'aria-labelledby': 'dash-recent' },
        h('div', { class: 'panel__head' },
          h('h2', { id: 'dash-recent' }, 'Recent resumes'), link('All history', '#/history', 'btn--ghost btn--sm')),
        history.length
          ? h('div', null, history.slice(0, 6).map((r) => h('a', { class: 'list-item', href: `#/history/${r.id}` },
            h('span', { class: 'list-item__title' }, r.title || r.filename),
            h('span', { class: 'list-item__meta' },
              `${r.language.toUpperCase()} · ${new Date(r.created_at).toLocaleDateString()}`))))
          : emptyState('No resumes yet.'))),

    h('section', { class: 'panel', 'aria-labelledby': 'dash-review' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'dash-review' }, `Needs review (${review.length})`)),
      h('p', { class: 'panel__desc' }, 'Content that is incomplete or not yet confirmed. Resumes using it show a warning.'),
      review.length
        ? h('div', null, review.map((r) => h('a', { class: 'list-item', href: r.href },
          h('span', { class: 'list-item__title' }, r.label),
          h('span', { class: 'list-item__meta' }, r.kind), statusBadge(r.status))))
        : emptyState('Everything is reviewed.')));
}

function stat(label, value, href) {
  return h(href ? 'a' : 'div', { class: 'stat', href }, h('span', { class: 'stat__value' }, String(value)), h('span', { class: 'stat__label' }, label));
}

function reviewQueue(d) {
  const items = [];
  const focusLabel = (k) => FOCUS_KEYS.find((f) => f.key === k)?.label || k;
  for (const p of d.profiles) {
    if (p.review_status !== 'ok') items.push({ kind: 'Profile', label: p.name_en, status: p.review_status, href: `#/profiles/${p.id}` });
  }
  for (const e of d.experiences) {
    if (e.visibility === 'hidden') continue;
    const label = `${e.role_en} · ${e.company}`;
    if (e.review_status !== 'ok') items.push({ kind: 'Experience', label, status: e.review_status, href: `#/experiences/${e.id}` });
    for (const [k, v] of Object.entries(e.focus_descriptions || {})) {
      if (v.status !== 'ok') items.push({ kind: `Focus: ${focusLabel(k)}`, label, status: v.status, href: `#/experiences/${e.id}` });
    }
  }
  for (const p of d.projects) {
    if (p.review_status !== 'ok' && p.visibility !== 'hidden') items.push({ kind: 'Project', label: p.name, status: p.review_status, href: `#/projects/${p.id}` });
  }
  for (const e of d.education) {
    if (e.review_status !== 'ok' && e.visibility !== 'hidden') items.push({ kind: 'Education', label: `${e.degree_en} · ${e.institution}`, status: e.review_status, href: '#/education' });
  }
  return items;
}

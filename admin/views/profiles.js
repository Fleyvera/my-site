import { data, insert, upsert, remove, loadAll } from '../lib/db.js';
import {
  h, field, toast, errorMessage, statusBadge, pageHeader, button, link, emptyState,
  FOCUS_KEYS, STATUSES, TEMPLATES, LANGUAGES, formatRange, nextId
} from '../lib/ui.js';
import { saveTo, bilingual, CATEGORY_LABELS } from '../lib/forms.js';
import { navigate } from '../app.js';

export const title = 'Career Profiles';

const INCLUDE_OPTIONS = [
  { value: 'auto', label: 'Automatic (by tags & priority)' },
  { value: 'include', label: 'Always include' },
  { value: 'exclude', label: 'Always exclude' }
];

export default async function view(route) {
  const d = await data();
  if (route.id) return detail(d, route.id);
  return list(d);
}

function list(d) {
  const add = button('New profile', async () => {
    const name = prompt('Profile name (for example "Level Designer")');
    if (!name?.trim()) return;
    try {
      const row = await insert('profiles', {
        name_en: name.trim(), slug: uniqueSlug(d, name), review_status: 'needs_content',
        sort: (d.profiles.at(-1)?.sort || 0) + 10
      });
      navigate(`#/profiles/${row.id}`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }, 'btn--primary');

  return h('div', null,
    pageHeader('Career Profiles', 'Each profile decides headline, summary, skill weights and which items appear.', add),
    d.profiles.length ? d.profiles.map((p) => h('a', { class: 'record', href: `#/profiles/${p.id}` },
      h('div', null,
        h('div', { class: 'record__title' }, p.name_en),
        h('div', { class: 'record__meta' }, p.headline_en || 'No headline yet')),
      h('div', { class: 'record__badges' },
        h('span', { class: 'badge' }, TEMPLATES.find((t) => t.value === p.default_template)?.label),
        statusBadge(p.review_status))))
      : emptyState('No profiles yet.', add));
}

function uniqueSlug(d, name) {
  const base = String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile';
  let slug = base;
  for (let i = 2; d.profiles.some((p) => p.slug === slug); i++) slug = `${base}-${i}`;
  return slug;
}

function detail(d, id) {
  const p = d.profiles.find((x) => x.id === id);
  if (!p) return emptyState('Profile not found.', link('Back to profiles', '#/profiles'));
  const m = { id };
  const t = 'profiles';

  const duplicate = button('Duplicate', async () => {
    try {
      const { id: _id, created_at, updated_at, ...rest } = p;
      const copy = await insert('profiles', {
        ...rest, name_en: `${p.name_en} (copy)`, slug: uniqueSlug(d, `${p.slug}-copy`), sort: p.sort + 1
      });
      const weights = d.profile_tag_weights.filter((w) => w.profile_id === id).map((w) => ({ ...w, profile_id: copy.id }));
      const exps = d.profile_experiences.filter((r) => r.profile_id === id).map((r) => ({ ...r, profile_id: copy.id }));
      const projs = d.profile_projects.filter((r) => r.profile_id === id).map((r) => ({ ...r, profile_id: copy.id }));
      if (weights.length) await insert('profile_tag_weights', weights);
      if (exps.length) await insert('profile_experiences', exps);
      if (projs.length) await insert('profile_projects', projs);
      await loadAll();
      toast('Profile duplicated');
      navigate(`#/profiles/${copy.id}`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  });

  const del = button('Delete', async () => {
    if (!confirm(`Delete profile "${p.name_en}"? Resume history keeps its snapshots.`)) return;
    try {
      await remove(t, m);
      toast('Profile deleted');
      navigate('#/profiles');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }, 'btn--danger');

  return h('div', null,
    h('a', { class: 'back', href: '#/profiles' }, '← All profiles'),
    pageHeader(p.name_en, 'Every change is saved when you leave the field.',
      link('Generate resume', `#/generator?profile=${id}`, 'btn--primary'), duplicate, del),

    p.review_status !== 'ok' && h('div', { class: 'notice notice--warn', role: 'note' },
      p.review_status === 'needs_content'
        ? 'This profile still needs content. Add a headline and summary before generating a resume.'
        : 'Headline and summary need your review. Mark the profile as Reviewed when the text is final.'),

    h('section', { class: 'panel', 'aria-labelledby': 'pf-basics' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pf-basics' }, 'Basics')),
      h('div', { class: 'form-grid' },
        field({ label: 'Name (EN)', value: p.name_en, onSave: saveTo(t, m, 'name_en', (v) => v.trim()) }),
        field({ label: 'Name (PT)', value: p.name_pt, onSave: saveTo(t, m, 'name_pt') }),
        field({ label: 'Main focus', type: 'select', value: p.focus,
          options: [{ value: '', label: 'None' }, ...FOCUS_KEYS.map((f) => ({ value: f.key, label: f.label }))],
          hint: 'Bullets and focus descriptions tagged with this focus are preferred.',
          onSave: saveTo(t, m, 'focus') }),
        field({ label: 'Review status', type: 'select', value: p.review_status, options: STATUSES, onSave: saveTo(t, m, 'review_status', String) }),
        field({ label: 'Default template', type: 'select', value: p.default_template, options: TEMPLATES, onSave: saveTo(t, m, 'default_template', String) }),
        field({ label: 'Default language', type: 'select', value: p.default_language, options: LANGUAGES, onSave: saveTo(t, m, 'default_language', String) }))),

    h('section', { class: 'panel', 'aria-labelledby': 'pf-text' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pf-text' }, 'Headline & summary')),
      bilingual({ label: 'Headline', row: p, base: 'headline', table: t, match: m, type: 'text' }),
      bilingual({ label: 'Professional summary', row: p, base: 'summary', table: t, match: m, rows: 5,
        hint: '2 to 4 lines. Only claims you can back up.' })),

    h('section', { class: 'panel', 'aria-labelledby': 'pf-weights' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pf-weights' }, 'Skill weights')),
      h('p', { class: 'panel__desc' }, '0 ignores a skill, 5 makes it central. Weights rank skills and decide which experiences and projects are auto-selected.'),
      weightsEditor(d, id)),

    h('section', { class: 'panel', 'aria-labelledby': 'pf-exp' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pf-exp' }, 'Experiences in this profile')),
      h('p', { class: 'panel__desc' }, 'Override the automatic choice and, if needed, write a profile-specific description.'),
      itemRules(d, id, 'profile_experiences', 'experience_id', d.experiences,
        (e) => `${e.role_en} · ${e.company}`, (e) => formatRange(e.start_date, e.end_date, e.is_current))),

    h('section', { class: 'panel', 'aria-labelledby': 'pf-proj' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'pf-proj' }, 'Projects in this profile')),
      itemRules(d, id, 'profile_projects', 'project_id', d.projects, (pj) => pj.name, (pj) => pj.year || '')));
}

function weightsEditor(d, profileId) {
  const weights = new Map(d.profile_tag_weights.filter((w) => w.profile_id === profileId).map((w) => [w.tag_id, w.weight]));
  const groups = {};
  for (const tag of d.tags) (groups[tag.category] ||= []).push(tag);

  const weightControl = (tag) => {
    const id = nextId('w');
    const current = weights.get(tag.id) || 0;
    const select = h('select', { id }, [0, 1, 2, 3, 4, 5].map((n) => h('option', { value: n, selected: n === current }, String(n))));
    const row = h('div', { class: `weight${current ? ' weight--on' : ''}` }, h('label', { for: id }, tag.name_en), select);
    select.addEventListener('change', async () => {
      const w = Number(select.value);
      try {
        if (w === 0) await remove('profile_tag_weights', { profile_id: profileId, tag_id: tag.id });
        else await upsert('profile_tag_weights', { profile_id: profileId, tag_id: tag.id, weight: w }, 'profile_id,tag_id');
        row.classList.toggle('weight--on', w > 0);
        toast('Saved');
      } catch (err) {
        toast(errorMessage(err), 'error');
      }
    });
    return row;
  };

  return h('div', null, Object.keys(CATEGORY_LABELS).filter((c) => groups[c]).map((c) =>
    h('fieldset', { class: 'tag-group' },
      h('legend', null, CATEGORY_LABELS[c]),
      h('div', { class: 'weights' }, groups[c].map(weightControl)))));
}

function itemRules(d, profileId, table, key, items, labelOf, metaOf) {
  if (!items.length) return h('p', { class: 'panel__desc' }, 'Nothing to configure yet.');
  return h('div', { class: 'rules' }, items.map((item) => {
    const match = { profile_id: profileId, [key]: item.id };
    const getRule = () => d[table].find((r) => r.profile_id === profileId && r[key] === item.id);
    const rule = getRule();

    const saveRule = async (patch) => {
      const current = getRule();
      const next = {
        ...match,
        include: current?.include || 'auto',
        rank: current?.rank ?? 0,
        description_en: current?.description_en ?? null,
        description_pt: current?.description_pt ?? null,
        ...patch
      };
      try {
        if (next.include === 'auto') {
          if (next.description_en || next.description_pt) {
            toast('Keep "Always include" or "Always exclude" to store a custom description.', 'error');
            return false;
          }
          if (current) await remove(table, match);
        } else {
          await upsert(table, next, `profile_id,${key}`);
        }
        toast('Saved');
        return true;
      } catch (err) {
        toast(errorMessage(err), 'error');
        return false;
      }
    };

    const hiddenNote = item.visibility === 'hidden' ? ' · hidden everywhere'
      : item.visibility === 'manual_only' ? ' · manual only' : '';

    return h('details', { class: 'rule' },
      h('summary', null,
        h('span', { class: 'rule__title' }, labelOf(item)),
        h('span', { class: 'rule__meta' }, `${metaOf(item)}${hiddenNote}`),
        h('span', { class: `badge ${rule?.include === 'exclude' ? 'badge--muted' : rule ? 'badge--teal' : ''}` },
          rule ? (rule.include === 'exclude' ? 'Excluded' : 'Included') : 'Auto')),
      h('div', { class: 'form-grid' },
        field({ label: 'Selection', type: 'select', value: rule?.include || 'auto', options: INCLUDE_OPTIONS,
          onSave: async (v) => { if (await saveRule({ include: v })) navigate(location.hash); } }),
        field({ label: 'Order (lower appears first among included items)', type: 'number', value: rule?.rank ?? 0,
          onSave: (v) => saveRule({ rank: parseInt(v, 10) || 0 }) })),
      h('div', { class: 'bilingual' },
        field({ label: 'Custom description (EN)', type: 'textarea', rows: 2, value: rule?.description_en, lang: 'en',
          onSave: (v) => saveRule({ description_en: v.trim() || null }) }),
        field({ label: 'Custom description (PT)', type: 'textarea', rows: 2, value: rule?.description_pt, lang: 'pt',
          onSave: (v) => saveRule({ description_pt: v.trim() || null }) })));
  }));
}

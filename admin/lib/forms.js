import { update, insert, remove } from './db.js';
import { h, field, toast, errorMessage, normalizeSlug, nextId } from './ui.js';

export const nullable = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);
export const toInt = (v) => (v === '' || v === null ? null : parseInt(v, 10));

export function saveTo(table, match, column, transform = nullable) {
  return async (value) => {
    try {
      await update(table, match, { [column]: transform(value) });
      toast('Saved');
    } catch (err) {
      toast(`Not saved: ${errorMessage(err)}`, 'error');
      throw err;
    }
  };
}

/** Side-by-side EN / PT fields for a column pair like description_en / description_pt. */
export function bilingual({ label, row, base, table, match, type = 'textarea', rows = 3, hint }) {
  return h('div', { class: 'bilingual field--wide' },
    field({ label: `${label} (EN)`, value: row[`${base}_en`], type, rows, lang: 'en', hint,
      onSave: saveTo(table, match, `${base}_en`) }),
    field({ label: `${label} (PT)`, value: row[`${base}_pt`], type, rows, lang: 'pt',
      onSave: saveTo(table, match, `${base}_pt`) }));
}

const CATEGORY_LABELS = {
  design: 'Design', dev: 'Development', tool: 'Tools', art: 'Art', ux: 'UX/UI',
  edu: 'Education', domain: 'Domain', soft: 'Professional', other: 'Other'
};

/** Toggle chips for every tag, grouped by category, writing to a join table. */
export function tagPicker(d, joinTable, key, id) {
  const selected = new Set(d[joinTable].filter((r) => r[key] === id).map((r) => r.tag_id));
  const groups = {};
  for (const t of d.tags) (groups[t.category] ||= []).push(t);

  const chip = (t) => {
    const inputId = nextId('tag');
    const input = h('input', { type: 'checkbox', id: inputId, checked: selected.has(t.id) });
    input.addEventListener('change', async () => {
      try {
        if (input.checked) await insert(joinTable, { [key]: id, tag_id: t.id });
        else await remove(joinTable, { [key]: id, tag_id: t.id });
        toast('Saved');
      } catch (err) {
        input.checked = !input.checked;
        toast(`Not saved: ${errorMessage(err)}`, 'error');
      }
    });
    return h('label', { class: 'chip-toggle', for: inputId }, input, t.name_en);
  };

  return h('div', { class: 'field field--wide' },
    Object.keys(CATEGORY_LABELS).filter((c) => groups[c]).map((c) =>
      h('fieldset', { class: 'tag-group' },
        h('legend', null, CATEGORY_LABELS[c]),
        h('div', { class: 'chips' }, groups[c].map(chip)))),
    h('p', { class: 'field__hint' }, 'Missing a skill? Add it in Skills & Tags so it stays normalized.'));
}

export function findDuplicateTag(d, name) {
  const slug = normalizeSlug(name);
  return d.tags.find((t) => t.slug === slug || (t.aliases || []).includes(slug));
}

export { CATEGORY_LABELS };

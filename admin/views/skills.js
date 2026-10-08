import { data, insert, remove } from '../lib/db.js';
import { h, field, toast, errorMessage, pageHeader, button, splitList, STATUSES, nextId } from '../lib/ui.js';
import { saveTo, findDuplicateTag, CATEGORY_LABELS } from '../lib/forms.js';
import { navigate } from '../app.js';

export const title = 'Skills & Tags';

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export default async function view() {
  const d = await data();

  const usage = (tagId) =>
    d.experience_tags.filter((r) => r.tag_id === tagId).length + d.project_tags.filter((r) => r.tag_id === tagId).length;

  const nameId = nextId('newtag');
  const catId = nextId('newcat');
  const nameInput = h('input', { id: nameId, required: true, placeholder: 'e.g. Level Design' });
  const catSelect = h('select', { id: catId }, CATEGORY_OPTIONS.map((o) => h('option', { value: o.value }, o.label)));
  const addForm = h('form', { class: 'inline-add', 'aria-label': 'Add skill' },
    h('label', { for: nameId }, 'New skill'), nameInput,
    h('label', { for: catId, class: 'sr-only' }, 'Category'), catSelect,
    h('button', { type: 'submit', class: 'btn btn--primary btn--sm' }, 'Add'));
  addForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    const dup = findDuplicateTag(d, name);
    if (dup) {
      toast(`"${name}" already exists as "${dup.name_en}".`, 'error');
      return;
    }
    try {
      await insert('tags', { name_en: name, category: catSelect.value });
      d.tags.sort((a, b) => a.name_en.localeCompare(b.name_en));
      toast('Skill added');
      navigate('#/skills');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  });

  const filterId = nextId('filter');
  const filter = h('input', { id: filterId, type: 'search', placeholder: 'Filter skills' });
  const rows = d.tags.map((t) => {
    const m = { id: t.id };
    const used = usage(t.id);
    const tr = h('tr', { dataset: { search: [t.name_en, t.name_pt, ...(t.aliases || [])].join(' ').toLowerCase() } },
      h('td', null, cell(field({ label: 'Name (EN)', value: t.name_en, onSave: saveTo('tags', m, 'name_en', (v) => v.trim()) }))),
      h('td', null, cell(field({ label: 'Name (PT)', value: t.name_pt, onSave: saveTo('tags', m, 'name_pt') }))),
      h('td', null, cell(field({ label: 'Category', type: 'select', value: t.category, options: CATEGORY_OPTIONS, onSave: saveTo('tags', m, 'category', String) }))),
      h('td', null, cell(field({ label: 'Aliases', value: (t.aliases || []).join(', '), onSave: saveTo('tags', m, 'aliases', splitList) }))),
      h('td', null, cell(field({ label: 'Status', type: 'select', value: t.review_status, options: STATUSES, onSave: saveTo('tags', m, 'review_status', String) }))),
      h('td', { class: 'num' }, String(used)),
      h('td', null, button('Delete', async () => {
        const msg = used ? `"${t.name_en}" is used ${used} time(s). Delete it everywhere?` : `Delete "${t.name_en}"?`;
        if (!confirm(msg)) return;
        try {
          await remove('tags', m);
          toast('Skill deleted');
          navigate('#/skills');
        } catch (err) {
          toast(errorMessage(err), 'error');
        }
      }, 'btn--ghost btn--sm btn--danger', { 'aria-label': `Delete ${t.name_en}` })));
    return tr;
  });

  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    for (const tr of rows) tr.hidden = q && !tr.dataset.search.includes(q);
  });

  return h('div', null,
    pageHeader('Skills & Tags', 'One normalized list. Aliases catch duplicates like "Game Dev" vs "Game Development".'),
    h('section', { class: 'panel' }, addForm),
    h('section', { class: 'panel' },
      h('div', { class: 'inline-add' }, h('label', { for: filterId }, 'Filter'), filter),
      h('div', { class: 'table-wrap' },
        h('table', { class: 'table table--edit' },
          h('thead', null, h('tr', null,
            ['Name (EN)', 'Name (PT)', 'Category', 'Aliases', 'Status', 'Used', ''].map((c) => h('th', { scope: 'col' }, c)))),
          h('tbody', null, rows)))));
}

/** Keeps the label for screen readers while the table header shows it visually. */
function cell(fieldEl) {
  fieldEl.querySelector('label').classList.add('sr-only');
  return fieldEl;
}

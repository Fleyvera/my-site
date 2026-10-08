import { data, insert, remove } from '../lib/db.js';
import { h, field, toast, errorMessage, statusBadge, pageHeader, button, emptyState, STATUSES, VISIBILITY } from '../lib/ui.js';
import { saveTo, toInt } from '../lib/forms.js';
import { navigate } from '../app.js';

export const title = 'Education';

export default async function view() {
  const d = await data();
  const add = button('Add education', async () => {
    try {
      await insert('education', { institution: 'New institution', degree_en: 'Degree', sort: (d.education.at(-1)?.sort || 0) + 10 });
      navigate('#/education');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }, 'btn--primary');

  return h('div', null,
    pageHeader('Education', 'Degrees and courses. Unconfirmed dates stay marked as needing review.', add),
    d.education.length ? d.education.map((e) => {
      const m = { id: e.id };
      const t = 'education';
      return h('section', { class: 'panel', 'aria-label': e.institution },
        h('div', { class: 'panel__head' },
          h('h2', null, `${e.degree_en} · ${e.institution}`, ' ', statusBadge(e.review_status)),
          button('Delete', async () => {
            if (!confirm(`Delete "${e.degree_en}"?`)) return;
            try {
              await remove(t, m);
              navigate('#/education');
            } catch (err) {
              toast(errorMessage(err), 'error');
            }
          }, 'btn--ghost btn--sm btn--danger')),
        h('div', { class: 'form-grid' },
          field({ label: 'Institution', value: e.institution, onSave: saveTo(t, m, 'institution', (v) => v.trim()) }),
          field({ label: 'Location', value: e.location, onSave: saveTo(t, m, 'location') }),
          field({ label: 'Degree (EN)', value: e.degree_en, lang: 'en', onSave: saveTo(t, m, 'degree_en', (v) => v.trim()) }),
          field({ label: 'Degree (PT)', value: e.degree_pt, lang: 'pt', onSave: saveTo(t, m, 'degree_pt') }),
          field({ label: 'Field (EN)', value: e.field_en, lang: 'en', onSave: saveTo(t, m, 'field_en') }),
          field({ label: 'Field (PT)', value: e.field_pt, lang: 'pt', onSave: saveTo(t, m, 'field_pt') }),
          field({ label: 'Start year', type: 'number', value: e.start_year, onSave: saveTo(t, m, 'start_year', toInt) }),
          field({ label: 'End year', type: 'number', value: e.end_year, onSave: saveTo(t, m, 'end_year', toInt) })),
        h('div', { class: 'form-grid form-grid--3' },
          field({ label: 'Priority', type: 'select', value: e.priority, onSave: saveTo(t, m, 'priority', Number),
            options: [5, 4, 3, 2, 1].map((n) => ({ value: n, label: String(n) })) }),
          field({ label: 'Visibility', type: 'select', value: e.visibility, options: VISIBILITY, onSave: saveTo(t, m, 'visibility', String) }),
          field({ label: 'Review status', type: 'select', value: e.review_status, options: STATUSES, onSave: saveTo(t, m, 'review_status', String) }),
          field({ label: 'Private notes', type: 'textarea', value: e.notes, wide: true, onSave: saveTo(t, m, 'notes') })));
    }) : emptyState('No education yet.', add));
}

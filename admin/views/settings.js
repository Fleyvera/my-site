import { data, update } from '../lib/db.js';
import { h, fill, field, toast, errorMessage, pageHeader, button, nextId } from '../lib/ui.js';
import { saveTo } from '../lib/forms.js';

export const title = 'Settings';

export default async function view() {
  const d = await data();
  const s = d.settings;
  const m = { id: 1 };
  const t = 'settings';

  return h('div', null,
    pageHeader('Settings', 'Contact details printed in the resume header. Empty fields are omitted.'),
    h('section', { class: 'panel', 'aria-labelledby': 'st-id' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'st-id' }, 'Identity & contact')),
      h('div', { class: 'form-grid' },
        field({ label: 'Full name', value: s.full_name, onSave: saveTo(t, m, 'full_name', (v) => v.trim()) }),
        field({ label: 'Short name', value: s.short_name, hint: 'Used in file names when set.', onSave: saveTo(t, m, 'short_name') }),
        field({ label: 'Location (EN)', value: s.location_en, lang: 'en', onSave: saveTo(t, m, 'location_en') }),
        field({ label: 'Location (PT)', value: s.location_pt, lang: 'pt', onSave: saveTo(t, m, 'location_pt') }),
        field({ label: 'Email', type: 'email', value: s.email, onSave: saveTo(t, m, 'email') }),
        field({ label: 'Phone', type: 'tel', value: s.phone, onSave: saveTo(t, m, 'phone') }),
        field({ label: 'LinkedIn URL', type: 'url', value: s.linkedin_url, onSave: saveTo(t, m, 'linkedin_url') }),
        field({ label: 'Portfolio URL', type: 'url', value: s.portfolio_url, onSave: saveTo(t, m, 'portfolio_url') }),
        field({ label: 'GitHub URL', type: 'url', value: s.github_url, onSave: saveTo(t, m, 'github_url') }),
        field({ label: 'Default paper size', type: 'select', value: s.default_paper,
          options: [{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'US Letter' }], onSave: saveTo(t, m, 'default_paper', String) }))),
    h('section', { class: 'panel', 'aria-labelledby': 'st-lang' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'st-lang' }, 'Spoken languages')),
      h('p', { class: 'panel__desc' }, 'Shown in the Languages section when enabled in the generator.'),
      languagesEditor(s)));
}

function languagesEditor(s) {
  const wrap = h('div');
  const list = Array.isArray(s.languages) ? s.languages : [];
  const save = async () => {
    try {
      await update('settings', { id: 1 }, { languages: list });
      toast('Saved');
    } catch (err) {
      toast(`Not saved: ${errorMessage(err)}`, 'error');
    }
  };
  const render = () => {
    fill(wrap, 
      ...list.map((lang, i) => h('div', { class: 'form-grid form-grid--3 lang-row' },
        field({ label: 'Language (EN)', value: lang.name_en, onSave: (v) => { lang.name_en = v.trim(); return save(); } }),
        field({ label: 'Language (PT)', value: lang.name_pt, onSave: (v) => { lang.name_pt = v.trim(); return save(); } }),
        h('div', { class: 'bilingual' },
          field({ label: 'Level (EN)', value: lang.level_en, onSave: (v) => { lang.level_en = v.trim(); return save(); } }),
          field({ label: 'Level (PT)', value: lang.level_pt, onSave: (v) => { lang.level_pt = v.trim(); return save(); } })),
        h('div', null, button('Remove', () => { list.splice(i, 1); save().then(render); }, 'btn--ghost btn--sm btn--danger')))),
      button('Add language', () => {
        list.push({ name_en: '', name_pt: '', level_en: '', level_pt: '' });
        s.languages = list;
        render();
      }, 'btn--sm', { id: nextId('addlang') }));
  };
  render();
  return wrap;
}

export const FOCUS_KEYS = [
  { key: 'game_design', label: 'Game Design' },
  { key: 'game_dev', label: 'Game Development' },
  { key: 'programming', label: 'Programming' },
  { key: 'technical', label: 'Technical' },
  { key: 'game_art', label: 'Game Art' },
  { key: 'pixel_art', label: 'Pixel Art' },
  { key: '3d', label: '3D' },
  { key: 'ux_ui', label: 'UX/UI' },
  { key: 'education', label: 'Education' },
  { key: 'coordination', label: 'Coordination' }
];

export const STATUSES = [
  { value: 'ok', label: 'Reviewed' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'needs_content', label: 'Needs content' }
];

export const VISIBILITY = [
  { value: 'default', label: 'Default (can be auto-selected)' },
  { value: 'manual_only', label: 'Manual only (never auto-selected)' },
  { value: 'hidden', label: 'Hidden (never used)' }
];

export const TEMPLATES = [
  { value: 'ats', label: 'ATS Professional' },
  { value: 'creative', label: 'Creative Professional' },
  { value: 'academic', label: 'Academic' }
];

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' }
];

let uid = 0;
export const nextId = (prefix = 'f') => `${prefix}-${++uid}`;

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = Boolean(v);
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

/** replaceChildren that skips null/false and flattens arrays, like h(). */
export function fill(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : String(c));
  }
}

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let toastTimer;
export function toast(message, type = 'ok') {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(el);
  }
  el.textContent = message;
  el.dataset.type = type;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), type === 'error' ? 6000 : 2200);
}

export function errorMessage(err) {
  if (!err) return 'Unknown error';
  return err.message || err.error_description || String(err);
}

/**
 * Labeled form control. onSave receives the new value on "change" (blur for
 * text fields), which keeps saves explicit and avoids a request per keystroke.
 */
export function field({ label, value, type = 'text', rows, options, onSave, hint, placeholder, required, lang, wide }) {
  const id = nextId();
  let control;
  if (type === 'textarea') {
    control = h('textarea', { id, rows: rows || 3, placeholder, lang }, value ?? '');
  } else if (type === 'select') {
    control = h('select', { id },
      options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(value ?? '') }, o.label)));
  } else if (type === 'checkbox') {
    control = h('input', { id, type: 'checkbox', checked: Boolean(value) });
  } else {
    control = h('input', { id, type, value: value ?? '', placeholder, required, lang });
  }
  if (onSave) {
    control.addEventListener('change', async () => {
      const v = type === 'checkbox' ? control.checked : control.value;
      control.setAttribute('aria-busy', 'true');
      try {
        await onSave(v);
      } finally {
        control.removeAttribute('aria-busy');
      }
    });
  }
  const hintId = hint ? `${id}-hint` : null;
  if (hintId) control.setAttribute('aria-describedby', hintId);
  if (type === 'checkbox') {
    return h('div', { class: `field field--check${wide ? ' field--wide' : ''}` },
      control, h('label', { for: id }, label), hint && h('p', { class: 'field__hint', id: hintId }, hint));
  }
  return h('div', { class: `field${wide ? ' field--wide' : ''}` },
    h('label', { for: id }, label), control, hint && h('p', { class: 'field__hint', id: hintId }, hint));
}

export function statusBadge(status) {
  if (!status || status === 'ok') return null;
  const label = status === 'needs_content' ? 'Needs content' : 'Needs review';
  return h('span', { class: `badge badge--${status}` }, label);
}

export function pageHeader(title, subtitle, ...actions) {
  return h('header', { class: 'page-header' },
    h('div', null, h('h1', null, title), subtitle && h('p', { class: 'page-header__sub' }, subtitle)),
    actions.length ? h('div', { class: 'page-header__actions' }, actions) : null);
}

export function button(label, onClick, variant = '', attrs = {}) {
  return h('button', { type: 'button', class: `btn ${variant}`.trim(), onClick, ...attrs }, label);
}

export function link(label, href, variant = '') {
  return h('a', { href, class: `btn ${variant}`.trim() }, label);
}

export function emptyState(text, action) {
  return h('div', { class: 'empty' }, h('p', null, text), action);
}

export function monthValue(date) {
  return date ? String(date).slice(0, 7) : '';
}

export function monthToDate(value) {
  return value ? `${value}-01` : null;
}

export function formatRange(start, end, isCurrent) {
  const f = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '');
  return `${f(start)} - ${isCurrent ? 'Present' : f(end) || '?'}`;
}

export function splitList(value) {
  return String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function normalizeSlug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9+#]/g, '');
}

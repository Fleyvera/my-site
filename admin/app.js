import { sb } from './lib/supabase.js';
import { loadAll, SetupError } from './lib/db.js';
import { h, toast, errorMessage, button } from './lib/ui.js';

const NAV = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'experiences', label: 'Experiences' },
  { path: 'projects', label: 'Projects' },
  { path: 'skills', label: 'Skills & Tags' },
  { path: 'education', label: 'Education' },
  { path: 'profiles', label: 'Career Profiles' },
  { path: 'generator', label: 'Resume Generator' },
  { path: 'history', label: 'Resume History' },
  { path: 'settings', label: 'Settings' }
];

const VIEWS = {
  dashboard: () => import('./views/dashboard.js'),
  experiences: () => import('./views/experiences.js'),
  projects: () => import('./views/projects.js'),
  skills: () => import('./views/skills.js'),
  education: () => import('./views/education.js'),
  profiles: () => import('./views/profiles.js'),
  generator: () => import('./views/generator.js'),
  history: () => import('./views/history.js'),
  settings: () => import('./views/settings.js')
};

const root = document.getElementById('app');
let session = null;

export function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '') || 'dashboard';
  const [path, query = ''] = raw.split('?');
  const [view, id] = path.split('/');
  return { view: VIEWS[view] ? view : 'dashboard', id: id || null, params: new URLSearchParams(query) };
}

export function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function renderLogin(message) {
  const email = h('input', { id: 'login-email', type: 'email', autocomplete: 'username', required: true });
  const password = h('input', { id: 'login-password', type: 'password', autocomplete: 'current-password', required: true });
  const status = h('p', { class: 'login__status', role: 'alert' }, message || '');
  const submit = h('button', { type: 'submit', class: 'btn btn--primary btn--block' }, 'Sign in');

  const form = h('form', {
    class: 'login__form',
    onSubmit: async (e) => {
      e.preventDefault();
      submit.disabled = true;
      status.textContent = '';
      const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
      submit.disabled = false;
      if (error) status.textContent = error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message;
    }
  },
  h('div', { class: 'field' }, h('label', { for: 'login-email' }, 'Email'), email),
  h('div', { class: 'field' }, h('label', { for: 'login-password' }, 'Password'), password),
  submit, status);

  root.replaceChildren(h('main', { class: 'login' },
    h('div', { class: 'login__card' },
      h('p', { class: 'login__eyebrow' }, 'Private area'),
      h('h1', null, 'Career Admin'),
      h('p', { class: 'login__text' }, 'Sign in to manage your career database and generate resumes.'),
      form)));
  email.focus();
}

function renderMessage(title, text, actions) {
  root.replaceChildren(h('main', { class: 'login' },
    h('div', { class: 'login__card' }, h('h1', null, title), h('p', { class: 'login__text' }, text), actions)));
}

function renderShell() {
  const nav = h('nav', { class: 'sidebar__nav', id: 'admin-nav', 'aria-label': 'Admin' },
    NAV.map((n) => h('a', { href: `#/${n.path}`, dataset: { view: n.path } }, n.label)));
  const toggle = h('button', {
    type: 'button', class: 'sidebar__toggle', 'aria-controls': 'admin-nav', 'aria-expanded': 'false',
    onClick: () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    }
  }, 'Menu');
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  root.replaceChildren(
    h('a', { class: 'skip-link', href: '#main' }, 'Skip to content'),
    h('div', { class: 'layout' },
      h('aside', { class: 'sidebar' },
        h('div', { class: 'sidebar__brand' },
          h('strong', null, 'Career Admin'),
          toggle),
        nav,
        h('div', { class: 'sidebar__footer' },
          h('span', { class: 'sidebar__user' }, session.user.email),
          button('Sign out', () => sb.auth.signOut(), 'btn--ghost btn--sm'))),
      h('main', { class: 'main', id: 'main', tabindex: '-1' })));
}

async function render() {
  if (!session) return;
  if (!document.getElementById('main')) renderShell();
  const route = parseRoute();
  document.querySelectorAll('.sidebar__nav a').forEach((a) => {
    if (a.dataset.view === route.view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const main = document.getElementById('main');
  main.replaceChildren(h('p', { class: 'loading' }, 'Loading...'));
  try {
    const mod = await VIEWS[route.view]();
    const view = await mod.default(route);
    main.replaceChildren(view);
    document.title = `${mod.title || 'Career Admin'} | Career Admin`;
  } catch (err) {
    console.error(err);
    main.replaceChildren(h('div', { class: 'notice notice--error', role: 'alert' },
      h('strong', null, 'Something went wrong. '), errorMessage(err)));
  }
}

async function boot(newSession) {
  session = newSession;
  if (!session) {
    renderLogin();
    return;
  }
  const { data: isAdmin, error } = await sb.rpc('is_admin');
  if (error && (error.code === 'PGRST106' || /schema must be one of/i.test(error.message))) {
    renderSetup();
    return;
  }
  if (error || !isAdmin) {
    renderMessage('Access denied', 'This account is not allowed to use the career admin.',
      button('Sign out', () => sb.auth.signOut(), 'btn--primary'));
    return;
  }
  try {
    await loadAll();
  } catch (err) {
    if (err instanceof SetupError) return renderSetup();
    toast(errorMessage(err), 'error');
  }
  renderShell();
  render();
}

function renderSetup() {
  renderMessage('One setup step left',
    'In the Supabase dashboard of the FAF project, open Project Settings > Data API and add "career" to Exposed schemas. Then reload this page.',
    h('div', { class: 'login__actions' },
      button('Reload', () => location.reload(), 'btn--primary'),
      button('Sign out', () => sb.auth.signOut(), 'btn--ghost')));
}

let lastUserId;
sb.auth.onAuthStateChange((event, newSession) => {
  const userId = newSession?.user?.id || null;
  if (event === 'TOKEN_REFRESHED' && userId === lastUserId) {
    session = newSession;
    return;
  }
  if (userId === lastUserId && event !== 'INITIAL_SESSION') return;
  lastUserId = userId;
  setTimeout(() => boot(newSession), 0);
});

window.addEventListener('hashchange', render);

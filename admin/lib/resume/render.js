import { esc } from '../ui.js';

const CSS_URL = '/admin/lib/resume/resume.css';

/** Full standalone HTML document for the preview iframe and for printing. */
export function renderDocument(model, title) {
  const body = model.template === 'creative' ? creative(model) : linear(model);
  return `<!doctype html>
<html lang="${model.lang === 'pt' ? 'pt-BR' : 'en'}">
<head>
<meta charset="utf-8">
<title>${esc(title || model.name)}</title>
<link rel="stylesheet" href="${CSS_URL}">
<style>@page { size: ${model.paper === 'Letter' ? 'letter' : 'A4'}; margin: ${model.paper === 'Letter' ? '0.6in 0.65in' : '15mm 16mm'}; }</style>
</head>
<body class="tpl-${esc(model.template)} paper-${model.paper === 'Letter' ? 'letter' : 'a4'}">
<main class="page">${body}</main>
</body>
</html>`;
}

const link = (l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`;

function header(m) {
  const contact = [m.location && esc(m.location), ...m.contact.map(link)].filter(Boolean);
  return `<header class="r-header">
  <h1 class="r-name">${esc(m.name)}</h1>
  ${m.headline ? `<p class="r-headline">${esc(m.headline)}</p>` : ''}
  ${contact.length ? `<p class="r-contact">${contact.join('<span class="sep" aria-hidden="true"> | </span>')}</p>` : ''}
</header>`;
}

const section = (key, label, inner) => (inner ? `<section class="r-section r-${key}"><h2>${esc(label)}</h2>${inner}</section>` : '');

const SECTIONS = {
  summary: (m) => section('summary', m.labels.summary, m.summary && `<p>${esc(m.summary)}</p>`),
  skills: (m) => section('skills', m.labels.skills, m.skills.length && `<p class="r-skills">${m.skills.map(esc).join(', ')}</p>`),
  experience: (m) => section('experience', m.labels.experience, m.experience.length && m.experience.map(experienceGroup).join('')),
  projects: (m) => section('projects', m.labels.projects, m.projects.length && m.projects.map((p) => project(p, m)).join('')),
  education: (m) => section('education', m.labels.education, m.education.length && m.education.map(educationItem).join('')),
  languages: (m) => section('languages', m.labels.languages, m.languages.length &&
    `<p>${m.languages.map((l) => `${esc(l.name)}${l.level ? ` (${esc(l.level)})` : ''}`).join(', ')}</p>`)
};

function roleBody(r) {
  return `${r.description ? `<p class="r-desc">${esc(r.description)}</p>` : ''}
    ${r.bullets.length ? `<ul>${r.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}`;
}

function experienceGroup(g) {
  if (g.roles.length === 1) {
    const r = g.roles[0];
    return `<article class="r-item">
  <div class="r-item__head">
    <h3><span class="r-role">${esc(r.title)}</span><span class="r-at"> · </span><span class="r-org">${esc(g.company)}</span></h3>
    <span class="r-date">${esc(r.range)}</span>
  </div>
  ${g.location ? `<p class="r-meta">${esc(g.location)}</p>` : ''}
  ${roleBody(r)}
</article>`;
  }
  return `<article class="r-item r-item--group">
  <div class="r-item__head">
    <h3><span class="r-org">${esc(g.company)}</span></h3>
    <span class="r-date">${esc(g.range)}</span>
  </div>
  ${g.location ? `<p class="r-meta">${esc(g.location)}</p>` : ''}
  ${g.roles.map((r) => `<div class="r-subrole">
    <div class="r-item__head"><h4>${esc(r.title)}</h4><span class="r-date">${esc(r.range)}</span></div>
    ${roleBody(r)}
  </div>`).join('')}
</article>`;
}

function project(p, m) {
  const meta = [p.role, p.company, p.platforms.length ? p.platforms.join(', ') : '', p.year].filter(Boolean).map(esc);
  return `<article class="r-item">
  <div class="r-item__head"><h3>${esc(p.name)}</h3>${p.links.length ? `<span class="r-links">${p.links.map(link).join(' · ')}</span>` : ''}</div>
  ${meta.length ? `<p class="r-meta">${meta.join(' · ')}</p>` : ''}
  ${p.description ? `<p class="r-desc">${esc(p.description)}</p>` : ''}
</article>`;
}

function educationItem(e) {
  const title = [e.degree, e.field].filter(Boolean).join(', ');
  return `<article class="r-item">
  <div class="r-item__head"><h3><span class="r-role">${esc(title)}</span></h3><span class="r-date">${esc(e.years)}</span></div>
  <p class="r-meta">${esc([e.institution, e.location].filter(Boolean).join(' · '))}</p>
</article>`;
}

/** ATS and Academic: one column, sections in model.order. */
function linear(m) {
  return header(m) + m.order.map((k) => SECTIONS[k](m)).join('');
}

/** Creative: side column for skills, languages and education; main column for the story. */
function creative(m) {
  const side = ['skills', 'education', 'languages'];
  const sideHtml = [
    m.skills.length ? section('skills', m.labels.skills, `<ul class="r-chips">${m.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`) : '',
    SECTIONS.education(m),
    SECTIONS.languages(m)
  ].join('');
  const mainHtml = m.order.filter((k) => !side.includes(k)).map((k) => SECTIONS[k](m)).join('');
  return `${header(m)}<div class="r-columns"><div class="r-main">${mainHtml}</div>${sideHtml ? `<aside class="r-side">${sideHtml}</aside>` : ''}</div>`;
}

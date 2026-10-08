import { OWNER_NAME_FILE } from '../../config.js';

export const SECTION_KEYS = ['summary', 'skills', 'experience', 'projects', 'education', 'languages'];

export const DEFAULT_LIMITS = { skills: 12, projects: 3 };
const AUTO_SCORE = 6;
const AUTO_SCORE_RELEVANT = 3;

const LABELS = {
  en: {
    summary: 'Professional Summary', skills: 'Skills', experience: 'Professional Experience',
    teaching: 'Teaching & Professional Experience', projects: 'Selected Projects', education: 'Education',
    languages: 'Languages', present: 'Present', platforms: 'Platforms'
  },
  pt: {
    summary: 'Resumo Profissional', skills: 'Competências', experience: 'Experiência Profissional',
    teaching: 'Experiência Docente e Profissional', projects: 'Projetos Selecionados', education: 'Formação Acadêmica',
    languages: 'Idiomas', present: 'Atual', platforms: 'Plataformas'
  }
};

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
};

const LINK_LABELS = { portfolio: 'Portfolio', steam: 'Steam', github: 'GitHub', itch: 'itch.io', other: 'Link' };

/** A fresh generator config for a profile. Manual choices are stored as overrides on top of it. */
export function defaultConfig(d, profile) {
  return {
    profileId: profile?.id || null,
    language: profile?.default_language || 'en',
    template: profile?.default_template || 'ats',
    paper: d.settings?.default_paper || 'A4',
    includeAllRelevant: false,
    sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, k !== 'languages' || (d.settings?.languages || []).length > 0])),
    limits: { ...DEFAULT_LIMITS },
    experiences: {},
    projects: {},
    education: {},
    skills: {}
  };
}

/** Fills in keys missing from older saved configs (history, presets). */
export function normalizeConfig(d, config) {
  const profile = d.profiles.find((p) => p.id === config?.profileId);
  const base = defaultConfig(d, profile);
  return {
    ...base, ...config,
    sections: { ...base.sections, ...(config?.sections || {}) },
    limits: { ...base.limits, ...(config?.limits || {}) },
    experiences: { ...(config?.experiences || {}) },
    projects: { ...(config?.projects || {}) },
    education: { ...(config?.education || {}) },
    skills: { ...(config?.skills || {}) }
  };
}

export function filename(profile, language) {
  const part = String(profile?.name_en || 'General').split(' / ')[0]
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${OWNER_NAME_FILE}_${part}_${language === 'pt' ? 'CV' : 'Resume'}.pdf`;
}

export function formatMonth(date, lang) {
  if (!date) return '';
  const [y, m] = String(date).split('-');
  return `${MONTHS[lang][Number(m) - 1]} ${y}`;
}

function range(start, end, isCurrent, lang) {
  const to = isCurrent ? LABELS[lang].present : formatMonth(end, lang);
  return to ? `${formatMonth(start, lang)} - ${to}` : formatMonth(start, lang);
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9à-ú]/g, '');

export function compose(d, rawConfig) {
  const config = normalizeConfig(d, rawConfig);
  const lang = config.language === 'pt' ? 'pt' : 'en';
  const L = LABELS[lang];
  const profile = d.profiles.find((p) => p.id === config.profileId) || null;
  const errors = [];
  const warnings = [];
  const fallbacks = new Set();
  const threshold = config.includeAllRelevant ? AUTO_SCORE_RELEVANT : AUTO_SCORE;

  /** Picks the field in the resume language; falls back to English and records it. */
  const pick = (row, base, what) => {
    const value = row?.[`${base}_${lang}`];
    if (value && String(value).trim()) return String(value).trim();
    const en = row?.[`${base}_en`];
    if (lang === 'pt' && en && String(en).trim()) {
      fallbacks.add(what);
      return String(en).trim();
    }
    return '';
  };

  const weights = new Map(
    d.profile_tag_weights.filter((w) => w.profile_id === profile?.id).map((w) => [w.tag_id, w.weight]));
  const tagIdsOf = (join, key, id) => d[join].filter((r) => r[key] === id).map((r) => r.tag_id);
  const scoreOf = (tagIds) => tagIds.reduce((s, t) => s + (weights.get(t) || 0), 0);
  const ruleOf = (table, key, id) => d[table].find((r) => r.profile_id === profile?.id && r[key] === id);

  // Experiences ---------------------------------------------------------------
  const expCandidates = d.experiences.map((e) => {
    const rule = ruleOf('profile_experiences', 'experience_id', e.id);
    const score = scoreOf(tagIdsOf('experience_tags', 'experience_id', e.id));
    let auto = false;
    let reason;
    if (e.visibility === 'hidden') reason = 'Hidden';
    else if (rule?.include === 'exclude') reason = 'Excluded by profile';
    else if (rule?.include === 'include') { auto = true; reason = 'Included by profile'; }
    else if (e.visibility === 'manual_only') reason = 'Manual only';
    else if (score >= threshold) { auto = true; reason = `Matches profile (score ${score})`; }
    else reason = score ? `Low match (score ${score})` : 'No matching skills';
    const manual = config.experiences[e.id];
    const selected = e.visibility !== 'hidden' && (manual ?? auto);
    return { item: e, rule, score, auto, manual, selected, reason, disabled: e.visibility === 'hidden' };
  });

  const chosenExp = expCandidates.filter((c) => c.selected)
    .sort((a, b) => (b.item.is_current - a.item.is_current) || String(b.item.start_date).localeCompare(String(a.item.start_date)));

  const experienceGroups = [];
  let unverified = 0;
  for (const c of chosenExp) {
    const e = c.item;
    const important = e.priority >= 4 || c.score >= 10 || c.rule?.include === 'include';
    const maxBullets = important ? 4 : 2;
    const focus = profile?.focus;
    const all = d.experience_bullets.filter((b) => b.experience_id === e.id);
    const matching = all.filter((b) => focus && (b.focus || []).includes(focus));
    const general = all.filter((b) => !(b.focus || []).length);
    const seen = new Set();
    const picked = [];
    for (const b of [...matching, ...general]) {
      if (picked.length >= maxBullets) break;
      const text = pick(b, 'text', `Bullet in ${e.company}`);
      const key = norm(text);
      if (!text || seen.has(key)) continue;
      seen.add(key);
      if (!b.verified) unverified++;
      picked.push({ text, sort: b.sort });
    }
    const bullets = picked.sort((a, b) => a.sort - b.sort).map((b) => b.text);

    const override = pick(c.rule, 'description', `Profile description for ${e.company}`);
    const focusEntry = focus ? e.focus_descriptions?.[focus] : null;
    const focusText = focusEntry?.status === 'ok' ? (focusEntry[lang] || (lang === 'pt' && focusEntry.en ? (fallbacks.add(`Focus description for ${e.company}`), focusEntry.en) : '')) : '';
    const description = override || focusText || (bullets.length ? '' : pick(e, 'description', `Description for ${e.company}`));

    if (e.review_status !== 'ok') warnings.push(`"${e.role_en} · ${e.company}" is marked as ${e.review_status === 'needs_content' ? 'needing content' : 'needing review'}.`);
    if (!description && !bullets.length) warnings.push(`"${e.role_en} · ${e.company}" has no description or bullets in this language.`);

    const role = {
      id: e.id,
      title: pick(e, 'role', `Role at ${e.company}`) || e.role_en,
      range: range(e.start_date, e.end_date, e.is_current, lang),
      employmentType: e.employment_type || '',
      description,
      bullets,
      start: e.start_date,
      end: e.is_current ? null : e.end_date,
      isCurrent: e.is_current
    };
    const groupKey = e.group_key || e.company;
    const existing = experienceGroups.find((g) => g.key === groupKey);
    if (existing) {
      existing.roles.push(role);
    } else {
      experienceGroups.push({ key: groupKey, company: e.company, location: e.location || '', url: e.company_url || '', roles: [role] });
    }
  }
  for (const g of experienceGroups) {
    if (g.roles.length > 1) {
      const starts = g.roles.map((r) => r.start).sort();
      const current = g.roles.some((r) => r.isCurrent);
      const ends = g.roles.map((r) => r.end).filter(Boolean).sort();
      g.range = range(starts[0], ends.at(-1), current, lang);
    } else {
      g.range = g.roles[0].range;
    }
  }
  if (unverified) warnings.push(`${unverified} bullet(s) used are not marked as verified.`);

  // Projects ----------------------------------------------------------------
  const projCandidates = d.projects.map((p) => {
    const rule = ruleOf('profile_projects', 'project_id', p.id);
    const score = scoreOf(tagIdsOf('project_tags', 'project_id', p.id));
    let auto = false;
    let reason;
    if (p.visibility === 'hidden') reason = 'Hidden';
    else if (rule?.include === 'exclude') reason = 'Excluded by profile';
    else if (rule?.include === 'include') { auto = true; reason = 'Included by profile'; }
    else if (p.visibility === 'manual_only') reason = 'Manual only';
    else if (score >= threshold) { auto = true; reason = `Matches profile (score ${score})`; }
    else reason = score ? `Low match (score ${score})` : 'No matching skills';
    return { item: p, rule, score, auto, manual: config.projects[p.id], reason, disabled: p.visibility === 'hidden' };
  });
  const autoProjects = projCandidates.filter((c) => c.auto && c.manual === undefined)
    .sort((a, b) => ((a.rule?.rank ?? 0) - (b.rule?.rank ?? 0)) || (b.score - a.score) || (b.item.priority - a.item.priority));
  const pinned = autoProjects.filter((c) => c.rule?.include === 'include');
  const scored = autoProjects.filter((c) => c.rule?.include !== 'include');
  const autoKeep = new Set([...pinned, ...scored.slice(0, Math.max(0, config.limits.projects - pinned.length))].map((c) => c.item.id));
  for (const c of projCandidates) {
    if (c.auto && c.manual === undefined && !autoKeep.has(c.item.id)) { c.auto = false; c.reason = 'Over the project limit'; }
    c.selected = !c.disabled && (c.manual ?? c.auto);
  }
  const projects = projCandidates.filter((c) => c.selected)
    .sort((a, b) => ((a.rule?.rank ?? 0) - (b.rule?.rank ?? 0)) || (b.score - a.score) || ((b.item.year || 0) - (a.item.year || 0)))
    .map((c) => {
      const p = c.item;
      if (p.review_status !== 'ok') warnings.push(`Project "${p.name}" is marked as needing review.`);
      return {
        id: p.id,
        name: p.name,
        role: pick(p, 'role', `Role in ${p.name}`),
        year: p.year || '',
        company: p.company || '',
        platforms: p.platforms || [],
        description: pick(c.rule, 'description', `Profile description for ${p.name}`)
          || pick(p, 'resume_description', `Description for ${p.name}`)
          || pick(p, 'description', `Description for ${p.name}`),
        links: Object.entries(p.links || {}).filter(([, url]) => url).map(([k, url]) => ({ label: LINK_LABELS[k] || k, url }))
      };
    });

  // Education ---------------------------------------------------------------
  const eduCandidates = d.education.map((e) => {
    const auto = e.visibility === 'default';
    const manual = config.education[e.id];
    const disabled = e.visibility === 'hidden';
    return { item: e, auto, manual, disabled, selected: !disabled && (manual ?? auto),
      reason: disabled ? 'Hidden' : e.visibility === 'manual_only' ? 'Manual only' : 'Included' };
  });
  const education = eduCandidates.filter((c) => c.selected).map((c) => {
    const e = c.item;
    if (e.review_status !== 'ok') warnings.push(`Education "${e.degree_en}" is marked as needing review.`);
    return {
      id: e.id,
      degree: pick(e, 'degree', `Degree at ${e.institution}`),
      field: pick(e, 'field', `Field at ${e.institution}`),
      institution: e.institution,
      location: e.location || '',
      years: [e.start_year, e.end_year].filter(Boolean).join(' - ')
    };
  });

  // Skills ------------------------------------------------------------------
  const visibleExp = new Set(d.experiences.filter((e) => e.visibility !== 'hidden').map((e) => e.id));
  const visibleProj = new Set(d.projects.filter((p) => p.visibility !== 'hidden').map((p) => p.id));
  const usage = new Map();
  for (const r of d.experience_tags) if (visibleExp.has(r.experience_id)) usage.set(r.tag_id, (usage.get(r.tag_id) || 0) + 1);
  for (const r of d.project_tags) if (visibleProj.has(r.project_id)) usage.set(r.tag_id, (usage.get(r.tag_id) || 0) + 1);

  const skillCandidates = d.tags
    .filter((t) => weights.has(t.id) || usage.has(t.id) || config.skills[t.id] !== undefined)
    .map((t) => ({ item: t, weight: weights.get(t.id) || 0, uses: usage.get(t.id) || 0, supported: usage.has(t.id), manual: config.skills[t.id] }))
    .sort((a, b) => (b.weight - a.weight) || (b.uses - a.uses) || a.item.name_en.localeCompare(b.item.name_en));
  const hasWeights = weights.size > 0;
  let autoCount = 0;
  for (const c of skillCandidates) {
    const eligible = c.supported && (hasWeights ? c.weight > 0 : true);
    c.auto = eligible && autoCount < config.limits.skills;
    if (c.auto) autoCount++;
    c.reason = !c.supported ? 'Not backed by any experience or project'
      : hasWeights && !c.weight ? 'Not weighted in this profile'
        : c.auto ? `Weight ${c.weight}` : 'Over the skill limit';
    c.selected = c.manual ?? c.auto;
  }
  const skills = skillCandidates.filter((c) => c.selected).map((c) => pick(c.item, 'name', `Skill ${c.item.name_en}`) || c.item.name_en);
  const unsupported = skillCandidates.filter((c) => c.selected && !c.supported);
  if (unsupported.length) warnings.push(`Skills not backed by any experience or project: ${unsupported.map((c) => c.item.name_en).join(', ')}.`);

  // Header ------------------------------------------------------------------
  const s = d.settings || {};
  const contact = [
    s.email && { label: s.email, url: `mailto:${s.email}` },
    s.phone && { label: s.phone, url: `tel:${s.phone.replace(/[^+\d]/g, '')}` },
    s.linkedin_url && { label: prettyUrl(s.linkedin_url), url: s.linkedin_url },
    s.portfolio_url && { label: prettyUrl(s.portfolio_url), url: s.portfolio_url },
    s.github_url && { label: prettyUrl(s.github_url), url: s.github_url }
  ].filter(Boolean);

  const headline = pick(profile, 'headline', 'Headline');
  const summary = pick(profile, 'summary', 'Summary');
  const languages = (s.languages || [])
    .map((l) => ({ name: (lang === 'pt' ? l.name_pt : l.name_en) || l.name_en, level: (lang === 'pt' ? l.level_pt : l.level_en) || l.level_en }))
    .filter((l) => l.name);

  // Validation --------------------------------------------------------------
  if (!profile) errors.push('Choose a career profile.');
  else {
    if (!headline) errors.push('This profile has no headline. Add one in Career Profiles.');
    if (config.sections.summary && !summary) errors.push('This profile has no professional summary. Add one in Career Profiles or turn off the Summary section.');
    if (profile.review_status === 'needs_review') warnings.push('The profile headline and summary are not reviewed yet.');
  }
  if (config.sections.experience && !experienceGroups.length) errors.push('No experience is selected.');
  if (config.sections.projects && !projects.length) warnings.push('No projects are selected, so the Projects section is hidden.');
  if (config.sections.skills && !skills.length) warnings.push('No skills are selected, so the Skills section is hidden.');
  if (fallbacks.size) warnings.push(`No Portuguese version yet, English used for: ${[...fallbacks].slice(0, 6).join('; ')}${fallbacks.size > 6 ? '…' : ''}.`);

  const isAcademic = config.template === 'academic';
  const model = {
    lang,
    template: config.template,
    paper: config.paper === 'Letter' ? 'Letter' : 'A4',
    labels: { ...L, experience: isAcademic && profile?.focus === 'education' ? L.teaching : L.experience },
    name: s.full_name || '',
    location: (lang === 'pt' ? s.location_pt : s.location_en) || s.location_en || '',
    contact,
    headline,
    summary: config.sections.summary ? summary : '',
    skills: config.sections.skills ? skills : [],
    experience: config.sections.experience ? experienceGroups : [],
    projects: config.sections.projects ? projects : [],
    education: config.sections.education ? education : [],
    languages: config.sections.languages ? languages : [],
    order: isAcademic
      ? ['summary', 'experience', 'education', 'projects', 'skills', 'languages']
      : ['summary', 'skills', 'experience', 'projects', 'education', 'languages']
  };

  return {
    config,
    profile,
    model,
    filename: filename(profile, lang),
    candidates: { experiences: expCandidates, projects: projCandidates, education: eduCandidates, skills: skillCandidates },
    errors,
    warnings: [...new Set(warnings)]
  };
}

function prettyUrl(url) {
  return String(url).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

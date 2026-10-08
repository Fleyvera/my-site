import { sb } from './supabase.js';

const TABLES = [
  'settings', 'tags', 'experiences', 'experience_bullets', 'experience_tags', 'projects', 'project_tags',
  'experience_projects', 'education', 'profiles', 'profile_tag_weights', 'profile_experiences',
  'profile_projects', 'resume_presets'
];

const HISTORY_LIST_COLUMNS = 'id,title,profile_id,profile_name,language,template,paper,filename,config,created_at';

export const cache = { data: null };

export class SetupError extends Error {}

function check(error) {
  if (!error) return;
  if (error.code === 'PGRST106' || /schema must be one of/i.test(error.message || '')) {
    throw new SetupError('The "career" schema is not exposed by the API yet.');
  }
  throw error;
}

export async function loadAll() {
  const results = await Promise.all(TABLES.map((t) => sb.from(t).select('*')));
  const data = {};
  results.forEach(({ data: rows, error }, i) => {
    check(error);
    data[TABLES[i]] = rows || [];
  });
  data.settings = data.settings[0] || null;
  sortData(data);
  cache.data = data;
  return data;
}

function sortData(d) {
  const bySortThenDate = (a, b) => (a.sort - b.sort) || String(b.start_date || '').localeCompare(String(a.start_date || ''));
  d.experiences.sort(bySortThenDate);
  d.projects.sort((a, b) => (a.sort - b.sort) || (b.year || 0) - (a.year || 0));
  d.education.sort((a, b) => (a.sort - b.sort) || (b.end_year || 0) - (a.end_year || 0));
  d.profiles.sort((a, b) => a.sort - b.sort);
  d.tags.sort((a, b) => a.name_en.localeCompare(b.name_en));
  d.experience_bullets.sort((a, b) => a.sort - b.sort);
  d.resume_presets.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
}

export async function data() {
  return cache.data || loadAll();
}

export async function insert(table, row) {
  const { data: rows, error } = await sb.from(table).insert(row).select();
  check(error);
  if (cache.data && Array.isArray(cache.data[table])) cache.data[table].push(...rows);
  return rows[0];
}

export async function update(table, match, patch) {
  const { data: rows, error } = await sb.from(table).update(patch).match(match).select();
  check(error);
  if (cache.data) {
    if (table === 'settings') cache.data.settings = rows[0];
    else if (Array.isArray(cache.data[table])) {
      for (const row of cache.data[table]) {
        if (Object.entries(match).every(([k, v]) => row[k] === v)) Object.assign(row, patch, rows[0] || {});
      }
    }
  }
  return rows[0];
}

export async function upsert(table, row, onConflict) {
  const { data: rows, error } = await sb.from(table).upsert(row, { onConflict }).select();
  check(error);
  if (cache.data && Array.isArray(cache.data[table])) {
    const keys = onConflict.split(',');
    const list = cache.data[table];
    const idx = list.findIndex((r) => keys.every((k) => r[k] === row[k]));
    if (idx >= 0) list[idx] = rows[0];
    else list.push(rows[0]);
  }
  return rows[0];
}

export async function remove(table, match) {
  const { error } = await sb.from(table).delete().match(match);
  check(error);
  if (CASCADING.has(table)) cache.data = null;
  else if (cache.data && Array.isArray(cache.data[table])) {
    cache.data[table] = cache.data[table].filter((r) => !Object.entries(match).every(([k, v]) => r[k] === v));
  }
}

// Deleting these cascades to join tables in the database, so the cache is reloaded instead of patched.
const CASCADING = new Set(['experiences', 'projects', 'tags', 'profiles', 'education']);

export async function listHistory() {
  const { data: rows, error } = await sb.from('resume_history').select(HISTORY_LIST_COLUMNS)
    .order('created_at', { ascending: false });
  check(error);
  return rows;
}

export async function getHistory(id) {
  const { data: row, error } = await sb.from('resume_history').select('*').eq('id', id).single();
  check(error);
  return row;
}

export async function saveHistory(row) {
  const { data: rows, error } = await sb.from('resume_history').insert(row).select(HISTORY_LIST_COLUMNS);
  check(error);
  return rows[0];
}

export async function deleteHistory(id) {
  const { error } = await sb.from('resume_history').delete().eq('id', id);
  check(error);
}

export function tagsFor(d, joinTable, key, id) {
  const ids = new Set(d[joinTable].filter((r) => r[key] === id).map((r) => r.tag_id));
  return d.tags.filter((t) => ids.has(t.id));
}

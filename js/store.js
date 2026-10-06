/* ============================================================
   State store: the single source of truth for reports.
   - Persists to localStorage (falls back to memory if blocked)
   - Pure query/filter functions (no DOM in this file)
   - Tiny pub/sub so views re-render when data changes
   ============================================================ */
window.HNY = window.HNY || {};

(function (HNY) {
  'use strict';

  const { BUILDINGS, CATEGORIES, SEED, ALIASES = {} } = HNY.DATA;
  const KEY = 'hny_items_v4';
  const CLAIMS_KEY = 'hny_claims_v1';
  const MAP_KEY = 'hny_map_version';
  const MAP_VERSION = 3;
  const HOUR = 3600 * 1000;

  const byBuilding = new Map(BUILDINGS.map((b) => [b.id, b]));
  // Reports saved with an older map's building ids still resolve to a building
  Object.entries(ALIASES).forEach(([old, id]) => { if (!byBuilding.has(old)) byBuilding.set(old, byBuilding.get(id)); });
  const byCategory = new Map(CATEGORIES.map((c) => [c.id, c]));
  const listeners = new Set();
  let memory = null; // used when localStorage isn't available

  /* ---------- persistence ---------- */
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return memory && memory[key]; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { memory = memory || {}; memory[key] = value; }
  }

  /* Point inside a building for a new pin: its label anchor, nudged so pins don't stack */
  function buildingPoint(b, seed = 0) {
    const spread = Math.min(b.box.w, b.box.h) * 0.22;
    const a = (seed * 137.5) * Math.PI / 180;
    const k = seed === 0 ? 0 : 1;
    return { x: Math.round(b.ax + Math.cos(a) * spread * k), y: Math.round(b.ay - 30 + Math.sin(a) * spread * k) };
  }

  function makeRef() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = 'HNY-';
    for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function seedItems() {
    const now = Date.now();
    const perBuilding = {};
    return SEED.map((s, i) => {
      const b = byBuilding.get(s.bldg);
      perBuilding[s.bldg] = (perBuilding[s.bldg] || 0) + 1;
      const pt = buildingPoint(b, perBuilding[s.bldg] - 1);
      const when = now - s.hoursAgo * HOUR;
      return {
        id: `s${i + 1}`,
        ref: `HNY-${String(1000 + i * 37).slice(-4)}${'ABCDEFGHJK'[i % 10]}`,
        title: s.title,
        cat: s.cat,
        status: s.status,              // 'lost' | 'found'
        state: s.state || 'open',      // 'open' | 'claim-requested' | 'returned'
        bldg: s.bldg,
        spot: s.spot,
        x: pt.x,
        y: pt.y,
        desc: s.desc,
        happenedAt: when - 30 * 60 * 1000,
        createdAt: when,
        reporter: s.by,
        photo: s.photo || null,
        gallery: s.gallery || [],
        avatar: s.avatar || null,
        owner: s.owner || null,
        sample: true,
      };
    });
  }

  // Sample claim requests for seeded items marked "claim pending"
  const seedClaims = (list) => list.filter((i) => i.state === 'claim-requested').map((i, k) => ({
    itemId: i.id, name: ['Paolo Mendoza', 'Rica Santos'][k % 2], email: 'sample.claimant@hau.edu.ph',
    proof: 'It has a small scratch on the back and my library card is in the left pocket.', at: Date.now() - 3600 * 1000 * (k + 1), sample: true,
  }));

  // A sample lead on the demo account's lost wallet, so Messages isn't empty
  const seedMessages = (list) => list.filter((i) => i.owner && i.status === 'lost' && i.state === 'open').slice(0, 1).map((i) => ({
    id: 'mseed1', at: Date.now() - 2 * 3600 * 1000, kind: 'info', itemId: i.id, name: 'Paolo Mendoza', email: 'sample.finder@hau.edu.ph',
    message: 'I think I saw a brown wallet like this on the chapel steps this morning. Try asking the guard at Gate 1.', from: '', sample: true,
  }));

  let items = read(KEY);
  if (!Array.isArray(items) || !items.length) {
    items = seedItems();
    write(KEY, items);
    write(CLAIMS_KEY, seedClaims(items));
    write('hny_messages_v1', seedMessages(items));
    write(MAP_KEY, MAP_VERSION);
  } else if (read(MAP_KEY) !== MAP_VERSION) {
    // The campus map was redrawn: move every saved pin onto its building's new position
    const per = {};
    items = items.map((it) => {
      const b = byBuilding.get(it.bldg);
      if (!b) return it;
      per[b.id] = (per[b.id] || 0) + 1;
      return { ...it, bldg: b.id, ...buildingPoint(b, per[b.id] - 1) };
    });
    write(KEY, items);
    write(MAP_KEY, MAP_VERSION);
  }

  function emit() { listeners.forEach((fn) => fn(items)); }
  // Another tab added or changed a report: reload and re-render
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { const next = read(KEY); if (Array.isArray(next)) { items = next; emit(); } }
    else if (e.key && e.key.startsWith('hny_')) emit();
  });

  /* ---------- queries ---------- */
  const DEFAULT_FILTERS = Object.freeze({
    q: '', statuses: ['lost', 'found'], cats: [], bldg: '', range: 'all', sort: 'newest', showReturned: false,
  });

  function normalise(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function matchesText(item, q) {
    if (!q) return true;
    const b = byBuilding.get(item.bldg);
    const hay = normalise([item.title, item.desc, item.spot, item.ref, b && b.name, b && b.code, byCategory.get(item.cat)?.label].join(' '));
    return normalise(q).split(/\s+/).filter(Boolean).every((word) => hay.includes(word));
  }

  function query(f = {}) {
    const flt = { ...DEFAULT_FILTERS, ...f };
    const now = Date.now();
    const minTime = flt.range === '24h' ? now - 24 * HOUR : flt.range === '7d' ? now - 7 * 24 * HOUR : 0;
    const out = items.filter((it) =>
      flt.statuses.includes(it.status)
      && (!flt.cats.length || flt.cats.includes(it.cat))
      && (!flt.bldg || it.bldg === flt.bldg)
      && it.createdAt >= minTime
      && (flt.showReturned || it.state !== 'returned')
      && matchesText(it, flt.q));
    out.sort((a, b) => (flt.sort === 'oldest' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));
    return out;
  }

  function stats() {
    const now = Date.now();
    const open = items.filter((i) => i.state !== 'returned');
    const week = items.filter((i) => now - i.createdAt <= 7 * 24 * HOUR);
    const areaCounts = {};
    open.forEach((i) => { areaCounts[i.bldg] = (areaCounts[i.bldg] || 0) + 1; });
    const topAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => byBuilding.get(id));
    return {
      total: items.length,
      open: open.length,
      lost: open.filter((i) => i.status === 'lost').length,
      found: open.filter((i) => i.status === 'found').length,
      returned: items.filter((i) => i.state === 'returned').length,
      thisWeek: week.length,
      topAreas,
    };
  }

  function countBy(field, list = items.filter((i) => i.state !== 'returned')) {
    const out = {};
    list.forEach((i) => { out[i[field]] = (out[i[field]] || 0) + 1; });
    return out;
  }

  /* ---------- mutations ---------- */
  function add(data) {
    const now = Date.now();
    const item = {
      id: `u${now.toString(36)}`,
      ref: makeRef(),
      state: 'open',
      createdAt: now,
      sample: false,
      mine: true,
      ...data,
    };
    items = [item, ...items];
    write(KEY, items);
    emit();
    return item;
  }

  function update(id, patch) {
    items = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    write(KEY, items);
    emit();
    return get(id);
  }

  /* Claims only apply to open "found" items, once per person per item */
  function addClaim(itemId, claim) {
    const it = get(itemId);
    if (!it) return { ok: false, msg: 'This report no longer exists.' };
    if (it.status !== 'found') return { ok: false, msg: 'Only found items can be claimed.' };
    if (it.state === 'returned') return { ok: false, msg: 'This item has already been returned to its owner.' };
    const email = String(claim.email || '').trim().toLowerCase();
    if (it.owner && it.owner === email) return { ok: false, msg: 'You reported this item, so you can’t claim it.' };
    const claims = read(CLAIMS_KEY) || [];
    if (claims.some((c) => c.itemId === itemId && String(c.email).toLowerCase() === email)) return { ok: false, msg: 'You’ve already asked to claim this item. The Security Office will check it.' };
    claims.push({ itemId, ...claim, email, at: Date.now() });
    write(CLAIMS_KEY, claims);
    return { ok: true, item: update(itemId, { state: 'claim-requested' }) };
  }

  function remove(id) {
    items = items.filter((i) => i.id !== id);
    write(KEY, items);
    emit();
  }

  /* Small append-only collections: contact messages, stories, saved items */
  const COLL = { messages: 'hny_messages_v1', stories: 'hny_stories_v1', saved: 'hny_saved_v1' };
  function list(name) { return read(COLL[name]) || []; }
  function push(name, obj) {
    const all = list(name);
    const rec = { id: `${name[0]}${Date.now().toString(36)}`, at: Date.now(), ...obj };
    all.unshift(rec);
    write(COLL[name], all);
    emit();
    return rec;
  }
  function setList(name, arr) { write(COLL[name], arr); emit(); }
  const claims = () => read(CLAIMS_KEY) || [];

  function get(id) { return items.find((i) => i.id === id) || null; }

  function resetDemo() {
    items = seedItems();
    write(KEY, items);
    write(CLAIMS_KEY, seedClaims(items));
    Object.values(COLL).forEach((k) => write(k, []));
    write(COLL.messages, seedMessages(items));
    emit();
  }

  /* Building search, ranked: code > name > office. Returns [{ b, office }] where office is the matching office */
  HNY.searchBuildings = function (q) {
    const n = normalise(q).trim();
    if (!n) return [];
    return BUILDINGS.map((b) => {
      const code = normalise(b.code);
      const name = normalise(b.name);
      const office = b.offices.find((o) => normalise(o).includes(n)) || '';
      let score = 0;
      if (code === n) score = 5;
      else if (code.startsWith(n)) score = 4;
      else if (name.startsWith(n)) score = 3;
      else if (name.includes(n)) score = 2;
      else if (office) score = normalise(office).startsWith(n) ? 1.5 : 1;
      return { b, office: score <= 1.5 ? office : '', score };
    }).filter((x) => x.score > 0).sort((a, z) => z.score - a.score || a.b.name.localeCompare(z.b.name));
  };

  HNY.store = {
    DEFAULT_FILTERS,
    all: () => items.slice(),
    get,
    query,
    stats,
    countBy,
    add,
    update,
    addClaim,
    remove,
    list,
    push,
    setList,
    claims,
    resetDemo,
    building: (id) => byBuilding.get(id) || null,
    category: (id) => byCategory.get(id) || null,
    buildings: () => BUILDINGS.slice(),
    categories: () => CATEGORIES.slice(),
    buildingPoint,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}(window.HNY));

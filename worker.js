// ─────────────────────────────────────────────
//  Accountable — Cloudflare Worker
//  GET  /                   → serve app HTML
//  GET  /api/shared/:code   → fetch shared list
//  POST /api/shared/:code   → save shared list
// ─────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/shared/')) {
      const code = path.split('/api/shared/')[1]?.toUpperCase().trim();
      if (!code || code.length < 4) return json({ error: 'Invalid code' }, 400);

      if (request.method === 'GET') {
        const data = await env.LISTS.get('list_' + code);
        if (!data) return json({ error: 'Not found' }, 404);
        return json(JSON.parse(data));
      }
      if (request.method === 'POST') {
        const body = await request.json();
        await env.LISTS.put('list_' + code, JSON.stringify(body), { expirationTtl: 60 * 60 * 24 * 90 });
        return json({ ok: true });
      }
      return json({ error: 'Method not allowed' }, 405);
    }

    return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
  <meta name="apple-mobile-web-app-title" content="Accountable"/>
  <meta name="theme-color" content="#f2f2f7"/>
  <title>Accountable</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body { height: 100%; }
    body { font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif; background: #f2f2f7; color: #1c1c1e; overflow: hidden; -webkit-font-smoothing: antialiased; }

    :root {
      --bg: #f2f2f7; --bg2: #e5e5ea; --surface: #fff;
      --sep: rgba(60,60,67,0.12);
      --label: #1c1c1e; --label3: rgba(60,60,67,0.6); --label4: rgba(60,60,67,0.25);
      --blue: #007aff; --blue-soft: rgba(0,122,255,0.1);
      --green: #34c759;
      --red: #ff3b30; --red-soft: rgba(255,59,48,0.1);
      --purple: #af52de; --purple-soft: rgba(175,82,222,0.1);
      --r: 14px; --shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    #app { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
    .screen { display: none; flex-direction: column; flex: 1; overflow: hidden; }
    .screen.active { display: flex; }

    /* Nav */
    .nav {
      background: rgba(242,242,247,0.92);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      padding: env(safe-area-inset-top,44px) 16px 12px;
      border-bottom: 0.5px solid var(--sep);
      position: relative; z-index: 10; flex-shrink: 0;
    }
    .nav.white { background: rgba(255,255,255,0.92); }
    .nav-row { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; }
    .nav-large { font-size: 34px; font-weight: 700; letter-spacing: -0.5px; }
    .nav-center { font-size: 17px; font-weight: 600; text-align: center; letter-spacing: -0.3px; }
    .nav-actions { position: absolute; right: 16px; bottom: 11px; display: flex; gap: 4px; }
    .nav-back { position: absolute; left: 10px; bottom: 9px; display: flex; align-items: center; gap: 3px; color: var(--blue); background: none; border: none; cursor: pointer; padding: 6px 8px; font-size: 17px; font-family: inherit; }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--blue); padding: 6px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
    .icon-btn:active { background: var(--bg2); }
    .txt-btn { background: none; border: none; cursor: pointer; color: var(--blue); font-size: 17px; font-family: inherit; padding: 5px 2px; }
    .txt-btn.purple { color: var(--purple); }

    /* Scroll */
    .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: env(safe-area-inset-bottom,20px); }
    .scroll::-webkit-scrollbar { display: none; }

    /* Section header */
    .sh { font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px; color: var(--label3); padding: 22px 20px 6px; }

    /* Inset group */
    .group { background: var(--surface); border-radius: var(--r); margin: 0 16px 8px; overflow: hidden; box-shadow: var(--shadow); }
    .row { display: flex; align-items: center; padding: 13px 16px; gap: 12px; border-bottom: 0.5px solid var(--sep); cursor: pointer; }
    .row:last-child { border-bottom: none; }
    .row:active { background: var(--bg2); }
    .list-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .rc { flex: 1; min-width: 0; }
    .rt { font-size: 17px; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rs { font-size: 13px; color: var(--label3); margin-top: 1px; }
    .ra { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .badge { background: var(--bg2); color: var(--label3); font-size: 13px; font-weight: 500; padding: 2px 9px; border-radius: 20px; }
    .badge.done { background: var(--blue); color: #fff; }
    .chev { color: var(--label4); display: flex; }

    /* Todo item */
    .ti { display: flex; align-items: center; padding: 11px 16px; gap: 13px; border-bottom: 0.5px solid var(--sep); background: var(--surface); }
    .ti:last-child { border-bottom: none; }
    .ti:active { background: var(--bg2); }
    .check { width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--bg2); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
    .check.done { background: var(--green); border-color: var(--green); }
    .check svg { display: none; }
    .check.done svg { display: block; }
    .tt { flex: 1; font-size: 17px; letter-spacing: -0.2px; line-height: 1.35; }
    .tt.done { color: var(--label3); text-decoration: line-through; }
    .pill { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; border: 1.5px solid rgba(175,82,222,0.3); cursor: pointer; flex-shrink: 0; font-family: inherit; background: transparent; color: var(--purple); transition: all 0.15s; }
    .pill.on { background: var(--purple); color: #fff; border-color: var(--purple); }
    .del { background: none; border: none; cursor: pointer; color: var(--label4); padding: 2px; display: flex; align-items: center; }
    .del:active { color: var(--red); }

    /* Progress */
    .prog { padding: 14px 20px 8px; }
    .prog-lbl { font-size: 13px; color: var(--label3); margin-bottom: 6px; }
    .prog-track { height: 4px; background: var(--bg2); border-radius: 4px; overflow: hidden; }
    .prog-fill { height: 100%; background: var(--green); border-radius: 4px; transition: width 0.4s cubic-bezier(0.4,0,0.2,1); }

    /* Input bar */
    .input-bar {
      background: rgba(255,255,255,0.95);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border-top: 0.5px solid var(--sep);
      padding: 10px 16px calc(env(safe-area-inset-bottom,0px) + 10px);
      display: flex; gap: 10px; align-items: center;
    }
    .task-in { flex: 1; background: var(--bg); border: none; border-radius: 22px; padding: 10px 16px; font-size: 17px; font-family: inherit; color: var(--label); outline: none; letter-spacing: -0.2px; }
    .task-in::placeholder { color: var(--label4); }
    .add-btn { width: 36px; height: 36px; border-radius: 50%; background: var(--blue); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.15s, opacity 0.15s; }
    .add-btn:active { transform: scale(0.9); opacity: 0.8; }

    /* Code card */
    .code-card { background: linear-gradient(145deg,#007aff,#5856d6); border-radius: 20px; padding: 24px; margin-bottom: 16px; color: #fff; text-align: center; box-shadow: 0 8px 32px rgba(0,122,255,0.28); }
    .code-lbl { font-size: 12px; font-weight: 600; letter-spacing: 1.5px; opacity: 0.75; text-transform: uppercase; margin-bottom: 10px; }
    .code-val { font-size: 42px; font-weight: 700; letter-spacing: 10px; text-indent: 10px; font-variant-numeric: tabular-nums; line-height: 1; margin-bottom: 16px; }
    .code-copy { background: rgba(255,255,255,0.2); border: none; border-radius: 20px; color: #fff; font-size: 15px; font-weight: 600; padding: 9px 24px; cursor: pointer; font-family: inherit; }
    .code-copy:active { background: rgba(255,255,255,0.3); }

    /* Info box */
    .info { border-radius: var(--r); padding: 13px 15px; margin-bottom: 14px; font-size: 14px; line-height: 1.5; }
    .info.blue { background: var(--blue-soft); color: var(--blue); }
    .info.purple { background: var(--purple-soft); color: var(--purple); }

    /* Sheet */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0); z-index: 50; display: flex; align-items: flex-end; transition: background 0.28s; pointer-events: none; }
    .overlay.open { background: rgba(0,0,0,0.38); pointer-events: all; }
    .sheet { background: var(--surface); border-radius: 20px 20px 0 0; width: 100%; padding: 12px 20px calc(env(safe-area-inset-bottom,0px) + 24px); transform: translateY(100%); transition: transform 0.32s cubic-bezier(0.4,0,0.2,1); max-height: 88dvh; overflow-y: auto; }
    .overlay.open .sheet { transform: translateY(0); }
    .handle { width: 36px; height: 4px; background: var(--bg2); border-radius: 4px; margin: 0 auto 20px; }
    .stitle { font-size: 20px; font-weight: 700; letter-spacing: -0.4px; margin-bottom: 4px; }
    .ssub { font-size: 14px; color: var(--label3); margin-bottom: 20px; line-height: 1.5; }
    .sin { width: 100%; background: var(--bg); border: none; border-radius: 10px; padding: 14px 16px; font-size: 17px; font-family: inherit; color: var(--label); outline: none; margin-bottom: 14px; letter-spacing: -0.2px; }
    .sin::placeholder { color: var(--label4); }
    .sin.code { font-size: 28px; font-weight: 700; letter-spacing: 8px; text-align: center; text-transform: uppercase; }
    .sbtn { width: 100%; padding: 15px; border-radius: var(--r); border: none; font-size: 17px; font-weight: 600; font-family: inherit; cursor: pointer; letter-spacing: -0.2px; margin-bottom: 10px; }
    .sbtn:active { opacity: 0.75; }
    .sbtn.primary { background: var(--blue); color: #fff; }
    .sbtn.ghost { background: var(--bg); color: var(--label); }
    .sbtn.danger { background: var(--red-soft); color: var(--red); }
    .sbtn.purple { background: var(--purple-soft); color: var(--purple); }

    /* Empty state */
    .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 32px; text-align: center; flex: 1; }
    .empty-ico { width: 64px; height: 64px; border-radius: 16px; background: var(--bg2); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; color: var(--label4); }
    .empty-t { font-size: 20px; font-weight: 600; letter-spacing: -0.4px; margin-bottom: 8px; }
    .empty-s { font-size: 15px; color: var(--label3); line-height: 1.5; max-width: 240px; }

    /* Shared item */
    .sitem { display: flex; align-items: center; padding: 13px 16px; gap: 13px; border-bottom: 0.5px solid var(--sep); }
    .sitem:last-child { border-bottom: none; }

    /* Toast */
    .toast { position: fixed; bottom: calc(env(safe-area-inset-bottom,0px) + 24px); left: 50%; transform: translateX(-50%) translateY(14px); background: rgba(28,28,30,0.88); color: #fff; font-size: 14px; font-weight: 500; padding: 9px 18px; border-radius: 20px; opacity: 0; transition: all 0.25s; pointer-events: none; z-index: 300; white-space: nowrap; }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

    @media (prefers-color-scheme: dark) {
      :root { --bg: #1c1c1e; --bg2: #2c2c2e; --surface: #2c2c2e; --sep: rgba(84,84,88,0.6); --label: #fff; --label3: rgba(235,235,245,0.4); --label4: rgba(235,235,245,0.18); --blue-soft: rgba(0,122,255,0.18); --red-soft: rgba(255,59,48,0.15); --purple-soft: rgba(175,82,222,0.15); }
      body { background: #000; }
      .nav { background: rgba(28,28,30,0.92); }
      .nav.white { background: rgba(44,44,46,0.92); }
      .input-bar { background: rgba(28,28,30,0.95); }
      .sheet { background: #2c2c2e; }
      .task-in, .sin { background: var(--bg2); }
    }
  </style>
</head>
<body>
<div id="app">

  <!-- LISTS -->
  <div class="screen active" id="screen-lists">
    <div class="nav">
      <div class="nav-row">
        <div class="nav-large">Accountable</div>
        <div style="display:flex;gap:2px">
          <button class="icon-btn" title="View a partner's list" onclick="openSheet('sh-join')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
          <button class="icon-btn" title="New list" onclick="openSheet('sh-new-list')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="scroll" id="lists-scroll"></div>
  </div>

  <!-- TODOS -->
  <div class="screen" id="screen-todos">
    <div class="nav white">
      <button class="nav-back" onclick="goBack()">
        <svg width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1L1.5 7.5L8 14"/></svg>
        Lists
      </button>
      <div class="nav-center" id="todo-title"></div>
      <div class="nav-actions">
        <button class="txt-btn" id="share-btn" onclick="openShareSheet()">Share</button>
      </div>
    </div>
    <div class="scroll" id="todos-scroll"></div>
    <div class="input-bar">
      <input class="task-in" id="task-input" placeholder="New task…" autocomplete="off"/>
      <button class="add-btn" onclick="addTodo()">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="9" y1="3" x2="9" y2="15"/><line x1="3" y1="9" x2="15" y2="9"/></svg>
      </button>
    </div>
  </div>

  <!-- SHARED VIEW -->
  <div class="screen" id="screen-shared">
    <div class="nav white">
      <button class="nav-back" onclick="goBack()">
        <svg width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1L1.5 7.5L8 14"/></svg>
        Back
      </button>
      <div class="nav-center" id="shared-title">Partner's List</div>
      <div class="nav-actions">
        <button class="txt-btn" onclick="refreshShared()">Refresh</button>
      </div>
    </div>
    <div class="scroll" id="shared-scroll"></div>
  </div>
</div>

<!-- SHEETS -->
<div class="overlay" id="sh-new-list" onclick="bgClose(event,'sh-new-list')">
  <div class="sheet" onclick="event.stopPropagation()">
    <div class="handle"></div>
    <div class="stitle">New List</div>
    <div class="ssub">Give your accountability list a name.</div>
    <input class="sin" id="new-list-input" placeholder="e.g. Morning Routine" maxlength="40"/>
    <button class="sbtn primary" onclick="createList()">Create</button>
    <button class="sbtn ghost" onclick="closeSheet('sh-new-list')">Cancel</button>
  </div>
</div>

<div class="overlay" id="sh-join" onclick="bgClose(event,'sh-join')">
  <div class="sheet" onclick="event.stopPropagation()">
    <div class="handle"></div>
    <div class="stitle">View a Shared List</div>
    <div class="ssub">Enter the 6-character code from your accountability partner.</div>
    <input class="sin code" id="join-input" placeholder="AB12CD" maxlength="6" autocomplete="off"/>
    <button class="sbtn purple" id="join-btn" onclick="joinList()">View List</button>
    <button class="sbtn ghost" onclick="closeSheet('sh-join')">Cancel</button>
  </div>
</div>

<div class="overlay" id="sh-share" onclick="bgClose(event,'sh-share')">
  <div class="sheet" onclick="event.stopPropagation()">
    <div class="handle"></div>
    <div id="share-content"></div>
  </div>
</div>

<div class="overlay" id="sh-delete" onclick="bgClose(event,'sh-delete')">
  <div class="sheet" onclick="event.stopPropagation()">
    <div class="handle"></div>
    <div class="stitle">Delete List?</div>
    <div class="ssub" id="delete-sub"></div>
    <button class="sbtn danger" onclick="confirmDelete()">Delete List</button>
    <button class="sbtn ghost" onclick="closeSheet('sh-delete')">Cancel</button>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const CHEVRON = '<svg width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 5.5L1 12"/></svg>';
const CHECK_SVG = '<svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1 4.5L4.5 8.5L12 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_LIST = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
const ICON_LINK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
const ICON_CLOSE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.12"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const ICON_EMPTY_LIST = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>';
const ICON_EMPTY_TASK = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg>';
const ICON_EMPTY_SHARE = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

// Data
const KEY = 'accountable_v3';
function loadOwn() { try { return JSON.parse(localStorage.getItem(KEY)) || {lists:[]}; } catch { return {lists:[]}; } }
function saveOwn(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
async function fetchShared(code) {
  try { const r = await fetch('/api/shared/'+code.toUpperCase()); return r.ok ? r.json() : null; }
  catch { return null; }
}
async function pushShared(code, data) {
  try { await fetch('/api/shared/'+code.toUpperCase(), {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); }
  catch {}
}

let db = loadOwn();
let listId = null, viewCode = null, navStack = [];
function uid() { return Math.random().toString(36).slice(2,10); }
function makeCode() { return Math.random().toString(36).slice(2,8).toUpperCase(); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Nav
function showScreen(id) { document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById('screen-'+id).classList.add('active'); }
function nav(id) { navStack.push(document.querySelector('.screen.active').id.replace('screen-','')); showScreen(id); }
function goBack() { showScreen(navStack.pop()||'lists'); }

// List colors
const COLORS = ['#007aff','#34c759','#ff9500','#ff3b30','#af52de','#ff2d55','#32ade6','#30b0c7'];

// Render lists
function renderLists() {
  const el = document.getElementById('lists-scroll');
  if (!db.lists.length) {
    el.innerHTML = \`<div class="empty"><div class="empty-ico">\${ICON_EMPTY_LIST}</div><div class="empty-t">No Lists Yet</div><div class="empty-s">Tap the + button above to create your first accountability list.</div></div>\`;
    return;
  }
  let h = '<div class="sh">My Lists</div><div class="group">';
  db.lists.forEach(list => {
    const rem = list.items.filter(i=>!i.done).length, tot = list.items.length;
    h += \`<div class="row" onclick="openList('\${list.id}')">
      <div class="list-icon" style="background:\${list.color}18;color:\${list.color}">\${ICON_LIST}</div>
      <div class="rc">
        <div class="rt">\${esc(list.name)}</div>
        \${list.shareCode
          ? \`<div class="rs" style="color:var(--purple)">Sharing active &middot; \${list.items.filter(i=>i.shared).length} visible</div>\`
          : (tot>0 ? \`<div class="rs">\${rem} remaining</div>\` : '')
        }
      </div>
      <div class="ra">
        \${tot>0?\`<span class="badge\${rem===0?' done':''}">\${rem>0?rem:'&#10003;'}</span>\`:''}
        <span class="chev">\${CHEVRON}</span>
      </div>
    </div>\`;
  });
  h += \`</div><div class="sh">Partners</div><div class="group">
    <div class="row" onclick="openSheet('sh-join')">
      <div class="list-icon" style="background:var(--purple-soft);color:var(--purple)">\${ICON_LINK}</div>
      <div class="rc"><div class="rt">View a Shared List</div><div class="rs">Enter a partner's code</div></div>
      <span class="chev">\${CHEVRON}</span>
    </div>
  </div><div style="height:32px"></div>\`;
  el.innerHTML = h;
}

function openList(id) { listId = id; nav('todos'); renderTodos(); }
function getList() { return db.lists.find(l=>l.id===listId); }
function persist(fn) {
  db.lists = db.lists.map(l=>l.id===listId?fn(l):l);
  saveOwn(db);
  const list = getList();
  if (list?.shareCode) pushShared(list.shareCode, {name:list.name, items:list.items.filter(i=>i.shared), updatedAt:Date.now()});
}

function renderTodos() {
  const list = getList(); if (!list) return;
  document.getElementById('todo-title').textContent = list.name;
  const btn = document.getElementById('share-btn');
  btn.textContent = list.shareCode || 'Share';
  btn.className = 'txt-btn' + (list.shareCode?' purple':'');

  const el = document.getElementById('todos-scroll');
  if (!list.items.length) {
    el.innerHTML = \`<div class="empty"><div class="empty-ico">\${ICON_EMPTY_TASK}</div><div class="empty-t">No Tasks</div><div class="empty-s">Add your first task using the input below.</div></div>\`;
    return;
  }
  const done = list.items.filter(i=>i.done).length, tot = list.items.length;
  let h = \`<div class="prog"><div class="prog-lbl">\${done} of \${tot} completed</div><div class="prog-track"><div class="prog-fill" style="width:\${tot?Math.round(done/tot*100):0}%"></div></div></div>\`;
  if (list.shareCode) {
    const sc = list.items.filter(i=>i.shared).length;
    h += \`<div class="info purple" style="margin:0 16px 8px">Sharing \${sc} task\${sc!==1?'s':''} with your partner.</div>\`;
  }
  const active = list.items.filter(i=>!i.done), comp = list.items.filter(i=>i.done);
  if (active.length) { h+='<div class="sh">To Do</div><div class="group">'; active.forEach(i=>{h+=trow(i,!!list.shareCode);}); h+='</div>'; }
  if (comp.length)   { h+='<div class="sh">Completed</div><div class="group">'; comp.forEach(i=>{h+=trow(i,!!list.shareCode);}); h+='</div>'; }
  h+=\`<div style="padding:8px 16px 0"><button class="sbtn danger" onclick="openDeleteSheet()" style="margin-bottom:0">Delete List</button></div><div style="height:16px"></div>\`;
  el.innerHTML = h;
}

function trow(item, hasShare) {
  return \`<div class="ti">
    <div class="check\${item.done?' done':''}" onclick="toggleTodo('\${item.id}')">\${CHECK_SVG}</div>
    <div class="tt\${item.done?' done':''}">\${esc(item.text)}</div>
    \${hasShare?\`<button class="pill\${item.shared?' on':''}" onclick="toggleShare('\${item.id}')">\${item.shared?'Shared':'Share'}</button>\`:''}
    <button class="del" onclick="delTodo('\${item.id}')">\${ICON_CLOSE}</button>
  </div>\`;
}

function addTodo() {
  const inp = document.getElementById('task-input'), text = inp.value.trim(); if (!text) return;
  persist(l=>({...l, items:[...l.items, {id:uid(),text,done:false,shared:false}]}));
  inp.value=''; renderTodos(); showToast('Task added');
}
function toggleTodo(id) { persist(l=>({...l,items:l.items.map(i=>i.id===id?{...i,done:!i.done}:i)})); renderTodos(); }
function delTodo(id)    { persist(l=>({...l,items:l.items.filter(i=>i.id!==id)})); renderTodos(); }
function toggleShare(id){ persist(l=>({...l,items:l.items.map(i=>i.id===id?{...i,shared:!i.shared}:i)})); renderTodos(); }

function openShareSheet() {
  const list = getList(); if (!list) return;
  const el = document.getElementById('share-content');
  if (list.shareCode) {
    const shared = list.items.filter(i=>i.shared);
    const itemsH = shared.length
      ? shared.map(i=>\`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:0.5px solid var(--sep)">
          <div style="width:22px;height:22px;border-radius:50%;background:\${i.done?'var(--green)':'transparent'};border:2px solid \${i.done?'var(--green)':'var(--bg2)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">\${i.done?CHECK_SVG:''}</div>
          <span style="font-size:15px;color:\${i.done?'var(--label3)':'var(--label)'}\${i.done?';text-decoration:line-through':''}">\${esc(i.text)}</span>
        </div>\`).join('')
      : \`<p style="color:var(--label3);font-size:14px;padding:10px 0">No tasks shared yet. Tap <strong>Share</strong> on a task to make it visible to your partner.</p>\`;
    el.innerHTML = \`<div class="stitle">"\${esc(list.name)}"</div>
      <div class="code-card"><div class="code-lbl">Share Code</div><div class="code-val">\${list.shareCode}</div><button class="code-copy" onclick="copyCode('\${list.shareCode}')">Copy Code</button></div>
      <div class="info purple">Your partner enters this code to view your shared tasks in real time, from any device.</div>
      <div class="sh" style="padding:0 0 8px">Currently Sharing (\${shared.length})</div>
      <div style="margin-bottom:16px">\${itemsH}</div>
      <button class="sbtn ghost" onclick="disableSharing()">Stop Sharing</button>
      <button class="sbtn ghost" onclick="closeSheet('sh-share')">Done</button>\`;
  } else {
    el.innerHTML = \`<div class="stitle">Share This List</div>
      <div class="ssub">Generate a code and give it to your accountability partner. They see only the tasks you choose to share — from any device.</div>
      <div class="info blue">Your partner can view your progress in real time but cannot edit anything.</div>
      <button class="sbtn primary" onclick="enableSharing()">Enable Sharing</button>
      <button class="sbtn ghost" onclick="closeSheet('sh-share')">Cancel</button>\`;
  }
  openSheet('sh-share');
}

function enableSharing() { const code=makeCode(); persist(l=>({...l,shareCode:code})); renderTodos(); closeSheet('sh-share'); setTimeout(openShareSheet,60); }
function disableSharing() { persist(l=>({...l,shareCode:null})); renderTodos(); closeSheet('sh-share'); showToast('Sharing disabled'); }
function copyCode(code) {
  (navigator.clipboard?.writeText(code)||Promise.reject()).then(()=>showToast('Code copied!')).catch(()=>showToast('Code: '+code));
}

function createList() {
  const name = document.getElementById('new-list-input').value.trim(); if (!name) return;
  const list = {id:uid(), name, color:COLORS[db.lists.length%COLORS.length], shareCode:null, items:[]};
  db.lists.push(list); saveOwn(db);
  document.getElementById('new-list-input').value='';
  closeSheet('sh-new-list'); renderLists();
  setTimeout(()=>openList(list.id), 220);
}

function openDeleteSheet() {
  const list=getList();
  document.getElementById('delete-sub').textContent='"'+list.name+'" and all its tasks will be permanently deleted.';
  openSheet('sh-delete');
}
function confirmDelete() {
  db.lists=db.lists.filter(l=>l.id!==listId); saveOwn(db);
  closeSheet('sh-delete'); renderLists(); goBack();
}

async function joinList() {
  const code=document.getElementById('join-input').value.trim().toUpperCase();
  if (code.length<4) { showToast('Enter a valid code'); return; }
  const btn=document.getElementById('join-btn');
  btn.textContent='Loading\u2026'; btn.disabled=true;
  const data=await fetchShared(code);
  btn.textContent='View List'; btn.disabled=false;
  if (!data) { showToast('No list found \u2014 check the code'); return; }
  viewCode=code;
  document.getElementById('join-input').value='';
  closeSheet('sh-join'); nav('shared'); renderSharedView(data);
}

function renderSharedView(data) {
  document.getElementById('shared-title').textContent = data.name||'Shared List';
  const el=document.getElementById('shared-scroll'), items=data.items||[];
  if (!items.length) {
    el.innerHTML=\`<div class="empty"><div class="empty-ico">\${ICON_EMPTY_SHARE}</div><div class="empty-t">Nothing Shared Yet</div><div class="empty-s">Your partner hasn't shared any tasks yet.</div></div>\`;
    return;
  }
  const done=items.filter(i=>i.done).length;
  const updated=data.updatedAt?new Date(data.updatedAt).toLocaleString([],{dateStyle:'short',timeStyle:'short'}):null;
  let h=\`<div class="prog">\${updated?'<div class="prog-lbl" style="text-align:right;margin-bottom:4px">Updated '+updated+'</div>':''}
    <div class="prog-lbl">\${done} of \${items.length} completed</div>
    <div class="prog-track"><div class="prog-fill" style="width:\${Math.round(done/items.length*100)}%"></div></div>
  </div>
  <div class="info purple" style="margin:0 16px 8px">Tap Refresh to check for updates from your partner.</div>
  <div class="sh">Tasks (\${items.length})</div><div class="group">\`;
  items.forEach(item=>{
    h+=\`<div class="sitem">
      <div style="width:24px;height:24px;border-radius:50%;background:\${item.done?'var(--green)':'transparent'};border:2px solid \${item.done?'var(--green)':'var(--bg2)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">\${item.done?CHECK_SVG:''}</div>
      <div style="font-size:17px;letter-spacing:-0.2px;color:\${item.done?'var(--label3)':'var(--label)'}\${item.done?';text-decoration:line-through':''}">\${esc(item.text)}</div>
    </div>\`;
  });
  h+=\`</div><div style="height:32px"></div>\`;
  el.innerHTML=h;
}

async function refreshShared() {
  if (!viewCode) return; showToast('Refreshing\u2026');
  const data=await fetchShared(viewCode);
  if (data) { renderSharedView(data); showToast('Updated'); }
  else showToast('Could not load list');
}

// Sheets
function openSheet(id) {
  const el=document.getElementById(id); el.style.display='flex';
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('open')));
  setTimeout(()=>{ const i=el.querySelector('input'); if(i) i.focus(); }, 340);
}
function closeSheet(id) { const el=document.getElementById(id); el.classList.remove('open'); setTimeout(()=>el.style.display='none',340); }
function bgClose(e,id) { if(e.target===e.currentTarget) closeSheet(id); }
document.querySelectorAll('.overlay').forEach(s=>s.style.display='none');

// Toast
let _t;
function showToast(msg) { const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(_t); _t=setTimeout(()=>t.classList.remove('show'),2200); }

// Keyboard
document.getElementById('task-input').addEventListener('keydown',e=>{if(e.key==='Enter')addTodo();});
document.getElementById('new-list-input').addEventListener('keydown',e=>{if(e.key==='Enter')createList();});
document.getElementById('join-input').addEventListener('keydown',e=>{if(e.key==='Enter')joinList();});
document.getElementById('join-input').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase();});

renderLists();
</script>
</body>
</html>`;
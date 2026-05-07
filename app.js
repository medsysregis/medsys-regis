/* ═══════════════════════════════════════════
   MEDSYS · REAGENT INVENTORY SYSTEM (REGIS)
   app.js — Full Application Logic v2.0
═══════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════
// DATA STORE (localStorage)
// ════════════════════════════════════════════
const DB = {
  KEY_REAGENTS: 'regis_reagents',
  KEY_HISTORY:  'regis_history',

  load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  save(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
  getReagents() { return this.load(this.KEY_REAGENTS); },
  saveReagents(d) { this.save(this.KEY_REAGENTS, d); },
  getHistory() { return this.load(this.KEY_HISTORY); },
  saveHistory(d) { this.save(this.KEY_HISTORY, d); },
  logActivity(type, message) {
    const h = this.getHistory();
    h.unshift({ type, message, ts: new Date().toISOString() });
    if (h.length > 200) h.length = 200;
    this.saveHistory(h);
  }
};

// ════════════════════════════════════════════
// SEED DATA
// ════════════════════════════════════════════
function seedData() {
  if (DB.getReagents().length) return;
  const today = new Date();
  const d = (days) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + days);
    return dt.toISOString().split('T')[0];
  };
  const reagents = [
    { id: uid(), name: 'CBC Reagent Kit',           category: 'Hematology',   qty: 12, unit: 'kits',    min: 5, expiry: d(45),  lot: 'LOT-2025-001', supplier: 'Sysmex',  notes: 'Store at 2-8°C' },
    { id: uid(), name: 'WBC Lyse Reagent',           category: 'Hematology',   qty: 3,  unit: 'bottles', min: 4, expiry: d(30),  lot: 'LOT-2025-002', supplier: 'Sysmex',  notes: 'Keep upright' },
    { id: uid(), name: 'Glucose Standard Solution',  category: 'Chemistry',    qty: 2,  unit: 'vials',   min: 5, expiry: d(7),   lot: 'LOT-2025-003', supplier: 'Roche',   notes: 'Protect from light' },
    { id: uid(), name: 'HbA1c Calibrator',           category: 'Chemistry',    qty: 8,  unit: 'vials',   min: 3, expiry: d(90),  lot: 'LOT-2025-004', supplier: 'Bio-Rad', notes: '' },
    { id: uid(), name: 'Blood Agar Plates',          category: 'Microbiology', qty: 24, unit: 'pcs',     min: 10, expiry: d(14), lot: 'LOT-2025-005', supplier: 'BD',      notes: 'Store at 4°C' },
    { id: uid(), name: 'MacConkey Agar',             category: 'Microbiology', qty: 1,  unit: 'bottles', min: 3, expiry: d(-5),  lot: 'LOT-2024-099', supplier: 'Oxoid',   notes: '' },
    { id: uid(), name: 'Anti-CRP Antibody',          category: 'Immunology',   qty: 6,  unit: 'vials',   min: 2, expiry: d(60),  lot: 'LOT-2025-006', supplier: 'Siemens', notes: 'Do not freeze' },
    { id: uid(), name: 'Urine Dipstick Strips',      category: 'Urinalysis',   qty: 4,  unit: 'bottles', min: 5, expiry: d(120), lot: 'LOT-2025-007', supplier: 'Roche',   notes: '' },
    { id: uid(), name: 'Prothrombin Time Reagent',   category: 'Hematology',   qty: 10, unit: 'vials',   min: 4, expiry: d(75),  lot: 'LOT-2025-008', supplier: 'Stago',   notes: '' },
    { id: uid(), name: 'Thyroid TSH Kit',            category: 'Immunology',   qty: 5,  unit: 'kits',    min: 2, expiry: d(200), lot: 'LOT-2025-009', supplier: 'Abbott',  notes: 'Refrigerate' },
  ];
  DB.saveReagents(reagents);
  DB.logActivity('add', 'REGIS system initialised with 10 demo reagents');
}

function uid() {
  return 'RGS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
}

// ════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════
const CREDENTIALS = { admin: 'lab2024', labtech: 'tech2024', manager: 'mgr2024' };

function handleLogin() {
  const u   = document.getElementById('login-user').value.trim();
  const p   = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');
  if (CREDENTIALS[u] === p) {
    err.classList.add('hidden');
    localStorage.setItem('regis_auth', JSON.stringify({ user: u, ts: Date.now() }));
    document.getElementById('user-name-display').textContent  = u.charAt(0).toUpperCase() + u.slice(1);
    document.getElementById('user-avatar-display').textContent = u.charAt(0).toUpperCase();
    bootApp();
  } else {
    err.classList.remove('hidden');
    shake(document.querySelector('.login-card'));
  }
}

function handleLogout() {
  localStorage.removeItem('regis_auth');
  document.getElementById('app-shell').style.display  = 'none';
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('page-login').style.display = '';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').classList.add('hidden');
  stopScan();
}

document.addEventListener('DOMContentLoaded', () => {
  ['login-user','login-pass'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
  });
});

// ════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════
function bootApp() {
  seedData();
  document.getElementById('page-login').style.display = 'none';
  document.getElementById('app-shell').style.display  = 'flex';
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('dashboard-date').textContent = new Date().toLocaleDateString('en-AE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  if (!document.getElementById('sidebar-overlay')) {
    const ov = document.createElement('div');
    ov.id = 'sidebar-overlay';
    ov.className = 'sidebar-overlay';
    ov.onclick = () => toggleSidebar(false);
    document.body.appendChild(ov);
  }
  showPage('home');
  populateQRGenSelect();
}

window.addEventListener('load', () => {
  const auth = JSON.parse(localStorage.getItem('regis_auth') || 'null');
  if (auth && (Date.now() - auth.ts < 8 * 3600 * 1000)) {
    document.getElementById('user-name-display').textContent  = auth.user.charAt(0).toUpperCase() + auth.user.slice(1);
    document.getElementById('user-avatar-display').textContent = auth.user.charAt(0).toUpperCase();
    bootApp();
  }
});

// ════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════
const PAGE_TITLES = { home: 'Dashboard', inventory: 'Inventory', scan: 'Scan QR / Barcode', reports: 'Reports', about: 'About' };
let currentPage = 'home';

function showPage(id) {
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg  = document.getElementById(`page-${id}`);
  const nav = document.querySelector(`.nav-item[data-page="${id}"]`);
  if (pg)  pg.classList.add('active');
  if (nav) nav.classList.add('active');
  currentPage = id;
  document.getElementById('topbar-title').textContent = PAGE_TITLES[id] || id;

  if (id === 'home')      refreshDashboard();
  if (id === 'inventory') renderInventoryTable();
  if (id === 'reports')   renderReports();
  if (id !== 'scan')      stopScan();
  toggleSidebar(false);
}

function toggleSidebar(force) {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  const open = (force === undefined) ? !sb.classList.contains('open') : force;
  sb.classList.toggle('open', open);
  if (ov) ov.classList.toggle('visible', open);
}

// ════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════
function refreshDashboard() {
  const reagents = DB.getReagents();
  const low      = reagents.filter(r => computeStatus(r) === 'low').length;
  const critical = reagents.filter(r => computeStatus(r) === 'critical').length;
  const expiring = reagents.filter(r => { const d = daysUntilExpiry(r.expiry); return d >= 0 && d <= 30; }).length;
  const instock  = reagents.length - low - critical;

  document.getElementById('stat-total').textContent    = reagents.length;
  document.getElementById('stat-instock').textContent  = instock;
  document.getElementById('stat-low').textContent      = low + critical;
  document.getElementById('stat-expiring').textContent = expiring;

  const totalAlerts = low + critical + expiring;
  const badge = document.getElementById('alert-badge');
  badge.textContent = totalAlerts;
  badge.style.display = totalAlerts ? 'flex' : 'none';

  renderAlerts(reagents);
  renderActivity();
}

function computeStatus(r) {
  if (r.qty <= 0)           return 'critical';
  if (r.qty <= r.min * 0.5) return 'critical';
  if (r.qty <= r.min)       return 'low';
  return 'normal';
}

function daysUntilExpiry(dateStr) {
  const exp = new Date(dateStr); const now = new Date();
  now.setHours(0,0,0,0); exp.setHours(0,0,0,0);
  return Math.round((exp - now) / 86400000);
}

function renderAlerts(reagents) {
  const list = document.getElementById('alerts-list');
  const alerts = [];
  reagents.forEach(r => {
    const st   = computeStatus(r);
    const days = daysUntilExpiry(r.expiry);
    if (st === 'critical') alerts.push({ type: 'critical', text: `<strong>${r.name}</strong> is critically low (${r.qty} ${r.unit} remaining). Restock immediately.` });
    else if (st === 'low') alerts.push({ type: 'low',      text: `<strong>${r.name}</strong> is running low (${r.qty} ${r.unit} — threshold: ${r.min}).` });
    if (days < 0)       alerts.push({ type: 'expiry', text: `<strong>${r.name}</strong> has EXPIRED (Lot: ${r.lot}). Remove from use immediately.` });
    else if (days <= 30) alerts.push({ type: 'expiry', text: `<strong>${r.name}</strong> expires in <strong>${days} day${days!==1?'s':''}</strong> (${r.expiry}).` });
  });
  if (!alerts.length) {
    list.innerHTML = '<div class="empty-alerts">✅ No active alerts — all reagents are within safe levels.</div>';
    return;
  }
  list.innerHTML = alerts.map((a, i) => `
    <div class="alert-item ${a.type}" id="alert-${i}">
      <span>${a.type==='critical'?'🔴':a.type==='low'?'🟡':'🔵'}</span>
      <span class="alert-text">${a.text}</span>
      <button class="alert-dismiss" onclick="dismissAlert(${i})">×</button>
    </div>`).join('');
}

function dismissAlert(i) {
  const el = document.getElementById(`alert-${i}`);
  if (el) { el.style.transition='all .2s'; el.style.opacity='0'; el.style.transform='translateX(8px)'; setTimeout(()=>el.remove(),200); }
}
function dismissAllAlerts() {
  document.querySelectorAll('.alert-item').forEach(el=>el.remove());
  document.getElementById('alerts-list').innerHTML='<div class="empty-alerts">✅ All alerts dismissed.</div>';
}

function renderActivity() {
  const history = DB.getHistory().slice(0, 8);
  const list = document.getElementById('activity-list');
  if (!history.length) { list.innerHTML='<p class="text-muted small" style="padding:10px">No activity yet.</p>'; return; }
  list.innerHTML = history.map(h => `
    <div class="activity-item">
      <span class="activity-dot ${h.type}"></span>
      <span class="activity-text">${h.message}</span>
      <span class="activity-time">${timeAgo(h.ts)}</span>
    </div>`).join('');
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ════════════════════════════════════════════
// INVENTORY
// ════════════════════════════════════════════
function renderInventoryTable() {
  filterInventory();
}

function filterInventory() {
  const reagents = DB.getReagents();
  const q   = document.getElementById('search-input').value.toLowerCase();
  const st  = document.getElementById('filter-status').value;
  const cat = document.getElementById('filter-category').value;
  const filtered = reagents.filter(r => {
    const matchQ   = !q  || r.name.toLowerCase().includes(q) || r.lot.toLowerCase().includes(q) || (r.supplier||'').toLowerCase().includes(q);
    const matchSt  = !st || computeStatus(r) === st;
    const matchCat = !cat || r.category === cat;
    return matchQ && matchSt && matchCat;
  });
  const tbody = document.getElementById('inventory-tbody');
  const empty = document.getElementById('empty-inventory');
  if (!filtered.length) { tbody.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = filtered.map(r => {
    const st   = computeStatus(r);
    const days = daysUntilExpiry(r.expiry);
    const expiryClass = days < 0 ? 'expired' : days <= 30 ? 'soon' : 'ok';
    const expiryLabel = days < 0 ? `Expired (${Math.abs(days)}d ago)` : days <= 30 ? `${days}d left` : r.expiry;
    return `<tr>
      <td><strong>${r.name}</strong>${r.notes?`<br><span class="text-muted" style="font-size:.75rem">${r.notes}</span>`:''}
          <br><code style="font-size:.7rem;color:var(--blue-400)">${r.id}</code></td>
      <td><span class="badge badge-blue">${r.category}</span></td>
      <td style="font-weight:600">${r.qty}</td>
      <td>${r.unit}</td>
      <td><span class="status-badge ${st}">${st==='normal'?'✓ Normal':st==='low'?'⚠ Low':'🔴 Critical'}</span></td>
      <td><span class="expiry-badge ${expiryClass}">${expiryLabel}</span></td>
      <td><code style="font-size:.78rem;color:var(--gray-500)">${r.lot||'—'}</code></td>
      <td>
        <div class="action-btns">
          <button class="btn-icon edit" onclick="openEditModal('${r.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2L12 4.5 5 11.5H2.5V9L9.5 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
          </button>
          <button class="btn-icon delete" onclick="deleteReagent('${r.id}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5 3.5V2.5h4v1M5.5 6v4M8.5 6v4M3 3.5l.5 8h7l.5-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Reagent';
  document.getElementById('edit-id').value = '';
  ['f-name','f-qty','f-min','f-expiry','f-lot','f-supplier','f-notes'].forEach(id => document.getElementById(id).value='');
  document.getElementById('f-category').value = 'Hematology';
  document.getElementById('f-unit').value = 'vials';
  document.getElementById('modal-reagent').classList.remove('hidden');
}

function openEditModal(id) {
  const r = DB.getReagents().find(r => r.id === id);
  if (!r) return;
  document.getElementById('modal-title').textContent = 'Edit Reagent';
  document.getElementById('edit-id').value     = r.id;
  document.getElementById('f-name').value      = r.name;
  document.getElementById('f-category').value  = r.category;
  document.getElementById('f-qty').value        = r.qty;
  document.getElementById('f-unit').value       = r.unit;
  document.getElementById('f-min').value        = r.min;
  document.getElementById('f-expiry').value     = r.expiry;
  document.getElementById('f-lot').value        = r.lot;
  document.getElementById('f-supplier').value   = r.supplier;
  document.getElementById('f-notes').value      = r.notes;
  document.getElementById('modal-reagent').classList.remove('hidden');
}

function saveReagent() {
  const name   = document.getElementById('f-name').value.trim();
  const qty    = parseInt(document.getElementById('f-qty').value);
  const min    = parseInt(document.getElementById('f-min').value);
  const expiry = document.getElementById('f-expiry').value;
  if (!name || isNaN(qty) || isNaN(min) || !expiry) { showToast('Please fill in all required fields.','error'); return; }
  const reagents = DB.getReagents();
  const editId   = document.getElementById('edit-id').value;
  const data = {
    id: editId || uid(), name,
    category: document.getElementById('f-category').value,
    qty, unit: document.getElementById('f-unit').value,
    min, expiry,
    lot:      document.getElementById('f-lot').value.trim(),
    supplier: document.getElementById('f-supplier').value.trim(),
    notes:    document.getElementById('f-notes').value.trim()
  };
  if (editId) {
    const idx = reagents.findIndex(r => r.id === editId);
    if (idx > -1) reagents[idx] = data;
    DB.logActivity('update', `Updated: ${name}`);
    showToast(`${name} updated.`, 'success');
  } else {
    reagents.push(data);
    DB.logActivity('add', `Added reagent: ${name} (ID: ${data.id})`);
    showToast(`${name} added to REGIS.`, 'success');
  }
  DB.saveReagents(reagents);
  closeModal('modal-reagent');
  renderInventoryTable();
  populateQRGenSelect();
  refreshDashboard();
}

function deleteReagent(id) {
  const reagents = DB.getReagents();
  const r = reagents.find(r => r.id === id);
  if (!r || !confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
  DB.saveReagents(reagents.filter(r => r.id !== id));
  DB.logActivity('delete', `Deleted: ${r.name}`);
  showToast(`${r.name} removed.`,'error');
  renderInventoryTable();
  populateQRGenSelect();
  refreshDashboard();
}

// ════════════════════════════════════════════
// SCAN MODE TOGGLE
// ════════════════════════════════════════════
let scanMode = 'qr'; // 'qr' or 'barcode'

function setScanMode(mode) {
  scanMode = mode;
  stopScan();

  document.getElementById('btn-mode-qr').classList.toggle('active', mode === 'qr');
  document.getElementById('btn-mode-bar').classList.toggle('active', mode === 'barcode');

  const pill     = document.getElementById('mode-pill');
  const idleQR   = document.getElementById('idle-qr-svg');
  const idleBar  = document.getElementById('idle-bar-svg');
  const idleText = document.getElementById('scan-idle-label');

  if (mode === 'qr') {
    pill.textContent = '📷 QR Code Mode';
    pill.className   = 'scan-mode-pill qr';
    idleQR.classList.remove('hidden');
    idleBar.classList.add('hidden');
    idleText.textContent = 'Point camera at QR code';
  } else {
    pill.textContent = '📊 Barcode Mode';
    pill.className   = 'scan-mode-pill bar';
    idleQR.classList.add('hidden');
    idleBar.classList.remove('hidden');
    idleText.textContent = 'Point camera at barcode';
  }
}

// ════════════════════════════════════════════
// QR / BARCODE SCANNER
// ════════════════════════════════════════════
let html5QrCode    = null;
let scannedReagentId = null;

// Barcode formats to support
const QR_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.DATA_MATRIX
];

const QR_ONLY = [Html5QrcodeSupportedFormats.QR_CODE];
const BAR_ONLY = [
  Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF
];

function startScan() {
  const idle = document.getElementById('qr-idle');
  if (idle) idle.style.display = 'none';
  document.getElementById('start-scan-btn').style.display = 'none';
  document.getElementById('stop-scan-btn').style.display  = '';

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('qr-reader');
  }

  const formats = scanMode === 'barcode' ? BAR_ONLY : QR_ONLY;

  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 12, qrbox: scanMode === 'barcode' ? { width: 280, height: 120 } : { width: 220, height: 220 },
      formatsToSupport: formats },
    onScanSuccess,
    () => {}
  ).catch(() => {
    showToast('Camera access denied or unavailable.', 'error');
    stopScan();
    if (idle) idle.style.display = 'flex';
  });
}

function stopScan() {
  document.getElementById('start-scan-btn').style.display = '';
  document.getElementById('stop-scan-btn').style.display  = 'none';
  const idle = document.getElementById('qr-idle');
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => { if (idle) idle.style.display = 'flex'; }).catch(() => {});
  }
}

function onScanSuccess(text) {
  stopScan();
  const banner   = document.getElementById('scan-result-banner');
  const reagents = DB.getReagents();

  // Match by REGIS ID, lot number, or name
  const found = reagents.find(r =>
    r.id === text ||
    r.lot.toLowerCase() === text.toLowerCase() ||
    r.name.toLowerCase() === text.toLowerCase()
  );

  if (!found) {
    banner.className = 'scan-result-banner error';
    banner.textContent = `Scanned: "${text}" — No matching reagent in REGIS. Try Manual Entry.`;
    banner.classList.remove('hidden');
    DB.logActivity('update', `Scan: unrecognized code "${text}"`);
    return;
  }

  scannedReagentId = found.id;
  banner.className = 'scan-result-banner success';
  banner.textContent = `✓ Reagent found: ${found.name}`;
  banner.classList.remove('hidden');
  DB.logActivity('update', `Scanned reagent: ${found.name} (${found.id})`);
  showQRReagentCard(found);
}

function showQRReagentCard(r) {
  const card    = document.getElementById('qr-reagent-card');
  const details = document.getElementById('qr-reagent-details');
  const st = computeStatus(r);
  details.innerHTML = `
    <div class="detail-item"><span class="detail-label">Name</span><span class="detail-val">${r.name}</span></div>
    <div class="detail-item"><span class="detail-label">Category</span><span class="detail-val">${r.category}</span></div>
    <div class="detail-item"><span class="detail-label">Qty</span><span class="detail-val">${r.qty} ${r.unit}</span></div>
    <div class="detail-item"><span class="detail-label">Status</span><span class="detail-val"><span class="status-badge ${st}">${st}</span></span></div>
    <div class="detail-item"><span class="detail-label">Expiry</span><span class="detail-val">${r.expiry}</span></div>
    <div class="detail-item"><span class="detail-label">Lot</span><span class="detail-val">${r.lot}</span></div>`;
  document.getElementById('qr-qty-input').value = r.qty;
  card.style.display = 'block';
}

function adjustQty(delta) {
  const inp = document.getElementById('qr-qty-input');
  inp.value = Math.max(0, parseInt(inp.value||0) + delta);
}

function saveQrUpdate() {
  if (!scannedReagentId) return;
  const reagents = DB.getReagents();
  const idx = reagents.findIndex(r => r.id === scannedReagentId);
  if (idx < 0) return;
  const newQty = parseInt(document.getElementById('qr-qty-input').value);
  const old    = reagents[idx].qty;
  reagents[idx].qty = newQty;
  DB.saveReagents(reagents);
  DB.logActivity('update', `Qty updated via scan: ${reagents[idx].name} ${old} → ${newQty} ${reagents[idx].unit}`);
  showToast(`Updated: ${reagents[idx].name} → ${newQty} ${reagents[idx].unit}`, 'success');
  document.getElementById('qr-reagent-card').style.display = 'none';
  document.getElementById('scan-result-banner').classList.add('hidden');
  scannedReagentId = null;
  refreshDashboard();
}

// ── MANUAL ENTRY ──
function openManualEntry() { document.getElementById('modal-manual').classList.remove('hidden'); }
function lookupManual() {
  const val = document.getElementById('manual-id-input').value.trim();
  if (!val) { showToast('Please enter a value.','error'); return; }
  const reagents = DB.getReagents();
  const found = reagents.find(r =>
    r.id === val ||
    r.lot.toLowerCase() === val.toLowerCase() ||
    r.name.toLowerCase() === val.toLowerCase()
  );
  if (!found) { showToast(`No reagent found for: "${val}"`, 'error'); return; }
  scannedReagentId = found.id;
  closeModal('modal-manual');
  const banner = document.getElementById('scan-result-banner');
  banner.className = 'scan-result-banner success';
  banner.textContent = `✓ Found: ${found.name}`;
  banner.classList.remove('hidden');
  showQRReagentCard(found);
}

// ════════════════════════════════════════════
// REAL QR CODE GENERATOR (using QRCodeJS)
// ════════════════════════════════════════════
let currentQRReagent = null;

function populateQRGenSelect() {
  const sel = document.getElementById('qr-gen-select');
  if (!sel) return;
  const reagents = DB.getReagents();
  sel.innerHTML = '<option value="">— Select Reagent —</option>' +
    reagents.map(r => `<option value="${r.id}">${r.name} (${r.lot})</option>`).join('');
}

function generateQRPreview() {
  const id      = document.getElementById('qr-gen-select').value;
  const preview = document.getElementById('qr-gen-preview');
  const container = document.getElementById('qr-code-container');
  const labelInfo = document.getElementById('qr-label-info');

  if (!id) { preview.classList.add('hidden'); return; }

  const reagents = DB.getReagents();
  const r = reagents.find(r => r.id === id);
  if (!r) return;

  currentQRReagent = r;

  // Clear old QR
  container.innerHTML = '';

  // Build the QR data payload (JSON with key reagent info)
  const qrPayload = r.id; // scan matches on ID directly

  // Generate real QR code using QRCodeJS
  new QRCode(container, {
    text:          qrPayload,
    width:         160,
    height:        160,
    colorDark:     '#0a1628',
    colorLight:    '#ffffff',
    correctLevel:  QRCode.CorrectLevel.H
  });

  // Update label info
  const days = daysUntilExpiry(r.expiry);
  const expiryStatus = days < 0 ? '⚠ EXPIRED' : days <= 30 ? `⚠ ${days}d left` : `✓ ${r.expiry}`;
  labelInfo.innerHTML = `
    <div class="qr-label-row"><span class="qr-label-key">Reagent</span><span class="qr-label-val">${r.name}</span></div>
    <div class="qr-label-row"><span class="qr-label-key">Category</span><span class="qr-label-val">${r.category}</span></div>
    <div class="qr-label-row"><span class="qr-label-key">Lot No.</span><span class="qr-label-val">${r.lot}</span></div>
    <div class="qr-label-row"><span class="qr-label-key">Expiry</span><span class="qr-label-val">${expiryStatus}</span></div>
    <div class="qr-label-row"><span class="qr-label-key">Supplier</span><span class="qr-label-val">${r.supplier||'—'}</span></div>
    <div class="qr-label-row qr-id-row"><span class="qr-label-key">ID</span><span class="qr-label-val" style="font-family:monospace;font-size:.7rem">${r.id}</span></div>`;

  // Set logo in label
  const labelLogo = document.getElementById('qr-label-logo');
  if (labelLogo && typeof MEDSYS_LOGO !== 'undefined') labelLogo.src = MEDSYS_LOGO;

  preview.classList.remove('hidden');
}

function downloadQR() {
  if (!currentQRReagent) return;
  const labelEl = document.getElementById('qr-label-printable');

  // Use html2canvas-style approach: render to a canvas
  const canvas  = document.createElement('canvas');
  const scale   = 2;
  canvas.width  = 260 * scale;
  canvas.height = 360 * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.roundRect(0, 0, 260, 360, 10);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#1e5aba';
  ctx.lineWidth = 2;
  ctx.roundRect(1, 1, 258, 358, 10);
  ctx.stroke();

  // Header background
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, 260, 52);

  // Header top-left radius
  ctx.beginPath();
  ctx.moveTo(10, 0); ctx.lineTo(250, 0); ctx.arcTo(260,0,260,10,10);
  ctx.lineTo(260,52); ctx.lineTo(0,52); ctx.lineTo(0,10); ctx.arcTo(0,0,10,0,10);
  ctx.closePath();
  ctx.fillStyle = '#0a1628'; ctx.fill();

  // Header text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('MedSys', 56, 22);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#6fa0f0';
  ctx.fillText('REGIS · Reagent Label', 56, 36);

  // Logo circle placeholder
  ctx.beginPath();
  ctx.arc(30, 26, 18, 0, Math.PI*2);
  ctx.fillStyle = '#1a3a6e'; ctx.fill();
  ctx.strokeStyle = '#3b7de8'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Rx', 30, 30);
  ctx.textAlign = 'left';

  // QR code from the rendered img
  const qrImg = labelEl.querySelector('#qr-code-container img');
  if (qrImg && qrImg.complete) {
    ctx.drawImage(qrImg, 50, 62, 160, 160);
  }

  // Reagent info
  const r   = currentQRReagent;
  const rows = [
    ['Reagent', r.name],
    ['Category', r.category],
    ['Lot No.', r.lot],
    ['Expiry', r.expiry],
    ['Supplier', r.supplier || '—'],
    ['ID', r.id]
  ];
  ctx.fillStyle = '#0f172a';
  let y = 240;
  rows.forEach(([key, val]) => {
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(key.toUpperCase(), 16, y);
    ctx.font = val.length > 24 ? '9px sans-serif' : '10px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(val.length > 28 ? val.slice(0,28)+'…' : val, 80, y);
    y += 16;
  });

  // Footer
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 340, 260, 20);
  ctx.font = '8px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText('MedSys REGIS · Reagent Inventory System · Scan with MedSys app', 130, 353);

  const link = document.createElement('a');
  link.download = `REGIS_QR_${r.name.replace(/\s+/g,'_')}_${r.lot}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast(`QR label downloaded for ${r.name}`, 'success');
  DB.logActivity('update', `Generated QR label: ${r.name} (${r.id})`);
}

// ════════════════════════════════════════════
// REPORTS
// ════════════════════════════════════════════
let statusChart = null, categoryChart = null;

function renderReports() {
  const reagents = DB.getReagents();
  const normal   = reagents.filter(r => computeStatus(r) === 'normal').length;
  const low      = reagents.filter(r => computeStatus(r) === 'low').length;
  const critical = reagents.filter(r => computeStatus(r) === 'critical').length;

  if (statusChart)   statusChart.destroy();
  if (categoryChart) categoryChart.destroy();

  statusChart = new Chart(document.getElementById('chart-status'), {
    type: 'doughnut',
    data: {
      labels: ['Normal','Low Stock','Critical'],
      datasets: [{ data: [normal,low,critical], backgroundColor: ['#22c55e','#f59e0b','#ef4444'], borderWidth: 0 }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  const cats    = ['Hematology','Chemistry','Microbiology','Immunology','Urinalysis'];
  const catQtys = cats.map(c => reagents.filter(r => r.category === c).reduce((a,r) => a+r.qty, 0));
  categoryChart = new Chart(document.getElementById('chart-category'), {
    type: 'bar',
    data: {
      labels: cats,
      datasets: [{ label: 'Total Quantity', data: catQtys, backgroundColor: '#3b7de8', borderRadius: 6 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  // Restocking
  const needRestock = reagents.filter(r => computeStatus(r) !== 'normal');
  document.getElementById('restock-count').textContent = `${needRestock.length} item${needRestock.length!==1?'s':''}`;
  document.getElementById('restock-tbody').innerHTML = needRestock.length
    ? needRestock.map(r => {
        const st = computeStatus(r);
        return `<tr>
          <td><strong>${r.name}</strong></td><td>${r.category}</td>
          <td style="font-weight:600;color:${st==='critical'?'var(--red-600)':'var(--amber-500)'}">${r.qty} ${r.unit}</td>
          <td>${r.min} ${r.unit}</td>
          <td><span class="status-badge ${st}">${st}</span></td>
          <td>${st==='critical'?'🔴 Order Immediately':'🟡 Order Soon'}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:20px">All reagents adequately stocked.</td></tr>';

  // Expiry
  const expiry60 = [...reagents].sort((a,b)=>new Date(a.expiry)-new Date(b.expiry)).filter(r=>daysUntilExpiry(r.expiry)<=60);
  document.getElementById('expiry-count').textContent = `${expiry60.length} item${expiry60.length!==1?'s':''}`;
  document.getElementById('expiry-tbody').innerHTML = expiry60.length
    ? expiry60.map(r => {
        const days = daysUntilExpiry(r.expiry);
        const cls  = days<0?'critical':days<=14?'critical':'low';
        return `<tr>
          <td><strong>${r.name}</strong></td>
          <td><code style="font-size:.78rem">${r.lot}</code></td>
          <td>${r.expiry}</td>
          <td style="font-weight:600">${days<0?`${Math.abs(days)} days ago`:days+' days'}</td>
          <td><span class="status-badge ${cls}">${days<0?'❌ Expired':days<=14?'🔴 Urgent':'⚠ Soon'}</span></td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:20px">No reagents expiring within 60 days.</td></tr>';

  // History
  const history  = DB.getHistory();
  const histList = document.getElementById('history-list');
  histList.innerHTML = history.length
    ? history.map(h=>`
        <div class="activity-item">
          <span class="activity-dot ${h.type}"></span>
          <span class="activity-text">${h.message}</span>
          <span class="activity-time">${timeAgo(h.ts)}</span>
        </div>`).join('')
    : '<p class="text-muted small" style="padding:10px">No history yet.</p>';
}

function clearHistory() {
  if (!confirm('Clear all usage history?')) return;
  DB.saveHistory([]);
  renderReports();
}

function exportCSV() {
  const reagents = DB.getReagents();
  const headers  = ['ID','Name','Category','Quantity','Unit','Status','Expiry Date','Lot Number','Supplier','Min Threshold','Notes'];
  const rows     = reagents.map(r => [r.id,`"${r.name}"`,r.category,r.qty,r.unit,computeStatus(r),r.expiry,r.lot,r.supplier,r.min,`"${r.notes}"`]);
  const csv      = [headers,...rows].map(r=>r.join(',')).join('\n');
  const blob     = new Blob([csv],{type:'text/csv'});
  const a        = document.createElement('a');
  a.href         = URL.createObjectURL(blob);
  a.download     = `MedSys_REGIS_Inventory_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('CSV exported.','success');
  DB.logActivity('update','Exported REGIS inventory report as CSV');
}

function printReport() { window.print(); }

// ════════════════════════════════════════════
// MODALS
// ════════════════════════════════════════════
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function closeModalOnOverlay(e, id) { if (e.target.id===id) closeModal(id); }
document.addEventListener('keydown', e => {
  if (e.key==='Escape') document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m=>m.classList.add('hidden'));
});

// ════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════
let toastTimer = null;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type}`;
  t.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.add('hidden'), 3200);
}

// ════════════════════════════════════════════
// SHAKE ANIMATION
// ════════════════════════════════════════════
function shake(el) {
  el.style.animation='none';
  setTimeout(()=>el.style.animation='shake .4s ease',10);
}
const _shakeStyle = document.createElement('style');
_shakeStyle.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`;
document.head.appendChild(_shakeStyle);

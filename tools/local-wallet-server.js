const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3141;
const API_BASE = 'https://pandoraip.live';
const DATA_DIR = path.join(process.env.USERPROFILE || process.env.HOME || os.tmpdir(), '.horton-dec');
const CONFIG_FILE = path.join(DATA_DIR, 'install-state.json');
const WALLET_STATE_FILE = path.join(DATA_DIR, 'wallet-state.json');

function loadInstallState() {
  try {
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (e) {}
  return null;
}

function loadWalletState() {
  try {
    if (fs.existsSync(WALLET_STATE_FILE)) return JSON.parse(fs.readFileSync(WALLET_STATE_FILE, 'utf-8'));
  } catch (e) {}
  return {};
}

function saveWalletState(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(WALLET_STATE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
}

function getPopupHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DEC Tracker — Localhost Wallet</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:100%; max-width:420px; margin:0 auto; min-height:100vh; font-family:Arial,Helvetica,sans-serif; background:#fff; color:#1a1a1a; }

.header { background:#1a2e1a; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; }
.header-left { display:flex; align-items:center; gap:10px; }
.logo { width:26px; height:26px; background:#2c5f4a; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.logo svg { width:14px; height:14px; }
.header-title { color:#fff; font-size:14px; font-weight:700; letter-spacing:0.5px; }
.mesh-badge { font-size:9px; padding:3px 8px; border-radius:10px; font-weight:700; background:#22c55e; color:#000; }
.role-badge { font-size:9px; padding:3px 8px; border-radius:10px; font-weight:700; margin-left:6px; }
.role-beta { background:#dbeafe; color:#1e40af; }
.role-admin { background:#fce7f3; color:#be185d; }
.role-banker { background:#d1fae5; color:#065f46; }

.wallet-id { background:#f0f7f3; padding:6px 18px; font-size:9px; color:#666; font-family:monospace; letter-spacing:0.5px; border-bottom:1px solid #e5e5e5; display:flex; justify-content:space-between; align-items:center; }
.copy-btn { font-size:9px; color:#2c5f4a; cursor:pointer; font-weight:700; }

.balance-card { padding:18px; background:#fff; border-bottom:1px solid #eee; }
.balance-row { display:flex; gap:10px; margin-bottom:14px; }
.bal-box { flex:1; background:#f7faf8; border:1px solid #d4e8dc; border-radius:6px; padding:10px; text-align:center; }
.bal-label { font-size:8px; text-transform:uppercase; letter-spacing:1.5px; color:#666; font-weight:700; margin-bottom:3px; }
.bal-value { font-size:20px; font-weight:900; color:#1a1a1a; }
.bal-nc { border-left:3px solid #2c5f4a; }
.bal-wc { border-left:3px solid #1a6b9a; }

.lorax-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.lorax-bar-wrap { flex:1; height:8px; background:#eee; border-radius:4px; overflow:hidden; }
.lorax-bar { height:100%; border-radius:4px; transition:width 0.5s; }
.lorax-label { font-size:9px; color:#666; font-weight:700; letter-spacing:1px; text-transform:uppercase; white-space:nowrap; }
.lorax-value { font-size:13px; font-weight:900; color:#2c5f4a; min-width:40px; text-align:right; }

.stats-row { display:flex; gap:8px; }
.stat-box { flex:1; background:#fffbeb; border:1px solid #fde68a; border-radius:4px; padding:6px 8px; text-align:center; }
.stat-label { font-size:7px; text-transform:uppercase; letter-spacing:1px; color:#92400e; font-weight:700; }
.stat-value { font-size:12px; font-weight:900; color:#b45309; }

.tabs { display:flex; border-bottom:2px solid #eee; overflow-x:auto; }
.tab { flex:none; text-align:center; padding:8px 10px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#999; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; transition:all 0.2s; white-space:nowrap; }
.tab.active { color:#2c5f4a; border-bottom-color:#2c5f4a; }
.tab:hover { color:#2c5f4a; }
.tab.locked { opacity:0.3; pointer-events:none; }

.tab-content { display:none; }
.tab-content.active { display:block; }

.panel { padding:14px 18px; }
.panel h3 { font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#666; font-weight:700; margin-bottom:10px; }
.panel-hint { font-size:10px; color:#888; line-height:1.5; margin-top:6px; }

.row { display:flex; gap:8px; margin-bottom:8px; }
.input { flex:1; padding:8px 10px; border:1px solid #ddd; border-radius:4px; font-size:11px; font-family:Arial; }
.input:focus { outline:none; border-color:#2c5f4a; }
.btn { padding:8px 14px; background:#2c5f4a; color:#fff; border:none; border-radius:4px; font-size:10px; font-weight:700; cursor:pointer; white-space:nowrap; }
.btn:hover { background:#1f4535; }
.btn.secondary { background:#fff; color:#2c5f4a; border:1px solid #2c5f4a; }
.btn.secondary:hover { background:#f0f7f3; }
.btn.full { width:100%; margin-top:4px; }
.btn.danger { background:#dc2626; }

textarea.input { min-height:60px; resize:vertical; width:100%; }

.tx-list { max-height:300px; overflow-y:auto; }
.tx-item { padding:8px 18px; border-bottom:1px solid #f5f5f5; display:flex; justify-content:space-between; align-items:center; }
.tx-item:hover { background:#f9fafb; }
.tx-label { font-size:11px; color:#333; font-weight:600; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tx-meta { font-size:8px; color:#999; margin-top:2px; }
.tx-amount { font-size:12px; font-weight:700; text-align:right; }
.tx-amount.positive { color:#16a34a; }
.tx-amount.negative { color:#dc2626; }
.tx-yopp { font-size:7px; padding:2px 5px; border-radius:3px; background:#fef3c7; color:#92400e; font-weight:700; margin-top:2px; display:inline-block; }

.empty-state { padding:30px 18px; text-align:center; color:#999; font-size:11px; line-height:1.6; }

.deal-item { padding:10px 18px; border-bottom:1px solid #f0f0f0; }
.deal-title { font-size:12px; font-weight:700; color:#1a1a1a; }
.deal-meta { font-size:9px; color:#888; margin-top:2px; }
.deal-status { font-size:8px; padding:2px 6px; border-radius:3px; font-weight:700; text-transform:uppercase; display:inline-block; margin-top:4px; }
.deal-status.draft { background:#e0e7ff; color:#3730a3; }
.deal-status.active { background:#d1fae5; color:#065f46; }
.deal-status.settled { background:#fef3c7; color:#92400e; }

.circle-item { padding:10px 18px; border-bottom:1px solid #f0f0f0; }
.circle-name { font-size:12px; font-weight:700; color:#1a1a1a; }
.circle-meta { font-size:9px; color:#888; margin-top:2px; }

.footer { padding:8px 18px; background:#f9f9f9; border-top:1px solid #eee; display:flex; justify-content:space-between; align-items:center; }
.footer-link { font-size:9px; color:#2c5f4a; text-decoration:none; font-weight:600; }
.footer-version { font-size:8px; color:#bbb; }

.toast { position:fixed; bottom:12px; left:12px; right:12px; background:#1a2e1a; color:#fff; padding:10px 14px; border-radius:6px; font-size:10px; font-weight:600; text-align:center; transform:translateY(60px); opacity:0; transition:all 0.3s; z-index:100; max-width:400px; margin:0 auto; }
.toast.show { transform:translateY(0); opacity:1; }

.auth-page { padding:24px 20px; text-align:center; }
.auth-page h1 { color:#2c5f4a; font-size:20px; margin-bottom:4px; }
.auth-page .subtitle { color:#888; font-size:11px; margin-bottom:20px; }
.auth-page .input { margin-bottom:8px; width:100%; }
.auth-toggle { font-size:10px; color:#2c5f4a; cursor:pointer; font-weight:600; margin-top:12px; }
.hidden { display:none; }
.localhost-bar { background:#0d1b2a; color:#64748b; font-size:9px; text-align:center; padding:4px; letter-spacing:1px; }
</style>
</head>
<body>

<div class="localhost-bar">LOCALHOST:${PORT} &mdash; DEC SOVEREIGN WALLET</div>

<div id="auth-page" class="auth-page">
  <div class="logo" style="margin:0 auto 12px;width:40px;height:40px"><svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg></div>
  <h1>DEC Tracker</h1>
  <p class="subtitle">Sovereign wallet built on trust law</p>

  <div id="login-form">
    <input class="input" id="login-email" type="email" placeholder="Email" />
    <button class="btn full" id="login-btn">Sign In</button>
    <p class="auth-toggle" id="show-register">New user? Register</p>
  </div>

  <div id="register-form" class="hidden">
    <input class="input" id="reg-name" placeholder="Full Name" />
    <input class="input" id="reg-email" type="email" placeholder="Email" />
    <input class="input" id="reg-zip" placeholder="ZIP Code (optional)" />
    <input class="input" id="reg-phone" placeholder="Phone (optional)" />
    <button class="btn full" id="register-btn">Register</button>
    <p class="auth-toggle" id="show-login">Already registered? Sign in</p>
  </div>
</div>

<div id="wallet-page" class="hidden">

<div class="header">
  <div class="header-left">
    <div class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg></div>
    <span class="header-title">DEC Tracker</span>
    <span id="role-badge" class="role-badge role-beta">BETA</span>
  </div>
  <span class="mesh-badge">MESH LIVE</span>
</div>

<div class="wallet-id">
  <span id="wallet-id-text">DEC-...</span>
  <span class="copy-btn" id="copy-id-btn">COPY</span>
</div>

<div class="balance-card">
  <div class="balance-row">
    <div class="bal-box bal-nc">
      <div class="bal-label">NC Balance</div>
      <div class="bal-value" id="nc-balance">0.00</div>
    </div>
    <div class="bal-box bal-wc">
      <div class="bal-label">WC Balance</div>
      <div class="bal-value" id="wc-balance">0.00</div>
    </div>
  </div>
  <div class="lorax-row">
    <span class="lorax-label">LORAX</span>
    <div class="lorax-bar-wrap"><div class="lorax-bar" id="lorax-bar" style="width:0%;background:linear-gradient(90deg,#2c5f4a,#4ade80)"></div></div>
    <span class="lorax-value" id="lorax-value">+0.0</span>
  </div>
  <div class="stats-row">
    <div class="stat-box">
      <div class="stat-label">95% Cashback</div>
      <div class="stat-value" id="cashback-total">$0.00</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Tax Abated</div>
      <div class="stat-value" id="tax-total">$0.00</div>
    </div>
  </div>
</div>

<div class="tabs" id="tabs">
  <div class="tab active" data-tab="history">History</div>
  <div class="tab" data-tab="receipt">Receipt</div>
  <div class="tab" data-tab="deposit">Deposit</div>
  <div class="tab" data-tab="send">Send</div>
  <div class="tab" data-tab="deals">Deals</div>
  <div class="tab" data-tab="circles">Circles</div>
  <div class="tab" data-tab="portfolio">Portfolio</div>
  <div class="tab" data-tab="bank">Bank</div>
  <div class="tab" data-tab="cell">Cell</div>
  <div class="tab" data-tab="settings">Settings</div>
</div>

<div id="tab-history" class="tab-content active">
  <div class="tx-list" id="tx-list">
    <div class="empty-state" id="tx-empty">No transactions yet.<br>Scan a receipt or make a deposit to get started.</div>
  </div>
</div>

<div id="tab-receipt" class="tab-content">
  <div class="panel">
    <h3>Scan Receipt</h3>
    <textarea class="input" id="receipt-text" placeholder="Paste receipt text here — or type merchant, items, and total"></textarea>
    <button class="btn full" id="scan-receipt-btn">Scan with AI</button>
    <div class="panel-hint">AI reads every line item, classifies each as Need or Want, and credits your wallet with 95% cashback.</div>
    <div style="margin-top:12px;border-top:1px solid #eee;padding-top:12px">
      <h3>Paste Statement</h3>
      <textarea class="input" id="statement-text" placeholder="Paste bank statement text — AI parses dates, merchants, amounts"></textarea>
      <button class="btn full secondary" id="parse-statement-btn">Import Statement</button>
    </div>
  </div>
</div>

<div id="tab-deposit" class="tab-content">
  <div class="panel">
    <h3>Fund Your Wallet</h3>
    <div class="row">
      <input class="input" id="deposit-amount" type="number" step="1" min="1" placeholder="Amount (USD)" />
      <button class="btn" id="deposit-btn">Deposit</button>
    </div>
    <div class="panel-hint">Deposits processed via Stripe. 5% static cost, remainder split NC/WC by LORAX score. Full DAI math on every transaction.</div>
  </div>
</div>

<div id="tab-send" class="tab-content">
  <div class="panel">
    <h3>Send / Transfer</h3>
    <div class="row">
      <input class="input" id="send-recipient" placeholder="Recipient wallet ID or email" />
    </div>
    <div class="row">
      <input class="input" id="send-amount" type="number" step="0.01" min="0.01" placeholder="Amount" />
      <button class="btn" id="send-btn">Send</button>
    </div>
    <div class="panel-hint">YOPP: Receiver must confirm before transfer completes. Funds transfer through your bank — Zelle, internal, or ACH.</div>
  </div>
</div>

<div id="tab-deals" class="tab-content">
  <div class="panel">
    <h3>Create a Deal</h3>
    <input class="input" id="deal-title" placeholder="What's the deal? (e.g., Split solar panels)" style="width:100%;margin-bottom:8px" />
    <div class="row">
      <input class="input" id="deal-amount" type="number" step="0.01" placeholder="Total amount" />
      <button class="btn" id="create-deal-btn">Create</button>
    </div>
    <div style="margin-top:10px;display:flex;gap:6px">
      <button class="btn secondary" id="tap-create-btn" style="flex:1;font-size:9px">Generate Tap Code</button>
      <input class="input" id="tap-join-code" placeholder="4-digit code" style="width:80px" />
      <button class="btn secondary" id="tap-join-btn" style="font-size:9px">Join</button>
    </div>
    <div class="panel-hint" id="tap-code-display"></div>
  </div>
  <div id="deals-list"></div>
</div>

<div id="tab-circles" class="tab-content">
  <div class="panel">
    <h3>FFF Shopping Circles</h3>
    <div class="row">
      <input class="input" id="circle-name-input" placeholder="Circle name" />
      <button class="btn" id="create-circle-btn">Create</button>
    </div>
    <div class="row">
      <input class="input" id="circle-invite-code" placeholder="Invite code" />
      <button class="btn secondary" id="join-circle-btn">Join</button>
    </div>
  </div>
  <div id="circles-list"></div>
</div>

<div id="tab-portfolio" class="tab-content">
  <div class="panel">
    <h3>Investment Portfolio</h3>
    <div id="portfolio-summary" style="margin-bottom:10px">
      <div class="row">
        <div class="stat-box" style="flex:1"><div class="stat-label">Total Value</div><div class="stat-value" id="portfolio-value">$0.00</div></div>
        <div class="stat-box" style="flex:1"><div class="stat-label">EMV</div><div class="stat-value" id="portfolio-emv">$0.00</div></div>
      </div>
    </div>
  </div>
  <div id="portfolio-list"></div>
</div>

<div id="tab-bank" class="tab-content">
  <div class="panel">
    <h3>Syndicate Bank Account</h3>
    <label style="font-size:10px;color:#666;font-weight:700;display:block;margin-bottom:3px">Bank Name</label>
    <input class="input" id="bank-name" placeholder="e.g., First National Bank" style="width:100%;margin-bottom:8px" />
    <label style="font-size:10px;color:#666;font-weight:700;display:block;margin-bottom:3px">Your Account Number</label>
    <input class="input" id="bank-account" placeholder="Your personal account number" style="width:100%;margin-bottom:8px" />
    <label style="font-size:10px;color:#666;font-weight:700;display:block;margin-bottom:3px">Trust Corpus Account Number</label>
    <input class="input" id="corpus-account" placeholder="Corpus account at same bank" style="width:100%;margin-bottom:8px" />
    <button class="btn full" id="save-bank-btn">Save Bank Info</button>
    <div class="panel-hint">Deposit half to your account, half to the Trust Corpus account. The DEC records the 50/50 split. Transfers between users go through your bank — Zelle, ACH, or internal transfer.</div>
  </div>
</div>

<div id="tab-cell" class="tab-content">
  <div class="panel">
    <h3>DEC Cell — Domain Lens</h3>
    <p class="panel-hint" style="margin-bottom:10px">Your DEC Cell adapts to different domains. Switch lens to change how your wallet behaves.</p>
    <div id="cell-domains" style="display:grid;grid-template-columns:1fr 1fr;gap:6px"></div>
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #eee">
      <div class="row">
        <div class="stat-box" style="flex:1"><div class="stat-label">Cell Level</div><div class="stat-value" id="cell-level">1</div></div>
        <div class="stat-box" style="flex:1"><div class="stat-label">Local Nodes</div><div class="stat-value" id="cell-local">9</div></div>
        <div class="stat-box" style="flex:1"><div class="stat-label">Regional</div><div class="stat-value" id="cell-regional">81</div></div>
      </div>
    </div>
  </div>
</div>

<div id="tab-settings" class="tab-content">
  <div class="panel">
    <h3>Account</h3>
    <label style="font-size:10px;color:#666;font-weight:700;display:block;margin-bottom:3px">Display Name</label>
    <input class="input" id="settings-name" placeholder="Your name" style="width:100%;margin-bottom:8px" />
    <label style="font-size:10px;color:#666;font-weight:700;display:block;margin-bottom:3px">Email</label>
    <input class="input" id="settings-email" readonly style="background:#f5f5f5;color:#999;width:100%;margin-bottom:8px" />
    <label style="font-size:10px;color:#666;font-weight:700;display:block;margin-bottom:3px">Wallet ID</label>
    <input class="input" id="settings-wallet-id" readonly style="background:#f5f5f5;color:#999;width:100%;margin-bottom:8px" />
    <button class="btn full" id="save-settings-btn">Save Settings</button>
    <button class="btn full danger" id="logout-btn" style="margin-top:8px">Sign Out</button>
  </div>
</div>

<div class="footer">
  <a href="https://pandoraip.org" target="_blank" class="footer-link">pandoraip.org</a>
  <a href="https://pandoraip.org/register.html" target="_blank" class="footer-link">Register</a>
  <a href="https://pandoraip.live" target="_blank" class="footer-link">Dashboard</a>
  <span class="footer-version">v2.0.0 localhost</span>
</div>

</div>

<div class="toast" id="toast"></div>

<script>
const API = '${API_BASE}';
let state = {};

function $(id) { return document.getElementById(id); }

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function formatCurrency(n) {
  return (n < 0 ? '-' : '') + '$' + Math.abs(n).toFixed(2);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

async function api(method, path, body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const resp = await fetch(API + path, opts);
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return { error: 'Unexpected response format' };
    return await resp.json();
  } catch (e) {
    return { error: e.message };
  }
}

function showAuth() {
  $('auth-page').classList.remove('hidden');
  $('wallet-page').classList.add('hidden');
}

function showWallet() {
  $('auth-page').classList.add('hidden');
  $('wallet-page').classList.remove('hidden');
}

function saveLocal() {
  fetch('/api/save-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }).catch(() => {});
}

function updateTabVisibility() {
  const pages = state.unlockedPages || ['wallet'];
  const tabMap = {
    'history': true,
    'receipt': true,
    'deposit': true,
    'send': true,
    'deals': pages.includes('dealMaker') || pages.includes('deals') || (state.transactionCount || 0) > 0,
    'circles': pages.includes('circles') || pages.includes('fffCircles') || (state.deals || []).length > 0,
    'portfolio': pages.includes('portfolio') || (state.deals || []).length > 0,
    'bank': true,
    'cell': true,
    'settings': true
  };
  document.querySelectorAll('.tab').forEach(tab => {
    const name = tab.dataset.tab;
    if (tabMap[name] === false) tab.classList.add('locked');
    else tab.classList.remove('locked');
  });
}

function render() {
  $('wallet-id-text').textContent = state.walletId || 'DEC-...';
  $('nc-balance').textContent = (state.ncBalance || 0).toFixed(2);
  $('wc-balance').textContent = (state.wcBalance || 0).toFixed(2);

  const lorax = state.loraxScore || 0;
  $('lorax-value').textContent = (lorax >= 0 ? '+' : '') + lorax.toFixed(1);
  $('lorax-bar').style.width = Math.min(Math.abs(lorax) * 2, 100) + '%';
  $('lorax-bar').style.background = lorax >= 0 ? 'linear-gradient(90deg,#2c5f4a,#4ade80)' : 'linear-gradient(90deg,#dc2626,#f87171)';

  $('cashback-total').textContent = formatCurrency(state.totalCashback || 0);
  $('tax-total').textContent = formatCurrency(state.totalTaxAbated || 0);

  const badge = $('role-badge');
  const role = (state.role || 'beta').toLowerCase();
  badge.textContent = role.toUpperCase();
  badge.className = 'role-badge role-' + role;

  $('settings-name').value = state.displayName || '';
  $('settings-email').value = state.email || '';
  $('settings-wallet-id').value = state.walletId || '';

  $('bank-name').value = state.bankName || '';
  $('bank-account').value = state.bankAccountNumber || '';
  $('corpus-account').value = state.corpusAccountNumber || '';

  renderTransactions();
  renderDeals();
  renderCircles();
  renderPortfolio();
  updateTabVisibility();
}

function renderTransactions() {
  const list = $('tx-list');
  const empty = $('tx-empty');
  const txs = state.transactions || [];
  list.querySelectorAll('.tx-item').forEach(el => el.remove());
  if (txs.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  txs.forEach(tx => {
    const div = document.createElement('div');
    div.className = 'tx-item';
    const isPositive = (tx.amount || 0) >= 0;
    let yoppHtml = '';
    if (tx.yoppStatus) yoppHtml = '<div class="tx-yopp">YOPP: ' + esc(tx.yoppStatus).toUpperCase() + '</div>';
    let typeLabel = esc(tx.type || 'transaction');
    if (tx.ncAmount || tx.wcAmount) typeLabel += ' \\u00B7 NC ' + formatCurrency(tx.ncAmount || 0) + ' / WC ' + formatCurrency(tx.wcAmount || 0);
    div.innerHTML = '<div><div class="tx-label">' + esc(tx.label || 'Transaction') + '</div><div class="tx-meta">' + esc(formatDate(tx.timestamp)) + ' \\u00B7 ' + typeLabel + '</div>' + yoppHtml + '</div><div class="tx-amount ' + (isPositive ? 'positive' : 'negative') + '">' + formatCurrency(tx.amount || 0) + '</div>';
    list.appendChild(div);
  });
}

function renderDeals() {
  const list = $('deals-list');
  if (!list) return;
  list.innerHTML = '';
  const deals = state.deals || [];
  if (deals.length === 0) { list.innerHTML = '<div class="empty-state">No deals yet. Create one above or use Tap-to-Deal.</div>'; return; }
  deals.forEach(d => {
    const div = document.createElement('div');
    div.className = 'deal-item';
    const status = (d.status || 'draft').toLowerCase();
    div.innerHTML = '<div class="deal-title">' + esc(d.title || d.description || 'Deal') + '</div><div class="deal-meta">' + formatCurrency(d.totalAmount || 0) + ' \\u00B7 ' + esc(formatDate(d.createdAt)) + '</div><span class="deal-status ' + esc(status) + '">' + esc(status) + '</span>';
    list.appendChild(div);
  });
}

function renderCircles() {
  const list = $('circles-list');
  if (!list) return;
  list.innerHTML = '';
  const circles = state.circles || [];
  if (circles.length === 0) { list.innerHTML = '<div class="empty-state">No circles yet. Create one or join with an invite code.</div>'; return; }
  circles.forEach(c => {
    const div = document.createElement('div');
    div.className = 'circle-item';
    div.innerHTML = '<div class="circle-name">' + esc(c.name || 'Circle') + '</div><div class="circle-meta">' + esc((c.memberCount || 0) + ' members') + ' \\u00B7 Code: ' + esc(c.inviteCode || '\\u2014') + '</div>';
    list.appendChild(div);
  });
}

function renderPortfolio() {
  const pv = $('portfolio-value');
  const pe = $('portfolio-emv');
  const list = $('portfolio-list');
  if (!pv || !pe || !list) return;
  const p = state.portfolio || {};
  pv.textContent = formatCurrency(p.totalValue || 0);
  pe.textContent = formatCurrency(p.totalEmv || 0);
  list.innerHTML = '';
  const positions = p.positions || [];
  if (positions.length === 0) { list.innerHTML = '<div class="empty-state">Your settled deals become portfolio positions. Make a deal to start building equity.</div>'; return; }
  positions.forEach(pos => {
    const div = document.createElement('div');
    div.className = 'deal-item';
    div.innerHTML = '<div class="deal-title">' + esc(pos.title || 'Position') + '</div><div class="deal-meta">Value: ' + formatCurrency(pos.value || 0) + ' \\u00B7 EMV: ' + formatCurrency(pos.emv || 0) + '</div>';
    list.appendChild(div);
  });
}

async function syncFromServer() {
  if (!state.userId) return;
  try {
    const profile = await api('GET', '/api/dec-tracker/profile/' + state.userId);
    if (profile && !profile.error) {
      state.loraxScore = profile.loraxScore ?? state.loraxScore;
      state.ncBalance = parseFloat(profile.ncBalance || 0);
      state.wcBalance = parseFloat(profile.wcBalance || 0);
      state.totalCashback = parseFloat(profile.totalCashbackEarned || 0);
      state.totalTaxAbated = parseFloat(profile.totalTaxAbated || 0);
      state.role = profile.role || state.role;
      state.approved = profile.approved ?? state.approved;
      state.remoraPhase = profile.remoraVoicingProfile || state.remoraPhase;
      state.displayName = profile.displayName || state.displayName;
    }
  } catch (e) {}
}

async function fetchTransactions() {
  if (!state.userId) return;
  try {
    const txs = await api('GET', '/api/dec-tracker/transactions/' + state.userId);
    if (Array.isArray(txs)) {
      state.transactions = txs.slice(0, 50).map(t => ({
        id: t.id,
        type: t.transactionType || t.type || 'transaction',
        label: t.merchantName || t.description || t.type || 'Transaction',
        amount: parseFloat(t.totalAmount || t.amount || 0),
        ncAmount: parseFloat(t.ncAmount || 0),
        wcAmount: parseFloat(t.wcAmount || 0),
        cashback: parseFloat(t.cashbackAmount || 0),
        timestamp: t.createdAt || t.timestamp,
        yoppStatus: t.yoppStatus
      }));
      state.transactionCount = state.transactions.length;
    }
  } catch (e) {}
}

async function fetchUnlockedPages() {
  if (!state.userId) return;
  try {
    const result = await api('GET', '/api/dec-tracker/unlocked-pages/' + state.userId);
    if (result && Array.isArray(result.unlockedPages)) {
      state.unlockedPages = result.unlockedPages;
    }
  } catch (e) {}
}

async function loadCellTab() {
  if (!state.userId) return;
  try {
    let data = await api('GET', '/api/dec-cell/' + state.userId);
    if (data.error) {
      await api('POST', '/api/dec-cell/create', { userId: state.userId, activeDomain: 'general', domains: ['general', 'banking', 'shopping', 'investment'] });
      data = await api('GET', '/api/dec-cell/' + state.userId);
    }
    const container = $('cell-domains');
    if (container && data.availableDomains) {
      container.innerHTML = data.availableDomains.map(d => {
        const active = d.key === data.activeDomain;
        return '<div style="padding:10px 8px;border-radius:6px;cursor:pointer;text-align:center;border:2px solid ' + (active ? esc(d.color) : '#eee') + ';background:' + (active ? esc(d.color) + '15' : '#fff') + '" data-domain="' + esc(d.key) + '"><div style="font-size:11px;font-weight:700;color:' + (active ? esc(d.color) : '#666') + '">' + esc(d.label) + '</div><div style="font-size:8px;color:#999;margin-top:2px">' + esc((d.features || []).slice(0, 2).join(', ')) + '</div></div>';
      }).join('');
      container.querySelectorAll('[data-domain]').forEach(el => {
        el.addEventListener('click', async () => {
          const domain = el.getAttribute('data-domain');
          await api('PUT', '/api/dec-cell/' + state.userId + '/domain', { domain });
          showToast('Switched to ' + domain + ' lens');
          loadCellTab();
        });
      });
    }
    if ($('cell-level')) $('cell-level').textContent = data.cellLevel || 1;
    if ($('cell-local')) $('cell-local').textContent = data.hierarchy ? data.hierarchy.local : 9;
    if ($('cell-regional')) $('cell-regional').textContent = data.hierarchy ? data.hierarchy.regional : 81;
  } catch (e) {}
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', async () => {
    if (tab.classList.contains('locked')) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    $('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'cell') loadCellTab();
    if (tab.dataset.tab === 'deals') {
      const deals = await api('GET', '/api/dec-tracker/deals/' + state.userId);
      if (Array.isArray(deals)) { state.deals = deals; saveLocal(); renderDeals(); }
    }
    if (tab.dataset.tab === 'circles') {
      const circles = await api('GET', '/api/dec-tracker/circles/' + state.userId);
      if (Array.isArray(circles)) { state.circles = circles; saveLocal(); renderCircles(); }
    }
    if (tab.dataset.tab === 'portfolio') {
      const portfolio = await api('GET', '/api/dec-tracker/portfolio/' + state.userId);
      if (portfolio && !portfolio.error) { state.portfolio = portfolio; saveLocal(); renderPortfolio(); }
    }
  });
});

$('copy-id-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(state.walletId || '').then(() => showToast('Wallet ID copied'));
});

$('show-register').addEventListener('click', () => {
  $('login-form').classList.add('hidden');
  $('register-form').classList.remove('hidden');
});

$('show-login').addEventListener('click', () => {
  $('register-form').classList.add('hidden');
  $('login-form').classList.remove('hidden');
});

$('login-btn').addEventListener('click', async () => {
  const email = $('login-email').value.trim();
  if (!email) { showToast('Enter your email'); return; }
  const r = await api('POST', '/api/dec-tracker/login-email', { email });
  if (r.error) { showToast(r.error); return; }
  const userId = r.userId || (r.user && r.user.id);
  state.userId = userId;
  state.walletId = r.walletId || state.walletId;
  state.displayName = r.name || (r.user && r.user.name) || '';
  state.email = email;
  state.approved = r.approved ?? true;
  state.role = r.role || (r.user && r.user.role) || 'beta';
  state.createdAt = r.createdAt || state.createdAt;
  await syncFromServer();
  await fetchTransactions();
  await fetchUnlockedPages();
  saveLocal();
  showWallet();
  render();
  showToast('Welcome back, ' + (state.displayName || 'user'));
});

$('register-btn').addEventListener('click', async () => {
  const name = $('reg-name').value.trim();
  const email = $('reg-email').value.trim();
  const zipCode = $('reg-zip').value.trim();
  const phone = $('reg-phone').value.trim();
  if (!name || !email) { showToast('Name and email required'); return; }
  const r = await api('POST', '/api/dec-tracker/register', { name, email, zipCode, phone });
  if (r.error) { showToast(r.error); return; }
  const userId = r.userId || (r.user && r.user.id);
  state.userId = userId;
  state.walletId = r.walletId || ('DEC-' + Date.now().toString(36).toUpperCase());
  state.displayName = name;
  state.email = email;
  state.approved = r.approved ?? false;
  state.role = r.role || 'beta';
  state.createdAt = new Date().toISOString();
  state.unlockedPages = ['wallet'];
  state.transactions = [];
  state.deals = [];
  state.circles = [];
  state.portfolio = {};
  saveLocal();
  showWallet();
  render();
  showToast('Registered! Welcome to DEC.');
});

$('deposit-btn').addEventListener('click', async () => {
  const amount = parseFloat($('deposit-amount').value);
  if (!amount || amount < 1) { showToast('Enter amount ($1 minimum)'); return; }
  if (!state.userId) { showToast('Not logged in'); return; }
  const r = await api('POST', '/api/dec-tracker/deposit/create-session', { userId: state.userId, amount });
  if (r.error) { showToast(r.error); return; }
  if (r.url) { window.open(r.url, '_blank'); showToast('Opening Stripe checkout...'); }
});

$('send-btn').addEventListener('click', async () => {
  const recipient = $('send-recipient').value.trim();
  const amount = parseFloat($('send-amount').value);
  if (!recipient) { showToast('Enter a recipient'); return; }
  if (!amount || amount <= 0) { showToast('Enter a valid amount'); return; }
  if (!state.userId) { showToast('Not logged in'); return; }
  const r = await api('POST', '/api/dec-tracker/transactions', {
    userId: state.userId,
    transactionType: 'transfer',
    description: 'Transfer to ' + recipient,
    totalAmount: amount,
    recipientId: recipient,
    merchantName: 'Transfer'
  });
  if (r.error) { showToast(r.error); return; }
  await syncFromServer();
  await fetchTransactions();
  $('send-recipient').value = '';
  $('send-amount').value = '';
  saveLocal();
  render();
  showToast('Transfer sent — awaiting YOPP confirmation');
});

$('scan-receipt-btn').addEventListener('click', async () => {
  const text = $('receipt-text').value.trim();
  if (!text) { showToast('Paste receipt text first'); return; }
  if (!state.userId) { showToast('Not logged in'); return; }
  showToast('Scanning with AI...');
  const r = await api('POST', '/api/dec-tracker/scan-receipt', { userId: state.userId, receiptText: text });
  if (r && r.error) { showToast(r.error); return; }
  await syncFromServer();
  await fetchTransactions();
  $('receipt-text').value = '';
  saveLocal();
  render();
  showToast('Receipt scanned — cashback applied');
});

$('parse-statement-btn').addEventListener('click', async () => {
  const text = $('statement-text').value.trim();
  if (!text) { showToast('Paste statement text first'); return; }
  if (!state.userId) { showToast('Not logged in'); return; }
  showToast('Parsing statement...');
  const r = await api('POST', '/api/dec-tracker/parse-statement', { userId: state.userId, statementText: text });
  if (r && r.error) { showToast(r.error); return; }
  await syncFromServer();
  await fetchTransactions();
  $('statement-text').value = '';
  saveLocal();
  render();
  showToast('Statement imported');
});

$('create-deal-btn').addEventListener('click', async () => {
  const title = $('deal-title').value.trim();
  const amount = parseFloat($('deal-amount').value);
  if (!title) { showToast('Enter a deal description'); return; }
  if (!state.userId) { showToast('Not logged in'); return; }
  const r = await api('POST', '/api/dec-tracker/deals', { userId: state.userId, title, totalAmount: amount || 0, description: title });
  if (r && r.error) { showToast(r.error); return; }
  const deals = await api('GET', '/api/dec-tracker/deals/' + state.userId);
  if (Array.isArray(deals)) state.deals = deals;
  $('deal-title').value = '';
  $('deal-amount').value = '';
  saveLocal();
  render();
  showToast('Deal created');
});

$('tap-create-btn').addEventListener('click', async () => {
  if (!state.userId) { showToast('Not logged in'); return; }
  const r = await api('POST', '/api/dec-tracker/deals/tap/create-code', { userId: state.userId });
  if (r && r.error) { showToast(r.error); return; }
  const code = r.code || r.tapCode || '----';
  $('tap-code-display').textContent = 'Your Tap Code: ' + code + ' (expires in 5 minutes)';
  showToast('Tap code: ' + code);
});

$('tap-join-btn').addEventListener('click', async () => {
  const code = $('tap-join-code').value.trim();
  if (!code) { showToast('Enter a 4-digit code'); return; }
  if (!state.userId) { showToast('Not logged in'); return; }
  const r = await api('POST', '/api/dec-tracker/deals/tap/join', { userId: state.userId, code });
  if (r && r.error) { showToast(r.error); return; }
  const deals = await api('GET', '/api/dec-tracker/deals/' + state.userId);
  if (Array.isArray(deals)) state.deals = deals;
  $('tap-join-code').value = '';
  saveLocal();
  render();
  showToast('Joined deal via Tap code');
});

$('create-circle-btn').addEventListener('click', async () => {
  const name = $('circle-name-input').value.trim();
  if (!name) { showToast('Enter a circle name'); return; }
  if (!state.userId) { showToast('Not logged in'); return; }
  const r = await api('POST', '/api/dec-tracker/circles/create', { userId: state.userId, name });
  if (r && r.error) { showToast(r.error); return; }
  const circles = await api('GET', '/api/dec-tracker/circles/' + state.userId);
  if (Array.isArray(circles)) state.circles = circles;
  $('circle-name-input').value = '';
  saveLocal();
  render();
  showToast('Circle created');
});

$('join-circle-btn').addEventListener('click', async () => {
  const code = $('circle-invite-code').value.trim();
  if (!code) { showToast('Enter an invite code'); return; }
  if (!state.userId) { showToast('Not logged in'); return; }
  const r = await api('POST', '/api/dec-tracker/circles/join', { userId: state.userId, inviteCode: code });
  if (r && r.error) { showToast(r.error); return; }
  const circles = await api('GET', '/api/dec-tracker/circles/' + state.userId);
  if (Array.isArray(circles)) state.circles = circles;
  $('circle-invite-code').value = '';
  saveLocal();
  render();
  showToast('Joined circle');
});

$('save-bank-btn').addEventListener('click', () => {
  state.bankName = $('bank-name').value.trim();
  state.bankAccountNumber = $('bank-account').value.trim();
  state.corpusAccountNumber = $('corpus-account').value.trim();
  saveLocal();
  render();
  showToast('Bank info saved');
});

$('save-settings-btn').addEventListener('click', async () => {
  const displayName = $('settings-name').value.trim();
  state.displayName = displayName;
  if (state.userId) {
    await api('PUT', '/api/dec-tracker/profile/' + state.userId, { displayName });
  }
  saveLocal();
  render();
  showToast('Settings saved');
});

$('logout-btn').addEventListener('click', () => {
  state = {};
  saveLocal();
  showAuth();
  showToast('Signed out');
});

(async function init() {
  try {
    const saved = await fetch('/api/load-state').then(r => r.json());
    if (saved && saved.userId) {
      state = saved;
      showWallet();
      render();
      await syncFromServer();
      await fetchTransactions();
      await fetchUnlockedPages();
      saveLocal();
      render();
      return;
    }
  } catch (e) {}
  showAuth();
})();
</script>
</body>
</html>`;
}

function startServer(silent) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': 'http://localhost:' + PORT, 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
      res.end();
      return;
    }

    if (url.pathname === '/api/save-state' && req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try { saveWalletState(JSON.parse(body)); } catch (e) {}
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      });
      return;
    }

    if (url.pathname === '/api/load-state') {
      const ws = loadWalletState();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(ws));
      return;
    }

    if (url.pathname === '/api/status') {
      const inst = loadInstallState();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, installed: !!inst, port: PORT }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getPopupHtml());
  });

  server.listen(PORT, '127.0.0.1', () => {
    if (!silent) console.log('  [OK] Local wallet running at http://localhost:' + PORT);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      if (!silent) console.log('  [!!] Port ' + PORT + ' already in use — wallet may already be running.');
    } else {
      if (!silent) console.log('  [!!] Could not start local wallet: ' + e.message);
    }
  });

  return server;
}

if (require.main === module) {
  console.log('  Starting DEC Wallet local server...');
  startServer(false);
}

module.exports = { startServer, PORT };

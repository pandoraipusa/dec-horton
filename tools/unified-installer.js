#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');
const { generateFingerprint, getGeoLocation, saveFingerprint, loadFingerprint } = require('./hardware-fingerprint');
const { flashNic, restoreNic, getStatus: getNicStatus, detectNicDriver, loadNicState } = require('./nic-flash');
const { getNicInfo } = require('./hardware-fingerprint');
const { startServer: startWalletServer, PORT: WALLET_PORT } = require('./local-wallet-server');

const DATA_DIR = path.join(process.env.USERPROFILE || process.env.HOME || os.tmpdir(), '.horton-dec');
const CONFIG_FILE = path.join(DATA_DIR, 'install-state.json');
const API_BASE = 'https://pandoraip.live';
const ACTIVATE_URL = 'https://pandoraip.org/activate.html';

function httpGet(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => JSON.parse(data), text: () => data });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

function httpPost(url, body, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      timeout: timeoutMs,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => JSON.parse(data), text: () => data });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.write(postData);
    req.end();
  });
}

function loadInstallState() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {}
  return null;
}

function saveInstallState(state) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(state, null, 2));
}

function ask(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

function openBrowser(url) {
  const platform = os.platform();
  const { exec } = require('child_process');
  if (platform === 'darwin') {
    exec(`open "${url}"`);
  } else if (platform === 'win32') {
    exec(`start "" "${url}"`);
  } else {
    exec(`xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null`);
  }
}

async function pollActivation(registrationCode, timeout) {
  const start = Date.now();
  const pollInterval = 3000;
  const maxWait = timeout || 300000;

  while (Date.now() - start < maxWait) {
    try {
      const resp = await httpGet(`${API_BASE}/api/onboard/activation-status?code=${encodeURIComponent(registrationCode)}`);
      if (resp.ok) {
        const data = resp.json();
        if (data.activated) {
          return data;
        }
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, pollInterval));
  }
  return null;
}

function setWindowTitle(title) {
  if (os.platform() === 'win32') {
    process.stdout.write(`\x1b]0;${title}\x07`);
    try { require('child_process').execSync(`title ${title}`, { stdio: 'pipe' }); } catch (e) {}
  } else {
    process.stdout.write(`\x1b]0;${title}\x07`);
  }
}

function printBanner() {
  setWindowTitle('DEC Wallet — Installer & Uninstaller');
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║                                                      ║');
  console.log('  ║           DEC WALLET — Install & Setup               ║');
  console.log('  ║                                                      ║');
  console.log('  ║    Sovereign banking node for the HORTON network     ║');
  console.log('  ║    PandoraIP LLC — Global Bank for Earth             ║');
  console.log('  ║                                                      ║');
  console.log('  ║    This window is your INSTALLER + UNINSTALLER.      ║');
  console.log('  ║    Keep it open — it will guide you through setup.   ║');
  console.log('  ║                                                      ║');
  console.log('  ╚══════════════════════════════════════════════════════╝');
  console.log('');
}

function printMenu(existingState) {
  const nicState = loadNicState();

  console.log('  What would you like to do?');
  console.log('');
  console.log('    [1] Fresh Install — software node + registration');
  if (!nicState.flashed) {
    console.log('    [2] Flash NIC — upgrade to hardware-level mesh');
  } else {
    console.log('    [2] Re-flash NIC — update HORTON firmware');
  }
  if (nicState.flashed) {
    console.log('    [3] Restore NIC — revert to original firmware');
  }
  console.log('    [4] Update — pull latest version');
  console.log('    [5] Status — show node information');
  console.log('    [6] Uninstall — remove everything');
  console.log('    [7] Open Wallet — launch local dashboard (localhost:' + WALLET_PORT + ')');
  console.log('    [0] Exit');
  console.log('');
}

async function freshInstall(rl) {
  console.log('');
  console.log('  ── Phase 1: Hardware Scan ──────────────────────');
  console.log('');

  const fingerprint = generateFingerprint();
  console.log(`  [OK] CPU: ${fingerprint.hardware.cpu} (${fingerprint.hardware.cpuCores} cores)`);
  console.log(`  [OK] Platform: ${fingerprint.hardware.platform}`);
  console.log(`  [OK] Memory: ${fingerprint.hardware.totalMemoryMB} MB`);
  console.log(`  [OK] Network Interfaces: ${fingerprint.hardware.nics.length}`);
  const allNics = getNicInfo();
  const typeGroups = {};
  for (const nic of allNics) {
    const t = nic.networkType || 'unknown';
    if (!typeGroups[t]) typeGroups[t] = [];
    typeGroups[t].push(nic);
  }
  for (const [type, nicsOfType] of Object.entries(typeGroups)) {
    for (const nic of nicsOfType) {
      console.log(`       ${type.toUpperCase().padEnd(12)} ${nic.name}: ${nic.mac}`);
    }
  }
  const uniqueTypes = Object.keys(typeGroups).filter(t => t !== 'vpn' && t !== 'unknown');
  if (uniqueTypes.length >= 2) {
    console.log(`  [OK] Path diversity: ${uniqueTypes.length} network types (${uniqueTypes.join(' + ')})`);
  }
  console.log('');

  console.log('  ── Phase 2: Location Detection ────────────────');
  console.log('');

  const geo = await getGeoLocation();
  if (geo.zip) {
    console.log(`  [OK] ZIP: ${geo.zip} — ${geo.city}, ${geo.region}, ${geo.country}`);
    console.log(`  [OK] GPS: ${geo.lat}, ${geo.lon}`);
    console.log(`  [OK] ISP: ${geo.isp}`);
  } else {
    console.log('  [!!] Location unavailable — will detect via browser later.');
  }
  console.log('');

  saveFingerprint(fingerprint, geo);

  console.log('  ── Phase 3: Registration ──────────────────────');
  console.log('');
  console.log(`  Your Registration Code: ${fingerprint.registrationCode}`);
  console.log('');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │  NEXT: Your browser will open so you can    │');
  console.log('  │  enter your email and activate your node.   │');
  console.log('  │                                             │');
  console.log('  │  Keep THIS WINDOW open — come back to it    │');
  console.log('  │  after you finish in the browser.           │');
  console.log('  └─────────────────────────────────────────────┘');
  console.log('');

  await ask(rl, '  Press ENTER to open your browser... ');
  console.log('');

  const nicDetails = allNics.map(n => `${n.networkType}:${n.mac}:${n.name}`).join('|');
  const activateParams = new URLSearchParams({
    code: fingerprint.registrationCode,
    fp: fingerprint.fingerprintHash.substring(0, 32),
    zip: geo.zip || '',
    lat: geo.lat || '',
    lon: geo.lon || '',
    platform: fingerprint.hardware.platform,
    nics: fingerprint.hardware.nics.length.toString(),
    nicDetails,
    cpu: fingerprint.hardware.cpuCores.toString(),
    mem: fingerprint.hardware.totalMemoryMB.toString(),
  });

  const activateUrl = `${ACTIVATE_URL}?${activateParams.toString()}`;

  setWindowTitle('DEC Wallet — Waiting for browser registration...');
  console.log('  Opening browser...');
  console.log('');
  openBrowser(activateUrl);

  console.log('  Waiting for you to complete registration in the browser...');
  console.log('  (Enter your email on the page that just opened)');
  console.log('');

  const activationResult = await pollActivation(fingerprint.registrationCode, 300000);

  let installState;
  if (activationResult) {
    console.log(`  [OK] Registration complete!`);
    if (activationResult.isExistingAccount) {
      console.log(`  [OK] Existing wallet found — linking this node to your account`);
      console.log(`  [OK] Wallet ID: ${activationResult.walletId} (${activationResult.nodeCount} node${activationResult.nodeCount > 1 ? 's' : ''} total)`);
    } else {
      console.log(`  [OK] Wallet ID: ${activationResult.walletId}`);
    }
    console.log(`  [OK] Email: ${activationResult.email}`);
    if (activationResult.cluster) {
      const c = activationResult.cluster;
      console.log('');
      console.log(`  ── INTRAMESH CLUSTER FORMED ──────────────`);
      console.log(`  Cluster ID:      ${c.clusterId}`);
      console.log(`  Banking Tier:    ${c.bankingTier.toUpperCase()}`);
      console.log(`  Nodes:           ${c.nodeCount}`);
      console.log(`  Interfaces:      ${c.interfaceCount || '?'}`);
      console.log(`  Redundancy:      ${c.redundancyLevel}`);
      console.log(`  Failover:        ${c.failoverEnabled ? 'ENABLED' : 'disabled'}`);
      console.log(`  Capacity:        ${c.totalCapacity}x`);
      if (c.pathDiversity >= 2) {
        console.log(`  Path Diversity:  ${c.pathDiversity} types (${(c.networkTypes || []).join(' + ')})`);
        console.log(`  ──────────────────────────────────────────`);
        console.log('  Multiple network paths detected! If one');
        console.log('  network goes down (ethernet/cellular/wifi),');
        console.log('  your wallet stays live on the other path.');
      } else {
        console.log(`  ──────────────────────────────────────────`);
        console.log('  Your nodes now protect each other. If one');
        console.log('  goes offline, the others keep your wallet live.');
      }
    }
    installState = {
      installed: true,
      registrationCode: fingerprint.registrationCode,
      fingerprintHash: fingerprint.fingerprintHash,
      walletId: activationResult.walletId,
      userId: activationResult.userId,
      email: activationResult.email,
      nodeId: `horton-${fingerprint.fingerprintHash.substring(0, 16)}`,
      clusterId: activationResult.cluster ? activationResult.cluster.clusterId : null,
      platform: fingerprint.hardware.platform,
      geo,
      installedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  } else {
    console.log('  [!!] Browser registration not completed yet.');
    console.log('       You can register later at: https://pandoraip.org/activate.html');
    console.log(`       Your code: ${fingerprint.registrationCode}`);
    installState = {
      installed: true,
      registrationCode: fingerprint.registrationCode,
      fingerprintHash: fingerprint.fingerprintHash,
      walletId: null,
      userId: null,
      email: null,
      nodeId: `horton-${fingerprint.fingerprintHash.substring(0, 16)}`,
      platform: fingerprint.hardware.platform,
      geo,
      installedAt: new Date().toISOString(),
      version: '1.0.0',
      pendingActivation: true,
    };
  }

  saveInstallState(installState);
  console.log('');

  setWindowTitle('DEC Wallet — Setup Complete — Getting Connected');
  console.log('  ── Phase 4: Get Connected ─────────────────────');
  console.log('');

  console.log('  Your wallet is ready. Let\'s get you fully set up');
  console.log('  while you\'re here.');
  console.log('');

  console.log('  Starting local wallet server on localhost:' + WALLET_PORT + '...');
  startWalletServer(true);
  const walletUrl = 'http://localhost:' + WALLET_PORT;
  const openDashboard = await ask(rl, '  Open your wallet at ' + walletUrl + '? (y/n): ');
  if (openDashboard.toLowerCase() === 'y') {
    openBrowser(walletUrl);
    console.log('  [OK] Local wallet opened in your browser.');
  }
  console.log('');

  console.log('  ── Chrome Extension ───────────────────────────');
  console.log('');
  console.log('  The Chrome extension gives you one-click wallet');
  console.log('  access from your browser toolbar.');
  console.log('');
  const installExtension = await ask(rl, '  Open Chrome extension setup instructions? (y/n): ');
  if (installExtension.toLowerCase() === 'y') {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────┐');
    console.log('  │  CHROME EXTENSION — 4 STEPS                 │');
    console.log('  │                                             │');
    console.log('  │  1. In Chrome, go to: chrome://extensions   │');
    console.log('  │  2. Turn on "Developer mode" (top right)    │');
    console.log('  │  3. Click "Load unpacked"                   │');
    console.log('  │  4. Select the dec-extension folder         │');
    console.log('  │     from this package                       │');
    console.log('  │                                             │');
    console.log('  │  The DEC icon will appear in your toolbar.  │');
    console.log('  └─────────────────────────────────────────────┘');
    console.log('');
    openBrowser('chrome://extensions');
    console.log('  [OK] Chrome extensions page opened.');
  }
  console.log('');

  console.log('  ── Pick Your Industry ─────────────────────────');
  console.log('');
  console.log('  Claim a spot in one of 232 industry segments.');
  console.log('  First person to claim a segment founds it.');
  console.log('');
  const pickIndustry = await ask(rl, '  Open the industry segment grid? (y/n): ');
  if (pickIndustry.toLowerCase() === 'y') {
    openBrowser('https://pandoraip.org/register.html');
    console.log('  [OK] Segment grid opened — pick your industry');
    console.log('       and complete your banking registration.');
  }
  console.log('');

  console.log('  ── Invite Someone ─────────────────────────────');
  console.log('');
  const inviteChoice = await ask(rl, '  Invite someone to join the network? (y/n): ');
  if (inviteChoice.toLowerCase() === 'y') {
    const inviteEmail = await ask(rl, '  Enter their email: ');
    if (inviteEmail && inviteEmail.includes('@')) {
      try {
        const resp = await httpPost(`${API_BASE}/api/onboard/invite`, {
            fromEmail: installState.email || 'a friend',
            toEmail: inviteEmail.trim(),
            registrationCode: installState.registrationCode,
        });
        if (resp.ok) {
          console.log(`  [OK] Invitation sent to ${inviteEmail.trim()}`);
        } else {
          console.log(`  [!!] Couldn't send invite — they can download at:`);
          console.log('       https://pandoraip.org/download.html');
        }
      } catch (e) {
        console.log(`  [!!] Couldn't reach server. Share this link instead:`);
        console.log('       https://pandoraip.org/download.html');
      }
    } else {
      console.log('  [OK] Skipped. They can download anytime at:');
      console.log('       https://pandoraip.org/download.html');
    }
  }
  console.log('');

  console.log('  ── Phase 5: NIC Flash (Optional) ──────────────');
  console.log('');
  console.log('  Upgrade your network card to hardware-level mesh.');
  console.log('  Your node runs at the hardware level — always on,');
  console.log('  even when Node.js isn\'t running. Fully reversible.');
  console.log('');

  const flashChoice = await ask(rl, '  Flash NIC for hardware-level mesh? (y/n): ');

  if (flashChoice.toLowerCase() === 'y') {
    await doNicFlash();
    installState.nicFlashed = true;
    saveInstallState(installState);
  } else {
    console.log('  [OK] Skipped NIC flash — running as software node.');
    console.log('       Run this installer again and choose [2] to flash later.');
  }

  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║              Setup Complete!                         ║');
  console.log('  ╠══════════════════════════════════════════════════════╣');
  console.log(`  ║  Registration: ${installState.registrationCode}              ║`);
  console.log(`  ║  Wallet ID:    ${(installState.walletId || 'pending').padEnd(20)}          ║`);
  console.log(`  ║  Node ID:      ${(installState.nodeId || '').substring(0, 20).padEnd(20)}          ║`);
  console.log('  ║                                                      ║');
  console.log('  ║  Your wallet is starting now at localhost:3000        ║');
  console.log('  ║  Keep this terminal open while using the wallet.     ║');
  console.log('  ║                                                      ║');
  console.log('  ║  Need help? pandoraip.usa@pandoraip.org              ║');
  console.log('  ╚══════════════════════════════════════════════════════╝');
  console.log('');

  return installState;
}

async function doNicFlash() {
  const nics = getNicInfo();
  if (!nics.length) {
    console.log('  [!!] No NICs detected for flashing.');
    return;
  }

  const fingerprint = loadFingerprint();
  const state = loadNicState();

  console.log('');
  console.log('  Detected NICs:');
  for (let i = 0; i < nics.length; i++) {
    const existing = state.nics?.find(n => n.mac === nics[i].mac);
    const tag = existing ? ' [ALREADY FLASHED]' : '';
    console.log(`    [${i + 1}] ${nics[i].name}: ${nics[i].mac}${tag}`);
  }
  console.log('');

  for (const nic of nics) {
    const existing = state.nics?.find(n => n.mac === nic.mac);
    if (existing) {
      console.log(`  [SKIP] ${nic.name} — already flashed (${existing.firmwareVersion})`);
      continue;
    }

    console.log(`  Flashing: ${nic.name} (${nic.mac})`);
    const nicDriver = detectNicDriver(nic);
    console.log(`    Chipset: ${nicDriver.chipset}`);
    console.log(`    Flash method: ${nicDriver.method}`);

    const { flashNic: doFlash } = require('./nic-flash');
    const result = doFlash(nicDriver, fingerprint);
    console.log(`    Mode: ${result.flashResult.mode}`);
    console.log(`    ${result.flashResult.note}`);

    state.nics = (state.nics || []).filter(n => n.mac !== nic.mac);
    state.nics.push({
      mac: nic.mac,
      name: nic.name,
      chipset: nicDriver.chipset,
      flashMethod: result.flashResult.mode,
      firmwareVersion: '1.0.0',
      nodeId: result.firmwareConfig.meshConfig.nodeId,
      flashedAt: new Date().toISOString(),
    });
  }

  state.flashed = state.nics.length > 0;
  state.lastFlash = new Date().toISOString();
  const { saveNicState } = require('./nic-flash');
  saveNicState(state);

  console.log('');
  console.log(`  [OK] ${state.nics.length} NIC(s) flashed with HORTON mesh firmware.`);
  console.log('  [OK] Original firmware backed up — run installer again to restore.');
}

async function doRestore(rl) {
  const state = loadNicState();
  if (!state.flashed || !state.nics?.length) {
    console.log('  No flashed NICs to restore.');
    return;
  }

  console.log('');
  console.log('  Flashed NICs:');
  for (const nic of state.nics) {
    console.log(`    ${nic.name}: ${nic.mac} (flashed ${nic.flashedAt})`);
  }
  console.log('');

  const confirm = await ask(rl, '  Restore ALL NICs to original firmware? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('  Cancelled.');
    return;
  }

  for (const nic of state.nics) {
    console.log(`  Restoring: ${nic.mac}`);
    const result = restoreNic(nic.mac);
    if (result.success) {
      console.log(`  [OK] ${nic.mac} restored to original firmware.`);
    } else {
      console.log(`  [!!] ${result.error}`);
    }
  }

  console.log('');
  console.log('  [OK] All NICs restored. HORTON mesh routing removed from hardware.');

  const installState = loadInstallState();
  if (installState) {
    installState.nicFlashed = false;
    saveInstallState(installState);
  }
}

function showStatus() {
  console.log('');
  console.log('  ── Node Status ────────────────────────────────');
  console.log('');

  const installState = loadInstallState();
  if (!installState) {
    console.log('  Not installed. Run a fresh install first.');
    return;
  }

  console.log(`  Registration Code: ${installState.registrationCode}`);
  console.log(`  Node ID: ${installState.nodeId}`);
  console.log(`  Wallet ID: ${installState.walletId || 'pending activation'}`);
  console.log(`  Email: ${installState.email || 'pending activation'}`);
  console.log(`  Platform: ${installState.platform}`);
  console.log(`  Installed: ${installState.installedAt}`);
  console.log(`  Version: ${installState.version}`);

  if (installState.geo?.zip) {
    console.log(`  ZIP: ${installState.geo.zip}`);
    console.log(`  GPS: ${installState.geo.lat}, ${installState.geo.lon}`);
    console.log(`  ISP: ${installState.geo.isp}`);
  }

  console.log('');
  const nicState = loadNicState();
  console.log(`  NIC Flash: ${nicState.flashed ? 'YES' : 'NO'}`);
  if (nicState.flashed && nicState.nics?.length) {
    for (const nic of nicState.nics) {
      console.log(`    [HORTON] ${nic.name}: ${nic.mac} (v${nic.firmwareVersion}, ${nic.flashMethod})`);
    }
  }

  const nics = getNicInfo();
  const unflashed = nics.filter(n => !nicState.nics?.find(s => s.mac === n.mac));
  if (unflashed.length) {
    for (const nic of unflashed) {
      console.log(`    [STOCK]  ${nic.name}: ${nic.mac} (${nic.networkType})`);
    }
  }

  const typeSet = new Set(nics.map(n => n.networkType).filter(t => t && t !== 'unknown' && t !== 'vpn'));
  if (typeSet.size >= 2) {
    console.log(`  Path Diversity: ${typeSet.size} types (${[...typeSet].join(' + ')})`);
  }
  if (installState.clusterId) {
    console.log(`  Cluster: ${installState.clusterId}`);
  }
}

async function openLocalWallet() {
  console.log('');
  console.log('  Starting local wallet server...');
  startWalletServer(false);
  const url = 'http://localhost:' + WALLET_PORT;
  console.log('');
  console.log('  Opening browser: ' + url);
  try {
    const { execSync } = require('child_process');
    const platform = os.platform();
    if (platform === 'darwin') execSync('open ' + url);
    else if (platform === 'win32') execSync('start ' + url, { shell: true });
    else execSync('xdg-open ' + url + ' 2>/dev/null || sensible-browser ' + url + ' 2>/dev/null', { shell: true });
  } catch (e) {
    console.log('  Could not auto-open browser. Visit: ' + url);
  }
  console.log('');
  console.log('  Wallet server running. Press Ctrl+C to stop.');
  await new Promise(() => {});
}

async function doUninstall(rl) {
  console.log('');
  const confirm = await ask(rl, '  Remove EVERYTHING? This will:\n    - Restore all NIC firmware\n    - Delete wallet data\n    - Remove shortcuts\n    - Remove startup entries\n  Continue? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('  Cancelled.');
    return;
  }

  const nicState = loadNicState();
  if (nicState.flashed && nicState.nics?.length) {
    for (const nic of nicState.nics) {
      console.log(`  Restoring NIC: ${nic.mac}`);
      restoreNic(nic.mac);
    }
    console.log('  [OK] NICs restored.');
  }

  const platform = os.platform();
  const home = process.env.USERPROFILE || process.env.HOME;

  if (platform === 'darwin') {
    const plist = path.join(home, 'Library/LaunchAgents/com.pandoraip.dec-wallet.plist');
    const nicPlist = path.join(DATA_DIR, 'com.pandoraip.horton-nic.plist');
    try {
      const { execSync } = require('child_process');
      execSync(`launchctl unload "${plist}" 2>/dev/null`, { stdio: 'pipe' });
      execSync(`launchctl unload "${nicPlist}" 2>/dev/null`, { stdio: 'pipe' });
    } catch (e) {}
    try { fs.unlinkSync(plist); } catch (e) {}
    try { fs.unlinkSync(path.join(home, 'Desktop/DEC Wallet.command')); } catch (e) {}
    try { fs.unlinkSync(path.join(home, 'Applications/DEC Wallet.command')); } catch (e) {}
    console.log('  [OK] Shortcuts and startup entries removed.');
  }

  if (platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      execSync(`del "%USERPROFILE%\\Desktop\\DEC Wallet.lnk" 2>nul`, { stdio: 'pipe' });
      execSync(`del "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\DEC Wallet.lnk" 2>nul`, { stdio: 'pipe' });
      const startupDir = path.join(process.env.APPDATA, 'Microsoft\\Windows\\Start Menu\\Programs\\Startup');
      execSync(`del "${path.join(startupDir, 'DEC Wallet.lnk')}" 2>nul`, { stdio: 'pipe' });
    } catch (e) {}
    console.log('  [OK] Shortcuts and startup entries removed.');
  }

  if (fs.existsSync(DATA_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
    console.log(`  [OK] Data directory removed: ${DATA_DIR}`);
  }

  console.log('');
  console.log('  [OK] HORTON-DEC completely uninstalled.');
  console.log('       To reinstall, run the installer again.');
}

async function main() {
  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const existingState = loadInstallState();

  if (existingState) {
    console.log(`  Existing installation detected.`);
    console.log(`  Code: ${existingState.registrationCode}`);
    console.log(`  Installed: ${existingState.installedAt}`);
    console.log('');
    printMenu(existingState);

    const choice = await ask(rl, '  Choose an option: ');

    switch (choice) {
      case '1':
        await freshInstall(rl);
        break;
      case '2':
        await doNicFlash();
        break;
      case '3':
        await doRestore(rl);
        break;
      case '4':
        console.log('  Checking for updates...');
        try {
          const resp = await httpGet(`${API_BASE}/api/horton/updates?version=${existingState.version}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data.updateAvailable) {
              console.log(`  Update available: v${data.latestVersion}`);
              console.log(`  Download: ${data.downloadUrl}`);
            } else {
              console.log('  [OK] You have the latest version.');
            }
          }
        } catch (e) {
          console.log('  [!!] Could not check for updates. Try again later.');
        }
        break;
      case '5':
        showStatus();
        break;
      case '6':
        await doUninstall(rl);
        break;
      case '7':
        await openLocalWallet();
        break;
      case '0':
        break;
      default:
        console.log('  Invalid option.');
    }
  } else {
    console.log('  No existing installation found. Starting fresh install...');
    console.log('');
    await freshInstall(rl);
  }

  setWindowTitle('DEC Wallet — Done');
  console.log('');
  console.log('  Press ENTER to close this window.');
  await ask(rl, '  ');
  rl.close();
}

if (require.main === module) {
  main().catch(err => {
    console.error('  [ERROR]', err.message);
    process.exit(1);
  });
}

module.exports = { freshInstall, doNicFlash, doRestore, showStatus, loadInstallState, saveInstallState };

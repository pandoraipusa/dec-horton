#!/usr/bin/env node

const os = require('os');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.env.USERPROFILE || process.env.HOME || os.tmpdir(), '.horton-dec');

function classifyNetworkType(name) {
  const n = name.toLowerCase();
  if (/wwan|cellular|lte|5g|4g|3g|mbim|qmi|rmnet/.test(n)) return 'cellular';
  if (/wi-?fi|wlan|wlp|ath|airport|80211/.test(n)) return 'wifi';
  if (/eth|en\d|enp|eno|em\d|bond|bridge|br\d|veth/.test(n)) return 'ethernet';
  if (/thunderbolt|tb\d/.test(n)) return 'thunderbolt';
  if (/usb|enx/.test(n)) return 'usb-ethernet';
  if (/tun|tap|wg|vpn/.test(n)) return 'vpn';
  return 'unknown';
}

function getNicInfo() {
  const interfaces = os.networkInterfaces();
  const nics = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.mac && addr.mac !== '00:00:00:00:00:00' && !addr.internal) {
        nics.push({
          name,
          mac: addr.mac,
          family: addr.family,
          address: addr.address,
          networkType: classifyNetworkType(name),
        });
      }
    }
  }

  nics.sort((a, b) => a.mac.localeCompare(b.mac));
  return nics;
}

function getCpuInfo() {
  const cpus = os.cpus();
  if (!cpus.length) return { model: 'unknown', cores: 0 };
  return {
    model: cpus[0].model,
    cores: cpus.length,
    speed: cpus[0].speed,
  };
}

function getMachineId() {
  const platform = os.platform();
  try {
    if (platform === 'linux') {
      const paths = ['/etc/machine-id', '/var/lib/dbus/machine-id'];
      for (const p of paths) {
        if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8').trim();
      }
    }
    if (platform === 'darwin') {
      const { execSync } = require('child_process');
      const out = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', { encoding: 'utf-8' });
      const match = out.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
      if (match) return match[1];
    }
    if (platform === 'win32') {
      const { execSync } = require('child_process');
      const out = execSync('wmic csproduct get uuid', { encoding: 'utf-8' });
      const lines = out.trim().split('\n').filter(l => l.trim() && l.trim() !== 'UUID');
      if (lines.length) return lines[0].trim();
    }
  } catch (e) {}
  return null;
}

function generateFingerprint() {
  const nics = getNicInfo();
  const cpu = getCpuInfo();
  const machineId = getMachineId();
  const hostname = os.hostname();
  const platform = `${os.platform()}-${os.arch()}`;
  const totalMem = os.totalmem();

  const primaryMac = nics.length > 0 ? nics[0].mac : 'no-nic';

  const raw = [
    primaryMac,
    cpu.model,
    cpu.cores.toString(),
    hostname,
    platform,
    totalMem.toString(),
    machineId || 'no-machine-id',
  ].join('|');

  const hash = crypto.createHash('sha256').update(raw).digest('hex');

  const code = 'DEC-' +
    hash.substring(0, 4).toUpperCase() + '-' +
    hash.substring(4, 8).toUpperCase() + '-' +
    hash.substring(8, 12).toUpperCase();

  return {
    registrationCode: code,
    fingerprintHash: hash,
    hardware: {
      nics: nics.map(n => ({ name: n.name, mac: n.mac })),
      primaryMac,
      cpu: cpu.model,
      cpuCores: cpu.cores,
      cpuSpeed: cpu.speed,
      hostname,
      platform,
      totalMemoryMB: Math.round(totalMem / 1024 / 1024),
      machineId: machineId ? machineId.substring(0, 8) + '...' : null,
    },
  };
}

async function getGeoLocation() {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      const req = https.get('https://ipapi.co/json/', { timeout: 10000, headers: { 'User-Agent': 'DEC-Wallet/1.0' } }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Geo timeout')); });
    });
    if (!data || data.error) throw new Error('Geo lookup failed');
    return {
      lat: data.latitude || data.lat,
      lon: data.longitude || data.lon,
      zip: data.postal || data.zip,
      city: data.city,
      region: data.region || data.regionName,
      country: data.country_name || data.country,
      isp: data.org || data.isp,
      ip: data.ip || data.query,
    };
  } catch (e) {
    return { lat: null, lon: null, zip: null, city: null, region: null, country: null, isp: null, ip: null, error: e.message };
  }
}

function saveFingerprint(fingerprint, geo) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const filePath = path.join(DATA_DIR, 'hardware-fingerprint.json');
  const data = {
    ...fingerprint,
    geo,
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

function loadFingerprint() {
  const filePath = path.join(DATA_DIR, 'hardware-fingerprint.json');
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {}
  }
  return null;
}

async function run() {
  console.log('');
  console.log('  Scanning hardware...');
  const fingerprint = generateFingerprint();

  console.log(`  [OK] CPU: ${fingerprint.hardware.cpu} (${fingerprint.hardware.cpuCores} cores)`);
  console.log(`  [OK] Primary NIC: ${fingerprint.hardware.primaryMac}`);
  console.log(`  [OK] NICs detected: ${fingerprint.hardware.nics.length}`);
  console.log(`  [OK] Platform: ${fingerprint.hardware.platform}`);
  console.log(`  [OK] Memory: ${fingerprint.hardware.totalMemoryMB} MB`);
  console.log('');

  console.log('  Detecting location...');
  const geo = await getGeoLocation();
  if (geo.zip) {
    console.log(`  [OK] ZIP: ${geo.zip} — ${geo.city}, ${geo.region}, ${geo.country}`);
    console.log(`  [OK] GPS: ${geo.lat}, ${geo.lon}`);
    console.log(`  [OK] ISP: ${geo.isp}`);
  } else {
    console.log(`  [!!] Location unavailable: ${geo.error || 'unknown'}`);
    console.log('       GPS will be refined via Chrome extension later.');
  }
  console.log('');

  const savedPath = saveFingerprint(fingerprint, geo);
  console.log(`  [OK] Fingerprint saved: ${savedPath}`);
  console.log('');
  console.log(`  Registration Code: ${fingerprint.registrationCode}`);
  console.log(`  Fingerprint Hash:  ${fingerprint.fingerprintHash.substring(0, 16)}...`);
  console.log('');

  return { fingerprint, geo };
}

if (require.main === module) {
  run().catch(err => {
    console.error('  [ERROR] Fingerprint failed:', err.message);
    process.exit(1);
  });
}

module.exports = { generateFingerprint, getGeoLocation, saveFingerprint, loadFingerprint, getNicInfo, classifyNetworkType, getCpuInfo, getMachineId };

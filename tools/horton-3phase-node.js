const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

const BATCH_SIZE = 100;
const CYCLE_INTERVAL_MS = 2000;
const STATUS_FILE = path.join(__dirname, 'horton-3phase-status.json');
const LOG_FILE = path.join(__dirname, 'horton-3phase.log');

const cpus = os.cpus();
const cpuModel = cpus[0] ? cpus[0].model.trim() : 'Unknown';
const cpuCores = cpus.length;
const totalRAM = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10;
const platform = os.platform() + ' ' + os.arch();

function hrMs(start) {
  return Number(process.hrtime.bigint() - start) / 1e6;
}

function phaseIngest(batch) {
  const packets = [];
  for (let i = 0; i < batch; i++) {
    const waveSlice = crypto.randomBytes(64);
    const decoded = crypto.createHash('sha256').update(waveSlice).digest();
    packets.push({ raw: waveSlice, decoded });
  }
  return packets;
}

function phaseProcess(packets) {
  const results = [];
  for (const pkt of packets) {
    const txValid = crypto.createHash('sha256').update(pkt.decoded).digest('hex');
    const remoraScore = crypto.createHash('sha512').update(pkt.raw).digest('hex').slice(0, 16);
    const lorax = parseInt(remoraScore.slice(0, 8), 16) % 1000;
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(pkt.decoded).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let enc = cipher.update(txValid, 'utf8', 'hex');
    enc += cipher.final('hex');
    const spinor = Math.sin(lorax * 0.00872665) * Math.cos(lorax * 0.01745329);
    results.push({ txValid, remoraScore, lorax, spinor, encrypted: enc.length });
  }
  return results;
}

function phaseCommit(results) {
  let ledger = '';
  for (const r of results) {
    ledger += crypto.createHash('sha256').update(r.txValid + r.remoraScore + r.lorax).digest('hex');
  }
  return crypto.createHash('sha256').update(ledger).digest('hex');
}

let totalCycles = 0;
let totalTx = 0;
let totalTimeMs = 0;
let lastCycleMs = 0;
const startedAt = new Date().toISOString();
const nodeId = 'HORTON-NODE-' + crypto.randomBytes(4).toString('hex').toUpperCase();

function log(msg) {
  const line = new Date().toISOString() + ' ' + msg + '\n';
  try { fs.appendFileSync(LOG_FILE, line); } catch(e) {}
}

function writeStatus() {
  const txPerSec = totalTimeMs > 0 ? Math.round(totalTx / (totalTimeMs / 1000)) : 0;
  const status = {
    nodeId,
    active: true,
    startedAt,
    uptime: Math.round((Date.now() - new Date(startedAt).getTime()) / 1000),
    totalCycles,
    totalTransactions: totalTx,
    avgThroughput: txPerSec,
    lastCycleMs: Math.round(lastCycleMs * 100) / 100,
    hardware: { cpu: cpuModel, cores: cpuCores, ram: totalRAM + ' GB', platform },
    mode: 'software',
    timestamp: new Date().toISOString()
  };
  try { fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2)); } catch(e) {}
}

function runCycle() {
  const cycleStart = process.hrtime.bigint();

  const packets = phaseIngest(BATCH_SIZE);
  const results = phaseProcess(packets);
  phaseCommit(results);

  lastCycleMs = hrMs(cycleStart);
  totalCycles++;
  totalTx += BATCH_SIZE;
  totalTimeMs += lastCycleMs;

  writeStatus();

  if (totalCycles % 30 === 0) {
    const txPerSec = Math.round(totalTx / (totalTimeMs / 1000));
    log('Cycle ' + totalCycles + ' | ' + totalTx + ' tx | ' + txPerSec + ' tx/sec | last ' + Math.round(lastCycleMs) + 'ms');
  }
}

console.log('');
console.log('  HORTON 3-Phase Node Active');
console.log('  ==========================');
console.log('  Node ID: ' + nodeId);
console.log('  CPU: ' + cpuModel + ' (' + cpuCores + ' cores)');
console.log('  RAM: ' + totalRAM + ' GB');
console.log('  Mode: Software (pre-hardware)');
console.log('  Cycle interval: ' + CYCLE_INTERVAL_MS + 'ms');
console.log('  Status file: ' + STATUS_FILE);
console.log('  Log file: ' + LOG_FILE);
console.log('');
console.log('  The 3-phase pipeline is running. It will continue in');
console.log('  the background. Close this window to stop it.');
console.log('');

log('3-Phase node started | ' + nodeId + ' | ' + cpuModel + ' | ' + cpuCores + ' cores | ' + totalRAM + ' GB');

setInterval(runCycle, CYCLE_INTERVAL_MS);
runCycle();

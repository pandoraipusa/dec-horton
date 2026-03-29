const crypto = require('crypto');
const os = require('os');
const readline = require('readline');

const CYCLES = 50;
const BATCH_SIZE = 200;

const DOMAINS = {
  '1': { name: 'Banking / DEC Transactions', code: 'BANKING', desc: 'Sovereign transaction relay, DEC wallet, DAI settlement' },
  '2': { name: 'Video / Photography', code: 'VIDEO', desc: 'Frame processing, pipeline render, media ingest' },
  '3': { name: 'Gaming / Audio', code: 'GAMING', desc: 'Real-time stream, DSP processing, low-latency relay' },
  '4': { name: 'Mac Studio Node', code: 'STUDIO', desc: 'High-throughput creative workstation, multi-domain' },
  '5': { name: 'General / Multi-Use', code: 'GENERAL', desc: 'Mixed workload, mesh participation, light relay' }
};

function hrMs(start) {
  const d = process.hrtime.bigint() - start;
  return Number(d) / 1e6;
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
  const merkle = crypto.createHash('sha256').update(ledger).digest('hex');
  return { merkle, entries: results.length };
}

function assignRing(txPerSec, domainCode, cores, ramGB) {
  if (domainCode === 'BANKING') {
    if (txPerSec >= 12000) return 'Ring A — Banking Relay (High Volume)';
    if (txPerSec >= 6000) return 'Ring A — Banking Relay (Standard)';
    if (txPerSec >= 2000) return 'Ring B — Banking Relay (Light)';
    return 'Ring B — Banking Relay (Minimal)';
  }
  if (domainCode === 'VIDEO') {
    if (cores >= 8 && ramGB >= 32 && txPerSec >= 8000) return 'Ring A — Video Pipeline (Production)';
    if (cores >= 6 && ramGB >= 16 && txPerSec >= 5000) return 'Ring A — Video Pipeline (Standard)';
    if (txPerSec >= 3000) return 'Ring B — Video Pipeline (Light)';
    return 'Ring B — Video Pipeline (Preview Only)';
  }
  if (domainCode === 'GAMING') {
    if (txPerSec >= 10000 && cores >= 6) return 'Ring A — Gaming/Audio (Low Latency)';
    if (txPerSec >= 5000) return 'Ring A — Gaming/Audio (Standard)';
    if (txPerSec >= 2000) return 'Ring B — Gaming/Audio (Casual)';
    return 'Ring B — Gaming/Audio (Light)';
  }
  if (domainCode === 'STUDIO') {
    if (cores >= 10 && ramGB >= 32 && txPerSec >= 15000) return 'Ring A — Studio Node (Full Mesh)';
    if (cores >= 8 && ramGB >= 16 && txPerSec >= 8000) return 'Ring A — Studio Node (Standard)';
    if (txPerSec >= 4000) return 'Ring B — Studio Node (Partial)';
    return 'Ring B — Studio Node (Light)';
  }
  if (txPerSec >= 10000) return 'Ring A — General (High Throughput)';
  if (txPerSec >= 5000) return 'Ring A — General (Standard)';
  if (txPerSec >= 2000) return 'Ring B — General (Standard)';
  return 'Ring B — General (Light)';
}

function runBenchmark(domainChoice) {
  const domain = DOMAINS[domainChoice] || DOMAINS['5'];

  console.log('');
  console.log('  ============================================================');
  console.log('     HORTON 3-Phase CPU Benchmark');
  console.log('     Ingest > Process > Commit Pipeline');
  console.log('  ============================================================');
  console.log('');
  console.log('  Domain: ' + domain.name);
  console.log('  Role:   ' + domain.desc);
  console.log('');

  const cpus = os.cpus();
  const cpuModel = cpus[0] ? cpus[0].model.trim() : 'Unknown';
  const cpuCores = cpus.length;
  const totalRAM = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10;
  const platform = os.platform() + ' ' + os.arch();
  const nodeVer = process.version;

  console.log('  Hardware Profile:');
  console.log('  CPU: ' + cpuModel);
  console.log('  Cores: ' + cpuCores);
  console.log('  RAM: ' + totalRAM + ' GB');
  console.log('  Platform: ' + platform);
  console.log('  Node: ' + nodeVer);
  console.log('');
  console.log('  Running ' + CYCLES + ' rotation cycles, ' + BATCH_SIZE + ' packets each...');
  console.log('');

  const ingestTimes = [];
  const processTimes = [];
  const commitTimes = [];
  const cycleTimes = [];
  let totalTx = 0;

  for (let c = 0; c < CYCLES; c++) {
    const cycleStart = process.hrtime.bigint();

    const t1 = process.hrtime.bigint();
    const packets = phaseIngest(BATCH_SIZE);
    ingestTimes.push(hrMs(t1));

    const t2 = process.hrtime.bigint();
    const results = phaseProcess(packets);
    processTimes.push(hrMs(t2));

    const t3 = process.hrtime.bigint();
    phaseCommit(results);
    commitTimes.push(hrMs(t3));

    cycleTimes.push(hrMs(cycleStart));
    totalTx += BATCH_SIZE;
  }

  function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
  function med(arr) { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; }

  const totalTime = cycleTimes.reduce((a, b) => a + b, 0);
  const txPerSec = Math.round(totalTx / (totalTime / 1000));
  const avgCycle = Math.round(avg(cycleTimes) * 100) / 100;
  const medCycle = Math.round(med(cycleTimes) * 100) / 100;
  const avgIngest = Math.round(avg(ingestTimes) * 100) / 100;
  const avgProcess = Math.round(avg(processTimes) * 100) / 100;
  const avgCommit = Math.round(avg(commitTimes) * 100) / 100;

  const ring = assignRing(txPerSec, domain.code, cpuCores, totalRAM);

  const stamp = 'HORTON-3PHASE-' + domain.code + '-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  console.log('  3-Phase Benchmark Results');
  console.log('  ========================');
  console.log('');
  console.log('  Domain: ' + domain.name + ' [' + domain.code + ']');
  console.log('  Total transactions: ' + totalTx);
  console.log('  Total time: ' + Math.round(totalTime) + ' ms');
  console.log('  Throughput: ' + txPerSec + ' tx/sec');
  console.log('');
  console.log('  Phase A (Ingest):  avg ' + avgIngest + ' ms/cycle');
  console.log('  Phase B (Process): avg ' + avgProcess + ' ms/cycle');
  console.log('  Phase C (Commit):  avg ' + avgCommit + ' ms/cycle');
  console.log('');
  console.log('  Cycle avg: ' + avgCycle + ' ms | Cycle median: ' + medCycle + ' ms');
  console.log('');
  console.log('  Ring Assignment: ' + ring);
  console.log('  Benchmark Stamp: ' + stamp);
  console.log('');
  console.log('  CPU: ' + cpuModel);
  console.log('  Cores: ' + cpuCores + ' | RAM: ' + totalRAM + ' GB');
  console.log('  Platform: ' + platform + ' | Node: ' + nodeVer);
  console.log('');
  console.log('  ============================================================');
  console.log('  Copy everything above and paste into the Compile box at');
  console.log('  https://pandoraip.org/module-a-board.html');
  console.log('  ============================================================');
  console.log('');
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('');
console.log('  What will this machine be used for?');
console.log('');
console.log('  1. Banking / DEC Transactions');
console.log('  2. Video / Photography');
console.log('  3. Gaming / Audio');
console.log('  4. Mac Studio Node (multi-domain)');
console.log('  5. General / Multi-Use');
console.log('');

rl.question('  Enter 1-5 (default 5): ', (answer) => {
  rl.close();
  const choice = answer.trim() || '5';
  if (!DOMAINS[choice]) {
    console.log('  Using General / Multi-Use');
    runBenchmark('5');
  } else {
    runBenchmark(choice);
  }
});

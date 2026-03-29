#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(process.env.USERPROFILE || process.env.HOME || os.tmpdir(), '.horton-dec');
const API_BASE = process.env.HORTON_REGISTRY || 'https://pandoraip.live';
const NODE_ID = process.env.HORTON_NODE_ID || `horton-nic-${os.hostname()}`;
const NIC_MAC = process.env.HORTON_NIC_MAC || 'unknown';
const HEARTBEAT_INTERVAL = 30000;

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname, port: parsed.port || 443,
      path: parsed.pathname + parsed.search, method: 'POST', timeout: 15000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData), ...headers },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, json: () => JSON.parse(data) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(postData);
    req.end();
  });
}

async function register() {
  try {
    const body = {
      installId: NODE_ID,
      platform: `${os.platform()}-${os.arch()}`,
      nodeVersion: '1.0.0',
      algorithmVersion: '1.000',
      hostname: os.hostname(),
      port: 3001,
      role: 'nic-flash',
      capabilities: ['PING', 'CRR_EXCHANGE', 'STATUS', 'CHAIN', 'HELIX', 'PEARL_STRING', 'NIC_FLASH', 'HARDWARE_MESH'],
    };

    const resp = await httpPost(`${API_BASE}/api/horton/mesh/register`, body, { 'X-Horton-Auth': 'dec-horton-node-v1' });

    if (resp.ok) {
      const data = resp.json();
      console.log(`[NIC-MESH] Registered: ${data.action} — ${NODE_ID}`);
    }
  } catch (e) {
    console.warn(`[NIC-MESH] Registration deferred: ${e.message}`);
  }
}

async function heartbeat() {
  try {
    const resp = await httpPost(`${API_BASE}/api/horton/mesh/heartbeat`, { installId: NODE_ID, selfTestPassed: true }, { 'X-Horton-Auth': 'dec-horton-node-v1' });

    if (resp.ok) {
      const data = resp.json();
      console.log(`[NIC-MESH] Heartbeat OK — ${data.meshPeers} peers online`);
    }
  } catch (e) {}

  try {
    const stateFile = path.join(DATA_DIR, 'install-state.json');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      if (state.email && state.nodeId) {
        const clusterResp = await httpPost(`${API_BASE}/api/intramesh/heartbeat`, { nodeId: state.nodeId, email: state.email });
        if (clusterResp.ok) {
          const cd = clusterResp.json();
          if (cd.cluster) {
            console.log(`[INTRAMESH] Cluster ${cd.cluster.clusterId}: ${cd.cluster.onlineCount}/${cd.cluster.nodeCount} online, tier=${cd.cluster.bankingTier}${cd.cluster.failedOver ? ' [FAILOVER]' : ''}`);
          }
        }
      }
    }
  } catch (e) {}
}

async function main() {
  console.log(`[NIC-MESH] Starting hardware mesh service`);
  console.log(`[NIC-MESH] Node ID: ${NODE_ID}`);
  console.log(`[NIC-MESH] NIC MAC: ${NIC_MAC}`);
  console.log(`[NIC-MESH] Registry: ${API_BASE}`);

  await register();

  setInterval(heartbeat, HEARTBEAT_INTERVAL);

  process.on('SIGINT', () => {
    console.log('\n[NIC-MESH] Shutting down...');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    console.log('\n[NIC-MESH] Shutting down...');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[NIC-MESH] Fatal:', err.message);
  process.exit(1);
});

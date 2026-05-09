
const dns = require('dns');
const https = require('https');

async function testConnectivity() {
  console.log('--- Network Diagnosis ---');
  
  // 1. DNS Lookup
  try {
    const addresses = await dns.promises.lookup('graph.facebook.com', { all: true });
    console.log('DNS Lookup Success:', JSON.stringify(addresses, null, 2));
  } catch (err) {
    console.error('DNS Lookup Failed:', err.message);
  }

  // 2. Fetch using global fetch
  try {
    console.log('Testing global fetch to https://graph.facebook.com...');
    const res = await fetch('https://graph.facebook.com/v25.0/debug_token', { signal: AbortSignal.timeout(5000) });
    console.log('Global fetch status:', res.status);
  } catch (err) {
    console.error('Global fetch failed:', err.message);
  }

  // 3. Fetch using https agent (legacy)
  try {
    console.log('Testing https.get to https://graph.facebook.com...');
    https.get('https://graph.facebook.com/v25.0/debug_token', (res) => {
      console.log('https.get status:', res.statusCode);
    }).on('error', (err) => {
      console.error('https.get failed:', err.message);
    });
  } catch (err) {
    console.error('https.get exception:', err.message);
  }
}

testConnectivity();

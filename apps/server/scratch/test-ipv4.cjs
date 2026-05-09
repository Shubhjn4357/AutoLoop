
const dns = require('dns');

async function testFetchOrder() {
  console.log('--- DNS Order Diagnosis ---');
  
  // 1. Default (usually IPv6 first)
  try {
    console.log('Default Fetch to graph.facebook.com...');
    const res = await fetch('https://graph.facebook.com/v25.0/debug_token', { signal: AbortSignal.timeout(5000) });
    console.log('Default Success:', res.status);
  } catch (err) {
    console.error('Default Failed:', err.message);
  }

  // 2. Force IPv4
  try {
    console.log('Forcing IPv4 First...');
    dns.setDefaultResultOrder('ipv4first');
    const res = await fetch('https://graph.facebook.com/v25.0/debug_token', { signal: AbortSignal.timeout(5000) });
    console.log('IPv4 Force Success:', res.status);
  } catch (err) {
    console.error('IPv4 Force Failed:', err.message);
  }
}

testFetchOrder();

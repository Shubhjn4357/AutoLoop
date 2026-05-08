import fs from 'fs';
import { execSync } from 'child_process';

/**
 * Script to push .env variables to Hugging Face Spaces.
 * Usage: node scripts/push-hf-env.mjs <path-to-env> <repo-id>
 */

const envPath = process.argv[2];
const repoId = process.argv[3];
let hfToken = process.env.HF_TOKEN;

if (!envPath || !repoId) {
  console.error('Usage: node scripts/push-hf-env.mjs <path-to-env> <repo-id>');
  process.exit(1);
}

// Try to load token from file if not in environment
if (!hfToken && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  const match = content.match(/^HF_TOKEN=(.*)$/m);
  if (match) {
    hfToken = match[1].trim().replace(/^["']|["']$/g, '');
  }
}

if (!hfToken) {
  console.error('HF_TOKEN environment variable is required (or set HF_TOKEN in your .env file)');
  process.exit(1);
}

const SECRETS_KEYWORDS = [
  'TOKEN', 'SECRET', 'KEY', 'AUTH', 'PASSWORD', 'PRIVATE', 'DATABASE_URL', 'URL'
];

function isSecret(key) {
  return SECRETS_KEYWORDS.some(kw => key.toUpperCase().includes(kw));
}

async function fetchExisting(type) {
  const url = `https://huggingface.co/api/spaces/${repoId}/${type}`;
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${hfToken}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(item => item.key) : [];
  } catch (err) {
    console.error(`Failed to fetch existing ${type}:`, err.message);
    return [];
  }
}

async function pushToHF() {
  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`Checking existing variables for Space: ${repoId}...`);
  const existingSecrets = await fetchExisting('secrets');
  const existingVars = await fetchExisting('variables');
  
  console.log(`Pushing variables from ${envPath}...`);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');

    if (!key || !value) continue;

    const keyName = key.trim();
    const type = isSecret(keyName) ? 'secrets' : 'variables';
    
    // Skip if exists
    const exists = type === 'secrets' 
      ? existingSecrets.includes(keyName) 
      : existingVars.includes(keyName);

    if (exists) {
      console.log(`⏭️ ${keyName} already exists, skipping.`);
      continue;
    }

    const url = `https://huggingface.co/api/spaces/${repoId}/${type}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: keyName,
          value: value.trim(),
        }),
      });

      if (response.ok) {
        console.log(`✅ ${keyName} (${type}) pushed successfully.`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to push ${keyName}: ${response.status} ${error}`);
      }
    } catch (err) {
      console.error(`❌ Error pushing ${keyName}: ${err.message}`);
    }
  }
}

pushToHF();


import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';

// Load environment variables
dotenv.config({
  debug: true,
});

const HF_TOKEN = process.env.HF_TOKEN;
const SPACE_ID = "shubhjn/AutoLoop";

if (!HF_TOKEN) {
  console.error("Error: HF_TOKEN is not defined in .env file");
  process.exit(1);
}

const type = process.argv[2]; // 'build' or 'run'

if (!type || (type !== 'build' && type !== 'run')) {
  console.error("Usage: pnpm run log:view <build|run>");
  process.exit(1);
}

const url = `https://huggingface.co/api/spaces/${SPACE_ID}/logs/${type}`;

console.log(`Fetching ${type} logs from ${SPACE_ID}...`);

const options = {
  headers: {
    Authorization: `Bearer ${HF_TOKEN}`,
  },
};

const logFile = fs.createWriteStream('build_log.txt');

https.get(url, options, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Error: Failed to fetch logs. Status Code: ${res.statusCode}`);
    res.resume(); // Consume response data to free up memory
    return;
  }

  let buffer = '';

  res.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        try {
          const jsonStr = line.slice(6); // Remove 'data: ' prefix
          if (jsonStr.trim() === '[DONE]') return;
          const parsed = JSON.parse(jsonStr);
          if (parsed.data) {
            logFile.write(parsed.data);
          }
        } catch (e) {
          // Ignore parse errors for partial lines or heartbeats
        }
      }
    });
  });

  res.on('end', () => {
    console.log('Logs saved to build_log.txt');
    logFile.end();
  });

}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});

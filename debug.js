import { loadAgent, query } from 'gitclaw';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: node index.js <path-to-metrics.csv>');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error('File not found: ' + csvPath);
  process.exit(1);
}

const agent = await loadAgent('.');
const csv = fs.readFileSync(csvPath, 'utf8');
const modelName = path.basename(csvPath, '.csv');

console.log('Bloop is auditing: ' + csvPath + '\n');

const input = `Audit the following ML model metrics CSV. 
File: ${modelName}
Produce your full 4-section report: WHERE it fails / WHY it fails / HOW to fix it / BLOOP SCORE (1-10).

${csv}`;

const raw = await query(agent, input);

// Debug: see exactly what comes back
console.log('RAW TYPE:', typeof raw);
console.log('RAW VALUE:', JSON.stringify(raw, null, 2));
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const csvPath = process.argv[2];
if (!csvPath || !fs.existsSync(csvPath)) {
  console.error('Usage: node index.js <path-to-csv>');
  process.exit(1);
}

// Load agent identity from gitagent files — this IS the gitclaw pattern
const soul = fs.readFileSync('SOUL.md', 'utf8');
const rules = fs.readFileSync('RULES.md', 'utf8');

// Smart sampling — keep under 3000 tokens
const allLines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim());
const header = allLines[0];
const dataRows = allLines.slice(1, 30);
const csv = [header, ...dataRows].join('\n');
const totalRows = allLines.length - 1;
const modelName = path.basename(csvPath, '.csv');

console.log('Bloop is auditing: ' + csvPath + ' (' + totalRows + ' rows)\n');

const systemPrompt = soul + '\n\n' + rules;
const userPrompt = `Audit this ML dataset CSV. File: ${modelName}\nTotal rows: ${totalRows}\n\n${csv}\n\nProduce your 4-section report: WHERE / WHY / HOW / BLOOP SCORE.`;

const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
  },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })
});

const data = await response.json();
if (data.error) { console.error('Groq error:', data.error.message); process.exit(1); }

const output = data.choices[0].message.content;
console.log('\n--- BLOOP REPORT ---\n');
console.log(output);

fs.mkdirSync('reports', { recursive: true });
const reportFile = 'reports/' + modelName + '_report.md';
fs.writeFileSync(reportFile, output);
console.log('\nReport saved to: ' + reportFile);

try {
  execSync('git add ' + reportFile);
  const score = (output.match(/Bloop Score[\s:]+(\d+)/i) || [])[1] || 'X';
  execSync('git commit -m "bloop audit: ' + modelName + ' scored ' + score + '/10"');
  console.log('Report committed to git');
} catch (e) {
  console.log('Git commit skipped:', e.message);
}
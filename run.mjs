import OpenAI from "openai";
import fs from "fs";
import readline from "readline";

const soul = fs.readFileSync("SOUL.md", "utf8");
const rules = fs.readFileSync("RULES.md", "utf8");
const segmentSkill = fs.readFileSync("skills/segment-analysis/SKILL.md", "utf8");
const rootCauseSkill = fs.readFileSync("skills/root-cause/SKILL.md", "utf8");
const fixSkill = fs.readFileSync("skills/fix-generator/SKILL.md", "utf8");
const memory = fs.readFileSync("memory/MEMORY.md", "utf8");

const csvFile = process.argv[2];
const csvData = csvFile && fs.existsSync(csvFile)
  ? `Dataset loaded from ${csvFile}:\n${fs.readFileSync(csvFile, "utf8")}`
  : "No dataset provided. Ask the user to describe their model problem.";

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = `${soul}\n\n${rules}\n\nSkills:\n${segmentSkill}\n\n${rootCauseSkill}\n\n${fixSkill}\n\nPast audit memory:\n${memory}\n\nDataset context:\n${csvData}`;

const messages = [{ role: "system", content: systemPrompt }];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function saveMemory(audit) {
  const timestamp = new Date().toISOString();
  const existing = fs.readFileSync("memory/MEMORY.md", "utf8");
  const entry = `\n\n## Audit — ${timestamp}\n${audit}`;
  fs.writeFileSync("memory/MEMORY.md", existing + entry);
}

async function chat(userMessage) {
  messages.push({ role: "user", content: userMessage });

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages,
  });

  const reply = response.choices[0].message.content;
  messages.push({ role: "assistant", content: reply });

  if (reply.includes("Segment Analysis") || reply.includes("Fix")) {
    saveMemory(reply);
  }

  return reply;
}

function askQuestion(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

console.log("\n🔍 Bloop v0.1.0 — Ruthless ML Auditor");
if (csvFile) {
  console.log(`Dataset: ${csvFile} loaded.`);
} else {
  console.log("No dataset provided. Describe your model problem.");
}
console.log("Type your prompt or 'exit' to quit.\n");

while (true) {
  const input = await askQuestion("You: ");
  if (input.toLowerCase() === "exit") {
    console.log("Bloop out.");
    rl.close();
    break;
  }
  if (!input.trim()) continue;

  console.log("\nBloop: thinking...\n");
  const reply = await chat(input);
  console.log("Bloop:", reply);
  console.log("\n" + "─".repeat(60) + "\n");
}
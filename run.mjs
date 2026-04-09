import OpenAI from "openai";
import fs from "fs";
import path from "path";
import readline from "readline";

// ─── Load agent files ──────────────────────────────────────────────────────────
const soul = fs.readFileSync("SOUL.md", "utf8");
const rules = fs.readFileSync("RULES.md", "utf8");
const taxonomy = fs.readFileSync("knowledge/ml-failure-taxonomy.md", "utf8");
const patterns = fs.readFileSync("memory/runtime/patterns.md", "utf8");
const dailylog = fs.readFileSync("memory/runtime/dailylog.md", "utf8");

const segmentSkill = fs.readFileSync("skills/segment-analysis/SKILL.md", "utf8");
const rootCauseSkill = fs.readFileSync("skills/root-cause/SKILL.md", "utf8");
const fixSkill = fs.readFileSync("skills/fix-generator/SKILL.md", "utf8");

// ─── Bootstrap: session context ────────────────────────────────────────────────
const sessionId = `session-${Date.now()}`;
const sessionStart = new Date().toISOString();

const contextState = {
  session_id: sessionId,
  dataset_loaded: null,
  pipeline_stage: "idle",
  segment_analysis_complete: false,
  root_cause_complete: false,
  fix_generator_complete: false,
  bloop_score: null,
  started_at: sessionStart,
};

fs.writeFileSync(
  "memory/runtime/context.md",
  `# Bloop — Current Session Context\n\n\`\`\`json\n${JSON.stringify(contextState, null, 2)}\n\`\`\``
);

// ─── CSV loading ───────────────────────────────────────────────────────────────
const csvFile = process.argv[2];
const csvData =
  csvFile && fs.existsSync(csvFile)
    ? fs.readFileSync(csvFile, "utf8")
    : null;

// ─── Client setup (lazy — requires GROQ_API_KEY at runtime) ───────────────────
const MODEL = "llama-3.3-70b-versatile";

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    console.error("Error: GROQ_API_KEY environment variable is not set.");
    console.error("Run: $env:GROQ_API_KEY='gsk_...' (PowerShell) or export GROQ_API_KEY=gsk_...");
    process.exit(1);
  }
  return new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
  });
}

// ─── Audit log ─────────────────────────────────────────────────────────────────
const auditLogPath = ".gitagent/audit.jsonl";
if (!fs.existsSync(".gitagent")) fs.mkdirSync(".gitagent", { recursive: true });

function writeAuditLog(entry) {
  fs.appendFileSync(auditLogPath, JSON.stringify(entry) + "\n");
}

// ─── Core LLM call ────────────────────────────────────────────────────────────
async function callSkill(skillName, skillSpec, systemContext, userPrompt) {
  const client = getClient();
  const start = Date.now();
  const messages = [
    { role: "system", content: `${soul}\n\n${rules}\n\n${skillSpec}\n\n${systemContext}` },
    { role: "user", content: userPrompt },
  ];

  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
  });

  const output = response.choices[0].message.content;
  const durationMs = Date.now() - start;

  writeAuditLog({
    session_id: sessionId,
    skill: skillName,
    timestamp: new Date().toISOString(),
    duration_ms: durationMs,
    tokens_used: response.usage?.total_tokens ?? null,
    output_length: output.length,
  });

  return output;
}

// ─── Pipeline: 3 sequential skill calls ──────────────────────────────────────
async function runAuditPipeline(dataset) {
  const knowledgeContext = `## Domain Knowledge (Pre-loaded)\n${taxonomy}\n\n## Patterns from Past Audits\n${patterns}`;

  console.log("\n── STEP 1/3: Segment Analysis (Auditor role) ─────────────────");
  contextState.pipeline_stage = "segment-analysis";
  fs.writeFileSync(
    "memory/runtime/context.md",
    `# Bloop — Current Session Context\n\n\`\`\`json\n${JSON.stringify(contextState, null, 2)}\n\`\`\``
  );

  const segmentOutput = await callSkill(
    "segment-analysis",
    segmentSkill,
    knowledgeContext,
    `Run segment analysis on this dataset. Identify worst-performing segments with F1 scores and severity labels.\n\nDataset:\n${dataset}`
  );

  contextState.segment_analysis_complete = true;
  console.log("\nBloop [Auditor]:\n" + segmentOutput);

  console.log("\n── STEP 2/3: Root Cause Analysis (Analyst role) ──────────────");
  contextState.pipeline_stage = "root-cause";

  const rootCauseOutput = await callSkill(
    "root-cause",
    rootCauseSkill,
    knowledgeContext,
    `The segment analysis found the following failures:\n\n${segmentOutput}\n\nDiagnose the root causes. Cite specific numbers. Do not suggest fixes.`
  );

  contextState.root_cause_complete = true;
  console.log("\nBloop [Analyst]:\n" + rootCauseOutput);

  console.log("\n── STEP 3/3: Fix Generator (Executor role) ───────────────────");
  contextState.pipeline_stage = "fix-generator";

  const fixOutput = await callSkill(
    "fix-generator",
    fixSkill,
    knowledgeContext,
    `Root causes confirmed by the Analyst:\n\n${rootCauseOutput}\n\nSegment context:\n${segmentOutput}\n\nPrescribe ranked fixes for each confirmed root cause. Calculate the Bloop Score. Output a one-line verdict.`
  );

  contextState.fix_generator_complete = true;
  console.log("\nBloop [Executor]:\n" + fixOutput);

  // ─── Extract Bloop Score ─────────────────────────────────────────────────
  const scoreMatch = fixOutput.match(/BLOOP SCORE:\s*(\d+)/i);
  const bloopScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
  contextState.bloop_score = bloopScore;

  return { segmentOutput, rootCauseOutput, fixOutput, bloopScore };
}

// ─── Teardown: write memory ───────────────────────────────────────────────────
function teardown(datasetName, result) {
  const { segmentOutput, rootCauseOutput, fixOutput, bloopScore } = result;
  const timestamp = new Date().toISOString();

  // Append to daily log
  const logEntry = `\n## Audit — ${timestamp}\n- Dataset: ${datasetName}\n- Bloop Score: ${bloopScore ?? "unknown"}/10\n- Session: ${sessionId}\n`;
  fs.appendFileSync("memory/runtime/dailylog.md", logEntry);

  // Write full audit trace to .gitagent/audit.jsonl
  writeAuditLog({
    session_id: sessionId,
    event: "audit_complete",
    dataset: datasetName,
    bloop_score: bloopScore,
    steps_executed: ["segment-analysis", "root-cause", "fix-generator"],
    timestamp,
  });

  // Reset context
  contextState.pipeline_stage = "complete";
  fs.writeFileSync(
    "memory/runtime/context.md",
    `# Bloop — Current Session Context\n\n\`\`\`json\n${JSON.stringify(contextState, null, 2)}\n\`\`\``
  );

  // Save full report to reports/
  if (!fs.existsSync("reports")) fs.mkdirSync("reports");
  const reportName = `reports/audit-${sessionId}.md`;
  const fullReport = `# Bloop Audit Report\n\nDataset: ${datasetName}\nSession: ${sessionId}\nDate: ${timestamp}\nBloop Score: ${bloopScore ?? "unknown"}/10\n\n---\n\n## WHERE IT FAILS (Segment Analysis)\n\n${segmentOutput}\n\n---\n\n## WHY IT FAILS (Root Cause)\n\n${rootCauseOutput}\n\n---\n\n## HOW TO FIX IT (Fix Plan)\n\n${fixOutput}\n`;
  fs.writeFileSync(reportName, fullReport);
  console.log(`\n✓ Report saved to ${reportName}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const patternCount = (patterns.match(/\|/g) || []).length / 5; // rough row count
const auditTodayCount = (dailylog.match(/## Audit/g) || []).length;

console.log(`\n🔍 Bloop v1.0.0 — Ruthless ML Auditor`);
console.log(`Loaded ${Math.floor(patternCount)} failure patterns from memory.`);
console.log(`${auditTodayCount} audit(s) in today's log.`);

if (csvFile && csvData) {
  console.log(`Dataset: ${csvFile} loaded (${csvData.split("\n").length} rows).`);
  contextState.dataset_loaded = csvFile;

  const result = await runAuditPipeline(csvData);
  teardown(path.basename(csvFile), result);
  console.log("\nBloop out.");
} else {
  // Interactive mode — accept a single prompt, then run the pipeline
  console.log("No dataset provided. Describe your model problem or paste CSV data.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("You: ", async (input) => {
    rl.close();
    if (!input.trim()) { console.log("Bloop: No input. Exiting."); process.exit(0); }

    const result = await runAuditPipeline(input);
    teardown("interactive-session", result);
    console.log("\nBloop out.");
  });
}
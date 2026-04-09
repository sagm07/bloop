import { query } from "gitclaw";
import { createServer } from "http";
import fs from "fs";
import path from "path";

const PORT = process.env.PORT || 3000;
const AGENT_DIR = process.cwd();
const MODEL = process.env.MODEL || "groq:llama-3.3-70b-versatile";

// ── CORS headers ──────────────────────────────────────────────────────────────
function setCORSHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// ── Parse incoming request body ───────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

// ── Main audit handler ────────────────────────────────────────────────────────
async function handleAudit(req, res) {
  const body = await readBody(req);
  const { csv, prompt: userPrompt, apiKey } = body;

  if (!csv && !userPrompt) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing csv or prompt in request body" }));
    return;
  }

  // Build the prompt — same as run.mjs but for HTTP
  const auditPrompt = csv
    ? `Audit this ML dataset CSV:\n\n${csv}\n\nProduce your full 4-section report: WHERE IT FAILS / WHY IT FAILS / HOW TO FIX IT / BLOOP SCORE.`
    : userPrompt;

  // Set up streaming SSE response
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  // Write a keepalive comment immediately
  res.write(": bloop audit starting\n\n");

  // Override GROQ_API_KEY if provided in request (for UI use)
  const env = { ...process.env };
  if (apiKey) env.GROQ_API_KEY = apiKey;

  let fullText = "";
  let bloopScore = null;

  try {
    const agentQuery = query({
      prompt: auditPrompt,
      dir: AGENT_DIR,
      model: MODEL,
      env: undefined,
      // Inject API key via env override
      ...(apiKey && {
        systemPromptSuffix: "",
      }),
    });

    // We need the API key injected — patch env before query runs
    if (apiKey) process.env.GROQ_API_KEY = apiKey;

    for await (const msg of agentQuery) {
      if (msg.type === "delta") {
        fullText += msg.content;
        // Stream each delta as an SSE event
        res.write(`data: ${JSON.stringify({ type: "delta", content: msg.content })}\n\n`);
      } else if (msg.type === "assistant") {
        fullText = msg.content || fullText;
        // Extract Bloop Score
        const scoreMatch = fullText.match(/BLOOP SCORE:\s*(\d+)/i);
        bloopScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
      } else if (msg.type === "system" && msg.subtype === "error") {
        res.write(`data: ${JSON.stringify({ type: "error", content: msg.content })}\n\n`);
      }
    }

    // Final complete event with score
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        bloopScore,
        fullText,
      })}\n\n`
    );

    // Save report
    if (fullText) {
      const sessionId = `session-${Date.now()}`;
      fs.mkdirSync("reports", { recursive: true });
      fs.writeFileSync(
        `reports/clawless-${sessionId}.md`,
        `# Bloop Audit — Clawless\n\n${fullText}`
      );

      // Append to daily log
      const logEntry = `\n## Audit — ${new Date().toISOString()}\n- Source: clawless HTTP\n- Bloop Score: ${bloopScore ?? "unknown"}/10\n`;
      fs.appendFileSync("memory/runtime/dailylog.md", logEntry);
    }
  } catch (err) {
    res.write(
      `data: ${JSON.stringify({ type: "error", content: err.message })}\n\n`
    );
  } finally {
    // Restore original key
    if (apiKey && process.env.GROQ_API_KEY === apiKey) {
      delete process.env.GROQ_API_KEY;
    }
    res.end();
  }
}

// ── HTTP Server ────────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  setCORSHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === "/" || url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        agent: "bloop",
        version: "1.0.0",
        model: MODEL,
        endpoints: {
          audit: "POST /audit — { csv, apiKey? } → SSE stream",
          health: "GET / — health check",
        },
      })
    );
    return;
  }

  // Audit endpoint
  if (url.pathname === "/audit" && req.method === "POST") {
    await handleAudit(req, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`🔍 Bloop v1.0.0 — Clawless server running on port ${PORT}`);
  console.log(`   POST /audit  → Streams audit as SSE`);
  console.log(`   GET  /       → Health check`);
  console.log(`   Model: ${MODEL}`);
});

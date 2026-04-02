import fs from "fs";

const input = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const { filepath, target_column } = input;

if (!fs.existsSync(filepath)) {
  console.log(JSON.stringify({ error: `File not found: ${filepath}` }));
  process.exit(1);
}

const csv = fs.readFileSync(filepath, "utf8");
const lines = csv.trim().split("\n");
const headers = lines[0].split(",").map(h => h.trim());
const rows = lines.slice(1).map(line => {
  const values = line.split(",");
  return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? ""]));
});

const duplicates = rows.length - new Set(rows.map(r => JSON.stringify(r))).size;
const missingByCol = {};
headers.forEach(h => {
  missingByCol[h] = rows.filter(r => !r[h] || r[h] === "").length;
});

const hasPredicted = headers.some(h => h.toLowerCase().includes("predict"));
const hasActual = headers.some(h => 
  h.toLowerCase().includes("actual") || 
  h.toLowerCase().includes("label") || 
  h.toLowerCase().includes("target")
);

console.log(JSON.stringify({
  loaded: true,
  rows: rows.length,
  headers,
  duplicate_rows: duplicates,
  missing_values: missingByCol,
  has_actual_column: hasActual,
  has_predicted_column: hasPredicted,
  detected_target: target_column || headers.find(h => 
    h.toLowerCase().includes("actual") || 
    h.toLowerCase().includes("label")
  ),
  data: rows
}));
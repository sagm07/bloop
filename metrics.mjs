import fs from "fs";
import { parse } from "csv-parse/sync";

export function loadCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

export function computeMetrics(rows) {
  const classes = [...new Set([...rows.map(r => r.actual), ...rows.map(r => r.predicted)])].sort();
  const stats = {};
  for (const cls of classes) stats[cls] = { tp: 0, fp: 0, fn: 0 };

  for (const row of rows) {
    for (const cls of classes) {
      const isActual = row.actual === cls;
      const isPredicted = row.predicted === cls;
      if (isActual && isPredicted) stats[cls].tp++;
      else if (!isActual && isPredicted) stats[cls].fp++;
      else if (isActual && !isPredicted) stats[cls].fn++;
    }
  }

  const classMetrics = {};
  for (const cls of classes) {
    const { tp, fp, fn } = stats[cls];
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    classMetrics[cls] = {
      f1: +f1.toFixed(4),
      precision: +precision.toFixed(4),
      recall: +recall.toFixed(4),
      support: rows.filter(r => r.actual === cls).length,
      tp, fp, fn
    };
  }

  const accuracy = rows.filter(r => r.actual === r.predicted).length / rows.length;
  const macroF1 = classes.reduce((s, c) => s + classMetrics[c].f1, 0) / classes.length;
  const distribution = {};
  for (const cls of classes) {
    distribution[cls] = +((classMetrics[cls].support / rows.length) * 100).toFixed(1);
  }
  const imbalanceFlags = Object.entries(distribution).filter(([, p]) => p < 20).map(([c]) => c);
  const criticalFailures = Object.entries(classMetrics).filter(([, m]) => m.f1 < 0.5).map(([c, m]) => ({ class: c, f1: m.f1 }));

  return { totalRows: rows.length, classes, accuracy: +accuracy.toFixed(4), macroF1: +macroF1.toFixed(4), classMetrics, distribution, imbalanceFlags, criticalFailures };
}

export function formatMetricsForPrompt(metrics, filePath) {
  const lines = [];
  lines.push(`=== COMPUTED METRICS FROM: ${filePath} ===`);
  lines.push(`Samples: ${metrics.totalRows} | Accuracy: ${(metrics.accuracy * 100).toFixed(2)}% | Macro F1: ${metrics.macroF1}`);
  lines.push("");
  lines.push("Per-Class:");
  for (const [cls, m] of Object.entries(metrics.classMetrics)) {
    const flag = m.f1 < 0.5 ? " << CRITICAL FAILURE" : m.f1 < 0.7 ? " << WARNING" : "";
    lines.push(`  Class "${cls}": F1=${m.f1} Precision=${m.precision} Recall=${m.recall} Support=${m.support} (${metrics.distribution[cls]}%)${flag}`);
  }
  if (metrics.imbalanceFlags.length > 0) lines.push(`\nIMBALANCE: Classes with <20% representation: ${metrics.imbalanceFlags.join(", ")}`);
  if (metrics.criticalFailures.length > 0) lines.push(`CRITICAL FAILURES (F1<0.5): ${metrics.criticalFailures.map(c => `"${c.class}" F1=${c.f1}`).join(", ")}`);
  lines.push("\nINSTRUCTION: These numbers are computed from real data. Cite them exactly. Never estimate metrics.");
  return lines.join("\n");
}

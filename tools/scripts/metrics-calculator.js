const chunks = [];
process.stdin.on("data", d => chunks.push(d));
process.stdin.on("end", () => {
  const { actual, predicted, segments } = JSON.parse(chunks.join(""));
  const classes = [...new Set([...actual, ...predicted])];

  const metrics = {};
  for (const cls of classes) {
    const tp = actual.filter((a, i) => a == cls && predicted[i] == cls).length;
    const fp = actual.filter((a, i) => a != cls && predicted[i] == cls).length;
    const fn = actual.filter((a, i) => a == cls && predicted[i] != cls).length;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = 2 * precision * recall / (precision + recall) || 0;
    metrics[cls] = {
      precision: +precision.toFixed(3),
      recall: +recall.toFixed(3),
      f1: +f1.toFixed(3),
      support: actual.filter(a => a == cls).length,
      severity: f1 < 0.5 ? "SEVERE" : f1 < 0.7 ? "MODERATE" : "MILD"
    };
  }

  const worst = Object.entries(metrics)
    .sort((a, b) => a[1].f1 - b[1].f1)
    .slice(0, 3)
    .map(([cls, m]) => ({ class: cls, ...m }));

  const overall_accuracy = actual.filter((a, i) => a == predicted[i]).length / actual.length;

  console.log(JSON.stringify({
    overall_accuracy: +overall_accuracy.toFixed(3),
    per_class_metrics: metrics,
    worst_segments: worst,
    critical_failures: worst.filter(w => w.f1 < 0.5)
  }));
});
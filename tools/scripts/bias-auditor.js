const chunks = [];
process.stdin.on("data", d => chunks.push(d));
process.stdin.on("end", () => {
  const { data, sensitive_attributes, actual_column, predicted_column } = JSON.parse(chunks.join(""));

  const results = {};

  for (const attr of sensitive_attributes) {
    const groups = [...new Set(data.map(r => r[attr]).filter(Boolean))];
    const groupMetrics = {};

    for (const group of groups) {
      const subset = data.filter(r => r[attr] === group);
      const actual = subset.map(r => r[actual_column]);
      const predicted = subset.map(r => r[predicted_column]);
      const tp = actual.filter((a, i) => a == "1" && predicted[i] == "1").length;
      const fp = actual.filter((a, i) => a == "0" && predicted[i] == "1").length;
      const fn = actual.filter((a, i) => a == "1" && predicted[i] == "0").length;
      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      const f1 = 2 * precision * recall / (precision + recall) || 0;
      const positive_rate = predicted.filter(p => p == "1").length / predicted.length;
      groupMetrics[group] = {
        f1: +f1.toFixed(3),
        positive_rate: +positive_rate.toFixed(3),
        count: subset.length
      };
    }

    const f1_values = Object.values(groupMetrics).map(m => m.f1);
    const pr_values = Object.values(groupMetrics).map(m => m.positive_rate);
    const f1_gap = +(Math.max(...f1_values) - Math.min(...f1_values)).toFixed(3);
    const pr_gap = +(Math.max(...pr_values) - Math.min(...pr_values)).toFixed(3);

    results[attr] = {
      group_metrics: groupMetrics,
      f1_gap,
      demographic_parity_gap: pr_gap,
      bias_severity: f1_gap > 0.2 ? "SEVERE" : f1_gap > 0.1 ? "MODERATE" : "MILD"
    };
  }

  console.log(JSON.stringify({ bias_audit: results }));
});
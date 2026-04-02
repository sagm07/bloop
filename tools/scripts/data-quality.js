const chunks = [];
process.stdin.on("data", d => chunks.push(d));
process.stdin.on("end", () => {
  const input = JSON.parse(chunks.join(""));
  const { data, target_column } = input;

  const duplicates = data.length - new Set(data.map(r => JSON.stringify(r))).size;

  const missing = {};
  Object.keys(data[0] || {}).forEach(col => {
    missing[col] = data.filter(r => !r[col] || r[col] === "").length;
  });

  const targetValues = data.map(r => r[target_column]).filter(Boolean);
  const valueCounts = {};
  targetValues.forEach(v => valueCounts[v] = (valueCounts[v] || 0) + 1);
  const total = targetValues.length;
  const classDist = Object.entries(valueCounts).map(([k, v]) => ({
    class: k,
    count: v,
    percent: ((v / total) * 100).toFixed(1) + "%"
  }));

  const maxCount = Math.max(...Object.values(valueCounts));
  const minCount = Math.min(...Object.values(valueCounts));
  const imbalanceRatio = (maxCount / minCount).toFixed(1);
  const isImbalanced = imbalanceRatio > 3;

  console.log(JSON.stringify({
    total_rows: data.length,
    duplicate_rows: duplicates,
    duplicate_severity: duplicates > 0 ? (duplicates > 5 ? "SEVERE" : "MODERATE") : "NONE",
    missing_values: missing,
    class_distribution: classDist,
    imbalance_ratio: imbalanceRatio,
    imbalance_severity: isImbalanced ? (imbalanceRatio > 10 ? "SEVERE" : "MODERATE") : "NONE"
  }));
});
const chunks = [];
process.stdin.on("data", d => chunks.push(d));
process.stdin.on("end", () => {
  const { reference, current, columns } = JSON.parse(chunks.join(""));

  const results = {};

  for (const col of columns) {
    const ref = reference.map(r => r[col]).filter(Boolean);
    const cur = current.map(r => r[col]).filter(Boolean);

    const refCounts = {};
    const curCounts = {};
    ref.forEach(v => refCounts[v] = (refCounts[v] || 0) + 1);
    cur.forEach(v => curCounts[v] = (curCounts[v] || 0) + 1);

    const allKeys = [...new Set([...Object.keys(refCounts), ...Object.keys(curCounts)])];
    let psi = 0;
    for (const key of allKeys) {
      const refPct = (refCounts[key] || 0.0001) / ref.length;
      const curPct = (curCounts[key] || 0.0001) / cur.length;
      psi += (curPct - refPct) * Math.log(curPct / refPct);
    }

    results[col] = {
      psi: +psi.toFixed(4),
      drift_severity: psi < 0.1 ? "NONE" : psi < 0.2 ? "MODERATE" : "SEVERE",
      reference_distribution: refCounts,
      current_distribution: curCounts
    };
  }

  console.log(JSON.stringify({ drift_results: results }));
});
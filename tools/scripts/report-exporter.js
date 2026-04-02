const chunks = [];
process.stdin.on("data", d => chunks.push(d));
process.stdin.on("end", () => {
  const { filename, content } = JSON.parse(chunks.join(""));
  const timestamp = new Date().toISOString();
  const report = `# Bloop Audit Report\nGenerated: ${timestamp}\n\n${content}`;
  
  import("fs").then(fs => {
    fs.default.writeFileSync(filename, report);
    console.log(JSON.stringify({ exported: true, filename, timestamp }));
  });
});
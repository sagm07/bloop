import OpenAI from "openai";
import fs from "fs";

const soul = fs.readFileSync("SOUL.md", "utf8");
const rules = fs.readFileSync("RULES.md", "utf8");
const segmentSkill = fs.readFileSync("skills/segment-analysis/SKILL.md", "utf8");
const rootCauseSkill = fs.readFileSync("skills/root-cause/SKILL.md", "utf8");
const fixSkill = fs.readFileSync("skills/fix-generator/SKILL.md", "utf8");

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const response = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: `${soul}\n\n${rules}\n\nSkills you must use in order:\n\n${segmentSkill}\n\n${rootCauseSkill}\n\n${fixSkill}` },
    { role: "user", content: "My XGBoost model for diabetic retinopathy detection has plateaued at 87% accuracy. Training accuracy is 94%, validation accuracy is 87%, class ratio is 80% negative 20% positive. Run your full audit." }
  ],
});

console.log(response.choices[0].message.content);
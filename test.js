import { query } from 'gitclaw';

for await (const msg of query({
  prompt: 'Say hello',
  dir: '.',
  model: 'groq:llama-3.1-8b-instant'
})) {
  console.log(JSON.stringify(msg));
}
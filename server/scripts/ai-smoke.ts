/**
 * AI provider smoke test — proves the vsllm (OpenAI-compatible) provider works
 * under the configured AI_API_KEY and that dynamic question generation
 * produces valid, parseable MCQs.
 *
 * Run: npx ts-node scripts/ai-smoke.ts  (from server/)
 * Does NOT touch the database — the question generator only needs the topic name.
 */
import dotenv from 'dotenv';
dotenv.config();

import { callAi, callAiJson, isAiEnabled, aiProviderLabel } from '../src/utils/ai';
import { generateQuestions } from '../src/services/mcqService';

async function main() {
  console.log('=== AI provider smoke test ===');
  console.log('aiEnabled:', isAiEnabled(), '| provider:', aiProviderLabel());

  if (!isAiEnabled()) {
    console.error('FAIL: No working AI key detected. Set AI_API_KEY (or GEMINI_API_KEY).');
    process.exit(1);
  }

  // 1) raw chat round-trip
  const reply = await callAi({
    prompt: 'Reply with exactly: OK',
    temperature: 0,
    maxTokens: 20
  });
  if (!reply) {
    console.error('FAIL: callAi returned null — provider unreachable or key rejected.');
    process.exit(1);
  }
  console.log('1) callAi round-trip OK ->', JSON.stringify(reply.slice(0, 60)));

  // 2) dynamic question generation (the API feature)
  const questions = await generateQuestions({
    topic: 'Time and Work',
    count: 3,
    difficulty: 'MEDIUM'
  });
  if (!Array.isArray(questions) || questions.length === 0) {
    console.error('FAIL: generateQuestions returned nothing.');
    process.exit(1);
  }
  console.log(`2) generateQuestions OK -> ${questions.length} questions`);
  for (const q of questions) {
    const okShape = q.questionText && Array.isArray(q.options) && q.options.length === 4
      && typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3;
    console.log(`   [${okShape ? 'valid' : 'INVALID'}] ${q.questionText.slice(0, 70)}`);
    console.log(`      answer: ${q.answer} | diff: ${q.difficulty} | isAI: ${q.isAI}`);
  }

  console.log('=== ALL PASS ===');
  process.exit(0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
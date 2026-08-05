/**
 * Live AI feature probe — proves each AI feature produced REAL model output
 * (vs sandbox fallback) under the configured provider key.
 * Run: npx ts-node scripts/ai-features-check.ts
 */
import { db } from '../src/prisma/db';
import { isAiEnabled, aiProviderLabel, callAiJson } from '../src/utils/ai';
import { generateQuestions } from '../src/services/mcqService';
import { startInterview } from '../src/services/interviewService';
import { auditResume } from '../src/services/resumeService';
import { evaluateSpeech } from '../src/services/commService';

const FALLBACK_ATS = 65;
const FALLBACK_COMM = { grammarScore: 80, fluencyScore: 80, confidenceScore: 85 };

async function main() {
  console.log(`=== AI feature live probe ===`);
  console.log(`aiEnabled: ${isAiEnabled()} | provider: ${aiProviderLabel()}`);

  // ensure test user exists in memory DB
  const existing = await db.user.findUnique({ where: { id: 'ai-feat-probe' } });
  if (!existing) {
    await db.user.create({ data: { id: 'ai-feat-probe', email: 'probe@college.edu', fullName: 'Probe', role: 'STUDENT' } });
  }

  const results: Array<{ feature: string; live: boolean; note: string }> = [];

  // 1. Dynamic question generation
  try {
    const qs = await generateQuestions({ topic: 'Time and Work', count: 3, difficulty: 'MEDIUM' });
    const live = Array.isArray(qs) && qs.length > 0 && qs[0]?.isAI === true && qs[0]?.questionText.length > 5;
    results.push({
      feature: 'generateQuestions',
      live,
      note: live ? `${qs.length} AI questions, first: "${qr(qs[0].questionText)}"` : `got ${qs?.length ?? 0}: ${JSON.stringify(qs).slice(0, 120)}`
    });
  } catch (e: any) {
    results.push({ feature: 'generateQuestions', live: false, note: `THREW: ${e.message}` });
  }

  // 2. startInterview (compare to canned standardQuestions)
  try {
    const qs = await startInterview('ai-feat-probe', 'TECHNICAL', 'Google');
    const first = qs[0];
    const canned = {
      q: "Can you explain the difference between processes and threads?",
      optimal: "Processes have independent memory address spaces and are isolated. Threads share the memory of their parent process, making communication lightweight but requiring synchronization locks."
    };
    const live = first?.q !== canned.q && first?.q?.length > 20;
    results.push({ feature: 'startInterview', live, note: live ? `Q1: "${qr(first.q)}"` : `wood-fallback Q1: "${qr(first?.q)}"` });
  } catch (e: any) {
    results.push({ feature: 'startInterview', live: false, note: `THREW: ${e.message}` });
  }

  // 3. auditResume (fallback ATS score is 65)
  try {
    const r = await auditResume('ai-feat-probe', {
      personal: { name: 'Rahul Sharma', email: 'rahul@college.edu' },
      skills: 'JavaScript, React, Node.js',
      projectText: 'Built an AI placement pipeline using Express and Prisma.'
    });
    const live = typeof r.atsScore === 'number' && r.atsScore !== FALLBACK_ATS && r.atsScore > 0;
    results.push({ feature: 'auditResume', live, note: live ? `atsScore=${r.atsScore}, feedback items=${r.auditFeedback?.length}` : `atsScore=${r.atsScore} (== fallback ${FALLBACK_ATS})` });
  } catch (e: any) {
    results.push({ feature: 'auditResume', live: false, note: `THREW: ${e.message}` });
  }

  // 4. evaluateSpeech (fallback is 80/80/85)
  try {
    const r = await evaluateSpeech('ai-feat-probe', {
      sessionType: 'SPEAKING',
      transcript: 'I was building a web application and I ran into a bug. I debugged it using the console.',
      promptText: 'Describe a time you overcame a technical challenge.',
      durationSeconds: 20
    });
    const live = r.grammarScore !== FALLBACK_COMM.grammarScore && r.grammarScore >= 0;
    results.push({
      feature: 'evaluateSpeech',
      live,
      note: live ? `scores ${r.grammarScore}/${r.fluencyScore}/${r.confidenceScore}, recs=${r.recommendations?.length}` : `scores == fallback (${FALLBACK_COMM.grammarScore}/${FALLBACK_COMM.fluencyScore}/${FALLBACK_COMM.confidenceScore})`
    });
  } catch (e: any) {
    results.push({ feature: 'evaluateSpeech', live: false, note: `THREW: ${e.message}` });
  }

  // 5. sanity: verify callAiJson array extraction still used elsewhere
  const sanity = await callAiJson<any[]>({
    system: 'Return a JSON array with exactly 2 item objects: {"label": string, "score": number}.',
    prompt: 'Generate the array now.',
    temperature: 0.2,
    maxTokens: 2000
  });
  results.push({
    feature: 'callAiJson array-parse',
    live: Array.isArray(sanity) && sanity.length === 2,
    note: Array.isArray(sanity) ? `parsed ${sanity.length} items: ${JSON.stringify(sanity)}` : `raw: ${JSON.stringify(sanity)}`
  });

  console.log('');
  console.log('=== Results ===');
  let allLive = true;
  for (const r of results) {
    console.log(`  [${r.live ? 'LIVE' : 'FALLBACK'}] ${r.feature} — ${r.note}`);
    if (!r.live) allLive = false;
  }
  console.log('');
  console.log(allLive ? 'ALL FEATURES LIVE UNDER KEY ✓' : 'SOME FEATURES FELL BACK TO SANDBOX DATA — provider quota or prompt issue');
}

async function cleanup() {
  try { await (db as any).driver?.$disconnect?.(); } catch { /* memory driver has no native disconnect */ }
  process.exit(0);
}

function qr(s: string) { return (s || '').replace(/"/g, "'").slice(0, 110); }

main().then(cleanup).catch((e) => { console.error('FATAL', e); process.exit(1); });
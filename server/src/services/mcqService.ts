import { db } from '../prisma/db';
import { callAiJson } from '../utils/ai';

const correctIndexToLetter = (idx: number): 'A' | 'B' | 'C' | 'D' => {
  return (['A', 'B', 'C', 'D'] as const)[idx] || 'A';
};

const letterToCorrectIndex = (letter: string): number => {
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  return map[letter] ?? 0;
};

export async function createMcq(data: {
  topicId?: string;
  topic?: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}) {
  const { topicId, topic, questionText, options, correctIndex, explanation, difficulty } = data;

  if (!questionText || !options || options.length !== 4 || correctIndex < 0 || correctIndex > 3) {
    throw new Error('Invalid MCQ data: questionText, options[4], correctIndex(0-3) required.');
  }

  let targetTopic = null;
  if (topicId) {
    targetTopic = await db.aptitudeTopic.findUnique({ where: { id: topicId } });
  }
  if (!targetTopic && topic) {
    targetTopic = await db.aptitudeTopic.findFirst({ where: { name: topic } });
  }
  if (!targetTopic) {
    const seedTopic = await db.aptitudeTopic.findFirst();
    if (!seedTopic) {
      throw new Error('No aptitude topic exists yet. Seed topics or pass a valid topicId.');
    }
    targetTopic = seedTopic;
  }

  const question = await db.aptitudeQuestion.create({
    data: {
      topicId: targetTopic.id,
      questionText,
      optionA: options[0],
      optionB: options[1],
      optionC: options[2],
      optionD: options[3],
      correctOption: correctIndexToLetter(correctIndex),
      explanation,
      difficulty: difficulty || 'MEDIUM'
    }
  });

  return {
    id: question.id,
    topic: targetTopic.name,
    text: question.questionText,
    answer: options[correctIndex],
    options,
    correctIndex,
    explanation: question.explanation,
    difficulty: question.difficulty
  };
}

export async function listMcqs(topicId?: string) {
  const where = topicId ? { topicId } : {};
  const questions = await db.aptitudeQuestion.findMany({
    where,
    include: { topic: true },
    orderBy: { createdAt: 'desc' }
  });

  return questions.map((q: any) => ({
    id: q.id,
    topic: q.topic?.name || q.topicId,
    topicId: q.topicId,
    text: q.questionText,
    options: [q.optionA, q.optionB, q.optionC, q.optionD],
    correctIndex: letterToCorrectIndex(q.correctOption),
    answer: [q.optionA, q.optionB, q.optionC, q.optionD][letterToCorrectIndex(q.correctOption)],
    explanation: q.explanation,
    difficulty: q.difficulty
  }));
}

export async function deleteMcq(id: string) {
  await db.aptitudeQuestion.delete({ where: { id } });
  return { success: true };
}

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

export async function generateQuestions(data: {
  topic?: string;
  topicId?: string;
  count?: number;
  difficulty?: string;
}) {
  const count = Math.min(Math.max(parseInt(String(data.count)) || 5, 1), 10);
  const difficulty = DIFFICULTIES.includes(data.difficulty as any) ? data.difficulty : 'MEDIUM';

  let topicName = data.topic;
  if (!topicName && data.topicId) {
    const t = await db.aptitudeTopic.findUnique({ where: { id: data.topicId } });
    topicName = t?.name;
  }
  if (!topicName) topicName = 'General Aptitude';

  const system = `You are a professional aptitude test question generator for college placement preparation.
Generate a JSON array of exactly ${count} multiple choice questions about "${topicName}" at ${difficulty} difficulty.
Each item must have exactly this shape:
{
  "questionText": string,
  "options": [4 short strings],
  "correctIndex": number (0-3),
  "explanation": string (ONE sentence, max two),
  "difficulty": "EASY" | "MEDIUM" | "HARD"
}
HARD RULES:
- The explanation is final answer text only. NEVER include your own working, reasoning, drafting notes, or self-corrections anywhere in the JSON.
- Do NOT repeat classic textbook questions verbatim — vary wording, numbers, and names.
- Keep every string short and final. Total output must be compact.
Return ONLY the raw JSON array. No markdown fences, no extra text.`;

  const buildPrompt = (attempt: number) =>
    `Generate ${count} fresh aptitude MCQs on topic "${topicName}" (difficulty: ${difficulty}). ` +
    `Keep explanations to one short sentence. Attempt ${attempt}.`;

  let questions: any[] | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    questions = await callAiJson<any[]>({
      system,
      prompt: buildPrompt(attempt),
      temperature: 0.8,
      maxTokens: 4000
    });
    if (Array.isArray(questions) && questions.length > 0) break;
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw new Error('AI question generation failed. Please try again.');
  }

  const now = Date.now();
  const valid = questions.filter(
    (q: any) =>
      typeof q?.questionText === 'string' &&
      q.questionText.trim() &&
      Array.isArray(q?.options) &&
      q.options.length === 4 &&
      q.options.every((o: any) => typeof o === 'string' && o.trim()) &&
      typeof q?.correctIndex === 'number' &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3
  );
  if (valid.length === 0) {
    throw new Error('AI question generation failed. Please try again.');
  }

  return valid
    .slice(0, count)
    .map((q: any, i: number) => ({
      id: `ai_${now}_${i}`,
      topic: topicName,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctIndex,
      answer: q.options[q.correctIndex],
      explanation: q.explanation || '',
      difficulty: DIFFICULTIES.includes(q.difficulty as any) ? q.difficulty : difficulty,
      isAI: true
    }));
}
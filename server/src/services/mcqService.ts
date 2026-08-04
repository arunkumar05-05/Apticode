import { db } from '../prisma/db';

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
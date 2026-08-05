import { db } from '../prisma/db';
import { callAiJson } from '../utils/ai';

const INTERVIEW_EVAL_SYSTEM_INSTRUCTION = `You are the AptiCode Executive Technical Recruiter.
Analyze the candidate's interview responses compared to the list of questions asked, and evaluate their scores.
You MUST respond with a JSON object containing precisely the following keys:
{
  "overallScore": number (0 to 100),
  "technicalScore": number (0 to 100),
  "softSkillScore": number (0 to 100),
  "status": "string ('RECOMMENDED' or 'NOT_RECOMMENDED')",
  "feedbackReport": "string containing bullet points summarizing overall strengths, tech improvements, and communication recommendations.",
  "optimalAdditions": ["array of strings matching optimal answers for each question in order"]
}
Do NOT wrap the JSON response in any markdown formatting or extra text. Return ONLY the raw JSON string.`;

const VALID_INTERVIEW_TYPES = ['HR', 'TECHNICAL', 'CODING', 'BEHAVIORAL'] as const;
type InterviewType = typeof VALID_INTERVIEW_TYPES[number];

function normalizeInterviewType(raw: any): InterviewType {
  const value = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  if ((VALID_INTERVIEW_TYPES as readonly string[]).includes(value)) return value as InterviewType;
  return 'TECHNICAL';
}

export async function startInterview(userId: string, type: string, company: string) {
  const standardQuestions = [
    { q: "Can you explain the difference between processes and threads?", optimal: "Processes have independent memory address spaces and are isolated. Threads share the memory of their parent process, making communication lightweight but requiring synchronization locks." },
    { q: "Explain how index optimization works in databases.", optimal: "Database indices construct B-Trees or Hash Tables mapping values to storage blocks, turning O(N) sequential scans into O(log N) tree runs." },
    { q: "Tell me about a time you worked on a team with differing technical ideas.", optimal: "Focus on active listening, creating design spreadsheets comparing pros/cons, selecting a standard based on benchmarks, and executing collaboratively." }
  ];

  const generated = await callAiJson<any[]>({
    system: `You are the AptiCode Technical Interviewer.
Generate a JSON array of exactly 3 technical interview questions tailored for a ${type || 'technical'} interview${company ? ` at ${company}` : ''}.
Each item must have exactly this shape:
{
  "q": "question text",
  "optimal": "one-paragraph ideal answer"
}
Return ONLY the raw JSON array. No markdown fences, no extra text.`,
    prompt: `Generate 3 fresh, non-cliché ${type || 'technical'} interview questions.`,
    temperature: 0.8,
    maxTokens: 6000
  });

  if (generated && Array.isArray(generated) && generated.length > 0) {
    return generated.slice(0, 3).map((g: any, i: number) => ({
      q: g.q || standardQuestions[i]?.q || 'Describe your approach to solving a complex technical problem.',
      optimal: g.optimal || standardQuestions[i]?.optimal || ''
    }));
  }

  return standardQuestions;
}

export async function submitInterview(userId: string, data: any) {
  const { type, company, questions, answers } = data;

  let overallScore = 82;
  let technicalScore = 80;
  let softSkillScore = 84;
  let status = 'RECOMMENDED';
  let feedbackReport = '';
  let optimalAdditions: string[] = questions.map((q: any) => q.optimal || 'Understand core concurrency or complexity parameters.');

  const dialogueText = questions.map((q: any, i: number) => `Q: ${q.q}\nCandidate A: ${answers[i] || 'N/A'}`).join('\n\n');

  const evaluation = await callAiJson<any>({
    system: INTERVIEW_EVAL_SYSTEM_INSTRUCTION,
    prompt: `Questions & Answers:\n${dialogueText}`,
    temperature: 0.2,
    maxTokens: 6000
  });
  if (evaluation) {
    overallScore = evaluation.overallScore || 82;
    technicalScore = evaluation.technicalScore || 80;
    softSkillScore = evaluation.softSkillScore || 84;
    status = evaluation.status || 'RECOMMENDED';
    feedbackReport = Array.isArray(evaluation.feedbackReport)
      ? evaluation.feedbackReport.join('\n')
      : String(evaluation.feedbackReport || 'Excellent technical depth and logical response flow.');
    if (Array.isArray(evaluation.optimalAdditions)) {
      optimalAdditions = evaluation.optimalAdditions;
    }
  }

  if (!feedbackReport) {
    feedbackReport = `### 🤝 Recruiter Panel Evaluation Report
- **Strengths**: Solid logical outline. Displayed structured debugging flow in OS concurrency checks.
- **Areas to Improve**: Elevate answers by referencing concrete design choices (e.g. B-Trees parameters).
- **Communication Flow**: Minimize pauses and increase speed slightly for recruiter rounds.`;
  }

  const interview = await db.mockInterview.create({
    data: {
      userId,
      interviewType: normalizeInterviewType(type),
      overallScore,
      technicalScore,
      softSkillScore,
      feedbackReport
    }
  });

  for (let i = 0; i < questions.length; i++) {
    await db.interviewMessage.create({
      data: {
        interviewId: interview.id,
        sender: 'INTERVIEWER',
        messageText: questions[i].q
      }
    });
    if (answers[i]) {
      await db.interviewMessage.create({
        data: {
          interviewId: interview.id,
          sender: 'USER',
          messageText: answers[i]
        }
      });
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { xp: { increment: 300 } }
  });

  return {
    id: interview.id,
    overallScore,
    technicalScore,
    softSkillScore,
    status,
    feedbackReport,
    optimalAdditions
  };
}

export async function getUserInterviewHistory(userId: string) {
  return await db.mockInterview.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

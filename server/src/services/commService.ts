import { db } from '../prisma/db';
import { callAiJson } from '../utils/ai';

const SPEECH_SYSTEM_INSTRUCTION = `You are the AptiCode Speech and Communication Auditor.
Your job is to analyze the candidate's spoken transcript compared to the reading prompt (or prompt question) and evaluate it across grammar, fluency, and fillers.
You MUST respond with a JSON object containing precisely the following keys:
{
  "grammarScore": number (0 to 100),
  "fluencyScore": number (0 to 100),
  "confidenceScore": number (0 to 100),
  "pronunciationMatch": number (0 to 100),
  "fillerWords": number (count of filler words),
  "recommendations": "string containing bullet points summarizing grammar mistakes, vocabulary improvement suggestions, filler words analysis, and general speech optimization tips."
}
Do NOT wrap the JSON response in any markdown formatting or extra text. Return ONLY the raw JSON string.`;

const VALID_SESSION_TYPES = ['SPEAKING', 'READING', 'HR', 'GD'] as const;
type SessionType = typeof VALID_SESSION_TYPES[number];

function normalizeSessionType(raw: any): SessionType {
  const value = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  if ((VALID_SESSION_TYPES as readonly string[]).includes(value)) return value as SessionType;
  // common aliases
  if (value === 'GROUP_DISCUSSION') return 'GD';
  if (value === 'GROUP_DISCUSSIONS' || value === 'GRP_DISCUSSION') return 'GD';
  return 'READING';
}

export async function evaluateSpeech(userId: string, data: any) {
  const { sessionType, transcript, promptText, durationSeconds } = data;

  const wpm = durationSeconds > 0 ? Math.round((transcript.split(' ').length / durationSeconds) * 60) : 120;
  
  let grammarScore = 80;
  let fluencyScore = 80;
  let confidenceScore = 85;
  let pronunciationMatch = 90;
  let fillerWords = 0;
  let recommendations = '';

  const evaluation = await callAiJson<any>({
    system: SPEECH_SYSTEM_INSTRUCTION,
    prompt: `Evaluate the following response transcript.
Session Type: ${sessionType}
Prompt/Question: ${promptText || 'N/A'}
User Transcript: ${transcript}
Duration: ${durationSeconds || 15} seconds`,
    temperature: 0.2,
    maxTokens: 4000
  });
  if (evaluation) {
    grammarScore = evaluation.grammarScore || 80;
    fluencyScore = evaluation.fluencyScore || 80;
    confidenceScore = evaluation.confidenceScore || 85;
    pronunciationMatch = evaluation.pronunciationMatch || 90;
    fillerWords = evaluation.fillerWords || 0;
    recommendations = Array.isArray(evaluation.recommendations)
      ? evaluation.recommendations.join('\n')
      : String(evaluation.recommendations || 'Good attempt!');
  }

  if (!recommendations) {
    fillerWords = (transcript.toLowerCase().match(/\b(um|ah|like|basically|actually)\b/g) || []).length;
    grammarScore = Math.max(50, 95 - fillerWords * 2);
    fluencyScore = Math.max(40, 100 - fillerWords * 6);
    confidenceScore = Math.max(60, 90 - fillerWords * 3);
    recommendations = `### 🎙️ Speech Analytics Audit (Sandbox Fallback)
- **Pronunciation & Speed**: Spoken at ${wpm} WPM. Optimal range is 110-150 WPM.
- **Filler Word Usage**: Identified ${fillerWords} fillers ("um", "like", "basically"). Minimize fillers to increase professionalism.
- **Fluency Suggestion**: Try to speak in continuous phrases rather than word-by-word.`;
  }

  const normalizedType = normalizeSessionType(sessionType);
  const session = await db.communicationSession.create({
    data: {
      userId,
      sessionType: normalizedType,
      transcript,
      wpm,
      grammarScore,
      fluencyScore,
      confidence: confidenceScore
    }
  });

  await db.user.update({
    where: { id: userId },
    data: { xp: { increment: 150 } }
  });

  return {
    id: session.id,
    sessionType: session.sessionType,
    transcript: session.transcript,
    wpm: session.wpm,
    grammarScore,
    fluencyScore,
    confidenceScore,
    pronunciationMatch,
    fillerWords,
    recommendations,
    createdAt: session.createdAt
  };
}

export async function getUserSpeechHistory(userId: string) {
  return await db.communicationSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

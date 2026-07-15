import { db } from '../prisma/db';

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

export async function evaluateSpeech(userId: string, data: any) {
  const { sessionType, transcript, promptText, durationSeconds } = data;

  const wpm = durationSeconds > 0 ? Math.round((transcript.split(' ').length / durationSeconds) * 60) : 120;
  
  let grammarScore = 80;
  let fluencyScore = 80;
  let confidenceScore = 85;
  let pronunciationMatch = 90;
  let fillerWords = 0;
  let recommendations = '';

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_key') {
    try {
      const userPrompt = `Evaluate the following response transcript.
Session Type: ${sessionType}
Prompt/Question: ${promptText || 'N/A'}
User Transcript: ${transcript}
Duration: ${durationSeconds || 15} seconds`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${SPEECH_SYSTEM_INSTRUCTION}\n\nUser query: ${userPrompt}` }] }],
          generationConfig: { temperature: 0.2 }
        })
      });
      if (response.ok) {
        const resJson: any = await response.json();
        const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
        let cleaned = rawText.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
        
        const evaluation = JSON.parse(cleaned.trim());
        grammarScore = evaluation.grammarScore || 80;
        fluencyScore = evaluation.fluencyScore || 80;
        confidenceScore = evaluation.confidenceScore || 85;
        pronunciationMatch = evaluation.pronunciationMatch || 90;
        fillerWords = evaluation.fillerWords || 0;
        recommendations = evaluation.recommendations || 'Good attempt!';
      }
    } catch (err: any) {
      console.error('[Gemini Speech Eval] Error:', err.message);
    }
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

  const session = await db.communicationSession.create({
    data: {
      userId,
      sessionType: sessionType || 'READING',
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

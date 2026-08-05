import { callAi } from '../utils/ai';

const COACH_SYSTEM_INSTRUCTION = `You are the AptiCode AI Placement Coach, a helpful, encouraging, and highly technical assistant designed to guide candidates through software engineering placements, math/aptitude shortcuts, communication rules, and coding audits.
Be concise and structure your answers with clear headings or bullet points where appropriate.
Format math formulas beautifully in text or markdown (avoid raw HTML).`;

export async function getCoachResponse(message: string, history: any[]) {
  const historyText = history
    .map((msg: any) => `${msg.sender === 'user' ? 'User' : 'Coach'}: ${msg.text}`)
    .join('\n');
  const prompt = historyText ? `Conversation so far:\n${historyText}\n\nUser: ${message}` : message;

  const reply = await callAi({
    system: COACH_SYSTEM_INSTRUCTION,
    prompt,
    temperature: 0.7
  });
  if (reply) return reply;

  const query = message.toLowerCase();
  if (query.includes('time') || query.includes('work')) {
    return `### ⏱️ Time & Work Placement Cheat Sheet
- **Two Workers Formula**: If A takes $x$ days and B takes $y$ days, together they take:
  $$\\text{Combined Days} = \\frac{xy}{x+y}$$
- **Work Efficiency**: If A is thrice as efficient as B, then A takes $\\frac{1}{3}$ the time of B to complete the same work.
- **Cistern Capacity**: Fill rates sum positively while leak rates subtract negatively.`;
  }
  return `### 💡 AptiCode Career Coach (Sandbox Fallback)
I've registered your message: "${message}". Please configure the Gemini API key in your environment to test dynamic responses.`;
}

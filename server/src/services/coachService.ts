const COACH_SYSTEM_INSTRUCTION = `You are the AptiCode AI Placement Coach, a helpful, encouraging, and highly technical assistant designed to guide candidates through software engineering placements, math/aptitude shortcuts, communication rules, and coding audits.
Be concise and structure your answers with clear headings or bullet points where appropriate.
Format math formulas beautifully in text or markdown (avoid raw HTML).`;

export async function getCoachResponse(message: string, history: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (apiKey && apiKey !== 'your_key') {
    try {
      const contents = history.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: `${COACH_SYSTEM_INSTRUCTION}\n\nUser: ${message}` }]
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.7 } })
      });

      if (response.ok) {
        const resJson: any = await response.json();
        return resJson.candidates?.[0]?.content?.parts?.[0]?.text || "I am analyzing your placement query.";
      }
    } catch (err: any) {
      console.error('[Gemini Coach] Error:', err.message);
    }
  }

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

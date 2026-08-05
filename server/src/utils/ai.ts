const DEFAULT_VLLM_URL = 'https://vsllm.com/v1';
const DEFAULT_VLLM_MODEL = 'glm-4.7-flash-free';

export interface AiRequest {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

export function isAiEnabled(): boolean {
  return !!(
    process.env.AI_API_KEY ||
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_key')
  );
}

export function aiProviderLabel(): string {
  if (process.env.AI_API_KEY) {
    return `vsllm (${process.env.AI_MODEL || DEFAULT_VLLM_MODEL})`;
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_key') {
    return 'gemini-2.5-flash';
  }
  return 'sandbox';
}

function stripJsonFence(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, cleaned.length - 3);
  return cleaned.trim();
}

async function callVsllm(req: AiRequest): Promise<string | null> {
  const baseUrl = (process.env.AI_API_URL || DEFAULT_VLLM_URL).replace(/\/+$/, '');
  const apiKey = process.env.AI_API_KEY as string;

  const messages: any[] = [];
  if (req.system) messages.push({ role: 'system', content: req.system });
  messages.push({ role: 'user', content: req.prompt });

  const timeoutMs = 120000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL || DEFAULT_VLLM_MODEL,
        messages,
        temperature: req.temperature ?? 0.4,
        max_tokens: req.maxTokens || 6000,
        thinking: { type: 'disabled' }
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const reason = (() => {
        try {
          const j = JSON.parse(errText);
          return j?.error?.message || j?.message || errText.slice(0, 240);
        } catch {
          return errText.slice(0, 240);
        }
      })();
      console.error(
        `[AI vsllm] HTTP ${res.status} ${res.status === 402 ? '(quota exhausted — top up the provider wallet)' : res.status === 401 ? '(invalid API key)' : res.status === 429 ? '(rate limited)' : ''} — ${reason}`
      );
      return null;
    }

    const data: any = await res.json();
    const content: string = (data.choices?.[0]?.message?.content || '').trim();
    if (!content) return null;
    return req.json ? stripJsonFence(content) : content;
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(req: AiRequest): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY as string;
  const text = `${req.system ? req.system + '\n\n' : ''}${req.prompt}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: { temperature: req.temperature ?? 0.4 }
      })
    }
  );

  if (!res.ok) return null;
  const data: any = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!raw.trim()) return null;
  return req.json ? stripJsonFence(raw) : raw.trim();
}

export async function callAi(req: AiRequest): Promise<string | null> {
  if (process.env.AI_API_KEY) {
    try {
      return await callVsllm(req);
    } catch (err: any) {
      console.error('[AI vsllm] Error:', err.message);
      return null;
    }
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_key') {
    try {
      return await callGemini(req);
    } catch (err: any) {
      console.error('[AI Gemini] Error:', err.message);
      return null;
    }
  }
  return null;
}

/**
 * Pulls complete, balanced `{...}` blocks out of a possibly-truncated raw string.
 * Used to salvage JSON *arrays* when a provider response was cut off mid-array
 * (only objects that closed cleanly are kept).
 */
function extractBalancedObjects(raw: string): string[] {
  const chunks: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        chunks.push(raw.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return chunks;
}

export async function callAiJson<T>(req: AiRequest): Promise<T | null> {
  const raw = await callAi({ ...req, json: true });
  if (!raw) return null;

  // 1) Exact parse (happy path)
  try {
    return JSON.parse(raw) as T;
  } catch {
    // fall through to salvage strategies
  }

  // 2) Array-shaped responses: salvage every complete object
  if (raw.trimStart().startsWith('[')) {
    const objects = extractBalancedObjects(raw)
      .map((chunk) => {
        try {
          return JSON.parse(chunk);
        } catch {
          return null;
        }
      })
      .filter((o) => o !== null);
    if (objects.length > 0) return objects as T;
  }

  // 3) Single-object fallback (greedy, last-resort)
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      /* ignore */
    }
  }

  console.warn('[AI json] Failed to parse model output:', raw.slice(0, 200));
  return null;
}

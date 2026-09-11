// AgentRouter-backed AI endpoint.
// The AgentRouter API key lives only on the server (process.env.AGENTROUTER_API_KEY)
// and is never exposed to the frontend.
//
// Local dev:  set AGENTROUTER_API_KEY in .env and run `npx vercel dev`
// Production: set AGENTROUTER_API_KEY (and optionally AGENTROUTER_MODEL) in Vercel env vars.

export const config = { runtime: 'nodejs' };

const AGENTROUTER_URL = 'https://agentrouter.org/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-5.5';
const MAX_PROMPT_LENGTH = 8000;

export function extractContent(data) {
  const choice = Array.isArray(data?.choices) ? data.choices[0] : null;
  const message = choice?.message;
  if (!message) return null;
  if (typeof message.content === 'string') return message.content.trim();
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();
  }
  return null;
}

export async function callAgentRouter({ prompt, apiKey, model = DEFAULT_MODEL, fetchImpl = globalThis.fetch }) {
  if (!apiKey) {
    return { status: 500, error: 'AGENTROUTER_API_KEY is not configured on the server.' };
  }

  let response;
  try {
    response = await fetchImpl(AGENTROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1200,
      }),
    });
  } catch {
    return { status: 503, error: 'Could not reach AgentRouter. Please check your network connection and try again.' };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return { status: 401, error: 'Invalid AgentRouter API key. Check AGENTROUTER_API_KEY on the server.' };
    }
    if (response.status === 404) {
      return { status: 502, error: `The configured AgentRouter model (${model}) is not available.` };
    }
    if (response.status === 429) {
      return { status: 503, error: 'AgentRouter rate limit exceeded. Please try again in a moment.' };
    }
    let detail = '';
    try {
      detail = (await response.text()).slice(0, 200);
    } catch {
      // ignore body read failure
    }
    return {
      status: 502,
      error: detail ? `AgentRouter API error (${response.status}): ${detail}` : `AgentRouter API error (${response.status}).`,
    };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return { status: 502, error: 'AgentRouter returned an unreadable response.' };
  }

  const content = extractContent(data);
  if (!content) {
    return { status: 502, error: 'AgentRouter returned an empty response. Try again.' };
  }
  return { status: 200, content };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body.' });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'Prompt is required.' });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ ok: false, error: 'Prompt is too long.' });
  }

  const model = process.env.AGENTROUTER_MODEL || DEFAULT_MODEL;
  const result = await callAgentRouter({
    prompt,
    apiKey: process.env.AGENTROUTER_API_KEY,
    model,
  });

  if (result.status === 200) {
    return res.status(200).json({ ok: true, content: result.content });
  }
  return res.status(result.status).json({ ok: false, error: result.error });
}
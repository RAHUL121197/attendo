// Unit tests for the /api/ai/ask Vercel function.
// The AgentRouter upstream is stubbed with a fake fetch so no network or API key is required.
// Run with: node tests/ai-api-test.cjs

let failures = [];

function check(name, cond, extra = '') {
  if (cond) {
    console.log(`  PASS: ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL: ${name} ${extra}`);
  }
}

function makeResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    },
    async text() {
      return typeof payload === 'string' ? payload : JSON.stringify(payload);
    },
  };
}

(async () => {
  const api = await import('../api/ai/ask.mjs');

  // --- calAgentRouter: success path ---
  let callArgs = null;
  const okStub = makeResponse(200, { choices: [{ message: { content: '  Report text  ' } }] });
  const fetchStub = async (url, init) => {
    callArgs = { url, init };
    return okStub;
  };

  const ok = await api.callAgentRouter({ prompt: 'hello', apiKey: 'sk-test', model: 'gpt-5.5', fetchImpl: fetchStub });
  check('uses AgentRouter chat completions URL', callArgs.url === 'https://agentrouter.org/v1/chat/completions', callArgs.url);
  check('sends bearer token API key', callArgs.init.headers.Authorization === 'Bearer sk-test');
  const sentBody = JSON.parse(callArgs.init.body);
  check('sends OpenAI-compatible chat payload', sentBody.model === 'gpt-5.5' && sentBody.messages[0].role === 'user' && sentBody.messages[0].content === 'hello');
  check('returns trimmed content', ok.status === 200 && ok.content === 'Report text', JSON.stringify(ok));

  // --- missing API key ---
  const noKey = await api.callAgentRouter({ prompt: 'hi', apiKey: '', fetchImpl: fetchStub });
  check('missing API key -> 500', noKey.status === 500 && /api.?key/i.test(noKey.error), JSON.stringify(noKey));

  // --- invalid API key (401) ---
  const badKey = await api.callAgentRouter({ prompt: 'hi', apiKey: 'bad', fetchImpl: async () => makeResponse(401, {}) });
  check('invalid API key -> 401 message', badKey.status === 401 && /Invalid AgentRouter API key/.test(badKey.error), JSON.stringify(badKey));

  // --- model unavailable (404) ---
  const noModel = await api.callAgentRouter({ prompt: 'hi', apiKey: 'k', fetchImpl: async () => makeResponse(404, {}) });
  check('model unavailable -> 502 message', noModel.status === 502 && /model/.test(noModel.error.toLowerCase()), JSON.stringify(noModel));

  // --- rate limited (429) ---
  const limited = await api.callAgentRouter({ prompt: 'hi', apiKey: 'k', fetchImpl: async () => makeResponse(429, {}) });
  check('rate limited -> 503 message', limited.status === 503 && /rate limit/.test(limited.error.toLowerCase()), JSON.stringify(limited));

  // --- upstream 5xx ---
  const upstream = await api.callAgentRouter({ prompt: 'hi', apiKey: 'k', fetchImpl: async () => makeResponse(500, 'boom upstream') });
  check('upstream 500 -> 502 with detail', upstream.status === 502 && upstream.error.includes('boom upstream'), JSON.stringify(upstream));

  // --- network error ---
  const network = await api.callAgentRouter({ prompt: 'hi', apiKey: 'k', fetchImpl: async () => { throw new Error('fetch failed'); } });
  check('network error -> 503', network.status === 503 && /network/.test(network.error.toLowerCase()), JSON.stringify(network));

  // --- empty upstream payload ---
  const empty = await api.callAgentRouter({ prompt: 'hi', apiKey: 'k', fetchImpl: async () => makeResponse(200, { choices: [] }) });
  check('empty upstream response -> 502', empty.status === 502 && /empty/.test(empty.error.toLowerCase()), JSON.stringify(empty));

  // --- handler: validation ---
  const handler = api.default;
  const makeRes = () => {
    const res = { _status: null, _body: null };
    res.status = (s) => { res._status = s; return res; };
    res.json = (b) => { res._body = b; return res; };
    return res;
  };

  const resEmptyPrompt = makeRes();
  await handler({ method: 'POST', body: {} }, resEmptyPrompt);
  check('handler: empty prompt -> 400', resEmptyPrompt._status === 400 && resEmptyPrompt._body.ok === false, JSON.stringify(resEmptyPrompt._body));

  const resWrongMethod = makeRes();
  await handler({ method: 'GET' }, resWrongMethod);
  check('handler: GET -> 405', resWrongMethod._status === 405, String(resWrongMethod._status));

  const resBadJson = makeRes();
  await handler({ method: 'POST', body: '{not json' }, resBadJson);
  check('handler: malformed JSON -> 400', resBadJson._status === 400, String(resBadJson._status));

  const resEmptyKey = makeRes();
  await handler({ method: 'POST', body: { prompt: 'hi' } }, resEmptyKey);
  check('handler: no API key env -> 500', resEmptyKey._status === 500 && /API.?key/i.test(resEmptyKey._body.error), JSON.stringify(resEmptyKey._body));

  console.log('\n========================');
  if (failures.length) {
    console.log(`AI API RESULT: ${failures.length} FAILURES`);
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  } else {
    console.log('AI API RESULT: ALL TESTS PASSED');
  }
})();
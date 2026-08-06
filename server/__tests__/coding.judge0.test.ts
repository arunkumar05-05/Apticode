/**
 * Phase 5 — Judge0 provider unit tests.
 *
 * Fully deterministic: fetch is mocked via jest.spyOn(global, 'fetch').
 * No network, no Redis, no DB.
 */

import { Judge0HttpProvider, Judge0HttpProviderOptions, mapStatusId } from '../src/integrations/judge0/provider';
import { staticLanguageId, resolveLanguageId, clearLanguageIdCache } from '../src/integrations/judge0/languageMap';
import { FatalJudge0Error, TransientJudge0Error } from '../src/integrations/judge0/types';

function makeProvider(overrides: Partial<Judge0HttpProviderOptions> = {}): Judge0HttpProvider {
  return new Judge0HttpProvider({
    baseUrl: 'https://judge0.test',
    apiToken: 'test-token',
    authType: 'header',
    authHeader: 'X-Auth-Token',
    enabled: true,
    waitTimeoutMs: 1000,
    pollMode: false,
    pollIntervalMs: 10,
    pollMaxAttempts: 5,
    fetchLanguages: false,
    ...overrides,
  });
}

function jsonResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  jest.restoreAllMocks();
  clearLanguageIdCache();
});

describe('Judge0 provider — unconfigured', () => {
  it('throws a clear TransientJudge0Error when disabled', async () => {
    const provider = makeProvider({ enabled: false });
    await expect(provider.submitBatch([])).rejects.toThrow(/not configured/i);
    await expect(provider.submitBatch([])).rejects.toBeInstanceOf(TransientJudge0Error);
  });

  it('returns an empty outcome list for an empty batch when configured', async () => {
    const provider = makeProvider();
    const outcomes = await provider.submitBatch([]);
    expect(outcomes).toEqual([]);
  });
});

describe('Judge0 provider — auth variants', () => {
  it('sends X-Auth-Token header by default (header mode)', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse([{ token: 't1', status: { id: 3 }, stdout: '42', time: '0.01', memory: 800 }])
    );
    const provider = makeProvider();
    await provider.submitBatch([{ sourceCode: 'print(42)', languageId: 71, stdin: '', expectedOutput: '42' }]);

    const [url, init] = fetchMock.mock.calls[0] as [string, any];
    expect(url).toContain('https://judge0.test/submissions/batch');
    expect(url).toContain('wait=true');
    expect(url).toContain('fields=token,status,stdout,stderr,compile_output,time,memory');
    expect(init.headers['X-Auth-Token']).toBe('test-token');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('sends Bearer Authorization in bearer mode', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse([]));
    const provider = makeProvider({ authType: 'bearer' });
    await provider.submitBatch([{ sourceCode: 'x', languageId: 71 }]);

    const [, init] = fetchMock.mock.calls[0] as [string, any];
    expect(init.headers.Authorization).toBe('Bearer test-token');
  });

  it('sends no auth headers in none mode', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse([]));
    const provider = makeProvider({ authType: 'none', apiToken: '' });
    await provider.submitBatch([{ sourceCode: 'x', languageId: 71 }]);

    const [, init] = fetchMock.mock.calls[0] as [string, any];
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.headers['X-Auth-Token']).toBeUndefined();
  });

  it('maps request bodies to judge0 submission objects', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse([]));
    const provider = makeProvider();
    await provider.submitBatch([
      { sourceCode: 'print(1)', languageId: 71, stdin: 'a', expectedOutput: '1', cpuTimeLimitSec: 2, memoryLimitKb: 100000 },
      { sourceCode: 'print(2)', languageId: 63, stdin: 'b', expectedOutput: '2' },
    ]);

    const [, init] = fetchMock.mock.calls[0] as [string, any];
    const body = JSON.parse(init.body);
    expect(body.submissions).toHaveLength(2);
    expect(body.submissions[0]).toEqual({
      source_code: 'print(1)',
      language_id: 71,
      stdin: 'a',
      expected_output: '1',
      cpu_time_limit: 2,
      memory_limit: 100000,
    });
    expect(body.submissions[1].source_code).toBe('print(2)');
  });
});

describe('Judge0 provider — outcomes', () => {
  const outcomes: Array<[number, string]> = [
    [1, 'PENDING'],
    [2, 'PENDING'],
    [3, 'ACCEPTED'],
    [4, 'WRONG_ANSWER'],
    [5, 'TIME_LIMIT_EXCEEDED'],
    [6, 'COMPILE_ERROR'],
    [7, 'RUNTIME_ERROR'],
    [11, 'RUNTIME_ERROR'],
    [13, 'SYSTEM_ERROR'],
    [14, 'RUNTIME_ERROR'],
    [99, 'SYSTEM_ERROR'],
  ];

  it.each(outcomes)('maps status id %i to %s', (statusId, verdict) => {
    expect(mapStatusId(statusId)).toBe(verdict);
  });

  it('parses stdout/stderr/compileOutput/time/memory from wait=true responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse([
        {
          token: 't1',
          status: { id: 6 },
          stdout: '',
          stderr: '',
          compile_output: 'error: expected ;',
          time: '0.2',
          memory: 4096,
        },
      ])
    );
    const provider = makeProvider();
    const [outcome] = await provider.submitBatch([{ sourceCode: 'x', languageId: 63 }]);

    expect(outcome).toEqual({
      token: 't1',
      statusId: 6,
      verdict: 'COMPILE_ERROR',
      compileOutput: 'error: expected ;',
      timeSec: 0.2,
      memoryKb: 4096,
    });
  });
});

describe('Judge0 provider — error classification', () => {
  it.each([[429], [500], [502], [503], [504]])('HTTP %i → TransientJudge0Error', async (status) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ error: 'boom' }, status));
    const provider = makeProvider();
    await expect(provider.submitBatch([{ sourceCode: 'x', languageId: 71 }])).rejects.toBeInstanceOf(TransientJudge0Error);
  });

  it.each([[401], [400], [422]])('HTTP %i → FatalJudge0Error', async (status) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ error: 'nope' }, status));
    const provider = makeProvider();
    await expect(provider.submitBatch([{ sourceCode: 'x', languageId: 71 }])).rejects.toBeInstanceOf(FatalJudge0Error);
  });

  it('network failure → TransientJudge0Error', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('fetch failed'));
    const provider = makeProvider();
    await expect(provider.submitBatch([{ sourceCode: 'x', languageId: 71 }])).rejects.toBeInstanceOf(TransientJudge0Error);
  });

  it('wait request timeout → TransientJudge0Error with timeout message', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(
      (_url: any, init: any) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }))
          );
        })
    );
    const provider = makeProvider({ waitTimeoutMs: 30 });
    await expect(provider.submitBatch([{ sourceCode: 'x', languageId: 71 }])).rejects.toBeInstanceOf(TransientJudge0Error);
    await expect(provider.submitBatch([{ sourceCode: 'x', languageId: 71 }])).rejects.toThrow(/timed out/i);
  });
});

describe('Judge0 provider — poll mode', () => {
  it('posts for tokens, then polls GET /submissions/batch until terminal', async () => {
    let postCount = 0;
    let getCount = 0;
    jest.spyOn(global, 'fetch').mockImplementation(async (url: any, init: any) => {
      if (init?.method === 'POST') {
        postCount += 1;
        return jsonResponse([{ token: 't1' }, { token: 't2' }]);
      }
      getCount += 1;
      if (getCount === 1) {
        return jsonResponse([
          { token: 't1', status: { id: 2 } },
          { token: 't2', status: { id: 3 }, stdout: 'ok', time: '0.01', memory: 100 },
        ]);
      }
      return jsonResponse([
        { token: 't1', status: { id: 4 } },
        { token: 't2', status: { id: 3 }, stdout: 'ok', time: '0.01', memory: 100 },
      ]);
    });

    const provider = makeProvider({ pollMode: true, pollIntervalMs: 5, pollMaxAttempts: 5 });
    const outcomes = await provider.submitBatch([
      { sourceCode: 'a()', languageId: 71 },
      { sourceCode: 'b()', languageId: 71 },
    ]);

    expect(postCount).toBe(1);
    expect(getCount).toBe(2);
    expect(outcomes.map((o) => o.verdict)).toEqual(['WRONG_ANSWER', 'ACCEPTED']);
  });

  it('throws TransientJudge0Error when tokens never reach terminal', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (url: any, init: any) => {
      if (init?.method === 'POST') return jsonResponse([{ token: 't1' }]);
      return jsonResponse([{ token: 't1', status: { id: 2 } }]);
    });
    const provider = makeProvider({ pollMode: true, pollIntervalMs: 1, pollMaxAttempts: 2 });
    await expect(provider.submitBatch([{ sourceCode: 'x', languageId: 71 }])).rejects.toBeInstanceOf(TransientJudge0Error);
    await expect(provider.submitBatch([{ sourceCode: 'x', languageId: 71 }])).rejects.toThrow(/polling timed out/i);
  });

  it('throws TransientJudge0Error when the POST returns no tokens', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse([]));
    const provider = makeProvider({ pollMode: true });
    await expect(provider.submitBatch([{ sourceCode: 'x', languageId: 71 }])).rejects.toThrow(/no tokens/i);
  });
});

describe('Judge0 provider — language resolution', () => {
  it('static map: typescript is 63 on ce and 74 on extra', () => {
    expect(staticLanguageId('typescript', 'ce')).toBe(63);
    expect(staticLanguageId('typescript', 'extra')).toBe(74);
    expect(staticLanguageId('python')).toBe(71);
    expect(staticLanguageId('python3')).toBe(71);
    expect(staticLanguageId('javascript')).toBe(63);
  });

  it('dynamic /languages: matches by word, caches, and falls back on failure', async () => {
    const languages = [
      { id: 50, name: 'C (GCC 9.2.0)' },
      { id: 71, name: 'Python (3.8.1)' },
      { id: 74, name: 'TypeScript 3.7.4' },
      { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
    ];
     const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => jsonResponse(languages));
    const provider = makeProvider({ fetchLanguages: true });

    const pythonId = await provider.resolveLanguageId('python');
    expect(pythonId).toBe(71);
    const tsId = await provider.resolveLanguageId('typescript');
    expect(tsId).toBe(74);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Second call for the same slug hits the TTL cache — no refetch.
    await provider.resolveLanguageId('python');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to the static map when /languages fails', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('down'));
    const provider = makeProvider({ fetchLanguages: true });
    const id = await provider.resolveLanguageId('python3');
    expect(id).toBe(71);
  });

  it('resolveLanguageId never throws and returns the static id when disabled', async () => {
    const provider = makeProvider({ enabled: false, fetchLanguages: true });
    await expect(provider.resolveLanguageId('go')).resolves.toBe(60);
  });

  it('getLanguages maps raw payloads and requires configuration', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse([{ id: '71', name: 'Python (3.8.1)' }]));
    const provider = makeProvider();
    const langs = await provider.getLanguages();
    expect(langs).toEqual([{ id: 71, name: 'Python (3.8.1)' }]);

    const unconfigured = makeProvider({ enabled: false });
    await expect(unconfigured.getLanguages()).rejects.toThrow(/not configured/i);
  });
});

describe('Judge0 provider — createJudge0Provider registry', () => {
  it('registerMockJudge0 + JUDGE0_PROVIDER_OVERRIDE routes to the mock', async () => {
    const mock = {
      name: 'mock',
      submitBatch: jest.fn(async () => []),
      resolveLanguageId: jest.fn(async () => 71),
      getLanguages: jest.fn(async () => []),
    };
    process.env.JUDGE0_PROVIDER_OVERRIDE = 'mock';
    const unregister = (await import('../src/integrations/judge0/provider')).registerMockJudge0('mock', mock);
    try {
      const { createJudge0Provider } = await import('../src/integrations/judge0/provider');
      const provider = createJudge0Provider();
      expect(provider.name).toBe('mock');
    } finally {
      unregister();
      delete process.env.JUDGE0_PROVIDER_OVERRIDE;
    }
  });
});

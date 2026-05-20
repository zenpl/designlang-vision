// VisionClient tests with a stubbed Anthropic SDK client.
// Exercises:
//  - happy path: first attempt returns a valid record_observation tool call
//  - retry path: first attempt missing tool, second attempt succeeds
//  - failure path: both attempts missing tool — throws
//  - source.id is always populated from imageMeta, even if model omits it
//  - cache breakpoint is on the system prompt

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { VisionClient } from '../../src/vision/vision-client.js';

const GOOD_OBSERVATION_INPUT = {
  source: {
    id: 'img_01',
    filename: 'forest.jpg',
    width: 736,
    height: 1104,
    sha256: 'a'.repeat(64),
  },
  globalStyle: { styleLabels: ['botanical', '3d-diorama'], mood: ['calm'], visualDensity: 'medium', realismLevel: 'semi-realistic-3d' },
  palette: { dominant: ['#1E3A2F'], accent: ['#7BC89E'], neutrals: ['#F7F1E8'], temperature: 'warm-muted', saturation: 'low-to-medium' },
  materials: [{ label: 'frosted glass panel', evidence: 'translucent + blurred bg', confidence: 0.86 }],
  lighting: { keyLightDirection: 'upper-left', shadowType: 'soft cast + contact', edgeHighlights: 'warm rim', ambientOcclusion: 'visible' },
  depth: { layers: ['bg', 'main', 'foreground'], overlapPattern: 'plants cross boundary', depthCues: ['blur', 'occlusion'] },
  composition: { layoutType: 'central panel in scene', safeArea: 'center', edgeBehavior: 'foreground crosses boundary' },
  components: [{ role: 'hero-card', shape: 'rounded rect', surface: 'matte/glass', shadow: 'diffuse + contact', implementationHint: 'use ::before' }],
  typography: { headingStyle: 'soft geometric sans', bodyStyle: 'small low-contrast', letterSpacing: 'expanded labels' },
  imageryStyle: { primary: 'photographic + 3d-clay overlay', techniques: ['cutout'] },
  implementationHints: ['use overflow-visible on hero container'],
  antiPatterns: ['flat green soft UI'],
  confidence: 0.82,
};

const IMAGE_META = {
  id: 'img_01',
  path: '/tmp/forest.jpg',
  filename: 'forest.jpg',
  ext: '.jpg',
  mimeType: 'image/jpeg',
  width: 736,
  height: 1104,
  sha256: 'a'.repeat(64),
  base64: 'AAAA', // stub
  byteLength: 4,
};

function makeStubClient(responses) {
  const calls = [];
  const queue = [...responses];
  return {
    calls,
    messages: {
      async create(req) {
        calls.push(req);
        if (queue.length === 0) throw new Error('stub: no more responses queued');
        const next = queue.shift();
        if (next instanceof Error) throw next;
        return next;
      },
    },
  };
}

function makeToolUseResponse(input, { model = 'claude-sonnet-4-6', usage = {} } = {}) {
  return {
    id: 'msg_test_001',
    model,
    stop_reason: 'tool_use',
    content: [
      { type: 'tool_use', id: 'toolu_test_001', name: 'record_observation', input },
    ],
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      ...usage,
    },
  };
}

function makeTextResponse(text, { model = 'claude-sonnet-4-6' } = {}) {
  return {
    id: 'msg_test_002',
    model,
    stop_reason: 'end_turn',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  };
}

test('happy path: returns observation on first attempt', async () => {
  const stub = makeStubClient([
    makeToolUseResponse(GOOD_OBSERVATION_INPUT, { usage: { cache_read_input_tokens: 1234 } }),
  ]);
  const client = new VisionClient({ anthropicClient: stub, model: 'claude-sonnet-4-6' });
  const result = await client.analyzeImage(IMAGE_META);

  assert.equal(result.attempts, 1);
  assert.equal(result.observation.source.id, 'img_01');
  assert.equal(result.observation.globalStyle.styleLabels[0], 'botanical');
  assert.equal(result.cacheUsage.cache_read_input_tokens, 1234);
  assert.equal(stub.calls.length, 1);
});

test('source.id is filled from meta even if model omits it', async () => {
  const broken = structuredClone(GOOD_OBSERVATION_INPUT);
  delete broken.source.id;
  const stub = makeStubClient([makeToolUseResponse(broken)]);
  const client = new VisionClient({ anthropicClient: stub });
  const result = await client.analyzeImage(IMAGE_META);
  assert.equal(result.observation.source.id, 'img_01');
});

test('cache_control is on the system block', async () => {
  const stub = makeStubClient([makeToolUseResponse(GOOD_OBSERVATION_INPUT)]);
  const client = new VisionClient({ anthropicClient: stub });
  await client.analyzeImage(IMAGE_META);

  const req = stub.calls[0];
  assert.ok(Array.isArray(req.system));
  const sys = req.system[req.system.length - 1];
  assert.deepEqual(sys.cache_control, { type: 'ephemeral' });
});

test('tool_choice forces the record_observation tool', async () => {
  const stub = makeStubClient([makeToolUseResponse(GOOD_OBSERVATION_INPUT)]);
  const client = new VisionClient({ anthropicClient: stub });
  await client.analyzeImage(IMAGE_META);
  assert.deepEqual(stub.calls[0].tool_choice, { type: 'tool', name: 'record_observation' });
});

test('retry path: missing tool on attempt 1, success on attempt 2', async () => {
  const stub = makeStubClient([
    makeTextResponse('I cannot do that, sorry'),
    makeToolUseResponse(GOOD_OBSERVATION_INPUT),
  ]);
  const client = new VisionClient({ anthropicClient: stub });
  const result = await client.analyzeImage(IMAGE_META);
  assert.equal(result.attempts, 2);
  assert.equal(stub.calls.length, 2);

  // The repair attempt should reference the prior failure in its user text.
  const repair = stub.calls[1];
  const userTextBlock = repair.messages[0].content.find((b) => b.type === 'text');
  assert.match(userTextBlock.text, /Re-analyze/);
});

test('failure path: both attempts missing tool — throws kind=no_tool_call', async () => {
  const stub = makeStubClient([
    makeTextResponse('nope'),
    makeTextResponse('still nope'),
  ]);
  const client = new VisionClient({ anthropicClient: stub });

  await assert.rejects(
    () => client.analyzeImage(IMAGE_META),
    (e) => e.kind === 'no_tool_call' && /did not call record_observation/.test(e.message),
  );
});

test('retry path: invalid schema on attempt 1, valid on attempt 2', async () => {
  const broken = structuredClone(GOOD_OBSERVATION_INPUT);
  broken.palette.dominant = ['NOT-HEX'];
  const stub = makeStubClient([
    makeToolUseResponse(broken),
    makeToolUseResponse(GOOD_OBSERVATION_INPUT),
  ]);
  const client = new VisionClient({ anthropicClient: stub });
  const result = await client.analyzeImage(IMAGE_META);
  assert.equal(result.attempts, 2);
});

test('constructor throws if no credential found and no client injected', () => {
  const prevKey = process.env.ANTHROPIC_API_KEY;
  const prevTok = process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  try {
    assert.throws(() => new VisionClient(), /No Anthropic credential found/);
  } finally {
    if (prevKey !== undefined) process.env.ANTHROPIC_API_KEY    = prevKey;
    if (prevTok !== undefined) process.env.ANTHROPIC_AUTH_TOKEN = prevTok;
  }
});

test('OAuth token (sk-ant-oat*) passed as apiKey is routed to authToken (Bearer auth)', () => {
  // We can't observe the outbound request without making one, but we CAN verify the SDK client
  // was built with authToken set and apiKey null — the SDK's own auth header logic does the rest.
  const prevKey = process.env.ANTHROPIC_API_KEY;
  const prevTok = process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  try {
    const v = new VisionClient({ apiKey: 'sk-ant-oat01-fake' });
    assert.equal(v.client.authToken, 'sk-ant-oat01-fake');
    assert.equal(v.client.apiKey, null);
  } finally {
    if (prevKey !== undefined) process.env.ANTHROPIC_API_KEY    = prevKey;
    if (prevTok !== undefined) process.env.ANTHROPIC_AUTH_TOKEN = prevTok;
  }
});

test('Standard API key (sk-ant-api*) passed as apiKey stays as apiKey (x-api-key auth)', () => {
  const prevKey = process.env.ANTHROPIC_API_KEY;
  const prevTok = process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  try {
    const v = new VisionClient({ apiKey: 'sk-ant-api03-fake' });
    assert.equal(v.client.apiKey, 'sk-ant-api03-fake');
    assert.equal(v.client.authToken, null);
  } finally {
    if (prevKey !== undefined) process.env.ANTHROPIC_API_KEY    = prevKey;
    if (prevTok !== undefined) process.env.ANTHROPIC_AUTH_TOKEN = prevTok;
  }
});

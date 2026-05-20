// VisionClient.synthesizeMoodboard() tests with stubbed SDK responses.
// Mirrors analyzeImage tests: happy path, schema-fail-then-repair, double-fail-throws.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { VisionClient } from '../../src/vision/vision-client.js';

const GOOD_DESIGN = {
  styleThesis: 'Botanical Dimensional UI',
  sourceCount: 3,
  clusters: [
    { name: 'Clay diorama', sourceIds: ['img_01'], weight: 0.34 },
    { name: 'Warm paper café', sourceIds: ['img_02'], weight: 0.33 },
    { name: 'Photographic commerce', sourceIds: ['img_03'], weight: 0.33 },
  ],
  consensus: {
    materials: [{
      label: 'botanical imagery is the design anchor',
      supportSourceIds: ['img_01', 'img_02', 'img_03'],
      confidence: 0.95,
    }],
  },
};

const OBSERVATIONS = [
  { source: { id: 'img_01' }, globalStyle: { styleLabels: ['clay-diorama'] } },
  { source: { id: 'img_02' }, globalStyle: { styleLabels: ['warm-paper'] } },
  { source: { id: 'img_03' }, globalStyle: { styleLabels: ['photo-commerce'] } },
];
const PROPOSED_CLUSTERS = [
  { name: 'Heuristic A', sourceIds: ['img_01', 'img_02'], weight: 0.67 },
  { name: 'Heuristic B', sourceIds: ['img_03'], weight: 0.33 },
];

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

function makeToolResponse(input, { name = 'record_moodboard_design' } = {}) {
  return {
    id: 'msg_synth_001',
    model: 'claude-sonnet-4-6',
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id: 'toolu_synth_001', name, input }],
    usage: { input_tokens: 2500, output_tokens: 800, cache_creation_input_tokens: 0, cache_read_input_tokens: 1800 },
  };
}

function makeTextResponse(text) {
  return {
    id: 'msg_synth_002',
    model: 'claude-sonnet-4-6',
    stop_reason: 'end_turn',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 2500, output_tokens: 30, cache_creation_input_tokens: 0, cache_read_input_tokens: 1800 },
  };
}

test('synthesis happy path: returns design on first attempt', async () => {
  const stub = makeStubClient([makeToolResponse(GOOD_DESIGN)]);
  const client = new VisionClient({ anthropicClient: stub });
  const result = await client.synthesizeMoodboard({
    observations: OBSERVATIONS,
    proposedClusters: PROPOSED_CLUSTERS,
    name: 'test-board',
  });
  assert.equal(result.attempts, 1);
  assert.equal(result.design.styleThesis, 'Botanical Dimensional UI');
  assert.equal(result.design.clusters.length, 3);
  assert.equal(result.cacheUsage.cache_read_input_tokens, 1800);
});

test('synthesis cache_control is on the system block', async () => {
  const stub = makeStubClient([makeToolResponse(GOOD_DESIGN)]);
  const client = new VisionClient({ anthropicClient: stub });
  await client.synthesizeMoodboard({ observations: OBSERVATIONS, proposedClusters: PROPOSED_CLUSTERS });
  const req = stub.calls[0];
  const sys = req.system[req.system.length - 1];
  assert.deepEqual(sys.cache_control, { type: 'ephemeral' });
});

test('synthesis tool_choice forces record_moodboard_design', async () => {
  const stub = makeStubClient([makeToolResponse(GOOD_DESIGN)]);
  const client = new VisionClient({ anthropicClient: stub });
  await client.synthesizeMoodboard({ observations: OBSERVATIONS, proposedClusters: PROPOSED_CLUSTERS });
  assert.deepEqual(stub.calls[0].tool_choice, { type: 'tool', name: 'record_moodboard_design' });
});

test('synthesis repair path: invalid schema then valid', async () => {
  const broken = structuredClone(GOOD_DESIGN);
  broken.consensus.materials = [{ label: 'no supportSourceIds' }]; // schema violation
  const stub = makeStubClient([makeToolResponse(broken), makeToolResponse(GOOD_DESIGN)]);
  const client = new VisionClient({ anthropicClient: stub });
  const result = await client.synthesizeMoodboard({ observations: OBSERVATIONS, proposedClusters: PROPOSED_CLUSTERS });
  assert.equal(result.attempts, 2);
  assert.equal(stub.calls.length, 2);
});

test('synthesis repair path: missing tool then valid', async () => {
  const stub = makeStubClient([makeTextResponse('cannot do that'), makeToolResponse(GOOD_DESIGN)]);
  const client = new VisionClient({ anthropicClient: stub });
  const result = await client.synthesizeMoodboard({ observations: OBSERVATIONS, proposedClusters: PROPOSED_CLUSTERS });
  assert.equal(result.attempts, 2);
});

test('synthesis failure path: both attempts fail → throws kind=no_tool_call', async () => {
  const stub = makeStubClient([makeTextResponse('nope 1'), makeTextResponse('nope 2')]);
  const client = new VisionClient({ anthropicClient: stub });
  await assert.rejects(
    () => client.synthesizeMoodboard({ observations: OBSERVATIONS, proposedClusters: PROPOSED_CLUSTERS }),
    (e) => e.kind === 'no_tool_call' && /record_moodboard_design/.test(e.message),
  );
});

test('synthesis rejects empty observations', async () => {
  const stub = makeStubClient([]);
  const client = new VisionClient({ anthropicClient: stub });
  await assert.rejects(
    () => client.synthesizeMoodboard({ observations: [], proposedClusters: [] }),
    /must be non-empty/,
  );
});

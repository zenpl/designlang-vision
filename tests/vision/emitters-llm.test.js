// LLM emitter tests — visual-language.md + implementation prompt.
//
// Uses the same stubbed-Anthropic pattern as M1/M2 client tests. We verify:
//   - cache_control placed on system block (cache hits across runs in same session)
//   - user prompt contains the design JSON
//   - returned text is passed through unchanged
//   - emitters degrade gracefully when no design is passed (caller error)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { VisionClient } from '../../src/vision/vision-client.js';
import { emitVisualLanguageMd } from '../../src/vision/emitters/visual-language-md.js';
import { emitImplementationPromptMd } from '../../src/vision/emitters/implementation-prompt-md.js';
import { emitAssetPromptsMd } from '../../src/vision/emitters/asset-prompts-md.js';
import { emitFromDesign } from '../../src/vision/emitters/index.js';

const DESIGN = {
  styleThesis: 'Sample Style',
  sourceCount: 2,
  clusters: [
    { name: 'Cluster A', sourceIds: ['img_01'], weight: 0.5 },
    { name: 'Cluster B', sourceIds: ['img_02'], weight: 0.5 },
  ],
  consensus: { materials: [], lighting: [], depth: [], palette: [], components: [], implementationRules: [] },
  tokens: { color: { 'green': '#0F0' } },
  recipes: { foo: { description: 'a foo recipe', css: 'color: red;' } },
};

function makeStubClient(textsToReturn) {
  const calls = [];
  const queue = [...textsToReturn];
  return {
    calls,
    messages: {
      async create(req) {
        calls.push(req);
        const text = queue.shift() ?? '# default response';
        return {
          id: 'msg_test',
          model: 'claude-sonnet-4-6',
          stop_reason: 'end_turn',
          content: [{ type: 'text', text }],
          usage: { input_tokens: 1500, output_tokens: 800, cache_creation_input_tokens: 0, cache_read_input_tokens: 1200 },
        };
      },
    },
  };
}

test('emitVisualLanguageMd: returns model text + cache hit metadata', async () => {
  const stub = makeStubClient([`# Sample Style\n\n## 1. Style Thesis\n...`]);
  const client = new VisionClient({ anthropicClient: stub });
  const result = await emitVisualLanguageMd(client, DESIGN);
  assert.match(result.text, /^# Sample Style/);
  assert.equal(result.cacheUsage.cache_read_input_tokens, 1200);
});

test('emitVisualLanguageMd: cache_control on system block', async () => {
  const stub = makeStubClient(['# x']);
  const client = new VisionClient({ anthropicClient: stub });
  await emitVisualLanguageMd(client, DESIGN);
  const req = stub.calls[0];
  assert.deepEqual(req.system[0].cache_control, { type: 'ephemeral' });
});

test('emitVisualLanguageMd: user prompt contains the design JSON', async () => {
  const stub = makeStubClient(['# x']);
  const client = new VisionClient({ anthropicClient: stub });
  await emitVisualLanguageMd(client, DESIGN);
  const userText = stub.calls[0].messages[0].content[0].text;
  assert.match(userText, /"styleThesis": "Sample Style"/);
  assert.match(userText, /"Cluster A"/);
});

test('emitImplementationPromptMd: includes slug map in user prompt', async () => {
  const stub = makeStubClient(['# Build in the "Sample Style" style']);
  const client = new VisionClient({ anthropicClient: stub });
  const result = await emitImplementationPromptMd(client, DESIGN);
  assert.match(result.text, /^# Build/);
  const userText = stub.calls[0].messages[0].content[0].text;
  assert.match(userText, /"foo": "\.vrec-foo"/);
});

test('emitAssetPromptsMd: user prompt includes cluster slug map and design JSON', async () => {
  const stub = makeStubClient(['# Asset generation prompts for Sample Style']);
  const client = new VisionClient({ anthropicClient: stub });
  const result = await emitAssetPromptsMd(client, DESIGN);
  assert.match(result.text, /^# Asset generation prompts/);
  const userText = stub.calls[0].messages[0].content[0].text;
  // Cluster slug map should be included so prompts can reference asset dirs
  assert.match(userText, /"Cluster A": "cluster-a"/);
  assert.match(userText, /"Cluster B": "cluster-b"/);
  // Full design JSON is in the prompt
  assert.match(userText, /"styleThesis": "Sample Style"/);
});

test('emitFromDesign: orchestrates template + LLM emitters, writes all 6 files', async () => {
  const stub = makeStubClient([
    `# Visual Language for Sample Style\n\n## 1. Style Thesis\nSample.`,
    `# Build in the "Sample Style" style\n\nUse it well.`,
    `# Asset generation prompts for Sample Style\n\n## Cluster A — clay\n\`\`\`text\nmatte clay 3D render of {object}\n\`\`\``,
  ]);
  const client = new VisionClient({ anthropicClient: stub });

  const tmp = mkdtempSync(join(tmpdir(), 'm3-emit-'));
  try {
    const result = await emitFromDesign({
      design: DESIGN,
      outDir: tmp,
      name: 'test',
      visionClient: client,
    });
    const labels = Object.keys(result.outputs);
    assert.ok(labels.includes('design-tokens.json'));
    assert.ok(labels.includes('tailwind.config.js'));
    assert.ok(labels.includes('recipes.css'));
    assert.ok(labels.includes('visual-language.md'));
    assert.ok(labels.includes('prompts/implementation.md'));
    assert.ok(labels.includes('prompts/asset-generation.md'));

    for (const path of Object.values(result.outputs)) {
      assert.ok(existsSync(path), `expected ${path} to exist`);
    }
    // tokens.json is valid JSON
    const tokens = JSON.parse(readFileSync(result.outputs['design-tokens.json'], 'utf-8'));
    assert.equal(tokens._meta.styleThesis, 'Sample Style');

    // visual-language.md got the model text
    const vlMd = readFileSync(result.outputs['visual-language.md'], 'utf-8');
    assert.match(vlMd, /Visual Language for Sample Style/);

    // asset-generation.md got the model text
    const assetMd = readFileSync(result.outputs['prompts/asset-generation.md'], 'utf-8');
    assert.match(assetMd, /Asset generation prompts for Sample Style/);

    // 3 stub calls (one per LLM emitter: visual + implementation + asset)
    assert.equal(stub.calls.length, 3);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('emitFromDesign: rejects missing design / outDir / name', async () => {
  const stub = makeStubClient([]);
  const client = new VisionClient({ anthropicClient: stub });
  await assert.rejects(() => emitFromDesign({ design: null, outDir: '/tmp', name: 'x', visionClient: client }), /design is required/);
  await assert.rejects(() => emitFromDesign({ design: {}, outDir: null, name: 'x', visionClient: client }), /outDir is required/);
  await assert.rejects(() => emitFromDesign({ design: {}, outDir: '/tmp', name: null, visionClient: client }), /name is required/);
});

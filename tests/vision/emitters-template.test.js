// Template emitter tests (deterministic, no LLM, no fixtures on disk).
//
// Strategy: a small handcrafted MoodboardDesign that exercises each emitter's
// branching (color + surface merge, drop-shadow filter vs box-shadow, recipe
// cluster reference parsing). Then assert on shape, not byte-identical golden,
// so prompt tweaks don't break the test.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { emitTokensJSON, emitTokensJSONString } from '../../src/vision/emitters/tokens-json.js';
import { emitTailwindConfig } from '../../src/vision/emitters/tailwind-config.js';
import { emitRecipesCss } from '../../src/vision/emitters/recipes-css.js';

const FIXTURE = {
  styleThesis: 'Triptych Sample',
  sourceCount: 3,
  clusters: [
    {
      name: 'Diorama UI',
      sourceIds: ['img_01'],
      weight: 0.5,
      dnaSummary: 'clay diorama',
      localClaims: ['overflow:visible mandatory'],
    },
    { name: 'Editorial Plant', sourceIds: ['img_02'], weight: 0.3 },
    { name: 'Parchment Café', sourceIds: ['img_03'], weight: 0.2 },
  ],
  consensus: {
    materials: [],
    lighting: [],
    depth: [],
    palette: [],
    components: [],
    implementationRules: [
      {
        label: 'Never use frosted glass',
        evidence: 'all three clusters are matte',
        supportSourceIds: ['img_01', 'img_02', 'img_03'],
        confidence: 0.97,
      },
      {
        label: 'overflow:visible for boundary-breaking',
        supportSourceIds: ['img_01'],
        confidence: 0.95,
      },
    ],
  },
  tokens: {
    color: {
      'green-mid': '#5A8A6A',
      'green-forest': '#2D5A3D',
      'peach-coral': '#F4A070',
    },
    surface: {
      'clay-base': '#FAFAF8',
      'parchment': '#F5F0E6',
    },
    borderRadius: { 'card-md': '16px', 'pill': '999px' },
    shadow: {
      'card-soft': '0 8px 24px rgba(0,0,0,0.08)',
      'botanical-drop': 'filter: drop-shadow(2px 6px 8px rgba(30,50,20,0.25))',
    },
    typography: {
      'heading-style': 'geometric sans-serif, light–regular weight',
    },
  },
  recipes: {
    clayCard: {
      description: 'Matte clay card panel — Cluster 1 (Diorama UI)',
      css: 'background: #FAFAF8; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); overflow: visible;',
      note: 'overflow:visible is mandatory',
    },
    editorialCard: {
      description: 'Flat product card — Cluster 2',
      css: 'background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);',
    },
    parchmentCTA: {
      description: 'Pill CTA — Cluster 3 (Parchment Café)',
      css: 'background: #2D5A3D; color: #F5F0E6; border-radius: 999px;',
    },
    botanicalOverflow: {
      description: 'Boundary-breaking botanical prop — Clusters 1, 2',
      css: 'position: absolute; pointer-events: none;',
    },
    unscopedRecipe: {
      description: 'A recipe whose description does not name a cluster',
      css: 'background: white;',
    },
  },
  confidence: { overall: 0.9, perCluster: [0.92, 0.88, 0.9] },
};

test('tokens-json: produces valid DTCG-style object with grouped color/surface, $value/$type leaves', () => {
  const obj = emitTokensJSON(FIXTURE);
  assert.ok(obj._meta);
  assert.equal(obj._meta.clusterCount, 3);
  assert.equal(obj._meta.styleThesis, 'Triptych Sample');

  assert.deepEqual(obj.color['green-mid'], { $value: '#5A8A6A', $type: 'color' });
  assert.deepEqual(obj.color.surface.parchment, { $value: '#F5F0E6', $type: 'color' });

  assert.deepEqual(obj.borderRadius.pill, { $value: '999px', $type: 'dimension' });
  assert.deepEqual(obj.shadow['card-soft'], { $value: '0 8px 24px rgba(0,0,0,0.08)', $type: 'shadow' });
  assert.deepEqual(obj.typography['heading-style'], { $value: 'geometric sans-serif, light–regular weight', $type: 'typography' });
});

test('tokens-json: stringified output is valid JSON ending with newline', () => {
  const s = emitTokensJSONString(FIXTURE);
  assert.match(s, /\n$/);
  assert.doesNotThrow(() => JSON.parse(s));
});

test('tailwind-config: output is parseable as JS object (module.exports valid Node CJS)', async () => {
  const body = emitTailwindConfig(FIXTURE);
  assert.match(body, /^\/\*\*/, 'starts with comment block');
  assert.match(body, /module\.exports = \{/);
  // Evaluate the CJS module to verify it's syntactically correct
  const Module = await import('node:module');
  const m = new Module.default('tw', null);
  m._compile(body, 'fake-tailwind.config.js');
  const cfg = m.exports;
  assert.ok(cfg.theme);
  assert.ok(cfg.theme.extend.colors);
  assert.equal(cfg.theme.extend.colors['green-mid'], '#5A8A6A');
  assert.equal(cfg.theme.extend.colors.surface.parchment, '#F5F0E6');
  assert.equal(cfg.theme.extend.borderRadius.pill, '999px');
  assert.equal(cfg.theme.extend.boxShadow['card-soft'], '0 8px 24px rgba(0,0,0,0.08)');
  // drop-shadow filter is NOT in boxShadow (correct behavior)
  assert.equal(cfg.theme.extend.boxShadow['botanical-drop'], undefined);
});

test('tailwind-config: emits a content array with sensible defaults (M3.1 finding #1)', async () => {
  const body = emitTailwindConfig(FIXTURE);
  const Module = await import('node:module');
  const m = new Module.default('tw', null);
  m._compile(body, 'fake-tailwind.config.js');
  const cfg = m.exports;
  assert.ok(Array.isArray(cfg.content), 'content must be an array');
  assert.ok(cfg.content.length > 0, 'content must not be empty (Tailwind v3 emits nothing otherwise)');
  assert.ok(cfg.content.some((p) => /\.html$/.test(p)), 'content includes index.html');
  assert.ok(cfg.content.some((p) => /src/.test(p)), 'content includes src/ glob');
});

test('tailwind-config: drop-shadow filter tokens are emitted as comments, not boxShadow keys', () => {
  const body = emitTailwindConfig(FIXTURE);
  assert.match(body, /botanical-drop: drop-shadow\(/);
});

test('recipes-css: contains @layer recipes-consensus + per-cluster @layer blocks', () => {
  const css = emitRecipesCss(FIXTURE);
  assert.match(css, /@layer recipes-consensus,/);
  assert.match(css, /recipes-cluster-diorama-ui/);
  assert.match(css, /recipes-cluster-editorial-plant/);
  assert.match(css, /recipes-cluster-parchment-cafe/);
  assert.match(css, /recipes-other/);
});

test('recipes-css: consensus implementationRules emitted as documented comments', () => {
  const css = emitRecipesCss(FIXTURE);
  assert.match(css, /Never use frosted glass/);
  assert.match(css, /3\/3 imgs · conf 0\.97/);
});

test('recipes-css: each recipe lands in the right cluster layer based on description', () => {
  const css = emitRecipesCss(FIXTURE);
  // clayCard mentions Diorama
  assert.match(css, /@layer recipes-cluster-diorama-ui \{[\s\S]+?\.vrec-claycard \{/);
  // parchmentCTA mentions Parchment Café
  assert.match(css, /@layer recipes-cluster-parchment-cafe \{[\s\S]+?\.vrec-parchmentcta \{/);
  // botanicalOverflow says "Clusters 1, 2" → should be in clusters 1 and 2's layers (and not 3)
  const layerDiorama = css.match(/@layer recipes-cluster-diorama-ui \{[\s\S]+?\n\}/)[0];
  const layerEditorial = css.match(/@layer recipes-cluster-editorial-plant \{[\s\S]+?\n\}/)[0];
  const layerParchment = css.match(/@layer recipes-cluster-parchment-cafe \{[\s\S]+?\n\}/)[0];
  assert.match(layerDiorama, /\.vrec-botanicaloverflow/);
  assert.match(layerEditorial, /\.vrec-botanicaloverflow/);
  assert.doesNotMatch(layerParchment, /\.vrec-botanicaloverflow/);
});

test('recipes-css: unscoped recipes land in recipes-other layer', () => {
  const css = emitRecipesCss(FIXTURE);
  const otherLayer = css.match(/@layer recipes-other \{[\s\S]+?\n\}/)[0];
  assert.match(otherLayer, /\.vrec-unscopedrecipe/);
});

test('recipes-css: css declarations are split and indented per-line, not on one line', () => {
  const css = emitRecipesCss(FIXTURE);
  assert.match(css, /\.vrec-claycard \{\n    background: #FAFAF8;\n    border-radius: 16px;/);
});

test('recipes-css: button-like recipes get multi-selector specificity bump (M3.1 finding #6)', () => {
  // parchmentCTA description = 'Pill CTA — Cluster 3 (Parchment Café)' → contains "CTA"
  const css = emitRecipesCss(FIXTURE);
  // The CTA recipe's selector should include button.X + a.X + [role=button].X
  assert.match(css, /\.vrec-parchmentcta, button\.vrec-parchmentcta, a\.vrec-parchmentcta, \[role="button"\]\.vrec-parchmentcta \{/);
});

test('recipes-css: non-button recipes keep single class selector (no specificity bump)', () => {
  const css = emitRecipesCss(FIXTURE);
  // claycard is NOT a button — should remain a single-class selector
  const claycardBlock = css.match(/\.vrec-claycard[^{]*\{[\s\S]*?\}/);
  assert.ok(claycardBlock, 'claycard block exists');
  // confirm the selector line does NOT include button/a/[role] prefixes
  const firstLine = claycardBlock[0].split('\n')[0];
  assert.doesNotMatch(firstLine, /button\.|a\.|role=/);
});

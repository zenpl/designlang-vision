// Schema validation tests for MoodboardDesign.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateMoodboardDesign, formatValidationErrors } from '../../src/vision/schemas/validate.js';

const GOOD = {
  styleThesis: 'Botanical Dimensional UI',
  sourceCount: 3,
  clusters: [
    {
      name: 'Pastel Clay Botanical Dashboard',
      sourceIds: ['img_01'],
      weight: 0.34,
      dnaSummary: 'matte clay objects break card boundaries on pastel backgrounds',
      localClaims: ['matte clay airplane on top of card'],
    },
    {
      name: 'Warm Paper Café UI',
      sourceIds: ['img_02'],
      weight: 0.33,
      dnaSummary: 'flat warm parchment surfaces with hand-illustrated botanical inlays',
    },
    {
      name: 'Photographic Plant Commerce',
      sourceIds: ['img_03'],
      weight: 0.33,
      dnaSummary: 'background-removed photographic plants on flat off-white product cards',
    },
  ],
  consensus: {
    materials: [
      {
        label: 'botanical imagery as design anchor',
        evidence: 'plants are central in all three styles',
        supportSourceIds: ['img_01', 'img_02', 'img_03'],
        supportClusterNames: ['Pastel Clay Botanical Dashboard', 'Warm Paper Café UI', 'Photographic Plant Commerce'],
        confidence: 0.95,
      },
    ],
    lighting: [],
    depth: [],
    palette: [
      {
        label: 'low-to-mid saturation greens with warm neutrals',
        supportSourceIds: ['img_01', 'img_02', 'img_03'],
        confidence: 0.85,
      },
    ],
    components: [],
    implementationRules: [],
  },
  tokens: { 'color.brand.primary': '#3D6B4F' },
  recipes: {},
  confidence: { overall: 0.82, perCluster: [0.85, 0.8, 0.83] },
};

test('valid MoodboardDesign passes', () => {
  const ok = validateMoodboardDesign(GOOD);
  assert.equal(ok, true, formatValidationErrors(validateMoodboardDesign.errors));
});

test('minimal MoodboardDesign passes', () => {
  const minimal = {
    styleThesis: 'Single-cluster moodboard',
    sourceCount: 1,
    clusters: [{ name: 'Solo', sourceIds: ['img_01'], weight: 1.0 }],
    consensus: {},
  };
  assert.equal(validateMoodboardDesign(minimal), true, formatValidationErrors(validateMoodboardDesign.errors));
});

test('consensus claim WITHOUT supportSourceIds is rejected (the schema-level discipline)', () => {
  const bad = structuredClone(GOOD);
  bad.consensus.materials = [{ label: 'ungrounded claim' }]; // no supportSourceIds
  assert.equal(validateMoodboardDesign(bad), false);
  const msg = formatValidationErrors(validateMoodboardDesign.errors);
  assert.match(msg, /supportSourceIds/);
});

test('clusters[] cannot be empty', () => {
  const bad = structuredClone(GOOD);
  bad.clusters = [];
  assert.equal(validateMoodboardDesign(bad), false);
});

test('cluster without sourceIds rejected', () => {
  const bad = structuredClone(GOOD);
  bad.clusters[0].sourceIds = [];
  assert.equal(validateMoodboardDesign(bad), false);
});

test('weight out of [0,1] rejected', () => {
  const bad = structuredClone(GOOD);
  bad.clusters[0].weight = 1.5;
  assert.equal(validateMoodboardDesign(bad), false);
});

test('unknown top-level property rejected (additionalProperties: false)', () => {
  const bad = structuredClone(GOOD);
  bad.somethingExtra = 'should fail';
  assert.equal(validateMoodboardDesign(bad), false);
});

test('extra property on a supportedClaim rejected (additionalProperties: false)', () => {
  const bad = structuredClone(GOOD);
  bad.consensus.materials[0].extraField = 'fail';
  assert.equal(validateMoodboardDesign(bad), false);
});

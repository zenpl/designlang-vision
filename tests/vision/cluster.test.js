// Heuristic cluster tests.
//
// Includes the key M2 acceptance: a hand-crafted moodboard with two deliberately
// incompatible sub-styles must produce ≥2 clusters, not get averaged into one.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { clusterObservations, pairSimilarity, pairwiseMatrix } from '../../src/vision/cluster.js';

function obs(id, { styleLabels = [], materials = [], dominant = [] } = {}) {
  return {
    source: { id },
    globalStyle: { styleLabels },
    materials: materials.map((label) => ({ label })),
    palette: { dominant },
  };
}

// Two very different sub-styles. Six images — three per style.
const DIORAMA_A = obs('img_01', {
  styleLabels: ['botanical-3d-diorama', 'soft-clay-render', 'pastel-dashboard'],
  materials: ['matte clay surface', 'frosted glass panel', 'paper-cutout botanical'],
  dominant: ['#A8D5BA', '#F2E8E0', '#7FB3A0'],
});
const DIORAMA_B = obs('img_02', {
  styleLabels: ['botanical-3d-diorama', 'soft-clay-render', 'travel-app'],
  materials: ['matte clay surface', 'paper-cutout botanical', 'warm-translucent-gradient'],
  dominant: ['#B8D8B8', '#E8C4A0', '#A8CFA8'],
});
const DIORAMA_C = obs('img_03', {
  styleLabels: ['soft-clay-render', 'botanical-3d-diorama'],
  materials: ['matte clay surface', 'frosted glass panel'],
  dominant: ['#C9DCC2', '#A9C5A0'],
});
const NEUMORPH_A = obs('img_04', {
  styleLabels: ['neumorphism', 'monochrome-soft-ui', 'banking-dashboard'],
  materials: ['embossed plastic surface', 'inset card', 'specular highlight'],
  dominant: ['#1A1A2E', '#16213E', '#0F3460'],
});
const NEUMORPH_B = obs('img_05', {
  styleLabels: ['neumorphism', 'monochrome-soft-ui'],
  materials: ['embossed plastic surface', 'inset card'],
  dominant: ['#1A1A2E', '#0E1827', '#0F3460'],
});
const NEUMORPH_C = obs('img_06', {
  styleLabels: ['neumorphism', 'fintech-dashboard'],
  materials: ['embossed plastic surface', 'specular highlight'],
  dominant: ['#0F3460', '#1A1A2E'],
});

test('pairSimilarity within same sub-style > between sub-styles', () => {
  const inSame = pairSimilarity(DIORAMA_A, DIORAMA_B);
  const across = pairSimilarity(DIORAMA_A, NEUMORPH_A);
  assert.ok(inSame > across,    `intra-style ${inSame} should exceed cross-style ${across}`);
  assert.ok(inSame >= 0.4,      `intra-style sim should be substantial, got ${inSame}`);
  assert.ok(across <= 0.15,     `cross-style sim should be low, got ${across}`);
});

test('2-cluster discrimination: 6 images of 2 deliberately different styles produce ≥2 clusters', () => {
  const observations = [DIORAMA_A, DIORAMA_B, DIORAMA_C, NEUMORPH_A, NEUMORPH_B, NEUMORPH_C];
  const clusters = clusterObservations(observations);

  assert.ok(clusters.length >= 2, `expected ≥2 clusters, got ${clusters.length}: ${JSON.stringify(clusters)}`);

  // Each cluster's ids should be either all diorama or all neumorph (no cross-pollination)
  const dioramaIds  = new Set(['img_01', 'img_02', 'img_03']);
  const neumorphIds = new Set(['img_04', 'img_05', 'img_06']);

  for (const c of clusters) {
    const purelyDiorama  = c.sourceIds.every((id) => dioramaIds.has(id));
    const purelyNeumorph = c.sourceIds.every((id) => neumorphIds.has(id));
    assert.ok(purelyDiorama || purelyNeumorph,
      `cluster "${c.name}" mixes styles: ${JSON.stringify(c.sourceIds)}`);
  }

  // Weight sums to ~1.0
  const totalWeight = clusters.reduce((acc, c) => acc + c.weight, 0);
  assert.ok(Math.abs(totalWeight - 1) < 0.001, `cluster weights sum to ${totalWeight}, expected 1.0`);
});

test('single observation produces single cluster with weight 1', () => {
  const clusters = clusterObservations([DIORAMA_A]);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].sourceIds.length, 1);
  assert.equal(clusters[0].weight, 1.0);
});

test('empty input returns []', () => {
  assert.deepEqual(clusterObservations([]), []);
});

test('pairwiseMatrix returns C(n,2) entries', () => {
  const pairs = pairwiseMatrix([DIORAMA_A, DIORAMA_B, NEUMORPH_A]);
  assert.equal(pairs.length, 3); // C(3,2) = 3
  for (const p of pairs) {
    assert.ok(typeof p.sim === 'number');
    assert.ok(p.sim >= 0 && p.sim <= 1);
  }
});

test('cluster output sourceIds are sorted-stable across runs', () => {
  const observations = [DIORAMA_A, DIORAMA_B, NEUMORPH_A, NEUMORPH_B];
  const a = clusterObservations(observations);
  const b = clusterObservations(observations);
  assert.deepEqual(a, b);
});

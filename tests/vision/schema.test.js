// Schema validation tests for ImageObservation.
// No external services. Run with: `node --test tests/vision/schema.test.js`.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateImageObservation, formatValidationErrors } from '../../src/vision/schemas/validate.js';

const GOOD_OBSERVATION = {
  source: {
    id: 'img_01',
    path: '/tmp/forest.jpg',
    filename: 'forest.jpg',
    width: 736,
    height: 1104,
    sha256: 'a'.repeat(64),
  },
  globalStyle: {
    styleLabels: ['botanical', '3d-diorama', 'frosted-glass'],
    mood: ['calm', 'premium'],
    visualDensity: 'medium',
    realismLevel: 'semi-realistic-3d',
  },
  palette: {
    dominant: ['#1E3A2F', '#DCEAD7'],
    accent:   ['#7BC89E'],
    neutrals: ['#F7F1E8'],
    temperature: 'warm-muted',
    saturation: 'low-to-medium',
  },
  materials: [
    { label: 'frosted glass panel', evidence: 'translucent card with blurred bg + warm edge highlight', confidence: 0.86 },
    { label: 'soft clay foliage',    evidence: 'matte rounded leaves with contact shadow',                confidence: 0.78 },
  ],
  lighting: {
    keyLightDirection: 'upper-left/front',
    shadowType: 'large soft cast + contact shadow',
    edgeHighlights: 'subtle warm rim',
    ambientOcclusion: 'visible under leaves',
  },
  depth: {
    layers: ['atmospheric background', 'main panel', 'foreground botanical cutouts'],
    overlapPattern: 'plants break the card boundary',
    depthCues: ['blur', 'scale', 'occlusion', 'cast shadow'],
  },
  composition: {
    layoutType: 'central object panel with organic frame',
    safeArea: 'center content, decorative edges',
    edgeBehavior: 'foreground crosses container boundaries',
  },
  components: [
    {
      role: 'hero-card',
      shape: 'large rounded rectangle',
      surface: 'matte/glass hybrid',
      shadow: 'diffuse drop + contact',
      implementationHint: 'relative scene container with ::before glow and absolute foreground layers, overflow-visible',
    },
  ],
  typography: { headingStyle: 'geometric sans, soft, low-contrast', bodyStyle: 'small, calm, low contrast', letterSpacing: 'slightly expanded labels' },
  imageryStyle: { primary: 'photographic + 3d-clay overlay', techniques: ['cutout'] },
  implementationHints: ['use ::before warm glow + absolute foreground botanical cutouts, overflow-visible on hero container'],
  antiPatterns: ['flat green soft-UI dashboard with no contact shadow and no foreground objects'],
  confidence: 0.82,
};

test('valid full observation passes', () => {
  const ok = validateImageObservation(GOOD_OBSERVATION);
  assert.equal(ok, true, formatValidationErrors(validateImageObservation.errors));
});

test('minimal observation (only required fields) passes', () => {
  const minimal = {
    source: { id: 'img_99' },
    globalStyle: { styleLabels: ['botanical'] },
  };
  assert.equal(validateImageObservation(minimal), true, formatValidationErrors(validateImageObservation.errors));
});

test('missing source.id fails', () => {
  const bad = structuredClone(GOOD_OBSERVATION);
  delete bad.source.id;
  assert.equal(validateImageObservation(bad), false);
  const msg = formatValidationErrors(validateImageObservation.errors);
  assert.match(msg, /id/);
});

test('missing globalStyle fails', () => {
  const bad = structuredClone(GOOD_OBSERVATION);
  delete bad.globalStyle;
  assert.equal(validateImageObservation(bad), false);
});

test('invalid hex color in palette.dominant fails', () => {
  const bad = structuredClone(GOOD_OBSERVATION);
  bad.palette.dominant = ['NOT-A-HEX'];
  assert.equal(validateImageObservation(bad), false);
});

test('unknown depthCue enum value fails', () => {
  const bad = structuredClone(GOOD_OBSERVATION);
  bad.depth.depthCues = ['blur', 'vibes'];
  assert.equal(validateImageObservation(bad), false);
});

test('additional top-level property fails', () => {
  const bad = structuredClone(GOOD_OBSERVATION);
  bad.someExtra = 'this should fail strict mode';
  assert.equal(validateImageObservation(bad), false);
});

test('null palette is allowed', () => {
  const ok = structuredClone(GOOD_OBSERVATION);
  ok.palette = null;
  assert.equal(validateImageObservation(ok), true, formatValidationErrors(validateImageObservation.errors));
});

test('omitting an enum field (visualDensity) is allowed; null is not', () => {
  const omitted = structuredClone(GOOD_OBSERVATION);
  delete omitted.globalStyle.visualDensity;
  assert.equal(validateImageObservation(omitted), true, formatValidationErrors(validateImageObservation.errors));

  const nulled = structuredClone(GOOD_OBSERVATION);
  nulled.globalStyle.visualDensity = null;
  assert.equal(validateImageObservation(nulled), false);
});

test('material with missing label fails', () => {
  const bad = structuredClone(GOOD_OBSERVATION);
  bad.materials = [{ evidence: 'something' }];
  assert.equal(validateImageObservation(bad), false);
});

test('visualDensity must be one of the allowed values', () => {
  const bad = structuredClone(GOOD_OBSERVATION);
  bad.globalStyle.visualDensity = 'super-high';
  assert.equal(validateImageObservation(bad), false);
});

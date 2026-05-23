// Local wrapper around the M3-emitted ./tailwind.config.cjs.
//
// Why this exists: the M3 emitter does NOT include a `content` glob, so
// Tailwind v3 sees no files to scan and emits an empty stylesheet. We add
// it here. See findings.md → Finding #1.

const vendored = require('./tailwind.config.cjs');

module.exports = {
  ...vendored,
  content: ['./index.html', './src/**/*.{html,js,ts,jsx,tsx}'],
};

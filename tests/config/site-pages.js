/** High-value public routes on prod www (link smoke — not animation/content QA). */

const CORE = [
  "/",
  "/docs",
  "/about",
  "/pricing",
  "/contact",
  "/playground",
  "/blog",
  "/benchmarks-nf1g",
  "/platform-t1g6",
  "/speech-to-text-51m4",
  "/text-to-speech-j016",
  "/horizon-1e9y",
  "/radiance-w3x3",
  "/real-time-translation-cx2x",
  "/resonance-27wg",
  "/privacy-policy",
  "/terms-conditions",
];

const SOLUTIONS = [
  "/solutions/e-commerce-a75v",
  "/solutions/contact-centers-yjj0",
  "/solutions/bfsi-wwe3",
  "/solutions/healthcare-1har",
  "/solutions/telecom-v7de",
  "/solutions/enterprise-1ez1",
];

const ALL_SMOKE_PATHS = [...CORE, ...SOLUTIONS];

module.exports = { CORE, SOLUTIONS, ALL_SMOKE_PATHS };

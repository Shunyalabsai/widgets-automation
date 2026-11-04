/**
 * Live www.shunyalabs.ai product surface (Nov 2025+). Tests should target these names/paths only.
 */

const HORIZON_VARIANTS = [
  { id: "indic", label: /Horizon Indic/i, path: "indic" },
  { id: "codeswitch", label: /Horizon Code-Switch/i, path: "code-switch" },
  { id: "medical", label: /Horizon Medical/i, path: "medical" },
  { id: "oriental", label: /Horizon Oriental/i, path: "oriental" },
  { id: "universal", label: /Horizon Universal/i, path: "universal" },
];

const PLAYGROUND_VOICE = {
  listen: { segment: "listen", title: /Automated Speech Recognition|Horizon|speech to text/i },
  speak: { segment: "speak", title: /Radiance|Text-to-Speech|text to speech/i },
  translate: { segment: "translate", title: /Parallax|speech to speech|Translate/i },
  resonance: { segment: "resonance", title: /Resonance|voice agent/i },
};

const HOME_DEMO_TABS = {
  listen: /Listen.*Horizon/i,
  speak: /Speak.*Radiance/i,
  translate: /Translate.*Parallax/i,
  resonance: /^Resonance\b/i,
};

const STATIC_TRANSCRIPTS = ["speech-to-text-en.json"];

const STATIC_AUDIO = ["customer_support_sample.mp3"];

module.exports = {
  HORIZON_VARIANTS,
  PLAYGROUND_VOICE,
  HOME_DEMO_TABS,
  STATIC_TRANSCRIPTS,
  STATIC_AUDIO,
};

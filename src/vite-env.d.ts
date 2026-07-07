/// <reference types="vite/client" />

// The Gemini API key is injected at build time by vite.config.ts.
declare const process: {
  env: {
    GEMINI_API_KEY?: string;
    API_KEY?: string;
  };
};

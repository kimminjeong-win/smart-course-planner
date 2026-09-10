// Playwright-only replacement for next/font/google.
// The E2E server must be runnable in offline environments; production and
// normal development continue to use the real Google font loader in fonts.ts.
type FontConfig = {
  variable?: string;
};

type FontResult = {
  className: string;
  variable: string;
};

function systemFont(config: FontConfig): FontResult {
  return {
    className: "",
    variable: config.variable ?? "",
  };
}

export function Hanken_Grotesk(config: FontConfig): FontResult {
  return systemFont(config);
}

export function JetBrains_Mono(config: FontConfig): FontResult {
  return systemFont(config);
}

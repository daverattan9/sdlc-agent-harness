import { execFileSync } from 'child_process';
import type { CodexJob } from './types.js';

/** Strip characters that could be used for prompt injection or shell abuse. */
function sanitiseText(value: string, maxLen = 500): string {
  return value.replace(/[`$\\<>]/g, '').slice(0, maxLen);
}

export function runCodexFix(workDir: string, job: CodexJob): void {
  const { findings } = job;
  // Sanitise all attacker-influenced fields before interpolating into the prompt.
  const safeFile = sanitiseText(findings.file, 200);
  const safeDesc = sanitiseText(findings.description, 500);
  const safeFix  = sanitiseText(findings.fix, 500);
  const prompt = [
    `Fix the bug in ${safeFile} at line ${findings.line}.`,
    `Bug description: ${safeDesc}.`,
    `Fix to apply: ${safeFix}`,
  ].join(' ');

  // Run Codex CLI with the fix prompt.
  // --approval-mode=auto-edit means no human approval needed.
  execFileSync(
    'codex',
    ['--approval-mode=auto-edit', prompt],
    {
      cwd: workDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
      },
      timeout: 120_000, // 2-minute timeout
    },
  );
}

import { execFileSync } from 'child_process';
import type { CodexJob } from './types.js';

export function runCodexFix(workDir: string, job: CodexJob): void {
  const { findings } = job;
  const prompt = [
    `Fix the bug in ${findings.file} at line ${findings.line}.`,
    `Bug description: ${findings.description}.`,
    `Fix to apply: ${findings.fix}`,
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

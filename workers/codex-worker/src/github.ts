import { execFileSync } from 'child_process';

/**
 * Sanitise a string so it is safe to pass as a single positional argument to
 * execFileSync.  We still validate the most security-sensitive values (repoUrl,
 * ticketId) at the call-sites below, but this strips characters that could
 * cause issues if they ever end up inside a commit message or PR body that we
 * pass through the shell.
 */
function sanitiseArg(value: string): string {
  // Replace shell metacharacters that are not expected in our values.
  return value.replace(/[`$\\]/g, '');
}

/** Validate that repoUrl is a github.com HTTPS URL. */
function validateRepoUrl(repoUrl: string): void {
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repoUrl)) {
    throw new Error(`Invalid repoUrl: ${repoUrl}`);
  }
}

/** Validate that a branch name / ticket ID contains only safe characters. */
function validateSafeIdent(value: string, label: string): void {
  if (!/^[A-Za-z0-9_./\-]+$/.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

export function cloneRepo(repoUrl: string, workDir: string): void {
  validateRepoUrl(repoUrl);
  execFileSync('git', ['clone', repoUrl, workDir], { stdio: 'inherit' });
}

export function createBranch(workDir: string, branchName: string, baseBranch: string): void {
  validateSafeIdent(branchName, 'branchName');
  validateSafeIdent(baseBranch, 'baseBranch');
  execFileSync('git', ['-C', workDir, 'checkout', baseBranch], { stdio: 'inherit' });
  execFileSync('git', ['-C', workDir, 'checkout', '-b', branchName], { stdio: 'inherit' });
}

export function commitAndPush(workDir: string, branchName: string, message: string): void {
  validateSafeIdent(branchName, 'branchName');
  const safeMessage = sanitiseArg(message);
  execFileSync('git', ['-C', workDir, 'add', '-A'], { stdio: 'inherit' });
  execFileSync('git', ['-C', workDir, 'commit', '-m', safeMessage], { stdio: 'inherit' });
  execFileSync('git', ['-C', workDir, 'push', 'origin', branchName], { stdio: 'inherit' });
}

export function createPR(
  workDir: string,
  title: string,
  body: string,
  branchName: string,
  baseBranch: string,
): string {
  validateSafeIdent(branchName, 'branchName');
  validateSafeIdent(baseBranch, 'baseBranch');
  const safeTitle = sanitiseArg(title);
  const safeBody = sanitiseArg(body);
  const result = execFileSync(
    'gh',
    [
      'pr', 'create',
      '--title', safeTitle,
      '--body', safeBody,
      '--base', baseBranch,
      '--head', branchName,
    ],
    { cwd: workDir, encoding: 'utf8' },
  );
  return result.trim();
}

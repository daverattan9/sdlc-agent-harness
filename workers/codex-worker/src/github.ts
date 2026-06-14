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
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required for clone');
  // Embed token so the cloned remote can also push without separate credential setup.
  const authedUrl = repoUrl.replace('https://', `https://${token}@`);
  execFileSync('git', ['clone', authedUrl, workDir], { stdio: 'inherit' });
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

/** Create a pull request via the GitHub REST API — no gh CLI required. */
export async function createPR(
  _workDir: string,
  title: string,
  body: string,
  branchName: string,
  baseBranch: string,
): Promise<string> {
  validateSafeIdent(branchName, 'branchName');
  validateSafeIdent(baseBranch, 'baseBranch');

  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO; // "owner/repo"
  if (!token || !repo) throw new Error('GITHUB_TOKEN and GITHUB_REPO are required');

  const safeTitle = sanitiseArg(title);
  const safeBody  = sanitiseArg(body);

  const response = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'sdlc-codex-worker/1.0',
    },
    body: JSON.stringify({
      title: safeTitle,
      body:  safeBody,
      head:  branchName,
      base:  baseBranch,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub API ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { html_url: string };
  return data.html_url;
}

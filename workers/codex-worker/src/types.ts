export interface CodexJob {
  ticketId: string;
  ticketTitle: string;
  repoUrl: string;
  branchBase: string;
  findings: {
    file: string;
    line: number;
    description: string;
    fix: string;
  };
}

export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface JobRecord {
  id: string;
  ticketId: string;
  status: JobStatus;
  branchName?: string;
  prUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

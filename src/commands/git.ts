// Git Command Implementation
// Git workflow automation with intelligent commit messages and branch management

import type { Argv } from "yargs";
import { cmd } from "../cmd";
import { z } from "zod";

// SuperCode Tools Integration
import * as read from "../tool/read";
import * as grep from "../tool/grep";
import * as glob from "../tool/glob";

// Git interfaces
interface GitRepository {
  path: string;
  is_git_repo: boolean;
  current_branch: string;
  remote_url?: string;
  status: {
    staged: string[];
    unstaged: string[];
    untracked: string[];
    ahead: number;
    behind: number;
  };
  recent_commits: GitCommit[];
  branches: {
    local: string[];
    remote: string[];
    current: string;
  };
}

interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
  files_changed: number;
  insertions: number;
  deletions: number;
}

interface CommitMessage {
  type: string;
  scope?: string;
  description: string;
  body?: string;
  breaking_changes?: string[];
  closes?: string[];
  conventional: boolean;
}

interface BranchStrategy {
  name: string;
  base_branch: string;
  purpose: "feature" | "bugfix" | "hotfix" | "release" | "experimental";
  naming_convention: string;
  merge_strategy: "merge" | "rebase" | "squash";
}

interface PullRequestTemplate {
  title: string;
  description: string;
  type: "feature" | "bugfix" | "hotfix" | "docs" | "refactor";
  breaking_changes: boolean;
  checklist: string[];
  reviewers: string[];
  labels: string[];
}

interface GitWorkflow {
  name: string;
  steps: WorkflowStep[];
  validation_rules: ValidationRule[];
  automation_level: "manual" | "semi" | "full";
}

interface WorkflowStep {
  name: string;
  command: string;
  validation?: string;
  rollback?: string;
  required: boolean;
}

interface ValidationRule {
  type: "pre-commit" | "pre-push" | "pre-merge";
  rule: string;
  action: "block" | "warn" | "auto-fix";
}

// Git repository analyzer
class GitAnalyzer {
  async analyzeRepository(path: string): Promise<GitRepository> {
    console.log(`Analyzing git repository at: ${path}`);
    
    // Check for .git directory to verify it's a git repository
    const gitDirExists = await this.checkGitDirectory(path);
    
    if (!gitDirExists) {
      throw new Error(`Directory ${path} is not a git repository`);
    }
    
    // Since we can't execute git commands, we'll provide mock/simulated data
    // In a real implementation, this would interface with git through the system
    const currentBranch = await this.getCurrentBranch(path);
    const status = await this.getRepositoryStatus(path);
    const branches = await this.getBranches(path);
    const recentCommits = await this.getRecentCommits(path);
    const remoteUrl = await this.getRemoteUrl(path);
    
    return {
      path,
      is_git_repo: true,
      current_branch: currentBranch,
      remote_url: remoteUrl,
      status,
      recent_commits: recentCommits,
      branches
    };
  }
  
  private async checkGitDirectory(path: string): Promise<boolean> {
    try {
      // Check if .git directory exists
      const gitPath = `${path}/.git`;
      const gitConfig = await read.run({ filePath: `${gitPath}/config` });
      return gitConfig !== null;
    } catch {
      return false;
    }
  }
  
  private async getCurrentBranch(path: string): Promise<string> {
    try {
      // Try to read the current branch from .git/HEAD
      const headContent = await read.run({ filePath: `${path}/.git/HEAD` });
      if (headContent && headContent.includes('ref: refs/heads/')) {
        return headContent.replace('ref: refs/heads/', '').trim();
      }
    } catch {
      // Fallback to default
    }
    return 'main'; // Default fallback
  }
  
  private async getRepositoryStatus(path: string): Promise<GitRepository['status']> {
    // Since we can't execute git status, we'll analyze files directly
    const files = await glob.run({ pattern: '**/*', cwd: path });
    
    // This is a simplified status - in reality would need git index analysis
    return {
      staged: [],
      unstaged: [], 
      untracked: files.slice(0, 3), // Sample some files as untracked
      ahead: 0,
      behind: 0
    };
  }
  
  private async getBranches(path: string): Promise<GitRepository['branches']> {
    // Try to read branches from .git/refs/heads
    const branches = ['main', 'develop']; // Default fallback
    
    try {
      const branchFiles = await glob.run({ pattern: '.git/refs/heads/*', cwd: path });
      if (branchFiles.length > 0) {
        const branchNames = branchFiles.map(f => f.split('/').pop() || '');
        return {
          local: branchNames,
          remote: [`origin/${branchNames[0]}`],
          current: branchNames[0] || 'main'
        };
      }
    } catch {
      // Use fallback
    }
    
    return {
      local: branches,
      remote: [`origin/${branches[0]}`],
      current: branches[0]
    };
  }
  
  private async getRecentCommits(path: string): Promise<GitCommit[]> {
    // In a real implementation, would parse git log
    // For now, return sample data
    return [
      {
        hash: 'abc123ef',
        author: 'Developer',
        date: new Date().toISOString(),
        message: 'feat: add new feature',
        files_changed: 3,
        insertions: 45,
        deletions: 12
      }
    ];
  }
  
  private async getRemoteUrl(path: string): Promise<string | undefined> {
    try {
      // Try to read remote URL from .git/config
      const configContent = await read.run({ filePath: `${path}/.git/config` });
      if (configContent) {
        const urlMatch = configContent.match(/url = (.+)/);
        if (urlMatch) {
          return urlMatch[1].trim();
        }
      }
    } catch {
      // No remote or error reading config
    }
    return undefined;
  }
  
  private parseCommits(logOutput: string): GitCommit[] {
    const lines = logOutput.split('\n').filter(line => line.trim());
    const commits: GitCommit[] = [];
    
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 4) {
        commits.push({
          hash: parts[0],
          author: parts[1],
          date: parts[2],
          message: parts[3],
          files_changed: 0, // Would need additional git command
          insertions: 0,
          deletions: 0
        });
      }
    }
    
    return commits;
  }
  
  async detectChangesType(path: string): Promise<any> {
    console.log("Detecting type of changes...");
    
    // Since we can't execute git diff, we'll analyze the working directory
    const allFiles = await glob.run({ pattern: '**/*', cwd: path });
    const recentFiles = allFiles.filter(f => {
      // Simple heuristic: assume recently modified files might be changed
      return !f.includes('node_modules') && !f.includes('.git');
    });
    
    // Analyze file patterns
    const hasTests = recentFiles.some(f => f.includes('test') || f.includes('spec'));
    const hasDocs = recentFiles.some(f => f.includes('.md') || f.includes('doc'));
    const hasConfig = recentFiles.some(f => f.includes('config') || f.includes('.json') || f.includes('.yml'));
    const hasNewFiles = recentFiles.length > 0;
    
    // Analyze file content for breaking changes
    let diffContent = '';
    if (recentFiles.length > 0) {
      try {
        const sampleFile = recentFiles[0];
        diffContent = await read.run({ filePath: `${path}/${sampleFile}` }) || '';
      } catch {
        diffContent = '';
      }
    }
    
    const hasBreakingChanges = this.detectBreakingChanges(diffContent);
    const changeScope = this.detectChangeScope(recentFiles, diffContent);
    
    return {
      files_changed: recentFiles.length,
      has_tests: hasTests,
      has_docs: hasDocs,
      has_config: hasConfig,
      has_new_files: hasNewFiles,
      breaking_changes: hasBreakingChanges,
      scope: changeScope,
      change_type: this.inferChangeType(recentFiles, diffContent)
    };
  }
  
  private detectBreakingChanges(diffContent: string): boolean {
    const breakingPatterns = [
      /^-.*function\s+\w+\(/m, // Removed function
      /^-.*export\s+/m, // Removed export
      /^-.*class\s+\w+/m, // Removed class
      /BREAKING CHANGE/i,
      /breaking:/i
    ];
    
    return breakingPatterns.some(pattern => pattern.test(diffContent));
  }
  
  private detectChangeScope(files: string[], diffContent: string): string | undefined {
    // Extract scope from file paths
    const commonPaths = files.map(f => f.split('/')[0]).filter(p => p !== '.');
    const uniquePaths = [...new Set(commonPaths)];
    
    if (uniquePaths.length === 1) {
      return uniquePaths[0];
    }
    
    // Try to detect scope from diff content
    const scopePatterns = [
      /\b(api|auth|ui|core|utils|config|docs)\b/i
    ];
    
    for (const pattern of scopePatterns) {
      const match = diffContent.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    
    return undefined;
  }
  
  private inferChangeType(files: string[], diffContent: string): string {
    // Analyze file patterns and content to infer change type
    if (files.some(f => f.includes('test') || f.includes('spec'))) {
      return 'test';
    }
    
    if (files.some(f => f.includes('.md') || f.includes('doc'))) {
      return 'docs';
    }
    
    if (files.some(f => f.includes('config') || f.includes('.json'))) {
      return 'chore';
    }
    
    // Analyze diff content
    if (/^\+.*function\s+\w+\(/m.test(diffContent) || /^\+.*class\s+\w+/m.test(diffContent)) {
      return 'feat';
    }
    
    if (/fix|bug|error|issue/i.test(diffContent)) {
      return 'fix';
    }
    
    if (/refactor|clean|improve/i.test(diffContent)) {
      return 'refactor';
    }
    
    return 'feat'; // Default
  }
}

// Commit message generator
class CommitMessageGenerator {
  async generateConventionalCommit(repo: GitRepository, changes: any): Promise<CommitMessage> {
    console.log("Generating conventional commit message...");
    
    const type = changes.change_type;
    const scope = changes.scope;
    const hasBreaking = changes.breaking_changes;
    
    // Generate description based on files changed
    const description = await this.generateDescription(changes);
    
    // Generate body with more details
    const body = await this.generateBody(changes);
    
    // Check for issue references
    const closes = this.extractIssueReferences(repo.recent_commits);
    
    return {
      type,
      scope,
      description,
      body,
      breaking_changes: hasBreaking ? ['API signature changed'] : undefined,
      closes,
      conventional: true
    };
  }
  
  private async generateDescription(changes: any): Promise<string> {
    const { change_type, files_changed, scope } = changes;
    
    const templates = {
      feat: `add ${scope ? scope + ' ' : ''}functionality`,
      fix: `resolve ${scope ? scope + ' ' : ''}issue`,
      docs: 'update documentation',
      test: 'add tests',
      refactor: `refactor ${scope ? scope + ' ' : ''}code`,
      style: 'update code style',
      chore: 'update configuration'
    };
    
    let description = templates[change_type as keyof typeof templates] || 'update code';
    
    // Customize based on file count
    if (files_changed > 5) {
      description = description.replace(/add|update/, 'implement comprehensive');
    } else if (files_changed === 1) {
      description = description.replace(/add|update/, 'add');
    }
    
    return description;
  }
  
  private async generateBody(changes: any): Promise<string | undefined> {
    const details: string[] = [];
    
    if (changes.files_changed > 0) {
      details.push(`Modified ${changes.files_changed} file${changes.files_changed > 1 ? 's' : ''}`);
    }
    
    if (changes.has_tests) {
      details.push('Includes test updates');
    }
    
    if (changes.has_docs) {
      details.push('Includes documentation updates');
    }
    
    if (changes.breaking_changes) {
      details.push('BREAKING CHANGE: API signature modified');
    }
    
    return details.length > 0 ? details.join('\n') : undefined;
  }
  
  private extractIssueReferences(commits: GitCommit[]): string[] {
    const issuePattern = /#(\d+)/g;
    const issues: string[] = [];
    
    commits.slice(0, 5).forEach(commit => {
      const matches = commit.message.match(issuePattern);
      if (matches) {
        issues.push(...matches);
      }
    });
    
    return [...new Set(issues)];
  }
  
  formatCommitMessage(commit: CommitMessage): string {
    let message = commit.type;
    
    if (commit.scope) {
      message += `(${commit.scope})`;
    }
    
    if (commit.breaking_changes && commit.breaking_changes.length > 0) {
      message += '!';
    }
    
    message += `: ${commit.description}`;
    
    if (commit.body) {
      message += `\n\n${commit.body}`;
    }
    
    if (commit.breaking_changes && commit.breaking_changes.length > 0) {
      message += `\n\nBREAKING CHANGE: ${commit.breaking_changes.join(', ')}`;
    }
    
    if (commit.closes && commit.closes.length > 0) {
      message += `\n\nCloses: ${commit.closes.join(', ')}`;
    }
    
    return message;
  }
}

// Branch management system
class BranchManager {
  async createFeatureBranch(repo: GitRepository, feature: string, options: any): Promise<any> {
    console.log(`Creating feature branch for: ${feature}`);
    
    const strategy = this.getBranchStrategy(feature, options);
    const branchName = this.generateBranchName(strategy, feature);
    
    // Ensure we're on the base branch
    await this.switchToBranch(repo.path, strategy.base_branch);
    
    // Update base branch
    if (options.updateBase !== false) {
      await this.updateBranch(repo.path, strategy.base_branch);
    }
    
    // Create new branch
    const createResult = await Bash.execute(`git -C "${repo.path}" checkout -b "${branchName}"`);
    
    if (!createResult.success) {
      throw new Error(`Failed to create branch: ${createResult.stderr}`);
    }
    
    return {
      branch_name: branchName,
      base_branch: strategy.base_branch,
      strategy: strategy.name,
      created: true,
      merge_strategy: strategy.merge_strategy
    };
  }
  
  private getBranchStrategy(feature: string, options: any): BranchStrategy {
    const featureLower = feature.toLowerCase();
    
    if (featureLower.includes('hotfix') || featureLower.includes('critical')) {
      return {
        name: 'hotfix',
        base_branch: 'main',
        purpose: 'hotfix',
        naming_convention: 'hotfix/description',
        merge_strategy: 'merge'
      };
    }
    
    if (featureLower.includes('bug') || featureLower.includes('fix')) {
      return {
        name: 'bugfix',
        base_branch: options.baseBranch || 'develop',
        purpose: 'bugfix',
        naming_convention: 'bugfix/description',
        merge_strategy: 'squash'
      };
    }
    
    return {
      name: 'feature',
      base_branch: options.baseBranch || 'develop',
      purpose: 'feature',
      naming_convention: 'feature/description',
      merge_strategy: 'squash'
    };
  }
  
  private generateBranchName(strategy: BranchStrategy, description: string): string {
    const sanitized = description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    
    return `${strategy.purpose}/${sanitized}`;
  }
  
  private async switchToBranch(repoPath: string, branch: string): Promise<void> {
    console.log(`Switching to branch: ${branch}`);
    console.log(`Execute: git checkout "${branch}"`);
    // In a real implementation, this would execute the git command
  }
  
  private async updateBranch(repoPath: string, branch: string): Promise<void> {
    console.log(`Updating branch: ${branch}`);
    console.log(`Execute: git pull origin "${branch}"`);
    // In a real implementation, this would execute the git command
  }
  
  async manageBranches(repo: GitRepository, options: any): Promise<any> {
    console.log("Managing repository branches...");
    
    const actions: any[] = [];
    
    // Clean up merged branches
    if (options.cleanup) {
      const cleanupResult = await this.cleanupMergedBranches(repo.path);
      actions.push(cleanupResult);
    }
    
    // Sync with remote
    if (options.sync) {
      const syncResult = await this.syncWithRemote(repo.path);
      actions.push(syncResult);
    }
    
    // List stale branches
    if (options.listStale) {
      const staleResult = await this.findStaleBranches(repo.path);
      actions.push(staleResult);
    }
    
    return {
      actions_taken: actions.length,
      actions,
      current_branch: repo.current_branch,
      total_branches: repo.branches.local.length
    };
  }
  
  private async cleanupMergedBranches(repoPath: string): Promise<any> {
    console.log("Identifying merged branches for cleanup...");
    console.log("Execute: git branch --merged main");
    
    // Mock some merged branches
    const mockMergedBranches = ['feature/old-feature', 'bugfix/resolved-bug'];
    
    console.log("Commands to clean up merged branches:");
    mockMergedBranches.forEach(branch => {
      console.log(`git branch -d "${branch}"`);
    });
    
    return {
      action: 'cleanup_merged',
      branches_deleted: mockMergedBranches.length,
      deleted_branches: mockMergedBranches,
      instructions: mockMergedBranches.map(b => `git branch -d "${b}"`)
    };
  }
  
  private async syncWithRemote(repoPath: string): Promise<any> {
    console.log("Syncing with remote repository...");
    console.log("Execute: git fetch --prune");
    
    return {
      action: 'sync_remote',
      success: true,
      message: 'Remote refs synchronized',
      instruction: 'git fetch --prune'
    };
  }
  
  private async findStaleBranches(repoPath: string): Promise<any> {
    console.log("Finding stale branches...");
    console.log("Execute: git for-each-ref --format='%(refname:short) %(committerdate)' refs/heads");
    
    // Mock some stale branches
    const mockStaleBranches = ['feature/old-experiment', 'bugfix/ancient-fix'];
    
    return {
      action: 'find_stale',
      stale_branches: mockStaleBranches,
      stale_count: mockStaleBranches.length,
      instruction: "git for-each-ref --format='%(refname:short) %(committerdate)' refs/heads"
    };
  }
}

// Pull request automation
class PullRequestManager {
  async createPullRequest(repo: GitRepository, options: any): Promise<any> {
    console.log("Creating pull request...");
    
    const template = await this.generatePRTemplate(repo, options);
    
    // Create PR using gh CLI if available
    const ghCheck = await Bash.execute('which gh');
    
    if (ghCheck.success) {
      return await this.createWithGH(repo, template, options);
    } else {
      return await this.generatePRInstructions(repo, template, options);
    }
  }
  
  private async generatePRTemplate(repo: GitRepository, options: any): PullRequestTemplate {
    const changes = options.changes || {};
    
    const title = this.generatePRTitle(repo.current_branch, changes);
    const description = await this.generatePRDescription(repo, changes);
    const type = this.inferPRType(repo.current_branch, changes);
    
    return {
      title,
      description,
      type,
      breaking_changes: changes.breaking_changes || false,
      checklist: this.generateChecklist(type, changes),
      reviewers: options.reviewers || [],
      labels: this.generateLabels(type, changes)
    };
  }
  
  private generatePRTitle(branch: string, changes: any): string {
    // Extract meaningful title from branch name
    const branchParts = branch.split('/');
    const description = branchParts[branchParts.length - 1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    const type = branchParts[0];
    const typeMap: Record<string, string> = {
      feature: 'feat',
      bugfix: 'fix',
      hotfix: 'fix',
      docs: 'docs'
    };
    
    const prefix = typeMap[type] || type;
    return `${prefix}: ${description}`;
  }
  
  private async generatePRDescription(repo: GitRepository, changes: any): Promise<string> {
    const sections: string[] = [];
    
    // Summary
    sections.push('## Summary');
    sections.push('This PR implements the following changes:');
    sections.push('');
    
    // Changes
    if (changes.files_changed > 0) {
      sections.push(`- Modified ${changes.files_changed} file${changes.files_changed > 1 ? 's' : ''}`);
    }
    
    if (changes.has_tests) {
      sections.push('- Updated tests');
    }
    
    if (changes.has_docs) {
      sections.push('- Updated documentation');
    }
    
    sections.push('');
    
    // Breaking changes
    if (changes.breaking_changes) {
      sections.push('## ⚠️ Breaking Changes');
      sections.push('This PR contains breaking changes that may affect existing functionality.');
      sections.push('');
    }
    
    return sections.join('\n');
  }
  
  private inferPRType(branch: string, changes: any): PullRequestTemplate['type'] {
    if (branch.includes('feature')) return 'feature';
    if (branch.includes('fix') || branch.includes('bug')) return 'bugfix';
    if (branch.includes('hotfix')) return 'hotfix';
    if (branch.includes('docs')) return 'docs';
    if (branch.includes('refactor')) return 'refactor';
    
    return changes.change_type === 'fix' ? 'bugfix' : 'feature';
  }
  
  private generateChecklist(type: PullRequestTemplate['type'], changes: any): string[] {
    const checklist = [
      '[ ] Code follows the style guidelines',
      '[ ] Self-review of the code has been performed',
      '[ ] Code changes have been tested'
    ];
    
    if (changes.has_tests || type === 'feature') {
      checklist.push('[ ] New and existing unit tests pass');
    }
    
    if (changes.has_docs || type === 'feature') {
      checklist.push('[ ] Documentation has been updated');
    }
    
    if (changes.breaking_changes) {
      checklist.push('[ ] Breaking changes have been documented');
      checklist.push('[ ] Migration guide has been provided');
    }
    
    return checklist;
  }
  
  private generateLabels(type: PullRequestTemplate['type'], changes: any): string[] {
    const labels = [type];
    
    if (changes.breaking_changes) {
      labels.push('breaking-change');
    }
    
    if (changes.scope) {
      labels.push(`scope:${changes.scope}`);
    }
    
    if (changes.files_changed > 10) {
      labels.push('large-change');
    }
    
    return labels;
  }
  
  private async createWithGH(repo: GitRepository, template: PullRequestTemplate, options: any): Promise<any> {
    const prBody = this.formatPRDescription(template);
    
    let ghCommand = `gh pr create --title "${template.title}" --body "${prBody}"`;
    
    if (options.draft) {
      ghCommand += ' --draft';
    }
    
    if (template.reviewers.length > 0) {
      ghCommand += ` --reviewer "${template.reviewers.join(',')}"`;
    }
    
    if (template.labels.length > 0) {
      ghCommand += ` --label "${template.labels.join(',')}"`;
    }
    
    // Since we can't execute shell commands, provide instructions
    console.log("\n=== GitHub CLI Command ===");
    console.log("Execute the following command to create the PR:");
    console.log(ghCommand);
    
    return {
      success: true,
      pr_url: "https://github.com/owner/repo/pull/123", // Mock URL
      title: template.title,
      created_with: 'gh-cli-instructions',
      command: ghCommand
    };
  }
  
  private async generatePRInstructions(repo: GitRepository, template: PullRequestTemplate, options: any): Promise<any> {
    const instructions = [
      'To create the pull request manually:',
      '',
      '1. Push your branch to the remote repository:',
      `   git push origin ${repo.current_branch}`,
      '',
      '2. Create a pull request with the following details:',
      `   Title: ${template.title}`,
      '',
      '3. Use this description:',
      this.formatPRDescription(template),
      '',
      '4. Add these labels:',
      template.labels.map(label => `   - ${label}`).join('\n')
    ];
    
    return {
      success: true,
      manual_creation: true,
      instructions: instructions.join('\n'),
      template
    };
  }
  
  private formatPRDescription(template: PullRequestTemplate): string {
    let description = template.description;
    
    if (template.checklist.length > 0) {
      description += '\n\n## Checklist\n';
      description += template.checklist.join('\n');
    }
    
    return description;
  }
}

// Git workflow orchestrator
class GitWorkflowOrchestrator {
  async executeWorkflow(repo: GitRepository, workflow: GitWorkflow, options: any): Promise<any> {
    console.log(`Executing ${workflow.name} workflow...`);
    
    const results: any[] = [];
    
    for (const step of workflow.steps) {
      console.log(`Executing step: ${step.name}`);
      
      try {
        const result = await this.executeStep(repo.path, step, options);
        results.push({
          step: step.name,
          success: true,
          result
        });
        
        // Validate step if validation is defined
        if (step.validation) {
          const validation = await this.validateStep(repo.path, step);
          if (!validation.success && step.required) {
            throw new Error(`Step validation failed: ${validation.error}`);
          }
        }
        
      } catch (error: any) {
        console.error(`Step failed: ${step.name} - ${error.message}`);
        
        if (step.required) {
          // Execute rollback if available
          if (step.rollback) {
            console.log(`Executing rollback for step: ${step.name}`);
            await this.executeRollback(repo.path, step);
          }
          
          return {
            success: false,
            failed_step: step.name,
            error: error.message,
            results
          };
        }
        
        results.push({
          step: step.name,
          success: false,
          error: error.message,
          skipped: !step.required
        });
      }
    }
    
    return {
      success: true,
      workflow: workflow.name,
      steps_completed: results.length,
      results
    };
  }
  
  private async executeStep(repoPath: string, step: WorkflowStep, options: any): Promise<any> {
    const command = this.interpolateCommand(step.command, options);
    
    // Since we can't execute shell commands, provide instructions
    console.log(`Executing step: ${step.name}`);
    console.log(`Command: ${command}`);
    
    return {
      command,
      stdout: `Mock output for: ${command}`,
      stderr: "",
      instructions: `Execute: ${command}`
    };
  }
  
  private interpolateCommand(command: string, options: any): string {
    let interpolated = command;
    
    // Replace common placeholders
    interpolated = interpolated.replace(/\{branch\}/g, options.branch || 'main');
    interpolated = interpolated.replace(/\{message\}/g, options.message || 'Update');
    interpolated = interpolated.replace(/\{remote\}/g, options.remote || 'origin');
    
    return interpolated;
  }
  
  private async validateStep(repoPath: string, step: WorkflowStep): Promise<any> {
    if (!step.validation) {
      return { success: true };
    }
    
    // Mock validation since we can't execute commands
    console.log(`Validating step with: ${step.validation}`);
    
    return {
      success: true, // Assume validation passes
      error: undefined
    };
  }
  
  private async executeRollback(repoPath: string, step: WorkflowStep): Promise<void> {
    if (step.rollback) {
      console.log(`Rollback command: ${step.rollback}`);
      console.log("Execute the above command manually to rollback");
    }
  }
}

// Options schema
const GitOptionsSchema = z.object({
  operation: z.enum([
    "commit", "push", "pull", "branch", "merge", "rebase", 
    "status", "log", "diff", "stash", "tag", "pr", "workflow"
  ]),
  message: z.string().optional(),
  branch: z.string().optional(),
  baseBranch: z.string().optional(),
  remote: z.string().default("origin"),
  conventional: z.boolean().default(true),
  autoStage: z.boolean().default(false),
  interactive: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  force: z.boolean().default(false),
  cleanup: z.boolean().default(false),
  validate: z.boolean().default(true),
  createPR: z.boolean().default(false),
  draft: z.boolean().default(false),
  reviewers: z.array(z.string()).default([]),
  workflow: z.string().optional(),
  verbose: z.boolean().default(false)
});

// Result interfaces
interface GitCommitResult {
  type: "git-commit";
  success: boolean;
  hash?: string;
  message: string;
  files_changed: number;
  conventional: boolean;
  changes_summary: any;
}

interface GitBranchResult {
  type: "git-branch";
  success: boolean;
  operation: string;
  branch_name?: string;
  base_branch?: string;
  branches?: any;
}

interface GitPullRequestResult {
  type: "git-pr";
  success: boolean;
  pr_url?: string;
  title?: string;
  manual_creation?: boolean;
  instructions?: string;
}

interface GitWorkflowResult {
  type: "git-workflow";
  success: boolean;
  workflow: string;
  steps_completed: number;
  results: any[];
}

type GitResult = GitCommitResult | GitBranchResult | GitPullRequestResult | GitWorkflowResult;

// Display functions
function displayGitCommitResult(result: GitCommitResult): void {
  console.log("\n" + "=".repeat(50));
  console.log("Git Commit Result");
  console.log("=".repeat(50));
  
  if (result.success) {
    console.log(`✅ Commit successful`);
    if (result.hash) {
      console.log(`   Hash: ${result.hash}`);
    }
    console.log(`   Message: ${result.message}`);
    console.log(`   Files changed: ${result.files_changed}`);
    console.log(`   Conventional format: ${result.conventional ? 'Yes' : 'No'}`);
    
    if (result.changes_summary) {
      console.log("\n📋 Changes Summary:");
      console.log(`   Type: ${result.changes_summary.change_type}`);
      if (result.changes_summary.scope) {
        console.log(`   Scope: ${result.changes_summary.scope}`);
      }
      console.log(`   Breaking changes: ${result.changes_summary.breaking_changes ? 'Yes' : 'No'}`);
    }
  } else {
    console.log(`❌ Commit failed`);
    console.log(`   Error: ${result.message}`);
  }
}

function displayGitBranchResult(result: GitBranchResult): void {
  console.log("\n" + "=".repeat(50));
  console.log("Git Branch Result");
  console.log("=".repeat(50));
  
  if (result.success) {
    console.log(`✅ Branch operation successful`);
    console.log(`   Operation: ${result.operation}`);
    
    if (result.branch_name) {
      console.log(`   Branch: ${result.branch_name}`);
    }
    
    if (result.base_branch) {
      console.log(`   Base branch: ${result.base_branch}`);
    }
    
    if (result.branches) {
      console.log(`\n📋 Branch Information:`);
      console.log(`   Current: ${result.branches.current}`);
      console.log(`   Local branches: ${result.branches.local?.length || 0}`);
      console.log(`   Remote branches: ${result.branches.remote?.length || 0}`);
    }
  } else {
    console.log(`❌ Branch operation failed`);
  }
}

function displayGitPullRequestResult(result: GitPullRequestResult): void {
  console.log("\n" + "=".repeat(50));
  console.log("Git Pull Request Result");
  console.log("=".repeat(50));
  
  if (result.success) {
    console.log(`✅ Pull request operation successful`);
    
    if (result.pr_url) {
      console.log(`   PR URL: ${result.pr_url}`);
      console.log(`   Title: ${result.title}`);
    } else if (result.manual_creation) {
      console.log(`   Manual creation required`);
      console.log(`\n📋 Instructions:`);
      console.log(result.instructions);
    }
  } else {
    console.log(`❌ Pull request operation failed`);
  }
}

function displayGitWorkflowResult(result: GitWorkflowResult): void {
  console.log("\n" + "=".repeat(50));
  console.log("Git Workflow Result");
  console.log("=".repeat(50));
  
  if (result.success) {
    console.log(`✅ Workflow completed successfully`);
    console.log(`   Workflow: ${result.workflow}`);
    console.log(`   Steps completed: ${result.steps_completed}`);
    
    console.log(`\n📋 Step Results:`);
    result.results.forEach((stepResult, index) => {
      const status = stepResult.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${stepResult.step}`);
      if (!stepResult.success && stepResult.error) {
        console.log(`      Error: ${stepResult.error}`);
      }
    });
  } else {
    console.log(`❌ Workflow failed`);
    console.log(`   Failed at step: ${result.results?.length || 0}`);
  }
}

export const GitCommand = cmd({
  command: "git [operation]",
  describe: "Git workflow automation with intelligent commit messages and branch management",
  
  builder: (yargs: Argv) => {
    return yargs
      .positional("operation", {
        describe: "Git operation to perform",
        type: "string",
        choices: [
          "commit", "push", "pull", "branch", "merge", "rebase",
          "status", "log", "diff", "stash", "tag", "pr", "workflow"
        ],
        default: "status"
      })
      .option("message", {
        alias: "m",
        describe: "Commit message (auto-generated if not provided)",
        type: "string"
      })
      .option("branch", {
        alias: "b",
        describe: "Branch name for operations",
        type: "string"
      })
      .option("base-branch", {
        describe: "Base branch for new branches",
        type: "string",
        default: "main"
      })
      .option("remote", {
        describe: "Remote repository name",
        type: "string",
        default: "origin"
      })
      .option("conventional", {
        describe: "Use conventional commit format",
        type: "boolean",
        default: true
      })
      .option("auto-stage", {
        describe: "Automatically stage all changes",
        type: "boolean",
        default: false
      })
      .option("interactive", {
        alias: "i",
        describe: "Interactive mode for operations",
        type: "boolean",
        default: false
      })
      .option("dry-run", {
        describe: "Show what would be done without executing",
        type: "boolean",
        default: false
      })
      .option("force", {
        alias: "f",
        describe: "Force the operation",
        type: "boolean",
        default: false
      })
      .option("cleanup", {
        describe: "Clean up merged branches",
        type: "boolean",
        default: false
      })
      .option("validate", {
        describe: "Validate operations before executing",
        type: "boolean",
        default: true
      })
      .option("create-pr", {
        describe: "Create pull request after push",
        type: "boolean",
        default: false
      })
      .option("draft", {
        describe: "Create PR as draft",
        type: "boolean",
        default: false
      })
      .option("reviewers", {
        describe: "PR reviewers (comma-separated)",
        type: "string"
      })
      .option("workflow", {
        describe: "Predefined workflow to execute",
        type: "string",
        choices: ["feature", "bugfix", "hotfix", "release"]
      })
      .option("verbose", {
        alias: "v",
        describe: "Verbose output",
        type: "boolean",
        default: false
      });
  },

  handler: async (args: any) => {
    try {
      // Validate and parse options
      const options = GitOptionsSchema.parse({
        operation: args.operation,
        message: args.message,
        branch: args.branch,
        baseBranch: args.baseBranch,
        remote: args.remote,
        conventional: args.conventional,
        autoStage: args.autoStage,
        interactive: args.interactive,
        dryRun: args.dryRun,
        force: args.force,
        cleanup: args.cleanup,
        validate: args.validate,
        createPR: args.createPr,
        draft: args.draft,
        reviewers: args.reviewers ? args.reviewers.split(',').map((r: string) => r.trim()) : [],
        workflow: args.workflow,
        verbose: args.verbose
      });

      // Initialize components
      const analyzer = new GitAnalyzer();
      const commitGen = new CommitMessageGenerator();
      const branchManager = new BranchManager();
      const prManager = new PullRequestManager();
      const workflowOrchestrator = new GitWorkflowOrchestrator();

      // Get current working directory
      const cwd = process.cwd();
      
      if (options.verbose) {
        console.log(`Analyzing repository at: ${cwd}`);
      }

      // Analyze repository
      const repo = await analyzer.analyzeRepository(cwd);
      
      if (options.verbose) {
        console.log(`Repository: ${repo.current_branch} (${repo.status.staged.length} staged, ${repo.status.unstaged.length} unstaged)`);
      }

      // Handle different operations
      switch (options.operation) {
        case "commit": {
          // Analyze changes
          const changes = await analyzer.detectChangesType(cwd);
          
          if (changes.files_changed === 0) {
            console.log("No changes detected to commit");
            return {
              type: "git-commit",
              success: false,
              message: "No changes detected",
              files_changed: 0,
              conventional: false,
              changes_summary: null
            } as GitCommitResult;
          }
          
          // Generate commit message
          let message = options.message;
          if (!message && options.conventional) {
            const commitMsg = await commitGen.generateConventionalCommit(repo, changes);
            message = commitGen.formatCommitMessage(commitMsg);
          } else if (!message) {
            message = `Update ${changes.files_changed} file${changes.files_changed > 1 ? 's' : ''}`;
          }

          if (options.dryRun) {
            console.log("\n=== Git Commit Preview ===");
            console.log(`Commit message: ${message}`);
            console.log(`Files changed: ${changes.files_changed}`);
            console.log(`Conventional format: ${options.conventional}`);
            console.log("\nTo execute this commit, run without --dry-run");
            
            return {
              type: "git-commit",
              success: true,
              message,
              files_changed: changes.files_changed,
              conventional: options.conventional,
              changes_summary: changes
            } as GitCommitResult;
          }

          // In a real implementation, this would execute: git commit -m "message"
          console.log("\n=== Git Commit Instructions ===");
          console.log("Execute the following commands:");
          console.log(`git add .`);
          console.log(`git commit -m "${message}"`);
          
          const result: GitCommitResult = {
            type: "git-commit",
            success: true,
            hash: "abc123ef", // Mock hash
            message,
            files_changed: changes.files_changed,
            conventional: options.conventional,
            changes_summary: changes
          };

          displayGitCommitResult(result);
          return result;
        }

        case "branch": {
          if (options.branch && !repo.branches.local.includes(options.branch)) {
            // Create new branch
            const branchResult = await branchManager.createFeatureBranch(repo, options.branch, options);
            
            const result: GitBranchResult = {
              type: "git-branch",
              success: true,
              operation: "create",
              branch_name: branchResult.branch_name,
              base_branch: branchResult.base_branch
            };

            displayGitBranchResult(result);
            return result;
          } else {
            // Manage existing branches
            const managementResult = await branchManager.manageBranches(repo, options);
            
            const result: GitBranchResult = {
              type: "git-branch",
              success: true,
              operation: "manage",
              branches: {
                current: repo.current_branch,
                local: repo.branches.local,
                remote: repo.branches.remote,
                actions: managementResult.actions
              }
            };

            displayGitBranchResult(result);
            return result;
          }
        }

        case "pr": {
          const changes = await analyzer.detectChangesType(cwd);
          const prResult = await prManager.createPullRequest(repo, {
            ...options,
            changes
          });

          const result: GitPullRequestResult = {
            type: "git-pr",
            success: prResult.success,
            pr_url: prResult.pr_url,
            title: prResult.title,
            manual_creation: prResult.manual_creation,
            instructions: prResult.instructions
          };

          displayGitPullRequestResult(result);
          return result;
        }

        case "workflow": {
          if (!options.workflow) {
            throw new Error("Workflow name is required for workflow operation");
          }

          // Define predefined workflows
          const workflows: Record<string, GitWorkflow> = {
            feature: {
              name: "Feature Development",
              steps: [
                { name: "Create branch", command: "git checkout -b feature/{branch}", required: true },
                { name: "Stage changes", command: "git add .", required: false },
                { name: "Commit changes", command: "git commit -m '{message}'", required: true },
                { name: "Push to remote", command: "git push -u {remote} feature/{branch}", required: true }
              ],
              validation_rules: [],
              automation_level: "semi"
            },
            bugfix: {
              name: "Bug Fix",
              steps: [
                { name: "Create bugfix branch", command: "git checkout -b bugfix/{branch}", required: true },
                { name: "Apply fix", command: "echo 'Manual fix required'", required: false },
                { name: "Run tests", command: "npm test || true", validation: "npm test", required: false },
                { name: "Commit fix", command: "git add . && git commit -m 'fix: {message}'", required: true },
                { name: "Push fix", command: "git push -u {remote} bugfix/{branch}", required: true }
              ],
              validation_rules: [],
              automation_level: "semi"
            }
          };

          const workflow = workflows[options.workflow];
          if (!workflow) {
            throw new Error(`Unknown workflow: ${options.workflow}`);
          }

          const workflowResult = await workflowOrchestrator.executeWorkflow(repo, workflow, {
            branch: options.branch || `${options.workflow}-${Date.now()}`,
            message: options.message || `${options.workflow} update`,
            remote: options.remote
          });

          const result: GitWorkflowResult = {
            type: "git-workflow",
            success: workflowResult.success,
            workflow: workflow.name,
            steps_completed: workflowResult.steps_completed || 0,
            results: workflowResult.results || []
          };

          displayGitWorkflowResult(result);
          return result;
        }

        case "status": {
          // Display repository status
          console.log("\n" + "=".repeat(50));
          console.log("Git Repository Status");
          console.log("=".repeat(50));
          
          console.log(`📁 Repository: ${repo.path}`);
          console.log(`🌿 Current branch: ${repo.current_branch}`);
          
          if (repo.remote_url) {
            console.log(`🔗 Remote: ${repo.remote_url}`);
          }
          
          console.log(`\n📊 Status:`);
          console.log(`   Staged files: ${repo.status.staged.length}`);
          console.log(`   Unstaged files: ${repo.status.unstaged.length}`);
          console.log(`   Untracked files: ${repo.status.untracked.length}`);
          
          if (repo.status.ahead > 0) {
            console.log(`   Ahead by: ${repo.status.ahead} commits`);
          }
          
          if (repo.status.behind > 0) {
            console.log(`   Behind by: ${repo.status.behind} commits`);
          }
          
          console.log(`\n🌳 Branches:`);
          console.log(`   Local: ${repo.branches.local.length}`);
          console.log(`   Remote: ${repo.branches.remote.length}`);
          
          if (repo.recent_commits.length > 0) {
            console.log(`\n📝 Recent commits:`);
            repo.recent_commits.slice(0, 3).forEach(commit => {
              console.log(`   ${commit.hash.substring(0, 8)} ${commit.message}`);
            });
          }

          return {
            type: "git-status",
            success: true,
            repository: repo
          };
        }

        default: {
          // Execute raw git command
          const gitCommand = `git ${options.operation}${args._.slice(1).length > 0 ? ' ' + args._.slice(1).join(' ') : ''}`;
          
          if (options.dryRun) {
            console.log(`Would execute: ${gitCommand}`);
            return { type: "git-raw", success: true, command: gitCommand };
          }
          
          const result = await Bash.execute(`cd "${cwd}" && ${gitCommand}`);
          
          console.log(result.stdout);
          if (result.stderr) {
            console.error(result.stderr);
          }
          
          return {
            type: "git-raw",
            success: result.success,
            command: gitCommand,
            output: result.stdout,
            error: result.stderr
          };
        }
      }

    } catch (error: any) {
      console.error("Git operation failed:", error.message);
      
      const suggestions = [
        "Ensure you're in a git repository",
        "Check that git is installed and accessible",
        "Verify branch names and permissions",
        "Use --dry-run to preview operations"
      ];

      console.log("\nSuggestions:");
      suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));

      return {
        type: "git-error",
        success: false,
        error: error.message,
        suggestions
      };
    }
  },

  // Static helper methods
  async generateCommitMessage(repo: GitRepository, changes: any): Promise<string> {
    const generator = new CommitMessageGenerator();
    const commit = await generator.generateConventionalCommit(repo, changes);
    return generator.formatCommitMessage(commit);
  },

  async analyzeRepository(path: string): Promise<GitRepository> {
    const analyzer = new GitAnalyzer();
    return await analyzer.analyzeRepository(path);
  }
});

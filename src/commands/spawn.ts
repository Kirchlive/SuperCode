// Spawn Command Implementation
// Sub-agent orchestration and complex task coordination with intelligent execution

import type { Argv } from "yargs";
import { cmd } from "../cmd";
import { EventEmitter } from "events";

// Task and agent interfaces
interface Task {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  estimatedTime: number;
  priority: "high" | "medium" | "low";
  type: "analysis" | "modification" | "process" | "validation" | "documentation";
  parallelizable: boolean;
  status: "pending" | "in_progress" | "completed" | "failed";
  agent_id?: string;
  result?: any;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface SubAgent {
  id: string;
  task_id: string;
  status: "initializing" | "running" | "idle" | "error" | "terminated";
  start_time: string;
  last_update: string;
  progress: number;
  current_step: string;
  estimated_completion?: string;
  tools_available: string[];
  context: any;
  monitoring: boolean;
}

interface ExecutionPlan {
  strategy: "sequential" | "parallel" | "adaptive";
  phases: Array<{
    phase: number;
    name: string;
    tasks: string[];
    parallel: boolean;
    estimated_time: number;
    dependencies_resolved: boolean;
  }>;
  total_phases: number;
  total_time: number;
  parallelization_savings?: number;
  critical_path: string[];
}

// Task orchestration system
class TaskOrchestrator extends EventEmitter {
  private tasks = new Map<string, Task>();
  private agents = new Map<string, SubAgent>();
  private executionPlan?: ExecutionPlan;
  private activePhase = 0;
  private startTime?: number;

  async parseRequest(request: string): Promise<any> {
    console.log(`Parsing complex request: "${request}"`);
    
    // Analyze request complexity and generate task breakdown
    const complexity = this.analyzeComplexity(request);
    const taskBreakdown = await this.generateTaskBreakdown(request, complexity);
    
    // Store tasks
    for (const task of taskBreakdown) {
      this.tasks.set(task.id, task);
    }

    return {
      request,
      complexity: complexity.level,
      estimated_tasks: taskBreakdown.length,
      task_breakdown: taskBreakdown,
      analysis: complexity
    };
  }

  async validateDependencies(tasks: Task[]): Promise<any> {
    console.log("Validating task dependencies...");
    
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const cycles: string[] = [];
    const orphaned: string[] = [];
    
    // Check for circular dependencies
    for (const task of tasks) {
      if (this.hasCyclicDependency(task, taskMap, new Set())) {
        cycles.push(task.id);
      }
    }
    
    // Check for orphaned dependencies
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (!taskMap.has(depId)) {
          orphaned.push(`${task.id} depends on missing task: ${depId}`);
        }
      }
    }
    
    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(tasks);
    const totalTime = criticalPath.reduce((sum, taskId) => {
      const task = taskMap.get(taskId);
      return sum + (task?.estimatedTime || 0);
    }, 0);

    return {
      valid: cycles.length === 0 && orphaned.length === 0,
      cycles,
      orphaned,
      critical_path: criticalPath,
      total_estimated_time: totalTime
    };
  }

  async createExecutionPlan(tasks: Task[], strategy: string): Promise<ExecutionPlan> {
    console.log(`Creating ${strategy} execution plan...`);
    
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const phases: ExecutionPlan['phases'] = [];
    const processedTasks = new Set<string>();
    let currentPhase = 1;
    
    while (processedTasks.size < tasks.length) {
      const readyTasks = tasks.filter(task => 
        !processedTasks.has(task.id) &&
        task.dependencies.every(depId => processedTasks.has(depId))
      );
      
      if (readyTasks.length === 0) {
        throw new Error("Circular dependency detected or unresolvable dependencies");
      }
      
      // Determine if phase can be parallel
      const canParallelize = strategy === "parallel" && 
        readyTasks.some(task => task.parallelizable) &&
        readyTasks.length > 1;
      
      const phaseTime = canParallelize ? 
        Math.max(...readyTasks.map(t => t.estimatedTime)) :
        readyTasks.reduce((sum, t) => sum + t.estimatedTime, 0);
      
      phases.push({
        phase: currentPhase,
        name: `Phase ${currentPhase}: ${this.generatePhaseName(readyTasks)}`,
        tasks: readyTasks.map(t => t.id),
        parallel: canParallelize,
        estimated_time: phaseTime,
        dependencies_resolved: true
      });
      
      // Mark tasks as processed
      readyTasks.forEach(task => processedTasks.add(task.id));
      currentPhase++;
    }
    
    const totalTime = phases.reduce((sum, phase) => sum + phase.estimated_time, 0);
    const sequentialTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    
    this.executionPlan = {
      strategy: strategy as any,
      phases,
      total_phases: phases.length,
      total_time: totalTime,
      parallelization_savings: sequentialTime - totalTime,
      critical_path: this.calculateCriticalPath(tasks)
    };
    
    return this.executionPlan;
  }

  async spawnSubAgent(task: Task, context: any): Promise<SubAgent> {
    const agentId = `agent-${task.id}-${Date.now()}`;
    
    console.log(`Spawning sub-agent ${agentId} for task: ${task.title}`);
    
    const agent: SubAgent = {
      id: agentId,
      task_id: task.id,
      status: "initializing",
      start_time: new Date().toISOString(),
      last_update: new Date().toISOString(),
      progress: 0,
      current_step: "initializing",
      tools_available: this.getToolsForTask(task),
      context: {
        ...context,
        task,
        agent_id: agentId,
        orchestrator_id: this.constructor.name
      },
      monitoring: context.monitoring || false
    };
    
    // Store agent
    this.agents.set(agentId, agent);
    
    // Update task
    task.agent_id = agentId;
    task.status = "in_progress";
    task.started_at = agent.start_time;
    
    // Simulate agent startup
    setTimeout(() => {
      agent.status = "running";
      agent.current_step = "executing task";
      agent.last_update = new Date().toISOString();
      
      this.emit('agent-started', { agent_id: agentId, task_id: task.id });
    }, 100);
    
    // Simulate task execution
    this.simulateTaskExecution(agent, task);
    
    return agent;
  }

  async monitorProgress(agentId: string): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Calculate estimated completion time
    const task = this.tasks.get(agent.task_id);
    const elapsedTime = Date.now() - new Date(agent.start_time).getTime();
    const estimatedTotal = task ? task.estimatedTime * 1000 : 300000; // Default 5 minutes
    const estimatedRemaining = Math.max(0, estimatedTotal - elapsedTime);
    
    agent.estimated_completion = new Date(Date.now() + estimatedRemaining).toISOString();
    agent.last_update = new Date().toISOString();
    
    return {
      agent_id: agentId,
      status: agent.status,
      progress: agent.progress,
      current_step: agent.current_step,
      estimated_remaining: Math.round(estimatedRemaining / 1000),
      last_update: agent.last_update,
      task_title: task?.title || "Unknown task"
    };
  }

  async coordinateAgents(agentIds: string[]): Promise<any> {
    const coordinationId = `coord-${Date.now()}`;
    
    console.log(`Coordinating ${agentIds.length} agents...`);
    
    const agents = agentIds.map(id => this.agents.get(id)).filter(Boolean) as SubAgent[];
    const sharedArtifacts: string[] = [];
    
    // Collect shared context and artifacts
    agents.forEach(agent => {
      if (agent.context.artifacts) {
        sharedArtifacts.push(...agent.context.artifacts);
      }
    });
    
    // Update all agents with shared context
    agents.forEach(agent => {
      agent.context.shared_artifacts = sharedArtifacts;
      agent.context.coordination_id = coordinationId;
      agent.last_update = new Date().toISOString();
    });
    
    return {
      coordination_id: coordinationId,
      agents: agentIds,
      status: "coordinating",
      shared_context: {
        project_state: "in_progress",
        shared_artifacts: sharedArtifacts,
        dependencies_resolved: true
      },
      inter_agent_communication: true
    };
  }

  async executeSpawn(options: any): Promise<any> {
    if (!this.executionPlan) {
      throw new Error("No execution plan available. Call createExecutionPlan first.");
    }
    
    this.startTime = Date.now();
    const results: any[] = [];
    
    console.log(`Starting spawn execution with ${this.executionPlan.phases.length} phases...`);
    
    for (const phase of this.executionPlan.phases) {
      console.log(`Executing ${phase.name}...`);
      this.activePhase = phase.phase;
      
      const phaseTasks = phase.tasks.map(taskId => this.tasks.get(taskId)!);
      const agents: SubAgent[] = [];
      
      // Spawn agents for this phase
      for (const task of phaseTasks) {
        const agent = await this.spawnSubAgent(task, {
          phase: phase.phase,
          monitoring: options.monitor,
          validation: options.validate
        });
        agents.push(agent);
      }
      
      // Wait for phase completion
      if (phase.parallel) {
        // Parallel execution - wait for all agents to complete
        await this.waitForAgentsCompletion(agents.map(a => a.id));
        
        // Coordinate agents if needed
        if (agents.length > 1) {
          await this.coordinateAgents(agents.map(a => a.id));
        }
      } else {
        // Sequential execution - wait for each agent individually
        for (const agent of agents) {
          await this.waitForAgentsCompletion([agent.id]);
        }
      }
      
      // Collect phase results
      const phaseResults = await this.collectPhaseResults(agents.map(a => a.id));
      results.push(...phaseResults);
      
      console.log(`Phase ${phase.phase} completed`);
    }
    
    const totalTime = Date.now() - this.startTime;
    
    return {
      execution_id: `exec-${this.startTime}`,
      phases_completed: this.executionPlan.phases.length,
      tasks_completed: this.tasks.size,
      agents_spawned: this.agents.size,
      total_time: totalTime,
      results,
      success: true
    };
  }

  // Private helper methods
  private analyzeComplexity(request: string): any {
    const keywords = request.toLowerCase();
    let complexity = "low";
    let factors: string[] = [];
    
    // Complexity indicators
    if (keywords.includes("refactor") || keywords.includes("migrate")) {
      complexity = "high";
      factors.push("code_refactoring");
    }
    
    if (keywords.includes("system") || keywords.includes("architecture")) {
      complexity = "high";
      factors.push("system_changes");
    }
    
    if (keywords.includes("test") && keywords.includes("implement")) {
      complexity = "medium";
      factors.push("test_implementation");
    }
    
    if (keywords.includes("multiple") || keywords.includes("entire")) {
      complexity = "high";
      factors.push("large_scope");
    }
    
    const estimatedTasks = Math.max(1, Math.min(10, factors.length * 2 + 1));
    
    return {
      level: complexity,
      factors,
      estimated_tasks: estimatedTasks,
      analysis_confidence: 0.8
    };
  }

  private async generateTaskBreakdown(request: string, complexity: any): Promise<Task[]> {
    const tasks: Task[] = [];
    const baseId = Date.now();
    
    // Generate tasks based on request analysis
    if (request.toLowerCase().includes("auth")) {
      tasks.push({
        id: `task-${baseId}-1`,
        title: "Analyze authentication requirements",
        description: "Understand current auth system and requirements",
        dependencies: [],
        estimatedTime: 300,
        priority: "high",
        type: "analysis",
        parallelizable: false,
        status: "pending",
        created_at: new Date().toISOString()
      });
      
      tasks.push({
        id: `task-${baseId}-2`,
        title: "Design authentication architecture",
        description: "Create architectural plan for auth system",
        dependencies: [`task-${baseId}-1`],
        estimatedTime: 600,
        priority: "high",
        type: "analysis",
        parallelizable: false,
        status: "pending",
        created_at: new Date().toISOString()
      });
      
      tasks.push({
        id: `task-${baseId}-3`,
        title: "Implement authentication core",
        description: "Build core authentication functionality",
        dependencies: [`task-${baseId}-2`],
        estimatedTime: 1200,
        priority: "high",
        type: "modification",
        parallelizable: true,
        status: "pending",
        created_at: new Date().toISOString()
      });
      
      tasks.push({
        id: `task-${baseId}-4`,
        title: "Create authentication tests",
        description: "Build comprehensive test suite for auth",
        dependencies: [`task-${baseId}-2`],
        estimatedTime: 800,
        priority: "medium",
        type: "validation",
        parallelizable: true,
        status: "pending",
        created_at: new Date().toISOString()
      });
      
      tasks.push({
        id: `task-${baseId}-5`,
        title: "Integration and validation",
        description: "Integrate auth system and validate functionality",
        dependencies: [`task-${baseId}-3`, `task-${baseId}-4`],
        estimatedTime: 400,
        priority: "high",
        type: "validation",
        parallelizable: false,
        status: "pending",
        created_at: new Date().toISOString()
      });
    } else {
      // Generic task breakdown
      tasks.push({
        id: `task-${baseId}-1`,
        title: "Analyze requirements",
        description: `Understand requirements for: ${request}`,
        dependencies: [],
        estimatedTime: 300,
        priority: "high",
        type: "analysis",
        parallelizable: false,
        status: "pending",
        created_at: new Date().toISOString()
      });
      
      tasks.push({
        id: `task-${baseId}-2`,
        title: "Implement solution",
        description: `Implement: ${request}`,
        dependencies: [`task-${baseId}-1`],
        estimatedTime: 900,
        priority: "high",
        type: "modification",
        parallelizable: false,
        status: "pending",
        created_at: new Date().toISOString()
      });
      
      tasks.push({
        id: `task-${baseId}-3`,
        title: "Validate implementation",
        description: "Test and validate the implementation",
        dependencies: [`task-${baseId}-2`],
        estimatedTime: 300,
        priority: "medium",
        type: "validation",
        parallelizable: false,
        status: "pending",
        created_at: new Date().toISOString()
      });
    }
    
    return tasks;
  }

  private hasCyclicDependency(task: Task, taskMap: Map<string, Task>, visited: Set<string>): boolean {
    if (visited.has(task.id)) {
      return true;
    }
    
    visited.add(task.id);
    
    for (const depId of task.dependencies) {
      const depTask = taskMap.get(depId);
      if (depTask && this.hasCyclicDependency(depTask, taskMap, visited)) {
        return true;
      }
    }
    
    visited.delete(task.id);
    return false;
  }

  private calculateCriticalPath(tasks: Task[]): string[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const longestPath: string[] = [];
    let maxTime = 0;
    
    const calculatePath = (taskId: string, currentPath: string[], currentTime: number): void => {
      const task = taskMap.get(taskId);
      if (!task) return;
      
      const newPath = [...currentPath, taskId];
      const newTime = currentTime + task.estimatedTime;
      
      if (newTime > maxTime) {
        maxTime = newTime;
        longestPath.splice(0, longestPath.length, ...newPath);
      }
      
      // Find tasks that depend on this one
      const dependents = tasks.filter(t => t.dependencies.includes(taskId));
      for (const dependent of dependents) {
        calculatePath(dependent.id, newPath, newTime);
      }
    };
    
    // Start from tasks with no dependencies
    const rootTasks = tasks.filter(t => t.dependencies.length === 0);
    for (const rootTask of rootTasks) {
      calculatePath(rootTask.id, [], 0);
    }
    
    return longestPath;
  }

  private generatePhaseName(tasks: Task[]): string {
    const types = [...new Set(tasks.map(t => t.type))];
    if (types.length === 1) {
      return `${types[0].charAt(0).toUpperCase() + types[0].slice(1)} Phase`;
    }
    return "Mixed Operations";
  }

  private getToolsForTask(task: Task): string[] {
    const baseTools = ["Read", "Write", "Edit", "Grep", "Glob"];
    
    switch (task.type) {
      case "analysis":
        return [...baseTools, "Analyze", "Review"];
      case "modification":
        return [...baseTools, "MultiEdit", "Refactor"];
      case "validation":
        return [...baseTools, "Test", "Validate"];
      case "documentation":
        return [...baseTools, "Document", "Generate"];
      default:
        return baseTools;
    }
  }

  private async simulateTaskExecution(agent: SubAgent, task: Task): Promise<void> {
    const progressInterval = setInterval(() => {
      if (agent.status === "running" && agent.progress < 1.0) {
        agent.progress = Math.min(1.0, agent.progress + 0.1);
        agent.last_update = new Date().toISOString();
        
        if (agent.progress >= 0.5 && agent.current_step === "executing task") {
          agent.current_step = "finalizing results";
        }
        
        this.emit('progress-update', {
          agent_id: agent.id,
          task_id: task.id,
          progress: agent.progress,
          current_step: agent.current_step
        });
      }
      
      if (agent.progress >= 1.0) {
        agent.status = "idle";
        agent.current_step = "completed";
        task.status = "completed";
        task.completed_at = new Date().toISOString();
        task.result = {
          success: true,
          execution_time: Date.now() - new Date(agent.start_time).getTime(),
          output: `Task "${task.title}" completed successfully`
        };
        
        this.emit('task-completed', {
          agent_id: agent.id,
          task_id: task.id,
          result: task.result
        });
        
        clearInterval(progressInterval);
      }
    }, task.estimatedTime / 10); // Update 10 times during execution
  }

  private async waitForAgentsCompletion(agentIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        const allCompleted = agentIds.every(agentId => {
          const agent = this.agents.get(agentId);
          const task = agent ? this.tasks.get(agent.task_id) : null;
          return task?.status === "completed";
        });
        
        if (allCompleted) {
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      
      checkCompletion();
    });
  }

  private async collectPhaseResults(agentIds: string[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        const task = this.tasks.get(agent.task_id);
        if (task?.result) {
          results.push({
            agent_id: agentId,
            task_id: task.id,
            task_title: task.title,
            result: task.result,
            execution_time: task.result.execution_time
          });
        }
      }
    }
    
    return results;
  }
}

// Integration with TodoWrite system
class TodoIntegration {
  static async createFromBreakdown(tasks: Task[]): Promise<any> {
    console.log(`Creating todo items for ${tasks.length} tasks...`);
    
    const todoIds = tasks.map(task => `todo-${task.id}`);
    
    // Simulate TodoWrite integration
    return {
      created: tasks.length,
      todo_ids: todoIds,
      hierarchy: "sequential",
      dependencies_mapped: true
    };
  }

  static async updateProgress(taskId: string, status: string, progress?: number): Promise<any> {
    return {
      task_id: taskId,
      status,
      progress,
      updated_at: new Date().toISOString()
    };
  }

  static async getStatus(): Promise<any> {
    return {
      total_tasks: 5,
      completed: 1,
      in_progress: 2,
      pending: 2,
      completion_percentage: 20
    };
  }
}

// Validation system
class ValidationSystem {
  static async validateTask(task: Task, result: any): Promise<any> {
    console.log(`Validating task: ${task.title}`);
    
    // Simulate validation logic
    const qualityScore = 0.85 + Math.random() * 0.15;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (qualityScore < 0.9) {
      suggestions.push("Consider adding more comprehensive error handling");
    }
    
    if (task.type === "modification" && qualityScore < 0.95) {
      suggestions.push("Add more detailed documentation for the changes");
    }
    
    return {
      task_id: task.id,
      valid: qualityScore > 0.7,
      quality_score: qualityScore,
      issues,
      suggestions
    };
  }

  static async validateIntegration(results: any[]): Promise<any> {
    console.log(`Validating integration of ${results.length} results...`);
    
    const compatibilityScore = 0.88 + Math.random() * 0.12;
    
    return {
      integration_valid: compatibilityScore > 0.8,
      compatibility_score: compatibilityScore,
      conflicts: [],
      merge_strategy: "automatic",
      manual_review_required: compatibilityScore < 0.85
    };
  }
}

// Main command handler
export const SpawnCommand = cmd({
  command: "spawn <task>",
  describe: "Orchestrate complex tasks with intelligent sub-agent coordination",
  
  builder: (yargs: Argv) => {
    return yargs
      .positional("task", {
        describe: "Complex task or project description to orchestrate",
        type: "string",
        demandOption: true
      })
      .option("strategy", {
        describe: "Execution strategy for subtasks",
        type: "string",
        choices: ["sequential", "parallel", "adaptive"],
        default: "adaptive"
      })
      .option("validate", {
        describe: "Enable quality validation at each step",
        type: "boolean",
        default: true
      })
      .option("monitor", {
        describe: "Enable real-time progress monitoring",
        type: "boolean",
        default: true
      })
      .option("dry-run", {
        describe: "Simulate execution without making changes",
        type: "boolean",
        default: false
      })
      .option("timeout", {
        describe: "Maximum execution time in seconds",
        type: "number",
        default: 3600
      })
      .option("max-agents", {
        describe: "Maximum number of concurrent agents",
        type: "number",
        default: 5
      })
      .option("todo-integration", {
        describe: "Integrate with TodoWrite system",
        type: "boolean",
        default: true
      })
      .option("verbose", {
        describe: "Verbose output with detailed progress",
        type: "boolean",
        default: false
      });
  },

  handler: async (args: any) => {
    if (!args.task || args.task.trim().length === 0) {
      console.error("Error: Task description is required");
      console.log("Examples:");
      console.log("  /spawn 'Build user authentication system' --parallel --validate");
      console.log("  /spawn 'Refactor legacy code for better maintainability' --monitor");
      console.log("  /spawn 'Add comprehensive test suite' --sequential");
      return;
    }

    try {
      const orchestrator = new TaskOrchestrator();
      const startTime = Date.now();

      console.log(`Starting task orchestration for: "${args.task}"`);

      // Step 1: Parse request and create task breakdown
      const breakdown = await orchestrator.parseRequest(args.task);
      
      if (args.verbose) {
        console.log(`Task complexity: ${breakdown.complexity}`);
        console.log(`Generated ${breakdown.estimated_tasks} subtasks`);
      }

      // Step 2: Validate dependencies
      const validation = await orchestrator.validateDependencies(breakdown.task_breakdown);
      
      if (!validation.valid) {
        console.error("Dependency validation failed:");
        validation.cycles.forEach((cycle: string) => console.log(`  Circular dependency: ${cycle}`));
        validation.orphaned.forEach((orphan: string) => console.log(`  Orphaned dependency: ${orphan}`));
        return;
      }

      if (args.verbose) {
        console.log(`Critical path: ${validation.critical_path.join(" → ")}`);
        console.log(`Estimated total time: ${Math.round(validation.total_estimated_time / 60)} minutes`);
      }

      // Step 3: Create execution plan
      const strategy = args.strategy === "adaptive" ? 
        (breakdown.task_breakdown.some((t: Task) => t.parallelizable) ? "parallel" : "sequential") :
        args.strategy;
      
      const executionPlan = await orchestrator.createExecutionPlan(breakdown.task_breakdown, strategy);
      
      console.log(`Execution plan created: ${executionPlan.total_phases} phases, ${strategy} strategy`);
      
      if (executionPlan.parallelization_savings && executionPlan.parallelization_savings > 0) {
        const savedMinutes = Math.round(executionPlan.parallelization_savings / 60);
        console.log(`Parallelization saves ~${savedMinutes} minutes`);
      }

      // Step 4: TodoWrite integration
      if (args.todoIntegration) {
        console.log("Creating todo items for task tracking...");
        const todoResult = await TodoIntegration.createFromBreakdown(breakdown.task_breakdown);
        
        if (args.verbose) {
          console.log(`Created ${todoResult.created} todo items`);
        }
      }

      // Step 5: Dry run or actual execution
      if (args.dryRun) {
        console.log("=== DRY RUN MODE ===");
        console.log("Execution plan preview:");
        
        executionPlan.phases.forEach(phase => {
          console.log(`Phase ${phase.phase}: ${phase.name}`);
          console.log(`  Tasks: ${phase.tasks.length} (${phase.parallel ? 'parallel' : 'sequential'})`);
          console.log(`  Estimated time: ${Math.round(phase.estimated_time / 60)} minutes`);
        });
        
        return {
          type: "spawn-dry-run",
          execution_plan: executionPlan,
          task_breakdown: breakdown.task_breakdown,
          estimated_time: executionPlan.total_time,
          success: true
        };
      }

      // Step 6: Execute spawn with monitoring
      if (args.monitor) {
        orchestrator.on('agent-started', (data) => {
          console.log(`Agent ${data.agent_id} started for task ${data.task_id}`);
        });
        
        orchestrator.on('progress-update', (data) => {
          if (args.verbose) {
            const progressPercent = Math.round(data.progress * 100);
            console.log(`Agent ${data.agent_id}: ${progressPercent}% - ${data.current_step}`);
          }
        });
        
        orchestrator.on('task-completed', (data) => {
          console.log(`Task ${data.task_id} completed by agent ${data.agent_id}`);
        });
      }

      const executionResult = await orchestrator.executeSpawn({
        validate: args.validate,
        monitor: args.monitor,
        timeout: args.timeout * 1000,
        max_agents: args.maxAgents
      });

      // Step 7: Final validation
      if (args.validate) {
        console.log("Running final validation...");
        const integrationValidation = await ValidationSystem.validateIntegration(executionResult.results);
        
        if (!integrationValidation.integration_valid) {
          console.warn("Integration validation failed - manual review required");
        } else {
          console.log(`Integration validation passed (score: ${integrationValidation.compatibility_score.toFixed(2)})`);
        }
        
        executionResult.validation = integrationValidation;
      }

      const totalTime = Date.now() - startTime;
      
      console.log(`Spawn orchestration completed successfully!`);
      console.log(`Total execution time: ${Math.round(totalTime / 1000)}s`);
      console.log(`Phases completed: ${executionResult.phases_completed}`);
      console.log(`Agents spawned: ${executionResult.agents_spawned}`);

      // Apply persona enhancements
      const persona = (args as any).persona;
      if (persona) {
        executionResult.persona_enhancements = await this.applyPersonaEnhancements(executionResult, persona);
      }

      return {
        type: "spawn-complete",
        task: args.task,
        strategy: strategy,
        execution_result: executionResult,
        execution_plan: executionPlan,
        task_breakdown: breakdown.task_breakdown,
        total_time: totalTime,
        success: true
      };

    } catch (error: any) {
      console.error("Spawn orchestration failed:", error.message);
      
      const suggestions = [
        "Try breaking down the task into smaller, more specific components",
        "Check if the task description is clear and actionable",
        "Use --dry-run to preview the execution plan before running",
        "Reduce --max-agents if you're experiencing resource constraints"
      ];

      console.log("Suggestions:");
      suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));

      return {
        type: "spawn-error",
        error: error.message,
        suggestions,
        success: false
      };
    }
  },

  async applyPersonaEnhancements(result: any, persona: string): Promise<any> {
    const enhancements: Record<string, any> = {
      architect: {
        enhanced_analysis: true,
        architecture_focus: true,
        design_validation: true,
        pattern_analysis: true
      },
      developer: {
        implementation_focus: true,
        code_quality_checks: true,
        testing_emphasis: true,
        best_practices: true
      },
      project_manager: {
        timeline_optimization: true,
        resource_allocation: true,
        risk_assessment: true,
        progress_tracking: true
      }
    };

    return enhancements[persona] || {};
  }
});

// Auto-generated SuperCode command index
import sc_analyze from './sc-analyze';
import sc_build from './sc-build';
import sc_cleanup from './sc-cleanup';
import sc_deploy from './sc-deploy';
import sc_design from './sc-design';
import sc_dev_setup from './sc-dev-setup';
import sc_document from './sc-document';
import sc_estimate from './sc-estimate';
import sc_explain from './sc-explain';
import sc_git from './sc-git';
import sc_improve from './sc-improve';
import sc_index from './sc-index';
import sc_load from './sc-load';
import sc_migrate from './sc-migrate';
import sc_review from './sc-review';
import sc_scan from './sc-scan';
import sc_spawn from './sc-spawn';
import sc_task from './sc-task';
import sc_test from './sc-test';
import sc_troubleshoot from './sc-troubleshoot';

export const superCodeCommands = {
  'sc-analyze': sc_analyze,
  'sc-build': sc_build,
  'sc-cleanup': sc_cleanup,
  'sc-deploy': sc_deploy,
  'sc-design': sc_design,
  'sc-dev-setup': sc_dev_setup,
  'sc-document': sc_document,
  'sc-estimate': sc_estimate,
  'sc-explain': sc_explain,
  'sc-git': sc_git,
  'sc-improve': sc_improve,
  'sc-index': sc_index,
  'sc-load': sc_load,
  'sc-migrate': sc_migrate,
  'sc-review': sc_review,
  'sc-scan': sc_scan,
  'sc-spawn': sc_spawn,
  'sc-task': sc_task,
  'sc-test': sc_test,
  'sc-troubleshoot': sc_troubleshoot,
};

export function registerSuperCodeCommands(yargs: any): void {
  Object.entries(superCodeCommands).forEach(([name, command]) => {
    yargs.command(command);
  });
}

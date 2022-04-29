import config from './config.mjs';
import path from 'path';
import commands from './commands/index.mjs';
import vorpal from 'vorpal';
import chalk from 'chalk';
import log from './log.mjs';
import { VERSION } from './constants.mjs';
import merge from 'lodash.merge';
import gh from './handlers/gh.mjs';
import git from './handlers/git.mjs';

const session = vorpal();

const run = async (events, options) => {
  log.blank(chalk.bold(`automation v${ VERSION }`));

  // SETUP CONFIG
  let configuration = await config.resolve(
      path.resolve('./'),
      options.config || './.automation'
  );

  // CHECK REQUIREMENTS
  const isRepository = await git.isRepository();

  if(!isRepository) {
    log.error('no git repository found');
    process.exit(1);
  }

  const branches = await git.branch.fetch();
  const missingBranches = configuration.branches
    .filter(branch => branch.ref === 'development' || branch.ref === 'main')
    .map(current => branches.includes(current.name) ? null : current.name)
    .filter(current => current ? current.length > 0 : false);

  if(missingBranches.length > 0) {
    for(let branch of missingBranches) {
      log.error(`missing branch '${chalk.bold(branch)}'`);
    }

    process.exit(1);
  }

  const fetched = await gh.fetch(configuration, { isLogging: false });
  configuration = merge(configuration, fetched);

  if(!(await git.remote.list()).includes(configuration.remote)) {
    await git.remote.add(configuration.remote, configuration.url);
    log.info(`set remote '${chalk.bold(configuration.remote)}'`);
  }

  configuration = merge(configuration, await git.branch.update(configuration));

  await git.branch.set(configuration.branch.name);

  await config.save(path.join(configuration.base, configuration.config), configuration, {
    isLogging: false
  });

  const handler = (command) => {
    return function (args, callback) {
      const self = this;

      commands[command]({
        callback: (update) => {
          if(update ? typeof update === 'object' : false) {
            configuration = update;
          }

          callback();
        },

        configuration,
        session,
        args,
        events,
        self
      });
    };
  };

  session
    .command('clear')
    .description('clear screen')
    .action((_, callback) => {
      console.clear();
      callback();
    });

  session
    .command('init')
    .alias('i')
    .description('setup project')
    .action(handler('init'));

  session
    .command('fetch')
    .alias('f')
    .description('fetch repository')
    .action(handler('update'));

  session
    .command('create')
    .alias('cr')
    .description('create new issue')
    .action(handler('create'));

  session
    .command('list [types...]')
    .alias('l')
    .autocomplete([ 'issues', 'labels', 'commits' ])
    .option('-c, --count <number>', 'number of rows')
    .description('list selected type')
    .action(handler('list'));

  session
    .command('select <issue>')
    .alias('s')
    .description('select an issue')
    .action(handler('select'));

  session
    .command('expand [issue]')
    .alias('e')
    .description('show more information')
    .action(handler('expand'));

  session
    .command('commit')
    .alias('c')
    .description('create commit')
    .action(handler('commit'));

  session
    .command('merge')
    .alias('m')
    .description('merge branch')
    .action(handler('merge'));

  session
    .command('release')
    .alias('r')
    .description('tag release')
    .action(handler('release'));

  session
    .delimiter(`${ chalk.bold.blue(configuration.repository) }${ configuration.issue > -1 ? chalk.bold.yellow(` #${ configuration.issue }`) : '' } ➜ `)
    .show();
};

export default run;
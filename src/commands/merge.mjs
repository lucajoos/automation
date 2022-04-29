import inquirer from 'inquirer';
import chalk from 'chalk';
import git from '../handlers/git.mjs';
import gh from '../handlers/gh.mjs';
import log from '../log.mjs';
import config from '../config.mjs';
import helpers from '../helpers/index.mjs';
import _merge from 'lodash.merge';

const merge = async ({configuration, session, callback}) => {
  const base = configuration.branches.find(
      branch => branch.ref === 'development');
  const branch = configuration.branch;
  const issue = configuration.issues.find(
      issue => issue.number === configuration.issue);

  inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `merge ${ chalk.yellow.bold(
          `#${ issue.number }`) } into '${ chalk.bold(base.name) }'?`,
    }]).then(async ({confirm = false}) => {
    if (!confirm) {
      callback(configuration);
      return;
    }

    let update = configuration;
    update.commits = [];

    await git.synchronize('pull', configuration.remote, base.name, ['--rebase']);
    await git.synchronize('pull', configuration.remote, branch.name, ['--rebase']);

    await git.synchronize('push', configuration.remote, base.name);
    await git.synchronize('push', configuration.remote, branch.name);

    await gh.pr.create(configuration, {
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
      base: base.name,
      branch: branch.name,
    });

    log.info('created pr');

    const pr = (await gh.pr.fetch(configuration)).find(pr => pr.title === issue.title && pr.branch === branch.name);

    if(!pr) {
      log.warn('could not merge');
      callback(configuration);
      return;
    }

    await gh.pr.merge(configuration, pr.number, ['--merge', '--delete-branch',]);
    log.info(`merged pr ${chalk.yellow.bold(`#${pr.number}`)}`);

    await gh.issues.close(configuration, issue.number, [`--comment Merged #${ pr.number }`]);
    log.info(`closed issue`);

    delete update.commits[branch.name];

    update.branches.splice(update.branches.indexOf(update.branches.find(current => current.id === branch.id)), 1);
    update.issues.splice(update.issues.indexOf(update.issues.find(current => current.number === issue.number)), 1);
    update.issue = -1;

    await git.branch.set(base.name);

    update = _merge(update, await git.branch.update(update));
    await config.save(configuration.path, update, {isLogging: false});

    helpers.cli.delimiter(update, session);

    callback(update);
  });
};

export default merge;
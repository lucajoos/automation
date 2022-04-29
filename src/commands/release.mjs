import inquirer from 'inquirer';
import helpers from '../helpers/index.mjs';
import gh from '../handlers/gh.mjs';
import git from '../handlers/git.mjs';
import log from '../log.mjs';
import chalk from 'chalk';

const release = async ({configuration, callback}) => {
  inquirer.prompt([
    {
      type: 'input',
      name: 'tag',
      message: 'tag',
    }]).then(async ({tag = ''}) => {
    if (!helpers.general.check({tag})) {
      callback(configuration);
      return;
    }

    const base = configuration.branches.find(
        branch => branch.ref === 'main');
    const branch = configuration.branches.find(
        branch => branch.ref === 'development');
    const label = configuration.labels.find(
        current => current.label === 'ignore');

    await git.synchronize('push', configuration.remote, base.name);
    await git.synchronize('push', configuration.remote, branch.name);

    await git.branch.set(branch.name);

    console.log(await git.branch.current())
    console.log(branch)

    await gh.pr.create(configuration, {
      title: `Release ${ tag }`,
      body: '',
      labels: label ? ['ignore'] : [],
      base: base.name,
      branch: branch.name,
    });

    log.info('created pr');

    console.log(await gh.pr.fetch(configuration));

    const pr = (await gh.pr.fetch(configuration)).find(pr => pr.title === `Release ${ tag }` && pr.branch === branch.name);
    await gh.pr.merge(configuration, pr.number, ['--merge',]);

    log.info(`merged pr ${chalk.yellow.bold(`#${pr.number}`)}`);

    await git.synchronize('pull', configuration.remote, base.name);

    await git.branch.set(base.name);
    await git.tag(tag);

    await git.synchronize('push', configuration.remote, base.name, ['--tags']);
  });
};

export default release;
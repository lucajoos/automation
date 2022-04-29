import helpers from '../helpers/index.mjs';
import log from '../log.mjs';
import chalk from 'chalk';
import config from '../config.mjs';
import inquirer from 'inquirer';

const create = async ({ configuration, self, callback, session }) => (
  inquirer
    .prompt([ {
      type: 'input',
      name: 'title',
      message: 'title'
    }, {
      type: 'input',
      name: 'body',
      message: 'body'
    }, {
      type: 'checkbox',
      name: 'labels',
      message: 'labels',
      choices: configuration.labels.map(label => label.label)
    } ])
    .then(async ({ title = '', body = '', labels = [] }) => {
      if(!helpers.general.check({ title })) {
        callback(configuration);
        return;
      }

      const { stdout: raw } = await helpers.commands.execute(`gh issue create --title "${ title }" --body "${ body }" ${ labels.map(label => `--label "${ label }"`).join(' ') } --repo ${ configuration.repository }`);
      const number = parseInt(raw.split('/').at(-1));

      log.info(`created issue ${ chalk.bold.yellow(`#${ number.toString() }`) }`);

      const update = configuration;
      update.issues.push({
        number: number,
        title,
        status: 'OPEN',
        body,
        labels,
        timestamp: (new Date()).toString()
      });

      update.issue = number;

      helpers.cli.delimiter(update, session);
      await config.save(configuration.path, update, { isLogging: false });

      callback(update);
    })
);

export default create;
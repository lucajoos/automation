import inquirer from 'inquirer';
import git from '../handlers/git.mjs';
import helpers from '../helpers/index.mjs';
import config from '../config.mjs';
import log from '../log.mjs';

const commit = async ({configuration, callback}) => {
  inquirer.prompt([
    {
      type: 'input',
      name: 'files',
      message: 'files',
    }, {
      type: 'list',
      name: 'label',
      message: 'label',
      choices: configuration.labels.map(label => label.label),
    }, {
      type: 'input',
      name: 'scope',
      message: 'scope',
    }, {
      type: 'input',
      name: 'message',
      message: 'message',
    }, {
      type: 'input',
      name: 'body',
      message: 'body',
    }]).
      then(async ({
        files = '',
        message = '',
        label = '',
        scope = '',
        body = '',
      }) => {
        if (!helpers.general.check({message})) {
          callback(configuration);
          return;
        }

        await git.add(files.length > 0 ? files : '.');

        if (files.length === 0) {
          log.info('committed all files');
        }

        const update = configuration;
        const commit = {files, message, label, scope, body};

        await git.commit(commit);

        git.synchronize('push', configuration.remote,
            configuration.branch.name);

        if (!Array.isArray(update.commits[configuration.branch.name])) {
          update.commits[configuration.branch.name] = [];
        }

        update.commits[configuration.branch.name].push(commit);

        callback(update);
      });
};

export default commit;
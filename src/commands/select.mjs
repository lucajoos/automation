import inquirer from 'inquirer';
import log from '../log.mjs';
import merge from 'lodash.merge';
import config from '../config.mjs';
import helpers from '../helpers/index.mjs';
import git from '../handlers/git.mjs';

const select = async ({ configuration, session, args, callback }) => {
  let issue = (args.issue || '').toString();

  if(issue ? issue.length === 0 : true) {
    const answers = await inquirer
      .prompt([ {
        type: 'input',
        name: 'issue',
        message: 'issue'
      } ]);

    if(answers.issue ? answers.issue.length === 0 : true) {
      log.warn('no issue provided');
      callback();
      return;
    }

    issue = answers.issue;
  }

  if(issue.startsWith('#')) {
    issue = issue.slice(1);
  }

  issue = parseInt(issue);

  if(!configuration.issues.map(issue => issue.number).includes(issue)) {
    log.warn('issue does not exists');
    callback();
    return;
  }

  let update = merge(configuration, {
    issue
  });

  update = merge(update, await git.branch.update(update));

  helpers.cli.delimiter(update, session);
  callback(update);
};

export default select;
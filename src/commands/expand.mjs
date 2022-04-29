import chalk from 'chalk';
import moment from 'moment';
import log from '../log.mjs';

const expand = async ({ configuration, args, callback }) => {
  let issue = args.issue || configuration.issue;

  if(issue ? typeof issue !== 'number' : true) {
    console.error('no issue specified');
    callback();
    return;
  }


  const current = configuration.issues.find(i => i.number === issue);

  log.blank(`${ chalk.yellow.bold(`issue #${ current.number }`) }: ${ chalk.bold(current.title) }`);

  if(current.body ? current.body.length > 0 : false) {
    log.blank(`${ current.body }`);
  }

  if(current.labels ? current.labels.filter(label => label ? label.length > 0 : false).length > 0 : false) {
    log.blank(`labels: ${ chalk.cyan(current.labels.join(', ')) }`);
  }

  log.blank(`created ${ moment(current.timestamp).fromNow() }`);
};

export default expand;
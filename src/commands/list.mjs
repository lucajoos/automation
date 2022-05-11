import log from '../log.mjs';
import gh from '../handlers/gh.mjs';
import chalk from 'chalk';

const list = async ({ configuration, args, callback }) => {
  let types = args.types || [];
  let unresolved = [];

  if(types.length === 0) {
    types = [ 'issues', 'labels', 'commits' ];
  }

  const options = {
    selection: configuration.issue,
    count: args.options.count || 10,
    page: args.options.page || 1
  };

  if(options.page < 1) {
    log.error('page option must be greater than 0');
    return;
  }

  for(const type of types) {
    if(/^(i)(ssue(s)?)?/.test(type)) {
      log.blank(`${ chalk.bold('ISSUES') }:`);
      gh.issues.list(configuration.issues, options);
    } else if(/^(l)(abel(s)?)?/.test(type)) {
      log.blank(`${ chalk.bold('LABELS') }:`);
      gh.labels.list(configuration.labels, options);
    } else if(/^(c)(ommit(s)?)?/.test(type)) {
      //log.blank(`${chalk.bold('COMMITS')}:`);
      //console.log(configuration.commits);
    } else {
      unresolved.push(type);
    }
  }

  if(unresolved.length > 0) {
    unresolved.forEach(type => {
      log.error(`unresolved type '${ chalk.bold(type) }'`);
    });
  }

  callback(configuration);
};

export default list;

import chalk from 'chalk';

const cli = {
  delimiter: (configuration, session) => {
    session
      .delimiter(`${ chalk.bold.blue(configuration.repository) }${ configuration.issue > -1 ? chalk.bold.yellow(` #${ configuration.issue }`) : '' } ➜ `);
  },
};

export default cli;
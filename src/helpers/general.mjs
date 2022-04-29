import chalk from 'chalk';
import log from '../log.mjs';

const general = {
  check: (variables, isLogging=true) => {
    if (typeof variables !== 'object') {
      log.error(
          `field '${ chalk.bold('variables') }' must be of type 'object'`);
      return false;
    }

    const unspecified = [];

    Object.keys(variables).forEach((key) => {
      const value = variables[key];

      if (value ? value.length === 0 : true) {
        unspecified.push(key);
      }
    });

    if (unspecified.length > 0 && isLogging) {
      for (const key of unspecified) {
        log.error(`field '${ chalk.bold(key) }' unspecified`);
      }
    }

    return unspecified.length === 0;
  },
};

export default general;
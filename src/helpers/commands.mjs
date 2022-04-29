import commandExists from 'command-exists';
import { exec } from 'child_process';

const commands = {
  exists: (...commands) => {
    return new Promise(async (resolve) => {
      const notFound = [];

      for(const command of commands) {
        try {
          if(!await commandExists(command)) {
            notFound.push(command);
          }
        } catch(_) {
          notFound.push(command);
        }
      }

      resolve(notFound);
    });
  },

  flags: (flags=[]) => {
    return flags.length > 0 ? ` ${flags.join(' ')}` : '';
  },

  execute: (command) => new Promise((resolve) => {
    exec(command, (stderr, stdout) => {
      resolve({ stderr, stdout });
    });
  }),
};

export default commands;
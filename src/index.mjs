#! /usr/bin/env node

import helpers from './helpers/index.mjs';
import log from './log.mjs';
import chalk from 'chalk';
import gh from './handlers/gh.mjs';
import { Command } from 'commander';
import { DESCRIPTION, VERSION } from './constants.mjs';
import onceupon from 'onceupon.js';
import * as readline from 'readline';
import run from './run.mjs';

helpers.commands.exists('git', 'gh').then(async missingCommands => {
  missingCommands.forEach(command => {
    log.error(`could not find '${ chalk.bold(command) }' command`);
  });

  if(missingCommands.length > 0) {
    process.exit(1);
  }

  const events = onceupon();
  const program = new Command();

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', (...args) => events.fire('keypress', ...args));

  program
    .name('automation')
    .description(DESCRIPTION)
    .version(VERSION)
    .option('-c, --config <file>', 'path to config file')
    .action(async () => await run(events, {}));

  program.parse();
});
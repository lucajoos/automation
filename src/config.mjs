import fs from 'fs';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import inquirer from 'inquirer';
import log from './log.mjs';
import path from 'path';
import { VERSION } from './constants.mjs';
import { v4 as uuid } from 'uuid';

const TEMPLATE = {
  repository: '',
  url: '',
  version: VERSION,
  issue: -1,
  branch: '',
  issues: [],
  labels: [],
  remote: 'origin',
  branches: [{
    ref: 'main',
    name: 'main',
    id: uuid(),
  }, {
    ref: 'development',
    name: 'develop',
    id: uuid(),
  },],
  commits: {},
  base: '',
  config: '',
};

const config = {
  resolve: async (base, file) => (
    new Promise((resolve) => {
      fs.promises.access(path.join(base, file), fs.constants.F_OK)
        .then(async () => {
          try {
            const result = JSON.parse(await fs.promises.readFile(file, { encoding: 'utf8' }));
            resolve(result);
          } catch(e) {
            log.error(`config parsing error: ${ e.message }`);
            process.exit(1);
          }
        })
        .catch(async () => {
          const result = await config.init(base, file);
          await config.save(path.join(base, file), result, { isLogging: false });
          resolve(result);
        });
    })
  ),

  save: async (location, { version, repository, remote, base, config, path, branches }, { isLogging = true }) => {
    await fs.promises.writeFile(location, JSON.stringify({
      version, repository, remote, base, config, path, branches: branches.filter(branch => branch.ref === 'development' || branch.ref === 'main')
    }, null, 2), { encoding: 'utf8' });

    if(isLogging) {
      log.info('saved configuration');
    }
  },

  init: async (base, file, options = {}) => (
    new Promise((resolve) => {
      inquirer
        .prompt([{
          type: 'input',
          name: 'repository',
          message: 'repository',
        }])
        .then(async (answers) => {
          let branches = {};

          const configuration = merge(cloneDeep(TEMPLATE), { branches, path: path.join(base, file), base, config: file }, options, {
            url: answers.repository,
            repository: answers.repository.split('/').slice(-2).join('/')
          });

          resolve(configuration);
        })
        .catch((e) => {
          log.error(e);
        });
    })
  )
};

export default config;
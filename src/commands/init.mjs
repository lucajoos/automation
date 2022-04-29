import config from '../config.mjs';
import helpers from '../helpers/index.mjs';
import merge from 'lodash.merge';
import gh from '../handlers/gh.mjs';
import path from 'path';

const init = async ({ configuration, args, session, callback }) => {
  const base = await config.init(configuration.base, args.options.file ? args.options.file : configuration.config, { repository: args.repository || '' });
  const update = merge(base, await gh.fetch(base, { isLogging: true }));

  await config.save(path.join(configuration.base, configuration.config), update, {
    isLogging: true
  });

  helpers.cli.delimiter(update, session);
  callback(update);
};

export default init;
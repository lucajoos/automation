import gh from '../handlers/gh.mjs';
import merge from 'lodash.merge';
import config from '../config.mjs';

const fetch = async ({ configuration, callback }) => {
  const update = merge(configuration, {
    ...await gh.fetch(configuration, { isLogging: true })
  });

  callback(update);
};

export default fetch;
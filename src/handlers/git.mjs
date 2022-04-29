import helpers from '../helpers/index.mjs';
import gh from './gh.mjs';
import { v4 as uuid} from 'uuid';

const git = {
  init: async (flags=[],) => {
    return await helpers.commands.execute(`git init${helpers.commands.flags(flags)}`);
  },

  remote: {
    add: async (name, url, flags=[],) => {
      if(!helpers.general.check({ name, url })) {
        return;
      }

      return await helpers.commands.execute(`git remote add${helpers.commands.flags(flags)} ${name} ${url}`);
    },

    list: async () => {
      const { stdout: raw } = await helpers.commands.execute('git remote');
      return raw.split('\n').map(remote => remote.trim()).filter(remote => remote ? remote.length > 0 : false);
    }
  },

  commit: async ({ message, label='', scope='', body=''}, flags=[],) => {
    if(!helpers.general.check({ message })) {
      return;
    }

    return await helpers.commands.execute(`git commit${helpers.commands.flags(flags)} -m "${label.length > 0 ? `${label}` : ''}${scope.length > 0 ? `(${scope})` : ''}${label.length > 0 ? ': ' : ''}${message}"${body.length > 0 ? ` -m "${body}"` : ''}`);
  },

  synchronize: async (direction, remote, branch, flags=[]) => {
    if(!helpers.general.check({ direction, remote, branch })) {
      return;
    }

    return await helpers.commands.execute(`git ${direction}${helpers.commands.flags(flags)} ${remote} ${branch}`);
  },

  add: async (files, flags=[]) => {
    if(!helpers.general.check({ files })) {
      return;
    }

    return await helpers.commands.execute(`git add${helpers.commands.flags(flags)} ${files}`);
  },

  tag: async (tag, flags=[]) => {
    if(!helpers.general.check({ tag })) {
      return;
    }

    return await helpers.commands.execute(`git tag${helpers.commands.flags(flags)} ${tag}`);
  },

  isRepository: async () => {
    return (await helpers.commands.execute('git rev-parse --is-inside-work-tree')).stdout.startsWith('true');
  },

  branch: {
    current: async () => {
      return (await helpers.commands.execute('git branch --show-current')).stdout.trim();
    },

    set: async (branch, flags=[]) => {
      if(!helpers.general.check({ branch })) {
        return;
      }

      return await helpers.commands.execute(`git checkout${helpers.commands.flags(flags)} ${branch}`);
    },

    fetch: async () => {
      return (await helpers.commands.execute('git branch -l')).stdout
        .split('\n')
        .map(branch => branch.replace('* ', '').trim())
        .filter(branch => branch ? branch.length > 0 : false);
    },

    update: async (configuration) => {
      let branch;
      let branches = configuration.branches;

      await git.branch.set(configuration.branches.find(branch => branch.ref === 'development').name);

      if(configuration.issue > -1) {
        const issue = configuration.issues.find(issue => issue.number === configuration.issue);
        const name = gh.issues.format(issue);
        const id = uuid();
        let isInitializing = false;

        branch = configuration.branches.find(branch => branch.ref === `#${issue.number}`);

        if(typeof branch === 'undefined') {
          branch = {
            ref: `#${issue.number}`,
            name,
            id,
          };

          branches.push(branch);
          isInitializing = true;
        }

        await git.branch.set(branch.name, isInitializing ? ['-b'] : []);
      } else {
        branch = branches.find(current => current.ref === 'development');
      }

      await git.synchronize('pull', configuration.remote, branch.name);

      return {
        branch,
        branches
      }
    },
  }
};

export default git;
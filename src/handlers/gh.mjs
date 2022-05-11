import helpers from '../helpers/index.mjs';
import log from '../log.mjs';
import chalk from 'chalk';
import zip from 'lodash.zip';
import merge from 'lodash.merge';
import git from './git.mjs';

const gh = {
  fetch: async (configuration, {isLogging = true}) => {
    let spinner;

    if (isLogging) {
      spinner = log.spinner(log.info('fetching data', false));
    }

    const issues = await gh.issues.fetch(configuration);
    const labels = await gh.labels.fetch(configuration);

    if (isLogging) {
      spinner.stop();
      log.info('fetched data');
    }

    return {
      issues, labels,
    };
  },

  labels: {
    fetch: async (configuration) => {
      const {stdout: raw} = await helpers.commands.execute(
          `gh label list -R ${ configuration.repository }`);

      return raw.split('\n').map(line => {
        if (line ? line.length > 0 : false) {
          const [label, description, color] = line.split('\t');

          if (label && description && color) {
            return {
              label, description, color,
            };
          }
        }
      }).filter(current => current ? typeof current === 'object' : false);
    },

    list: (data, options) => {
      let config = merge({
        count: 10,
        page: 0,
      }, options);

      const rows = data.filter(
          current => current ? typeof current === 'object' : false).
          map(({label, description}) => ({
            label: label.length > 35 ? `${ label.slice(0, 35) }...` : label,
            description: description.length > 105 ? `${ description.slice(0,
                105) }...` : description,
          })).
          slice(config.page * config.count, (config.page + 1) * config.count);

      if (rows.length > 0) {
        const max = zip(
            ...rows.map(i => Object.values(i).map(v => v.toString().length))).
            map(lengths => Math.max(...lengths));

        rows.forEach(issue => {
          log.blank(`${ chalk.cyan(issue.label) }${ ' '.repeat(
              max[0] - issue.label.length + 3) }${ issue.description }`);
        });
      } else {
        log.warn('no labels');
      }
    },
  },

  issues: {
    close: async (configuration, issue, flags) => {
      return await helpers.commands.execute(`gh issue close ${issue}${helpers.commands.flags(flags)} -R ${configuration.repository}`);
    },

    format: (issue) => {
      const label = issue.labels.at(0);
      return `${ label.length > 0
          ? `${ label }/`
          : '' }${ issue.title.toLowerCase().
          split(' ').
          slice(0, 10).
          join('-') }`;
    },

    list: (data, options) => {
      let config = merge({
        selection: -1,
        count: 10,
        page: 0,
      }, options);

      const rows = data.map(({number, title, labels}) => ({
        number,
        title: title.length > 105 ? `${ title.slice(0, 105) }...` : title,
        labels: labels.join(', ').length > 60 ? `${ labels.join(', ').
            slice(0, 60) }...` : labels.join(', '),
      })).slice(config.page * config.count, (config.page + 1) * config.count);

      if (rows.length > 0) {
        const max = zip(
            ...rows.map(i => Object.values(i).map(v => v.toString().length))).
            map(lengths => Math.max(...lengths));

        rows.forEach(issue => {
          log.blank(
              chalk[issue.number === config.selection ? 'blue' : 'yellow'].bold(
                  `#${ issue.number }`) +
              ' '.repeat(max[0] - issue.number.toString().length + 3) +
              (issue.number === config.selection
                  ? chalk.blue.bold(issue.title)
                  : issue.title) + ' '.repeat(max[1] - issue.title.length + 5) +
              (issue.number === config.selection
                  ? chalk.blue.bold(issue.labels)
                  : chalk.cyan(issue.labels)));
        });
      } else {
        log.warn('no issues');
      }
    },

    fetch: async (configuration) => {
      const {stdout: raw} = await helpers.commands.execute(
          `gh issue list -R ${ configuration.repository }`);
      return raw.split('\n').map(issue => {
        if (issue ? issue.length > 0 : false) {
          const split = issue.split('\t');

          if (split.length === 5) {
            return {
              number: parseInt(split[0]),
              status: split[1],
              title: split[2],
              labels: split[3].split(', '),
              timestamp: new Date(split[4]).toISOString(),
            };
          }
        }
      }).filter(issue => typeof issue === 'object');
    },
  },

  pr: {
    create: async (
        configuration,
        {title = '', body = '', labels = [], base = '', branch = ''}) => {
      await git.branch.set(branch);
      return await helpers.commands.execute(
          `gh pr create --title "${ title }" --body "${ body }" ${ labels.length > 0
              ? `${ labels.map(label => `--label ${ label }`).join(' ') } `
              : '' }--base ${ base } -R ${ configuration.repository }`);
    },

    merge: async (configuration, pr, flags) => {
      return await helpers.commands.execute(
          `gh pr merge${helpers.commands.flags(flags)} ${ pr } -R ${ configuration.repository }`);
    },

    fetch: async (configuration) => {
      return (await helpers.commands.execute(`gh pr list -R ${ configuration.repository }`)).stdout
        .split('\n')
        .filter(line => line ? line.length > 0 : false)
        .map(line => line.split('\t'))
        .map(([number, title, branch]) => ({number: parseInt(number), title, branch}))
        .filter(({number, title, branch}) => helpers.general.check({ number, title, branch}, false));
    },
  },
};

export default gh;

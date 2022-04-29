import chalk from 'chalk';
import ora from 'ora';

const log = {
  error: (message, isPrinting = true) => {
    const data = `${ chalk.red.bold('error:') } ${ message }`;
    if(isPrinting) {
      console.log(data);
    }
    return data;
  },

  warn: (message, isPrinting = true) => {
    const data = `${ chalk.yellow.bold('warn:') } ${ message }`;
    if(isPrinting) {
      console.log(data);
    }
    return data;
  },

  info: (message, isPrinting = true) => {
    const data = `${ chalk.blue.bold('info:') } ${ message }`;
    if(isPrinting) {
      console.log(data);
    }
    return data;
  },

  success: (message, isPrinting = true) => {
    const data = `${ chalk.green.bold('success:') } ${ message }`;
    if(isPrinting) {
      console.log(data);
    }
    return data;
  },

  spinner: (option) => {
    return ora(option).start();
  },

  blank: (message) => {
    console.log(message);
    return message;
  }
};

export default log;
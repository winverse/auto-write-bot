/* eslint-disable @typescript-eslint/no-var-requires */
const cliboardy = (data: string): Promise<void> => {
  return new Promise((resolve) => {
    const proc = require('child_process').spawn('pbcopy');
    proc.stdin.write(data);
    proc.stdin.end();
    resolve();
  });
};

export default cliboardy;

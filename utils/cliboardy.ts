import childProcess from 'child_process';

const cliboardy = (data: string): Promise<void> => {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const clipboard = childProcess.spawn(isWin ? 'clip' : 'pbcopy');
    clipboard.stdin.write(data);
    clipboard.stdin.end();
    resolve();
  });
};
export default cliboardy;

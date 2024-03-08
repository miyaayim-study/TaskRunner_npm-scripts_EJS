import chalk from 'chalk';
import chokidar from 'chokidar';
import { reload } from './server.mjs';

const watchTask = async ({ watchSrc, task, taskSrc, taskDist, mode }) => {
  const inputPaths = watchSrc;
  const taskFunction = task;

  try {
    const options = {
      ignoreInitial: true, // 初回の監視対象ファイルの変更を無視する
    };
    const watcher = chokidar.watch(inputPaths, options);
    watcher.on('all', async (event, path) => {
      // asyncを追加して非同期処理を扱う
      const watchEvent = event;
      const watchPath = path;
      try {
        await taskFunction({ src: taskSrc, dist: taskDist, mode: mode, watchEvent: watchEvent, watchPath: watchPath }); // タスクを非同期で実行し、完了を待つ
        // 監視イベントがフォルダの追加・削除の場合はリロードしない（フォルダ内にファイルが存在する場合は、'add'or'unlink'のイベントが検出されるのでリロードされます）
        // フォルダ操作だけでリロードが発生するのがストレスだったため条件分岐を行った。
        if (!(watchEvent === 'addDir' || watchEvent === 'unlinkDir')) {
          await reload(); // タスクが完了した後にリロードを実行
        }
      } catch (error) {
        await console.error(
          `An error occurred while executing the task for ${chalk.underline(watchEvent)} at ${chalk.underline(
            watchPath,
          )}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
        );
      }
    });
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('watchTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
    );
  }
};

export default watchTask;

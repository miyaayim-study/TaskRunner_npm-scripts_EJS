import chokidar from 'chokidar';
import { reload } from './server.mjs';
import chalk from 'chalk'; // ログのテキストを装飾する

const watchTask = async ({ src, task, mode }) => {
  const inputPaths = src;
  const taskFunction = task;
  const taskMode = mode;

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
        await taskFunction({ mode: taskMode, watchEvent: watchEvent, watchPath: watchPath }); // タスクを非同期で実行し、完了を待つ
        // 監視イベントがフォルダの追加・削除の場合はリロードしない（フォルダ内にファイルが存在する場合は、'add'or'unlink'のイベントが検出されるのでリロードされます）
        // フォルダ操作だけでリロードが発生するのがストレスだったため条件分岐を行った。
        if (!(watchEvent === 'addDir' || watchEvent === 'unlinkDir')) {
          reload(); // タスクが完了した後にリロードを実行
        }
      } catch (error) {
        await console.error(
          `An error occurred while executing the task for ${chalk.underline(
            watchEvent
          )} at ${chalk.underline(watchPath)}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
            error.message
          )}`
        );
      }
    });
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('watchTask')}.: ${chalk.bold.italic.bgRed(
        error.name
      )} ${chalk.red(error.message)}`
    );
  }
};

export default watchTask;

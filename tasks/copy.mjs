import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import dir from './dir.mjs';
import deleteTask from './delete.mjs';
import chalk from 'chalk'; // ログのテキストを装飾する

const copyTask = async ({ watchEvent, watchPath }) => {
  const extension = '.html';
  const inputBaseDir = dir.src.html;
  const outputBaseDir = dir.dist.html;

  const copyFile = async ({ copyFilePath }) => {
    const inputPath = copyFilePath;
    const outputDir = path.join(
      outputBaseDir,
      path.relative(inputBaseDir, path.dirname(inputPath))
    );
    const outputPath = path.join(outputBaseDir, path.relative(inputBaseDir, inputPath));
    try {
      // 出力先パスまでのフォルダが存在しない場合は作成
      // recursive: trueにすることで、ディレクトリ構造が深い場合も再帰的にフォルダ作成を行ってくれる。
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      await fs.copyFileSync(inputPath, outputPath);
      console.log(chalk.green('File copied completed successfully.:'), chalk.underline(inputPath));
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('copyFile')}.: ${chalk.bold.italic.bgRed(
          error.name
        )} ${chalk.red(error.message)}`
      );
    }
  };

  // 監視イベントで削除を受け取った場合の処理
  const deleteDist = () => {
    const distPath = path.join(outputBaseDir, path.relative(inputBaseDir, watchPath));
    deleteTask({ mode: 'one', path: distPath });
  };

  try {
    console.log('watchEvent => ', watchEvent);
    console.log('watchPath => ', watchPath);
    // もし監視イベントが削除だった場合
    if (watchEvent === 'unlink' || watchEvent === 'unlinkDir') {
      deleteDist();
    } else {
      // 監視タスクからの場合は、監視で検知したファイルのみをレンダリング（監視タスクで受け取るwatchPathがあるかないかで判断してる）
      if (watchPath) {
        if ((watchEvent === 'add' || watchEvent === 'change') && watchPath.endsWith(extension)) {
          // 監視イベントが追加か変更かつ、それがEJSファイルだった場合に実行
          await copyFile({ copyFilePath: watchPath });
          await console.log(chalk.green('Copy processing task completed.'));
        }

        // 監視タスク以外の場合は、全てのファイルをレンダリング
      } else {
        // 指定したディレクトリ内の全てのEJSファイルのファイルパスを取得（'_'で始まるファイル名は除く）
        const copyFilePaths = await glob(path.join(inputBaseDir, '**/!(_)*' + extension), {
          windowsPathsNoEscape: true,
        }); // オプションは、Windowsスタイルのパスセパレータを有効にしたい（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないがそれを使えるようにする）

        for (const copyFilePath of copyFilePaths) {
          await copyFile({ copyFilePath: copyFilePath });
        }
        await console.log(
          chalk.green('Copy processing task completed.'),
          '--- Number of files:',
          copyFilePaths.length
        );
      }
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('copyTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
        error.message
      )}`
    );
  }
};

export default copyTask;

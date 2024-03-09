import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import dir from './dir.mjs';
import deleteTask from './delete.mjs';
import isExcludedPath from './isExcludedPath.mjs';
import eslint from './eslint.mjs';

const copyJs = async ({ mode, watchEvent, watchPath }) => {
  const taskMode = mode;
  const inputBaseDir = dir.src.js;
  const outputBaseDir = dir.dist.js;
  const extension = '.js';

  const copyJsFile = async ({ copyFilePath }) => {
    const inputPath = copyFilePath;
    const outputDir = path.join(outputBaseDir, path.relative(inputBaseDir, path.dirname(inputPath)));
    const outputPath = path.join(outputBaseDir, path.relative(inputBaseDir, inputPath));

    try {
      // 出力先パスまでのフォルダが存在しない場合は作成
      // `recursive: true` にすることで、ディレクトリ構造が深い場合も再帰的にフォルダ作成を行う。
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      await fs.copyFileSync(inputPath, outputPath);

      // JSファイルを構文チェック
      if (taskMode === 'build') {
        // buildモードならスタイルガイドに沿った文法チェックも行う
        eslint({ filePath: outputPath, mode: true });
      } else {
        eslint({ filePath: outputPath });
      }

      // console.log(chalk.green('File copied completed successfully.:'), chalk.underline(inputPath));
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('copyJsFile')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
          error.message,
        )}`,
      );
    }
  };

  // 監視イベントが削除の場合の処理内容
  const deleteDist = () => {
    const distPath = path.join(outputBaseDir, path.relative(inputBaseDir, watchPath));
    deleteTask({ mode: 'one', path: distPath });
  };

  try {
    // 監視タスクの監視イベントが削除の場合（'_'で始まるディレクトリ名とファイル名は除く）
    if (
      (watchEvent === 'unlink' || watchEvent === 'unlinkDir') &&
      !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
    ) {
      await deleteDist();

      // 削除の監視イベントを受け取らなかった場合
    } else {
      // 監視タスクの監視イベントが追加・変更の場合、監視で検知した該当する拡張子ファイルのみをコピー（'_'で始まるディレクトリ名とファイル名は除く）
      // （監視タスクかどうかは、監視タスクで受け取るwatchPathが有るか無いかで判断）
      if (watchPath) {
        if (
          (watchEvent === 'add' || watchEvent === 'change') &&
          watchPath.endsWith(extension) &&
          !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
        ) {
          await copyJsFile({ copyFilePath: watchPath });
          // await console.log(chalk.green('JS Copy processing task completed.'));
        }

        // 監視タスク以外の場合は、全てのファイルをコピー
      } else {
        // 指定したディレクトリ内の全てのファイルのファイルパスを取得（'_'で始まるディレクトリ名とファイル名は除く）
        // オプション内容は、Windowsスタイルのパスセパレータを有効にする設定（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないが、'true'にすることでそれを使えるようにする）
        const copyFilePaths = await glob(path.join(inputBaseDir, '**/!(_)*' + extension), {
          windowsPathsNoEscape: true,
          ignore: '**/_*/**',
        });
        for (const copyFilePath of copyFilePaths) {
          await copyJsFile({ copyFilePath: copyFilePath });
        }
        // await console.log(
        //   chalk.green('JS Copy processing task completed.'),
        //   '--- Number of files:',
        //   copyFilePaths.length
        // );
      }
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('copyJs')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
    );
  }
};

export default copyJs;

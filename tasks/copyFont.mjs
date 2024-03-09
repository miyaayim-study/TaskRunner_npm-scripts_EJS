import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import dir from './dir.mjs';
import deleteTask from './delete.mjs';
import isExcludedPath from './isExcludedPath.mjs';

const copyFont = async ({ watchEvent, watchPath }) => {
  const inputBaseDir = dir.src.font;
  const outputBaseDir = dir.dist.font;

  const copyFontFile = async ({ copyFilePath }) => {
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

      // console.log(chalk.green('File copied completed successfully.:'), chalk.underline(inputPath));
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('copyFontFile')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
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
    // Fontファイルを識別するための正規表現、'i'の部分は大文字、小文字を区別しないという意味
    const validExtensions = /\.(ttf|otf|woff|woff2)$/i;

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
          validExtensions.test(watchPath) &&
          !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
        ) {
          await copyFontFile({ copyFilePath: watchPath });
          // await console.log(chalk.green('Font Copy processing task completed.'));
        }

        // 監視タスク以外の場合は、全てのファイルをコピー
      } else {
        // 指定したディレクトリ内の全てのファイルのファイルパスを取得（'_'で始まるディレクトリ名とファイル名は除く）
        // オプション内容は、Windowsスタイルのパスセパレータを有効にする設定（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないが、'true'にすることでそれを使えるようにする）
        const copyFilePaths = await glob(path.join(inputBaseDir, '**/!(_)*.{ttf,otf,woff,woff2,TTF,OTF,WOFF,WoFF2}'), {
          windowsPathsNoEscape: true,
          ignore: '**/_*/**',
        });

        for (const copyFilePath of copyFilePaths) {
          await copyFontFile({ copyFilePath: copyFilePath });
        }
        // await console.log(
        //   chalk.green('Font Copy processing task completed.'),
        //   '--- Number of files:',
        //   copyFilePaths.length
        // );
      }
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('copyFont')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
    );
  }
};

export default copyFont;

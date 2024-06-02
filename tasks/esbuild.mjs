import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import * as esbuild from 'esbuild';
import dir from './dir.mjs';
import deleteTask from './delete.mjs';
import isExcludedPath from './isExcludedPath.mjs';
import eslint from './eslint.mjs';

const jsTask = async ({ mode, watchEvent, watchPath }) => {
  const taskMode = mode;
  const inputBaseDir = dir.src.js;
  const outputBaseDir = dir.dist.js;
  const IGNORED_INPUT_DIR = ['library', 'plugins']; // 除外するフォルダを定義

  // 除外フォルダがファイルパスに含まれているかを判定
  const isInIgnoredDirectory = (filePath) => {
    return IGNORED_INPUT_DIR.some(
      (dir) => filePath.includes(`\\${dir}\\`) || filePath.startsWith(`${dir}\\`) || filePath.endsWith(`\\${dir}`),
    );
  };

  const jsBuild = async ({ jsFilePath }) => {
    const inputPath = jsFilePath;
    const outputDir = path.join(outputBaseDir, path.relative(inputBaseDir, path.dirname(inputPath)));
    const outputPath = path.join(outputBaseDir, path.relative(inputBaseDir, inputPath)).replace('index.js', 'main.js'); // パスのindex.jsという部分をmain.jsに置き換える

    // 出力先パスまでのフォルダが存在しない場合は作成
    // `recursive: true` にすることで、ディレクトリ構造が深い場合も再帰的にフォルダ作成を行う。
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const esbuildOptions = {
      entryPoints: [inputPath], // エントリーファイルのパスを指定
      outfile: outputPath, // 出力ファイルのパスを指定
      bundle: true, // バンドルを有効にする
      target: 'es6', // ターゲットをES6に設定
    };
    if (taskMode === 'build') {
      esbuildOptions.minify = true; // 最小化を有効にする
    }
    if (taskMode === 'development') {
      esbuildOptions.sourcemap = 'inline'; // ソースマップを埋め込む
    }

    try {
      await esbuild.build(esbuildOptions);
      // await console.log(chalk.green('JavaScript build completed successfully.'));
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('jsBuild')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
      );
    }
  };

  // 除外フォルダの場合のコピー処理内容
  const copyJsFile = async ({ jsFilePath }) => {
    const inputPath = jsFilePath;
    const outputDir = path.join(outputBaseDir, path.relative(inputBaseDir, path.dirname(inputPath)));
    const outputPath = path.join(outputBaseDir, path.relative(inputBaseDir, inputPath));

    try {
      // 出力先パスまでのフォルダが存在しない場合は作成
      // `recursive: true` にすることで、ディレクトリ構造が深い場合も再帰的にフォルダ作成を行う。
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      await fs.copyFileSync(inputPath, outputPath);

      // await console.log(chalk.green('File copied completed successfully.:'), chalk.underline(inputPath));
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
    let srcPath;
    srcPath = watchPath;
    const distPath = path.join(outputBaseDir, path.relative(inputBaseDir, srcPath));
    deleteTask({ mode: 'one', path: distPath });
  };

  // 全てのファイルをビルド
  const allBuild = async () => {
    //* 1：Eslintで構文チェックするファイルを取得
    // src/js内の'_'で始まるディレクトリ名を除いた全てのJSファイルを取得
    // オプション内容は、Windowsスタイルのパスセパレータを有効にする設定（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないが、'true'にすることでそれを使えるようにする）
    const jsAllFilePathsPromise = glob(path.join(inputBaseDir, '**/*.js'), {
      windowsPathsNoEscape: true,
      ignore: '**/_*/**',
    });

    //* 2：ビルドするファイルを取得
    // src/js内の'_'で始まるディレクトリ名とファイル名を除いた全てのJSファイルを取得
    // オプション内容は、Windowsスタイルのパスセパレータを有効にする設定（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないが、'true'にすることでそれを使えるようにする）
    const jsFilePathsPromise = glob(path.join(inputBaseDir, '**/!(_)*.js'), {
      windowsPathsNoEscape: true,
      ignore: '**/_*/**',
    });

    // jsAllFilePathsPromiseとjsFilePathsPromiseを並列実行して分割代入
    const [jsAllFilePaths, jsFilePaths] = await Promise.all([jsAllFilePathsPromise, jsFilePathsPromise]);

    // const [jsAllFilePaths, jsFilePaths]が終わってから下記を実行

    //* 1：src/js内の'_'で始まるディレクトリ名を除いた全てのJSファイルを構文チェック
    let eslintPromises;
    if (taskMode === 'build') {
      // buildモードならスタイルガイドに沿った文法チェックも行う
      eslintPromises = jsAllFilePaths.map((jsFilePath) => {
        // 除外フォルダ内のファイルパスではない場合にeslintを実行
        if (!isInIgnoredDirectory(jsFilePath)) {
          return eslint({ filePath: jsFilePath, mode: true });
        }
        return Promise.resolve(); // 除外フォルダ内の場合は空のPromiseを返す
      });
    } else {
      eslintPromises = jsAllFilePaths.map((jsFilePath) => {
        // 除外フォルダ内のファイルパスではない場合にeslintを実行
        if (!isInIgnoredDirectory(jsFilePath)) {
          return eslint({ filePath: jsFilePath });
        }
        return Promise.resolve(); // 除外フォルダ内の場合は空のPromiseを返す
      });
    }

    //* 2：src/js内の'_'で始まるディレクトリ名とファイル名を除いた全てのJSファイルを一つずつ取り出しビルドする
    const jsBuildPromises = jsFilePaths.map(async (jsFilePath) => {
      // 除外フォルダ内のファイルパスの場合はcopyJsFileを実行、それ以外はjsBuildを実行
      if (isInIgnoredDirectory(jsFilePath)) {
        await copyJsFile({ jsFilePath: jsFilePath });
      } else {
        await jsBuild({ jsFilePath: jsFilePath });
      }
    });

    // 並列実行、'...'はスプレッド演算子で、配列の要素を展開して新しい配列を作成している
    await Promise.all([...eslintPromises, ...jsBuildPromises]);

    // await console.log(
    //   chalk.green('JavaScript processing task completed.'),
    //   '--- Number of files:',
    //   jsFilePaths.length
    // );
  };

  try {
    // 監視タスクの監視イベントがフォルダ削除の場合
    if (watchEvent === 'unlinkDir') {
      await deleteDist();

      // 監視タスクの監視イベントがJSファイル削除の場合（'_'で始まるディレクトリ名とファイル名は除く）
    } else if (
      watchEvent === 'unlink' &&
      path.basename(watchPath).endsWith('.js') &&
      !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
    ) {
      await deleteDist();

      // 削除の監視イベントを受け取らなかった場合
    } else {
      // 監視タスクの監視イベントが追加・変更の場合、監視で検知した該当するJSファイルのみをレンダリング（'_'で始まるディレクトリ名とファイル名は除く）
      if (watchPath) {
        if (
          (watchEvent === 'add' || watchEvent === 'change') &&
          watchPath.endsWith('.js') &&
          !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
        ) {
          // 除外フォルダ内のファイルパスの場合はcopyJsFileを実行、それ以外はjsBuildを実行
          if (isInIgnoredDirectory(watchPath)) {
            await copyJsFile({ jsFilePath: watchPath });
          } else {
            await jsBuild({ jsFilePath: watchPath });
          }
          // await console.log(chalk.green('JS processing task completed.'));
        } else {
          await allBuild();
        }

        // 監視タスク以外の場合は、全てのファイルをレンダリング
      } else {
        await allBuild();
      }
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('jsTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
    );
  }
};

export default jsTask;

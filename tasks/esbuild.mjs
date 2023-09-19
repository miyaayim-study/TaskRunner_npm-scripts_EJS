import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import dir from './dir.mjs';
import eslint from './eslint.mjs';
import chalk from 'chalk'; // ログのテキストを装飾する

const jsTask = async ({ mode }) => {
  const taskMode = mode;
  const inputBaseDir = dir.src.js;
  const outputBaseDir = dir.dist.js;

  const jsBuild = async ({ jsFilePath }) => {
    const inputPath = jsFilePath;
    const outputDir = path.join(
      outputBaseDir,
      path.relative(inputBaseDir, path.dirname(inputPath))
    );
    const outputPath = path
      .join(outputBaseDir, path.relative(inputBaseDir, inputPath))
      .replace('index.js', 'main.js'); // パスのindex.jsという部分をmain.jsに置き換える

    // 出力先パスまでのフォルダが存在しない場合は作成
    // recursive: trueにすることで、ejs/フォルダ/フォルダ/index.htmlのようなディレクトリ構造が深い場合も再帰的にフォルダ作成を行ってくれる。
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
        `Error in ${chalk.underline('jsBuild')}.: ${chalk.bold.italic.bgRed(
          error.name
        )} ${chalk.red(error.message)}`
      );
    }
  };

  try {
    // src/js内の全てのJSファイルを取得
    const jsAllFilePathsPromise = glob(path.join(inputBaseDir, '**/*.js'), {
      windowsPathsNoEscape: true,
    }); // オプションは、Windowsスタイルのパスセパレータを有効にしたい（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないがそれを使えるようにする）
    // src/js内の'_'で始まるファイル名を除いた全てのJSファイルを取得
    const jsFilePathsPromise = glob(path.join(inputBaseDir, '**/!(_)*.js'), {
      windowsPathsNoEscape: true,
    }); // オプションは、Windowsスタイルのパスセパレータを有効にしたい（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないがそれを使えるようにする）

    // jsAllFilePathsPromiseとjsFilePathsPromiseを並列実行して分割代入
    const [jsAllFilePaths, jsFilePaths] = await Promise.all([
      jsAllFilePathsPromise,
      jsFilePathsPromise,
    ]);

    // const [jsAllFilePaths, jsFilePaths]が終わってから下記を実行
    // src/js内の全てのJSファイルを構文チェック
    let eslintPromises;
    if (taskMode === 'build') {
      // buildモードならスタイルガイドに沿った文法チェックも行う
      eslintPromises = jsAllFilePaths.map((jsFilePath) =>
        eslint({ filePath: jsFilePath, mode: true })
      );
    } else {
      eslintPromises = jsAllFilePaths.map((jsFilePath) => eslint({ filePath: jsFilePath }));
    }

    // src/js内の'_'で始まるファイル名を除いた全てのJSファイルを一つずつ取り出しビルドする
    const jsBuildPromises = jsFilePaths.map((jsFilePath) => jsBuild({ jsFilePath: jsFilePath }));
    // 並列実行、'...'はスプレッド演算子で、配列の要素を展開して新しい配列を作成している
    await Promise.all([...eslintPromises, ...jsBuildPromises]);

    // await console.log(chalk.green('JavaScript processing task completed.'), '--- Number of files:', jsFilePaths.length);
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('jsTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
        error.message
      )}`
    );
  }
};

export default jsTask;

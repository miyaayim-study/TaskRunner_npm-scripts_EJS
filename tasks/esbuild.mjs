import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import dir from './dir.mjs';
import eslint from './eslint.mjs';
import chalk from 'chalk'; // ログのテキストを装飾する
import deleteTask from './delete.mjs';

const jsTask = async ({ mode, watchEvent, watchPath }) => {
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

  // 監視イベントで削除を受け取った場合の処理
  const deleteDist = () => {
    let srcPath;
    srcPath = watchPath;
    const distPath = path.join(outputBaseDir, path.relative(inputBaseDir, srcPath));
    deleteTask({ mode: 'one', path: distPath });
  };

  const allBuild = async () => {
    // 全てのファイルをビルド
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
    const jsBuildPromises = jsFilePaths.map((jsFilePath) =>
      jsBuild({ jsFilePath: jsFilePath })
    );
    // 並列実行、'...'はスプレッド演算子で、配列の要素を展開して新しい配列を作成している
    await Promise.all([...eslintPromises, ...jsBuildPromises]);

    // await console.log(
    //   chalk.green('JavaScript processing task completed.'),
    //   '--- Number of files:',
    //   jsFilePaths.length
    // );
  };

  try {
    // もし監視イベントが削除で、削除のなかでもフォルダ削除だった場合
    if (watchEvent === 'unlinkDir') {
      deleteDist();
      // もし監視イベントが削除で、削除のなかでもJSファイル削除だった場合
    } else if (
      watchEvent === 'unlink' &&
      path.basename(watchPath).endsWith('.js') &&
      !path.basename(watchPath).startsWith('_')
    ) {
      deleteDist();
    } else {
      // 監視タスクからの場合は、監視で検知したファイルのみをレンダリング（監視タスクで受け取るwatchPathがあるかないかで判断してる）
      if (watchPath) {
        if (
          (watchEvent === 'add' || watchEvent === 'change') &&
          watchPath.endsWith('.js') &&
          !path.basename(watchPath).startsWith('_')
        ) {
          // 監視イベントが追加か変更かつ、それがJSファイルだった場合に実行
          await jsBuild({ jsFilePath: watchPath });
          // await console.log(chalk.green('JS processing task completed.'));
        } else {
          await allBuild();
        }
      } else {
        await allBuild();
      }
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('jsTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
        error.message
      )}`
    );
  }
};

export default jsTask;

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import ejs from 'ejs';
import chalk from 'chalk';
// import * as prettier from 'prettier';
import jsBeautify from 'js-beautify';
const { html: beautify_html } = jsBeautify;
import dir from './dir.mjs';
import deleteTask from './delete.mjs';
import isExcludedPath from './isExcludedPath.mjs';
import eslint from './eslint.mjs';
import markuplint from './markuplint.mjs';
import jsBeautifyOptions from '../.jsbeautifyrc.js';

const ejsTask = async ({ mode, watchEvent, watchPath }) => {
  const taskMode = mode;
  const inputBaseDir = dir.src.ejs;
  const outputBaseDir = dir.dist.html;

  // EJSファイルをHTMLファイルにレンダリング
  const renderingEjs = async ({ ejsFilePath }) => {
    // 出力先のディレクトリパスとファイルパスを作成、ファイルパスはこの時点で'.ejs'から'.html'に拡張子変更
    const inputPath = ejsFilePath;
    // const inputPathData = fs.readFileSync(inputPath, 'utf8');
    const outputDir = path.join(outputBaseDir, path.relative(inputBaseDir, path.dirname(inputPath)));
    const outputPath = path.join(outputBaseDir, path.relative(inputBaseDir, inputPath)).replace('.ejs', '.html');

    // EJSファイルをレンダリングしてHTMLに変換
    // オプションとして、JSONファイルの読み込み
    // EJSのJSONファイルの場所とオプション設定の指定
    const json_path = path.join(inputBaseDir, '_data/site.json');
    const json = JSON.parse(fs.readFileSync(json_path, 'utf8'));

    try {
      // 出力先パスまでのフォルダが存在しない場合は作成
      // `recursive: true` にすることで、ディレクトリ構造が深い場合も再帰的にフォルダ作成を行う。
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const renderedResult = await new Promise((resolve, reject) => {
        ejs.renderFile(inputPath, { json: json }, (err, html) => {
          if (err) {
            // console.error('Error rendering EJS file.:', chalk.bold.italic.bgRed(err.name), chalk.red(err.message));
            reject(err);
          } else {
            // console.log(chalk.green('EJS file rendered completed successfully.:'), chalk.underline(inputPath));
            resolve(html);
          }
        });
      });

      // // Prettierを使用してHTMLコードを整形
      // // .prettierrc.jsの設定を読み込む。
      // const config = await prettier.resolveConfig('.prettierrc');
      // // resolveConfigで読み込んだ設定に、必要に応じて追加のオプションをマージします。
      // // ここでは、パーサーを指定しています。
      // const options = {
      //   ...config,
      //   parser: 'html',
      // };
      // // HTMLコードをprettierでフォーマット（整形）
      // const formattedResult = await prettier.format(renderedResult, options);

      // HTMLコードをjs-beautifyでフォーマット（整形）（主にインデント幅と改行の整形のみ）
      // オプションで.jsbeautifyrc.jsファイルの設定を読み込む
      const formattedResult = await beautify_html(renderedResult, jsBeautifyOptions);

      // HTMLデータを指定した出力先に生成
      fs.writeFileSync(outputPath, formattedResult, 'utf8');
      // await console.log(chalk.green('HTML file written completed successfully.:'), chalk.underline(outputPath));

      // Markuplintを使用して出力したHTMLコードをチェック
      await markuplint({ filePath: outputPath });

      // ESLintを使用して出力したHTMLコード内のJavascriptの構文チェック
      if (taskMode === 'build') {
        // buildモードならスタイルガイドに沿った文法チェックも行う
        await eslint({ filePath: outputPath, mode: true });
      } else {
        await eslint({ filePath: outputPath });
      }
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('renderingEjs')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
          error.message,
        )}`,
      );
    }
  };

  // 監視イベントが削除の場合の処理内容
  const deleteDist = (isChangedExtension) => {
    let srcPath;
    if (isChangedExtension) {
      srcPath = watchPath.replace('.ejs', '.html');
    } else {
      srcPath = watchPath;
    }
    const distPath = path.join(outputBaseDir, path.relative(inputBaseDir, srcPath));
    deleteTask({ mode: 'one', path: distPath });
  };

  const allRendering = async () => {
    // 全てのファイルをレンダリング
    // 指定したディレクトリ内の全てのEJSファイルのファイルパスを取得（'_'で始まるディレクトリ名とファイル名は除く）
    // オプション内容は、Windowsスタイルのパスセパレータを有効にする設定（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないが、'true'にすることでそれを使えるようにする）
    const ejsFilePaths = await glob(path.join(inputBaseDir, '**/!(_)*.ejs'), {
      windowsPathsNoEscape: true,
      ignore: '**/_*/**',
    });

    // 配列内の各EJSファイルパスを一つずつ取り出し順番にレンダリング（取り出したEJSファイルパスは'ejsFilePath'）
    for (const ejsFilePath of ejsFilePaths) {
      await renderingEjs({ ejsFilePath: ejsFilePath });
    }
    // await console.log(
    //   chalk.green('EJS processing task completed.'),
    //   '--- Number of files:',
    //   ejsFilePaths.length
    // );
  };

  try {
    // 監視タスクの監視イベントがフォルダ削除の場合
    if (watchEvent === 'unlinkDir') {
      await deleteDist();

      // 監視タスクの監視イベントがEJSファイル削除の場合（'_'で始まるファイル名は除く）
    } else if (
      watchEvent === 'unlink' &&
      path.basename(watchPath).endsWith('.ejs') &&
      !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
    ) {
      const isChangedExtension = true;
      await deleteDist(isChangedExtension);

      // 削除の監視イベントを受け取らなかった場合
    } else {
      // 監視タスクの監視イベントが追加・変更の場合、監視で検知した該当するEJSファイルのみをレンダリング（'_'で始まるファイル名は除く）
      if (watchPath) {
        if (
          (watchEvent === 'add' || watchEvent === 'change') &&
          watchPath.endsWith('.ejs') &&
          !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
          ///// !path.basename(watchPath).startsWith('_') //ファイル名だけに限定したい場合はこっち
        ) {
          await renderingEjs({ ejsFilePath: watchPath });
          // await console.log(chalk.green('EJS processing task completed.'));
        } else {
          await allRendering();
        }

        // 監視タスク以外の場合は、全てのファイルをレンダリング
      } else {
        await allRendering();
      }
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('ejsTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
    );
  }
};

export default ejsTask;

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import * as sass from 'sass'; // Sassコンパイラのモジュール
import postcss from 'postcss'; // PostCSSのモジュール
import autoprefixer from 'autoprefixer'; // 自動プレフィックスを追加するPostCSSプラグイン
// import cssnano from 'cssnano'; // CSSファイル圧縮のためのPostCSSプラグイン
import dir from './dir.mjs';
import deleteTask from './delete.mjs';
import isExcludedPath from './isExcludedPath.mjs';
import sassGlob from './sassGlob.mjs'; // 自作のsassファイル専用のglobモジュール
import stylelint from './stylelint.mjs';

// コンパイルSass関数の定義
const sassTask = async ({ mode, watchEvent, watchPath }) => {
  const taskMode = mode;
  const inputBaseDir = dir.src.sass;
  const outputDir = dir.dist.css;

  const compileSass = async ({ sassFilePath }) => {
    const inputPath = sassFilePath; // 入力Sassファイルのパスを作成
    const outputPath = path.join(outputDir, path.basename(inputPath)).replace('.scss', '.css');

    try {
      // 時間短縮のため、scssファイルの構文チェックを先に走らせている
      stylelint();

      // 出力先パスまでのフォルダが存在しない場合は作成
      // `recursive: true` にすることで、ディレクトリ構造が深い場合も再帰的にフォルダ作成を行う。
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Sassコンパイルオプションの設定
      const sassOptions = {
        loadPaths: [inputBaseDir], // @useなどのルールで読み込まれたスタイルシートを探すパス。ここがベースディレクトリとなる。
        sourceMap: true, // ソースマップを無効にする（初期値：false）、有効にすることで後ほど'sassCompileResult.sourceMap'が生成される。
        sourceMapIncludeSources: true, // ソースファイルの内容をソースマップに含めるかどうか（初期値：false）
        // style: 'compressed', // 圧縮モード（初期値：expanded）
      };

      // もしmodeが「build」の場合、Sassの出力スタイルを圧縮モードに設定
      if (taskMode === 'build') {
        sassOptions.style = 'compressed';
        sassOptions.sourceMap = false;
      }

      // sassファイルを一旦、sassGlobにかけて、その結果のファイルデータをsassコンパイルする流れ。
      const sassGlobResult = sassGlob(inputPath);
      const sassCompileResult = await sass.compileStringAsync(sassGlobResult, sassOptions);

      // PostCSSプラグインを適用
      const postcssPlugins = [
        autoprefixer(), // ベンダープレフィックス付与のプラグイン
        // cssnano({ preset: 'default' }), // CSSファイル圧縮のプラグイン
      ];

      // PostCSSを使用してSassの出力にプラグインを適用し、結果を待機
      // sassCompileResult.cssはコンパイルされた後のCSSデータのこと
      // sassCompileResult.sourceMapはコンパイルされた後のCSSデータについてのソースマップのデータのこと
      // postCSSが適用されたcssファイルがpostcssResult.cssになる
      const postcssResult = await postcss(postcssPlugins).process(sassCompileResult.css, {
        from: undefined, // from: inputPathと比較して見た目上差がないようにみえたので、ひとまず'undefined'にした。

        // buildモードの場合は、ソースマップを生成しない。
        map:
          taskMode === 'build'
            ? false
            : {
                inline: true, // ソースマップをCSSファイル内に含める（初期値：false）
                prev: sassCompileResult.sourceMap, // Sassから生成されたソースマップを引き継ぐ
              },
      });

      // 出力CSSファイルに結果を書き込み、完了を待機
      await new Promise((resolve, reject) => {
        fs.writeFile(outputPath, postcssResult.css, (writeError) => {
          // 指定した出力場所に処理が終わったデータをCSSファイルにして出力。
          if (writeError) {
            console.error(
              'Error rendering CSS file:',
              chalk.bold.italic.bgRed(writeError.name),
              chalk.red(writeError.message),
            );
            reject(writeError);
          } else {
            // console.log(chalk.green('Sass file compiled completed successfully.'));
            resolve();
          }
        });
      });
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('compileSass')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
          error.message,
        )}`,
      );
    }
  };

  // 監視イベントが削除の場合の処理内容
  const deleteDist = (isChangedExtension) => {
    let srcPath;
    if (isChangedExtension) {
      srcPath = watchPath.replace('.scss', '.css');
    } else {
      srcPath = watchPath;
    }
    const distPath = path.join(outputDir, path.basename(srcPath));
    deleteTask({ mode: 'one', path: distPath });
  };

  // 全てのファイルをコンパイル
  const allCompile = async () => {
    // 指定したディレクトリ内の全てのSassファイルのファイルパスを取得（'_'で始まるディレクトリ名とファイル名は除く）
    // オプション内容は、Windowsスタイルのパスセパレータを有効にする設定（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないが、'true'にすることでそれを使えるようにする）
    const sassFilePaths = await glob(path.join(inputBaseDir, '**/!(_)*.scss'), {
      windowsPathsNoEscape: true,
      ignore: '**/_*/**',
    });

    // 配列内の各Sassファイルパスを一つずつ取り出し順番にレンダリング（取り出したSassファイルパスは'sassFilePath'）
    for (const sassFilePath of sassFilePaths) {
      await compileSass({ sassFilePath: sassFilePath });
    }
    // await console.log(chalk.green('Sass processing task completed.'), '--- Number of files:', sassFilePaths.length);
  };

  try {
    // 監視タスクの監視イベントがフォルダ削除の場合
    if (watchEvent === 'unlinkDir') {
      await deleteDist();

      // 監視タスクの監視イベントがSassファイル削除の場合（'_'で始まるディレクトリ名とファイル名は除く）
    } else if (
      watchEvent === 'unlink' &&
      path.basename(watchPath).endsWith('.scss') &&
      !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
    ) {
      const isChangedExtension = true;
      await deleteDist(isChangedExtension);

      // 削除の監視イベントを受け取らなかった場合
    } else {
      // 監視タスクの監視イベントが追加・変更の場合、監視で検知したSassファイルのみをレンダリング（'_'で始まるディレクトリ名とファイル名は除く）
      if (watchPath) {
        if (
          (watchEvent === 'add' || watchEvent === 'change') &&
          path.basename(watchPath).endsWith('.scss') &&
          !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
        ) {
          // 監視イベントが追加か変更かつ、それがSassファイルであり、ファイル名の先頭が'_'ではない場合に実行
          await compileSass({ sassFilePath: watchPath });
          // await console.log(chalk.green('Sass processing task completed.'));

          // それ以外の監視イベントの場合は、全てのファイルをレンダリング
        } else {
          await allCompile();
        }

        // 監視タスク以外の場合は、全てのファイルをレンダリング
      } else {
        await allCompile();
      }
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('sassTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
    );
  }
};

export default sassTask;

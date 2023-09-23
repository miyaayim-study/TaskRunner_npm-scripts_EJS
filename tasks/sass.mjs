import dir from './dir.mjs'; // ディレクトリのパスを持つモジュールをインポート
import sassGlob from './sassGlob.mjs';
import fs from 'fs'; // ファイルシステムモジュールをインポート
import path from 'path'; // パス操作のためのモジュールをインポート
import { glob } from 'glob';
import * as sass from 'sass'; // Sassコンパイラのモジュールをインポート
import postcss from 'postcss'; // PostCSSのモジュールをインポート
import autoprefixer from 'autoprefixer'; // 自動プレフィックスを追加するPostCSSプラグインをインポート
// import cssnano from 'cssnano'; // CSSファイル圧縮のためのPostCSSプラグイン
import chalk from 'chalk'; // ログのテキストを装飾する
import stylelint from './stylelint.mjs';
import deleteTask from './delete.mjs';

// コンパイルSass関数の定義
const sassTask = async ({ mode, watchEvent, watchPath }) => {
  const taskMode = mode;
  const inputBaseDir = dir.src.sass;
  const outputDir = dir.dist.css;

  const compileSass = async ({ sassFilePath }) => {
    const inputPath = sassFilePath; // 入力Sassファイルのパスを作成
    const outputPath = path.join(outputDir, path.basename(inputPath)).replace('.scss', '.css');

    try {
      // scssファイルの構文チェックを先に走らせといた。
      stylelint();

      // 出力ディレクトリが存在しない場合、再帰的に作成
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      // Sassコンパイルオプションの設定
      const sassOptions = {
        loadPaths: [inputBaseDir], // @useなどのルールで読み込まれたスタイルシートを探すパス。ここがベースディレクトリとなる。
        // sourceMap: true,       // ソースマップを無効にする（初期値：false）
        // style: 'compressed', // 圧縮モード（初期値：expanded）
      };

      // もしmodeが「build」の場合、Sassの出力スタイルを圧縮モードに設定
      if (taskMode === 'build') {
        sassOptions.style = 'compressed';
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
      const postcssResult = await postcss(postcssPlugins).process(sassCompileResult.css, {
        from: undefined,
      }); // ssResult.cssに対して行うsassResult.cssはsassコンパイルされた後のCSSデータのこと、 undefinedはソースマップ生成を無効、postCSSが適用されたcssファイルがpostcssResult.cssになる

      // 出力CSSファイルに結果を書き込み、完了を待機
      await new Promise((resolve, reject) => {
        fs.writeFile(outputPath, postcssResult.css, (writeError) => {
          // 指定した出力場所に処理が終わったデータをCSSファイルにして出力。
          if (writeError) {
            console.error(
              'Error rendering CSS file:',
              chalk.bold.italic.bgRed(writeError.name),
              chalk.red(writeError.message)
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
        `Error in ${chalk.underline('compileSass')}.: ${chalk.bold.italic.bgRed(
          error.name
        )} ${chalk.red(error.message)}`
      );
    }
  };

  // 監視イベントで削除を受け取った場合の処理
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


  const allCompile = async () => {
    // 全てのファイルをコンパイル
    // 指定したディレクトリ内の全てのSassファイルのファイルパスを取得（'_'で始まるファイル名は除く）
    const sassFilePaths = await glob(path.join(inputBaseDir, '**/!(_)*.scss'), {
      windowsPathsNoEscape: true,
    }); // オプションは、Windowsスタイルのパスセパレータを有効にしたい（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないがそれを使えるようにする）

    // 配列内の各Sassファイルパスを一つずつ取り出し順番にレンダリング（取り出したSassファイルパスは'sassFilePath'）
    for (const sassFilePath of sassFilePaths) {
      await compileSass({ sassFilePath: sassFilePath });
    }
    // await console.log(chalk.green('Sass processing task completed.'), '--- Number of files:', sassFilePaths.length);
  };



  try {
    // もし監視イベントが削除で、削除のなかでもフォルダ削除だった場合
    if (watchEvent === 'unlinkDir') {
      deleteDist();
      // もし監視イベントが削除で、削除のなかでもSassファイル削除だった場合
    } else if (
      watchEvent === 'unlink' &&
      path.basename(watchPath).endsWith('.scss') &&
      !path.basename(watchPath).startsWith('_')
    ) {
      const isChangedExtension = true;
      deleteDist(isChangedExtension);
    } else {
      // 監視タスクからの場合は、監視で検知したファイルのみをレンダリング（監視タスクで受け取るwatchPathがあるかないかで判断してる）
      if (watchPath) {
        if (
          (watchEvent === 'add' || watchEvent === 'change') &&
          path.basename(watchPath).endsWith('.scss') &&
          !path.basename(watchPath).startsWith('_')
        ) {
          // 監視イベントが追加か変更かつ、それがSassファイルであり、ファイル名の先頭が'_'ではない場合に実行
          await compileSass({ sassFilePath: watchPath });
          // await console.log(chalk.green('Sass processing task completed.'));
        } else {
          await allCompile();
        }
      } else {
        await allCompile();
      }
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('sassTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
        error.message
      )}`
    );
  }
};

export default sassTask; // コンパイルSass関数をエクスポート

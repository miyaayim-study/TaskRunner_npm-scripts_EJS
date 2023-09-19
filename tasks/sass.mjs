import dir from './dir.mjs'; // ディレクトリのパスを持つモジュールをインポート
import sassGlob from './sassGlob.mjs';
import fs from 'fs'; // ファイルシステムモジュールをインポート
import path from 'path'; // パス操作のためのモジュールをインポート
import * as sass from 'sass'; // Sassコンパイラのモジュールをインポート
import postcss from 'postcss'; // PostCSSのモジュールをインポート
import autoprefixer from 'autoprefixer'; // 自動プレフィックスを追加するPostCSSプラグインをインポート
import chalk from 'chalk'; // ログのテキストを装飾する
import stylelint from './stylelint.mjs';

// コンパイルSass関数の定義
const sassTask = async ({ mode }) => {
  const taskMode = mode;
  const inputBaseDir = dir.src.sass;
  const outputBaseDir = dir.dist.css;
  const inputPath = path.join(inputBaseDir, 'style.scss'); // 入力Sassファイルのパスを作成
  const outputPath = path.join(outputBaseDir, 'style.css'); // 出力CSSファイルのパスを作成
  const outputDir = path.dirname(outputPath);

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
          // console.log(chalk.green('Sass compiled completed successfully.'));
          resolve();
        }
      });
    });
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('sassTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
        error.message
      )}`
    );
  }
};

export default sassTask; // コンパイルSass関数をエクスポート

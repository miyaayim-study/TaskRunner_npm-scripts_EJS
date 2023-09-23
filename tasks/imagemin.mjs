import dir from './dir.mjs'; // ファイルパス格納
import deleteTask from './delete.mjs';
import path from 'path'; // パス操作のためのモジュール
import chalk from 'chalk'; // ログのテキストを装飾する
import imagemin from 'imagemin-keep-folder'; // フォルダの構造を保持するためのツール
import imageminMozjpeg from 'imagemin-mozjpeg'; // JPEG画像を最適化するためのツール
import imageminPngquant from 'imagemin-pngquant'; // PNG画像を最適化するためのツール
import imageminGifsicle from 'imagemin-gifsicle'; // GIF画像を最適化するためのツール
import imageminSvgo from 'imagemin-svgo'; // SVG画像を最適化するためのツール
import imageminWebp from 'imagemin-webp'; // webp変換

const imgTask = async ({ watchEvent, watchPath }) => {
  const inputBaseDir = dir.src.img;
  const outputBaseDir = dir.dist.img;

  const convertWebp = async (targetFiles) => {
    try {
      await imagemin([targetFiles], {
        use: [imageminWebp({ quality: 50 })], // qualityを指定しないと稀にwebpが走らない場合があるので注意する。（{ quality: 50 }）で指定すれば大体いけそう
      });
      // await console.log(chalk.green('WebP conversion completed successfully.'));
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('convertWebp')}.: ${chalk.bold.italic.bgRed(
          error.name
        )} ${chalk.red(error.message)}`
      );
    }
  };

  const imageOptimizer = async (srcPath) => {
    try {
      const inputPath = srcPath;
      const outputFiles = path.join(outputBaseDir, '**/*');

      await imagemin([inputPath], {
        plugins: [
          imageminMozjpeg({ quality: 80 }), // 圧縮品質を80%にする
          imageminPngquant({ quality: [0.6, 0.7] }), // 圧縮品質を60%～70%の間にする
          imageminGifsicle(),
          imageminSvgo(),
        ],
        replaceOutputDir: (output) => {
          // imagemin-keep-folder プラグインのオプションにてファイル構造を保持
          return output.replace(/img\//, path.join('../', outputBaseDir)); // 正規表現 /img\// を使って、出力先パス内の /img/ を ../dist/img/ に置換しています。これにより、元の画像の出力先フォルダが img から dist/img に変更されます。
        },
      });
      // await convertWebp(outputFiles);
      // await console.log(chalk.green('Image optimization completed successfully.'));
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('imageOptimizer')}.: ${chalk.bold.italic.bgRed(
          error.name
        )} ${chalk.red(error.message)}`
      );
    }
  };

  const deleteDist = async () => {
    const distPath = path.join(outputBaseDir, path.relative(inputBaseDir, watchPath));
    const extension = path.extname(watchPath); // 現在の拡張子を取得
    const distPathWebp = path.join(
      path.dirname(distPath),
      path.basename(distPath, extension) + '.webp'
    ); // ファイルパスの拡張子をwebpに変換
    // Promise.allを使ってタスクを並列で実行
    await Promise.all([
      deleteTask({ mode: 'one', path: distPath }), // webpではない画像ファイルを削除
      deleteTask({ mode: 'one', path: distPathWebp }), // webpの画像ファイルを削除
    ]);
  };

  try {
    // 画像ファイルを識別するための正規表現、'i'の部分は大文字、小文字を区別しないという意味
    const validExtensions = /\.(jpg|jpeg|png|gif|svg)$/i;
    // 監視イベントが削除だった場合
    // 削除のなかでもフォルダ削除だった場合
    if (watchEvent === 'unlinkDir') {
      // 監視イベントで削除を受け取った場合の処理
      await deleteDist();

      // 削除のなかでもファイル削除だった場合
    } else if (watchEvent === 'unlink' && validExtensions.test(watchPath)) {
      // watchPathが正規表現パターン（画像ファイルの拡張子）とマッチすればtrueを返す
      await deleteDist();
    }

    if (watchPath) {
      if (
        (watchEvent === 'add' || watchEvent === 'change') &&
        validExtensions.test(watchPath) &&
        !path.basename(watchPath).startsWith('_')
      ) {
        // 監視イベントが追加か変更かつ、それが画像ファイルだった場合に実行
        const srcPath = watchPath;
        await imageOptimizer(srcPath);
      }
    } else {
      const srcPath = path.join(
        inputBaseDir,
        '**/!(_)*.{jpg,jpeg,png,gif,svg,JPG,JPEG,PNG,GIF,SVG}'
      );
      await imageOptimizer(srcPath);
    }

    // if (!(watchEvent === 'addDir')) { // 監視イベントがフォルダ追加だった場合、下記のログを表示しない（なにもしてないのにログ出すのはおかしいから）
    // await console.log(chalk.green('Image processing task completed.'));
    // }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('imgTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
        error.message
      )}`
    );
  }
};

export default imgTask;

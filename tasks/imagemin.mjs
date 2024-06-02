import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import imagemin from 'imagemin-keep-folder'; // フォルダの構造を保持するためのモジュール
import imageminMozjpeg from 'imagemin-mozjpeg'; // JPEG画像を最適化するためのモジュール
import imageminPngquant from 'imagemin-pngquant'; // PNG画像を最適化するためのモジュール
import imageminGifsicle from 'imagemin-gifsicle'; // GIF画像を最適化するためのモジュール
import imageminSvgo from 'imagemin-svgo'; // SVG画像を最適化するためのモジュール
import imageminWebp from 'imagemin-webp'; // webp変換するためのモジュール
import dir from './dir.mjs';
import deleteTask from './delete.mjs';
import isExcludedPath from './isExcludedPath.mjs';

const imgTask = async ({ watchEvent, watchPath }) => {
  const inputBaseDir = dir.src.img;
  const outputBaseDir = dir.dist.img;

  //* 3-1. WebPに変換可能な画像の圧縮処理内容
  const optimizeWebpConvertibleImages = async (srcPath, taskType) => {
    try {
      const imageminTask = async (inputPath) => {
        await imagemin([inputPath], {
          plugins: [
            imageminMozjpeg({ quality: 75 }), // 圧縮品質を75%にする
            imageminPngquant({ quality: [0.7, 0.8] }), // 圧縮品質を70%～80%の間にする
          ],

          // imagemin-keep-folder プラグインのオプションにてファイル構造を保持
          // 正規表現 /img\// を使って、出力先パス内の /img/ を ../dist/img/ に置換しています。これにより、元の画像の出力先フォルダが img から dist/img に変更されます。
          replaceOutputDir: (output) => {
            return output.replace(/img\//, path.join('../../', outputBaseDir));
          },
        });
        // await console.log(chalk.green('Image(jpg,jpeg,png) optimization  completed successfully.'));
      };

      let inputPath;

      //* 3-1-1. 全ファイルコピー（タスク開始時用）
      if (taskType == 'all') {
        const extension = '.{jpg,jpeg,png,JPG,JPEG,PNG}';
        inputPath = srcPath + extension;
        await imageminTask(inputPath);
      }

      //* 3-1-2. 1つのファイルをコピー（監視タスク用）
      if (taskType == 'one') {
        inputPath = srcPath;
        // ファイル種類を識別するための正規表現、'i'の部分は大文字、小文字を区別しないという意味
        const validExtensions = /\.(jpg|jpeg|png)$/i;
        if (
          validExtensions.test(inputPath) &&
          /////  !path.basename(inputPath).startsWith('_')
          !isExcludedPath({ basePath: inputBaseDir, targetPath: inputPath })
        ) {
          await imageminTask(inputPath);
        }
      }
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('optimizeWebpConvertibleImages')}.: ${chalk.bold.italic.bgRed(
          error.name,
        )} ${chalk.red(error.message)}`,
      );
    }
  };

  //* 3-2. WebPに変換不可能な画像の圧縮処理内容
  const optimizeNonWebpImages = async (srcPath, taskType) => {
    try {
      const imageminTask = async (inputPath) => {
        await imagemin([inputPath], {
          plugins: [imageminGifsicle(), imageminSvgo()],

          // imagemin-keep-folder プラグインのオプションにてファイル構造を保持
          // 正規表現 /img\// を使って、出力先パス内の /img/ を ../dist/img/ に置換しています。これにより、元の画像の出力先フォルダが img から dist/img に変更されます。
          replaceOutputDir: (output) => {
            return output.replace(/img\//, path.join('../../', outputBaseDir));
          },
        });
        // await console.log(chalk.green('Image(gif,svg) optimization  completed successfully.'));
      };

      let inputPath;

      //* 3-2-1. 全ファイルコピー（タスク開始時用）
      if (taskType == 'all') {
        const extension = '.{gif,svg,GIF,SVG}';
        inputPath = srcPath + extension;
        await imageminTask(inputPath);
      }

      //* 3-2-2. 1つのファイルをコピー（監視タスク用）
      if (taskType == 'one') {
        inputPath = srcPath;
        // ファイル種類を識別するための正規表現、'i'の部分は大文字、小文字を区別しないという意味
        const validExtensions = /\.(gif|svg)$/i;
        if (
          validExtensions.test(inputPath) &&
          /////  !path.basename(inputPath).startsWith('_')
          !isExcludedPath({ basePath: inputBaseDir, targetPath: inputPath })
        ) {
          await imageminTask(inputPath);
        }
      }
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('optimizeNonWebpImages')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
          error.message,
        )}`,
      );
    }
  };

  //* 3-3. Webpファイル生成の処理内容
  const generateWebpImages = async (srcPath, taskType) => {
    try {
      const imageminTask = async (inputPath) => {
        await imagemin([inputPath], {
          use: [imageminWebp({ quality: 75 })], // qualityを指定しないと稀にwebpが走らない場合があるので注意する。
          // imagemin-keep-folder プラグインのオプションにてファイル構造を保持
          // 正規表現 /img\// を使って、出力先パス内の /img/ を ../dist/img/ に置換しています。これにより、元の画像の出力先フォルダが img から dist/img に変更されます。
          replaceOutputDir: (output) => {
            return output.replace(/img\//, path.join('../../', outputBaseDir));
          },
        });
        // await console.log(chalk.green('WebP image generate completed successfully.'));
      };

      let inputPath;

      //* 3-3-1. 全ファイルコピー（タスク開始時用）
      if (taskType == 'all') {
        const extension = '.{jpg,jpeg,png,JPG,JPEG,PNG}';
        inputPath = srcPath + extension;
        await imageminTask(inputPath);
      }

      //* 3-3-2. 1つのファイルをコピー（監視タスク用）
      if (taskType == 'one') {
        inputPath = srcPath;
        // ファイル種類を識別するための正規表現、'i'の部分は大文字、小文字を区別しないという意味
        const validExtensions = /\.(jpg|jpeg|png)$/i;
        if (
          validExtensions.test(inputPath) &&
          /////  !path.basename(inputPath).startsWith('_')
          !isExcludedPath({ basePath: inputBaseDir, targetPath: inputPath })
        ) {
          await imageminTask(inputPath);
        }
      }
    } catch (error) {
      await console.error(
        `Error in ${chalk.underline('generateWebpImages')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
          error.message,
        )}`,
      );
    }
  };

  //* 3-4. 画像ファイル以外のファイルコピー処理内容（SVG、PDF等）
  const copyNotImages = async (srcPath, taskType) => {
    const copyNotImageFile = async ({ copyFilePath }) => {
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

        // await console.log(chalk.green('Not image file copied completed successfully.:'), chalk.underline(inputPath));
      } catch (error) {
        await console.error(
          `Error in ${chalk.underline('copyNotImageFile')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
            error.message,
          )}`,
        );
      }
    };

    //* 3-4-1. 全ファイルコピー（タスク開始時用）
    if (taskType == 'all') {
      // オプション内容について、
      // ignore：指定したディレクトリとディレクトリ配下のファイルを無視
      // nodir：ディレクトリにはマッチせず、ファイルにのみマッチする。
      // windowsPathsNoEscape：Windowsスタイルのパスセパレータを有効にする設定（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないが、'true'にすることでそれを使えるようにする）
      const copyFilePaths = await glob(path.join(inputBaseDir, '**/!(_)*'), {
        ignore: ['**/_*/**', '**/*.{jpg,jpeg,png,gif,svg,JPG,JPEG,PNG,GIF,SVG}'],
        nodir: true,
        windowsPathsNoEscape: true,
      });

      for (const copyFilePath of copyFilePaths) {
        await copyNotImageFile({ copyFilePath: copyFilePath });
      }
    }

    //* 3-4-2. 1つのファイルをコピー（監視タスク用）
    if (taskType == 'one') {
      // ファイル種類を識別するための正規表現、'i'の部分は大文字、小文字を区別しないという意味
      const validExtensions = /\.(jpg|jpeg|png|gif|svg)$/i;
      if (
        !validExtensions.test(watchPath) &&
        /////  !path.basename(srcPath).startsWith('_')
        !isExcludedPath({ basePath: inputBaseDir, targetPath: srcPath })
      ) {
        await copyNotImageFile({ copyFilePath: srcPath });
      }
    }
  };

  //* 2-1. 画像最適化の実行
  // 画像最適化の出力モード説明
  // ・noWebp … Webp画像を生成しない。
  // ・useIfPossible … Webp画像を生成する。
  // ・fallback … 通常の圧縮画像生成とWebp画像生成の両方を行う。
  const imageOptimizer = async (srcPath, taskType) => {
    const optimizationMode = 'noWebp';
    // const optimizationMode = 'useIfPossible';
    // const optimizationMode = 'fallback';
    try {
      switch (optimizationMode) {
        // noWebp … Webp画像を生成しない。
        case 'noWebp':
          await Promise.all([
            optimizeWebpConvertibleImages(srcPath, taskType),
            optimizeNonWebpImages(srcPath, taskType),
            copyNotImages(srcPath, taskType),
          ]);
          break;

        // useIfPossible … Webp画像を生成する。
        case 'useIfPossible':
          await Promise.all([
            generateWebpImages(srcPath, taskType),
            optimizeNonWebpImages(srcPath, taskType),
            copyNotImages(srcPath, taskType),
          ]);
          break;

        // fallback … 通常の圧縮画像生成とWebp画像生成の両方を行う。
        case 'fallback':
          await Promise.all([
            optimizeWebpConvertibleImages(srcPath, taskType),
            generateWebpImages(srcPath, taskType),
            optimizeNonWebpImages(srcPath, taskType),
            copyNotImages(srcPath, taskType),
          ]);
          break;

        default:
          throw new Error('Invalid webpMode');
        // await console.log(`Failed to delete. Invalid mode. Please specify ${chalk.underline(deleteMode)} correctly.`);
      }
    } catch {
      await console.error(
        `Error in ${chalk.underline('imageOptimizer')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
          error.message,
        )}`,
      );
    }
  };

  //* 2-2. 監視イベントが削除の場合の処理内容
  const deleteDist = async () => {
    const distPath = path.join(outputBaseDir, path.relative(inputBaseDir, watchPath));
    const extension = path.extname(watchPath); // 現在の拡張子を取得
    // ファイルパスの拡張子をwebpに変換
    const distPathWebp = path.join(path.dirname(distPath), path.basename(distPath, extension) + '.webp');

    // Promise.allを使ってタスクを並列で実行
    await Promise.all([
      deleteTask({ mode: 'one', path: distPath }), // webpではない画像ファイルを削除
      deleteTask({ mode: 'one', path: distPathWebp }), // webpの画像ファイルを削除
    ]);
  };

  //* 1. 実行
  try {
    //* 1-1. 実行監視タスクの監視イベントが削除の場合
    if (watchEvent === 'unlinkDir' || watchEvent === 'unlink') {
      // 監視イベントで削除を受け取った場合の処理
      await deleteDist();

      //* 1-2. 削除の監視イベントを受け取らなかった場合
    } else {
      //* 1-2-1 監視タスクの監視イベントが追加・変更の場合、監視で検知した該当する拡張子ファイルのみを圧縮（'_'で始まるディレクトリ名とファイル名は除く）
      if (watchPath) {
        if (
          (watchEvent === 'add' || watchEvent === 'change') &&
          !isExcludedPath({ basePath: inputBaseDir, targetPath: watchPath })
        ) {
          const srcPath = watchPath;
          const taskType = 'one';
          await imageOptimizer(srcPath, taskType);
        }

        //* 1-2-2. 監視タスク以外の場合は、全てのファイルを圧縮
      } else {
        const srcPath = path.join(inputBaseDir, '**/!(_)*');
        const taskType = 'all';
        await imageOptimizer(srcPath, taskType);
      }

      // 監視イベントがフォルダ追加だった場合、下記のログを表示しない（フォルダ追加操作のみで、画像圧縮処理を行っていない場合に圧縮完了ログの表示を出すのは不適切のため）
      // if (!(watchEvent === 'addDir')) {
      // await console.log(chalk.green('Image processing task completed.'));
      // }
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('imgTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
    );
  }
};

export default imgTask;

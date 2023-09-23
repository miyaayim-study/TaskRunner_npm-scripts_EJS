/************************************************
module
************************************************/
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk'; // ログのテキストを装飾する

/************************************************
my config
************************************************/
import dir from './dir.mjs';

/************************************************
my task
************************************************/
import ejsTask from './ejs.mjs';
import sassTask from './sass.mjs';
import jsTask from './esbuild.mjs';
import imgTask from './imagemin.mjs';
import deleteTask from './delete.mjs';
import watchTask from './watch.mjs';
import { server } from './server.mjs';
import eslint from './eslint.mjs';
import stylelint from './stylelint.mjs';
// import copyTask from './copy.mjs';
// import copyHtmlTask from './copyHtml.mjs';
// import copyPhpTask from './copyPhp.mjs';
// import copyCssTask from './copyCss.mjs';
// import copyJsTask from './copyJs.mjs';

/************************************************
execution
************************************************/
const executeTask = async ({ task, mode, type }) => {
  const taskFunction = task;
  try {
    await taskFunction({ mode: mode, type: type });
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline(taskFunction.name)}.: ${chalk.bold.italic.bgRed(
        error.name
      )} ${chalk.red(error.message)}`
    );
  }
};

const execution = async (mode, type) => {
  try {
    if (mode === 'build') {
      const deleteMode = 'all';
      await Promise.all([executeTask({ task: deleteTask, mode: deleteMode })]);
    }

    if (mode === 'development' || mode === 'build') {
      // 各タスクを並列で実行
      await Promise.all([
        executeTask({ task: ejsTask, mode: mode }),
        executeTask({ task: sassTask, mode: mode }),
        executeTask({ task: jsTask, mode: mode }),
        executeTask({ task: imgTask, mode: mode }),
        // executeTask({ task: copyHtmlTask, mode: mode }),
        // executeTask({ task: copyPhpTask, mode: mode }),
        // executeTask({ task: copyCssTask, mode: mode }),
        // executeTask({ task: copyJsTask, mode: mode }),
      ]);
    }

    if (mode === 'build') {
      await console.log(chalk.green('Build completed.'));
    }

    if (mode === 'development') {
      await Promise.all([
        server(),
        watchTask({ watchSrc: dir.src.ejs, task: ejsTask }),
        watchTask({ watchSrc: path.join(dir.src.sass, '**/*.scss'), task: sassTask, mode: mode }),
        watchTask({ watchSrc: path.join(dir.src.js, '**/*.js'), task: jsTask, mode: mode }),
        watchTask({ watchSrc: dir.src.img, task: imgTask }),
        // watchTask({ watchSrc: dir.src.html, task: copyHtmlTask, mode: mode }),
        // watchTask({ watchSrc: dir.src.php, task: copyPhpTask, mode: mode }),
        // watchTask({ watchSrc: dir.src.css, task: copyCssTask, mode: mode }),
        // watchTask({ watchSrc: dir.src.js, task: copyJsTask, mode: mode }),
      ]);
    }

    if (mode === 'build_one') {
      mode = 'development';
      if (type === 'ejs') {
        await executeTask({ task: ejsTask });
      }
      if (type === 'sass') {
        await executeTask({ task: sassTask, mode: mode });
      }
      if (type === 'js') {
        await executeTask({ task: jsTask, mode: mode });
      }
      if (type === 'img') {
        await executeTask({ task: imgTask });
      }
      // if (type === 'html') {
      //   await executeTask({ task: copyHtmlTask });
      // }
      // if (type === 'php') {
      //   await executeTask({ task: copyPhpTask });
      // }
      // if (type === 'css') {
      //   await executeTask({ task: copyCssTask });
      // }
      // if (type === 'js') {
      //   await executeTask({ task: copyJsTask });
      // }
    }

    if (mode === 'lint') {
      if (type === 'sass') {
        // scssファイルの構文チェック
        await stylelint();
      }
      if (type === 'js') {
        const isCodeStyle = true; // 構文+文法チェックのスタイルガイドを使用
        // JSファイルの構文+文法チェック
        await eslint({ filePath: dir.src.js, mode: isCodeStyle });
        // HTMLファイルのJS部分の構文+文法チェック
        const filePaths = await glob(path.join(dir.dist.html, '**/*.html'), {
          windowsPathsNoEscape: true,
        }); // オプションは、Windowsスタイルのパスセパレータを有効にしたい（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないがそれを使えるようにする）
        for (const filePath of filePaths) {
          await eslint({ filePath: filePath, mode: isCodeStyle });
        }
      }
    }

    if (mode === 'delete') {
      await executeTask({ task: deleteTask, mode: type });
    }
  } catch {
    await console.error(
      `Error in ${chalk.underline('execution')}: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(
        error.message
      )}`
    );
  } finally {
    await console.log(chalk.bgGreen.bold('All operations completed.'));
  }
};

const mode = process.argv[2]; // コマンドライン引数からmodeの値を取得
const type = process.argv[3]; // コマンドライン引数からtypeの値を取得
execution(mode, type);

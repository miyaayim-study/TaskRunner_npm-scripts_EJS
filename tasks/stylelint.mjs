// import path from 'path';
import chalk from 'chalk';
// import dir from './dir.mjs';
import stylelint from 'stylelint';

const lintCss = () => {
  // const inputBaseDir = dir.src.sass;
  // const inputPath = path.join(inputBaseDir, '**/*.scss');
  const inputPath = 'src/assets/sass/**/!(_reset|_font)*.scss'; // '_reset.scss'、'_font.scss'は除外した

  stylelint
    .lint({
      files: inputPath,
      // configFile: path.join(dir.config, '.stylelintrc.js'), // コンフィグファイルを移動する際に使用
      formatter: 'string', // 出力フォーマットを指定、これがないと日本語のエラーログにならない。
    })
    .then((data) => {
      if (data.errored) {
        console.error(data.output); // エラーメッセージをコンソールに出力
        // } else {
        // console.log(chalk.green('CSS Linting completed successfully.'));
      }
    })
    .catch((error) => {
      console.error(
        `Error in ${chalk.underline('stylelint')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
      );
    });
};

export default lintCss;

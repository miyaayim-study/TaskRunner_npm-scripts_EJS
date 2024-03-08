// import path from 'path';
import chalk from 'chalk';
import { ESLint } from 'eslint';
// import dir from './dir.mjs';

const lintJs = async ({ filePath, mode }) => {
  const inputPath = filePath;
  const codeStyle = mode;
  let eslint;

  // 構文チェックのみと構文チェック+文法チェックの2つのコンフィグファイルのどちらを使用するか
  if (codeStyle) {
    eslint = new ESLint({
      overrideConfigFile: '.eslintrc_codeStyle.js', // 設定ファイルのパス（構文チェック+スタイルガイドに合った文法チェックのみ）
    });
  } else {
    eslint = new ESLint({
      overrideConfigFile: '.eslintrc.js', // 設定ファイルのパス（構文チェックのみ）
    });
  }

  try {
    const results = await eslint.lintFiles([inputPath]); // 構文チェック
    const formatter = await eslint.loadFormatter('stylish'); // コンソールで読みやすいように自動整形
    const resultText = formatter.format(results); // 構文チェックの結果を自動整形してresultTextに格納

    if (resultText) {
      console.error(resultText);
      throw new Error('Linting failed. Please check the code for errors.');
      // } else {
      // await console.log(chalk.green('JavaScript Linting completed successfully.'));
    }
  } catch (error) {
    await console.error(
      `Error in ${chalk.underline('lintJs')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
    );
  }
};

export default lintJs;

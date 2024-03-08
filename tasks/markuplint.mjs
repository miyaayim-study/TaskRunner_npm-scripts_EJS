import { exec } from 'child_process';
import path from 'path';

// markuplintコマンドを実行する関数
const markuplint = async ({ filePath }) => {
  // 絶対パスで指定すると逆にエラーになる
  const configFilePath = '.markuplintrc.js';
  // そのままでは上手くいかなかったので絶対パスにした
  const checkFilePath = path.resolve(filePath);

  // CLIコマンド
  const command = `markuplint "${checkFilePath}" --config "${configFilePath}" --no-allow-empty-input`;

  // コマンドの実行
  exec(command, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
  });
};

export default markuplint;

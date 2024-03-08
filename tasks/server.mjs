// import chalk from 'chalk';
import dir from './dir.mjs';

import browserSync from 'browser-sync';
const browserSyncCreate = browserSync.create();

// ローカルサーバーを立ち上げる
const server = async () => {
  // browser-syncの初期化
  await browserSyncCreate.init({
    server: [dir.dist.root], // サーバーが提供する静的ファイルのルートパスを指定
    startPath: './index.html', // サーバーが起動したときに開かれるページのパス
    https: false, // HTTPSプロトコルを使用しない設定
    // host: 'localhost', // サーバーのホスト名をlocalhostに設定（open: 'external'とした場合はホスト名がIPアドレスとなるため無効）
    open: 'external', // 起動時に自動的に開くURLを決める、'external'は同じネットワークの端末からローカルサーバーにアクセス可能にする設定。
    ghostMode: false, // ブラウザ間の相互操作を無効化
    notify: false, // ブラウザに表示される小さなポップオーバー通知を無効化する設定
  });
  // await console.log(chalk.green('Local server has been started.'));
};

// ページをリロードする関数
const reload = async () => {
  await browserSyncCreate.reload(); // ブラウザをリロードする
};

export { server, reload };

import dir from './dir.mjs'; // ファイルパス格納

import browserSync from 'browser-sync';
const browserSyncCreate = browserSync.create();

// ローカルサーバーを立ち上げる関数
const server = () => {
  // browser-syncの初期化
  browserSyncCreate.init({
    server: [dir.dist.root], // サーバーが提供する静的ファイルのルートパスを指定
    startPath: './index.html', // サーバーが起動したときに開かれるページのパス
    https: false, // HTTPSプロトコルを使用しない設定
    // host: 'localhost', // サーバーのホスト名をlocalhostに設定（open: 'external'とした場合はホスト名がIPアドレスとなるため無効）
    open: 'external', // ブラウザを外部ウィンドウで開く設定
    ghostMode: false, // ブラウザ間の相互操作を無効化
    notify: false, // ブラウザの通知を無効化する設定
  });
};

// ページをリロードする関数
const reload = () => {
  browserSyncCreate.reload(); // ブラウザをリロードする
};

export { server, reload };

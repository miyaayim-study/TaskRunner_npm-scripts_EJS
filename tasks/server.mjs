import dir from './dir.mjs'; // ファイルパス格納

import browserSync from 'browser-sync';
const browserSyncCreate = browserSync.create();

// ローカルサーバーを立ち上げる関数
const server = () => {
  // browser-syncの初期化
  browserSyncCreate.init({
    open: 'external', // ブラウザを外部ウィンドウで開く設定
    notify: false, // ブラウザの通知を無効化する設定
    host: 'localhost', // サーバーのホスト名をlocalhostに設定
    ghostMode: false, // グローバルナビゲーション同期を無効化する設定
    server: [dir.dist.root], // サーバーが提供する静的ファイルのルートパスを指定
    https: false, // HTTPSプロトコルを使用しない設定
    startPath: './index.html', // サーバーが起動したときに開かれるページのパス
    // reloadDebounce: 100, // ページリロードのディレイ設定
  });
};

// ページをリロードする関数
const reload = () => {
  browserSyncCreate.reload(); // ブラウザをリロードする
};

export { server, reload };

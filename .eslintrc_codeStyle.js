/**
 * eslint Configuration
 */
module.exports = {
  env: {
    browser: true, // ブラウザ環境での実行を指定
    es2021: true,
  },
  extends: 'airbnb-base', // AirbnbのJavaScriptスタイルガイドを基準に検証
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest', // 最新のECMAScript仕様をサポート
    sourceType: 'module', // モジュール方式でのコードを解析
  },
  rules: {},
  plugins: [
    'html', // eslint-plugin-html プラグインを追加
  ],
};

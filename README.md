# メモ

- ルートディレクトリ配下にある、 '.prettierrc.js' 、 '.htmlhintrc.js' はVSC拡張機能で使用するためのファイルであり、このタスクランナーとは無関係のファイルです。
- HTMLHintをタスクランナーに導入は上手くできませんでした、代わりにMarkuplintを採用しました。
- '.eslintrc.js' などのコンフィグ関係のファイルを1つのフォルダーにまとめることが実現ができなかった為、すべてルートディレクトリ配下に配置しました。
- OSに依存したパスを吸収するように設計したが、Windows以外のPCでは未検証のため動作保証はできません。
- 画像圧縮はモード切り替えで3パターンの生成に変更可能。切り替えは'imagemin.mjs'で行ってください。

# 今後の改善点

- 画像圧縮は、'\_'で始まるディレクトリを除外するように設計できていません。
- 画像圧縮は 'sharp' を採用したい。
- 画像をwebpに変換時、自動で拡張指名を変更する機能。
- HTML、CSS、JSのファイルパス参照時、'src/' を自動で除去する機能。
- build後のファイルをブラウザ表示する機能

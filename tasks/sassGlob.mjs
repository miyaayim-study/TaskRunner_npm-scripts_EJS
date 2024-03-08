import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import slash from 'slash';

const sassGlob = (url) => {
  const inputPath = url; // ファイルパス（例：'src/css/sass/style.scss'）
  const basePath = path.dirname(inputPath); // ファイルのディレクトリパス（例：'src/css/sass'）
  let fileContents = fs.readFileSync(inputPath, 'utf8'); // ファイル内のデータ
  const reg = /^(?!\/\/)(@forward|@use)\s+["']([^"']+\*(\.scss)?)["'](| as \*)?/gm; // ファイル内で@forwardまたは@use文を特定する正規表現
  let result; // 変数を定義

  // @forwardまたは@use文を特定してresultに代入し一つずつ処理を行う、見つからなければnullを返す、ループは null が返されるまで続けられ、すべての一致が処理されるとループが終了します。
  while ((result = reg.exec(fileContents)) !== null) {
    const importRule = result[0]; // 特定したコード文の全文（例：@use "layout/**"）
    const directive = result[1]; // 特定したコード文の前半部分（例： @use）
    const globPattern = result[2]; // 特定したコード文のパス部分（例： layout/**）
    let imports = []; // 変数を定義して初期値を代入
    let isAs = false; // 変数を定義して空の配列で初期化
    let asRule = '*'; // 変数を定義して初期値を代入

    // コード内に'as'が存在していれば実行
    if (importRule.indexOf(' as ') !== -1) {
      isAs = true; // isAs 変数が true に設定されます。
      asRule = importRule.split(' as ').pop(); // 文字列を " as " で分割し、その後ろの部分（" as " の後の部分）を取得し、それを asRule 変数に代入します。
      asRule = asRule.replace(';', ''); // asRule に含まれているセミコロン (;) が削除されます。
    }

    // globした結果をfilesに代入
    let files = glob.sync(globPattern, {
      cwd: basePath, // 実行/マッチする現在の作業ディレクトリ
      windowsPathsNoEscape: true, // Windowsスタイルのパスセパレータを有効にする設定（通常、windowsのパス区切り文字であるバックスラッシュがglobでは使えないが、'true'にすることでそれを使えるようにする）
    });

    // filesに入ってるのを一つずつ繰り返し処理
    files.forEach((filename) => {
      // 拡張子がscssであれば実行
      if (path.extname(filename).toLowerCase() == '.scss') {
        filename = path.normalize(filename); // ファイルパスの正規化を行う（意味はわかるが、実際にこの場面で有効であるかは不明）（例：'layout\\_main.scss'）

        let importPath = `${directive} "${slash(filename)}"`; // filenameの区切り文字をスラッシュ ("/")に統一（OS依存に依存したパスを無くすため）、そして@～とそのパスをくっつけて元通りに近づける。
        // コード内に'as'が使われている場合実行
        if (isAs) {
          importPath = `${importPath} as ${asRule}`; // コードの末尾に 'as *'をつけて元通りに近づける。
        }
        imports.push(`${importPath};`); // コードの末尾に';'をつけて、元通りに近づける。そして、imports 配列に結果を追加する、繰り返し処理するのでどんどん追加されていく。
      }
    });

    const replaceString = imports.join('\n'); // 完成したimports配列の中身の各要素を改行（改行文字 (\n)）する。
    fileContents = fileContents.replace(importRule, replaceString); // ファイル内の特定したコード部分をglobした結果に書き換える
  }
  return fileContents; // 変換が終わったコードを次の処理に渡す。
};

export default sassGlob;

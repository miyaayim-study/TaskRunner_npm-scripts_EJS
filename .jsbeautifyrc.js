/**
 * js-beautify Configuration
 */
module.exports = {
  html: {
    indent_size: 2, // インデント幅
    indent_inner_html: true, // htmlタグ直下のheadタグ、bodyタグをインデント
    preserve_newlines: false, // 空行の許可設定。falseで空行を全て削除
    // max_preserve_newlines: 1, // タグ間で許可する最大空行数（preserve_newlines: falseの場合は無効）
    // end_with_newline: true, // 文書の最後に空行を用意するか
    // wrap_line_length: 0, // 一行あたりの最大文字数を設定（自動改行）
    // wrap_attributes_indent_size: 0, // 属性を新しい行に折り返す（属性が長い場合に改行）
    // 整形時にフォーマットしないタグ
    unformatted: [
      // 'b',
      // 'em',
      // 'a',
      // 'span',
      // 'img',
    ],
    // HTML内のJavaScriptとCSSを個別に設定可能、設定がない場合は上記の設定を継承
    css: {
      // indent_size: 2,
    },
    js: {
      // indent_size: 2,
    },
  },
};

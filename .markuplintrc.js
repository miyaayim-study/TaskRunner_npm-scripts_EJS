/**
 * markuplint Configuration
 */
module.exports = {
  extends: ['markuplint:recommended'],

  // // 「ルールの無効化」をスコープ化した「セレクタによる無効化」
  // nodeRules: [
  //   {
  //     // <svg> の子の <symbol>要素に適用
  //     selector: 'svg symbol',
  //     rules: {
  //       'ineffective-attr': false,
  //       'invalid-attr': false,
  //     },
  //   },
  // ],
};

const tab = () => {
  const triggersGroups = document.querySelectorAll('.js-tab-triggers');

  // `.js-tab-triggers`クラスを持つすべてのタブリストに対して処理を行います。
  // このクラスは各タブグループの親要素（ul）に適用されています。
  triggersGroups.forEach((group) => {
    // 各タブメニューからタブ項目（.js-tab-trigger）を取得します。
    const triggers = group.querySelectorAll('.js-tab-trigger');

    // 対応するコンテンツグループをdata属性を使って特定し、取得します。
    const targetsGroup = document.querySelector(`.js-tab-targets[data-targets="${group.dataset.triggers}"]`);

    // 取得したコンテンツグループから各コンテンツ項目（.js-tab-target）を取得します。
    const targets = targetsGroup.querySelectorAll('.js-tab-target');

    // 各タブ項目に対してイベントリスナーを設定します。
    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', () => {
        // すべてのタブ項目から'is-active'クラスを削除し、非アクティブ状態にします。
        // triggers.forEach((item) => item.classList.remove('is-active'));

        // すべてのタブの親要素（<li>）から'is-active'クラスを削除し、非アクティブ状態にします。
        triggers.forEach((item) => item.parentElement.classList.remove('is-active'));

        // クリックされたタブ項目に'is-active'クラスを追加し、アクティブ状態にします。
        // trigger.classList.add('is-active');

        // クリックされたタブの親要素（<li>）に'is-active'クラスを追加し、アクティブ状態にします。
        trigger.parentElement.classList.add('is-active');

        // すべてのコンテンツ項目から'is-show'クラスを削除し、非表示にします。
        targets.forEach((target) => {
          target.classList.remove('is-show');
        });

        // 対応するインデックスのコンテンツ項目に'is-show'クラスを追加し、表示します。
        targets[index].classList.add('is-show');
      });
    });
  });
};

export default tab;

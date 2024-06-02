const tab = () => {
  const tabGroups = document.querySelectorAll('.js-tab');

  // `.js-tab`クラスを持つすべてのタブリストに対して処理を行います。
  tabGroups.forEach((group) => {
    // 各タブ内の`.js-tab-trigger`要素にイベントリスナーを設定します。
    const triggers = group.querySelectorAll('.js-tab-trigger');
    const targets = group.querySelectorAll('.js-tab-target');

    // 各タブトリガーに対してイベントリスナーを設定します。
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        // すべてのタブトリガーの親要素から'is-active'クラスを削除します。
        triggers.forEach((t) => t.parentElement.classList.remove('is-active'));
        // クリックされたタブの親要素に'is-active'クラスを追加し、アクティブ状態にします。
        trigger.parentElement.classList.add('is-active');

        // すべてのコンテンツ項目から'is-show'クラスを削除し、非表示にします。
        targets.forEach((target) => target.classList.remove('is-show'));
        // 対応するコンテンツ項目に'is-show'クラスを追加し、表示します。
        const targetId = trigger.dataset.trigger;
        const targetToShow = group.querySelector(`.js-tab-target[data-target="${targetId}"]`);
        if (targetToShow) {
          targetToShow.classList.add('is-show');
        }
      });
    });
  });
};

export default tab;

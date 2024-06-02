const accordion = () => {
  const toggleButtons = document.querySelectorAll('.js-toggle__button');
  //対象が存在しない場合は終了
  if (toggleButtons.length === 0) {
    return;
  }

  //真偽値を文字列で返す
  function getBooleanString(boolean) {
    return boolean.toString();
  }

  toggleButtons.forEach((toggleButton) => {
    //開閉パネルを取得
    const targetPanelId = toggleButton.getAttribute('aria-controls');
    const targetPanel = document.getElementById(targetPanelId);
    //開閉パネルが存在しない場合はイベントを設定しない
    if (!targetPanel) {
      return;
    }
    toggleButton.addEventListener('click', function () {
      //パネルが開いているかどうかチェック
      const isOpen = targetPanel.getAttribute('aria-hidden') === 'false';
      //アクセシビリティ対応・表示を切り替え
      toggleButton.setAttribute('aria-expanded', getBooleanString(!isOpen));
      targetPanel.setAttribute('aria-hidden', getBooleanString(isOpen));
    });
  });
};

export default accordion;

// グループ化し、グループ内では同時に2つ以上のアコーディオンは開かない
const accordion = () => {
  const accordionGroups = document.querySelectorAll('.js-accordion');

  accordionGroups.forEach((group) => {
    const triggers = group.querySelectorAll('.js-accordion-trigger');

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        // 他のすべてのアコーディオンの内容を閉じ、クラスを削除する
        const otherTriggers = Array.from(triggers).filter((t) => t !== trigger);
        otherTriggers.forEach((otherTrigger) => {
          const header = otherTrigger.parentElement;
          const content = header.nextElementSibling;
          header.classList.remove('is-active');
          content.classList.remove('is-show');
        });

        // クリックされたアコーディオンの内容をトグルする
        const header = trigger.parentElement;
        const content = header.nextElementSibling;
        header.classList.toggle('is-active');
        content.classList.toggle('is-show');
      });
    });
  });
};

export default accordion;

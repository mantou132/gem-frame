export const urlChangeTarget = new EventTarget();

let href = location.href;
function check() {
  requestAnimationFrame(() => {
    if (location.href !== href) {
      href = location.href;
      urlChangeTarget.dispatchEvent(new CustomEvent('change'));
    }
    check();
  });
}
check();

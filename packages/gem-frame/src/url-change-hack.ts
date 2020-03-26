const pushState = history.pushState.bind(history);

const target = new EventTarget();

function fireChangeEvent() {
  // url change is async
  setTimeout(() => {
    target.dispatchEvent(new CustomEvent('change'));
  }, 30);
}

Object.defineProperties(history, {
  pushState: {
    configurable: true,
    value(...rest: any[]) {
      fireChangeEvent();
      pushState(...rest);
    },
  },
});

export default target;

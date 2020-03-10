import { generateProxy, getAbsolutePath } from '../utils';

import GemFrame from '../index';

export function getHistory(frameElement: GemFrame) {
  const taget = {
    get length() {
      return history.length;
    },
    get state() {
      return history.state;
    },
    get scrollRestoration() {
      return history.scrollRestoration;
    },

    back() {
      history.back();
    },
    go(data?: number) {
      history.go(data);
    },
    forward() {
      history.forward();
    },
    pushState: (data: any, title: string, path: string) => {
      history.pushState(data, title, getAbsolutePath(path, frameElement.basepath));
    },
    replaceState: (data: any, title: string, path: string) => {
      history.replaceState(data, title, getAbsolutePath(path, frameElement.basepath));
    },
  };

  return generateProxy(taget, taget, {}, {});
}

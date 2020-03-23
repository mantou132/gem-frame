import { generateProxy, getAbsolutePath } from '../utils';

import GemFrame from '../index';

const ROOT = '/~root/';

export function getHistory(frameElement: GemFrame) {
  function getPath(path: string) {
    if (path.startsWith(ROOT)) {
      return path.replace(ROOT, '/');
    } else {
      return getAbsolutePath(path, frameElement.basepath);
    }
  }
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
      history.pushState(data, title, getPath(path));
    },
    replaceState: (data: any, title: string, path: string) => {
      history.replaceState(data, title, getPath(path));
    },
  };

  return generateProxy(taget, taget, {}, {});
}

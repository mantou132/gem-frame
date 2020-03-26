import { generateProxy, getRelativePath } from '../utils';

import GemFrame from '../index';

export function getLocation(frameElement: GemFrame) {
  const allowWriteLocation = {
    set href(v: string) {
      location.href = v;
    },
  };

  const target = {
    toString() {
      return this.href;
    },
    replace(s: string) {
      // location.replace(s);
    },
    reload(s: boolean) {
      location.reload(s);
    },
    assign(s: string) {
      // location.assign(s);
    },
    get host() {
      return location.host;
    },
    get origin() {
      return location.origin;
    },
    get search() {
      return location.search;
    },
    get hash() {
      return location.hash;
    },
    get protocol() {
      return location.protocol;
    },
    get port() {
      return location.port;
    },
    get pathname() {
      return getRelativePath(location.pathname, frameElement.basepath);
    },
    get href() {
      return `${location.origin}${this.pathname}${location.search}`;
    },
  };

  return generateProxy(target, target, {}, allowWriteLocation);
}

/**
 * !!! 没有提供真正的沙箱和安全，因为共享 DOM
 *
 * 例如:
 *
 * * `Node.ownerDocument` 就能访问到原始 `document` 对象
 * * `<script>` 能执行任意代码
 */
import GemFrame from '../index';

import { getWindow } from './window';
import { getDocument } from './document';

// React 事件系统使用 `ownerDocument` 监听事件，无法拦截
// 导致 `Event.target` 错误
// 这里修正了 `Event.target` 的问题，但是可能对外部系统产生影响
Object.defineProperty(Event.prototype, 'target', {
  configurable: true,
  get() {
    return this.composedPath()[0];
  },
});

export function getGlobalObject(frameElement: GemFrame) {
  const { allowReadWindow, globalProxy } = getWindow(frameElement);
  const documentProxy = getDocument(frameElement);

  return Object.assign(allowReadWindow, {
    document: documentProxy,
    window: globalProxy,
    global: globalProxy, // webpack dev 下会读取，chrome 会检测类型导致发生错误，类型检测原因不明，有可能是过时标准的问题
    globalThis: globalProxy,
    self: globalProxy,
    ...frameElement.context,
  });
}

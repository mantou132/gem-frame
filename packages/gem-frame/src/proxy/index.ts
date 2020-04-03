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

  return Object.assign(allowReadWindow, {
    window: globalProxy,
    globalThis: globalProxy,
    self: globalProxy,
    parent: window.parent === window ? globalProxy : window.parent,
    // `window.top` 在 chrome 中不可配置，不能使用代理进行访问，只能使用 `top` 访问？
    // top: window.top === window ? globalProxy : window.top,
    top: window.top,
    ...frameElement.context,
  });
}

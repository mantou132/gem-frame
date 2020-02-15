import { html, GemElement } from '@mantou/gem/lib/element';
import { attribute, customElement, emitter } from '@mantou/gem/lib/decorators';
import Realm from 'realms-shim';

import { setProxy } from './proxy';

const fetchedScript = new Set();

/**
 * @attr src
 * @attr tag
 * @fires error
 */
@customElement('gem-frame')
export default class GemFrame extends GemElement {
  // 资源路径，支持 html, json, js
  @attribute src: string;
  // 自定义元素 tagName
  @attribute tag: string;
  // 加载执行时发生错误, `event.detail` 获取该错误对象
  @emitter error: Function;

  private app: GemElement;

  async fetchScript() {
    if (!this.src) return;
    if (fetchedScript.has(this.src)) return;
    let src = this.src.startsWith('//') ? `${location.protocol}${this.src}` : this.src;
    let doc: Document;
    const url = new URL(src, location.origin);
    if (url.pathname.endsWith('.json')) {
      // webpack manifest
      // 假设第一个字段就是 output
      // 相对路径可能有问题
      const manifest = await (await fetch(`${src}?t=${Date.now()}`)).json();
      src = new URL(manifest[Object.keys(manifest)[0]], url).toString();
    } else if (url.pathname.endsWith('.js')) {
      // 不能自动更新
      src = this.src;
    } else {
      // html
      const text = await (await fetch(`${src}?t=${Date.now()}`)).text();
      const parse = new DOMParser();
      doc = parse.parseFromString(text, 'text/html');
      const script: HTMLScriptElement = doc.querySelector('script[src]');
      const { pathname, search } = new URL(script.src);
      src = new URL(`${pathname}${search}`, url).toString();
    }
    if (!src) return; // 静默失败
    const text = await (await fetch(src)).text();
    const r = Realm.makeRootRealm({ errorHandler: this.errorEventHandler });
    try {
      r.evaluate(text, setProxy(this, this.app, doc));
    } catch (err) {
      this.error(err);
    }
    fetchedScript.add(this.src);
  }

  private updateElement() {
    if (this.app) this.app.remove();
    if (!this.tag) {
      this.app = this;
    } else {
      this.app = document.createElement(this.tag) as GemElement;
      // 错误传播
      this.app.onerror = (err: CustomEvent) => this.error(err.detail);
      this.shadowRoot.append(this.app);
    }
  }

  private errorEventHandler = ({ error }: ErrorEvent) => {
    this.error(error);
  };

  render() {
    return html`
      <style>
        :host {
          all: initial;
          display: block;
        }
        ${this.tag || ':host'} {
          border: none;
          overflow: scroll;
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
    `;
  }

  mounted() {
    this.updateElement();
    this.fetchScript();
  }

  attributeChanged(name: string) {
    if (name === 'src') {
      this.fetchScript();
    }
    if (name === 'tag') {
      this.updateElement();
    }
  }
}

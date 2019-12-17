import { html, GemElement } from '@mantou/gem/lib/element';
import Realm from 'realms-shim';

import proxy from './proxy';

const fetchedScript = new Set();

class GemFrame extends GemElement {
  /**@attr */ src: string;
  /**@attr */ tag: string;
  static observedAttributes = ['src', 'tag'];

  get useIFrame() {
    return !this.tag;
  }

  fetchScript = async () => {
    if (!this.src) return;
    if (fetchedScript.has(this.src)) return;
    let src = this.src.startsWith('//') ? `${location.protocol}${this.src}` : this.src;
    if (src.endsWith('.json')) {
      // webpack manifest
      // 相对路径可能有问题
      const manifest = await (await fetch(`${src}?t=${Date.now()}`)).json();
      src = new URL(manifest.main || manifest.index, src).toString();
    } else if (this.src.endsWith('.js')) {
      // 不能自动更新
      src = this.src;
    } else {
      // html
      const text = await (await fetch(`${src}?t=${Date.now()}`)).text();
      const parse = new DOMParser();
      const doc = parse.parseFromString(text, 'text/html');
      const script: HTMLScriptElement = doc.querySelector('script[src]');
      const { pathname, search } = new URL(script.src);
      src = new URL(`${pathname}${search}`, src).toString();
    }
    if (!src) return; // 静默失败
    const text = await (await fetch(src)).text();
    const r = Realm.makeRootRealm();
    // TODO: 将 event listener 等函数分配到 `this.element` 上，防止内存泄漏
    // 设置代理对象
    Object.assign(r.global, proxy);
    r.evaluate(text);
    fetchedScript.add(this.src);
  };

  element: HTMLElement;

  appendElement() {
    if (this.element) {
      // TODO：清除 event listener
      this.element.remove();
    }
    this.element = document.createElement(this.tag);
    this.shadowRoot.append(this.element);
  }

  mounted() {
    if (!this.useIFrame) {
      this.appendElement();
      this.fetchScript();
    }
  }
  render() {
    return html`
      <style>
        :host {
          display: block;
        }
        ${this.tag || 'iframe'} {
          border: none;
          overflow: scroll;
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
      ${this.useIFrame
        ? html`
            <iframe src=${this.src}></iframe>
          `
        : ''}
    `;
  }
  attributeChanged(name: string) {
    if (name === 'src') {
      this.fetchScript();
    }
    if (name === 'tag') {
      this.appendElement();
    }
  }
}

customElements.define('gem-frame', GemFrame);

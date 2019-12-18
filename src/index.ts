import { html, GemElement } from '@mantou/gem/lib/element';
import Realm from 'realms-shim';

import { setProxy } from './proxy';

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
    let doc: Document;
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
      doc = parse.parseFromString(text, 'text/html');
      const script: HTMLScriptElement = doc.querySelector('script[src]');
      const { pathname, search } = new URL(script.src);
      src = new URL(`${pathname}${search}`, src).toString();
    }
    if (!src) return; // 静默失败
    const text = await (await fetch(src)).text();
    const r = Realm.makeRootRealm();
    // 设置代理对象
    setProxy(r, this.element, doc);
    r.evaluate(text);
    fetchedScript.add(this.src);
  };

  element: GemElement;
  svg: HTMLOrSVGElement; // icon

  appendElement() {
    if (this.element) {
      this.element.remove();
    }
    this.element = document.createElement(this.tag) as GemElement;
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

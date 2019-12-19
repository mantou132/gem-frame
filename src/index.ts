import { html, GemElement, attribute, property, customElement, connectStore, history } from '@mantou/gem';
import Realm from 'realms-shim';

import { setProxy } from './proxy';

const fetchedScript = new Set();

type FrameElement = GemElement & { [index: string]: any };

/**
 * @attr src
 * @attr tag
 */
@customElement('gem-frame')
@connectStore(history.historyState)
export default class GemFrame extends GemElement {
  @attribute src: string;
  @attribute tag: string;
  @property data: any;

  private element: FrameElement;

  get useIFrame() {
    return !this.tag;
  }

  private async fetchScript() {
    if (!this.src) return;
    if (fetchedScript.has(this.src)) return;
    let src = this.src.startsWith('//') ? `${location.protocol}${this.src}` : this.src;
    let doc: Document;
    if (src.endsWith('.json')) {
      // webpack manifest
      // 相对路径可能有问题
      const manifest = await (await fetch(`${src}?t=${Date.now()}`)).json();
      src = new URL(manifest.main || manifest.index, new URL(src, location.origin)).toString();
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
      src = new URL(`${pathname}${search}`, new URL(src, location.origin)).toString();
    }
    if (!src) return; // 静默失败
    const text = await (await fetch(src)).text();
    const r = Realm.makeRootRealm();
    // 设置代理对象
    setProxy(r, this.element, doc);
    r.evaluate(text);
    fetchedScript.add(this.src);
  }

  private appendElement() {
    if (this.element) this.element.remove();
    this.element = document.createElement(this.tag) as FrameElement;
    this.element.data = this.data;
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
  propertyChanged(name: string, _oldValue: any, value: any) {
    if (this.element) this.element[name] = value;
  }
}

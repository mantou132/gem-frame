import { html, GemElement } from '@mantou/gem';
import Realm from 'realms-shim';

class GemFrame extends GemElement {
  /**@attr */ src: string;
  /**@attr */ tag: string;
  static observedAttributes = ['src', 'tag'];

  fetchScript = async () => {
    if (customElements.get(this.tag)) return;
    const res = await fetch(this.src);
    const text = await res.text();
    const r = Realm.makeRootRealm();
    r.global.console = console;
    r.global.document = document;
    r.global.window = window;
    r.global.navigator = navigator;
    r.global.HTMLElement = HTMLElement;
    r.global.customElements = customElements;
    r.global.URLSearchParams = URLSearchParams;
    r.global.CustomEvent = CustomEvent;
    r.evaluate(text);
  };

  mounted() {
    this.shadowRoot.append(document.createElement(this.tag));
    this.fetchScript();
  }
  render() {
    return html`
      <style>
        :host {
          display: contents;
        }
      </style>
    `;
  }
  attributeChanged(name: string) {
    if (name === 'src') {
      this.fetchScript();
    }
  }
}

customElements.define('gem-frame', GemFrame);

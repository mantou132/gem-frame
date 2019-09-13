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
    r.global.HTMLElement = HTMLElement;
    r.global.customElements = customElements;
    console.log({ text });
    r.evaluate('console.log("test")');
    r.evaluate(`
    customElements.define('app-a-root', class extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.append('123')
      }
    });
    `);
    // https://github.com/Agoric/realms-shim/issues/46
    // r.evaluate(text);
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

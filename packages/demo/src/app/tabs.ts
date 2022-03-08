import { GemElement, html } from '@mantou/gem';

import routes from './routes';

import '@mantou/gem/elements/link';

const tabs = routes.filter(e => !e.tabIgnore);

class Tabs extends GemElement {
  render() {
    return html`
      <style>
        :host {
          display: flex;
          line-height: 2;
        }
        gem-active-link {
          margin: 0 1em;
          padding: 0 0.5em;
          border-bottom: 4px solid transparent;
          text-decoration: none;
          color: black;
        }
        gem-active-link:where([data-active], :--active) {
          border-bottom-color: blue;
        }
      </style>
      ${tabs.map(
        route =>
          html`
            <gem-active-link path=${route.pattern}>${route.title}</gem-active-link>
          `,
      )}
    `;
  }
}
customElements.define('a-tabs', Tabs);

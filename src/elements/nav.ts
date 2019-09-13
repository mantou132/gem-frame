import { GemElement, html } from '@mantou/gem';
import '@mantou/gem/elements/link';

import routes from '../routes';

class Nav extends GemElement {
  render() {
    return html`
      <style>
        :host {
          display: block;
          text-align: center;
        }
        gem-link {
          display: inline-block;
        }
        gem-link:hover {
          cursor: pointer;
        }
        gem-link[active] {
          text-decoration: underline;
          color: green;
        }
      </style>
      <gem-link .route=${routes.home}>Home</gem-link>
      <gem-link .route=${routes.about}>About</gem-link>
    `;
  }
}

customElements.define('app-nav', Nav);

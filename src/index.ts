import { html, GemElement } from '@mantou/gem';

import '@mantou/gem/elements/route';
import '@mantou/gem/elements/title';
import './elements/nav';
import routes from './routes';

class App extends GemElement {
  render() {
    return html`
      <style>
        app-nav {
          margin-top: 5em;
        }
      </style>
      <app-nav></app-nav>
      <gem-route .routes=${routes}></gem-route>
    `;
  }
}

customElements.define('app-root', App);

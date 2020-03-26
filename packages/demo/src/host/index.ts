import { GemElement, html, render } from '@mantou/gem';

import '@mantou/gem/elements/route';

import './app-header';
import './app-sidebar';

import routes from './routes';

class App extends GemElement {
  render() {
    return html`
      <style>
        :host {
          display: grid;
          grid-template-columns: 220px auto;
          grid-template-rows: 64px auto;
          width: 100vw;
          height: 100vh;
        }
      </style>
      <app-header></app-header>
      <app-sidebar></app-sidebar>
      <gem-route .routes=${routes}></gem-route>
    `;
  }
}
customElements.define('app-root', App);

render(
  html`
    <style>
      body {
        margin: 0;
      }
    </style>
    <app-root></app-root>
  `,
  document.body,
);

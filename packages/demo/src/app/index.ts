import { GemElement, html, render } from '@mantou/gem';

import '@mantou/gem/elements/route';

import './app-a-tabs';

import routes from './routes';

export default class App extends GemElement {
  mounted() {
    window.addEventListener('click', console.log);
    return () => {
      window.removeEventListener('click', console.log);
    };
  }
  render() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }
      </style>
      <app-a-tabs></app-a-tabs>
      <gem-route .routes=${routes}></gem-route>
    `;
  }
}
customElements.define('app-a-root', App);

render(
  html`
    <style>
      html,
      body {
        margin: 0;
        width: 100%;
        height: 100%;
      }
    </style>
    <app-a-root></app-a-root>
  `,
  document.body,
);

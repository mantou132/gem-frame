import { GemElement, html } from '@mantou/gem';

class Header extends GemElement {
  render() {
    return html`
      <style>
        :host {
          background: black;
          color: white;
          grid-row: 1/2;
          grid-column: 1/3;
          display: flex;
        }
        .logo {
          font-size: 48px;
          font-weight: bold;
          font-family: Arial, Helvetica, sans-serif;
          padding: 0 24px;
        }
      </style>
      <div class="logo">LOGO</div>
    `;
  }
}
customElements.define('app-header', Header);

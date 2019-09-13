import { GemElement, html } from '@mantou/gem';

class About extends GemElement {
  render() {
    return html`
      <p>这是个模板 App</p>
      <p>包含 Route，Store 以及基于函数的 Action</p>
    `;
  }
}

customElements.define('app-about', About);

import { GemElement, html } from '@mantou/gem';

class Dynamic extends GemElement {
  render() {
    return html`
      这是动态加载的
    `;
  }
}
customElements.define('app-a-dynamic', Dynamic);

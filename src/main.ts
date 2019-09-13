import { render, html } from '@mantou/gem';
import './';

render(
  html`
    <gem-frame tag="app-a-root" src="https://mantou132.github.io/gem-microfe/dist/app/index.js"></gem-frame>
  `,
  document.body,
);

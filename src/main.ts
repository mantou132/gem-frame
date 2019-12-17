import { render, html } from '@mantou/gem';
import './';

render(
  html`
    <style>
      * {
        box-sizing: border-box;
      }
      gem-frame {
        border: 2px solid;
        width: 600px;
        height: 300px;
      }
    </style>
    <gem-frame tag="app-a-root" src="https://mantou132.github.io/gem-microfe/dist/app/"></gem-frame>
  `,
  document.body,
);

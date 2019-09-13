import { render, html } from '@mantou/gem';
import './';

render(
  html`
    <style>
      html,
      body {
        height: 100%;
      }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
          'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      app-root {
        width: 50%;
      }
    </style>
    <app-root></app-root>
  `,
  document.body,
);

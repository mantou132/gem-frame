import { render, html } from '@mantou/gem';
import './';

const errorHandle = (e: ErrorEvent) => {
  console.log('<gem-frame> capture:', e);
};

render(
  html`
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        font-family: sans-serif;
      }
      gem-frame {
        border: 2px solid;
        width: 600px;
        height: 300px;
      }
    </style>
    <gem-frame @error=${errorHandle} src="https://gem-microfe.netlify.com/react/"></gem-frame>
    <gem-frame @error=${errorHandle} tag="app-a-root" src="https://gem-microfe.netlify.com/app/"></gem-frame>
  `,
  document.body,
);

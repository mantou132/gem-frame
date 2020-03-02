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
    <h1>React App</h1>
    <gem-frame @error=${errorHandle} src="https://gem-microfe.netlify.com/react/"></gem-frame>
    <h1>Gem App</h1>
    <gem-frame @error=${errorHandle} tag="app-a-root" src="https://gem-microfe.netlify.com/app/"></gem-frame>
  `,
  document.body,
);

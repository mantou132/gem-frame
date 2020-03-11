import { render, html } from '@mantou/gem';
import './';

function errorHandle(e: ErrorEvent) {
  console.log(this, e);
}

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
    <gem-frame
      keep-alive="on"
      basepath="/r"
      @error=${errorHandle}
      src="https://gem-microfe.netlify.com/react/"
    ></gem-frame>
    <h1>Vue App</h1>
    <gem-frame basepath="/v" @error=${errorHandle} src="https://gem-microfe.netlify.com/vue/"></gem-frame>
  `,
  document.body,
);

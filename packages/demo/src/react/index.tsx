import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';

import './index.css';

const container = document.createElement('div');
container.classList.add('main');
ReactDOM.render(<App />, document.body.appendChild(container));

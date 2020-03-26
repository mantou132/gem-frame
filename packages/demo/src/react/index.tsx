import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import App from './App';

const container = document.createElement('div');
container.classList.add('main');
ReactDOM.render(<App />, document.body.appendChild(container));

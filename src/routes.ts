import { html } from '@mantou/gem';
import { RouteItem } from '@mantou/gem/elements/route';

import './pages/home';
import './pages/about';

const home: RouteItem = {
  title: 'Home',
  pattern: '/',
  content: html`
    <app-home></app-home>
  `,
};

const about: RouteItem = {
  title: 'About',
  pattern: '/about',
  content: html`
    <app-about></app-about>
  `,
};

export default {
  home,
  about,
};

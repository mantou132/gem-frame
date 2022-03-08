import { html } from '@mantou/gem';
import type { RouteItem } from '@mantou/gem/elements/route';
import '@mantou/gem/elements/title';

// 由于使用自定义元素，所以必须使用全路径
export default [
  {
    title: '页面 AA',
    pattern: '/a/a',
    content: html`
      <p>这是页面 AA</p>
      <p>这是个独立应用，独立打包，独立部署</p>
      <p>上面的标签可以在当前 app 里面导航</p>
    `,
  },
  {
    title: '页面 AB',
    pattern: '/a/b',
    content: html`
      这是页面 AB
    `,
  },
  {
    title: '页面 AC',
    pattern: '/a/c',
    content: html`
      这是页面 AC
    `,
  },
  {
    title: '页面 AD',
    pattern: '/a/d',
    content: html`
      这是页面 AD
    `,
  },
  {
    title: '动态路由',
    pattern: '/a/e',
    get content() {
      import('./dynamic');
      return html`
        <app-a-dynamic></app-a-dynamic>
      `;
    },
  },
] as (RouteItem & { tabIgnore: boolean })[];

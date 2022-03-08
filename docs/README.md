# 介绍

`<gem-frame>` 是一个自定义元素，就像 `<iframe>` 一样加载另一个 WebApp，它主要做到了下面几件事情：

- 隔离 CSS
- 隔离 JS
- 同步 URL
- 支持 Fixed 布局

_注意：`<gem-frame>` **不能保证安全性**，它只是尽量减少对宿主应用的影响，只能用来加载可信内容_

## 工作方式

1. 创建一个 `<iframe>` 以获取一个全新的 js 执行环境
2. 使用 `<iframe>` 内的 [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function) 构造函数和 [`with`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with) 语法提供一个全新的执行上下文，代理 `window`, `document`, `history`, `location` 等等
3. 使用 `<iframe>` 内的 [`eval`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) 执行远端 js 代码
4. 由于全局对象被代理，所以 WebApp 将挂载到 `<gem-frame>` 的 [`ShadowRoot`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) 上

## 应用场景

- 前端微服务（[Demo](https://frame-example.gemjs.org)）

## 使用方式

```html
<gem-frame src="https://your.app.url"></gem-frame>
```

虽然看起来和 `<iframe>` 一样使用，但是，`<gem-frame>` 并不能完全代替 `<iframe>`，接下来将介绍它的限制。

# 限制

`<gem-frame>` 中渲染的子应用虽然在一个全新的匿名上下文中执行，但是由于 DOM 和宿主环境处在同一个 Document 中，所以会有诸多限制。

## SOP

子应用的资源受 [SOP](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) 限制，
为了全部子应用正确加载并渲染，需要让其和宿主环境同源或者为子应用所有资源启用 [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)。

## Custom Element

你不应该在 `<gem-frame>` 加载的应用中定义自定义元素，因为无法保证外部是否已经定义过该元素，
解决方法是在宿主应用中定义并进行统一自定义元素管理，避免在 `<gem-frame>` 中加载的应用发生自定义元素冲突。

_未来也许有基于范围的自定义元素，[详情](https://github.com/WICG/webcomponents/issues/716)_

## JavaScript

- `<gem-frame>` 中的内容执行在一个新的环境中，但由于和宿主环境共享 Document，所以某些关于 DOM 的操作会比较怪异，比如下面这个表达式将返回 `false`：

  ```js
  document.createElement('div') instanceof Object;
  ```

- 不能使用 ES Module，如果使用现代前端构建系统如 Webpack 来部署子应用时则不需要担心此问题
- 由于使用了 `eval` ，所以还要确保宿主应用 [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src) 正确配置
- 使用 `eval` 可能会有性能上的损失

## DOM

虽然不能在子应用中直接访问到宿主环境的 `document` 对象, 但是可以通过 DOM 的属性最终访问到：

```js
Node.ownerDocument;
```

应尽量避免使用类似的方式访问宿主环境原生对象，以免影响宿主环境。

## CSS

和 `<iframe>` 不同的是 `<gem-frame>` 并没有独立的 `origin`，
所以 `<link>` 以及 CSS Image、Font 都需要使用绝对路径，否则可能加载不到正确的资源。

另外，`<gem-frame>` 没有重写子应用的 CSS 代码，所以子应用中有些 CSS 代码将失去作用，例如：

```css
html,
body {
  --height: 56px;
}
```

相应的，你应该再添加一个 `:host` 选择器以兼容 `<gem-frame>`：

```css
html,
body,
:host {
  --height: 56px;
}
```

_目前 `:host` 下面的原生 CSS 规则还需要添加 `!important`，当然可以改用你的应用挂载根元素选择器_

另外要慎重使用一些“视口”相关的 CSS 功能：`rem`, `vw`, `vh`, `vmax`, `vmin` 等单位以及 [`@media`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media)，你应该仔细思考他们在 `<gem-frame>` 中的工作是否符合你的预期。

如果你的子应用使用了类似 [`mini-css-extract-plugin`](https://github.com/webpack-contrib/mini-css-extract-plugin)的插件，那么子应用加载时由于样式是异步加载所以会闪烁，避免使用类似的样式抽取技术而应该使用内联样式。

## 第三方库

你可以使用满足以上限制的任意第三方库，例如 `React`, `Vue` 等等，当然也可以从宿主环境共享这些对象到 `<gem-frame>` 中，
避免不必要的重复加载，详情请查看进阶部分。

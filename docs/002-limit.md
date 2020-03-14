# 限制

`<gem-frame>` 中  的代码虽然在一个全新的环境中执行的，但是由于 DOM 共享，你需要注意以下限制。

## SOA

子 App 的内容需要符合同源安全策略，也就是说和宿主环境同源或者为子应用所有资源启动 CORS。

## Custom Element

你不应该在 `<gem-frame>` 中定义自定义元素，因为自定义元素不能重复定义，
当你在多个 `<gem-frame>` 定义相同标签的自定义元素时将出现冲突。
但仍然可以在 `<gem-frame>` 外面定义，并在 `<gem-frame>` 中使用。

## JavaScript

`<gem-frame>` 中是一个新的执行环境，但由于和宿主环境共享 DOM，所以下面的表达式将和平时你认为的结果不一样：

```js
document.createElement('div') instanceof Object; // false
```

另外不能使用 ES Module，不过不影响使用现代前端构建系统如 Webpack；
由于使用了 `eval` ，所以还要确保 [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src) 正确配置。

## DOM

虽然不能直接访问到宿主环境的 `document` 对象, 但是可以通过 DOM 的属性最终访问到：

```js
Node.ownerDocument;
```

应尽量避免使用类似的方式访问宿主环境原生对象，以免影响宿主环境。

## CSS

`<gem-frame>` 并没有重写你的 CSS 代码，所以有些 CSS 代码将失去作用，例如：

```css
html,
body {
  --height: 56px;
}
```

相应的，你应该再添加一个 `:host` 选择器：

```css
html,
body,
:host {
  --height: 56px;
}
```

_目前 `:host` 下面的原生 CSS 规则还需要添加 `!important`，当然可以改用你的容器元素的选择器_

另外要慎重使用这些 CSS 单位：`rem`, `vw`, `vh`, `vmax`, `vmin` 以及 [`@media`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media)

## 第三方库

你可以使用满足以上限制的任意第三方库，例如 `React`, `Vue` 等等，当然也可以从宿主环境共享这些对象到 `<gem-frame>`，
避免不必要的重复加载，详情请查看进阶部分。
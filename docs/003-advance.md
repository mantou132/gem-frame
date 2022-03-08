# 进阶

通过非常简单的方式就可以在当前文档中加载一个被“隔离”的 完整 WebApp：

```html
<gem-frame src="https://your.app.url"></gem-frame>
```

另外，你也可以详细的监听这个 WebApp 的运行状况，以及让它和宿主环境进行交互。

## 错误处理

`<gem-frame>` 元素支持 `error` 事件，可以通过 `addEventListener` 注册一个监听器，
当 `<gem-frame>` 内部发生错误时会执行回调，你可以将这个错误发送给对应的维护人员。

_由于使用 `eval` 执行 js 代码，_
_目前 source-map 不能直接工作，_
_但可以手动根据行号和列号以及 source-map 文件找发生错误的原始代码位置_

## 共享数据

`<gem-frame>` 元素支持 `context` 属性，它将这个对象导入 `<gem-frame>` 内的执行环境，以此进行数据和方法共享。

```js
html`
  <gem-frame .context=${{ React, Vue }} ...></gem-frame>
`;
```

_使用 `basepath` 时不能共享 `react-router-dom`、`vue-router` 和 `gem/history`_

## 生命周期

`<gem-frame>` 没有特殊的生命周期，它只是模拟了 WebPage 的生命周期如 `load`, `unload`。

## URL 和视图同步

在 `<gem-frame>` 中通过 [`History API`](https://developer.mozilla.org/en-US/docs/Web/API/History) 进行的路由跳转，可以自动反应到 URL 栏中，同时 `<gem-frame>` 支持 `basepath` 属性，以便在 URL 中自动添加一段基础路径，中心化管理路由。

```html
<gem-frame basepath="/namespace" src="https://your.app.url"></gem-frame>
```

默认情况下，宿主环境上的操作导致 url 更改并不会让 `<gem-frame>` 中的子应用重新渲染，但是，会向子应用上的全局
对象触发一个 `hosturlchange` 事件，你可以在子应用中自行监听这个事件并进行更新，例如：

Vue 2.6:

```ts
const app = new Vue({
  ...
}).$mount(container);

addEventListener('hosturlchange', () => {
  // 触发重新渲染
  if (app.$route.path !== location.pathname) {
    app.$router.replace(location.pathname);
  }
});
```

React 16:

```ts
const history = useHistory();

useEffect(() => {
  addEventListener('hosturlchange', () => {
    history.replace({ pathname: location.pathname });
  });
}, []);
```

## 性能优化

`<gem-frame>` 非常像 `<iframe>`，以至于同样拥有一个 `<iframe>` 的特点——每次加载应用都要重新加载所有资源解析和执行所有代码，尽管可能在不久前就已经加载执行过。

`<gem-frame>` 支持一个 `keep-alive` 的特性，当你开启这个特性后，`<gem-frame>` 元素从文档中移除后仍然会保留在内存中，当你下次挂载相同的 WebApp 时会把内存中的元素重新插入当前文档，之后会触发 `hosturlchange` 事件，以便子应用更新视图以及时匹配 URL。

```html
<gem-frame keep-alive="on" src="https://your.app.url"></gem-frame>
```

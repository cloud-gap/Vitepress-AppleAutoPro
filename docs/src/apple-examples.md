# Examples

> 把AppleAutoPro分享页内嵌到VitePress，点击右上角GitHub图标即可查看源码

::: info Apple ID
<GetAppleID />
:::

## 搭建测试
> 本文档仅供参考，请勿在生产环境使用。

![image](/20241109220614.png)

Fork本仓库，使用`Cloudflare Pages`连接到`GitHub存储库`

构建命令 `npm run docs:build`

构建输出目录 `docs/.vitepress/dist`

环境变量 变量名称`API_URL`值为你的`分享页API` 

分享页API参考: https://appleauto.pro/docs/api/share-api.html

## 移植到已有的项目

::: tip
需要用到Cloudflare Functions，所以你必须将项目部署在Cloudflare Pages，如果你需要部署在其他地方可以自行修改组件代码。
:::

1.在你的项目根目录创建`functions`目录，拷贝`api-getappleid.js`到`functions`目录下

> Pages Functions 允许您通过使用Cloudflare Workers在 Cloudflare 网络上执行代码来构建全栈应用程序。借助 Functions，您可以引入应用程序方面，例如身份验证、处理表单提交或使用中间件。


2.创建Vue组件 `docs/.vitepress/theme/components/GetAppleID.vue` 或 `.vitepress/theme/components/GetAppleID.vue`

3.在 `theme\index.js` 中注册全局组件

```js{2,6-9}
import DefaultTheme from 'vitepress/theme';
import GetAppleID from "./components/GetAppleID.vue";

export default {
    ...DefaultTheme,
    enhanceApp({app}) { 
      // 注册全局组件
      app.component('GetAppleID' , GetAppleID)
    }
};
```

4.在Markdown文件中引用组件

```
<GetAppleID />
```
a
<GetAppleID />
b
<GetAppleID 0/>
c
<GetAppleID 1/>
d
<GetAppleID 2/>

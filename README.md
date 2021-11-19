# cloudbase-accesstoken-cache

> 微信公众号和小程序的 Access Token 小助手， 轻松快捷的管理您的Token策略

## Usage

### ESM / Typescript

```ts
import { init } from '@cloudbase/node-sdk'
import { SingleCacheManager } from 'cloudbase-accesstoken-cache'

const app = init({
  secretId,
  secretKey,
  env
})

const db = app.database()
const manager = new SingleCacheManager({
  appid,
  db,
  secret
})
// 获取 token (有缓存机制)
const token = await manager.getAccessToken()
```

### CJS (commonjs)

```js
const tcb = require('@cloudbase/node-sdk')
const { SingleCacheManager } = require('cloudbase-accesstoken-cache')

const app = tcb.init({
  secretId,
  secretKey,
  env
})

const db = app.database()
const manager = new SingleCacheManager({
  appid,
  db,
  secret
})
// 获取 token (有缓存机制)
const token = await manager.getAccessToken()
```

## Class

### SingleCacheManager

`options` 可以通过 `.d.ts` 定义感知出来

有 `2` 种策略，通过构造方法的 `memoize` 配置项开启 ,`default: true`

开启后会在内存中同步缓存，相当于一套 2 级缓存机制,顺序为:

1. 内存缓存
2. Cloudbase DB 数据库缓存
3. 重新获取

不开启的策略为:

1. Cloudbase DB 数据库缓存
2. 重新获取

如果你有更复杂的需求，请提 [`issue`](https://github.com/sonofmagic/cloudbase-accesstoken-cache/issues)


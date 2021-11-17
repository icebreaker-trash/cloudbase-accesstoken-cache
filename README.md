# cloudbase-accesstoken-cache

> 轻松快捷的管理您的 Access Token

## Usage

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
// 这就是你的 token 带了一套缓存机制
const token = await manager.getAccessToken()
```


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
// 这就是你的 token 带了一套缓存机制
const token = await manager.getAccessToken()
```

## Options

### SingleCacheManager

都可以通过 `.d.ts` 定义感知出来

如果你有更复杂的需求，请提 [`issue`](https://github.com/sonofmagic/cloudbase-accesstoken-cache/issues)
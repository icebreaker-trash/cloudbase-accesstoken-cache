import { SingleCacheManager } from '../src'
import { init } from '@cloudbase/node-sdk'
import { config } from 'dotenv'

config()

describe('SingleCacheManager', () => {
  test('Test ENV', async () => {
    const { secretId, secretKey, env, appid, secret } = process.env
    expect(secretId).toBeTruthy()
    expect(secretKey).toBeTruthy()
    expect(env).toBeTruthy()
    expect(appid).toBeTruthy()
    expect(secret).toBeTruthy()

    const app = init({
      secretId,
      secretKey,
      env
    })
    const db = app.database()
    const manager = new SingleCacheManager({
      appid: appid as string,
      db,
      secret: secret as string
    })
    const token = await manager.getAccessToken()
    expect(token).toBeTruthy()

    const token2 = await manager.getAccessToken()
    expect(token).toBe(token2)
  })
})

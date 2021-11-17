import type { Database } from '@cloudbase/node-sdk'
import axios from 'axios'

export interface ISingleCacheManagerConfig {
  /**
   * 小程序或者公众号的appid
   */
  appid: string
  /**
   * 小程序或者公众号的secret
   */
  secret: string
  /**
   * cloudbase json db 实例
   */
  db: Database.Db
  /**
   * 缓存使用的 collectionName
   * 默认为 'accessToken'
   */
  collectionName?: string
}
export class SingleCacheManager {
  public appid: string
  public secret: string
  public db: Database.Db
  public collectionName: string
  public tokenCol: Database.CollectionReference
  constructor (config: ISingleCacheManagerConfig) {
    this.appid = config.appid
    this.db = config.db
    this.secret = config.secret
    this.collectionName = config.collectionName ?? 'accessToken'
    this.tokenCol = this.db.collection('accessToken')
  }

  private async getAccessTokenByHttp () {
    const { data } = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`
    )
    return data
  }

  /**
   * 强制通过 http 请求获取 AccessToken (旧的会过期)
   */
  forceGetAccessTokenByHttp () {
    return this.getAccessTokenByHttp()
  }

  /**
   * 创建此 Collection
   */
  createCollection () {
    return this.db.createCollection(this.collectionName)
  }

  /**
   * 调用时，请确保 Collection 存在，如果不存在请调用 createCollection
   */
  async getAccessToken () {
    const { appid, tokenCol } = this
    const { data } = await tokenCol
      .where({
        appid: this.appid
      })
      .limit(1)
      .get()
    const ts = Date.now()
    if (data.length) {
      const hit = data[0]

      if (ts < hit.expiresIn) {
        return hit.accessToken
      } else {
        const data = await this.getAccessTokenByHttp()

        await tokenCol.doc(hit._id).update({
          appid,
          accessToken: data.access_token,
          expiresIn: ts + data.expires_in * 1000
        })
        return data.access_token
      }
    } else {
      const data = await this.getAccessTokenByHttp()

      await tokenCol.add({
        appid,
        accessToken: data.access_token,
        expiresIn: ts + data.expires_in * 1000
      })
      return data.access_token
    }
  }
}

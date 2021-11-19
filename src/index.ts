import type { Database } from '@cloudbase/node-sdk'
import http from 'http'
import https from 'https'
import { URL } from 'url'
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
  /**
   * 是否在内存中备份，多次调用时只会验证内存中的access token的过期时间，
   * 直到过期才会重新从 cloudbase db 远端获取
   * 优点为, 不同每次都从远端 db 中去获取
   * 缺点为，当另外一个获取access token的请求，让内存中的这个 token 强制过期时,需要手动干预
   * 默认为 true
   */
  memoize?: boolean
}

export interface ISingleCacheManagerInnerCache {
  appid: string
  accessToken: string
  expiresIn: number
}

export interface IRemoteTokenResponse {
  access_token: string
  expires_in: number
}
export class SingleCacheManager {
  private appid: string
  private secret: string
  private db: Database.Db
  private collectionName: string
  private tokenCol: Database.CollectionReference
  private cache?: ISingleCacheManagerInnerCache
  private memoize: boolean

  constructor (config: ISingleCacheManagerConfig) {
    this.appid = config.appid
    this.db = config.db
    this.secret = config.secret
    this.collectionName = config.collectionName ?? 'accessToken'
    this.tokenCol = this.db.collection(this.collectionName)
    this.memoize = config.memoize ?? true
  }

  private getAccessTokenByHttp (): Promise<IRemoteTokenResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`
      )
      const protocol = url.protocol === 'https:' ? https : http
      protocol
        .get(url, (res) => {
          const { statusCode } = res
          const contentType = res.headers['content-type'] ?? 'application/json'

          let error
          if (statusCode !== 200) {
            error = new Error(
              'Request Failed.\n' + `Status Code: ${statusCode}`
            )
          } else if (!/^application\/json/.test(contentType)) {
            error = new Error(
              'Invalid content-type.\n' +
                `Expected application/json but received ${contentType}`
            )
          }
          if (error) {
            console.error(error.message)
            res.resume()
            return
          }

          res.setEncoding('utf8')
          let rawData = ''
          res.on('data', (chunk) => {
            rawData += chunk
          })
          res.on('end', () => {
            try {
              const parsedData = JSON.parse(rawData)
              resolve(parsedData)
            } catch (e) {
              reject(e)
            }
          })
        })
        .on('error', (e) => {
          reject(e)
        })
    })
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

  // isExpired () {

  // }

  // async flush () {}

  async createCacheItem (ts: number) {
    const { appid } = this
    const data = await this.getAccessTokenByHttp()
    const item: ISingleCacheManagerInnerCache = {
      appid,
      accessToken: data.access_token,
      expiresIn: ts + data.expires_in * 1000
    }
    return item
  }

  /**
   * 远端策略
   * @returns
   */
  async remoteStrategy () {
    const { tokenCol, memoize } = this
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
        const item = await this.createCacheItem(ts)
        await tokenCol.doc(hit._id).update(item)
        if (memoize) {
          this.cache = item
        }
        return item.accessToken
      }
    } else {
      const item = await this.createCacheItem(ts)
      await tokenCol.add(item)
      if (memoize) {
        this.cache = item
      }
      return item.accessToken
    }
  }

  /**
   * 内存策略
   * @returns
   */
  async memoizeStrategy () {
    const { cache } = this
    const ts = Date.now()
    if (cache) {
      if (ts < cache.expiresIn) {
        return cache.accessToken
      } else {
        return await this.remoteStrategy()
      }
    } else {
      return await this.remoteStrategy()
    }
  }

  /**
   * 调用时，请确保 Collection 存在，如果不存在请调用 createCollection
   */
  async getAccessToken () {
    if (this.memoize) {
      return await this.memoizeStrategy()
    } else {
      return await this.remoteStrategy()
    }
  }
}

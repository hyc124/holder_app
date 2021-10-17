import { remote } from 'electron'
import path from 'path'
import fs from 'fs'
const app = remote.app
const userDataPath = app.getPath('userData')
// 将数据存至系统用户目录，防止用户误删程序
const { BUILD_ENV } = process.env
const attach = BUILD_ENV == 'dev' ? 'dev/' : ''
const dbPathPt = path.join(userDataPath, attach)
const dbPath = path.join(userDataPath, attach + 'data.db')
const SQLite3 = require('sqlite3').verbose()
/**
 * 使用sqlite3持久化数据
 * 功能：1. 创建数据库(数据库存在的话，那就直接打开)
 *       2. 创建一个表(表存在的话就不用创建啦)
 *       3. 有了数据库和表, 最最基础的功能就是：
 *          插入数据(单个数据插入或者多个并行插入)
 *          更新数据(根据不同的条件更新每列数据)
 *          删除数据(根据不同的条件来删除每列数据)
 *          查询数据(单个数据查询，多个数据查询)
 */
export class HandleSqliteDB {
  instance: any
  db: any
  static instance: any
  constructor() {
    this.instance
    this.db = null
    // 有二级目录则提前创建目录
    if (attach) {
      sqlite3MkDir().then(() => {
        this.connect(dbPath)
      })
    } else {
      this.connect(dbPath)
    }
  }

  // 连接数据库
  connect(path: string) {
    return new Promise((resolve, reject) => {
      this.db = new SQLite3.Database(path, (err: any) => {
        if (err === null) {
          resolve(err)
        } else {
          reject(err)
        }
      })
    })
  }
  // 运行sql
  run(sql: string, params: any) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err: any) => {
        if (err === null) {
          resolve(err)
        } else {
          reject(err)
        }
      })
    })
  }
  // 运行多条sql
  exec(sql: string) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err: any) => {
        if (err === null) {
          resolve(err)
        } else {
          reject(err)
        }
      })
    })
  }
  // 查询一条数据
  get(sql: string, params: any) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err: any, data: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
  // 查询所有数据
  all(sql: string, params: any) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err: any, data: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
  // 关闭数据库
  close() {
    this.db.close()
  }

  // 单例
  static getInstance() {
    this.instance = this.instance ? this.instance : new HandleSqliteDB()
    return this.instance
  }
}
// 创建目录
export const sqlite3MkDir = async () => {
  const isExists = await getStat(dbPathPt)
  // console.log('sqlite3MkDir')
  return new Promise(resolve => {
    // 如果该路径存在且不是文件，返回 true
    if (isExists) {
      resolve(true)
    } else {
      fs.mkdir(dbPathPt, error => {
        if (error) {
          console.log(error)
        } else {
          console.log('创建目录成功')
        }
        resolve(true)
      })
    }
  })
}
/**
 * 读取路径信息
 * @param {string} filepath 路径
 */
const getStat = (filePath: string) => {
  return new Promise(resolve => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        resolve(false)
      } else {
        resolve(stats)
      }
    })
  })
}

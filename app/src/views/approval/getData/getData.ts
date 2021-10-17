import { HandleSqliteDB } from '@/src/common/js/sqlite3Db'
import { reject } from 'async'

interface ApprovalListModelProps {
  id: number
  eventName: string
  eventKey: string
  eventType: number
  processId: string
  processKey: string
  createUserAccount: string
  groupId: number
  resourceId: string
  logo: string
  defaultForm: number
}

interface ApprovalListProps {
  groupId: number
  groupName: string
  approvalEventModels: ApprovalListModelProps[]
}

//获取数据库连接对象
const db = HandleSqliteDB.getInstance()

/**
 * 创建发起审批表单列表数据表
 */
export const createSendApprovalListTable = () => {
  return new Promise((resolve, reject) => {
    db.run(
      'CREATE TABLE if not exists approval_detail (id integer primary key autoincrement, userId, approvalId, data, cacheVersion)'
    )
      .then(() => {
        resolve()
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

/**
 * 查询审批详情本地缓存
 * @param approvalId 当前审批id
 * @param userId 登陆人id
 */
export const getApprovalDetailLocal = ({ approvalId, userId }: any) => {
  return new Promise<any>(resolve => {
    //先查询本地是否有缓存
    const stmt = 'SELECT * FROM approval_detail WHERE userId = ' + userId + ' AND approvalId = ' + approvalId
    db.all(stmt)
      .then((data: any) => {
        if (!data) {
          resolve(undefined)
        } else {
          const getData = data[0] ? data[0] : null
          resolve(getData)
        }
      })
      .catch((err: any) => {
        console.log(err)
      })
  })
}

/**
 * 插入审批详情数据
 */
export const insertApprovalDetail = ({ approvalId, userId, data, version }: any) => {
  return new Promise<any>((resolve, reject) => {
    db.run('INSERT INTO approval_detail (id,userId,approvalId, data,cacheVersion) VALUES (?, ?, ?, ?, ?)', [
      null,
      userId,
      approvalId,
      JSON.stringify(data),
      version,
    ])
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

/**
 * 更新审批详情数据
 */
export const updateApprovalDetail = ({ approvalId, userId, data, version }: any) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE approval_detail set data=?,cacheVersion=? WHERE userId=? AND approvalId=?', [
      JSON.stringify(data),
      version,
      userId,
      approvalId,
    ])
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

//变更任务归属
export const confidenPortraitApi = (params: any, url: any) => {
  return new Promise(resolve => {
    $api
      .request(url, params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        console.log(res.returnMessage)
        // message.error(res.returnMessage)
      })
  })
}

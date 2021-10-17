import { HandleSqliteDB } from '@/src/common/js/sqlite3Db'
//数据库对象
const db = HandleSqliteDB.getInstance()

/**
 * 创建多个表格
 */
export const createDeskTable = () => {
  return new Promise(resolve => {
    db.exec(
      'CREATE TABLE if not exists deskModule (id integer primary key autoincrement, userId,data,cacheTime);CREATE TABLE if not exists workDeskTask (id integer primary key autoincrement, loginUserId,enterpriseId,listType, pageNo,pageSize,data,cacheTime)'
    )
      .then(() => {
        resolve(true)
      })
      .catch((err: any) => {
        resolve(false)
      })
  })
}
/***************************************工作台模块************************************************ */
//工作台标签下任务数据表格创建
export const createDeskModule = () => {
  return new Promise(resolve => {
    db.run(
      'CREATE TABLE if not exists deskModule (id integer primary key autoincrement, userId,data,cacheTime)'
    )
      .then(() => {
        resolve(true)
      })
      .catch((err: any) => {
        resolve(false)
      })
  })
}

//工作台标签下任务数据存储
export const findDeskModule = ({ userId }: { userId: number }) => {
  return new Promise(resolve => {
    const selectTaskStmt = 'SELECT * FROM deskModule WHERE userId = ' + userId
    db.all(selectTaskStmt).then((data: any) => {
      if (data === undefined) {
        resolve(undefined)
      } else {
        const getData = data[0] ? data[0] : null
        resolve(getData)
      }
    })
  })
}

/**
 * 插入任务数据
 */
export const insertDeskModule = ({ userId, data }: { userId: number; data: any }) => {
  //插入任务数据
  const cacheTime = new Date().getTime()
  const stmt = db.db.prepare('INSERT INTO deskModule (id,userId,data,cacheTime) VALUES (?, ?, ?, ?)')
  stmt.run([null, userId, JSON.stringify(data), cacheTime])
}

/**
 * 更新任务数据
 */
export const updateDeskModule = ({ userId, data }: { userId: number; data: any }) => {
  const cacheTime = new Date().getTime()
  //更新任务数据
  const stmt = db.db.prepare('UPDATE deskModule set data=?,cacheTime=? WHERE userId=?')
  stmt.run(JSON.stringify(data), cacheTime, userId)
}

/****************************************任务列表*************************************** */
//工作台标签下任务数据表格创建
export const createWorkDeskTask = () => {
  return new Promise(resolve => {
    db.run(
      'CREATE TABLE if not exists workDeskTask (id integer primary key autoincrement, loginUserId,enterpriseId,listType, pageNo,pageSize,data,cacheTime)'
    )
      .then(() => {
        resolve(true)
      })
      .catch((err: any) => {
        resolve(false)
      })
  })
}

//工作台标签下任务数据存储
export const findWorkDeskTask = (paramObj: {
  loginUserId: number
  enterpriseId: number | ''
  listType: number
  pageNo: number
  pageSize: number
  account?: string
  status?: number
  startTime?: string
  endTime?: string
  keyword?: string
  property?: number
  level?: number
  tagKeyword?: string
}) => {
  const { loginUserId, enterpriseId, listType, pageNo, pageSize } = paramObj
  const teamId = enterpriseId == '' ? 0 : enterpriseId
  return new Promise(resolve => {
    const selectTaskStmt =
      'SELECT * FROM workDeskTask WHERE loginUserId = ' +
      loginUserId +
      ' AND enterpriseId = ' +
      teamId +
      ' AND listType = ' +
      listType +
      ' AND pageNo = ' +
      pageNo +
      ' AND pageSize = ' +
      pageSize
    // const stmt = db.db.prepare(
    //   "SELECT belongUserId FROM workDeskTask WHERE loginUserId=? AND property=? AND level=? AND enterpriseId=? AND listType=? AND pageNo=? AND pageSize=?)"
    // )
    // stmt.get({
    //   loginUserId,
    //   status,
    //   enterpriseId,
    //   listType,
    //   pageNo,
    //   pageSize,
    // })
    db.all(selectTaskStmt).then((data: any) => {
      if (data === undefined) {
        resolve(undefined)
      } else {
        const getData = data[0] ? data[0] : null
        resolve(getData)
      }
    })
  })
}

/**
 * 插入任务数据
 */
export const insertWorkDeskTask = (paramObj: {
  loginUserId: number
  enterpriseId: string
  listType: number
  pageNo: number
  pageSize: number
  data: any
}) => {
  const { loginUserId, enterpriseId, listType, pageNo, pageSize, data } = paramObj
  const teamId = enterpriseId == '' ? 0 : enterpriseId
  //插入任务数据
  const cacheTime = new Date().getTime()
  const stmt = db.db.prepare(
    'INSERT INTO workDeskTask (id,loginUserId,enterpriseId,listType,pageNo,pageSize,data,cacheTime) VALUES (?, ?, ?, ?, ?, ?, ?,?)'
  )
  stmt.run([null, loginUserId, teamId, listType, pageNo, pageSize, JSON.stringify(data), cacheTime])

  //   db.run(
  //     'INSERT INTO workDeskTask (id,loginUserId,enterpriseId,listType,pageNo,pageSize,data,cacheTime) VALUES (' +
  //       null +
  //       ', ' +
  //       loginUserId +
  //       ', ' +
  //       teamId +
  //       ', ' +
  //       listType +
  //       ', ' +
  //       pageNo +
  //       ', ' +
  //       pageSize +
  //       ', ' +
  //       data +
  //       ', ' +
  //       cacheTime +
  //       ')'
  //   )
  //     .then(() => {
  //       console.log('insertWorkDeskTask 成功')
  //     })
  //     .catch((err: any) => {
  //       console.log('insertWorkDeskTask 失败', err)
  //     })
}
/**
 * 更新任务数据
 */
export const updateWorkDeskTask = (paramObj: {
  loginUserId: number
  enterpriseId: string
  listType: number
  pageNo: number
  pageSize: number
  data: any
}) => {
  const { data, loginUserId, enterpriseId, listType, pageNo, pageSize } = paramObj
  const teamId = enterpriseId == '' ? 0 : enterpriseId
  const cacheTime = new Date().getTime()
  //更新任务数据
  const stmt = db.db.prepare(
    'UPDATE workDeskTask set data=?,cacheTime=? WHERE loginUserId=? AND enterpriseId=? AND listType=? AND pageNo=? AND pageSize=?'
  )
  stmt.run(JSON.stringify(data), cacheTime, loginUserId, teamId, listType, pageNo, pageSize)
}

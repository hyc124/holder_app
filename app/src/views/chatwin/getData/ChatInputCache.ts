import { HandleSqliteDB } from '@/src/common/js/sqlite3Db'
import { Agent } from 'http'
// import { re } from 'mathjs'
//数据库对象
const db = HandleSqliteDB.getInstance()

/*************************************************用户信息********************************************************************/

export const findUser = (nowUserId: number, nowAccount: string) => {
  return new Promise(resolve => {
    const selectTaskStmt = `SELECT * FROM holder_user WHERE userId = ${nowUserId} AND userAccount = '${nowAccount}'`
    db.all(selectTaskStmt).then((resData: any) => {
      if (resData.length) {
        resolve(resData[0])
      } else {
        resolve(null)
      }
    })
  })
}

/*************************************************聊天草稿缓存********************************************************************/

// 保存草稿
export const setCacheMsg = ({ roomId, roomJid, content }: any, selectItem: any, dispatch: any) => {
  const { nowUserId, chatDrafMsg } = $store.getState()
  const params = { roomJid: roomJid, userId: nowUserId, content }
  const ele = document.getElementById('msg-txt')
  let chatMsgEntity = JSON.parse(JSON.stringify(chatDrafMsg || []))
  if (chatMsgEntity && chatMsgEntity.length > 0) {
    let isIn = false
    chatMsgEntity.forEach((item: any) => {
      const itemMuc = item.roomJid
      const itemUserId = item.userId
      if (itemMuc == roomJid && itemUserId == nowUserId) {
        isIn = true
        item.content = content
      }
    })
    if (!isIn) {
      chatMsgEntity.push(params)
    }
  } else {
    chatMsgEntity = [params]
  }
  dispatch({ type: 'SET_CHA_TMSG', data: chatMsgEntity })
  //更新草稿到本地缓存
  handelDraft(roomId, roomJid, content)
  if (ele) {
    ele.innerHTML = getCacheMsg(selectItem.roomJid)
    if (window.getSelection) {
      //ie11 10 9 ff safari
      ele.focus() //解决ff不获取焦点无法定位问题
      const range = window.getSelection() //创建range
      if (range) {
        range.selectAllChildren(ele) //range 选择obj下所有子内容
        range.collapseToEnd() //光标移至最后
      }
    }
  }
}

// 删除草稿
export const removeCacheMsg = (roomId: any, roomJid: any, selectItem: any, dispatch: any) => {
  const { nowUserId, chatDrafMsg } = $store.getState()
  const ele = document.getElementById('msg-txt')
  const chatMsgEntity = JSON.parse(JSON.stringify(chatDrafMsg || []))
  for (let i = 0; i < chatMsgEntity?.length; i++) {
    const item = chatMsgEntity[i]
    if (item.roomJid == roomJid && item.userId == nowUserId) {
      chatMsgEntity.splice(i, 1)
      i--
      break
    }
  }
  dispatch({ type: 'SET_CHA_TMSG', data: chatMsgEntity })
  //清空本地缓存聊天室对应的草稿信息
  handelDraft(roomId, roomJid, null)
  if (ele) {
    ele.innerHTML = getCacheMsg(selectItem?.roomJid)
    if (window.getSelection) {
      //ie11 10 9 ff safari
      ele.focus() //解决ff不获取焦点无法定位问题
      const range = window.getSelection() //创建range
      if (range) {
        range.selectAllChildren(ele) //range 选择obj下所有子内容
        range.collapseToEnd() //光标移至最后
      }
    }
  }
}

// 读取草稿
export const getCacheMsg = (roomJid: any) => {
  const { nowUserId, chatDrafMsg } = $store.getState()
  jQuery('#msg-txt').html('')
  let text = ''
  for (let i = 0; i < chatDrafMsg?.length; i++) {
    if (chatDrafMsg[i].roomJid == roomJid && chatDrafMsg[i].userId == nowUserId) {
      text = chatDrafMsg[i].content
    }
  }
  return text
}

export const getDraftReplyMsg = (selectItem: any) => {
  const { currentReplyData } = $store.getState()
  const replyData = currentReplyData.find((item: any) => {
    return selectItem.roomId === item.roomId
  })
  return replyData
}

export const saveDraftMsg = (prevItem: any, selectItem: any, dispatch: any) => {
  const inputTxt = document.getElementById('msg-txt')?.innerHTML
  const replyEle = document.getElementById('replyMsgContent')
  const { currentReplyData } = $store.getState()
  const replyData = JSON.parse(JSON.stringify(currentReplyData))
  if (replyEle) {
    // if (replyData.length) {
    //   replyData.forEach((item: any, index: number) => {
    //     if (item.roomId === selectItem.id) {
    //       replyData.splice(index, 1)
    //     }
    //   })
    // }
  } else {
    replyData.forEach((item: any, index: number) => {
      if (item.roomId === selectItem.roomId) {
        replyData.slice(index, 1)
      }
    })
  }
  $store.dispatch({ type: 'SET_REPLY_PARENT_DATA', data: replyData })
  const newText = inputTxt
    ?.replace($tools.regLineFeed1, '')
    .replace($tools.regSpace1, ' ')
    .replace(/\ +/g, ' ')
  // 设置本地缓存聊天框输入内容
  if (prevItem.roomId) {
    if (newText) {
      const prevItemValue = { roomId: prevItem.roomId, roomJid: prevItem.roomJid, content: inputTxt }
      setCacheMsg(prevItemValue, selectItem, dispatch)
    } else {
      removeCacheMsg(prevItem.roomId, prevItem.roomJid, selectItem, $store.dispatch)
    }
  }
}

/***********************************************聊天室历史消息缓存*******************************************************************/

// 根据聊天室id查询聊天消息
export const findLocalMsgByRoom = (roomId: number, pageNum: number) => {
  return new Promise(resolve => {
    const selectTaskStmt = `SELECT * FROM chat_message WHERE roomId = "${roomId}" ORDER BY serverTime DESC limit ${pageNum}`
    db.all(selectTaskStmt)
      .then((resData: any) => {
        if (resData && resData.length) {
          const localDataMsg = resData.reverse()
          resolve(localDataMsg)
        } else {
          resolve(null)
        }
      })
      .catch(() => {
        resolve(null)
      })
  })
}

// 根据聊天室id查询更多聊天消息
export const findMoreLocalMsg = (roomId: number, pageNum: number, serverTime: number) => {
  return new Promise(resolve => {
    const selectTaskStmt = `SELECT * FROM chat_message WHERE roomId = "${roomId}" AND serverTime < ${serverTime} order by serverTime desc limit ${pageNum}`
    db.all(selectTaskStmt)
      .then((resData: any) => {
        if (resData && resData.length) {
          const localDataMsg = resData.reverse()
          resolve(localDataMsg)
        } else {
          resolve(null)
        }
      })
      .catch(() => {
        resolve(null)
      })
  })
}

// 查询单条具体的消息
export const findLocalMsgByCachetime = (msgUuid: number) => {
  return new Promise(resolve => {
    const selectTaskStmt = `SELECT * FROM chat_message WHERE msgUuid = "${msgUuid}"`
    db.all(selectTaskStmt).then((resData: any) => {
      if (resData && resData.length) {
        resolve(resData)
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * 删除历史消息
 */
export const deleteChatMsg = ({ msgUuid }: any) => {
  return new Promise((resolve, reject) => {
    db.all(`DELETE FROM chat_message WHERE msgUuid = "${msgUuid}"`)
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

/**
 * 批量插入聊天消息
 */
export const batchInsertChatMsg = ({ roomId, data }: any) => {
  if (data.length) {
    const arr: any = []
    data.map((item: any) => {
      const $fromUser = JSON.stringify(item.fromUser)
      const $emj = JSON.stringify(item.emoticonOperationList || [])
      if (!!item.msgUuid && item.msgUuid !== 'null') {
        arr.push(
          `('${item.msgUuid}','${item.serverTime}','${item.type}','${roomId}','${item.messageJson}','${item.isRecall}','${$fromUser}','${item.stamp}','${$emj}')`
        )
      }
    })
    const sqlStr = arr.join(',').replace(/[\\ \/=]/g, '')
    db.run(
      `insert or replace into chat_message (msgUuid, serverTime, type, roomId, messageJson, isRecall, fromUser, stamp, emoticonOperationList) VALUES ${sqlStr}`
    )
  }
}

/**
 * 批量更新聊天消息
 */
export const batchUpdateChatMsg = ({ data }: any) => {
  db.db.serialize(function() {
    db.run('BEGIN')
    const stmt = db.db.prepare(
      'UPDATE chat_message2 set serverTime=?,messageJson=?,isRecall=?,emoticonOperationList=? WHERE msgUuid=?'
    )
    for (let i = 0; i < data.length; i++) {
      const { serverTime, messageJson, isRecall, emoticonOperationList, msgUuid } = data[i]
      stmt.run(serverTime, messageJson, isRecall, emoticonOperationList || [], msgUuid)
    }
    stmt.finalize()
    db.run('COMMIT')
  })
}

/**
 * 插入单条聊天消息
 */
export const insertChatMsg = ({ roomId, data }: any) => {
  return new Promise<any>((resolve, reject) => {
    const { msgUuid, serverTime, type, messageJson, isRecall, fromUser, stamp, emoticonOperationList } = data
    db.run(
      'INSERT INTO chat_message (msgUuid, serverTime, type,roomId,messageJson,isRecall,fromUser,stamp,emoticonOperationList) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        msgUuid,
        serverTime,
        type,
        roomId,
        type === 1 ? messageJson : JSON.stringify(messageJson),
        isRecall,
        JSON.stringify(fromUser),
        stamp,
        `${emoticonOperationList || []}`,
      ]
    )
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

// 更新单条聊天消息
export const updateChatMsg = (data: any) => {
  const { msgUuid, type, serverTime, messageJson, isRecall, emoticonOperationList, sendStatus } = data
  const $sendStatus = !!sendStatus ? sendStatus : '0' //'-1'为错误数据
  const emj = emoticonOperationList || []
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE chat_message set serverTime=?,messageJson=?,isRecall=?,emoticonOperationList=?,sendStatus=? WHERE msgUuid=?',
      [
        serverTime,
        type === 1 ? messageJson : JSON.stringify(messageJson),
        isRecall,
        JSON.stringify(emj),
        $sendStatus,
        msgUuid,
      ]
    )
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

//==================================================sqlite3=沟通聊天室表====================================================================

/**
 * @param userId 查询当前用户所有的聊天室
 */
export const fetchChatRoom = (userId: number) => {
  return new Promise(resolve => {
    const selectTaskStmt = 'SELECT * FROM chat_room WHERE userId = ' + userId
    db.all(selectTaskStmt).then((resData: any) => {
      if (!!resData && Array.isArray(resData) && resData.length !== 0) {
        resolve(resData)
      } else {
        resolve(undefined)
      }
    })
  })
}
/**
 * 删除聊天室
 */
export const deleteChatRoom = (roomId: number) => {
  return new Promise((resolve, reject) => {
    db.all(`DELETE FROM chat_room WHERE roomId = "${roomId}"`)
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}
/**
 * 删除当前登录人所有的聊天室
 */
export const deleteNowUserRoom = (userId: number) => {
  return new Promise((resolve, reject) => {
    db.all(`DELETE FROM chat_room WHERE userId = "${userId}"`)
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}
//更新本地数据库聊天室信息
export const updateChatRoom = (data: any) => {
  const { roomId, isTop, isAtMe, profile, remindType, roomName, timeStamp, unreadCount, windowClose } = data
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE chat_room set isTop=?,isAtMe=?,profile=?,remindType=?,roomName=?,timeStamp=?,unreadCount=?,windowClose=? WHERE roomId=?',
      [isTop, isAtMe, profile, remindType, roomName, timeStamp, unreadCount, windowClose, roomId]
    )
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

/**
 * 插入单个聊天室
 */
export const insertChatRoom = (data: any) => {
  const { nowUserId } = $store.getState()
  return new Promise<any>((resolve, reject) => {
    const {
      roomId,
      ascriptionName,
      ascriptionId,
      isTop,
      isAtMe,
      roomJid,
      profile,
      remindType,
      roomName,
      timeStamp,
      type,
      typeId,
      unreadCount,
      windowClose,
    } = data

    db.run(
      'INSERT INTO chat_room (  roomId,ascriptionName,ascriptionId,isTop, isAtMe,roomJid,profile,remindType,roomName,timeStamp,type,typeId,unreadCount,windowClose,userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        roomId,
        ascriptionName,
        ascriptionId,
        isTop,
        isAtMe,
        roomJid,
        profile,
        remindType,
        roomName,
        timeStamp,
        type,
        typeId,
        unreadCount,
        windowClose,
        nowUserId,
      ]
    )
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

/**
 * 批量插入聊天列表
 */
export const batchInsertChatRoom = ({ userId, data }: any) => {
  return new Promise(async resolve => {
    const _data = data.map((item: any) => {
      return `('${item.roomId}','${item.ascriptionName}',${item.ascriptionId},'${item.isTop}','${item.isAtMe}','${item.roomJid}','${item.profile}','${item.remindType}','${item.roomName}','${item.timeStamp}','${item.type}','${item.typeId}','${item.unreadCount}','${item.windowClose}','${userId}')`
    })
    const $dataStr = _data.join(',')
    await db.run(
      `insert or replace into chat_room (roomId, ascriptionName, ascriptionId, isTop, isAtMe, roomJid, profile, remindType, roomName,timeStamp,type,typeId,unreadCount,windowClose,userId) VALUES ${$dataStr}`
    )
    resolve(true)
  })
}

// //清空本地缓存聊天室chat_room表
// export const emptyTableRoom = () => {
//   db.execSQL('delete from chat_room')
// }
//==================================================sqlite3=沟通聊天室"简略"消息====================================================================
// (msgUuid,type,fromUser,messageJson,serverTime,roomId,roomType,isRecall,userId)
//批量插入/更新简略消息. manuscript:草稿
export const batchInsertSqlbrief = (messageList: any) => {
  const briefData: any = []
  const { nowUserId } = $store.getState()
  messageList.map((_item: any) => {
    const fromUser = JSON.stringify(_item.fromUser)
    if (!!_item.roomId && !!_item.msgUuid && !!_item.messageJson) {
      briefData.push(
        `('${_item.msgUuid}','${_item.type}','${fromUser}','${_item.messageJson}','${_item.serverTime}','${_item.roomId}','${_item.roomType}','${_item.isRecall}','${nowUserId}')`
      )
    }
  })
  return new Promise(async resolve => {
    const briefStr = briefData.join(',').replace(/[\\ \/=]/g, '')
    await db.run(
      `insert or replace into brief_message (msgUuid,type,fromUser,messageJson,serverTime,roomId,roomType,isRecall,userId) VALUES ${briefStr}`
    )
    resolve(true)
  })

  // INSERT INTO alarm(DefineNo,NotifyClient,AutoHandle,NoSave,PlayTimes,AlarmType,SoundFile,AlarmLevel) SELECT 1,0, 1, 0,3,'布防', 'arm.wav', 3   UNION ALL SELECT  2, 0,1, 0, 3,,'撤防', 'disarm.wav',3
}
// 查询单条具体的简略消息
export const queryLocalbrief = (roomId: number) => {
  return new Promise(resolve => {
    const selectTaskStmt = `SELECT * FROM brief_message WHERE roomId = "${roomId}"`
    db.all(selectTaskStmt).then((resData: any) => {
      if (resData && resData.length) {
        resolve(resData)
      } else {
        resolve(null)
      }
    })
  })
}

//查询当前登录人的所有聊天室简略消息
export const queryLocalAllbrief = (userId: number) => {
  return new Promise(resolve => {
    const selectTaskStmt = `SELECT * FROM brief_message WHERE userId = "${userId}"`
    db.all(selectTaskStmt).then((resData: any) => {
      if (resData && resData.length) {
        resolve(resData)
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * 删除当前登录人所有的简略消息
 */
export const deleteNowUserBrief = (userId: number) => {
  return new Promise((resolve, reject) => {
    db.all(`DELETE FROM brief_message WHERE userId = "${userId}"`)
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}
/**
 * 插入单条简略消息
 */
export const insertBriefMsg = (roomId: number, data: any) => {
  // (msgUuid,type,fromUser,messageJson,serverTime,roomId,roomType,isRecall,manuscript)
  const { nowUserId } = $store.getState()
  return new Promise<any>((resolve, reject) => {
    const { msgUuid, serverTime, type, messageJson, isRecall, fromUser, roomType } = data
    db.run(
      'INSERT INTO brief_message (msgUuid,type,fromUser,messageJson,serverTime,roomId,roomType,isRecall,userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [msgUuid, type, JSON.stringify(fromUser), messageJson, serverTime, roomId, roomType, isRecall, nowUserId]
    )
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

// 更新单条简略消息
export const updateBriefMsg = (roomId: number, messageJson: any) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE brief_message set messageJson=?,roomType=? WHERE roomId=?', [messageJson, roomId])
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}
//===================================================sqlite3=聊天室草稿表~==========================================================================================
// 查询当前登录人单个聊天室的草稿
export const queryRoomDraft = (roomId: number) => {
  return new Promise(resolve => {
    const selectTaskStmt = `SELECT * FROM room_draft WHERE roomId = "${roomId}"`
    db.all(selectTaskStmt).then((resData: any) => {
      if (resData && resData.length) {
        resolve(resData)
      } else {
        resolve(null)
      }
    })
  })
}
//查询当前登录人所有的草稿消息
export const queryRoomAllDraft = (userId: number) => {
  return new Promise(resolve => {
    const selectTaskStmt = `SELECT * FROM room_draft WHERE userId = "${userId}"`
    db.all(selectTaskStmt).then((resData: any) => {
      if (resData && resData.length) {
        resolve(resData)
      } else {
        resolve(null)
      }
    })
  })
}
//更新聊天室本地缓存草稿
export const updateRoomDraft = (roomId: number, roomJid: string, manuscript: any) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE room_draft set manuscript=?,roomJid=? WHERE roomId=?', [manuscript, roomJid, roomId])
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
        console.log(err)
      })
  })
}
/**
 * 插入单条草稿信息
 */
export const insertRoomDraft = (roomId: number, roomJid: string, manuscript: any) => {
  const { nowUserId } = $store.getState()
  return new Promise<any>((resolve, reject) => {
    db.run('INSERT INTO room_draft (roomId,roomJid,userId,manuscript) VALUES (?, ?, ?, ?)', [
      roomId,
      roomJid,
      nowUserId,
      manuscript,
    ])
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

//草稿存储逻辑
export const handelDraft = (roomId: number, roomJid: string, content: any) => {
  //更新草稿到本地缓存
  queryRoomDraft(roomId).then((localData: any) => {
    if (localData) {
      updateRoomDraft(roomId, roomJid, content)
    } else {
      insertRoomDraft(roomId, roomJid, content)
    }
  })
}

//==================================================sqlite3=沟通成员列表头像表====================================================================
//查询沟通头像userId
// insert or replace into profile_user(userId, profile) values(111, 'http://www.db.com'),(1112, 'http://www.db.com1')
export const insertSqlProfile = (data: any) => {
  const sqlStr = data.map((item: any) => {
    return `('${item.userId}','${item?.headPhoto}')`
  })
  // db.run('BEGIN')
  db.run(`insert or replace into profile_user(userId, profile) values ${sqlStr.join(',')}`)
  // db.run('COMMIT')
}
//根据userID查询头像
export const queryCacheProfile = (userId: number) => {
  return new Promise(resolve => {
    db.all('SELECT * FROM profile_user WHERE userId = ' + userId).then(async (resData: any) => {
      if (!!resData && Array.isArray(resData) && resData.length !== 0) {
        await resolve(resData[0].profile)
      } else {
        await resolve(null)
      }
    })
  })
}

//======================//
//查询表是否存在
// SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'chat_room'
export const checkSqliteTable = (sql: string) => {
  return new Promise(resolve => {
    db.all(sql).then((data: any) => {
      if (!!data && Array.isArray(data) && data.length !== 0) {
        const num = data[0]['count(*)'] //num 0不存在表  1存在
        resolve(num === 1 ? true : false)
      } else {
        resolve(false)
      }
    })
  })
}

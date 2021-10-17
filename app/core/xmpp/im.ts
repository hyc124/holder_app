/**
 * strophe连接xmpp
 */
import 'strophe.js'
import { ipcRenderer } from 'electron'
import { findUserUnReadMuc } from '@/src/views/chat-Tip-Win/getData'
import devConfig from '@root/build/dev.config'
import { batchInsertChatRoom, fetchChatRoom } from '@/src/views/chatwin/getData/ChatInputCache'
import { openWindow } from '@/src/views/chatwin/getData/getData'
import moment from 'moment'
import { isSystemMsg } from '@/src/components/app-sidebar'

const env = process.env.BUILD_ENV
const BOSH_SERVICE =
  env === 'dev'
    ? devConfig.env['dev']['variables']['BOSH_SERVICE']
    : devConfig.env['prod']['variables']['BOSH_SERVICE']
const ROOM_SERVICE =
  env === 'dev'
    ? devConfig.env['dev']['variables']['ROOM_SERVICE']
    : devConfig.env['prod']['variables']['ROOM_SERVICE']
const IPSUFFIX =
  env === 'dev' ? devConfig.env['dev']['variables']['IPSUFFIX'] : devConfig.env['prod']['variables']['IPSUFFIX']

const xmppConnected = new Proxy(
  { connected: false },
  {
    set: function(obj, prop, value) {
      obj[prop] = value
      return true
    },
  }
)

const noticeTypeEnum = [
  'approval_send',
  'touch_approval',
  'approval_urge',
  'reject_approval',
  'unconfirmed_meeting',
  'unconfirmed_meeting_update',
  'unconfirmed_meeting_remind',
  'invite',
  'force_time_delay_list_refresh',
  'rule',
  'check_comment_at_me',
  'remarks_opinion_at_me',
  'remarks_opinion_comment_at_me',
  'task_report_at_me',
  'work_report_at_me',
  'work_report_comment_at_me',
  'work_report_remind',
  'task_talk_at_push',
  'follow_request',
  'task_synergy',
  'report_send',
  'approval_remarks_at_me',
  'approval_remarks_comment_at_me',
  'chan_dao_need',
  'chan_dao_task',
  'chan_dao_bug',
  'force_report_clear',
  'force_report_update',
  'force_report_set',
  'work_report_remind',
  'task_todo_know', //任务待办知晓
  'task_report_comment_at_me',
]
const taskwaitTypeEnum = ['task_todo_know']

// 系统推送
const systemPush = (currentMsyg: any) => {
  const reportData = filterMsg([currentMsyg])
  // 强制汇报推送数据
  if (reportData.length > 0) {
    const dataList = $store.getState().reportListData.dataList.concat(reportData)
    $store.dispatch({ type: 'FORCE_REPORT_DATA', data: { dataList } })
  }
  if (noticeTypeEnum.includes(currentMsyg.noticeType)) {
    /**
     * ht该类型展示弹窗
     */
    if (currentMsyg.noticeType === 'force_time_delay_list_refresh') {
      return false
    }

    const { systemMsgs } = $store.getState()
    let systemAllMsg = []
    if (systemMsgs.length) {
      systemAllMsg = [...systemMsgs, currentMsyg]
    } else {
      systemAllMsg = [currentMsyg]
    }
    $store.dispatch({ type: 'SET_SYSTEM_MSG', data: { systemMsgs: systemAllMsg } })
    ipcRenderer.send('show_notice_window')
    // 任务待办推送数据
    if (taskwaitTypeEnum.includes(currentMsyg.noticeType)) {
      $store.dispatch({ type: 'TASK_WAIT_DATA', data: { data: currentMsyg } })
    }
  }
}

const dataSort = (dataArr: any[]) => {
  dataArr.sort((a: any, b: any) => {
    if (a.isTop === b.isTop) {
      return moment(b.time).valueOf() - moment(a.time).valueOf()
    }
    return b.isTop - a.isTop
  })
  return dataArr
}

const updateChatRoom = (msgContent: any, nowListData: any) => {
  const { nowAccount, nowUserId } = $store.getState()
  const { fromAccount, type, subType, roomId, from, message, time, profile } = msgContent
  // 收到新消息
  nowListData.map((item: any) => {
    if (item.id === roomId) {
      if (type === 4 && subType === 0) {
        // 新消息为 发布的新公告
        item.mucRelationNoticeModel = {
          mucRelationId: roomId,
          userAccount: fromAccount,
          username: from,
          content: message,
          createTime: moment(time).format('YYYY/MM/DD HH:mm:ss'),
          headPhoto: profile,
        }
        item.content = JSON.stringify({ from, message, type: 4, subType: 0 })
      }
      if (!(type === 4 && subType === 0)) {
        if (fromAccount !== nowAccount) {
          // 更新消息未读数量
          if (subType === 5) {
            // 撤回的消息
            item.unreadCount = item.unreadCount > 0 ? item.unreadCount - 1 : 0
          } else {
            // 其他消息
            item.unreadCount += 1
          }
        }
        item.content = JSON.stringify(msgContent)
      }
      item.isFirst = 1
      item.time = moment(new Date().getTime()).format('YYYY/MM/DD HH:mm')
    } else {
      item.isFirst = 0
    }
  })
  // 更新本地缓存
  // updateChatRoomDetail({ userId: nowUserId, data: dataSort(nowListData) })
}

// 聊天消息
const pushChatMsg = (msgcontent: any) => {
  const { nowUserId } = $store.getState()
  const currentMsyg = JSON.parse(msgcontent)
  const { type, subType, remindType, roomId: newMsgRoomId } = currentMsyg
  fetchChatRoom(nowUserId).then((localData: any) => {
    if (localData) {
      const mucIsOpen = localData?.every((item: globalInterface.ChatListProps) => {
        return item.roomId !== newMsgRoomId
      })
      // 关闭的聊天室收到新消息自动打开
      if (mucIsOpen && type === 2 && subType === 1) {
        openWindow(newMsgRoomId).then((resData: any) => {
          // updateChatRoomDetail({ userId: nowUserId, data: dataSort([...localData, resData]) })
        })
      }
      // 更新列表信息
      updateChatRoom(currentMsyg, localData)
      // 更新侧边栏未读消息
      if (!remindType) {
        //刷新工作台头部沟通红点数量
        ipcRenderer.send('refresh_meet_connect', ['talk_count'])
      }
    } else {
      batchInsertChatRoom({ userId: nowUserId, data: [currentMsyg] })
    }
  })
}

//接收消息
const onMessage = (msg: any) => {
  if (!xmppConnected.connected) {
    return
  }
  try {
    // 解析出<message>的from、type属性，以及body子元素
    const from = msg.getAttribute('from')
    // 不带@的账号
    const fromUser = from.substring(from.indexOf('/') + 1, from.length)
    // 系统通知
    const sysType = msg.getAttribute('type')
    // 消息内容
    const bodyHtml = msg.getElementsByTagName('body')[0].innerHTML
    // 判断消息是否有record
    const recordHtml = msg.getElementsByTagName('record')[0]
    // 是否是历史消息 undefined为即时消息
    const delay = msg.getElementsByTagName('delay')[0]
    //  如果不是json类型的消息，直接返回
    if (!$tools.isJsonString(bodyHtml)) {
      return true
    }
    const dataJson = JSON.parse(bodyHtml)
    // 解决移动端发送的消息中包含<>转为unicode码无法显示问题
    // dataJson.messageJson = dataJson.messageJson
    //   ?.replace(/(?<!\\)\u003c/g, '&amp;lt;')
    //   .replace(/(?<!\\)\u003e/g, '&amp;gt;')
    const msgcontent = JSON.stringify(dataJson)
    const currentMsyg = JSON.parse(msgcontent)
    if (sysType == 'headline') {
      ipcRenderer.send('update_chat_room', [msgcontent])
    }
    //接收到消息刷新工作台
    if (fromUser === 'Smack') {
      if (
        currentMsyg.subType === 543 ||
        currentMsyg.subType === 544 ||
        currentMsyg.subType === 545 ||
        currentMsyg.subType === 549
      ) {
        ipcRenderer.send('set_now_msg', [msgcontent])
        ipcRenderer.send('update_chat_room', [msgcontent])
      } else if (currentMsyg.subType === 553) {
        // 553类型只添加监听，不添加到聊天列表中展示出来
        ipcRenderer.send('add_new_chat_room', currentMsyg.roomJid)
      } else if (currentMsyg.subType === 331) {
        if (currentMsyg.hasOwnProperty('noticeTypes')) {
          const { recallInfoMsg } = $store.getState()
          const { noticeTypeId, noticeType } = recallInfoMsg
          //撤回审批
          if (checkCecall(currentMsyg.noticeTypes, noticeType) && currentMsyg.noticeTypeId === noticeTypeId) {
            ipcRenderer.send('handle_messages_option', ['check_comment_at_me', noticeTypeId, noticeType])
          }
        }
      } else if (currentMsyg.subType === 1003) {
        refreshTool(currentMsyg)
      } else {
        // push消息
        systemPush(currentMsyg)
      }
    } else if (delay === undefined && recordHtml) {
      // 聊天消息
      const { selectItem, chatListData, openRoomIds, nowUserId } = $store.getState()
      if (!selectItem.roomId) {
        pushChatMsg(msgcontent)
      }
      // 任务栏高亮
      const msgNew = JSON.parse(msgcontent)
      const { roomId, fromUser: msgFrom } = msgNew
      const dataCurrent = chatListData.find((item: any) => {
        return item.roomId === roomId
      })
      if ((!dataCurrent || dataCurrent?.remindType === 0) && msgFrom?.userId !== nowUserId) {
        // 该聊天室是否打开
        const hasOpen = openRoomIds.some(thisId => {
          return thisId === roomId
        })
        if (hasOpen) {
          // 沟通窗口闪烁
          ipcRenderer.send('flash_goalgo', [true, 'ChatWin'])
        } else {
          // 主窗口闪烁
          ipcRenderer.send('flash_goalgo', [true, 'Home'])
        }
      }
      ipcRenderer.send('update_chat_room', [msgcontent])
      ipcRenderer.send('set_now_msg', [msgcontent])
      // 如果沟通窗口关闭，及时闪烁
      findUserUnReadMuc().then(() => {
        ipcRenderer.send('change_tray_icon')
      })
      // }
    }
    return true
  } catch (error) {
    return true
  }
}
//PUSH消息推送弹窗关闭+刷新优化
const refreshTool = (currentMsyg: any) => {
  ipcRenderer.send('update_unread_num', ['']) //更新待办数量
  //关闭需要关掉的弹窗
  const { systemMsgs } = $store.getState()
  if (systemMsgs.length) {
    //匹配需要关掉的推送弹窗
    checkHasMsg(systemMsgs, currentMsyg.noticeTypeIds, currentMsyg.noticeTypes)
  }
}
//校验当前消息是否存在所有消息集合中-存在则关闭弹窗更新未读消息
const checkHasMsg = (systemMsgs: Array<any>, ids: Array<any>, types: Array<any>) => {
  const arr = [...systemMsgs]
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].noticeType == 'task_talk_at_push') {
      if (types.includes(arr[i].noticeType) && ids.includes(arr[i].spareId)) {
        arr.splice(i, 1)
      }
    } else {
      if (types.includes(arr[i].noticeType) && ids.includes(arr[i].noticeTypeId)) {
        arr.splice(i, 1)
      }
    }
  }
  // 打开窗口
  if (arr.length > 0) {
    ipcRenderer.send('close_notice_window')
    setTimeout(() => {
      ipcRenderer.send('show_notice_window')
    }, 10)
  } else {
    ipcRenderer.send('close_notice_window')
  }
  console.log('XXXXXXXXXXXXXXXXXXXXXXXXXX---------------------------------')
  ipcRenderer.send('change_tray_icon') //关闭消息闪烁
  // 更新未读消息
  $store.dispatch({
    type: 'SET_SYSTEM_MSG',
    data: { systemMsgs: arr.length > 0 ? arr : [] },
  })
}

//撤回操作关闭右下角PUSH窗口
const checkCecall = (noticeTypes: Array<any>, noticeType: string) => {
  let isrecall = false
  for (let i = noticeTypes.length; i--; ) {
    if (noticeTypes[i] == noticeType) {
      isrecall = true
      break
    }
  }
  return isrecall
}
//获取当前成员的所有聊天室
const getAllRoomList = () => {
  return new Promise(resolve => {
    const { nowUserId, loginToken } = $store.getState()
    const param = {
      userId: nowUserId,
    }
    $api
      .request('/im-biz/chatRoom/listRoomJids', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const roomList = resData.dataList || []
        resolve(roomList)
      })
  })
}

function onConnect(status: Strophe.Status, error: any) {
  if (status == Strophe.Status.CONNECTING) {
    xmppConnected.connected = false
    console.log('连接中...')
  } else if (status == Strophe.Status.AUTHFAIL) {
    console.log('登录失败！检查用户名和密码')
  } else if (status == Strophe.Status.DISCONNECTED) {
    // xmpp链接异常
    ipcRenderer.send('connected_error', [])
    console.log('连接异常')
    xmppConnected.connected = false
    //断网后才重连
    console.log(LoginXmpp.instance)
    if (LoginXmpp.instance !== null) {
      console.log('重连测试')
      LoginXmpp.getInstance().connect($store.getState().nowAccount, '123456')
    }
  } else if (status == Strophe.Status.CONNTIMEOUT) {
    xmppConnected.connected = false
    console.log('连接超时')
  } else if (status == Strophe.Status.CONNECTED) {
    // 当接收到<message>节，调用onMessage回调函数
    console.log('连接成功')
    const parentThis = LoginXmpp.getInstance()
    // 网络断开重连后
    ipcRenderer.send('connected_now_msg', [])
    // 监听群聊的回执
    parentThis.connection.addHandler(onMessage, '', 'message', '', '', '')
    // 监听私聊的回执
    // parentThis.connection.addHandler(onMessage, '', 'iq', '', '', '')
    //初始化监听所有
    parentThis.connection.send($pres().tree())
    //进入所有聊天室
    getAllRoomList().then((list: any) => {
      const date = new Date()
      list.map((item: any) => {
        // 发送<presence>元素，加入房间
        // const pres = $pres({
        //   from: parentThis.jid,
        //   to: item,
        // })
        //   .c('x', { xmlns: 'http://jabber.org/protocol/muc' })
        //   .c('history', { maxstanzas: '0', maxchars: '0', since: date, seconds: 0 })
        const pres = $pres({
          from: parentThis.jid,
          to: item + '/' + parentThis.jid.substring(0, parentThis.jid.indexOf('@')),
        })
          .c('x', {
            xmlns: 'http://jabber.org/protocol/muc',
          })
          // .c('history', { maxstanzas: '0', maxchars: '0', since: date, seconds: 0 })
          .tree()
        parentThis.connection.send(pres)
      })
    })
    // 连接成功
    xmppConnected.connected = true
  }
}
export class LoginXmpp {
  jid: string
  pass: string
  connection: Strophe.Connection | null
  sendMsgToRoom: any
  sendPrivateToRoom: any
  instance: null
  id: number
  static instance: any
  disConnect: any
  addNewChat: any
  socketObj: any
  lockReconnect: boolean
  times: any
  reconnect: any
  constructor() {
    this.instance = null
    this.jid = ''
    this.pass = ''
    xmppConnected.connected = false
    this.id = new Date().getTime()
    this.connection = null
    this.sendMsgToRoom = this.sendMsg
    this.sendPrivateToRoom = this.sendPrivateMsg
    this.disConnect = this.quitXmpp
    this.socketObj = null
    this.connect($store.getState().nowAccount, '123456')
    this.lockReconnect = false
    this.times = null
  }
  // 连接xmpp
  connect(name: string, password: string) {
    return new Promise(() => {
      if (!xmppConnected.connected) {
        this.jid = name.replace('@', '') + IPSUFFIX
        this.connection = new Strophe.Connection(BOSH_SERVICE, { keepalive: true })
        try {
          this.connection.restore('', onConnect)
        } catch (e) {
          if (e.name !== 'StropheSessionError') {
            console.log(e)
            throw e
          }
          this.connection.connect(this.jid, password, onConnect, 1)
        }
        this.pass = password
      }
    }).catch(err => {
      console.log(err)
    })
  }

  /**
   * 连接状态改变的事件
   * @param status 连接状态
   */
  sendMsg(msg: string, muc: string) {
    console.log('进入群聊...')
    const msgInfo = JSON.parse(msg)
    const { msgUuid } = msgInfo || {}
    const sendMsg = $msg({
      to: muc,
      from: this.jid,
      type: 'groupchat',
    })
      .c('body', null, msg)
      .c('msgInfo', { msgUuid: msgUuid })

    //===============================
    //如果连接了直接发送
    if (xmppConnected.connected) {
      console.log('xmpp正常连接....')
      LoginXmpp.instance.connection.send(sendMsg.tree())
      return
    }
    //发送失败
    console.log('xmpp连接异常....', msg)
    ipcRenderer.send('error-send-msg', msg)
  }
  sendPrivateMsg(args: any) {
    console.log('进入私聊...')
    const msgInfo = JSON.parse(args[0])
    const { msgUuid } = msgInfo || {}
    const sendMsg = $msg({
      to: args[1],
      from: this.jid,
      type: 'chat',
    })
      .c('body', null, args[0])
      .c('msgInfo', { msgUuid: msgUuid })
    //如果连接了直接发送
    if (xmppConnected.connected) {
      console.log('xmpp正常连接....')
      LoginXmpp.instance.connection.send(sendMsg.tree())
      return
    }
    //发送失败
    console.log('xmpp连接异常....', args[0])
    ipcRenderer.send('error-send-msg', args[0])
  }
  //退出xmpp连接
  quitXmpp() {
    //断开连接，
    LoginXmpp.instance.connection.disconnect('loginout')
    //销毁单例
    LoginXmpp.instance = null
    xmppConnected.connected = false
  }
  // 单例
  static getInstance() {
    if (!LoginXmpp.instance) {
      this.instance = new LoginXmpp()
    }
    return this.instance
  }
  //获取连接
}

// 过滤出 强制汇报msg
export const filterMsg = (arr: any) => {
  if (arr.length == 0) return []
  const newArr: any = []
  arr.forEach((item: any) => {
    if (
      item.noticeType == 'force_report_time_out' ||
      item.noticeType == 'force_report_delay_time_out' ||
      item.noticeType == 'force_time_delay_list_refresh'
    ) {
      if (item.noticeType == 'force_time_delay_list_refresh' || item.content) newArr.push(item)
    }
  })
  return newArr
}

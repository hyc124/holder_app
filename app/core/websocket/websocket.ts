/**
 * 连接websocket
 */

import devConfig from '@root/build/dev.config'
import io from 'socket.io-client'
import { ipcRenderer } from 'electron'
import { message } from 'antd'
import { loginExit } from '@/src/components'

const loginSocketConnected = new Proxy(
  { connected: false },
  {
    set: function(obj, prop, value) {
      obj[prop] = value
      return true
    },
  }
)
let loginSocket: any = null
let isQuit = false
const env = process.env.BUILD_ENV
const socketServers =
  env === 'dev'
    ? devConfig.env['dev']['variables']['SOCKET_SERVER']
    : devConfig.env['prod']['variables']['SOCKET_SERVER']
export class LoginWebSocket {
  instance: null
  static instance: any
  disConnect: any
  socketObj: any
  lockReconnect: boolean
  times: any
  reconnect: any
  constructor() {
    const token = $store.getState().loginToken
    const socketUrl = socketServers + '?token=' + token + '&system=oa'
    loginSocket = io(socketUrl, { transports: ['websocket'] })
    this.instance = null
    loginSocketConnected.connected = false
    this.disConnect = this.quitWebSocket
    this.socketObj = null
    this.connectWebSocket()
    this.lockReconnect = false
    this.times = null
  }
  // 连接websocket
  connectWebSocket() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    return new Promise(() => {
      loginSocket.on('connect', () => {
        console.log('socket连接已开启')
      })
      loginSocket.on('defaultEvent', function(data: any) {
        const reciveData = JSON.parse(data)
        // @聊天已知晓
        if (reciveData.handle === 'handle_message_appraise') {
          ipcRenderer.send('onAndoffLine', reciveData)
        }
        // 上下线
        if (reciveData.handle === 'userOnlineOrOffline') {
          const customContent = reciveData.customContent ? JSON.parse(reciveData.customContent) : ''
          ipcRenderer.send('user_online_or_offline', customContent)
        }
        // 进入聊天室更新消息未读人数
        if (reciveData.handle === 'enterRoom') {
          const muc = $store.getState().selectItem?.muc?.split('@')[0]
          const nowUserId = $store.getState().nowUserId
          if (muc === reciveData.noticeContent) {
            if (Number(reciveData.userAccount) !== nowUserId) {
              ipcRenderer.send('enter_room_userinfo', {
                noticeContent: reciveData.noticeContent,
                userAccount: Number(reciveData.userAccount),
              })
            }
          }
          if (Number(reciveData.userAccount) === nowUserId) {
            // 登录同一账号在不同客户端进入聊天室更新另一端的未读消息
            ipcRenderer.send('enter_room_update_log', {
              noticeContent: reciveData.noticeContent,
              userAccount: Number(reciveData.userAccount),
            })
            //刷新工作台头部沟通红点数量
            ipcRenderer.send('refresh_meet_connect', ['talk_count'])
          }
        }
        // 图标表态
        if (reciveData.handle === 'chatMessageAppraise') {
          const customContent = reciveData.customContent ? JSON.parse(reciveData.customContent) : ''
          ipcRenderer.send('take_icon_stand', { ...customContent.content, status: customContent.status })
        }
        // 当前登录的token等于被踢的token，提示账号被挤下线，主动关闭退出
        if (reciveData.handle === 'kickOutSession') {
          const token = $store.getState().loginToken
          const customContent = reciveData.customContent ? JSON.parse(reciveData.customContent) : ''
          if (customContent.kickOutToken === token) {
            message.error(reciveData.noticeContent)
            loginExit({ key: 'loginOut' })
          }
        }
        // 考勤补卡审批监听
        if (reciveData.handle === 'startApproval') {
          const noticeContent = reciveData.noticeContent ? JSON.parse(reciveData.noticeContent) : ''
          ipcRenderer.send('start_approval', {
            noticeContent: noticeContent,
            userAccount: Number(reciveData.userAccount),
          })
        }
      })
      loginSocket.on('disconnect', function() {
        console.log('socketio连接已关闭')
      })
      loginSocket.on('reconnect', function() {
        console.log('socketio已重连')
      })
      loginSocket.on('connect_error', (error: any) => {
        console.log('socketio连接出错', error)
      })
    }).catch(err => {
      console.log(err)
    })
  }

  //退出xmpp连接
  quitWebSocket() {
    loginSocket.disconnect()
    LoginWebSocket.instance = null
    loginSocketConnected.connected = false
    loginSocket = null
    isQuit = true
  }
  // 单例
  static getInstance() {
    if (!this.instance) {
      isQuit = false
      this.instance = new LoginWebSocket()
    }
    return this.instance
  }
}

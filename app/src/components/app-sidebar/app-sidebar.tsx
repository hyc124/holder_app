import React from 'react'
import { Tooltip, Avatar, Dropdown, Menu, Button, message as antMsg } from 'antd'
import { remote, ipcRenderer } from 'electron'
import AppSideMenus from './side-menus.json'
import './app-sidebar.less'
import moment from 'moment'
import { withRouter } from 'react-router-dom'
import { withStore } from '../with-store'
import $c from 'classnames'
import UsercenterModal from './Modals/userCenter'
import devConfig from '@root/build/dev.config'
import Axios from 'axios'
import { queryDeskTabs } from '@/src/views/workdesk/getData'
import { langTypeHandle } from '@/src/common/js/intlLocales'
import { queryFunsAuthApi, queryVersionUpgrade } from './appCommonApi'
import AppSet from './Modals/appSet/appSet'
import {
  deleteChatRoom,
  insertBriefMsg,
  insertChatRoom,
  queryLocalbrief,
  saveDraftMsg,
  updateBriefMsg,
  updateChatRoom,
} from '@/src/views/chatwin/getData/ChatInputCache'
import { customQuery } from '@/src/views/workdesk/getData'
import { findAuthList, getAuthStatus } from '@/src/common/js/api-com'
// import { directive } from 'vue/types/umd'
import { updateWindowState } from '@/src/views/chatwin/getData/getData'
import { LoginXmpp } from '@/core/xmpp/im'
// import { makeDraggable } from '@/src/common/js/common'
// const drag = require('electron-drag')
const app = remote.app
interface SideMenuItem {
  key: string
  href: string
  title: string
}
interface TeamListItem {
  name: any
  id: number
  shortName: string
  logo: string
  isLast: number
  waitHandleCount: number
}
interface UnreadCountProps {
  noticeCount: number
  synergyCount: number
  approveCount: number
  workdeskCount: number
  workPlanCount: number
  talkCount: number
  systemNoticeCount: number
}
interface SystemNumProps {
  allTypeCount: number
  taskTypeCount: number
  meetingTypeCount: number
  appointmentTypeCount: number
  inviteTypeCount: number
  approvalTypeCount: number
  atMeTypeCount: number
  workReportCount: number
  workPlanCount: number
  noticeCount: number
  allNotRead: number
  taskNotRead: number
  noticeNotRead: number
  bookNotRead: number
  meetingNotRead: number
  approvalNotRead: number
  workReportNotRead: number
  workPlanNotRead: number
  easyNoticeNotRead: number
}
interface State {
  activeMenuKey: string
  routeProps: any
  chatLoading: boolean
  approvalLoading: boolean
  teamList: TeamListItem[]
  modalVisible: boolean
  unreadMsgCounts: UnreadCountProps
  modulecont: SystemNumProps
  showTaskTip: boolean
  ishover: boolean
  funsAuthList: any
  mainMenu: any
  menuBottom: any
  isUpgrade?: boolean
  userInfo: any
  isMaximized?: boolean
  rainbow: any
}
// 全局定义是否使用新权限控制
export const NEWAUTH812 = false
// 设置点击外层关闭弹窗

// 外部调用退出登录
export let loginExit: any = null
// 头部刷新方法
export let refreshDeskAvater: any = null
export let refreshRainBow: any = null
const userCenter = [
  {
    key: 'companyManage',
    value: '企业管理后台',
  },
  // {
  //   key: 'authManage',
  //   value: '权限管理',
  // },
  {
    key: 'userCenter',
    value: '设置',
  },
  {
    key: 'helpCenter',
    value: '帮助中心',
  },
  {
    key: 'loginOut',
    value: '退出登录',
  },
]
let isUnmounted = false
@withStore(['userInfo'])
class AppSidebar extends React.Component<any, State> {
  cardshow: any
  // 构造器
  constructor(props: any) {
    super(props)
  }

  state: State = {
    activeMenuKey: AppSideMenus.mainMenu[0]?.key,
    routeProps: null,
    chatLoading: false,
    approvalLoading: false,
    teamList: [],
    modalVisible: false,
    unreadMsgCounts: {
      noticeCount: 0,
      synergyCount: 0,
      approveCount: 0,
      workdeskCount: 0,
      workPlanCount: 0,
      talkCount: 0,
      systemNoticeCount: 0,
    },
    modulecont: {
      allTypeCount: 0,
      taskTypeCount: 0,
      meetingTypeCount: 0,
      appointmentTypeCount: 0,
      inviteTypeCount: 0,
      approvalTypeCount: 0,
      atMeTypeCount: 0,
      workReportCount: 0,
      workPlanCount: 0,
      noticeCount: 0,
      allNotRead: 0,
      taskNotRead: 0,
      noticeNotRead: 0,
      bookNotRead: 0,
      meetingNotRead: 0,
      approvalNotRead: 0,
      workReportNotRead: 0,
      workPlanNotRead: 0,
      easyNoticeNotRead: 0,
    },
    userInfo: $store.getState().userInfo,
    showTaskTip: false,
    ishover: false,
    funsAuthList: [],
    rainbow: {
      //彩虹名称
      text: '',
      name: '',
    },
    mainMenu: [],
    menuBottom: [],
    isUpgrade: false,
    isMaximized: false, //窗口是否是最大化状态
  }
  // 设置中心弹框组件
  appSetModalRef: any = {}

  //点击展开企业
  clickShowTeamList = () => {
    const { nowUserId, nowAccount } = $store.getState()
    const params = {
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }
    $api
      .request('/team/enterpriseInfo/newQueryTeamList', params, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: $store.getState().loginToken,
        },
      })
      .then(res => {
        if (res.returnCode === 0) {
          this.setState({
            teamList: res.dataList,
          })
        }
      })
      .catch(() => {})
  }

  openRoom = async (resData: any, setSelect?: boolean) => {
    const { chatListData, selectItem, nowUserId } = $store.getState()
    const dataList = JSON.parse(JSON.stringify(chatListData))
    let data = []
    if (dataList.some((res: any) => res.id == resData.id)) {
      data = [...dataList]
    } else {
      data = [...dataList, resData]
      insertChatRoom(resData)
    }
    // 列表排序
    data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
      if (a.isTop === b.isTop) {
        return moment(b.time).valueOf() - moment(a.time).valueOf()
      }
      return b.isTop - a.isTop
    })
    // 更新左侧列表
    await $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
    // await getLocalRoomData(false, 'time')
    // 设置选中的聊天室
    if (setSelect) {
      // 设置选中的聊天室
      saveDraftMsg(Object.assign({}, selectItem), resData, $store.dispatch)
      $store.dispatch({ type: 'SET_SELECT_ITEM', data: resData })
    }
    // 设置滚动条位置
    data.map((item: globalInterface.ChatListProps, index: number) => {
      if (item.id === resData.id) {
        const offsetTop = index * 62
        $('#chat_list_main').scrollTop(offsetTop - 100)
      }
    })
    // 更新本地数据库
    // updateChatRoomDetail({ userId: nowUserId, data })
  }

  updateChatList = (dataList: any[], briefMsgList: any) => {
    // 更新简略信息
    $store.dispatch({ type: 'SET_CHAT_MESSAGE', data: { messageList: briefMsgList || [] } })
    // 更新工作台聊天室列表数据
    $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: dataList } })
    // getLocalRoomData(false, 'isFirst')
    // updateChatRoomDetail({ userId: nowUserId, data: dataList })
  }

  checkUpVersion = (e: any) => {
    if (!isUnmounted) {
      this.setState({ activeMenuKey: e.detail.name, routeProps: e.detail })
      // 查询版本更新信息
      if (e.detail.name != 'Login') {
        findVersionUpgrade().then((res: any) => {
          const isUpgrade: boolean = res.nowVersionNum < res.remoteVersionNum
          this.setState({ isUpgrade })
        })
      }
    }
  }
  // 更新聊天室的简略信息
  upDateChatBrief = (msgContent: any, roomType: number | null) => {
    const { type, fromUser, isRecall, messageJson, roomId } = msgContent || {}
    const { messageList } = $store.getState()
    const nowBriefMsgList = JSON.parse(JSON.stringify(messageList))
    nowBriefMsgList.map((item: any) => {
      if (item.roomId === roomId) {
        item.roomType = roomType
        item.type = type
        item.isRecall = isRecall
        item.messageJson = messageJson
        item.fromUser = fromUser
      }
    })
    return nowBriefMsgList
  }

  async componentDidMount() {
    window.addEventListener('click', function(e: any) {
      if (e.target.className == 'sider_bgc' || e.target.className == 'sider_text') {
        $('.sider_bgc').animate({ left: '0px' }, 800)
      } else {
        $('.sider_bgc').animate({ left: '-600px' }, 800)
      }
    })
    // 弹出
    setTimeout(() => {
      $('.sider_bgc').animate({ left: '0px' }, 800)
      // 滑入
      setTimeout(() => {
        $('.sider_bgc').animate({ left: '-600px' }, 800)
      }, 4000)
    }, 2000)

    // 滑入
    // setTimeout(() => {
    //   $('.sider_bgc').animate({ left: '-600px' }, 800)
    // }, 8000)

    refreshDeskAvater = this.refreshDeskAvaterFn
    refreshRainBow = this.refreshRainBow
    // 初始化字体颜色
    $('.ant-menu-item-selected').css('color', '#212224')
    // 基本信息

    const { nowUserId } = $store.getState()
    isUnmounted = false
    if (!isUnmounted) {
      this.setState({
        teamList: $store.getState().newTeamList,
      })
      // this.getMessageCount([])

      window.addEventListener('router_update', this.checkUpVersion)
      ipcRenderer.removeAllListeners('update_unread_msg').on('update_unread_msg', (event, args) => {
        // this.getMessageCount(args)
      })
      ipcRenderer.on('update_notice_count', () => {
        const data = this.state.unreadMsgCounts
        this.setState({
          unreadMsgCounts: {
            ...data,
            noticeCount: data.noticeCount > 0 ? data.noticeCount - 1 : 0,
          },
        })
      })
      ipcRenderer.removeAllListeners('task_finish_visble').on('task_finish_visble', (event, args) => {
        this.setState({
          showTaskTip: args === 1 ? true : false,
        })
      })
      ipcRenderer.removeAllListeners('update_chat_room').on('update_chat_room', (_event, data) => {
        const nowMsg = data[0]
        if ($tools.isJsonString(nowMsg) && nowMsg) {
          const { chatListData, selectItem, openRoomIds, messageList } = $store.getState()
          const msgContent = JSON.parse(nowMsg)
          const { type, roomId: newMsgRoomId, messageJson, fromUser, content, isRecall } = msgContent
          const { userId } = fromUser || {}
          // 更新侧边栏未读
          if (selectItem && newMsgRoomId !== selectItem.roomId) {
            chatListData?.map((item: globalInterface.ChatListProps) => {
              if (item.roomId === newMsgRoomId && !item.remindType) {
                //刷新工作台头部沟通红点数量
                ipcRenderer.send('refresh_meet_connect', ['talk_count'])
              }
            })
          }
          // 20001, "创建群聊推送" 20002, "加入群聊" 20003, "退出群聊" 20004, "被踢出群聊" 20005, "解散聊天室" 20006, "设置群管理" 20007, "取消群管理" 20008, "移交群主"
          if (isSystemMsg(type)) {
            const { chatUserInfo } = $store.getState()
            const systemMsg = JSON.parse(content, msgContent)
            if (type === 20001 || type === 20002) {
              const { roomInfo } = systemMsg || {}
              const filterRoom = chatListData.filter((item: any) => item.roomId === roomInfo?.roomId)
              const parentThis = LoginXmpp.getInstance()
              // 如果创建的聊天室在本地的chatListData中不存在，则将当前的聊天信息加入到chatListData中
              if (!filterRoom.length) {
                // 创建群聊
                const data = [roomInfo, ...chatListData]
                //存入本地数据库
                insertChatRoom(roomInfo)
                // 列表排序
                data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
                  if (a.isTop === b.isTop) {
                    return moment(b.timeStamp).valueOf() - moment(a.timeStamp).valueOf()
                  }
                  return b.isTop - a.isTop
                })
                // 简略消息
                const briefMsg = {
                  roomType: roomInfo.type,
                  roomId: roomInfo.roomId,
                }
                // 更新简略消息
                const newBriefList = [briefMsg, ...messageList]

                queryLocalbrief(roomInfo.roomId).then((localeData: any) => {
                  //如果本地数据库存在当前聊天室简略消息，则更新，否则添加
                  if (!!localeData) {
                    updateBriefMsg(roomInfo.roomId, briefMsg)
                  } else {
                    insertBriefMsg(roomInfo.roomId, {
                      roomType: roomInfo.type,
                    })
                  }
                })

                // 更新简略信息
                $store.dispatch({ type: 'SET_CHAT_MESSAGE', data: { messageList: newBriefList || [] } })
                // 更新工作台聊天室列表数据
                $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
                // getLocalRoomData(false, 'time')
              }

              // 加入聊天室,向后端发送pres包
              const pres = $pres({
                from: parentThis.jid,
                to: roomInfo.roomJid + '/' + parentThis.jid.substring(0, parentThis.jid.indexOf('@')),
              })
                .c('x', {
                  xmlns: 'http://jabber.org/protocol/muc',
                })
                // .c('history', { maxstanzas: '0', maxchars: '0', since: date, seconds: 0 })
                .tree()
              parentThis.connection.send(pres)
              // 更新本地数据库
              // updateChatRoomDetail({ userId: nowUserId, data })
              // 退出群聊
            } else if (type === 20004 || type === 20005) {
              const { roomId, roomInfo } = systemMsg || {}
              const targetId = roomId ? roomId : roomInfo?.roomId
              if (targetId) {
                if (selectItem.roomId === targetId) {
                  $store.dispatch({ type: 'SET_SELECT_ITEM', data: {} })
                }
                const filterRoom = chatListData.filter((item: any) => item.roomId !== targetId)
                //从本地数据库移除聊天室
                deleteChatRoom(targetId)
                // 更新工作台聊天室列表数据
                $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: filterRoom } })
              }
              // getLocalRoomData(false, '')
            } else if (type === 20006) {
              // 设置管理员
              $store.dispatch({
                type: 'SET_CHAT_USERINFO',
                data: {
                  chatUserInfo: {
                    ...chatUserInfo,
                    userType: 2,
                  },
                },
              })
            } else if (type === 20007) {
              // 取消管理员
              // 设置管理员
              $store.dispatch({
                type: 'SET_CHAT_USERINFO',
                data: {
                  chatUserInfo: {
                    ...chatUserInfo,
                    userType: 1,
                  },
                },
              })
            }
          } else {
            // type为0时，为系统通知消息
            if (type === 0) {
              const _json = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
              //退出聊天室
              if (_json.type === 20003) {
                const content = _json.content || '{}'
                const { operatorUser } = JSON.parse(content)
                const { userId } = operatorUser
                //如果当前退出聊天室的人是本来的话，关闭对应的聊天室，并且从聊天室移除对应人员
                if (nowUserId === userId) {
                  //更新打开的聊天室
                  const { openRoomIds, chatListData } = $store.getState()
                  const newOpenRoomids = openRoomIds.filter((roomId: any) => roomId !== newMsgRoomId)
                  $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newOpenRoomids })
                  //关闭对应的聊天室 windowClose
                  const data = JSON.parse(JSON.stringify(chatListData))
                  const newChatListData = data.filter((item: any) => item.roomId !== newMsgRoomId)
                  deleteChatRoom(newMsgRoomId)
                  $store.dispatch({
                    type: 'SET_CHAT_LIST',
                    data: { chatListData: newChatListData },
                  })
                  // getLocalRoomData(false, '')

                  if (selectItem.roomId === newMsgRoomId) {
                    //清空选中
                    $store.dispatch({ type: 'SET_SELECT_ITEM', data: {} })
                  }
                }
              }
            } else {
              const nowListData = JSON.parse(JSON.stringify(chatListData))
              let roomType: number | null = null
              nowListData.map((item: globalInterface.ChatListProps) => {
                // 收到新消息
                if (item.roomId === newMsgRoomId) {
                  roomType = item.type
                  // 更新消息未读数量
                  if (userId !== nowUserId && newMsgRoomId !== selectItem.roomId) {
                    if (isRecall === 1) {
                      // 撤回的消息
                      item.unreadCount = item.unreadCount > 0 ? item.unreadCount - 1 : 0
                    } else {
                      // 其他消息
                      item.unreadCount += 1
                    }
                  }
                  if (item.windowClose === 1) {
                    item.windowClose = 0
                    const params = {
                      roomId: newMsgRoomId,
                      state: 0,
                      userId: nowUserId,
                    }
                    updateWindowState(params).then(() => null)
                  }
                  // item.content = nowMsg
                  item.isFirst = 1
                  item.timeStamp = new Date().getTime()
                  item.windowClose = 0
                  updateChatRoom(item)
                } else {
                  item.isFirst = 0
                }
              })
              // 聊天室列表排序
              nowListData.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
                if (a.isTop === b.isTop) {
                  return (b.isFirst || 0) - (a.isFirst || 0)
                }
                return b.isTop - a.isTop
              })
              // // 更新聊天室简略信息列表
              const newBriefMsg = this.upDateChatBrief(msgContent, roomType)
              // 更新聊天室列表
              this.updateChatList(nowListData, newBriefMsg)
            }
          }
        }
      })
    }

    // 存储退出登录全局方法
    loginExit = this.asyncDispatch
    //存储退出登录方法，接口请求时登陆过期时使用
    $store.dispatch({
      type: 'LOGINOUT_INFO',
      data: { loginOutFn: this.asyncDispatch, isLoginOut: false },
    })
    $store.dispatch({
      type: 'LOGINOUTFN',
      data: this.asyncDispatch,
    })
    // window.location.replace('/')
    // 查询系统导航权限
    !NEWAUTH812 && this.navMenuSet()

    // 查询版本更新信息（router_update有调用就不需要此处调用了）
    // findVersionUpgrade().then((res: any) => {
    //   const isUpgrade: boolean = res.nowVersionNum < res.remoteVersionNum
    //   this.setState({ isUpgrade })
    // })
  }

  componentWillUnmount() {
    isUnmounted = true
    // 查用户信息
    window.removeEventListener('router_update', this.checkUpVersion)
  }

  // componentWillUpdate(object nextProps, object nextState)
  componentDidUpdate(prevProps: any, prevState: any) {
    if (NEWAUTH812 && prevState.teamList != this.state.teamList) {
      // 更新企业权限
      const selectTeam: any = this.state.teamList.find(item => {
        return item.isLast === 1
      })
      this.navMenuSet({ typeId: selectTeam?.id })
    }
  }
  refreshDeskAvaterFn = (params: { newAvatar: any; sex: any }) => {
    this.state.userInfo.profile
    const val = {
      ...this.state.userInfo,
      sex: params.sex,
      profile: params.newAvatar,
    }
    this.setState({ userInfo: val })
  }
  refreshRainBow = (data: any) => {
    this.setState({ rainbow: data })
  }
  /**
   * 导航菜单设置
   */
  navMenuSet = async (paramObj?: { typeId: number }) => {
    if (!NEWAUTH812) {
      // 查询导航权限列表
      queryFunsAuthApi().then((res: any) => {
        const dataList = res?.dataList || []
        let mainMenu: any = []
        let menuBottom: any = []
        if (res) {
          // 保存导航权限全局数据
          $store.dispatch({
            type: 'FUNSAUTHLIST',
            data: [...dataList],
          })
          // 根据权限控制可展示按钮
          // 顶部导航菜单
          AppSideMenus.mainMenu.forEach((mItem: any) => {
            const findItem = dataList.find(
              (item: any) =>
                item.name == mItem.code && (mItem.hasAuth !== undefined ? mItem.hasAuth : item.hasAuth)
            )
            if (findItem) {
              mainMenu.push(mItem)
            }
          })
          // 底部导航菜单
          AppSideMenus.menuBottom.forEach((mItem: any) => {
            const findItem = dataList.find((item: any) => item.name == mItem.code && item.hasAuth)
            if (findItem) {
              menuBottom.push(mItem)
            }
          })
        } else {
          mainMenu = AppSideMenus.mainMenu
          menuBottom = AppSideMenus.menuBottom
        }
        this.setState({ funsAuthList: [...dataList], mainMenu, menuBottom })
      })
    } else {
      // 8.12
      await findAuthList({ typeId: paramObj?.typeId })

      // 8.12权限控制
      const mainMenu: any = []
      const menuBottom: any = []

      // 顶部导航菜单
      AppSideMenus.mainMenu.forEach((mItem: any) => {
        const findItem = mItem?.baseAuth || getAuthStatus(mItem?.authCode)

        if (findItem) {
          mainMenu.push(mItem)
        }
      })
      // 底部导航菜单
      AppSideMenus.menuBottom.forEach((mItem: any) => {
        const findItem = mItem?.baseAuth || getAuthStatus(mItem?.authCode)
        if (findItem) {
          menuBottom.push(mItem)
        }
      })

      this.setState({ mainMenu, menuBottom })
    }
  }

  /**
   * 查询消息统计
   * @param args
   */
  getMessageCount = (args: any[], msg?: string) => {
    let type = ''
    // 左侧未读消息
    const { nowUserId, nowAccount, newTeamList, loginToken } = $store.getState()
    this.setState({
      teamList: newTeamList,
    })
    const queryParams: any = {
      userId: nowUserId,
      userAccount: nowAccount,
    }
    if (args) {
      type = args[0]
    }
    if (type && this.checkType(type)) {
      queryParams.type = type
    }
    $api
      .request('/im-biz/workbench/count', queryParams, {
        headers: { loginToken },
        formData: true,
      })
      .then(res => {
        let selectTeam = newTeamList.find(item => {
          return item.isLast === 1
        })
        if (!selectTeam) {
          selectTeam = newTeamList.find(item => {
            return item.name === '所有企业'
          })
        }
        let workdeskCount = 0
        // 企业总未读数量
        const teamUnreadCount = selectTeam && selectTeam.waitHandleCount
        if (teamUnreadCount > 0) {
          workdeskCount = teamUnreadCount
        }
        if (!isUnmounted) {
          const data = this.state.unreadMsgCounts
          const { approveCount, talkCount, noticeCount, systemNoticeCount, reportCount } = res.obj
          if (type && this.checkType(type)) {
            if (type === 'approve_count') {
              //审批数量
              this.setState({
                unreadMsgCounts: {
                  ...data,
                  approveCount: approveCount,
                  workdeskCount,
                },
              })
            } else if (type === 'talk_count') {
              if (!data[1]) {
                this.setState({
                  unreadMsgCounts: {
                    ...data,
                    talkCount: talkCount,
                    workdeskCount,
                  },
                })
              }
            } else if (type === 'notice_count') {
              this.setState({
                unreadMsgCounts: {
                  ...data,
                  noticeCount: noticeCount,
                  workdeskCount,
                },
              })
            } else if (type === 'system_notice_count') {
              this.setState({
                unreadMsgCounts: {
                  ...data,
                  systemNoticeCount: systemNoticeCount,
                  workdeskCount,
                },
              })
            } else if (type === 'report_count') {
              ipcRenderer.send('report_content_read', reportCount)
            } else if (type === 'meeting_count') {
              //刷新工作台头部会议红点数量
              ipcRenderer.send('refresh_meet_connect', ['meeting_count'])
            }
          } else {
            if (Object.prototype.toString.call(args) == '[object Array]') {
              if (args.length == 0) {
                this.setState({
                  unreadMsgCounts: {
                    ...res.obj,
                    workdeskCount,
                  },
                })
              }
            }
          }
          ipcRenderer.send('report_content_read', reportCount)
        }
      })
  }
  //目前暂时做了沟通-审批-公告-系统通知 （且只校验了这几类数据信息）
  checkType = (type: string) => {
    const typeArr = ['approve_count', 'talk_count', 'report_count', 'notice_count', 'system_notice_count']
    if (typeArr.includes(type)) {
      return true
    }
    return false
  }

  render() {
    const selectTeam: any = this.state.teamList.find(item => {
      return item.isLast === 1
    })
    // const { userInfo, selectTeamName } = $store.getState()
    //登录应用系统
    loginApp(selectTeam)
    $store.dispatch({
      //存储企业ID
      type: 'SET_SEL_TEAMID',
      data: { selectTeamId: selectTeam ? selectTeam.id : -1 },
    })
    if (selectTeam) {
      $('.workdesk-header').attr('data-orgid', selectTeam.id)
    } else {
      $('.workdesk-header').attr('data-orgid', '')
    }
    $store.dispatch({
      //存储企业名称
      type: 'SET_SEL_TEAMNAME',
      data: { selectTeamName: selectTeam ? selectTeam.name : '所有企业' },
    })
    // const userSetingMenu = (
    //   <Menu style={{ textAlign: 'center' }} onClick={this.asyncDispatch}>
    //     {userCenter.map(item => {
    //       return <Menu.Item key={item.key}>{item.value}</Menu.Item>
    //     })}
    //   </Menu>
    // )
    // 获取彩虹信息
    const { currentwinKey } = $store.getState()
    let rainbowText = ''
    let rainbowName = ''
    if (currentwinKey && currentwinKey !== 'WorkDesk') {
      const { rainbowInformation } = $store.getState()
      rainbowText = rainbowInformation.text
      rainbowName = rainbowInformation.name
    } else {
      rainbowText = this.state.rainbow.text
      rainbowName = this.state.rainbow.name
    }

    const teamMenu = (type?: number) => {
      return (
        <Menu className="optListBox">
          <Menu className="listTeam" onClick={this.changeTeam}>
            {this.state.teamList.map((item: TeamListItem) => {
              return (
                <Menu.Item
                  key={item.id || -1}
                  icon={
                    <Avatar
                      size={24}
                      src={item.logo}
                      style={{
                        color: '#f5f6ff',
                        fontSize: 10,
                        background: '#f5f6ff',
                      }}
                    >
                      {item.id ? item.shortName && item.shortName.substr(0, 4) : '所有企业'}
                    </Avatar>
                  }
                >
                  <span className="teamName">{item.id ? item.shortName : '所有企业'}</span>
                  <span
                    className={`${item.waitHandleCount > 0 && 'unReadMsg'} ${item.waitHandleCount > 99 &&
                      'bigLong'}`}
                  >
                    {item.waitHandleCount > 0 && (item.waitHandleCount > 99 ? '99+' : item.waitHandleCount)}
                  </span>
                </Menu.Item>
              )
            })}
          </Menu>
        </Menu>
      )
    }
    const menu = (
      <div className="card">
        <div className="background_contain">
          {/* 改造头像显示区域 */}
          {this.state.userInfo.profile ? (
            <div
              className="background"
              style={{
                background: `url('${this.state.userInfo.profile}')  no-repeat center /cover `,
              }}
            ></div>
          ) : (
            <div className="nobackground"></div>
          )}
        </div>

        <div className="userInfo_contant">
          <div className="userName">{rainbowName}</div>
          <div className="companyname">
            {rainbowText?.length > 18 ? rainbowText?.substr(0, 18) + '...' : rainbowText}
          </div>
          <div
            className={$c('sex', { man: this.state.userInfo.sex == 0, woman: this.state.userInfo.sex !== 0 })}
          ></div>
        </div>

        {/* 卡片contant */}
        <div className="card_contant">
          <Menu style={{ textAlign: 'center' }} onClick={this.asyncDispatch} className="listOpt">
            {userCenter.map((item: any, i: number) => {
              return (
                <Menu.Item
                  key={item.key}
                  className={`listOpt_${i} appNav appNav_${item.key} ${
                    item.key == 'userCenter' && this.state.isUpgrade ? 'upgrade' : ''
                  }`}
                >
                  {item.value}
                </Menu.Item>
              )
            })}
          </Menu>
        </div>
      </div>
    )
    return (
      <div className="app-sidebar win_drag" id="app-sidebar" data-num="0">
        {/* 头像区域 */}
        <div
          className="flex column center side_top_menu"
          style={{ margin: '20px 0' }}
          // onClick={() => console.log(this.state.userInfo.profile, 'we')}
          // onClick={e => {
          //   e.stopPropagation()
          //   $('.sider_bgc').animate({ left: '0' }, 800)
          // }}
        >
          <div className="sider_bgc">
            <div className="sider_text">
              <div className="sider_bgc_title">{rainbowName}</div>
              <div className="side_rainbow">{rainbowText}</div>
            </div>
            <div
              className="closeSider"
              onClick={e => {
                e.stopPropagation()
                $('.sider_bgc').animate({ left: '-600px' }, 800)
              }}
            ></div>
          </div>
          <Dropdown overlay={menu} trigger={['click']} placement="bottomRight" className="card_drop">
            <div className={`${this.state.isUpgrade ? 'upgrade' : ''}`}>
              <Avatar
                size={38}
                src={this.state.userInfo.profile}
                style={{ backgroundColor: this.state.userInfo.profile ? '' : '#3949ab' }}
              >
                {this.state.userInfo?.username?.substr(-2, 2)}
              </Avatar>
            </div>
          </Dropdown>
        </div>

        {/* 卡片区域 */}

        {/* 上部分主菜单 */}
        <div className="flex column center side-menu">{this.state.mainMenu.map(this.renderMenuItem)}</div>
        {/* 下部分菜单 */}
        <div className="flex column center side-bottom-menu">
          {this.state.menuBottom.map(this.renderMenuBottom)}
          {/* 选择企业 */}
          <Dropdown
            overlay={teamMenu()}
            trigger={['click']}
            placement={'topCenter'}
            overlayClassName="dropDownList"
          >
            <div className={`teamMenuDrop`}>
              <Avatar
                size={40}
                src={selectTeam && selectTeam.logo}
                className="teamLogo"
                style={{
                  color: '#4285F4',
                  backgroundColor: '#E8F1FE',
                  fontSize: 12,
                  borderRadius: '14px',
                }}
              >
                {selectTeam && selectTeam.shortName ? selectTeam?.shortName.substr(0, 4) : '所有企业'}
              </Avatar>
            </div>
          </Dropdown>
          <span className="companyIcon" />
        </div>
        {/* 个人中心弹框 */}
        {this.state.modalVisible && (
          <UsercenterModal
            closeModal={() => {
              ipcRenderer.send('close_we_chat_scan')
              this.setState({
                modalVisible: false,
              })
            }}
            visible={this.state.modalVisible}
          />
        )}
        {/* 设置中心弹框 */}
        <AppSet ref={ref => (this.appSetModalRef = ref)} />
      </div>
    )
  }

  //模拟异步请求
  asyncDispatch = async (record: any) => {
    const currentWindow = remote.getCurrentWindow()
    if (record.key === 'loginOut') {
      customQuery()
      //退出登录重置store
      await $store.dispatch({ type: 'RESET_STORE', data: undefined })
      //关闭未读信息列表
      $store.dispatch({
        type: 'SAVE_UNREAD_INFO',
        data: [],
      })
      //关闭消息闪烁
      ipcRenderer.send('change_tray_icon')
      // 关闭任务栏高亮
      ipcRenderer.send('force_cancel_flash')
      // 清空消息推送
      $store.dispatch({ type: 'SET_SYSTEM_MSG', data: { systemMsgs: [] } })
      // 清空语言版本缓存，恢复默认
      langTypeHandle({ type: 1, isDef: true })
      ipcRenderer.send('close_all_window')
      await currentWindow.webContents.send('dom-ready', { showSidebar: false, showTitlebar: false })
      //退出xmpp连接
      await this.props.history.push('/login')
      if ($xmpp.LoginXmpp?.instance?.quitXmpp) {
        $xmpp.LoginXmpp?.instance?.quitXmpp()
      }
      $websocket.LoginWebSocket.getInstance().disConnect()
      // 清空 localStorage缓存
      localStorage.clear()
      $store.dispatch({
        type: 'LOGINOUT_INFO',
        data: { isLoginOut: true },
      })
      // $store.dispatch({
      //   type: 'ACTION_LOGIN',
      //   data: {
      //     isLogin: false,
      //   },
      // })
    } else if (record.key === 'authManage') {
      this.props.history.push('/AuthMannage')
    } else if (record.key === 'userCenter') {
      // this.setModalVisible(true)
      this.setState({
        modalVisible: true,
      })
    } else if (record.key === 'companyManage') {
      const { shell } = require('electron')
      const env = process.env.BUILD_ENV
      const org_url =
        env === 'dev'
          ? devConfig.env['dev']['variables']['ORG_URL']
          : devConfig.env['prod']['variables']['ORG_URL']
      shell.openExternal(org_url)
    } else if (record.key === 'helpCenter') {
      const { shell } = require('electron')
      shell.openExternal('https://www.yuque.com/zkz/holder')
    } else if (record.key === 'setUp') {
      //设置
      this.appSetModalRef && this.appSetModalRef.setState({ visible: true })
    }
  }

  // 未读消息显示红点
  renderMsgCount = (menuKey: string) => {
    const { noticeCount, synergyCount, approveCount, workPlanCount } = this.state.unreadMsgCounts
    switch (menuKey) {
      // case 'WorkDesk': // 工作台-数字
      //   return (
      //     workdeskCount > 0 && (
      //       <em className={$c('red-spot red-number workDesk-em', { 'red-spot-larg': workdeskCount > 99 })}>
      //         {workdeskCount > 99 ? '99+' : workdeskCount}
      //       </em>
      //     )
      //   )
      case 'WorkPlan': // 工作规划
        return workPlanCount > 0 && <em className="red-spot red-point my-plan-count"></em>
      case 'ApprovalManage': // 审批管理
        return approveCount > 0 && <em className="red-spot red-point my-approval-manage"></em>
      case 'Coordination': // 协同
        return synergyCount > 0 && <em className="red-spot red-point"></em>
      case 'Announce': // 公告
        return noticeCount > 0 && <em className="red-spot red-point"></em>
      default:
        return ''
    }
  }

  // clickChatBtn = (key: string) => {
  //   if (key !== 'WorkDesk') {
  //     const $style = $('#w0_window').attr('style')
  //     if ($style == 'visibility: visible;') {
  //       jQuery('.red-spot-icon').click()
  //     }
  //   }
  // }
  //渲染侧边导航
  renderMenuItem = (sideMenuItem: SideMenuItem) => {
    const { key, title, href } = sideMenuItem
    const { activeMenuKey } = this.state
    const isActive = activeMenuKey === key
    return (
      <Tooltip key={key} overlayClassName="side-menu-item-tooltip" placement="right" title={title}>
        <span style={{ position: 'relative' }}>
          {key !== 'ApprovalManage' && (
            <a
              onClick={e => {
                e.stopPropagation()
                // this.clickChatBtn(key)
                $store.dispatch({ type: 'WORKDESK_FULL_SCREEN', data: { visible: false, position: 0 } })
                $store.dispatch({ type: 'SET_CURRENTWIN', data: { key } })

                if (key !== 'WorkDesk' && $('.chat-window-tip .red-spot-icon').hasClass('hide')) {
                  $('.chat-window-tip .red-spot-icon').removeClass('hide')
                }
                if ($('.chat-window-tip').hasClass('addWidth')) {
                  $('.chat-window-tip').removeClass('addWidth')
                }
                // this.setState({ activeMenuKey: key, routeProps: sideMenuItem })
                // 更改routerKey进而点击当前也能刷新右侧
                // this.props.changeRouteKey()
              }}
              className={`side-menu-item flex around center-v column ${isActive ? 'active' : ''}`}
              href={href}
            >
              <span
                className={$c('navSpan  active_bc', {
                  WorkDesk: key === 'WorkDesk' || key === 'MyWorkDesk',
                  WorkPlan: key === 'WorkPlan' || key === 'MyWorkPlan',
                  OKR: key === 'OKR',
                  TaskManage: key === 'TaskManage',
                  Announce: key === 'Announce',
                  MyApp: key === 'MyApp',
                  DataControl: key === 'DataControl',
                })}
              >
                {key === 'TaskManage' && this.state.showTaskTip && (
                  <div className="app-tips">
                    <div className="tit">已完成的任务在这里查看哦</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: '22px' }}>
                      <Button
                        onClick={e => {
                          e.stopPropagation()
                          e.preventDefault()
                          // this.clickChatBtn(key)
                          this.setState({
                            showTaskTip: false,
                          })
                        }}
                      >
                        知道了
                      </Button>
                    </div>
                  </div>
                )}
              </span>
              {/* <span>{this.renderMsgCount(key)}</span> */}
              <span
                className={` flex around center-v column active_icon ${isActive ? '' : 'active_icon_hid'}`}
              ></span>
            </a>
          )}
          {key === 'ApprovalManage' && (
            <Button
              type="text"
              icon={
                <img
                  src={$tools.asAssetsPath(`/images/myWorkDesk/approval${this.state.ishover ? '_h' : ''}.svg`)}
                />
              }
              style={{ width: '36px' }}
              loading={this.state.approvalLoading}
              className={`side-menu-item flex around center-v column ApprovalManage ${
                isActive ? 'active' : ''
              } ${this.state.ishover ? 'active_bc' : ''}`}
              onMouseOver={() =>
                this.setState({
                  ishover: true,
                })
              }
              onMouseOut={() =>
                this.setState({
                  ishover: false,
                })
              }
              onClick={() => {
                this.clickBottomeMenu(key)
              }}
            ></Button>
          )}
          <span
            style={{
              position: 'relative',
              right: '-5px',
            }}
          >
            {this.renderMsgCount(key)}
          </span>
        </span>
      </Tooltip>
    )
  }
  //渲染侧边底部导航
  renderMenuBottom = (sideMenuItem: SideMenuItem) => {
    const { key, title, href } = sideMenuItem
    const { activeMenuKey } = this.state
    const { talkCount, systemNoticeCount } = this.state.unreadMsgCounts
    const isActive = activeMenuKey === key
    return (
      <Tooltip key={key} overlayClassName="side-menu-item-tooltip" placement="right" title={title}>
        {key === 'AddressBook' && (
          <a
            onClick={e => {
              e.stopPropagation()
              $store.dispatch({ type: 'WORKDESK_FULL_SCREEN', data: { visible: false, position: 0 } })
              if ($('.chat-window-tip .red-spot-icon').hasClass('hide')) {
                $('.chat-window-tip .red-spot-icon').removeClass('hide')
              }
              if ($('.chat-window-tip').hasClass('addWidth')) {
                $('.chat-window-tip').removeClass('addWidth')
              }
              // this.setState({ activeMenuKey: key, routeProps: sideMenuItem })
              // // 更改routerKey进而点击当前也能刷新右侧
              // this.props.changeRouteKey()
            }}
            className={`side-menu-item flex around center-v column ${isActive ? 'active' : ''}`}
            href={href}
          >
            <span
              className={$c('navSpan', {
                AddressBook: key === 'AddressBook',
              })}
            ></span>
            <span
              className={` flex around center-v column active_icon ${isActive ? '' : 'active_icon_hid'}`}
            ></span>
          </a>
        )}

        {/* {key === 'EnterpriseClouddisk' && (
          <a
            onClick={e => {
              e.stopPropagation()
              $store.dispatch({ type: 'WORKDESK_FULL_SCREEN', data: { visible: false, position: 0 } })
              this.setState({ activeMenuKey: key, routeProps: sideMenuItem })
              // 更改routerKey进而点击当前也能刷新右侧
              this.props.changeRouteKey()
            }}
            className={`side-menu-item flex around center-v column ${isActive ? 'active' : ''}`}
            href={href}
          >
            <span
              className={$c('navSpan', {
                EnterpriseClouddisk: key === 'EnterpriseClouddisk',
              })}
            ></span>
          </a>
        )} */}

        {key !== 'AddressBook' && (
          <Button
            type="text"
            loading={key === 'ChatWin' && this.state.chatLoading}
            className={`${key} ${isActive ? 'active' : ''}`}
            onClick={() => {
              this.clickBottomeMenu(key)
            }}
          >
            {key === 'ChatWin' && talkCount > 0 && (
              <em className={$c('red-spot red-number chatWin-em', { 'red-spot-larg': talkCount > 99 })}>
                {talkCount > 99 ? '99+' : talkCount}
              </em>
            )}
            {/* getSysetemIsRed */}
            {key === 'SystemMsg' && systemNoticeCount > 0 && (
              <em className={$c('red-spot red-point SystemMsg-em')}></em>
            )}
          </Button>
        )}
      </Tooltip>
    )
  }
  //点击按钮打开窗口
  clickBottomeMenu = (key: string) => {
    // this.clickChatBtn(key)
    if (key === 'ChatWin') {
      this.setState({
        chatLoading: true,
      })
      $tools.createWindow('ChatWin', { createConfig: { showSidebar: false } }).then(() => {
        this.setState({
          chatLoading: false,
        })
      })
    } else if (key === 'ApprovalManage') {
      this.setState({
        approvalLoading: true,
      })
      $store.dispatch({
        type: 'SAVE_TYPE_APPROVAL_DATA', //清除初次界面具体数据展示
        data: {},
      })
      $tools.createWindow('Approval', { createConfig: { showSidebar: false } }).then(() => {
        this.setState({
          approvalLoading: false,
        })
      })
    } else if (key === 'EnterpriseClouddisk') {
      //云盘
      $tools.createWindow('EnterpriseClouddisk')
    } else if (key === 'SystemMsg') {
      this.setState({
        chatLoading: true,
      })
      //系统通知
      $tools.createWindow('systemnoticeinfo').then(() => {
        this.setState({
          chatLoading: false,
        })
      })
    } else if (key === 'AddressBook') {
      this.setState({
        activeMenuKey: 'AddressBook',
      })
    }
  }

  // 切换选择公司
  changeTeam = async (teamItem: any) => {
    const teamArr = [...this.state.teamList]
    teamArr.map(item => {
      if (item.id == teamItem.key || (teamItem.key == 'null' && !item.id)) {
        item.isLast = 1
      } else {
        item.isLast = 0
      }
    })
    const selectTeam: any = teamArr.find(item => {
      return item.id ? item.id == teamItem.key : item
    })
    // 存取被选中企业
    $store.dispatch({
      type: 'SET_SEL_TEAMINFO',
      data: { selectTeam: selectTeam ? selectTeam : { name: '所有企业' } },
    })
    await queryDeskTabs({ selectTeamId: selectTeam.id, isFollow: false })
    const newState: any = { teamList: teamArr }
    if (selectTeam) {
      const { unreadMsgCounts } = this.state
      const workdeskCount = selectTeam.waitHandleCount
      newState.unreadMsgCounts = { ...unreadMsgCounts, workdeskCount }
    }
    this.setState(newState)
    // 保存选择的企业名称
    $store.dispatch({
      type: 'SET_SEL_TEAMNAME',
      data: { selectTeamName: selectTeam ? selectTeam.name : '所有企业' },
    })
    // 保存选择的企业-联动工作台
    $('.workdesk-header').attr('data-orgId', parseInt(teamItem.key))
    $store.dispatch({ type: 'SET_SEL_TEAMID', data: { selectTeamId: parseInt(teamItem.key) } })
    // 保存当前选中的企业登录时展示
    const { loginToken, nowAccount } = $store.getState()
    $api.request(
      'team/record/saveTeam',
      { teamId: teamItem.key != 'null' ? teamItem.key : '', account: nowAccount },
      { headers: { loginToken }, formData: true }
    )
    // 切换企业重置目标看板的分页
    // $store.dispatch({
    //   type: 'TARGET_KANBAN_QUERY',
    //   data: {
    //     ascriptionId: selectTeam.id,
    //     ascriptionType: '0',
    //     pageNo: 0,
    //     pageSize: 10,
    //   },
    // })
    loginApp(selectTeam)
    // 查询版本信息，检测是否需要升级
    findVersionUpgrade().then((res: any) => {
      const isUpgrade: boolean = res.nowVersionNum < res.remoteVersionNum
      this.setState({ isUpgrade })
    })
  }
} // class AppSidebar end

export default withRouter(AppSidebar)

const loginAppInfo = {
  companyId: -1,
}
const loginApp = (selectTeam: any) => {
  //当前登录账号
  const { nowAccount } = $store.getState()
  //判断是否选择企业，如果未选中则直接返回
  if (!selectTeam) {
    loginAppInfo.companyId = -1
    return
  }
  //判断odooToken是否存在,进行应用登录
  // //进行odoo登录，然后返回odooToken
  if (loginAppInfo.companyId == selectTeam.id) {
    return
  }

  loginAppInfo.companyId = selectTeam.id

  //保存选择的企业-应用地址
  $store.dispatch({ type: 'SET_BUSINESS_ADDRESS', data: { businessAddress: selectTeam.businessDataAddress } })
  //判断企业未绑定应用则不需要登录
  if (!selectTeam.businessDataAddress) {
    return
  }

  Axios.get(`${selectTeam.businessDataAddress}/goalgo_sync/odoo/token`, {
    params: {
      account: nowAccount,
      company_id: selectTeam.id,
      odoo_token: selectTeam.odooToken,
    },
  }).then(res => {
    if (res.data.returnCode == 0) {
      const odooToken = res.data.data.data
      $store.dispatch({ type: 'SET_ODOO_TOKEN', data: { odooToken: odooToken } })
    }
  })
}

// 判断当前类型的消息是否未系统通知消息
export const isSystemMsg = (type: number) => {
  const typeList = [20001, 20002, 20003, 20004, 20005, 20006, 20007, 20008]
  return typeList.includes(type)
}

/**
 * 查询版本更新信息
 */
export const findVersionUpgrade = () => {
  return new Promise((resolve: any) => {
    queryVersionUpgrade().then((res: any) => {
      const currentVersion = app.getVersion()
      // const currentVersion = devConfig.version
      const data = res.data || { name: currentVersion }
      // 线上版本,由于mac App Store审核需要时间，故mac系统使用macName字段单独比对版本，能够单独控制
      const versionName = process.platform == 'darwin' && res.macName ? data.macName : data.name
      const remoteVersionArr: any = versionName?.split('.')
      // 当前版本
      const currentVersionArr: any = currentVersion.split('.')
      // 如果服务器版本号长度比本地长，则补充为一致长度
      if (currentVersionArr.length < remoteVersionArr.length) {
        for (let c = 0; c < remoteVersionArr.length - currentVersionArr.length; c++) {
          currentVersionArr.push('0')
        }
      }
      const newData = {
        ...data,
        nowVersionNum: JSON.parse(currentVersionArr.join('')),
        remoteVersionNum: JSON.parse(remoteVersionArr.join('')),
      }
      // 保存版本信息全局数据
      $store.dispatch({
        type: 'SET_VERSION_INFO',
        data: newData,
      })
      resolve(newData)
    })
  })
}

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
// ???????????????????????????????????????
export const NEWAUTH812 = false
// ??????????????????????????????

// ????????????????????????
export let loginExit: any = null
// ??????????????????
export let refreshDeskAvater: any = null
export let refreshRainBow: any = null
const userCenter = [
  {
    key: 'companyManage',
    value: '??????????????????',
  },
  // {
  //   key: 'authManage',
  //   value: '????????????',
  // },
  {
    key: 'userCenter',
    value: '??????',
  },
  {
    key: 'helpCenter',
    value: '????????????',
  },
  {
    key: 'loginOut',
    value: '????????????',
  },
]
let isUnmounted = false
@withStore(['userInfo'])
class AppSidebar extends React.Component<any, State> {
  cardshow: any
  // ?????????
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
      //????????????
      text: '',
      name: '',
    },
    mainMenu: [],
    menuBottom: [],
    isUpgrade: false,
    isMaximized: false, //??????????????????????????????
  }
  // ????????????????????????
  appSetModalRef: any = {}

  //??????????????????
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
    // ????????????
    data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
      if (a.isTop === b.isTop) {
        return moment(b.time).valueOf() - moment(a.time).valueOf()
      }
      return b.isTop - a.isTop
    })
    // ??????????????????
    await $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
    // await getLocalRoomData(false, 'time')
    // ????????????????????????
    if (setSelect) {
      // ????????????????????????
      saveDraftMsg(Object.assign({}, selectItem), resData, $store.dispatch)
      $store.dispatch({ type: 'SET_SELECT_ITEM', data: resData })
    }
    // ?????????????????????
    data.map((item: globalInterface.ChatListProps, index: number) => {
      if (item.id === resData.id) {
        const offsetTop = index * 62
        $('#chat_list_main').scrollTop(offsetTop - 100)
      }
    })
    // ?????????????????????
    // updateChatRoomDetail({ userId: nowUserId, data })
  }

  updateChatList = (dataList: any[], briefMsgList: any) => {
    // ??????????????????
    $store.dispatch({ type: 'SET_CHAT_MESSAGE', data: { messageList: briefMsgList || [] } })
    // ????????????????????????????????????
    $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: dataList } })
    // getLocalRoomData(false, 'isFirst')
    // updateChatRoomDetail({ userId: nowUserId, data: dataList })
  }

  checkUpVersion = (e: any) => {
    if (!isUnmounted) {
      this.setState({ activeMenuKey: e.detail.name, routeProps: e.detail })
      // ????????????????????????
      if (e.detail.name != 'Login') {
        findVersionUpgrade().then((res: any) => {
          const isUpgrade: boolean = res.nowVersionNum < res.remoteVersionNum
          this.setState({ isUpgrade })
        })
      }
    }
  }
  // ??????????????????????????????
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
    // ??????
    setTimeout(() => {
      $('.sider_bgc').animate({ left: '0px' }, 800)
      // ??????
      setTimeout(() => {
        $('.sider_bgc').animate({ left: '-600px' }, 800)
      }, 4000)
    }, 2000)

    // ??????
    // setTimeout(() => {
    //   $('.sider_bgc').animate({ left: '-600px' }, 800)
    // }, 8000)

    refreshDeskAvater = this.refreshDeskAvaterFn
    refreshRainBow = this.refreshRainBow
    // ?????????????????????
    $('.ant-menu-item-selected').css('color', '#212224')
    // ????????????

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
          // ?????????????????????
          if (selectItem && newMsgRoomId !== selectItem.roomId) {
            chatListData?.map((item: globalInterface.ChatListProps) => {
              if (item.roomId === newMsgRoomId && !item.remindType) {
                //???????????????????????????????????????
                ipcRenderer.send('refresh_meet_connect', ['talk_count'])
              }
            })
          }
          // 20001, "??????????????????" 20002, "????????????" 20003, "????????????" 20004, "???????????????" 20005, "???????????????" 20006, "???????????????" 20007, "???????????????" 20008, "????????????"
          if (isSystemMsg(type)) {
            const { chatUserInfo } = $store.getState()
            const systemMsg = JSON.parse(content, msgContent)
            if (type === 20001 || type === 20002) {
              const { roomInfo } = systemMsg || {}
              const filterRoom = chatListData.filter((item: any) => item.roomId === roomInfo?.roomId)
              const parentThis = LoginXmpp.getInstance()
              // ????????????????????????????????????chatListData???????????????????????????????????????????????????chatListData???
              if (!filterRoom.length) {
                // ????????????
                const data = [roomInfo, ...chatListData]
                //?????????????????????
                insertChatRoom(roomInfo)
                // ????????????
                data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
                  if (a.isTop === b.isTop) {
                    return moment(b.timeStamp).valueOf() - moment(a.timeStamp).valueOf()
                  }
                  return b.isTop - a.isTop
                })
                // ????????????
                const briefMsg = {
                  roomType: roomInfo.type,
                  roomId: roomInfo.roomId,
                }
                // ??????????????????
                const newBriefList = [briefMsg, ...messageList]

                queryLocalbrief(roomInfo.roomId).then((localeData: any) => {
                  //?????????????????????????????????????????????????????????????????????????????????
                  if (!!localeData) {
                    updateBriefMsg(roomInfo.roomId, briefMsg)
                  } else {
                    insertBriefMsg(roomInfo.roomId, {
                      roomType: roomInfo.type,
                    })
                  }
                })

                // ??????????????????
                $store.dispatch({ type: 'SET_CHAT_MESSAGE', data: { messageList: newBriefList || [] } })
                // ????????????????????????????????????
                $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
                // getLocalRoomData(false, 'time')
              }

              // ???????????????,???????????????pres???
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
              // ?????????????????????
              // updateChatRoomDetail({ userId: nowUserId, data })
              // ????????????
            } else if (type === 20004 || type === 20005) {
              const { roomId, roomInfo } = systemMsg || {}
              const targetId = roomId ? roomId : roomInfo?.roomId
              if (targetId) {
                if (selectItem.roomId === targetId) {
                  $store.dispatch({ type: 'SET_SELECT_ITEM', data: {} })
                }
                const filterRoom = chatListData.filter((item: any) => item.roomId !== targetId)
                //?????????????????????????????????
                deleteChatRoom(targetId)
                // ????????????????????????????????????
                $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: filterRoom } })
              }
              // getLocalRoomData(false, '')
            } else if (type === 20006) {
              // ???????????????
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
              // ???????????????
              // ???????????????
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
            // type???0???????????????????????????
            if (type === 0) {
              const _json = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
              //???????????????
              if (_json.type === 20003) {
                const content = _json.content || '{}'
                const { operatorUser } = JSON.parse(content)
                const { userId } = operatorUser
                //??????????????????????????????????????????????????????????????????????????????????????????????????????????????????
                if (nowUserId === userId) {
                  //????????????????????????
                  const { openRoomIds, chatListData } = $store.getState()
                  const newOpenRoomids = openRoomIds.filter((roomId: any) => roomId !== newMsgRoomId)
                  $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newOpenRoomids })
                  //???????????????????????? windowClose
                  const data = JSON.parse(JSON.stringify(chatListData))
                  const newChatListData = data.filter((item: any) => item.roomId !== newMsgRoomId)
                  deleteChatRoom(newMsgRoomId)
                  $store.dispatch({
                    type: 'SET_CHAT_LIST',
                    data: { chatListData: newChatListData },
                  })
                  // getLocalRoomData(false, '')

                  if (selectItem.roomId === newMsgRoomId) {
                    //????????????
                    $store.dispatch({ type: 'SET_SELECT_ITEM', data: {} })
                  }
                }
              }
            } else {
              const nowListData = JSON.parse(JSON.stringify(chatListData))
              let roomType: number | null = null
              nowListData.map((item: globalInterface.ChatListProps) => {
                // ???????????????
                if (item.roomId === newMsgRoomId) {
                  roomType = item.type
                  // ????????????????????????
                  if (userId !== nowUserId && newMsgRoomId !== selectItem.roomId) {
                    if (isRecall === 1) {
                      // ???????????????
                      item.unreadCount = item.unreadCount > 0 ? item.unreadCount - 1 : 0
                    } else {
                      // ????????????
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
              // ?????????????????????
              nowListData.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
                if (a.isTop === b.isTop) {
                  return (b.isFirst || 0) - (a.isFirst || 0)
                }
                return b.isTop - a.isTop
              })
              // // ?????????????????????????????????
              const newBriefMsg = this.upDateChatBrief(msgContent, roomType)
              // ?????????????????????
              this.updateChatList(nowListData, newBriefMsg)
            }
          }
        }
      })
    }

    // ??????????????????????????????
    loginExit = this.asyncDispatch
    //???????????????????????????????????????????????????????????????
    $store.dispatch({
      type: 'LOGINOUT_INFO',
      data: { loginOutFn: this.asyncDispatch, isLoginOut: false },
    })
    $store.dispatch({
      type: 'LOGINOUTFN',
      data: this.asyncDispatch,
    })
    // window.location.replace('/')
    // ????????????????????????
    !NEWAUTH812 && this.navMenuSet()

    // ???????????????????????????router_update???????????????????????????????????????
    // findVersionUpgrade().then((res: any) => {
    //   const isUpgrade: boolean = res.nowVersionNum < res.remoteVersionNum
    //   this.setState({ isUpgrade })
    // })
  }

  componentWillUnmount() {
    isUnmounted = true
    // ???????????????
    window.removeEventListener('router_update', this.checkUpVersion)
  }

  // componentWillUpdate(object nextProps, object nextState)
  componentDidUpdate(prevProps: any, prevState: any) {
    if (NEWAUTH812 && prevState.teamList != this.state.teamList) {
      // ??????????????????
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
   * ??????????????????
   */
  navMenuSet = async (paramObj?: { typeId: number }) => {
    if (!NEWAUTH812) {
      // ????????????????????????
      queryFunsAuthApi().then((res: any) => {
        const dataList = res?.dataList || []
        let mainMenu: any = []
        let menuBottom: any = []
        if (res) {
          // ??????????????????????????????
          $store.dispatch({
            type: 'FUNSAUTHLIST',
            data: [...dataList],
          })
          // ?????????????????????????????????
          // ??????????????????
          AppSideMenus.mainMenu.forEach((mItem: any) => {
            const findItem = dataList.find(
              (item: any) =>
                item.name == mItem.code && (mItem.hasAuth !== undefined ? mItem.hasAuth : item.hasAuth)
            )
            if (findItem) {
              mainMenu.push(mItem)
            }
          })
          // ??????????????????
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

      // 8.12????????????
      const mainMenu: any = []
      const menuBottom: any = []

      // ??????????????????
      AppSideMenus.mainMenu.forEach((mItem: any) => {
        const findItem = mItem?.baseAuth || getAuthStatus(mItem?.authCode)

        if (findItem) {
          mainMenu.push(mItem)
        }
      })
      // ??????????????????
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
   * ??????????????????
   * @param args
   */
  getMessageCount = (args: any[], msg?: string) => {
    let type = ''
    // ??????????????????
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
            return item.name === '????????????'
          })
        }
        let workdeskCount = 0
        // ?????????????????????
        const teamUnreadCount = selectTeam && selectTeam.waitHandleCount
        if (teamUnreadCount > 0) {
          workdeskCount = teamUnreadCount
        }
        if (!isUnmounted) {
          const data = this.state.unreadMsgCounts
          const { approveCount, talkCount, noticeCount, systemNoticeCount, reportCount } = res.obj
          if (type && this.checkType(type)) {
            if (type === 'approve_count') {
              //????????????
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
              //???????????????????????????????????????
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
  //????????????????????????-??????-??????-???????????? ??????????????????????????????????????????
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
    //??????????????????
    loginApp(selectTeam)
    $store.dispatch({
      //????????????ID
      type: 'SET_SEL_TEAMID',
      data: { selectTeamId: selectTeam ? selectTeam.id : -1 },
    })
    if (selectTeam) {
      $('.workdesk-header').attr('data-orgid', selectTeam.id)
    } else {
      $('.workdesk-header').attr('data-orgid', '')
    }
    $store.dispatch({
      //??????????????????
      type: 'SET_SEL_TEAMNAME',
      data: { selectTeamName: selectTeam ? selectTeam.name : '????????????' },
    })
    // const userSetingMenu = (
    //   <Menu style={{ textAlign: 'center' }} onClick={this.asyncDispatch}>
    //     {userCenter.map(item => {
    //       return <Menu.Item key={item.key}>{item.value}</Menu.Item>
    //     })}
    //   </Menu>
    // )
    // ??????????????????
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
                      {item.id ? item.shortName && item.shortName.substr(0, 4) : '????????????'}
                    </Avatar>
                  }
                >
                  <span className="teamName">{item.id ? item.shortName : '????????????'}</span>
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
          {/* ???????????????????????? */}
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

        {/* ??????contant */}
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
        {/* ???????????? */}
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

        {/* ???????????? */}

        {/* ?????????????????? */}
        <div className="flex column center side-menu">{this.state.mainMenu.map(this.renderMenuItem)}</div>
        {/* ??????????????? */}
        <div className="flex column center side-bottom-menu">
          {this.state.menuBottom.map(this.renderMenuBottom)}
          {/* ???????????? */}
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
                {selectTeam && selectTeam.shortName ? selectTeam?.shortName.substr(0, 4) : '????????????'}
              </Avatar>
            </div>
          </Dropdown>
          <span className="companyIcon" />
        </div>
        {/* ?????????????????? */}
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
        {/* ?????????????????? */}
        <AppSet ref={ref => (this.appSetModalRef = ref)} />
      </div>
    )
  }

  //??????????????????
  asyncDispatch = async (record: any) => {
    const currentWindow = remote.getCurrentWindow()
    if (record.key === 'loginOut') {
      customQuery()
      //??????????????????store
      await $store.dispatch({ type: 'RESET_STORE', data: undefined })
      //????????????????????????
      $store.dispatch({
        type: 'SAVE_UNREAD_INFO',
        data: [],
      })
      //??????????????????
      ipcRenderer.send('change_tray_icon')
      // ?????????????????????
      ipcRenderer.send('force_cancel_flash')
      // ??????????????????
      $store.dispatch({ type: 'SET_SYSTEM_MSG', data: { systemMsgs: [] } })
      // ???????????????????????????????????????
      langTypeHandle({ type: 1, isDef: true })
      ipcRenderer.send('close_all_window')
      await currentWindow.webContents.send('dom-ready', { showSidebar: false, showTitlebar: false })
      //??????xmpp??????
      await this.props.history.push('/login')
      if ($xmpp.LoginXmpp?.instance?.quitXmpp) {
        $xmpp.LoginXmpp?.instance?.quitXmpp()
      }
      $websocket.LoginWebSocket.getInstance().disConnect()
      // ?????? localStorage??????
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
      //??????
      this.appSetModalRef && this.appSetModalRef.setState({ visible: true })
    }
  }

  // ????????????????????????
  renderMsgCount = (menuKey: string) => {
    const { noticeCount, synergyCount, approveCount, workPlanCount } = this.state.unreadMsgCounts
    switch (menuKey) {
      // case 'WorkDesk': // ?????????-??????
      //   return (
      //     workdeskCount > 0 && (
      //       <em className={$c('red-spot red-number workDesk-em', { 'red-spot-larg': workdeskCount > 99 })}>
      //         {workdeskCount > 99 ? '99+' : workdeskCount}
      //       </em>
      //     )
      //   )
      case 'WorkPlan': // ????????????
        return workPlanCount > 0 && <em className="red-spot red-point my-plan-count"></em>
      case 'ApprovalManage': // ????????????
        return approveCount > 0 && <em className="red-spot red-point my-approval-manage"></em>
      case 'Coordination': // ??????
        return synergyCount > 0 && <em className="red-spot red-point"></em>
      case 'Announce': // ??????
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
  //??????????????????
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
                // ??????routerKey????????????????????????????????????
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
                    <div className="tit">????????????????????????????????????</div>
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
                        ?????????
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
  //????????????????????????
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
              // // ??????routerKey????????????????????????????????????
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
              // ??????routerKey????????????????????????????????????
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
  //????????????????????????
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
        type: 'SAVE_TYPE_APPROVAL_DATA', //????????????????????????????????????
        data: {},
      })
      $tools.createWindow('Approval', { createConfig: { showSidebar: false } }).then(() => {
        this.setState({
          approvalLoading: false,
        })
      })
    } else if (key === 'EnterpriseClouddisk') {
      //??????
      $tools.createWindow('EnterpriseClouddisk')
    } else if (key === 'SystemMsg') {
      this.setState({
        chatLoading: true,
      })
      //????????????
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

  // ??????????????????
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
    // ?????????????????????
    $store.dispatch({
      type: 'SET_SEL_TEAMINFO',
      data: { selectTeam: selectTeam ? selectTeam : { name: '????????????' } },
    })
    await queryDeskTabs({ selectTeamId: selectTeam.id, isFollow: false })
    const newState: any = { teamList: teamArr }
    if (selectTeam) {
      const { unreadMsgCounts } = this.state
      const workdeskCount = selectTeam.waitHandleCount
      newState.unreadMsgCounts = { ...unreadMsgCounts, workdeskCount }
    }
    this.setState(newState)
    // ???????????????????????????
    $store.dispatch({
      type: 'SET_SEL_TEAMNAME',
      data: { selectTeamName: selectTeam ? selectTeam.name : '????????????' },
    })
    // ?????????????????????-???????????????
    $('.workdesk-header').attr('data-orgId', parseInt(teamItem.key))
    $store.dispatch({ type: 'SET_SEL_TEAMID', data: { selectTeamId: parseInt(teamItem.key) } })
    // ??????????????????????????????????????????
    const { loginToken, nowAccount } = $store.getState()
    $api.request(
      'team/record/saveTeam',
      { teamId: teamItem.key != 'null' ? teamItem.key : '', account: nowAccount },
      { headers: { loginToken }, formData: true }
    )
    // ???????????????????????????????????????
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
    // ?????????????????????????????????????????????
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
  //??????????????????
  const { nowAccount } = $store.getState()
  //?????????????????????????????????????????????????????????
  if (!selectTeam) {
    loginAppInfo.companyId = -1
    return
  }
  //??????odooToken????????????,??????????????????
  // //??????odoo?????????????????????odooToken
  if (loginAppInfo.companyId == selectTeam.id) {
    return
  }

  loginAppInfo.companyId = selectTeam.id

  //?????????????????????-????????????
  $store.dispatch({ type: 'SET_BUSINESS_ADDRESS', data: { businessAddress: selectTeam.businessDataAddress } })
  //?????????????????????????????????????????????
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

// ??????????????????????????????????????????????????????
export const isSystemMsg = (type: number) => {
  const typeList = [20001, 20002, 20003, 20004, 20005, 20006, 20007, 20008]
  return typeList.includes(type)
}

/**
 * ????????????????????????
 */
export const findVersionUpgrade = () => {
  return new Promise((resolve: any) => {
    queryVersionUpgrade().then((res: any) => {
      const currentVersion = app.getVersion()
      // const currentVersion = devConfig.version
      const data = res.data || { name: currentVersion }
      // ????????????,??????mac App Store????????????????????????mac????????????macName?????????????????????????????????????????????
      const versionName = process.platform == 'darwin' && res.macName ? data.macName : data.name
      const remoteVersionArr: any = versionName?.split('.')
      // ????????????
      const currentVersionArr: any = currentVersion.split('.')
      // ?????????????????????????????????????????????????????????????????????
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
      // ??????????????????????????????
      $store.dispatch({
        type: 'SET_VERSION_INFO',
        data: newData,
      })
      resolve(newData)
    })
  })
}

export const initialState = {
  preSelectItem: {},
  chatDrafMsg: null,
  selectItem: {},
  messageHistory: [],
  hasMore: false,
  keepScroll: false, //记录滚动条的位置
  onlineInfo: {
    online: 0,
    total: 0,
    onlineUsers: [],
  },
  roomManager: {
    id: 0,
    username: '',
    account: '',
    headPhoto: '',
    profile: '',
  },
  chatListData: [],
  listChange: false,
  chatNoticeList: [],
  chatDiscussType: {},
  collectList: [],
  systemMsgs: [],
  chatUserLists: [],
  ignorMsg: [],
  recallInfoMsg: {
    noticeTypeId: 0,
    noticeType: '',
  },
  chatUserInfo: { nickName: '', userType: 0 },
  replyModalData: { visible: false, timestamp: 0, rootMsgUuid: '', roomId: null }, //回复想消息详情
  currentReplyData: [], //回复消息父级
  openRoomIds: [],
  chatStateTmp: {
    pageNo: 0,
    totalPages: 0,
  },
  newDataList: [],
}

// 选中的聊天室、聊天室历史消息、历史消息是否显示更多、滚动条位置
export function CHAT_ROOM_INFO(state: StoreStates, data: any) {
  const temp: any = []
  const resultData = data.data.messageHistory
  resultData.forEach(function(contentA: any) {
    const message = contentA.messageJson
    if (message && typeof message == 'string') {
      contentA.message = message.replace(/(?<!\\)\u003c/g, '&lt;').replace(/(?<!\\)\u003e/g, '&gt;')
    }
    const check = temp.every(function(contentB: any) {
      return contentA.serverTime !== contentB.serverTime
    })
    // const timeA = moment(contentA.time).format('YYYY-MM-DD')
    // const isTimeLine = temp.every(function(b: any) {
    //   const contentB = JSON.parse($tools.htmlDecodeByRegExpContentHtml(b.content))
    //   const timeB = moment(contentB.time).format('YYYY-MM-DD')
    //   return timeA != timeB
    // })
    // const timeAFormat = moment(`${timeA} 00:00:00`).valueOf()
    // if (isTimeLine && !(contentA.type === 2 && contentA.subType === 0)) {
    //   temp.push({ ...a, ...contentA, entryTime: a.time, time: timeAFormat, day: timeA })
    // }
    check && temp.push(contentA)
    //去重
    // const timeA = moment(a.time).format('YYYY-MM-DD')
    // const isTimeLine = temp.every(function(b: any) {
    //   const timeB = moment(b.time).format('YYYY-MM-DD')
    //   return timeA != timeB
    // })
    // const timeAFormat = moment(`${timeA} 00:00:00`).valueOf()
    // if (isTimeLine) {
    //   temp.push({ ...a, ...a, entryTime: a.time, time: timeAFormat, day: timeA })
    // }
    // const check = temp.every(function(b: any) {
    //   return a.time !== b.time
    // })
    // check && temp.push(a)
    // }
  })
  return { ...state, messageHistory: temp }
}

// export function (state: StoreStates, data: any) {
//   return { ...state, chatMessages: data.data }
// }

// 聊天消息是否显示查看更多按钮
export function SET_HASMORE_HISTORYMESSAGE(state: StoreStates, data: any) {
  return { ...state, hasMore: data.data }
}

// 当前选中的聊天室
export function SET_SELECT_ITEM(state: StoreStates, data: any) {
  return { ...state, preSelectItem: state.selectItem, selectItem: data.data }
}

// 聊天室滚动条状态
export function SET_KEEP_SCROLL(state: StoreStates, data: any) {
  return { ...state, keepScroll: data.data }
}

// 当前聊天室的成员：所有成员、当前成员、聊天室管理员
export function SET_CHAT_USERLISTS(state: StoreStates, data: any) {
  const resultData = data.data
  return { ...state, ...resultData }
}

//聊天室负责人
export function SET_CHAT_MANAGER(state: StoreStates, data: any) {
  return { ...state, roomManager: data.data }
}

//聊天网络提示
export function SET_NETWORK_TIP(state: StoreStates, data: any) {
  return { ...state, netWorkHint: data.data }
}

//系统消息推送
export function SET_SYSTEM_MSG(state: StoreStates, data: any) {
  return { ...state, systemMsgs: data.data.systemMsgs }
}

//聊天室列表
export function SET_CHAT_LIST(state: StoreStates, data: any) {
  const listData = data.data.chatListData
  const newDataList = listData.filter((item: any) => item.windowClose === 0)
  const pageNo = data.data.pageNo || state.chatStateTmp.pageNo
  const pageEnd = pageNo ? pageNo * 20 : 20
  return {
    ...state,
    chatListData: listData,
    chatStateTmp: {
      ...state.chatStateTmp,
      totalPages: Math.ceil(listData.length / 20),
      pageNo: pageNo ? pageNo : 0,
    },
    // newDataList: newDataList.slice(0, pageEnd),
    newDataList: newDataList,
  }
}
export function SET_CHAT_MESSAGE(state: StoreStates, data: any) {
  return {
    ...state,
    messageList: data.data.messageList,
  }
}

export function IGNOR_NEW_MSG(state: StoreStates, data: any) {
  return { ...state, ignorMsg: data.data.roomIds }
}

//撤回审批和@缓存类型和id
export function RECALL_INFO_MSG(state: StoreStates, data: any) {
  return { ...state, recallInfoMsg: data.data }
}

//在线人数
export function SET_ONLINE_INFO(state: StoreStates, data: any) {
  return { ...state, onlineInfo: data.data.onlineInfo }
}

//当前聊天室公告
export function SET_CHAT_NOTICE(state: StoreStates, data: any) {
  return { ...state, chatNoticeList: data.data.noticeList }
}

//当前聊天室讨论
export function SET_CHAT_DISCUSS(state: StoreStates, data: any) {
  return { ...state, chatDiscussType: data.data }
}

//当前聊天室收藏
export function SET_COLLECT_IMG(state: StoreStates, data: any) {
  return { ...state, collectList: data.data }
}

// 当前成员的昵称
export function SET_CHAT_USERINFO(state: StoreStates, data: any) {
  return { ...state, chatUserInfo: data.data.chatUserInfo }
}

// 回复消息详情
export function SET_REPLY_MODAL_DATA(state: StoreStates, data: any) {
  return { ...state, replyModalData: data.data }
}

export function SET_REPLY_PARENT_DATA(state: StoreStates, data: any) {
  return { ...state, currentReplyData: data.data }
}
//缓存聊天室草稿
export function SET_CHA_TMSG(state: StoreStates, data: any) {
  return { ...state, chatDrafMsg: data.data }
}
export function SET_OPENROOM_IDS(state: StoreStates, data: any) {
  return { ...state, openRoomIds: data.data }
}
declare global {
  interface StoreStates {
    keepScroll: boolean
    onlineInfo: { online: number; total: number; onlineUsers: any[] }
    roomManager: {
      id: number
      userName: string
      userAccount: string
      account: string
      headPhoto: string
      profile: string
      userId: number
      memberType: number
    }
    chatListData: globalInterface.ChatListProps[]
    listChange: boolean
    selectItem: globalInterface.ChatListProps
    preSelectItem: globalInterface.ChatListProps
    chatDrafMsg: any
    chatNoticeList: globalInterface.NoticeListItemProps[]
    chatDiscussType: object
    collectList: globalInterface.CollectItemProps[]
    systemMsgs: any[]
    hasMore: boolean
    messageHistory: Array<globalInterface.ChatItemProps>
    chatUserLists: Array<globalInterface.ChatMemberPorps>
    ignorMsg: number[]
    recallInfoMsg: {
      noticeTypeId: number
      noticeType: string
    }
    chatUserInfo: { nickName: string; userType: number; userId: number }
    replyModalData: { visible: boolean; timestamp: number; rootMsgUuid: string; roomId?: number | null }
    currentReplyData: any[]
    openRoomIds: number[]
    chatStateTmp: {
      pageNo: number
      totalPages: number
    }
    newDataList: any[]
    messageList: any
    netWorkHint: {
      status: boolean
      networkText: string
    }
  }
  interface StoreActions {
    SET_ONLINE_INFO: string
    SET_CHAT_MANAGER: string
    SET_CHAT_LIST: string
    SET_SELECT_ITEM: string
    SET_CHA_TMSG: string
    SET_CHAT_MESSAGE: string
    SET_CHAT_NOTICE: string
    SET_CHAT_DISCUSS: string
    SET_COLLECT_IMG: string
    SET_SYSTEM_MSG: string
    SET_CHAT_USERLISTS: string
    IGNOR_NEW_MSG: string
    RECALL_INFO_MSG: string
    SET_CHAT_USERINFO: string
    CHAT_ROOM_INFO: string
    SET_KEEP_SCROLL: string
    SET_HASMORE_HISTORYMESSAGE: string
    SET_REPLY_MODAL_DATA: string
    SET_REPLY_PARENT_DATA: string
    SET_OPENROOM_IDS: string
    SET_NETWORK_TIP: string
  }
}

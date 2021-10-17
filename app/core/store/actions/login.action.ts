export const initialState = {
  isLogin: false,
  showSide: false,
  nowUser: '',
  nowAccount: '',
  nowUserId: 0,
  nowAvatar: '', //头像
  newTeamList: [], //企业列表
  loginOutInfo: {
    loginOutFn: null,
    isLoginOut: false,
  },
  loginOutFn: null,
  langType: 'zh_CH',
  unreadList: [],
}

//登录存储
export function ACTION_LOGIN(
  state: StoreStates,
  data: any
): {
  isLogin: boolean
  showSide: boolean
  nowUser: string
  nowAccount: string
  nowUserId: number
  nowAvatar: string
} {
  const info = data.data
  const newData = {
    isLogin: !state.isLogin,
    showSide: !state.isLogin,
    nowUser: info.username,
    nowAccount: info.account,
    nowUserId: info.userId,
    nowAvatar: info.userAvatar,
  }
  if (info.isLogin !== undefined) {
    newData.isLogin = info.isLogin
    newData.showSide = info.isLogin
  }
  // console.log('ACTION_LOGIN', newData)
  return newData
}

//登陆后存储企业列表信息
export function SAVE_TEAM_LIST_INFO(state: StoreStates, data: any) {
  return { ...state, newTeamList: data.data }
}

//退出登录后重置store
export function RESET_STORE() {
  return undefined
}
//登录后未读消息
export function SAVE_UNREAD_INFO(state: StoreStates, data: any) {
  return {
    ...state,
    unreadList: data.data,
  }
}
//退出登录方法
export function LOGINOUT_INFO(state: StoreStates, data: any) {
  const loginOutInfo = state.loginOutInfo
  if (data.data.loadedInfo != undefined) {
    loginOutInfo.loginOutFn = data.data.loginOutFn
  }
  if (data.data.isLoginOut != undefined) {
    loginOutInfo.isLoginOut = data.data.isLoginOut
  }
  return {
    ...state,
    loginOutFn: data.data.loginOutFn,
    isLoginOut: data.data.isLoginOut,
  }
}
//退出登录方法
export function LOGINOUTFN(state: StoreStates, data: any) {
  return {
    ...state,
    loginOutFn: data.data,
  }
}
//存取语言类型
export function LANGTYPE(state: StoreStates, data: any) {
  return {
    ...state,
    langType: data.data.langType,
  }
}
declare global {
  interface StoreStates {
    isLogin: boolean
    showSide: boolean
    nowUser: string
    nowAccount: string
    nowUserId: number
    nowAvatar: string
    unreadList: any[]
    newTeamList: any[]
    loginOutInfo: any
    loginOutFn: any
    langType: any
  }

  interface StoreActions {
    ACTION_LOGIN: string
    RESET_STORE: string
    SAVE_UNREAD_INFO: string
    SAVE_TEAM_LIST_INFO: string
    LOGINOUT_INFO: string
    LOGINOUTFN: string
    LANGTYPE: string
  }
}

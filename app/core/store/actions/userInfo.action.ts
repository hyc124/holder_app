export const initialState = {
  userInfo: {
    id: 0,
    username: '',
    account: '',
    password: 'string',
    status: 0,
    attachStatus: 0,
    phoneNumber: '',
    email: '',
    registerType: 0,
    joinDate: '',
    sex: 0,
    birthday: '',
    workNum: 0,
    shotNum: 0,
    hidePhoneNum: 0,
    abbre: '',
    pinyin: '',
    profile: '',
    thumbsUpNum: 0,
  },
  appVersionInfo: { nowVersionNum: 0, remoteVersionNum: 0 },
}

export function SET_USER_INFO(_state: StoreStates, data: any): { userInfo: any } {
  return { userInfo: { ...data.data } }
}

/**
 * 系统版本信息
 */
export function SET_VERSION_INFO(state: StoreStates, data: any) {
  const appVersionInfo = data.data
  if (data.data.nowVersionNum !== undefined) {
    appVersionInfo.nowVersionNum = data.data.nowVersionNum
  }
  if (data.data.remoteVersionNum !== undefined) {
    appVersionInfo.remoteVersionNum = data.data.remoteVersionNum
  }
  return {
    appVersionInfo,
  }
}
declare global {
  interface StoreStates {
    userInfo: {
      id: number
      username: string
      account: string
      password: string
      status: number
      attachStatus: number
      phoneNumber: string
      email: string
      registerType: number
      joinDate?: string
      sex: number
      birthday?: string
      workNum?: number
      shotNum?: number
      hidePhoneNum: number
      abbre: string
      pinyin: string
      profile?: string
      thumbsUpNum: number
    }
    appVersionInfo: {
      nowVersionNum: number
      remoteVersionNum: number
      content: string
      [propName: string]: any
    }
  }
  interface StoreActions {
    SET_USER_INFO: string
    SET_VERSION_INFO: string
  }
}

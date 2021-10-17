export const initialState = {
  weChatScanState: {
    state: '',
    imgUrl: '',
  },
  weChatUserInfo: {
    weChatUnionId: '', //微信唯一标识
    headimgurl: '', //微信头像
    nickname: '', //微信昵称
  },
  weChatScanClearRequest: false, //清空微信扫码二维码轮询请求监听
}
export function WE_CHAT_SCAN_STATE(state: StoreStates, data: any) {
  return { weChatScanState: data.data }
}
export function WE_CHAT_USER_INFO(state: StoreStates, data: any) {
  return { weChatUserInfo: data.data }
}
export function WE_CHAT_SCAN_CLEAR_REQUEST(state: StoreStates, data: any) {
  return { weChatScanClearRequest: data.data }
}
declare global {
  interface StoreStates {
    weChatScanState: any
    weChatUserInfo: any
    weChatScanClearRequest: any
  }
  interface StoreActions {
    WE_CHAT_SCAN_STATE: string
    WE_CHAT_USER_INFO: string
    WE_CHAT_SCAN_CLEAR_REQUEST: string
  }
}

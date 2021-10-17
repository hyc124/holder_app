export const initialState = {
  refreshMeetList: false, //请假/参加会议 关闭弹窗刷新列表
}

export function REFRESH_MEET_LIST(state: StoreStates, data: any) {
  return { ...state, refreshMeetList: data.data.refreshMeetList }
}

declare global {
  interface StoreStates {
    refreshMeetList: boolean
  }
  interface StoreActions {
    REFRESH_MEET_LIST: boolean
  }
}

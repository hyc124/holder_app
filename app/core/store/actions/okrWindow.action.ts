export const initialState = {
  //okr详情独立窗口数据
  okrWindowInfo: {
    // 当前选中数据
    nowSelectOkr: {
      findId: '', //查询id
    },
    // 窗口中所有tabs数据
    tabsList: [],
  },
}
// okr详情独立窗口数据
export function OKRWINDOWINFO(state: StoreStates, data: any): { okrWindowInfo: any } {
  const okrWindowInfo: any = state.loginOutInfo || {}
  if (data.data.nowSelectOkr !== undefined) {
    okrWindowInfo.nowSelectOkr = data.data.nowSelectOkr
  }
  if (data.data.tabsList !== undefined) {
    okrWindowInfo.tabsList = data.data.tabsList
  }
  return {
    okrWindowInfo,
  }
}
declare global {
  interface StoreStates {
    okrWindowInfo: any
  }
  interface StoreActions {
    OKRWINDOWINFO: string
  }
}

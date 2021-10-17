export const initialState = {
  handleBtnList: {},
  getDiffType: 0, //0-创建  1-详情
  roomIdList: [],
  forceListReport: {},
  sourceType: '', //调用汇报的来源
  reportOptBack: {},
}

export function TASK_LIST_ROW(state: StoreStates, data: any) {
  const info = data.data
  return {
    handleBtnList: info.handleBtn,
    getDiffType: info.type,
    sourceType: info.sourceType,
  }
}

export function FORCE_LIST_REPORT(state: StoreStates, data: any) {
  return {
    forceListReport: data.data,
  }
}
export function ROOM_ID_LIST(state: StoreStates, data: any) {
  return {
    roomIdList: data.data,
  }
}
/**
 * 汇报完成之后回调
 * @param state
 * @param data
 * @returns
 */
export function REPORT_OPT_BACK(state: StoreStates, data: any) {
  return { reportOptBack: data.data }
}
declare global {
  interface StoreStates {
    handleBtnList: any
    getDiffType: number
    sourceType: string
    roomIdList: Array<any>
    forceListReport: any
    reportOptBack: any
  }

  interface StoreActions {
    TASK_LIST_ROW: object
    ROOM_ID_LIST: string
    FORCE_LIST_REPORT: string
    REPORT_OPT_BACK: string
  }
}

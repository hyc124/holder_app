import { AnyAction } from 'redux'

export const initialState = {
  planModalObj: {
    //规划弹框公用数据
    sourceItem: {}, //被操作对象的数据
    shareFormType: '', //打开分享群聊入口
    quoteMsg: {},
  },
}
// 规划弹框数据
export function WORKPLAN_MODAL(state: StoreStates, data: any) {
  const planModalObj = state.planModalObj
  if (data.data.sourceItem != undefined) {
    planModalObj.sourceItem = data.data.sourceItem
  }
  if (data.data.shareFormType != undefined) {
    planModalObj.shareFormType = data.data.shareFormType
  }
  if (data.data.quoteMsg != undefined) {
    planModalObj.quoteMsg = data.data.quoteMsg
  }
  return {
    planModalObj: planModalObj,
  }
}
declare global {
  interface StoreStates {
    planModalObj: AnyAction
  }
  interface StoreActions {
    WORKPLAN_MODAL: string
  }
}

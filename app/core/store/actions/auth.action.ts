export const initialState = {
  authList: [], //所有拥有权限的接口列表
  funsAuthList: [], //系统导航功能权限
}
// 所有拥有权限的接口列表
export function AUTHLIST(state: StoreStates, data: any) {
  return {
    authList: data.data,
  }
}
/**
 * 系统导航权限
 */
export function FUNSAUTHLIST(state: StoreStates, data: any) {
  return {
    funsAuthList: data.data,
  }
}
declare global {
  interface StoreStates {
    authList: any
    funsAuthList: any
  }
  interface StoreActions {
    AUTHLIST: string
    FUNSAUTHLIST: string
  }
}

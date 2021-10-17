export const initialState = {
  // 所有窗口数据信息
  windowsInfo: {
    // 所有窗口是否加载过路由的信息
    loadedInfo: [],
    // 当前活跃窗口信息
    windowActive: {
      name: '', //名字key
      active: false, //是否活跃
    },
  },
}
// 所有窗口加载信息
export function WINDOWS_INFO(state: StoreStates, data: any) {
  const windowsInfo = state.windowsInfo
  if (data.data.loadedInfo != undefined) {
    windowsInfo.loadedInfo = data.data.loadedInfo
  }
  if (data.data.windowActive != undefined) {
    windowsInfo.windowActive = data.data.windowActive
  }
  return { windowsInfo: windowsInfo }
}
declare global {
  interface StoreStates {
    windowsInfo: {
      loadedInfo: Array<{ key: string; loadedUrl: boolean }>
      //   loadedInfo: Map<
      //   string,boolean
      // >
      windowActive: {
        name: string
        active: boolean
      }
    }
  }
  interface StoreActions {
    WINDOWS_INFO: string
  }
}

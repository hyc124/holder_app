export const initialState = {
  downloadFileLists: [], //下载附件列表集合
  showDownload: false, //显示下载效果
}
//添加下载
export function ADD_DOWNLOAD_FILE(state: StoreStates, data: any) {
  if (data.data === null) {
    return { ...state, downloadFileLists: [] }
  }
  return {
    ...state,
    downloadFileLists: [data.data, ...state.downloadFileLists],
    showDownload: !state.showDownload,
  }
}
//更新下载进度和状态
export function UPDATE_DOWNLOAD_STATUS_AND_PERCENT(state: StoreStates, data: any) {
  const { type, fileSymbol, percent, status } = data.data
  if (type === 'percent') {
    //更新进度
    const newFileLists = state.downloadFileLists.map(item => {
      if (item.fileSymbol === fileSymbol) {
        item.percent = percent
      }
      return item
    })
    return { ...state, downloadFileLists: newFileLists }
  }
  if (type === 'status') {
    const newFileLists = state.downloadFileLists.map(item => {
      if (item.fileSymbol === fileSymbol) {
        item.percent = 100
        item.status = status
      }
      return item
    })
    return { ...state, downloadFileLists: newFileLists }
  }
}

declare global {
  interface StoreStates {
    downloadFileLists: any[]
    showDownload: boolean
  }
  interface StoreActions {
    ADD_DOWNLOAD_FILE: string
    UPDATE_DOWNLOAD_STATUS_AND_PERCENT: string
  }
}

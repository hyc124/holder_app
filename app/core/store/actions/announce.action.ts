export const initialState = {
  downLoadList: [],
  noticeDetailProps: {
    noticeId: '',
    source: '',
  },
  noticeTableList: {
    totalElements: 0,
    content: [],
  },
  queryParams: {
    pageNo: 0,
    pageSize: 10,
    startTime: '',
    endTime: '',
    keyword: '',
    groupId: '',
    ascriptionId: '',
  },
  addModalVisble: false,
}

export function DOWNLOAD_LIST(state: StoreStates, data: any): { downLoadList: object } {
  return {
    downLoadList: data.data,
  }
}

export function NOTICE_DETAILS(state: StoreStates, data: any): { noticeDetailProps: object } {
  return {
    noticeDetailProps: data.data,
  }
}

export function NOTICE_LIST(state: StoreStates, data: any): { noticeTableList: object } {
  return {
    noticeTableList: data.data,
  }
}

export function QUERY_PARAMS(state: StoreStates, data: any): { queryParams: object } {
  return {
    queryParams: data.data,
  }
}

export function ADDMODAL_VISIBLE(state: StoreStates, data: any): { addModalVisble: boolean } {
  return {
    addModalVisble: data.data,
  }
}

declare global {
  interface StoreStates {
    downLoadList: Array<object>
    noticeDetailProps: {
      noticeId: number
      source: string
    }
    noticeTableList: {
      totalElements: number
      content: []
    }
    queryParams: {
      pageNo: number
      pageSize: number
      startTime: string
      endTime: string
      keyword: string
      groupId: number
      ascriptionId: number
    }
    addModalVisble: boolean
  }

  interface StoreActions {
    DOWNLOAD_LIST: string
    NOTICE_DETAILS: string
    NOTICE_LIST: string
    QUERY_PARAMS: string
    ADDMODAL_VISIBLE: boolean
  }
}

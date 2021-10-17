export const initialState = {
  relationTaskList: {
    totalPages: 0,
    totalElements: 10,
    content: [],
  },
  relationApprovalList: {
    totalPages: 0,
    totalElements: 10,
    content: [],
  },
  relationMettingList: {
    totalPages: 0,
    totalElements: 10,
    content: [],
  },
  relationIds: [],
  reportType: '',
  reportTypeName: '',
  openType: 'create',
  templateId: '',
  allowImportSet: '',
  isImportReport: false,
  getTeamId: '',
  wortReportType: {
    isType: 'create',
    isTime: '',
  }, //工作报告窗口类型（创建or编辑）
  editWorkReportId: 0, //编辑报告id
  editWorkReportUserId: 0, //编辑报告用户id
  workRpoertListComment: {
    //工作列表查看详情
    workRpoertListCommRootId: '', // 评论回复@根id
    workRpoertListCommParentId: '', // 评论回复@父id
    workRpoertListCommName: '', // 评论回复@name
    workRpoertListIsThum: false, //点赞动画
    workRpoertListCommUserId: '', //回复id
  },
  refreshReportList: {
    isRefreshReportList: false,
    reportUserList: [],
  },
}
export function RELATIONTASKLIST(state: StoreStates, data: any) {
  const info = data.data
  return {
    relationTaskList: info,
  }
}
export function RELATIONAPPROVALLIST(state: StoreStates, data: any) {
  const info = data.data
  return {
    relationApprovalList: info,
  }
}
export function RELATIONMETTINGLIST(state: StoreStates, data: any) {
  const info = data.data
  return {
    relationMettingList: info,
  }
}
export function RELATIONIDS(state: StoreStates, data: any) {
  const info = data.data
  return {
    relationIds: info,
  }
}
export function REPORTTYPE(state: StoreStates, data: any) {
  const info = data.data
  return {
    reportType: info,
  }
}
export function REPORTTYPENAME(state: StoreStates, data: any) {
  const info = data.data
  return {
    reportTypeName: info,
  }
}

export function CHANGE_IS_IMPORT(state: StoreStates, data: any) {
  return { isImportReport: data.data.isImportReport }
}
// 刷新我发起的列表
export function REFRESH_REPORT_LIST(state: StoreStates, data: any) {
  return { refreshReportList: data.data }
}
export function CHANGE_WORKREPORT_OPENTYPE(state: StoreStates, data: any) {
  return { openType: data.data }
}
export function WORKREPORT_TEMPLATEID(state: StoreStates, data: any) {
  return { templateId: data.data }
}
export function WORKREPORT_ALLOWIMPORTSET(state: StoreStates, data: any) {
  return { allowImportSet: data.data }
}
export function WORKREPORT_GET_TEAM_ID(state: StoreStates, data: any) {
  return { getTeamId: data.data }
}
export function WORKREPORT_TYPE(state: StoreStates, data: any) {
  return { wortReportType: data.data }
}
export function EDIT_WORK_REPORT_ID(state: StoreStates, data: any) {
  return { editWorkReportId: data.data.editWorkReportId }
}

export function EDIT_WORK_REPORT_USER_ID(state: StoreStates, data: any) {
  return { editWorkReportUserId: data.data.editWorkReportUserId }
}

export function WORK_REPORT_LIST_COMMENT(state: StoreStates, data: any) {
  const workRpoertListComment = state.workRpoertListComment
  if (data.data.workRpoertListCommRootId != undefined) {
    workRpoertListComment.workRpoertListCommRootId = data.data.workRpoertListCommRootId
  }
  if (data.data.workRpoertListCommParentId != undefined) {
    workRpoertListComment.workRpoertListCommParentId = data.data.workRpoertListCommParentId
  }
  if (data.data.workRpoertListCommName != undefined) {
    workRpoertListComment.workRpoertListCommName = data.data.workRpoertListCommName
  }
  if (data.data.workRpoertListIsThum != undefined) {
    workRpoertListComment.workRpoertListIsThum = data.data.workRpoertListIsThum
  }
  if (data.data.workRpoertListCommUserId != undefined) {
    workRpoertListComment.workRpoertListCommUserId = data.data.workRpoertListCommUserId
  }
  return {
    workRpoertListComment: data.data,
  }
}
declare global {
  interface StoreStates {
    relationTaskList: any
    relationApprovalList: any
    relationMettingList: any
    relationIds: any
    reportType: any
    openType: string
    templateId: string
    allowImportSet: string
    isImportReport: boolean
    getTeamId: string
    wortReportType: any //工作报告窗口类型（创建or编辑）
    editWorkReportId: number //编辑报告id
    editWorkReportUserId: number //编辑报告用户id
    workRpoertListComment: any
    refreshReportList: any
  }
  interface StoreActions {
    RELATIONTASKLIST: string
    RELATIONAPPROVALLIST: string
    RELATIONMETTINGLIST: string
    RELATIONIDS: string
    REPORTTYPE: string
    REPORTTYPENAME: string
    CHANGE_WORKREPORT_OPENTYPE: string
    WORKREPORT_TEMPLATEID: string
    WORKREPORT_ALLOWIMPORTSET: string
    CHANGE_IS_IMPORT: string
    WORKREPORT_GET_TEAM_ID: string
    WORKREPORT_TYPE: string
    EDIT_WORK_REPORT_ID: number
    EDIT_WORK_REPORT_USER_ID: number
    WORK_REPORT_LIST_COMMENT: any
    REFRESH_REPORT_LIST: any
  }
}

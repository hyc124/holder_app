export const initialState = {
  loginToken: '',
  selectTeamId: -1,
  followSelectTeadId: -1, //关注人的企业ID
  businessAddress: '', //应用访问地址
  odooToken: '', //应用登录Token
  selectTeamName: '',
  selectTeam: { name: '所有企业', id: 0 }, //选中企业
  orgInfo: [],
  showEditModal: false,
  modalTagItemData: null,
  showFullScreen: false,
  handleMessage: {
    isHandleMessage: false,
    currentNowMsg: [],
  }, //右下角弹窗处理
  handleMessageOption: [],
  modulePosition: 0,

  showReportListModal: false, //工作报告列表弹窗
  // targetKanbanParams: {
  //   pageNo: 0,
  //   pageSize: 10,
  //   ascriptionId: '0',
  //   ascriptionType: '0',
  // },
  delayListData: {
    dataList: [],
  },
  reportListData: {
    dataList: [],
  },
  taskWaitData: null,
  currentMsg: {
    msg: {},
    visible: false,
  },
  followUserInfo: {
    followStatus: false,
    userProfile: '',
    userId: '',
    account: '',
    name: '',
    followOrgId: '',
  },
  screenParams: {
    active: 0, //0任务 1关注人
  },
  listType: 0,
  moduleActiveKey: {
    activeKey: '',
    modulePosition: 0,
  },
  chanDaoUrl: {
    url: '',
    id: 0,
    type: '',
  },
  wuTongUrl: {
    url: '',
  },
  networkStatus: true,
  deskTabsCount: [], //工作台tab数据统计
  refresh_desk_module: [],
  remarkSubmitUuid: '',
  addModalMsg: {
    companyId: 0, //企业id,
    groupId: undefined, //分组id
    enterpriseList: undefined,
    editNoticeData: '',
  },
  currentwinKey: '', //当前选中页面key
  fileToken: '', //附件token
}

export function SET_REQUESET_TOKEN(state: StoreStates, data: any) {
  return { loginToken: data.data.token }
}

export function SET_SEL_TEAMID(state: StoreStates, data: any) {
  return { ...state, selectTeamId: data.data.selectTeamId }
}

export function SET_BUSINESS_ADDRESS(state: StoreStates, data: any) {
  return { ...state, businessAddress: data.data.businessAddress }
}

export function SET_ODOO_TOKEN(state: StoreStates, data: any) {
  return { ...state, odooToken: data.data.odooToken }
}
export function SET_FOLSEL_ORGID(state: StoreStates, data: any) {
  return { ...state, followSelectTeadId: data.data.followSelectTeadId }
}
export function SET_SEL_TEAMNAME(state: StoreStates, data: any) {
  return { ...state, selectTeamName: data.data.selectTeamName }
}

export function SAVE_ORGINFO(state: StoreStates, data: any) {
  return { orgInfo: data.data.orgInfo }
}

export function SHOW_EDIT_MODAL(state: StoreStates, data: any) {
  return { ...state, showEditModal: data.data.visible, modalTagItemData: data.data.modalTagItemData }
}

export function SHOW_REPORT_LIST_MODAL(state: StoreStates, data: any) {
  return { showReportListModal: data.data.visible }
}
//工作台模块全屏展示
export function WORKDESK_FULL_SCREEN(state: StoreStates, data: any) {
  return { showFullScreen: data.data.visible, modulePosition: data.data.position }
}
//全局储存当前选中页面key
export function SET_CURRENTWIN(state: StoreStates, data: any) {
  return { currentwinKey: data.data.key }
}
//强制汇报提示框
export function FORCE_REPORT_TIP(state: StoreStates, data: any) {
  return { hasForceReport: true, reportListData: data }
}
//目标看板请求参数缓存
// export function TARGET_KANBAN_QUERY(state: StoreStates, data: any) {
//   return { ...state, targetKanbanParams: data.data }
// }
//红色延迟列表数据缓存
export function DELAY_LIST_DATA(state: StoreStates, data: any) {
  return { ...state, delayListData: data.data }
}
//强制汇报中间弹窗数据缓存
export function FORCE_REPORT_DATA(state: StoreStates, data: any) {
  return { ...state, reportListData: data.data }
}
//待办推送数据缓存
export function TASK_WAIT_DATA(state: StoreStates, data: any) {
  return { ...state, taskWaitData: data.data }
}
//企业邀请联系人数据缓存
export function INVITE_USER_MSG(state: StoreStates, data: any) {
  return { ...state, currentMsg: data.data }
}
//关注人工作台参数
export function FOLLOW_USER_INFO(state: StoreStates, data: any) {
  return { ...state, followUserInfo: data.data }
}
//关注人 任务全屏参数

export function SCREEN_PARAMS(state: StoreStates, data: any) {
  return { ...state, screenParams: data.data }
}
// 右下角push弹窗处理
export function HANDLE_MESSAGE(state: StoreStates, data: any) {
  return { isHandleMessage: data.data.isHandleMessage, currentNowMsg: data.data.currentNowMsg }
}
export function HANDLE_MESSAGE_OPTION(state: StoreStates, data: any) {
  return { ...state, data: data.data }
}
export function REFRESH_DESK_MODULE(state: StoreStates, data: any) {
  return { ...state, data: data.data }
}
//任务模块listType
export function TASK_LISTTYPE(state: StoreStates, data: any) {
  return { listType: data.data }
}
//模块code存储
export function MODULE_ITEM_KEY(state: StoreStates, data: any) {
  return { moduleActiveKey: data.data }
}
//发布公告参数信息
export function ADD_MODAL_MSG(state: StoreStates, data: any) {
  return { addModalMsg: data.data }
}
//禅道访问地址
export function CHAN_DAO_URL(state: StoreStates, data: any) {
  return { chanDaoUrl: data.data }
}
//吾同体育访问地址
export function WU_TONG_URL(state: StoreStates, data: any) {
  return { wuTongUrl: data.data }
}
//网络状态缓存
export function NETWORK_STATUS(state: StoreStates, data: any) {
  return { networkStatus: data.data }
}
// 工作台tab数据统计
export function SET_DESKTABCOUNT(state: StoreStates, data: any) {
  return { ...state, deskTabsCount: data.data }
}
//提交备注存储的UUID
export function REMARK_SUBMIT_UUID(state: StoreStates, data: any) {
  return { ...state, remarkSubmitUuid: data.data }
}

// 工作台选中企业信息
export function SET_SEL_TEAMINFO(state: StoreStates, data: any) {
  return { ...state, selectTeam: data.data.selectTeam }
}

//附件全局token
export function FILE_TOKEN(state: StoreStates, data: any) {
  return { ...state, fileToken: data.data }
}
declare global {
  interface StoreStates {
    loginToken: string
    selectTeamId: number
    businessAddress: string
    odooToken: string
    followSelectTeadId: number
    selectTeamName: string
    orgInfo: any[]
    selectTeam: {
      name: string
      id: number
    }
    showEditModal: boolean
    modalTagItemData: any //模块标签数据
    showFullScreen: boolean
    screenParams: {
      active: number
    }
    modulePosition: number
    followUserInfo: {
      followStatus: boolean
      userProfile: string
      userId: any
      account: string
      name: string
      followOrgId: any
    }
    showReportListModal: boolean
    targetKanbanParams: {
      pageNo: number
      pageSize: number
      ascriptionId?: number
      ascriptionType?: string
    }
    delayListData: {
      dataList: any
    }
    reportListData: {
      dataList: any[]
    }
    taskWaitData: any
    currentMsg: {
      msg: any
      visible: boolean
    }
    rightBtnVisble: boolean
    handleMessage: {
      isHandleMessage: boolean
      currentNowMsg: any[]
    }
    handleMessageOption: any
    listType: number
    moduleActiveKey: {
      activeKey: any
      modulePosition: number
    }
    chanDaoUrl: {
      url: string
      id: number
      type: string
    }
    wuTongUrl: {
      url: string
    }
    networkStatus: boolean
    deskTabsCount: any //工作台tab数据统计
    refresh_desk_module: any //刷新工作台侧边栏企业
    remarkSubmitUuid: string
    addModalMsg: {
      companyId: any //企业id,
      groupId: any //分组id
      enterpriseList: any
      editNoticeData: any
    }
    currentwinKey: string
    fileToken: string //附件上传需要的token
  }
  interface StoreActions {
    SET_REQUESET_TOKEN: string
    SET_SEL_TEAMID: string
    SET_FOLSEL_ORGID: string
    SET_SEL_TEAMNAME: string
    SAVE_ORGINFO: string
    SET_SEL_TEAMINFO: string
    SHOW_EDIT_MODAL: string
    UNREAD_MSG_COUNT: string
    SHOW_REPORT_LIST_MODAL: string
    WORKDESK_FULL_SCREEN: string
    SET_CURRENTWIN: string
    RIGHT_BTNS_NUMS: string
    SCREEN_WIDTH: string
    FORCE_REPORT_TIP: string
    TARGET_KANBAN_QUERY: string
    DELAY_LIST_DATA: string
    FORCE_REPORT_DATA: string
    TASK_WAIT_DATA: string
    INVITE_USER_MSG: string
    FOLLOW_USER_INFO: string
    SCREEN_PARAMS: string
    HANDLE_MESSAGE: string
    HANDLE_MESSAGE_OPTION: string
    TASK_LISTTYPE: string
    MODULE_ITEM_KEY: string
    SET_ODOO_TOKEN: string
    SET_BUSINESS_ADDRESS: string
    CHAN_DAO_URL: string
    WU_TONG_URL: string
    NETWORK_STATUS: boolean
    SET_DESKTABCOUNT: string
    REFRESH_DESK_MODULE: string
    REMARK_SUBMIT_UUID: string
    ADD_MODAL_MSG: string
    FILE_TOKEN: string
  }
}

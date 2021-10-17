export const initialState = {
  workplanTreeId: '', //工作规划组织架构
  workokrTreeId: '', //工作台组织架构
  myPlanOrg: {}, //工作规划选择我的规划创建规划企业信息
  planListModeData: [], //工作规划列表模式数据
  mindMapData: {}, //工作规划跳转到脑图所传规划数据
  mindMapTitle: [], //工作规划跳转到脑图所传规划数据
  fromPlanTotype: {
    createType: 0, // 0创建 1详情
    fromToType: 0, // 0脑图 1四象限
  },
  mindMapOkrData: {}, //工作台跳转到脑图所传规划数据
  differentOkr: 0, //判断是脑图是工作台---1还是工作规划---0点击的四象限
  // 规划列表主页信息
  planMainInfo: {
    //规划组织架构当前所选信息
    isMyPlan: true, //是否是我的规划
    orgInfo: {},
    // 规划列表刷新方法
    planListRefresh: {},
    // 当前所处文件夹位置id
    nowFolderId: '',
  },
  planOkrMainInfo: {},
  refreshFn: {
    //刷新
    mindMap: {
      type: false,
      datas: null,
    },
    mindMapMeun: {
      type: false,
      datas: null,
    },
    fourMapQuadurant: {
      type: false,
      datas: null,
    },
  },
  selectDistribute: [], //工作规划列表数据选择
  planStateArr: '1,2', //下拉筛选类型
  okrPeriodFilter: {}, //okr时间周期筛选
  okrPeriodList: [], //周期列表
  planOkrStateArr: '1,2',
}
export function MYPLAN_ORG(state: StoreStates, data: any) {
  return {
    myPlanOrg: data.data,
  }
}
export function WORKPLAN_TREEID(state: StoreStates, data: any) {
  const info = data.data
  return {
    workplanTreeId: info.workplanTreeId,
  }
}

export function WORKPLAN_OKR_TREEID(state: StoreStates, data: any) {
  const info = data.data
  return {
    workokrTreeId: info.workokrTreeId,
  }
}

export function PLANLISTMODEDATA(state: StoreStates, data: any) {
  const info = data.data
  return {
    planListModeData: info.planListModeData,
  }
}

//规划列表主页所选信息
export function PLANOKRMAININFO(state: StoreStates, data: any) {
  const planMainInfo = state.planMainInfo
  if (data.data.isMyPlan != undefined) {
    planMainInfo.isMyPlan = data.data.isMyPlan
  }
  if (data.data.orgInfo != undefined) {
    planMainInfo.orgInfo = data.data.orgInfo
  }
  if (data.data.planListRefresh != undefined) {
    planMainInfo.planListRefresh = data.data.planListRefresh
  }
  if (data.data.nowFolderId != undefined) {
    planMainInfo.nowFolderId = data.data.nowFolderId
  }
  return {
    planOkrMainInfo: planMainInfo,
  }
}
export function MINDMAPDATA(state: StoreStates, data: any) {
  let mindMapTitle: any[] = []
  if (Object.keys(data.data)?.length == 0) {
    mindMapTitle = []
  } else if (data?.isDelId) {
    // 删除地图头部导航数据
    mindMapTitle = state.mindMapTitle.filter((item: any) => item.id != data.isDelId)
  } else {
    // 添加地图头部导航数据
    const filterData = state.mindMapTitle.filter((item: any) => item.id == data.data.id)
    mindMapTitle = filterData?.length > 0 ? state.mindMapTitle : [...state.mindMapTitle, data.data]
  }
  return {
    mindMapData: data.data,
    mindMapTitle,
  }
}

export function MINDMAPOKRDATA(state: StoreStates, data: any) {
  return {
    mindMapOkrData: data.data,
  }
}

//象限的类型
// eslint-disable-next-line @typescript-eslint/camelcase
export function DIFFERENT_OkR(state: StoreStates, data: any) {
  return {
    differentOkr: data.data,
  }
}

//目标任务的选择类型与展示类型
export function FROM_PLAN_TYPE(state: StoreStates, data: any) {
  return {
    fromPlanTotype: data.data,
  }
}

//okr时间周期筛选
export function OKRPERIODFILTER(state: StoreStates, data: any) {
  return {
    okrPeriodFilter: data.data,
  }
}
//okr周期列表
export function OKRPERIODLIST(state: StoreStates, data: any) {
  return {
    okrPeriodList: data.data,
  }
}
//目标任务的选择派发数据
export function SELECT_DISTRIBUTE_DATE(state: StoreStates, data: any) {
  return {
    selectDistribute: data.data,
  }
}
//下拉筛选状态
export function PLANSTATEARR(state: StoreStates, data: any) {
  return {
    planStateArr: data.data,
  }
}
//下拉筛选状态
export function PLANOKRSTATEARR(state: StoreStates, data: any) {
  return {
    planOkrStateArr: data.data,
  }
}
//规划列表主页所选信息
export function PLANMAININFO(state: StoreStates, data: any) {
  const planMainInfo = state.planMainInfo
  if (data.data.isMyPlan != undefined) {
    planMainInfo.isMyPlan = data.data.isMyPlan
  }
  if (data.data.orgInfo != undefined) {
    planMainInfo.orgInfo = data.data.orgInfo
  }
  if (data.data.planListRefresh != undefined) {
    planMainInfo.planListRefresh = data.data.planListRefresh
  }
  if (data.data.nowFolderId != undefined) {
    planMainInfo.nowFolderId = data.data.nowFolderId
  }
  return {
    planMainInfo: planMainInfo,
  }
}
//用于刷新的方法
export function REFRESHFN(state: StoreStates, data: any) {
  const refreshFn = state.refreshFn
  if (data.data.mindMap != undefined) {
    refreshFn.mindMap = data.data.mindMap
  }
  if (data.data.mindMapMeun != undefined) {
    refreshFn.mindMapMeun = data.data.mindMapMeun
  }
  if (data.data.fourMapQuadurant != undefined) {
    refreshFn.fourMapQuadurant = data.data.fourMapQuadurant
  }
  return {
    refreshFn: refreshFn,
  }
}
declare global {
  interface StoreStates {
    myPlanOrg: any
    workplanTreeId: string
    workokrTreeId: any
    planListModeData: any
    mindMapData: any
    mindMapTitle: any
    fromPlanTotype: any
    planMainInfo: any
    planOkrMainInfo: any
    refreshFn: any
    selectDistribute: any
    planStateArr: string
    planOkrStateArr: string
    differentOkr: number
    mindMapOkrData: any
    okrPeriodFilter: any
    okrPeriodList: any
  }
  interface StoreActions {
    MYPLAN_ORG: string
    WORKPLAN_TREEID: string
    PLANLISTMODEDATA: string
    MINDMAPDATA: string
    MINDMAPTITLE: string
    FROM_PLAN_TYPE: string
    PLANMAININFO: string
    REFRESHFN: string
    SELECT_DISTRIBUTE_DATE: string
    PLANSTATEARR: string
    PLANOKRSTATEARR: string
    DIFFERENT_OkR: string
    MINDMAPOKRDATA: string
    PLANOKRMAININFO: string
    WORKPLAN_OKR_TREEID: string
    OKRPERIODFILTER: string
    OKRPERIODLIST: string
  }
}

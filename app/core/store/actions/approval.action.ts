export const initialState = {
  approvalCheckData: [],
  formulaNumvalObj: {},
  isApprovalSend: false, // 是否是发起审批
  approvalExecuteTitleObj: {}, //发起审批标题数据
  selectApprovalTab: '',
  findByEventIdData: '',
  customProcessSet: '', //查询自定义表单流程设计配置
  sendApprovalInfo: {
    eventId: 0,
    teamId: 0,
    teamName: '',
    approvalName: '',
    approvalId: 0,
    isEdit: false, //是否重新发起
    uuid: '',
    isNextForm: false, //发起下一轮审批
    isNextFormDatas: null, //发起下一轮审批数据存储
    findByEventIdData: '', //发起审批前（存储流程图数据）
    isStartApproval: false, //考勤补卡审批
    isStartApprovalRid: null, //考勤补卡审批resourceId
    key: '', //考勤补卡审批传给后台的key
  },
  nowFormulaInfo: {
    formulaInfo: [], //新增重复行后的公式
    newaddValues: [], //新增重复行值缓存
    tableArr: '',
    heightArr: '',
    rowNum: 0,
    tableElements: [],
  },
  showSignModal: {
    visible: false,
    type: '',
  },
  getDetails: false, //刷新详情
  operateApprovalId: {}, //触发审批id
  nextFormDatas: null, //下一轮审批数据
  businessInfo: null, //工作台台账查看详情
  executeData: null,
  onlyId: null, //唯一标识baseFormDataId
  approvalDetailInfo: null, //缓存审批详情数据
  createApprovalInfo: null, //外部打开审批窗口参数信息
  localReadStatus: '', //知会我的是否只查看已读记录
  approvalfileIds: [], //发起审批附件ID集合
  saveTypeApprovalData: {}, //工作台点击审批类型，审批窗口tab定位
  // saveEventFormRelationSet: {
  //   //审批表单唯一标识读取、回写配置
  //   outBackData: {}, //冲销已选择数据
  //   outBackIds: {}, //可冲销id集合
  //   elementRelationDataList: [], //唯一标识相关集合
  //   onlyElementData: null, //唯一标识数据
  // },
  outBackIds: {}, //可冲销id集合
  outBackData: {}, //冲销已选择数据
  elementRelationDataList: [], //唯一标识相关集合
  onlyElementData: null, //唯一标识数据
  rainbowInformation: {
    name: '',
    text: '',
  },
  hiddenViewList: [], //隐藏的控件uuids
}

//知会我的是否只查看已读记录
export function LOCAL_READ_STATUS(state: StoreStates, data: any) {
  return { ...state, localReadStatus: data.data }
}

//缓存冲销ids
export function SET_OUT_BACK_IDS(state: StoreStates, data: any) {
  return { ...state, outBackIds: data.data }
}

//外部调用审批窗口参数信息
export function SET_CREATE_APPROVAL_INFO(state: StoreStates, data: any) {
  return { ...state, createApprovalInfo: data.data }
}

//缓存审批详情数据
export function SET_APPROVAL_DETAIL_INFO(state: StoreStates, data: any) {
  return { ...state, approvalDetailInfo: data.data }
}

//存储唯一标识dataid
export function SET_ONLY_FORM_DATAID(state: StoreStates, data: any) {
  return { ...state, onlyId: data.data }
}

//缓存审批执行窗口数据
export function SET_EXECUTE_FORM_DATA(state: StoreStates, data: any) {
  return { ...state, executeData: data.data }
}

//台账详情
export function SET_BUSINESS_INFO(state: StoreStates, data: any) {
  return { ...state, businessInfo: data.data }
}

//刷新审批详情
export function SET_GETDETAILS(state: StoreStates) {
  return { ...state, getDetails: !state.getDetails }
}

//查看附件信息的数据
export function SET_SP_VALUE(state: StoreStates, data: any) {
  return { ...state, fileInfo: data.data }
}

//查看附件信息的数据(改版)
export function SET_FILE_OFFICE_URL(state: StoreStates, data: any) {
  return { ...state, officeFileUrl: data.data }
}
//打开独立窗口查看图片(改改版)
export function SET_FILE_OBJ(state: StoreStates, data: any) {
  return { ...state, fileObj: data.data }
}

//查看附件信息office跳转页面信息
export function SEE_FILE_VALUE(state: StoreStates, data: any) {
  return { ...state, fileViewData: data.data }
}
//记录下一轮审批数据
export function SET_NEXT_APPROVAL_DATA(state: StoreStates, data: any) {
  return { ...state, nextFormDatas: data.data }
}

//触发审批id
export function SET_OPERATEAPPROVALID(state: StoreStates, data: any) {
  return { ...state, operateApprovalId: data.data }
}
//更新审批详情中传到后台表单数据
export function SET_APP_CHECK_FORM_DATA(state: StoreStates, data: any) {
  return { ...state, approvalCheckData: data.data }
}
//更新隐藏控件
export function SET_APP_HIDDEN_UUIDS(state: StoreStates, data: any) {
  return { ...state, hiddenViewList: data.data }
}
//更新审批中公式数值
export function SET_FORMULA_NUMVAL_OBJ(state: StoreStates, data: any) {
  if (data.data === '') {
    return { ...state, formulaNumvalObj: {} }
  }
  const key = data.data.key
  const value = data.data.value
  let _val = []
  if (key !== 'numvalObj') {
    _val = {
      ...state.formulaNumvalObj,
      [key]: value,
    }
  } else {
    _val = {
      ...state.formulaNumvalObj,
      ...value,
    }
  }
  return {
    ...state,
    formulaNumvalObj: _val,
  }
}
//更新审批发起时标题数据
export function SET_SEND_APPROVAL_TITLE(state: StoreStates, data: any) {
  if (data.data === '') {
    return { ...state, approvalExecuteTitleObj: {} }
  }
  const key = data.data.key
  const value = data.data.value
  return {
    ...state,
    approvalExecuteTitleObj: {
      ...state.approvalExecuteTitleObj,
      [key]: value,
    },
  }
}
//更新审批管理窗口选中tab
export function SET_SELECT_APPROVAL_TAB(state: StoreStates, data: any) {
  return { ...state, selectApprovalTab: data.data }
}

// 发起审批前调用（存储数据）
export function FIND_BY_EVENT_ID_DATA(state: StoreStates, data: any) {
  return { ...state, findByEventIdData: data.data }
}

// / 查询自定义表单流程设计配置（存储数据）
export function CUSTOM_PROVESS_SET(state: StoreStates, data: any) {
  return { ...state, customProcessSet: data.data }
}

// 是否是发起审批
export function IS_APPROVAL_SEND(state: StoreStates, data: any) {
  return { ...state, isApprovalSend: data.data }
}
// 审批附件ID集合
export function APPROVAL_File_IDS(state: StoreStates, data: any) {
  return { ...state, approvalfileIds: data.data }
}
//记录发起审批需要的数据
export function SET_SEND_APPROVAL_INFO(state: StoreStates, data: any) {
  return {
    ...state,
    sendApprovalInfo: data.data,
    nextFormDatas: null,
    onlyId: null,
    executeData: null,
    approvalExecuteTitleObj: {},
    nowFormulaInfo: {
      formulaInfo: [], //新增重复行后的公式
      newaddValues: [], //新增重复行值缓存
      tableArr: '',
      heightArr: '',
      rowNum: 0,
      tableElements: [],
    },
    elementRelationDataList: [],
  }
}
//存储当前审批公式集合
export function SET_APPROVAL_FORMULA_INFO(state: StoreStates, data: any) {
  if (data.data === null) {
    return {
      ...state,
      nowFormulaInfo: {
        formulaInfo: [], //新增重复行后的公式
        newaddValues: [], //新增重复行值缓存
        tableArr: '',
        heightArr: '',
        rowNum: 0,
        tableElements: [],
      },
    }
  }
  return { ...state, nowFormulaInfo: { ...state.nowFormulaInfo, ...data.data } }
}
//显示选择节点弹窗
export function SET_SHOW_SIGN_MODAL(state: StoreStates, data: any) {
  return { ...state, showSignModal: data.data }
}

// 当前审批窗口定位（第一次登录进入系统，在工作台待办点击审批定位tab）
export function SAVE_TYPE_APPROVAL_DATA(state: StoreStates, data: any) {
  return { ...state, saveTypeApprovalData: data.data }
}

//缓存唯一标识、冲销已选择数据saveEventFormRelationSet
export function SAVE_EVENT_FORM_RELATION_SET(state: StoreStates, data: any) {
  const _data = data.data
  return { ...state, ..._data }
}
export function SET_RAINBOW_INFORMATION(state: StoreStates, data: any) {
  return { rainbowInformation: data.data }
}
declare global {
  interface StoreStates {
    approvalCheckData: any[]
    formulaNumvalObj: any
    approvalExecuteTitleObj: any
    selectApprovalTab: string
    isApprovalSend: boolean
    findByEventIdData: any
    customProcessSet: any
    sendApprovalInfo: {
      eventId: number
      teamId: number
      teamName: any
      approvalName: string
      oldApprovalId: number
      isEdit: boolean
      uuid: string
      isMeetAdd?: boolean
      authId?: number
      spareId: number
      spareInfo: any
      isNextForm: boolean
      isNextFormDatas: any
      findByEventIdData: any
      isStartApproval: boolean
      isStartApprovalRid: any
      key: any
    }
    nowFormulaInfo: {
      formulaInfo: any[] //新增重复行后的公式
      newaddValues: any[] //新增重复行值缓存
      tableArr: string
      heightArr: string
      rowNum: number
      tableElements: any[]
    }
    showSignModal: {
      visible: boolean
      type: string
    }
    getDetails: boolean
    operateApprovalId: any
    nextFormDatas: any
    businessInfo: {
      baseFormName: string
      baseFormId: number
      orgId: number
      logo: string
      groupId: any
      type: number
    }
    executeData: any
    onlyId: number
    approvalDetailInfo: any
    createApprovalInfo: any
    localReadStatus: any
    officeFileUrl: {
      url: string
      fileName: string
    }
    fileObj: {
      companyId?: any
      fromType?: string
      dir?: string
      fileType: string
      fileList: any[]
      photoIndexKey: string
      pdfUrl: string
      imgWidthH?: any
    }
    approvalfileIds: any[]
    saveTypeApprovalData: any
    // saveEventFormRelationSet: {
    //   outBackData: any
    //   outBackIds: any
    //   elementRelationDataList: any
    //   onlyElementData: any
    // }
    outBackData: any
    outBackIds: any
    elementRelationDataList: any
    onlyElementData: any
    rainbowInformation: any
    rainbowName: any
    hiddenViewList: any[]
  }
  interface StoreActions {
    SET_APP_CHECK_FORM_DATA: string
    SET_FORMULA_NUMVAL_OBJ: string
    IS_APPROVAL_SEND: string
    SET_SELECT_APPROVAL_TAB: string
    FIND_BY_EVENT_ID_DATA: string
    CUSTOM_PROVESS_SET: string
    SET_SEND_APPROVAL_INFO: string
    SET_APPROVAL_FORMULA_INFO: string
    SET_SHOW_SIGN_MODAL: string
    SET_SEND_APPROVAL_TITLE: string
    SET_GETDETAILS: string
    SET_SP_VALUE: string
    SET_FILE_OFFICE_URL: string
    SET_FILE_OBJ: string
    SEE_FILE_VALUE: string
    SET_OPERATEAPPROVALID: string
    SET_NEXT_APPROVAL_DATA: string
    SET_BUSINESS_INFO: string
    SET_EXECUTE_FORM_DATA: string
    SET_ONLY_FORM_DATAID: string
    SET_APPROVAL_DETAIL_INFO: string
    SET_CREATE_APPROVAL_INFO: string
    SET_OUT_BACK_IDS: string
    LOCAL_READ_STATUS: string
    APPROVAL_File_IDS: string
    SAVE_TYPE_APPROVAL_DATA: string
    SAVE_EVENT_FORM_RELATION_SET: string
    SET_RAINBOW_INFORMATION: string
    SET_APP_HIDDEN_UUIDS: string
  }
}

// SET_OUT_BACK_DATA    SET_ONLY_ELEMENT_DATA  SET_ELEMENT_RELATION_DATA_LIST

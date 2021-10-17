import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Tabs, Spin, Menu, Input, message, Space, Checkbox, Radio, Tooltip, Result } from 'antd'
const { TabPane } = Tabs
import './ApprovalDetail.less'
import NoneData from '@/src/components/none-data/none-data'
import ApprovalTable from '@/src/components/approval-table/ApprovalTable'
import ApprovalWorkFlow from '@/src/components/approval-workflow/ApprovalWorkFlow'
import ApprovalList, { ApprovalListItemProps, getStatusTxtByState } from './ApprovalList'
import ApprovalRightHandle from './ApprovalRightHandle'
import * as Maths from '@/src/common/js/math'
import { ComponentToPrint } from './ComponentToPrint'
import PrintModal from '@/src/components/print-modal/PrintModal'
import Modal from 'antd/lib/modal/Modal'
import AddSignModal from './AddSignModal'
import { useSelector } from 'react-redux'
import { ipcRenderer } from 'electron'
import {
  checkModelsInfo,
  checkModelsInfoBy,
  getOnlyElement,
  getProcessData,
  useMergeState,
} from '../../approval-execute/ApprovalExecute'
import { ShareToRoomModal } from '../../workplan/WorkPlanModal'
import ChatForwardModal from '@/src/components/chat-forward-modal'
import {
  createSendApprovalListTable,
  getApprovalDetailLocal,
  updateApprovalDetail,
  insertApprovalDetail,
} from '../getData/getData'
import { reject } from 'async'
import { addCustomApprovalGetConfig, sureSelectInPerson } from '../../workdesk/getData'
import { handelReturnData } from './sendApproval'
import { deWeight } from '../../mettingManage/component/RenderUplodFile'
import { resolve } from 'path'
import { ToTabContent } from '../Approval'

//审批表单数据
export interface FormContentModelProps {
  elementId: number
  color: string
  elementPosition: string
  elementName: string
  elementValue: string
  formElementModel: FormElementModelProps
  type: string
}
export interface FormElementModelProps {
  unit: string
  businessSystemRelation: number
  approvalFormElementContentModels: any[]
  selfMade: number
  type: string
  align: number
  dateType: number
  id: number
  attribute: number
  placeholder: string
  value: string
  visible: number
  isCancel: number
  edit: number
  showName: number
  phoneTextShow: number
  totalTime: number
  length: number
  isAdd: number
  numberTransform: number
  phoneNameHidden: number
  uuId: string
  textNumber: 0
  textProperty: string
  fileTemplate: number
  name: string
  relationCount: number
  position: number
  rowNum: number
  colNum: number
  tableElements: TableElementsItemProps[]
  widthArrPx: string
  heightArr: string
  tableArr: string
  condition: string
  duplicate: string
  decimals: number
  designFormulas: string
  isDefault: number
  special: number
  isRadio: number
  copyUuid: string
  parentUuId: string
  repeatValue?: boolean
  repeatRowVal?: boolean
  normalValue?: boolean
  beInfluenceUuid?: string[]
  influenceUuid?: string[]
  elementGroupId?: number
  elementGroupParamId?: number
  leaveDateRangeType?: string
  leaveDateData?: any
  elementGroupParamName?: any
}
//审批表格数据
export interface TableElementsItemProps {
  id: number
  rowChild: number
  colChild: number
  color: string
  wide: number
  coord: string
  high: number
  formElementModel: FormElementModelProps
  newadd?: boolean
}
//审批详情数据结构
export interface ApprovalDetailProps {
  activitiProcessId: string
  id: number
  userId: number
  username: string
  profile: string
  teamId: number
  teamName: string
  ascriptionType: number
  title: string
  state: number
  spendTime: number
  time: string
  eventType: string
  infoContent: string
  infoId: any
  taskId: any
  formContentModels: FormContentModelProps[]
  phoneApprovalFormContentModels: any[]
  trailModels: any[]
  eventId: number
  eventName: string
  custom: string
  touchLogModel: { operatApprovalId: number; content: string }
  roleList: { teamName: string; roleName: string }[]
  approvalDefineUserModels: any[]
  isTemporary: number
  relationDataModelList: any
  chargeAgainstList: any
}

//审批流程图数据结构
export interface ActModelObjProps {
  moduleId: string
  childShapes: ActModelProps[]
  touchRelationEvents: string
}
export interface ActModelProps {
  approvalType: number
  childShapes: any[]
  level: string
  outgoing: { resourceId: string }[]
  properties: {
    name: string //节点名称
    conditionsequenceflow: string //流程条件
    multiinstance_collection: string //关联
    multiinstance_condition: string
    multiinstance_type: string //审批节点类型 会签或签
    multiinstance_variable: string //审批操作 加签驳回
    overrideid: string //resourceId
    usertaskkassignment: { assignment: { candidateUsers: { value: string }[] } }
  }
  noticeUsers: any //知会人集合
  relationEvent: string
  replaced: boolean
  resourceId: string //流程id
  state: number //节点状态
  stencil: { id: string } //流程中节点类型名称 StartNoneEvent等
  target: { resourceId: string }
  childrenData: any[]
}

//审批操作数据格式
interface ApprovalHandleProps {
  id: number
  currentProcessId?: string
  remark: string
  result: number
  userId: number
  userAccount: string
  formContentModels?: any[]
  atUserIds?: any[]
  files?: any[]
  relationDataModelList: any //唯一标识相关值
  temporaryId?: string
  temporaryIds?: any
  model?: {
    eventType: string
    delFunctionIds: any[] //要删除的权限id集合
    delPermissionIds: any[] //要删除的权限项id集合
    elementValue: string //拼接的字符串名称（拥有权限）
  }
  permissionModel?: {
    authType: number
    infoId: number
    permissionIds: number[]
    permissionOrgId: number[]
    functionTimeModel?: { grantType: number; grantValue: number }
    dataTimeModel?: { grantType: number; grantValue: number }
  }
}

//审批所有操作按钮
export interface ApprovalBtnsProps {
  key: string
  name: string
  visible: boolean
  disabled?: boolean
}

let triggerApprovalCustomInfo: any = {
  approvers: [],
  noticeType: 0,
  notices: [],
  approvalerNum: 1,
}

let temporaryId: any[] = []

//确定发起 按钮状态
let triggerBtnVsible = false

//设置处理审批的类型
const getHandleType = (type: string) => {
  let handleType = 1
  if (type === 'reject') {
    //拒绝
    handleType = 2
  } else if (type === 'overrule') {
    //驳回
    handleType = 4
  } else if (type === 'coordination') {
    //协同
    handleType = 3
  }
  return handleType
}

//检测表单是否有空值
export const getAllCheckVal = (infoData: any, isTrigger?: boolean) => {
  //分离表单数据和表格数据
  const tableFormData = infoData.filter((item: { type: string; elementId: any }) => item.type === 'table')
  let tableFormArr: any[] = []
  //处理后的数据拼接
  const normalFormArr = handleCheckFormData(infoData, isTrigger)
  if (tableFormData.length !== 0) {
    const realTableData = isTrigger
      ? tableFormData[0].tableElements
      : tableFormData[0].formElementModel.tableElements
    tableFormArr = handleCheckFormData(realTableData, false, true)
  }
  return {
    data: [...normalFormArr, ...tableFormArr],
  }
}

//表单值处理公共部分
const handleCheckFormData = (data: any, isTrigger?: boolean, isTable?: boolean) => {
  //处理表单值
  const formDataArr: {
    type: string
    elementId: number
    elementPosition: string
    elementName: string
    elementMark: string
    elementValue: string
    valueContent: string
  }[] = []
  data.forEach((item: { formElementModel: any; coord: any }, index: any) => {
    const handleItem = isTrigger ? item : item.formElementModel
    if (handleItem && handleItem.id) {
      let normalNullVal = ''
      let valueContent = handleItem.value
      if (
        handleItem.type === 'peoSel' ||
        handleItem.type === 'deptSel' ||
        handleItem.type === 'roleSel' ||
        handleItem.type === 'checkbox' ||
        handleItem.type === 'radio'
      ) {
        normalNullVal = '[]'
      }
      if (handleItem.type == 'peoSel') {
        const list = handleItem.value ? JSON.parse(handleItem.value) : []
        let names = ''
        $(list).each(function(i, valItem) {
          names += `${valItem.userName} `
        })
        valueContent = names.substring(0, names.lastIndexOf(' '))
      } else if (handleItem.type == 'deptSel') {
        const list = handleItem.value ? JSON.parse(handleItem.value) : []
        let names = ''
        $(list).each(function(i, valItem) {
          names += `${valItem.deptName} `
        })
        valueContent = names.substring(0, names.lastIndexOf(' '))
      } else if (handleItem.type == 'roleSel') {
        const list = handleItem.value ? JSON.parse(handleItem.value) : []
        let names = ''
        $(list).each(function(i, valItem) {
          names += `${valItem.roleName} `
        })
        valueContent = names.substring(0, names.lastIndexOf(' '))
      } else if (handleItem.type === 'checkbox') {
        const list = handleItem.value ? JSON.parse(handleItem.value) : []
        let vals = ''
        $(list).each(function(i, valItem) {
          vals += `${valItem.val} `
        })
        valueContent = vals.substring(0, vals.lastIndexOf(' '))
      } else if (handleItem.type === 'attachment') {
        let realAttch = handleItem.value ? JSON.parse(handleItem.value) : ''
        let _val = ''
        if (realAttch.length != 0) {
          $.each(realAttch, (m, n) => {
            _val += `${n.fileName} `
          })
        } else {
          realAttch = handleItem.approvalFormElementContentModels || []
          $.each(realAttch, (m, n) => {
            _val += `${n.content} `
          })
        }
        valueContent = _val.substring(0, _val.lastIndexOf(' '))
      } else if (handleItem.type === 'select' || handleItem.type === 'radio') {
        const selectArr = handleItem.value ? JSON.parse(handleItem.value) : ''
        if (selectArr.length != 0) {
          valueContent = Array.isArray(selectArr) ? selectArr[0].val : ''
        }
      }
      const plug = {
        type: isTable ? handleItem.type + '_table' : handleItem.type,
        elementId: handleItem.id || '',
        elementPosition: isTable ? 0 : handleItem.position || index,
        elementName: handleItem.name || '',
        elementMark: handleItem.condition || '',
        elementValue: handleItem.value || normalNullVal,
        valueContent: valueContent || '',
        coord: item.coord || null,
        uuId: handleItem.uuId || '',
        elementGroupParamId: handleItem.elementGroupParamId,
      }
      formDataArr.push(plug)
    }
  })
  return formDataArr
}

//提交备注
const addRemarks = (
  id: number | undefined,
  result: string,
  atUserIds?: any[],
  addFiles?: any[],
  pageUuid?: string
) => {
  const { nowUserId, nowUser, nowAccount, loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    const param: any = {
      approvalInfoId: id,
      userId: nowUserId,
      userAccount: nowAccount,
      userName: nowUser,
      remark: result,
      atUserIds: atUserIds,
      files: addFiles,
    }
    if (pageUuid) {
      param.temporaryId = pageUuid
    }
    $api
      .request('/approval/approval/addRemarks', param, {
        // headers: { loginToken: loginToken },
        // formData: true,
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(data => {
        resolve(data)
      })
      .catch(() => {
        reject()
      })
  })
}

//暂存待办
const temporaryStorage = (
  id: number | undefined,
  result: string,
  taskKey?: string,
  atUserIds?: any[],
  addFiles?: any[],
  pageUuid?: string
) => {
  const { nowUserId, nowAccount, loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    const param: any = {
      approvalInfoId: id,
      userId: nowUserId,
      userAccount: nowAccount,
      remark: result,
      resourceId: taskKey,
      atUserIds: atUserIds,
      files: addFiles,
    }
    if (pageUuid) {
      param.temporaryId = pageUuid
    }
    $api
      .request('/approval/approval/temporaryStorage', param, {
        // headers: { loginToken: loginToken },
        // formData: true,
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(data => {
        resolve(data)
      })
      .catch(() => {
        reject()
      })
  })
}

//撤回审批 id 审批id  taskId 公告审批时取infoId  eventType:审批类型
const rebackApproval = (id: number, taskId: string, eventType: string) => {
  return new Promise<void>((resolve, reject) => {
    const { nowUserId, nowUser, loginToken } = $store.getState()
    const param = {
      approvalId: id,
      taskId: taskId,
      userId: nowUserId,
      userName: nowUser,
      state: 3,
      eventType: eventType,
    }
    $api
      .request('/approval/approval/withdrawApproval', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(() => {
        message.success('撤回成功')
        resolve()
      })
      .catch(() => {
        reject()
      })
  })
}

// 取消重新发起

const CancleSendApproval = (id: number) => {
  return new Promise<void>((resolve, reject) => {
    const { loginToken } = $store.getState()
    const param = {
      approvalId: id,
    }
    $api
      .request('/approval/approval/cancelApprovalInfoRestart', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
  })
}
//催办审批  id 审批id  teamId企业id  urgeType 催办类型
const urgeMessages = (id: number, teamId: number, urgeType: string) => {
  return new Promise<void>((resolve, reject) => {
    const { nowUser, nowUserId, loginToken } = $store.getState()
    const param = {
      approvalId: id,
      teamId: teamId,
      userId: nowUserId,
      userName: nowUser,
      urgeType: urgeType,
    }
    $api
      .request('/approval/approval/sendApprovalUrgeMessage', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(() => {
        resolve()
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询触发审批流程图
const queryStartNodeId = (eventId: number) => {
  return new Promise<ActModelObjProps>((resolve, reject) => {
    const { loginToken } = $store.getState()
    const param = {
      eventId: eventId,
    }
    $api
      .request('/approval/findByEventId', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询触发审批表单数据
const queryTriggerFormData = (eventId: number, teamId: number, resourceId: string) => {
  return new Promise<any>(resolve => {
    const { nowUserId, loginToken } = $store.getState()
    const param = {
      eventId,
      ascriptionId: teamId,
      userId: nowUserId,
      resourceId,
    }
    $api
      .request('/approval/approval/findPhoneApprovalForm', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}
//查询审批详情
const getApprovalDetail = (id: number, taskKey: string, name?: string) => {
  return new Promise<ApprovalDetailProps>((resolve, reject) => {
    const { nowUserId, loginToken } = $store.getState()
    let version = ''
    const headers: any = { loginToken: loginToken }
    const localParam: any = { approvalId: id, userId: nowUserId }
    getApprovalDetailLocal(localParam).then(localRes => {
      if (localRes) {
        version = localRes.cacheVersion
      }
      if (version !== '') {
        headers.cacheVersion = version
      }
      const param = {
        id: id,
        userId: name === 'waitApproval' ? -1 : nowUserId,
        isCopy: 0,
        noticeId: '',
        uid: nowUserId,
        temporaryUserId: nowUserId,
        resourceId: taskKey,
      }
      $api
        .request('/approval/approval/findApprovalById', param, {
          headers: headers,
          formData: true,
        })
        .then(async resData => {
          //清空store缓存
          // $store.dispatch({ type: 'SET_FORMULA_NUMVAL_OBJ', data: '' })
          let approvalData = resData.data
          if (resData.returnCode === 1941) {
            approvalData = JSON.parse(localRes.data)
          } else {
            localParam.data = resData.data
            localParam.version = resData.data.version

            if (localRes == undefined) {
              insertApprovalDetail(localParam)
            } else {
              updateApprovalDetail(localParam)
            }
          }
          $store.dispatch({ type: 'IS_APPROVAL_SEND', data: false })

          $store.dispatch({ type: 'SET_APPROVAL_DETAIL_INFO', data: approvalData })
          resolve(approvalData)
          triggerBtnVsible = false
        })
        .catch(err => {
          triggerBtnVsible = false
          reject(err)
        })
    })
  })
}

// 知会我的（设置已知晓/标记全部已读）
export const setNoticeRead = (result?: string, atUserIds?: any[], addFiles?: any[], approvalId?: number) => {
  return new Promise((resolve, reject) => {
    const { nowUserId, nowAccount, nowUser, loginToken } = $store.getState()
    const param: any = {
      userId: nowUserId,
      userAccount: nowAccount,
      userName: nowUser,
      remark: result,
      atUserIds: atUserIds,
      files: addFiles,
    }
    if (approvalId) {
      // 有approvalId是单个审批已知晓（不传approvalId就是标记全部已读）
      param.approvalInfoId = approvalId
    }
    $api
      .request('approval/approval/setNoticeRead', param, {
        // headers: { loginToken: loginToken },
        // formData: true,
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(data => {
        resolve(data)
      })
      .catch(() => {
        reject()
      })
  })
}

/**
 * 查询当前人部门岗位
 */
export const findUserMainPostAndDepartment = (teamId: number) => {
  return new Promise((resolve, reject) => {
    const { nowUserId, loginToken } = $store.getState()
    const param = {
      userId: nowUserId,
      ascriptionId: teamId,
    }
    $api
      .request('/team/enterpriseUser/findUserMainPostAndDepartment', param, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询审批流程图
export const getApprovalActModel = (id: number) => {
  return new Promise<ActModelObjProps>(resolve => {
    const { loginToken } = $store.getState()
    const param = {
      approvalId: id,
    }
    $api
      .request('/approval/findApprovalingActModel', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}

//查询审批流程图
export const getBranchVarList = (id: number) => {
  return new Promise<ActModelObjProps>((resolve, reject) => {
    const { loginToken } = $store.getState()
    const param = {
      eventId: id,
    }
    $api
      .request('/approval/approval/template/find/turn/info', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.dataList)
      })
      .catch(() => {
        reject()
      })
  })
}

//查询审批流程历史节点resourceId
export const getHistroyProcess = (id: string) => {
  return new Promise<Array<string>>(resolve => {
    const { loginToken } = $store.getState()
    const param = {
      processId: id,
    }
    $api
      .request('/approval/findHistoryByProcessId', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}

//渲染发起人部门岗位
const getRoleList = (list: { teamName: string; roleName: string }[]) => {
  let roleStr = ''
  list &&
    list.map(item => {
      roleStr += item.teamName + '-' + item.roleName + '  '
    })
  return roleStr
}

//事前加签
const beforeSign = (
  value: string[],
  processId: string,
  approvalId: number,
  resourceId: string,
  remark: string,
  atUserIds: any,
  files: any,
  pageUUID: string
) => {
  return new Promise<void>((resolve, reject) => {
    const { loginToken, nowUserId } = $store.getState()
    const param: any = {
      processId,
      approvalId,
      resourceId,
      users: value,
      operationUserId: nowUserId,
      remark,
      atUserIds,
      files,
    }
    if (pageUUID) {
      param.temporaryId = pageUUID
    }
    $api
      .request('/approval/beforeSign', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
  })
}

//事后加签
const afterSign = (
  approvalId: number,
  processId: string,
  childShapes: ActModelProps[],
  userId: any,
  remark: string,
  atUserIds: any,
  files: any,
  pageUUID: string
) => {
  return new Promise<void>((resolve, reject) => {
    const { loginToken, nowUserId } = $store.getState()
    const param: any = {
      approvalId,
      processId,
      childShapes,
      userId,
      operationUserId: nowUserId,
      remark,
      atUserIds,
      files,
    }
    if (pageUUID) {
      param.temporaryId = pageUUID
    }
    $api
      .request('/approval/afterSign', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
  })
}

//查询审批详情前修改已读状态
const updateResultIsReadState = (id: any, currentTaskKey?: string) => {
  const { nowUserId, loginToken } = $store.getState()
  const param: any = {
    approvalId: id,
    userId: nowUserId,
  }
  if (currentTaskKey) {
    param.currentTaskKey = currentTaskKey
  }
  $api.request('/approval/approval/process/updateProcessResultIsReadState', param, {
    headers: { loginToken: loginToken },
    formData: true,
  })
}
/**
 * 待我审批
 */
const ApprovalDetail = ({
  name,
  selectKey,
  unReadCount,
}: {
  name: string
  selectKey: string
  unReadCount: number
}) => {
  const { nowUserId, loginToken, nowAccount } = $store.getState()
  //initState初始值
  const initStates = {
    detailTab: '0', //选中的审批详情tab 默认审批内容
    selectItem: null, //选中审批列表项数据
    getDetails: false, //是否需要查询详情
    approvalDetailData: null, //审批详情数据
    detailLoading: true, //审批详情loading
    approvalBtnGroup: [], //审批操作按钮
    childShapes: [], //审批流程图数据
    historyProcessIds: [], //审批流程历史节点集合
    showProcess: true, //是否显示流程图tab
    listUuid: selectKey, //审批列表更新标识
    authInfo: null, //权限设置信息
    disableMark: false, //是否禁用备注信息输入框
    triggerFormData: [], //触发审批详情数据
    triggerType: 0, //触发审批类型
    showUrgeModal: false, //催办弹窗是否显示
    urgeFunc: ['1'], //催办方式选择， 默认系统内通知
    urgeSureLoading: false, //确定催办loading
    showSignModal: false, //是否显示加签节点选择弹窗
    showManager: null, //是否显示指定节点责任人弹窗
    showNewApproval: false, //是否发起下一轮
    newApprovalType: 0, //发起下一轮类型
    newApprovalLoading: false, //下一轮loading
    newApprovalId: 0, //下一轮审批id
    showCancleSendModal: false, //取消重新发起弹窗是否显示
    isReback: '取消发起将删除该审批，确定取消发起该审批？',
    rebackLoading: false, //撤回loading
    allLoading: false, //整个审批详情loading(防止请求接口的时候，再去操作其他按钮)
    remark: '', //备注
    addFiles: [], //备注添加的附件
    atUserIds: [], //备注@人员集合
    isSubmit: true, //流程图是否可以点击操作按钮
    pageUUID: '',
    branchVarLists: [], //缓存条件变量
    nowCheckData: [], //缓存
  }
  const [approvalDetailState, setApprovalDetailState] = useMergeState(initStates)
  const [clearData, setClearData] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)

  useEffect(() => {
    temporaryId = []
  }, [])
  //设置要显示的按钮
  const showApprovalBtnsGroup = (
    typeName: string,
    currentTaskKey: string,
    status: number,
    isTemporary: number
  ) => {
    let showBtns: ApprovalBtnsProps[] = []
    //待我审批
    if (typeName === 'waitApproval') {
      showBtns = [
        {
          key: 'agree',
          name: '同意',
          visible: true,
        },
        {
          key: 'reject',
          name: '拒绝',
          visible: true,
        },
        {
          key: 'rollBack',
          name: '回退',
          visible: true,
        },
        {
          key: 'storage',
          name: '暂存待办',
          visible: true,
          disabled: isTemporary === 1 ? true : false,
        },
        {
          key: 'remark',
          name: '提交备注',
          visible: true,
        },
      ]
    } else if (typeName === 'mySendApproval') {
      //我发起的
      showBtns = [
        {
          key: 'reback',
          name: '撤回',
          visible: status === 0 ? true : false,
        },
        {
          key: 'urge',
          name: '催办',
          visible: status === 0 ? true : false,
        },
        {
          key: 'remark',
          name: '提交备注',
          visible: status !== 3 ? true : false,
        },
        {
          key: 'reSend',
          name: '重新发起',
          visible: status === 3 ? true : false,
        },
        {
          key: 'cancleSend',
          name: '取消发起',
          visible: status === 3 ? true : false,
        },
        {
          key: 'againSend',
          name: '再次发起',
          visible: status !== 3 ? true : false,
        },
      ]
      status === 3 && setApprovalDetailState({ disableMark: true })
    } else if (typeName === 'rejectApproval') {
      //驳回审批
      showBtns = [
        {
          key: 'restart',
          name: '重新发起',
          visible: currentTaskKey === null ? true : false,
        },
        {
          key: 'cancleSend',
          name: '取消发起',
          visible: currentTaskKey === null ? true : false,
        },
        {
          key: 'overrule',
          name: '驳回',
          visible: currentTaskKey === null ? false : true,
        },
      ]
      currentTaskKey === null && setApprovalDetailState({ disableMark: true })
    } else if (typeName === 'triggerApproval') {
      //触发审批
      showBtns = [
        {
          key: 'sureSendApp',
          name: '确定发起',
          visible: currentTaskKey === null && status === 7 ? true : false,
        },
        {
          key: 'reSend',
          name: '重新发起',
          visible: currentTaskKey === null && status === 4 ? true : false,
        },
        {
          key: 'cancleSend',
          name: '取消发起',
          visible: currentTaskKey === null ? true : false,
        },
      ]
      currentTaskKey === null && setApprovalDetailState({ disableMark: true })
    } else if (typeName === 'noticeMeApproval') {
      showBtns = [
        {
          key: 'isKnown',
          name: '我已知晓',
          visible: approvalDetailState.selectItem?.isRead === 1 ? false : true,
        },
        {
          key: 'remark',
          name: '提交备注',
          visible: true,
        },
      ]
    } else {
      showBtns = [
        {
          key: 'remark',
          name: '提交备注',
          visible: true,
        },
      ]
    }
    return showBtns
  }

  //是否有指定责任人
  let isSelectInPerson = false
  //切换审批列表选择
  useEffect(() => {
    setApprovalDetailState({ listUuid: selectKey })
    //创建详情数据表
    createSendApprovalListTable()
  }, [selectKey])

  useEffect(() => {
    let isUnmounted = false
    if (!approvalDetailState.selectItem || isUnmounted) return
    setApprovalDetailState({
      detailLoading: true,
      nowCheckData: [],
    })
    const { id, taskKey } = approvalDetailState.selectItem
      //查询审批详情
    ;(async () => {
      getApprovalDetail(id, taskKey, name).then(async resData => {
        //查询唯一标识
        getOnlyElement(resData.id, 'approvalId')
          .then(async data => {
            //清空store缓存
            // $store.dispatch({ type: 'SET_FORMULA_NUMVAL_OBJ', data: '' })

            const outBackData = {}
            if (resData.chargeAgainstList?.length > 0) {
              for (let i = 0; i < resData.chargeAgainstList.length; i++) {
                outBackData[resData.chargeAgainstList[i].uuid] = resData.chargeAgainstList[i].dataId
              }
            }
            $store.dispatch({
              type: 'SAVE_EVENT_FORM_RELATION_SET',
              data: {
                outBackData: outBackData,
                onlyElementData: data,
                elementRelationDataList: resData.relationDataModelList,
              },
            })

            //处理传到后台表单数据
            if (resData.eventType === 'others' && resData) {
              const checkData = getAllCheckVal(resData.formContentModels).data
              setApprovalDetailState({
                nowCheckData: checkData,
              })
              $store.dispatch({ type: 'SET_APP_CHECK_FORM_DATA', data: checkData })
            }
            const isTemporary = resData.isTemporary
            //设置按钮展示
            let normalBtns = await showApprovalBtnsGroup(
              name,
              approvalDetailState.selectItem.taskKey,
              resData.state,
              isTemporary
            )
            //添加/修改指定责任人
            if (
              resData.approvalDefineUserModels.length !== 0 &&
              (name === 'waitApproval' || name === 'approvaledList')
            ) {
              isSelectInPerson = true
              normalBtns = [
                {
                  key: 'nextManager',
                  name: name === 'waitApproval' ? '指定节点责任人' : '修改节点责任人',
                  visible: true,
                },
                {
                  key: 'remark',
                  name: '提交备注',
                  visible: true,
                },
              ]
            } else {
              isSelectInPerson = false
            }
            //普通审批是否查询流程图
            if (name !== 'triggerApproval') {
              if (resData.activitiProcessId !== null && resData.activitiProcessId.length !== 0) {
                //查询流程历史节点
                const historyProcess = await getHistroyProcess(resData.activitiProcessId)
                setApprovalDetailState({
                  historyProcessIds: historyProcess,
                  showProcess: true,
                })
                //查询审批流程图
                await getApprovalActModel(id).then(resData => {
                  //找到可能加签的节点
                  resData.childShapes.map(item => {
                    const variable = item.properties.multiinstance_variable
                    if (
                      item.childShapes.length === 0 &&
                      (variable === 'addSign' || variable === 'both') &&
                      name === 'waitApproval' &&
                      item.resourceId === taskKey &&
                      !isSelectInPerson
                    ) {
                      normalBtns = [
                        ...normalBtns,
                        {
                          key: 'apostille',
                          name: '加签',
                          visible: true,
                        },
                      ]
                    }
                    // 回退按钮
                    if (
                      name === 'waitApproval' &&
                      item.resourceId === taskKey &&
                      (variable === 'reject' || variable === 'both') &&
                      !isSelectInPerson
                    ) {
                      normalBtns = [
                        ...normalBtns,
                        {
                          key: 'rollBack',
                          name: '回退',
                          visible: true,
                        },
                      ]
                    }
                    //驳回按钮权限
                    if (
                      name !== 'rejectApproval' &&
                      item.resourceId === taskKey &&
                      (variable === 'reject' || variable === 'both') &&
                      !isSelectInPerson
                    ) {
                      // normalBtns = [
                      //   ...normalBtns,
                      //   {
                      //     key: 'overrule',
                      //     name: '驳回',
                      //     visible: true,
                      //   },
                      // ]
                    }
                    //协同按钮
                    if (name === 'waitApproval' && item.resourceId === taskKey && item.approvalType === 1) {
                      normalBtns = [
                        {
                          key: 'storage',
                          name: '暂存待办',
                          visible: true,
                          disabled: isTemporary === 1 ? true : false,
                        },
                        {
                          key: 'coordination',
                          name: '协同',
                          visible: true,
                        },
                        {
                          key: 'remark',
                          name: '提交备注',
                          visible: true,
                        },
                      ]
                    }
                  })
                  setApprovalDetailState({
                    childShapes: resData.childShapes,
                  })
                })
              } else {
                setApprovalDetailState({
                  showProcess: false,
                })
              }
            } else {
              //获取分支条件变量
              await getBranchVarList(resData.eventId).then((res: any) => {
                setApprovalDetailState({
                  branchVarLists: res,
                })
              })
              //流程开始节点
              let startNodeId = ''
              let isOff = false
              //请求触发审批的流程图
              await queryStartNodeId(resData.eventId)
                .then((res: any) => {
                  const nowData = res.data
                  if (nowData && nowData.childShapes.length !== 0) {
                    startNodeId = nowData.childShapes.filter(
                      (item: { stencil: { id: string } }) => item.stencil.id === 'StartNoneEvent'
                    )[0].resourceId
                    setApprovalDetailState({
                      childShapes: nowData.childShapes,
                      triggerType: 1,
                      showProcess: true,
                    })
                  } else {
                    setApprovalDetailState({
                      triggerType: 0,
                      showProcess: false,
                    })
                  }
                })
                .catch(err => {
                  if (err.returnCode === 10097) {
                    // 表单不存在，不支持发起
                    isOff = true
                  }
                  // else if(err.returnCode===10098){
                  //   // 表单已关闭，不支持发起
                  // }

                  normalBtns = [
                    {
                      key: 'cancleSend',
                      name: '取消发起',
                      visible: true,
                    },
                  ]

                  message.error(err.returnMessage)
                })
              if (isOff) {
                CancleSendApproval(id)
                  .then(() => {
                    //更新审批列表
                    setApprovalDetailState({
                      listUuid: Maths.uuid(),
                    })
                    ipcRenderer.send('refresh_approval_count')
                  })
                  .catch(err => {
                    message.error(err.returnMessage)
                    setApprovalDetailState({
                      showCancleSendModal: false,
                    })
                  })
                  .finally(() => {
                    setApprovalDetailState({
                      showCancleSendModal: false,
                    })
                  })
                return false
              }
              //查询唯一标识
              // await getOnlyElement(resData.eventId, 'eventId')
              //   .then(data => {
              //   })
              //   .catch(() => {
              //     message.info('查询唯一标识数据失败')
              //   })
              // await getOnlyElement(resData.eventId, 'eventId')
              //   .then(data => {
              //   })
              //   .catch(() => {
              //     message.info('查询唯一标识数据失败')
              //   })
              //请求触发审批模块的表单数据
              // 触发查 驳回不查findPhoneApprovalForm
              if (resData.state === 7) {
                await queryTriggerFormData(resData.eventId, resData.teamId, startNodeId).then(nowData => {
                  const checkInfo = getAllCheckVal(nowData.approvalFormElementModels, true).data
                  setApprovalDetailState({
                    triggerFormData: nowData.approvalFormElementModels,
                    nowCheckData: checkInfo,
                  })
                  $store.dispatch({ type: 'SET_APP_CHECK_FORM_DATA', data: checkInfo })
                  //设置审批表单数据
                  $store.dispatch({ type: 'SET_EXECUTE_FORM_DATA', data: nowData })
                  triggerBtnVsible = false
                })
                await addCustomApprovalGetConfig({
                  id: resData.eventId,
                  userId: nowUserId,
                })
                  .then((returnData: any) => {
                    const newObj = handelReturnData(returnData.data)
                    $store.dispatch({ type: 'CUSTOM_PROVESS_SET', data: newObj })
                  })
                  .catch(returnErr => {
                    message.error(returnErr.returnMessage)
                  })
              }
              if (resData.state === 4) {
                setApprovalDetailState({
                  triggerFormData: [],
                })
              }
            }
            setApprovalDetailState({
              approvalBtnGroup: normalBtns,
              approvalDetailData: resData,
            })
          })
          .catch(res => {
            setApprovalDetailState({
              approvalDetailData: null,
            })
            // 表单被删除默认掉一次取消发起审批
            if (res.returnCode === 10099) {
              CancleSendApproval(id)
                .then(() => {
                  //更新审批列表
                  setApprovalDetailState({
                    listUuid: Maths.uuid(),
                  })
                  ipcRenderer.send('refresh_approval_count')
                })
                .catch(err => {
                  message.error(err.returnMessage)
                  setApprovalDetailState({
                    showCancleSendModal: false,
                  })
                })
                .finally(() => {
                  setApprovalDetailState({
                    showCancleSendModal: false,
                  })
                })
            }
            message.error(res.returnMessage)
          })
          .finally(() => {
            setApprovalDetailState({
              detailLoading: false,
              allLoading: false,
            })
          })
          .catch(() => {
            message.info('查询唯一标识数据失败')
            setApprovalDetailState({
              detailLoading: false,
              allLoading: false,
            })
          })
      })
    })()
    return () => {
      isUnmounted = true
    }
  }, [approvalDetailState.getDetails])

  //局部刷新审批详情
  const refreshDetail = useSelector((store: StoreStates) => store.getDetails)
  useEffect(() => {
    if (approvalDetailState.selectItem) {
      const { id, taskKey } = approvalDetailState.selectItem
      getApprovalDetail(id, taskKey, name).then(resData => {
        setApprovalDetailState({
          approvalDetailData: resData,
          detailLoading: false,
        })
      })
    }
  }, [refreshDetail])

  //审批列表点击事件
  const approvalItemClick = (item: ApprovalListItemProps | null, isSend?: boolean) => {
    //我发起的撤回不触发列表详情loading更新
    //清空store缓存
    // $store.dispatch({ type: 'SET_FORMULA_NUMVAL_OBJ', data: '' })
    if (isSend) {
      setApprovalDetailState({ selectItem: item })
      return
    }
    setApprovalDetailState({
      detailTab: '0',
    })
    if (item) {
      setApprovalDetailState({
        selectItem: item,
        getDetails: !approvalDetailState.getDetails,
      })
      //修改审批状态已读
      updateResultIsReadState(item?.id, item?.taskKey)
    } else {
      setApprovalDetailState({
        detailLoading: false,
        approvalDetailData: null,
      })
    }
  }

  //审批详情tab切换
  const changeApprovalDetailKey = async (key: string) => {
    if (key === '1') {
      //获取分支条件变量
      const branchVarList = await getBranchVarList(approvalDetailState.approvalDetailData.eventId)
      setApprovalDetailState({
        branchVarLists: branchVarList,
      })
    }
    setApprovalDetailState({
      detailTab: key,
    })
  }

  //处理审批请求接口 同意 拒绝
  const operationApproval = (param: any, isCustom: boolean) => {
    setClearData(false)
    return new Promise<any>((resolve, reject) => {
      const url = isCustom
        ? '/approval/approval/operationApproval'
        : '/approval/approval/operationActivitiApproval'
      //处理审批请求接口
      $api
        .request(url, param, {
          headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        })
        .then(resData => {
          isCustom ? resolve(resData.data) : resolve(resData.dataList)
          //有返回值的时候进行内容清空操作
          setClearData(true)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  //处理审批 type操作按钮类型  result 备注内容
  const handleApproval = (
    type: string,
    result: string,
    atUserIds?: any[],
    addFiles?: any[],
    pageUuid?: string
  ) => {
    //表单类型
    const approvalEventType = approvalDetailState.approvalDetailData?.eventType

    //是自定义流程还是固定流程
    const isCustomProcess = approvalDetailState.approvalDetailData?.activitiProcessId === null
    //处理类型
    const handelType = getHandleType(type)
    //检测必填项
    const { elementRelationDataList } = $store.getState()

    const localReadStatus = $store.getState().localReadStatus

    //处理审批
    if (
      approvalDetailState.approvalDetailData &&
      (type === 'agree' || type === 'reject' || type === 'coordination')
    ) {
      const param: ApprovalHandleProps = {
        id: approvalDetailState.approvalDetailData.id,
        currentProcessId: approvalDetailState.selectItem?.currentProcess,
        remark: result,
        result: handelType,
        userId: nowUserId,
        userAccount: nowAccount,
        atUserIds: atUserIds,
        files: addFiles,
        relationDataModelList: elementRelationDataList, //唯一标识相关值
        temporaryId: pageUuid || '',
      }
      if (type !== 'reject') {
        //判断必填
        const formDatas = checkModelsInfo()
        if (!formDatas.bool) {
          return
        }
      }
      //同意操作
      if (type === 'agree') {
        if (approvalEventType === 'my_permission') {
          param.model = {
            eventType: approvalEventType,
            delFunctionIds: [],
            delPermissionIds: [],
            elementValue: '',
          }
        }
      } else if (type === 'reject' || type === 'coordination') {
        if (result === '' && atUserIds?.length == 0 && addFiles?.length == 0) {
          message.error(type === 'coordination' ? '请填写备注' : '请填写拒绝理由')
          return
        }
      }

      //关闭右下角
      ipcRenderer.send('handle_messages_option', ['', '', ''])
      if (approvalEventType === 'others') {
        const { approvalCheckData } = $store.getState()
        param.formContentModels = approvalCheckData.map(
          (item: {
            type: any
            elementId: any
            elementPosition: any
            elementName: any
            elementMark: any
            elementValue: any
            valueContent: any
          }) => {
            return {
              type: item.type,
              elementId: item.elementId,
              elementPosition: item.elementPosition,
              elementName: item.elementName,
              elementMark: item.elementMark,
              elementValue: item.elementValue,
              valueContent: item.valueContent,
            }
          }
        )
      }
      if (approvalEventType === 'my_permission' || approvalEventType === 'role_authorization') {
        const infoId = approvalDetailState.authInfo.info.split(':::')[1]
        param.permissionModel = {
          authType: approvalEventType === 'my_permission' ? 0 : 1,
          infoId: parseInt(infoId),
          permissionIds: getPermissionId(approvalDetailState.authInfo.authorityModel.addPermission),
          permissionOrgId: getPermissionId(approvalDetailState.authInfo.authorityModel.addDataPermissions),
          functionTimeModel: approvalDetailState.authInfo.authorityModel.functionTimeModel,
          dataTimeModel: approvalDetailState.authInfo.authorityModel.dataTimeModel,
        }
      }
      setApprovalDetailState({
        allLoading: true,
      })
      //处理审批

      if (type === 'agree' && !approvalDetailState.isSubmit) {
        message.error('请完善必填项')
        setApprovalDetailState({
          allLoading: false,
        })
        return false
      }
      if (temporaryId.length > 0) {
        const newTemporaryId = Array.from(new Set(temporaryId))
        param.temporaryIds = newTemporaryId
      }
      operationApproval(param, isCustomProcess)
        .then(data => {
          if (isCustomProcess && data !== null && data.length !== 0) {
            setApprovalDetailState({
              showNewApproval: true,
              newApprovalId: data,
            })
          } else if (!isCustomProcess && data !== null && data.length !== 0) {
            setApprovalDetailState({
              showManager: { userModels: data },
            })
          } else {
            //更新审批列表
            ipcRenderer.send('refresh_approval_count')
          }
          //刷新工作台侧边栏统计数量
          ipcRenderer.send('update_unread_num', ['approve_count'])
        })
        .catch(err => {
          message.error(err.returnMessage)
          setApprovalDetailState({
            allLoading: false,
          })
        })
        .finally(() => {
          setApprovalDetailState({
            allLoading: false,
            isSubmit: true,
          })
        })
    }
    //驳回
    if (type === 'overrule') {
      if (result === '' && atUserIds?.length == 0 && addFiles?.length == 0) {
        message.error('请填写驳回理由')
        return
      }
      const { nowUser, nowUserId, loginToken } = $store.getState()
      const param = {
        currentTaskKey: approvalDetailState.selectItem.taskKey,
        currentTaskId: approvalDetailState.selectItem.taskId,
        approvalId: approvalDetailState.approvalDetailData.id,
        remark: result,
        userId: nowUserId,
        userName: nowUser,
        atUserIds: atUserIds,
        files: addFiles,
        temporaryId: pageUuid || '',
      }
      setApprovalDetailState({
        allLoading: true,
      })
      $api
        .request('/approval/approval/rejectApproval', param, {
          // headers: { loginToken: loginToken },
          // formData: true,
          headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        })
        .then(() => {
          //更新审批列表
          setApprovalDetailState({
            listUuid: Maths.uuid(),
            allLoading: false,
          })
          ipcRenderer.send('refresh_approval_count')
          //刷新工作台侧边栏统计数量
          ipcRenderer.send('update_unread_num', ['approve_count'])
        })
        .catch(err => {
          message.error(err.returnMessage)
          setApprovalDetailState({
            allLoading: false,
          })
        })
        .finally(() => {
          setApprovalDetailState({
            allLoading: false,
          })
        })
    }
    //提交备注
    if (type === 'remark') {
      if (result === '' && atUserIds?.length == 0 && addFiles?.length == 0) {
        message.error('请填写备注信息!')
        return
      }
      //添加备注接口
      setApprovalDetailState({
        allLoading: true,
      })
      addRemarks(approvalDetailState.approvalDetailData?.id, result, atUserIds, addFiles, pageUuid)
        .then(() => {
          message.success('提交成功！')
          ipcRenderer.send('refresh_approval_handleFile')
          //更新详情
          $store.dispatch({ type: 'SET_GETDETAILS', data: '' })
          setApprovalDetailState({
            allLoading: false,
          })
        })
        .catch(() => {
          ipcRenderer.send('refresh_approval_handleFile')
          setApprovalDetailState({
            allLoading: false,
          })
          //刷新工作台侧边栏统计数量
          ipcRenderer.send('update_unread_num', ['approve_count'])
        })
        .finally(() => {
          ipcRenderer.send('refresh_approval_handleFile')
          ipcRenderer.send('clear_inp_val') //添加备注后，清空输入框（防止第一次按@不出现组织架构）
          setApprovalDetailState({
            allLoading: false,
          })
        })
    }
    //处理暂存待办
    if (type === 'storage') {
      if (result === '' && atUserIds?.length == 0 && addFiles?.length == 0) {
        message.error('请填写备注信息!')
        return
      }
      setApprovalDetailState({
        allLoading: true,
      })
      //暂存待办接口
      temporaryStorage(
        approvalDetailState.approvalDetailData?.id,
        result,
        approvalDetailState.selectItem?.taskKey,
        atUserIds,
        addFiles,
        pageUuid
      )
        .then(() => {
          message.success('操作成功！')
          //更新审批列表
          setApprovalDetailState({
            allLoading: false,
          })
          ipcRenderer.send('refresh_approval_count')
          //刷新工作台侧边栏统计数量

          ipcRenderer.send('update_unread_num', ['approve_count'])
        })
        .catch(() => {
          message.error('操作失败，请重试')
          setApprovalDetailState({
            allLoading: false,
          })
        })
        .finally(() => {
          setApprovalDetailState({
            allLoading: false,
          })
        })
    }
    //撤回审批
    if (type === 'reback' && approvalDetailState.approvalDetailData) {
      setApprovalDetailState({
        showCancleSendModal: true,
        isReback: true,
      })
    }
    //催办审批
    if (type === 'urge') {
      setApprovalDetailState({ showUrgeModal: true })
    }
    // 撤回重新发起
    if (type === 'reSend') {
      getProcessData(approvalDetailState.approvalDetailData?.eventId)
        .then(async (res: any) => {
          console.log(res)
          if (res.returnCode === 0) {
            if (res.data == null) {
              addCustomApprovalGetConfig({
                id: approvalDetailState.approvalDetailData?.eventId,
                userId: nowUserId,
              })
                .then((returnData: any) => {
                  const newObj = handelReturnData(returnData.data)
                  $store.dispatch({ type: 'CUSTOM_PROVESS_SET', data: newObj })
                })
                .catch(returnErr => {
                  message.error(returnErr.returnMessage)
                })
            }
            //重新发起
            const { eventId, teamId, teamName, title, id, eventName } = approvalDetailState.approvalDetailData
            console.log(approvalDetailState.approvalDetailData)
            $store.dispatch({ type: 'FIND_BY_EVENT_ID_DATA', data: res.data })
            await $store.dispatch({
              type: 'SET_SEND_APPROVAL_INFO',
              data: {
                eventId,
                teamId,
                teamName,
                approvalName: eventName,
                isEdit: true,
                uuid: Maths.uuid(),
                oldApprovalId: id,
                isNextForm: false,
                isNextFormDatas: null,
                findByEventIdData: res.data,
              },
            })
            $tools.createWindow('ApprovalExecute')
            console.log($tools.createWindow('ApprovalExecute'))
            $store.dispatch({ type: 'IS_APPROVAL_SEND', data: true })
            //刷新工作台侧边栏统计数量
            ipcRenderer.send('update_unread_num', ['approve_count'])
          } else {
            message.error('表单已不存在，不支持重新发起')
          }
        })
        .catch(err => {
          message.error(err.returnMessage)
        })
    }
    //再次发起
    if (type === 'againSend') {
      getProcessData(approvalDetailState.approvalDetailData?.eventId)
        .then(async (res: any) => {
          if (res.returnCode === 0) {
            if (res.data == null) {
              addCustomApprovalGetConfig({
                id: approvalDetailState.approvalDetailData?.eventId,
                userId: nowUserId,
              })
                .then((returnData: any) => {
                  const newObj = handelReturnData(returnData.data)
                  $store.dispatch({ type: 'CUSTOM_PROVESS_SET', data: newObj })
                })
                .catch(returnErr => {
                  message.error(returnErr.returnMessage)
                })
            }
            //重新发起
            const { eventId, teamId, teamName, title, id, eventName } = approvalDetailState.approvalDetailData
            $store.dispatch({ type: 'FIND_BY_EVENT_ID_DATA', data: res.data })
            await $store.dispatch({
              type: 'SET_SEND_APPROVAL_INFO',
              data: {
                eventId,
                teamId,
                teamName,
                approvalName: eventName,
                isEdit: true,
                uuid: Maths.uuid(),
                oldApprovalId: id,
                isNextForm: false,
                isNextFormDatas: null,
                findByEventIdData: res.data,
              },
            })
            $tools.createWindow('ApprovalExecute')
            $store.dispatch({ type: 'IS_APPROVAL_SEND', data: true })
            //刷新工作台侧边栏统计数量
            ipcRenderer.send('update_unread_num', ['approve_count'])
          } else {
            message.error('表单已不存在，不支持重新发起')
          }
        })
        .catch(err => {
          message.error(err.returnMessage)
        })
    }
    // 取消撤回重新发起
    if (type === 'cancleSend') {
      setApprovalDetailState({
        showCancleSendModal: true,
        isReback: false,
      })
    }
    // 触发审批确定发起
    if (type === 'sureSendApp') {
      // addCustomApprovalGetConfig({
      //   id: approvalDetailState.approvalDetailData?.eventId,
      //   userId: nowUserId,
      // })
      //   .then((returnData: any) => {
      //     $store.dispatch({ type: 'CUSTOM_PROVESS_SET', data: returnData.data })
      sureSendTrigger()
      //刷新工作台
      ipcRenderer.send('update_unread_num', [''])
      //   })
      //   .catch(returnErr => {
      //     message.error(returnErr.returnMessage)
      //   })
    }
    //事前加签和事后加签
    if (type === 'prevapostille' || type === 'nextapostille') {
      setApprovalDetailState({ remark: result, atUserIds: atUserIds, addFiles: addFiles, pageUUID: pageUuid })
      $store.dispatch({
        type: 'SET_SHOW_SIGN_MODAL',
        data: { visible: true, type: type },
      })
    }
    // 回退至发起人和回退至上一节点审批
    if (type === 'backtoperson' || type === 'backtoprevnode') {
      if (result === '' && atUserIds?.length == 0 && addFiles?.length == 0) {
        message.error('请填写备注信息!')
        return
      }
      setIsDisabled(true)
      setApprovalDetailState({
        allLoading: true,
      })
      rollBack(
        approvalDetailState.approvalDetailData?.id,
        result,
        type === 'backtoperson' ? 5 : 4, //回退到上一步传4、回退到发起人传5
        approvalDetailState.selectItem?.taskKey,
        atUserIds,
        addFiles,
        pageUuid
      )
        .then(() => {
          message.success('操作成功！')
          //更新审批列表
          ipcRenderer.send('refresh_approval_count')
        })
        .catch(() => {
          message.error('操作失败，请重试')
          setApprovalDetailState({
            allLoading: false,
          })
        })
        .finally(() => {
          setIsDisabled(false)
          setApprovalDetailState({
            allLoading: false,
          })
        })
    }
    //指定节点责任人
    if (type === 'nextManager') {
      setApprovalDetailState({
        showManager: { userModels: approvalDetailState.approvalDetailData.approvalDefineUserModels },
      })
    }
    //重新发起
    if (type === 'restart' && approvalDetailState.approvalDetailData) {
      getProcessData(approvalDetailState.approvalDetailData?.eventId)
        .then(async (res: any) => {
          if (res.returnCode === 0) {
            const { eventId, teamId, teamName, title, id } = approvalDetailState.approvalDetailData
            $store.dispatch({
              type: 'SET_SEND_APPROVAL_INFO',
              data: {
                eventId,
                teamId,
                teamName,
                approvalName: title,
                oldApprovalId: id,
                isEdit: true,
                uuid: Maths.uuid(),
                isNextForm: false,
                isNextFormDatas: null,
                findByEventIdData: '',
              },
            })
            $store.dispatch({ type: 'SET_SELECT_APPROVAL_TAB', data: 'triggerApproval' })
            $store.dispatch({ type: 'IS_APPROVAL_SEND', data: true })
            $tools.createWindow('ApprovalExecute')
          } else {
            message.error('表单已不存在，不支持重新发起')
          }
        })
        .catch(err => {
          message.error(err.returnMessage)
        })
    }

    // 我已知晓
    if (type === 'isKnown') {
      setApprovalDetailState({
        allLoading: true,
      })
      // setNoticeRead(approvalDetailState.approvalDetailData?.id)
      setNoticeRead(result, atUserIds, addFiles, approvalDetailState.approvalDetailData?.id)
        .then(() => {
          if (localReadStatus) {
            ipcRenderer.send('refresh_approval_count')
          } else {
            //更新详情，不从第一条开始刷新
            // $store.dispatch({ type: 'SET_GETDETAILS', data: '' })
            // 更新审批列表未读状态
            ipcRenderer.send('refresh_approval_count', 'noFefreshList')
            ipcRenderer.send('change_list_item_status', {
              approvalId: approvalDetailState.approvalDetailData?.id,
            })
            // 更新按钮
            setApprovalDetailState({
              approvalBtnGroup: [
                {
                  key: 'remark',
                  name: '提交备注',
                  visible: true,
                },
              ],
            })
          }
        })
        .catch(() => {
          message.error('操作失败，请重试')
          setApprovalDetailState({
            allLoading: false,
          })
        })
        .finally(() => {
          setIsDisabled(false)
          setApprovalDetailState({
            allLoading: false,
          })
        })
    }
  }

  // 回退审批

  const rollBack = (
    id: number | undefined,
    result: string,
    resultType: number,
    taskKey?: string,
    atUserIds?: any[],
    addFiles?: any[],
    pageUuid?: string
  ) => {
    const { nowUserId, nowAccount, nowUser, loginToken } = $store.getState()
    return new Promise((resolve, reject) => {
      const param: any = {
        approvalInfoId: id,
        userId: nowUserId,
        userAccount: nowAccount,
        ueerName: nowUser,
        remark: result,
        result: resultType,
        resourceId: taskKey,
        atUserIds: atUserIds,
        files: addFiles,
      }
      if (pageUuid) {
        param.temporaryId = pageUuid
      }
      $api
        .request('approval/approval/rollBack', param, {
          headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        })
        .then(data => {
          resolve(data)
        })
        .catch(() => {
          reject()
        })
    })
  }

  //获取attachModels
  const getAttachModelsInfo = () => {
    const attachModelArr: any[] = []
    const { nowFormulaInfo } = $store.getState()
    $('#form-table')
      .find('.tableRow')
      .each((index, item) => {
        const newAddPlug: any = {
          coord: $(item).attr('data-coord'),
          elementValue: '',
          valueContent: '',
          chargeAgainstId: '',
        }
        // if (!$(item).attr('data-newadd') && Number($(item).attr('data-newadd')) === 0) {
        if (Number($(item).attr('data-newadd')) === 0 || !$(item).attr('data-newadd')) {
          newAddPlug.id = $(item).attr('data-elementid')
        } else {
          // 新增重复行才有resourceId
          newAddPlug.resourceId = $(item).attr('data-elementid')
          const uuId = $(item).attr('data-uuid')
          const values = nowFormulaInfo.newaddValues.filter(idx => idx.uuId === uuId)
          newAddPlug.elementValue = values.length > 0 ? values[0].elementValue : ''
          newAddPlug.valueContent = values.length > 0 ? values[0].valueContent : ''
          if (uuId) {
            newAddPlug.uuId = uuId
          }
          const hasDesignFormula = nowFormulaInfo.formulaInfo.filter(idx => idx.formlaId === uuId)
          if (hasDesignFormula.length > 0) {
            newAddPlug.designFormulas = JSON.stringify(hasDesignFormula[0])
          }
        }
        attachModelArr.push(newAddPlug)
      })
    return attachModelArr
  }
  //确定发起触发审批
  const sureSendTrigger = () => {
    const {
      nowUserId,
      nowAccount,
      loginToken,
      nowFormulaInfo,
      approvalCheckData,
      customProcessSet,
    } = $store.getState()
    const { elementRelationDataList } = $store.getState()
    const detailData = approvalDetailState.approvalDetailData
    const triggerType = approvalDetailState.triggerType
    const formDatas = checkModelsInfo()
    if (!formDatas.bool) {
      return
    }
    const param: any = {
      id: detailData?.id,
      approvalerNum: 0,
      approvers: [],
      noticeType: 0,
      notices: [],
      eventId: detailData?.eventId,
      baseFormDataId: '',
      teamId: detailData?.teamId,
      teamName: detailData?.teamName,
      userId: nowUserId,
      username: nowAccount, //账号
      formContentModels: approvalCheckData,
      infoContent: '',
      callBackUrl: '',
      files: [],
      title: detailData?.title || '',
      openTime: new Date().getTime(),
      relationDataModelList: elementRelationDataList, //唯一标识相关值
    }
    if (triggerType !== 1 && customProcessSet.isApprovalRequired == 0) {
      if (triggerApprovalCustomInfo.approvers.length === 0) {
        message.error('请添加审批人')
        return
      }
      //自定义审批
      param.approvalerNum = triggerApprovalCustomInfo.approvalerNum
      param.approvers = triggerApprovalCustomInfo.approvers
      param.noticeType = triggerApprovalCustomInfo.noticeType
      param.notices = triggerApprovalCustomInfo.notices
    }
    if (nowFormulaInfo.newaddValues.length !== 0) {
      param.tableAttachModel = {
        heightArr: nowFormulaInfo.heightArr,
        rowNum: nowFormulaInfo.rowNum,
        tableArr: nowFormulaInfo.tableArr,
        tableElements: getAttachModelsInfo(),
      }
    }

    if (triggerBtnVsible) {
      return
    }
    triggerBtnVsible = true

    $api
      .request('/approval/approval/addApproval', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(() => {
        message.success('发起审批成功')
        //刷新
        $('.desk-tab-nav')
          .find('.ant-tabs-tab-active')
          .click()
        //更新数字
        ipcRenderer.send('refresh_approval_count')

        // triggerBtnVsible = false
      })
      .catch(err => {
        message.error(err.returnMessage)
        triggerBtnVsible = false
      })
      .finally(() => {
        // setLoading(false)
        // triggerBtnVsible = false
      })
  }
  // 修改值后获取值
  const getChangeValueUuid = (arr: any, uid: any) => {
    let _isIn = false
    let _isId = ''
    if (typeof arr == 'string') {
      if (arr == uid) {
        _isIn = true
        _isId = arr
      }
    } else if (Array.isArray(arr)) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] == uid) {
          _isIn = true
          _isId = arr[i]
          break
        }
      }
    }

    return {
      isIn: _isIn,
      isId: _isId,
    }
  }

  //修改审批内容
  const changeTableData = (handleItem: any) => {
    const { nowFormulaInfo } = $store.getState()
    // const { data, formElementModel, contentArr } = handleItem
    const {
      data,
      formElementModel,
      contentArr,
      elementType,
      pageUuid,
      elementId,
      oldFile,
      leaveDateRange,
      leaveDateData,
    } = handleItem
    //清除指定控件的高亮提示
    for (const key in data) {
      const _areaDom = $(`.plugElementRow[data-uuid=${key}]`)
      _areaDom.removeClass('hight')
      // const newCheckData = approvalCheckData.map((item: any) => {
      //   if (item.uuId === key) {
      //     //如果是附件则需要追加
      //     if (
      //       formElementModel &&
      //       formElementModel.hasOwnProperty('type') &&
      //       !!formElementModel.type &&
      //       formElementModel.type.indexOf('attachment') > -1
      //     ) {
      //       const newValue = !!data[key] && JSON.parse(data[key])
      //       const oldValue = !!formElementModel.value ? JSON.parse(formElementModel.value) : []
      //       const handelData = [...newValue, ...oldValue]
      //       const handelStr = JSON.stringify(handelData)
      //       item.elementValue = handelStr
      //       item.valueContent = contentArr || handelStr
      //     } else {
      //       item.elementValue = data[key] || ''
      //       item.valueContent = data[key] || ''
      //     }
      //   }
      //   return item
      // })
      // $store.dispatch({ type: 'SET_APP_CHECK_FORM_DATA', data: newCheckData })
      $store.dispatch({ type: 'SET_FORMULA_NUMVAL_OBJ', data: { key: key, value: data[key] } })
    }
    const newCheckData = approvalDetailState.nowCheckData.map((item: any) => {
      if (!!item && !!item.uuId && !!data[item.uuId]) {
        if (
          formElementModel &&
          formElementModel.hasOwnProperty('type') &&
          !!formElementModel.type &&
          formElementModel.type.indexOf('attachment') > -1
        ) {
          const newValue = !!data[item.uuId] && JSON.parse(data[item.uuId])
          // const oldValue = !!formElementModel.value ? JSON.parse(formElementModel.value) : []
          const handelData = [...newValue, ...oldFile]
          const $handelData = deWeight(handelData)
          const handelStr = JSON.stringify($handelData)
          item.elementValue = handelStr
          item.valueContent = contentArr || handelStr
          item.leaveDateRangeType = leaveDateRange
          item.leaveDateData = leaveDateData
        } else {
          item.elementValue = data[item.uuId] || ''
          item.valueContent = contentArr === 'NaN' ? '' : contentArr
          item.leaveDateRangeType = leaveDateRange
          item.leaveDateData = leaveDateData
          if (!!elementType && elementType === 'numType') {
            item.valueContent = data[item.uuId] === 'NaN' ? '' : data[item.uuId]
          }
        }
      }
      //缓存附件得fileID
      const isattach = item.type === 'attachment_table' || item.type === 'attachment'
      const tempLate = isattach && pageUuid && elementId === item.uuId && !!data[item.uuId]
      if (tempLate) {
        temporaryId.push(`${pageUuid},${item.uuId}`)
      }
      return item
    })
    $store.dispatch({ type: 'SET_APP_CHECK_FORM_DATA', data: newCheckData })

    const newAddCheck = nowFormulaInfo.newaddValues.map(item => {
      const _datas = getChangeValueUuid(data, item.uuId)
      if (_datas.isIn) {
        item.elementValue = data[item.uuId] || ''
        item.valueContent = contentArr === 'NaN' ? '' : contentArr
        if (!!elementType && elementType === 'numType') {
          item.valueContent = data[item.uuId] === 'NaN' ? '' : data[item.uuId]
        }
      }
      return item
    })

    $store.dispatch({
      type: 'SET_APPROVAL_FORMULA_INFO',
      data: { newaddValues: newAddCheck },
    })
  }

  //修改权限申请内容
  const changeAuthData = (data: any) => {
    if (data) {
      setApprovalDetailState({
        authInfo: data,
      })
    }
  }

  /**
   * 选中的催办方式
   */
  const changeUrgeCheck = (checkVal: any[]) => {
    setApprovalDetailState({
      urgeFunc: checkVal,
    })
  }
  /**
   * 催办弹窗的操作
   */
  const closeUrgeModal = () => {
    setApprovalDetailState({
      showUrgeModal: false,
    })
  }
  //确定发起催办
  const sendUrgeApproval = () => {
    const urgeType = approvalDetailState.urgeFunc.length > 1 ? '2' : approvalDetailState.urgeFunc[0]
    if (!approvalDetailState.approvalDetailData) {
      return
    }
    //显示催办按钮loading
    setApprovalDetailState({ urgeSureLoading: true })
    urgeMessages(
      approvalDetailState.approvalDetailData?.id,
      approvalDetailState.approvalDetailData?.teamId,
      urgeType
    )
      .then(() => {
        message.success('催办成功')
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
      .finally(() => {
        setApprovalDetailState({
          urgeSureLoading: false,
          showUrgeModal: false,
        })
      })
  }

  /**
   * 关闭取消重新发起提示弹窗
   */
  const closeCancleSendModal = () => {
    setApprovalDetailState({
      showCancleSendModal: false,
      isReback: false,
    })
  }

  /**
   * 确定取消重新发起/撤回审批
   */
  const rebackPop = () => {
    if (approvalDetailState.isReback) {
      //确定撤回审批
      const { id, infoId, taskId, eventType } = approvalDetailState.approvalDetailData

      setApprovalDetailState({ allLoading: true, showCancleSendModal: false })
      rebackApproval(id, infoId || taskId, eventType)
        .then(() => {
          if (eventType === 'rule') {
            // 类型如果是rule，撤回成功后就刷新列表
            ipcRenderer.send('refresh_approval_count')
          } else {
            //更新审批列表状态
            ipcRenderer.send('change_list_item_status', { approvalId: id })
            //更新详情，不从第一条开始刷新
            $store.dispatch({ type: 'SET_GETDETAILS', data: '' })
          }
          // ipcRenderer.send('update_unread_num') //刷新侧边栏+代办列表+数字统计
          //更新按钮
          setApprovalDetailState({
            approvalBtnGroup: [
              {
                key: 'reSend',
                name: '重新发起',
                visible: true,
              },
              {
                key: 'cancleSend',
                name: '取消发起',
                visible: true,
              },
            ],
          })
        })
        .catch(() => {
          setApprovalDetailState({
            showCancleSendModal: false,
            allLoading: false,
          })
        })
        .finally(() => {
          setApprovalDetailState({
            showCancleSendModal: false,
            allLoading: false,
          })
        })
    } else {
      // 确定取消重新发起
      CancleSendApproval(approvalDetailState.approvalDetailData?.id)
        .then(() => {
          //更新审批列表
          setApprovalDetailState({
            listUuid: Maths.uuid(),
          })
          ipcRenderer.send('refresh_approval_count')

          message.success('取消重新发起成功')
        })
        .catch(err => {
          message.error(err.returnMessage)
          setApprovalDetailState({
            showCancleSendModal: false,
          })
        })
        .finally(() => {
          setApprovalDetailState({
            showCancleSendModal: false,
          })
        })
    }
  }

  /**
   * 指定节点责任人
   */
  const closeSelectInPerson = () => {
    setApprovalDetailState({
      showManager: null,
      listUuid: Maths.uuid(),
    })
  }
  //确定选择责任人
  const sureSelectInPersonModal = (id: number, name: string, taskKey: string) => {
    setApprovalDetailState({
      showManager: {
        ...approvalDetailState.showManager,
        loading: true,
      },
    })
    const { nowUser, nowUserId, loginToken } = $store.getState()
    const param = {
      approvalId: approvalDetailState.approvalDetailData?.id,
      taskKey: taskKey,
      userId: id,
      userName: name,
      operaterId: nowUserId,
      operaterName: nowUser,
    }
    sureSelectInPerson(param)
      .then(() => {
        message.success('添加成功')
        //更新审批列表
        setApprovalDetailState({
          listUuid: Maths.uuid(),
        })
        ipcRenderer.send('refresh_approval_count')
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
      .finally(() => {
        setApprovalDetailState({
          showManager: null,
        })
      })
  }

  //结束审批
  const executeEnd = () => {
    return new Promise<void>((resolve, reject) => {
      const param = {
        userId: nowUserId,
        userAccount: nowAccount,
        configId: approvalDetailState.newApprovalId,
        operateDescription: '',
      }
      $api
        .request('/approval/approval/finishAuthApproval', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(() => {
          resolve()
        })
        .catch(() => {
          reject()
        })
    })
  }

  //确定发起下一轮
  const sureSendNewApproval = async () => {
    setApprovalDetailState({
      newApprovalLoading: true,
    })
    if (approvalDetailState.newApprovalType === 0) {
      //结束审批
      executeEnd().then(() => {
        //更新审批列表
        setApprovalDetailState({
          showNewApproval: false,
          newApprovalLoading: false,
          listUuid: Maths.uuid(),
        })
      })
      // 刷新统计数
      ipcRenderer.send('refresh_approval_count', 'noFefreshList')
    } else {
      //发起下一轮
      const { eventId, teamId, teamName, title, id } = approvalDetailState.approvalDetailData
      $store.dispatch({ type: 'CUSTOM_PROVESS_SET', data: { isApprovalRequired: 0 } })
      const newApprovalDetail = approvalDetailState.approvalDetailData.formContentModels.map(
        (item: { formElementModel: any }) => {
          return {
            ...item.formElementModel,
          }
        }
      )
      await $store.dispatch({
        type: 'SET_SEND_APPROVAL_INFO',
        data: {
          eventId,
          teamId,
          teamName,
          approvalName: title,
          isEdit: false,
          uuid: Maths.uuid(),
          oldApprovalId: id,
          isNextForm: true,
          isNextFormDatas: {
            formData: { ...approvalDetailState.approvalDetailData, formContentModels: newApprovalDetail },
            newApprovalId: approvalDetailState.newApprovalId,
          },
        },
      })
      await $store.dispatch({
        type: 'SET_NEXT_APPROVAL_DATA',
        data: {
          formData: { ...approvalDetailState.approvalDetailData, formContentModels: newApprovalDetail },
          newApprovalId: approvalDetailState.newApprovalId,
        },
      })
      await $store.dispatch({ type: 'SET_SELECT_APPROVAL_TAB', data: 'sendApproval' })

      await getProcessData(approvalDetailState.approvalDetailData?.eventId)
        .then(async (res: any) => {
          if (res.returnCode === 0) {
            $store.dispatch({ type: 'IS_APPROVAL_SEND', data: true })
            $tools.createWindow('ApprovalExecute').finally(() => {
              //更新审批列表
              setApprovalDetailState({
                showNewApproval: false,
                newApprovalLoading: false,
                listUuid: Maths.uuid(),
              })
            })
          } else {
            message.error('表单已不存在，不支持重新发起')
          }
        })
        .catch(err => {
          message.error(err.returnMessage)
        })

      await setApprovalDetailState({
        newApprovalType: 0,
      })
    }
  }

  //发起下一轮类型修改
  const changeNewApprovalType = (e: any) => {
    setApprovalDetailState({
      newApprovalType: e.target.value,
    })
  }

  //关闭加签modal
  const closeAddSignModal = () => {
    $store.dispatch({ type: 'SET_SHOW_SIGN_MODAL', data: { visible: false, type: '' } })
  }

  //确定选择
  const sureSelectAddSign = (data: any[], type: string) => {
    if (data.length !== 0) {
      const resourceId = approvalDetailState.selectItem.taskKey
      const { id, activitiProcessId } = approvalDetailState.approvalDetailData
      const { remark, atUserIds, addFiles } = approvalDetailState

      setApprovalDetailState({
        allLoading: true,
      })
      setClearData(false)
      if (type === 'prevapostille') {
        beforeSign(
          data,
          activitiProcessId,
          id,
          resourceId,
          remark,
          atUserIds,
          addFiles,
          approvalDetailState.pageUUID
        )
          .then(() => {
            message.success('事前加签成功')
            //刷新详情
            setApprovalDetailState({
              getDetails: !approvalDetailState.getDetails,
              allLoading: false,
            })

            setClearData(true)
          })
          .catch(() => {
            message.error('事前加签失败')
            setApprovalDetailState({
              allLoading: false,
            })
          })
          .finally(() => {
            setApprovalDetailState({
              allLoading: false,
            })
          })
      } else {
        const selUserId = data[0].split('#')[1] === String(nowUserId) ? '' : data[0].split('#')[1]
        const newChildShapes = appendArr(approvalDetailState.childShapes, resourceId, data)
        afterSign(
          id,
          activitiProcessId,
          newChildShapes,
          selUserId,
          remark,
          atUserIds,
          addFiles,
          approvalDetailState.pageUUID
        )
          .then(() => {
            message.success('事后加签成功')
            //刷新详情
            setApprovalDetailState({
              getDetails: !approvalDetailState.getDetails,
              allLoading: false,
            })
            setClearData(true)
          })
          .catch(() => {
            message.error('事后加签失败')
            setApprovalDetailState({
              allLoading: false,
            })
          })
          .finally(() => {
            setApprovalDetailState({
              allLoading: false,
            })
          })
      }
    }
    $store.dispatch({ type: 'SET_SHOW_SIGN_MODAL', data: { visible: false, type: '' } })
  }

  //修改自定义选人
  const triggerCustomInfo = (customInfo: any) => {
    triggerApprovalCustomInfo = customInfo
  }
  //渲染表单
  const renderApprovalForm = useMemo(() => {
    // if (!approvalDetailState.approvalDetailData || approvalDetailState.detailTab === '1') {
    //   return null
    // }
    if (!approvalDetailState.approvalDetailData) {
      return null
    }

    return (
      <ApprovalTable
        key={approvalDetailState.approvalDetailData.id}
        dataSource={approvalDetailState.approvalDetailData}
        changeTableData={changeTableData}
        sendAuthInfo={changeAuthData}
        name={name}
        hasProcess={approvalDetailState.showProcess}
        triggerFormData={approvalDetailState.triggerFormData}
        setInfo={triggerCustomInfo}
      />
    )
  }, [approvalDetailState.approvalDetailData])

  //渲染流程图
  const renderFlowPic = useMemo(() => {
    const MathsId = Maths.uuid()
    if (approvalDetailState.childShapes.length === 0) {
      return null
    }
    const NowType = name === 'triggerApproval' && approvalDetailState.selectItem?.state == 7
    return (
      <ApprovalWorkFlow
        approvalId={approvalDetailState.selectItem.id}
        dataSource={approvalDetailState.childShapes}
        historyProcess={approvalDetailState.historyProcessIds}
        branchVarLists={approvalDetailState.branchVarLists}
        trigger={NowType}
        selectkey={MathsId}
      />
    )
  }, [
    approvalDetailState.historyProcessIds,
    approvalDetailState.childShapes,
    approvalDetailState.branchVarLists,
  ])

  //渲染详情组件
  const renderApprovalDetail = useMemo(() => {
    if (!approvalDetailState.approvalDetailData) {
      return (
        <Spin spinning={approvalDetailState.detailLoading}>
          <div className="approval-main-container">
            <NoneData />
          </div>
        </Spin>
      )
    }
    return (
      <Spin spinning={approvalDetailState.detailLoading}>
        <div className="approval-main-container">
          <div className="approval-header">
            <div className="print-share-btn flex end">
              {approvalDetailState.approvalDetailData.eventType === 'others' && (
                <>
                  <RenderPrintBtn
                    name={name}
                    dataSource={approvalDetailState.approvalDetailData}
                    triggerData={approvalDetailState.triggerFormData}
                    selectItem={approvalDetailState.selectItem}
                  />
                  {/* 屏蔽等待发起页面的分享按钮 */}
                  {name != 'triggerApproval' && (
                    <RenderShareBtn
                      approvalId={approvalDetailState.approvalDetailData.id}
                      selectItem={approvalDetailState.selectItem}
                      name={name}
                    />
                  )}
                </>
              )}
            </div>
            <div className="approval-title-name text-ellipsis">
              {approvalDetailState.approvalDetailData?.username}申请【
              {name === 'triggerApproval' && approvalDetailState.approvalDetailData?.isTouch == 1 && '【触发】'}
              {$tools.htmlDecodeByRegExp(approvalDetailState.approvalDetailData?.title)}
              {approvalDetailState.approvalDetailData.custom &&
              approvalDetailState.approvalDetailData.custom !== ''
                ? `【${approvalDetailState.approvalDetailData.custom}】`
                : ''}
              】的审批
            </div>
            <div className="approval-source">
              发起人部门-岗位：{approvalDetailState.approvalDetailData?.teamName}{' '}
              {getRoleList(approvalDetailState.approvalDetailData?.roleList)}
            </div>
            {name !== 'triggerApproval' &&
              approvalDetailState.approvalDetailData.state !== 2 &&
              approvalDetailState.approvalDetailData.state !== 1 && (
                <div
                  className="approval-status-icon"
                  style={{ color: getStatusTxtByState(approvalDetailState.approvalDetailData.state).color }}
                >
                  {getStatusTxtByState(approvalDetailState.approvalDetailData.state).txt}
                </div>
              )}
            {approvalDetailState.approvalDetailData.state === 2 && <div className="reject-img"></div>}
            {approvalDetailState.approvalDetailData.state === 1 && <div className="success-img"></div>}
          </div>
          <Tabs
            className="approval-detail-content"
            activeKey={approvalDetailState.detailTab}
            onChange={changeApprovalDetailKey}
            onTabClick={(key: string) => {
              if (key === '1') {
                const _type = checkModelsInfoBy()
                setApprovalDetailState({ isSubmit: _type.bool })
              } else if (key === '0') {
                setApprovalDetailState({ isSubmit: true })
              }
            }}
          >
            <TabPane tab={'审批内容'} key="0" className="approval-detail-pane-content">
              {renderApprovalForm}
            </TabPane>
            {approvalDetailState.showProcess && (
              <TabPane tab={'流程图'} key="1">
                {approvalDetailState.detailTab === '1' && renderFlowPic}
              </TabPane>
            )}
          </Tabs>
        </div>
      </Spin>
    )
  }, [
    approvalDetailState.approvalDetailData,
    approvalDetailState.detailTab,
    approvalDetailState.showProcess,
    approvalDetailState.detailLoading,
  ])
  return (
    <Spin spinning={approvalDetailState.allLoading}>
      <div className="send-approval-content flex">
        <ApprovalList
          unReadCount={unReadCount}
          name={name}
          activeKey={approvalDetailState.selectItem?.id}
          uuid={approvalDetailState.listUuid}
          itemClick={approvalItemClick}
        />
        <div className="main-panel flex-1">{renderApprovalDetail}</div>
        {approvalDetailState.selectItem?.id && approvalDetailState.approvalDetailData && (
          <ApprovalRightHandle
            btns={approvalDetailState.approvalBtnGroup}
            disableInput={approvalDetailState.disableMark}
            onHandle={handleApproval}
            teamId={approvalDetailState.approvalDetailData?.teamId}
            curAppId={approvalDetailState.selectItem?.id}
            clearData={clearData}
            isDisabled={isDisabled}
          />
        )}
        {/* 加签弹窗 */}
        {approvalDetailState.approvalDetailData && (
          <AddSignModal
            teamId={approvalDetailState.approvalDetailData?.teamId}
            nowApprovalId={approvalDetailState.approvalDetailData?.id}
            eventId={approvalDetailState.approvalDetailData.eventId}
            onSure={sureSelectAddSign}
            onClose={closeAddSignModal}
          />
        )}
        {/* 指定节点责任人选人 */}
        {approvalDetailState.showManager && (
          <PointManagerModal
            data={approvalDetailState.showManager.userModels}
            loading={approvalDetailState.showManager.loading}
            onClose={closeSelectInPerson}
            onSure={sureSelectInPersonModal}
          />
        )}
        {/* 发起下一轮 */}
        {approvalDetailState.showNewApproval && (
          <Modal
            className="send-newApproval-modal"
            width={378}
            visible={approvalDetailState.showNewApproval}
            closable={false}
            centered={true}
            confirmLoading={approvalDetailState.newApprovalLoading}
            onOk={sureSendNewApproval}
          >
            <p>本轮审批已结束，是否发起下一轮新审批</p>
            <Radio.Group
              defaultValue={approvalDetailState.newApprovalType}
              options={[
                { label: '谢谢！不用了', value: 0 },
                { label: '发起下一轮', value: 1 },
              ]}
              onChange={changeNewApprovalType}
            ></Radio.Group>
          </Modal>
        )}

        {/* 催办弹窗 */}
        {approvalDetailState.showUrgeModal && (
          <Modal
            className="urge-modal"
            width={400}
            visible={approvalDetailState.showUrgeModal}
            title="操作提示"
            centered={true}
            confirmLoading={approvalDetailState.urgeSureLoading}
            onCancel={closeUrgeModal}
            onOk={sendUrgeApproval}
          >
            <p>确认催办当前负责审批节点成员？</p>
            <div className="urge-check">
              <span>催办方式</span>
              <Checkbox.Group
                options={[
                  { label: '应用内提醒', value: '1' },
                  { label: '短信/邮件提醒', value: '0' },
                ]}
                defaultValue={approvalDetailState.urgeFunc}
                onChange={changeUrgeCheck}
              ></Checkbox.Group>
            </div>
          </Modal>
        )}
        {/* 取消重新发起二次弹窗 */}
        {approvalDetailState.showCancleSendModal && (
          <Modal
            className="cancleSend-modal"
            width={400}
            visible={approvalDetailState.showCancleSendModal}
            title="操作提示"
            centered={true}
            onCancel={closeCancleSendModal}
            confirmLoading={approvalDetailState.rebackLoading}
            onOk={rebackPop}
            bodyStyle={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p className="center">
              {approvalDetailState.isReback ? '确定撤回该审批？' : '取消发起将删除该审批，确定取消发起该审批？'}
            </p>
          </Modal>
        )}
      </div>
    </Spin>
  )
}

//打印按钮组件
const RenderPrintBtn = ({ name, dataSource, triggerData, selectItem }: any) => {
  const [showPrint, setShowPrint] = useState(false)
  const [printType, setPrintType] = useState('style')
  //选择打印方式
  const selectPrintType = ({ key }: { key: any }) => {
    let printTypeKey = 'style'
    if (key === '1') {
      //按表格形式打印
      printTypeKey = 'table'
    }
    setPrintType(printTypeKey)
    setShowPrint(true)
  }
  //关闭打印modal
  const cloasePrintModal = () => {
    setShowPrint(false)
  }

  return (
    <>
      <Tooltip title="打印">
        <span
          className="print-btn"
          onClick={() => {
            selectPrintType({ key: 'style' })
          }}
        ></span>
      </Tooltip>
      {showPrint && (
        <PrintModal
          onClose={cloasePrintModal}
          name={name}
          data={dataSource}
          triggerData={triggerData}
          type={printType}
          selstate={selectItem.state}
        ></PrintModal>
      )}
    </>
  )
}

//分享按钮组件
const RenderShareBtn = ({ approvalId, selectItem, name }: any) => {
  const [showShareModal, setShowShareModal] = useState(false)
  // 分享发出的内容
  const [shareCon, setShareCon] = useState<any>('')
  const { nowUserId, nowAccount, loginToken, nowUser, userInfo, selectTeamId } = $store.getState()
  //分享的title
  const shareTitle = `${
    name === 'triggerApproval' || (selectItem.isTouch && selectItem.isTouch === 1) ? '【触发】' : ''
  }
  ${selectItem.name}
  ${selectItem.custom && selectItem.custom !== '' ? `【${selectItem.custom}】` : ''}`
  //分享审批详情
  const shareApprovalDetail = () => {
    $store.dispatch({
      type: 'WORKPLAN_MODAL',
      data: {
        quoteMsg: {
          id: approvalId,
          name: shareTitle,
          type: 'approval',
          title: '审批',
          val: '',
        },
      },
    })
    const contentJson = { id: approvalId, content: shareTitle, title: '审批' }
    const con = {
      type: 6,
      messageJson: {
        type: 3,
        contentJson: JSON.stringify(contentJson),
      },
    }
    setShareCon(JSON.stringify(con))
    setShowShareModal(true)
  }
  const selectForwardChange = () => {
    setShowShareModal(false)
  }
  return (
    <>
      <Tooltip title="分享">
        <span className="share-btn" onClick={() => shareApprovalDetail()}></span>
      </Tooltip>
      {/* {showShareModal && (
        <ShareToRoomModal
          props={{
            param: {
              shareToRoomModalShow: showShareModal,
            },
            action: {
              setShareToRoomModalShow: setShowShareModal,
            },
          }}
          isclcallback={false}
          isclcallbackFn={() => {}}
        />
      )} */}
      {showShareModal && (
        <ChatForwardModal
          visible={showShareModal}
          chatMsg={shareCon}
          teamId={selectTeamId}
          onSelected={selectForwardChange}
          onCancelModal={() => {
            setShowShareModal(false)
          }}
          dataAuth={true}
          findType={0}
          permissionType={3}
          isQueryAll={1}
          pageSize={10}
          selectList={{
            nowUserId,
            nowUser,
            curType: 0,
            nowAccount,
            profile: userInfo.profile,
            disable: true,
          }}
        />
      )}
    </>
  )
}

/**
 * 处理加签后流程图数据
 */
const appendArr = (childShapes: ActModelProps[], parentId: string, selArr: string[]) => {
  const newResourceId = 'sid-' + Maths.uuid()
  const selDetailArr = selArr[0].split('#')
  const newName = '事后加签#' + selDetailArr[2]
  const newValue = selArr[0]
  //新增事后加签得线条对象
  const lineUUid = 'sid-' + Maths.uuid()
  let addSignItem: any = {}
  let newSequence: any = {}
  //如果当前节点不是第一个就纪录
  let signParnetLevel: any = null
  const newChildShapes = childShapes.map(item => {
    if (item.resourceId === parentId) {
      //修改item得childShapes   properties
      item.childShapes = ['事后加签']
      addSignItem = JSON.parse(JSON.stringify(item))
      addSignItem.properties.multiinstance_type = 'Parallel' //替换节点的type
      addSignItem.resourceId = newResourceId
      addSignItem.properties.overrideid = newResourceId
      addSignItem.properties.name = newName
      addSignItem.properties.usertaskassignment.assignment.candidateUsers = [{ value: newValue }]
      addSignItem.outgoing = item.outgoing.concat([])
      // addSignItem.properties.multiinstanceType = 'Parallel'

      newSequence = JSON.parse(
        JSON.stringify(childShapes.filter(idx => idx.resourceId === item.outgoing[0].resourceId)[0])
      )
      addSignItem.level = ''
      const childrenDataArr = [
        {
          name: '事后加签',
          // nodeType: item.properties.multiinstance_type,
          nodeType: 'Parallel',
          approvalName: selDetailArr[2],
          value: selArr[0],
          id: selDetailArr[0] + '#' + selDetailArr[1],
          resourceId: newResourceId,
          childrenData: [],
          childShapes: ['事后加签'],
          noticeUsers: [],
          outId: [],
          approvalType: item.approvalType,
          account: '',
          getPermissionId: '',
          variable: item.properties.multiinstance_variable,
        },
      ]
      // 处理事后加签
      if (item.level !== '' && item.level.split('###')[1]) {
        const childrenArr = JSON.parse(item.level.split('###')[1])
        childrenArr.unshift(childrenDataArr)
        item.level = item.level.split('###')[0] + '###' + JSON.stringify(childrenArr)
      } else if (item.level !== '' && !item.level.split('###')[1]) {
        const newChildArr = []
        newChildArr.push(childrenDataArr)
        item.level = item.level.split('###')[0] + '###' + JSON.stringify(newChildArr)
      } else if (item.level === '') {
        const parentNode = childShapes.filter(idx => idx.level && idx.level.indexOf(item.resourceId) !== -1)
        const childrenArr = JSON.parse(parentNode[0].level.split('###')[1])
        //处理添加加签节点
        const newChildArr = getNewChildArr(childrenArr, childrenDataArr, parentId)
        signParnetLevel = {
          level: parentNode[0].level.split('###')[0] + '###' + JSON.stringify(newChildArr),
          id: parentNode[0].resourceId,
        }
      }
      newSequence.resourceId = lineUUid
      newSequence.properties.overrideid = lineUUid
      newSequence.properties.conditionsequenceflow = null
      newSequence.outgoing = [{ resourceId: newResourceId }]
      newSequence.target.resourceId = newResourceId
      // 替换当前节点的multiinstance_type
      // item.properties.multiinstance_type='Parallel'
      //替换当前节点指向
      item.outgoing = [
        {
          resourceId: lineUUid,
        },
      ]

      //修改加签节点得outgoing
      return { ...item, outgoing: [{ resourceId: lineUUid }] }
    } else {
      return { ...item }
    }
  })
  if (signParnetLevel) {
    newChildShapes.map(item => {
      if (item.resourceId === signParnetLevel.id) {
        item.level = signParnetLevel.level
        return false
      }
    })
  }

  return [...newChildShapes, addSignItem, newSequence]
}

/**
 * 处理加签后数据
 */
const getNewChildArr = (childrenArr: any[], newChild: any, parentId: any) => {
  const newChildArr = childrenArr.concat([])
  childrenArr.map(item => {
    if (Array.isArray(item)) {
      item.map(idx => {
        if (idx.resourceId === parentId) {
          idx.childrenData.unshift(newChild)
          return false
        }
        if (idx.childrenData.length > 0) {
          getNewChildArr(idx.childrenData, newChild, parentId)
        }
      })
    } else {
      if (item.resourceId === parentId) {
        newChildArr.push(newChild)
        return false
      }
    }
  })
  return newChildArr
}

/**
 * 指定节点责任人弹窗
 */
export const PointManagerModal = ({
  data,
  loading,
  onClose,
  onSure,
}: {
  data: any[]
  loading?: boolean
  onClose: () => void
  onSure: (id: number, name: string, taskKey: string) => void
}) => {
  // const { taskKey, userModels } = data[0]
  let taskKey: any = '',
    userModels: any = []
  if (data && data.length > 0) {
    taskKey = data[data.length - 1].taskKey
    userModels = data[data.length - 1].userModels
  }
  const [showUser, setShowUser] = useState<any>([]) //保存当前列表展示
  const [selectUser, setSelectUser] = useState<any>({ value: 0 }) //保存当前的选中项
  useEffect(() => {
    if (userModels) {
      selectUser.value = 0
      setSelectUser({ ...selectUser })
      setShowUser(
        userModels.map((item: any) => {
          return {
            label: item.username,
            value: item.id,
            mainPost: item.mainPost, //主岗位
          }
        })
      )
    }
  }, [userModels])
  //记录选中id和name
  const selectManager = (ev: any) => {
    const getNowUser = showUser.filter((item: { value: any }) => item.value === ev.target.value)
    setSelectUser({
      ...getNowUser[0],
      value: getNowUser[0]?.value || 0,
    })
  }
  //更改输入框，筛选内容
  const onChangeSearch = (name: any) => {
    const getNowUser: any = []
    userModels.map((item: any) => {
      if (item.username.includes(name)) {
        getNowUser.push({
          label: item.username,
          value: item.id,
          mainPost: item.mainPost,
        })
      }
    })
    setShowUser(getNowUser)
  }
  return (
    <Modal
      className="selectInPerson-modal"
      title={'指定节点责任人'}
      width={400}
      visible={true}
      centered={true}
      confirmLoading={loading}
      onCancel={onClose}
      onOk={() => {
        if (!selectUser.value) {
          return message.error('请指定责任人')
        }
        onSure(selectUser.value, selectUser.label, taskKey)
      }}
    >
      <Input
        placeholder="请输入关键字"
        allowClear
        className="selectInPerson_input"
        onChange={(e: any) => {
          onChangeSearch(e.target.value)
        }}
        prefix={
          <span
            className="search-icon-boxs"
            onClick={(e: any) => {
              const name =
                $(e.target)
                  .parents('.selectInPerson_input')
                  .find('input')
                  .val() || ''
              onChangeSearch(name)
            }}
          >
            <em className="search-icon-t-btn"></em>
          </span>
        }
      />
      <Radio.Group onChange={selectManager} value={selectUser.value || 0}>
        {showUser.map((item: any, index: number) => {
          return (
            <Radio value={item.value} key={index}>
              {item.label}
              <span className="selectInPerson_main_Post">({item.mainPost})</span>
            </Radio>
          )
        })}
      </Radio.Group>
    </Modal>
  )
}

//获取权限id集合
const getPermissionId = (dataArr: any[]) => {
  if (!dataArr) {
    return []
  }
  const ids: number[] = []
  dataArr.map(item => {
    item.permissionModels.map((idx: { isChecked: number; id: number }) => {
      if (idx.isChecked === 0) {
        ids.push(idx.id)
      }
    })
  })
  return ids
}

export default ApprovalDetail

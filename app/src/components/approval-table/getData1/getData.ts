import axios from 'axios'
import { message } from 'antd'
import { ipcRenderer } from 'electron'
const protocol = process.env.API_PROTOCOL
const host = process.env.API_HOST

//查询表单号表格数据
export const getOutBackData = (eventId: number, uniqueTagModel: any, baseFormDataId: any, uuid: string) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken, approvalDetailInfo, isApprovalSend } = $store.getState()
    const param: any = {
      eventId: eventId,
      baseFormDataId: baseFormDataId,
      uniqueTagModel,
      uuid: uuid,
    }

    if (approvalDetailInfo && !isApprovalSend) {
      param.approvalId = approvalDetailInfo.id
    }

    $mainApi
      .request('/approval/approval/baseForm/findOutBackElementValue', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询唯一标识表格数据
export const getOnlyTableData = (eventId: number, uniqueTagModel: any, _uuid: any, pageNo?: number) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken, approvalDetailInfo, isApprovalSend, sendApprovalInfo } = $store.getState()

    const param: any = {
      eventId: eventId,
      isFindOnly: 0,
      pageNo: pageNo || 0,
      pageSize: 20,
      uniqueTagModel,
      uuid: _uuid,
    }
    if (
      (approvalDetailInfo && !isApprovalSend) ||
      (sendApprovalInfo && sendApprovalInfo.isEdit && sendApprovalInfo.oldApprovalId)
    ) {
      param.approvalId = approvalDetailInfo.id || sendApprovalInfo.oldApprovalId
    }
    $mainApi
      .request('/approval/approval/baseForm/findBaseElementValue', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询自定义表单
export const queryPhoneApprovalForm = (startNodeId?: string) => {
  return new Promise<any>(resolve => {
    const { sendApprovalInfo, nowUserId, loginToken } = $store.getState()
    const param: any = {
      eventId: sendApprovalInfo.eventId,
      ascriptionId: sendApprovalInfo.teamId,
      userId: nowUserId,
      resourceId: startNodeId,
    }
    sendApprovalInfo.isEdit ? (param.restartApprovalId = sendApprovalInfo.oldApprovalId) : ''
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

/**
 * 查询唯一标识数据
 * @param id 审批id
 * @param eventId 表单id
 * @param type 判断当前传的是审批id还是表单id
 */
export const getOnlyElement = (id: number, type: string) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken, sendApprovalInfo } = $store.getState()
    let param: any = {}
    if (type === 'eventId') {
      param.eventId = id
    } else {
      param.id = id
    }
    sendApprovalInfo.isEdit && type === 'eventId' ? (param.id = sendApprovalInfo.oldApprovalId) : ''
    $api
      .request('/approval/approval/findEventFormRelationSet', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.dataList)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//获取formelementuuid
export const getFormElementUuid = (arr: any[], uuid: string) => {
  let elementUuid = ''
  arr.map(item => {
    if (item.uuid === uuid) {
      elementUuid = item.formElementUuid
      return false
    }
  })
  return elementUuid
}

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
    const param: any = {}
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

//查询外部数据
export const getSelectOuterData = (eventId: number, teamId: number, uuid: string, elementType: string) => {
  return new Promise<any>((resolve, reject) => {
    const { nowAccount, loginToken } = $store.getState()
    const param = {
      eventId,
      teamId,
      userAccount: nowAccount,
      uuid,
      elementType,
    }
    $api
      .request('/approval/businessSystem/outerSystemData', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data.outSystemJsonModels)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//回复审批评论
export const commitComment = (param: any) => {
  return new Promise<void>((resolve, reject) => {
    const { loginToken } = $store.getState()
    $mainApi
      .request('/public/comment/addCommentMessage', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(() => {
        resolve()
      })
      .catch(err => {
        reject(err)
      })
  })
}

//会议详情
interface MeetingDetailProps {
  name: string
  meetingRoomName: string
  startTime: string
  endTime: string
  teamName: string
  originator: string
  status: number
  subjects: {
    id: number
    topic: string
    goal: string
    users: { deptName: string; postName: string; username: string }[]
  }[]
  joinUsers: { deptName: string; postName: string; username: string }[]
  meetingFileModels: any[]
  overTime: string
}

/**
 * 查询会议详情
 */
export const getMeetingDetail = (meetId: number) => {
  const { nowUserId, loginToken } = $store.getState()
  return new Promise<MeetingDetailProps>(resolve => {
    const param = {
      meetingId: meetId,
      userId: nowUserId,
      type: 0, //0 收到得会议详情
    }
    $mainApi
      .request('/public/meeting/info', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}

//权限详情
interface AuthCallBackProps {
  type: number
  authId: number
  name: string
  typeName: string
  info: string
  callBackUrl: string
  authorityModel: {
    addPermission: {
      functionName: string
      permissionModels: { id: number; permissionName: string; isChecked: number }[]
    }[]
    delPermission: {
      functionName: string
      permissionModels: { id: number; permissionName: string; isChecked: number }[]
    }[]
    addDataPermissions: {
      functionName: string
      permissionModels: { id: number; permissionName: string; isChecked: number }[]
    }[]
    delDataPermissions: {
      functionName: string
      permissionModels: { id: number; permissionName: string; isChecked: number }[]
    }[]
    dataTimeModel: {
      grantType: number
      grantValue: number
    }
    functionTimeModel: {
      grantType: number
      grantValue: number
    }
  }
}
/**
 * 查询权限数据范围
 */
export const getAuthCallBack = (type: number, id: number, teamId: number, account?: string) => {
  const { loginToken } = $store.getState()
  return new Promise<AuthCallBackProps>(resolve => {
    const param = {
      authInfoId: id,
      teamId: teamId,
      type: type,
      account: account,
    }
    $mainApi
      .request('/team/permission/info/callback', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}

//审批公告详情
interface NoticeDetailProps {
  id: number
  name: string
  content: string
  userId: number
  username: string
  userProfile: string
  type: number
  isDiscuss: number
  groupName: string
  time: string
  relationModels: { id: number; type: number; typeId: number; typeName: string; includeChild: number }[] //发布范围
  fileModels: any[]
  fileReturnModels: any[]
  belongName: string
}

//查询审批公告详情
export const getNoticeDetailById = (id: number) => {
  const { loginToken, nowUserId } = $store.getState()
  return new Promise<NoticeDetailProps>(resolve => {
    const param = {
      id: id,
      userId: nowUserId,
    }
    $mainApi
      .request('/team/notice/queryById', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}

//获取关联值
export const getElementValue = (item: any) => {
  let val = ''
  if (item.type === 'peoSel') {
    val = JSON.parse(item.elementValue)[0].account
  } else if (item.type === 'select') {
    val = JSON.stringify(item.leaveDateData)
  } else if (item.type === 'leaveDateRange') {
    val = item.elementValue
  }
  return val
}

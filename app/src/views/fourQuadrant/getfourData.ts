import { message } from 'antd'
//查询目标任务
export const getMainData = (
  getTreeMainId: any,
  id: any,
  typeid: any,
  pageSize: number,
  pageId: any,
  startTime: string,
  endTime: string,
  status?: number,
  planStateArr?: string
) => {
  const { nowUserId, loginToken } = $store.getState()
  return new Promise(resolve => {
    const params = {
      mainId: getTreeMainId, //根节点id
      id: id,
      operateUser: nowUserId,
      level: '',
      hasOther: '1', //是否查询其他 0否 1是
      typeId: typeid,
      hasSelf: 1, //是否查询当前任务信息，0否 1是
      taskStatus: status || -4,
      pageSize: pageSize || 10,
      pageId: pageId || '',
      startTime: startTime || '',
      endTime: endTime || '',
      queryStatus: planStateArr || '1,2', //状态查询1未完成，2完成，3归档
      sortRule: 1,
    }
    $api
      .request('/task/work/plan/queryQuadrant', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (!startTime && resData.data) {
          resData.dataList = resData.data.children
        }
        if (!resData.dataList) {
          resData.dataList = []
        }
        const showData = resData
        resolve(showData)
      })
      .catch(res => {
        message.error(res.returnMessage)
        resolve(res)
      })
  })
}
//查询状态指标
export const getCountTarget = (treeId: string) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    const params = {
      treeId: treeId,
    }
    $api
      .request('/task/work/plan/target/findByTreeId', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}

//保存状态指标
export const saveTargetTag = (treeId: string, obj: { id: number; rgb: string; content: string }) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      id: obj.id,
      rgb: obj.rgb,
      content: obj.content,
      treeId: treeId,
    }
    $api
      .request('/task/work/plan/target/add', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        message.success($intl.get('saveSuc'))
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}

//删除状态指标
export const deleteTargetTag = (id: number) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      id: id,
    }
    $api
      .request('/task/work/plan/target/delete', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        message.success($intl.get('delSuc'))
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}

//编辑状态指标
export const editTargetTag = (treeId: string, obj: { id: number; rgb: string; content: string }) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      id: obj.id,
      rgb: obj.rgb,
      content: obj.content,
      treeId: treeId,
    }
    $api
      .request('/task/work/plan/target/modify', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        message.success($intl.get('editSuc'))
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//获取企业上下班时间
export const getCommuterTime = (_cmyId: number) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      teamInfoId: _cmyId,
    }
    $api
      .request('/task/config/getWorkHours', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}

//创建KR
export const addTaskNode = (
  parentId: number,
  typeId: number,
  mainId: string,
  teamId: number,
  teamName: string,
  type: number,
  name: string,
  endTime: string
) => {
  const { loginToken, nowUserId } = $store.getState()
  return new Promise(resolve => {
    const param = {
      id: parentId, //当前节点
      operateUser: nowUserId, //操作人
      mainId: mainId, //根节点id
      position: 1, //添加方向 1右 2下 3左 4上
      teamId: teamId, //企业id
      typeId: typeId,
      teamName: teamName, //企业名称
      name: name,
      type: type, //1:任务 2:O 3:Kr
      endTime: endTime,
    }
    const url = type == 3 ? '/task/work/plan/addOkrNode' : '/task/work/plan/addNode'
    $api
      .request(url, param, {
        headers: {
          loginToken: loginToken,
          teamId,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  })
}

//右键操作按钮
export const findOperationBtn = (param: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/findOperationBtn', param, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//标记为O,标记为KR，取消标记
export const spotMarkKR = (getRightData: {
  id: number
  parentId: any
  mainId: string
  type: number
  toTaskType: any
  teamId: number | string
}) => {
  const toType = getRightData.type
  const param = {
    id: getRightData.id, //当前节点
    parentId: getRightData.parentId, //父级元素id
    mainId: getRightData.mainId, //根节点id
    operateUser: $store.getState().nowUserId, //操作人
    toType, //标记为：1任务（取消标记）、2O、3KR、4、协同
    toTaskType:
      getRightData.toTaskType != undefined || getRightData.toTaskType != null
        ? getRightData.toTaskType
        : undefined,
  }
  const url = toType == 1 || toType == 4 ? '/task/work/plan/signTask' : '/task/work/plan/sign'

  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: {
          loginToken: $store.getState().loginToken,
          teamId: getRightData?.teamId,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        let Text = $intl.get('markSuc')
        if (getRightData.type == 1) {
          Text = $intl.get('cancelMarkSuc')
        }
        if (resData.returnCode === 0) {
          message.success(Text)
        } else {
          message.success($intl.get('markFail'))
        }
        resolve(resData)
      })
      .catch(res => {
        resolve(res)
        if (res.returnCode != 30095) {
          message.error(res.returnMessage)
        }
      })
  })
}
//查询常用联系人
export const findContacts = (teamId: number) => {
  const { loginToken, nowUserId, nowAccount } = $store.getState()
  const param = {
    userId: nowUserId,
    onlyUser: 1,
    account: nowAccount,
    teamId: teamId,
    type: 0,
    pageSize: 10,
    permissionType: 3,
  }
  return new Promise(resolve => {
    $api
      .request('/team/teamUserInfo/findContacts', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//查询当前可关联的任务
export const getNotRelation = (teamId: number) => {
  const { loginToken } = $store.getState()
  const param = {
    id: 51152, //当前规划id
    operateUser: 23,
    pageNo: 0,
    pageSize: 10,
  }
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/relation/getNotRelation', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//查询已关联/对齐的列表
export const getRelationList = (id: number, type: number) => {
  const { loginToken } = $store.getState()
  const param = {
    planId: id,
    type: type, //类型：0对齐 1关联
  }
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/relation/getRelationList', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//添加关联/对齐的数据
export const sureRelation = (type: number, aimId: number, planIds: Array<any>) => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    operationUser: nowUserId,
    sourcePlanId: aimId, //当前O的ID
    targetPlanIds: planIds, //选择的ID
    type: type, //0对齐 1关联
  }
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/relation/relation', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//添加关联任务
export const saveSupports = (id: any, supports: any) => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    operationUser: nowUserId,
    taskId: id,
    supports: supports,
  }
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/relation/saveSupports', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}

//取消关联/对齐
export const cancelRelation = (mianId: number, id: number, type: number) => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    operationUser: nowUserId,
    sourcePlanId: mianId,
    targetPlanId: id,
    type: type,
  }
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/relation/cancelRelation', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//查询外层界面的数据展示
export const groupUserCountPlan = (id: number) => {
  const { loginToken } = $store.getState()
  const param = {
    planId: id,
  }
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/relation/groupUserCountPlan', param, {
        headers: { loginToken: loginToken },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//查询外层界面的数据展示
export const getSubLateCount = (id: number) => {
  const { loginToken } = $store.getState()
  const param = {
    id: id,
  }
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/getSubLateCount', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//查询周期的数据展示
export const periodGetList = ({
  numDisplay,
  id,
  mySelf,
  ascriptionId,
  ascriptionType,
  status,
  deptId,
  roleId,
  loginUser, //否是关注人工作台
  sortType,
  grades,
  processStates,
  scores,
  cci,
}: any) => {
  const { loginToken, nowUserId } = $store.getState()
  const _operateUser = loginUser ? ascriptionId : nowUserId
  const param: any = {
    loginUser: loginUser, //登录人用户id
    operateUser: _operateUser, //关注人用户id
    teamId: id, //企业Id
    mySelf: mySelf || '0', //是否关注工作台
    ascriptionId: ascriptionId || nowUserId, //归属id
    ascriptionType: ascriptionType || '0', //归属类型
    periodDisplay: { isClosed: numDisplay }, //周期显示
  }
  if (sortType) {
    param.sortType = sortType
  }
  if (grades) {
    param.grades = grades
  }
  if (processStates) {
    param.processStates = processStates
  }
  if (scores) {
    param.scores = scores
  }
  if (cci) {
    param.cci = cci
  }
  if (status) {
    if (status.length > 0) {
      param.status = status //状态
    }
  }
  if (deptId && roleId) {
    param.deptId = deptId
    param.roleId = roleId
  }

  return new Promise(resolve => {
    $api
      .request('/task/okr/period/getList', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        resolve(res)
        message.error(res.returnMessage)
      })
  })
}
//查询O的分值和权重
export const findWeightsScore = (id: any) => {
  const { loginToken } = $store.getState()
  const param = {
    id: id,
  }
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/findWeightsScore', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}

//查询周期的配置
export const selectDateDisplay = () => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    userId: nowUserId,
  }
  return new Promise(resolve => {
    $api
      .request('/task/selectDisplay', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
        resolve(res)
      })
  })
}
//保存周期的查询配置
export const saveDateDisplay = (close: any, vale: string) => {
  const { loginToken, nowUserId } = $store.getState()
  const param: any = {
    userId: nowUserId,
  }
  if (vale == 'date') {
    param.isClosed = close
  } else {
    param.isHideStructure = close
  }

  return new Promise(resolve => {
    $api
      .request('/task/saveDisplay', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}

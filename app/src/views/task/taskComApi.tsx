import { requestApi } from '../../common/js/ajax'
/**
 * 移交任务、任务管理编辑执行人
 */
export const transferTask = ({
  taskId,
  userId,
  deptId,
  roleId,
  successMsg,
}: {
  taskId: string
  userId: string
  deptId: string
  roleId: string
  successMsg?: string
}) => {
  return new Promise(resolve => {
    const param = {
      id: taskId,
      operateUser: $store.getState().nowUserId,
      operateUserName: $store.getState().nowUser,
      liable: {
        userId: userId,
        deptId: deptId || '',
        roleId: roleId || '',
      },
    }
    requestApi({
      url: '/task/transFer/transferTask',
      param: param,
      json: true,
      successMsg: successMsg ? successMsg : '0',
    }).then((res: any) => {
      resolve(res.success ? res : false)
    })
  })
}
/**
 * 指派任务、任务管理编辑领导责任人
 */
export const assignTask = ({
  taskId,
  userId,
  deptId,
  roleId,
  successMsg,
}: {
  taskId: string
  userId: string
  deptId: string
  roleId: string
  successMsg?: string
}) => {
  return new Promise(resolve => {
    const param = {
      id: taskId,
      operateUser: $store.getState().nowUserId,
      operateUserName: $store.getState().nowUser,
      execute: {
        userId: userId,
        deptId: deptId || '',
        roleId: roleId || '',
      },
    }
    requestApi({
      url: '/task/assign/taskAssign',
      param: param,
      json: true,
      successMsg: successMsg ? successMsg : '0',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}

/**
 * 订阅/取消订阅汇报
 * type:0订阅 1取消
 */
export const subscribeReportApi = ({
  taskId,
  userId,
  type,
}: {
  taskId: string
  userId: string
  type: number
  successMsg?: string
}) => {
  return new Promise(resolve => {
    const param = {
      taskId: taskId,
      userId: userId,
      type: type,
      creator: $store.getState().nowUserId,
    }
    requestApi({
      url: '/task/report/subscribe/sub',
      param: param,
      successMsg: type == 1 ? '取消订阅成功' : '订阅成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}
/**
 * 编辑任务
 * infoArr:修改的信息，数组对象类型，name为修改的键名（传给后台的参数名），val为修改后的值
 */
export const editTaskApi = ({
  taskId,
  editMsg,
  isFinish,
  infoArr,
  successMsg,
}: {
  taskId: string
  editMsg?: string
  isFinish?: number
  infoArr: Array<{ name: string; val: any }>
  successMsg?: string
}) => {
  return new Promise(resolve => {
    const param: any = {
      id: taskId,
      operateUser: $store.getState().nowUserId,
      operateUserName: $store.getState().nowUser,
    }
    if (editMsg) {
      param.operateDescription = editMsg
    }
    //只有任务管理列表传，编辑验收人时需要
    if (isFinish != undefined) {
      param.isFinish = isFinish
    }
    infoArr.map((item: any) => {
      param[item.name] = item.val
    })
    requestApi({
      url: '/task/modify/id',
      param: param,
      json: true,
      successMsg: successMsg ? successMsg : '0',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}

/**
 * 编辑任务优先级
 */
export const editTaskPriApi = ({
  taskId,
  oldTaskId,
  star,
  successMsg,
}: {
  taskId: string
  oldTaskId?: string
  star: number
  successMsg?: string
}) => {
  return new Promise(resolve => {
    const param: any = {
      taskId: taskId, //任务id
      oldTaskId: oldTaskId || '', //被占用的任务id
      star: star, //星级
      operateUser: $store.getState().nowUserId,
    }
    const reqParam: any = {
      url: '/task/attach/setPriority',
      param: param,
    }
    if (successMsg != 'no') {
      reqParam.successMsg = successMsg ? successMsg : '0'
    }
    requestApi(reqParam).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}

/**
 * 拖动任务标签到列表
 */
export const moveTaskTagApi = ({
  taskId,
  tagId,
  successMsg,
}: {
  taskId: string
  tagId?: string
  successMsg?: string
}) => {
  return new Promise(resolve => {
    const param: any = {
      taskId: taskId, //任务id
      tagId: tagId || '', //标签id
      userId: $store.getState().nowUserId,
    }
    requestApi({
      url: '/task/tag/moveToTask',
      param: param,
      successMsg: successMsg ? successMsg : '0',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}

//查询已选任务标签数据
export const queryTags = ({
  ascriptionId,
  ascriptionType,
}: {
  typeId?: string
  ascriptionId: string
  ascriptionType: number
}) => {
  return new Promise(resolve => {
    const param = {
      ascriptionType,
      ascriptionId,
    }
    requestApi({
      url: '/task/tag/getConfig',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}
//按企业查询任务标签数据
export const queryCompanyTags = ({
  typeId,
  ascriptionId,
  ascriptionType,
}: {
  typeId: string
  ascriptionId: string
  ascriptionType: number
}) => {
  return new Promise(resolve => {
    const param = {
      typeId,
      ascriptionType,
      ascriptionId,
    }
    requestApi({
      url: '/task/tag/findTag',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}
/**
 * 快速创建任务
 */
export const quickCreateTask = ({
  ascriptionId,
  ascriptionName,
  name,
  parentId,
  createType,
  type,
}: {
  ascriptionId: string
  ascriptionName: string
  name: string
  parentId: string
  createType: number //0快速创建 1弹窗创建
  type: number //0-任务 1-项目
}) => {
  return new Promise(resolve => {
    const { nowUserId, nowUser, followUserInfo } = $store.getState()
    const param = {
      ascriptionId,
      ascriptionName,
      name,
      parentId,
      operateUser: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
      operateUserName: !followUserInfo.followStatus ? nowUser : followUserInfo.name,
      createType,
      type,
    }
    requestApi({
      url: '/task/addTaskByName',
      param: param,
      json: true,
      successMsg: '创建任务成功',
      headers: { teamId: ascriptionId },
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}

// 任务按钮权限获取
export const queryTaskBtnAuth = ({
  id,
  mainId,
  viewType,
}: {
  id: string | number
  viewType: number // viewType:0工作台点击 1任务管理点击 2任务详情
  mainId?: string
}) => {
  return new Promise(resolve => {
    const setViewType = viewType ? viewType : 0
    const param: any = {
      id,
      userId: $store.getState().nowUserId,
      viewType: setViewType,
    }
    if (setViewType == 4) {
      param.mainId = mainId
    }
    // console.log(param)
    requestApi({
      url: '/task/findOperationBtn',
      param,
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}

/**
 * 查询任务备注列表
 */
export const queryThemeList = (taskId: string) => {
  return new Promise(resolve => {
    const param: any = {
      taskId,
      userId: $store.getState().nowUserId,
    }
    requestApi({
      url: '/task/control/findTaskOpinion',
      param: param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}

/**
 * 添加任务协同回复消息
 */
export const addCommentApi = (paramObj: {
  taskId: string
  content: string
  typeId: number
  parentId: any
  rootId: any
  atUserIds: any
  type: number
  toMarkUserIds: any
  toMarkUserAcconts: any
  belongId: string
  belongName: string
  pushContent: string
  fileDetailModels: any
  temporaryId: any
}) => {
  const {
    taskId,
    content,
    typeId,
    type,
    parentId,
    rootId,
    toMarkUserIds,
    toMarkUserAcconts,
    belongId,
    belongName,
    pushContent,
    fileDetailModels,
    atUserIds,
    temporaryId,
  } = paramObj
  return new Promise(resolve => {
    const { nowUserId, nowUser, nowAccount } = $store.getState()
    let param: any = {
      userId: nowUserId, //评论人id
      userName: nowUser, //评论人姓名
      content: content, //评论内容
      typeId: typeId, //评论主题id
      type: type, //11 备注
      parentId: parentId, //评论父id
      rootId: rootId, //根评论id
      userIds: toMarkUserIds, //需要发通知的用户id集合
      userNames: toMarkUserAcconts, //需要发通知的用户名集合
      belongId: belongId, //归属id
      belongName: belongName, //归属名称
      belongType: 2, //归属类型
      pushContent: pushContent, //推送内容
      userAccount: nowAccount, //评论人账号
      fileDetailModels: fileDetailModels, //评论附件
      atUserIds: atUserIds, //@人员
      taskId: taskId,
    }
    if (temporaryId) {
      param.temporaryId = temporaryId
    }
    // console.log(param)
    requestApi({
      url: '/public/comment/addCommentMessage',
      param: param,
      json: true,
      successMsg: '添加评论成功',
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}

/**
 * 添加任务协同备注
 */
export const addMarksApi = (paramObj: {
  taskId: any
  opinion: string
  cycleNum: number
  toUsers: any
  files: any
  atUserIds: any
  temporaryId?: any
}) => {
  const { taskId, opinion, cycleNum, toUsers, files, atUserIds, temporaryId } = paramObj
  return new Promise(resolve => {
    const { nowUserId, nowUser } = $store.getState()
    let param: any = {
      opinion: opinion,
      taskId: taskId,
      userId: nowUserId,
      files: files,
      userIds: toUsers, //通知人集合
      cycleNum: cycleNum,
      username: nowUser,
      operateCode: '', //操作来源
      atUserIds: atUserIds,
    }
    if (temporaryId) {
      param.temporaryId = temporaryId
    }
    requestApi({
      url: '/task/control/add',
      param: param,
      json: true,
      successMsg: '新增备注成功',
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}

/**
 * 删除协同备注和评论回复
 * opinionId备注id 回复评论id
 * type 0 备注 1回复
 */
export const delMarkCommentApi = ({ opinionId, type }: { opinionId: string; type: number }) => {
  return new Promise(resolve => {
    let param: any = {
      opinionId,
    }
    let url = '/task/control/deleteOpinion'
    if (type == 1) {
      param = {
        commentId: opinionId,
      }
      url = '/public/comment/deleteOpinionCommentMessage'
    }
    requestApi({
      url: url,
      param: param,
      successMsg: '删除成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}

/**
 * 编辑备注
 * opinionId备注id 回复评论id
 * type 0 备注 1回复
 */
export const editMarkCommentApi = (paramObj: {
  opinionId: string
  opinion: string
  deleteFileId: any
  files: any
  atUserIds: any
  uuid: string
  delfileids: any
}) => {
  return new Promise(resolve => {
    const { nowUserId, nowUser } = $store.getState()
    const { opinionId, opinion, deleteFileId, files, atUserIds, uuid, delfileids } = paramObj
    let param: any = {
      opinionId: opinionId, //备注id
      opinion: opinion, //备注内容
      userId: nowUserId,
      userName: nowUser,
      files: files,
      deleteFileId: deleteFileId, //通知人集合
      atUserIds: atUserIds,
      temporaryId: uuid,
    }
    if (delfileids && delfileids.length) {
      param.fileGuidList = delfileids
    }
    requestApi({
      url: '/task/control/updateOpinion',
      param: param,
      json: true,
      successMsg: '编辑成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res.success ? res : false)
      }
    })
  })
}
/**
 * 查询任务
 */
export const queryTaskById = ({ taskIds }: { taskIds: any }) => {
  return new Promise(resolve => {
    const param = {
      taskIds: taskIds.join(','),
      loginUserId: $store.getState().nowUserId,
    }
    requestApi({
      url: '/task/findManager/id',
      param: param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data.dataList || [])
      }
    })
  })
}

//再次邀请
export const inviteAgainApi = ({ taskId, teamId }: any) => {
  return new Promise(resolve => {
    const param = {
      taskId,
      userId: $store.getState().nowUserId,
      teamId,
    }
    requestApi({
      url: '/task/joinTeam/inviteAgain',
      param,
    }).then((res: any) => {
      resolve(res.success)
    })
  })
}

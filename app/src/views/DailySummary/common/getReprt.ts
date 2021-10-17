import { message } from 'antd'
import { requestApi } from '../../../common/js/ajax'
//查询当前汇报模板
export const findTaskLogForm = (taskId: number) => {
  const { loginToken, nowUserId } = $store.getState()
  return new Promise(resolve => {
    const params = {
      taskId: taskId,
      userId: nowUserId,
    }
    requestApi({
      url: '/task/log/findTaskLogForm',
      param: params,
    }).then((res: any) => {
      if (res.success) {
        const dataList = res.data || {}
        resolve(dataList)
      } else {
        resolve({})
      }
    })
  })
}
/**
 * 保存汇报
 * @param {*} paramObj
 */
export const addTaskReport = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/report/addTaskReport',
      param: param,
      json: true,
      successMsg: '发送成功',
    }).then(res => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
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
        message.success('修改成功')
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
        message.success('删除成功')
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
        message.success('删除成功')
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
//查询发起汇报详情
export const getTaskDetail = (id: number) => {
  const { loginToken, nowUserId } = $store.getState()
  return new Promise(resolve => {
    const param = {
      id: id,
      userId: nowUserId,
    }
    $api
      .request('/task/report/taskDetail', param, {
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
//查询下一步计划详情
export const getPlanList = (param: any) => {
  const { loginToken, nowUserId } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/solution/list', param, {
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
//查询发起汇报日期列表
export const getTaskListDays = (param: any) => {
  // const { loginToken } = $store.getState()
  return new Promise(resolve => {
    requestApi({
      url: '/task/solution/list/days',
      param,
      setLoadState: 1,
    }).then((res: any) => {
      const getData = res?.data.data || {}
      resolve(getData)
    })
  })
}
//查询汇报列表对应详情展示
export const findReportGroup = (param: any) => {
  // const { loginToken } = $store.getState()
  return new Promise(resolve => {
    requestApi({
      url: '/task/report/findReportGroupTime',
      param,
      setLoadState: 1,
    }).then((res: any) => {
      const getData = res?.data.data || []
      resolve(getData)
    })
  })
}

//是否接受汇报提醒
export const findAcceptMind = (id: number) => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    taskId: id,
    userId: nowUserId,
  }
  return new Promise(resolve => {
    $api
      .request('/task/report/subscribe/find', param, {
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

//设置接受汇报提醒
export const setReprtMind = (id: number, type: number) => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    taskId: id,
    userId: nowUserId,
    type: type,
    idType: 0,
  }
  return new Promise(resolve => {
    $api
      .request('/task/report/subscribe/remind', param, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
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
/*----------任务管理-------------*/
//查询汇报人筛选列表
export const mangerHistory = (obj: { id: number; queryType: number; personType: number }) => {
  const { loginToken } = $store.getState()
  const param = {
    id: obj.id,
    queryType: obj.queryType,
    personType: obj.personType,
  }
  return new Promise(resolve => {
    $api
      .request('/task/attach/mangerHistory', param, {
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
//当前汇报人的汇报详情
export const findByUserDeatil = (obj: { taskId: number; userId: number; personType: number }) => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    taskId: obj.taskId,
    userId: obj.userId ? obj.userId : '',
    personType: obj.personType,
    loginUserId: nowUserId,
  }
  return new Promise(resolve => {
    $api
      .request('/task/report/list/findByUser', param, {
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

export const sendViewComm = (param: any) => {
  const { nowUserId, nowUser, nowAccount } = $store.getState()
  const paramObjs = {
    ...param,
    userId: nowUserId,
    userName: nowUser,
    userAccount: nowAccount,
  }
  return new Promise(resolve => {
    requestApi({
      url: '/public/comment/addCommentMessage',
      param: paramObjs,
      successMsg: '评论成功',
      json: true,
    }).then(resData => {
      resolve(resData.data)
    })
  })
}

//当前汇报人的汇报详情
export const findCommentMessage = (typeId: number, type: number) => {
  const { loginToken } = $store.getState()
  const param = {
    typeId: typeId,
    type: type,
    pageSize: 10,
    pageNo: 0,
  }
  return new Promise(resolve => {
    $api
      .request('/public/comment/commentMessagePage', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
        // ipcRenderer.send('update_unread_num') //更新工作台数量
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}

export const findCommentMessages = (typeId: number, titeamId: number, type?: number) => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    typeId: typeId,
    teamId: titeamId,
    userId: nowUserId,
    type: type || 0, //0:任务 okr进展:16
  }
  return new Promise(resolve => {
    $api
      .request('/public/comment/getCommentMessage', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
        // ipcRenderer.send('update_unread_num') //更新工作台数量
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}

//查询历史汇报
export const historyReport = (taskId: number, userId: number) => {
  const param = {
    userId: userId,
    taskId: taskId,
  }
  return new Promise(resolve => {
    requestApi({
      url: '/task/report/userHistoryReport',
      param: param,
    }).then(resData => {
      resolve(resData.data)
    })
  })
}

//编辑汇报的订阅人查询
export const findRelationUser = (taskId: number) => {
  const { loginToken, nowUserId, followUserInfo } = $store.getState()
  const param = {
    taskId: taskId,
    userId: followUserInfo.followStatus ? followUserInfo.userId : nowUserId,
  }
  return new Promise(resolve => {
    $api
      .request('/task/relation/findRelationUser', param, {
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

//查询当前汇报详情
export const taskReportDetail = (id: number, type: number) => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    id: id,
    userId: nowUserId,
    type: type,
  }
  return new Promise(resolve => {
    $api
      .request('/task/report/find/taskReport', param, {
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

//编辑保存当前汇报
export const taskmodifyById = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/report/modifyById',
      param: param,
      json: true,
      successMsg: '保存成功',
    }).then(res => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

//编辑保存当前汇报
export const queryTodayNoWrite = (taskId: number, teamId: number) => {
  const { loginToken, nowUserId } = $store.getState()
  const param = {
    pageNo: 0,
    pageSize: 20,
    teamId: teamId,
    userId: nowUserId,
    taskId: taskId,
  }
  return new Promise(resolve => {
    $api
      .request('/task/force/report/queryTodayNoWrite', param, {
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

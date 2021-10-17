import { requestApi } from '../../../common/js/ajax'
//查询新增的强制汇报依赖任务
export const addforceReportTask = (type: number) => {
  const { nowUserId, nowAccount, selectTeamId, loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      userId: nowUserId,
      belong: 'org',
      belongId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
      followType: 'user',
      account: nowAccount,
      type: type,
    }
    $api
      .request('/task/force/report/query', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData.dataList
        resolve(showData)
      })
  })
}

//查询强制汇报列表
export const queryTodayWrite = () => {
  const { nowUserId, selectTeamId, loginToken } = $store.getState()
  const param = {
    pageNo: 0,
    pageSize: 20,
    teamId: '',
    userId: nowUserId,
  }
  return new Promise(resolve => {
    requestApi({
      url: '/task/force/report/queryTodayWrite',
      param: param,
      json: true,
    }).then(resData => {
      resolve(resData.data)
    })
  })
}

//查询当前强制汇报列表
export const findRelationTask = (paramObj: any) => {
  const { nowUserId, loginToken, selectTeamId } = $store.getState()
  return new Promise(resolve => {
    const param = {
      ...paramObj,
      userId: nowUserId,
      enterpriseIds: selectTeamId && selectTeamId != -1 ? [selectTeamId] : [],
    }
    requestApi({
      url: '/task/force/report/findRelationTaskList',
      param: param,
      json: true,
      successMsg: '查询成功',
    }).then(resData => {
      resolve(resData.data)
    })
  })
}

//添加任务
export const addRelationTask = (taskId: any) => {
  const { nowUserId } = $store.getState()
  const param = {
    taskId: taskId,
    userId: nowUserId,
  }
  return new Promise(resolve => {
    requestApi({
      url: '/task/force/report/addRelationTask',
      param: param,
      successMsg: '添加成功',
    }).then(resData => {
      resolve(resData.data)
    })
  })
}

//取消任务
export const cancelRelationTask = (taskId: any) => {
  const { nowUserId } = $store.getState()
  const param = {
    taskId: taskId,
    userId: nowUserId,
  }
  return new Promise(resolve => {
    requestApi({
      url: '/task/force/report/cancelRelationTask',
      param: param,
      successMsg: '取消成功',
    }).then(resData => {
      resolve(resData.data)
    })
  })
}

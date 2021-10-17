import { reject } from 'async'

/**
 * 启动任务
 * level 传入当前层级 ，避免局部刷新缩进不对
 */
export const execute = (id: number, status: number) => {
  const { nowUserId, nowUser, loginToken } = $store.getState()
  const params = {
    id: id,
    status: status,
    operateUser: nowUserId,
    operateUserName: nowUser,
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/task/execute', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//一键完成
export const finishTask = (id: number, percent: number) => {
  const { nowUserId, nowUser, loginToken } = $store.getState()
  const params = {
    taskId: id,
    userId: nowUserId,
    process: percent,
    operateUser: nowUserId,
    operateUserName: nowUser,
    oneKey: true,
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/task/log/addTaskLog', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//取消一键完成
export const unFinish = (id: number) => {
  const { nowUserId, nowUser, loginToken } = $store.getState()
  const params = {
    id: id,
    operateUser: nowUserId,
    operateUserName: nowUser,
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/task/taskCancelFinish', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//任务移交操作
export const TransferRequest = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/transFer/transferTask', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//变更归属
export const Taskownership = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/attach/changeAscription', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//归档
export const TaskFileSave = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/taskOnFile', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}
//撤销归档
export const TaskFileSaveRecall = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/taskOnFile/recall', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}
//冻结任务
export const FrozenTask = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/freezeTask', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}
//流转任务冻结
export const circulationFrozenTask = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/freezeCirculationTask', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}
//查询任务子元素
export const queryTaskSub = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/workbench/sub', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}
//任务关注人-查询已有关注人
export const queryAlreadyfollowUser = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/follow/findUser', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}
//任务关注人-保存关注人
export const savefollowUser = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/follow/saveUser', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}
//任务催办
export const taskUrg = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/sendTaskUrgeMessage', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode == 0) {
          resolve(res)
        } else {
          reject(res)
        }
      })
      .catch(res => {
        reject(res)
      })
  })
}
//任务删除
export const taskDelete = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/delete', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}
//任务复盘
export const taskReplay = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/onFile/addTaskReview', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}

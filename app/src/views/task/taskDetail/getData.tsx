import { message } from 'antd'

//查询任务详情
export const queryTaskDetailApi = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/query/id', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(false)
        message.error(res.returnMessage)
      })
  })
}

//编辑任务详情
export const editTaskSaveApi = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}

//修改进度
export const editTasklogApi = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}
//再次邀请
export const inviteAgainApi = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}

//查询树形结构
export const initDataTreeApi = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}

//查询检查项
export const inquireCheckApi = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}

//获取右键权限
export const getTaskBtnApi = (param: any) => {
  const { loginToken } = $store.getState()
  let showData: any = ''
  // async function ajax() {
  return new Promise(resolve => {
    $api
      .request('/task/findOperationBtn', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
  // return showData
  // }
  // return ajax()
}

//获取表头名称
export const headerSettingsApi = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}
//获取汇报设置列表
export const getForceReport = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/force/report/queryList', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}
//获取未写汇报设置列表
export const forceCountNoWrite = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/force/report/countNoWrite', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}
//清空未写汇报设置列表
export const clearForceCountNoWrite = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/force/report/clearNoWrite', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}
//删除汇报设置
export const delForce = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/force/report/cancel', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        formData: false,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}

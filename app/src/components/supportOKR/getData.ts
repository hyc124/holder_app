import { message } from 'antd'

//移动规划列表
export const getMovePlanList = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/listByOkr', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          resolve(resData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

/**
 * 查询规划卡片 列表数据
 * @param params
 */
export const queryPlanList = (params: any) => {
  if (params.setLoadState) {
    params.setLoadState(true)
  }
  return $api
    .request('/task/work/plan/list', params, {
      headers: {
        loginToken: $store.getState().loginToken,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    })
    .then((res: any) => {
      if (params.setLoadState) {
        params.setLoadState(false)
      }
      if (res.returnCode === 0) {
        return {
          success: true,
          data: res,
        }
      } else {
        message.error(res.returnMessage)
        return {
          success: false,
        }
      }
    })
    .catch(function(res) {
      if (params.setLoadState) {
        params.setLoadState(false)
      }
      message.error(res.returnMessage)
      return {
        success: false,
        data: res,
      }
    })
}

//查询任务列表
export const getTaskListApi = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/findParentList', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          resolve(resData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//查询子任务
export const getSubTaskListApi = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/findManagerSubList', params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          resolve(resData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

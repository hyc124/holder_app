import { requestApi } from '@/src/common/js/ajax'
import { message } from 'antd'
/**
 * 查询数据中心类型列表
 * @param param
 */
export const queryFormStructure = () => {
  const param = { userId: $store.getState().nowUserId }
  return new Promise(resolve => {
    $api
      .request('/team/dataCentre/queryFormStructure', param, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
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

/**
 * 搜索查询数据中心类型列表
 * @param param
 */
export const queryFormByKeyword = (val: any) => {
  const param = { userId: $store.getState().nowUserId, keyword: val }
  return new Promise(resolve => {
    $api
      .request('/team/dataCentre/queryFormByKeyword', param, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
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
/**
 * 获取matabase仪表盘url
 * @param param
 */
export const queryDashboardUrl = (param: { dashboardId: any; teamId: any; userId: any }) => {
  return new Promise(resolve => {
    $api
      .request('/team/dataCentre/queryDashboardUrl', param, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
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

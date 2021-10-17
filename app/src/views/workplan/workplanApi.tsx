import { message } from 'antd'
import { requestApi } from '../../common/js/ajax'
/**
 * 查询规划组织架构数据
 * @param params
 */
interface TreeParam {
  account: string
  isAllOrg: number
  defaultLoginUser?: number
  id?: string
  type?: number
  teamId?: string
  setLoadState?: any //设置loading状态的方法
}
export const queryTreeData = (params: TreeParam) => {
  if (params.setLoadState) {
    params.setLoadState(true)
  }
  return $api
    .request('/team/permission/findAllEnterpriseTree', params, {
      headers: {
        loginToken: $store.getState().loginToken,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      formData: false,
    })
    .then((res: any) => {
      if (params.setLoadState) {
        params.setLoadState(false)
      }
      if (res.returnCode === 0) {
        return {
          success: true,
          data: res.dataList,
        }
      } else {
        message.error(res.returnMessage)
        return {
          success: false,
          data: res,
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
      console.log(res)
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
/**
 * 规划搜索查询
 * @param params
 */
export const searchPlanList = (params: any) => {
  if (params.setLoadState) {
    params.setLoadState(true)
  }
  return $api
    .request('/team/user/solr/findAuthUserByEnterprise', params, {
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

/**
 * 已读未读处理
 */
export const planReadHandle = ({ url, param }: { url: string; param: any }) => {
  return new Promise(resolve => {
    requestApi({
      url: url,
      param: param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}

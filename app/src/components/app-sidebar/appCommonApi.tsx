import { requestApi } from '@/src/common/js/ajax'

/**
 * 查询功能权限
 */
export const queryFunsAuthApi = () => {
  return new Promise(resolve => {
    const param = {
      userId: $store.getState().nowUserId,
    }
    requestApi({
      url: '/function/auth/getAuthByUserId',
      param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}
/**
 * 获取按钮权限
 * 使用对象格式，便于后续可能查询多个权限组合
 */
export const getFunsAuth = ({ name }: { name: string; subCode?: string }) => {
  let auth = true
  const funsAuthList = $store.getState().funsAuthList
  //   工作汇报按钮根据：是否有OKR、TASK、WORK_REPORT任何一个
  if (name == 'workReport') {
    let hasAuth = false
    for (let i = 0; i < funsAuthList.length; i++) {
      const item = funsAuthList[i]
      if ((item.name == 'OKR' || item.name == 'TASK' || item.name == 'WORK_REPORT') && item.hasAuth) {
        hasAuth = true
      }
    }
    auth = hasAuth
  } else {
    const findItem = funsAuthList.find((item: any) => item.name == name)
    if (findItem) {
      auth = findItem.hasAuth
    }
  }
  return auth
}

/**
 * 查询版本更新
 */
export const queryVersionUpgrade = () => {
  return new Promise(resolve => {
    requestApi({
      url: '/version/checkUpdate',
      param: null,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

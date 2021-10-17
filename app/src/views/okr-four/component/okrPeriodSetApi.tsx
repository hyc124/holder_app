import { requestApi } from '@/src/common/js/ajax'

/**
 * 保存是否启用okr
 */
export const saveOkrEnableApi = ({ teamId }: any) => {
  return new Promise(resolve => {
    const param = {
      ascriptionId: teamId,
    }
    requestApi({
      url: '/task/okr/enable/set',
      param,
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(res.success)
      }
    })
  })
}
/**
 * 周期标记
 * id:周期id
 */
export const signOkrPeriodApi = ({ id }: any) => {
  return new Promise(resolve => {
    const param = {
      id,
    }
    requestApi({
      url: '/task/okr/period/sign',
      param,
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(res.success)
      }
    })
  })
}
/**
 * 周期移除
 * id:周期id
 */
export const delOkrPeriodApi = ({ id }: any) => {
  return new Promise(resolve => {
    const param = {
      id,
      userId: $store.getState().nowUserId,
    }
    requestApi({
      url: '/task/okr/period/remove',
      param,
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(res.success)
      }
    })
  })
}

/**
 * 查询配置周期列表
 * id:周期id
 */
export const findPeriodSetListApi = ({ teamId, pageNo, pageSize }: any) => {
  return new Promise(resolve => {
    const param = {
      ascriptionId: teamId,
      pageNo,
      pageSize,
    }
    requestApi({
      url: '/task/okr/period/findConfigList',
      param,
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(res.success)
      }
    })
  })
}

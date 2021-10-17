import { requestApi } from '@/src/common/js/ajax'
// 查询信心指数均值折线图
export const findAvgCciTrendApi = ({
  keyword,
  status,
  mySelf,
  periodId,
  teamId,
  ascriptionId,
  ascriptionType,
}: {
  keyword: any
  status: any
  mySelf: any
  periodId: any
  teamId: any
  ascriptionId: any
  ascriptionType: any
}) => {
  return new Promise(resolve => {
    const param = {
      keyword,
      status,
      mySelf,
      periodId,
      teamId,
      ascriptionId,
      ascriptionType,
      operateUser: $store.getState().nowUserId,
    }
    requestApi({
      url: '/task/log/findAvgCciTrend',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      }
    })
  })
}
// 查询信心指数修改详情折线图
export const findCciDynamicApi = ({
  keyword,
  status,
  mySelf,
  periodId,
  teamId,
  ascriptionId,
  ascriptionType,
  queryTime,
  grades,
  processStates,
  scores,
  cci,
}: {
  keyword: any
  status: any
  mySelf: any
  periodId: any
  teamId: any
  ascriptionId: any
  ascriptionType: any
  queryTime: any
  grades: any
  processStates: any
  scores: any
  cci: any
}) => {
  return new Promise(resolve => {
    const param = {
      keyword,
      status,
      mySelf,
      periodId,
      teamId,
      ascriptionId,
      ascriptionType,
      queryTime,
      operateUser: $store.getState().nowUserId,
      grades,
      processStates,
      scores,
      cci,
    }
    requestApi({
      url: '/task/okrSummaryGraph/findCciDynamic',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      }
    })
  })
}
// 查询信心指数修改详情折线图
export const findProcessDynamicApi = ({
  keyword,
  status,
  mySelf,
  periodId,
  teamId,
  ascriptionId,
  ascriptionType,
  queryTime,
  grades,
  processStates,
  scores,
  cci,
}: {
  keyword: any
  status: any
  mySelf: any
  periodId: any
  teamId: any
  ascriptionId: any
  ascriptionType: any
  queryTime: any
  grades: any
  processStates: any
  scores: any
  cci: any
}) => {
  return new Promise(resolve => {
    const param = {
      keyword,
      status,
      mySelf,
      periodId,
      teamId,
      ascriptionId,
      ascriptionType,
      queryTime,
      operateUser: $store.getState().nowUserId,
      grades,
      processStates,
      scores,
      cci,
    }
    requestApi({
      url: 'task/okrSummaryGraph/findProcessDynamic',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      }
    })
  })
}
//查询进展均值折线图
export const findAvgProcessTrendApi = ({
  keyword,
  status,
  mySelf,
  periodId,
  teamId,
  ascriptionId,
  ascriptionType,
}: {
  keyword: any
  status: any
  mySelf: any
  periodId: any
  teamId: any
  ascriptionId: any
  ascriptionType: any
}) => {
  return new Promise(resolve => {
    const param = {
      keyword,
      status,
      mySelf,
      periodId,
      teamId,
      ascriptionId,
      ascriptionType,
      operateUser: $store.getState().nowUserId,
    }
    requestApi({
      url: '/task/log/findAvgProcessTrend',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      }
    })
  })
}

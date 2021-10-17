import { requestApi } from '@/src/common/js/ajax'
// 查询信心指数均值折线图
export const queryOkrSummaryGraphyApi = ({
  keyword,
  status,
  mySelf,
  periodId,
  teamId,
  ascriptionId,
  ascriptionType,
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
      operateUser: $store.getState().nowUserId,
      grades,
      processStates,
      scores,
      cci,
    }
    requestApi({
      url: 'task/okrSummaryGraph/queryOutside',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      }
    })
  })
}

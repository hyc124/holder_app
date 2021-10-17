import { requestApi } from '@/src/common/js/ajax'

/**
 * 更改执行人后查询（指派人、领导人、督办人）
 * @param paramObj
 */
export const findUserChangeTeamApi = (paramObj: {
  liable: any
  executor: any
  distribute: any
  supervisor: any
  teamId: any
}) => {
  //   const { liable, executor, distribute, supervisor, teamId } = paramObj
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      userId: nowUserId,
      ...paramObj,
    }
    requestApi({
      url: '/task/findUserChangeTeam',
      param,
      json: true,
    }).then((res: any) => {
      resolve(res)
    })
  })
}

/**
 * 保存任务
 * @param paramObj
 */
export const saveTaskApi = ({ param, url }: { param: any; url?: string }) => {
  return new Promise(resolve => {
    requestApi({
      url: url || '/task/addTaskByName',
      param,
      json: true,
      // setLoadState: 1,
      headers: { teamId: param?.ascriptionId },
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

import { requestApi } from '@/src/common/js/ajax'

/**
 * 查询任务详情
 * @param param
 */
export const queryTaskDetailApi = ({ id }: { id: number | string }) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    if (!id) {
      return
    }
    const param = {
      id,
      userId: nowUserId,
    }
    requestApi({
      // url: '/task/query/id',
      url: '/task/query/process/id',
      param,
      apiType: 1,
    }).then((res: any) => {
      const getData = res?.data || {}
      // const showData: any = getData?.data
      resolve(getData)
    })
  })
}
/**
 * 编辑进度
 * @param param
 */
export const editProgressApi = ({ taskId, process }: { taskId: number | string; process: number }) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      taskId,
      operateUser: nowUserId,
      userId: nowUserId,
      process,
    }
    requestApi({
      url: '/task/log/addTaskLog',
      param,
      json: true,
      successMsg: '编辑成功',
    }).then((res: any) => {
      resolve(res)
    })
  })
}
/**
 * 编辑任务详情字段
 * @param param
 */
export const editDetailApi = (paramObj: any) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      operateUser: nowUserId,
      ...paramObj,
    }
    console.log(param)
    requestApi({
      url: '/task/modify/id',
      param,
      json: true,
      successMsg: '编辑成功',
      apiType: 1,
    }).then((res: any) => {
      resolve(res)
    })
  })
}

/**
 * 查询子任务
 */
export const queryTaskTreeApi = ({ taskId }: { taskId: any }) => {
  return new Promise(resolve => {
    const param = {
      taskId,
      loginUserId: $store.getState().nowUserId,
    }
    console.log(param)
    requestApi({
      // url: '/task/findManager/id',
      url: '/task/findManager/third',
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
 * 取消支撑
 */
export const cancelSupportApi = ({ taskId, planId }: any) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      userId: nowUserId,
      taskId,
      planId,
    }
    console.log(param)
    requestApi({
      url: '/task/work/plan/cancelSupports',
      param,
      successMsg: '取消支撑成功',
    }).then((res: any) => {
      resolve(res)
    })
  })
}
/**
 * 查询检查项
 */
export const getCheckListApi = (param: { taskId: any; userId: any }) => {
  return new Promise(resolve => {
    console.log(param)
    requestApi({
      // url: '/task/findManager/id',
      url: '/task/check/list',
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

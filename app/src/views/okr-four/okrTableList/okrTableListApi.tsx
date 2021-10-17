import { requestApi } from '@/src/common/js/ajax'

/**
 * 查询跟进列表
 * @param param
 */
export const queryOkrFollowUpListApi = ({
  param,
  url,
  json,
}: {
  param: {
    ascriptionType: number
    ascriptionId: number
    teamId: any
    status: any
    mySelf: number | string
    periodId: number
    pageNo: number
    pageSize: number
  }
  url?: string
  json?: boolean
}) => {
  return new Promise(resolve => {
    const thisParam = {
      ...param,
    }
    requestApi({
      url: url || '/task/RiskItem/queryInfo',
      param: thisParam,
      json,
    }).then((res: any) => {
      resolve(res.data)
    })
  })
}

export const queryOkrFollowUpListApi0 = (params: any, url?: string) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      ...params,
      userId: nowUserId,
    }
    requestApi({
      url: url || '/task/RiskItem/queryInfo',
      param,
    }).then((res: any) => {
      resolve(res.data)
    })
  })
}

//编辑okr节点
export const editOKRTask = (
  params: {
    id: any
    parentId: any
    mainId: any
    typeId: any
    [propName: string]: any
  },
  successMsg?: string
) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      operateUser: nowUserId,
      ...params,
    }
    requestApi({
      url: '/task/work/plan/setNode',
      param,
      json: true,
      successMsg: successMsg || '编辑成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

//新增子任务
export const addOkrTaskApi = ({ params }: { params: any;[propName: string]: any }) => {
  return new Promise(resolve => {
    const { nowUserId, nowUser } = $store.getState()
    const param = {
      operateUser: nowUserId,
      operateUserName: nowUser,
      ...params,
    }
    requestApi({
      url: '/task/addTaskByName',
      param,
      json: true,
      successMsg: '创建成功',
      headers: { teamId: params?.ascriptionId },
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}
//新增子kr
export const addOkrNodeApi = ({ params }: { params: any;[propName: string]: any }) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      operateUser: nowUserId,
      ...params,
    }
    const url = params?.type == 3 ? '/task/work/plan/addOkrNode' : '/task/work/plan/addNode'
    requestApi({
      url,
      param,
      json: true,
      headers: { teamId: params?.teamId },
      successMsg: '创建成功',
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
 * 查询单条或多条数据
 */
export const queryOkrListById = ({ typeIds }: any, url?: string) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      typeIds,
      loginUserId: nowUserId,
    }
    requestApi({
      url: url || '/task/work/plan/findTreeByIdIn',
      param,
    }).then((res: any) => {
      resolve(res.data)
    })
  })
}

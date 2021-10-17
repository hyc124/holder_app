import { requestApi } from '@/src/common/js/ajax'
import { message } from 'antd'

/**
 * 查询周期
 * @param param
 */
export const queryPeriodApi = ({
  teamId,
  mySelf,
  ascriptionId,
  ascriptionType,
  isClosed,
  _status,
  deptId,
  roleId,
}: {
  teamId: number | string
  mySelf: any
  ascriptionId: any
  ascriptionType: any
  isClosed: boolean
  _status?: any
  deptId?: any
  roleId?: any
}) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param: any = {
      operateUser: nowUserId,
      teamId,
      mySelf,
      ascriptionId,
      ascriptionType,
      periodDisplay: { isClosed },
    }
    if (deptId && roleId) {
      param.deptId = deptId
      param.roleId = roleId
    }
    if (_status) {
      if (_status.length > 0) {
        param.status = _status
      }
    }
    requestApi({
      url: '/task/okr/period/getList',
      param,
      apiType: 1,
      json: true,
    }).then((res: any) => {
      // console.log('period:', res)
      const getData = res?.data.dataList || []
      resolve(getData)
    })
  })
}

/**
 * 编辑Okr详情
 * @param param
 */
export const editOkrDetailApi = (param: {
  nodeId: number | string
  typeId: any
  parentId: any
  mainId: any
  [propName: string]: any
}) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/work/plan/setNode',
      param,
      apiType: 1,
      json: true,
    }).then((res: any) => {
      resolve(res.success)
    })
  })
}

/**
 * 编辑Okr详情
 * @param param
 */
export const editOKRAffiliationApi = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/transFer/workPlanTransferTask',
      param,
      apiType: 1,
      json: true,
    }).then((res: any) => {
      resolve(res.success)
    })
  })
}
//删除状态指标
export const delTargetTagApi = (id: number) => {
  return new Promise(resolve => {
    const param = {
      id: id,
    }
    requestApi({
      url: '/task/work/plan/target/delete',
      param,
      apiType: 1,
    }).then((res: any) => {
      resolve(res.success)
      if (res.success) {
        message.success($intl.get('delSuc'))
      }
    })
  })
}

//编辑状态指标
export const editTargetTagApi = ({
  id,
  rgb,
  content,
  treeId,
  optType,
}: {
  treeId: string
  id: number
  rgb: string
  content: string
  optType: string
}) => {
  return new Promise(resolve => {
    const param = {
      id,
      rgb,
      content,
      treeId,
    }
    const url = optType == 'add' ? '/task/work/plan/target/add' : '/task/work/plan/target/modify'
    requestApi({
      url,
      param,
      apiType: 1,
    }).then((res: any) => {
      resolve(res.success)
      if (res.success) {
        message.success(optType == 'add' ? $intl.get('saveSuc') : $intl.get('editSuc'))
      }
    })
  })
}
/**
 * 查询OKR任务  (刷新时使用)
 */
export const queryOKRTaskByIdApi = ({ taskIds }: { taskIds: any }) => {
  return new Promise(resolve => {
    const param = {
      typeIds: taskIds.join(','),
      loginUserId: $store.getState().nowUserId,
    }
    requestApi({
      url: '/task/work/plan/findTreeByIdIn',
      param,
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data.dataList || [])
      }
    })
  })
}

/**
 * 记住上次所选周期
 */
export const remberPeriodApi = ({ ascriptionId, okrPeriodId }: { ascriptionId: any; okrPeriodId: any }) => {
  return new Promise(() => {
    const param: any = {
      okrPeriodId,
      userId: $store.getState().nowUserId,
    }
    // 所有企业不传
    if (ascriptionId && ascriptionId != -1) {
      param.ascriptionId = ascriptionId
    }
    requestApi({
      url: '/task/rememberPeriod/save',
      param,
      apiType: 1,
    })
  })
}

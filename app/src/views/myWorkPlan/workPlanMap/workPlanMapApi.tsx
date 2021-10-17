import { requestApi } from '@/src/common/js/ajax'

/**
 * 查询对齐视图
 * @param param
 */
export const queryViewMapApi = ({ planId, type }: any) => {
  return new Promise(resolve => {
    const param = {
      planId,
      type, //类型：0对齐zuo 1关联you -1 对齐+关联（默认）
    }
    requestApi({
      url: '/task/work/plan/relation/getRelationViewList',
      param,
      apiType: 1,
    }).then((res: any) => {
      resolve(res.data)
    })
  })
}
/**
 * 查询规划脑图(旧)
 * @param param
 */
// export const queryPlanMindMapApi = (param: any) => {
//   return new Promise(resolve => {
//     requestApi({
//       url: '/task/work/plan/queryTree',
//       param,
//       json: true,
//       apiType: 1,
//     }).then((res: any) => {
//       resolve(res.data)
//     })
//   })
// }

/**
 * 查询规划脑图mainId
 * @param param
 */
export const queryPlanMindIdApi = ({ planId }: any) => {
  const param = {
    id: planId,
  }
  return new Promise(resolve => {
    requestApi({
      url: '/task/work/plan/getMainId',
      param,
      apiType: 1,
      setLoadState: 1,
    }).then((res: any) => {
      resolve(res.data.data)
    })
  })
}
/**
 * 规划脑图添加节点
 * @param param
 */
export const planMindAddApi = ({
  id,
  parentId,
  typeId,
  mainId,
  mainTypeId,
  position,
  teamId,
  teamName,
}: any) => {
  return new Promise(resolve => {
    const param: any = {
      id, //当前节点
      parentId, //父级元素id
      operateUser: $store.getState().nowUserId, //操作人
      typeId,
      mainId, //根节点id
      mainTypeId, //根节点typeid
      position, //添加方向 1右 2下 3左 4上
      teamId, //企业id
      teamName, //企业名称
    }
    requestApi({
      url: '/task/work/plan/addNode',
      param,
      json: true,
      apiType: 1,
      headers: { teamId },
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
 * 编辑Okr
 * @param param
 */
export const editOkrSaveApi = (param: {
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
      successMsg: '编辑成功',
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
 * 删除okr节点
 * @param param
 */
export const delOKrNodeApi = (param: { typeId: any; parentId: any; mainId: any; [propName: string]: any }) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/work/plan/delete',
      param,
      apiType: 1,
      json: true,
      successMsg: '删除成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}

// ==============================新版规划脑图接口========================//
/**
 * 查询规划脑图(新)
 * @param param
 */
export const queryPlanMindApi = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/mind/tree',
      param,
      apiType: 1,
    }).then((res: any) => {
      resolve(res.data || {})
    })
  })
}
/**
 * 新建脑图
 * @param param
 */
export const createMindMapApi = ({ folderId, name }: any) => {
  const param: any = {
    folderId,
    name,
    userId: $store.getState().nowUserId, //操作人
  }
  return new Promise(resolve => {
    requestApi({
      url: 'task/planning/create',
      param,
      apiType: 1,
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
 * 规划脑图添加节点
 * @param param
 */
export const planMindAddNodeApi = ({ id, name, planningId, position }: any) => {
  return new Promise(resolve => {
    const param: any = {
      id, //当前节点
      operateUser: $store.getState().nowUserId, //操作人
      planningId, //根节点id
      position, //添加方向 1右 2下 3左 4上
      name, //脑图名d
    }
    requestApi({
      url: '/task/mind/add',
      param,
      apiType: 1,
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
 * 规划脑图编辑节点
 * @param param
 */
export const planMindEditApi = ({ id, name, planningId }: any) => {
  return new Promise(resolve => {
    const param: any = {
      id, //当前节点
      operateUser: $store.getState().nowUserId, //操作人
      planningId, //根节点id
      name, //脑图名
    }
    requestApi({
      url: '/task/mind/edit',
      param,
      apiType: 1,
      successMsg: '编辑成功',
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
 * 规划脑图删除节点
 * @param param
 */
export const delPlanMindApi = ({ id, planningId, hasChild }: any) => {
  return new Promise(resolve => {
    const param: any = {
      id, //当前节点
      planningId, //根节点id
      hasChild,
      operateUser: $store.getState().nowUserId, //操作人
    }
    requestApi({
      url: '/task/mind/del',
      param,
      apiType: 1,
      successMsg: '删除成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

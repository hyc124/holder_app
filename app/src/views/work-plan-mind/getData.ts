import { resolve } from 'path'
import { message } from 'antd'

// 获取工作规划tree数据
export const getMindMapEmpty = (param: any, url: string) => {
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          resolve(resData)
        } else {
          message.error(resData.returnMessage)
          resolve(resData)
        }
      })
      .catch(resData => {
        resolve(resData)
        message.error(resData.returnMessage)
      })
  })
}

//获取工作规划mindId
export const getMindId = (id: number) => {
  return new Promise(resolve => {
    const param = {
      id: id,
    }
    $api
      .request('/task/work/plan/getMainId', param, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData.data
          resolve(showData)
        } else {
          message.error(resData.returnMessage)
          const showData = resData.data
          resolve(showData)
        }
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//获取工作规划mindId
export const queryRating = (id: number) => {
  return new Promise(resolve => {
    const param = {
      ascriptionId: id,
    }
    $api
      .request('/task/okr/rating/query', param, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData.data
          resolve(showData)
        } else {
          message.error(resData.returnMessage)
          const showData = resData.data
          resolve(showData)
        }
      })
      .catch(res => {
        message.error(res.returnMessage)
      })
  })
}
//创建规划
export const getAddprojectData = (addProjectParam: any) => {
  return new Promise(resolve => {
    const param = {
      ascriptionId: addProjectParam._curId, //归属Id
      ascriptionType: addProjectParam._curType, //归属类型
      operateUser: $store.getState().nowUserId, //操作人
      teamId: addProjectParam._cmyId, //企业Id
      teamName: addProjectParam._cmyName, //企业名称
      id: 0, //创建默认为0
      deptId: addProjectParam.deptId,
      roleId: addProjectParam.roleId,
      deptName: addProjectParam.deptName,
      roleName: addProjectParam.roleName,
      name: addProjectParam.name || '',
      startTime: addProjectParam.startTime || '',
      type: addProjectParam.type || '',
    }
    $api
      .request('/task/work/plan/create', param, {
        headers: {
          loginToken: $store.getState().loginToken,
          teamId: addProjectParam._cmyId,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          message.success('创建规划成功')
          const showData = resData.data
          resolve(showData)
        } else {
          message.error(resData.returnMessage)
          const showData = resData.data
          resolve(showData)
        }
      })
      .catch(e => {})
  })
}

//添加节点
export const addTaskNode = (params: any) => {
  return new Promise(resolve => {
    const param: any = {
      id: params.id, //当前节点
      parentId: params.parentId, //父级元素id
      operateUser: $store.getState().nowUserId, //操作人
      typeId: params.typeId,
      mainId: params.mainId, //根节点id
      mainTypeId: params.mainTypeId, //根节点typeid
      position: params.position, //添加方向 1右 2下 3左 4上
      teamId: params.teamId, //企业id
      teamName: params.teamName, //企业名称
    }

    $api
      .request('/task/work/plan/addNode', param, {
        headers: {
          loginToken: $store.getState().loginToken,
          teamId: params.teamId,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData.data
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(e => {})
  })
}

//编辑节点
export const editProcess = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/log/addTaskLog', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        resolve(res)
        message.error(res.returnMessage)
      })
  })
}

//编辑节点
export const editOKRtask = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/setNode', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        resolve(res)
        message.error(res.returnMessage)
      })
  })
}

//删除节点
export const deleteNodesApi = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/delete', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(e => {})
  })
}
//删除OKr节点
export const deleteKrNodesApi = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/deleteOkr', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(e => {})
  })
}

//移动节点
export const okrMoveNodes = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/moveNode', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//排序
export const setSortNodes = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('task/work/plan/sort/setSort', params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//收到的协同、发起的协同
export const getQuerySynergy = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/querySynergy', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//待办计划
export const getfindWaitPlanList = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/backLogList', params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//更改头部状态
export const getHeaderStatus = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/getMainStatus', params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        // message.error(res.returnMessage)
      })
  })
}

//收到的共享、发起的共享
export const getfindShareList = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/queryShare', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//共享、协同红点查询
export const getReadInquire = (params: any, url: any) => {
  return new Promise(resolve => {
    $api
      .request(url, params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//移动规划列表
export const getMovePlanList = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/movePlanList', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//移动规划
export const movePlanSaveApi = (params: any, url: any) => {
  return new Promise(resolve => {
    $api
      .request(url, params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//转为规划
export const btnseventPlanSaveApi = (params: any, url: any) => {
  return new Promise(resolve => {
    $api
      .request(url, params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        resolve(res)
        message.error(res.returnMessage)
      })
  })
}

//按钮操作集合
export const btnOptHandleApi = (params: any, url: any) => {
  return new Promise(resolve => {
    $api
      .request(url, params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

// 右键按钮操作
export const MindMenuClickApi = (params: any, url: any) => {
  return new Promise(resolve => {
    $api
      .request(url, params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}

//变更任务归属
export const affiliationApi = (params: any, url: any) => {
  return new Promise(resolve => {
    $api
      .request(url, params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//变更任务归属
export const confidenPortraitApi = (params: any, url: any) => {
  return new Promise(resolve => {
    $api
      .request(url, params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//查询统计派发数量
export const statisticDistrApi = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/countDistribute', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//查询统计状态
export const setStausNumberApi = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/countStatus', params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const showData = resData
          resolve(showData)
        } else {
          const showData = resData
          resolve(showData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

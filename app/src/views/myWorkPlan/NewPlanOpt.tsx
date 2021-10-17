/**
 * 规划右键或更多按钮操作
 */
import { requestApi } from '../../common/js/ajax'
import { message } from 'antd'
/**
 * 添加文件夹参数接口定义
 */
interface AddFolderParam {
  id?: string
  name: string
  zone: number
  parentId?: string
}
/**
 * 置顶文件夹参数接口定义
 */
interface TopedParam {
  optType: number //操作类型 1取消置顶 0置顶
  typeId: string
  type: number
  zone: string
}
interface MoveToDirParam {
  id: string
  type: number
  typeId: string
}
interface ShareToRoomParam {
  id: string //节点id
  type: number //类型：0个人 1项目组
  typeIds: Array<any> //数组、类型id
  name: string
  mainId: string
  typeId: string
  teamId: string
  teamName: string
  selRoomList: Array<RoomItem> //选中群数据数组
}

interface RoomItem {
  belongOrg: string
  belongType: string
  belongTypeId: string
  id: string
  muc: string
  subject: string
  talkType: number
  toPerson: Array<string>
}
interface ShareToUserParam {
  id: string //节点id
  type: number //类型：0个人 1项目组
  typeIds: Array<any> //数组、类型id
  name: string
  mainId: string
  typeId: string
}
/**
 * 添加文件夹
 */
export const addFolder = (paramObj: AddFolderParam) => {
  const param: any = {
    userId: $store.getState().nowUserId,
    name: paramObj.name, //文件名
  }
  if (paramObj.parentId) {
    param.parentId = paramObj.parentId
  }
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/folder/save',
      param: param,
      successMsg: '新建文件夹成功',
      apiType: 1,
    }).then(res => {
      resolve(res)
    })
  })
}

/**
 * 删除文件夹
 */
export const delFolder = (paramObj: { id: string }, attachObj?: any) => {
  const param: any = {
    id: paramObj.id,
  }
  return new Promise(resolve => {
    requestApi({
      url: '/task/work/plan/folder/delete',
      param: param,
      successMsg: '删除文件夹成功',
      apiType: 1,
    }).then((res: any) => {
      resolve(res)
    })
  })
}
/**
 * 重命名规划
 */
export const editPlanName = (paramObj: any) => {
  const param: any = {
    operateUser: $store.getState().nowUserId,
    id: paramObj.id,
    typeId: paramObj.typeId,
    name: paramObj.name, //文件名
    parentId: paramObj.parentId,
    // process: 0.0,
  }
  return new Promise(resolve => {
    requestApi({
      url: '/task/work/plan/setNode',
      param: param,
      json: true,
      successMsg: '重命名成功',
      apiType: 1,
    }).then(res => {
      resolve(res)
    })
  })
}

/**
 * 移动到文件夹确认
 * 移动到文件夹保存
 * id:文件夹id 0表示移动到我的规划中
 * type:被移动类型 0规划 1文件夹
 * typeId:被移动规划或文件夹的id
 */
export const moveToDirSave = (paramObj: MoveToDirParam, attachObj?: any) => {
  // 移动到我的规划传0
  const param: any = {
    id: paramObj.id,
    type: paramObj.type,
    typeId: paramObj.typeId,
    userId: $store.getState().nowUserId,
  }
  const optType = attachObj.optType
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/folder/move',
      param: param,
      successMsg: optType == 'drag' ? '拖动成功' : '移动成功',
    }).then(res => {
      resolve(res)
    })
  })
}
/************************************新接口************************************************* */
/**
 * 获取规划列表
 * @param userId 成员id
 * @param folderId 文件夹id
 * @param keyword 关键字
 */
export const getPlanListNew = (param: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/planning/findPlanningList', param, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then((res: any) => {
        if (res.returnCode === 0) {
          resolve({
            success: true,
            data: res.data,
            obj: res.obj,
            dataList: res.dataList,
          })
        } else {
          message.error(res.returnMessage)
          resolve({
            success: false,
          })
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
        resolve({
          success: false,
          data: res,
        })
      })
  })
}

/**
 * 新建文件夹
 * @param name 名称
 * @param userId 成员id
 * @param parentId 父文件夹id
 */
export const addFolderNew = (param: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/planning/folder/save', param, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then((res: any) => {
        if (res.returnCode === 0) {
          resolve({
            success: true,
            data: res.data,
            dataList: res.dataList,
          })
        } else {
          return message.error(res.returnMessage)
        }
      })
      .catch(function(res) {
        return message.error(res.returnMessage)
      })
  })
}
/**
 * 修改文件夹名称
 * @param id 文件夹id
 * @param name 名称
 */
export const modifyFolderNameNew = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/folder/modify',
      param,
      successMsg: '修改成功',
      apiType: 1,
    }).then(res => {
      resolve(res.data)
    })
  })
}
/**
 * 修改规划名称
 * @param id 规划id
 * @param name 名称
 */
export const modifyPlanNameNew = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/rename',
      param,
      successMsg: '修改成功',
      apiType: 1,
    }).then(res => {
      resolve(res.data)
    })
  })
}
/**
 * 查询文件夹单条数据
 * @param id 文件夹id
 */
export const queryFolderDataNew = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/folder/id',
      param,
      apiType: 1,
    }).then(res => {
      resolve(res.data)
    })
  })
}
/**
 * 查询规划单条数据
 * @param id 规划id
 */
export const queryPlanDataNew = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/id',
      param,
      apiType: 1,
    }).then(res => {
      resolve(res.data)
    })
  })
}
/**
 * 删除文件夹
 * @param id 文件夹id
 */
export const delFolderNew = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/folder/delete',
      param,
      successMsg: '删除成功',
      apiType: 1,
    }).then(res => {
      resolve(res)
    })
  })
}
/**
 * 删除规划
 * @param id 文件夹id
 */
export const delPlanNew = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/delete',
      param,
      successMsg: '删除成功',
      apiType: 1,
    }).then(res => {
      resolve(res)
    })
  })
}
/**
 * 置顶文件夹
 * @param userId 用户id
 * @param type 类型 0规划 1文件夹
 * @param typeId 对应类型id,为0标识拖动到我的规划中
 */
export const topFolderNew = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/top/save',
      param,
      successMsg: '置顶成功',
      apiType: 1,
    }).then(res => {
      resolve(res)
    })
  })
}
/**
 * 取消置顶文件夹
 * @param topId 置顶id
 */
export const cancelTopFolderNew = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/task/planning/top/delete',
      param,
      successMsg: '取消置顶成功',
      apiType: 1,
    }).then(res => {
      resolve(res)
    })
  })
}
/**
 * 新规划移动接口
 */
export const planOperationBtn = (type: any, id: any) => {
  return new Promise(resolve => {
    const param: any = {
      userId: $store.getState().nowUserId,
      viewType: type,
      id: id,
    }
    $api
      .request('/task/findOperationBtn', param, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then((res: any) => {
        if (res.returnCode === 0) {
          resolve({
            success: true,
            data: res,
          })
        } else {
          message.error(res.returnMessage)
          resolve({
            success: false,
          })
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
        resolve({
          success: false,
          data: res,
        })
      })
  })
}

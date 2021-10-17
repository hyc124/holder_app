/**
 * 规划右键或更多按钮操作
 */
// import React from 'react'
// import { planContext } from './workplan'
// import { Modal, Button } from 'antd'
import { requestApi } from '../../common/js/ajax'
import { shareToRoom } from '../../common/js/api-com'
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
export const addFolder = (paramObj: AddFolderParam, attachObj: any) => {
  const planContextObj = attachObj.planContextObj
  const param: any = {
    userId: $store.getState().nowUserId,
    name: paramObj.name, //文件名
    zone: paramObj.zone, //1我负责的，2派发给我的，3我创建的
  }
  if (paramObj.parentId) {
    param.parentId = paramObj.parentId
  }
  requestApi({
    url: '/task/work/plan/folder/add',
    param: param,
    successMsg: '新建文件夹成功',
  }).then(() => {
    planContextObj.findPlanList()
  })
}

/**
 * 重命名文件夹
 */
export const editFolderName = (paramObj: AddFolderParam, attachObj: any) => {
  const planContextObj = attachObj.planContextObj
  const param: any = {
    userId: $store.getState().nowUserId,
    id: paramObj.id,
    name: paramObj.name, //文件名
    zone: paramObj.zone, //1我负责的，2派发给我的，3我创建的
  }
  if (paramObj.parentId) {
    param.parentId = paramObj.parentId
  }
  requestApi({
    url: '/task/work/plan/folder/modify',
    param: param,
    successMsg: '文件夹重命名成功',
  }).then(() => {
    planContextObj.refreshData({
      optType: 'rename',
      viewType: 1,
      id: paramObj.id,
      newName: paramObj.name, //文件名
    })
  })
}

/**
 * 删除文件夹
 */
export const delFolder = (paramObj: { id: string }, attachObj?: any) => {
  const planContextObj = attachObj.planContextObj
  const param: any = {
    id: paramObj.id,
  }
  requestApi({
    url: '/task/work/plan/folder/delete',
    param: param,
    successMsg: '删除文件夹成功',
  }).then(() => {
    planContextObj.refreshData({
      optType: 'del',
      viewType: 1,
      id: paramObj.id,
    })
  })
}
/**
 * 置顶文件夹
 * type：1-文件夹 0规划
 */
export const topedFolder = (paramObj: TopedParam, attachObj?: any) => {
  const planContextObj = attachObj.planContextObj
  // 1取消置顶 0置顶
  const param = {
    userId: $store.getState().nowUserId,
    type: paramObj.type,
    typeId: paramObj.typeId,
    zone: paramObj.zone,
  }
  requestApi({
    url: '/task/work/plan/folder/setTop',
    param: param,
    successMsg: paramObj.type == 1 ? '置顶文件夹成功' : '置顶规划成功',
  }).then(() => {
    planContextObj.findPlanList()
  })
}
/**
 * 取消置顶文件夹
 */
export const cancelTopedFolder = (paramObj: { optType: number; topId: string }, attachObj?: any) => {
  const planContextObj = attachObj.planContextObj
  // 1取消置顶 0置顶
  const param: any = {
    topId: paramObj.topId,
  }
  requestApi({
    url: '/task/work/plan/folder/cancelTop',
    param: param,
    successMsg: '取消置顶成功',
  }).then(() => {
    planContextObj.findPlanList()
  })
}

/**
 * 重命名规划
 */
export const editPlanName = (paramObj: any, attachObj: any) => {
  const planContextObj = attachObj.planContextObj
  const param: any = {
    operateUser: $store.getState().nowUserId,
    id: paramObj.id,
    typeId: paramObj.typeId,
    name: paramObj.name, //文件名
    parentId: paramObj.parentId,
  }
  requestApi({
    url: '/task/work/plan/setNode',
    param: param,
    json: true,
    successMsg: '重命名成功',
  }).then(() => {
    planContextObj.findPlanList()
    // planContextObj.refreshData({
    //   optType: 'rename',
    //   viewType: 0,
    //   id: paramObj.id,
    //   newName: paramObj.name, //文件名
    // })
  })
}

/**
 * 删除规划
 */
export const delPlan = (paramObj: any, attachObj: any) => {
  const planContextObj = attachObj.planContextObj
  const param: any = {
    id: paramObj.id,
    mainId: paramObj.mainId,
    name: paramObj.name,
    operateUser: $store.getState().nowUserId,
    isAll: paramObj.isAll,
    typeId: paramObj.typeId,
  }
  if (paramObj.isDel) {
    param.isDel = paramObj.isDel
  }
  if (paramObj.firstId) {
    param.firstId = paramObj.firstId
  }
  if (paramObj.mainTypeId) {
    param.mainTypeId = paramObj.mainTypeId
  }
  requestApi({
    url: '/task/work/plan/delete',
    param: param,
    json: true,
    successMsg: '删除成功',
  }).then((res: any) => {
    if (res.success) {
      planContextObj.refreshData({
        optType: 'del',
        viewType: 0,
        id: paramObj.id,
        data: res.data,
      })
    }
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
  const planContextObj = attachObj.planContextObj
  // 移动到我的规划传0
  const param: any = {
    id: paramObj.id,
    type: paramObj.type,
    typeId: paramObj.typeId,
    userId: $store.getState().nowUserId,
    zone: planContextObj.planType,
  }
  const optType = attachObj.optType
  requestApi({
    url: '/task/work/plan/folder/move',
    param: param,
    successMsg: optType == 'drag' ? '拖动成功' : '移动成功',
  }).then(() => {
    planContextObj.findPlanList()
  })
}

/**
 * 保存选中的共享群
 */
export const shareToRoomSave = (paramObj: ShareToRoomParam) => {
  const param = {
    id: paramObj.id, //节点id
    operateUser: $store.getState().nowUserId,
    type: paramObj.type, //类型：0个人 1项目组
    typeIds: paramObj.typeIds, //数组、类型id
    name: paramObj.name,
    operateUserName: $store.getState().nowUser,
    mainId: paramObj.mainId,
  }
  requestApi({
    url: '/task/work/plan/share',
    param: param,
    successMsg: '已成功共享',
    json: true,
  }).then(res => {
    if (res.success) {
      // 群消息数据封装
      const shareObj = {
        id: paramObj.id,
        name: paramObj.name,
        type: 'workPlan',
        title: '工作计划',
        val: '',
        taskId: paramObj.typeId,
        mainId: paramObj.mainId,
        teamId: paramObj.teamId,
        teamName: paramObj.teamName,
      }
      shareToRoom({
        shareObj: shareObj,
        selRoomList: paramObj.selRoomList,
      })
    }
  })
}

/**
 * 查询已共享人员
 */
export const findShareUsers = (paramObj: { id: string }) => {
  return new Promise(resolve => {
    // 请求子节点数据
    const selParam: any = {
      shareUser: $store.getState().nowUserId,
      type: 0, //类型：0个人 1项目组
      id: paramObj.id, //计划id
    }
    requestApi({
      url: '/task/work/plan/findShareTypeId',
      param: selParam,
    }).then(res => {
      const dataList = []
      if (res.success) {
        const getData = res.data.data || {}
        for (const id in getData) {
          dataList.push({
            id: id,
            name: getData[id],
          })
        }
        resolve(dataList)
      }
    })
  })
}
/**
 * 共享到人
 */
export const shareToUserSave = (paramObj: ShareToUserParam) => {
  const param = {
    id: paramObj.id, //节点id
    operateUser: $store.getState().nowUserId,
    type: 0, //类型：0个人 1项目组
    typeIds: paramObj.typeIds, //数组、类型id
    name: paramObj.name,
    operateUserName: $store.getState().nowUser,
    mainId: paramObj.mainId,
  }
  console.log(param)
  return requestApi({
    url: '/task/work/plan/share',
    param: param,
    successMsg: '已成功共享',
    json: true,
  })
}

/**
 * 查询可编辑人员
 * @param {*} paramObj
 */
export const findEditMember = (paramObj: { id: any; mainId: string }) => {
  return new Promise(resolve => {
    const param: any = {
      id: paramObj.id,
      mainId: paramObj.mainId,
    }
    requestApi({
      url: '/task/work/plan/getAuth',
      param: param,
    }).then((res: any) => {
      if (res.success) {
        const dataList = res.data.dataList || {}
        resolve(dataList)
      } else {
        resolve([])
      }
    })
  })
}
/**
 * 保存可编辑人员
 * @param {*} paramObj
 */
export const saveEditMember = (paramObj: { id: string; name: string; receivers: any }) => {
  const param: any = {
    id: paramObj.id,
    name: paramObj.name,
    operateUser: $store.getState().nowUserId,
    operateUserName: $store.getState().nowUser,
    receivers: paramObj.receivers,
  }
  requestApi({
    url: '/task/work/plan/addAuth',
    param: param,
    json: true,
    successMsg: '编辑成功',
  })
}

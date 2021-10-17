export const initialState = {
  taskManageTreeId: '', //任务管理组织架构选中节点id
  taskManageTreeInfo: {
    isMy: true, //是否选中的我的任务
    orgInfo: {}, //组织架构选中信息
    allCompany: [], //所有企业
  }, //任务管理组织架构选中信息
  taskSupportTreeInfo: {
    isMy: true, //是否选中的我的任务
    orgInfo: {}, //组织架构选中信息
    allCompany: [], //所有企业
  }, //选择父级任务管理组织架构选中信息
  taskManage: {
    refreshTaskFn: {}, //刷新任务的全局方法
  }, //任务管理
  taskManageCreateTask: {
    isMy: true, //是否选中的我的任务
    orgInfo: {}, //当前创建任务企业信息
  }, //任务管理创建任务组织架构选中信息
}
//任务管理组织架构树选中节点id
export function TASKMANAGE_TREEID(state: StoreStates, data: any) {
  return {
    taskManageTreeId: data.data,
  }
}
//任务管理组织架构树选中节点信息
export function TASKMANAGE_TREEINFO(state: StoreStates, data: any) {
  const taskManageTreeInfo = state.taskManageTreeInfo
  if (data.data.isMy != undefined) {
    taskManageTreeInfo.isMy = data.data.isMy
  }
  if (data.data.orgInfo != undefined) {
    taskManageTreeInfo.orgInfo = data.data.orgInfo
  }
  if (data.data.allCompany != undefined) {
    taskManageTreeInfo.allCompany = data.data.allCompany
  }
  return {
    taskManageTreeInfo: taskManageTreeInfo,
  }
}
//父级务管理组织架构树选中节点信息
export function TASKSUPPORTMANAGE_TREEINFO(state: StoreStates, data: any) {
  const taskSupportTreeInfo = state.taskSupportTreeInfo
  if (data.data.isMy != undefined) {
    taskSupportTreeInfo.isMy = data.data.isMy
  }
  if (data.data.orgInfo != undefined) {
    taskSupportTreeInfo.orgInfo = data.data.orgInfo
  }
  if (data.data.allCompany != undefined) {
    taskSupportTreeInfo.allCompany = data.data.allCompany
  }
  return {
    taskSupportTreeInfo: taskSupportTreeInfo,
  }
}
//任务管理公用
export function TASKMANAGE(state: StoreStates, data: any) {
  const taskManage = state.taskManage
  if (data.data.refreshTaskFn != undefined) {
    taskManage.refreshTaskFn = data.data.refreshTaskFn
  }
  return {
    taskManage: taskManage,
  }
}
//任务管理创建任务组织架构选中信息
export function TASKMANAGE_CREATETASK(state: StoreStates, data: any) {
  const taskManageCreateTask = state.taskManageCreateTask
  if (data.data.isMy != undefined) {
    taskManageCreateTask.isMy = data.data.isMy
  }
  if (data.data.orgInfo != undefined) {
    taskManageCreateTask.orgInfo = data.data.orgInfo
  }
  return {
    taskManageCreateTask: taskManageCreateTask,
  }
}
declare global {
  interface StoreStates {
    taskManage: any
    taskManageTreeId: any
    taskManageTreeInfo: any
    taskSupportTreeInfo: any
    taskManageCreateTask: any
  }
  interface StoreActions {
    TASKMANAGE_TREEID: string
    TASKMANAGE_TREEINFO: string
    TASKSUPPORTMANAGE_TREEINFO: string
    TASKMANAGE: string
    TASKMANAGE_CREATETASK: string
  }
}

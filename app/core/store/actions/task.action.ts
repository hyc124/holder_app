export const initialState = {
  taskdetail: null, //任务详情
  editdetailid: null, //编辑任务详情的id
  createTaskToDo: false, //记住创建任务待办勾选状态
}

//任务详情
export function TASK_DETAIL(state: StoreStates, data: any) {
  return { taskdetail: data.data }
}
//编辑任务详情后id
export function EDIT_DETAIL_ID(state: StoreStates, data: any) {
  return { editdetailid: data.data }
}
//记住创建任务待办勾选状态
export function CREATETASKTODO(state: StoreStates, data: any) {
  return { createTaskToDo: data.data }
}
declare global {
  interface StoreStates {
    taskdetail: any
    editdetailid: any
    createTaskToDo: any
  }
  interface StoreActions {
    TASK_DETAIL: string
    EDIT_DETAIL_ID: string
    CREATETASKTODO: string
  }
}

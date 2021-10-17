import React, { useRef, useReducer, useState, useEffect } from 'react'
import { Spin } from 'antd'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { getAuthStatus } from '../../common/js/api-com'
import { TaskOrg } from './taskManage/TaskOrg'
import { TaskManageList, refreshListFn } from './taskManage/TaskManageList'
import CreatTask from '../task/creatTask/creatTask'
import './taskManage.less'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import { loadLocales } from '@/src/common/js/intlLocales'
import { CreateTaskModal } from './creatTask/createTaskModal'
import TaskManageHeader from './taskManage/taskManageHeader'

// 创建任务管理上下文数据
export const taskManageContext = React.createContext({})
// export const RNDContext = createDndContext(HTML5Backend)

// 记录拖动任务行，用于拖动到组织架构触发时判断使用
export let taskRowDrag: any = { begin: false }
export const setTaskRowDrag = ({ begin, rowData }: any) => {
  taskRowDrag = {
    begin,
    rowData,
  }
}
export const getTaskRowDrag = () => {
  return taskRowDrag
}

//是否是主任务创建
export let ismainCreat = false
export const setMainCreat = (val: boolean) => {
  ismainCreat = val
}

const TaskManage = () => {
  //   组件架构容器组件
  const taskListRef: any = useRef(null)

  // 监听是否列表数据有加载导致变化,用于初始组件时
  const [listChange, setListChange] = useState(0)

  const opencreattask = false
  let [nowtype] = useState<any>('')

  // 创建任务弹框组件
  const createTaskRef = useRef<any>({})
  // 头部组件
  let headerRef: any = useRef(null)
  // 初始状态值
  const stateTmp = {
    orgShow: true,
    search: '',
    orgMy: true,
    mainLoading: false,
    pattern: 0, //0鼠标移入隐藏显示组织架构 1默认显示组织架构
    reload: false,
  }
  /**
   * 组织架构相关reducer
   * @param state
   * @param action
   * action.type:传数组（元素为要更改的state参数名），data对象包含要更改的值，以此可更改多个state值
   */
  const taskReducer = (state: any, action: { type: any; data: any }) => {
    const getState = { ...state }
    action.type.map((item: any) => {
      // item是要更改的参数，getState[item]是获取的state旧值,action.data[item]为新更新的值
      if (Array.isArray(action.data[item])) {
        const getArr = [...action.data[item]]
        getState[item] = getArr
        stateTmp[item] = getArr
      } else {
        getState[item] = action.data[item]
        stateTmp[item] = action.data[item]
      }
    })
    return { ...getState }
  }
  const [taskState, dispatch] = useReducer(taskReducer, stateTmp)

  // 初始化监听
  useEffect(() => {
    // 初始化多语言配置
    loadLocales()
    // 保存刷新全局方法
    $store.dispatch({
      type: 'TASKMANAGE',
      data: { refreshTaskFn },
    })
    // setNavWidth(_listMode, true)
    return () => {
      headerRef = null
      // _listMode = 1
    }
  }, [])

  /**
   * 列表初始查询数据
   */
  const taskListInit = (paramObj: any) => {
    // 查询任务列表
    taskListRef.current.taskListInit(paramObj)
    // 初始表头数据
    headerRef?.current.setInitStateFn()
  }

  // 设置导航头部宽度 ,如果是宽详情，重置头部宽度
  // const setNavWidth = (key: number, init?: boolean) => {
  //   if (key != 1) return
  //   let nameWid = 354
  //   const win: any = $(window)
  //   if (win.width() < 1404) {
  //     nameWid = 280
  //   }

  //   const setDom: any = $('.secondPageNavTop')[0]

  //   if (init) return $(setDom).width(nameWid)
  //   const domWidth = taskListRef.current.getNameColwidth()
  //   const nowWidth = domWidth != 0 ? domWidth : nameWid
  //   $(setDom).width(nowWidth)
  // }

  // ************************查询**********************************//

  /**
   * 刷新任务类的方法
   * type:操作类型
   */
  const refreshTaskFn = (type: string) => {
    switch (type) {
      case 'taskType': //刷新任务类型和一类标签
        console.log('taskType')
        taskListInit({ init: 'taskType' })
        break
      case 'tableHead': //刷新任务列表表头
        console.log('tableHead')
        // 查询任务列表
        taskListRef.current.taskListInit({ init: 'tableHead' })
        break
      default:
        break
    }
  }

  /**
   * 高级筛选选择后
   */
  const afterFilter = () => {
    taskListRef.current.queryTaskList({
      search: true,
    })
  }

  /**
   * 按钮权限获取
   */
  const getBtnAuth = () => {
    console.log('任务管理模块 form taskManage.ts 根据企业 获取权限列表-----------------------')
    const taskInfo = $store.getState().taskManageTreeInfo
    let tableSet = false,
      theadSet = false,
      tagSetAuth = true
    // 一类标签管理按钮权限
    const addTagAuth = getAuthStatus('taskTagUpdate')
    const dragTagAuth = getAuthStatus('taskTagConfigSave')
    if (!taskInfo.isMy && !addTagAuth && !dragTagAuth) {
      tagSetAuth = false
    } else {
      tagSetAuth = true
    }

    // 我的任务下不可以配置企业优先级，屏蔽按钮
    if (!taskInfo.isMy) {
      tableSet = true
    } else {
      tableSet = false
    }
    //8.12 创建任务权限
    const addTaskAuth = getAuthStatus('taskFind')
    //表头设置权限
    const formSetting = getAuthStatus('taskFormSet')
    //含金量设置权限
    const glodSave = getAuthStatus('taskGlodSet')
    //进度颜色设置权限
    const progressColor = getAuthStatus('taskProgressColorSet')
    //工作时长设置权限
    const workHours = getAuthStatus('taskWorkTimeSet')
    if (!glodSave && !progressColor && !workHours) {
      tableSet = false
    }
    if (formSetting && !taskInfo.isMy) {
      theadSet = true
    } else {
      // 宽详情么有设置表头按钮
      theadSet = false
    }
    return {
      tagManageAuth: tagSetAuth,
      tableSet: tableSet,
      theadSet: theadSet,
      addTaskAuth,
    }
  }

  // 上下文数据
  const taskContextObj = {
    taskState,
    taskListInit,
    queryTaskTypeInit: headerRef?.current?.queryTaskTypeInit,
    filterRes: headerRef?.current?.getFilterRes,
    getBtnAuth: getBtnAuth,
    listMode: headerRef?.current?.getListMode,
    setMainLoading: (flag: boolean) => {
      dispatch({
        type: ['mainLoading'],
        data: { mainLoading: flag },
      })
    },
    getTaskTypeOutData: headerRef?.current?.getTaskTypeOutData,
    searchRef: headerRef?.current?.searchRef,
  }

  /**
   * 打开创建任务
   */
  const setOpencreattask = (flag: boolean) => {
    if (flag) {
      const param = {
        from: $store.getState().taskManageTreeInfo.isMy && ismainCreat ? 'taskManage_my' : 'taskManage', //来源
        nowType: ismainCreat ? nowtype : $store.getState().taskManageCreateTask.orgInfo.curType, //0个人任务 2企业任务 3部门任务
        teaminfo: '', //企业信息
        taskmanageData: ismainCreat
          ? $store.getState().taskManageTreeInfo
          : $store.getState().taskManageCreateTask, //任务管理相关参数

        visible: true,
        createType: 'add',
        id: '',
        taskType: 0, //任务
        callbacks: ({ data, parentId }: any) => {
          const filterObj: any = headerRef?.current.getFilterRes()
          const _filterObj = filterObj.taskTypes.concat(filterObj.taskTypeTags)
          // 如果存在筛选任务类型条件，不符合则无需刷新列表
          if (!_filterObj.includes(-1) && !_filterObj.includes(data.type)) {
            return
          }

          const optType = 'addTask'
          const param: any = { optType, taskIds: [data.id || ''], parentId }
          if (parentId) {
            param.optType = 'addChildTask'
            param.newChild = data
          }

          refreshListFn(param)
        },
      }
      createTaskRef.current && createTaskRef.current.setState(param)
    }
  }

  // const manager = useRef(RNDContext)

  return (
    <taskManageContext.Provider value={taskContextObj}>
      <DndProvider backend={HTML5Backend}>
        <section className="secondPageContainer taskManageContainer flex-1 flex scrollbarsStyle">
          <aside
            className={`orgLeftCon flex column ${taskState.orgShow ? 'showwidth' : 'hidewidth'} ${
              taskState.pattern == 0 ? 'wideMode' : 'tableModel'
            }`}
          >
            <header className="pageLeftHeader">
              <em
                className="img_icon org_fold_icon chose"
                onClick={() => {
                  dispatch({
                    type: ['orgShow'],
                    data: { orgShow: false },
                  })
                }}
              ></em>
            </header>
            {/* 左侧组织架构 */}
            <TaskOrg
              param={{
                orgChange: 1,
                setOpencreattask: setOpencreattask,
              }}
            />
          </aside>
          <Spin spinning={taskState.mainLoading} wrapperClassName="rightConLoading flex-1">
            <main className="orgRightCon flex-1 h100">
              {/* 头部 */}
              <TaskManageHeader
                ref={headerRef}
                param={{
                  taskListRef,
                  createTask: (flag: boolean) => {
                    ismainCreat = flag
                    setOpencreattask(flag)
                  },
                  expandOrg: () => {
                    // 展开侧边栏
                    dispatch({
                      type: ['orgShow', 'pattern'],
                      data: { orgShow: true, pattern: 1 },
                    })
                  },
                  afterFilter,
                  setNowtype: (type: number) => {
                    nowtype = type
                  },
                }}
              />
              {/* 表格 */}
              <TaskManageList
                ref={taskListRef}
                positionTop={135}
                param={{
                  listChange: listChange,
                  headerRef,
                }}
                action={{
                  setListChange: (flag: number) => {
                    setListChange(flag)
                  },
                  createTask: () => {
                    ismainCreat = true
                    setOpencreattask(true)
                  },
                }}
              />
            </main>
          </Spin>
        </section>
        {/* 创建任务 */}
        {opencreattask && (
          <CreatTask
            param={{ visible: opencreattask }}
            datas={{
              from: $store.getState().taskManageTreeInfo.isMy && ismainCreat ? 'taskManage_my' : 'taskManage', //来源
              isCreate: 0, //创建0 编辑1
              nowType: ismainCreat
                ? headerRef?.current.nowtype
                : $store.getState().taskManageCreateTask.orgInfo.curType, //0个人任务 2企业任务 3部门任务
              teaminfo: '', //企业信息
              taskmanageData: ismainCreat
                ? $store.getState().taskManageTreeInfo
                : $store.getState().taskManageCreateTask, //任务管理相关参数
            }}
            setvisible={(state: any) => {
              setOpencreattask(state)
              ismainCreat = false
            }}
            callbacks={({ data, parentId }: any) => {
              const filterObj: any = headerRef?.current.getFilterRes()
              const _filterObj = filterObj.taskTypes.concat(filterObj.taskTypeTags)
              // 如果存在筛选任务类型条件，不符合则无需刷新列表
              if (!_filterObj.includes(-1) && !_filterObj.includes(data.type)) {
                return
              }

              const optType = 'addTask'
              const param: any = { optType, taskIds: [data.id || ''], parentId }
              if (parentId) {
                param.optType = 'addChildTask'
                param.newChild = data
              }

              refreshListFn(param)
            }}
          ></CreatTask>
        )}
        <CreateTaskModal ref={createTaskRef} />
        <DownLoadFileFooter fromType="mainWin" />
      </DndProvider>
    </taskManageContext.Provider>
  )
}
export default TaskManage

import React, {
  useReducer,
  useImperativeHandle,
  useContext,
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
} from 'react'
import { Table, Tooltip, Dropdown, Input, Modal } from 'antd'
import { Resizable } from 'react-resizable'
import { useDrop, useDrag } from 'react-dnd'
import update from 'immutability-helper'
import NoneData from '@/src/components/none-data/none-data'
import TaskListOpt from '@/src/views/workdesk/component/TaskListOpt'
import { requestApi } from '../../../common/js/ajax'
import { getAuthStatus, getTaskBtnApi } from '../../../common/js/api-com'
import {
  transferTask,
  assignTask,
  editTaskApi,
  editTaskPriApi,
  moveTaskTagApi,
  quickCreateTask,
  queryTaskById,
  subscribeReportApi,
} from '../taskComApi'
import { followTask, unFollowTask } from '@/src/views/task/taskOptCom/taskOptCom'
import {
  TaskListTags,
  countDownShow,
  // taskTypeName,
  setTagByStatus,
  RoleComponet,
  TaskTypeTag,
} from '../task-com/TaskCom'
import { taskManageContext, setTaskRowDrag } from '../TaskManage'
import TableHeadSetModal from '../../task/tableHeadSet/tableHeadSetModal'
import { SelectMemberOrg } from '../../../components/select-member-org/index'
// import TaskWideDetail from '../taskDetail/taskWideDetail'
import DetailModal, { DetailModalExp } from '@/src/views/task/taskDetails/detailModal'

import Priority from '../creatTask/priority'
import { FileDetailModal } from '../taskModal/fileDetaiModal'
import { ReportMangerModel } from '../../DailySummary/component/ReportMangerModel'
import { refreshDetails } from '../taskDetail/details'
import TaskWideDetails from '../taskDetails/taskWideDetail'
// import { updateNoDataImg, updateNoDataTip } from '../taskDynamic/dynamicCom'
import '@/src/common/js/jquery.resize'
import CheckEntryModal from '../creatTask/checkEntryModal'
import Forcereport from '../../force-Report/force-Report'
import { _listMode } from './taskManageHeader'
import { NEWAUTH812 } from '@/src/components'
import { refreshFindThemeList } from '../taskSynergy/taskSynergy'
// 静态初始化state数据，始终不变，用于还原数据
const stateOne: any = {
  columns: [],
  contentList: [],
  expandedRowKeys: [], //展开的行
  headerList: [], //后台返回的表头数据
  loading: false,
  hasMorePage: true, //是否还有下一页，可滚动加载
  listPageNo: 0,
  scrollY: 800, //表格滚动区域高度
  queryState: '',
}
let stateTmp: any = JSON.parse(JSON.stringify(stateOne))
// 滚动加载的分页
let listPageNo = 0
// 任务管理上下文数据
// 注：state设置为异步，上下文里数据用的state可能还没及时更改，所以加载完成后的操作才适合用此数据
let taskContext: any
// 任务列表第一个任务
let firstTask: any = {}
// 缓存当前任务名列宽
let nameColWid = 353
// 宽详情信息缓存
let wideDetailTmp: any = { taskId: '' }
// 当前任务id（详情刷新用）
let nowTask: any = {}
// 删除第一条任务后
let delFirst = false
// 记录当前进入的详情
let nowDetailTask: any = {}
// 任务列表数据map表
let treeListMap: any = {}
// 列表查询参数缓存
let getFilterResFn: any = null
export let setNowDetailTaskExp: any = null
// 刷新任务方法
export let refreshListFn: any = null
// 当前查询列表是否需要初始化
let listInit: any = false

/**
 * 拖动组件包装表头
 */
const ResizableTitle = (props: any) => {
  const { onResizeStart, onResize, thContent, colData, width, ...restProps } = props
  if (!width) {
    return <th {...restProps} />
  }
  const { code } = colData
  return (
    <Resizable
      key={code}
      width={width}
      height={0}
      handle={<span className="react-resizable-handle" />}
      onResize={onResize}
      onResizeStart={onResizeStart}
      draggableOpts={{ enableUserSelectHack: true }}
    >
      <th key={code} {...restProps}>
        {thContent()}
      </th>
    </Resizable>
  )
}
/**
 * 拖动组件包装表格行
 */
const DragableBodyRow = (props: any) => {
  const { index, rowData, dragTaskCheck, className, style, ...restProps } = props
  // console.log(rowData)
  // 拖动移入后的hover样式
  const [dropClass, setDropClass] = useState('')
  // 记录当前拖动放置位置 up目标上方 mid目标中间 down目标下方
  let dragPos = ''
  // 绑定拖动放置
  let targetNode: any = null
  const [{ isOver }, drop] = useDrop({
    accept: 'dragBodyRow',
    collect: monitor => {
      const { index: dragIndex } = monitor.getItem() || {}
      if (dragIndex === index) {
        return {}
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: dropClass,
      }
    },
    hover: (_: any, monitor: any) => {
      const item = monitor.getItem() || {}
      if (item.index === index) {
        return {}
      }
      // 当前鼠标位置
      const client = monitor.getClientOffset() || {}
      // 目标节点
      targetNode = dragRef.current
      const targetY: number = jQuery(targetNode).offset()?.top || 0
      const targetH: number = jQuery(targetNode).outerHeight() || 0
      // 目标节点上方三分之一处，上方添加边框线
      if (client.y < targetY + targetH * 0.3) {
        setDropClass('drop-over-upward')
        dragPos = 'up'
      }
      // 目标节点上方三分之三处，下方添加边框线
      else if (client.y > targetY + targetH * 0.6) {
        setDropClass('drop-over-downward')
        dragPos = 'down'
      }
      // 目标节点上方三分之二处，添加背景色
      else {
        setDropClass('drop-over-bg')
        dragPos = 'mid'
      }
      // console.log('hover', client, targetY)
    },
    drop: (_: any, monitor: any) => {
      const sourceItem = monitor.getItem() || {}
      dragTaskCheck({
        sourceRow: Object.assign({}, sourceItem.rowData),
        targetRow: rowData,
        dragPos: dragPos,
        targetNode: targetNode,
      })
    },
  })

  const dragRef: any = useRef(null)
  const [, drag] = useDrag({
    item: { type: 'dragBodyRow', index: index, rowData: rowData, sourceNode: dragRef },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      let drag = true
      if (
        $(dragRef.current)
          .find('.taskListNameInp')
          .is(':visible')
      ) {
        drag = false
      }
      return drag
    },
    begin: () => {
      setTaskRowDrag({
        begin: true,
        rowData: rowData,
      })
    },
    end: () => {
      // 拖动到组织架构结束后移除所有hover效果
      setTaskRowDrag({
        begin: false,
        rowData: {},
      })
      $('#taskOrgTreeOut')
        .find('.drop-over-bg')
        .removeClass('drop-over-bg')
    },
  })
  if (rowData && !rowData.newAdd) {
    drag(drop(dragRef))
  }
  // key
  const key = rowData ? rowData.id : index
  return (
    <tr
      key={key}
      ref={dragRef}
      className={`${className} ${rowData && rowData.childLevel ? 'treeTableChild' : ''} ${
        isOver ? dropClass : ''
      }`}
      style={{ ...style }}
      {...restProps}
    />
  )
}
/**
 * 拖动组件包装表格单元格
 */
const DragableBodyCell = (props: any) => {
  const dragRef: any = useRef(null)
  const { listMode, rowData, rowIndex, colIndex, refreshTaskList, className, style, ...restProps } = props
  // 任务名列详情点击时加active
  // const [wideActive, setWideActive] = useState('')
  // 绑定拖动放置
  const [{ isOver, dropClassName }, droper] = useDrop({
    accept: 'taskTypeDrag',
    collect: monitor => {
      return {
        isOver: monitor.isOver(),
        dropClassName: 'drop-over-bg',
      }
    },
    drop: (_: any, monitor: any) => {
      const sourceItem = monitor.getItem().itemData || {}
      const targetItem = rowData
      if (!targetItem) {
        return
      }
      // 编辑任务标签
      moveTaskTagApi({
        taskId: targetItem.id,
        tagId: sourceItem.code,
        successMsg: '移动标签成功',
      }).then(() => {
        refreshTaskList({
          taskIds: [targetItem.id],
          childLevel: targetItem.childLevel,
        })
      })
    },
  })

  // 任务名列才可以接受标签拖放
  if (className.includes('taskNameTd')) {
    droper(dragRef)
  }

  return (
    <td
      key={rowIndex + '_' + colIndex}
      ref={dragRef}
      className={`${className} ${isOver ? dropClassName : ''} ${
        listMode == 1 && nowTask.id == rowData.id ? 'wide_active' : ''
      }`}
      style={{ ...style }}
      {...restProps}
    />
  )
}
/**
 * 任务管理列表
 */
const TaskManageList = React.forwardRef((props: any, ref) => {
  // 继承父组件的参数和方法
  const ptParam = props.param
  // 头部ref
  getFilterResFn = props.param.headerRef?.current?.getFilterRes || null
  // 获取头部标签筛选
  // const taskTypeOutData = props.param.headerRef?.current?.getTaskTypeOutData() || []
  taskContext = useContext(taskManageContext)
  // 防止state中的listMode没有及时更新，用全局变量赋值
  taskContext.listMode = _listMode
  const taskOrgInfo: any = $store.getState().taskManageTreeInfo
  // 表头排序
  let thSortObj = { priority: '', limitTime: '' }
  // 选人弹框显示隐藏
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  // 表头设置按钮权限
  const [theadSetAuth, setTheadSetAuth] = useState(false)
  /**
   * 数据reducer
   * @param state
   * @param action
   */
  const taskListReducer = (state: any, action: { type: any; data: any }) => {
    const getState = { ...state }
    action.type.map((item: any) => {
      // item是要更改的参数，getState[item]是获取的state旧值,action.data[item]为新更新的值
      if (Array.isArray(action.data[item])) {
        const getArr: any = [...action.data[item]]
        getState[item] = getArr || []
        stateTmp[item] = getArr || []
      } else {
        getState[item] = action.data[item]
        stateTmp[item] = action.data[item]
      }
    })
    return { ...getState }
  }
  const [taskListState, dispatch] = useReducer(taskListReducer, { ...stateTmp })

  // //显示隐藏检查项
  const [opentEntry, setOpentEntry] = useState(false)
  //打开强制汇报
  const [openforce, setOpenforce] = useState(false)
  //点击的企业id及名称
  const [ascription, setAscription] = useState<any>()
  const [taskid, setTaskid] = useState<any>()
  // 当前任务数据
  const [taskData, setTaskData] = useState<any>({})
  const [reportModel, setReportModel] = useState<any>({
    visible: false,
    data: {},
  })
  // 附件详情弹框
  const [fileModal, setFileModal] = useState<any>({
    visible: false,
    taskId: '',
    ascriptionId: '',
  })
  // 宽详情任务id
  const [wideDetail, setWideDetail] = useState<any>({ mode: 1, taskId: '', refresh: 0 })

  // 拖动到不同类型弹框
  const [dragDiffModal, setDragDiffModal] = useState<any>({
    visible: false,
    content: '',
  })
  // 宽详情组件
  const wideDetailRef = useRef<any>(null)
  // 详情弹框组件
  const detailRef = useRef<DetailModalExp>(null)
  /**
   * 初始化数据
   */
  const selMemberOrgInit: any = {
    teamId: '',
    sourceType: '', //操作类型(或来源)
    allowTeamId: [],
    selectList: [], //选人插件已选成员
    checkboxType: 'radio',
    findType: 0, //查询类型 0人员 3部门 31岗位 310岗位人员
    permissionType: 3, //组织架构通讯录范围控制
    showPrefix: false, //不显示部门岗位前缀
  }
  const [selMemberOrg, setSelMemberOrg] = useState({ ...selMemberOrgInit })
  /**
   * 监听是否列表数据有加载导致变化
   */
  useLayoutEffect(() => {
    // setTbodyH()
    // 绑定表格滚动事件
    $('#taskManageListTableSec')
      .off('mousewheel')
      .on('mousewheel', '.ant-table-body', (e: any) => {
        // 下滚加载分页
        if (e.originalEvent.wheelDelta <= 0) {
          scrollOnLoad()
        }
      })
    // 任务管理窗口改变事件
    $('.taskManageListTableSec')
      .off('resize')
      .on('resize', () => {
        // console.log('taskManageListTableSec resize')
        $('.taskManageListContainer .taskManageListTable .ant-table-body').removeClass('hidescroll')
        // setTbodyH()
        setColWid()
      })
    /**
     * 刷新方法
     * useType：1列表操作调用 0外部调用
     * rowData:当前操作任务数据对象
     */
    refreshListFn = (param: {
      optType: string
      taskIds?: any
      childLevel?: boolean
      useType?: number
      newTaskId?: any
      parentIdOld?: any
      parentId?: any
      from?: string
      newChild?: any
      attachInfo?: {
        //附属信息
        priType?: number //优先级类型
        [propName: string]: any
      }
    }) => {
      const { from, newChild } = param
      let taskIds: any = [],
        childLevel = false
      const optType = param.optType || ''
      if (param.useType == 1 || optType == 'addTask') {
        taskIds = param.taskIds
        childLevel = param.childLevel || false
      } else {
        taskIds = from == 'taskDetail' ? [nowDetailTask.id || ''] : [nowTask.id || '']
        childLevel = nowTask.childLevel
      }
      // 指派需要查询出新任务，然后新增子任务到父任务
      const refreshParam: any = {
        ...param,
        optType,
        taskIds,
        childLevel,
        from,
      }
      if (optType == 'addChildTask' || optType == 'assign') {
        refreshParam.parentId = taskIds[0] || ''
        refreshParam.newChild = newChild || {}
      }
      if (optType == 'assign') {
        // 查询新增任务
        queryTaskById({ taskIds: [param.newTaskId] }).then((dataList: any) => {
          refreshTaskList({
            ...refreshParam,
            newChild: dataList[0] || {},
          })
        })
      } else {
        refreshTaskList({
          ...refreshParam,
          attachInfo: param.attachInfo || {},
        })
      }
    }

    // 组件销毁的时候关闭事件
    return () => {
      $('#taskManageListTableSec').off('mousewheel')
      $(window).off('resize')
    }
  }, [ptParam.listChange])

  useEffect(() => {
    setNowDetailTaskExp = setNowDetailTask
    return () => {
      listPageNo = 0
      getFilterResFn = null
    }
  }, [])
  // ***********************暴露给父组件的方法 start**************************//
  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(ref, () => ({
    //初始化查询类型和表格数据
    taskListInit: (paramObj: any) => {
      // console.log('初始化任务管理的查询数据')
      taskListInit(paramObj)
    },
    /**
     * 查询当前状态的表格数据
     */
    queryTaskList: (paramObj: any) => {
      // 搜索任务时，清空map表
      if (paramObj.search) {
        treeListMap = {}
      }
      queryTaskList(paramObj)
    },
    /**
     * 任务模式切换 0表格 1宽详情
     */
    taskModeChange: (mode: number) => {
      jQuery('#taskManageListTableSec')
        .find('.wide_active')
        .removeClass('wide_active')
      if (mode == 1) {
        jQuery('#taskManageListTableSec').addClass('wide_detail')
        findDetailByMode({
          mode: mode,
          taskId: firstTask.id,
          taskData: firstTask,
          widChange: true,
        })
      } else {
        // setTbodyH(33)
        setWideDetail({ ...wideDetail, mode: mode })
        jQuery('#taskManageListTableSec').removeClass('wide_detail')
      }
    },
    /**
     * 获取当前列表是否初始化查询
     */
    getListInit: () => {
      return listInit
    },
    // 获取当前任务名称列宽度
    getNameColwidth: () => {
      return nameColWid
    },
    // 获取当前任务列表长度
    getTaskListLength: () => {
      return taskListState.contentList.length
    },
  }))
  // ***********************暴露给父组件的方法 end**************************//

  const setNowDetailTask = ({ findId }: any) => {
    nowDetailTask = treeListMap[findId] ? treeListMap[findId] : { id: findId }
  }

  /**
   * 窗口变化时重新设置列宽
   */
  const setColWid = () => {
    if (stateTmp.columns.length > 0) {
      const win: any = $(window)
      let nameWid = 240
      if (win.width() < 1404) {
        nameWid = 280
      }
      stateTmp.columns[0].width = nameWid
      const newCol = renderCol([...stateTmp.columns])
      $('.secondPageNavTop').css({ width: nameWid + 'px' })
      $('#taskWideDetail').css({ width: `calc(100% - ${nameWid}px)` })
      dispatch({
        type: ['columns'],
        data: { columns: [...newCol] },
      })
    }
  }

  /**
   * 滚动加载
   */
  const scrollOnLoad = () => {
    if (!stateTmp.hasMorePage) {
      return
    }
    // 监听表格滚动事件
    const scrollTable = jQuery('#taskManageListTableSec .ant-table-body')
    const viewH = scrollTable.height() || 0 //可见高度
    const contentH = scrollTable[0].scrollHeight || 0 //内容高度
    const scrollTop = scrollTable.scrollTop() || 0 //滚动高度
    if (contentH - viewH - scrollTop <= 5) {
      // 防止多次触发，等本次加载完
      stateTmp.hasMorePage = false
      listPageNo = listPageNo + 1
      queryTaskList({
        scrollLoad: true,
      })
    }
  }

  // 初始化查询列表
  const taskListInit = ({ init }: any) => {
    treeListMap = {}
    // setTbodyH()
    const btnAuth = taskContext.getBtnAuth()
    setTheadSetAuth(btnAuth.theadSet || false)
    queryTaskList({ init })
    $('#addChildTaskTr').remove()
  }

  /**
   * 查询列表数据
   */
  const queryTaskList = (infoObj?: any) => {
    return new Promise((resolve: any) => {
      const paramObj = infoObj ? infoObj : {}

      // 获取筛选结果
      let fliterObj: any = {}
      if (paramObj.init) {
        stateTmp = stateOne
        listInit = true
        fliterObj =
          getFilterResFn?.({
            filterInit: paramObj.init,
          }) || {}
      } else {
        listInit = false
        fliterObj = getFilterResFn?.() || {}
      }

      // 列表数据是否重置，需要选中第一个任务
      let firstReset = false
      if (paramObj.init || paramObj.search) {
        firstReset = true
      }

      const orgInfo = $store.getState().taskManageTreeInfo
      const selInfo = $store.getState().taskManageTreeInfo.orgInfo
      let selectType = 0
      let selectTypeId = ''
      let _userId: any = ''
      if (!orgInfo.isMy) {
        selectType = selInfo.curType
        selectTypeId = selInfo.curId
        //选人的时候才传userId
        if (selectType == 0) {
          selectType = 3
          _userId = selectTypeId
          selectTypeId = selInfo.parentId
        }
      } else {
        //我的任务
        _userId = $store.getState().nowUserId
      }
      // 企业id，查询我的任务时传0
      const enterpriseId = orgInfo.isMy ? 0 : selInfo.cmyId
      //非滚动加载下一页，初始请求页码
      if (!paramObj.scrollLoad) listPageNo = 0
      const param: any = {
        showType: 0,
        taskType: fliterObj.taskTypes, //任务类型
        tagIds: fliterObj.taskTypeTags, //任务标签
        type: selectType,
        id: selectTypeId,
        enterpriseId: enterpriseId,
        userId: _userId,
        loginUserId: $store.getState().nowUserId,
        account: $store.getState().nowAccount,
        pageNo: listPageNo,
        pageSize: 20,
        level: (fliterObj.levelList && fliterObj.levelList[0]) || 0,
        startTime: fliterObj.startTime || '',
        endTime: fliterObj.endTime || '',
        keyword: fliterObj.taskKeyword || '',
        tagKeyword: fliterObj.tagSearchVal || '',
        noReport: fliterObj.noReport || 0, //无汇报任务
        toFile: fliterObj.toFile || 0, //已归档任务
        star: fliterObj.priorityList || [], //星级筛选
        ascriptionLevel: fliterObj.rankList || [], //级别筛选
        departLevel: fliterObj.deptList || [], //部门筛选
      }
      if (fliterObj?.statusList?.length > 0) {
        param.status = fliterObj.statusList
      }

      // 表头排序
      if (thSortObj.limitTime) {
        //orderType=2
        param.orderType = 2
        // orderAsc 1正序 0倒序
        param.orderAsc = thSortObj.limitTime == 'up' ? 1 : 0
      }
      if (thSortObj.priority) {
        param.orderType = 0
        param.orderAsc = thSortObj.priority == 'up' ? 1 : 0
      }
      console.log(param)
      requestApi({
        url: '/task/findManagerList',
        param: param,
        json: true,
        setLoadState: taskContext.setMainLoading,
        // apiType: 'main',
      }).then((res: any) => {
        if (res.success) {
          const headerList = res.data.dataList || []
          const contentList = res.data.data.content || []
          // console.log(headerList)
          // console.log(contentList)
          // onlyFind：只查询数据
          if (paramObj.onlyFind) {
            let taskData: any = {}
            let isDel = true
            for (let i = 0; i < contentList.length; i++) {
              if (contentList[i].id == paramObj.findId) {
                isDel = false
                taskData = contentList[i]
                break
              }
            }
            resolve({ isDel, taskData })
            return
          }
          stateTmp.headerList = headerList
          if (contentList.length > 0) {
            stateTmp.hasMorePage = true
          } else {
            stateTmp.hasMorePage = false
          }
          // 记录首个任务id
          if (firstReset && contentList.length > 0) {
            firstTask = contentList[0]
            // 初始加载时如果是宽详情模式，则查询第一个任务的详情
            if (taskContext.listMode == 1) {
              findDetailByMode({
                mode: 1,
                taskId: firstTask.id,
                taskData: firstTask,
                widChange: true,
                init: true,
              })
            }
          }
          const columns: any = []
          let newCols: any = []
          // 表头排序更新列表时不刷新表头
          if (!paramObj.thSort) {
            // ======表头列名组装==========//
            headerList.map((hitem: any, h: number) => {
              // console.log('表头列表组装', hitem, h)
              const colInfo: any = getColInfo(hitem.code, headerList.length)
              const obj: any = {
                title: hitem.name,
                dataIndex: colInfo.name,
                key: hitem.code,
                className: colInfo.className,
                code: hitem.code,
                index: h,
                ellipsis: true,
              }
              // 全设置宽度时，宽度会按百分比分配大小，部分设置宽度，宽度才会起作用
              if (h < headerList.length - 1) {
                obj.width = colInfo.width
              }
              // 任务名固定
              if (hitem.code == 1) {
                obj.fixed = 'left'
              }
              columns.push(obj)
            })

            // 列拖动
            newCols = renderCol(columns, true)
          }

          // 表格内容组装
          const newDatas = setTreeTableData({
            data: contentList,
            childLevel: false,
            headerList: stateTmp.headerList,
          })

          // 滚动加载时添加数据到末尾
          let newList: any = newDatas
          if (paramObj.scrollLoad) {
            newList = [...stateTmp.contentList, ...newDatas]
          }
          const dataObj: any = {
            type: ['contentList', 'expandedRowKeys', 'queryState'],
            data: {
              contentList: [...newList],
              expandedRowKeys: [],
              queryState: paramObj.search || '',
            },
          }
          if (!paramObj.thSort) {
            dataObj.type.push('columns')
            dataObj.data.columns = newCols
          }
          // 修改偶现初始列表数据，宽详情内容无法显示问题
          // if (listInit && wideDetail.mode == 1) {
          //   if (newList.length != 0) {
          //     firstTask = newList[0]
          //     wideDetail.taskId = firstTask.id
          //   } else {
          //     firstTask = {}
          //   }
          // }
          dispatch(dataObj)
        }
      })
    })
  }

  // *************************************表格处理 *******************************//

  // =============================多层级表格处理 start===============================//
  /**
   * 处理单个数组数据为表格树可用数据
   * data：表格内容数据
   * childLevel：是否是子级数据（除第一层都是子级）
   * headerList:表头数据
   * parentRow:父级任务
   * preRow:上一个任务
   * nextRow:下一个任务
   */
  const setTreeTableData = (paramObj: {
    data: any
    childLevel?: any
    headerList: any
    parentRow?: any
    parentId?: any
    childLevels?: any
    optType?: string //操作类型
    isRoot?: boolean
    attachInfo?: {
      setType?: number //优先级类型
      [propName: string]: any
    }
  }) => {
    const { optType, isRoot } = paramObj
    const attachObj = paramObj.attachInfo ? paramObj.attachInfo : {}
    return paramObj.data.map((item: any, i: number) => {
      // 防止某些字段后台返回的是undefined，设置默认字段
      const mainDef = {
        liable: {},
        endTime: '',
        executeTime: '',
        status: 0,
        flag: 0,
        level: 1,
        attach: {},
        subTaskCount: 0,
        remainDays: 0,
        type: 0,
        createUsername: '',
        followNames: [],
        startTime: '',
        icon: '',
        tagList: [],
        maxRole: 0,
      }
      // 先从map表取
      if (treeListMap[item.id] && treeListMap[item.id].childLevel != undefined) {
        item.childLevel = treeListMap[item.id].childLevel
      } else if (paramObj.childLevels) {
        // 对象形式时，取对应id的childLevel
        item.childLevel = paramObj.childLevels[item.id]
      } else if (paramObj.childLevel != undefined) {
        item.childLevel = paramObj.childLevel
      }
      if (isRoot != undefined) {
        item.childLevel = false
      }
      if (optType == 'addChildTask') {
        item.childLevel = true
      }
      item.key = item.id
      // 恢复新拖动添加的节点dragAdd标识为默认
      item.dragAdd = false
      // 编辑优先级时修改刷新
      if (paramObj.optType == 'editPriority' && item.attach) {
        item.attach.star = 0
        item.attach.setType = attachObj.setType || 0
      }
      // 编辑星级占用时修改刷新
      if (
        paramObj.optType == 'priorityStar' &&
        item.attach &&
        attachObj.ascriptionId == item.attach.ascriptionId &&
        attachObj.ascriptionType == item.attach.ascriptionType &&
        item.attach.setType == attachObj.priType
      ) {
        item.attach.star = 0
        // 判断当前选中任务是否需要更新
        if (nowTask.id == item.id && paramObj.attachInfo) {
          paramObj.attachInfo.nowTaskChange = true
        }
      }
      // 设置父任务数据
      if (paramObj.parentId) {
        item.parentId = paramObj.parentId
      } else if (treeListMap[item.id]) {
        item.parentId = treeListMap[item.id].parentId
      }
      // 存储上一个任务数据
      if (i - 1 >= 0) {
        item.preId = paramObj.data[i - 1].id
      }
      // 存储下一个任务数据
      if (i + 1 < paramObj.data.length) {
        item.nextId = paramObj.data[i + 1].id
      }
      // ========存取map表========//
      treeListMap[item.id] = { ...item }
      const colObj = {}
      paramObj.headerList.map((hitem: any, h: number) => {
        const colInfo: any = getColInfo(hitem.code)
        colObj[colInfo.name] = (
          <SetColContent key={item.id + '_' + h} item={item} code={hitem.code} colIndex={h} />
        )
      })
      if (item.subTaskCount > 0) {
        item.children = []
      }
      return {
        ...mainDef,
        ...item,
        ...colObj,
      }
    })
  }

  /**
   * 给树形表格添加新数据
   * @param list
   * @param id
   * @param children
   */
  const updateTreeChild = (list: any, attachObj: any) => {
    return list.map((item: any) => {
      if (item.id === attachObj.findId) {
        const children = attachObj.children
        return {
          ...item,
          children,
        }
      } else if (item.children) {
        return {
          ...item,
          children: updateTreeChild(item.children, attachObj),
        }
      }
      return item
    })
  }
  /**
   * 查询子级任务
   */
  const queryChildTask = ({
    findId,
    row,
    onlyFind,
    operateId,
    flag,
  }: {
    findId: string
    row?: any
    onlyFind?: boolean
    operateId?: string //当前操作的任务id
    flag?: number //任务状态：3已归档
  }) => {
    const param: any = {
      taskId: findId,
      loginUserId: $store.getState().nowUserId,
    }
    // 已归档任务查询子任务，需添加参数 isOnFile
    if (flag == 3) {
      param.isOnFile = 1
    }

    return new Promise((resolve: any) => {
      requestApi({
        url: '/task/findManagerSubList',
        param: param,
        setLoadState: taskContext.setMainLoading,
        apiType: 'main',
      }).then((res: any) => {
        if (res.success) {
          const childData = res.data.dataList || []
          // 只查询数据情况
          if (onlyFind) {
            let isDel = true
            for (let i = 0; i < childData.length; i++) {
              if (childData[i].id == operateId) {
                isDel = false
                break
              }
            }
            resolve({ isDel, taskData: childData })
            return
          }
          console.log(childData)
          // 表格内容组装
          const newChilds = setTreeTableData({
            data: childData,
            childLevel: true,
            headerList: stateTmp.headerList,
            parentId: findId,
            optType: 'addChildTask',
          })
          const newList = updateTreeChild(stateTmp.contentList, {
            findId: row.id,
            children: newChilds,
          })
          resolve({ taskData: newList || [] })
        } else {
          resolve(false)
        }
      })
    })
  }

  /**
   * 点击展开图标时触发
   * @param expanded
   * @param row
   * handExp:手动控制展开
   */
  const expandNode = ({ expanded, row, handExp }: { expanded: any; row: any; handExp?: boolean }) => {
    const children = row.children || []
    if (!expanded || children.length > 0) {
      return
    }

    queryChildTask({
      findId: row.id,
      row,
      flag: row.flag,
    }).then(({ taskData }: any) => {
      // 手动控制展开
      if (handExp) {
        dispatch({
          type: ['contentList', 'expandedRowKeys'],
          data: { contentList: [...taskData], expandedRowKeys: handExp },
        })
      } else {
        dispatch({
          type: ['contentList'],
          data: { contentList: [...taskData] },
        })
      }
    })
  }

  /**
   * 展开的行变化时触发
   * @param expandedRows
   */
  const onExpandedRowsChange = (expandedRows: any) => {
    dispatch({
      type: ['expandedRowKeys'],
      data: { expandedRowKeys: [...expandedRows] },
    })
  }

  // ============================多层级表格处理 end================================================//

  // ===================================表格内容渲染 start============================================//
  /**
   * 获取人员信息代码
   * flag 1督办人 2验收人 3责任人 4执行人 5 owner
   */
  const getUserCode = (paramObj: { data: any; flag: number; taskItem: any; rowColIndex: string }) => {
    const data = paramObj.data
    const flag = paramObj.flag
    const rowColIndex = paramObj.rowColIndex
    const taskItem = paramObj.taskItem
    const userHtm: any = []
    // //是否完成ssssss
    const isComplet = taskItem.status == 2
    // //是否是冻结
    const isFreeze = taskItem.flag == 1
    // //是否已归档
    const isFile = taskItem.flag == 3
    // console.log(taskItem)
    // //是否审批中
    // const isApproval = taskItem.approvalStatus != 0
    let editAuth = taskItem.update
    if (isFile) {
      //有编辑权限
      editAuth = false
    }
    // 编辑人员按钮事件
    let personIdType = 0
    let fromMsg = ''
    if (flag == 1) {
      //督办人
      fromMsg = 'superv'
      personIdType = 6
    } else if (flag == 2) {
      //验收人
      fromMsg = 'check'
      personIdType = 7
    } else if (flag == 4) {
      //领导人
      fromMsg = 'leader'
      personIdType = 5
    } else if (flag == 3) {
      //执行人
      fromMsg = 'execute'
      personIdType = 4
    } else if (flag == 5) {
      //owner
      fromMsg = 'owner'
      personIdType = 3
    }
    let userOptBtn: any = ''
    // 单元格中无人员时添加人员选择的按钮
    let tdAddUserBtn: any = ''
    // 有人员时的人员选择按钮
    let selUserBtn: any = ''
    // 右键菜单
    // 是否是订阅汇报人
    let isSubscribe = false

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      // 多人标识图标
      let manyUserIcon: any = ''
      if ((flag == 1 && item.total > 1) || (flag == 2 && item.total > 1)) {
        manyUserIcon = <span className="img_icon many_user_icon"></span>
      }
      // 人员名字
      const userNameBox = (
        <span key={rowColIndex + flag + i} className="taskUserNameBox">
          <span className="taskUserName taskLiberName my_ellipsis">{item.username || ''}</span>
          {manyUserIcon}
        </span>
      )
      //统计： 汇报 问题 沟通 备注
      const countHtm = []
      // 汇报 + 强制汇报
      if (item.reportCount) {
        let isforceDot = ''
        let forcePlanIcon = 'count_rep_icon'
        if (item.forceCount > 0) {
          forcePlanIcon = 'force_plan_icon'
          if (item.forceNoWrite > 0) {
            isforceDot = 'forceRedDot'
          } else {
            isforceDot = 'forceDot'
          }
        }
        countHtm.push(
          <span
            key={rowColIndex + flag + i + '_0'}
            className={`taskCountLabel ${isforceDot} ${item.reportRead > 0 ? 'redDot' : ''}`}
            onClick={(e: any) => {
              e.stopPropagation()
              reportModel.visible = true
              reportModel.data = {
                id: taskItem.id,
                personType: personIdType,
                queryType: item.forceNoWrite ? 8 : 0,
                teamId: taskItem.ascriptionId,
              }
              setReportModel({ ...reportModel })
            }}
          >
            <i className={`img_icon count_icon ${forcePlanIcon}`}></i>
            <span className="count_txt">{item.reportCount}</span>
          </span>
        )
      }
      // 计划
      if (item.planCount) {
        countHtm.push(
          <span key={rowColIndex + flag + i + '_1'} className="taskCountLabel">
            <i className="img_icon count_icon count_plan_icon"></i>
            <span className="count_txt">{item.planCount}</span>
          </span>
        )
      }
      // 备注
      if (item.opinionCount) {
        countHtm.push(
          <span
            key={rowColIndex + flag + i + '_2'}
            className={`taskCountLabel last ${item.opinionRead > 0 ? 'redDot' : ''}`}
          >
            <i className="img_icon count_icon count_remark_icon"></i>
            <span className="count_txt">{item.opinionCount}</span>
          </span>
        )
      }
      const itemHtm = (
        <div key={rowColIndex + flag + i + '_11'} className="taskListUserItem">
          {userNameBox}
          <div className={`taskUserCountBox ${countHtm ? '' : 'forcedHide'}`}>{countHtm}</div>
        </div>
      )
      userHtm.push(itemHtm)
      // 判断当前人是否是订阅汇报人
      const subscribeUsers = taskItem.subscribeUsers || []
      if (subscribeUsers.indexOf(parseInt(item.userId)) > -1) {
        isSubscribe = true
      } else {
        isSubscribe = false
      }
    }

    if (data.length == 0) {
      // 无人员时添加添加按钮
      // 判定是否有编辑权限
      tdAddUserBtn = (
        <div
          key={rowColIndex + flag + 'tdAddUserBtn'}
          className={`add_user_box ${taskItem.update ? '' : 'forcedHide'}`}
          onClick={() => {
            editUser({
              taskItem: taskItem,
              userList: data,
              sourceMsg: fromMsg,
              childLevel: taskItem.childLevel,
            })
          }}
        >
          <span className="img_icon add_user_icon"></span>
        </div>
      )
    } else {
      selUserBtn = (
        <div
          key={'selUserBtn' + flag}
          className="set_force_report"
          onClick={() => {
            setOpenforce(true)
            setAscription({
              ascriptionId: taskItem.ascriptionId,
              ascriptionName: taskItem.ascriptionName,
            })
            setTaskData(taskItem)
          }}
        >
          设置汇报
        </div>
      )
    }

    if (!editAuth) {
      //没有编辑权限
      tdAddUserBtn = ''
      selUserBtn = ''
    }
    // 右键按钮 如果是完成状态、冻结状态、归档任务、无权限、则不需要开启右键
    userOptBtn =
      !isFreeze && !isComplet && !isFile && editAuth ? (
        <ul key={rowColIndex + flag + 'useropt1'} className="taskUserMenu">
          <li
            className={`taskUserMenuItem updateBtn ${editAuth ? '' : 'forcedHide'}`}
            onClick={() => {
              editUser({
                taskItem: taskItem,
                userList: data,
                sourceMsg: fromMsg,
              })
            }}
          >
            修改
          </li>

          <li
            className="subscribeBtn"
            onClick={() => {
              subscribeReport({
                taskItem: taskItem,
                userList: data,
                isSubscribe: isSubscribe ? 1 : 0,
              })
            }}
          >
            {isSubscribe ? '取消订阅' : '订阅汇报'}
          </li>
          {selUserBtn == '' ? (
            ''
          ) : (
            <li className={`taskforceBtn ${taskItem.status == 3 ? 'forcedHide' : ''}`}>{selUserBtn}</li>
          )}
        </ul>
      ) : (
        ''
      )
    return (
      <div key={rowColIndex + flag + 'userCode'} className={flag == 3 ? 'limitWith' : ''}>
        {tdAddUserBtn}
        <Dropdown overlay={userOptBtn} trigger={['contextMenu']} placement="bottomRight">
          <div className="taskListUserBox">{userHtm}</div>
        </Dropdown>
      </div>
    )
  }

  /**
   * 给元素添加与列名一致的参数，用于表格内容的渲染、
   * item:当前行数据
   * headerList:表头数据
   */
  const SetColContent = ({ item, code, colIndex }: { item: any; code: number; colIndex: number }) => {
    const attach = item.attach || {}
    const infoObj = {
      ascriptionId: item.ascriptionId,
      ascriptionType: item.ascriptionType,
      setType: attach.setType,
      star: attach.star,
    }
    // 编辑任务名输入框显示状态
    const [editNameInp, setEditNameInp] = useState(false)
    // 右键菜单显示隐藏
    const [taskOptShow, setTaskOptShow] = useState({
      contextMenu: false,
      moreBtnMenu: false,
    })
    // 任务名列详情点击时加active
    // const [wideActive, setWideActive] = useState(false)
    let tdHtm: any = ''
    //是否完成
    const isComplet = item.status == 2
    //是否延迟
    // const isLate = item.status == 3
    //是否在审批中
    const isApproval = item.approvalStatus !== undefined && item.approvalStatus != 0
    //是否冻结
    const isFreeze = item.flag == 1
    //是否已归档
    const isFile = item.flag == 3
    //是否启动
    // let isStart = item.executeTime != null;
    /**私有 */
    // const isPrivate = item.property == 1
    // 是否是责任人
    const executUser = item.liableUser == $store.getState().nowUserId
    //是否是企业部门任务 审批中
    // const isOrgDep = item.approvalStatus == 6 || item.approvalStatus == 7
    let isAuth = false
    if (!isApproval && !isComplet && !isFile && !isFreeze) {
      //有编辑权限
      isAuth = true
    }
    // owner
    let ownerObj: any = []
    if (item.owner) {
      ownerObj = [item.owner]
    }
    // 领导责任
    let liberObj: any = []
    if (item.liable) {
      liberObj = [item.liable]
    }
    // 执行人 j旧
    let executObj: any = []
    if (item.executor) {
      executObj = [item.executor]
    }
    // 新 执行人
    let liableObj: any = []
    if (item.liable) {
      liableObj = [item.liable]
    }

    // 督办人
    let supervObj: any = []
    if (item.supervise) {
      supervObj = [item.supervise]
    }
    // 验收人
    let checkObj: any = []
    if (item.acceptUsers) {
      checkObj = [item.acceptUsers]
    }

    // 编辑任务按钮
    let editTaskBtn: any = ''
    if (!isApproval && !isComplet && !isFile && !isFreeze) {
      editTaskBtn = (
        <span
          className="img_icon task_name_edit_icon"
          onClick={(e: any) => {
            e.stopPropagation()
            $(e.target)
              .parents('tr')
              .addClass('noDrag')
            //todo修改任务编辑
            const param = {
              id: item.id,
              userId: $store.getState().nowUserId,
              viewType: 2, //0工作台点击 1任务管理点击 2任务详情
            }
            console.log('任务id' + taskData.id)
            getTaskBtnApi(param).then((data: any) => {
              // console.log('查询到的权限22224442')
              // console.log(data.dataList)
              $(data.dataList || []).each(function(i, item) {
                if (item.name == 'UPDATE' && item.isUse == 1) {
                  setEditNameInp(true)
                }
              })
            })
          }}
        ></span>
      )
    }
    // 内容溢出渐变背景遮盖
    const bgGradient = <div className="cell_bg_gradient"></div>
    let userCont: any = ''
    const key = item.id + '-' + colIndex

    switch (code) {
      case 1: //任务名
        const followers = item.followNames || []
        const isFollow = item.isFollow == 1
        // 右键操作所需数据
        const optBtnData = { ...item, isFollow }
        // 被关注的任务标识图标
        let attenIcon: any = ''
        if (followers.length > 0) {
          attenIcon = (
            <Tooltip placement="top" title={'关注：' + followers.join('、')}>
              <div className="attentionFlag">
                <em className="triangle_topleft"></em>
                <em className="img_icon attentionIcon"></em>
              </div>
            </Tooltip>
          )
        }

        const actionTypeHtml = !isFile ? (
          <>
            <Tooltip title="重命名">{editTaskBtn}</Tooltip>
            <Tooltip title="汇报">
              <span
                className="report_icon"
                onClick={() => {
                  $store.dispatch({
                    type: 'TASK_LIST_ROW',
                    data: {
                      handleBtn: {
                        id: item.id,
                        status: item.progress == 100 ? 2 : 0,
                        executorUsername: item.reportUserName,
                        reportId: item.reportId,
                        type: 0,
                        time: Math.floor(Math.random() * Math.floor(1000)),
                        ascriptionId: item.ascriptionId,
                      },
                      type: 0,
                      sourceType: 'taskManage',
                    },
                  })
                  $tools.createWindow('DailySummary')
                }}
              ></span>
            </Tooltip>
            {(NEWAUTH812 ? getAuthStatus('taskFind') : true) && (
              <Tooltip title="新增子任务">
                <span
                  className="add_child_icon"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    addChildShow(e, item)
                  }}
                ></span>
              </Tooltip>
            )}
            <Tooltip title={isFollow ? '取消关注' : '关注'}>
              <span
                className={`collect_icon ${isFollow ? 'nofollowIcon' : ''}`}
                onClick={e => {
                  e.stopPropagation()
                  // 取消关注
                  if (isFollow) {
                    unFollowTask({
                      taskId: item.id,
                    }).then((res: any) => {
                      if (res) {
                        refreshListFn({
                          taskIds: [item.id],
                          childLevel: item.childLevel,
                          useType: 1,
                          optType: 'follow',
                        })
                      }
                    })
                  } else {
                    // 关注
                    followTask({
                      taskId: item.id,
                      teamId: item.ascriptionId,
                      belongName: $.trim(item.ascriptionName),
                    }).then((res: any) => {
                      if (res) {
                        refreshListFn({
                          taskIds: [item.id],
                          childLevel: item.childLevel,
                          useType: 1,
                          optType: 'unfollow',
                        })
                      }
                    })
                  }
                }}
              ></span>
            </Tooltip>
          </>
        ) : (
          ''
        )

        /* 操作按钮 */
        const optBtns = (
          // <div className="taskListOptBox taskListInOptBox taskOptBtnOut"></div>
          <div
            className={`taskOptBtnGroup ${editNameInp ? 'forcedHide' : ''} ${
              taskOptShow.moreBtnMenu ? 'disHover' : ''
            }`}
            onClick={(e: any) => {
              e.stopPropagation()
            }}
          >
            {actionTypeHtml}
            <Tooltip title="更多">
              <Dropdown
                overlayClassName="base-dropdown"
                visible={taskOptShow.moreBtnMenu}
                onVisibleChange={(flag: boolean) => {
                  setTaskOptShow({ ...taskOptShow, moreBtnMenu: flag, contextMenu: false })
                }}
                overlay={
                  <TaskListOpt
                    key={key + '_more'}
                    taskOptData={{
                      rowObj: optBtnData,
                      fromType: 'taskManage',
                    }}
                    callback={(data: any) => {
                      // console.log('列表按钮回调', param)
                      const param: any = {
                        taskIds: data.optType == 'assign' ? [data.taskId] : [item.id],
                        newTaskId: data.optType == 'assign' ? data.data[0] : '',
                        childLevel: item.childLevel,
                        useType: 1,
                        optType: data.optType,
                      }
                      if (data.optType == 'transfer') {
                        param.parentId = item.parentId
                      }
                      // 选择了父任务的情况
                      if (data.optType == 'editTask') {
                        param.parentIdOld = data.parentIdOld
                        param.newChild = data.data
                        // 顶层任务无parentId
                        if (data.parentId) {
                          param.parentId = data.parentId
                        }
                        // if (!item.childLevel) {
                        //   param.parentIdOld = ''
                        //   param.parentId = ''
                        // }
                      }
                      // 刷新列表
                      refreshListFn(param)
                    }}
                    outVisible={taskOptShow.moreBtnMenu} //外部控制菜单显示隐藏
                    setVisible={(flag: boolean) => {
                      setTaskOptShow({ ...taskOptShow, moreBtnMenu: flag, contextMenu: false })
                    }}
                  />
                }
                trigger={['click']}
              >
                <span className="more_icon"></span>
              </Dropdown>
            </Tooltip>
          </div>
        )

        tdHtm = (
          <Dropdown
            overlayClassName="base-dropdown"
            key={key}
            visible={taskOptShow.contextMenu}
            onVisibleChange={(flag: boolean) => {
              setTaskOptShow({ ...taskOptShow, contextMenu: flag, moreBtnMenu: false })
            }}
            overlay={
              <TaskListOpt
                key={key + '_context'}
                taskOptData={{
                  rowObj: { ...optBtnData },
                  fromType: 'taskManage',
                }}
                callback={(data: any) => {
                  // console.log('列表按钮回调', data)
                  const param: any = {
                    taskIds: data.optType == 'assign' ? [data.taskId] : [item.id],
                    newTaskId: data.optType == 'assign' ? data.data[0] : '',
                    childLevel: item.childLevel,
                    useType: 1,
                    optType: data.optType,
                  }
                  if (data.optType == 'transfer') {
                    param.parentId = item.parentId
                  }
                  if (data.optType == 'editTask') {
                    param.parentIdOld = data.parentIdOld
                    param.newChild = data.data
                    // 顶层任务无parentId
                    if (data.parentId) {
                      param.parentId = data.parentId
                    }
                  }
                  // 刷新列表
                  refreshListFn(param)
                }}
                outVisible={taskOptShow.contextMenu} //外部控制菜单显示隐藏
                setVisible={(flag: boolean) => {
                  setTaskOptShow({ ...taskOptShow, contextMenu: flag, moreBtnMenu: false })
                }}
              />
            }
            trigger={['contextMenu']}
          >
            <div
              className={`cellCont ${isComplet || isFile ? 'finished' : ''}`}
              data-info={JSON.stringify(infoObj)}
              onClick={(e: any) => {
                findDetailByMode({
                  mode: taskContext.listMode,
                  taskId: item.id,
                  taskData: item,
                })
                if (taskContext.listMode == 1 && wideDetailTmp.taskId == item.id) {
                  // 任务名列详情点击时加active
                  // setWideActive(true)
                  jQuery('#taskManageListTableSec')
                    .find('.wide_active')
                    .removeClass('wide_active')
                  jQuery(e.target)
                    .parents('td')
                    .addClass('wide_active')
                }
              }}
            >
              {/* {wideActive ? <div className="wideBar"></div> : ''} */}
              {attenIcon}
              <div className={`boardTaskName ${editNameInp ? 'forcedHide' : ''}`}>
                {/* 第1行：任务名 */}
                <div className="taskNameRow flex between">
                  <div className="contLeft">
                    <div className="taskListNameBox">
                      <span className="taskNameSpan">{item.name}</span>
                    </div>
                    {/* {editTaskBtn} */}

                    <div className="taskListStatusBox inline-flex">
                      <RoleComponet params={{ code: item.maxRole, labelShow: false }} />
                      {setTagByStatus(item)}
                      {/* <span
                        className={`boardTaskType ${item.forceReport > 0 ? 'force_icon' : 'todayHide'}`}
                      ></span> */}
                      <span
                        title={item.distributeUser + '派发的任务'}
                        className={`${item.distributeUser != null ? 'taskMiddlpai' : 'noneTaskMiddleLabel'}`}
                      ></span>
                    </div>
                  </div>
                  {optBtns}
                </div>
                {/* 第2行：任务标签 */}
                <div className="taskListTagBox flex">
                  {/* {!item.childLevel ? <TaskTypeTag type={item.type} /> : ''} */}
                  {/* <TaskTypeTag type={item.type} /> */}
                  {tagFlagDom(item, isAuth)}
                  {/* wideDetail.mode == 1 && */}
                  <RoleComponet params={{ code: item.maxRole, labelShow: true }} />
                  <TaskListTags tagList={item.tagList || []} />
                </div>
                <div className="taskListAssignBox">
                  {item.assignName ? (
                    <span className="taskMiddleLabel">
                      由<i>{item.assignName}</i>指派
                    </span>
                  ) : (
                    ''
                  )}
                </div>
              </div>
              {editNameInp ? (
                <Input
                  className={`taskListNameInp ${editNameInp ? '' : 'forcedHide'}`}
                  autoFocus
                  defaultValue={item.name}
                  // 解决选中文本时失去焦点问题
                  onClick={(e: any) => {
                    e.stopPropagation()
                    // e.preventDefault()
                  }}
                  onMouseDown={(e: any) => {
                    e.stopPropagation()
                    // e.preventDefault()
                  }}
                  onMouseMove={(e: any) => {
                    e.stopPropagation()
                    // e.preventDefault()
                  }}
                  onBlur={(e: any) => {
                    setEditNameInp(false)
                    if (e.target.value != item.name) {
                      editTaskName({
                        taskItem: item,
                        newName: e.target.value,
                      })
                      // 刷新详情内容
                      refreshDetails && refreshDetails()
                    }
                  }}
                />
              ) : (
                ''
              )}
            </div>
          </Dropdown>
        )
        break
      case 2: //2星级
        let goldHtm: any = []
        const goldObj = item.attach || { type: '0' }
        const goldNum = goldObj.star || 0
        //设置含金量权限
        let setGoldAuth = getAuthStatus('taskStarUpdate')
        if (taskOrgInfo.isMy) {
          setGoldAuth = true
        }
        let authbottom: any = ''
        if (!executUser) {
          if (!setGoldAuth) {
            authbottom = { pointerEvents: 'none' }
          } else {
            authbottom = { pointerEvents: 'inherit' }
          }
        }
        if (isComplet) {
          authbottom = { pointerEvents: 'none' }
        }
        //是否是个人任务
        const isMyUser = item.attach == null
        //星级类型
        const isgoalType = item.attach != null ? item.attach.setType : '-1'

        if (isMyUser) {
          authbottom = { display: 'none' }
        }
        if (isgoalType == 0) {
          //六点工作法
          for (let g = 1; g <= 6; g++) {
            if (g <= goldNum) {
              goldHtm.push(<i key={g} className="star active"></i>)
            }
          }
        } else if (isgoalType == 1 && goldNum > 0) {
          //自定义
          let bg = ''
          if (goldNum <= 2) {
            bg = '#EA4335'
          } else if (goldNum > 2 && goldNum <= 4) {
            bg = '#FBBC05'
          } else if (goldNum > 4 && goldNum <= 7) {
            bg = '#4285F4'
          } else if (goldNum > 7 && goldNum <= 10) {
            bg = '#34A853'
          }
          goldHtm = (
            <span className="starCustom" style={{ background: bg }}>
              {goldNum}
            </span>
          )
        }
        // 星级设置按钮
        let starBtn: any = ''
        if (goldObj.type == 0) {
          goldObj.typeId = liberObj[0].userId || ''
        }
        // 星级设置按钮
        const StarBtn = () => {
          //优先级弹框显示隐藏
          const [priorityvis, setPriorityvis] = useState(false)
          const goldObj = item.attach || { type: '0', star: 0 }
          return (
            <Dropdown
              className="selPriorityconetnt"
              overlay={
                <Priority
                  param={{
                    from: 'taskManageList',
                    teamId: item.ascriptionId,
                    taskId: item.id,
                    initDatas: {
                      type: goldObj.type,
                      data: goldObj.star || 0,
                    }, //用于反显的数据 0为清除
                    ascriptionType: item.ascriptionType,
                  }}
                  visible={priorityvis}
                  setVisible={(flag: boolean) => {
                    setPriorityvis(flag)
                  }}
                  onOk={(datas: any) => {
                    console.log(datas)
                    editTaskPri({ taskItem: item, newData: datas })
                  }}
                  dropType="Dropdown"
                />
              }
              visible={priorityvis}
              trigger={['contextMenu']}
              placement="bottomRight"
              onVisibleChange={(flag: boolean) => {
                setPriorityvis(flag)
              }}
            >
              <span
                className={`img_icon star_set_btn ${priorityvis ? 'disable' : ''} ${
                  item.update ? '' : 'forcedHide'
                }`}
                data-taskid={item.id}
                data-starnum={goldNum}
                data-type={goldObj.type}
                data-settype={goldObj.setType}
                onClick={(e: any) => {
                  e.preventDefault()
                  setPriorityvis(true)
                }}
              ></span>
            </Dropdown>
          )
        }
        // 检查是否有编辑权限
        if (!isApproval && !isComplet && !isFile && !isFreeze) {
          starBtn = <StarBtn />
        }
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            <div className="cellStarDiv" style={authbottom}>
              {goldHtm}
            </div>
            {starBtn}
          </div>
        )
        break
      case 3: //3owner
        userCont = getUserCode({
          data: ownerObj,
          flag: 5,
          taskItem: item,
          rowColIndex: key,
        })
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            {userCont}
            {bgGradient}
          </div>
        )
        break
      case 4: //执行人
        userCont = getUserCode({
          data: liableObj,
          flag: 3,
          taskItem: item,
          rowColIndex: key,
        })
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            {userCont}
            {bgGradient}
          </div>
        )
        break
      case 5: //5执行责任
        userCont = getUserCode({
          data: executObj,
          flag: 4,
          taskItem: item,
          rowColIndex: key,
        })
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            {userCont}
            {bgGradient}
          </div>
        )
        break
      case 6: //6督办责任
        userCont = getUserCode({
          data: supervObj,
          flag: 1,
          taskItem: item,
          rowColIndex: key,
        })
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            {userCont}
            {bgGradient}
          </div>
        )
        break
      case 7: // 7验收责任
        userCont = getUserCode({
          data: checkObj,
          flag: 2,
          taskItem: item,
          rowColIndex: key,
        })
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            {userCont}
            {bgGradient}
          </div>
        )
        break
      case 8: // 8截止时间
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            <div className="limitWith my_ellipsis">{item.endTime || '-'}</div>
            {bgGradient}
          </div>
        )
        break
      case 9: //9倒计时
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            {countDownShow(item)}
            {bgGradient}
          </div>
        )
        break
      case 10: // 10事务
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            <span
              className={`taskCountLabel ${item.transactionCount > 0 ? '' : 'forcedHide'} ${
                item.transcationRead > 0 ? 'redDot' : ''
              }`}
            >
              <em className="img_icon count_icon count_affairs_icon"></em>
              <span className="count_txt">{item.transactionCount || 0}</span>
            </span>
            {bgGradient}
          </div>
        )
        break
      case 11: // 11附件
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            <span
              className={`taskCountLabel ${item.fileCount > 0 ? '' : 'forcedHide'} ${
                item.fileRead > 0 ? 'redDot' : ''
              }`}
              onClick={() => {
                fileDetailShow(item)
              }}
            >
              <em className="img_icon count_icon count_files_icon"></em>
              <span className="count_txt">{item.fileCount || 0}</span>
            </span>
            {bgGradient}
          </div>
        )
        break
      case 12: // 12过程监管
        tdHtm = (
          <div key={key} className={`cellCont ${isComplet ? 'finished' : ''}`}>
            <div className="cellWrapRow">
              {item.finishCheckCount ? (
                <span>
                  检查项
                  <span>完{item.finishCheckCount}个</span>
                  <em
                    className="list_trash_check"
                    onClick={() => {
                      setOpentEntry(true)
                      setAscription({
                        ascriptionId: item.ascriptionId,
                        ascriptionName: item.ascriptionName,
                      })
                      setTaskid(item.id)
                    }}
                  ></em>
                </span>
              ) : item.triggerRiskCount ? (
                ''
              ) : (
                <em
                  className="list_trash_check"
                  onClick={() => {
                    setOpentEntry(true)
                    setAscription({
                      ascriptionId: item.ascriptionId,
                      ascriptionName: item.ascriptionName,
                    })
                    setTaskid(item.id)
                  }}
                  style={{ marginTop: 0 }}
                ></em>
              )}
            </div>
            {item.triggerRiskCount ? (
              <div className="cellWrapRow">
                <span>
                  任务监管
                  <span>触发{item.triggerRiskCount}个</span>
                  {item.finishCheckCount ? (
                    ''
                  ) : (
                    <em
                      className="list_trash_check"
                      onClick={() => {
                        setOpentEntry(true)
                        setAscription({
                          ascriptionId: item.ascriptionId,
                          ascriptionName: item.ascriptionName,
                        })
                        setTaskid(item.id)
                      }}
                    ></em>
                  )}
                </span>
              </div>
            ) : (
              ''
            )}
            {bgGradient}
          </div>
        )
        break
      case 14: //标签
        tdHtm = (
          <div className="tagBoxCell flex">
            {tagFlagDom(item, isAuth)}
            <TaskListTags tagList={item.tagList || []} classname="width100 cell-content" />
          </div>
        )
        break
      case 15: //任务类型
        tdHtm = (
          <div className="tagBoxCell flex">
            <TaskTypeTag type={item.type} className={'my_ellipsis table_task_type'} />
          </div>
        )
        break
      default:
        //
        break
    }
    return tdHtm
  }

  // 生成dom标签
  const tagFlagDom = (item: any, isAuth: boolean) => {
    let priFlagTag: any = ''
    const delFlagTag: any = isAuth ? (
      <span
        className="pri_tag_del"
        onClick={(e: any) => {
          e.stopPropagation()
          delPriTag(item)
        }}
      ></span>
    ) : (
      ''
    )
    if (item.icon) {
      const priIcon = $tools.asAssetsPath(`/images/task/${item.icon}.png`)
      priFlagTag = (
        <span className="taskPriTag">
          <img className="taskPriTagIcon" src={priIcon}></img>
          {delFlagTag}
        </span>
      )
    }

    return priFlagTag
  }

  /**
   * 表格列名获取
   */
  const getColInfo = (code: number, totalCols?: number) => {
    let colName = ''
    let colWid: any = 70
    let className = ''
    let nameWid = 240
    const win: any = $(window)
    if (win.width() < 1404) {
      nameWid = 280
    }
    if (totalCols) {
      const secWid = jQuery('#taskManageListTableSec').width() || 0
      colWid = (secWid - nameWid) / (totalCols - 1)
      if (colWid < 70) {
        colWid = 70
      }
    }
    switch (code) {
      case 1: //任务名
        colName = 'nameCol'
        colWid = nameWid
        className = 'taskNameTd'
        break
      case 2: //2星级
        colName = 'starCol'
        className = 'taskPriTd'
        break
      case 3: //3owner
        colName = 'ownerCol'
        className = 'taskUserTd'
        break

      case 4: //执行人
        colName = 'executeCol'
        className = 'taskUserTd'
        break
      case 5: //5领导责任
        colName = 'leaderCol'
        className = 'taskUserTd'
        break
      case 6: //6督办责任
        colName = 'supervCol'
        className = 'taskUserTd'
        break
      case 7: // 7验收责任
        colName = 'verifyCol'
        className = 'taskUserTd'
        break
      case 8: // 8截止时间
        colName = 'endTimeCol'
        break
      case 9: //9倒计时
        colName = 'countdownCol'
        break
      case 10: // 10事务
        colName = 'affairCol'
        break
      case 11: // 11附件
        colName = 'fileCol'
        break
      case 12: // 12过程监管
        colName = 'monitorCol'
        break
      case 14: //14 标签
        colName = 'tagCol'
        break
      case 15: // 15任务类型
        colName = 'taskTypeCol'
        break
      default:
        break
    }
    return {
      name: colName,
      width: colWid,
      className: className,
    }
  }
  // ===================================表格内容渲染 end===============================================//

  // ==================================表格内容操作 start=====================================//
  /**
   * 编辑人员
   * taskItem：当前操作任务数据
   * sourceMsg:人员类型 superv:督办人 check:验收人 leader:领导人 execute:执行人 owner:owner
   * childLevel:是否是子级任务
   */
  const editUser = ({
    userList,
    taskItem,
    sourceMsg,
  }: {
    taskItem: any
    userList: any
    sourceMsg: string
    childLevel?: boolean
  }) => {
    const selectList: any = []
    // 执行人不可删除
    const isDel = sourceMsg == 'execute' ? false : true
    const disable = sourceMsg == 'execute' ? true : false
    userList?.map((item: any) => {
      const user = {
        curId: item.userId,
        curName: item.username,
        curType: 0,
        disable: disable,
      }
      selectList.push(user)
    })
    /**
     * 选人弹框参数
     */
    const memberOrg = {
      teamId: taskItem.ascriptionId || '',
      allowTeamId: [taskItem.ascriptionId || ''],
      selectList: selectList, //选人插件已选成员
      isDel: isDel,
      onSure: (dataList: any) => {
        console.log(dataList)
        let userModel: any = {}
        if (dataList.length > 0) {
          userModel = dataList[0]
        }
        if (sourceMsg == 'execute') {
          //编辑执行人
          transferTask({
            taskId: taskItem.id,
            userId: userModel.curId || '',
            deptId: userModel.deptId || '',
            roleId: userModel.roleId || '',
            successMsg: '编辑成功',
          }).then(() => {
            // 刷新列表
            refreshTaskList({
              taskIds: [taskItem.id],
              childLevel: taskItem.childLevel,
              parentId: taskItem.parentId,
              optType: 'editExecute',
            })
          })
        } else if (sourceMsg == 'leader') {
          //指派
          assignTask({
            taskId: taskItem.id,
            userId: userModel.curId || '',
            deptId: userModel.deptId || '',
            roleId: userModel.roleId || '',
            successMsg: '编辑成功',
          }).then(() => {
            refreshTaskList({
              taskIds: [taskItem.id],
              childLevel: taskItem.childLevel,
              optType: 'editLiber',
            })
          })
        }
      },
    }
    setSelMemberOrg({
      ...selMemberOrg,
      ...memberOrg,
    })
    setMemberOrgShow(true)
  }
  /**
   * 订阅汇报
   * taskItem：当前操作任务数据
   * sourceMsg:人员类型 superv:督办人 check:验收人 leader:领导人 execute:执行人 owner:owner
   */
  const subscribeReport = ({
    taskItem,
    userList,
    isSubscribe,
  }: {
    taskItem: any
    userList: any
    isSubscribe: number
  }) => {
    const userItem = userList[0] || {}
    subscribeReportApi({
      taskId: taskItem.id,
      userId: userItem.userId,
      type: isSubscribe,
    }).then(() => {
      refreshTaskList({
        taskIds: [taskItem.id],
        childLevel: taskItem.childLevel,
      })
    })
  }
  /**
   * 编辑任务名输入框显示
   */
  const editTaskName = ({ taskItem, newName }: { taskItem: any; newName: string }) => {
    editTaskApi({
      taskId: taskItem.id,
      editMsg: `${$store.getState().nowUser}修改了任务名`,
      infoArr: [
        {
          name: 'name',
          val: newName,
        },
      ],
    }).then((resolve: any) => {
      if (resolve) {
        refreshTaskList({
          taskIds: [taskItem.id],
          childLevel: taskItem.childLevel,
        })
      }
    })
  }

  /**
   * 编辑任务优先级
   */
  const editTaskPri = ({ taskItem, newData }: { taskItem: any; newData: any }) => {
    const param = {
      taskId: taskItem.id,
      oldTaskId: newData.oldTaskId || '',
      star: newData.data || 0,
      successMsg: '编辑成功',
    }
    editTaskPriApi(param).then(() => {
      console.log(param)
      refreshTaskList({
        taskIds: [taskItem.id],
        childLevel: taskItem.childLevel,
      })
    })
  }
  /**
   * 删除标记
   */
  const delPriTag = (taskItem: any) => {
    editTaskApi({
      taskId: taskItem.id,
      editMsg: `${$store.getState().nowUser}修改了标记`,
      infoArr: [
        {
          name: 'icon',
          val: '',
        },
      ],
    }).then((resolve: any) => {
      if (resolve) {
        refreshTaskList({
          taskIds: [taskItem.id],
          childLevel: taskItem.childLevel,
        })
      }
    })
  }

  /**
   * 新增子任务弹框显示
   */
  const addChildShow = (e: any, rowData: any) => {
    // jquery方法
    const thisTr = jQuery(e.target).parents('tr')
    let tds = ''
    stateTmp.headerList.map((item: any) => {
      if (item.code == 1) {
        tds += `<td class="taskNameTd">
        <div class="cellCont">
          <div class="boardTaskName">
            <input type="text" class="addChildTaskInp"/>
            <div class="create_task_btn_box">
              <div
              class="sure_create_btn"></div>
              <div
              class="cancel_create_btn"
              ></div>
            </div>
          </div>
        </div>
      </td>`
      } else {
        tds += '<td></td>'
      }
    })
    const addTr = `<tr class="addChildTaskTr"  id="addChildTaskTr">${tds}</tr>`
    if (document.getElementById('addChildTaskTr')) {
      jQuery('#addChildTaskTr').remove()
    }
    thisTr.after(addTr)
    $('.addChildTaskInp').focus()
    // ======事件绑定======//
    // 确定创建
    jQuery('#addChildTaskTr')
      .find('.sure_create_btn')
      .off()
      .on('click', (e: any) => {
        // 获取输入的任务名
        const newName =
          jQuery(e.target)
            .parents('td')
            .find('.addChildTaskInp')
            .val() + ''
        // 设置新增的子任务
        addChildTask(rowData, newName || '')
        // 移除节点
        jQuery(e.target)
          .parents('tr')
          .remove()
      })

    // 取消创建
    jQuery('#addChildTaskTr')
      .find('.cancel_create_btn')
      .off()
      .on('click', (e: any) => {
        jQuery(e.target)
          .parents('tr')
          .remove()
      })
  }

  /**
   * 新增子任务弹框显示
   */
  const addChildTask = (rowData: any, newName: string) => {
    const param = {
      ascriptionId: rowData.ascriptionId,
      ascriptionName: rowData.ascriptionName,
      parentId: rowData.id,
      name: newName,
      createType: 0, //0快速创建 1弹窗创建
      type: rowData.type || 0,
    }
    quickCreateTask(param).then((res: any) => {
      const newTask = res.data.data
      refreshTaskList({
        optType: 'addChildTask',
        taskIds: [rowData.id],
        childLevel: rowData.childLevel,
        parentId: rowData.id,
        newChild: newTask,
        rowData,
      })
    })
  }

  /**
   * 附件详情弹框显示
   */
  const fileDetailShow = (rowData: any) => {
    // 获取附件真实名字
    const fileItem = stateTmp.headerList.filter((item: any) => item.code == 11)[0]
    const fileDetailParam = {
      visible: true,
      taskId: rowData.id,
      ascriptionId: rowData.ascriptionId,
      titName: fileItem.name,
    }
    setFileModal(fileDetailParam)
  }

  /**
   * 查询任务详情，按模式显示
   */
  const findDetailByMode = ({
    mode,
    taskId,
    taskData,
    widChange,
    init,
  }: {
    mode: number
    taskId: string
    taskData: any
    widChange?: boolean //是否切换模式
    init?: boolean
  }) => {
    nowTask = taskData
    nowDetailTask = { ...taskData }
    // console.log('获取到的task详细信息', taskData)
    // 宽详情
    if (mode == 1) {
      wideDetailTmp = { ...wideDetail, mode: mode, taskId: taskId }
      let nameWid = 240
      const win: any = $(window)
      if (win.width() < 1404) {
        nameWid = 280
      }
      if (widChange) {
        nameColWid = nameWid
        const firstCol = jQuery('#taskManageListTableSec')
          .find('.ant-table-tbody>tr')
          .eq(1)
          .find('td')

        // 第一个任务添加选中状态
        firstCol.addClass('wide_active')
        // 初始加载直接获取任务名列宽度，其他情况从节点获取；然后减去它设置宽详情部分宽度
        if (!init) {
          nameColWid = firstCol.outerWidth() || 0
        }
        $('#taskWideDetail').css({ width: `calc(100% - ${nameColWid}px)` })
        // setWideDetailPos({
        //   width: `calc(100% - ${nameColWid}px)`,
        //   // width: 'calc(100% - 353px)',
        // })
        $()
      }
      const refresh = new Date().getTime().toString()
      setWideDetail({ ...wideDetail, mode: mode, taskId: taskId, refresh })
      // setTbodyH(0)
    }
    // 列表模式查询详情（弹框）
    else {
      jQuery('#taskManageListTableSec')
        .find('.wide_active')
        .removeClass('wide_active')
      setTaskData(taskData)
      setTaskid(taskId)
      // setTaskdetail(true)
      detailRef.current && detailRef.current.setState({ visible: true, id: taskId })
    }
  }
  // =========================================表格内容操作 end==============================================//

  // ********************************列拖动******************************//
  let dragStartX = 0,
    dragStartWid = 0,
    dragStartI = 0
  // 控制点击列改变宽是否生效
  let changeWid = false
  /**
   * 渲染为可拖动列
   * @param getColumns 所有列
   */

  const renderCol = (getColumns: any, init?: boolean) => {
    const newCols = getColumns.map((col: any, index: number) => ({
      ...col,
      // render: (value: any, item: any) => {
      //   const obj: any = {
      //     children: <SetColContent key={item.id + '_' + index} item={item} code={col.code} colIndex={index} />,
      //   }
      //   return obj
      // },
      onHeaderCell: (column: any) => ({
        width: column.width,
        colData: column,
        // onResize: handleResize(index),
        onResizeStart: (e: any, { size }: any) => {
          e.stopPropagation()
          dragStartX = e.pageX
          dragStartWid = size.width
          dragStartI = index
          changeWid = true
          if ($('#taskTableColDragBar').length == 0) {
            $('body').append('<div id="taskTableColDragBar" class="taskTableColDragBar"></div>')
          }
          const setH = $('#taskManageListTableSec').height()
          const offset: any = $(e.target) && $(e.target).offset() ? $(e.target).offset() : {}
          const thisLeft = offset.left + 3
          const thisTop = offset.top
          $('#taskTableColDragBar')
            .show()
            .css({
              left: thisLeft + 'px',
              top: thisTop + 'px',
              height: setH + 'px',
            })
          // 鼠标弹起，结束拖动
          $(document)
            .off('mousemove mouseup')
            .on('mousemove', function(e: any) {
              // 获取鼠标位置
              const getE = e || window.event
              let movex = 0
              if (getE.pageX) {
                movex = getE.pageX
              }
              // *********拖动手柄处理*********//
              $('#taskTableColDragBar').css({
                left: movex,
              })
            })
            .on('mouseup', (e: any) => {
              const dragDiff = e.pageX - dragStartX
              if (stateTmp.columns[dragStartI]) {
                // 最小宽度：任务名280，其他70
                const minWid = dragStartI == 0 ? 280 : 70
                stateTmp.columns[dragStartI].width =
                  dragStartWid + dragDiff < minWid ? minWid : dragStartWid + dragDiff
              }

              // firstColWid = stateTmp.columns[dragStartI].width
              const newCol = renderCol([...stateTmp.columns])
              dispatch({
                type: ['columns'],
                data: { columns: [...newCol] },
              })
              jQuery('#taskTableColDragBar')
                .hide()
                .remove()
              jQuery(document).off('mousemove mouseup')
              changeWid = false

              let biaochang = 0 //计算表长
              stateTmp.columns.forEach((itm: any) => {
                biaochang = biaochang + itm.width
              })
              //计算表头
              let biaotou = 0
              biaotou = Number(
                jQuery('.taskManageListContainer .taskManageListTable .ant-table-header')?.outerWidth()
              )

              if (
                biaochang > biaotou + stateTmp.columns[stateTmp.columns.length - 1].width - 100 ||
                stateTmp.columns[stateTmp.columns.length - 1].width < 100
              ) {
                jQuery('.taskManageListContainer .taskManageListTable .ant-table-body').removeClass(
                  'hidescroll'
                )
              } else {
                jQuery('.taskManageListContainer .taskManageListTable .ant-table-body').addClass('hidescroll')
              }
            })
        },
        onMouseUp: (e: any) => {
          e.stopPropagation()
          if (!changeWid) {
            return
          }
          const dragDiff = e.pageX - dragStartX
          if (stateTmp.columns[dragStartI]) {
            // 最小宽度：任务名280，其他70
            const minWid = dragStartI == 0 ? 280 : 70
            stateTmp.columns[dragStartI].width =
              dragStartWid + dragDiff < minWid ? minWid : dragStartWid + dragDiff
          }
          const newCol = renderCol([...stateTmp.columns])
          dispatch({
            type: ['columns'],
            data: { columns: [...newCol] },
          })
          changeWid = false
          console.log('onMouseUp')
        },
        thContent: () => <ThContent key={index} colData={column} />,
      }),
      // 单元格
      onCell: (rowData: any, rowIndex: number) => ({
        rowData,
        rowIndex,
        colindex: col,
        refreshTaskList,
        wideInit: (taskContext.listMode == 1 && init) || (taskContext.listMode == 1 && delFirst) ? true : false,
        listMode: taskContext.listMode,
      }),
    }))
    return newCols
  }
  /**
   * 表头列内容
   */
  const ThContent = ({ colData }: { colData: any }) => {
    const [sortObj, setSortObj] = useState({ priority: '', limitTime: '' })
    const { code, title } = colData
    let thContent: any = ''

    switch (code) {
      // 优先级
      case 2:
      // 截止时间
      case 8:
        let activeSort = ''
        // 截止时间
        if (code == 8) {
          activeSort = sortObj.limitTime
        }
        // 优先级
        else {
          activeSort = sortObj.priority
        }
        thContent = (
          <div className="taskFlexTh my_ellipsis">
            <span>{title || ''}</span>
            <div className="thSortBox">
              <span
                className={`img_icon th_sort_btn th_sort_up ${activeSort == 'up' ? 'active' : ''}`}
                onClick={() => {
                  if (activeSort == 'up') {
                    activeSort = ''
                  } else {
                    activeSort = 'up'
                  }
                  if (code == 8) {
                    thSortObj = { ...sortObj, limitTime: activeSort }
                  } else {
                    thSortObj = { ...sortObj, priority: activeSort }
                  }
                  setSortObj(thSortObj)
                  queryTaskList({ thSort: true })
                }}
              ></span>
              <span
                className={`img_icon th_sort_btn th_sort_down ${activeSort == 'down' ? 'active' : ''}`}
                onClick={() => {
                  if (activeSort == 'down') {
                    activeSort = ''
                  } else {
                    activeSort = 'down'
                  }
                  if (code == 8) {
                    thSortObj = { ...sortObj, limitTime: activeSort }
                  } else {
                    thSortObj = { ...sortObj, priority: activeSort }
                  }
                  setSortObj(thSortObj)
                  queryTaskList({ thSort: true })
                }}
              ></span>
            </div>
          </div>
        )
        break
      default:
        thContent = <div className="taskFlexTh my_ellipsis">{title || ''}</div>
        break
    }
    return thContent
  }
  /**
   * 拖动列宽改变
   * @param index
   */
  // const handleResize = (index: any) => (e: any, { size }: any) => {
  //   if (stateTmp.columns[index]) {
  //     stateTmp.columns[index].width = size.width
  //   }
  //   const newCol = renderCol([...stateTmp.columns])
  //   dispatch({
  //     type: ['columns'],
  //     data: { columns: [...newCol] },
  //   })
  // }
  /**
   * 表格集成组件
   */
  const components = {
    // 表头拖动
    header: {
      cell: ResizableTitle,
    },
    body: {
      row: DragableBodyRow,
      cell: DragableBodyCell,
    },
  }

  const [tableHeadSetModal, setTableHeadSetModal] = useState(false)
  const closeModal = () => {
    setTableHeadSetModal(false)
  }
  // ****************************************************表格处理 end********************************************************//

  // **************************表格刷新**************************//

  /**
   * 递归查找当前任务并且添加新增任务
   */
  // const addBlankTask = (paramObj: { dataList: any; findId: string; finded: number; newChild: any }) => {
  //   let finded = paramObj.finded
  //   const findId = paramObj.findId
  //   for (let i = 0; i < paramObj.dataList.length; i++) {
  //     const item = paramObj.dataList[i]
  //     if (findId == item.id) {
  //       const children = paramObj.dataList[i].children || []
  //       children.push(paramObj.newChild)
  //       paramObj.dataList[i].children = children
  //       finded++
  //       break
  //     }
  //     if (finded < 1 && item.children && item.children.length > 0) {
  //       paramObj.dataList = item.children
  //       paramObj.finded = finded
  //       addBlankTask(paramObj)
  //     }
  //   }
  // }

  /**
   * 递归查找当前任务进行替换
   */
  const replaceTask = (paramObj: {
    dataList: any
    taskIds: any
    newDatas: any
    finded: number //记录匹配到的任务，匹配完毕停止递归遍历
    optType?: string
    newChild?: any
    e?: any
  }) => {
    const taskIds = paramObj.taskIds
    const newDatas = paramObj.newDatas
    let finded = paramObj.finded || 0
    const optType = paramObj.optType
    for (let i = 0; i < paramObj.dataList.length; i++) {
      const item = paramObj.dataList[i]
      if (taskIds.includes(item.id)) {
        // 新的任务数据列表中匹配出当前任务进行替换更新
        const newDataItem = newDatas.filter((newItem: any) => newItem.id === item.id)
        const findItem = newDataItem[0] || {}
        for (const key in newDataItem[0]) {
          const val = newDataItem[0][key]
          // 排除不更新的健，更新children会导致子节点清空，故不更新
          if (key != 'id' && key != 'key' && key != 'children') {
            paramObj.dataList[i][key] = val
          }
        }
        // 新增子任务
        if (
          (optType == 'addChildTask' || optType == 'assign' || optType == 'editParentTask') &&
          paramObj.newChild
        ) {
          paramObj.newChild.childLevel = true
          const children = item.children || []
          // 存储父级id
          paramObj.newChild.parentId = item.id
          // 存储上一个任务数据
          if (children.length - 2 >= 0) {
            paramObj.newChild.preId = children[children.length - 2].id
          }
          // 存储下一个任务数据(push到最后位置，无下个兄弟)
          paramObj.newChild.nextId = ''
          if (!paramObj.dataList[i].children) {
            paramObj.dataList[i].children = []
          }
          paramObj.dataList[i].children.push(paramObj.newChild)
          treeListMap[paramObj.newChild.id] = { ...paramObj.newChild }
        }
        finded++
        treeListMap[findItem.id] = { ...findItem }
      }
      // 匹配完毕即停止递归遍历
      if (finded < taskIds.length && item.children && item.children.length > 0) {
        replaceTask({
          ...paramObj,
          dataList: item.children,
          finded,
        })
      }
    }
  }

  /**
   * 拖动后更新源任务和目标任务
   */
  const dragUpdateTask = (
    dataList: any,
    paramObj: {
      dragType: number
      sourceItem: any
      sourcePtItem: any
      targetItem: any
      targetPtItem: any
      handleList: any
      isFirst?: any
      srcChildLevelOld: boolean
      sourceRemove?: boolean //是否查找到源节点并已经删除
    }
  ) => {
    const newTask: any = { ...paramObj.sourceItem, dragAdd: true }
    const targetId = paramObj.targetItem.id
    // 首层任务拖至首层任务的平级时，更新首层数组顺序
    if (paramObj.dragType == 0 && !paramObj.srcChildLevelOld && !paramObj.targetItem.childLevel) {
      let removeI: any = null,
        targetI = 0
      for (let i = dataList.length - 1; i > 0; i--) {
        const item = dataList[i]
        // 移除源任务
        if (item.id == paramObj.sourceItem.id) {
          removeI = i
        }
        if (item.id == targetId) {
          targetI = i - 1 < 0 ? 0 : i - 1
        }
      }
      return update(dataList, {
        $splice: [
          [removeI, 1],
          [targetI, 0, newTask],
        ],
      })
    } else {
      let newList = dataList
      let targetI = 0
      let removeI = 0
      // 是否查询到需要移除的源节点
      let isRemove = false
      let targetChilds = []
      // 移除源任务
      for (let i = 0; i < newList.length; i++) {
        const item = newList[i]
        // if (item.dragAdd) {
        //   console.log('dragAdd:', item.dragAdd)
        // }
        // 判断本次遍历的不是新增的子任务之后(dragAdd-被拖动新增的任务标识)，再判断：被移除任务在顶层时直接移除，非顶层时需要确定当前父任务是否一致
        if (item.id == paramObj.sourceItem.id && !item.dragAdd) {
          if (
            !item.parentId ||
            (item.parentId && paramObj.sourcePtItem && item.parentId == paramObj.sourcePtItem.id)
          ) {
            removeI = i
            isRemove = true
          }
        }
        // 拖至首层,记录拖至位置，之后插入新数据
        if (!paramObj.targetItem.childLevel && paramObj.isFirst) {
          if (item.id == paramObj.targetItem.id) {
            targetI = i
            targetChilds = item.children || []
            // 存储上一个任务数据
            if (i - 1 >= 0) {
              newTask.preId = newList[i - 1]
            }
            // 存储下一个任务数据
            if (i + 1 < newList.length) {
              newTask.nextId = newList[i + 1]
            }
          }
        }
        // 查到新增任务后便可以重置 isNewAdd
        if (item.id == paramObj.sourceItem.id && item.dragAdd) {
          item.dragAdd = false
        }
      }
      // A 拖至首层时
      if (!paramObj.targetItem.childLevel && paramObj.isFirst) {
        // 1 拖成首层平级，首层重新排序
        if (paramObj.dragType == 0) {
          newList = update(newList, {
            $splice: [
              [0, 0],
              [targetI, 0, newTask],
            ],
          })
        }
        // 2 拖成首层子任务(判断是否加载过子任务，没有加载过，则不push，等点击展开)
        else if (paramObj.targetItem.subTaskCount > 0 && paramObj.targetItem.children.length > 0) {
          // 更新被拖动任务的父任务为目标任务
          newTask.parentId = paramObj.targetItem.id
          // 2.1 给目标节点添加子任务
          targetChilds.push(newTask)
          newList[targetI].children = targetChilds
        }
        paramObj.isFirst = false
        console.log(newList)
      }
      // 3 查找到源节点则移除源节点
      if (isRemove) {
        newList = update(newList, {
          $splice: [[removeI, 1]],
        })
        paramObj.sourceRemove = true
      }
      return newList.map((item: any, i: number) => {
        // 上面已经做了remove检测操作，此时可以恢复dragAdd为默认值
        if (item.dragAdd) {
          item.dragAdd = false
        }
        let targetChilds = item.children || []
        // map方法
        // B 非拖至首层情况时，添加目标任务到父任务
        if (paramObj.targetItem.childLevel && item.id == paramObj.targetPtItem.id) {
          // 存储所属父任务数据
          newTask.parentId = paramObj.targetPtItem.id
          // 存储上一个任务数据
          if (i - 1 >= 0) {
            newTask.preId = newList[i - 1]
          }
          // 存储下一个任务数据
          if (i + 1 < newList.length) {
            newTask.nextId = newList[i + 1]
          }

          // 拖动成平级，则目标父任务下子任务需要重新排序
          if (paramObj.dragType == 0) {
            let targetI = 0
            // let removeI=0;
            for (let t = targetChilds.length - 1; t > 0; t--) {
              const childItem = targetChilds[t]
              if (childItem.id == targetId) {
                targetI = i - 1 < 0 ? 0 : i - 1
                break
              }
              // if(childItem.id == sourceId){
              //   removeI = i - 1 < 0 ? 0 : i - 1
              // }
            }
            targetChilds = update(targetChilds, {
              $splice: [
                [0, 0],
                [targetI, 0, newTask],
              ],
            })
            console.log(targetChilds)
          }
          // 拖动成子任务，则只需要放置到目标任务子任务的最后位置
          // (判断是否加载过子任务，没有加载过，则不push，等点击展开)
          else if (paramObj.targetItem.subTaskCount > 0 && paramObj.targetItem.children.length > 0) {
            targetChilds.push(newTask)
          }
        }
        treeListMap[item.id] = { ...item }
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: dragUpdateTask(targetChilds, paramObj),
          }
        }
        return item
      })
    }
  }
  /**
   * 刷新列表
   * taskIds:查询多个任务的id数组
   * optType:操作类型
   * childLevel:是否是子级任务
   */
  const refreshTaskList = (infoObj: {
    rowData?: any
    taskIds: any
    optType?: string
    childLevel?: any
    childLevels?: any
    parentId?: string //新增子任务时需要父任务id
    parentIdOld?: any //编辑任务时更改父级任务前的父任务
    newChild?: any
    from?: string
    attachInfo?: { priType?: number; [propName: string]: any }
  }) => {
    const {
      taskIds,
      childLevel,
      optType,
      parentId,
      newChild,
      attachInfo,
      from,
      parentIdOld,
      childLevels,
    } = infoObj
    delFirst = false
    // 是否全局刷新（没有局部刷新效果）
    let isDef = false
    // 附属数据对象
    const attachObj: any = attachInfo ? attachInfo : {}
    let tableList = stateTmp.contentList
    const { nowUserId } = $store.getState()
    const paramObj: any = {
      dataList: tableList,
      taskIds,
      finded: 0, //已匹配到的数量，用于暂停递归
      optType,
      newChild: newChild || null,
    }
    const expandedRows = stateTmp.expandedRowKeys || []
    // 需要查询的任务id列表
    let taskIdList: any = taskIds || []
    const thisTask = treeListMap[taskIds[0]] || {}
    let newChildLevel = childLevel
    const nowTaskInfo: any = { item: null }
    // 列表操作后如果是当前宽详情任务则刷新宽详情
    // 删除和新增任务情况下宽详情刷新单独处理
    if (optType != 'del' && optType != 'addTask' && taskContext.listMode == 1 && taskIds[0] == nowTask.id) {
      wideDetailRef.current && wideDetailRef.current.wideRefreshFn({ id: taskIds[0] })
    }
    // 归档任务下创建任务不刷新
    // if (
    //   $('.taskTypeOutTag .taskTypeTagItem')
    //     .eq(1)
    //     .hasClass('active')
    // ) {
    //   return
    // }
    switch (optType) {
      case 'assign': //指派
      // 新增子任务
      case 'addChildTask':
        // 放入子任务
        taskIdList.push(newChild.id)
        break
      // 编辑任务
      case 'editTask':
        /**
         * 判断是否更新了归属父任务
         */
        // 有更新才做一下处理，没有更新则只刷新当前任务
        if (parentIdOld != (parentId || '')) {
          taskIdList = []
          const newChilds = setTreeTableData({
            data: [newChild],
            childLevel: true,
            headerList: stateTmp.headerList,
            parentId,
            isRoot: true,
          })
          // ==========1 更改前的父任务移除当前任务==========//
          if ((parentIdOld && treeListMap[parentIdOld]) || (!parentIdOld && !thisTask.childLevel)) {
            const parentRowOld = treeListMap[parentIdOld] || {}
            const handleType = 'del'
            handleNowTask({
              dataList: tableList,
              findId: taskIds[0],
              taskInfo: nowTaskInfo,
              optType: handleType,
              nowUserId,
              initDataList: tableList,
            })
            parentIdOld && taskIdList.push(parentIdOld)
            // 更新查询到的当前任务的childLevel
            newChildLevel = parentRowOld.childLevel
            // 移除任务后
            if (taskIds[0] == nowTask.id) {
              // 如果删除了第一条任务，并且是选中任务
              if (nowTask.preId) {
                nowTask = treeListMap[nowTask.preId]
              } else if (nowTask.nextId) {
                nowTask = treeListMap[nowTask.nextId]
              } else if (nowTask.parentId) {
                nowTask = treeListMap[nowTask.parentId]
              } else if (tableList[0]) {
                nowTask = tableList[0]
              }
            }
            if (nowTask.id) {
              wideDetailRef.current && wideDetailRef.current.wideRefreshFn({ id: nowTask.id })
            }
          }
          // 删除了归属父任务，则此任务移动到第一层
          if (parentIdOld && !parentId) {
            let getIndex = -1
            tableList.forEach((item: any, index: number) => {
              if (item.id == newChilds[0].id) {
                getIndex = index
              }
            })
            if (getIndex == -1) {
              // 在第一个位置添加当前任务
              tableList = [newChilds[0], ...tableList]
            } else {
              tableList[getIndex] = newChilds[0]
            }
          }
          // 存在父任务，则新增到父任务中，同时更改前的父任务移除当前任务
          else if (parentId && parentIdOld != parentId) {
            // ==========1 新增子任务到新的父任务==========//
            paramObj.newChild = newChilds[0]
            taskIdList.push(parentId)
          }
          const getIndex = expandedRows.findIndex((item: any) => item == newChilds[0].id)
          if (getIndex != -1) {
            expandedRows.splice(getIndex, 1)
            dispatch({
              type: ['expandedRowKeys'],
              data: { expandedRowKeys: expandedRows },
            })
          }
        }
        break
      case 'archive': //归档
      case 'del': //删除
        if (tableList.length == 1 && taskIds[0] == tableList[0].id) {
          queryTaskList()
          return
        }
        // 查询当前任务并删除
        // 如果删除了选中任务
        if (taskIds[0] == nowTask.id) {
          // 如果删除了第一条任务，并且是选中任务
          if (taskIds[0] == tableList[0].id) {
            delFirst = true
            nowTask = tableList[1]
            firstTask = tableList[1]
            $('#addChildTaskTr').remove()
          } else {
            if (nowTask.preId) {
              nowTask = treeListMap[nowTask.preId]
            } else if (nowTask.nextId) {
              nowTask = treeListMap[nowTask.nextId]
            } else if (nowTask.parentId) {
              nowTask = treeListMap[nowTask.parentId]
            } else if (tableList[0]) {
              nowTask = tableList[0]
            }
          }
        }
        if (nowTask.id) {
          wideDetailRef.current && wideDetailRef.current.wideRefreshFn({ id: nowTask.id })
        }
        if (treeListMap[taskIds[0]]) {
          nowTaskInfo.item = treeListMap[taskIds[0]] || {}
          const parentRow = treeListMap[nowTaskInfo.item.parentId] || {}
          handleNowTask({
            dataList: tableList,
            findId: taskIds[0],
            taskInfo: nowTaskInfo,
            optType,
            nowUserId,
            initDataList: tableList,
          })
          //满足删除条件
          if (nowTaskInfo.item && nowTaskInfo.item.childLevel) {
            taskIdList = [nowTaskInfo.item.parentId || {}]
            // 更新查询到的当前任务的childLevel
            newChildLevel = parentRow.childLevel
          }
          // 删除顶层时没有父任务，无需查询数据
          else {
            taskIdList = []
          }
        }
        // 没有查询到要删除任务
        else {
          isDef = true
        }
        break
      case 'finish': // 一键完成
      case 'unfinish': // 取消完成
      case 'editLiber': //编辑领导责任人
      case 'freeze': //冻结
      case 'unfreeze': //解冻
        // 查询当前任务
        findNowTask({
          dataList: tableList,
          findId: taskIds[0],
          taskInfo: nowTaskInfo,
        })
        // 根据当前任务递归查询所有子任务
        const findChilds = findChildNexts({
          dataList: [nowTaskInfo.item || {}],
        })
        //更新需要查询的任务id
        taskIdList = findChilds.idList || []
        break
      case 'report': // 汇报
        // 查询当前任务
        // 根据当前任务递归查询所有父任务
        nowTaskInfo.item = treeListMap[taskIds[0]]
        const findPts = findPtNexts({
          dataList: [nowTaskInfo.item],
        })
        // 更新查询到的当前任务的childLevel
        newChildLevel = nowTaskInfo.item.childLevel
        //更新需要查询的任务id
        taskIdList = findPts.idList || []
        break
      case 'transfer': //移交/
      case 'editExecute': //编辑执行人
        // 查询编辑后的任务是否还在当前页面，没有则删除，否则替换
        // 操作的是子级任务
        if (childLevel && parentId) {
          queryChildTask({
            onlyFind: true,
            findId: parentId,
            operateId: taskIds[0], //当前操作的任务id
          }).then(({ isDel }: any) => {
            // 查询不到数据则数据已不在当前位置，进行删除
            if (isDel) {
              // 从任务列表数据中删除
              handleNowTask({
                dataList: tableList,
                findId: taskIds[0],
                taskInfo: nowTaskInfo,
                optType: optType,
                nowUserId,
                isDel: isDel,
                initDataList: tableList,
              })
            } else {
              taskIdList = [taskData]
            }
          })
        }
        // 操作的是根级任务
        else {
          queryTaskList({
            onlyFind: true,
            findId: taskIds[0],
          }).then((res: any) => {
            // 查询不到数据则数据已不在当前位置，进行删除
            if (res.isDel) {
              // 从任务列表数据中删除
              handleNowTask({
                dataList: tableList,
                findId: taskIds[0],
                taskInfo: nowTaskInfo,
                optType: optType,
                nowUserId: $store.getState().nowUserId,
                isDel: res.isDel,
                initDataList: tableList,
              })
            } else {
              taskIdList = [taskData]
            }
          })
        }

        break
      case 'editPriority': //编辑优先级
      case 'all': //全局刷新
        isDef = true
        queryTaskList()
        break
      case 'priorityStar': //编辑优先级占用
        attachObj.nowTaskChange = false
        setTreeTableData({
          data: tableList,
          headerList: stateTmp.headerList,
          optType: 'priorityStar',
          attachInfo: attachObj,
        })
        // if (wideDetail.mode == 1 && attachObj.nowTaskChange) {
        //   wideDetailRef.current && wideDetailRef.current.wideRefreshFn({ id: nowTask.id })
        // }
        taskIdList = []
        break
      default:
        break
    }
    if (isDef) {
      return
    }
    if (taskIdList.length == 0) {
      // 不查询任务数据，直接更新遍历更改后的的数据
      dispatch({
        type: ['contentList'],
        data: { contentList: [...tableList] },
      })
    } else {
      // 查询任务最新数据进行更新
      queryTaskById({ taskIds: taskIdList }).then((dataList: any) => {
        // 表格内容组装
        const newDatas = setTreeTableData({
          data: dataList,
          childLevels,
          childLevel: newChildLevel,
          headerList: stateTmp.headerList,
        })
        let isUpdate = true
        // 新增任务直接添加到第一个位置
        if (optType == 'addTask') {
          const thisNewTask = newDatas[0] || {}
          const liable = thisNewTask.liable || {}
          const { taskManageTreeInfo } = $store.getState()
          const orgInfo = taskManageTreeInfo.orgInfo
          nowTask = dataList[0]
          firstTask = dataList[0]

          // 需要添加新增任务到当前页的情况：
          // 1 我的任务下判断执行人是否是自己
          // 2 非我的任务下判断执行人是否是自己&&是否在当前选中企业下
          if (
            (!taskManageTreeInfo.isMy &&
              orgInfo.cmyId == thisNewTask.ascriptionId &&
              nowUserId == liable.userId) ||
            (taskManageTreeInfo.isMy && nowUserId == liable.userId)
          ) {
            isUpdate = true
            tableList = [thisNewTask, ...tableList]
            // 宽详情模式下刷新宽详情
            if (taskContext.listMode == 1 && nowTask) {
              wideDetailRef.current && wideDetailRef.current.wideRefreshFn({ id: taskIds[0] })
            }
          } else {
            isUpdate = false
          }
        } else {
          paramObj.newDatas = newDatas
          if (
            optType == 'addChildTask' ||
            optType == 'assign' ||
            (optType == 'editTask' && parentId && (parentId || '') != parentIdOld)
          ) {
            if (!expandedRows.includes(parentId)) {
              expandedRows.push(parentId)
              expandNode({
                expanded: true,
                row: from && from.includes('taskDetail') ? nowDetailTask : { id: parentId },
                handExp: expandedRows,
              })
              return
            } else {
              const parentOldI = taskIdList.indexOf(parentIdOld)
              if (parentOldI > -1) {
                taskIdList.splice(parentOldI, 1)
                paramObj.optType = 'editParentTask'
                paramObj.taskIds = taskIdList
              } else {
                let _newChild: any = null
                const _newDatas: any[] = []
                const newDataIds: any[] = []
                newDatas.map((item: any) => {
                  if (item.id == paramObj.newChild.id) {
                    _newChild = item
                  } else {
                    _newDatas.push(item)
                    newDataIds.push(item.id)
                  }
                })
                paramObj.newChild = _newChild
                paramObj.newDatas = _newDatas
                paramObj.taskIds = newDataIds
              }
              replaceTask({ ...paramObj })
            }
          } else {
            // 移除父任务
            if (!parentId && parentIdOld && !dataList[0]?.subTaskCount) {
              expandedRows.splice(expandedRows.indexOf(parentIdOld), 1)
            }
            replaceTask({ ...paramObj, taskIds: taskIdList })
          }
        }
        if (!isUpdate) {
          return
        }
        dispatch({
          type: ['contentList'],
          data: { contentList: [...tableList] },
        })
        nowDetailTask = { ...nowTask }
      })
    }
  }

  /**
   * 拖动接口调用
   */
  const dragTaskApi = (info: any) => {
    return new Promise(resolve => {
      const taskInfo = $store.getState().taskManageTreeInfo
      const orgInfo = taskInfo.orgInfo
      // 获取筛选结果
      const fliterObj = (getFilterResFn && getFilterResFn()) || {}
      let typeId: any = 0,
        enterpriseId: any = 0
      let nowType = 0
      if (!taskInfo.isMy) {
        nowType = orgInfo.curType
        // 点击人员的时候传上级部门
        if (orgInfo.curType == 0) {
          typeId = orgInfo.parentId
        } else {
          typeId = orgInfo.curId
        }
        enterpriseId = orgInfo.cmyId
      }
      const param: any = {
        fromTaskId: info.srcId,
        toTaskId: info.toId,
        dragType: info.dragType,
        operateUser: $store.getState().nowUserId,
        operateUserName: $store.getState().nowUser,
        account: $store.getState().nowAccount,
        typeId: typeId,
        enterpriseId: enterpriseId,
        taskType: fliterObj.taskTypes,
      }
      if (info.isTop != undefined) {
        param.isSeePage = info.isTop
      }
      if (taskInfo.isMy) {
        param.isAllTask = 1
      } else if (!taskInfo.isMy && nowType == 0) {
        param.userId = orgInfo.curId
      }
      console.log(param)
      requestApi({
        url: '/task/attach/drag',
        param: param,
        json: true,
        successMsg: '拖动成功',
      }).then((res: any) => {
        if (res.success) {
          resolve(res)
        }
      })
    })
  }
  /**
   * 拖动检验
   */
  const dragTaskCheck = ({
    dragPos,
    sourceRow,
    targetRow,
    targetNode,
  }: {
    dragPos: string
    sourceRow: any
    targetRow: any
    targetNode: any
  }) => {
    if (sourceRow.id == targetRow.id) {
      return
    }
    // 拖动到不同类型时
    // const srcTaskType = taskTypeName(sourceRow.type)
    // const tgTaskType = taskTypeName(targetRow.type)
    const dragSure = () => {
      dragTaskSure({
        dragPos,
        sourceRow,
        targetRow,
        targetNode,
      })
    }
    // if (dragPos == 'mid' && sourceRow.type != targetRow.type) {
    //   setDragDiffModal({
    //     visible: true,
    //     content: `拖动到此会将此${srcTaskType}任务变成${tgTaskType}任务，确认拖动吗？`,
    //     dragTaskSure: dragSure,
    //   })
    // } else {
    //   dragSure()
    // }
    // 新版-不同类型不再提示
    dragSure()
  }

  /**
   * 拖动任务放置时
   */
  const dragTaskSure = ({
    dragPos,
    sourceRow,
    targetRow,
    targetNode,
  }: {
    dragPos: string
    sourceRow: any
    targetRow: any
    targetNode: any
  }) => {
    // console.log({ dragType, sourceItem, targetItem })
    const sourceItem = { ...sourceRow }
    // const sourceItem = JSON.parse(JSON.stringify(sourceRow))
    let targetItem = targetRow
    const targetPtRow = treeListMap[targetItem.parentId] || {}
    const srcChildLevelOld = sourceItem.childLevel
    // 拖动类型：0平级 1子任务
    let dragType = 0
    if (dragPos == 'mid') {
      dragType = 1
    } else {
      const isExpand = $(targetNode)
        .find('.treeTableIcon')
        .hasClass('expanded')
      if (dragPos == 'down') {
        /**
         * 拖动到任务下方平级时，因为后台设置为目标任务的平级后为出现在目标任务上方，故需分析情况重新寻找目标任务，放置其上方
         * 拖动到目标下方情况分析：
         * 1 目标节点有子任务:
         * 1.1 目标任务展开时，则目标节点改为第一个子任务，并成为平级
         * 1.2 目标任务未展开时，则目标节点改为同级下一个任务，并成为平级
         * 2 目标节点无子任务:
         * 2.1 目标是其父任务的最后一个子任务，则目标节点改为父任务的下一个任务，并成为平级
         * 2.2 目标不是其父任务的最后一个子任务，则目标节点改为下一个任务，并成为平级
         */
        if (targetItem.subTaskCount && targetItem.children.length > 0) {
          // 情况1.1
          if (isExpand) {
            targetItem = targetItem.children[0]
          }
          // 情况1.2
          else {
            // 查询同级下一个任务
            // 目标为顶层任务时，查询范围取第一层数据
            const parentItem = targetItem.childLevel ? targetPtRow : stateTmp.contentList
            targetItem = findNowFromPt(parentItem, targetItem.id)
          }
        } else if (targetItem.subTaskCount == 0) {
          // 情况2.1 目标是其父任务的最后一个子任务
          if (targetItem.childLevel && targetItem.parentId) {
            const isLastChild = targetPtRow.children[targetPtRow.children.length - 1].id == targetItem.id
            if (isLastChild) {
              targetItem = treeListMap[targetPtRow.nextId] || {}
            } else {
              targetItem = treeListMap[targetItem.nextId] || {}
            }
          }
          // 情况2.2 目标为顶层任务时
          else if (targetItem.nextId) {
            targetItem = treeListMap[targetItem.nextId] || {}
          }
        }
      }
    }
    let isTop = 0
    // 顶层到顶层
    if (!sourceItem.childLevel && !targetItem.childLevel) {
      isTop = 1
    } else if (sourceItem.childLevel && !targetItem.childLevel) {
      isTop = 2
    }
    const param: any = {
      dragType: dragType,
      srcId: sourceItem.id,
      toId: targetItem.id,
    }
    // 拖成子任务不传isTop
    if (dragType == 0) {
      param.isTop = isTop
    }
    dragTaskApi(param).then(() => {
      // ***1 移除源任务和更新目标任务的位置***//
      let targetPtItem = {}
      const sourcePtItem = treeListMap[sourceItem.parentId] || {}
      // 目标任务的父任务
      if (dragType == 0) {
        //平级
        targetPtItem = treeListMap[targetItem.parentId] || {}
        // 更新源任务层级关系
        sourceItem.childLevel = targetItem.childLevel
      } else {
        // 拖成子任务
        targetPtItem = targetItem
        sourceItem.childLevel = true
      }
      const dragParam = {
        dragType: dragType,
        sourceItem: sourceItem,
        sourcePtItem: sourcePtItem,
        targetItem: targetItem,
        targetPtItem: targetPtItem,
        handleList: stateTmp.contentList,
        srcChildLevelOld: srcChildLevelOld,
        isFirst: true,
        sourceRemove: false,
      }
      stateTmp.contentList = dragUpdateTask(stateTmp.contentList, dragParam)
      console.log(stateTmp.contentList)
      // ***2 更新源任务和目标任务的父任务***//
      const taskIds = []
      const childLevels = {}
      // 源任务非首层时，更新源任务的父任务
      if (srcChildLevelOld && sourceItem.parentId) {
        taskIds.push(sourceItem.parentId)
        childLevels[sourceItem.parentId] = sourcePtItem.childLevel
      }
      // 首层任务拖至首层任务的平级时，更新首层数组顺序
      if (dragType == 0 && !srcChildLevelOld && !targetItem.childLevel) {
        dispatch({
          type: ['contentList'],
          data: { contentList: [...stateTmp.contentList] },
        })
      } else {
        // 目标任务的父任务
        if (dragType == 0 && targetItem.parentId) {
          //拖成平级时，更新当前任务的父任务
          taskIds.push(targetPtRow.id)
          childLevels[targetPtRow.id] = targetPtRow.childLevel
        } else {
          //拖成子任务时，更新当前任务
          taskIds.push(targetItem.id)
          childLevels[targetItem.id] = targetItem.childLevel
        }
        if (taskIds.length > 0) {
          refreshTaskList({
            taskIds: taskIds,
            childLevels: childLevels,
            optType: '',
          })
        } else {
          dispatch({
            type: ['contentList'],
            data: { contentList: [...stateTmp.contentList] },
          })
        }
      }
    })
  }
  return (
    <section
      className={`taskManageListContainer taskManageListTableSec relative  ${
        wideDetail.mode == 1 ? 'wide_detail' : 'table_detail'
      }`}
      id="taskManageListTableSec"
      // style={{
      //   // borderLeft: taskListState.contentList.length === 0 ? '1px solid #e7e7e9' : '',
      //   backgroundColor: '#fff',
      // }}
    >
      {/* 表头设置按钮 */}

      <div
        className={`theadSetBox ${
          theadSetAuth && taskContext.listMode != 1 && taskListState.contentList.length != 0 ? '' : 'forcedHide'
        }`}
        title="设置表头"
        onClick={() => setTableHeadSetModal(true)}
      >
        <i className="img_icon thead_set_icon"></i>
      </div>
      {taskListState.contentList.length > 0 ? (
        <Table
          className="taskManageListTable taskListTable h100 task-list noTrHover"
          bordered
          columns={taskListState.columns}
          dataSource={taskListState.contentList}
          onExpand={(expanded: boolean, row: any) => {
            expandNode({
              expanded: expanded,
              row: row,
            })
          }}
          expandable={tableExpandable}
          locale={{ emptyText: <NoneData /> }}
          pagination={false}
          // scroll={{ x: 1200, y: taskListState.scrollY }}
          scroll={{ x: 1200, y: 'calc(100% - 32px)' }}
          components={components}
          expandedRowKeys={taskListState.expandedRowKeys}
          onExpandedRowsChange={onExpandedRowsChange}
          onRow={(record: any, index: any) => {
            return {
              onClick: () => {
                refreshFindThemeList && refreshFindThemeList()
              }, // 点击表头行
              rowData: record,
              index,
              dragTaskCheck,
            }
          }}
        />
      ) : (
        ''
      )}
      {taskListState.contentList.length == 0 ? (
        <NoneData
          className="threePosition"
          searchValue={taskListState.queryState}
          imgSrc={$tools.asAssetsPath(`/images/noData/no_task.png`)}
          showTxt={
            // taskTypeOutData.length > 1 && taskTypeOutData[1].active
            //   ? '将已完成的任务归档，可以让工作台看着更整洁哦~'
            //   :
            "'创建任务' 开启美好一天"
          }
          containerStyle={{ zIndex: 0 }}
        />
      ) : (
        ''
      )}
      {/* 表头设置弹框 */}
      {tableHeadSetModal ? <TableHeadSetModal visible={tableHeadSetModal} closeModal={closeModal} /> : ''}
      {/* 选择人员弹框 */}
      <SelectMemberOrg
        param={{
          visible: memberOrgShow,
          ...selMemberOrg,
        }}
        action={{
          setModalShow: setMemberOrgShow,
        }}
      />
      {/* 任务详情（列表模式需要） */}
      {wideDetail.mode != 1 ? (
        <DetailModal
          param={{ from: 'taskManage', id: taskid, taskData: taskData }}
          ref={detailRef}
        ></DetailModal>
      ) : (
        ''
      )}
      {/* 宽详情 */}
      <section
        className={`taskDetails taskWideDetail ${
          wideDetail.mode == 1 && taskListState.contentList.length > 0 ? '' : 'forcedHide'
        }`}
        id="taskWideDetail"
        // style={{ top: -props.positionTop }}
      >
        {wideDetail.mode == 1 && wideDetail.taskId && (
          <TaskWideDetails
            ref={wideDetailRef}
            param={{ from: 'taskManage', id: wideDetail.taskId, refresh: wideDetail.refresh }}
          />
        )}
      </section>
      {/* 检查项 */}
      {opentEntry && (
        <CheckEntryModal
          param={{
            visible: opentEntry,
            id: taskid,
            ascriptionId: ascription.ascriptionId,
            ascriptionName: ascription.ascriptionName,
            isshowNoneData: true, //无数据是否显示空白页
          }}
          setvisible={(state: any) => {
            setOpentEntry(state)
          }}
        ></CheckEntryModal>
      )}
      {/* 汇报详情 */}
      {reportModel.visible && (
        <ReportMangerModel
          param={{ ...reportModel }}
          setvisible={(state: any) => {
            setReportModel({ ...reportModel, visible: state })
          }}
        />
      )}
      {/* 附件详情 */}
      <FileDetailModal
        param={...fileModal}
        action={{
          setVisible: (flag: boolean) => {
            setFileModal({ ...fileModal, visible: flag })
          },
        }}
      />
      {/* 强制汇报 */}
      {openforce && (
        <Forcereport
          visible={openforce}
          datas={{
            from: 'taskManage', //来源
            isdetail: 0, //是否为详情 1详情 0设置 2编辑
            taskid: taskData.id, //任务id
            startTime: taskData.startTime, //开始时间
            endTime: taskData.endTime, //结束时间
            teamId: ascription.ascriptionId, //企业id
          }}
          setModalShow={setOpenforce}
          onOk={(datas: any) => {
            console.log(datas)
          }}
        ></Forcereport>
      )}
      {/* 拖动不同类型任务的二次提醒弹框 */}
      <Modal
        className="baseModal "
        visible={dragDiffModal.visible}
        title="操作提示"
        onOk={() => {
          setDragDiffModal({ visible: false })
          if (dragDiffModal.dragTaskSure) {
            dragDiffModal.dragTaskSure()
          }
        }}
        onCancel={() => {
          setDragDiffModal({ visible: false })
        }}
        width={395}
        centered={true}
      >
        <p className="msg_tit">{dragDiffModal.content}</p>
      </Modal>
    </section>
  )
})

/**
 * 展开折叠参数
 */
export const tableExpandable: any = {
  //自定义展开折叠按钮
  expandIcon: ({ expanded, onExpand, record }: any) => {
    if ((record.children && record.children.length > 0) || record.subTaskCount) {
      if (expanded) {
        return (
          <span
            className="treeTableIcon square arrow_leaf img_icon expanded"
            onClick={(e: any) => {
              e.stopPropagation()
              onExpand(record, e)
            }}
          ></span>
        )
      } else {
        return (
          <span
            className="treeTableIcon square arrow_leaf img_icon collapsed"
            onClick={(e: any) => {
              e.stopPropagation()
              onExpand(record, e)
            }}
          ></span>
        )
      }
    } else {
      return (
        <span
          className="treeTableIcon arrow_leaf"
          onClick={(e: any) => {
            e.stopPropagation()
          }}
        ></span>
      )
    }
  },
  indentSize: 20, //自定义缩进值
}

/**
 * 从表格数据中递归查询当前任务
 */
export const handleNowTask = (paramObj: {
  dataList: any
  findId: string
  taskInfo: any
  optType?: string
  nowUserId?: any
  isDel?: boolean
  initDataList?: any
  finded?: number
}): any => {
  const { dataList, findId, taskInfo, optType, isDel } = paramObj
  let finded = paramObj.finded || 0
  for (let i = 0; i < dataList.length; i++) {
    const item = dataList[i]
    if (findId == item.id) {
      taskInfo.item = item
      // 1删除任务，2归档 删除任务
      // console.log(initDataList)
      if (
        optType == 'del' ||
        optType == 'archive' ||
        (isDel && optType == 'editExecute') ||
        (isDel && optType == 'transfer')
      ) {
        taskInfo.isDel = true
        dataList.splice(i, 1)
        i--
      }
      finded++
    }
    if (item.children && item.children.length > 0 && !finded) {
      handleNowTask({ dataList: item.children, findId, taskInfo, optType, isDel, initDataList: item })
    }
  }
}
/**
 * 从表格数据中递归查询当前任务
 */
export const findNowTask = ({
  dataList,
  findId,
  taskInfo,
  idName,
}: {
  dataList: any
  findId: string
  taskInfo?: any
  optType?: string
  idName?: string
}): any => {
  for (let i = 0; i < dataList.length; i++) {
    const item = dataList[i]
    const idKey = idName || 'id'
    if (findId == item[idKey]) {
      taskInfo.item = item
    }
    if (item.children && item.children.length > 0 && !taskInfo.item) {
      findNowTask({ dataList: item.children, findId, taskInfo })
    }
  }
}
/**
 * 父元素中查找当前任务
 */
const findNowFromPt = (dataList: any, findId: string) => {
  let findItem = {}
  for (let i = 0; i < dataList.length; i++) {
    const item = dataList[i]
    if (findId == item.id) {
      findItem = item
      break
    }
  }
  return findItem
}

/**
 * 递归查询父级任务
 */
const findPtNexts = ({ dataList, idList }: { dataList: any; idList?: any }) => {
  let ids: any = []
  if (idList) {
    ids = idList
  }
  for (let i = 0; i < dataList.length; i++) {
    const item = dataList[i]
    ids.push(Number(item.id))
    if (item.parentId) {
      const parentRow = treeListMap[item.parentId] || {}
      findPtNexts({ dataList: parentRow, idList: ids })
    }
  }
  return {
    idList: ids,
  }
}

/**
 * 递归查询子级任务
 */
export const findChildNexts = ({ idList, dataList }: { dataList: any; idList?: any }) => {
  let ids: any = []
  if (idList) {
    ids = idList
  }
  for (let i = 0; i < dataList.length; i++) {
    const item = dataList[i]
    ids.push(item.id)
    if (item.children && item.children.length > 0) {
      findChildNexts({ dataList: item.children, idList: ids })
    }
  }
  return {
    idList: ids,
  }
}
export { TaskManageList }

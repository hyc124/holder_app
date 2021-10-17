import React, { forwardRef, useContext, useEffect, useImperativeHandle, useReducer } from 'react'
import NoneData from '@/src/components/none-data/none-data'
import { message, Table } from 'antd'
import { RoleComponet, TaskListTags, TaskTypeTag } from '../../task/task-com/TaskCom'
import { queryOKRTaskByIdApi } from '../../task/OKRDetails/okrDetailApi'
import { planContext } from '../list-card-four/okr-workplan'
import { queryPlanList } from '../list-card-four/okr-workplanApi'
import { setTagByStatus } from '../../fourQuadrant/TableList'
import { ipcRenderer } from 'electron'
// import { useDrop, useDrag } from 'react-dnd'
import update from 'immutability-helper'
// import { DndProvider } from 'react-dnd'
// import { HTML5Backend } from 'react-dnd-html5-backend'
import { refreshFourQuadrantTask } from '../../fourQuadrant/fourQuadrant'
// import { requestApi } from '@/src/common/js/ajax'
/**
 * 展开折叠参数
 */
export const tableExpandable: any = {
  //自定义展开折叠按钮
  expandIcon: ({ expanded, onExpand, record }: any) => {
    if ((record.children && record.children.length > 0) || record.hasChild) {
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
          // style={{ width: 10 }}
          onClick={(e: any) => {
            e.stopPropagation()
          }}
        ></span>
      )
    }
  },
  indentSize: 20, //自定义缩进值
}
export const setTreeTableData = (paramObj: {
  data: any
  childLevel?: any
  optType?: string //操作类型
  parentId?: any
  itemCheck?: any
  hasAuth?: any //编辑权限
}) => {
  const { itemCheck, hasAuth } = paramObj
  return paramObj.data?.map((item: any, i: number) => {
    // 对象形式时，取对应id的childLevel
    if (paramObj.childLevel != undefined) {
      item.childLevel = paramObj.childLevel
    }
    // 添加planId
    item.planId = item.planId || item.id
    // 添加编辑权限
    if (hasAuth) item.hasAuth = hasAuth
    // 更改id为typeId值，兼容以前写法
    item.id = item.typeId
    item.key = item[queryIdType]
    // 设置父任务数据
    if (paramObj.parentId) {
      item.parentId = paramObj.parentId
    }
    // 存储上一个任务数据
    if (i - 1 >= 0) {
      item.preId = paramObj.data[i - 1][queryIdType]
    }
    // 存储下一个任务数据
    if (i + 1 < paramObj.data.length) {
      item.nextId = paramObj.data[i + 1][queryIdType]
    }
    // 防止某些字段后台返回的是undefined
    const itemInit = {
      startTime: '',
      endTime: '',
      icon: '',
      tagList: [],
      executeTime: '',
      progress: {},
      followNames: [],
      subTaskCount: 0,
      isFollow: 0,
      approvalStatus: 0,
      isSelect: false,
      today: false,
      maxRole: 0,
    }
    // 存取map表
    treeListMap[item.key] = { ...item }
    itemCheck && itemCheck({ item })
    // 首层加载时，递归处理所有任务
    if (item.subList && item.subList.length > 0) {
      return {
        ...itemInit,
        ...item,
        children: setTreeTableData({
          ...paramObj,
          data: item.subList,
          childLevel: true,
          parentId: item[queryIdType],
        }),
      }
    } else if (item.subTaskCount > 0) {
      return {
        ...itemInit,
        ...item,
        children: [],
      }
    } else {
      return {
        ...itemInit,
        ...item,
      }
    }
  })
}
// 获取任务类型logo
export const getTypeLogo = ({
  type,
  taskFlag,
  topTask,
  index,
}: {
  type: number
  taskFlag?: number
  topTask?: boolean
  index?: number
}) => {
  const _index = index != undefined ? index : -1
  if (type == 2) {
    return <span className="isokr O_okr"></span>
  } else if (type == 3) {
    return <span className="specail-show-type isKR">KR{_index != -1 ? _index + 1 : ''}</span>
  } else if (taskFlag == 2) {
    return <span className="specail-show-type isDraft">{$intl.get('myDraft')}</span>
  } else if (type == 1 && topTask) {
    return <span className="specail-show-type isTask">Task</span>
  }
}

// 获取O KR状态 type:1状态  0更新时间
export const getStatusOrTime = (type: number, status: number | string) => {
  let text: number | string = ''
  let style: any = {
    border: 'none',
    paddingLeft: '4px',
    paddingRight: '4px',
  }

  if (type == 1) {
    switch (status) {
      case 0:
        text = $intl.get('normal')
        style = {
          ...style,
          color: '#4edef2',
          // backgroundColor: '#E9F2FF',
        }
        break
      case 1:
        text = $intl.get('hasRisks')
        style = {
          ...style,
          color: '#ffc100',
          // backgroundColor: '#FFF6E1',
        }
        break
      case 2:
        text = $intl.get('leading')
        style = {
          ...style,
          color: '#34a853',
          // backgroundColor: '#E5F7E8',
        }
        break
      case 3:
        text = $intl.get('delay')
        style = {
          ...style,
          color: '#ea4335',
          // backgroundColor: '#FEF3F2',
        }
        break
      default:
        break
    }
  } else {
    // text = status ? status + '更新' : ''
    // text = '|'
    // style = {
    //   ...style,
    //   color: '#9A9AA2',
    //   backgroundColor: '#F3F3F4',
    // }
  }
  // return text ? <Tag style={{ ...style }}>{text}</Tag> : ''
  return text ? (
    <span style={{ ...style }} className="rootingtask">
      {text}
    </span>
  ) : (
    ''
  )
}

// 优先级标记
const RenderTagIcon = (icon: string) => {
  let priFlag: any = ''
  if (icon) {
    const priIcon = $tools.asAssetsPath(`/images/task/${icon}.png`)
    priFlag = (
      <span className="taskPriTag" style={{ paddingLeft: 0 }}>
        <em className="taskPriTagIcon">
          <img src={priIcon} alt="" style={{ width: '100%', height: '100%' }} />
        </em>
      </span>
    )
  }
  return priFlag
}

// 渲染任务 第二行节点
export const renderTaskSecendDom = (row: any) => {
  // 任务角色
  const maxRole = row.maxRole || ''
  return (
    <>
      {/* <TaskTypeTag type={row.taskType} style={{ paddingLeft: 0 }} /> */}
      {maxRole && <RoleComponet params={{ code: maxRole, labelShow: true, style: { paddingLeft: 0 } }} />}
      {row.icon && RenderTagIcon(row.icon)}
      {row.tagList && row.tagList.length > 0 && <TaskListTags tagList={row.tagList || []} />}
    </>
  )
}

const getNowType = (data: number) => {
  let name = ''
  let getclass = 'org'
  if (data == 0) {
    name = $intl.get('userRank')
    getclass = 'person'
  } else if (data == 2) {
    name = $intl.get('cmyRank')
    getclass = 'org'
  } else if (data == 3) {
    name = $intl.get('deptRank')
    getclass = 'depart'
  }
  return {
    nowName: name,
    nowClass: getclass,
  }
}
export const tagItemHtml = (item: any) => {
  let bgcolor = ''
  // let bgnameimg = 'red_tag'
  if (item.bg == 0 || item.rgb == '#4285F4') {
    bgcolor = 'rgba(233,242,255,0.7)'
    // bgnameimg = 'blue_tag'
  } else if (item.bg == 1 || item.rgb == '#34A853') {
    bgcolor = 'rgba(205,234,213,0.7)'
    // bgnameimg = 'green_tag'
  } else if (item.bg == 2 || item.rgb == '#FBBC05') {
    bgcolor = 'rgba(252,236,197,0.7)'
    // bgnameimg = 'yellow_tag'
  } else if (item.bg == 3 || item.rgb == '#EA4335') {
    bgcolor = 'rgba(250,209,206,0.7)'
    // bgnameimg = 'red_tag'
  }
  return {
    namebgcolor: bgcolor,
    // bgnameimg: bgnameimg,
  }
}

// 静态初始化state数据，始终不变，用于还原数据
const stateOne: any = {
  columns: [],
  contentList: [],
  expandedRowKeys: [], //展开的行
  loading: false,
  hasMorePage: true, //是否还有下一页，可滚动加载
  listPageNo: 0,
  scrollY: 800, //表格滚动区域高度
  queryState: '',
  childNumObj: null, //kr/子任务 数量
  periodDisable: false,
}
let stateTmp: any = JSON.parse(JSON.stringify(stateOne))
// 任务列表数据map表
let treeListMap: any = {}
// 当前任务id（详情刷新用）
let nowTask: any = {}
// 缓存当前操作任务链 mainId（查询子集任务）
let mainTaskId = -1
// 当前查询的id还是typeId
const queryIdType = 'typeId'
/**
 * 拖动组件包装表格单元格
 */

const DragableBodyCell = (props: any) => {
  const { rowData, rowIndex, className, style, ...restProps } = props
  return (
    <td
      key={rowIndex || 0}
      className={`noHover ${className} ${rowData && rowData.childLevel ? 'treeTableChild' : ''} ${
        rowData && nowTask.id == rowData.id && nowTask.parentId == rowData.parentId ? 'wide_active' : ''
      }`}
      style={{ ...style }}
      {...restProps}
    />
  )
}
/**
 * 拖动组件包装表格行
 */
const DragableBodyRow = (props: any) => {
  const { index, rowdata, dragTaskCheck, className, style, ...restProps } = props
  // console.log(rowData)
  // 拖动移入后的hover样式
  // const [dropClass, setDropClass] = useState('')
  // // 记录当前拖动放置位置 up目标上方 mid目标中间 down目标下方
  // let dragPos = ''
  // // 绑定拖动放置
  // let targetNode: any = null
  // const [{ isOver }, drop] = useDrop({
  //   accept: 'dragBodyList',
  //   collect: monitor => {
  //     const item: any = monitor.getItem() || {}
  //     if (item.rowData && item.rowData.key === rowdata.typeId) {
  //       return {}
  //     }
  //     return {
  //       isOver: monitor.isOver(),
  //       dropClassName: dropClass,
  //     }
  //   },
  //   canDrop: (item: any, monitor: any) => {
  //     let drag = true
  //     if (
  //       item.rowData &&
  //       (item.rowData.parentId != $(dragRef.current).attr('data-parentId') ||
  //         item.rowData.typeId == $(dragRef.current).attr('data-row-key'))
  //     ) {
  //       drag = false
  //     }
  //     return drag
  //   },
  //   hover: (_: any, monitor: any) => {
  //     // 当前鼠标位置
  //     const client = monitor.getClientOffset() || {}
  //     // 目标节点
  //     targetNode = dragRef.current
  //     const targetY: number = jQuery(targetNode).offset()?.top || 0
  //     const targetH: number = jQuery(targetNode).outerHeight() || 0
  //     // 目标节点上方三分之一处，上方添加边框线
  //     if (client.y < targetY + targetH * 0.3) {
  //       setDropClass('drop-over-upward')
  //       dragPos = 'up'
  //     }
  //     // 目标节点上方三分之三处，下方添加边框线
  //     else if (client.y > targetY + targetH * 0.6) {
  //       setDropClass('drop-over-downward')
  //       dragPos = 'down'
  //     }
  //     // 目标节点上方三分之二处，添加背景色
  //     else {
  //       setDropClass('drop-over-bg')
  //       dragPos = 'mid'
  //     }
  //   },
  //   drop: (_: any, monitor: any) => {
  //     let sourceItem: any = monitor.getItem() || {}
  //     if (sourceItem.rowData.parentId != rowdata.parentId) {
  //       return
  //     }
  //     requestApi({
  //       url: '/task/work/plan/krSort',
  //       param: {
  //         mainId: rowdata.mainId,
  //         moveKrId: sourceItem.rowData.key,
  //         changedKrId: rowdata.id
  //       },
  //       json: true,
  //     }).then((res: any) => {
  //       if (res.success) {
  //         dragTaskCheck({
  //           sourceRow: Object.assign({}, sourceItem.rowData),
  //           targetRow: rowdata,
  //           dragPos: dragPos,
  //           targetNode: targetNode,
  //         })
  //       }
  //     })
  //   },
  // })

  // const dragRef: any = useRef(null)
  // const [, drag] = useDrag({
  //   item: { type: 'dragBodyList', index: index, rowData: rowdata, sourceNode: dragRef },
  //   collect: (monitor: any) => ({
  //     isDragging: monitor.isDragging(),
  //   }),
  //   canDrag: () => {
  //     let drag = true
  //     if (
  //       $(dragRef.current)
  //         .find('.taskListNameInp')
  //         .is(':visible')
  //     ) {
  //       drag = false
  //     }
  //     return drag
  //   },
  //   begin: () => {},
  //   end: () => {},
  // })
  // if (rowdata && rowdata.type == 3) {
  //   drag(drop(dragRef))
  // }
  // key
  const key = rowdata ? rowdata.id : index
  return (
    <tr
      key={key}
      // ref={dragRef}
      data-parentid={rowdata.parentId}
      className={`${className} ${rowdata && rowdata.childLevel ? 'treeTableChild' : ''}`}
      style={{ ...style }}
      {...restProps}
    />
  )
}

/**
 * 拖动后更新源任务和目标任务 nowdata替换的元素 moveData拖动的元素
 */
const dragUpdateTask = (nowdata: any, moveData: any, tableList: any) => {
  let removeI: any = null, //移除的位置
    targetI = 0 //原来的位置
  // 是否查询到需要移除的源节点
  for (let i = 0; i < tableList.length; i++) {
    const item = tableList[i]
    if (item.typeId == moveData.typeId) {
      // eslint-disable-next-line no-param-reassign
      moveData = item
      removeI = i
    }
    // 拖至首层,记录拖至位置，之后插入新数据
    if (item.id == nowdata.typeId) {
      targetI = i
    }
  }
  return update(tableList, {
    $splice: [
      [removeI, 1],
      [targetI, 0, moveData],
    ],
  })
}
const OkrListOrg = forwardRef((props: any, ref) => {
  const planContextObj: any = useContext(planContext)
  const { planListParam } = planContextObj
  const {
    data,
    handleOkrList,
    refreshRight,
    isModal,
    setModalState,
    periodDisable,
    // , refresh
  } = props
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
  // 工作报告进入详情监听id变化，监听data的话会查询两次接口，导致第二次查询数据可能是旧数据
  const dataf = data && data[0] ? data[0] : {}

  const useId = dataf.from == 'workReport' || dataf.from == 'apiInit' ? dataf.taskId : data

  //   ********************************************表格处理************************************************//
  // 处理单元格
  const renderContent = ({ row, index }: any) => {
    const obj: any = {
      children: '',
      props: {},
    }
    //是否完成
    const isComplet = row.taskStatus == 2
    //是否已归档
    const isFile = row.TaskFlag == 3
    const tdHtm = (
      <div className="cell-content flex-1">
        <div
          className={`okr_detail_item ${isComplet || isFile ? 'finished' : ''}`}
          // key={index}
          onClick={() => {
            handleOkrList && handleOkrList({ ...row })
            console.log(row, 'hangshuju')
            // 如果是草稿任务
            // 有权限 展示编辑窗口弹出
            // 无权限 无法选中
            if (row.type == 1 && row.taskFlag == 2) {
              return false
            }

            nowTask = row
            // console.log(nowTask)

            // 设置列表中当前操作的详情任务数据（数据要使用列表中的）
            refreshRight && refreshRight({ id: row.typeId })
            // 选中O自动展开，以与宽详情默认展开到第2层一致
            if (row.type == 2) {
              // 点击主动展开
              expandNode({
                expanded: true,
                row,
                handExp: true,
              })
            } else {
              // 刷新一次，自动更新选中任务
              dispatch({
                type: ['contentList'],
                data: { contentList: [...stateTmp.contentList] },
              })
            }
          }}
        >
          <div className="okr_detail_title flex between">
            <h4 className="flex-1">
              {getTypeLogo({
                type: row.type,
                taskFlag: row.taskFlag,
                topTask: row.topTask,
                index,
              })}
              {/* <Tooltip title={row.name}> */}
              {row.type != 1 && row.icon && RenderTagIcon(row.icon)}
              <span className="taskName my_ellipsis flex-1" style={{ fontWeight: 600 }}>
                {row.name}
              </span>

              {/* </Tooltip> */}
              {row.type != 3 && setTagByStatus(row)}
            </h4>
          </div>
          <div className={`okr_detail_tags flex`}>
            {(row.type == 2 || row.type == 3) && getStatusOrTime(1, row.processStatus)}

            {/* <span className="split_line">|</span> */}
            {row.type == 2 && (
              <span className={getNowType(row.ascriptionType).nowClass}>
                {getNowType(row.ascriptionType).nowName}
              </span>
            )}
            {/* <span className="split_line">|</span> */}

            {(row.type == 2 || row.type == 3) && getStatusOrTime(0, row.processTimeStr)}

            {row.type == 1 && renderTaskSecendDom(row)}
            {/* 百分号 */}
            <div className="row_progress_input" style={{ color: '#909194', fontSize: '12px' }}>
              <span
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                {row.process}%
              </span>
            </div>
            <div className="okr_detail_tagList flex-1 my_ellipsis">
              {row.workPlanTargetResultList &&
                row.workPlanTargetResultList.map((nowItem: any, getIndex: number) => (
                  <span
                    className="tages text-ellipsis"
                    style={{
                      backgroundColor: tagItemHtml(nowItem).namebgcolor,
                      color: nowItem.rgb,
                      display: getIndex < 2 ? 'inline-block' : 'none',
                    }}
                    key={getIndex}
                  >
                    {nowItem.content}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
    obj.children = tdHtm
    return obj
  }
  /**
   * 初始化表格列
   */
  const columnsInit = [
    {
      title: '',
      dataIndex: 'taskName',
      key: 'taskName',
      ellipsis: true,
      render: (value: any, row: any, index: number) => {
        return renderContent({
          value,
          row,
          index,
        })
      },
      // 单元格
      onCell: (rowData: any, rowIndex: number) => ({
        rowData,
        rowIndex,
        colindex: 0,
      }),
    },
  ]
  stateTmp.columns = [...columnsInit]
  const [taskListState, dispatch] = useReducer(taskListReducer, { ...stateTmp })
  let isUnmounted = false
  useEffect(() => {
    // 订阅进展汇报消息，刷新进展状态数据
    ipcRenderer.on('refresh_operated_task', (_: any, data: any) => {
      const { taskIds } = data.data
      if (!taskIds) return
      if (!isUnmounted) {
        refreshTaskTree({
          taskIds: [...taskIds],
        })
      }
    })

    return () => {
      stateTmp = JSON.parse(JSON.stringify(stateOne))
      treeListMap = {}
      nowTask = {}
      isUnmounted = true
    }
  }, [])

  useEffect(() => {
    isUnmounted = false

    if (dataf.from && (dataf.from == 'workReport' || dataf.from == 'apiInit')) {
      if (!dataf.taskId) return

      queryTaskTree({ taskId: dataf.taskId, from: dataf.from, type: 'refresh' })
    } else {
      initORKData(data)
    }
  }, [useId, periodDisable])

  // ***********************暴露给父组件的方法**************************//
  useImperativeHandle(ref, () => ({
    /**
     * 设置详情刷新字段，用于父组件对详情查询接口全局刷新
     * 不传id则查询当前任务
     */
    // setQuery: () => {
    //   queryTaskTree()
    // },
    /**
     * 刷新组织架构
     */
    refreshTaskTree,
    // 自动选中当前查询任务
    // defFirst:默认选中第一项
    clickTheTask: ({ findId, defFirst, noFindBack }: any) => {
      const tableList = stateTmp.contentList
      if (defFirst) {
        nowTask = tableList[0] || {}
        refreshTaskTree({ optType: 'all', taskIds: '' })
      } else {
        const nowTaskInfo: any = {}
        findNowTask({
          dataList: tableList,
          findId,
          taskInfo: nowTaskInfo,
        })

        refreshRight && nowTaskInfo.item ? refreshRight({ id: nowTaskInfo.item.typeId }) : noFindBack()
        // 找到任务则自动选中
        if (nowTaskInfo.item) {
          nowTask = { ...nowTaskInfo.item }
          // 刷新一次，自动更新选中任务
          dispatch({
            type: ['contentList'],
            data: { contentList: [...stateTmp.contentList] },
          })
        }
        // else{
        //   // 未找到则返回回调函数
        //   noFindBack&&noFindBack()
        // }
      }
    },
    // 外部调用联动展开子级
    expandLeftTableNode: expandNode,
    // 检测KR 是否存在
    isCheckKRExist: ({ findId, isExist }: any) => {
      const tableList = stateTmp.contentList
      const nowTaskInfo: any = {}
      findNowTask({
        dataList: tableList,
        findId,
        taskInfo: nowTaskInfo,
      })
      if (nowTaskInfo.item) isExist()
    },
    // 更新子任务数量统计
    updateChildNumFn,
  }))

  // 初始OKR组织列表数据
  const initORKData = (arr: any[], attachObj?: any) => {
    // 组装OKR组织列表数据
    const newDatas = setTreeTableData({
      data: arr,
      childLevel: false,
      itemCheck: ({ item }: any) => {
        // if (item.subList && item.subList.length > 0) {
        // }
      },
    })
    dispatch({
      type: ['contentList', 'periodDisable'],
      data: {
        contentList: [...newDatas],
        periodDisable,
      },
    })

    if (arr && arr.length > 0) {
      nowTask = arr[0]
      dispatch({
        type: ['expandedRowKeys'],
        data: { expandedRowKeys: [arr[0].id] },
      })
      // console.log('hasChild---------------------------:' + arr[0].hasChild)
      // if (!arr[0].id || !arr[0].hasChild) {
      if (!arr[0].id) {
        return
      }
      expandNode({
        expanded: true,
        row: arr[0],
        handExp: [arr[0].id],
        initExpand: true,
      })
    }
  }
  // =============================多层级表格处理 start===============================//

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
   * 全局刷新查询第一层数据
   */
  const queryTaskTree = async ({ taskId, from, type }: { taskId?: any; from?: any; type?: string }) => {
    // const tableList = stateTmp.contentList
    let param: any = {}
    const _taskId = taskId || nowTask?.typeId

    if (isModal) {
      if (_taskId) {
        await queryOKRTaskByIdApi({ taskIds: [_taskId] }).then((dataList: any) => {
          if (!isUnmounted) {
            initORKData(dataList, from)
          }
        })
      }
    } else {
      param = planListParam()
      await queryPlanList(param).then(res => {
        if (!isUnmounted) {
          const dataObj = res.data.obj || {}
          if (res.success) {
            const listModeData = [...(dataObj.top || []), ...(dataObj.bottom || [])]
            initORKData(listModeData)
            console.log(listModeData)
          }
        }
      })
    }
    if (type && type.includes('refresh')) {
      refreshRight && _taskId && refreshRight({ id: _taskId })
    }
  }
  /**
   * 查询子级任务
   */
  const queryChildTask = ({
    findId,
    row,
    onlyFind,
    operateId,
    mainTaskId,
    topTask,
  }: {
    findId: string
    mainTaskId: number
    row: any
    onlyFind?: boolean
    operateId?: string //当前操作的任务id
    topTask?: boolean //是否顶层任务，需要添加task标识
  }) => {
    // if (!findId) return
    const param = {
      // taskId: findId,
      // loginUserId: $store.getState().nowUserId,

      mainId: mainTaskId,
      id: findId,
      typeId: row.typeId,
      operateUser: $store.getState().nowUserId,
      level: '',
      hasOther: '1',
      hasSelf: 1,
      queryStatus: '1,2',
      sortRule: 1,
    }

    return new Promise((resolve: any, reject: any) => {
      $api
        .request('/task/work/plan/queryTree', param, {
          headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
        })
        .then((res: any) => {
          if (!isUnmounted) {
            if (res.returnCode == 0) {
              const childData = res.data.children || []

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
              //一级任务 需要添加task 标识
              if (topTask) {
                childData.forEach((item: any) => {
                  if (item.type == 1) item['topTask'] = true
                })
              }

              // 表格内容组装
              const newChilds = setTreeTableData({
                data: childData,
                childLevel: true,
                parentId: row.typeId,
                optType: 'addChildTask',
                hasAuth: row.hasAuth,
                itemCheck: ({ item }: any) => {
                  // if (item.subList && item.subList.length > 0) {
                  // }
                },
              })
              //更新map表数据
              treeListMap[row.typeId]['children'] = newChilds
              const newList = updateTreeChild(stateTmp.contentList, {
                findId: row.id || row.typeId,
                key: row.id || row.typeId,
                children: newChilds,
              })
              resolve({ taskData: newList || [] })
            } else {
              resolve(false)
            }
          }
        })
        .catch(resData => {
          reject(resData)
          if (resData.returnMessage) {
            message.error(resData.returnMessage)
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
  const expandNode = ({
    expanded,
    row,
    handExp,
    initExpand,
    outside = false,
  }: {
    expanded: any
    row: any
    handExp?: any
    initExpand?: boolean
    outside?: boolean //是否外部调用
  }) => {
    const _row: any = { ...row }

    // 外部调用
    if (outside) {
      // 处理内部使用数据
      _row.planId = row.id
      _row.id = row.typeId
      // 已展开
      if (_row.id && stateTmp.expandedRowKeys.includes(_row.id)) return
    }

    const children = row.children || []
    if (!expanded || children.length > 0) {
      return
    }
    const topTask = Boolean(row.mainId)
    // 缓存当前mainTaskID
    if (row.mainId) mainTaskId = row.mainId

    queryChildTask({
      findId: _row.planId,
      row: _row,
      mainTaskId,
      topTask,
    }).then((resData: any) => {
      const taskData = resData.taskData || []

      if (!isUnmounted) {
        // 手动控制展开
        if (handExp) {
          const handExpArr: any[] = typeof handExp == 'boolean' ? [] : handExp
          dispatch({
            type: ['contentList', 'expandedRowKeys'],
            data: {
              contentList: [...taskData],
              expandedRowKeys: [...new Set([...stateTmp.expandedRowKeys, _row.id, ...handExpArr])],
            },
          })
        } else {
          dispatch({
            type: ['contentList', 'expandedRowKeys'],
            data: { contentList: [...taskData], expandedRowKeys: [...stateTmp.expandedRowKeys] },
          })
        }
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
  /**
   * 表格集成组件
   */
  const components = {
    body: {
      cell: DragableBodyCell,
      row: DragableBodyRow,
    },
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
    if (sourceRow.parentId == targetRow.parentId) {
      stateTmp.contentList.forEach((el: any) => {
        if (el.id == sourceRow.parentId) {
          el.children = dragUpdateTask(targetRow, sourceRow, el.children)
        }
      })
      dispatch({
        type: ['contentList'],
        data: { contentList: [...stateTmp.contentList] },
      })
      refreshFourQuadrantTask &&
        refreshFourQuadrantTask(16, {
          nowData: targetRow,
          moveData: sourceRow,
          from: 'changePosition',
        })
    }
  }
  /**
   * 刷新列表
   * taskIds:查询多个任务的id数组
   * optType:操作类型
   * childLevel:是否是子级任务
   */
  const refreshTaskTree = async ({
    taskIds,
    optType,
    parentId,
    newChild,
    childIds,
  }: {
    rowData?: any
    taskIds: any
    optType?: string
    childLevel?: any
    parentId?: string //新增子任务时需要父任务id
    newChild?: any
    childIds?: number[]
  }) => {
    const { nowUserId } = $store.getState()
    // 是否全局刷新（没有局部刷新效果）
    let isDef = false
    let tableList = stateTmp.contentList
    const paramObj: any = {
      dataList: tableList,
      taskIds: taskIds,
      finded: 0, //已匹配到的数量，用于暂停递归
      optType: optType,
    }
    const expandedRows = stateTmp.expandedRowKeys
    // 需要查询的任务id列表
    let taskIdList: any = taskIds || [nowTask[queryIdType]]
    let nowTaskInfo: any = { item: null }
    // 当前最新子数据
    let _newChild = newChild || null
    let _parentId: any = parentId
    switch (optType) {
      case 'assign': //指派
      // 新增子任务
      case 'addKr':
      case 'addTask':
      case 'addChildTask':
      case 'relateTask': //关联任务
        // 如果没有传递新数据，则查询创建的最新数据
        if (childIds && childIds.length > 0) {
          _newChild = await queryOKRTaskByIdApi({ taskIds: [...childIds] })
        }

        // 指派任务获取父级id
        if (optType == 'assign') {
          _parentId = parentId || taskIdList[0]
        }
        console.log('parentId-------------------------------' + _parentId)
        // 已经展开时直接添加子任务进去
        if (_parentId && _newChild && expandedRows.includes(_parentId)) {
          const newChildArr = _newChild
          const newChilds = setTreeTableData({
            data: newChildArr,
            childLevel: true,
            parentId: _parentId,
          })
          paramObj.newChild = newChilds
        }

        break
      case 'archive': //归档
      case 'cancelSupport': //取消支持
      case 'del': //删除任务
      case 'relKR': //删除okr
      case 'delAllChain': //删除整链
        nowTaskInfo = { item: null }

        // 如果当前删除了唯一的数据
        if (tableList.length == 1 && taskIds[0] == tableList[0][queryIdType]) {
          taskIdList = []
          nowTask = {}
          tableList = []
          // 弹框中的操作则关闭弹框，设置isDef为true，无需刷新当前
          if (isModal) {
            isDef = true
            setModalState && setModalState({ visible: false })
          } else {
            // OKR宽详情中操作
            refreshRight && refreshRight({ id: '' })
          }
        } else {
          // 是否删除
          // if (taskIds[0] == tableList[0][queryIdType] && tableList[1]) {
          //   nowTask = tableList[1]

          // } else if (tableList[0]) {
          //   nowTask = tableList[0]
          // }
          findNowTask({
            dataList: tableList,
            findId: taskIds[0],
            taskInfo: nowTaskInfo,
            optType: optType,
            nowUserId,
            initDataList: tableList,
            parentId,
          })

          console.log(nowTaskInfo.item)

          // 查询当前数据的fid
          if (nowTaskInfo.item && nowTaskInfo.item.parentId) {
            const _parentIdArr = String(nowTaskInfo.item.parentId).includes('###')
              ? nowTaskInfo.item.parentId.split('###').filter((item: any) => {
                  return item
                })
              : [nowTaskInfo.item.parentId]

            if (_parentIdArr.length > 0) {
              _parentId = Number(_parentIdArr[_parentIdArr.length - 1])
              taskIdList = [_parentId]
            }

            // console.log('fid-------------------------' + _parentId)
          }

          // 删除选择数据
          if (
            nowTaskInfo.item &&
            nowTask.id == nowTaskInfo.item.id &&
            nowTask.parentId == nowTaskInfo.item.parentId
          ) {
            // console.log(nowTask)
            // console.log(nowTaskInfo.item)
            // console.log('删除了选择任务')
            // 如果父id 不存在则说明删除O
            const siblings: any[] = _parentId ? treeListMap[_parentId].children : [...tableList]
            // console.log('tableList', tableList)
            // 选择当前数据的兄弟节点
            if (siblings.length > 0) {
              nowTask = siblings[0]
            } else {
              // 父节点
              nowTask = _parentId ? treeListMap[_parentId] : tableList.length > 0 ? tableList[0] : {}
            }
          }
          // console.log('nowTask-------------------------' + nowTask.typeId)
          // 刷新右侧数据
          refreshRight && nowTask.typeId && refreshRight({ id: Number(nowTask.typeId) })
        }

        // 没有找到可删除任务则无需刷新
        if (nowTaskInfo.isDel && nowTaskInfo.item) {
          //满足删除条件，则查询并更新父任务
          taskIdList = _parentId ? [_parentId] : []

          // 删除单项，存在子任务则单项链下子任务升至当前任务同级
          if (
            optType == 'del' &&
            (nowTaskInfo.item.hasChild || (nowTaskInfo.item.children && nowTaskInfo.item.children.length > 0))
          ) {
            const childIds: any[] = []
            treeListMap[nowTaskInfo.item[queryIdType]].children.map((item: any) => {
              return childIds.push(item[queryIdType])
            })
            // 查询当前子任务最新数据替换
            _newChild = await queryOKRTaskByIdApi({ taskIds: [...childIds] })

            // 已经展开时直接添加子任务进去
            // if (expandedRows.includes(parentId)) {
            const newChildArr = _newChild || [{}]
            const newChilds = setTreeTableData({
              data: newChildArr,
              childLevel: true,
              parentId: _parentId, //归属下的子任务 父id提升为当前任务id
            })
            paramObj.newChild = newChilds
            paramObj.optType = 'addChildTask'
            paramObj.taskIds = [_parentId]
            // }
          }
          // map表中清除被删除任务
          treeListMap[nowTaskInfo.item[queryIdType]] = {}
        } else {
          taskIdList = [_parentId]
        }

        break
      case 'updateIcon': //更改图标
      case 'editLiber': //编辑责任人

      case 'updateTagStatus': //更新O状态指标
        // 查询当前任务
        findNowTask({
          dataList: tableList,
          findId: taskIds[0],
          taskInfo: nowTaskInfo,
        })
        break
      case 'changeChildTask':
        stateTmp.contentList.forEach((el: any) => {
          if (el.typeId == parentId) {
            el.children = dragUpdateTask({ typeId: childIds ? childIds[0] : '' }, newChild, el.children)
          }
        })
        taskIdList = []
        break
      case 'finish': // 一键完成
      case 'unfinish': // 取消完成
      case 'editProgress': //修改进度
      case 'freeze': //冻结
      case 'unfreeze': //解冻
      case 'distributeSingle': //派发单链
      case 'distributeAll': //派发整链
      case 'recallDistributeSingle': //撤回派发单链
      case 'recallDistributeAll': //撤回派发单链
      case 'transfer': //移交任务
      case 'editorTask': //编辑任务
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
      case 'all': //全局刷新
        isDef = true
        nowTask = tableList[0]
        queryTaskTree({ type: 'refresh' })
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
      queryOKRTaskByIdApi({ taskIds: taskIdList }).then((dataList: any) => {
        // console.log(dataList)
        if (!isUnmounted) {
          // 表格内容组装
          const newDatas = setTreeTableData({
            data: dataList,
            // childLevel: newChildLevel,
          })
          paramObj.newDatas = newDatas
          replaceTask({ ...paramObj, taskIds: taskIdList })
          // console.log('taskIdList----', taskIdList)

          if (
            (optType == 'addChildTask' ||
              optType == 'addKr' ||
              optType == 'addTask' ||
              optType == 'relateTask' ||
              optType == 'assign') &&
            !expandedRows.includes(_parentId)
          ) {
            const _id = optType == 'assign' && !_parentId && taskIdList.length == 1 ? taskIdList[0] : _parentId
            expandedRows.push(_id)
            expandNode({
              expanded: true,
              row: { typeId: _id },
              handExp: expandedRows,
            })
          } else {
            // console.log(paramObj)
            // console.log(tableList)
            dispatch({
              type: ['contentList', 'expandedRowKeys'],
              data: { contentList: [...tableList], expandedRowKeys: [...stateTmp.expandedRowKeys] },
            })
          }
        }
      })
    }
  }
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
    // 当前查询的id还是typeId
    const queryIdType = 'typeId'
    const taskIds = paramObj.taskIds
    const newDatas = paramObj.newDatas
    let finded = paramObj.finded || 0
    const optType = paramObj.optType
    for (let i = 0; i < paramObj.dataList.length; i++) {
      const item = paramObj.dataList[i]
      if (taskIds.includes(item[queryIdType])) {
        // 新的任务数据列表中匹配出当前任务进行替换更新
        const newDataItem = newDatas.filter((newItem: any) => newItem[queryIdType] === item[queryIdType])
        // 空值后台可能不返，故依据最长字段的
        const findItem = newDataItem[0]
        for (const key in findItem) {
          const val = newDataItem[0][key]
          // 排除不更新的健，更新children会导致子节点清空，故不更新
          if (key != queryIdType && key != 'key' && key != 'children') {
            paramObj.dataList[i][key] = val
          }
        }
        // 更新map表
        treeListMap[findItem[queryIdType]] = { ...paramObj.dataList[i] }
        // 新增子任务
        if (
          (optType == 'addChildTask' ||
            optType == 'addKr' ||
            optType == 'addTask' ||
            optType == 'relateTask' ||
            optType == 'assign') &&
          paramObj.newChild
        ) {
          if (!paramObj.dataList[i].children) {
            paramObj.dataList[i].children = []
          }
          console.log('当前---', paramObj.newChild)
          // 判断当前添加子任务类型，kr 则需添加只kr最底部
          if (paramObj.newChild && paramObj.newChild[0].type == 3) {
            paramObj.dataList[i].children.splice(paramObj.dataList[i].krCount - 1, 0, ...paramObj.newChild)
          } else {
            paramObj.dataList[i].children.push(...paramObj.newChild)
          }
        }
        finded++
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
   * 从表格数据中递归查询当前任务
   */
  const findNowTask = ({
    dataList,
    findId,
    taskInfo,
    optType,
    isDel,
    parentId,
  }: {
    dataList: any
    findId: string
    taskInfo: any
    optType?: string
    nowUserId?: any
    isDel?: boolean
    initDataList?: any
    parentId?: any
  }): any => {
    // 当前查询的id还是typeId
    const queryIdType = 'typeId'
    for (let i = 0; i < dataList.length; i++) {
      const item = dataList[i]

      if (optType == 'cancelSupport') {
        // 取消支撑
        if (findId == item[queryIdType] && item.parentId && String(item.parentId).includes(parentId)) {
          taskInfo.item = item
          taskInfo.isDel = true
          dataList.splice(i, 1)
          i--
        }
      } else {
        if (findId == item[queryIdType]) {
          taskInfo.item = item
          // 1删除任务，2归档 删除任务
          if (
            optType == 'del' ||
            optType == 'delAllChain' ||
            optType == 'archive' ||
            optType == 'relKR' ||
            (isDel && optType == 'editExecute')
            // (isDel && optType == 'transfer')
          ) {
            taskInfo.isDel = true
            dataList.splice(i, 1)
            i--
          }
        }
      }

      if (item.children && item.children.length > 0 && !taskInfo.item) {
        findNowTask({ dataList: item.children, findId, taskInfo, optType, isDel, initDataList: item, parentId })
      }
    }
  }
  /**
   * 递归查询子级任务
   */
  const findChildNexts = ({ dataList, idList }: { dataList: any; idList?: any }) => {
    // 当前查询的id还是typeId
    const queryIdType = 'typeId'
    let ids: any = []
    if (idList) {
      ids = idList
    }
    for (let i = 0; i < dataList.length; i++) {
      const item = dataList[i]
      ids.push(item[queryIdType])
      if (item.children && item.children.length > 0) {
        findChildNexts({ dataList: item.children, idList: ids })
      }
    }
    return {
      idList: ids,
    }
  }

  const updateChildNumFn = (childNumObj: any) => {
    dispatch({
      type: ['childNumObj'],
      data: { childNumObj: childNumObj },
    })
  }

  return (
    <>
      {isModal && <OrgHeader childNumObj={taskListState.childNumObj} />}
      {/* okr未开启时的情况 */}
      {periodDisable && (
        <NoneData
          className="threePosition"
          imgSrc={$tools.asAssetsPath('/images/noData/OKR-okr.png')}
          showTxt="OKR尚未启用，请联系管理员开启"
          imgStyle={{ width: 80, height: 75 }}
          containerStyle={{ top: '30%', zIndex: 0 }}
        />
      )}
      {!periodDisable && taskListState.contentList.length == 0 && (
        <NoneData
          className="threePosition"
          imgSrc={$tools.asAssetsPath('/images/noData/OKR-okr.png')}
          showTxt="当前暂无OKR数据"
          imgStyle={{ width: 80, height: 75 }}
          containerStyle={{ top: '30%', zIndex: 0 }}
        />
      )}
      {/* <DndProvider backend={HTML5Backend}> */}
      {!periodDisable && taskListState.contentList.length > 0 && (
        <Table
          className="okrListTable taskManageListTable taskListTable h100 task-list noTrHover okr_detail_main"
          bordered
          columns={taskListState.columns}
          dataSource={taskListState.contentList}
          // dataSource={nowListData}
          onExpand={(expanded: boolean, row: any) => {
            expandNode({
              expanded: expanded,
              row: row,
            })
          }}
          expandable={tableExpandable}
          locale={{
            emptyText: '',
          }}
          pagination={false}
          scroll={{ x: '100%', y: 'calc(100% - 32px)' }}
          components={components}
          expandedRowKeys={taskListState.expandedRowKeys}
          onExpandedRowsChange={onExpandedRowsChange}
          onRow={(record: any, index: any) => {
            return {
              onClick: () => {}, // 点击表头行
              rowdata: record,
              index,
              dragTaskCheck,
            }
          }}
          style={{ width: '100%' }}
        />
      )}
      {/* </DndProvider> */}
    </>
  )
})

export default OkrListOrg

// 渲染头部text
const renderTitleTotal = (param: any) => {
  let titleText = ''

  if (!param.childNumObj) return titleText

  const { type, subTaskCount, level, childCount } = param.childNumObj

  if (type == 1) {
    titleText = `当前第${level}层，拥有${subTaskCount}个子任务`
  } else if (type == 2) {
    titleText = `当前选中目标，拥有${childCount}个关键结果`
  } else if (type == 3) {
    titleText = `当前选中KR，拥有${childCount}个任务`
  }
  return titleText
}

/**
 * 组织架构头部
 */
export const OrgHeader = (childNumObj: any) => {
  return <header className="childInfoTop">{renderTitleTotal(childNumObj)}</header>
}

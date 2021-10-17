import { requestApi } from '@/src/common/js/ajax'
import { NEWAUTH812 } from '@/src/components'
import { TaskManageFilter } from '@/src/components/filter/filter'
import NoneData from '@/src/components/none-data/none-data'
import { Dropdown, Input, Tooltip } from 'antd'
import React, { useContext, useEffect, useImperativeHandle, useLayoutEffect, useReducer, useRef } from 'react'
import { forwardRef } from 'react'
import { useDrag } from 'react-dnd'
import { UpdateTagsSortData } from '../tagsManage/tagComon'
import Tags from '../tagsManage/tags'
import { taskManageContext } from '../TaskManage'
import TaskManageSetModal from '../taskManageSet/taskManageSetModal'
import './taskManageHeader.less'
// 解决数据变动，导致组件重复渲染，listMode多次被重置，缓存当前表格模式类型
export let _listMode: any = 1
// 所有任务标签初始值定义
const taskTypeAll = {
  code: -1,
  id: -3,
  name: '所有任务',
  active: true,
  type: -3,
}
// 归档任务标签初始值定义
// const archiveTask = {
//   code: -2,
//   name: '已归档',
//   active: false,
//   type: 'place',
// }
// 缓存所有标签数据
let TagsData: any[] = []
let tagShowCount = 0 //根据屏幕适配可展示标签数量
// 初始状态值
let stateTmp = {
  search: '',
  taskTypeOut: [taskTypeAll],
  taskTypeMore: [],
  taskKeyword: '',
  pattern: 0, //0鼠标移入隐藏显示组织架构 1默认显示组织架构
  listMode: 1, //0表格模式 1宽详情
  checktip: true, //管理标签tip
  checktip2: true, // 高级筛选tip
  taskManageSetModal: false, //任务管理设置模态框显示
  searchStatus: false, //搜索框状态
  taskAuthBtn: { tableSet: true, theadSet: true }, // 任务管理按钮显示状态
  // nowListEmpty: false, //缓存当前数据状态
  tagManageAuth: false, //任务一类标签弹框显示隐藏
  addTaskAuth: false, //创建任务权限
}
export const TaskManageHeader = forwardRef((props: any, ref) => {
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
  const { expandOrg, createTask, taskListRef, afterFilter, setNowtype } = props.param
  const [taskState, dispatch] = useReducer(taskReducer, stateTmp)
  const topicon = $tools.asAssetsPath('/images/task/topicon1.png')

  const taskContextObj: any = useContext(taskManageContext)

  // 高级筛选模块组件
  const filterRef: any = useRef({})
  // 搜索框
  const searchRef: any = useRef({})

  //初始加载标签类型
  useEffect(() => {
    queryTaskType()
    return () => {
      _listMode = 1
      TagsData = []
      tagShowCount = 0
      stateTmp = {
        search: '',
        taskTypeOut: [taskTypeAll],
        taskTypeMore: [],
        taskKeyword: '',
        pattern: 0, //0鼠标移入隐藏显示组织架构 1默认显示组织架构
        listMode: 1, //0表格模式 1宽详情
        checktip: true, //管理标签tip
        checktip2: true, // 高级筛选tip
        taskManageSetModal: false, //任务管理设置模态框显示
        searchStatus: false, //搜索框状态
        taskAuthBtn: { tableSet: true, theadSet: true }, // 任务管理按钮显示状态
        // nowListEmpty: false, //缓存当前数据状态
        tagManageAuth: false, //任务一类标签弹框显示隐藏
        addTaskAuth: false, //创建任务权限
      }
    }
  }, [])

  // 检测更多筛选标签数据，及时更新提示标签状态
  useEffect(() => {
    updateMoreTagsActive()
  }, [taskState.taskTypeMore])

  // 监听窗口变化，调整外部标签显示个数
  useLayoutEffect(() => {
    // 窗口改变事件
    const _dom = $('.taskManageHeader')
    _dom &&
      _dom.off('resize').on('resize', () => {
        updataTaskTypeTags()
      })
  }, [])

  // ***********************暴露给父组件的方法**************************//
  useImperativeHandle(ref, () => ({
    //获取内部高级筛选结果数据
    getFilterRes: filterRes,
    // 获取当前模式
    getListMode: () => {
      return _listMode
    },
    // 获取内部当前数据状态
    // getNowListEmpty: () => {
    //   return taskState.nowListEmpty
    // },
    // 获取内部当前选择标签
    getTaskTypeOutData: () => {
      return taskState.taskTypeOut
    },
    // 设置内部按钮权限
    setBtnAuth,
    // 初始标签数据
    queryTaskTypeInit: queryTaskType,
    // 初始内部标签tip
    setTagTipStatus,
    // 初始内部数据
    setInitStateFn,
    // 关闭内部高级筛选组件
    closeFilterPlug: () => {
      filterRef.current && filterRef.current.closeFilterPlug()
    },
  }))
  //初始内部state
  const setInitStateFn = () => {
    setBtnAuth()
    queryTaskType()
    setTagTipStatus()
    if (searchRef.current && searchRef.current.state.value) searchRef.current.state.value = ''
  }

  //初始内部标签
  const setTagTipStatus = () => {
    dispatch({
      type: ['checktip2', 'checktip'],
      data: { checktip2: true, checktip: true },
    })
  }

  /**
   * 按钮权限控制
   */
  const setBtnAuth = () => {
    const isMy = $store.getState().taskManageTreeInfo?.isMy
    const btnAuth = taskContextObj.getBtnAuth()
    const taskBtn = {
      tableSet: btnAuth.tableSet,
      theadSet: btnAuth.theadSet,
    }
    dispatch({
      type: ['tagManageAuth', 'addTaskAuth', 'taskAuthBtn'],
      data: {
        tagManageAuth: btnAuth?.tagManageAuth,
        addTaskAuth: isMy ? true : btnAuth?.addTaskAuth,
        taskAuthBtn: taskBtn,
      },
    })
  }

  // =======================任务模式菜单====================//

  /**
   * 模式切换
   */
  const taskModeChange = (key: number) => {
    // 0表格 1宽详情
    taskListRef.current.taskModeChange(key)
    // 如果是宽详情，判断数据是够为空
    // if (key === 1 && taskListRef.current) {
    //   taskState.nowListEmpty = taskListRef.current.getTaskListLength() === 0
    // }
    _listMode = key
    updataTaskTypeTags()
    dispatch({
      type: ['listMode', 'searchStatus'],
      data: {
        // nowListEmpty: taskState.nowListEmpty,
        listMode: key,
        searchStatus: false,
      },
    })
  }
  /**
   * 获取当前列表是否初始化查询
   */
  const getListInit = () => {
    const init = taskListRef.current.getListInit()
    return init
  }
  // 更新任务类型数据 listMode:当前模式状态 1：款详情  0：表格
  /***
   * active：激活状态
   */
  const updataTaskTypeTags = (paramObj?: any) => {
    const { type, dataList, refresh, active } = paramObj || {}
    const moreData: any = []
    const outData: any = refresh ? [] : [taskTypeAll]
    tagShowCount = refresh ? tagShowCount : Number($('.content_left').width()) / 98 - 3
    const stopIdx = refresh ? tagShowCount + 1 : tagShowCount
    const isMapDatas = refresh ? [...dataList] : [...TagsData]
    isMapDatas.forEach((item: any, index: number) => {
      if (index < stopIdx) {
        outData.push(item)
      } else {
        moreData.push(item)
      }
    })
    if (active) {
      // 我的任务需保存标签排序
      saveConfig(isMapDatas)
    }
    dispatch({
      type: ['taskTypeMore', 'taskTypeOut'],
      data: { taskTypeMore: [...moreData], taskTypeOut: [...outData] },
    })
    if (type == 'initTaskType') {
      // 查询任务列表
      taskListRef.current.taskListInit({ init: 'taskType' })
    }
  }
  /**
   * 查询任务类型标签
   */
  const queryTaskType = (args?: any) => {
    const taskOrgInfo = $store.getState().taskManageTreeInfo
    const treeInfo = taskOrgInfo.orgInfo
    let param: any = {}
    // 我的任务
    if (taskOrgInfo.isMy) {
      setNowtype(0)
      param = {
        ascriptionId: $store.getState().nowUserId,
        ascriptionType: 0,
        // startNo: paramObj.startNo,
      }
    } else {
      param = {
        ascriptionId: treeInfo.cmyId,
        ascriptionType: 2,
        // startNo: paramObj.startNo,
      }
      if (treeInfo.getType == 2) {
        setNowtype(2)
      } else if (treeInfo.getType == 3) {
        setNowtype(3)
      } else {
        setNowtype(0)
      }
    }
    requestApi({
      url: '/task/tag/getConfig',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        const dataList = res.data.dataList || []
        const _tagsData: any = []
        taskTypeAll.active = true
        // archiveTask.active = false
        dataList.map((item: any) => {
          const obj = {
            code: item.id || 0,
            name: item.content,
            type: item.type || 0,
            active: false,
          }
          _tagsData.push(obj)
        })
        TagsData = [..._tagsData]
        updataTaskTypeTags(args)
      }
    })
  }
  /**
   * 任务类型切换
   * findType:0外层标签 1一类标签
   * thisItem：当前操作节点数据
   */
  const taskTypeChange = (code: any, findType: number) => {
    const taskTypeMore = taskState.taskTypeMore
    const taskTypeOut = taskState.taskTypeOut
    const taskTypeList = findType == 1 ? taskState.taskTypeMore : taskState.taskTypeOut
    let active = true
    let _nowItem: any = null

    // 选中所有任务/归档任务
    if (code == -1 || code == -2) {
      // 取消选中一类标签
      for (const i in taskTypeMore) {
        taskTypeMore[i].active = false
      }
      for (const i in taskTypeOut) {
        if (taskTypeOut[i].code == code) {
          taskTypeOut[i].active = true
        } else {
          taskTypeOut[i].active = false
        }
      }
    }
    // 选中其他一类标签
    else {
      for (const i in taskTypeList) {
        if (taskTypeList[i].code == code) {
          if (taskTypeList[i].active == true) {
            taskTypeList[i].active = false
            active = false
            _nowItem = taskTypeList[i]
          } else {
            taskTypeList[i].active = true
            _nowItem = taskTypeList[i]
          }
        }
        // 取消选中所有任务/归档任务
        else if (taskTypeList[i].code == -1 || taskTypeList[i].code == -2) {
          taskTypeList[i].active = false
        }
      }
      // 本次取消选中后，如果不再有选中，则恢复选中所有任务
      if (!active) {
        const filterObj: any = filterRes()
        if (filterObj.taskTypes.length == 0 && filterObj.taskTypeTags.length == 0) {
          taskTypeOut[0].active = true
        }
      } else {
        taskTypeOut[0].active = false
      }
    }

    const dataList = findType == 1 ? [...taskTypeOut, ...taskTypeList] : [...taskTypeList, ...taskTypeMore]
    if (code != -1) {
      // 选中非全部标签，重新排序标签顺序（当前选择提升至全部后显示）
      const idx = dataList.findIndex((item: any) => {
        return item.code == code
      })
      // 选择提升标签位置、删除后移动该标签
      // if (active) {
      //   dataList.splice(1, 0, _nowItem)
      // } else {
      //   dataList.push(_nowItem)
      // }
      // 暂时只做选择提升标签位置
      if (active) {
        dataList.splice(idx, 1)
        dataList.splice(1, 0, _nowItem)
      }
    }

    updataTaskTypeTags({
      refresh: true,
      dataList,
      active,
    })

    // 查询任务列表
    taskListRef.current.taskListInit({ init: 'taskType' })
    // 初始高级筛选时间值
    filterRef.current.initRangeTime()
    // 取消标签tip选择状态
    if (!taskState.checktip2) {
      dispatch({
        type: ['checktip2'],
        data: { checktip2: true },
      })
    }
  }
  /**
   * 任务管理筛选结果
   * filterData:高级筛选中的数据
   */
  const filterRes = (infoObj?: any) => {
    const paramObj = infoObj ? infoObj : {}
    const filterInit = paramObj.filterInit ? paramObj.filterInit : false
    // 任务类型
    let taskTypes: any = []
    // 任务标签
    let taskTypeTags: any = []
    // 任务类型标签
    const taskTypeOut = taskState.taskTypeOut
    const taskTypeList = [...taskTypeOut, ...taskState.taskTypeMore]
    // 排除所有任务/归档任务被选中情况
    if (!taskState.taskTypeOut[0].active) {
      taskTypeList.forEach((item: any) => {
        // type:1任务类型 0标签
        if (item.active) {
          // console.log('当前有任务被选中')
          if (item.type == 1) {
            taskTypes.push(item.code)
          } else {
            taskTypeTags.push(item.code)
          }
        }
      })
    } else {
      taskTypes = taskState.taskTypeOut[0].active ? [-1] : [-2]
      taskTypeTags = []
    }
    if (filterInit == 'org') {
      taskTypeTags = []
      taskTypes = [-1]
    }
    let fliterInfo: any = {
      taskTypes: taskTypes,
      taskTypeTags: taskTypeTags,
      taskKeyword: stateTmp.taskKeyword,
    }
    // 获取高级筛选框结果
    const fliterObjInit = {
      rankList: [], //级别
      deptList: [], //部门
      statusList: [],
      priorityList: [],
      tagSearchVal: '',
      startTime: '',
      endTime: '',
      levelList: [],
      noReport: 0, //无汇报内容
      tagList: [],
    }
    const filterObj = filterInit ? fliterObjInit : filterRef.current.getFilterObj()
    //合并两个数组
    taskTypeTags.push(...filterObj.tagList)
    //去重
    fliterInfo.taskTypeTags = Array.from(new Set(taskTypeTags))
    if (filterObj) {
      fliterInfo = { ...fliterInfo, ...filterObj }
    }
    return fliterInfo
  }

  // =======================一类任务类型标签===============//
  /**
   * 任务类型标签单项节点
   */
  const TaskTypeMoreItem = ({ item }: { item: any }) => {
    const dragRef: any = useRef(null)
    // 使用 useDrag拖拽
    const [, drager] = useDrag({
      item: { type: 'taskTypeDrag', itemData: item },
    })
    // 自定义才可以拖动
    if (item.type != 1) {
      drager(dragRef)
    }
    return (
      <Tooltip title={item.name}>
        <li
          ref={dragRef}
          data-code={item.code}
          data-type={item.type}
          className={`taskTypeTagItem ${item.active ? 'active' : ''}`}
          onClick={(e: any) => {
            taskTypeChange(Number(e.currentTarget.dataset.code), 1)
          }}
        >
          <span className="item-name">{item.name}</span>
          <em className="img_icon"></em>
        </li>
      </Tooltip>
    )
  }
  // 更新更多标签窗口激活状态显示
  const updateMoreTagsActive = () => {
    if (taskState.taskTypeMore.length == 0) {
      dispatch({ type: ['checktip'], data: { checktip: true } })
      return
    }
    const isSelect = taskState.taskTypeMore.find((item: any) => {
      return item.active == true
    })
    if (isSelect && taskState.checktip) {
      dispatch({ type: ['checktip'], data: { checktip: false } })
    }
    if (!isSelect && !taskState.checktip) {
      dispatch({ type: ['checktip'], data: { checktip: true } })
    }
  }
  /**
   * 一类标签下拉弹框
   */
  const moreTypeTag = () => {
    return (
      <section className="basePopoverMenu moreTypeTagPopover baseDropInBox">
        <header className="flex between more_tag_header">
          <div>
            <span className="more_tag_tit">一类标签</span>
            <span className="more_tag_msg">（多选）：</span>
          </div>
          <div>{taskState.tagManageAuth ? <Tags callback={queryTaskType} /> : ''}</div>
        </header>
        <ul className="taskTypeMoreList">
          {taskState.taskTypeMore.map((item: any, i: number) => (
            <TaskTypeMoreItem item={item} key={i} />
          ))}
          {taskState.taskTypeMore.length == 0 ? (
            <NoneData
              imgSrc={$tools.asAssetsPath('/images/noData/no_task_org_child.png')}
              showTxt="暂无标签"
              imgStyle={{ width: 50, height: 60 }}
            />
          ) : (
            ''
          )}
        </ul>
      </section>
    )
  }

  /**
   * 任务类型标签单项节点
   */
  const TaskTypeOutItem = ({ reName, item }: { reName?: string; item: any }) => {
    const dragRef: any = useRef(null)
    // 使用 useDrag拖拽
    const [, drager] = useDrag({
      item: { type: 'taskTypeDrag', itemData: item },
    })
    // console.log(item)
    // 任务标签才可以拖动
    if (item.type != -3 && item.type != 'place' && item.type != 1) {
      drager(dragRef)
    }
    return (
      <Tooltip title={item.name}>
        <li
          ref={dragRef}
          data-code={item.code}
          data-type={item.type}
          className={`taskTypeTagItem ${
            // item.active || (item.name === taskTypeAll.name && !reName && !archiveTask.active) ? 'active' : ''
            item.active ? 'active' : ''
          }`}
          onClick={(e: any) => {
            taskTypeChange(Number(e.currentTarget.dataset.code), 0)
            // 更新更多标签窗口激活状态显示
            // updateMoreTagsActive()
          }}
        >
          <span className="item-name">{reName || item.name}</span>

          <em className="img_icon tick"></em>
        </li>
      </Tooltip>
    )
  }

  // 保存标签排序
  const saveConfig = (tagsData: any[]) => {
    const { loginToken, nowUserId, taskManageTreeInfo } = $store.getState()
    // 我的任务
    if (!taskManageTreeInfo.isMy) return
    const _tagsData: any[] = []
    tagsData.forEach((item: any, index: number) => {
      if (index > 0) {
        _tagsData.push({
          id: item.code,
          content: item.name,
          position: index - 1,
          isSelect: 1,
        })
      }
    })
    const param = {
      ascriptionId: nowUserId, //归属id 用户Id 或者 公司Id 244
      ascriptionType: 0, //归属类型 0:用户 2:公司
      tagList: _tagsData,
    }
    UpdateTagsSortData(param, loginToken)
      .then(res => {
        // console.log(res)
      })
      .catch(err => {
        console.error(err)
      })
  }

  return (
    <nav
      // ref={navRef}
      className={`navContainer taskManageHeader flex`}
    >
      <div className="content_left" style={{ width: '60%', whiteSpace: 'nowrap' }}>
        {/* 展开搜索侧边栏 */}
        <Tooltip title="展开侧边栏">
          <em
            className={`img_icon org_fold_icon open ${taskContextObj?.taskState?.orgShow ? 'forcedHide' : ''}`}
            onClick={() => {
              expandOrg()
            }}
          ></em>
        </Tooltip>
        <ul className={`taskTypeOutTag inline-flex`}>
          {taskState.taskTypeOut.map((item: any, i: number) => (
            // i < 2 &&
            <TaskTypeOutItem item={item} key={i} />
          ))}
        </ul>
        <Dropdown
          overlayStyle={{ zIndex: 999 }}
          overlay={() => moreTypeTag()}
          trigger={['click']}
          placement="bottomRight"
        >
          <span className={`nav_subbt more_type_btn`}>
            <span className={`toptipicon ${taskState.checktip ? 'forcedHide' : ''}`}>
              <img src={topicon} alt="" />
            </span>
            更多
            <em className="img_icon tri_down_icon mleft"></em>
          </span>
        </Dropdown>
      </div>
      <div className="content_right flex center end" style={{ width: '40%' }}>
        {/* 搜索框 */}
        <Input
          ref={searchRef}
          placeholder="请输入关键字"
          prefix={
            <em
              className="search-icon-t-btn"
              onClick={() => {
                afterFilter()
              }}
            ></em>
          }
          className={`baseInput radius16 border0 taskSearch`}
          style={{ maxWidth: 208 }}
          defaultValue=""
          onKeyUp={(e: any) => {
            const searchVal = e.target.value
            if (e.keyCode == 13) {
              dispatch({
                type: ['taskKeyword'],
                data: { taskKeyword: searchVal },
              })
              afterFilter()
            }
          }}
        />
        {/* 高级筛选 */}
        <TaskManageFilter
          ref={filterRef}
          afterFilter={afterFilter}
          param={{
            getListInit: getListInit,
            renderTextDom: renderFilterText({ topicon, checktip2: taskState.checktip2 }),
          }}
          gettoptip={(datas: any) => {
            dispatch({
              type: ['checktip2'],
              data: { checktip2: !datas },
            })
          }}
        />

        {/* 切换模式 */}
        <span className={`nav_subbt change-mode`} data-mode={taskState.listMode}>
          <span
            className={`em_box ${taskState.listMode == 0 ? 'active' : ''}`}
            onClick={() => {
              taskModeChange(0)
            }}
          >
            <Tooltip title="列表">
              <em className={`img_icon  list-icon `}></em>
            </Tooltip>
          </span>
          <span
            className={`em_box ${taskState.listMode == 1 ? 'active' : ''}`}
            onClick={() => {
              taskModeChange(1)
            }}
          >
            <Tooltip title="宽详情">
              <em className={`img_icon  width-icon`}></em>
            </Tooltip>
          </span>
        </span>

        {/* 表头设置 */}
        <span
          className={`nav_subbt inline-flex center-v table_settings_btn ${
            taskState.taskAuthBtn.tableSet ? '' : 'forcedHide'
          }`}
          onClick={() => {
            dispatch({
              type: ['taskManageSetModal'],
              data: {
                taskManageSetModal: true,
              },
            })
          }}
          style={{ top: taskState.searchStatus ? 0 : 3 }}
        >
          <em className="img_icon list_set_icon"></em>
        </span>
        {/* 添加任务btn 8.12 */}
        {(NEWAUTH812 ? taskState?.addTaskAuth : true) && (
          <span
            className={`createTaskBtn`}
            onClick={() => {
              createTask(true)
            }}
          ></span>
        )}
      </div>

      {/* 优先级、工作时长设置 */}
      {taskState.taskManageSetModal && (
        <TaskManageSetModal
          visible={taskState.taskManageSetModal}
          closeTaskManageSetModal={() => {
            dispatch({
              type: ['taskManageSetModal'],
              data: {
                taskManageSetModal: false,
              },
            })
          }}
        />
      )}
    </nav>
  )
})

export default TaskManageHeader
// 渲染高级筛选插件显示文案
const renderFilterText = ({ topicon, checktip2 }: any) => {
  return (
    <span className={`nav_subbt more_type_btn marginTB24`}>
      <span className={`toptipicon ${checktip2 ? 'forcedHide' : ''}`}>
        <img src={topicon} alt="" />
      </span>
      筛选
      <em className="img_icon tri_down_icon mleft"></em>
    </span>
  )
}

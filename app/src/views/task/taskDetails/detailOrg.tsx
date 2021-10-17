import React, { forwardRef, useEffect, useImperativeHandle, useReducer, useState } from 'react'
import { Table, Tooltip } from 'antd'
import { setNowDetailTaskExp, tableExpandable } from '../taskManage/TaskManageList'
import NoneData from '@/src/components/none-data/none-data'
import { requestApi } from '@/src/common/js/ajax'
import { queryTaskTreeApi } from './detailApi'
import { RoleComponet, setTagByStatus, TaskListTags, TaskTypeTag } from '../task-com/TaskCom'
import '../taskManage.less'
import './detailOrg.less'
import { queryTaskById } from '../taskComApi'
import { detailModalHandle } from './detailModal'

export let refreshTaskTreeExp: any = null

// 设置当前任务的子任务数量
export let setSubTaskCount: any = null
// 静态初始化state数据，始终不变，用于还原数据
const stateOne: any = {
  query: 0,
  columns: [],
  contentList: [],
  expandedRowKeys: [], //展开的行
  loading: false,
  hasMorePage: true, //是否还有下一页，可滚动加载
  listPageNo: 0,
  scrollY: 800, //表格滚动区域高度
}
const stateTmp: any = JSON.parse(JSON.stringify(stateOne))
// 记录当前选中任务
let nowTask: any = {}
// 任务数据表
const treeListMap: any = () => {}
/**
 * 子任务组织架构
 */
const DetailOrg = forwardRef(
  ({ taskId, query, refreshRight }: { taskId: number | string; query: number; refreshRight?: any }, ref) => {
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
          getState[item] = getArr
          stateTmp[item] = getArr
        } else {
          getState[item] = action.data[item]
          stateTmp[item] = action.data[item]
        }
      })
      return { ...getState }
    }

    /**
     * 初始化加载
     */
    useEffect(() => {
      queryTaskTree()
    }, [query])
    useEffect(() => {
      refreshTaskTreeExp = refreshTaskTree
    }, [])
    // ***********************暴露给父组件的方法**************************//
    useImperativeHandle(ref, () => ({
      /**
       * 设置详情刷新字段，用于父组件对详情查询接口全局刷新
       * 不传id则查询当前任务
       */
      setQuery: () => {
        queryTaskTree()
      },
      /**
       * 刷新组织架构
       */
      refreshTaskTree,
    }))

    //   ********************************************表格处理************************************************//
    // 处理单元格
    const renderContent = ({ row }: any) => {
      const obj: any = {
        children: '',
        props: {},
      }
      //是否完成
      const isComplet = row.status == 2
      //是否已归档
      const isArchive = row.flag == 3
      // 优先级标记
      let priFlag: any = ''
      if (row.icon) {
        const priIcon = $tools.asAssetsPath(`/images/task/${row.icon}.png`)
        priFlag = (
          <span className="taskPriTag">
            <em className="taskPriTagIcon">
              <img src={priIcon} alt="" />
            </em>
          </span>
        )
      }
      // 被关注的任务标识图标
      let attenIcon: any = ''
      const followers = row.followNames || []

      if (followers.length > 0) {
        attenIcon = (
          <Tooltip placement="top" title={$intl.get('followed') + ':' + followers.join('、')}>
            <div className="attentionFlag">
              <em className="triangle_topleft"></em>
              <em className="img_icon attentionIcon"></em>
            </div>
          </Tooltip>
        )
      }
      const tdHtm = (
        <div
          className={`cellCont ${isComplet || isArchive ? 'finished' : ''}`}
          onClick={() => {
            nowTask = row
            // 设置任务管理列表中当前操作的详情任务数据（数据要使用列表中的）
            setNowDetailTaskExp && setNowDetailTaskExp({ findId: row.id })
            refreshRight && refreshRight({ id: row.id })
            // 刷新一次，自动更新选中任务
            dispatch({
              type: ['contentList'],
              data: { contentList: [...stateTmp.contentList] },
            })
          }}
        >
          {attenIcon}
          <div className="boardTaskName">
            {/* 第1行：任务名 */}
            <div className="taskNameRow flex between">
              <div className="contLeft">
                <div className="taskListNameBox">
                  <span className="taskNameSpan">{row.name}</span>
                </div>
                <div className="taskListStatusBox inline-flex">
                  {setTagByStatus(row)}
                  <span
                    title={$intl.get('distributedByUsers', { users: row.distributeUser })}
                    className={`${row.distributeUser != null ? 'taskMiddlpai' : 'noneTaskMiddleLabel'}`}
                  ></span>
                </div>
              </div>
            </div>
            {/* 第2行：任务标签 */}
            <div className="taskListTagBox flex">
              {priFlag}
              {row.maxRole == 4 && <RoleComponet params={{ code: row.maxRole, type: row.type }} />}
              <TaskListTags tagList={row.tagList || []} />
            </div>
            <div className="taskListAssignBox">
              {row.assignName ? (
                <span className="taskMiddleLabel">
                  {$intl.getHTML('assignedByUser', { userName: row.assignName })}
                </span>
              ) : (
                ''
              )}
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
    // *********************state****************************//
    const [taskListState, dispatch] = useReducer(taskListReducer, { ...stateTmp })
    // **************************************执行方法******************************//
    const queryTaskTree = () => {
      if (!taskId) {
        return
      }
      queryTaskTreeApi({ taskId }).then((res: any) => {
        const contentList = res.data ? [res.data] : []
        console.log(contentList)
        nowTask = contentList[0] || {}
        const expandedRowKeys: any = []
        // 表格内容组装
        const newDatas = setTreeTableData({
          data: contentList,
          childLevel: false,
          itemCheck: ({ item }: any) => {
            if (item.subList && item.subList.length > 0) {
              expandedRowKeys.push(item.key)
            }
          },
        })
        // 滚动加载时添加数据到末尾
        dispatch({
          type: ['contentList', 'expandedRowKeys'],
          data: { contentList: [...newDatas], expandedRowKeys },
        })
      })
    }

    // =============================多层级表格处理 start===============================//
    /**
     * 处理单个数组数据为表格树可用数据
     * data：表格内容数据
     * childLevel：是否是子级数据（除第一层都是子级）
     */
    const setTreeTableData = (paramObj: {
      data: any
      childLevel?: any
      optType?: string //操作类型
      parentId?: any
      itemCheck?: any
    }) => {
      const { itemCheck } = paramObj
      return paramObj.data?.map((item: any, i: number) => {
        // 对象形式时，取对应id的childLevel
        if (paramObj.childLevel != undefined) {
          item.childLevel = paramObj.childLevel
        }
        item.key = item.id
        // 设置父任务数据
        if (paramObj.parentId) {
          item.parentId = paramObj.parentId
        }
        // 存储上一个任务数据
        if (i - 1 >= 0) {
          item.preId = paramObj.data[i - 1].id
        }
        // 存储下一个任务数据
        if (i + 1 < paramObj.data.length) {
          item.nextId = paramObj.data[i + 1].id
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
              parentId: item.id,
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
      onlyFind,
      operateId,
    }: {
      findId: string
      row?: any
      onlyFind?: boolean
      operateId?: string //当前操作的任务id
    }) => {
      const param = {
        taskId: findId,
        loginUserId: $store.getState().nowUserId,
      }
      return new Promise((resolve: any) => {
        requestApi({
          url: '/task/findManagerSubList',
          param,
        }).then((res: any) => {
          if (res.success) {
            const childData = res.data.dataList || []
            // 只查询数据情况
            if (onlyFind) {
              let isDel = true
              for (let i = 0; i < childData.length; i++) {
                if (childData[i].id == operateId) {
                  isDel = false
                  // taskData = childData[i]
                  break
                }
              }
              resolve({ isDel, taskData: childData })
              return
            }
            console.log(childData)
            // const parentRow = row
            // parentRow.children = childData
            // 表格内容组装
            const newChilds = setTreeTableData({
              data: childData,
              childLevel: true,
              parentId: findId,
            })
            const newList = updateTreeChild(stateTmp.contentList, {
              findId,
              children: newChilds,
            })
            resolve({ taskData: newList })
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
    /**
     * 表格集成组件
     */
    const components = {
      body: {
        cell: DragableBodyCell,
      },
    }

    /**
     * 刷新列表
     * taskIds:查询多个任务的id数组
     * optType:操作类型
     * childLevel:是否是子级任务
     */
    const refreshTaskTree = ({
      taskIds,
      optType,
      parentId,
      newChild,
    }: {
      rowData?: any
      taskIds: any
      optType?: string
      childLevel?: any
      parentId?: string //新增子任务时需要父任务id
      newChild?: any
    }) => {
      const { nowUserId } = $store.getState()
      // 是否全局刷新（没有局部刷新效果）
      let isDef = false
      const tableList = stateTmp.contentList
      const paramObj: any = {
        dataList: tableList,
        taskIds: taskIds,
        finded: 0, //已匹配到的数量，用于暂停递归
        optType: optType,
      }
      const expandedRows = stateTmp.expandedRowKeys
      // 需要查询的任务id列表
      let taskIdList: any = taskIds || [nowTask.id]
      let nowTaskInfo: any = { item: null }
      switch (optType) {
        // 新增子任务
        case 'addChildTask':
          // 已经展开时直接添加子任务进去
          if (expandedRows.includes(parentId)) {
            const newChildArr = [newChild || {}]
            const newChilds = setTreeTableData({
              data: newChildArr,
              childLevel: true,
              parentId,
            })
            paramObj.newChild = newChilds[0]
          }
          break
        case 'archive': //归档
        case 'del': //删除
          nowTaskInfo = { item: null }
          // 如果当前删除了顶层任务，则关闭弹框
          if (taskIds[0] == tableList[0].id) {
            isDef = true
            taskIdList = []
            detailModalHandle && detailModalHandle({ visible: false })
          } else {
            if (tableList[0]) {
              nowTask = tableList[0]
            }
            findNowTask({
              dataList: tableList,
              findId: taskIds[0],
              taskInfo: nowTaskInfo,
              optType: optType,
              nowUserId,
              initDataList: tableList,
            })
            refreshRight && refreshRight({ id: nowTask.id })
          }

          // 没有找到可删除任务则无需刷新
          if (nowTaskInfo.isDel && nowTaskInfo.item) {
            // map表中清除被删除任务
            treeListMap[nowTaskInfo.item.id] = {}
            //满足删除条件，则查询并更新父任务
            taskIdList = [nowTaskInfo.item.parentId || {}]
          } else {
            //不满足删除条件则更新需要查询的任务
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
        case 'all': //全局刷新
          isDef = true
          queryTaskTree()
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
          console.log(dataList)
          // 表格内容组装
          const newDatas = setTreeTableData({
            data: dataList,
            // childLevel: newChildLevel,
          })
          paramObj.newDatas = newDatas
          replaceTask({ ...paramObj, taskIds: taskIdList })
          if ((optType == 'addChildTask' || optType == 'assign') && !expandedRows.includes(parentId)) {
            const _id = optType == 'assign' && !parentId && taskIdList.length == 1 ? taskIdList[0] : parentId
            expandedRows.push(_id)
            expandNode({
              expanded: true,
              row: { id: _id },
              handExp: expandedRows,
            })
          } else {
            dispatch({
              type: ['contentList'],
              data: { contentList: [...tableList] },
            })
          }
        })
      }
    }

    /**
     * 递归查询子级任务
     */
    const findChildNexts = ({ dataList, idList }: { dataList: any; idList?: any }) => {
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
          // 空值后台可能不返，故依据最长字段的
          const findItem = newDataItem[0]
          for (const key in findItem) {
            const val = newDataItem[0][key]
            // 排除不更新的健，更新children会导致子节点清空，故不更新
            if (key != 'id' && key != 'key' && key != 'children') {
              paramObj.dataList[i][key] = val
            }
          }
          // 更新map表
          treeListMap[findItem.id] = { ...paramObj.dataList[i] }
          // 新增子任务
          if ((optType == 'addChildTask' || optType == 'assign') && paramObj.newChild) {
            if (!paramObj.dataList[i].children) {
              paramObj.dataList[i].children = []
            }
            paramObj.dataList[i].children.push(paramObj.newChild)
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
    }: {
      dataList: any
      findId: string
      taskInfo: any
      optType?: string
      nowUserId?: any
      isDel?: boolean
      initDataList?: any
    }): any => {
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
        }
        if (item.children && item.children.length > 0 && !taskInfo.item) {
          findNowTask({ dataList: item.children, findId, taskInfo, optType, isDel, initDataList: item })
        }
      }
    }
    return (
      <aside className="childOrgContainer">
        <header className="childInfoTop">
          {$intl.get('childTaskLevelShow', {
            level: nowTask.level || 0,
            subTaskCount: nowTask.subTaskCount || 0,
          })}
        </header>
        <Table
          className="chidlOrgTable taskListTable h100 task-list noTrHover"
          bordered
          tableLayout="fixed"
          showHeader={false}
          columns={taskListState.columns}
          dataSource={taskListState.contentList}
          onExpand={(expanded: boolean, row: any) => {
            expandNode({
              expanded: expanded,
              row: row,
            })
          }}
          expandable={tableExpandable}
          locale={{
            emptyText: <NoneData />,
          }}
          pagination={false}
          expandedRowKeys={taskListState.expandedRowKeys}
          onExpandedRowsChange={onExpandedRowsChange}
          components={components}
          onRow={(record: any) => {
            return {
              onClick: () => {}, // 点击表头行
              rowdata: record,
            }
          }}
        />
        {/* {console.log(taskListState.contentList)} */}
        {!taskListState.contentList[0]?.children && (
          <NoneData
            className="threePosition"
            imgSrc={$tools.asAssetsPath('/images/noData/no_task_org_child.png')}
            showTxt={$intl.get('noChildTaskMsg')}
            imgStyle={{ width: 80, height: 76 }}
            containerStyle={{ position: 'absolute', left: -21, zIndex: 0 }}
          />
        )}
      </aside>
    )
  }
)

/**
 * 拖动组件包装表格单元格
 */
const DragableBodyCell = (props: any) => {
  const { rowData, rowIndex, colIndex, className, style, ...restProps } = props
  return (
    <td
      key={rowIndex || 0}
      className={`noHover ${className} ${rowData && rowData.childLevel ? 'treeTableChild' : ''} ${
        rowData && nowTask.id == rowData.id ? 'active' : ''
      }`}
      style={{ ...style }}
      {...restProps}
    />
  )
}
/**
 * 组织架构头部
 */
export const OrgHeader = ({ level, subTaskCount }: { level: number; subTaskCount: number }) => {
  const [task, setTask] = useState<any>({
    level,
    subTaskCount,
  })
  useEffect(() => {
    setSubTaskCount = ({ level, subTaskCount }: { level: any; subTaskCount: any }) => {
      nowTask.level = level
      nowTask.subTaskCount = subTaskCount
      setTask({ ...task, level, subTaskCount })
    }
  }, [])
  // useEffect(() => {
  //   setTask({
  //     level,
  //     subTaskCount,
  //   })
  // }, [level, subTaskCount])
  return (
    <header className="childInfoTop">
      当前选中第{task.level || 0}层，拥有{task.subTaskCount || 0}个子任务
    </header>
  )
}

export default DetailOrg

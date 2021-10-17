import React, { useReducer, useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { Tree, Input, Tooltip, Modal, Dropdown, Menu } from 'antd'
import { CaretDownOutlined } from '@ant-design/icons'
import { useDrag, useDrop, DndProvider } from 'react-dnd'
import NoneData from '@/src/components/none-data/none-data'
// import { taskRowDrag } from '../task/TaskManage'
// import { requestApi } from '@/src/common/js/ajax'
import { setTreeChild } from '@/src/common/js/tree-com'
import { folderInitName, PlanMenu } from './cardWorkPlan'

import {
  addFolderNew,
  getPlanListNew,
  modifyFolderNameNew,
  modifyPlanNameNew,
  moveToDirSave,
  planOperationBtn,
  queryFolderDataNew,
  queryPlanDataNew,
} from './NewPlanOpt'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createMindMap } from './workPlanMap/workPlanMap'
import { compareSort } from '@/src/common/js/common'

// 外部调用：拖动到组织架构执行方法
let dragTaskToOrgExp: any = null
// 树形结构数据映射表
let treeMapData: any = {}
// 初始化state
const stateOne: any = {
  treeData: [],
  selectedKeys: [],
  orgSearch: '',
  expandedKeys: [],
  defExpandedKeys: [],
  init: true,
  loadedKeys: [],
}

let stateInit: any = Object.assign({}, stateOne)
export const PlanListOrg = forwardRef((props: any, ref) => {
  const { planRightShow } = props
  /**
   * 组织架构相关reducer
   * @param state
   * @param action
   * action.type:传数组（元素为要更改的state参数名），data对象包含要更改的值，以此可更改多个state值
   */
  const orgReducer = (state: any, action: { type: any; data: any }) => {
    let getState = { ...state }
    if (action.type[0] == 'stateInit') {
      getState = action.data
      treeMapData = {}
    } else {
      action.type.map((item: any) => {
        // item是要更改的参数，getState[item]是获取的state旧值,action.data[item]为新更新的值
        let getArr: any = []
        if (Array.isArray(action.data[item])) {
          getArr = [...action.data[item]]
          getState[item] = getArr
          stateInit[item] = getArr
        } else {
          getState[item] = action.data[item]
          stateInit[item] = action.data[item]
        }
        // 组织架构树数据
        if (item == 'treeData') {
          getArr?.map((tItem: any) => {
            // 更新组织架构树map表
            treeMapData[tItem.key] = { ...tItem }
          })
        }
      })
    }
    return { ...getState }
  }
  const [orgState, dispatch] = useReducer(orgReducer, stateInit)
  // 拖动到不同类型弹框
  const [dragDiffModal, setDragDiffModal] = useState<any>({
    visible: false,
    content: '',
  })
  const inputRef: any = useRef(null)
  let isUnmounted = false

  // ***********************暴露给父组件的方法**************************//
  useImperativeHandle(ref, () => ({
    /**
     * 刷新组织架构
     */
    refreshTree,
    /***
     * 右侧进入文件夹联动展开左侧
     */
    expandTreeNode,
  }))

  //   初始化监听
  useEffect(() => {
    // stateInit = {
    //   treeData: [],
    //   selectedKeys: [],
    //   orgSearch: '',
    //   expandedKeys: [],
    //   defExpandedKeys: [],
    //   loadedKeys: [],
    // }
    // 查询左侧组织架构
    queryTreeFirst()
  }, [props.orgChange])

  useEffect(() => {
    dragTaskToOrgExp = dragTaskToOrg
    isUnmounted = false
    return () => {
      treeMapData = {}
      stateInit = Object.assign({}, stateOne)
      // dragTaskToOrgExp = null
      isUnmounted = true
    }
  }, [])

  // *********************数据查询处理*********************//

  // 展开tree节点并选中当前节点
  const expandTreeNode = ({ nodeInfo }: { nodeInfo: any }) => {
    const { id, type, parentFolderId } = nodeInfo
    let nodeKey = `${type}_${id}`
    stateInit.selectedKeys = [nodeKey]
    // 判断是否规划,规划则需查询父级的子级数据，再定位至规划
    if (type == 0) nodeKey = `1_${parentFolderId || 0}`
    // 判断选择项是否存在展开合集中
    if (id && !stateInit.expandedKeys.includes(nodeKey)) {
      const expandedKeys = stateInit.expandedKeys
      expandedKeys.push(nodeKey)

      expandNode({
        expanded: true,
        treeNode: treeMapData[nodeKey || '1_0'],
        handExp: expandedKeys,
        selectedKeys: [...stateInit.selectedKeys],
      })
    } else {
      dispatch({
        type: ['selectedKeys'],
        data: { selectedKeys: [...stateInit.selectedKeys] },
      })
    }
  }

  /**
   * 查询文件规划列表组织架构
   */
  const queryTreeFirst = (paramObj?: any) => {
    // 默认选中项
    const selectedKeys = paramObj && paramObj.selectedKeys ? paramObj.selectedKeys : ['1_0']
    dispatch({
      type: ['init'],
      data: {
        init: false,
      },
    })
    const param = {
      userId: $store.getState().nowUserId,
      folderId: '',
      keyword: '',
    }
    getPlanListNew(param).then((res: any) => {
      if (!isUnmounted) {
        if (res.success) {
          const { data, obj, dataList } = res

          const _dataList = [
            {
              id: 0,
              type: 1, //我的脑图
              name: '我的脑图',
              data, //规划个数
              folderCount: obj, //文件夹个数
              children: dataList,
            },
          ]
          // stateInit.treeData = [..._dataList]
          // 默认展开的节点
          const expandedKeys: any = ['1_0']
          // ====修改后台返回数据为组织架构树组件可渲染数据====//
          const newDataList = renderTreeData(
            {
              array: _dataList,
              idKey: 'id',
              nameKey: 'name',
            },
            {
              fromType: 'taskManage',
              isCount: true, //显示统计
              expandedKeys: expandedKeys,
              // setOpencreattask: props.param.setOpencreattask,
              setExpandedKeys: (thisKey: string) => {
                const index = stateInit.expandedKeys.indexOf(thisKey)
                if (index == -1) {
                  stateInit.expandedKeys.push(thisKey)
                } else {
                  stateInit.expandedKeys.splice(index, 1)
                }
                dispatch({
                  type: ['expandedKeys'],
                  data: {
                    expandedKeys: [...stateInit.expandedKeys],
                  },
                })
              },
              refreshTree,
              updateRightShow,
            }
          )
          // console.log(newDataList)
          dispatch({
            type: ['treeData', 'expandedKeys', 'defExpandedKeys', 'selectedKeys', 'init'],
            data: {
              treeData: newDataList,
              expandedKeys: expandedKeys,
              defExpandedKeys: expandedKeys,
              selectedKeys: selectedKeys,
              init: true,
            },
          })
          stateInit.defExpandedKeys = expandedKeys
          // 默认刷新右侧
          updateRightShow({ treeNode: '1_0' })
        }
      }
    })
  }

  /**
   * 查询组织架构子级
   */
  const queryTreeChild = (treeNode: any, resolve?: () => void) => {
    const { treeData } = orgState
    const treeInfo: any = getTreeParam(treeNode.key)
    const param: any = {
      folderId: treeInfo.curId,
      userId: $store.getState().nowUserId,
      keyword: '',
    }
    getPlanListNew(param).then((res: any) => {
      if (!isUnmounted) {
        if (res.success) {
          const dataList = res.dataList || []
          console.log(dataList)

          const newDataList = renderTreeData(
            {
              array: dataList,
              idKey: 'id',
              nameKey: 'name',
              id: treeInfo.curId,
              name: treeInfo.curName,
              type: treeInfo.curType,
            },
            {
              fromType: 'taskManage',
              isCount: true, //显示统计
              // parentOrder: treeNode.order,

              parent: {
                id: treeInfo.curId,
                name: treeInfo.curName,
                type: treeInfo.curType,
              },
              refreshTree,
              updateRightShow,
            }
          )
          treeMapData[treeNode.key].children = dataList
          const newData = setTreeChild(treeData, treeNode.key, newDataList)
          if (!stateInit.loadedKeys.includes(treeNode.key)) {
            stateInit.loadedKeys.push(treeNode.key)
          }

          dispatch({
            type: ['treeData', 'loadedKeys'],
            data: { treeData: newData, loadedKeys: [...stateInit.loadedKeys] },
          })
          if (resolve) {
            resolve()
          }
        }
      }
    })
  }
  // *********************树形组织架构事件方法*********************//
  // 点击展开按钮加载子节点时
  const onLoadData = (treeNode: any): Promise<void> => {
    return new Promise(resolve => {
      if (treeNode.children && treeNode.children.length > 0) {
        resolve()
        return
      }
      queryTreeChild(treeNode, resolve)
    })
  }

  /**
   * 选中树节点时
   */
  const onSelect = (
    selectedKeys: any,
    e: { selected: boolean; selectedNodes?: any; node: any; nativeEvent?: any }
  ): Promise<void> => {
    if ($(e.nativeEvent.target).hasClass('planTreeNameInp') && $(e.nativeEvent.target).is(':visible')) {
      return new Promise(resolve => {
        resolve()
      })
    }
    return new Promise(() => {
      if (e.selected) {
        dispatch({
          type: ['selectedKeys'],
          data: { selectedKeys: selectedKeys },
        })
      }

      updateRightShow({ treeNode: e.node.key })
    })
  }
  /**
   * 点击组织架构展开节点
   * @param checkedKeys
   * @param e
   * @param attachInfo
   */
  const onExpand = (expandedKeys: any) => {
    const getExpandedKeys = expandedKeys
    dispatch({
      type: ['expandedKeys'],
      data: {
        expandedKeys: getExpandedKeys,
      },
    })
  }
  // *********************其他事件方法*********************//

  /**
   * 刷新列表
   * taskIds:查询多个任务的id数组
   * optType:操作类型
   * childLevel:是否是子级任务
   */
  const refreshTree = async ({
    taskIds,
    optType,
    parentIdNodeKey,
    newChild,
    childId,
    isMind,
    type,
    nowKey,
  }: {
    rowData?: any
    taskIds: any
    optType?: string
    childLevel?: any
    parentId?: string //新增子任务时需要父任务id
    parentIdNodeKey?: string //新增子任务时需要父任务节点key
    newChild?: any
    childId?: any
    isMind?: boolean //当前是脑图操作
    type?: any //文件夹还是规划类型 1文件夹 0规划
    nowKey?: string
  }) => {
    // const queryIdType = "id"
    const { nowUserId } = $store.getState()
    // 是否全局刷新（没有局部刷新效果）
    let isDef = false
    const tableList = stateInit.treeData
    const paramObj: any = {
      dataList: tableList,
      taskIds: taskIds,
      finded: 0, //已匹配到的数量，用于暂停递归
      optType: optType,
    }
    const expandedRows = stateInit.expandedKeys
    // 需要查询的任务id列表
    // let taskIdList: any = taskIds || [nowTask[queryIdType]]
    let taskIdList: any = taskIds
    let nowTaskInfo: any = { item: null }
    // 当前操作类型
    let nowType: any = type
    let selectedKeys: any = stateInit.selectedKeys || []
    let loadedKeys: any = stateInit.loadedKeys || []
    // 当前最新子数据
    let _newChild = newChild || null
    // 当前选择数据
    let newSelect: any = treeMapData[stateInit.selectedKeys[0]]
    // 是否属于新增规划
    let toNewAddMind = false

    switch (optType) {
      // 移动
      case 'move':
        // 先删除当前当前项
        nowTaskInfo = { item: null }
        findNowTask({
          dataList: tableList,
          findId: taskIds[0],
          taskInfo: nowTaskInfo,
          optType: optType,
          nowUserId,
          initDataList: tableList,
        })
        // 缓存旧父ID
        const _oldParentNodeKey = `1_${nowTaskInfo.item.parentFolderId || 0}`
        // 获取当前移动项的最新数据替换
        const _dataList = await queryNewData({ ids: taskIds, type: nowType })
        if (!isUnmounted) return
        _newChild = _dataList[0]

        // 把当前拖动子集push
        // 已经展开是直接添加子集进去
        if (expandedRows.includes(parentIdNodeKey)) {
          const _newChildKey = `${_newChild.type}_${_newChild.id}`
          // 拖动数据源当前是文件夹且是展开状态，清除展开状态
          if (expandedRows.includes(_newChildKey)) {
            expandedRows.splice(expandedRows.indexOf(_newChildKey), 1)
          }
          // if (loadedKeys.includes(_newChildKey)) {
          //   loadedKeys.splice(loadedKeys.indexOf(_newChildKey), 1)
          // }

          // console.log(expandedRows)
          const newChildArr = [_newChild || {}]
          const newChilds = renderTreeData(
            {
              array: newChildArr,
              idKey: 'id',
              nameKey: 'name',
            },
            {
              refreshTree,
              updateRightShow,
            }
          )
          paramObj.newChild = newChilds[0]
        }
        loadedKeys = []

        nowType = 1
        //同时刷新多个父级
        taskIdList = [getTreeParam(parentIdNodeKey).curId, getTreeParam(_oldParentNodeKey).curId]
        break
      // 新增子级
      case 'addChildFolder':
      case 'addChildPlan':
        if (optType == 'addChildPlan') {
          toNewAddMind = true
        }
        // 如果没有传递新数据，则查询创建的最新数据
        if (childId) {
          const _dataList = await queryNewData({ ids: [childId], type: nowType })
          if (!isUnmounted) return
          _newChild = _dataList[0]
        }
        // 已经展开时直接添加子集进去
        if (expandedRows.includes(parentIdNodeKey)) {
          // 当前选择项，只有脑图规划才需要选择，其他默认选中之前记录
          selectedKeys = nowType == 0 ? [_newChild.key || `0_${_newChild.id}`] : selectedKeys

          const newChildArr = [_newChild || {}]
          const newChilds = renderTreeData(
            {
              array: newChildArr,
              idKey: 'id',
              nameKey: 'name',
            },
            {
              refreshTree,
              updateRightShow,
            }
          )
          paramObj.newChild = newChilds[0]
        }
        // 当前选择项，只有脑图规划才需要选择，其他默认选中之前记录
        selectedKeys = nowType == 0 ? [_newChild.key || `0_${_newChild.id}`] : selectedKeys
        newSelect = _newChild

        // 更新父数据所需type
        nowType = 1

        break

      case 'del': //删除文件、规划
        nowTaskInfo = { item: null }
        // 如果当前删除了唯一的数据
        if (tableList[0].children.length == 1) {
          // taskIdList = []
          tableList[0].children = []
          selectedKeys = ['1_0']
          queryTreeFirst({
            selectedKeys,
          })
          return
        } else {
          findNowTask({
            dataList: tableList,
            findId: taskIds[0],
            taskInfo: nowTaskInfo,
            optType: optType,
            nowUserId,
            initDataList: tableList,
          })
        }
        const _parentId: any = String(nowTaskInfo.item.parentFolderId || 0)

        // 没有找到可删除任务则无需刷新
        if (nowTaskInfo.isDel && nowTaskInfo.item) {
          // map表中清除被删除任务
          treeMapData[nowTaskInfo.item['key']] = {}
          //满足删除条件，则查询并更新父任务
          taskIdList = _parentId ? [_parentId] : []

          // 删除了当前选中数据，则选中兄弟节点或根节点
          if (nowTaskInfo.item.key == stateInit.selectedKeys[0]) {
            const _nowSelectKey = _parentId == 0 ? '1_0' : `1_${_parentId}`
            newSelect =
              treeMapData[_nowSelectKey].children && treeMapData[_nowSelectKey].children.length > 0
                ? treeMapData[_nowSelectKey].children[0]
                : treeMapData[_nowSelectKey]
                ? treeMapData[_nowSelectKey]
                : tableList[0]
            dispatch({
              type: ['selectedKeys', 'treeData'],
              data: { selectedKeys: [newSelect.key], treeData: [...tableList] },
            })
            selectedKeys = [_nowSelectKey]
            // isDef = true
          }

          // 删除 文件、规划 父级应始终是文件夹
          nowType = 1
        } else {
          taskIdList = []
        }
        // updateRightShow({ treeNode: newSelect.key })

        break
      case 'reName': //重命名
      case 'isTop': //置顶
      case 'cancelTop': //取消置顶
        taskIdList = taskIds
        loadedKeys = []
        break
      case 'all': //全局刷新
        isDef = true
        queryTreeFirst({
          selectedKeys,
        })
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
        type: ['treeData'],
        data: { treeData: [...tableList] },
      })
    } else {
      // 查询最新数据进行更新
      const _dataList = await queryNewData({ ids: [...taskIdList], type: nowType })
      if (!isUnmounted) return
      // console.log(treeMapData)
      // const parentOrder = parentIdNodeKey
      //   ? treeMapData[parentIdNodeKey].order
      //   : taskIdList && nowType
      //   ? treeMapData[`${nowType}_${taskIdList.join(',')}`].order
      //   : [0]

      // 判断当前操作项 修改顶层我的脑图数据
      if (optType == 'move' || optType == 'del' || optType == 'addChildFolder' || optType == 'addChildPlan') {
        const newMyMindItem = treeMapData['1_0']
        await getPlanListNew({
          keyword: '',
          userId: $store.getState().nowUserId,
          folderId: '',
        }).then((res: any) => {
          const { obj, data } = res
          newMyMindItem.folderCount = obj
          newMyMindItem.data = data
          _dataList.unshift(newMyMindItem)
        })
      }

      // 表格内容组装
      const newDatas = renderTreeData(
        {
          array: _dataList,
          idKey: 'id',
          nameKey: 'name',
        },
        {
          refreshTree,
          updateRightShow,
        }
      )

      paramObj.newDatas = newDatas

      replaceTask({ ...paramObj, taskIds: taskIdList })

      // console.log(treeMapData)
      // 添加子元素没有展开
      if (
        (optType == 'addChildFolder' || optType == 'addChildPlan' || optType == 'move') &&
        !expandedRows.includes(parentIdNodeKey)
      ) {
        expandedRows.push(parentIdNodeKey)
        expandNode({
          expanded: true,
          treeNode: treeMapData[parentIdNodeKey || 0],
          handExp: expandedRows,
          selectedKeys,
          // handerType: type,
          toNewAddMind,
        })
      } else {
        // console.log(treeMapData)
        dispatch({
          type: ['treeData', 'selectedKeys', 'expandedRows', 'loadedKeys'],
          data: {
            treeData: [...tableList],
            selectedKeys: [...selectedKeys],
            expandedRows,
            loadedKeys: [...loadedKeys],
          },
        })
      }
      // 刷新右侧文件列表内容（脑图中操作不需要）
      // 如果操作项非当前右侧展示数据(不需要刷新)
      // if (!isMind && nowKey) {
      if (!isMind) {
        updateRightShow({ treeNode: selectedKeys || newSelect.key, toNewAddMind })
      }
    }
  }

  /**
   * 点击展开图标时触发
   * @param expanded
   * @param treeNode
   * handExp:手动控制展开
   */
  const expandNode = ({
    expanded,
    treeNode,
    handExp,
    selectedKeys = [],
    // handerType,
    toNewAddMind = false,
  }: {
    expanded: any
    treeNode: any
    handExp?: any
    selectedKeys?: any[]
    // handerType?: number //1 文件 0 规划
    toNewAddMind?: boolean //是否新建规划
  }) => {
    const children = treeNode.children || []
    if (!expanded || children.length > 0) {
      return
    }
    const treeData = stateInit.treeData
    getPlanListNew({
      keyword: '',
      userId: $store.getState().nowUserId,
      folderId: treeNode.id,
    }).then((res: any) => {
      if (!isUnmounted) {
        const dataList = res.dataList || []
        const newDataList = renderTreeData(
          {
            array: dataList,
            idKey: 'id',
            nameKey: 'name',
            id: treeNode.curId,
            name: treeNode.curName,
            type: treeNode.curType,
          },
          {
            fromType: 'taskManage',
            isCount: true, //显示统计
            // parentOrder: treeNode.order,

            parent: {
              id: treeNode.curId,
              name: treeNode.curName,
              type: treeNode.curType,
            },
            refreshTree,
            updateRightShow,
          }
        )
        treeMapData[treeNode.key].children = dataList
        const newData = setTreeChild(treeData, treeNode.key, newDataList)
        // 手动控制展开
        if (handExp) {
          dispatch({
            type: ['treeData', 'expandedKeys', 'selectedKeys', 'loadedKeys'],
            data: {
              treeData: [...newData],
              expandedKeys: handExp,
              selectedKeys,
              loadedKeys: [...stateInit.loadedKeys],
            },
          })
        } else {
          dispatch({
            type: ['treeData', 'selectedKeys', 'loadedKeys'],
            data: { treeData: [...newData], selectedKeys, loadedKeys: [...stateInit.loadedKeys] },
          })
        }
        //刷新右侧
        updateRightShow({
          treeNode: selectedKeys[0],
          toNewAddMind,
        })
      }
    })
  }

  //   **********************************组织架构拖动***************************//

  /**
   *
   * @param param0
   */
  /**
   * 拖动到组织架构操作处理
   */
  const dragTaskToOrg = ({ info }: any) => {
    // const canDrop = dragTaskToOrgCheck(info)
    // if (!canDrop) {
    //   return
    // }
    // const { node } = info
    // const toInfo = node
    // // const toOrg = getTreeParam(toInfo.key)
    // const fromRowData = taskRowDrag.rowData || {}
    // // const liableObj = fromRowData.liable || {}
    // setDragDiffModal({
    //   visible: true,
    //   dragTaskSure: () => {
    //     // moveToDirSave({param}).then(() => {
    //     //   // 拖动成功跳转到对应组织架构
    //     //   dispatch({
    //     //     type: ['selectedKeys'],
    //     //     data: { selectedKeys: [toInfo.key] },
    //     //   })
    //     // })
    //   },
    // })
    // $('#taskOrgTreeOut')
    //   .find('.drop-over-bg')
    //   .removeClass('drop-over-bg')
  }

  // **************************组织架构搜索************************//
  /**
   * 选中搜索项
   */
  const searchSelect = (paramObj: any) => {
    updateRightShow(paramObj)
    // 选中tree 组织架构
  }

  // 更新右侧内容展示
  const updateRightShow = (paramObj: {
    treeNode: string
    parentNameIds?: any
    from?: string
    toNewAddMind?: boolean
  }) => {
    const { from, treeNode, parentNameIds, toNewAddMind } = paramObj
    let treeInfo: any = {}
    let _parentNameIds: any = parentNameIds || []

    if (from == 'search') {
      treeInfo = getTreeParam(treeNode)
    } else {
      treeInfo = treeMapData[treeNode]
      _parentNameIds = treeInfo ? treeInfo.parentNameIds || [] : []
    }

    if (!treeInfo) return

    const parentFolderId = _parentNameIds.map((item: any) => {
      return {
        id: item[0],
        name: item[1],
        type: 1,
      }
    })
    // if (parentFolderId.length != 0) {
    parentFolderId.unshift({ id: 0, name: '我的脑图', type: 1 })
    // }

    // 规划列表/脑图显示
    planRightShow({
      showType: treeInfo.curType || treeInfo.type ? 1 : 2,
      mainId: treeInfo.curId || treeInfo.id,
      name: treeInfo.curName || treeInfo.name,
      parentFolderId: JSON.stringify(parentFolderId),
      toNewAddMind,
    })
  }

  // tree 右键事件处理
  // const onRightClick = async ({ event, node }: any) => {
  //   console.log(event)
  //   console.log(node)
  //   if (node.id == 0) return
  //   const moreMenuData = getRightClickData({ type: node.type, id: node.id })
  //   // return moreMenuData
  //   node.contextMenuVisible = true
  //   console.log(node)
  //   // 替换数据
  //   replaceTask({ dataList: stateInit.treeData, newDatas: node, finded: 0, taskIds: [node.id] })

  //   dispatch({
  //     type: ['treeData'],
  //     data: { treeData: [...stateInit.treeData] },
  //   })
  // }

  return (
    <DndProvider backend={HTML5Backend}>
      {/* <Spin spinning={orgLoading}> */}
      {/* 组织架构宽模式 */}
      <div className={`pageLeftCon flex-1 flex column overflow_hidden clac100 width_model`}>
        <div className="pageLeftListContainer">
          <div className="leftListContaier">
            <Input
              readOnly
              placeholder="搜索脑图/文件夹"
              className="plan_menu_search false_input  baseInput radius16 border0 bg_gray"
              suffix={
                <em
                  className="search-icon-t-btn"
                  onClick={() => {
                    showSearchFn(1)
                  }}
                ></em>
              }
              onClick={() => {
                showSearchFn(1)
              }}
            />
            <div className={`orgBotScroll calcHeight flex-1 flex column`}>
              <div className="leftOrgTree flex-1" id="taskOrgTreeOut">
                {orgState.init ? (
                  <Tree
                    // defaultExpandedKeys={orgState.defExpandedKeys}
                    blockNode={true}
                    treeData={orgState.treeData}
                    loadData={onLoadData}
                    loadedKeys={orgState.loadedKeys}
                    onSelect={onSelect}
                    selectedKeys={orgState.selectedKeys}
                    onExpand={onExpand}
                    expandedKeys={orgState.expandedKeys}
                    // draggable
                    // onDrop={onDrop}
                    // onDragEnter={onDragEnter}
                    // onDragEnd={onDragEnd}
                    // onDragOver={onDragOver}
                    // onLoad={onLoad}
                    className="baseOrgTree switch_null plan-list-org"
                    switcherIcon={<CaretDownOutlined />}
                    // onRightClick={onRightClick}
                  />
                ) : (
                  ''
                )}
              </div>
            </div>
          </div>
          <div className={`searchContainer`}>
            <span className="search-title">
              <em
                className="go-back-icon"
                onClick={() => {
                  showSearchFn()
                  // 初始搜索数据
                  inputRef.current.state.value = ''
                  dispatch({ type: ['orgSearch'], data: { orgSearch: '' } })
                  //激活右侧选择显示内容
                  updateRightShow({ treeNode: stateInit.selectedKeys[0] })
                }}
              ></em>
              搜索文件夹/脑图
            </span>
            <Input
              id="search_ipt"
              allowClear
              ref={inputRef}
              defaultValue=""
              placeholder="搜索脑图/文件夹"
              className="plan_menu_search  baseInput radius16 border0 bg_gray"
              suffix={
                <span className="search-icon-t-box">
                  <em
                    className="search-icon-t-btn"
                    onClick={() => {
                      const inputValue = inputRef.current.state.value || ''
                      dispatch({ type: ['orgSearch'], data: { orgSearch: inputValue } })
                    }}
                  ></em>
                </span>
              }
              onPressEnter={(e: any) => {
                dispatch({ type: ['orgSearch'], data: { orgSearch: e.target.value } })
              }}
            />

            {/* 搜索列表 */}
            <div className={`orgSearchList flex-1 ${orgState.orgSearch == '' ? 'forcedHide' : ''}`}>
              <OrgSearchList
                param={{ allCompanyIds: orgState.allCompanyIds, allCompany: orgState.allCompany }}
                searchVal={orgState.orgSearch}
                searchSelect={searchSelect}
              />
            </div>
          </div>
        </div>

        {/* 拖动到组织架构二次提醒弹框 */}
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
          <p className="msg_tit">确定移动此任务？</p>
        </Modal>
      </div>
      {/* </Spin> */}
    </DndProvider>
  )
})

// =================组织架构搜索=============//
/**
 * 任务搜索列表
 */
const OrgSearchList = (props: any) => {
  // const getParam = props.param || {}
  const [searchList, setSearchList] = useState<any>([])
  // 选中效果
  const [searchActive, setSearchActive] = useState<number>(-1)
  useEffect(() => {
    if (props.searchVal !== '') {
      setSearchActive(-1)
      querySearchList()
    }
  }, [props.searchVal])
  const querySearchList = () => {
    const param = {
      keyword: props.searchVal,
      userId: $store.getState().nowUserId,
      folderId: '',
    }
    getPlanListNew(param).then((res: any) => {
      if (res.success) {
        setSearchList(res.dataList || [])
      }
    })
  }
  return (
    <ul className="search-box">
      <li className="number-tip">共{searchList.length}条搜索结果</li>
      {searchList &&
        searchList.map((item: any, i: number) => {
          const showTxt = item.name
          const thisNodeId = `${item.type}_${item.id}_${item.name}`
          let pathText = '我的脑图'
          if (item.parentNameIds) {
            item.parentNameIds?.forEach((item: any) => {
              pathText += `>${item[1]}`
            })
          }

          return (
            <Tooltip key={i} placement="top" title={showTxt}>
              <li
                className={`search-item flex center-v ${searchActive == i ? 'active' : ''}`}
                key={i}
                onClick={() => {
                  setSearchActive(i)
                  props.searchSelect({
                    treeNode: thisNodeId,
                    parentNameIds: item.parentNameIds,
                    from: 'search',
                  })
                }}
              >
                {getLogoIcon(item.type)}
                <div className="right-box flex-1 ">
                  <div
                    className="my_ellipsis text"
                    dangerouslySetInnerHTML={{
                      __html: showTxt.replace(
                        props.searchVal,
                        `<span class="blod_blue">${props.searchVal}</span>`
                      ),
                    }}
                  ></div>
                  <div className="type">{pathText}</div>
                </div>
              </li>
            </Tooltip>
          )
        })}
      {searchList.length === 0 && (
        <NoneData
          imgSrc={$tools.asAssetsPath(`/images/noData/no_search.png`)}
          showTxt="你搜索到一处未知的领域"
          imgStyle={{ width: 70, height: 66 }}
          containerStyle={{ marginTop: 200 }}
        />
      )}
    </ul>
  )
}

/**
 * 组织架构单行节点渲染
 */
const OrgRow = (props: {
  param: {
    showName: string
    type: number
    person: number
    isCount?: boolean
    // stareBtn: any
    switchIcon: any
    rowData: any
    refreshTree: (param: any) => void
    updateRightShow: (param: any) => void
  }
}) => {
  const { showName, type, person, switchIcon, rowData, refreshTree, updateRightShow } = props.param
  const droperRef: any = useRef(null)
  const iptRef: any = useRef(null)
  const [state, setState] = useState<any>({
    iptShow: false,
    visible: false, //更多 操作项
    contextMenuVisible: false, //右键 操作项
    moreMenuData: [],
  })
  // 绑定拖动放置
  let targetNode: any = null
  // 创建按钮
  let handlerAddNewDropdown: any = ''

  // 当前层级
  const _levelNum = rowData.parentNameIds ? rowData.parentNameIds.length : 0

  const menuObj = {
    from: 'leftTree',
    setNameInpShow: () => {
      setState({ ...state, iptShow: true, visible: false, contextMenuVisible: false })
    },
    refreshLeftTree: (param: any) => {
      refreshTree({ ...param, nowKey: rowData.key })
      // 关闭操作组显示
      setState({ ...state, visible: false, contextMenuVisible: false })
    },
  }

  //规划
  const moreMenu: any = PlanMenu({ itemData: rowData }, menuObj, state.moreMenuData)
  // 置顶标识
  const isTop = rowData.topId ? (
    <em className="topedTriangle" style={{ left: -(59 + 24 * _levelNum) }}></em>
  ) : (
    ''
  )
  // 更多按钮
  const handleMoreBtn =
    rowData.id != 0 ? (
      <Dropdown
        overlay={moreMenu}
        trigger={['click']}
        placement="bottomRight"
        visible={state.visible}
        onVisibleChange={async visible => {
          if (state.contextMenuVisible) return
          let moreMenuData: any = []
          if (visible) {
            // 请求更多按钮操作项
            moreMenuData = await getRightClickData({ type: rowData.type, id: rowData.id })
          }
          setState({ ...state, visible, moreMenuData })
        }}
      >
        <span
          className="img_icon handle_more_icon"
          onClick={e => {
            e.stopPropagation()
          }}
        ></span>
      </Dropdown>
    ) : (
      ''
    )
  if (type == 1) {
    const addNewBtnItem = (
      <Menu
        className="myDropMenu newPlanBtnMenu"
        onClick={(menuProp: any) => {
          menuProp.domEvent.stopPropagation()
          menuClick(menuProp, {
            itemData: rowData,
            refreshTree,
            updateRightShow,
          })
        }}
      >
        <Menu.Item key={0}>
          <div className="myMenuItem">
            {getLogoIcon(type)}
            新建脑图
          </div>
        </Menu.Item>
        <Menu.Item key={1}>
          <div className="myMenuItem">
            {getLogoIcon(type)}
            新建文件夹
          </div>
        </Menu.Item>
      </Menu>
    )
    // 新建文件夹+ 规划
    handlerAddNewDropdown = (
      <Dropdown overlay={addNewBtnItem} trigger={['click']} placement="bottomRight">
        <span
          className="img_icon create_plan_icon"
          data-id={`${type}_${rowData.id}`}
          onClick={(e: any) => {
            e.stopPropagation()
          }}
        ></span>
      </Dropdown>
    )
  }

  // ==================拖动排序====================//
  /**
   * 放置
   */
  // const [{ isOver, dropClassName }, droper] = useDrop({
  const [, droper] = useDrop({
    accept: ['orgDragOrder', 'dragBodyRow'],
    collect: monitor => {
      const dragType = monitor.getItemType()

      const dropClassName: any = ''
      let isOver = monitor.isOver()
      if (dragType == 'orgDragOrder' && rowData.type == 0) {
        isOver = false
      }
      return {
        isOver,
        dropClassName,
      }
    },
    canDrop: (dragItem: any) => {
      let drop = true
      if (dragItem.type == 'orgDragOrder' && rowData.type == 0) {
        drop = false
      }
      return drop
    },
    hover: (dragItem: any) => {
      // console.log('org hover')
      // 目标节点
      targetNode = droperRef.current

      dragTaskToOrgCheck({
        targetNode,
        node: { ...rowData },
      })
    },
    drop: (dragItem: any) => {
      // console.log('org drop')
      $('#taskOrgTreeOut')
        .find('.drop-over-bg')
        .removeClass('drop-over-bg')
      // 列表文件、规划拖动排序
      if (dragItem.type == 'orgDragOrder') {
        onDrop({
          node: { ...rowData },
          dragNode: { ...dragItem.rowData },
          refreshTree: (param: any) => {
            refreshTree(param)
          },
          droperRef,
        })
      } else {
        dragTaskToOrgExp({
          info: {
            node: { ...rowData },
            targetNode,
          },
        })
      }
    },
  })
  /**
   * 拖动
   */
  const [, drager] = useDrag({
    item: { type: 'orgDragOrder', rowData: rowData, sourceNode: droperRef },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      let drag = true
      if (rowData.id == 0) {
        drag = false
      }
      // 文本输入框存在时设置不可拖动，防止无法选中文本 bug:15968
      if (
        $(droperRef.current)
          .find('.planTreeNameInp')
          .is(':visible')
      ) {
        drag = false
      }
      return drag
    },
    begin: () => {
      $(droperRef.current)
        .parents('.ant-tree-treenode')
        .addClass('drag_hover')
    },
    end: () => {
      $(droperRef.current)
        .parents('.ant-tree-treenode')
        .removeClass('drag_hover')
    },
  })

  drager(droper(droperRef))
  // 绑定拖动放置

  // 重命名
  const reNameFn = () => {
    const _iptVal = iptRef.current.state.value
    // 重命名
    resetNameReq(showName, { id: rowData.id, name: _iptVal }, type, (param: any) => {
      const { isUpdate } = param
      setState({ ...state, iptShow: false, visible: false, contextMenuVisible: false })

      if (!isUpdate) return
      rowData.name = _iptVal

      // 刷新map数据
      refreshTree({ optType: 'reName', taskIds: [rowData.id], type: rowData.type, nowKey: rowData.key })
    })
  }
  return (
    <Dropdown
      overlay={moreMenu}
      trigger={['contextMenu']}
      placement="bottomRight"
      visible={state.contextMenuVisible}
      onVisibleChange={async visible => {
        if (rowData.id == 0 || state.visible) return
        let moreMenuData: any = []
        if (visible) {
          // 请求更多按钮操作项数据
          moreMenuData = await getRightClickData({ type: rowData.type, id: rowData.id })
        }
        setState({ ...state, contextMenuVisible: visible, moreMenuData })
      }}
    >
      <span ref={droperRef} className={`org_tree_row flex center-v between`}>
        {!state.iptShow ? (
          <>
            <span
              className="row_left flex center-v"
              style={{
                width: `${280 - (_levelNum + 2) * 24 - 46}px`,
              }}
            >
              {/* 置顶 */}
              {isTop}
              {/* 数据类型 、文件夹、计划、任务 */}
              {getLogoIcon(rowData.id == 0 ? -1 : type)}

              <Tooltip placement="top" title={showName} mouseLeaveDelay={0}>
                <span
                  className={`org_tree_text my_ellipsis flex-1 ${rowData.id == 0 ? 'my-mind-title' : ''} ${
                    showName ? '' : 'no_name'
                  }`}
                >
                  {showName || '未命名'}
                </span>
              </Tooltip>

              <span className={`org_tree_count_text flex_shrink_0`}>
                {rowData.id == 0 ? '(' + person + ')' : ''}
              </span>
            </span>
            <span className="row_right flex">
              {handlerAddNewDropdown}
              {handleMoreBtn}
              {/* {stareBtn} */}
              {switchIcon}
            </span>
          </>
        ) : (
          <Input
            className="planTreeNameInp"
            autoFocus
            ref={iptRef}
            defaultValue={showName}
            maxLength={50}
            onPressEnter={(e: any) => {
              reNameFn()
            }}
            onBlur={(e: any) => {
              e.stopPropagation()
              reNameFn()
            }}
            onMouseUp={(e: any) => {
              e.stopPropagation()
            }}
          ></Input>
        )}
      </span>
      {/* <div className={`tree_drop_indicator  ${isOver ? dropClassName : ''}`}></div> */}
    </Dropdown>
  )
}

// 新建 规划、wenjian
const menuClick = (menuProps: any, data: any) => {
  const { key } = menuProps
  const { itemData, refreshTree } = data
  const e = $(`span[data-id=${itemData.type}_${itemData.id}]`)

  key == 1
    ? addchildrenFolder(e, itemData, refreshTree)
    : createMindMap({ folderId: itemData.id == 0 ? '' : itemData.id, name: '' }).then(async (mainId: any) => {
        // 查询最新数据
        let newChild = {}
        await queryPlanDataNew({ ids: mainId }).then((res: any) => {
          newChild = res.dataList[0]
        })

        // 刷新左侧
        refreshTree({
          optType: 'addChildPlan',
          taskIds: [itemData.id || 0],
          childLevel: true,
          type: Number(key),
          parentId: itemData.id || 0,
          parentIdNodeKey: `1_${itemData.id || 0}`,
          newChild,
        })
      })
}

//修改文件名
const resetNameReq = (oldName: string, param: any, type: number, callBacks: (param: any) => void) => {
  if (oldName == param.name) return callBacks({ isUpdate: false })
  if (type == 1) {
    modifyFolderNameNew(param).then((res: any) => {
      if (res.returnCode == 0) {
        // 1.更新map表
        callBacks({ isUpdate: true })
      }
    })
  } else {
    modifyPlanNameNew(param).then((res: any) => {
      if (res.returnCode == 0) {
        // 1.更新map表
        callBacks({ isUpdate: true })
      }
    })
  }
}

/**
 * 从数据中递归查询当前任务
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
    if (findId == item['id']) {
      taskInfo.item = item

      // 1删除
      if (optType == 'del' || optType == 'move') {
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
  parentData?: any
}) => {
  // 当前查询的id还是typeId/key
  const queryIdType = 'id'
  const taskIds = paramObj.taskIds.map(Number)
  const newDatas = paramObj.newDatas || []
  let finded = paramObj.finded || 0
  const optType = paramObj.optType
  for (let i = 0; i < paramObj.dataList.length; i++) {
    const item = paramObj.dataList[i]
    if (taskIds.includes(Number(item[queryIdType]))) {
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
      treeMapData[findItem['key']] = { ...paramObj.dataList[i] }
      // 新增子任务
      if (
        (optType == 'addChildFolder' || optType == 'addChildPlan' || optType == 'move') &&
        paramObj.newChild &&
        paramObj.newChild.parentFolderId == item[queryIdType]
      ) {
        if (!paramObj.dataList[i].children) {
          paramObj.dataList[i].children = []
        }
        paramObj.dataList[i].children.push(paramObj.newChild)
        const newChildArr: any[] = sortTreeData({
          sortData: paramObj.dataList[i].children,
          sortKey: 'createTimeStamp',
          sortRule: 1,
        })
        paramObj.dataList[i].children.splice(0, paramObj.dataList[i].children.length, ...newChildArr)
      }

      // 置顶
      if (
        (optType == 'isTop' || optType == 'cancelTop') &&
        paramObj.parentData &&
        paramObj.parentData.children.length > 0
      ) {
        if (optType == 'isTop') {
          paramObj.parentData.children.splice(i, 1)
          let _index = 0
          if (item.type == 0) {
            _index = paramObj.parentData.folderCount
          }
          paramObj.parentData.children.splice(_index, 0, paramObj.newDatas[0])
        } else if (optType == 'cancelTop') {
          const newChildArr: any[] = sortTreeData({
            sortData: paramObj.parentData.children,
            sortKey: 'createTimeStamp',
            sortRule: 1,
            updateChildData: paramObj.newDatas[0],
          })
          paramObj.parentData.children.splice(0, paramObj.parentData.children.length, ...newChildArr)
        }
      }

      // 更新map表
      treeMapData[findItem['key']] = { ...paramObj.dataList[i] }
      finded++
    }
    // 匹配完毕即停止递归遍历
    if (finded < taskIds.length && item.children && item.children.length > 0) {
      replaceTask({
        ...paramObj,
        dataList: item.children,
        finded,
        parentData: item,
      })
    }
  }
}

// 排序重组 根据 未置项 、创建时间 重新排序
const sortTreeData = ({ sortData, sortKey, sortRule, updateChildData }: any) => {
  // 过滤置顶项、非置顶项
  const isTopFileArr: any[] = []
  const noTopFileArr: any[] = []
  const isTopPlanArr: any[] = []
  const noTopPlanArr: any[] = []
  sortData.forEach((item: any) => {
    const _itemData = updateChildData ? (item.id == updateChildData.id ? updateChildData : item) : item
    if (_itemData.type == 1) {
      // 文件夹
      if (_itemData.topId) {
        isTopFileArr.push(_itemData)
      } else {
        noTopFileArr.push(_itemData)
      }
    } else {
      // 规划
      if (_itemData.topId) {
        // 置顶数据
        isTopPlanArr.push(_itemData)
      } else {
        // 非置顶数据
        noTopPlanArr.push(_itemData)
      }
    }
  })
  noTopFileArr.sort(compareSort({ property: sortKey, type: sortRule || 1 }))
  noTopPlanArr.sort(compareSort({ property: sortKey, type: sortRule || 1 }))
  const newChildArr = isTopFileArr.concat(noTopFileArr, isTopPlanArr, noTopPlanArr)
  return newChildArr
}

/**
 * 组织架构树更改数据为Tree可渲染数据格式
 * 有些接口中返回的id是rid，所以定义一个idKey nameKey便于不同键名的值的获取
 * @param  data
 * data{
 * idKey:key值键名，
 * nameKey：name值键名，
 * }
 * teamObj:企业数据
 */
const renderTreeData = (
  data: any,
  attachInfo: {
    refreshTree: (param: any) => void
    updateRightShow: (param: any) => void
    teamObj?: { teamId?: any; teamName?: any }
    fromType?: string
    isCount?: boolean
    setExpandedKeys?: (param: string) => void
    expandedKeys?: any
    parent?: any //父级链条信息
    setOpencreattask?: any
    // parentOrder?: any
  }
) => {
  const { refreshTree, updateRightShow } = attachInfo
  // 展开的节点
  // const expandedKeys = attachInfo.expandedKeys || []
  // if (data.array && data.array.length > 0) {
  return data.array.map((item: any) => {
    const thisId = item[data.idKey]
    const thisName = item[data.nameKey]

    // const typeName = ''
    const showName = thisName
    let thisNodeId = ''
    // 名字左侧的图标
    let nameLeftIcon: any
    //父级链条信息
    const preParent: any = attachInfo.parent ? attachInfo.parent : null
    // if (item.type == 0) {
    //     typeName = 'plan_'
    //     showName = `${item.name}`
    // } else if (item.type == 1) {
    //     typeName = 'file_'
    // } else {
    //     typeName = 'duties_'
    // }
    // 上一层data中id为本层的父级id
    thisNodeId = `${item.type}_${item.id}`
    // 企业级是否有下一层数据
    let switchIcon: any

    const thisText = (
      <OrgRow
        param={{
          showName: showName,
          type: item.type,
          // person: item.person,
          person: item.data,
          isCount: attachInfo.isCount || false,
          switchIcon,
          rowData: item,
          refreshTree,
          updateRightShow,
        }}
      />
    )

    //   1 设置key值和显示内容
    item.key = thisNodeId
    // 排序字段
    // item.order = parentOrder != undefined ? parentOrder + '-' + i : i + ''

    item.parentId = item.id == 0 ? '' : item.parentId || '0'
    // 存储组织架构树map表
    treeMapData[item.key] = { ...item }
    //2 设置父级链信息
    const thisInfo = {
      id: item.id,
      name: item.name,
      type: item.type,
    }
    let parent: any = {}
    if (item.type != 2) {
      // 设置当前节点的父级链（上级封装完成传来的即为本级父级链）
      item.parent = preParent
      // 传递给子级新的父级链
      parent = { ...thisInfo, parent: preParent }
    } else {
      // 企业是最高级，不设置当前父级链，只传递给子级新的父级链
      parent = thisInfo
    }
    //  ======更新附属信息============//
    const attachObj = {
      ...attachInfo,
      parent: parent,
      // parentOrder: item.order,
    }

    if ((item.children && item.children.length > 0) || item.folderCount || item.planCount || item.data) {
      item.switcherIcon = nameLeftIcon
      item.isLeaf = false
      item.children = item.children || []
      const newItem = {
        ...item,
        title: thisText,
        children: renderTreeData(
          {
            array: item.children,
            idKey: data.idKey,
            nameKey: data.nameKey,
            id: thisId,
            name: thisName,
            type: item.type,
          },
          attachObj
        ),
      }
      return newItem
    } else {
      const nameLeftIcon = <span className="img_icon nameLeftIcon null"></span>
      item.switcherIcon = nameLeftIcon
      item.isLeaf = true
      return {
        ...item,
        title: thisText,
      }
    }
  })
  // }
}

/**
 * 获取当前企业或部门信息
 * nodeInfo 树结构组装数据
 */
const getTreeParam = (nodeInfo: any, parentChain?: any) => {
  /**
   * getType: 保存当前选中类型 (1我的脑图/文件 0规划)
   * curType：保存当前选中类型(1我的脑图/文件 0规划)
   * curId:当前选中id
   * curName:当前选中名字
   * parentType：保存上级type
   * parentId:保存上级id
   * parentName:保存上级名字
   */
  let curType = 0
  let curId: string | number = ''
  let curName = ''
  let parentNodeKey = ''
  let curParentChain: any = ''

  const params: any = nodeInfo
  if (params) {
    const _Param = params.split('_')
    curType = Number(_Param[0])
    curId = Number(_Param[1])
    curName = _Param[2]
    parentNodeKey = _Param[3]
  }
  if (parentChain) {
    curParentChain = parentChain
  }

  return {
    curId,
    curType,
    curName,
    parentNodeKey,
    curParentChain,
  }
}

/**
 * 拖动放置
 * @param info
 */
const onDrop = (info: any) => {
  // 2 组织机构排序拖动操作
  // const toInfo = treeMapData[info.node.key]
  // const fromInfo = treeMapData[info.dragNode.key]
  const toInfo = getTreeParam(info.node.key) //容器对象数据
  const fromInfo = getTreeParam(info.dragNode.key) //拖动对象数据
  // 阻断请求
  if (toInfo.curId == fromInfo.curId && toInfo.curType == fromInfo.curType) {
    return $(info.droperRef.current)
      .parents('.ant-tree-treenode')
      .removeClass('drag_hover')
  }
  const param = {
    id: String(toInfo.curId), //目标文件夹id
    type: Number(fromInfo.curType), //被移动对象类型
    typeId: String(fromInfo.curId), //被移动对象id
  }
  // 移动文件夹
  moveToDirSave(param, {
    optType: 'drag',
  }).then((res: any) => {
    // 刷新左侧
    if (res.success) {
      const reFreshParam = {
        optType: 'move',
        taskIds: [param.typeId],
        type: param.type,
        parentId: param.id,
        parentIdNodeKey: `1_${param.id}`,
      }
      info.refreshTree(reFreshParam)
    }
    // 移除拖动ui
    $(info.droperRef.current)
      .parents('.ant-tree-treenode')
      .removeClass('drag_hover')
  })
}
/**
 * 检测是否可拖动到组织架构当前节点
 */
const dragTaskToOrgCheck = (info: any) => {
  const { targetNode } = info
  // const toInfo = node
  const curNode = targetNode
  // const toOrg = getTreeParam(toInfo.key)

  // const fromRowData = taskRowDrag.rowData || {}
  // 被拖动任务归属信息
  // const fromInfo = $store.getState().taskManageTreeInfo
  // const attach = fromRowData.attach || { type: 0 }
  //  不可拖动的情况：我的任务查询的数据||跨企业||拖动到当前所在组织时不需要没有意义，故也限制
  $('#taskOrgTreeOut')
    .find('.drop-over-bg')
    .removeClass('drop-over-bg')
  $(curNode)
    .parents('.ant-tree-treenode')
    .addClass('drop-over-bg')
  return true
}

export { OrgSearchList }

//新增子文件
const addchildrenFolder = (e: any, rowData: any, callBacks: any) => {
  // const thisTr = jQuery(e.target).parents('.ant-tree-treenode')
  const thisTr = jQuery(e).parents('.ant-tree-treenode')
  const addTr = `<div class="ant-tree-treenode addChildFolderTr"  id="addChildFolderTr"><div class="taskNameTd">
                        <div class="cellCont">
                        <div class="boardTaskName">
                            <input  type="text" maxlength="50" class="addChildFolderInp"/>
                            <div class="create_task_btn_box">
                            <div
                            class="sure_create_btn"></div>
                            <div
                            class="cancel_create_btn"
                            ></div>
                        </div>
                        </div>
                    </div></div>`
  if (document.getElementById('addChildFolderTr')) {
    jQuery('#addChildFolderTr').remove()
  }
  thisTr.after(addTr)
  // 初始文件夹名
  const getInitName = folderInitName(treeMapData[rowData.key]['children'] || [])

  $('.addChildFolderInp')
    .focus()
    .val(getInitName)

  // 事件绑定
  jQuery('#addChildFolderTr')
    .find('.sure_create_btn')
    .off()
    .on('click', (e: any) => {
      const newName =
        jQuery(e.target)
          .parents('.taskNameTd')
          .find('.addChildFolderInp')
          .val() + ''

      const parentId = rowData.id == 0 ? undefined : rowData.id
      const parentType = rowData.type

      //加节点 添加子文件夹
      addFolderNew({
        name: newName,
        userId: $store.getState().nowUserId,
        parentId,
      }).then(async (res: any) => {
        const childId = res.data
        // 查询最新数据
        let newChild = {}
        await queryFolderDataNew({ ids: childId }).then((res: any) => {
          newChild = res.dataList[0]
        })

        const optType = parentType == 1 ? 'addChildFolder' : 'addChildPlan'

        //列表刷新
        callBacks({
          taskIds: [parentId || 0],
          childLevel: true,
          optType: optType,
          type: parentType,
          parentId: parentId || 0,
          parentIdNodeKey: `1_${parentId || 0}`,
          newChild,
        })
      })
      jQuery(e.target)
        .parents('.ant-tree-treenode')
        .remove()
    })
  jQuery('#addChildFolderTr')
    .find('.cancel_create_btn')
    .off()
    .on('click', (e: any) => {
      jQuery(e.target)
        .parents('.ant-tree-treenode')
        .remove()
    })
}

// 判断文件类型icon
const getLogoIcon = (type: number) => {
  // let iconUrl = ""
  let className = ''
  switch (Number(type)) {
    case -1:
      className = 'home_icon'
      // iconUrl = $tools.asAssetsPath('/images/workplan/plan_home_d.png')
      break
    case 1:
      className = 'file_icon'
      // iconUrl = $tools.asAssetsPath('/images/workplan/file_icon.png')
      break
    case 0:
      className = 'plan_icon'
      // iconUrl = $tools.asAssetsPath('/images/workplan/plan_icon.png')
      break
    default:
      break
  }
  return <em className={`type-icon ${className}`}></em>
}

// 控制搜索组件显示
const showSearchFn = (type?: number) => {
  if (type) {
    $('.pageLeftListContainer')
      .animate({ left: '-280px' }, 500)
      .find('#search_ipt')
      .focus()
  } else {
    $('.pageLeftListContainer').animate({ left: 0 }, 500)
  }
}
// 根据id获取最新数据  type: 1文件 0规划
const queryNewData = async ({ ids, type }: { ids: number[]; type: number }) => {
  if (ids.map(Number).includes(0)) {
    ids.splice(ids.indexOf(0), 1)
  }
  const param = {
    ids: ids.join(','),
  }

  if (!param.ids || param.ids == '0') return []
  let dataList: any = null
  type
    ? await queryFolderDataNew(param).then(async (res: any) => {
        dataList = res.dataList
      })
    : await queryPlanDataNew(param).then((res: any) => {
        dataList = res.dataList
      })
  return dataList
}
// 解析字符串，获取父数据
// const getParentChainFn = (parentIdKey: string) => {
//   const chain: any[] = []
//   if (!parentIdKey) return chain
//   const chainIdKey: any[] = parentIdKey ? parentIdKey.split('###') : []
//   chainIdKey.map((item: any) => {
//     const data = treeMapData['1_' + item]
//     if (data) {
//       const _item: any = {
//         id: data.id,
//         name: data.name,
//         folderCount: data.folderCount,
//         type: data.type,
//         parentId: data.parentId,
//         parentFolderId: data.parentFolderId,
//       }
//       chain.push(_item)
//     }
//   })
//   if (!chainIdKey.includes('0')) {
//     chain.unshift({
//       id: 0,
//       name: '我的脑图',
//       type: 1,
//       parentId: '',
//     })
//   }

//   return chain
// }

// 请求右键菜单数据
const getRightClickData = async ({ type, id }: any) => {
  let moreMenuData: any[] = []
  // 请求更多按钮操作项数据
  const res: any = await planOperationBtn(type ? 6 : 5, id)
  const { success, data } = res
  const { dataList } = data
  if (success) moreMenuData = dataList
  return moreMenuData
}

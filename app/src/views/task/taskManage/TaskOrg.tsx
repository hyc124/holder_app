import React, { useReducer, useEffect, useState, useContext, useRef, useLayoutEffect } from 'react'
import { Tree, Input, Tooltip, Modal, Spin, Avatar } from 'antd'
// import { useDrop, useDrag } from 'react-dnd'
import { requestApi } from '../../../common/js/ajax'
import { setTreeChild, getTreeParam } from '../../../common/js/tree-com'
import { orgSearchList, findAuthList, getAuthStatus } from '../../../common/js/api-com'
import { selectDateDisplay, saveDateDisplay } from '../../fourQuadrant/getfourData'
import { setMainCreat, taskManageContext, taskRowDrag } from '../TaskManage'
import { CaretDownOutlined } from '@ant-design/icons'
import { useDrag, useDrop } from 'react-dnd'
import { scrollToAnchor } from '../taskDynamic/taskDynamic'
import SearchNavigation from './SearchNavigation'
import './searchnavigation.less'
import NoneData from '@/src/components/none-data/none-data'

// 任务管理上下文数据
// 注：state设置为异步，上下文里数据用的state可能还没及时更改，所以加载完成后的操作才适合用此数据
let taskContext: any
// let allCompanys: any = []
// 外部调用：设置state
let setStateExp: any = null
// 外部调用：拖动到组织架构执行方法
let dragTaskToOrgExp: any = null
const orgAuthList: any = {}
// 树形结构数据映射表
let treeMapData: any = {}
// 初始化state
const stateOne: any = {
  orgShow: true,
  orgMy: true,
  treeData: [],
  selectedKeys: [],
  orgSearch: '',
  allCompanyIds: [],
  allCompany: [],
  expandedKeys: [],
  defExpandedKeys: [],
}

let stateInit: any = Object.assign({}, stateOne)
// 缓存组织架构dom
let TaskOrgDom: any = ''
// 缓存当前选择组织架构选择企业信息
let scrollToAnchorDomId: any = -1
// 缓存当前组织架构操作按钮组是否显示
let orgBtnShow = true
export const TaskOrg = (props: any) => {
  // 获取规划上下文数据
  taskContext = useContext(taskManageContext)

  //   缓存钉住信息
  let stareInfo: any = []
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
        // if (item == 'treeData') {
        //   getArr?.map((tItem: any) => {
        //     // 更新组织架构树map表
        //     treeMapData[tItem.key] = { ...tItem }
        //   })
        // }
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
  // 组织架构loading
  const [orgLoading, setOrgLoad] = useState(false)
  //是否显示搜索栏
  const [searchunfold, setSearchunfold] = useState({
    visible: false, //控制搜索框
    delVal: '', //控制搜索框内容
    showOrgOver: true, //控制搜索框图标上方按钮显示
  })
  //0鼠标移入显示组织架构 1隐藏组织架构
  const [pattern, setPattern] = useState(0)
  //
  const inputRef: any = useRef(null)

  //   初始化监听
  useEffect(() => {
    stateInit = {
      orgShow: true,
      orgMy: true,
      treeData: [],
      selectedKeys: [],
      orgSearch: '',
      allCompanyIds: [],
      allCompany: [],
      expandedKeys: [],
      defExpandedKeys: [],
    }
    // dispatch({
    //   type: ['stateInit'],
    //   data: {
    //     ...stateInit,
    //   },
    // })
    // 重置组织架构选中信息
    $store.dispatch({
      type: 'TASKMANAGE_TREEINFO',
      data: { isMy: true, orgInfo: {}, allCompany: [] },
    })
    //更新组织架构固定或者隐藏
    selectDateDisplay().then((res: any) => {
      // setPattern(res.data.isHideStructure ? 1 : 0)
      setNavigation(res.data.isHideStructure ? 1 : 0)
      dispatch({ type: ['orgSearch'], data: { orgSearch: '' } })
    })
    // 查询左侧组织架构
    queryTreeFirst()
    // 查询右侧任务列表
    taskContext.taskListInit({ init: 'org' })
  }, [props.orgChange])
  useLayoutEffect(() => {
    TaskOrgDom = $('.taskManageContainer .pageLeftCon')
    // 挂载组织架构滚动事件
    $('.taskManageContainer')
      .off('mousewheel')
      .on('mousewheel', '.leftOrgTree', () => {
        if (orgBtnShow) {
          // 隐藏按钮组
          $('#taskOrgTreeOut .org_tree_row')
            .find('.row_right')
            .css({
              display: 'none',
              position: 'fixed',
              zIndex: '-111',
            })
          orgBtnShow = false
        }
        // 下滚
        // if (e.originalEvent.wheelDelta <= 0 && orgBtnShow) {
        //   console.log('隐藏按钮组')
        // } else {
        //   // 上滚
        // }
      })
    return () => {
      $('.taskManageContainer').off('mousewheel')
    }
  })
  useEffect(() => {
    setStateExp = dispatch
    dragTaskToOrgExp = dragTaskToOrg
    return () => {
      scrollToAnchorDomId = -1
      orgBtnShow = true
    }
  }, [])

  // *********************数据查询处理*********************//
  /**
   * 查询公司列表组织架构
   */
  const queryTreeFirst = () => {
    const param = {
      account: $store.getState().nowAccount,
      isAllOrg: 1,
    }
    requestApi({
      url: '/team/permission/findAllEnterpriseTree',
      param: param,
      json: true,
      setLoadState: setOrgLoad,
      apiType: 'main',
    }).then((res: any) => {
      const dataList = res.data.dataList || []
      // console.log(dataList)
      // 默认展开的节点
      const expandedKeys: any = []
      if (res.success) {
        const allCompanyIds: any = []
        // 所有企业
        const allCompany: any = []
        dataList.map((item: any) => {
          allCompanyIds.push(item.id)
          allCompany.push(item)
        })
        // allCompanys = allCompany
        // ===存储钉住数据信息====//
        stareInfo = []
        let stareData = []
        if (Array.isArray(res.data.data)) {
          stareData = res.data.data || []
        } else {
          stareData = [res.data.data]
        }
        stareData.map((item: any) => {
          if (item.indexOf('#') != -1) {
            const newArr = item.split('#')
            newArr.shift()
            newArr.pop()
            stareInfo.push({
              staredStr: res.data.data,
              stareArr: newArr,
            })
          }
        })
        // ====修改后台返回数据为组织架构树组件可渲染数据====//
        const newDataList = renderTreeData(
          {
            array: dataList,
            idKey: 'id',
            nameKey: 'name',
          },
          {
            fromType: 'taskManage',
            isCount: true, //显示统计
            stareInfo: stareInfo,
            onStare: onStare,
            expandedKeys: expandedKeys,
            setOpencreattask: props.param.setOpencreattask,
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
          }
        )
        dispatch({
          type: [
            'treeData',
            'allCompanyIds',
            'allCompany',
            'expandedKeys',
            'defExpandedKeys',
            'selectedKeys',
            'orgMy',
          ],
          data: {
            treeData: newDataList,
            allCompanyIds: allCompanyIds,
            allCompany: allCompany,
            expandedKeys: expandedKeys,
            defExpandedKeys: expandedKeys,
            selectedKeys: [],
            orgMy: true,
          },
        })
        stateInit.defExpandedKeys = expandedKeys
        // 更新组织架构全局存储信息
        $store.dispatch({
          type: 'TASKMANAGE_TREEINFO',
          data: { isMy: true, orgInfo: {}, allCompany: allCompany },
        })
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
      id: treeInfo.curId,
      type: treeInfo.curType,
      account: $store.getState().nowAccount,
      isAllOrg: 0,
      teamId: treeInfo.cmyId,
    }
    requestApi({
      url: '/team/permission/findAllEnterpriseTree',
      param: param,
      json: true,
      apiType: 'main',
    }).then((res: any) => {
      const dataList = res.data.dataList || []
      console.log(dataList)
      if (res.success) {
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
            teamObj: {
              teamId: treeInfo.cmyId,
              teamName: treeInfo.cmyName,
            },
            setOpencreattask: props.param.setOpencreattask,
            fromType: 'taskManage',
            isCount: true, //显示统计
            parentOrder: treeNode.order,
            stareInfo: stareInfo,
            parent: {
              id: treeInfo.curId,
              name: treeInfo.curName,
              type: treeInfo.curType,
            },
            onStare: onStare,
          }
        )
        const newData = setTreeChild(treeData, treeNode.key, newDataList)
        // setOrgState({ ...orgState, treeData: newData })
        dispatch({ type: ['treeData'], data: { treeData: newData } })
        if (resolve) {
          resolve()
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
    e: { selected: boolean; selectedNodes: any; node: any; event: any }
  ): Promise<void> => {
    return new Promise(() => {
      // if (e.selected) {
      const treeInfo = getTreeParam(e.node.key)
      // 选中人员时，部门为父级
      if (treeInfo.curType == 0) {
        treeInfo.deptId = treeInfo.parentId
        treeInfo.deptName = treeInfo.parentName
      }
      $store.dispatch({ type: 'TASKMANAGE_TREEINFO', data: { isMy: false, orgInfo: treeInfo } })

      if (treeInfo.cmyId) {
        scrollToAnchorDomId = treeInfo.cmyId
      }
      if (e.selected) {
        dispatch({
          type: ['selectedKeys', 'orgMy'],
          data: { selectedKeys: selectedKeys, orgMy: false, allCompany: [] },
        })
      } else {
        dispatch({
          type: ['orgMy'],
          data: { orgMy: false, allCompany: [] },
        })
      }

      async function findAuth() {
        // console.log('组织架构 选中树节点：获取权限------')
        await findAuthList({ typeId: treeInfo.cmyId })
        taskContext.taskListInit({ init: 'org' })
      }
      findAuth()
      // }
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
  // 点击我的任务
  const myOrgChange = () => {
    // 取消选中树节点
    $store.dispatch({
      type: 'TASKMANAGE_TREEINFO',
      data: { isMy: true, orgInfo: {}, allCompany: orgState.allCompany },
    })

    dispatch({ type: ['selectedKeys', 'orgMy'], data: { selectedKeys: [], orgMy: true } })
    scrollToAnchorDomId = -1
    taskContext.taskListInit({ init: 'org' })
  }

  /**
   * 钉住部门
   */
  const onStare = (paramObj: any) => {
    const getTreeInfo = getTreeParam(paramObj.treeId)
    const param = {
      account: $store.getState().nowAccount,
      orgId: getTreeInfo.cmyId,
      deptId: getTreeInfo.curId,
    }
    let url = '/team/enterpriseUserAuth/addTreePeg'
    if (paramObj.optType == 1) {
      //取消钉住
      url = '/team/enterpriseUserAuth/delTreePeg'
    }
    requestApi({
      url: url,
      param: param,
      json: true,
      successMsg: paramObj.optType == 1 ? '取消钉住成功' : '钉住成功',
    }).then((res: any) => {
      if (res.success) {
        const { treeData } = stateInit
        updateTreeData({
          treeData: treeData,
          optType: 'editStare',
          editKeyVal: paramObj.optType == 1 ? false : true,
          nowId: getTreeInfo.curId,
          nowType: getTreeInfo.curType,
          cmyId: getTreeInfo.cmyId,
          stareInfo: stareInfo,
        })
        dispatch({ type: ['treeData'], data: { treeData: [...treeData] } })
      }
    })
  }

  /**
   * 递归查找树结构并更新数据
   */
  const updateTreeData = (paramObj: any) => {
    paramObj.treeData.map((item: any) => {
      const thisName = item.name
      let showName = thisName
      const treeInfo = getTreeParam(item.key)
      //   钉住title
      let stareTxt = '钉住'
      // 是否是被钉住部门
      let isStared = ''
      //   创建任务按钮
      const addTaskBtn: any = (
        <span
          className="img_icon create_task_icon"
          onClick={(e: any) => {
            e.stopPropagation()
            $store.dispatch({ type: 'TASKMANAGE_CREATETASK', data: { isMy: false, orgInfo: treeInfo } })
            setMainCreat(false)
            props?.setOpencreattask(true)
          }}
        ></span>
      )
      //   钉住按钮
      let stareBtn: any = null
      if (item.type == 0) {
        showName = `${item.name || name}${item.roleName ? '-' + item.roleName : ''}`
      }
      // 企业级是否有下一层数据
      let switchIcon: any
      // 是否需要更改数据
      let isUpdate = false
      // ====当前节点设置（一个企业只有一个部门钉住）=====//
      if (item.id == paramObj.nowId) {
        isUpdate = true
        if (item.type == 2 && item.childs && item.childs.length > 0) {
          switchIcon = <span className="img_icon tree_rig_switch"></span>
        }
        if (paramObj.optType == 'editStare' && paramObj.editKeyVal) {
          isStared = 'stared'
          stareTxt = '取消钉住'
        }
      }
      // ===其他节点设置（一个企业只有一个部门钉住,其他部门设置为非钉住状态）===//
      else {
        if (paramObj.cmyId == treeInfo.cmyId && treeInfo.curType == 3) {
          if (paramObj.optType == 'editStare' && paramObj.editKeyVal) {
            isUpdate = true
            isStared = ''
            stareTxt = '钉住'
          }
        }
      }
      //   钉住按钮
      if (item.type == 3) {
        stareBtn = (
          <span
            className={`img_icon org_stare_icon ${isStared}`}
            title={stareTxt}
            onClick={(e: any) => {
              e.stopPropagation()
              onStare({
                treeId: item.key,
                optType: stareTxt == '取消钉住' ? 1 : 0,
              })
            }}
          ></span>
        )
      }

      const thisText = (
        <OrgRow
          param={{
            showName: showName,
            type: item.type,
            person: item.person,
            isCount: false,
            addTaskBtn,
            stareBtn,
            switchIcon,
            rowData: item,
            teamId: treeInfo.cmyId,
          }}
        />
      )
      if (isUpdate) {
        item.title = thisText
      }
      if (item.children && item.children.length > 0) {
        updateTreeData({ ...paramObj, treeData: item.children })
      }
    })
  }

  //   **********************************组织架构拖动***************************//
  /**
   * 拖动任务到组织架构接口调用
   */
  const dragTaskToOrgApi = ({
    nowId,
    nowType,
    ascriptionId,
    ascriptionName,
    createUser,
    createUserName,
    taskId,
  }: any) => {
    const { nowUserId, nowUser } = $store.getState()
    return new Promise(resolve => {
      const attachModel = {
        star: '',
        type: nowType,
        typeId: nowId,
      }
      const param = {
        ascriptionId: ascriptionId, //任务归属id
        ascriptionName: ascriptionName, //任务归属名称
        ascriptionType: 2, //任务归属类型
        createUser: createUser, //当前任务负责人
        createUserName: createUserName, //当前任务负责人名称
        id: taskId, //任务id
        remark: '', //备注
        operateUser: nowUserId,
        operateUserName: nowUser,
        attachModel: attachModel, //升降级附加信息
      }
      console.log(param)
      requestApi({
        url: '/task/attach/treeDrag',
        param: param,
        json: true,
        successMsg: '任务拖动成功',
      }).then((res: any) => {
        if (res.success) {
          resolve(res)
        }
      })
    })
  }

  /**
   *
   * @param param0
   */
  /**
   * 拖动任务到组织架构操作处理
   */
  const dragTaskToOrg = ({ info }: any) => {
    const canDrop = dragTaskToOrgCheck(info)
    if (!canDrop) {
      return
    }
    const { node } = info
    const toInfo = node
    const toOrg = getTreeParam(toInfo.key)
    const fromRowData = taskRowDrag.rowData || {}
    const liableObj = fromRowData.liable || {}
    setDragDiffModal({
      visible: true,
      dragTaskSure: () => {
        dragTaskToOrgApi({
          nowId: toOrg.curId,
          nowType: toOrg.curType,
          ascriptionId: toOrg.cmyId,
          ascriptionName: toOrg.cmyName,
          createUser: liableObj.userId,
          createUserName: liableObj.username,
          taskId: fromRowData.id,
        }).then(() => {
          // 拖动成功跳转到对应组织架构
          $store.dispatch({ type: 'TASKMANAGE_TREEINFO', data: { isMy: false, orgInfo: toOrg } })
          dispatch({
            type: ['selectedKeys'],
            data: { selectedKeys: [toInfo.key] },
          })
          async function findAuth() {
            // console.log('拖动任务到组织架构,获取权限----')
            await findAuthList({ typeId: toOrg.cmyId })
            taskContext.taskListInit({ init: 'org' })
          }
          findAuth()
        })
      },
    })
    $('#taskOrgTreeOut')
      .find('.drop-over-bg')
      .removeClass('drop-over-bg')
  }
  let oldOrgDragRow: any = null
  /**
   * 拖动hover
   */
  const onDragOver = ({ event, node }: any) => {
    console.log('onDragOver')
    const curNode = event.currentTarget
    if (
      (taskRowDrag.begin && !oldOrgDragRow) ||
      (taskRowDrag.begin && oldOrgDragRow && !$(oldOrgDragRow).is(curNode))
    ) {
      $('#taskOrgTreeOut')
        .find('.drop-over-bg')
        .removeClass('drop-over-bg')
      // 被拖动任务归属信息
      const fromInfo = $store.getState().taskManageTreeInfo
      // 目标节点归属信息
      const toOrg = getTreeParam(node.key)
      oldOrgDragRow = curNode
      const fromRowData = taskRowDrag.rowData || {}
      const attach = fromRowData.attach || { type: 0 }
      //  不可拖动的情况：我的任务查询的数据||跨企业||拖动到当前所在组织时不需要没有意义，故也限制
      if (
        fromInfo.isMy ||
        toOrg.cmyId != fromRowData.ascriptionId ||
        (toOrg.cmyId == fromRowData.ascriptionId &&
          toOrg.curType == attach.type &&
          toOrg.curId == attach.typeId)
      ) {
        return
      }
      $(curNode).addClass('drop-over-bg')
    }
  }

  /**
   * 拖动移入
   * @param info
   */
  const onDragEnter = (info: any) => {
    if (info.node.type != 2) {
      jQuery('#taskOrgTreeOut').addClass('no_drag_hover')
    } else {
      jQuery('#taskOrgTreeOut').removeClass('no_drag_hover')
    }
  }

  /**
   * 拖动放置完成
   * @param info
   */
  const onDragEnd = () => {
    console.log('end')
    // 修改bug：拖动遗留横杠
    jQuery('#taskOrgTreeOut').addClass('no_drag_hover')
  }
  /**
   * 组织架构加载完毕后设置默认展开节点
   */
  // const onLoad = (loadedKeys: any) => {
  // console.log('onLoad')
  // taskToOrgInit()
  // if (loadedKeys.length == allCompanys.length) {
  // console.log(loadedKeys)
  // dispatch({
  //   type: ['defExpandedKeys'],
  //   data: {
  //     defExpandedKeys: [...stateInit.defExpandedKeys],
  //   },
  // })
  // treeEvent()
  // }
  // }

  // **************************组织架构搜索************************//
  /**
   * 选中搜索项
   */
  const searchSelect = (paramObj: { treeId: string }) => {
    const treeInfo = getTreeParam(paramObj.treeId)
    // console.log(treeInfo)
    $store.dispatch({ type: 'TASKMANAGE_TREEINFO', data: { isMy: false, orgInfo: treeInfo } })
    async function findAuth() {
      // console.log('组织架构 选中搜索项,获取权限-----------------')
      await findAuthList({ typeId: treeInfo.cmyId })
      taskContext.taskListInit({ init: 'org' })
    }
    findAuth()
  }
  // 组织机构窄模式
  // 默认企业头像
  const defCompanyLogo = $tools.asAssetsPath('/images/common/company_default.png')
  // 用户头像
  const nowAvatar = $store.getState().nowAvatar
  // 用户昵称
  const nowUser = $store.getState().nowUser

  // 当前选择树节点信息
  const _taskManageTreeInfo = $store.getState().taskManageTreeInfo

  const setNavigation = (type: any) => {
    if (type == 1) {
      taskContext.listMode = 1
      setPattern(1)
      $('.orgLeftCon')
        .removeClass('tableModel')
        .addClass('wideMode')
    } else if (type == 0) {
      taskContext.listMode = 0
      setPattern(0)
      $('.orgLeftCon')
        .removeClass('wideMode')
        .addClass('tableModel')
    } else if (type == 2) {
      taskContext.listMode = 0
      $('.orgLeftCon')
        .removeClass('showwidth')
        .addClass('hidewidth')
    }
  }

  return (
    <Spin spinning={orgLoading}>
      {/* 组织机构窄模式 */}
      <div
        className={`pageLeftNarrowCon flex column center-v h100  ${
          pattern == 1 ? 'showOrgFloat' : 'forcedHide'
        }`}
        // onMouseOver
        onMouseOver={() => {
          // taskContext.closeFilterPlug()
          if (pattern == 0) {
            return
          } else {
            searchunfold.showOrgOver = true
            setSearchunfold({ ...searchunfold })
          }
          orgHover({
            type: 1,
            targetNode: TaskOrgDom,
            from: 'taskManage',
            listMode: pattern,
          })
        }}
      >
        <div
          key={-1}
          id={`orgNarrowItem_-1`}
          className="orgNarrowItem"
          style={_taskManageTreeInfo.isMy ? { border: '1px solid #3949AB' } : {}}
        >
          <Avatar
            className="img_icon"
            src={nowAvatar}
            size={32}
            style={{
              backgroundColor: '#3949AB',
              fontSize: 12,
              lineHeight: 32,
            }}
          >
            {nowUser && nowUser.substr(-2, 2)}
          </Avatar>
          {_taskManageTreeInfo.isMy ? <span className="active"></span> : ''}
        </div>
        {orgState.allCompany?.map((item: any, i: number) => {
          return (
            <div
              key={i}
              id={`orgNarrowItem_${item.id}`}
              className="orgNarrowItem"
              style={
                !_taskManageTreeInfo.isMy && _taskManageTreeInfo.orgInfo.cmyId == item.id
                  ? { border: '1px solid #3949AB' }
                  : {}
              }
            >
              <Avatar
                className="img_icon"
                src={item.logo || defCompanyLogo}
                size={32}
                style={{
                  // backgroundColor: '#EBEEFF',
                  fontSize: 12,
                  lineHeight: 32,
                }}
              ></Avatar>
              {!_taskManageTreeInfo.isMy && _taskManageTreeInfo.orgInfo.cmyId == item.id && (
                <span className="active"></span>
              )}
            </div>
          )
        })}
      </div>
      {/* 组织架构宽模式 */}
      <div
        className={`pageLeftCon flex-1 flex column overflow_hidden clac100 
        ${pattern == 0 ? 'table_model' : 'width_model'}
        `}
        onMouseLeave={(e: any) => {
          if (pattern == 0) {
            return
          } else {
            searchunfold.showOrgOver = false
            setSearchunfold({ ...searchunfold })
          }
          orgHover({
            type: 0,
            targetNode: TaskOrgDom,
            from: 'taskManage',
            listMode: pattern,
          })
          $('.org_fold_icon.chose').removeClass('posLeft')
        }}
      >
        <div className={`search_navigation ${pattern ? 'patternHide' : ''}`}>
          {((pattern == 1 && searchunfold.showOrgOver) || pattern == 0) && (
            <SearchNavigation
              title="组织架构"
              pattern={pattern}
              unfoldFn={(state: any) => {
                //展开收起
                if (state == 'hide') {
                  setNavigation(2)
                }
              }}
              searchFn={(state: any) => {
                //点击搜索
                setSearchunfold({ ...searchunfold, visible: state, delVal: '' })
                dispatch({ type: ['orgSearch'], data: { orgSearch: '' } })
                $('.org_fold_icon.chose').addClass('posLeft')
              }}
              concealOrganization={(state: any) => {
                //设置自动隐藏组织架构栏
                //0鼠标移入显示组织架构 1隐藏
                saveDateDisplay(state ? 1 : 0, 'org').then((res: any) => {
                  setNavigation(state ? 1 : 0)
                })
              }}
            />
          )}
        </div>
        {searchunfold.visible && (
          <div className={`searchList_box`}>
            <div className="searchList_sn_title">
              <div
                onClick={() => {
                  setSearchunfold({ ...searchunfold, visible: false, delVal: '' })
                  dispatch({ type: ['orgSearch'], data: { orgSearch: '' } })
                  $('.org_fold_icon.chose').removeClass('posLeft')
                }}
              >
                <i className="goback-icon"></i>
                搜索成员
              </div>
            </div>
            <Input
              allowClear
              ref={inputRef}
              autoFocus={true}
              value={searchunfold.delVal}
              placeholder="请输入姓名"
              className="org_menu_search baseInput radius16 border0 bg_gray"
              prefix={
                <span
                  className="search-icon-boxs"
                  onClick={() => {
                    const inputValue = inputRef.current.state.value || ''
                    dispatch({ type: ['orgSearch'], data: { orgSearch: inputValue } })
                  }}
                >
                  <em className="search-icon-t-btn"></em>
                </span>
              }
              onChange={(e: any) => {
                setSearchunfold({ ...searchunfold, delVal: e.target.value })
              }}
              onPressEnter={(e: any) => {
                dispatch({ type: ['orgSearch'], data: { orgSearch: e.target.value } })

                orgHover({
                  type: 1,
                  targetNode: TaskOrgDom,
                  from: 'taskManage',
                  listMode: pattern,
                })
              }}
            />
            {/* 搜索列表 */}
            <div className={`orgSearchList flex-1 ${orgState.orgSearch == '' ? 'forcedHide' : ''}`}>
              <OrgSearchList
                param={{ allCompanyIds: orgState.allCompanyIds, allCompany: orgState.allCompany }}
                searchVal={orgState.orgSearch}
                searchunfold={searchunfold}
                searchSelect={searchSelect}
              />
            </div>
          </div>
        )}
        <div className={`orgBotScroll calcHeight flex-1 flex column`}>
          <div
            className={`org_my flex center-v ${orgState.orgMy ? 'on org_my_active' : ''}`}
            onClick={myOrgChange}
            style={{ paddingLeft: 12 }}
          >
            {/* <em className="img_icon org_my_icon"></em> */}
            <Avatar
              className="img_icon logoLeftIcon root"
              src={$store.getState().nowAvatar}
              size={24}
              style={{ backgroundColor: '#3949AB', fontSize: 12 }}
            >
              {nowUser && nowUser.substr(-2, 2)}
            </Avatar>
            <span style={{ marginLeft: 6 }}>我的任务</span>
          </div>
          <div className="leftOrgTree flex-1" id="taskOrgTreeOut">
            <Tree
              // defaultExpandedKeys={orgState.defExpandedKeys}
              blockNode={true}
              treeData={orgState.treeData}
              loadData={onLoadData}
              onSelect={onSelect}
              selectedKeys={orgState.selectedKeys}
              onExpand={onExpand}
              expandedKeys={orgState.expandedKeys}
              // draggable
              onDrop={onDrop}
              onDragEnter={onDragEnter}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              // onLoad={onLoad}
              className="baseOrgTree switch_null fix_content gradient"
              switcherIcon={<CaretDownOutlined />}
            />
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
    </Spin>
  )
}

/**
 * 鼠标移入组织架构
 */
const orgMouseenter = ({ thisE, rowData, teamId }: { thisE: any; rowData: any; teamId: string }) => {
  // const orgRows = $('#taskOrgTreeOut .org_tree_row')
  const thisEOffSetHeight = $(thisE).offset()?.top || 0
  const pageLeftConWidth = $('.pageLeftCon').width()
  const appSliderWidth = $('.app-sidebar').width()
  orgBtnShow = true
  $(thisE)
    .find('.row_right')
    .css({
      display: 'flex',
      height: '48px',
      lineHeight: '48px',
      padding: '0 4px 0 12px',
      position: 'fixed',
      zIndex: '999',
      top: thisEOffSetHeight + 'px',
      left: Number(pageLeftConWidth) + Number(appSliderWidth) - 100 + 'px',
      background: 'linear-gradient(272deg, #F5F6FF 0%, #F5F6FF 84%, rgba(247, 248, 253, 0) 100%)',
    })
    .find('.create_task_icon')
    .hide()
  const nowType = rowData.type
  let isCreate = false
  // 是否已经缓存过此企业
  if (!orgAuthList[teamId]) {
    let orgAuth = false,
      deptAuth = false
    async function findAuth() {
      const authList = await findAuthList({
        typeId: teamId,
        customAuthList: [],
      })
      orgAuth = getAuthStatus('taskOrgAdd', authList || []) //添加企业任务权限
      deptAuth = getAuthStatus('taskDeptAdd', authList || []) //添加部门任务权限
      orgAuthList[teamId] = {
        deptAuth: deptAuth,
        orgAuth: orgAuth,
      }
      const authItem = orgAuthList[teamId]
      if ((nowType == 2 && authItem.orgAuth) || (nowType == 3 && authItem.deptAuth) || nowType == 0) {
        isCreate = true
      }

      if (isCreate) {
        $(thisE)
          .find('.create_task_icon')
          .show()
      }
    }
    findAuth()
  } else {
    // 是否有创建权限
    const authItem = orgAuthList[teamId]
    if ((nowType == 2 && authItem.orgAuth) || (nowType == 3 && authItem.deptAuth) || nowType == 0) {
      isCreate = true
    }

    if (isCreate) {
      $(thisE)
        .find('.create_task_icon')
        .show()
    }
  }
}
/**
 * 鼠标移出组织架构
 */
const orgMouseLeave = () => {
  orgBtnShow = false
  $('#taskOrgTreeOut .org_tree_row')
    .find('.row_right')
    .css({
      background: 'inherit',
    })
    // .not('.isStareed') //暂时屏蔽钉住按钮一直显示
    .css({
      display: 'none',
      position: 'fixed',
      zIndex: '-111',
    })
}

// =================组织架构搜索=============//
/**
 * 任务搜索列表
 */
const OrgSearchList = (props: any) => {
  const getParam = props.param || {}
  const [searchList, setSearchList] = useState<any>([])
  // 选中效果
  const [searchActive, setSearchActive] = useState<number>(-1)
  useEffect(() => {
    if (props.searchVal !== '') {
      setSearchActive(-1)
      if (props.serchType && props.serchType == 'chooseLiber') {
        querySearchLiberList()
      } else {
        querySearchList()
      }
    }
  }, [props.searchVal])
  const querySearchLiberList = () => {
    const param = {
      permissionType: 3,
      keywords: props.searchVal,
      teamIds: getParam.allCompanyIds,
      userId: $store.getState().nowUserId,
      searchType: [0],
    }
    requestApi({
      url: '/team/permission/findAuthData',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        const dataList = res.data.data[0]
        dataList.forEach((el: any) => {
          el.deptchain = `@${el.teamId}@${el.deptId}###${el.deptName}###${el.roleId}###${el.roleName}`
          el.id = el.userId
        })
        setSearchList(dataList || [])
      }
    })
  }
  const querySearchList = () => {
    const param = {
      keywords: props.searchVal,
      orgIds: getParam.allCompanyIds,
    }
    orgSearchList(param).then((res: any) => {
      if (res) {
        setSearchList(res.data.dataList || [])
      }
    })
  }
  const getChangeName = (val: any, roleName: any) => {
    const newVal = val.replace(props.searchVal, `<span class="blod_blue">${props.searchVal}</span>`)
    const rolText = roleName ? '(' + roleName + ')' : ''
    return newVal + rolText
  }
  return (
    <>
      <div className="total_data">共{searchList.length}条搜索结果</div>
      <ul>
        {searchList &&
          searchList.map((item: any, i: number) => {
            let cmyName = ''
            let deptList
            let roleName
            let roleId
            let departName
            let departId
            let cmyId = ''
            if (item.deptchain) {
              cmyId = item.deptchain.split('@')[1]
              deptList = item.deptchain.split('@')[2].split('###')
              if (deptList.length > 3) {
                departId = deptList[0]
                departName = deptList[1]
                roleId = deptList[2]
                roleName = deptList[3]
              } else {
                departId = deptList[0]
                departName = deptList[1]
              }
            }
            // 查询企业名称
            for (const i in getParam.allCompany) {
              const datas = getParam.allCompany[i]
              if (datas.id == cmyId) {
                cmyName = datas.name || ''
                break
              }
            }
            const showTxt = `${cmyName ? cmyName + '-' : ''}${departName ? departName : ''}`
            const thisNodeId = `account_${item.id}_0_${item.username}@parentId_${departId}_3_${departName}@company_${cmyId}_2_${cmyName}@role_${roleId}_31_${roleName}`

            return (
              <Tooltip key={i} placement="right" title={showTxt}>
                <li
                  className={`${searchActive == i ? 'active' : ''} total_data_list`}
                  key={i}
                  onClick={e => {
                    e.stopPropagation()
                    setSearchActive(i)
                    props.searchSelect({ treeId: thisNodeId, account: item.account, profile: item.profile })
                  }}
                >
                  <Avatar
                    size={32}
                    src={
                      item.username ? item.profile || '' : $tools.asAssetsPath('/images/workplan/head_def.png')
                    }
                    style={{
                      backgroundColor: item.username ? '#3949AB' : '#D7D7D9',
                      fontSize: '11px',
                    }}
                  >
                    {item.username ? item.username.substr(-2, 2) : ''}
                  </Avatar>
                  <div>
                    <h3
                      className="text-ellipsis"
                      dangerouslySetInnerHTML={{
                        __html: item.username ? getChangeName(item.username, roleName) : '',
                      }}
                    ></h3>
                    <span className="text-ellipsis">{showTxt}</span>
                  </div>
                </li>
              </Tooltip>
            )
          })}
        {searchList.length === 0 && (
          <NoneData
            imgSrc={$tools.asAssetsPath(`/images/noData/no_search.png`)}
            showTxt="未搜索到结果"
            imgStyle={{ width: 70, height: 66 }}
            containerStyle={{ marginTop: 200 }}
          />
        )}
      </ul>
    </>
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
    isCount: boolean
    addTaskBtn: any
    stareBtn: any
    switchIcon: any
    rowData: any
    teamId: string
  }
}) => {
  const { showName, type, person, isCount, addTaskBtn, stareBtn, switchIcon, teamId, rowData } = props.param
  const rowItem: any = rowData
  const droperRef: any = useRef(null)
  // 绑定拖动放置
  let targetNode: any = null
  // ==================拖动排序====================//
  /**
   * 放置
   */
  const [{ isOver, dropClassName }, droper] = useDrop({
    accept: ['orgDragOrder', 'dragBodyRow'],
    collect: monitor => {
      const dragType = monitor.getItemType()
      // console.log(dragType)
      let dropClassName = '',
        isOver = monitor.isOver()
      if (dragType == 'orgDragOrder') {
        const client: any = monitor.getClientOffset() || {}
        const targetY: number = jQuery(targetNode).offset()?.top || 0
        const targetH: number = jQuery(targetNode).outerHeight() || 0
        // 目标节点上方二分之一处，上方添加边框线
        if (client.y < targetY + targetH * 0.5) {
          dropClassName = 'top'
          rowItem.dragOverGapTop = true
          rowItem.dragOverGapBottom = false
        }
        // 目标节点上方二分之一处，下方添加边框线
        else {
          dropClassName = 'bottom'
          rowItem.dragOverGapTop = false
          rowItem.dragOverGapBottom = true
        }
      }
      // console.log(dropClassName, rowItem)
      if (dragType == 'orgDragOrder' && rowData.type != 2) {
        isOver = false
      }
      return {
        isOver,
        dropClassName,
      }
    },
    canDrop: (dragItem: any) => {
      let drop = true
      if (dragItem.type == 'orgDragOrder' && rowData.type != 2) {
        drop = false
      }
      return drop
    },
    hover: (dragItem: any) => {
      // console.log('org hover')
      // 目标节点
      targetNode = droperRef.current
      // 拖动任务到组织架构
      if (dragItem.type == 'dragBodyRow') {
        dragTaskToOrgCheck({
          targetNode,
          node: { ...rowItem },
        })
      }
    },
    drop: (dragItem: any) => {
      // console.log('org drop')
      // 组织架构拖动排序
      if (dragItem.type == 'orgDragOrder') {
        onDrop({
          node: { ...rowItem },
          dragNode: { ...dragItem.rowData },
        })
      } else {
        dragTaskToOrgExp({
          info: {
            node: { ...rowItem },
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
      if (rowData.type != 2) {
        drag = false
      }
      return drag
    },
    begin: () => {
      console.log('org begin')
    },
    end: () => {
      console.log('org end')
    },
  })

  drager(droper(droperRef))
  // 绑定拖动放置
  return (
    <>
      <div
        ref={droperRef}
        className="org_tree_row flex center-v between"
        data-teamid={teamId}
        // onMouseEnter
        onMouseEnter={(e: any) => {
          orgMouseenter({
            thisE: e.currentTarget,
            rowData,
            teamId,
          })
        }}
        onMouseLeave={orgMouseLeave}
      >
        <div className="row_left flex center-v">
          <Tooltip placement="top" title={showName} mouseLeaveDelay={0}>
            <span className="org_tree_text my_ellipsis">{showName}</span>
          </Tooltip>

          <span className={`org_tree_count_text flex_shrink_0 ${isCount ? '' : 'forcedHide'}`}>
            {type != 0 ? '(' + person + ')' : ''}
          </span>
        </div>
        <div className={`row_right ${stareBtn?.props?.className?.includes('stared') ? 'isStareed' : ''}`}>
          {addTaskBtn}
          {stareBtn}
          {switchIcon}
        </div>
      </div>

      <div className={`tree_drop_indicator  ${isOver ? dropClassName : ''}`}></div>
    </>
  )
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
    teamObj?: { teamId?: any; teamName?: any }
    fromType: string
    isCount: boolean
    stareInfo: any
    onStare: (param: any) => void
    setExpandedKeys?: (param: string) => void
    expandedKeys?: any
    parent?: any //父级链条信息
    setOpencreattask: any
    parentOrder?: any
  }
) => {
  // 父级排序order
  const { parentOrder } = attachInfo
  // 展开的节点
  const expandedKeys = attachInfo.expandedKeys || []
  // if (data.array && data.array.length > 0) {
  return data.array.map((item: any, i: number) => {
    //默认企业头像
    const defCompanyLogo = $tools.asAssetsPath('/images/common/company_default.png')
    const thisId = item[data.idKey]
    const thisName = item[data.nameKey]
    let typeName = ''
    let showName = thisName
    let thisNodeId = ''
    let roleInfo = ''
    // 名字左侧的图标
    let nameLeftIcon: any
    //   钉住title
    let stareTxt = '钉住'
    // 本级或子级是否有被钉住的部门,用于判断是否需要展开
    let hasStare = false
    // 是否是被钉住部门
    let isStared = ''
    //   创建任务按钮
    let addTaskBtn: any = ''
    //   钉住按钮
    let stareBtn: any = ''
    let cmyObj: any = attachInfo.teamObj ? attachInfo.teamObj : {}
    //父级链条信息
    const preParent: any = attachInfo.parent ? attachInfo.parent : null
    if (item.type == 0) {
      typeName = 'account_'
      showName = `${item.name || name}${item.roleName ? '-' + item.roleName : ''}`
      roleInfo = `@role_${item.roleId}_31_${item.roleName}`
    } else if (item.type == 3) {
      typeName = 'department_'
    } else {
      typeName = 'duties_'
    }
    if (item.type == 2) {
      //企业数据信息
      thisNodeId = `company_${thisId}_2_${thisName}`
      cmyObj = { teamId: thisId, teamName: thisName }
      //企业根节点
      // nameLeftIcon = <span className="img_icon nameLeftIcon root"></span>
      nameLeftIcon = (
        <Avatar className="img_icon logoLeftIcon root" src={item.logo || defCompanyLogo} size={24}></Avatar>
      )
    } else {
      // 上一层data中id为本层的父级id
      thisNodeId = `${typeName}${thisId}_${item.type}_${thisName}@parentId_${data.id}_${data.type}_${data.name}@company_${cmyObj.teamId}_2_${cmyObj.teamName}${roleInfo}@${i}`
      // nameLeftIcon = <span className="img_icon nameLeftIcon tree_rig_switch"></span>
      // nameLeftIcon = <span className="img_icon nameLeftIcon child"></span>
    }
    // 企业级是否有下一层数据
    let switchIcon: any
    if (item.type == 2 && item.childs && item.childs.length > 0) {
      switchIcon = (
        <span
          className="img_icon tree_rig_switch"
          onClick={(e: any) => {
            if (attachInfo.setExpandedKeys) {
              e.stopPropagation()
              attachInfo.setExpandedKeys(thisNodeId)
            }
          }}
        ></span>
      )
    }
    //   钉住按钮处理
    if (item.type == 2 || item.type == 3 || item.type == 0) {
      // 创建任务按钮
      addTaskBtn = (
        <span
          className="img_icon create_task_icon"
          onClick={(e: any) => {
            e.stopPropagation()
            const orgInfo = getTreeParam(thisNodeId, preParent)
            $store.dispatch({
              type: 'TASKMANAGE_CREATETASK',
              data: { isMy: false, orgInfo: { ...orgInfo, profile: item?.profile } },
            })
            setMainCreat(false)
            attachInfo.setOpencreattask(true)
          }}
        ></span>
      )
      attachInfo.stareInfo.map((sitem: any) => {
        sitem.stareArr.map(function(arrItem: any, a: number) {
          // console.log(item.departParent)
          // 存在钉住的部门:被钉住部门的上级||被钉住的下级  都展开
          if (arrItem == item.id || (item.departParent && item.departParent.includes(sitem.staredStr))) {
            hasStare = true
          }
          // 最后一个是被钉住的部门
          if (arrItem == item.id && a == sitem.stareArr.length - 1) {
            isStared = 'stared'
            stareTxt = '取消钉住'
          }
        })
      })
      //   钉住按钮
      if (item.type == 3) {
        stareBtn = (
          <span
            className={`img_icon org_stare_icon ${isStared}`}
            title={stareTxt}
            onClick={(e: any) => {
              e.stopPropagation()
              attachInfo.onStare({
                treeId: thisNodeId,
                optType: stareTxt == '取消钉住' ? 1 : 0,
              })
            }}
          ></span>
        )
      }
    }
    const thisText = (
      <OrgRow
        param={{
          showName: showName,
          type: item.type,
          person: item.person,
          isCount: attachInfo.isCount,
          addTaskBtn,
          stareBtn,
          switchIcon,
          teamId: cmyObj.teamId,
          rowData: item,
        }}
      />
    )

    //   1 设置key值和显示内容
    item.key = thisNodeId
    // item.title = thisText
    item.isStared = isStared ? true : false
    // 排序字段
    item.order = parentOrder != undefined ? parentOrder + '-' + i : i + ''
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
    const attachObj = { ...attachInfo, ...{ teamObj: cmyObj }, parent: parent, parentOrder: item.order }
    // 保存展开的节点
    if (hasStare || item.type == 2) {
      expandedKeys.push(thisNodeId)
    }
    if ((item.childs && item.childs.length > 0) || item.hasChild) {
      item.switcherIcon = nameLeftIcon
      item.children = item.childs || []
      return {
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
 * 拖动放置
 * @param info
 */
const onDrop = (info: any) => {
  // 2 组织机构排序拖动操作
  const toInfo = treeMapData[info.node.key]
  const fromInfo = treeMapData[info.dragNode.key]
  // const fromIndex = Number(fromInfo.pos.split('-')[1])
  // let toIndex = Number(toInfo.pos.split('-')[1])
  const fromIndex = Number(fromInfo.order.split('-')[0])
  let toIndex = Number(toInfo.order.split('-')[0])
  if (toInfo.type != 2 || fromInfo.type != 2 || fromIndex == toIndex) {
    return
  }
  const param = {
    account: $store.getState().nowAccount,
    fromOrgId: fromInfo.id || '',
    fromOrdinal: fromIndex + 1 || 1,
    toOrdinal: toIndex + 1 || 1,
  }
  requestApi({
    url: '/team/enterpriseInfo/moveUserTree',
    param: param,
    successMsg: '移动成功',
  }).then((res: any) => {
    if (res.success) {
      const { treeData } = stateInit
      const sourceItem = { ...treeData[fromIndex] }
      // 向上移动
      if (fromIndex > toIndex) {
        // 拖至目标节点下方,则目标位置加1
        if (toInfo.dragOverGapBottom) {
          toIndex = toIndex + 1
        }
        // 目标位置之下的都向下移动一个位置
        for (let i = fromIndex - 1; i >= toIndex; i--) {
          treeData[i + 1] = { ...treeData[i], order: i + 1 + '' }
          treeMapData[treeData[i + 1].key] = { ...treeData[i + 1] }
        }
      }
      // 向下移动
      else if (fromIndex < toIndex) {
        // 拖至目标节点上方,则目标位置减1
        if (toInfo.dragOverGapTop) {
          toIndex = toIndex - 1
        }
        // 目标位置之上的都向上移动一个位置
        for (let i = fromIndex + 1; i <= toIndex; i++) {
          treeData[i - 1] = { ...treeData[i], order: i - 1 + '' }
          treeMapData[treeData[i - 1].key] = { ...treeData[i - 1] }
        }
      }
      treeData[toIndex] = { ...sourceItem, order: toIndex + '' }
      treeMapData[treeData[toIndex].key] = { ...treeData[toIndex] }
      setStateExp({ type: ['treeData'], data: { treeData: [...treeData] } })
    }
  })
}
/**
 * 检测是否可拖动到组织架构当前节点
 */
const dragTaskToOrgCheck = (info: any) => {
  const { targetNode, node } = info
  const toInfo = node
  const curNode = targetNode
  const toOrg = getTreeParam(toInfo.key)
  const fromRowData = taskRowDrag.rowData || {}
  // 被拖动任务归属信息
  const fromInfo = $store.getState().taskManageTreeInfo
  const attach = fromRowData.attach || { type: 0 }
  //  不可拖动的情况：我的任务查询的数据||跨企业||拖动到当前所在组织时不需要没有意义，故也限制
  if (
    fromInfo.isMy ||
    toOrg.cmyId != fromRowData.ascriptionId ||
    (toOrg.cmyId == fromRowData.ascriptionId && toOrg.curType == attach.type && toOrg.curId == attach.typeId)
  ) {
    return false
  } else {
    $('#taskOrgTreeOut')
      .find('.drop-over-bg')
      .removeClass('drop-over-bg')
    $(curNode)
      .parents('.ant-tree-treenode')
      .addClass('drop-over-bg')
  }
  return true
}

/**
 * 组织架构hover
 */
export const orgHover = ({ type, targetNode, listMode, changeClass }: any) => {
  // 移入
  if (type == 1) {
    // 显示组织架构
    if (changeClass) {
      targetNode.addClass(changeClass)
    } else {
      targetNode.animate({ width: 240 + 'px' }, 500)
    }
  } else {
    // 隐藏组织架构
    if (changeClass) {
      targetNode.removeClass(changeClass)
    } else {
      targetNode.animate({ width: 0 + 'px' }, 500)
    }
    // 款详情模式下，选择组织架构，将选择企业显示在可视区域
    if (listMode == 1) {
      scrollToAnchor('orgNarrowItem_' + scrollToAnchorDomId)
    }
  }
}
export { OrgSearchList }

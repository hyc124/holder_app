import { Avatar, Button, Checkbox, Dropdown, Input, Progress, Radio, Spin, Table, Tooltip, Tree } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import './index.less'
import React, { useEffect, useImperativeHandle, useReducer, useRef, useState } from 'react'
import { queryTreeData as queryTreeDataApi } from '../../views/workplan/workPlanApi'
import { orgSearchList } from '../../common/js/api-com'
import { getMovePlanList, getTaskListApi, getSubTaskListApi } from './getData'
import NoneData from '@/src/components/none-data/none-data'
import { renderTreeData, getTreeParam } from '../../common/js/tree-com'
import { CaretDownOutlined } from '@ant-design/icons'
import { requestApi } from '../../common/js/ajax'
import InfiniteScroll from 'react-infinite-scroller'
import { setTagByStatus, RoleComponet, TaskTypeTag } from '../../views/task/task-com/TaskCom'
import { TaskManageFilter } from '../../components/filter/filter'
import { tableExpandable } from '../../views/task/taskManage/TaskManageList'
import { SearchOutlined } from '@ant-design/icons'
import $c from 'classnames'

interface ConstraintParam {
  visible: boolean
  nowAccount?: string
  nowUserName?: string
  nowUserId?: number
  allowTeamId?: Array<number | string>
  selectList?: Array<number | string>
  disableList?: Array<number | string>
  disabTaskId?: Array<number | string>
  isshowKR?: boolean
  okrRelevanceType?: number
  title?: string
  contentType?: string
  defaultLevel?: number
  checkboxType?: string
  onSure?: any
  okrAimId?: string | number
  workPlanType?: string | number
  workPlanId?: string | number
  showType?: string | number
  periodId?: string | number
}
interface DataNode {
  title: string
  key: string
  isLeaf?: boolean
  children?: DataNode[]
}

export const ProgressColors = [
  ['#4285f4', '#e9f2ff'],
  ['#34a853', '#cdead5'],
  ['#fbbc05', '#fcecc5'],
  ['#ea4335', '#fad1ce'],
]

// 默认参数
export const defaults: any = {
  nowAccount: '',
  nowUserName: '',
  nowUserId: '',
  allowTeamId: [], //企业集合 用于查询单个企业及多个企业(为空查询所有企业)
  selectList: [], //已选择数据集合 右侧任务及okr
  disableList: [], // 置灰选中的数据集合 右侧任务及okr置灰不被选择
  title: '',
  contentType: 'task', //内容类型 task(选择父级任务) okr选择要支撑的okr
  defaultLevel: 1, //默认查询的层级
  checkboxType: 'radio', //单选：radio，多选:checkbox
  disabTaskId: [], //查询任务列表需要排除的任务id[后台禁用当前及子任务不能选择]
  isshowKR: true, //是否显示KR数据
  okrRelevanceType: 0, //okr列表查询类型：0支撑 1关联 对齐
  okrAimId: '', //当前规划id(用于工作规划查询 Okr列表模式下新增id:okrAimId查询)
  workPlanType: '', //关联任务的类型(关联任务时用于排除当前规划下不可关联的任务)
  workPlanId: '', //关联任务的类型ID(关联任务时用于排除当前规划下不可关联的任务)
  showType: 1, //1是父级任务列表，2是规划关联任务列表
}

//全局公共状态
const publicinitStates = {
  public: {
    isMytissue: true,
    terrObj: {},
  },
}
//state 状态
let refState = false
const initStates = {
  orgLoading: false, //左侧树loading显示状态
  isMytissue: true, //是否选择我的任务及OKR
  trees: {
    treeData: [], //左侧树形结构数据
    allCompanyIds: [], //左侧树所有企业集合
    allCompany: [], //左侧树所有企业对象
    expandedKeys: [], //左侧树默认展开节点
    selectedKeys: [], //左侧树选中的节点
    search: '', //左侧树搜索
  },
  okrs: {
    taskDataList: [], //okr数据列表
    pageNo: 0,
    pageSize: 20,
  },
  tasks: {
    taskDataList: [], //任务数据列表
    pageNo: 0,
    pageSize: 20,
  },
}
// state 初始化管理
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'trees':
      if (refState) {
        refState = false
        //避免设置的时候置空的情况[有状态只更新当前]
        for (const key in action.data) {
          state.trees[key] = action.data[key]
          return { ...state }
        }
      } else {
        return { ...state, trees: action.data }
      }
    case 'orgLoading':
      return { ...state, orgLoading: action.data }
    case 'isMytissue':
      return { ...state, isMytissue: action.data }
    case 'okrs':
      return { ...state, okrs: action.data }
    case 'tasks':
      return { ...state, tasks: action.data }
    default:
      return state
  }
}
//初始化方法
export const initFn = (options: any) => {
  options.nowAccount = $store.getState().nowAccount
  options.nowUserName = $store.getState().nowUser
  options.nowUserId = $store.getState().nowUserId
  if (!options.title) {
    if (options.contentType == 'task') {
      options.title = $intl.get('selectParentTask')
    } else if (options.contentType == 'okr' || options.contentType == 'OKR') {
      options.title = $intl.get('selectOkrToSup')
    }
  }
}
//列表标签处理
export const getDividerLine = (index: number, len: any) => {
  if (index !== len - 1) {
    return '/'
  } else {
    return ''
  }
}

// *************************父级容器组件******************************** //
export const SupportModal = (props: { param: ConstraintParam; action?: any }) => {
  // 外部传入的参数
  const getParam = props.param
  // 外部方法
  const action = props.action
  // 显示隐藏
  const { visible } = getParam
  // 合并参数
  const options = { ...defaults, ...getParam }
  // 点击取消
  const handleCancel = () => {
    action.setModalShow(false)
  }
  // 组件架构容器组件
  const LeftRef: any = useRef({})
  const rirhtRefOKR: any = useRef({})
  const rirhtRefTASK: any = useRef({})
  // 初始化方法
  initFn(options)
  // 点击确定
  const handleOk = () => {
    action.setModalShow(false)
    //获取选中数据
    if (options.contentType == 'okr') {
      action.onSure && action.onSure(rirhtRefOKR.current.GETTASKDATA(), rirhtRefOKR.current.CANCELDATA())
      options.onSure && options.onSure(rirhtRefOKR.current.GETTASKDATA(), rirhtRefOKR.current.CANCELDATA())
    } else if (options.contentType == 'task') {
      action.onSure &&
        action.onSure(
          rirhtRefTASK.current.GETTASKDATA(),
          rirhtRefOKR.current.CANCELDATA && rirhtRefOKR.current.CANCELDATA()
        )
      options.onSure &&
        options.onSure(
          rirhtRefTASK.current.GETTASKDATA(),
          rirhtRefOKR.current.CANCELDATA && rirhtRefOKR.current.CANCELDATA()
        )
    }
  }
  //调用右侧OKR列表查询
  const rightFindOKRlist = (vaules: any, type?: string) => {
    if (options.contentType == 'okr') {
      rirhtRefOKR.current.FINDOKRLIST(vaules, type)
    } else if (options.contentType == 'task') {
      rirhtRefTASK.current.FINDTASKLIST(vaules, type)
    }
  }
  const { langType } = $store.getState()
  return (
    <Modal
      className={`suppotModal ${langType}`}
      width={850}
      visible={visible}
      title={options.title}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      closeIcon={<span className="modal-close-icon"></span>}
      keyboard={false}
      footer={[
        <Button key="back" onClick={handleCancel}>
          {$intl.get('cancel')}
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          {$intl.get('sure')}
        </Button>,
      ]}
    >
      <div className="suppotContent">
        <SuppotLeft ref={LeftRef} options={options} action={{ rightFindOKRlist }} />
        {options.contentType == 'okr' && <SuppotRightOKR ref={rirhtRefOKR} options={options} action={{}} />}
        {options.contentType == 'task' && <SuppotRightTASK ref={rirhtRefTASK} options={options} action={{}} />}
      </div>
    </Modal>
  )
}

// *************************左侧组织架构******************************** //
let treeExpandedKeys: any = []
export const SuppotLeft = React.forwardRef((props: { options?: any; action: any }, ref) => {
  const [state, dispatch] = useReducer(reducer, initStates)
  // 搜索内容
  const [searchList, setSearchList] = useState<any>([])
  // 选中效果
  const [searchActive, setSearchActive] = useState<number>(-1)
  // 是否展示搜索
  const [showsearch, setShowsearch] = useState<boolean>(false)
  // 继承的options参数
  const options = { ...defaults, ...props.options }
  const nowSearchRef = useRef<any>(null)
  useEffect(() => {
    queryTreeFirst()
    publicinitStates.public.isMytissue = true
    publicinitStates.public.terrObj = ''
    // 重置组织架构选中信息
    $store.dispatch({
      type: 'TASKSUPPORTMANAGE_TREEINFO',
      data: { isMy: true, orgInfo: {}, allCompany: [] },
    })
  }, [options.visible])
  //暴露给父组件的方法(useImperativeHandle方法的的第一个参数是目标元素的ref引用) --------------------
  useImperativeHandle(ref, () => ({}))
  // 查询公司列表组织架构
  const queryTreeFirst = () => {
    treeExpandedKeys = []
    const expandedKeys: any = []
    dispatch({ type: 'orgLoading', data: true })
    let params = {}
    let url = ''
    if (options.allowTeamId.length == 0) {
      //查询所有企业
      params = {
        account: options.nowAccount,
        isAllOrg: 1,
        defaultLoginUser: 0,
      }
      url = '/team/permission/findAllEnterpriseTree'
    } else {
      //查询单个企业
      params = {
        id: options.allowTeamId[0],
        type: 2,
        teamId: options.allowTeamId[0],
        account: options.nowAccount,
        permissionType: 3, //数据权限
        isQueryAll: 0,
        inMyself: 1, //是否包含自己
        notAccount: '', //排除账号
        defaultLevel: 1, //默认查询一层
        view: '2#3#31#0#',
      }
      url = '/team/permission/findOneEnterpriseTree'
    }
    requestApi({
      url: url,
      param: params,
      json: true,
      apiType: 'main',
    }).then((res: any) => {
      if (res.success) {
        let data: any = []
        if (options.allowTeamId.length == 0) {
          data = res.data.dataList || []
        } else {
          data.push(res.data.data || [])
        }
        const allCompanyIds: any = [],
          allCompany: any = []
        data.map((item: any) => {
          allCompanyIds.push(item.id)
          allCompany.push(item)
        })
        const newDataList = renderTreeData(
          {
            array: data,
            idKey: 'id',
            nameKey: 'name',
          },
          {
            fromType: 'supportModal',
            isCount: true, //显示统计
            expandedKeys: expandedKeys,
            setExpandedKeys: (thisKey: string) => {
              refState = true
              const getKeys: any = state.trees.expandedKeys || []
              const index = getKeys.indexOf(thisKey)
              if (index == -1) {
                getKeys.push(thisKey)
              } else {
                getKeys.splice(index, 1)
              }
              dispatch({
                type: 'trees',
                data: {
                  expandedKeys: [...getKeys],
                },
              })
            },
          }
        )
        dispatch({
          type: 'trees',
          data: {
            treeData: [...newDataList],
            allCompanyIds: allCompanyIds,
            allCompany: allCompany,
            expandedKeys: expandedKeys,
            search: '',
          },
        })
        dispatch({ type: 'orgLoading', data: false })
        // 更新组织架构全局存储信息
        $store.dispatch({
          type: 'TASKSUPPORTMANAGE_TREEINFO',
          data: { isMy: true, orgInfo: {}, allCompany: allCompany },
        })
      }
    })
  }
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
  // 树形组件事件
  const updateTreeData = (list: any, key: React.Key, children: DataNode[]) => {
    return list.map((node: any) => {
      if (node.key === key) {
        node.children = children
      } else if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children || [], key, children),
        }
      }
      return node
    })
  }
  // 点击查询组织架构子级
  const queryTreeChild = (treeNode: any, resolve?: () => void) => {
    const { treeData } = state.trees
    const treeInfo: any = getTreeParam(treeNode.key)
    dispatch({ type: 'orgLoading', data: true })
    const param: any = {
      id: treeInfo.curId,
      type: treeInfo.curType,
      account: options.nowAccount,
      isAllOrg: 0,
      teamId: treeInfo.cmyId,
    }
    queryTreeDataApi(param).then(res => {
      const data = res.data
      if (res.success) {
        const newDataList = renderTreeData(
          {
            array: data,
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
            fromType: 'supportModal',
            isCount: true, //显示统计
          }
        )
        if (resolve) {
          updateTreeData(treeData || [], treeNode.key, newDataList)
          dispatch({
            type: 'trees',
            data: {
              ...state.trees,
              treeData: [...treeData],
              expandedKeys: treeExpandedKeys,
            },
          })
          resolve()
          dispatch({ type: 'orgLoading', data: false })
        }
      }
    })
  }
  /**
   * 点击组织架构展开收起节点设置默认expandedKeys:展开节点
   * @param checkedKeys
   * @param e
   * @param attachInfo
   */
  const onExpand = (expandedKeys: any, e: { expanded: boolean; node: any }) => {
    const getExpandedKeys = expandedKeys
    treeExpandedKeys = [...expandedKeys]
    if (e.expanded) {
      getExpandedKeys.push(e.node.key)
    } else {
      for (const i in getExpandedKeys) {
        if (getExpandedKeys[i] == e.node.key) {
          getExpandedKeys.splice(i, 1)
          break
        }
      }
    }
    if (e.node.children.length > 0) {
      dispatch({
        type: 'trees',
        data: {
          ...state.trees,
          expandedKeys: getExpandedKeys,
        },
      })
    }
  }
  /**
   * 选中树节点时
   */
  const onSelect = (
    selectedKeys: any,
    e: { selected: boolean; selectedNodes: any; node: any; event: any }
  ): Promise<void> => {
    return new Promise(() => {
      if (e.selected) {
        const treeInfo = getTreeParam(e.node.key)
        dispatch({
          type: 'trees',
          data: {
            ...state.trees,
            selectedKeys: selectedKeys,
          },
        })
        dispatch({ type: 'isMytissue', data: false })
        publicinitStates.public.isMytissue = false
        publicinitStates.public.terrObj = treeInfo
        //通过回调函数调用右侧暴露的查询方法
        props.action.rightFindOKRlist(selectedKeys[0])
        $store.dispatch({ type: 'TASKSUPPORTMANAGE_TREEINFO', data: { isMy: false, orgInfo: treeInfo } })
      }
    })
  }
  //选中我的任务
  const myPlanChange = () => {
    dispatch({
      type: 'trees',
      data: {
        ...state.trees,
        selectedKeys: '',
      },
    })
    dispatch({ type: 'isMytissue', data: true })
    publicinitStates.public.isMytissue = true
    publicinitStates.public.terrObj = ''
    //通过回调函数调用右侧暴露的查询方法
    props.action.rightFindOKRlist('')
    // 取消选中树节点
    $store.dispatch({
      type: 'TASKSUPPORTMANAGE_TREEINFO',
      data: { isMy: true, orgInfo: {}, allCompany: state.trees.allCompany },
    })
  }
  //选中搜索内容
  const searchSelectPitch = (thisNodeId: any) => {
    const treeInfo = getTreeParam(thisNodeId)
    publicinitStates.public.isMytissue = false
    publicinitStates.public.terrObj = treeInfo
    $store.dispatch({ type: 'TASKSUPPORTMANAGE_TREEINFO', data: { isMy: false, orgInfo: treeInfo } })
    props.action.rightFindOKRlist(thisNodeId, 'search')
  }
  //组织架构搜索
  const orgsearchSelect = (value: string) => {
    if (value !== '') {
      setSearchActive(-1)
      querySearchList(value)
      setShowsearch(true)
    } else {
      setShowsearch(false)
    }
  }
  //组织架构搜索接口
  const querySearchList = (value: string) => {
    const param = {
      keywords: value,
      orgIds: state.trees.allCompanyIds,
    }
    orgSearchList(param).then((res: any) => {
      if (res) {
        setSearchList(res.data.dataList || [])
      }
    })
  }
  //搜索内容展示
  const OrgsearchView = () => {
    return (
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
            for (const i in state.trees.allCompany) {
              const item = state.trees.allCompany[i]
              if (item.id == cmyId) {
                cmyName = item.name || ''
                break
              }
            }
            const showTxt = `${cmyName ? cmyName + '-' : ''}${departName ? departName + '-' : ''}${
              roleName ? roleName + '-' : ''
            }${item.username}`
            const thisNodeId = `account_${item.id}_0_${item.username}@parentId_${departId}_3_${departName}@company_${cmyId}_2_${cmyName}@role_${roleId}_31_${roleName}`

            return (
              <Tooltip key={i} placement="top" title={showTxt}>
                <li
                  className={`${searchActive == i ? 'active' : ''}`}
                  key={i}
                  onClick={() => {
                    setSearchActive(i)
                    searchSelectPitch(thisNodeId)
                  }}
                >
                  {showTxt}
                </li>
              </Tooltip>
            )
          })}
      </ul>
    )
  }
  return (
    <Spin spinning={state.orgLoading} tip={$intl.get('loadingWait')}>
      <div className="suppotLeft">
        <div className="orgSearchList">
          <Input
            ref={nowSearchRef}
            placeholder={$intl.get('reg_name_msg', { correct: '' })}
            className="org_menu_search  baseInput radius16 border0 bg_gray"
            prefix={
              <SearchOutlined
                onClick={(value: any) => {
                  orgsearchSelect(nowSearchRef.current.state.value)
                }}
              />
            }
            defaultValue=""
            onKeyUp={(e: any) => {
              const searchVal = e.target.value
              if (e.keyCode == 13) {
                orgsearchSelect(searchVal)
              }
            }}
          />
          <div className={`orgSearchContent ${!showsearch ? 'hide' : 'z'}`}>
            {searchList.length > 0 ? (
              <OrgsearchView />
            ) : (
              <NoneData
                searchValue={nowSearchRef.current ? nowSearchRef.current.state.value : ''}
                imgSrc={$tools.asAssetsPath(`/images/noData/no_task_org_child.png`)}
                containerStyle={{ marginTop: 40 }}
                imgStyle={{ width: 100, height: 100 }}
              />
            )}
          </div>
        </div>
        <div className={`suppotBotScroll ${showsearch ? 'hide' : ''}`}>
          <div className={`suppotMecon ${state.isMytissue ? 'org_my_active' : ''}`} onClick={myPlanChange}>
            <em className="img_icon org_my_icon"></em>
            <span className="suppotMe">
              {options.contentType == 'task' ? $intl.get('myTask') : $intl.get('myOKR')}
            </span>
          </div>
          <Tree
            loadData={onLoadData}
            treeData={state.trees.treeData}
            onSelect={onSelect}
            onExpand={onExpand}
            expandedKeys={state.trees.expandedKeys}
            blockNode={true}
            selectedKeys={state.trees.selectedKeys}
            switcherIcon={<CaretDownOutlined />}
            className={`leftOrgTree baseOrgTree ${state.trees.search ? 'forcedHide' : ''}`}
          />
        </div>
      </div>
    </Spin>
  )
})

// *************************右侧OKR******************************** //
export const SuppotRightOKR = React.forwardRef((props: { options?: any; action: any }, ref) => {
  // 继承的options参数
  const options = { ...defaults, ...props.options }
  const [state, dispatch] = useReducer(reducer, initStates)
  //搜索框
  const nowSearchRef = useRef<any>(null)
  //展开行
  const [expandedRowKey, setExpandedRowKey] = useState<string[]>([])
  //加载
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  //滚动分页参数声明 加载loading
  // const [listPageNo, setListPageNo] = useState(0)
  // const [totalPages, setTotalPages] = useState(0)
  const [okrPage, setokrPage] = useState<any>({
    listPageNo: 0,
    totalPages: 0,
  })
  //选中OKR行数据
  const [selecteddata, setSelecteddata] = useState<any>([])
  //取消选中的数据
  const [canceldata, setcanceldata] = useState<any>([])
  //默认选中数据
  const [selectListOKR, setSelectListOKR] = useState<any>()
  //默认禁用选中数据
  // const [hideSelectAlls, sethideSelectAlls] = useState<any>()
  //筛选
  const [filterlist, setfilterlist] = useState<any>({
    statusList: [1, 3, 4],
    keyword: '',
  })
  //暴露给父组件的方法(useImperativeHandle方法的的第一个参数是目标元素的ref引用) --------------------
  useImperativeHandle(ref, () => ({
    //返回给父组件的方法(左侧选中时调用)
    FINDOKRLIST: (vaule: any, type?: string) => {
      //初始化
      information()
      setExpandedRowKey([])
      movePlanList('init', null, type)
    },
    //选中的数据
    GETTASKDATA: () => {
      return selecteddata
    },
    //取消的数据
    CANCELDATA: () => {
      return canceldata
    },
  }))
  useEffect(() => {
    if (okrPage.listPageNo > 0) {
      movePlanList('init', null)
    }
  }, [okrPage.listPageNo])

  useEffect(() => {
    //初始化
    information()
    movePlanList('init', null)
    setSelectListOKR(options.selectList)
    // sethideSelectAlls(options.disableList)
  }, [options.visible])

  //初始化
  const information = () => {
    okrPage.listPageNo = 0
    okrPage.totalPages = 0
    setokrPage({
      listPageNo: 0,
      totalPages: 0,
    })
    dispatch({
      type: 'okrs',
      data: {
        ...state.okrs,
        pageNo: 0,
        pageSize: 20,
        taskDataList: [],
      },
    })
    if (okrPage.listPageNo === 0) {
      setHasMore(true)
    }
  }

  //查询移动规划列表
  const movePlanList = (type: string, datas: any, queryType?: string) => {
    let _okrAimId: any = undefined
    let _mySelf: any = publicinitStates.public.isMytissue ? 1 : 0
    if (queryType == 'search') {
      _mySelf = 0
    }
    const terrObj: any = publicinitStates.public.terrObj
    if (options.okrAimId) {
      _okrAimId = options.okrAimId
    }
    let params: any = {
      operateUser: options.nowUserId,
      pageNo: okrPage.listPageNo,
      pageSize: 20,
      keyword: filterlist.keyword,
      status: filterlist.statusList,
      queryType: options.okrRelevanceType, //查询类型：0支撑 1关联 对齐
      id: _okrAimId,
      mySelf: _mySelf,
      periodId: options.periodId, //查询类型周期id
    }
    if (type == 'expand') {
      params = {
        parentId: datas.key,
        operateUser: options.nowUserId,
        queryType: options.okrRelevanceType, //查询类型：0支撑 1关联 对齐
        id: _okrAimId,
        mySelf: _mySelf,
      }
    }
    if (!publicinitStates.public.isMytissue) {
      //选择组织架构
      params.ascriptionType = terrObj.curType
      params.ascriptionId = terrObj.curId
      params.mySelf = 0
      if (terrObj.curType == 0) {
        params.deptId = terrObj.parentId
      }
    } else {
      params.mySelf = 1
    }

    // 需求变更，都需添加企业id查询数据
    params.teamId = options.allowTeamId[0]

    setLoading(true)
    getMovePlanList(params).then((redData: any) => {
      const contentData = redData.data.content
      okrPage.totalPages = redData.data.totalPages
      setokrPage({
        listPageNo: okrPage.listPageNo,
        totalPages: redData.data.totalPages,
      })
      const newTableData: any = []
      let _childLevel = false
      if (type == 'expand') {
        _childLevel = true
      }
      contentData.map((item: any) => {
        if (!options.isshowKR) {
          //不显示KR数据
          if (item.type == 2) {
            newTableData.push(newTableDataFn(item, datas, type, _childLevel))
          }
        } else {
          newTableData.push(newTableDataFn(item, datas, type, _childLevel))
        }
      })
      if (type == 'init') {
        //默认
        if (okrPage.listPageNo > 0) {
          //滚动加载
          dispatch({
            type: 'okrs',
            data: {
              pageNo: okrPage.listPageNo,
              pageSize: 20,
              taskDataList: [...state.okrs.taskDataList, ...newTableData],
            },
          })
        } else {
          dispatch({
            type: 'okrs',
            data: {
              pageNo: okrPage.listPageNo,
              pageSize: 20,
              taskDataList: [...newTableData],
            },
          })
        }
      } else {
        //展开
        const newTable = state.okrs.taskDataList.concat([])
        updateTaskData(newTable, datas.key, datas.isParentId, newTableData)
        dispatch({
          type: 'okrs',
          data: {
            pageNo: okrPage.listPageNo,
            pageSize: 20,
            taskDataList: newTable,
          },
        })
      }
      setLoading(false)
    })
  }

  //设置table数据格式
  //childLevel是否为子任务 除了第一层都是子任务
  const newTableDataFn = (item: any, datas?: any, type?: string, childLevel?: any) => {
    let mindID = ''
    let _children: any = item.children || []
    let _hasChild: any = item.hasChild
    if (!item.mainId && datas) {
      mindID = datas.mainId
    } else {
      mindID = item.mainId
    }
    if (!options.isshowKR) {
      _children = undefined
      _hasChild = undefined
    } else {
      if (item.children) {
        _children = []
      }
    }
    return {
      key: item.id,
      mainId: mindID,
      taskName: item.name,
      status: item.status,
      type: item.type,
      cci: item.cci,
      typeId: item.typeId,
      ascriptionId: item.ascriptionId,
      nodeText: item.nodeText,
      isParent: type == 'init' ? true : false,
      isParentId: type == 'init' ? item.id : false,
      parent: item.parentId,
      isDisabled: options.disableList.some((value: any, index: number) => value == item.id), //禁用
      liableUser: {
        liableUserProfile: item.liableUserProfile,
        user: item.liableUser,
        liableUsername: item.liableUsername,
        createUsername: item.createUsername,
      },
      progress: {
        percent: item.process || 0,
      },
      roleId: item.roleId,
      startTime: item.startTime,
      endTime: item.endTime,
      day: item.day,
      taskType: item.taskType,
      subTaskCount: _hasChild,
      children: _children,
      childLevel: childLevel,
      periodText: item.periodText,
      periodId: item.periodId,
    }
  }

  //递归插入任务列表子元素
  const updateTaskData = (tableData: any, parentId: number, isParentId: number, childData: any) => {
    tableData.find((item: any) => {
      if (item.key === parentId) {
        item.children = childData
        childData.find((items: any) => {
          //给子元素添加父级ID
          items.isParentId = isParentId
        })
        return tableData
      }
      if (item.children && item.children.length > 0) {
        updateTaskData(item.children, parentId, isParentId, childData)
      }
    })
  }

  //设置时间
  const settimes = (time: any) => {
    let timeText = ''
    if (time) {
      timeText = `${new Date(time).getMonth() + 1}/${new Date(time).getDate()}`
    } else {
      timeText = '/'
    }
    return timeText
  }
  // 初始化列
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
  const columns: any = [
    {
      title: $intl.get('taskNames'),
      dataIndex: 'taskName',
      key: 'taskName',
      render: (record: globalInterface.WorkPlanTaskProps, item: any) => {
        let okrFlag = null
        if (item.type == 2 || item.type == 3) {
          const okrTxt = item.type == 2 ? 'O' : 'KR'
          const okrClass = item.type == 2 ? 'okr_o' : 'okr_kr'
          okrFlag = <div className={`okr_flag ${okrClass}`}>{okrTxt}</div>
        }
        const userName = item.liableUser.liableUsername ? item.liableUser.liableUsername : ''
        let userIcon = item.liableUser.liableUserProfile
        if (!item.liableUser.liableUserProfile && !userName) {
          userIcon = headDef
        }
        return (
          <div data-ids={item.typeId} data-mindid={item.mainId} data-type={item.type} className="movemindrow">
            <div className={`comUserHead`}>
              <Avatar
                className="oa-avatar"
                src={userIcon}
                size={32}
                style={userName ? {} : { backgroundColor: '#9A9AA2' }}
              >
                {userName && userName.substr(-2, 2)}
              </Avatar>
            </div>
            <div className="row_content flex_auto">
              <div className="plan_cont_top flex ver_center">
                {okrFlag}
                <span className="plan_name my_ellipsis">{item.taskName}</span>
                <span className={`${item.type == 3 ? '' : 'noshow'} plan_cci plan_cci_confidence `}>
                  {item.cci || 0}/10
                </span>
              </div>
              <div className="plan_cont_bot">
                <span className={`belong_name ${item.nodeText ? '' : 'noshow'}`}>{item.nodeText || ''}</span>
                <span className="plan_time">
                  {settimes(item.startTime)} - {settimes(item.endTime)}
                </span>
                <div className="remain_time">{$intl.getHTML('numDaysLeft', { day: item.day || 0 })}</div>
              </div>
            </div>
          </div>
        )
      },
      onCell: (rowData: any, rowIndex: number) => ({
        rowData,
        rowIndex,
        colIndex: 0,
      }),
    },
    {
      title: $intl.get('taskProgress'),
      dataIndex: 'progress',
      width: '36px',
      key: 'progress',
      render: (progress: any) => {
        //是否显示进度条
        if (progress.percent) {
          const colorIndex = 0
          //进度条的色彩
          const strokeColor = ProgressColors[colorIndex][0]
          //未完成的分段的颜色
          const trailColor = ProgressColors[colorIndex][1]
          return (
            <div style={{ width: 36, textAlign: 'center' }}>
              <Progress
                strokeColor={strokeColor}
                trailColor={trailColor}
                type={'circle'}
                percent={progress.percent}
                width={32}
                strokeWidth={12}
                format={percent => `${percent}`}
              ></Progress>
            </div>
          )
        } else {
          return <div style={{ width: 36, textAlign: 'center' }}>-/-</div>
        }
      },
    },
  ]

  //滚动加载
  const handleInfiniteOnLoad = () => {
    setLoading(true)
    if (okrPage.listPageNo + 1 >= okrPage.totalPages) {
      setLoading(false)
      setHasMore(false)
      return
    }
    okrPage.listPageNo = okrPage.listPageNo + 1
    setokrPage({
      totalPages: okrPage.totalPages,
      listPageNo: okrPage.listPageNo,
    })
  }

  //设置行名称
  const setRowClassName = (record: any) => {
    if (record.subTaskCount === 0) {
      return 'noExpandable'
    } else {
      return ''
    }
  }

  //展开行
  const expandedRow = (expanded: any, record: any) => {
    if (expanded) {
      expandedRowKey.push(record.key)
      setExpandedRowKey([...expandedRowKey])
    } else {
      const expandedRow = expandedRowKey.filter(RowKey => RowKey != record.key)
      setExpandedRowKey(expandedRow)
    }
    if (record.children && record.children.length > 0) {
      return
    }
    movePlanList('expand', record)
  }

  /**
   * 选中/取消选中
   * @param selectedRowKeys
   * @param selectedRows
   */
  const checkedChange = (selectedRowKeys: any, selectedRows: any, attachInfo?: any) => {
    const attachObj = attachInfo ? attachInfo : {}
    const { checked, changeRow } = attachObj
    const newselectedRows: any = []
    selectedRows.map((item: any, index: number) => {
      const liableUser = typeof item.liableUser == 'object' ? item.liableUser : null
      newselectedRows.push({
        ...item,
        id: item.key,
        name: item.taskName,
        liableUserProfile: liableUser ? liableUser.liableUserProfile : item.liableUserProfile,
        liableUser: liableUser ? liableUser.user : item.liableUser,
        liableUsername: liableUser ? liableUser.liableUsername : item.liableUsername,
      })
    })
    setSelecteddata(newselectedRows)
    setSelectListOKR(selectedRowKeys)
    if (!checked) {
      canceldata.push({ id: changeRow.key })
      //取消选中
      setcanceldata([...canceldata])
    }
  }
  //点击选择移动规划行存储数据
  const rowSelection = {
    onChange: checkedChange,
    getCheckboxProps: (record: any) => ({
      disabled: record.isDisabled,
    }),
    onSelect: (record: any, selected: any, selectedRows: any, nativeEvent: any) => {
      if (!selected) {
        canceldata.push({ id: record.key })
        //取消选中
        setcanceldata([...canceldata])
      }
    },
    renderCell: (_: any, record: any) => {
      return (
        <CheckboxCom
          key={record.id}
          record={record}
          options={options || {}}
          selectedRows={selecteddata}
          selectedRowKeys={selectListOKR}
          onChange={checkedChange}
        />
      )
    },
  }

  //搜索
  const orgsearchSelect = (value: string) => {
    filterlist.keyword = value
    setfilterlist({
      ...filterlist,
      keyword: value,
    })
    information()
    movePlanList('init', null, 'search')
  }

  //筛选回调函数
  const afterFilter = (filterObj: any) => {
    filterlist.statusList = filterObj.statusList
    filterlist.keyword = filterObj.searchVal
    setfilterlist({
      ...filterlist,
      statusList: [...filterObj.statusList],
      keyword: filterObj.searchVal,
    })
    information()
    movePlanList('init', null)
  }
  /**
   * 表格集成组件(覆盖默认的 table 元素 修改表格线条样式)
   */
  const components = {
    body: {
      cell: bleBodyCell,
    },
  }
  return (
    <div className="suppotokrcontent">
      <div className="okrSearchList">
        {/* 高级筛选 */}
        {/* <PlanFilterModule afterFilter={afterFilter} type={1} showSearch={false} /> */}
        <Input
          placeholder={$intl.get('searchValue')}
          ref={nowSearchRef}
          className="org_menu_search baseInput radius16 border0 bg_gray"
          prefix={
            <SearchOutlined
              onClick={(value: any) => {
                orgsearchSelect(nowSearchRef.current.state.value)
              }}
            />
          }
          defaultValue=""
          onKeyUp={(e: any) => {
            const searchVal = e.target.value
            if (e.keyCode == 13) {
              orgsearchSelect(searchVal)
            }
          }}
        />
      </div>
      <Spin spinning={loading} tip={$intl.get('loadingWait')}>
        <div className="support-table-list commonRetract">
          {!state.tasks.taskDataList || state.okrs.taskDataList.length == 0 ? (
            <NoneData
              searchValue={nowSearchRef.current ? nowSearchRef.current.state.value : ''}
              imgSrc={$tools.asAssetsPath(`/images/noData/no_task_org_child.png`)}
              imgStyle={{ width: 100, height: 100 }}
            />
          ) : (
            <InfiniteScroll
              initialLoad={false} // 不让它进入直接加载
              pageStart={0} // 设置初始化请求的页数
              hasMore={!loading && hasMore} // 是否继续监听滚动事件 true 监听 | false 不再监听
              loadMore={handleInfiniteOnLoad} // 监听的ajax请求
              useWindow={false} // 不监听 window 滚动条
            >
              <Table
                columns={columns}
                dataSource={state.okrs.taskDataList}
                showHeader={false}
                onExpand={expandedRow}
                tableLayout={'fixed'}
                rowClassName={setRowClassName}
                expandedRowKeys={expandedRowKey}
                pagination={false}
                expandable={tableExpandable} //修改子任务样式线条
                components={components}
                rowSelection={{
                  ...rowSelection,
                  type: options.checkboxType,
                  selectedRowKeys: selectListOKR,
                  columnWidth: 34,
                }}
                onRow={() => ({
                  onClick: (event: any) => {
                    event.stopPropagation()
                  },
                })}
              />
            </InfiniteScroll>
          )}
        </div>
      </Spin>
    </div>
  )
})

// *************************右侧任务******************************** //
// 标签筛选 >>>>>>>>>>>
// 所有任务标签初始值定义
const taskTypeAll = {
  code: -1,
  name: '所有任务',
  active: true,
  type: 'all',
}
// 初始状态值
const stateTmp = {
  taskTypeOut: [taskTypeAll],
  taskTypeMore: [],
}
// 缓存外部标签数据
let outTags: any[] = []
// 缓存内部标签数据
let moreTags: any[] = []
//筛选是否需要初始化
let listInit = true
export const SuppotRightTASK = React.forwardRef((props: { options?: any; action: any }, ref) => {
  // 继承的options参数
  taskTypeAll.name = $intl.get('allTask')
  const options = { ...defaults, ...props.options }
  const [state, dispatch] = useReducer(reducer, initStates)
  //展开行
  const [expandedRowKey, setExpandedRowKey] = useState<string[]>([])
  // 搜索框
  const searchRef = useRef<any>(null)
  //加载
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [checktip2, setCheckTip2] = useState(true)
  const [checktip, setCheckTip] = useState(true)
  //滚动分页参数声明 加载loading
  // const [listPageNo, setListPageNo] = useState(0)
  // const [totalPages, setTotalPages] = useState(0)
  const [taskPage, setTaskPage] = useState<any>({
    listPageNo: 0,
    totalPages: 0,
  })
  //默认选中数据
  const [selectListtask, setSelectListtask] = useState<any>()
  //选中OKR行数据
  const [selecteddata, setSelecteddata] = useState<any>([])
  //筛选
  const [fliterObj, setFliterObj] = useState<any>({
    taskType: [-1], //任务类型(所有任务/类型任务/目标任务)
    taskTypeTags: [], //任务标签
    level: 0, //任务层级
    startTime: '',
    endTime: '',
    keyword: '',
    tagKeyword: '', //标签关键字(工作台)
    noReport: 0, //是否为无汇报任务
    star: [], //星级筛选
    ascriptionLevel: [], //级别筛选(企业级、部门级、岗位级)
    departLevel: [], //部门筛选
    status: [], //任务状态(审核中/延迟/所有/)
  })

  //标签筛选
  const [taskState, setTaskState] = useState<any>(stateTmp)

  useEffect(() => {
    setSelectListtask(options.selectList)
    information()
    findTaskList('init')
    listInit = true
    // 查询任务类型标签
    queryTaskTypeInit()
  }, [options.visible])

  useEffect(() => {
    if (taskPage.listPageNo > 0) {
      findTaskList('init', null)
    }
  }, [taskPage.listPageNo])

  //暴露给父组件的方法(useImperativeHandle方法的的第一个参数是目标元素的ref引用) --------------------
  useImperativeHandle(ref, () => ({
    //返回给父组件的方法(左侧选中时调用)
    FINDTASKLIST: (vaule: any, type?: string) => {
      information()
      setCheckTip(true)
      setExpandedRowKey([])
      findTaskList('init', type)
      listInit = true
      // 查询任务类型标签
      queryTaskTypeInit()
    },
    GETTASKDATA: () => {
      return selecteddata
    },
  }))

  //初始化
  const information = () => {
    taskPage.listPageNo = 0
    taskPage.totalPages = 0
    setTaskPage({
      listPageNo: 0,
      totalPages: 0,
    })
    dispatch({
      type: 'tasks',
      data: {
        ...state.tasks,
        pageNo: 0,
        pageSize: 20,
        taskDataList: [],
      },
    })
    if (taskPage.listPageNo === 0) {
      setHasMore(true)
    }
    fliterObj.taskType = [-1] //任务类型(所有任务/类型任务/目标任务)
    fliterObj.taskTypeTags = [] //任务标签
    fliterObj.level = 0 //任务层级
    fliterObj.startTime = ''
    fliterObj.endTime = ''
    fliterObj.keyword = ''
    fliterObj.tagKeyword = '' //标签关键字(工作台)
    fliterObj.noReport = 0 //是否为无汇报任务
    fliterObj.star = [] //星级筛选
    fliterObj.ascriptionLevel = [] //级别筛选(企业级、部门级、岗位级)
    fliterObj.departLevel = [] //部门筛选
    fliterObj.status = [] //任务状态(审核中/延迟/所有/)
    setFliterObj({
      ...fliterObj,
    })
  }

  //设置行名称
  const setRowClassName = (record: any) => {
    if (record.subTaskCount === 0) {
      return 'noExpandable'
    } else {
      return ''
    }
  }

  //展开行
  const expandedRow = (expanded: any, record: any) => {
    if (expanded) {
      expandedRowKey.push(record.key)
      setExpandedRowKey([...expandedRowKey])
    } else {
      const expandedRow = expandedRowKey.filter(RowKey => RowKey != record.key)
      setExpandedRowKey(expandedRow)
    }
    if (record.children && record.children.length > 0) {
      return
    }
    findSubTaskList('expand', record)
  }

  /**
   * 选中/取消选中
   * @param selectedRowKeys
   * @param selectedRows
   */
  const checkedChange = (selectedRowKeys: any, selectedRows: any) => {
    setSelecteddata(selectedRows)
    setSelectListtask(selectedRowKeys)
  }
  //点击选择移动规划行存储数据
  const rowSelection = {
    onChange: checkedChange,
    getCheckboxProps: (record: any) => ({
      disabled: record.isDisabled,
    }),
    renderCell: (_: any, record: any) => {
      return (
        <CheckboxCom
          key={record.id}
          record={record}
          options={options || {}}
          selectedRowKeys={selectListtask}
          selectedRows={selecteddata}
          onChange={checkedChange}
        />
      )
    },
  }

  //滚动加载
  const handleInfiniteOnLoad = () => {
    setLoading(true)
    if (taskPage.listPageNo + 1 >= taskPage.totalPages) {
      setLoading(false)
      setHasMore(false)
      return
    }
    taskPage.listPageNo = taskPage.listPageNo + 1
    setTaskPage({
      totalPages: taskPage.totalPages,
      listPageNo: taskPage.listPageNo,
    })
  }

  //任务列表查询
  const findTaskList = (type: string, datas?: any) => {
    setLoading(true)
    const terrObj: any = publicinitStates.public.terrObj
    let selectTypeId: any = ''
    let selectType = 0
    let _userId = ''
    let enterpriseId: any = ''
    if (publicinitStates.public.isMytissue && datas != 'search') {
      //选择我的任务
      _userId = options.nowUserId
      selectTypeId = options.allowTeamId[0]
      enterpriseId = options.allowTeamId[0]
    } else {
      //选择组织架构
      selectType = terrObj.curType
      selectTypeId = terrObj.curId
      enterpriseId = terrObj.cmyId
      //选人的时候才传userId
      if (selectType == 0) {
        selectType = 3
        _userId = terrObj.curId
        selectTypeId = terrObj.parentId
      }
    }
    const param: any = {
      showType: options.showType, //1是父级任务列表，2是规划关联任务列表
      taskType: fliterObj.taskType, //任务类型(所有任务/类型任务/目标任务)
      tagIds: fliterObj.taskTypeTags, //任务标签(自定义标签)
      type: selectType,
      id: selectTypeId,
      enterpriseId: enterpriseId, //企业id，查询我的任务时传0
      userId: _userId,
      loginUserId: options.nowUserId,
      account: options.nowAccount,
      pageNo: taskPage.listPageNo || 0,
      pageSize: state.tasks.pageSize,
      level: fliterObj.level, //层级
      startTime: fliterObj.startTime,
      endTime: fliterObj.endTime,
      keyword: fliterObj.keyword,
      tagKeyword: fliterObj.tagKeyword, //标签关键字(工作台)
      noReport: fliterObj.noReport, //无汇报任务
      star: fliterObj.star, //星级筛选(优先级)
      ascriptionLevel: fliterObj.ascriptionLevel, //级别筛选(企业级、部门级、岗位级)
      departLevel: fliterObj.departLevel, //部门筛选
      status: fliterObj.status.length > 0 ? fliterObj.status : undefined, //任务状态
      excludeTaskId: options.disabTaskId[0], // 选择父任务的列表中，加入参数excludeTaskId，需要排除的任务id
    }
    if (options.workPlanType) {
      param.workPlanType = options.workPlanType
      param.workPlanId = options.workPlanId
    }
    getTaskListApi(param).then((redData: any) => {
      const contentList = redData.data.content || []
      taskPage.totalPages = redData.data.totalPages
      setTaskPage({
        listPageNo: taskPage.listPageNo,
        totalPages: redData.data.totalPages,
      })
      const newTableData: any = []
      if (type == 'init') {
        contentList.map((item: any) => {
          newTableData.push(newTableDataFn(item))
        })
        if (taskPage.listPageNo > 0) {
          //滚动加载
          dispatch({
            type: 'tasks',
            data: {
              pageNo: taskPage.listPageNo,
              pageSize: 20,
              taskDataList: [...state.tasks.taskDataList, ...newTableData],
            },
          })
        } else {
          //默认
          dispatch({
            type: 'tasks',
            data: {
              pageNo: taskPage.listPageNo,
              pageSize: 20,
              taskDataList: [...newTableData],
            },
          })
        }
      }
      setLoading(false)
    })
  }

  //查询子任务
  const findSubTaskList = (type: string, datas: any) => {
    setLoading(true)
    if (type == 'expand') {
      const param = {
        taskId: datas.key,
        loginUserId: options.nowUserId,
        excludeTaskId: options.disabTaskId[0], // 选择父任务的列表中，加入参数excludeTaskId，需要排除的任务id
        showType: options.showType, //1是父级任务列表，2是规划关联任务列表
      }
      getSubTaskListApi(param).then((redData: any) => {
        //展开
        const childData = redData.dataList || []
        const newList = updateTreeChild(state.tasks.taskDataList, {
          findId: datas.key,
          children: childData,
        })
        dispatch({
          type: 'tasks',
          data: {
            pageNo: taskPage.listPageNo,
            pageSize: 20,
            taskDataList: [...newList],
          },
        })
        setLoading(false)
      })
    }
  }

  //设置数据格式
  //childLevel是否为子任务 除了第一层都是子任务
  const newTableDataFn = (item: any, childLevel?: any) => {
    return {
      ...item,
      key: item.id,
      childLevel: childLevel,
      isDisabled: options.disableList.some((value: any, index: number) => value == item.id) || item.isSelect, //禁用
      children: item.subTaskCount > 0 ? [] : null,
    }
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
        const children: any = []
        attachObj.children.map((item: any) => {
          children.push(newTableDataFn(item, true))
        })
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

  // 初始化列
  const columns: any = [
    {
      title: $intl.get('taskNames'),
      dataIndex: 'taskName',
      key: 'taskName',
      render: (record: any, item: any) => {
        return <div>{ColumnTaskName(item)}</div>
      },
      onCell: (rowData: any, rowIndex: number) => ({
        rowData,
        rowIndex,
        colIndex: 0,
      }),
    },
    {
      title: $intl.get('taskProgress'),
      dataIndex: 'progress',
      width: '36px',
      key: 'progress',
      render: (progress: any) => {
        //是否显示进度条
        if (progress.percent) {
          const colorIndex = 0
          //进度条的色彩
          const strokeColor = ProgressColors[colorIndex][0]
          //未完成的分段的颜色
          const trailColor = ProgressColors[colorIndex][1]
          return (
            <div style={{ width: 36, textAlign: 'center' }}>
              <Progress
                strokeColor={strokeColor}
                trailColor={trailColor}
                type={'circle'}
                percent={progress.percent}
                width={32}
                strokeWidth={12}
                format={percent => `${percent}`}
              ></Progress>
            </div>
          )
        } else {
          return <div style={{ width: 36, textAlign: 'center' }}>-/-</div>
        }
      },
    },
  ]

  //表格右键操作优化START 列渲染抽离
  //1.任务名称模块
  const ColumnTaskName = (record: globalInterface.TaskListProps) => {
    return (
      <div
        className={$c('flex center-v text-ellipsis')}
        style={{
          display: 'flex',
          paddingLeft: '0px',
        }}
      >
        <div className={$c('task-list-item larg', { finishedTask: record.status === 2 })}>
          <div className="item_top">
            {record.icon && (
              <img className="boardTaskLabel" src={$tools.asAssetsPath(`/images/task/${record.icon}.png`)} />
            )}
            <span className="task-title text-ellipsis">{record.name}</span>

            {setTagByStatus(record)}
          </div>
          <div>
            <TaskTypeTag className="task-type-tag-surrport" type={record.type} />
            <RoleComponet params={{ code: record.maxRole }} />
            {record.tagList && record.tagList.length !== 0 && (
              <div className="com-tag-content">
                {record.tagList.map((item: any, index: number) => (
                  <span key={index} className="com-list-tag">
                    {item.content}
                    {getDividerLine(index, record.tagList?.length)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  //筛选
  const afterFilter = (filterObj: any, types?: any) => {
    taskPage.listPageNo = 0
    taskPage.totalPages = 0
    setTaskPage({
      listPageNo: 0,
      totalPages: 0,
    })
    if (types == 'search') {
      //搜索
      fliterObj.keyword = filterObj || ''
      setFliterObj({
        ...fliterObj,
        keyword: filterObj,
      })
    } else {
      fliterObj.taskTypeTags = filterObj.tagList || [] //任务标签
      fliterObj.level = filterObj.levelList.length > 0 ? filterObj.levelList[0] : 0
      fliterObj.startTime = filterObj.startTime || ''
      fliterObj.endTime = filterObj.endTime || ''
      fliterObj.star = filterObj.priorityList || [] //星级筛选
      fliterObj.ascriptionLevel = filterObj.rankList || [] //级别筛选
      fliterObj.departLevel = filterObj.deptList || [] //部门筛选
      fliterObj.status = filterObj.statusList || [] //任务状态
      setFliterObj({ ...fliterObj })
      listInit = false
    }
    findTaskList('init')
  }

  /**
   * 获取当前列表是否初始化查询
   */
  const getListInit = () => {
    return listInit
  }

  //标签筛选 -----------------------------------------------------------------------------------start
  const filterRes = (infoObj?: any) => {
    const paramObj = infoObj ? infoObj : {}
    const filterInit = paramObj.filterInit ? paramObj.filterInit : false
    // 任务类型
    let taskTypes: any = []
    // 任务标签
    const taskTypeTags: any = []
    // 任务类型标签
    const taskTypeOut = taskState.taskTypeOut
    const taskTypeList = [...taskTypeOut, ...taskState.taskTypeMore]
    // 排除所有任务/归档任务被选中情况
    if (!taskState.taskTypeOut[0].active) {
      taskTypeList.forEach((item: any) => {
        // type:1任务类型 0标签
        if (item.active) {
          if (item.type == 1) {
            taskTypes.push(item.code)
          } else {
            taskTypeTags.push(item.code)
          }
        }
      })
    } else {
      taskTypes = taskState.taskTypeOut[0].active ? [-1] : [-2]
    }
    const fliterInfo: any = {
      taskTypes: taskTypes,
      taskTypeTags: taskTypeTags,
    }
    // 获取高级筛选框结果
    const fliterObjInit = {
      taskTypeTags: [],
    }
    const filterObj = filterInit ? fliterObjInit : fliterObj
    //合并两个数组
    taskTypeTags.push(...filterObj.taskTypeTags)
    //去重
    fliterInfo.taskTypeTags = Array.from(new Set(taskTypeTags))
    return fliterInfo
  }

  /**
   * 初始查询任务类型标签
   */
  const queryTaskTypeInit = () => {
    // 查询外部标签
    queryTaskType({
      startNo: 0,
      endNo: 2, //外面查询2个
      findType: 0,
    })
    // 查询一类标签
    queryTaskType({
      startNo: 2, //从2开始查询
      endNo: 0,
      findType: 1,
    })
  }

  /**
   * 查询任务类型标签
   * findType 查询类型：0外部标签 1一类标签
   */

  const queryTaskType = (paramObj: { startNo: number; endNo: number; findType: number }) => {
    const treeInfo: any = publicinitStates.public.terrObj
    let param: any = {}
    // 我的任务
    if (publicinitStates.public.isMytissue) {
      param = {
        ascriptionId: options.allowTeamId[0],
        ascriptionType: 2,
        startNo: paramObj.startNo,
      }
    } else {
      param = {
        ascriptionId: treeInfo.cmyId,
        ascriptionType: 2,
        startNo: paramObj.startNo,
      }
    }
    if (paramObj.findType == 0) {
      param.endNo = paramObj.endNo
    }
    requestApi({
      url: '/task/tag/getConfig',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        const dataList = res.data.dataList || []
        const tagsData: any = []
        // // 查询外部标签
        // if (paramObj.findType == 0) {
        //   taskTypeAll.active = true
        // }

        dataList.map((item: any) => {
          const obj = {
            code: item.id || 0,
            name: item.content,
            type: item.type || 0,
            active: false,
          }
          tagsData.push(obj)
        })
        // 查询一类标签
        if (paramObj.findType == 1) {
          moreTags = [...tagsData]
          setTaskState({
            taskTypeMore: [...tagsData],
            taskTypeOut: [...taskState.taskTypeOut],
          })
        } else {
          outTags = [...tagsData]
          setTaskState({
            taskTypeMore: [...taskState.taskTypeMore],
            taskTypeOut: [...tagsData],
          })
        }
        updataTaskTypeTags()
      }
    })
  }

  // 更新任务类型数据 listMode:当前模式状态 1：款详情  0：表格
  const updataTaskTypeTags = () => {
    taskTypeAll.active = true
    const initTask = [taskTypeAll]
    setTaskState({
      taskTypeMore: [...moreTags],
      taskTypeOut: [...initTask, ...outTags],
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
      let active = true
      for (const i in taskTypeList) {
        if (taskTypeList[i].code == code) {
          if (taskTypeList[i].active == true) {
            taskTypeList[i].active = false
            active = false
          } else {
            taskTypeList[i].active = true
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
    if (findType == 1) {
      setTaskState({
        taskTypeMore: [...taskTypeList],
        taskTypeOut: [...taskTypeOut],
      })
      gettTaskTypeOutlist([...taskTypeList, ...taskTypeOut])
    } else {
      setTaskState({
        taskTypeMore: [...taskTypeMore],
        taskTypeOut: [...taskTypeList],
      })
      gettTaskTypeOutlist([...taskTypeMore, ...taskTypeList])
    }
    taskPage.listPageNo = 0
    taskPage.totalPages = 0
    setTaskPage({
      listPageNo: 0,
      totalPages: 0,
    })
    findTaskList('init')
  }
  //获取筛选标签状态
  const gettTaskTypeOutlist = (list: any) => {
    let newtaskTypes: any = []
    let newtaskTypeTags: any = []
    list.map((item: any, index: any) => {
      if (item.active) {
        if (item.code == -1) {
          newtaskTypes = []
          newtaskTypeTags = []
        } else {
          if (item.type == 0) {
            newtaskTypeTags.push(item.code)
          } else {
            newtaskTypes.push(item.code)
          }
        }
      }
    })
    fliterObj.taskType = [...new Set(newtaskTypes)] || []
    fliterObj.taskTypeTags = [...new Set(newtaskTypeTags)] || []
    setFliterObj({
      ...fliterObj,
      taskType: [...new Set(newtaskTypes)] || [], //任务标签
    })
  }

  /**
   * 任务类型标签单项节点
   */
  const TaskTypeOutItem = ({ item }: { item: any }) => {
    const dragRef: any = useRef(null)
    return (
      <Tooltip title={item.name}>
        <li
          ref={dragRef}
          data-code={item.code}
          data-type={item.type}
          className={`taskTypeTagItem ${item.active ? 'active' : ''}`}
          onMouseDown={(e: any) => {
            taskTypeChange(Number(e.currentTarget.dataset.code), 0)
          }}
        >
          <span className="item-name">{item.name}</span>

          <em className="img_icon tick"></em>
        </li>
      </Tooltip>
    )
  }

  /**
   * 一类标签下拉弹框
   */
  const moreTypeTag = () => {
    return (
      <section className="basePopoverMenu moreTypeTagPopover baseDropInBox">
        <header className="flex between more_tag_header">
          <div>
            <span className="more_tag_tit">{`${$intl.get('ClassOneLabel')}(${$intl.get(
              'multipleChoice'
            )})`}</span>
            {/* <span className="more_tag_msg">（{$intl.get('multipleChoice')}）：</span> */}
          </div>
        </header>
        <ul className="taskTypeMoreList">
          {taskState.taskTypeMore.map((item: any, i: number) => (
            <TaskTypeMoreItem item={item} key={i} />
          ))}
          {taskState.taskTypeMore.length == 0 ? (
            <NoneData
              imgSrc={$tools.asAssetsPath('/images/noData/no_task_org_child.png')}
              showTxt={$intl.get('notLabel')}
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
  const TaskTypeMoreItem = ({ item }: { item: any }) => {
    return (
      <Tooltip title={item.name}>
        <li
          data-code={item.code}
          data-type={item.type}
          className={`taskTypeTagItem ${item.active ? 'active' : ''}`}
          onClick={(e: any) => {
            taskTypeChange(Number(e.currentTarget.dataset.code), 1)
            setCheckTip(
              taskState.taskTypeMore.every(function(item: any) {
                return item.active == false
              })
            )
          }}
        >
          <span className="item-name">{item.name}</span>
          <em className="img_icon tick"></em>
        </li>
      </Tooltip>
    )
  }
  //标签筛选 -----------------------------------------------------------------------------------end
  const topicon = $tools.asAssetsPath('/images/task/topicon1.png')

  /**
   * 表格集成组件(覆盖默认的 table 元素 修改表格线条样式)
   */
  const components = {
    body: {
      cell: bleBodyCell,
    },
  }

  return (
    <Spin spinning={loading} tip={$intl.get('loadingWait')}>
      <div className="support_taskfilter">
        <div className="headerLeft" style={{ width: '60%', whiteSpace: 'nowrap' }}>
          <ul className="taskTypeOutTag inline-flex">
            {taskState.taskTypeOut.map((item: any, i: number) => (
              <TaskTypeOutItem item={item} key={i} />
            ))}
          </ul>
          <Dropdown overlay={() => moreTypeTag()} trigger={['click']} placement="bottomRight">
            <span className="nav_subbt more_type_btn">
              <span>
                <img src={topicon} alt="" className={`toptipicon ${checktip ? 'forcedHide' : ''}`} />
              </span>
              {$intl.get('more')}
              <em className="img_icon tri_down_icon mleft"></em>
            </span>
          </Dropdown>
        </div>
        <div className="">
          <span className="toptipicon2-box">
            <img src={topicon} alt="" className={`toptipicon2 ${checktip2 ? 'forcedHide' : ''}`} />
          </span>
          <Input
            ref={searchRef}
            placeholder={$intl.get('searchValue')}
            prefix={
              <SearchOutlined
                onClick={(value: any) => {
                  afterFilter(searchRef.current.state.value, 'search')
                }}
              />
            }
            suffix={
              <TaskManageFilter
                afterFilter={afterFilter}
                param={{
                  getListInit: getListInit,
                  fromtype: 'support',
                }}
                terrObj={publicinitStates.public.terrObj}
                gettoptip={(datas: any) => {
                  setCheckTip2(!datas)
                }}
              />
            }
            className="baseInput radius16 border0 bg_gray taskSearch"
            style={{ width: '100%', maxWidth: 248 }}
            defaultValue=""
            onKeyUp={(e: any) => {
              const searchVal = e.target.value
              if (e.keyCode == 13) {
                afterFilter(searchVal, 'search')
              }
            }}
          />
        </div>
      </div>
      <div className="support-table-list commonRetract">
        {!state.tasks.taskDataList || state.tasks.taskDataList.length == 0 ? (
          <NoneData
            searchValue={searchRef.current ? searchRef.current.state.value : ''}
            imgSrc={$tools.asAssetsPath(`/images/noData/no_task_org_child.png`)}
            imgStyle={{ width: 100, height: 100 }}
          />
        ) : (
          <InfiniteScroll
            initialLoad={false} // 不让它进入直接加载
            pageStart={0} // 设置初始化请求的页数
            hasMore={!loading && hasMore} // 是否继续监听滚动事件 true 监听 | false 不再监听
            loadMore={handleInfiniteOnLoad} // 监听的ajax请求
            useWindow={false} // 不监听 window 滚动条
          >
            <Table
              key={'support'}
              columns={columns}
              dataSource={state.tasks.taskDataList}
              showHeader={false}
              tableLayout={'fixed'}
              onExpand={expandedRow}
              expandable={tableExpandable} //修改子任务样式线条
              rowClassName={setRowClassName}
              expandedRowKeys={expandedRowKey}
              components={components}
              pagination={false}
              rowSelection={{
                ...rowSelection,
                type: options.checkboxType,
                selectedRowKeys: selectListtask,
                columnWidth: 34,
              }}
              onRow={() => ({
                onClick: (event: any) => {
                  event.stopPropagation()
                },
              })}
            />
          </InfiniteScroll>
        )}
      </div>
    </Spin>
  )
})

/**
 * 更改表格子任务线条样式
 */
const bleBodyCell = (props: any) => {
  const { rowData, rowIndex, colIndex, className, style, ...restProps } = props
  return (
    <td
      key={rowIndex || 0}
      className={`${className} ${rowData && rowData.childLevel ? 'treeTableChild' : ''}`}
      style={{ ...style }}
      {...restProps}
    />
  )
}
const CheckboxCom = ({ record, selectedRowKeys, selectedRows, options, onChange }: any) => {
  const [state, setState] = useState({
    checked: false,
  })

  useEffect(() => {
    let checked = false
    if (selectedRowKeys.includes(record.key)) {
      checked = true
    }
    setState({ ...state, checked })
  }, [record.key, selectedRowKeys])

  const checkedChange = ({ type, row, checked }: any) => {
    if (type == 'radio') {
      onChange([row.key], [row], { checked, changeRow: row })
    } else {
      const newKeys = [...selectedRowKeys]
      const newRows = [...selectedRows]
      if (checked) {
        if (!newKeys.includes(row.key)) {
          newKeys.push(row.key)
          newRows.push(row)
        }
      } else {
        const findI = newKeys.findIndex((key: any) => key == row.key)
        const findRowI = newRows.findIndex((item: any) => item.key == row.key)
        if (findI != -1) {
          newKeys.splice(findI, 1)
        }
        if (findRowI != -1) {
          newRows.splice(findRowI, 1)
        }
      }
      onChange(newKeys, newRows, { checked, changeRow: row })
    }
  }
  if (options.checkboxType == 'radio') {
    return (
      <Radio
        checked={state.checked}
        disabled={record.isDisabled}
        onClick={(e: any) => {
          e.stopPropagation()
          checkedChange({ type: 'radio', row: record })
        }}
      ></Radio>
    )
  } else {
    return (
      <Checkbox
        checked={state.checked}
        disabled={record.isDisabled}
        onClick={(e: any) => {
          e.stopPropagation()
          // setState({ ...state, checked: !state.checked })
          checkedChange({ type: 'checkbox', row: record, checked: !state.checked })
        }}
      ></Checkbox>
    )
  }
}

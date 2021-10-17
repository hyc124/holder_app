import React from 'react'
import { Tree, Input, Menu, Dropdown, Spin, message } from 'antd'

import { RightOutlined } from '@ant-design/icons'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ipcRenderer } from 'electron'
import './workplan.less'
import WorkPlanMindModal from '../work-plan-mind/addPlan'
import { queryTreeData as queryTreeDataApi, queryPlanList } from './workPlanApi'
import WorkPlanMindRightMeun from '../work-plan-mind/WorkPlanMindRightMeun'
import '../work-plan-mind/work-plan-mind.less'
import { CardModeList, ListModeTable } from './workplanCard'
import { OrgSearchList } from '../task/taskManage/TaskOrg'
import { WorkPlanModal } from './WorkPlanModal'
import { findShareUsers, shareToUserSave, findEditMember, saveEditMember } from './WorkPlanOpt'
import { renderTreeData, getTreeParam } from '../../common/js/tree-com'

import { PlanFilterModule } from '../../components/filter/filter'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import { getAddprojectData } from './addplanfu'
import { CaretDownOutlined } from '@ant-design/icons'
import { findAuthList, getAuthStatus } from '@/src/common/js/api-com'
import { NEWAUTH812 } from '@/src/components'

// *****************变量定义*****************//

// 计划类型导航菜单参数
const planTypeMenu = [
  {
    type: 1,
    name: '我负责的',
    total: 0,
  },
  {
    type: 2,
    name: '派发给我的',
    total: 0,
    unread: 0,
  },
  {
    type: 3,
    name: '我创建的',
    total: 0,
  },
]
// 保存权限列表
// let workPlanAuthList: any = []

interface DataNode {
  title: string
  key: string
  isLeaf?: boolean
  children?: DataNode[]
}
export const planContext = React.createContext({})
class WorkPlan extends React.Component {
  // 构造器
  constructor(props: any) {
    super(props)
  }

  // 列表模式组件缓存
  listTableRef: any
  // 选人插件参数
  selMemberOrg: any = {
    teamId: '',
    sourceType: '', //操作类型(或来源)
    allowTeamId: [],
    selectList: [], //选人插件已选成员
    checkboxType: 'checkbox',
    findType: 0, //查询类型 0人员 3部门 31岗位 310岗位人员
    permissionType: 3, //组织架构通讯录范围控制
    showPrefix: false, //不显示部门岗位前缀
    // cascadeMember: true,
    // checkableAll: true,
  }
  state = {
    orgLoading: true, //组织架构loading图标显示状态
    mainLoading: false, //右侧内容loading图标显示状态
    // 是否是为我的规划
    isMyPlan: 1,
    treeData: [],
    selectedKeys: [],
    expandedKeys: [],
    planTypeMenu: planTypeMenu,
    planTypeActive: 1,
    sortType: 0, //排序
    cardDirList: [], //卡片模式文件夹
    cardPlanList: [], //卡片模式规划
    listModeData: [], // 列表模式数据
    orgShow: true, //左侧组织架构显示隐藏控制
    planMode: 0, //规划模式 1列表 0卡片
    folderPosList: [{ name: '规划列表', id: '' }], //文件夹位置数据缓存
    allCompanyIds: [], //组织架构所有企业id
    allCompany: [], //组织架构所有企业对象
    search: '', //组织架构搜索
    newAddFolder: false, //卡片新增文件夹
    newAddFolderTr: false, //列表新增文件夹
    isShowAddPlan: false, //是否显示创建规划弹窗
    addPlanFromType: 0, //创建规划是四显现还是脑图
    moveToFolderShow: false, //移动到文件夹弹框
    delPlanModalShow: false, //删除规划二次弹框提醒弹框
    shareToRoomModalShow: false, //共享到群弹框
    memberOrgShow: false,
    statusList: [], //状态筛选
    addObjectAuth: false, //创建okr四象限权限
  }

  //获取列表模式
  getListView = () => {
    const params = {
      userId: $store.getState().nowUserId,
    }
    $api
      .request('/task/work/plan/getListView', params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then((data: any) => {
        if (data.returnCode === 0) {
          this.setState({ planMode: data.data == 0 ? 0 : 1 })
        } else {
          this.setState({ planMode: 1 })
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }
  //切换列表模式0卡片 1列表
  changeListView = (type: any) => {
    const params = {
      userId: $store.getState().nowUserId,
      listView: type,
    }
    $api
      .request('/task/work/plan/changeListView', params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then((data: any) => {
        if (data.returnCode === 0) {
        } else {
          message.error(data.returnMessage)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }
  // =======菜单============//
  // 新增菜单
  creteQuPlan = (props: any) => {
    $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 })
    if (this.state.isMyPlan) {
      //我的规划跳转到选择企业弹窗-创建规划
      this.setState({ isShowAddPlan: true })
      this.setState({ addPlanFromType: Number(props.key) })
    } else {
      //组织架构-创建规划
      if (props.key === '0') {
        //脑图先调用接口在创建窗口
        //获取组织结构
        const treeInfo = getTreeParam($store.getState().workplanTreeId)
        getAddprojectData(treeInfo, '', this.state.isMyPlan, props.key)
      } else {
        //四象限跳转后请求接口
        const treeInfo = getTreeParam($store.getState().workplanTreeId)
        $store.dispatch({
          type: 'MINDMAPDATA',
          data: {
            id: 0,
            typeId: 0,
            name: '目标Objective',
            teamName: treeInfo.cmyName,
            teamId: treeInfo.cmyId,
            status: 1,
            mainId: '',
            type: 2,
            ascriptionType: treeInfo.curType,
          },
        })
        $store.dispatch({
          type: 'FROM_PLAN_TYPE',
          data: { createType: 0, fromToType: Number(props.key) },
        })
        //跳转到脑图
        $tools.createWindow('workplanMind')
      }
    }
    const nowFolder = this.state.folderPosList[this.state.folderPosList.length - 1]
    $store.dispatch({ type: 'PLANMAININFO', data: { nowFolderId: nowFolder?.id } })
  }
  addPlanMenu = () => {
    const { isMyPlan } = this.state
    return (
      <Menu
        className="myDropMenu planOptBtnMenu addPlanMenu"
        onClick={(props: any) => {
          if (props.key === '0' || props.key === '1') {
            this.creteQuPlan(props)
          } else {
            //新建文件夹
            if (this.state.planMode == 1) {
              this.setState({
                newAddFolderTr: true,
              })
            } else {
              this.setState({
                newAddFolder: true,
              })
            }
          }
        }}
      >
        <Menu.Item key="0">
          <div className="myMenuItem">
            <em className="img_icon add_mind_icon"></em>
            <span>新建脑图规划</span>
          </div>
        </Menu.Item>
        {/* {(NEWAUTH812 ? this.state.addObjectAuth : true) && (
          <Menu.Item key="1">
            <div className="myMenuItem">
              <em className="img_icon add_quadrant_icon"></em>
              <span>新建OKR四象限</span>
            </div>
          </Menu.Item>
        )} */}
        <Menu.Item key="3" className={`${isMyPlan ? '' : 'forcedHide'}`}>
          <div className="myMenuItem createDirMenu">
            <em className="img_icon add_dir_icon"></em>
            <span>新建文件夹</span>
          </div>
        </Menu.Item>
      </Menu>
    )
  }
  // 时间筛选菜单
  planTimeMenu = (
    <Menu className="myDropMenu tick def planOptBtnMenu planTimeSort" selectable defaultSelectedKeys={['0']}>
      <Menu.Item
        key="0"
        onClick={() => {
          this.sortChange(0)
        }}
      >
        <div className={'myMenuItem'}>
          <span>降序</span>
        </div>
      </Menu.Item>
      <Menu.Item
        key="1"
        onClick={() => {
          this.sortChange(1)
        }}
      >
        <div className={'myMenuItem'}>
          <span>升序</span>
        </div>
      </Menu.Item>
    </Menu>
  )

  // ***************工作规划左侧组织架构相关方法********************//
  // 我的规划
  myPlanChange = async () => {
    $store.dispatch({ type: 'PLANMAININFO', data: { isMyPlan: true, orgInfo: {} } })
    NEWAUTH812 && (await this.getTeamAuthList({ isMyPlan: true }))
    // 取消选中树节点
    this.setState(
      {
        isMyPlan: 1,
        selectedKeys: [],
        folderPosList: [{ name: '规划列表', id: '' }],
      },
      () => {
        this.findPlanList()
      }
    )
  }
  // ================树形组件事件============//
  updateTreeData(list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] {
    return list.map(node => {
      if (node.key === key) {
        node.children = children
        // return {
        //   ...node,
        //   children: children,
        // }
      } else if (node.children) {
        return {
          ...node,
          children: this.updateTreeData(node.children, key, children),
        }
      }
      return node
    })
  }
  // 点击展开按钮加载子节点时
  onLoadData = (treeNode: any): Promise<void> => {
    return new Promise(resolve => {
      if (treeNode.children && treeNode.children.length > 0) {
        resolve()
        return
      }
      this.queryTreeChild(treeNode, resolve)
      // const testData = [
      //   { title: 'Child Node', key: `${treeNode.key}-0` },
      //   { title: 'Child Node', key: `${treeNode.key}-1` },
      // ]
      // treeNode.children = testData
    })
  }
  /**
   * 选中树节点时
   */
  onSelect = (
    selectedKeys: any,
    e: { selected: boolean; selectedNodes: any; node: any; event: any }
  ): Promise<void> => {
    return new Promise(() => {
      let setObj: any
      if (e.selected) {
        setObj = {
          isMyPlan: 0,
          selectedKeys: selectedKeys,
          folderPosList: [{ name: '规划列表', id: '' }],
        }
        const treeInfo = getTreeParam(e.node.key)
        this.setState(setObj, async () => {
          // 选择项为企业时，更新企业权限列表
          if (NEWAUTH812 && treeInfo?.getType == 2 && treeInfo?.cmyId) {
            // nowCmyData = true
            // 设置按钮权限
            await this.getTeamAuthList({ isMyPlan: false, typeId: treeInfo.cmyId })
          }
          // console.log('选中子节点', setObj, treeInfo)
          //设置选中的父亲id  treeInfo.cmyId
          $store.dispatch({ type: 'WORKPLAN_TREEID', data: { workplanTreeId: e.node.key } })
          $store.dispatch({ type: 'PLANMAININFO', data: { isMyPlan: false, orgInfo: treeInfo } })
          console.log($store.getState().planMainInfo)
          this.findPlanList()
        })
      }
    })
  }

  /**
   * 点击组织架构展开节点
   * @param checkedKeys
   * @param e
   * @param attachInfo
   */
  onExpand = (expandedKeys: any, e: { expanded: boolean; node: any }) => {
    const getExpandedKeys = expandedKeys
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
    this.setState({
      expandedKeys: getExpandedKeys,
    })
  }
  // ============数据查询处理=============//
  // 查询公司列表组织架构
  queryTreeFirst = () => {
    const expandedKeys: any = []
    queryTreeDataApi({
      account: $store.getState().nowAccount,
      isAllOrg: 1,
      defaultLoginUser: 0,
      setLoadState: this.setOrgLoad,
    }).then(res => {
      const data = res.data || []
      console.log(data)
      if (res.success) {
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
            fromType: 'workPlan',
            isCount: true, //显示统计
            expandedKeys: expandedKeys,
            setExpandedKeys: (thisKey: string) => {
              const getKeys: any = this.state.expandedKeys || []
              const index = getKeys.indexOf(thisKey)
              if (index == -1) {
                getKeys.push(thisKey)
              } else {
                getKeys.splice(index, 1)
              }
              this.setState({
                expandedKeys: [...getKeys],
              })
            },
          }
        )
        this.setState({
          treeData: [...newDataList],
          allCompanyIds: allCompanyIds,
          allCompany: allCompany,
          expandedKeys: expandedKeys,
        })
      }
    })
  }
  // 点击查询组织架构子级
  queryTreeChild = (treeNode: any, resolve?: () => void) => {
    const { treeData } = this.state
    const treeInfo: any = getTreeParam(treeNode.key)
    const param: any = {
      id: treeInfo.curId,
      type: treeInfo.curType,
      account: $store.getState().nowAccount,
      isAllOrg: 0,
      teamId: treeInfo.cmyId,
      setLoadState: this.setOrgLoad,
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
            fromType: 'workPlan',
            isCount: true, //显示统计
          }
        )
        if (resolve) {
          this.updateTreeData(treeData, treeNode.key, newDataList)
          this.setState({
            treeData: [...treeData],
          })
          resolve()
          console.log(treeData)
        }
      }
    })
  }

  // ***********************************规划右侧内容区域*********************************//
  // **************规划右侧内容区域事件***********//
  // ===顶部菜单===//
  // 计划类型切换
  planTypeChange = (e: any) => {
    e.preventDefault()

    const type = Number(e.currentTarget.dataset.type)
    this.setState(
      {
        planTypeActive: type,
        folderPosList: [{ name: '规划列表', id: '' }],
      },
      () => {
        this.findPlanList()
      }
    )
  }
  sortChange = (type: any) => {
    this.setState(
      {
        sortType: type,
        // folderPosList: [{ name: '规划列表', id: '' }],
      },
      () => {
        this.findPlanList()
      }
    )
  }
  // 模式切换
  modeChange = () => {
    this.setState({ planMode: this.state.planMode == 1 ? 0 : 1 }, () => {
      this.findPlanList({ modeChange: true })
    })
    this.changeListView(this.state.planMode == 1 ? 0 : 1)
  }
  /**
   * 查询规划参数封装
   */
  planListParam = (paramObj?: any) => {
    // 当前位置
    const nowPos = this.state.folderPosList[this.state.folderPosList.length - 1]
    // 高级筛选
    const filterObj = paramObj.filterObj || {}
    const treeInfo = getTreeParam($store.getState().workplanTreeId)
    let deptId = '0',
      roleId = '0'
    const isMyPlan = this.state.isMyPlan
    if (!isMyPlan && treeInfo.curType == 0) {
      deptId = treeInfo.parentId
      roleId = treeInfo.roleId
    }
    let statusList = [4, 3, 1, 2]
    if (filterObj.statusList) {
      statusList = filterObj.statusList
    } else if (this.state.statusList.length > 0) {
      statusList = this.state.statusList
    }
    const param: any = {
      operateUser: $store.getState().nowUserId,
      ascriptionId: isMyPlan ? '' : treeInfo.curId,
      ascriptionType: isMyPlan ? '' : treeInfo.curType,
      keyword: filterObj.searchVal || '',
      status: statusList,
      deptId: deptId,
      roleId: roleId,
      mySelf: isMyPlan ? this.state.planTypeActive : 0,
      sortField: 1, //排序字段：0默认 1创建时间 2更新时间
      sortType: this.state.sortType, //排序类型：0倒序 1升序
      taskTypes: filterObj.typeList || [0, 5], //[0,1,2,3,4]//0目标、5项目
      teamId: isMyPlan ? '' : treeInfo.cmyId,
    }
    // 列表模式查询子节点
    if (paramObj.listModeChild) {
      if (paramObj.dirId) {
        param.parentId = paramObj.dirId
      }
    } else {
      if (nowPos.id) {
        param.parentId = nowPos.id
      }
    }

    // console.log(param)
    return param
  }
  /**
   * 查询规划数据
   */
  findPlanList = (infoObj?: any) => {
    const paramObj: any = infoObj ? infoObj : {}
    return new Promise((resolve: any) => {
      // 搜索调用接口
      if (paramObj.search) {
        this.setState(
          {
            isMyPlan: false,
          },
          () => {
            const param = this.planListParam(paramObj)
            this.findPlanData(param).then((res: any) => {
              resolve(res)
            })
          }
        )
      } else {
        const param = this.planListParam(paramObj)
        this.findPlanData(param).then((res: any) => {
          resolve(res)
        })
      }
    })
  }
  findPlanData = (param: any) => {
    param.setLoadState = this.setMainLoad
    return new Promise((resolve: any) => {
      queryPlanList(param).then(res => {
        const dataObj = res.data.obj || {}
        const bottomList = dataObj.bottom || []
        if (res.success) {
          // 当前位置
          const nowPos = this.state.folderPosList[this.state.folderPosList.length - 1]
          const numObj: any = res.data.data || {}
          const planTypeMenu = this.state.planTypeMenu
          // 总数据统计
          if (nowPos.id) {
            planTypeMenu[0].total = bottomList.length
          } else {
            planTypeMenu[0].total = numObj.LIABLE || 0
            planTypeMenu[1].total = numObj.DISTRIBUTE || 0
            planTypeMenu[2].total = numObj.CREATE || 0
          }
          // 派发给我的未读统计
          planTypeMenu[1].unread = numObj.DISTRIBUTE_UNREAD || 0
          // 切换模式
          if (param.updeta) {
            this.setState(this.state)
            return
          }
          if (this.state.planMode == 1) {
            this.setState({
              listModeData: [...(dataObj.top || []), ...(dataObj.bottom || [])],
            })
          } else {
            this.setState({
              cardDirList: dataObj.top || [],
              cardPlanList: dataObj.bottom || [],
            })
          }
          resolve(res.success)
        } else {
          // 切换模式
          if (this.state.planMode == 1) {
            this.setState({
              listModeData: [],
            })
          } else {
            this.setState({
              cardDirList: [],
              cardPlanList: [],
            })
          }
        }
      })
    })
  }
  // ============================文件夹操作=====================//
  // ====进入文件夹====//
  inFolder = (item: any) => {
    this.state.folderPosList.push({
      id: item.id,
      name: item.name,
    })
    this.setState(
      {
        folderPosList: this.state.folderPosList,
      },
      () => {
        this.findPlanList()
      }
    )
  }
  // ====跳转文件夹====//
  jumpFileDoc = (toIndex: number) => {
    const newPos: any = []
    // 存取所跳转文件夹及之前位置的信息
    this.state.folderPosList.forEach((item: any, i: number) => {
      if (i <= toIndex) {
        newPos.push(item)
      }
    })
    this.setState(
      {
        folderPosList: newPos,
      },
      () => {
        this.findPlanList()
      }
    )
  }
  // ============================组织架构搜索=====================//
  /**
   * 选中搜索项
   */
  searchSelect = (paramObj: { treeId: string }) => {
    const treeInfo = getTreeParam(paramObj.treeId)
    $store.dispatch({ type: 'WORKPLAN_TREEID', data: { workplanTreeId: paramObj.treeId } })
    $store.dispatch({ type: 'PLANMAININFO', data: { orgInfo: treeInfo } })
    this.findPlanList({ search: true })
  }

  // ============================设置loading显示隐藏状态=====================//
  /**
   * 设置组织架构loading显示隐藏状态
   */
  setOrgLoad = (flag: boolean) => {
    this.setState({
      orgLoading: flag,
    })
  }
  /**
   * 设置右侧loading显示隐藏状态
   */
  setMainLoad = (flag: boolean) => {
    this.setState({
      mainLoading: flag,
    })
  }

  // ================高级筛选============//
  // 选择筛选条件后的回调
  afterFilter = (filterObj: any) => {
    this.setState({
      statusList: filterObj.statusList,
    })
    this.findPlanList({
      advancedFilter: true,
      filterObj: filterObj,
    })
  }
  /**
   * 初始加载
   */
  async componentDidMount() {
    NEWAUTH812 && (await this.getTeamAuthList({ isMyPlan: true }))
    this.getListView()
    this.queryTreeFirst()
    this.findPlanList({ init: true })
    $store.dispatch({ type: 'PLANMAININFO', data: { isMyPlan: true, orgInfo: {} } })
    // 订阅刷新消息
    ipcRenderer.on('refresh_plan_list', () => {
      console.log('planListRefresh')
      this.refreshData({ optType: '' })
    })
    const mindMaptype = $store.getState().mindMapData.form
    if (mindMaptype == 'workbench') {
      //工作台已经打开过窗口先执行关闭窗口
      ipcRenderer.send('close_work_mind_shut')
      // $tools.windowsInit(['workplanMind'])
    } else {
      // 提前初始化脑图窗口
      $tools.windowsInit(['workplanMind'])
    }
  }

  // 更新企业权限
  async getTeamAuthList({ isMyPlan, typeId }: any) {
    // 创建okr四象限权限
    let addObjectAuth = false
    // 我的规划下不可以配置
    if (!isMyPlan) {
      const authList = await findAuthList({ typeId })

      addObjectAuth = getAuthStatus('okrSet', authList) //8.12 暂时取得okr设置权限
      // workPlanAuthList = authList
    } else {
      addObjectAuth = true
    }
    this.setState({
      addObjectAuth,
    })

    // return { addObjectAuth }
  }
  /**
   * 数据刷新
   * optType-操作类型
   */
  refreshData = (paramObj: { optType: string; viewType?: number; id?: string; newName?: string }) => {
    const { cardDirList, cardPlanList } = this.state
    let changeList: any = []
    if (paramObj.viewType == 1) {
      changeList = cardDirList
    } else {
      changeList = cardPlanList
    }
    switch (paramObj.optType) {
      case 'rename': //重命名
        if (this.state.planMode == 1) {
          this.listTableRef.renderRename({
            id: paramObj.id,
            newName: paramObj.newName,
          })
        } else {
          for (const i in changeList) {
            const item: any = changeList[i]
            if (paramObj.id == item.id) {
              item.name = paramObj.newName
              break
            }
          }
        }

        break
      case 'del': //删除
        if (this.state.planMode == 1) {
          this.listTableRef.renderDel({
            id: paramObj.id,
          })
          const param = this.planListParam(paramObj)
          param.updeta = true
          this.findPlanData(param)
        } else {
          for (const i in changeList) {
            const item: any = changeList[i]
            if (paramObj.id == item.id) {
              changeList.splice(i, 1)
              break
            }
          }
        }
        break
      default:
        this.findPlanList()
        break
    }
    // 列表模式直接调用子组件更新表格数据，不在此处刷新
    if (this.state.planMode == 0) {
      if (paramObj.viewType == 1) {
        this.setState({
          cardDirList: changeList,
        })
      } else {
        const param = this.planListParam(paramObj)
        param.updeta = true
        this.findPlanData(param)
        this.setState({
          cardPlanList: changeList,
        })
      }
    }
  }
  // ==========================设置弹框状态的方法 start===================//
  /**
   * 设置弹框状态的方法
   */

  setMoveToFolderShow = (flag: boolean) => {
    this.setState({
      moveToFolderShow: flag,
    })
  }
  /**
   * 删除二次提醒
   */
  setDelPlanModalShow = (flag: boolean) => {
    this.setState({
      delPlanModalShow: flag,
    })
  }
  /**
   * 共享到群弹框
   */
  setShareToRoomModalShow = (flag: boolean) => {
    this.setState({
      shareToRoomModalShow: flag,
    })
  }
  /**
   * 选择组织架构人员弹框
   */
  setMemberOrgShow = (flag: boolean, optType?: string) => {
    this.selMemberOrg.sourceType = optType || ''
    const sourceItem = $store.getState().planModalObj.sourceItem || {}
    this.selMemberOrg.teamId = sourceItem.teamId
    this.selMemberOrg.allowTeamId = [sourceItem.teamId]
    if (optType == 'shareToUser') {
      // 查询已共享人员
      findShareUsers({
        id: sourceItem.id,
      }).then((dataList: any) => {
        const newList: any = []
        dataList.map((item: any) => {
          const obj = {
            curId: item.id,
            curName: item.name,
            curType: 0,
            account: item.account || '',
            profile: item.profile,
          }
          newList.push(obj)
        })
        this.selMemberOrg.selectList = [...newList]
        this.setState({
          memberOrgShow: flag,
        })
      })
    } else if (optType == 'editMemberAuth') {
      // 查询编辑权限人员
      findEditMember({
        id: sourceItem.id,
        mainId: sourceItem.mainId,
      }).then((dataList: any) => {
        const newList: any = []
        dataList.map((item: any) => {
          let disable = false
          const obj: any = {
            curId: item.id,
            curName: item.name,
            curType: 0,
          }
          // 责任人或创建人不可删除
          if (item.isDel == 0) {
            disable = true
          }
          obj.disable = disable
          newList.push(obj)
        })
        this.selMemberOrg.selectList = [...newList]
        this.setState({
          memberOrgShow: flag,
        })
      })
    } else {
      this.setState({
        memberOrgShow: flag,
      })
    }
  }
  /**
   * 选择人员确认
   * attachObj:{}附属信息
   */
  selMemberSure = (dataList: any, attachObj: any) => {
    const sourceItem = $store.getState().planModalObj.sourceItem || {}
    const typeIds: any = []
    dataList.map((item: any) => {
      typeIds.push(item.curId)
    })
    if (attachObj.sourceType == 'shareToUser') {
      shareToUserSave({
        id: sourceItem.id, //节点id
        type: 1, //类型：0个人 1项目组
        typeIds: typeIds, //类型id
        name: sourceItem.name,
        mainId: sourceItem.mainId,
        typeId: sourceItem.typeId,
      })
    } else if (attachObj.sourceType == 'editMemberAuth') {
      saveEditMember({
        id: sourceItem.id, //节点id
        receivers: typeIds, //id集合
        name: sourceItem.name,
      })
    }
  }

  // ==========================设置弹框状态的方法 end===================//
  /**
   *
   */
  listTableOnRef = (ref: any) => {
    this.listTableRef = ref
  }
  render() {
    const nowFolder = this.state.folderPosList[this.state.folderPosList.length - 1]
    /**
     * 规划上下文数据
     */
    const planModeObj = {
      isMyPlan: this.state.isMyPlan,
      // 当前查询规划类型
      planType: this.state.planTypeActive,
      // 当前规划模式
      planMode: this.state.planMode,
      // 当前规划卡片模式下所处文件夹位置信息
      folderPosList: this.state.folderPosList,
      nowFolderId: nowFolder?.id,
      // 规划所有数据
      folderDataList: [...(this.state.cardDirList || []), ...(this.state.cardPlanList || [])],
      newAddFolder: this.state.newAddFolder,
      cardDirList: this.state.cardDirList,
      cardPlanList: this.state.cardPlanList,
      findPlanList: this.findPlanList,
      refreshData: this.refreshData,
      setMoveToFolderShow: this.setMoveToFolderShow,
      setDelPlanModalShow: this.setDelPlanModalShow,
      setShareToRoomModalShow: this.setShareToRoomModalShow,
      setMemberOrgShow: this.setMemberOrgShow,
    }
    const listModeData = this.state.listModeData
    // 选择人员参数
    const selMemberOrg = this.selMemberOrg
    const memberOrgParem = {
      visible: this.state.memberOrgShow,
      ...selMemberOrg,
    }
    // 当前规划信息
    const planMainInfo = $store.getState().planMainInfo
    const orgInfo = planMainInfo.orgInfo || {}
    // console.log(memberOrgParem)
    return (
      <planContext.Provider value={planModeObj}>
        <section className="secondPageContainer workPlanContainer flex-1 flex">
          <Spin spinning={this.state.orgLoading}>
            <aside
              className={`orgLeftCon workPlanLeftCon flex column ${
                this.state.orgShow ? 'showwidth' : 'hidewidth'
              }`}
            >
              <header className="pageLeftHeader">
                <span className="header_tit">我的规划</span>
                <em
                  className="img_icon org_fold_icon chose"
                  onClick={() => {
                    this.setState({ orgShow: false })
                  }}
                ></em>
              </header>
              <Input
                placeholder="请输入姓名"
                className="org_menu_search  baseInput radius16 border0 bg_gray"
                suffix={<em className="search-icon-t-btn" onClick={() => {}}></em>}
                defaultValue=""
                onKeyUp={(e: any) => {
                  const searchVal = e.target.value
                  if (e.keyCode == 13) {
                    this.setState({ search: searchVal })
                  }
                }}
              />
              {/* 搜索列表 */}
              <div className={`orgSearchList ${this.state.search == '' ? 'forcedHide' : ''}`}>
                <OrgSearchList
                  param={{ allCompanyIds: this.state.allCompanyIds, allCompany: this.state.allCompany }}
                  searchVal={this.state.search}
                  searchSelect={this.searchSelect}
                />
              </div>

              <div className="orgBotScroll flex-1">
                <div
                  className={`org_my flex center-v ${this.state.isMyPlan ? 'on org_my_active' : ''}`}
                  onClick={this.myPlanChange}
                >
                  <em className="img_icon org_my_icon"></em>
                  <span>我的规划</span>
                </div>
                <Tree
                  loadData={this.onLoadData}
                  treeData={this.state.treeData}
                  onSelect={this.onSelect}
                  onExpand={this.onExpand}
                  expandedKeys={this.state.expandedKeys}
                  blockNode={true}
                  selectedKeys={this.state.selectedKeys}
                  switcherIcon={<CaretDownOutlined />}
                  className={`leftOrgTree baseOrgTree switch_null fix_content gradient ${
                    this.state.search != '' ? 'forcedHide' : ''
                  }`}
                />
              </div>
            </aside>
          </Spin>

          <main className="orgRightCon workPlanRightCon flex-1">
            <header className="secondPageNav">
              <div className="secondPageHeader workPlanPageHeader_main">
                <div className="headerLeft">
                  {/* 规划列表标题 */}
                  <span className={`tit_name main_tit_name ${this.state.isMyPlan ? 'forcedHide' : ''}`}>
                    {orgInfo.curName}-规划列表
                  </span>
                  <em
                    className={`img_icon org_fold_icon open ${this.state.orgShow ? 'forcedHide' : ''}`}
                    onClick={() => {
                      this.setState({ orgShow: true })
                    }}
                  ></em>
                  {/* <!-- 导航菜单 --> */}
                  <ul
                    className={`workPlanListNav ${this.state.isMyPlan && !nowFolder?.id ? '' : 'forcedHide'}`}
                  >
                    {this.state.planTypeMenu.map((item: any) => {
                      return (
                        <li
                          className={`${this.state.planTypeActive == item.type ? ' active' : ''}`}
                          key={item.type}
                          data-type={item.type}
                          onClick={this.planTypeChange}
                        >
                          <span className={`red_count ${item.unread ? '' : 'forcedHide'}`}>
                            {item.unread || 0}
                          </span>
                          {item.name} <span className="sta_num">({item.total})</span>
                        </li>
                      )
                    })}
                  </ul>
                  {/* 返回上一层文件夹 */}
                  <span className="toPrevPage nav_back_btn" style={{ display: 'none' }}>
                    返回
                  </span>
                </div>
                <div className="headerRight">
                  {/* <!-- ====新建计划、文件夹菜单=== --> */}
                  <Dropdown overlay={() => this.addPlanMenu()} trigger={['click']} placement="bottomRight">
                    <span className="addPlanMenu_txt">新建</span>
                  </Dropdown>
                </div>
              </div>

              <div className="secondPageMenuNav workPlanListNav_main">
                <div className="headLeft">
                  {/* 进入文件夹后的标题 */}
                  <div className="inFileDocTit my_ellipsis">
                    <span className="prev_pos_box baseGrayColor">
                      {this.state.folderPosList.map((item: any, i: number) => {
                        if (i < this.state.folderPosList.length - 1) {
                          return (
                            <div key={i}>
                              <span
                                className="prev_pos_txt my_ellipsis"
                                onClick={() => {
                                  this.jumpFileDoc(i)
                                }}
                              >
                                {item.name}
                              </span>
                              <span className="prev_pos_arrow">
                                <RightOutlined />
                              </span>
                            </div>
                          )
                        }
                      })}
                    </span>
                    <span className="now_pos_box">
                      {this.state.folderPosList.map((item: any, i: number) => {
                        if (i == this.state.folderPosList.length - 1) {
                          return (
                            <div key={i}>
                              <span className="now_pos_txt my_ellipsis">{item.name}</span>
                            </div>
                          )
                        }
                      })}
                    </span>
                  </div>
                  <div className="headerRight"></div>
                </div>
                <div className="headRight">
                  <Dropdown
                    overlay={this.planTimeMenu}
                    overlayClassName="planTimeMenuSort"
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <span className="plan_subbt">
                      创建时间
                      <em className="img_icon tri_down_icon"></em>
                    </span>
                  </Dropdown>
                  {/* 高级筛选 */}
                  <PlanFilterModule afterFilter={this.afterFilter} />
                  {/* 切换卡片及列表 */}
                  <div
                    className="workPlan_mode"
                    onClick={() => {
                      this.modeChange()
                    }}
                  >
                    <em className={`img_icon ${this.state.planMode == 1 ? 'card' : 'list'}`}></em>
                    <span className={'workPlan_card_tit'}>{this.state.planMode == 1 ? '卡片' : '列表'}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* 卡片、列表内容 */}
            <Spin spinning={this.state.mainLoading} wrapperClassName="mainLoading flex-1">
              {/* 被拖拽的子元素需要被包裹在<DndProvider backend={HTML5Backend}>中 */}
              <DndProvider backend={HTML5Backend}>
                <section className="workPlanCon">
                  <CardModeList
                    param={{
                      cardDirList: this.state.cardDirList,
                      cardPlanList: this.state.cardPlanList,
                      folderPosList: this.state.folderPosList,
                      newAddFolder: this.state.newAddFolder,
                      planMode: this.state.planMode,
                      planType: this.state.planTypeActive,
                    }}
                    action={{
                      inFolder: this.inFolder,
                      findPlanList: this.findPlanList,
                      setNewAddFolder: (flag: boolean) => {
                        this.setState({
                          newAddFolder: flag,
                        })
                      },
                    }}
                  />
                  <ListModeTable
                    onRef={this.listTableOnRef}
                    param={{
                      dataList: listModeData,
                      folderPosList: this.state.folderPosList,
                      listParam: this.planListParam,
                      planMode: this.state.planMode,
                      planType: this.state.planTypeActive,
                      newAddFolderTr: this.state.newAddFolderTr,
                      setNewAddFolder: (flag: boolean) => {
                        this.setState({
                          newAddFolderTr: flag,
                        })
                      },
                    }}
                    action={{
                      inFolder: this.inFolder,
                      findPlanList: this.findPlanList,
                      createPlan: this.creteQuPlan,
                    }}
                  />
                </section>
              </DndProvider>
            </Spin>
          </main>
          {this.state.isShowAddPlan && (
            <WorkPlanMindModal
              visible={this.state.isShowAddPlan}
              state={this.state.addPlanFromType}
              from={'workplan'}
              isShowAddPlan={(state: any) => {
                this.setState({ isShowAddPlan: state })
              }}
            ></WorkPlanMindModal>
          )}
          {/* 右侧列表 */}
          <WorkPlanMindRightMeun></WorkPlanMindRightMeun>
          {/*规划弹框集合 */}
          <WorkPlanModal
            param={{
              moveToFolderShow: this.state.moveToFolderShow,
              delPlanModalShow: this.state.delPlanModalShow,
              shareToRoomModalShow: this.state.shareToRoomModalShow,
              from: 'workplan',
            }}
            action={{
              setMoveToFolderShow: this.setMoveToFolderShow,
              setDelPlanModalShow: this.setDelPlanModalShow,
              setShareToRoomModalShow: this.setShareToRoomModalShow,
            }}
          />
        </section>
        <SelectMemberOrg
          param={memberOrgParem}
          action={{
            setModalShow: this.setMemberOrgShow,
            // 点击确认
            onSure: this.selMemberSure,
          }}
        />
      </planContext.Provider>
    )
  }
}
// export default connect(mapStateToProps)(WorkPlan)
export default WorkPlan

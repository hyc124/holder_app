import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Tree, Input, Menu, Spin, message, Avatar } from 'antd'
// import { RightOutlined } from '@ant-design/icons'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ipcRenderer } from 'electron'
import './okrListCard.less'
import '../../workplan/workplan.less'
import { WorkPlanMindModal, ListDetailLarge } from '../work-okr-mind/okr-addPlan'
import { CaretDownOutlined } from '@ant-design/icons'
import { queryTreeData as queryTreeDataApi, queryPlanListNew } from './okr-workplanApi'
import { periodGetList, selectDateDisplay, saveDateDisplay } from '../../fourQuadrant/getfourData'
import '../work-okr-mind/work-okr-mind.less'
import { CardModeList } from './okr-workplanCard'
import { OrgSearchList } from '../../task/taskManage/TaskOrg'
import { WorkPlanModal } from './okr-WorkPlanModal'
import { findShareUsers, shareToUserSave, findEditMember, saveEditMember } from '../../workplan/WorkPlanOpt'
import { renderTreeData, getTreeParam } from '@/src/common/js/tree-com'
import { refMINDFn } from '../../okr-list/okr-mind'

import { SelectMemberOrg } from '@/src/components/select-member-org/index'
import { OkrKanban } from '@/src/views/workdesk/okrKanban/okrKanban'
import OkrSetting from '../component/OkrSetting'
import { getAuthStatus } from '@/src/common/js/api-com'
import { requestApi } from '@/src/common/js/ajax'
import { scrollToAnchor } from '../../task/taskDynamic/taskDynamic'
import { loadLocales } from '@/src/common/js/intlLocales'
import DetailModal from '../../task/taskDetails/detailModal'
import SearchNavigation from '../../task/taskManage/SearchNavigation'
import { remberPeriodApi } from '../../task/OKRDetails/okrDetailApi'

import GeneralView from '../../workdesk/okrKanban/generalView/generalView'
import { OkrHearder } from './okrHearder'
import NoneData from '@/src/components/none-data/none-data'
import { CreateObjectModal } from '../../task/creatTask/createObjectModal'

// *****************????????????*****************//

// ??????????????????????????????
const planTypeMenu = () => [
  {
    type: 1,
    // name: $intl.get('myLiable'),
    name: '????????????',
    total: 0,
  },
  {
    type: 3,
    // name: $intl.get('myCreated'),
    name: '????????????',
    total: 0,
  },
]
// ????????????????????????????????????????????????
let scrollToAnchorDomId: any = -1
interface DataNode {
  title: string
  key: string
  isLeaf?: boolean
  children?: DataNode[]
}
export const planContext: any = React.createContext({})
export let CreateAim: any = null
// ??????????????????
let planAuthList: any = []
class OkrListCard extends React.Component<any> {
  // ?????????
  constructor(props: any) {
    super(props)
  }
  // ????????????????????????
  listTableRef: any
  // okr?????????ref
  inputRef: any = null
  // okr????????????ref
  detailModalRef: any = null
  // ??????????????????ref
  selectCmyRef: any = null
  // okr??????????????????
  okrFollowUpModalRef: any = null
  // ?????? okr ????????????
  okrPeriodFiltrateRef: any = null
  // ????????????????????????
  GeneralViewRef: any = null
  // okr??????ref
  okrKanbanRef: any = null
  // ????????????????????????
  createObjectRef: any = null
  // ??????????????????
  selMemberOrg: any = {
    teamId: '',
    sourceType: '', //????????????(?????????)
    allowTeamId: [],
    selectList: [], //????????????????????????
    checkboxType: 'checkbox',
    findType: 0, //???????????? 0?????? 3?????? 31?????? 310????????????
    permissionType: 3, //?????????????????????????????????
    showPrefix: false, //???????????????????????????
    // cascadeMember: true,
    // checkableAll: true,
  }
  state = {
    orgLoading: true, //????????????loading??????????????????
    mainLoading: false, //????????????loading??????????????????
    // ????????????????????????
    isMyPlan: 1,
    treeData: [],
    selectedKeys: [],
    expandedKeys: [],
    planTypeMenu: planTypeMenu(),
    planTypeActive: 1,
    sortType: 0, //??????
    cardDirList: [], //?????????????????????
    cardPlanList: [], //??????????????????
    listModeData: [], // ??????????????????
    orgShow: true, //????????????????????????????????????
    planMode: 0, //???????????? 0?????? 1??????  2?????????
    folderPosList: [{ name: $intl.get('planList'), id: '' }], //???????????????????????????
    allCompanyIds: [], //????????????????????????id
    allCompany: [], //??????????????????????????????
    search: '', //??????????????????
    defaultSearch: '', //??????????????????
    filterSearchStatus: '', //????????????????????????
    newAddFolder: false, //?????????????????????
    newAddFolderTr: false, //?????????????????????
    isShowAddPlan: false, //??????????????????????????????
    addPlanFromType: 0, //????????????????????????????????????
    moveToFolderShow: false, //????????????????????????
    delPlanModalShow: false, //????????????????????????????????????
    shareToRoomModalShow: false, //??????????????????
    memberOrgShow: false,
    statusList: [], //????????????
    grades: [], //0:????????????2???????????????3.?????????
    processStates: [], //???????????? 0:?????????1???????????????2????????????3?????????
    scores: [], //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
    cci: [], //(1-4)-0 (5-8)-1 (9-10)-2
    iptVal: '', //????????????
    controleList: false,
    changeTree: false,
    periodList: [], //????????????
    periodItem: { periodId: '', periodText: '', ratingType: 0 }, //??????????????????????????? ---ratingType???0-?????????1-1?????????100-100???????????????????????????okr???????????????ratingType?????????????????????
    nowHository: false, //??????????????????
    isHideStructure: 0, //????????????????????????
    // ??????OKR
    okrSetting: false,
    okrRatingAuth: false, //??????????????????
    okrCircleAuth: false, //okr??????????????????
    okrBasicAuth: false, //okr????????????????????????
    addObjectAuth: false, //????????????O??????
    periodEnable: false, //okr??????????????????
    okrSettingTips: '',
    // initRefresh: 0,
    isShowFilter: false, //?????????????????????
  }

  componentDidUpdate(prevProps: any) {
    if (this.state.controleList != this.props.visible) {
      this.setState({
        controleList: this.props.visible,
      })
    }
  }

  //??????????????????
  getListView = () => {
    const params = {
      userId: $store.getState().nowUserId,
    }
    $api
      .request('/task/config/okr/getListView', params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then((data: any) => {
        if (data.returnCode === 0) {
          this.setState({ planMode: data.data == 0 ? 0 : data.data })
        } else {
          this.setState({ planMode: 1 })
        }
        if (this.state.planMode == 2) {
          $('.okrQuadrantModal .mainLoading.ant-spin-nested-loading').css({ height: '100%' })
        } else {
          $('.okrQuadrantModal .mainLoading.ant-spin-nested-loading').css({ height: 'calc(100% - 131px)' })
        }
        this.getNowperiodList()
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }
  getNowperiodList = (val?: any) => {
    let cmyId: any = ''
    let mySelf: any = 0
    let ascriptionType: any = ''
    let ascriptionId: any = ''
    if (this.state.isMyPlan) {
      mySelf = this.state.planTypeActive
    } else {
      const treeInfo = getTreeParam($store.getState().workokrTreeId)
      ascriptionId = treeInfo.curId
      ascriptionType = treeInfo.curType
      cmyId = treeInfo.cmyId
    }
    selectDateDisplay().then((res: any) => {
      this.state.nowHository = res.data.isClosed ? true : false
      this.state.isHideStructure = res.data.isHideStructure ? 1 : 0
      periodGetList({
        numDisplay: res.data.isClosed,
        id: cmyId,
        mySelf,
        ascriptionId,
        ascriptionType,
        status: val ? this.state.statusList : [4, 3, 1],
      }).then((res: any) => {
        const dataList = res.dataList || []
        this.state.periodList = res.dataList
        // ??????????????????
        const selectItem = dataList.filter((item: any) => {
          return item.isSelected == true
        })
        // ???????????????????????????
        const itemRember = dataList.filter((item: any) => {
          return item.isRemember == 1
        })
        // ????????????????????????????????????????????????
        const itemSelected = itemRember.length > 0 ? itemRember : selectItem
        this.state.periodItem = res.dataList ? itemSelected[0] : {}

        if (val) {
          this.findPlanList({ init: true, periodEnable: res.data })
        } else {
          this.findPlanList({ periodEnable: res.data })
        }
        // this.findPlanList({ periodEnable: res.data, initRefresh: true })
        this.setState({ ...this.state })
      })
    })
  }
  //??????????????????0?????? 1??????
  changeListView = (type: any) => {
    const params = {
      userId: $store.getState().nowUserId,
      listView: type,
    }
    $api
      .request('/task/config/okr/changeListView ', params, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then((data: any) => {
        if (data.returnCode != 0) {
          message.error(data.returnMessage)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }
  // =======??????============//
  // ??????????????????
  planTimeMenu = (
    <Menu className="myDropMenu tick def planOptBtnMenu planTimeSort" selectable defaultSelectedKeys={['0']}>
      <Menu.Item
        key="0"
        onClick={() => {
          this.sortChange(0)
        }}
      >
        <div className={'myMenuItem'}>
          <span>{$intl.get('DescOrder')}</span>
        </div>
      </Menu.Item>
      <Menu.Item
        key="1"
        onClick={() => {
          this.sortChange(1)
        }}
      >
        <div className={'myMenuItem'}>
          <span>{$intl.get('AscOrder')}</span>
        </div>
      </Menu.Item>
    </Menu>
  )

  // ***************??????????????????????????????????????????********************//
  // ????????????
  myPlanChange = async () => {
    scrollToAnchorDomId = -1
    $store.dispatch({ type: 'PLANOKRMAININFO', data: { isMyPlan: true, orgInfo: {} } })
    $store.dispatch({ type: 'WORKPLAN_OKR_TREEID', data: { workokrTreeId: '' } })
    await this.setBtnAuth({ isMyPlan: true })
    // ?????????????????????
    this.setState(
      {
        isMyPlan: 1,
        selectedKeys: [],
        folderPosList: [{ name: $intl.get('planList'), id: '' }],
      },
      () => {
        selectDateDisplay().then((res: any) => {
          this.state.nowHository = res.data.isClosed ? true : false
          this.state.isHideStructure = res.data.isHideStructure
          periodGetList({
            numDisplay: res.data.isClosed,
            mySelf: this.state.planTypeActive,
            status: this.state.statusList,
          }).then((res: any) => {
            const dataList = res.dataList || []
            this.state.periodList = res.dataList
            this.state.iptVal = ''
            this.state.filterSearchStatus = ''
            this.state.sortType = 0
            this.state.grades = []
            this.state.processStates = []
            this.state.scores = []
            this.state.cci = []
            // ??????????????????
            const selectItem = dataList.filter((item: any) => {
              return item.isSelected == true
            })
            // ???????????????????????????
            const itemRember = dataList.filter((item: any) => {
              return item.isRemember == 1
            })
            // ????????????????????????????????????????????????
            const itemSelected = itemRember.length > 0 ? itemRember : selectItem
            this.state.periodItem = res.dataList ? itemSelected[0] : {}
            // this.findPlanList({ periodEnable: res.data, initRefresh: true })
            this.findPlanList({ periodEnable: res.data })
            this.setState({ ...this.state })
          })
        })
      }
    )
  }
  // ================??????????????????============//
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
  // ????????????????????????????????????
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
   * ??????????????????
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
          folderPosList: [{ name: $intl.get('planList'), id: '' }],
        }
        const treeInfo = getTreeParam(e.node.key)
        this.setState(setObj, async () => {
          if (treeInfo.cmyId) {
            scrollToAnchorDomId = treeInfo.cmyId
          }
          // let nowCmyData = false
          const _beforCmyId = getTreeParam($store.getState().workokrTreeId).cmyId
          if (!_beforCmyId || treeInfo.cmyId != _beforCmyId) {
            // nowCmyData = true
            // ??????????????????
            await this.setBtnAuth({ isMyPlan: false, typeId: treeInfo.cmyId, type: 2 })
          }

          //?????????????????????id  treeInfo.cmyId
          $store.dispatch({ type: 'WORKPLAN_OKR_TREEID', data: { workokrTreeId: e.node.key } })
          $store.dispatch({ type: 'PLANOKRMAININFO', data: { isMyPlan: false, orgInfo: treeInfo } })

          $store.dispatch({ type: 'OKRPERIODFILTER', data: {} })
          //????????????
          let deptId: any = undefined
          let roleId: any = undefined
          if (!this.state.isMyPlan && treeInfo.curType == 0) {
            deptId = treeInfo.parentId
            roleId = treeInfo.roleId
          }
          periodGetList({
            numDisplay: this.state.nowHository ? 1 : 0,
            id: treeInfo.cmyId,
            mySelf: 0,
            ascriptionId: treeInfo.curId,
            ascriptionType: treeInfo.curType,
            status: this.state.statusList,
            deptId,
            roleId,
          }).then((res: any) => {
            const dataList = res.dataList || []
            this.state.periodList = res.dataList
            // ??????????????????
            const selectItem = dataList.filter((item: any) => {
              return item.isSelected == true
            })
            // ???????????????????????????
            const itemRember = dataList.filter((item: any) => {
              return item.isRemember == 1
            })
            // ????????????????????????????????????????????????
            const itemSelected = itemRember.length > 0 ? itemRember : selectItem
            this.state.periodItem = res.dataList ? (itemSelected[0] ? itemSelected[0] : {}) : {}
            this.state.iptVal = ''
            this.state.filterSearchStatus = ''
            this.state.sortType = 0
            this.state.grades = []
            this.state.processStates = []
            this.state.scores = []
            this.state.cci = []
            // this.findPlanList({ periodEnable: res.data, initRefresh: true })
            // ????????????????????????????????????????????????
            // this.state.planMode != 1 &&
            this.findPlanList({ periodEnable: res.data })
            this.setState({ ...this.state })
          })
        })
      }
    })
  }

  /**
   * ??????????????????????????????
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
  // ============??????????????????=============//
  // ??????????????????????????????
  queryTreeFirst = () => {
    const expandedKeys: any = []
    queryTreeDataApi({
      account: $store.getState().nowAccount,
      isAllOrg: 1,
      defaultLoginUser: 0,
      setLoadState: this.setOrgLoad,
    }).then(res => {
      const data = res.data || []
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
            isCount: true, //????????????
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
  // ??????????????????????????????
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
            isCount: true, //????????????
          }
        )
        if (resolve) {
          this.updateTreeData(treeData, treeNode.key, newDataList)
          this.setState({
            treeData: [...treeData],
          })
          resolve()
        }
      }
    })
  }

  /**
   * ??????????????????
   * type?????????????????????
   * typeId:????????????id
   */
  findAuthList = (paramObj: { typeId: any; type?: number }) => {
    return new Promise((resolve: any) => {
      const { nowUserId } = $store.getState()
      const param = {
        // system: 'oa',
        // account: nowAccount,
        // type: paramObj.type ? paramObj.type : 2,
        // typeId: paramObj.typeId,
        userId: nowUserId,
        belongId: paramObj.typeId || 0,
      }
      requestApi({
        url: '/team/permission/getUserPermission',
        param: param,
        apiType: 1,
      })
        .then(res => {
          if (res.success) {
            const dataList = res.data.dataList || []
            resolve(dataList)
          } else {
            resolve(false)
          }
        })
        .catch(() => {
          resolve(false)
        })
    })
  }
  // ?????????????????????????????????
  async setBtnAuth({ isMyPlan, typeId, type }: any) {
    //????????????
    let okrRatingAuth = false
    // ??????????????????
    let okrCircleAuth = false
    // ??????????????????
    let okrBasicAuth = false
    // ????????????O??????
    let addObjectAuth = false
    // ??????????????????????????????
    if (!isMyPlan) {
      const authList = await this.findAuthList({ typeId, type })
      okrRatingAuth = getAuthStatus('/task/okr/rating/save', authList)
      okrCircleAuth = getAuthStatus('/task/okr/period/save', authList)
      okrBasicAuth = getAuthStatus('okrSet', authList)
      addObjectAuth = getAuthStatus('okrSet', authList) //????????????O??????
      planAuthList = authList
    }
    this.setState({
      okrRatingAuth: okrRatingAuth,
      okrCircleAuth: okrCircleAuth,
      okrBasicAuth,
      addObjectAuth,
    })

    return { okrBasicAuth }
  }

  // ***********************************????????????????????????*********************************//
  // **************??????????????????????????????***********//
  // ===????????????===//
  // ??????????????????
  planTypeChange = (e: any) => {
    e.preventDefault()

    const type = Number(e.currentTarget.dataset.type)
    this.setState(
      {
        // sortType: 0, //0????????????1?????????
        // grades: [], //0:????????????2???????????????3.?????????
        // processStates: [], //???????????? 0:?????????1???????????????2????????????3?????????
        // scores: [], //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
        // cci: [], //(1-4)-0 (5-8)-1 (9-10)-2
        planTypeActive: type,
        folderPosList: [{ name: $intl.get('planList'), id: '' }],
      },
      () => {
        periodGetList({
          numDisplay: this.state.nowHository ? 1 : 0,
          mySelf: type,
          status: this.state.statusList,
          sortType: this.state.sortType,
          grades: this.state.grades,
          processStates: this.state.processStates,
          scores: this.state.scores,
          cci: this.state.cci,
        }).then((res: any) => {
          const dataList = res.dataList || []
          this.state.periodList = res.dataList
          // ??????????????????
          const selectItem = dataList.filter((item: any) => {
            return item.isSelected == true
          })
          // ???????????????????????????
          const itemRember = dataList.filter((item: any) => {
            return item.isRemember == 1
          })
          // ????????????????????????????????????????????????
          const itemSelected = itemRember.length > 0 ? itemRember : selectItem
          this.state.periodItem = res.dataList ? itemSelected[0] : {}
          // this.findPlanList({ periodEnable: res.data, initRefresh: true })
          this.findPlanList({ periodEnable: res.data })
          this.setState({ ...this.state })
          // ????????????????????????
          ipcRenderer.send('solve_okrList_generalView', {
            refresh: true,
          })
        })
        //??????????????????
        // upperiodStatFn()
      }
    )
  }
  sortChange = (type: any) => {
    this.setState(
      {
        sortType: type,
        // folderPosList: [{ name: '????????????', id: '' }],
      },
      () => {
        // this.findPlanList({ initRefresh: true })
        this.findPlanList()
      }
    )
  }
  // ????????????
  modeChange = (type: number) => {
    //0:?????? 1????????? 2?????????
    this.setState({ planMode: type }, () => {
      //????????????????????? ????????????
      if (type == 1) {
        return
      }
      this.findPlanList({ modeChange: true })
    })
    this.changeListView(type)
  }
  // ??????????????????
  modeListChange = (numData: number) => {
    this.setState({ planMode: numData })
    this.changeListView(numData)
    //?????????
    if (numData == 2) {
      $('.okrQuadrantModal .mainLoading.ant-spin-nested-loading').css({ height: '100%' })
    } else {
      $('.okrQuadrantModal .mainLoading.ant-spin-nested-loading').css({ height: 'calc(100% - 131px)' })
    }
    //????????????????????? ????????????
    if (numData == 1) {
      return
    }
    this.findPlanList({ modeChange: true })
  }
  /**
   * ????????????????????????
   */
  planListParam = (infoObj?: any) => {
    const paramObj = infoObj ? infoObj : {}
    // ????????????
    const nowPos = this.state.folderPosList[this.state.folderPosList.length - 1]
    // ????????????
    const filterObj = paramObj.filterObj || {}
    const treeInfo = getTreeParam($store.getState().workokrTreeId)
    let deptId = '0',
      roleId = '0'
    const isMyPlan = this.state.isMyPlan
    if (!isMyPlan && treeInfo.curType == 0) {
      deptId = treeInfo.parentId
      roleId = treeInfo.roleId
    }
    let statusList = [4, 3, 1]
    // let statusList = [4, 3, 1, 2]//???????????????????????????
    if (filterObj.statusList) {
      statusList = filterObj.statusList
      this.setState({
        statusList: filterObj.statusList,
      })
    } else if (this.state.statusList.length > 0) {
      statusList = this.state.statusList
    } else {
      this.setState({
        statusList: statusList,
      })
    }
    const param: any = {
      operateUser: $store.getState().nowUserId,
      ascriptionId: isMyPlan ? '' : treeInfo.curId,
      ascriptionType: isMyPlan ? '' : treeInfo.curType,
      // keyword: filterObj.searchVal || '',
      keyword: this.state.filterSearchStatus,
      sortType: this.state.sortType, //0????????????1???filterObj.
      grades: this.state.grades, //0:????????????2???????????????3.?????????
      processStates: this.state.processStates, //???????????? 0:?????????1???????????????2????????????3?????????
      scores: this.state.scores, //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
      cci: this.state.cci, //(1-4)-0 (5-8)-1 (9-10)-2
      status: statusList,
      deptId: deptId,
      roleId: roleId,
      mySelf: isMyPlan ? this.state.planTypeActive : 0,
      sortField: 1, //???????????????0?????? 1???????????? 2????????????
      // sortType: this.state.sortType, //???????????????0?????? 1??????
      // taskTypes: filterObj.typeList || [0, 3, 2, 1], //[0,1,2,3,4]//0?????????1?????????2?????????3??????
      taskTypes: [0, 5], //[0,1,2,3,4]//0?????????5?????? ???????????????????????????
      teamId: isMyPlan ? '' : treeInfo.cmyId,
      periodId: this.state.periodItem?.periodId, //this.state.periodItem.periodId,
    }
    // ???????????????????????????
    if (paramObj.listModeChild) {
      if (paramObj.dirId) {
        param.parentId = paramObj.dirId
      }
    } else {
      if (nowPos.id) {
        param.parentId = nowPos.id
      }
    }
    return param
  }
  /**
   * ??????????????????
   */
  findPlanList = (infoObj?: any) => {
    const paramObj: any = infoObj ? infoObj : {}

    return new Promise((resolve: any) => {
      const fn = () => {
        if (paramObj.search) {
          this.setState(
            {
              isMyPlan: false,
              okrSettingTips: '',
            },
            () => {
              const param = this.planListParam(paramObj)
              // this.findPlanData(param, paramObj).then((res: any) => {
              this.findPlanData(param).then((res: any) => {
                resolve(res)
              })
            }
          )
        } else {
          // ???????????????+????????? ????????????
          // if (this.state.planMode == 1) return
          const param = this.planListParam(paramObj)
          // this.findPlanData(param, paramObj).then((res: any) => {
          this.findPlanData(param).then((res: any) => {
            resolve(res)
          })
        }
      }
      if (paramObj.periodEnable !== undefined) {
        // okr????????????
        const periodEnable = paramObj.periodEnable === false ? false : true
        // ??????okr????????????????????????
        $store.dispatch({
          type: 'OKRPERIODFILTER',
          data: { periodEnable },
        })
        const setStateData: any = { periodEnable }
        // ???????????????????????????????????????????????????
        const okrBasicAuth = getAuthStatus('okrSet', planAuthList)
        if (okrBasicAuth && !periodEnable) {
          setStateData.okrSettingTips = '????????????????????????OKR?????????????????????OKR?????????????????????'
        } else {
          setStateData.okrSettingTips = ''
        }
        // ??????????????????
        this.setState(setStateData, () => {
          fn()
        })
      } else {
        fn()
      }
    })
  }
  findPlanData = (param: any, attachObj?: any) => {
    // const attachInfo = attachObj ? attachObj : {}
    param.setLoadState = this.setMainLoad
    param.hasChild = 1
    // ??????????????????
    if (typeof param.periodId != 'undefined') {
      remberPeriodApi({ okrPeriodId: param.periodId, ascriptionId: param.teamId })
    }

    return new Promise((resolve: any) => {
      queryPlanListNew(param).then(res => {
        const dataObj = res.data.obj || {}
        if (res.success) {
          const numObj: any = res.data.data || {}
          const planTypeMenu = this.state.planTypeMenu
          // ???????????????
          planTypeMenu[0].total = numObj.LIABLE || 0
          planTypeMenu[1].total = numObj.CREATE || 0
          // ????????????
          if (param.updeta) {
            this.setState(this.state)
            return
          }
          if (this.state.planMode) {
            this.setState({
              listModeData: [...(dataObj.top || []), ...(dataObj.bottom || [])],
              // initRefresh: attachInfo.initRefresh ? this.state.initRefresh + 1 : this.state.initRefresh,
            })
          } else {
            this.setState({
              cardDirList: dataObj.top || [],
              cardPlanList: dataObj.bottom || [],
            })
          }
          resolve(res.success)
        } else {
          // ????????????
          if (this.state.planMode) {
            this.setState({
              listModeData: [],
              // initRefresh: attachInfo.initRefresh ? this.state.initRefresh + 1 : this.state.initRefresh,
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
  // ============================???????????????=====================//
  // ====???????????????====//
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
  // ====???????????????====//
  jumpFileDoc = (toIndex: number) => {
    const newPos: any = []
    // ????????????????????????????????????????????????
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
  // ============================??????????????????=====================//
  /**
   * ???????????????
   */
  searchSelect = (paramObj: { treeId: string }) => {
    const treeInfo = getTreeParam(paramObj.treeId)
    $store.dispatch({ type: 'WORKPLAN_OKR_TREEID', data: { workokrTreeId: paramObj.treeId } })
    $store.dispatch({ type: 'PLANOKRMAININFO', data: { orgInfo: treeInfo } })
    //????????????
    let deptId: any = undefined
    let roleId: any = undefined
    if (treeInfo.curType == 0) {
      deptId = treeInfo.parentId
      roleId = treeInfo.roleId
    }
    periodGetList({
      numDisplay: this.state.nowHository ? 1 : 0,
      id: treeInfo.cmyId,
      mySelf: 0,
      ascriptionId: treeInfo.curId,
      ascriptionType: treeInfo.curType,
      status: this.state.statusList,

      deptId,
      roleId,
    }).then((res: any) => {
      const dataList = res.dataList || []
      this.state.periodList = res.dataList
      // ??????????????????
      const selectItem = dataList.filter((item: any) => {
        return item.isSelected == true
      })
      // ???????????????????????????
      const itemRember = dataList.filter((item: any) => {
        return item.isRemember == 1
      })
      // ????????????????????????????????????????????????
      const itemSelected = itemRember.length > 0 ? itemRember : selectItem
      this.state.periodItem = res.dataList ? itemSelected[0] : {}
      this.state.isMyPlan = 0
      // this.findPlanList({ search: true, periodEnable: res.data, initRefresh: true })
      this.findPlanList({ search: true, periodEnable: res.data })
      this.setState({ ...this.state })
    })
  }

  // ============================??????loading??????????????????=====================//
  /**
   * ??????????????????loading??????????????????
   */
  setOrgLoad = (flag: boolean) => {
    // this.setState({
    //   orgLoading: flag,
    // })
  }
  /**
   * ????????????loading??????????????????
   */
  setMainLoad = (flag: boolean) => {
    this.setState({
      mainLoading: flag,
    })
  }

  // ================????????????============//
  // ??????????????????????????????
  afterFilter = (filterObj: any) => {
    if (!filterObj) {
      return
    }
    // if (filterObj.filtertype) {
    this.state.sortType = filterObj.sortType
    this.state.grades = filterObj.grades
    this.state.processStates = filterObj.processStates
    this.state.scores = filterObj.scores
    this.state.cci = filterObj.cci
    this.state.statusList = filterObj.statusList
    this.state.filterSearchStatus = filterObj.searchVal || ''
    this.setState({ ...this.state })
    // } else {
    //   this.state.statusList = filterObj.statusList
    //   this.state.filterSearchStatus = filterObj.searchVal || ''
    //   this.setState({
    //     ...this.state,
    //   })
    // }
    this.findPlanList({
      advancedFilter: true,
      filterObj: filterObj,
      // initRefresh: true,
    })
  }
  /**
   * ????????????
   */
  async componentDidMount() {
    // ????????????????????????
    loadLocales()
    await this.setBtnAuth({ isMyPlan: true })
    this.getListView()
    this.queryTreeFirst()

    // $store.dispatch({ type: 'OKRPERIODFILTER', data: {} })
    $store.dispatch({ type: 'WORKPLAN_OKR_TREEID', data: { workokrTreeId: '' } })
    // ??????????????????
    ipcRenderer.on('refresh_plan_list', () => {
      if ($('.okr_view_mind').length > 0) {
        //??????????????????
        refMINDFn()
      } else {
        this.refreshData({ optType: '' })
      }
    })
  }
  componentWillUnmount() {
    this.okrPeriodFiltrateRef = null
    this.GeneralViewRef = null
    planAuthList = []
  }
  /**
   * ????????????
   * optType-????????????
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
      case 'rename': //?????????
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
      case 'del': //??????
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
    // ????????????????????????????????????????????????????????????????????????
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
  // ==========================??????????????????????????? start===================//
  /**
   * ???????????????????????????
   */

  setMoveToFolderShow = (flag: boolean) => {
    this.setState({
      moveToFolderShow: flag,
    })
  }
  /**
   * ??????????????????
   */
  setDelPlanModalShow = (flag: boolean) => {
    this.setState({
      delPlanModalShow: flag,
    })
  }
  /**
   * ??????????????????
   */
  setShareToRoomModalShow = (flag: boolean) => {
    this.setState({
      shareToRoomModalShow: flag,
    })
  }
  /**
   * ??????????????????????????????
   */
  setMemberOrgShow = (flag: boolean, optType?: string) => {
    this.selMemberOrg.sourceType = optType || ''
    const sourceItem = $store.getState().planModalObj.sourceItem || {}
    this.selMemberOrg.teamId = sourceItem.teamId
    this.selMemberOrg.allowTeamId = [sourceItem.teamId]
    if (optType == 'shareToUser') {
      // ?????????????????????
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
      // ????????????????????????
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
          // ?????????????????????????????????
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
   * ??????????????????
   * attachObj:{}????????????
   */
  selMemberSure = (dataList: any, attachObj: any) => {
    const sourceItem = $store.getState().planModalObj.sourceItem || {}
    const typeIds: any = []
    dataList.map((item: any) => {
      typeIds.push(item.curId)
    })
    if (attachObj.sourceType == 'shareToUser') {
      shareToUserSave({
        id: sourceItem.id, //??????id
        type: 1, //?????????0?????? 1?????????
        typeIds: typeIds, //??????id
        name: sourceItem.name,
        mainId: sourceItem.mainId,
        typeId: sourceItem.typeId,
      })
    } else if (attachObj.sourceType == 'editMemberAuth') {
      saveEditMember({
        id: sourceItem.id, //??????id
        receivers: typeIds, //id??????
        name: sourceItem.name,
      })
    }
  }

  // ==========================??????????????????????????? end===================//
  /**
   *??????????????????
   */
  listTableOnRef = (ref: any) => {
    this.listTableRef = ref
  }
  okrFollowUpOnRef = (ref: any) => {
    this.okrFollowUpModalRef = ref
  }
  render() {
    const nowFolder = this.state.folderPosList[this.state.folderPosList.length - 1]
    /**
     * ?????????????????????
     */
    const planModeObj = {
      isMyPlan: this.state.isMyPlan,
      // ????????????????????????
      planType: this.state.planTypeActive,
      // ??????????????????
      planMode: this.state.planMode,
      // ??????????????????????????????????????????????????????
      folderPosList: this.state.folderPosList,
      //????????????????????????
      changeTree: this.state.changeTree,
      nowFolderId: nowFolder?.id,
      // ??????????????????
      folderDataList: [...(this.state.cardDirList || []), ...(this.state.cardPlanList || [])],
      newAddFolder: this.state.newAddFolder,
      cardDirList: this.state.cardDirList,
      cardPlanList: this.state.cardPlanList,
      okrPeriodFiltrateRef: this.okrPeriodFiltrateRef,
      GeneralViewRef: this.GeneralViewRef,
      findPlanList: this.findPlanList,
      refreshData: this.refreshData,
      setMoveToFolderShow: this.setMoveToFolderShow,
      setDelPlanModalShow: this.setDelPlanModalShow,
      setShareToRoomModalShow: this.setShareToRoomModalShow,
      setMemberOrgShow: this.setMemberOrgShow,
      planListParam: this.planListParam,
      okrKanbanRef: this.okrKanbanRef,
      createObjectRef: this.createObjectRef,
    }
    // const listModeData = this.state.listModeData
    // ??????????????????
    const selMemberOrg = this.selMemberOrg
    const memberOrgParem = {
      visible: this.state.memberOrgShow,
      ...selMemberOrg,
    }
    // ??????????????????
    // const planMainInfo = $store.getState().planOkrMainInfo
    // const orgInfo = planMainInfo.orgInfo || {}
    // console.log(orgInfo)
    CreateAim = () => {
      const { isMyPlan } = this.state
      $store.dispatch({ type: 'DIFFERENT_OkR', data: 1 })
      if (isMyPlan) {
        //?????????????????????????????????????????? ????????????
        // console.log('allCompany', this.state.allCompany)

        //???????????????????????????????????????-????????????
        this.setState({ addPlanFromType: Number(1) })
        // if (this.state.allCompany.length == 1) {
        const tmp: any = this.state.allCompany[0]
        $store.dispatch({
          type: 'MYPLAN_ORG',
          data: { cmyId: tmp.id, curType: -1, cmyName: tmp.name, curId: tmp.id },
        })
        // $tools.createWindow('okrFourquadrant')
        const param = {
          visible: true,
          createType: 'add',
          from: 'workbench_okr',
          nowType: 0, //0???????????? 2???????????? 3????????????
          callbacks: (param: any, code: any) => {},
        }
        this.createObjectRef && this.createObjectRef.getState(param)
        // } else {
        //   this.selectCmyRef && this.selectCmyRef.initFn()
        // }
      } else {
        // ????????????-????????????
        const getplanTree = getTreeParam($store.getState().workokrTreeId)
        $store.dispatch({
          type: 'MYPLAN_ORG',
          data: {
            cmyId: getplanTree.cmyId,
            curType: getplanTree.curType,
            deptId: getplanTree.curType ? '' : getplanTree.parentId,
            userId: getplanTree.curType ? '' : getplanTree.curType,
            cmyName: getplanTree.cmyName,
            curId: getplanTree.curId,
          },
        })
        // $tools.createWindow('okrFourquadrant')
        const param = {
          visible: true,
          createType: 'add',
          from: 'workbench_okr',
          nowType: 0, //0???????????? 2???????????? 3????????????
          teaminfo: {
            teamId: getplanTree.cmyId,
            ascriptionId: getplanTree.curId,
            ascriptionType: getplanTree.curType,
          }, //????????????
          callbacks: (param: any, code: any) => {},
        }
        this.createObjectRef && this.createObjectRef.getState(param)
      }
      const namePlan = $store.getState().planOkrMainInfo.isMyPlan ? 1 : 0
      if (namePlan != isMyPlan) {
        $store.dispatch({ type: 'PLANOKRMAININFO', data: { isMyPlan: isMyPlan ? true : false } })
      }
      const nowFolder = this.state.folderPosList[this.state.folderPosList.length - 1]
      $store.dispatch({ type: 'PLANOKRMAININFO', data: { nowFolderId: nowFolder?.id } })
    }
    //????????????
    const periodIChangeFiltrate = (value: any) => {
      if (value) {
        // ????????????????????????????????????,
        if (this.state.periodItem?.periodId == value?.periodId) {
          //?????????????????????????????????????????????
          ipcRenderer.send('solve_okrList_generalView', {
            refresh: true,
          })
        }
        this.state.periodItem = value
        // this.state.iptVal = ''
        // this.state.filterSearchStatus = ''
        // this.state.sortType = 0 //0????????????1?????????
        // this.state.grades = [] //0:????????????2???????????????3.?????????
        // this.state.processStates = [] //???????????? 0:?????????1???????????????2????????????3?????????
        // this.state.scores = [] //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
        // this.state.cci = [] //(1-4)-0 (5-8)-1 (9-10)-2
        this.setState({ ...this.state })

        const param = this.planListParam({
          typeList: [0, 3, 2, 1],
          statusList: this.state.statusList,
        })
        // this.findPlanData(param, { initRefresh: true })
        this.findPlanData(param)
      }
    }

    // state????????????
    const {
      allCompany,
      allCompanyIds,
      isHideStructure,
      orgShow,
      isMyPlan,
      treeData,
      expandedKeys,
      selectedKeys,
    } = this.state
    return (
      <planContext.Provider value={planModeObj}>
        <section className="secondPageContainer okrContainer okrQuadrantModal flex-1 flex">
          {/* ???????????? */}
          <OkrOrgCom
            allCompany={allCompany}
            allCompanyIds={allCompanyIds}
            isHideStructure={isHideStructure}
            orgShow={orgShow}
            isMyPlan={isMyPlan}
            myPlanChange={this.myPlanChange}
            onLoadData={this.onLoadData}
            treeData={treeData}
            onSelect={this.onSelect}
            onExpand={this.onExpand}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            searchSelect={this.searchSelect}
            setPlanState={(param: any) => {
              this.setState({
                ...this.state,
                ...param,
              })
            }}
          />
          <main
            className="orgRightCon workPlanRightCon flex-1"
            style={this.state.planMode == 2 ? { backgroundColor: '#f5f5f5' } : {}}
          >
            {/* {this.state.planMode != 2 && ( */}
            <header className="secondPageNav okrPageNav">
              <OkrHearder
                hearderData={{
                  orgShow: this.state.orgShow,
                  isMyPlan: this.state.isMyPlan, //???????????????okr
                  planTypeMenu: this.state.planTypeMenu, //???????????????tab
                  periodEnable: this.state.periodEnable,
                  periodList: this.state.periodList,
                  periodItem: this.state.periodItem,
                  planMode: this.state.planMode,
                  nowHository: this.state.nowHository,
                  okrBasicAuth: this.state.okrBasicAuth,
                  addObjectAuth: this.state.addObjectAuth,
                  okrSettingTips: this.state.okrSettingTips,
                }}
                teamId={isMyPlan ? '' : getTreeParam($store.getState().workokrTreeId).cmyId} //??????id
                filterMoules={{
                  sortType: this.state.sortType,
                  grades: this.state.grades,
                  processStates: this.state.processStates,
                  scores: this.state.scores,
                  cci: this.state.cci,
                  statusList: this.state.statusList,
                }}
                callback={(val: any) => {
                  this.setState({ ...this.state, ...val })
                }}
                planTypeChange={this.planTypeChange}
                periodIChange={periodIChangeFiltrate}
                getNowperiodList={this.getNowperiodList}
                afterFilter={this.afterFilter}
                CreateAim={CreateAim}
                modeChange={this.modeChange}
                modeListChange={this.modeListChange}
                setOkrPeriodRef={(ref: any) => {
                  planModeObj.okrPeriodFiltrateRef = ref
                }}
              ></OkrHearder>
            </header>
            {/* )} */}
            {/* ????????????????????? */}
            <Spin spinning={this.state.mainLoading} wrapperClassName="mainLoading flex-1">
              {/* ???????????????????????????????????????<DndProvider backend={HTML5Backend}>??? */}
              <DndProvider backend={HTML5Backend}>
                <section className="workPlanCon OKRDetailResize">
                  {/* ???????????? */}
                  <CardModeList
                    param={{
                      cardDirList: this.state.cardDirList,
                      cardPlanList: this.state.cardPlanList,
                      folderPosList: this.state.folderPosList,
                      newAddFolder: this.state.newAddFolder,
                      planMode: this.state.planMode,
                      planType: this.state.planTypeActive,
                      filterSearchStatus: this.state.filterSearchStatus,
                    }}
                    detailModalRef={this.detailModalRef}
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
                  {/* okr????????????????????????????????????????????? */}
                  {this.state.planMode == 1 && (
                    <div className={`okrModuleContainer`}>
                      {/* <InfiniteScroll
                        initialLoad={false}
                        pageStart={0}
                        loadMore={() => {
                          this.okrKanbanRef && this.okrKanbanRef.scrollOnLoadOfOkrKanban()
                        }}
                        useWindow={false}
                        hasMore={getOkrKanbanState()}
                        style={{ height: '100%' }}
                      > */}
                      {/* ?????? ?????? */}
                      {this.state.periodEnable &&
                      ((isMyPlan && this.state.periodItem?.periodId) || !isMyPlan) ? (
                        <GeneralView
                          ref={ref => (this.GeneralViewRef = ref)}
                          filterMoules={{
                            // sortType: this.state.sortType,
                            statusList: this.state.statusList,
                            searchTexe: this.state.filterSearchStatus,
                            grades: this.state.grades,
                            processStates: this.state.processStates,
                            scores: this.state.scores,
                            cci: this.state.cci,
                            planTypeActive: this.state.planTypeActive,
                            isMyPlan: this.state.isMyPlan,
                            // planMode: this.state.planMode,
                            ascriptionId: isMyPlan ? '' : getTreeParam($store.getState().workokrTreeId).curId,
                            ascriptionType: isMyPlan
                              ? ''
                              : getTreeParam($store.getState().workokrTreeId).curType,
                            teamId: isMyPlan ? '' : getTreeParam($store.getState().workokrTreeId).cmyId,
                            periodId: this.state.periodItem?.periodId,
                          }}
                        />
                      ) : (
                        ''
                      )}
                      <OkrKanban
                        ref={ref => (this.okrKanbanRef = ref)}
                        periodEnable={this.state.periodEnable}
                        params={{
                          moduleType: 1,
                          isFollow: false,
                          screenVsible: false,
                          fromSource: 'okr_module',
                          fromType: 'okr',
                          filterMoules: {
                            sortType: this.state.sortType,
                            grades: this.state.grades, //0:????????????2???????????????3.?????????
                            processStates: this.state.processStates, //???????????? 0:?????????1???????????????2????????????3?????????
                            scores: this.state.scores, //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
                            cci: this.state.cci, //(1-4)-0 (5-8)-1 (9-10)-2
                            statusList: this.state.statusList,
                            searchTexe: this.state.filterSearchStatus,
                            planTypeActive: this.state.planTypeActive,
                            isMyPlan: this.state.isMyPlan,
                            planMode: this.state.planMode,
                            periodId: this.state.periodItem?.periodId,
                          },
                        }}
                        detailModalRef={this.detailModalRef}
                        GeneralViewRef={this.GeneralViewRef}
                      />
                      {/* </InfiniteScroll> */}
                    </div>
                  )}

                  {/* ?????????????????? */}
                  {this.state.planMode == 2 && this.state.listModeData?.length > 0 && (
                    <ListDetailLarge
                      data={this.state.listModeData}
                      // refresh={this.state.initRefresh}
                      mianData={{
                        isMyPlan: this.state.isMyPlan,
                        planTypeActive: this.state.planTypeActive,
                        CreateAim: CreateAim,
                        periodList: this.state.periodList,
                        periodItem: this.state.periodItem,
                        nowHository: this.state.nowHository,
                        orgShow: this.state.orgShow,
                        isHideStructure: this.state.isHideStructure,
                      }}
                      planTypeMenu={this.state.planTypeMenu}
                      okrCircleAuth={this.state.okrCircleAuth}
                      okrRatingAuth={this.state.okrRatingAuth}
                      okrBasicAuth={this.state.okrBasicAuth}
                      addObjectAuth={this.state.addObjectAuth}
                      periodEnable={this.state.periodEnable}
                      okrSettingTips={this.state.okrSettingTips}
                      planTypeChange={this.planTypeChange}
                      modeListChange={this.modeListChange}
                      afterFilter={this.afterFilter}
                      periodIChange={(value: any) => {
                        if (value) {
                          this.state.periodItem = value
                          this.setState({ ...this.state })
                          const param = this.planListParam({
                            // searchVal: this.state.statusList,
                            typeList: [0, 3, 2, 1],
                            statusList: this.state.statusList,
                          })
                          // this.findPlanData(param, { initRefresh: true })
                          this.findPlanData(param)
                        }
                      }}
                      setChange={(data: any) => {
                        if (data == 1) {
                          this.getNowperiodList('edit')
                        } else if (data == 'widesmall') {
                          this.state.orgShow = true
                          this.setState({ ...this.state })
                        }
                      }}
                    />
                  )}
                  {this.state.planMode == 2 && this.state.listModeData?.length < 1 && (
                    <NoneData
                      key="2"
                      className={`threePosition`}
                      searchValue={this.state.filterSearchStatus ? this.state.filterSearchStatus : ''}
                      imgSrc={$tools.asAssetsPath(`/images/noData/s_okr_people.svg`)}
                      showTxt={$intl.get('noMyOKRMsg')}
                      containerStyle={{ zIndex: 0 }}
                    />
                  )}
                </section>
              </DndProvider>
            </Spin>
          </main>
          {/* ?????????????????? */}
          <WorkPlanMindModal ref={(ref: any) => (this.selectCmyRef = ref)} isOkr={true}></WorkPlanMindModal>
          {/* ???????????? */}
          {/* <WorkPlanMindRightMeun></WorkPlanMindRightMeun> */}
          {/*?????????????????? */}
          <WorkPlanModal
            param={{
              moveToFolderShow: this.state.moveToFolderShow,
              delPlanModalShow: this.state.delPlanModalShow,
              shareToRoomModalShow: this.state.shareToRoomModalShow,
              form: 'okrModule',
            }}
            action={{
              setMoveToFolderShow: this.setMoveToFolderShow,
              setDelPlanModalShow: this.setDelPlanModalShow,
              setShareToRoomModalShow: this.setShareToRoomModalShow,
            }}
          />
        </section>
        <CreateObjectModal ref={(ref: any) => (this.createObjectRef = ref)} />
        <SelectMemberOrg
          param={memberOrgParem}
          action={{
            setModalShow: this.setMemberOrgShow,
            // ????????????
            onSure: this.selMemberSure,
          }}
        />
        {this.state.okrSetting && (
          <OkrSetting
            params={{
              visible: this.state.okrSetting,
              ratingAuth: this.state.okrRatingAuth,
              circleAuth: this.state.okrCircleAuth,
              teamId: this.state.isMyPlan ? -1 : getTreeParam($store.getState().workokrTreeId).cmyId,
              onCancel: (data?: any) => {
                if (data == 1) {
                  this.getNowperiodList('edit')
                }
                this.setState({ okrSetting: false })
              },
              onSure: () => {
                this.setState({ okrSetting: false })
              },
            }}
          ></OkrSetting>
        )}
        {/* okr???????????? */}
        <DetailModal ref={ref => (this.detailModalRef = ref)} param={{}}></DetailModal>
      </planContext.Provider>
    )
  }
}

/**
 * ?????????????????? ??????
 */
const OkrOrgCom = ({
  allCompany,
  allCompanyIds,
  isHideStructure,
  orgShow,
  isMyPlan,
  myPlanChange,
  onLoadData,
  treeData,
  onSelect,
  onExpand,
  expandedKeys,
  selectedKeys,
  searchSelect,
  setPlanState,
}: any) => {
  const treeRef = useRef<any>({})
  const [orgConState, setOrgConState] = useState<any>({
    isHideStructure: isHideStructure || false,
  })

  /***
   * ????????????????????????
   */
  useEffect(() => {
    const param: any = {}
    if (isHideStructure !== undefined) {
      param.isHideStructure = isHideStructure
    }
    setOrgConState({ ...orgConState, ...param })
  }, [isHideStructure])

  return (
    <Spin spinning={false}>
      {orgConState.isHideStructure == 1 && (
        <div
          className="okrLeftSmall"
          onMouseOver={() => {
            // okrOrgHover({
            //   type: 1,
            //   targetNode: $('.okrContainer .okrLeftCon'),
            //   from: 'workplan_OKR',
            //   isHideStructure: orgConState.isHideStructure,
            // })
            treeRef.current && treeRef.current.setOrgState({ changeTree: true })
            // if ($('.OKRDetailResize .okrKanban .model_Hover').length > 0) {
            //   changeModelOver(false)
            // }
          }}
        >
          <div
            className="okrLeft_logo"
            id={`orgNarrowItem_-1`}
            key={-1}
            style={isMyPlan ? { border: '2px solid #4285f4' } : {}}
          >
            <Avatar
              src={$store.getState().nowAvatar}
              style={{
                backgroundColor: $store.getState().nowAvatar ? '#777777' : '#4285f4',
              }}
            >
              {$store.getState().nowUser.substr(-2, 2)}
            </Avatar>
            {isMyPlan ? <span className="active"></span> : ''}
          </div>
          {allCompany &&
            allCompany.map((item: any, index: number) => (
              <div
                className="okrLeft_logo"
                id={`orgNarrowItem_${item.id}`}
                key={index}
                style={
                  !isMyPlan && getTreeParam($store.getState().workokrTreeId).cmyId == item.id
                    ? { border: '2px solid #4285f4' }
                    : {}
                }
              >
                <Avatar src={item.logo || $tools.asAssetsPath('/images/common/company_default.png')}></Avatar>
                {!isMyPlan && getTreeParam($store.getState().workokrTreeId).cmyId == item.id && (
                  <span className="active"></span>
                )}
              </div>
            ))}
        </div>
      )}
      <CommonTree
        ref={treeRef}
        allCompany={allCompany}
        allCompanyIds={allCompanyIds}
        isHideStructure={orgConState.isHideStructure}
        orgShow={orgShow}
        isMyPlan={isMyPlan}
        myPlanChange={myPlanChange}
        onLoadData={onLoadData}
        treeData={treeData}
        onExpand={onExpand}
        onSelect={onSelect}
        expandedKeys={expandedKeys}
        selectedKeys={selectedKeys}
        searchSelect={searchSelect}
        setOrgConState={(param: any) => {
          setOrgConState({ ...orgConState, ...param })
        }}
        setPlanState={setPlanState}
      />
    </Spin>
  )
}

/**
 * ???????????????
 * @returns
 */
const CommonTree = forwardRef(
  (
    {
      allCompanyIds,
      allCompany,
      isHideStructure,
      orgShow,
      isMyPlan,
      myPlanChange,
      onLoadData,
      treeData,
      onSelect,
      onExpand,
      expandedKeys,
      selectedKeys,
      searchSelect,
      setOrgConState,
      setPlanState,
    }: any,
    ref
  ) => {
    const [orgState, setOrgState] = useState<any>({
      setSearchunfold: false,
      isHideStructure: isHideStructure || false,
      search: '',
      changeTree: false, //???????????????????????????
    })
    /**
     * ???????????????????????????*
     */
    useImperativeHandle(ref, () => ({
      /**
       * ??????state
       */
      setOrgState: (paramObj: any) => {
        setOrgState({ ...orgState, ...paramObj })
      },
    }))

    return (
      <aside
        className={`orgLeftCon okrLeftCon flex column ${orgShow ? 'showwidth' : 'hidewidth'} ${
          isHideStructure == 1 ? (orgState.changeTree ? 'addEditTree' : 'removeEditTree') : ''
        }`}
        onMouseLeave={(e: any) => {
          if (
            e.target.parentNode?.className?.includes('org_my') ||
            e.target.parentNode?.className?.includes('row_left')
          ) {
            return
          }
          // ??????set?????????????????????????????????
          // okrOrgHover({
          //   type: 0,
          //   targetNode: $('.okrContainer .okrLeftCon'),
          //   from: 'workplan_OKR',
          // })
          setOrgState({ ...orgState, changeTree: false })
        }}
      >
        <div className="search_navigation">
          {((isHideStructure && orgState.changeTree) || !isHideStructure) && (
            <SearchNavigation
              title="????????????"
              from="work-paln"
              pattern={isHideStructure}
              unfoldFn={(val: any) => {
                //????????????
                if (val == 'hide') {
                  // ??????state??????
                  setPlanState({ orgShow: false })
                }
              }}
              searchFn={(val: any) => {
                //????????????
                setOrgState({ ...orgState, setSearchunfold: val })
              }}
              concealOrganization={(val: any) => {
                //?????????????????????????????????
                //0?????????????????????????????? 1??????
                saveDateDisplay(val ? 1 : 0, 'org').then((_: any) => {
                  setOrgConState({ isHideStructure: val ? 1 : 0 })
                })
              }}
            />
          )}
        </div>
        {orgState.setSearchunfold && (
          <div className={`searchList_box`}>
            <div className="searchList_sn_title">
              <div
                onClick={() => {
                  setOrgState({
                    ...orgState,
                    setSearchunfold: false,
                    search: '',
                    defaultSearch: '',
                  })
                }}
              >
                <i>{'<'}</i>
                ????????????
              </div>
              <i
                className={`unfold ${isHideStructure == 1 ? 'hide' : ''}`}
                onClick={() => {
                  // ??????state??????
                  setPlanState({ orgShow: false })
                }}
              ></i>
            </div>
            <SearchInput
              setOrgState={(datas: any) => {
                setOrgState({ ...orgState, ...datas })
              }}
              nowSearch={orgState.search}
            />
            {/* ???????????? */}
            <div className={`orgSearchList ${orgState.search == '' ? 'forcedHide' : ''}`}>
              <OrgSearchList
                param={{ allCompanyIds, allCompany }}
                searchVal={orgState.search}
                searchunfold={orgState.setSearchunfold}
                searchSelect={searchSelect}
              />
            </div>
          </div>
        )}
        <div
          className={`org_my flex center-v ${isMyPlan ? 'on org_my_active' : ''}`}
          onClick={myPlanChange}
          style={{ paddingLeft: '10px' }}
        >
          <Avatar
            src={$store.getState().nowAvatar}
            size={24}
            style={{
              backgroundColor: $store.getState().nowAvatar ? '#777777' : '#4285f4',
            }}
          >
            {$store.getState().nowUser.substr(-2, 2)}
          </Avatar>
          <span style={{ marginLeft: '12px' }}>{$intl.get('myOKR')}</span>
        </div>
        <div className="orgBotScroll flex-1">
          <Tree
            loadData={onLoadData}
            treeData={treeData}
            onSelect={onSelect}
            onExpand={onExpand}
            expandedKeys={expandedKeys}
            blockNode={true}
            selectedKeys={selectedKeys}
            switcherIcon={<CaretDownOutlined />}
            className={`baseOrgTree switch_null fix_content gradient ${
              orgState.search != '' ? 'forcedHide' : ''
            }`}
          />
        </div>
      </aside>
    )
  }
)
/**
 * ?????????????????????
 */
export const SearchInput = ({ nowSearch, setOrgState }: { nowSearch: string; setOrgState: any }) => {
  const [searchState, setSearch] = useState({
    defaultSearch: '',
    search: '',
  })
  useEffect(() => {
    const param: any = {}
    if (nowSearch !== undefined) {
      param.search = nowSearch
    }
    setSearch({ ...searchState, ...param })
  }, [nowSearch])
  return (
    <Input
      allowClear
      autoFocus={true}
      placeholder="???????????????"
      value={searchState.search}
      className="org_menu_search baseInput radius16 border0 bg_gray"
      suffix={
        <span
          className="search-icon-boxs"
          onClick={() => {
            setOrgState({ search: searchState.search })
          }}
        >
          <em className="search-icon-t-btn"></em>
        </span>
      }
      onPressEnter={(e: any) => {
        setOrgState({ search: searchState.search })
      }}
      onChange={(e: any) => {
        // if (e.target.value == '') {
        //   setOrgState({ search: e.target.value })
        // }
        setSearch({ ...searchState, search: e.target.value })
      }}
    />
  )
}
/**
 * ????????????????????????
 */
export const okrOrgHover = ({ type, targetNode, isHideStructure }: any) => {
  // ??????
  if (type == 1 && isHideStructure) {
    targetNode.addClass('addEditTree').removeClass('removeEditTree')
  } else {
    targetNode.addClass('removeEditTree').removeClass('addEditTree')
    scrollToAnchor('orgNarrowItem_' + scrollToAnchorDomId)
  }
}

export default OkrListCard

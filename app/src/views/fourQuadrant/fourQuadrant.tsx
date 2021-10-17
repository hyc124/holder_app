import React, { useEffect, useState, useReducer, useLayoutEffect, useRef, useContext } from 'react'
import './fourQuadrant.less'
import './GetSingleData.less'
import { message, Spin } from 'antd'
import { removemindFns } from '../work-plan-mind/work-plan-mind'
import { removemindOkrFns } from '../okr-four/work-okr-mind/work-okr-mind'
import { ipcRenderer } from 'electron'
import { editTaskSaveApi } from '../task/taskDetail/getData'
import moment from 'moment'
import {
  getMainData,
  getCountTarget,
  getCommuterTime,
  getSubLateCount,
  saveSupports,
  periodGetList,
  selectDateDisplay,
} from './getfourData'
import {
  getMindId,
  btnseventPlanSaveApi,
  getMindMapEmpty,
  queryRating,
  statisticDistrApi,
} from '../work-plan-mind/getData'
import { getTreeParam } from '../../common/js/tree-com'
import OneQuadrant from './components/oneQuadrant'
import TwoQuadrant from './components/twoQuadrant'
import ThreeQuadrant from './components/threeQuadrant'
import FourStatus from './components/fourNextStatus'
import TaskMenu from './components/TaskMenu'
import OkrDeatilTaskMenu from './components/okrDeatilTaskMenu'
import ChooseMenu from './components/chooseMenu'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import { findEditMember, shareToUserSave } from '../workplan/WorkPlanOpt'
import Okrdetail from '../work-plan-mind/okrdetail'
import CreatTask from '../task/creatTask/creatTask'
import { SupportModal } from '../../components/supportOKR/supportModal'
import { DetailContext, taskDetailContext } from '../task/taskDetails/detailRight'
// import { queryOKRTaskByIdApi } from '../task/OKRDetails/okrDetailApi'
import { requestApi } from '../../common/js/ajax'
import DetailModal from '../task/taskDetails/detailModal'
import { refreshOkrKanban } from '../workdesk/okrKanban/okrKanban'
import { CreateTaskModal } from '../task/creatTask/createTaskModal'

export const fourQuqdrantContext = React.createContext({})
// O初始数据
export const TempOData = {
  mainId: '',
  pageSize: 10,
  pageId: '',
  createPlan: {
    type: 2,
    endTime: '',
    id: 0,
    name: '',
    startTime: '',
    typeId: '',
    process: 0,
    mainId: '',
    ascriptionId: -1,
    enterpriseId: 0,
    enterpriseName: '',
    day: 0,
    children: [],
    period: {},
  },
  scorRegular: 0,
  periodList: [],
  nowHository: 0,
  start: '',
  allLateNum: 0,
  end: '',
}
// 外部调用刷新单条数据
export let refreshFourQuadrantTask: any = null
let getTableList = {
  twoPartList: {
    dataList: [],
    distribute: 0,
    key: 'twoTab',
  },
  fourParBtn: [],
}
let getNowDataList: any = []
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    //@我的
    case '2':
      return { ...state, twoPartList: action.data }
    case '4':
      return { ...state, fourParBtn: action.data }
    default:
      return state
  }
}
let status = 0
// let twosetHasMore: any = null
const FourQuadrant = (props: any) => {
  const { refresh, sourceFrom } = props
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { isReFreshOrgLeft, leftOrgRef } = taskDetailObj
  const onesetHasMore = useRef<any>(null)
  const twosetHasMore = useRef<any>(null)
  const threesetHasMore = useRef<any>(null)
  const [loading, setLoading] = useState(false)
  const initrightMenuItemRow = {
    parentId: '',
    id: 0,
    typeId: 0,
    icon: '',
    type: 0,
    taskFlag: 0,
    taskStatus: 0,
    hasChild: 0,
    status: 0,
    day: 0,
    roleId: 0,
    liableUser: 0,
    liableUsername: '',
    liableUserProfile: '',
    ascriptionType: 0,
    nodeText: '',
    ascriptionId: 0,
  }
  const gteChooseMenuList = {
    classData: {
      display: 'none',
      pageX: 0,
      pageY: 0,
      row: {
        type: 0,
        typeId: 0,
        parentId: '',
        status: -1,
        liableUser: 0,
        liableUserProfile: '',
        ascriptionType: 0,
        ascriptionId: -1,
        nodeText: '',
        liableUsername: '',
        roleId: 0,
      },
    },
    moreMenu: [],
    taskinfo: {},
  }
  //打开右键按钮弹窗
  const [moreMenuList, setMenuList] = useState({
    rightMenuItem: {
      display: 'none',
      row: {
        taskName: initrightMenuItemRow,
      },
    },
    moreMenu: [],
    taskinfo: {},
  })
  //打开责任人弹窗
  const [chooseMenuList, setChooseMenuList] = useState(gteChooseMenuList)
  //打开选人弹窗
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //打开关联任务弹窗
  const [supportShow, setsupportShow] = useState<any>({
    visible: false,
    dataInfo: { id: 0, type: 2, typeId: '' },
    onSure: {},
  })
  //打开创建任务
  const [opencreattask, setOpencreattask] = useState({
    visible: false,
    orgInfo: {},
    type: 0,
    taskId: '',
    taskFlag: 0,
  })
  //打开okr创建任务
  const [okrdeModel, setokrdeModel] = useState({
    visible: false,
    dataInfo: {},
  })
  //时间设置，权限设置
  const [getStates, setGetData] = useState({
    nowWeekStart: '',
    nowWeekEnd: '',
    fourWeekStart: '',
    fourWeekEnd: '',
    id: '',
    typeId: '',
    status: props.status,
    dataList: [],
    personAuth: false,
    planStateArr: '',
    mainId: '',
  })
  //O的数据，必要数据
  const [initStates, setInitData] = useState(TempOData) //用来存储编辑后的数据

  // 详情弹框
  const detailModalRef = useRef<any>({})

  const { nowUserId, nowUser, nowAccount } = $store.getState()
  //设置数据集合使用useReducer
  const [state, dispatch] = useReducer(reducer, getTableList)
  const differentOkr = $store.getState().differentOkr
  let nowcmyId: any
  if (differentOkr == 1) {
    // console.log($store.getState().mindMapOkrData)
    nowcmyId = $store.getState().mindMapOkrData ? $store.getState().mindMapOkrData.teamId : props.teamId
  } else {
    nowcmyId = $store.getState().myPlanOrg.cmyId || $store.getState().mindMapData.teamId
    if (!$store.getState().planMainInfo.isMyPlan) {
      nowcmyId = getTreeParam($store.getState().workplanTreeId).cmyId
    }
  }
  // 选人插件参数
  const [selMemberOrg, setSelMemberOrg] = useState({
    teamId: 0,
    sourceType: 'shareToUser', //操作类型
    allowTeamId: [nowcmyId],
    selectList: [], //选人插件已选成员
    checkboxType: 'checkbox',
    permissionType: 3, //组织架构通讯录范围控制
    showPrefix: false, //不显示部门岗位前缀
    checkableType: [0],
    isDel: false, //不可删除成员
    onSure: {},
  })
  // 创建任务弹框组件
  const createTaskRef = useRef<any>({})
  // let isUnmounted = false
  useEffect(() => {
    refreshFourQuadrantTask = (value: number, data: any) => {
      refreshTask(value, data)
    }

    return () => {
      refreshFourQuadrantTask = null
      getTableList = {
        twoPartList: {
          dataList: [],
          distribute: 0,
          key: 'twoTab',
        },
        fourParBtn: [],
      }
      getNowDataList = []
      // isUnmounted = true
    }
  }, [])
  //处理传入数据
  useEffect(() => {
    // isUnmounted = false
    if (props && props.planStateArr != '' && !loading) {
      initClear()
      getStates.id = props.id
      getStates.typeId = props.typeId
      getStates.status = props.status
      getStates.planStateArr = props.planStateArr
      getNowDataList = []
      if (props.teamId) {
        nowcmyId = props.teamId
      }
      if (nowcmyId) {
        getCommuterTime(nowcmyId).then((resData: any) => {
          // if (!isUnmounted) {
          if (resData.amStart && resData.amStart.split(':')[0] < 10) {
            initStates.start = '0' + resData.amStart
          }
          initStates.end = resData.pmEnd
          requestApi({
            url: '/task/okr/period/findDefault',
            param: { ascriptionId: nowcmyId },
            json: false,
          }).then((res: any) => {
            // if (!isUnmounted) {
            getDifferntDate(
              props.id,
              props.typeId,
              res.success
                ? {
                    periodId: (res.data.data && res.data.data.first) || '',
                    periodText: (res.data.data && res.data.data.second) || '',
                  }
                : {}
            )
            // }
          })
          // }
        })
      }
    }
  }, [
    props.id,
    props.typeId,
    props.status,
    props.planStateArr,
    $store.getState().fromPlanTotype.createType,
    refresh,
  ])

  // 订阅刷新消息
  ipcRenderer.on('refresh_operated_report', (e: any, data: any) => {
    if (data.sourceType == 'fourReport') {
      getPlanList(getStates.id, getStates.typeId)
    }
  })
  //初始化弹窗关闭
  const initClear = () => {
    status = 0
    if (moreMenuList.rightMenuItem.display == 'block') {
      moreMenuList.rightMenuItem.display = 'none'
      setMenuList({ ...moreMenuList })
    } else if (chooseMenuList.classData.display == 'block') {
      setChooseMenuList(gteChooseMenuList)
    } else if (memberOrgShow) {
      setMemberOrgShow(false)
    } else if (supportShow.visible) {
      supportShow.visible = false
      setsupportShow({ ...supportShow })
    } else if (opencreattask.visible) {
      opencreattask.visible = false
      setOpencreattask({ ...opencreattask })
    }
    dispatch({ type: '2', data: getTableList.twoPartList })
    dispatch({ type: '4', data: getTableList.fourParBtn })
  }
  useLayoutEffect(() => {
    initEvent()
  }, [])
  const initEvent = () => {
    $('.fourQuadrant')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.part-okr-quadrant .edit_portrait,.fourQuadrant .portrait_fourQuar') // 设置目标区域
        if (
          !_con.is(e.target) &&
          _con.has(e.target).length === 0 &&
          chooseMenuList.classData.display == 'block'
        ) {
          chooseMenuList.classData.display = 'none'
          setChooseMenuList({ ...chooseMenuList })
        }
        const _con1 = jQuery('.okrOptBtnGroup .more_icon,.fourQuadrant .optBtnMoreList') // 设置目标区域
        if (
          !_con1.is(e.target) &&
          _con1.has(e.target).length === 0 &&
          moreMenuList.rightMenuItem.display == 'block'
        ) {
          jQuery('.optBtnMoreList').hide()
          moreMenuList.rightMenuItem.display = 'none'
          setMenuList({ ...moreMenuList })
        }
      })
  }
  //请求界面数据
  const changeData = (key: number, type: any, change: any) => {
    if (key == 114 && change == 'delete') {
      initStates.createPlan.children = type
      setInitData({ ...initStates })
      dispatch({
        type: '2',
        data: {
          dataList: type,
          distribute: 0,
        },
      })
      return
    }
    const startDate = ''
    const endDate = ''
    if (change == 'change') {
      initStates.pageId = ''
      getNowDataList = []
    } else {
      initStates.pageId = change
    }
    if (type == '2') {
      if (!(change == 'change')) {
        getNowDataList = state.twoPartList.dataList
      }
    }
    getMainData(
      initStates.mainId,
      getStates.id,
      getStates.typeId,
      jQuery('.part-now-status').hasClass('maxpage') && getStates.planStateArr.length != 3
        ? 20
        : initStates.pageSize,
      initStates.pageId,
      startDate,
      endDate,
      -1,
      getStates.planStateArr
    ).then((resData: any) => {
      setLoading(false)
      if (resData.returnCode == 30091 || resData.returnCode == -1) {
        if ($('.work_okr_mind_content').length > 0 || $('.okrQuadrantModal').length > 0) {
          removemindOkrFns('removemind', { id: getStates.id })
        } else {
          removemindFns('removemind', { id: getStates.id })
        }
        return false
      }
      if (resData.dataList.length == 0 && initStates.pageId) {
        return false
      }
      props.settitStatus(resData.data)
      props.settitStatus()
      changePartBtn(type, resData)
      if (type == '2' && change == 'change') {
        if (jQuery('.okrCountDistrib').length > 0) {
          jQuery('.okrCountDistrib').text('(0)')
        } else {
          jQuery('.countDistribute').text('(0)')
        }
        if (!getStates.status) {
          if (jQuery('.okrCountDistrib').length > 0) {
            jQuery('.okrCountDistrib').text(`(${resData.obj.distributeCount || 0})`)
          } else {
            jQuery('.countDistribute').text(`(${resData.obj.distributeCount || 0})`)
          }
        }
        if (resData.data) {
          resData.data.mainId = initStates.mainId
          initStates.createPlan = resData.data
          if (!initStates.createPlan.period) {
            initStates.createPlan.period = {}
          }
        }
        setInitData({ ...initStates })
      }
    })
  }
  //组装数据格式
  const changePartBtn = (code: string, data: any) => {
    if (code == '4') {
      dispatch({ type: code, data: data.dataList })
      return false
    }
    let newTableData: any = []
    newTableData = getNowDataList.concat(data.dataList)
    const conList = {
      dataList: newTableData,
      distribute: data.obj.distributeCount,
    }

    if (initStates.pageId) {
      if (data.dataList.length > 0) {
        dispatch({ type: code, data: conList })
      }
    } else {
      dispatch({ type: code, data: conList })
    }
  }

  /**
   * 跳转到okr详情
   */
  const toOkrDetail = (row: any) => {
    detailModalRef.current &&
      detailModalRef.current.setState({
        from: 'fourQuadrant', //来源
        id: row.typeId,
        taskData: { ...row },
        visible: true,
        callbackFn: (e: any) => {
          setTimeout(() => {
            if (row.type == 2 && e.optType == 'relKR') {
              if ($('.work_okr_mind_content').length > 0) {
                removemindOkrFns('removemind', { id: getStates.id })
              } else if ($('.okrQuadrantModal').length > 0) {
                // 刷新规划列表
                ipcRenderer.send('refresh_plan_list_main')
              } else {
                removemindFns('removemind', { id: getStates.id })
              }
            }
          }, 600)
        },
      })
  }

  //更改数据重新加载 1--界面数据增加更新

  const refreshTask = (value: number, data: any, numData?: string) => {
    if (value === 1) {
      getPlanList(getStates.id, getStates.typeId)
    } else if (value == 2) {
      setMenuList(data)
      jQuery('.optBtnMoreList').show()
      if (data.rightMenuItem.display == 'block') {
        chooseMenuList.classData.display = 'none'
        setChooseMenuList({ ...chooseMenuList })
      }
    } else if (value == 3) {
      //点击OKR行
      moreMenuList.rightMenuItem.row.taskName = data
      setMenuList({ ...moreMenuList })
      // 查询左侧okr列表中是否有当前点击项
      if (leftOrgRef && leftOrgRef.current) {
        leftOrgRef &&
          leftOrgRef.current &&
          leftOrgRef.current.clickTheTask({
            findId: data.typeId,
            noFindBack: () => {
              // 新版详情
              toOkrDetail(data)
            },
          })
      } else {
        // setokrdeModel({ ...okrdeModel, visible: true, dataInfo: data })
        // 新版详情
        toOkrDetail(data)
      }
    } else if (value == 4) {
      //更改责任人
      if (data.classData) {
        chooseMenuList.classData = data.classData
      }
      if (data.moreMenu) {
        chooseMenuList.moreMenu = data.moreMenu
      }
      setChooseMenuList({ ...chooseMenuList })
    } else if (value == 5) {
      const selectListCheck: any = []
      if (data.liableUser) {
        btnseventPlanSaveApi({ id: data.typeId }, '/task/getPersonByLiable').then((resData: any) => {
          const datas = resData.data
          if (datas.ascriptionId) {
            selectListCheck.push({
              cmyId: initStates.createPlan.enterpriseId,
              cmyName: initStates.createPlan.enterpriseName,
              ascriptionId: datas.ascriptionId,
              userId: datas.userId,
              userName: datas.username,
              curId: datas.ascriptionId,
              curName: datas.ascriptionName,
              curType: datas.ascriptionType,
              deptId: datas.deptId,
              deptName: datas.deptName,
              roleId: datas.roleId,
              roleName: datas.roleName,
              profile: data.liableUserProfile || '',
            })
          }
        })
      }
      chooseMenuList.classData.row = data
      setChooseMenuList({ ...chooseMenuList })
      setSelMemberOrg({
        ...selMemberOrg,
        selectList: selectListCheck,
        permissionType: 1, //任务管理权限
        sourceType: 'changeAffar',
        checkboxType: 'radio',
        allowTeamId: [initStates.createPlan.enterpriseId],
        teamId: initStates.createPlan.enterpriseId,
        checkableType: [0, 2, 3],
        isDel: false,
        onSure: selMemberSure,
      })
      setMemberOrgShow(true)
    } else if (value == 6) {
      // setOpencreattask({
      //   ...opencreattask,
      //   visible: true,
      //   type: 1,
      //   taskId: data.typeId,
      //   taskFlag: data.taskFlag,
      // })
      openCreateTask({
        type: 1,
        taskId: data.typeId,
        taskFlag: data.taskFlag,
      })
    } else if (value == 7) {
      //更改O后的头部状态值
      props.settitStatus(data)
    } else if (value == 8) {
      //打开关联任务弹窗
      supportShow.visible = true
      supportShow.dataInfo = data
      supportShow.onSure = (vaule: any) => {
        pushTaskContentFn(vaule)
      }
      setsupportShow({ ...supportShow })
    } else if (value == 9) {
      props.settitStatus(data, 'name')
    } else if (value == 10) {
      props.settitStatus()
    } else if (value == 16) {
      twosetHasMore.current.tableFresh(16, {
        nowData: data.nowData,
        moveData: data.moveData,
      })
    } else if (value == 26 || value == 27 || value == 28 || value == 29 || value == 30 || value == 31) {
      // 详情顶部 修改O名称
      if (value == 27 && data.from == 'detailHeader' && data.workPlanType == 2) {
        // console.log(TempOData)
        setInitData({
          ...TempOData,
          createPlan: {
            ...TempOData.createPlan,
            name: data.name,
          },
        })
        return
      }

      if (value == 27 && data.taskName.type != 3 && data.taskName.status != 1) {
        if (
          (data.taskName.day == 0 && data.taskName.taskStatus != 3) ||
          (data.taskName.day > 0 && data.taskName.taskStatus == 3)
        ) {
          data.taskName.taskStatus = data.taskName.day == 0 ? 3 : 1
          twosetHasMore.current.chnageLateNum()
        }
      }

      commEventCode(value, data, numData || '')
    }
  }
  //确认责任人选择
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    if (dataList.length == 0) {
      return
    }
    const selectedId = chooseMenuList.classData.row
    if (info.sourceType == 'shareToUser') {
      const sourceItem = $store.getState().planModalObj.sourceItem || {}
      const typeIds: any = []
      dataList.map((item: any) => {
        typeIds.push(item.curId)
      })
      shareToUserSave({
        id: sourceItem.id, //节点id
        type: 1, //类型：0个人 1项目组
        typeIds: typeIds, //类型id
        name: sourceItem.name,
        mainId: initStates.mainId,
        typeId: sourceItem.typeId,
      }).then(() => {
        // refreshLeftTree({ taskId: chooseMenuList.classData.row.typeId })
        // 刷新左侧任务链
        isReFreshOrgLeft && isReFreshOrgLeft(4, chooseMenuList.classData.row)
      })
    } else {
      const existData = {
        profile: dataList[0].profile || '',
        username: dataList[0].curType == 0 ? dataList[0].curName : dataList[0].userName,
        nodeText: dataList[0].curType == 0 ? dataList[0].roleName : dataList[0].curName,
        ascriptionType: info.sourceType == 'changeAffar' ? dataList[0].curType : selectedId.ascriptionType,
      }
      //派发走任务变更归属(调用任务变更属性接口) -----------------
      if ((selectedId.status == 4 || selectedId.status == 3) && selectedId.type != 2 && selectedId.type != 3) {
        //更改责任人
        const dataParam: any = {
          liable: {},
          attach: {
            star: '',
            type: existData.ascriptionType, //0 个人  2企业  3部门
            typeId: info.sourceType == 'changeAffar' ? dataList[0].curId : selectedId.ascriptionId,
          },
          id: selectedId.typeId,
          operateUser: nowUserId,
          operateUserName: nowUser,
          onlyUser: info.sourceType == 'changeUser' ? 1 : 0,
        }
        if (dataList[0].curType == 0) {
          dataParam.liable = {
            deptId: dataList[0].deptId,
            deptName: dataList[0].deptId,
            roleId: dataList[0].parentId,
            roleName: dataList[0].parentName,
            userId: dataList[0].userId || dataList[0].curId,
            username: dataList[0].curName,
          }
        }
        editTaskSaveData(dataParam, '/task/modify/id', existData).then(() => {
          // refreshLeftTree({ taskId: chooseMenuList.classData.row.typeId })
          // 刷新左侧任务链
          isReFreshOrgLeft && isReFreshOrgLeft(4, chooseMenuList.classData.row)
        }) // 更改任务归属(需判断走审批状态)
      } else {
        //未派发
        const dataParam = {
          id: selectedId.typeId, //任务id
          ascriptionId: dataList[0].curId, //归属Id
          ascriptionType: dataList[0].curType, //归属类型0个人2企业 3部门
          deptId: dataList[0].deptId, //部门Id
          roleId: dataList[0].parentId, //岗位Id
          userId: dataList[0].userId || dataList[0].curId, //用户Id
          account: dataList[0].account, //帐号
          onlyUser: info.sourceType == 'changeUser' ? 1 : 0,
          operateUser: nowUserId,
          operateUserName: nowUser,
        }
        //未派发走任务变更归属(调用工作规划变更归属接口) -----------------
        editTaskSaveData(dataParam, '/task/transFer/workPlanTransferTask', existData).then(() => {
          // refreshLeftTree({ taskId: chooseMenuList.classData.row.typeId })
          // 刷新左侧任务链
          isReFreshOrgLeft && isReFreshOrgLeft(4, chooseMenuList.classData.row)
        })
      }
    }
  }
  //更改责任人
  const editTaskSaveData = (dataParam: any, url: string, existData: any) => {
    return editTaskSaveApi(dataParam, url).then((resData: any) => {
      if (resData.returnCode == 0) {
        if (
          dataParam.onlyUser == 0 ||
          (dataParam.onlyUser == 1 && (existData.ascriptionType == 0 || existData.ascriptionType == -1))
        ) {
          if (
            chooseMenuList.classData.row.type != 2 &&
            chooseMenuList.classData.row.type != 3 &&
            (!chooseMenuList.classData.row.nodeText || chooseMenuList.classData.row.nodeText == '')
          ) {
            let getNumData: any = ''
            if (jQuery('.okrCountDistrib').length > 0) {
              getNumData = jQuery('.okrCountDistrib').text()
              jQuery('.okrCountDistrib').text(`(${Number(getNumData.replace(/[(|)]/g, '')) + 1})`)
            } else {
              getNumData = jQuery('.countDistribute').text()
              jQuery('.countDistribute').text(`(${Number(getNumData.replace(/[(|)]/g, '')) + 1})`)
            }
          }
          chooseMenuList.classData.row.ascriptionType = dataParam.ascriptionType
          chooseMenuList.classData.row.nodeText = existData.nodeText
          chooseMenuList.classData.row.ascriptionId = dataParam.ascriptionId
        }

        if (dataParam.onlyUser == 1 || (dataParam.onlyUser == 0 && existData.ascriptionType == 0)) {
          chooseMenuList.classData.row.roleId = dataParam.roleId
          chooseMenuList.classData.row.liableUser = dataParam.userId
          chooseMenuList.classData.row.liableUsername = existData.username
          chooseMenuList.classData.row.liableUserProfile = existData.profile
        }
        commEventCode(29, { taskName: chooseMenuList.classData.row }, '')
        if (chooseMenuList.classData.row.type == 2) {
          if (jQuery('.okrQuadrantModal .fourQuadrant').length > 0) {
            ipcRenderer.send('solve_okrList_detail', chooseMenuList.classData.row)
          }
          refreshTask(7, chooseMenuList.classData.row)
          twosetHasMore.current.tableFresh(29, { taskName: chooseMenuList.classData.row })
        }
        // 如果是任务
        if (chooseMenuList.classData.row.type == 1) {
          refreshTask(4, { taskName: chooseMenuList.classData.row })
        }
        // 刷新左侧任务链
        isReFreshOrgLeft && isReFreshOrgLeft(4, chooseMenuList.classData.row)
        message.success($intl.get('updateSuc'))
      } else {
        message.error(resData.returnMessage)
      }
    })
  }
  //右键按钮 1--启动/取消启动 10--冻结、解冻  100--编辑  112---添加图标 110---共享到人 103--标记为协同 104--取消标记为协同  5---指派
  //114--删除单项 115--删除整链 24-名称 与右键按钮数字对应  105--派发单项  106---派发整链   107---撤回单条  108--撤回全链   9---归档
  const OpenMode = (value: string, data: any, taskIds?: any[]) => {
    const nowTableData = moreMenuList.rightMenuItem.row.taskName
    setMenuList({
      rightMenuItem: {
        display: 'none',
        row: {
          taskName: initrightMenuItemRow,
        },
      },
      moreMenu: [],
      taskinfo: {},
    })
    // 开启、一键完成、取消完成
    if (value == '1') {
      isReFreshOrgLeft && isReFreshOrgLeft(Number(value), typeof data == 'object' ? data : { btnStatus: data })
      return
    }
    if (
      value == '114' ||
      (value == '10' && data == 1) ||
      (value == '1' && data == 2) ||
      value == '9' ||
      value == '105' ||
      value == '106' ||
      value == '107' ||
      value == '108' ||
      (value == '103' && data.roleName)
    ) {
      if (value == '105' || value == '106' || value == '107' || value == '108') {
        let getNumData: any = ''

        if (value == '105' || value == '106') {
          if (jQuery('.okrCountDistrib').length > 0) {
            if (value == '105') {
              getNumData = jQuery('.okrCountDistrib').text()
              jQuery('.okrCountDistrib').text(`(${Number(getNumData.replace(/[(|)]/g, '')) - 1})`)
            } else {
              // O详情模式下 撤回整链，更新可派发统计
              updateStatisticDistrNum({
                calssName: '.okrCountDistrib',
                mainId: Number(initStates.createPlan.mainId),
                id: initStates.createPlan.id,
              })
            }
          } else {
            getNumData = jQuery('.countDistribute').text()
            jQuery('.countDistribute').text(`(${Number(getNumData.replace(/[(|)]/g, '')) - 1})`)
          }
        }
        if (value == '107') {
          if (jQuery('.okrCountDistrib').length > 0) {
            getNumData = jQuery('.okrCountDistrib').text()
            jQuery('.okrCountDistrib').text(`(${Number(getNumData.replace(/[(|)]/g, '')) + 1})`)
          } else {
            getNumData = jQuery('.countDistribute').text()
            jQuery('.countDistribute').text(`(${Number(getNumData.replace(/[(|)]/g, '')) + 1})`)
          }
        }
        if (value == '108') {
          // O详情模式下 撤回整链，更新可派发统计
          if (jQuery('.okrCountDistrib').length > 0) {
            updateStatisticDistrNum({
              calssName: '.okrCountDistrib',
              mainId: Number(initStates.createPlan.mainId),
              id: initStates.createPlan.id,
            })
          }
        }
        // 派发/撤回派发 刷新左侧任务链
        isReFreshOrgLeft && isReFreshOrgLeft(Number(value), nowTableData)
      }
      props.settitStatus()
    }
    if (value == '110') {
      setMemberOrgShow(true)
      setSelMemberOrg({
        ...selMemberOrg,
        checkableType: [0],
        allowTeamId: [initStates.createPlan.enterpriseId],
        selectList: [],
        teamId: initStates.createPlan.enterpriseId,
        isDel: true,
        onSure: selMemberSure,
      })
    } else if (value == '100') {
      if (nowTableData.type == 2 || nowTableData.type == 3) {
        const url = '/task/work/plan/queryTree'
        const param = {
          mainId: initStates.mainId, //根节点id
          id: nowTableData.id,
          typeId: nowTableData.typeId,
          operateUser: $store.getState().nowUserId,
          level: '', //1查询当前层及以下所有任务
          hasOther: '1', //是否查询其他 0否 1是
          hasSelf: 1, //是否查询当前任务信息，0否 1是
        }
        getMindMapEmpty(param, url).then((resData: any) => {
          if (resData.data.type != 2) {
            commEventCode(value, solveTableData(resData.data, nowTableData.parentId), '')
          } else {
            if (jQuery('.okrQuadrantModal  .fourQuadrant').length > 0) {
              ipcRenderer.send('solve_okrList_detail', resData.data)
            }
            refreshTask(7, resData.data)
            twosetHasMore.current.tableFresh(value, resData.data)
          }
        })
      } else {
        refreshTask(1, moreMenuList.rightMenuItem.row)
      }
    } else if (value == '115' || value == '106' || value == '108') {
      if (value == '106') {
        nowTableData.status = 4
        nowTableData.taskFlag = 0
        if (nowTableData.day == 0 && nowTableData.taskStatus != 3) {
          nowTableData.taskStatus = 3
          twosetHasMore.current.chnageLateNum()
        }
      } else if (value == '108') {
        nowTableData.status = 1
        nowTableData.taskFlag = 2
        if (nowTableData.day == 0 && nowTableData.taskStatus != 1) {
          nowTableData.taskStatus = 1
          twosetHasMore.current.chnageLateNum()
        }
      }
      if (
        (nowTableData.type == 3 && nowTableData.hasChild && value == '115') ||
        (sourceFrom?.includes('OKR') && value == '115')
      ) {
        refreshTask(1, { ...moreMenuList.rightMenuItem.row, data })
      } else if (nowTableData.type == 2 && value == '115') {
        if ($('.work_okr_mind_content').length > 0) {
          removemindOkrFns('removemind', { id: getStates.id })
        } else if ($('.okrQuadrantModal').length > 0) {
          // 刷新规划列表
          ipcRenderer.send('refresh_plan_list_main')
        } else {
          removemindFns('removemind', { id: getStates.id })
        }
      } else {
        commEventCode(value, nowTableData, '')
      }
      if (value == '115') {
        // 删除整链
        console.log('删除整链---------------------------')
        isReFreshOrgLeft && isReFreshOrgLeft(Number(value), nowTableData)
      }
    } else if (
      value == '112' ||
      value == '114' ||
      value == '10' ||
      value == '9' ||
      value == '1' ||
      value == '105' ||
      value == '107' ||
      value == '103' ||
      value == '104' ||
      value == '5'
    ) {
      if (value == '112') {
        nowTableData.icon = data
        // 添加图标 刷新左侧任务链
        isReFreshOrgLeft && isReFreshOrgLeft(Number(value), nowTableData)
      } else if (value == '9') {
        //归档 刷新左侧任务链
        isReFreshOrgLeft && isReFreshOrgLeft(Number(value), nowTableData)
      } else if (value == '10') {
        nowTableData.taskFlag = data
        //冻结、解冻任务 刷新左侧任务链
        isReFreshOrgLeft && isReFreshOrgLeft(302, nowTableData)
      } else if (value == '1') {
        nowTableData.taskStatus = data
        if (data == 3 && nowTableData.day > 0) {
          nowTableData.taskStatus = 1
          twosetHasMore.current.chnageLateNum()
        }
      } else if (value == '105') {
        nowTableData.status = 4
        nowTableData.taskFlag = 0
        if (nowTableData.day == 0 && nowTableData.taskStatus != 3) {
          nowTableData.taskStatus = 3
          twosetHasMore.current.chnageLateNum()
        }
      } else if (value == '107') {
        nowTableData.status = 1
        nowTableData.taskFlag = 2
        if (nowTableData.day == 0 && nowTableData.taskStatus != 1) {
          nowTableData.taskStatus = 1
          twosetHasMore.current.chnageLateNum()
        }
      } else if (value == '103' && data.roleName) {
        nowTableData.ascriptionType = data.ascriptionType
        nowTableData.nodeText = data.roleName
        nowTableData.ascriptionId = data.ascriptionId
        if (data.ascriptionType == 0) {
          nowTableData.roleId = data.roleId
          nowTableData.liableUser = data.userId
          nowTableData.liableUsername = data.liableUserName
          nowTableData.liableUserProfile = data.profile
        }
        nowTableData.type = 4
      } else if (value == '5') {
        //指派任务 刷新左侧任务链
        isReFreshOrgLeft &&
          isReFreshOrgLeft(Number(value), { typeIds: taskIds, ParentTypeId: nowTableData.typeId })
      }
      commEventCode(value, nowTableData, '')
      if (value == '114') {
        // 删除单项
        console.log('删除单项---------------------------')
        isReFreshOrgLeft && isReFreshOrgLeft(Number(value), nowTableData)
      }
    } else if (value == '6') {
      //任务移交 刷新左侧任务链
      isReFreshOrgLeft(Number(value), nowTableData)
      nowTableData.roleId = data.roleId
      nowTableData.liableUser = data.userId
      nowTableData.liableUsername = data.liableUserName
      nowTableData.liableUserProfile = data.profile
      if (nowTableData.ascriptionType == 0 || nowTableData.ascriptionType == -1) {
        nowTableData.ascriptionType = 0
        nowTableData.nodeText = data.roleName
        nowTableData.ascriptionId = data.userId
      }
      commEventCode(29, { taskName: nowTableData }, '')
    } else {
      refreshTask(1, moreMenuList.rightMenuItem.row)
    }
    // 刷新详情和左侧列表
    // refreshFn && refreshFn({ from: 'fourQuadrant' })
    // isReFreshOrgLeft(Number(value), nowTableData)
  }

  const solveTableData = (item: any, parentId: any) => {
    const newTableData: any = {
      key: item.id,
      taskName: { ...item },
      liableUser: { name: item.liableUsername, profile: item.liableUserProfile, type: item.type },
      progress: {
        percent: item.process,
        type: item.type,
        taskStatus: item.taskStatus,
        status: item.status,
        editProcess: false,
      },
      subTaskCount: item.children ? item.children.length : 0,
      typeId: item.typeId,
      tagTask: item.type != 3,
      children: [],
      showInput: item.id ? false : true,
      weight: false, //权重
      score: false, //打分
    }
    return newTableData
  }
  const commEventCode = (value: any, nowTableData: any, numData: string) => {
    let nowquadrant = jQuery(
      `.fourQuadrant .quadrantBordData tr[data-row-key='${
        nowTableData.taskName ? nowTableData.taskName.id : nowTableData.id
      }']`
    )
    if (value == 114 || value == 115) {
      if (nowTableData.parentId && nowTableData.parentId != getStates.id) {
        const nowQuarData = jQuery(
          `.fourQuadrant .quadrantBordData tr[data-row-key='${nowTableData.parentId}']`
        )
        if (nowQuarData.length > 1) {
          nowquadrant = nowQuarData
        }
      }
    }
    if (nowquadrant.length > 0) {
      nowquadrant.each((noeNode: any, item: any) => {
        if (
          jQuery(nowquadrant[noeNode])
            .parents('.quadrantBordData')
            .attr('data-type') == '1'
        ) {
          onesetHasMore.current.tableFresh(value, nowTableData)
        } else if (
          jQuery(nowquadrant[noeNode])
            .parents('.quadrantBordData')
            .attr('data-type') == '2'
        ) {
          twosetHasMore.current.tableFresh(value, nowTableData)
        } else if (
          jQuery(nowquadrant[noeNode])
            .parents('.quadrantBordData')
            .attr('data-type') == '3'
        ) {
          threesetHasMore.current.tableFresh(value, nowTableData)
        }
      })
    }
    if ((value == 30 && nowquadrant.length == 1) || value == 31) {
      if (numData == '1') {
        onesetHasMore.current.tableFresh(value, nowTableData)
      } else if (numData == '3') {
        threesetHasMore.current.tableFresh(value, nowTableData)
      } else {
        twosetHasMore.current.tableFresh(value, nowTableData)
      }
    }
    // 工作台看板刷新
    if (
      value == 27 &&
      (sourceFrom?.indexOf('workbench_OKR') > -1 || sourceFrom?.indexOf('okrKanban_OKR') > -1)
    ) {
      // refreshOkrKanban && refreshOkrKanban({ optType: 'editName', taskIds: [nowTableData.typeId] })

      // 刷新左侧任务链
      isReFreshOrgLeft && isReFreshOrgLeft(-1, { typeId: nowTableData?.typeId, optType: 'editName' })
    }
  }
  /** */
  const btnMenuClick = (value: number, data: any) => {
    if (value == 1) {
      //更改责任人
      const param = {
        id: data.id, //任务id
        ascriptionId: data.liable.userId || data.liable.curId, //归属Id
        ascriptionType: 0, //归属类型0个人2企业 3部门
        deptId: data.liable.deptId, //部门Id
        roleId: data.liable.roleId, //岗位Id
        userId: data.liable.userId || data.liable.curId, //用户Id
        account: nowAccount, //帐号
        onlyUser: 1,
        operateUser: nowUserId,
        operateUserName: nowUser,
      }
      editTaskSaveData(param, '/task/transFer/workPlanTransferTask', {
        profile: data.liable.profile || '',
        username: data.liable.username,
        nodeText: data.liable.roleName,
        ascriptionType: chooseMenuList.classData.row.ascriptionType,
      }).then(() => {
        // refreshLeftTree({ taskId: chooseMenuList.classData.row.typeId })
        // 刷新详情和左侧列表
        isReFreshOrgLeft && isReFreshOrgLeft(4, chooseMenuList.classData.row)
      })
    } else if (value == 2) {
      const dataList = chooseMenuList.classData.row
      const selectListCheck: any = []
      if (dataList.liableUser) {
        btnseventPlanSaveApi({ id: dataList.typeId }, '/task/getPersonByLiable').then((resData: any) => {
          const datas = resData.data
          if (datas.ascriptionId) {
            selectListCheck.push({
              cmyId: initStates.createPlan.enterpriseId,
              cmyName: initStates.createPlan.enterpriseName,
              ascriptionId: datas.ascriptionId,
              userId: datas.userId,
              userName: datas.username,
              curId: datas.ascriptionId,
              curName: datas.ascriptionName,
              curType: datas.ascriptionType,
              deptId: datas.deptId,
              deptName: datas.deptName,
              roleId: datas.roleId,
              roleName: datas.roleName,
              profile: dataList.liableUserProfile || '',
            })
          }
        })
      }
      setSelMemberOrg({
        ...selMemberOrg,
        selectList: selectListCheck,
        checkboxType: 'radio',
        sourceType: 'changeUser',
        allowTeamId: [initStates.createPlan.enterpriseId],
        teamId: initStates.createPlan.enterpriseId,
        checkableType: [0],
        isDel: false,
        onSure: selMemberSure,
      })
      setMemberOrgShow(true)
    }
    chooseMenuList.moreMenu = []
    chooseMenuList.classData.pageX = 0
    chooseMenuList.classData.pageY = 0
    chooseMenuList.classData.display = 'none'
    setChooseMenuList({ ...chooseMenuList })
  }

  const getPlanList = (id: string, typeId: string) => {
    getNowDataList = []
    let conAuth = false
    initStates.createPlan.id = Number(id)
    setLoading(true)
    queryRating(nowcmyId).then((res: any) => {
      initStates.scorRegular = res //0；1-1分制 1:100-百分制
    })
    getMindId(Number(id)).then((resData: any) => {
      initStates.mainId = resData + ''
      getSubLateCount(Number(id)).then((res: any) => {
        initStates.allLateNum = res.data
      })
      findEditMember({
        id: id,
        mainId: initStates.mainId,
      }).then((res: any) => {
        getStates.dataList = res
        getStates.mainId = resData + ''
        if (res && res.length > 0) {
          if (res.filter((element: any) => element.id == $store.getState().nowUserId).length == 0) {
            conAuth = true
          }
        }
        getStates.personAuth = conAuth
        setGetData({ ...getStates })
        setInitData({ ...initStates })
        changeData(-4, '2', 'change')
      })
    })
    //获取状态指标
    getCountTarget(typeId).then((resData: any) => {
      changePartBtn('4', resData)
    })
  }
  //创建KR
  const createKRhtml = (type: string, num?: number) => {
    const newData = {
      isOther: 0,
      id: 0,
      status: 1,
      name: '',
      ascriptionType: -1,
      ascriptionId: 0,
      type: 1,
      typeId: getStates.typeId,
      cci: 5,
      endTime: initStates.createPlan.endTime,
      day: initStates.createPlan.day,
      process: 0,
      cycleNum: -1,
      taskFlag: 2,
      taskStatus: 0,
      taskType: 0,
      approvalStatus: 0,
      property: 0,
      files: 0,
      meetings: 0,
      hasChild: 0,
      children: [],
      enterpriseId: initStates.createPlan.enterpriseId,
      enterpriseName: initStates.createPlan.enterpriseName,
      hasForce: 0,
      update: true,
      mainId: initStates.mainId,
      parentId: getStates.id || initStates.createPlan.id,
      parentTypeId: getStates.typeId || initStates.createPlan.typeId,
      processStatus: 0,
    }
    if (type == '1') {
      newData.endTime = getStates.nowWeekEnd + ' ' + initStates.end
      const nowDate = moment(new Date()).format('YYYY/MM/DD') + ' 00:00'
      const runTime = Date.parse(newData.endTime) - Date.parse(nowDate)
      newData.day = Math.floor(runTime / 1000 / 60 / 60 / 24) + 1
      onesetHasMore.current.tableFresh(25, solveTableData(newData, getStates.id))
    } else if (type == '2') {
      newData.endTime = initStates.createPlan.endTime
      newData.type = num || 3
      if (state.twoPartList.dataList.length == 0) {
        state.twoPartList.dataList = [newData]
        dispatch({ type: '2', data: state.twoPartList })
      } else {
        twosetHasMore.current.tableFresh(25, solveTableData(newData, getStates.id))
      }
    } else if (type == '3') {
      newData.endTime = getStates.fourWeekEnd + ' ' + initStates.end
      const nowDate = moment(new Date()).format('YYYY/MM/DD') + ' 00:00'
      const runTime = Date.parse(newData.endTime) - Date.parse(nowDate)
      newData.day = Math.floor(runTime / 1000 / 60 / 60 / 24) + 1
      threesetHasMore.current.tableFresh(25, solveTableData(newData, getStates.id))
    }
  }
  //添加新指标更新
  const getChildrenMsg = (msg: any) => {
    const arrData: Array<any> = []
    if (msg && msg.length > 0) {
      msg.forEach((element: any) => {
        arrData.push({
          content: element.content,
          id: element.id,
          rgb: element.rgb,
        })
      })
    }
    dispatch({ type: '4', data: arrData })
    // 刷新左侧任务链
    // isReFreshOrgLeft(301, { typeId: getStates.typeId })
  }
  //获取不同时间展示
  const getDifferntDate = (id: string, typeId: string, createPeriod?: any) => {
    const startDate = new Date()
    const nowWeek = getWeeks(startDate) //获取当前周开始和结束时间
    const lastDay = new Date()
    lastDay.setDate(startDate.getDate() + 7)
    const lastWeek = getWeeks(lastDay) //获取下周开始和结束时间
    const lastDay1 = new Date()
    lastDay1.setDate(startDate.getDate() + 28)
    const lastWeek1 = getWeeks(lastDay1) //获取未来四周开始和结束时间
    const createTime = new Date() //获取O的初始创建时间
    createTime.setDate(startDate.getDate() + 89)
    const dataList = {
      type: 2,
      endTime: moment(createTime).format('YYYY/MM/DD') + ' ' + initStates.start,
      id: 0,
      name: '',
      startTime: '',
      typeId: '',
      process: 0,
      mainId: initStates.mainId,
      ascriptionId: -1,
      enterpriseId: 0,
      enterpriseName: '',
      day: 0,
      children: [],
      period: {},
    }
    getStates.fourWeekStart = lastWeek[0]
    getStates.fourWeekEnd = lastWeek1[0]
    getStates.nowWeekStart = nowWeek[0]
    getStates.nowWeekEnd = nowWeek[1]
    initStates.createPlan = dataList
    getStates.dataList = []
    selectDateDisplay().then((res: any) => {
      initStates.nowHository = res.data.isClosed
      periodGetList({
        numDisplay: res.data.isClosed,
        id: nowcmyId,
      }).then((res: any) => {
        initStates.periodList = res.dataList
        initStates.createPlan.period = createPeriod
        if (Object.keys(initStates.createPlan.period).length == 0) {
          initStates.createPlan.period = res.dataList ? res.dataList[0] : {}
        }
        if ($store.getState().fromPlanTotype.createType === 1 && id) {
          getPlanList(id, typeId)
        } else if ($store.getState().fromPlanTotype.createType === 0 && !id && !props.status) {
          setInitData({ ...initStates })
          setGetData({ ...getStates })
          props.changeStatus(true)
        }
      })
    })
  }
  const getWeeks = (currentTime: any) => {
    const currentDate = new Date(currentTime) //JS获取当前周第一天
    const timesStamp = currentDate.getTime()
    const currenDay = currentDate.getDay()
    const dates = []
    for (let i = 0; i < 8; i++) {
      if (i == 1 || i == 7) {
        dates.push(
          moment(new Date(timesStamp + 24 * 60 * 60 * 1000 * (i - ((currenDay + 7) % 7)))).format('YYYY/MM/DD')
        )
      }
    }
    return dates
  }
  const pushTaskContentFn = (value: any) => {
    saveSupports(value[0].id, [
      {
        mainId: initStates.mainId,
        mainParentId: supportShow.dataInfo.id,
        isExtends: false,
      },
    ]).then((_: any) => {
      refreshTask(1, '')
      // 刷新详情和左侧列表
      // refreshFn && refreshFn({ from: 'fourQuadrant' })
      isReFreshOrgLeft &&
        isReFreshOrgLeft(8, {
          typeId: value[0].typeId || value[0].id,
          ParentTypeId: supportShow.dataInfo.typeId,
        })
      // 创建成功后同步刷新工作台或其他外部列表
      // refreshData({
      //   optType: 'relateTask',
      //   typeId: value[0].typeId || value[0].id,
      //   newChildId: value[0].typeId || value[0].id,
      //   parentTypeId: supportShow.dataInfo.typeId,
      // })
    })
  }

  /**
   * 操作后刷新
   */
  const refreshData = ({ optType, typeId, parentTypeId, newChildId }: any) => {
    // 刷新工作台
    if (
      sourceFrom &&
      (sourceFrom?.indexOf('workbench_OKR') > -1 || sourceFrom?.indexOf('okrKanban_OKR') > -1)
    ) {
      refreshOkrKanban && refreshOkrKanban({ optType, taskIds: [typeId], parentId: parentTypeId, newChildId })
    }
  }

  /**
   * 打开创建任务
   */
  const openCreateTask = (infoObj: any) => {
    const createType = infoObj.type == 1 ? 'edit' : infoObj.type == 2 ? 'addChild' : 'add'
    const param: any = {
      visible: true,
      from: 'work-plan', //来源
      createType,
      endTime: status == 3 ? getStates.fourWeekEnd + ' ' + initStates.end : '',
      addHandly: initStates.createPlan,
      taskFlag: infoObj.taskFlag, //2草稿任务
      taskmanageData: {
        orgInfo: opencreattask.orgInfo,
      },
      id: infoObj.type == 1 ? infoObj.taskId : getStates.id, //任务id
      nowType: 0, //0个人任务 2企业任务 3部门任务
      taskType: infoObj.type || 0,
      callbacks: (paramObj: any) => {
        getPlanList(getStates.id, getStates.typeId)
        // 刷新左侧OKR列表
        isReFreshOrgLeft && isReFreshOrgLeft(304, { typeId: paramObj.data.id })
      },
    }
    if (createType == 'addChild') {
      param.parentId = initStates.createPlan.typeId
      param.parentId = { parentId: initStates.createPlan.typeId, parentTaskName: initStates.createPlan.name }
      param.mainId = initStates.mainId
    }
    createTaskRef.current && createTaskRef.current.setState(param)
  }

  const createType = $store.getState().fromPlanTotype.createType

  // ===========================上下文数据===================================//
  const contextObj = {
    setsupportShow,
  }
  return (
    <fourQuqdrantContext.Provider value={contextObj}>
      <Spin spinning={loading} tip={$intl.get('loadingWait')}>
        <div
          className="fourQuadrant"
          ref={() => {
            initEvent()
          }}
        >
          {/* createType == 0：创建目标时，只显示okr当前状态 */}
          {createType == 0 ? (
            ''
          ) : (
            <OneQuadrant
              initStates={initStates}
              getState={getStates}
              ref={onesetHasMore}
              action={{
                refreshTask: refreshTask,
                changeData: changeData,
                createKRhtml: createKRhtml,
              }}
            />
          )}
          {/* createType == 0：创建目标时，只显示okr当前状态 */}
          <TwoQuadrant
            sourceFrom={sourceFrom}
            useModule="twoQuarant"
            initState={initStates}
            getState={{
              status: getStates.status,
              id: getStates.id,
              typeId: getStates.typeId,
              dataList: getStates.dataList,
              personAuth: getStates.personAuth,
              nowWeekEnd: getStates.nowWeekEnd,
              fourWeekEnd: getStates.fourWeekEnd,
              planStateArr: getStates.planStateArr,
            }}
            ref={twosetHasMore}
            tableDataList={state.twoPartList}
            action={{
              refreshTask: refreshTask,
              changeData: changeData,
              createKRhtml: createKRhtml,
              setChooseData: props.setChooseData,
            }}
          />
          {/* createType == 0：创建目标时，只显示okr当前状态 */}
          {createType == 0 ? (
            ''
          ) : (
            <>
              <ThreeQuadrant
                initStates={initStates}
                getState={getStates}
                ref={threesetHasMore}
                action={{
                  refreshTask: refreshTask,
                  changeData: changeData,
                  createKRhtml: createKRhtml,
                }}
              />
              <FourStatus
                data={{
                  status: getStates.status || getStates.personAuth,
                  dataList: getStates.dataList,
                  id: getStates.id,
                  typeId: getStates.typeId,
                }}
                tableDataList={state.fourParBtn}
                action={{
                  getChildrenMsg: getChildrenMsg,
                }}
              />
            </>
          )}

          {/* 列表右键菜单 */}
          {moreMenuList.rightMenuItem.display === 'block' && (
            <>
              {$('.OKRDetailContent').length > 0 ? (
                <OkrDeatilTaskMenu
                  btnList={moreMenuList.moreMenu}
                  classData={moreMenuList.rightMenuItem}
                  openMode={OpenMode}
                  okrAuth={!getStates.personAuth}
                  taskinfo={moreMenuList.taskinfo}
                  mindId={initStates.mainId}
                  parentId={
                    moreMenuList.rightMenuItem.row.taskName.parentId
                      ? moreMenuList.rightMenuItem.row.taskName.parentId
                      : getStates.id
                  }
                />
              ) : (
                <TaskMenu
                  btnList={moreMenuList.moreMenu}
                  classData={moreMenuList.rightMenuItem}
                  openMode={OpenMode}
                  okrAuth={!getStates.personAuth}
                  taskinfo={moreMenuList.taskinfo}
                  mindId={initStates.mainId}
                  parentId={
                    moreMenuList.rightMenuItem.row.taskName.parentId
                      ? moreMenuList.rightMenuItem.row.taskName.parentId
                      : getStates.id
                  }
                />
              )}
            </>
          )}
          {/* 列表更换责任人 */}
          {chooseMenuList.classData && chooseMenuList.classData.display === 'block' && (
            <ChooseMenu
              btnList={chooseMenuList.moreMenu}
              showStyle={false}
              classData={chooseMenuList.classData}
              menuClick={btnMenuClick}
            />
          )}
          {/* 共享到人 */}
          {memberOrgShow && (
            <SelectMemberOrg
              param={{
                visible: memberOrgShow,
                ...selMemberOrg,
              }}
              action={{
                setModalShow: setMemberOrgShow,
                // 点击确认
                // onSure: selMemberSure,
              }}
            />
          )}
          {/* okr详情 */}
          {okrdeModel.visible && (
            <Okrdetail
              visible={okrdeModel.visible}
              datas={okrdeModel.dataInfo}
              mindId={initStates.mainId}
              oId={initStates.createPlan.id}
              setvisible={(start: any) => {
                setokrdeModel({ ...okrdeModel, visible: start })
              }}
              openMode={(resData: any) => {
                OpenMode('100', resData)
              }}
            ></Okrdetail>
          )}
          {/* 创建任务 */}
          {opencreattask.visible && (
            <CreatTask
              param={{ visible: opencreattask.visible }}
              datas={{
                from: 'work-plan', //来源
                isCreate: opencreattask.type, //创建0 编辑1 创建子任务2
                taskid: opencreattask.type == 1 ? opencreattask.taskId : getStates.id, //任务id
                taskdata: initStates.createPlan, //任务信息
                nowType: 0, //0个人任务 2企业任务 3部门任务
                teaminfo: '', //企业信息
                endTime: status == 3 ? getStates.fourWeekEnd + ' ' + initStates.end : '',
                addHandly: initStates.createPlan,
                taskFlag: opencreattask.taskFlag, //2草稿任务
                taskmanageData: {
                  orgInfo: opencreattask.orgInfo,
                },
              }}
              setvisible={(state: any, type?: number) => {
                setOpencreattask({ ...opencreattask, visible: state })
              }}
              callbacks={(code: any) => {
                // console.log(code)
                getPlanList(getStates.id, getStates.typeId)
                // 刷新左侧OKR列表
                isReFreshOrgLeft && isReFreshOrgLeft(304, { typeId: code.data.id })
              }}
            ></CreatTask>
          )}
          <CreateTaskModal ref={createTaskRef} />
          {/* 关联任务 */}
          {supportShow.visible && (
            <SupportModal
              param={{
                visible: supportShow.visible,
                allowTeamId: [initStates.createPlan.enterpriseId],
                contentType: 'task',
                checkboxType: 'radio',
                title: $intl.get('relateTask'),
                workPlanType: supportShow.dataInfo.type || 2,
                workPlanId: supportShow.dataInfo.id,
                showType: 2, //1是父级任务列表，2是规划关联任务列表
                periodId: Number(initStates.createPlan.period),
                onSure: supportShow.onSure,
              }}
              action={{
                setModalShow: (vaule: any) => {
                  supportShow.visible = vaule
                  setsupportShow({ ...supportShow })
                },
                // onSure: (vaule: any) => {
                //   pushTaskContentFn(vaule)
                // },
              }}
            />
          )}
        </div>
        {/* okr和任务详情 */}
        <DetailModal ref={detailModalRef} param={{}} />
      </Spin>
    </fourQuqdrantContext.Provider>
  )
}
export default FourQuadrant
//统计可派发得数量
const updateStatisticDistrNum = ({ calssName, mainId, id }: { calssName: string; mainId: any; id: number }) => {
  const param = {
    mainId, //根节点id
    id, //根节点ID
  }
  statisticDistrApi(param).then((resdata: any) => {
    jQuery(calssName).text(`(${resdata.data})` || '')
  })
}

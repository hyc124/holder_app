import React, { useEffect, useState, useReducer, useRef, useLayoutEffect } from 'react'
import {
  Modal,
  Input,
  Avatar,
  DatePicker,
  Button,
  Checkbox,
  Select,
  Tooltip,
  Progress,
  message,
  Spin,
  Dropdown,
  Tag,
} from 'antd'
import $c from 'classnames'
const { Option } = Select
import Editor from '@/src/components/editor/index'
import LoopsTask, { loopTaskListDataShow } from '@/src/components/loop-task-date/loop-task-date'
import TaskTags from './taskTags'
import Priority from './priority'
import CheckEntry, { checkListModel } from './checkEntry'
import {
  findAllCompanyApi,
  mainDutyApi,
  saveCreatTask,
  getWorkHoursApi,
  findExtendsTeamApi,
  findSupportApi,
} from './getData'
import { delForce, getForceReport, headerSettingsApi, inviteAgainApi } from '../taskDetail/getData'
import { setHeaderName } from '../taskDetail/details'
import '../creatTask/creat.less'
import { SelectMemberOrg } from '../../../components/select-member-org/index'
import { SupportModal } from '../../../components/supportOKR/supportModal'
import ParticipateEnterprise from '../../../components/participate-enterprise/index'
import { queryTaskDetailApi } from '../taskDetail/getData'
import AddHandModel from '../../fourQuadrant/components/addHandModel'
import moment from 'moment'
import UploadFile from '@/src/components/upload-file/index'
import { refreshChildTree } from '../taskDetail/taskTree'
// import { refreshDetails } from '../../workdesk/component/TargetKanban'
import { moduleItemRefresh } from '../../workdesk/ModuleItem'
import { findAuthList } from '@/src/common/js/api-com'
import { editTaskPriApi } from '../taskComApi'
import { refreshListFn } from '../taskManage/TaskManageList'
import Forcereport, { getforceTime, getforceType } from '../../force-Report/force-Report'
import { arrObjDuplicate } from '@/src/common/js/common'
import * as Maths from '@/src/common/js/math'
import { RenderUplodFile } from '../../mettingManage/component/RenderUplodFile'
export interface FileModelsItemProps {
  id: number
  fileName: string
  fileKey: string
  fileSize: number
  dir: string
  fromType: null
  fromName: null
  uploadUser: string
  uploadDate: string
  custom: null
  collectType: number
  profile: string
  url: string
  uid: number | string
  name: string
  size: number
}
// ??????????????????
let usedStar: any = {
  star: 0,
  isHave: false,
}
// ?????????????????????????????? teamconcat:???????????????
export const updatePersonData = (obj: any, arrKey: string, type: number, teamconcat?: string) => {
  const newArr: any = []
  if (teamconcat === 'teamconcat') {
    obj[arrKey].map((item: any) => {
      newArr.push({
        // account: obj[arrKey].userAccount,
        // type,
        username: item.username || item.curName,
        curName: item.username || item.curName,
        userid: item.userId || item.curId,
        curId: item.userId || item.curId,
        curType: 0,
        isExtends: item.isExtends,
        status: item.status,
        // codeList: [`${obj[arrKey].teamName}-???????????????`],
        codeList: [`???????????????`],
      })
    })
  } else {
    if (JSON.stringify(obj[arrKey]) != '{}') {
      if (obj[arrKey].curId) {
        newArr.push({
          account: obj[arrKey].userAccount,
          type,
          username: obj[arrKey].curName,
          curName: obj[arrKey].curName,
          userid: obj[arrKey].curId,
          curId: obj[arrKey].curId,
          curType: 0,
        })
      }
    }
  }

  return newArr
}
const initStates = {
  taskType: [
    {
      type: 0,
      name: '????????????',
      val: '',
    },
    {
      type: 1,
      name: '????????????',
      val: 'active',
    },
    {
      type: 2,
      name: '????????????',
      val: '',
    },
    {
      type: 3,
      name: '????????????',
      val: '',
    },
  ],
  remindTimes: [
    { type: 1, name: '0????????????' },
    { type: 2, name: '5????????????' },
    { type: 3, name: '15????????????' },
    { type: 4, name: '30????????????' },
    { type: 5, name: '1????????????' },
    { type: 6, name: '12????????????' },
    { type: 7, name: '1?????????' },
    { type: 8, name: '1?????????' },
  ],
  taskId: '', //??????ID
  taskName: '', //????????????
  editorText: '', //????????????
  tags: {
    //??????
    icon: '',
    tags: [],
  },
  taskForm: 1, //??????????????????1?????????0?????????3?????????2
  nowType: 0, // ??????????????????0???????????? 2???????????? 3????????????
  private: 0, //0?????? 1??????
  startTime: '', //????????????
  endTime: '', //????????????
  priority: {
    //?????????
    type: '',
    data: 0,
  },
  cycleModel: {}, //????????????
  checkList: [], //?????????
  correlationUserList: [], //???????????????????????????????????????????????????
  remindTimesActive: 1, //????????????
  nameData: [], //????????????????????????
  affiliation: {
    //????????????(??????????????????????????????????????? ????????????????????? ???????????????????????????)
    teamId: '',
    teamName: '',
    ascriptionId: '',
    ascriptionName: '',
    ascriptionType: '',
    deptId: '',
    deptName: '',
    roleId: '',
    roleName: '',
  },
  affiliationText: '', //????????????????????????
  executorUser: {
    //?????????
    userId: '',
    userAccount: '',
    userName: '',
    deptId: '',
    deptName: '',
    roleId: '',
    roleName: '',
  },
  assignUser: {}, //?????????
  leadershipUser: {}, //???????????????
  superviseUser: {}, //?????????
  enterprise: [], //????????????
}

// state?????????initStates?????? action???dispatch??????
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'task_type':
      return { ...state, taskType: action.data }
    case 'cycleModel':
      return { ...state, cycleModel: action.data }
    case 'nameData':
      return { ...state, nameData: action.data }
    case 'tags':
      return { ...state, tags: action.data }
    case 'nowType':
      return { ...state, nowType: action.data }
    case 'private':
      return { ...state, private: action.data }
    case 'priority':
      return { ...state, priority: action.data }
    case 'taskForm':
      return { ...state, taskForm: action.data }
    case 'checkList':
      return { ...state, checkList: action.data }
    case 'taskName':
      return { ...state, taskName: action.data }
    case 'editorText':
      return { ...state, editorText: action.data }
    case 'startTime':
      return { ...state, startTime: action.data }
    case 'endTime':
      return { ...state, endTime: action.data }
    case 'correlationUserList':
      return { ...state, correlationUserList: action.data }
    case 'remindTimesActive':
      return { ...state, remindTimesActive: action.data }
    case 'affiliation':
      return { ...state, affiliation: action.data }
    case 'affiliationText':
      return { ...state, affiliationText: action.data }
    case 'executorUser':
      return { ...state, executorUser: action.data }
    case 'assignUser':
      return { ...state, assignUser: action.data }
    case 'leadershipUser':
      return { ...state, leadershipUser: action.data }
    case 'superviseUser':
      return { ...state, superviseUser: action.data }
    case 'enterprise':
      return { ...state, enterprise: action.data }
    case 'addhand':
      return { ...state, addHandly: action.data }
    default:
      return state
  }
}
let fileModeles: object[] = []
// ?????????????????????????????????????????????
let parentBelong: any = {}
// ????????????????????????id
let supportParentOld = ''
//**************************????????????**************************//
const CreatTask = (props: any) => {
  const { nowUserId, nowAccount, nowUser, selectTeamId } = $store.getState()
  const [state, dispatch] = useReducer(reducer, initStates)
  //???????????????
  const [initcheck, setInitcheck] = useState({
    init: false,
    refreshType: '',
    enterType: '', //?????????enter??????
    farid: '', //enter???????????????????????????id
  })
  //?????????????????????????????????????????????
  const [time, setTime] = useState<any>()
  //????????????
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //?????????????????????????????????okr
  const [supportShow, setsupportShow] = useState(false)
  const [support, setsupport] = useState<any>({
    content: [],
    iscontentEdit: false,
    isokrContentEdit: false,
    okrContent: [],
    type: 0, //0???????????? 1??????OKR
    selectList: [],
    disableList: [],
    isEdit: false,
  })
  //????????????????????????????????????(????????????????????????????????? ???????????? ????????????????????????OKR)
  const [iseditParentforbid, setiSeditParentforbid] = useState(false)
  //????????????????????????
  const [selMemberOrg, setSelMemberOrg] = useState({})
  //??????????????????
  const [selectusertype, setSelectusertype] = useState()
  //?????????????????????
  const [priorityvis, setPriorityvis] = useState(false)
  //???????????????
  const [Priorityinit, setPriorityinit] = useState<any>({
    type: '',
    data: 0,
  })
  //????????????
  const [enterpriseShow, setEnterpriseShow] = useState(false)
  //??????????????????????????? ??????ID
  const [enterpriseid, setEnterpriseid] = useState('')
  //??????????????????????????????
  const [iseditenterprise, setIseditenterprise] = useState(false)
  //??????????????????????????? ?????????????????????
  const [enterpriseinfo, setenterpriseinfo] = useState<any>({
    teamid: '',
    userId: '',
    teamName: '',
  })
  //??????
  const [loading, setLoading] = useState(false)
  //0??????/1????????????/2???????????????
  const [iscreat, setIscreat] = useState<any>()
  //????????????????????????????????????
  const [ischeckData, setIscheckData] = useState(true)
  //????????????????????????
  const [keepCreat, setKeepCreat] = useState(false)
  //????????????????????????
  const [remindopen, setRemindopen] = useState(false)
  //??????????????????
  const [openloop, setOpenloop] = useState(false)
  //????????????????????????
  const [visibleShow, setvisibleShow] = useState(false)
  const refComplete = useRef(null)
  //?????????
  const checkEntryRef = useRef<any>({})
  //?????????????????????????????????
  const [subset, setSubset] = useState([])
  // ???????????????????????????
  const [fileUserList, setFileUserList] = useState<Array<any>>([])
  //??????
  const [taskDetalis, settaskDetalis] = useState<any>()
  //???????????????????????????????????????????????????
  const [partenterprise, setPartenterprise] = useState<any>()
  // ???????????????????????????????????????????????????????????????
  const [tagAndPriorHidden, setTagAndPriorHidden] = useState(false)
  //???????????????????????????0???2???31???
  const [attachType, setattachType] = useState<any>({
    type: 0,
    typeId: 0,
    taskId: 0,
  })
  //??????????????????
  const [openforceParam, setOpenforceParam] = useState({
    visible: false,
    param: {},
  })
  //??????????????????????????????id??????
  const [updateReportIds, setUpdateReportIds] = useState<any>([])
  // ??????????????????
  const [reportList, setReportList] = useState<any[]>([])
  /**
   *  props:
   *  from: '', //??????
   *  isCreate: 0, //??????0 ??????1 ???????????????2
   *  taskId: ??????id(isCreate = 1/2 ??????)
   *  nowType: 0, //0???????????? 2???????????? 3????????????
   *  teaminfo: selTeamItem, //????????????
   *  taskmanageData: ????????????????????????(tree?????? ?????????????????????)
   */

  //???????????????????????????
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')
  const [defaultFiles, setDefaultFiles] = useState<Array<any>>([])
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])

  useEffect(() => {
    usedStar.isHave = false
    //??????????????????
    init(props)
    setPageUuid(Maths.uuid())
  }, [])
  //dom????????????
  useLayoutEffect(() => {
    //????????????????????????
    setHeaderName(state.nameData)
  }, [state.nameData])
  // ????????????????????????
  const getForceReportList = (taskId: any) => {
    getForceReport({ taskId, userId: nowUserId }).then((res: any) => {
      if (res.returnCode == 0) {
        const dataList = res.dataList || []
        const newArr: any = []
        dataList.map((item: any) => {
          const time = getforceTime(item.timeType, item.timePeriod, item.triggerTime, true)
          const type = getforceType(item.status)
          const forceTime = type ? `${time} ${type}` : time

          const obj = {
            id: item.id,
            createUser: item.createUser,
            createUsername: item.createUsername,
            reporter: item.reporter.split(','),
            receiver: item.receiver.split(','),
            forceTime: forceTime,
            taskid: taskId,
            hasDelete: item.hasDelete,
            // hasDelay: item.hasDelay,
          }
          newArr.push(obj)
        })

        setReportList([...newArr])
      }
    })
  }

  /**
   * ?????????????????????????????????????????????
   */
  const getTeamsInfo = (teamList: any) => {
    // ???????????????
    const joinTeams: any = [],
      joinTeamIds: any = []
    // ?????????????????????
    const partakeMembers: any = []
    teamList?.map((item: any) => {
      if (item.isJoin) {
        joinTeams.push(item)
        joinTeamIds.push(item.id)
      } else {
        partakeMembers.push({
          curId: item.userId,
          curName: item.username || '',
          curType: 0,
          parentId: item.roleId || '',
          parentName: item.roleName || '',
          deptId: item.deptId || '',
          deptName: item.deptName || '',
          roleId: item.roleId || '',
          roleName: item.roleName || '',
          profile: item.profile || '',
          cmyId: item.teamId,
          cmyName: item.teamName,
          partakeMember: true,
        })
      }
    })
    return {
      joinTeamIds,
      joinTeams,
      partakeMembers,
    }
  }
  /**
   * ?????????????????????????????????????????????
   */
  const getIsJoin = (teamList: any, findTeamId: string) => {
    // ????????????????????????
    const findItem = teamList.filter((item: any) => item.teamId == findTeamId)
    return findItem[0] ? findItem[0].isJoin : false
  }

  //???????????????
  const init = (props: any) => {
    setiSeditParentforbid(false)
    const _from = props.datas.from
    setIscreat(props.datas.isCreate)
    if (props.datas.isCreate == 0) {
      //??????-------------------------
      //??????????????????
      dispatch({ type: 'checkList', data: [] })
      if (_from == 'workbench' || _from == 'taskManage_my') {
        //????????????????????????????????????
        findAllCompany()
      } else {
        if (_from == 'taskManage' || _from == 'work-plan') {
          if (props.datas.addHandly) {
            dispatch({
              type: 'addhand',
              data: props.datas.addHandly,
            })
            toggleTaskType(0)
          }
          //????????????
          const taskmanageOrg = props.datas.taskmanageData.orgInfo
          let deptIds = ''
          if (taskmanageOrg.curType == 2 || taskmanageOrg.curType == 3) {
            if (taskmanageOrg.curType == 2) {
              deptIds = taskmanageOrg.cmyId
            } else if (taskmanageOrg.curType == 3) {
              deptIds = taskmanageOrg.curId
            }
            //????????????
            mainDuty(
              {
                teamId: taskmanageOrg.cmyId,
                teamName: taskmanageOrg.cmyName,
                ascriptionId: taskmanageOrg.curId,
                ascriptionName: taskmanageOrg.curName,
                ascriptionType: taskmanageOrg.curType,
              },
              deptIds
            )
          } else if (taskmanageOrg.curType == 0) {
            const setData = {
              teamId: taskmanageOrg.cmyId,
              teamName: taskmanageOrg.cmyName,
              ascriptionId: taskmanageOrg.curId,
              ascriptionName: taskmanageOrg.curName,
              ascriptionType: taskmanageOrg.curType,
              deptId: taskmanageOrg.deptId,
              deptName: taskmanageOrg.deptName,
              roleId: taskmanageOrg.roleId,
              roleName: taskmanageOrg.roleName,
              userId: taskmanageOrg.curId,
              username: taskmanageOrg.curName,
              userAccount: taskmanageOrg.userAccount,
              curType: 0,
            }
            //??????????????????
            setTaskAttrVal(setData, 'init')
          }
        }
      }
    } else if (props.datas.isCreate == 1) {
      //??????-----------------------
      setLoading(true)
      const param = {
        id: props.datas.taskid,
        userId: nowUserId,
      }
      queryTaskDetailApi(param).then((resData: any) => {
        const getData = resData.data || {}
        let details = {}
        if (resData.data) {
          // ??????????????????
          if (getData.MAIN) {
            const mainData = getData.MAIN || {}
            details = { ...mainData, fileModels: getData.FILES || [] }
          } else {
            details = resData.data
          }

          setdetailData(details)
          settaskDetalis(details)
        }
      })
      // ???????????? ????????????????????????
      getForceReportList(props.datas.taskid)
    } else {
      //??????????????? --------------------
      //???????????????????????????????????????
      findExtendsTeam(props.datas.taskdata.id)

      // kr?????? ?????????????????????????????????kr
      if (props.datas.from == 'taskdetailOkr') {
        // props.datas.taskdata.isExtends = true
        //????????????
        setiSeditParentforbid(true)
        // const newParentIdArr = []
        // let newOkrContent: any = datas.supports || []
        // if (datas.parentId) {
        //   newParentIdArr.push({ id: datas.parentId, name: datas.parentTaskName })
        // }
        //?????????????????????????????????(???????????????key???)
        // if (support.okrContent.length > 0) {
        //   support.okrContent.map((item: any) => {
        //     if (item.key) {
        //       newOkrContent.push({ ...item })
        //     }
        //   })
        // }
        setsupport({
          content: [],
          okrContent: [props.datas.taskdata],
          iscontentEdit: false,
          isokrContentEdit: false,
          type: 1, //0???????????? 1??????OKR
          isEdit: false,
        })
        return
      }

      //??????????????????????????????OKR??????
      findSupport('', props.datas.taskdata.id, true)
    }
  }
  //????????????????????????
  const setEndtime = (teamid: any) => {
    //??????????????????
    const end = new Date().getTime() + 24 * 60 * 60 * 1000
    const param = {
      teamInfoId: teamid,
    }
    getWorkHoursApi(param).then((resData: any) => {
      const initend = moment(end).format(`YYYY/MM/DD ${resData.data.pmEnd}`)
      dispatch({ type: 'endTime', data: initend })
      if (props.datas.isCreate == 2) {
        //???????????????  1.??????????????????????????????????????????????????? ?????????????????????  2.??????????????????????????????????????????????????? ?????????????????????????????????

        if (props.datas.taskdata.endTime < initend) {
          dispatch({ type: 'endTime', data: props.datas.taskdata.endTime })
        }
      } else if (props.datas.addHandly && props.datas.endTime) {
        dispatch({ type: 'endTime', data: props.datas.endTime })
      }
    })
  }
  //????????????
  const setdetailData = (details: any) => {
    //??????Id
    dispatch({ type: 'taskId', data: details.id })
    //????????????
    dispatch({ type: 'taskName', data: details.name })
    //????????????
    dispatch({ type: 'editorText', data: details.description })
    // ??????????????????
    dispatch({ type: 'startTime', data: details.startTime })
    dispatch({ type: 'endTime', data: details.endTime })
    //?????????????????????OKR
    const newParentIdArr = []
    if (details.parentId) {
      newParentIdArr.push({ id: details.parentId, name: details.parentTaskName })
    }
    supportParentOld = newParentIdArr[0] ? newParentIdArr[0].id : ''
    setsupport({
      content: newParentIdArr,
      okrContent: details.supports || [],
      iscontentEdit: details.parentId ? true : false,
      isokrContentEdit: details.supports ? true : false,
      type: 0, //0???????????? 1??????OKR
      isEdit: details.parentId ? true : false,
    })
    //??????
    setFileUserList(details.fileModels || [])
    fileModeles = details.fileModels || []
    setDefaultFiles(details.fileReturnModels || [])
    setDelFileIds([])
    //?????????
    dispatch({
      type: 'priority',
      data: {
        type: details.attach?.setType,
        data: details.attach?.star,
      },
    })
    setPriorityinit({
      type: details.attach?.setType,
      data: details.attach?.star,
    })
    // ????????????
    const newTags: any = []
    if (details.tagList) {
      details.tagList.map((item: any, index: number) => {
        newTags.push({
          id: item.id,
          name: item.content,
          rgb: item.rgb,
        })
      })
    }
    dispatch({ type: 'tags', data: { icon: details.icon || '', tags: newTags } })
    //????????????
    dispatch({ type: 'private', data: details.property })
    //????????????
    dispatch({ type: 'taskForm', data: details.type })
    const taskTypeArr = [...state.taskType]
    taskTypeArr.map((item: any) => {
      item.val = ''
      if (details.type == item.type) {
        item.val = 'active'
      }
    })
    dispatch({
      type: 'taskType',
      data: taskTypeArr,
    })
    let belongPtId: any = ''
    if (details.attach?.type == 0) {
      belongPtId = details.liable.roleId ? details.liable.roleId : details.liable.deptId
    }
    setattachType({
      type: details.attach?.type,
      typeId: details.attach?.type == 0 ? details.liable.roleId : details.attach?.typeId,
      taskId: details.id,
    })
    //????????????
    dispatch({
      type: 'affiliation',
      data: {
        teamId: details.ascriptionId,
        teamName: details.ascriptionName,
        ascriptionId: details.attach?.typeId,
        parentId: belongPtId,
        curId: details.attach?.typeId,
        curName: details.attach?.typeName,
        curType: details.attach?.type,
      },
    })
    //????????????
    dispatch({
      type: 'cycleModel',
      data: details.cycleModel,
    })
    //???????????? 0???????????? 2???????????? 3????????????
    dispatch({ type: 'nowType', data: details.attach?.type })
    //????????????
    let belongShow = ''
    if (details.attach?.type == 0) {
      belongShow = `?????????????????????${details.attach?.typeName || ''}`
    } else if (details.attach?.type == 3) {
      belongShow = `?????????????????????${details.attach?.typeName || ''}`
    } else if (details.attach?.type == 2) {
      belongShow = `?????????????????????${details.attach?.typeName || ''}`
    }
    dispatch({
      type: 'affiliationText',
      data: belongShow,
    })
    //?????????
    dispatch({
      type: 'executorUser',
      data: {
        userId: details.liable.userId,
        userAccount: details.liable.account,
        userName: details.liable.username,
        deptId: details.liable.deptId,
        deptName: details.liable.deptName,
        roleId: details.liable.roleId,
        roleName: details.liable.roleName,
        curId: details.liable.userId,
        curName: details.liable.username,
        curType: 0,
        parentId: details.liable.roleId ? details.liable.roleId : details.liable.deptId,
      },
    })
    //????????????
    dispatch({
      type: 'remindTimesActive',
      data: details.reminder || 1,
    })
    //????????????
    setRemindopen(details.reminder == 0 ? false : true)
    //?????????
    if (details.distribute) {
      dispatch({
        type: 'assignUser',
        data: {
          ascriptionId: details.ascriptionId,
          userId: details.distribute.userId,
          userName: details.distribute.username,
          curId: details.distribute.userId,
          curName: details.distribute.username,
          curType: 0,
        },
      })
    }
    //???????????????
    if (details.execute) {
      dispatch({
        type: 'leadershipUser',
        data: {
          ascriptionId: details.ascriptionId,
          userId: details.execute.userId,
          userName: details.execute.username,
          curId: details.execute.userId,
          curName: details.execute.username,
          curType: 0,
          deptId: details.execute.deptId,
          deptName: details.execute.deptName,
          roleId: details.execute.roleId,
          roleName: details.execute.roleName,
        },
      })
    }
    //?????????
    if (details.supervisor) {
      dispatch({
        type: 'superviseUser',
        data: {
          ascriptionId: details.ascriptionId,
          userId: details.supervisor.userId,
          userName: details.supervisor.username,
          curId: details.supervisor.userId,
          curName: details.supervisor.username,
          curType: 0,
        },
      })
    }
    //????????????
    const enterpriseArr: any = []
    if (details.teamList) {
      details.teamList.map((item: any) => {
        enterpriseArr.push({
          id: item.teamId,
          name: item.teamName,
          userId: item.userId,
          username: item.username,
          isExtends: item.isExtends, //??????????????????????????? 1:??????????????????
          status: item.status,
          profile: item.teamLogo,
        })
      })
    }
    dispatch({ type: 'enterprise', data: enterpriseArr })
    //?????????
    dispatch({ type: 'checkList', data: details.checkList || [] })
    //??????????????????????????????
    headerSettingsList(details.ascriptionId)
    setInitcheck({ ...initcheck, init: true, refreshType: 'init' })
    setLoading(false)
  }
  //?????????????????? ????????????????????????
  const headerSettingsList = (cmyId: any) => {
    let nameData: any = []
    const param = {
      teamInfoId: cmyId,
    }
    const url = '/task/taskForm/findTaskFormSettingByTeamInfoId'
    headerSettingsApi(param, url).then((resdata: any) => {
      nameData = resdata.data.taskFormSettings
      dispatch({
        type: 'nameData',
        data: nameData,
      })
    })
  }
  //??????????????????
  const findAllCompany = () => {
    const param = {
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }
    //?????????????????????????????????????????????
    findAllCompanyApi(param).then((resData: any) => {
      let firstCmy = null
      if (resData.length > 0) {
        if (props.datas.from == 'workbench') {
          firstCmy = resData.find((item: any, index: number) => {
            if (selectTeamId && selectTeamId != -1) {
              return item.id == selectTeamId
            } else {
              return index == 0
            }
          })
        } else {
          firstCmy = resData.find((item: any, index: number) => {
            return index == 0
          })
        }
      }
      //????????????
      mainDuty(
        {
          teamId: firstCmy.id,
          teamName: firstCmy.shortName,
          ascriptionId: firstCmy.id,
          ascriptionName: firstCmy.shortName,
          ascriptionType: 31,
        },
        undefined
      )
    })
  }
  //????????????????????????????????????????????????
  const findExtendsTeam = (taskid: any) => {
    const param = {
      taskId: taskid,
      userId: nowUserId,
    }
    findExtendsTeamApi(param).then((resData: any) => {
      const resDatas = resData.data || {}
      const resDatalist = resData.dataList || []
      parentBelong = resDatas
      setPartenterprise(resDatalist)
      const setData = {
        teamId: resDatas.teamId,
        teamName: resDatas.teamName,
        ascriptionId: resDatas.teamId,
        ascriptionName: resDatas.teamName,
        ascriptionType: 2,
        deptId: resDatas.deptId,
        deptName: resDatas.deptName,
        roleId: resDatas.roleId,
        roleName: resDatas.roleName,
        userId: resDatas.userId,
        username: resDatas.username,
        userAccount: resDatas.userAccount,
        curType: 0,
      }
      //?????????????????????????????????
      setTaskAttrVal(setData, 'init')
      const subArr: any = []
      const enterpriseArr: any = []
      resDatalist.map((item: any) => {
        subArr.push(item.teamId)
        //???????????????????????????(????????????????????? ????????????????????????)
        if (resDatas.teamId != item.teamId) {
          enterpriseArr.push({
            id: item.teamId,
            name: item.teamName,
            userId: item.userId,
            username: item.username,
            isExtends: item.isExtends, //??????????????????????????? 1:??????????????????
            status: item.status,
            profile: item.teamLogo,
          })
        }
      })
      dispatch({ type: 'enterprise', data: enterpriseArr })
      setSubset(subArr) //???????????????????????????????????????
    })
    dispatch({ type: 'taskForm', data: props.datas.taskdata.type }) //?????? ?????? ?????? ??????
    const taskTypeArr = [...state.taskType]
    taskTypeArr.map((item: any) => {
      item.val = ''
      if (props.datas.taskdata.type == item.type) {
        item.val = 'active'
      }
    })
    dispatch({
      type: 'taskType',
      data: taskTypeArr,
    })
  }
  /**
   * //???????????????????????????OKR??????
   * @param taskid ?????????????????????????????????????????????
   * @param parentId ???????????????????????????
   * @param isforbid ???????????????????????????????????????????????????
   */
  const findSupport = (taskid: any, parentId: any, isforbid: boolean) => {
    const param = {
      taskId: taskid || undefined,
      parentId: parentId,
    }
    findSupportApi(param).then((resData: any) => {
      //?????????????????????OKR
      const datas = resData.data
      if (datas) {
        //????????????
        setiSeditParentforbid(isforbid)
        const newParentIdArr = []
        const newOkrContent: any = datas.supports || []
        if (datas.parentId) {
          newParentIdArr.push({ id: datas.parentId, name: datas.parentTaskName })
        }
        //?????????????????????????????????(???????????????key???)
        if (support.okrContent.length > 0) {
          support.okrContent.map((item: any) => {
            if (item.key) {
              newOkrContent.push({ ...item })
            }
          })
        }
        setsupport({
          content: newParentIdArr,
          okrContent: newOkrContent || [],
          iscontentEdit: datas.parentId ? true : false,
          isokrContentEdit: datas.supports ? true : false,
          type: 0, //0???????????? 1??????OKR
          isEdit: support.isEdit,
        })
      }
    })
  }
  //??????????????????
  const mainDuty = (firstCmy: any, deptId: any) => {
    // deptId?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
    const param = {
      account: nowAccount,
      teamId: firstCmy.teamId,
      deptId: deptId,
      isCreate: props.datas.isCreate, //??????0 ??????1
    }
    mainDutyApi(param).then((resData: any) => {
      const datas = resData.data
      const setData = {
        teamId: firstCmy.teamId,
        teamName: firstCmy.teamName,
        ascriptionId: firstCmy.ascriptionId,
        ascriptionName: firstCmy.ascriptionName,
        ascriptionType: firstCmy.ascriptionType,
        deptId: datas.deptId,
        deptName: datas.showDeptName || datas.deptName,
        roleId: datas.roleId,
        roleName: datas.roleName,
        userId: datas.userId,
        username: datas.username,
        userAccount: datas.userAccount,
        profile: datas.profile,
      }
      //??????????????????
      setTaskAttrVal(setData, 'init')
    })
  }
  //??????????????????
  const clearDatas = (types: string) => {
    //???????????????
    setTime('0')
    dispatch({
      type: 'checkList',
      data: [],
    })
    //???????????????
    setPriorityinit({
      type: '',
      data: 0,
    })
    dispatch({
      type: 'priority',
      data: {
        type: '',
        data: 0,
      },
    })
    //????????????
    dispatch({
      type: 'tags',
      data: {
        icon: '',
        tags: [],
      },
    })
    //??????????????????
    dispatch({
      type: 'private',
      data: 0,
    })
    //?????????????????? ---------------
    if (types == 'keepCreat') {
      //????????????
      dispatch({ type: 'enterprise', data: [] })
      //???????????????
      dispatch({ type: 'leadershipUser', data: {} })
      //?????????
      dispatch({ type: 'superviseUser', data: {} })
      //????????????
      dispatch({ type: 'remindTimesActive', data: 1 })
      //0?????? 1??????
      dispatch({ type: 'private', data: 0 })
      //????????????
      dispatch({ type: 'startTime', data: '' })
      //????????????
      // const end = new Date().getTime() + 24 * 60 * 60 * 1000
      // const initend = moment(end).format('YYYY/MM/DD 18:00')
      // dispatch({ type: 'endTime', data: initend })
      setEndtime(state.affiliation.teamId)
      //????????????
      dispatch({ type: 'taskName', data: '' })
      //????????????
      dispatch({ type: 'editorText', data: '' })
      setKeepCreat(false)
      //??????
      setFileUserList([])
      fileModeles = []
      setDefaultFiles([])
      setDelFileIds([])
      //?????????????????????OKR
      setsupport({
        content: [],
        okrContent: [],
        iscontentEdit: false,
        isokrContentEdit: false,
        type: 0, //0???????????? 1??????OKR
        isEdit: false,
      })
      setReportList([])
    }
  }
  //????????????????????????
  const setTaskAttrVal = (setData: any, types: any) => {
    if (types == 'init') {
      //??????????????????
      headerSettingsList(setData.teamId)
      //????????????????????????
      setEndtime(setData.teamId)
      //???????????????????????? ?????? ??????
      dispatch({
        type: 'nowType',
        data: props.datas.nowType,
      })
      //????????? ----------------------------------------
      dispatch({
        //????????????????????????
        type: 'affiliation',
        data: {
          cmyId: setData.teamId,
          teamId: setData.teamId,
          teamName: setData.teamName,
          ascriptionId: setData.ascriptionId,
          ascriptionName: setData.ascriptionName,
          ascriptionType: setData.ascriptionType,
          deptId: setData.deptId,
          deptName: setData.deptName,
          roleId: setData.roleId,
          roleName: setData.roleName,
          curId: setData.userId,
          curName: setData.username,
          curType: setData.curType,
          parentId: setData.roleId ? setData.roleId : setData.deptId,
        },
      })
      //???????????????????????????
      dispatch({
        type: 'executorUser',
        data: {
          cmyId: setData.teamId,
          cmyName: setData.teamName,
          userId: setData.userId,
          userAccount: setData.userAccount,
          userName: setData.username,
          deptId: setData.deptId,
          deptName: setData.deptName,
          roleId: setData.roleId,
          roleName: setData.roleName,
          curId: setData.userId,
          curName: setData.username,
          curType: 0,
          profile: setData.profile,
          parentId: setData.roleId ? setData.roleId : setData.deptId,
        },
      })
      //???????????????????????????
      dispatch({
        type: 'assignUser',
        data: {
          userAccount: setData.userAccount,
          cmyId: setData.teamId,
          cmyName: setData.teamName,
          ascriptionId: setData.teamId,
          userId: nowUserId,
          userName: nowUser,
          curId: nowUserId,
          curName: nowUser,
          curType: 0,
          profile: setData.profile,
        },
      })
    } else {
      //?????????????????? ----------------------------------------
      if (
        types == 'assignUser' ||
        types == 'leadershipUser' ||
        types == 'superviseUser' ||
        types == 'executorUser'
      ) {
        //????????? ??????????????????????????????????????? -----------------------
        if (setData == '') {
          dispatch({
            type: types,
            data: {},
          })
        } else {
          dispatch({
            type: types,
            data: {
              cmyId: setData.teamId,
              cmyName: setData.teamName,
              account: setData.userAccount,
              userAccount: setData.userAccount,
              ascriptionId: setData.teamId,
              userId: setData.userId,
              userName: setData.userName,
              curId: setData.userId,
              curName: setData.userName,
              curType: 0,
              deptId: setData.deptId,
              deptName: setData.deptName,
              roleId: setData.roleId,
              roleName: setData.roleName,
              parentId: setData.roleId ? setData.roleId : setData.deptId,
            },
          })
          //??????????????????????????????????????? ?????????-1??????0
          if (types == 'executorUser' && state.nowType == -1) {
            //???????????????????????????
            dispatch({
              type: 'nowType',
              data: 0,
            })
          }
        }
      } else if (types == 'affiliation') {
        //???????????? -----------------------
        setEndtime(setData.teamId)
        dispatch({
          //????????????????????????
          type: 'affiliation',
          data: {
            userAccount: setData.userAccount,
            cmyId: setData.teamId,
            cmyName: setData.teamName,
            teamId: setData.teamId,
            teamName: setData.teamName,
            ascriptionId: setData.ascriptionId,
            ascriptionName: setData.ascriptionName,
            ascriptionType: setData.ascriptionType,
            deptId: setData.deptId,
            deptName: setData.deptName,
            roleId: setData.roleId,
            roleName: setData.roleName,
            curId: setData.userId,
            curName: setData.userName || setData.username,
            curType: setData.curType,
            parentId: setData.roleId ? setData.roleId : setData.deptId,
          },
        })
        //???????????????????????? ?????? ??????
        dispatch({
          type: 'nowType',
          data: setData.ascriptionType,
        })
        //????????????????????????????????????????????????????????? ???????????????????????????
        if (state.affiliation.teamId != setData.teamId) {
          const arr = ['leadershipUser', 'superviseUser']
          for (let i = 0; i < arr.length; i++) {
            dispatch({
              type: arr[i],
              data: {},
            })
          }
          // ???????????????????????????
          dispatch({
            type: 'assignUser',
            data: {
              ascriptionId: setData.teamId,
              userId: nowUserId,
              userName: nowUser,
              curId: nowUserId,
              curName: nowUser,
              curType: 0,
              userAccount: nowAccount,
            },
          })
          clearDatas('')
        }
        // ???????????????????????????
        if (setData.ascriptionType == 0) {
          dispatch({
            type: 'executorUser',
            data: {
              cmyId: setData.teamId,
              cmyName: setData.teamName,
              userId: setData.userId,
              userAccount: setData.userAccount,
              userName: setData.userName,
              curId: setData.userId,
              curName: setData.userName,
              curType: 0,
              deptId: setData.deptId,
              deptName: setData.deptName,
              roleId: setData.roleId,
              roleName: setData.roleName,
              parentId: setData.roleId ? setData.roleId : setData.deptId,
            },
          })
        }
      }
      //?????????????????????????????????????????????????????????????????? ????????????(????????????)
      if (iscreat == 2 && (types == 'affiliation' || types == 'executorUser')) {
        const enterpriseArr: any = []
        partenterprise.map((item: any) => {
          //???????????????????????????(????????????????????? ????????????????????????)
          if (setData.teamId != item.teamId) {
            enterpriseArr.push({
              id: item.teamId,
              name: item.teamName,
              userId: item.userId,
              username: item.username,
              isExtends: item.isExtends, //??????????????????????????? 1:??????????????????
              status: item.status,
              profile: item.teamLogo,
            })
          }
        })
        dispatch({ type: 'enterprise', data: enterpriseArr })
      }
    }
    //????????????????????????????????????????????????????????????111
    if (types == 'init' || types == 'executorUser' || types == 'affiliation') {
      //??????????????????????????????
      const nowTypes = types == 'init' ? props.datas.nowType : state.nowType
      let orgShowTxt = ''
      const textType = (type: any) => {
        let classText = ''
        if (type == 0 || type == 31) {
          classText = '?????????'
        } else if (type == 2) {
          classText = '?????????'
        } else if (type == 3) {
          classText = '?????????'
        }
        return classText
      }
      orgShowTxt = `????????????${setData.teamName}-${setData.deptName || ''}-${setData.roleName || ''}`
      if (types == 'affiliation') {
        //????????????
        if (setData.ascriptionType == 3) {
          // ??????
          orgShowTxt = `${textType(setData.ascriptionType)}???${setData.teamName}-${setData.ascriptionName}`
        } else if (setData.ascriptionType == 2) {
          // ??????
          orgShowTxt = `${textType(setData.ascriptionType)}???${setData.teamName}`
        } else if (setData.ascriptionType == 0) {
          // ??????
          if (setData.teamId == setData.deptId) {
            orgShowTxt = `${textType(setData.ascriptionType)}???${setData.teamName}-${setData.roleName || ''}`
          } else {
            orgShowTxt = `${textType(setData.ascriptionType)}???${setData.teamName}-${setData.deptName ||
              ''}-${setData.roleName || ''}`
          }
        } else {
          orgShowTxt = `${textType(setData.ascriptionType)}???${setData.teamName}-${setData.roleName || ''}`
        }
      } else if (types == 'executorUser') {
        //???????????????
        if (state.affiliation.ascriptionType == 0 || state.affiliation.ascriptionType == 31) {
          orgShowTxt = `????????????${setData.teamName}-${setData.deptName || ''}-${setData.roleName || ''}`
        } else {
          //?????????????????????????????? ????????????????????????
          if (state.affiliation.ascriptionType == 2) {
            orgShowTxt = `${textType(state.affiliation.ascriptionType)}???${setData.teamName}`
          } else {
            orgShowTxt = `${textType(state.affiliation.ascriptionType)}???${setData.teamName}-${state.affiliation
              .deptName || ''}`
          }
          // orgShowTxt = `${textType(state.affiliation.ascriptionType)}???${state.affiliation.teamName}-${state
          //   .affiliation.deptName || ''}-${state.affiliation.roleName || ''}`
        }
      } else if (props.datas.from == 'workbench' && nowTypes == 0) {
        //?????????????????????
        orgShowTxt = `????????????${setData.teamName}-${setData.deptName || ''}-${setData.roleName || ''}`
      } else if (props.datas.from == 'taskManage') {
        //????????????
        if (setData.ascriptionType == 0) {
          orgShowTxt = `${textType(setData.ascriptionType)}???${setData.teamName}-${setData.deptName ||
            ''}-${setData.roleName || ''}`
        } else if (setData.ascriptionType == 2) {
          orgShowTxt = `${textType(setData.ascriptionType)}???${setData.teamName}`
        } else {
          orgShowTxt = `${textType(setData.ascriptionType)}???${setData.teamName}-${setData.deptName || ''}`
        }
      } else if (props.datas.from == 'taskManage_my') {
        //????????????????????????
        orgShowTxt = `????????????${setData.teamName}-${setData.deptName || ''}-${setData.roleName || ''}`
      }
      dispatch({
        type: 'affiliationText',
        data: orgShowTxt,
      })
    }
    // ?????????????????????
    findAuthList({ typeId: setData.teamId || '' })
  }
  //??????????????????
  const toggleTaskType = (type: any) => {
    // ??????-?????????????????????????????????
    // if (props.datas.isCreate == 2) {
    //   //???????????????????????????????????????
    //   message.warning('???????????????????????????????????????')
    //   return
    // }
    const newArr = state.taskType
    newArr.find((item: any) => {
      item.val = ''
      if (type == item.type) {
        item.val = 'active'
      }
    })
    dispatch({
      type: 'task_type',
      data: newArr,
    })
    dispatch({
      type: 'taskForm',
      data: type,
    })
    if (
      state.addHandly &&
      state.addHandly.type != 2 &&
      state.addHandly.type != 3 &&
      state.addHandly.taskType != type
    ) {
      dispatch({
        type: 'addhand',
        data: props.datas.addHandly,
      })
    }
  }
  //????????????
  const delTags = (type: any, id: any) => {
    if (type == 'icon') {
      dispatch({
        type: 'tags',
        data: { icon: '', tags: [...state.tags.tags] },
      })
    } else if (type == 'tages') {
      let dataList = [...state.tags.tags]
      dataList = dataList.filter(item => item.id !== id)
      dispatch({
        type: 'tags',
        data: { icon: state.tags.icon, tags: dataList },
      })
    }
  }
  //????????????????????????
  const selProperty = () => {
    dispatch({
      type: 'private',
      data: state.private == 0 ? 1 : 0,
    })
  }
  //????????????
  const editName = (e: any) => {
    e.persist()
    dispatch({
      type: 'taskName',
      data: e.target.value,
    })
  }
  //??????????????????
  const editorChange = (html: string) => {
    dispatch({
      type: 'editorText',
      data: html,
    })
  }
  //?????????????????????????????????tag?????????
  const gettags: any = useRef()
  const clicktags = () => {
    // changeVal??????????????????????????????????????????
    gettags.current.changeVal()
  }
  //????????????
  const editTimes = (val: any, type: string) => {
    let times: any = ''
    if (val) {
      times = moment(val).format('YYYY/MM/DD HH:mm')
    }
    dispatch({
      type: type,
      data: times,
    })
  }
  //??????????????????
  const handleChange = (value: any) => {
    dispatch({
      type: 'remindTimesActive',
      data: value,
    })
  }
  //??????????????????
  const selectUser = (type: any) => {
    setMemberOrgShow(true)
    setSelectusertype(type)
    let initSelMemberOrg: any = {}
    const comMember: boolean = type == 0 || type == 1 ? false : true
    const selectListArr = ['affiliation', 'executorUser', 'assignUser', 'leadershipUser', 'superviseUser']
    const getTeams = getTeamsInfo(partenterprise)
    if (type == '1' || type == '2' || type == '3' || type == '4') {
      let allowTeamId = [state.affiliation.teamId]
      if (props.datas.isCreate == 2) {
        allowTeamId = [parentBelong.teamId]
      }
      let _selectList: any = []
      if (JSON.stringify(state[selectListArr[type]]) == '{}') {
        _selectList = []
      } else {
        if (state[selectListArr[type]].userId != undefined) {
          _selectList = [state[selectListArr[type]]]
        }
      }
      //???????????????????????????????????????????????????[????????????]
      initSelMemberOrg = {
        // teamId: state.affiliation.teamId,
        sourceType: '', //????????????
        allowTeamId: allowTeamId,
        selectList: _selectList, //????????????????????????
        checkboxType: 'radio',
        isDel: type == '1' || type == '2' ? false : true, //?????????????????? true????????????
        permissionType: 3, //?????????????????????????????????
        orgBotInfo: {
          type: 'joinTeam',
          title: '???????????????????????????????????????????????????????????????',
        },
        orgBotList: getTeams.partakeMembers || [],
        onSure: (datas: any) => {
          const getData = datas[0] || {}
          findAuthList({ typeId: getData.cmyId })
          selMemberSure(datas, type)
        },
        comMember,
      }
      setSelMemberOrg(initSelMemberOrg)
    } else if (type == 0) {
      let _allowTeamId: any = []
      let checkableTypes: any = [0, 2, 3]
      if (props.datas.isCreate == 1 || props.datas.from == 'taskManage' || props.datas.from == 'work-plan') {
        //???????????????????????????????????????????????? =>????????????
        _allowTeamId = [state.affiliation.teamId]
        if (state.addHandly && state.addHandly.type != 2 && state.addHandly.type != 3) {
          checkableTypes = [0, 3]
        }
      } else if (props.datas.isCreate == 2) {
        //??????????????????????????????????????????
        _allowTeamId = [...subset]
        checkableTypes = [0, 3]
      }
      let _selectList: any = []
      if (JSON.stringify(state[selectListArr[type]]) == '{}') {
        _selectList = []
      } else if (state[selectListArr[type]].curType != undefined && state[selectListArr[type]].curType != -1) {
        _selectList = [state[selectListArr[type]]]
      }
      // if (_selectList.length == 0 && state.affiliationText && state.affiliationText.splite('???')[1]) {
      //   const typeName = state.affiliationText.splite('???')[1] || ''
      //   const teamInfo = state.affiliation || {}
      //   _selectList = [
      //     {
      //       curId: teamInfo.ascriptionId || '',
      //       curName: typeName,
      //       account: '',
      //       curType: teamInfo.type || 0,
      //     },
      //   ]
      // }
      //??????[????????????]
      initSelMemberOrg = {
        sourceType: 'taskBelong', //????????????
        selectList: _selectList, //????????????????????????
        checkboxType: 'radio',
        permissionType: 1, //?????????????????????????????????
        allowTeamId: _allowTeamId, //?????????????????????????????????
        checkableType: checkableTypes,
        orgBotInfo: {
          type: 'joinTeam',
          title: '???????????????????????????????????????????????????????????????',
        },
        orgBotList: getTeams.partakeMembers || [],
        isDel: false,
        onSure: (datas: any) => {
          selMemberSure(datas, type)
        },
        comMember,
      }
      setSelMemberOrg(initSelMemberOrg)
    }
  }
  //????????????????????????
  const selMemberSure = (dataList: any, selectusertype: string) => {
    const datas = dataList[0]
    if (selectusertype == '0') {
      //??????????????????
      const setData = {
        teamId: datas.cmyId,
        teamName: datas.cmyName,
        ascriptionId: datas.curId,
        ascriptionName: datas.curName,
        ascriptionType: datas.curType,
        deptId: datas.deptId || datas.cmyId,
        deptName: datas.deptName || datas.cmyName,
        roleId: datas.roleId,
        roleName: datas.roleName,
        userId: datas.userId || datas.curId,
        userAccount: datas.account,
        userName: datas.userName || datas.curName,
        showName: datas.showName,
        curType: datas.curType,
        parentId: datas.roleId ? datas.roleId : datas.deptId,
      }
      setTaskAttrVal({ ...setData }, 'affiliation')
      //???????????????????????????????????? ????????????????????????????????????????????????
      if ((datas.cmyId! = state.affiliation.teamId)) {
        parentBelong = setData
      }
      if (datas.curType == 2 || datas.curType == 3) {
        //????????????????????????????????? ???????????????????????????????????????
        const param = {
          account: nowAccount,
          teamId: setData.teamId,
          deptId: datas.curType == 2 ? setData.teamId : datas.deptId,
          isCreate: props.datas.isCreate, //??????0 ??????1
        }
        mainDutyApi(param).then((resData: any) => {
          const data = resData.data
          dispatch({
            type: 'executorUser',
            data: {
              cmyId: setData.teamId,
              cmyName: datas.cmyName,
              curId: data.userId,
              curName: data.username || data.userName,
              curType: 0,
              deptId: data.deptId,
              deptName: data.deptName,
              roleId: data.roleId,
              roleName: data.roleName,
              userId: data.userId,
              userAccount: data.userAccount,
              userName: data.username || data.userName,
              parentId: data.roleId ? data.roleId : data.deptId,
            },
          })
        })
      }
      differCompany({
        teamId: setData.teamId,
        nowType: datas.curType,
        datas,
      })
    } else {
      let types = ''
      if (selectusertype == '1') {
        //?????????
        types = 'executorUser'
      } else if (selectusertype == '2') {
        //?????????
        types = 'assignUser'
      } else if (selectusertype == '3') {
        //???????????????
        types = 'leadershipUser'
      } else if (selectusertype == '4') {
        //?????????
        types = 'superviseUser'
      }
      if (datas) {
        const setData = {
          teamId: datas.cmyId,
          userId: datas.userId || datas.curId,
          teamName: datas.cmyName,
          userAccount: datas.account,
          userName: datas.userName || datas.curName,
          showName: datas.showName,
          deptId: datas.deptId || datas.cmyId,
          deptName: datas.deptName || datas.cmyName,
          roleId: datas.roleId,
          roleName: datas.roleName,
          parentId: datas.roleId ? datas.roleId : datas.deptId,
        }
        setTaskAttrVal(setData, types)
        if (selectusertype == '1') {
          differCompany({
            teamId: datas.cmyId,
            nowType: datas.curType,
            datas,
          })
        }
      } else {
        setTaskAttrVal('', types)
      }
    }
  }
  //????????????????????????
  const setAddHandlySure = (data: any) => {
    dispatch({
      type: 'addhand',
      data: data,
    })
    const taskmanageOrg = props.datas.taskmanageData.orgInfo
    if (state.affiliation.curType == 2 && data.type != 2 && data.type != 3) {
      //??????????????????
      const setData = {
        teamId: taskmanageOrg.cmyId,
        teamName: taskmanageOrg.cmyName,
        ascriptionId: taskmanageOrg.curId,
        ascriptionName: taskmanageOrg.curName,
        ascriptionType: taskmanageOrg.curType,
        deptId: taskmanageOrg.deptId,
        deptName: taskmanageOrg.deptName,
        roleId: taskmanageOrg.roleId,
        roleName: taskmanageOrg.roleName,
        userId: taskmanageOrg.curId,
        userName: taskmanageOrg.curName,
        userAccount: taskmanageOrg.userAccount,
        curType: 0,
      }
      setTaskAttrVal({ ...setData }, 'affiliation')
    }
  }

  /**
   * ??????????????????????????????
   */
  const differCompany = ({ teamId, nowType, datas }: { teamId: string; nowType: number; datas: any }) => {
    //????????????????????????????????????[??????????????????????????????????????????????????????????????????????????????]
    if (iscreat != 2) {
      return
    }
    // 1 ???????????????????????????????????????????????????????????????????????????
    const isJoin = getIsJoin(partenterprise || [], teamId)
    setTagAndPriorHidden(isJoin ? false : true)
    if (!isJoin) {
      // 1 ?????????????????????
      setTagAndPriorHidden(true)
      // 2 ?????????????????????????????????
      const userModal = {
        teamId: datas.cmyId,
        userId: datas.userId || datas.curId,
        teamName: datas.cmyName,
        userAccount: datas.account,
        userName: datas.userName || datas.curName,
        showName: datas.showName,
        deptId: datas.deptId,
        deptName: datas.deptName,
        roleId: datas.roleId,
        roleName: datas.roleName,
        parentId: datas.deptId,
      }
      if (nowType == 0 && selectusertype == '0') {
        setTaskAttrVal(userModal, 'executorUser')
        setTaskAttrVal(userModal, 'assignUser')
        // //???????????????????????????
        // dispatch({
        //   type: 'executorUser',
        //   data: userModal,
        // })
        // //???????????????????????????
        // dispatch({
        //   type: 'assignUser',
        //   data: userModal,
        // })
      } else if (nowType == 0 && selectusertype == '1') {
        //??????????????????
        const setData = {
          teamId: datas.cmyId,
          teamName: datas.cmyName,
          ascriptionId: datas.curId,
          ascriptionName: datas.curName,
          ascriptionType: datas.curType,
          deptId: datas.deptId || datas.cmyId,
          deptName: datas.deptName || datas.cmyName,
          roleId: datas.roleId,
          roleName: datas.roleName,
          userId: datas.userId || datas.curId,
          userAccount: datas.account,
          userName: datas.userName || datas.curName,
          showName: datas.showName,
          curType: 0,
        }
        setTaskAttrVal(setData, 'affiliation')
        setTaskAttrVal(userModal, 'assignUser')
      }
    }
  }
  //????????????
  const setEnterprise = (datas: any, id: any) => {
    const list = [...state.enterprise]
    if (id) {
      //??????
      for (let i = 0; i < list.length; i++) {
        if (id == list[i].id) {
          list.splice(i, 1)
          i--
          break
        }
      }
      dispatch({
        type: 'enterprise',
        data: list,
      })
    } else {
      //???????????????
      if (iseditenterprise) {
        //?????????????????????
        for (let i = 0; i < list.length; i++) {
          if (enterpriseinfo.teamid == list[i].id && enterpriseinfo.userId == list[i].userId) {
            list.splice(i, 1)
            i--
            break
          }
        }
        dispatch({
          type: 'enterprise',
          data: [...list, ...datas],
        })
      } else {
        dispatch({
          type: 'enterprise',
          data: [...state.enterprise, ...datas],
        })
      }
    }
  }
  //????????????
  const inviteAgain = (teamId: any, userId: any) => {
    setLoading(true)
    const param = {
      taskId: props.datas.taskid,
      userId: nowUserId,
      teamId: teamId,
    }
    const url = '/task/joinTeam/inviteAgain'
    inviteAgainApi(param, url).then((resData: any) => {
      if (resData.returnCode == 0) {
        message.success('?????????')
        const list = [...state.enterprise]
        for (let i = 0; i < list.length; i++) {
          if (teamId == list[i].id && userId == list[i].userId) {
            list[i].status = 0
            break
          }
        }
        setLoading(false)
        dispatch({
          type: 'enterprise',
          data: list,
        })
      } else {
        message.error(resData.returnMessage)
        setLoading(false)
      }
    })
  }
  //??????????????????????????????
  const EnterpriseList = () => {
    const list = [...state.enterprise]
    const newArr = []
    for (let i = 0; i < list.length; i++) {
      newArr.push({
        teamId: list[i].id,
        userId: list[i].userId,
        isExtends: list[i].isExtends || '0',
        status: list[i].status || '0', //0?????????  2???differCompany??????   1???????????????
      })
    }
    return newArr
  }
  //????????????
  const getFileList = () => {
    const fileList: any = []
    fileUserList.forEach(file => {
      if (file) {
        const fileName = file.name
        const fileSuffix = fileName
          .toLowerCase()
          .split('.')
          .splice(-1)[0]
        if (file.id) {
          fileList.push({
            id: file.id,
            fileKey: file.fileKey,
            fileName: file.fileName,
            fileSize: file.fileSize,
            dir: 'task',
          })
        } else {
          fileList.push({
            id: file.id || '',
            fileKey: file.uid + '.' + fileSuffix,
            fileName: file.name,
            fileSize: file.size,
            dir: 'task',
          })
        }
      }
    })
    return fileList
  }
  // ????????????
  const unique = (arr: any[]) => {
    return Array.from(new Set(arr))
  }
  //????????????OKR??????
  const getSupportOKR = () => {
    let newArr: any = []
    support.okrContent.map((item: any) => {
      newArr.push({
        mainId: item.mainId, //??????ID
        mainParentId: item.workPlanId || item.id, //????????????ID
        isExtends: item.isExtends || false,
      })
    })
    if (support.okrContent.length > 0 && support.okrContent[0] == -1) {
      newArr = []
    }
    return newArr
  }
  //??????
  const handleOk = () => {
    const tagIds: any = []
    $.each(state.tags.tags || [], (index: any, item: any) => {
      tagIds.push(item.id)
    })
    if (state.taskName == '') {
      message.warning('??????????????????????????????')
      return
    }
    // ????????????id??????
    const forceReportIds: any[] = []
    reportList.map((item: any) => {
      forceReportIds.push(item.id)
    })
    let _parentId = null

    if (support.isEdit && support.content.length == 0) {
      _parentId = ''
    } else {
      _parentId = support.content.length > 0 ? support.content[0].id : null
    }
    setLoading(true)

    const param: any = {
      type: state.taskForm, //???????????? ??????0 ??????1
      ascriptionId: state.affiliation.teamId || props.datas.taskdata.ascriptionId, //??????ID---------------
      ascriptionName: state.affiliation.teamName || props.datas.taskdata.ascriptionName, //????????????--------------
      ascriptionType: 2, //???????????????2
      name: state.taskName, //??????
      description: state.editorText, //??????
      operateUser: nowUserId, //?????????(?????????)
      operateUserName: nowUser, //?????????(???????????????)
      parentId: _parentId, //??????????????????????????????id---------------
      supports: getSupportOKR(), //??????OKR
      createType: 1, //???????????????????????????????????????
      startTime: state.startTime, //????????????
      endTime: state.endTime, //????????????
      property: state.private, //??????0 ??????1
      cycleModel: state.cycleModel, //??????
      tagList: tagIds, //??????
      icon: state.tags.icon, //??????
      fileModels: getFileList() || [], //??????
      temporaryId: pageUuid,
      fileGuidList: delFileIds,
      liable: {
        //?????????
        ascriptionId: state.affiliation.teamId || props.datas.taskdata.ascriptionId,
        deptId: state.executorUser.deptId,
        deptName: state.executorUser.deptName,
        roleId: state.executorUser.roleId,
        roleName: state.executorUser.roleName,
        userId: state.executorUser.userId,
        username: state.executorUser.userName,
      },
      distribute:
        JSON.stringify(state.assignUser) != '{}'
          ? {
              ascriptionId: state.assignUser.ascriptionId || props.datas.taskdata.ascriptionId,
              userId: state.assignUser.userId,
              userName: state.assignUser.userName,
            }
          : {}, //?????????
      executor:
        JSON.stringify(state.leadershipUser) != '{}'
          ? {
              ascriptionId: state.leadershipUser.ascriptionId || props.datas.taskdata.ascriptionId,
              userId: state.leadershipUser.userId,
              userName: state.leadershipUser.userName,
              deptId: state.leadershipUser.deptId,
              deptName: state.leadershipUser.deptName,
              roleId: state.leadershipUser.roleId,
              roleName: state.leadershipUser.roleName,
            }
          : {}, //???????????????
      supervisor:
        JSON.stringify(state.superviseUser) != '{}'
          ? {
              ascriptionId: state.superviseUser.ascriptionId || props.datas.taskdata.ascriptionId,
              userId: state.superviseUser.userId,
              userName: state.superviseUser.userName,
            }
          : {}, //?????????
      attach: {
        star: state.priority.data, //???????????????
        type: state.nowType, //0 ????????????  2????????????  3????????????
        typeId: state.nowType == 0 ? state.executorUser.userId : state.affiliation.ascriptionId, // ????????????id
      },
      projectId: '',
      reminder: remindopen ? state.remindTimesActive : 0, //????????????
      // checkList: state.checkList && !ischeckData ? checkListModel(state.checkList, 'add') : state.checkList, //?????????
      checkList: state.checkList,
      teamList: EnterpriseList(), // ????????????
      forceReportIds, //??????ids
      updateForceIds: unique(updateReportIds), //??????????????????ids
    }
    let url = ''
    let messageText = ''
    if (iscreat == 1) {
      //????????????
      url = '/task/modify/id'
      messageText = '??????????????????'
      param.id = props.datas.taskid
      //????????????(????????????)
      if (props.datas.taskFlag && props.datas.taskFlag == 2) {
        url = '/task/work/plan/editTask'
      }
    } else {
      //????????????
      url = '/task/addTaskByName'
      messageText = '??????????????????'
      if (iscreat == 2) {
        param.parentId = props.datas.taskid
      }
    }
    if (state.addHandly) {
      param.parentId = state.addHandly.typeId
      param.mainId = props.datas.addHandly.mainId
    }
    // return
    saveCreatTask(param, url).then((resData: any) => {
      if (resData.returnCode == 0) {
        setLoading(false)
        message.success(messageText)

        if (keepCreat) {
          //??????????????????
          props.setvisible(true)
          //??????????????????
          clearDatas('keepCreat')
        } else {
          if (state.addHandly) {
            props.setvisible(false, 1)
          }
          props.setvisible(false)
          cancelchecktype()
        }
        // okr ??????????????? kr?????????????????????????????????OKR???id,???????????????
        const supportsIds: any = []
        if (props.datas.from == 'taskdetailOkr') {
          param.supports?.map((item: any) => {
            supportsIds.push(item.mainParentId || item.mainId)
          })
        }

        refreshList({
          data: resData.data || {},
          optType: 'addTask',
          parentId: param.parentId,
          createType: props.datas.isCreate, //1?????????
          parentIdOld: iscreat == 1 ? supportParentOld : '',
          supportsIds,
        })
        // ??????????????????
        if (iscreat == 2)
          refreshChildTree &&
            refreshChildTree({ type: 1, operateId: param.parentId, newTask: resData.data || {} })
        // props.callbacks({ data: resData.data || {} })//????????????
      } else {
        message.error(resData.returnMessage)
        setLoading(false)
      }
    })
  }
  const getListType = (type: number) => {
    //??????????????????1?????????0?????????3?????????2
    let code = ''
    switch (type) {
      case 0:
        code = 'target_kanban'
        break
      case 1:
        code = 'temporary_work'
        break
      case 2:
        code = 'function_task'
        break
      case 3:
        code = 'working_team_task'
        break
    }
    return code
  }
  //??????
  const refreshList = ({
    data,
    optType,
    parentId,
    createType,
    parentIdOld,
    supportsIds,
  }: {
    data: any
    optType: string
    parentId?: any
    supportsIds?: any
    [propName: string]: any
  }) => {
    // if (iscreat == 1 && props.datas.from == 'workbench') {
    //   //?????????????????????
    //   props.callbacks({ data: data })
    // } else {
    //   props.callbacks({ data: data })
    // }
    props.callbacks(
      { data: data, optType, parentId, createType, parentIdOld, supportsIds },
      { code: getListType(state.taskForm) }
    )
    // if (state.taskForm === 0) {
    //   //??????????????????
    //   refreshDetails()
    // } else {
    moduleItemRefresh && moduleItemRefresh(getListType(state.taskForm))
    // }
  }
  //??????
  const handleCancel = () => {
    props.setvisible(false)
    cancelchecktype()
    // ??????????????????????????????????????????????????????
    if ((props.datas.from = 'taskManage' && usedStar.isHave)) {
      refreshListFn({
        optType: 'priorityStar',
        attachInfo: {
          priType: usedStar.priType,
          star: usedStar.star,
          ascriptionId: usedStar.ascriptionId,
          ascriptionType: usedStar.ascriptionType,
        },
      })
    }
  }
  const cancelchecktype = () => {
    //???????????????????????????
    const newArr = state.taskType
    newArr.forEach((item: any) => {
      if (item.type == '1') {
        item.val = 'active'
      } else {
        item.val = ''
      }
    })
  }
  //??????????????????
  const continueCreat = (e: any) => {
    setKeepCreat(e.target.checked)
  }
  //??????
  const remindCreat = (e: any) => {
    setRemindopen(e.target.checked)
  }
  /**
   * ??????????????????????????????????????????
   */
  const setTagByStatus = (item: globalInterface.WorkPlanTaskProps) => {
    return (
      <div className="tag-list">
        {item.property === 1 && (
          <Tag color={'#FAD1CE'} style={{ color: '#EA4335' }}>
            ???
          </Tag>
        )}
        {item.taskStatus === 3 && (
          <Tag color={'#FAD1CE'} style={{ color: '#EA4335' }}>
            ???
          </Tag>
        )}
        {(item.status === 2 || item.approvalStatus !== 0) && (
          <Tag color={'#FCECC5'} style={{ color: '#FBBC05' }}>
            ???
          </Tag>
        )}
        {item.taskFlag === 1 && <Tag color={'#CDCDCD'}>???</Tag>}
        {item.taskFlag === 3 && <Tag color={'#CDCDCD'}>??????</Tag>}
        {item.cycleNum === 0 && <Tag color={'#4285f4'}>???</Tag>}
        {item.cycleNum > 0 && (
          <Tag color={'#4285f4'} style={{ width: '22px' }}>
            ???{item.cycleNum}
          </Tag>
        )}
      </div>
    )
  }
  //??????????????????????????????
  const addiconContent = (nodeData: any) => {
    const day = nodeData.day
    const nodeText = nodeData.nodeText || ''
    let days = ''
    if (nodeData.type == 2 || nodeData.type == 3) {
      days = ' ??????'
    } else {
      if (nodeData.status == 4 || nodeData.status == 3) {
        //?????????????????? ??????????????????
        days = ' ??????'
      } else {
        days = ' ???'
      }
    }
    let colorControl = false
    if (nodeData.type == 2 || nodeData.type == 3 || nodeData.status != 1) {
      colorControl = true
    }
    return (
      <div className="taskTagListBox">
        <span
          className={`okr_affiliation ${colorControl ? 'getblue' : ''}`}
          style={{ display: 'inline-block' }}
        >
          <i className="nodeaffiliation"></i>
          {nodeText || '?'}
        </span>
        <span style={{ display: 'inline-block', minWidth: '150px' }} className="task_day">
          <DatePicker
            className="okr_startTime okr_four_time"
            style={{ width: nodeData.startTime ? '35px' : '10px' }}
            bordered={false}
            showNow={false}
            value={nodeData.startTime ? moment(new Date(nodeData.startTime), 'MM/DD') : undefined}
            format="MM/DD HH:mm"
            placeholder="?"
            allowClear={false}
            disabled={true}
            inputReadOnly={true}
          />
          <span>~</span>
          <DatePicker
            className="okr_endTime okr_four_time"
            bordered={false}
            showNow={false}
            value={moment(new Date(nodeData.endTime), 'MM/DD')}
            format="MM/DD HH:mm"
            placeholder="?"
            allowClear={false}
            showToday={false}
            inputReadOnly={true}
            disabled={true}
          />
          <span>
            {days}
            <span className="task_days getblue">{day}</span> <span>???</span>
          </span>
        </span>
      </div>
    )
  }
  const priorityIcon = $tools.asAssetsPath(`/images/common/number-${state.priority.data}.png`)
  const tagIcon = $tools.asAssetsPath(`/images/task/${state.tags.icon}.png`)
  const headDefIcon = $tools.asAssetsPath('/images/workplan/head_def.png')
  const teamheadDef: any = $tools.asAssetsPath('images/task/cmy-normal.png')
  // ??????????????????  ???????????????????????????????????????????????????????????????
  const updateReportList = (reportData: any) => {
    let newArr: any = []
    const isExist = reportList.filter((item: any) => {
      return item.id == reportData.id
    })

    if (isExist.length != 0) {
      reportList.forEach((item: any) => {
        item.id == reportData.id ? newArr.push(reportData) : newArr.push(item)
      })
    } else {
      newArr = [...reportList, reportData]
    }
    setReportList([...newArr])
  }

  // ????????????
  const delReport = (reportid: number, index: number) => {
    if (props.datas.isCreate === 1) {
      setLoading(true)
      delForce({
        id: reportid,
        operateUser: nowUserId,
        operateUserName: nowUser,
      }).then((res: any) => {
        setLoading(false)
        if (res.returnCode == 0) {
          message.success('???????????????')
          getForceReportList(props.datas.taskid)
        }
      })
    } else {
      const newArr = [...reportList]
      newArr.splice(index, 1)
      setReportList(newArr)
    }
  }
  /**
   * ?????????????????????
   */
  const editTaskPri = ({ taskItem, newData }: { taskItem: any; newData: any }) => {
    editTaskPriApi({
      taskId: taskItem.id,
      oldTaskId: newData.oldTaskId || '',
      star: newData.data || 0,
      successMsg: 'no',
    }).then((res: any) => {
      if (res.success) {
        // ???????????????????????????
        usedStar = {
          ...usedStar,
          isHave: true,
          star: newData.data || 0,
          priType: newData.type || 0,
          ascriptionId: state.affiliation.ascriptionId,
          ascriptionType: state.affiliation.ascriptionType,
        }
      }
    })
  }

  //???????????????????????????OKR
  const setsupportFn = (types: string) => {
    setsupportShow(true)
    const _disableList: any = []
    const _selectList: any = []
    if (types == 'task') {
      //??????????????????
      if (iseditParentforbid || $('.item-org.line').text() == '?????????') {
        setsupportShow(false)
        if ($('.item-org.line').text() == '?????????') {
          message.warning('??????????????????????????????')
        }
        return
      }
      if (support.content.length > 0) {
        support.selectList = support.selectList || []
        support.selectList.push(support.content[0].id)
      }
      setsupport({
        ...support,
        type: 0, //0???????????? 1??????OKR
      })
    } else {
      //???????????????OKR
      if (support.okrContent.length > 0) {
        support.okrContent.map((item: any, index: number) => {
          if (item.isExtends) {
            _disableList.push(item.id)
          } else {
            _selectList.push(item.id)
          }
        })
      }
      support.disableList = _disableList
      support.selectList = _selectList
      setsupport({
        ...support,
        type: 1, //0???????????? 1??????OKR
      })
    }
  }

  //?????????????????????OKR
  //data:?????????????????????
  const pushOkrContentFn = (vaule: any, data?: any) => {
    const json1 = vaule || []
    const json2 = [...support.okrContent]
    const json = json1.concat(json2)
    let newJson = []
    for (const item1 of json) {
      let flag = true
      for (const item2 of newJson) {
        if (item1.id == item2.id) {
          flag = false
        }
      }
      if (flag) {
        newJson.push(item1)
      }
    }
    if (data.length > 0) {
      //???????????????
      newJson = newJson.filter((item: any) => {
        const idList = data.map((v: any) => v.id)
        return !idList.includes(item.id)
      })
    }
    setsupport({ ...support, okrContent: newJson })
  }
  return (
    <Modal
      title={
        <div
          className="taskOrgCon"
          onClick={() => {
            selectUser('0')
          }}
        >
          <div className="line item-org">{state.affiliationText.split('???')[0]}</div>
          <div className="item-org select-org">{state.affiliationText.split('???')[1]}</div>
        </div>
      }
      visible={props.param.visible}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      keyboard={false}
      className="creatTaskModal"
      closeIcon={<span className="modal-close-icon"></span>}
      footer={
        <div className="creat-footer">
          <div className="footerLeft">
            {iscreat == 0 && (
              <Checkbox checked={keepCreat} onChange={continueCreat}>
                ??????????????????
              </Checkbox>
            )}
            {iscreat == 0 && (
              <Tooltip title="?????????????????????????????????????????????????????????">
                <span className="hints-continue"></span>
              </Tooltip>
            )}
            <Checkbox checked={remindopen} onChange={remindCreat}>
              ???????????????
            </Checkbox>
            <Select
              defaultValue="0????????????"
              value={state.remindTimesActive}
              style={{ width: 120 }}
              onChange={handleChange}
            >
              {state.remindTimes.map((item: any) => {
                return (
                  <Option value={item.type} key={item.type}>
                    {item.name}
                  </Option>
                )
              })}
            </Select>
          </div>
          <div className="button-wrap">
            <Button key="back" onClick={handleCancel}>
              ??????
            </Button>
            <Button key="submit" type="primary" onClick={handleOk}>
              {iscreat == 0 ? '??????' : '??????'}
            </Button>
          </div>
        </div>
      }
    >
      <Spin spinning={loading} tip={'???????????????????????????'}>
        <div className="task-content" ref={refComplete}>
          {/* ?????? */}
          <div className="task-row task-row-genre">
            <div className="task-icon"></div>
            <div className="task-item">
              <ul>
                {state.taskType.map((item: any, index: number) => {
                  return (
                    <li
                      key={index}
                      data-val={item.type}
                      className={`${item.val}`}
                      onClick={() => {
                        toggleTaskType(item.type)
                      }}
                    >
                      {item.name}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          {/* ?????????????????? */}
          <div
            className="task-row task-row-selectParent"
            style={{ display: props.datas.taskFlag == 2 ? 'none' : 'flex' }}
          >
            <div className="task-icon"></div>
            <div
              className="selectParent-content"
              onClick={() => {
                setsupportFn('task')
              }}
            >
              ??????????????????
              {support.content.length > 0 && (
                <span className={`selectParent-task ${support.content[0] == -1 ? 'hide' : ''}`}>
                  {support.content[0].name || ''}
                  <span
                    className={`del ${iseditParentforbid ? 'hide' : ''}`}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      if (iscreat == 1) {
                        //????????????????????????????????????????????????
                        findSupport(props.datas.taskid, '', false)
                      } else {
                        //????????????????????????
                        findSupport('', '', false)
                      }
                    }}
                  ></span>
                </span>
              )}
            </div>
          </div>

          {/* ????????????????????????????????? */}
          <div className="task-row task-row-names">
            <div className="task-icon"></div>
            <div className="task-item">
              {/* ?????? */}
              <div
                className="task-names"
                style={{ width: tagAndPriorHidden ? '767px' : '572px' }}
                // onClick={() => {
                //   clicktags()
                // }}
              >
                <Input
                  onChange={editName}
                  autoFocus
                  maxLength={100}
                  addonAfter={
                    !tagAndPriorHidden && (
                      <TaskTags
                        ref={gettags}
                        param={{
                          from: 'creatTask',
                          teamId: state.affiliation.teamId,
                        }}
                        datas={state.tags}
                        onOk={(datas: any) => {
                          dispatch({
                            type: 'tags',
                            data: datas,
                          })
                        }}
                      ></TaskTags>
                    )
                  }
                  placeholder="????????????????????????????????????????????????????????????"
                  value={state.taskName}
                />
              </div>
              {/* ????????? */}
              {props.datas.from != 'work-plan' && !tagAndPriorHidden && (
                <Dropdown
                  overlayClassName="selPriorityconetnt"
                  visible={priorityvis}
                  overlay={
                    <Priority
                      param={{
                        from: 'creatTask',
                        teamId: iscreat == 1 ? attachType.typeId : state.affiliation.teamId,
                        deptId: iscreat == 1 ? attachType.typeId : state.affiliation.deptId,
                        roleId: iscreat == 1 ? attachType.typeId : state.affiliation.roleId,
                        taskId: attachType.taskId,
                        initDatas: Priorityinit || 0, //????????????????????? 0?????????
                        ascriptionType: iscreat == 1 ? attachType.type : state.affiliation.ascriptionType,
                      }}
                      dropType="Dropdown"
                      visible={priorityvis}
                      onOk={(datas: any) => {
                        editTaskPri({ taskItem: { id: state.taskId }, newData: datas })
                        dispatch({
                          type: 'priority',
                          data: {
                            type: datas.type,
                            data: datas.data,
                          },
                        })
                        setPriorityvis(false)
                        setPriorityinit({
                          type: datas.type,
                          data: datas.data,
                        })
                      }}
                      setvisible={setPriorityvis}
                    ></Priority>
                  }
                  placement="bottomRight"
                  trigger={['click']}
                  onVisibleChange={(flag: boolean) => {
                    setPriorityvis(flag)
                  }}
                >
                  <div
                    className="taskPrioritySet"
                    onClick={(e: any) => {
                      e.preventDefault()
                      setPriorityvis(true)
                    }}
                  >
                    <div className="task_pri_show">
                      {state.priority.data == 0 && <span className="sel_show_txt tasknames-yxj">?????????</span>}
                      {state.priority.data != 0 && (
                        <span className="sel_show_txt">
                          {state.priority.type == 0 && <span>{state.priority.data}</span>}
                          {state.priority.type == 0 && <em className="img_icon star_icon"></em>}
                          {state.priority.type == 1 && (
                            <span>
                              <i
                                className="img_icon task_sign_icon num_priority_item"
                                // style={{
                                //   backgroundImage: `url(${priorityIcon})`,
                                // }}
                              >
                                <img
                                  src={priorityIcon}
                                  style={{
                                    width: '100%',
                                  }}
                                />
                              </i>
                            </span>
                          )}
                        </span>
                      )}
                      <em></em>
                    </div>
                  </div>
                </Dropdown>
              )}
              {/* ?????? */}
              {!tagAndPriorHidden && (
                <div className="task_prop" onClick={selProperty}>
                  <span>{state.private == 0 ? '??????' : '??????'}</span>
                  <em className={`${state.private == 0 ? 'public_prop' : 'private_prop'}`}></em>
                </div>
              )}
            </div>
          </div>
          {/* ?????? */}
          <div
            className={`task-row task-row-tags ${
              state.tags.icon == '' && state.tags.tags.length == 0 ? 'hide' : ''
            }`}
          >
            <div className="task-icon"></div>
            <div className="task-item">
              {state.tags.icon != '' && (
                <div className="sign_icon_box">
                  <div className="sign_item relative" data-imgname={state.tags.icon}>
                    {/* <span className="img_icon sign_icon" style={{ backgroundImage: `url(${tagIcon})` }}></span> */}
                    <img
                      src={tagIcon}
                      style={{
                        width: '100%',
                      }}
                    />
                    <em
                      className="img_icon del_icon"
                      onClick={() => {
                        delTags('icon', null)
                      }}
                    ></em>
                  </div>
                </div>
              )}
              <ul className="tag_list">
                {state.tags.tags.map((item: any) => {
                  return (
                    <li
                      key={item.id}
                      className="tag_item"
                      data-rgb={item.rgb}
                      style={{ backgroundColor: item.rgb }}
                    >
                      <span className="tag_name my_ellipsis">{item.name}</span>
                      <em
                        className="img_icon del_icon"
                        onClick={() => {
                          delTags('tages', item.id)
                        }}
                      ></em>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          {/* ???????????? */}
          <div className="task-row task-row-describe">
            <div className="task-icon"></div>
            <Editor
              editorContent={state.editorText}
              editorChange={editorChange}
              minHeight={70}
              height={70}
              className="createTaskEditor"
              previewArea=".createTaskEditor"
            />
          </div>
          {/* ??????????????????????????????????????????????????? */}
          <div className="task-row task-row-user">
            <div className="task-icon"></div>
            <div className="task-item">
              <div
                className={$c('task-designated', { notHover: tagAndPriorHidden })}
                onClick={() => {
                  if (!tagAndPriorHidden) {
                    selectUser('1')
                  }
                }}
              >
                <Avatar className="oa-avatar default-head-g" size={32}></Avatar>
                <div className={$c('designated-user')}>
                  <p className="color-b">{state.executorUser.userName}</p>
                  <p className="users-zx">?????????</p>
                </div>
              </div>
              <div
                className={$c('task-designated', { notHover: tagAndPriorHidden })}
                onClick={() => {
                  if (!tagAndPriorHidden) {
                    selectUser('2')
                  }
                }}
              >
                <Avatar className="oa-avatar default-head-b" size={32}></Avatar>
                <div className={$c('designated-user')}>
                  <p className="color-b">{state.assignUser.userName}</p>
                  <p>?????????</p>
                </div>
              </div>
              {!tagAndPriorHidden && (
                <>
                  <div
                    className="task-designated"
                    onClick={() => {
                      selectUser('3')
                    }}
                  >
                    <Avatar className="oa-avatar default-head-g" size={32}></Avatar>
                    <div className="designated-user">
                      <p className="color-b">{state.leadershipUser.userName || ''}</p>
                      <p className="users-ld">???????????????</p>
                    </div>
                  </div>
                  <div
                    className="task-designated"
                    onClick={() => {
                      selectUser('4')
                    }}
                  >
                    <Avatar className="oa-avatar default-head-b" size={32}></Avatar>
                    <div className="designated-user">
                      <p className="color-b">{state.superviseUser.userName || ''}</p>
                      <p>?????????</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* ?????????????????? */}
          <div className="task-row task-row-times">
            <div className="task-icon"></div>
            <div className="task-item">
              <div className="date-times">
                <DatePicker
                  showTime
                  placeholder="????????????"
                  format={'YYYY/MM/DD HH:mm'}
                  value={state.startTime ? moment(state.startTime) : null}
                  onChange={(value: any) => {
                    editTimes(value, 'startTime')
                  }}
                />
                <span className="line"></span>
                <DatePicker
                  showTime
                  className="tasknames-jz"
                  placeholder="????????????"
                  value={moment(state.endTime)}
                  allowClear={false}
                  format={'YYYY/MM/DD HH:mm'}
                  onChange={(value: any) => {
                    editTimes(value, 'endTime')
                  }}
                  // onOk={(value: any) => {
                  //   editTimes(value, 'endTime')
                  // }}
                />
              </div>
              <div className="loops">
                <span
                  className="loops-icon"
                  onClick={() => {
                    setOpenloop(true)
                  }}
                ></span>
                {state.cycleModel && (
                  <div className="loops-text">
                    {loopTaskListDataShow(state.cycleModel)}
                    <em
                      className="img_icon del_icon"
                      onClick={() => {
                        dispatch({
                          type: 'cycleModel',
                          data: {
                            flag: 1,
                          },
                        })
                      }}
                    ></em>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* ???????????? 20/12/30?????? ?????????????????????OKR*/}
          <div
            className="task-row support_okr"
            style={{ display: props.datas.taskFlag == 2 ? 'none' : 'flex' }}
          >
            <div className="task-icon"></div>
            <div className="support_okr_box">
              <div
                className="support_okr_handle"
                onClick={() => {
                  setsupportFn('okr')
                }}
              >
                ??????????????????OKR
              </div>
              {support.okrContent && support.okrContent.length > 0 && (
                <div className={`support_okr_list ${support.okrContent[0] == -1 ? 'hide' : ''}`}>
                  <ul>
                    {support.okrContent.map((item: any) => {
                      let okrTxt = ''
                      if ((item.type || item.workPlanType) == 2 || (item.type || item.workPlanType) == 3) {
                        okrTxt = item.type == 2 ? 'O' : 'KR'
                      }
                      const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
                      let userIcon = item.liableUserProfile
                      const userName = item.liableUsername ? item.liableUsername : ''
                      if (!item.liableUserProfile && !item.liableUsername) {
                        userIcon = headDef
                      }
                      return (
                        <li key={item.id}>
                          <Avatar className="oa-avatar Foleft" src={userIcon} size={32}>
                            {userName}
                          </Avatar>
                          <div className="support_okr_names Foleft">
                            <div>
                              <span className="okr_text">{okrTxt}</span>
                              <span className="support_okr_name">{item.name}</span>
                            </div>
                            <div className="support_okr_times">
                              {item.startTime || '/'} - {item.endTime || '/'}
                              <span className="remain_time_num">??????{item.day || 0}</span>
                              <span className="bule">???</span>
                            </div>
                          </div>
                          <div style={{ width: 36, textAlign: 'center' }} className="Foleft">
                            <Progress
                              strokeColor={'#4285f4'}
                              trailColor={'#e9f2ff'}
                              type={'circle'}
                              percent={item.progress ? item.progress.percent : ''}
                              width={32}
                              strokeWidth={12}
                            ></Progress>
                          </div>
                          <div
                            className={`del ${item.isExtends ? 'hide' : ''}`}
                            onClick={() => {
                              support.okrContent.splice(
                                support.okrContent.findIndex((items: any) => items.id === item.id),
                                1
                              )
                              setsupport({ ...support, okrContent: support.okrContent })
                            }}
                          >
                            <span></span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {/* ?????????????????? */}
          <div className="task-row task-row-checkEntry">
            <div className="task-icon reportset-icon"></div>
            <div className="task-item">
              <span
                className="checkEntry-text"
                onClick={() => {
                  const reportPerson: any[] = updatePersonData(state, 'executorUser', 0)
                  const assignUser = updatePersonData(state, 'assignUser', 1)
                  const leadershipUser = updatePersonData(state, 'leadershipUser', 1)
                  const receiverPerson: any[] = assignUser.concat(leadershipUser)
                  const copyPerson: any[] = updatePersonData(state, 'superviseUser', 2)
                  const teamConcatPerson: any[] = updatePersonData(state, 'enterprise', 3, 'teamconcat')
                  setOpenforceParam({
                    visible: true,
                    param: {
                      from: 'createTask', //??????
                      isdetail: 0, //??????????????? 1?????? 0?????? 2??????
                      taskid: props.datas.isCreate == 1 ? props.datas.taskid : 0, //??????id 0:????????????????????????????????????
                      reportid: '', //????????????id
                      createTime: '', //????????????
                      startTime: state.startTime, //????????????
                      endTime: state.endTime, //????????????
                      teamId: state.affiliation.teamId, //??????id
                      taskFlag: props.datas.taskFlag, //2???????????????
                      reportPerson: arrObjDuplicate(reportPerson, 'curId'), //???????????????
                      receiverPerson: arrObjDuplicate(receiverPerson, 'curId'), //??????????????????
                      copyPerson: arrObjDuplicate(copyPerson, 'curId'), //????????????
                      teamConcatPerson, //???????????????
                    },
                  })
                }}
              >
                ??????????????????
              </span>
            </div>
          </div>
          {/* ?????????????????? */}
          <div className="reportsList">
            <ul className="list-box">
              {reportList.map((item: any, index: number) => {
                let hasAuth = false
                if (props.datas.isCreate == 0 || props.datas.isCreate == 2 || item.hasDelete) {
                  hasAuth = true
                }
                return (
                  <li
                    className="reportsItem"
                    key={index}
                    onClick={() => {
                      if (hasAuth) {
                        const teamConcatPerson: any[] = updatePersonData(state, 'enterprise', 3, 'teamconcat')
                        setOpenforceParam({
                          visible: true,
                          param: {
                            from: 'createTask', //??????
                            isdetail: 2, //??????????????? 1?????? 0?????? 2??????
                            taskid: item.taskid, //??????id
                            reportid: item.id, //????????????id
                            createTime: '', //????????????
                            startTime: state.startTime, //????????????
                            endTime: state.endTime, //????????????
                            taskFlag: props.datas.taskFlag, //2???????????????
                            teamId: state.affiliation.teamId, //??????id
                            teamConcatPerson,
                          },
                        })
                      }
                    }}
                  >
                    <div className="left" style={{ maxWidth: '100%' }}>
                      <div className="text">{`${item.reporter.join('???')} ${
                        item.forceTime
                      } ??? ${item.receiver.join('???')} ??????`}</div>
                      {hasAuth && (
                        <em
                          className="img_icon del_icon"
                          onClick={(e: any) => {
                            e.stopPropagation()
                            // ????????????????????????
                            delReport(item.id, index)
                          }}
                        ></em>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
          {/* ?????????????????? */}
          {props.datas.from != 'work-plan' && (
            <div className="task-row task-row-takeCompany">
              <div className="task-icon"></div>
              <div className="task-item">
                <span
                  className="takeCompany-text "
                  onClick={() => {
                    setEnterpriseShow(true)
                    setIseditenterprise(false)
                    setenterpriseinfo({
                      teamid: '',
                      userId: '',
                      teamName: '',
                    })
                  }}
                >
                  ??????????????????
                </span>
                <div className="takeCompanyBox">
                  <ul>
                    {state.enterprise.map((item: any, index: number) => {
                      if (iscreat == 1 || iscreat == 2) {
                        //?????????????????????????????? ?????? ??????
                        const status = item.status || 0
                        let againInvite = 'disable'
                        let statusTxt = '',
                          statusClass = ''
                        if (status == 0) {
                          statusTxt = '?????????'
                          statusClass = 'wait'
                        } else if (status == 2) {
                          statusTxt = '?????????'
                          statusClass = 'joined'
                        } else if (status == 1) {
                          statusTxt = '?????????'
                          statusClass = 'refuse'
                          againInvite = ''
                        }
                        return (
                          <li className="joinCmyItem" key={index}>
                            <div className="joinCmyLeft">
                              <div className="avatars">
                                <Avatar
                                  size={32}
                                  src={item.profile || teamheadDef}
                                  className={`${!item.profile && 'noPortrait'}`}
                                />
                              </div>
                              <div className="text">
                                <p className="joinCmyLeft_names">{item.name}</p>
                                <p className="cmy_info_name_box ">
                                  <span className="cmy_info_name ">?????????:{item.username}</span>
                                  <span className={`join_cmy_status ${statusClass}`}>{statusTxt}</span>
                                </p>
                              </div>
                            </div>
                            <div className="joinCmyRig">
                              <span
                                className={`img_icon del_cmy_icon ${status == 0 ? '' : 'hide'}`}
                                onClick={() => {
                                  setEnterprise([], item.id)
                                }}
                              ></span>
                              <div className="more_opt_box relative">
                                {item.isExtends == 0 && (
                                  <Dropdown
                                    overlay={
                                      <ul className="optBtnMenu more_opt_options">
                                        <li
                                          className="optBtnItem"
                                          onClick={() => {
                                            setEnterpriseShow(true)
                                            setIseditenterprise(true)
                                            setEnterpriseid(item.id)
                                            setenterpriseinfo({
                                              teamid: item.id,
                                              userId: item.userId,
                                              teamName: item.name,
                                            })
                                          }}
                                        >
                                          <em className="img_icon menu_icon edit_member_icon"></em>
                                          <span>???????????????</span>
                                        </li>
                                        <li
                                          className={`optBtnItem ${againInvite}`}
                                          onClick={() => {
                                            inviteAgain(item.id, item.userId)
                                          }}
                                        >
                                          <em className="img_icon menu_icon again_invite_icon"></em>
                                          <span>????????????</span>
                                        </li>
                                        <li
                                          className="optBtnItem"
                                          onClick={() => {
                                            setEnterprise([], item.id)
                                          }}
                                        >
                                          <em className="img_icon menu_icon del_icon"></em>
                                          <span>??????</span>
                                        </li>
                                      </ul>
                                    }
                                    trigger={['click']}
                                  >
                                    <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                                      <span className="img_icon more_opt_icon" onClick={() => {}}></span>
                                    </a>
                                  </Dropdown>
                                )}
                              </div>
                            </div>
                          </li>
                        )
                      } else {
                        //????????????????????????
                        return (
                          <li className="joinCmyItem" key={index}>
                            <div className="joinCmyLeft">
                              <div className="avatars">
                                <Avatar size={32} src={item.profile || teamheadDef} />
                              </div>
                              <div className="text">
                                <p>{item.name}</p>
                                <p className="cmy_info_name_box ">
                                  <span className="cmy_info_name ">?????????:{item.username}</span>
                                  <span className="join_cmy_status wait">?????????</span>
                                </p>
                              </div>
                            </div>
                            <div className="joinCmyRig">
                              <span
                                className="img_icon del_cmy_icon"
                                onClick={() => {
                                  setEnterprise([], item.id)
                                }}
                              ></span>
                            </div>
                          </li>
                        )
                      }
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {/* ???????????? */}
          {state.addHandly && (
            <div className="task-row task-row-addHandly hide">
              <div
                className="task-item"
                onClick={e => {
                  e.stopPropagation()
                  setvisibleShow(true)
                }}
              >
                <div className="task-icon"></div>
                <span className="addHandly-text">????????????</span>

                <div className="task-list part-okr-quadrant ant-table-row">
                  {state.addHandly.type == 2 && <span className="isokr O_okr">O</span>}
                  {state.addHandly.type == 3 && <span className="isokr KR_okr">KR</span>}
                  <div className="okr_text_content ant-table-cell" data-type="2" data-name="????????????">
                    <div className="node_portrait_main">
                      <Avatar
                        size={34}
                        src={
                          state.addHandly.liableUsername ? state.addHandly.liableUserProfile || '' : headDefIcon
                        }
                        style={{
                          color: '#fff',
                          backgroundColor:
                            state.addHandly.type == 2 ||
                            state.addHandly.type == 3 ||
                            state.addHandly.status != 1
                              ? '#4285f4'
                              : '#777777',
                        }}
                      >
                        {' '}
                        {state.addHandly.liableUsername ? state.addHandly.liableUsername.substr(-2, 2) : ''}
                      </Avatar>
                    </div>
                    <div className="okr_text_Box text_Box_okr" data-container="body">
                      <div className={$c('task-list-item', { finishedTask: state.addHandly.status === 2 })}>
                        <span className="okr_task_name" style={{ color: ' #4285F4', maxWidth: '300px' }}>
                          {state.addHandly.name || ''}
                        </span>
                        {(state.addHandly.type == 4 || state.addHandly.type == 41) &&
                          state.addHandly.taskFlag != 0 && (
                            <span className="specail-show specail-show-coor"></span>
                          )}
                        {(state.addHandly.type == 4 || state.addHandly.type == 41) &&
                          state.addHandly.taskFlag == 0 && (
                            <span className="specail-show specail-show-isdialogue"></span>
                          )}
                        {state.addHandly.type != 2 &&
                          state.addHandly.type != 3 &&
                          setTagByStatus(state.addHandly)}
                      </div>

                      <div className="tagList-content">{addiconContent(state.addHandly)}</div>
                    </div>
                    <div style={{ width: 32, textAlign: 'center' }} className="row_progress">
                      <Progress
                        strokeColor={'#4285f4'}
                        trailColor={'#e9f2ff'}
                        type={'circle'}
                        percent={state.addHandly.process}
                        width={32}
                        strokeWidth={12}
                      ></Progress>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ??????????????? */}
          {!tagAndPriorHidden && (
            <div className="task-row task-row-checkEntry">
              <div className="task-item">
                <span
                  className="checkEntry-text"
                  onClick={() => {
                    setInitcheck(() => {
                      return { ...initcheck, init: true }
                    })
                    checkEntryRef.current && checkEntryRef.current.addCheckList()
                    // setTime(Date.parse(new Date().toString()))
                  }}
                >
                  <span className="task-icon"></span>???????????????
                </span>
                {/* {initcheck.init && ( */}
                <CheckEntry
                  ref={checkEntryRef}
                  initRefresh={initcheck}
                  times={time}
                  param={{
                    from: 'creatTask',
                    isedit: true,
                    taskid: props.datas.taskid,
                    teamId: state.affiliation.teamId,
                    initData: state.checkList, //???????????????
                    iseditCheck: true, //???????????????????????????
                    isshowNoneData: false, //??????????????????????????????
                  }}
                  getDatas={(datas: any, enterType?: string, farid?: any) => {
                    dispatch({
                      type: 'checkList',
                      data: [...datas],
                    })
                  }}
                  setInitRefresh={() => {
                    setInitcheck({ ...initcheck, init: true, refreshType: 'init', enterType: '', farid: '' })
                  }}
                ></CheckEntry>
                {/* )} */}
              </div>
            </div>
          )}

          {/* ???????????? */}
          <div className="task-row task-row-files">
            <div className="task-icon" style={{ marginTop: '0' }}></div>
            <div className="task-item">
              {/* <UploadFile
                fileModels={fileModeles}
                fileChange={fileListRes => {
                  setFileUserList(fileListRes)
                }}
                showUploadList={true}
                dir="task"
                showText="????????????"
                showIcon={false}
                windowfrom={`${props.datas.from == 'work-plan' ? 'workplanMind' : 'mainWin'}`}
              /> */}
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setUploadVisible(true)
                  setLoadTime(new Date().getTime())
                }}
              >
                ????????????
              </span>
              <RenderUplodFile
                visible={uploadVisible}
                leftDown={true}
                canDel={true}
                filelist={newFileList || []}
                teamId={state.affiliation.cmyId || state.affiliation.teamId}
                fileId={pageUuid}
                defaultFiles={defaultFiles || []}
                setVsible={state => setUploadVisible(state)}
                loadTime={loadTime}
                fileChange={(list: any, delGuid?: string) => {
                  if (delGuid !== '') {
                    const files = defaultFiles.filter((item: any) => item.fileGUID !== delGuid)
                    setDefaultFiles(files)
                    const delInfo = [...delFileIds]
                    delInfo.push(delGuid)
                    setDelFileIds(delInfo)
                  }
                  setNewFileList(list)
                }}
              />
            </div>
          </div>
        </div>
      </Spin>
      {/* ???????????? */}
      {memberOrgShow && (
        <SelectMemberOrg
          param={{
            visible: memberOrgShow,
            ...selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
            // ????????????
            // onSure: selMemberSure,
          }}
        />
      )}
      {/* ?????????????????? */}
      {enterpriseShow && (
        <ParticipateEnterprise
          param={
            iscreat == 1 || iscreat == 2
              ? {
                  visible: enterpriseShow,
                  orgId: iseditenterprise ? enterpriseid : '', //????????????
                  orignodeUsers: iseditenterprise && enterpriseinfo, //?????????????????????????????????
                  typeframe: iseditenterprise ? 'Radio' : 'Checkbox',
                  notOrgIds: iseditenterprise ? [enterpriseid] : [state.affiliation.teamId], //????????????
                  selectUserlist: state.enterprise || [], //???????????????
                }
              : {
                  visible: enterpriseShow,
                  orgId: '',
                  orignodeUsers: '', //???????????????????????????
                  typeframe: 'Checkbox',
                  notOrgIds: [state.affiliation.teamId],
                  selectUserlist: state.enterprise || [],
                }
          }
          action={{
            visible: (val: any) => {
              setEnterpriseShow(val)
            },
            onOk: (datas: any) => {
              setEnterprise(datas, '')
            },
          }}
        ></ParticipateEnterprise>
      )}
      {/* ???????????? */}
      {openloop && (
        <LoopsTask
          param={{
            visible: openloop,
            initdatas: state.cycleModel,
          }}
          action={{
            setModalShow: setOpenloop,
            onOk: (datas: any) => {
              dispatch({
                type: 'cycleModel',
                data: datas,
              })
            },
          }}
        ></LoopsTask>
      )}
      {/* ?????????????????? */}
      {visibleShow && (
        <AddHandModel
          param={{
            visible: visibleShow,
            mainId: props.datas.addHandly.mainId,
            id: props.datas.addHandly.id,
            typeId: props.datas.addHandly.typeId,
            type: state.taskForm,
            nowId: state.addHandly.id,
          }}
          action={{
            setModalShow: setvisibleShow,
            // ????????????
            onSure: setAddHandlySure,
          }}
        ></AddHandModel>
      )}
      {/* ?????????????????????????????????okr */}
      {supportShow && (
        <SupportModal
          param={{
            visible: supportShow,
            allowTeamId: [state.affiliation.teamId], //?????????????????????id
            contentType: support.type == 0 ? 'task' : 'okr',
            checkboxType: support.type == 0 ? 'radio' : 'checkbox',
            disabTaskId: [props.datas.taskid], //???????????????????????????????????????id[??????????????????????????????????????????]
            isshowKR: true, //????????????KR
            disableList: support.disableList || [], //??????
            selectList: support.selectList || [], //??????
            showType: 1, //1????????????????????????2???????????????????????????
          }}
          action={{
            setModalShow: setsupportShow,
            onSure: (vaule: any, data?: any) => {
              if (support.type == 0) {
                setsupport({ ...support, content: vaule })
                let taskParentArr: any = vaule.concat(support.content)
                taskParentArr = taskParentArr.length > 0 ? taskParentArr[0].id : ''
                if (iscreat == 1) {
                  //????????????????????????????????????????????????
                  findSupport(props.datas.taskid, taskParentArr, false)
                } else {
                  //????????????????????????
                  findSupport('', taskParentArr, false)
                }
              } else {
                pushOkrContentFn(vaule, data)
              }
            },
          }}
        />
      )}
      {/* ???????????? */}
      {openforceParam.visible && (
        <Forcereport
          visible={openforceParam.visible}
          datas={{
            ...openforceParam.param,
          }}
          setModalShow={(status: boolean, reportData?: any) => {
            setOpenforceParam({ ...openforceParam, visible: status })
          }}
          getReports={(reportData: any) => {
            if (props.datas.isCreate == 0 || props.datas.isCreate == 2) {
              updateReportList(reportData)
            }
          }}
          updateReportId={(id: any) => {
            if (props.datas.isCreate == 1) {
              setUpdateReportIds([...updateReportIds, id])
            }
          }}
          onOk={(datas: any) => {
            if (props.datas.isCreate == 1) {
              getForceReportList(props.datas.taskid)
            }
          }}
        ></Forcereport>
      )}
    </Modal>
  )
}
export default CreatTask

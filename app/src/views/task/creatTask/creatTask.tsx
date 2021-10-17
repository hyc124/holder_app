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
// 是否占用星级
let usedStar: any = {
  star: 0,
  isHave: false,
}
// 组装汇报设置所需数据 teamconcat:企业联系人
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
        // codeList: [`${obj[arrKey].teamName}-企业联系人`],
        codeList: [`企业联系人`],
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
      name: '目标任务',
      val: '',
    },
    {
      type: 1,
      name: '临时任务',
      val: 'active',
    },
    {
      type: 2,
      name: '职能任务',
      val: '',
    },
    {
      type: 3,
      name: '项目任务',
      val: '',
    },
  ],
  remindTimes: [
    { type: 1, name: '0分钟提醒' },
    { type: 2, name: '5分钟提醒' },
    { type: 3, name: '15分钟提醒' },
    { type: 4, name: '30分钟提醒' },
    { type: 5, name: '1小时提醒' },
    { type: 6, name: '12小时提醒' },
    { type: 7, name: '1天提醒' },
    { type: 8, name: '1周提醒' },
  ],
  taskId: '', //任务ID
  taskName: '', //任务名称
  editorText: '', //任务描述
  tags: {
    //标签
    icon: '',
    tags: [],
  },
  taskForm: 1, //任务类型临时1、目标0、项目3、职能2
  nowType: 0, // 任务创建类型0个人任务 2企业任务 3部门任务
  private: 0, //0公开 1私密
  startTime: '', //开始时间
  endTime: '', //结束时间
  priority: {
    //优先级
    type: '',
    data: 0,
  },
  cycleModel: {}, //循环任务
  checkList: [], //检查项
  correlationUserList: [], //指派人、执行人、领导责任人、督办人
  remindTimesActive: 1, //提醒时间
  nameData: [], //表头设置相关字段
  affiliation: {
    //归属信息(更改任务归属的时不选择到人 无需更改执行人 否则需要更改执行人)
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
  affiliationText: '', //归属信息文本内容
  executorUser: {
    //执行人
    userId: '',
    userAccount: '',
    userName: '',
    deptId: '',
    deptName: '',
    roleId: '',
    roleName: '',
  },
  assignUser: {}, //指派人
  leadershipUser: {}, //领导责任人
  superviseUser: {}, //督办人
  enterprise: [], //参与企业
}

// state初始化initStates参数 action为dispatch传参
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
// 创建子任务时存取的父级任务归属
let parentBelong: any = {}
// 缓存支撑父任务的id
let supportParentOld = ''
//**************************创建任务**************************//
const CreatTask = (props: any) => {
  const { nowUserId, nowAccount, nowUser, selectTeamId } = $store.getState()
  const [state, dispatch] = useReducer(reducer, initStates)
  //添加检查项
  const [initcheck, setInitcheck] = useState({
    init: false,
    refreshType: '',
    enterType: '', //是否是enter新增
    farid: '', //enter新增子节点时父节点id
  })
  //添加检查项默认添加传当前时间戳
  const [time, setTime] = useState<any>()
  //选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //选择父级任务及选择支撑okr
  const [supportShow, setsupportShow] = useState(false)
  const [support, setsupport] = useState<any>({
    content: [],
    iscontentEdit: false,
    isokrContentEdit: false,
    okrContent: [],
    type: 0, //0选择任务 1选择OKR
    selectList: [],
    disableList: [],
    isEdit: false,
  })
  //是否禁止新增删除父级任务(新增子任务时候不能删除 父级任务 及父级任务支撑的OKR)
  const [iseditParentforbid, setiSeditParentforbid] = useState(false)
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState({})
  //选择成员类型
  const [selectusertype, setSelectusertype] = useState()
  //优先级显示隐藏
  const [priorityvis, setPriorityvis] = useState(false)
  //默认优先级
  const [Priorityinit, setPriorityinit] = useState<any>({
    type: '',
    data: 0,
  })
  //参与企业
  const [enterpriseShow, setEnterpriseShow] = useState(false)
  //点击修改企业联系人 企业ID
  const [enterpriseid, setEnterpriseid] = useState('')
  //是否是修改企业联系人
  const [iseditenterprise, setIseditenterprise] = useState(false)
  //点击修改企业联系人 企业及个人信息
  const [enterpriseinfo, setenterpriseinfo] = useState<any>({
    teamid: '',
    userId: '',
    teamName: '',
  })
  //加载
  const [loading, setLoading] = useState(false)
  //0创建/1编辑任务/2创建子任务
  const [iscreat, setIscreat] = useState<any>()
  //是否展示初始化检查项数据
  const [ischeckData, setIscheckData] = useState(true)
  //是否继续创建任务
  const [keepCreat, setKeepCreat] = useState(false)
  //是否打开提醒时间
  const [remindopen, setRemindopen] = useState(false)
  //打开循环组件
  const [openloop, setOpenloop] = useState(false)
  //打开目标任务支撑
  const [visibleShow, setvisibleShow] = useState(false)
  const refComplete = useRef(null)
  //检查项
  const checkEntryRef = useRef<any>({})
  //创建子任务可选归属企业
  const [subset, setSubset] = useState([])
  // 上传的文件列表数据
  const [fileUserList, setFileUserList] = useState<Array<any>>([])
  //详情
  const [taskDetalis, settaskDetalis] = useState<any>()
  //创建子任务默认带出父级参与企业集合
  const [partenterprise, setPartenterprise] = useState<any>()
  // 是否加入该企业，显示隐藏标签，优先级等控制
  const [tagAndPriorHidden, setTagAndPriorHidden] = useState(false)
  //编辑任务任务类型（0，2，31）
  const [attachType, setattachType] = useState<any>({
    type: 0,
    typeId: 0,
    taskId: 0,
  })
  //缓存强制参数
  const [openforceParam, setOpenforceParam] = useState({
    visible: false,
    param: {},
  })
  //缓存编辑状态更新汇报id集合
  const [updateReportIds, setUpdateReportIds] = useState<any>([])
  // 强制汇报列表
  const [reportList, setReportList] = useState<any[]>([])
  /**
   *  props:
   *  from: '', //来源
   *  isCreate: 0, //创建0 编辑1 创建子任务2
   *  taskId: 任务id(isCreate = 1/2 有值)
   *  nowType: 0, //0个人任务 2企业任务 3部门任务
   *  teaminfo: selTeamItem, //企业信息
   *  taskmanageData: 企业管理相关数据(tree数据 是否为我的任务)
   */

  //新版附件需要的参数
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')
  const [defaultFiles, setDefaultFiles] = useState<Array<any>>([])
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])

  useEffect(() => {
    usedStar.isHave = false
    //查询企业列表
    init(props)
    setPageUuid(Maths.uuid())
  }, [])
  //dom更新完后
  useLayoutEffect(() => {
    //设置表头相关字段
    setHeaderName(state.nameData)
  }, [state.nameData])
  // 获取任务汇报列表
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
   * 获取参与企业联系人和加入的企业
   */
  const getTeamsInfo = (teamList: any) => {
    // 加入的企业
    const joinTeams: any = [],
      joinTeamIds: any = []
    // 参与企业联系人
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
   * 获取参与企业联系人和加入的企业
   */
  const getIsJoin = (teamList: any, findTeamId: string) => {
    // 是否在所查询企业
    const findItem = teamList.filter((item: any) => item.teamId == findTeamId)
    return findItem[0] ? findItem[0].isJoin : false
  }

  //初始化方法
  const init = (props: any) => {
    setiSeditParentforbid(false)
    const _from = props.datas.from
    setIscreat(props.datas.isCreate)
    if (props.datas.isCreate == 0) {
      //创建-------------------------
      //初始化检查项
      dispatch({ type: 'checkList', data: [] })
      if (_from == 'workbench' || _from == 'taskManage_my') {
        //工作台及任务管理我的任务
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
          //任务管理
          const taskmanageOrg = props.datas.taskmanageData.orgInfo
          let deptIds = ''
          if (taskmanageOrg.curType == 2 || taskmanageOrg.curType == 3) {
            if (taskmanageOrg.curType == 2) {
              deptIds = taskmanageOrg.cmyId
            } else if (taskmanageOrg.curType == 3) {
              deptIds = taskmanageOrg.curId
            }
            //查询主岗
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
            //设置任务属性
            setTaskAttrVal(setData, 'init')
          }
        }
      }
    } else if (props.datas.isCreate == 1) {
      //编辑-----------------------
      setLoading(true)
      const param = {
        id: props.datas.taskid,
        userId: nowUserId,
      }
      queryTaskDetailApi(param).then((resData: any) => {
        const getData = resData.data || {}
        let details = {}
        if (resData.data) {
          // 新版数据结构
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
      // 编辑状态 查询强制汇报列数
      getForceReportList(props.datas.taskid)
    } else {
      //创建子任务 --------------------
      //查询主岗相关信息及参与企业
      findExtendsTeam(props.datas.taskdata.id)

      // kr详情 创建子任务默认支撑当前kr
      if (props.datas.from == 'taskdetailOkr') {
        // props.datas.taskdata.isExtends = true
        //是否禁止
        setiSeditParentforbid(true)
        // const newParentIdArr = []
        // let newOkrContent: any = datas.supports || []
        // if (datas.parentId) {
        //   newParentIdArr.push({ id: datas.parentId, name: datas.parentTaskName })
        // }
        //保留界面手动选择的支撑(判断是否有key值)
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
          type: 1, //0选择任务 1选择OKR
          isEdit: false,
        })
        return
      }

      //查询父级任务及关联的OKR列表
      findSupport('', props.datas.taskdata.id, true)
    }
  }
  //设置默认截至时间
  const setEndtime = (teamid: any) => {
    //设置默认时间
    const end = new Date().getTime() + 24 * 60 * 60 * 1000
    const param = {
      teamInfoId: teamid,
    }
    getWorkHoursApi(param).then((resData: any) => {
      const initend = moment(end).format(`YYYY/MM/DD ${resData.data.pmEnd}`)
      dispatch({ type: 'endTime', data: initend })
      if (props.datas.isCreate == 2) {
        //创建子任务  1.如果主任务截至时间小于明天下班时间 跟随主任务时间  2.如果主任务截至时间大于明天下班时间 默认时间是明天下班时间

        if (props.datas.taskdata.endTime < initend) {
          dispatch({ type: 'endTime', data: props.datas.taskdata.endTime })
        }
      } else if (props.datas.addHandly && props.datas.endTime) {
        dispatch({ type: 'endTime', data: props.datas.endTime })
      }
    })
  }
  //设置数据
  const setdetailData = (details: any) => {
    //任务Id
    dispatch({ type: 'taskId', data: details.id })
    //任务名称
    dispatch({ type: 'taskName', data: details.name })
    //任务描述
    dispatch({ type: 'editorText', data: details.description })
    // 开始结束时间
    dispatch({ type: 'startTime', data: details.startTime })
    dispatch({ type: 'endTime', data: details.endTime })
    //设置父级及支撑OKR
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
      type: 0, //0选择任务 1选择OKR
      isEdit: details.parentId ? true : false,
    })
    //附件
    setFileUserList(details.fileModels || [])
    fileModeles = details.fileModels || []
    setDefaultFiles(details.fileReturnModels || [])
    setDelFileIds([])
    //优先级
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
    // 任务标签
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
    //私密公开
    dispatch({ type: 'private', data: details.property })
    //任务类型
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
    //任务归属
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
    //设置循环
    dispatch({
      type: 'cycleModel',
      data: details.cycleModel,
    })
    //任务类型 0个人任务 2企业任务 3部门任务
    dispatch({ type: 'nowType', data: details.attach?.type })
    //归属文本
    let belongShow = ''
    if (details.attach?.type == 0) {
      belongShow = `岗位级，归属于${details.attach?.typeName || ''}`
    } else if (details.attach?.type == 3) {
      belongShow = `部门级，归属于${details.attach?.typeName || ''}`
    } else if (details.attach?.type == 2) {
      belongShow = `企业级，归属于${details.attach?.typeName || ''}`
    }
    dispatch({
      type: 'affiliationText',
      data: belongShow,
    })
    //执行人
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
    //提醒时间
    dispatch({
      type: 'remindTimesActive',
      data: details.reminder || 1,
    })
    //设置勾选
    setRemindopen(details.reminder == 0 ? false : true)
    //指派人
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
    //领导责任人
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
    //督办人
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
    //参与企业
    const enterpriseArr: any = []
    if (details.teamList) {
      details.teamList.map((item: any) => {
        enterpriseArr.push({
          id: item.teamId,
          name: item.teamName,
          userId: item.userId,
          username: item.username,
          isExtends: item.isExtends, //是否可以编辑和删除 1:可编辑和删除
          status: item.status,
          profile: item.teamLogo,
        })
      })
    }
    dispatch({ type: 'enterprise', data: enterpriseArr })
    //检查项
    dispatch({ type: 'checkList', data: details.checkList || [] })
    //获取表头设置相关字段
    headerSettingsList(details.ascriptionId)
    setInitcheck({ ...initcheck, init: true, refreshType: 'init' })
    setLoading(false)
  }
  //获取表头配置 获取相关任务名称
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
  //查询企业列表
  const findAllCompany = () => {
    const param = {
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }
    //获取第一个企业信息作为归属信息
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
      //查询主岗
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
  //创建子任务设置相关信息及参与企业
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
      //设置任务属性及参与企业
      setTaskAttrVal(setData, 'init')
      const subArr: any = []
      const enterpriseArr: any = []
      resDatalist.map((item: any) => {
        subArr.push(item.teamId)
        //排除归属显示的企业(归属及参与企业 数据不能重复显示)
        if (resDatas.teamId != item.teamId) {
          enterpriseArr.push({
            id: item.teamId,
            name: item.teamName,
            userId: item.userId,
            username: item.username,
            isExtends: item.isExtends, //是否可以编辑和删除 1:可编辑和删除
            status: item.status,
            profile: item.teamLogo,
          })
        }
      })
      dispatch({ type: 'enterprise', data: enterpriseArr })
      setSubset(subArr) //创建子任务可选归属企业范围
    })
    dispatch({ type: 'taskForm', data: props.datas.taskdata.type }) //职能 临时 项目 目标
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
   * //查询父级任务及关联OKR列表
   * @param taskid 查询当前任务的相关信息（编辑）
   * @param parentId 查询父级任务的信息
   * @param isforbid 是否禁止操作选择父级任务按钮及删除
   */
  const findSupport = (taskid: any, parentId: any, isforbid: boolean) => {
    const param = {
      taskId: taskid || undefined,
      parentId: parentId,
    }
    findSupportApi(param).then((resData: any) => {
      //设置父级及支撑OKR
      const datas = resData.data
      if (datas) {
        //是否禁止
        setiSeditParentforbid(isforbid)
        const newParentIdArr = []
        const newOkrContent: any = datas.supports || []
        if (datas.parentId) {
          newParentIdArr.push({ id: datas.parentId, name: datas.parentTaskName })
        }
        //保留界面手动选择的支撑(判断是否有key值)
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
          type: 0, //0选择任务 1选择OKR
          isEdit: support.isEdit,
        })
      }
    })
  }
  //查询主岗部门
  const mainDuty = (firstCmy: any, deptId: any) => {
    // deptId不传的时候，查询出来的是登录人的信息，传了的时候查询的是企业或部门负责人的信息
    const param = {
      account: nowAccount,
      teamId: firstCmy.teamId,
      deptId: deptId,
      isCreate: props.datas.isCreate, //创建0 编辑1
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
      //设置任务属性
      setTaskAttrVal(setData, 'init')
    })
  }
  //清除相关信息
  const clearDatas = (types: string) => {
    //清除检查项
    setTime('0')
    dispatch({
      type: 'checkList',
      data: [],
    })
    //清除优先级
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
    //清除标签
    dispatch({
      type: 'tags',
      data: {
        icon: '',
        tags: [],
      },
    })
    //清除私密公开
    dispatch({
      type: 'private',
      data: 0,
    })
    //继续创建任务 ---------------
    if (types == 'keepCreat') {
      //参与企业
      dispatch({ type: 'enterprise', data: [] })
      //领导责任人
      dispatch({ type: 'leadershipUser', data: {} })
      //督办人
      dispatch({ type: 'superviseUser', data: {} })
      //提醒时间
      dispatch({ type: 'remindTimesActive', data: 1 })
      //0公开 1私密
      dispatch({ type: 'private', data: 0 })
      //开始时间
      dispatch({ type: 'startTime', data: '' })
      //结束时间
      // const end = new Date().getTime() + 24 * 60 * 60 * 1000
      // const initend = moment(end).format('YYYY/MM/DD 18:00')
      // dispatch({ type: 'endTime', data: initend })
      setEndtime(state.affiliation.teamId)
      //任务名称
      dispatch({ type: 'taskName', data: '' })
      //任务描述
      dispatch({ type: 'editorText', data: '' })
      setKeepCreat(false)
      //附件
      setFileUserList([])
      fileModeles = []
      setDefaultFiles([])
      setDelFileIds([])
      //父级任务及支撑OKR
      setsupport({
        content: [],
        okrContent: [],
        iscontentEdit: false,
        isokrContentEdit: false,
        type: 0, //0选择任务 1选择OKR
        isEdit: false,
      })
      setReportList([])
    }
  }
  //绑定任务归属信息
  const setTaskAttrVal = (setData: any, types: any) => {
    if (types == 'init') {
      //获取表头配置
      headerSettingsList(setData.teamId)
      //设置任务截至时间
      setEndtime(setData.teamId)
      //更新任务类型个人 部门 企业
      dispatch({
        type: 'nowType',
        data: props.datas.nowType,
      })
      //初始化 ----------------------------------------
      dispatch({
        //设置任务归属信息
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
      //执行人默认为登陆人
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
      //指派人默认为登陆人
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
      //选择之后重置 ----------------------------------------
      if (
        types == 'assignUser' ||
        types == 'leadershipUser' ||
        types == 'superviseUser' ||
        types == 'executorUser'
      ) {
        //执行人 指派人、领导责任人、督办人 -----------------------
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
          //草稿任务没有选择人员的时候 归属由-1变为0
          if (types == 'executorUser' && state.nowType == -1) {
            //更新任务类型为个人
            dispatch({
              type: 'nowType',
              data: 0,
            })
          }
        }
      } else if (types == 'affiliation') {
        //更改归属 -----------------------
        setEndtime(setData.teamId)
        dispatch({
          //设置任务归属信息
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
        //更新任务类型个人 部门 企业
        dispatch({
          type: 'nowType',
          data: setData.ascriptionType,
        })
        //更换企业之后需要清除领导责任人和督办人 指派人为当前登录人
        if (state.affiliation.teamId != setData.teamId) {
          const arr = ['leadershipUser', 'superviseUser']
          for (let i = 0; i < arr.length; i++) {
            dispatch({
              type: arr[i],
              data: {},
            })
          }
          // 指派人为当前登录人
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
        // 选择到人执行人同步
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
      //创建子任务更改归属或执行人时需要同步按需显示 参与企业(互斥关系)
      if (iscreat == 2 && (types == 'affiliation' || types == 'executorUser')) {
        const enterpriseArr: any = []
        partenterprise.map((item: any) => {
          //排除归属显示的企业(归属及参与企业 数据不能重复显示)
          if (setData.teamId != item.teamId) {
            enterpriseArr.push({
              id: item.teamId,
              name: item.teamName,
              userId: item.userId,
              username: item.username,
              isExtends: item.isExtends, //是否可以编辑和删除 1:可编辑和删除
              status: item.status,
              profile: item.teamLogo,
            })
          }
        })
        dispatch({ type: 'enterprise', data: enterpriseArr })
      }
    }
    //初始化及选择执行人及选择归属更改归属文本111
    if (types == 'init' || types == 'executorUser' || types == 'affiliation') {
      //设置归属信息文本显示
      const nowTypes = types == 'init' ? props.datas.nowType : state.nowType
      let orgShowTxt = ''
      const textType = (type: any) => {
        let classText = ''
        if (type == 0 || type == 31) {
          classText = '岗位级'
        } else if (type == 2) {
          classText = '企业级'
        } else if (type == 3) {
          classText = '部门级'
        }
        return classText
      }
      orgShowTxt = `岗位级，${setData.teamName}-${setData.deptName || ''}-${setData.roleName || ''}`
      if (types == 'affiliation') {
        //更改归属
        if (setData.ascriptionType == 3) {
          // 部门
          orgShowTxt = `${textType(setData.ascriptionType)}，${setData.teamName}-${setData.ascriptionName}`
        } else if (setData.ascriptionType == 2) {
          // 企业
          orgShowTxt = `${textType(setData.ascriptionType)}，${setData.teamName}`
        } else if (setData.ascriptionType == 0) {
          // 岗位
          if (setData.teamId == setData.deptId) {
            orgShowTxt = `${textType(setData.ascriptionType)}，${setData.teamName}-${setData.roleName || ''}`
          } else {
            orgShowTxt = `${textType(setData.ascriptionType)}，${setData.teamName}-${setData.deptName ||
              ''}-${setData.roleName || ''}`
          }
        } else {
          orgShowTxt = `${textType(setData.ascriptionType)}，${setData.teamName}-${setData.roleName || ''}`
        }
      } else if (types == 'executorUser') {
        //更改执行人
        if (state.affiliation.ascriptionType == 0 || state.affiliation.ascriptionType == 31) {
          orgShowTxt = `岗位级，${setData.teamName}-${setData.deptName || ''}-${setData.roleName || ''}`
        } else {
          //当归属为部门和企业级 则默认归属不改变
          if (state.affiliation.ascriptionType == 2) {
            orgShowTxt = `${textType(state.affiliation.ascriptionType)}，${setData.teamName}`
          } else {
            orgShowTxt = `${textType(state.affiliation.ascriptionType)}，${setData.teamName}-${state.affiliation
              .deptName || ''}`
          }
          // orgShowTxt = `${textType(state.affiliation.ascriptionType)}，${state.affiliation.teamName}-${state
          //   .affiliation.deptName || ''}-${state.affiliation.roleName || ''}`
        }
      } else if (props.datas.from == 'workbench' && nowTypes == 0) {
        //工作台创建任务
        orgShowTxt = `岗位级，${setData.teamName}-${setData.deptName || ''}-${setData.roleName || ''}`
      } else if (props.datas.from == 'taskManage') {
        //任务管理
        if (setData.ascriptionType == 0) {
          orgShowTxt = `${textType(setData.ascriptionType)}，${setData.teamName}-${setData.deptName ||
            ''}-${setData.roleName || ''}`
        } else if (setData.ascriptionType == 2) {
          orgShowTxt = `${textType(setData.ascriptionType)}，${setData.teamName}`
        } else {
          orgShowTxt = `${textType(setData.ascriptionType)}，${setData.teamName}-${setData.deptName || ''}`
        }
      } else if (props.datas.from == 'taskManage_my') {
        //任务管理我的任务
        orgShowTxt = `岗位级，${setData.teamName}-${setData.deptName || ''}-${setData.roleName || ''}`
      }
      dispatch({
        type: 'affiliationText',
        data: orgShowTxt,
      })
    }
    // 查询企业下权限
    findAuthList({ typeId: setData.teamId || '' })
  }
  //切换任务类型
  const toggleTaskType = (type: any) => {
    // 新版-不再控制不同类型的提示
    // if (props.datas.isCreate == 2) {
    //   //创建子任务不能切换任务类型
    //   message.warning('创建子任务不能切换任务类型')
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
  //删除标签
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
  //更改私密公开属性
  const selProperty = () => {
    dispatch({
      type: 'private',
      data: state.private == 0 ? 1 : 0,
    })
  }
  //编辑名称
  const editName = (e: any) => {
    e.persist()
    dispatch({
      type: 'taskName',
      data: e.target.value,
    })
  }
  //编辑任务描述
  const editorChange = (html: string) => {
    dispatch({
      type: 'editorText',
      data: html,
    })
  }
  //点击出发获取子组件展开tag的方法
  const gettags: any = useRef()
  const clicktags = () => {
    // changeVal就是子组件暴露给父组件的方法
    gettags.current.changeVal()
  }
  //编辑时间
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
  //编辑提醒时间
  const handleChange = (value: any) => {
    dispatch({
      type: 'remindTimesActive',
      data: value,
    })
  }
  //选择成员插件
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
      //执行人、指派人、领导责任人、督办人[单个企业]
      initSelMemberOrg = {
        // teamId: state.affiliation.teamId,
        sourceType: '', //操作类型
        allowTeamId: allowTeamId,
        selectList: _selectList, //选人插件已选成员
        checkboxType: 'radio',
        isDel: type == '1' || type == '2' ? false : true, //是否可以删除 true可以删除
        permissionType: 3, //组织架构通讯录范围控制
        orgBotInfo: {
          type: 'joinTeam',
          title: '参与企业联系人（该任务链条下的企业联系人）',
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
        //编辑任务、任务管理组织架构树选择 =>单个企业
        _allowTeamId = [state.affiliation.teamId]
        if (state.addHandly && state.addHandly.type != 2 && state.addHandly.type != 3) {
          checkableTypes = [0, 3]
        }
      } else if (props.datas.isCreate == 2) {
        //创建子任务根绝查询的企业信息
        _allowTeamId = [...subset]
        checkableTypes = [0, 3]
      }
      let _selectList: any = []
      if (JSON.stringify(state[selectListArr[type]]) == '{}') {
        _selectList = []
      } else if (state[selectListArr[type]].curType != undefined && state[selectListArr[type]].curType != -1) {
        _selectList = [state[selectListArr[type]]]
      }
      // if (_selectList.length == 0 && state.affiliationText && state.affiliationText.splite('，')[1]) {
      //   const typeName = state.affiliationText.splite('，')[1] || ''
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
      //归属[多个企业]
      initSelMemberOrg = {
        sourceType: 'taskBelong', //操作类型
        selectList: _selectList, //选人插件已选成员
        checkboxType: 'radio',
        permissionType: 1, //组织架构通讯录范围控制
        allowTeamId: _allowTeamId, //没有值的时候为全部企业
        checkableType: checkableTypes,
        orgBotInfo: {
          type: 'joinTeam',
          title: '参与企业联系人（该任务链条下的企业联系人）',
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
  //选择成员设置数据
  const selMemberSure = (dataList: any, selectusertype: string) => {
    const datas = dataList[0]
    if (selectusertype == '0') {
      //选择归属信息
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
      //创建子任务归属变更了企业 选择其他人员则也需要变更归属企业
      if ((datas.cmyId! = state.affiliation.teamId)) {
        parentBelong = setData
      }
      if (datas.curType == 2 || datas.curType == 3) {
        //选择归属为企业和部门时 查询相关负责人展示为执行人
        const param = {
          account: nowAccount,
          teamId: setData.teamId,
          deptId: datas.curType == 2 ? setData.teamId : datas.deptId,
          isCreate: props.datas.isCreate, //创建0 编辑1
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
        //执行人
        types = 'executorUser'
      } else if (selectusertype == '2') {
        //指派人
        types = 'assignUser'
      } else if (selectusertype == '3') {
        //领导责任人
        types = 'leadershipUser'
      } else if (selectusertype == '4') {
        //督办人
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
  //选择目标任务支撑
  const setAddHandlySure = (data: any) => {
    dispatch({
      type: 'addhand',
      data: data,
    })
    const taskmanageOrg = props.datas.taskmanageData.orgInfo
    if (state.affiliation.curType == 2 && data.type != 2 && data.type != 3) {
      //选择归属信息
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
   * 选择归属：跨企业情况
   */
  const differCompany = ({ teamId, nowType, datas }: { teamId: string; nowType: number; datas: any }) => {
    //创建子任务判断是否跨企业[跨企业隐藏优先级、标签、私密、领导人、督办人、检查项]
    if (iscreat != 2) {
      return
    }
    // 1 优先级、标签、私密、领导人、督办人、检查项显示隐藏
    const isJoin = getIsJoin(partenterprise || [], teamId)
    setTagAndPriorHidden(isJoin ? false : true)
    if (!isJoin) {
      // 1 优先级显示隐藏
      setTagAndPriorHidden(true)
      // 2 跨企业：执行人联动变化
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
        // //执行人默认为登陆人
        // dispatch({
        //   type: 'executorUser',
        //   data: userModal,
        // })
        // //指派人默认为登陆人
        // dispatch({
        //   type: 'assignUser',
        //   data: userModal,
        // })
      } else if (nowType == 0 && selectusertype == '1') {
        //选择归属信息
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
  //参与企业
  const setEnterprise = (datas: any, id: any) => {
    const list = [...state.enterprise]
    if (id) {
      //删除
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
      //添加联系人
      if (iseditenterprise) {
        //修改联系人替换
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
  //再次邀请
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
        message.success('已邀请')
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
  //保存获取参与企业信息
  const EnterpriseList = () => {
    const list = [...state.enterprise]
    const newArr = []
    for (let i = 0; i < list.length; i++) {
      newArr.push({
        teamId: list[i].id,
        userId: list[i].userId,
        isExtends: list[i].isExtends || '0',
        status: list[i].status || '0', //0待确认  2已differCompany加入   1已拒绝状态
      })
    }
    return newArr
  }
  //获取附件
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
  // 数组去重
  const unique = (arr: any[]) => {
    return Array.from(new Set(arr))
  }
  //获取支撑OKR数据
  const getSupportOKR = () => {
    let newArr: any = []
    support.okrContent.map((item: any) => {
      newArr.push({
        mainId: item.mainId, //规划ID
        mainParentId: item.workPlanId || item.id, //规划支撑ID
        isExtends: item.isExtends || false,
      })
    })
    if (support.okrContent.length > 0 && support.okrContent[0] == -1) {
      newArr = []
    }
    return newArr
  }
  //保存
  const handleOk = () => {
    const tagIds: any = []
    $.each(state.tags.tags || [], (index: any, item: any) => {
      tagIds.push(item.id)
    })
    if (state.taskName == '') {
      message.warning('任务名称不能为空字符')
      return
    }
    // 当前汇报id合集
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
      type: state.taskForm, //任务类型 任务0 项目1
      ascriptionId: state.affiliation.teamId || props.datas.taskdata.ascriptionId, //企业ID---------------
      ascriptionName: state.affiliation.teamName || props.datas.taskdata.ascriptionName, //企业名称--------------
      ascriptionType: 2, //企业类型为2
      name: state.taskName, //名称
      description: state.editorText, //描述
      operateUser: nowUserId, //操作人(登陆人)
      operateUserName: nowUser, //操作人(登陆人名称)
      parentId: _parentId, //创建子任务传父级任务id---------------
      supports: getSupportOKR(), //支撑OKR
      createType: 1, //区别快速创建于普通弹窗创建
      startTime: state.startTime, //开始时间
      endTime: state.endTime, //结束时间
      property: state.private, //公开0 私密1
      cycleModel: state.cycleModel, //循环
      tagList: tagIds, //标签
      icon: state.tags.icon, //图标
      fileModels: getFileList() || [], //文件
      temporaryId: pageUuid,
      fileGuidList: delFileIds,
      liable: {
        //执行人
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
          : {}, //指派人
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
          : {}, //领导责任人
      supervisor:
        JSON.stringify(state.superviseUser) != '{}'
          ? {
              ascriptionId: state.superviseUser.ascriptionId || props.datas.taskdata.ascriptionId,
              userId: state.superviseUser.userId,
              userName: state.superviseUser.userName,
            }
          : {}, //督办人
      attach: {
        star: state.priority.data, //优先级等级
        type: state.nowType, //0 个人任务  2企业任务  3部门任务
        typeId: state.nowType == 0 ? state.executorUser.userId : state.affiliation.ascriptionId, // 任务类型id
      },
      projectId: '',
      reminder: remindopen ? state.remindTimesActive : 0, //提醒时间
      // checkList: state.checkList && !ischeckData ? checkListModel(state.checkList, 'add') : state.checkList, //检查项
      checkList: state.checkList,
      teamList: EnterpriseList(), // 参与企业
      forceReportIds, //汇报ids
      updateForceIds: unique(updateReportIds), //更新过的汇报ids
    }
    let url = ''
    let messageText = ''
    if (iscreat == 1) {
      //编辑任务
      url = '/task/modify/id'
      messageText = '编辑任务成功'
      param.id = props.datas.taskid
      //草稿任务(工作规划)
      if (props.datas.taskFlag && props.datas.taskFlag == 2) {
        url = '/task/work/plan/editTask'
      }
    } else {
      //创建任务
      url = '/task/addTaskByName'
      messageText = '创建任务成功'
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
          //继续创建任务
          props.setvisible(true)
          //清空相关数据
          clearDatas('keepCreat')
        } else {
          if (state.addHandly) {
            props.setvisible(false, 1)
          }
          props.setvisible(false)
          cancelchecktype()
        }
        // okr 详情模式下 kr创建任务，需要过滤关联OKR项id,做刷新使用
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
          createType: props.datas.isCreate, //1：编辑
          parentIdOld: iscreat == 1 ? supportParentOld : '',
          supportsIds,
        })
        // 刷新子任务树
        if (iscreat == 2)
          refreshChildTree &&
            refreshChildTree({ type: 1, operateId: param.parentId, newTask: resData.data || {} })
        // props.callbacks({ data: resData.data || {} })//触发回调
      } else {
        message.error(resData.returnMessage)
        setLoading(false)
      }
    })
  }
  const getListType = (type: number) => {
    //任务类型临时1、目标0、项目3、职能2
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
  //刷新
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
    //   //工作台编辑任务
    //   props.callbacks({ data: data })
    // } else {
    //   props.callbacks({ data: data })
    // }
    props.callbacks(
      { data: data, optType, parentId, createType, parentIdOld, supportsIds },
      { code: getListType(state.taskForm) }
    )
    // if (state.taskForm === 0) {
    //   //刷新目标任务
    //   refreshDetails()
    // } else {
    moduleItemRefresh && moduleItemRefresh(getListType(state.taskForm))
    // }
  }
  //取消
  const handleCancel = () => {
    props.setvisible(false)
    cancelchecktype()
    // 任务管理处创建任务时占用了星级的情况
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
    //初始化项目类型选择
    const newArr = state.taskType
    newArr.forEach((item: any) => {
      if (item.type == '1') {
        item.val = 'active'
      } else {
        item.val = ''
      }
    })
  }
  //继续创建任务
  const continueCreat = (e: any) => {
    setKeepCreat(e.target.checked)
  }
  //提醒
  const remindCreat = (e: any) => {
    setRemindopen(e.target.checked)
  }
  /**
   * 根据不同状态返回任务列表标签
   */
  const setTagByStatus = (item: globalInterface.WorkPlanTaskProps) => {
    return (
      <div className="tag-list">
        {item.property === 1 && (
          <Tag color={'#FAD1CE'} style={{ color: '#EA4335' }}>
            密
          </Tag>
        )}
        {item.taskStatus === 3 && (
          <Tag color={'#FAD1CE'} style={{ color: '#EA4335' }}>
            延
          </Tag>
        )}
        {(item.status === 2 || item.approvalStatus !== 0) && (
          <Tag color={'#FCECC5'} style={{ color: '#FBBC05' }}>
            审
          </Tag>
        )}
        {item.taskFlag === 1 && <Tag color={'#CDCDCD'}>冻</Tag>}
        {item.taskFlag === 3 && <Tag color={'#CDCDCD'}>归档</Tag>}
        {item.cycleNum === 0 && <Tag color={'#4285f4'}>循</Tag>}
        {item.cycleNum > 0 && (
          <Tag color={'#4285f4'} style={{ width: '22px' }}>
            循{item.cycleNum}
          </Tag>
        )}
      </div>
    )
  }
  //处理任务支撑数据处理
  const addiconContent = (nodeData: any) => {
    const day = nodeData.day
    const nodeText = nodeData.nodeText || ''
    let days = ''
    if (nodeData.type == 2 || nodeData.type == 3) {
      days = ' 剩余'
    } else {
      if (nodeData.status == 4 || nodeData.status == 3) {
        //派发显示剩余 未派发显示共
        days = ' 剩余'
      } else {
        days = ' 共'
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
            <span className="task_days getblue">{day}</span> <span>天</span>
          </span>
        </span>
      </div>
    )
  }
  const priorityIcon = $tools.asAssetsPath(`/images/common/number-${state.priority.data}.png`)
  const tagIcon = $tools.asAssetsPath(`/images/task/${state.tags.icon}.png`)
  const headDefIcon = $tools.asAssetsPath('/images/workplan/head_def.png')
  const teamheadDef: any = $tools.asAssetsPath('images/task/cmy-normal.png')
  // 更新汇报列表  查询当前汇报是否存在，存在则替换，反之添加
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

  // 删除汇报
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
          message.success('删除成功！')
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
   * 编辑任务优先级
   */
  const editTaskPri = ({ taskItem, newData }: { taskItem: any; newData: any }) => {
    editTaskPriApi({
      taskId: taskItem.id,
      oldTaskId: newData.oldTaskId || '',
      star: newData.data || 0,
      successMsg: 'no',
    }).then((res: any) => {
      if (res.success) {
        // 记录被占用星级信息
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

  //选择父级任务及支撑OKR
  const setsupportFn = (types: string) => {
    setsupportShow(true)
    const _disableList: any = []
    const _selectList: any = []
    if (types == 'task') {
      //选择父级任务
      if (iseditParentforbid || $('.item-org.line').text() == '企业级') {
        setsupportShow(false)
        if ($('.item-org.line').text() == '企业级') {
          message.warning('企业级不支持添加父级')
        }
        return
      }
      if (support.content.length > 0) {
        support.selectList = support.selectList || []
        support.selectList.push(support.content[0].id)
      }
      setsupport({
        ...support,
        type: 0, //0选择任务 1选择OKR
      })
    } else {
      //选择支撑的OKR
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
        type: 1, //0选择任务 1选择OKR
      })
    }
  }

  //保存选择的支撑OKR
  //data:取消选择的数据
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
      //取消的数据
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
          <div className="line item-org">{state.affiliationText.split('，')[0]}</div>
          <div className="item-org select-org">{state.affiliationText.split('，')[1]}</div>
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
                继续创建任务
              </Checkbox>
            )}
            {iscreat == 0 && (
              <Tooltip title="将保留任务归属、执行人信息继续创建任务">
                <span className="hints-continue"></span>
              </Tooltip>
            )}
            <Checkbox checked={remindopen} onChange={remindCreat}>
              任务结束前
            </Checkbox>
            <Select
              defaultValue="0分钟提醒"
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
              取消
            </Button>
            <Button key="submit" type="primary" onClick={handleOk}>
              {iscreat == 0 ? '创建' : '保存'}
            </Button>
          </div>
        </div>
      }
    >
      <Spin spinning={loading} tip={'加载中，请耐心等待'}>
        <div className="task-content" ref={refComplete}>
          {/* 类型 */}
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
          {/* 选择父级任务 */}
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
              选择父级任务
              {support.content.length > 0 && (
                <span className={`selectParent-task ${support.content[0] == -1 ? 'hide' : ''}`}>
                  {support.content[0].name || ''}
                  <span
                    className={`del ${iseditParentforbid ? 'hide' : ''}`}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      if (iscreat == 1) {
                        //编辑查询当前任务及父级任务的支撑
                        findSupport(props.datas.taskid, '', false)
                      } else {
                        //新增及创建子任务
                        findSupport('', '', false)
                      }
                    }}
                  ></span>
                </span>
              )}
            </div>
          </div>

          {/* 任务名称、优先级、私密 */}
          <div className="task-row task-row-names">
            <div className="task-icon"></div>
            <div className="task-item">
              {/* 名称 */}
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
                  placeholder="请用一句话简洁概括你的任务，如主页面设计"
                  value={state.taskName}
                />
              </div>
              {/* 优先级 */}
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
                        initDatas: Priorityinit || 0, //用于反显的数据 0为清除
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
                      {state.priority.data == 0 && <span className="sel_show_txt tasknames-yxj">优先级</span>}
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
              {/* 私密 */}
              {!tagAndPriorHidden && (
                <div className="task_prop" onClick={selProperty}>
                  <span>{state.private == 0 ? '公开' : '私密'}</span>
                  <em className={`${state.private == 0 ? 'public_prop' : 'private_prop'}`}></em>
                </div>
              )}
            </div>
          </div>
          {/* 标签 */}
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
          {/* 任务描述 */}
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
          {/* 指派人、执行人、领导责任人、督办人 */}
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
                  <p className="users-zx">执行人</p>
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
                  <p>指派人</p>
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
                      <p className="users-ld">领导责任人</p>
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
                      <p>督办人</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* 开始结束时间 */}
          <div className="task-row task-row-times">
            <div className="task-icon"></div>
            <div className="task-item">
              <div className="date-times">
                <DatePicker
                  showTime
                  placeholder="开始时间"
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
                  placeholder="截至时间"
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
          {/* 选择支撑 20/12/30版本 新增可选择支撑OKR*/}
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
                选择要支撑的OKR
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
                              <span className="remain_time_num">剩余{item.day || 0}</span>
                              <span className="bule">天</span>
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
          {/* 添加汇报设置 */}
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
                      from: 'createTask', //来源
                      isdetail: 0, //是否为详情 1详情 0设置 2编辑
                      taskid: props.datas.isCreate == 1 ? props.datas.taskid : 0, //任务id 0:未创建任务，创建临时汇报
                      reportid: '', //强制汇报id
                      createTime: '', //创建时间
                      startTime: state.startTime, //开始时间
                      endTime: state.endTime, //结束时间
                      teamId: state.affiliation.teamId, //企业id
                      taskFlag: props.datas.taskFlag, //2：草稿任务
                      reportPerson: arrObjDuplicate(reportPerson, 'curId'), //执行人数据
                      receiverPerson: arrObjDuplicate(receiverPerson, 'curId'), //汇报对象数据
                      copyPerson: arrObjDuplicate(copyPerson, 'curId'), //抄送数据
                      teamConcatPerson, //企业联系人
                    },
                  })
                }}
              >
                添加汇报设置
              </span>
            </div>
          </div>
          {/* 汇报列表数据 */}
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
                            from: 'createTask', //来源
                            isdetail: 2, //是否为详情 1详情 0设置 2编辑
                            taskid: item.taskid, //任务id
                            reportid: item.id, //强制汇报id
                            createTime: '', //创建时间
                            startTime: state.startTime, //开始时间
                            endTime: state.endTime, //结束时间
                            taskFlag: props.datas.taskFlag, //2：草稿任务
                            teamId: state.affiliation.teamId, //企业id
                            teamConcatPerson,
                          },
                        })
                      }
                    }}
                  >
                    <div className="left" style={{ maxWidth: '100%' }}>
                      <div className="text">{`${item.reporter.join('、')} ${
                        item.forceTime
                      } 向 ${item.receiver.join('、')} 汇报`}</div>
                      {hasAuth && (
                        <em
                          className="img_icon del_icon"
                          onClick={(e: any) => {
                            e.stopPropagation()
                            // 删除当前任务汇报
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
          {/* 选择参与企业 */}
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
                  选择参与企业
                </span>
                <div className="takeCompanyBox">
                  <ul>
                    {state.enterprise.map((item: any, index: number) => {
                      if (iscreat == 1 || iscreat == 2) {
                        //编辑参与企业可以更改 编辑 删除
                        const status = item.status || 0
                        let againInvite = 'disable'
                        let statusTxt = '',
                          statusClass = ''
                        if (status == 0) {
                          statusTxt = '待确认'
                          statusClass = 'wait'
                        } else if (status == 2) {
                          statusTxt = '已加入'
                          statusClass = 'joined'
                        } else if (status == 1) {
                          statusTxt = '已拒绝'
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
                                  <span className="cmy_info_name ">联系人:{item.username}</span>
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
                                          <span>修改联系人</span>
                                        </li>
                                        <li
                                          className={`optBtnItem ${againInvite}`}
                                          onClick={() => {
                                            inviteAgain(item.id, item.userId)
                                          }}
                                        >
                                          <em className="img_icon menu_icon again_invite_icon"></em>
                                          <span>再次邀请</span>
                                        </li>
                                        <li
                                          className="optBtnItem"
                                          onClick={() => {
                                            setEnterprise([], item.id)
                                          }}
                                        >
                                          <em className="img_icon menu_icon del_icon"></em>
                                          <span>删除</span>
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
                        //创建及创建子任务
                        return (
                          <li className="joinCmyItem" key={index}>
                            <div className="joinCmyLeft">
                              <div className="avatars">
                                <Avatar size={32} src={item.profile || teamheadDef} />
                              </div>
                              <div className="text">
                                <p>{item.name}</p>
                                <p className="cmy_info_name_box ">
                                  <span className="cmy_info_name ">联系人:{item.username}</span>
                                  <span className="join_cmy_status wait">待确认</span>
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
          {/* 选择支撑 */}
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
                <span className="addHandly-text">添加支撑</span>

                <div className="task-list part-okr-quadrant ant-table-row">
                  {state.addHandly.type == 2 && <span className="isokr O_okr">O</span>}
                  {state.addHandly.type == 3 && <span className="isokr KR_okr">KR</span>}
                  <div className="okr_text_content ant-table-cell" data-type="2" data-name="目标计划">
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
          {/* 添加检查项 */}
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
                  <span className="task-icon"></span>添加检查项
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
                    initData: state.checkList, //初始化数据
                    iseditCheck: true, //是否可以编辑检查项
                    isshowNoneData: false, //无数据是否显示空白页
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

          {/* 添加附件 */}
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
                showText="添加附件"
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
                添加附件
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
      {/* 选人插件 */}
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
      {/* 选择参与企业 */}
      {enterpriseShow && (
        <ParticipateEnterprise
          param={
            iscreat == 1 || iscreat == 2
              ? {
                  visible: enterpriseShow,
                  orgId: iseditenterprise ? enterpriseid : '', //指定企业
                  orignodeUsers: iseditenterprise && enterpriseinfo, //点击修改联系人参与企业
                  typeframe: iseditenterprise ? 'Radio' : 'Checkbox',
                  notOrgIds: iseditenterprise ? [enterpriseid] : [state.affiliation.teamId], //排除企业
                  selectUserlist: state.enterprise || [], //已选联系人
                }
              : {
                  visible: enterpriseShow,
                  orgId: '',
                  orignodeUsers: '', //是否点击修改联系人
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
      {/* 循环组件 */}
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
      {/* 目标任务支撑 */}
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
            // 点击确认
            onSure: setAddHandlySure,
          }}
        ></AddHandModel>
      )}
      {/* 选择父级任务及选择支撑okr */}
      {supportShow && (
        <SupportModal
          param={{
            visible: supportShow,
            allowTeamId: [state.affiliation.teamId], //组织架构的企业id
            contentType: support.type == 0 ? 'task' : 'okr',
            checkboxType: support.type == 0 ? 'radio' : 'checkbox',
            disabTaskId: [props.datas.taskid], //查询任务列表需要排除的任务id[后台禁用当前及子任务不能选择]
            isshowKR: true, //是否显示KR
            disableList: support.disableList || [], //禁用
            selectList: support.selectList || [], //反选
            showType: 1, //1是父级任务列表，2是规划关联任务列表
          }}
          action={{
            setModalShow: setsupportShow,
            onSure: (vaule: any, data?: any) => {
              if (support.type == 0) {
                setsupport({ ...support, content: vaule })
                let taskParentArr: any = vaule.concat(support.content)
                taskParentArr = taskParentArr.length > 0 ? taskParentArr[0].id : ''
                if (iscreat == 1) {
                  //编辑查询当前任务及父级任务的支撑
                  findSupport(props.datas.taskid, taskParentArr, false)
                } else {
                  //新增及创建子任务
                  findSupport('', taskParentArr, false)
                }
              } else {
                pushOkrContentFn(vaule, data)
              }
            },
          }}
        />
      )}
      {/* 强制汇报 */}
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

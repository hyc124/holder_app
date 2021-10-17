import React, { useState, useEffect, useReducer, useRef, useLayoutEffect, useMemo } from 'react'
import { Menu, Upload } from 'antd'
import {
  DatePicker,
  Avatar,
  Tabs,
  Select,
  Spin,
  message,
  Modal,
  Slider,
  InputNumber,
  Dropdown,
  Tooltip,
} from 'antd'
import moment from 'moment'
import TextArea from 'antd/lib/input/TextArea'
import TaskTags from '../creatTask/taskTags'
import { SelectMemberOrg } from '../../../components/select-member-org/index'
import LoopsTask, { loopTaskListDataShow } from '@/src/components/loop-task-date/loop-task-date'
import Priority from '../creatTask/priority'
import {
  queryTaskDetailApi,
  editTaskSaveApi,
  editTasklogApi,
  getTaskBtnApi,
  headerSettingsApi,
  inviteAgainApi,
  getForceReport,
  forceCountNoWrite,
  clearForceCountNoWrite,
  delForce,
} from './getData'
import { mainDutyApi } from '../creatTask/getData'
import Editor from '@/src/components/editor/index'
import ParticipateEnterprise from '../../../components/participate-enterprise/index'
import TaskTree from '../taskDetail/taskTree'
import CreatTask from '../../task/creatTask/creatTask'
import { updatePersonData } from '../../task/creatTask/creatTask'
import { refreshListFn as refreshTaskManageList } from '../taskManage/TaskManageList'
import UploadFile from '@/src/components/upload-file/index'
import { useSelector } from 'react-redux'
import { refBtnAuths } from './taskDetailTit'
import Forcereport, { getforceTime, getforceType } from '../../force-Report/force-Report'
import { refreshDetails as refreshTaskLogDetails } from '../taskDynamic/taskDynamic'
import { refreshReport } from '../../workdesk/component/collectedReport'

const { TabPane } = Tabs
const { Option } = Select
//获取右键权限
export const getTaskBtn = (paramObj: any) => {
  // viewType:0工作台点击 1任务管理点击 2任务详情
  let viewType = 0
  let editAuth = false
  let taskData = {}
  if (paramObj.fromType.indexOf('taskTable') > -1) {
    viewType = 1
  }
  if (paramObj.fromType.indexOf('detail') > -1) {
    viewType = 2
  }
  const param = {
    id: paramObj.taskId,
    userId: $store.getState().nowUserId,
    viewType: viewType,
  }
  async function auth() {
    await getTaskBtnApi(param).then((data: any) => {
      taskData = data.data || {}
      $(data.dataList || []).each(function(i, item) {
        if (item.name == 'UPDATE' && item.isUse == 1) {
          editAuth = true
        }
      })
    })
  }
  auth()
  return {
    taskData: taskData,
    editAuth: editAuth,
  }
}

let refreshDetail: any = null
//刷新
export const refreshDetails = () => {
  refreshDetail && refreshDetail()
}
//设置表头相关字段
export const setHeaderName = (nameData: any) => {
  nameData.map((item: any) => {
    if (item.code == 2) {
      //优先级
      jQuery('.tasknames-yxj').text(item.name)
    } else if (item.code == 1) {
      //任务名称
    } else if (item.code == 4) {
      //执行人
      jQuery('.users-zx').text(item.name)
    } else if (item.code == 5) {
      //领导责任人
      jQuery('.users-ld').text(item.name)
    } else if (item.code == 8) {
      //截至时间
      // jQuery('.tasknames-jz').text(item.name)
    } else if (item.code == 9) {
      //进度
    } else if (item.code == 11) {
      //附件
      jQuery('.taskFiles-text').text(item.name)
    } else if (item.code == 12) {
      //过程监管
    }
  })
}
//初始化数据
const initStates = {
  taskId: '', //任务ID
  taskName: '', //任务名称
  editorText: '', //任务描述
  startTime: '', //开始时间
  endTime: '', //结束时间
  tags: {
    //标签
    icon: '',
    tags: [],
  },
  priority: {
    //优先级
    type: '',
    data: 0,
  },
  cycleModel: {}, //循环任务
  taskForm: 1, //任务类型临时1、目标0、项目3、职能2
  taskFormTetx: '1', //任务类型临时1、目标0、项目3、职能2
  nowType: 0, // 任务创建类型0个人任务 2企业任务 3部门任务
  taskStatus: {}, //任务状态 延期 冻结 未开启 结束...剩余天数
  private: 0, //0公开 1私密
  checkList: [], //检查项
  enterprise: [], //参与企业
  progress: 0, //进度
  createuser: '', //创建者
  followers: [], //显示关注人
  nameData: [], //任务名称等修改字段
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
}

// const propss = {
//   name: 'file',
//   multiple: true,
//   action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
//   onChange(info: any) {
//     console.log('info', info)
//     const { status } = info.file
//     if (status !== 'uploading') {
//       // console.log('uploading==', info.file, info.fileList)
//     }
//     if (status === 'done') {
//       //  message.success(`${info.file.name} file uploaded successfully.`);
//       console.log('done==', info.file, info.fileList)
//     } else if (status === 'error') {
//       // message.error(`${info.file.name} file upload failed.`)
//     }
//   },
// }
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'taskId':
      return { ...state, taskId: action.data }
    case 'followers':
      return { ...state, followers: action.data }
    case 'nameData':
      return { ...state, nameData: action.data }
    case 'cycleModel':
      return { ...state, cycleModel: action.data }
    case 'taskName':
      return { ...state, taskName: action.data }
    case 'editorText':
      return { ...state, editorText: action.data }
    case 'startTime':
      return { ...state, startTime: action.data }
    case 'endTime':
      return { ...state, endTime: action.data }
    case 'tags':
      return { ...state, tags: action.data }
    case 'taskForm':
      return { ...state, taskForm: action.data }
    case 'taskFormTetx':
      return { ...state, taskFormTetx: action.data }
    case 'nowType':
      return { ...state, nowType: action.data }
    case 'private':
      return { ...state, private: action.data }
    case 'priority':
      return { ...state, priority: action.data }
    case 'checkList':
      return { ...state, checkList: action.data }
    case 'enterprise':
      return { ...state, enterprise: action.data }
    case 'progress':
      return { ...state, progress: action.data }
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
    case 'createuser':
      return { ...state, createuser: action.data }
    case 'taskStatus':
      return { ...state, taskStatus: action.data }
    default:
      return state
  }
}
//任务状态
const getTaskStatus = (data: any) => {
  let _status = '未开启'
  let statusClass = 'nostart'
  if (data.executeTime == null) {
    _status = '未开启'
    statusClass = 'nostart'
  } else if (data.status == 1) {
    _status = '进行中'
    statusClass = 'going'
  } else if (data.status == 2) {
    _status = '已完成'
    statusClass = 'finish'
  }
  if (data.status == 3) {
    _status = '延迟'
    statusClass = 'late'
  }
  if (data.approvalStatus != 0) {
    _status = '审批中'
    statusClass = 'approval'
  }
  if (data.flag == 3) {
    _status = '已归档'
    statusClass = 'freeze'
  } else if (data.flag == 1) {
    _status = '已冻结'
    statusClass = 'freeze'
  }
  return {
    statusTxt: _status,
    statusClass: statusClass,
  }
}
let fileModeles: object[] = []
const Details = (props: any) => {
  //选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //选择成员类型
  const [selectusertype, setSelectusertype] = useState()
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState({})
  //优先级显示隐藏
  const [priorityvis, setPriorityvis] = useState(false)
  //公共参数
  const [state, dispatch] = useReducer(reducer, initStates)

  const { nowUserId, nowAccount, nowUser, selectTeamId, loginToken } = $store.getState()
  //加载
  const [loading, setLoading] = useState(false)
  //修改任务 显示隐藏
  const [nameShow, setNameShow] = useState(false)
  //任务描述窗口
  const [editorShow, setEditorShow] = useState(false)
  //任务描述内容
  const [editortext, setEditortext] = useState<any>()
  //滑动条
  const [inputValue, setInputValue] = useState<any>()
  //打开参与企业
  const [enterpriseShow, setEnterpriseShow] = useState(false)
  //打开未写汇报清空窗口
  const [noWriteReport, setNoWriteReport] = useState({
    index: -1,
    visible: false,
    datas: [],
  })
  //是否是修改企业联系人
  const [iseditenterprise, setIseditenterprise] = useState(false)
  //点击修改企业联系人 企业ID
  const [enterpriseid, setEnterpriseid] = useState('')
  //点击修改企业联系人 企业及个人信息
  const [enterpriseinfo, setenterpriseinfo] = useState<any>({
    teamid: '',
    userId: '',
    teamName: '',
  })
  //任务详情
  const [taskDetalis, setTaskDetalis] = useState<any>()
  //打开创建任务
  const [opencreattask, setOpencreattask] = useState(false)
  //打开循环组件
  const [openloop, setOpenloop] = useState(false)
  //显示循环文字
  const [cyctext, setCyctext] = useState('设置循环')
  //设置进度步长
  const [stepnum, setStepnum] = useState(5)
  //来源
  const [fromtype, setFromtype] = useState('')
  //权限
  const [editAuth, setEditAuth] = useState(false)
  const refComplete = useRef(null)
  // 上传的文件列表数据
  const [fileUserList, setFileUserList] = useState<Array<any>>([])
  //是否刷新tasktree
  const [isrefreshTree, setIsrefreshTree] = useState(true)
  const editdetailid = useSelector((store: StoreStates) => store.editdetailid)
  // 强制汇报列表
  const [reportList, setReportList] = useState<any[]>([])
  //缓存强制参数
  const [openforceParam, setOpenforceParam] = useState({
    visible: false,
    param: {},
  })
  // 是否有无效汇报
  const [notValidReport, setNotValidRport] = useState(false)
  //编辑任务任务类型（0，2，31）
  const [attachType, setattachType] = useState<any>({
    type: 0,
    typeId: 0,
  })
  //子任务树(为保持子组件不更新 useMemo第二个参数控制不重新加载)
  const initTree = useMemo(() => {
    return (
      <TaskTree
        key={props.param.id}
        datas={{
          taskId: props.param.id,
        }}
        ascertain={(id: any, isrefresh: any) => {
          queryTaskDetail(id)
          setIsrefreshTree(isrefresh)
        }}
      ></TaskTree>
    )
  }, [props.param.id, editdetailid])

  //初始化---------------------------------------------
  useEffect(() => {
    if (props.param.id) {
      queryTaskDetail(props.param.id)
      setFromtype(props.from)
      getForceReportList(props.param.id)
    }
  }, [props.param.id, props.refresh])

  //dom更新完后
  useLayoutEffect(() => {
    //设置表头相关字段
    setHeaderName(state.nameData)
  }, [state.nameData])
  //设置权限
  useLayoutEffect(() => {
    if (editAuth) {
      jQuery(
        '.taskProgressSec,.taskNameBox,.selTagBoxOut,.tagSignShowBox ,.task-designated,.belongRow,.taskJoinCmyRow,.taskSourceRow'
      ).css({
        'pointer-events': 'initial',
      })
      jQuery('.taskFilesRow').removeClass('noevents')
    } else {
      jQuery(
        '.taskProgressSec,.taskNameBox,.selTagBoxOut,.tagSignShowBox,.task-designated,.belongRow,.taskJoinCmyRow,.taskSourceRow'
      ).css({
        'pointer-events': 'none',
      })
      jQuery('.taskFilesRow').addClass('noevents')
    }
  }, [editAuth])
  //刷新
  refreshDetail = () => {
    queryTaskDetail(props.param.id)
    setTimeout(() => {
      getForceReportList(props.param.id)
    }, 100)
  }
  // 获取任务汇报列表
  const getForceReportList = (taskId: any) => {
    getForceReport({ taskId, userId: nowUserId }).then((res: any) => {
      console.log(res)
      if (res.returnCode == 0) {
        const dataList = res.dataList || []
        const newArr: any = []
        let notValidRport = false
        dataList.map((item: any) => {
          const time = getforceTime(item.timeType, item.timePeriod, item.triggerTime, true)
          const type = getforceType(item.status)
          const forceTime = type ? `${time} ${type}` : time
          const obj = {
            id: item.id,
            createUser: item.createUser,
            createUsername: item.createUsername,
            reporter: item.reporter,
            receiver: item.receiver,
            forceTime: forceTime,
            taskid: taskId,
            hasDelete: item.hasDelete,
            hasDelay: item.hasDelay,
            flag: item.flag, //标识汇报状态:0正常 1删除 2未生效
          }
          if (item.flag == 2) notValidRport = true
          newArr.push(obj)
        })
        setNotValidRport(notValidRport)
        setReportList([...newArr])
      }
    })
  }

  // 获取未写汇报列表
  const getForceCountNoWrite = (forceReportId: any, index: number, visible: boolean) => {
    forceCountNoWrite({ forceReportId }).then((res: any) => {
      if (res.returnCode == 0) {
        setNoWriteReport({ ...noWriteReport, datas: res.dataList || [], index, visible })
      }
    })
  }
  // 清除未写汇报
  const clearForceNoWrite = (forceReportId: any, userId: any, index: number, content: string) => {
    clearForceCountNoWrite({ forceReportId, userId, content, loginUserId: nowUserId }).then((res: any) => {
      if (res.returnCode == 0) {
        // 清空成功 删除当前弹窗数据 和 汇报数据
        const newArr = [...noWriteReport.datas]
        newArr.splice(index, 1)
        refreshReport()
        setNoWriteReport({ ...noWriteReport, datas: [...newArr] })
        refreshTaskLogDetails && refreshTaskLogDetails()
        if (newArr.length == 0) {
          console.log(reportList)
          const newReportIndex = reportList.findIndex((item: any, index: number) => {
            return item.id == forceReportId
          })
          reportList[newReportIndex].hasDelay = 0
          setReportList([...reportList])
        }
      }
    })
  }

  // 删除汇报
  const delReport = (reportid: number, index: number) => {
    setLoading(true)
    delForce({
      id: reportid,
      operateUser: nowUserId,
      operateUserName: nowUser,
    }).then((res: any) => {
      setLoading(false)
      if (res.returnCode == 0) {
        message.success('删除成功！')
        getForceReportList(props.param.id)
        refreshTaskLogDetails && refreshTaskLogDetails()
        // props.callbackFn()
        refreshReport()
      }
    })
  }
  // 更新汇报列表  查询当前汇报是否存在，存在则替换，反之添加
  const updateReportList = (reportData: any) => {
    console.log(reportData)
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
  //查询权限
  const refEditAuth = () => {
    setEditAuth(false)
    props.setauth(false)
    const param = {
      id: props.param.id,
      userId: $store.getState().nowUserId,
      viewType: 2, //0工作台点击 1任务管理点击 2任务详情
    }
    getTaskBtnApi(param).then((data: any) => {
      // console.log('查询到的权限11')
      // console.log(data.dataList)
      $(data.dataList || []).each(function(i, item) {
        if (item.name == 'UPDATE' && item.isUse == 1) {
          setEditAuth(true)
          props.setauth(true)
          return
        }
      })
    })
  }
  //查询任务详情
  const queryTaskDetail = (_id: any) => {
    setLoading(true)
    const param = {
      id: _id,
      userId: nowUserId,
    }
    queryTaskDetailApi(param).then((resData: any) => {
      setLoading(false)
      if (resData.data) {
        const details = resData.data
        const reportPerson: any[] = updatePersonData(state, 'executorUser', 0)
        const assignUser = updatePersonData(state, 'assignUser', 1)
        const leadershipUser = updatePersonData(state, 'leadershipUser', 1)
        const receiverPerson: any[] = assignUser.concat(leadershipUser)
        const copyPerson: any[] = updatePersonData(state, 'superviseUser', 2)
        details['reportPerson'] = reportPerson
        details['receiverPerson'] = receiverPerson
        details['copyPerson'] = copyPerson

        setdetailData(details)
        setTaskDetalis(details)

        props.taskdetailDatas(details)
        $store.dispatch({ type: 'TASK_DETAIL', data: details })
      }
      //查询权限
      refEditAuth()
    })
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
    //任务进度
    dispatch({ type: 'progress', data: details.process })
    //附件
    setFileUserList(details.fileModels || [])
    fileModeles = details.fileModels || []
    //优先级
    dispatch({
      type: 'priority',
      data: {
        type: details.attach.setType,
        data: details.attach.star,
      },
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
    //设置循环
    dispatch({
      type: 'cycleModel',
      data: details.cycleModel,
    })
    let cyctexts = ''
    if (JSON.stringify(details.cycleModel) != '{}' && details.cycleModel) {
      const types = details.cycleModel.cycleType
      if (types == 1) {
        cyctexts = '每天'
      } else if (types == 2) {
        cyctexts = '每周'
      } else if (types == 3) {
        cyctexts = '每月'
      } else if (types == 4) {
        cyctexts = '每季度'
      } else if (types == 5) {
        cyctexts = '每半年'
      } else if (types == 6) {
        cyctexts = '每一年'
      } else if (types == 21) {
        cyctexts = '隔周'
      } else {
        cyctexts = '自定义'
      }
    }
    setCyctext(cyctexts)
    dispatch({ type: 'tags', data: { icon: details.icon, tags: newTags } })
    //私密公开
    dispatch({ type: 'private', data: details.property })
    //任务类型
    dispatch({ type: 'taskForm', data: details.type })
    const fromtext = ['目标任务', '临时任务', '职能任务', '项目任务']
    dispatch({ type: 'taskFormTetx', data: String(details.type) })
    //显示关注人
    const followNames: any = []
    if (details.followUsers && details.followUsers.length > 0) {
      details.followUsers.map((item: any) => {
        followNames.push(item.username || '')
      })
    }
    dispatch({
      type: 'followers',
      data: followNames,
    })

    //任务状态
    const statusObj = getTaskStatus(details)
    const _status = statusObj.statusTxt
    const statusClass = statusObj.statusClass
    dispatch({
      type: 'taskStatus',
      data: {
        name: _status,
        class: statusClass,
        remianDays: details.remianDays || '',
      },
    })
    //任务归属
    dispatch({
      type: 'affiliation',
      data: {
        teamId: details.ascriptionId,
        teamName: details.ascriptionName,
        ascriptionId: details.attach.typeId,
      },
    })
    setattachType({
      type: details.attach.type,
      typeId: details.attach.type == 0 ? details.liable.roleId : details.attach.typeId,
    })
    //任务类型 0个人任务 2企业任务 3部门任务
    dispatch({ type: 'nowType', data: details.attach.type })
    //归属文本
    let belongShow = ''
    if (details.attach.type == 0) {
      belongShow = `岗位级, 归属于${details.attach.typeName || ''}`
    } else if (details.attach.type == 3) {
      belongShow = `部门级,  归属于${details.attach.typeName || ''}`
    } else if (details.attach.type == 2) {
      belongShow = `企业级, 归属于${details.attach.typeName || ''}`
    }
    dispatch({ type: 'affiliationText', data: belongShow })
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
      },
    })
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
        },
      })
    } else {
      dispatch({
        type: 'leadershipUser',
        data: {},
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
    } else {
      dispatch({
        type: 'superviseUser',
        data: {},
      })
    }
    //创建者
    dispatch({ type: 'createuser', data: details.createUsername })
    //参与企业
    const enterpriseArr: any = []
    if (details.teamList) {
      details.teamList.map((item: any) => {
        enterpriseArr.push({
          id: item.teamId,
          name: item.teamName,
          userId: item.userId,
          username: item.username,
          isExtends: item.isExtends,
          status: item.status,
          profile: item.teamLogo,
        })
      })
    }
    dispatch({ type: 'enterprise', data: enterpriseArr })
    //获取表头设置相关字段
    headerSettingsList(details.ascriptionId)
    setLoading(false)
  }
  //选择成员插件
  const selectUser = (type: any) => {
    let initSelMemberOrg: any = {}
    setMemberOrgShow(true)
    setSelectusertype(type)
    if (type == '1' || type == '2' || type == '3' || type == '4') {
      const selectListArr = ['', 'executorUser', 'assignUser', 'leadershipUser', 'superviseUser']
      //执行人、指派人、领导责任人、督办人[单个企业]
      initSelMemberOrg = {
        teamId: state.affiliation.teamId,
        sourceType: '', //操作类型
        allowTeamId: [state.affiliation.teamId],
        selectList: JSON.stringify(state[selectListArr[type]]) == '{}' ? [] : [state[selectListArr[type]]], //选人插件已选成员
        checkboxType: 'radio',
        isDel: type == '1' || type == '2' ? false : true, //是否可以删除 true可以删除
        permissionType: 3, //组织架构通讯录范围控制
      }
      setSelMemberOrg(initSelMemberOrg)
    } else {
      //归属
      initSelMemberOrg = {
        teamId: state.affiliation.teamId,
        sourceType: '', //操作类型
        selectList: [], //
        allowTeamId: [state.affiliation.teamId],
        checkboxType: 'radio',
        permissionType: 1, //组织架构通讯录范围控制
        checkableType: [0, 2, 3],
      }
      setSelMemberOrg(initSelMemberOrg)
    }
  }
  //选择成员设置数据
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const datas = dataList[0]
    const param: any = {
      id: state.taskId,
      operateUser: nowUserId,
    }
    if (selectusertype == 0) {
      //更改任务归属
      param.ascriptionId = datas.cmyId //企业ID
      param.ascriptionName = datas.cmyName //企业名称
      param.attach = {
        star: '', //优先级等级
        type: datas.curType, //0 个人任务  2企业任务  3部门任务
        typeId: datas.curId, // 任务类型id
      }
      param.liable = {
        //执行人
        ascriptionId: datas.cmyId,
        deptId: datas.deptId || datas.cmyId,
        deptName: datas.deptName || datas.cmyName,
        roleId: datas.roleId,
        roleName: datas.roleName,
        userId: datas.userId || datas.curId,
        username: datas.username || datas.curName,
      }
      if (datas.curType == 2 || datas.curType == 3) {
        //选择归属为企业和部门时 查询相关负责人展示为执行人
        const params = {
          account: nowAccount,
          teamId: datas.cmyId,
          deptId: datas.curType == 2 ? datas.cmyId : datas.deptId,
          isCreate: 1, //创建0 编辑1
        }
        mainDutyApi(params).then((resData: any) => {
          const data = resData.data
          param.liable = {
            //执行人
            ascriptionId: datas.cmyId,
            deptId: data.deptId,
            deptName: data.deptName,
            roleId: data.roleId,
            roleName: data.roleName,
            userId: data.userId,
            username: data.username,
          }
          editTaskSave(param)
        })
      } else {
        editTaskSave(param)
      }
    } else {
      if (selectusertype == '1') {
        //执行人 executorUser
        param.liable = {
          ascriptionId: state.affiliation.teamId,
          deptId: datas.deptId || datas.cmyId,
          deptName: datas.deptName || datas.cmyName,
          roleId: datas.roleId,
          roleName: datas.roleName,
          userId: datas.userId || datas.curId,
          username: datas.userName || datas.curName,
        }
      } else if (selectusertype == '2') {
        //指派人 assignUser
        param.distribute = {
          ascriptionId: state.affiliation.teamId,
          userId: datas.userId || datas.curId,
          userName: datas.userName || datas.curName,
        }
      } else if (selectusertype == '3') {
        //领导责任人 leadershipUser
        if (datas) {
          param.executor = {
            ascriptionId: state.affiliation.teamId,
            userId: datas.userId || datas.curId,
            userName: datas.userName || datas.curName,
            deptId: datas.deptId,
            deptName: datas.deptName,
            roleId: datas.roleId,
            roleName: datas.roleName,
          }
        } else {
          param.executor = {}
        }
      } else if (selectusertype == '4') {
        //督办人 superviseUser
        if (datas) {
          param.supervisor = {
            ascriptionId: state.affiliation.teamId,
            userId: datas.userId || datas.curId,
            userName: datas.userName || datas.curName,
          }
        } else {
          param.supervisor = {}
        }
      }
      editTaskSave(param, true)
    }
  }
  //修改任务信息-------------------------------------------
  //修改名称
  const editName = (e: any) => {
    setNameShow(false)
    const text = e.target.value || ''
    const param = {
      id: state.taskId,
      name: text,
      operateUser: nowUserId,
    }
    editTaskSave(param)
  }
  //修改时间
  const editTimes = (val: any, type: string) => {
    let times = ''
    if (!val) {
      times = ''
    } else {
      times = moment(val).format('YYYY/MM/DD HH:mm')
    }
    let param = {}
    if (type == 'startTime') {
      param = {
        id: state.taskId,
        startTime: times,
        endTime: state.endTime,
        operateUser: nowUserId,
      }
    } else if (type == 'endTime') {
      param = {
        id: state.taskId,
        startTime: state.startTime,
        endTime: times,
        operateUser: nowUserId,
      }
    }
    editTaskSave(param)
  }
  //删除图标
  const delIcon = () => {
    const param = {
      id: state.taskId,
      icon: '', //图标
      operateUser: nowUserId,
    }
    editTaskSave(param)
  }
  //修改标签 优先级
  const editIcon = (datas: any, type: any) => {
    let param = {}
    if (type == 'tags') {
      //标签
      const tagIds: any = []
      $.each(datas.tags || [], (index: any, item: any) => {
        tagIds.push(item.id)
      })
      param = {
        id: state.taskId,
        tagList: tagIds, //标签
        icon: datas.icon, //图标
        operateUser: nowUserId,
      }
    } else if (type == 'Priority') {
      //优先级
      param = {
        id: state.taskId,
        attach: {
          star: datas.data, //优先级等级
          type: state.nowType, //0 个人任务  2企业任务  3部门任务
          typeId: state.affiliation.ascriptionId, // 任务类型id
          oldTaskId: datas.oldTaskId || undefined,
        },
        operateUser: nowUserId,
      }
    }

    editTaskSave(param)
  }
  //修改公开私密
  const editPrivate = () => {
    const param = {
      id: state.taskId,
      property: state.private == 0 ? 1 : 0,
      operateUser: nowUserId,
    }
    editTaskSave(param, true)
  }
  //修改任务类型
  const taskState = (value: any) => {
    const param = {
      id: state.taskId,
      operateUser: nowUserId,
      type: value,
    }
    editTaskSave(param)
  }
  //设置任务描述
  const editorChange = (html: string) => {
    setEditortext(html)
  }
  //修改任务描述
  const editorOk = () => {
    // console.log('当前editAuth', editAuth)
    if (!editAuth) {
      return
    }
    const param = {
      id: state.taskId,
      operateUser: nowUserId,
      description: editortext,
    }
    editTaskSave(param)
    setEditorShow(false)
  }
  //修改进度
  const editSlider = (value: any) => {
    const param = {
      taskId: state.taskId,
      operateUser: nowUserId,
      userId: nowUserId,
      process: value,
    }
    const url = '/task/log/addTaskLog'
    editTasklogApi(param, url).then((resData: any) => {
      if (resData.returnCode == 0) {
        message.success('编辑任务成功')
        queryTaskDetail(state.taskId)
        //刷新右上角按钮权限
        if (state.progress == 0 || value == 100 || value == 0) {
          refBtnAuths()
        }
        // 拖动到100同一键完成
        if (value == 100 && fromtype.includes('taskManage')) {
          refreshTaskManageList({ optType: 'finish' })
          refreshReport()
        }
        // props.callbackFn()
        refreshFn('finish')
      } else {
        message.error(resData.returnMessage)
        setLoading(false)
      }
    })
  }
  //保存获取参与企业信息
  const EnterpriseList = (datas: any) => {
    const list = datas
    const newArr = []
    for (let i = 0; i < list.length; i++) {
      newArr.push({
        teamId: list[i].id,
        userId: list[i].userId,
        isExtends: '0',
        status: '0',
      })
    }
    return newArr
  }
  //新增删除参与企业
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
      const param = {
        id: state.taskId,
        operateUser: nowUserId,
        teamList: EnterpriseList(list),
      }
      editTaskSave(param)
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
        const param = {
          id: state.taskId,
          operateUser: nowUserId,
          teamList: EnterpriseList([...list, ...datas]),
        }
        editTaskSave(param)
      } else {
        //新增
        const param = {
          id: state.taskId,
          operateUser: nowUserId,
          teamList: EnterpriseList([...state.enterprise, ...datas]),
        }
        editTaskSave(param)
      }
    }
  }
  //再次邀请
  const inviteAgain = (teamId: any, userId: any) => {
    setLoading(true)
    const param = {
      taskId: state.taskId,
      userId: nowUserId,
      teamId: teamId,
    }
    const url = '/task/joinTeam/inviteAgain'
    inviteAgainApi(param, url).then((resData: any) => {
      if (resData.returnCode == 0) {
        message.success('已邀请')
        queryTaskDetail(state.taskId)
        setLoading(false)
      } else {
        message.error(resData.returnMessage)
        setLoading(false)
      }
    })
  }
  //编辑循环
  const editCycleModel = (datas: any) => {
    // dispatch({
    //   type: 'cycleModel',
    //   data: datas,
    // })
    const param = {
      id: state.taskId,
      operateUser: nowUserId,
      cycleModel: datas,
    }
    editTaskSave(param)
  }
  //删除循环
  const delCycleModel = () => {
    const param = {
      id: state.taskId,
      operateUser: nowUserId,
      cycleModel: {
        flag: 1,
      },
    }
    editTaskSave(param)
  }
  //上传附件
  const updetaFile = (fileUserList: any) => {
    const fileList: any = []
    fileUserList.forEach((file: any) => {
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
            id: '',
            fileKey: file.uid + '.' + fileSuffix,
            fileName: file.name,
            fileSize: file.size,
            dir: 'task',
          })
        }
      }
    })
    const param = {
      id: state.taskId,
      operateUser: nowUserId,
      fileModels: fileList,
    }
    const url = '/task/modify/id'
    editTaskSaveApi(param, url).then((resData: any) => {
      if (resData.returnCode == 0) {
        message.success('编辑任务成功')
        $store.dispatch({ type: 'EDIT_DETAIL_ID', data: resData.data.id })
      } else {
        message.error(resData.returnMessage)
      }
    })
  }
  //保存编辑任务 refreshReportData：改变任务公开、私密状态
  const editTaskSave = (param: any, refreshReportData?: boolean) => {
    const url = '/task/modify/id'
    editTaskSaveApi(param, url).then((resData: any) => {
      if (resData.returnCode == 0) {
        message.success('编辑任务成功')
        queryTaskDetail(resData.data.id)
        if (refreshReportData) {
          getForceReportList(props.param.id)
          refreshReport()
        }
        // setdetailData(resData.data)
        $store.dispatch({ type: 'EDIT_DETAIL_ID', data: resData.data.id })
        refreshFn()
      } else {
        message.error(resData.returnMessage)
      }
    })
  }
  //刷新
  const refreshFn = (optType?: string) => {
    if (fromtype.includes('taskManage')) {
      //任务管理 刷新列表
      refreshTaskManageList({ optType: '' })
    } else if (props.callbackFn) {
      if (optType) {
        props.callbackFn(optType)
      } else {
        props.callbackFn()
      }
    }
    //刷新右上角按钮权限
    refBtnAuths()
  }
  /**
   * 判断是否有子任务tab
   */
  const hasChildTab = () => {
    let flag = true
    // 宽详情没有子任务
    if (fromtype && fromtype.includes('taskManage_wideDetail')) {
      flag = false
    }
    return flag
  }
  //过滤 inputNumber 只能输入正整数
  const limitDecimals = (value: any) => {
    return value.replace(/^(0+)|[^\d]+/g, '')
  }
  // console.log(fileModelss)
  const tagIcon = $tools.asAssetsPath(`/images/task/${state.tags.icon}.png`)
  const Overlay = ({ reportid, hasDelete }: any) => {
    return (
      <div className="reportDropdown">
        <div className="title">未写汇报</div>
        <ul className="list-content">
          {noWriteReport.datas.map((item: any, index: number) => {
            const text = `${item.reporterName} 欠 ${item.receiver} ${item.delayNum}条 未写汇报`
            return (
              <li key={index} className="item">
                <Tooltip title={text} overlayClassName="my-tooptip-z-99999">
                  <div className="reportLabel">
                    <span className="people">{`${item.reporterName} 欠 ${item.receiver}`}</span>
                    <span className="number">{item.delayNum}</span> <span className="cell">条</span>
                    <span>未写汇报</span>
                  </div>
                </Tooltip>
                {hasDelete && (
                  <span
                    className="clearReport"
                    onClick={(e: any) => {
                      clearForceNoWrite(reportid, item.reporter, index, text)
                    }}
                  >
                    清空
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  // 未写汇报
  const RenderWriteReportBtn = ({
    reportid,
    hasDelete,
    index,
  }: {
    reportid: any
    hasDelete: boolean
    index: number
  }) => {
    return (
      <Dropdown
        placement="topRight"
        overlay={<Overlay reportid={reportid} hasDelete={hasDelete} />}
        trigger={['click']}
        visible={noWriteReport.visible && noWriteReport.index == index}
        onVisibleChange={visible => {
          setNoWriteReport({ ...noWriteReport, index, visible })
        }}
      >
        <span
          className="lookreport"
          onClick={(e: any) => {
            e.stopPropagation()
            // 获取未写汇报数据
            getForceCountNoWrite(reportid, index, true)
          }}
        >
          查看未写汇报
        </span>
      </Dropdown>
    )
  }
  return (
    <Spin spinning={loading} tip={'加载中，请耐心等待'}>
      <div className="processTaskDetailOpenCon" ref={refComplete}>
        {/* 头部信息 进度 状态 开始结束时间等 */}
        <section className="taskProgressSec flex space_between flex_wrap">
          {/* 派发人 */}
          <div className="detailTopUser">
            <span className="create_user">由{state.createuser}创建</span>
          </div>
          <div className={`task_status_box ${state.taskStatus.class}`}>
            <span className="img_icon status_icon"></span>
            <div className="status_txt_box">
              <div className="status_txt">{state.taskStatus.name}</div>
              <div className="task_surplus_time baseGrayColor">(剩余{state.taskStatus.remianDays || 0}天)</div>
            </div>
          </div>
          <div className="progress_right">
            <div className="progress_mid" key={state.progress}>
              {/* 客观进度 */}
              {taskDetalis && (
                <Tooltip title={`客观进度：${taskDetalis.objectiveProcess || 0}%`}>
                  <span
                    className="impersonality_process"
                    style={{ left: `${(330 * taskDetalis.objectiveProcess) / 100}px` }}
                  ></span>
                </Tooltip>
              )}
              <Slider
                min={0}
                max={100}
                step={stepnum}
                // defaultValue={state.progress}
                defaultValue={taskDetalis && taskDetalis.progress ? taskDetalis.progress : state.progress}
                disabled={taskDetalis && taskDetalis.progress == 100 ? true : false}
                onChange={(value: any) => {
                  setInputValue(value)
                  setStepnum(5)
                }}
                onAfterChange={(value: any) => {
                  editSlider(value)
                }}
                tipFormatter={() => {
                  return (
                    <span>
                      {taskDetalis && taskDetalis.processUser}评估了该进度为{inputValue || state.progress}%
                    </span>
                  )
                }}
                value={inputValue}
              />
              <InputNumber
                min={0}
                max={100}
                value={!inputValue ? state.progress : inputValue}
                disabled={state.progress == 100 ? true : false}
                style={{ width: '28px', height: '28px' }}
                onChange={(value: any) => {
                  setInputValue(value)
                  setStepnum(1)
                }}
                formatter={limitDecimals}
                parser={limitDecimals}
                onBlur={(e: any) => {
                  editSlider(e.target.value)
                }}
              />
              <span className="percentbai">%</span>
            </div>
            {/* 开始截至时间 */}
            <div className="progress_bot flex">
              <div className="task_start_time_box">
                <span>开始:</span>
                <DatePicker
                  showTime
                  placeholder="点击设置"
                  bordered={false}
                  suffixIcon={<i></i>}
                  format={'YYYY/MM/DD HH:mm'}
                  value={state.startTime ? moment(state.startTime) : null}
                  onChange={(value: any) => {
                    editTimes(value, 'startTime')
                  }}
                />
              </div>
              <div className="task_end_time_box">
                <span className="tasknames-jz">截至:</span>
                <DatePicker
                  showTime
                  placeholder=""
                  allowClear={false}
                  bordered={false}
                  suffixIcon={<i></i>}
                  value={moment(state.endTime)}
                  format={'YYYY/MM/DD HH:mm'}
                  onChange={(value: any) => {
                    editTimes(value, 'endTime')
                  }}
                />
              </div>
            </div>
          </div>
        </section>
        {/* 任务名称 循环 优先级 标签 私密公开等 */}
        <section className="taskNameSec taskSignTagArea">
          {/* 任务名称 */}
          <div className="taskNameBox" key={state.taskName}>
            <span
              className={`taskNameShow ${nameShow ? 'hide' : ''}`}
              onClick={() => {
                //todo权限查询
                // console.log('当前的editAuth', editAuth)
                if (!editAuth) {
                  return
                }
                //编辑任务名称
                setNameShow(true)
              }}
            >
              {state.taskName}
            </span>
            <TextArea
              rows={4}
              className={`${nameShow ? '' : 'hide'}`}
              defaultValue={state.taskName}
              onBlur={editName}
              onPressEnter={editName}
            />
          </div>
          {/* 标签 */}
          <div className="selTagBoxOut">
            <TaskTags
              param={{
                from: 'details',
                teamId: state.affiliation.teamId,
              }}
              datas={state.tags}
              onOk={(datas: any) => {
                editIcon(datas, 'tags')
              }}
            ></TaskTags>
          </div>
          {/* 显示关注人 */}

          {state.followers.length > 0 && (
            <Tooltip title={`关注：${state.followers.join('、')}`}>
              <div className="attentionFlag">
                <em className="triangle_topleft"></em>
                <em className="img_icon attentionIcon"></em>
              </div>
            </Tooltip>
          )}
          {/* 标签 循环 优先级 私密公开 */}
          <div className="tagSignShowBox flex margin_diff">
            <ul className="attrTagShowBox flex flex_shrink_0">
              {/* 循环 */}
              <li className="attrTagItem setCycle addloop_data">
                <em className="img_icon attr_icon cycle_icon"></em>
                <Tooltip title={loopTaskListDataShow(state.cycleModel)}>
                  <span
                    className="attr_val"
                    onClick={() => {
                      setOpenloop(true)
                    }}
                  >
                    {cyctext || '设置循环'}
                    {cyctext && (
                      <em
                        className="img_icon del_icon"
                        onClick={(e: any) => {
                          e.stopPropagation()
                          delCycleModel()
                        }}
                      ></em>
                    )}
                  </span>
                </Tooltip>
              </li>
              {/* 优先级 */}
              <li className="attrTagItem setPriority relative">
                <em className="img_icon attr_icon star_icon"></em>
                <Dropdown
                  overlayClassName="selPriorityconetnt"
                  visible={priorityvis}
                  overlay={
                    <Priority
                      param={{
                        from: 'details',
                        teamId: attachType.typeId,
                        deptId: attachType.typeId,
                        roleId: attachType.typeId,
                        initDatas: state.priority, //用于反显的数据 0为清除
                        taskId: state.taskId,
                        ascriptionType: attachType.type,
                      }}
                      dropType="Dropdown"
                      visible={priorityvis}
                      onOk={(datas: any) => {
                        // console.log(datas)
                        editIcon(datas, 'Priority')
                        setPriorityvis(false)
                      }}
                      setvisible={(type: any) => {
                        setPriorityvis(type)
                      }}
                    ></Priority>
                  }
                  placement="bottomRight"
                  trigger={['click']}
                  onVisibleChange={(flag: boolean) => {
                    setPriorityvis(flag)
                  }}
                >
                  <span
                    className="attr_val"
                    onClick={(e: any) => {
                      e.preventDefault()
                      setPriorityvis(true)
                    }}
                  >
                    {state.priority.data}
                    {state.priority.type == 1 ? '级' : '星'}
                  </span>
                </Dropdown>
              </li>
              {/* 私密公开 */}
              <li
                className={`attrTagItem setProp ${state.private == 1 ? 'private' : ''}`}
                onClick={editPrivate}
              >
                <em className="img_icon attr_icon prop_icon"></em>
                <span className="attr_val">{state.private == 1 ? '私密' : '公开'}</span>
              </li>
            </ul>
            {/* 图标 */}
            <div className="sign_icon_box">
              {state.tags.icon && (
                <span
                  className="img_icon sign_icon"
                  // style={{
                  //   backgroundImage: `url(${tagIcon})`,
                  // }}
                >
                  <img
                    src={tagIcon}
                    style={{
                      width: '100%',
                    }}
                  />
                </span>
              )}
              <em className="img_icon del_icon" onClick={delIcon}></em>
            </div>
            {/* 标签 */}
            {state.tags.tags.length > 0 && (
              <div className="tagShowBox flex">
                <ul className="tag_list flex flex_wrap">
                  {state.tags.tags.map((item: any, index: number) => {
                    return (
                      <li key={index}>
                        {item.name}
                        {index == state.tags.tags.length - 1 ? '' : '/'}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>
        {/* 任务描述区域 */}
        <section className="taskDescriptionSec">
          <pre
            className="taskDescriptionShow"
            dangerouslySetInnerHTML={{ __html: state.editorText }}
            onClick={() => {
              console.log(state)
              console.log('编辑框内容', state.editorText)
              setEditorShow(true)
            }}
          ></pre>
        </section>
        {/* 责任人、执行人、领导责任人、督办人 */}
        <section className="taskSeveralAttrSec flex space_between">
          <div
            className="task-designated"
            onClick={() => {
              selectUser('1')
            }}
          >
            <Avatar className="oa-avatar default-head-g" size={32}></Avatar>
            <div className="designated-user">
              <p className="color-b">{state.executorUser.userName}</p>
              <p className="users-zx">执行人</p>
            </div>
          </div>
          <div
            className="task-designated"
            onClick={() => {
              selectUser('2')
            }}
          >
            <Avatar className="oa-avatar default-head-b" size={32}></Avatar>
            <div className="designated-user">
              <p className="color-b">{state.assignUser.userName}</p>
              <p>指派人</p>
            </div>
          </div>
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
        </section>
        {/* 基础信息及子任务 */}
        <Tabs defaultActiveKey="1" className="taskDetailBasicNav" onChange={() => {}}>
          <TabPane tab="基础信息" key="1">
            <section className="taskBasicSecBox">
              {/* 归属 */}
              <div className="mdContentRow belongRow">
                <div className="leftTit">
                  <span className="tit_icon"></span>
                </div>
                <div className="rightWrite ver_center" key={state.taskFormTetx} style={{ display: 'flex' }}>
                  <Select defaultValue={state.taskFormTetx} style={{ width: 110 }} onChange={taskState}>
                    <Option value="1">临时任务</Option>
                    <Option value="0">目标任务</Option>
                    <Option value="3">项目任务</Option>
                    <Option value="2">职能任务</Option>
                  </Select>
                  <div className="taskBelongBox">
                    <Tooltip title={state.affiliationText}>
                      <span
                        className="task_org_name"
                        onClick={() => {
                          selectUser('0')
                        }}
                      >
                        {state.affiliationText}
                      </span>
                    </Tooltip>
                  </div>
                </div>
              </div>
              {/* 参与企业 */}
              <div className="mdContentRow taskJoinCmyRow">
                <div className="leftTit">
                  <span className="tit_icon takeCompany-icon"></span>
                </div>
                <div className="rightWrite flex_wrap">
                  <span
                    className="takeCompany-text"
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
                    参与企业
                  </span>
                  <div className="takeCompanyBox">
                    <ul>
                      {state.enterprise.map((item: any, index: number) => {
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
                                  src={item.profile}
                                  className={`${!item.profile && 'noPortrait'}`}
                                />
                              </div>
                              <div className="text">
                                <p>{item.name}</p>
                                <p className="cmy_info_name_box ">
                                  <span className="cmy_info_name ">联系人:{item.username}</span>
                                  <span className={`join_cmy_status ${statusClass}`}>{statusTxt}</span>
                                </p>
                              </div>
                            </div>
                            <div className="joinCmyRig">
                              <span className="img_icon del_cmy_icon hide" onClick={() => {}}></span>
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
                      })}
                    </ul>
                  </div>
                </div>
              </div>
              {/* 任务来源 */}
              <div className="mdContentRow taskSourceRow">
                <div className="leftTit">
                  <span className="tit_icon taskSourceRow-icon"></span>
                </div>
                <div className="rightWrite flex_wrap">
                  <span className="source-text">任务来源</span>
                </div>
              </div>
              {/* 附件 */}
              <div className="mdContentRow taskFilesRow">
                <div className="leftTit">
                  <span className="tit_icon taskFilesRow-icon"></span>
                </div>
                <div className="rightWrite flex_wrap">
                  <UploadFile
                    fileModels={fileModeles}
                    fileChange={fileListRes => {
                      console.log('status', fileListRes.file, fileListRes.fileList)
                      // console.log('要上传的文件', fileListRes)
                      setFileUserList(fileListRes)
                      //执行上传附件
                      updetaFile(fileListRes)
                    }}
                    showUploadList={true}
                    dir="task"
                    showText="添加附件"
                    showIcon={false}
                    windowfrom={`${props.from == 'work-plan' ? 'workplanMind' : 'mainWin'}`}
                  />
                  {/* <Upload {...propss}>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                      Support for a single or bulk upload. Strictly prohibit from uploading company data or
                      other band files
                    </p>
                  </Upload> */}
                </div>
              </div>
              {/* 添加汇报设置 */}
              <div className="mdContentRow reportsRow">
                <div className="leftTit">
                  <span className="tit_icon reportset-icon"></span>
                </div>
                <div className="rightWrite flex_wrap">
                  <Tooltip
                    placement="topLeft"
                    visible={notValidReport}
                    title={
                      <span className="tooltop-content">
                        <span className="my-red-tip">!</span>
                        <span> 该汇报设置无效，汇报相关人不是任务干系人，不能查看私密任务</span>
                        <em
                          className="img_icon del_icon"
                          onClick={(e: any) => {
                            e.stopPropagation()
                            //  编辑无效任务提示
                            setNotValidRport(false)
                          }}
                        ></em>
                      </span>
                    }
                    overlayClassName="my-tooltip-cus my-tooptip-width-auto"
                    // color="#fff"
                  >
                    <span
                      className="source-text"
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
                            from: 'taskdetailLeft', //来源
                            isdetail: 0, //是否为详情 1详情 0设置 2编辑
                            taskid: taskDetalis.id, //任务id 0:未创建任务，创建临时汇报
                            reportid: '', //强制汇报id
                            createTime: '', //创建时间
                            startTime: state.startTime, //开始时间
                            endTime: state.endTime, //结束时间
                            teamId: state.affiliation.teamId, //企业id
                            reportPerson, //执行人数据
                            receiverPerson, //汇报对象数据
                            copyPerson, //抄送数据
                            teamConcatPerson, //企业联系人
                          },
                        })
                      }}
                    >
                      添加汇报设置
                    </span>
                  </Tooltip>
                </div>
              </div>
              {/* 汇报列表数据 */}
              <div className="reportsList">
                <ul>
                  {reportList.map((item: any, index: number) => {
                    const flag = item.flag == 2

                    return (
                      <Tooltip
                        placement="topLeft"
                        title={flag ? '该汇报设置无效，汇报相关人不是任务干系人，不能查看私密任务' : ''}
                        overlayClassName="my-tooptip-width-auto"
                        key={index}
                      >
                        <li className="reportsItem">
                          <div
                            className={`left ${flag ? 'redBg' : ''}`}
                            onClick={() => {
                              if (item.hasDelete) {
                                const teamConcatPerson: any[] = updatePersonData(
                                  state,
                                  'enterprise',
                                  3,
                                  'teamconcat'
                                )
                                setOpenforceParam({
                                  visible: true,
                                  param: {
                                    from: 'taskdetailLeft', //来源
                                    isdetail: 2, //是否为详情 1详情 0设置 2编辑
                                    taskid: item.taskid, //任务id
                                    reportid: item.id, //强制汇报id
                                    createTime: '', //创建时间
                                    startTime: state.startTime, //开始时间
                                    endTime: state.endTime, //结束时间
                                    // private: state.private, //任务状态
                                    teamId: state.affiliation.teamId, //企业id
                                    teamConcatPerson,
                                  },
                                })
                              }
                            }}
                          >
                            <div className="text">{`${item.reporter} ${item.forceTime} 向 ${item.receiver} 汇报`}</div>

                            {item.hasDelete && (
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

                          {item.hasDelay && item.hasDelay != 0 ? (
                            <RenderWriteReportBtn reportid={item.id} hasDelete={item.hasDelete} index={index} />
                          ) : (
                            ''
                          )}
                        </li>
                      </Tooltip>
                    )
                  })}
                </ul>
              </div>
            </section>
          </TabPane>
          {hasChildTab() ? (
            <TabPane tab="子任务" key="2">
              {taskDetalis && (
                <div className="childTaskHeader">
                  <div className="level_count_box">
                    当前第<span>{taskDetalis.level}</span>层，拥有<span>{taskDetalis.subTaskCount}</span>
                    个子任务
                  </div>
                  {props.isaddtask != 'okr_draft' && (
                    <div
                      className="add_child_btn"
                      onClick={() => {
                        setOpencreattask(true)
                      }}
                    >
                      <em className="img_icon add_child_icon"></em>
                      <span>新增子任务</span>
                    </div>
                  )}
                </div>
              )}
              {/* 子任务树 */}
              {initTree}
            </TabPane>
          ) : (
            ''
          )}
        </Tabs>
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
              onSure: selMemberSure,
            }}
          />
        )}
        {/* 任务描述弹出层 */}
        {editorShow && (
          <Modal
            title="任务描述"
            visible={editorShow}
            maskClosable={false}
            keyboard={false}
            className={`taskEditor ${editAuth ? '' : 'disabled_bottom'}`}
            onOk={editorOk}
            onCancel={() => {
              setEditorShow(false)
            }}
          >
            <div className="">
              <Editor
                editorContent={state.editorText}
                editorChange={editorChange}
                height={365}
                maxHeight={365}
                className="detailDesEditor"
                previewArea=".detailDesEditor"
              />
            </div>
          </Modal>
        )}
        {/* 选择参与企业 iseditenterprise:是否是修改企业联系人 */}
        {enterpriseShow && (
          <ParticipateEnterprise
            param={{
              visible: enterpriseShow,
              orgId: iseditenterprise ? enterpriseid : '', //指定企业
              orignodeUsers: iseditenterprise && enterpriseinfo, //点击修改联系人参与企业
              typeframe: iseditenterprise ? 'Radio' : 'Checkbox',
              notOrgIds: iseditenterprise ? [enterpriseid] : [state.affiliation.teamId], //排除企业
              selectUserlist: taskDetalis.teamList || [], //已选企业联系人
            }}
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
        {/* 创建子任务 */}
        {opencreattask && (
          <CreatTask
            param={{ visible: opencreattask }}
            datas={{
              from: 'taskdetail', //来源
              isCreate: 2, //创建0 编辑1 创建子任务2
              taskid: taskDetalis.id, //任务id
              taskdata: taskDetalis, //任务信息
              nowType: 0, //0个人任务 2企业任务 3部门任务
              teaminfo: '', //企业信息
            }}
            setvisible={(state: any) => {
              setOpencreattask(state)
            }}
            callbacks={(code: any) => {
              if (props.from == 'work-plan') {
                props.callbackFn()
              }
            }}
          ></CreatTask>
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
                editCycleModel(datas)
                console.log(datas)
              },
            }}
          ></LoopsTask>
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
              console.log(reportData)
              // updateReportList(reportData)
            }}
            onOk={(datas: any) => {
              // getTaskDetails()
              // 刷新汇报数据
              // props.callbackFn()
              getForceReportList(props.param.id)
              refreshTaskLogDetails && refreshTaskLogDetails()
            }}
          ></Forcereport>
        )}
      </div>
    </Spin>
  )
}
export default Details

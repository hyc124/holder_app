/**公用右键菜单 */
import React, { useEffect, useRef, useState } from 'react'
import { Menu, message, Modal, Input, Tooltip, Spin, Divider } from 'antd'
import { SelectMemberOrg } from '../../../components/select-member-org/index'
import CreatTask from '../../task/creatTask/creatTask'
import Editor from '@/src/components/editor/index'
import ChatForwardModal from '@/src/components/chat-forward-modal'
import './TaskListOpt.less'
import {
  execute,
  finishTask,
  unFinish,
  TransferRequest,
  Taskownership,
  TaskFileSave,
  TaskFileSaveRecall,
  FrozenTask,
  circulationFrozenTask,
  queryAlreadyfollowUser,
  // queryTaskSub,
  savefollowUser,
  taskUrg,
  taskDelete,
  taskReplay,
} from './taskOptData'
import { AssignTaskModal, followTask, unFollowTask } from '@/src/views/task/taskOptCom/taskOptCom'
// import { ShareToRoomModal } from '../../workplan/WorkPlanModal'
// import { refreshDetails } from '@/src/views/task/taskDetail/details'
import { arrObjDuplicate } from '@/src/common/js/common'
import { ipcRenderer } from 'electron'
import { queryTaskById } from '../../task/taskComApi'
import Forcereport from '../../force-Report/force-Report'
import { editDetailApi } from '../../task/taskDetails/detailApi'
import { taskOptBtnsObj } from '../../task/taskDetails/detailBtns'
import { findEditMember, saveEditMember } from '../../workplan/WorkPlanOpt'
import { deleteKrNodesApi } from '../../work-plan-mind/getData'
import { topedFolder, cancelFolder } from '../okrKanban/getData'
import { CreateTaskModal } from '../../task/creatTask/createTaskModal'
import { auto } from 'async'
const { SubMenu } = Menu
const { TextArea } = Input
interface ParamsProps {
  id: number
  userId: number
  viewType: number
  mainId?: any
}
interface ArrItemProps {
  code: number
  status: number
  name: string
  isUse: number
}
interface TempProps {
  taskOptData: any
  code?: string //可选参数，工作台需要code进行刷新，其他地方根据自己需要进行传递
  callback: (params?: any) => void //params可选参数:回调可根据自己的需要传递相应的参数
  getMenuFn?: (res?: any) => void //将后台请求的按钮权限数据返回给调用处
  btnSort?: Array<number | string> //展示按钮和排序（按钮code数组）
  btnSortType?: string //展示按钮和排序判断类型 name、code
  outVisible?: boolean //外部控制显示隐藏
  outvisibleFalse?: boolean //工作台控制outVisible为false的时候不直接return
  setVisible?: any //外部控制显示隐藏设置方法
  isWorkDeskIn?: boolean
  reminderSet?: boolean //是否显示任务提醒设置
  sourceType?: string //菜单来源信息
}
interface UserProps {
  curId: any
  curType: any
  curName: string
  parentId: number
  parentName: string
  parentType: number
  cmyId: string
  cmyName: string
  deptId: number
  deptName: string
  roleId: number
  roleName: string
  showName: string
  profile: string
}
interface TaskInfoProps {
  ascriptionId: number
  ascriptionType: number
  ascriptionName: string
  taskId: number
  taskName?: string
  taskType: number
  createUserName: string
  liableAccount: string
  liableUser: string
  cmyId?: string
  cmyName?: string
  deptName?: string
  userId?: number
  deptId?: string
  roleId?: string
  roleName?: string
  parentId?: string
  parentName?: string
  liableUserName?: string
  profile?: string
}
let nowTaskName = '任务'
// 编辑权限全局变量
let editAuth = false
const TaskListOpt = ({
  taskOptData,
  code,
  callback,
  getMenuFn,
  btnSort,
  btnSortType,
  outVisible,
  setVisible,
  // isWorkDeskIn,
  outvisibleFalse,
  reminderSet,
  sourceType,
}: TempProps) => {
  const { nowUserId, nowAccount, loginToken, nowUser, userInfo, selectTeamId } = $store.getState()
  // let { taskId, mainId, ascriptionId } = taskOptData.rowObj
  //按钮组
  const [menuBtns, setMenuBtn] = useState([])
  // const FONTA = btnSort ? btnSort : [1, 2, 3, 5, 6, 15, 12, 13, 7, 8, 9, 10, 17, 20, 22, 23, 19]
  // 开启-1 汇报-3 催办-17 移交-6 指派-5 编辑-2 变更归属-15 分享-20 关注任务-7 冻结-10 归档-9 复盘-8 设置：任务关注人-23、汇报设置-22 设置权限-25 重命名-26
  // 发起：发起审批-12、发起会议-13  删除-19
  const FONTA = btnSort ? btnSort : [1, 3, 17, 6, 5, 2, 15, 20, 7, 10, 9, 8, 23, 25, 26, 27, 22, 12, 13, 19]

  //获取存储的信息
  const [rowInfo, setRowInfo] = useState<any>({})
  const [fromType, setFromType] = useState('')
  //MENU菜单是否展示
  const [showMenu, setShowMenu] = useState(false)
  //加载Loading
  const [loading, setLoading] = useState(false)
  //指派任务弹窗
  const [assignVisble, setAssignVisble] = useState(false)
  // 指派任务弹窗参数
  const [assignParam, setAssignParam] = useState<any>({})
  //复盘任务弹窗
  const [replayVisble, setReplayVisble] = useState(false)
  //打开创建任务
  const [opencreattask, setOpencreattask] = useState(false)
  //打开强制汇报
  const [openforce, setOpenforce] = useState(false)
  //任务移交弹窗
  const [transferVisble, setTransferVisble] = useState(false)
  //   备注
  // const reasonRef = useRef<any>({})
  const [textAreaText, setTextAreaText] = useState('')
  //归档弹窗
  const [fileVisble, setFileVisble] = useState(false)
  //冻结任务弹窗
  const [frozenVisble, setFrozenVisble] = useState(false)
  //解冻任务确认框
  const [thawVisble, setThawVisble] = useState(false)
  //删除任务确认框
  const [taskDeleteVisble, setTaskDeleteVisble] = useState(false)
  //催办任务确认框
  const [urgVisble, setUrgVisble] = useState(false)
  //冻结框多行输入
  const [remarkValue, setRemarkValue] = useState('')
  //解冻当前行任务名称
  const [taskName, setTaskName] = useState('')
  //选人插件
  // const [memberOrgShow, setMemberOrgShow] = useState(false)
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState<any>({ visible: false })
  //选中的人员
  const [user, setUser] = useState<Array<UserProps>>([])
  //复盘富文本信息
  const [editorText, setEditorText] = useState<any>()
  //任务移交表标识
  // const [fromMsg, setFromMsg] = useState('')
  //分享到工作组弹窗
  const [shareToRoomParam, setShareToRoomParam] = useState<any>({})
  // 分享发出的内容
  const [shareCon, setShareCon] = useState<any>('')
  //存储当前任务子元素的数量
  const [childLen, setChildLen] = useState(0)
  //催办部分参数
  const [urgParam, setUrgParam] = useState({
    urgeTeamName: '', // 催办任务的所属团队名
    urgeTaskName: '', // 催办任务的任务名
    urgeTaskId: 0, // 记录催办的任务id
    urgeCookieName: '', // 记录存储到cookie的任务键名
  })
  //删除任务部分参数
  const [deletParms, setDeletParm] = useState({
    id: 0,
    taskName: '',
    fromType: '',
    iskr: 0,
    datas: {},
  })
  //参数存储
  const [taskFileParams, setTaskFileParams] = useState({
    id: 0,
    name: '',
    ascriptionId: 0,
    ascriptionName: '',
    fromType: '',
    _level: 0,
    status: 0,
  })
  //冻结参数
  const [frozenParam, setFrozenParam] = useState({
    id: 0,
    taskName: '',
    status: 0,
    attention: '',
    level: 0,
  })
  //复盘参数
  const [replyParm, setReplyParm] = useState({
    getTaskId: 0,
    fromType: '',
  })
  //当前行数据信息
  const [taskData, setTaskData] = useState({
    id: 0,
    name: '',
    approvalStatus: 0,
    ascriptionId: 0,
    ascriptionName: '',
    teamLogo: '',
    liable: {
      userId: 0,
      username: '',
      profile: '',
      account: '',
      roleId: 0,
      roleName: '',
      deptId: 0,
      deptName: '',
    },
    execute: {
      userId: 0,
      username: '',
      account: '',
    },
    endTime: '',
    executeTime: '',
    description: '',
    property: 0,
    status: 0,
    flag: 0,
    level: 0,
    reminder: 0,
    attach: {
      id: 0,
      typeId: 0,
      type: 0,
      typeName: '',
      star: 0,
      setType: 0,
      profile: '',
    },
    process: 0,
    subTaskLevels: 0,
    remianDays: 0,
    type: 0,
    createUsername: '',
  })
  //移交任务信息
  const [removeTaskInfo, setRemoveTaskInfo] = useState<TaskInfoProps>({
    ascriptionId: 0,
    ascriptionType: 0,
    ascriptionName: '',
    taskId: 0,
    taskName: '',
    taskType: 0,
    createUserName: '',
    liableAccount: '',
    liableUser: '',
    cmyId: '',
    cmyName: '',
    deptName: '',
    userId: 0,
    deptId: '',
    roleId: '',
    roleName: '',
    parentId: '',
    parentName: '',
    liableUserName: '',
    profile: '',
  })
  //任务id
  const [taskId, setTaskId] = useState<any>('')
  //开始时间
  const [startTime, setStartTime] = useState<any>('')
  // 结束时间
  const [endTime, setEndTime] = useState<any>('')
  // 企业id
  const [teamIds, setTeamIds] = useState<any>('')
  //缓存任务升降级相关参数
  let Demotioneing: any = {}
  //归档需要的参数 (未知)
  let _resourceListInfo = []
  // 缓存企业联系人数据
  const [teamConcatPerson, setTeamConcatPerson] = useState<any[]>([])
  // 创建任务弹框组件
  const createTaskRef = useRef<any>({})
  //任务右键菜单
  useEffect(() => {
    if (typeof outvisibleFalse == 'undefined' && outVisible === false) {
      return
    }
    setTaskId(taskOptData.rowObj.id)
    setStartTime(taskOptData.rowObj.startTime)
    setEndTime(taskOptData.rowObj.endTime)
    setTeamIds(taskOptData.rowObj.ascriptionId)
    getTaskBtn(taskOptData).then((res: any) => {
      const newData: any = sortData(res.dataList)
      const btnsAuth: any = taskOptBtnsObj({ btnsList: res.dataList || [] })
      // 无编辑权限和归档任务都不可编辑
      if (btnsAuth['UPDATE'] && btnsAuth['UPDATE'].isUse) {
        editAuth = true
      } else {
        editAuth = false
      }
      setMenuBtn(newData)
      setTaskData(res.data)
      nowTaskName = taskOptData.rowObj.type == 3 || taskOptData.rowObj.type == 2 ? '项目' : '任务' //type 5---项目  1--任务
      if (getMenuFn) {
        getMenuFn({ data: res.data, btnList: res.dataList })
      }
      setShowMenu(true)
    })
    //查询是否存在子任务
    // queryTaskSub({
    //   taskId: taskId,
    //   loginUserId: nowUserId,
    // }).then((resData: any) => {
    //   const childrenLen = resData.dataList.length
    //   console.log(childrenLen)
    //   setChildLen(childrenLen)
    // })

    // 查询企业联系人
    queryJoinTeamsConcats(taskOptData.rowObj.id)
    queryTaskById({ taskIds: [taskOptData.rowObj.id || ''] }).then((dataList: any) => {
      const getTask = dataList[0] || {}
      setChildLen(getTask.subTaskCount || 0)
    })
    return () => {
      setMenuBtn([])
    }
  }, [taskOptData.rowObj])

  useEffect(() => {
    console.log('右键的操作', outVisible)
  }, [outVisible])

  //查询按钮信息
  const getTaskBtn = (data: any) => {
    const { fromType, rowObj } = data
    setRowInfo(rowObj)
    setFromType(fromType)
    const { typeId, id } = rowObj
    let viewType = 0
    if (fromType.indexOf('taskManage') > -1) {
      viewType = 1
    }
    if (fromType.indexOf('detail') > -1) {
      viewType = 2
    }
    const param: ParamsProps = {
      id: typeId || id,
      userId: nowUserId,
      viewType: viewType,
    }
    if (fromType == 'okr-quadrant') {
      param.viewType = 4
      param.mainId = rowObj.mainId
    }
    return new Promise(resolve => {
      $api
        .request('/task/findOperationBtn', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(data => {
          resolve(data)
        })
    })
  }
  // 查询加入企业联系人
  const queryJoinTeamsConcats = (taskId: any) => {
    if (!taskId) return
    const param = {
      taskId: taskId,
    }
    $api
      .request('/task/queryJoinTeams', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then((resData: any) => {
        if (resData.returnCode == 0) {
          const datas = resData.dataList || []
          const _newDatas: any = []

          datas.map((item: any) => {
            const obj = {
              curId: item.userId,
              curName: item.username,
              username: item.username,
              userId: item.userId,
              curType: 0,
              profile: item.profile,
              // codeList: [`${item.teamName}-企业联系人`],
              codeList: [`企业联系人`],
              type: 3,
            }
            _newDatas.push(obj)
          })
          const uniqueData = arrObjDuplicate([..._newDatas], 'curId')
          setTeamConcatPerson(uniqueData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }
  //执行回调刷新当前模块
  // optType操作类型 data成功后后台返回的数据
  const refreshPage = ({
    data,
    optType,
    taskId,
    parentId,
    createType,
    newTaskId,
    parentIdOld,
  }: {
    optType: string
    data?: any
    taskId?: any
    [propName: string]: any
  }) => {
    // console.log(taskId, callback)
    callback({
      code,
      data,
      optType,
      taskId,
      parentId,
      createType,
      newTaskId,
      parentIdOld,
    })
  }
  //设置复盘信息
  const editorChange = (html: string) => {
    setEditorText(html)
  }
  //按钮按code排序
  const sortData = (dataList: any) => {
    const nowArr: Array<ArrItemProps | any> = []
    for (let i = 0; i < FONTA.length; i++) {
      for (let j = 0; j < dataList.length; j++) {
        const thisVal = btnSortType == 'name' ? dataList[j].name : dataList[j].code
        if (FONTA[i] == thisVal) {
          // 将设置关注人和设置汇报组合成数组
          // if (FONTA[i] == 22 || FONTA[i] == 23) {
          //   const arr =
          //     dataList[j + 1] && (dataList[j + 1].code == 22 || dataList[j + 1].code == 23)
          //       ? [dataList[j], dataList[j + 1]]
          //       : [dataList[j]]
          //   nowArr.push(arr)
          //   i++
          // } else {
          nowArr.push(dataList[j])
          // }
          break
        }
      }
    }
    return nowArr
  }
  //开启任务 一键完成 取消完成
  const statrTask = (status: number, getid: number, percent: number) => {
    switch (status) {
      case 2: //一键完成
        finishTask(getid, percent).then(
          () => {
            message.success('操作成功')
            ipcRenderer.send('update_unread_num', [''])
            refreshPage({
              optType: 'finish',
              taskId: taskId,
            })
          },
          data => {
            message.error(data.returnMessage)
          }
        )
        break
      case 3: //取消一键完成
        unFinish(getid).then(
          () => {
            message.success('操作成功')
            ipcRenderer.send('update_unread_num', [''])
            refreshPage({
              optType: 'unfinish',
              taskId: taskId,
            })
          },
          err => {
            message.error(err.returnMessage)
          }
        )
        break
      default:
        //启动1111
        execute(getid, 1).then(
          () => {
            message.success(`启动${nowTaskName}成功`)
            refreshPage({
              optType: 'start',
              taskId: taskId,
            })
          },
          () => {
            message.error(`启动${nowTaskName}失败`)
          }
        )
    }
  }
  //指派任务
  // const appointTask = () => {
  //   setAssignVisble(false)
  // }

  //======移交任务模块START===============================================
  const transferTask = (
    taskId: number,
    taskType: number,
    liableAccount: string,
    liableUserName: string,
    taskName: string,
    liableUser: string,
    ascriptionId: number,
    ascriptionType: number,
    ascriptionName: string
    // fromMsg: string
    // rid: number
  ) => {
    setRemoveTaskInfo({
      ascriptionId: ascriptionId,
      ascriptionType: ascriptionType,
      ascriptionName: ascriptionName,
      taskId: taskId,
      taskType: taskType,
      createUserName: liableUserName,
      liableAccount: liableAccount,
      liableUser: liableUser,
    })
    setUser([])
    setTransferVisble(true)
    // setFromMsg(fromMsg)
  }
  const selectUser = () => {
    setSelMemberOrg({
      visible: true,
      teamId: removeTaskInfo.ascriptionId,
      selectList: user,
      allowTeamId: [removeTaskInfo.ascriptionId],
      checkboxType: 'radio',
      onSure: (dataList: any) => {
        setAcceptPer(dataList)
      },
    })
    // setMemberOrgShow(true)
  }
  //任务移交 设置接收人
  const setAcceptPer = (userList: any) => {
    setUser(userList)
    if (userList.length != 0) {
      const vals = userList[0].curName
      // const ids = userList[0].curId
      // const account = userList[0].account
      const userInfo = {
        cmyId: userList[0].cmyId,
        cmyName: userList[0].cmyName,
        deptName: removeTaskInfo.ascriptionType == 1 ? '' : userList[0].deptName,
        userId: userList[0].curId || '',
        deptId: removeTaskInfo.ascriptionType == 1 ? '' : userList[0].deptId,
        roleId: removeTaskInfo.ascriptionType == 1 ? '' : userList[0].roleId,
        roleName: removeTaskInfo.ascriptionType == 1 ? '' : userList[0].roleName,
        parentId: userList[0].parentId,
        parentName: userList[0].parentName,
        liableUserName: vals,
        profile: userList[0].profile,
      }
      setRemoveTaskInfo({ ...removeTaskInfo, ...userInfo })
    }
  }
  //任务移交确定操作
  const transferSure = () => {
    setLoading(true)
    if (user.length == 0) {
      message.error(`请选择${nowTaskName}接收人`)
      setLoading(false)
      return
    }
    const param = {
      id: removeTaskInfo.taskId,
      operateUser: nowUserId,
      operateUserName: nowUser,
      reason: textAreaText,
      liable: {
        userId: removeTaskInfo.userId,
        deptId: removeTaskInfo.deptId,
        roleId: removeTaskInfo.roleId,
        ascriptionId: removeTaskInfo.cmyId,
      },
    }
    TransferRequest(param).then(
      (data: any) => {
        setLoading(false)
        if (data.returnCode === 0) {
          const dataInfo = data.data || ''
          if (dataInfo != '' && dataInfo.approvalEventId != null) {
            // electron.remote.getGlobal('execute').approvTableName = dataInfo.name
            // //事件id
            // electron.remote.getGlobal('execute').teamName = dataInfo.ascriptionName
            // electron.remote.getGlobal('execute').teamId = dataInfo.ascriptionId
            // electron.remote.getGlobal('task').taskId = dataInfo.id
            // electron.remote.getGlobal('execute').newApprovalId = ''
            // //事件id
            // electron.remote.getGlobal('execute').eventId = dataInfo.approvalEventId
            // //审批类型
            // electron.remote.getGlobal('execute').approvalType = dataInfo.approvalEventName
            // electron.remote.getGlobal('execute').isType = dataInfo.ascriptionType == 2 ? 'org' : 'team'

            // electron.remote.getGlobal('execute').isHome = false
            // //事件类型
            // electron.remote.getGlobal('execute').eventType = 'task_change_liableuser'
            // //信息id
            // electron.remote.getGlobal('execute').taskId = dataInfo.id
            // //任务信息
            // electron.remote.getGlobal('execute').taskInfo = JSON.stringify(dataInfo)
            // //任务名称
            // electron.remote.getGlobal('execute').taskName = dataInfo.name
            // // 审批编辑
            // electron.remote.getGlobal('execute').isEdit = false
            // electron.remote.getGlobal('execute').fromMsg = fromMsg
            //调用审批接口获取表单
            // ipc.send('goalgo_execute_show')
            setTransferVisble(false)
            // $('.transfer-history-content .list-box').html('')
            return false
          }
          setTransferVisble(false)
          // $('.transfer-history-content .list-box').html('')
          message.success(`移交${nowTaskName}成功`)
          // TaskOpt.refreshPage({
          //   optType: 'transfer',
          //   fromMsg: fromMsg,
          //   nowTaskId: removeTaskInfo.taskId, //当前操作查询的任务
          // })
          //刷新当前模块
          refreshPage({
            optType: 'transfer',
            taskId: taskId,
          })
        } else {
          message.error(data.returnMessage)
        }
      },
      err => {
        message.error('操作任务失败')
      }
    )
  }
  //======移交任务模块END===========================================

  //======变更归属模块START=========================================
  const demotioneingTask = (
    taskId: number,
    taskName: string,
    type: string,
    ascriptionType: number,
    ascriptionId: number,
    ascriptionName: string,
    liableAccount: string,
    liableUsername: string,
    fromType: string,
    isUse: boolean
  ) => {
    if (!isUse) {
      return false
    }
    const selectAffi = taskData.attach || {}
    const selList = []
    if (selectAffi.typeId && selectAffi.typeName) {
      const selectObj = {
        curId: selectAffi.typeId,
        curName: selectAffi.typeName,
        userId: selectAffi.typeId,
        username: selectAffi.typeName,
        curType: selectAffi.type,
        cmyId: ascriptionId || '',
        cmyName: ascriptionName || '',
        profile: selectAffi.profile || '',
      }
      selList.push(selectObj)
    }
    // setMemberOrgShow(true)
    setSelMemberOrg({
      title: '选择归属',
      visible: true,
      findType: 3,
      sourceType: 'taskBelong',
      // teamId: ascriptionId,
      selectList: selList,
      allowTeamId: [ascriptionId],
      checkboxType: 'radio',
      // 5.2.4版只能选择企业和部门
      checkableType: [3, 2],
      fliterByType: {
        '1': {
          show: true,
          text: '按组织架构选择',
        },
        '2': {
          show: false,
          text: '按角色选择',
        },
        '3': {
          show: true,
        },
        '4': {
          show: false,
        },
      }, //控制显示的筛选类型（按组织架构，一级部门）
      onSure: (dataList: any) => {
        setAcceptPer(dataList)
        saveDemotioneingTask(
          {
            taskId: taskId, //任务id
            taskName: taskName, //任务名称
            type: type, //升降级类型 升级:up 降级:down
            ascriptionType: ascriptionType, //任务归属类型
            ascriptionId: ascriptionId, //任务归属ID
            ascriptionName: ascriptionName, //任务归属名称
            liableAccount: liableAccount, //当前任务负责人
            liableUsername: liableUsername, //当前任务负责人名称
            fromType: fromType, //升降级任务列表来源
          },
          dataList
        )
      },
    })
  }
  //======变更归属模块END===========================================
  //任务升降级
  const saveDemotioneingTask = (info: any, optDate: any, starNum?: any) => {
    const selectAffi = taskData.attach || {}
    // 改变归属不再联动级别
    const attachType = selectAffi.type || 0
    if (!starNum) {
      Demotioneing = info
      Demotioneing.optDate = optDate
    }
    if (Demotioneing.optDate.length == 0) {
      return
    }
    let attachModel = {}
    let tipsTexe = ''
    /**
     *  "star": 星级
     *  "type": 升降级类型：0个人 2企业 3部门
     *  "typeId": 升降级类型id
     */
    if (Demotioneing.optDate[0].curType == 2) {
      //企业
      tipsTexe = '企业级'
      attachModel = {
        star: starNum,
        type: attachType,
        typeId: Demotioneing.optDate[0].curId,
      }
    } else if (Demotioneing.optDate[0].curType == 3) {
      //部门
      tipsTexe = '部门级'
      attachModel = {
        star: starNum,
        type: attachType,
        typeId: Demotioneing.optDate[0].curId,
      }
    } else if (Demotioneing.optDate[0].curType == 0) {
      //人员
      tipsTexe = '个人岗位'
      attachModel = {
        star: starNum || 0,
        type: attachType,
        typeId: Demotioneing.optDate[0].curId,
      }
    }
    const param = {
      ascriptionId: Demotioneing.ascriptionId, //任务归属id
      ascriptionName: Demotioneing.ascriptionName, //任务归属名称
      ascriptionType: Demotioneing.ascriptionType, //任务归属类型
      createUser: Demotioneing.liableAccount, //当前任务负责人
      createUserName: Demotioneing.liableUsername, //当前任务负责人名称
      id: Demotioneing.taskId, //任务id
      remark: '', //备注
      operateUser: nowUserId,
      operateUserName: nowUser,
      attachModel: attachModel, //升降级附加信息
    }
    /**
     *  选择成员添加以下参数
     * "passiveDeptId": 部门id
     * "passiveDeptName": 部门名称
     * "passiveRoleId": 岗位id
     * "passiveRoleName": 岗位名称
     * "liableUser": 选择升降级 人员
     * "liableUsername": 选择升降级人员 名称
     */
    let obj = {}
    if (Demotioneing.optDate[0].selectType == 'teamUser') {
      //选择成员
      obj = {
        liableUser: Demotioneing.optDate[0].userId,
        liableUsername: Demotioneing.optDate[0].username,
        passiveDeptId: Demotioneing.optDate[0].deptId,
        passiveDeptName: Demotioneing.optDate[0].deptName,
        passiveRoleId: Demotioneing.optDate[0].roleId,
        passiveRoleName: Demotioneing.optDate[0].roleName,
      }
    }
    const newParams = { ...param, ...obj }
    setLoading(true)
    Taskownership(newParams).then(
      (data: any) => {
        if (data.returnCode === 0) {
          const dataInfo = data.data || ''
          refreshPage({
            optType: 'changeBelong',
            taskId: taskId,
          })
          if (dataInfo != '' && dataInfo.approvalEventId != null) {
            approvalSolve(dataInfo)
            //审批类型
            // electron.remote.getGlobal('execute').isType = dataInfo.ascriptionType == 2 ? 'org' : 'team'
            //事件类型
            // electron.remote.getGlobal('execute').eventType = dataInfo.eventType
            //任务信息
            // electron.remote.getGlobal('execute').demotioneingInfo = JSON.stringify(dataInfo)
            // electron.remote.getGlobal('execute').demotioneAttachModel = param.attachModel
            //任务名称
            // electron.remote.getGlobal('task').taskId = dataInfo.id
            return false
          }
          message.success('任务变更归属成功')
        } else {
          message.error(data.returnMessage)
        }
      },
      err => {
        console.log(err)
      }
    )
  }
  //==================归档任务START=====================================
  const taskFile = (
    id: number,
    name: string,
    ascriptionId: number,
    ascriptionName: string,
    fromType: string,
    _level: number,
    status: number
  ) => {
    setTaskFileParams({
      id: id,
      name: name,
      ascriptionId: ascriptionId,
      ascriptionName: ascriptionName,
      fromType: fromType,
      _level: _level,
      status: status,
    })
    // setFromMsg(fromType)
    // if (childLen > 0) {
    setFileVisble(true) //隐藏归档提醒框
    return
    // }
  }
  const fileTaskSure = () => {
    const { id, name, ascriptionId, ascriptionName, fromType, _level, status } = taskFileParams
    taskFileSure(id, name, ascriptionId, ascriptionName, fromType, _level, status)
  }
  const taskFileSure = (
    id: number,
    name: string,
    ascriptionId: number,
    ascriptionName: string,
    fromType: string,
    _level: number,
    status: number
  ) => {
    TaskFileSave({
      taskId: id,
      userId: nowUserId,
      operateUser: nowUserId,
      operateUserName: nowUser,
    }).then((data: any) => {
      const param: any = {
        taskId: id,
        userId: nowUserId,
        operateUser: nowUserId,
        operateUserName: nowUser,
      }
      if (status == 2) {
        TaskFileSaveRecall(param).then((data: any) => {
          if (data.returnCode == 0) {
            setFileVisble(false)
            message.success(`${nowTaskName}归档撤回成功！`)
            ipcRenderer.send('update_unread_num', [''])
            refreshPage({
              optType: 'archive',
              taskId: taskId,
            })
          } else {
            message.error(data.returnMessage)
          }
        })
      } else {
        const dataInfo = data.data || ''
        if (data.returnCode == 0 && dataInfo != '') {
          setFileVisble(false)
          _resourceListInfo = dataInfo.resourceModelList || []
          // $('.task-ascription-name').val(ascriptionName)
          // $('.task-ascription-id').val(ascriptionId)
          /**
           * 归属
           */
          if (_resourceListInfo.length > 0) {
            // electron.remote.getGlobal('task').taskId = id
            showFileRes()
          } else if (dataInfo.approvalEventName != null) {
            // electron.remote.getGlobal('execute').approvTableName = name
            // electron.remote.getGlobal('execute').teamName = ascriptionName
            // electron.remote.getGlobal('execute').teamId = ascriptionId
            // electron.remote.getGlobal('task').taskId = id
            // //任务名称
            // electron.remote.getGlobal('execute').taskName = name
            // //事件id
            // electron.remote.getGlobal('execute').newApprovalId = ''
            // //事件id
            // electron.remote.getGlobal('execute').eventId = dataInfo.approvalEventId
            // //审批类型
            // electron.remote.getGlobal('execute').approvalType = dataInfo.approvalEventName
            // electron.remote.getGlobal('execute').isHome = fromType
            // //事件类型
            // electron.remote.getGlobal('execute').eventType = 'task_on_file'
            // //信息id
            // electron.remote.getGlobal('execute').taskId = id
            // //信息
            // electron.remote.getGlobal('execute').fileInfo = JSON.stringify(dataInfo)
            // // electron.remote.getGlobal("execute").taskInfo = JSON.stringify(dataInfo)
            // electron.remote.getGlobal('execute').isEdit = false
            // electron.remote.getGlobal('execute').fromMsg = fromType
            // //调用审批接口获取表单
            // ipc.send('goalgo_execute_show')
          } else {
            message.success(`${nowTaskName}归档成功！`)
            ipcRenderer.send('update_unread_num', [''])
            // TaskOpt.refreshPage({
            //   optType: 'taskFile',
            //   fromMsg: fromType,
            //   nowTaskId: id, //任务id
            // })
            refreshPage({
              optType: 'archive',
              taskId: taskId,
            })
          }
        } else {
          message.error(data.returnMessage)
        }
      }
    })
  }
  const showFileRes = () => {
    console.log('待处理.......')
  }
  //==================归档任务OVER=====================================
  //==================冻结解冻START=====================================
  const frozenThaw = (id: number, taskName: string, status: number, attention: string, level: number) => {
    //status 1任务解冻 2冻结
    if (status == 1) {
      setThawVisble(true) //打开二次确认弹窗
    } else {
      setFrozenVisble(true)
    }
    setTaskName(taskName)
    setFrozenParam({
      id: id,
      taskName: taskName,
      status: status,
      attention: attention,
      level: level,
    })
  }
  //冻结 解冻
  const frozenConfrim = () => {
    setFrozenVisble(false)
    setThawVisble(false)
    const { id, status, attention } = frozenParam
    // const username = electron.remote.getGlobal('sharedObject').userName
    // let userId = electron.remote.getGlobal('sharedObject').userId
    const Attention: any = attention
    let operateCode = ''
    const operateEnum = {
      负责任务: 1,
      执行任务: 2,
      验收任务: 3,
      督办任务: 4,
      拥有任务: 5,
    }
    for (const i in operateEnum) {
      if (attention.includes(i)) {
        operateCode = operateEnum[i]
      }
    }
    if (Attention != 4) {
      FrozenTask({
        operateUser: nowUserId,
        id: id,
        operateUserName: nowUser,
        type: 1,
        flag: status,
        reason: remarkValue ? remarkValue : '',
        operateCode: status == 0 ? operateCode : undefined, //操作来源
      }).then(
        (data: any) => {
          if (data.returnCode == 0) {
            // let querytAttentionTask = electron.remote.getGlobal('task').isFollow
            // test = querytAttentionTask != '' ? querytAttentionTask : 'task'
            message.success(status == 1 ? `${nowTaskName}解冻成功` : `${nowTaskName}冻结成功`)
            ipcRenderer.send('update_unread_num', [''])
            refreshPage({
              optType: status == 1 ? 'unfreeze' : 'freeze',
              taskId: taskId,
            })
          } else {
            message.error(data.returnMessage)
          }
        },
        err => {
          message.error(err.returnMessage)
        }
      )
    } else {
      //流转任务冻结
      circulationFrozenTask({
        userId: nowUserId,
        taskId: id,
        username: nowUser,
      }).then((data: any) => {
        if (data.returnCode == 0) {
          message.success(`${nowTaskName}冻结成功`)
          // attentionTask.workflowTask('exchangeTask')  (未知操作)
          // attentionTask.attentionTaskList()(未知操作)
        } else {
          message.error(data.returnMessage)
        }
      })
    }
  }
  //==================冻结解冻OVER====================================

  //==================设置任务关注人START==============================
  const taskFollower = (taskid: number, ascriptionId: number, fromType: string) => {
    //查询已有关注人
    const selList: any = []
    queryAlreadyfollowUser({
      taskId: taskid,
    }).then((data: any) => {
      const datas = data.dataList
      for (let i = 0; i < datas.length; i++) {
        selList.push({
          curId: datas[i].userId,
          curName: datas[i].username,
        })
      }
      //打开选人界面

      setSelMemberOrg({
        visible: true,
        teamId: ascriptionId,
        selectList: selList,
        allowTeamId: [ascriptionId],
        checkboxType: 'checkbox',
        onSure: (dataList: any) => {
          console.log(dataList)
          const getUser = dataList || []
          // 关注人可以全部删除
          // if (getUser.length == 0) {
          //   return
          // }
          const newUsers: any = []
          getUser.map((item: any) => {
            newUsers.push(item.curId)
          })
          //保存关注人
          savefollowUser({
            taskId: taskid,
            userIds: newUsers,
          }).then((data: any) => {
            if (data.returnCode === 0) {
              message.success('设置关注人成功')
              if (fromType == 'taskManage') {
                // TaskOpt.refreshPage({
                //   optType: 'taskFollower',
                //   fromMsg: fromType,
                //   taskId: taskid, //任务id
                // })
              } else {
                // TaskOpt.refreshPage({
                //   optType: 'taskFollower',
                //   fromMsg: fromType,
                //   nowTaskId: taskid, //任务id
                // })
              }
              refreshPage({
                optType: 'follower',
                taskId: taskId,
              }) //刷新界面
            } else {
              message.error(data.returnMessage)
            }
          })
        },
      })
      // setMemberOrgShow(true)
    })
  }
  //==================设置任务关注人END===============================
  //==================催办START===============================
  /**
   * taskName 任务名
   * taskId 任务id
   * teamName 任务所属团队名
   */
  const showUrgeModal = (taskName: string, taskId: number, teamName: string) => {
    setUrgParam({
      urgeTeamName: teamName,
      urgeTaskName: taskName,
      urgeTaskId: taskId,
      urgeCookieName: 'urge' + taskId,
    })
    //打开任务催办确认框
    setUrgVisble(true)
  }

  const urgConfrim = () => {
    setUrgVisble(false)
    setLoading(true)
    const { urgeTaskId, urgeTeamName, urgeTaskName } = urgParam
    taskUrg({
      taskId: urgeTaskId, //任务id
      orgName: urgeTeamName, //任务所属团队名
      userId: nowUserId, //催办人id
      userName: nowUser, //催办人姓名
      taskName: urgeTaskName, //任务名
    }).then(
      (data: any) => {
        setLoading(false)
        if (data.returnCode == 0) {
          message.success('催办成功，5分钟后可刷新重试')
        } else {
          message.error(data.returnMessage)
        }
      },
      err => {
        setLoading(false)
        message.error(err.returnMessage)
      }
    )
  }
  //==================催办END===============================
  //删除任务
  const TaskDeleteConfrim = (getData?: any) => {
    setTaskDeleteVisble(false)
    if (deletParms.iskr == 2 || deletParms.iskr == 1) {
      // 删除kr
      const params = {
        id: getData.id, //当前节点
        typeId: getData.typeId, //任务id
        mainId: getData.mainId, //根节点id
        mainTypeId: '', //根节点typeid
        name: getData.name, //任务名称
        operateUser: $store.getState().nowUserId, //操作人
        isDel: undefined, //是否删除O下面及所有任务
        firstId: '', //第一个根节点ID
        isAll: '1', //删除单个还是整链 1整链
      }
      deleteKrNodesApi(params).then((res: any) => {
        if (res.returnCode == 0) {
          refreshPage({
            optType: 'relKR',
            datas: getData,
          })
        }
      })
    } else {
      const { id } = deletParms
      taskDelete({
        operateUser: nowUserId,
        operateUserName: nowUser,
        id: id,
      }).then((data: any) => {
        if (data.returnCode == 0) {
          message.success(`${nowTaskName}删除成功`)
          ipcRenderer.send('update_unread_num', [''])
          refreshPage({
            optType: 'del',
            taskId: taskId,
          })
        } else {
          message.error(data.returnMessage)
        }
      })
    }
  }

  let isLoaing = false
  //复盘
  const replaySure = () => {
    const { getTaskId } = replyParm
    if (isLoaing) return
    isLoaing = true
    taskReplay({
      liableUser: nowUserId,
      liableUsername: nowUser,
      content: editorText,
      taskId: getTaskId,
    }).then((data: any) => {
      setReplayVisble(false)
      if (data.returnCode == 0) {
        refreshPage({
          optType: 'replay',
          taskId: taskId,
        })
        message.success('添加成功！')
        setEditorText('')
      } else {
        message.error('添加失败！')
        setEditorText('')
      }
    })
  }
  //kr汇报进展
  const krSummary = (info: any) => {
    $store.dispatch({
      type: 'TASK_LIST_ROW',
      data: {
        handleBtn: {
          id: info.typeId,
          status: info.datas.process == 100 ? 2 : 0,
          executorUsername: '',
          reportId: '',
          type: 0,
          time: Math.floor(Math.random() * Math.floor(1000)),
          types: 'okr',
          source: 'okr_list',
          ascriptionId: info.ascriptionId,
        },
        type: 0,
      },
    })
    $tools.createWindow('DailySummary')
  }
  //查询状态
  const getZone = () => {
    const val = $('.workPlanListNav li.active').attr('data-type')
    return val
  }
  //置顶
  const setStick = (info: any) => {
    const param = {
      userId: $store.getState().nowUserId,
      type: 0, //0规划 1文件夹
      typeId: info.datas.id,
      zone: getZone(),
    }
    const url = '/task/work/plan/folder/setTop'
    topedFolder(param, url).then((res: any) => {
      if (res.returnCode == 0) {
        message.success($intl.get('setTopSuc'))
        refreshPage({
          optType: 'stick',
          datas: info,
        })
      }
    })
  }

  //取消顶置
  const canceltick = (info: any) => {
    const param = {
      topId: info.datas.topId,
    }
    const url = '/task/work/plan/folder/cancelTop'
    cancelFolder(param, url).then((res: any) => {
      if (res.returnCode == 0) {
        message.success($intl.get('cancelTopSuc'))
        refreshPage({
          optType: 'stick',
          datas: info,
        })
      }
    })
  }
  //设置提醒方式默认事件
  const approvalSolve = (dataInfo: any) => {
    //事件id
    setLoading(false)
  }
  //根据状态渲染图标
  const getIcon = (btnStatus: any) => {
    if (btnStatus == 2) {
      return {
        title: '一键完成',
        icon: $tools.asAssetsPath('/images/task/schtasks/finish-grey.svg'),
      }
    } else if (btnStatus == 3) {
      return {
        title: '取消完成',
        icon: $tools.asAssetsPath('/images/task/schtasks/finish-green.svg'),
      }
    } else if (btnStatus == 1 || btnStatus === 0) {
      return {
        title: '启动',
        icon: $tools.asAssetsPath('/images/task/schtasks/start.svg'),
      }
    }
  }
  /**
   * 打开创建任务
   */
  const openCreateTask = () => {
    const param = {
      visible: true,
      createType: 'edit',
      from: 'workbench',
      id: taskId,
      taskType: 0,
      nowType: 0, //0个人任务 2企业任务 3部门任务
      teaminfo: '', //企业信息
      callbacks: (paramObj: any, _: any) => {
        refreshPage({
          ...paramObj,
          optType: 'editTask',
          taskId: taskId,
        })
      },
    }
    createTaskRef.current && createTaskRef.current.setState(param)
  }
  //根据CODE渲染按钮
  const MenuItem = ({ item, key, isSet }: any) => {
    const newItem: any = item
    // if (Array.isArray(item)) {
    //   newItem = item[0]
    // }
    const { code, status, isUse } = newItem
    const info: any = rowInfo || {}
    // const [changeClick, setChangeClick] = useState(true)
    const [getid, setGetid] = useState(info.id)
    const [progress] = useState(info.progress || {})
    // const btnCode = code + '' || ''
    const btnStatus = status || ''
    // let htmlStr = ''
    // // 状态字段
    // const isPrivate = info.property || 0
    // // 企业名
    const cmyName = $.trim(info.ascriptionName)
    const liberObj = info.liable || {}
    const nameed = '事物'

    const followTxt = sourceType?.includes('OKR') ? '关注' : `关注${nowTaskName}`
    useEffect(() => {
      if (fromType == 'okr-quadrant') {
        // setChangeClick(false)
        if (info.typeId) {
          setGetid(info.typeId)
        } else {
          setGetid(info.id)
        }
      }
    }, [])
    const menuBtnEvent = (_: number, key: any) => {
      const newKey = key.includes('remind') ? 'remind' : key
      switch (newKey + '') {
        case '1':
          statrTask(btnStatus, getid, progress.percent || 0)
          break
        case '2':
          openCreateTask()
          break
        case '3':
          //汇报
          if (taskOptData.iskr == 2 || taskOptData.iskr == 1) {
            //KR汇报(更改汇报进展)
            krSummary(info)
          }
          break
        case '5': //指派  回收
          setAssignParam({
            taskId: info.id,
            ascriptionId: info.ascriptionId,
            fromType: fromType,
            callback: (data: any) => {
              refreshPage({
                optType: 'assign',
                data: data,
                taskId: taskId,
                newTaskId: data,
              })
            },
          })
          setAssignVisble(true)
          // setOpencreattask(true)
          break
        case '6': //移交
          transferTask(
            getid,
            info.ascriptionType,
            liberObj.account,
            liberObj.username,
            info.name,
            liberObj.userId,
            info.ascriptionId,
            info.ascriptionType,
            cmyName
            // fromType,
            // info.roleId
          )
          break
        case '7': //关注 取消关注
          // const isFollow=info.isFollow ? info.isFollow : status
          if (btnStatus == 2) {
            unFollowTask({
              taskId: info.id,
            }).then((res: any) => {
              if (res) {
                refreshPage({
                  optType: 'followTask',
                  taskId: taskId,
                })
              }
            })
          } else {
            followTask({
              taskId: info.id,
              teamId: info.ascriptionId,
              belongName: $.trim(info.ascriptionName),
            }).then((res: any) => {
              if (res) {
                refreshPage({
                  optType: 'unFollowTask',
                  taskId: taskId,
                })
              }
            })
          }
          break
        case '8':
          setReplyParm({
            getTaskId: getid,
            fromType: fromType,
          })
          setReplayVisble(true)
          break
        case '9':
          taskFile(getid, info.name, info.ascriptionId, cmyName, fromType, info.level, btnStatus)
          break
        case '10':
          frozenThaw(getid, info.name, info.flag, fromType, info.level)
          break
        case '15':
          demotioneingTask(
            getid,
            info.name,
            'all',
            info.ascriptionType,
            info.ascriptionId,
            cmyName,
            liberObj.userId,
            liberObj.username,
            fromType,
            isUse
          )
          break
        case '17':
          showUrgeModal(info.name, getid, cmyName)
          break
        case '19':
          setTaskDeleteVisble(true)
          setTaskName(info.name)
          setDeletParm({
            iskr: taskOptData.iskr,
            id: getid,
            taskName: info.name,
            fromType: fromType,
            datas: info.datas,
          })
          break
        case '20':
          $store.dispatch({
            type: 'WORKPLAN_MODAL',
            data: {
              quoteMsg: {
                id: info.id,
                name: info.name,
                type: 'task',
                reportId: info.id,
                title: '任务',
                val: '',
              },
              sourceItem: info || {},
              shareFormType: 'taskOpt',
            },
          })
          const con = {
            message: '',
            subType: 8,
            quoteMsg: {
              id: info.id,
              name: info.name,
              type: 'task',
              reportId: info.id,
              title: '任务',
              val: '',
            },
          }
          const contentJson = {
            id: Number(info.id),
            content: info.name,
            title: '任务',
          }
          const chatMsg = {
            type: 6,
            messageJson: {
              type: 2,
              contentJson: JSON.stringify(contentJson),
            },
          }
          setShareCon(JSON.stringify(chatMsg))
          setShareToRoomParam({
            shareToRoomModalShow: true,
            titName: '分享任务',
            onOk: () => {
              refreshPage({
                optType: 'share',
                taskId: taskId,
              })
            },
          })
          break
        case '22':
          if (key == '22') {
            setOpenforce(true)
          } else if (key == '23') {
            taskFollower(getid, info.ascriptionId, fromType)
          }
          break
        case '23':
          taskFollower(getid, info.ascriptionId, fromType)
          break
        case '25': //编辑权限
          // 查询编辑权限人员
          editMemberAuth({ planId: info.datas.id, mainId: info.datas.mainId }).then(selectList => {
            setSelMemberOrg({
              visible: true,
              allowTeamId: [info.ascriptionId],
              selectList, //选人插件已选成员
              checkboxType: 'checkbox',
              findType: 0, //查询类型 0人员 3部门 31岗位 310岗位人员
              permissionType: 3, //组织架构通讯录范围控制
              onSure: (dataList: any) => {
                console.log(dataList)
                const getUser = dataList || []
                const newUsers: any = []
                getUser.map((item: any) => {
                  newUsers.push(item.curId)
                })
                saveEditMember({
                  id: info.datas.id, //节点id
                  receivers: newUsers, //id集合
                  name: taskOptData.rowObj.name,
                })
              },
            })
          })
          break
        case '26': //重命名
          refreshPage({
            optType: 'rechristen',
            taskId: taskId,
          })
          break
        case '27': //置顶/取消置顶
          if (info.datas.topId) {
            canceltick(info)
          } else {
            setStick(info)
          }
          break
        case 'remind':
          const reminder = key.split('_')[1]
          remindChange({
            taskId,
            reminder,
          }).then(() => {
            refreshPage &&
              refreshPage({
                optType: 'remind',
                taskId,
              }) //刷新界面
          })
          break
      }
    }
    return (
      <Menu
        // triggerSubMenuAction="click"
        onClick={props => {
          setShowMenu(false)
          $('body').bind('contextmenu', function(e) {
            if (
              $(e.target).hasClass('ant-modal-wrap') ||
              $(e.target).hasClass('.ant-modal') ||
              $(e.target).parents('.ant-modal').length > 0
            ) {
              return false
            }
          })
          if (setVisible) {
            setVisible(false)
          }
          if (!isUse) {
            return
          }
          menuBtnEvent(code, props.key)
        }}
      >
        {code == 1 && (
          <Menu.Item
            key="1"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2, width: 15, height: 15 }}
                src={getIcon(btnStatus)?.icon}
              />
            }
            disabled={!isUse ? true : false}
          >
            {getIcon(btnStatus)?.title}
          </Menu.Item>
        )}
        {code == 2 && (
          <>
            <Menu.Item
              className="edit_opt_icon_div"
              key="2"
              icon={
                <img
                  style={{ marginRight: 13, marginTop: -2 }}
                  src={$tools.asAssetsPath('/images/task/schtasks/edit-black.svg')}
                />
              }
              disabled={!isUse ? true : false}
            >
              编辑
            </Menu.Item>
            {/* <Divider /> */}
          </>
        )}
        {code == 3 && (
          <Menu.Item
            key="3"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            汇报
          </Menu.Item>
        )}
        {code == 4 && (
          <Menu.Item
            key="4"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            新增子任务
          </Menu.Item>
        )}
        {code == 5 && (
          <>
            <Menu.Item
              key="5"
              icon={
                <img
                  style={{ marginRight: 13, marginTop: -2 }}
                  src={$tools.asAssetsPath('/images/task/schtasks/assign-black.svg')}
                />
              }
              disabled={!isUse ? true : false}
            >
              指派子任务
            </Menu.Item>
            <Divider />
          </>
        )}

        {code == 6 && (
          <Menu.Item
            key="6"
            // icon={
            //   <img
            //     style={{ marginRight: 13, marginTop: -2 }}
            //     src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.svg')}
            //   />
            // }
            icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
            disabled={!isUse ? true : false}
          >
            移交
          </Menu.Item>
        )}
        {code == 7 && ( //关注任务  取消关注
          <>
            <Menu.Item
              key="7"
              icon={
                <img
                  style={{ marginRight: 13, marginTop: -2 }}
                  src={$tools.asAssetsPath('/images/task/schtasks/follow-black.svg')}
                />
              }
              disabled={!isUse ? true : false}
            >
              {/* {info.isFollow ? '取消关注' : '关注任务'} */}
              {btnStatus == 2 ? '取消关注' : followTxt}
            </Menu.Item>
          </>
        )}

        {code == 8 && (
          <>
            <Menu.Item
              key="8"
              icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
              disabled={!isUse ? true : false}
            >
              添加复盘
            </Menu.Item>
            <Divider />
          </>
        )}

        {code == 9 && btnStatus != 2 && (
          <Menu.Item
            key="9"
            icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
            disabled={!isUse ? true : false}
          >
            归档
          </Menu.Item>
        )}
        {/* {code == 9 && (
          <Menu.Item
            key="9"
            icon={<img style={{ marginRight: 26, marginTop: -2 }} />}
            disabled={!isUse ? true : false}
          >
            {btnStatus == 2 ? '撤销归档' : '归档'}

          </Menu.Item>
        )} */}
        {code == 10 && ( //冻结 解冻
          <Menu.Item
            key="10"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/forzon-black.svg')}
              />
            }
            disabled={!isUse ? true : false}
          >
            {btnStatus == 2 ? '解冻' : '冻结'}
          </Menu.Item>
        )}
        {code == 11 && (
          <Menu.Item
            key="11"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            复制
          </Menu.Item>
        )}
        {code == 12 ||
          (code == 13 && (
            <>
              <SubMenu
                className="edit_opt_icon_div taskOptSubMenuTit"
                key="0"
                icon={
                  <img
                    style={{ marginRight: 13, marginTop: -2 }}
                    src={$tools.asAssetsPath('/images/task/schtasks/sendMsg.png')}
                  />
                }
                title="发起"
              >
                <Menu.Item key="12" disabled={!isUse ? true : false}>
                  发起审批
                </Menu.Item>
                <Menu.Item key="13" disabled={!isUse ? true : false}>
                  发起会议
                </Menu.Item>
              </SubMenu>
              {/* <Divider /> */}
            </>
          ))}
        {code == 14 && (
          <Menu.Item
            key="14"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            发起沟通
          </Menu.Item>
        )}
        {code == 15 && (
          <>
            <Menu.Item
              className="edit_opt_icon_div"
              key="15"
              icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
              disabled={!isUse ? true : false}
            >
              变更归属
            </Menu.Item>
            {/* <Divider /> */}
          </>
        )}
        {code == 16 && (
          <Menu.Item
            key="16"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            {nameed}
          </Menu.Item>
        )}
        {code == 17 && (
          <Menu.Item
            key="17"
            icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
            disabled={!isUse ? true : false}
          >
            催办
          </Menu.Item>
        )}
        {code == 18 && (
          <Menu.Item
            key="18"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            查看规划
          </Menu.Item>
        )}
        {code == 19 && (
          <Menu.Item
            key="19"
            icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
            disabled={!isUse ? true : false}
            style={!isUse ? {} : { color: '#EA4335' }}
          >
            删除
          </Menu.Item>
        )}
        {code == 20 && (
          <Menu.Item
            key="20"
            // icon={
            //   <img
            //     style={{ marginRight: 13, marginTop: -2 }}
            //     src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
            //   />
            // }
            icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
            disabled={!isUse ? true : false}
          >
            分享
          </Menu.Item>
        )}
        {code == 23 && !isSet && (
          <>
            <Menu.Item
              key="23"
              className="edit_opt_icon_div"
              disabled={!isUse ? true : false}
              icon={
                <img
                  style={{ marginRight: 13, marginTop: -2 }}
                  src={$tools.asAssetsPath('/images/task/schtasks/sz.svg')}
                />
              }
              title="设置关注人"
            >
              设置关注人
            </Menu.Item>
            <Divider />
          </>
        )}
        {code == 22 && !isSet && (
          <>
            <Menu.Item
              key="22"
              className="edit_opt_icon_div"
              disabled={!isUse ? true : false}
              icon={
                <img
                  style={{ marginRight: 13, marginTop: -2 }}
                  src={$tools.asAssetsPath('/images/task/schtasks/sz.svg')}
                />
              }
              title="汇报设置"
            >
              汇报设置
            </Menu.Item>
            <Divider />
          </>
        )}
        {/* st屏蔽 */}
        {isSet && code == 23 && (
          <SubMenu
            className="edit_opt_icon_div taskOptSubMenuTit"
            popupClassName="taskOptSubMenu"
            key="0"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/sz.svg')}
              />
            }
            title="设置"
          >
            {/* 详情任务提醒设置 */}
            {/* <TaskRemindMenu /> */}
            {reminderSet && (
              <SubMenu
                className="edit_opt_icon_div taskOptSubMenuTit"
                popupClassName="taskOptSubMenu"
                key="remind"
                title={`${nowTaskName}结束前-` + remiderTxt(rowInfo.reminder || 0)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item: any) => {
                  return (
                    <Menu.Item
                      className="taskOptMenuItem"
                      key={'remind_' + item}
                      disabled={editAuth ? false : true}
                    >
                      {remiderTxt(item)}
                    </Menu.Item>
                  )
                })}
              </SubMenu>
            )}
            {
              <Menu.Item key="23" disabled={!isUse ? true : false}>
                设置关注人
              </Menu.Item>
            }
            {
              <Menu.Item
                className="taskOptMenuItem"
                key="22"
                disabled={!isUse ? true : false}
                // icon={
                //   <img
                //     style={{ marginRight: 13, marginTop: -2 }}
                //     src={$tools.asAssetsPath('/images/task/schtasks/rep_edit.png')}
                //   />
                // }
              >
                汇报设置
              </Menu.Item>
            }
          </SubMenu>
        )}

        {code == 24 && ( //加入临时任务 取消临时任务
          <Menu.Item
            key="24"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            加入临时任务
          </Menu.Item>
        )}
        {code == 100 && (
          <Menu.Item
            key="100"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            详情
          </Menu.Item>
        )}
        {code == 101 && (
          <Menu.Item
            key="101"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            标记成O
          </Menu.Item>
        )}
        {code == 102 && (
          <Menu.Item
            key="102"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            标记成KR
          </Menu.Item>
        )}
        {code == 103 && (
          <Menu.Item
            key="103"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            标记成协同
          </Menu.Item>
        )}
        {code == 104 && (
          <Menu.Item
            key="104"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            取消标记
          </Menu.Item>
        )}
        {code == 105 && (
          <Menu.Item
            key="105"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            派发本单项
          </Menu.Item>
        )}
        {code == 106 && (
          <Menu.Item
            key="106"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            派发整链任务
          </Menu.Item>
        )}
        {code == 107 && (
          <Menu.Item
            key="107"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            撤回本单项派发
          </Menu.Item>
        )}
        {code == 108 && (
          <Menu.Item
            key="108"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            撤回整链派发
          </Menu.Item>
        )}
        {code == 109 && (
          <Menu.Item
            key="109"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            发起会议
          </Menu.Item>
        )}
        {code == 110 && (
          <Menu.Item
            key="110"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            共享到人
          </Menu.Item>
        )}
        {code == 111 && (
          <Menu.Item
            key="111"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            共享到群
          </Menu.Item>
        )}
        {code == 112 && (
          <Menu.Item
            key="112"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            图标
          </Menu.Item>
        )}
        {code == 113 && (
          <Menu.Item
            key="113"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            移动规划
          </Menu.Item>
        )}
        {code == 114 && (
          <Menu.Item
            key="114"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            删除单项
          </Menu.Item>
        )}
        {code == 115 && (
          <Menu.Item
            key="115"
            icon={
              <img
                style={{ marginRight: 13, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/task/schtasks/transfer-black.png')}
              />
            }
            disabled={!isUse ? true : false}
          >
            删除整条链
          </Menu.Item>
        )}
        {code == 25 && (
          <Menu.Item
            key="25"
            icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
            disabled={!isUse ? true : false}
          >
            编辑权限
          </Menu.Item>
        )}
        {code == 26 && (
          <>
            <Menu.Item
              key="26"
              icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
              className="edit_opt_icon_div"
              disabled={!isUse ? true : false}
              title="重命名"
            >
              重命名
            </Menu.Item>
            <Divider />
          </>
        )}
        {code == 27 && info.showTop && (
          <>
            <Menu.Item
              key="27"
              icon={<img style={{ marginRight: 13, marginTop: -2 }} className="visiblehide" />}
              className="edit_opt_icon_div"
              disabled={!isUse ? true : false}
              title={info.datas.topId ? '取消置顶' : '置顶'}
            >
              {info.datas.topId ? '取消置顶' : '置顶'}
            </Menu.Item>
            <Divider />
          </>
        )}
      </Menu>
    )
  }

  return (
    <div>
      {(outVisible || showMenu) && (
        <div
          style={{
            boxShadow: menuBtns.length == 0 ? 'none' : '0px 3px 6px rgba(0, 0, 0, 0.16)',
            background: 'white',
            width: '170px',
          }}
        >
          <div className="right_btn_box">
            {[1].map(() => {
              // 查询设置按钮子菜单数量
              const setBtns = menuBtns.filter((v: any) => {
                return v.code == 22 || v.code == 23
              })
              return menuBtns.map((item: ArrItemProps) => (
                <MenuItem item={item} key={item.code} isSet={setBtns.length > 1} />
              ))
            })}
          </div>
        </div>
      )}
      <AssignTaskModal
        visible={assignVisble}
        setVisible={(flag: boolean) => {
          setAssignVisble(flag)
        }}
        param={assignParam}
      />
      {shareToRoomParam.shareToRoomModalShow && (
        <ChatForwardModal
          visible={shareToRoomParam.shareToRoomModalShow}
          chatMsg={shareCon}
          teamId={selectTeamId}
          onSelected={() => {
            setShareToRoomParam({ ...shareToRoomParam, shareToRoomModalShow: false })
          }}
          onCancelModal={() => {
            setShareToRoomParam({ ...shareToRoomParam, shareToRoomModalShow: false })
          }}
          dataAuth={true}
          findType={0}
          permissionType={3}
          isQueryAll={1}
          pageSize={10}
          selectList={{
            nowUserId,
            nowUser,
            curType: 0,
            nowAccount,
            profile: userInfo.profile,
            disable: true,
          }}
        />
      )}

      <Modal
        title="复盘"
        centered
        visible={replayVisble}
        maskClosable={false}
        onOk={() => replaySure()}
        onCancel={() => {
          setReplayVisble(false)
          setEditorText('')
        }}
        width={840}
        bodyStyle={{ padding: '20px', height: '500' }}
      >
        <div>
          <Editor
            editorContent={editorText}
            editorChange={editorChange}
            height={365}
            className="replayEditor"
            previewArea=".replayEditor"
            autoFocus={true}
            showText={true}
          />
        </div>
      </Modal>
      <Modal
        title="操作提示"
        centered
        visible={fileVisble}
        maskClosable={false}
        onOk={() => fileTaskSure()}
        onCancel={() => setFileVisble(false)}
        width={400}
        bodyStyle={{
          padding: '20px',
          height: '192px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div className="fileTip">
          <p className="title">归档该{nowTaskName}及其包含的子任务？</p>
          <p className="title_span">
            (当前{nowTaskName}包含 <span>{childLen}</span>个子任务，请谨慎操作。)
          </p>
        </div>
      </Modal>
      <Modal
        title="操作提示"
        centered
        visible={thawVisble}
        maskClosable={false}
        onOk={() => frozenConfrim()}
        onCancel={() => setThawVisble(false)}
        width={400}
        bodyStyle={{
          padding: '20px',
          height: '192px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div className="thawTip" style={{ width: '100%' }}>
          <p>点击后系统将解除对【{taskName}】的冻结</p>
          <p>请谨慎操作！是否解冻？</p>
        </div>
      </Modal>
      <Modal
        title={<span className="module_title">冻结{nowTaskName}</span>}
        closeIcon={<img src={$tools.asAssetsPath('/images/common/closeTeam.png')} />}
        centered
        visible={frozenVisble}
        maskClosable={false}
        onOk={() => frozenConfrim()}
        onCancel={() => setFrozenVisble(false)}
        width={400}
        bodyStyle={{
          padding: '20px',
          height: '242px',
        }}
      >
        <div className="frozenTip">
          {childLen > 0 && (
            <p>
              当前{nowTaskName}包含 <span>{childLen}</span>个子任务，冻结后将一同冻结，请谨慎操作。
            </p>
          )}
          <TextArea
            style={{ marginTop: '20px', height: '300px' }}
            autoSize={{ minRows: 8, maxRows: 8 }}
            maxLength={300}
            placeholder="请在此填写冻结说明~"
            value={remarkValue}
            onChange={e => setRemarkValue(e.target.value)}
          />
        </div>
      </Modal>
      <Modal
        title="操作提示"
        centered
        visible={urgVisble}
        maskClosable={false}
        onOk={() => urgConfrim()}
        onCancel={() => setUrgVisble(false)}
        width={400}
        bodyStyle={{
          padding: '20px',
          height: '192px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div className="urgTip">
          <p>确定催办该{nowTaskName}？</p>
        </div>
      </Modal>
      <Modal
        title={'确认删除？'}
        className="baseModal delModal delPlanModal"
        centered
        visible={taskDeleteVisble}
        maskClosable={false}
        onOk={() => TaskDeleteConfrim(deletParms.datas)}
        onCancel={() => setTaskDeleteVisble(false)}
        width={400}
      >
        {deletParms.iskr == 2 || deletParms.iskr == 1 ? (
          <p className="contTxt">
            删除{deletParms.iskr == 1 ? '目标' : 'KR'}后无法找回,【{deletParms.taskName || ''}】?
          </p>
        ) : (
          <div className="contTxt">
            {childLen > 0 ? (
              <>
                <p>删除该{nowTaskName}及其包含的子任务？</p>
                <p>
                  (当前{nowTaskName}包含<span>{childLen}</span>个子任务，请谨慎操作。)
                </p>
              </>
            ) : (
              <>
                <p>点击后系统将永久删除【{taskName}】！</p>
                <p>
                  如果该{nowTaskName}下有其他参与者或子任务
                  <br />
                  正在执行中，请谨慎操作。
                </p>
              </>
            )}
          </div>
        )}
      </Modal>
      {transferVisble ? (
        <Modal
          className="task_transfer_modal"
          title={<span className="module_title">{nowTaskName}移交</span>}
          centered
          visible={transferVisble}
          maskClosable={false}
          onOk={() => transferSure()}
          onCancel={() => setTransferVisble(false)}
          closeIcon={<img src={$tools.asAssetsPath('/images/common/closeTeam.png')} />}
          width={400}
          bodyStyle={{ padding: '20px 27px', height: '242px' }}
        >
          <div className=" transfer-content transfer-task-content">
            <div className="transferTaskPop-title">
              <p>
                移交对象
                <span>（移交后，执行人变为该移交对象）</span>
              </p>
            </div>
            <div className="removeTaskCont">
              <div style={{ display: 'flex' }}>
                <span className="selectUser" onClick={() => selectUser()}></span>
                <div className="select_user_list">
                  {user.map((item: UserProps) => (
                    <Tooltip title={item.curName} key={item.curId}>
                      <span className="item_user">{item.curName}</span>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <TextArea
                // ref={reasonRef}
                maxLength={300}
                placeholder="请在此填写备注信息"
                autoSize={{ minRows: 5, maxRows: 5 }}
                onChange={(e: any) => {
                  setTextAreaText(e.target.value)
                }}
              />
            </div>
            {loading && (
              <div className="example">
                <Spin />
              </div>
            )}
          </div>
        </Modal>
      ) : (
        ''
      )}
      {/* 任务移交弹窗*/}
      {selMemberOrg.visible && (
        <SelectMemberOrg
          param={{
            // visible: memberOrgShow,
            ...selMemberOrg,
          }}
          action={{
            setModalShow: (visible: boolean) => {
              setSelMemberOrg({ ...selMemberOrg, visible })
            },
          }}
        />
      )}
      {/* 编辑任务 */}
      {opencreattask && (
        <CreatTask
          param={{ visible: opencreattask }}
          datas={{
            from: 'workbench', //来源
            isCreate: 1, //创建0 编辑1
            taskid: taskId, //任务id
            nowType: 0, //0个人任务 2企业任务 3部门任务
            teaminfo: '', //企业信息
          }}
          setvisible={(state: any) => {
            setOpencreattask(state)
          }}
          callbacks={(paramObj: any) => {
            refreshPage({
              ...paramObj,
              optType: 'editTask',
              taskId: taskId,
            })
          }}
        ></CreatTask>
      )}
      <CreateTaskModal ref={createTaskRef} />
      {/* 强制汇报 */}
      {openforce && (
        <Forcereport
          visible={openforce}
          datas={{
            from: fromType, //来源
            isdetail: 0, //是否为详情 1详情 0设置 2编辑
            taskid: taskId, //任务id
            startTime: startTime, //开始时间
            endTime: endTime, //结束时间
            teamId: teamIds, //企业id
            reportPerson: [], //执行人数据
            receiverPerson: [], //汇报对象数据
            copyPerson: [], //抄送数据
            teamConcatPerson,
            type: taskData.type,
          }}
          setModalShow={setOpenforce}
          onOk={() => {
            refreshPage({
              optType: 'editForcereport',
              taskId,
            })
          }}
        ></Forcereport>
      )}
    </div>
  )
}
/**
 * 修改提醒方式
 * @param value
 */
const remindChange = ({ reminder, taskId }: any) => {
  const param = {
    id: taskId,
    reminder,
  }
  return new Promise(resolve => {
    editDetailApi(param).then((res: any) => {
      resolve(res.success)
    })
  })
}

/**
 * 提醒code值和文本对应关系
 */
const remiderTxt = (code: any) => {
  let remider = ''
  switch (Number(code)) {
    case 1:
      remider = '0分钟提醒'
      break
    case 2:
      remider = '5分钟提醒'
      break
    case 3:
      remider = '15分钟提醒'
      break
    case 4:
      remider = '30分钟提醒'
      break
    case 5:
      remider = '1小时提醒'
      break
    case 6:
      remider = '12小时提醒'
      break
    case 7:
      remider = '1天提醒'
      break
    case 8:
      remider = '1周提醒'
      break
    case 0:
    default:
      remider = '不提醒'
      break
  }
  return remider
}

/**
 * 编辑权限
 */
const editMemberAuth = ({ planId, mainId }: any) => {
  return new Promise(resolve => {
    // 查询编辑权限人员
    findEditMember({
      id: planId,
      mainId,
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
      resolve(newList)
    })
  })
}
export default TaskListOpt

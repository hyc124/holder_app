import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Button, Checkbox, message, Modal, Spin } from 'antd'
import { CreateTaskLeft, CreateTaskRight } from './createTask'
import './createTask.less'
import { queryTaskDetailApi } from '../taskDetails/detailApi'
import { findAllCompanyApi, findExtendsTeamApi, findSupportApi, getWorkHoursApi, mainDutyApi } from './getData'
// import { moduleItemRefresh } from '../../myWorkDesk/deskModuleItem'
import * as Maths from '@/src/common/js/math'
import moment from 'moment'
import { saveTaskApi } from './createTaskApi'
import { findAuthList, getAuthStatus } from '@/src/common/js/api-com'
import { refreshPage } from '../../workdesk/TaskListData'
import { ipcRenderer } from 'electron'
export const createTaskContext = React.createContext({})
export interface CreateTaskContextObj {
  [propName: string]: any
}

// 缓存支撑父任务的id
let supportParentOld = ''
// 创建任务数据缓存
let createTaskTmp: any = {
  visible: false,
  keepCreate: false, //是否继续创建任务
  toDo: false, //是否 进入待办
  noData: false,
  refresh: 0, //查询刷新任务
  id: '', //任务ID
  name: '', //任务名称
  description: '',
  approvalStatus: 0, //
  ascriptionId: '', //
  ascriptionName: '', //
  teamLogo: '', //
  liable: {}, //执行人
  distribute: '', //指派人
  startTime: '',
  endTime: '', //
  property: 0, //私密属性
  status: 0, //
  flag: 0, //
  level: 1, //
  process: 0, //
  progress: { percent: 0 },
  createUsername: '', //
  attach: {
    //归属
    type: 0,
    star: 0,
    typeId: '',
  },
  execute: {},
  cycleModel: {}, //循环
  detailMain: {},
  tagList: [], //标签
  fileList: [], //附件
  joinTeams: [], //参与企业联系人
  reportSets: [], //汇报设置
  parentTask: {}, //父级任务
  supportOkrList: [], //支撑的Okr
  checkList: [], //check项
  // okr详情属性
  liableUser: '',
  liableUsername: '',
  from: '',
  pageUuid: '',
}

// 禁用创建按钮，防止用户多次点击
let saveDisable = false
/**
 * 创建编辑任务弹框组件
 */
export const CreateTaskModal = forwardRef((_: any, ref) => {
  const { nowUserId, nowUser, nowAccount, nowAvatar, selectTeamId, createTaskToDo } = $store.getState()
  // 数据展示state
  const [state, setTaskState] = useState<any>({
    visible: false,
    keepCreate: false, //是否继续创建任务
    toDo: false, //是否 进入待办
    noData: false,
    refresh: 0, //查询刷新任务
    id: '', //任务ID
    name: '', //任务名称
    approvalStatus: 0, //
    ascriptionId: '', //
    ascriptionName: '', //
    teamLogo: '', //
    liable: {}, //执行人
    distribute: '', //指派人
    endTime: '', //
    property: 0, //私密属性
    status: 0, //
    flag: 0, //
    level: 1, //
    process: 0, //
    progress: { percent: 0 },
    createUsername: '', //
    attach: {
      //归属
      type: 0,
      star: 0,
      typeId: '',
    },
    execute: {},
    cycleModel: {}, //循环
    detailMain: {},
    tagList: [], //标签
    fileList: [], //附件
    joinTeams: [], //参与企业联系人
    reportSets: [], //汇报设置
    parentTask: {}, //父级任务
    supportOkrList: [], //支撑的Okr
    checkList: [], //check项
    // okr详情属性
    liableUser: '',
    liableUsername: '',
    from: '',
    pageUuid: '',
    callbacks: {},
    // 禁用点击创建保存按钮（防止多次点击）
    // saveDisable: false,
  })
  const [loading, setLoading] = useState(false)
  /**
   * 初始化监听
   */
  useEffect(() => {
    // 初始化和弹框关闭时恢复创建按钮禁用状态
    setTimeout(() => {
      saveDisable = false
    }, 500)
    if (state.visible) {
      initFn()
    }
  }, [state.visible])
  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    setState: (paramObj: any) => {
      const defData = clearTaskData()
      const newState = { ...state, ...defData, ...paramObj, refresh: state.refresh + 1, toDo: createTaskToDo }
      if (paramObj.nowType !== undefined) {
        newState.attach.type = paramObj.nowType
      }
      setState(newState)
    },
  }))

  /**
   * 设置state及全局数据
   * @param paramObj
   */
  const setState = (paramObj: any, attachObj?: any) => {
    const { noUpdateTmp }: any = attachObj ? attachObj : {}
    const refresh = new Date().getTime().toString()
    if (!noUpdateTmp) {
      // 排除不需要清空的字段
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { description, ...newData } = paramObj
      createTaskTmp = { ...createTaskTmp, ...newData, refresh }
    }
    setTaskState({ ...state, ...paramObj, refresh })
  }

  /**
   * 初始化方法
   */
  const initFn = async () => {
    if (!state.visible) {
      return
    }
    // 编辑
    if (state.createType == 'edit') {
      queryTaskDetail()
    } else if (state.createType == 'add') {
      const getEndTime: any = await getEndTimes({
        teamId: getTeamId(state), // 初始加载获取企业id
        createType: state.createType,
        addHandly: state.addHandly,
        endTime: state.endTime,
      })
      // 创建主任务
      if (state.from == 'workbench' || state.from == 'taskManage_my') {
        //工作台及任务管理我的任务
        findAllCompany(getEndTime)
      } else {
        if (state.from == 'taskManage' || state.from == 'work-plan') {
          //任务管理
          const taskmanageOrg = state.taskmanageData.orgInfo
          let deptIds = ''
          const belongInfo = {
            attach: {
              type: taskmanageOrg.curType,
              typeId: taskmanageOrg.curType ? taskmanageOrg.curId : taskmanageOrg.deptId,
              typeName: taskmanageOrg.curType == 2 ? '' : taskmanageOrg.deptName,
              star: 0,
              setType: '',
            },
            distribute: {
              ascriptionId: taskmanageOrg.teamId,
              userId: nowUserId,
              username: nowUser,
              profile: nowAvatar || '',
            },
          }
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
              deptIds,
              getEndTime,
              belongInfo
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
              profile: taskmanageOrg.profile || '',
            }
            const newBelong = getTaskBelong(setData, belongInfo)
            setState({ ...state, ...newBelong, endTime: getEndTime })
          }
        }
      }
    } else if (state.createType == 'addChild') {
      //创建子任务
      //查询主岗相关信息及参与企业
      findExtendsTeam(state.parentId)
    }
  }
  /**
   * 清空缓存内容
   * clearType:清空类型 changeTeam-更改归属或角色 keepCreate-继续创建任务
   */
  const clearTaskData = (paramObj?: { clearType: any }) => {
    const infoObj: any = paramObj ? paramObj : {}
    const { clearType } = infoObj
    let newData = {}
    const defData: any = {
      keepCreate: false, //是否继续创建任务
      toDo: false, //是否 进入待办
      noData: false,
      name: '', //任务名称
      description: '',
      icon: '',
      approvalStatus: 0, //
      ascriptionId: '', //
      ascriptionName: '', //
      teamLogo: '', //
      liable: {}, //执行人
      distribute: {}, //指派人
      execute: {}, //领导责任人
      supervisor: {}, //督办人
      startTime: '',
      endTime: '', //
      property: 0, //私密属性
      status: 0, //
      flag: 0, //
      level: 1, //
      process: 0, //
      progress: { percent: 0 },
      createUsername: '', //
      attach: {
        //归属
        type: 0,
        star: 0,
        typeId: '',
      },
      cycleModel: {}, //循环
      tagList: [], //标签
      fileList: [], //附件
      joinTeams: [], //参与企业联系人
      reportSets: [], //汇报设置
      parentTask: {}, //父级任务
      supportOkrList: [], //支撑的Okr
      checkList: [], //check项
      // okr详情属性
      liableUser: '',
      liableUsername: '',
      pageUuid: Maths.uuid(),
      delFileIds: [],
      callbacks: {},
      from: '',
      executeTime: '',
      subTaskCount: 0,
      subTaskLevels: 0,
      childCount: 0,
      remainDays: 0,
      type: 0,
      processUser: '',
      reminder: 0,
      supports: {},
      workPlanType: '',
      taskType: 0,
      followList: [],
      targetList: [],
      // 创建子任务时判断父级类型：0：任务 3:Kr
      parentType: 0,
    }
    // 更改归属
    if (clearType == 'changeTeam') {
      // 排除不需要清空的字段
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name, description, from, attach, callbacks, taskType, ...clearData } = defData
      newData = { ...clearData }
      createTaskTmp = { ...createTaskTmp, ...clearData }
    } else if (clearType == 'keepCreate') {
      const {
        ascriptionId,
        ascriptionName,
        liable,
        distribute,
        execute,
        supervisor,
        from,
        attach,
        endTime,
        callbacks,
        taskType,
        ...clearData
      } = defData
      newData = { ...clearData }
      createTaskTmp = { ...createTaskTmp, ...clearData }
    } else {
      newData = defData
      createTaskTmp = { ...defData }
    }
    // const { keepCreate, ...newData } = defData
    // 去除不需要更新的属性
    // Object.keys(defData).forEach((key: any) => {
    //   if (clearsList && !clearsList.includes(key)) {
    //     newData[key] = defData[key]
    //   }
    // })
    return newData
  }
  /**
   * 设置任务属性
   * @param setData
   */
  const getTaskBelong = (setData: any, belongObj?: any) => {
    const belongInfo = belongObj ? belongObj : {}
    const attrState = {
      ascriptionId: setData.teamId,
      ascriptionName: setData.teamName,
      attach: belongInfo.attach
        ? belongInfo.attach
        : {
            type: setData.ascriptionType,
            typeId: setData.ascriptionId,
            typeName: setData.deptName,
            star: 0,
            setType: '',
          },
      liable: belongInfo.liable
        ? belongInfo.liable
        : {
            ascriptionId: setData.teamId,
            deptId: setData.deptId,
            deptName: setData.showDeptName || setData.deptName,
            roleId: setData.roleId,
            roleName: setData.roleName,
            userId: setData.userId,
            username: setData.username,
            profile: setData.profile || '',
          },

      distribute: belongInfo.distribute
        ? belongInfo.distribute
        : {
            ascriptionId: setData.teamId,
            userId: setData.userId,
            username: setData.username,
            profile: setData.profile || '',
          },
    }
    return attrState
  }
  /**
   * 查询详情
   */
  const queryTaskDetail = (paramObj?: any) => {
    return new Promise(resolve => {
      const infoObj = paramObj ? paramObj : {}
      const findId = infoObj.taskId ? infoObj.taskId : state.id
      // const findId = 65693 //74352
      if (findId) {
        queryTaskDetailApi({ id: findId }).then((data: any) => {
          const setData = setDetailData({ data: data.data || {} })
          resolve(setData)
        })
      }
    })
  }
  //查询主岗部门
  const mainDuty = (firstCmy: any, deptId: any, endTime: any, belongObj?: any) => {
    const belongInfo = belongObj ? belongObj : {}
    // deptId不传的时候，查询出来的是登录人的信息，传了的时候查询的是企业或部门负责人的信息
    const param = {
      account: nowAccount,
      teamId: firstCmy.teamId,
      deptId,
      isCreate: state.createType == 'edit' ? 1 : 0, //创建0 编辑1
    }
    mainDutyApi(param).then((resData: any) => {
      const datas = resData.data || {}
      const setData = {
        ...datas,
        teamId: firstCmy.teamId,
        teamName: firstCmy.teamName,
        ascriptionId: datas.deptId ? datas.deptId : datas.teamId,
        ascriptionName: datas.deptId ? datas.deptName : '',
        ascriptionType: 0,
        profile: datas.profile || '',
      }
      const newBelong = getTaskBelong({ ...firstCmy, ...setData }, belongInfo)
      findAddAuth({ teamId: firstCmy.teamId }).then((res: any) => {
        const { addOrgAuth, addDeptAuth } = res
        setState({ ...state, ...newBelong, endTime, addOrgAuth, addDeptAuth })
      })
    })
  }
  //查询企业列表
  const findAllCompany = (endTime: any) => {
    const param = {
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }
    //获取第一个企业信息作为归属信息
    findAllCompanyApi(param).then((resData: any) => {
      let firstCmy = null
      if (resData.length > 0) {
        if (state.from == 'workbench') {
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
          ascriptionType: 0,
          profile: firstCmy.profile || '',
        },
        undefined,
        endTime
      )
    })
  }

  //创建子任务设置相关信息及参与企业11
  const findExtendsTeam = (taskid: any) => {
    const param = {
      taskId: taskid,
      userId: nowUserId,
    }
    findExtendsTeamApi(param).then((resData: any) => {
      const resDatas = resData.data || {}
      const resDatalist = resData.dataList || []
      // parentBelong = resDatas
      const setData = {
        teamId: resDatas.teamId,
        teamName: resDatas.teamName,
        ascriptionId: resDatas.deptId,
        ascriptionName: resDatas.deptName,
        ascriptionType: state.nowType || 0,
        deptId: resDatas.deptId,
        deptName: resDatas.deptName,
        roleId: resDatas.roleId,
        roleName: resDatas.roleName,
        userId: resDatas.userId,
        username: resDatas.username,
        userAccount: resDatas.userAccount,
        curType: 0,
        profile: resDatas.profile,
      }
      const belongInfo = getTaskBelong(setData)
      const enterpriseArr: any = []
      resDatalist.map((item: any) => {
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
      const findEndTime = async () => {
        const getEndTime: any = await getEndTimes({
          teamId: resData.teamId || resDatas.teamId,
          createType: state.createType,
          addHandly: state.addHandly,
          endTime: state.endTime,
        })
        // kr下创建子任务不查询父级支撑的okr，由外部传入
        let supportInfo: any = {}
        if (state.parentType != 3) {
          supportInfo = await findSupport({
            taskId: state.parentId,
            parentId: state.parentId,
          })
        }

        findAddAuth({ teamId: resDatas.teamId }).then((res: any) => {
          const { addOrgAuth, addDeptAuth } = res
          let newState: any = {
            ...state,
            ...belongInfo,
            joinTeams: enterpriseArr,
            endTime: getEndTime,
            addOrgAuth,
            addDeptAuth,
          }
          if (state.parentType != 3) {
            newState = { ...newState, ...supportInfo }
          }
          setState(newState)
        })
      }
      findEndTime()
    })
  }

  /**
   * 查询父级任务及关联OKR列表
   * @param taskid 查询当前任务的相关信息（编辑）
   * @param parentId 查询父级任务的信息
   */
  const findSupport = ({ taskId, parentId }: { taskId: any; parentId: any }) => {
    return new Promise((resolve: any) => {
      const param = {
        taskId,
        parentId,
      }
      findSupportApi(param).then((resData: any) => {
        //设置父级及支撑OKR
        const datas = resData.data || {}
        // console.log('findSupport:', datas)
        const supportsList = datas.supports ? datas.supports : createTaskTmp.supportOkrList
        supportsList.map((item: any) => {
          item.disabled = true
        })
        resolve({
          parentId: datas.parentId,
          parentTask: { parentId: datas.parentId, parentTaskName: datas.parentTaskName },
          //修改 kr 创建子任务，默认查询父级支撑错误问题
          supportOkrList: [],
          supports: {
            direct: [],
            inDirect: supportsList,
          },
        })
      })
    })
  }

  /**
   * 保存任务/项目
   */
  const saveTask = () => {
    console.log('saveDisable---------', saveDisable)
    const tagIds: any = []
    $.each(state.tagList || [], (_: any, item: any) => {
      tagIds.push(item.id)
    })
    if (state.name == '') {
      message.warning('任务名称不能为空字符')
      saveDisable = false
      return
    }
    if (saveDisable) {
      return
    }
    setLoading(true)
    // 禁用创建按钮，防止用户多次点击
    saveDisable = true
    // 当前汇报id合集
    const forceReportIds: any[] = []
    state.reportSets.map((item: any) => {
      forceReportIds.push(item.id)
    })
    let url = '',
      messageText = ''
    const parentId = state.parentTask?.parentId || ''
    const param: any = {
      type: state.taskType || 0, //任务类型0:任务 5项目  旧版：临时1、目标0、项目3、职能2
      ascriptionId: state.ascriptionId, //企业ID---------------
      ascriptionName: state.ascriptionName, //企业名称--------------
      ascriptionType: 2, //企业类型为2
      name: state.name, //名称
      description: createTaskTmp.description, //描述
      operateUser: nowUserId, //操作人(登陆人)
      operateUserName: nowUser, //操作人(登陆人名称)
      parentId, //创建子任务传父级任务id---------------
      supports: getSupportOKR(state.supportOkrList || []), //支撑OKR
      createType: 1, //区别快速创建于普通弹窗创建
      startTime: state.startTime, //开始时间
      endTime: state.endTime, //结束时间
      property: state.property, //公开0 私密1
      cycleModel: state.cycleModel, //循环
      tagList: tagIds, //标签
      icon: state.icon, //图标
      // fileModels: getFileList(state.fileList) || [], //文件
      fileModels: [],

      fileGuidList: state.delFileIds || [],
      liable: {
        //执行人
        ...state.liable,
      },
      distribute: { ...state.distribute }, //指派人
      executor: { ...state.execute }, //领导责任人
      supervisor: { ...state.supervisor }, //督办人
      attach: { ...state.attach },
      projectId: '',
      reminder: state.reminder || 0, //提醒时间
      checkList: state.checkList || [],
      teamList: EnterpriseList(state.joinTeams), // 参与企业
      forceReportIds, //汇报ids
      updateForceIds: Array.from(new Set(state.updateReportIds)), //更新过的汇报ids
      // 是否进入待办
      toDo: state.toDo || false,
    }
    //存在附件才传uuid
    if (state.fileList && state.fileList.length > 0) {
      param.temporaryId = state.pageUuid
    }
    if (state.createType == 'edit') {
      //编辑任务
      url = '/task/modify/id'
      messageText = '编辑任务成功'
      param.id = state.id
      //草稿任务(工作规划)
      if (state.taskFlag && state.taskFlag == 2) {
        url = '/task/work/plan/editTask'
      }
    } else {
      //创建任务
      url = '/task/addTaskByName'
      messageText = state.taskType == 1 ? '创建项目成功' : '创建任务成功'
    }
    if (state.addHandly) {
      param.parentId = state.parentId
      param.mainId = state.mainId
    }
    saveTaskApi({ param, url }).then((resData: any) => {
      setLoading(false)
      if (resData) {
        message.success(messageText)
        // 继续创建
        if (state.keepCreate) {
          // 清空数据
          const defData = clearTaskData({ clearType: 'keepCreate' })
          state.attach.star = 0 //优先级清除
          saveDisable = false
          setState({ ...state, ...defData, visible: true })
        } else {
          setState({ ...state, visible: false })
        }
        // okr 详情模式下 kr创建任务，需要过滤关联OKR项id,做刷新使用
        const supportsIds: any = []
        if (state.from == 'taskdetailOkr') {
          param.supports?.map((item: any) => {
            supportsIds.push(item.mainParentId || item.mainId)
          })
        }
        refreshList({
          data: resData.data || {},
          optType: 'addTask',
          parentId: param.parentId,
          createType: state.createType == 'edit' ? 1 : 0, //1：编辑
          parentIdOld: state.createType == 'edit' ? supportParentOld : '',
          supportsIds,
        })
        // 如果执行人是自己，刷新代办列表
        if (param.liable?.userId == nowUserId) {
          refreshPage && refreshPage()
        }
      } else {
        saveDisable = false
      }
    })
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
    state.callbacks &&
      state.callbacks(
        { data: data, optType, parentId, createType, parentIdOld, supportsIds },
        { code: getListType(state.taskType) }
      )
    ipcRenderer.send('update_unread_msg', []) //刷新左侧导航未读消息
  }
  /**
   * 取消操作
   */
  const handleCancel = () => {
    setState({ ...state, description: '', visible: false })
  }
  /**
   * 确认操作
   */
  const handleOk = () => {
    saveTask()
  }

  /**
   * 设置数据和展示
   */
  const setDetailData = ({ data }: { data: any }) => {
    const mainData = data.MAIN ? data.MAIN : data || {}
    // 后台返回startTime为undefined情况
    if (!mainData.startTime) {
      mainData.startTime = ''
    }
    const parentTask = data.PARENT_TASK || {}
    //设置父级及支撑OKR
    if (parentTask.parentId) {
      supportParentOld = parentTask.parentId
    }
    // 防止某些字段后台返回的是undefined，设置默认字段
    const mainDef = {
      liable: mainData.liable || {},
      endTime: mainData.endTime || '',
      executeTime: mainData.executeTime || '',
      status: mainData.status || 0,
      flag: mainData.flag || 0,
      level: mainData.level || 1,
      attach: mainData.attach || {},
      process: mainData.process || 0,
      subTaskCount: mainData.subTaskCount || 0,
      subTaskLevels: mainData.subTaskLevels || 0,
      childCount: mainData.childCount || 0,
      remainDays: mainData.remainDays || 0,
      type: mainData.type || 0,
      createUsername: mainData.createUsername || '',
      processUser: mainData.processUser || '',
      supports: mainData.supports ? mainData.supports : data.SUPPORTS || {},
      startTime: mainData.startTime || '',
      description: mainData.description || '',
      icon: mainData.icon || '',
      liableUser: mainData.liableUser || '',
      liableUsername: mainData.liableUsername || '',
      workPlanType: mainData.workPlanType || '',
      distribute: mainData.distribute || {},
      execute: mainData.executor ? mainData.executor : mainData.execute ? mainData.execute : {},
      supervisor: mainData.supervisor || {},
      toDo: mainData.toDo || false,
      taskType: mainData.type || 0,
    }
    // 合并详情main数据对象
    const detailMain = { ...mainData, ...mainDef }
    const supports = data.SUPPORTS ? data.SUPPORTS : {}
    const supportOkrList = supports.direct || []
    const showObj = {
      attach: detailMain.attach || {},
      liable: detailMain.liable || {},
      detailMain,
      followList: data.FOLLOW || [],
      tagList: data.TAG || [],
      fileList: data.FILES || [],
      joinTeams: data.JOIN_TEAMS || [],
      reportSets: data.REPORT_SET || [],
      targetList: data.TARGET || [],
      parentTask: data.PARENT_TASK || {},
      checkList: data.CHECK_LIST || [],
      supportOkrList,
    }
    const setData = {
      ...state,
      ...detailMain,
      ...showObj,
      refresh: state.refresh + 1,
      noData: false,
    }
    // 查询添加企业、部门级任务权限
    findAddAuth({ teamId: mainData.ascriptionId }).then((res: any) => {
      const { addOrgAuth, addDeptAuth } = res
      createTaskTmp = { ...setData, addOrgAuth, addDeptAuth }
      setState({ ...setData, addOrgAuth, addDeptAuth })
    })

    return setData
  }

  /**
   * 编辑数据
   */
  const editTaskData = (paramObj: any, attachObj?: any) => {
    const { clearType, noSetState }: any = attachObj ? attachObj : {}
    // 更改归属或人员时无需更新的字段
    const noUpdates = ['name', 'description', 'from', 'callbacks']
    let newState: any = state
    if (clearType == 'changeTeam') {
      newState = clearTaskData({ clearType })
    } else if (paramObj.parentTask) {
      state.parentId = paramObj.parentTask.parentId
      if (paramObj.parentTask.parentId) {
        //查询主岗相关信息及参与企业
        // findExtendsTeam(paramObj.parentTask.parentId)
        // return false
      } else if (paramObj.parentTask.parentId == '') {
        state.joinTeams = []
      }
    }
    Object.keys(paramObj).forEach((key: any) => {
      let isUpdate = true
      if (clearType == 'changeTeam' && noUpdates.includes(key)) {
        isUpdate = false
      }
      if (isUpdate) {
        newState[key] = paramObj[key]
      }
      createTaskTmp[key] = paramObj[key]
    })
    if (!noSetState) {
      setState({ ...state, ...newState }, { noUpdateTmp: true })
    }
  }
  /**
   * 进待办
   */
  const toDoHandle = (checked: boolean) => {
    setState({ ...state, toDo: checked })
    $store.dispatch({
      type: 'CREATETASKTODO',
      data: checked,
    })
  }
  // ***********************************上下文数据***********************************//
  const detailObj: CreateTaskContextObj = {
    mainData: state,
    detailData: state,
    editTaskData,
    editAuth: true,
    clearTaskData,
  }
  const optTxt = state.createType == 'edit' ? '编辑' : '创建'
  const typeTxt = state.taskType == 1 ? '项目' : '任务'
  return (
    <createTaskContext.Provider value={detailObj}>
      <Modal
        className="createTaskModal baseModal baseWidth scrollbarsStyle"
        visible={state.visible}
        maskClosable={false}
        keyboard={false}
        title={optTxt + typeTxt}
        onCancel={handleCancel}
        destroyOnClose={true}
        footer={
          <div className="createFooter flex between center-v">
            <div className="footerLeft flex">
              {state.createType != 'edit' ? (
                <div className="keep_create_box">
                  <Checkbox
                    checked={state.keepCreate}
                    onChange={(e: any) => {
                      e.stopPropagation()
                      setState({ ...state, keepCreate: e.target.checked })
                    }}
                  >
                    {state.taskType == 1 ? '继续创建项目' : '继续创建任务'}
                  </Checkbox>
                  {/* <Tooltip title="将保留任务归属、执行人信息继续创建任务">
                <span className="hints-continue"></span>
              </Tooltip> */}
                </div>
              ) : (
                ''
              )}
              {state.taskType == 1 ? (
                ''
              ) : (
                <div>
                  <Checkbox
                    checked={state.toDo}
                    onChange={(e: any) => {
                      e.stopPropagation()
                      toDoHandle(e.target.checked)
                    }}
                  >
                    进执行人待办事项
                  </Checkbox>
                </div>
              )}
            </div>
            <div className="button-wrap">
              <Button key="back" onClick={handleCancel}>
                取消
              </Button>
              <Button key="submit" type="primary" onClick={handleOk}>
                {state.createType == 'edit' ? '保存' : '创建'}
              </Button>
            </div>
          </div>
        }
      >
        <Spin spinning={loading} tip={'保存中，请耐心等待'}>
          {state.visible ? (
            <section className="createTaskContainer flex h100">
              <CreateTaskLeft
                createType={state.from}
                from={state.from}
                visible={state.visible}
                dataState={{
                  ...state,
                  description: createTaskTmp.description,
                }}
              />
              <CreateTaskRight visible={state.visible} dataState={state} />
            </section>
          ) : (
            ''
          )}
        </Spin>
      </Modal>
    </createTaskContext.Provider>
  )
})

const getListType = (type: number) => {
  //任务类型临时1、目标0、项目3、职能2
  let code = ''
  switch (type) {
    case 0:
      code = 'target_kanban'
      break
    case 1:
      code = 'working_team_task' //项目任务
      break
    case 2:
      code = 'function_task'
      break
    case 5:
      code = 'working_team_task'
      break
  }
  return code
}
//获取支撑OKR数据
const getSupportOKR = (supports: any) => {
  const newArr: any = []
  supports.map((item: any) => {
    newArr.push({
      mainId: item.mainId, //规划ID
      mainParentId: item.workPlanId || item.id, //规划支撑ID
      isExtends: item.isExtends || false,
    })
  })
  return newArr
}
//获取附件
export const getFileList = (fileList: any) => {
  const newFileList: any = []
  fileList.forEach((file: any) => {
    if (file) {
      // const fileName = file.fileName
      // const fileSuffix = fileName
      //   .toLowerCase()
      //   .split('.')
      //   .splice(-1)[0]
      if (file.fileId) {
        // fileGUID
        newFileList.push({
          ...file,
          dir: 'task',
        })
      } else {
        newFileList.push({
          ...file,
          id: file.fileId || '',
          dir: 'task',
        })
      }
    }
  })
  return newFileList
}
//保存获取参与企业信息
const EnterpriseList = (enterprise: any) => {
  const list = [...enterprise]
  const newArr = []
  for (let i = 0; i < list.length; i++) {
    newArr.push({
      teamId: list[i].id || list[i].teamId,
      userId: list[i].userId,
      isExtends: list[i].isExtends || '0',
      status: list[i].status || '0', //0待确认  2已differCompany加入   1已拒绝状态
    })
  }
  return newArr
}
// 查询添加企业、部门级任务的权限
export const findAddAuth = ({ teamId }: any) => {
  let addOrgAuth = true,
    addDeptAuth = true
  return new Promise((resolve: any) => {
    findAuthList({
      typeId: teamId,
      customAuthList: [],
    }).then((res: any) => {
      if (res) {
        addOrgAuth = getAuthStatus('taskOrgAdd', res) //添加企业任务权限
        addDeptAuth = getAuthStatus('taskDeptAdd', res) //添加部门任务权限
      }
      resolve({ addOrgAuth, addDeptAuth })
    })
  })
}
//设置默认截至时间
export const getEndTimes = ({
  teamId,
  createType,
  addHandly,
  endTime,
}: {
  teamId: any
  createType: string
  addHandly?: any
  endTime?: any
}) => {
  return new Promise(resolve => {
    //设置默认时间
    const end = new Date().getTime() + 24 * 60 * 60 * 1000
    const param = {
      teamInfoId: teamId,
      userId: $store.getState().nowUserId,
    }
    getWorkHoursApi(param).then((resData: any) => {
      const initend = moment(end).format(`YYYY/MM/DD ${resData.data.pmEnd}`)
      if ((createType == 'addChild' && endTime && endTime < initend) || (addHandly && endTime)) {
        //创建子任务  1.如果主任务截至时间小于明天下班时间 跟随主任务时间  2.如果主任务截至时间大于明天下班时间 默认时间是明天下班时间
        resolve(endTime)
      } else {
        resolve(initend)
      }
    })
  })
}
// 获取teamId
const getTeamId = (param: any) => {
  const { from, taskmanageData, teaminfo, ascriptionId } = param
  let teamId = ascriptionId
  // 任务管理进入获取企业id
  if (['taskManage', 'taskManage_my'].includes(from)) {
    const { isMy, orgInfo, allCompany } = taskmanageData || {}
    if (isMy) {
      teamId = allCompany?.length != 0 ? allCompany[0].id : ''
    } else {
      teamId = orgInfo?.curId
    }
  } else if (['workbench'.includes(from)]) {
    // 工作台进入获取企业id
    if (teaminfo?.length != 0) {
      teamId = teaminfo[0].id
    } else {
      const { newTeamList } = $store.getState()
      teamId = newTeamList?.length != 0 ? newTeamList[0].id : ''
    }
  }
  return teamId
}

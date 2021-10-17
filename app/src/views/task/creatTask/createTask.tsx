import React, { useEffect, useState, useContext, useRef } from 'react'
import { Avatar, DatePicker, Dropdown, Input, Menu, message, Progress, Tooltip } from 'antd'
import Editor from '@/src/components/editor/index'
import { cutName, dateFormats } from '@/src/common/js/common'
import {
  ArrowPager,
  FilesList,
  getNowPageData,
  JoinTeams,
  ReportSets,
  TagsList,
} from '../taskDetails/detailAttach'
import Priority from './priority'
import { SelectMemberOrg } from '@/src/components/select-member-org'
import { createTaskContext, CreateTaskContextObj, findAddAuth, getEndTimes } from './createTaskModal'
import { findUserChangeTeamApi } from './createTaskApi'
// import { findSupportApi } from './getData'
import { SupportModal } from '@/src/components/supportOKR/supportModal'
import LoopsTask, { loopTaskListDataShow } from '@/src/components/loop-task-date/loop-task-date'
import { loopsTaskInfo, toOKRWindow } from '../taskDetails/detailRight'
import CheckEntry from './checkEntry'
import moment from 'moment'
import './createTask.less'
import '../taskDetails/detailAttach.less'
import './createTaskRight.less'
import { findAuthList, getAuthStatus } from '@/src/common/js/api-com'
// const { Option } = Select
/**
 * 创建编辑任务内容左侧组件
 */
export const CreateTaskLeft = ({
  dataState: dataStateOut,
  visible,
}: {
  createType: string
  visible?: boolean
  dataState: any
  from?: string
  addHandly?: any
}) => {
  const createContextObj: any = useContext(createTaskContext)
  const { detailData } = createContextObj

  const reminder = dataStateOut.reminder ? dataStateOut.reminder + '' : '0'
  const attachModel = dataStateOut.attach || {}
  const [state, setState] = useState<any>({
    // dataState: dataStateOut,
    id: dataStateOut.createType == 'edit' ? dataStateOut.id : '',
    name: dataStateOut.name,
    description: dataStateOut.description,
    distribute: dataStateOut.distribute,
    execute: dataStateOut.execute,
    liable: dataStateOut.liable,
    supervisor: dataStateOut.supervisor,
    startTime: '',
    endTime: '',
    openloop: false,
    reminder,
    // createType: dataStateOut?.createType || '', //创建任务类型
  })
  //选人插件
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  //检查项
  const checkEntryRef = useRef<any>({})
  useEffect(() => {
    setState({
      ...state,
      // dataState: { ...dataStateOut },
      name: dataStateOut.name,
      description: dataStateOut.description,
      distribute: dataStateOut.distribute,
      execute: dataStateOut.execute,
      liable: dataStateOut.liable,
      supervisor: dataStateOut.supervisor,
      startTime: dataStateOut.startTime,
      endTime: dataStateOut.endTime,
      openloop: false,
      reminder,
    })
  }, [
    dataStateOut.name,
    dataStateOut.description,
    dataStateOut.execute,
    dataStateOut.liable,
    dataStateOut.supervisor,
    dataStateOut.startTime,
    dataStateOut.endTime,
    reminder,
  ])

  /**
   * 获取参与企业联系人和加入的企业
   */
  const getTeamsInfo: any = (teamList: any) => {
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
          cmyId: item.teamId || item.id,
          cmyName: item.teamName || item.name,
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
   * 选择人员
   * type:1--执行人 2--指派人 3--领导责任人 4--督办人
   */
  const selectUser = (type: number) => {
    let allowTeamId: any = []
    // 创建主任务时需要
    if (dataStateOut.createType == 'edit' || dataStateOut.createType == 'addChild') {
      //编辑任务、新增子任务 =>单个企业
      allowTeamId = [dataStateOut.ascriptionId]
    }
    const selectList: any = []
    let getSelList: any = []
    if (type == 1) {
      getSelList =
        state.liable && state.liable.userId && JSON.stringify(state.liable) != '{}' ? [state.liable] : []
    } else if (type == 2) {
      getSelList = state.distribute && JSON.stringify(state.distribute) != '{}' ? [state.distribute] : []
    } else if (type == 3) {
      getSelList = state.execute && JSON.stringify(state.execute) != '{}' ? [state.execute] : []
    } else if (type == 4) {
      getSelList = state.supervisor && JSON.stringify(state.supervisor) != '{}' ? [state.supervisor] : []
    }
    getSelList?.map((item: any) => {
      selectList.push({
        cmyId: dataStateOut.ascriptionId,
        cmyName: dataStateOut.ascriptionName,
        curId: item.userId || '',
        curName: item.username || '',
        account: item.account || '',
        profile: item.profile || '',
        curType: 0,
      })
    })
    const getTeams = getTeamsInfo(state.createType == 'addChild' ? dataStateOut.joinTeams : [])
    const selMemberOrg = {
      visible: true,
      selectList: [...selectList], //选人插件已选成员
      checkboxType: 'radio',
      permissionType: 3, //组织架构通讯录范围控制
      allowTeamId, //没有值的时候为全部企业
      checkableType: [0],
      orgBotInfo: {
        type: 'joinTeam',
        title: '参与企业联系人（该任务链条下的企业联系人）',
      },
      orgBotList: getTeams.partakeMembers || [],
      isDel: type == 1 || type == 2 ? false : true,
      onSure: (dataList: any) => {
        editMembers(dataList, type)
      },
      comMember: 'team',
    }
    setSelMemberOrg(selMemberOrg)
  }
  /**
   * 编辑人员
   */
  const editMembers = (dataList: any, type: number) => {
    const userObj = dataList[0] || {}
    // 无数据则是删除操作
    const isDel = dataList?.length == 0
    // 未更改数据则不需要更新
    if (userObj.curId == attachModel.typeId && userObj.cmyId == dataStateOut.ascriptionId) {
      return
    }
    let param: any = {}
    // 执行人
    if (type == 1) {
      param = {
        liable: !isDel
          ? {
              ascriptionId: userObj.cmyId,
              deptId: userObj.deptId,
              deptName: userObj.deptName,
              roleId: userObj.roleId,
              roleName: userObj.roleName,
              userId: userObj.curId,
              username: userObj.curName,
            }
          : {},
      }
    } else if (type == 2) {
      //指派人
      param = {
        distribute: !isDel
          ? {
              ascriptionId: userObj.cmyId,
              userId: userObj.curId,
              username: userObj.curName,
            }
          : {},
      }
    } else if (type == 3) {
      //领导责任人
      param = {
        executor: !isDel
          ? {
              ascriptionId: userObj.cmyId,
              deptId: userObj.deptId,
              deptName: userObj.deptName,
              roleId: userObj.roleId,
              roleName: userObj.roleName,
              userId: userObj.curId,
              username: userObj.curName,
            }
          : {},
      }
    } else if (type == 4) {
      param = {
        supervisor: !isDel
          ? {
              ascriptionId: userObj.cmyId,
              userId: userObj.curId,
              username: userObj.curName,
            }
          : {},
      }
    }

    const apiParam: any = {
      teamId: userObj.cmyId,
      liable: dataStateOut.liable,
      executor: dataStateOut.execute,
      distribute: dataStateOut.distribute,
      supervisor: dataStateOut.supervisor,
      ...param,
      changeType: type == 1 ? 1 : 0, //1执行人 0其他
      ascription: {
        //归属信息
        id: attachModel.typeId,
        name: attachModel.typeName,
      },
      // reqType: 0,
    }
    // 清空责任人、督办人情况下则更新当前操作人数据即可
    if (isDel) {
      // 更新首层数据
      if (param.executor) {
        apiParam.execute = param.executor
      }
      createContextObj.editTaskData(apiParam)
      return
    }
    // 切换了企业
    if (!isDel && userObj.cmyId != dataStateOut.ascriptionId) {
      apiParam.changeTeam = true
    }
    // 查询人员改变后角色联动
    findUserChangeTeamApi(apiParam).then((res: any) => {
      const getData = res.data.data || {}
      let liable = getData.liable || {}
      let distribute = getData.distribute || {}
      let executor = getData.executor || {}
      let supervisor = getData.supervisor || {}
      const ascription = getData.ascription || {}
      if (JSON.stringify(liable) != '{}') {
        liable = !isEmptyObjKey(liable) ? { ...liable, ascriptionId: userObj.cmyId } : {}
      }
      if (JSON.stringify(distribute) != '{}') {
        distribute = !isEmptyObjKey(distribute) ? { ...distribute, ascriptionId: userObj.cmyId } : {}
      }
      if (JSON.stringify(executor) != '{}') {
        executor = !isEmptyObjKey(executor) ? { ...executor, ascriptionId: userObj.cmyId } : {}
      }
      if (JSON.stringify(supervisor) != '{}') {
        supervisor = !isEmptyObjKey(supervisor) ? { ...supervisor, ascriptionId: userObj.cmyId } : {}
      }
      // console.log('findUserChangeTeamApi---', res)
      let newParam: any = {
        liable,
        execute: executor,
        distribute,
        supervisor: supervisor,
        ascriptionId: userObj.cmyId,
        ascriptionName: userObj.cmyName,
        attach: {
          ...attachModel,
          typeId: ascription.id, // 任务类型id
          typeName: ascription.name,
        },
      }
      let attachInfo = {}
      // 切换了企业则需要清空缓存 2重新查询新增权限
      if (userObj.cmyId != dataStateOut.ascriptionId) {
        attachInfo = { clearType: 'changeTeam' }
        const findEndTime = async () => {
          const endTime: any = await getEndTimes({
            teamId: userObj.cmyId,
            createType: dataStateOut.createType,
            addHandly: dataStateOut.addHandly,
            endTime: dataStateOut.endTime,
          })
          findAddAuth({ teamId: userObj.cmyId }).then(({ addOrgAuth, addDeptAuth }: any) => {
            newParam = { ...newParam, addOrgAuth, addDeptAuth, endTime }
            // 上次所选级别在当前企业下无权限时，需要重置为个人级
            if ((attachModel.type == 2 && !addOrgAuth) || (attachModel.type == 3 && !addDeptAuth)) {
              newParam.attach = { ...attachModel, type: 0 }
            }
            // 更新首层数据
            createContextObj.editTaskData(newParam, attachInfo)
          })
        }
        findEndTime()
      } else {
        // 更新首层数据
        createContextObj.editTaskData(newParam, attachInfo)
      }
    })
  }

  /**
   * 编辑循环
   */
  const editCycleModel = (datas: any) => {
    const param = {
      cycleModel: datas,
    }
    // 改变外部数据
    createContextObj.editTaskData(param)
  }

  /**
   * 设置提醒切换
   * @param menuProp
   */
  const remindMenuChange = (menuProp: any) => {
    setState({ ...state, reminder: menuProp.key })
    // 改变外部数据
    createContextObj.editTaskData({
      reminder: menuProp.key,
    })
  }
  /**
   * 编辑任务名
   */
  const changeName = (newName: string) => {
    setState({ ...state, name: newName })
    // 改变外部数据
    createContextObj.editTaskData({
      name: newName,
    })
  }
  /**
   * 编辑任务描述
   */
  // const editorChange = (content: string) => {
  //   setState({ ...state, description: content })
  //   // 改变外部数据
  //   createContextObj.editTaskData({
  //     description: content,
  //   })
  // }

  // 设置提醒菜单
  const remindMenu = (
    <Menu
      className="myDropMenu tick blue taskRemindMenu"
      selectable
      selectedKeys={[state.reminder]}
      onClick={remindMenuChange}
    >
      <Menu.Item key="0">
        <div className={'myMenuItem'}>
          <span>无提醒</span>
        </div>
      </Menu.Item>
      <Menu.Item key="1">
        <div className={'myMenuItem'}>
          <span>结束时提醒</span>
        </div>
      </Menu.Item>
      <Menu.Item key="2">
        <div className={'myMenuItem'}>
          <span>5分钟提醒</span>
        </div>
      </Menu.Item>

      <Menu.Item key="3">
        <div className={'myMenuItem'}>
          <span>15分钟提醒</span>
        </div>
      </Menu.Item>
      <Menu.Item key="4">
        <div className={'myMenuItem'}>
          <span>30分钟提醒</span>
        </div>
      </Menu.Item>
      <Menu.Item key="5">
        <div className={'myMenuItem'}>
          <span>1小时提醒</span>
        </div>
      </Menu.Item>
      <Menu.Item key="6">
        <div className={'myMenuItem'}>
          <span>12小时提醒</span>
        </div>
      </Menu.Item>
      <Menu.Item key="7">
        <div className={'myMenuItem'}>
          <span>1天提醒</span>
        </div>
      </Menu.Item>
      <Menu.Item key="8">
        <div className={'myMenuItem'}>
          <span>1周提醒</span>
        </div>
      </Menu.Item>
    </Menu>
  )

  /**
   * 任务名
   */
  // const TaskNameCom = ({ name }: any) => {
  //   const [nameState, setNameState] = useState({
  //     name,
  //   })
  //   useEffect(() => {
  //     setNameState({
  //       ...nameState,
  //       name,
  //     })
  //   }, [name])
  //   /**
  //    * 编辑任务名
  //    */
  //   const changeTaskName = (newName: string) => {
  //     setNameState({ ...nameState, name: newName })
  //     // 改变外部数据
  //     // createContextObj.editTaskData({
  //     //   name: newName,
  //     // })
  //   }
  //   return (
  //     <div className="task-names">
  //       <Input
  //         onChange={(e: any) => {
  //           changeTaskName(e.target.value)
  //         }}
  //         autoFocus
  //         maxLength={100}
  //         placeholder="任务名称"
  //         value={nameState.name}
  //       />
  //     </div>
  //   )
  // }

  // =====================================数据渲染处理===========================================//
  const editAuth = true
  // 执行人（当前改为责任人）
  const liableObj = state.liable || {}
  // 指派人
  const distributeObj = state.distribute || {}
  // 领导责任人
  const executorObj = state.execute || {}
  const supervisorObj = state.supervisor || {}
  const liableProfile = liableObj.profile || ''
  const distributeProfile = distributeObj.profile || ''
  const executorProfile = executorObj.profile || ''
  const supervisorProfile = supervisorObj.profile || ''

  const dataState = dataStateOut
  let showCycleTxt = '设置循环'
  if (dataState.cycleModel && JSON.stringify(dataState.cycleModel) != '{}') {
    const loopsTask = loopsTaskInfo({ cycleModel: dataState.cycleModel })
    showCycleTxt = loopsTask.showTxt
  }
  const remindInfo = getRemindInfo({ key: state.reminder || '0' })
  return (
    <div className="createTaskLeft flex-1">
      {/* =====任务名行======= */}
      <div className="taskRow taskNameRow">
        <span className="taskIcon img_icon required"></span>
        <div className="taskItem">
          {/* <TaskNameCom name={dataStateOut.name} /> */}
          <div className="task_names">
            <Input
              onChange={(e: any) => {
                changeName(e.target.value)
              }}
              autoFocus
              maxLength={100}
              placeholder={dataState.taskType == 1 ? '项目名称' : '任务名称'}
              value={state.name}
            />
          </div>
        </div>
      </div>
      {/* =====任务描述行======= */}
      <TaskDesCom
        description={dataStateOut.description}
        createContextObj={createContextObj}
        visible={visible}
        // refresh={dataStateOut.refresh}
        taskType={dataStateOut.taskType}
      />

      {/* =====任务成员行======= */}
      <div className="taskRow taskMemberRow">
        <span className="taskIcon img_icon"></span>
        <div className="taskItem flex between">
          {/* 执行人 */}
          <div
            className={`memberItem flex center-v ${!editAuth ? 'pointerDisable' : ''}`}
            onClick={() => {
              selectUser(1)
            }}
          >
            {/* default-head-g */}
            <div>
              <Avatar
                key="liable"
                className={`oa-avatar ${!liableProfile && !liableObj.username ? 'default-head-g' : ''}`}
                src={liableProfile || null}
                style={{ backgroundColor: !liableObj.username ? 'inherit' : '#4285f4' }}
              >
                {liableObj.username || ''}
              </Avatar>
            </div>
            <div>
              <p className="liable_name text-ellipsis">{liableObj.username || ''}</p>
              <p className="role_name">执行人</p>
            </div>
          </div>
          {/* 指派人 */}
          <div
            className={`memberItem flex center-v ${!editAuth ? 'pointerDisable' : ''}`}
            onClick={() => {
              selectUser(2)
            }}
          >
            {/*  default-head-b */}
            <div>
              <Avatar
                key="distribute"
                className={`oa-avatar ${!distributeProfile && !distributeObj.username ? 'default-head-b' : ''}`}
                src={distributeProfile || null}
                style={{ backgroundColor: !distributeObj.username ? 'inherit' : '#4285f4' }}
              >
                {distributeObj.username || ''}
              </Avatar>
            </div>
            <div>
              <p className="liable_name text-ellipsis">{distributeObj.username || ''}</p>
              <p className="role_name">指派人</p>
            </div>
          </div>
          {/* 领导责任人 */}
          <div
            className={`memberItem flex center-v ${!editAuth ? 'pointerDisable' : ''}`}
            onClick={() => {
              selectUser(3)
            }}
          >
            <div>
              <Avatar
                key="leader"
                className={`oa-avatar ${!executorProfile && !executorObj.username ? 'default-head-g' : ''}`}
                src={executorProfile || null}
                style={{ backgroundColor: !executorObj.username ? 'inherit' : '#4285f4' }}
              >
                {executorObj.username || ''}
              </Avatar>
            </div>
            <div>
              <p className="liable_name text-ellipsis">{executorObj.username || ''}</p>
              <p className="role_name">领导责任人</p>
            </div>
          </div>
          {/* 督办人 */}
          <div
            className={`memberItem flex center-v ${!editAuth ? 'pointerDisable' : ''}`}
            onClick={() => {
              selectUser(4)
            }}
          >
            <div>
              <Avatar
                key="supervisor"
                className={`oa-avatar ${!supervisorProfile && !supervisorObj.username ? 'default-head-b' : ''}`}
                src={supervisorProfile || null}
                style={{ backgroundColor: !supervisorObj.username ? 'inherit' : '#4285f4' }}
              >
                {supervisorObj.username || ''}
              </Avatar>
            </div>
            <div>
              <p className="liable_name text-ellipsis">{supervisorObj.username || ''}</p>
              <p className="role_name">督办人</p>
            </div>
          </div>
        </div>
      </div>
      {/* =====开始结束时间======= */}

      <div className="taskRow taskTimesRow">
        <div className="taskIcon img_icon"></div>
        <div className="taskItem flex between">
          <TaskTimes startTime={dataStateOut.startTime} endTime={dataStateOut.endTime} />

          {/* 循环 */}
          {/* 草稿任务不展示 */}
          {dataStateOut?.flag != 2 && (
            <Tooltip title={loopTaskListDataShow(dataState.cycleModel || {})}>
              <div
                className="task_time_opt cycle_opt"
                onClick={(e: any) => {
                  e.preventDefault()
                  setState({ ...state, openloop: true })
                }}
              >
                <em className="img_icon cycle_icon"></em>
                <span>{showCycleTxt}</span>
              </div>
            </Tooltip>
          )}
          {/* 提醒 */}
          {/* 草稿任务不展示 */}
          {dataStateOut?.flag != 2 && (
            <Dropdown
              overlay={remindMenu}
              trigger={['click']}
              placement={'topCenter'}
              overlayClassName="taskRemindMenuDrop"
            >
              <Tooltip
                title={
                  remindInfo == '无提醒' ? '' : remindInfo == '' ? '结束时提醒' : '结束前' + remindInfo + '提醒'
                }
              >
                <div className="task_time_opt remind_opt">
                  <em className="img_icon remind_icon"></em>
                  <span>{remindInfo == '' ? '结束时' : remindInfo}</span>
                </div>
              </Tooltip>
            </Dropdown>
          )}
        </div>
      </div>
      {/* =====check项======= */}
      <div className="taskRow taskCheckRow">
        <span className="taskIcon img_icon"></span>
        <div className="taskItem">
          <div className="add_check_row">
            {detailData.checkList.length == 0 ? '' : <div className="check_txt">check清单</div>}
          </div>
          {/* check项组件放在这TODO: */}
          <CheckEntry
            ref={checkEntryRef}
            initRefresh={{ init: true, refreshType: 'init' }}
            times={0}
            param={{
              from: 'creatTask',
              isedit: true,
              taskid: state.id,
              teamId: detailData.ascriptionId,
              initData: detailData.checkList, //初始化数据
              iseditCheck: true, //是否可以编辑检查项
              isshowNoneData: false, //无数据是否显示空白页
            }}
            getDatas={(datas: any) => {
              createContextObj.editTaskData({
                checkList: [...datas],
              })
            }}
            setInitRefresh={() => {
              // setInitcheck({ ...initcheck, init: true, refreshType: 'init', enterType: '', farid: '' })
            }}
          ></CheckEntry>
          <div
            className="add_check_btn flex center-v"
            onClick={() => {
              checkEntryRef.current && checkEntryRef.current.addCheckList()
            }}
          >
            <em className="img_icon add_cross_icon blue"></em>
            <span className="add_check_txt">添加check项</span>
          </div>
        </div>
      </div>

      {/* 选人插件 */}
      {selMemberOrg.visible && (
        <SelectMemberOrg
          param={{
            ...selMemberOrg,
          }}
          action={{
            setModalShow: (flag: boolean) => {
              setSelMemberOrg({ ...selMemberOrg, visible: flag })
            },
          }}
        />
      )}
      {/* 循环组件 */}
      {state.openloop && (
        <LoopsTask
          param={{
            visible: state.openloop,
            initdatas: dataState.cycleModel,
          }}
          action={{
            setModalShow: (flag: boolean) => {
              setState({ ...state, openloop: flag })
            },
            onOk: (datas: any) => {
              editCycleModel(datas)
            },
          }}
        ></LoopsTask>
      )}
    </div>
  )
}
/**
 * 创建编辑任务内容右侧组件
 */
export const CreateTaskRight = ({ dataState }: { visible?: boolean; dataState: any }) => {
  const createContextObj: any = useContext(createTaskContext)
  return (
    <div className="createTaskRight detailRightAttach">
      {/* ===顶部区=== */}
      <BaseInfoCont dataState={dataState} />
      {/* ===归属区=== */}
      <TaskBelong dataState={dataState} taskContextObj={createContextObj} useFrom="createTask" />
      {/* ===支撑的OKR=== */}
      {/* 2：草稿任务 不展示*/}
      {dataState?.flag != 2 && (
        <SupportOKRs
          supportOkrList={dataState.supportOkrList || []}
          refresh={dataState.refresh}
          supports={dataState.supports}
          soureForm="createTask"
        />
      )}

      {/* ====参与企业联系人区=== */}
      {/* 2：草稿任务 不展示*/}
      {dataState?.flag != 2 && (
        <JoinTeams joinTeams={dataState.joinTeams || []} contextObj={createTaskContext} useFrom="createTask" />
      )}
      {/* ====汇报设置区=== */}
      {/* 2：草稿任务 不展示 */}
      {dataState?.flag != 2 && (
        <ReportSets
          reportSets={dataState.reportSets || []}
          taskId={dataState.id}
          refresh={dataState.refresh}
          contextObj={createTaskContext}
          useFrom={'createTask_' + dataState.createType}
        />
      )}
      {/* ===父级任务（项目+草稿任务 不需要）=== */}
      {dataState.taskType == 0 && dataState?.flag != 2 ? <ParentTask dataState={dataState} /> : ''}
      {/* ====标签区=== */}
      <TagsList
        tagList={dataState.tagList || []}
        icon={dataState.icon || ''}
        contextObj={createTaskContext}
        useFrom="createTask"
      />
      {/* ====附件区=== */}
      <FilesList
        dataState={dataState}
        fileList={dataState.fileList || []}
        taskId={dataState.id}
        orgId={dataState.ascriptionId}
        contextObj={createTaskContext}
        useFrom="createTask"
      />
    </div>
  )
}
/**
 * 顶部任务级别
 */
const BaseInfoCont = ({ dataState: dataStateOut }: any) => {
  const createContextObj: any = useContext(createTaskContext)
  const { attach, property } = dataStateOut
  const [state, setState] = useState<any>({
    taskRank: attach.type || 0,
    property,
    teamId: '',
    priorityVisible: false,
    priType: 0,
    priNum: 0,
    attach,
    dataState: dataStateOut,
  })
  /**
   * 监听数据改变
   */
  useEffect(() => {
    setState({ ...state, attach, property, taskRank: attach.type || 0, dataState: dataStateOut })
  }, [attach, property, dataStateOut.ascriptionId])

  /**
   * 优先级显示
   */
  const getPriority = ({ priType, priNum }: any) => {
    let priorityShow: any = ''
    if (!priNum) {
      priorityShow = '优先级'
    } else if (!priType || priType == '0') {
      // 星级
      priorityShow = (
        <>
          <span>{priNum}</span>
          <em className="img_icon star_icon"></em>
        </>
      )
    } else {
      // 数字优先级
      const priorityIcon = $tools.asAssetsPath(`/images/common/number-${priNum}.png`)
      priorityShow = (
        <span>
          <i className="img_icon task_sign_icon num_priority_item">
            <img
              src={priorityIcon}
              style={{
                width: '100%',
              }}
            />
          </i>
        </span>
      )
    }
    return priorityShow
  }
  // =======================数据渲染处理=======================//
  const attachState = state.attach
  const dataState = state.dataState || {}
  return (
    <>
      <div className="attachCont rankInfoCont flex center-v between">
        {/* ====级别=== */}
        {/* <Select
          value={state.taskRank}
          className="taskRankSelShow"
          dropdownClassName="taskRankSel"
          suffixIcon={<span className="img_icon tri_down"></span>}
          onChange={rankChange}
        >
          <Option value="0">个人任务</Option>
          <Option value="1">部门任务</Option>
          <Option value="2">企业任务</Option>
        </Select> */}
        {/* <Dropdown
          overlay={rankMenu}
          trigger={['click']}
          placement={'bottomCenter'}
          overlayClassName="taskRankMenuDrop"
        >
          <div className="taskRankMenuShow flex center-v">
            <span className="selected_txt">{getRankInfo({ key: state.taskRank })}</span>
            <em className="img_icon tri_down"></em>
          </div>
        </Dropdown> */}
        <TaskDetailRank
          taskContextObj={createContextObj}
          attach={dataState?.attach}
          ascriptionId={dataState.ascriptionId}
          useFrom="createTask"
        />
        {/* ====优先级==== */}
        {/* 2:草稿任务 不展示 */}
        {dataState?.flag != 2 && (
          <Dropdown
            visible={state.priorityVisible}
            onVisibleChange={(flag: boolean) => {
              setState({ ...state, priorityVisible: flag })
            }}
            overlay={
              <Priority
                visible={state.priorityVisible}
                param={{
                  from: 'creatTask',
                  teamId: dataState.ascriptionId,
                  deptId: attachState.typeId,
                  roleId: attachState.typeId,
                  taskId: dataState.id,
                  initDatas: { data: attachState.star, type: attachState.setType || 0 }, //用于反显的数据 0为清除
                  ascriptionType: attachState.type,
                }}
                // dropType="Dropdown"
                onOk={(datas: any) => {
                  const { type, data } = datas
                  const newAttach = { ...state.attach, star: data, setType: type || 0 }
                  setState({ ...state, priorityVisible: false, attach: newAttach })
                  // 改变外部数据
                  createContextObj.editTaskData({
                    attach: newAttach,
                  })
                }}
                setvisible={(flag: boolean) => {
                  setState({ ...state, priorityVisible: flag })
                }}
              />
            }
            trigger={['click']}
            placement={'bottomRight'}
            overlayClassName="prioritySelDrop"
          >
            <div className="prioritySelectShow flex center-v">
              <div className="selected_txt">
                {getPriority({ priType: attachState.setType, priNum: attachState.star })}
              </div>
              <em className="img_icon tri_down"></em>
            </div>
          </Dropdown>
        )}

        <div
          className="task_property"
          onClick={() => {
            const propertyNew = state.property ? 0 : 1
            setState({ ...state, property: propertyNew })
            // 改变外部数据
            createContextObj.editTaskData({
              property: propertyNew,
            })
          }}
        >
          <span>{state.property == 0 ? '公开' : '私密'}</span>
          <em className={`${state.property == 0 ? 'public_prop' : 'private_prop'}`}></em>
        </div>
      </div>
    </>
  )
}

/**
 * 归属组件
 */
export const TaskBelong = ({ dataState: dataStateOut, taskContextObj, useFrom }: any) => {
  const { attach: attachModel } = dataStateOut
  // const mainData: any = taskContextObj.mainData || {}
  const [state, setState] = useState<any>({
    deptName: '',
    teamName: '',
    attach: attachModel,
    dataState: dataStateOut,
  })
  //选人插件
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  const { attach } = state
  /**
   * 监听数据改变
   */
  useEffect(() => {
    setState({ ...state, attach: attachModel, dataState: dataStateOut })
  }, [attachModel])

  const teamProfileDef = state.attach.profile || $tools.asAssetsPath('images/common/company_default.png')
  const deptName = attach.typeName || ''

  const dataState = state.dataState || {}
  return (
    <div className={`attachCont belongCont`}>
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          <span className="tit_txt">归属于</span>
        </div>
        <div className="actionBtn">
          <span
            className={`img_icon set_liable_btn`}
            onClick={() => {
              selectAffiliation({
                setSelMemberOrg,
                taskContextObj,
                dataStateOut,
                attachobj: state.attach || {},
                useFrom,
              })
            }}
          ></span>
        </div>
      </header>
      <div className={`showListBox`}>
        <div
          className={`belongItem flex center-v`}
          onClick={() => {
            selectAffiliation({
              setSelMemberOrg,
              taskContextObj,
              dataStateOut,
              attachobj: state.attach || {},
              useFrom,
            })
          }}
        >
          <div>
            <Avatar className="oa-avatar" src={teamProfileDef}></Avatar>
          </div>
          <div className="belong_name_box">
            <p className="dept_name text-ellipsis">{deptName || ''}</p>
            <p className="team_name text-ellipsis">{dataState.ascriptionName || ''}</p>
          </div>
        </div>
      </div>
      {/* 选择人员弹框 */}
      {selMemberOrg.visible ? (
        <SelectMemberOrg
          param={{ ...selMemberOrg }}
          action={{
            setModalShow: (flag: boolean) => {
              setSelMemberOrg({ ...selMemberOrg, visible: flag })
            },
          }}
        />
      ) : (
        ''
      )}
    </div>
  )
}

/**
 * 父级任务
 */
const ParentTask = ({ dataState: dataStateOut }: any) => {
  const { parentTask } = dataStateOut
  const createTaskObj: CreateTaskContextObj = useContext(createTaskContext)
  const [state, setState] = useState<any>({
    deptName: '',
    teamName: '',
    parentTask: {},
    dataState: dataStateOut,
  })
  const [support, setSupport] = useState<any>({
    type: 0, //0选择任务 1选择OKR
    selectList: [],
    disableList: [],
  })
  const parentTaskState = state.parentTask || {}
  /**
   * 监听数据改变
   */
  useEffect(() => {
    setState({ ...state, parentTask: parentTask || {}, dataState: dataStateOut })
  }, [dataStateOut])

  //选择父级任务及支撑OKR
  const setSupportFn = () => {
    const selectList: any = []
    //选择父级任务
    // if ($('.item-org.line').text() == '企业级') {
    //   if ($('.item-org.line').text() == '企业级') {
    //     message.warning('企业级不支持添加父级')
    //   }
    //   return
    // }
    if (parentTaskState.parentId) {
      selectList.push(parentTaskState.parentId)
    }
    setSupport({
      ...support,
      visible: true,
      selectList,
      type: 0, //0选择任务 1选择OKR
      onSure: (dataList: any, _: any) => {
        // console.log(dataList, delList)
        selParentTaskSure(dataList)
      },
    })
  }
  /**
   * 选择父级任务确认
   * @param dataList
   */
  const selParentTaskSure = (dataList: any) => {
    if (dataList && dataList[0]) {
      const parentTask = dataList[0] || {}
      createTaskObj.editTaskData({
        parentTask: { parentId: parentTask.id, parentTaskName: parentTask.name },
      })
    }
  }
  /**
   * 删除父级任务
   * @param dataList
   */
  const delParentTask = () => {
    createTaskObj.editTaskData({
      parentTask: { parentId: '', parentTaskName: '' },
    })
  }

  // =======================数据渲染处理=======================//
  const dataState = state.dataState || {}
  return (
    <div className={`attachCont parentTaskCont`}>
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          <span className="tit_txt">父级任务</span>
        </div>
        <div className="actionBtn">
          {/* set_liable_btn */}
          <span
            className={`img_icon ${parentTaskState.parentTaskName ? 'edit_task_btn' : 'add_cross_icon'} ${
              dataState.createType == 'addChild' ? 'forcedHide' : ''
            }`}
            onClick={() => {
              setSupportFn()
            }}
          ></span>
        </div>
      </header>
      {parentTaskState?.parentTaskName && (
        <div className={`showListBox`}>
          <div
            className={`parentTaskItem flex center-v between ${
              parentTaskState?.parentTaskName ? '' : 'forcedHide'
            }`}
            onClick={() => {
              if (dataState.createType == 'addChild') {
                return
              }
              setSupportFn()
            }}
          >
            <div className="text_show flex-1">{parentTaskState?.parentTaskName || ''}</div>
            <em
              className={`img_icon del_item_icon cross ${
                dataState.createType == 'addChild' ? 'forcedHide' : ''
              }`}
              onClick={(e: any) => {
                e.stopPropagation()
                delParentTask()
              }}
            ></em>
          </div>
        </div>
      )}

      {/* 选择父级任务及选择支撑okr */}
      {support.visible && (
        <SupportModal
          param={{
            ...support,
            allowTeamId: [dataState?.teamId || dataState.ascriptionId], //组织架构的企业id
            contentType: 'task',
            checkboxType: 'radio',
            disabTaskId: dataState.id ? [dataState.id] : [], //查询任务列表需要排除的任务id[后台禁用当前及子任务不能选择]
            isshowKR: true, //是否显示KR
            showType: 1, //1是父级任务列表，2是规划关联任务列表
            // okrRelevanceType: 0,
            disableList: support.disableList || [], //禁用
          }}
          action={{
            setModalShow: (flag: boolean) => {
              setSupport({
                ...support,
                visible: flag,
              })
            },
          }}
        />
      )}
    </div>
  )
}

/**
 * 支撑的OKR组件
 */
export const SupportOKRs = (props: {
  supportOkrList?: any
  supports?: any
  contextObj?: any
  refresh?: any
  soureForm?: string
  createText?: string //设置组件文案
}) => {
  const { contextObj, supports: supportsInfo, refresh, soureForm, createText } = props
  const createTaskObj: any = useContext(contextObj ? contextObj : createTaskContext)
  // isReFreshOrgLeft
  const { mainData } = createTaskObj
  const supports = supportsInfo || {}
  const directList = supports?.direct || []
  const indirectList = supports?.inDirect || []

  // 当前传入单类型数据（支撑或者间接支撑）
  const supportOkrList = props.supports ? [...directList] : props.supportOkrList ? props.supportOkrList : []
  // 当前传入的所有类型数据
  const allSupportList = props.supports
    ? [...directList, ...indirectList]
    : props.supportOkrList
    ? props.supportOkrList
    : []
  // 支撑数据统计
  const supportCount = props.supports ? directList.length + indirectList.length : supportOkrList.length
  // 间接支撑不可删除
  indirectList?.map((item: any) => {
    const findI = directList.findIndex((fItem: any) => fItem.id == item.id)
    // 间接支撑也在直接支撑数据之内时，按直接支撑处理
    if (findI == -1) {
      item.disabled = true
    }
  })
  // 是否是归档任务
  const isArchive = mainData.flag == 3
  // state定义
  const [state, setState] = useState<any>({
    supportOkrList: [],
    pageNo: 1,
    pageSize: 3,
    totalPages: 0,
    allDataList: [],
    navActive: 0,
  })
  //选择父级任务及选择支撑okr
  const [support, setSupport] = useState<any>({
    visible: false,
    selectList: [],
  })
  /**
   * 监听外部传入数据改变
   */
  useEffect(() => {
    const totalPages = Math.ceil(supportOkrList.length / state.pageSize)
    const handleList = getNowPageData({
      pageNo: state.pageNo,
      pageSize: state.pageSize,
      handleList: [...supportOkrList],
    })
    setState({
      ...state,
      supportOkrList: [...handleList],
      totalPages,
      allDataList: JSON.parse(JSON.stringify(supportOkrList)),
      navActive: 0,
    })
  }, [mainData.id, refresh])

  /**
   * 选择支撑OKR
   */
  const selSupport = () => {
    const selectList: any = []
    const disableList: any = []
    allSupportList?.map((item: any) => {
      selectList.push(item.id || '')
      if (item.disabled) {
        disableList.push(item.id || '')
      }
    })
    setSupport({
      ...support,
      visible: true,
      selectList: [...selectList],
      disableList,
      onSure: (dataList: any, delList: any) => {
        // delList: 删除的集合
        if (delList.length > 0) {
          const newOkrList = pushOkrContentFn(dataList, delList)
          supportSure(newOkrList, [])
        } else {
          supportSure(dataList, [...allSupportList])
        }
      },
    })
  }
  //取消选择的数据
  const pushOkrContentFn = (vaule: any, data?: any) => {
    const json1 = vaule || []
    const json2 = [...supportOkrList]
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
    return newJson
  }
  /**
   * 支撑确认
   */
  const supportSure = (dataList: any, selectList: any) => {
    const supports: any = []
    // 详情保存数据
    const detailSaveSupports: any = []
    selectList?.map((item: any) => {
      const findI = indirectList.findIndex((fItem: any) => fItem.id == item.id)
      // 排除间接支撑数据
      if (findI == -1) {
        supports.push(item)
        detailSaveSupports.push({
          mainId: item.mainId || '', //规划ID
          mainParentId: item.id || '', //规划支撑ID
          isExtends: false,
        })
      }
    })

    dataList?.map((item: any) => {
      const findI = selectList.findIndex((fItem: any) => fItem.id == item.id)
      // 排除已选择数据
      if (findI == -1) {
        supports.push({
          id: item.id,
          name: item.taskName,
          type: item.type,
          typeId: item.typeId,
          mainId: item.mainId,
          createTime: item.startTime,
          endTime: item.endTime,
          process: item.progress?.percent || 0,
          liableUserProfile: item.liableUserProfile || '',
          liableUsername: item.liableUsername || '',
          periodText: item.periodText,
          periodId: item.periodId,
        })
        detailSaveSupports.push({
          mainId: item.mainId || '', //规划ID
          mainParentId: item.id || '', //规划支撑ID
          isExtends: false,
        })
      }
    })
    // 详情调用需要及时请求接口刷新
    if (soureForm?.includes('detail')) {
      createTaskObj.editSupports({
        supports: detailSaveSupports,
      })
    } else {
      createTaskObj.editTaskData({
        supportOkrList: supports,
        supports: {
          direct: supports,
          inDirect: indirectList,
        },
      })
    }
  }
  /**
   * 删除支撑的okr
   */
  const delSupport = (item: any) => {
    const list = [...state.allDataList]
    // 详情保存数据
    const detailSaveSupports: any = []
    //删除
    for (let i = 0; i < list.length; i++) {
      if (item.id == list[i].id) {
        list.splice(i, 1)
        i--
      } else {
        detailSaveSupports.push({
          mainId: list[i].mainId || '', //规划ID
          mainParentId: list[i].id || '', //规划支撑ID
          isExtends: false,
        })
      }
    }
    // 详情调用需要及时请求接口刷新
    if (soureForm?.includes('detail')) {
      createTaskObj.editSupports({
        supports: detailSaveSupports,
      })
    } else {
      createTaskObj.editTaskData({
        supportOkrList: [...list],
        supports: {
          direct: [...list],
          inDirect: indirectList,
        },
      })
    }
  }
  /**
   * 切换页码
   */
  const pageChange = ({ dataList }: any) => {
    setState({ ...state, supportOkrList: [...dataList] })
  }

  /**
   * 支撑导航切换
   * @param type
   */
  const supportChange = (type: number) => {
    const supportOkrList = type == 1 ? indirectList : directList
    const totalPages = Math.ceil(supportOkrList.length / state.pageSize)
    const handleList = getNowPageData({
      pageNo: 1,
      pageSize: state.pageSize,
      handleList: [...supportOkrList],
    })
    setState({
      ...state,
      navActive: type,
      pageNo: 1,
      supportOkrList: handleList,
      totalPages,
      allDataList: [...supportOkrList],
    })
  }
  return (
    <div className={`attachCont supportOKRCont ${state.totalPages > 1 ? 'fixedH' : ''}`}>
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          {createText ? (
            <span>向上支撑</span>
          ) : (
            <>
              <span className="tit_txt">支撑的OKR</span>
              <span className="count_txt">({supportCount})</span>
            </>
          )}
        </div>
        <div className="actionBtn">
          <span
            className={`img_icon add_cross_icon ${!isArchive ? '' : 'forcedHide'}`}
            onClick={selSupport}
          ></span>
        </div>
      </header>
      <div
        className={`showListBox ${
          (supportOkrList && supportOkrList.length > 0) || props.supports ? '' : 'forcedHide'
        }`}
      >
        {/* 导航切换 */}
        {props.supports && !createText ? (
          <ul className="supportOkrNav flex center-v">
            <li
              className={`${state.navActive == 0 ? 'active' : ''}`}
              onClick={(e: any) => {
                e.stopPropagation()
                supportChange(0)
              }}
            >
              直接支撑({directList?.length})
            </li>
            <li
              className={`${state.navActive == 1 ? 'active' : ''}`}
              onClick={(e: any) => {
                e.stopPropagation()
                supportChange(1)
              }}
            >
              间接支撑({indirectList?.length})
            </li>
          </ul>
        ) : (
          ''
        )}
        {/* 列表展示 */}
        <div className="showList supportOKRList flex wrap">
          {state.supportOkrList?.map((item: any, i: number) => {
            const avatarName = cutName(item.liableUsername || '', 2, -1) || ''
            const createTime = dateFormats('yyyy/MM/dd', item.createTime || '')
            const endtTime = dateFormats('HH:mm', item.endTime || '')
            // const periodText = item.detailsVo?.periodText
            const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
            let liableUserProfile = item.liableUserProfile || null
            if (!item.liableUserProfile && !avatarName) {
              liableUserProfile = headDef
            }

            return (
              <div key={i} className="supportItem flex between center-v" onClick={selSupport}>
                <div className="support_left flex-1 flex">
                  <Avatar
                    className="oa-avatar"
                    src={liableUserProfile}
                    style={{ backgroundColor: !item.liableUserProfile && !avatarName ? 'inherit' : '#4285f4' }}
                  >
                    {avatarName}
                  </Avatar>
                  <div className="flex-1" style={{ maxWidth: 'calc(100% - 40px)' }}>
                    <div
                      className="okr_name text-ellipsis"
                      onClick={(e: any) => {
                        e.stopPropagation()
                        item.form = 'detail'
                        toOKRWindow(item.detailsVo)
                      }}
                    >
                      {item.name || ''}
                    </div>
                    <div className="okr_info_bot flex between center-v">
                      <div className="okr_des_info">
                        <span className="okr_type">{item.type == 2 ? 'O' : 'KR'}</span>
                        <span className="okr_time">
                          {' '}
                          {/* {createTime}-{endtTime} */}
                          {item.detailsVo ? item.detailsVo.periodText : item.periodText}
                        </span>
                      </div>
                      <span className="okr_progress_num">{item.process || 0}%</span>
                    </div>
                  </div>
                </div>
                {/* <div className="support_right">
                  <Progress
                    className="support_progress"
                    strokeColor={'#4285f4'}
                    trailColor={'#e9f2ff'}
                    type={'circle'}
                    percent={item.process || 0}
                    width={32}
                    strokeWidth={12}
                  ></Progress>
                  <div className="del_item_box flex center-v"></div>
                </div> */}
                <div className={`del_item_box flex center-v ${item.disabled ? 'forcedHide' : ''}`}>
                  <em
                    className="img_icon del_item_icon cross gradient"
                    onClick={(e: any) => {
                      e.stopPropagation()
                      delSupport(item)
                    }}
                  ></em>
                </div>
              </div>
            )
          })}
        </div>
        <div className={`attachPager ${state.totalPages > 1 ? '' : 'forcedHide'}`}>
          <ArrowPager
            pageNo={state.pageNo}
            pageSize={state.pageSize}
            totalPages={state.totalPages}
            allDataList={state.allDataList}
            pageChange={pageChange}
          />
        </div>
        {/* 选择父级任务及选择支撑okr */}
        {support.visible && (
          <SupportModal
            param={{
              ...support,
              periodId: soureForm == 'createObject' ? mainData.periodId : '',
              allowTeamId: [mainData?.teamId || mainData?.ascriptionId], //组织架构的企业id
              contentType: 'okr',
              checkboxType: 'checkbox',
              disabTaskId: mainData?.id ? [mainData?.id] : [], //查询任务列表需要排除的任务id[后台禁用当前及子任务不能选择]
              isshowKR: true, //是否显示KR
              showType: 1, //1是父级任务列表，2是规划关联任务列表
              okrRelevanceType: 0,
              disableList: support.disableList || [], //禁用
            }}
            action={{
              setModalShow: (flag: boolean) => {
                setSupport({
                  ...support,
                  visible: flag,
                })
              },
            }}
          />
        )}
      </div>
    </div>
  )
}
/**
 * 提醒显示
 */
const getRemindInfo = ({ key }: any) => {
  let remindTxt = '无提醒'
  switch (key + '') {
    case '1':
      remindTxt = ''
      break
    case '2':
      remindTxt = '5分钟'
      break
    case '3':
      remindTxt = '15分钟'
      break
    case '4':
      remindTxt = '30分钟'
      break
    case '5':
      remindTxt = '1小时'
      break
    case '6':
      remindTxt = '12小时'
      break
    case '7':
      remindTxt = '1天'
      break
    case '8':
      remindTxt = '1周'
      break
  }
  return remindTxt
}
/**
 * 任务描述
 */
const TaskDesCom = ({ description, taskType }: any) => {
  const createContextObj: any = useContext(createTaskContext)
  // const { mainData } = createContextObj
  const [desState, setDesState] = useState({
    description,
  })
  useEffect(() => {
    setDesState({
      ...desState,
      description,
    })
  }, [description])
  /**
   * 编辑任务描述
   */
  const editorTaskChange = (content: string) => {
    setDesState({ ...desState, description: content })
    // 改变外部数据
    createContextObj.editTaskData(
      {
        description: content,
      },
      { noSetState: true }
    )
  }
  /**
   * 失去焦点时更新外部state
   */
  // const editorDesBlur = () => {
  //   // 改变外部数据
  //   createContextObj.editTaskData({
  //     description: desState.description,
  //   })
  // }
  return (
    <div className="taskRow taskDesRow">
      <span className="taskIcon img_icon"></span>
      <div className="taskItem">
        <div className="task_des_box">
          <Editor
            editorContent={desState.description}
            editorChange={(content: string) => {
              editorTaskChange(content)
            }}
            // onBlur={(content: string) => {
            //   editorDesBlur()
            // }}
            minHeight={70}
            height={70}
            placeholder={taskType == 1 ? '添加项目描述' : '添加任务描述'}
            className="createTasksEditor"
            previewArea=".createTasksEditor"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * 任务时间
 */
const TaskTimes = ({ startTime, endTime }: any) => {
  const createContextObj: any = useContext(createTaskContext)
  const [state, setState] = useState({
    startTime,
    endTime,
  })
  const startTimeRef = useRef<any>({})
  useEffect(() => {
    setState({
      ...state,
      startTime,
      endTime,
    })
  }, [startTime, endTime])

  /**
   * 编辑时间
   */
  const editTimes = (val: any, type: string) => {
    let times: any = ''
    if (val) {
      times = moment(val).format('YYYY/MM/DD HH:mm')
    }
    let startTime = state.startTime,
      endTime = state.endTime
    if (type == 'startTime') {
      startTime = times
    } else if (type == 'endTime') {
      endTime = times
    }
    if (startTime > endTime) {
      return message.error('开始时间不得大于结束时间')
    }

    // setState({ ...state, [type]: times })
    // 改变外部数据
    createContextObj.editTaskData({
      [type]: times,
    })
  }
  return (
    <div className="taskTimes">
      <DatePicker
        ref={startTimeRef}
        showTime={{ format: 'HH:mm' }}
        placeholder="开始时间"
        format={'YYYY/MM/DD HH:mm'}
        value={startTime ? moment(startTime) : null}
        onChange={(value: any) => {
          editTimes(value, 'startTime')
        }}
        // onOk={(value: any) => {
        //   editTimes(value, 'startTime')
        // }}
      />
      <span className="line"></span>
      <DatePicker
        showTime
        // className="tasknames-jz"
        placeholder="截至时间"
        value={endTime ? moment(endTime) : null}
        allowClear={false}
        format={'YYYY/MM/DD HH:mm'}
        onChange={(value: any) => {
          editTimes(value, 'endTime')
        }}
      />
    </div>
  )
}

/**
 * 任务级别
 * authIn:内部请求权限
 */
export const TaskDetailRank = ({
  attach,
  ascriptionId,
  taskContextObj,
  useFrom,
  className,
  authIn,
  editAuth,
}: any) => {
  const { mainData } = taskContextObj
  const attachModel = attach || {}
  const [state, setState] = useState<any>({
    taskRank: attach.type + '' || '0',
    attach,
    addOrgAuth: true,
    addDeptAuth: true,
  })
  const taskTypeName = mainData[mainData.id ? 'type' : 'taskType'] == 1 ? '项目' : '任务'
  useEffect(() => {
    initFn()
  }, [attach, ascriptionId])
  /**
   * 初始化方法调用
   */
  const initFn = () => {
    // 权限查询
    async function findAuth() {
      let addOrgAuth = mainData.addOrgAuth //添加企业任务权限
      let addDeptAuth = mainData.addDeptAuth //添加部门任务权限
      if (authIn) {
        const authList = await findAuthList({
          typeId: mainData.ascriptionId,
          customAuthList: [],
        })
        addOrgAuth = getAuthStatus('taskOrgAdd', authList || []) //添加企业任务权限
        addDeptAuth = getAuthStatus('taskDeptAdd', authList || []) //添加部门任务权限
      }

      let taskRank: any = attachModel.type + '' || '0'
      // 上次所选级别在当前企业下无权限时，需要重置为个人级
      if ((state.taskRank == 2 && !addOrgAuth) || (state.taskRank == 3 && !addDeptAuth)) {
        taskRank = '0'
      }
      setState({ ...state, attach: { ...attachModel, type: taskRank }, taskRank, addOrgAuth, addDeptAuth })
    }
    findAuth()
  }
  /**
   * 切换级别
   * @param menuProp
   */
  const rankMenuChange = (menuProp: any) => {
    setState({ ...state, taskRank: menuProp.key })
    const param = {
      attach: { ...state.attach, type: menuProp.key },
    }
    // 改变外部数据
    if (useFrom && useFrom.includes('createTask')) {
      taskContextObj.editTaskData({
        attach: { ...state.attach, type: menuProp.key },
      })
    } else {
      taskContextObj.editAffiliation({
        paramObj: param,
      })
    }
  }
  // 级别菜单
  const rankMenu = (
    <Menu
      className="myDropMenu tick blue taskRankMenu"
      selectable
      defaultSelectedKeys={[state.taskRank + '']}
      onClick={rankMenuChange}
    >
      <Menu.Item key="0">
        <div className={'myMenuItem'}>
          <span>个人{taskTypeName}</span>
        </div>
      </Menu.Item>
      {state.addDeptAuth ? (
        <Menu.Item key="3">
          <div className={'myMenuItem'}>
            <span>部门{taskTypeName}</span>
          </div>
        </Menu.Item>
      ) : (
        ''
      )}
      {state.addOrgAuth ? (
        <Menu.Item key="2">
          <div className={'myMenuItem'}>
            <span>企业{taskTypeName}</span>
          </div>
        </Menu.Item>
      ) : (
        ''
      )}
    </Menu>
  )
  /**
   * 级别显示
   */
  const getRankInfo = ({ key }: any) => {
    let rankTxt = ''
    switch (key + '') {
      case '3':
        rankTxt = `部门${taskTypeName}`
        break
      case '2':
        rankTxt = `企业${taskTypeName}`
        break
      default:
        rankTxt = `个人${taskTypeName}`
        break
    }
    return rankTxt
  }
  return (
    <Dropdown
      overlay={rankMenu}
      trigger={['click']}
      placement={'bottomCenter'}
      overlayClassName="taskRankMenuDrop"
    >
      <div
        className={`taskRankMenuShow flex center-v ${className} ${
          !editAuth && useFrom == 'taskDetail' ? 'pointerDisable' : ''
        }`}
      >
        <span className="selected_txt">{getRankInfo({ key: state.taskRank })}</span>
        <em className="img_icon tri_down"></em>
      </div>
    </Dropdown>
  )
}

/**
 * 5.2.4版选择归属
 */
export const selectAffiliation = ({
  setSelMemberOrg,
  taskContextObj,
  dataStateOut,
  attachobj,
  useFrom,
}: any) => {
  const { mainData } = taskContextObj

  const attachModelOut = dataStateOut.attach || {}
  const selectList: any = []
  // const attachobj = state.attach || {}
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
  let allowTeamId: any = [dataStateOut.ascriptionId]
  // 创建主任务时需要
  if (
    (dataStateOut.createType == 'add' && dataStateOut.from == 'workbench') ||
    dataStateOut.from == 'taskManage_my'
  ) {
    //编辑任务、任务管理组织架构树选择 =>单个企业
    allowTeamId = []
  }
  let profile = ''
  if (attachobj.type == 2) {
    profile = mainData.teamLogo || headDef
  } else if (attachobj.type == 3) {
    profile = headDef
  } else {
    profile = attachobj.profile || ''
  }
  selectList.push({
    curId: attachobj.typeId || '',
    curName: attachobj.typeName || dataStateOut.ascriptionName,
    account: '',
    curType: attachobj.typeName ? 3 : 2,
    profile,
  })
  const memberOrg: any = {
    title: '选择归属',
    sourceType: 'taskBelong',
    visible: true,
    findType: 3,
    selectList,
    // 只有新增任务时可选多企业
    allowTeamId,
    checkboxType: 'radio',
    permissionType: 3, //组织架构通讯录范围控制
    checkableType: [2, 3],
    isDel: false,
    noQueryProfile: true, //初始进入不查询头像
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
      editAffiliation({ dataList, dataStateOut, attachModelOut, taskContextObj, useFrom })
    },
  }
  setSelMemberOrg(memberOrg)
}
/**
 * 5.2.4版编辑归属
 */
const editAffiliation = ({ dataList, dataStateOut, attachModelOut, taskContextObj, useFrom }: any) => {
  // const { nowAccount } = $store.getState()
  const userObj = dataList[0] || {}
  if (
    !userObj.cmyId ||
    (userObj.curId == attachModelOut.typeId && userObj.cmyId == dataStateOut.ascriptionId)
  ) {
    return
  }
  const param: any = {}
  //更改任务归属
  param.attach = {
    star: 0, //优先级等级
    type: attachModelOut.type, //0 个人任务  2企业任务  3部门任务
    typeId: userObj.curId, // 任务类型id
    typeName: userObj.curType == 2 ? '' : userObj.deptName,
    profile: userObj.profile || '',
  }

  const apiParam: any = {
    teamId: userObj.cmyId,
    liable: dataStateOut.liable,
    executor: dataStateOut.execute,
    distribute: dataStateOut.distribute,
    supervisor: dataStateOut.supervisor,
    changeType: 2, //归属
    ascription: {
      //归属信息
      id: userObj.curId,
      name: userObj.curName,
    },
    // reqType: 0, //任务管理组织架构默认请求使用
  }
  // 切换了企业
  if (userObj.cmyId != dataStateOut.ascriptionId) {
    apiParam.changeTeam = true
  }
  // 查询人员改变后角色联动
  findUserChangeTeamApi(apiParam).then((res: any) => {
    const getData = res.data.data || {}
    let liable = getData.liable || {}
    let distribute = getData.distribute || {}
    let executor = getData.executor || {}
    const ascription = getData.ascription || {}
    if (JSON.stringify(liable) != '{}') {
      liable = { ...liable, ascriptionId: userObj.cmyId }
    }
    if (JSON.stringify(distribute) != '{}') {
      distribute = { ...distribute, ascriptionId: userObj.cmyId }
    }
    if (JSON.stringify(executor) != '{}') {
      executor = { ...executor, ascriptionId: userObj.cmyId }
    }
    // console.log(res)
    param.attach.typeName = userObj.curType == 2 ? '' : ascription.name
    let newParam: any = {
      ...param,
      liable,
      execute: executor,
      distribute,
      supervisor: getData.supervisor || {},
      ascriptionId: userObj.cmyId,
      ascriptionName: userObj.cmyName,
    }
    let attachInfo = {}
    // 切换了企业则需要清空缓存
    if (userObj.cmyId != dataStateOut.ascriptionId) {
      attachInfo = { clearType: 'changeTeam' }
    }
    if (useFrom && useFrom.includes('createTask')) {
      // 切换了企业
      if (userObj.cmyId != dataStateOut.ascriptionId) {
        // 查询新企业的工作结束时间
        const findEndTime = async () => {
          const endTime: any = await getEndTimes({
            teamId: userObj.cmyId,
            createType: dataStateOut.createType,
            addHandly: dataStateOut.addHandly,
            endTime: dataStateOut.endTime,
          })
          // 查询新增权限
          findAddAuth({ teamId: userObj.cmyId }).then(({ addOrgAuth, addDeptAuth }: any) => {
            newParam = { ...newParam, addOrgAuth, addDeptAuth, endTime }
            // 上次所选级别在当前企业下无权限时，需要重置为个人级
            if ((attachModelOut.type == 2 && !addOrgAuth) || (attachModelOut.type == 3 && !addDeptAuth)) {
              newParam.attach = { ...attachModelOut, type: 0 }
            }
            // 更新首层数据
            taskContextObj.editTaskData(newParam, attachInfo)
          })
        }
        findEndTime()
      } else {
        // 更新首层数据
        taskContextObj.editTaskData(newParam, attachInfo)
      }
    } else {
      taskContextObj.editAffiliation({
        paramObj: newParam,
      })
    }
  })
}
// 检验对象键值对
const isEmptyObjKey = (obj: any) => {
  let isEmpty = true
  for (const key in obj) {
    if (obj[key]) {
      isEmpty = false
      break
    }
  }
  return isEmpty
}

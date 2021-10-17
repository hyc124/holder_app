import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Avatar, Button, DatePicker, Dropdown, InputNumber, message, Modal, Slider, Tooltip } from 'antd'
// import FileList from '@/src/components/file-list/file-list'
import Editor from '@/src/components/editor/index'
import { DetailContext, taskDetailContext } from './detailRight'
// import { createTaskContext } from '../creatTask/createTaskModal'
import { SelectMemberOrg } from '@/src/components/select-member-org'
// import { setDetailStore } from './detailData'
import TaskTags from '../creatTask/taskTags'
// import UploadFile from '@/src/components/upload-file'
import { mainDutyApi } from '../creatTask/getData'
import { cutName } from '@/src/common/js/common'
import ParticipateEnterprise from '@/src/components/participate-enterprise'
import Forcereport, { getforceTime, getforceType } from '../../force-Report/force-Report'
import { clearForceCountNoWrite, delForce, forceCountNoWrite, getForceReport } from '../taskDetail/getData'
import './detailAttach.less'
import { inviteAgainApi } from '../taskComApi'
import { ipcRenderer } from 'electron'
import { RenderUplodFile } from '../../mettingManage/component/RenderUplodFile'
import { selectAffiliation, SupportOKRs } from '../creatTask/createTask'
import { queryTaskDetailApi } from './detailApi'
import moment from 'moment'
import { savefollowUser } from '../../workdesk/component/taskOptData'
// import { TaskBelong } from '../creatTask/createTask'
export interface DetailModalExp {
  setState?: any
}
/**
 * 任务详情右侧
 * @param param0
 */
export const TaskDetailAttach = ({ dataState }: { dataState: any }) => {
  // const taskDetailObj: DetailContext = useContext(taskDetailContext)
  // const directs = { ...(supports.direct || {}) }
  // const directGroup = directs.group || []
  // const indirects = supports.indirect || {}
  // const directInfo = [...(directs.info || [])]
  // const indirectInfo = indirects.info || []
  return (
    <div className="detailRightAttach">
      <TaskProgressCom dataState={dataState} />
      {/* 新版归属 */}
      {/* <TaskBelong dataState={dataState} taskContextObj={taskDetailObj} /> */}
      {/* ===责任人区=== */}
      <Affiliation
        dataState={dataState}
        affiliation={dataState.attach || {}}
        liable={dataState.liable || {}}
        description={dataState.description || ''}
        distribute={dataState.distribute || {}}
        execute={dataState.execute || {}}
        supervisor={dataState.supervisor || {}}
        // noBelong={true}
        noDescription={true}
      />
      {/* 2：草稿任务 不展示*/}
      {dataState?.flag != 2 && (
        <SupportOKRs
          supports={dataState.supports || {}}
          contextObj={taskDetailContext}
          refresh={dataState.refresh}
          soureForm="detail"
        />
      )}
      {/* ====参与企业联系人区=== */}
      <JoinTeams dataState={dataState} joinTeams={dataState.joinTeams || []} />
      {/* ====关注人区=== */}
      <Followers followList={dataState.followList || []} taskId={dataState.id} />
      {/* ====汇报设置区=== */}
      <ReportSets
        dataState={dataState}
        reportSets={dataState.reportSets || []}
        taskId={dataState.id}
        refresh={dataState.refresh}
      />
      {/* ====标签区=== */}
      <TagsList dataState={dataState} tagList={dataState.tagList || []} icon={dataState.icon || ''} />
      {/* ====附件区=== */}
      <FilesList
        dataState={dataState}
        fileList={dataState.fileList || []}
        taskId={dataState.id}
        orgId={dataState.ascriptionId}
      />
    </div>
  )
}

/**
 * 进度组件
 */

export const TaskProgressCom = ({ dataState, contextObj }: { dataState: any; contextObj?: any }) => {
  const taskDetailObj: DetailContext = useContext(contextObj ? contextObj : taskDetailContext)
  const { editAuth, editProgress, editTimes } = taskDetailObj
  // 进度百分比输入框组件
  const processInpRef = useRef<any>({})
  /**
   * 进度百分比输入框组件
   */
  const ProcessInput = forwardRef((_, ref) => {
    const [state, setState] = useState<any>({
      process: dataState.process || 0,
    })
    /**-
     * 外部调用方法
     */
    useImperativeHandle(ref, () => ({
      setState: (paramObj: any) => {
        setState({ ...state, ...paramObj })
      },
    }))
    /**
     * 监听进度变化
     */
    // useEffect(() => {
    //   setState({ ...state, process: dataState.process })
    // }, [dataState.process])
    return (
      <InputNumber
        min={0}
        max={100}
        value={state.process || 0}
        disabled={dataState.status == 2 ? true : false}
        style={{ width: '32px', height: '28px' }}
        onChange={(value: any) => {
          setState({ ...state, process: value })
        }}
        formatter={limitDecimals}
        parser={limitDecimals}
        onPressEnter={(e: any) => {
          e.target.blur()
        }}
        onBlur={(e: any) => {
          editProgress(e.target.value)
        }}
      />
    )
  })
  /**
   * 进度条拖动组件
   */
  const SliderBar = () => {
    const [state, setState] = useState<any>({
      process: dataState.process || 0,
    })
    useEffect(() => {
      setState({ ...state, processUser: dataState.processUser })
    }, [dataState.processUser])
    return (
      <Slider
        min={0}
        max={100}
        step={5}
        // defaultValue={dataState.process || 0}
        value={state.process || 0}
        disabled={state.process == 100 ? true : false}
        onChange={(value: any) => {
          // 右侧输入框跟随变化
          processInpRef.current && processInpRef.current.setState({ process: value })
          setState({ ...state, process: value })
        }}
        onAfterChange={(value: any) => {
          editProgress(value)
        }}
        tipFormatter={() => {
          return (
            <span>
              {state.processUser || ''}
              {$intl.get('assessProgressIs')}
              {state.process || 0}%
            </span>
          )
        }}
      />
    )
  }
  return (
    <div className="attachCont taskAttachProgress flex column boder_bot">
      <div className="progress_top flex between center-v">
        <div className="status_txt_box">
          <span className="status_txt">{dataState.taskStatus.name || ''}</span>
          <span className="task_surplus_time baseGrayColor">
            ({$intl.get('remain')}
            {dataState.remainDays || 0}
            {$intl.get('day')})
          </span>
        </div>
        <div className="progress_inp_box">
          <ProcessInput ref={processInpRef} />
          <span className="percentbai">%</span>
        </div>
      </div>
      <div className="progress_mid">
        <SliderBar />
      </div>
      {/* 开始截至时间 */}
      <div className={`progress_bot flex between ${!editAuth ? 'pointerDisable' : ''}`}>
        <div className="task_time_box task_start_time_box">
          <DatePicker
            className={'cursorPointer'}
            showTime
            placeholder={$intl.get('setStartTime')}
            bordered={false}
            suffixIcon={<i></i>}
            format={'YYYY/MM/DD HH:mm'}
            value={dataState.startTime ? moment(dataState.startTime) : null}
            onChange={(value: any) => {
              editTimes(value, 'startTime')
            }}
          />
        </div>
        <div className="task_time_box task_end_time_box">
          <DatePicker
            className={'cursorPointer'}
            showTime
            placeholder={$intl.get('setClosingTime')}
            allowClear={false}
            bordered={false}
            suffixIcon={<i></i>}
            value={dataState.endTime ? moment(dataState.endTime) : null}
            format={'YYYY/MM/DD HH:mm'}
            onChange={(value: any) => {
              editTimes(value, 'endTime')
            }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * 归属、任务描述信息组件
 */
export const Affiliation = ({
  affiliation,
  liable,
  description,
  distribute,
  execute,
  supervisor,
  contextObj,
  noBelong,
  noDescription,
  dataState: dataStateOut,
}: {
  affiliation?: any
  liable: any
  description: string
  distribute: any
  execute: any
  supervisor: any
  contextObj?: any
  noBelong?: boolean
  noDescription?: boolean
  dataState: any
}) => {
  const taskDetailObj: DetailContext = useContext(contextObj ? contextObj : taskDetailContext)
  const { editAuth, mainData } = taskDetailObj
  const [state, setState] = useState<any>({
    affiliation: {},
    liable: {},
    description: '',
    distribute: {},
    execut: {},
    supervisor: {},
  })
  //任务描述窗口组件
  const taskDesModal = useRef<any>({})
  //选人插件
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  const { dataState } = state
  /**
   * 监听数据改变
   */
  useEffect(() => {
    // 缓存归属信息
    // setDetailStore({
    //   key: 'affiliation',
    //   val: { ...affiliation },
    // })
    setState({
      ...state,
      affiliation,
      liable,
      description,
      distribute,
      execute,
      supervisor,
      dataState: dataStateOut,
    })
  }, [affiliation, liable, description, distribute, execute, supervisor])

  /**
   * 选择责任人
   */
  const selectLiable = (type: number) => {
    // const mainData = taskDetailObj.mainData || {}
    const selectList: any = []
    let getSelList = dataState.liable ? [dataState.liable] : []
    if (type == 1) {
      getSelList = dataState.distribute ? [dataState.distribute] : []
    } else if (type == 2) {
      getSelList = dataState.execute ? [dataState.execute] : []
    } else if (type == 3) {
      getSelList = dataState.supervisor ? [dataState.supervisor] : []
    }
    getSelList?.map((item: any) => {
      if (item.userId) {
        selectList.push({
          curId: item.userId || '',
          curName: item.username || '',
          account: item.account || '',
          curType: 0,
        })
      }
    })
    let isDel = true
    if (type == 0 || type == 1) {
      isDel = false
    }
    const memberOrg: any = {
      visible: true,
      selectList,
      allowTeamId: [taskDetailObj.mainData.ascriptionId || ''],
      checkboxType: 'radio',
      isDel,
      permissionType: 3, //组织架构通讯录范围控制
      onSure: (dataList: any) => {
        editMembers(dataList, type)
      },
    }
    setSelMemberOrg(memberOrg)
  }
  /**
   * 编辑人员
   */
  const editMembers = (dataList: any, type: number) => {
    const userObj = dataList[0] || {}
    let param = {}
    // 责任人
    if (type == 0) {
      param = {
        liable: {
          ascriptionId: userObj.cmyId,
          deptId: userObj.deptId,
          deptName: userObj.deptName,
          roleId: userObj.roleId,
          roleName: userObj.roleName,
          userId: userObj.curId,
          username: userObj.curName,
        },
      }
    } else if (type == 1) {
      //指派人
      param = {
        distribute: {
          ascriptionId: userObj.cmyId,
          userId: userObj.curId,
          username: userObj.curName,
        },
      }
    } else if (type == 2) {
      //领导责任人
      param = {
        executor: {
          ascriptionId: userObj.cmyId,
          deptId: userObj.deptId,
          deptName: userObj.deptName,
          roleId: userObj.roleId,
          roleName: userObj.roleName,
          userId: userObj.curId,
          username: userObj.curName,
        },
      }
    } else if (type == 3) {
      param = {
        supervisor: {
          ascriptionId: userObj.cmyId,
          userId: userObj.curId,
          username: userObj.curName,
        },
      }
    }
    taskDetailObj.editMembers(param)
  }

  // ================================数据渲染处理==================================//
  // 归属、人员信息
  const belongObj = getTaskBelong(state.affiliation, mainData.ascriptionName)
  // 执行人（当前改为责任人）
  const liableObj = state.liable || {}
  // 指派人
  const distributeObj = state.distribute || {}
  // 领导责任人
  const executorObj = state.execute || {}
  const supervisorObj = state.supervisor || {}
  const liableShow = cutName(liableObj.username || '', 2, -1) || ''
  const distributeShow = cutName(distributeObj.username || '', 2, -1) || ''
  const executorShow = cutName(executorObj.username || '', 2, -1) || ''
  const supervisorShow = cutName(supervisorObj.username || '', 2, -1) || ''
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
  let liableProfile = liableObj.profile || ''
  if (!liableProfile && !liableObj.username) {
    liableProfile = headDef
  }
  let distributeProfile = distributeObj.profile || ''
  if (!distributeProfile && !distributeObj.username) {
    distributeProfile = $tools.asAssetsPath('/images/taskDetail/assign_role.png')
  }
  let executorProfile = executorObj.profile || ''
  if (!executorProfile && !executorObj.username) {
    executorProfile = $tools.asAssetsPath('/images/taskDetail/leader_role.png')
  }
  let supervisorProfile = supervisorObj.profile || ''
  if (!supervisorProfile && !supervisorObj.username) {
    supervisorProfile = $tools.asAssetsPath('/images/taskDetail/supervisor_role.png')
  }
  return (
    <div className="attachCont baseInfoCont boder_bot">
      {/* 归属 */}
      {!noBelong && (
        <div
          className={`belongRow flex center-v between ${!editAuth ? 'pointerDisable' : ''}`}
          onClick={() => {
            // selectBelong({ setSelMemberOrg, taskDetailObj })
            selectAffiliation({
              setSelMemberOrg,
              taskContextObj: taskDetailObj,
              dataStateOut: dataState,
              attachobj: dataState.attach || {},
              useFrom: '',
            })
          }}
        >
          <div className="belong_info_box">
            {/* <span className="rank_name flex_shrink_0">{belongObj.rangTxt}</span> */}
            {/* <span className="divider"></span> */}
            <Tooltip title={belongObj.belongTxt || ''}>
              {/* belongComt */}
              <div className="belong_info my_ellipsis width_100"> 归属于 {belongObj.belongTxt}</div>
            </Tooltip>
          </div>
          <span
            className={`img_icon set_liable_btn no_hide flex_shrink_0 ${!editAuth ? 'forcedHide' : ''}`}
            onClick={() => {
              selectLiable(0)
            }}
          ></span>
        </div>
      )}

      {/* 责任人 */}
      {/* <div className="liableRow flex between center-v">
        <div
          className="memberItem"
          onClick={() => {
            selectLiable(0)
          }}
        >
          <Avatar
            key="liable"
            className="oa-avatar"
            src={liableProfile}
            size={24}
            style={{ backgroundColor: !liableObj.username ? 'inherit' : '#4285f4' }}
          >
            {liableShow}
          </Avatar>
          <span className="liable_name">{liableObj.username || ''}</span>
          <span className="role_name">(执行人)</span>
        </div>
        <div>
          <span
            className={`img_icon set_liable_btn ${!editAuth ? 'forcedHide' : ''}`}
            onClick={() => {
              selectLiable(0)
            }}
          ></span>
        </div>
      </div> */}
      {/* 任务描述 */}
      {!noDescription && (
        <div className="taskDesRow">
          <div
            className="taskDescriptionShow"
            dangerouslySetInnerHTML={{ __html: description }}
            onClick={() => {
              // console.log('编辑框内容', state.description)
              taskDesModal.current &&
                taskDesModal.current.setState({
                  visible: true,
                  description,
                  // saveBtn: editAuth,
                })
            }}
          ></div>
        </div>
      )}

      {/* 指派人、领导责任人、督办人 */}
      <div className="otherMemberRow flex between center-v">
        {/* 责任人 */}
        <div
          className={`memberItem ${!editAuth ? 'pointerDisable' : ''}`}
          onClick={() => {
            selectLiable(0)
          }}
        >
          <Avatar
            key="liable"
            className="oa-avatar"
            src={liableProfile}
            size={38}
            style={{ backgroundColor: !liableObj.username ? 'inherit' : '#4285f4' }}
          >
            {liableShow}
          </Avatar>
          <span className="role_name">执行人</span>
          <Tooltip title={liableObj.username || ''}>
            <div className="liable_name_box">
              <span className="liable_name text-ellipsis">{liableObj.username || '设置执行人'}</span>
            </div>
          </Tooltip>
        </div>
        {/* 指派人 */}
        <div
          className={`memberItem flex center-v ${!editAuth ? 'pointerDisable' : ''}`}
          onClick={() => {
            selectLiable(1)
          }}
        >
          <div>
            <Avatar
              key="distribute"
              className="oa-avatar"
              size={38}
              src={distributeProfile || ''}
              style={{ backgroundColor: !distributeObj.username ? 'inherit' : '#4285f4' }}
            >
              {distributeShow}
            </Avatar>
          </div>
          <span className="role_name">指派人</span>
          <Tooltip title={distributeObj.username || ''}>
            <div className="liable_name_box">
              <p className="liable_name text-ellipsis">{distributeObj.username || '设置指派人'}</p>
            </div>
          </Tooltip>
        </div>
        {/* 领导责任人 */}
        <div
          className={`memberItem flex center-v ${!editAuth ? 'pointerDisable' : ''}`}
          onClick={() => {
            selectLiable(2)
          }}
        >
          <div>
            <Avatar
              key="executor"
              className="oa-avatar"
              size={38}
              src={executorProfile || ''}
              style={{ backgroundColor: !executorObj.username ? 'inherit' : '#4285f4' }}
            >
              {executorShow}
            </Avatar>
          </div>
          <span className="role_name">领导责任</span>
          <Tooltip title={executorObj.username || ''}>
            <div className="liable_name_box">
              <p className="liable_name text-ellipsis">{executorObj.username || '设置领导责任人'}</p>
            </div>
          </Tooltip>
        </div>
        {/* 督办人 */}
        <div
          className={`memberItem flex center-v ${!editAuth ? 'pointerDisable' : ''}`}
          onClick={() => {
            selectLiable(3)
          }}
        >
          <div>
            <Avatar
              key="supervisor"
              className="oa-avatar"
              size={38}
              src={supervisorProfile || ''}
              style={{ backgroundColor: !supervisorObj.username ? 'inherit' : '#4285f4' }}
            >
              {supervisorShow}
            </Avatar>
          </div>
          <span className="role_name">督办人</span>
          <Tooltip title={supervisorObj.username || ''}>
            <div className="liable_name_box">
              <p className="liable_name text-ellipsis">{supervisorObj.username || '设置督办人'}</p>
            </div>
          </Tooltip>
        </div>
      </div>
      {/* 任务描述弹出层 */}
      <TaskDesModal ref={taskDesModal} taskDetailObj={taskDetailObj} />
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
 * 任务描述弹框
 */
export const TaskDesModal = React.forwardRef(({ from, taskDetailObj, setDescription }: any, ref) => {
  // const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const [state, setState] = useState({
    visible: false,
    description: '',
    saveBtn: true,
  })
  // ***********************暴露给父组件的方法**************************//
  useImperativeHandle(ref, () => ({
    /**
     * 设置state
     */
    setState: (paramObj: any) => {
      setState({ ...state, ...paramObj })
    },
  }))
  // ********************************操作处理方法*******************************//
  //修改任务描述
  const handleOk = () => {
    if (from == 'okrDetail') {
      taskDetailObj.editOKRSave(
        {
          description: state.description,
        },
        {
          optType: 'editDescription',
          refreshTree: true,
          callBack: () => {
            // 修改描述促使当前组件重刷，未及时更新描述问题
            setDescription(state.description)
          },
        }
      )
    } else {
      taskDetailObj.editTaskDes({
        description: state.description,
        // noQuery:1
      })
    }

    setState({ ...state, visible: false })
  }
  // 确定取消按钮
  const footers = [
    <Button
      key="back"
      onClick={() => {
        setState({ ...state, visible: false })
      }}
    >
      取消
    </Button>,
  ]
  if (taskDetailObj.editAuth) {
    footers.push(
      <Button key="submit" type="primary" onClick={handleOk}>
        确定
      </Button>
    )
  }
  return (
    <Modal
      title={`${from == 'okrDetail' ? '目标描述' : '任务描述'}`}
      visible={state.visible}
      maskClosable={false}
      keyboard={false}
      className={`taskEditor ${taskDetailObj.editAuth ? '' : 'disabled_bottom'}`}
      onOk={handleOk}
      onCancel={() => {
        setState({ ...state, visible: false })
      }}
      footer={footers}
    >
      <div className="">
        <Editor
          editorContent={state.description}
          editorChange={(content: any) => {
            // console.log(content)
            setState({ ...state, description: content })
          }}
          height={365}
          maxHeight={365}
          className="detailDesEditor"
          previewArea=".detailDesEditor"
          autoFocus={true}
        />
      </div>
    </Modal>
  )
})
/**
 * 关注人组件
 */
export const Followers = ({
  followList,
  taskId,
  contextObj,
  layStyle,
}: {
  followList: any
  taskId?: any
  contextObj?: any
  layStyle?: string
}) => {
  const taskDetailObj: DetailContext = useContext(contextObj ? contextObj : taskDetailContext)
  const mainData = taskDetailObj.mainData || {}
  const btnsAuthObj = taskDetailObj.btnsAuthObj || {}
  const followStyle = layStyle ? layStyle : 'def_style'
  // 关注人权限
  const followAuth = btnsAuthObj['SET_FOLLOWER'] && !btnsAuthObj['SET_FOLLOWER'].isUse ? false : true
  // 是否是归档任务
  const isArchive = mainData.flag == 3
  const [state, setState] = useState<any>({
    followList: [],
    pageNo: 1,
    pageSize: 10,
    totalPages: 0,
    allDataList: [],
  })
  //选人插件
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  /**
   * 监听外部传入数据改变
   */
  useEffect(() => {
    const totalPages = Math.ceil(followList.length / state.pageSize)
    const handleList = getNowPageData({
      pageNo: state.pageNo,
      pageSize: state.pageSize,
      handleList: followList,
    })
    setState({ ...state, followList: [...handleList], totalPages, allDataList: [...followList] })
  }, [followList])
  /**
   * 切换页码
   */
  const pageChange = ({ dataList }: any) => {
    setState({ ...state, followList: [...dataList] })
  }
  /**
   * 选择关注人
   */
  const selMembers = () => {
    const selectList: any = []
    state.allDataList?.map((item: any) => {
      selectList.push({
        curId: item.userId || '',
        curName: item.username || '',
        account: item.account || '',
        curType: 0,
      })
    })
    const memberOrg: any = {
      visible: true,
      selectList: [...selectList],
      allowTeamId: [taskDetailObj.mainData.ascriptionId || ''],
      checkboxType: 'checkbox',
      onSure: (dataList: any) => {
        editFollowers(dataList)
      },
    }
    setSelMemberOrg(memberOrg)
  }

  /**
   * 编辑关注人
   */
  const editFollowers = (dataList: any) => {
    const followUsers: any = []
    dataList?.map((item: any) => {
      followUsers.push(item.curId)
    })
    taskDetailObj.editFollowers({
      followUsers,
    })

    //保存关注人
    // savefollowUser({
    //   taskId: taskId,
    //   userIds: followUsers,
    // }).then((data: any) => {
    //   if (data.returnCode === 0) {
    //     message.success($intl.get('setFocusSuc'))
    //   } else {
    //     message.error(data.returnMessage)
    //   }
    // })
  }
  /**
   * 删除关注人
   */
  const delFollowers = (id: any) => {
    const followUsers: any = []
    state.allDataList?.map((item: any) => {
      if (item.userId != id) {
        followUsers.push(item.userId)
      }
    })
    taskDetailObj.editFollowers({
      followUsers,
    })
  }
  return (
    <div className={`attachCont followersCont ${state.totalPages > 1 ? 'fixedH' : ''}`}>
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          <span className="tit_txt">关注人</span>
          <span className="count_txt">({state.allDataList.length})</span>
        </div>
        <div className="actionBtn">
          <span
            className={`img_icon add_cross_icon ${followAuth && !isArchive ? '' : 'forcedHide'}`}
            onClick={selMembers}
          ></span>
        </div>
      </header>
      <div className={`showListBox ${state.allDataList && state.allDataList.length > 0 ? '' : 'forcedHide'}`}>
        <div className={`showList followerList flex wrap  ${followStyle}`}>
          {state.followList?.map((item: any, i: number) => {
            const avatarName = cutName(item.username || '', 2, -1) || ''
            if (followStyle == 'def_style') {
              // 默认：横向排列方式
              return (
                <div key={i} className={`followerItem flex center-v`}>
                  <div className="flex center-v">
                    <Avatar size={32} className="oa-avatar" src={item.profile || ''}>
                      {avatarName}
                    </Avatar>
                    <span className="member_name">{item.username || ''}</span>
                  </div>
                  <span
                    className={`img_icon del_item_icon cross gradient ${
                      followAuth && !isArchive ? '' : 'forcedHide'
                    }`}
                    onClick={() => {
                      delFollowers(item.userId)
                    }}
                  ></span>
                </div>
              )
            } else {
              // 竖向排列方式
              return (
                <div key={i} className="followerItem flex column">
                  <Avatar size={32} className="oa-avatar" src={item.profile || ''}>
                    {avatarName}
                  </Avatar>
                  <span className="member_name">{item.username || ''}</span>
                  <em
                    className={`img_icon del_item_icon hor ${followAuth && !isArchive ? '' : 'forcedHide'}`}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      delFollowers(item.userId)
                    }}
                  ></em>
                </div>
              )
            }
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
 * 标签组件
 */
export const TagsList = ({
  tagList,
  icon,
  contextObj,
  useFrom,
}: {
  tagList: any
  icon: string
  dataState?: any
  contextObj?: any
  useFrom?: string
}) => {
  const taskDetailObj: DetailContext = useContext(contextObj ? contextObj : taskDetailContext)
  const { editAuth } = taskDetailObj
  const mainData = taskDetailObj.mainData || {}
  const [state, setState] = useState<any>({
    tagList: [],
    icon: '',
    pageNo: 1,
    totalPages: 0,
    pageSize: 6,
    allDataList: [],
  })
  const [dropVisible, setVisible] = useState<any>(0)
  /**
   * 监听外部传入数据改变
   */
  // useEffect(() => {
  //   const newTagList = [...tagList]
  //   const icon = taskDetailObj.mainData.icon || ''
  //   if (icon) {
  //     newTagList.unshift({
  //       type: 'icon',
  //       content: icon,
  //     })
  //   }
  //   const handleList = newTagList.slice(0, state.pageSize)
  //   setState({ ...state, tagList: [...handleList], allDataList: [...newTagList], icon })
  // }, [tagList])

  useEffect(() => {
    const newTagList = [...tagList]
    const icon = mainData.icon || ''
    if (icon) {
      newTagList.unshift({
        type: 'icon',
        content: icon,
      })
    }
    const totalPages = Math.ceil(newTagList.length / state.pageSize)
    const handleList = newTagList.slice(0, state.pageSize)
    setState({ ...state, tagList: [...handleList], totalPages, allDataList: [...newTagList], icon })
  }, [tagList, icon])
  /**
   * 切换页码
   */
  const pageChange = ({ dataList }: any) => {
    setState({ ...state, tagList: [...dataList] })
  }

  /**
   * 编辑标签
   */
  const editIcons = (datas: any) => {
    //标签
    const tagIds: any = []
    const newTags: any = []
    datas.tags?.map((item: any) => {
      tagIds.push(item.id)
      newTags.push({
        id: item.id,
        content: item.name,
        rgb: item.rgb,
      })
    })

    // 创建任务
    if (useFrom && useFrom.includes('createTask')) {
      taskDetailObj.editTaskData({
        icon: datas.icon,
        tagList: newTags,
      })
    } else {
      taskDetailObj.editIcons({
        types: ['icon', 'tag'],
        tagIds,
        icon: datas.icon,
      })
    }
  }
  /**
   * 删除标签
   */
  const delTag = ({ type, id }: { type: string; id?: any; content?: string }) => {
    const tagIds: any = []
    const newTags: any = []
    const param: any = {
      types: [type],
    }
    const newTagList = [...state.allDataList]
    // 创建任务
    const createParam: any = {}
    newTagList?.map((item: any) => {
      // 传给后台保存的tag的id集合
      if (type != 'icon' && item.type != 'icon' && item.id != id) {
        tagIds.push(item.id)
      }
      // 删除后的数据
      if ((type == 'icon' && item.type != 'icon') || (type != 'icon' && item.type != 'icon' && item.id != id)) {
        newTags.push(item)
      }
    })
    if (type == 'icon') {
      param.icon = ''
      createParam.icon = ''
    } else {
      param.tagIds = tagIds
      createParam.tagList = newTags
    }

    // 创建任务
    if (useFrom && useFrom.includes('createTask')) {
      const totalPages = Math.ceil(newTags.length / state.pageSize)
      const handleList = newTags.slice(0, state.pageSize)
      setState({
        ...state,
        tagList: [...handleList],
        totalPages,
        allDataList: [...newTags],
        icon: createParam.icon,
      })
      taskDetailObj.editTaskData(createParam)
    } else {
      taskDetailObj.editIcons(param)
    }
  }
  /**
   * 添加标签下拉选择
   */
  // const TagsDrop = () => {
  //   return (
  //     <Dropdown
  //       // placement="topRight"
  //       overlayClassName="taskDetailTagDrop"
  //       onVisibleChange={(flag: boolean) => {
  //         console.log(taskDetailObj, detailStore)
  //         if (flag) {
  //           const visibleNum = new Date().getTime().toString()
  //           setVisible(visibleNum)
  //         } else {
  //           setVisible(0)
  //         }
  //       }}
  //       overlay={
  //         <TaskTags
  //           defShow={true}
  //           visible={dropVisible}
  //           param={{
  //             from: 'taskDetail',
  //             teamId: mainData.ascriptionId,
  //           }}
  //           datas={{ tags: state.allDataList || [], icon: state.icon }}
  //           onOk={(datas: any) => {
  //             console.log(datas)
  //             editIcons(datas)
  //           }}
  //         ></TaskTags>
  //       }
  //       trigger={['click']}
  //     >
  //       <span className={`img_icon add_cross_icon ${!editAuth ? 'forcedHide' : ''}`}></span>
  //     </Dropdown>
  //   )
  // }

  return (
    <div className={`attachCont taskTagCont`}>
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          <span className="tit_txt">标签</span>
          <span className="count_txt">({state.allDataList.length})</span>
        </div>
        <div className="actionBtn">
          {/* <TagsDrop /> */}
          <Dropdown
            // placement="topRight"
            overlayClassName="taskDetailTagDrop"
            onVisibleChange={(flag: boolean) => {
              if (flag) {
                const visibleNum = new Date().getTime().toString()
                setVisible(visibleNum)
              } else {
                setVisible(0)
              }
            }}
            overlay={
              <TaskTags
                defShow={true}
                visible={dropVisible}
                param={{
                  from: 'taskDetail',
                  teamId: mainData.ascriptionId,
                }}
                datas={{ tags: state.allDataList || [], icon: state.icon }}
                onOk={(datas: any) => {
                  editIcons(datas)
                }}
              ></TaskTags>
            }
            trigger={['click']}
          >
            <span className={`img_icon add_cross_icon ${!editAuth ? 'forcedHide' : ''}`}></span>
          </Dropdown>
        </div>
      </header>
      <div className={`showListBox ${state.allDataList && state.allDataList.length > 0 ? '' : 'forcedHide'}`}>
        <div className="showList taskTagList flex wrap">
          {state.tagList?.map((item: any, i: number) => {
            // icon
            if (item.type == 'icon') {
              const tagIcon = $tools.asAssetsPath(`/images/task/${item.content}.png`)
              return (
                <div key={i} className={`taskIconItem ${!editAuth ? 'pointerDisable' : ''}`}>
                  <img src={tagIcon} alt="" />
                  <span
                    className={`img_icon del_item_icon hor ${!editAuth ? 'forcedHide' : ''}`}
                    onClick={() => {
                      delTag({
                        type: 'icon',
                        id: '',
                        content: item.name,
                      })
                    }}
                  ></span>
                </div>
              )
            } else {
              // 标签
              return (
                <div key={i} className={`taskTagItem ${!editAuth ? 'pointerDisable' : ''}`} data-rgb={item.rgb}>
                  <span>{item.content || ''}</span>
                  <span
                    className={`img_icon del_item_icon cross gradient ${!editAuth ? 'forcedHide' : ''}`}
                    onClick={() => {
                      delTag({
                        type: 'tag',
                        id: item.id,
                      })
                    }}
                  ></span>
                </div>
              )
            }
          })}
        </div>
        {/* <div
          className={`attachPager ${
            state.tagList.length > 0 && state.allDataList.length > state.pageSize ? '' : 'forcedHide'
          }`}
        >
          {[1].map(() => {
            // 是否是显示收起的状态
            const packUp = state.tagList.length == state.allDataList.length
            return (
              <div
                key={1}
                className="lookMore"
                onClick={() => {
                  const getState = { ...state }
                  let handleList = packUp ? [] : [...getState.allDataList]
                  if (packUp) {
                    handleList = getState.allDataList.slice(0, state.pageSize)
                  }
                  setState({ ...state, tagList: [...handleList] })
                }}
              >
                <span>{packUp ? '收起' : '查看更多'}</span>
                {/* <em className="img_icon"></em> */}
        {/*{packUp ? <UpOutlined className="pack_up" /> : <DownOutlined className="look_more" />}*/}
        {/*</div> )*/}
        {/* })}
        {/*</div> */}
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
    </div>
  )
}
// 记录上传附件开始时的进入次数，只第一次设置开始状态
// let beforeUploadNum = 0
/**
 * 附件组件
 */
interface FileListProps {
  dataState?: any
  fileList: any
  taskId?: any
  orgId?: any
  contextObj?: any
  useFrom?: string
}
export const FilesList = ({ fileList, contextObj, useFrom, dataState: dataStateOut }: FileListProps) => {
  const taskDetailObj: DetailContext = useContext(contextObj ? contextObj : taskDetailContext)
  const { editAuth } = taskDetailObj
  const mainData = taskDetailObj.mainData || {}
  const [state, setState] = useState<any>({
    fileList: [],
    pageNo: 1,
    pageSize: 3,
    totalPages: 0,
    allDataList: [],
    fileProgress: false,
  })

  //新版附件需要的参数
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  /**
   * 监听外部传入数据改变
   */
  useEffect(() => {
    const totalPages = Math.ceil(fileList.length / state.pageSize)
    const handleList = getNowPageData({
      pageNo: state.pageNo,
      pageSize: state.pageSize,
      handleList: [...fileList],
    })
    setState({
      ...state,
      fileList: [...handleList],
      totalPages,
      allDataList: [...fileList],
      fileProgress: false,
    })
  }, [fileList])

  /**
   * 切换页码
   */
  const pageChange = ({ dataList }: any) => {
    setState({ ...state, fileList: [...dataList] })
  }
  /**
   *开始上传附件
   */
  // const beforeUpload = (fileList: any) => {
  //   setState({ ...state, fileList: [...state.fileList, ...fileList], fileProgress: true })
  // }
  // /**
  //  *单个附件上传完成
  //  */
  // const fileUploaded = (file: any) => {
  //   const { fileItem } = file
  //   // 更新进度
  //   state.fileList.map((item: any) => {
  //     if (item.fileKey == fileItem.fileKey) {
  //       item.progress = 100
  //     }
  //   })
  //   setState({ ...state, fileList: [...state.fileList], fileProgress: true })
  // }
  /**
   * 所有附件上传完成
   */
  const filesUploaded = ({
    files,
    delGuid,
    isDel,
    delGuidFromSql,
  }: {
    files: any
    delGuid?: string
    isDel?: boolean
    delGuidFromSql?: string
  }) => {
    const fileModels: any = [...state.allDataList]
    const param: any = {}
    if (isDel) {
      if (delGuid !== '') {
        const delFileIds = dataStateOut.delFileIds || []
        if (!delFileIds.includes(delGuid)) {
          delFileIds.push(delGuid)
        }
        param.delFileIds = delFileIds
      }
      // 当前数据中删除附件
      const delId = delGuid || delGuidFromSql
      for (let i = 0; i < fileModels.length; i++) {
        const item = fileModels[i]
        if (item.fileGUID == delId) {
          fileModels.splice(i, 1)
          break
        }
      }
    } else {
      files?.map((file: any) => {
        const findI = state.allDataList.findIndex((item: any) => item.fileGUID == file.fileGUID)
        if (file.fileSize != 0 && findI == -1) {
          fileModels.push(file)
        }
      })
    }

    // 创建任务
    if (useFrom && useFrom.includes('createTask')) {
      param.fileList = [...fileModels]
      taskDetailObj.editTaskData(param)
    } else {
      taskDetailObj.editFiles({
        fileModels: [...fileModels],
        temporaryId: dataStateOut.pageUuid,
        fileGuidList: param.delFileIds,
      })
    }
  }

  /**
   * 删除附件
   */
  // const delFile = ({ fileKey }: any) => {
  //   for (let i = 0; i < state.allDataList.length; i++) {
  //     const item = state.allDataList[i]
  //     if (item.fileKey == fileKey) {
  //       state.allDataList.splice(i, 1)
  //       break
  //     }
  //   }
  //   taskDetailObj.editFiles({
  //     fileModels: [...state.allDataList],
  //   })
  // }
  // console.log('pageUuid------', mainData.pageUuid)
  return (
    <div className={`attachCont filesCont ${state.totalPages > 1 ? 'fixedH' : ''}`}>
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          <span className="tit_txt">附件</span>
          <span className="count_txt">({state.allDataList.length})</span>
          {/* <span className="count_txt">({fileArr.length})</span> */}
        </div>
        <div className="actionBtn">
          <span
            className={`img_icon add_cross_icon ${!editAuth ? 'forcedHide' : ''}`}
            onClick={() => {
              setUploadVisible(true)
              setLoadTime(new Date().getTime())
            }}
          ></span>
        </div>
      </header>

      <div className={`showListBox ${state.allDataList && state.allDataList.length > 0 ? '' : 'forcedHide'}`}>
        <div className="showList taskFileList">
          <RenderUplodFile
            className="detailFile"
            visible={uploadVisible}
            leftDown={true}
            canDel={editAuth || false}
            filelist={state.fileList || []}
            allFilelist={state.allDataList || []}
            teamId={mainData.ascriptionId}
            fileId={`${mainData.pageUuid}`}
            defaultFiles={[]}
            setVsible={state => setUploadVisible(state)}
            loadTime={loadTime}
            fileChange={(list: any, delGuid?: string, isDel?: boolean, delGuidFromSql?: string) => {
              filesUploaded({ files: list, delGuid, isDel, delGuidFromSql })
            }}
          />
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
      </div>
    </div>
  )
}

/**
 * 参与企业联系人组件
 */
export const JoinTeams = ({
  joinTeams,
  contextObj,
  useFrom,
}: {
  joinTeams: any
  dataState?: any
  contextObj?: any
  useFrom?: string
}) => {
  const taskDetailObj: DetailContext = useContext(contextObj ? contextObj : taskDetailContext)
  const { editAuth } = taskDetailObj
  const mainData = taskDetailObj.mainData || {}
  // const mainData = dataState.detailMain || {}
  // 是否是归档任务
  const isArchive = mainData.flag == 3
  const [state, setState] = useState<any>({
    followList: [],
    pageNo: 1,
    pageSize: 3,
    totalPages: 0,
    allDataList: [],
    enterpriseShow: false,
  })
  const [selTeamsParam, setSelTeamsParam] = useState<any>({})
  /**
   * 监听外部传入数据改变
   */
  useEffect(() => {
    const totalPages = Math.ceil(joinTeams.length / state.pageSize)
    const handleList = getNowPageData({
      pageNo: state.pageNo,
      pageSize: state.pageSize,
      handleList: joinTeams,
    })
    setState({ ...state, joinTeams: [...handleList], totalPages, allDataList: [...joinTeams] })
  }, [joinTeams])
  /**
   * 切换页码
   */
  const pageChange = ({ dataList }: any) => {
    setState({ ...state, joinTeams: [...dataList] })
  }
  /**
   * 选择企业联系人
   */
  const selectTeams = (type: number, teamInfo?: any) => {
    const typeframe = type == 1 ? 'Radio' : 'Checkbox'
    const param = {
      visible: true,
      orgId: type == 1 ? teamInfo.teamid : '', //指定企业
      orignodeUsers: type == 1 && teamInfo, //点击修改联系人参与企业
      typeframe,
      notOrgIds: type == 1 ? [teamInfo.teamid] : [mainData.ascriptionId], //排除企业
      selectUserlist: state.allDataList || [], //已选企业联系人
      onOk: (dataList: any) => {
        const teamList = setEnterprise({
          dataList,
          oldDataInfo: teamInfo || {},
          type,
          allDataList: state.allDataList || [],
        })
        // 创建任务
        if (useFrom && useFrom.includes('createTask')) {
          taskDetailObj.editTaskData({
            joinTeams: [...teamList],
          })
        } else {
          taskDetailObj.editJoinTeams({
            teamList: [...teamList],
          })
        }
      },
    }
    setSelTeamsParam(param)
  }

  /**
   * 删除企业联系人
   */
  const delJoinTeam = (teamId: any) => {
    const teamList = setEnterprise({
      dataList: [],
      type: 2,
      teamId,
      allDataList: state.allDataList || [],
    })
    // 创建任务
    if (useFrom && useFrom.includes('createTask')) {
      taskDetailObj.editTaskData({
        joinTeams: [...teamList],
      })
    } else {
      taskDetailObj.editJoinTeams({
        teamList: [...teamList],
      })
    }
  }
  /**
   * 再次邀请
   * @param teamId
   * @param userId
   */
  const inviteAgain = ({ teamId }: { teamId: any }) => {
    const param = {
      taskId: mainData.id,
      teamId,
    }
    inviteAgainApi(param).then((res: any) => {
      if (res) {
        taskDetailObj.queryTaskDetail()
      }
    })
  }
  return (
    <div className={`attachCont joinTeamsCont ${state.totalPages > 1 ? 'fixedH' : ''}`}>
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          <span className="tit_txt">参与企业/联系人</span>
          <span className="count_txt">({state.allDataList ? state.allDataList.length : 0})</span>
        </div>
        <div className="actionBtn">
          <span
            className={`img_icon add_cross_icon ${editAuth && !isArchive ? '' : 'forcedHide'}`}
            onClick={() => {
              selectTeams(0)
            }}
          ></span>
        </div>
      </header>
      <div className={`showListBox ${state.allDataList && state.allDataList.length > 0 ? '' : 'forcedHide'}`}>
        <div className="showList joinTeamsList flex takeCompanyBox">
          <ul>
            {state.joinTeams?.map((item: any, index: number) => {
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
                <li
                  className="joinCmyItem"
                  key={index}
                  // onClick={() => {
                  //   selectTeams(1, {
                  //     teamid: item.teamId,
                  //     userId: item.userId,
                  //     teamName: item.teamName,
                  //   })
                  // }}
                >
                  <div className="joinCmyLeft">
                    <div className="avatars">
                      <Avatar
                        key={index + '_ava'}
                        src={item.teamLogo || null}
                        className={`${!item.teamLogo ? 'noPortrait' : ''}`}
                      />
                    </div>
                    <div className="text">
                      <p className="text-ellipsis">{item.teamName || item.name}</p>
                      <p className="cmy_info_name_box ">
                        <span className="cmy_info_name flex center-v">
                          <span className="flex_shrink_0">联系人:</span>
                          <span className="text-ellipsis liaison_name">{item.username}</span>
                        </span>
                        <span className={`join_cmy_status ${statusClass}`}>{statusTxt}</span>
                      </p>
                    </div>
                  </div>
                  <div className="joinCmyRig">
                    <span className="img_icon del_cmy_icon hide"></span>
                    <div className={`more_opt_box relative ${editAuth && !isArchive ? '' : 'forcedHide'}`}>
                      {item.isExtends == 0 && (
                        <Dropdown
                          overlay={
                            <ul className="optBtnMenu more_opt_options">
                              <li
                                className="optBtnItem"
                                onClick={() => {
                                  selectTeams(1, {
                                    teamid: item.teamId,
                                    userId: item.userId,
                                    teamName: item.teamName,
                                  })
                                }}
                              >
                                <em className="img_icon menu_icon edit_member_icon"></em>
                                <span>修改联系人</span>
                              </li>
                              <li
                                className={`optBtnItem ${againInvite}`}
                                onClick={() => {
                                  inviteAgain({ teamId: item.teamId })
                                }}
                              >
                                <em className="img_icon menu_icon again_invite_icon"></em>
                                <span>再次邀请</span>
                              </li>
                              <li
                                className="optBtnItem"
                                onClick={() => {
                                  delJoinTeam(item.teamId)
                                }}
                              >
                                <em className="img_icon menu_icon del_icon"></em>
                                <span>删除</span>
                              </li>
                            </ul>
                          }
                          trigger={['click']}
                        >
                          <a
                            className="ant-dropdown-link"
                            onClick={e => {
                              e.stopPropagation()
                              e.preventDefault()
                            }}
                          >
                            <span
                              className="img_icon more_opt_icon"
                              // onClick={(e: any) => {
                              //   e.stopPropagation()
                              //   e.preventDefault()
                              // }}
                            ></span>
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
        <div className={`attachPager ${state.totalPages > 1 ? '' : 'forcedHide'}`}>
          <ArrowPager
            pageNo={state.pageNo}
            pageSize={state.pageSize}
            totalPages={state.totalPages}
            allDataList={state.allDataList}
            pageChange={pageChange}
          />
        </div>
      </div>
      {/* 选择参与企业 iseditenterprise:是否是修改企业联系人 */}
      {selTeamsParam.visible && (
        <ParticipateEnterprise
          param={{ ...selTeamsParam }}
          action={{
            visible: (visible: any) => {
              setSelTeamsParam({ ...selTeamsParam, visible })
            },
          }}
        ></ParticipateEnterprise>
      )}
    </div>
  )
}

/**
 * 汇报设置组件
 */
export const ReportSets = ({
  taskId,
  refresh,
  contextObj,
  useFrom,
}: {
  dataState?: any
  reportSets: any
  taskId: any
  refresh: number
  contextObj?: any
  useFrom?: string
}) => {
  const taskDetailObj: DetailContext = useContext(contextObj ? contextObj : taskDetailContext)
  const mainData = taskDetailObj.mainData || {}
  const detailData = taskDetailObj.detailData || {}
  const btnsAuthObj = taskDetailObj.btnsAuthObj || {}
  const { liable, distribute, reportSets } = mainData
  // 汇报设置权限
  const reportSetAuth = btnsAuthObj['SET_REPORT'] && !btnsAuthObj['SET_REPORT'].isUse ? false : true
  // const pagerRef = useRef<any>({})
  const [openforceParam, setOpenforceParam] = useState<any>({})
  const [state, setState] = useState<any>({
    reportSets: [],
    pageNo: 1,
    pageSize: 3,
    totalPages: 0,
    allDataList: [],
  })
  /**
   * 监听外部传入数据改变
   */
  useEffect(() => {
    // 创建任务
    if (useFrom && useFrom.includes('createTask') && useFrom.includes('add')) {
      const totalPages = Math.ceil(reportSets.length / state.pageSize)
      const handleList = getNowPageData({
        pageNo: state.pageNo,
        pageSize: state.pageSize,
        handleList: reportSets,
      })
      setState({ ...state, reportSets: [...handleList], totalPages, allDataList: [...reportSets] })
    } else {
      getForceReportList()
    }
  }, [taskId, liable, distribute, refresh, reportSets])

  /**
   * 切换页码
   */
  const pageChange = ({ dataList }: any) => {
    setState({ ...state, reportSets: [...dataList] })
  }
  // 获取任务汇报列表
  const getForceReportList = () => {
    const { nowUserId } = $store.getState()
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
            reporter: item.reporter,
            receiver: item.receiver,
            forceTime: forceTime,
            taskid: taskId,
            hasDelete: item.hasDelete,
            hasDelay: item.hasDelay,
            flag: item.flag, //标识汇报状态:0正常 1删除 2未生效
          }
          // if (item.flag == 2) notValidRport = true
          newArr.push(obj)
        })
        const totalPages = Math.ceil(newArr.length / state.pageSize)
        const handleList = getNowPageData({
          pageNo: state.pageNo,
          pageSize: state.pageSize,
          handleList: newArr,
        })
        setState({ ...state, reportSets: [...handleList], totalPages, allDataList: [...newArr] })
      }
    })
  }
  // 组装汇报设置所需数据 teamconcat:企业联系人
  const packPersonData = ({ data, type }: any) => {
    const newArr: any = []
    // 参与企业联系人
    if (type == 3) {
      data?.map((item: any) => {
        newArr.push({
          username: item.username || item.curName,
          curName: item.username || item.curName,
          userid: item.userId || item.curId,
          curId: item.userId || item.curId,
          curType: 0,
          isExtends: item.isExtends,
          status: item.status,
          codeList: ['企业联系人'],
        })
      })
    } else if (data.curId || data.userId) {
      newArr.push({
        account: data.userAccount,
        type,
        username: data.username || data.curName,
        curName: data.username || data.curName,
        userid: data.userId || data.curId,
        curId: data.userId || data.curId,
        curType: 0,
      })
    }
    return newArr
  }

  /**
   * 编辑汇报确认
   */
  const editReportSetSure = () => {
    getForceReportList()
  }
  /**
   * 删除汇报
   * @param reportid
   * @param index
   */
  const delReport = (reportid: number) => {
    const { nowUserId, nowUser } = $store.getState()
    const newArr = [...state.allDataList]
    if (useFrom && useFrom.includes('createTask')) {
      const findI = state.allDataList.findIndex((item: any) => {
        return item.id == reportid
      })
      newArr.splice(findI, 1)
    }
    if (useFrom && useFrom.includes('createTask') && useFrom.includes('add')) {
      taskDetailObj.editTaskData({ reportSets: [...newArr] })
    } else {
      delForce({
        id: reportid,
        operateUser: nowUserId,
        operateUserName: nowUser,
      }).then((res: any) => {
        if (res.returnCode == 0) {
          message.success('删除成功！')
          if (useFrom && useFrom.includes('createTask')) {
            taskDetailObj.editTaskData({ reportSets: [...newArr] })
          }

          getForceReportList()
          ipcRenderer.send('handerForceReport', { reportid })
        }
      })
    }
  }
  // 更新汇报列表  查询当前汇报是否存在，存在则替换，反之添加
  const updateReportList = (reportData: any) => {
    let newArr: any = []
    const isExist = state.allDataList.filter((item: any) => {
      return item.id == reportData.id
    })

    if (isExist.length != 0) {
      state.allDataList.forEach((item: any) => {
        item.id == reportData.id ? newArr.push(reportData) : newArr.push(item)
      })
    } else {
      newArr = [...state.allDataList, reportData]
    }
    const totalPages = Math.ceil(newArr.length / state.pageSize)
    const handleList = getNowPageData({
      pageNo: state.pageNo,
      pageSize: state.pageSize,
      handleList: newArr,
    })
    setState({ ...state, reportSets: [...handleList], totalPages, allDataList: [...newArr] })
    if (useFrom && useFrom.includes('createTask') && useFrom.includes('add')) {
      taskDetailObj.editTaskData({ reportSets: [...newArr] })
    }
  }
  return (
    <div className="attachCont reportSetCont">
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          <span className="tit_txt">汇报设置</span>
          <span className="count_txt">({state.allDataList ? state.allDataList.length : 0})</span>
        </div>
        <div className="actionBtn">
          <span
            className={`img_icon add_cross_icon ${reportSetAuth ? '' : 'forcedHide'}`}
            onClick={() => {
              const reportPerson: any[] = packPersonData({ type: 0, data: mainData.liable || {} })
              const assignUser = packPersonData({ type: 1, data: mainData.distribute || {} })
              const leadershipUser = packPersonData({ type: 1, data: mainData.execute || {} })
              const receiverPerson: any[] = assignUser.concat(leadershipUser)
              const copyPerson: any[] = packPersonData({ type: 2, data: mainData.superviseUser || {} })
              const teamConcatPerson: any[] = packPersonData({ type: 3, data: detailData.joinTeams || [] })
              setOpenforceParam({
                visible: true,
                param: {
                  from: 'taskdetailLeft', //来源
                  isdetail: 0, //是否为详情 1详情 0设置 2编辑
                  taskid: taskId, //任务id 0:未创建任务，创建临时汇报
                  reportid: '', //强制汇报id
                  createTime: '', //创建时间
                  startTime: mainData.startTime, //开始时间
                  endTime: mainData.endTime, //结束时间
                  teamId: mainData.ascriptionId, //企业id
                  reportPerson, //执行人数据
                  receiverPerson, //汇报对象数据
                  copyPerson, //抄送数据
                  teamConcatPerson, //企业联系人
                  type: mainData.taskType, //任务类型 1---任务；5---项目
                },
              })
            }}
          ></span>
        </div>
      </header>
      <div className={`showListBox ${state.allDataList && state.allDataList.length > 0 ? '' : 'forcedHide'}`}>
        <div className="showList reportsList flex">
          <ul>
            {state.reportSets.map((item: any, index: number) => {
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
                        if (item.hasDelete || (useFrom && useFrom.includes('createTask'))) {
                          const teamConcatPerson: any[] = packPersonData({
                            type: 3,
                            data: detailData.joinTeams || [],
                          })
                          setOpenforceParam({
                            visible: true,
                            param: {
                              from: 'taskdetailLeft', //来源
                              isdetail: 2, //是否为详情 1详情 0设置 2编辑
                              taskid: taskId, //任务id
                              reportid: item.id, //强制汇报id
                              createTime: '', //创建时间
                              startTime: mainData.startTime, //开始时间
                              endTime: mainData.endTime, //结束时间
                              // private: state.private, //任务状态
                              teamId: mainData.ascriptionId, //企业id
                              teamConcatPerson,
                            },
                          })
                        }
                      }}
                    >
                      <div className="text">{`${item.reporter} ${item.forceTime} 向 ${item.receiver} 汇报`}</div>
                      {/* 查看未写汇报 */}
                      {item.hasDelay && item.hasDelay != 0 ? (
                        <RenderWriteReportBtn
                          reportid={item.id}
                          hasDelete={item.hasDelete}
                          index={index}
                          getForceReportList={getForceReportList}
                        />
                      ) : (
                        ''
                      )}
                      {(item.hasDelete || (useFrom && useFrom.includes('createTask'))) && (
                        <em
                          className="img_icon del_icon"
                          onClick={(e: any) => {
                            e.stopPropagation()
                            // 删除当前任务汇报
                            delReport(item.id)
                          }}
                        ></em>
                      )}
                    </div>
                  </li>
                </Tooltip>
              )
            })}
          </ul>
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
      </div>
      {/* 强制汇报 */}
      {openforceParam.visible && (
        <Forcereport
          visible={openforceParam.visible}
          datas={{
            ...openforceParam.param,
          }}
          setModalShow={(status: boolean) => {
            setOpenforceParam({ ...openforceParam, visible: status })
          }}
          getReports={(reportData: any) => {
            updateReportList(reportData)
          }}
          onOk={() => {
            if (useFrom && useFrom.includes('createTask')) {
              return
            }
            editReportSetSure()
          }}
          updateReportId={(id: any) => {
            if (useFrom && useFrom.includes('createTask')) {
              taskDetailObj.editTaskData({
                updateReportIds: [id],
              })
            }
          }}
        ></Forcereport>
      )}
    </div>
  )
}

/**
 * 查看未写汇报组件
 */
const RenderWriteReportBtn = ({
  reportid,
  hasDelete,
  index,
  getForceReportList,
}: {
  reportid: any
  hasDelete: boolean
  index: number
  getForceReportList: any
}) => {
  //打开未写汇报清空窗口
  const [noWriteReport, setNoWriteReport] = useState({
    index: -1,
    visible: false,
    datas: [],
  })
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
                      e.stopPropagation()
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
  // 清除未写汇报
  const clearForceNoWrite = (forceReportId: any, userId: any, index: number, content: string) => {
    const { nowUserId } = $store.getState()
    clearForceCountNoWrite({ forceReportId, userId, content, loginUserId: nowUserId }).then((res: any) => {
      if (res.returnCode == 0) {
        // 清空成功 删除当前弹窗数据 和 汇报数据
        const newArr = [...noWriteReport.datas]
        newArr.splice(index, 1)
        setNoWriteReport({ ...noWriteReport, datas: [...newArr] })
        // refreshTaskLogDetails()
        ipcRenderer.send('handerForceReport', { reportid: forceReportId })
        if (newArr.length == 0) {
          getForceReportList()
        }
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

/**
 * 详情右侧箭头式分页
 */
export const ArrowPager = React.forwardRef(
  (
    {
      pageNo,
      pageSize,
      totalPages,
      allDataList,
      className,
      pageChange,
    }: {
      pageNo: number
      pageSize: number
      totalPages: number
      allDataList: any
      className?: string
      pageChange?: any
    },
    ref
  ) => {
    const [state, setState] = useState({
      pageNo: 1, //当前页
      pageSize: 5, //每页大小
      totalPages: 0, //总页数
      nowPageData: [], //当前页数据
    })
    // ***********************暴露给父组件的方法**************************//
    useImperativeHandle(ref, () => ({
      /**
       * 设置state
       */
      setState: (paramObj: any) => {
        setState({ ...state, ...paramObj })
      },
      initState: (paramObj: any) => {
        setState({ ...state, ...paramObj })
      },
    }))

    /**
     * 监听数据改变，用于初始化组件
     */
    useEffect(() => {
      // const nowPageData = getNowPageData({ pageNo, handleList: [...allDataList] })
      setState({ ...state, pageNo, pageSize, totalPages })
    }, [pageNo, pageSize, totalPages])
    // ********************************操作处理方法*******************************//
    /**
     * 获取当前页数据
     * @param param0
     */
    const getNowPageData = ({ pageNo, handleList }: { pageNo?: number; handleList: any }) => {
      const getPageNo = pageNo ? pageNo : state.pageNo
      const pageData: any = []
      handleList?.map((item: any, i: number) => {
        const startNo = (getPageNo - 1) * state.pageSize
        if (i >= startNo && i <= startNo + state.pageSize - 1) {
          pageData.push(item)
        }
      })
      return pageData
    }
    /**
     * 分页切换
     * direction:-1向左 1或不传向右
     */
    const switchChange = ({ direction }: { direction: number }) => {
      let pageNo = state.pageNo
      // 向左
      if (direction == -1 && state.pageNo > 1) {
        pageNo = state.pageNo - 1
      } else if (direction == 1 && state.pageNo < state.totalPages) {
        // 向右
        pageNo = state.pageNo + 1
      }
      const nowPageData = getNowPageData({ pageNo, handleList: allDataList })
      pageChange &&
        pageChange({
          pageNo,
          dataList: [...nowPageData],
        })
      setState({ ...state, pageNo })
    }
    return (
      <div
        className={`arrowPager flex center-h center-v ${className || ''} ${
          state.totalPages ? '' : 'forcedHide'
        }`}
      >
        <span
          className="img_icon arrow_btn arrow_left_icon"
          onClick={() => {
            switchChange({
              direction: -1,
            })
          }}
        ></span>
        <span className="pageNumBox">
          {state.pageNo}/{state.totalPages}
        </span>
        <span
          className="img_icon arrow_btn arrow_right_icon"
          onClick={() => {
            switchChange({
              direction: 1,
            })
          }}
        ></span>
      </div>
    )
  }
)

/**
 * 获取当前页数据
 * @param param0
 */
export const getNowPageData = ({
  pageNo,
  pageSize,
  handleList,
}: {
  pageNo: number
  pageSize: number
  handleList: any
}) => {
  const pageData: any = []
  handleList?.map((item: any, i: number) => {
    const startNo = (pageNo - 1) * pageSize
    if (i >= startNo && i <= startNo + pageSize - 1) {
      pageData.push(item)
    }
  })
  return pageData
}

//新增删除参与企业
const setEnterprise = ({
  allDataList,
  dataList,
  teamId,
  type,
  oldDataInfo,
}: {
  allDataList: any
  dataList: any
  teamId?: any
  type: number
  oldDataInfo?: any
}) => {
  let teamList = []
  const list = [...allDataList]
  if (teamId) {
    //删除
    for (let i = 0; i < list.length; i++) {
      if (teamId == list[i].teamId) {
        list.splice(i, 1)
        break
      }
    }
    teamList = list
  } else {
    const newList: any = []
    dataList.map((item: any) => {
      newList.push({
        teamId: item.id,
        teamName: item.name,
        userId: item.userId,
        username: item.username,
        isExtends: item.isExtends || 0,
        status: item.status,
        teamLogo: item.profile || '',
      })
    })
    if (type == 1) {
      //修改联系人替换
      for (let i = 0; i < list.length; i++) {
        if (oldDataInfo.teamid == list[i].teamId && oldDataInfo.userId == list[i].userId) {
          list.splice(i, 1)
          break
        }
      }
    }
    teamList = [...list, ...newList]
  }
  return teamList
}
//保存获取参与企业信息
export const EnterpriseList = (datas: any) => {
  const list = datas
  const newArr = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    newArr.push({
      teamId: item.teamId,
      teamName: item.teamName,
      userId: item.userId,
      username: item.username,
      isExtends: item.isExtends || 0,
      status: '0',
      teamLogo: item.profile || item.teamLogo,
    })
  }
  return newArr
}

/**
 * 归属展示
 * @param attach
 */
export const getTaskBelong = (attach: any, ascriptionName?: string) => {
  // 无归属不显示文本
  if (!attach || attach.type == -1) {
    return {
      rangTxt: '',
      belongTxt: '',
    }
  }
  const teamName = ascriptionName || ''
  //归属文本
  const belongTxt = (attach.typeName ? attach.typeName + '-' : '') + teamName
  // 含节点的类型展示
  const belongComt = (
    <>
      <span className="belong_to">归属于 </span>
      <span className="type_name">{attach.typeName || ''}</span>
      <span className="diver_hor">{attach.typeName ? '-' : ''}</span>
      <span className="team_name">{teamName}</span>
    </>
  )
  let rangTxt = '个人级'
  if (attach.type == 3) {
    rangTxt = '部门级'
  } else if (attach.type == 2) {
    rangTxt = '企业级'
  }
  return {
    rangTxt,
    belongTxt,
    belongComt,
  }
}
/**
 * 选择归属
 */
export const selectBelong = ({ setSelMemberOrg, taskDetailObj }: any) => {
  const selectList: any = []
  const mainData = taskDetailObj.mainData || {}
  const attachobj = mainData.attach || {}
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
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
    curName: attachobj.typeName || '',
    account: '',
    curType: attachobj.type || 0,
    profile,
  })
  const memberOrg: any = {
    sourceType: 'taskBelong',
    visible: true,
    selectList,
    allowTeamId: [mainData.ascriptionId || ''],
    checkboxType: 'radio',
    permissionType: 3, //组织架构通讯录范围控制
    checkableType: [0, 2, 3],
    isDel: false,
    onSure: (dataList: any) => {
      // console.log(dataList)
      editAffiliation({ dataList, taskDetailObj })
    },
  }
  setSelMemberOrg(memberOrg)
}
/**
 * 编辑归属
 */
const editAffiliation = ({ dataList, taskDetailObj }: any) => {
  const { nowAccount } = $store.getState()
  const userObj = dataList[0] || {}
  const param: any = {}
  //更改任务归属
  param.ascriptionId = userObj.cmyId //企业ID
  param.ascriptionName = userObj.cmyName //企业名称
  param.attach = {
    star: '', //优先级等级
    type: userObj.curType, //0 个人任务  2企业任务  3部门任务
    typeId: userObj.curId, // 任务类型id
  }
  param.liable = {
    //执行人
    ascriptionId: userObj.cmyId,
    deptId: userObj.deptId || '',
    deptName: userObj.deptName || '',
    roleId: userObj.roleId,
    roleName: userObj.roleName,
    userId: userObj.curId,
    username: userObj.curName,
  }
  //选择归属为企业和部门时 查询相关负责人展示为执行人
  if (userObj.curType == 2 || userObj.curType == 3) {
    const params = {
      account: nowAccount,
      teamId: userObj.cmyId,
      deptId: userObj.curType == 2 ? userObj.cmyId : userObj.deptId,
      isCreate: 1, //创建0 编辑1
    }
    mainDutyApi(params).then((resData: any) => {
      const data = resData.data
      param.liable = {
        //执行人
        ascriptionId: userObj.cmyId,
        deptId: data.deptId,
        deptName: data.deptName,
        roleId: data.roleId,
        roleName: data.roleName,
        userId: data.userId,
        username: data.username,
      }
      taskDetailObj.editAffiliation({
        paramObj: param,
      })
    })
  } else {
    taskDetailObj.editAffiliation({
      paramObj: param,
    })
  }
}

//过滤 inputNumber 只能输入正整数+2位小数
const limitDecimals = (value: any): any => {
  // return value.replace(/^(?!0+(?:\.0+)?$)(?:[1-9]\d*|0)(?:\.\d{1,2})?$/g, '')
  const reg = /^(\-)*(\d+)\.(\d\d).*$/
  // const reg = /^([1-9][0-9]*)(\.[0-9]{2})?$|^(0\.[0-9]{2})$/;
  let newVal = ''
  if (typeof value === 'string') {
    newVal = !isNaN(Number(value)) ? value.replace(reg, '$1$2.$3') : ''
  } else if (typeof value === 'number') {
    newVal = !isNaN(value) ? String(value).replace(reg, '$1$2.$3') : ''
  }
  if (newVal.split('.')[1] && newVal.split('.')[1] == '00') {
    newVal = newVal.split('.')[0]
  }
  return newVal
}

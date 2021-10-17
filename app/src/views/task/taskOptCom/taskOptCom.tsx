import React, { useEffect, useRef, useState } from 'react'
import { Tooltip, Modal, Input, message } from 'antd'
import { requestApi } from '../../../common/js/ajax'
import { SelectMemberOrg } from '@/src/components/select-member-org/index'
import { taskReplay } from '../../workdesk/component/taskOptData'
import Editor from '@/src/components/editor/index'
const { TextArea } = Input
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
  ascriptionId: string
  ascriptionType: number
  ascriptionName: string
  taskId: string
  createUserName?: string
  liableAccount?: string
  liableUser?: string
  cmyId?: string
  cmyName?: string
  deptName?: string
  userId?: string
  deptId?: string
  roleId?: string
  roleName?: string
  parentId?: string
  parentName?: string
  liableUserName?: string
  profile?: string
  reason?: string
}
/**
 * 开启任务
 */
export const startTask = ({ id, status }: { id: string; status: number }) => {
  return new Promise(resolve => {
    const { nowUserId, nowUser } = $store.getState()
    const param = {
      id: id,
      status: status,
      operateUser: nowUserId,
      operateUserName: nowUser,
    }
    requestApi({
      url: '/task/execute',
      param: param,
      json: true,
      successMsg: '启动成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}
/**
 * 完成任务
 */
export const finishTask = ({ id, process }: { id: string; process: any }) => {
  return new Promise(resolve => {
    const { nowUserId, nowUser } = $store.getState()
    const param = {
      taskId: id,
      userId: nowUserId,
      process: process,
      operateUser: nowUserId,
      operateUserName: nowUser,
      oneKey: true,
    }
    requestApi({
      url: '/task/log/addTaskLog',
      param: param,
      successMsg: '操作成功',
      json: true,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}
/**
 * 取消完成任务
 */
export const unFinishTask = ({ id }: { id: string }) => {
  return new Promise(resolve => {
    const { nowUserId, nowUser } = $store.getState()
    const param = {
      id: id,
      operateUser: nowUserId,
      operateUserName: nowUser,
    }
    requestApi({
      url: '/task/taskCancelFinish',
      param: param,
      successMsg: '操作成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}
/**
 * 关注任务
 */
export const followTask = (paramObj: { taskId: string; teamId: string; belongName: string }) => {
  const { taskId, teamId, belongName } = paramObj
  const { nowUserId } = $store.getState()
  return new Promise(resolve => {
    const param = {
      belong: 'org',
      belongId: teamId,
      belongName: belongName,
      userId: nowUserId,
      followType: 'task',
      followId: taskId,
    }
    requestApi({
      url: '/task/follow/following',
      param: param,
      successMsg: '关注成功',
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}
/**
 * 取消关注任务
 */
export const unFollowTask = (paramObj: { taskId: string }) => {
  const { taskId } = paramObj
  const { nowUserId } = $store.getState()
  return new Promise(resolve => {
    const param = {
      userId: nowUserId,
      taskId: taskId,
    }
    requestApi({
      url: '/task/follow/unfollow',
      param: param,
      successMsg: '取消关注成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}
/**
 * 指派任务接口调用
 */
const assignTaskApi = (optInfo: any) => {
  return new Promise(resolve => {
    const { nowUserId, nowUser } = $store.getState()
    const param = {
      taskId: optInfo.taskId,
      operateUser: nowUserId,
      operateUserName: nowUser,
      ascriptionId: optInfo.cmyId,
      userIds: optInfo.userIds,
      reason: optInfo.reason,
    }
    requestApi({
      url: '/task/assign/addTaskAssign',
      param: param,
      json: true,
      headers: {
        teamId: optInfo?.cmyId,
      },
      successMsg: '指派成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}
/**
 * 移交任务接口调用
 */
const transferTaskApi = (info: {
  taskId: string
  userId: string
  deptId: string
  roleId: string
  cmyId: string
  reason?: string
}) => {
  return new Promise(resolve => {
    const { userId, deptId, roleId, cmyId, reason } = info
    const { nowUserId, nowUser } = $store.getState()
    const param = {
      id: info.taskId,
      operateUser: nowUserId,
      operateUserName: nowUser,
      liable: {
        userId,
        deptId,
        roleId,
        ascriptionId: cmyId,
      },
      reason,
    }
    requestApi({
      url: '/task/transFer/transferTask',
      param: param,
      json: true,
      successMsg: '移交成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}
/**
 * 移交任务弹框
 */
export const TransferTaskModal = ({ visible, setVisible, param }: any) => {
  const { taskId, ascriptionType, callback } = param
  //选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //備註
  const [textVul, setTextVul] = useState('')
  const [state, setState] = useState<any>({
    visible: false,
    user: [],
  })
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState({})
  //备注说明
  const reasonRef = useRef<any>({})
  //移交任务信息
  const [removeTaskInfo, setRemoveTaskInfo] = useState<TaskInfoProps>({
    ascriptionId: '0',
    ascriptionType: ascriptionType,
    ascriptionName: '',
    taskId: taskId,
    liableUser: '',
    cmyId: '',
    cmyName: '',
    deptName: '',
    userId: '0',
    deptId: '',
    roleId: '',
    roleName: '',
    parentId: '',
    parentName: '',
    liableUserName: '',
    profile: '',
  })
  useEffect(() => {
    setState({ ...state, visible, user: [] })
  }, [visible])
  const selectUser = () => {
    setSelMemberOrg({
      teamId: param.ascriptionId,
      selectList: state.user,
      allowTeamId: [param.ascriptionId],
      checkboxType: 'radio',
      onSure: (dataList: any) => {
        setAcceptPer(dataList)
      },
    })
    setMemberOrgShow(true)
  }

  //任务移交 设置接收人
  const setAcceptPer = (userList: any) => {
    setState({ ...state, visible, user: userList })
    if (userList.length != 0) {
      const vals = userList[0].curName
      // const ids = userList[0].curId
      // const account = userList[0].account
      const userInfo = {
        cmyId: userList[0].cmyId,
        cmyName: userList[0].cmyName,
        deptName: ascriptionType == 1 ? '' : userList[0].deptName,
        userId: userList[0].curId || '',
        deptId: ascriptionType == 1 ? '' : userList[0].deptId,
        roleId: ascriptionType == 1 ? '' : userList[0].roleId,
        roleName: ascriptionType == 1 ? '' : userList[0].roleName,
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
    if (state.user.length == 0) {
      message.error('请选择任务接收人')
      return
    }
    const param = {
      taskId,
      userId: removeTaskInfo.userId || '',
      deptId: removeTaskInfo.deptId || '',
      roleId: removeTaskInfo.roleId || '',
      cmyId: removeTaskInfo.cmyId || '',
      reason: textVul,
    }
    transferTaskApi(param).then((res: any) => {
      if (res.success) {
        setVisible(false)
        if (callback) {
          callback(res.data.dataList, removeTaskInfo)
        }
      }
    })
  }
  // ========点击取消===========//
  //   const handleCancel = () => {
  //     setVisible(false)
  //   }
  return (
    <section className="transferModalOut forcedHide">
      <Modal
        title="任务移交"
        centered
        visible={visible}
        maskClosable={false}
        onOk={() => {
          transferSure()
        }}
        onCancel={() => setVisible(false)}
        width={400}
        bodyStyle={{ padding: '20px', height: '242px' }}
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
                {state.user.map((item: UserProps) => (
                  <Tooltip title={item.curName} key={item.curId}>
                    <span className="item_user">{item.curName}</span>
                  </Tooltip>
                ))}
              </div>
            </div>
            <TextArea
              ref={reasonRef}
              rows={4}
              maxLength={300}
              value={textVul}
              onChange={e => {
                setTextVul(e.target.value)
              }}
            />
          </div>
          {/* {loading && (
            <div className="example">
              <Spin />
            </div>
          )} */}
        </div>
      </Modal>
      {/* 任务移交弹窗 */}
      {memberOrgShow && (
        <SelectMemberOrg
          param={{
            visible: memberOrgShow,
            ...selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
          }}
        />
      )}
    </section>
  )
}
/**
 * 指派任务弹框
 */
export const AssignTaskModal = ({ visible, setVisible, param }: any) => {
  // 回调函数
  const { callback } = param
  //   备注
  const reasonRef = useRef<any>({})
  //选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState({})
  //備註
  const [textVul, setTextVul] = useState('')
  const [state, setState] = useState<any>({
    visible: false,
    user: [],
  })
  //指派任务信息
  const [optInfo, setOptInfo] = useState<TaskInfoProps>({
    ascriptionId: '0',
    ascriptionType: 0,
    ascriptionName: '',
    taskId: '0',
    createUserName: '',
    liableAccount: '',
    liableUser: '',
    cmyId: '',
    cmyName: '',
    deptName: '',
    userId: '0',
    deptId: '',
    roleId: '',
    roleName: '',
    parentId: '',
    parentName: '',
    liableUserName: '',
    profile: '',
  })
  useEffect(() => {
    setState({ ...state, visible, user: [] })
  }, [visible])
  const selectUser = () => {
    setSelMemberOrg({
      teamId: param.ascriptionId,
      selectList: state.user,
      allowTeamId: [param.ascriptionId],
      checkboxType: 'checkbox',
      onSure: (dataList: any) => {
        setAcceptPer(dataList)
      },
    })
    setMemberOrgShow(true)
  }
  //设置接收人
  const setAcceptPer = (userList: any) => {
    setState({ ...state, user: userList })
    let assignInfo: any = {}
    if (userList.length != 0) {
      const userIds: any = []
      userList?.map((item: any) => {
        userIds.push({
          ascriptionId: param.ascriptionId,
          userId: item.curId,
        })
        assignInfo = {
          taskId: param.taskId,
          cmyId: param.ascriptionId,
          userIds: userIds,
          reason: '',
        }
      })
      setOptInfo({ ...optInfo, ...assignInfo })
    }
  }

  //确定操作
  const selectSure = () => {
    if (state.user.length == 0) {
      message.error('请选择任务接收人')
      return
    }
    optInfo.reason = textVul
    assignTaskApi(optInfo).then((res: any) => {
      if (res.success) {
        setTextVul('')
        setVisible(false)
        if (callback) {
          callback(res.data.dataList)
        }
      }
    })
  }

  return (
    <section className="assignModalOut forcedHide">
      <Modal
        title="任务指派"
        centered
        visible={visible}
        maskClosable={false}
        onOk={() => {
          selectSure()
        }}
        onCancel={() => setVisible(false)}
        width={400}
        bodyStyle={{ padding: '20px', height: '242px' }}
        className="task_transfer_modal"
      >
        <div className=" transfer-content transfer-task-content">
          <div className="transferTaskPop-title">
            <p>
              指派对象
              <span>（指派后，以子任务的形式派发给指派对象，作为执行人）</span>
            </p>
          </div>
          <div className="removeTaskCont">
            <div style={{ display: 'flex' }}>
              <span className="selectUser" onClick={() => selectUser()}></span>
              <div className="select_user_list">
                {state.user.map((item: UserProps) => (
                  <Tooltip title={item.curName} key={item.curId}>
                    <span className="item_user">{item.curName}</span>
                  </Tooltip>
                ))}
              </div>
            </div>
            <TextArea
              rows={4}
              maxLength={300}
              style={{ maxHeight: '300px' }}
              ref={reasonRef}
              value={textVul}
              onChange={e => {
                setTextVul(e.target.value)
              }}
            />
          </div>
        </div>
      </Modal>
      {/* 选人弹窗 */}
      {memberOrgShow && (
        <SelectMemberOrg
          param={{
            visible: memberOrgShow,
            ...selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
          }}
        />
      )}
    </section>
  )
}
/**
 * 添加复盘弹框
 */
export const ReviewModal = ({ param }: any) => {
  //复盘参数
  const [state, setState] = useState<any>({
    visible: false,
    refresh: 0,
    fromType: '',
    editorText: '',
    ascriptionId: '',
    taskId: '',
  })
  // 回调函数
  const { callback, taskId, refresh } = param
  useEffect(() => {
    if (param.visible) {
      setState({ ...state, ...param })
    }
  }, [refresh])

  let isLoaing = false
  //复盘
  const replaySure = () => {
    if (isLoaing) return
    isLoaing = true
    const { nowUserId, nowUser } = $store.getState()
    taskReplay({
      liableUser: nowUserId,
      liableUsername: nowUser,
      content: state.editorText,
      taskId,
    }).then((data: any) => {
      if (data.returnCode == 0) {
        setState({ ...state, visible: false, editorText: '' })
        callback &&
          callback({
            optType: 'replay',
          })
        message.success('添加成功！')
      } else {
        message.error('添加失败！')
        setState({ ...state, editorText: '' })
      }
    })
  }
  //设置复盘信息
  const editorChange = (html: string) => {
    setState({ ...state, editorText: html })
  }
  return (
    <section className="assignModalOut forcedHide">
      <Modal
        title="复盘"
        centered
        visible={state.visible}
        maskClosable={false}
        onOk={() => replaySure()}
        onCancel={() => {
          setState({ ...state, visible: false, editorText: '' })
        }}
        width={840}
        bodyStyle={{ padding: '20px', height: '500' }}
      >
        <div>
          <Editor
            editorContent={state.editorText}
            editorChange={editorChange}
            height={365}
            className="replayEditor"
            previewArea=".replayEditor"
            showText={true}
          />
        </div>
      </Modal>
    </section>
  )
}

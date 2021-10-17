import * as React from 'react'
import { useState, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import MeetStatusPop from '@/src/views/mettingManage/component/MeetStatusPop'
import InviteLinkUserModal from '@/src/views/coordination/inviteLinkUserModal'
import { agreeRefuse } from '@/src/views/workdesk/getData'
import { message } from 'antd'
import MeetDetails from '@/src/views/mettingManage/component/MeetDetails'
import NoticeDetails from '@/src/components/notice-details/index'
import DeskFollowPop from '@/src/views/coordination/deskFollow'
import ReplayMsg from '@/src/views/workdesk/component/ReplayMsg/ReplayMsg'
import OrgInvitationPlug from '@/src/views/workdesk/component/org-invitation-plug/org-invitation-plug'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import TaskReportModel from '@/src/views/workReport/component/TaskReportModel'
import ReportDetails from '@/src/views/workReport/component/ReportDetails'
import { openWindow } from '@/src/views/chatwin/getData/getData'
import moment from 'moment'
import { insertChatRoom } from '@/src/views/chatwin/getData/ChatInputCache'
import { getLocalRoomData } from '@/src/views/myWorkDesk/chat/ChatList'
const props: any = { msg: '', custom: '' }
const HandleMessage = () => {
  const [synergyVisible, setSynergyVisible] = React.useState(false)
  const [visibleMeetStatusPop, setVisibleMeetStatusPop] = useState(false)
  const [visibleMeetDetailsPop, setVisibleMeetDetailsPop] = useState(false)
  const [ruleVisible, setRuleVisible] = useState(false)
  const [replayMsgVisible, setReplayMsgVisible] = useState(false)
  //邀请通知模态框
  const [inviteVisible, setInviteVisible] = useState(false)
  //显示隐藏任务详情
  const [opentaskdetail, setTaskdetail] = useState(false)
  // 申请关注工作台处理弹窗
  const [deskFollowVisible, setDeskFollowVisible] = useState(false)
  // 任务汇报详情
  const [detailsModel, setDetailsModel] = useState(false)
  // 工作报告详情
  const [reportDetailsModel, setReportDetailsModel] = useState(false)
  const [defaultActiveKey, setDefaultActiveKey] = useState<string | undefined>('')

  useEffect(() => {
    // 确认请假/参加会议
    ipcRenderer.on('handleMessage', (e, args) => {
      props.msg = args[1]
      props.custom = args[2]
      systemType()
    })
  }, [])

  // 打开窗口
  const openRoom = async (resData: any) => {
    const { chatListData, openRoomIds, nowUserId, selectItem } = $store.getState()
    const dataList = JSON.parse(JSON.stringify(chatListData))
    const data = [...dataList, resData]
    insertChatRoom(resData)
    // 列表排序
    data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
      if (a.isTop === b.isTop) {
        return moment(b.time).valueOf() - moment(a.time).valueOf()
      }
      return b.isTop - a.isTop
    })
    // 打开沟通窗口
    ipcRenderer.send('show_commuciate_muc', [selectItem, resData])
    const newIds = [...openRoomIds, resData.id]
    // 保存当前在独立窗口打开的聊天室
    $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
    // 更新列表
    // getLocalRoomData(false, 'time')
    $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
    // 设置滚动条的位置
    const resultData = chatListData.filter(item => {
      return newIds.indexOf(item.id) !== -1
    })
    resultData.map((item: any, index: number) => {
      if (item.id === resData.id) {
        const offsetTop = index * 62
        $('#chat_list_main').scrollTop(offsetTop - 100)
      }
    })
    // 更新本地数据库
    // updateChatRoomDetail({ userId: nowUserId, data })
  }

  const systemType = () => {
    const { noticeType, noticeTypeId, ascriptionId, spareContent } = props.msg
    switch (noticeType) {
      case 'unconfirmed_meeting': //未确认会议
      case 'unconfirmed_meeting_update': //变更会议
      case 'unconfirmed_meeting_remind': //会议提醒
        meetOption(props.custom)
        break
      case 'force_report_lazy': //强制汇报：待写
        forceReport()
        break
      case 'task_synergy': //任务邀请参与企业协同
        setSynergyVisible(true)
        break
      case 'approval_send': //他人向我发起的审批处理通知
      case 'approval_urge': //审批催办
        $tools.createWindow('Approval', {
          sendOptions: ['waitApproval', noticeTypeId],
        })
        break
      case 'approval_return': //我发起的
      case 'temporary_storage': //我发起的
        $tools.createWindow('Approval', {
          sendOptions: ['mySendApproval', noticeTypeId],
        })
        break
      case 'approval_notice': //知会我的
        $tools.createWindow('Approval', {
          sendOptions: ['noticeMeApproval', noticeTypeId],
        })
        break
      case 'touch_approval': //触发审批
      case 'reject_approval': //驳回审批
        $tools.createWindow('Approval', {
          sendOptions: ['triggerApproval', noticeTypeId],
        })
        break
      case 'follow_request': //关注人协同请求
        setDeskFollowVisible(true)
        break
      case 'invite': //邀请
        inviteHandle(props.custom, noticeTypeId, noticeType)
        break
      case 'rule': //公告
        lookRule(noticeTypeId, noticeType)
        break
      case 'check_comment_at_me': //检查项@我的
      case 'task_report_at_me': //任务汇报@我
      case 'remarks_opinion_at_me': //备注意见@我的
      case 'remarks_opinion_comment_at_me': //备注评论@我的
      case 'task_talk_at_push': //聊天【群组@】推送
      case 'approval_remarks_at_me': //审批备注@我
      case 'approval_remarks_comment_at_me': //审批回复@我
      case 'force_report_clear': //强制汇报设置通知
      case 'force_report_update':
      case 'force_report_set':
      case 'work_report_at_me': //工作报告@
      case 'work_report_comment_at_me': //工作报告详情评论@
      case 'task_report_comment_at_me': //工作报告详情评论@
      case 'task_todo_know': //任务代办事项
        typeOption(noticeTypeId, noticeType)
        break
      case 'chan_dao_bug':
      case 'chan_dao_task':
      case 'chan_dao_need':
        const sendParams = {
          address: props.msg.mobileData.address,
          type: noticeType,
          id: noticeTypeId,
        }
        ipcRenderer.send('open_chandao_window', sendParams)
        ipcRenderer.send('handle_messages_option', ['chandao', noticeTypeId, noticeType])
        break
      case 'work_report_remind':
        $store.dispatch({
          type: 'WORKREPORT_TYPE',
          data: {
            isEcho: true,
            wortReportType: 'create',
            noticeType: noticeType,
            reportTemplateId: noticeTypeId,
            teamId: ascriptionId,
            wortReportTtime: Math.floor(Math.random() * Math.floor(1000)),
            spareContent: spareContent,
          },
        })
        $tools.createWindow('WorkReport')
        break
      // case 'work_report_at_me': //工作报告@
      // case 'work_report_comment_at_me': //工作报告详情评论@
      //   break
      default:
        break
    }
  }
  //会议类
  const meetOption = (custom: number) => {
    //custom === -1 ?打开会议详情弹窗://请假、参加
    custom === -1 ? setVisibleMeetDetailsPop(true) : setVisibleMeetStatusPop(true)
  }
  //强制汇报待写
  const forceReport = () => {
    $store.dispatch({
      type: 'FORCE_LIST_REPORT',
      data: {
        id: props.msg.spareId || '',
      },
    })
    $tools.createWindow('createForceReport')
  }
  //邀请类
  const inviteHandle = (custom: number, noticeTypeId: number, noticeType: string) => {
    const params = {
      id: noticeTypeId,
      result: custom,
    }
    if (custom === 0 || custom === 4) {
      agreeRefuse(params).then(
        (res: any) => {
          message.success('操作成功！')
          ipcRenderer.send('handle_messages_option', ['invite', noticeTypeId, noticeType])
        },
        err => {
          if (err.returnCode === 10057) {
            // 其他终端处理关闭右小角弹窗
            ipcRenderer.send('handle_messages_option', ['invite', noticeTypeId, noticeType])
          }
          message.error(err.returnMessage)
        }
      )
    } else {
      // setIsRead(props.msg.isRead)
      setInviteVisible(true)
    }
  }
  //公告查看
  const lookRule = (noticeTypeId: number, noticeType: string) => {
    setRuleVisible(true)
    $store.dispatch({
      type: 'NOTICE_DETAILS',
      data: {
        source: 'noticeList',
        noticeId: noticeTypeId,
        noticeType: noticeType,
      },
    })
  }
  //各类操作集合
  const typeOption = (noticeTypeId: number, noticeType: string) => {
    const remarkAtme =
      (noticeType === 'approval_remarks_at_me' || noticeType === 'approval_remarks_comment_at_me') &&
      props.custom !== 0 &&
      props.custom !== 1
    const taskState =
      props.custom === -1 &&
      noticeType !== 'task_report_at_me' &&
      noticeType !== 'approval_remarks_at_me' &&
      noticeType !== 'approval_remarks_comment_at_me' &&
      noticeType !== 'work_report_at_me' &&
      noticeType !== 'work_report_comment_at_me' &&
      noticeType !== 'task_report_comment_at_me'
    if (noticeType === 'check_comment_at_me') {
      setDefaultActiveKey('4')
    } else if (noticeType === 'remarks_opinion_comment_at_me' || noticeType === 'remarks_opinion_at_me') {
      setDefaultActiveKey('2')
    }
    const reportRaskMe =
      (props.custom === -1 && noticeType === 'task_report_at_me') || noticeType === 'task_report_comment_at_me'
    const workReportAtMe =
      props.custom === -1 && (noticeType === 'work_report_at_me' || noticeType == 'work_report_comment_at_me')
    const talkAtMe = noticeType === 'task_talk_at_push' && props.custom !== 0 && props.custom !== 1
    const commentAtMe =
      props.custom === -1 &&
      (noticeType === 'approval_remarks_at_me' || noticeType === 'approval_remarks_comment_at_me')

    if (taskState) {
      //打开任务详情弹窗
      setTaskdetail(true)
    } else if (reportRaskMe) {
      // 打开汇报弹窗
      setDetailsModel(true)
    } else if (workReportAtMe) {
      setReportDetailsModel(true)
    } else if (remarkAtme) {
      //查看审批详情
      $store.dispatch({
        type: 'SET_OPERATEAPPROVALID',
        data: {
          isQueryAll: false,
          ids: props.msg.spareId,
        },
      })
      $tools.createWindow('ApprovalOnlyDetail')
    } else if (talkAtMe) {
      const { chatListData, openRoomIds, selectItem } = $store.getState()
      const data = JSON.parse(JSON.stringify(chatListData))
      let isIn = false
      let newIds = [...openRoomIds]
      data.map((item: any) => {
        if (item.id === noticeTypeId) {
          isIn = true
          const isRoomOpen = openRoomIds.some(thisId => {
            return thisId === item.id
          })
          if (!isRoomOpen) {
            // 判断聊天室是否打开（是否存在聊天室列表）
            newIds = [...openRoomIds, item.id]
            $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
          }
          // 打开沟通窗口
          ipcRenderer.send('show_commuciate_muc', [selectItem, item])
        }
      })
      // 判断聊天室是否打开\是否存在聊天室列表
      if (isIn) {
        // 设置滚动条的位置
        const resultData = chatListData.filter(item => {
          return newIds.indexOf(item.id) !== -1
        })
        resultData.map((item: any, index: number) => {
          if (item.typeId === noticeTypeId) {
            const offsetTop = index * 62
            $('#chat_list_main').scrollTop(offsetTop - 100)
          }
        })
      } else {
        openWindow(noticeTypeId).then((resData: any) => {
          ipcRenderer.send('add_new_chat_room', resData.muc)
          openRoom(resData)
        })
      }

      // $store.dispatch({
      //   type: 'SAVE_TYPE_POS',
      //   data: params,
      // })
      // const { unreadList } = $store.getState()
      // if (unreadList.length) {
      //   //关闭未读信息列表
      //   $store.dispatch({
      //     type: 'SAVE_UNREAD_INFO',
      //     data: [],
      //   })
      //   ipcRenderer.send('change_tray_icon')
      // }
    } else {
      //已知晓、回复
      if (!commentAtMe) {
        setReplayMsgVisible(true)
      }
    }
  }
  const visibleMeetStatusPops = (params: any) => {
    setVisibleMeetStatusPop(params.state)
    if (params.isSuc) {
      setVisibleMeetDetailsPop(params.state)
    } else {
      // message.error('该会议已失效')
      setVisibleMeetStatusPop(false)
      // props.msg.noticeType
      ipcRenderer.send('update_unread_num', [props.msg.noticeTypeId]) //更新工作台数量
      ipcRenderer.send('handle_messages_option', ['meet', props.msg.noticeTypeId, props.msg.noticeType])
    }
  }
  return (
    <div>
      {visibleMeetDetailsPop && (
        <MeetDetails
          datas={{
            queryId: props.msg.noticeTypeId,
            meetModal: visibleMeetDetailsPop,
          }}
          isVisibleDetails={(state: boolean) => {
            setVisibleMeetDetailsPop(state)
          }}
          callback={() => {}}
        />
      )}
      {visibleMeetStatusPop && (
        <MeetStatusPop
          visibleDetails={visibleMeetStatusPop}
          datas={{
            meetId: props.msg.noticeTypeId,
            type: props.custom,
          }}
          visibleMeetStatusPop={visibleMeetStatusPops}
        />
      )}
      {ruleVisible && (
        <NoticeDetails
          showModal={(isVisible: boolean) => setRuleVisible(isVisible)}
          // refreshCallback={(noticeTypeId: number) => refreshDotSHow(noticeTypeId)}
        />
      )}
      {synergyVisible && (
        <InviteLinkUserModal
          paramsProps={{ ...props.msg }}
          visible={synergyVisible}
          onclose={(state: boolean) => {
            setSynergyVisible(state)
          }}
        />
      )}
      <DeskFollowPop
        datas={{ visiblePop: deskFollowVisible, currentData: props.msg }}
        onclose={(state: boolean) => {
          setDeskFollowVisible(state)
          ipcRenderer.send('update_unread_num', [props.msg.noticeTypeId]) //更新工作台数量
          ipcRenderer.send('handle_messages_option', ['follow', props.msg.noticeTypeId, props.msg.noticeType])
        }}
      />
      {replayMsgVisible && (
        <ReplayMsg
          params={{ item: props.msg, type: props.custom, isIn: 'HandleMessage' }}
          setVisble={(state: boolean) => {
            setReplayMsgVisible(state)
          }}
          callback={(params: any) => {
            setReplayMsgVisible(false)
            // setTaskData(taskData.filter((item: TaskItemProps) => item.id !== params.rowId))
            // readCancelMsg(params.rowId)
            // 成功关闭右小角弹窗
            ipcRenderer.send('handle_messages_option', [
              'check_comment_at_me',
              props.msg.noticeTypeId,
              props.msg.noticeType,
            ])
          }}
          commentId={props.msg.commentId}
        />
      )}
      {inviteVisible && (
        <OrgInvitationPlug
          params={{
            isRead: 0,
            visible: inviteVisible,
            id: props.msg.noticeTypeId,
            disposeType: 0,
            setvisible: (state: any) => {
              setInviteVisible(state)
            },
            optionCallback: (params: any) => {
              // 右下角弹窗处理成功刷新工作台侧边栏企业
              ipcRenderer.send('refresh_desk_module', [
                false,
                props.msg.noticeTypeId,
                props.msg.noticeType,
                'invite_count',
              ])
              // refreshDesk(false, currentData.noticeTypeId, currentData.noticeType, 'invite_count')
            },
          }}
        />
      )}
      {/* 任务详情 */}
      {opentaskdetail && (
        <DetailModal
          param={{
            visible: opentaskdetail,
            from: 'pushContent',
            id: props.msg.noticeType == 'task_todo_know' ? props.msg.noticeTypeId : props.msg.spareId,
            taskData: {
              id: props.msg.noticeType == 'task_todo_know' ? props.msg.noticeTypeId : props.msg.spareId,
            },
            defaultActiveKey: defaultActiveKey,
          }}
          setvisible={(state: any) => {
            setTaskdetail(state)
          }}
          setActiveKey={(keys?: string) => {
            setDefaultActiveKey(keys)
          }}
        ></DetailModal>
      )}
      {/* 报告详情 */}
      {detailsModel && (
        <TaskReportModel
          param={{
            visible: detailsModel,
            data: { ...props.msg, taskId: props.msg.mobileData.taskId, noticeType: 'close_now_system' },
            type: 1,
          }}
          setvisible={(state: any) => {
            setDetailsModel(state)
          }}
        />
      )}
      {/* {工作报告详情} */}
      {reportDetailsModel && (
        <ReportDetails
          param={{
            reportId: props.msg.noticeTypeId,
            isVisible: reportDetailsModel,
            isMuc: 1,
          }}
          setvisible={(state: any) => {
            setReportDetailsModel(state)
          }}
        />
      )}
    </div>
  )
}

export default HandleMessage

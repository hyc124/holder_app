import React, { useState, memo } from 'react'
import { Avatar, message, Tooltip } from 'antd'
import moment from 'moment'
import { updateNoticeStatus } from '../getData/getData'
import { getAvatarEnums } from '../getData/ChatHandle'
import MeetDetails from '../.././mettingManage/component/MeetDetails'

const SystemContent = (props: any) => {
  const { showContent, getRobotMessageList, mucAssistantList } = props
  // 任务结论详情显示/隐藏
  const [meetingModalVisible, setMeetingVisible] = useState<boolean>(false)
  // 是否接收消息
  const handleReceive = () => {
    const {
      messageCard: { secondLevelMessageType, notice },
    } = showContent
    const targetList = mucAssistantList.filter(
      (item: any) => item.belongSecondMessageType == secondLevelMessageType
    )
    const value = {
      id: targetList[0].id,
      notice: notice == 1 ? 0 : 1,
    }
    updateNoticeStatus(value)
      .then(() => {
        getRobotMessageList()
        message.success('设置成功')
      })
      .catch(() => {
        message.success('设置失败')
      })
  }

  // 点击查看详情调转进入对应s审批的详情
  const checkApprovalDetail = () => {
    setMeetingVisible(true)
  }

  // 渲染主体内容信息
  const renderMsgContent = (messageCard: globalInterface.MessageCardProps) => {
    const { contentTemp, enterpriseName, notice, secondLevelMessageType } = messageCard
    return (
      <div className="robotTextContent">
        <div className="robotTitle">
          {getRobotTitle(secondLevelMessageType)}
          <Tooltip title={`${!notice ? '展示此类消息' : '不接收此类消息'}`}>
            <span className={`${!notice ? 'receiveIcon' : 'rejectIcon'} icon`} onClick={handleReceive}></span>
          </Tooltip>
        </div>
        <div className="robotContent" style={{ position: 'relative' }}>
          <div>{contentTemp}</div>
          <div className="robotBelongTo">{enterpriseName}</div>
          {secondLevelMessageType == 'meeting_conclude' && (
            <div className="robotBtn" onClick={checkApprovalDetail}>
              <span>查看详情</span>
            </div>
          )}
        </div>
      </div>
    )
  }
  const { time, from, messageCard, roomName } = showContent
  return (
    <div className="normal-msg flex normal-chat">
      {/* 机器人头像 */}
      <Avatar className="oa-avatar" src={getAvatarEnums(7, roomName)}>
        {roomName && roomName.substr(-2, 2)}
      </Avatar>
      <div className="show-message flex-1">
        {/* 机器人类型 */}
        <span className="from-name">{from}</span>
        <div className="message-main">
          {/* 消息主体内容 */}
          <div>{renderMsgContent(messageCard)}</div>
          <div style={{ color: '#999', marginTop: '5px' }}>{moment(Number(time)).format('MM月DD日 HH:mm')}</div>
          <div style={{ clear: 'both' }}></div>
        </div>
      </div>
      {/* 任务结论详情 */}
      {meetingModalVisible && (
        <MeetDetails
          datas={{
            queryId: messageCard.noticeTypeId,
            listType: 0,
            meetModal: meetingModalVisible,
          }}
          isVisibleDetails={() => setMeetingVisible(false)}
          callback={() => null}
        />
      )}
    </div>
  )
}

export default memo(SystemContent)

// 通过二级消息类型判断对应的标题
export const getRobotTitle = (type: string) => {
  let str = ''
  switch (type) {
    case 'enterprise_disband':
      str = '企业解散'
      break
    case 'enterprise_remove_user':
      str = '移出企业'
      break
    case 'work_exchange':
      str = '工作移交'
      break
    case 'workbench_follow':
      str = '工作台关注/取关'
      break
    case 'meeting_exchange':
      str = '会议变更'
      break
    case 'meeting_conclude':
      str = '会议结论'
      break
    case 'task_report_review':
      str = '任务汇报评论'
      break
    case 'task_remarks_opinion_comment_review':
      str = '任务备注评论'
      break
    case 'task_check_comment_review':
      str = '任务检查项评论'
      break
    case 'work_report_send_review':
      str = '工作报告评论'
      break
    case 'work_report_statistics':
      str = '工作报告统计'
      break
    case 'work_report_send':
      str = '工作报告接收'
      break
    case 'report_send':
      str = '任务汇报接收'
      break
    case 'force_report_set':
      str = '强制汇报'
      break
    case 'okr_report_send':
      str = 'OKR发送汇报'
      break
    case 'okr_progress_review':
      str = 'OKR进展'
      break
  }
  return str
}

import React from 'react'
import { Avatar } from 'antd'
import moment from 'moment'
import { getAvatarEnums } from '../getData/ChatHandle'
import 'react-photo-view/dist/index.css'
import ApprovalContent from './ApprovalContent'
import SystemContent from './SystemContent'
import '../styles/ChatItem.less'
import ChatCommentRobot from './ChatCommentRobot'
import ReportContent from './reportContent'
/*
 *聊天消息组件
 */
const ChatItemRobot = ({
  data,
  showContent,
  getRobotMessageList,
  mucAssistantList,
}: {
  showContent: any
  data: globalInterface.ChatRobotItemProps
  getRobotMessageList: any
  mucAssistantList: any
}) => {
  const { day } = data
  const { fromAccount, time, from } = showContent
  if (day) {
    return (
      <div className="date-show-line">
        <p></p>
        <span>{day}</span>
      </div>
    )
  }

  return (
    <div className="chat-item" data-time={data.time}>
      {/*汇报机器人消息内容*/}
      {fromAccount === 'reportRobot' && (
        <ReportContent
          showContent={showContent}
          getRobotMessageList={getRobotMessageList}
          mucAssistantList={mucAssistantList}
        />
      )}
      {/* 系统通知机器人消息内容 */}
      {fromAccount == 'systemNotificationRobot' && (
        <SystemContent
          showContent={showContent}
          getRobotMessageList={getRobotMessageList}
          mucAssistantList={mucAssistantList}
        />
      )}
      {/* 评论内容 */}
      {fromAccount == 'reviewRobot' && (
        <div className="normal-msg flex normal-chat">
          {/* 机器人头像 */}
          <Avatar className="oa-avatar" src={getAvatarEnums(7, data.roomName)}>
            {data.roomName && data.roomName.substr(-2, 2)}
          </Avatar>
          <div className="show-message flex-1">
            {/* 机器人类型 */}
            <span className="from-name">{from}</span>
            {/* 评论主体 */}
            <ChatCommentRobot data={showContent} />
            <div style={{ color: '#999', marginTop: '5px' }}>
              {moment(Number(time)).format('MM月DD日 HH:mm')}
            </div>
          </div>
        </div>
      )}
      {/* 审批机器人消息内容 */}
      {fromAccount == 'approvalRobot' && (
        <ApprovalContent
          showContent={showContent}
          getRobotMessageList={getRobotMessageList}
          mucAssistantList={mucAssistantList}
        />
      )}
    </div>
  )
}

export default ChatItemRobot

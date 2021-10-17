import React from 'react'
import { Timeline, Avatar } from 'antd'
import { ApprovalDetailProps } from '@/src/views/approval/components/ApprovalDettail'
import ApprovalInfoTimeline from './ApprovalInfoTimeline'
import ShowNoticeUser from './ShowNoticeUser'

//审批流程信息
interface ProvideListPorps {
  sendInfo: ApprovalDetailProps
  provideInfo: {
    id: number
    noticeType: number
    approvalerNum: number
    processType: number
    finish: boolean
    approvers: {
      userId: number
      username: string
      userProfile: string
      approvalResult: number
      spendTime: number
      reason: string
      time: string
      status: number
      isRead: number
      processId: number
      messageModel: any
      account: string
    }[]
    notices: any[]
  }
  disabled?: boolean
  index: number
}

/**
 * 渲染审批流程信息
 */
const RenderProvideInfo = ({ sendInfo, provideInfo, disabled, index }: ProvideListPorps) => {
  const totalNum = provideInfo.approvers.filter(
    item => item.status === 0 || item.status === 1 || item.status === 2
  ).length
  return (
    <div className="approval-flow-list">
      <div className="flow-span-title">
        <span className="flow-title">审批轨迹</span>
        {!provideInfo.finish && !sendInfo.activitiProcessId && <span className="new-symbol">最新</span>}
        {provideInfo.approvers.length > 1 && !sendInfo.activitiProcessId && (
          <span className="approval-user-detail">
            {provideInfo.processType === 0
              ? `同时审批,共${totalNum}人审批，需要其中${provideInfo.approvalerNum}人同意则完成审批`
              : '依次审批'}
          </span>
        )}
      </div>
      <Timeline>
        {index === 0 && (
          <Timeline.Item className="provide-item">
            <div className="provide-content-top">
              <Avatar className="oa-avatar" src={sendInfo.profile}>
                {sendInfo.username.substr(-2, 2)}
              </Avatar>
              <div className="provide-header">
                <span className="time-span">{sendInfo.time}</span>
                <span className="provide-user">{sendInfo.username}</span>
              </div>
            </div>
            <div className="provide-detail">发起审批</div>
          </Timeline.Item>
        )}
        {provideInfo.approvers.map((item, index) => {
          return (
            <ApprovalInfoTimeline
              item={item}
              key={index}
              sendInfo={sendInfo}
              disabled={disabled}
              noticeUsers={provideInfo.notices}
            />
          )
        })}
      </Timeline>
      {/**抄送人 */}
      {provideInfo.notices && provideInfo.notices.length > 0 && (
        <ShowNoticeUser users={provideInfo.notices} noticeType={provideInfo.noticeType} />
      )}
    </div>
  )
}

export default RenderProvideInfo

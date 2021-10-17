import React from 'react'
import { Avatar, message, Tooltip, Modal } from 'antd'
import moment from 'moment'
import $c from 'classnames'
import { Provider } from 'react-redux'
import { updateNoticeStatus } from '../getData/getData'
import { getAvatarEnums } from '../getData/ChatHandle'
import RenderApprovalDetails from '../../approval-only-detail/ApprovalDetailsOnly'

const ApprovalContent = (props: any) => {
  const { showContent, getRobotMessageList, mucAssistantList } = props
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
    const {
      messageCard: { noticeTypeId },
    } = showContent
    const modal = Modal.info({
      title: '审批详情',
      style: {
        height: '800px',
      },
      closable: true,
    })
    modal.update({
      title: '审批详情',
      width: '1000px',
      centered: true,
      okCancel: false,
      // okText: '知道了',
      icon: false,
      className: 'show-approval-details',
      content: (
        <Provider store={$store}>
          <RenderApprovalDetails queryAll={false} approvalId={noticeTypeId} />
        </Provider>
      ),
    })
  }

  // 通过二级消息类型判断对应的标题
  const getRobotTitle = (type: string) => {
    let str = ''
    switch (type) {
      case 'approval_result':
        str = '审批结果反馈'
        break
      case 'approval_temporary_storage':
        str = '审批暂存代办'
        break
      case 'approval_comments':
        str = '审批备注'
        break
      case 'approval_notice':
        str = '审批知会'
        break
    }
    return str
  }

  // 渲染主体内容信息
  const renderMsgContent = (messageCard: globalInterface.MessageCardProps) => {
    const { contentTemp, enterpriseName, noticeType, notice, secondLevelMessageType } = messageCard
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
          <div className="robotBtn" onClick={checkApprovalDetail}>
            <span>查看详情</span>
          </div>
          <div
            className={$c({
              'success-img': noticeType == 'approval_return_agree',
              'reject-img': noticeType == 'approval_return_reject',
            })}
          ></div>
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
    </div>
  )
}

export default ApprovalContent

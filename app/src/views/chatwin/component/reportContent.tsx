import React, { memo, useState } from 'react'
import { Avatar, message, Tooltip } from 'antd'
import moment from 'moment'
import { messageAssistantQuery, updateNoticeStatus } from '../getData/getData'
import { getAvatarEnums } from '../getData/ChatHandle'
import { getRobotTitle } from './SystemContent'
import OkrReportDetails from '../../workReport/component/okrReportDetails'
import TaskReportModel from '../../workReport/component/TaskReportModel'
import { SubmitModal } from '../../workReport/component/ReportAccept'
import { useMergeState } from '../../chat-history/chat-history'
import ReportDetails from '../../workReport/component/ReportDetails'
import $c from 'classnames'
//提交统计参数缓存
let $params: any = {}
const ReportContent = (props: any) => {
  const { showContent, getRobotMessageList, mucAssistantList } = props
  const { time, from, messageCard, roomName } = showContent
  //任务汇报,OKR进展,提交统计弹窗状态
  const [detailsModel, setDetailsModel] = useState(false)
  const [okrVsible, setOkrVsible] = useState(false)
  const [submitVsible, setSubmitVsible] = useState(false)
  //任务ID
  const [taskId, setTaskId] = useState<any>('')
  const [curState, setCurState] = useMergeState({
    reportVisble: false,
    reportId: '',
  })
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

  // 点击查看详情调转进入对应任务的详情
  const lookDetails = (msgType: string, item: any) => {
    const info = checkJSON(item.content) ? JSON.parse(item.content) : {}
    setTaskId(info.taskId)
    if (msgType === 'work_report_send') {
      //跳转汇报详情窗口
      setCurState({
        reportVisble: true,
        reportId: item.noticeTypeId,
      })
    } else if (msgType === 'work_report_statistics') {
      messageAssistantQuery({
        templateId: item.noticeTypeId,
        belongId: item.enterpriseId,
        currentTime: info.startTime ? formatDat(info.startTime) : item.createTime,
        userId: $store.getState().nowUserId,
      })
        .then((res: any) => {
          if (res.data && Array.isArray(res.data) && res.data.length !== 0) {
            const msg = res.data
            $params = {
              ...msg[0],
              templateId: item.noticeTypeId,
              belongId: item.enterpriseId,
            }
            setSubmitVsible(true)
          } else {
            message.error('暂无统计数据')
          }
        })
        .catch((msg: any) => {
          message.error(msg)
        })

      //跳转工作报告统计页面
    } else if (msgType === 'force_report_set') {
      //跳转强制汇报窗口
      $store.dispatch({
        type: 'FORCE_LIST_REPORT',
        data: {
          id: item.id || '',
          noticeTypeId: item.noticeTypeId || '',
        },
      })
      $tools.createWindow('createForceReport')
    } else if (msgType === 'report_send') {
      //任务汇报接收
      setDetailsModel(true)
    } else if (msgType === 'okr_report_send') {
      //跳转OKR进展详情
      setOkrVsible(true)
    }
  }
  // 渲染主体内容信息
  const renderMsgContent = (messageCard: globalInterface.MessageCardProps) => {
    const { contentTemp, enterpriseName, notice, secondLevelMessageType, title } = messageCard
    const { buttonMsg, contentMsg } = renderReportMsg(messageCard)
    return (
      <div className="robotTextContent">
        <div className="robotTitle">
          {title ? title : getRobotTitle(secondLevelMessageType)}
          <Tooltip title={`${!notice ? '展示此类消息' : '不接收此类消息'}`}>
            <span
              className={$c('icon', { receiveIcon: !notice, rejectIcon: notice })}
              onClick={handleReceive}
            ></span>
          </Tooltip>
        </div>
        <div className="robotContent">
          <div className="robotMsg">{contentTemp}</div>
          {secondLevelMessageType !== 'force_report_set' && (
            <div className="reportWrap">
              {contentMsg && <div className="reportCont">{contentMsg}</div>}
              {/*工作报告展示日期*/}
              {buttonMsg && (
                <div className="reportTime">
                  {buttonMsg.indexOf('【') != -1 ? buttonMsg : `【${buttonMsg}】`}
                </div>
              )}
            </div>
          )}

          <div className="robotBelongTo">{enterpriseName}</div>
          {isRierce(secondLevelMessageType) && (
            <div className="robotBtn" onClick={() => lookDetails(secondLevelMessageType, messageCard)}>
              <span>查看详情</span>
            </div>
          )}
        </div>
      </div>
    )
  }

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
          <span style={{ marginTop: 5, color: 'rgb(153, 153, 153)' }}>
            {moment(Number(time)).format('MM月DD日 HH:mm')}
          </span>
          <div style={{ clear: 'both' }}></div>
        </div>
      </div>

      {/* okr进展详情 */}
      {okrVsible && (
        <OkrReportDetails
          param={{
            visible: okrVsible,
            data: { taskId: taskId },
            type: 0,
          }}
          setvisible={(state: any) => {
            setOkrVsible(state)
          }}
        />
      )}

      {/* 任务汇报 */}
      {detailsModel && (
        <TaskReportModel
          param={{
            visible: detailsModel,
            data: { taskId: taskId },
            type: 1,
          }}
          setvisible={(state: any) => {
            setDetailsModel(state)
          }}
        />
      )}

      {/*工作报告接收统计*/}
      {submitVsible && (
        <SubmitModal
          visible={submitVsible}
          info={{
            title: $params.date,
            templateId: $params.templateId,
            belongId: $params.belongId,
            isModalDetails: $params,
          }}
          setVsible={() => {
            $params = {}
            setSubmitVsible(false)
          }}
          isChat={true}
        />
      )}
      {/*汇报详情窗口*/}
      {curState.reportVisble && (
        <ReportDetails
          param={{
            reportId: curState.reportId,
            isVisible: curState.reportVisble,
          }}
          setvisible={(state: any) => {
            setCurState({ reportVisble: state })
          }}
        />
      )}
    </div>
  )
}

export default memo(ReportContent)

//是否能够穿透查看详情
const isRierce = (typeStr: string) => {
  const typeArr = [
    'okr_report_send', //OKR发送汇报
    'force_report_set', //强制汇报设置
    'work_report_send', //工作报告发送
    'report_send', //任务汇报发送
    'work_report_statistics', //工作报告统计
  ]
  if (!typeArr.includes(typeStr)) {
    return false
  }
  return true
}

const checkJSON = (str: any) => {
  if (typeof str == 'string') {
    try {
      const obj = JSON.parse(str)
      const tempFlag = typeof obj == 'object' && obj
      return tempFlag ? true : false
    } catch (e) {
      console.log('error：' + str + '!!!' + e)
      return false
    }
  }
}

const renderReportMsg = (msgCard: any) => {
  let buttonMsg: any = ''
  let contentMsg: any = ''
  if (msgCard.hasOwnProperty('content')) {
    const JSONMSG = checkJSON(msgCard.content) ? JSON.parse(msgCard.content) : {}
    const { bottomMessage, content } = JSONMSG
    buttonMsg = bottomMessage || ''
    contentMsg = content || ''
  }
  return {
    buttonMsg,
    contentMsg,
  }
}

const formatDat = (now: any) => {
  const d = new Date(now)
  const year = d.getFullYear() //取得4位数的年份
  const month = d.getMonth() + 1 //取得日期中的月份，其中0表示1月，11表示12月
  const date = d.getDate() //返回日期月份中的天数（1到31）
  return year + '/' + (month < 10 ? '0' + month : month) + '/' + (date < 10 ? '0' + date : date)
}

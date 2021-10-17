/**
 * @description 渲染引用消息 subtype:8
 * @module RenderQuoteMsg
 */

import { useMergeState } from '@/src/views/chat-history/ChatItem'
import { message, Modal } from 'antd'
import { Provider } from 'react-redux'
import React, { memo } from 'react'
import { approvalInfo } from './common'
import RenderApprovalDetails from '@/src/views/approval-only-detail/ApprovalDetailsOnly'
import TaskReportModel from '@/src/views/workReport/component/TaskReportModel'
import ReportDetails from '@/src/views/workReport/component/ReportDetails'
import OkrReportDetails from '@/src/views/workReport/component/okrReportDetails'
import DetailModal from '@/src/views/task/taskDetails/detailModal'

type EventPro = React.MouseEvent<HTMLDivElement, MouseEvent>
type quoteMsg = globalInterface.QuoteMsgProps
interface QuoteMsg {
  quoteMsg: globalInterface.QuoteMsgProps
}

const quoteMsgVal = (value: string) => {
  if (!value) return ''
  /* 普通消息和@消息 */
  const newCon = value
    .replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
    .replace($tools.regCharacter, '')
    .replace($tools.regEmoji, function(_: string, regStr: any) {
      const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
      return `<img class="emoji_icon" src="${imgUrl}">`
    })
  const newContdata = newCon.replace(
    $tools.regImg,
    '<span class="img_box" datasrc="$1"><img src="$1" /></span>'
  )
  return <div className="quote-val" dangerouslySetInnerHTML={{ __html: newContdata }}></div>
}

//组件入口
const RenderQuoteMsg: React.FC<any> = ({ quoteMsg }) => {
  // 获取分享详情的messageJSon
  const { messageJson } = quoteMsg || {}
  const forwardMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
  const { contentJson } = forwardMsg || {}
  const forwardDetail = $tools.isJsonString(contentJson) ? JSON.parse(contentJson) : contentJson
  //初始状态
  const [quoteState, setQuoteState] = useMergeState({
    reportDetails: { visible: false, reportId: '', isMuc: 0 }, // 报告详情
    detailHistory: { visible: false, data: {} }, // 任务详情
    okrProgressDetails: { visible: false, id: '' }, // okr进展详情
    opentaskdetail: { visible: false, id: '' }, // 显示隐藏任务详情
  })

  //打开汇报详情
  const reportHandel = (quoteMsg: quoteMsg) => {
    setQuoteState({
      detailHistory: {
        visible: true,
        data: {
          ...quoteMsg,
          disable: true,
        },
      },
    })
  }

  //打开工作报告
  const $wreportHandel = (quoteMsg: quoteMsg) => {
    setQuoteState({
      reportDetails: {
        visible: true,
        reportId: quoteMsg.id,
      },
    })
  }

  //分享的审批
  const approvalHandel = (quoteMsg: quoteMsg) => {
    approvalInfo(quoteMsg.id)
      .then(() => {
        const modal = Modal.info({
          title: '审批详情',
          style: { height: 800 },
          closable: true,
        })
        modal.update({
          title: '审批详情',
          width: '1000px',
          centered: true,
          okCancel: false,
          icon: false,
          className: 'show-approval-details',
          content: (
            <Provider store={$store}>
              <RenderApprovalDetails queryAll={false} approvalId={quoteMsg.id} />
            </Provider>
          ),
        })
      })
      .catch(err => {
        message.error(err.returnMessage || '查询失败')
      })
  }
  //跳转到任务详情
  const taskHandel = (quoteMsg: quoteMsg) => {
    setQuoteState({
      opentaskdetail: {
        visible: true,
        id: quoteMsg.id,
      },
    })
  }
  //跳转到工作规划
  const workPlanHandel = (quoteMsg: quoteMsg) => {
    $store.dispatch({
      type: 'MINDMAPDATA',
      data: {
        id: quoteMsg.id,
        typeId: quoteMsg.taskId,
        name: quoteMsg.name,
        form: 'chitchat',
        teamId: quoteMsg.teamId,
        teamName: quoteMsg.teamName,
      },
    })
    $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 })
    const { fromPlanTotype } = $store.getState()
    $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
    $tools.createWindow('workplanMind')
  }
  //跳转到okr进展详情
  const okrReportHandel = (quoteMsg: quoteMsg) => {
    setQuoteState({
      okrProgressDetails: {
        visible: true,
        id: quoteMsg.taskId,
      },
    })
  }

  /**
   *引用消息点击事件
   * @param e
   * @param quoteMsg
   */
  // 分享消息类型（工作报告1 任务2 审批3 任务汇报4 okr汇报5 规划6）
  const handelEvent = (e: EventPro, quoteMsg: quoteMsg) => {
    e.stopPropagation()
    switch (quoteMsg.type) {
      case 4:
        reportHandel(forwardDetail)
        break
      case 1:
        $wreportHandel(forwardDetail)
        break
      case 3:
        approvalHandel(forwardDetail)
        break
      case 2:
        taskHandel(forwardDetail)
        break
      case 6:
        workPlanHandel(forwardDetail)
        break
      case 5:
        okrReportHandel(forwardDetail)
        break
    }
  }

  return (
    <>
      {forwardDetail && forwardDetail.title ? (
        <div className="quote-msg">
          <div className="quote-msg-box">
            <div className="quote-title" onClick={e => handelEvent(e, forwardMsg)}>
              {'"【' + forwardDetail.title + '】'}
              <div
                className="quote-content"
                dangerouslySetInnerHTML={{ __html: forwardDetail.content + '"' }}
              ></div>
            </div>
            {quoteMsgVal(forwardDetail.val)}
          </div>
        </div>
      ) : (
        <div className="">
          <div>引用消息不存在</div>
        </div>
      )}
      {quoteState.detailHistory.visible && (
        <TaskReportModel
          param={{ ...quoteState.detailHistory, type: 1 }}
          setvisible={(state: any) => {
            setQuoteState({
              detailHistory: {
                ...quoteState.detailHistory,
                visible: state,
              },
            })
          }}
        />
      )}

      {quoteState.reportDetails.visible && (
        <ReportDetails
          param={{
            reportId: quoteState.reportDetails.reportId,
            isVisible: quoteState.reportDetails.visible,
            isMuc: 1,
          }}
          setvisible={(state: any) => {
            setQuoteState({
              reportDetails: {
                ...quoteState.reportDetails,
                visible: state,
              },
            })
          }}
        />
      )}
      {/* okr进展详情 */}
      {quoteState.okrProgressDetails.visible && (
        <OkrReportDetails
          param={{
            visible: quoteState.okrProgressDetails.visible,
            data: { taskId: quoteState.okrProgressDetails.id },
            type: 0,
          }}
          setvisible={(state: any) => {
            setQuoteState({
              okrProgressDetails: {
                ...quoteState.okrProgressDetails,
                visible: state,
              },
            })
          }}
        />
      )}
      {quoteState.opentaskdetail.visible && (
        <DetailModal
          param={{
            visible: quoteState.opentaskdetail.visible,
            from: 'chatmsg',
            id: quoteState.opentaskdetail.id,
            taskData: {},
          }}
          setvisible={(state: any) => {
            setQuoteState({ opentaskdetail: state })
          }}
        ></DetailModal>
      )}
    </>
  )
}

export default memo(RenderQuoteMsg)

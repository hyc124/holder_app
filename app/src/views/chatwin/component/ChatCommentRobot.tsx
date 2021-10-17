import React, { useState, useEffect, useCallback, useMemo, Fragment, useLayoutEffect, useRef } from 'react'
import { Checkbox, Button, message, Modal } from 'antd'
import { Provider } from 'react-redux'
import './global/ChatCommentRobot.less'
import $c from 'classnames'
import ReportDetails from '../../workReport/component/ReportDetails'
import { ApprovalcommentEditor } from '@/src/views/approval/components/ApprovalcommentEditor'
import TaskReportModel from '@/src/views/workReport/component/TaskReportModel'
import RenderApprovalDetails from '@/src/views/approval-only-detail/ApprovalDetailsOnly'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import OkrReportDetails from '@/src/views/workReport/component/okrReportDetails'
import { requestApi } from '@/src/common/js/ajax'

const CommentRobot = React.memo(({ data }: { data: any }) => {
  //是否显示回复框
  const [showReply, setShowReply] = useState(false)
  //任务汇报评论 "task_report_review"
  const [show_task_report_review, setShow_task_report_review] = useState(false)
  //工作报告评论 "work_report_send_review"
  const [show_work_report_send_review, setShow_work_report_send_review] = useState(false)
  // 审批备注评论 "approval_remarks_comment_review"
  // const [show_approval_remarks_comment_review, setShow_approval_remarks_comment_review] = useState(false)
  //任务备注评论 & 任务检查项评论 task_remarks_opinion_comment_review & task_check_comment_review
  // const [show_task, setShow_task] = useState(false)
  //OKR进展评论 "okr_progress_review"
  const [show_okr_progress_review, setShow_okr_progress_review] = useState(false)

  //任务类型 检查=4 备注 =2
  const [taskType, setTaskType] = useState<string>()
  const detailModalRef: any = useRef<any>(null)

  // 评论内容改变的数据
  const [inputValue, setInpVal] = useState('')
  //输入变化状态
  const [status, setStatus] = useState<any>()
  //获取@成员
  const [atUserIds, setAtUserIds] = useState<any>([])
  //获取添加的附件
  const [addFiles, setAddFiles] = useState<any>([])
  const [fileModelss, setfileModelss] = useState<any>([])
  //存储当前回复框的的附件UUID
  const [fileId, setFileId] = useState('')

  //评论实体
  const contentBody: any = useRef<any>({})
  useEffect(() => {
    try {
      if (data?.messageCard?.content) {
        contentBody.current = JSON.parse(data.messageCard.content)
      } else if (data?.messageCard?.noticeType === 'praised') {
        //点赞
        contentBody.current = {
          title: data.messageCard.title,
          content: data.messageCard.contentTemp,
          belongId: data.messageCard.enterpriseId,
          belongName: data.messageCard.enterpriseName,
          belongType: 2,
          typeId: data.messageCard.noticeTypeId,
          type: 1,
        }
      }
    } catch (e) {
      console.log(e)
    }
  }, [data])
  const {
    title, //标题
    messageBody, //消息体
    content, //评论的内容
    topic, //任务名 + 时间
    belongId, //企业id
    belongName, //企业名称
    belongType, //企业类型
    typeId, //事件iD
    type, //事件类型
    commentId, //评论id
    rootId, //评论根id
    sourceId, //任务id
    userId,
  } = contentBody.current

  //控制回复框显示隐藏
  const refShowReply: React.MutableRefObject<boolean> = useRef(showReply)
  useLayoutEffect(() => {
    refShowReply.current = showReply
  }, [showReply])
  const replyClick = useCallback(() => {
    setShowReply(!refShowReply.current)
  }, [])

  //更新回复框内容
  const editorRef = useRef<any>(null)
  useEffect(() => {
    setInpVal(status && editorRef.current.getEditor().current.innerHTML)
  }, [status])

  const sendComm = () => {
    const { nowUserId, nowUser, nowAccount, loginToken } = $store.getState()
    // console.log('useruserssss', nowUserId, nowUser, nowAccount)
    // console.log('senddddddd')
    // console.log('inputValueinputValue', inputValue)
    // console.log('atUserIdsatUserIdsatUserIds', atUserIds)
    // // console.log('fileModelssfileModelss', fileModelss)
    // console.log('addFilesaddFiles', addFiles)
    // console.log('fileIdfileId', fileId)
    if (inputValue === '' || inputValue === undefined) {
      message.error('您未填写评论')
      return false
    }
    const paramObjs: any = {
      typeId,
      belongId,
      belongName,
      belongType,
      content: inputValue,
      type,
      rootId: rootId,
      temporaryId: fileId,
      atUserIds: atUserIds,
      userIds: [userId],
      userNames: [],
      userId: nowUserId,
      userName: nowUser,
      userAccount: nowAccount,
    }
    if (commentId) {
      paramObjs.parentId = commentId
    }
    if (sourceId) {
      paramObjs.taskId = sourceId
    }
    requestApi({
      url: '/public/comment/addCommentMessage',
      param: paramObjs,
      successMsg: '发送成功',
      json: true,
    }).then(resData => {
      console.log(resData)
      if (resData.success) {
        replyClick()
      }
    })
  }

  //查看详情
  const showDetail = () => {
    //任务汇报：0；工作报告：1；任务备注：11；审批评论：12；检查项：13；okr进展：16
    switch (type) {
      //任务汇报评论 task_report_review
      case 0:
        setShow_task_report_review(true)
        break
      //工作报告评论 work_report_send_review
      case 1:
        setShow_work_report_send_review(true)
        break
      //审批备注评论 approval_remarks_comment_review
      case 12:
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
          okText: '知道了',
          icon: false,
          className: 'show-approval-details',
          content: (
            <Provider store={$store}>
              {/* <RenderApprovalDetails queryAll={false} approvalId={97919} /> */}
              <RenderApprovalDetails queryAll={false} approvalId={sourceId} />
            </Provider>
          ),
        })
        // setShow_approval_remarks_comment_review(true)
        break
      //任务检查项评论 task_check_comment_review
      case 13:
        setTaskType('4')
        detailModalRef &&
          detailModalRef.current.setState({
            visible: true,
            id: sourceId,
            taskType: '',
            taskData: { id: sourceId, type: 1, from: 'TaskList' },
            defaultActiveKey: taskType,
            callbackFn: () => {},
          })
        break
      //任务备注评论 task_remarks_opinion_comment_review
      case 11:
        setTaskType('2')
        detailModalRef &&
          detailModalRef.current.setState({
            visible: true,
            id: sourceId,
            taskType: '',
            taskData: { id: sourceId, type: 1, from: 'TaskList' },
            defaultActiveKey: taskType,
            callbackFn: () => {},
          })
        break
      //OKR进展评论 okr_progress_review
      case 16:
        setShow_okr_progress_review(true)
        break
      default:
        message.error(`未找到类型 ${type}`)
    }
  }

  return (
    <Fragment>
      <div className="chart_comment_robot">
        <div className="title">{title}</div>
        <div className="content">
          <div className="content_comment" dangerouslySetInnerHTML={{ __html: content }}>
            {}
          </div>
          {/* messageBody */}
          {data?.messageCard?.noticeType !== 'praised' && (
            <div className="content_source">
              {messageBody && (
                <div className="source_content" dangerouslySetInnerHTML={{ __html: messageBody }}>
                  {}
                </div>
              )}
              {/* {timeInside && <div className="source_time">{`【${taskName} ${timeInside}】`}</div>} */}
            </div>
          )}

          {topic && <div className="source_time_out">{topic}</div>}
          <div className="footer">{belongName}</div>
          <div className="btnList">
            <div className="detailBtn" onClick={showDetail}>
              查看详情
            </div>
            {data?.messageCard?.noticeType !== 'praised' && (
              <div className={$c('replyBtn', { showReply })} onClick={replyClick}>
                {showReply ? '取消回复' : '回复'}
              </div>
            )}
          </div>

          {showReply && (
            <div className="reply_wrap">
              <div className="edit_wrap">
                <ApprovalcommentEditor
                  ref={editorRef}
                  param={{
                    wrapClass: 'editer',
                    sourceType: 'synergyMain',
                    currentType: 'replayRepoert',
                    handleBtnShow: true,
                    replay: { replayTip: '请在此处回复' },
                    teamId: belongId,
                    // teamId: 244,
                    setFileList: ({ fileItem, imgUrl }: any) => {},
                    delCommentTxt: () => {},
                    compCommentHight: () => {},
                    setStatus,
                    atUserIds,
                    addFiles,
                    setAtUserIds,
                    setAddFiles,
                    fileModelss,
                    getFileId: (uuid: string) => setFileId(uuid),
                  }}
                />
              </div>
              <div className="edit_footer">
                <Button className="sendBtn" onClick={sendComm}>
                  发送
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 工作报告评论 */}
      {show_work_report_send_review && (
        <ReportDetails
          param={{ reportId: typeId, isVisible: show_work_report_send_review }}
          setvisible={(state: any) => setShow_work_report_send_review(state)}
        />
      )}

      {/* 任务汇报评论 */}
      {show_task_report_review && (
        <TaskReportModel
          param={{
            visible: show_task_report_review,
            data: { taskId: sourceId },
            type: 1,
          }}
          setvisible={(state: any) => {
            setShow_task_report_review(state)
          }}
        />
      )}
      {/* 任务备注评论 & 任务检查项评论 */}
      <DetailModal
        ref={detailModalRef}
        param={{
          from: 'TaskList',
          defaultActiveKey: taskType,
        }}
        setActiveKey={(key: any) => {
          setTaskType(key)
        }}
      />
      {/* OKR进展评论 */}
      {show_okr_progress_review && (
        <OkrReportDetails
          param={{
            visible: show_okr_progress_review,
            data: { taskId: sourceId },
            type: 0,
          }}
          setvisible={(state: any) => {
            setShow_okr_progress_review(state)
          }}
        />
      )}
    </Fragment>
  )
})

export default CommentRobot

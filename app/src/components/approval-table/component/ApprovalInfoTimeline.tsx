import React, { useEffect, useState, useRef } from 'react'
import { Timeline, Avatar, message, Tooltip, Button } from 'antd'
import { commitComment } from '../getData/getData'
import { RenderFileList } from '@/src/views/mettingManage/component/RenderUplodFile'
import { ApprovalcommentEditor } from '@/src/views/approval/components/ApprovalcommentEditor'
import SetCommentList from './SetCommentList'
import { getExpend, getProvideStatus } from '../getData/approvalHandle'

/**
 * 审批流程信息（支持回复）
 */
const fileModelss: any = []
const ApprovalInfoTimeline = ({ item, sendInfo, disabled, noticeUsers }: any) => {
  //获取@成员
  const [atUserIds, setAtUserIds] = useState<any>([])
  //获取添加的附件
  const [addFiles, setAddFiles] = useState<any>([])
  const { nowUser, nowUserId, nowAccount } = $store.getState()
  //是否回复
  const [showNewComment, setShowNewComment] = useState(false)
  //获取状态
  const statusInfo = getProvideStatus(item.status, sendInfo.activitiProcessId)
  //存储当前回复框的的附件UUID
  const [fileId, setFileId] = useState('')
  //点击回复
  const addNewComment = () => {
    setAtUserIds([])
    setAddFiles([])
    setStatus('')
    if (jQuery('.provide-user .ApprovalcommentEditor').length <= 0) {
      setTimeout(() => {
        jQuery('.commentMsgEditor').attr('data-beforeData', ' 回复 ' + item.username + ' : ')
      }, 100)
      setShowNewComment(true)
    }
  }

  //取消回复
  const cancelComment = () => {
    setShowNewComment(false)
  }

  const editorRef = useRef<any>()
  const [msgTxtRef, setMsgTxtRef] = useState<any>(null)
  //输入变化状态
  const [status, setStatus] = useState<any>()

  useEffect(() => {
    if (showNewComment) {
      setMsgTxtRef(editorRef.current.getEditor())
    }
  }, [status])
  // 是否回复状态
  const [replay, setReplay] = useState<any>({ replayTip: '' })

  //确定回复
  const sureSendComment = (item: { userId: number; username: string; processId: number }, fileId: string) => {
    if (msgTxtRef) {
      if (status == '' && atUserIds.length == 0 && addFiles.length == 0) {
        setShowNewComment(false)
        return
      }
      //判断要不要at自己
      let str = msgTxtRef.current ? msgTxtRef.current.innerHTML : ''
      str = str
      let sear = new RegExp('Myself')
      sear = sear
      if (sear.test(str)) {
        atUserIds.push(item.userId)
      }
      const userIds = [item.userId]
      const userNames = [item.username]
      const param: any = {
        userId: nowUserId,
        userName: nowUser,
        userAccount: nowAccount,
        content: status == '' ? '' : msgTxtRef.current ? msgTxtRef.current.innerHTML : '',
        type: 12,
        belongId: sendInfo.teamId,
        belongName: sendInfo.teamName,
        belongType: sendInfo.ascriptionType,
        typeId: item.processId,
        userIds: userIds,
        userNames: userNames,
        atUserIds: atUserIds,
        fileDetailModels: addFiles,
        taskId: sendInfo.id, //审批id
      }
      if (fileId) {
        param.temporaryId = fileId
      }
      commitComment(param)
        .then(() => {
          message.success('评论成功!')
          setShowNewComment(false)
          $store.dispatch({ type: 'SET_GETDETAILS', data: '' })
        })
        .catch(err => {
          message.error(err.returnMessage)
        })
    }
  }

  return (
    <Timeline.Item className="provide-item" color={statusInfo.color}>
      <div className="provide-content-top">
        <Avatar className="oa-avatar" src={item.userProfile}>
          {item.userId == -1 && !item.username ? '理员' : item.username?.substr(-2, 2)}
        </Avatar>
        <div className="provide-header">
          <div className="time-span">
            <div className="time-and-read">
              {item.time && item.time !== '' && <span>{item.time}</span>}
              {item.time === '' && item.spendTime && (
                <span className="wait-time">{getExpend(item.spendTime)}</span>
              )}
              {item.status === 0 && item.isRead === 0 && <em className="status-icon">未读</em>}
              {item.status === 0 && item.isRead === 1 && <em className="status-icon">已读</em>}
            </div>
            {item.status !== 20 && (
              <em className="status-icon" style={{ borderColor: statusInfo.color, color: statusInfo.color }}>
                {statusInfo.txt}
              </em>
            )}
          </div>
          <div className="provide-user">
            {item.username}
            {!disabled && (
              <span
                className="comment-provide"
                onClick={e => {
                  e.preventDefault()
                  addNewComment()
                }}
              >
                回复
              </span>
            )}
          </div>
        </div>
      </div>
      {(item.reason || item.fileReturnModels?.length > 0) && (
        <div className="provide-detail">
          <div dangerouslySetInnerHTML={{ __html: item.reason == '[附件]' ? '' : item.reason }}></div>
          <div>
            {item.fileReturnModels && item.fileReturnModels !== '' && (
              <RenderFileList list={item.fileReturnModels || []} isApproval={true} />
            )}
          </div>
        </div>
      )}
      {showNewComment && (
        <div className="new-comment-box">
          <div className="provide-header">
            <div className="time-span">
              <span>{$tools.getMyDate()}</span>
            </div>
            <div className="provide-user">
              <ApprovalcommentEditor
                ref={editorRef}
                param={{
                  sourceType: 'synergyMain',
                  currentType: 'replaytrail',
                  handleBtnShow: true,
                  replay,
                  teamId: sendInfo.teamId,
                  setFileList: ({ fileItem, imgUrl }: any) => {},
                  delCommentTxt: () => {},
                  compCommentHight: () => {},
                  setStatus,
                  atUserIds,
                  addFiles,
                  setAtUserIds,
                  setAddFiles,
                  fileModelss,
                  item,
                  getFileId: (uuid: any) => {
                    setFileId(uuid)
                  },
                }}
              />
              <div className="comment-btns">
                <Tooltip title="确定">
                  <Button
                    shape="circle"
                    className="sure-btn"
                    onClick={(e: any) => {
                      const $uuid =
                        jQuery(e.target)
                          .parents('.provide-user')
                          .find('div.commentEditorBox')
                          .attr('data-uuid') || ''
                      sureSendComment(item, fileId)
                    }}
                  ></Button>
                </Tooltip>
                <Tooltip title="取消">
                  <Button shape="circle" className="cancel-btn" onClick={cancelComment}></Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      )}
      {item.messageModel &&
        item.messageModel.length !== 0 &&
        item.messageModel.map((idx: any, index: any) => (
          <SetCommentList
            key={index}
            item={idx}
            disabled={disabled}
            sendInfo={sendInfo}
            processId={item.processId}
            rootId={idx.id}
            parentId={idx.id}
            profile={idx.userProfile}
            parentName={item.username}
          />
        ))}
    </Timeline.Item>
  )
}

export default ApprovalInfoTimeline

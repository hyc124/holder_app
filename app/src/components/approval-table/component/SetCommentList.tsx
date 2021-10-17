import React, { useEffect, useState, useRef } from 'react'
import { commitComment } from '../getData/getData'
import { message, Tooltip, Button } from 'antd'
import { RenderFileList } from '@/src/views/mettingManage/component/RenderUplodFile'
import { ApprovalcommentEditor } from '@/src/views/approval/components/ApprovalcommentEditor'

const fileModelss: any = []
//展示审批流程评论子回复
const SetCommentList = ({
  item,
  sendInfo,
  parentName,
  parentId,
  rootId,
  processId,
  disabled,
  profile,
}: {
  item: any
  sendInfo: any
  parentId: any
  rootId: any
  processId: any
  parentName: string
  disabled: boolean
  profile: any
}) => {
  const { nowUser, nowUserId, nowAccount, userInfo } = $store.getState()
  //是否回复
  const [showCommentChild, setShowCommentChild] = useState(false)
  //输入框内容控制
  const [inputVal, setInputVal] = useState('')

  const editorReplyRef = useRef<any>()
  const [msgTxtRef, setMsgTxtRef] = useState<any>(null)
  //输入变化状态
  const [status, setStatus] = useState<any>()
  //获取@成员
  const [atUserIds, setAtUserIds] = useState<any>([])
  //获取添加的附件
  const [addFiles, setAddFiles] = useState<any>([])
  //存储当前回复框的的附件UUID
  const [fileId, setFileId] = useState('')
  useEffect(() => {
    if (showCommentChild) {
      setMsgTxtRef(editorReplyRef.current.getEditor())
    }
  }, [status])
  // 是否回复状态
  // let editMarkMsgRef: any = null
  const [replay, setReplay] = useState<any>({ replayTip: '' })
  //受控输入
  const changeCommentVal = (e: any) => {
    setInputVal(e.target.value)
  }

  //点击回复
  const addNewComment = () => {
    setAtUserIds([])
    setAddFiles([])
    setStatus('')
    if (jQuery('.provide-user .ApprovalcommentEditor').length <= 0) {
      setTimeout(() => {
        jQuery('.commentMsgEditor').attr('data-beforeData', ' 回复 ' + item.username + ' : ')
      }, 100)
      setShowCommentChild(true)
    }
  }

  //取消回复
  const cancelComment = () => {
    setShowCommentChild(false)
  }

  //确定回复
  const sureSendComment = (fileId: string) => {
    if (msgTxtRef) {
      if (status == '' && atUserIds.length == 0 && addFiles.length == 0) {
        setShowCommentChild(false)
        return
      }
      //判断
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
        typeId: processId,
        userIds: userIds,
        userNames: userNames,
        parentId: parentId,
        rootId: rootId,
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
          setShowCommentChild(false)
          $store.dispatch({ type: 'SET_GETDETAILS', data: '' })
        })
        .catch(err => {
          message.error(err.returnMessage)
        })
    }
  }
  return (
    <>
      <div className="provide-content-top" style={{ margin: '7px 0 0 50px' }}>
        <div className="provide-header" style={{ height: '35px' }}>
          <div className="provide-user">
            {item.username} <em style={{ color: '#9a9aa2', fontStyle: 'normal' }}>回复</em> {parentName}{' '}
            <div
              className="time-span"
              style={{ color: '#9a9aa2', display: 'inline-block', margin: '0 0 0 7px' }}
            >
              <span>{item.createTime}</span>
            </div>
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
      <div className="provide-detail" style={{ margin: '0 0 0 50px', width: 'calc(100% - 50px)' }}>
        <div dangerouslySetInnerHTML={{ __html: item.content == '[附件]' ? '' : item.content }}></div>
        {/* <div>{item.files && item.files !== '' && <FileList list={item.files} />}</div> */}
        <div>
          {item.fileReturnModels && item.fileReturnModels !== '' && (
            <RenderFileList list={item.fileReturnModels || []} isApproval={true} />
          )}
        </div>
      </div>
      {showCommentChild && (
        <div className="new-comment-box" style={{ margin: '0 0 0 50px', width: 'calc(100% - 50px)' }}>
          <div className="provide-header">
            <div className="time-span">
              <span>{$tools.getMyDate()}</span>
            </div>
            <div className="provide-user">
              <ApprovalcommentEditor
                ref={editorReplyRef}
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
                      // const $uuid =
                      //   jQuery(e?.target)
                      //     .parents('.provide-user')
                      //     .find('div.commentEditorBox')
                      //     .attr('data-uuid') || ''
                      sureSendComment(fileId)
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
      {item.childComments &&
        item.childComments.length !== 0 &&
        item.childComments.map((idx: any, index: number) => (
          <SetCommentList
            key={index}
            item={idx}
            disabled={disabled}
            sendInfo={sendInfo}
            processId={processId}
            rootId={rootId}
            parentId={idx.id}
            profile={idx.userProfile}
            parentName={item.username}
          />
        ))}
    </>
  )
}

export default SetCommentList

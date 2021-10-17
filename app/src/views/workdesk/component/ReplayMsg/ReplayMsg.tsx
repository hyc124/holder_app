/**快速评论组件**/
import React, { useEffect, useRef, useState } from 'react'
import { message, Modal, Avatar, Input } from 'antd'
import { quickComment, findCommentIsExist, commentToAtMe, dealHandle } from '../../getData'
import { AnyAction } from 'redux'
import { findProfileApi } from '@/src/common/js/api-com'
import { refreshPage } from '../../TaskListData'
import { ipcRenderer } from 'electron'
import './ReplayMsg.less'
import { ApprovalcommentEditor } from '@/src/views/approval/components/ApprovalcommentEditor'
// import { htmlDecodeByRegExp } from '@/core/tools'

interface ParamsProps {
  type: number
  typeId: number
  content: string
  userId: number
  userAccount: string
  userName: string
  parentId: number
  mucId?: number
  teamId?: number
  teamName?: string
}
interface ReplayMsgProps {
  setVisble: (flag: boolean) => void
  params: {
    item: any
    type: number //1回复 0已知晓
    isIn?: string //入口
  }
  callback: (params: any) => void //刷新回调
  commentId: number
}

//<ReplayMsg params={} callback={ ok}/>
const ReplayMsg = (props: ReplayMsgProps) => {
  const { item, type, isIn } = props.params
  const { nowUser, nowAccount, nowUserId } = $store.getState()
  const [visible, setModal1Visible] = useState(false)
  //回复框需要回显的信息
  const [showUser, setShowUser] = useState<any>([])
  //存储回复框输入框信息
  const [rValue, setRvalue] = useState('')
  const [itemId, setItemId] = useState(0)
  const [noticeTypeId, setNoticeTypeId] = useState(0)
  const editorRef = useRef<any>(null)
  const [replay, setReplay] = useState<any>({ replayTip: '请输入内容：' })
  //获取@成员
  const [atUserIds, setAtUserIds] = useState<any>([])
  //获取添加的附件
  const [addFiles, setAddFiles] = useState<any>([])
  const [fileModelss, setfileModelss] = useState<any>([])
  //输入变化状态
  const [status, setStatus] = useState<any>()
  //存储当前回复框的的附件UUID
  const [fileId, setFileId] = useState('')
  // 控制富文本显示隐藏
  const [contrlEdit, setContrlEdit] = useState(false)
  useEffect(() => {
    commentAtMeInfo(type, item)
  }, [item])
  // }, [])

  //回复，已知晓接口请求
  const commentAtMeInfo = (type: number, infoObj: any) => {
    setNoticeTypeId(infoObj.noticeTypeId)
    setRvalue('')
    //备注不存在
    if (
      (infoObj.noticeType == 'remarks_opinion_comment_at_me' ||
        infoObj.noticeType == 'remarks_opinion_at_me') &&
      infoObj.flag == 1
    ) {
      message.error('数据不存在')
      props.callback({
        tips: '数据不存在',
        rowId: infoObj.id,
        noticeTypeId: noticeTypeId,
      })
      return
    }
    const noticeType = infoObj.noticeType
    let sendTypeId = infoObj.noticeTypeId
    const spareId = infoObj.spareId
    const commentCont = '好，已知晓'
    let sendType = 0
    let _parentId = infoObj.commentId
    if (noticeType == 'task_talk_at_push') {
      sendType = 5
      sendTypeId = spareId
    } else if (noticeType == 'remarks_opinion_at_me' || noticeType == 'remarks_opinion_comment_at_me') {
      sendType = 11
    } else if (noticeType == 'check_comment_at_me') {
      sendType = 13
      sendTypeId = infoObj.noticeTypeId
    } else if (noticeType == 'approval_remarks_at_me' || noticeType == 'approval_remarks_comment_at_me') {
      sendType = 12
    } else if (noticeType == 'work_report_at_me' || noticeType == 'work_report_comment_at_me') {
      sendType = 1
    } else if (noticeType == 'task_report_at_me' || noticeType == 'task_report_comment_at_me') {
      sendType = 0
    }

    if (noticeType == 'remarks_opinion_at_me') {
      _parentId = ''
    }
    const param: ParamsProps = {
      type: sendType,
      typeId: sendTypeId,
      content: commentCont,
      userId: nowUserId,
      userAccount: nowAccount,
      userName: nowUser,
      parentId: _parentId,
    }
    if (noticeType == 'task_talk_at_push') {
      param.mucId = infoObj.noticeTypeId
    }
    // console.log(type, infoObj)
    if (type == 0) {
      //我已知晓快速发送回复
      if (noticeType == 'task_talk_at_push') {
        quickComments(param, infoObj.id)
      } else {
        param.teamId = infoObj.teamId
        param.teamName = infoObj.teamName
        addCommentToAtMe(param, infoObj.id)
      }
    } else {
      if (infoObj.commentId) {
        findCommentIsExist(infoObj.commentId).then((val: any) => {
          if (val == 1) {
            //评论不存在
            message.error('数据不存在')
            props.callback({
              tips: '数据不存在',
              rowId: infoObj.id,
              noticeTypeId: noticeTypeId,
            })
          } else {
            //查询快速评论内容
            getQuickCommentContent(param, infoObj)
          }
        })
      } else {
        //查询快速评论内容
        getQuickCommentContent(param, infoObj)
      }
    }
  }
  // 聊天回复
  const quickComments = (param: any, parentId: number) => {
    const params = {
      userId: nowUserId, //事件名称
      // timestamp: isIn === 'HandleMessage' ? param.typeId : param.spareId, //通知的内容
      timestamp: param.typeId ? param.typeId : param.spareId,
    }
    dealHandle(params).then(() => {
      refreshPage && refreshPage()
      props.callback({
        tips: '回复成功',
        rowId: parentId,
        noticeTypeId: noticeTypeId,
      })
      ipcRenderer.send('IS_KNOW_TIME_STAMP', params.timestamp)
    })
  }
  //添加@我的评论回复
  const addCommentToAtMe = (param: ParamsProps, parentId: number) => {
    // console.log(param)
    commentToAtMe(param).then(
      (data: any) => {
        if (data.returnCode == 0) {
          setContrlEdit(false)
          message.success('回复成功')
          props.callback({
            tips: '回复成功',
            rowId: parentId,
            noticeTypeId: noticeTypeId,
          })
          refreshPage && refreshPage()
          // 刷新 ipc.send('ref_task_desk', [`desk-${tabObj.atMe}`])
          // ipcRenderer.send('update_unread_num') //更新工作台数量
        } else {
          props.callback({
            tips: '数据不存在',
            rowId: parentId,
            noticeTypeId: noticeTypeId,
          })
        }
      },
      data => {
        refreshPage && refreshPage()
        message.error(data.returnMessage)
        props.callback({
          tips: '数据不存在',
          rowId: parentId,
          noticeTypeId: noticeTypeId,
        })
      }
    )
  }
  /**
   * 查询快速评论内容
   */
  const getQuickCommentContent = (sendParam: ParamsProps, infoObj: any) => {
    setItemId(infoObj.id)
    let typeId = infoObj.noticeTypeId
    if (infoObj.noticeType == 'task_talk_at_push') {
      typeId = infoObj.spareId
    } else if (
      infoObj.noticeType == 'remarks_opinion_comment_at_me' ||
      infoObj.noticeType == 'check_comment_at_me' ||
      infoObj.noticeType == 'approval_remarks_comment_at_me'
    ) {
      typeId = infoObj.commentId
    }

    quickComment({
      type: infoObj.noticeType,
      typeId: typeId,
      content: infoObj.content,
    }).then(
      (data: any) => {
        if (data.returnCode == 0) {
          let showUser = data.data && data.data.userName != null ? data.data.userName.substr(-2, 2) : '未知'
          let _profile = ''
          let showContent =
            data.data.content
              .replace(/<[^>]+>/g, '')
              .replace(/\[bq_(\w+)\]/gi, '[表情]')
              .replace(/&nbsp;/gi, '') || ''
          if (infoObj.noticeType == 'task_talk_at_push') {
            showContent = JSON.parse($tools.htmlDecodeByRegExp(data.data.content))
              .message.replace(/<[^>]+>/g, '')
              .replace(/\[bq_(\w+)\]/gi, '[表情]')
            _profile = JSON.parse($tools.htmlDecodeByRegExp(data.data.content)).profile
            showUser = JSON.parse($tools.htmlDecodeByRegExp(data.data.content)).from.substr(-2, 2)
            setShowUser([showUser, showContent, infoObj.source, sendParam, _profile])
            setModal1Visible(true)
          } else if (
            infoObj.noticeType == 'remarks_opinion_at_me' ||
            infoObj.noticeType == 'remarks_opinion_comment_at_me' ||
            infoObj.noticeType == 'check_comment_at_me' ||
            infoObj.noticeType == 'task_report_at_me' ||
            infoObj.noticeType == 'task_report_comment_at_me' ||
            infoObj.noticeType == 'approval_remarks_at_me' ||
            infoObj.noticeType == 'approval_remarks_comment_at_me' ||
            infoObj.noticeType == 'work_report_at_me' ||
            infoObj.noticeType == 'work_report_comment_at_me'
          ) {
            const userIds: any = [data.data.userId]
            // 根据id查询头像
            findProfileApi({ userIds }).then((res: any) => {
              const profiles = res.data.data || {}
              for (const key in profiles) {
                if (Number(key) === data.data.userId) {
                  _profile = profiles[key]
                  setShowUser([showUser, showContent, infoObj.source, sendParam, _profile])
                  setModal1Visible(true)
                  break
                }
              }
            })
          }
        } else {
          message.error('数据库异常')
          props.callback({
            tips: '数据库异常',
            rowId: infoObj.id,
            noticeTypeId: noticeTypeId,
          })
        }
      },
      () => {
        message.error('数据库异常')
      }
    )
  }
  //确认回复
  const replyMadalOk = () => {
    if (contrlEdit && editorRef.current.getEditor().current.innerHTML == '') {
      // 工作报告@
      return message.error('请输入回复内容！')
    } else if (!contrlEdit && rValue == '') {
      return message.error('请输入回复内容！')
    }

    showUser[3].content = rValue
    if (contrlEdit) {
      // 工作报告@回复
      showUser[3].content = editorRef.current.getEditor().current.innerHTML
      showUser[3].temporaryId = fileId
      showUser[3].teamId = item.teamId
      showUser[3].atUserIds = atUserIds
    }
    //自定义回复
    // console.log(showUser[3], itemId)
    addCommentToAtMe(showUser[3], itemId)
    setModal1Visible(false)
  }
  return (
    <Modal
      className={`quick_replay_module ${contrlEdit ? 'h_500' : ''}`}
      title="快捷回复"
      centered
      visible={visible}
      closable={false}
      maskClosable={false}
      onOk={() => replyMadalOk()}
      onCancel={() => {
        props.setVisble(false)
        setContrlEdit(false)
      }}
      width={400}
      bodyStyle={{ padding: contrlEdit ? '20px 20px 0' : '20px', height: contrlEdit ? '' : '192px' }}
    >
      <div className="reply_modal">
        <div style={{ display: 'flex', height: contrlEdit ? '100px' : '121px', marginBottom: '6px' }}>
          <Avatar className="oa-avatar" src={showUser[4]} size={34}>
            {showUser[0] && showUser[0].substr(-2, 2)}
          </Avatar>
          {console.log(showUser)}
          <div style={{ paddingTop: '8px' }}>
            <div style={{ maxHeight: '94px', overflow: 'auto' }}>{showUser[1]}</div>
            <div style={{ textAlign: 'center', color: '#9A9AA2', display: 'none' }} className="push_content">
              {showUser[2]}
            </div>
          </div>
        </div>
        {(item.noticeType == 'work_report_at_me' ||
          item.noticeType == 'work_report_comment_at_me' ||
          item.noticeType == 'approval_remarks_at_me' ||
          item.noticeType == 'task_report_at_me' ||
          item.noticeType == 'task_report_comment_at_me' ||
          item.noticeType == 'check_comment_at_me' ||
          item.noticeType == 'remarks_opinion_comment_at_me' ||
          item.noticeType == 'remarks_opinion_at_me' ||
          item.noticeType == 'approval_remarks_at_me' ||
          item.noticeType == 'approval_remarks_comment_at_me') && (
          <div>
            {!contrlEdit && (
              <div
                className="reply_modal_bottom setBorder"
                onClick={() => {
                  setContrlEdit(true)
                }}
              >
                请输入内容：
                {/* <Input placeholder="请输入内容：" value={rValue} onChange={e => setRvalue(e.target.value)} /> */}
              </div>
            )}
            {contrlEdit && (
              <div className="editorBox reply_modal_msgBox">
                <ApprovalcommentEditor
                  ref={editorRef}
                  param={{
                    sourceType: 'synergyMain',
                    currentType: 'replayRepoert',
                    handleBtnShow: true,
                    replay,
                    teamId: item.teamId,
                    setFileList: ({ fileItem, imgUrl }: any) => {},
                    delCommentTxt: () => {},
                    compCommentHight: () => {},
                    setStatus,
                    atUserIds,
                    addFiles,
                    setAtUserIds,
                    setAddFiles,
                    fileModelss,
                    // item: '',
                    getFileId: (uuid: any) => {
                      setFileId(uuid)
                    },
                  }}
                />
              </div>
            )}
          </div>
        )}
        {item.noticeType != 'work_report_at_me' ||
          item.noticeType != 'work_report_comment_at_me' ||
          ((item.noticeType != 'task_report_at_me' || item.noticeType != 'task_report_comment_at_me') && (
            <div className="reply_modal_bottom">
              <Input placeholder="请填写回复内容" value={rValue} onChange={e => setRvalue(e.target.value)} />
            </div>
          ))}
      </div>
    </Modal>
  )
}

export default ReplayMsg

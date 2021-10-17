import { useEffect, useState, useRef } from 'react'
import React from 'react'
import { Select, Input, Button, message } from 'antd'
import { requestApi } from '@/src/common/js/ajax'
import Editor from '@/src/components/editor/index'
import { useSelector } from 'react-redux'
import { ApprovalcommentEditor } from '../../approval/components/ApprovalcommentEditor'
import { ipcRenderer } from 'electron'
// import Animation from './animation'

// import animationData from './animation.json'

interface ParamOb {
  userId?: number //评论人id
  userName?: string //评论人姓名
  userAccount?: string //评论人账号
  content?: string //评论内容
  typeId: number //评论主题id
  type?: number //评论主题类型 0任务汇报 1工作报告 2制度
  parentId?: number //评论父id
  rootId?: number //根评论id
  userIds?: [] //需要发通知的用户id集合
  userNames?: [] //需要发通知的账号集合
  belongId?: number //归属id
  belongName?: string //归属名称
  belongType?: number //归属类型
  pushContent?: string //推送内容
  noticeType?: any
}

const SendComment = ({
  sendComments,
  paramObj,
  thumParam,
  commentShow, //监听是否点击回复
  setVisibleShow, //关闭时状态回传（用来控制评论框显示与隐藏）
  noticeType, //当前类型
  thumList, //点赞人数
}: {
  sendComments: (value: any) => void
  paramObj: ParamOb
  thumParam: any
  commentShow: any
  setVisibleShow: any
  noticeType?: any
  thumList: any
}) => {
  const { nowUser, nowUserId } = $store.getState()
  // 评论内容改变的数据
  const [inputValue, setInpVal] = useState('')
  // 控制富文本显示隐藏
  const [contrlEdit, setContrlEdit] = useState(false)
  //
  $store.getState().fromPlanTotype.createType === 1
  const contrlEditRootId = useSelector((store: any) => store.workRpoertListComment.workRpoertListCommRootId)
  const contrlEditParentId = useSelector((store: any) => store.workRpoertListComment.workRpoertListCommParentId)
  const contrlEditPlace = useSelector((state: any) => state.workRpoertListComment.workRpoertListCommName)
  const contrlEditUserId = useSelector((state: any) => state.workRpoertListComment.workRpoertListCommUserId)

  // const { contrlEditRootId, contrlEditParentId, contrlEditPlace, contrlEditUserId } = useSelector(
  //   (store: StoreStates) => store.workRpoertListComment
  // )
  //   点赞还是取消点赞
  // const isthum = useSelector((store: StoreStates) => store.workRpoertListComment.workRpoertListIsThum)
  const [active, setActive] = useState(false)
  const editorRef = useRef<any>(null)
  const [replay, setReplay] = useState<any>({ replayTip: '给Ta评论' })
  //输入变化状态
  const [status, setStatus] = useState<any>()
  //获取@成员
  const [atUserIds, setAtUserIds] = useState<any>([])
  //获取添加的附件
  const [addFiles, setAddFiles] = useState<any>([])
  const [fileModelss, setfileModelss] = useState<any>([])
  //存储当前回复框的的附件UUID
  const [fileId, setFileId] = useState('')
  // const [thumAnimation, setThumAnimation] = useState(false)

  useEffect(() => {
    if (commentShow.visible) {
      setContrlEdit(true)
      setAddFiles([])
      setScrollHeight()
    }
  }, [commentShow])
  useEffect(() => {
    if (thumList.length > 0) {
      const _newArr = thumList.filter((item: any) => item.userId === nowUserId)
      if (_newArr.length > 0) {
        setActive(true)
      } else {
        setActive(false)
      }
    } else {
      setActive(false)
    }
  }, [thumList])
  useEffect(() => {
    setInpVal(status && editorRef.current.getEditor().current.innerHTML)
  }, [status])

  useEffect(() => {
    if (contrlEditPlace !== '' && contrlEditPlace != undefined) {
      setReplay({ replayTip: contrlEditPlace === '' ? '给Ta评论' : '回复 ' + contrlEditPlace + ':' })
      setScrollHeight()
      setContrlEdit(true)
    }
  }, [contrlEditPlace])
  const sendComm = () => {
    if (inputValue === '' || inputValue === undefined) {
      message.error('您未填写评论')
      return false
    }
    const paramObjs = {
      ...paramObj,
      content: inputValue,
      parentId: contrlEditParentId,
      rootId: contrlEditRootId,
      temporaryId: fileId,
      atUserIds: atUserIds,
      userIds: contrlEditUserId && contrlEditUserId != nowUserId ? [contrlEditUserId] : [],
    }
    requestApi({
      url: '/public/comment/addCommentMessage',
      param: paramObjs,
      successMsg: '发送成功',
      json: true,
    }).then(resData => {
      if (resData.success) {
        sendComments({ type: 'queryComment', param: paramObj })
        setInpVal('')
        setContrlEdit(false)
        setAddFiles([])
        setAtUserIds([])
        setVisibleShow(false)
        $('#printDataBox').removeClass('pb_120')
        $('.set_comment_box .opinion-area').css('padding-bottom', '90px')
        ipcRenderer.send('update_unread_num', [noticeType])
      }
    })
  }

  //  点赞or取消点赞
  const isThumbs = () => {
    let api = '/public/thumbsUp/cancelThumbsUp'
    let txt = '已取消点赞'
    let param: any = {
      type: 'work_report',
      typeId: paramObj.typeId,
      userId: nowUserId,
    }
    if (!active) {
      //取消点赞
      api = '/public/thumbsUp/addThumbsUp'
      txt = '已点赞'
      param = {
        belongId: paramObj.belongId,
        belongName: paramObj.belongName,
        content: thumParam.content,
        likedUserId: thumParam.userId,
        type: 'work_report',
        typeId: paramObj.typeId,
        typeTime: thumParam.typeTime,
        userId: nowUserId,
        userName: nowUser,
      }
      setActive(false)
    }
    if (active && nowUserId === thumParam.userId) {
      message.error('无法给自己点赞')
      return false
    }
    // setThumAnimation(true)
    requestApi({
      url: api,
      param: param,
      successMsg: txt,
      json: !active,
    }).then((data: any) => {
      if (data.data.returnCode === 0) {
        $store.dispatch({
          type: 'WORK_REPORT_LIST_COMMENT',
          data: { workRpoertListIsThum: !active },
        })
        // 查询点赞人员
        sendComments({ type: 'queryUser', typeId: paramObj.typeId })
        setActive(true)
      }
    })
  }

  const setInputValue = (e: any) => {
    setInpVal(e)
  }

  const setScrollHeight = () => {
    $('#printDataBox').addClass('pb_120')
    const _height: any = $('#printDataBox').height()
    $('#printDataBox').scrollTop(_height)
  }
  return (
    <div className="commentBox">
      {!contrlEdit && (
        <div
          className="inpVal"
          onClick={() => {
            setScrollHeight()
            $store.dispatch({
              type: 'WORK_REPORT_LIST_COMMENT',
              data: {
                workRpoertListCommRootId: '',
                workRpoertListCommName: '',
                workRpoertListCommUserId: thumParam.userId,
              },
            })
            setContrlEdit(true)
            setReplay({ replayTip: '给Ta评论' })
          }}
        >
          给Ta评论
        </div>
      )}
      {contrlEdit && (
        <div className="editorBox sendCommenteditorBox">
          {/* <Editor
            placeholder={contrlEditPlace === '' ? '给Ta评论' : '@' + contrlEditPlace}
            editorContent={inputValue}
            editorChange={setInputValue}
            className="commentEditor"
            previewArea=".commentEditor"
          /> */}
          <ApprovalcommentEditor
            ref={editorRef}
            param={{
              sourceType: 'synergyMain',
              currentType: 'replayRepoert',
              handleBtnShow: true,
              replay,
              teamId: paramObj.belongId,
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
          <div className="btn_box">
            <Button
              className="cancleBtn"
              onClick={() => {
                setContrlEdit(false)
                setAddFiles([])
                setVisibleShow(false)
                $('#printDataBox').removeClass('pb_120')
              }}
            >
              取消
            </Button>
            <Button className="sendBtn" onClick={sendComm}>
              发送
            </Button>
          </div>
        </div>
      )}

      <span className={`support_icon_byId ${active ? 'support_is' : 'support_not'}`} onClick={isThumbs}></span>
    </div>
  )
}
export default SendComment

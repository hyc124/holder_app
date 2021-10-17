/**
 * 评论列表最外层
 */
import React, { useState, useEffect, useRef } from 'react'
import { message } from 'antd'
import { CommentEditor } from './commentEditor'
import { findRepeat } from '@/src/common/js/common'
import { addMarksApi, addCommentApi } from '../taskComApi'
import * as Maths from '@/src/common/js/math'
export const CommentOut = ({ param }: { param: any }) => {
  const {
    taskId,
    cycleMNum,
    ascriptionId,
    ascriptionName,
    showeditor,
    replay,
    refreshTheme,
    changeShoweditor,
  } = param
  const [InputHide, setInputHide] = useState<any>({
    opinionId: '',
    visible: showeditor,
  })
  // 是否回复状态
  //   const [replay, setReplay] = useState<any>({ replayTip: '' })
  let markFileList: any = []
  // 协同备注
  const editorRef = useRef<any>(null)
  const [msgTxtRef, setMsgTxtRef] = useState<any>(null)
  const [pageUuid, setPageUuid] = useState<string>('')
  useEffect(() => {
    if (showeditor == true) {
      blankClick()
      setInputHide({ ...InputHide, visible: true })
      setMsgTxtRef(editorRef.current.getEditor())
      setPageUuid(Maths.uuid())
    }
  }, [showeditor])
  /**
   * 点空白处隐藏
   */
  const blankClick = () => {
    $('.ant-tabs-content-holder')
      .off()
      .on('click', (e: any) => {
        const _con = $('.synergySendMsgBox') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          setInputHide({ ...InputHide, visible: false })
          changeShoweditor()
          $('.ant-tabs-content-holder').off('click')
        }
      })
  }
  /**
   * 取消回复
   */
  const replayCancel = () => {
    console.log('取消回复')
    msgTxtRef.current.innerHTML = ''
    markFileList = []
    setInputHide({ ...InputHide, visible: false })
    changeShoweditor()
  }
  /**
   * 获取表情图名字
   */
  const replaceImg = (ref: any) => {
    if (ref) {
      $(ref)
        .find('.emoji_icon')
        .each((i: number, item: any) => {
          const name = $(item).attr('data-name')
          $(item).prop('outerHTML', `[bq_${name}]`)
        })
      $(ref)
        .find('.fileAdd')
        .each((i: number, item: any) => {
          $(item).remove()
        })
    }
  }

  /**
   * 添加备注发布
   */
  const addMarksSave = () => {
    if (replay.replayTip !== '') {
      addComment()
      return
    }
    const sendVal = msgTxtRef.current.innerHTML

    if (sendVal === '') {
      message.warning('备注不能为空')
      return
    }
    const getInfo = getContentInfo(msgTxtRef.current, markFileList)
    replaceImg(msgTxtRef.current)
    // const marksContent = sendVal.replace(
    //   /<img class="emoji_icon"[^>]*\/([^d\.]+)\.[^\"\']+[\"\']?[^>]*>/gi,
    //   '[bq_$1]'
    // )
    // 去除首尾空格
    const marksContent = msgTxtRef.current.innerHTML.replace(/(^\s*)|(\s*$)/g, '')
    const param = {
      taskId: taskId,
      opinion: marksContent,
      cycleNum: cycleMNum,
      toUsers: [],
      files: getInfo.files,
      atUserIds: getInfo.atUsers,
    }
    addMarksApi(param).then((res: any) => {
      if (res) {
        msgTxtRef.current.innerHTML = ''
        markFileList = []
        changeShoweditor()
        refreshTheme()
      }
    })
  }

  /**
   * 添加评论回复
   */
  const addComment = () => {
    const { nowUserId, nowUser } = $store.getState()
    const { parentUserId, toUserId, toUserName, parentId, rootId, markCommentId } = replay
    let toMarkUserIds: any = []
    //内容替换附件和表情
    // const content = sendVal
    //   .replace(/<img class="emoji_icon"[^>]*\/([^d\.]+)\.[^\"\']+[\"\']?[^>]*>/gi, '[bq_$1]')
    //   .replace(/<img class="fileAdd"[^>]*>/g, '')
    $('#commentTmp').html(msgTxtRef ? msgTxtRef.current.innerHTML : '')
    const getInfo = getContentInfo($('#commentTmp'), markFileList)
    replaceImg($('#commentTmp'))
    // 处理后的内容
    const content = $('#commentTmp')
      .html()
      .replace(/(^\s*)|(\s*$)/g, '')
    if (content === '') {
      message.warning('您未填写回复内容')
      return
    }
    //评论回复时通知备注人
    if (nowUserId != parentUserId && parentUserId && !toMarkUserIds.includes(parentUserId)) {
      toMarkUserIds.push(parseInt(parentUserId))
    }
    if (nowUserId != toUserId && !toMarkUserIds.includes(toUserId)) {
      toMarkUserIds.push(parseInt(toUserId))
    }
    toMarkUserIds = [...new Set(toMarkUserIds)]
    let pushContent = ''
    if (!rootId || !parentId) {
      pushContent = nowUser + `评论了${toUserName}的备注：` + content
    } else {
      pushContent = nowUser + '回复了' + toUserName + ':' + content
    }

    const param = {
      taskId: taskId,
      content: content,
      typeId: markCommentId,
      parentId: parentId,
      rootId: rootId,
      atUserIds: getInfo.atUsers,
      type: 11,
      toMarkUserIds: toMarkUserIds,
      toMarkUserAcconts: [],
      belongId: ascriptionId,
      belongName: ascriptionName,
      pushContent: pushContent,
      fileDetailModels: getInfo.files,
      temporaryId: pageUuid,
    }
    addCommentApi(param).then((res: any) => {
      if (res) {
        msgTxtRef.current.innerHTML = ''
        setInputHide({ ...InputHide, visible: false })
        changeShoweditor()
        refreshTheme()
      }
    })
  }

  return (
    <div className={InputHide.visible ? 'padding-16px' : 'display_none'} style={{ margin: '10px 0' }}>
      <CommentEditor
        ref={editorRef}
        className="synergySendMsgBox"
        param={{
          sourceType: 'synergyMain',
          taskId,
          replay,
          addMarksSave,
          replayCancel,
          handleBtnShow: true,
          teamId: ascriptionId,
          pageUuid: pageUuid,
          files: [],
          setFileList: ({ fileItem, imgUrl }: any) => {
            // setMarkFileList([...markFileList, fileItem])
            markFileList = [...markFileList, fileItem]
            msgTxtRef.current.innerHTML += `<img class="fileAdd" src="${imgUrl}" data-filekey="${fileItem.fileKey}">`
          },
          delCommentTxt: () => {
            // delCommentTxt(0)
          },
        }}
      />
    </div>
  )
}
/**
 * 获取内容中的at人和文件
 */
export const getContentInfo = (ref: any, sortFiles: any) => {
  const atUsers: any = [],
    files: any = []
  if (ref) {
    // at人员
    $(ref)
      .find('.atUser')
      .each((_: number, item: any) => {
        atUsers.push($(item).attr('data-userid'))
      })
    // 附件
    $(ref)
      .find('.fileAdd,.img-around')
      .each((_: number, item: any) => {
        const fileKey = $(item).attr('data-filekey')
        // 查找是否已经存在附件
        const findItem = findRepeat({
          keyName: 'fileKey',
          keyVal: fileKey,
          list: sortFiles,
        })
        if (findItem) {
          files.push(findItem)
        }
      })
  }

  return {
    atUsers: atUsers,
    files: files,
  }
}

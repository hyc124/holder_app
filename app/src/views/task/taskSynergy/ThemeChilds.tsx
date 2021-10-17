/**
 * 子消息列表
 */
import React, { useState, useRef } from 'react'
import { Avatar, message, Modal, Button, Tooltip } from 'antd'
import FileList from '@/src/components/file-list/file-list'
// import { CommentEditor } from './commentEditor'
import { findRepeat } from '@/src/common/js/common'
import { CommentOut } from './commentOut'
import { delMarkCommentApi, addCommentApi } from '../taskComApi'
import { RenderFileList } from '../../mettingManage/component/RenderUplodFile'
import { RenderPreImgs } from '@/src/components/normal-preview/normalPreview'
export const ThemeChilds = (props: {
  dataList: any
  parentUserName: string
  parentUserId: string
  opinionId: string
  type: number
  itemInfo: any
  conform_props?: any //组合参数
  refreshTheme?: any //刷新方法
  taskId?: any //任务Id
  cycleMNum?: any
  ascriptionId?: any
  ascriptionName?: any
  findThemeList?: any
  flag?: any //归档判断
  onFileTime?: any //归档时间
  replayInfo: ({
    info,
    opinionId,
    parentUserId,
  }: {
    info: any
    opinionId: string
    parentUserId?: string
  }) => void
  setInputInfo: ({
    opinionId,
    visible,
    visibleId,
  }: {
    opinionId: string
    visible: boolean
    visibleId: string
  }) => void
}) => {
  const {
    dataList,
    parentUserId,
    opinionId,
    type,
    itemInfo,
    refreshTheme,
    taskId,
    cycleMNum,
    ascriptionId,
    ascriptionName,
    findThemeList,
    replayInfo,
    setInputInfo,
  } = props
  //输入框组件显隐
  const [InputHide, setInputHide] = useState<any>({
    opinionId: '',
    visible: false,
    id: '',
  })
  const photosRef = useRef<any>(null)
  //最外层框的显隐
  const [showLastInput, setShowLastInput] = useState<boolean>(true)
  // const { nowUserId } = $store.getState()
  // const editorRef = useRef<any>(null)
  const [replay, setReplay] = useState<any>({ replayTip: '' })
  // const [msgTxtRef, setMsgTxtRef] = useState<any>(null)
  // const msgTxtRef=null
  // 点击空白处隐藏
  const blankClick = () => {
    $('.ant-tabs-content-holder')
      .off()
      .on('click', (e: any) => {
        const _con = $('.synergySendMsgBox') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          setInputHide({ ...InputHide, visible: false })
          $('.ant-tabs-content-holder').off('click')
        }
      })
  }

  /**
   * 回复
   */
  const replayComment = ({
    info,
    opinionId,
    parentUserId,
  }: {
    info: any
    opinionId: string
    parentUserId?: string
  }) => {
    // markFileList = []
    setReplay({
      replayTip: `回复  ${info.userName || info.username}`,
      parentId: info.id,
      rootId: info.id,
      toUserName: info.userName || info.username,
      toUserId: info.userId || info.userid,
      parentUserId: parentUserId,
      markCommentId: opinionId,
    })
  }

  // 拖动到不同类型弹框
  const [delMarkModal, setDelMarkModal] = useState<any>({
    visible: false,
    content: '',
  })

  // const addMarksSave = () => {
  // if (replay.replayTip !== '') {
  //   addComment({ taskId, replay, getContentInfo, markFileList, conform_props }).then(() => {
  //     setInputHide({ ...InputHide, visible: false })
  //     refreshTheme()
  //   })
  //   return
  // }
  //   // const sendVal = msgTxtRef.current.innerHTML

  //   // if (sendVal === '') {
  //   //     message.warning('备注不能为空')
  //   //     return
  //   // }
  //   // const getInfo = getContentInfo(msgTxtRef.current, markFileList)
  //   // replaceImg(msgTxtRef.current)
  //   // // const marksContent = sendVal.replace(
  //   // //   /<img class="emoji_icon"[^>]*\/([^d\.]+)\.[^\"\']+[\"\']?[^>]*>/gi,
  //   // //   '[bq_$1]'
  //   // // )
  //   // // 去除首尾空格
  //   // const marksContent = msgTxtRef.current.innerHTML.replace(/(^\s*)|(\s*$)/g, '')
  //   // const param = {
  //   //     taskId: taskId,
  //   //     opinion: marksContent,
  //   //     cycleNum: cycleMNum,
  //   //     toUsers: [],
  //   //     files: getInfo.files,
  //   //     atUserIds: getInfo.atUsers,
  //   // }
  //   // addMarksApi(param).then((res: any) => {
  //   //     if (res) {
  //   //         msgTxtRef.current.innerHTML = ''
  //   //         markFileList = []
  //   //         refreshTheme()
  //   //     }
  //   // })
  // }
  //关闭输入框
  const changeShoweditor = () => {
    setInputHide({
      opinionId: '',
      visible: false,
      id: '',
    })
    setShowLastInput(true)
  }

  // 递归处理数据，组装成同级
  const RenderItem = (data: any, parentName: string) => {
    const newChilds: any = []
    const getChild = (childs: any, parentName: string) => {
      for (let i = 0; i < childs.length; i++) {
        newChilds.push({ ...childs[i], parentName: parentName })

        if (childs[i].childComments && childs[i].childComments.length != 0) {
          getChild(childs[i].childComments, childs[i].username)
        }
      }
    }
    getChild(data, parentName)
    return newChilds
  }

  return (
    <div className={`theme_child_list ${type == 0 ? 'first' : type == 1 ? 'second' : ''}`}>
      <div id="commentTmp" className="forcedHide"></div>
      {dataList?.map((item: any, i: number) => {
        return (
          <div
            key={i}
            className="theme_child_wrapper"
            onClick={(e: any) => {
              e.stopPropagation()
              setInputInfo({
                visible: true,
                visibleId: opinionId,
                opinionId: item.opinionId,
              })
              //   blankClick()
              replayInfo({
                info: item,
                opinionId,
                parentUserId: parentUserId,
              })
            }}
          >
            <div className="header-content">
              <div className="flex" style={{ marginBottom: 10 }}>
                <Avatar className="oa-avatar" src={item.profile || ''}>
                  {item.username && item.username.substr(-2, 2)}
                </Avatar>
                <div className="header-right">
                  <div className="flex center-v">
                    {/* <Tooltip title={`${item.username}`}>
                      <span className="username">{item.username.substr(0, 4)}：</span>
                    </Tooltip> */}
                    <RenderPreImgs
                      content={`<pre class="user-cont"><span style="width: 100%;">${item.username}：${item.content}</span></pre>`}
                      photosRef={photosRef}
                      parentNode={true}
                      htmlParentClass={'user-cont'}
                    />
                  </div>
                  <div className="time-wrapper flex between">
                    <span>{item.createTime}</span>
                  </div>
                </div>
              </div>
              {item.fileReturnModels && item.fileReturnModels.length != 0 && (
                <RenderFileList list={item.fileReturnModels || []} large={true} teamId={ascriptionId} />
              )}
            </div>
            {item.childComments.length > 0 && (
              <div className="child-item-wrapper">
                {RenderItem(item.childComments, item.username).map((sItem: any, tindex: number) => (
                  <div
                    className="child-item"
                    key={tindex}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      setInputInfo({
                        visible: true,
                        visibleId: opinionId,
                        opinionId: sItem.opinionId,
                      })
                      //   blankClick()
                      replayInfo({
                        info: sItem,
                        opinionId,
                        parentUserId: parentUserId,
                      })
                    }}
                  >
                    <pre>
                      <RenderPreImgs
                        content={
                          `<span style="color: #191F25">${sItem.username}</span>：<span style="color: #70707A; margin-right: 6px">回复</span><span style="color: #191F25">${item.username}</span>：` +
                          sItem.content
                        }
                        photosRef={photosRef}
                        htmlParentClass={'child-item-row'}
                      />
                    </pre>
                    {/* 子级附件 */}
                    {sItem.fileReturnModels && sItem.fileReturnModels.length != 0 && (
                      <RenderFileList list={sItem.fileReturnModels || []} large={true} teamId={ascriptionId} />
                    )}
                    <div className="time-wrapper">
                      <span>{sItem.createTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* {item.id == InputHide.id ? (
                <CommentOut
                  param={{
                    taskId: taskId,
                    cycleMNum: cycleMNum,
                    ascriptionId: ascriptionId,
                    ascriptionName: ascriptionName,
                    showeditor: InputHide.visible,
                    showid: InputHide.opinionId,
                    showparentId: parentUserId,
                    replay: replay,
                    findThemeList,
                    refreshTheme,
                    changeShoweditor,
                  }}
                />
              ) : (
                ''
              )} */}
            {/* {item.childComments && item.childComments.length != 0 ? (
              <ThemeChilds
                dataList={item.childComments || []}
                parentUserName={item.username}
                parentUserId={parentUserId}
                opinionId={opinionId}
                type={type + 1}
                itemInfo={item}
                refreshTheme={refreshTheme}
                taskId={taskId}
                cycleMNum={cycleMNum}
                ascriptionId={ascriptionId}
                ascriptionName={ascriptionName}
                findThemeList={findThemeList}
                flag={flag} //归档判断
                onFileTime={onFileTime} //归档时间
              />
            ) : (
              ''
            )} */}
          </div>
        )
      })}
      {/* 拖动不同类型任务的二次提醒弹框 */}
      <Modal
        className="baseModal "
        visible={delMarkModal.visible}
        title={delMarkModal.title}
        onOk={() => {
          setDelMarkModal({ visible: false })
          if (delMarkModal.onSure) {
            delMarkModal.onSure()
          }
        }}
        onCancel={() => {
          setDelMarkModal({ visible: false })
        }}
        width={395}
        centered={true}
      >
        <p className="msg_tit">{delMarkModal.content}</p>
      </Modal>
      <div className={'display_none'}>
        {/* 收起的情况下 */}
        <div className={showLastInput ? 'publish_reply' : 'display_none'}>
          <div
            className="publish_reply_input"
            onClick={e => {
              setShowLastInput(false)
              blankClick()
              replayComment({
                info: itemInfo,
                opinionId: itemInfo.opinionId,
              })
            }}
          >
            <span className="publish_reply_input_t">写下你的评论...</span>
          </div>
          <Button type="primary" disabled>
            发布
          </Button>
        </div>
        {/* 点击以后展示标签和附件的选项框 */}
        <div className={showLastInput ? 'display_none' : ''}>
          <CommentOut
            param={{
              taskId: taskId,
              cycleMNum: cycleMNum,
              ascriptionId: ascriptionId,
              ascriptionName: ascriptionName,
              showeditor: !showLastInput,
              showid: InputHide.opinionId,
              showparentId: parentUserId,
              replay: replay,
              findThemeList,
              refreshTheme,
              changeShoweditor,
            }}
          />
        </div>
      </div>
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
      .each((i: number, item: any) => {
        atUsers.push($(item).attr('data-userid'))
      })
    // 附件
    $(ref)
      .find('.fileAdd,.img-around')
      .each((i: number, item: any) => {
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
/**
 * 获取表情图名字
 */
export const replaceImg = (ref: any) => {
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
 * 添加评论回复
 */
export const addComment = ({ taskId, replay, getContentInfo, markFileList, conform_props }: any) => {
  return new Promise(resolve => {
    const { nowUserId, nowUser } = $store.getState()
    const { parentUserId, toUserId, toUserName, parentId, rootId, markCommentId } = replay
    let toMarkUserIds: any = []
    //内容替换附件和表情
    // const content = sendVal
    //   .replace(/<img class="emoji_icon"[^>]*\/([^d\.]+)\.[^\"\']+[\"\']?[^>]*>/gi, '[bq_$1]')
    //   .replace(/<img class="fileAdd"[^>]*>/g, '')
    // $('#commentTmp').html(msgTxtRef ? msgTxtRef.current.innerHTML : '')
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

    const param: any = {
      taskId,
      content: content,
      typeId: markCommentId,
      parentId: parentId,
      rootId: rootId,
      atUserIds: getInfo.atUsers,
      type: 11,
      toMarkUserIds: toMarkUserIds,
      toMarkUserAcconts: [],
      belongId: conform_props.ascriptionId,
      belongName: conform_props.ascriptionName,
      pushContent: pushContent,
      fileDetailModels: getInfo.files,
    }
    addCommentApi(param).then((res: any) => {
      if (res) {
        resolve(res)
      }
    })
  })
}
/**
 * 检查内容替换表情字符串为表情图标，普通文本不变
 * type:0 返回react节点 1：html代码
 */
// let editMarkFileList: any = []
// let markFileList: any = []
export const getEmojiContent = (content: string, type: number): any => {
  let html = ''
  const reg = /\[bq_(\w+)\]/gi,
    ret = []
  let lastIndex = 0,
    i = 0,
    match: any
  while ((match = reg.exec(content))) {
    // 文本
    if (match.index !== lastIndex) {
      const txt = content.slice(lastIndex, match.index)
      if (type == 1) {
        html += txt
      } else {
        ret.push(txt)
      }
    }
    if (type == 1) {
      // $tools.asAssetsPath(`/emoji/${match[1]}.png`)
      html += `<img class="emoji_icon" src="${$tools.asAssetsPath(`/emoji/${match[1]}.png`)}" />`
    } else {
      //   表情包替换
      ret.push(
        <img key={i++} className="emoji_icon" src={`${$tools.asAssetsPath(`/emoji/${match[1]}.png`)}`} />
      )
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex !== content.length) {
    const txt = content.slice(lastIndex)
    if (type == 1) {
      html += txt
    } else {
      ret.push(txt)
    }
  }
  return type == 1 ? html : ret
}
/**
 * 删除评论回复
 * opinionId备注id 回复评论id
 * type 0 备注 1回复
 */
export const delMarkComment = ({
  type,
  opinionId,
  setDelMarkModal,
  changeShoweditor,
  refreshTheme,
}: {
  opinionId: string
  type: number
  setDelMarkModal: any
  changeShoweditor: any
  refreshTheme: any
}) => {
  let content = '确定希望永久删除这条备注？'
  let title = '删除备注'
  if (type == 1) {
    title = '删除评论'
    content = '确定删除这条评论？'
  }
  setDelMarkModal({
    visible: true,
    title: title,
    content: content,
    onSure: () => {
      delMarkCommentApi({
        opinionId,
        type: type,
      }).then((res: any) => {
        if (res) {
          changeShoweditor()
          refreshTheme()
        }
      })
    },
  })
}

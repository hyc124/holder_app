import React, { useState, useEffect, memo, useLayoutEffect, useRef } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Avatar, message, Spin } from 'antd'
import moment from 'moment'
import $c from 'classnames'
import ReplyMsgMap from './ReplyMsgMap'
// import ReplyFileMsg from './ReplyFileMsg'
import { getHistoryMsg, getReplyList } from '../getData/getData'
import '../styles/ChatWin.less'
import ApplyAttachment from './global/ApplyAttachment'
import { getProfile } from './global/common'
import { replaceImg } from '../../task/taskSynergy/ThemeChilds'

interface ReplyDataProps {
  replyMainBody: any
  replyMessages: any[]
}

// 消息回复的列表
const MessageReplyList = (props: any) => {
  const { messageHistory } = props
  const { nowUserId } = $store.getState()
  // 回复消息详情
  const replyData = useSelector((state: StoreStates) => state.replyModalData, shallowEqual)
  // 列表数据
  const initValue = {
    replyMainBody: { visible: false, timestamp: 0, rootMsgUuid: '', roomId: null },
    replyMessages: [],
  }
  // 选中列表item
  const selectItem = useSelector((state: any) => state.selectItem, shallowEqual)
  const [{ replyMainBody, replyMessages }, setReplyData] = useState<ReplyDataProps>(initValue)
  // loading 状态
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (replyData.visible) {
      $store.dispatch({ type: 'SET_REPLY_MODAL_DATA', data: { visible: false, timestamp: 0, mucId: '' } })
    }
  }, [selectItem?.roomId])

  // 请求查询列表
  useEffect(() => {
    if (replyData.visible) {
      setLoading(true)
      const { roomId, rootMsgUuid } = replyData
      getReplyList({ roomId, rootMsgUuid, userId: nowUserId })
        .then((resData: any) => {
          if (resData) {
            const { rootMsg, replyMessageList } = resData || {}
            const replyList = duplicateArr(replyMessageList || [], 'msgUuid')
            setReplyData({
              replyMainBody: rootMsg || {},
              replyMessages: replyList,
            })
          }
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [replyData.visible, replyData])

  //去掉重复元素
  const duplicateArr = (arr: any, name: string) => {
    const hash = {}
    return arr.reduce(function(item: any, next: any) {
      hash[next[name]] ? '' : (hash[next[name]] = true && item.push(next))
      return item
    }, [])
  }

  // 回复消息递归定位
  const handleContinue = (newList: any, msgReplyTime: any) => {
    let isContinue = true
    const pointTime = messageHistory.length > 0 ? messageHistory[0].serverTime : 0
    const params = {
      roomId: selectItem.roomId,
      num: 20,
      keywords: '',
      serverTime: pointTime, //获取聊天室第一条数据的serverTime
    }
    getHistoryMsg(params).then(async (data: any) => {
      let idx = 0
      const scrollData = [...data, ...messageHistory]
      const hasMore = data.length === 20 ? true : false
      scrollData.map((item: globalInterface.ChatItemProps, i: number) => {
        // if (item.content) {
        // const itemContent = JSON.parse($tools.htmlDecodeByRegExp(item.content))
        if (item.time === msgReplyTime) {
          isContinue = false
          idx = i
        }
        // }
      })
      await $store.dispatch({
        type: 'CHAT_ROOM_INFO',
        data: { messageHistory: scrollData },
      })
      $store.dispatch({ type: 'SET_HASMORE_HISTORYMESSAGE', data: hasMore })
      if (isContinue) {
        handleContinue(scrollData, msgReplyTime)
      } else {
        const msgelement = $('#chat_msg_list_container')
        const chatItem = $('.chat-item')[idx]
        if (chatItem) {
          const srcollTop = chatItem.offsetTop
          msgelement.scrollTop(srcollTop - 100)
        }
      }
    })
  }

  const msgScrollPosttion = (msgReplyTime: number) => {
    const scrollData = [...messageHistory]
    if (scrollData.length > 0 && scrollData.length < 101) {
      let idx = 0
      let isContinue = true
      scrollData.map((item: globalInterface.ChatItemProps, i: number) => {
        if (item.time === msgReplyTime) {
          isContinue = false
          idx = i
        }
        // }
      })
      if (isContinue) {
        handleContinue(scrollData, msgReplyTime)
      } else {
        const msgelement = $('#chat_msg_list_container')
        const chatItem = $('.chat-item')[idx]
        if (chatItem) {
          const srcollTop = chatItem.offsetTop
          msgelement.scrollTop(srcollTop - 100)
          $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
        }
      }
    } else {
      if (scrollData.length > 100) {
        message.error('消息太久远，定位不到啦！')
      } else {
        message.error('消息不存在')
      }
    }
  }

  const renderMainMsg = () => {
    const { messageJson, type, isRecall } = replyMainBody //根目录得信息
    const replyMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
    if (isRecall !== 1) {
      // 地图
      if (type === 4) {
        return <ReplyMsgMap replyMainBody={replyMainBody} />
      } else if (type === 3) {
        // 图文信息
        const { displayName, fileGUID, downloadUrl, officeUrl } = $tools.isJsonString(replyMsg)
          ? JSON.parse(replyMsg)
          : replyMsg
        const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
        const fileExt = displayName
          ?.toLowerCase()
          .split('.')
          .splice(-1)[0]
        if (imgFormatArr.includes(fileExt)) {
          // 图片消息
          const replyImg = `<span class="reply_img_box" datasrc="${officeUrl}"><img src="${officeUrl}" /></span>`
          return <div className="message-info" dangerouslySetInnerHTML={{ __html: replyImg }}></div>
        } else {
          // 文件消息
          return (
            <div className="message-info">
              <ApplyAttachment
                attachParam={{
                  name: displayName,
                  fileGUID: fileGUID || '',
                  downloadUrl: downloadUrl,
                  officeUrl: officeUrl,
                  isReply: true,
                }}
              />
            </div>
          )
        }
      } else if (type === 2) {
        //@消息
        return (
          <div className="message-info">
            <span
              className="reply-content"
              dangerouslySetInnerHTML={{
                __html: replyMsg?.content || '',
              }}
            ></span>
          </div>
        )
      } else if (type === 1) {
        // 普通文字信息
        const replyContent = `<span class="reply-content">${String(messageJson)
          .replace(/(?<!\\)\u003c/g, '&lt;')
          .replace(/(?<!\\)\u003e/g, '&gt;')
          .replace($tools.regLineFeed, '<br/>')
          .replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
          .replace($tools.regHttps, function(record) {
            const item = record.replace(/(^\s*)|(\s*$)|(&nbsp;*$)/g, '').trim()
            if (item.startsWith('http://') || item.startsWith('https://')) {
              return `<a href='${item}' target="_blank">${item}</a>`
            } else {
              return `<a href='https://${item}' target="_blank">${item}</a>`
            }
          })}</span>`
        return (
          <div
            className="message-info"
            dangerouslySetInnerHTML={{
              __html: replyContent,
            }}
          ></div>
        )
      }
    } else {
      const replyMsg = '【该消息已撤回】'
      return (
        <div
          className="message-info"
          dangerouslySetInnerHTML={{
            __html: replyMsg,
          }}
        ></div>
      )
    }
  }

  // 关闭回复消息弹窗
  const closeReply = () => {
    $store.dispatch({
      type: 'SET_REPLY_MODAL_DATA',
      data: { visible: false, timestamp: 0, mucId: '' },
    })
  }
  const { fromUser: from, serverTime } = replyMainBody || {}
  if (!replyData.visible) {
    return <div style={{ visibility: 'hidden' }}></div>
  }

  const replaceHtml = (str: string) => {
    if (!!str) {
      return str
        .replace($tools.regEmoji, function(_: string, regStr: any) {
          const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
          return `<img class="emoji_icon" src="${imgUrl}">`
        })
        .replace($tools.regLineFeed, '<br/>')
        .replace($tools.regHttps, function(record: string) {
          const item = record.replace(/(^\s*)|(\s*$)|(&nbsp;*$)/g, '').trim()
          if (item.startsWith('http://') || item.startsWith('https://')) {
            return `<a href='${item}' target="_blank">${item}</a>`
          } else {
            return `<a href='https://${item}' target="_blank">${item}</a>`
          }
        })
    }
    return ''
  }

  return (
    // <Drawer placement="right" width={500} closable={false} onClose={closeReply} visible={replyData.visible}>
    <div className="messageReplyList">
      <div className="replyHeader">
        <div>回复</div>
        <div>
          {/* <i
        className="positionBtn"
        onClick={() => {
          closeReply()
          msgScrollPosttion(serverTime)
        }}
      ></i> */}
          <i className="closeBtn" onClick={closeReply}></i>
        </div>
      </div>
      {/* <Spin spinning={loading}> */}
      <Spin spinning={loading} size="small" style={{ backgroundColor: '#fff' }}>
        {replyMainBody && (
          <div className="mainBody">
            <div className="flex">
              <Avatar className="oa-avatar" src={getProfile(from?.userId)}>
                {from?.username && from?.username.substr(-2, 2)}
              </Avatar>
              <div>
                <span className="from-name">{from?.username}</span>
                <div className="message-time">{moment(serverTime).format('MM月DD日 HH:mm')}</div>
              </div>
            </div>
            {renderMainMsg()}
          </div>
        )}
        <div className="replyMianList">
          {replyMessages &&
            replyMessages.map((item, index) => {
              const { fromUser, messageJson, isRecall } = item || {}
              const replyMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
              const replyContent = $tools.isJsonString(replyMsg) ? JSON.parse(replyMsg) : replyMsg
              if (isRecall !== 1) {
                return (
                  <div key={index} className="chat-item">
                    <div
                      className={$c('normal-msg flex', {
                        'normal-chat': fromUser.userId !== nowUserId,
                        'normal-chat-right': fromUser.userId === nowUserId,
                      })}
                    >
                      <div className="show-message flex-1">
                        <Avatar className="oa-avatar" src={getProfile(fromUser.userId)}>
                          {fromUser.username && fromUser.username.substr(-2, 2)}
                        </Avatar>
                        {/* 发消息的人 */}
                        {fromUser.userId !== nowUserId && (
                          <span className="from-name">{fromUser.username}</span>
                        )}
                        {/* 发消息的时间 */}
                        {/* <div className="message-time">{moment(stamp).format('MM月DD日 HH:mm')}</div> */}
                        {/* 消息 */}
                        <div
                          className="message-info"
                          dangerouslySetInnerHTML={{
                            __html: replaceHtml(replyContent?.content),
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
        </div>
      </Spin>
    </div>
  )
}

export default memo(MessageReplyList)

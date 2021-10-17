import React, { useEffect, useState, useRef, Fragment, useCallback } from 'react'
import { message, Input } from 'antd'
import ChatItem from './ChatItem'
import NoneData from '@/src/components/none-data/none-data'
import { getHistoryMsg } from '../chatwin/getData/getData'
import { updateHistoryMsg } from '../chatwin/getData/ChatHandle'
import '../chatWin/styles/ChatMain.less'
import './chat-history.less'

export const useMergeState = (initialValue: any) => {
  const [values, setValues] = useState(initialValue)
  const updateValues = useCallback(newState => {
    if (typeof newState !== 'object') {
      return console.warn('values required type is object!')
    }
    setValues((prevState: any) => Object.assign({}, prevState, newState))
  }, [])
  const forceValues = useCallback(_values => {
    setValues(_values || initialValue)
  }, [])
  return [values, updateValues, forceValues]
}

const ChatHistory = () => {
  // 聊天室滚动到底部
  const messagesEndRef = useRef<any>(null)
  // 聊天消息搜索框
  const searchInputRef = useRef<any>(null)
  const [msgs, setMessageHistory] = useMergeState({
    messageHistory: [], //当前所在tab
    hasMore: false,
    keepScroll: false,
    keywords: '',
  })

  useEffect(() => {
    if (!msgs.keepScroll) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView(false, { behavior: 'smooth' })
      }, 10)
      return () => {
        clearTimeout(timer)
      }
    }
  })

  useEffect(() => {
    const { selectItem, nowUserId } = $store.getState()
    const params = {
      roomId: selectItem.roomId,
      keywords: '',
      num: 20,
      userId: nowUserId,
      serverTime: new Date().getTime(),
    }
    getHistoryMsg(params)
      .then((resData: any) => {
        const hasMore = resData.length === 20 ? true : false
        const newData = updateHistoryMsg(resData)
        setMessageHistory({
          messageHistory: newData,
          hasMore,
        })
      })
      .catch(() => {
        setMessageHistory({
          messageHistory: [],
        })
      })
  }, [])

  // 查询聊天记录
  const searchChatMsg = (keywords: string) => {
    const { selectItem, nowUserId } = $store.getState()
    const params = {
      roomId: selectItem.roomId,
      keywords,
      num: 20,
      userId: nowUserId,
      serverTime: new Date().getTime(),
    }
    getHistoryMsg(params)
      .then((resData: any) => {
        const hasMore = resData.length === 20 ? true : false
        const newData = updateHistoryMsg(resData)
        setMessageHistory({
          messageHistory: newData,
          hasMore,
          keywords,
        })
      })
      .catch(() => {
        message.error('查询失败，请检查网络')
        setMessageHistory({
          messageHistory: [],
          hasMore: false,
        })
      })
  }

  // 查看更多历史消息
  let pScroll: any = ''
  const lookMoreMsg = () => {
    const {
      selectItem: { roomId },
      nowUserId,
    } = $store.getState()
    const searchTime = msgs.messageHistory[0]?.serverTime
    $('.chat-item').each(function(i, item) {
      const itemTime = $(item).attr('data-time')
      if (itemTime === searchTime) {
        pScroll = item
      }
    })
    const params = {
      roomId: roomId,
      keywords: msgs.keywords,
      num: 20,
      userId: nowUserId,
      serverTime: searchTime,
    }
    getHistoryMsg(params)
      .then(async (resData: any) => {
        // 更新界面历史消息、本地缓存
        const hasMore = resData.length === 20 ? true : false
        const newData = updateHistoryMsg(resData.concat(msgs.messageHistory))
        // 设置滚动条位置
        if (pScroll) {
          const offset: any = $(pScroll).offset()
          const srcollTop = offset.top
          if (hasMore) {
            $('#chat_msg_list_container').scrollTop(srcollTop - 60)
          } else {
            $('#chat_msg_list_container').scrollTop(srcollTop)
          }
        } else {
          const msgelement = $('.chat_msg_list_container')
          $('#chat_msg_list_container').scrollTop(msgelement[0].scrollHeight)
        }
        setMessageHistory({
          messageHistory: newData,
          hasMore,
          keepScroll: true,
        })
      })
      .catch(() => {
        setMessageHistory({
          messageHistory: [],
        })
      })
  }

  return (
    <div className="chatHistoryMain">
      <Input.Search
        className="search-message search-input"
        placeholder="关键字"
        ref={searchInputRef}
        onSearch={searchChatMsg}
      />
      <div className="chat_msg_list_container flex-1" id="chat_msg_list_container">
        {msgs.messageHistory.length > 0 &&
          (msgs.hasMore ? (
            <label className="look_more_msg" onClick={lookMoreMsg}>
              <span></span>查看更多消息
            </label>
          ) : (
            <label className="no_more_msg">
              <span></span>没有更多消息了
            </label>
          ))}
        {msgs.messageHistory.length > 0 && (
          <Fragment>
            {msgs.messageHistory.map((item: globalInterface.ChatItemProps) => {
              return <ChatItem key={item.serverTime} showContent={item}></ChatItem>
            })}
            <div className="msgEndRef" ref={messagesEndRef} />
          </Fragment>
        )}
        {!msgs.messageHistory.length && (
          <NoneData showTxt="暂无沟通内容" imgSrc={$tools.asAssetsPath('/images/common/none_data.png')} />
        )}
      </div>
    </div>
  )
}

export default ChatHistory

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { ipcRenderer, remote } from 'electron'
import ChatSearch from './component/ChatSearch'
import { loadLocales } from '@/src/common/js/intlLocales'
import ChatRightContainer from './component/ChatRightContainer'
import ChatList from './component/ChatList'
import { saveDraftMsg, removeCacheMsg, setCacheMsg } from './getData/ChatInputCache'
import './styles/ChatWin.less'

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

//沟通主窗口
const ChatWin = () => {
  // 当前选中的聊天室
  const selectItem = useSelector((state: StoreStates) => state.selectItem, shallowEqual)

  const openDevtools = (e: any) => {
    const { ctrlKey, altKey, keyCode } = e
    if (ctrlKey && altKey && keyCode === 71) {
      const cureentWindow = remote.getCurrentWindow()
      cureentWindow && cureentWindow.webContents.toggleDevTools()
      e.preventDefault()
    }
  }

  useEffect(() => {
    // 监听窗口显示时调用初始化方法刷新界面
    let isUnmounted = false
    if (isUnmounted) {
      return
    }
    document.title = '沟通'
    // 初始化多语言配置
    loadLocales()
    const { openRoomIds, chatListData } = $store.getState()
    const initSelect = chatListData.find(item => {
      return item.roomId === openRoomIds[0]
    })
    if (initSelect) {
      $store.dispatch({ type: 'SET_SELECT_ITEM', data: initSelect })
    }
    ipcRenderer.removeAllListeners('show_commuciate_muc').on('show_commuciate_muc', (event, args) => {
      saveDraftMsg(args[0], args[1], $store.dispatch)
      $store.dispatch({ type: 'SET_SELECT_ITEM', data: args[1] })
    })
    ipcRenderer.removeAllListeners('chat-win-close').on('chat-win-close', () => {
      const { selectItem } = $store.getState()
      const inputTxt = document.getElementById('msg-txt')?.innerHTML
      const newText = inputTxt
        ?.replace($tools.regLineFeed1, '')
        .replace($tools.regSpace1, ' ')
        .replace(/\ +/g, ' ')
      if (!newText) {
        removeCacheMsg(selectItem.roomId, selectItem.roomJid, selectItem, $store.dispatch)
      } else {
        const prevItemValue = { roomId: selectItem.roomId, roomJid: selectItem.roomJid, content: newText }
        setCacheMsg(prevItemValue, selectItem, $store.dispatch)
      }
      // 清空聊天室
      $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [] })
      $store.dispatch({ type: 'SET_SELECT_ITEM', data: {} })
    })
    //手动开启devtools
    window.addEventListener('keydown', openDevtools)
    return () => {
      window.removeEventListener('keydown', openDevtools)
      isUnmounted = true
    }
  }, [])

  // 六项精进
  const renderTime = () => {
    const d = new Date()
    let time = d.getHours()
    let str = '又是元气满满的一天！加油哦~~'
    if (time >= 12) {
      time = time - 12
      if (time >= 0 && time < 6) {
        str = '下午好，积善行，思利他。要谦虚不要骄傲哦~~'
      } else if (time >= 6 && time <= 12) {
        str = '晚上好，要每天反省，活着就要感谢，不要有感性的烦恼哦~~'
      }
    } else if ((time >= 0 && time < 6) || (time >= 6 && time <= 12)) {
      str = '早上好，要付出不亚于任何人的努力！加油哦~~'
    }
    return str
  }

  const ChatSearchComponent = useMemo(() => {
    return <ChatSearch />
  }, [])

  return (
    <div className="chat-container">
      <div className="left_chat_list flex column">
        {/* 查询聊天室 */}
        {ChatSearchComponent}
        {/* 聊天室列表 */}
        <ChatList />
      </div>
      {selectItem && !$tools.isEmptyObject(selectItem) ? (
        <ChatRightContainer />
      ) : (
        <div className="main_content_bg">
          {/* 没有选中聊天室 */}
          <img src={$tools.asAssetsPath('/images/chatWin/chat_init.png')} />
          <div>{renderTime()}</div>
        </div>
      )}
    </div>
  )
}
export default ChatWin

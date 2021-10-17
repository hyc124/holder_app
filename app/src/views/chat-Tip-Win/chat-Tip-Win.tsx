import React, { useEffect } from 'react'
import { Avatar } from 'antd'
import './chat-Tip-Win.less'
import { useSelector } from 'react-redux'
import { ignoreMucMessage } from './getData'
import { ipcRenderer } from 'electron'
import { getListAvatar } from '../chatwin/component/ChatHeader'
import { getAvatarEnums } from '@/src/views/chatwin/getData/ChatHandle'
import { batchInsertChatRoom, fetchChatRoom } from '../chatwin/getData/ChatInputCache'
import { getLocalRoomData } from '../myWorkDesk/chat/ChatList'

const ChatUnreadWin = () => {
  const reportListData = useSelector((store: StoreStates) => store.unreadList)

  useEffect(() => {
    if (!reportListData.length) {
      ipcRenderer.send('hide_tips_window')
    } else {
      ipcRenderer.send('change_tray_icon')
    }
  }, [reportListData])

  //点击跳转到指定聊天室
  const goToChatRoom = (roomId: any) => {
    // 添加列表数据
    const { chatListData, openRoomIds, selectItem } = $store.getState()
    const data = JSON.parse(JSON.stringify(chatListData))
    data?.forEach((item: any) => {
      if (item.roomId === roomId) {
        // 打开沟通窗口
        ipcRenderer.send('show_commuciate_muc', [selectItem, item])
      }
    })
    const ids = reportListData
      .map(item => {
        if (openRoomIds.indexOf(item.roomId) === -1) {
          return item.roomId
        }
      })
      .filter(item => item != undefined)
    const newIds = [...openRoomIds, ...ids]
    // 保存当前在独立窗口打开的聊天室id
    $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
    // 清空闪烁
    $store.dispatch({
      type: 'SAVE_UNREAD_INFO',
      data: [],
    })
    //关闭小弹窗
    ipcRenderer.send('hide_tips_window')
    ipcRenderer.send('change_tray_icon')
  }
  const ignoreAllChat = () => {
    const { nowUserId } = $store.getState()
    ignoreMucMessage().then(() => {
      $store.dispatch({
        type: 'SAVE_UNREAD_INFO',
        data: [],
      })
      // 更新列表未读消息
      const { chatListData } = $store.getState()
      const data = JSON.parse(JSON.stringify(chatListData))
      data?.forEach((item: any) => {
        if (item.unreadCount > 0) {
          item['unreadCount'] = 0
        }
      })
      //更新本地缓存
      batchInsertChatRoom({ userId: nowUserId, data: data })
      $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
      // getLocalRoomData(false, '')
      //刷新工作台头部沟通红点数量
      ipcRenderer.send('refresh_meet_connect', ['talk_count'])
      ipcRenderer.send('hide_tips_window')
      ipcRenderer.send('change_tray_icon')
      // 取消任务栏高亮显示
      ipcRenderer.send('force_cancel_flash')
    })
  }
  const getNum = () => {
    let countNum = 0
    reportListData.map((item: any) => {
      countNum = countNum + item.unreadCount
    })
    return countNum
  }

  // 渲染提示框的文字
  const renderText = (lastUnReadMessage: any) => {
    const { messageJson, fromUser, isRecall, type } = lastUnReadMessage
    const replyMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
    let rMsg = replyMsg
    if (!!replyMsg) {
      if (type === 1 && typeof replyMsg === 'string') {
        rMsg = replyMsg
          .replace($tools.regEmoji, '[表情]')
          .replace($tools.regCharacter, '')
          .replace(/<img(.*?)>/g, '[截图]')
          .replace(/\<br>/g, '')
        // rMsg = replyMsg
      } else if (type === 2) {
        //被@时
        const str = replyMsg?.content || ''
        const msgcontent = str.replace($tools.regCharacter, '')
        rMsg = $tools.htmlDecodeByRegExp(
          msgcontent
            .replace($tools.regEmoji, '[表情]')
            .replace($tools.regCharacter, '')
            .replace(/\<br>/g, '')
        )
        // rMsg = replyMsg
      } else if (type == 4) {
        rMsg = '【位置】'
      } else if (type === 3) {
        const { displayName } = replyMsg
        rMsg = '【文件】'
        const ext = displayName?.split('.').splice(-1)[0]
        if (ext == 'bmp' || ext == 'png' || ext == 'gif' || ext == 'jpg' || ext == 'jpeg') {
          rMsg = '【图片】'
        }
      } else if (type === 6) {
        rMsg = '【引用消息】'
      } else if (type === 5) {
        rMsg = replyMsg?.content || ''
      }
      if (isRecall === 1) {
        rMsg = `${$store.getState().nowUserId === fromUser?.userId ? '你' : fromUser?.username}撤回了一条消息`
      }
      //普通消息
    } else {
      rMsg = ''
    }
    const name = fromUser?.username || ''
    return `${name} : ${rMsg}`
  }

  return (
    <div className="chat_tips_conatainer" style={{ width: '100%', height: '100%' }}>
      <div className="tips_title">
        {reportListData.length > 0 && (
          <span>
            Holder(共{reportListData.length}位联系人，{getNum()}条消息)
          </span>
        )}
      </div>
      <div className="tips_list">
        {reportListData.map((data: any, index: number) => {
          const text = renderText(data.lastUnReadMessage)
          return (
            <div
              className="list_data"
              key={index}
              onClick={e => {
                e.stopPropagation()
                goToChatRoom(data.roomId)
              }}
            >
              <span className="red_unread">{data?.unreadCount > 99 ? '99+' : data?.unreadCount}</span>
              <Avatar
                src={data.profile ? data.profile : getAvatarEnums(data?.type, data?.roomName)}
                icon={data?.type !== 3 && getListAvatar()}
                className="oa-avatar flex center"
              >
                {data?.roomName && data?.roomName.substr(-2, 2)}
              </Avatar>
              <div className="show_content">
                <span className="show_title">{data?.roomName}</span>
                <div
                  className="show_message_content"
                  dangerouslySetInnerHTML={{
                    __html: text,
                  }}
                ></div>
              </div>
              {(data.type == 6 || data.type == 4) && (
                <div className="show_symbol">
                  <span className={data.type == 6 ? 'group_blue' : 'group_green'}>
                    {data.type == 6 ? '全员' : '部门'}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="tips_footer">
        <span
          onClick={() => {
            ignoreAllChat()
          }}
        >
          忽略全部
        </span>
      </div>
    </div>
  )
}

export default ChatUnreadWin

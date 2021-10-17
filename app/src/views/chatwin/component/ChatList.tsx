import React, { useState, Fragment, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { List, message } from 'antd'
import { ipcRenderer } from 'electron'
import { addSubjectChat } from '../getData/getData'
import CreatGroupModal from './Modals/createGroupModal'
import {
  saveDraftMsg,
  fetchChatRoom,
  updateChatRoom,
  batchInsertChatRoom,
  insertChatRoom,
} from '../getData/ChatInputCache'
import { ignoreMucMessage } from '@/src/views/chat-Tip-Win/getData'
import '../styles/ChatList.less'
import ChatListItem from './ChatListItem'
import { getLocalRoomData } from '../../myWorkDesk/chat/ChatList'

const ChatListComponent: React.FC = () => {
  // 基本信息
  const { nowAccount, nowUserId, nowUser } = $store.getState()
  // 创建群聊模态框
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  // 获取聊天室负责人
  const chatListData = useSelector((state: StoreStates) => state.chatListData, shallowEqual)
  const openRoomIds = useSelector((state: StoreStates) => state.openRoomIds, shallowEqual)
  const chatListOpen = chatListData.filter((item: any) => {
    return openRoomIds.indexOf(item.roomId) !== -1 && item.windowClose === 0
  })
  // 当前选中的聊天室
  const selectItem = useSelector((state: StoreStates) => state.selectItem)

  useEffect(() => {
    if (!chatListOpen.length) {
      ipcRenderer.send('close_chat_win')
    }
  }, [chatListOpen.length])

  let sortArr: number[] = []
  useEffect(() => {
    if (!selectItem.roomId) {
      return
    }
    const { roomId } = selectItem
    // const mucId = muc.split('@')[0]
    // updateMsg(mucId).then(() => {
    // 选中的房间标记已读 取消列表红点
    const { nowUserId, chatListData } = $store.getState()
    let hasUnread = false
    chatListData?.forEach((item: any) => {
      if (item.roomId === roomId) {
        if (item['unreadCount'] !== 0) {
          hasUnread = true
          item['unreadCount'] = 0
        }
      }
    })
    if (hasUnread) {
      batchInsertChatRoom({ userId: nowUserId, data: chatListData })
      $store.dispatch({
        type: 'SET_CHAT_LIST',
        data: { chatListData: chatListData },
      })
      // getLocalRoomData(false, '')

      // $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: chatListData } })
      // 更新本地缓存
      // updateChatRoomDetail({ userId: nowUserId, data: chatListData })
    }
    // })
    // 更新闪烁状态
    const { unreadList } = $store.getState()
    const unReadRoom = unreadList?.filter((item: any) => {
      return item.roomId !== roomId
    })
    $store.dispatch({
      type: 'SAVE_UNREAD_INFO',
      data: unReadRoom,
    })
    ipcRenderer.send('change_tray_icon')
    // // 发送presence，通知他人自己进入聊天室，更新历史消息未读总数
    // ipcRenderer.send('add_new_chat_room', roomJid)

    // 定位当前选择聊天室的位置
    const documentHeight = $('#chat_list_main').prop('scrollHeight') || 0
    const windowHeight = $('#chat_list_main').height() || 0
    const scrollTop = $('#chat_list_main').scrollTop() || 0
    const sh = windowHeight + scrollTop
    if (Math.ceil(sh) <= documentHeight) {
      // 滚动到底部时
      sortArr = []
      chatListOpen.map((item, index) => {
        if (item.roomId === selectItem?.roomId) {
          !sortArr.includes(index) && sortArr.push(index)
        }
      })
      const offsetTop = sortArr[0] * 70
      $('#chat_list_main').scrollTop(offsetTop)
      const firstEle = sortArr.shift()
      if (firstEle) {
        sortArr.push(firstEle)
      }
    }
  }, [selectItem?.roomId])

  let arr: number[] = []
  const positonUnreadMsg = () => {
    const documentHeight = $('#chat_list_main').prop('scrollHeight') || 0
    const windowHeight = $('#chat_list_main').height() || 0
    const scrollTop = $('#chat_list_main').scrollTop() || 0
    const sh = windowHeight + scrollTop
    if (Math.ceil(sh) >= documentHeight) {
      // 滚动到底部时
      arr = []
      chatListOpen.map((item, index) => {
        if (item.remindType === 0 && item.unreadCount > 0) {
          !arr.includes(index) && arr.push(index)
        }
      })
      const offsetTop = arr[0] * 70
      $('#chat_list_main').scrollTop(offsetTop)
      const firstEle = arr.shift()
      if (firstEle) {
        arr.push(firstEle)
      }
      return
    }
    chatListOpen.map((item, index) => {
      if (item.remindType === 0 && item.unreadCount > 0) {
        !arr.includes(index) && arr.push(index)
      }
    })
    const len = parseInt(String(Math.ceil(scrollTop) / 70))
    // 滚动条在初始位置，第一个聊天室有未读消息
    if (arr[0] === len) {
      const firstEle = arr.shift()
      if (firstEle) {
        arr.push(firstEle)
      }
      const offsetTop = arr[0] * 70
      $('#chat_list_main').scrollTop(offsetTop)
      return
    }
    const datas = arr.every(item => {
      return item > len
    })
    if (datas) {
      // 默认从滚动条当前位置往下查找未读
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i]
        if (item > len) {
          const offsetTop = item * 70
          $('#chat_list_main').scrollTop(offsetTop)
          const backItem = arr.slice(i, arr.length)
          const frontItem = arr.slice(0, i)
          arr = backItem.concat(frontItem)
          break
        }
      }
    } else {
      // 滚动条滚动到底部存在多条未读无法滚动时，跳到第一条未读消息
      const offsetTop = arr[0] * 70
      $('#chat_list_main').scrollTop(offsetTop)
      const firstEle = arr.shift()
      if (firstEle) {
        arr.push(firstEle)
      }
    }
  }

  const handleCreateGroup = (inputVal: string, dataList: any[], headPhoto: string) => {
    const manager: any = { account: nowAccount, id: nowUserId, username: nowUser }
    const result = dataList.map(item => {
      if (item.curId == nowUserId) {
        manager.teamId = item.cmyId
      }
      return {
        account: item.account,
        id: item.curId,
        username: item.curName,
        teamId: item.cmyId,
      }
    })
    const params = {
      roomManager: manager,
      roomName: inputVal,
      headPhoto: headPhoto,
      roomMembers: result,
      type: 5,
    }
    addSubjectChat(params).then((res: any) => {
      const resData = res.data
      // 打开聊天室
      ipcRenderer.send('add_new_chat_room', res.obj.muc)
      const { chatListData, selectItem } = $store.getState()
      const isIn = chatListData.every((item: any) => {
        return item.roomId !== resData.roomId
      })
      // 添加打开的聊天室id
      $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, resData.roomId] })
      if (isIn) {
        const dataList = JSON.parse(JSON.stringify(chatListData))
        const data = [resData, ...dataList]
        insertChatRoom(resData)
        // 更新列表
        $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
        // getLocalRoomData(false, '')
        // 保存草稿
        saveDraftMsg(Object.assign({}, selectItem), resData, $store.dispatch)
        // 设置选中
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: resData })
        // 设置滚动条位置
        data.forEach((item: globalInterface.ChatListProps, index: number) => {
          if (item.id === resData.id) {
            const offsetTop = index * 70
            $('#chat_list_main').scrollTop(offsetTop - 100)
          }
        })
        // 更新本地数据库
        updateChatRoom(resData)
      }
    })
    setModalVisible(false)
  }

  // 全部已读
  const readAll = () => {
    const arrList: any = []
    chatListOpen.map((item: any) => {
      if (item.remindType !== 1 && item.unreadCount > 0) {
        arrList.push(item.id)
      }
    })
    if (!arrList.length) {
      return
    }
    ignoreMucMessage().then(() => {
      // 更新列表
      const { chatListData, unreadList } = $store.getState()
      const data = JSON.parse(JSON.stringify(chatListData))
      data.forEach((item: any) => {
        chatListOpen.map(record => {
          if (record.unreadCount > 0 && record.roomId === item.roomId) {
            item.unreadCount = 0
          }
        })
      })
      $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
      // 更新本地缓存
      const { nowUserId } = $store.getState()
      fetchChatRoom(nowUserId).then((localData: any) => {
        if (localData) {
          localData.forEach((item: any) => {
            chatListOpen.map(record => {
              if (item.remindType !== 1 && record.roomId === item.roomId && record.unreadCount > 0) {
                item.unreadCount = 0
                updateChatRoom(item)
              }
            })
          })
          // updateChatRoomDetail({ userId: nowUserId, data: localData })
        }
      })
      // getLocalRoomData(false, '')
      //刷新工作台头部沟通红点数量
      ipcRenderer.send('refresh_meet_connect', ['talk_count'])
      // 更新闪烁
      const unreadData = unreadList.filter(item => {
        const isIn = arrList.indexOf(item.id)
        return isIn === -1
      })
      $store.dispatch({
        type: 'SAVE_UNREAD_INFO',
        data: unreadData,
      })
      ipcRenderer.send('hide_tips_window')
      ipcRenderer.send('change_tray_icon')
      // 取消任务栏高亮显示
      ipcRenderer.send('force_cancel_flash')
    })
  }

  const isShowPosition = chatListOpen.some((item: any) => {
    if (item?.roomId === selectItem?.roomId) {
      return false
    } else {
      return item.remindType === 0 && item.unreadCount > 0
    }
  })
  return (
    <Fragment>
      <div className="left_top_btn">
        <span className="btn-position" onClick={positonUnreadMsg}>
          {isShowPosition && <i style={{ width: '8px', height: '8px' }}></i>} 未读定位
        </span>
        {/* <span className="read-all" onClick={readAll}>
          全部已读
        </span> */}
      </div>
      <div className="chat_list_main" id="chat_list_main">
        <List>
          {chatListOpen.map((dataItem: any, index: number) => {
            return (
              <ChatListItem
                key={dataItem.roomId}
                keyNumber={index}
                actived={dataItem.roomId === selectItem.roomId}
                dataItem={dataItem}
              />
            )
          })}
        </List>
        {/* {isShowPosition && (
        <Tooltip placement="top" title="未读消息定位">
          <div className="btn-positon" id="btn-positon" onClick={positonUnreadMsg}>
            <img src={$tools.asAssetsPath('/images/chatwin/positon.svg')} />
          </div>
        </Tooltip>
      )} */}
        {modalVisible && (
          <CreatGroupModal
            title="创建群聊"
            visible={modalVisible}
            closeModal={() => setModalVisible(false)}
            onOk={handleCreateGroup}
          />
        )}
      </div>
    </Fragment>
  )
}

export default ChatListComponent

import React, { useEffect, useState } from 'react'
import { Button, Tooltip, Input, message } from 'antd'
import $c from 'classnames'
import moment from 'moment'
import SearchCategoryList from './SearchCategoryList'
import { useMergeState } from '@/src/views/chatwin/chatwin'
import { recordLeaveTime, sendPrevateTalk } from '@/src/views/chatwin/getData/getData'
import CreatGroupModal from '@/src/views/chatwin/component/Modals/createGroupModal'
import { addSubjectChat, openWindow } from '@/src/views/chatwin/getData/getData'
import { updateWindowState } from '@/src/views/chatwin/getData/getData'
import '@/src/views/chatwin/styles/ChatSearch.less'
import { ipcRenderer } from 'electron'
import { insertChatRoom, updateChatRoom } from '../../chatwin/getData/ChatInputCache'
import { getLocalRoomData } from './ChatList'

const ChatSearch: React.FC = () => {
  // 基本信息
  const { nowAccount, nowUserId, nowUser } = $store.getState()
  // 发起讨论、添加讨论成员模态框
  const [modalVisible, setModalVisible] = useState(false)
  // 搜索聊天室
  const [searchState, setSearchState] = useMergeState({
    keywords: '',
    clickSearchState: false,
    showClear: false,
  })

  useEffect(() => {
    //点击空白处
    jQuery('.chat-container')
      .off()
      .on('click', function(e: any) {
        // 排除图片预览，减少不必要的渲染
        if (e.target.className !== 'img_around' && e.target.className !== 'img_box') {
          const _con = jQuery('.left_chat_list') // 设置目标区域
          if (!_con.is(e.target) && _con.has(e.target).length === 0) {
            if (searchState.clickSearchState || searchState.showClear) {
              setSearchState({
                clickSearchState: false,
                showClear: false,
              })
            }
          }
        }
      })
  }, [searchState.clickSearchState, searchState.showClear])

  const openRoom = async (resData: any) => {
    // 打开沟通窗口
    const { chatListData, openRoomIds, selectItem, messageList } = $store.getState()
    const dataList = JSON.parse(JSON.stringify(chatListData))
    const data = [...dataList, resData]
    insertChatRoom(resData)
    // 列表排序
    data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
      if (a.isTop === b.isTop) {
        return moment(b.timeStamp).valueOf() - moment(a.timeStamp).valueOf()
      }
      return b.isTop - a.isTop
    })
    const newIds = [...openRoomIds, resData.roomId]
    // 记录离开群的时间
    if (resData?.roomId !== selectItem?.roomId && selectItem?.roomId) {
      const params = {
        roomId: selectItem?.roomId,
        userId: nowUserId,
      }
      recordLeaveTime(params).then(() => null)
    }
    // 简略消息
    const briefMsg = {
      roomType: resData.type,
      roomId: resData.roomId,
    }
    const newBriefList = [briefMsg, ...messageList]
    // 更新简略信息
    $store.dispatch({ type: 'SET_CHAT_MESSAGE', data: { messageList: newBriefList || [] } })
    ipcRenderer.send('show_commuciate_muc', [selectItem, resData])
    // 保存当前在独立窗口打开的聊天室
    $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
    // 更新列表
    await $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
    // await getLocalRoomData(false, 'time')
    // 设置滚动条的位置
    const resultData = chatListData.filter(item => {
      return newIds.indexOf(item.roomId) !== -1
    })
    resultData.map((item: any, index: number) => {
      if (item.roomId === resData.roomId) {
        const offsetTop = index * 62
        $('#chat_list_main').scrollTop(offsetTop - 100)
      }
    })
    // 更新本地数据库
    updateChatRoom(resData)
  }

  const handlePositionChatItem = (record: any, type: any) => {
    const { chatListData, openRoomIds, selectItem, nowUserId } = $store.getState()
    let clickId: number | null = null
    if (type === 'group') {
      clickId = record.roomId
    } else {
      // 当前选择的列表
      const targetLIst = chatListData.filter((item: any) => item.typeId === record.id)
      clickId = targetLIst.length && targetLIst[0].roomId
    }
    const params = {
      roomId: clickId,
      state: 0,
      userId: nowUserId,
    }
    const data = JSON.parse(JSON.stringify(chatListData))
    let isIn = false
    let newIds = [...openRoomIds]
    // 点击后更新当前聊天室的状态
    let newList: any = []
    newList = data.map((item: any) => {
      if (item.roomId === clickId) {
        updateChatRoom({
          ...item,
          windowClose: 0,
        })
        return {
          ...item,
          windowClose: 0,
        }
      }
      return item
    })
    data.map((item: any) => {
      if (item.roomId === clickId) {
        isIn = true
        const isRoomOpen = openRoomIds.some(thisId => {
          return thisId === item.roomId
        })

        // 记录离开群的时间
        if (item?.roomId !== selectItem?.roomId && selectItem?.roomId) {
          const params = {
            roomId: selectItem.roomId,
            userId: nowUserId,
          }
          recordLeaveTime(params).then(() => null)
        }

        // 更新列表
        $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: newList } })
        // getLocalRoomData(false, '')
        if (!isRoomOpen) {
          // 判断聊天室是否打开（是否存在聊天室列表）
          newIds = [...openRoomIds, item.roomId]
          $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
        }
        // 打开聊天窗口
        ipcRenderer.send('show_commuciate_muc', [selectItem, item])
      }
    })
    // 判断聊天室是否打开（是否存在聊天室列表）
    if (isIn) {
      // 筛选出当前选择行的数据
      const targetListData = chatListData.filter((item: any) => {
        return item.roomId === clickId
      })
      // 设置滚动条的位置
      const resultData = chatListData.filter(item => {
        return newIds.indexOf(item.roomId) !== -1
      })
      // 更新当前选择行的状态
      if (targetListData[0]?.windowClose === 1) {
        // 更新聊天室状态
        updateWindowState(params).then(() => null)
      }
      resultData.map((item: any, index: number) => {
        if (
          (type === 'personal' && item.typeId === record.id) ||
          (type === 'group' && item.roomId === record.roomId)
        ) {
          const offsetTop = index * 62
          $('#chat_list_main').scrollTop(offsetTop - 100)
        }
      })
    } else {
      // 请求接口打开聊天室
      if (type == 'personal') {
        // 当前人的信息
        const manager: any = { account: nowAccount, id: nowUserId, username: nowUser }
        // 私聊人的信息
        const result = [
          {
            id: record.id,
            username: record.username,
          },
        ]
        // 创建聊天室所需参数
        const params = {
          roomManager: manager,
          roomName: record.username,
          // headPhoto: record.profile ? record.profile : '',
          roomMembers: result,
          type: 3,
        }
        addSubjectChat(params).then((resData: any) => {
          openRoom(resData)
        })
      }
    }
    setSearchState({
      showClear: false,
      clickSearchState: false,
      keywords: '',
    })
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

    addSubjectChat(params).then(async (resData: any) => {
      // 打开聊天室
      ipcRenderer.send('add_new_chat_room', resData.roomJid)
      const { chatListData, openRoomIds, selectItem, messageList } = $store.getState()
      const isNot = chatListData.every((item: any) => {
        return item.roomId !== resData.roomId
      })
      // 添加打开的聊天室id
      // 打开聊天窗口
      ipcRenderer.send('show_commuciate_muc', [selectItem, resData])
      $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, resData.roomId] })
      if (isNot) {
        const data = [resData, ...chatListData]
        insertChatRoom(resData)
        // 列表排序
        data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
          if (a.isTop === b.isTop) {
            return moment(b.timeStamp).valueOf() - moment(a.timeStamp).valueOf()
          }
          return b.isTop - a.isTop
        })
        // 简略消息
        const briefMsg = {
          roomType: resData.type,
          roomId: resData.roomId,
        }
        // 更新简略消息
        const newBriefList = [briefMsg, ...messageList]
        // 更新简略信息
        $store.dispatch({ type: 'SET_CHAT_MESSAGE', data: { messageList: newBriefList || [] } })
        // 更新列表
        await $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
        // await getLocalRoomData(false, 'time')
        // 设置滚动条位置
        $('#chat_list_main').scrollTop(0)
        // 保存当前在独立窗口打开的聊天室id
        $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, resData.roomId] })
        // 更新本地数据库
        updateChatRoom(resData)
      }
    })
    setModalVisible(false)
  }

  // 输入文字搜索聊天室列表
  const changeValue = (e: any) => {
    const value = e.target.value
    if (value.indexOf('%') == -1) {
      setSearchState({
        clickSearchState: value.trim() !== '',
        keywords: value,
      })
    }
  }

  return (
    <div className="chat_list_search flex">
      <Input.Search
        allowClear
        bordered={false}
        value={searchState.keywords}
        placeholder="搜索群组，联系人"
        prefix={
          <span
            className="search-icon-boxs"
            onClick={() => {
              setSearchState({
                keywords: searchState.keywords,
              })
            }}
          >
            <em className="search-icon-t-btn"></em>
          </span>
        }
        className="search-input-new"
        onFocus={() => {
          setSearchState({ showClear: true })
        }}
        onChange={changeValue}
        maxLength={15}
      ></Input.Search>
      <Tooltip placement="bottom" title="发起讨论">
        <Button className="add_new_chat" onClick={() => setModalVisible(true)}></Button>
      </Tooltip>
      {searchState.clickSearchState && (
        <SearchCategoryList
          keywords={searchState.keywords}
          refcallback={(item: any, type: any) => handlePositionChatItem(item, type)}
        />
      )}
      {/* 创建群聊模态框 */}
      {modalVisible && (
        <CreatGroupModal
          title="创建群聊"
          visible={modalVisible}
          closeModal={() => setModalVisible(false)}
          onOk={handleCreateGroup}
        />
      )}
      {/* <div className={$c('search_box_wrap', { 'search-clear-show': searchState.showClear })}>
        <div
          className={$c('search_box')}
          onClick={() => {
            setSearchState({
              showClear: false,
              clickSearchState: false,
              keywords: '',
            })
          }}
        ></div>
      </div> */}
    </div>
  )
}

export default ChatSearch

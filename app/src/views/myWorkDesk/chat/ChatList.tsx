import React, { useState, useEffect, Fragment, useLayoutEffect, memo, useCallback } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Button, Spin, message as antMsg, message } from 'antd'
import moment from 'moment'
import { CloseOutlined } from '@ant-design/icons'
import { ipcRenderer } from 'electron'
import { addSubjectChat, openWindow, queryListData } from '@/src/views/chatwin/getData/getData'
import CreatGroupModal from '@/src/views/chatwin/component/Modals/createGroupModal'
import InfiniteScroll from 'react-infinite-scroller'
import ChatListItem from './ChatListItem'
import $c from 'classnames'
import {
  saveDraftMsg,
  batchInsertChatRoom,
  fetchChatRoom,
  checkSqliteTable,
  batchInsertSqlbrief,
  queryLocalAllbrief,
  queryRoomAllDraft,
  deleteNowUserRoom,
  deleteNowUserBrief,
  insertChatRoom,
  updateChatRoom,
} from '@/src/views/chatwin/getData/ChatInputCache'
import { findUserUnReadMuc, ignoreMucMessage } from '@/src/views/chat-Tip-Win/getData'
import '@/src/views/chatwin/styles/ChatList.less'
import { useMemo } from 'react'
import { getUnreadDot } from '../../task/ChatWindowTip/ChatWindowTip'
import { areEqual, FixedSizeGrid as Grid, FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { useRef } from 'react'
export interface ChatItemProps {
  roomId: number
  ascriptionName: string
  ascriptionId: number
  deptId: number | null
  isTop: number
  isAtMe: number
  roomJid: string
  profile: string | null
  remindType: number
  roomName: string
  talkType?: string | null
  timeStamp: number | null
  type: number
  typeId: number
  unreadCount: number
  windowClose: number | null
}
// export const { Provider, Consumer } = React.createContext({})

/**
 * @param isQuery 初始化查询数据库,否则不查询接口
 * @param sortWay 排序方式
 */
//1.初始化校验聊天室chatroom2表是否存在 存在才走缓存逻辑
const roomSql = `SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'chat_room'`
const briefSql = `SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'brief_message'`
const draftSql = `SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'room_draft'`
export const getLocalRoomData = (isQuery: boolean, sortWay: string, roomData?: any) => {
  const { nowUserId } = $store.getState()
  //查询本地聊天室
  checkSqliteTable(roomSql).then((num: any) => {
    if (num) {
      fetchChatRoom(nowUserId).then((localData: any) => {
        // console.log('查询的聊天室缓存数据', localData)
        //如果存在聊天室缓存数据则进行加载...
        if (localData) {
          const arr = sortTimeStamp(localData || [], sortWay)
          $store.dispatch({
            type: 'SET_CHAT_LIST',
            data: { chatListData: arr },
          })
        } else {
          $store.dispatch({
            type: 'SET_CHAT_LIST',
            data: { chatListData: roomData || [] },
          })
        }
      })
    }
  })
}

export const getLocalBrief = () => {
  const { nowUserId } = $store.getState()
  //查询本地简略消息
  checkSqliteTable(briefSql).then((num: any) => {
    if (num) {
      queryLocalAllbrief(nowUserId).then((briefData: any) => {
        console.log('缓存简略消息', briefData)
        $store.dispatch({
          type: 'SET_CHAT_MESSAGE',
          data: { messageList: briefData || [] },
        })
      })
    }
  })
}

//聊天室通过sortWay排序
const sortTimeStamp = (roomList: any, sortWay: string) => {
  if (!sortWay) {
    return roomList
  }
  const arrRooms = roomList.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
    if (a.isTop === b.isTop) {
      if (sortWay === 'time') {
        return moment(b.timeStamp).valueOf() - moment(a.timeStamp).valueOf()
      } else {
        return (b.isFirst || 0) - (a.isFirst || 0)
      }
    }
    return b.isTop - a.isTop
  })
  return arrRooms
}

const ChatListComponent: React.FC = () => {
  // 基本信息
  const { nowAccount, nowUserId, nowUser, chatDrafMsg } = $store.getState()
  // 创建群聊模态框
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  // 获取聊天室负责人
  const chatListData = useSelector((state: StoreStates) => state.chatListData, shallowEqual)
  const newDataList = useSelector((state: StoreStates) => state.newDataList, shallowEqual)
  // 当前选中的聊天室
  const selectItem = useSelector((state: StoreStates) => state.selectItem, shallowEqual)
  // 初始化方法
  useEffect(() => {
    // //===============================修改聊天室缓存-简略消息缓存========================================================================
    //查询本地草稿
    queryRoomAllDraft(nowUserId).then((draftData: any) => {
      if (draftData) {
        const arr = draftData.filter((item: any) => !!item.manuscript)
        const entity = arr.map((_item: any) => {
          const { roomJid, userId, manuscript: content } = _item
          return { roomJid, userId, content }
        })
        console.log('SET_CHA_TMSG', entity)
        $store.dispatch({
          type: 'SET_CHA_TMSG',
          data: entity,
        })
      }
    })

    //请求接口查询最新的聊天室信息
    queryListData().then((data: any) => {
      //如果接口返回异常则从缓存中获取聊天室以及简略消息
      console.log('data', data)
      if (data === 0) {
        //初始化从缓存中获取聊天室数据
        getLocalRoomData(false, 'time')
        //初始化从缓存中获取简略消息
        getLocalBrief()
      } else {
        const chatRooms = data.roomList || []
        const briefMessage = data.messageList || []
        const sortData = sortTimeStamp(chatRooms, 'time')

        $store.dispatch({
          type: 'SET_CHAT_LIST',
          data: { chatListData: sortData },
        })

        $store.dispatch({
          type: 'SET_CHAT_MESSAGE',
          data: { messageList: briefMessage },
        })
        //校验表是否存在
        checkSqliteTable(roomSql).then((num: any) => {
          if (num) {
            if (chatRooms && chatRooms.length > 0) {
              //存入之前先清空当前聊天室
              deleteNowUserRoom(nowUserId).then(() => {
                //插入本地数据库
                batchInsertChatRoom({ userId: nowUserId, data: sortData || [] })
              })
            }
          }
        })
        checkSqliteTable(briefSql).then(async (num: any) => {
          if (num) {
            //缓存简略消息
            if (briefMessage && briefMessage.length > 0) {
              //存入之前先清空当前聊天室简略消息
              deleteNowUserBrief(nowUserId).then(() => {
                batchInsertSqlbrief(briefMessage)
              })
            }
          }
        })
      }
    })
  }, [])

  let arr: number[] = []
  const positonUnreadMsg = () => {
    const documentHeight = $('#chat_list_main').prop('scrollHeight') || 0
    const windowHeight = $('#chat_list_main').height() || 0
    const scrollTop = $('#chat_list_main').scrollTop() || 0
    const sh = windowHeight + scrollTop
    if (Math.ceil(sh) >= documentHeight) {
      // 滚动到底部时
      arr = []
      newDataList.map((item, index) => {
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
    newDataList.map((item, index) => {
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
    addSubjectChat(params).then(async (res: any) => {
      const { chatListData, openRoomIds, selectItem } = $store.getState()
      const resData = { ...res.data, isOpen: true }
      // 打开聊天室
      ipcRenderer.send('add_new_chat_room', resData.roomJid)
      const isNot = chatListData.every((item: any) => {
        return item.roomId !== resData.roomId
      })
      // 打开聊天窗口
      ipcRenderer.send('show_commuciate_muc', [selectItem, resData])
      if (isNot) {
        const data = [resData, ...chatListData]
        insertChatRoom(resData)
        // 更新列表
        $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
        // getLocalRoomData(false, '')
        // 保存当前在独立窗口打开的聊天室id
        $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, resData.roomId] })
        // 设置滚动条位置
        $('#chat_list_main').scrollTop(0)
        // 更新本地数据库
        batchInsertChatRoom({ userId: nowUserId, data: [resData] })
        // updateChatRoomDetail({ userId: nowUserId, data })
      }
    })
    setModalVisible(false)
  }

  // 全部已读
  const readAll = () => {
    ignoreMucMessage().then(() => {
      // 更新列表
      const { chatListData } = $store.getState()
      const data = JSON.parse(JSON.stringify(chatListData))
      data?.forEach((item: any) => {
        // if (item.remindType !== 1 && item.unreadCount > 0) {
        //   item['unreadCount'] = 0
        // }
        if (item.unreadCount > 0) {
          item['unreadCount'] = 0
        }
      })
      $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })

      // 更新本地缓存
      const { nowUserId } = $store.getState()
      fetchChatRoom(nowUserId).then((localData: any) => {
        if (localData) {
          localData.forEach((item: any) => {
            // if (item.remindType !== 1 && item.unreadCount > 0) {
            //   item['unreadCount'] = 0
            // }
            if (item.unreadCount > 0) {
              item['unreadCount'] = 0
              updateChatRoom(item)
            }
          })
          // updateChatRoomDetail({ userId: nowUserId, data: localData })
        }
      })
      // getLocalRoomData(false, '')
      //刷新工作台头部沟通红点数量
      ipcRenderer.send('refresh_meet_connect', ['talk_count'])
      // 更新闪烁
      $store.dispatch({
        type: 'SAVE_UNREAD_INFO',
        data: [],
      })
      ipcRenderer.send('hide_tips_window')
      ipcRenderer.send('change_tray_icon')
      // 取消任务栏高亮显示
      ipcRenderer.send('force_cancel_flash')
    })
  }

  const isShowPosition = chatListData.some((item: any) => {
    if (item?.roomId === selectItem?.roomId) {
      return false
    } else {
      return item?.remindType === 0 && item?.unreadCount > 0
    }
  })

  const getUnreadList = (dataList: any) => {
    let unreadNum = 0
    dataList.map((item: any) => {
      if (item.windowClose === 0) {
        if (item.roomId === selectItem?.roomId) {
          return (item.unreadCount = 0)
        }
        if (item.remindType === 0) {
          unreadNum += item.unreadCount
        }
      }
    })
    getUnreadDot && getUnreadDot(unreadNum)
    if (unreadNum > 0) {
      return unreadNum > 99 ? '99+' : unreadNum
    }
    return ''
  }

  //渲染单个聊天室
  const Row = memo(({ index, style }: any) => {
    const item = newDataList[index]
    if (!item) {
      return null
    }
    return (
      <div style={style} key={item.roomId}>
        <ChatListItem keyNumber={index} dataItem={item} chatDrafMsg={chatDrafMsg} />
      </div>
    )
  }, areEqual)

  const renderChatList = useMemo(() => {
    return (
      <List className="roomWrap" height={638} itemCount={newDataList.length} itemSize={70} width={272}>
        {Row}
      </List>
    )
  }, [newDataList, chatDrafMsg])

  const showData = chatListData.filter((item: any) => item.windowClose === 0)
  const hasRead = getUnreadList(chatListData)
  return (
    <Fragment>
      <div className="left_top_btn">
        <span className="btn-position" onClick={positonUnreadMsg}>
          {isShowPosition && !!hasRead && <i className={$c({ largeIcon: hasRead === '99+' })}>{hasRead}</i>}{' '}
          未读定位
        </span>
        {/* <span className="read-all" onClick={readAll}>
          全部已读
        </span> */}
      </div>
      <div className="chat_list_main" id="chat_list_main">
        {!showData.length && (
          <div className="create_group_banner">
            {/* <CloseOutlined className="close_icon" /> */}
            <div className="line1">
              创建
              <span className="line_light">群聊</span>
            </div>
            <div className="line2">
              邀请同事加入群聊，即刻开启 <div>高效协作</div>
            </div>
            <Button
              className="btn"
              onClick={() => {
                setModalVisible(true)
              }}
            >
              去创建
            </Button>
          </div>
        )}
        {/*聊天室渲染性能优化*/}
        {renderChatList}
        {modalVisible && (
          <CreatGroupModal
            title="创建群聊"
            visible={modalVisible}
            closeModal={() => setModalVisible(false)}
            onOk={handleCreateGroup}
          />
        )}
      </div>
      {/* {loading && (
        <div style={{ position: 'absolute', bottom: '20px', left: '50%' }}>
          <Spin />
        </div>
      )} */}
    </Fragment>
  )
}

export default ChatListComponent

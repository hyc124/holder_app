import React, { useState, useCallback, memo } from 'react'
import { Dropdown, Button, Avatar, List, Badge, Menu } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import { ipcRenderer } from 'electron'
import moment from 'moment'
import { getAvatarEnums } from '@/src/views/chatwin/getData/ChatHandle'
import { setTop, setTrouble, updateWindowState, recordLeaveTime } from '@/src/views/chatwin/getData/getData'
import { ChatItemProps, getLocalRoomData } from './ChatList'
import { updateChatRoom } from '../../chatwin/getData/ChatInputCache'
import { findUserUnReadMuc } from '../../chat-Tip-Win/getData'
export const toFirst = (dataArr: any[], index: number) => {
  if (index !== 0) {
    dataArr.unshift(dataArr.splice(index, 1)[0])
  }
}

// 取消聊天室置顶
export const toNormalFirst = (dataArr: any[], index: number) => {
  let firstNormalIndex = 0
  dataArr.forEach(item => {
    if (item.isTop === 1) {
      firstNormalIndex += 1
    }
    return item
  })
  dataArr.splice(firstNormalIndex, 0, dataArr.splice(index, 1)[0])
}

let setChatTop: any = null
export const handleSetChatTop = (isTop: number, rmId: number) => {
  setChatTop(isTop, rmId)
}

let changeMsgType: any = null
export const handleChangeMsgType = (remindType: number, rmId: number) => {
  changeMsgType(remindType, rmId)
}

interface ListItemType {
  dataItem: ChatItemProps
  keyNumber: number
  chatDrafMsg: any
}

const ChatListItem: React.FC<ListItemType> = props => {
  const { keyNumber, dataItem, chatDrafMsg } = props
  // 右键菜单状态
  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  // 置顶
  setChatTop = (isTop: number, rmId: number) => {
    const { nowUserId, chatListData, selectItem } = $store.getState()
    const param = {
      roomId: rmId,
      userId: nowUserId,
      topState: isTop,
    }
    setTop(param).then(() => {
      let selectIndex = 0
      // 更新列表置顶状态
      const data = JSON.parse(JSON.stringify(chatListData))
      data.map((item: any, index: number) => {
        if (item.roomId === rmId) {
          item.isTop = isTop
          selectIndex = index
          //更新本地缓存聊天室的置顶状态
          updateChatRoom(item)
        }
      })
      // 置顶
      if (isTop === 1) {
        toFirst(data, selectIndex)
      } else {
        // 取消置顶
        toNormalFirst(data, selectIndex)
      }
      // getLocalRoomData(false, 'isFirst', { isTop, selectIndex })
      $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
      // 更新本地数据库
      // updateChatRoomDetail({ userId: nowUserId, data: data })
      $store.dispatch({ type: 'SET_SELECT_ITEM', data: { ...selectItem, isTop: isTop } })
    })
  }

  // 消息免打扰
  changeMsgType = (remindType: number, rmId: number) => {
    const { nowUserId, chatListData, unreadList, selectItem } = $store.getState()
    const param = {
      roomId: rmId,
      userId: nowUserId,
      remindType: remindType,
    }
    setTrouble(param).then(() => {
      const data = JSON.parse(JSON.stringify(chatListData))
      data?.map((item: any) => {
        if (item.roomId === rmId) {
          item['remindType'] = remindType
          updateChatRoom(item)
        }
      })

      //过滤掉闪烁消息（免打扰的数据）
      // const rData = unreadList.filter((item: any) => {
      //   return item.remindType === 0
      // })
      // if (rData && rData.length > 0) {
      //   $store.dispatch({
      //     type: 'SAVE_UNREAD_INFO',
      //     data: rData || [],
      //   })
      // }
      //重新调用未读接口
      // 查询未读闪烁
      findUserUnReadMuc().then((list: any) => {
        if (list.length > 0) {
          ipcRenderer.send('change_tray_icon')
        }
      })
      //刷新工作台头部沟通红点数量
      ipcRenderer.send('refresh_meet_connect', ['talk_count'])
      $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
      // getLocalRoomData(false, '')
      // 更新本地数据库
      // updateChatRoomDetail({ userId: nowUserId, data: data })
      if (selectItem.roomId === rmId) {
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: { ...selectItem, remindType: remindType } })
      }
    })
  }

  // 从列表移除聊天室:state 1:关闭聊天室 state 0:打开聊天室
  const handleRemove = (e?: any) => {
    e?.preventDefault()
    e?.stopPropagation()
    const { nowUserId } = $store.getState()
    const params = {
      roomId: dataItem.roomId,
      state: 1,
      userId: nowUserId,
    }
    updateWindowState(params).then(() => {
      if (dataItem.unreadCount) {
        //刷新工作台头部沟通红点数量
        ipcRenderer.send('refresh_meet_connect', ['talk_count'])
      }
      // 更新未读闪烁
      if (dataItem.unreadCount) {
        const { unreadList } = $store.getState()
        const list = JSON.parse(JSON.stringify(unreadList))
        const resultData = list?.filter((item: any) => {
          return item.id !== dataItem.roomId
        })
        $store.dispatch({
          type: 'SAVE_UNREAD_INFO',
          data: resultData,
        })
        ipcRenderer.send('change_tray_icon')
      }
      // 更新列表数据
      const { selectItem, chatListData, openRoomIds, unreadList } = $store.getState()
      const data = JSON.parse(JSON.stringify(chatListData))
      // const newList = data.map((item: any) => {
      //   if (item.roomId === dataItem.roomId) {
      //     updateChatRoom({
      //       ...item,
      //       unreadCount: 0,
      //       windowClose: 1,
      //     })
      //     return {
      //       ...item,
      //       unreadCount: 0,
      //       windowClose: 1,
      //     }
      //   }
      //   return item
      // })

      for (let i = 0; i < data.length; i++) {
        if (data[i].roomId === dataItem.roomId) {
          data[i].unreadCount = 0
          data[i].windowClose = 1
          updateChatRoom({
            ...data[i],
            unreadCount: 0,
            windowClose: 1,
          })
          break
        }
      }
      // 更新当前在独立窗口打开的聊天室id
      const ids = openRoomIds.filter(item => {
        return item !== dataItem.roomId
      })
      $store.dispatch({ type: 'SET_OPENROOM_IDS', data: ids })
      // 清空选中
      if (selectItem.roomId === dataItem.roomId && ids.length) {
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: {} })
      }
      // 更新列表
      $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
      // getLocalRoomData(false, '')
      //更新右下角闪烁
      const newUnRead = unreadList.filter((item: any) => item.roomId !== dataItem.roomId)
      $store.dispatch({
        type: 'SAVE_UNREAD_INFO',
        data: newUnRead || [],
      })
    })
  }

  //渲染显示时间
  const showTime = (dataItem: any) => {
    const time = dataItem.timeStamp
    const currentTime = moment(time).format('YYYY/MM/DD HH:mm')
    let showTime = ''
    const NEWdataWrong = new Date(new Date().toDateString()).getTime()
    //时间显示(如果是当天时间 则显示为 小时:分钟 非当天时间则显示 年月日 小时:分钟)
    if (time != null && time != '') {
      if (NEWdataWrong == Date.parse(currentTime.split(' ')[0])) {
        showTime = currentTime.split(' ')[1]
      } else {
        showTime = currentTime.split(' ')[0].substring(5)
      }
    }
    return showTime
  }

  //渲染红点状态
  const getRedDotStatus = (dataItem: any) => {
    const { selectItem } = $store.getState()
    if (dataItem.unreadCount) {
      const { unreadCount, roomId, remindType } = dataItem
      if (unreadCount == 0 || unreadCount == null || roomId === selectItem.roomId) {
        // 当前选中的房间
        return 0
      } else if (remindType == 1 && unreadCount > 0) {
        // 设置了消息免打扰的房间
        return unreadCount
      } else {
        return unreadCount
      }
    }
  }

  // 获取草稿
  const getDraft = (dataItem: any) => {
    const { nowUserId, selectItem, chatDrafMsg } = $store.getState()
    //读取本地缓存的未发送消息
    if (dataItem.roomId === selectItem.roomId) {
      return ''
    }
    let htmlStr = ''
    if (chatDrafMsg) {
      for (let i = 0; i < chatDrafMsg?.length; i++) {
        if (chatDrafMsg[i].roomJid == dataItem.roomJid && chatDrafMsg[i].userId == nowUserId) {
          htmlStr = chatDrafMsg[i].content
          break
        }
      }
      return htmlStr
    }
  }
  // 根据聊天室消息的类型渲染对应的简略信息
  const renderMsgByType = (messageJson: any, type: number) => {
    // 普通消息
    if (type === 1) {
      const newMsg = String(messageJson)
        ?.replace($tools.regEmoji, '[表情]')
        ?.replace($tools.regImg1, '')
        ?.replace($tools.regCharacter, '')
      return `${newMsg}`
    }
    const messageObj = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
    // @消息
    if (type === 2) {
      let { content } = messageObj
      content = content
        ?.replace($tools.regScreenImg, '[截图]')
        ?.replace($tools.regEmoji, '')
        ?.replace($tools.regCharacter, '')
      return content
    }
    // 文件消息
    if (type === 3) {
      const { displayName } = messageObj
      const ext = displayName
        ?.toLowerCase()
        ?.split('.')
        ?.splice(-1)[0]
      if ($tools.videoFormatArr.includes(ext)) {
        return `【视频】${displayName}`
      } else if ($tools.imgFormatArr.includes(ext)) {
        return `【图片】${displayName}`
      } else if ($tools.audioFormatArr.includes(ext)) {
        return `【音频】${displayName}`
      } else {
        return `【文件】${displayName ? displayName : ''}`
      }
    }
    // 地图消息
    if (type === 4) {
      return '【位置】'
    }
    // 回复消息
    if (type === 5) {
      const newReplyMsg = $tools.isJsonString(messageObj) ? JSON.parse(messageObj) : messageObj
      const { content } = newReplyMsg || {}
      const newMsg = content
        ?.replace($tools.regEmoji, '[表情]')
        ?.replace($tools.regImg1, '')
        ?.replace($tools.regCharacter, '')
      return `${newMsg}`
    }
    // 分享消息
    if (type === 6) {
      return '【引用消息】'
    }
  }

  // 渲染最新简略消息
  const renderNewMsg = (dataItem: any) => {
    const messageList = $store.getState().messageList || []
    let cacheDraftText = getDraft(dataItem)

    if (cacheDraftText) {
      if (cacheDraftText.indexOf('span') != -1 && cacheDraftText.indexOf('datasrc=') != -1) {
        cacheDraftText = cacheDraftText.replace($tools.regSpan, '[截图]')
      }
      cacheDraftText = cacheDraftText
        .replace($tools.regEmoji1, '[表情]')
        .replace($tools.regImg, '[图片]')
        .replace($tools.regButton, '')
        .replace($tools.regSpace1, '')
        .replace($tools.regDiv, '')
        .replace($tools.regLineFeed1, '')
      return (
        <span className="flex">
          <span style={{ color: 'red' }}>【草稿】</span>
          <span className="text-ellipsis" dangerouslySetInnerHTML={{ __html: cacheDraftText }}></span>
        </span>
      )
    } else {
      const currentBriefMsg = messageList && messageList.filter((item: any) => item.roomId === dataItem.roomId)
      const { messageJson, roomType, fromUser, isRecall, type } = (currentBriefMsg && currentBriefMsg[0]) || {}
      // if (dataItem.mucRelationNoticeModel != null) {
      //   // const value = `${content.name}：${content.msg}`
      //   // return (
      //   //   <span className="text-ellipsis">
      //   //     <b style={{ color: '#FFAC1B' }}>【有新公告】</b>
      //   //     <span dangerouslySetInnerHTML={{ __html: value }}></span>
      //   //   </span>
      //   // )
      // } else
      if (messageJson && type !== 0) {
        // 获取当前用户的id
        const { nowUserId } = $store.getState()
        // 当前聊天室对应的简略信息
        const $msg = $tools.isJsonString(fromUser) ? JSON.parse(fromUser) : fromUser
        const { username, userId } = $msg || {}
        let currentBrief: any = ''
        // 撤回消息
        if (isRecall === 1) {
          if (nowUserId === userId) {
            currentBrief = '你撤回了一条消息'
          } else {
            currentBrief = `${username}撤回了一条消息`
          }
        } else {
          currentBrief = renderMsgByType(messageJson, type)
        }
        // 简略消息
        let renderMsg = roomType !== 3 ? username + '：' + currentBrief : currentBrief
        renderMsg = type === 4 ? `${username}分享了位置信息` : renderMsg
        // 简略消息中特殊字符替换
        const briefMsg = renderMsg?.replace(/&amp;/g, '&')?.replace(/&nbsp;/g, ' ')
        return (
          <span className="text-ellipsis" dangerouslySetInnerHTML={{ __html: briefMsg ? briefMsg : '' }}></span>
        )
      } else {
        return <span className="text-ellipsis"></span>
      }
    }
  }

  const menuClick = (menuItem: any) => {
    // 隐藏右键菜单
    setMenuVisible(false)
    const rmId = dataItem.roomId
    switch (menuItem.key) {
      case 'setTop':
        // 置顶
        const isTop = dataItem.isTop ? 0 : 1
        setChatTop(isTop, rmId)
        break
      case 'remove':
        // 移除聊天室
        handleRemove()
        break
      case 'setTrouble':
        // 免打扰
        const remindType = dataItem.remindType ? 0 : 1
        changeMsgType(remindType, rmId)
        break
      default:
        break
    }
  }

  const onDoubleClick = (dataItem: any) => {
    window?.getSelection()?.removeAllRanges()
    // 添加当前聊天数据
    const { openRoomIds, selectItem, nowUserId } = $store.getState()
    const isRoomOpen = openRoomIds.some(thisId => {
      return thisId === dataItem.roomId
    })

    // 记录离开群的时间
    if (dataItem?.roomId !== selectItem?.roomId && selectItem?.roomId) {
      if (selectItem?.roomId) {
        const params = {
          roomId: selectItem.roomId,
          userId: nowUserId,
        }
        recordLeaveTime(params).then(() => null)
      }
    }

    // 隐藏@人框
    $('.tribute-container').remove()
    // 保存当前在独立窗口打开的聊天室id
    if (!isRoomOpen) {
      $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, dataItem.roomId] })
    }
    // 打开或显示聊天窗口
    ipcRenderer.send('show_commuciate_muc', [selectItem, dataItem])
  }

  const menu = (
    <Menu selectable onClick={menuClick}>
      <Menu.Item key="setTop">
        <i className={dataItem.isTop === 1 ? 'icon_top_cancel ' : 'icon_top'}>
          {dataItem.isTop == 1 ? '取消置顶' : '置顶会话'}
        </i>
      </Menu.Item>
      <Menu.Item key="remove">
        <i className="icon_remove">从列表删除</i>
      </Menu.Item>
      <Menu.Item key="setTrouble">
        <i className={dataItem.remindType === 1 ? 'icon_trouble_cancel' : 'icon_trouble'}>
          {dataItem.remindType === 1 ? '接受新消息提醒' : '设为免打扰'}
        </i>
      </Menu.Item>
    </Menu>
  )

  // 单击选中聊天列表
  const handleClickItem = useCallback((e: any) => {
    const domItem = $(e.target)
    let $domId: any = ''
    const domRoomId = $(domItem).attr('data-roomId')
    if (domRoomId) {
      $domId = domRoomId
    } else {
      $domId = $(domItem)
        .parents('.chat_list_item')
        .attr('data-roomId')
    }
    const targetRoomId = $domId || '0'
    $('.chat_list_item').removeClass('active')
    $('[data-roomId="' + targetRoomId + '"]').addClass('active')
  }, [])

  return (
    <Dropdown
      visible={menuVisible}
      onVisibleChange={visible => {
        setMenuVisible(visible)
      }}
      overlay={menu}
      trigger={['contextMenu']}
      overlayClassName="dropdownMenu"
      getPopupContainer={(): any => {
        const items = document.getElementsByClassName('chat_list_item') || []
        let domHtml: any = ''
        for (let i = 0; i < items.length; i++) {
          const element = items[i]
          const roomId = element.getAttribute('data-roomId') || '0'
          if (Number(roomId) === dataItem.roomId) {
            domHtml = element
            break
          }
        }
        return domHtml
      }}
    >
      <List.Item
        onClick={e => {
          e.stopPropagation()
          handleClickItem(e)
        }}
        onDoubleClick={useCallback(() => onDoubleClick(dataItem), [])}
        className={`chat_list_item flex`}
        data-roomId={dataItem.roomId}
      >
        <div className="borderLine"></div>
        <Badge
          count={getRedDotStatus(dataItem)}
          className={dataItem.remindType === 1 ? 'gray-badge-count' : ''}
          offset={[-10, 0]}
          size="small"
          overflowCount={99}
        >
          {dataItem.type === 8 ? (
            <Avatar
              className="oa-avatar flex center"
              src={getAvatarEnums(dataItem.type, dataItem.roomName)}
              size={38}
            >
              {dataItem.roomName}
            </Avatar>
          ) : (
            <Avatar
              className={`oa-avatar flex center ${dataItem.type !== 3 ? 'compnay_group' : ''}`}
              src={
                dataItem.profile && dataItem.profile !== 'null'
                  ? $tools.htmlDecodeByRegExp(dataItem.profile)
                  : getAvatarEnums(dataItem.type, dataItem.roomName)
              }
              size={38}
            >
              {dataItem.roomName?.substr(-2, 2)}
            </Avatar>
          )}
        </Badge>
        <div className="chat_item_main_content flex-1">
          <div className="item-top flex center-v">
            <div className="title flex-1 flex center-v">
              <span className="text-ellipsis">{dataItem.roomName}</span>
              {dataItem.type == 6 && <span className="all_member">全员</span>}
              {dataItem.type == 4 && <span className="dept_member">部门</span>}
            </div>
            <span className="show-time">{showTime(dataItem)}</span>
          </div>
          <div className="new_msg flex center-v">
            {renderNewMsg(dataItem)}
            {dataItem.remindType === 1 ? <span className="not_disturb"></span> : ''}
          </div>
        </div>
        <div className="chat_item_right flex center column">
          <Button
            icon={<CloseCircleOutlined style={{ fontSize: '16px', color: '#70707a' }} />}
            onClick={e => handleRemove(e)}
          ></Button>
        </div>
        {dataItem.isTop === 1 ? <span className="is_show_top"></span> : ''}
      </List.Item>
    </Dropdown>
  )
}

// const compare = (prevProps: any, nextProps: any) => {
//   const prevItem = prevProps.dataItem
//   const nextItem = nextProps.dataItem
//   const preDrafMsg = prevProps.chatDrafMsg
//   const nextDrafMsg = nextProps.chatDrafMsg
//   if (
//     prevProps.keyNumber !== nextProps.keyNumber ||
//     prevItem.unreadCount !== nextItem.unreadCount ||
//     prevItem.timeStamp !== nextItem.timeStamp ||
//     prevItem.isTop !== nextItem.isTop ||
//     prevItem.remindType !== nextItem.remindType ||
//     prevItem.roomName !== nextItem.roomName ||
//     prevItem.profile !== nextItem.profile ||
//     preDrafMsg.length != nextDrafMsg.length
//   ) {
//     return false
//   }
//   return true
// }

export default memo(ChatListItem)

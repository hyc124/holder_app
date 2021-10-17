import React, { useState, memo } from 'react'
import { Dropdown, Button, Avatar, List, Badge, Menu } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import { ipcRenderer } from 'electron'
import moment from 'moment'
import { getAvatarEnums } from '../getData/ChatHandle'
import { recordLeaveTime, setTop, setTrouble } from '../getData/getData'
import { saveDraftMsg, getDraftReplyMsg, updateChatRoom } from '../getData/ChatInputCache'
import { getLocalRoomData } from '../../myWorkDesk/chat/ChatList'
import { findUserUnReadMuc } from '../../chat-Tip-Win/getData'
// 聊天室置顶
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

const ChatListItem: React.FC<any> = props => {
  const { keyNumber, actived, dataItem } = props
  // 右键菜单状态
  const [menuVisible, setMenuVisible] = useState(false)

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
      $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
      // getLocalRoomData(false, 'isFirst', { isTop, selectIndex })
      // 更新本地数据库
      // updateChatRoomDetail({ userId: $store.getState().nowUserId, data: data })
      if (selectItem.roomId === rmId) {
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: { ...selectItem, isTop: isTop } })
      }
    })
  }

  // 消息免打扰
  changeMsgType = (remindType: number, rmId: number) => {
    const { nowUserId, chatListData, selectItem } = $store.getState()
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
      //刷新工作台头部沟通红点数量
      ipcRenderer.send('refresh_meet_connect', ['talk_count'])
      $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
      // getLocalRoomData(false, '')
      // 更新本地数据库
      // updateChatRoomDetail({ userId: $store.getState().nowUserId, data: data })
      if (selectItem.roomId === rmId) {
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: { ...selectItem, remindType: remindType } })
      }
      //重新调用未读接口
      // 查询未读闪烁
      findUserUnReadMuc().then((list: any) => {
        if (list.length > 0) {
          ipcRenderer.send('change_tray_icon')
        }
      })
    })
  }

  // 从列表移除聊天室:state 1:关闭聊天室 state 0:打开聊天室
  const handleRemove = (e?: any) => {
    e?.preventDefault()
    e?.stopPropagation()
    // 更新列表数据
    const { chatListData, selectItem, openRoomIds } = $store.getState()
    const data = JSON.parse(JSON.stringify(chatListData))
    const ids = openRoomIds.filter(item => {
      return item !== dataItem.roomId
    })
    // 更新当前在独立窗口打开的聊天室id
    $store.dispatch({ type: 'SET_OPENROOM_IDS', data: ids })
    // 清空选中
    if (selectItem.roomId === dataItem.roomId && ids.length) {
      $store.dispatch({ type: 'SET_SELECT_ITEM', data: {} })
    }
    // 更新列表
    $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
    // getLocalRoomData(false, '')
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
    } else if (chatDrafMsg) {
      let text = ''
      for (let i = 0; i < chatDrafMsg?.length; i++) {
        if (chatDrafMsg[i].roomJid == dataItem.roomJid && chatDrafMsg[i].userId == nowUserId) {
          text = chatDrafMsg[i].content
        }
      }
      return text
    } else {
      return ''
    }
  }

  // 根据聊天室消息的类型渲染对应的简略信息
  const renderMsgByType = (messageJson: any, type: number) => {
    // 普通消息
    if (type === 1) {
      const newMsg = String(messageJson)
        .replace($tools.regEmoji, '[表情]')
        .replace($tools.regImg1, '')
        .replace($tools.regCharacter, '')
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
      const replyMsg = $tools.isJsonString(messageObj) ? JSON.parse(messageObj) : messageObj
      const { content } = replyMsg || {}
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
    const { messageList } = $store.getState()
    const replyDraftMsg = getDraftReplyMsg(dataItem)
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
    } else if (replyDraftMsg && replyDraftMsg.roomId === dataItem.roomId) {
      return (
        <span className="flex">
          <span style={{ color: 'red' }}>【草稿】</span>
          <span className="text-ellipsis">......</span>
        </span>
      )
    } else {
      const currentBriefMsg = messageList && messageList.filter((item: any) => item.roomId === dataItem.roomId)
      const { messageJson, roomType, fromUser, isRecall, type, msgUuid } =
        (currentBriefMsg && currentBriefMsg[0]) || {}
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

  const itemClick = (dataItem: any) => {
    $('.chat_list_item').removeClass('active')
    $('.chat_list_item')
      .eq(keyNumber)
      .addClass('active')
    // 隐藏@人框
    $('.tribute-container').remove()
    const { selectItem, nowUserId } = $store.getState()
    // 记录离开群的时间
    if (dataItem?.roomId !== selectItem?.roomId && selectItem?.roomId) {
      const params = {
        roomId: selectItem.roomId,
        userId: nowUserId,
      }
      recordLeaveTime(params).then(() => null)
    }
    // 设置本地缓存聊天框输入内容
    saveDraftMsg(Object.assign({}, selectItem), dataItem, $store.dispatch)
    $store.dispatch({ type: 'SET_SELECT_ITEM', data: dataItem })
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

  const renderSendIcon = (selectId: string) => {
    // if (roomId === selectId) {
    //   switch (status) {
    //     case 'pendding':
    //       return (
    //         <img
    //           style={{ marginRight: '6px' }}
    //           src="../../../../../assets/images/chatWin/send_chat_state.png"
    //           alt=""
    //         />
    //       )
    //     case 'error':
    //       return (
    //         <img
    //           style={{ marginRight: '6px' }}
    //           src="../../../../../assets/images/chatWin/send_chat_error.png"
    //           alt=""
    //         />
    //       )
    //     default:
    //       return ''
    //   }
    // }
  }

  return (
    <Dropdown
      visible={menuVisible}
      onVisibleChange={visible => {
        setMenuVisible(visible)
      }}
      overlay={menu}
      trigger={['contextMenu']}
      overlayClassName="dropdownMenu"
      getPopupContainer={(): any => document.getElementsByClassName('chat_list_item')[keyNumber]}
    >
      <List.Item
        onClick={() => itemClick(dataItem)}
        className={`chat_list_item flex ${actived ? 'active' : ''}`}
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
          <div className="new_msg flex">
            {/* {renderSendIcon(dataItem.roomId)} */}
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
const compare = (prevProps: any, nextProps: any) => {
  const prevItem = prevProps.dataItem
  const nextItem = nextProps.dataItem
  if (
    prevProps.keyNumber !== nextProps.keyNumber ||
    prevProps.actived !== nextProps.actived ||
    prevItem.unreadCount !== nextItem.unreadCount ||
    prevItem.timeStamp !== nextItem.timeStamp ||
    prevItem.isTop !== nextItem.isTop ||
    prevItem.remindType !== nextItem.remindType ||
    prevItem.roomName !== nextItem.roomName ||
    prevItem.profile !== nextItem.profile
  ) {
    return false
  }
  return true
}

export default memo(ChatListItem, compare)

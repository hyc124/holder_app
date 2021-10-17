import React, { useState, memo } from 'react'
import { useSelector } from 'react-redux'
import { Avatar, Input, Button, message, Modal, Switch } from 'antd'
import { ipcRenderer } from 'electron'
import CropperModal from '@/src/components/CropperModal/index'
import { getAvatarEnums } from '../getData/ChatHandle'
import { handleSetChatTop, handleChangeMsgType } from './ChatListItem'
import { updateGroupName, setAdminUser } from '../getData/getData'
import SelectChatUserModal from './Modals/selectChatUserModal'
import PublicSetting from './PublicSetting'
import '../styles/ChatSetting.less'
import { customRequest } from './global/common'
import { useMergeState } from '../../chat-history/ChatItem'
import { deleteChatRoom, updateChatRoom } from '../getData/ChatInputCache'
import { getLocalRoomData } from '../../myWorkDesk/chat/ChatList'
/**
 *沟通聊天室设置
 */
interface ChatSettingProps {
  roomId: number
  roomJid: string
  roomName: string
  type: number
  profile: string | null
  remindType: number
  isTop: number
}
const ChatSetting: React.FC<ChatSettingProps> = ({
  roomId: selectedRoomId,
  roomJid: selectMuc,
  roomName: subject,
  type,
  profile,
  remindType,
  isTop,
}) => {
  // 讨论5部门4全员6私聊3
  const { nowUserId } = $store.getState()
  // 获取聊天室负责人
  const managerInfo = useSelector((state: StoreStates) => state.roomManager)

  const [chatState, setChatState] = useMergeState({
    isDisable: true, // 聊天室名称是否可编辑 默认不能编辑
    roomName: subject, // 聊天室名称
    oldName: subject, // 修改前的聊天室名称
    selectModal: false, // 修改群负责人弹窗
    uploadModal: false, // 修改头像弹窗
    editType: '', // 编辑群的类型
  })

  const upDateChatRoomMsg = (selectRoomId: any, key: string, value: any) => {
    const { nowUserId, chatListData } = $store.getState()
    const data = JSON.parse(JSON.stringify(chatListData))
    data?.forEach((item: any) => {
      if (item.roomId === selectRoomId) {
        item[key] = value
        updateChatRoom(item)
      }
    })
    $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
    // getLocalRoomData(false, '')
    // 更新本地缓存
    // updateChatRoomDetail({ userId: nowUserId, data: data })
  }

  // 修改头像
  const uploadSuccess = (profile: string) => {
    updateGroupName({
      roomId: selectedRoomId,
      profile: profile,
      userId: nowUserId,
    }).then(() => {
      message.success('修改成功')
      // 更新列表头像
      upDateChatRoomMsg(selectedRoomId, 'profile', profile)
      // 更新头部头像
      const { selectItem } = $store.getState()
      $store.dispatch({
        type: 'SET_SELECT_ITEM',
        data: { ...selectItem, profile: profile },
      })
    })
    setChatState({ uploadModal: false })
  }

  // 编辑讨论名称
  const editSubjectName = () => {
    setChatState({ isDisable: !chatState.isDisable })
    const { roomName, oldName } = chatState
    if (roomName !== oldName && roomName.trim() !== '') {
      setChatState({ oldName: roomName })
      const params = {
        roomName: roomName,
        roomId: selectedRoomId,
        userId: nowUserId,
      }
      updateGroupName(params).then(() => {
        message.success('修改成功')
        // 更新列表头像
        upDateChatRoomMsg(selectedRoomId, 'roomName', roomName)
        // 更新头部头像
        const { selectItem } = $store.getState()
        $store.dispatch({
          type: 'SET_SELECT_ITEM',
          data: { ...selectItem, roomName: roomName },
        })
      })
    } else {
      setChatState({ roomName: oldName })
    }
  }

  // 讨论名称输入
  const changeName = (e: any) => {
    e.persist()
    setChatState({ roomName: e.target.value })
  }

  const handelData = (url: string, params: object, content: string, callback: () => void) => {
    Modal.confirm({
      title: '操作提示',
      content: content,
      centered: true,
      onOk: () => {
        customRequest(url, params)
          .then(() => callback())
          .catch(err => message.error(err.returnMessage))
      },
    })
  }

  // 退出讨论
  const quitDiscuss = () => {
    const url = '/im-biz/chatRoom/quit'
    const params = { roomId: selectedRoomId, userId: nowUserId, operatorUserId: nowUserId }
    const content = '退出后将不再收到此主题的消息，确定退出主题聊天？'
    handelData(url, params, content, () => {
      // 更新列表数据
      const { chatListData, openRoomIds, selectItem } = $store.getState()
      // 更新当前在独立窗口打开的聊天室id
      const ids = openRoomIds.filter(thisId => {
        return thisId !== selectedRoomId
      })
      $store.dispatch({ type: 'SET_OPENROOM_IDS', data: ids })
      // 退出聊天室监听
      ipcRenderer.send('remove_chat_room', selectMuc)
      const newList = chatListData.filter(item => {
        return item.roomId !== selectItem.roomId
      })
      deleteChatRoom(selectedRoomId)
      // 更新列表
      $store.dispatch({
        type: 'SET_CHAT_LIST',
        data: { chatListData: newList },
      })
      // getLocalRoomData(false, '')
      // 清空选中
      $store.dispatch({
        type: 'SET_SELECT_ITEM',
        data: {},
      })
      // 更新本地缓存
      // updateChatRoomDetail({ userId: nowUserId, data: newList })
    })
  }

  // 解散讨论
  const delectMuc = () => {
    const url = '/im-biz/chatRoom/disband'
    const params = { roomId: selectedRoomId, userId: nowUserId }
    const content = '确定要解散这个主题吗？'
    handelData(url, params, content, () => {
      // 更新列表数据
      const { chatListData, openRoomIds } = $store.getState()
      const ids = openRoomIds.filter(thisId => {
        return thisId !== selectedRoomId
      })
      // 更新当前在独立窗口打开的聊天室id
      $store.dispatch({ type: 'SET_OPENROOM_IDS', data: ids })
      const newList = chatListData.filter(item => {
        return item.roomId !== selectedRoomId
      })
      deleteChatRoom(selectedRoomId)
      // 退出聊天室监听
      ipcRenderer.send('remove_chat_room', selectMuc)
      // 避免重复渲染
      $store.dispatch({
        type: 'SET_CHAT_LIST',
        data: { chatListData: newList },
      })
      // getLocalRoomData(false, '')
      // 清空选中
      $store.dispatch({
        type: 'SET_SELECT_ITEM',
        data: {},
      })
      // 更新本地缓存
      // updateChatRoomDetail({ userId: nowUserId, data: newList })
    })
  }

  // 修改群主
  const handleGroupLeader = () => {
    setChatState({
      selectModal: true,
      editType: 'groupLeader',
    })
  }

  // 保存修改的群主-修改群负责人
  const handleSaveSelected = (selectMember: Array<globalInterface.ChatMemberPorps>) => {
    const { nowUserId } = $store.getState()
    const mangagerData = selectMember[0]
    const { userId, userName, userAccount, headPhoto } = mangagerData
    const params = {
      userId: nowUserId,
      userType: 0,
      adminUserId: userId,
      roomId: selectedRoomId,
    }
    setAdminUser(params)
      .then(() => {
        message.success('修改成功')
        $store.dispatch({
          type: 'SET_CHAT_MANAGER',
          data: {
            userId,
            userName,
            userAccount,
            headPhoto,
          },
        })
      })
      .finally(() => {
        setChatState({ selectModal: false })
      })
  }

  if (!selectedRoomId) {
    return <div></div>
  }
  const showSetBtn = subject == '系统通知' || subject == '汇报' || subject == '汇报' || subject == '审批'
  return (
    <div className="chat-setting-container">
      {type !== 7 && (
        <div className="setting_show_box">
          <div className="setting_item">
            <Avatar
              className="oa-avatar flex center"
              src={
                profile ? $tools.htmlDecodeByRegExp(profile) : type !== 3 ? getAvatarEnums(type, subject) : null
              }
            >
              {chatState.roomName?.substr(-2, 2)}
            </Avatar>
            {managerInfo?.userId === nowUserId && type !== 3 && (
              <div
                className="uploadIcon"
                onClick={() => {
                  setChatState({ uploadModal: true })
                }}
              ></div>
            )}
            <Input
              className="subject-name flex-1"
              maxLength={30}
              value={chatState.roomName}
              onChange={changeName}
              disabled={chatState.isDisable}
            />
            {type === 5 && managerInfo?.userId === nowUserId && (
              <Button className="defaut-primary-btn" onClick={editSubjectName}>
                {chatState.isDisable ? '编辑主题' : '确定'}
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="setting_middle_title">消息提醒设置</div>
      <div className="setting_show_box">
        <div className="setting_item">
          <div className="left_txt">
            <p>消息免打扰</p>
            <span>开启后不再收到推送消息，无红点展示</span>
          </div>
          <Switch
            checked={remindType === 1 ? true : false}
            onChange={checked => {
              const isRemind = checked ? 1 : 0
              handleChangeMsgType(isRemind, selectedRoomId)
            }}
          />
        </div>
        <div className="setting_item">
          <div className="left_txt">
            <p>聊天置顶</p>
            <span>设置后展示在对应的分类列表顶部</span>
          </div>
          <Switch
            checked={isTop === 1 ? true : false}
            onChange={checked => {
              const top = checked ? 1 : 0
              handleSetChatTop(top, selectedRoomId)
            }}
          />
        </div>
      </div>
      {/* 系统通知消息接收设置 */}
      {showSetBtn && type === 7 && <PublicSetting selectedRoomId={selectedRoomId} />}
      {/* 审批消息接收设置 */}
      {type !== 3 && type !== 7 && managerInfo.userId ? (
        <>
          <div className="setting_middle_title">成员管理</div>
          <div className="setting_show_box">
            <div className="setting_item">
              <Avatar className="oa-avatar flex center" src={managerInfo?.headPhoto}>
                {managerInfo?.userName?.substr(-2, 2)}
              </Avatar>
              <div className="left_txt">
                <p>{managerInfo?.userName}</p>
                <span>群负责人</span>
              </div>
              {(type === 4 || type === 5) && managerInfo?.userId === nowUserId && (
                <span className="editIcon" onClick={handleGroupLeader}>
                  <i></i>修改
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        ''
      )}
      {type === 5 && (
        <div className="setting_button_group">
          {managerInfo?.userId === nowUserId && <Button onClick={delectMuc}>解散讨论</Button>}
          {managerInfo?.userId !== nowUserId && <Button onClick={quitDiscuss}>退出讨论</Button>}
        </div>
      )}
      {/* 修改群负责人、管理员 */}
      {chatState.selectModal && (
        <SelectChatUserModal
          visible={chatState.selectModal}
          selectedRoomId={selectedRoomId}
          editType={chatState.editType}
          closeModal={() => setChatState({ selectModal: false })}
          handleSaveSelected={handleSaveSelected}
        />
      )}
      {/* 上传头像模态框 */}
      {chatState.uploadModal && (
        <CropperModal
          uploadSuccess={uploadSuccess}
          visible={chatState.uploadModal}
          closeModal={() => setChatState({ uploadModal: false })}
        />
      )}
    </div>
  )
}

export default memo(ChatSetting)

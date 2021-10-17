import React, { useEffect, memo } from 'react'
import { Avatar } from 'antd'
import { shallowEqual, useSelector } from 'react-redux'
import { ipcRenderer } from 'electron'
import { getAvatarEnums } from '../getData/ChatHandle'

//获取头像
export const getListAvatar = () => {
  const normalHeader = $tools.asAssetsPath('/images/chatWin/chat_project.png')
  return <img style={{ width: 17, height: 15 }} className="defaultImg" src={normalHeader} />
}
interface CharHeaderProps {
  spreadChatUsers: () => void
}
const ChatHeader: React.FC<CharHeaderProps> = ({ spreadChatUsers }) => {
  //在线信息
  const onlineInfo = useSelector((state: any) => state.onlineInfo)
  //选中的人
  const selectItem = useSelector((store: StoreStates) => store.selectItem, shallowEqual)
  const { profile, roomName, type } = selectItem
  useEffect(() => {
    let isUnmounted = false
    if (isUnmounted) {
      return
    }
    if (type === 3) {
      ipcRenderer.on('user_online_or_offline', (_event, onlineInfouser) => {
        const { chatUserLists } = $store.getState()
        const { userOnlineStatus, userAccount } = onlineInfouser
        const isInArr = chatUserLists.find((item: any) => {
          return item.account === onlineInfouser.userAccount
        })
        if (isInArr) {
          const { onlineInfo } = $store.getState()
          const { onlineUsers, online } = onlineInfo
          let onlineNumber = online
          const isOnline = onlineUsers?.some((item: any) => item.account === userAccount)
          if (userOnlineStatus && !isOnline) {
            onlineNumber += 1
            onlineUsers?.push({ account: userAccount })
          } else if (!userOnlineStatus && isOnline) {
            onlineNumber = onlineNumber && onlineNumber > 0 ? onlineNumber - 1 : 0
            onlineUsers?.map(
              (item: { id: number; account: string; username: string; profile: any }, index: number) => {
                if (item.account === userAccount) {
                  onlineUsers?.splice(index, 1)
                }
              }
            )
          }
          $store.dispatch({
            type: 'SET_ONLINE_INFO',
            data: { onlineInfo: { ...onlineInfo, online: onlineNumber, onlineUsers: onlineUsers } },
          })
        }
      })
    }
    return () => {
      ipcRenderer.removeAllListeners('user_online_or_offline')
      isUnmounted = true
    }
  }, [])

  return (
    <div className="chat_headers pl-20 flex">
      {type !== 7 ? (
        <Avatar
          src={profile ? $tools.htmlDecodeByRegExp(profile) : getAvatarEnums(type, roomName)}
          icon={type !== 3 && getListAvatar()}
          className={`oa-avatar flex center ${type !== 3 ? 'compnay_group' : ''}`}
          size="large"
        >
          {type === 3 && roomName && roomName.substr(-2, 2)}
        </Avatar>
      ) : (
        <Avatar className="oa-avatar" src={getAvatarEnums(7, roomName)}>
          {roomName && roomName.substr(-2, 2)}
        </Avatar>
      )}
      <div className="show-header column">
        <p style={{ margin: 0 }}>{roomName}</p>
        {type !== 3 && type !== 7 && (
          <span className="groupUsers" onClick={spreadChatUsers}>
            <span className="group_icon"></span>
            <span>
              {onlineInfo.online}人在线/共{onlineInfo.total}人
            </span>
            <span className="go_right"></span>
          </span>
        )}
        {type === 3 && (
          <span className={`online_icon ${onlineInfo.onlineUsers?.length > 1 && 'light'}`}>
            <span></span>
            {onlineInfo.onlineUsers?.length > 1 ? '在线' : '离线'}
          </span>
        )}
      </div>
    </div>
  )
}

export default ChatHeader

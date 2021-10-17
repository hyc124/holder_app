import React, { memo, useState } from 'react'
import { Menu, Dropdown } from 'antd'
interface ChatUserItemProps {
  data: globalInterface.ChatMemberPorps
  children: any
  setManager: (params: { adminUserId: number; userType: number }, type: string) => void
}

const ChatUserItem: React.FC<ChatUserItemProps> = ({ setManager, children, data }) => {
  // 右键菜单显示隐藏
  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  // 设置取消管理员
  const menuClick = () => {
    setManager(
      {
        adminUserId: data.userId,
        userType: data.memberType,
      },
      'subject'
    )
    setMenuVisible(false)
  }

  // 右键菜单
  const RightMenu = () => {
    return (
      <Menu onClick={menuClick} className="chatRightMemu">
        <Menu.Item key="forward">{data.memberType === 2 ? '取消管理员资格' : '设置为管理员'}</Menu.Item>
      </Menu>
    )
  }

  const onVisibleChange = (visible: boolean) => {
    if (data.memberType === 0) {
      setMenuVisible(false)
    } else {
      setMenuVisible(visible)
    }
  }
  return (
    <Dropdown
      trigger={['contextMenu']}
      overlayClassName="ZIndex800"
      overlay={<RightMenu />}
      visible={menuVisible}
      onVisibleChange={onVisibleChange}
    >
      {children}
    </Dropdown>
  )
}

export default ChatUserItem

/**
 * @description 消息右键操作
 * @module MenuToolHandel
 */
import { Menu } from 'antd'
import React, { memo } from 'react'
import { suffix } from './common'
import $c from 'classnames'
const MenuToolHandel: React.FC<{
  showContent: globalInterface.ChatContentProps
  menuHandel: (menuItem: any, isHover?: boolean) => void
  isHover?: boolean
}> = ({ showContent, menuHandel, isHover }) => {
  const { nowUserId, chatUserInfo, selectItem } = $store.getState()
  const { userType } = chatUserInfo || {}
  const { type: subType, fromUser, messageJson: msg, sendStatus } = showContent
  const messageJson = $tools.isJsonString(msg) ? JSON.parse(msg) : msg
  const replyMessageModel = messageJson?.originMsg
  const ext = suffix(messageJson.displayName)
  const testImg = ext ? !$tools.imgFormatArr.includes(ext) : false
  const renderRevert = () => {
    if (fromUser?.userId === nowUserId && selectItem.type === 3) {
      return (
        <Menu.Item key="revert">
          <i className="revertIcon"></i>撤回
        </Menu.Item>
      )
    }
    if (fromUser?.userId === nowUserId || ((userType === 0 || userType === 2) && selectItem.type !== 3)) {
      return (
        <Menu.Item key="revert">
          <i className="revertIcon"></i>撤回
        </Menu.Item>
      )
    }
  }
  return (
    <Menu
      onClick={item => menuHandel(item, isHover)}
      className={$c('chatRightMemu moreOperateBtns', { hoverBtns: isHover })}
    >
      {!(subType === 4 || subType === 6) && !testImg && sendStatus !== '-1' && (
        <Menu.Item key="copy">
          <i className="copyIcon"></i>复制
        </Menu.Item>
      )}
      {!replyMessageModel && sendStatus !== '-1' && (
        <Menu.Item key="forward">
          <i className="forwardIcon"></i>转发
        </Menu.Item>
      )}
      {subType !== 6 && sendStatus !== '-1' && (
        <Menu.Item key="reply">
          <i className="replyIcon"></i>回复
        </Menu.Item>
      )}
      {renderRevert()}
      {subType === 3 && sendStatus !== '-1' && (
        <Menu.Item key="file">
          <i className="fileIcon"></i>保存
        </Menu.Item>
      )}
    </Menu>
  )
}

export default memo(MenuToolHandel)

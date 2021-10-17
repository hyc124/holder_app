import React, { useState, useEffect, useRef } from 'react'
import '../../myWorkDesk/myWorkDesk.less'
import './ChatWindowTip.less'
import { Tooltip } from 'antd'
import { useDrag, useDrop, useDragLayer } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import $c from 'classnames'
import { ipcRenderer } from 'electron'
import devConfig from '@root/build/dev.config'
import { loadLocales } from '@/src/common/js/intlLocales'
import { getFunsAuth } from '@/src/components/app-sidebar/appCommonApi'
// import { useMergeState } from '../../chat-history/chat-history'
import ChatSearch from '../../myWorkDesk/chat/ChatSearch'
import ChatList from '../../myWorkDesk/chat/ChatList'
import { closeChatWork } from '../../myWorkDesk/myWorkDesk'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
// import { queryModalReadNum } from '../../workdesk/getData'

export let getUnreadDot: any = null
/**
 * 新版
 */
// 解决重复请求count接口，设置时间阻断
// let CWTCountTimering: any = null
export const ChatWinTip = ({ isFollow }: any) => {
  // 沟通模块显示隐藏
  const [chatlVisible, setChatlVisible] = useState(false)
  //沟通会议未读红点状态
  const [unreadDot, setUnreadDot] = useState(0)
  useEffect(() => {
    setChatlVisible(false)
    getUnreadDot = (data: any) => {
      setUnreadDot(data)
    }
  }, [])

  // 沟通展示权限
  const chatAuth = getFunsAuth({ name: 'COMMUNICATION' })
  // 打开关闭聊天面板
  const closeChatPanel = async () => {
    if ($('.workDeskContainer').length > 0) {
      closeChatWork()
      return false
    }
    setChatlVisible(!chatlVisible)
    //点击空白处
    jQuery('.app-content-wrap')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.chat-window-tip .workDeskChatAside') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0 && _con.length > 0) {
          setChatlVisible(false)
          jQuery('.app-content-wrap').off('click')
        }
      })
  }
  const [boxes, setBoxes] = useState(20)
  const [, drop] = useDrop({
    accept: 'tipDropIcon',
    drop: (item: any, minoter: any) => {
      const delta = minoter.getSourceClientOffset()
      const getheight: any = Number($('.chat-window-tip').height()) - 44
      if (delta.y >= 0) {
        if (getheight - delta.y > 0) {
          setBoxes(Math.round(getheight - delta.y))
        } else {
          setBoxes(20)
        }
      } else {
        setBoxes(getheight)
      }
      $('.chat-window-tip').removeClass('addWidth')
    },
  })
  const dropRef = useRef<any>(null)
  // 使用drop 对 ref 进行包裹，则组件既可以进行拖拽也可以接收拖拽组件
  drop(dropRef)
  return (
    <div className={`chat-window-tip`} ref={dropRef}>
      {/* 关注的人工作台不展示沟通 */}
      {!isFollow && chatAuth && chatlVisible && (
        <aside className={`workDeskChatAside`}>
          <div className="chatTitle">
            <span>沟通</span>
            <span className="closeBtn" onClick={closeChatPanel}></span>
          </div>
          <div className="left_chat_list flex column">
            {/* 查询聊天室 */}
            <ChatSearch />
            {/* 聊天室列表 */}
            <ChatList />
          </div>
        </aside>
      )}
      <ChatIconTip
        closeChatPanel={closeChatPanel}
        // clickFn={clickFn}
        unreadDot={unreadDot}
        top={boxes}
        chatlVisible={chatlVisible}
      />
      <CustomDragLayer unreadDot={unreadDot} />
    </div>
  )
}
export const ChatIconTip = (props: any) => {
  // 沟通模块显示隐藏
  const [changelVisible, setChangeVisible] = useState(false)
  const [boxes, setBoxes] = useState({
    bot: 20,
    unreadDot: 0,
  })
  useEffect(() => {
    setChangeVisible(props.chatlVisible)
  }, [props.chatlVisible])
  const [{ isDragging }, drag, preview] = useDrag({
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    item: { type: 'tipDropIcon' },
  })
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [])
  useEffect(() => {
    setBoxes({
      bot: props.top,
      unreadDot: props.unreadDot,
    })
  }, [props.top, props.unreadDot])
  if (isDragging) {
    $('.chat-window-tip').addClass('addWidth')
  } else {
    $('.chat-window-tip').removeClass('addWidth')
  }
  return (
    <>
      <div
        className={`red-spot-icon ${changelVisible ? 'hide' : ''}`}
        // className={`red-spot-icon dock`}
        data-lock="false"
        data-code={props.unreadDot}
        onClick={props.closeChatPanel}
        // onClick={props.clickFn}
        ref={drag}
        style={{ bottom: `${boxes.bot}px`, opacity: isDragging ? 0 : 1 }}
      >
        {/* 沟通 */}
        {getFunsAuth({ name: 'COMMUNICATION' }) && (
          <Tooltip title={isDragging ? '' : '沟通'}>
            <span>
              {boxes.unreadDot > 0 && (
                <em
                  className={$c('red-spot red-number chatWin-em', {
                    'red-spot-larg': boxes.unreadDot > 99,
                  })}
                >
                  {boxes.unreadDot > 99 ? '99+' : boxes.unreadDot}
                </em>
              )}
            </span>
          </Tooltip>
        )}
      </div>
    </>
  )
}
export const CustomDragLayer = (props: any) => {
  const { itemType, isDragging, initialOffset, currentOffset } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }))
  const layerStyles: any = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 1002,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  }
  function getItemStyles(initialOffset: any, currentOffset: any) {
    if (!initialOffset || !currentOffset) {
      return {
        display: 'none',
      }
    }
    let { x, y } = currentOffset
    const transform = `translate(16px, ${y}px)`
    return {
      transform,
      WebkitTransform: transform,
      width: '36px',
      right: '16px',
    }
  }
  function renderItem() {
    switch (itemType) {
      case 'tipDropIcon':
        return (
          <div
            className={`red-spot-icon`}
            data-code={props.unreadDot}
            style={{ transform: `translate3d(${0}px, ${0}px, 0)` }}
          >
            {/* 沟通 */}
            {getFunsAuth({ name: 'COMMUNICATION' }) && (
              <span>
                {props.unreadDot > 0 && (
                  <em
                    className={$c('red-spot red-number chatWin-em', {
                      'red-spot-larg': props.unreadDot > 99,
                    })}
                  >
                    {props.unreadDot > 99 ? '99+' : props.unreadDot}
                  </em>
                )}
              </span>
            )}
          </div>
        )
      default:
        return null
    }
  }
  if (!isDragging) {
    return null
  }
  return (
    <div style={layerStyles}>
      <div style={getItemStyles(initialOffset, currentOffset)} className="red-spot-cont">
        {renderItem()}
      </div>
    </div>
  )
}
export const ChatWindowTip = (props: any) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <ChatWinTip
        isFollow={$store.getState().followUserInfo.userId}
        // clickFn={props.callback}
        // className={props.className}
      />
    </DndProvider>
  )
}

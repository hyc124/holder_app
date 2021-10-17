import React, { useState, useEffect, Fragment, useMemo } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Spin, Tabs } from 'antd'
import ChatHeader from './ChatHeader'
import ChatSetting from './ChatSetting'
import ChatFileList from './ChatFileList'
import ChatUser from './chatUser'
import ChatMain from './ChatMain'
import { getChatUsers } from '../getData/getData'
import { DoubleRightOutlined } from '@ant-design/icons'
import '../styles/ChatWin.less'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import { insertSqlProfile } from '../getData/ChatInputCache'
const { TabPane } = Tabs
//沟通主窗口
const ChatRightContainer = () => {
  const { nowAccount, chatUserInfo } = $store.getState()
  // 选中列表item
  const selectItem = useSelector((state: any) => state.selectItem, shallowEqual)
  //当前所在tab
  const [selectTab, setSelectTab] = useState('1')
  // 成员列表显示隐藏
  const [userVisible, setUserVisible] = useState(false)
  // @所需群聊的所有成员
  const [data, dataSet] = useState<any>([])
  useEffect(() => {
    // 默认选中聊天窗口
    if (selectTab !== '1') {
      setSelectTab('1')
    }
    if (selectItem.type !== 3) {
      //查询群组所有成员
      getChatUsers({
        roomId: selectItem?.roomId,
        keywords: '',
      })
        .then((resData: any) => {
          const allUserData = resData.dataList || []
          // 当前登录用户的昵称
          const user = allUserData.find((item: any) => {
            return item.userAccount == nowAccount
          })
          $store.dispatch({
            type: 'SET_CHAT_USERINFO',
            data: {
              chatUserInfo: {
                nickName: user?.userName,
                userType: user?.memberType,
                userId: user?.userId,
              },
            },
          })
          dataSet([...new Set(allUserData)])
          insertSqlProfile(allUserData)
          const onlineModel = allUserData.filter((item: any) => item.isOnline === 1)
          // 在线离线
          $store.dispatch({
            type: 'SET_ONLINE_INFO',
            data: {
              onlineInfo: {
                online: onlineModel.length,
                total: allUserData.length,
                onlineUsers: onlineModel,
              },
            },
          })
          // 群主
          const groupLeader = allUserData.filter((item: any) => {
            return item.memberType === 0
          })
          let value = {
            userId: '',
            userName: '',
            userAccount: '',
            headPhoto: '',
          }
          if (groupLeader.length) {
            value = groupLeader[0]
          }
          $store.dispatch({
            type: 'SET_CHAT_USERLISTS',
            data: { roomManager: value },
          })
        })
        .catch(() => {
          dataSet([])
        })
    }
  }, [selectItem?.roomId])

  // 切换tab
  const changeMainTab = (key: string) => {
    if (key === selectTab) {
      return
    }
    // 分享消息后切换回聊天室查询最新的消息
    if (key !== '1' && userVisible) {
      setUserVisible(false)
    }
    if (key === '3') {
      $store.dispatch({ type: 'SET_CHAT_DISCUSS', data: {} })
    }
    setSelectTab(key)
  }

  const spreadChatUsers = () => {
    if (selectTab === '1') {
      setUserVisible(!userVisible)
      // 更新在线离线总数（成员加入、隐退）
      // getOnlineUser(selectItem.id).then((resData: any) => {
      //   $store.dispatch({ type: 'SET_ONLINE_INFO', data: { onlineInfo: resData } })
      // })
      $('.unread_prompt').css({
        right: !userVisible ? '289px' : '0px',
      })
    }
  }

  const showRightUsers = useMemo(() => {
    return <ChatUser allUserData={data} />
  }, [data])

  //聊天室头部
  const showHeader = useMemo(() => {
    return <ChatHeader spreadChatUsers={spreadChatUsers} />
  }, [userVisible])

  const showMain = useMemo(() => {
    return <ChatMain atData={data} selectItem={selectItem} />
  }, [data, selectItem?.roomId])

  return (
    <Fragment>
      <div className="main_content flex column">
        {/* 聊天室头部信息 */}
        {showHeader}
        {/* 聊天室详情 */}
        <Tabs
          defaultActiveKey="1"
          activeKey={selectTab}
          onChange={changeMainTab}
          className="chat-main-tab flex-1"
        >
          {/* 聊天tab：历史消息、消息输入框、成员列表 */}
          <TabPane tab="聊天" key="1">
            {selectTab === '1' && showMain}
            {/* 文件下载组件 */}
            <DownLoadFileFooter fromType="chatwin" />
          </TabPane>
          {/* 屏蔽当前文件 */}
          {
            // <TabPane tab="文件" key="5">
            //   {selectTab === '5' && <ChatFileList selectRoomId={selectItem.roomId} />}
            //   {/* 文件下载组件 */}
            //   {<DownLoadFileFooter fromType="chatwin" />}
            // </TabPane>
          }
          {/* <TabPane tab="设置" key="6" forceRender={true}>
            {selectTab === '6' && (
              <ChatSetting
                roomId={selectItem.roomId}
                roomJid={selectItem.roomJid}
                roomName={selectItem.roomName}
                type={selectItem.type}
                profile={selectItem.profile}
                remindType={selectItem.remindType}
                isTop={selectItem.isTop}
              />
            )}
          </TabPane> */}
        </Tabs>
      </div>
      {selectItem.type !== 3 && selectTab === '1' && (
        <div className={`chat_main_right_bar ${userVisible ? 'width_289' : 'width_0'}`}>
          {/* 展开收起成员列表按钮 */}
          {selectItem.type !== 7 && (
            <div onClick={spreadChatUsers} className={`${userVisible ? 'fold_icon' : 'spread_icon'}`}></div>
          )}
          {/* 成员列表 */}
          {showRightUsers}
        </div>
      )}
    </Fragment>
  )
}
export default ChatRightContainer

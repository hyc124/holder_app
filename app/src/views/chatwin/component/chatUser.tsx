import React, { useState, useEffect, useRef, ReactNode, Fragment, useMemo, useCallback, memo } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import moment from 'moment'
import { Spin, Input, Avatar, Tree, Tooltip, Modal, message } from 'antd'
import $c from 'classnames'
import { ipcRenderer } from 'electron'
import { useMergeState } from '../chatwin'
import {
  getChatUsers,
  setAdminUser,
  sendPrevateTalk,
  getUserTreeList,
  openWindow,
  addSubjectChat,
} from '../getData/getData'
import InviteModal from './Modals/inviteModal'
import { insertChatRoom, updateChatRoom } from '../getData/ChatInputCache'
import ChatUserItem from './ChatUserItem'
import { getLocalRoomData } from '../../myWorkDesk/chat/ChatList'
import memoize from 'memoize-one'
import { areEqual, FixedSizeGrid as Grid } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
interface TreeListPorps {
  title: string | ReactNode
  key: string
  icon?: ReactNode
  isLeaf?: boolean
  children?: TreeListPorps[]
  account: number
  username: string
  id: number
  userId: number
  userType: number
  type: number
  childs?: any
}

const ChatUser: React.FC<any> = ({ allUserData }) => {
  // 基本信息
  const { loginToken, nowUserId, roomManager } = $store.getState()
  // 搜索群成员列表
  // const searchResultList = useSelector((state: StoreStates) => state.searchResultList, shallowEqual)
  // 组织架构所需群聊的所有成员
  const selectItem = useSelector((state: StoreStates) => state.selectItem, shallowEqual)
  const { roomId, ascriptionId, deptId, type } = selectItem
  // 搜索成员输入框
  const inputRef = useRef<any>()
  // 展开子列表的key
  // const [expandedKeys, setExpandedKeys] = useState([])
  //添加成员模态框
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  // 聊天室成员列表
  const [chatUserState, setChatUserState] = useMergeState({
    expandedKeys: [], // 展开子列表的key
    chatUserTree: [], // 聊天室成员树结构数据
    memberLoading: true,
    listType: true, // 聊天室成员列表类型 true 列表 false 组织架构
    keywords: '',
    isManager: false,
    searchState: false,
    isFold: true,
    allUserList: [],
    searchResultList: [],
  })
  const [nodeTreeItem, setNodeTreeItem] = useMergeState({
    pageX: 0,
    pageY: 0,
    visible: false,
  })
  //缓存searchUserList
  const searchListRef = useRef<any[]>([])
  useEffect(() => {
    searchListRef.current = chatUserState.searchResultList
  }, [chatUserState.searchResultList])

  // 切换聊天室成员展示
  useEffect(() => {
    if (chatUserState.listType) {
      // 列表模式-查询聊天室成员列表
      const keywords = chatUserState.keywords
      if (keywords == '') {
        return
      }
      getChatUsers({
        roomId: roomId,
        keywords,
      })
        .then((resData: any) => {
          const dataList = resData.dataList || []
          if (!keywords) {
            // 保存聊天室成员列表
            $store.dispatch({
              type: 'SET_CHAT_USERLISTS',
              data: {
                chatUserLists: dataList,
              },
            })
          }
          setChatUserState({
            memberLoading: false,
            searchResultList: dataList,
            allUserList: dataList,
          })
        })
        .catch(() => {
          setChatUserState({
            memberLoading: false,
            searchResultList: [],
          })
        })
    } else {
      fetchUserTreeList()
    }
  }, [chatUserState.listType, chatUserState.keywords, chatUserState.searchState])

  // 查询聊天室数据
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.state.value = ''
    }
    // 列表模式查询成员列表
    // 保存聊天室成员列表
    setChatUserState({
      listType: true,
      keywords: '',
      memberLoading: false,
      isFold: true,
    })
  }, [])

  useEffect(() => {
    setChatUserState({
      searchResultList: allUserData,
      allUserList: allUserData,
    })
    setModalVisible(false)
  }, [allUserData])

  //切换查看聊天室成员
  const changeListType = (listType: boolean) => {
    setChatUserState({ listType: listType, searchState: false })
  }

  //根据关键字搜索聊天室成员
  const searchChatMembers = (e: any) => {
    e.persist()
    if (e.key === 'Enter') {
      setChatUserState({
        keywords: e.target.value,
        searchState: !chatUserState.searchState,
      })
    }
  }

  const openRoom = async (resData: any) => {
    // 打开沟通窗口
    const { chatListData, openRoomIds, selectItem } = $store.getState()
    const dataList = JSON.parse(JSON.stringify(chatListData))
    const data = [...dataList, resData]
    insertChatRoom(resData)
    // 列表排序
    data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
      if (a.isTop === b.isTop) {
        return moment(a.timeStamp).valueOf() - moment(b.timeStamp).valueOf()
      }
      return b.isTop - a.isTop
    })
    const newIds = [...openRoomIds, resData.roomId]
    ipcRenderer.send('show_commuciate_muc', [selectItem, resData])
    // 保存当前在独立窗口打开的聊天室
    $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
    // 更新列表
    await $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
    // await getLocalRoomData(false, 'time')
    // 设置滚动条的位置
    const resultData = chatListData.filter((item: { roomId: any }) => {
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

  // // 发起私聊
  const handleSendPrevateTalk = (record: globalInterface.ChatMemberPorps) => {
    const { chatListData, openRoomIds, selectItem, nowUserId } = $store.getState()
    if (record.userId === nowUserId) {
      return message.error('不能和自己私聊')
    }
    const data = JSON.parse(JSON.stringify(chatListData))
    let isIn = false
    let newIds = [...openRoomIds]
    data.map((item: any) => {
      if (item.typeId === record.userId) {
        isIn = true
        const isRoomOpen = openRoomIds.some((thisId: any) => {
          return thisId === item.roomId
        })
        if (!isRoomOpen) {
          // 添加打开的聊天室id
          newIds = [...openRoomIds, item.roomId]
          $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
        }
        // 打开沟通窗口
        ipcRenderer.send('show_commuciate_muc', [selectItem, item])
      }
    })
    // 聊天室是否打开
    if (isIn) {
      // 设置滚动条的位置
      const resultData = chatListData.filter((item: { roomId: any }) => {
        return newIds.indexOf(item.roomId) !== -1
      })
      resultData.map((item: any, index: number) => {
        if (item.typeId === record.userId) {
          // 设置选中
          $store.dispatch({ type: 'SET_SELECT_ITEM', data: item })
          const offsetTop = index * 62
          $('#chat_list_main').scrollTop(offsetTop - 100)
        }
      })
    } else {
      // 基本信息
      const { nowAccount, nowUserId, nowUser } = $store.getState()
      const manager: any = { account: nowAccount, id: nowUserId, username: nowUser }
      const result = [
        {
          account: record.userAccount,
          id: record.userId,
          username: record.userName,
        },
      ]
      // 请求接口打开聊天室
      const value = {
        roomManager: manager,
        roomName: record.userName,
        headPhoto: record.headPhoto ? record.headPhoto : '',
        roomMembers: result,
        type: 3,
      }
      addSubjectChat(value).then((resData: any) => {
        openRoom(resData)
      })
    }
  }

  // 发起私聊
  const onDoubleClick = (e: any, node: any) => {
    if (node.type == 0 && node.account) {
      handleSendPrevateTalk(node)
    }
  }

  //异步加载子节点
  function updateTreeData(list: TreeListPorps[], key: React.Key, children: TreeListPorps[]): TreeListPorps[] {
    return list.map(node => {
      if (node.key === key) {
        return {
          ...node,
          children,
        }
      } else if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        }
      }
      return node
    })
  }

  // 设置/取消管理员
  const setManager = (
    params: { adminUserId: number; userType: number },
    type: string,
    callBack?: () => void
  ) => {
    const { userType, adminUserId } = params
    const value = {
      adminUserId: adminUserId,
      userId: nowUserId,
      roomId: roomId,
      userType: userType === 2 ? 1 : 2,
    }
    setAdminUser(value)
      .then(() => {
        if (type === 'tree') {
          // 按组织架构查看
          callBack && callBack()
        } else {
          // 按列表查看
          const { chatUserLists } = $store.getState()
          const data1 = JSON.parse(JSON.stringify(searchListRef.current))
          const data2 = JSON.parse(JSON.stringify(chatUserLists))
          const newList = data1.map((item: any) => {
            if (item.userId === params.adminUserId) {
              item.memberType = item.memberType === 2 ? 1 : 2
            }
            return item
          })
          const listAll = data2.map((item: any) => {
            if (item.userId === params.adminUserId) {
              item.memberType = item.memberType === 2 ? 1 : 2
            }
            return item
          })
          $store.dispatch({
            type: 'SET_CHAT_USERLISTS',
            data: { chatUserLists: listAll },
          })
          setChatUserState({
            searchResultList: newList,
            allUserList: newList,
          })
        }
      })
      .finally(() => {
        setNodeTreeItem({ visible: false })
      })
  }

  const newData = (childData: Array<TreeListPorps>, adminUserId: number) => {
    childData.map(item => {
      if (item.id === adminUserId) {
        item.userType = item.userType === 2 ? 1 : 2
        item.title = (
          <Fragment>
            <span className="tree-title text-ellipsis">{item.username}</span>
            {item.userType === 0 && <span className="group_owner">群主</span>}
            {item.userType === 2 && <span className="group_manager">管理员</span>}
          </Fragment>
        )
      } else if (item.children) {
        newData(item.children, adminUserId)
      }
    })
  }

  // 右键菜单事件 设置/取消管理员（tree）
  const handleSetManager = () => {
    const { userId, userType } = nodeTreeItem
    setManager({ adminUserId: userId, userType: userType }, 'tree', () => {
      const treeData = [...chatUserState.chatUserTree]
      treeData.map((item: TreeListPorps) => {
        if (item.userId === userId) {
          item.userType = item.userType === 2 ? 1 : 2 //1设为普通成员2设为管理员
          item.title = (
            <Fragment>
              <span className="tree-title text-ellipsis">{item.username}</span>
              {item.userType === 0 && <span className="group_owner">群主</span>}
              {item.userType === 2 && <span className="group_manager">管理员</span>}
            </Fragment>
          )
        } else if (item.children) {
          newData(item.children, userId)
        }
      })
      setChatUserState({ chatUserTree: treeData })
    })
  }

  // 右键菜单显示隐藏（tree ）
  const onRightClick = ({ event, node }: any) => {
    const { roomManager } = $store.getState()
    if (nowUserId !== roomManager.id) {
      return
    }
    // node.userType !== 0 群主不能被设置为管理员
    if (node.type === 0 && node.userType !== 0) {
      let x = event.pageX
      const y = event.pageY
      const bodyWidth = jQuery('body').width() || 0
      if (bodyWidth - x < 124) {
        x = x - 124
      }
      setNodeTreeItem({
        visible: true,
        pageX: x,
        pageY: y,
        userId: node.id,
        userType: node.userType,
      })
      // 点击空白处隐藏
      $('body')
        .off()
        .on('click', (e: any) => {
          const _con = $('.cahtUserTreeMenu') // 设置目标区域
          if (!_con.is(e.target) && _con.has(e.target).length === 0) {
            setNodeTreeItem({ visible: false })
            $('body').off('click')
          }
        })
    }
  }

  // 成员列表查看更多展开收起
  const readMoreUser = () => {
    if (!chatUserState.isFold) {
      $('.chatMemberLists').animate(
        {
          scrollTop: 0,
        },
        100
      )
    }
    setChatUserState({ isFold: !chatUserState.isFold })
  }

  // 聊天室添加新成员
  const newMember = (dataList: Array<{ account: number; curId: number; curName: string; cmyId: string }>) => {
    const { nowUserId } = $store.getState()
    const result = dataList.map((item: { account: number; curId: number; curName: string; cmyId: string }) => {
      return {
        id: item.curId,
        teamId: item.cmyId,
      }
    })
    $api
      .request(
        '/im-biz/chatRoom/inviteMember',
        {
          roomId: roomId,
          roomMembers: result,
          userId: nowUserId,
        },
        { headers: { loginToken, 'Content-Type': 'application/json' } }
      )
      .then((res: any) => {
        if (res.returnCode === 0) {
          // 查询聊天室成员列表
          getChatUsers({
            roomId: roomId,
            keywords: '',
          }).then((resData: any) => {
            const allUserData = resData.dataList || []
            const onlineModel = allUserData.filter((item: any) => item.isOnline === 1)
            // 成员列表
            setChatUserState({
              searchResultList: allUserData,
              allUserList: allUserData,
            })
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
          })
        }
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }

  // 移除成员
  const removeMember = (record: any) => {
    const { nowUserId } = $store.getState()
    const userId = record.userId
    const config = {
      title: '操作提示',
      content: '确认要删除该成员？',
      centered: true,
      onOk: () => {
        $api
          .request(
            '/im-biz/chatRoom/quit',
            {
              roomId: roomId,
              userId: record.userId,
              operatorUserId: nowUserId,
            },
            { headers: { loginToken }, formData: true }
          )
          .then(() => {
            // 更新列表数据
            const { chatUserLists } = $store.getState()
            const data = chatUserLists.filter((item: { userId: any }) => {
              return item.userId !== userId
            })
            const data1 = searchListRef.current.filter((item: { userId: any }) => {
              return item.userId !== userId
            })
            const onlineModel = data.filter((item: any) => item.isOnline === 1)
            $store.dispatch({
              type: 'SET_CHAT_USERLISTS',
              data: { chatUserLists: data },
            })
            setChatUserState({
              searchResultList: data1,
              allUserList: data1,
            })
            // 在线离线
            $store.dispatch({
              type: 'SET_ONLINE_INFO',
              data: {
                onlineInfo: {
                  online: onlineModel.length,
                  total: data.length,
                  onlineUsers: onlineModel,
                },
              },
            })
          })
          .catch(err => {
            console.log(err)
          })
      },
    }
    Modal.confirm(config)
  }

  //异步加载子节点
  const getChildTree = (treeNode: any) => {
    return new Promise<void>(resolve => {
      if (treeNode.children) {
        resolve()
        return
      }
      // 处理部门外数据
      if (treeNode.username == '部门外成员') {
        const { childs } = treeNode
        const childList = childs || []
        const childData: Array<TreeListPorps> = childList.map((item: any) => {
          return {
            account: item.account,
            id: item.id,
            username: item.name,
            userType: item.userType,
            type: item.type,
            title: (
              <Fragment>
                <span className="tree-title text-ellipsis">{item.name}</span>
                {item.userType === 0 && <span className="group_owner">群主</span>}
                {item.userType === 2 && <span className="group_manager">管理员</span>}
              </Fragment>
            ),
            key: item.id + '-' + treeNode.key,
            isLeaf: true,
            icon: (
              <Avatar className={$c('oa-avatar', { online: item.onLine })} src={item.profile}>
                {item.name.substr(-2, 2)}
              </Avatar>
            ),
          }
        })
        setTimeout(() => {
          setChatUserState({
            chatUserTree: updateTreeData(chatUserState.chatUserTree, treeNode.key, childData),
            memberLoading: false,
          })
        }, 300)
        resolve()
        return
      }

      const value = {
        ascriptionId: treeNode.key.split('-')[0],
        belongType: 3,
        mucId: roomId,
        orgId: ascriptionId,
        keywords: chatUserState.keywords,
        directDeptId: type === 6 ? -1 : deptId,
      }
      getUserTreeList(value).then((resData: any) => {
        const nowLevelData = resData.childs
        const childData: Array<TreeListPorps> = nowLevelData.map((item: any) => {
          if (item.type === 0) {
            return {
              account: item.account,
              id: item.id,
              username: item.name,
              userType: item.userType,
              type: item.type,
              title: (
                <Fragment>
                  <span className="tree-title text-ellipsis">{item.name}</span>
                  {item.userType === 0 && <span className="group_owner">群主</span>}
                  {item.userType === 2 && <span className="group_manager">管理员</span>}
                </Fragment>
              ),
              key: item.id + '-' + treeNode.key,
              isLeaf: true,
              icon: (
                <Avatar className={$c('oa-avatar', { online: item.onLine })} src={item.profile}>
                  {item.name.substr(-2, 2)}
                </Avatar>
              ),
            }
          }
          return {
            account: item.account,
            id: item.id,
            username: item.name,
            userType: item.userType,
            type: item.type,
            title: item.name + '(' + item.personCount + '人)',
            key: item.id + '-' + treeNode.key,
            isLeaf: item.personCount === 0,
          }
        })
        setTimeout(() => {
          setChatUserState({
            chatUserTree: updateTreeData(chatUserState.chatUserTree, treeNode.key, childData),
            memberLoading: false,
          })
        }, 300)
        resolve()
      })
    })
  }

  // 查新一级列表
  const fetchUserTreeList = () => {
    //组织架构查看
    const belongType = type === 6 ? 2 : 3 //全员群2 部门群3
    const value = {
      ascriptionId: type === 6 ? ascriptionId : deptId,
      belongType: belongType,
      mucId: roomId,
      orgId: ascriptionId,
      keywords: chatUserState.keywords,
      directDeptId: type === 6 ? -1 : deptId,
    }
    getUserTreeList(value).then((resData: any) => {
      const oneLevelData = resData.childs
      const firstTreeData: Array<TreeListPorps> = oneLevelData.map((item: any, index: number) => {
        return {
          account: item.account,
          id: item.id,
          username: item.name,
          userType: item.userType,
          type: item.type,
          // title: item.personCount > 0 ? item.name + '(' + item.personCount + '人)' : item.name,
          key: item.id ? item.id + '' : index + '',
          isLeaf: item.personCount === 0,
          childs: item.childs,
          title:
            item.type == 0 ? (
              <Fragment>
                <span className="tree-title text-ellipsis">{item.name}</span>
                {item.userType === 0 && <span className="group_owner">群主</span>}
                {item.userType === 2 && <span className="group_manager">管理员</span>}
              </Fragment>
            ) : (
              <span className="tree-title text-ellipsis">
                {item.name + (item.personCount == 0 ? '' : '(' + item.personCount + '人)')}
              </span>
            ),
          icon:
            item.personCount === 0 && item.type === 0 ? (
              <Avatar className={$c('oa-avatar', { online: item.onLine })} src={item.profile}>
                {item.name.substr(-2, 2)}
              </Avatar>
            ) : (
              ''
            ),
        }
      })

      setChatUserState({
        chatUserTree: firstTreeData,
        memberLoading: false,
      })
    })
  }

  // 渲染ant tree右键菜单
  const getNodeTreeMenu = () => {
    const { pageX, pageY } = nodeTreeItem
    const menu = (
      <div
        className="chatRightMemu cahtUserTreeMenu"
        style={{
          left: `${pageX}px`,
          top: `${pageY}px`,
        }}
      >
        <div className="ant-menu-item" onClick={handleSetManager}>
          {nodeTreeItem.userType === 2 ? '取消管理员资格' : '设置为管理员'}
        </div>
      </div>
    )
    return menu
  }

  // 监听展开子列表
  const onExpandCmy = (expandedKeys: any) => {
    setChatUserState({
      expandedKeys: expandedKeys,
    })
  }

  const renderAddBtn = () => {
    const user = getNowUserInfo()
    if (type === 5 || (type === 4 && (user?.userType === 2 || user?.userType === 0))) {
      return (
        <div className="chat_member_list_item" style={{ fontSize: '0' }}>
          <div className="add_icon" onClick={() => setModalVisible(true)}></div>
          <div className="show_name text-ellipsis">添加</div>
        </div>
      )
    }
  }

  const getNowUserInfo = () => {
    const { nowAccount } = $store.getState()
    const user = chatUserState.allUserList.find((item: any) => {
      return item.userAccount == nowAccount
    })
    return {
      userType: user?.memberType,
      userId: user?.userId,
    }
  }
  const user = getNowUserInfo()

  const userItem = (item: any, style: any, isManager: any) => {
    //当前登录人为群主：群主不能移除自己
    const state1 = roomManager.userId === nowUserId && item.memberType !== 0
    //当前用户为管理员： 管理员只能移除非管理员的成员
    const state2 = user?.userType === 2 && item.memberType === 1
    const showDelBtn = state1 || state2
    return (
      <div
        className={$c('chat_member_list_item', {
          online: item.isOnline === 1,
        })}
        style={style}
        onDoubleClick={() => handleSendPrevateTalk(item)}
      >
        <Avatar className="oa-avatar" src={item.headPhoto}>
          {item.nickname ? item.nickname.substr(-2, 2) : item.userName.substr(-2, 2)}
        </Avatar>
        {(type === 3 || type === 5 || type === 4) && showDelBtn && (
          <div className="remove_icon" onClick={() => removeMember(item)}></div>
        )}
        <div className="show_name text-ellipsis">{item.nickname ? item.nickname : item.userName}</div>
        {/* 群主 */}
        {item.memberType === 0 && <span className="group_owner">群主</span>}
        {/* 管理员 */}
        {isManager === 2 && <span className="group_manager">管理员</span>}
      </div>
    )
  }

  //渲染成员列表
  const Cell = memo(({ columnIndex, rowIndex, style }: any) => {
    const item = chatUserState.searchResultList[rowIndex * 5 + columnIndex]
    if (!item) {
      return null
    }
    const isManager = user?.userId === item.userId ? user?.userType : item.memberType

    return roomManager.userId === nowUserId ? (
      <ChatUserItem key={item.userId} data={item} setManager={setManager}>
        {userItem(item, style, isManager)}
      </ChatUserItem>
    ) : (
      userItem(item, style, isManager)
    )
  }, areEqual)
  //渲染成员列表
  const renderUserList = useMemo(() => {
    return (
      <AutoSizer>
        {({ height, width }: any) => (
          <Grid
            className="Grid"
            columnCount={5}
            columnWidth={53}
            height={height}
            style={{ overflow: 'overlay' }}
            rowCount={Math.ceil(chatUserState.searchResultList.length / 5)}
            rowHeight={60}
            width={width}
          >
            {Cell}
          </Grid>
        )}
      </AutoSizer>
    )
  }, [chatUserState.searchResultList])

  const { searchState, listType, memberLoading, chatUserTree, expandedKeys } = chatUserState

  return (
    <section className="chatMemberBox">
      <div className="chatMemberDisplayType">
        {/* {(type === 4 || type === 6) && (
          <>
            <Tooltip placement="bottom" title="列表">
              <span
                className={`user_lists_icon ${listType ? 'active' : ''}`}
                onClick={() => changeListType(true)}
              ></span>
            </Tooltip>
            <Tooltip placement="bottom" title="架构">
              <span
                className={`user_team_icon ${!listType && 'active'}`}
                onClick={() => changeListType(false)}
              ></span>
            </Tooltip>
          </>
        )} */}
        <Input.Search
          className="search-input"
          placeholder="请输入姓名"
          onSearch={value => {
            setChatUserState({
              keywords: value,
              searchState: !searchState,
            })
          }}
          onPressEnter={searchChatMembers}
          ref={inputRef}
        />
      </div>
      <Spin spinning={memberLoading} wrapperClassName={`main-spin ${chatUserState.isFold ? 'sort' : 'long'}`}>
        {listType && (
          <>
            <div className={`${chatUserState.isFold ? 'sort' : 'long'} chatMemberLists`}>
              {renderAddBtn()}
              <div style={{ flex: 1, minHeight: 240 }}>{renderUserList}</div>
            </div>
          </>
        )}
        {!listType && !searchState && (
          <Tree
            multiple
            className="chatMemberTree"
            onSelect={(expKeys: any) => {
              onExpandCmy(expKeys)
            }}
            onExpand={(expKeys: any) => {
              onExpandCmy(expKeys)
            }}
            blockNode={true}
            expandedKeys={expandedKeys}
            selectedKeys={expandedKeys ? expandedKeys : []}
            showIcon
            loadData={getChildTree}
            treeData={chatUserTree}
            onDoubleClick={onDoubleClick}
            onRightClick={onRightClick}
          />
        )}
        {!listType && searchState && (
          <Tree
            className="chatMemberTree"
            showIcon
            loadData={getChildTree}
            treeData={chatUserTree}
            onDoubleClick={onDoubleClick}
            onRightClick={onRightClick}
          />
        )}
        {nodeTreeItem.visible && getNodeTreeMenu()}
      </Spin>
      {listType && chatUserState.searchResultList.length > 24 && (
        <div className="read_more_btn" onClick={readMoreUser}>
          {chatUserState.isFold ? '查看更多群成员' : '收起群成员'}
          <span className={`direction_icon ${chatUserState.isFold ? '' : 'fold'}`}></span>
        </div>
      )}
      {/* 邀请加入群聊模态框 */}
      {modalVisible && (
        <InviteModal
          title="添加新成员"
          visible={modalVisible}
          closeModal={() => setModalVisible(false)}
          onOk={(dataList: any[]) => {
            setModalVisible(false)
            newMember(dataList)
          }}
          roomType={type}
        />
      )}
    </section>
  )
}

export default ChatUser

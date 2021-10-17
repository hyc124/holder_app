import React, { useEffect } from 'react'
import { List, Avatar } from 'antd'
import { useMergeState } from '../ChatWin'
import { queryAddressList } from '../getData/getData'
import { getAvatarEnums } from '@/src/views/chatwin/getData/ChatHandle'
interface ParamProps {
  keywords: string
  refcallback: (item: any, type: any) => void
}
let count = 0
const SearchCategoryList = ({ keywords, refcallback }: ParamProps) => {
  // 搜索列表
  const [roomListState, setRoomListState] = useMergeState({
    hasPerson: 0, //大于0展示加载更多按钮
    hasGroup: 0, //大于0展示加载更多按钮
    groupData: [], //群组数据
    privateData: [], //私聊数据
    allGroupData: [], // 所有的群聊
    allPersonList: [], // 所有的私聊
  })

  useEffect(() => {
    queryAddressList(keywords).then((data: any) => {
      const { roomList, personList } = data
      // 判断群列表是否大于三，如果大于三，只取前三条
      const groupList = roomList && roomList.length > 3 ? roomList.slice(0, 3) : roomList
      // 判断私聊列表是否大于三，如果大于三，只取前三条
      const privateList = personList && personList.length > 3 ? personList.slice(0, 3) : personList
      setRoomListState({
        groupData: groupList || [],
        privateData: privateList || [],
        hasPerson: personList && personList.length > 3 ? 1 : 0,
        hasGroup: roomList && roomList.length > 3 ? 1 : 0,
        allGroupData: roomList || [],
        allPersonList: personList || [],
      })
    })
  }, [keywords])

  //加载更多人员
  const loadMorePerson = (type: number) => {
    if (type === 0) {
      setRoomListState({
        privateData: roomListState.allPersonList || [],
        hasPerson: 0,
      })
    } else {
      setRoomListState({
        groupData: roomListState.allGroupData || [],
        hasGroup: 0,
      })
    }
  }

  const handleSerchText = (str: string) => {
    const substr = `/${keywords}/g`
    const replaceStr = str?.replace(substr, '<em>' + keywords + '</em>')
    return replaceStr
  }

  return (
    <div className="chat-category-list">
      <div className="serch-list">
        <div className="look-private-chat">
          <div className="content-nav">
            <span className="title">聊天</span>
          </div>
          <div className="content" style={{ display: 'block' }}>
            {roomListState.privateData.length !== 0 && (
              <List
                dataSource={roomListState.privateData}
                renderItem={(item: any, index: number) => (
                  <List.Item
                    key={index}
                    onClick={() => {
                      count += 1
                      setTimeout(() => {
                        if (count === 1) {
                          refcallback(item, 'personal')
                        } else if (count === 2) {
                          refcallback(item, 'personal')
                        }
                        count = 0
                      }, 200)
                    }}
                    className="group-list-item"
                  >
                    <div className="chat_item flex">
                      <Avatar size={32} className="oa-avatar flex center" src={item.profile}>
                        {item.username?.substr(-2, 2)}
                      </Avatar>
                      <div className="info">
                        <span
                          className="chat_title text-ellipsis"
                          dangerouslySetInnerHTML={{ __html: handleSerchText(item.username) }}
                        ></span>
                        {item.online === 1 && <span className="on_line">在线</span>}
                        {item.online === 0 && <span className="off_line">离线</span>}
                      </div>
                    </div>
                  </List.Item>
                )}
              ></List>
            )}
            {roomListState.privateData.length == 0 && <NoneDataTip />}
            {roomListState.hasPerson > 0 && (
              <div className="loadMoreBtn" onClick={() => loadMorePerson(0)}>
                <span className="moreTitle">查看更多相关成员</span>
                <span className="rIcon"></span>
              </div>
            )}
          </div>
        </div>
        <div className="look-group">
          <div className="content-nav">
            <span className="title">群组</span>
          </div>
          <div className="content" style={{ display: 'block' }}>
            {roomListState.groupData.length !== 0 && (
              <List
                dataSource={roomListState.groupData}
                renderItem={(item: any, index: number) => (
                  <List.Item
                    key={index}
                    onClick={() => {
                      count += 1
                      setTimeout(() => {
                        if (count === 1) {
                          refcallback(item, 'group')
                        } else if (count === 2) {
                          refcallback(item, 'group')
                        }
                        count = 0
                      }, 200)
                    }}
                    className="group-list-item"
                  >
                    <div className="chat_item flex">
                      <Avatar
                        size={32}
                        className="oa-avatar flex center"
                        src={
                          item.profile
                            ? $tools.htmlDecodeByRegExp(item.profile)
                            : getAvatarEnums(item.type, item.roomName)
                        }
                      >
                        {item.roomName.substr(-2, 2)}
                      </Avatar>
                      <div className="info">
                        <span
                          className="chat_title text-ellipsis"
                          dangerouslySetInnerHTML={{ __html: handleSerchText(item.roomName) }}
                        ></span>
                        {item.type == 6 && <span className="all_member">全员</span>}
                        {item.type == 4 && <span className="dept_member">部门</span>}
                      </div>
                    </div>
                  </List.Item>
                )}
              ></List>
            )}
            {roomListState.groupData.length == 0 && <NoneDataTip />}
            {roomListState.hasGroup > 0 && (
              <div className="loadMoreBtn" onClick={() => loadMorePerson(1)}>
                <span className="moreTitle">查看更多相关群组</span>
                <span className="rIcon"></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
//空数据提示
const NoneDataTip = () => {
  return <div className="noneTips">暂时没有数据哦~</div>
}

export default SearchCategoryList

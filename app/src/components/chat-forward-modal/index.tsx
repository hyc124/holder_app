/**
 * 用户端选择最近联系人，常用部门，常用岗位和根据组织架构选择的modal组件
 */
import React, { useState, useEffect, useRef } from 'react'
import { Modal, Tabs, List, Avatar, Checkbox, message, Spin, Button, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
const { TabPane } = Tabs
import './index.less'
import '../select-member-org/org-modal.less'
import InfiniteScroll from 'react-infinite-scroller'
import { MemberOrgLeft } from '../select-member-org'
import { getListAvatar } from '@/src/views/chatwin/component/ChatHeader'
import { getAvatarEnums } from '@/src/views/chatwin/getData/ChatHandle'
import { isChecked } from '@/src/views/chatwin/component/global/common'
import { useMergeState } from '@/src/views/chat-history/ChatItem'
interface ChatForwardModalProps {
  modalTitle?: string //默认选择人员
  awaysTitle?: string //第一个tab选项的title 默认最近联系人 可能为常用部门 常用岗位
  awaysUrl?: string //请求接口地址
  showSearch?: boolean //是否显示搜索框
  isQueryAll?: number //是否查询所有数据
  onSelected: (data: any) => void //点击确定后回调
  onCancelModal: () => void //关闭弹窗回到
  openFordRoom?: (data: any, id?: number) => void // 打开转发的群聊窗口
  nodeSelected?: any[] //已经选中的节点回显 默认为[]
  checkType?: boolean //单选多选类型 默认多选 true为checkbox false为radio
  findType?: number //查询类型 默认人员 0  3部门 31岗位
  permissionType?: number //数据权限类型 （开启数据权限控制才生效）
  dataAuth?: boolean //是否开启数据权限控制
  visible: boolean //是否显示选择弹窗
  chatMsg: string //转发内容
  teamId?: number //企业id
  isOuterSystem?: number // 为1时查询外部系统数据
  approvalObj?: { approvalId: any; eventId: number; uuid: string; elementType: string } //外部数据
  selectList: any
  pageSize: 10
  sendType?: string // 在那个模块下调用的转发  communication: 沟通
}

//常用联系人数据
interface ContactsListProps {
  id: number
  ownerUser: number
  contactsType: number
  contactsUser: number //常用联系人id
  contactsAccount: string //常用联系人账号
  contactsUsername: string //常用联系人名称
  profile: string //头像
  contactsTeamId: number
  contactsTeamName: string
  contactsDeptId: number
  contactsDeptName: string
  contactsRoleId: number
  contactsRoleName: string
  createTime: string
}

/**
 * 用户端查询人员部门岗位
 */
const ChatForwardModal: React.FC<ChatForwardModalProps> = ({
  visible,
  chatMsg,
  modalTitle,
  nodeSelected,
  onCancelModal,
  openFordRoom,
  awaysTitle,
  findType,
  sendType,
  onSelected,
  isOuterSystem = 0,
}) => {
  const listRef = useRef<any>(null)
  const chatRef = useRef<any>(null)
  const searchRef = useRef<any>({})
  const { nowUserId, loginToken, nowAccount } = $store.getState()

  //页码
  const [pagination, setPagination] = useState({
    pageNo: 0,
    pageSize: 10,
    total: 0,
  })

  const [gloable, setGloable] = useMergeState({
    tabKey: `${isOuterSystem}`,
    groupKewords: '',
    visibleUser: false,
    loading: false,
    hasMore: false,
    btnLoading: false,
    listData: [], //常用列表
    groupData: [], //群组
    saveAllSelect: [],
    listPageNo: 0,
    totalPages: 0,
  })

  useEffect(() => {
    // 默认选中的数据
    if (nodeSelected) {
      for (let i = 0; i < nodeSelected.length; i++) {
        const $item = nodeSelected[i]
        nodeSelected[i].name = $item.subject
        nodeSelected[i].profile = $item.icon
        if ($item.type === 'personal') {
          nodeSelected[i].id = $item.userId
        }
      }
      setGloable({ saveAllSelect: nodeSelected })
    }
  }, [nodeSelected])

  //初始查询常用联系tab
  useEffect(() => {
    //外部数据缓存人员列表
    setGloable({ listPageNo: 0 })
    switch (gloable.tabKey) {
      case '0':
        //常用查询
        queryContactGroup(gloable.tabKey).then(list => {
          setGloable({ listData: list })
        })
        break
      case '1':
        //群组查询
        queryGroup(gloable.tabKey)
        break
      case '2':
        // 组织架构查询
        setGloable({
          visibleUser: true,
        })
        break
    }
  }, [gloable.tabKey])

  //查询群组
  const queryGroup = (key: string | number) => {
    $(listRef.current).scrollTop(0)
    // setGloable({ hasMore: true })
    queryContactGroup(key)
      .then((data: any) => {
        setGloable({ groupData: data })
        // setPagination({ ...pagination, total: data })
      })
      .catch(() => {
        if (isOuterSystem === 1) {
          onCancelModal()
        }
      })
  }

  //群组查询监听
  useEffect(() => {
    setGloable({ listPageNo: 0 })
    queryGroup('1')
  }, [gloable.groupKewords])

  //查询最近联系人/群组
  const queryContactGroup = (tabKey: any) => {
    return new Promise<Array<ContactsListProps>>(resolve => {
      const param = {
        userId: nowUserId,
        keywords: gloable.groupKewords,
      }
      $api
        .request('/im-biz/chatRoom/lastContactsAndGroupChat/search', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(resData => {
          const { recentRoomList, groupRoomList } = (resData && resData.data) || {}
          if (tabKey === '1') {
            resolve(groupRoomList)
          }
          if (tabKey === '0') {
            resolve(recentRoomList)
          }
          // resolve(resData.data.content)
        })
    })
  }

  //选择人员弹窗点击确定
  const sureSelectUsers = () => {
    // 如果是发起工作报告分享到沟通
    if (sendType && sendType === 'share') {
      onSelected(gloable.saveAllSelect)
      return
    }
    // 转发的消息内容
    const _content = chatMsg ? JSON.parse($tools.htmlDecodeByRegExp(chatMsg)) : ''
    // 私聊的id集合
    const forwardUserIds: any = []
    // 群聊的id集合
    const forwardRoomIds: any = []
    gloable.saveAllSelect.map((item: any) => {
      if (item.type === 3) {
        forwardUserIds.push(item.userId)
      } else {
        forwardRoomIds.push(item.id)
      }
    })
    if (forwardUserIds.length === 0 && forwardRoomIds.length === 0) {
      message.error('接收人员不能为空')
      return false
    }
    let forwardMsg = null
    // 文本消息不需要转JSON字符串
    if (_content?.type === 1) {
      forwardMsg = _content.messageJson
    } else if (_content?.type === 2) {
      // 转发@消息需转成文本类型
      const atMsg = $tools.isJsonString(_content.messageJson)
        ? JSON.parse(_content.messageJson)
        : _content.messageJson
      forwardMsg = atMsg?.content
    } else {
      // 其他文件类型需将messageJSON转出JSON字符串
      forwardMsg = $tools.isJsonString(_content.messageJson)
        ? _content.messageJson
        : JSON.stringify(_content.messageJson)
    }
    const forwardUserIdList = forwardUserIds.filter((id: any) => id !== nowUserId)
    const param = {
      userId: nowUserId,
      forwardUserIds: forwardUserIdList.join(','),
      forwardRoomIds: forwardRoomIds.join(','),
      messageJson: forwardMsg,
      messageType: _content?.type === 2 ? 1 : _content?.type,
    }

    setGloable({ btnLoading: true })
    $api
      .request('/im-biz/chatRoom/message/forward', param, {
        headers: { loginToken },
        formData: true,
      })
      .then((res: any) => {
        if (res.returnCode === 0) {
          message.success('转发成功')
          // 只有沟通转发单个人时才定位到聊天室
          if (sendType == 'communication' && gloable.saveAllSelect.length === 1) {
            const dataList = res.dataList
            openFordRoom && openFordRoom(gloable.saveAllSelect, dataList[0])
          }
        } else {
          message.error(res.returnMessage || '转发失败')
        }
        onCancelModal()
      })
      .finally(() => {
        setGloable({ btnLoading: false })
        onCancelModal()
      })
  }

  //选中常用列表中成员时
  const setCheckData = (e: any) => {
    const { roomName, typeId, type, profile, roomId } = e.target['data-props']
    if (!!e.target.checked) {
      if (!isChecked(gloable.saveAllSelect, type === 3 ? typeId : roomId)) {
        setGloable({
          saveAllSelect: [
            ...gloable.saveAllSelect,
            {
              id: type === 3 ? typeId : roomId,
              type: type,
              userId: type === 3 ? typeId : roomId,
              profile: profile,
              name: roomName,
            },
          ],
        })
      }
      return
    }
    const newSelectAll = gloable.saveAllSelect.filter((item: any) => {
      const condition1 = item.type === 3 && Number(item.userId) !== Number(typeId)
      const condition2 = item.type !== 3 && Number(item.id) !== Number(roomId)
      return condition1 || condition2
    })
    setGloable({ saveAllSelect: newSelectAll })
  }

  //切换modal中tabs
  const changeModalTabs = (activeKey: string) => {
    setGloable({ tabKey: activeKey })
  }

  //右侧删除已经选中
  const delMember = (items: any) => {
    const { userId, id } = items
    const _id = items.type === 'personal' ? userId : id
    const newSelectUsers = gloable.saveAllSelect.filter((item: any) => {
      const $id = item.type === 'personal' ? item.userId : item.id
      return $id !== _id
    })
    setGloable({ saveAllSelect: newSelectUsers })
    if (items.type === 'personal') {
      chatRef.current?.delByType({
        curType: 0,
        curId: items.userId,
      })
    }
  }

  /**
   * 设置保存选中的数据
   */
  const onSetSelData = (list: any, checked: boolean) => {
    let newArr: any = []
    if (checked === undefined) {
      // 搜索成员后相关操作
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        if (!item.type) {
          // 没有返回 type说明是当前点击项 （ type: 'personal'人员选择）
          const isChecked = checkedOff(gloable.saveAllSelect, item.curId)
          if (!isChecked) {
            // 没有在已选中集合中，则新增最新点击项
            newArr.push({
              id: item.curId,
              name: item.curName,
              type: 3,
              userId: item.curId,
              profile: item.profile,
            })
          }
        }
      }
      setGloable({ saveAllSelect: [...gloable.saveAllSelect, ...newArr] })
    } else if (checked === false) {
      // 取消选中成员（在右侧展示列表删除对应成员）
      if (list.length) {
        const data = JSON.parse(JSON.stringify(gloable.saveAllSelect))
        const idList = list.map((v: any) => Number(v.curId))
        newArr = data.filter((item: any) => {
          const id = Number(item.userId)
          const idx = idList.indexOf(id)
          return item.type !== 3 || (item.type === 3 && idx !== -1)
        })
        setGloable({ saveAllSelect: newArr })
      } else {
        const data = gloable.saveAllSelect.filter((item: any) => {
          return item.type !== 3
        })
        setGloable({ saveAllSelect: data })
      }
    } else {
      // 选中成员
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        const curId = item.curId
        if (!isIn(Number(curId))) {
          newArr.push({
            name: item.curName,
            id: curId,
            profile: item.profile,
            type: 3,
            userId: curId,
          })
        }
      }
      setGloable({ saveAllSelect: [...gloable.saveAllSelect, ...newArr] })
    }
  }

  // 取消选中人员对比
  const checkedOff = (arr: any, _uid: any) => {
    let isInArr = false
    for (let i = 0; i < arr.length; i++) {
      if (Number(arr[i].userId) === Number(_uid)) {
        isInArr = true
        // 最新点击项在已选中集合中，则在该集合中删除最新点击项
        gloable.saveAllSelect.splice(i, 1)
        i--
        break
      }
    }
    return isInArr
  }

  const isIn = (id: number) => {
    let isInArr = false
    gloable.saveAllSelect.map((item: any) => {
      const flag1 = item.type === 'personal' && Number(item.userId) === Number(id)
      const flag2 = item.type !== 'personal' && Number(item.id) === Number(id)
      if (flag1 || flag2) {
        isInArr = true
        return false
      }
    })
    return isInArr
  }

  // 判断是否选择
  const isCheckItem = (dataList: any, selectId: number) => {
    let isInArr = false
    dataList.map((item: any) => {
      if (item.id === selectId) {
        isInArr = true
        return false
      }
    })
    return isInArr
  }

  /**
   * 获取选中的数据
   */
  const getSelData = () => {
    const newArr: any = []
    for (let i = 0; i < gloable.saveAllSelect.length; i++) {
      const _e = gloable.saveAllSelect[i]
      if (_e.type === 3) {
        newArr.push({
          curName: _e.name,
          curId: _e.userId,
          profile: _e.profile,
          curType: 0,
          type: 'personal',
        })
      }
    }
    return newArr
  }
  //滚动加载
  const handleInfiniteOnLoad = () => {
    setGloable({ loading: true })
    if (gloable.listPageNo + 1 >= gloable.totalPages) {
      setGloable({ loading: false, hasMore: false })
      return
    }
    const param = {
      userId: nowUserId,
      type: Number(gloable.tabKey),
      pageNo: gloable.listPageNo + 1,
      pageSize: pagination.pageSize,
      keywords: gloable.groupKewords,
    }
    $mainApi
      .request('/im-consumer/project/chat/findTranspondMucModels', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        setGloable({
          listPageNo: gloable.listPageNo + 1,
          groupData: [...gloable.groupData, ...resData.data.content],
          loading: false,
        })
      })
      .finally(() => {
        setGloable({ loading: false })
      })
  }
  const showModalTitle = findType === 3 ? '选择部门' : findType === 31 ? '选择岗位' : '选择人员'
  const awaysModalTitle = findType === 3 ? '常用部门' : findType === 31 ? '常用岗位' : '最近联系人'
  return (
    <Modal
      visible={visible}
      title={modalTitle || showModalTitle || '转发/分享'}
      width={850}
      className="chat-forward-modal selectMemberOrgModal"
      centered
      closable
      zIndex={9999}
      destroyOnClose
      onCancel={onCancelModal}
      footer={[
        <Button key="back" onClick={onCancelModal}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={gloable.btnLoading} onClick={sureSelectUsers}>
          确定
        </Button>,
      ]}
    >
      <div className="modal-content">
        <div className="modal-left">
          <Tabs className="user-modal-tabs" activeKey={gloable.tabKey} onChange={changeModalTabs}>
            {isOuterSystem === 0 && (
              <TabPane key={'0'} tab={awaysTitle || awaysModalTitle || '最近联系人'}>
                <List
                  className="concats-list"
                  itemLayout="horizontal"
                  dataSource={gloable.listData}
                  renderItem={(item: any) => (
                    <List.Item key={item.roomId} style={{ paddingRight: '20px' }} className="flex center-v">
                      <Checkbox
                        onChange={setCheckData}
                        data-props={item}
                        checked={isCheckItem(
                          gloable.saveAllSelect,
                          item.type === 3 ? item.typeId : item.roomId
                        )}
                      >
                        <Avatar
                          src={
                            item.profile
                              ? $tools.htmlDecodeByRegExp(item.profile)
                              : getAvatarEnums(item.type, item.roomName)
                          }
                          icon={item.type !== 3 && getListAvatar()}
                          className="oa-avatar flex center"
                          size={32}
                        >
                          {item.type === 3 && item.roomName?.substr(-2, 2)}
                        </Avatar>
                        <div className="user-name">{item.roomName}</div>
                      </Checkbox>
                    </List.Item>
                  )}
                />
              </TabPane>
            )}
            <TabPane key={'1'} tab={'群组'}>
              <div style={{ paddingRight: '20px', height: 450, overflow: 'auto' }} ref={listRef}>
                <Input
                  ref={searchRef}
                  placeholder="搜索群组"
                  className="baseSearch radius16 w100 mb10"
                  allowClear
                  prefix={
                    <SearchOutlined
                      onClick={(e: any) => {
                        e.stopPropagation()
                        setGloable({
                          groupKewords: searchRef.current.state.value,
                        })
                      }}
                    />
                  }
                  onPressEnter={() => {
                    setGloable({
                      groupKewords: searchRef.current.state.value,
                    })
                  }}
                  onChange={(e: any) => {
                    if (e.target.value == '') {
                      setGloable({
                        groupKewords: e.target.value,
                      })
                    }
                  }}
                />
                {/* <InfiniteScroll
                  initialLoad={false} // 不让它进入直接加载
                  pageStart={0} // 设置初始化请求的页数
                  hasMore={!gloable.loading && gloable.hasMore} // 是否继续监听滚动事件 true 监听 | false 不再监听
                  loadMore={handleInfiniteOnLoad} // 监听的ajax请求
                  useWindow={false} // 不监听 window 滚动条
                  style={{ height: '100%' }}
                  threshold={10}
                >
                  <List
                    className="concats-list"
                    itemLayout="horizontal"
                    dataSource={gloable.groupData}
                    renderItem={(item: any) => (
                      <List.Item className="flex center-v">
                        <Checkbox
                          onChange={setCheckData}
                          data-props={item}
                          checked={isChecked(gloable.saveAllSelect, item.id)}
                        >
                          <Avatar
                            src={
                              item.profile
                                ? $tools.htmlDecodeByRegExp(item.profile)
                                : getAvatarEnums(item.talkType, item.subject)
                            }
                            icon={item.talkType !== 3 && getListAvatar()}
                            className="oa-avatar flex center"
                            size={32}
                          ></Avatar>
                          <div className="user-name">
                            {item.subject}
                            {item.type === 'org' && <div>全员</div>}
                            {item.type === 'dept' && <div>部门</div>}
                          </div>
                        </Checkbox>
                      </List.Item>
                    )}
                  />
                </InfiniteScroll> */}
                <List
                  className="concats-list"
                  itemLayout="horizontal"
                  dataSource={gloable.groupData}
                  renderItem={(item: any) => (
                    <List.Item className="flex center-v" key={item.roomId}>
                      <Checkbox
                        onChange={setCheckData}
                        data-props={item}
                        checked={isChecked(gloable.saveAllSelect, item.roomId)}
                      >
                        <Avatar
                          src={
                            item.profile
                              ? $tools.htmlDecodeByRegExp(item.profile)
                              : getAvatarEnums(item.type, item.roomName)
                          }
                          icon={item.type !== 3 && getListAvatar()}
                          className="oa-avatar flex center"
                          size={32}
                        ></Avatar>
                        <div className="user-name">
                          {item.roomName}
                          {/* {item.type === 'org' && <div>全员</div>}
                          {item.type === 'dept' && <div>部门</div>} */}
                        </div>
                      </Checkbox>
                    </List.Item>
                  )}
                />
              </div>
            </TabPane>
            <TabPane key={'2'} tab={'成员'}>
              {gloable.visibleUser && (
                <MemberOrgLeft
                  ref={chatRef}
                  options={{ visible: gloable.visibleUser, tabKey: gloable.tabKey, notAccount: nowAccount }}
                  action={{
                    onSetSelData,
                    getSelData,
                  }}
                />
              )}
            </TabPane>
          </Tabs>
        </div>
        <div className="modal-right">
          <div className="select-title">已选</div>
          <ul className="select-list-ul">
            {gloable.saveAllSelect.map((item: any) => (
              <li key={item.id}>
                {item.type === 3 && (
                  <Avatar src={item.profile} className="oa-avatar flex center">
                    {item.name?.substr(-2, 2)}
                  </Avatar>
                )}
                {item.type !== 3 && (
                  <Avatar
                    src={
                      item.profile
                        ? $tools.htmlDecodeByRegExp(item.profile)
                        : getAvatarEnums(item.type, item.name)
                    }
                    icon={item.type !== 3 && getListAvatar()}
                    className="oa-avatar flex center"
                  >
                    {item.name?.substr(-2, 2)}
                  </Avatar>
                )}
                <span className="user-name">
                  {/* {item.prefixName ? item.prefixName + '-' : ''} */}
                  {item.name}
                </span>
                <span
                  className="del-member"
                  onClick={() => {
                    delMember(item)
                  }}
                ></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  )
}

export default ChatForwardModal

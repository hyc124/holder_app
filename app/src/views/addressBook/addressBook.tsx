/**
 * 通讯录
 */
import React, { useEffect, useState, useRef } from 'react'
import { Input, Button, Pagination, Tree, Tooltip, message, Avatar } from 'antd'
import { SelectMemberOrg } from '@/src/components/select-member-org/index'
import { CaretUpOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons'
import { ipcRenderer } from 'electron'
import { getAvatarEnums } from '@/src/views/chatwin/getData/ChatHandle'
import { getListAvatar } from '@/src/views/chatwin/component/ChatHeader'
import moment from 'moment'
import './addressBook.less'
import { insertChatRoom, updateChatRoom } from '../chatwin/getData/ChatInputCache'
interface DataNode {
  title: string
  key: string
  isLeaf?: boolean
  children?: DataNode[]
}
import {
  findByTypeAndUser,
  findUserMainPostAndDepartment,
  queryAddressList,
  addCustomLinkman,
  deleteCustomLinkman,
  findMemberCard,
  editLinkMan,
  addSingleCustomLinkman,
  findRolesByPermission,
  findRolePermissionUsers,
  mailListFindEnterpriseTreeModel,
  queryUserList,
  getGroupData,
  searchAddressList,
} from './getData'
import {
  sendPrevateTalk,
  openWindow,
  addSubjectChat,
  updateWindowState,
  recordLeaveTime,
} from '../chatwin/getData/getData'
import { unstable_batchedUpdates } from 'react-dom'
import { getLocalRoomData } from '../myWorkDesk/chat/ChatList'
const AddressBook = () => {
  const { nowUser, nowAccount, nowUserId } = $store.getState()
  // 企业列表数据
  const [enterpriseData, setEnterpriseData] = useState([
    {
      id: 0,
      name: '',
      departName: '',
      logo: '',
    },
  ])
  // 搜索框
  const inputRef: any = useRef(null)
  // 搜索内容
  const [keyWords, setkeyWords] = useState('')
  // 搜索后未查到数据文字
  const [oldKeyWords, setOldKeyWords] = useState('')
  // 搜索返回的数据
  const [searchData, setSearchData] = useState({
    searchContacts: [],
    searchGroup: [],
  })
  // 改变成员更多信息
  const [openConMore, setOpenConMore] = useState(false)
  // 改变群组更多信息
  const [openGroupMore, setOpenGroupMore] = useState(false)
  // 点击获取数据
  const [typeData, setTypeData] = useState([
    {
      id: 0,
      name: '',
      profile: '',
      phone: '',
      email: '',
      sex: 0,
      remark: '',
      subject: '',
    },
  ])
  //页码
  const [pagination, setPagination] = useState({
    pageNo: 0,
    pageSize: 20,
    total: 10,
  })
  // 修改左侧企业列表项
  const [chooseKey, setChooseKey] = useState(-1)
  // 最近联系人 0  常用联系人 1   群组 2 全部 -1
  const [chooseType, setChooseType] = useState(0)
  // 判断是否显示通讯录选项
  const [lastChooseType, setLastChooseType] = useState(true)
  // 选人插件
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  // 名片显示
  const [cardVisible, setCardVisible] = useState(false)
  // 名片数据
  const [cardData, setCardData] = useState({})
  // 树结构数据
  const [treeDataList, setTreeData] = useState<any>({
    treeData: [],
  })
  // 设置当前点击的企业信息
  const [currentEnterprise, setCurrentEnterprise] = useState<any>({})

  // 展开子列表的key
  const [expandedKeys, setExpandedKeys] = useState([])

  // 储存当前点击企业信息 以及当前 树状组件显示
  const [enterpriseInfo, setEnterpriseInfo] = useState({
    name: '',
    isRoleSelection: true,
  })

  // 获取企业列表数据
  useEffect(() => {
    findByTypeAndUser({
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }).then((res: any) => {
      setEnterpriseData(res.dataList)
    })
  }, [])

  // 获取企业列表下的部门信息
  const getEnterpriseUser = (index: number, id: number) => {
    findUserMainPostAndDepartment({
      userId: nowUserId,
      ascriptionId: id,
    }).then((res: any) => {
      const data: any = [...enterpriseData]
      data[index].departName = res.data.departName
      data[index].departmentId = res.data.departmentId
      setEnterpriseData(data)
      setChooseKey(index)
    })
  }

  // 查询搜索数据
  const searchDataList = (val: any) => {
    // 避免重复请求接口
    if (val == '') {
      message.warning('请输入搜索关键字')
      return
    }
    searchAddressList(val).then((resData: any) => {
      const { roomList, personList } = resData || {}
      const data: any = {}
      if (personList && personList.length) {
        data.searchContacts = personList
      } else {
        data.searchContacts = []
      }
      if (roomList && roomList.length) {
        data.searchGroup = roomList
      } else {
        data.searchGroup = []
      }
      // 处理批量更新
      unstable_batchedUpdates(() => {
        setOldKeyWords(val)
        setSearchData(data)
        setLastChooseType(false)
        setkeyWords(val)
      })
    })
  }

  // 查看更多设置
  const changeMore = (val: number) => {
    if (val) {
      setOpenGroupMore(!openGroupMore)
    } else {
      setOpenConMore(!openConMore)
    }
  }

  // 选择常用联系人确定的回调方法
  const selMemberSure = (dataList: any) => {
    const idArr: any = []
    dataList.map((item: any) => {
      idArr.push(item.curId)
    })
    addCustomLinkman({
      userId: nowUserId,
      linkmanIds: idArr,
    }).then(() => {
      querList()
    })
  }

  // 搜索接口调用
  const querList = () => {
    const data: any = {
      userId: nowUserId,
      keywords: chooseType == -1 ? keyWords : '',
    }
    if (chooseType == 2) {
      data.pageNo = pagination.pageNo
      data.pageSize = pagination.pageSize
    }
    // 获取最近联系人的列表数据
    if (chooseType == 0) {
      queryUserList(keyWords).then((data: any) => {
        setTypeData(data || [])
      })
    }
    // 常用联系人数据
    if (chooseType == 1) {
      queryAddressList(data).then((res: any) => {
        const content = res.dataList || []
        setTypeData(content)
      })
    }
  }

  // 通讯录列选择选项
  const chooseClassify = (index: number) => {
    setkeyWords('')
    if (chooseType != index) {
      setSearchData({
        searchContacts: [],
        searchGroup: [],
      })
      setChooseType(index)
    } else {
      setLastChooseType(true)
      setChooseType(index)
    }
  }

  // 查询群组的列表数据
  const getGroupList = () => {
    setChooseType(2)
    const { nowUserId } = $store.getState()
    const params = {
      userId: nowUserId,
      keywords: chooseType == -1 ? keyWords : '',
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
    }
    getGroupData(params).then((res: any) => {
      const { totalElements, content } = res || {}
      setPagination({
        ...pagination,
        total: totalElements || 0,
      })
      setTypeData(content || [])
    })
  }

  // 添加常用联系人
  const openSelectMemberOrg = () => {
    const data = [...typeData]
    const selectData: any = []
    data.map((item: any) => {
      selectData.push({
        curId: item.id,
        curName: item.username,
        profile: item.profile,
        curType: 0,
      })
    })
    setSelMemberOrg({
      visible: true,
      selectList: selectData,
      showPrefix: false,
    })
  }

  // 删除常用联系人
  const deleteNameData = (id: any) => {
    deleteCustomLinkman({
      userId: nowUserId,
      linkmanId: id,
    }).then(() => {
      querList()
    })
  }

  // 获取卡片的数据
  const getCardData = (val: any) => {
    if (val.permission == 0) {
      handleSendPrevateTalk(val, 'personal')
      return
    }
    if (val.id == nowUserId) return
    findMemberCard({
      userId: nowUserId,
      linkmanId: val.id,
    }).then((res: any) => {
      const data = res.data
      setCardData(data)
      setCardVisible(true)
    })
  }

  // 获取组织下得树状图数据
  const getTreeData = (val: any, index: number) => {
    setEnterpriseInfo({
      ...val,
      isRoleSelection: index == 1 ? true : false,
    })
    setkeyWords('')
    setLastChooseType(true)
    if (index == 1) {
      findRolesByPermission({
        teamId: val.id,
        account: nowAccount,
        permissionType: 3,
      }).then((res: any) => {
        handleData(res.dataList)
      })
    } else {
      setTreeData({ treeData: [] })
      mailListFindEnterpriseTreeModel({
        id: index == 2 ? val.departmentId : val.id,
        type: index == 2 ? 3 : 2,
        account: nowAccount,
        teamId: val.id,
        permissionType: 3,
        isQueryAll: 0,
        inMyself: 1,
        notAccount: '',
        defaultLevel: 1,
      }).then((res: any) => {
        setCurrentEnterprise({ ...res.data, teamId: val.id })
        handleData(res.data.childs)
      })
    }
  }

  const handleData = (data: any) => {
    const dt: any = data
    for (const i in dt) {
      const item: any = dt[i]
      item.key = item.id || item.userId
      if (item.type == 0) {
        item.name = item.name
        if (item.roleName) {
          item.name += '-' + item.roleName
        }
        //用户
        item.username = item.name
        item.title = (
          <NameCom
            listData={item}
            isDelete={false}
            clickComUse={(val: any) => {
              getCardData(val)
            }}
          ></NameCom>
        )
      } else {
        item.title = item.name || item.username || item.roleName
      }
      if (item.hasChild == 0) {
        item.isLeaf = true
      }
      item.children = item.childs || item.children || []
      if (item.children && item.children.length > 0) {
        handleData(item.children)
      }
    }
    setTreeData({ treeData: dt })
  }

  // 组织结构的异步获取
  const onRoleOrgLoadEntData = (treeNode: any): Promise<void> => {
    return new Promise(resolve => {
      if (treeNode.children && treeNode.children.length > 0) {
        resolve()
        return
      }
      queryRoleTreeEntChild(treeNode, resolve)
    })
  }

  // 点击查询组织架构子级
  const queryRoleTreeEntChild = (treeNode: any, resolve?: () => void) => {
    mailListFindEnterpriseTreeModel({
      id: treeNode.id,
      type: treeNode.type,
      account: nowAccount,
      teamId: currentEnterprise.teamId,
      permissionType: 3,
      isQueryAll: 0,
      inMyself: 1,
      notAccount: '',
      defaultLevel: 1,
    }).then((res: any) => {
      for (const i in res.data.childs) {
        if (!res.data.childs[i].username) {
          res.data.childs[i].name = res.data.childs[i].name
          if (res.data.childs[i].type == 0) {
            res.data.childs[i].name = res.data.childs[i].name
            if (res.data.childs[i].roleName) {
              res.data.childs[i].name += '-' + res.data.childs[i].roleName
            }
          }
          res.data.childs[i].username = res.data.childs[i].name
          res.data.childs[i].userId = res.data.childs[i].id
        }
      }

      const setData = setTreeChild(treeDataList.treeData, treeNode.key, res.data.childs)
      treeDataList.treeData = setData
      setTimeout(() => {
        setTreeData({ treeData: [...setData] })
      }, 300)
      if (resolve) {
        resolve()
      }
    })
  }

  // 异步请求角色数据
  const onRoleOrgLoadData = (treeNode: any): Promise<void> => {
    return new Promise(resolve => {
      if (treeNode.children && treeNode.children.length > 0) {
        resolve()
        return
      }
      queryRoleTreeChild(treeNode, resolve)
    })
  }

  const setTreeChild = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] => {
    return list.map((node: any) => {
      children.map((item: any, index: number) => {
        if (item.hasChild == 0) {
          item.isLeaf = true
        }
        // key值重复会报错
        item.key = item.userId + key + Math.floor(Math.random() * 10000000)

        if (item.type == 0) {
          item.username = item.name
          item.title = (
            <NameCom
              listData={item}
              ind={index}
              isDelete={false}
              deleteComUse={(id: any) => {
                deleteNameData(id)
              }}
              clickComUse={(val: any) => {
                getCardData({ id: val.userId })
              }}
            ></NameCom>
          )
        } else {
          item.title = item.name || item.username || item.roleName
        }
      })
      if (node.key === key) {
        return {
          ...node,
          children: children,
        }
      }
      if (node.children) {
        return {
          ...node,
          children: setTreeChild(node.children, key, children),
        }
      }
      return node
    })
  }

  // 点击查询组织架构子级
  const queryRoleTreeChild = (treeNode: any, resolve?: () => void) => {
    findRolePermissionUsers({
      roleId: treeNode.id,
      account: nowAccount,
      permissionType: 3,
    }).then((res: any) => {
      for (const i in res.dataList) {
        if (!res.dataList[i].username) {
          res.dataList.splice(i, 1)
          break
        }
      }
      const setData = setTreeChild(treeDataList.treeData, treeNode.key, res.dataList)
      treeDataList.treeData = [...setData]
      setTreeData({ treeData: [...setData] })
      if (resolve) {
        resolve()
      }
    })
  }

  const openRoom = async (resData: any) => {
    // 打开沟通窗口
    const { chatListData, openRoomIds, selectItem, messageList } = $store.getState()
    const dataList = JSON.parse(JSON.stringify(chatListData))
    // const data = [...dataList, resData]
    insertChatRoom(resData)
    // 列表排序
    // data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
    //   if (a.isTop === b.isTop) {
    //     return moment(b.timeStamp).valueOf() - moment(a.timeStamp).valueOf()
    //   }
    //   return b.isTop - a.isTop
    // })
    const newIds = [...openRoomIds, resData.roomId]
    // 简略消息
    const briefMsg = {
      roomType: resData.type,
      roomId: resData.roomId,
    }
    // 记录离开群的时间
    if (resData?.roomId !== selectItem?.roomId && selectItem?.roomId) {
      const params = {
        roomId: selectItem?.roomId,
        userId: nowUserId,
      }
      recordLeaveTime(params).then(() => null)
    }
    const newBriefList = [briefMsg, ...messageList]
    // 更新简略信息
    $store.dispatch({ type: 'SET_CHAT_MESSAGE', data: { messageList: newBriefList || [] } })
    ipcRenderer.send('show_commuciate_muc', [selectItem, resData])
    // 保存当前在独立窗口打开的聊天室
    $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
    // 更新列表
    // await $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
    await getLocalRoomData(false, 'time')
    // 设置滚动条的位置
    const resultData = chatListData.filter(item => {
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

  const handleSendPrevateTalk = (record: any, type: string) => {
    const { chatListData, openRoomIds, selectItem, nowUserId } = $store.getState()
    let clickId: number | null = null
    if (type === 'group') {
      clickId = record.roomId
    } else {
      // 当前选择的列表
      const targetLIst = chatListData.filter((item: any) => item.typeId === record.id)
      clickId = targetLIst.length && targetLIst[0].roomId
    }
    const params = {
      roomId: clickId,
      state: 0,
      userId: nowUserId,
    }
    const data = JSON.parse(JSON.stringify(chatListData))
    let isIn = false
    let newIds = [...openRoomIds]
    // 点击后更新当前聊天室的状态
    let newList: any = []
    newList = data.map((item: any) => {
      if (item.roomId === clickId) {
        const objItem = {
          ...item,
          windowClose: 0,
        }
        updateChatRoom(objItem) //更新本地数据库
        return objItem
      }
      return item
    })
    data.map((item: any) => {
      if (item.roomId === clickId) {
        isIn = true
        const isRoomOpen = openRoomIds.some(thisId => {
          return thisId === item.roomId
        })

        // 记录离开群的时间
        if (item?.roomId !== selectItem?.roomId && selectItem?.roomId) {
          const data = {
            roomId: selectItem.roomId,
            userId: nowUserId,
          }
          recordLeaveTime(data).then(() => null)
        }

        // 更新列表
        $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: newList } })
        // getLocalRoomData(false, 'time')
        if (!isRoomOpen) {
          // 判断聊天室是否打开（是否存在聊天室列表）
          newIds = [...openRoomIds, item.roomId]
          $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
        }
        // 打开聊天窗口
        ipcRenderer.send('show_commuciate_muc', [selectItem, item])
      }
    })
    // 判断聊天室是否打开（是否存在聊天室列表）
    if (isIn) {
      // 筛选出当前选择行的数据
      const targetListData = chatListData.filter((item: any) => {
        return item.roomId === clickId
      })
      // 设置滚动条的位置
      const resultData = chatListData.filter(item => {
        return newIds.indexOf(item.roomId) !== -1
      })
      // 更新当前选择行的状态
      if (targetListData[0]?.windowClose === 1 && clickId) {
        // 更新聊天室状态
        updateWindowState(params).then(() => null)
      }
      resultData.map((item: any, index: number) => {
        if (
          (type === 'personal' && item.typeId === record.id) ||
          (type === 'group' && item.roomId === record.roomId)
        ) {
          const offsetTop = index * 62
          $('#chat_list_main').scrollTop(offsetTop - 100)
        }
      })
    } else {
      // 请求接口打开聊天室
      if (type == 'personal') {
        // 当前人的信息
        const manager: any = { account: nowAccount, id: nowUserId, username: nowUser }
        // 私聊人的信息
        const result = [
          {
            id: record.id,
            username: record.username,
          },
        ]
        // 创建聊天室所需参数
        const params = {
          roomManager: manager,
          roomName: record.username,
          headPhoto: record.profile ? record.profile : '',
          roomMembers: result,
          type: 3,
        }
        addSubjectChat(params).then((resData: any) => {
          openRoom(resData)
        })
      } else {
        openRoom(record)
      }
    }
  }

  useEffect(() => {
    setTreeData({ treeData: [] })
    if (chooseType < 3 && chooseType != -1) {
      querList()
      setkeyWords('')
      setLastChooseType(true)
    }
  }, [chooseType])

  useEffect(() => {
    querList()
  }, [pagination.pageNo, pagination.pageSize])

  // 监听展开子列表
  const onExpandCmy = (expandedKeys: any, e: { expanded: boolean; node: any }) => {
    setExpandedKeys(expandedKeys)
  }

  return (
    <div className="flex adressBookBox">
      <div className="classifyData">
        <div className="title">
          <span>通讯录</span>
        </div>
        <div className="inputBox">
          <Input
            ref={inputRef}
            placeholder="请输入联系人、群组"
            className="org_menu_search baseInput radius16 border0 bg_gray"
            value={keyWords}
            prefix={
              <em
                className="search-icon-t-btn"
                onClick={() => {
                  const inputValue = inputRef.current.state.value || ''
                  searchDataList(inputValue)
                }}
              ></em>
            }
            suffix={
              keyWords && (
                <em
                  className="search_clear"
                  onClick={() => {
                    setkeyWords('')
                    setLastChooseType(true)
                  }}
                ></em>
              )
            }
            onPressEnter={(e: any) => {
              e.persist()
              searchDataList(e.target.defaultValue)
            }}
            onChange={(e: any) => {
              e.persist()
              if (e.target.value == '') {
                setkeyWords('')
                setLastChooseType(true)
              } else {
                setkeyWords(e.target.value)
              }
            }}
          />
        </div>
        <div
          className="typeClassify"
          onClick={() => {
            chooseClassify(0)
          }}
        >
          <img src={$tools.asAssetsPath('/images/adressBook/recentContacts.png')} alt="" />
          <span className={`${chooseType == 0 && lastChooseType ? 'chooseColor' : ''}`}>最近联系人</span>
        </div>
        <div
          className="typeClassify"
          onClick={() => {
            chooseClassify(1)
          }}
        >
          <img src={$tools.asAssetsPath('/images/adressBook/topContacts.png')} alt="" />
          <span className={`${chooseType == 1 && lastChooseType ? 'chooseColor' : ''}`}>常用联系人</span>
        </div>
        <div
          className="typeClassify"
          onClick={() => {
            getGroupList()
          }}
        >
          <img src={$tools.asAssetsPath('/images/adressBook/group.png')} alt="" />
          <span className={`${chooseType == 2 && lastChooseType ? 'chooseColor' : ''}`}>群组</span>
        </div>
        {/* 企业列表 */}
        <div className="enterpriseScroll">
          {enterpriseData.map((item, index) => {
            return (
              <div key={index} className="enterpriseBox">
                <div
                  className="enterprise"
                  onClick={() => {
                    if (chooseKey == index) {
                      setChooseKey(-1)
                    } else {
                      getEnterpriseUser(index, item.id)
                    }
                  }}
                >
                  <div className="enterpriseTitle">
                    <img
                      src={item.logo ? item.logo : $tools.asAssetsPath('/images/adressBook/topContacts.png')}
                      alt=""
                    />
                    <span>{item.name}</span>
                  </div>
                  <CaretUpOutlined className={`${chooseKey === index ? 'transBottom' : 'transTop'}`} />
                </div>
                {chooseKey === index && (
                  <div className="enterpriseList">
                    <div
                      onClick={() => {
                        chooseClassify(item.id + 3)
                        getTreeData(item, 0)
                      }}
                    >
                      <img src={$tools.asAssetsPath('/images/common/org_type_leaf.png')} alt="" />
                      <span className={`${lastChooseType && chooseType == item.id + 3 ? 'chooseColor' : ''}`}>
                        按组织架构查找
                      </span>
                    </div>
                    {item.departName && (
                      <div
                        onClick={() => {
                          chooseClassify(item.id + 4)
                          getTreeData(item, 2)
                        }}
                      >
                        <img src={$tools.asAssetsPath('/images/common/org_type_leaf.png')} alt="" />
                        <span className={`${lastChooseType && chooseType == item.id + 4 ? 'chooseColor' : ''}`}>
                          {item.departName}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {/* 右侧显示内容 */}
      <div className="listData">
        {chooseType < 3 && chooseType != -1 && typeData && lastChooseType && (
          <div className="justTypeList">
            <div className="listTitle">
              <div>
                <div></div>
                <span>
                  {chooseType == 0
                    ? '最近联系人'
                    : chooseType == 1
                    ? '常用联系人'
                    : chooseType == 2
                    ? '群组'
                    : ''}
                </span>
              </div>
              {chooseType == 1 && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    openSelectMemberOrg()
                  }}
                >
                  编辑
                </Button>
              )}
            </div>
            <div className="contentBox">
              {typeData.map((item, index) => {
                return (
                  <div key={index} className="nameBox">
                    {chooseType != 2 ? (
                      <NameCom
                        listData={item}
                        ind={index}
                        isDelete={chooseType == 1 ? true : false}
                        deleteComUse={(id: any) => {
                          deleteNameData(id)
                        }}
                        clickComUse={(val: any) => {
                          getCardData(val)
                        }}
                      ></NameCom>
                    ) : (
                      <GroupCom
                        listData={item}
                        ind={index}
                        toMessageIndex={(val: any) => {
                          handleSendPrevateTalk(val, 'group')
                        }}
                      ></GroupCom>
                    )}
                  </div>
                )
              })}
            </div>

            {chooseType == 2 && pagination.total > 0 && (
              <div className="pageBox">
                <Pagination
                  showQuickJumper
                  current={pagination.pageNo + 1}
                  defaultCurrent={pagination.pageNo + 1}
                  defaultPageSize={pagination.pageSize}
                  pageSizeOptions={['5', '10', '20', '30', '50', '100']}
                  showSizeChanger={true}
                  total={pagination.total}
                  onChange={(page, pageSize) => {
                    if (pagination.pageSize != pageSize) {
                      pagination.pageNo = 0
                    } else {
                      pagination.pageNo = page - 1
                    }
                    pagination.pageSize = pageSize || 10
                    setPagination({ ...pagination })
                    getGroupList()
                  }}
                />
              </div>
            )}
          </div>
        )}
        {/* 树形图展示企业 */}
        {chooseType > 2 && !enterpriseInfo.isRoleSelection && treeDataList.treeData && lastChooseType && (
          <div className="treeBox">
            <div className="treeTitle">
              <div></div>
              <span>{enterpriseInfo.name}</span>
            </div>
            {treeDataList.treeData.length > 0 && (
              <div className="treeList">
                <Tree
                  multiple
                  loadData={onRoleOrgLoadEntData}
                  // selectable={false}
                  treeData={treeDataList.treeData}
                  onSelect={(expKeys: any, e: any) => {
                    onExpandCmy(expKeys, e)
                  }}
                  onExpand={(expKeys: any, e: any) => {
                    onExpandCmy(expKeys, e)
                  }}
                  expandedKeys={expandedKeys}
                  selectedKeys={expandedKeys}
                />
              </div>
            )}
          </div>
        )}
        {chooseType > 2 && enterpriseInfo.isRoleSelection && treeDataList.treeData && (
          <div className="treeBox">
            <div className="treeTitle">
              <div></div>
              <span>{enterpriseInfo.name}</span>
            </div>
            <div className="treeList">
              <Tree selectable={false} loadData={onRoleOrgLoadData} treeData={treeDataList.treeData} />
            </div>
          </div>
        )}
        {/* 搜索数据展示 */}
        {keyWords &&
          (searchData.searchContacts.length > 0 || searchData.searchGroup.length > 0) &&
          !lastChooseType && (
            <div className="searchBox">
              <div className="searchContent">
                <SearchOutlined />
                <span>查询&quot;{oldKeyWords}&quot;的结果</span>
              </div>
              <div className="searchScroll">
                <div>
                  <div className="searchTitle">
                    <div></div>
                    <span>联系人</span>
                  </div>
                  {searchData.searchContacts.length > 0 ? (
                    <div onMouseOut={() => {}}>
                      {searchData.searchContacts.map((item, index) => {
                        if (openConMore || (!openConMore && index < 3)) {
                          return (
                            <div key={index} className="nameBox">
                              <NameCom
                                listData={item}
                                ind={index}
                                keyWords={keyWords}
                                clickComUse={(val: any) => {
                                  getCardData(val)
                                }}
                              ></NameCom>
                            </div>
                          )
                        }
                      })}
                    </div>
                  ) : (
                    <div className="searchNoData">暂时没有数据</div>
                  )}
                  {searchData.searchContacts.length > 3 && (
                    <div
                      className="chooseMore"
                      onClick={() => {
                        changeMore(0)
                      }}
                    >
                      {openConMore ? '收起' : '查看更多相关成员'}
                    </div>
                  )}
                </div>

                <div>
                  <div className="searchTitle">
                    <div></div>
                    <span>群组</span>
                  </div>
                  {searchData.searchGroup.length > 0 ? (
                    <div onMouseOut={() => {}}>
                      {searchData.searchGroup.map((item, index) => {
                        if (openGroupMore || (!openGroupMore && index < 3)) {
                          return (
                            <div key={index} className="nameBox">
                              <GroupCom
                                listData={item}
                                ind={index}
                                keyWords={keyWords}
                                toMessageIndex={(val: any) => {
                                  handleSendPrevateTalk(val, 'group')
                                }}
                              ></GroupCom>
                            </div>
                          )
                        }
                      })}
                    </div>
                  ) : (
                    <div className="searchNoData">暂时没有数据</div>
                  )}
                  {searchData.searchGroup.length > 3 && (
                    <div
                      className="chooseMore"
                      onClick={() => {
                        changeMore(1)
                      }}
                    >
                      {openGroupMore ? '收起' : '查看更多相关群组'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        {
          <div className="noDataBox">
            {!searchData.searchContacts.length &&
              !searchData.searchGroup.length &&
              keyWords &&
              !lastChooseType && (
                <>
                  <img
                    className="noSearchData"
                    src={$tools.asAssetsPath('/images/adressBook/noSearchData.png')}
                    alt=""
                  />
                  <span>没有找到关于&quot;{oldKeyWords}&quot;的结果</span>
                </>
              )}
            {((chooseType != -1 && chooseType < 3 && !typeData.length) ||
              (chooseType > 2 && !treeDataList?.treeData.length)) &&
              lastChooseType && (
                <>
                  <img className="noData" src={$tools.asAssetsPath('/images/adressBook/noData.png')} alt="" />
                  <span>暂时没有数据~</span>
                </>
              )}
          </div>
        }
      </div>
      {/* 添加常用联系人 */}
      {
        <SelectMemberOrg
          param={{
            ...selMemberOrg,
            disableList: [
              {
                userId: nowUserId,
                username: nowUser,
                forceReportUser: true,
                curId: nowUserId,
              },
            ],
          }}
          action={{
            setModalShow: (flag: boolean) => {
              setSelMemberOrg({ ...selMemberOrg, visible: flag })
            },
            onSure: selMemberSure,
          }}
        />
      }
      <CardCom
        cardData={cardData}
        cardVisible={cardVisible}
        closeCard={() => {
          setCardVisible(false)
          if (chooseType == 2) {
            querList()
          }
        }}
        toMessageIndex={(val: any) => {
          val.id = val.userId
          handleSendPrevateTalk(val, 'personal')
        }}
        querList={querList}
      ></CardCom>
    </div>
  )
}

export default AddressBook
// 个人的列表项
export const NameCom = (props: any) => {
  const handleSerchText = (str: string) => {
    const substr = `/${props.keyWords}/g`
    const replaceStr = str.replace(eval(substr), '<em>' + props.keyWords + '</em>')
    return replaceStr
  }
  const listData = props.listData
  const { remark, profile, username, online, permission } = listData
  const name = username ? username.split('-')[0].substr(-2, 2) : ''
  return (
    <div
      className="nameCom"
      onClick={() => {
        props.clickComUse(listData)
      }}
    >
      <div className="nameInfo">
        <div className="headImg">
          <Avatar
            className="oa-avatar flex center"
            src={profile ? $tools.htmlDecodeByRegExp(profile) : undefined}
          >
            {name}
          </Avatar>
          {online != undefined && (
            <div className="spot" style={{ backgroundColor: online ? '#34a853' : '#9A9AA2' }}></div>
          )}
        </div>
        <div className="nameCon nameConBox">
          <div className="userNameB">
            {username && (
              <div className="showName" dangerouslySetInnerHTML={{ __html: handleSerchText(username) }}></div>
            )}
            {remark && <span className="userRemark">（{remark}）</span>}
          </div>
          {permission == 0 && <div className="outNamecon">非通讯录成员</div>}
        </div>
      </div>
      {props.isDelete && (
        <div
          className="deleteBtn"
          onClick={(e: any) => {
            e.stopPropagation()
            props.deleteComUse(listData.id)
          }}
        ></div>
      )}
    </div>
  )
}
// 群的列表项
export const GroupCom = (props: any) => {
  const listData = props.listData
  const { type, profile, roomName } = listData || {}
  const handleSerchText = (str: string) => {
    const substr = `/${props.keyWords}/g`
    const replaceStr = str.replace(eval(substr), '<em>' + props.keyWords + '</em>')
    return replaceStr
  }
  return (
    <div
      className="nameCom"
      onClick={() => {
        props.toMessageIndex && props.toMessageIndex(listData)
      }}
    >
      <div className="nameInfo">
        <div className="headImg">
          <Avatar
            className="oa-avatar flex center"
            src={profile ? $tools.htmlDecodeByRegExp(profile) : getAvatarEnums(type, roomName)}
            icon={type !== 3 && getListAvatar()}
          >
            {type === 'personal' && roomName?.substr(-2, 2)}
          </Avatar>
        </div>
        <div className="nameCon">
          <div className="showName" dangerouslySetInnerHTML={{ __html: handleSerchText(roomName || '') }}></div>
          {/* 成都掌控者科技有限公司 */}
          {type == 6 && <div className="nameLabel allLabel">全员</div>}
          {type == 4 && <div className="nameLabel deptLabel">部门</div>}
        </div>
      </div>
    </div>
  )
}
// 名片、
export const CardCom = (props: any) => {
  const {
    phone,
    email,
    username,
    profile,
    memberCardTeamModels,
    remark,
    sex,
    userId,
    isLinkman,
    hidePhoneNum,
  } = props.cardData
  const { querList, closeCard } = props
  const { nowUserId } = $store.getState()
  // 设置备注
  const [changeRemark, setChangeRemark] = useState('')
  // 设置联系人类型 //1取消成为联系人 0 添加成联系人
  const [changeType, setChangeType] = useState(-1)
  // 搜索框
  const [isChangeInp, setisChangeInp] = useState(false)
  let hidePhone = ''
  if (phone) {
    hidePhone = phone.substr(0, 3) + '****' + phone.substr(7, 4)
  }
  const name = username ? username.substring(username.length - 2) : ''
  // 修改联系人备注
  const changeInfo = () => {
    editLinkMan({
      userId: nowUserId,
      linkmanId: userId,
      remark: changeRemark,
      type: changeType,
    }).then(() => {
      setisChangeInp(false)
    })
  }
  // 添加/删除联系人
  const changeCom = (type: number) => {
    addSingleCustomLinkman({
      userId: nowUserId,
      linkmanId: userId,
      type: type,
    }).then(() => {
      if (type == 1) {
        setChangeType(0)
        querList()
        closeCard()
        message.success('取消常用联系人成功')
      } else {
        setChangeType(1)
        message.success('添加常用联系人成功')
      }
    })
  }

  useEffect(() => {
    setisChangeInp(false)
    if (props.cardVisible) {
      setChangeType(isLinkman)
      setChangeRemark(remark)
    }
  }, [props.cardVisible])

  return (
    <>
      <div
        className="mask"
        style={{ display: props.cardVisible ? '' : 'none' }}
        onClick={() => {
          props.closeCard && props.closeCard()
        }}
      ></div>
      <div className="cardBox" style={{ display: props.cardVisible ? '' : 'none' }}>
        <div className="headImg">
          <Avatar
            shape="square"
            className="headImgStyle"
            src={profile ? $tools.htmlDecodeByRegExp(profile) : undefined}
          >
            <span className="defaultHead">{name}</span>
          </Avatar>
          <div className="bottomBgColor"></div>
          <div className="cardName">
            <div>
              <span>{username}</span>
              {sex ? (
                <img src={$tools.asAssetsPath('/images/adressBook/sex_1.png')} alt="" />
              ) : (
                <img src={$tools.asAssetsPath('/images/adressBook/sex.png')} alt="" />
              )}
            </div>
          </div>
        </div>
        <div className="remark">
          <div>
            <span>备注</span>
            {isChangeInp && (
              <>
                <input
                  type="text"
                  placeholder="修改备注"
                  value={changeRemark || ''}
                  maxLength={15}
                  onFocus={() => {}}
                  onBlur={() => {}}
                  onChange={e => {
                    e.persist()
                    setChangeRemark(e.target.value)
                  }}
                />
                <span
                  className="sureRemark"
                  onClick={() => {
                    changeInfo()
                  }}
                ></span>
                <span
                  className="cancelRemark"
                  onClick={() => {
                    setChangeRemark(remark)
                    setisChangeInp(false)
                  }}
                ></span>
              </>
            )}
            {!isChangeInp && <div>{changeRemark || '修改备注'}</div>}
            {!isChangeInp && (
              <div
                className="changeInp"
                onClick={() => {
                  setisChangeInp(true)
                }}
              ></div>
            )}
          </div>
          {!isChangeInp && changeType == 0 && (
            <Tooltip title="添加为常用联系人" color="#3A455E">
              <span
                className="addContacts"
                onClick={() => {
                  changeCom(0)
                }}
              ></span>
            </Tooltip>
          )}
          {!isChangeInp && changeType == 1 && (
            <Tooltip title="取消为常用联系人" color="#3A455E">
              <span
                className="cancelContacts"
                onClick={() => {
                  changeCom(1)
                }}
              ></span>
            </Tooltip>
          )}
        </div>
        <div className="infoList">
          <span>电话</span>
          {hidePhoneNum == 0 ? <div>{phone}</div> : <div>{hidePhone}</div>}
        </div>
        <div className="infoList">
          <span>邮箱</span>
          <div>{email}</div>
        </div>
        <div className="companyBox">
          {memberCardTeamModels &&
            memberCardTeamModels.map((item: any, index: number) => {
              return (
                <div key={index}>
                  <div className="companyName">
                    <div>
                      <div></div>
                      <span>{item.name}</span>
                    </div>
                  </div>
                  <div className="companList">
                    <span>部门</span>
                    <div>{item.deptModel.departName}</div>
                  </div>
                  <div className="companList">
                    <span>岗位</span>
                    <div>{item.deptModel.postName}</div>
                  </div>
                </div>
              )
            })}
        </div>
        <div
          className="getMessage"
          onClick={() => {
            props.toMessageIndex && props.toMessageIndex(props.cardData)
          }}
        >
          <img src={$tools.asAssetsPath('/images/adressBook/message.png')} alt="" />
          <span>发起沟通</span>
        </div>
      </div>
    </>
  )
}

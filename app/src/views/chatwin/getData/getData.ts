import axios from 'axios'
import { message } from 'antd'
import { ipcRenderer } from 'electron'
import { deleteChatRoom } from './ChatInputCache'
import { getLocalRoomData } from '../../myWorkDesk/chat/ChatList'
const FILEHOST = process.env.API_FILE_HOST

//查询沟通聊天室
export const queryListData = () => {
  const { loginToken, nowUserId } = $store.getState()
  return new Promise(resolve => {
    const params = {
      userId: nowUserId,
    }
    $api
      .request('/im-biz/chatRoom/queryList', params, {
        headers: { loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode === 0) {
          const resData = res.data
          resolve(resData ? resData : [])
        } else {
          resolve(0)
        }
      })
      .catch(() => {
        console.log('查询出错了')
        resolve(0)
      })
  })
}

// 查询消息历史记录
export const getHistoryMsg = (values: {
  roomId: number
  keywords: string
  num: number
  serverTime: number | null
  laterMsgSize?: number
  roomName?: string
}) => {
  const { loginToken, nowUserId } = $store.getState()
  const params = {
    roomId: values.roomId,
    userId: nowUserId,
    laterMsgSize: values.laterMsgSize ? values.laterMsgSize : 0,
    // pointTime: values.pointTime,
    pointTime: values.serverTime,
    earlierMsgSize: values.num,
    keywords: values.keywords,
  }
  return new Promise(resolve => {
    $api
      .request('/im-biz/chatRoom/message/list', params, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          const { content } = resData.data || {}
          if (content && content.length) {
            resolve(content)
          } else {
            resolve([])
          }
        } else if (resData.returnCode === 12026) {
          //将对应的数据移除
          const { openRoomIds, chatListData } = $store.getState()
          const newOpenRoomids = openRoomIds.filter((roomId: any) => roomId !== values.roomId)
          $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newOpenRoomids })
          //移除对应的聊天室
          const newChatListData = chatListData.filter((item: any) => item.roomId !== values.roomId)
          $store.dispatch({
            type: 'SET_CHAT_LIST',
            data: { chatListData: newChatListData || [] },
          })
          $store.dispatch({ type: 'SET_SELECT_ITEM', data: {} })
          //从本地删除对应聊天室
          deleteChatRoom(values.roomId)
          ipcRenderer.send('room_error_tips', `你已不在【${values.roomName}】中`)
        }
      })
      .catch(res => {
        // if (res.resData?.message === 'Network Error') {
        //   message.error('网络不可用，请检查您的网络设置')
        // }
        resolve([])
      })
  })
}

// 查询消息助手历史消息
export const queryRobotMessage = (params: {
  pageNo: number
  size: number
  userId: number
  mucRelationId: number
}) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/im-consumer/mucAssistant/findMucAssistantNoticePage', params, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.data) {
          const data = resData.data.content
          resolve(data.reverse())
        } else {
          resolve([])
        }
        // if (type === 'msgPostion') {
        //   if (data.length) {
        //     resolve(data.reverse())
        //   }
        // } else {
        //   resolve(data.reverse())
        // }
      })
      .catch(res => {
        if (res.resData?.message === 'Network Error') {
          message.error('网络不可用，请检查您的网络设置')
        }
        reject(res)
      })
  })
}

// 查询消息助手历史消息
export const queryRobotSettingMessage = (params: { userId: number; mucRelationId: number }) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/im-consumer/mucAssistant/findMucAssistantConfig', params, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.dataList) {
          const data = resData.dataList
          resolve(data)
        } else {
          resolve([])
        }
        // if (type === 'msgPostion') {
        //   if (data.length) {
        //     resolve(data.reverse())
        //   }
        // } else {
        //   resolve(data.reverse())
        // }
      })
      .catch(res => {
        if (res.resData?.message === 'Network Error') {
          message.error('网络不可用，请检查您的网络设置')
        }
        reject(res)
      })
  })
}
// 查询聊天室成员列表
export const getChatUsers = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/im-biz/chatRoom/member/list', params, {
        headers: { loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询聊天室成员组织架构
export const getUserTreeList = ({ ascriptionId, belongType, mucId, orgId, keywords, directDeptId }: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      mucId,
      orgId,
      keywords,
      ascriptionId: ascriptionId,
      ascriptionType: belongType,
      level: 1,
      account: '',
      view: '2#3#0#',
      directDeptId,
    }
    $api
      .request('/team/enterpriseRoleInfo/findEnterpriseTreeByMucGroup', param, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}

// 查询回复消息列表
export const getReplyList = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/im-biz/chatRoom/message/getReplyMessageList', params, {
        headers: { loginToken },
        formData: true,
      })
      .then((res: any) => {
        const data = res.data
        resolve(data)
      })
      .catch(() => {
        resolve(null)
      })
  })
}

// 查询聊天室公告
export const getChatNoticeList = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/im-consumer/mucRelation/findMucNoticeList', params, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.dataList)
      })
  })
}

// 设置管理员
export const setAdminUser = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>(resolve => {
    $api
      .request('/im-biz/chatRoom/addAdministrator', params, {
        headers: { loginToken },
        formData: true,
      })
      .then(() => {
        resolve()
      })
      .catch(res => {
        message.error(res.returnMessage || '设置失败')
      })
  })
}

// 发起私聊
export const sendPrevateTalk = (params: any) => {
  const { loginToken, nowAccount, nowUser, nowUserId } = $store.getState()
  const value = {
    createUserAccount: nowAccount,
    createUser: nowUser,
    createUserId: nowUserId,
    password: '123456',
    talkType: 0,
    type: 'personal',
    belongType: 'user',
  }
  return new Promise(resolve => {
    $api
      .request(
        '/im-consumer/mucRelation/startTalk',
        { ...params, ...value },
        {
          headers: { loginToken, 'Content-Type': 'application/json' },
        }
      )
      .then((res: any) => {
        resolve(res.obj.id)
      })
      .catch(err => {
        message.error(err.returnMessage || '发起失败')
      })
  })
}

//更新左侧列表最新消息
export const updateMsg = (muc: string, body?: string, sender?: string) => {
  return new Promise(resolve => {
    const { nowAccount, nowUser, nowUserId, loginToken } = $store.getState()
    const params = {
      userId: nowUserId,
      userAccount: nowAccount,
      username: nowUser,
      muc,
      sender,
      body,
    }
    $api
      .request('/im-consumer/mucRelation/log', params, {
        headers: { loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(() => {
        console.log('网络错误')
      })
  })
}
//获取在线人数
export const getOnlineUser = (id: any) => {
  return new Promise(resolve => {
    const { loginToken } = $store.getState()
    const param = {
      relationId: id,
    }
    $api
      .request('/im-consumer/mucRelation/onlineInfo', param, {
        headers: { loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}

// 查询用户信息
export const queryChatUserInfo = (roomId: number) => {
  return new Promise(resolve => {
    const { loginToken, nowUserId } = $store.getState()
    const param = {
      userId: nowUserId,
      roomId,
    }
    $api
      .request('/im-consumer/project/queryChatUserInfo', param, {
        headers: { loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res.data)
      })
  })
}

// 打开关闭聊天室
export const openWindow = (mucId: number, callback?: () => void) => {
  const { nowAccount, loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(
        '/im-consumer/mucRelation/windowState',
        { id: mucId, state: 0, userAccount: nowAccount },
        {
          headers: { loginToken },
          formData: true,
        }
      )
      .then(res => {
        resolve(res.data)
        callback && callback()
      })
  })
}

// 编辑和创建聊天室
export const addSubjectChat = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/im-biz/chatRoom/create', params, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        if (res.returnCode === 0) {
          resolve(res.data)
        } else {
          message.error(res.returnMessage || '聊天室创建失败')
        }
      })
      .catch(err => {
        message.error(err.returnMessage || '聊天室创建失败')
      })
  })
}

// 置顶
export const setTop = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>(resolve => {
    $api
      .request('/im-biz/chatRoom/updateTopState', param, { headers: { loginToken }, formData: true })
      .then(() => {
        message.success('设置成功')
        resolve()
      })
      .catch(err => {
        message.error(err.returnMessage || '设置失败')
      })
  })
}

// 免打扰
export const setTrouble = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>(resolve => {
    $api
      .request('/im-biz/chatRoom/updateRemindType', param, { headers: { loginToken }, formData: true })
      .then(() => {
        message.success('设置成功')
        resolve()
      })
      .catch(err => {
        message.error(err.returnMessage || '设置失败')
      })
  })
}

// 记录最后一次离开群的时间

export const recordLeaveTime = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>(resolve => {
    $api
      .request('/im-biz/chatRoom/recordLeaveTime', params, {
        headers: { loginToken },
        formData: true,
      })
      .then(() => {
        resolve()
      })
      .catch(() => {
        // message.error(err.returnMessage)
      })
  })
}

// 更新列表state状态
export const updateWindowState = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>(resolve => {
    $api
      .request('/im-biz/chatRoom/updateWindowState', params, {
        headers: { loginToken },
        formData: true,
      })
      .then(() => {
        resolve()
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  })
}

/***
 * 上传截图文件
 * @param baseStr
 * @param fileKey
 * @param fileSize
 */
export const uploadShotScreen = (fileKey: string, fileSize: string, baseStr: string) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request(
        '/tools/oss/upload/paste',
        {
          file: baseStr,
          fileName: fileKey,
          fileSize: fileSize,
          dir: 'talk',
        },
        { headers: { loginToken, 'Content-Type': 'application/json' } }
      )
      .then((res: any) => {
        resolve(res.data.data)
      })
      .catch(() => {
        reject()
      })
  })
}

//根据聊天室类型获取对应的belongType
export const belongTypeEnum = (num: number) => {
  let type = ''
  switch (num) {
    case -1:
      type = 'pub' //公共
      break
    case 0:
      type = 'user' //个人
      break
    case 1:
      type = 'team' //团队
      break
    case 2:
      type = 'org' //机构
      break
    case 3:
      type = 'dep' //部门
      break
    case 31:
      type = 'post' //岗位
      break
    case 5:
      type = 'role' //角色
      break
    case 6:
      type = 'theme' //主题聊天
      break
    case 30:
      type = 'dep_and_child' //部门>包含下级
      break
    case 20:
      type = 'org_and_child' //机构>包含下级
      break
  }
  return type
}

export const addFileInfoToRoom = (fileDetailModels: any) => {
  const { loginToken, nowUserId, nowUser, selectItem } = $store.getState()
  const { roomId: id, type, roomName: subject, ascriptionId, ascriptionName } = selectItem
  console.log('selectItem', selectItem)
  let belongId = ascriptionId
  let belongName = ascriptionName
  if (type === 5) {
    belongId = id
    belongName = subject
  } else if (type === 3) {
    belongId = nowUserId
    belongName = nowUser
  }
  const value = {
    belongId,
    belongName,
    belongType: belongTypeEnum(type),
    fromTypeId: id,
    fromTypeName: subject,
    uploadUserId: nowUserId,
    uploadUserName: nowUser,
    fromType: 'talk',
    fileDetailModels: [fileDetailModels],
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/public/file/addFileInfo', value, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.dataList)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//合并文件
export const mergeFile = async (params: any) => {
  const { nowAccount, nowUserId } = $store.getState()
  const { guid, fileName, fileId, ascriptionId } = params
  const formDatas: any = new FormData()
  formDatas.append('guid', guid)
  formDatas.append('fileName', fileName)
  formDatas.append('fileId', fileId)
  formDatas.append('userId', nowUserId)
  formDatas.append('otherFile', !!ascriptionId ? 0 : 1)
  formDatas.append('companyId', !!ascriptionId ? ascriptionId : nowAccount)

  const _$$token = await getChatToken({
    companyId: !!ascriptionId ? ascriptionId : nowAccount,
    userId: nowUserId,
    otherFile: !!ascriptionId ? 0 : 1,
  })
  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: `${FILEHOST}/api/WebEditor/MergeFile`,
      headers: {
        Token: _$$token,
      },
      data: formDatas,
      timeout: 60000,
    })
      .then((res: any) => {
        //合并文件
        if (res.data.code === 1) {
          resolve(res.data)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}

//获取上传附件需要的token
export const getChatToken = (params: any) => {
  let nowToken = ''
  $.ajax({
    type: 'POST',
    url: `${FILEHOST}/Authentication/GetToken`,
    timeout: 3000,
    crossDomain: true,
    async: false,
    data: params,
    success: (result: any) => {
      if (result.code == 1 && result.data !== null) {
        nowToken = result.data.token
      } else {
        console.log(result.msg)
      }
    },
    error: err => {
      console.log('获取附件Token失败', err)
    },
  })
  return nowToken
}

//回复消息与原消息绑定
export const replyMsgBinding = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>(resolve => {
    $api
      .request('/im-biz/chatRoom/message/replyMsgBinding', params, {
        headers: { loginToken },
        formData: true,
      })
      .then(() => {
        resolve()
      })
      .catch(() => {
        if (window.navigator.onLine == false) {
          message.error('当前网络异常，绑定消息失败')
        } else {
          message.error('消息绑定失败')
        }
      })
  })
}

export const getChartData = (keywords: string, startNo: number, maxSize: number, talkType: number) => {
  const { nowUserId, loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      talkType: talkType,
      keywords: keywords,
      maxSize: maxSize,
      startNo: startNo,
      userId: nowUserId,
    }
    $api
      .request('/im-consumer/muc/searchRoom', param, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(() => {
        message.error('加载数据失败...')
      })
  })
}

// 新搜索接口
export const queryAddressList = (keywords: string) => {
  const { nowUserId, loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      keywords: keywords,
      userId: nowUserId,
    }
    $api
      .request(
        '/im-biz/chatRoom/search',
        { ...param },
        {
          headers: { loginToken, 'Content-Type': 'application/json' },
        }
      )
      .then(resData => {
        resolve(resData.data)
      })
      .catch(() => {
        if (window.navigator.onLine == false) {
          message.error('当前网络异常，加载数据失败...')
        } else {
          message.error('加载数据失败...')
        }
      })
  })
}

export const updateNoticeStatus = (value: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(
        '/im-consumer/mucAssistant/updateMucAssistantConfig',
        { ...value, addressListRequest: 0 },
        {
          headers: { loginToken, 'Content-Type': 'application/json' },
        }
      )
      .then(resData => {
        resolve(resData.data)
      })
      .catch(() => {
        message.error('加载数据失败...')
      })
  })
}

//汇报机器人 工作报告统计数据查询
export const messageAssistantQuery = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/team/reportStatistics/messageAssistantQuery', params, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then((data: any) => {
        resolve(data)
      })
      .catch(err => {
        message.error(err.returnMessage || '操作失败')
      })
  })
}

//更改群名称和群头像
export const updateGroupName = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/im-biz/chatRoom/updateRoomInfo', params, {
        headers: { loginToken },
        formData: true,
      })
      .then((resData: any) => {
        resolve(resData)
      })
  })
}

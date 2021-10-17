/**
 * @module 沟通公用方法集合
 */
import { message } from 'antd'
import { _to } from '../../getData/ChatHandle'
import { batchInsertChatMsg, batchUpdateChatMsg } from '../../getData/ChatInputCache'
export const compare = (prevProps: any, nextProps: any) => {
  const prevItem = prevProps.showContent
  const nextItem = nextProps.showContent
  if (
    prevItem.time !== nextItem.time ||
    prevItem.commnetCount !== nextItem.commnetCount ||
    prevItem.subType !== nextItem.subType ||
    prevItem.sendStatus !== nextItem.sendStatus ||
    prevItem.process !== nextItem.process ||
    prevItem.fileUrl !== nextItem.fileUrl ||
    prevItem.handleModel !== nextItem.handleModel
  ) {
    return false
  } else if (prevItem.unreadUserList?.length !== nextItem.unreadUserList?.length) {
    return false
  } else if (prevItem.handleModel?.handleCount !== nextItem.handleModel?.handleCount) {
    return false
  } else {
    const prevEmoji = prevItem.messageEmojiAppraiseModel
    const nextEmoji = nextItem.messageEmojiAppraiseModel
    const prevThumbMember = prevEmoji
      ? prevEmoji instanceof Array
        ? prevEmoji
        : JSON.parse($tools.htmlDecodeByRegExp(prevEmoji))
      : []
    const nextThumbMember = nextEmoji
      ? prevEmoji instanceof Array
        ? prevEmoji
        : JSON.parse($tools.htmlDecodeByRegExp(nextEmoji))
      : []
    if (prevThumbMember.length !== nextThumbMember.length) {
      return false
    } else {
      return true
    }
  }
}

//文件后缀名
export const suffix = (suffixName: string) => {
  return suffixName
    ?.toLowerCase()
    .split('.')
    .splice(-1)[0]
}

//查询已读未读列表
export const readMessageList = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>((resolve, reject) => {
    $api
      .request('/im-consumer/messageInfo/readMessageList', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
  })
}

//查询成员列表
export const queryPersons = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>((resolve, reject) => {
    $api
      .request('/im-consumer/findKnowPersons', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
  })
}

//撤回消息
export const recallMsg = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>((resolve, reject) => {
    $api
      .request('/im-biz/chatRoom/message/recall', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        console.log('nnnnnnnnnnn', res)
        if (res.returnCode === 0) {
          resolve(res)
        } else if (res.returnCode === 12038) {
          message.info('无权撤回群他人消息')
        }
      })
  })
}

//保存点赞表情
export const saveEmojiAppraise = (suffix: string, param: any) => {
  const { loginToken } = $store.getState()
  $api.request(`/im-consumer/chatMessageEmojiAppraise/${suffix}`, param, {
    headers: { loginToken, 'Content-Type': 'application/json' },
  })
}

//查询审批详情
export const approvalInfo = (id: number) => {
  return new Promise<any>((resolve, reject) => {
    const { nowUserId, loginToken } = $store.getState()
    const $ajaxUrl = '/approval/approval/findApprovalById'
    const $ajaxParam = {
      id: id,
      userId: nowUserId,
      noticeId: 0,
      isCopy: 0,
    }
    $api
      .request($ajaxUrl, $ajaxParam, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        $store.dispatch({
          type: 'IS_APPROVAL_SEND',
          data: false,
        })
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

export const checkIn = (arr: any) => {
  const { nowUserId } = $store.getState()
  let type = false
  const _arr = arr && typeof arr == 'string' ? JSON.parse(arr) : arr
  for (const i in _arr) {
    if (Number(_arr[i]) === Number(nowUserId)) {
      type = true
      break
    }
  }
  return type
}

// 发送消息到移动端
export const sendToMobile = (newMsg: any, currenRoom: any, userLists: any) => {
  const { id, subject, talkType } = currenRoom
  let nowMobileData = ''
  let atPersonUserIds: number[] = []
  const { subType, time } = newMsg
  if (subType === 2) {
    const fileExt = newMsg.fileName
      .toLowerCase()
      .split('.')
      .splice(-1)[0]
    if ($tools.imgFormatArr.includes(fileExt)) {
      // 图片消息
      nowMobileData = '【图片】'
    } else {
      // 文件消息
      nowMobileData = '【文件】'
    }
  } else if (subType === 6) {
    // @消息
    atPersonUserIds = newMsg.spareContent ? newMsg.spareContent.split(',') : []
    nowMobileData = newMsg.message
  } else if (subType === 8) {
    nowMobileData = '【引用消息】'
  } else if (subType === 5) {
    nowMobileData = '撤回了一条消息'
  } else {
    // 发送消息到移动端
    nowMobileData = newMsg.message
  }
  const { nowUserId, nowUser, nowAccount, loginToken } = $store.getState()
  const params = {
    userId: nowUserId,
    content: nowMobileData, //发送内容
    mucContent: {
      id, //消息的房间id
      talkType, //房间类型
      room: subject, //房间名字
      name: nowUser,
      fromAccount: nowAccount,
      bodyTimestamp: time,
      atPersonUserIds,
    },
    userAccounts: _to(userLists), //房间成员
  }
  $api.request('/mobile/mucRelation/chatPushMsg', params, {
    headers: { loginToken, 'Content-Type': 'application/json' },
  })
}

export const checkedHasData = (arr: any, msgUuid: string) => {
  let flag = false
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].msgUuid === msgUuid) {
      flag = true
      break
    }
  }
  return flag
}

export const msgCompare = (
  localDataMsg: Array<globalInterface.ChatItemProps>,
  resData: Array<globalInterface.ChatItemProps>,
  roomId: number
) => {
  // 本地不同
  const localChangeData = localDataMsg.filter(item => {
    return !checkedHasData(resData, item.msgUuid)
  })
  // 接口返回的不同
  const resChangeData = resData.filter(item => {
    return !checkedHasData(localDataMsg, item.msgUuid)
  })
  if (localChangeData.length) {
    batchInsertChatMsg({ roomId, data: resChangeData })
  }
  if (resChangeData.length) {
    batchUpdateChatMsg({ data: resChangeData })
  }
}

//组装@需要的数据
export const filterAtData = (chatUserLists: any) => {
  const { nowUserId } = $store.getState()
  const selectList: Array<{
    value: string
    key: string
    account: string
    id: number
    headPhoto: string
  }> = []
  const value = {
    userName: '所有人',
    userAccount: '',
    headPhoto: '',
    id: 0,
  }
  const resultData = [value, ...chatUserLists]
  if (resultData.length === 2) {
    return []
  } else {
    resultData.map((item: any) => {
      if (item.userId !== nowUserId) {
        selectList.push({
          value: item.userName,
          key: item.userName,
          account: item.userAccount,
          id: item.userId,
          headPhoto: item.headPhoto ? item.headPhoto : '',
        })
      }
    })
    return selectList
  }
}

//获取base64图片的大小
export const showSize = (base64url: string) => {
  let str = base64url.replace('data:image/png;base64,', '')
  const equalIndex = str.indexOf('=')
  if (str.indexOf('=') > -1) {
    str = str.substring(0, equalIndex)
  }
  const strLength = str.length
  const fileLength = strLength - (strLength / 8) * 2
  return fileLength
}

// 更新点赞表情
export const updateThumbMember = (showContent: any, str?: any) => {
  const $emojiModal = str ? str : showContent.messageEmojiAppraiseModel
  const emoji = $tools.htmlDecodeByRegExpContentHtml($emojiModal)
  if ($tools.isJsonString(emoji)) {
    const emojiAppraiseModel = JSON.parse(emoji)
    if (emojiAppraiseModel && emojiAppraiseModel.length) {
      const newArr = emojiAppraiseModel.reduce((preArr: any, currentItem: any) => {
        if (preArr.length) {
          const resultData = preArr.find((item: any) => {
            return item.emoticonName === currentItem.emoticonName
          })
          if (resultData) {
            preArr.map((item: any) => {
              if (item.emoticonName === currentItem.emoticonName) {
                item.operateUsername = `${item.operateUsername}、${currentItem.operateUsername}`
              }
              return item
            })
            return preArr
          } else {
            return [...preArr, currentItem]
          }
        } else {
          return [currentItem]
        }
      }, [])
      return newArr
    }
  }
}

//判断是否选中
export const isChecked = (dataArr: any, nowId: number) => {
  let isInArr = false
  dataArr.map((item: any) => {
    if (item.type === 'personal' && Number(item.userId) === Number(nowId)) {
      isInArr = true
      return false
    } else if (item.id === nowId) {
      isInArr = true
      return false
    }
  })
  return isInArr
}

export const customRequest = (url: string, params: object) => {
  const { loginToken } = $store.getState()
  return new Promise<void>((resolve, reject) => {
    $api
      .request(url, params, {
        headers: { loginToken },
        formData: true,
      })
      .then(() => {
        resolve()
      })
      .catch(function(res) {
        reject(res)
      })
  })
}

//校验是否是JSON格式
export const isJSON = (str: any) => {
  if (Object.prototype.toString.call(str) === '[object String]') {
    try {
      const obj = JSON.parse(str)
      if (Object.prototype.toString.call(obj) === '[object object]' && obj) {
        return true
      } else {
        return false
      }
    } catch (e) {
      return false
    }
  }
}

// 渲染头像
export const getProfile = (userId: number) => {
  const { chatUserLists } = $store.getState()
  // 从列表中筛选出当前发消息人的信息
  const currentUser: any = chatUserLists.find((item: any) => item.userId === userId)
  return currentUser?.headPhoto
}

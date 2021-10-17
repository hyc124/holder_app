import { ipcRenderer } from 'electron'
/**
 * 统一获取文件图标方法
 * type 为空时 是普通图标  '_s'小图标  '_w'白色图标
 */
export const getFileIcon = (fileName: string, type?: string) => {
  const fileSuffix = fileName
    ?.toLowerCase()
    .split('.')
    .splice(-1)[0]
  const fixType = type ? type : ''
  //统一图标前缀路径
  const fileImgPrefix = $tools.asAssetsPath('/images/fileIcon/')
  if ($tools.fileImgSupportArr.includes(fileSuffix)) {
    if (fileSuffix == 'ppt' || fileSuffix == 'pptx') {
      return fileImgPrefix + 'ppt' + fixType + '.png'
    } else if (fileSuffix == 'docx' || fileSuffix == 'doc') {
      return fileImgPrefix + 'docx' + fixType + '.png'
    } else if (fileSuffix == 'xlsx' || fileSuffix == 'xls') {
      return fileImgPrefix + 'xlsx' + fixType + '.png'
    } else if (fileSuffix == 'zip' || fileSuffix == 'rar') {
      return fileImgPrefix + 'zip' + fixType + '.png'
    } else if (fileSuffix == 'jpg' || fileSuffix == 'gif' || fileSuffix == 'png') {
      return fileImgPrefix + 'png' + fixType + '.png'
    } else {
      return fileImgPrefix + fileSuffix + fixType + '.png'
    }
  } else if ($tools.videoFormatArr.includes(fileName)) {
    return fileImgPrefix + 'mp4' + '.png'
  } else {
    return fileImgPrefix + 'normal' + fixType + '.png'
  }
}

export function getChatInfos(data: string, type?: string) {
  let newCont = ''
  let fileUrl = ''
  let fileSize = ''
  let fileKey = ''
  const mucCont = JSON.parse($tools.htmlDecodeByRegExp(data))
  const _obj = $tools.isJsonString(mucCont.messageJson) ? JSON.parse(mucCont.messageJson) : mucCont.messageJson
  const _type = mucCont.type
  let relmsg: any = Object.prototype.toString.call(_obj) === '[object Object]' ? _obj?.content : _obj
  if (Object.prototype.toString.call(_obj) === '[object Object]') {
    relmsg = _type === 4 ? _obj?.abbrAddress : _obj?.content
  } else {
    relmsg = _obj
  }
  const time = $tools.getMyDate(mucCont.serverTime)
  if (relmsg) {
    if (typeof relmsg === 'number') {
      newCont = relmsg.toString()
    } else {
      newCont = relmsg.replace($tools.regCharacter, '')
    }
    newCont = newCont
      // .replace($tools.regEmoji, '<img class="emoji_icon" src="../../../../../assets/emoji/$1.png">')
      .replace(/(?<!\\)\u003c/g, '&lt;')
      .replace(/(?<!\\)\u003e/g, '&gt;')
      .replace($tools.regEmoji, function(_: string, regStr: any) {
        const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
        return `<img class="emoji_icon" src="${imgUrl}">`
      })
      .replace($tools.regAtUser, '')
    // 收藏
    if (type === 'collect') {
      // 普通消息
      if (_type == 1) {
        //替换表情
        const name = relmsg
          .replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
          .replace($tools.regCharacter, '')
        if ($tools.regHttps1.test(name)) {
          newCont = name.replace($tools.regHttps2, '<a href="$&" target="_blank">$&</a>')
        } else {
          newCont = name
        }
      }
      // @消息
      if (_type == 2) {
        newCont = relmsg
      }
    }

    if (type == 'reply') {
      if (_type == 1) {
        //替换表情
        const name = mucCont.messageJson
          .replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
          .replace($tools.regCharacter, '')
        if ($tools.regHttps1.test(name)) {
          newCont = name.replace($tools.regHttps2, '<a href="$&" target="_blank">$&</a>')
        } else {
          newCont = name
        }
      }
      if (_type == 2) {
        // 被@
        if (mucCont.spareType == 4) {
          //引用@
          const quoteMsg = relmsg.split('###')
          let nowmessage = quoteMsg[3]
          nowmessage = nowmessage
            .replace($tools.regImg1, '')
            .replace($tools.regEmoji, function(_: string, regStr: any) {
              const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
              return `<img class="emoji_icon" src="${imgUrl}">`
            })
          nowmessage = nowmessage.replace($tools.regAtUser, '<span class="chatAt" name="$1">@$1 </span>')
          newCont = nowmessage
        } else {
          if (type === 'reply') {
            newCont = relmsg
              .replace($tools.regImg1, '')
              .replace($tools.regEmoji, function(_: string, regStr: any) {
                const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
                return `<img class="emoji_icon" src="${imgUrl}">`
              })
          } else {
            newCont = newCont
              .replace($tools.regAtUser, '<span class="chatAt" name="$1">@$1 </span>')
              .replace($tools.regImg1, '')
              .replace($tools.regEmoji, function(_: string, regStr: any) {
                const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
                return `<img class="emoji_icon" src="${imgUrl}">`
              })
          }
        }
      }
      if (_type == 3) {
        let nowMessage = relmsg.split('###')[3]
        nowMessage = nowMessage
          .replace($tools.regImg1, '')
          .replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
          .replace($tools.regAtUser, '<span class="chatAt" name="$1">@$1 </span>')
        newCont = nowMessage
      }
    }
  } else {
    if (_type == 1) {
      //替换表情
      const name = mucCont.messageJson
        .replace($tools.regEmoji, function(_: string, regStr: any) {
          const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
          return `<img class="emoji_icon" src="${imgUrl}">`
        })
        .replace($tools.regCharacter, '')
      if ($tools.regHttps1.test(name)) {
        newCont = name.replace($tools.regHttps2, '<a href="$&" target="_blank">$&</a>')
      } else {
        newCont = name
      }
    }
    if (_type == 3) {
      // 附件消息
      const { officeUrl, displayName, fileSize: size, fileKey: key } = _obj
      const myfile = displayName
        .toLowerCase()
        .split('.')
        .splice(-1)[0]
      if (type !== 'reply') {
        if (!$tools.imgFormatArr.includes(myfile)) {
          const fileTxtSrc = getFileIcon(displayName)
          newCont = `<img class="file_img" src="${fileTxtSrc}">${displayName}`
        } else {
          newCont = `<img class="file_img" src="${officeUrl}">${displayName}`
        }
      } else {
        if (!$tools.imgFormatArr.includes(myfile)) {
          newCont = `【文件】${displayName}`
        } else {
          newCont = `【图片】${displayName}`
        }
      }
      fileUrl = officeUrl
      fileSize = size
      fileKey = key
    }
    if (_type == 6) {
      // 引用消息
      const $quoteMsg = mucCont?.messageJson || ''
      const quoteMsg = JSON.parse($quoteMsg)
      const contentJson = JSON.parse(quoteMsg.contentJson)
      const { content, title } = contentJson
      newCont = title + content
    }
  }
  return {
    name: mucCont.fromUser.username,
    msg: newCont,
    time: time,
    fileUrl: fileUrl,
    fileSize: fileSize,
    fileKey: fileKey,
    fileName: mucCont.messageJson?.displayName ? mucCont.messageJson?.displayName : '',
    timestamp: mucCont.serverTime,
    // subType: subType,
    type: _type,
  }
}

// 发送消息
export const sendToMessage = (params: any, selectItem: any) => {
  const { messageJson, type } = params || {}
  const { nowUser, nowUserId, messageHistory } = $store.getState()
  const { roomJid, roomId } = selectItem
  const msgJson = {
    ...params,
    fromUser: {
      userId: nowUserId,
      username: nowUser,
    },
    roomId: roomId,
    stamp: new Date().getTime(),
    messageJson: type === 1 ? messageJson : JSON.stringify(messageJson),
  }
  // 发送消息
  console.log('前端发送消息传递的参数', params)
  ipcRenderer.send('send_message', [JSON.stringify(msgJson), roomJid])
}

// 聊天室成员
export function _to(userList: Array<globalInterface.ChatMemberPorps>, type?: string) {
  const { nowAccount } = $store.getState()
  const arr = userList.map((item: globalInterface.ChatMemberPorps) => {
    if (item.account !== nowAccount.toString()) {
      return item.account
    }
  })
  if (type === 'str') {
    return arr.join(',').substring(0, _to.length - 1)
  } else {
    const r = arr.filter(function(s) {
      return s && s.trim()
    })
    return r
  }
}

// json解析
// export const jsonParse = (data: any, value?: any) => {
//   return JSON.parse(data.content)[value]
// }

// 更新历史消息并排序
// export const updateHistoryMsg = (newData: any[]) => {
//   newData.sort((a: any, b: any) => {
//     const aTime = jsonParse(a, 'time') || 0
//     const bTime = jsonParse(b, 'time') || 0
//     return aTime.valueOf() - bTime.valueOf()
//   })
//   return newData
// }
export const updateHistoryMsg = (newData: any[]) => {
  newData.sort((a: any, b: any) => {
    const aTime = a.serverTime || 0
    const bTime = b.serverTime || 0
    return aTime - bTime
  })
  return newData
}

export const parseContent = (content: any) => {
  let dataContent: any = ''
  try {
    dataContent = JSON.parse(content)
  } catch {
    dataContent = JSON.parse($tools.htmlDecodeByRegExp(content))
  }
  return dataContent
}

export const getAvatarEnums = (talkType: number, roomName: string) => {
  if (talkType === 7) {
    // 消息机器人
    const AvatarEnums = {
      审批: $tools.asAssetsPath('/images/chatWin/robot_approval.png'),
      系统通知: $tools.asAssetsPath('/images/chatWin/robot_notice.png'),
      评论: $tools.asAssetsPath('/images/chatWin/robot_comment.png'),
      汇报: $tools.asAssetsPath('/images/chatWin/robot_report.png'),
      工作推进: $tools.asAssetsPath('/images/chatWin/robot_work_promotion.png'),
    }
    return AvatarEnums[roomName]
  } else if (talkType === 6) {
    // 全员群
    return $tools.asAssetsPath('/images/chatWin/company_default_icon.svg')
  } else if (talkType === 4) {
    // 部门群
    return $tools.asAssetsPath('/images/chatWin/department_default_icon.svg')
  } else if (talkType === 5) {
    // 讨论群
    return $tools.asAssetsPath('/images/chatWin/discuss_default_icon.svg')
  }
}

/**
 * 查询已读未读列表
 * @param roomJid
 * @param time
 * @returns
 */
export const readMessageList = (roomJid: any, time: any) => {
  const { nowAccount, loginToken } = $store.getState()
  return new Promise<void>(resolve => {
    const param = {
      muc: roomJid,
      userAccount: nowAccount.replace('@', ''),
      time,
    }
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

/**
 * 查询成员列表
 * @param sendTime
 * @param muc
 * @returns
 */
export const queryUserList = (sendTime: number, muc: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>(resolve => {
    const param = {
      timestamp: sendTime,
      muc: muc,
    }
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

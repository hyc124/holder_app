import React, { useEffect, useRef, useState, useImperativeHandle } from 'react'
import { Button, message, Menu, Upload, Modal, Avatar, Dropdown, Tooltip } from 'antd'
import { ipcRenderer, remote, clipboard } from 'electron'
import { getAvatarEnums } from '../getData/ChatHandle'
import axios from 'axios'
import moment from 'moment'
import '@/src/common/js/jquery.caret'
import { Diff } from 'diff'
import * as Maths from '@/src/common/js/math'
import ChatEmoji from '@/src/components/chat-emoji/chat-emoji'
import { useMergeState } from '../chatwin'
import {
  findLocalMsgByCachetime,
  getCacheMsg,
  deleteChatMsg,
  updateChatMsg,
  insertChatMsg,
} from '../getData/ChatInputCache'
import { addFileInfoToRoom, getChatToken } from '../getData/getData'
import { sendToMessage, parseContent } from '../getData/ChatHandle'
import '../styles/ChatMsgEditor.less'
import { filterAtData, showSize } from './global/common'
const fs = require('fs')
const path = require('path')
const Tribute = require('../../../common/js/tribute')
const FILEHOST = process.env.API_FILE_HOST

let anewSendMsg: any = null
export const anewSendMsgFn = (data: any) => {
  $tools.debounce(anewSendMsg(data), 500)
}

let dropFun: any = null
export const dropUploadFile = (fileList: any) => {
  dropFun(fileList)
}

interface DiffValueProps {
  count: number
  value: string
  removed: boolean | undefined
  added: boolean | undefined
}
// let nowSetClick = true //重复点击
//========================================*=&聊天输入框&===================================================//

// @人相关变量
let inputContent = ''
let currentAtIndex = 0

// 输入框放大缩小变量
let obj = false // 当前操作的对象
let msgSend: any = null // 要处理的对象
let clickY = 0 // 保留上次的Y轴位置
let osFilePath = ''
const ChatMsgEditor = (_$: any, ref: any) => {
  const { msgData } = _$
  const { nowUserId, nowAccount, nowUser, chatUserInfo, selectItem } = $store.getState()
  const msgTxtRef = useRef<any>(null)
  const [captureType, setCaptureType] = useState('0') // 截图方式选择
  const [visible, setVisible] = useState(false) // 是否显示截图选择方式下拉菜单
  const arr = msgData || []
  // @人员的列表数据
  const atList = filterAtData(arr) || []
  // 当前@的人
  const [menuStatus, setMenuStatus] = useMergeState({
    rightMenuVisibe: false, // 控制右键菜单显示隐藏
    clipBoardContent: '',
  })
  const [tips, setTips] = useState('')

  useImperativeHandle(ref, () => ({
    // 手动添加输入框默认值
    setMsgText: (value: string) => {
      msgTxtRef.current.innerHTML = value
      moveEnd()
    },
    getMsgText: () => {
      return msgTxtRef.current.innerHTML
    },
    focusBox: () => {
      msgTxtRef.current.focus()
    },
  }))

  useEffect(() => {
    let menuContainerDom: any = null
    let msgEditorDom: any = null
    if (document.getElementById('msgSend') !== null) {
      menuContainerDom = document.getElementById('msgSend')
    }
    if (document.getElementById('msg-txt') !== null) {
      msgEditorDom = document.getElementById('msg-txt')
    }
    // @人功能
    const tribute = new Tribute({
      trigger: '@',
      values: atList,
      selectTemplate: (item: any): any => {
        if (typeof item === 'undefined') return ''
        const { original } = item
        if (original.account) {
          return `<button class="chatAt" contenteditable="false" onclick='return false;' data-id="${original.id}"  data-peerid="${original.id}">@${original.value}&nbsp;</button>`
        } else {
          return `<button class="chatAt" contenteditable="false" onclick='return false;' data-id="${0}" data-peerid="all">@${'所有人'}&nbsp;</button>`
        }
      },
      menuItemTemplate: (item: any) => {
        const { original } = item || {}
        if (original.headPhoto && original.headPhoto != 'null') {
          return `<img class="at_user_avatar" src="${original.headPhoto}" data-item='${JSON.stringify({
            value: original.value,
            account: original.account,
          })}'/>${original.value}`
        } else {
          const avatarStr = original.account ? original.value.substr(-2, 2) : '@'
          return `<span calss="name_user_avatar">${avatarStr}</span>` + original.value
        }
      },
      // 指定触发字符串前是否需要空格
      requireLeadingSpace: false,
      endtenSelectsMatch: false,
      replaceTextSuffix: ' ',
      searchOpts: {
        pre: '',
        post: '',
        skip: false, // true 将跳过本地搜索，如果进行服务器端搜索很有用
      },
      // 拓展方法：列表搜索加载完成时
      showMenuFor: () => {
        // 检测列表中头像无效时，则替换为名字展示
        const atImgs = $(menuContainerDom).find('.at_user_avatar')
        atImgs.on('error', function() {
          const dataItemStr: any = $(this).attr('data-item') || '{}'
          const dataItem: any = JSON.parse(dataItemStr)
          const avatarStr = dataItem.account ? dataItem.value.substr(-2, 2) : '@'
          const newAvatar = `<span calss="name_user_avatar">${avatarStr}</span>`
          $(this).replaceWith(newAvatar)
        })
      },
      // positionMenu: false,
      // 未匹配到人员隐藏人员框
      noMatchTemplate: () => {
        $('.tribute-container').hide()
        return '<span style:"visibility: hidden;"></span>'
      },

      // 为菜单指定一个替代的父容器
      menuContainer: menuContainerDom,
    })
    if (selectItem.type !== 3) {
      tribute.attach(msgEditorDom)
    }
    return () => {
      // 删除@人框dom
      tribute?.detach(msgEditorDom)
    }
  }, [msgData, selectItem])

  useEffect(() => {
    inputContent = ''
    setTimeout(() => moveEnd(), 200)
  }, [$store.getState().selectItem.roomId])

  useEffect(() => {
    const { selectItem } = $store.getState()
    const { nowUserId, chatDrafMsg } = $store.getState()
    const ele = document.getElementById('msg-txt')
    const chatMsgEntity = JSON.parse(JSON.stringify(chatDrafMsg || []))
    let hasDraft = false
    chatMsgEntity?.forEach((item: any) => {
      const itemMuc = item.roomJid
      const itemUserId = item.userId
      if (itemMuc == selectItem.roomJid && itemUserId == nowUserId) {
        hasDraft = true
      }
    })
    if (hasDraft && ele) {
      ele.innerHTML = getCacheMsg(selectItem.roomJid)
    }
  }, [])

  const checkFileSize = (fileSize: number) => {
    const size = Math.floor(fileSize / (1024 * 1024))
    if (size > 200) {
      Modal.info({
        title: '提示',
        content: '文件大小不能大于200M',
      })
      return false
    } else if (fileSize === 0) {
      Modal.info({
        title: '提示',
        content: '文件大小不能为空，已取消上传',
      })
      return false
    } else {
      return true
    }
  }

  const getUnreadUserList = () => {
    const { selectItem, chatUserLists } = $store.getState()
    let userList: any[] = []
    if (selectItem.talkType !== 3) {
      userList = chatUserLists
        .map(item => {
          if (item.id !== nowUserId) {
            return item.id
          }
        })
        .filter(function(s) {
          return s
        })
    } else {
      userList = [selectItem?.typeId]
    }
    return userList
  }

  const updateMessageHistory = (value: any, selectItemId: number) => {
    const { messageHistory, selectItem } = $store.getState()
    if (selectItem.roomId === selectItemId) {
      const data = messageHistory.map((item: globalInterface.ChatItemProps) => {
        if (item.msgUuid === value.msgUuid) {
          return { ...item, ...value }
        } else {
          return item
        }
      })
      $store.dispatch({
        type: 'CHAT_ROOM_INFO',
        data: { messageHistory: data },
      })
    }
  }

  const multipartUploadFile = (
    file: any,
    fileUuid: any,
    fileName: any,
    localData: any,
    teamId: any,
    selectItemId: number
  ) => {
    return new Promise(async resolve => {
      // const content = JSON.parse($tools.htmlDecodeByRegExp(localData.content))
      const { nowUserId, nowAccount } = $store.getState()
      const formDatas: any = new FormData()
      const size = file.size //总大小
      const shardSize = 5 * 1024 * 1024 //以5MB为一个分片
      const shardCount: any = Math.ceil(size / shardSize) //总片数  45608976/
      formDatas.append('guid', fileUuid)
      formDatas.append('requestSource', 0)
      formDatas.append('ischunk', shardCount > 1 ? 1 : 0)
      formDatas.append('fileSize', size)
      formDatas.append('fileName', fileName)
      formDatas.append('companyId', !!teamId ? `${teamId}` : nowAccount)
      formDatas.append('userId', nowUserId)
      formDatas.append('fileId', localData.roomId)
      formDatas.append('displayName', fileName)
      formDatas.append('otherFile', !!teamId ? 0 : 1)
      formDatas.append('businessId', localData.roomId)
      formDatas.append('businessType', 7)
      formDatas.append('description', localData.messageJson.roomName)

      async function fetchData() {
        for (let i = 0; i < shardCount; ++i) {
          //计算每一片的起始与结束位置
          const start = i * shardSize
          const end = Math.min(size, start + shardSize)
          formDatas.set('chunk', i) //当前是第几片
          formDatas.set('chunkCount', shardCount) //分片总数
          formDatas.set('files', file.slice(start, end)) //slice方法用于切出文件的一部分
          localData.messageJson.process = Math.floor((i / shardCount) * 100)
          updateMessageHistory(localData, selectItemId)
          const _tokenPatam = {
            companyId: !!teamId ? `${teamId}` : nowAccount,
            userId: nowUserId,
            otherFile: !!teamId ? 0 : 1,
          }
          console.log('上传附件的参数', _tokenPatam)
          const $$token = await getChatToken(_tokenPatam)
          await axios({
            method: 'post',
            url: `${FILEHOST}/api/File/UploadFiles`,
            headers: {
              Token: $$token,
            },
            data: formDatas,
            timeout: 60000,
          })
            .then((res: any) => {
              if (i === shardCount - 1) {
                const _data = res.data
                const {
                  fileGUID,
                  officeUrl,
                  mobileOfficeUrl,
                  downloadUrl,
                  imageWidth,
                  imageHeight,
                } = _data.data
                resolve({
                  resData: {
                    fileGUID,
                    officeUrl,
                    mobileOfficeUrl,
                    downloadUrl,
                    imageHeight,
                    imageWidth,
                  },
                  localData,
                })
              }
            })
            .catch(() => {
              ipcRenderer.send('error-send-msg', JSON.stringify(localData))
              i = shardCount
            })
        }
      }
      fetchData()
    })
  }

  //上传附件信息
  const saveFile = async (
    sendTime: number,
    fileKey: string,
    fileName: string,
    fileSize: number,
    localData: any,
    fileGUID: any,
    officeUrl: string,
    mobileOfficeUrl: string,
    downloadUrl: string,
    selectItem: any,
    teamId: any,
    imageWidth: number,
    imageHeight: number,
    roomName: string
  ) => {
    //上传附件信息到聊天室
    const fileInfo = {
      dir: 'talk',
      fileKey: fileKey,
      fileGUID: fileGUID,
      officeUrl: officeUrl,
      downloadUrl: downloadUrl,
      mobileOfficeUrl: mobileOfficeUrl,
      fileName: fileName,
      fileSize: fileSize,
      custom: 'file_upload',
    }
    await addFileInfoToRoom(fileInfo)
    //获取附件地址
    const value = {
      msgUuid: localData.msgUuid,
      type: 3,
      isCollect: 0, //是否已收藏（未收藏0 已收藏1）
      isRecall: 0, //是否已撤回（未撤回0 撤回1）
      serverTime: sendTime,
      messageJson: {
        fileGUID: fileGUID, //文件的唯一标识
        companyId: teamId, //下载文件时，根据此id获取文件Token
        officeUrl: officeUrl, //PC端Office文件在线预览地址
        mobileOfficeUrl: mobileOfficeUrl, //移动端Office文件在线预览地址
        downloadUrl: downloadUrl, //文件地址
        imageWidth: imageWidth, //图片宽度
        imageHeight: imageHeight, //图片高度
        fileSize: fileSize, //文件大小
        displayName: fileName, //文件展示名
        previewImageUrl: '', //视频第一帧图片地址（暂时还没有做这个功能）
        fileKey: fileGUID,
        signType: 'file_upload',
      },
    }
    // 更新本地缓存
    localData.serverTime = sendTime
    localData.messageJson.process = 100
    localData.messageJson.fileUrl = officeUrl
    localData.messageJson.officeUrl = officeUrl
    localData.messageJson.fileGUID = fileGUID
    localData.messageJson.mobileOfficeUrl = mobileOfficeUrl
    localData.messageJson.downloadUrl = downloadUrl
    localData.sendStatus = '0'
    updateMessageHistory(localData, selectItem.roomId)
    // 发送消息
    sendToMessage(value, selectItem)

    const data = {
      ...localData,
      unreadUserList: getUnreadUserList(),
    }
    updateChatMsg(data)
  }

  //重新发送消息
  anewSendMsg = async (messcontent: any) => {
    const { messageHistory, selectItem, chatUserLists } = $store.getState()
    const { ascriptionId, type: talkType } = selectItem
    if (messcontent.type === 2) {
      if (messcontent.signType === 'shot_screen') {
        // 重新发送截图消息
        reShotScreen(messcontent, selectItem)
      } else {
        // 重新发送上传文件的消息
        const filePath = path.resolve(messcontent.filePath) // 如果是本地文件
        fs.readFile(filePath, function(err: any, file: any) {
          if (err) {
            message.error('文件不存在或已被清理')
          } else {
            const buf = Buffer.from(file, 'binary')
            const blob = new Blob([buf], { type: messcontent.type })
            const { fileName } = messcontent
            const fileUuid = Maths.uuid()
            const ext = fileName
              ?.toLowerCase()
              .split('.')
              .splice(-1)[0]
            const fileKey = fileUuid + '.' + ext
            let teamId: any = ascriptionId || ''
            //主题群聊
            if (talkType === 5) {
              //单独获取企业id
              const findTeamId: any = chatUserLists.find((item: any) => {
                return item.userId === nowUserId
              })
              teamId = findTeamId?.enterpriseId
            }
            multipartUploadFile(blob, fileUuid, fileName, messcontent, teamId, selectItem.roomId).then(
              async ({ resData, localData }: any) => {
                const {
                  fileGUID,
                  officeUrl,
                  mobileOfficeUrl,
                  downloadUrl,
                  displayName,
                  imageWidth,
                  imageHeight,
                } = resData
                const fileSize = file.size ? file.size : file.fileSize
                // 保存附件
                //上传附件信息到聊天室
                const fileInfo = {
                  dir: 'talk',
                  fileKey: fileKey,
                  fileGUID: fileGUID,
                  officeUrl: officeUrl,
                  downloadUrl: downloadUrl,
                  mobileOfficeUrl: mobileOfficeUrl,
                  fileName: fileName,
                  fileSize: fileSize,
                  custom: 'file_upload',
                }
                await addFileInfoToRoom(fileInfo)

                let companyId: any = teamId
                //主题群聊
                if (talkType === 5) {
                  //单独获取企业id
                  const findTeamId: any = chatUserLists.find((item: any) => {
                    return item.userId === nowUserId
                  })
                  companyId = findTeamId?.enterpriseId || null
                } else if (talkType === 6 || talkType === 4) {
                  //全员群,部门群
                  companyId = ascriptionId
                } else {
                  //私聊
                  companyId = null
                }

                //获取附件地址
                const value = {
                  msgUuid: Maths.uuid(),
                  type: 3,
                  isCollect: 0, //是否已收藏（未收藏0 已收藏1）
                  isRecall: 0, //是否已撤回（未撤回0 撤回1）
                  serverTime: getServerTime(),
                  messageJson: {
                    fileGUID: fileGUID, //文件的唯一标识
                    companyId: companyId, //下载文件时，根据此id获取文件Token
                    officeUrl: officeUrl, //PC端Office文件在线预览地址
                    mobileOfficeUrl: mobileOfficeUrl, //移动端Office文件在线预览地址
                    downloadUrl: downloadUrl, //文件地址
                    imageWidth: imageWidth, //图片宽度
                    imageHeight: imageHeight, //图片高度
                    fileSize: parseInt(fileSize), //文件大小
                    displayName: displayName, //文件展示名
                    previewImageUrl: '', //视频第一帧图片地址（暂时还没有做这个功能）
                    fileKey: fileGUID,
                    signType: 'file_upload',
                  },
                }

                sendToMessage(value, selectItem)
                const { messageHistory } = $store.getState()
                const { selectItem: newSelectItem } = $store.getState()
                if (newSelectItem.roomId === selectItem.roomId) {
                  const resultData = JSON.parse(JSON.stringify(messageHistory))
                  let isIn = false
                  resultData.forEach((item: any, index: number) => {
                    if (item.msgUuid === localData.msgUuid) {
                      isIn = true
                      resultData.splice(index, 1)
                      deleteChatMsg({
                        msgUuid: item.msgUuid,
                      })
                    }
                  })

                  localData.messageJson.process = 100
                  localData.messageJson.fileUrl = officeUrl
                  localData.messageJson.officeUrl = officeUrl
                  localData.messageJson.fileGUID = fileGUID
                  localData.serverTime = getServerTime()
                  localData.messageJson.mobileOfficeUrl = mobileOfficeUrl
                  localData.messageJson.downloadUrl = downloadUrl
                  localData.messageJson.displayName = displayName
                  localData.sendStatus = '0'
                  if (isIn) {
                    resultData.push(localData)
                    insertChatMsg({
                      roomId: localData.roomId,
                      data: localData,
                    })
                  }
                  $store.dispatch({ type: 'CHAT_ROOM_INFO', data: { messageHistory: resultData } })
                }
              }
            )
          }
        })
      }
    } else {
      // 重新发送其他消息
      const data = JSON.parse(JSON.stringify(messageHistory))
      let isIn = false
      data.forEach((item: any, index: number) => {
        if (item.msgUuid === messcontent.msgUuid) {
          isIn = true
          data.splice(index, 1)

          deleteChatMsg({ msgUuid: item.msgUuid })
        }
      })
      messcontent.sendStatus = '0'
      messcontent.serverTime = getServerTime()
      if (isIn) {
        data.push(messcontent)
        insertChatMsg({
          roomId: messcontent.roomId,
          data: messcontent,
        })
      }
      $store.dispatch({ type: 'CHAT_ROOM_INFO', data: { messageHistory: data } })
      // 发送一条新消息
      sendToMessage(messcontent, selectItem)
    }
  }

  const uploadScreenImgFile = async ({ baseStr, fileName, localData }: any) => {
    const { selectItem, nowAccount } = $store.getState()
    const { id } = selectItem
    const $$token = await getChatToken({
      companyId: nowAccount,
      userId: nowUserId,
      otherFile: 1,
    })
    return new Promise((resolve, reject) => {
      const formDatas: any = new FormData()
      formDatas.append('guid', Maths.uuid())
      formDatas.append('imageBase64', baseStr)
      formDatas.append('requestSource', 0)
      formDatas.append('ischunk', 0)
      formDatas.append('fileName', fileName)
      formDatas.append('companyId', nowAccount)
      formDatas.append('userId', nowUserId)
      formDatas.append('fileId', id)
      formDatas.append('otherFile', 1)
      formDatas.append('businessId', localData.roomId)
      formDatas.append('businessType', 7)
      formDatas.append('description', localData.roomName)
      axios({
        method: 'post',
        url: `${FILEHOST}/api/File/UploadFiles`,
        headers: {
          Token: $$token,
        },
        data: formDatas,
        timeout: 60000,
      })
        .then((res: any) => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  const uploadScreenImg = ({ value, fileName, fileKey, fileSize, baseStr, localData, selectItem }: any) => {
    //上传截图文件
    uploadScreenImgFile({ baseStr, fileName, localData })
      .then((data: any) => {
        if (data.code === 1 && !!data.data) {
          const {
            fileGUID,
            officeUrl,
            mobileOfficeUrl,
            downloadUrl,
            displayName,
            imageWidth,
            imageHeight,
          } = data.data
          const { nowAccount } = $store.getState()
          // 发送消息
          value.messageJson.fileUrl = officeUrl
          value.messageJson.imageWidth = imageWidth
          value.messageJson.imageHeight = imageHeight
          value.messageJson.officeUrl = officeUrl
          value.messageJson.fileGUID = fileGUID
          value.messageJson.mobileOfficeUrl = mobileOfficeUrl
          value.messageJson.downloadUrl = downloadUrl
          value.messageJson.displayName = displayName
          value.messageJson.companyId = selectItem?.ascriptionId
          value.sendStatus = '0'

          // 更新本地缓存
          localData.messageJson.process = 100
          localData.messageJson.fileUrl = officeUrl
          localData.messageJson.officeUrl = officeUrl
          localData.messageJson.fileGUID = fileGUID
          localData.messageJson.mobileOfficeUrl = mobileOfficeUrl
          localData.messageJson.downloadUrl = downloadUrl
          localData.messageJson.displayName = displayName
          localData.sendStatus = '0'
          updateMessageHistory(localData, selectItem.roomId)
          sendToMessage(value, selectItem)

          const newData = {
            ...localData,
            unreadUserList: getUnreadUserList(),
          }
          updateChatMsg(newData)
          const fileInfo = {
            dir: 'talk',
            fileKey: fileKey,
            fileName: fileName,
            fileSize: Number(fileSize),
            custom: 'file_upload',
            officeUrl: officeUrl,
            fileGUID: fileGUID,
            mobileOfficeUrl: mobileOfficeUrl,
          }
          // 上传附件信息到聊天室
          addFileInfoToRoom(fileInfo)
        }
      })
      .catch(() => {
        const nickName = chatUserInfo.nickName
        const { selectItem } = $store.getState()
        const { roomId, talkType, ascriptionName, roomName, roomJid } = selectItem
        ipcRenderer.send(
          'error-send-msg',
          JSON.stringify({
            from: nickName ? nickName : nowUser,
            fromId: nowUserId,
            fromAccount: nowAccount,
            roomName: roomName,
            roomJid: roomJid,
            roomId: roomId,
            roomType: talkType,
            ascriptionId: roomId,
            ascriptionName: ascriptionName,
            ...value,
          })
        )
      })
  }

  const reShotScreen = async (currentItemMsg: any, selectItem: any) => {
    //上传截图文件
    const { nowAccount } = $store.getState()
    const { fileKey, fileName, fileSize, baseStr } = currentItemMsg
    await uploadScreenImgFile({ baseStr: baseStr, fileName, selectItem })
      .then(async (data: any) => {
        if (data.code === 1 && !!data.data) {
          const {
            officeUrl,
            fileGUID,
            mobileOfficeUrl,
            downloadUrl,
            imageWidth,
            imageHeight,
            displayName,
          } = data.data
          const fileInfo = {
            dir: 'talk',
            fileKey: fileKey,
            fileName: fileName,
            fileSize: Number(fileSize),
            custom: 'file_upload',
            officeUrl: officeUrl,
            fileGUID: fileGUID,
            mobileOfficeUrl: mobileOfficeUrl,
            downloadUrl: downloadUrl,
          }
          const newTime = getServerTime()
          const value = {
            msgUuid: Maths.uuid(),
            type: 3,
            isCollect: 0, //是否已收藏（未收藏0 已收藏1）
            isRecall: 0, //是否已撤回（未撤回0 撤回1）
            serverTime: newTime,
            messageJson: {
              fileGUID: fileGUID, //文件的唯一标识
              companyId: selectItem.ascriptionId || nowAccount, //下载文件时，根据此id获取文件Token
              officeUrl: officeUrl, //PC端Office文件在线预览地址
              mobileOfficeUrl: mobileOfficeUrl, //移动端Office文件在线预览地址
              downloadUrl: downloadUrl, //文件地址
              imageWidth: imageWidth, //图片宽度
              imageHeight: imageHeight, //图片高度
              fileSize: parseInt(fileSize), //文件大小
              displayName: displayName, //文件展示名
              previewImageUrl: '', //视频第一帧图片地址（暂时还没有做这个功能）
              fileKey: fileGUID,
              signType: 'shot_screen',
            },
          }

          // 发送消息
          sendToMessage(value, selectItem)
          const { messageHistory } = $store.getState()
          const { selectItem: newSelectItem } = $store.getState()
          if (newSelectItem.roomId === selectItem.roomId) {
            const resultData = JSON.parse(JSON.stringify(messageHistory))
            let isIn = false
            resultData.forEach((item: any, index: number) => {
              if (item.msgUuid === currentItemMsg.msgUuid) {
                isIn = true
                resultData.splice(index, 1)
                deleteChatMsg({ msgUuid: item.msgUuid })
              }
            })
            currentItemMsg.serverTime = newTime
            currentItemMsg.messageJson.process = 100
            currentItemMsg.messageJson.officeUrl = officeUrl
            currentItemMsg.messageJson.mobileOfficeUrl = mobileOfficeUrl
            currentItemMsg.sendStatus = '0'
            currentItemMsg.messageJson.downloadUrl = downloadUrl

            if (isIn) {
              resultData.push(currentItemMsg)
              insertChatMsg({
                roomId: currentItemMsg.roomId,
                data: currentItemMsg,
              })
            }
            $store.dispatch({
              type: 'CHAT_ROOM_INFO',
              data: {
                messageHistory: resultData,
              },
            })
          }
          // 上传附件信息到聊天室
          addFileInfoToRoom(fileInfo)
        }
      })
      .catch((err: any) => {
        message.error('上传失败', err)
      })
  }

  function getLocation(e: any) {
    return {
      x: e.x || e.clientX,
      y: e.y || e.clientY,
    }
  }

  // 鼠标点击
  const mousedown = function(e: any) {
    const location = getLocation(e)
    clickY = location.y
    obj = true
    msgSend = document.getElementById('msgSend')
  }

  const mouseup = function() {
    obj = false
    document.body.style.cursor = 'auto'
  }

  const mousemove = function(e: any) {
    if (obj) {
      const location = getLocation(e)
      document.body.style.cursor = 'n-resize'
      document.body.style.cursor = location + '_resize'
      const addLength = clickY - location.y
      clickY = location.y
      const length = parseInt(msgSend.style.height) + addLength
      msgSend.style.height = length + 'px'
    }
  }

  /***
   * 发送文件：上传先添加一条消息到历史消息并添加到本地缓存
   * @param file 上传的文件file类型或者blob类型
   * @param fileUuid
   * @param fileKey 必须带文件的后缀保证下载和预览正常
   * @param sendTime
   */
  const updateLocal = async (file: any) => {
    const fileName = file.name
    const ext = fileName
      ?.toLowerCase()
      .split('.')
      .splice(-1)[0]
    const fileUuid = Maths.uuid()
    const fileKey = fileUuid + '.' + ext
    const sendTime = getServerTime()
    const nickName = chatUserInfo.nickName
    const { nowUserId, selectItem, messageHistory, chatUserLists } = $store.getState()
    const { roomId: id, type: talkType, roomName, ascriptionId } = selectItem
    const { nowAccount } = $store.getState()
    const msgJson = {
      msgUuid: Maths.uuid(),
      type: 3,
      isCollect: 0, //是否已收藏（未收藏0 已收藏1）
      isRecall: 0, //是否已撤回（未撤回0 撤回1）
      stamp: new Date().getTime(),
      serverTime: sendTime,
      messageJson: {
        fileGUID: fileKey, //文件的唯一标识
        companyId: ascriptionId || nowAccount, //下载文件时，根据此id获取文件Token
        officeUrl: file.path, //PC端Office文件在线预览地址
        mobileOfficeUrl: file.path, //移动端Office文件在线预览地址
        downloadUrl: file.path, //文件地址
        fileSize: file.size, //文件大小
        displayName: file.name, //文件展示名
        previewImageUrl: '', //视频第一帧图片地址（暂时还没有做这个功能）
        fileKey: fileKey,
        process: 0,
        signType: 'file_upload',
      },
    }

    //组装本地数据存储
    const localData = {
      ...msgJson,
      fromUser: {
        userId: nowUserId,
        username: nowUser,
      },
      roomId: id,
      unreadUserList: getUnreadUserList(),
    }
    // 添加到历史消息
    await $store.dispatch({
      type: 'CHAT_ROOM_INFO',
      data: { messageHistory: [...messageHistory, localData] },
    })
    $store.dispatch({ type: 'SET_KEEP_SCROLL', data: false })
    // 缓存到本地数据库
    insertChatMsg({
      roomId: id,
      data: localData,
    })
    let teamId: any = ascriptionId
    // 上传附件
    if (talkType === 5) {
      //单独获取企业id
      const findTeamId: any = chatUserLists.find((item: any) => {
        return item.userId === nowUserId
      })
      teamId = findTeamId?.enterpriseId
    }
    multipartUploadFile(file, fileUuid, fileName, localData, teamId, id).then(({ resData }: any) => {
      const { fileGUID, officeUrl, mobileOfficeUrl, downloadUrl, imageWidth, imageHeight } = resData
      const fileSize = file.size ? file.size : file.fileSize
      // 保存附件
      saveFile(
        sendTime,
        fileKey,
        fileName,
        fileSize,
        localData,
        fileGUID,
        officeUrl,
        mobileOfficeUrl,
        downloadUrl,
        selectItem,
        teamId,
        imageWidth,
        imageHeight,
        roomName
      )
    })
  }

  dropFun = async (fileList: any) => {
    let isFile = true
    const file = [...fileList][0]
    const fileSize = file.size
    try {
      const dataSlice = file.slice(0, 1)
      if (!file.type) {
        if (dataSlice.type === '' && dataSlice.size === 0) {
          isFile = false
        }
      }
      await dataSlice.arrayBuffer()
    } catch (err) {
      isFile = false
    }
    if (!isFile) {
      Modal.info({
        title: '提示',
        content: '暂不支持发送文件夹',
      })
      return
    }
    //检查文件大小
    if (checkFileSize(fileSize)) {
      const { profile, subject, talkType } = $store.getState().selectItem
      Modal.confirm({
        title: '发送给',
        width: 400,
        centered: true,
        className: 'uploadConfirmModal',
        icon: '',
        content: (
          <div className="sendInfoContent">
            <div className="roomInfoContent">
              <Avatar
                src={profile ? $tools.htmlDecodeByRegExp(profile) : getAvatarEnums(talkType, subject)}
                icon={talkType !== 3 && getListAvatar()}
                className="oa-avatar flex center"
                size="large"
              >
                {talkType === 3 && subject.substr(-2, 2)}
              </Avatar>
              <div>{subject}</div>
            </div>
            <div className="fileNameContent">{file.name}</div>
          </div>
        ),
        onOk() {
          // 上传附件先保存本地
          const filePath = path.resolve(file.path)
          fs.readFile(filePath, function(err: any) {
            if (err) {
              message.error('文件不存在或已被清理')
            } else {
              updateLocal(file)
            }
          })
        },
      })
    }
  }

  // 拖拽上传附件
  function onDrop(e: any) {
    const fileList = e.dataTransfer.files //获取文件对象
    //检测是否是拖拽文件到页面的操作
    if (fileList.length == 0) {
      return false
    } else {
      dropFun(fileList)
    }
    return false
  }

  function onDragStart(e: any) {
    e.preventDefault()
  }

  function onDragOver(e: any) {
    e.preventDefault()
    return false
  }

  function onDragEnter(e: any) {
    e.preventDefault()
  }

  function onDragLeave(e: any) {
    e.preventDefault()
  }

  useEffect(() => {
    // 输入框放大缩小
    document.onmousemove = mousemove
    document.onmouseup = mouseup
    return () => {
      document.onmousemove = null
      document.onmouseup = null
    }
  }, [])

  useEffect(() => {
    let isUnmounted = false
    if (!isUnmounted) {
      // 监听截图事件
      ipcRenderer.on('show-capture-img', () => {
        const fileSize = showSize(clipboard.readImage().toDataURL())
        const src = clipboard.readImage().toDataURL()
        if (fileSize) {
          const newCont = `<span class="img_around" contenteditable="false" datasrc="${src}"><img class="holer_img" src="${src}" data-key="${Maths.uuid() +
            '.png'}" data-name="截图.png" data-size="${fileSize}"/></span>`
          msgTxtRef.current.innerHTML += newCont
          msgTxtRef.current.focus()
          moveEnd()
        }
      })
      // 监听消息发送失败
      ipcRenderer.on('error-send-msg', (_event, args) => {
        const dataShowContent = parseContent(args)
        const { roomId: newMsgRoomId, type, msgUuid } = dataShowContent
        if (type !== 0) {
          // 更新左侧列表消息简略
          ipcRenderer.send('update_chat_room', [args])
          //消息发送失败 更改当前消息的状态为'发送失败'
          dataShowContent.sendStatus = '-1'
          updateMessageHistory(dataShowContent, newMsgRoomId)
          //type ===0 系统通知消息
          // 更新本地缓存
          findLocalMsgByCachetime(msgUuid).then((localData: any) => {
            if (localData && localData.length) {
              updateChatMsg({
                ...localData[0],
                ...dataShowContent,
                unreadUserList: getUnreadUserList(),
              })
            }
          })
        }
        // $store.dispatch({ type: 'SET_NETWORK_TIP', data: { status: true, networkText: '聊天服务连接中.....' } })
      })
      msgTxtRef.current.focus()
    }

    return () => {
      ipcRenderer.removeAllListeners('show-capture-img')
      ipcRenderer.removeAllListeners('error-send-msg')
      isUnmounted = false
    }
  }, [])

  const getListAvatar = () => {
    const normalHeader = $tools.asAssetsPath('/images/chatWin/chat_project.png')
    return <img style={{ width: 17, height: 15 }} src={normalHeader} />
  }

  // 光标定位到最后
  const moveEnd = () => {
    const obj = msgTxtRef.current
    if (window.getSelection) {
      //ie11 10 9 ff safari
      obj.focus() //解决ff不获取焦点无法定位问题
      const range = window.getSelection() //创建range
      if (range) {
        range.selectAllChildren(obj) //range 选择obj下所有子内容
        range.collapseToEnd() //光标移至最后
      }
    }
  }

  /**
   * 数组去重
   */
  const uniq = (array: any[], val: any) => {
    let isIn = false
    $.each(array, (i, item) => {
      if (item.userId == val) {
        isIn = true
        return false
      }
    })
    return isIn
  }

  // 静态更新聊天消息
  const localUpdateMsg = (value: any) => {
    const { nowUserId, selectItem, messageHistory, chatListData } = $store.getState()
    const nowListData = JSON.parse(JSON.stringify(chatListData))
    const { roomId } = selectItem
    const msgJson = {
      fromUser: {
        userId: nowUserId,
        username: nowUser,
      },
      roomId: roomId,
      sendStatus: '0',
      isRecall: 0,
      ...value,
    }
    const newMsgData = {
      ...msgJson,
      unreadUserList: getUnreadUserList(),
    }
    const data = JSON.parse(JSON.stringify(messageHistory))
    // 更新界面历史消息
    $store.dispatch({
      type: 'CHAT_ROOM_INFO',
      data: { messageHistory: [...data, newMsgData] },
    })
    // 发消息将滚动条跳转到底部
    $store.dispatch({ type: 'SET_KEEP_SCROLL', data: false })
    // 回复消息，更新回复数量
    if (value.type === 5) {
      const { messageJson } = value || {}
      const { originMsg } = messageJson || {}
      const { rootMsgUuid } = originMsg || {}
      // 回复的消息
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        if (item.msgUuid === rootMsgUuid) {
          const num = data[i].commentCount || 0
          data[i].commentCount = num + 1
          break
        }
      }
    }
    // 更新聊天室列表
    nowListData.map((item: globalInterface.ChatListProps) => {
      if (item.roomId === roomId) {
        item.isFirst = 1
      } else {
        item.isFirst = 0
      }
    })
    // 聊天室列表排序
    nowListData.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
      if (a.isTop === b.isTop) {
        return (b.isFirst || 0) - (a.isFirst || 0)
      }
      return b.isTop - a.isTop
    })
    // 更新聊天室列表
    $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: nowListData } })
    // 更新本地缓存历史消息
    insertChatMsg({
      roomId: msgJson.roomId,
      data: newMsgData,
    })
  }

  // 获取表情图名字
  const replaceImg = (ref: any) => {
    if (ref) {
      $(ref)
        .find('.emoji_icon')
        .each((i: number, item: any) => {
          const name = $(item).attr('data-name')
          $(item).prop('outerHTML', `[bq_${name}]`)
        })
    }
  }

  // 发送@消息
  const sendAtMessage = () => {
    // @人员列表
    const { chatUserLists } = $store.getState()
    // 处理表情
    let content = dealEmojiMessage()
    // 删除消息里面的截图、匹配@的成员信息
    content = content
      .replace($tools.regSpace1, '  ')
      .replace($tools.regSpan, '')
      .replace($tools.regAtbutton, '@$3')
      .replace(/<br>/g, '\n')
    // .replace(/&nbsp;/g, ' ')
    const atUsers = $('#msg-txt').find('.chatAt')
    let mucPersonRelationModels: any[] = []
    $.each(atUsers, async (i, item: any) => {
      const userId = $(item).attr('data-id') || ''
      let userName = ''
      let userAccount = ''
      // 通过id筛选出@的人
      const targetArr = chatUserLists.filter((item: any) => item.id == userId)
      if (targetArr.length !== 0) {
        userName = targetArr[0].nickName ? targetArr[0].nickName : targetArr[0].userName
        userAccount = targetArr[0].userAccount
      }
      // @所有
      if (userId == '0') {
        mucPersonRelationModels = chatUserLists.map((record: any) => {
          return {
            userId: record.id,
            userAccount: record.userAccount,
            userName: record.nickName ? record.nickName : record.userName,
          }
        })
        return false
      }
      // @人去重
      if (!uniq(mucPersonRelationModels, userId)) {
        const obj = { userId: Number(userId), userName, userAccount }
        mucPersonRelationModels.push(obj)
      }
    })
    const atVal = mucPersonRelationModels
      .map(item => {
        if (Number(item.userId) !== Number(nowUserId)) {
          return item.userId
        }
      })
      .filter(item => item != undefined)
    // 发送消息
    const value = {
      msgUuid: Maths.uuid(),
      type: 2,
      messageJson: {
        content: content,
        atUserIdList: atVal,
      },
      isCollect: 0, //是否已收藏（未收藏0 已收藏1）
      isRecall: 0, //是否已撤回（未撤回0 撤回1）
      serverTime: getServerTime(),
    }
    renderCommon(value)
  }

  // const replyMsgBind = (replyMsg: any, replyUuid: string) => {
  //   const { selectItem } = $store.getState()
  //   const { msgUuid } = replyMsg
  //   const params = {
  //     roomId: selectItem.roomId,
  //     msgUuid: msgUuid,
  //     rootMsgUuid: replyUuid,
  //   }
  //   replyMsgBinding(params).then(() => null)
  // }

  // 发送回复消息
  const sendReplyMessage = (replyData: any) => {
    if (replyData) {
      // 处理表情
      let content = dealEmojiMessage()
      // 删除回复消息截图
      content = content.replace($tools.regSpan, '').replace(/<br>/g, '\n')
      const { messageJson, msgUuid, serverTime, type: subType, fromUser } = replyData
      const obj = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
      let replyMessage: any = obj
      let rootMsgUuid: any = msgUuid
      if (Object.prototype.toString.call(obj) === '[object Object]') {
        replyMessage = obj?.content
        const originMsg = obj?.originMsg || {}
        rootMsgUuid = originMsg?.rootMsgUuid ? originMsg?.rootMsgUuid : msgUuid
      }
      if (subType === 3) {
        const { displayName } = obj
        const fileExt = displayName
          .toLowerCase()
          .split('.')
          .splice(-1)[0]
        if ($tools.imgFormatArr.includes(fileExt)) {
          // 图片消息
          replyMessage = '【图片】'
        } else {
          // 文件消息
          replyMessage = '【文件】'
        }
      } else if (subType === 4) {
        replyMessage = '【位置信息】'
      } else if (subType === 1) {
        // 普通消息
        replyMessage = messageJson
      }
      // 发送消息
      // return
      const { userId, username } = fromUser
      const value = {
        msgUuid: Maths.uuid(),
        type: 5, //消息类型（系统消息0 文字消息1 @消息2 文件消息3 地图消息4 回复消息5 分享消息6 ）
        messageJson: {
          content: content, //回复内容
          originMsg: {
            msgUuid: msgUuid, //被回复消息Id
            content: replyMessage, //被回复消息（原始消息）
            rootMsgUuid: rootMsgUuid, //取回复消息的msgUuid
            fromUser: {
              //原始消息发送人信息
              userId,
              username,
              replyTimestamp: serverTime,
            },
          },
        },
        isCollect: 0, //是否已收藏（未收藏0 已收藏1）
        isRecall: 0, //是否已撤回（未撤回0 撤回1）
        serverTime: getServerTime(),
        stamp: new Date().getTime(),
      }
      renderCommon(value)
      //更新根节点数量
      // const { messageHistory } = $store.getState()
      // for (let i = 0; i < messageHistory.length; i++) {
      //   const item = messageHistory[i]
      //   if (item.msgUuid === rootMsgUuid) {
      //     const num = messageHistory[i].commentCount || 0
      //     messageHistory[i].commentCount = num + 1
      //     break
      //   }
      // }
      // $store.dispatch({
      //   type: 'CHAT_ROOM_INFO',
      //   data: { messageHistory },
      // })
    }
  }

  // 发送截图消息
  const sendShotScreenMsg = (shortScreenArr: JQuery<HTMLElement>) => {
    const { selectItem, messageHistory, nowAccount } = $store.getState()
    $.each(shortScreenArr, async (i, item) => {
      const baseStr = $(item).attr('src') || ''
      const fileKey = $(item).attr('data-key') || ''
      const fileName = $(item).attr('data-name') || ''
      const fileSize = $(item).attr('data-size') || ''
      const timeStamp = new Date().getTime()
      // 发送消息
      const { roomId, type, roomName, roomJid, ascriptionName, ascriptionId } = selectItem
      const value = {
        msgUuid: Maths.uuid(),
        type: 3,
        isCollect: 0, //是否已收藏（未收藏0 已收藏1）
        isRecall: 0, //是否已撤回（未撤回0 撤回1）
        serverTime: getServerTime(),
        messageJson: {
          fileGUID: '', //文件的唯一标识
          companyId: ascriptionId || nowAccount, //下载文件时，根据此id获取文件Token
          officeUrl: baseStr, //PC端Office文件在线预览地址
          mobileOfficeUrl: '', //移动端Office文件在线预览地址
          downloadUrl: '', //文件地址
          imageWidth: 0, //图片宽度
          imageHeight: 0, //图片高度
          fileSize: parseInt(fileSize), //文件大小
          displayName: fileName, //文件展示名
          previewImageUrl: '', //视频第一帧图片地址（暂时还没有做这个功能）
          fileKey: fileKey,
          signType: 'shot_screen',
        },
      }
      const nickName = chatUserInfo.nickName
      // return
      const localData = {
        unreadUserList: getUnreadUserList(),
        from: nickName ? nickName : nowUser,
        fromId: nowUserId,
        fromUser: {
          userId: nowUserId,
          username: nowUser,
        },
        fromAccount: nowAccount,
        roomName: roomName,
        roomJid: roomJid,
        roomId: roomId,
        roomType: type,
        ascriptionId: ascriptionId,
        ascriptionName: ascriptionName,
        ...value,
      }
      // 添加到历史消息
      await $store.dispatch({
        type: 'CHAT_ROOM_INFO',
        data: { messageHistory: [...messageHistory, localData] },
      })
      $store.dispatch({ type: 'SET_KEEP_SCROLL', data: false })
      insertChatMsg({
        roomId: roomId,
        data: localData,
      })
      // 上传截图
      uploadScreenImg({ value, fileName, fileKey, fileSize, baseStr, localData, selectItem })
    })
    // 发送消息后清空输入框
    msgTxtRef.current.innerHTML = ''
  }

  const renderTitle = () => {
    const inputTxt = msgTxtRef.current?.innerHTML
    const newText = inputTxt
      ?.replace($tools.regLineFeed1, '')
      .replace($tools.regSpace1, '')
      .replace(/\ +/g, '')
    if (!newText) {
      return '不能发送空白信息'
    } else {
      if (!navigator.onLine) {
        return '网络连接不可用，请检查您的网络设置'
      } else {
        return ''
      }
    }
  }

  //发送消息的时间（取上一条消息的时间+1）
  const getServerTime = () => {
    const { messageHistory } = $store.getState()
    const msgLen = messageHistory.length - 1
    const nowDate = new Date().getTime()
    const _time = messageHistory.length === 0 ? nowDate : messageHistory[msgLen].serverTime

    //发消息的时间与最后一条消息的serverTime对比
    if (nowDate >= _time) {
      return nowDate
    } else {
      return messageHistory[msgLen].serverTime + 1
    }
  }

  // 发送消息到房间
  const sendMessageToRoom = (e?: any) => {
    // if (!nowSetClick) {
    //   setTimeout(function() {
    //     nowSetClick = true
    //   }, 600)
    //   return
    // } else {
    //   nowSetClick = false
    // }
    const sendTime = getServerTime()
    e?.persist()
    // 发送消息
    const inputTxt = msgTxtRef.current.innerHTML
    const newText = inputTxt
      .replace($tools.regLineFeed1, '')
      .replace($tools.regSpace1, '')
      .replace(/\ +/g, '')
    if (!newText) {
      setTips('不能发送空白信息')
      msgTxtRef.current.innerHTML = ''
      msgTxtRef.current.focus()
      return
    }
    // 清除回复的父级消息
    const { currentReplyData, selectItem } = $store.getState()
    const replyData = currentReplyData.find((item: any) => {
      return selectItem.roomId === item.roomId
    })
    if (replyData) {
      $store.dispatch({ type: 'SET_REPLY_PARENT_DATA', data: [] })
    }
    //处理表情
    let content = dealEmojiMessage()
    content = content.replace(/<br>/g, '\n')
    msgTxtRef.current.focus()
    //处理截图的消息
    const shortScreenArr = $('#msg-txt').find('img[class="holer_img"]')
    if (shortScreenArr.length !== 0) {
      // 获得消息中的文字内容
      const txtContent = content
        .replace($tools.regSpan, '')
        .replace($tools.regSpace1, '')
        .replace($tools.regLineFeed1, '')
      if (txtContent) {
        if (replyData) {
          // 发送回复消息
          sendReplyMessage(replyData)
        } else {
          // 发送普通消息
          const atList = $('#msg-txt').find('.chatAt')
          if (atList.length) {
            sendAtMessage()
          } else {
            const newContent = txtContent.replace($tools.regSpace1, '').trim()
            if (newContent) {
              const value = {
                msgUuid: Maths.uuid(),
                type: 1,
                serverTime: sendTime,
                messageJson: txtContent,
                isRecall: 0,
              }
              renderCommon(value)
            }
          }
        }
      }
      sendShotScreenMsg(shortScreenArr)
      return
    }
    //处理@消息
    const atList = $('#msg-txt').find('.chatAt')
    if (atList.length) {
      sendAtMessage()
      return
    }
    //处理回复消息
    if (replyData) {
      sendReplyMessage(replyData)
      return
    }
    // 发送普通消息
    const newContent = content.replace($tools.regSpace1, '').trim()
    if (newContent) {
      const value = {
        msgUuid: Maths.uuid(),
        type: 1,
        messageJson: content,
        serverTime: sendTime,
        isRecall: 0,
      }
      renderCommon(value)
    }
  }

  // 发送消息处理消息里面的表情
  const dealEmojiMessage = () => {
    const inputTxt = msgTxtRef.current.innerHTML
    $('#msg-txt-copy').html(inputTxt)
    replaceImg($('#msg-txt-copy'))
    const msgContent = $('#msg-txt-copy')
      .html()
      .replace(/(^\s*)|(\s*$)/g, '')
    return msgContent
  }

  const renderCommon = (value: any) => {
    const { selectItem } = $store.getState()
    // 发送消息后清空输入框
    msgTxtRef.current.innerHTML = ''
    // 添加消息到历史消息
    localUpdateMsg(value)
    // 发送消息
    sendToMessage(value, selectItem)
  }

  //选中截图方式
  const captureScreen = ({ key }: any) => {
    setCaptureType(key)
  }

  //点击截图
  const startCapture = () => {
    setVisible(false)
    navigator.clipboard.writeText('')
    setTimeout(() => {
      if (captureType === '0') {
        //直接截图，不关闭当前窗口
        ipcRenderer.send('capture-screen')
      } else {
        //截图时关闭当前窗口
        ipcRenderer.send('hideChat-and-capture-screen')
      }
    }, 250)
  }

  /***
   * 输入框换行代码
   * 光标处插入html代码，参数是String类型的html代码，例子："<p>猪头诺</p>"
   */
  const insertHtml = (html: string) => {
    const sel = window.getSelection()
    if (sel && sel?.getRangeAt && sel.rangeCount) {
      let range = sel.getRangeAt(0)
      range.deleteContents()
      const frag = document.createDocumentFragment()
      const el = document.createElement('div')
      el.innerHTML = html
      let node = undefined
      let lastNode = undefined
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node)
      }
      range.insertNode(frag)
      if (lastNode) {
        range = range.cloneRange()
        range.setStartAfter(lastNode)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }
      const div = document.getElementById('msg-txt')
      if (div) {
        div.scrollTop = div.scrollHeight
      }
    }
  }

  const insertHtmlAtCaret = (html: any) => {
    if (sel1 && sel1.getRangeAt && sel1.rangeCount) {
      const frag = document.createDocumentFragment()
      const el = document.createElement('div')
      el.innerHTML = JSON.parse(JSON.stringify(html).replace(/\\n/g, '<br>'))
      let node = undefined
      let lastNode = undefined
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node)
      }
      range1.insertNode(frag)
      if (lastNode) {
        range1 = range1.cloneRange()
        range1.setStartAfter(lastNode)
        range1.collapse(true)
        sel1.removeAllRanges()
        sel1.addRange(range1)
      }
      sel1 = window.getSelection()
      range1 = sel1.getRangeAt(0)
      const div = document.getElementById('msg-txt')
      if (div) {
        div.scrollTop = div.scrollHeight
      }
    }
  }

  const imgPaste = (e: any) => {
    const inputContext = document.getElementById('msg-txt')
    const imgEle = inputContext?.getElementsByTagName('img')
    if (imgEle && imgEle.length >= 10) {
      message.info('不能插入超过十个文件')
      return
    }
    const clipboardData = e.clipboardData
    const type = clipboardData.items[0].type
    let blob: any = ''
    if (type.match(/image/)) {
      blob = clipboardData.items[0].getAsFile()
    } else if (type.match(/text\/html/)) {
      blob = e.clipboardData.files[0]
    }
    if (blob) {
      const file = new FileReader()
      file.addEventListener('loadend', function(e: any) {
        const src = e.target.result
        const dataKey = Maths.uuid() + '.png'
        const fileSize = blob.size
        const fileName = 'holderimg_' + moment().format('YYYYMMDDHHmmss') + '.png'
        const newCon = `<span class="img_around" contenteditable="false" datasrc="${src}"><img class="holer_img" src="${src}" data-key="${dataKey}" data-name="${fileName}" data-size="${fileSize}"/></span>`
        insertHtml(newCon)
      })
      file.readAsDataURL(blob)
    }
  }

  function toTxt(str: any) {
    const RexStr = /\<|\>|\"|\'|\&/g
    const newStr = str.replace(RexStr, function(MatchStr: any) {
      switch (MatchStr) {
        case '<':
          return '&lt;'
        case '>':
          return '&gt;'
        case '"':
          return '&quot;'
        case "'":
          return '&#39;'
        case '&':
          return '&amp;'
        default:
          break
      }
    })
    return newStr
  }

  // 将图片url地址转为base64地址
  function getBase64Image(url: string, callback: (data: any) => void) {
    let canvas: any = document.createElement('canvas')
    const ctx = canvas.getContext('2d'),
      img = new Image()
    //为了解决跨域，可以直接img.crossOrigin=''就能解决图片跨域问题
    img.crossOrigin = 'xes'
    img.onload = function() {
      canvas.height = img.height
      canvas.width = img.width
      ctx.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL('image/png')
      callback.call(this, dataURL)
      canvas = null
    }
    img.src = url
  }

  const copyFromOs = (type: number) => {
    if (remote.process.platform == 'win32') {
      // windows 只读取一个文件路径
      const rawFilePath = clipboard.readBuffer('FileNameW').toString('ucs2')
      osFilePath = rawFilePath.replace(new RegExp(String.fromCharCode(0), 'g'), '')
    } else if (remote.process.platform == 'darwin') {
      // mac
      osFilePath = clipboard.read('public.file-url').replace('file://', '')
    }
    if (osFilePath) {
      fs.readFile(osFilePath, function(err: any, buffer: any) {
        if (err) {
          // message.error('文件不存在或已被清理')
        } else {
          const startIndex = osFilePath.lastIndexOf('.')
          const ext = osFilePath.substring(startIndex + 1, osFilePath.length)?.toLowerCase()
          if ($tools.imgFormatArr.includes(ext)) {
            // 图片
            const buf = Buffer.from(buffer, 'binary')
            const blob = new Blob([buf], { type: `image/${ext}` })
            const fileSize = blob.size
            const dataKey = Maths.uuid() + '.png'
            const fileName = 'holderimg_' + moment().format('YYYYMMDDHHmmss') + '.png'
            const file = new FileReader()
            file.addEventListener('loadend', function(e: any) {
              const src = e.target.result
              const newCon = `<span class="img_around" contenteditable="false" datasrc="${src}"><img class="holer_img" src="${src}" data-key="${dataKey}" data-name="${fileName}" data-size="${fileSize}"/></span>`
              if (type === 1) {
                insertHtmlAtCaret(newCon)
              } else {
                insertHtml(newCon)
              }
            })
            file.readAsDataURL(blob)
          } else {
            // 文件
          }
        }
      })
    }
  }

  //输入框粘贴内容
  const onPasteEvent = (e?: any) => {
    if (e) {
      e.persist()
      e.preventDefault()
      // 从资源管理器中复制文件到剪贴板
      copyFromOs(0)
      $('.tribute-container').addClass('hidden_container')
      if (!osFilePath) {
        try {
          const clipboardItems = e.clipboardData.items
          for (const item of clipboardItems) {
            if (item.type === 'text/plain') {
              const clipboardText = e.clipboardData.getData('text/plain')
              const text = clipboardText.replace(/(\n|\r|(\r\n)|(\u0085)|(\u2028)|(\u2029))/g, '')
              if (text) {
                const newText = toTxt(clipboardText)
                // 粘贴文本
                insertHtml(newText)
              }
            }
            if (item.type === 'text/html') {
              // 粘贴表情和图片
              const html = e.clipboardData.getData('text/html')
              const $doc = new DOMParser().parseFromString(html, 'text/html')
              const ele = $($doc).find('img')
              if (ele && ele.length) {
                const src = $(ele[0]).attr('src')
                const reg = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i
                if (src) {
                  const blob = new Blob([src], { type: 'image/png' })
                  const fileSize = blob.size
                  const dataKey = Maths.uuid() + '.png'
                  const fileName = 'holderimg_' + moment().format('YYYYMMDDHHmmss') + '.png'
                  if (reg.test(src)) {
                    // 如果是base64格式输出该base64
                    const newCon = `<span class="img_around" contenteditable="false" datasrc="${src}"><img class="holer_img" src="${src}" data-key="${dataKey}" data-name="${fileName}" data-size="${fileSize}"/></span>`
                    insertHtml(newCon)
                  } else {
                    getBase64Image(src, function(base64Img: string) {
                      const newCon = `<span class="img_around" contenteditable="false" datasrc="${base64Img}"><img class="holer_img" src="${base64Img}" data-key="${dataKey}" data-name="${fileName}" data-size="${fileSize}"/></span>`
                      insertHtml(newCon)
                    })
                  }
                }
              }
            }
            if (item.type.startsWith('image/')) {
              imgPaste(e)
            }
          }
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  const customCopyAndPaste = async (menuItem: any) => {
    switch (menuItem.key) {
      case 'copy':
        // 复制
        $('.tribute-container').addClass('hidden_container')
        navigator.clipboard.writeText(menuStatus.clipBoardContent)
        break
      case 'paste':
        // 粘贴
        // 从资源管理器中复制文件到剪贴板
        copyFromOs(1)
        $('.tribute-container').addClass('hidden_container')
        if (!osFilePath) {
          try {
            // @ts-ignore
            const clipboardItems = await navigator.clipboard.read()
            for (const item of clipboardItems) {
              for (const type of item.types) {
                if (type === 'text/plain') {
                  // 获取粘贴板内容
                  const text = await navigator.clipboard.readText()
                  if (text) {
                    //清空选中的内容
                    range1.deleteContents()
                    // 替换所选数据
                    insertHtmlAtCaret(text)
                  } else {
                    msgTxtRef.current.focus()
                    document.execCommand('paste')
                  }
                } else {
                  // 插入图片数量不能超过10
                  const inputContext = document.getElementById('msg-txt')
                  const imgEle = inputContext?.getElementsByTagName('img')
                  if (imgEle && imgEle.length >= 10) {
                    message.info('不能插入超过十个文件')
                    return
                  }
                  // const url = URL.createObjectURL(blob)
                  const blob = await item.getType(type)
                  const src = clipboard.readImage().toDataURL()
                  const fileSize = blob.size
                  const fileName = 'holderimg_' + moment().format('YYYYMMDDHHmmss') + '.png'
                  const dataKey = Maths.uuid() + '.png'
                  const newCon = `<span class="img_around" contenteditable="false" datasrc="${src}"><img class="holer_img" src="${src}" data-key="${dataKey}" data-name="${fileName}" data-size="${fileSize}"/></span>`
                  insertHtmlAtCaret(newCon)
                }
              }
            }
          } catch (err) {
            // 双击选中 ctr+c复制消息里面的图片
            msgTxtRef.current.focus()
            document.execCommand('paste')
            msgTxtRef.current.focus()
          }
        }

        break
      case 'cut':
        // 剪切
        break
      default:
        break
    }
    setMenuStatus({ rightMenuVisibe: false })
  }

  //选择表情
  const selectEmojiCallback = (value: string) => {
    const emojiUrl = $tools.asAssetsPath(`/emoji/${value}.png`)
    insertHtmlAtCaret(`<img class="emoji_icon"  data-name="${value}" src="${emojiUrl}" />`)
    // 设置滚动条位置
    const div = document.getElementById('msg-txt')
    if (div) {
      div.scrollTop = div.scrollHeight
    }
  }

  // 绑定输入框事件监听
  const changeSendVal = (e: any) => {
    e.persist()
    msgTxtRef.current.focus()
    const { selectItem } = $store.getState()
    if (selectItem.type !== 3) {
      setAtList(e)
    }
    const str = e.target.innerHTML
    const lastbr = str.substring(str.lastIndexOf('<br>'), str.length)
    const hasBr = lastbr === '<br>'
    //校验最后一个字符是否存在<br>
    if (!hasBr) {
      $('#msg-txt').append('<br/>')
      return false
    }
  }

  const setAtList = async (e: any) => {
    const innerText = e.target.innerText
    const characterDiff = new Diff()
    const d = characterDiff.diff(inputContent, innerText)
    const inputLength = innerText.length
    inputContent = innerText
    let diffValue: DiffValueProps = {
      count: 0,
      value: '',
      removed: undefined,
      added: undefined,
    }
    if (!innerText) {
      currentAtIndex = 0
    } else if (d.length !== 0) {
      // let getNewIndex = -1 //在双@@时获取diff不准
      for (let i = 0; i < d.length; i++) {
        const currentItem = d[i]
        if (currentItem.added === true || currentItem.removed === true) {
          diffValue = currentItem
          currentAtIndex = i
        }
      }
      // 得到当前输入的@是第几个
      const str = d
        .map((item: any, index: number) => {
          if (index < currentAtIndex && item.removed !== true) {
            return item.value
          }
        })
        .join('')
      if (diffValue?.added === true) {
        const value = diffValue.value || ''
        if (value.trimLeft() == '@' || value.charAt(value.length - 1) == '@') {
          currentAtIndex = str.split('@').length - 1
          // $('.tribute-container').removeClass('hidden_container')
          // setAtUsers(setData())
          // setSearchText('')
        } else {
          const data = d.filter((item: any, index: number) => {
            // return index <= currentAtIndex && item.removed !== true
            return index < currentAtIndex && item.removed !== true
          })
          // 当前输入的值在输入内容的位置
          const sum = data.reduce(function(total: number, currentValue: any) {
            return total + currentValue.count
          }, 0)
          // const sum = innerText.length
          let re = ''
          for (let i = sum; i > -1; i--) {
            if (innerText[i] === '@') {
              // 输入的姓名的长度
              re = innerText.substr(i + 1, inputLength)
              break
            }
          }
          // 过滤要@的人
          const dataResult = atList.filter((item: any) => {
            const userName = item.value
            return re && userName.indexOf(re) != -1
          })
          if (dataResult.length) {
            $('.tribute-container').removeClass('hidden_container')
          } else {
            $('.tribute-container').addClass('hidden_container')
          }
        }
      }
    }
  }

  const onKeyDownHandle = (e: any) => {
    e.persist()
    setTips('')
    if (e.keyCode == 13 && !e.ctrlKey) {
      // 回车发送消息
      e.preventDefault()
      $('.tribute-container').addClass('hidden_container')
      sendMessageToRoom()
      // if (atVisible) {
      //   setAtVisible(false)
      // }
    }
    if (e.keyCode == 13 && e.ctrlKey) {
      //ctrl+enter换行
      insertHtml('<br/>')
    }

    // ctrl + v事件
    if (e.keyCode == 86 && e.ctrlKey) {
      // const record = createRecord()
      const menuItem = { key: 'paste' }
      e.preventDefault()
      sel1 = window.getSelection()
      range1 = sel1.getRangeAt(0)
      customCopyAndPaste(menuItem)
      // record.addRecord(menuItem)
      // console.log(record)
    }

    // ctrl + c事件
    if (e.keyCode == 67 && e.ctrlKey) {
      // const menuItem = { key: 'paste' }
      e.preventDefault()
      // 获取选中的文字加图片
      const range = window.getSelection()?.getRangeAt(0)
      let docFragment: any = null
      const oDiv = document.createElement('div')
      oDiv.id = 'copy_text_content'
      if (range) {
        docFragment = range.cloneContents()
        // 将选中的htmlCopy给新建的div
        oDiv.appendChild(docFragment)
      }
      // 获取html
      const copyText = oDiv.innerHTML.replace($tools.regAtbutton, '@$3')
      // 复制
      navigator.clipboard.writeText(copyText)
    }

    // ctrl + x事件
    if (e.keyCode == 88 && e.ctrlKey) {
      // const menuItem = { key: 'paste' }
      e.preventDefault()
      // 获取选中的文字加图片
      const range = window.getSelection()?.getRangeAt(0)
      let docFragment: any = null
      const oDiv = document.createElement('div')
      oDiv.id = 'copy_text_content'
      if (range) {
        docFragment = range.cloneContents()
        // 将选中的htmlCopy给新建的div
        oDiv.appendChild(docFragment)
      }
      // 获取html
      const copyText = oDiv.innerHTML.replace($tools.regAtbutton, '@$3')
      // 复制后清空选中的内容
      document.execCommand('Delete')
      navigator.clipboard.writeText(copyText)
    }

    // shift键更新@人员列表
    if (e.shiftKey) {
      if (e.keyCode !== 50 || e.keyCode !== 229) {
        $('.tribute-container').addClass('hidden_container')
      }
    }

    // shift + @ 显示@人框
    if ((e.shiftKey && e.keyCode == 50) || (e.shiftKey && e.keyCode == 229)) {
      $('.tribute-container').removeClass('hidden_container')
    }

    // if (e.key == 'Backspace') {
    //   const ele = document.getElementById('msg-txt')
    //   const selection = getSelection()
    //   if (selection) {
    //     const range = selection.getRangeAt(0)
    //     let removeNode: any = null
    //     if (range.startOffset <= 1 && range.startContainer.parentElement?.className != 'chatAt') {
    //       // @ts-ignore
    //       removeNode = range.startContainer?.previousElementSibling
    //     }
    //     if (range.startContainer.parentElement?.className == 'chatAt') {
    //       removeNode = range.startContainer.parentElement
    //     }
    //     if (removeNode) {
    //       ele?.removeChild(removeNode)
    //     }
    //   }
    // }
  }

  // 插入表情
  let sel1: any = ''
  let range1: any = ''
  const onblurEvent = () => {
    sel1 = window.getSelection()
    range1 = sel1.getRangeAt(0)
    // $('.tribute-container').hide()
  }

  const onVisibleChange = (visible: boolean) => {
    // 获取选中的文字加图片
    const range = window.getSelection()?.getRangeAt(0)
    let docFragment: any = null
    const oDiv = document.createElement('div')
    oDiv.id = 'copy_text_content'
    if (range) {
      docFragment = range.cloneContents()
      // 将选中的htmlCopy给新建的div
      oDiv.appendChild(docFragment)
    }
    // 获取html
    const copyText = oDiv.innerHTML.replace($tools.regAtbutton, '@$3')
    const count = window.getSelection()?.rangeCount
    setMenuStatus({
      rightMenuVisibe: visible,
      clipBoardContent: count ? copyText : '',
    })
  }

  //截图菜单
  const screenShotMenu = (
    <Menu onClick={captureScreen} selectedKeys={[captureType]}>
      <Menu.Item key="0">屏幕截图(Alt+Q)</Menu.Item>
      <Menu.Item key="1">截屏时隐藏当前窗口</Menu.Item>
    </Menu>
  )

  const rightMenu = (
    <Menu onClick={customCopyAndPaste}>
      {menuStatus.clipBoardContent && <Menu.Item key="copy">复制</Menu.Item>}
      <Menu.Item key="paste">粘贴</Menu.Item>
    </Menu>
  )

  return (
    <div
      className="msg-send"
      id="msgSend"
      style={{ height: '282px' }}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
    >
      <div className="dragAbleArea" id="dragAbleArea" onMouseDown={mousedown}></div>
      <div className="send-bar">
        <div className="handle-btn-groups">
          <ChatEmoji selectEmoji={selectEmojiCallback}></ChatEmoji>
          <Upload
            multiple={true}
            showUploadList={false}
            customRequest={({ file }: any) => {
              const fileSize = file.size
              const isUp = checkFileSize(fileSize)
              if (isUp) {
                // 上传附件先保存本地
                updateLocal(file)
              }
            }}
          >
            <Button className="msg-handle-btn file_icon"></Button>
          </Upload>
          <Dropdown
            overlay={screenShotMenu}
            placement="topLeft"
            trigger={['hover']}
            onVisibleChange={() => {
              setVisible(!visible)
            }}
            visible={visible}
          >
            <Button className="msg-handle-btn screen_shot" onClick={startCapture}></Button>
          </Dropdown>
        </div>
        {/* <em
          className="search-message"
          onClick={() => {
            $tools.createWindow('ChatHistory', { createConfig: { showSidebar: false } })
          }}
        ></em> */}
      </div>
      <div className="send-content">
        <Dropdown
          trigger={['contextMenu']}
          overlay={rightMenu}
          visible={menuStatus.rightMenuVisibe}
          onVisibleChange={onVisibleChange}
        >
          <div
            id="msg-txt"
            ref={msgTxtRef}
            className="msg-txt"
            contentEditable={true}
            placeholder={'请输入讨论内容（Ctrl+Enter换行，Enter发送）'}
            // dangerouslySetInnerHTML={{ __html: defaultText }}
            onKeyDown={onKeyDownHandle}
            onInput={changeSendVal}
            onBlur={onblurEvent}
            onPaste={onPasteEvent}
          ></div>
        </Dropdown>
        <div id="msg-txt-copy" style={{ display: 'none' }}></div>
        <div className="send-btn">
          <Tooltip
            placement="top"
            title={renderTitle}
            arrowPointAtCenter
            visible={tips ? true : false}
            onVisibleChange={() => {
              setTips('')
            }}
          >
            <Button type="primary" onClick={sendMessageToRoom}>
              发送
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default React.forwardRef(ChatMsgEditor)

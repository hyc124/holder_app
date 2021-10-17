import React, { useEffect, useRef, Fragment, useState } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { ipcRenderer } from 'electron'
import NoneData from '@/src/components/none-data/none-data'
import ChatItem from './ChatItem'
import ChatItemRobot from './ChatItemRobot'
import ChatMsgEditor from './ChatMsgEditor'
import MessageReplyList from './MessageReplyList'
import { dropUploadFile } from './ChatMsgEditor'
import { updateHistoryMsg, getChatInfos } from '../getData/ChatHandle'
import {
  findLocalMsgByCachetime,
  findLocalMsgByRoom,
  findMoreLocalMsg,
  batchInsertChatMsg,
  updateChatMsg,
  insertChatMsg,
} from '../getData/ChatInputCache'
import { getHistoryMsg, queryRobotMessage, queryRobotSettingMessage, replyMsgBinding } from '../getData/getData'
import '../styles/ChatMain.less'
import { Imgscale, DragImg, reZR, CheckRes } from '@/src/components/upload-file/index'
import { Alert, Spin } from 'antd'
import { checkedHasData } from './global/common'
import { LoadingOutlined, DoubleRightOutlined, CloseOutlined } from '@ant-design/icons'
import { getImgSize } from '@/src/common/js/common'
import { useLayoutEffect } from 'react'
interface EmojiAppraiseProps {
  emoticonName: string
  chatMessageJid: string
  operateUsername: string
  createTime: number
  operateUserId: number
  id: number
  timestamp: number
}

export type userItem = {
  id: number
  chatRoomId: number
  userId: number
  enterpriseId: number
  userAccount: string
  userName: string
  nickName: string | null
  isOutsideDept: number
  memberType: number
  isOnline: number
}
interface ChatMainProps {
  atData: any
  selectItem: any
}
let pScroll: any = ''
// let keepMsgNum: any = 0
//主窗口
const ChatMain: React.FC<ChatMainProps> = ({ atData, selectItem }) => {
  const { nowUserId } = $store.getState()

  const ChatMsgEditorRef = useRef<any>(null) // 消息内容编辑框引用
  const messagesEndRef = useRef<any>(null) // 聊天室滚动到底部
  const listRef = useRef<any>(null)

  //查看更多loading
  const [loading, setLoading] = useState(false)

  // 网络提示显隐
  // const [netWorkHint, setNetWorkHint] = useState<boolean>(true)

  //切换加载消息loading
  const [mainLoading, setMainLoading] = useState(false)
  const messageHistory = useSelector((state: StoreStates) => state.messageHistory, shallowEqual) // 历史消息
  const hasMore = useSelector((state: StoreStates) => state.hasMore, shallowEqual) // 是否显示查看更多历史消息按钮
  const netWorkHint = useSelector((state: StoreStates) => state.netWorkHint, shallowEqual) //网络提示
  const keepScroll = useSelector((state: StoreStates) => state.keepScroll, shallowEqual) // 历史消息滚动条位置
  // const selectItem = useSelector((state: any) => state.selectItem, shallowEqual) // 选中列表item
  const currentReplyData = useSelector((state: StoreStates) => state.currentReplyData, shallowEqual) // 回复父级消息内容
  const [mucAssistantList, setMucAssistantList] = useState([]) // 获取设置消息提醒设置的列表

  const replyData: any = currentReplyData.find((item: any) => {
    return selectItem.roomId === item.roomId
  })
  const [keepMsgNum, setKeepMsgNum] = useState(0) //新消息数量

  /**
   * IM回执消息
   * @param data 推送的消息
   */
  const receiptMessage = (data: any) => {
    const nowMsg = data[0]
    console.log('IM回执消息nowMsg:', nowMsg, keepScroll)
    const { nowUserId, selectItem, chatUserLists } = $store.getState()
    const { roomId, type: talkType, typeId } = selectItem
    if ($tools.isJsonString(nowMsg) && nowMsg) {
      const msgContent = JSON.parse(nowMsg)
      const { msgUuid, roomId: newMsgRoomId, type: subType, isRecall, fromUser, messageJson } = msgContent

      // 回复消息(原消息与新消息绑定)
      if (subType === 5) {
        let replyMSg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
        replyMSg = $tools.isJsonString(replyMSg) ? JSON.parse(replyMSg) : replyMSg
        const { originMsg } = replyMSg || {}
        const { rootMsgUuid } = originMsg || {}
        const params = {
          roomId: roomId,
          msgUuid: msgUuid,
          rootMsgUuid: rootMsgUuid,
        }
        replyMsgBinding(params).then(() => null)
      }
      if (newMsgRoomId === roomId) {
        // 新消息在界面上没有展示过才展示(解决同一账号在不同端登录发送消息接收问题)
        const { messageHistory, keepScroll: isTop } = $store.getState()
        //滚动条未在底部则更新未读(撤回消息不进行消息统计)
        if (isTop) {
          if (isRecall !== 1 && fromUser && fromUser.userId !== nowUserId) {
            setKeepMsgNum(keepMsgNum => keepMsgNum + 1)
            const isLarg = $('.chat_main_right_bar').hasClass('width_289')
            $('.unread_prompt').css({
              right: isLarg ? '289px' : '0px',
            })
          } else {
            setKeepMsgNum(keepMsgNum => keepMsgNum - 1)
          }
        }
        const data = JSON.parse(JSON.stringify(messageHistory))
        let userList: any[] = []
        // 群聊未读列表处理
        if (talkType !== 3) {
          userList = chatUserLists
            .map(item => {
              if (item.userId !== nowUserId) {
                return item.userId
              }
            })
            .filter(s => {
              return s
            })
        } else {
          // 私聊未读消息处理
          userList = [typeId]
        }
        // 新消息拼接
        const newData = {
          ...msgContent,
          unreadUserList: userList,
          sendStatus: '2',
        }

        if (data.length) {
          try {
            // 判断当前消息是否是新消息
            const isNew = data.some((item: any) => {
              return item.msgUuid === msgUuid
            })
            // 非撤回消息处理如下
            if (!isNew) {
              // 回复消息
              if (subType === 5) {
                const replyMSg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
                const { originMsg } = replyMSg || {}
                const { rootMsgUuid } = originMsg || {}
                // 收到回复消息
                for (let i = 0; i < data.length; i++) {
                  const item = data[i]
                  if (item.msgUuid == rootMsgUuid) {
                    const num = data[i].commentCount || 0
                    data[i].commentCount = num + 1
                    break
                  }
                }
              }
              // 更新历史消息
              $store.dispatch({
                type: 'CHAT_ROOM_INFO',
                data: { messageHistory: [...data, newData] },
              })
              // 更新本地缓存
              findLocalMsgByCachetime(msgUuid).then(localData => {
                if (localData) {
                  updateChatMsg(newData)
                } else {
                  insertChatMsg({ roomId: newMsgRoomId, data: newData })
                }
              })
            } else if (isRecall === 1) {
              // 撤回消息
              data.map((item: globalInterface.ChatItemProps) => {
                if (item.msgUuid === msgUuid) {
                  item.isRecall = isRecall
                  item.fromUser = fromUser
                }
              })
              // 撤回回复消息
              if (subType === 5) {
                const replyMSg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
                const { originMsg } = replyMSg || {}
                const { rootMsgUuid } = originMsg || {}
                // 收到回复消息
                for (let i = 0; i < data.length; i++) {
                  const item = data[i]
                  if (item.msgUuid == rootMsgUuid) {
                    const num = data[i].commentCount || 0
                    data[i].commentCount = num === 0 ? num : num - 1
                    break
                  }
                }
              }
              // 更新历史消息
              $store.dispatch({
                type: 'CHAT_ROOM_INFO',
                data: { messageHistory: data },
              })
              updateChatMsg(msgContent)
            } else if (isNew) {
              const newDatas = data.map((item: { msgUuid: any; sendStatus: string }) => {
                if (item.msgUuid === msgUuid) {
                  item.sendStatus = '2'
                }
                return item
              })
              // 更新历史消息
              $store.dispatch({
                type: 'CHAT_ROOM_INFO',
                data: { messageHistory: [...newDatas] },
              })
              // 更新本地缓存
              findLocalMsgByCachetime(msgUuid).then(localData => {
                if (localData) {
                  updateChatMsg(newDatas)
                } else {
                  insertChatMsg({ roomId: newMsgRoomId, data: newDatas })
                }
              })
            }
          } catch (err) {
            console.log(err)
          }
        } else {
          $store.dispatch({
            type: 'CHAT_ROOM_INFO',
            data: { messageHistory: [newData] },
          })
          $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
          // 更新本地缓存
          // 更新本地缓存
          findLocalMsgByCachetime(msgUuid).then(localData => {
            if (localData) {
              updateChatMsg(newData)
            } else {
              insertChatMsg({ roomId: newMsgRoomId, data: newData })
            }
          })
        }
      }
    }
  }
  /**
   * 监听进入聊天室更新未读总数
   * @param data
   */
  const updateUnread = (data: any) => {
    const { userAccount, noticeContent } = data
    const {
      selectItem: { roomJid },
    } = $store.getState()
    if (userAccount && roomJid && roomJid.split('@')[0] === noticeContent) {
      let isRefresh = false
      const { messageHistory } = $store.getState()
      const data = JSON.parse(JSON.stringify(messageHistory))
      data.map((item: any) => {
        const userList = item.unreadUserList
        if (item.fromId === nowUserId && userList) {
          const index = userList.indexOf(userAccount)
          if (index !== -1) {
            isRefresh = true
            const newList = [...userList]
            newList.splice(index, 1)
            item.unreadUserList = newList
          }
        }
      })
      if (isRefresh) {
        $store.dispatch({
          type: 'CHAT_ROOM_INFO',
          data: { messageHistory: data },
        })
      }
    }
  }

  /**
   * 及时更新表态图标
   * @param nowThumbMember
   */
  const updateThumbMember = (nowThumbMember: any) => {
    const { chatMessageJid, timestamp, status, emoticonName, operateUserId } = nowThumbMember
    const { selectItem } = $store.getState()
    if (selectItem.roomJid === chatMessageJid) {
      //判断新消息是否在当前房间
      const { messageHistory } = $store.getState()
      const data = JSON.parse(JSON.stringify(messageHistory))
      data.map((item: any) => {
        if (item.time === timestamp) {
          if (item.messageEmojiAppraiseModel) {
            const thumbMember = JSON.parse($tools.htmlDecodeByRegExp(item.messageEmojiAppraiseModel))
            if (status) {
              // 新增点赞
              const isMemberExit = thumbMember.some((item: EmojiAppraiseProps) => {
                return item.emoticonName === emoticonName && item.operateUserId === operateUserId
              })
              if (!isMemberExit) {
                item.messageEmojiAppraiseModel = JSON.stringify([...thumbMember, nowThumbMember])
              }
            } else {
              // 点赞取消
              thumbMember.map((item: EmojiAppraiseProps, index: number) => {
                if (item.emoticonName === emoticonName && item.operateUserId === operateUserId) {
                  thumbMember.splice(index, 1)
                }
              })
              item.messageEmojiAppraiseModel = JSON.stringify(thumbMember)
            }
          } else {
            item.messageEmojiAppraiseModel = JSON.stringify([nowThumbMember])
          }
          // 更新本地缓存消息状态
          updateChatMsg(item)
        }
      })
      $store.dispatch({ type: 'CHAT_ROOM_INFO', data: { messageHistory: data } })
      $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
    }
  }

  /**
   * 已知晓
   * @param data
   */
  const alreadyKnow = (args: any) => {
    const pushData = JSON.parse(args.customContent)
    if (args.handle === 'handle_message_appraise') {
      const { messageHistory } = $store.getState()
      const data = JSON.parse(JSON.stringify(messageHistory))
      data.map((item: any) => {
        if (item.time === pushData.timestamp) {
          item.handleModel = pushData
        }
      })
      $store.dispatch({
        type: 'CHAT_ROOM_INFO',
        data: { messageHistory: data },
      })
    }
  }

  /**
   * 查询历史消息
   * @param dataItem
   */
  const queryLocalHistory = (dataItem: any) => {
    const selectItemId = dataItem.roomId
    setMainLoading(true)
    const pageNum = 20
    $store.dispatch({ type: 'SET_KEEP_SCROLL', data: false })
    //加载sqlite本地缓存数据
    $store.dispatch({ type: 'CHAT_ROOM_INFO', data: { messageHistory: [] } }) //请求前先清空数据
    findLocalMsgByRoom(selectItemId, pageNum).then((localData: any) => {
      //写入新消息前先清空消息
      if (localData) {
        $store.dispatch({ type: 'CHAT_ROOM_INFO', data: { messageHistory: localData || [] } })
      }
      //查询最新消息
      getHistoryMsg({
        roomId: selectItemId,
        num: pageNum,
        keywords: '',
        serverTime: null,
        roomName: dataItem.roomName,
      })
        .then((resData: any) => {
          const hasResData = resData && resData.length === 20
          const hasLocalData = localData && localData.length === 20
          const hasMore = hasResData || hasLocalData ? true : false
          $store.dispatch({ type: 'SET_HASMORE_HISTORYMESSAGE', data: hasMore })
          if (!localData) {
            // 聊天消息缓存到本地
            batchInsertChatMsg({ roomId: selectItemId, data: resData || [] })
          }
          if (resData.length) {
            // 本地不同
            const localChangeData =
              localData &&
              localData.filter((record: any) => {
                return !checkedHasData(resData, record.msgUuid)
              })
            const $data = localChangeData || []
            const errData = $data.map((item: any) => {
              if (item.sendStatus !== '-1') {
                updateChatMsg(item)
                //本地数据 发送状态为正常，但是未入库的数据
                return {
                  ...item,
                  sendStatus: '-1',
                }
              }
              return item
            })
            let data: any = []
            if (localChangeData) {
              const newData = updateHistoryMsg([...resData, ...errData])
              if (newData.length > 20) {
                data = newData.slice(newData.length - 20, newData.length)
              } else {
                data = newData
              }
            } else {
              data = resData
            }
            // 更新选中的聊天室
            $store.dispatch({
              type: 'CHAT_ROOM_INFO',
              data: { messageHistory: updateHistoryMsg(data) },
            })
            // msgCompare(localData || [], resData || [], selectItemId)
          }
          // if (dataItem.unreadCount) {
          //   //刷新工作台头部沟通红点数量
          //   ipcRenderer.send('refresh_meet_connect', ['talk_count'])
          // }
        })
        .finally(() => setMainLoading(false))
    })
  }

  // 图片预览功能
  let timer: any = null
  let count: any = 0
  const showImg = (e: any) => {
    count += 1
    timer = setTimeout(() => {
      if (count === 1) {
        Imgscale()
        DragImg()
        CheckRes()
        reZR()
        if (e.target.className === 'img_box') {
          disposeShowImg(e)
        } else if (e.target.className === 'reply_img_box') {
          disposeShowImg(e)
        }
      } else if (count === 2) {
        Imgscale()
        DragImg()
        CheckRes()
        reZR()
        if (e.target.className === 'img_box') {
          disposeShowImg(e)
        } else if (e.target.className === 'reply_img_box') {
          disposeShowImg(e)
        }
      }
      count = 0
    }, 100)
  }

  const showShotScreenImg = (e: any) => {
    Imgscale()
    DragImg()
    CheckRes()
    reZR()
    let idx = 0
    if (e.target.className === 'img_around') {
      const targetSrc = e.target.getAttribute('datasrc')
      // 所有的图片
      const editorDom = Array.from(document.getElementsByClassName('img_around'))
      // msg-txt-copy中包含的图片
      const hiddenDom = document.getElementById('msg-txt-copy')?.getElementsByClassName('img_around')
      const hiddenPngList = Array.from(hiddenDom || [])
      // 去掉msg-text-copy的img
      const previewImg = editorDom.filter((item: any) => {
        return !hiddenPngList.some(item_ => item_ === item)
      })
      const arr = []
      for (let i = 0; i < previewImg.length; i++) {
        const src = previewImg[i].getAttribute('datasrc')
        if (targetSrc === src) {
          idx = i
        }
        const _parent = jQuery(previewImg[i]).parent()
        const pId = jQuery(_parent).attr('id')
        if (pId != 'msg-txt-copy') {
          arr.push(src || '')
        }
      }
      // getImgSize(url).then(res => {
      // const imgWidthH = res
      $store.dispatch({
        type: 'SET_FILE_OBJ',
        data: {
          imgWidthH: { width: 910, height: 610 },
          fromType: 'chatWinRichText',
          dir: 'im',
          fileType: 'img',
          fileList: arr,
          photoIndexKey: idx,
        },
      })

      $tools.createWindow('fileWindow')
      // })
    }
  }
  // 公共处理预览图片数据的方法
  const disposeShowImg = (e: any) => {
    const targetSrc = e.target.getAttribute('datasrc')

    if (targetSrc && targetSrc != 'undefined') {
      let idx = 0
      let url = ''
      const { messageHistory } = $store.getState()
      const imgList: any[] = []
      messageHistory.map((item: any) => {
        if (item.type == 3) {
          const $msgImg = $tools.isJsonString(item.messageJson)
            ? JSON.parse(item.messageJson)
            : item.messageJson
          const items = {
            ...$msgImg,
            fileKey: $msgImg.fileGUID,
          }
          imgList.push(items)
        }
      })
      imgList.map(item => {
        if (item.officeUrl == targetSrc) {
          idx = item.fileKey
          url = item.officeUrl
        }
      })

      getImgSize(url).then(res => {
        const imgWidthH = res
        $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
        $store.dispatch({
          type: 'SET_FILE_OBJ',
          data: {
            imgWidthH,
            fromType: 'chatwin',
            dir: 'im',
            fileType: 'img',
            fileList: imgList,
            photoIndexKey: idx,
          },
        })

        $tools.createWindow('fileWindow')
      })
    }
  }

  // 获取历史聊天记录
  const queryHistoricalData = () => {
    if (selectItem.type === 7) {
      // 查询消息助手历史消息
      queryRobotMessage({
        pageNo: 0,
        size: 8,
        userId: nowUserId,
        mucRelationId: selectItem.roomId,
      }).then((resData: any) => {
        const hasMore = resData.length === 8 ? true : false
        $store.dispatch({
          type: 'CHAT_ROOM_INFO',
          data: { messageHistory: resData },
        })
        $store.dispatch({ type: 'SET_HASMORE_HISTORYMESSAGE', data: hasMore })
        $store.dispatch({ type: 'SET_KEEP_SCROLL', data: false })
      })
      // 获取消息提醒设置的列表
      queryRobotSettingMessage({
        userId: nowUserId,
        mucRelationId: selectItem.roomId,
      }).then((resData: any) => {
        setMucAssistantList(resData)
      })
    } else {
      // 查询历史消息本地缓存
      queryLocalHistory(selectItem)
    }
  }

  // 拖拽上传附件
  const onDrop = (e: any) => {
    const fileList = e.dataTransfer.files //获取文件对象
    //检测是否是拖拽文件到页面的操作
    if (fileList.length == 0) {
      return false
    } else {
      dropUploadFile(fileList)
    }
    return false
  }
  const onDragOver = (e: any) => {
    e.preventDefault()
  }

  // 聚焦回复框
  const focusReplyBox = () => {
    ChatMsgEditorRef.current.focusBox()
  }

  // 数据去重
  const cancleRepeat = (data: any) => {
    // console.log('data的数据', data)
    const obj: any = {}
    return data.reduce(function(item: any, next: any) {
      obj[next.msgUuid] ? '' : (obj[next.msgUuid] = true && item.push(next))
      return item
    }, [])
  }
  /**
   * 清空回复信息
   */
  const emptyReplayData = () => {
    $store.dispatch({ type: 'SET_REPLY_PARENT_DATA', data: [] })
  }

  // 查看更多历史消息
  const lookMoreMsg = () => {
    const { messageHistory, selectItem } = $store.getState()
    const searchTime = messageHistory[0]?.serverTime
    $('.chat-item').each(function(i, item) {
      const itemTime = $(item).attr('data-time')
      if (itemTime === String(searchTime)) {
        pScroll = item
      }
    })
    const pageNum = 20
    const params = {
      roomId: selectItem.roomId,
      keywords: '',
      num: pageNum,
      serverTime: searchTime,
    }
    setLoading(true)
    findMoreLocalMsg(selectItem.roomId, pageNum, searchTime).then((localData: any) => {
      // 设置滚动条位置
      if (pScroll) {
        $('#chat_msg_list_container').scrollTop(50)
      } else {
        const msgelement = $('.chat_msg_list_container')
        $('#chat_msg_list_container').scrollTop(msgelement[0].scrollHeight)
      }
      getHistoryMsg(params)
        .then((resData: any) => {
          if (resData && resData.length) {
            // 本地不同
            const localChangeData =
              localData &&
              localData.filter((record: any) => {
                return !checkedHasData(resData, record.msgUuid)
              })
            let data: any = []
            if (localChangeData) {
              const errData = localData.filter((item: any) => item.sendStatus === '-1')
              data = updateHistoryMsg([...resData, ...errData])
              // 每次加载20条
              data = data.slice(0, 20)
            } else {
              data = resData
            }
            // 接口返回不同
            const interfaceData =
              resData &&
              resData.filter((record: any) => {
                return !checkedHasData(resData, record.msgUuid)
              })
            if (interfaceData && interfaceData.length) {
              // 更新本地缓存
              batchInsertChatMsg({ roomId: selectItem.roomId, data: interfaceData || [] })
            }
            // 更新界面历史消息、本地缓存
            const hasMore = data && data.length === 20 ? true : false
            const newData = cancleRepeat(data.concat(messageHistory))
            // 更新选中的聊天室
            $store.dispatch({
              type: 'CHAT_ROOM_INFO',
              data: { messageHistory: updateHistoryMsg(newData) },
            })
            $store.dispatch({ type: 'SET_HASMORE_HISTORYMESSAGE', data: hasMore })
            $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
          } else {
            if (localData && localData.length) {
              const hasMore = localData && localData.length === 20 ? true : false
              // 保证数据不会重复
              const newData = cancleRepeat(localData.concat(messageHistory))
              // 如果接口报错，走本地缓存
              $store.dispatch({
                type: 'CHAT_ROOM_INFO',
                data: { messageHistory: updateHistoryMsg(newData) },
              })
              $store.dispatch({ type: 'SET_HASMORE_HISTORYMESSAGE', data: hasMore })
              $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
            } else {
              $store.dispatch({ type: 'SET_HASMORE_HISTORYMESSAGE', data: false })
            }
          }
        })
        .catch(() => {
          if (localData) {
            const hasMore = localData && localData.length === 20 ? true : false
            const newData = cancleRepeat(localData.concat(messageHistory))
            // 如果接口报错，走本地缓存
            $store.dispatch({
              type: 'CHAT_ROOM_INFO',
              data: { messageHistory: updateHistoryMsg(newData) },
            })
            $store.dispatch({ type: 'SET_HASMORE_HISTORYMESSAGE', data: hasMore })
            $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
          } else {
            $store.dispatch({ type: 'SET_HASMORE_HISTORYMESSAGE', data: false })
          }
        })
        .finally(() => {
          setLoading(false)
        })
    })
  }

  // 断网重连数据库
  const connectedMsg = () => {
    const { messageHistory, selectItem, keepScroll } = $store.getState()
    if (messageHistory && messageHistory.length) {
      const msgLen = messageHistory.length
      const searchTime = messageHistory[msgLen - 1]?.serverTime
      const params = {
        roomId: selectItem.roomId,
        keywords: '',
        num: 0,
        serverTime: searchTime,
        laterMsgSize: -1,
      }
      // setMainLoading(true)
      getHistoryMsg(params)
        .then((resData: any) => {
          const dataLen = resData.length
          if (resData && dataLen) {
            if (keepScroll) {
              for (let i = 0; i < dataLen - 1; i++) {
                if (resData[i].isRecall == 1) {
                  setKeepMsgNum(keepMsgNum => (keepMsgNum === 0 ? 0 : keepMsgNum - 1))
                } else {
                  setKeepMsgNum(keepMsgNum => keepMsgNum + 1)
                }
              }
            }
            const newData = cancleRepeat(resData.concat(messageHistory))
            $store.dispatch({
              type: 'CHAT_ROOM_INFO',
              data: { messageHistory: updateHistoryMsg(newData) },
            })
          }
        })
        .finally(() => {
          $store.dispatch({ type: 'SET_NETWORK_TIP', data: { status: false } })
        })
    }
  }

  // 断网后展示文字提示
  const connectedError = () => {
    const networkStatus = window.navigator.onLine
    const networkText = networkStatus ? '聊天服务连接中.....' : '当前网络不可用，请检查你的网络设置'
    const target = {
      status: true,
      networkText: networkText,
    }
    $store.dispatch({ type: 'SET_NETWORK_TIP', data: target })
  }

  // 有新消息时更新数据
  useEffect(() => {
    let isUnmounted = false
    if (!isUnmounted) {
      // 发送消息IM回执~~~
      ipcRenderer.on('set_now_msg', (_E, _data) => {
        receiptMessage(_data)
      })

      // 断网重连
      ipcRenderer.on('connected_now_msg', () => {
        connectedMsg()
      })

      // xmpp连接异常
      ipcRenderer.on('connected_error', () => {
        connectedError()
      })

      // 监听进入聊天室更新未读总数
      ipcRenderer.on('enter_room_userinfo', (_E, _data) => {
        return
        updateUnread(_data)
      })

      // 及时更新表态图标
      ipcRenderer.on('take_icon_stand', (_e, nowThumbMember) => {
        return
        updateThumbMember(nowThumbMember)
      })
      // 已知晓
      ipcRenderer.on('onAndoffLine_info', (_e, args) => {
        return
        alreadyKnow(args)
      })
      // 图片预览事件绑定
      const ele = document.getElementById('chat_main_container')
      ele?.addEventListener('click', showImg)
      ele?.addEventListener('dblclick', showShotScreenImg)
    }

    return () => {
      ipcRenderer.removeAllListeners('set_now_msg')
      ipcRenderer.removeAllListeners('enter_room_userinfo')
      ipcRenderer.removeAllListeners('take_icon_stand')
      ipcRenderer.removeAllListeners('onAndoffLine_info')
      ipcRenderer.removeAllListeners('connected_now_msg')
      ipcRenderer.removeAllListeners('connected_error')
      window.removeEventListener('click', showImg)
      window.removeEventListener('dblclick', showShotScreenImg)
      clearTimeout(timer)
      isUnmounted = true
    }
  }, [])

  useEffect(() => {
    let isUnmounted = false
    if (!isUnmounted) {
      setKeepMsgNum(0)
      console.log('查询消息~~~~~')
      queryHistoricalData()
    }
    return () => {
      isUnmounted = true
    }
  }, [selectItem.roomId])

  useLayoutEffect(() => {
    if (!keepScroll) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView(false, {
          behavior: 'smooth',
        })
      }, 200)
      return () => {
        clearTimeout(timer)
      }
    }
  })

  const onScroll = () => {
    const scrollTop = listRef.current.scrollTop
    const scrollHeight = listRef.current.scrollHeight
    const domHeight = $(listRef.current).height()
    if (scrollTop + domHeight + 1 >= scrollHeight) {
      setKeepMsgNum(0)
      $store.dispatch({ type: 'SET_KEEP_SCROLL', data: false })
    } else {
      $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
    }
  }

  const lookNewMsg = () => {
    $store.dispatch({ type: 'SET_KEEP_SCROLL', data: false })
    setKeepMsgNum(0)
  }
  /* 聊天室详情：消息主体 */
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />
  return (
    <div className="chat_main_conatainer flex" id="chat_main_container">
      <div className="chat_main_area flex column flex-1" id="chat_main_area">
        {netWorkHint?.status && (
          <div className="top_network_tip">
            <img src="../../../../../assets/images/chatWin/警告.png" alt="" />
            <span className="network_tip_text">{netWorkHint?.networkText}</span>
          </div>
        )}
        <div
          className="chat_msg_list_container flex-1"
          id="chat_msg_list_container"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onScroll={onScroll}
          ref={listRef}
        >
          <Spin spinning={mainLoading} size="small">
            {messageHistory.length > 0 &&
              !loading &&
              (hasMore ? (
                <label className="look_more_msg" onClick={lookMoreMsg}>
                  <span></span>查看更多消息
                </label>
              ) : (
                <label className="no_more_msg">
                  <span></span>没有更多消息了
                </label>
              ))}
            {messageHistory.length > 0 && (
              <Fragment>
                {messageHistory.map((item: globalInterface.ChatItemProps) => {
                  if (item.type !== 8) {
                    return <ChatItem focusReplyBox={focusReplyBox} key={item.msgUuid} showContent={item} />
                  } else {
                    return (
                      <ChatItemRobot
                        key={item.msgUuid}
                        data={item}
                        showContent={item}
                        getRobotMessageList={queryHistoricalData}
                        mucAssistantList={mucAssistantList}
                      />
                    )
                  }
                })}
                <div className="msgEndRef" ref={messagesEndRef} />
              </Fragment>
            )}
            {!messageHistory.length && (
              <NoneData showTxt="暂无沟通内容" imgSrc={$tools.asAssetsPath('/images/common/none_data.png')} />
            )}
            {loading && (
              <div className="spin_container">
                <Spin indicator={antIcon} />
              </div>
            )}
          </Spin>
        </div>
        {keepMsgNum > 0 && (
          <div className="unread_prompt" onClick={lookNewMsg}>
            <DoubleRightOutlined />
            <span className="num">{keepMsgNum}条新消息</span>
            <CloseOutlined
              onClick={e => {
                e.stopPropagation()
                setKeepMsgNum(0)
              }}
            />
          </div>
        )}

        {replyData && (
          <div className="replyMsgContent" id="replyMsgContent">
            <span></span>
            <span>
              <div className="fromUser">{replyData.fromUser?.username}</div>
              <div
                className="title-content"
                dangerouslySetInnerHTML={{
                  __html: getChatInfos(JSON.stringify(replyData), 'reply')?.msg,
                }}
              ></div>
            </span>
            <i onClick={emptyReplayData}></i>
          </div>
        )}
        {/* 聊天输入框 */}
        {selectItem.type !== 7 && <ChatMsgEditor ref={ChatMsgEditorRef} msgData={atData} />}
      </div>
      {/* 回复消息模态框 */}
      <MessageReplyList messageHistory={messageHistory} />
    </div>
  )
}

export default ChatMain

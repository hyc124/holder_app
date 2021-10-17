import React, { useState, useEffect } from 'react'
import { Avatar, Popover, Tabs, Dropdown, message as msg, Spin } from 'antd'
import { ipcRenderer } from 'electron'
import moment from 'moment'
import $c from 'classnames'
import { useMergeState } from '../chatwin'
import { anewSendMsgFn } from './ChatMsgEditor'
import LikeIcons from '@/src/components/chat-emoji/chat-like-icons'
import ChatForwardModal from '@/src/components/chat-forward-modal'
import { downloadFile } from '@/src/components/download-footer/downloadFile'
import { PreviewModal } from '@/src/components/upload-file/index'
import 'react-photo-view/dist/index.css'
import '../styles/ChatItem.less'
import {
  readMessageList,
  recallMsg,
  saveEmojiAppraise,
  updateThumbMember,
  suffix,
  queryPersons,
  checkIn,
} from './global/common'
import ThumbMember from './global/thumbs'
// import RenderMapMessage from './global/RenderMapMessage'
import MenuToolHandel from './global/MenuToolHandel'
// import ReplyMessage from './global/ReplyMessage'
import RenderQuoteMsg from './global/RenderQuoteMsg'
// import RenderAtMessage from './global/RenderAtMessage'
// import GeneralMessage from './global/GeneralMessage'
import {
  batchInsertChatRoom,
  deleteChatMsg,
  queryCacheProfile,
  updateChatMsg,
  updateChatRoom,
} from '../getData/ChatInputCache'
import { queryListData, updateWindowState } from '../getData/getData'
import ApplyAttachment from './global/ApplyAttachment'
import QuickComm from './QuickComm'
import { useSelector } from 'react-redux'
import MapMessage from './MapMessage'
import { getLocalRoomData } from '../../myWorkDesk/chat/ChatList'
import { LoadingOutlined } from '@ant-design/icons'
const { TabPane } = Tabs
const antIcon = <LoadingOutlined style={{ fontSize: 16, position: 'absolute', left: '-25px' }} spin />

let range: any = ''
let selection: any = ''
interface NewChatItemProps {
  showContent: any
  focusReplyBox: any
}

interface ForwardProps {
  id: number
  type: number
  userId: number
  profile: string
  name: string
}

export type Event = React.MouseEvent<HTMLDivElement, MouseEvent>

//聊天消息组件
const NewChatItem: React.FC<NewChatItemProps> = ({ showContent, focusReplyBox }) => {
  // 基本信息
  const { nowUserId, nowAccount, nowUser, userInfo, selectItem } = $store.getState()
  const { type, serverTime, fromUser, sendStatus, roomId, commentCount, isRecall } = showContent
  const _fromUser = $tools.isJsonString(fromUser) ? JSON.parse(fromUser) : fromUser
  // 更多下拉菜单显示隐藏
  const [dropMenuVisible, setDropmenuVisible] = useState(false)
  // 点赞图标显示隐藏
  const [emojiVisible, setEmojiVisible] = useState(false)
  //是否撤回
  const [recall, setRecall] = useMergeState({
    isRecall: 0,
    fromUser: {},
  })
  //表情包
  const [thumbMember, setThumbMember] = useState<any>([])
  // 已知晓、已读未读相关
  const [userNumber, setUserNumber] = useMergeState({
    knownState: false,
    knownData: {
      mucId: '',
      totalCount: 0, // @总人数
      timestamp: 0,
      handleCount: 0, // 已知晓数量
    },
    konwnUser: { knowUsers: [], unKnowUsers: [] }, // 点击查看的已知晓未知晓列表
    readObj: { readPersonList: [], unReadPersonList: [] }, // 点击查看的已读未读列表
  })
  // 操作按钮状态
  const [menuStatus, setMenuStatus] = useMergeState({
    menuVisible: false, // 控制hover菜单显示隐藏
    rightMenuVisibe: false, // 控制右键菜单显示隐藏
    clipBoardContent: '',
  })
  // 引用消息详情相关
  const [msgDetails, setMsgDetails] = useMergeState({
    chatFarwardPop: { visible: false, chatFarwardMsg: '', chatFarward: [] }, //审批转发相关
  })
  // 文件预览
  const [fileModal, setFileModal] = useMergeState({
    fileVisible: false,
    fileName: '',
    fileKey: 0,
    fileSize: 0,
    dir: '',
    uploadUser: '',
    uploadDate: '',
  })
  //profile头像
  const [userProfile, setUserProfile] = useState<any>('')

  useEffect(() => {
    const thumbMember = updateThumbMember(showContent) || []
    setThumbMember(thumbMember)
    setRecall({
      isRecall,
      fromUser,
    })
    if (selectItem.type === 3) {
      //私聊直接从左侧选中获取
      setUserProfile(selectItem?.profile || null)
    } else {
      //群聊从缓存查询头像
      if (_fromUser?.userId) {
        queryCacheProfile(_fromUser?.userId).then((profile: any) => {
          setUserProfile(profile)
        })
      }
    }
  }, [showContent])

  //查询已读未读列表
  const getUnReadList = () => {
    readMessageList({
      muc: showContent.roomJid,
      userAccount: nowAccount.replace('@', ''),
      time: showContent.serverTime,
    }).then((data: any) => {
      setUserNumber({ readObj: data.obj })
    })
  }

  const handleSelectEmoji = (key: string, value?: any) => {
    const { serverTime, roomJid } = showContent
    const params = {
      operateUserId: nowUserId,
      operateUsername: nowUser,
      emoticonName: key,
      timestamp: serverTime,
      chatMessageJid: roomJid,
    }
    const allEmoji = !!thumbMember.length ? JSON.stringify(thumbMember) : null
    let data = [...thumbMember, ...[params]]
    let urlSuffix = 'save'
    if (allEmoji) {
      const emojiModal = JSON.parse($tools.htmlDecodeByRegExp(allEmoji))
      if (emojiModal) {
        emojiModal.map((item: globalInterface.EmojiAppraiseProps) => {
          const eqalUserId = item.operateUserId === nowUserId
          const eqalKey = item.emoticonName === key
          const $userName = item.operateUsername.includes(params.operateUsername)
          const $hasDot = item.operateUsername.indexOf('、') !== -1
          if (eqalUserId && eqalKey) {
            urlSuffix = 'cancel'
            //把key相同的表情全部移除
            data = data.filter((item: any) => item.emoticonName !== key)
          }
          //情况二
          if (eqalKey && $userName && $hasDot) {
            urlSuffix = 'cancel'
            //移除新增的表情
            const newArr = []
            for (let i = 0; i < data.length; i++) {
              const $hasId = data[i].hasOwnProperty('id')
              if ($hasId || (!$hasId && data[i].emoticonName !== key)) {
                newArr.push(data[i])
              }
            }
            data = newArr.map(($item: any) => {
              if ($item.emoticonName === key && $item.hasOwnProperty('id')) {
                const newName = $item.operateUsername.replace(`、${params.operateUsername}`, '')
                return {
                  ...item,
                  operateUsername: newName,
                }
              }
              return $item
            })
          }
        })
      }
    }
    //保存新设置的表情
    saveEmojiAppraise(urlSuffix, value ? value : params)
    const $data = !!data.length ? updateThumbMember(showContent, JSON.stringify(data)) : []
    setThumbMember($data)
  }

  // 双击选中当前div文本
  const handleSelectText = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | any) => {
    if (showContent.type !== 3) {
      selection = window.getSelection()
      if (showContent.type === 4) {
        return
      }
      if (selection) {
        if (showContent.type === 5 || showContent.type === 2) {
          const rangeEle = function(ele: any) {
            selection.removeAllRanges()
            range = document.createRange()
            range.selectNodeContents($(ele)[0]) // 需要选中的dom节点
            selection.addRange(range)
            setMenuStatus({ clipBoardContent: $(ele)[0].innerText })
          }
          const chatItem = $('.chat-item')
          $.each(chatItem, async (i, item) => {
            const time = $(item).attr('data-time')
            if (Number(time) === showContent.serverTime) {
              const ele = $(item).find(`.${showContent.type === 2 ? 'chatAtBox' : 'msgTextContent'}`)
              if (showContent.type === 2) {
                if (ele && $(ele).length > 0) {
                  rangeEle(ele)
                }
              } else {
                rangeEle(ele)
              }
            }
          })
          return
        }
        selection.removeAllRanges()
        range = document.createRange()
        range.selectNodeContents(e.target) // 需要选中的dom节点
        selection.addRange(range)
        setMenuStatus({ clipBoardContent: e.target.innerText })
      }
    }
  }

  // 右键点击
  const contextMenuEvent = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | any) => {
    // 如果有光标移动后选中的内容不要覆盖
    const selection = window.getSelection()?.toString()
    if (selection) {
      setMenuStatus({ clipBoardContent: selection })
    } else {
      handleSelectText(e)
    }
  }

  const renderPictureMessage = (newCon: string, isReply?: boolean) => {
    const $str = !!isReply
      ? newCon
          ?.replace($tools.regHttps, function(item: any) {
            if (item.startsWith('http://') || item.startsWith('https://')) {
              return `<a href='${item}' target="_blank">${item}</a>`
            } else if (item.startsWith('www.') && (item.endsWith('.com') || item.endsWith('.cn'))) {
              return `<a href='https://${item}' target="_blank">${item}</a>`
            } else {
              return item
            }
          })
          .replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
          .replace($tools.regCharacter, '')
          .replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
          .replace($tools.regImg, '<span class="img_box" datasrc="$1"><img src="$1" /></span>')
          .replace($tools.regLineFeed, '<br/>')
          ?.replace($tools.regSpace1, '  ')
      : newCon
          .replace($tools.regImg, '<span class="img_box" datasrc="$1"><img src="$1" /></span>')
          .replace($tools.regLineFeed, '<br/>')
          ?.replace($tools.regSpace1, '  ')
    return (
      <div className="" style={{ position: 'relative' }}>
        <div
          className="msgTextContent"
          onDoubleClick={handleSelectText}
          onContextMenu={contextMenuEvent}
          dangerouslySetInnerHTML={{ __html: $str }}
        ></div>
      </div>
    )
  }
  //查询成员列表
  const findKnowPersons = () => {
    queryPersons({
      timestamp: showContent.sendTime,
      muc: showContent.roomJid,
    }).then((data: any) => {
      setUserNumber({ konwnUser: data.data })
    })
  }
  // @消息已知晓未知晓人员气泡列表
  const konwnPopoverTab = () => {
    const { knowUsers, unKnowUsers } = userNumber.konwnUser
    return (
      <Tabs className="unread-tabs known-list-pop" defaultActiveKey="1">
        <TabPane tab="消息接收人列表" key="1" className="known-list-box">
          <div className="list_title">
            <div className="title unKnownTit">
              <span className="count">{(unKnowUsers && unKnowUsers.length) || 0}</span>
              <span>人未知晓</span>
            </div>
            <div className="title">
              <span className="count">{(knowUsers && knowUsers.length) || 0}</span>
              <span>人已知晓</span>
            </div>
          </div>
          <div className="list_content">
            <div className="left-list">
              {unKnowUsers &&
                unKnowUsers.length > 0 &&
                unKnowUsers.map((item: any) => (
                  <div className="listItem" key={item.id}>
                    <Avatar className="oa-avatar" src={item.profile}>
                      {item.username && item.username.substr(-2, 2)}
                    </Avatar>
                    <span>{item.username && item.username.substr(0, 4)}</span>
                  </div>
                ))}
            </div>
            <div className="right-list">
              {knowUsers &&
                knowUsers.length > 0 &&
                knowUsers.map((item: any) => (
                  <div className="listItem" key={item.id}>
                    <Avatar className="oa-avatar" src={item.profile} key={item.id}>
                      {item.username && item.username.substr(-2, 2)}
                    </Avatar>
                    <span>{item.username && item.username.substr(0, 4)}</span>
                  </div>
                ))}
            </div>
          </div>
        </TabPane>
      </Tabs>
    )
  }

  /**
   * 消息渲染（系统0 文字1 艾特2 文件3 地图4 回复5 分享6 ）
   * @param showContent
   * @returns JSX
   */
  const renderMsgContent = (showContent: any) => {
    const { messageJson: msgJson, type, sendStatus, process, spareContent, fromUser, handleModel } = showContent
    const $msg = $tools.isJsonString(msgJson) ? JSON.parse(msgJson) : msgJson
    const $messageJson: any = type === 1 ? msgJson : $msg
    if (type === 1 || type === 3) {
      const { selectItem } = $store.getState()
      const { displayName, fileGUID, fileUrl, downloadUrl, officeUrl } = $messageJson
      let $newCon = ''
      if (type === 3) {
        /* 文件类型消息 */
        const $suffix = suffix(displayName)
        if ($tools.imgFormatArr.includes($suffix)) {
          // 图片消息
          const $imgDom = `<img className="img-around" src="${sendStatus === '-1' ? fileUrl : officeUrl}"/>`
          return renderPictureMessage($imgDom)
        } else {
          // 其他文件消息
          return (
            <ApplyAttachment
              attachParam={{
                sendstate: sendStatus,
                name: displayName,
                process: process,
                fileGUID: fileGUID || '',
                downloadUrl: downloadUrl,
                officeUrl: officeUrl,
              }}
            />
          )
        }
      } else {
        // 普通消息
        $newCon = $messageJson
          ?.toString()
          ?.replace($tools.regSpace1, '  ')
          ?.replace($tools.regCharacter, '')
          ?.replace($tools.regHttps, function(item: any) {
            if (item.startsWith('http://') || item.startsWith('https://')) {
              return `<a href='${item}' target="_blank">${item}</a>`
            } else if (item.startsWith('www.') && (item.endsWith('.com') || item.endsWith('.cn'))) {
              return `<a href='https://${item}' target="_blank">${item}</a>`
            } else {
              return item
            }
          })
          ?.replace($tools.regEmoji, function(_: string, regStr: any) {
            return `<img class="emoji_icon" src="${$tools.asAssetsPath(`/emoji/${regStr}.png`)}">`
          })
        if (selectItem.type !== 3) {
          // 不是私聊才区分高亮显示@消息
          $newCon = $newCon.replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
        }
      }
      return <div className="ordinary_message">{renderPictureMessage($newCon || '')}</div>
    } else if (type === 2) {
      const { userId: fromId } = fromUser
      const { atUserIdList, content: message } = $messageJson
      if (showContent.signType === 'forward') {
        // 转发的@消息做普通消息处理
        const newCon = message
          .replace($tools.regCharacter, '')
          .replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
        return <div className="ordinary_message">{renderPictureMessage(newCon || '')}</div>
      } else {
        // @消息
        const newArr = atUserIdList
        let newCon = ''
        if (checkIn(newArr) && Number(fromId) !== Number(nowUserId)) {
          // 别人@自己
          newCon = message
            ?.replace($tools.regHttps, function(item: any) {
              if (item.startsWith('http://') || item.startsWith('https://')) {
                return `<a href='${item}' target="_blank">${item}</a>`
              } else if (item.startsWith('www.') && (item.endsWith('.com') || item.endsWith('.cn'))) {
                return `<a href='https://${item}' target="_blank">${item}</a>`
              } else {
                return item
              }
            })
            ?.replace(/&amp;/g, '&')
            ?.replace($tools.regSpace1, '  ')
            ?.replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
            ?.replace($tools.regCharacter, '')
            ?.replace($tools.regEmoji, function(_: string, regStr: any) {
              const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
              return `<img class="emoji_icon" src="${imgUrl}">`
            })
          const newContdata1 = newCon.replace(
            $tools.regImg,
            '<span class="img_box" datasrc="$1"><img src="$1" /></span>'
          )
          return (
            <div className="know-wrap" onContextMenu={contextMenuEvent}>
              <div className="chatAtBox" dangerouslySetInnerHTML={{ __html: newContdata1 }}></div>
              {/* <div className="btn-box">
                <QuickComm dataItem={showContent} />
              </div> */}
            </div>
          )
        } else if (selectItem.talkType === 3 || (checkIn(newArr) && Number(fromId) === Number(nowUserId))) {
          // 自己@自己、私聊他当普通消息处理
          newCon = message
            .replace(/&amp;/g, '&')
            .replace($tools.regAtUser, '<span>@$1</span>')
            .replace($tools.regCharacter, '')
            .replace($tools.regEmoji, function(_: string, regStr: any) {
              const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
              return `<img class="emoji_icon" src="${imgUrl}">`
            })
          return <div className="ordinary_message">{renderPictureMessage(newCon || '')}</div>
        } else {
          // 自己@别人
          newCon = message
            ?.replace($tools.regHttps, function(item: any) {
              if (item.startsWith('http://') || item.startsWith('https://')) {
                return `<a href='${item}' target="_blank">${item}</a>`
              } else if (item.startsWith('www.') && (item.endsWith('.com') || item.endsWith('.cn'))) {
                return `<a href='https://${item}' target="_blank">${item}</a>`
              } else {
                return item
              }
            })
            .replace(/&amp;/g, '&')
            .replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
            .replace($tools.regCharacter, '')
            .replace($tools.regEmoji, function(_: string, regStr: any) {
              const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
              return `<img class="emoji_icon" src="${imgUrl}">`
            })
        }
        return (
          <div className="" id="message-info">
            {renderPictureMessage(newCon || '')}
            {/* {fromId === nowUserId && (
              <Popover
                content={konwnPopoverTab}
                getPopupContainer={(): any => document.getElementById('message-info')}
                title={null}
                trigger={'click'}
                arrowPointAtCenter={false}
                onVisibleChange={findKnowPersons}
                placement="topRight"
              >
                <div>
                  <span className="isKnownUser">
                    {handleModel ? handleModel.handleCount : 0} /
                    {handleModel ? handleModel.totalCount : spareContent?.split(',').length}
                    已知晓
                  </span>
                </div>
              </Popover>
            )} */}
          </div>
        )
      }
    } else if (type === 6) {
      // 引用消息(分享消息)
      return <RenderQuoteMsg quoteMsg={showContent} />
    } else if (type === 4) {
      // 地图消息
      return <MapMessage showContent={showContent} contextMenuEvent={contextMenuEvent} mapMsg={$messageJson} />
    } else if (showContent.type === 5) {
      // 回复的消息
      let replyMsgObj = $tools.isJsonString($messageJson) ? JSON.parse($messageJson) : $messageJson
      replyMsgObj = $tools.isJsonString(replyMsgObj) ? JSON.parse(replyMsgObj) : replyMsgObj
      const { originMsg } = replyMsgObj || {}
      const { content: replyMsg, fromUser, msgUuid, rootMsgUuid } = originMsg || {}
      const { replyTimestamp, username } = fromUser || {}
      let replyNewCont = ''
      if (!!replyMsg) {
        replyNewCont = String(replyMsg)
          ?.replace(/&amp;/gm, '&')
          ?.replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
          ?.replace($tools.regCharacter, '')
          ?.replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
          ?.replace($tools.regImg, '<span class="img_box" datasrc="$1"><img src="$1" /></span>')
          ?.replace($tools.regLineFeed, '<br/>')
      }

      return (
        <div className="reply-message-info" onContextMenu={contextMenuEvent}>
          {replyMsgObj && (
            <div
              className="reply"
              onClick={(e: any) => {
                e.stopPropagation()
                $store.dispatch({
                  type: 'SET_REPLY_MODAL_DATA',
                  data: {
                    visible: true,
                    timestamp: replyTimestamp,
                    roomId: roomId,
                    rootMsgUuid: rootMsgUuid ? rootMsgUuid : msgUuid,
                  },
                })
              }}
            >
              <div className="line">
                <div>{username}</div>
                <div dangerouslySetInnerHTML={{ __html: replyNewCont }}></div>
              </div>
            </div>
          )}
          {renderPictureMessage(replyMsgObj?.content || '', true)}
        </div>
      )
    } else if (showContent.type === 0) {
      return <div></div>
    } else {
      return <div></div>
    }
  }

  //选择审批人集合回调
  const selectForwardChange = (value: any) => {
    setMsgDetails({
      chatFarwardPop: {
        visible: false,
        chatFarwardMsg: '',
        chatFarward: value,
      },
    })
  }

  //关闭选择审批人弹窗
  const closeSelectForward = () => {
    setMsgDetails({
      chatFarwardPop: {
        visible: false,
        chatFarwardMsg: '',
      },
    })
  }

  //已读未读人员气泡列表
  const readPopoverTab = () => {
    const { readPersonList, unReadPersonList } = userNumber.readObj
    return (
      <Tabs className="unread-tabs" defaultActiveKey="1">
        <TabPane tab="未读" key="1">
          {unReadPersonList.map((item: string, index: number) => (
            <div className="tips_item_detail" key={index}>
              {item}
            </div>
          ))}
        </TabPane>
        <TabPane tab="已读" key="2">
          {readPersonList.map((item: string, index: number) => (
            <div className="tips_item_detail" key={index}>
              {item}
            </div>
          ))}
        </TabPane>
      </Tabs>
    )
  }

  // 已读未读数量显示
  const renderReadPopover = () => {
    const unreadNum = showContent.unreadUserList?.length
    if (selectItem.type !== 3) {
      return (
        <Popover
          content={readPopoverTab}
          title={null}
          trigger={'click'}
          onVisibleChange={getUnReadList}
          placement="topRight"
          getPopupContainer={(): any => document.getElementById('show-message')}
        >
          {<span className="unread-num">{!unreadNum ? '全部已读' : `${unreadNum}人未读`}</span>}
        </Popover>
      )
    } else {
      return <span className="unread-num">{unreadNum ? '未读' : '已读'}</span>
    }
  }

  // 处理转发的公共方法
  const handleForward = (forwardId?: number) => {
    // 添加当前聊天数据
    const { openRoomIds, selectItem, chatListData, nowUserId } = $store.getState()
    // 通过roomId找到对应的聊天室列表
    const roomInfo = chatListData.find((item: any) => item.roomId === forwardId)
    //判断打开的聊天室列表中存不存在现在转发的这一条
    const isRoomOpen = openRoomIds.some(thisId => {
      return thisId === forwardId
    })
    // roomInfo存在，在聊天室列表中
    if (roomInfo) {
      // 判断当前聊天室是否是打开的状态 0：是打开状态 1：关闭状态
      if (roomInfo?.windowClose === 0) {
        // 保存当前在独立窗口打开的聊天室id
        if (!isRoomOpen) {
          $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, forwardId] })
        }
        // 选择当前要转发的聊天室
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: roomInfo })
        // 打开或显示聊天窗口
        ipcRenderer.send('show_commuciate_muc', [selectItem, roomInfo])
      } else {
        const params = {
          userId: nowUserId,
          roomId: forwardId,
          state: 0,
        }
        const newDataList = chatListData.map((item: any) => {
          if (item.roomId === forwardId) {
            updateChatRoom({
              ...item,
              windowClose: 0,
            })
            return {
              ...item,
              windowClose: 0,
            }
          }
          return item
        })
        $store.dispatch({
          type: 'SET_CHAT_LIST',
          data: { chatListData: newDataList },
        })
        // getLocalRoomData(false, '')
        // 更新聊天室状态
        updateWindowState(params).then(() => null)
        // 选择当前要转发的聊天室
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: roomInfo })
        // 保存当前在独立窗口打开的聊天室id
        $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, forwardId] })
        // 打开或显示聊天窗口
        ipcRenderer.send('show_commuciate_muc', [selectItem, roomInfo])
      }
    } else {
      // 不存在，转发给一个从未聊过天的人
      queryListData().then((res: any) => {
        const roomList = res.roomList || []
        const roomInfo = roomList.find((item: any) => item.roomId === forwardId)
        // 更新聊天室
        batchInsertChatRoom({ userId: nowUserId, data: roomList })
        $store.dispatch({
          type: 'SET_CHAT_LIST',
          data: { chatListData: roomList },
        })
        // getLocalRoomData(false, '')
        // 保存当前在独立窗口打开的聊天室id
        if (!isRoomOpen) {
          $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, forwardId] })
        }
        // 选择当前要转发的聊天室
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: roomInfo })
        // 打开或显示聊天窗口
        ipcRenderer.send('show_commuciate_muc', [selectItem, roomInfo])
      })
    }
  }

  // 选中转发的群聊
  const openFordRoom = (selectData: ForwardProps[], selectRoomId?: number) => {
    // 当前转发选择的id
    const { id, type } = selectData && selectData[0]
    // 处理转发私聊群聊
    handleForward(type === 3 ? selectRoomId : id)
  }

  if (showContent.day) {
    return (
      <div className="date-show-line">
        <p></p>
        <span>{showContent.day}</span>
      </div>
    )
  }

  // 更新历史消息
  const updateHistoryMsg = (historyList: any, msgUuid: string) => {
    // 当前操作人的数据
    const operator = {
      userId: nowUserId,
      username: nowUser,
    }
    const data = historyList.map((item: globalInterface.ChatItemProps) => {
      if (item.msgUuid === msgUuid) {
        return {
          ...item,
          isRecall: 1,
          fromUser: operator,
        }
      } else {
        return item
      }
    })
    $store.dispatch({
      type: 'CHAT_ROOM_INFO',
      data: { messageHistory: data },
    })
    const newContent = {
      ...showContent,
      isRecall: 1,
    }
    // 更新本地缓存
    updateChatMsg(newContent)
  }

  // 撤回消息
  const revertMsg = () => {
    const { roomId, msgUuid, serverTime, sendStatus } = showContent
    const { messageHistory, selectItem } = $store.getState()
    // 如果是发送失败的消息，删除本地数据库的数据
    if (sendStatus === '-1') {
      const newMsgHistory = messageHistory.filter((item: any) => item.msgUuid !== msgUuid)
      // 更新聊天室历史记录
      $store.dispatch({
        type: 'CHAT_ROOM_INFO',
        data: { messageHistory: newMsgHistory },
      })
      // 删除本地缓存的数据
      deleteChatMsg({
        msgUuid: msgUuid,
      })
    } else {
      // 获取当前登录人的信息
      const { chatUserInfo } = $store.getState()
      const { userType } = chatUserInfo || {}
      // 当前操作的时间
      const nowDate = Date.now()
      // 判断当前操作时间与发消息时间是否超过5分钟,并且当前操作人为非管理员
      if (userType === 1 && selectItem.type !== 3 && nowDate - serverTime >= 5 * 60 * 1000) {
        msg.error('超出可撤回时间，请联系群管理人员撤回')
        return
      }
      // 如果是私聊
      if (selectItem.type === 3 && nowDate - serverTime >= 5 * 60 * 1000) {
        msg.error('超出可撤回时间')
        return
      }
      const __recallParam = {
        roomId: roomId,
        msgUuid: msgUuid,
        userId: nowUserId,
      }
      recallMsg(__recallParam)
        .then(() => {
          // updateHistoryMsg(messageHistory, msgUuid)
          setRecall({
            isRecall: 1,
            fromUser: {
              ...recall.fromUser,
              userId: nowUserId,
            },
          })
          updateHistoryMsg(messageHistory, msgUuid)
        })
        .catch((err: any) => {
          msg.error(err.returnMessage ? err.returnMessage : '撤回消息失败')
        })
    }
  }

  /**
   * 右键,更多操作按钮
   * @param menuItem
   * @param isHover
   */
  const downMenuHandel = async (menuItem: any, isHover?: boolean) => {
    const { sendStatus, messageJson } = showContent
    if (!!isHover) {
      setDropmenuVisible(false)
    } else {
      setMenuStatus({ rightMenuVisibe: false })
    }
    switch (menuItem.key) {
      case 'copy':
        if (showContent.type === 3) {
          const fileMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
          const { downloadUrl } = fileMsg || {}
          navigator.clipboard.writeText('')
          const dataUrl = await fetch(downloadUrl)
          const blob = await dataUrl.blob()
          const newFile = new Blob([blob], { type: 'image/png' })
          // @ts-ignore
          await navigator.clipboard.write([
            // @ts-ignore
            new ClipboardItem({
              [newFile.type]: newFile,
            }),
          ])
        } else if (type === 6) {
          // 引用消息
          navigator.clipboard.writeText(menuStatus.clipBoardContent)
        } else if (type === 2) {
          // @消息
          const atMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
          const { content } = atMsg || {}
          const newCon = content
            .replace($tools.regAtUser, '@$1')
            .replace($tools.regCharacter, '')
            .replace($tools.regEmoji, function(_: string, regStr: any) {
              const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
              return `<img class="emoji_icon" data-name="${regStr}" src="${imgUrl}">`
            })
          navigator.clipboard.writeText(newCon)
        } else if (type === 5) {
          const replyMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
          const { content } = replyMsg || {}
          // 回复消息
          const newCon = content
            ?.replace($tools.regAtUser, '@$1')
            ?.replace($tools.regCharacter, '')
            ?.replace($tools.regEmoji, function(_: string, regStr: any) {
              const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
              return `<img class="emoji_icon" data-name="${regStr}" src="${imgUrl}">`
            })
          navigator.clipboard.writeText(newCon)
        } else if (type === 1) {
          // 普通文本消息
          const newCon = messageJson
            .replace($tools.regAtUser, '@$1')
            .replace($tools.regCharacter, '')
            .replace($tools.regEmoji, function(_: string, regStr: any) {
              const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
              return `<img class="emoji_icon" data-name="${regStr}" src="${imgUrl}">`
            })
          navigator.clipboard.writeText(newCon)
        }
        break
      case 'forward': //转发消息
        setMsgDetails({
          chatFarwardPop: {
            visible: true,
            chatFarwardMsg: JSON.stringify({
              ...showContent,
              signType: 'forward',
            }),
          },
        })
        break
      case 'reply':
        replyHandle()
        break
      case 'revert': //撤回消息
        revertMsg()
        break
      case 'file':
        if (sendStatus !== '-1') {
          const fileMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
          const { fileGUID, officeUrl, fileSize, displayName } = fileMsg || {}
          const fromType = 'chatwin'
          const dir = 'im'
          downloadFile({
            url: officeUrl,
            fileName: displayName,
            fileKey: fileGUID,
            fileSize,
            dir,
            fromType,
          })
        }
        break
      default:
        break
    }
  }

  /**
   * 回复消息
   */
  const replyHandle = () => {
    focusReplyBox()
    const { currentReplyData, selectItem } = $store.getState()
    const draftData = JSON.parse(JSON.stringify(currentReplyData))
    draftData.forEach((item: any, index: number) => {
      if (selectItem.roomId === item.roomId) {
        draftData.splice(index, 1)
      }
    })
    draftData.push(showContent)
    $store.dispatch({ type: 'SET_REPLY_PARENT_DATA', data: draftData })
    $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
    ipcRenderer.send('IS_KNOW_TIME_STAMP', showContent.time)
  }
  /**
   * 表态图标事件
   * @param e
   */
  const likeIcon = (e: any) => {
    e.preventDefault()
    setEmojiVisible(true)
    setDropmenuVisible(false)
  }

  const discussNumHandel = () => {
    $store.dispatch({
      type: 'SET_REPLY_MODAL_DATA',
      data: {
        visible: true,
        timestamp: serverTime,
        roomId: roomId,
        rootMsgUuid: showContent?.msgUuid,
      },
    })
    $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
  }

  const anewsendmsgHandel = () => {
    if (!navigator.onLine) {
      msg.error('网络异常，请检查网络连接后重新再试')
    }
    // setBtnLoading(true)
    anewSendMsgFn(showContent)
  }
  /**
   *邀请成员进入聊天的系统消息
   * 2-1 加入群聊提示
   * 1）文案展示样式：【邀请人名称】邀请【被邀请人】加入群聊，当被邀请人一次性较多时则展示为：
   * a、被邀请人大于1人小于等于4人：
   * 【邀请人名称】邀请【被邀请人1】、【被邀请人2】、【被邀请人3】、【被邀请人4】进入群聊。
   * b、被邀请人数大于4人：
   * 【邀请人名称】邀请【被邀请人1】、【被邀请人2】、【被邀请人3】、【被邀请人4】等进入群聊。
   * c、新建群聊时添加成员，则无需进行提示
   * 2-2 从群聊中移出
   * 1）文案展示样式：【操作人员名称】将【被移出人名称】从群聊中移出
   * 2）可见范围：仅群主/管理员可见
   * 2-3 退出群聊
   * 1）文案展示样式：【退群人员名称】退出了群聊
   * 2）可见范围：仅群主/管理员可见
   * 2-4 注意：
   * 提示语言不展示红点、闪烁和高亮；
   * @param arr 邀请人员
   * @param n
   * @param t
   * @returns
   */
  const inviteHdenl = (arr: any, n: string, t: string) => {
    const headerMsg = n ? `【${n}】邀请` : '欢迎'
    if (arr.length > 1) {
      return assemblyData(arr, headerMsg, t, arr.length > 4 ? true : false)
    }
    return (
      <div className="system_content">
        <span className="show_system">{`${headerMsg}【${arr[0].username}】加入群聊`}</span>
        <span className={$c('show_time', { pTop: !!t })}>{t}</span>
      </div>
    )
  }
  const assemblyData = (data: any, n: string, t: string, m: boolean) => {
    const _arr = m ? data.splice(0, 4) : data
    const $data = _arr.map((item: any) => {
      return `【${item.username}】`
    })
    return (
      <div className="system_content">
        <span className="show_system">{`${n}${$data.join('、')}${m ? '等' : ''}加入群聊`}</span>
        <span className={$c('show_time', { pTop: !!t })}>{t}</span>
      </div>
    )
  }

  /**
   * 渲染系统通知消息
   * @type
   * 创建聊天室20001
   * 邀请加入聊天室20002
   * 退出聊天室20003
   * 踢出聊天室20004 20005
   * 设置群管理员 20006
   * 取消群管理员 20007
   * 移交群主 20008
   */
  const renderSysMsg = () => {
    const { chatUserInfo } = $store.getState()
    const { userType } = chatUserInfo || {}
    const { messageJson, serverTime } = showContent || {}
    const { selectItem } = $store.getState()
    const systemMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
    const { type, content } = systemMsg || {}
    const { operatorUser, operatedUsers } = JSON.parse(content || '{}') || {}
    // 操作人
    const { username } = operatorUser || {}
    const showTime = moment(Number(serverTime)).format('MM/DD HH:mm')
    const personList = operatedUsers || []
    // 群聊时才展示系统通知消息
    if (selectItem.type === 3) {
      return ''
    }
    switch (type) {
      case 20002: //邀请加入聊天室
        return personList.length > 0 ? inviteHdenl(personList, username, showTime) : ''
      case 20001: //创建聊天室
      case 20003: //退出聊天室
      case 20004: //踢出聊天室
        let $domStr = ''
        let flag = true
        if (type === 20001) {
          $domStr = `【${username ? username : '管理员'}】于${showTime}${
            selectItem.type === 5 ? '创建主题群聊' : '开启了群聊'
          }`
          flag = false
        } else if (type === 20003 && (userType === 0 || userType === 2)) {
          $domStr = `【${username}】退出了群聊`
        } else if (userType === 0 || userType === 2) {
          $domStr = `【${username}】将【${personList[0].username}】从群聊中移出`
        }
        return (
          <div className="system_content">
            <span className="show_system">{$domStr}</span>
            <span className={$c('show_time', { pTop: !!showTime })}>{!flag ? '' : showTime}</span>
          </div>
        )
    }
  }
  //是否是发送的失败消息
  // const isErrorMsg = sendStatus && sendStatus !== '0'
  const onMouseEnter = () => {
    if (!sendStatus || sendStatus == 0) {
      setMenuStatus({ menuVisible: true })
      setEmojiVisible(false)
    }
  }

  const onMouseLeave = () => {
    setMenuStatus({ menuVisible: false })
    setDropmenuVisible(false)
  }

  const onVisibleChange = (visible: boolean) => {
    setMenuStatus({
      menuVisible: false,
      rightMenuVisibe: visible,
    })
  }

  return (
    <div className="chat-item" data-time={showContent.serverTime} id={`chat-item${showContent.serverTime}`}>
      {type === 0 && showContent.messageJson && <div className="notice-msg">{renderSysMsg()}</div>}
      {type !== 0 && (
        <div
          className={$c('normal-msg flex', {
            'normal-chat': _fromUser?.userId !== nowUserId,
            'normal-chat-right': _fromUser?.userId === nowUserId,
          })}
        >
          {_fromUser?.userId !== nowUserId && recall.isRecall !== 1 && (
            <Avatar className="oa-avatar" src={userProfile}>
              {_fromUser?.username && _fromUser?.username?.substr(-2, 2)}
            </Avatar>
          )}
          <div className="show-message flex-1" id="show-message">
            {/* 发消息的人 */}
            {recall.isRecall !== 1 && (
              <span className="from-name">
                <span>{_fromUser?.username}</span>
                {/** 显示消息时间 */}
                <span className="show-chat-time">
                  {!!showContent.serverTime
                    ? moment(Number(showContent.serverTime)).format('MM/DD HH:mm')
                    : null}
                </span>
              </span>
            )}
            {/* 撤回的消息 */}
            {recall.isRecall === 1 && (
              <div className="recverMsg">
                {recall.fromUser?.userId !== nowUserId ? recall.fromUser?.username : '你'}撤回了一条消息
              </div>
            )}
            {/* 未撤回的消息 */}
            {recall.isRecall !== 1 && (
              <div className="message-main" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {/* 消息主体内容 */}
                <Dropdown
                  trigger={['contextMenu']}
                  overlayClassName="ZIndex800"
                  visible={menuStatus.rightMenuVisibe}
                  overlay={<MenuToolHandel showContent={showContent} menuHandel={downMenuHandel} />}
                  onVisibleChange={onVisibleChange}
                  getPopupContainer={(): any => document.getElementById(`chat-item${showContent.serverTime}`)}
                >
                  <div className={$c({ 'message-info': showContent.type !== 6 })}>
                    {/*渲染消息发送状态*/}
                    {sendStatus == '-1' && <i className="anewsendmsg" onClick={anewsendmsgHandel}></i>}
                    {sendStatus == '0' && antIcon}
                    {renderMsgContent(showContent)}
                    {/*所有对消息点赞的人*/}
                    <ThumbMember
                      data={thumbMember}
                      itemEvent={(emojiKey: string) => {
                        handleSelectEmoji(emojiKey, {
                          operateUserId: nowUserId,
                          operateUsername: nowUser,
                          emoticonName: emojiKey,
                          timestamp: serverTime,
                          chatMessageJid: showContent.roomJid,
                        })
                      }}
                    />
                  </div>
                </Dropdown>
                {/*未撤回的消息hover按钮*/}
                {recall.isRecall !== 1 && menuStatus.menuVisible && !menuStatus.rightMenuVisibe && (
                  <div className={`leftHandleBtn flex ${sendStatus == '-1' ? 'mg27' : ''}`}>
                    {/* 表态图标 */}
                    {/* <i className="like_icon" onClick={e => likeIcon(e)}></i> */}
                    {emojiVisible && (
                      <LikeIcons selectEmoji={(key: string) => handleSelectEmoji(key)}></LikeIcons>
                    )}
                    {/* 回复 */}
                    {type !== 0 && type !== 6 && <i className="reply_icon" onClick={replyHandle}></i>}
                    {/* 更多 */}
                    <Dropdown
                      trigger={['hover']}
                      overlayClassName="ZIndex800"
                      visible={dropMenuVisible}
                      overlay={
                        <MenuToolHandel showContent={showContent} menuHandel={downMenuHandel} isHover={true} />
                      }
                      onVisibleChange={visible => {
                        setEmojiVisible(false)
                        setDropmenuVisible(visible)
                      }}
                    >
                      <i className="moreGrey"></i>
                    </Dropdown>
                  </div>
                )}
                <div style={{ clear: 'both' }}></div>
              </div>
            )}

            {/*不是撤回的消息显示*/}

            <div className="chat-myself-btn-group">
              {/* 显示消息已读未读数 */}
              {/* {_fromUser?.userId === nowUserId && sendStatus !== '-1' && renderReadPopover()} */}
              {/* 消息回复数量 */}
              {recall.isRecall !== 1 && commentCount && commentCount > 0 ? (
                <span className="discussNum" onClick={discussNumHandel}>
                  {commentCount}条回复
                </span>
              ) : (
                ''
              )}
            </div>
          </div>
          {_fromUser?.userId === nowUserId && recall.isRecall !== 1 && (
            <Avatar className="oa-avatar" src={$store.getState().nowAvatar}>
              {_fromUser?.username && _fromUser?.username?.substr(-2, 2)}
            </Avatar>
          )}
        </div>
      )}
      {/* 转发选择聊天室 */}
      {msgDetails.chatFarwardPop.visible && (
        <ChatForwardModal
          visible={msgDetails.chatFarwardPop.visible}
          chatMsg={msgDetails.chatFarwardPop.chatFarwardMsg}
          teamId={selectItem.belongTypeId}
          onSelected={selectForwardChange}
          onCancelModal={closeSelectForward}
          openFordRoom={openFordRoom}
          dataAuth={true}
          findType={0}
          permissionType={3}
          isQueryAll={1}
          nodeSelected={msgDetails.chatFarwardPop.chatFarward}
          pageSize={10}
          sendType="communication"
          selectList={{
            nowUserId,
            nowUser,
            curType: 0,
            nowAccount,
            profile: userInfo.profile,
            disable: true,
          }}
        />
      )}

      {fileModal.fileVisible && (
        <PreviewModal
          visible={fileModal.fileVisible}
          onCancel={() => {
            setFileModal({ fileVisible: false })
          }}
          {...fileModal}
        />
      )}
    </div>
  )
}

export default NewChatItem

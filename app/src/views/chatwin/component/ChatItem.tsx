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

//??????????????????
const NewChatItem: React.FC<NewChatItemProps> = ({ showContent, focusReplyBox }) => {
  // ????????????
  const { nowUserId, nowAccount, nowUser, userInfo, selectItem } = $store.getState()
  const { type, serverTime, fromUser, sendStatus, roomId, commentCount, isRecall } = showContent
  const _fromUser = $tools.isJsonString(fromUser) ? JSON.parse(fromUser) : fromUser
  // ??????????????????????????????
  const [dropMenuVisible, setDropmenuVisible] = useState(false)
  // ????????????????????????
  const [emojiVisible, setEmojiVisible] = useState(false)
  //????????????
  const [recall, setRecall] = useMergeState({
    isRecall: 0,
    fromUser: {},
  })
  //?????????
  const [thumbMember, setThumbMember] = useState<any>([])
  // ??????????????????????????????
  const [userNumber, setUserNumber] = useMergeState({
    knownState: false,
    knownData: {
      mucId: '',
      totalCount: 0, // @?????????
      timestamp: 0,
      handleCount: 0, // ???????????????
    },
    konwnUser: { knowUsers: [], unKnowUsers: [] }, // ???????????????????????????????????????
    readObj: { readPersonList: [], unReadPersonList: [] }, // ?????????????????????????????????
  })
  // ??????????????????
  const [menuStatus, setMenuStatus] = useMergeState({
    menuVisible: false, // ??????hover??????????????????
    rightMenuVisibe: false, // ??????????????????????????????
    clipBoardContent: '',
  })
  // ????????????????????????
  const [msgDetails, setMsgDetails] = useMergeState({
    chatFarwardPop: { visible: false, chatFarwardMsg: '', chatFarward: [] }, //??????????????????
  })
  // ????????????
  const [fileModal, setFileModal] = useMergeState({
    fileVisible: false,
    fileName: '',
    fileKey: 0,
    fileSize: 0,
    dir: '',
    uploadUser: '',
    uploadDate: '',
  })
  //profile??????
  const [userProfile, setUserProfile] = useState<any>('')

  useEffect(() => {
    const thumbMember = updateThumbMember(showContent) || []
    setThumbMember(thumbMember)
    setRecall({
      isRecall,
      fromUser,
    })
    if (selectItem.type === 3) {
      //?????????????????????????????????
      setUserProfile(selectItem?.profile || null)
    } else {
      //???????????????????????????
      if (_fromUser?.userId) {
        queryCacheProfile(_fromUser?.userId).then((profile: any) => {
          setUserProfile(profile)
        })
      }
    }
  }, [showContent])

  //????????????????????????
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
          const $hasDot = item.operateUsername.indexOf('???') !== -1
          if (eqalUserId && eqalKey) {
            urlSuffix = 'cancel'
            //???key???????????????????????????
            data = data.filter((item: any) => item.emoticonName !== key)
          }
          //?????????
          if (eqalKey && $userName && $hasDot) {
            urlSuffix = 'cancel'
            //?????????????????????
            const newArr = []
            for (let i = 0; i < data.length; i++) {
              const $hasId = data[i].hasOwnProperty('id')
              if ($hasId || (!$hasId && data[i].emoticonName !== key)) {
                newArr.push(data[i])
              }
            }
            data = newArr.map(($item: any) => {
              if ($item.emoticonName === key && $item.hasOwnProperty('id')) {
                const newName = $item.operateUsername.replace(`???${params.operateUsername}`, '')
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
    //????????????????????????
    saveEmojiAppraise(urlSuffix, value ? value : params)
    const $data = !!data.length ? updateThumbMember(showContent, JSON.stringify(data)) : []
    setThumbMember($data)
  }

  // ??????????????????div??????
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
            range.selectNodeContents($(ele)[0]) // ???????????????dom??????
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
        range.selectNodeContents(e.target) // ???????????????dom??????
        selection.addRange(range)
        setMenuStatus({ clipBoardContent: e.target.innerText })
      }
    }
  }

  // ????????????
  const contextMenuEvent = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | any) => {
    // ???????????????????????????????????????????????????
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
  //??????????????????
  const findKnowPersons = () => {
    queryPersons({
      timestamp: showContent.sendTime,
      muc: showContent.roomJid,
    }).then((data: any) => {
      setUserNumber({ konwnUser: data.data })
    })
  }
  // @??????????????????????????????????????????
  const konwnPopoverTab = () => {
    const { knowUsers, unKnowUsers } = userNumber.konwnUser
    return (
      <Tabs className="unread-tabs known-list-pop" defaultActiveKey="1">
        <TabPane tab="?????????????????????" key="1" className="known-list-box">
          <div className="list_title">
            <div className="title unKnownTit">
              <span className="count">{(unKnowUsers && unKnowUsers.length) || 0}</span>
              <span>????????????</span>
            </div>
            <div className="title">
              <span className="count">{(knowUsers && knowUsers.length) || 0}</span>
              <span>????????????</span>
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
   * ?????????????????????0 ??????1 ??????2 ??????3 ??????4 ??????5 ??????6 ???
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
        /* ?????????????????? */
        const $suffix = suffix(displayName)
        if ($tools.imgFormatArr.includes($suffix)) {
          // ????????????
          const $imgDom = `<img className="img-around" src="${sendStatus === '-1' ? fileUrl : officeUrl}"/>`
          return renderPictureMessage($imgDom)
        } else {
          // ??????????????????
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
        // ????????????
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
          // ?????????????????????????????????@??????
          $newCon = $newCon.replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
        }
      }
      return <div className="ordinary_message">{renderPictureMessage($newCon || '')}</div>
    } else if (type === 2) {
      const { userId: fromId } = fromUser
      const { atUserIdList, content: message } = $messageJson
      if (showContent.signType === 'forward') {
        // ?????????@???????????????????????????
        const newCon = message
          .replace($tools.regCharacter, '')
          .replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
        return <div className="ordinary_message">{renderPictureMessage(newCon || '')}</div>
      } else {
        // @??????
        const newArr = atUserIdList
        let newCon = ''
        if (checkIn(newArr) && Number(fromId) !== Number(nowUserId)) {
          // ??????@??????
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
          // ??????@???????????????????????????????????????
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
          // ??????@??????
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
                    ?????????
                  </span>
                </div>
              </Popover>
            )} */}
          </div>
        )
      }
    } else if (type === 6) {
      // ????????????(????????????)
      return <RenderQuoteMsg quoteMsg={showContent} />
    } else if (type === 4) {
      // ????????????
      return <MapMessage showContent={showContent} contextMenuEvent={contextMenuEvent} mapMsg={$messageJson} />
    } else if (showContent.type === 5) {
      // ???????????????
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

  //???????????????????????????
  const selectForwardChange = (value: any) => {
    setMsgDetails({
      chatFarwardPop: {
        visible: false,
        chatFarwardMsg: '',
        chatFarward: value,
      },
    })
  }

  //???????????????????????????
  const closeSelectForward = () => {
    setMsgDetails({
      chatFarwardPop: {
        visible: false,
        chatFarwardMsg: '',
      },
    })
  }

  //??????????????????????????????
  const readPopoverTab = () => {
    const { readPersonList, unReadPersonList } = userNumber.readObj
    return (
      <Tabs className="unread-tabs" defaultActiveKey="1">
        <TabPane tab="??????" key="1">
          {unReadPersonList.map((item: string, index: number) => (
            <div className="tips_item_detail" key={index}>
              {item}
            </div>
          ))}
        </TabPane>
        <TabPane tab="??????" key="2">
          {readPersonList.map((item: string, index: number) => (
            <div className="tips_item_detail" key={index}>
              {item}
            </div>
          ))}
        </TabPane>
      </Tabs>
    )
  }

  // ????????????????????????
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
          {<span className="unread-num">{!unreadNum ? '????????????' : `${unreadNum}?????????`}</span>}
        </Popover>
      )
    } else {
      return <span className="unread-num">{unreadNum ? '??????' : '??????'}</span>
    }
  }

  // ???????????????????????????
  const handleForward = (forwardId?: number) => {
    // ????????????????????????
    const { openRoomIds, selectItem, chatListData, nowUserId } = $store.getState()
    // ??????roomId??????????????????????????????
    const roomInfo = chatListData.find((item: any) => item.roomId === forwardId)
    //?????????????????????????????????????????????????????????????????????
    const isRoomOpen = openRoomIds.some(thisId => {
      return thisId === forwardId
    })
    // roomInfo??????????????????????????????
    if (roomInfo) {
      // ????????????????????????????????????????????? 0?????????????????? 1???????????????
      if (roomInfo?.windowClose === 0) {
        // ?????????????????????????????????????????????id
        if (!isRoomOpen) {
          $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, forwardId] })
        }
        // ?????????????????????????????????
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: roomInfo })
        // ???????????????????????????
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
        // ?????????????????????
        updateWindowState(params).then(() => null)
        // ?????????????????????????????????
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: roomInfo })
        // ?????????????????????????????????????????????id
        $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, forwardId] })
        // ???????????????????????????
        ipcRenderer.send('show_commuciate_muc', [selectItem, roomInfo])
      }
    } else {
      // ????????????????????????????????????????????????
      queryListData().then((res: any) => {
        const roomList = res.roomList || []
        const roomInfo = roomList.find((item: any) => item.roomId === forwardId)
        // ???????????????
        batchInsertChatRoom({ userId: nowUserId, data: roomList })
        $store.dispatch({
          type: 'SET_CHAT_LIST',
          data: { chatListData: roomList },
        })
        // getLocalRoomData(false, '')
        // ?????????????????????????????????????????????id
        if (!isRoomOpen) {
          $store.dispatch({ type: 'SET_OPENROOM_IDS', data: [...openRoomIds, forwardId] })
        }
        // ?????????????????????????????????
        $store.dispatch({ type: 'SET_SELECT_ITEM', data: roomInfo })
        // ???????????????????????????
        ipcRenderer.send('show_commuciate_muc', [selectItem, roomInfo])
      })
    }
  }

  // ?????????????????????
  const openFordRoom = (selectData: ForwardProps[], selectRoomId?: number) => {
    // ?????????????????????id
    const { id, type } = selectData && selectData[0]
    // ????????????????????????
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

  // ??????????????????
  const updateHistoryMsg = (historyList: any, msgUuid: string) => {
    // ????????????????????????
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
    // ??????????????????
    updateChatMsg(newContent)
  }

  // ????????????
  const revertMsg = () => {
    const { roomId, msgUuid, serverTime, sendStatus } = showContent
    const { messageHistory, selectItem } = $store.getState()
    // ???????????????????????????????????????????????????????????????
    if (sendStatus === '-1') {
      const newMsgHistory = messageHistory.filter((item: any) => item.msgUuid !== msgUuid)
      // ???????????????????????????
      $store.dispatch({
        type: 'CHAT_ROOM_INFO',
        data: { messageHistory: newMsgHistory },
      })
      // ???????????????????????????
      deleteChatMsg({
        msgUuid: msgUuid,
      })
    } else {
      // ??????????????????????????????
      const { chatUserInfo } = $store.getState()
      const { userType } = chatUserInfo || {}
      // ?????????????????????
      const nowDate = Date.now()
      // ??????????????????????????????????????????????????????5??????,????????????????????????????????????
      if (userType === 1 && selectItem.type !== 3 && nowDate - serverTime >= 5 * 60 * 1000) {
        msg.error('??????????????????????????????????????????????????????')
        return
      }
      // ???????????????
      if (selectItem.type === 3 && nowDate - serverTime >= 5 * 60 * 1000) {
        msg.error('?????????????????????')
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
          msg.error(err.returnMessage ? err.returnMessage : '??????????????????')
        })
    }
  }

  /**
   * ??????,??????????????????
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
          // ????????????
          navigator.clipboard.writeText(menuStatus.clipBoardContent)
        } else if (type === 2) {
          // @??????
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
          // ????????????
          const newCon = content
            ?.replace($tools.regAtUser, '@$1')
            ?.replace($tools.regCharacter, '')
            ?.replace($tools.regEmoji, function(_: string, regStr: any) {
              const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
              return `<img class="emoji_icon" data-name="${regStr}" src="${imgUrl}">`
            })
          navigator.clipboard.writeText(newCon)
        } else if (type === 1) {
          // ??????????????????
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
      case 'forward': //????????????
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
      case 'revert': //????????????
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
   * ????????????
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
   * ??????????????????
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
      msg.error('???????????????????????????????????????????????????')
    }
    // setBtnLoading(true)
    anewSendMsgFn(showContent)
  }
  /**
   *???????????????????????????????????????
   * 2-1 ??????????????????
   * 1????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
   * a?????????????????????1???????????????4??????
   * ??????????????????????????????????????????1?????????????????????2?????????????????????3?????????????????????4??????????????????
   * b????????????????????????4??????
   * ??????????????????????????????????????????1?????????????????????2?????????????????????3?????????????????????4?????????????????????
   * c??????????????????????????????????????????????????????
   * 2-2 ??????????????????
   * 1?????????????????????????????????????????????????????????????????????????????????????????????
   * 2???????????????????????????/???????????????
   * 2-3 ????????????
   * 1???????????????????????????????????????????????????????????????
   * 2???????????????????????????/???????????????
   * 2-4 ?????????
   * ????????????????????????????????????????????????
   * @param arr ????????????
   * @param n
   * @param t
   * @returns
   */
  const inviteHdenl = (arr: any, n: string, t: string) => {
    const headerMsg = n ? `???${n}?????????` : '??????'
    if (arr.length > 1) {
      return assemblyData(arr, headerMsg, t, arr.length > 4 ? true : false)
    }
    return (
      <div className="system_content">
        <span className="show_system">{`${headerMsg}???${arr[0].username}???????????????`}</span>
        <span className={$c('show_time', { pTop: !!t })}>{t}</span>
      </div>
    )
  }
  const assemblyData = (data: any, n: string, t: string, m: boolean) => {
    const _arr = m ? data.splice(0, 4) : data
    const $data = _arr.map((item: any) => {
      return `???${item.username}???`
    })
    return (
      <div className="system_content">
        <span className="show_system">{`${n}${$data.join('???')}${m ? '???' : ''}????????????`}</span>
        <span className={$c('show_time', { pTop: !!t })}>{t}</span>
      </div>
    )
  }

  /**
   * ????????????????????????
   * @type
   * ???????????????20001
   * ?????????????????????20002
   * ???????????????20003
   * ???????????????20004 20005
   * ?????????????????? 20006
   * ?????????????????? 20007
   * ???????????? 20008
   */
  const renderSysMsg = () => {
    const { chatUserInfo } = $store.getState()
    const { userType } = chatUserInfo || {}
    const { messageJson, serverTime } = showContent || {}
    const { selectItem } = $store.getState()
    const systemMsg = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
    const { type, content } = systemMsg || {}
    const { operatorUser, operatedUsers } = JSON.parse(content || '{}') || {}
    // ?????????
    const { username } = operatorUser || {}
    const showTime = moment(Number(serverTime)).format('MM/DD HH:mm')
    const personList = operatedUsers || []
    // ????????????????????????????????????
    if (selectItem.type === 3) {
      return ''
    }
    switch (type) {
      case 20002: //?????????????????????
        return personList.length > 0 ? inviteHdenl(personList, username, showTime) : ''
      case 20001: //???????????????
      case 20003: //???????????????
      case 20004: //???????????????
        let $domStr = ''
        let flag = true
        if (type === 20001) {
          $domStr = `???${username ? username : '?????????'}??????${showTime}${
            selectItem.type === 5 ? '??????????????????' : '???????????????'
          }`
          flag = false
        } else if (type === 20003 && (userType === 0 || userType === 2)) {
          $domStr = `???${username}??????????????????`
        } else if (userType === 0 || userType === 2) {
          $domStr = `???${username}?????????${personList[0].username}?????????????????????`
        }
        return (
          <div className="system_content">
            <span className="show_system">{$domStr}</span>
            <span className={$c('show_time', { pTop: !!showTime })}>{!flag ? '' : showTime}</span>
          </div>
        )
    }
  }
  //??????????????????????????????
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
            {/* ??????????????? */}
            {recall.isRecall !== 1 && (
              <span className="from-name">
                <span>{_fromUser?.username}</span>
                {/** ?????????????????? */}
                <span className="show-chat-time">
                  {!!showContent.serverTime
                    ? moment(Number(showContent.serverTime)).format('MM/DD HH:mm')
                    : null}
                </span>
              </span>
            )}
            {/* ??????????????? */}
            {recall.isRecall === 1 && (
              <div className="recverMsg">
                {recall.fromUser?.userId !== nowUserId ? recall.fromUser?.username : '???'}?????????????????????
              </div>
            )}
            {/* ?????????????????? */}
            {recall.isRecall !== 1 && (
              <div className="message-main" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {/* ?????????????????? */}
                <Dropdown
                  trigger={['contextMenu']}
                  overlayClassName="ZIndex800"
                  visible={menuStatus.rightMenuVisibe}
                  overlay={<MenuToolHandel showContent={showContent} menuHandel={downMenuHandel} />}
                  onVisibleChange={onVisibleChange}
                  getPopupContainer={(): any => document.getElementById(`chat-item${showContent.serverTime}`)}
                >
                  <div className={$c({ 'message-info': showContent.type !== 6 })}>
                    {/*????????????????????????*/}
                    {sendStatus == '-1' && <i className="anewsendmsg" onClick={anewsendmsgHandel}></i>}
                    {sendStatus == '0' && antIcon}
                    {renderMsgContent(showContent)}
                    {/*???????????????????????????*/}
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
                {/*??????????????????hover??????*/}
                {recall.isRecall !== 1 && menuStatus.menuVisible && !menuStatus.rightMenuVisibe && (
                  <div className={`leftHandleBtn flex ${sendStatus == '-1' ? 'mg27' : ''}`}>
                    {/* ???????????? */}
                    {/* <i className="like_icon" onClick={e => likeIcon(e)}></i> */}
                    {emojiVisible && (
                      <LikeIcons selectEmoji={(key: string) => handleSelectEmoji(key)}></LikeIcons>
                    )}
                    {/* ?????? */}
                    {type !== 0 && type !== 6 && <i className="reply_icon" onClick={replyHandle}></i>}
                    {/* ?????? */}
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

            {/*???????????????????????????*/}

            <div className="chat-myself-btn-group">
              {/* ??????????????????????????? */}
              {/* {_fromUser?.userId === nowUserId && sendStatus !== '-1' && renderReadPopover()} */}
              {/* ?????????????????? */}
              {recall.isRecall !== 1 && commentCount && commentCount > 0 ? (
                <span className="discussNum" onClick={discussNumHandel}>
                  {commentCount}?????????
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
      {/* ????????????????????? */}
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

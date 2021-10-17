import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react'
import { Provider, useSelector, shallowEqual } from 'react-redux'
import { Avatar, Popover, Tabs, Modal, message as msg } from 'antd'
import moment from 'moment'
import $c from 'classnames'
import ChatItemMap from '../chatwin/component/ChatItemMap'
import { getFileIcon } from '../chatWin/getData/ChatHandle'
import TaskReportModel from '@/src/views/workReport/component/TaskReportModel'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import ChatForwardModal from '@/src/components/chat-forward-modal'
import { PreviewModal } from '@/src/components/upload-file/index'
import ReportDetails from '../workReport/component/ReportDetails'
import RenderApprovalDetails from '../approval-only-detail/ApprovalDetailsOnly'
import 'react-photo-view/dist/index.css'
import '../chatwin/styles/ChatItem.less'
import { getChatToken } from '../chatwin/getData/getData'
import axios from 'axios'
import { arrObjDuplicate } from '@/src/common/js/common'
const FILEHOST = process.env.API_FILE_HOST
const { TabPane } = Tabs

export const useMergeState = (initialValue: any) => {
  const [values, setValues] = useState(initialValue)
  const updateValues = useCallback(newState => {
    if (typeof newState !== 'object') {
      return console.warn('values required type is object!')
    }
    setValues((prevState: any) => Object.assign({}, prevState, newState))
  }, [])
  const forceValues = useCallback(_values => {
    setValues(_values || initialValue)
  }, [])
  return [values, updateValues, forceValues]
}

//查询审批详情
const getApprovalById = (id: number) => {
  return new Promise<any>((resolve, reject) => {
    const { nowUserId, loginToken } = $store.getState()
    const param = {
      id,
      userId: nowUserId,
      noticeId: 0,
      isCopy: 0,
    }
    $api
      .request('/approval/approval/findApprovalById', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        $store.dispatch({ type: 'IS_APPROVAL_SEND', data: false })
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//渲染引用消息
const RenderQuoteMsg = ({ quoteMsg, action }: { quoteMsg: globalInterface.QuoteMsgProps; action: any }) => {
  const solveTypeDetail = (nodeData: any) => {
    if (nodeData.type == 'report') {
      action({
        detailHistory: {
          visible: true,
          data: {
            taskId: nodeData.id,
            disable: true,
            ...nodeData,
          },
        },
      })
    } else if (nodeData.type == 'workReport') {
      action({
        reportDetails: {
          visible: true,
          reportId: nodeData.id,
        },
      })
    } else if (nodeData.type === 'approval') {
      //分享的审批
      getApprovalById(nodeData.id)
        .then(() => {
          const modal = Modal.info({
            title: '审批详情',
            style: {
              height: '800px',
            },
            closable: true,
          })
          modal.update({
            title: '审批详情',
            width: '1000px',
            centered: true,
            okCancel: false,
            okText: '知道了',
            icon: false,
            className: 'show-approval-details',
            content: (
              <Provider store={$store}>
                <RenderApprovalDetails queryAll={false} approvalId={nodeData.id} />
              </Provider>
            ),
          })
        })
        .catch(err => {
          msg.error(err.returnMessage || '查询失败')
        })
    } else if (nodeData.type === 'task') {
      //调转到任务详情
      action({
        opentaskdetail: {
          visible: true,
          id: nodeData.id,
        },
      })
    } else if (quoteMsg.type == 'workPlan') {
      //跳转到工作规划
      $store.dispatch({
        type: 'MINDMAPDATA',
        data: {
          id: quoteMsg.id,
          typeId: quoteMsg.taskId,
          name: quoteMsg.name,
          form: 'chitchat',
          teamId: quoteMsg.teamId,
          teamName: quoteMsg.teamName,
        },
      })
      $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 })
      const { fromPlanTotype } = $store.getState()
      $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
      $tools.createWindow('workplanMind')
    }
  }

  const quoteMsgVal = (value: string) => {
    if (!value) return ''
    /* 普通消息和@消息 */
    const newCon = value
      .replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
      .replace($tools.regCharacter, '')
      .replace($tools.regEmoji, function(_: string, regStr: any) {
        const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
        return `<img class="emoji_icon" src="${imgUrl}">`
      })
    const newContdata = newCon.replace(
      $tools.regImg,
      '<span class="img_box" datasrc="$1"><img src="$1" /></span>'
    )
    return <div className="quote-val" dangerouslySetInnerHTML={{ __html: newContdata }}></div>
  }

  return (
    <div>
      <div
        className="quote-title"
        onClick={e => {
          e.stopPropagation()
          solveTypeDetail(quoteMsg)
        }}
      >
        {'"【' + quoteMsg.title + '】'}
        <div className="quote-content" dangerouslySetInnerHTML={{ __html: quoteMsg.name + '"' }}></div>
      </div>
      {quoteMsgVal(quoteMsg.val)}
    </div>
  )
}

/*
 *聊天消息组件
 */

const ChatItem = ({ showContent }: { showContent: any }) => {
  const refComplete = useRef(null)
  // 基本信息
  const { nowUserId, nowAccount, loginToken, nowUser, userInfo } = $store.getState()
  // 当前选中的聊天室列表
  const selectItem = useSelector((store: StoreStates) => store.selectItem, shallowEqual)
  // 设置显示内容
  // const [showContent, setShowContent] = useState<globalInterface.ChatContentProps>(Object)
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

  // 引用消息详情相关
  const [msgDetails, setMsgDetails] = useMergeState({
    opencreattask: false, // 地图窗口详情
    menuVisible: false, // 控制hover钮菜单显示隐藏
    rightMenuVisibe: false, // 控制右键菜单显示隐藏
    reportDetails: { visible: false, reportId: '', isMuc: 0 }, // 报告详情
    detailHistory: { visible: false, data: {} }, // 任务详情
    opentaskdetail: { visible: false, id: '' }, // 显示隐藏任务详情
    chatFarwardPop: { visible: false, msg: '', chatFarward: [] }, //审批转发相关
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

  // useEffect(() => {
  //   const dataContent = data.content
  //   if ($tools.isJsonString($tools.htmlDecodeByRegExpContentHtml(dataContent))) {
  //     const content = JSON.parse($tools.htmlDecodeByRegExpContentHtml(dataContent))
  //     setShowContent(content)
  //   }
  // }, [data])

  //dom更新完后
  useLayoutEffect(() => {
    let timer: any = null
    //设置表头相关字段
    if (document.getElementsByClassName('allmap_').length > 0) {
      if (refComplete.current) {
        timer = setTimeout(() => {
          const WS: any = window
          const BMap = WS.BMap //取出window中的BMap对象
          const SC: any = showContent
          const map = new BMap.Map('allmap_' + SC.time, {
            enableMapClick: false,
            enableDoubleClick: false,
          }) // 创建Map实例
          const point = new BMap.Point(SC.longitude, SC.latitude) // 初始化地图,设置中心点坐标和地图级别
          map.centerAndZoom(point, 15)
          const marker = new BMap.Marker(point) // 创建标注
          map.addOverlay(marker) // 将标注添加到地图中
          map.disableDragging()
        }, 100)
      }
    }
    return () => {
      timer && clearTimeout(timer)
    }
  }, [showContent])

  //查询已读未读列表
  const getUnReadList = () => {
    const { roomJid, time } = showContent
    const param = {
      room: roomJid.split('@')[0],
      user: nowAccount.replace('@', ''),
      time,
      operationUser: nowAccount,
    }
    $api
      .request('/im-consumer/messageInfo/readMessageList', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        setUserNumber({ readObj: resData.obj })
      })
  }

  // 更新点赞表情
  const updateThumbMember = () => {
    const emoji = $tools.htmlDecodeByRegExpContentHtml(showContent.messageEmojiAppraiseModel)
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

  // 所有对消息点赞的人
  const renderThumMember = () => {
    const thumbMember = updateThumbMember() || []
    return (
      <ul className={`${thumbMember.length ? 'thumbIcons' : ''}`}>
        {thumbMember.map((item: globalInterface.EmojiAppraiseProps, index: number) => {
          return (
            <li key={index}>
              <img src={$tools.asAssetsPath(`/emoji/${item.emoticonName}.svg`)} />
              {item.operateUsername}
            </li>
          )
        })}
      </ul>
    )
  }

  const filePreview = async () => {
    const { sendstate, fileName, officeUrl, fileGUID } = showContent
    if (sendstate === '-1') {
      return
    }
    const fileFormatArr = ['ppt', 'pptx', 'xlsx', 'xls', 'doc', 'docx', 'pdf']
    const ext = fileName
      .toLowerCase()
      .split('.')
      .splice(-1)[0]
    if (fileFormatArr.includes(ext)) {
      addBrowse(fileGUID || '') //预览需要调用此接口
      console.log(showContent)
      //打开附件文件预览窗口
      const a = document.createElement('a')
      a.href = officeUrl + '&holderView=1'
      a.target = '_blank'
      a.click()
      // $store.dispatch({
      //   type: 'SET_FILE_OFFICE_URL',
      //   data: {
      //     url: officeUrl,
      //     fileName: fileName,
      //   },
      // })
      // $tools.createWindow('fileWindow').finally(() => {})
    } else {
      msg.warning('该文件类型不支持预览')
    }
  }

  // 渲染@消息 subtype:6
  const renderAtMessage = () => {
    const { time: sendTime, message, fromId, sendstate, roomJid, spareContent } = showContent
    const newArr = spareContent ? spareContent.split(',') : ''
    let newCon = ''
    if (checkIn(newArr) && Number(fromId) !== Number(nowUserId)) {
      // 别人@自己
      newCon = message
        .replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
        .replace($tools.regCharacter, '')
        .replace($tools.regEmoji, function(_: string, regStr: any) {
          const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
          return `<img class="emoji_icon" src="${imgUrl}">`
        })
      const newContdata1 = newCon.replace(
        $tools.regImg,
        '<span class="img_box" datasrc="$1"><img src="$1" /></span>'
      )
      return (
        <div className="know-wrap ">
          <div className="chatAtBox" dangerouslySetInnerHTML={{ __html: newContdata1 }}></div>
          {renderThumMember()}
        </div>
      )
    } else if (selectItem.talkType === 3 || (checkIn(newArr) && Number(fromId) === Number(nowUserId))) {
      // 自己@自己、私聊他当普通消息处理
      newCon = message
        .replace($tools.regAtUser, '<span>@$1</span>')
        .replace($tools.regCharacter, '')
        .replace($tools.regEmoji, function(_: string, regStr: any) {
          const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
          return `<img class="emoji_icon" src="${imgUrl}">`
        })
      const newContdata2 = newCon.replace(
        $tools.regImg,
        '<span class="img_box" datasrc="$1"><img src="$1" /></span>'
      )
      return (
        <div className="message-info">
          {sendstate == '-1' && renderMessageStatus()}
          <div dangerouslySetInnerHTML={{ __html: newContdata2 }}></div>
          {renderThumMember()}
        </div>
      )
    } else {
      // 自己@别人
      newCon = message
        .replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
        .replace($tools.regCharacter, '')
        .replace($tools.regEmoji, function(_: string, regStr: any) {
          const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
          return `<img class="emoji_icon" src="${imgUrl}">`
        })
    }
    const newContdata = newCon
      .replace($tools.regImg, '<span class="img_box" datasrc="$1"><img src="$1" /></span>')
      .replace($tools.regLineFeed, '<br/>')
    const { handleModel } = showContent
    return (
      <div className="message-info">
        {sendstate == '-1' && renderMessageStatus()}
        <div dangerouslySetInnerHTML={{ __html: newContdata }}></div>
        {renderThumMember()}
        {fromId === nowUserId && (
          <Popover
            content={konwnPopoverTab}
            title={null}
            trigger={'click'}
            arrowPointAtCenter={false}
            onVisibleChange={() => {
              findKnowPersons(sendTime, roomJid)
            }}
            placement="topRight"
          >
            <div>
              {userNumber.knownState && userNumber.knownData.timestamp === sendTime && (
                <span className="isKnownUser">
                  {userNumber.knownData.handleCount} / {userNumber.knownData.totalCount} 已知晓
                </span>
              )}
              {!userNumber.knownState && (
                <span className="isKnownUser">
                  {handleModel ? handleModel.handleCount : 0} /
                  {handleModel ? handleModel.totalCount : spareContent?.split(',').length}
                  已知晓
                </span>
              )}
            </div>
          </Popover>
        )}
      </div>
    )
  }

  // 渲染引用消息 subtype:8
  const renderQuoteMessgage = () => {
    const { quoteMsg } = showContent
    if (quoteMsg && quoteMsg.title) {
      return (
        <div className="quote-msg">
          <RenderQuoteMsg quoteMsg={quoteMsg} action={setMsgDetails} />
          {renderThumMember()}
        </div>
      )
    } else {
      return (
        <div className="message-info">
          <div>引用消息不存在</div>
          {renderThumMember()}
        </div>
      )
    }
  }

  // 渲染地图消息 subtype:10
  const renderMapMessage = () => {
    const SC: any = showContent
    return (
      <div
        className="message-info message-address"
        ref={refComplete}
        onClick={e => {
          e.stopPropagation()
          setMsgDetails({ opencreattask: true })
        }}
      >
        <div className="message-address-tip">
          <div className="t1">{SC.message}</div>
          <div className="t2">{SC.address}</div>
        </div>
        <div id={'allmap_' + SC.time} style={{ height: '96px', width: '278px' }} className="allmap_"></div>
        {renderThumMember()}
        {/* 地图窗口详情 */}
        {msgDetails.opencreattask && (
          <ChatItemMap
            {...SC}
            visible2={msgDetails.opencreattask}
            action={(state: boolean) => {
              setMsgDetails({ opencreattask: state })
            }}
          ></ChatItemMap>
        )}
      </div>
    )
  }

  // 渲染回复消息 subtype:11
  const renderReplyMessage = () => {
    const { message, replyMessageModel, roomId } = showContent
    // 回复消息
    const newContdata = message
      .replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
      .replace($tools.regCharacter, '')
      .replace($tools.regEmoji, function(_: string, regStr: any) {
        const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
        return `<img class="emoji_icon" src="${imgUrl}">`
      })
      .replace($tools.regImg, '<span class="img_box" datasrc="$1"><img src="$1" /></span>')
      .replace($tools.regLineFeed, '<br/>')
    const replyMsg = replyMessageModel?.replyMessage
    let replyNewCont = ''
    if (replyMsg) {
      replyNewCont = replyMsg
        .replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
        .replace($tools.regCharacter, '')
        .replace($tools.regEmoji, function(_: string, regStr: any) {
          const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
          return `<img class="emoji_icon" src="${imgUrl}">`
        })
        .replace($tools.regImg, '<span class="img_box" datasrc="$1"><img src="$1" /></span>')
        .replace($tools.regLineFeed, '<br/>')
    }
    return (
      <div className="message-info reply-message-info">
        {replyMessageModel && (
          <div
            className="reply"
            onClick={() => {
              $store.dispatch({
                type: 'SET_REPLY_MODAL_DATA',
                data: { visible: true, timestamp: replyMessageModel.replyTimestamp, mucId: roomId },
              })
            }}
          >
            <div className="line">
              <div>{replyMessageModel.replyMessageFromUser}</div>
              <div dangerouslySetInnerHTML={{ __html: replyNewCont }}></div>
            </div>
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: newContdata }}></div>
        {renderThumMember()}
      </div>
    )
  }

  // 渲染文件消息
  const renderFileMessage = (fileExt: string) => {
    const { fromId, sendstate, fileName } = showContent
    // const fileType = fromId === nowUserId ? '_w' : ''
    return (
      <div className="message-info" style={{ position: 'relative' }}>
        {sendstate === '-1' && renderMessageStatus()}
        {!$tools.imgFormatArr.includes(fileExt) && (
          <div className="file-item-box" onClick={filePreview}>
            <img src={getFileIcon(fileExt, '')} />
            <span className="file-name">{fileName}</span>
          </div>
        )}
        {renderThumMember()}
      </div>
    )
  }

  const renderPictureMessage = (newCon: any) => {
    const { sendstate } = showContent
    const newContdata = newCon
      .replace($tools.regImg, '<span class="img_box" datasrc="$1"><img src="$1" /></span>')
      .replace($tools.regLineFeed, '<br/>')
    return (
      <div className="message-info" style={{ position: 'relative' }}>
        {sendstate == '-1' && renderMessageStatus()}
        <div dangerouslySetInnerHTML={{ __html: newContdata }}></div>
        {renderThumMember()}
      </div>
    )
  }

  // 渲染消息发送状态
  const renderMessageStatus = () => {
    return <i className="anewsendmsg"></i>
  }

  const renderMsgContent = () => {
    const { type, subType, messageJson, fileName, signType, sendstate, officeUrl } = showContent
    // if (type === 8 && subType === 0) {
    //   //公告消息
    //   return
    // }
    if (type === 1 || type === 3) {
      let newCon = ''
      if (type === 3) {
        /* 文件类型消息 */
        const fileExt = fileName
          ?.toLowerCase()
          .split('.')
          .splice(-1)[0]
        if ($tools.imgFormatArr.includes(fileExt)) {
          // 图片消息
          newCon = `<img className="img-around" src="${officeUrl}"/>`
          if (signType === 'file_upload') {
            return renderPictureMessage(newCon)
          }
        } else {
          // 文件消息
          return renderFileMessage(fileExt)
        }
      } else {
        // 普通消息
        newCon = messageJson
          .replace($tools.regCharacter, '')
          .replace($tools.regHttps, function(record: any) {
            const item = record.replace(/(^\s*)|(\s*$)|(&nbsp;*$)/g, '').trim()
            if (item.startsWith('http://') || item.startsWith('https://')) {
              return `<a href='${item}' target="_blank">${item}</a>`
            } else {
              return `<a href='https://${item}' target="_blank">${item}</a>`
            }
          })
          .replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
        if (selectItem.type !== 3) {
          // 不是私聊才区分高亮显示@消息
          newCon = newCon.replace($tools.regAtUser, '<span class="chatAt">@$1</span>')
        }
      }
      const newContdata = newCon
        .replace($tools.regImg, '<span class="img_box" datasrc="$1"><img src="$1" /></span>')
        .replace($tools.regLineFeed, '<br/>')
      return (
        <div className="message-info">
          {sendstate == '-1' && renderMessageStatus()}
          <div dangerouslySetInnerHTML={{ __html: newContdata }}></div> {renderThumMember()}
        </div>
      )
    } else if (subType === 6) {
      if (signType === 'forward') {
        // 转发的@消息做普通消息处理
        const newCon = messageJson
          .replace($tools.regCharacter, '')
          .replace($tools.regEmoji, function(_: string, regStr: any) {
            const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
            return `<img class="emoji_icon" src="${imgUrl}">`
          })
        const newContdata = newCon
          .replace($tools.regImg, '<span class="img_box" datasrc="$1"><img src="$1" /></span>')
          .replace($tools.regLineFeed, '<br/>')
        return (
          <div className="message-info">
            {sendstate == '-1' && renderMessageStatus()}
            <div dangerouslySetInnerHTML={{ __html: newContdata }}></div> {renderThumMember()}
          </div>
        )
      } else {
        // @消息
        return renderAtMessage()
      }
    } else if (subType === 8) {
      // 引用消息
      return renderQuoteMessgage()
    } else if (subType === 10) {
      // 地图消息
      return renderMapMessage()
    } else if (subType === 11) {
      // 回复的消息
      return renderReplyMessage()
    }
  }

  const checkIn = (arr: any) => {
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

  //选择审批人集合回调
  const selectForwardChange = (value: any) => {
    setMsgDetails({
      chatFarwardPop: {
        visible: false,
        msg: '',
        chatFarward: value,
      },
    })
  }

  //关闭选择审批人弹窗
  const closeSelectForward = () => {
    setMsgDetails({
      chatFarwardPop: {
        visible: false,
        msg: '',
      },
    })
  }

  //查询成员列表
  const findKnowPersons = (sendTime: number, muc: string) => {
    $api
      .request(
        '/im-consumer/findKnowPersons',
        {
          timestamp: sendTime,
          muc: muc,
        },
        {
          headers: { loginToken },
          formData: true,
        }
      )
      .then((resData: any) => {
        setUserNumber({ konwnUser: resData.data })
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
    if (selectItem.talkType !== 3) {
      return (
        <Popover
          content={readPopoverTab}
          title={null}
          trigger={'click'}
          onVisibleChange={getUnReadList}
          placement="topRight"
        >
          {<span className="unread-num">{!unreadNum ? '全部已读' : `${unreadNum}人未读`}</span>}
        </Popover>
      )
    } else {
      return <span className="unread-num">{unreadNum ? '未读' : '已读'}</span>
    }
  }

  // @消息已知晓未知晓人员气泡列表
  const konwnPopoverTab = () => {
    const { knowUsers, unKnowUsers } = userNumber.konwnUser
    const _knowUsers = knowUsers ? arrObjDuplicate([...knowUsers], 'id') : []
    const _unKnowUsers = unKnowUsers ? arrObjDuplicate([...unKnowUsers], 'id') : []

    return (
      <Tabs className="unread-tabs known-list-pop" defaultActiveKey="1">
        <TabPane tab="消息接收人列表" key="1" className="known-list-box">
          <div className="list_title">
            <div className="title unKnownTit">
              <span className="count">{(_unKnowUsers && _unKnowUsers.length) || 0}</span>
              <span>人未知晓</span>
            </div>
            <div className="title">
              <span className="count">{(_knowUsers && _knowUsers.length) || 0}</span>
              <span>人已知晓</span>
            </div>
          </div>
          <div className="list_content">
            <div className="left-list">
              {_unKnowUsers &&
                _unKnowUsers.length > 0 &&
                _unKnowUsers.map((item: any) => (
                  <div className="listItem" key={item.id}>
                    <Avatar className="oa-avatar" src={item.profile}>
                      {item.username && item.username.substr(-2, 2)}
                    </Avatar>
                    <span>{item.username && item.username.substr(-2, 2)}</span>
                  </div>
                ))}
            </div>
            <div className="right-list">
              {_knowUsers &&
                _knowUsers.length > 0 &&
                _knowUsers.map((item: any) => (
                  <div className="listItem" key={item.id}>
                    <Avatar className="oa-avatar" src={item.profile} key={item.id}>
                      {item.username && item.username.substr(-2, 2)}
                    </Avatar>
                    <span>{item.username && item.username.substr(-2, 2)}</span>
                  </div>
                ))}
            </div>
          </div>
        </TabPane>
      </Tabs>
    )
  }

  const { type, fromUser, profile, sendstate, roomId, commnetCount, stamp, isRecall } = showContent

  const { userId: fromId, username: fromName } = fromUser || {}

  return (
    <div className="chat-item" data-time={showContent.time}>
      {/* {type === 2 && subType === 0 && <div className="notice-msg">{message}</div>} */}
      {!(type === 8) && (
        <div
          className={$c('normal-msg flex', {
            'normal-chat': fromId !== nowUserId,
            'normal-chat-right': fromId === nowUserId,
          })}
        >
          {fromId !== nowUserId && isRecall === '0' && (
            <Avatar className="oa-avatar" src={profile}>
              {fromName && fromName.substr(-2, 2)}
            </Avatar>
          )}
          <div className="show-message flex-1">
            {/* 发消息的人 */}
            {isRecall === '0' && (
              <span className="from-name">
                <span>{fromName}</span>
                {/** 显示消息时间 */}
                <span className="show-chat-time">{moment(Number(stamp)).format('MM/DD HH:mm')}</span>
              </span>
            )}
            {/* 撤回的消息 */}
            {isRecall === '1' && (
              <div className="recverMsg">{fromId !== nowUserId ? fromName : '你'}撤回了一条消息</div>
            )}
            {/* 未撤回的消息 */}
            {isRecall === '0' && (
              <div
                className="message-main"
                onMouseEnter={() => {
                  if (!sendstate || sendstate === '0') {
                    setMsgDetails({ menuVisible: true })
                  }
                }}
                onMouseLeave={() => {
                  setMsgDetails({ menuVisible: false })
                }}
              >
                {/* 消息主体内容 */}
                <div>{renderMsgContent()}</div>
                <div style={{ clear: 'both' }}></div>
              </div>
            )}
            {/*不是撤回的消息显示*/}
            {isRecall === '0'
            // <div className="chat-myself-btn-group">
            //   {/** 显示消息时间 */}
            //   {/* <span className="show-chat-time">{moment(Number(time)).format('MM月DD日 HH:mm')}</span> */}
            //   {/* 显示消息已读未读数 */}
            //   {fromId === nowUserId && sendstate !== '-1' && renderReadPopover()}
            //   {/* 消息回复数量 */}
            //   {commnetCount && commnetCount > 0 ? (
            //     <span
            //       className="discussNum"
            //       onClick={() => {
            //         $store.dispatch({
            //           type: 'SET_REPLY_MODAL_DATA',
            //           data: { visible: true, timestamp: stamp, mucId: roomId },
            //         })
            //         $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
            //       }}
            //     >
            //       {commnetCount}条回复
            //     </span>
            //   ) : (
            //     ''
            //   )}
            // </div>
            }
          </div>
          {fromId === nowUserId && isRecall === '0' && (
            <Avatar className="oa-avatar" src={profile}>
              {fromName && fromName.substr(-2, 2)}
            </Avatar>
          )}
        </div>
      )}
      {msgDetails.detailHistory.visible && (
        <TaskReportModel
          param={{ ...msgDetails.detailHistory, type: 1 }}
          setvisible={(state: any) => {
            setMsgDetails({ detailHistory: { ...msgDetails.detailHistory, visible: state } })
          }}
        />
      )}

      {msgDetails.reportDetails.visible && (
        <ReportDetails
          param={{
            reportId: msgDetails.reportDetails.reportId,
            isVisible: msgDetails.reportDetails.visible,
            isMuc: 1,
          }}
          setvisible={(state: any) => {
            setMsgDetails({ reportDetails: { ...msgDetails.reportDetails, visible: state } })
          }}
        />
      )}
      {msgDetails.opentaskdetail.visible && (
        <DetailModal
          param={{
            visible: msgDetails.opentaskdetail.visible,
            from: 'chatmsg',
            id: msgDetails.opentaskdetail.id,
            taskData: {},
          }}
          setvisible={(state: any) => {
            setMsgDetails({ opentaskdetail: state })
          }}
        ></DetailModal>
      )}
      {/* 任务详情 */}
      {/* 转发至 */}
      {msgDetails.chatFarwardPop.visible && (
        <ChatForwardModal
          visible={msgDetails.chatFarwardPop.visible}
          chatMsg={msgDetails.chatFarwardPop.msg}
          teamId={selectItem.belongTypeId}
          onSelected={selectForwardChange}
          onCancelModal={closeSelectForward}
          dataAuth={true}
          findType={0}
          permissionType={3}
          isQueryAll={1}
          nodeSelected={msgDetails.chatFarwardPop.chatFarward}
          pageSize={10}
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

export default ChatItem

export const addBrowse = async (fileGuid: string) => {
  if (!fileGuid) {
    return
  }
  const { nowUserId, nowAccount } = $store.getState()
  const $$token = await getChatToken({
    companyId: nowAccount,
    userId: nowUserId,
    otherFile: 1,
  })
  axios({
    method: 'post',
    url: `${FILEHOST}/api/EnterpriseCloudDisk/AddBrowse`,
    headers: {
      Token: $$token,
    },
    data: {
      userId: `${nowUserId}`,
      fileGUID: fileGuid,
    },
  })
    .then((res: any) => {
      console.log(res)
    })
    .catch(err => {
      console.log(err)
    })
}

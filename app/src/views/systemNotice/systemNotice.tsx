import React, { useEffect, useRef } from 'react'
import { message, Tooltip } from 'antd'
import { useSelector } from 'react-redux'
import { ipcRenderer } from 'electron'
import './index.less'
import { CloseOutlined } from '@ant-design/icons'
// import { findUserUnReadMuc } from '../chat-Tip-Win/getData'
import { getSystemState, ReadCancelMsg } from '../workdesk/getData'
import $c from 'classnames'
import { setApprovalData } from '../workdesk/TaskListData'

interface SystemMsgsProps {
  id: number
  teamId: number
  source: string
  content: string
  receiveTime: string
  noticeType: string
  noticeTypeId: number
  mobileData: string
  spareId: number
}

/* eslint-disable */
// 消息状态枚举
// const noticeStatusEnum = {
//   unconfirmed_meeting: '未开始', //未确认会议
//   unconfirmed_meeting_update: '未开始', //会议变更
//   unconfirmed_meeting_remind: '未开始', //会议提箱
//   force_report_lazy: '进行中', //强制汇报：待写
//   // force_report_time_out: '进行中', //强制汇报提醒：时间到
//   task_synergy: '进行中', //任务邀请参与企业协同
//   approval_send: '审批中', //他人向我发起的审批处理通知
//   approval_urge: '审批中', //审批催办
//   touch_approval: '待发起', //触发审批
//   reject_approval: '审批中', //驳回审批
//   follow_request: '', //关注人协同请求
//   invite: '', //邀请
//   rule: '', //公告
//   check_comment_at_me: '进行中', //检查项@我的
//   task_report_at_me: '进行中', //任务汇报@我
//   report_send: '进行中', //收到任务汇报
//   remarks_opinion_at_me: '进行中', //备注意见@我的
//   remarks_opinion_comment_at_me: '进行中', //备注评论@我的
//   approval_remarks_at_me: '进行中',
//   approval_remarks_comment_at_me: '进行中',
//   task_talk_at_push: '', //聊天【群组@】推送
// }

const SystemNoticeWin = () => {
  // const { nowUserId, nowAccount, nowUser, loginToken } = $store.getState()
  // 公告签收所需数据
  // const noticeDetailProps = useSelector((state: any) => state.noticeDetailProps)
  // 代办通知消息的所有数据
  const systemMsgs = useSelector((state: StoreStates) => state.systemMsgs)

  // 代办通知消息的最新一条数据
  const currentMsg = systemMsgs.length && systemMsgs[systemMsgs.length - 1]

  const { id, content, spareContent, mobileData, noticeType, noticeTypeId, commentId, spareId } = currentMsg

  const { title } = mobileData || {
    userName: '',
    profile: '',
    title: '',
    groupName: '',
    typeName: '',
    roomName: '',
    entTime: '',
  }

  useEffect(() => {
    if (!systemMsgs.length || !currentMsg) {
      // 没有消息通知时关闭窗口
      ipcRenderer.send('close_notice_window')
    }
    ipcRenderer.on('window-show', () => {
      if (!systemMsgs.length || !currentMsg) {
        // 没有消息通知时关闭窗口
        ipcRenderer.send('close_notice_window')
      }
    })
    // 右下角相关操作成功后关闭窗口
    ipcRenderer.on('handleMessageOption', (e, args) => {
      //arg[1] noticeType
      //arg[2] noticeTypeId
      dealSysMsg(1, args[1], args[2])
    })
    //全局存储消息类型和noticeTypeId
    const type = currentMsg.noticeType
    $store.dispatch({
      type: 'RECALL_INFO_MSG',
      data: {
        noticeTypeId: type == 'task_talk_at_push' ? currentMsg.spareId : currentMsg.noticeTypeId,
        noticeType: currentMsg.noticeType,
      },
    })
    if (currentMsg.noticeType == 'rule') {
      ipcRenderer.send('update_unread_num', ['notice_count'])
    } else {
      ipcRenderer.send('update_unread_num', [currentMsg.noticeTypeId])
    }
  }, [])

  // 忽略全部
  const ignoreAll = () => {
    // 关闭弹出层
    ipcRenderer.send('close_notice_window')
    // 清空消息推送
    $store.dispatch({ type: 'SET_SYSTEM_MSG', data: { systemMsgs: [] } })
  }

  /**操作按钮事件:稍后处理、拒绝处理
   * msgId===0只有再noticeTypeId不明确的情况下存在，后续会进行调整，
   * @param _type
   * @param msgId
   */
  const dealSysMsg = (_type: number, msgId?: number, msgType?: string) => {
    const result = [...systemMsgs]
    if (_type === 0 || msgId === 0) {
      // 稍后处理
      result.map((item: SystemMsgsProps, index: number) => {
        if (item.noticeType === noticeType && item.noticeTypeId === noticeTypeId && item.spareId === spareId) {
          result.splice(index, 1)
        }
      })
    } else {
      //数组删除需要缓存长度，否则删除不彻底
      for (let i = result.length - 1; i >= 0; i--) {
        //匹配noticeType一样并且noticeTypeId一样的从消息列表中删除
        if (msgType == 'task_talk_at_push') {
          if (result[i].spareId === msgId && result[i].noticeType === msgType) {
            result.splice(i, 1)
          }
        } else {
          if (result[i].noticeTypeId === msgId && result[i].noticeType === msgType) {
            result.splice(i, 1)
          }
        }
      }
    }
    //打开窗口
    if (result.length > 0) {
      ipcRenderer.send('close_notice_window')
      setTimeout(() => {
        ipcRenderer.send('show_notice_window')
      }, 10)
    } else {
      ipcRenderer.send('close_notice_window')
    }
    //关闭未读信息列表
    $store.dispatch({
      type: 'SAVE_UNREAD_INFO',
      data: [],
    })
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXX---------------------------------')
    ipcRenderer.send('change_tray_icon') //关闭消息闪烁
    // 更新未读消息
    $store.dispatch({
      type: 'SET_SYSTEM_MSG',
      data: {
        systemMsgs: result.length > 0 ? result : [],
      },
    })
  }

  const handleMessage = (custom?: any) => {
    // 打开主窗口
    ipcRenderer.send('show_home')
    const isAtme = noticeType == 'remarks_opinion_comment_at_me' || noticeType == 'remarks_opinion_at_me'
    //备注不存在
    if (isAtme && currentMsg.flag == 1) {
      message.error('数据不存在')
      //异常自动处理
      ReadCancelMsg(noticeTypeId).then(() => {
        dealSysMsg(1, noticeTypeId, noticeType)
        ipcRenderer.send('update_unread_num', [noticeTypeId]) //刷新侧边栏+代办列表+数字统计
      })
      return false
    }
    //校验消息状态
    const findParam = {
      id: id,
      type: noticeType,
      typeId: noticeTypeId,
      commentId: commentId,
      userId: $store.getState().nowUserId,
      spareId: spareId,
    }
    getSystemState(findParam)
      .then((res: any) => {
        if (res.returnCode == 0 && res.data === 1) {
          message.error('数据已失效')
          setTimeout(() => {
            dealSysMsg(1, noticeTypeId, noticeType)
          }, 1000)
          //异常自动处理
          ReadCancelMsg(id).then(() => {
            dealSysMsg(1, noticeTypeId, noticeType)
            ipcRenderer.send('update_unread_num', [noticeTypeId]) //刷新侧边栏+代办列表+数字统计
          })
        } else {
          $store.dispatch({
            type: 'HANDLE_MESSAGE',
            data: {
              isHandleMeassage: true,
              currentNowMsg: currentMsg,
            },
          })
          setApprovalData(noticeType, currentMsg)
          ipcRenderer.send('handle_messages', [true, currentMsg, custom])
        }
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }

  /**
   * 渲染界面相关
   */
  /**
   * 获取指派类型
   */
  const getBugType = () => {
    let bugType = ''
    switch (noticeType) {
      case 'chan_dao_bug':
        bugType = 'BUG'
        break
      case 'chan_dao_need':
        bugType = '需求'
        break
      case 'chan_dao_task':
        bugType = '任务'
        break
    }
    return bugType
  }
  //渲染问候语
  const renderGreet = () => {
    if (noticeType === 'rule') {
      // return `Hi！${nowUser}，我发布了一则公告，请及时查看并签收， 谢谢！`
      const regTxt = $tools.htmlDecodeByRegExp(content)
      // return content?.replace(/&amp;/g, '&')
      return regTxt
    } else if (noticeType === 'invite') {
      // 邀请加入企业
      return content
      // return `Hi！${nowUser}，我诚挚地邀请你加入企业[${teamName}]！开心工作， 创造价值！`
    } else if (noticeType === 'force_report_time_out' || noticeType === 'force_report_lazy') {
      // 强制汇报
      return content
      // return `Hi！${nowUser}，我为你设置的截止为${spareContent}的任务汇报，请及时处理哦！`
    } else if (noticeType === 'approval_urge') {
      // 审批催办
      return content
      // return `Hi！${nowUser}，我发起的审批因时间紧急，需要麻烦你尽快处理一下，谢谢！`
    } else if (noticeType === 'task_synergy') {
      return content
      // return `Hi！${nowUser}，我邀请你作为企业[${teamName}]的联系人参与任务协同。`
    } else if (noticeType === 'follow_request') {
      //申请关注工作台
      return content
      // return `Hi！${nowUser}，是否可以关注你的工作台，和你一起协作处理事项？`
    } else if (noticeType == 'work_report_at_me' || noticeType == 'work_report_comment_at_me') {
      return content
    } else if (
      noticeType === 'reject_approval' ||
      noticeType === 'touch_approval' ||
      noticeType === 'approval_send' ||
      noticeType === 'remarks_opinion_at_me' ||
      noticeType === 'approval_remarks_at_me' ||
      noticeType === 'approval_remarks_comment_at_me' ||
      noticeType === 'check_comment_at_me' ||
      noticeType === 'force_report_clear' ||
      noticeType === 'force_report_update' ||
      noticeType === 'force_report_set' ||
      noticeType === 'unconfirmed_meeting_update' ||
      noticeType === 'task_report_at_me' ||
      noticeType === 'work_report_remind' ||
      noticeType === 'task_todo_know' || //任务待办已知晓通知
      noticeType === 'task_report_comment_at_me' ||
      noticeType === 'remarks_opinion_comment_at_me'
    ) {
      //触发审批、发起审批、任务@我的、会议主题
      // return `${$tools.htmlDecodeByRegExp(title)}`
      return content
    } else if (noticeType === 'unconfirmed_meeting' || noticeType === 'unconfirmed_meeting_remind') {
      return `${content}【${title}】`
    } else if (
      noticeType === 'chan_dao_bug' ||
      noticeType === 'chan_dao_need' ||
      noticeType === 'chan_dao_task'
    ) {
      const spare = JSON.parse(spareContent)
      const rTitle = $tools.htmlDecodeByRegExp(title)
      return (
        // <Tooltip placement="top" title={rTitle}>
        <span>
          <span style={{ marginRight: '10px' }}>{spare.sendUsername}</span>
          <span>指派了{getBugType()}给你：</span>【{noticeTypeId}】{rTitle}
        </span>
        // </Tooltip>
      )
    } else if (noticeType === 'task_talk_at_push') {
      // 普通消息
      const regx = /@([\u4e00-\u9fa5_a-zA-Z0-9]+)(\s{1})/gi
      const reg = /\[bq_(\w+)\]/gi
      const regImg = /\^\!\*/gi
      const newCon = content
        .replace(regx, '<span class="chatAt">@$1</span>')
        .replace(regImg, '')
        .replace(reg, function(_: string, regStr: any) {
          const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
          return `<img class="emoji_icon" src="${imgUrl}">`
        })
      const regTest = /<img [^>]*src=['"]([^'"]+)[^>]*>/g
      const newContdata = newCon.replace(
        regTest,
        '<span class="img_box img_info_box" datasrc="$1"><img src="$1" /></span>'
      )
      return <div dangerouslySetInnerHTML={{ __html: newContdata }}></div>
    }
  }

  // 汇报设置通知
  const reportNoticeTypeEnum = ['force_report_clear', 'force_report_update', 'force_report_set']

  return (
    <div
      className="noticeWinContent"
      style={{
        borderTop: '1px solid #e3e4e4',
        borderBottom: '1px solid #e3e4e4',
        borderRight: '1px solid #e3e4e4',
      }}
    >
      <div
        className={$c('systemNotice', {
          'report-set-notice-content': reportNoticeTypeEnum.includes(noticeType),
        })}
      >
        {reportNoticeTypeEnum.includes(noticeType) && (
          <div
            className="closeWindows"
            onClick={() => {
              // ipcRenderer.send('close_notice_window')
              ipcRenderer.send('handle_messages_option', ['force_report_time_out', noticeTypeId, noticeType])
            }}
          >
            <span className="close-icon"></span>{' '}
          </div>
        )}

        <div
          className="mainContent"
          style={{ cursor: 'pointer' }}
          onClick={e => {
            let _custom: any
            if (
              noticeType === 'unconfirmed_meeting' ||
              noticeType === 'unconfirmed_meeting_update' ||
              noticeType === 'unconfirmed_meeting_remind' ||
              noticeType === 'check_comment_at_me' ||
              noticeType === 'task_report_at_me' ||
              noticeType === 'remarks_opinion_at_me' ||
              noticeType === 'remarks_opinion_comment_at_me' ||
              noticeType === 'approval_remarks_at_me' ||
              noticeType === 'approval_remarks_comment_at_me' ||
              noticeType === 'force_report_update' ||
              noticeType === 'force_report_set' ||
              noticeType === 'force_report_clear' ||
              noticeType == 'work_report_at_me' ||
              noticeType == 'work_report_comment_at_me' ||
              noticeType == 'task_report_comment_at_me' ||
              noticeType == 'task_todo_know'
            ) {
              _custom = -1
            }
            e.stopPropagation()
            handleMessage(_custom)
          }}
        >
          {/*问候语 */}
          <div className="greetMsg">{renderGreet()}</div>
        </div>

        {!reportNoticeTypeEnum.includes(noticeType) && (
          <div className="ignore-box" style={{ textAlign: 'right' }}>
            <span className="ignore" onClick={ignoreAll}>
              忽略全部
            </span>
          </div>
        )}
        <CloseOutlined className="close_icon" onClick={ignoreAll} />
      </div>
    </div>
  )
}

export default SystemNoticeWin

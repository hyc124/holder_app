import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { ipcRenderer } from 'electron'
import $c from 'classnames'
// import InfiniteScroll from 'react-infinite-scroller'
import { Tooltip, List, message, Spin, Modal, Input, Menu, Dropdown, Button, Checkbox } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import NoticeDetails from '@/src/components/notice-details/index'
import NoneData from '@/src/components/none-data/none-data'
import { operateInviteLinkUser, checkNoticeState } from '@/src/views/system-notice-info/getData'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import { dateFormats } from '@/src/common/js/common'
import MeetDetails from '../mettingManage/component/MeetDetails'
import DeskFollowPop from '../coordination/deskFollow'
import TaskReportModel from '../workReport/component/TaskReportModel'
import ReplayMsg from './component/ReplayMsg/ReplayMsg'
import OrgInvitationPlug from './component/org-invitation-plug/org-invitation-plug'
import InviteLinkUserModal from '@/src/views/coordination/inviteLinkUserModal'
import { useMergeState } from '../chatwin/ChatWin'
import { refreshFollowList } from './FollowUser'
import ReportDetails from '../workReport/component/ReportDetails'
import moment from 'moment'
import {
  agreeRefuse,
  ReadCancelMsg,
  queryMeetInfo,
  handelMeetStatus,
  addRemind,
  deskFollow,
  getSystemState,
  queryWaitTaskList,
  newQueryTeamList,
  removeTaskWaitApi,
  isKnowTaskWaitApi,
  CountToDoCondition,
  openWindow,
} from './getData'
import './workDeskFbulous.less'
import './toDoList.less'
import WeekDateComp from './component/weekDataCom'
import { getAuthStatus } from '@/src/common/js/api-com'
import { NEWAUTH812 } from '@/src/components'
import { getLocalRoomData } from '../myWorkDesk/chat/ChatList'
import { insertChatRoom } from '../chatwin/getData/ChatInputCache'

const { TextArea } = Input

interface ModuleNumProps {
  count: number
  code: string
}
interface EnlargeProps {
  code: string //当前code
  refreshCode?: string //当前刷新code
  refresh?: any // 是否刷新
  isFollow?: boolean //是否关注人
  isFullScreen?: boolean //是否全屏
}
//暴露刷新列表方法
let refreshFn: any = null
export const refreshPage = () => {
  refreshFn && refreshFn()
}
// 缓存日期空间显示
let weekDateShow = true
// 暴露内部时间空间显示隐藏方法
export let setTodoWeekPlugShowFn: any = null
// state 初始值
const initState = {
  moduleNums: [], //代办@数量
  taskData: [], //列表项数据
  listPageNo: 0, //数据页码
  totalPages: 0, //列表总页
  currentData: null,
  defaultDetailActiveKey: '', //控制动态详情激活tabs
  inviteUserVisible: false, //邀请任务类弹框
  loading: false,
  hasMore: true,
  leaveVisible: false,
  joinVisible: false,
  hintUse: false,
  hintNote: false,
  isToDay: true,
  detailModalVisible: false,
  meetModalVisible: false, //会议邀请
  deskFollowVisible: false, //工作台关注
  inviteVisible: false, //企业邀请
  detailsModel: false, //任务详情
  reportDetailsModel: false, //汇报详情

  quickParam: {
    //快捷回复参数定义
    noticeType: '',
    loadReplay: false,
    item: {},
    type: 0,
  },
  golbalParams: {
    //全局参数
    leaveValue: '',
    meetIdRefer: 0, //会议ID
    meetData: {}, //会议信息
    reminderObj: {
      reminderVal: '无提醒', //提醒时常
      reminder: '0',
    },
    navactive: ['3'],
    dateActive: 0,
    dateformat: '', //存储周对应的日期
    dateArr: [], //存储周对应的日期-天
    disposeType: 0,
    itemParam: {
      noticeType: '',
      noticeTypeId: 0,
    },
  },
}

// 控制代办时间控件显示隐藏
const openWeekDatePlug = (show?: boolean) => {
  if (show) {
    $('.week_navbar')
      .removeClass('heightO')
      .addClass('heightFull')
      .next()
      .removeClass('widthHalf')
      .addClass('widthFull')
  } else {
    $('.week_navbar')
      .removeClass('heightFull')
      .addClass('heightO')
      .next()
      .removeClass('widthFull')
      .addClass('widthHalf')
  }
}

export const TaskListData = ({ code, refresh, refreshCode, isFollow }: EnlargeProps) => {
  const { nowUserId, nowAccount, followUserInfo } = $store.getState()
  const iIemRef = useRef<any>(null)
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  const taskWaitData: any = useSelector((store: StoreStates) => store.taskWaitData) //系统推送消息
  // 合并内部state
  const [state, setState] = useMergeState({ ...initState })

  const listRef = useRef<any>(null)

  const $teamId = !isFollow ? selectTeamId : followSelectTeadId
  const { navactive, dateformat } = state.golbalParams
  // 详情弹框组件
  let detailModalRef: any = useRef<any>(null)
  let isUnmounted = false
  // const setState = (obj: any) => {
  //   setInitState(obj)
  //   setStates(obj)
  // }
  setTodoWeekPlugShowFn = (show?: boolean) => {
    weekDateShow = show || !weekDateShow
    openWeekDatePlug(weekDateShow)
  }
  //初始化
  useEffect(() => {
    const $DATE = new Date()
    const $MONTH = $DATE.getMonth() + 1
    const $YEAR = $DATE.getDate()
    const $NOWYEAR = $DATE.getFullYear()
    const $NOWDAY =
      $NOWYEAR + '-' + ($MONTH < 10 ? '0' + $MONTH : $MONTH) + '-' + ($YEAR < 10 ? '0' + $YEAR : $YEAR)
    const $wkInfo = getWeekDay($NOWDAY)

    setState({
      golbalParams: {
        ...state.golbalParams,
        dateActive: getWeekIndex($YEAR, $wkInfo),
        dateformat: $NOWDAY,
        dateArr: $wkInfo,
      },
    })
    const SIGN = ['update_unread_num', 'open_chandao_window', 'handerForceReport_info']
    ipcRenderer.removeAllListeners(SIGN[0]).on(SIGN[0], (event, args) => {
      //这儿的方法主要刷新待办,红点,企业对应的数字统计
      refreshDesk({
        isTip: false,
        noticeTypeId: 0,
        noticeType: '',
        args: args[0],
      })
    })

    ipcRenderer.removeAllListeners(SIGN[1]).on(SIGN[1], (event, args) => {
      getChandaoUrl({
        address: args.address,
        type: args.type,
        id: args.id,
      })
    })
    // 订阅强制汇报操作,刷新列表和统计
    ipcRenderer.removeAllListeners(SIGN[2]).on(SIGN[2], () => {
      //这儿的方法主要刷新待办,红点,企业对应的数字统计
      refreshDesk({
        isTip: false,
        noticeTypeId: 0,
        noticeType: '',
      })
    })
    // 右下角相关操作成功后刷新工作台侧边栏企业
    ipcRenderer.on('refresh_desk_module', (e, args) => {
      refreshDesk({
        isTip: args[0],
        noticeTypeId: args[1],
        noticeType: args[2],
        args: args[3],
      })
    })

    return () => {
      detailModalRef = null
      refreshFn = null
      weekDateShow = true
      setTodoWeekPlugShowFn = null
      $('.todoListContaier').off('mousewheel')
    }
  }, [])

  // 监听系统存在推送
  useEffect(() => {
    taskWaitData && initDatasFn()
  }, [taskWaitData])

  //列表刷新监听
  useEffect(() => {
    isUnmounted = false
    if ($teamId && dateformat) {
      setState({
        listPageNo: 0,
        loading: true,
      })
      $(listRef.current).scrollTop(0)
      refreshFn && refreshFn()
    }
    return () => {
      isUnmounted = true
    }
  }, [navactive, dateformat])

  //企业id监听
  useEffect(() => {
    if ($teamId) {
      if (dateformat && code == refreshCode) {
        initDatasFn()
      } else {
        queryWaitNums()
      }
    }
  }, [$teamId, refresh])

  // 监听code变化
  // useEffect(() => {
  //   if (code == refreshCode) {
  //     initDatasFn()
  //   }
  // }, [refresh])

  // 组件加载完毕，挂载滚动事件
  // useLayoutEffect(() => {
  // 绑定表格滚动事件
  $('.todoListContaier')
    .off('mousewheel')
    .on('mousewheel', '.demo-infinite-container', (e: any) => {
      // 下滚加载分页
      if (e.originalEvent.wheelDelta <= 0) {
        handleInfiniteOnLoad()
      } else {
        // 上滚至顶部显示时间控件
        // 监听表格滚动事件
        // const scrollTable = $(listRef.current)
        // const scrollTop = scrollTable.scrollTop() || 0 //滚动高度
        // if (e.originalEvent.wheelDelta > 0 && scrollTop === 0 && !weekDateShow) {
        //   // 判断当前时间控件是否显示
        //   weekDateShow = !weekDateShow
        //   openWeekDatePlug(weekDateShow)
        // }
      }
    })
  // }, [])
  // 初始加载统计+列表
  const initDatasFn = () => {
    setState({
      listPageNo: 0,
      loading: true,
    })
    $(listRef.current).scrollTop(0)
    queryWaitNums()
    refreshFn && refreshFn()
  }

  //抛出外部调用方法
  refreshFn = () => {
    getWaitInfo(true)
      .then(data => {
        if (!isUnmounted) {
          // console.log('刷新待办数据', data)
          setState({
            taskData: data.content,
            totalPages: data.totalPages,
            loading: false,
          })
        }
      })
      .catch(() => {
        setState({
          hasMore: false,
        })
      })
  }

  /**
   * 查询代办任务列表
   * @param isReset
   * @returns
   */
  const getWaitInfo = (isReset?: boolean) => {
    return new Promise<any>((resolve, reject) => {
      const queryParams = {
        navActive: state.golbalParams.navactive,
        dateFormat: state.golbalParams.dateformat,
      }
      const pageNo = isReset ? 0 : state.listPageNo
      queryWaitTaskList(queryParams, pageNo, isFollow)
        .then((data: any) => {
          resolve(data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  /**
   * 滚动加载
   */
  const handleInfiniteOnLoad = () => {
    // 判断当前时间控件是否显示
    if (weekDateShow) {
      weekDateShow = !weekDateShow
      openWeekDatePlug(weekDateShow)
    }
    if (!state.hasMore) return
    // 监听表格滚动事件
    const scrollTable = $(listRef.current)
    const viewH = scrollTable.height() || 0 //可见高度
    const contentH = scrollTable[0].scrollHeight || 0 //内容高度
    const scrollTop = scrollTable.scrollTop() || 0 //滚动高度
    if (contentH - viewH - scrollTop <= 25) {
      // 防止多次触发，等本次加载完
      state.hasMore = false
      state.listPageNo = state.listPageNo + 1

      const param = {
        navActive: state.golbalParams.navactive,
        dateFormat: state.golbalParams.dateformat,
      }

      queryWaitTaskList(param, state.listPageNo, isFollow).then((data: any) => {
        state.hasMore = data.content.length > 0 ? true : false
        setState({
          taskData: [...state.taskData, ...data.content],
        })
      })
    }
  }

  /**
   * 日期切换
   * @param index
   * @param day
   */
  const handele = (index: number, day: number) => {
    $(listRef.current).scrollTop(0)

    const d = new Date()
    const weekDays = getWeekDate()

    setState({
      listPageNo: 0,
      golbalParams: {
        ...state.golbalParams,
        dateActive: index,
        dateformat: weekDays[index],
      },
      isToDay: day == d.getDate(),
    })
  }

  /**
   * 导航切换
   * @param type
   */
  const changeNavActive = (types: number[]) => {
    queryWaitNums()

    $(listRef.current).scrollTop(0)
    state.hasMore = true
    setState({
      listPageNo: 0,
      golbalParams: {
        ...state.golbalParams,
        navactive: types,
      },
    })
  }

  /**
   * 更新当前红点展示状态
   * @param noticeId
   */
  const refreshDotSHow = (noticeId: number) => {
    const newData: any = [...state.taskData]
    for (let i = 0; i < newData.length; i++) {
      if (noticeId == newData[i].noticeTypeId) {
        newData[i].isRead = 1
        break
      }
    }

    setState({
      taskData: newData,
    })
  }

  /**
   * 查询分类数量
   */
  const queryWaitNums = () => {
    CountToDoCondition(
      {
        userId: !isFollow ? nowUserId : followUserInfo.userId,
      },
      isFollow
    ).then((data: any) => {
      const list = data.dataList || []

      setState({
        moduleNums: list,
      })
    })
  }

  /**
   * 刷新右侧数据和待办列表
   * @param $params
   */
  const refreshDesk = ($params: {
    isTip: boolean
    noticeTypeId: number
    noticeType: string
    args?: string
  }) => {
    const { isTip, noticeTypeId, noticeType, args } = $params
    if (isTip) {
      message.error('该待办已失效或过期')
      //关闭推送弹窗
      ipcRenderer.send('handle_messages_option', ['chandao', noticeTypeId, noticeType])
    }
    //再次数据数量+刷新待办列表
    refreshFn && refreshFn()
    //重新加载筛选统计数量
    queryWaitNums()
    //刷新粉丝数
    refreshFollowList(1)
    //刷新沟通或会议红点
    ipcRenderer.send('refresh_meet_connect')
    newQueryTeamList({
      type: -1,
      userId: $store.getState().nowUserId,
      username: $store.getState().nowAccount,
    }).then((data: any) => {
      const list = data.dataList || []
      //设置企业列表信息
      const paramData = list.map((item: any) => {
        return {
          ...item,
          timestamp: new Date().getTime(),
        }
      })
      $store.dispatch({
        type: 'SAVE_TEAM_LIST_INFO',
        data: list,
      })
      $store.dispatch({
        type: 'SAVE_ORGINFO',
        data: {
          orgInfo: paramData,
        },
      })
      if (args) {
        setTimeout(function() {
          ipcRenderer.send('update_unread_msg', [args, false])
        }, 500)
      }
    })
  }

  /**
   * 邀请类同意拒绝
   * @param params 当前数据参数
   */
  const invitationAgree = (params: any) => {
    const { index, result, item } = params
    const { id, noticeTypeId, noticeType } = item
    getSystemState({
      id: id,
      type: item.noticeType,
      typeId: noticeTypeId,
      commentId: item.commentId,
      userId: $store.getState().nowUserId,
      spareId: item.spareId,
    }).then((res: any) => {
      // 如果data返回为1则表示数据已经异常
      if (res.returnCode == 0 && res.data === 1) {
        //异常自动处理
        ReadCancelMsg(id)
          .then(() => {
            refreshDesk({
              isTip: true,
              noticeTypeId,
              noticeType,
              args: 'invite_count',
            })
            ipcRenderer.send('handle_messages_option', ['all', noticeTypeId, noticeType])
          })
          .catch(err => {
            refreshDesk({
              isTip: true,
              noticeTypeId,
              noticeType,
              args: 'invite_count',
            })
            ipcRenderer.send('handle_messages_option', ['all', noticeTypeId, noticeType])
          })
        return false
      } else {
        setState({
          loading: true,
        })
        if (item.noticeType === 'follow_request') {
          deskFollow({ id: noticeTypeId, state: result })
            .then((res: any) => {
              if (res.returnCode == 0) {
                message.success('操作成功！')
                refreshDesk({
                  isTip: false,
                  noticeTypeId,
                  noticeType,
                  args: 'invite_count',
                })
                //关闭推送弹窗
                ipcRenderer.send('handle_messages_option', ['follow', noticeTypeId, noticeType])
              } else {
                message.error(res.returnMessage)
              }
            })
            .catch(err => {
              message.error(err.returnMessage)
            })
        } else if (item.noticeType === 'task_synergy') {
          // 邀请成为企业联系人
          operateInviteLinkUser({
            taskId: item.noticeTypeId,
            userId: nowUserId,
            teamId: item.teamId,
            result: result,
          })
            .then(() => {
              message.success('操作成功！')
              const copyData = [...state.taskData]
              const ISHAS = copyData.some((item: any) => {
                return id === item.id
              })
              if (ISHAS) {
                copyData[index].disposeType = 1
              }
              setState({
                loading: true,
                taskData: copyData,
              })
              refreshDotSHow(noticeTypeId)
              refreshDesk({
                isTip: false,
                noticeTypeId,
                noticeType,
                args: 'invite_count',
              })
              ipcRenderer.send('handle_messages_option', ['invite', noticeTypeId, noticeType])
            })
            .catch(err => {
              message.error(err)
              setState({
                loading: false,
              })
              refreshDotSHow(noticeTypeId)
            })
        } else {
          agreeRefuse({
            id: noticeTypeId,
            result: result,
          }).then(
            () => {
              message.success('操作成功！')
              const copyData = [...state.taskData]
              const ISHAS = copyData.some((item: any) => {
                return id === item.id
              })
              if (ISHAS) {
                copyData[index].disposeType = 1
              }
              setState({
                loading: false,
                taskData: copyData,
              })
              refreshDotSHow(noticeTypeId)
              refreshDesk({
                isTip: false,
                noticeTypeId,
                noticeType,
                args: 'invite_count',
              })
              ipcRenderer.send('handle_messages_option', ['invite', noticeTypeId, noticeType])
            },
            msg => {
              setState({
                loading: false,
              })
              refreshDotSHow(noticeTypeId)
              refreshDesk({
                isTip: false,
                noticeTypeId,
                noticeType,
                args: 'invite_count',
              })
              message.error(msg.returnMessage)
            }
          )
        }
      }
    })
  }

  /**
   * 更新左侧未读数量待办红点
   * @param noticeTypeId
   * @param noticeType
   */
  const refreshOption = (noticeTypeId: number, noticeType: string) => {
    refreshDesk({
      isTip: false,
      noticeTypeId,
      noticeType,
      args: 'meeting_count',
    })
    refreshDotSHow(noticeTypeId)
  }

  /**
   * 汇报操作
   * @param e
   * @param params
   * @param type true提交
   */
  const reportHandel = (e: any, params: any, type?: boolean) => {
    e.stopPropagation()
    const tipsInfo = {
      isTip: true,
      noticeTypeId: params.noticeTypeId,
      noticeType: params.noticeType,
      args: 'work_report_remind',
    }
    if (!!type) {
      if (params.flag === 1) {
        ReadCancelMsg(params.id).then(() => {
          tipsInfo.isTip = true
          refreshDesk(tipsInfo)
        })
        return
      }
      $store.dispatch({
        type: 'WORKREPORT_TYPE',
        data: {
          isEcho: true,
          wortReportType: 'create',
          reportTemplateId: params.noticeTypeId,
          teamId: params.teamId,
          wortReportTtime: Math.floor(Math.random() * Math.floor(1000)),
          spareContent: params.spareContent,
        },
      })
      $tools.createWindow('WorkReport')
      return
    }
    getSystemState({
      id: params.id,
      type: params.noticeType,
      typeId: params.noticeTypeId,
      commentId: params.commentId,
      userId: $store.getState().nowUserId,
      spareId: params.spareId,
    }).then((res: any) => {
      if (res.returnCode == 0) {
        //异常自动处理
        ReadCancelMsg(params.id).then(() => {
          //刷新待办列表
          tipsInfo.isTip = false
          message.success('操作成功')
          refreshDesk(tipsInfo)
        })
      }
    })
  }

  /**
   * <会议>
   * 请假-参加
   * flag 0请假 1参加
   * @param parmas
   */
  const attendMeeting = (parmas: any, flag: number) => {
    const { noticeTypeId, noticeType, commentId, id, spareId } = parmas
    setState({
      golbalParams: {
        ...state.golbalParams,
        itemParam: {
          noticeType: noticeType,
          noticeTypeId: noticeTypeId,
        },
      },
    })
    getSystemState({
      id: id,
      type: noticeType,
      typeId: noticeTypeId,
      commentId: commentId,
      userId: $store.getState().nowUserId,
      spareId: spareId,
    }).then((res: any) => {
      if (res.returnCode == 0 && res.data === 1) {
        //再次数据数量+刷新待办列表
        refreshDesk({
          isTip: true,
          noticeTypeId,
          noticeType,
          args: 'meeting_count',
        })
        //异常自动处理
        ReadCancelMsg(id)
        return false
      } else {
        //记录会议ID
        // setState({
        //   golbalParams: {
        //     ...state.golbalParams,
        //     meetIdRefer: noticeTypeId,
        //   },
        // })
        queryMeetInfo(noticeTypeId).then(
          (res: any) => {
            if (res.returnCode == 0) {
              const dataList = res.data
              //参会状态 -1过期未确认 0待确认 1参加 2请假 3会议取消
              const joinStatus = dataList.joinStatus
              if (dataList.proceed == 0) {
                refreshOption(noticeTypeId, noticeType)
                return message.info('会议审核中')
              } else if (dataList.proceed == 2) {
                refreshOption(noticeTypeId, noticeType)
              } else if (dataList.proceed == 3) {
                refreshOption(noticeTypeId, noticeType)
                return message.info('会议已结束')
              }
              if (joinStatus == 2) {
                refreshOption(noticeTypeId, noticeType)
                return message.info('已请假')
              }
              if (dataList.status == 0) {
                refreshOption(noticeTypeId, noticeType)
                return message.info('会议已终止')
              }
              if (joinStatus == 1) {
                refreshOption(noticeTypeId, noticeType)
                return message.info('会议进行中')
              }
              const $meetInfo = {
                teamId: dataList.teamId,
                teamName: dataList.teamName,
                relationId: dataList.meetingId,
                titleName: dataList.name,
                triggerTime: `${dataList.startTime}:00`,
              }
              setState({
                golbalParams: {
                  ...state.golbalParams,
                  meetData: $meetInfo,
                  meetIdRefer: noticeTypeId,
                },
              })
              if (joinStatus === 0) {
                const key = flag == 0 ? 'leaveVisible' : 'joinVisible'
                setState({
                  [key]: true,
                })
              }
            }
          },
          err => {
            message.error(err.returnMessage)
          }
        )
      }
    })
  }

  //确认提醒方式
  const saveZoneRemind = () => {
    // setLoading(true)
    setState({
      loading: true,
    })
    const parameter = {
      userId: nowUserId,
      scheduleType: 1, //日程类型 1会议，2预约，3工作报告，4任务汇报
      remindNoticeType: remindNoticeTypeFun({ state1: state.hintUse, state2: state.hintNote }), //提示类型 1应用内提醒，2短信，邮件3全部
      triggerTime: state.golbalParams.meetData.triggerTime, //触发时间，yyyy/MM/dd HH:mm:ss
      reminder: state.golbalParams.reminderObj.reminder, //提醒时间类型枚举 0:无 1:开始前0分钟
      teamId: state.golbalParams.meetData.teamId, //
      teamName: state.golbalParams.meetData.teamName, //
      relationId: state.golbalParams.meetData.relationId, //当前的会议/预约的id
      titleName: state.golbalParams.meetData.titleName, //会议名称 预约名称
      id: undefined, //编辑ID
      receive: undefined, //我收到的会议
    }
    const { noticeTypeId, noticeType } = state.golbalParams.itemParam
    addRemind(parameter).then(
      (data: any) => {
        if (data.returnCode === 0) {
          rquestMeet(1, '')
          setState({
            joinVisible: false,
            loading: false,
            leaveVisible: false,
          })
          refreshDesk({
            isTip: false,
            noticeTypeId,
            noticeType,
            args: 'meeting_count',
          })
          ipcRenderer.send('handle_messages_option', ['meeting_count', noticeTypeId, noticeType])
        }
      },
      err => {
        message.error(err.returnMessage)
        ipcRenderer.send('handle_messages_option', ['meeting_count', noticeTypeId, noticeType])
        setState({
          loading: false,
        })
      }
    )
  }
  //请假
  const leaveMadalOk = (type: number) => {
    if (type == 2 && state.golbalParams.leaveValue === '') {
      message.error('请假需填写备注哦~')
      return
    }
    rquestMeet(type, state.golbalParams.leaveValue)
  }
  const rquestMeet = (type: number, leaveValue: string) => {
    const Value = leaveValue || ''
    setState({
      loading: true,
    })
    handelMeetStatus(state.golbalParams.meetIdRefer, type, Value)
      .then((data: any) => {
        if (data.returnCode == 0) {
          refreshDotSHow(state.golbalParams.meetIdRefer)
          refreshDesk({
            isTip: false,
            noticeTypeId: state.golbalParams.itemParam.noticeTypeId,
            noticeType: state.golbalParams.itemParam.noticeType,
            args: 'meeting_count',
          })
          message.success(type == 1 ? '参加会议成功！' : '会议请假成功！')
          //关闭推送弹窗
          ipcRenderer.send('handle_messages_option', [
            'force_report_time_out',
            state.golbalParams.itemParam.noticeTypeId,
            state.golbalParams.itemParam.noticeType,
          ])
        } else {
          message.error(data.returnMessage)
        }
        setState({
          loading: false,
          leaveVisible: false,
        })
      })
      .catch(resData => {
        setState({
          loading: false,
        })
        if (type == 2 && resData.returnMessage == '请填写备注') {
          message.error('请填写请假原因')
        } else {
          message.error(resData.returnMessage)
        }
      })
  }
  //定义会议提醒下拉菜单
  const handleMenuClick = (props: any) => {
    const $ReminderObj = {
      reminderVal: props.key.split('-')[1],
      reminder: props.key.split('-')[0],
    }
    state.setGolbalParams({
      reminderObj: $ReminderObj,
    })
  }
  const menu = (
    <Menu onClick={handleMenuClick} className="menu_ant_drop">
      <Menu.Item key="0-无提醒">无提醒</Menu.Item>
      <Menu.Item key="1-0分钟提醒">0分钟提醒</Menu.Item>
      <Menu.Item key="2-5分钟提醒">5分钟提醒</Menu.Item>
      <Menu.Item key="3-15分钟提醒">15分钟提醒</Menu.Item>
      <Menu.Item key="4-30分钟提醒">30分钟提醒</Menu.Item>
      <Menu.Item key="5-1小时提醒">1小时提醒</Menu.Item>
      <Menu.Item key="6-12小时提醒">12小时提醒</Menu.Item>
      <Menu.Item key="7-1天提醒">1天提醒</Menu.Item>
      <Menu.Item key="8-1周提醒">1周提醒</Menu.Item>
    </Menu>
  )

  //获取禅道跳转地址
  const getChandaoUrl = (params: any) => {
    setState({
      loading: true,
    })
    const { address, type, id } = params
    const requestUrl = `${address}/push_notification/chandao?type=${type}&id=${id}&user=${nowAccount}`
    $store.dispatch({
      type: 'CHAN_DAO_URL',
      data: { url: requestUrl, id: id, type: type },
    })
    ipcRenderer.send('close_chanDao_window', {
      createWindow: true,
    })
    // ipcRenderer.send('close_chanDao_window')
    // $tools.createWindow('ChandaoWindow')
    setState({
      loading: false,
    })
  }
  // 打开窗口
  const openRoom = async (resData: any) => {
    const { chatListData, openRoomIds, selectItem } = $store.getState()
    const dataList = JSON.parse(JSON.stringify(chatListData))
    const data = [...dataList, resData]
    insertChatRoom(resData)
    // 列表排序
    data.sort((a: globalInterface.ChatListProps, b: globalInterface.ChatListProps) => {
      if (a.isTop === b.isTop) {
        return moment(b.time).valueOf() - moment(a.time).valueOf()
      }
      return b.isTop - a.isTop
    })
    // 打开沟通窗口
    ipcRenderer.send('show_commuciate_muc', [selectItem, resData])
    const newIds = [...openRoomIds, resData.id]
    // 保存当前在独立窗口打开的聊天室
    $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
    // 更新列表
    $store.dispatch({ type: 'SET_CHAT_LIST', data: { chatListData: data } })
    // getLocalRoomData(false, 'time')
    // 设置滚动条的位置
    const resultData = chatListData.filter(item => {
      return newIds.indexOf(item.id) !== -1
    })
    resultData.map((item: any, index: number) => {
      if (item.id === resData.id) {
        const offsetTop = index * 62
        $('#chat_list_main').scrollTop(offsetTop - 100)
      }
    })
    // 更新本地数据库
    // updateChatRoomDetail({ userId: nowUserId, data })
  }

  // 打开沟通窗口
  const showChatWindow = (record: any) => {
    const { chatListData, openRoomIds, selectItem } = $store.getState()
    const data = JSON.parse(JSON.stringify(chatListData))
    let isIn = false
    let newIds = [...openRoomIds]
    data.map((item: any) => {
      if (item.id === record.noticeTypeId) {
        isIn = true
        const isRoomOpen = openRoomIds.some(thisId => {
          return thisId === item.id
        })
        if (!isRoomOpen) {
          // 判断聊天室是否打开（是否存在聊天室列表）
          newIds = [...openRoomIds, item.id]
          $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
        }
        // 打开沟通窗口
        ipcRenderer.send('show_commuciate_muc', [selectItem, item])
      }
    })
    // 判断聊天室是否打开\是否存在聊天室列表
    if (isIn) {
      // 设置滚动条的位置
      const resultData = chatListData.filter(item => {
        return newIds.indexOf(item.id) !== -1
      })
      resultData.map((item: any, index: number) => {
        if (item.typeId === record.noticeTypeId) {
          const offsetTop = index * 62
          $('#chat_list_main').scrollTop(offsetTop - 100)
        }
      })
    } else {
      openWindow(record.noticeTypeId).then((resData: any) => {
        ipcRenderer.send('add_new_chat_room', resData.muc)
        openRoom(resData)
      })
    }
  }

  //查看协同信息详情跳转
  const showAtMeDetail = (info: any) => {
    const type = info.noticeType

    setState({
      golbalParams: {
        ...state.golbalParams,
        disposeType: info.disposeType,
      },
    })
    //更新红点展示
    refreshDotSHow(info.id)
    //异常自动处理
    // state.currentData = info
    setApprovalData(type, info)
    // 催办
    if (type === 'force_report_waiting') {
      //强制汇报
      if (!state.isToDay) return
      // 打开汇报编辑框
      $store.dispatch({
        type: 'FORCE_LIST_REPORT',
        data: {
          id: info.spareId || '', //打开具体的强制汇报
          noticeTypeId: info.noticeTypeId || '',
        },
      })
      $tools.createWindow('createForceReport')
      return
    }
    //禅道BUG
    if (type === 'chan_dao_bug' || type === 'chan_dao_task' || type === 'chan_dao_need') {
      getChandaoUrl({
        address: info.url,
        type: info.noticeType,
        id: info.noticeTypeId,
      })
      return
    }
    //工作组被删除
    if (type == 'project_invite' && info.flag == 1) {
      message.error('该工作组已被删除,您已不需要处理')
      refreshDesk({
        isTip: false,
        noticeTypeId: info.noticeTypeId,
        noticeType: info.noticeType,
        args: '',
      })
      return
    }
    //会议移除
    if (type == 'unconfirmed_meeting' && info.flag == 1) {
      message.error('你已不是参会成员，不能查看详情')
      refreshDesk({
        isTip: false,
        noticeTypeId: info.noticeTypeId,
        noticeType: info.noticeType,
        args: 'meeting_count',
      })
      return
    }
    //邀请移除
    if (type == 'invite' && info.flag == 1) {
      message.error('邀请已失效，不能查看详情')
      refreshDesk({
        isTip: false,
        noticeTypeId: info.noticeTypeId,
        noticeType: info.noticeType,
        args: 'invite_count',
      })
      return
    }
    //备注不存在
    if ((type == 'remarks_opinion_comment_at_me' || type == 'remarks_opinion_at_me') && info.flag == 1) {
      message.error('备注不存在')
      refreshDesk({
        isTip: false,
        noticeTypeId: info.noticeTypeId,
        noticeType: info.noticeType,
        args: '',
      })
      return false
    }
    //检查项不存在
    if (type == 'check_comment_at_me' && info.flag == 1) {
      message.error('该检查项已被删除，你已不需要处理')
      return
    }
    if (type == 'book') {
      //预约申请
      // Appoint.queryAppointDetail(info.noticeTypeId, 0, info.bookStatus, obj)
    } else if (
      type == 'unconfirmed_meeting' ||
      type == 'unconfirmed_meeting_update' ||
      type == 'unconfirmed_meeting_conclude' ||
      type == 'unconfirmed_meeting_remind'
    ) {
      setState({
        currentData: info,
        meetModalVisible: true,
      })
      //待确认会议
      // myZoneMeetingResive.getFormInfo(info.noticeTypeId, 0, ev)
    } else if (type == 'approval_send' || type == 'approval_urge' || type == 'temporary_storage') {
      //待处理审批,催办
      const sendOptions = ['waitApproval', info.noticeTypeId]
      $tools.createWindow('Approval', { sendOptions: sendOptions })
    } else if (type == 'approval_return') {
      //我发起的
      $tools.createWindow('Approval', { sendOptions: ['mySendApproval', info.noticeTypeId] })
    } else if (type == 'approval_notice') {
      //知会我的
      $tools.createWindow('Approval', { sendOptions: ['noticeMeApproval', info.noticeTypeId] })
    } else if (type == 'touch_approval') {
      //触发审批
      $tools.createWindow('Approval', { sendOptions: ['triggerApproval', info.noticeTypeId] })
    } else if (type == 'reject_approval') {
      //驳回审批
      $tools.createWindow('Approval', { sendOptions: ['triggerApproval', info.noticeTypeId] })
    } else if (type == 'invite') {
      //企业邀请
      // setIsRead(info.isRead)
      setState({
        currentData: info,
        inviteVisible: true,
      })
    } else if (
      ((type == 'task_report_at_me' || type == 'task_report_comment_at_me') && info.spareId != null) ||
      type == 'report_send'
    ) {
      //汇报@我
      setState({
        currentData: info,
        detailsModel: true,
      })
    } else if (type == 'work_report_at_me' || type == 'work_report_comment_at_me') {
      setState({
        currentData: info,
        reportDetailsModel: true,
      })
    } else if (
      type.indexOf('task_relation') != -1 ||
      type == 'task_supervise' ||
      type == 'task_circulation' ||
      type == 'task_follow' ||
      type == 'task_unfollow' ||
      type == 'task_assign'
    ) {
      //任务类查看任务详情
    } else if (type == 'task_talk_at_push') {
      //主题
    } else if (type == 'project_invite') {
    } else if (
      type == 'check_comment_at_me' ||
      type == 'remarks_opinion_at_me' ||
      type == 'remarks_opinion_comment_at_me' ||
      type == 'task_todo' //任务待办类型
    ) {
      const defaultDetailActiveKey =
        type == 'check_comment_at_me'
          ? '4'
          : type == 'remarks_opinion_comment_at_me' || type === 'remarks_opinion_at_me'
          ? '2'
          : ''
      openTaskDetail(info, defaultDetailActiveKey)
    } else if (
      type == 'remarks_opinion_at_me' ||
      type == 'remarks_opinion' ||
      type == 'remarks_opinion_comment' ||
      type == 'remarks_opinion_comment_at_me'
    ) {
      //备注信息
    } else if (type == 'follow_request') {
      //关注人
    } else if (type == 'check_comment_at_me') {
    } else if (type == 'rule') {
      //公告查看
      //校验公告是否被撤回
      checkNoticeState({
        id: info.noticeTypeId,
        userId: nowUserId, //发起人id
      }).then(
        (data: any) => {
          if (data.returnCode === 0) {
            setState({
              currentData: info,
              detailModalVisible: true,
            })
            $store.dispatch({
              type: 'NOTICE_DETAILS',
              data: {
                source: 'noticeList',
                noticeId: info.noticeTypeId,
                noticeType: type,
              },
            })
          } else if (data.returnCode == -1) {
            message.error(data.returnMessage)
          } else {
            message.error(data.returnMessage)
          }
        },
        errMsg => {
          message.error(errMsg)
          refreshDesk({
            isTip: false,
            noticeTypeId: info.noticeTypeId,
            noticeType: info.noticeType,
            args: '',
          })
        }
      )
    } else if (type == 'force_report_waiting') {
      //强制汇报
      if (!state.isToDay) return
      $store.dispatch({
        type: 'FORCE_LIST_REPORT',
        data: {
          id: info.spareId || '', //打开具体的强制汇报
          noticeTypeId: info.noticeTypeId || '',
        },
      })
      $tools.createWindow('createForceReport')
    } else if (type == 'task_synergy') {
      //任务协同
      setState({
        currentData: info,
        inviteUserVisible: true,
      })
    }
  }

  //查看任务详情
  const openTaskDetail = (item: any, detailActiveKey?: string) => {
    const id = item.type == '任务类' ? item.noticeTypeId : item.spareId
    const param = {
      visible: true,
      id,
      taskType: '',
      taskData: { id, type: 1, from: 'TaskList' },
      defaultActiveKey: detailActiveKey,
      callbackFn: () => {
        refreshDesk({
          isTip: false,
          noticeTypeId: 0,
          noticeType: '',
          args: 'work_plan_count',
        })
      },
    }
    detailModalRef && detailModalRef.current.setState(param)
  }
  //快捷回复
  const quickReplay = (type: number, item: any) => {
    const params: any = {
      id: item.id,
      type: item.noticeType,
      typeId: item.noticeTypeId,
      commentId: item.commentId || null,
      userId: $store.getState().nowUserId,
      spareId: item.spareId,
    }
    getSystemState(params)
      .then((res: any) => {
        if (res.returnCode == 0 && res.data === 1) {
          // if (type == 3) message.warning('该任务已失效！')
          //异常自动处理
          ReadCancelMsg(item.id)
            .then(() => {
              refreshDesk({
                isTip: true,
                noticeTypeId: item.noticeTypeId,
                noticeType: item.noticeType,
                args: 'talk_count',
              })
            })
            .catch(err => {
              console.log(err)
            })

          return false
        }
        // 任务类知晓处理
        if (type == 3) {
          isTaskKnow(item)
        } else {
          setState({
            quickParam: {
              ...state.quickParam,
              noticeType: item.noticeType,
              loadReplay: true,
              item: { ...item },
              type: type,
            },
          })
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  // 处理代办操作状态
  const updateOperateState = (item: any) => {
    //红点自动处理
    ReadCancelMsg(item.id)
      .then(() => {
        refreshDesk({
          isTip: false,
          noticeTypeId: item.noticeTypeId,
          noticeType: item.noticeType,
          args: 'talk_count',
        })
      })
      .catch(err => {
        console.log(err)
      })
  }

  //处理任务类已知晓
  const isTaskKnow = (item: any) => {
    isKnowTaskWaitApi({ noticeId: item.id }).then((res: any) => {
      if (res.returnCode == 0) {
        refreshTaskDataFn({
          dataList: state.taskData,
          optType: 'isKnow',
          findKey: 'noticeTypeId',
          findId: item.noticeTypeId,
        })
        setState({
          taskData: [...state.taskData],
        })
      }
    })
  }

  // 移除任务待办项
  const removeTaskWait = (item: any) => {
    removeTaskWaitApi({ noticeId: item.id }).then((res: any) => {
      if (res.returnCode == 0) {
        queryWaitNums()
        refreshTaskDataFn({
          dataList: state.taskData,
          optType: 'del',
          findKey: 'noticeTypeId',
          findId: item.noticeTypeId,
        })
        setState({
          taskData: [...state.taskData],
        })
      }
    })
  }

  // 行点击
  const rowClick = (e: any, item: any) => {
    e.stopPropagation()
    //校验状态
    getSystemState({
      id: item.id,
      type: item.noticeType,
      typeId: item.noticeTypeId,
      commentId: item.commentId || null,
      userId: $store.getState().nowUserId,
      spareId: item.spareId,
    })
      .then((res: any) => {
        //关注人工作太不允许点击
        if (isFollow) return

        if (res.returnCode == 0 && res.data === 1) {
          //异常自动处理
          ReadCancelMsg(item.id)
            .then(() => {
              refreshDesk({
                isTip: false,
                noticeTypeId: item.noticeTypeId,
                noticeType: item.noticeType,
              })
            })
            .catch(err => {
              console.log(err)
            })
          return false
        }

        const receiveDay = item.receiveTime.split(' ')[0].split('-')[2] //点击日期对应的天数
        const toDay = new Date().getDate()
        if (parseInt(receiveDay) < toDay && item.disposeType === 1) {
          return false
        }
        if (!state.isToDay) {
          if (item.type == '任务类') {
            message.warning('任务已失效！')
          } else {
            message.warning('请当天再汇报吧')
          }

          return false
        }

        if (item.disposeType === 1 || isFollow) {
          return false
        }
        if (item.noticeType === 'task_talk_at_push') {
          showChatWindow(item)
        }
        if (
          item.noticeType === 'approval_remarks_at_me' ||
          item.noticeType === 'approval_remarks_comment_at_me'
        ) {
          //查看审批详情
          $store.dispatch({
            type: 'SET_OPERATEAPPROVALID',
            data: { isQueryAll: false, ids: item.spareId },
          })
          $tools.createWindow('ApprovalOnlyDetail')
        } else {
          showAtMeDetail(item)
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  return (
    <div className="todoListContaier" style={{ height: '100%' }}>
      {/* <div className="wait_task">
        <div className="wait_task_nav">
          <div
            className={$c({ 'enlarge-btn': !enlargeVisble, 'screen-enlarge-larg': enlargeVisble })}
            onClick={() => enlarge()}
          ></div>
        </div>
      </div> */}
      {/* 筛选tab */}
      <CheckboxCom
        params={{
          callBack: changeNavActive,
          navactive: state.golbalParams.navactive,
          moduleNums: state.moduleNums,
        }}
      />
      {/* 时间控件 */}
      <WeekDateComp
        params={{
          dateArr: state.golbalParams.dateArr,
          dateActive: state.golbalParams.dateActive,
          isToDay: state.isToDay,
          handele,
        }}
      />
      {/* 列表数据 */}
      <div
        className={$c('wait_task_list_wrap', {
          widthFull: weekDateShow,
          widthHalf: !weekDateShow,
        })}
      >
        <div className="demo-infinite-container wait_task_list" ref={listRef}>
          {/* <div id="to_do_infinite_scroll" ref={infiniteScrollFref}> */}
          <List
            className={'listContainer'}
            dataSource={state.taskData}
            renderItem={(item: any, index: number) => {
              const titleContent = `${item.content?.replace($tools.regEmoji, '[表情]')}${
                item.type == '任务类' && item.taskFlag === 1
                  ? '<span class="ant-tag com-tag com-tag-d">冻</span>'
                  : ''
              }`
              return (
                <div
                  className={$c('task-item', {
                    itemComplete: item.disposeType === 1,
                    hasMsg: item.isRead == 0 && item.disposeType !== 1 && state.isToDay,
                    notHover: !state.isToDay,
                    isHeaderWid100: isHeaderWid100.includes(item.type),
                  })}
                  key={index}
                  onClick={e => {
                    rowClick(e, item)
                  }}
                  onMouseOver={(e: any) => {
                    const spans = e.currentTarget.querySelectorAll('.atUser')
                    // const aterMe = e.currentTarget.querySelectorAll('.aterMe')
                    const newSpans = [...spans]
                    newSpans.forEach((element: any) => {
                      if (item.disposeType !== 1) {
                        // element.style.color = '#fff'
                      } else {
                        element.style.color = '#3949ab'
                      }
                    })
                  }}
                  onMouseLeave={(e: any) => {
                    const spans = e.currentTarget.querySelectorAll('.atUser')
                    // const aterMe = e.currentTarget.querySelectorAll('.aterMe')
                    const newSpans = [...spans]
                    newSpans.forEach((element: any) => {
                      element.style.color = '#3949ab'
                    })
                  }}
                >
                  {item.type === '@我的' && <div className="aterMe">@我</div>}
                  {/* {item.type !== '@我的' && <div className={getIcons(item.type)}></div>} */}
                  <div className={$c('task-item-top-header', { width32: item.type === '@我的' })}>
                    <Tooltip title={item.noticeType.includes('at_me') ? '' : htmlDecodeByRegExp(item.content)}>
                      <div
                        className={$c('task-item-tip', {
                          itemWrap: item.noticeType == 'check_comment_at_me',
                        })}
                        ref={iIemRef}
                        dangerouslySetInnerHTML={{
                          __html:
                            item.type === '禅道类' ? renderBugTitle(item) : renderTitleContent(titleContent),

                          //  titleContent.replace(/\[bq_(\w+)\]/gi, function(_: string, regStr: any) {
                          //     const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
                          //     return `<img class="emoji_icon" src="${imgUrl}">`
                          //  })
                        }}
                      ></div>
                    </Tooltip>
                    <div className="task-item-time">
                      <span>
                        {checkDate(item.receiveTime, item.noticeType) && (
                          <span style={{ paddingRight: '10px' }}>
                            {receiveTimetext(item.receiveTime, item.noticeType)}
                          </span>
                        )}
                        {item.disposeType !== 1 &&
                          item.noticeType !== 'work_report_remind' &&
                          $tools.getWaitTime(item.waitingTimeModel, item.receiveTime) && (
                            <span className="waitTime">
                              ({$tools.getWaitTime(item.waitingTimeModel, item.receiveTime)})
                            </span>
                          )}

                        {/* {item.noticeType == 'work_report_remind' && <span>{item.deadline}</span>} */}
                        {item.noticeType == 'work_report_remind' &&
                          item.flag == 0 &&
                          $tools.getWaitTime(item.waitingTimeModel, item.receiveTime) && (
                            <span className="waitTime">
                              ({$tools.getWaitTime(item.waitingTimeModel, item.receiveTime)})
                            </span>
                          )}
                      </span>
                      {item.urgeUsername && (
                        <span className="cuiban-y">
                          {/* <span className="task-item-icon task-icon-cby"></span> */}
                          {item.urgeUsername.substr(-3, 3)}催办了你
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 添加任务类推送： 知晓+移除代办（任务状态：完成、冻结、指派、归档） */}
                  {(item.type === '@我的' || item.type === '任务类') && item.disposeType === 0 && !isFollow && (
                    <div className="task-option flex-1">
                      <div className="options-btn flex center-v">
                        {item.noticeType !== 'task_talk_at_push' && item.noticeType !== 'task_todo' && (
                          <span
                            className="task-option-btn"
                            onClick={e => {
                              e.stopPropagation()
                              quickReplay(1, item)
                            }}
                          >
                            回复
                          </span>
                        )}

                        {item.type === '任务类' && item.showType == 1 ? (
                          <span
                            className="task-option-btn"
                            onClick={e => {
                              e.stopPropagation()
                              // 移除代办
                              removeTaskWait(item)
                            }}
                          >
                            移出待办
                          </span>
                        ) : (
                          <span
                            className="task-option-btn"
                            onClick={e => {
                              e.stopPropagation()
                              quickReplay(item.type === '任务类' ? 3 : 0, item)
                            }}
                          >
                            已知晓
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {/* odoo操作类 */}
                  {item.noticeType == 'odoo_personnel_matters' && item.disposeType === 0 && !isFollow && (
                    <div className="task-option flex-1">
                      <div className="options-btn flex center-v">
                        <span
                          className="task-option-btn"
                          onClick={e => {
                            e.stopPropagation()
                            updateOperateState(item)
                          }}
                        >
                          已知晓
                        </span>
                      </div>
                    </div>
                  )}
                  {item.type === '邀请类' && item.disposeType === 0 && !isFollow && (
                    <div className="task-option flex-1">
                      <div className="options-btn flex center-v">
                        <span
                          className="task-option-btn"
                          onClick={e => {
                            e.stopPropagation()
                            state.currentData = item
                            invitationAgree({
                              index: index,
                              result: item.noticeType === 'invite' ? 4 : 1,
                              item: item,
                            })
                          }}
                        >
                          拒绝
                        </span>
                        <span
                          className="task-option-btn"
                          onClick={e => {
                            e.stopPropagation()
                            invitationAgree({
                              index: index,
                              result: 0,
                              item: item,
                            })
                          }}
                        >
                          同意
                        </span>
                      </div>
                    </div>
                  )}
                  {/* 工作 报告 */}
                  {item.noticeType == 'work_report_remind' && item.disposeType === 0 && !isFollow && (
                    <div className="task-option flex-1">
                      <div className="options-btn flex center-v">
                        <span className="task-option-btn" onClick={e => reportHandel(e, item, false)}>
                          知道了
                        </span>
                        <span className="task-option-btn" onClick={e => reportHandel(e, item, true)}>
                          提交
                        </span>
                      </div>
                    </div>
                  )}
                  {item.type === '会议类' &&
                    item.noticeType == 'unconfirmed_meeting' &&
                    item.disposeType === 0 &&
                    !isFollow && (
                      <div className="task-option flex-1">
                        <div className="options-btn flex center-v">
                          <span
                            className="task-option-btn"
                            onClick={e => {
                              e.stopPropagation()
                              attendMeeting(item, 0)
                            }}
                          >
                            请假
                          </span>
                          <span
                            className="task-option-btn"
                            onClick={e => {
                              e.stopPropagation()
                              attendMeeting(item, 1)
                            }}
                          >
                            参加
                          </span>
                        </div>
                      </div>
                    )}
                  {/* 审批类 */}
                  {item.type === '审批类' && item.disposeType === 0 && !isFollow && (
                    <div className="task-option flex-1">
                      <div className="options-btn flex center-v">
                        <span className="task-option-btn">去处理</span>
                      </div>
                    </div>
                  )}
                  {item.disposeType === 1 && <div className="disableMask"></div>}
                  {/* {item.disposeType === 1 && <span className="disableMaskIcon"></span>} */}
                </div>
              )
            }}
            style={{ height: '100%' }}
          >
            {state.loading && state.hasMore && (
              <div className="demo-loading-container">
                <Spin />
              </div>
            )}
            {state.taskData.length === 0 && (
              <NoneData
                className="threePosition"
                imgSrc={$tools.asAssetsPath('/images/noData/none_data_icon.svg')}
                showTxt="无事一身轻~"
                // imgStyle={{ width: 68, height: 56 }}
                // containerStyle={{ zIndex: 0, marginTop: !isFullScreen ? 0 : 80 }}
                containerStyle={{ zIndex: 0, marginTop: 0 }}
              />
            )}
          </List>
          {/* </div> */}
        </div>
      </div>
      {/* 模态框 */}
      {state.detailModalVisible && (
        <NoticeDetails
          showModal={(isVisible: boolean) =>
            setState({
              detailModalVisible: isVisible,
            })
          }
          refreshCallback={(noticeTypeId: number) => {
            refreshDotSHow(noticeTypeId)
            refreshDesk({
              isTip: false,
              noticeTypeId: noticeTypeId,
              noticeType: 'rule',
              args: 'notice_count',
            })
          }}
        />
      )}
      {state.meetModalVisible && (
        <MeetDetails
          datas={{
            queryId: state.currentData?.noticeTypeId,
            listType: 0,
            meetModal: state.meetModalVisible,
          }}
          isVisibleDetails={() =>
            setState({
              meetModalVisible: false,
            })
          }
          callback={() =>
            refreshDesk({
              isTip: false,
              noticeTypeId: state.currentData.noticeTypeId,
              noticeType: state.currentData.noticeType,
              args: 'meeting_count',
            })
          }
        />
      )}
      {state.deskFollowVisible && (
        <DeskFollowPop
          datas={{ visiblePop: state.deskFollowVisible, currentData: state.currentData }}
          onclose={(state: boolean) => {
            setState({
              deskFollowVisible: state,
            })
          }}
        />
      )}
      {/* 邀请类任务详情 */}
      {state.inviteUserVisible && (
        <InviteLinkUserModal
          paramsProps={state.currentData}
          visible={state.inviteUserVisible}
          onclose={(state: boolean) => {
            setState({
              inviteUserVisible: state,
            })
            refreshFn && refreshFn()
          }}
        />
      )}
      {state.quickParam.loadReplay && (
        <ReplayMsg
          params={{ item: state.quickParam.item, type: state.quickParam.type }}
          setVisble={(flag: boolean) => {
            setState({
              quickParam: {
                ...state.quickParam,
                loadReplay: flag,
              },
            })
          }}
          callback={(params: any) => {
            refreshDesk({
              isTip: false,
              noticeTypeId: state.quickParam.item.spareId,
              noticeType: state.quickParam.item.noticeType || 'check_comment_at_me',
              args: 'check_comment_at_me',
            })
            ReadCancelMsg(params.rowId).then(() => {
              setState({
                loading: false,
              })
            })

            setState({
              quickParam: {
                ...state.quickParam,
                noticeType: params.noticeType || 'check_comment_at_me',
                loadReplay: false,
                item: { ...state.golbalParams },
              },
            })
            const { spareId, noticeType } = state.quickParam.item
            ipcRenderer.send('handle_messages_option', ['check_comment_at_me', spareId, noticeType])
          }}
          commentId={state.quickParam.item.commentId}
        />
      )}
      {state.inviteVisible && (
        <OrgInvitationPlug
          params={{
            visible: state.inviteVisible,
            isRead: 0,
            id: state.currentData.noticeTypeId,
            disposeType: state.golbalParams.disposeType,
            setvisible: (state: any) => {
              setState({
                inviteVisible: state,
              })
            },
            optionCallback: () => {
              refreshDesk({
                isTip: false,
                noticeTypeId: state.currentData.noticeTypeId,
                noticeType: state.currentData.noticeType,
                args: 'invite_count',
              })
            },
          }}
        />
      )}
      {/* 任务详情 */}
      <DetailModal
        ref={detailModalRef}
        param={{
          from: 'TaskList',
        }}
        setActiveKey={(key: any) => {
          setState({
            defaultDetailActiveKey: key,
          })
          refreshFn && refreshFn()
        }}
      ></DetailModal>
      {/* 报告详情 */}
      {state.detailsModel && (
        <TaskReportModel
          param={{
            visible: state.detailsModel,
            data: { ...state.currentData, taskId: state.currentData.spareId },
            type: 1,
          }}
          setvisible={(state: any) => {
            setState({
              detailsModel: state,
            })
            refreshFn && refreshFn()
          }}
        />
      )}
      {/* {工作报告详情} */}
      {state.reportDetailsModel && (
        <ReportDetails
          param={{
            reportId: state.currentData.noticeTypeId,
            noticeType: state.currentData.noticeType,
            isVisible: state.reportDetailsModel,
            isMuc: 1,
          }}
          setvisible={(state: any) => {
            setState({
              reportDetailsModel: state,
            })
            refreshFn && refreshFn()
          }}
        />
      )}
      <Modal
        title="填写请假原因"
        centered
        visible={state.leaveVisible}
        maskClosable={false}
        onOk={() => leaveMadalOk(2)}
        onCancel={() =>
          setState({
            leaveVisible: false,
          })
        }
        width={400}
        bodyStyle={{ padding: '20px', height: '192px' }}
      >
        <div>
          <TextArea
            rows={8}
            placeholder="请在此填写请假原因"
            value={state.golbalParams.leaveValue}
            onChange={e =>
              setState({
                golbalParams: {
                  ...state.golbalParams,
                  leaveValue: e.target.value,
                },
              })
            }
          />
        </div>
      </Modal>
      <Modal
        title="确认参加"
        centered
        visible={state.joinVisible}
        wrapClassName={'join_meet_modal'}
        maskClosable={false}
        onOk={() => saveZoneRemind()}
        onCancel={() =>
          setState({
            joinVisible: false,
          })
        }
        width={400}
        bodyStyle={{ padding: '20px', height: '192px' }}
      >
        <div>
          <h5>确认参加该会议？</h5>
          <div style={{ marginBottom: '10px' }}>提醒我</div>
          <div>
            <Dropdown overlay={menu} trigger={['click']}>
              <Button style={{ height: '22px', padding: '0 10px', marginRight: '30px' }}>
                {state.golbalParams.reminderObj.reminderVal} <DownOutlined />
              </Button>
            </Dropdown>
            <Checkbox.Group
              options={[
                { label: '应用内提醒', value: '0' },
                { label: '短信/邮件提醒', value: '1' },
              ]}
              defaultValue={[state.golbalParams.reminderObj.reminder]}
              onChange={arr => {
                if (arr.length === 2) {
                  setState({
                    hintUse: true,
                    hintNote: true,
                  })
                } else if (arr.length === 1) {
                  if (arr[0] == '0') {
                    setState({
                      hintUse: true,
                    })
                  }
                  if (arr[0] == '1') {
                    setState({
                      hintNote: true,
                    })
                  }
                }
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

//tab切换小组件
const CheckboxCom = ({ params }: any) => {
  const { navactive, moduleNums, callBack } = params
  const options = getWaitOptions(moduleNums)

  // 检查是否含有任务权限
  // const hasTaskAuth = getAuthStatus('taskFind')
  // const findTaskAuth = $store
  //   .getState()
  //   .funsAuthList?.filter((item: any) => item.name == 'TASK' && !item.hasAuth)
  // if (findTaskAuth?.length == 0) {
  //   options = options.filter((item: any) => item.label != '任务')
  // }

  const onChange = (checkedValues: any[]) => {
    let _resChecked: any
    // 全部与其他条件互斥 3:全部
    if (checkedValues.length == 0) {
      _resChecked = ['3']
    } else if (!navactive.includes('3') && checkedValues.includes('3')) {
      _resChecked = checkedValues.filter((item: any) => {
        return item == '3'
      })
    } else if (navactive.includes('3')) {
      _resChecked = checkedValues.filter((item: any) => {
        return item != '3'
      })
    } else {
      _resChecked = checkedValues
    }
    callBack(_resChecked)
  }
  return <Checkbox.Group className="wait_checkbox" options={options} value={navactive} onChange={onChange} />
}

export const setApprovalData = (type: string, info: any) => {
  let _tabName = 'waitApproval'
  const $TYPES = ['approval_send', 'approval_urge', 'temporary_storage']
  if ($TYPES.includes(type)) {
    //待处理审批,催办
    _tabName = 'waitApproval'
  } else if (type == 'approval_return') {
    //我发起的
    _tabName = 'mySendApproval'
  } else if (type == 'approval_notice') {
    //知会我的
    _tabName = 'noticeMeApproval'
  } else if (type == 'touch_approval') {
    //触发审批
    _tabName = 'triggerApproval'
  } else if (type == 'reject_approval') {
    //驳回审批
    _tabName = 'triggerApproval'
  }
  $store.dispatch({
    type: 'SAVE_TYPE_APPROVAL_DATA',
    data: {
      tabName: _tabName,
      noticeTypeId: info.noticeTypeId,
    },
  })
}

// 点击任务已知晓修改单条数据
const refreshTaskDataFn = ({
  dataList = [],
  optType = '',
  findKey = 'noticeTypeId',
  findId,
  newData,
}: {
  dataList: any[]
  optType: string
  findKey?: string
  findId?: number
  newData?: any
}) => {
  let isExit = false
  let isExitIdx = 0

  //

  for (let i = 0; i <= dataList.length; i++) {
    if (findId && findId == dataList[i][findKey]) {
      if (optType == 'isKnow') {
        // 处理已知晓
        dataList[i].showType = 1
      } else if (optType == 'del') {
        // 处理移除数据
        dataList.splice(i, 1)
      }
      return
    }
    //系统推送
    if (optType == 'sysPush') {
      if (newData?.noticeTypeId == dataList[i].noticeTypeId) {
        isExit = true
        isExitIdx = i
        break
      }
    }
  }
  // push数据： 判断数据是否存在
  if (optType == 'sysPush') {
    if (isExit) {
      // 替换之前数据
      // dataList[isExitIdx] = packgeSingleData(newData)
      // 如果存在，删除之前数据
      dataList.splice(isExitIdx, 1)
    }
    // 添加新数据
    dataList.unshift(packgeSingleData(newData))
  }
}

// 封装单项数据
const packgeSingleData = ({ item }: { item: any }) => {
  const _item = {
    id: item.id,
    content: item.content,
    source: '',
    type: '任务类',
    receiveTime: '2021-06-02 17:42',
    isRead: 0,
    userId: '1745',
    username: null,
    noticeType: 'task_todo',
    noticeTypeId: 75849,
    spareId: 1745,
    spareContent: '',
    timestamp: 0,
    waitingTimeModel: { year: null, day: 0, hour: 0, minute: 1 },
    bookStatus: 0,
    flag: 0,
    teamName: '成都掌控者网络科技有限公司',
    teamId: 244,
    commentId: null,
    disposeType: 0,
    sendUserId: 1745,
    url: null,
    deadline: null,
  }
  return { ..._item }
}

//渲染禅道类型数据展示
const renderBugTitle = (item: any) => {
  const { content, noticeType, noticeTypeId, spareContent } = item
  const spare = JSON.parse(spareContent)
  let bugType = ''
  switch (noticeType) {
    case 'chan_dao_bug':
      bugType = 'bug'
      break
    case 'chan_dao_need':
      bugType = '需求'
      break
    case 'chan_dao_task':
      bugType = '任务'
      break
  }
  const showTitle = `${spare.sendUsername}指派的${bugType}:【${noticeTypeId}】${content}`
  return showTitle
}
// 渲染非禅道类型数据展示
const renderTitleContent = (titleContent: string) => {
  let _titleContent = titleContent
  let resTitle = ''
  // 进行屏蔽的文字
  // 关键字组
  const keyArr = ['今日执行结果', '遇到的问题']
  _titleContent = _titleContent.replace(new RegExp(keyArr.join('|'), 'img'), '')
  // *、*和*是*的学生；在这个小*里面，*就是我们的老师！
  _titleContent.replace(/\[bq_(\w+)\]/gi, function(_: string, regStr: any) {
    const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}.png`)
    return `<img class="emoji_icon" src="${imgUrl}">`
  })
  resTitle = _titleContent
  return resTitle
}

const htmlDecodeByRegExp = (str: string) => {
  let s = ''
  if (!str || str.length == 0) return ''
  s = str.replace(/&amp;/g, '&')
  s = s.replace(/&lt;/g, '<')
  s = s.replace(/&gt;/g, '>')
  s = s.replace(/&nbsp;/g, ' ')
  s = s.replace(/&quot;/g, '"')
  s = s.replace(/(\<br\>)/g, '')
  s = s.replace(/\[bq_(\w+)\]/gi, '[表情]')
  return s
}
//设置显示时间
const receiveTimetext = (receiveTime: any, noticeType: any) => {
  if (receiveTime) {
    if (noticeType == 'force_report_waiting') {
      let tmp
      switch (checkTimeType(receiveTime)) {
        case 0:
          tmp = '今天' + dateFormats(' HH:mm', receiveTime)
          break
        case -1:
          tmp = '昨天' + dateFormats(' HH:mm', receiveTime)
          break
        case 1:
          tmp = dateFormats('yyyy/MM/dd HH:mm', receiveTime)
          break
        default:
          tmp = dateFormats('MM/dd HH:mm', receiveTime)
          break
      }
      return tmp
    } else {
      return receiveTime.split(' ')[0]
    }
  } else {
    return ''
  }
}
//校验时间是否大于24小时
const checkDate = (timeStr: string, noticeType?: any) => {
  const timeLocalString = new Date(timeStr)
  const timeReducer = new Date().getTime() - timeLocalString.getTime()
  if (noticeType == 'force_report_waiting') {
    //强制汇报一直显示时间
    return true
  }
  return timeReducer > 24 * 60 * 60 * 1000
}
//校验时间是当天还是昨天还是其他
const checkTimeType = (date: string) => {
  const newDate = new Date(date).getTime()
  const today = new Date()
  today.setHours(0)
  today.setMinutes(0)
  today.setSeconds(0)
  today.setMilliseconds(0)
  const otime = today.getTime()
  const newToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() //今天凌晨
  const yestday = new Date(newToday - 24 * 3600 * 1000).getTime()
  //给出时间 - 今天0点
  const offset = newDate - otime
  const isToday = offset / 1000 / 60 / 60
  if (isToday > 0 && isToday <= 24) {
    return 0 //今天
  } else if (new Date(date).getTime() < newToday && yestday <= new Date(date).getTime()) {
    return -1 //昨天
  } else if (new Date(date).getFullYear() != new Date().getFullYear()) {
    //不同年的情况判断
    return 1
  } else {
    return 2
  }
}

//获取全部 待处理 @我的数量 任务类
const getWaitOptions = (moduleNums: any[]) => {
  const waitHandleNum = moduleNums.filter((item: ModuleNumProps) => item.code === 'wait_handle') //待处理数量（全部）
  const remindMeNum = moduleNums.filter((item: ModuleNumProps) => item.code === 'remind_me') //@我的数量
  const taskNum = moduleNums.filter((item: ModuleNumProps) => item.code === 'task_todo') //任务类数量
  const otherNum = moduleNums.filter((item: ModuleNumProps) => item.code === 'other') //其他类数量
  const approvalNum = moduleNums.filter((item: ModuleNumProps) => item.code === 'approval') //审批类数量
  const candaoNum = moduleNums.filter((item: ModuleNumProps) => item.code === 'zentao') //禅道类数量
  let wLen = 0
  let rLen = 0
  let tLen = 0
  let oLen = 0
  let aLen = 0
  let cLen = 0
  let allLen = 0
  if (waitHandleNum?.length !== 0) {
    wLen = waitHandleNum[0]?.count
  }
  if (remindMeNum?.length !== 0) {
    rLen = remindMeNum[0]?.count
  }
  if (taskNum?.length !== 0) {
    tLen = taskNum[0]?.count
  }
  if (otherNum?.length !== 0) {
    oLen = otherNum[0]?.count
  }
  if (approvalNum?.length !== 0) {
    aLen = approvalNum[0]?.count
  }
  if (candaoNum?.length !== 0) {
    cLen = candaoNum[0]?.count
  }
  allLen = wLen + rLen + tLen + oLen + aLen + cLen
  const resLen = {
    allLen: exceedNum(allLen),
    waitLen: exceedNum(wLen),
    rmeLen: exceedNum(rLen),
    taskLen: exceedNum(tLen),
    otherNum: exceedNum(oLen),
    approvalNum: exceedNum(aLen),
    candaoNum: exceedNum(cLen),
  }

  return [
    {
      label: `全部${allLen != 0 ? '(' + resLen.allLen + ')' : ''}`,
      value: '3',
    },
    { label: `审批${aLen != 0 ? '(' + resLen.approvalNum + ')' : ''}`, value: '5' },
    { label: `@我${rLen != 0 ? '(' + resLen.rmeLen + ')' : ''}`, value: '1' },
    { label: `任务${tLen != 0 ? '(' + resLen.taskLen + ')' : ''}`, value: '4' },
    { label: `禅道${cLen != 0 ? '(' + resLen.candaoNum + ')' : ''}`, value: '6' },
    { label: `其他${oLen != 0 ? '(' + resLen.otherNum + ')' : ''}`, value: '7' },
  ]
}
const exceedNum = (num: number) => {
  if (num > 99) {
    return '99+'
  }
  return num
}
/**
 * 会议提示类型
 * @param params
 */
const remindNoticeTypeFun = (params: any) => {
  const { state1, state2 } = params
  if (state1 && !state2) {
    return 1
  } else if (state2 && !state1) {
    return 2
  } else if (state2 && state1) {
    return 3
  } else {
    return 0
  }
}
// 渲染头部宽度
const isHeaderWid100 = ['审批类', '禅道类']

/**
 * 根据审批类型获取对应的CLASS
 * @param type
 * @returns
 */
const getIcons = (type: string) => {
  if (type == '审批类') {
    return 'task-item-icon task-icon-sp'
  } else if (type == '邀请类' || type == '预约类') {
    return 'task-item-icon task-icon-gz'
  } else if (type == '待汇报') {
    return 'task-item-icon task-icon-cb'
  } else if (type == '会议类') {
    return 'task-item-icon task-icon-yq'
  } else if (type == '禅道类') {
    return 'task-item-icon task-icon-cd'
  } else if (type == '任务类') {
    return 'task-item-icon task-icon-task'
  } else {
    return 'task-item-icon task-icon-sp'
  }
}
/**
 * 获取本周星期对应的日期
 * @param dateStr
 * @returns
 */
const getWeekDay = (dateStr: string) => {
  const $STRREG = /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/
  const $WEEKS: Record<number, string> = ['一', '二', '三', '四', '五', '六', '天']
  if (dateStr.match($STRREG)) {
    const $DATE = new Date(dateStr)
    const $TODAY = $DATE.getDay() !== 0 ? $DATE.getDay() : 7
    return Array.from(new Array(7), function(v, index) {
      const date = new Date($DATE.getTime() - ($TODAY - index - 1) * 24 * 60 * 60 * 1000)
      return {
        name: '周' + $WEEKS[index],
        day: date.getDate(),
      }
    })
  }
}

/**
 * @param num
 * @param days
 * @returns
 */
const getWeekIndex = (num: number, days: any) => {
  let _index = 0
  for (let i = 0; i < days.length; i++) {
    if (num == days[i].day) {
      _index = i
      break
    }
  }
  return _index
}

/**
 * 格式化日期
 * @param dStr
 * @returns
 */
const formatDate = (dStr: any) => {
  const date = new Date(dStr)
  const myyear = date.getFullYear()
  let mymonth: any = date.getMonth() + 1
  let myweekday: any = date.getDate()
  mymonth < 10 ? (mymonth = '0' + mymonth) : mymonth
  myweekday < 10 ? (myweekday = '0' + myweekday) : myweekday
  return `${myyear}-${mymonth}-${myweekday}`
}

/**
 * 获取本周每一天对应的日期
 * @returns
 */
const getWeekDate = () => {
  const dateString = formatDate(new Date()) //当天的日期，例如2020-2-28
  const presentDate = new Date(dateString)
  const today = presentDate.getDay() !== 0 ? presentDate.getDay() : 7
  return Array.from(new Array(7), function(val, index) {
    return formatDate(new Date(presentDate.getTime() - (today - index - 1) * 24 * 60 * 60 * 1000))
  })
}

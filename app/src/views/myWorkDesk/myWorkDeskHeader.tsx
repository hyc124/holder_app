import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { Avatar, Menu, Dropdown, message, Tooltip, Spin } from 'antd'
import { useSelector } from 'react-redux'
import ReportList from '../workReport/component/ReportList'
import MettingList from '../mettingManage/MettingList'
import { addCustomApprovalGetConfig, queryCondolences, queryModalReadNum } from '../workdesk/getData'
import { RightOutlined, LoadingOutlined } from '@ant-design/icons'
import Axios from 'axios'
import $c from 'classnames'
import { ipcRenderer, shell } from 'electron'
import { CreateTaskModal } from '../task/creatTask/createTaskModal'
import MettingDetailsPop from '../mettingManage/component/MettingDetailsPop'
import WorkPlanMindModal from '@/src/views/work-plan-mind/addPlan'
import { useMergeState } from '../chat-history/chat-history'
import './myWorkDeskHeader.less'
import EditModuleModal from '../workdesk/component/EditModuleModal'
import { editModuleSure } from './deskModuleItem'
import { FollowUser } from './followUser'
import * as Maths from '@/src/common/js/math'
import { getProcessData } from '../approval-execute/ApprovalExecute'
import { handelReturnData } from '../approval/components/sendApproval'
import { periodGetList, selectDateDisplay } from '../fourQuadrant/getfourData'
import { getFunsAuth } from '@/src/components/app-sidebar/appCommonApi'
import { getUnreadDot } from '../task/ChatWindowTip/ChatWindowTip'
import { findAuthList, getAuthStatus } from '@/src/common/js/api-com'
import { NEWAUTH812, refreshRainBow } from '@/src/components'
import { queryAllThumbsUpNum, getaddPraisedList, NoreadPariseList, readPariseList } from './workDeskApi'
import { CreateObjectModal } from '../task/creatTask/createObjectModal'
import ReportDetails from '../workReport/component/ReportDetails'
// import { makeDraggable } from '@/src/common/js/common'
//新建下拉菜单
const addMenu = [
  {
    key: '0',
    title: '报告',
    img: '/images/myWorkDesk/hearder_report.png',
    code: 'WORK_REPORT',
    subCode: 'addReport',
    baseAuth: true,
  },
  {
    key: '1',
    title: '会议',
    img: '/images/myWorkDesk/hearder_meeting.png',
    code: 'MEETING',
    subCode: 'addMeeting',
    baseAuth: true,
  },
  {
    key: '2',
    title: '审批',
    img: '/images/myWorkDesk/hearder_approval.png',
    code: 'APPROVAL',
    subCode: 'addApproval',
    baseAuth: true,
  },
  {
    key: '3',
    title: '公告',
    img: '/images/myWorkDesk/hearder_notice.png',
    code: 'NOTICE',
    subCode: 'addNotice',
    baseAuth: true,
  },
  {
    key: '4',
    title: '项目',
    img: '/images/myWorkDesk/hearder_project.png',
    code: 'PROJECT',
    subCode: 'addProject',
    baseAuth: true,
  },
  {
    key: '5',
    title: '任务',
    img: '/images/myWorkDesk/hearder_task.png',
    code: 'TASK',
    subCode: 'addTask',
    authCode: 'taskFind',
  },
  {
    key: '6',
    title: '目标',
    img: '/images/myWorkDesk/hearder_okr.png',
    code: 'OKR',
    subCode: 'addObjective',
    authCode: 'okrSet',
  },
]
interface Datas {
  profileImg: string
  userName: string
  userTitle: string
  sympathy: string
  timeImgSrc: string
  showReportListModal: boolean
  showMettingListModal: boolean
  cloudStand: boolean
  visible: boolean
  report: boolean
  approval: boolean
  addMoadal: boolean
  meetAdd: boolean
  isShowAddPlan: boolean
  orgList: any[]
  org: {
    orgName: string
    orgImg: string
  }
  active: string
  isShowFollow: boolean
  addMenus: any
  loading: any
}
//目前暂时做了沟通-审批-公告-系统通知 （且只校验了这几类数据信息）
export const checkType = (type: string) => {
  const typeArr = [
    'approve_count',
    'talk_count',
    'report_count',
    'notice_count',
    'system_notice_count',
    'reportRobot',
    'systemNotificationRobot',
    'reviewRobot',
    'approvalRobot',
    'workAdvancementRobot',
    'meeting_count',
  ]
  if (typeArr.includes(type)) {
    return true
  }
  return false
}
// 头部刷新方法
export let refreshDeskHeader: any = null
//
let queryCondolenFn: any = null
// 解决重复请求count接口，设置时间阻断
let WDHCountTimering: any = null
export const MyWorkDeskHeader = (props: {
  isFollow: any
  updateNums: any
  getDeskModule: any
  // history: any
}) => {
  const { isFollow, getDeskModule } = props

  //全局缓存信息
  const {
    followUserInfo,
    newTeamList,
    nowAccount,
    nowUserId,
    selectTeamName,
    orgInfo,
    nowUser,
    nowAvatar,
  } = $store.getState()

  //当前企业ID
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  //关注人信息
  const followInfo = useSelector((state: any) => state.followUserInfo)
  //当前选中的企业信息
  const selTeamItem = orgInfo.filter((item: { id: number }) => item.id === selectTeamId)
  // 系统按钮创建 权限控制列表
  const funsAuthList = useSelector((state: any) => state.funsAuthList)
  //当前登录人名字
  const nowUserName = $store.getState().nowUser
  // 创建任务弹框组件
  const createTaskRef = useRef<any>({})
  // 创建目标弹框组件
  const createObjectRef = useRef<any>({})
  // 编辑标签弹框
  const editModuleModalRef = useRef<any>({})
  //入口loading
  const [entranceVisble, setEntranceVisble] = useMergeState({
    visible: false, //下拉框状态
    report: false, //写报告
    approval: false, //发布审批
    addMoadal: false, //发布公告
    cloudStand: false, //云台账
    project: false, //新建项目
    task: false, //新建任务
    okr: false, //新建目标
    wuTongAuth: false, //梧桐权限
  })

  const [num, setNum] = useState(0)
  //汇报红点
  const [redDot, setRedDot] = useState(false)
  const [state, setState] = useState<Datas>({
    profileImg: '', //头像
    userName: '', //用户名
    userTitle: '', //彩虹屁标题
    sympathy: '', //彩虹屁
    timeImgSrc: '', //彩虹屁图标
    showReportListModal: false, //汇报弹窗状态
    showMettingListModal: false, //会议模块状态
    cloudStand: false, //云台账加载状态
    visible: false, //下拉框状态
    report: false, //写报告
    approval: false, //发布审批
    addMoadal: false, //发布公告
    meetAdd: false, //发布会议
    isShowAddPlan: false, //工作报告弹窗状态
    orgList: [], //企业列表
    org: {
      //企业信息
      orgName: '',
      orgImg: '',
    },
    active: '',
    isShowFollow: false, //显示关注人列表
    addMenus: addMenu,
    loading: '', //添加菜单加载
  })
  //沟通会议未读红点状态
  const [unreadDot, setUnreadDot] = useMergeState({
    talkCount: 0,
    meetDot: false,
  })
  // 获取获赞总数
  const [parisenum, setParisednum] = useState(0)
  // 获取获赞列表信息
  const [pariseList, setPariseList] = useState([])
  // 获赞未读
  const [NoreadNumber, setNoreadNumber] = useState(0)
  //控制导航状态
  const [optShow, setOptShow] = useState(false)
  const [parisevisibleShow, setparisevisibleShow] = useState(false)
  const [report, reportSet] = useMergeState({
    visible: false,
    reportId: '',
  })
  // 企业信息
  const [TeamInformation, setTeamInformation] = useState({})
  // 查询吾同体育入口权限
  useEffect(() => {
    if (selectTeamId && selectTeamId != -1 && !NEWAUTH812) {
      // 查询企业下权限
      findAuthList({ typeId: selectTeamId, isOnlyGetAuth: true }).then(res => {
        // 当前选中企业是否有吾同体育的权限
        const isWuTongAuth = getAuthStatus('wutong', res || []) //添加企业任务权限
        setEntranceVisble({
          ...entranceVisble,
          wuTongAuth: isWuTongAuth,
        })
      })
    }
  }, [selectTeamId])

  useEffect(() => {
    // 查询沟通未读
    let isUnmounted = false
    if (!isUnmounted) {
      clickShowTeamList()
      // queryCondolen()

      //显示汇报未读
      ipcRenderer.removeAllListeners('report_content_read').on('report_content_read', (e, args) => {
        const dotState = args > 0 ? true : false
        setRedDot(dotState)
      })
      //会议沟通红点监听
      ipcRenderer.removeAllListeners('refresh_meet_connect').on('refresh_meet_connect', (e, args) => {
        if (WDHCountTimering) return
        WDHCountTimering = true

        WDHCountTimering = setTimeout(() => {
          WDHCountTimering = false
        }, 1000)
        const enterName = args && Array.isArray(args) ? args[0] : '' //talk_count沟通 meeting_count//会议
        queryModalReadNum(enterName).then((res: any) => {
          const talkCount = res?.data || 0
          // const { talkCount, meetingCount } = res.obj
          // const meetDot = meetingCount !== 0 ? true : false
          //根据参数类型 更新对应的红点状态及数量
          if (!!enterName) {
            setUnreadDot({ talkCount: talkCount })
            if (enterName === 'talk_count') {
              setUnreadDot({ talkCount: talkCount })
            } else {
              setUnreadDot({ meetDot: talkCount })
            }
          } else {
            //没有传递参数类型 默认查询所有红点数量
            setUnreadDot({
              talkCount,
            })
          }
          getUnreadDot && getUnreadDot(talkCount)
        })
      })

      //考勤补卡审批
      ipcRenderer.removeAllListeners('start_approval').on('start_approval', (event, args) => {
        const { noticeContent } = args
        if (args) {
          getProcessData(noticeContent.eventId)
            .then((res: any) => {
              if (res.returnCode === 0) {
                if (res.data == null) {
                  addCustomApprovalGetConfig({ id: noticeContent.eventId, userId: nowUserId })
                    .then((returnData: any) => {
                      const newObj = handelReturnData(returnData.data)
                      $store.dispatch({ type: 'CUSTOM_PROVESS_SET', data: newObj })
                    })
                    .catch(returnErr => {
                      message.error(returnErr.returnMessage)
                    })
                }
                $store.dispatch({
                  type: 'SET_SEND_APPROVAL_INFO',
                  data: {
                    eventId: noticeContent.eventId,
                    teamId: noticeContent.teamId,
                    isEdit: false,
                    uuid: Maths.uuid(),
                    isNextForm: false,
                    isNextFormDatas: null,
                    findByEventIdData: res.data,
                    isStartApproval: true,
                    isStartApprovalRid: noticeContent.resourceId,
                    key: noticeContent.key,
                    approvalName: noticeContent.eventName,
                  },
                })

                $store.dispatch({ type: 'FIND_BY_EVENT_ID_DATA', data: res.data })
                $tools.createWindow('ApprovalExecute').finally(() => {
                  // console.log('创建成功')
                })
              }
            })
            .catch(err => {
              message.error(err.returnMessage)
            })
        }
      })
      refreshDeskHeader = refreshHeader
      //刷新沟通或会议红点
      ipcRenderer.send('refresh_meet_connect')
      setState({ ...state })
    }
    // 获取点赞总数
    queryAllThumbsUpNum({
      userId: nowUserId,
    }).then((res: any) => {
      if (!!res) {
        setParisednum(res.data)
      }
    })
    // 获取点赞列表
    getaddPraisedList({
      userId: nowUserId,
      pageNo: 1,
      pageSize: 0,
    }).then((res: any) => {
      setPariseList(res?.data?.content || [])
    })
    return () => {
      isUnmounted = true
      WDHCountTimering = null
      ipcRenderer.removeAllListeners('update_unread_msg')
    }
  }, [])
  useLayoutEffect(() => {
    // 设置工作台可拖动窗口区域
    // makeDraggable('#header_box')
  }, [])
  //加载关注人工作台的企业下拉
  useEffect(() => {
    if (num) {
      getTeamInfo({
        userId: followInfo.userId || nowUserId,
        loginUserId: nowUserId,
      }).then((data: any) => {
        if (data.returnCode === 0) {
          if (data.dataList !== null && data.dataList.length !== 0) {
            const orgList = data.dataList || []
            let setlectOrg = orgList.filter((item: { id: number }) => item.id === selectTeamId)
            if (followUserInfo.followStatus) {
              if (setlectOrg.length === 0) {
                setlectOrg = [orgList[0]]
              }

              state.orgList = orgList
              state.org = {
                orgName: setlectOrg[0].shortName || '',
                orgImg: setlectOrg[0].logo || '',
              }
              setState({
                ...state,
              })
              $store.dispatch({
                type: 'SET_FOLSEL_ORGID',
                data: {
                  followSelectTeadId: setlectOrg[0].id,
                },
              })
            }
          }
        } else {
          message.error(data.returnMessage)
        }
      })
    }
  }, [num])

  /**
   * 设置需要显示的添加按钮
   */
  const setAddMenus = () => {
    // 添加按钮设置
    const addBtnMenus: any = []
    addMenu.map((mItem: any) => {
      let findItem
      if (NEWAUTH812) {
        // 8.12权限控制
        findItem = mItem?.baseAuth || getAuthStatus(mItem?.authCode)
      } else {
        // 初始渲染按钮
        findItem = funsAuthList.find(
          (item: any) => item.name == mItem.code && item.hasAuth && item.auths?.includes(mItem.subCode)
        )
      }

      if (findItem) {
        addBtnMenus.push(mItem)
      }
    })
    return addBtnMenus
  }

  const refreshHeader = (paramObj?: any) => {
    queryCondolenFn?.(paramObj)
  }

  //关注人工作台企业切换
  const changeOrg = (item: any) => {
    state.org = {
      orgName: item.shortName,
      orgImg: item.logo,
    }
    setState({
      ...state,
    })
    $store.dispatch({
      type: 'SET_FOLSEL_ORGID',
      data: {
        followSelectTeadId: item.id,
      },
    })
  }
  // 查询关注人信息
  const getTeamInfo = (params: any) => {
    const { loginToken } = $store.getState()
    return new Promise((resolve, reject) => {
      $api
        .request('/team/enterpriseInfo/findFollowUserOrg', params, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(res => {
          resolve(res)
        })
    })
  }
  const clickShowTeamList = () => {
    const { nowUserId, nowAccount } = $store.getState()
    const params = {
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }
    $api
      .request('/team/enterpriseInfo/newQueryTeamList', params, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: $store.getState().loginToken,
        },
      })
      .then(res => {
        //存储当前选中的信息
        if (res.returnCode == 0) {
          const list = res.dataList || []
          const selectTeam: any = list.find((item: any) => item.isLast === 1)
          setTeamInformation(selectTeam)
          $store.dispatch({
            //存储企业ID
            type: 'SET_SEL_TEAMID',
            data: { selectTeamId: selectTeam ? selectTeam.id : -1 },
          })
          const queryCondolen = (paramObj?: any) => {
            const { newAvatar, addBtnMenus }: any = paramObj ? paramObj : {}
            queryCondolences(selectTeam?.id, isFollow).then((data: any) => {
              if (refreshRainBow) {
                refreshRainBow({
                  text: data.describe,
                  name: data.name,
                })
              }
              $store.dispatch({
                //存储彩虹屁
                type: 'SET_RAINBOW_INFORMATION',
                data: { text: data.describe, name: data.name },
              })

              const { describe, hour } = data
              renderTimeIcon(hour)
              if (isFollow) {
                const { userProfile, name } = followUserInfo
                state.profileImg = userProfile
                state.userName = name
                state.userTitle = data.name
                state.sympathy = describe
                if (addBtnMenus) {
                  state.addMenus = addBtnMenus
                }

                setState({ ...state })
              } else {
                state.profileImg = newAvatar ? newAvatar : nowAvatar
                state.userName = nowUser
                state.userTitle = data.name
                state.sympathy = describe
                if (addBtnMenus) {
                  state.addMenus = addBtnMenus
                }
                setState({ ...state })
              }
              setNum(1)
            })
          }
          queryCondolenFn = queryCondolen
          queryCondolen()
        }
      })
      .catch(() => {})
  }
  //查询彩虹屁

  //根据当前时间展示相应的图标
  const renderTimeIcon = (hour: number) => {
    let dateIcon = ''
    if (hour >= 6 && hour < 11) {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_sw.png')
    } else if (hour >= 11 && hour < 13) {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_zw.png')
    } else if (hour >= 13 && hour < 19) {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_xw.png')
    } else if (hour >= 19 && hour < 23) {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_ws.png')
    } else {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_sy.png')
    }
    setState((state: Datas) => {
      state.timeImgSrc = dateIcon
      return state
    })
  }
  //关闭汇报列表
  const antIcon = <LoadingOutlined style={{ fontSize: 20 }} spin />
  const hideReportList = () => {
    setState({ ...state, showReportListModal: false })
  }
  // 关闭会议弹窗
  const hideMettingList = () => {
    setState({ ...state, showMettingListModal: false })
  }
  // 吾同体育外部链接
  const createWuTongWindow = (selectTeamId: any) => {
    for (let i = 0; i < newTeamList.length; i++) {
      if (newTeamList[i].id == selectTeamId) {
        // 吾同外部访问地址拼接
        const _https = `${newTeamList[i].businessDataAddress}/api/wuts/index?company_id=${newTeamList[i].id}&user_account=${nowAccount}`
        wutsRequest(_https)
      }
    }
  }
  // 根据返回状态判断是否打开吾同体育窗口
  const wutsRequest = (url: any) => {
    Axios.get(url).then(res => {
      if (res.data.returnCode == 0 && res.data.data.url != '') {
        const _url = res.data.data.url
        $store.dispatch({
          type: 'WU_TONG_URL',
          data: {
            url: _url,
          },
        })
        $tools.createWindow('WuTongWindow')
      } else {
        message.error('外部应用连接异常')
      }
    })
  }
  // 打开四象限创建目标任务
  const openPlanWindow = (_selectTeamId?: any, _selectTeamName?: any) => {
    const TeamId = _selectTeamId ? _selectTeamId : selectTeamId
    const TeamName = _selectTeamName ? _selectTeamName : selectTeamName
    $store.dispatch({
      type: 'FROM_PLAN_TYPE',
      data: { createType: 0, fromToType: 1 },
    })
    $store.dispatch({ type: 'PLANOKRMAININFO', data: { isMyPlan: true } })
    $store.dispatch({ type: 'DIFFERENT_OkR', data: 1 })
    $store.dispatch({
      type: 'MYPLAN_ORG',
      data: { cmyId: TeamId, curType: -1, cmyName: TeamName, curId: TeamId },
    })
    $store.dispatch({
      type: 'MINDMAPOKRDATA',
      data: {
        id: 0,
        typeId: 0,
        name: '', //目标Objective
        teamName: TeamName,
        teamId: TeamId,
        status: 1,
        mainId: '',
        type: 2,
        ascriptionType: -1,
      },
    })
    state.loading = ''
    state.isShowAddPlan = false
    setState({ ...state })
    $tools.createWindow('okrFourquadrant').then(() => {})
  }
  /**
   * 打开创建任务
   */
  const openCreateTask = ({ taskType }: any) => {
    const param = {
      visible: true,
      createType: 'add',
      from: 'workbench',
      taskType,
      nowType: 0, //0个人任务 2企业任务 3部门任务
      teaminfo: selTeamItem, //企业信息
      callbacks: (param: any, code: any) => {
        const orgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
        if (param.data.ascriptionId === selectTeamId || orgId == '') {
          getDeskModule()
        }
      },
    }
    createTaskRef.current && createTaskRef.current.setState(param)
  }
  const selectHandleItem = (key: any) => {
    setState({
      ...state,
      active: key,
    })

    if (key === '0') {
      //工作报告
      setEntranceVisble({
        report: true,
      })
      $store.dispatch({
        type: 'WORKREPORT_TYPE',
        data: {
          wortReportType: 'create',
          wortReportTtime: Math.floor(Math.random() * Math.floor(1000)),
        },
      })
      state.loading = key
      setState({ ...state })
      $tools
        .createWindow('WorkReport')
        .finally(() => {
          setEntranceVisble({
            visible: false,
            report: false,
          })
        })
        .then(() => {
          state.loading = ''
          setState({ ...state })
        })
    } else if (key == '1') {
      //发起会议
      setEntranceVisble({
        visible: false,
      })
      setState({
        ...state,
        meetAdd: true,
      })
    } else if (key == '2') {
      //发起审批
      setEntranceVisble({
        approval: true,
      })
      state.loading = key
      setState({ ...state })
      $tools
        .createWindow('Approval')
        .finally(() => {
          setEntranceVisble({
            visible: false,
            approval: false,
          })
        })
        .then(() => {
          state.loading = ''
          setState({ ...state })
        })
    } else if (key == '3') {
      //发布公告
      setEntranceVisble({
        addMoadal: true,
      })
      ipcRenderer.send('close_addModal_window')
      $store.dispatch({
        type: 'ADD_MODAL_MSG',
        data: {
          companyId: 0, //企业id,
          groupId: undefined, //分组id
          enterpriseList: undefined,
          editNoticeData: '',
        },
      })
      state.loading = key
      setState({ ...state })
      $tools
        .createWindow('AddModalWin')
        .finally(() => {
          setEntranceVisble({
            visible: false,
            addMoadal: false,
          })
        })
        .then(() => {
          state.loading = ''
          setState({ ...state })
        })
    } else if (key == '4') {
      //项目
      openCreateTask({ taskType: 1 })
    } else if (key == '6') {
      const param = {
        visible: true,
        createType: 'add',
        from: 'workbench',
        nowType: 0, //0个人任务 2企业任务 3部门任务
        callbacks: (param: any, code: any) => {
          const orgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
          if (param.data.ascriptionId === selectTeamId || orgId == '') {
            getDeskModule()
          }
        },
      }
      createObjectRef.current && createObjectRef.current.getState(param)
    } else if (key == '5') {
      //任务
      openCreateTask({ taskType: 0 })
    } else if (key == 'test') {
      //测试用
      shell.openExternal('https://itunes.apple.com/us/app/998dian-wan-cheng/id1135278767?mt=8')
    } else {
      setEntranceVisble({
        visible: false,
      })
    }
  }
  const getNowCmyDate = (cmyId: any, type?: string) => {
    //新增okr
    state.loading = '6'
    setState({ ...state })
    selectDateDisplay().then((res: any) => {
      periodGetList({
        numDisplay: res.data.isClosed,
        id: cmyId,
        mySelf: '1',
        ascriptionId: isFollow ? $store.getState().followUserInfo.userId : $store.getState().nowUserId,
        ascriptionType: 0,
        status: [1, 2, 3, 4],
        loginUser: isFollow ? $store.getState().followUserInfo.userId : undefined,
      }).then((res: any) => {
        if (!res.data) {
          message.error('OKR尚未启用，请联系管理员开启')
        } else {
          if (type != undefined) {
            openPlanWindow(cmyId, type)
          } else {
            openPlanWindow()
          }
        }
        return res.data
      })
    })
  }
  //添加按钮列表
  const menu = (
    <Menu
      className="publishMenu flex"
      onClick={props => {
        selectHandleItem(props.key)
      }}
    >
      {setAddMenus()?.map((item: any) => {
        return (
          <Menu.Item key={item.key}>
            <div className={`menu_item_box flex column center ${state.active == item.key ? 'active' : ''}`}>
              <img
                className={`${state.loading == item.key ? 'opacity3' : ''}`}
                src={$tools.asAssetsPath(item.img)}
              ></img>
              <span className={`${state.loading == item.key ? 'opacity3' : ''}`}>{item.title}</span>
              {state.loading == item.key && <Spin indicator={antIcon} />}
            </div>
          </Menu.Item>
        )
      })}
    </Menu>
  )
  /**
   * 模块编辑器弹框显示
   */
  const editMoudelueTab = () => {
    editModuleModalRef.current?.setState({
      visible: true,
      modalTagItemData: null,
      onSure: (backData: any) => {
        editModuleSure({
          backData,
          userId: nowUserId,
          getDeskModule,
        })
      },
    })
  }
  const addClass = (type: number) => {
    // 动态加类
    switch (type) {
      case 1:
        $('.contorl_pannel').removeClass('addClassname')
        $('.task_panel').removeClass('addClassname')
        $('.workbench').addClass('addClassname')
        break
      case 2:
        $('.workbench').removeClass('addClassname')
        $('.task_panel').removeClass('addClassname')
        $('.contorl_pannel').addClass('addClassname')
        break
      case 3:
        $('.workbench').removeClass('addClassname')
        $('.contorl_pannel').removeClass('addClassname')
        $('.task_panel').addClass('addClassname')
        break
    }
  }
  // 请求获赞已读
  const getReadparise = () => {
    setparisevisibleShow(!parisevisibleShow)
    if (parisevisibleShow == true) {
      // 调用获赞已读接口
      readPariseList({ userId: nowUserId }).then((res: any) => {
        if (res.returnCode == 0) {
          NoreadPariseList({
            userId: nowUserId,
          }).then((res: any) => {
            setNoreadNumber(res.data)
          })
          getaddPraisedList({
            userId: nowUserId,
            // belongId: selectTeamId,
            pageNo: 1,
            pageSize: 0,
          }).then((res: any) => {
            setPariseList(res.data.content)
          })
        }
      })
    }
  }
  // 跳转
  const TopariseInfo = (item: any) => {
    reportSet({
      visible: true,
      reportId: item.typeId,
    })
  }
  const selectHeight = () => {
    if (pariseList?.length == 1) {
      return { height: '143px' }
    }
    if (pariseList?.length == 2) {
      return { height: '255px' }
    } else {
      return { height: '413px' }
    }
  }
  const content = (
    <div className="pariselistcontant" style={selectHeight()}>
      {pariseList.map((item: any, index: any) => {
        return (
          <div key={index}>
            <div className="pariselistcontant_header">
              <div className="pariselistcontant_header_left">
                <span>
                  {item.userProfile ? (
                    <img className="pariselistcontant_header_pic" src={item.userProfile} alt="" />
                  ) : (
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#3949ab',
                        color: '#fff',
                        fontSize: '11px',
                        lineHeight: '24px',
                        textAlign: 'center',
                      }}
                    >
                      {item.userName.substr(item.userName.length - 1)}
                    </span>
                  )}
                  {/* <span className="noreadicon"></span> */}
                  {item.readState == 0 ? <span className="noreadicon"></span> : <span></span>}
                </span>
                <span className="pariseListName">
                  {item.userName.length > 3 ? item.userName.substr(0, 3) + '..' : item.userName}
                </span>
                <span className="pariseList_support">点赞了你的报告</span>
              </div>
              <div className="pariselistcontant_header_right">
                <div className="pariselistcontant_header_timer">{item.typeTime.substr(0, 10)}</div>
              </div>
            </div>
            <div
              className="pariselistcontant_contant"
              style={{
                height:
                  item.contentInfo.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, '').length < 30
                    ? '58px'
                    : '76px',
              }}
              onClick={() => TopariseInfo(item)}
            >
              <div className="pariselistcontant_contant_title text-ellipsis"> {nowUserName}的日报</div>
              <div className="pariselistcontant_contant_text">
                {item.contentInfo.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, '').length > 30
                  ? item.contentInfo
                      .replace(/<[^>]+>/g, '')
                      .replace(/&nbsp;/gi, '')
                      .slice(0, 40) + '...'
                  : item.contentInfo.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, '')}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // 设置弹出
  const setting = (
    <div className="seetingshow">
      <div
        className="setting_contant"
        onClick={e => {
          e.nativeEvent.stopImmediatePropagation()
          editMoudelueTab()
        }}
      >
        设 置
      </div>
    </div>
  )
  useEffect(() => {
    NoreadPariseList({
      userId: nowUserId,
    }).then((res: any) => {
      setNoreadNumber(res.data)
    })
  }, [])
  return (
    <div id="header_box" className="header_box flex center-v between">
      {/* 左侧用户信息 */}
      <div className="left_user_box ">
        <Dropdown
          trigger={['click']}
          visible={optShow}
          className="setting"
          placement="bottomCenter"
          overlay={setting}
          disabled={isFollow}
          onVisibleChange={(flag: boolean) => {
            setOptShow(flag)
          }}
        >
          <div
            className={$c('workbench addClassname')}
            onClick={() => {
              if (!isFollow) {
                setOptShow(true)
                addClass(1)
              }
            }}
          >
            我的工作台
            <span className={$c('icon-close', { 'icon-open': optShow })}></span>
          </div>
        </Dropdown>

        <div
          className="contorl_pannel"
          style={{ display: 'none' }}
          onClick={() => {
            addClass(2)
          }}
        >
          自定义面板
        </div>
        <div
          className="task_panel"
          style={{ display: 'none' }}
          onClick={() => {
            addClass(3)
          }}
        >
          项目看板
        </div>
      </div>
      {/* 右侧按钮 */}
      {!isFollow && (
        <div className="righ_handle_box flex ">
          {/* rainbow */}
          {/* {state.sympathy ? (
            <div className="rainbow">
              <Tooltip title={state.sympathy}>
                <div className="rainbowcontant">{state.sympathy}</div>
              </Tooltip>
            </div>
          ) : (
            <div></div>
          )} */}

          {/* 获赞数显示 */}

          <Dropdown
            trigger={['hover']}
            className="pover"
            placement="bottomCenter"
            overlay={parisenum !== 0 ? content : <span></span>}
            arrow={true}
            visible={parisevisibleShow}
            onVisibleChange={() => getReadparise()}
          >
            <div className="pariseList">
              <div className="addnum">
                <span className="text_left">获赞</span>
                <span className="text_right">{parisenum}</span>
              </div>
            </div>
          </Dropdown>
          {/* 获赞未读 */}
          {/* <div className="no_readpariseList">+{NoreadNumber}</div> */}

          {NoreadNumber == 0 ? (
            <div className="no_readpariseList_space"></div>
          ) : (
            <div className="no_readpariseList">+{NoreadNumber}</div>
          )}
          <div className="but_handle flex center ">
            <Dropdown
              overlay={
                <FollowUser
                  isFollow={isFollow}
                  callbackFn={() => {
                    setState({ ...state, isShowFollow: false })
                  }}
                ></FollowUser>
              }
              trigger={['click']}
              arrow={true}
              visible={state.isShowFollow}
              onVisibleChange={e => setState({ ...state, isShowFollow: e })}
            >
              {/*点赞 */}
              <Tooltip title={'关注'}>
                <span className="addparise"></span>
              </Tooltip>
            </Dropdown>
            {/* 汇报 */}
            {/* 8.12 */}
            {(NEWAUTH812 ? true : getFunsAuth({ name: 'workReport' })) && (
              <Tooltip title={'汇报'}>
                <span
                  className={$c('handler-icon', { 'red-span': redDot })}
                  onClick={e => {
                    e.preventDefault()
                    setState({ ...state, showReportListModal: true })
                  }}
                ></span>
              </Tooltip>
            )}
            {/* 会议 */}
            {(NEWAUTH812 ? true : getFunsAuth({ name: 'MEETING' })) && (
              <Tooltip title={'会议'}>
                <span
                  className={$c('handler-icon', { 'red-meet-dot': unreadDot.meetDot })}
                  onClick={e => {
                    e.preventDefault()
                    setState({ ...state, showMettingListModal: true })
                  }}
                ></span>
              </Tooltip>
            )}
            {/* 台账 */}
            {(NEWAUTH812
              ? getAuthStatus('baseFormCount') || getAuthStatus('baseFormManage')
              : getFunsAuth({ name: 'STANDING_BOOK' })) && (
              <Tooltip title={'云台账'}>
                <span
                  onClick={() => {
                    setEntranceVisble({ cloudStand: true })
                    $store.dispatch({ type: 'SET_BUSINESS_INFO', data: null })
                    $tools.createWindow('BusinessData').finally(() => {
                      setEntranceVisble({ cloudStand: true })
                    })
                  }}
                ></span>
              </Tooltip>
            )}
            {/* 吾同体育入口权限校验 */}
            {selectTeamId != -1 && entranceVisble.wuTongAuth && (
              <Tooltip title={'吾同'}>
                <span
                  onClick={() => {
                    createWuTongWindow(selectTeamId)
                  }}
                ></span>
              </Tooltip>
            )}
          </div>
          <span className="line flex center"></span>
          {/* 添加 */}
          <Dropdown
            overlay={menu}
            trigger={['click']}
            arrow={true}
            visible={entranceVisble.visible}
            onVisibleChange={e => setEntranceVisble({ visible: e })}
            placement="bottomRight"
            overlayStyle={{ marginRight: '24px' }}
            overlayClassName="but_add_dropdown"
          >
            <div className="but_add flex">
              <span></span>
            </div>
          </Dropdown>
          {/* <span className="line flex center"></span> */}
          {/* <div className="but_set flex center"> */}
          {/* 设置 */}
          {/* {!isFollow && (
              <Tooltip title={'设置'}>
                <span
                  onClick={e => {
                    e.nativeEvent.stopImmediatePropagation()
                    editMoudelueTab()
                  }}
                ></span>
              </Tooltip>
            )}
          </div> */}
          {state.showReportListModal && (
            <ReportList visible={state.showReportListModal} onHideModal={hideReportList} />
          )}
          {state.showMettingListModal && (
            <MettingList visible={state.showMettingListModal} onHideModal={hideMettingList} />
          )}
        </div>
      )}
      {/* 关注人工作台 */}
      {isFollow && (
        <Dropdown
          overlay={
            <Menu>
              {state.orgList.map((item: any, index: number) => (
                <Menu.Item key={index} onClick={() => changeOrg(item)}>
                  <div>{item.shortName}</div>
                </Menu.Item>
              ))}
            </Menu>
          }
          trigger={['click']}
        >
          <div className="follow_org flex">
            <div className="orgImg">
              <Avatar
                src={state.org.orgImg}
                style={{
                  color: '#fff',
                  backgroundColor: '#4285f4',
                  fontSize: 12,
                  marginRight: 5,
                  borderRadius: '50%!important',
                }}
              >
                {state.org.orgName ? state.org.orgName?.substr?.(0, 4) : ''}
              </Avatar>
            </div>
            <div className="orgName">{state.org?.orgName}</div>
            <RightOutlined className="org_d_icon" />
          </div>
        </Dropdown>
      )}
      <CreateTaskModal ref={createTaskRef} />
      <CreateObjectModal ref={createObjectRef} />
      {state.meetAdd && (
        <MettingDetailsPop
          datas={{
            listType: -1,
            typeId: -1,
            visibleDetails: state.meetAdd,
            openType: 'create',
            nowStatus: -1,
            isMeetType: false,
            isDeskIn: true,
          }}
          isVisibleDetails={(flag: boolean) => {
            setState({ ...state, meetAdd: flag })
          }}
        />
      )}
      {/* 选择企业 */}
      {state.isShowAddPlan && (
        <WorkPlanMindModal
          isOkr={true}
          visible={state.isShowAddPlan}
          state={0}
          isShowAddPlan={(state: any) => {
            setState({ ...state, isShowAddPlan: state })
          }}
          handleOk={(teamid: any, teamname: any) => {
            getNowCmyDate(teamid, teamname)
          }}
        ></WorkPlanMindModal>
      )}
      {/* 编辑标签弹框 */}
      <EditModuleModal ref={editModuleModalRef} />
      {/*报告详情*/}
      {report.visible && (
        <ReportDetails
          param={{
            reportId: report.reportId,
            isVisible: report.visible,
            isMuc: 1,
          }}
          setvisible={(state: any) => {
            // setReportdetail(state)
            reportSet({
              visible: false,
            })
          }}
        ></ReportDetails>
      )}
    </div>
  )
}

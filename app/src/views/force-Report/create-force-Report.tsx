import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  findTaskLogForm, //当前汇报详情
  addTaskReport,
} from '../DailySummary/common/getReprt'
import { shareToRoom } from '../../common/js/api-com'
import { queryTodayWrite, cancelRelationTask } from './component/getData'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import { Avatar, Slider, Input, Typography, message, Button, Card, Statistic, Tag } from 'antd'
import { ShareToRoomModal } from '../workplan/WorkPlanModal'
import AddForceReportModel from './addForceReportModel'
import Summernote from '@/src/components/editor/index'
import './create-force-Report.less'
import { CheckboxOptionType } from 'antd/lib/checkbox'
import { ipcRenderer } from 'electron'
import UploadFile from '@/src/components/upload-file/index'
import { requestApi } from '@/src/common/js/ajax'
import EditorAt, { editorAtChange, getAtUsers, setOldEditorTxt } from '@/src/components/editor/editorAt'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
const { Title } = Typography
import moment from 'moment'
import { loadLocales } from '@/src/common/js/intlLocales'
import { refreshPage } from '../workdesk/TaskListData'
interface DailyItemProps {
  taskName: string
  startTime: string
  endTime: string
  process: number
  taskId: number
  relation: number
  status: number
  describe: string
  models: Array<any>
  executeTime: string
  finishTime: string
  flag: number
  approvalStatus: number
  subTaskCount: number
  objectiveProcess: number
  joinTeams: Array<number>
  teamList: any
}
interface ShareRoomList extends CheckboxOptionType {
  belongOrg: string
  belongType: string
  belongTypeId: string
  id: string
  muc: string
  subject: string
  talkType: number
  toPerson: Array<string>
  icon?: string
  type?: string
}
interface ItemModel {
  id: number
  name: string
  warnText: string
  position: number
  isRequired: number
  content: string
  plans: null
  taskIds: null
  userModels: null
  editInput: boolean
}
interface ReportUserListProps {
  userId: number
  username: string
  profile: string
  forceReportUser: boolean
  disable?: boolean
  delable?: boolean //判断汇报人和抄送人是否可以删除
}
interface ForceReportData {
  forceReportId: number
  forceTimeId: number
  reportTime: string
  reportTimes: Array<{ reportTime: string; isFinish: number; isCurrent: number; type: number }>
  userId: number
  username: string
  profile: string
  reportUser: string
  taskId: number
  taskName: string
  ascriptionType: number
  ascriptionId: number
  ascriptionName: null
  reportId: null
  isRead: number
  relationId: null
  content: string
  status: number
}
const { Countdown } = Statistic
let stepIndex = 1 //slider步数控制
//处理模板
const solveText = (text: string) => {
  let description = text
  description = description.replace(/(\n)/g, '')
  description = description.replace(/(\t)/g, '')
  description = description.replace(/(\r)/g, '')
  description = description.replace(/<\/?[^>]*>/g, '')
  description = description.replace(/\s*/g, '')
  description = description.replace(/&nbsp;/g, '')
  description = description.replace(/:::/g, '')
  return description
}
let forceListReport: any = {}
// 富文本编辑器
const editors: any = []

const CreateForceReport = () => {
  const { nowUserId } = $store.getState()
  const visableData = useSelector((state: StoreStates) => state.forceListReport)
  const [listData, setTableData] = useState<DailyItemProps>(Object) //用来存储编辑后的数据
  //描述收起展开
  const [textShow, setTextShow] = useState(false)
  //打开选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  // 汇报对象
  const [reportUserList, setReportUserList] = useState<Array<ReportUserListProps>>([])
  //抄送对象
  const [CCUserList, setCCUserList] = useState<Array<ReportUserListProps>>([])
  //选中类型
  const [selectType, setSelectType] = useState(0) //0汇报选人 1 抄送选人
  const [refreshfile, setRefreshfile] = useState(false) // //更新附件刷新
  //打开添加汇报弹框
  const [addVisibleReport, setVisibleReport] = useState(false)
  let judgueText = false
  // 保存草稿汇报
  const [allUserList, setAllUserList] = useState<any>([])
  //群聊
  const [shareToRoomModalShow, setShareToRoomModalShow] = useState(false)
  //强制汇报左侧列表
  const [forceReportList, setForceReportList] = useState<ForceReportData[]>([])
  const [saveprocess, setProcess] = useState(0)
  // 上传的文件列表数据
  const [fileUserList, setFileUserList] = useState<Array<any>>([])
  // 选人插件参数
  const initSelMemberOrg: any = {
    teamId: '',
    sourceType: 'report', //操作类型
    allowTeamId: [''],
    selectList: [], //选人插件已选成员
    checkboxType: 'checkbox',
    permissionType: 3, //组织架构通讯录范围控制
    showPrefix: false, //不显示部门岗位前缀
  }
  const [selMemberOrg, setSelMemberOrg] = useState(initSelMemberOrg)
  const [showtabheader, setShowtabheader] = useState(true)
  //当前选中item
  const [selectItem, setSelectItem] = useState<any>({})
  // 缓存当前被清空、删除强制汇报数据
  const [delForceReportId, setDelForceReportId] = useState('')
  // 详情弹框组件
  const detailModalRef = useRef<any>({})
  /**
   * 初始化方法
   */
  const initFn = () => {
    if (visableData.id || visableData.id === '') {
      setRefreshfile(false)
      setAllUserList([])
      queryTodayWrite().then((res: any) => {
        if (res.data) {
          setForceReportList(res.data)
          if (res.data.length == 0) {
            return false
          }
          forceListReport = res.data[0]
          if (forceListReport.relationId == null) {
            setShowtabheader(true)
          } else {
            setShowtabheader(false)
          }
          setAllUserList([
            {
              forceReportId: forceListReport ? forceListReport.forceReportId : 0,
              forceTimeId: forceListReport ? forceListReport.forceTimeId : 0,
              taskId: forceListReport ? forceListReport.taskId : 0,
              models: [], //富文本
              // reportPersonList: forceListReport ? forceListReport.reporter : [], //汇报人
              reportPersonList: [],
              process: null, //进度
              roomIdList: [], //分享到群
            },
          ])
          res.data.some((element: any) => {
            if (visableData.noticeTypeId == element.forceTimeId) {
              forceListReport = element
              setAllUserList([
                {
                  forceReportId: element ? element.forceReportId : 0,
                  forceTimeId: element ? element.forceTimeId : 0,
                  taskId: element ? element.taskId : 0,
                  models: [], //富文本
                  reportPersonList: [], //汇报人
                  process: null, //进度
                  roomIdList: [], //分享到群
                },
              ])
              return true
            } else if (visableData.noticeTypeId == '' && element.taskId == visableData.id) {
              forceListReport = element
              setAllUserList([
                {
                  forceReportId: element ? element.forceReportId : 0,
                  forceTimeId: element ? element.forceTimeId : 0,
                  taskId: element ? element.taskId : 0,
                  models: [], //富文本
                  reportPersonList: [], //汇报人
                  process: null, //进度
                  roomIdList: [], //分享到群
                },
              ])
              return true
            }
          })
          reQuestOrigin()
        }
      })
    }
  }
  useEffect(() => {
    // 初始化多语言配置
    loadLocales()
    // ipcRenderer.on('window-show', () => {
    //   initFn()
    // })
    ipcRenderer.on('handerForceReport_info', (_event, args) => {
      const { reportid } = args
      setDelForceReportId(reportid)
    })
  }, [])
  useEffect(() => {
    if (!delForceReportId) return
    const _forceReportList = forceReportList.filter((item: any) => item.forceReportId != delForceReportId) || []
    // 如果当前汇报列表为空，关闭此汇报窗口
    if (_forceReportList.length == 0) return ipcRenderer.send('close_force_report')
    // 判断当前清空操作汇报：当前选择汇报
    if (delForceReportId == forceListReport.forceReportId) {
      forceListReport = _forceReportList.length != 0 ? _forceReportList[0] : {}

      setTableData(forceListReport)
      setForceReportList(_forceReportList)
      _forceReportList[0]?.relationId == null ? setShowtabheader(true) : setShowtabheader(false)
      reQuestOrigin()
    } else {
      setForceReportList(_forceReportList)
    }
  }, [delForceReportId])
  //loading
  useEffect(() => {
    initFn()
  }, [visableData])

  const reQuestOrigin = (list?: any) => {
    if (!forceListReport?.taskId) return
    findTaskLogForm(forceListReport.taskId).then((resData: any) => {
      setFileUserList([])
      $store.dispatch({ type: 'ROOM_ID_LIST', data: [] })
      if (resData.data) {
        if (resData.data.process == 100) {
          forceListReport.status = 2
        }
        if (resData.data.models) {
          resData.data.models.map((item: any, index: number) => {
            if (list) {
              // setCCUserList
              allUserList.forEach((element: any) => {
                if (
                  forceListReport.forceReportId === element.forceReportId &&
                  forceListReport.taskId === element.taskId &&
                  element.forceTimeId == forceListReport.forceTimeId
                ) {
                  if (element.models) {
                    element.models.map((data: any) => {
                      if (data.id === item.id) {
                        item.content = data.content
                      }
                    })
                  }
                  if (element.process || element.process == 0) {
                    resData.data.process = element.process
                    setProcess(element.process)
                  }
                  if (element.roomIdList && element.roomIdList.length > 0) {
                    $store.dispatch({
                      type: 'ROOM_ID_LIST',
                      data: element.roomIdList,
                    })
                  }
                }
              })
            }
            if (index == 0) {
              item.editInput = true
            } else {
              item.editInput = false
            }
          })
        }
        if (resData.data.describe) {
          resData.data.describe = solveText(resData.data.describe)
        }
      }
      setProcess(resData.data.process)
      setTableData(resData.data)
      const arrList: any = []
      const arrList2: any = []

      if (forceListReport && forceListReport.receiver) {
        forceListReport.receiver.map((item: any) => {
          arrList.push({
            userId: item.userId,
            username: item.username,
            profile: item.profile,
            disable: true,
          })
        })
      }
      if (forceListReport && forceListReport.copyUser) {
        forceListReport.copyUser.map((item: any) => {
          arrList2.push({
            userId: item.userId,
            username: item.username,
            profile: item.profile,
            disable: true,
          })
        })
      }
      setRefreshfile(true)
      setReportUserList(arrList)
      setCCUserList(arrList2)
      setTextShow(false)
    })
  }
  // 添加模板内容
  const selReportUser = (type: any) => {
    //0汇报对象 1抄送对象

    const setList: any = []
    if (type === 0) {
      reportUserList.map((item: any) => {
        setList.push({
          curId: item.userId,
          curName: item.username,
          curType: 0,
          profile: item.profile,
          disable: item.disable,
        })
      })
    } else {
      CCUserList.map((item: any) => {
        setList.push({
          curId: item.userId,
          curName: item.username,
          curType: 0,
          profile: item.profile,
          disable: item.disable,
        })
      })
    }
    let arrList: any = []
    const orgBotList: any = []
    if (listData.joinTeams) {
      // arrList.push(listData.joinTeams[0])
      arrList = listData.joinTeams
    }
    if (listData.teamList) {
      listData.teamList.map((titem: any) => {
        orgBotList.push({
          curId: titem.userId,
          curName: titem.username,
          curType: 0,
          cmyId: titem.teamId,
          cmyName: titem.teamName,
          profile: titem.profile,
        })
      })
    }
    setSelMemberOrg({
      ...selMemberOrg,
      selectList: setList,
      allowTeamId: arrList,
      sourceType: 'report',
      orgBotInfo: {
        type: 'joinTeam',
        title: '参与企业联系人',
        titleSub: '（该任务链条下的企业联系人）',
      },
      orgBotList: orgBotList,
    })
    setMemberOrgShow(true)
  }
  // 进度输入值控制整数
  const changeInputVal = (e: any) => {
    stepIndex = 1
    let textboxvalue = e.target.value
    if (textboxvalue.length == 1) {
      textboxvalue = e.target.value.replace(/[^0-9]/g, '')
    } else {
      textboxvalue = e.target.value.replace(/^\D*(\d*(?:\.\d{0,2})?).*$/g, '$1')
    }
    if (textboxvalue > 100) {
      textboxvalue = 100
    }
    setProcess(textboxvalue)
    setTableData({ ...listData })
  }
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const _datas: any = []
    dataList.map((item: any, i: number) => {
      _datas.push({
        userId: item.curId,
        username: item.curName,
        profile: item.profile,
        type: 0,
        disable: item.disable,
      })
      if (selectType === 0) {
        setReportUserList(_datas)
      } else if (selectType === 1) {
        setCCUserList(_datas)
      }
    })
  }
  const shareTheRoom = () => {
    $store.dispatch({
      type: 'WORKPLAN_MODAL',
      data: {
        sourceItem: {},
        shareFormType: 'taskReport',
      },
    })
    setShareToRoomModalShow(true)
  }
  //保存汇报参数
  const saveReportData = () => {
    const planList: any = []
    let isRequire = false
    listData.models.map((item: ItemModel) => {
      const userModels = getAtUsers({ content: item.content || '' })
      item.userModels = userModels
      if (item.name == '下一步计划') {
        planList.push({
          content: item.content,
          userModels: userModels,
          sync: 1,
          startTime: '',
          endTime: '',
          userId: $store.getState().nowUserId,
        })
      }
      if (item.isRequired === 1) {
        if (item.content === '') {
          isRequire = true
        }
      }
    })
    if (!reportUserList || reportUserList.length == 0) {
      message.error('请选择汇报对象')
      return false
    }
    if (isRequire) {
      message.error('您有必填项未填写，请填写')
      return false
    }
    const mucIds: any = []
    if ($store.getState().roomIdList.length > 0) {
      $store.getState().roomIdList.map((data: ShareRoomList) => {
        if (data.id) {
          mucIds.push(data.id)
        }
      })
    }
    const fileList: any = []
    fileUserList.forEach(file => {
      if (file) {
        const fileName = file.name
        const fileSuffix = fileName
          .toLowerCase()
          .split('.')
          .splice(-1)[0]
        fileList.push({
          id: '',
          fileKey: file.uid + '.' + fileSuffix,
          fileName: file.name,
          fileSize: file.size,
          dir: 'taskReport',
        })
      }
    })
    const param: any = {
      taskId: forceListReport.taskId,
      userId: $store.getState().nowUserId,
      reportUserModels: reportUserList,
      reportCopyUserModels: CCUserList, //抄送对象
      planModels: planList,
      process: saveprocess,
      processSpend: 1,
      files: fileList,
      models: listData.models,
      checkTime: moment(new Date()).format('YYYY/MM/DD HH:mm:ss'),
      operateCode: '',
      forceTimeId: forceListReport.forceTimeId,
      mucIds: mucIds,
      isModify: '1',
    }
    addTaskReport(param).then((res: any) => {
      ipcRenderer.send('update_unread_num', ['report_count'])
      if (res && res.returnCode == 0) {
        if (res.data && mucIds.length > 0) {
          shareToRoom({
            selRoomList: $store.getState().roomIdList,
            shareObj: {
              id: forceListReport.taskId,
              reportId: res.data.taskReportId,
              name: res.data.taskName,
              type: 'report',
              title: '任务汇报',
              val: '',
            },
          })
        }
        if (visableData.id == forceListReport.taskId) {
          ipcRenderer.send('handle_messages_option', ['force_report_lazy', visableData.id, ''])
        }
      }
      setRefreshfile(false)

      queryTodayWrite().then((res: any) => {
        if (res.data && res.data.length > 0) {
          forceListReport = res.data[0]
          res.data[0].relationId == null ? setShowtabheader(true) : setShowtabheader(false)
          allUserList?.map((item: any) => {
            res.data?.map((sItem: any) => {
              if (item.forceReportId == sItem.forceReportId && item.forceTimeId == sItem.forceTimeId) {
                sItem['hasValue'] =
                  item.models.length > 0 &&
                  item.models[0].content?.replace(/&nbsp;/g, '').replace(/<[^>]*>|/g, '') &&
                  item.reportPersonList?.length > 0
                    ? true
                    : false
              }
            })
          })

          setTableData(forceListReport)
          setForceReportList(res.data)
          reQuestOrigin(listData)
        } else {
          ipcRenderer.send('close_force_report')
        }
      })
      // 刷新红色延时列表
      getDelayList()
      // 刷新工作台代办
      refreshPage && refreshPage()
    })
  }

  // 获取红色延迟任务列表
  const getDelayList = () => {
    const params = {
      userId: nowUserId,
    }
    requestApi({
      url: '/task/force/report/findForceReportDelay',
      param: params,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        const dataList = res.data.dataList || []
        $store.dispatch({
          type: 'DELAY_LIST_DATA',
          data: { dataList },
        })
      }
    })
  }

  const ShareRoomHtml = (props: any) => {
    const [roomListSelCheck, setRoomListSelCheck] = useState<Array<ShareRoomList>>([])
    useEffect(() => {
      setRoomListSelCheck(props.list)
    }, [props.list])
    const delShareItem = (id: string, name: string) => {
      roomListSelCheck.map((item: any, index: number) => {
        if (item.id == id) {
          return roomListSelCheck.splice(index, 1)
        }
      })
      setRoomListSelCheck([...roomListSelCheck])
      $store.dispatch({
        type: 'ROOM_ID_LIST',
        data: roomListSelCheck,
      })
    }
    return (
      <div className="shared_group_list">
        {roomListSelCheck.map((item: ShareRoomList, index: number) => (
          <div className="share_list_item" key={index}>
            {
              <Avatar
                className="oa-avatar"
                shape="square"
                size={20}
                src={item.icon || ''}
                style={{ maxWidth: '20px', minWidth: '20px' }}
              >
                {item.subject && item.subject.length > 2 ? item.subject.slice(-2) : item.subject}
              </Avatar>
            }
            <span className="cmp_name">{item.subject}</span>
            <span
              className="icon_del"
              onClick={() => {
                delShareItem(item.id, item.subject)
              }}
            ></span>
          </div>
        ))}
      </div>
    )
  }

  const delUser = (id: string, type: number) => {
    if (type === 0) {
      reportUserList.map((item: any, index: number) => {
        if (item.userId == id) {
          return reportUserList.splice(index, 1)
        }
      })
      setReportUserList([...reportUserList])
    } else if (type === 1) {
      CCUserList.map((item: any, index: number) => {
        if (item.userId == id) {
          return CCUserList.splice(index, 1)
        }
      })
      setCCUserList([...CCUserList])
    }
  }
  const onFinish = (e: any) => {
    if (new Date(e) < new Date()) {
      return '刚刚'
    }
  }
  const deadline = (val: string) => {
    return new Date(val).getTime()
  }
  const getDifferImage = (value: number) => {
    let srcimg = '/images/task/task_going.png'
    let srctext = '进行中'
    if (value === 0) {
      srcimg = '/images/task/task_nostart.png'
      srctext = '未开始'
    } else if (value === 100) {
      srcimg = '/images/task/task_finish.png'
      srctext = '已完成'
    }
    srcimg = $tools.asAssetsPath(srcimg)
    return {
      img: srcimg,
      text: srctext,
    }
  }
  //查看任务详情
  const lookTaskDetail = (item: any) => {
    //在当前强制汇报页面中显示任务详情
    const param = detailParam({ visible: true, taskId: item.taskId })
    detailModalRef.current.setState(param)
  }
  const saveAllUserList = (allUserList: any, item: any) => {
    if (
      allUserList.filter(
        (data: any) =>
          data.forceReportId === item.forceReportId &&
          data.forceTimeId == item.forceTimeId &&
          data.taskId == item.taskId
      ).length === 0
    ) {
      allUserList.push({
        forceReportId: item.forceReportId,
        forceTimeId: item.forceTimeId,
        taskId: item.taskId,
        models: [],
        reportPersonList: [],
        process: null,
        roomIdList: [],
      })
    }
    allUserList.forEach((element: any) => {
      if (
        forceListReport?.forceReportId == element.forceReportId &&
        forceListReport?.taskId == element.taskId &&
        element.forceTimeId == forceListReport?.forceTimeId
      ) {
        element.models = listData.models
        element.process = saveprocess
        element.reportPersonList = reportUserList
        element.roomIdList = $store.getState().roomIdList
      }
    })

    setAllUserList([...allUserList])
    allUserList.map((item: any) => {
      forceReportList.map((sItem: any) => {
        if (item.forceReportId == sItem.forceReportId && item.forceTimeId == sItem.forceTimeId) {
          sItem['hasValue'] =
            item.models.length > 0 &&
            item.models[0].content?.replace(/&nbsp;/g, '').replace(/<[^>]*>|/g, '') &&
            item.reportPersonList?.length > 0
              ? true
              : false
        }
      })
    })
    forceListReport = item
    setTableData(item)
    reQuestOrigin(listData)
    if (item.relationId == null) {
      setShowtabheader(true)
    } else {
      setShowtabheader(false)
    }
    // item.relationId == null ? '' : 'cancel_force_delete'
  }
  return (
    <>
      <div className="forceReportModal flex">
        <div className="force_list_report">
          <div
            className="force_list_add"
            onClick={() => {
              setVisibleReport(true)
              if (JSON.stringify(selectItem) != '{}') {
                saveAllUserList(allUserList, selectItem)
              }
            }}
          >
            <i></i>添加任务汇报
          </div>
          {forceReportList &&
            forceReportList.length > 0 &&
            forceReportList.map((item: any, index: number) => (
              <Card
                title={
                  <span
                    className="report-list-title"
                    style={{ paddingRight: !item.forceReportId ? '20px' : '' }}
                  >
                    {item.hasValue && <i></i>}
                    <span className="report-list-title-span">{item.taskName}</span>
                  </span>
                }
                bordered={false}
                key={index}
                onClick={(e: any) => {
                  // console.log('item==================', item)
                  e.stopPropagation()
                  setRefreshfile(false)
                  setSelectItem(item)

                  //todo
                  saveAllUserList(allUserList, item)
                }}
                className={
                  forceListReport?.forceReportId === item.forceReportId &&
                  forceListReport?.taskId === item.taskId &&
                  item.forceTimeId == forceListReport?.forceTimeId
                    ? 'actives'
                    : ''
                }
              >
                {item.forceReportId && (
                  <div>
                    需在{moment(new Date(item.reportTime)).format('MM/DD HH:mm')}之前汇报
                    {new Date(item.reportTime) < new Date() && <span className="getRed">已延迟未汇报</span>}
                    {new Date(item.reportTime) >= new Date() && (
                      <>
                        <span>倒计时</span>
                        <Countdown
                          value={item.reportTime ? deadline(item.reportTime) : undefined}
                          onFinish={() => {
                            onFinish(item.reportTime)
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
                {!item.forceReportId && (
                  <div
                    className={item.relationId == null ? '' : 'cancel_force_delete'}
                    onClick={() => {
                      cancelRelationTask(item.taskId).then((res: any) => {
                        queryTodayWrite().then((res: any) => {
                          if (res.data && res.data.length > 0) {
                            forceListReport = res.data[0]
                            setTableData(forceListReport)
                            setForceReportList(res.data)
                            res.data[0].relationId == null ? setShowtabheader(true) : setShowtabheader(false)
                            reQuestOrigin()
                          } else {
                            ipcRenderer.send('close_force_report')
                          }
                        })
                        // 刷新红色延时列表
                        getDelayList()
                      })
                    }}
                  ></div>
                )}
              </Card>
            ))}
        </div>
        {listData && listData.taskName && (
          <div className="writeTaskReportModal flex-1 flex column">
            {showtabheader && (
              <Tag
                icon={<img src={$tools.asAssetsPath('/images/clouddisk/tips.png')} />}
                className="reportContent-tag"
              >
                <div className="tag-t">
                  <div className="report-required">汇报要求: {forceListReport.content}</div>
                  <div className="reportContent-tag-span">
                    <span className="reportContent-rep">
                      汇报对象:
                      {reportUserList &&
                        reportUserList?.length != 0 &&
                        reportUserList?.map((item: any, i: number) => {
                          return (
                            <span className="reportUser" key={i}>
                              {i < reportUserList?.length - 1
                                ? (item.username && item.username.length > 4
                                    ? item.username.slice(-4)
                                    : item.username) + '、'
                                : item.username && item.username.length > 4
                                ? item.username.slice(-4)
                                : item.username}
                            </span>
                          )
                        })}
                    </span>
                    <span className="reportContent-rep">
                      抄送对象:
                      {CCUserList &&
                        CCUserList?.length != 0 &&
                        CCUserList?.map((item: any, i: number) => {
                          return (
                            <span className="reportUser" key={i}>
                              {i < CCUserList?.length - 1
                                ? (item.username && item.username.length > 4
                                    ? item.username.slice(-4)
                                    : item.username) + '、'
                                : item.username && item.username.length > 4
                                ? item.username.slice(-4)
                                : item.username}
                            </span>
                          )
                        })}
                    </span>
                  </div>
                  <span className="forcetime">{forceListReport.reportTime}</span>
                </div>
              </Tag>
            )}

            <div className="report_text_top">
              <Title level={4}>
                <span>{listData.taskName || ''}</span>
                <span
                  className="taskdetailshow"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    lookTaskDetail(listData)
                  }}
                >
                  任务详情&gt;
                </span>
              </Title>
              <div className="report_des_box flex">
                <div className="report_des_peo_box flex column center">
                  <Avatar
                    size={34}
                    style={{
                      marginBottom: 4,
                    }}
                    src={getDifferImage(saveprocess).img}
                  ></Avatar>
                  <span>{getDifferImage(saveprocess).text}</span>
                </div>
                <div className="report_des_cont_box flex-1">
                  <div className="report_des_cont_Item">
                    <span className="time">
                      时间：{' '}
                      {listData.startTime && listData.startTime.substring(listData.startTime.indexOf('/') + 1)}{' '}
                      - {listData.endTime && listData.endTime.substring(listData.endTime.indexOf('/') + 1)}
                    </span>
                  </div>
                  <div className="report_des_cont_Item flex" style={{ margin: '6px 0px' }}>
                    <span className="progress_text">进度：</span>{' '}
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      tipFormatter={() => {
                        return `${saveprocess}%`
                      }}
                      className="flex-1"
                      style={{ height: '6px' }}
                      value={saveprocess}
                      disabled={forceListReport && forceListReport.status == 2}
                      onChange={(value: any) => {
                        stepIndex = 5
                        setProcess(value)
                        setTableData({ ...listData })
                      }}
                    />
                    <Input
                      min={0}
                      size="small"
                      max={100}
                      value={saveprocess}
                      onChange={changeInputVal}
                      onPressEnter={(e: any) => {
                        e.target.blur()
                      }}
                      disabled={forceListReport && forceListReport.status == 2}
                    />{' '}
                    <span className="percent">%</span>
                  </div>
                  <div className="report_des_cont_Item flex">
                    任务描述：{' '}
                    <div
                      className="report_des_ellipsis"
                      style={textShow ? { overflow: 'visible', display: 'inline-block' } : {}}
                    >
                      {listData.describe}
                    </div>
                    <a
                      className="ant-typography-expand"
                      style={listData.describe && listData.describe.length > 51 ? {} : { display: 'none' }}
                      onClick={() => {
                        setTextShow(!textShow)
                      }}
                    >
                      {textShow ? '收起' : '展开'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="reportContent-container">
              <div className="reportTmpContainer">
                {listData.models &&
                  listData.models.map((data: ItemModel, index: number) => (
                    <div className="item_listBox flex" key={index}>
                      <div className="icon_box">
                        <span className="icon_t icon_cont"></span>
                        {data.isRequired === 1 && <span className="required_param">*</span>}
                      </div>
                      <div className="content_box">
                        <div className="tit_box">
                          <span>{data.name}</span>
                        </div>
                        {!data.editInput && (
                          <div
                            className="cont_box"
                            contentEditable={false}
                            dangerouslySetInnerHTML={{
                              __html:
                                solveText(data.content) || data.content.includes('img')
                                  ? data.content.split(':::').join('')
                                  : '请输入汇报内容',
                            }}
                            placeholder={'请输入汇报内容'}
                            data-configid={data.id}
                            onClick={() => {
                              listData.models.forEach((element: any) => {
                                if (element.editInput) {
                                  element.editInput = false
                                }
                              })
                              data.editInput = true
                              setTableData({ ...listData })
                              judgueText = false
                            }}
                          ></div>
                        )}

                        {data.editInput && (
                          <Summernote
                            className="forceReportEditor"
                            previewArea=".forceReportEditor"
                            editorContent={data.content ? data.content.split(':::').join('') : ''}
                            placeholder={data.warnText}
                            editorChange={(e: any) => {
                              if (solveText(e) || e.includes('img')) {
                                data.content = e
                                judgueText = true
                                setTableData({ ...listData })
                              } else if (judgueText) {
                                data.content = e
                                setTableData({ ...listData })
                              }
                            }}
                            onKeyUp={(e: any) => {
                              editorAtChange({
                                editor: editors[index],
                                node: $(e.currentTarget),
                                conHtml: $(e.currentTarget).html(),
                                allowTeamId: listData.joinTeams || [],
                                joinMembers: listData.teamList || [],
                                sourceType: 'report',
                                itemData: {
                                  item: data,
                                  contentKey: 'content',
                                },
                              })
                            }}
                            editorOnInit={(note: any) => {
                              editors[index] = note
                            }}
                            onFocus={() => {
                              setOldEditorTxt(data.content ? data.content.split(':::').join('') : '')
                            }}
                            data-configid={data.id}
                          />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="list_item report_person_box">
                <div className="item_listBox">
                  <div className="icon_box">
                    <span className="icon_t icon_per"></span>
                    <span className="required_param">*</span>
                  </div>
                  <div className="content_box">
                    <div className="per_tit">
                      <span>汇报对象</span>
                    </div>
                    <div className="per_list">
                      <div className="list_box">
                        {reportUserList &&
                          reportUserList.length != 0 &&
                          reportUserList.map((item: any, i: number) => {
                            return (
                              <div className="reportUser" key={i}>
                                <Avatar className="oa-avatar" src={item.profile || ''}>
                                  {item.username && item.username.length > 2
                                    ? item.username.slice(-2)
                                    : item.username}
                                </Avatar>
                                <span>
                                  {item.username && item.username.length > 2
                                    ? item.username.slice(-2)
                                    : item.username}
                                </span>
                                {!item.disable && (
                                  <div className="user-del-btn" onClick={() => delUser(item.userId, 0)}></div>
                                )}
                              </div>
                            )
                          })}
                        <div
                          className="add_btn"
                          onClick={() => {
                            selReportUser(0)
                            setSelectType(0)
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="list_item report_person_box">
                <div className="item_listBox">
                  <div className="icon_box">
                    <span className="icon_t icon_per icon_h"></span>
                    <span className="required_param"></span>
                  </div>
                  <div className="content_box">
                    <div className="per_tit">
                      <span>抄送</span>
                    </div>
                    <div className="per_list">
                      <div className="list_box">
                        {CCUserList &&
                          CCUserList.length != 0 &&
                          CCUserList?.map((item: any, i: number) => {
                            return (
                              <div className="reportUser" key={i}>
                                <Avatar className="oa-avatar" src={item.profile || ''}>
                                  {item.username && item.username.length > 2
                                    ? item.username.slice(-2)
                                    : item.username}
                                </Avatar>
                                <span>
                                  {item.username && item.username.length > 2
                                    ? item.username.slice(-2)
                                    : item.username}
                                </span>
                                {!item.disable && (
                                  <div className="user-del-btn" onClick={() => delUser(item.userId, 1)}></div>
                                )}
                              </div>
                            )
                          })}
                        <div
                          className="add_btn"
                          onClick={() => {
                            selReportUser(1)
                            setSelectType(1)
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="list_item report_shared_group">
                <div className="item_listBox">
                  <div className="icon_box">
                    <span className="icon_t icon_share"></span>
                    <span className="required_param" style={{ visibility: 'hidden' }}>
                      *
                    </span>
                  </div>
                  <div className="content_box">
                    <div className="shared_group_tit">
                      <span className="shared_group_title" onClick={shareTheRoom}>
                        分享到沟通
                      </span>
                    </div>
                    {$store.getState().roomIdList && $store.getState().roomIdList.length > 0 && (
                      <ShareRoomHtml list={$store.getState().roomIdList} />
                    )}
                  </div>
                </div>
              </div>
              <div className="list_item report_file_all">
                <div className="item_listBox">
                  <div className="report_file_tit">
                    <span className="icon_t icon_file"></span>
                    {refreshfile && (
                      <UploadFile
                        fileModels={[]}
                        fileChange={fileListRes => {
                          setFileUserList(fileListRes)
                        }}
                        dir="taskReport"
                        showText="添加附件"
                        showIcon={false}
                        showUploadList={true}
                        windowfrom={'createForceReport'}
                      ></UploadFile>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="reportFooter-container">
              <Button
                className="cancle"
                value="cancle"
                onClick={() => {
                  ipcRenderer.send('close_force_report')
                }}
              >
                取消
              </Button>
              <Button className="sunbmit" value="sure" onClick={saveReportData}>
                发送
              </Button>
            </div>
            {/* 共享到群 */}
            {shareToRoomModalShow && (
              <ShareToRoomModal
                props={{
                  param: { shareToRoomModalShow: shareToRoomModalShow },
                  action: { setShareToRoomModalShow: setShareToRoomModalShow },
                }}
                isclcallback={false}
                isclcallbackFn={() => {}}
              />
            )}
            {/* 选人弹窗 */}
            <SelectMemberOrg
              param={{
                visible: memberOrgShow,
                ...selMemberOrg,
              }}
              action={{
                setModalShow: setMemberOrgShow,
                // 点击确认
                onSure: selMemberSure,
              }}
            />
          </div>
        )}
      </div>
      {addVisibleReport && (
        <AddForceReportModel
          visible={addVisibleReport}
          setVisible={(flag: boolean) => {
            setVisibleReport(flag)
          }}
          optQuery={(item: any) => {
            if (item) {
              setRefreshfile(false)
              queryTodayWrite().then((res: any) => {
                if (res.data) {
                  setForceReportList(res.data)
                  //todo
                  res.data[0].relationId == null ? setShowtabheader(true) : setShowtabheader(false)
                  allUserList?.map((item: any) => {
                    res.data?.map((sItem: any) => {
                      if (item.forceReportId == sItem.forceReportId && item.forceTimeId == sItem.forceTimeId)
                        sItem['hasValue'] =
                          item.models.length > 0 &&
                          item.models[0].content?.replace(/&nbsp;/g, '').replace(/<[^>]*>|/g, '') &&
                          item.reportPersonList?.length > 0
                            ? true
                            : false
                    })
                  })
                }
              })
              reQuestOrigin()
            }
          }}
        />
      )}
      {/* 输入@弹框选择人员 */}
      <EditorAt />
      {/* 任务详情界面 */}
      <DetailModal
        ref={detailModalRef}
        param={{
          from: 'undlist',
        }}
      ></DetailModal>
    </>
  )
}
/**
 * 处理详情弹框所需参数
 */
export const detailParam = ({
  visible,
  taskId,
  taskType,
  taskData,
  isaddtask,
  from,
}: {
  visible: boolean
  taskId: any
  taskType?: any
  taskData?: any
  isaddtask?: any
  from?: string
}) => {
  const param = {
    visible,
    from: from || 'undlist',
    id: taskId,
    taskType,
    taskData,
    isaddtask,
    callbackFn: (params: any) => {},
  }
  return param
}
export default CreateForceReport

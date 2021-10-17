import React, { useEffect, useReducer, useRef, useState } from 'react'
import { Pagination, List, DatePicker, Input, Table, message, Spin } from 'antd'
import { ipcRenderer } from 'electron'
import {
  queryNoticeInfo,
  signReadByScreenType,
  signEasyNoticeRead,
  deleteSystemNotice,
  checkNoticeState,
  ItemProps,
} from './getData'
import { SetReadMsg } from '../workdesk/getData'
import './systemNotice.less'
import NoneData from '@/src/components/none-data/none-data'
import NoticeDetails from '@/src/components/notice-details/index'
import ReportDetails from '../workReport/component/ReportDetails'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import TaskReportModel from '@/src/views/workReport/component/TaskReportModel'
import Forcereport from '@/src/views/force-Report/force-Report'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import $c from 'classnames'
import moment from 'moment'
import { useMergeState } from '../chatwin/ChatWin'
import { loadLocales } from '@/src/common/js/intlLocales'
const { RangePicker } = DatePicker
const { Search } = Input
const dateFormat = 'YYYY/MM/DD'
//0：所有类型 1：任务类  2：公告类 3：预约类  4：会议类  5：审批类 6：工作报告 8：工作规划类
const noticeNavData = [
  { name: '所有类别', type: 0, index: 0, code: 'all' },
  { name: '任务类', type: 1, index: 1, code: 'TASK' },
  { name: '公告类', type: 2, index: 2, code: 'NOTICE' },
  // { name: '预约类', type: 3, index: 3, code: '' },
  { name: '会议类', type: 4, index: 3, code: 'MEETING' },
  { name: '审批类', type: 5, index: 4, code: 'APPROVAL' },
  { name: '工作报告', type: 6, index: 5, code: 'WORK_REPORT' },
  { name: '工作规划', type: 8, index: 6, code: 'WORK_PLAN' },
  { name: '通知', type: 9, index: 7, code: 'SYSTEM_NOTIFICATION' },
]
// state初始化initParams参数 action为dispatch传参
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'pagination':
      return { ...state, pagination: action.data }
    case 'modulecont':
      return { ...state, modulecont: action.data }
    case 'workreport':
      return { ...state, reportId: action.data }
    default:
      return state
  }
}

const SystemNoticeInfo = () => {
  // reducer初始化参数
  const initParams = {
    reportId: 0, //工作报告详情ID
    pagination: {
      keywords: '', //关键字
      pageNo: 0,
      pageSize: 20,
      screenType: 0, //0：所有类型 1：任务类  2：公告类 3：预约类  4：会议类  5：审批类 6：工作报告 8：工作规划类
      noticeType: 0, //0 所有类型  1通知
      time: '', //时间
      userId: $store.getState().nowUserId,
    },
    modulecont: {
      allTypeCount: '0',
      taskTypeCount: '0',
      meetingTypeCount: '0',
      appointmentTypeCount: '0',
      inviteTypeCount: '0',
      approvalTypeCount: '0',
      atMeTypeCount: '0',
      workReportCount: '0',
      workPlanCount: '0',
      noticeCount: '0',
      allNotRead: '0',
      taskNotRead: '0',
      noticeNotRead: '0',
      bookNotRead: '0',
      meetingNotRead: '0',
      approvalNotRead: '0',
      workReportNotRead: '0',
      workPlanNotRead: '0',
      easyNoticeNotRead: '0',
    },
  }
  const { nowUserId } = $store.getState()
  const [state, dispatch] = useReducer(reducer, initParams)
  //打开强制汇报详情
  const [openforce, setOpenforce] = useState(false)
  const [currentTask, setCurentTask] = useState<any>({})
  const [pickerParam, setPickerParam] = useState({
    startTime: '',
    endTime: '',
  })
  const [itemId, setItemId] = useState<any>('') //记录点击行id
  const [sysParams, setSysParams] = useMergeState({
    tableData: [], //表格数据
    windowHeight: 0,
    selectKey: 0,
    total: 0, //数据总数
    noticeCount: 0, //通知模块数量
    tableloading: false, // 表格loading 状态
    loading: false, //普通loading状态
    hideHead: false, //隐藏表头和头部筛选
    reportVisble: false, //工作报告详情框
    detailsModel: false, // 任务汇报详情
    opentaskdetail: false, //显示隐藏任务详情
    detailModalVisible: false, //公告详情框
    singAll: false, //标记全部已读状态监听
    defaultDetailActiveKey: '', //控制动态详情激活tabs
    navList: [], //导航
  })
  // 任务或okr详情弹框
  const detailModalRef = useRef<any>({})
  useEffect(() => {
    setSysParams({ tableloading: true })
    queryNoticeInfo(state.pagination).then((data: any) => {
      setSysParams({ tableloading: false })
      const dataInfo = data.data
      setSysParams({
        noticeCount: dataInfo.easyNoticeCount,
        total: dataInfo.pageModel.totalElements,
        tableData: dataInfo.pageModel.content,
      })
      dispatch({
        type: 'modulecont',
        data: { ...state.modulecont, ...dataInfo.synergyScreenTypeCountModel },
      })
    })
  }, [state.pagination, sysParams.singAll, itemId])

  useEffect(() => {
    if (state.modulecont.allNotRead == 0) {
      ipcRenderer.send('update_unread_msg', ['system_notice_count'])
    }
  }, [state.modulecont])

  useEffect(() => {
    // 初始化多语言配置
    loadLocales()
    const navList = getNavMenu()
    console.log('navs-------', navList)
    setSysParams({
      windowHeight: document.documentElement.clientHeight,
      navList,
    })
    window.addEventListener('resize', function() {
      setSysParams({
        windowHeight: this.window.innerHeight,
      })
    })
    document.title = '系统通知'
    return () => {
      window.removeEventListener('resize', function() {
        setSysParams({
          windowHeight: this.window.innerHeight,
        })
      })
    }
  }, [])
  /**
   * 按权限重组导航菜单
   */
  const getNavMenu = () => {
    const funsAuthList = $store.getState().funsAuthList || []
    // 添加按钮设置
    const navList: any = []
    noticeNavData.map((mItem: any) => {
      const findItem = funsAuthList.find(
        (item: any) => (item.name == mItem.code && item.hasAuth) || mItem.code == 'all'
      )
      if (findItem) {
        navList.push(mItem)
      }
    })
    const newList = navList.map((item: any, index: number) => {
      return {
        ...item,
        index,
      }
    })

    return newList
  }
  //导航切换
  const itemEvent = (item: any) => {
    console.log(item, 'xunzhongshuju')
    console.log('更新的index', item.index)
    setSysParams({ selectKey: item.index })
    //通知需要隐藏表头和头部筛选条件
    if (item.type == 9) {
      setSysParams({ hideHead: true })
      dispatch({
        type: 'pagination',
        data: {
          ...state.pagination,
          screenType: 0,
          noticeType: 1,
          pageNo: 0,
          pageSize: 20,
          time: '',
          keywords: '',
        },
      })
    } else {
      setSysParams({ hideHead: false })
      dispatch({
        type: 'pagination',
        data: {
          ...state.pagination,
          screenType: item.type,
          noticeType: 0,
          pageNo: 0,
          pageSize: 20,
          time: '',
          keywords: '',
        },
      })
    }
  }
  // 初始化列
  const columns = [
    {
      title: '消息/来源',
      dataIndex: 'systemSource',
      key: 'systemSource',
      render: (_r: any, item: ItemProps) => {
        const content = item.content || ''
        if (state.pagination.noticeType == 0) {
          const htmlContent = content
            .replace(/\^\!\*/gi, '')
            .replace(/\:\:\:/g, '')
            .replace(/&nbsp;/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\[bq_(\w+)\]/gi, '[表情]')
          return (
            <div className={$c('ant_table_item', { hasMsg: item.flag == 0 })}>
              <div className="title_name over_flow">{htmlContent}</div>
              <div className="from_name">来源：{item.source}</div>
            </div>
          )
        }
        return (
          <div className={$c('ant_table_item', { hasMsg: item.flag == 0 })}>
            <div className="notice_time">{item.createTime}</div>
            <div>
              {item.belongName != '' ? `【${item.belongName}】` : ''}
              {content}
            </div>
            <div className="delBtn" onClick={() => deleteNotice(item.id)}></div>
          </div>
        )
      },
    },
    {
      title: sysParams.selectKey == 0 ? '类别' : '',
      dataIndex: 'systemType',
      width: sysParams.selectKey == 8 ? 1 : 150,
      key: 'systemType',
      render: (_r: any, item: ItemProps) => {
        if (sysParams.selectKey == 0) {
          //所有类别才展示类型
          return <div style={{ color: '#70707A' }}>{item.noticeTypeName}</div>
        }
        return ''
      },
    },
    {
      title: sysParams.selectKey == 8 ? '' : '收到时间',
      dataIndex: 'systemTime',
      width: sysParams.selectKey == 8 ? 1 : 150,
      key: 'systemTime',
      render: (_r: any, item: ItemProps) => {
        if (sysParams.selectKey == 8) {
          //通知不展示时间
          return ''
        }
        return <div>{item.createTime}</div>
      },
    },
  ]
  //根据类型获取对应模块数量,红点
  const getModuleNum = (type: number) => {
    switch (type) {
      case 0: //所有类别
        return {
          contNum: state.modulecont.allTypeCount,
          redSpot: state.modulecont.allNotRead,
        }
      case 1: //任务类
        return {
          contNum: state.modulecont.taskTypeCount,
          redSpot: state.modulecont.taskNotRead,
        }
      case 2: //公告类
        return {
          contNum: state.modulecont.noticeCount,
          redSpot: state.modulecont.noticeNotRead,
        }
      case 3: //预约类
        return {
          contNum: state.modulecont.appointmentTypeCount,
          redSpot: state.modulecont.bookNotRead,
        }
      case 4: //会议类
        return {
          contNum: state.modulecont.meetingTypeCount,
          redSpot: state.modulecont.meetingNotRead,
        }
      case 5: //审批类
        return {
          contNum: state.modulecont.approvalTypeCount,
          redSpot: state.modulecont.approvalNotRead,
        }
      case 6: //工作报告
        return {
          contNum: state.modulecont.workReportCount,
          redSpot: state.modulecont.workReportNotRead,
        }
      case 8: //工作规划
        return {
          contNum: state.modulecont.workPlanCount,
          redSpot: state.modulecont.workPlanNotRead,
        }
      case 9: //通知
        return {
          contNum: sysParams.noticeCount,
          redSpot: state.modulecont.easyNoticeNotRead,
        }
    }
  }
  //删除通知
  const deleteNotice = (id: number) => {
    setSysParams({ loading: true })
    deleteSystemNotice({
      id: id,
      userId: nowUserId,
    }).then(
      () => {
        const newData: any = [...sysParams.tableData]
        for (let i = 0; i < newData.length; i++) {
          if (id == newData[i].id) {
            newData.splice(i, 1)
            break
          }
        }
        setSysParams({ tableData: newData, loading: false })
        message.success('删除成功')
      },
      msg => {
        message.error(msg)
        setSysParams({ loading: false })
      }
    )
  }
  //查看详情
  const queryDetile = (recode: ItemProps) => {
    setItemId(recode.id)
    SetReadMsg(recode.id).then(() => {
      refreshDotSHow(recode.noticeTypeId)
    })
    // console.log('点击事件', recode)
    if (state.pagination.noticeType == 0) {
      if (recode.noticeType == 'remarks_comment' || recode.noticeType == 'add_remarks') {
        // queryAppApprovaldetails(recode.noticeTypeId)
        // //查看审批详情spareId没有给
        // $store.dispatch({
        //   type: 'SET_OPERATEAPPROVALID',
        //   data: { isQueryAll: false, ids: recode.spareId },
        // })
        // $tools.createWindow('ApprovalOnlyDetail')
      } else {
        showCoorDetail(recode)
      }
    }
  }
  //查看审批详情
  // const queryAppApprovaldetails = (processId: number) => {
  //   message.info('查看审批详情')
  // }

  /**
   * 处理详情弹框所需参数
   */
  const detailParam = ({ visible, item, activeKey }: { visible: boolean; item: any; activeKey: any }) => {
    const param = {
      visible,
      from: item.reportType == 2 || item.reportType == 3 ? 'notice_OKR' : 'notice',
      id: item.spareId,
      taskData: { id: item.spareId, form: 'apiInit' },
      defaultActiveKey: activeKey,
    }
    return param
  }
  //统一处理协同分类查看详情接口
  const showCoorDetail = (item: ItemProps) => {
    const type = item.noticeType

    if (type == 'book' || type == 'book_share') {
      //预约申请
      // ipc.send('schedule_book_remind', [info.noticeTypeId])
    } else if (type == 'schedule_book_remind') {
      // ipc.send('schedule_book_remind', [info.noticeTypeId], 1)
    } else if (type == 'schedule_meeting_remind') {
      //待确认会议
      // myZoneMeetingResive.getFormInfo(info.noticeTypeId, 0, ev)
    } else if (type == 'approval_send' || type == 'approval_urge') {
      //待处理审批,催办
      // systemNotice.showApprovalDetail(info.noticeTypeId, 1)
    } else if (type == 'approval_return' || type == 'temporary_storage') {
      //我发起的
      // systemNotice.showApprovalDetail(info.noticeTypeId, 2)
    } else if (type == 'approval_notice') {
      //知会我的
      // systemNotice.showApprovalDetail(info.noticeTypeId, 3)
    } else if (type == 'touch_approval') {
      //触发审批
      // systemNotice.showApprovalDetail(info.noticeTypeId, 7)
    } else if (type == 'reject_approval') {
      //驳回审批
      // systemNotice.showApprovalDetail(info.noticeTypeId, 4)
    } else if (type == 'report_send') {
      //打开任务汇报详情

      setCurentTask(item)
      setSysParams({ detailsModel: true })
      // Report.getChatReportTaskList(info.spareId, 'chatRoom')
    } else if (type == 'schedule_task_remind' || type == 'task_share') {
      //任务相关
      // imMain.showTaskDetail(ev, info.noticeTypeId)
    } else if (type == 'force_report_set' || type == 'force_report_update') {
      // forceReport.forceReportDatali(ev, info.noticeTypeId)
      // 打开强制汇报详情

      setCurentTask(item)
      setOpenforce(true)
      //点击就让红点消失
      SetReadMsg(item.id).then(() => {
        refreshDotSHow(item.noticeTypeId)
      })
    } else if (type == 'rule' || type == 'notice_comment') {
      //公告查看详情
      queryRuleDetail({
        noticeType: item.noticeType,
        noticeTypeId: item.noticeTypeId,
        type: 'data-user',
        isSys: 'sys',
        belongId: item.belongId,
        belongName: item.belongName,
      })
    } else if (type == 'work_report_send') {
      //收到的工作报告
      queryReportDetail(item.noticeTypeId)
      // WorkReportDetail.showReportDetailModal(info.noticeTypeId, obj)
    } else if (type == 'meeting_share') {
      //会议分享
      // myZoneMeetingResive.getFormInfo(info.noticeTypeId, 1, ev)
    } else if (type == 'remarks_opinion_at_me') {
      // CoordinationCate.remarkSopinion(info.noticeTypeId)
    } else if (type == 'remarks_opinion_comment' || type == 'check_comment' || type == 'remarks_opinion') {
      // 打开任务详情
      const activeKey = type === 'check_comment' ? '2' : ''
      setSysParams({ defaultDetailActiveKey: activeKey })
      setCurentTask(item)
      // setSysParams({ opentaskdetail: true })
      // 打开任务详情
      const param = detailParam({ visible: true, item, activeKey })
      detailModalRef.current && detailModalRef.current.setState(param)
      SetReadMsg(item.id).then(() => {
        refreshDotSHow(item.noticeTypeId)
      })
    }
  }
  //================不同类型的事件操作======================================
  //公告详情
  const queryRuleDetail = (param: {
    noticeType: string
    noticeTypeId: number
    type: string
    isSys: string
    belongId: number
    belongName: string
  }) => {
    //校验公告是否被撤回
    checkNoticeState({
      id: param.noticeTypeId,
      userId: param.type == 'data-user' ? nowUserId : undefined, //发起人id
    }).then(
      (data: any) => {
        if (data.returnCode === 0) {
          setSysParams({ detailModalVisible: true })
          $store.dispatch({
            type: 'NOTICE_DETAILS',
            data: {
              source: 'noticeList',
              noticeId: param.noticeTypeId,
              noticeType: param.noticeType,
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
      }
    )
  }
  //工作报告详情
  const queryReportDetail = (noticeTypeId: number) => {
    //点击就让红点消失
    refreshDotSHow(noticeTypeId)
    setSysParams({ reportVisble: true })
    dispatch({
      type: 'workreport',
      data: noticeTypeId,
    })
  }
  //更新当前红点展示状态
  const refreshDotSHow = (noticeId: number) => {
    const newData = [...sysParams.tableData]
    newData.forEach((item: ItemProps) => {
      if (noticeId == item.noticeTypeId) {
        item.flag = 1
      }
    })
    setSysParams({ tableData: newData })
  }
  //时间控件切换值存储
  const timePickerChange = (_dates: any, dateStrings: string[]) => {
    const TimeStr = dateStrings[0] + '-' + dateStrings[1]
    setPickerParam({
      ...pickerParam,
      startTime: dateStrings[0],
      endTime: dateStrings[1],
    })
    dispatch({
      type: 'pagination',
      data: {
        ...state.pagination,
        time: TimeStr,
      },
    })
  }
  //搜索
  const searchSysNotice = (value: string) => {
    dispatch({
      type: 'pagination',
      data: {
        ...state.pagination,
        keywords: value,
      },
    })
  }
  //标记全部已读
  const readAllMsg = () => {
    if (state.pagination.noticeType == 0) {
      signReadByScreenType({
        userId: nowUserId,
        screenType: state.pagination.screenType,
      }).then(
        () => {
          setSysParams({ singAll: !sysParams.singAll })
        },
        err => {
          message.error(err)
        }
      )
    } else {
      signEasyNoticeRead({
        userId: nowUserId,
      }).then(
        () => {
          setSysParams({ singAll: !sysParams.singAll })
        },
        err => {
          message.error(err)
        }
      )
    }
  }
  //刷新所有红点展示
  const refreshPage = () => {
    message.success('标记全部已读成功')
    //刷新当前页所有红点
    const newData = [...sysParams.tableData]
    newData.forEach((item: ItemProps) => {
      item.flag = 1
    })
    setSysParams({ tableData: newData })
  }
  console.log('sysParams.selectKey', sysParams.selectKey)
  console.log('数据源', sysParams.navList)
  return (
    <div className="system_notice_content flex">
      <div className="system_content_nav">
        <List
          size="large"
          bordered
          dataSource={sysParams.navList}
          renderItem={(item: any, index: number) => (
            <List.Item
              className={$c({ active: sysParams.selectKey === index })}
              onClick={() => {
                itemEvent(item)
                console.log(sysParams.selectKey, index, 'sys')
              }}
            >
              <div className="sys_notice_item">
                {item.name}
                <em className={$c({ hasSpot: getModuleNum(item.type)?.redSpot > 0 })}>
                  ({getModuleNum(item.type)?.contNum})
                </em>
              </div>
            </List.Item>
          )}
        />
      </div>
      <div className="system_content_list flex-1">
        {!sysParams.hideHead && (
          <div className="sys_notice_header">
            <RangePicker
              style={{ width: '203px' }}
              dropdownClassName="select-time-picker"
              format="YYYY/MM/DD"
              onChange={timePickerChange}
              allowClear={true}
              value={
                pickerParam.startTime == ''
                  ? null
                  : [moment(pickerParam.startTime, dateFormat), moment(pickerParam.endTime, dateFormat)]
              }
            />
            <Search
              placeholder="请输入关键字"
              onSearch={searchSysNotice}
              style={{ width: 200, marginLeft: 8 }}
            />
          </div>
        )}
        <div className={$c('sys_notice_table', { borderSolid: sysParams.tableData.length !== 0 })}>
          {sysParams.tableData.length !== 0 && (
            <Table
              className="system-table"
              scroll={{ y: sysParams.windowHeight - 200 }}
              tableLayout={'fixed'}
              columns={columns}
              showHeader={sysParams.tableData.length !== 0 && state.pagination.noticeType !== 1}
              pagination={false}
              loading={sysParams.tableloading}
              rowKey={record => record.id}
              dataSource={sysParams.tableData}
              onRow={record => {
                return {
                  onClick: () => queryDetile(record), // 点击行
                }
              }}
            />
          )}
        </div>
        {sysParams.tableData.length !== 0 && (
          <div className="footer_page">
            <Pagination
              showSizeChanger
              current={state.pagination.pageNo + 1}
              pageSize={state.pagination.pageSize}
              total={sysParams.total}
              pageSizeOptions={['5', '10', '20', '30', '50', '100']}
              onShowSizeChange={(current, size) => {
                dispatch({
                  type: 'pagination',
                  data: { ...state.pagination, pageNo: current - 1, pageSize: size || 20 },
                })
              }}
              onChange={(page, pageSize) => {
                dispatch({
                  type: 'pagination',
                  data: { ...state.pagination, pageNo: page - 1, pageSize: pageSize || 20 },
                })
              }}
            />
            <span className="sing_btn" onClick={() => readAllMsg()}>
              标记全部已读
            </span>
          </div>
        )}
        {sysParams.tableData.length == 0 && <NoneData />}
        {sysParams.loading && (
          <div className="example">
            <Spin />
          </div>
        )}
      </div>
      {sysParams.detailModalVisible && (
        <NoticeDetails
          showModal={(isVisible: boolean) => setSysParams({ detailModalVisible: isVisible })}
          refreshCallback={(noticeTypeId: number) => refreshDotSHow(noticeTypeId)}
        />
      )}
      {sysParams.reportVisble && (
        <ReportDetails
          param={{ reportId: state.reportId, isVisible: sysParams.reportVisble }}
          setvisible={(state: any) => setSysParams({ reportVisble: state })}
        />
      )}
      {/* 任务汇报详情界面 */}

      {sysParams.detailsModel && (
        <TaskReportModel
          param={{
            visible: sysParams.detailsModel,
            data: { ...currentTask, taskId: currentTask.spareId },
            type: currentTask.reportType,
          }}
          setvisible={(state: any) => {
            setSysParams({ detailsModel: state })
          }}
        />
      )}
      {/* 任务详情页 */}
      <DetailModal
        ref={detailModalRef}
        param={
          {
            // visible: sysParams.opentaskdetail,
            // from: 'notice',
            // id: currentTask.spareId,
            // taskData: { id: currentTask.spareId },
            // defaultActiveKey: sysParams.defaultDetailActiveKey,
          }
        }
        // setvisible={(state: any) => {
        //   setSysParams({ opentaskdetail: state })
        // }}
      ></DetailModal>
      {/* 强制汇报设置详情 */}
      {openforce && (
        <Forcereport
          visible={openforce}
          datas={{
            from: 'detail', //来源
            isdetail: 1, //是否为详情 1详情 0设置 2编辑
            taskid: currentTask.spareId, //任务id
            reportid: currentTask.noticeTypeId, //强制汇报id
            createTime: currentTask.createTime, //创建时间
            startTime: '', //开始时间
            endTime: '', //结束时间
            teamId: currentTask.belongId, //企业id
          }}
          setModalShow={setOpenforce}
          onOk={(datas: any) => {
            setOpenforce(false)
          }}
        ></Forcereport>
      )}
      <DownLoadFileFooter fromType="mainWin" />
    </div>
  )
}
export default SystemNoticeInfo

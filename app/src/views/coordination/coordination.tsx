import React, { useState, useEffect } from 'react'
import { Menu, Table, Tag, DatePicker, Input, Badge, message, Modal, Avatar, Button, Spin } from 'antd'
const { RangePicker } = DatePicker
import { MailOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons'
import { ipcRenderer } from 'electron'
import './coordination.less'
import NoneData from '@/src/components/none-data/none-data'
import InviteLinkUserModal from './inviteLinkUserModal'
import DeskFollowPop from './deskFollow'
import MeetDetails from '../mettingManage/component/MeetDetails'
import { getSystemState, ReadCancelMsg, SetReadMsg } from '../workdesk/getData'
import ReplayMsg from '../workdesk/component/ReplayMsg/ReplayMsg'
import OrgInvitationPlug from '../workdesk/component/org-invitation-plug/org-invitation-plug'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import { useMergeState } from '../approval-execute/ApprovalExecute'
import TaskReportModel from '@/src/views/workReport/component/TaskReportModel'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'

let showReplayMsg: any
let getDatas: any
const columns = [
  {
    title: '消息/来源',
    key: '0',
    render: (_text: any, record: any) => {
      const reg = new RegExp(`@${$store.getState().nowUser}`)
      return (
        <>
          {record.isRead === 0 ? (
            <span style={{ position: 'absolute', left: 0 }}>
              <Badge dot />
            </span>
          ) : (
            ''
          )}
          <div className="flex column">
            <div className="flex">
              <div
                onClick={e => {
                  if (
                    record.noticeType === 'check_comment_at_me' ||
                    record.noticeType === 'remarks_opinion_at_me' ||
                    record.noticeType === 'remarks_opinion_comment_at_me' ||
                    record.noticeType === 'task_talk_at_push'
                  ) {
                    e.stopPropagation()
                    getDatas(record)
                  }
                }}
                className="coor-title ellipsisContainer"
                dangerouslySetInnerHTML={{
                  __html: record.content
                    .replace(/\^\!\*/gi, '')
                    .replace(/\[bq_(\w+)\]/gi, '[表情]')
                    .replace(reg, `<span class="has_at_me">@${$store.getState().nowUser}</span>`),
                }}
              ></div>
              {record.noticeType === 'task_talk_at_push' && record.disposeType === 0 && (
                <div>
                  <span
                    className="radius-button-default"
                    onClick={e => {
                      e.stopPropagation()
                      showReplayMsg(true, 0, record)
                    }}
                  >
                    已知晓
                  </span>
                  <span
                    className="radius-button-primary"
                    style={{ marginLeft: '16px' }}
                    onClick={e => {
                      e.stopPropagation()
                      showReplayMsg(true, 1, record)
                    }}
                  >
                    回复
                  </span>
                </div>
              )}
            </div>
            <span className="coor-source ellipsisContainer">来源:{record.source}</span>
          </div>
        </>
      )
    },
  },
  {
    title: '类别',
    key: '1',
    className: 'text-center',
    width: '68px',
    render: (_text: any, record: any) => `${record.type}`,
  },
  {
    title: '收到时间',
    key: '2',
    className: 'text-center',
    width: '130px',
    render: (_text: any, record: any) => `${record.receiveTime}`,
  },
  {
    title: '等待时长',
    key: '3',
    className: 'text-center',
    width: '120px',
    render: (_text: any, record: any) => {
      const timeObj = record.waitingTimeModel
      return (
        <>
          {timeObj.day != 0 && <span className="wait_day">{timeObj.day + '天'}</span>}
          {timeObj.day == 0 && timeObj.hour != 0 && (
            <span className="wait_hour">{timeObj.hour + '小时' + timeObj.minute + '分'}</span>
          )}
          {timeObj.day == 0 && timeObj.hour == 0 && (
            <span className="wait_hour">{timeObj.minute + '分钟'}</span>
          )}
        </>
      )
    },
  },
]

const handledColumn = [
  {
    title: '消息/来源',
    key: '0',
    render: (_text: any, record: any) => {
      const reg = new RegExp(`@${$store.getState().nowUser}`)
      return (
        <>
          {record.isRead === 0 ? (
            <span style={{ position: 'absolute', left: 0 }}>
              <Badge dot />
            </span>
          ) : (
            ''
          )}
          <div className="flex column">
            <div className="flex">
              <div
                onClick={e => {
                  if (
                    record.noticeType === 'check_comment_at_me' ||
                    record.noticeType === 'remarks_opinion_at_me' ||
                    record.noticeType === 'remarks_opinion_comment_at_me' ||
                    record.noticeType === 'task_talk_at_push'
                  ) {
                    e.stopPropagation()
                    getDatas(record)
                  }
                }}
                className="coor-title ellipsisContainer"
                dangerouslySetInnerHTML={{
                  __html: record.content
                    .replace(/\^\!\*/gi, '')
                    .replace(/\[bq_(\w+)\]/gi, '[表情]')
                    .replace(reg, `<span class="has_at_me">@${$store.getState().nowUser}</span>`),
                }}
              ></div>
              {record.noticeType === 'task_talk_at_push' && record.disposeType === 0 && (
                <div>
                  <span
                    className="radius-button-default"
                    onClick={e => {
                      e.stopPropagation()
                      showReplayMsg(true, 0, record)
                    }}
                  >
                    已知晓
                  </span>
                  <span
                    className="radius-button-primary"
                    style={{ marginLeft: '16px' }}
                    onClick={e => {
                      e.stopPropagation()
                      showReplayMsg(true, 1, record)
                    }}
                  >
                    回复
                  </span>
                </div>
              )}
            </div>
            <span className="coor-source ellipsisContainer">来源:{record.source}</span>
          </div>
        </>
      )
    },
  },
  {
    title: '类别',
    key: '1',
    className: 'text-center',
    width: '68px',
    render: (_text: any, record: any) => `${record.type}`,
  },
  {
    title: '收到时间',
    key: '2',
    className: 'text-center',
    width: '130px',
    render: (_text: any, record: any) => `${record.receiveTime}`,
  },
]

const sendColumns = [
  {
    title: '消息/来源',
    key: '0',
    render: (_text: any, record: any) => {
      const reg = new RegExp(`@${$store.getState().nowUser}`)
      return (
        <div className="flex column">
          <span
            className="coor-title ellipsisContainer"
            dangerouslySetInnerHTML={{
              __html: record.content
                .replace(/\^\!\*/gi, '')
                .replace(/\[bq_(\w+)\]/gi, '[表情]')
                .replace(reg, `<span class="has_at_me">@${$store.getState().nowUser}</span>`),
            }}
          ></span>
          <span className="coor-source ellipsisContainer">来源:{record.source}</span>
        </div>
      )
    },
  },
  {
    title: '类别',
    key: '1',
    className: 'text-center',
    width: '68px',
    render: (_text: any, record: any) => `${record.typeName}`,
  },
  {
    title: '发起时间',
    key: '2',
    className: 'text-center',
    width: '130px',
    render: (_text: any, record: any) => `${record.createTime}`,
  },
  {
    title: '所属部门',
    key: '3',
    className: 'text-center',
    width: '120px',
    render: (_text: any, record: any) =>
      `${record.teamName}${record.deptName != 'null' ? `-${record.deptName}` : ''}`,
  },
]

const Coordination = () => {
  //协同二级导航常量
  const headerNavArr = [
    { index: 0, itemName: 'allTypeCount', itemCnName: '所有类别' },
    { index: 1, itemName: 'taskTypeCount', itemCnName: '任务类' },
    { index: 2, itemName: 'meetingTypeCount', itemCnName: '会议类' },
    { index: 3, itemName: 'appointmentTypeCount', itemCnName: '预约类' },
    { index: 4, itemName: 'inviteTypeCount', itemCnName: '邀请类' },
    { index: 5, itemName: 'approvalTypeCount', itemCnName: '审批类' },
    { index: 6, itemName: 'atMeTypeCount', itemCnName: '@我的' },
  ]
  const sendHeadNavArr = [
    { index: 0, itemName: 'allTypeCount', itemCnName: '所有类别' },
    { index: 1, itemName: 'meetingTypeCount', itemCnName: '会议类' },
    { index: 2, itemName: 'appointmentTypeCount', itemCnName: '预约类' },
    { index: 6, itemName: 'atMeTypeCount', itemCnName: '我@的' },
  ]
  //初始化数据
  const initStates = {
    selHeadNav: headerNavArr, //二级导航
    tableDataInfo: {
      //表格数据
      tableData: [],
      columns: columns,
    },
    pagination: {
      pageNo: 0,
      pageSize: 20,
      total: 0,
    },
    loading: false,
    windowHeight: 0,
    headerCount: {
      allTypeCount: 0, //所有类别数量
      taskTypeCount: 0, //任务类统计
      meetingTypeCount: 0, //会议类统计
      appointmentTypeCount: 0, //预约类统计
      inviteTypeCount: 0, //邀请类统计
      approvalTypeCount: 0, //审批类统计
      atMeTypeCount: 0, //@我的和我@的
    },
    leftCount: {
      //左侧导航数量及未读数量统计
      waitDisposeCount: 0, //待处理数量
      notReadCount: 0, //待处理未读
      alreadyDisposeCount: 0, //已处理数量
      myStartCount: 0, //我发起的数量
    },
    headerSelect: ['0'], //选中二级导航
    disposeType: 0, //左侧导航选中
    coorTime: '', //日期范围
    keywords: '', //关键字搜索
    inviteVisible: false, //邀请通知弹窗
    inviteLinkUserVisible: false, //邀请协同联系人模态框
    inviteLinkUser: {}, //邀请协同联系人
    deskFollowVisible: false, //申请关注工作台
    visibleMeetDetailsPop: false,
    noticeTypeId: 0,
    currentData: null, //记录当前数据
    replayMsgVisible: false,
    replaceType: 0,
    opentaskdetail: false, //显示隐藏任务详情
    isRead: 0, //记录红点，邀请组件需要
    detailsModel: false, // 任务汇报详情
    defaultDetailActiveKey: '', //控制动态详情激活tabs
  }
  //协同相关state
  const [coorState, setCoorState] = useMergeState(initStates)

  useEffect(() => {
    setCoorState({ windowHeight: window.innerHeight })
    window.addEventListener('resize', function() {
      setCoorState({ windowHeight: this.window.innerHeight })
    })
    return () => {
      window.removeEventListener('resize', function() {
        setCoorState({ windowHeight: this.window.innerHeight })
      })
    }
  }, [])

  /**
   * 查询协同列表数据
   * @param params 请求参数集合
   */
  const fetch = (params: {
    pageNo: number
    pageSize: number
    disposeType: number
    keywords: string
    screenTypes: any[]
    time: string
    userId: number
  }) => {
    setCoorState({ loading: true, tableDataInfo: { tableData: [], columns: columns } })
    $api
      .request('/public/synergy/findSynergyData', params, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: $store.getState().loginToken,
        },
      })
      .then((resData: any) => {
        const showDataInfo = params.disposeType === 2 ? resData.data.mySendPageModel : resData.data.pageModel
        const nowColumns =
          params.disposeType === 2 ? sendColumns : params.disposeType === 1 ? handledColumn : columns
        const selNav = params.disposeType === 2 ? sendHeadNavArr : headerNavArr
        setCoorState({
          selHeadNav: selNav,
          tableDataInfo: {
            tableData: showDataInfo.content || [],
            columns: nowColumns,
          },
          pagination: {
            pageNo: params.pageNo,
            pageSize: params.pageSize,
            total: showDataInfo.totalElements || 0,
          },
          leftCount: { ...resData.data.synergyLeftCountModel },
          headerCount: { ...resData.data.synergyScreenTypeCountModel },
        })
      })
      .finally(() => {
        setCoorState({ loading: false })
      })
  }

  //选择左侧导航事件处理
  const selectLeftNav = (record: any) => {
    const selectKey = record.key
    //设置disposetype
    //筛选选择所有类别
    setCoorState({
      disposeType: parseInt(selectKey),
      headerSelect: ['0'],
    })
  }

  //选中二级导航处理事件
  const selectChildNav = (record: any) => {
    if (record.key !== '0' && !coorState.headerSelect.includes('0')) {
      setCoorState({
        headerSelect: record.selectedKeys,
      })
    } else {
      setCoorState({
        headerSelect: [record.key],
      })
    }
  }

  showReplayMsg = (flag: boolean, type: number, datas: any) => {
    getSystemState({
      type: datas.noticeType,
      typeId: datas.noticeTypeId,
      commentId: datas.commentId,
      userId: $store.getState().nowUserId,
      spareId: datas.spareId,
    }).then((res: any) => {
      if (res.returnCode == 0 && res.data === 1) {
        //异常自动处理
        ReadCancelMsg(datas.noticeTypeId)
        return false
      } else {
        setCoorState({
          replayMsgVisible: flag,
          replaceType: type,
          currentData: datas,
        })
      }
    })
  }
  getDatas = (datas: any) => {
    getSystemState({
      type: datas.noticeType,
      typeId: datas.noticeTypeId,
      commentId: datas.commentId,
      userId: $store.getState().nowUserId,
      spareId: datas.spareId,
    }).then((res: any) => {
      if (res.returnCode == 0 && res.data === 1) {
        //异常自动处理
        ReadCancelMsg(datas.noticeTypeId)
        return false
      } else {
        const defaultDetailActiveKey = datas.noticeType === 'check_comment_at_me' ? '2' : ''
        setCoorState({
          opentaskdetail: true,
          currentData: datas,
          defaultDetailActiveKey,
        })
        SetReadMsg(datas.id).then(() => {
          // refreshDotSHow(datas.noticeTypeId)
        })
      }
    })
  }
  //联动查询监听
  useEffect(() => {
    fetch({
      pageNo: coorState.pagination.pageNo,
      pageSize: coorState.pagination.pageSize,
      disposeType: coorState.disposeType,
      keywords: coorState.keywords,
      screenTypes: coorState.headerSelect,
      time: coorState.coorTime,
      userId: $store.getState().nowUserId,
    })
  }, [
    coorState.headerSelect,
    coorState.pagination.pageNo,
    coorState.pagination.pageSize,
    coorState.disposeType,
    coorState.keywords,
    coorState.coorTime,
  ])

  //取消选择二级导航item
  const deSelectChildNav = (record: any) => {
    if (record.key !== '0' && !coorState.headerSelect.includes('0')) {
      record.selectedKeys.length != 0
        ? setCoorState({ headerSelect: record.selectedKeys })
        : setCoorState({ headerSelect: ['0'] })
    } else {
      setCoorState({ headerSelect: ['0'] })
    }
  }

  //移除已选标签
  const deleteSelect = (tag: string) => {
    const newHeadSelectArr = coorState.headerSelect.filter((item: string) => item != tag)
    if (newHeadSelectArr.length == 0) {
      setCoorState({ headerSelect: ['0'] })
    } else {
      setCoorState({ headerSelect: newHeadSelectArr })
    }
  }

  //选择日期范围
  const timePickerChange = (_dates: any, date: any) => {
    if (date[0].length != 0) {
      setCoorState({ coorTime: date.join('-') })
    } else {
      setCoorState({ coorTime: '' })
    }
  }

  //输入关键字搜索
  const searchChange = (value: string) => {
    setCoorState({ keywords: value })
  }

  //清空筛选条件
  const clearAllFilter = () => {
    setCoorState({ headerSelect: ['0'] })
  }
  //行事件
  const setRowEvent = (record: any) => {
    return {
      onClick: (event: any) => {
        getSystemState({
          type: record.noticeType,
          typeId: record.noticeTypeId,
          commentId: record.commentId,
          userId: $store.getState().nowUserId,
          spareId: record.spareId,
        }).then((res: any) => {
          if (res.returnCode == 0 && res.data === 1) {
            //异常自动处理
            ReadCancelMsg(record.noticeTypeId)
            return false
          } else {
            event.stopPropagation()
            //缓存数据noticeTypeId
            setCoorState({ noticeTypeId: record.noticeTypeId, currentData: record })
            // 当前查询协同类型
            const type = record.noticeType
            //任务类被删除或者归档
            if (record.type == '任务类' && (record.flag == -1 || record.flag == 3)) {
              const toasTxt = record.flag == -1 ? '删除' : '归档'
              message.error(`该任务已${toasTxt},您已不需要处理`)

              return
            }

            //主题删除或撤回
            if (type == 'task_talk_at_push' && record.flag == 1) {
              message.error('该主题已被删除,您已不需要处理')
              return
            }
            //工作组被删除
            if (type == 'project_invite' && record.flag == 1) {
              message.error('该工作组已被删除,您已不需要处理')
              return
            }
            //审批撤回
            if (record.type == '审批类') {
              // let hasData = getSystemState(record.noticeType, record.noticeTypeId)
              // if (hasData == 1 && findSelId == 0) {
              //   toastr['error'](`数据不存在`, '信息提示')
              //   message.error('错误信息')
              //   $(obj).remove()
              //   readCancelMsg(record.id)
              //   return
              // }
              // if (hasData == 2) {
              //   toastr['error'](`查询失败`, '信息提示')
              //   message.error('错误信息')
              //   return
              // }
            }
            //备注不存在
            if (
              (type == 'remarks_opinion_comment_at_me' || type == 'remarks_opinion_at_me') &&
              record.flag == 1
            ) {
              message.error('备注不存在')
              return
            }
            //检查项不存在
            if (type == 'check_comment_at_me' && record.flag == 1) {
              message.error('该检查项已被删除，你已不需要处理')
              return
            }
            //已处理审批
            // if (record.type == '审批类' && findSelId == 1) {
            // return
            // }
            if (type == 'book') {
              //预约申请
            } else if (type == 'unconfirmed_meeting') {
              setCoorState({ visibleMeetDetailsPop: true })
              //待确认会议
            } else if (type == 'approval_send' || type == 'approval_urge' || type == 'temporary_storage') {
              //待处理审批,催办
              $store.dispatch({
                type: 'SAVE_TYPE_APPROVAL_DATA', //清除初次界面具体数据展示
                data: {},
              })
            } else if (type == 'approval_return') {
              //我发起的
              $store.dispatch({
                type: 'SAVE_TYPE_APPROVAL_DATA', //清除初次界面具体数据展示
                data: {},
              })
            } else if (type == 'approval_notice') {
              //知会我的
              $store.dispatch({
                type: 'SAVE_TYPE_APPROVAL_DATA', //清除初次界面具体数据展示
                data: {},
              })
            } else if (type == 'touch_approval') {
              //触发审批
              $store.dispatch({
                type: 'SAVE_TYPE_APPROVAL_DATA', //清除初次界面具体数据展示
                data: {},
              })
            } else if (type == 'reject_approval') {
              //驳回审批
              $store.dispatch({
                type: 'SAVE_TYPE_APPROVAL_DATA', //清除初次界面具体数据展示
                data: {},
              })
            } else if (type == 'invite') {
              //企业邀请
              setCoorState({ isRead: record.isRead, inviteVisible: true })
            } else if (type == 'task_report_at_me' || type == 'report_send') {
              //汇报@我
              // 跳转任务详情汇报
              setCoorState({
                detailsModel: true,
              })
              SetReadMsg(record.id).then(() => {
                // refreshDotSHow(record.noticeTypeId)
              })
            } else if (type == 'work_report_at_me' || type == 'work_report_comment_at_me') {
            } else if (type == 'work_report_remind') {
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
              $tools.createWindow('ChatWin', { createConfig: { showSidebar: false } })
              const { unreadList } = $store.getState()
              if (unreadList.length) {
                //关闭未读信息列表
                $store.dispatch({
                  type: 'SAVE_UNREAD_INFO',
                  data: [],
                })
                console.log('XXXXXXXXXXXXXXXXXXXXXXXXXX---------------------------------')
                ipcRenderer.send('change_tray_icon')
              }
              //主题
            } else if (type == 'project_invite') {
            } else if (
              type == 'remarks_opinion_at_me' ||
              type == 'remarks_opinion' ||
              type == 'remarks_opinion_comment' ||
              type == 'remarks_opinion_comment_at_me'
            ) {
              //备注信息
            } else if (type == 'follow_request') {
              if (record.disposeType == 0) {
                setCoorState({ deskFollowVisible: true })
              } else {
                //已处理
                message.error('该信息已处理,您已不需要处理')
              }
              //关注人
            } else if (type == 'check_comment_at_me') {
            } else if (type == 'task_synergy') {
              //任务协同邀请 成为企业联系人

              if (record.disposeType == 0) {
                //待处理
                setCoorState({
                  inviteLinkUserVisible: true,
                  inviteLinkUser: { ...record },
                })
              } else if (record.disposeType == 1) {
                //已处理
                message.error('该邀请已处理,您已不需要处理')
              }
              //点击就让红点消失
              SetReadMsg(record.id).then(() => {
                // refreshDotSHow(record.noticeTypeId)
              })
            }
          }
        })
      },
    }
  }
  //更新当前红点展示状态
  const refreshDotSHow = (noticeId: number) => {
    const newData = [...coorState.tableDataInfo.tableData]
    newData.forEach((item: any) => {
      if (noticeId == item.noticeTypeId) {
        item.flag = 0
      }
    })

    setCoorState({
      tableDataInfo: { tableData: newData, columns: columns },
    })
  }
  const getTagName = (index: any) => {
    const selTag = coorState.selHeadNav.filter((item: { index: any }) => item.index == index)
    return selTag[0].itemCnName
  }

  return (
    <div className="coordination-container flex">
      <div className="left-nav">
        <Menu
          style={{ width: 220, height: '100%', paddingTop: '32px', fontSize: '12px' }}
          defaultSelectedKeys={['0']}
          mode={'vertical'}
          onSelect={selectLeftNav}
        >
          <Menu.Item key="0" className="flex center-v">
            <MailOutlined />
            <span className="flex-1">待我处理的 ({coorState.leftCount.waitDisposeCount})</span>
            <Badge count={coorState.leftCount.notReadCount} overflowCount={99} />
          </Menu.Item>
          <Menu.Item key="1">
            <CalendarOutlined />
            我已处理的 ({coorState.leftCount.alreadyDisposeCount})
          </Menu.Item>
          <Menu.Item key="2">
            <AppstoreOutlined />
            我发起的 ({coorState.leftCount.myStartCount})
          </Menu.Item>
        </Menu>
      </div>
      <div className="right-show-content flex column flex-1">
        <div className="right-show-header flex center-v">
          <Menu
            style={{ fontSize: '12px' }}
            className="flex-1"
            mode={'horizontal'}
            selectedKeys={coorState.headerSelect}
            multiple={true}
            onSelect={selectChildNav}
            onDeselect={deSelectChildNav}
          >
            {coorState.selHeadNav.map((item: any) => {
              return (
                <Menu.Item key={item.index}>
                  {item.itemCnName} ({coorState.headerCount[item.itemName]})
                </Menu.Item>
              )
            })}
          </Menu>
          <RangePicker dropdownClassName="select-time-picker" format="YYYY/MM/DD" onChange={timePickerChange} />
          <Input.Search
            placeholder="请输入关键字"
            style={{ width: 212, marginLeft: 8, marginRight: 24 }}
            onSearch={searchChange}
          />
        </div>
        {!coorState.headerSelect.includes('0') && (
          <div className="right-show-tag flex">
            <span style={{ marginRight: '10px' }}>共{coorState.pagination.total}条符合条件的结果</span>
            <div className="tag-list flex-1">
              {coorState.headerSelect.map((item: any) => {
                return (
                  <Tag
                    className="edit-tag"
                    key={item}
                    closable
                    onClose={(e: any) => {
                      e.preventDefault()
                      deleteSelect(item)
                    }}
                  >
                    {getTagName(item)}
                  </Tag>
                )
              })}
            </div>
            <span className="clear-tag" onClick={clearAllFilter}>
              清空筛选条件
            </span>
          </div>
        )}
        <div className="right-show-table">
          <Table
            className="coor-table"
            scroll={{ y: coorState.windowHeight - 274 }}
            tableLayout={'fixed'}
            columns={coorState.tableDataInfo.columns}
            showHeader={coorState.tableDataInfo.tableData.length !== 0}
            pagination={{
              ...coorState.pagination,
              position: ['bottomCenter'],
              pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
              onChange: (page, pageSize) => {
                setCoorState({
                  pagination: {
                    ...coorState.pagination,
                    pageNo: page - 1,
                    pageSize: pageSize || 20,
                  },
                })
              },
              onShowSizeChange: (current, size) => {
                setCoorState({
                  tableDataInfo: { tableData: [], columns: columns },
                  pagination: {
                    ...coorState.pagination,
                    pageNo: current - 1,
                    pageSize: size,
                  },
                })
              },
            }}
            locale={{ emptyText: <NoneData /> }}
            loading={coorState.loading}
            rowKey={(_record, index) => index || 0}
            dataSource={coorState.tableDataInfo.tableData}
            onRow={setRowEvent}
          />
        </div>
      </div>
      {coorState.inviteLinkUserVisible && (
        <InviteLinkUserModal
          paramsProps={{ ...coorState.inviteLinkUser }}
          visible={coorState.inviteLinkUserVisible}
          onclose={(state: boolean) => {
            setCoorState({
              inviteLinkUserVisible: state,
            })
          }}
        />
      )}
      {coorState.deskFollowVisible && (
        <DeskFollowPop
          datas={{ visiblePop: coorState.deskFollowVisible, currentData: coorState.currentData }}
          onclose={(state: boolean) => {
            setCoorState({
              deskFollowVisible: state,
            })
          }}
        />
      )}
      {coorState.visibleMeetDetailsPop && (
        <MeetDetails
          datas={{
            queryId: coorState.currentData.noticeTypeId,
            meetModal: coorState.visibleMeetDetailsPop,
          }}
          isVisibleDetails={(state: boolean) => {
            setCoorState({
              visibleMeetDetailsPop: state,
            })
          }}
          callback={() => {}}
        />
      )}
      {coorState.replayMsgVisible && (
        <ReplayMsg
          params={{ item: coorState.currentData, type: coorState.replaceType }}
          setVisble={(flag: boolean) => {
            setCoorState({
              replayMsgVisible: flag,
            })
          }}
          callback={() => {}}
          commentId={coorState.currentData.commentId}
        />
      )}
      {coorState.inviteVisible && (
        <OrgInvitationPlug
          params={{
            isRead: coorState.isRead,
            visible: coorState.inviteVisible,
            id: coorState.noticeTypeId,
            setvisible: (state: any) => {
              setCoorState({
                inviteVisible: state,
              })
            },
            optionCallback: (params: any) => {},
          }}
        />
      )}
      {/* 任务详情 */}
      {coorState.opentaskdetail && (
        <DetailModal
          param={{
            visible: coorState.opentaskdetail,
            from: 'Coordination',
            id: coorState.currentData.spareId,
            taskData: { id: coorState.currentData.spareId },
            defaultActiveKey: coorState.defaultDetailActiveKey,
          }}
          setvisible={(state: any) => {
            setCoorState({
              opentaskdetail: state,
            })
          }}
        ></DetailModal>
      )}
      {/* 任务汇报详情界面 */}

      {coorState.detailsModel && (
        <TaskReportModel
          param={{
            visible: coorState.detailsModel,
            data: { ...coorState.currentData, taskId: coorState.currentData.spareId },
            type: coorState.currentData.reportType,
          }}
          setvisible={(state: any) => {
            setCoorState({
              detailsModel: false,
            })
          }}
        />
      )}
      <DownLoadFileFooter fromType="mainWin" />
    </div>
  )
}

export default Coordination

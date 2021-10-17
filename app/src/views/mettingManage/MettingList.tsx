import React, { useEffect, useState, useLayoutEffect } from 'react'
import { Modal, Table, Avatar, Radio, DatePicker, Button } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import './MettingList.less'
import FilterInfo from './component/MettingFilter'
import MettingDetailsPop from './component/MettingDetailsPop'

import MeetDetails from './component/MeetDetails'
import MeetAdd from './component/MeetAdd'
import { useSelector } from 'react-redux'
import { color } from 'html2canvas/dist/types/css/types/color'

interface MettingListModalProps {
  visible: boolean
  onHideModal: () => void
}
interface MettingListData {
  id: number
  deptName: string
  teamName: string
  name: string
  meetingRoom: null
  subject: number
  startTime: string
  endTime: string
  joinStatus: number
  originator: string
  originatorId: number
  originatorProfile: null
  status: number
  proceed: number
  isConcluded: number
  deptId: null
  teamId: number
  userId: null
  meetingRoomId: null
  kw: null
  page: number
  pageSize: number
  type: number
  userRead: number
  createTime: number
  mettingSourceModel: []
}

const MettingList = ({ visible, onHideModal }: MettingListModalProps) => {
  const { nowUser, nowAccount, nowUserId, loginToken } = $store.getState()

  const [windowHeight, setWindowHeight] = useState(0)
  // 0 我收到的 1我发出的 2 发起会议
  const [listType, setListType] = useState<number>(0)

  const [typeId, setTypeId] = useState<number>(0)

  //   会议列表数据
  const [mettingListData, setMettingListData] = useState<Array<MettingListData>>([])
  // 加载
  const [loading, setLoading] = useState(false)

  // 详情
  const [visibleDetails, setVisibleDetails] = useState(false)
  const [visibleRecivedDetails, setRecivedVisibleDetails] = useState(false)

  // 当前状态
  const [isStatus, setIsStatus] = useState<number>(0)
  // 当前会议状态
  const [isMeetType, setIsMeetType] = useState(false)

  // 会议发起弹窗
  const [meetAdd, setMeetAdd] = useState(false)

  const [openType, setOpenType] = useState('create')

  // 筛选弹窗
  const [visibleFilter, setVisibleFilter] = useState(false)

  //页码
  const [pagination, setPagination] = useState({
    pageNo: 0,
    pageSize: 20,
    total: 0,
  })
  // 会议列表查询+筛选
  const [mettingFilterParam, setmettingFilterParam] = useState({
    userId: nowUserId,
    page: pagination.pageNo,
    pageSize: pagination.pageSize,
    startTime: '',
    endTime: '',
    teamId: '',
    joinStatus: '',
  })

  // 确认请假/参加会议
  const refreshMeetList = useSelector((store: StoreStates) => store.refreshMeetList)

  useEffect(() => {
    if (refreshMeetList) {
      setVisibleDetails(false)
      setRecivedVisibleDetails(false)
      const sendParam: any = {
        userId: nowUserId,
        page: pagination.pageNo,
        pageSize: pagination.pageSize,
        startTime: '',
        endTime: '',
        teamId: '',
      }
      if (Number(listType) === 0) {
        //我收到的
        sendParam.joinStatus = ''

        received(sendParam)
      } else {
        //我发出的
        sendParam.status = ''
        sendParam.isConcluded = ''

        start(sendParam)
      }

      // if (listType === 0) {
      //   received(sendParam)
      // } else {
      //   start(sendParam)
      // }
      $store.dispatch({ type: 'REFRESH_MEET_LIST', data: { refreshMeetList: false } })
    }
  }, [refreshMeetList])

  useLayoutEffect(() => {
    initEvent()
  }, [])
  const initEvent = () => {
    jQuery('.ant-modal-wrap')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.filtersTermBox,.filterBtn') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          setVisibleFilter(false)
        }
      })
  }

  const startMetting = () => {
    setOpenType('create')
    setVisibleDetails(true)
    // setMeetAdd(true)
  }
  // 查询会议列表 （我收到的 ，我发出的）
  const queryMettingList = (e: any) => {
    setListType(e.target.value)
    // setVisibleFilter(false)
    setPagination({ ...pagination, pageNo: 0, pageSize: pagination.pageSize || 20 })
  }

  const filterInfo = () => {
    setVisibleFilter(!visibleFilter)
  }
  // 按条件筛选
  const ChangeFilter = (param: any) => {
    const sendParam: any = {
      userId: nowUserId,
      page: pagination.pageNo,
      pageSize: pagination.pageSize,
      startTime: String(param.startTime),
      endTime: String(param.endTime),
      teamId: String(param.teamId),
    }
    if (Number(listType) === 0) {
      //我收到的
      sendParam.joinStatus = String(param.joinStatus)

      received(sendParam)
    } else {
      //我发出的
      sendParam.status = param.status
      sendParam.isConcluded = param.isConcluded

      start(sendParam)
    }
  }

  //联动查询监听
  useEffect(() => {
    if (visible) {
      const param: any = {
        userId: nowUserId,
        pageSize: pagination.pageSize,
        startTime: '',
        endTime: '',
        teamId: '',
      }
      if (Number(listType) === 0) {
        // 我收到的
        param.page = pagination.pageNo || 0
        param.joinStatus = ''
        received({
          userId: nowUserId,
          page: pagination.pageNo,
          pageSize: pagination.pageSize,
          startTime: '',
          endTime: '',
          teamId: '',
          joinStatus: '',
        })
      } else {
        // 我发出的
        start({
          userId: nowUserId,
          page: pagination.pageNo,
          pageSize: pagination.pageSize,
          startTime: '',
          endTime: '',
          teamId: '',
          status: '',
          isConcluded: '',
        })
      }

      setWindowHeight(window.innerHeight)
      window.addEventListener('resize', function() {
        setWindowHeight(this.window.innerHeight)
      })
      return () => {
        window.removeEventListener('resize', function() {
          setWindowHeight(this.window.innerHeight)
        })
      }
    }
  }, [visible, listType, pagination.pageNo, pagination.pageSize])

  /**
   * 查询会议列表数据
   * @param params 请求参数集合
   */
  const received = (params: {
    userId: number
    page: number
    pageSize: number
    startTime: string
    endTime: string
    teamId: string
    joinStatus: string
  }) => {
    setLoading(true)
    $api
      .request('/public/meeting/received', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then((resData: any) => {
        const list = resData.data.content
        // 列表内容
        setMettingListData(list)
        //设置分页
        setPagination({
          pageNo: params.page,
          pageSize: params.pageSize,
          total: resData.data.totalElements || 0,
        })
        // 关闭加载动画
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  const start = (params: {
    userId: number
    page: number
    pageSize: number
    startTime: string
    endTime: string
    teamId: string
    status: string
    isConcluded: string
  }) => {
    setLoading(true)
    $api
      .request('/public/meeting/start', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then((resData: any) => {
        const list = resData.data.content
        // 列表内容
        setMettingListData(list)
        //设置分页
        setPagination({
          pageNo: params.page,
          pageSize: params.pageSize,
          total: resData.data.totalElements || 0,
        })
        // 关闭加载动画
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  const joinStatus = (joinStatus: number) => {
    let joinState = ''
    let color_style = ''
    if (joinStatus == 0) {
      joinState = '待确认'
      color_style = 'yellow_status'
    } else if (joinStatus == 2) {
      joinState = '请假'
      color_style = 'red_status'
    } else if (joinStatus == 3) {
      joinState = '已取消'
      color_style = 'gray_status'
    } else if (joinStatus == -1) {
      joinState = '过期未确认'
      color_style = 'gray_status'
    }
    const qj_icon = joinStatus == 2 ? 'qj_icon' : ''
    const dqr_icon = joinStatus == 0 ? 'dqr_icon' : ''
    if (joinStatus != 1) {
      return <span className={`span_icon ${color_style} ${qj_icon} ${dqr_icon}`}>{joinState}</span>
    } else {
      return ''
    }

    // ${item.joinStatus != 1 ? `<span class="span_icon ${item.joinStatus == 2 ? `qj_icon` : ''} ${item.joinStatus == 0 ? `dqr_icon` : ''}">${joinState}</span>` : ''}

    // return joinStatus != 1
    //   ? `<span class="span_icon ${joinStatus == 2 ? `qj_icon` : ''} ${
    //       joinStatus == 0 ? `dqr_icon` : ''
    //     }">${joinState}</span>`
    //   : ''
    // switch (prop) {
    //   case 0:
    //     return <span className="span_icon yellow_status">待确认</span>
    //   case 2:
    //     return <span className="span_icon red_status">请假</span>
    //   case 3:
    //     return <span className="span_icon gray_status">已取消</span>
    //   case -1:
    //     return <span className="span_icon gray_status">过期未确认</span>
    //   default:
    //     return <span className="span_icon yellow_status">待确认</span>
    // }
  }
  const startJoinStatus = (status: number, proceed: number) => {
    let state = ''
    let classn = ''
    if (status == 0) {
      state = '已取消'
      classn = 'gray_status'
    } else if (status == 2) {
      state = '审核中'
      classn = 'yellow_status'
    } else if (status == 3) {
      state = '审批拒绝'
      classn = 'red_status'
    } else if (status == 4) {
      state = '审批撤回'
      classn = 'red_status'
    } else if (proceed == 3) {
      state = '已结束'
      classn = 'gray_status'
    }

    const qj_icon = status == 2 ? 'dqr_icon' : ''
    if (proceed != 3 && status != 1) {
      return <span className={`span_icon ${classn} ${qj_icon}`}>{state}</span>
    } else {
      return ''
    }
  }

  const getNowFormatDate = () => {
    const date = new Date()
    const seperator1 = '/'
    const seperator2 = ':'
    const month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
    const strDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
    const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
    const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
    const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
    return (
      date.getFullYear() + seperator1 + month + seperator1 + strDate + ' ' + hours + seperator2 + minutes + ''
    )
  }
  // 表格数据
  const columns = [
    {
      title: '会议室/会议名称',
      dataIndex: 'meetingName',
      key: 'meetingName',
      width: '400px',
      render: (_text: any, record: any) => {
        return (
          <div
            className="meetingName_box"
            style={{
              color:
                record.status == 0 ||
                record.proceed == 3 ||
                record.status == 3 ||
                record.status == 4 ||
                record.endTime < getNowFormatDate()
                  ? '#d7d7d9'
                  : '#191F25',
            }}
          >
            <div className="meeting_room_box">{record.meetingRoom || '其他'}</div>
            <div className="meeting_cont_box">
              <p className="meeting_name">{record.name}</p>
              <span className="span_icon span_tit">议题:{record.subject < 99 ? record.subject : '99+'}</span>
              {Number(listType) === 0 && joinStatus(record.joinStatus)}
              {Number(listType) === 1 && startJoinStatus(record.status, record.proceed)}
            </div>
          </div>
        )
      },
    },
    {
      title: '会议时间',
      dataIndex: 'meetingTime',
      key: 'meetingTime',
      width: '300px',
      render: (_text: any, record: any) => {
        return (
          <div
            className="meetingTime"
            style={{
              color:
                record.status == 0 ||
                record.proceed == 3 ||
                record.status == 3 ||
                record.status == 4 ||
                record.endTime < getNowFormatDate()
                  ? '#d7d7d9'
                  : '#191F25',
            }}
          >
            {' '}
            {record.startTime}-{record.endTime}
          </div>
        )
      },
    },
    {
      title: '发起人所属部门/组织',
      dataIndex: 'meetingOrganization',
      key: 'meetingOrganization',
      width: '260px',
      render: (_text: any, record: any) => {
        return (
          <div
            className="meetingOrganization"
            style={{
              color:
                record.status == 0 ||
                record.proceed == 3 ||
                record.status == 3 ||
                record.status == 4 ||
                record.endTime < getNowFormatDate()
                  ? '#d7d7d9'
                  : '#191F25',
            }}
          >
            <Avatar src={record.originatorProfile} className="oa-avatar">
              {record.originator ? record.originator.substr(-2, 2) : '暂无'}
            </Avatar>
            <span className="meeting_belong_org">
              {record.teamName}
              {record.deptName ? `-${record.deptName}` : ''}
            </span>
          </div>
        )
      },
    },
  ]

  const isVisibleDetails = (type: boolean) => {
    setVisibleDetails(type)
    setRecivedVisibleDetails(false)
  }

  const isVisibleMeetAdd = (type: boolean) => {
    setMeetAdd(type)
  }
  return (
    <Modal
      title={'会议管理'}
      visible={visible}
      onCancel={onHideModal}
      footer={null}
      // maskClosable={false}
      className="metting-modal-content-box"
      width={'100%'}
      keyboard={false}
    >
      <div
        className="mettingBox"
        ref={() => {
          initEvent()
        }}
      >
        <div className="menu_tab">
          <Radio.Group className="mettingListTypeBox">
            <Radio.Button
              className={Number(listType) == 0 ? 'active' : ''}
              value="0"
              onClick={queryMettingList}
            >
              我收到的
            </Radio.Button>
            <Radio.Button
              className={Number(listType) == 1 ? 'active' : ''}
              value="1"
              onClick={queryMettingList}
            >
              我发出的
            </Radio.Button>
          </Radio.Group>
          <Radio.Group className="mettingListSetBox">
            <Button
              className="meetBtn filterBtn"
              value="0"
              onClick={e => {
                filterInfo()
              }}
            >
              筛选
            </Button>
            <Button className="meetBtn" value="1" onClick={startMetting}>
              会议发起
            </Button>
          </Radio.Group>
        </div>
        <div className="list_box">
          {mettingListData.length == 0 && listType == 0 && (
            <NoneData
              showTxt={'朋友，想不想邀约一场会议'}
              imgSrc={$tools.asAssetsPath(`/images/noData/metting_two.png`)}
              imgStyle={{ width: 100, height: 100 }}
            />
          )}
          {mettingListData.length == 0 && listType == 1 && (
            <NoneData
              showTxt={'朋友，想不想邀约一场会议'}
              imgSrc={$tools.asAssetsPath(`/images/noData/metting_none.png`)}
              imgStyle={{ width: 100, height: 100 }}
            />
          )}
          {mettingListData.length > 0 && (
            <Table
              className="tableContent"
              tableLayout={'auto'}
              dataSource={mettingListData}
              rowKey={record => record.id}
              loading={loading}
              columns={columns}
              pagination={{
                position: ['bottomCenter'],
                current: pagination.pageNo + 1,
                pageSize: pagination.pageSize,
                pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
                total: pagination.total,
                showSizeChanger: true,
                onChange: (current, pageSize) => {
                  setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 10 })
                },
                onShowSizeChange: (current, pageSize) => {
                  setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 10 })
                },
              }}
              scroll={{ y: windowHeight - 300 }}
              showHeader={!mettingListData || mettingListData.length !== 0}
              onRow={record => {
                return {
                  onClick: event => {
                    event.preventDefault()
                    setTypeId(record.id)
                    if (Number(listType) === 1) {
                      // 我发出的
                      setOpenType('start')
                      setVisibleDetails(true)
                      // setMeetAdd(true)
                    } else {
                      // 我收到的
                      setOpenType('received')
                      setRecivedVisibleDetails(true)
                    }
                    // record.status == 0 ||
                    // record.proceed == 3 ||
                    // record.status == 3 ||
                    // record.status == 4 ||
                    // record.endTime < getNowFormatDate()
                    setIsMeetType(false)
                    if (
                      record.status == 0 ||
                      record.proceed == 3 ||
                      record.status == 3 ||
                      record.status == 4 ||
                      record.endTime < getNowFormatDate()
                    ) {
                      setIsMeetType(true)
                    }
                    setIsStatus(record.status)
                  }, // 点击行
                }
              }}
            />
          )}
        </div>
      </div>
      <FilterInfo datas={{ listType: listType, visibleFilter: visibleFilter }} ChangeFilter={ChangeFilter} />
      {/* {meetAdd && (
        <MeetAdd
          datas={{ visibleMeetAdd: meetAdd, openType: openType, meetId: typeId }}
          onHideAdd={isVisibleMeetAdd}
        />
      )} */}
      {visibleDetails && (
        <MettingDetailsPop
          datas={{
            listType: listType,
            typeId: typeId,
            visibleDetails: visibleDetails,
            openType: openType,
            nowStatus: isStatus,
            isMeetType: isMeetType,
            isDeskIn: false,
          }}
          isVisibleDetails={isVisibleDetails}
        />
      )}
      {visibleRecivedDetails && Number(listType) === 0 && (
        <MeetDetails
          datas={{
            listType: listType,
            queryId: typeId,
            meetModal: visibleRecivedDetails,
            openType: openType,
            nowStatus: isStatus,
          }}
          isVisibleDetails={isVisibleDetails}
          callback={() => {}}
        />
      )}
    </Modal>
  )
}

export default MettingList

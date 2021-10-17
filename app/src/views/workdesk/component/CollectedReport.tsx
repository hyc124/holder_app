import React, { useEffect, useState } from 'react'
import NoneData from '@/src/components/none-data/none-data'
import { Avatar, Pagination, message, Spin } from 'antd'
import { getReceiveReport } from '../getData'
import { useSelector, shallowEqual } from 'react-redux'
import { requestApi } from '../../../common/js/ajax'
import TaskReportModel from '../../workReport/component/TaskReportModel'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import $c from 'classnames'
interface ReportItem {
  forceReportId: number
  forceTimeId: number
  reportTime: string
  reportTimes: []
  userId: number
  username: string
  profile: string
  reportUser: null
  taskId: number
  taskName: string
  ascriptionType: null
  ascriptionId: null
  ascriptionName: string
  reportId: null
  isRead: number
  relationId: null
  content: string
}
let refresh: any = null
export const refreshReport = () => {
  if (refresh) refresh()
}
interface CollectProps {
  moduleType: number
  isFollow?: boolean
}
const CollectedReport = ({ moduleType, isFollow }: CollectProps) => {
  const { nowUser, followUserInfo, nowUserId } = $store.getState()
  const [TableData, setTableData] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [tableLoading, setTableLoading] = useState(false)
  const isFullScreen = useSelector((state: any) => state.showFullScreen)
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId, shallowEqual)
  const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  const teamId = !isFollow ? selectTeamId : followSelectTeadId
  //任务汇报详情
  const [detailsModel, setDetailsModel] = useState({
    visible: false,
    data: {},
  })
  //任务详情框
  const [opentaskdetail, setOpentaskdetail] = useState({
    visible: false,
    taskid: 0,
  })
  const [queryParasms, setQueryParams] = useState({
    pageNo: 0,
    pageSize: 10,
  })
  useEffect(() => {
    queryReport()
  }, [queryParasms, teamId])
  refresh = () => {
    queryReport()
  }
  //查询最新汇报列表
  const queryReport = () => {
    console.log('XXXXXXXXXXXXXXXXXXX')
    setTableLoading(true)
    getReceiveReport(queryParasms.pageNo, queryParasms.pageSize).then((data: any) => {
      //设置数据
      setTableData(data.content)
      //设置总条数
      setTotalElements(data.totalElements)
      setTableLoading(false)
    })
  }
  // 发送 催一下 请求
  const sendUrge = (item: any) => {
    const param = {
      taskId: item.taskId,
      // userName: nowUser,
      operationUser: nowUserId,
      targetUser: item.userId,
      forceTimeId: item.forceTimeId,
    }
    requestApi({
      url: '/task/force/report/sendNoticeByTimeLazy',
      param: param,
      json: false,
    }).then((res: any) => {
      if (res.success) {
        message.success('催一下成功！')
      }
    })
  }
  //查看汇报详情
  const lookReportDetile = (e: any, dataId: any, item?: any) => {
    //去红点
    if (item) {
      TableData.map((itm: any) => {
        if (itm.reportId == item.reportId) {
          itm.isRead = 1
        }
      })
    }
    setTableData(TableData)
    //isRead
    e.stopPropagation()
    if (dataId) {
      detailsModel.visible = true
      detailsModel.data = {
        taskId: dataId,
      }
      setDetailsModel({ ...detailsModel })
    } else {
      return false
    }
  }
  //查看任务详情
  const lookTaskDetail = (item: any) => {
    console.log('打开任务详情', item)
    opentaskdetail.visible = true
    opentaskdetail.taskid = item.taskId
    setOpentaskdetail({ ...opentaskdetail, visible: opentaskdetail.visible, taskid: opentaskdetail.taskid })
  }
  //获取2个时间之间的天数
  const getDateDay = (dateTimeStamp: number) => {
    let dayNum: any = 0
    const minute = 1000 * 60
    const hour = minute * 60
    const day = hour * 24
    const now = new Date().getTime()
    const diffValue = now - dateTimeStamp
    if (diffValue < 0) {
      dayNum = 0
    }
    const dayC: any = diffValue / day
    if (dayC >= 1) {
      dayNum = parseInt(dayC)
    }
    return dayNum
  }
  //校验是否返回天数显示
  const showDay = (isDelay: boolean, days: number, TIME: string, newDate: number, typeStr: string) => {
    if (isDelay && days < 1) {
      return <span className="delay">{typeStr + TIME}</span>
    } else if (isDelay && days >= 1) {
      return <span className="delay">{`${typeStr}${TIME}(已延迟${getDateDay(newDate)}天)`}</span>
    }
    return typeStr + TIME
  }
  //校验时间是当天还是昨天还是其他
  const checkTimeType = (date: string, reportId: any) => {
    const TIME = date.split(' ')[1]
    const DATE = date.split(' ')[0]
    let isDelay = false //是否延期
    if (new Date(date) < new Date() && !reportId) {
      isDelay = true
    }
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
    const days = getDateDay(newDate)
    if (isToday > 0 && isToday <= 24) {
      return showDay(isDelay, days, TIME, newDate, '今天')
    } else if (new Date(date).getTime() < newToday && yestday <= new Date(date).getTime()) {
      return showDay(isDelay, days, TIME, newDate, '昨天')
    } else {
      return showDay(isDelay, days, DATE, newDate, '')
    }
  }
  //通屏展示
  const LargScreenModule = ({ item }: any) => {
    //是否显示催一下 按钮
    const isShowCyx = new Date(item.reportTime) < new Date() && !item.reportId
    return (
      <div
        className={$c('ant_list_item', {
          cyx: isShowCyx,
          hasreportText: item.reportId && !followUserInfo.followStatus,
        })}
        onClick={e => {
          e.stopPropagation()
          if (isShowCyx || !(item.reportId && !followUserInfo.followStatus)) {
            message.warning('暂未收到汇报')
            return false
          }
          lookReportDetile(e, item.taskId, item)
        }}
      >
        <span
          className={$c('collecting_text flex-1 text-ellipsis ', {
            collectingHint: item.reportId && item.isRead == 0,
          })}
        >
          {item.taskName.length > 26 ? item.taskName.substr(0, 26) + '...' : item.taskName}
        </span>

        <div
          className="colle_right_info"
          style={{ width: `${isShowCyx ? '384px' : '296px'}`, marginLeft: '15px', textAlign: 'right' }}
        >
          {new Date(item.reportTime) < new Date() && !item.reportId && (
            <span
              className="colle_dft_btn"
              onClick={e => {
                e.stopPropagation()
                sendUrge(item)
              }}
            >
              <span className="urge-icon"></span>
              催一下
            </span>
          )}
          {/* <span
            className="urge-btn2 urge-position"
            onClick={e => {
              e.stopPropagation()
              lookTaskDetail(item)
            }}
          >
            任务详情&gt;
          </span> */}
          <span className="report-time">{checkTimeType(item.reportTime, item.reportId)}</span>

          <span className="report_avatar">
            <Avatar
              size={24}
              className="report_head_img"
              src={item.profile}
              style={{ backgroundColor: '#4285f4', fontSize: 12 }}
            >
              {item.username.substr(-2, 2)}
            </Avatar>
            <span className="report_head_name">{item.username.substr(-2, 2)}</span>
          </span>
          <span
            className="urge-btn2 urge-position"
            onClick={e => {
              e.stopPropagation()
              lookTaskDetail(item)
            }}
          >
            任务详情&gt;
          </span>
        </div>
      </div>
    )
  }
  //二分屏展示
  const SmallScreenModule = ({ item }: any) => {
    return (
      <div
        className={$c('ant_list_item ant_list_smll', {
          cyx: new Date(item.reportTime) < new Date() && !item.reportId,
          hasreportText: item.reportId && !followUserInfo.followStatus,
          marginBtn: !isFullScreen || moduleType == 0,
        })}
        onClick={e => {
          e.stopPropagation()
          if (
            (new Date(item.reportTime) < new Date() && !item.reportId) ||
            !(item.reportId && !followUserInfo.followStatus)
          ) {
            message.warning('暂未收到汇报')
            return false
          }
          lookReportDetile(e, item.taskId, item)
        }}
      >
        <span
          className={$c('collecting_text flex-1 text-ellipsis ', {
            collectingHint: item.reportId && item.isRead == 0,
          })}
        >
          {item.taskName.length > 26 ? item.taskName.substr(0, 26) + '...' : item.taskName}
        </span>
        <div className="colle_right_info" style={{ width: 'auto' }}>
          <span className="report_avatar">
            <Avatar
              size={24}
              className="report_head_img"
              src={item.profile}
              style={{ backgroundColor: '#4285f4', fontSize: 12 }}
            >
              {item.username.substr(-2, 2)}
            </Avatar>
          </span>
          <span className="report-time">{checkTimeType(item.reportTime, item.reportId)}</span>
        </div>
        {new Date(item.reportTime) < new Date() && !item.reportId ? (
          <span
            className="urge-btn1"
            onClick={e => {
              e.stopPropagation()
              sendUrge(item)
            }}
          >
            <span className="urge-icon"></span>
            催一下
          </span>
        ) : (
          ''
        )}
        <span
          className="urge-btn2"
          onClick={e => {
            e.stopPropagation()
            lookTaskDetail(item)
          }}
        >
          任务详情&gt;
        </span>
      </div>
    )
  }
  return (
    <>
      <Spin tip="加载中，请稍后..." spinning={tableLoading}>
        <div className="receviReport-container">
          <div>
            {TableData.map((item: ReportItem, index: number) =>
              moduleType == 0 && !isFullScreen ? (
                <SmallScreenModule item={item} key={index} />
              ) : (
                <LargScreenModule item={item} key={index} />
              )
            )}
          </div>
          {TableData.length === 0 && (
            <NoneData imgSrc={$tools.asAssetsPath('/images/common/none_img_icon_4.svg')} />
          )}
          <div
            style={{
              textAlign: 'center',
              position: 'absolute',
              bottom: '10px',
              width: 'calc(100% - 10px)',
            }}
          >
            {isFullScreen && (
              <Pagination
                showSizeChanger
                current={queryParasms.pageNo + 1}
                pageSize={queryParasms.pageSize}
                total={totalElements}
                pageSizeOptions={['5', '10', '20', '30', '50', '100']}
                onShowSizeChange={(current, size) => {
                  setQueryParams({
                    ...queryParasms,
                    pageNo: current - 1,
                    pageSize: size || 20,
                  })
                }}
                onChange={(page, pageSize) => {
                  setQueryParams({
                    ...queryParasms,
                    pageNo: page - 1,
                    pageSize: pageSize || 20,
                  })
                }}
              />
            )}
          </div>
        </div>
      </Spin>
      {/* 汇报详情界面 */}
      {detailsModel.visible && (
        <TaskReportModel
          param={{ visible: detailsModel.visible, data: detailsModel.data, type: 1 }}
          setvisible={(state: any) => {
            setDetailsModel({ ...detailsModel, visible: state })
          }}
        />
      )}
      {/* 任务详情界面 */}
      {opentaskdetail.visible && (
        <DetailModal
          param={{
            visible: opentaskdetail.visible,
            from: 'undlist',
            id: opentaskdetail.taskid,
          }}
          setvisible={(state: any) => {
            console.log('setvisible', state)
            setOpentaskdetail({ ...opentaskdetail, visible: state })
          }}
          callbackFn={() => {
            // setFreshPage(!freshPage)
          }}
        ></DetailModal>
      )}
    </>
  )
}
export default CollectedReport

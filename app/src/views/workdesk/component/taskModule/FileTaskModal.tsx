import React, { useEffect, useState } from 'react'
import { DatePicker, message, Tooltip, Table, Dropdown, Menu, Avatar, Tag, Input } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { queryStatistics, queryArchiveTaskListByDeptUser, recall } from '../../getData'
import './index.less'
import $c from 'classnames'
import NoneData from '@/src/components/none-data/none-data'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
const { RangePicker } = DatePicker
const { Search } = Input
interface ItemProps {
  id: number
  userId: number
  username: string
  profile: string
  roleId: number
  roleName: string
  taskName: string
  level: number
  delayTime: number
  taskChangeNum: number
  archiveStatus: number
  archiveTime: string
  review: number
  icon?: string
  property?: number
}
//归档任务，冻结任务弹窗组件
const FileTaskModal = ({ onClose }: { onClose: () => void }) => {
  const [windowHeight, setWindowHeight] = useState(0)
  const { selectTeamId, nowAccount, nowUserId, nowUser } = $store.getState()
  //统计数据
  const [statisticsInfo, setStatisticsInfo] = useState<any>([])
  //任务数据
  const [taskData, setTaskData] = useState<any>([])
  //表格loading
  const [loading, setLoading] = useState(false)
  //数据总数
  const [totalElements, setTotalElements] = useState(0)
  //任务详情框
  const [opentaskdetail, setOpentaskdetail] = useState(false)
  //任务ID
  const [freshPage, setFreshPage] = useState(false)
  //日期格式
  const dateFormat = 'YYYY/MM/DD'
  //分页参数
  const [queryParam, setQueryParam] = useState({
    startTime: '',
    endTime: '',
    startNo: 0,
    pageSize: 10,
    keywords: '',
  })
  //记录TASKID任务ID
  const [taskId, setTaskId] = useState(0)
  const menu = (
    <Menu className="opt_btn" onClick={() => recallOnFile()}>
      <Menu.Item className="opt_btn_item" key="1">
        撤回
      </Menu.Item>
    </Menu>
  )
  useEffect(() => {
    console.log(6666)
    let mounted = false
    const newTime = getMonthDay()
    queryStatisticsInfo(newTime.startTime, newTime.endTime).then(() => {
      if (!mounted) {
        mounted = true
      }
    })
    setQueryParam({ ...queryParam, startTime: newTime.startTime, endTime: newTime.endTime })
    setWindowHeight(window.innerHeight)
    window.addEventListener('resize', function() {
      setWindowHeight(this.window.innerHeight)
    })
    return () => {
      mounted = true
      window.removeEventListener('resize', function() {
        setWindowHeight(this.window.innerHeight)
      })
    }
  }, [])
  useEffect(() => {
    let mounted = false
    queryListByDeptUser().then(() => {
      if (!mounted) {
        mounted = true
      }
    })
    return () => {
      mounted = true
    }
  }, [queryParam, !freshPage])
  // useEffect(() => {
  //   setWindowHeight(window.innerHeight)
  //   window.addEventListener('resize', function() {
  //     setWindowHeight(this.window.innerHeight)
  //   })
  //   return () => {
  //     window.removeEventListener('resize', function() {
  //       setWindowHeight(this.window.innerHeight)
  //     })
  //   }
  // }, [])
  //获得近三月的起止日期
  const getMonthDay = () => {
    const now = new Date()
    const month = now.getMonth() + 1 //js获取到的是月份是 0-11 所以要加1
    const year = now.getFullYear()
    const nextMonthFirstDay = new Date([year, month + 1, 1].join('-')).getTime()
    const oneDay = 1000 * 24 * 60 * 60
    const monthLast = new Date(nextMonthFirstDay - oneDay).getDate()
    const TIME_1 = [year, fillMath(month - 2), '01'].join('/')
    const TIME_2 = [year, fillMath(month), fillMath(monthLast)].join('/')
    return {
      startTime: TIME_1 + ' ' + '00:00',
      endTime: TIME_2 + ' ' + '23:59',
    }
  }
  //补0
  const fillMath = (num: number) => {
    return num < 10 ? '0' + num : num
  }
  //查询统计信息
  const queryStatisticsInfo = (startTime: string, endTime: string) => {
    return new Promise((resolve: any) => {
      const orgId = selectTeamId == -1 || isNaN(selectTeamId) ? '' : selectTeamId
      queryStatistics({
        teamId: orgId,
        userId: nowUserId,
        startTime: startTime,
        endTime: endTime,
        roleId: undefined,
        account: nowAccount,
      }).then((data: any) => {
        if (data.returnCode == 0) {
          setStatisticsInfo(data.dataList)
        } else {
          message.error(data.returnMessage)
        }
        resolve(true)
      })
    })
  }
  //查询列表信息
  const queryListByDeptUser = () => {
    return new Promise((resolve: any) => {
      setLoading(true)
      const orgId = selectTeamId == -1 || isNaN(selectTeamId) ? '' : selectTeamId
      queryArchiveTaskListByDeptUser({
        teamId: orgId,
        userId: nowUserId,
        startTime: queryParam.startTime,
        endTime: queryParam.endTime,
        archiveStatus: '',
        startNo: queryParam.startNo,
        pageSize: queryParam.pageSize,
        account: nowAccount,
        keywords: queryParam.keywords,
      }).then((data: any) => {
        setLoading(false)
        if (data.returnCode == 0) {
          setTaskData(data.data.content || [])
          setTotalElements(data.data.totalElements || 0)
        } else {
          message.error('查询任务失败')
        }
        resolve(true)
      })
    })
  }
  //日期切换
  const changeRangePicker = (_dates: any, dateStrings: string[]) => {
    setQueryParam({
      ...queryParam,
      startTime: dateStrings[0] + ' ' + '00:00',
      endTime: dateStrings[1] + ' ' + '23:59',
    })
  }
  //归档撤回
  const recallOnFile = () => {
    recall({
      operateUser: nowUserId, //操作人id
      operateUserName: nowUser, //操作人姓名
      taskId: taskId, //任务id
    })
      .then((data: any) => {
        message.success('撤回成功')
        queryListByDeptUser()
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }
  return (
    <div className="file_task_modal">
      <div className="file_task_modal_header">
        <span className="f_title">归档任务</span>
        <CloseOutlined className="close_icon" onClick={() => onClose()} />
      </div>
      <div className="range_time_box">
        <RangePicker allowClear={false} onChange={changeRangePicker} format={dateFormat} />
      </div>
      <div className="statistics_Info">
        <div className="temp_item item_11">
          <Tooltip title={statisticsInfo[0] <= 999 ? '' : statisticsInfo[0] + 'h'}>
            <div className="p-img">{statisticsInfo[0] <= 999 ? parseInt(statisticsInfo[0]) : '999+'}</div>
          </Tooltip>
          <div className="p-text">归档总任务</div>
        </div>
        <div className="temp_item item_12">
          <Tooltip title={statisticsInfo[1] <= 999 ? '' : statisticsInfo[1] + 'h'}>
            <div className="p-img">{statisticsInfo[1] <= 999 ? parseInt(statisticsInfo[1]) : '999+'}</div>
          </Tooltip>
          <p className="p-text">延迟任务</p>
        </div>
        <div className="temp_item item_13">
          <div className="p-img">
            {statisticsInfo[2] || '0'}
            <em>%</em>
          </div>
          <div className="p-text">延迟率</div>
        </div>
        <div className="temp_item item_14">
          <Tooltip title={statisticsInfo[3] <= 999 ? '' : statisticsInfo[3] + 'h'}>
            <div className="p-img">{statisticsInfo[3] <= 999 ? parseInt(statisticsInfo[3]) : '999+'}</div>
          </Tooltip>
          <div className="p-text">变更任务</div>
        </div>
        <div className="temp_item item_15">
          <div className="p-img">
            {statisticsInfo[4] || '0'}
            <em>%</em>
          </div>
          <div className="p-text">变更率</div>
        </div>
      </div>
      <div className="ant_search_input">
        <Search
          placeholder="可搜索任务名称或任务责任人"
          onSearch={value =>
            setQueryParam({
              ...queryParam,
              startNo: 0,
              pageSize: 10,
              keywords: value,
            })
          }
          style={{ width: 200 }}
        />
      </div>
      <div className="file_table_list">
        <Table
          className="file_task_table"
          showHeader={false}
          columns={[
            {
              render: (record: ItemProps) => {
                return (
                  <Dropdown overlay={menu} trigger={['contextMenu']}>
                    <div
                      className={$c('ant_table_item', { finishedTask: record.archiveStatus == 1 })}
                      onClick={e => {
                        e.stopPropagation()
                        //200、9、10 靓仔交代不允许跳转详情
                        // setOpentaskdetail(true)
                        setTaskId(record.id)
                      }}
                    >
                      <div className="ant_table_l">
                        <div className="padr4">{record.taskName}</div>
                        <div className="tag-list">
                          {record.icon && (
                            <img
                              className="boardTaskLabel"
                              src={$tools.asAssetsPath(`/images/task/${record.icon}.png`)}
                            />
                          )}

                          {record.property === 1 && <Tag className="com-tag com-tag-m">密</Tag>}
                          {record.delayTime != 0 && <Tag className="com-tag com-tag-y">延</Tag>}
                          <Tag className="com-tag com-tag-g">归</Tag>
                          {record.taskChangeNum != 0 && (
                            <span className="taskMiddleLabel">变更:{record.taskChangeNum}次</span>
                          )}
                          {record.review != 0 && (
                            <span className="taskMiddleLabel">复盘:{record.review}次</span>
                          )}
                        </div>
                      </div>
                      <div className="ant_table_r">
                        <span style={{ marginRight: '10px' }} className="taskMiddle_time">
                          {record.archiveTime ? record.archiveTime + '归档' : ''}
                        </span>
                        <Avatar src={record.profile} style={{ backgroundColor: '#4285f4', fontSize: 12 }}>
                          {record.username.substr(-2, 2)}
                        </Avatar>
                      </div>
                    </div>
                  </Dropdown>
                )
              },
            },
          ]}
          tableLayout={'auto'}
          dataSource={taskData}
          locale={{
            emptyText: <NoneData imgSrc={$tools.asAssetsPath('/images/common/none_img_icon_4.svg')} />,
          }}
          rowKey={record => record.id}
          loading={loading}
          scroll={{ y: windowHeight - 450 }}
          onRow={(record: any) => {
            return {
              onContextMenu: (e: any) => {
                e.stopPropagation()
                setTaskId(record.id)
              },
              // onClick: (e: any) => {
              //   e.stopPropagation()
              //   setOpentaskdetail(true)
              //   setTaskId(record.id)
              // },
            }
          }}
          pagination={{
            position: ['bottomCenter'],
            current: queryParam.startNo + 1,
            pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
            total: totalElements,
            showSizeChanger: true,
            onChange: (current, pageSize) => {
              setQueryParam({
                ...queryParam,
                startNo: current - 1,
                pageSize: pageSize || 10,
              })
            },
            onShowSizeChange: (current, size) => {
              setQueryParam({
                ...queryParam,
                startNo: current - 1,
                pageSize: size,
              })
            },
          }}
        />
      </div>
      {opentaskdetail && (
        <DetailModal
          param={{
            visible: opentaskdetail,
            from: 'undlist',
            id: taskId,
          }}
          setvisible={(state: any) => {
            setOpentaskdetail(state)
          }}
          callbackFn={() => {
            setFreshPage(!freshPage)
          }}
        ></DetailModal>
      )}
    </div>
  )
}
export default FileTaskModal

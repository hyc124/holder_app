import React, { useEffect, useState, useLayoutEffect } from 'react'
import moment from 'moment'
import { Modal, Button, Table, Avatar, Tabs, Radio, message, DatePicker, Tooltip } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import TaskReportModel from './TaskReportModel'
interface ReportListData {
  taskId: number
  taskName: string
  liableUserId: number
  liableUserName: string
  liableUserProfile: string
  createTime: string
  readStatus: number
  msgStatus: number
  reportCount: number
  fileCount: number
  commentCount: number
  isNewComment: number
  teamId: number
  ascriptionName: string
  userList: Array<string>
  color: number
  forceReport: number
}
const { RangePicker } = DatePicker
const ShowTaskContent = (props: any) => {
  //编辑模块弹窗是否显示
  const { nowUserId, loginToken } = $store.getState()
  const [taskReportList, setTaskReportList] = useState<Array<ReportListData>>([])
  // 控制表格数据加载
  const [loading, setLoading] = useState(true)
  // 控制类型筛选
  const [visibleFilter, setVisibleFilter] = useState(false)
  const [detailsModel, setDetailsModel] = useState(false)
  const [singdetailsData, setSingdDtailsData] = useState<ReportListData>()
  const [saveParam, setSaveParam] = useState({
    userId: nowUserId,
    type: 1,
    startTime: moment()
      .subtract(3, 'months')
      .format('YYYY/MM/DD HH:mm'),
    endTime: moment(new Date()).format('YYYY/MM/DD HH:mm'),
    keyWords: '',
    pageSize: 10,
    readStatus: [0, 1],
  })
  const [pagination, setPagination] = useState({
    pageNo: 1,
    pageSize: 10,
    total: 0,
  })
  //筛选的汇报类型
  const [isForce, setIsForce] = useState(-1)
  //打开模态框请求接口
  useEffect(() => {
    if (props.visible) {
      findWorkReportList()
    }
  }, [props.visible])
  useLayoutEffect(() => {
    initEvent()
  }, [])
  const initEvent = () => {
    jQuery('.ant-modal-wrap')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.reportListSetBox .ant-radio-button-wrapper,.workReportScreen') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          setVisibleFilter(false)
        }
      })
  }
  // 表格数据查询
  const findWorkReportList = (force?: number) => {
    const param: any = saveParam

    if (force || force == 0) {
      param.isForce = force
    } else {
      delete param.isForce
    }
    param.pageNo = pagination.pageNo - 1
    $api
      .request('/task/report/find/keyword', param, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then(resData => {
        const list = resData.data
        setTaskReportList(list.content)
        pagination.total = list.totalElements || 0
        //设置分页
        setPagination({ ...pagination })
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        console.log(saveParam)
      })
  }
  const getClume = () => {
    const columns = [
      {
        title: '任务名称',
        dataIndex: 'type',
        key: 'type',
        width: '220px',
        render: (_text: any, record: any) => {
          return (
            <>
              <div className="list_table_name">
                <span className="">{record.taskName}</span>
                {/* 强制汇报标志 */}
                <span className={record.forceReport == 1 ? 'icon-tag' : ''}></span>
              </div>
              {record.readStatus === 0 && (
                <span className={`${record.color == 1 ? 'task_report_red' : 'task_report_ccc'}`}></span>
              )}
              <div className="list_table_bottom">
                <span className="list_table_bottom_person"></span>
                <span>{record.liableUserName}</span>
                <span className="list_table_bottom_msg">{record.isNewComment != 0 && <i></i>}</span>
                <span>{record.commentCount}</span>
                <span className="list_table_edit"></span>
                <span>{record.reportCount}</span>
              </div>
            </>
          )
        },
        ellipsis: true,
      },
      {
        title: '提交时间',
        dataIndex: 'time',
        key: 'time',
        width: '100px',
        render: (_text: any, record: any) => `${record.createTime}`,
      },
      {
        title: '汇报人',
        dataIndex: 'avatar',
        key: 'reportUser',
        width: '120px',
        render: (_text: any, record: any) => {
          return (
            <div className="liable-user-list">
              {record.userList &&
                record.userList.map((item: any, index: number) => (
                  <div key={index} className="liable-user-item">
                    {index < 3 && (
                      <Avatar src={item.profile || ''} className="oa-avatar">
                        {item.username && item.username.substr(-2, 2)}
                      </Avatar>
                    )}
                    {index === 3 && <Avatar className="oa-avatar">...</Avatar>}
                  </div>
                ))}
            </div>
          )
        },
      },

      {
        title: '所属组织',
        dataIndex: 'organization',
        key: 'organization',
        width: '100px',
        render: (_text: any, record: any) => `${record.ascriptionName}`,
      },
    ]
    if (saveParam.type == 0) {
      columns.splice(2, 1)
    }
    return columns
  }

  // 筛选弹框出现
  const filterInfo = (e: any) => {
    e.stopPropagation()
    setVisibleFilter(!visibleFilter)
  }
  const stopVisibleIsRead = (e: any) => {
    e.stopPropagation()
  }
  //输入框筛选
  const changeInputVal = (e: any) => {
    saveParam.keyWords = e.target.value
    pagination.pageNo = 1
    setSaveParam({ ...saveParam })
    findWorkReportList()
  }
  // 重置筛选
  const resstFilter = () => {
    pagination.pageNo = 1
    setIsForce(-1)
    saveParam.startTime = moment()
      .subtract(3, 'months')
      .format('YYYY/MM/DD HH:mm')
    saveParam.endTime = moment(new Date()).format('YYYY/MM/DD HH:mm')
    saveParam.keyWords = ''
    saveParam.pageSize = 20
    saveParam.readStatus = [0, 1]
    setSaveParam({ ...saveParam })
    findWorkReportList()
  }
  const searchOrg = () => {
    findWorkReportList()
  }
  // 筛选汇报类型
  const filterList = (e: any) => {
    pagination.pageNo = 1
    setIsForce(e.target.value)
    findWorkReportList(e.target.value)
  }
  const isUserRead = (list: any) => {
    pagination.pageNo = 1
    saveParam.readStatus = list
    setSaveParam({ ...saveParam })
    findWorkReportList()
  }
  const timePickerChange = (_dates: any, dateStrings: string[]) => {
    pagination.pageNo = 1
    const sendVal = dateStrings[0] + '-' + dateStrings[1]
    saveParam.startTime = dateStrings[0] + ' 00:00'
    saveParam.endTime = dateStrings[1] + ' 23:59'
    setSaveParam({ ...saveParam })
    findWorkReportList()
  }
  return (
    <div
      className="task_report_table"
      ref={() => {
        initEvent()
      }}
    >
      <div className="menu_tab">
        <Radio.Group className="reportListTypeBox">
          <Radio.Button
            className={saveParam.type == 1 ? 'active' : ''}
            value="0"
            onClick={() => {
              setLoading(true)
              pagination.pageNo = 1
              saveParam.readStatus = [0, 1]
              setPagination({ ...pagination, pageSize: pagination.pageSize || 20 })
              saveParam.type = 1
              setSaveParam({ ...saveParam })
              findWorkReportList()
            }}
          >
            我收到的
          </Radio.Button>
          <Radio.Button
            className={saveParam.type == 0 ? 'active' : ''}
            value="1"
            onClick={() => {
              setLoading(true)
              pagination.pageNo = 1
              saveParam.readStatus = [0, 1]
              setPagination({ ...pagination, pageSize: pagination.pageSize || 20 })
              saveParam.type = 0
              setSaveParam({ ...saveParam })
              findWorkReportList()
            }}
          >
            我发起的
          </Radio.Button>
        </Radio.Group>
        <Radio.Group className="reportListSetBox">
          <Radio.Button
            value="2"
            onClick={e => {
              filterInfo(e)
            }}
          >
            <i className="selcet_type"></i>筛选
            {/* {<span className="selcet_type_choose"></span>} */}
          </Radio.Button>
        </Radio.Group>
      </div>
      <div className="list_box">
        {taskReportList.length == 0 && saveParam.type == 1 && (
          <NoneData
            showTxt={'目前还没有数据哟~'}
            imgSrc={$tools.asAssetsPath(`/images/noData/report_one.png`)}
            imgStyle={{ width: 100, height: 100 }}
          />
        )}
        {taskReportList.length == 0 && saveParam.type == 0 && (
          <NoneData
            showTxt={'快把你的成果告诉别人吧'}
            imgSrc={$tools.asAssetsPath(`/images/noData/report_two.png`)}
            imgStyle={{ width: 100, height: 100 }}
          />
        )}
        {taskReportList.length > 0 && (
          <Table
            scroll={{ y: 'calc(100% - 46px)' }}
            onRow={(record: any) => {
              return {
                onClick: event => {
                  event.preventDefault()
                  setDetailsModel(true)
                  setSingdDtailsData(record)
                }, // 点击行
              }
            }}
            pagination={{
              ...pagination,
              position: ['bottomCenter'],
              pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
              current: pagination.pageNo,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                pagination.pageNo = page
                pagination.pageSize = pageSize || 10
                setPagination({ ...pagination })
                findWorkReportList()
              },
              onShowSizeChange: (current, size) => {
                saveParam.pageSize = size
                setSaveParam({ ...saveParam })
                pagination.pageNo = 1
                pagination.pageSize = size || 10
                setPagination({ ...pagination })
                findWorkReportList()
              },
            }}
            showHeader={taskReportList.length !== 0}
            className="list_table"
            dataSource={taskReportList}
            columns={getClume()}
            loading={loading}
            tableLayout={'fixed'}
            locale={{ emptyText: <NoneData /> }}
            rowKey={record => record.taskId}
          />
        )}
      </div>

      {visibleFilter && props.visible && (
        <div
          className="filtersTermBox workReportScreen"
          onClick={e => {
            stopVisibleIsRead(e)
          }}
        >
          {/* <header className="filtersHeader">
            <div className="filter-reset-box" onClick={resstFilter}>
              <span className="filter-reset-icon"></span>
              <span>重置条件</span>
            </div>
          </header> */}
          <div className="filtersCon">
            <span className="filterTitle">搜索:</span>
            <div className="filterSearchBox">
              <label>
                <i className="searchIcon" onClick={searchOrg}></i>
              </label>
              <input
                onChange={changeInputVal}
                value={saveParam.keyWords}
                type="text"
                placeholder="按执行人姓名/任务名称"
                name=""
                className="searchVal filterSearchVal"
              />
            </div>
            <div className="filterLine"></div>
            <span className="filterTitle">汇报:</span>
            <section className="filtersItem">
              {/* <div className="filters-item-tit">
                <span>按汇报筛选</span>
              </div> */}
              <div className="filters-item-con">
                <div className="filters-item-in">
                  <div className="filter-status">
                    <ul className="filter-status-classify">
                      <li value="1" className={isForce === 1 ? 'active' : ''} onClick={filterList}>
                        被设置的汇报
                      </li>
                      <li value="0" className={isForce === 0 ? 'active' : ''} onClick={filterList}>
                        普通汇报
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
            {saveParam.type == 1 && (
              <>
                <div className="filterLine"></div>
                <span className="filterTitle">状态:</span>
                <section className="filtersItem">
                  {/* <div className="filters-item-tit">
                  <span>按类型筛选</span>
                </div> */}
                  <div className="filters-item-con">
                    <div className="filters-item-in">
                      <ul className="filter-status-classify">
                        <li
                          value="0"
                          onClick={() => isUserRead([0, 1])}
                          className={saveParam.readStatus.length > 1 ? 'active' : ''}
                        >
                          所有
                        </li>
                        <li
                          value="1"
                          onClick={() => isUserRead([0])}
                          className={
                            saveParam.readStatus.length == 1 && saveParam.readStatus[0] === 0 ? 'active' : ''
                          }
                        >
                          未读
                        </li>
                        <li
                          value="2"
                          onClick={() => isUserRead([1])}
                          className={
                            saveParam.readStatus.length == 1 && saveParam.readStatus[0] === 1 ? 'active' : ''
                          }
                        >
                          已读
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
              </>
            )}
            <div className="filterLine"></div>
            <span className="filterTitle">日期:</span>
            <section className="filtersItem">
              {/* <div className="filters-item-tit">
                <span>按日期筛选</span>
              </div> */}
              <div className="filters-item-con">
                <div className="filters-item-in">
                  <RangePicker
                    dropdownClassName="select-time-picker"
                    format="YYYY/MM/DD"
                    onChange={timePickerChange}
                    allowClear={false}
                    value={
                      saveParam.startTime == ''
                        ? null
                        : [moment(saveParam.startTime, 'YYYY/MM/DD'), moment(saveParam.endTime, 'YYYY/MM/DD')]
                    }
                  />
                </div>
              </div>
            </section>
            <section className="filtersBottom">
              <div className="filter-reset-box" onClick={resstFilter}>
                <span className="filter-reset-icon"></span>
                <span className="filter-reset-text">重置</span>
              </div>
            </section>
          </div>
        </div>
      )}
      {/* 汇报详情界面 */}

      {detailsModel && (
        <TaskReportModel
          param={{ visible: detailsModel, data: singdetailsData, type: saveParam.type }}
          setvisible={(state: any) => {
            if (singdetailsData?.readStatus == 0) {
              findWorkReportList()
            }
            setDetailsModel(state)
          }}
        />
      )}
    </div>
  )
}
export default ShowTaskContent

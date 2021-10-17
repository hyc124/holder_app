import { useEffect, useState } from 'react'
import moment from 'moment'
import React from 'react'
import { DatePicker, Menu, message, Modal, Pagination, Radio, Select, Space, Table, Tooltip } from 'antd'
import './reportAccept.less'
import { getReportTemplate, queryClientStatisticsDetail, ReportAcceptance } from '../getData'
import { findAllCompanyApi } from '../../task/creatTask/getData'
import NoneData from '@/src/components/none-data/none-data'
import { useMergeState } from '../../chat-history/chat-history'
import $c from 'classnames'
import Avatar from 'antd/lib/avatar/avatar'
import ReportDetails from './ReportDetails'
const { RangePicker } = DatePicker
interface SubmitDetailePorps {
  visible: boolean
  info: any
  setVsible: () => void
  isChat?: boolean
}
interface CompanyProps {
  id: number
  name: string
}
interface ReportTypeProps {
  name: string
  templateId: number
  type: number
  customType: number
}
interface ReportAcceptProps {
  visible: boolean
  changVisible: (state: boolean) => void
  reportUser: any
}
// 表格数据表头
const COLUMNS = [
  [
    {
      title: '提交时段',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '准时提交',
      dataIndex: 'punctualityCount',
      key: 'punctualityCount',
    },
    {
      title: '迟交',
      dataIndex: 'delayCount',
      key: 'delayCount',
    },
    {
      title: '未提交',
      dataIndex: 'notCount',
      key: 'notCount',
    },
  ],
  [
    {
      title: '汇报人',
      dataIndex: 'username',
      key: 'username',
      render: (recode: any) => {
        const userMsg = recode ? recode.split('&##&') : ['', '']
        return (
          <div className="table_item table_item_username">
            <Avatar size={24} src={userMsg[1]} style={{ marginRight: 10 }}>
              {userMsg[0].substr(-2, 2)}
            </Avatar>
            <Tooltip title={userMsg[0]}>
              <span>{userMsg[0].length > 3 ? userMsg[0].substr(0, 3) + '...' : userMsg[0]}</span>
            </Tooltip>
          </div>
        )
      },
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (recode: any) => {
        const newMsg = !!recode ? recode.replace(/<[^>]+>/g, '') : ''
        return (
          <Tooltip title={newMsg}>
            <div className="table_item table_item_content">{newMsg}</div>
          </Tooltip>
        )
      },
    },
    {
      title: '部门',
      dataIndex: 'deptName',
      key: 'deptName',
      render: (recode: any) => {
        return (
          <Tooltip title={recode}>
            <div className="table_item table_item_deptName">{recode}</div>
          </Tooltip>
        )
      },
    },
    {
      title: '岗位',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (recode: any) => {
        return (
          <Tooltip title={recode}>
            <div className="table_item table_item_roleName">{recode}</div>
          </Tooltip>
        )
      },
    },
    {
      title: '提交时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (recode: any) => {
        return (
          <Tooltip title={recode}>
            <div className="table_item table_item_createTime">{recode}</div>
          </Tooltip>
        )
      },
    },
  ],
]

//*********************报告接收统计************************ *//
const ReportAccept = (props: ReportAcceptProps) => {
  const { nowUserId, nowAccount } = $store.getState()
  const [windowHeight, setWindowHeight] = useState(0)
  const [belongId, setbelongId] = useState('')
  const [dataSource, setdataSource] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const [companyList, setCompanyList] = useState<CompanyProps[]>([])
  const [reportTypeList, setReporTypetList] = useState<any>([])
  const [templateId, settemplateId] = useState<any>(Number)
  const [pagination, setPagination] = useState({
    pageNo: 0,
    pageSize: 20,
    total: 0,
  })
  const [isModalDetails, setisModalDetails] = useState({
    visible: false,
    obj: {},
  })
  const [filterObjRef, setQueryValue] = useState<any>({
    startTime: '',
    endTime: '',
  })
  const [selectReport, setSelectReport] = useState<ReportTypeProps>({
    name: '',
    templateId: 0,
    type: 0,
    customType: 0,
  })

  // 点击改变时间 特殊处理周报季报
  const changeCustomDate = (dates: any, dateStrings: any) => {
    let startTime = dateStrings[0]
    let endTime = dateStrings[1]
    const year = startTime.slice(0, 4)
    setQueryValue({
      startTime: dateStrings[0],
      endTime: dateStrings[1],
    })
    // 周报
    if (selectReport.type === 1) {
      startTime = startTime.substring(0, startTime.length - 1)
      endTime = endTime.substring(0, endTime.length - 1)
      const startArr = startTime.split('/')
      const endArr = endTime.split('/')
      const startYear = Number(startArr[0])
      const startWeek = Number(startArr[1]) + 1
      const endYear = Number(endArr[0])
      const endWeek = Number(endArr[1]) + 1
      startTime = moment()
        .year(startYear)
        .week(startWeek)
        .day(1)
        .format('YYYY/MM/DD')
      endTime = moment()
        .year(endYear)
        .week(endWeek)
        .day(7)
        .format('YYYY/MM/DD')
    }
    // 季报
    if (selectReport.type === 3) {
      const enumStart: any = {
        1: '01',
        2: '04',
        3: '07',
        4: '10',
      }
      const enumEnd: any = {
        1: '03',
        2: '06',
        3: '09',
        4: '12',
      }
      const startQuarter = startTime.split('/')[1]
      const endQuarter = endTime.split('/')[1]
      startTime = `${year}/${enumStart[startQuarter]}`
      endTime = `${year}/${enumEnd[endQuarter]}`
    }
    setQueryValue({
      startTime: startTime,
      endTime: endTime,
    })
  }

  // 设置周报格式
  const customFormat = (defaultValue: any) => `${defaultValue.format('YYYY/W')}周`

  useEffect(() => {
    findAllCompanyApi({
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }).then((companyData: any) => {
      if (companyData.length) {
        // 设置公司列表数据
        setCompanyList(companyData)
        const teamId = companyData[0].id
        setbelongId(teamId)
      }
    })
    setWindowHeight(window.innerHeight)
    window.addEventListener('resize', function() {
      setWindowHeight(this.window.innerHeight)
    })
    return () => {
      window.removeEventListener('resize', function() {
        setWindowHeight(this.window.innerHeight)
      })
    }
  }, [])

  useEffect(() => {
    // 查询汇报模板
    if (belongId) {
      getReportTemplate(belongId).then(data => {
        const { initStartTime, initEndTime } = rangePickerSet(data[0].type)
        // 设置选择时间
        setQueryValue({
          startTime: initStartTime,
          endTime: initEndTime,
        })
        if (data.length) {
          // 设置汇报模板列表数据
          setReporTypetList(data)
          settemplateId(data[0].templateId)
          setSelectReport(data[0])
        }
      })
    }
  }, [belongId])

  useEffect(() => {
    if (templateId != 0) {
      const { pageSize, pageNo } = pagination
      const { endTime, startTime } = filterObjRef
      const $param = {
        belongId: belongId,
        endTime: endTime,
        startTime: startTime,
        pageNo: pageNo,
        pageSize: pageSize,
        templateId: templateId,
        userId: nowUserId,
      }
      setLoading(true)
      ReportAcceptance($param)
        .then((companyData: any) => {
          // 表格数据 赋值
          setLoading(false)
          setdataSource(companyData)
          if (companyData.data != null) {
            setPagination({
              ...pagination,
              total: companyData.data?.totalElements,
            })
          }
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [templateId, pagination.pageSize, pagination.pageNo, filterObjRef.startTime, filterObjRef.endTime])

  // 切换报告类型
  const changeSelectMenu = (selectMenu: ReportTypeProps) => {
    // 设置初始时间
    const { initStartTime, initEndTime } = rangePickerSet(selectMenu.type)
    setQueryValue({
      startTime: initStartTime,
      endTime: initEndTime,
    })
    settemplateId(selectMenu.templateId)
    setSelectReport({
      ...selectMenu,
    })
  }

  const rangePickerSet = (reportType: number) => {
    let startTime: any = moment()
      .startOf('month')
      .format('YYYY/MM/DD')
    let endTime: any = moment()
      .endOf('month')
      .format('YYYY/MM/DD')
    switch (reportType) {
      case 0:
      case 1:
        // 日报和周报
        startTime = moment()
          .startOf('month')
          .format('YYYY/MM/DD')
        endTime = moment()
          .endOf('month')
          .format('YYYY/MM/DD')
        break
      case 2:
        // 月报
        startTime = `${moment()
          .startOf('year')
          .format('YYYY/MM')}/01`
        endTime = `${moment()
          .endOf('year')
          .format('YYYY/MM')}/31`
        break
      case 3:
        // 季报
        startTime = `${moment()
          .startOf('year')
          .format('YYYY/MM')}/01`
        const endQuarter = endTime.split('/')[1]
        if (endQuarter === '3' || endQuarter === '12') {
          endTime = `${moment()
            .endOf('year')
            .format('YYYY/MM')}/31`
        } else {
          endTime = `${moment()
            .endOf('year')
            .format('YYYY/MM')}/30`
        }
        break
      case 4:
        // 年报
        startTime = `${moment().format('YYYY')}/01/01`
        endTime = `${moment().format('YYYY')}/12/31`
        break
      case 5:
        // 自定义月报
        startTime = `${moment()
          .startOf('year')
          .format('YYYY/MM')}/01`
        endTime = `${moment()
          .endOf('year')
          .format('YYYY/MM')}/31`
      default:
        break
    }
    return {
      initStartTime: startTime,
      initEndTime: endTime,
    }
  }

  // 切换企业
  const changeOrg = (str: any) => {
    setbelongId(str)
    setTimeout(() => {
      jQuery('.ant-select-focused').removeClass('ant-select-focused')
    })
  }
  return (
    <>
      <Modal
        title="接受统计报告"
        visible={props.visible}
        mask
        className="BasicModal"
        width="100%"
        onCancel={() => props.changVisible(false)}
        footer={null}
        zIndex={1000}
      >
        <div className="AcceptanceReportStat_content">
          <div className="AcceptanceReportStat_content_left">
            <div className="select_input">
              <Select value={belongId} onSelect={changeOrg}>
                {companyList.map(item => {
                  return (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  )
                })}
              </Select>
            </div>
            <div className="statis_list">
              <Menu className="report_Left_list" selectedKeys={[String(templateId)]}>
                {reportTypeList.map((item: ReportTypeProps) => (
                  <Menu.Item key={item.templateId} onClick={() => changeSelectMenu(item)}>
                    <Tooltip title={item.name.length > 14 ? item.name : undefined}>
                      <div className="myMenu_Item">
                        <i className="myMenu_img"></i>
                        <span>{item.name}</span>
                      </div>
                    </Tooltip>
                  </Menu.Item>
                ))}
              </Menu>
            </div>
          </div>
          {dataSource.data != null && dataSource?.data?.content && dataSource?.data?.content.length !== 0 && (
            <div className="AcceptanceReportStat_content_right">
              <div className="AcceptanceReportStat_time">
                {/* 日报 */}
                {(selectReport.type === 0 || (selectReport.type === 5 && selectReport.customType === 0)) && (
                  <Space direction="vertical" size={14}>
                    <RangePicker
                      format="YYYY/MM/DD"
                      defaultValue={[
                        moment(
                          moment()
                            .startOf('month')
                            .format('YYYY/MM/DD')
                        ),
                        moment(
                          moment()
                            .endOf('month')
                            .format('YYYY/MM/DD')
                        ),
                      ]}
                      value={[moment(filterObjRef.startTime), moment(filterObjRef.endTime)]}
                      onChange={changeCustomDate}
                    />
                  </Space>
                )}
                {/* 周报 */}
                {(selectReport.type === 1 || (selectReport.type === 5 && selectReport.customType === 1)) && (
                  <Space direction="vertical" size={14}>
                    <RangePicker
                      format={customFormat}
                      picker="week"
                      defaultValue={[
                        moment(
                          moment()
                            .startOf('month')
                            .format('YYYY/MM/DD')
                        ),
                        moment(
                          moment()
                            .endOf('month')
                            .format('YYYY/MM/DD')
                        ),
                      ]}
                      onChange={changeCustomDate}
                      value={[moment(filterObjRef.startTime), moment(filterObjRef.endTime)]}
                    />
                  </Space>
                )}
                {/* 月报 */}
                {(selectReport.type === 2 || (selectReport.type === 5 && selectReport.customType === 2)) && (
                  <Space direction="vertical" size={14}>
                    <RangePicker
                      format="YYYY/MM"
                      className="search-item"
                      picker="month"
                      placeholder={['开始时间', '截止时间']}
                      defaultValue={[
                        moment(
                          moment()
                            .startOf('year')
                            .format('YYYY/MM')
                        ),
                        moment(
                          moment()
                            .endOf('year')
                            .format('YYYY/MM')
                        ),
                      ]}
                      value={[moment(filterObjRef.startTime), moment(filterObjRef.endTime)]}
                      onChange={changeCustomDate}
                    />
                  </Space>
                )}
                {/* 季报 */}
                {(selectReport.type === 3 || (selectReport.type === 5 && selectReport.customType === 3)) && (
                  <Space direction="vertical" size={14}>
                    <RangePicker
                      className="search-item"
                      picker="quarter"
                      format="YYYY/Q"
                      placeholder={['开始时间', '截止时间']}
                      defaultValue={[
                        moment(
                          moment()
                            .startOf('year')
                            .format('YYYY/MM')
                        ),
                        moment(
                          moment()
                            .endOf('year')
                            .format('YYYY/MM')
                        ),
                      ]}
                      onChange={changeCustomDate}
                      value={[moment(filterObjRef.startTime), moment(filterObjRef.endTime)]}
                    />
                  </Space>
                )}
                {/* 年报 */}
                {(selectReport.type === 4 || (selectReport.type === 5 && selectReport.customType === 4)) && (
                  <Space direction="vertical" size={14}>
                    <RangePicker
                      className="search-item"
                      picker="year"
                      format="YYYY"
                      placeholder={['开始时间', '截止时间']}
                      defaultValue={[moment(moment().format('YYYY')), moment(moment().format('YYYY'))]}
                      onChange={changeCustomDate}
                      value={[moment(filterObjRef.startTime), moment(filterObjRef.endTime)]}
                    />
                  </Space>
                )}
              </div>
              <Table
                className="tableContent list_table"
                tableLayout={'auto'}
                dataSource={dataSource?.data?.content}
                columns={COLUMNS[0]}
                loading={loading}
                pagination={false}
                scroll={{ y: windowHeight - 240 }}
                rowKey={(_record, index) => index || 0}
                onRow={record => {
                  return {
                    onClick: () => {
                      setisModalDetails({
                        obj: record,
                        visible: true,
                      })
                    }, // 点击行
                  }
                }}
              />
              {/* 分页 */}
              <Pagination
                className="paginationCus"
                showSizeChanger
                current={pagination.pageNo + 1}
                pageSize={pagination.pageSize}
                pageSizeOptions={['5', '10', '20', '30', '50', '100']}
                total={pagination.total}
                onShowSizeChange={(current, pageSize) => {
                  setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 20 })
                }}
                onChange={(current, pageSize) => {
                  setPagination({
                    ...pagination,
                    pageNo: current - 1,
                    pageSize: pageSize || 20,
                  })
                }}
              />
            </div>
          )}
          {dataSource.data == null && (
            <NoneData
              imgSrc={$tools.asAssetsPath(`/images/acceptanceReportStat/error_img.png`)}
              imgStyle={{ width: 100, height: 100 }}
              showTxt={dataSource?.returnMessage}
            />
          )}
          {dataSource.data && dataSource?.data?.content && dataSource?.data?.content.length === 0 && (
            <NoneData
              imgSrc={$tools.asAssetsPath(`/images/acceptanceReportStat/error_img.png`)}
              imgStyle={{ width: 100, height: 100 }}
            />
          )}
        </div>
      </Modal>
      {isModalDetails.visible && (
        <SubmitModal
          visible={isModalDetails.visible}
          info={{
            title: jQuery('.ant-menu-item-selected')
              .find('span')
              .text(),
            templateId: templateId,
            belongId: belongId,
            isModalDetails: isModalDetails.obj,
            // reportUserIds: [props.reportUser.reportReceiveUser.id],
          }}
          setVsible={() => {
            setisModalDetails({
              obj: {},
              visible: false,
            })
          }}
        />
      )}
    </>
  )
}
export default ReportAccept

//*********************详情弹窗************************ */
export const SubmitModal = (props: SubmitDetailePorps) => {
  const { templateId, belongId, isModalDetails, title } = props.info
  const { nowUserId } = $store.getState()
  const [golobal, setGolobal] = useMergeState({
    totalPages: 0,
    windowHeight: 0, //视窗高度
    radioType: 0, //提交类型
    dataSource: [], //表格数据
    loading: false, //加载状态
    reportState: false, //工作报告详情
    reportIds: [], //汇报详情ID集合
  })
  //页码信息
  const [page, setPage] = useState({
    pageNo: 0,
    pageSize: 5,
  })

  //提交类型切换
  const changeRadio = (e: any, num: number) => {
    e.stopPropagation()
    setPage({ pageNo: 0, pageSize: 5 })
    setGolobal({
      radioType: num,
    })
  }
  //初始化
  useEffect(() => {
    const $modal: any = $('.basic_modal_detail')
    const tableHeight = $modal[0].offsetHeight - 222
    setGolobal({ windowHeight: tableHeight })
    window.addEventListener('resize', function() {
      setGolobal({ windowHeight: tableHeight })
    })
    return () => {
      window.removeEventListener('resize', function() {
        setGolobal({ windowHeight: tableHeight })
      })
    }
  }, [])

  //监听类型改变加载表格
  useEffect(() => {
    //radioType 0准交 1迟交 2未交
    const { radioType } = golobal
    const { punctualityUserIds, delayUserIds, notUserIds } = isModalDetails
    const { normalStartTime, delayEndTime } = isModalDetails
    const $params: any = {
      templateId: templateId,
      belongId: belongId,
      userId: nowUserId,
      type: radioType,
      pageNo: page.pageNo,
      pageSize: page.pageSize,
    }
    if (radioType !== 2) {
      $params.startTime = normalStartTime
      $params.endTime = delayEndTime
      $params.reportUserIds = radioType === 0 ? punctualityUserIds : delayUserIds
    } else {
      $params.reportUserIds = notUserIds
    }

    setGolobal({ loading: true })
    queryClientStatisticsDetail($params)
      .then((res: any) => {
        setGolobal({ loading: false })
        if (res.returnCode == 0) {
          const $content = res.data.content || []
          const $newData = $content.map((item: any) => {
            const _user = item.username + '&##&' + item.profile
            return {
              ...item,
              username: _user,
            }
          })
          setGolobal({
            dataSource: $newData,
            totalPages: res.data.totalElements || 0,
          })
        }
      })
      .catch(err => {
        setGolobal({ loading: false })
        message.error(err.returnMessage || '数据库异常~')
      })
      .finally(() => {
        setGolobal({ loading: false })
      })
  }, [golobal.radioType, page])

  return (
    <Modal
      title={props.isChat ? title : `${title}-${isModalDetails.date}`}
      visible={props.visible}
      onCancel={() => props.setVsible()}
      maskClosable={false}
      centered
      className="basic_modal_detail"
      width={850}
      footer={null}
    >
      <Radio.Group value={golobal.radioType}>
        <Radio.Button value={0} onClick={e => changeRadio(e, 0)}>
          准时提交{isModalDetails.punctualityCount > 0 ? `(${isModalDetails.punctualityCount})` : ''}
        </Radio.Button>
        <Radio.Button value={1} onClick={e => changeRadio(e, 1)}>
          迟交{isModalDetails.delayCount > 0 ? `(${isModalDetails.delayCount})` : ''}
        </Radio.Button>
        <Radio.Button value={2} onClick={e => changeRadio(e, 2)}>
          未提交{isModalDetails.notCount > 0 ? `(${isModalDetails.notCount})` : ''}
        </Radio.Button>
      </Radio.Group>
      <div className="footer_wrap">
        {!!golobal.dataSource.length && (
          <>
            <Table
              className={$c('basic_modal_table', { notclick: golobal.radioType === 2 })}
              tableLayout={'auto'}
              dataSource={golobal.dataSource}
              columns={COLUMNS[1]}
              loading={golobal.loading}
              pagination={false}
              scroll={{ y: golobal.windowHeight }}
              rowKey={(_record, index) => index || 0}
              onRow={record => {
                return {
                  onClick: () => {
                    const hasReport = record.ids && Array.isArray(record.ids) && record.ids.length > 0
                    if (golobal.radioType === 2) {
                      return false
                    }
                    if (hasReport) {
                      setGolobal({
                        reportIds: record.ids,
                        reportState: true,
                      })
                    } else {
                      message.error('当前没有任何汇报记录~')
                    }
                  },
                }
              }}
            />
            {/* 分页 */}
            <div className="pagination_tool">
              <Pagination
                showSizeChanger
                current={page.pageNo + 1}
                pageSize={page.pageSize}
                pageSizeOptions={['5', '10', '20', '30', '50', '100']}
                total={golobal.totalPages}
                onShowSizeChange={(current, pageSize) => {
                  setPage({
                    ...page,
                    pageNo: current - 1,
                    pageSize: pageSize || 10,
                  })
                }}
                onChange={(current, pageSize) => {
                  setPage({
                    ...page,
                    pageNo: current - 1,
                    pageSize: pageSize || 10,
                  })
                }}
              />
            </div>
          </>
        )}
        {golobal.dataSource.length === 0 && (
          <NoneData
            imgSrc={$tools.asAssetsPath(`/images/acceptanceReportStat/error_img.png`)}
            imgStyle={{ width: 80, height: 80 }}
          />
        )}
        {/*工作报告详情*/}
        {golobal.reportState && (
          <ReportDetails
            param={{
              reportId: golobal.reportIds.length > 1 ? golobal.reportIds : golobal.reportIds[0], //汇报id存在多个传数组
              isVisible: golobal.reportState,
            }}
            setvisible={(state: any) => {
              setGolobal({ reportState: state })
            }}
          />
        )}
      </div>
    </Modal>
  )
}

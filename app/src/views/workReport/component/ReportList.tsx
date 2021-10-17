import React, { useEffect, useState, useLayoutEffect, useRef } from 'react'
import { Modal, Table, Avatar, Radio, DatePicker } from 'antd'
import './ReportList.less'
import NoneData from '@/src/components/none-data/none-data'
import ShowTaskContent from './ShowTaskContent'
import ShowOkrContent from './ShowOkrContent'
import ReportListSetting from './ReportListSetting'
import moment from 'moment'
import { ipcRenderer } from 'electron'
import ReportDetails from './ReportDetails'
import { useSelector } from 'react-redux'
import ReporterSettiing from './ReporterSetting'
import { getFunsAuth } from '@/src/components/app-sidebar/appCommonApi'
const { RangePicker } = DatePicker

interface ReportListModalProps {
  visible: boolean
  onHideModal: () => void
}
interface ReportListData {
  id: number
  typeName: string
  belongName: string
  userName: string
  userId: number
  profile: string
  createTime: string
  userRead: number
  commentNum: number
  redDot: false
  phoneReportTime: string
  isNewComment: number
  content: string
  fileCount: number
  teamId: number
  reportStartTime: null
  reportEndTime: null
  thumbsUpNum: number
  thumbsUpState: true
}

const ReportList = ({ visible, onHideModal }: ReportListModalProps) => {
  //编辑模块弹窗是否显示
  const { nowUser, nowAccount, nowUserId, loginToken } = $store.getState()
  const [searchVal, setSearchVal] = useState<string>('')
  //   工作报告列表数据
  const [reportListData, setReportListData] = useState<Array<ReportListData>>([])

  // 刷新列表
  const refreshReportList = useSelector((store: StoreStates) => store.refreshReportList)

  const [reportListTypeFilter, setReportListTypeFilter] = useState<any>([])
  const [visibleFilter, setVisibleFilter] = useState(false)
  const [activeClass, setActiveClass] = useState(-2)
  // 设置已读未读选中状态
  const [isReadClass, setIsReadClass] = useState(-2)
  // 详情
  const [visibleDetails, setVisibleDetails] = useState(false)

  const [loading, setLoading] = useState(false)
  // 0 我收到的 1我发出的
  const [listType, setListType] = useState<number>(0)

  //群聊列表
  const [roomList, setRoomList] = useState<any>([])
  //切换加载列表类型 1.工作报告false 2.任务汇报true 3.OKR进展  -
  const [differentType, setDifferentType] = useState(1)
  // 设置弹窗
  const [setList, setListPop] = useState(false)

  const [windowHeight, setWindowHeight] = useState(0)

  const [typeId, setTypeId] = useState<number>(0)

  const [pagination, setPagination] = useState({
    pageNo: 1,
    pageSize: 10,
    total: 0,
  })
  const spanparam = useRef(null)

  // 工作列表筛选
  const [reportFilterParam, setReportFilterParam] = useState({
    userId: nowUserId,
    type: listType, //查询类型 0收到的 1发出的
    startTime: '',
    endTime: '',
    keywords: '',
    pageNum: pagination.pageNo,
    pageSize: pagination.pageSize,
    userRead: -1, //查询状态 -1所有 0未读 1已读
    workReportType: -1, //汇报类型 -1所有 0日报 1周报 2月报 3季报 4年报
    templateId: '',
  })

  const [reporterModalVisible, setReporterModalVisible] = useState(false)
  const [state, setState] = useState({
    workReportAuth: true,
    taskReportAuth: true,
    okrReportAuth: true,
  })
  const dateFormat = 'YYYY/MM/DD'

  //打开模态框请求接口
  useEffect(() => {
    console.log(refreshReportList)
    if (refreshReportList && listType == 0) {
      // 不刷我收到的
      $store.dispatch({ type: 'REFRESH_REPORT_LIST', data: false })
    }
    if (visible || (refreshReportList && visible)) {
      refreshReportList ? $store.dispatch({ type: 'REFRESH_REPORT_LIST', data: false }) : ''
      queryWorkReportPage(pagination)
      findWorkReportListByTeamId()
      // setVisibleFilter(false)
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
  }, [pagination.pageNo, pagination.pageSize, listType, reportFilterParam, refreshReportList])

  useEffect(() => {
    const navAuths: any = []
    // 沟通展示权限
    const workReportAuth = getFunsAuth({ name: 'WORK_REPORT' })
    const taskReportAuth = getFunsAuth({ name: 'TASK' })
    const okrReportAuth = getFunsAuth({ name: 'OKR' })
    if (workReportAuth) {
      navAuths.push(1)
    }
    if (taskReportAuth) {
      navAuths.push(2)
    }
    if (okrReportAuth) {
      navAuths.push(3)
    }
    setState({ ...state, workReportAuth, taskReportAuth, okrReportAuth })
    setDifferentType(navAuths[0] || 1)
  }, [])

  const getType = (prop: string) => {
    switch (prop) {
      case '日报':
        return <span className="report_type day_report"></span>
      case '周报':
        return <span className="report_type week_report"></span>
      case '月报':
        return <span className="report_type mon_report"></span>
      case '季报':
        return <span className="report_type qua_report"></span>
      case '年报':
        return <span className="report_type year_report"></span>
      default:
        return <span className="report_type ind_report"></span>
    }
  }
  // 表格类型查询
  const findWorkReportListByTeamId = () => {
    const param = {
      userId: nowUserId,
    }
    setLoading(true)
    $api
      .request('/team/report/config/findWorkReportListByTeamId', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const list = resData.data
        setReportListTypeFilter(list)
      })
      .catch(() => {
        console.log(param)
      })
  }
  const queryWorkReportPage = (pagination: any) => {
    setLoading(true)
    reportFilterParam.type = listType
    reportFilterParam.pageNum = pagination.pageNo
    reportFilterParam.pageSize = pagination.pageSize
    console.log('发送参数', reportFilterParam)
    $api
      .request('/team/queryWorkReportPage', reportFilterParam, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then(resData => {
        const list = resData.data.content
        setReportListData(list)
        //设置分页
        setPagination({
          pageNo: pagination.pageNo,
          pageSize: pagination.pageSize,
          total: resData.data.totalElements || 0,
        })
        // 更新侧边栏未读消息数量
        ipcRenderer.send('update_unread_msg', ['report_count'])
        setLoading(false)
      })
      .catch(() => {
        console.log('/team/queryWorkReportPage:', reportFilterParam)
      })
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: '220px',
      render: (_text: any, record: any) => {
        return (
          <div>
            <span className={`report_list_redDot_${record.id} ${record.redDot ? 'redDot' : 'whiteDot'}`}></span>
            {getType(record.typeName)}
            <span className="">{record.typeName}</span>
            <span className="">{record.phoneReportTime}</span>
          </div>
        )
      },
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: '400px',
      render: (_text: any, record: any) => {
        jQuery('.tableSpan').html(record.content)
        return (
          <div className="list_content_box">
            <div className="list_content">
              <span className="cont-tit">工作内容：</span>
              <span className="cont">{jQuery('.tableSpan').text()}</span>
            </div>
            {record.commentNum > 0 && <div className="commentNum">{record.commentNum}</div>}
          </div>
        )
      },
    },
    {
      title: '提交时间',
      dataIndex: 'time',
      key: 'time',
      width: '150px',
      render: (_text: any, record: any) => `${record.createTime}`,
    },
    {
      title: '汇报人',
      dataIndex: 'avatar',
      key: 'reportUser',
      width: '130px',
      render: (_text: any, record: any) => {
        return (
          <div className="reportUser-box">
            <Avatar src={record.profile} className="oa-avatar">
              {record.userName && record.userName.length > 2 ? record.userName.slice(-2) : record.userName}
            </Avatar>
            <span className="reportUser">
              {record.userName && record.userName.length > 3 ? record.userName.slice(-3) : record.userName}
            </span>
          </div>
        )
      },
    },
    {
      title: '所属组织',
      dataIndex: 'organization',
      key: 'organization',
      width: '150px',
      render: (_text: any, record: any) => `${record.belongName}`,
    },
  ]

  const reviceColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: '220px',
      render: (_text: any, record: any) => {
        return (
          <div>
            <span className={`report_list_redDot_${record.id} ${record.redDot ? 'redDot' : 'whiteDot'}`}></span>
            {getType(record.typeName)}
            <span className="">{record.typeName}</span>
            <span className="">{record.phoneReportTime}</span>
          </div>
        )
      },
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: '400px',
      render: (_text: any, record: any) => {
        jQuery('.tableSpan').html(record.content)
        return (
          <div className="list_content">
            <span className="cont-tit">工作内容：</span>
            {/* <span className="cont" dangerouslySetInnerHTML={{ __html: record.content }} ref={spanparam}></span> */}
            <span className="cont">{jQuery('.tableSpan').text()}</span>
            {record.commentNum > 0 && <div className="commentNum">{record.commentNum}</div>}
          </div>
        )
      },
    },
    {
      title: '提交时间',
      dataIndex: 'time',
      key: 'time',
      width: '150px',
      render: (_text: any, record: any) => `${record.createTime}`,
    },
    {
      title: '所属组织',
      dataIndex: 'organization',
      key: 'organization',
      width: '150px',
      render: (_text: any, record: any) => `${record.belongName}`,
    },
  ]

  /**
   * 列表显示附件填充
   */

  const GetFileImg = (fileSuffix: any, type: any) => {
    const fixType = type ? type : ''
    //统一图标前缀路径
    const fileImgPrefix = '../../common/image/task/total-process-manage/'
    //支持的格式
    const fileImgSupportArr = [
      'ppt',
      'docx',
      'xlsx',
      'pdf',
      'mp4',
      'mp3',
      'zip',
      'rar',
      'doc',
      'pptx',
      'xls',
      'jpg',
      'gif',
      'png',
      'txt',
    ]
    if (fileImgSupportArr.includes(fileSuffix)) {
      if (fileSuffix == 'ppt' || fileSuffix == 'pptx') {
        return fileImgPrefix + 'ppt' + fixType + '.png'
      } else if (fileSuffix == 'docx' || fileSuffix == 'doc') {
        return fileImgPrefix + 'docx' + fixType + '.png'
      } else if (fileSuffix == 'xlsx' || fileSuffix == 'xls') {
        return fileImgPrefix + 'xlsx' + fixType + '.png'
      } else if (fileSuffix == 'zip' || fileSuffix == 'rar') {
        return fileImgPrefix + 'zip' + fixType + '.png'
      } else if (fileSuffix == 'jpg' || fileSuffix == 'gif' || fileSuffix == 'png') {
        return fileImgPrefix + 'png' + fixType + '.png'
      } else {
        return fileImgPrefix + fileSuffix + fixType + '.png'
      }
    } else {
      return fileImgPrefix + 'normal' + fixType + '.png'
    }
  }

  const setReportParam = (type: number) => {
    setListType(type)
    setVisibleFilter(false)
    setPagination({
      ...pagination,
      pageNo: 1,
      pageSize: pagination.pageSize || 20,
    })
  }

  const stopVisibleIsRead = (e: any) => {
    e.stopPropagation()
  }

  // 提醒设置，5.20号已删除
  const setReport = () => {
    setListPop(true)
  }
  const setSettingVisible = (type: boolean) => {
    setListPop(type)
  }

  // 写报告
  const addReport = () => {
    $store.dispatch({
      type: 'WORKREPORT_TYPE',
      data: { wortReportType: 'create', wortReportTtime: Math.floor(Math.random() * Math.floor(1000)) },
    })
    $tools.createWindow('WorkReport')
  }

  // 重置筛选
  const resstFilter = () => {
    setReportFilterParam({
      userId: nowUserId,
      type: listType, //查询类型 0收到的 1发出的
      startTime: '',
      endTime: '',
      keywords: '',
      pageNum: pagination.pageNo,
      pageSize: pagination.pageSize,
      userRead: -1, //查询状态 -1所有 0未读 1已读
      workReportType: -1, //汇报类型 -1所有 0日报 1周报 2月报 3季报 4年报
      templateId: '',
    })
    setActiveClass(-2)
    setIsReadClass(-2)
  }
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
  // 筛选
  const filterInfo = (e: any) => {
    e.stopPropagation()
    setVisibleFilter(!visibleFilter)
    console.log('是否显示', visibleFilter)
  }
  // 搜索组织名称
  const changeInputVal = (e: any) => {
    e.stopPropagation()
    setSearchVal(e.target.value)
    setReportFilterParam({
      ...reportFilterParam,
      keywords: e.target.value,
    })
  }
  const searchOrg = (e: any) => {
    e.stopPropagation()
    setReportFilterParam({
      ...reportFilterParam,
      keywords: searchVal,
    })
  }
  const filterList = (e: any, tid: any, type: any) => {
    e.stopPropagation()
    setActiveClass(type)
    if (tid !== -1) {
      setReportFilterParam({
        ...reportFilterParam,
        templateId: tid[0],
        workReportType: tid[1],
      })
    } else {
      // 查所有
      setReportFilterParam({
        ...reportFilterParam,
        templateId: '',
        workReportType: -1,
      })
    }
  }
  const isUserRead = (e: any) => {
    e.stopPropagation()
    setIsReadClass(e.target.value)
    setReportFilterParam({
      ...reportFilterParam,
      userRead: e.target.value,
    })
  }
  const timePickerChange = (_dates: any, dateStrings: string[]) => {
    const sendVal = dateStrings[0] + '-' + dateStrings[1]
    // changeData(formType, sendVal)
    setReportFilterParam({
      ...reportFilterParam,
      startTime: dateStrings[0] + ' 00:00',
      endTime: dateStrings[1] + ' 23:59',
    })
  }

  /**
   * 切换复选框状态
   * @param e
   */
  const onChangeCheck = (e: any, selItem: any) => {
    for (const i in roomList) {
      if (roomList[i].id == selItem.id) {
        roomList[i].checked = e.target.checked
        break
      }
    }
    setRoomList([...roomList])
  }

  const setMyReporter = () => {
    setReporterModalVisible(true)
  }

  const NavMenu = () => {
    /**
     * 切换列表类型
     *
     */
    const setReportType = (val: number) => {
      setDifferentType(val)
    }
    return (
      <div className="report_type">
        {state.workReportAuth && (
          <div
            className={`work_report ${differentType == 1 ? 'active' : ''}`}
            onClick={() => {
              setReportType(1)
            }}
          >
            工作报告
          </div>
        )}
        {state.taskReportAuth && (
          <div
            className={`task_report ${differentType == 2 ? 'active' : ''}`}
            onClick={() => {
              setReportType(2)
            }}
          >
            任务汇报
          </div>
        )}
        {state.okrReportAuth && (
          <div
            className={`okr_report ${differentType == 3 ? 'active' : ''}`}
            onClick={() => {
              setReportType(3)
            }}
          >
            OKR进展
          </div>
        )}
      </div>
    )
  }
  return (
    <>
      <Modal
        title={<NavMenu />}
        visible={visible}
        onCancel={onHideModal}
        footer={null}
        // maskClosable={false}
        keyboard={false}
        className="report-modal-content-box"
      >
        <div
          className="report-modal-cont-box"
          ref={() => {
            initEvent()
          }}
        >
          {differentType == 3 && <ShowOkrContent visible={differentType} />}
          {differentType == 2 && <ShowTaskContent visible={differentType} />}
          {differentType == 1 && (
            <>
              <div className="menu_tab">
                <Radio.Group className="reportListTypeBox">
                  <Radio.Button
                    className={listType == 0 ? 'active' : ''}
                    value="0"
                    onClick={() => setReportParam(0)}
                  >
                    我收到的
                  </Radio.Button>
                  <Radio.Button
                    className={listType == 1 ? 'active' : ''}
                    value="1"
                    onClick={() => setReportParam(1)}
                  >
                    我发起的
                  </Radio.Button>
                </Radio.Group>
                <Radio.Group className="reportListSetBox">
                  <Radio.Button value="1" onClick={addReport} className="writeBtn">
                    写报告
                  </Radio.Button>
                  <Radio.Button
                    className="filterBtn"
                    value="2"
                    onClick={e => {
                      filterInfo(e)
                    }}
                  >
                    筛选
                  </Radio.Button>
                  <Radio.Button value="0" onClick={setMyReporter} className="setBtn">
                    汇报对象设置
                  </Radio.Button>
                </Radio.Group>
              </div>
              <div className="list_box">
                <span style={{ display: 'none' }} className="tableSpan"></span>
                <Table
                  className="tableContent list_table"
                  tableLayout={'auto'}
                  dataSource={reportListData}
                  locale={{ emptyText: <NoneData /> }}
                  rowKey={record => record.id}
                  loading={loading}
                  columns={Number(listType) === 1 ? reviceColumns : columns}
                  pagination={{
                    ...pagination,
                    position: ['bottomCenter'],
                    pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
                    current: pagination.pageNo,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                      setPagination({ ...pagination, pageNo: page, pageSize: pageSize || 10 })
                      setReportFilterParam({
                        ...reportFilterParam,
                        pageNum: page,
                        pageSize: pageSize || 10,
                      })
                    },
                    onShowSizeChange: (current, size) => {
                      setPagination({ ...pagination, pageNo: current - 1, pageSize: size })
                    },
                  }}
                  scroll={{ y: windowHeight - 276 }}
                  showHeader={!reportListData || reportListData.length !== 0}
                  onRow={record => {
                    return {
                      onClick: event => {
                        event.preventDefault()
                        setTypeId(record.id)
                        setVisibleDetails(true)
                        $(`.report_list_redDot_${record.id}`)
                          .addClass('whiteDot')
                          .removeClass('redDot')
                        // 更新侧边栏未读消息数量
                        ipcRenderer.send('update_unread_msg', ['report_count'])
                        $store.dispatch({
                          type: 'WORK_REPORT_LIST_COMMENT',
                          data: {
                            workRpoertListCommRootId: '',
                            workRpoertListCommParentId: '',
                            workRpoertListCommName: '',
                            workRpoertListIsThum: false,
                            workRpoertListCommUserId: '',
                          },
                        })
                      }, // 点击行
                    }
                  }}
                />
              </div>
            </>
          )}
          {visibleFilter && differentType == 1 && (
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
                    type="text"
                    placeholder="搜索组织名称"
                    name=""
                    className="searchVal filterSearchVal"
                    value={reportFilterParam.keywords}
                  />
                </div>
                <div className="filterLine"></div>
                <span className="filterTitle">类型:</span>
                <section className="filtersItem">
                  {/* <div className="filters-item-tit">
                    <span>按类型筛选</span>
                  </div> */}
                  <div className="filters-item-con">
                    <div className="filters-item-in">
                      <div className="filter-status">
                        <ul className="filter-status-small">
                          <li
                            className={activeClass === -1 ? 'active' : ''}
                            onClick={() => {
                              filterList(event, -1, -1)
                            }}
                          >
                            所有
                          </li>
                          {Object.keys(reportListTypeFilter).map((val, key) => {
                            return (
                              <li
                                className={activeClass === key ? 'active' : ''}
                                key={key}
                                data-tempid={reportListTypeFilter[val]}
                                onClick={() => {
                                  filterList(event, reportListTypeFilter[val], key)
                                }}
                              >
                                {val}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
                {listType === 0 && (
                  <>
                    <div className="filterLine"></div>
                    <span className="filterTitle">状态:</span>
                    <section className="filtersItem">
                      {/* <div className="filters-item-tit">
                      <span>按状态筛选</span>
                    </div> */}
                      <div className="filters-item-con">
                        <div className="filters-item-in">
                          <ul className="filter-status-classify">
                            <li
                              className={isReadClass === 0 ? 'isReadActive' : ''}
                              value="0"
                              onClick={isUserRead}
                            >
                              未读
                            </li>
                            <li
                              className={isReadClass === 1 ? 'isReadActive' : ''}
                              value="1"
                              onClick={isUserRead}
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
                          reportFilterParam.startTime == ''
                            ? null
                            : [
                                moment(reportFilterParam.startTime, dateFormat),
                                moment(reportFilterParam.endTime, dateFormat),
                              ]
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
        </div>
      </Modal>
      {visibleDetails && differentType == 1 && (
        <ReportDetails
          param={{ reportId: typeId, isVisible: visibleDetails }}
          setvisible={(state: any) => {
            setVisibleDetails(state)
          }}
        />
      )}
      {differentType == 1 && setList && (
        <ReportListSetting setSettingVisible={setSettingVisible} visibleType={setList} />
      )}
      {reporterModalVisible && (
        <ReporterSettiing
          visible={reporterModalVisible}
          onCancel={() => {
            setReporterModalVisible(false)
          }}
        />
      )}
    </>
  )
}

export default ReportList

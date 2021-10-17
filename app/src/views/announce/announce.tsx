import React, { useState, useEffect, useReducer, Fragment } from 'react'
import { Table, DatePicker, Input, Button, Modal, Switch, message, Card, Tooltip, Collapse } from 'antd'
import moment from 'moment'
import { useSelector } from 'react-redux'
import { ExclamationCircleOutlined, CaretRightOutlined } from '@ant-design/icons'
import AddModal from './addModal'
import NoneData from '@/src/components/none-data/none-data'
import NoticeDetails from '@/src/components/notice-details/index'
import { getNoticeTypelist, getNoticeList, getNoticeById, changeDiscussType, noticeHandel } from './actions'
import { ColumnsWithAll, ColumnsWithTeam, isUnRead } from './fields'
import { DetailsItemProps } from './addModal'
import './announce.less'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import { ipcRenderer } from 'electron'

interface CompanyListProps {
  id: number
  name: string
  groupList: GroupListProps[]
}

interface GroupListProps {
  id: number
  name: string
  operate: number
}

const { RangePicker } = DatePicker
const { Search } = Input
const { Panel } = Collapse
const { confirm } = Modal

const initStates = {
  companyList: [],
  editNoticeData: '',
}

const reducer = (state = initStates, action: { type: any; data: any }) => {
  switch (action.type) {
    // 公告类型列表
    case 'NOTICE_TYPE_LIST':
      return { ...state, companyList: action.data }
    // 公告详情数据
    case 'NOTICE_DETAILS':
      return { ...state, editNoticeData: action.data }
    default:
      return state
  }
}

const NoticeComponent = () => {
  const [windowHeight, setWindowHeight] = useState(0)
  // loading 状态
  const [tableLoading, setTableLoading] = useState(false)
  // 表格查询的数据
  const initQueryParams = {
    pageNo: 0,
    pageSize: 10,
    startTime: '',
    endTime: '',
    keyword: '',
    groupId: '',
    ascriptionId: '',
  }

  // 请求数据
  const [state, dispatch] = useReducer(reducer, initStates)
  const { companyList, editNoticeData } = state
  const { nowUserId, nowAccount } = $store.getState()
  // 公告类别查询参数
  const queryParams = useSelector((state: any) => state.queryParams)
  // 公告列表数据
  const noticeTableList = useSelector((state: any) => state.noticeTableList)
  // 添加模态框的显隐
  const [addModalVisble, setAddModalVisble] = useState(false)
  // 公告详情模态框
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  // 展开菜单id的集合
  const [openKeys, setOpenKeys] = useState<string[]>([])
  // 可操作的权限状态
  const [operate, setOperateType] = useState(0)
  const [animation, setAnimation] = useState<string>('')
  //按钮loading
  const [btnloading, setBtnloading] = useState(false)

  //公告撤回删除type 1删除 0撤回
  function handelTool(id: number | string, type: number) {
    confirm({
      className: 'notice_modal_confirm',
      title: '操作提示',
      icon: <ExclamationCircleOutlined />,
      content: type === 0 ? '确定撤回该公告？' : '删除后不可恢复，确定要删除该公告吗？',
      onOk() {
        setTableLoading(true)
        const requestUrl = type === 0 ? '/team/notice/recallById' : '/team/notice/removeById'
        const msgTips = type === 0 ? '撤回' : '删除'
        noticeHandel(id, requestUrl)
          .then(() => {
            message.success(`${msgTips}公告成功!`)
            setTableLoading(false)
            getNotice()
          })
          .catch(() => {
            message.error(`${msgTips}公告失败!`)
            setTableLoading(false)
          })
      },
    })
  }

  // 发布公告成功
  function publishSuccess() {
    //隐藏添加模态框
    setAddModalVisble(false)
    getNotice()
  }

  // 公告编辑
  function handleEdit(id: number) {
    setTableLoading(true)
    getNoticeById({ id, userId: nowUserId, edit: 1 }).then((res: any) => {
      dispatch({
        type: 'NOTICE_DETAILS',
        data: { ...res },
      })
      //显示添加模态框
      ipcRenderer.send('close_addModal_window')
      $store.dispatch({
        type: 'ADD_MODAL_MSG',
        data: {
          companyId: ascriptionId, //企业id,
          groupId: groupId, //分组id
          enterpriseList: companyList,
          editNoticeData: res,
        },
      })
      $tools.createWindow('AddModalWin').finally(() => {
        setTableLoading(false)
      })
    })
  }

  // 讨论开关切换
  function discussIsOpen(checked: boolean, id: number) {
    changeDiscussType({ id }).then((res: any) => {
      if (!res.returnCode) {
        message.success(!checked ? '关闭讨论成功' : '开启讨论成功')
        getNotice()
      }
    })
  }

  // 根据姓名查询公告
  function onSearch(keyword: string) {
    $store.dispatch({
      type: 'QUERY_PARAMS',
      data: {
        ...queryParams,
        pageNo: 0,
        keyword,
      },
    })
  }

  // 根据日期查询公告
  function dateChange(dates: any, dateStrings: [string, string]) {
    const startTime = dates ? `${dateStrings[0]} 00:00` : ''
    const endTime = dates ? `${dateStrings[1]} 23:59` : ''
    $store.dispatch({
      type: 'QUERY_PARAMS',
      data: {
        ...queryParams,
        pageNo: 0,
        startTime,
        endTime,
      },
    })
  }

  // 选中公司
  const collapseChange = (key: any, groupList: any[]) => {
    setOpenKeys(key)
    // 菜单收拢时
    if (key.length < openKeys.length) {
      return
    }
    // 菜单展开时
    const result = key.concat(openKeys).filter(function(item: any, i: number, arr: any) {
      return arr.indexOf(item) == arr.lastIndexOf(item)
    })
    if (result) {
      //设置当前选中的公司ascriptionId, 未选中分组groupId为空 查询企业下所有公告
      $store.dispatch({
        type: 'QUERY_PARAMS',
        data: { ...initQueryParams, groupId: '', ascriptionId: result[0] },
      })
    }
    // 当前企业下可操作的权限
    // const operateList = groupList.find((item: any) => {
    //   return item.operate === 1
    // })
    // if (operateList) {
    //   setOperateType(operateList.operate)
    // } else {
    //   setOperateType(0)
    // }
  }

  // 选中公告类型
  const panelItemClick = (ascriptionId: number, groupId: number, operate: number) => {
    // 设置可操作的权限
    // setOperateType(operate)
    // 设置当前选中的类型groupId  当前类型的企业ascriptionId
    $store.dispatch({ type: 'QUERY_PARAMS', data: { ...initQueryParams, groupId, ascriptionId } })
  }

  // 查看公告详情
  const readDetails = (record: DetailsItemProps) => {
    const { id, type, isRead } = record
    if (isUnRead(type, isRead)) {
      ipcRenderer.send('update_notice_count')
    }
    // 打开详情模态框
    setDetailModalVisible(true)
    // 保存当前公告的id
    $store.dispatch({
      type: 'NOTICE_DETAILS',
      data: {
        source: 'noticeList',
        noticeId: id,
        noticeType: 'rule',
      },
    })
  }

  function getNotice() {
    setTableLoading(true)
    const value = {
      ...queryParams,
      type: -1,
      userId: nowUserId,
      account: nowAccount,
    }
    getNoticeList(value)
      .then((res: any) => {
        if (!res.returnCode) {
          $store.dispatch({ type: 'NOTICE_LIST', data: res.data })
        }
      })
      .finally(() => {
        setTableLoading(false)
      })
  }

  useEffect(() => {
    getNotice()
  }, [queryParams])

  useEffect(() => {
    // 查询公司、公告类型列表
    getNoticeTypelist({
      userId: nowUserId,
    }).then((res: any) => {
      if (!res.returnCode) {
        const data = res.dataList
        data.map((item: CompanyListProps) => {
          item.groupList.map((target: GroupListProps) => {
            if (target.operate === 1) {
              setOperateType(1)
            }
          })
        })
        dispatch({ type: 'NOTICE_TYPE_LIST', data })
      }
    })

    ipcRenderer.removeAllListeners('refresh_publish_success').on('refresh_publish_success', (event, args) => {
      // const isCreateModal = !!args[0] ? false : true
      // if (!isCreateModal) {
      // getNotice()
      //关掉窗口
      // }
      getNotice()
      // publishSuccess()
    })
    $tools.windowsInit(['AddModalWin'])
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

  const { totalElements, content } = noticeTableList
  const { pageNo, pageSize, startTime, endTime, groupId, ascriptionId } = queryParams

  const oprateColum = {
    title: '操作',
    key: 'operation',
    width: 160,
    render: (_: any, { id, userId, operate, type, discuss }: any) =>
      userId == nowUserId &&
      operate == 1 && (
        <div className="operateArea">
          {type != 0 ? (
            ''
          ) : (
            <Tooltip placement="topLeft" title="编辑" arrowPointAtCenter>
              <span
                className="operateIcon edit"
                onClick={(e: any) => {
                  e.stopPropagation()
                  handleEdit(id)
                }}
              ></span>
            </Tooltip>
          )}
          {type == 0 ? (
            ''
          ) : (
            <Tooltip placement="topLeft" title="撤回" arrowPointAtCenter>
              <span
                className="operateIcon recall"
                onClick={(e: any) => {
                  e.stopPropagation()
                  handelTool(id, 0)
                }}
              ></span>
            </Tooltip>
          )}
          <Tooltip placement="topLeft" title="删除" arrowPointAtCenter>
            <span
              className="operateIcon delete"
              onClick={(e: any) => {
                e.stopPropagation()
                handelTool(id, 1)
              }}
            ></span>
          </Tooltip>
          {type == 3 && (
            <Tooltip placement="topLeft" title={discuss ? '开启讨论' : '关闭讨论'} arrowPointAtCenter>
              <Switch
                size="small"
                checked={discuss === 1 ? true : false}
                onChange={(checked: boolean, event: Event) => {
                  event.stopPropagation()
                  discussIsOpen(checked, id)
                }}
              />
            </Tooltip>
          )}
        </div>
      ),
  }
  const tableColumns = ascriptionId ? [...ColumnsWithTeam, oprateColum] : [...ColumnsWithAll, oprateColum]
  return (
    <Fragment>
      <div className="announceContent flex ">
        <Card
          className={`leftContent ${animation}`}
          extra={
            <i
              className="org_fold_icon close"
              onClick={() => {
                const className = animation === 'animation' ? 'animation1' : 'animation'
                setAnimation(className)
              }}
            ></i>
          }
          title="公告"
        >
          <div
            className={ascriptionId ? 'title' : 'title checkedPanel'}
            onClick={() => {
              $store.dispatch({
                type: 'QUERY_PARAMS',
                data: { ...initQueryParams },
              })
              companyList.map((item: CompanyListProps) => {
                item.groupList.map((target: GroupListProps) => {
                  if (target.operate === 1) {
                    setOperateType(1)
                  }
                })
              })
            }}
          >
            <span className="userIcon"></span>所有公告
          </div>
          {companyList.map((data: CompanyListProps) => {
            return (
              <Collapse
                activeKey={openKeys}
                expandIconPosition="right"
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                key={data.id}
                onChange={key => collapseChange(key, data.groupList)}
              >
                <Panel
                  header={
                    <span>
                      <span className="memuIcon"></span>
                      {data.name}
                    </span>
                  }
                  key={data.id}
                  className={
                    groupId && ascriptionId == data.id
                      ? 'checkedPanelParent'
                      : ascriptionId == data.id && !groupId
                      ? 'checkedCollapse'
                      : ''
                  }
                >
                  {data.groupList &&
                    data.groupList.map((item: GroupListProps) => {
                      return (
                        <p
                          key={item.id}
                          onClick={() => panelItemClick(data.id, item.id, item.operate)}
                          className={groupId === item.id ? 'checkedPanel' : ''}
                        >
                          {item.name}
                        </p>
                      )
                    })}
                </Panel>
              </Collapse>
            )
          })}
        </Card>

        <Card
          className="rightContent"
          title={
            animation === 'animation' ? (
              <span>
                <i
                  className="org_fold_icon open"
                  onClick={() => {
                    const className = animation === 'animation' ? 'animation1' : 'animation'
                    setAnimation(className)
                  }}
                ></i>
                我的公告
              </span>
            ) : (
              '我的公告'
            )
          }
          extra={
            operate ? (
              <Button
                style={{ borderRadius: '16px' }}
                loading={btnloading}
                type="primary"
                htmlType="submit"
                onClick={() => {
                  // 打开添加模态框
                  // setAddModalVisble(true)
                  setBtnloading(true)
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
                  $tools.createWindow('AddModalWin').finally(() => {
                    setBtnloading(false)
                  })
                  // 清空详情数据（点击查看详情、编辑后保存的数据）
                  dispatch({ type: 'NOTICE_DETAILS', data: '' })
                }}
              >
                发布公告
              </Button>
            ) : (
              ''
            )
          }
        >
          <div className="formArea">
            <Search
              className="search-input"
              placeholder="请输入关键字"
              // suffix={<img src={$tools.asAssetsPath('/images/common/search.png')} />}
              onSearch={(value: string) => onSearch(value)}
            />
            <RangePicker
              className="inputDate"
              suffixIcon={<img src={$tools.asAssetsPath('/images/annouce/date.svg')} />}
              // ranges={{
              //   Today: [moment(), moment()],
              //   'This Month': [moment().startOf('month'), moment().endOf('month')],
              // }}
              onChange={dateChange}
              format="YYYY/MM/DD"
              value={startTime ? [moment(startTime, 'YYYY-MM-DD'), moment(endTime, 'YYYY-MM-DD')] : null}
            />
          </div>

          <Table
            className="tableContent"
            tableLayout={'auto'}
            dataSource={content}
            locale={{ emptyText: <NoneData /> }}
            rowKey={record => record.id}
            loading={tableLoading}
            columns={tableColumns}
            pagination={{
              position: ['bottomCenter'],
              current: pageNo + 1,
              pageSize,
              pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
              total: totalElements,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (current, pageSize) => {
                $store.dispatch({
                  type: 'QUERY_PARAMS',
                  data: { ...queryParams, pageNo: current - 1, pageSize: pageSize || 10 },
                })
              },
              onShowSizeChange: (current, size) => {
                $store.dispatch({
                  type: 'QUERY_PARAMS',
                  data: { ...initQueryParams, pageNo: current - 1, pageSize: size },
                })
              },
            }}
            scroll={{ y: windowHeight - 274, x: '130%' }}
            showHeader={!content || content.length !== 0}
            onRow={record => {
              return {
                onClick: () => readDetails(record), // 点击行
              }
            }}
          />
        </Card>
      </div>

      {addModalVisble && (
        <AddModal
          companyId={ascriptionId}
          groupId={groupId}
          editNoticeData={editNoticeData}
          enterpriseList={companyList}
          hideAddModal={() => {
            setAddModalVisble(false)
          }}
          addModalVisble={addModalVisble}
          publishSuccess={publishSuccess}
        />
      )}

      {detailModalVisible && (
        <NoticeDetails
          showModal={(isVisible: boolean) => setDetailModalVisible(isVisible)}
          editNotice={(data: any) => {
            // setAddModalVisble(true)
            dispatch({
              type: 'NOTICE_DETAILS',
              data: data,
            })
            $store.dispatch({
              type: 'ADD_MODAL_MSG',
              data: {
                companyId: ascriptionId, //企业id,
                groupId: data.groupId, //分组id
                enterpriseList: companyList,
                editNoticeData: data,
              },
            })
            $tools.createWindow('AddModalWin')
          }}
        />
      )}
      <DownLoadFileFooter fromType="mainWin" />
    </Fragment>
  )
}

export default NoticeComponent

import React, { useEffect, useState } from 'react'
import { Tooltip, Table, Dropdown, Avatar, Tag, Input } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import $c from 'classnames'
import NoneData from '@/src/components/none-data/none-data'
import TaskListOpt from '@/src/views/workdesk/component/TaskListOpt'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import { getOrgProfileById } from '../../getData'
import { renderProgress } from '../WaitTask'
import { getDividerLine } from '../TaskList'

const { Search } = Input
interface ItemProps {
  id: number
  name: string
  ascriptionType: number
  ascriptionId: number
  ascriptionName: string
  status: number
  flag: number
  approvalStatus: number
  endTime: string
  level: number
  property: number
  cycleNum: number
  progress: { percent: number; color: number }
  subTaskCount: number
  type: number
  maxRole: number
  executorUser: number
  executorUsername: string
  profile: string
  today: boolean
  icon?: string
  distributeUser?: any
  planCount?: any
  assignName?: any
  reportCount?: any
  opinionCount?: any
  followNames?: any
  tagList?: any
}
const ForenTaskModal = ({ onClose }: { onClose: () => void }) => {
  const { selectTeamId, nowAccount, nowUserId, loginToken } = $store.getState()
  const [windowHeight, setWindowHeight] = useState(0)
  const orgId = selectTeamId == -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const [totalElements, setTotalElements] = useState(0)
  //表格loading
  const [loading] = useState(false)
  //任务详情框
  const [opentaskdetail, setOpentaskdetail] = useState(false)
  //任务ID
  const [freshPage, setFreshPage] = useState(false)
  //记录TASKID任务ID
  const [taskId, setTaskId] = useState(0)
  //任务数据
  const [listData, setListData] = useState([])
  const [searchParam, setSearchParam] = useState({
    viewType: 1,
    type: 2,
    pageNo: 0,
    pageSize: 10,
    keyword: '',
    listType: 12,
  })
  //右键参数信息
  const [btnParam, setBtnParam] = useState({
    rowObj: '',
    fromType: '',
    children: 0,
  })
  useEffect(() => {
    refreshPage()
  }, [searchParam, !freshPage])
  useEffect(() => {
    setWindowHeight(window.innerHeight)
    window.addEventListener('resize', function () {
      setWindowHeight(this.window.innerHeight)
    })
    return () => {
      window.removeEventListener('resize', function () {
        setWindowHeight(this.window.innerHeight)
      })
    }
  }, [])
  const refreshPage = () => {
    const queryparam = {
      ...searchParam,
      id: orgId,
      userId: nowUserId,
      loginUserId: nowUserId,
      account: nowAccount,
    }
    queryList(queryparam).then((data: any) => {
      console.log(data)
      const datas = data.data || []
      setTotalElements(datas.totalElements)
      setListData(datas.content)
    })
  }
  //查询列表
  const queryList = (params: any) => {
    return new Promise((resolve, reject) => {
      $api
        .request('/task/workbench', params, {
          headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        })
        .then(res => {
          resolve(res)
        })
    })
  }
  const setTagByStatus = (item: ItemProps) => {
    return (
      <div className="tag-list">
        {item.property === 1 && <Tag className="com-tag com-tag-m">密</Tag>}
        {item.status === 3 && <Tag className="com-tag com-tag-y">延</Tag>}
        {/* {item.approvalStatus !== 0 && <Tag className="com-tag com-tag-s">审</Tag>} */}
        {item.flag === 1 && <Tag className="com-tag com-tag-d">冻</Tag>}
        {item.flag === 3 && <Tag className="com-tag com-tag-g">归</Tag>}
        {item.cycleNum === 0 && <Tag className="com-tag com-tag-x">循</Tag>}
        {item.cycleNum > 0 && <Tag className="com-long-tag  com-tag-x">循 {item.cycleNum}</Tag>}
        {item.assignName && item.assignName && (
          <Tag color={'#E7E7E9'} className="com-long-tag ">
            由{item.assignName}指派
          </Tag>
        )}
        {item.reportCount && item.reportCount != 0 && (
          <Tag color={'#E7E7E9'} className="com-long-tag ">
            汇报:{item.reportCount}
          </Tag>
        )}
        {item.opinionCount && item.opinionCount !== 0 && (
          <Tag color={'#E7E7E9'} className="com-long-tag ">
            备注:{item.opinionCount}
          </Tag>
        )}
        {item.today === true && (
          <Tag icon={<img src={$tools.asAssetsPath('/images/common/today_task.png')} />}></Tag>
        )}
      </div>
    )
  }
  const setRowEvent = (record: any) => {
    return {
      onContextMenu: (event: any) => {
        event.stopPropagation()
        //右键改为Table本身提供的组件进行控制
        setBtnParam({
          rowObj: record,
          fromType: 'desk-working_team_task',
          children: record.children || [],
        })
      },
    }
  }
  return (
    <div className="foren_task_modal">
      <div className="foren_task_modal_header">
        <span className="f_title">
          冻结任务<span style={{ marginLeft: '12px' }}>({totalElements})</span>
        </span>
        <CloseOutlined className="close_icon" onClick={() => onClose()} />
      </div>
      <div className="search_box">
        <span style={{ marginRight: '15px' }}>已冻结:{totalElements}</span>
        <span>
          <Search
            placeholder="可搜索任务名称"
            onSearch={value =>
              setSearchParam({
                ...searchParam,
                pageNo: 0,
                pageSize: 10,
                keyword: value,
              })
            }
            style={{ width: 200 }}
          />
        </span>
      </div>
      <div className="foren_table_list">
        {listData.length !== 0 && (
          <Table
            className="foren_task_table"
            columns={[
              {
                render: (record: ItemProps) => {
                  const followers = record.followNames || []
                  return (
                    <Dropdown
                      overlay={<TaskListOpt taskOptData={btnParam} callback={() => refreshPage()} />}
                      trigger={['contextMenu']}
                    >
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between' }}
                        className="ant_table_item"
                        onClick={(event: any) => {
                          event.stopPropagation()
                          setOpentaskdetail(true)
                          setTaskId(record.id)
                        }}
                      >
                        <div className={$c('ant_table_l', { finishedTask: record.status == 2 })}>
                          {!selectTeamId && (
                            <Avatar
                              size={32}
                              src={getOrgProfileById(record.ascriptionId)}
                              style={{ marginRight: 10 }}
                            ></Avatar>
                          )}
                          {record.icon && (
                            <img
                              className="boardTaskLabel"
                              src={$tools.asAssetsPath(`/images/task/${record.icon}.png`)}
                            />
                          )}
                          <div className="padr4">{record.name}</div>
                          <div className="tag-list">
                            <Tooltip title={`${record.distributeUser}派发的任务`}>
                              <span
                                className={$c({
                                  taskMiddlpai: record.distributeUser != null,
                                  noneTaskMiddleLabel: record.distributeUser == null,
                                })}
                              ></span>
                            </Tooltip>
                            {setTagByStatus(record)}
                          </div>
                          {record.tagList && record.tagList.length !== 0 && (
                            <div className="com-tag-content">
                              {record.tagList.map((item: any, index: number) => (
                                <span key={index} className="com-list-tag">
                                  {item.content}
                                  {getDividerLine(index, record.tagList?.length)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>{renderProgress(record.progress, 'circle')}</div>
                        {followers.length > 0 && (
                          <Tooltip title={`关注：${followers.join('、')}`}>
                            <i
                              className="attentionIcon"
                              style={{
                                top: '5px',
                                left: '3px',
                              }}
                            ></i>
                          </Tooltip>
                        )}
                      </div>
                    </Dropdown>
                  )
                },
              },
            ]}
            tableLayout={'auto'}
            dataSource={listData}
            rowKey={(record: any) => record.id}
            loading={loading}
            scroll={{ y: windowHeight - 340 }}
            onRow={setRowEvent}
            showHeader={false}
            pagination={{
              position: ['bottomCenter'],
              current: searchParam.pageNo + 1,
              pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
              total: totalElements,
              showSizeChanger: true,
              onChange: (current, pageSize) => {
                setSearchParam({
                  ...searchParam,
                  pageNo: current - 1,
                  pageSize: pageSize || 10,
                })
              },
              onShowSizeChange: (current, size) => {
                setSearchParam({
                  ...searchParam,
                  pageNo: current - 1,
                  pageSize: size,
                })
              },
            }}
          />
        )}
        {listData.length == 0 && (
          <NoneData imgSrc={$tools.asAssetsPath('/images/common/none_img_icon_4.svg')} />
        )}
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
    </div>
  )
}
export default ForenTaskModal

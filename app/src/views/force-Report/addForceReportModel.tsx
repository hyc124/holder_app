import React, { useEffect, useState } from 'react'
import { Table, Avatar, Space, Modal, Spin, Radio, Input } from 'antd'
import { findRelationTask, addRelationTask, cancelRelationTask } from './component/getData'
import './create-force-Report.less'
interface AddTaskData {
  taskId: number
  taskName: string
  status: number
  executeTime: null
  startTime: null
  endTime: string
  percent: number
  flag: number
  executeUserId: number
  executeUsername: string
  liableUserId: number
  liableUsername: string
}
const { Search } = Input
const AddForceReportModel = (props: any) => {
  const [pagination, setPagination] = useState({
    pageNo: 1,
    pageSize: 20,
    total: 0,
  })
  const [queryTableList, seQueryTableList] = useState({ status: 0, keyword: '' })
  const [tableList, seTableList] = useState<AddTaskData[]>([])
  const [loading, seloading] = useState(false)
  useEffect(() => {
    if (props.visible) {
      findtableList('init')
    }
  }, [props.param])
  const addTaskList = (id: number) => {
    addRelationTask(id).then((res: any) => { })
  }
  const findtableList = (type?: string) => {
    const saveparam = {
      ...queryTableList,
      pageNo: pagination.pageNo - 1,
      enterpriseIds: [],
      pageSize: 20,
    }
    if (type) {
      saveparam.pageNo = 0
    }
    findRelationTask(saveparam).then((res: any) => {
      setPagination({ ...pagination, total: res.data.totalElements })
      seTableList(res.data.content)
    })
  }
  const columns = [
    {
      title: 'Avater',
      dataIndex: 'executeUsername',
      key: 'executeUsername',
      width: '36px',
      render: (_text: any, item: any) => {
        return (
          <Avatar src={item.profile} className="oa-avatar">
            {item.executeUsername && item.executeUsername.length > 2
              ? item.executeUsername.slice(-2)
              : item.executeUsername}
          </Avatar>
        )
      },
      ellipsis: true,
    },
    {
      title: 'Name',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (_text: any, item: any) => {
        return (
          <div className="flex center-v text-ellipsis">
            <div className="force-list-content flex column center-h">
              <p className="force_tit">{item.taskName}</p>
              <p className="force_tip">
                <span className="late">
                  <span className="notStart">未开始</span>
                </span>
                {item.startTime && item.endTime && (
                  <span className="time">{item.startTime + '——' + item.endTime}</span>
                )}
              </p>
            </div>
          </div>
        )
      },
      ellipsis: true,
    },

    {
      title: 'Action',
      key: 'action',
      width: '70px',
      render: (text: AddTaskData) => (
        <Space size="middle">
          {queryTableList.status == 0 && (
            <a
              className="toRelation"
              onClick={() => {
                addRelationTask(text.taskId).then((res: any) => {
                  let nameList: AddTaskData[] = []
                  nameList = tableList.filter(item => item.taskId != text.taskId)
                  seTableList(nameList)
                  props.optQuery('save')
                })
              }}
            >
              <i></i>添加
            </a>
          )}
          {queryTableList.status == 1 && (
            <a
              className="toRelation_red"
              onClick={() => {
                cancelRelationTask(text.taskId).then((res: any) => {
                  let nameList: AddTaskData[] = []
                  nameList = tableList.filter(item => item.taskId != text.taskId)
                  seTableList(nameList)
                  props.optQuery('cancel')
                })
              }}
            >
              取消添加
            </a>
          )}
        </Space>
      ),
    },
  ]
  const handleCancel = () => {
    props.setVisible(false)
  }
  return (
    <Modal
      title="关联任务"
      visible={props.visible}
      onCancel={handleCancel}
      maskClosable={false}
      keyboard={false}
      className="taskRelationModel"
      footer={null}
      confirmLoading={true}
      width={1024}
    >
      <div className="taskRelationSelect flex space_between">
        <Radio.Group className="taskRelationType" defaultValue={0}>
          <Radio.Button
            className={queryTableList.status == 0 ? 'active' : ''}
            value="0"
            onClick={() => {
              queryTableList.status = 0
              setPagination({ ...pagination, pageNo: 1 })
              seQueryTableList({ ...queryTableList })
              findtableList()
            }}
          >
            未添加
          </Radio.Button>
          <Radio.Button
            className={queryTableList.status == 1 ? 'active' : ''}
            value="1"
            onClick={() => {
              queryTableList.status = 1
              setPagination({ ...pagination, pageNo: 1 })
              seQueryTableList({ ...queryTableList })
              findtableList('page')
            }}
          >
            已添加
          </Radio.Button>
        </Radio.Group>
        <Search
          placeholder="任务名称"
          onSearch={(value: any) => {
            queryTableList.keyword = value
            findtableList('page')
          }}
          style={{ width: 180 }}
        />
      </div>
      <div className="force_list_box">
        <Table
          showHeader={false}
          columns={columns}
          dataSource={tableList}
          loading={loading}
          rowKey={record => record.taskId}
          pagination={{
            ...pagination,
            position: ['bottomCenter'],
            current: pagination.pageNo,
            showSizeChanger: false,
            onChange: page => {
              pagination.pageNo = page
              setPagination({ ...pagination })
              findtableList()
            },
          }}
        />
      </div>
    </Modal>
  )
}
export default AddForceReportModel

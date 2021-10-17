import React, { useEffect, useState } from 'react'
import { DatePicker, Table, message, Modal } from 'antd'
import moment from 'moment'
import NoneData from '@/src/components/none-data/none-data'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface LogProps {
  time: string
  system: string
  address: string
  id: number
}

function LoginLog() {
  const { loginToken, nowAccount } = $store.getState()
  // loading
  const [tableLoading, setTableLoading] = useState(false)
  // 请求的分页数据
  const [tableData, setTableData] = useState({
    totalElements: 0,
    totalPages: 0,
    content: [],
  })
  // 初始化查询参数   listType分类：我申请的 | 我审批的
  const initData = {
    page: 0,
    pageSize: 10,
    startTime: moment()
      .subtract('days', 6)
      .format('YYYY/MM/DD 00:00'),
    endTime: moment().format('YYYY/MM/DD 23:59'),
  }
  const [searchData, setSearchData] = useState(initData)

  // 日期选择改变的回调
  const dateChange = (dates: any, dateStrings: [string, string]) => {
    const startTime = dates ? `${dateStrings[0]} 00:00` : ''
    const endTime = dates ? `${dateStrings[1]} 23:59` : ''
    setSearchData({
      ...searchData,
      page: 0,
      startTime,
      endTime,
    })
  }

  // 删除全部
  function deleteAll() {
    Modal.confirm({
      title: '操作提示',
      width: 400,
      centered: true,
      className: 'confirmModal',
      icon: <ExclamationCircleOutlined />,
      content: '确认删除所有登录轨迹信息？',
      onOk() {
        setTableLoading(true)
        $mainApi
          .request(
            '/loginPath/deleteLoginPath',
            { account: nowAccount },
            { headers: { loginToken: loginToken }, formData: true }
          )
          .then(
            () => {
              setTableLoading(false)
              setSearchData(initData)
            },
            res => {
              setTableLoading(false)
              message.error(res.returnMessage)
            }
          )
      },
    })
  }

  // 请求列表数据
  const getList = () => {
    const params = {
      username: nowAccount,
      ...searchData,
    }
    setTableLoading(true)
    $mainApi
      .request('/loginPath/find', params, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(res => {
        setTableLoading(false)
        console.log(res)
        setTableData(res.data)
      })
      .catch(function(res) {
        setTableLoading(false)
        message.error(res.returnMessage)
      })
  }

  useEffect(() => {
    getList()
  }, [searchData])

  const { totalElements, content } = tableData
  const { page, pageSize, startTime, endTime } = searchData

  const columns: any[] = [
    {
      title: '认证方式',
      dataIndex: 'type',
      key: 'type',
      align: 'left',
      width: 260,
      render: (text: number) => {
        return text === 0 ? '账密登录' : '扫码登录'
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      align: 'left',
      render: (text: any, record: any) => {
        const { time, system, address } = record
        return (
          <div>
            你的账户于<span style={{ color: '#7CC1FE' }}>&nbsp;{time}&nbsp;</span>通过
            <span style={{ color: '#7CC1FE' }}>&nbsp;{address}&nbsp;</span>登录
            <span style={{ color: '#7CC1FE' }}>&nbsp;{system}&nbsp;</span>
          </div>
        )
      },
    },
  ]

  return (
    <div className="loginPath h100 flex column">
      <div className="formArea">
        <div>
          <DatePicker.RangePicker
            allowClear={false}
            suffixIcon={<img src={$tools.asAssetsPath('/images/annouce/date.svg')} />}
            onChange={dateChange}
            format="YYYY/MM/DD"
            value={startTime ? [moment(startTime, 'YYYY-MM-DD'), moment(endTime, 'YYYY-MM-DD')] : null}
          />
          <span>共计{totalElements}条</span>
        </div>
        {totalElements > 0 && (
          <div className="deleteAll" onClick={deleteAll}>
            删除全部
          </div>
        )}
      </div>

      <Table
        className="tableContent flex-1"
        dataSource={content}
        locale={{ emptyText: <NoneData showTxt="当前还没有登录轨迹哦" /> }}
        rowKey={(record: LogProps) => moment(record.time).valueOf()}
        loading={tableLoading}
        columns={columns}
        scroll={{ y: 'calc(100% - 104px)' }}
        pagination={{
          position: ['bottomCenter'],
          current: page + 1,
          pageSize,
          pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
          total: totalElements,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (current, pageSize) => {
            setSearchData({ ...searchData, page: current - 1, pageSize: pageSize || 10 })
          },
          onShowSizeChange: (current, size) => {
            setSearchData({ ...initData, page: current - 1, pageSize: size })
          },
        }}
        showHeader={!content || content.length !== 0}
      />
    </div>
  )
}

export default LoginLog

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Radio, DatePicker, Input, Table, message, Modal } from 'antd'
import moment from 'moment'
import NoneData from '@/src/components/none-data/none-data'
import { applyColumns, approvalColumns } from './fields'

interface TableItem {
  id: number
  addPermissions: string
  delPermissions: string
  grantTime: string
  grantType: number
}

interface TableProps {
  totalElements: number
  totalPages: number
  content: TableItem[]
}

function ApplyRecord() {
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  const { loginToken, nowUserId, nowAccount, nowUser } = $store.getState()
  const [windowHeight, setWindowHeight] = useState(0)
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
    pageSize: 20,
    startTime: '',
    endTime: '',
    keyword: '',
    listType: 1,
  }
  const [searchData, setSearchData] = useState(initData)

  // 关键字查询
  const onSearch = (keyword: string) => {
    console.log(keyword)
    setSearchData({ ...searchData, page: 0, keyword })
  }

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

  // 权限回收
  function authRecovery(id: number, content: string) {
    const config = {
      title: '操作提示',
      content: '确定回收该账户权限？',
      centered: true,
      onOk: () => {
        const params = { account: nowAccount, username: nowUser, id, content }
        $api
          .request('/team/permission/recycle', params, {
            headers: {
              loginToken,
            },
            formData: true,
          })
          .then(res => {
            if (res.returnCode === 0) {
              getList()
            }
          })
          .catch(function (res) {
            message.error(res.returnMessage)
          })
      },
    }
    Modal.confirm(config)
  }

  // 请求列表数据
  const getList = () => {
    console.log('search')
    const params = {
      userId: nowUserId,
      teamId: selectTeamId,
      ...searchData,
    }
    setTableLoading(true)
    $api
      .request('/team/permission/grantLog/list', params, {
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken,
        },
      })
      .then(res => {
        setTableLoading(false)
        console.log(res)
        setTableData(res.data)
      })
      .catch(function (res) {
        setTableLoading(false)
        message.error(res.returnMessage)
      })
  }

  useEffect(() => {
    getList()
  }, [selectTeamId, searchData])

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

  const { totalElements, content } = tableData
  const { page, pageSize, startTime, endTime } = searchData
  const getTableColums = () => {
    if (searchData.listType === 1) {
      return applyColumns()
    } else {
      return approvalColumns((id: number, content: string) => authRecovery(id, content))
    }
  }

  return (
    <div className="applyRecordContent">
      <div className="formArea">
        <Radio.Group
          // style={{ width: '210px' }}
          defaultValue="myApply"
          onChange={e => {
            const value = e.target.value
            setSearchData({
              ...searchData,
              listType: value === 'myApply' ? 1 : 2,
            })
          }}
        >
          <Radio.Button value="myApply">
            <i></i>我申请的
          </Radio.Button>
          <Radio.Button value="myApproval">
            <i></i>我审批的
          </Radio.Button>
        </Radio.Group>
        <div style={{ display: 'flex' }}>
          <Input.Search
            placeholder="请输入关键字"
            // suffix={<img src={$tools.asAssetsPath('/images/common/search.png')} />}
            onSearch={(value: string) => onSearch(value)}
          />
          <DatePicker.RangePicker
            suffixIcon={<img src={$tools.asAssetsPath('/images/annouce/date.svg')} />}
            onChange={dateChange}
            format="YYYY/MM/DD"
            value={startTime ? [moment(startTime, 'YYYY-MM-DD'), moment(endTime, 'YYYY-MM-DD')] : null}
          />
        </div>
      </div>

      <Table
        className="tableContent"
        dataSource={content}
        locale={{ emptyText: <NoneData /> }}
        rowKey={record => record.id}
        loading={tableLoading}
        columns={getTableColums()}
        tableLayout={'auto'}
        pagination={{
          position: ['bottomCenter'],
          current: page + 1,
          pageSize,
          pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
          total: totalElements,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (current, pageSize) => {
            setSearchData({ ...searchData, page: current - 1, pageSize: pageSize || 20 })
          },
          onShowSizeChange: (current, size) => {
            setSearchData({ ...initData, page: current - 1, pageSize: size })
          },
        }}
        scroll={{ y: windowHeight - 274 }}
        showHeader={!content || content.length !== 0}
      />
    </div>
  )
}

export default ApplyRecord

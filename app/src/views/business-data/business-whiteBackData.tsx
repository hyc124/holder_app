/**
 * 业务数据窗口
 */
import React, { useEffect, useState } from 'react'
import './business-data.less'
import { Select, Table, message, Input, Button, DatePicker, Tag, Checkbox, Tooltip } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import { SearchOutlined } from '@ant-design/icons'
import moment from 'moment'
import { SelectMemberOrg } from '@/src/components/select-member-org'
import { businessWhiteBack } from '../workdesk/getData'
const { RangePicker } = DatePicker

//详情筛选checkbox
let allFormsNames: any = []
/**
 * 回写明细table
 */
const WhiteBckTableData = ({ datas, filterDatas, tabChange, dataChange, changeLoding }: any) => {
  const { baseFormId, teamId, selectTab, baseFormWhiteBackData } = datas
  //详情数据
  const [detailData, setDetailData] = useState<any>(null)
  //自适应表格高度
  const [windowHeight, setWindowHeight] = useState(0)
  //筛选控制
  const [filterObj, setFilterObj] = useState<any>({
    filteredInfo: [],
    sortedInfo: null,
    isSort: false,
  })
  // 当前筛选数据
  const [filterParam, setFilterParam] = useState('')
  //loading
  const [detailLoading, setDetailLoading] = useState(false)

  //页码
  const [pagination, setPagination] = useState({
    pageNo: 0,
    pageSize: 20,
    total: 0,
  })

  // 地表切换
  useEffect(() => {
    if (tabChange.visible) {
      changeLoding && changeLoding(true)
      //请求回写明细
      const { nowAccount, nowUserId } = $store.getState()
      const param: any = {
        baseFormId: baseFormId,
        pageNo: pagination.pageNo,
        pageSize: pagination.pageSize,
        viewId: selectTab.id,
        userAccount: nowAccount,
        userId: nowUserId,
      }
      setDetailData(null)
      setFilterObj({
        filteredInfo: [],
        sortedInfo: null,
        isSort: false,
        clearFilters: true,
      })
      businessWhiteBack(param)
        .then((res: any) => {
          if (res.returnCode == 0) {
            setDetailData(res.data)
            setPagination({ ...pagination, total: res.data.totalElements })
            dataChange(res.data)
          }
        })
        .finally(() => {
          changeLoding && changeLoding(false)
        })
    }
  }, [tabChange.refresh, baseFormId, selectTab.id, pagination.pageNo, pagination.pageSize])

  // 字段显示
  useEffect(() => {
    if (baseFormWhiteBackData) {
      setDetailData({ ...detailData, viewTitleModels: baseFormWhiteBackData.viewTitleModels })
    }
  }, [baseFormWhiteBackData])

  //初始化
  useEffect(() => {
    setWindowHeight(window.innerHeight)
    window.addEventListener('resize', function() {
      setWindowHeight(this.window.innerHeight)
    })
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      window.removeEventListener('resize', function() {})
    }
  }, [datas])

  useEffect(() => {
    // if (filterObj.filteredInfo.length == 0 && !filterObj.sortedInfo) {
    //   return
    // }
    let _customFilterParam = []
    //处理自定义筛选
    if (filterObj.filteredInfo.length > 0) {
      _customFilterParam = filterObj.filteredInfo.map((item: any) => {
        const param: any = {}
        param.type = item.type
        if (item.type === 'apply_person_dept') {
          param.contain = item.contain
          const valueArr = item.filterArr.map((item: { deptId: any }) => {
            return item.deptId
          })
          param.value = valueArr.join(',')
        } else if (item.type === 'apply_person') {
          param.contain = item.contain
          const valueArr = item.filterArr.map((item: { userId: any }) => {
            return item.userId
          })
          param.value = valueArr.join(',')
        } else if (item.type === 'form_serial_number' || item.type === 'back_form_name') {
          param.contain = item.contain
          param.value = item.value
        } else if (item.type === 'create_time') {
          param.value = item.value
        } else {
          param.contain = item.contain
          param.value = item.value
          param.uuid = item.uuid
        }
        return param
      })
    }
    //处理排序
    if (filterObj.sortedInfo) {
      const param: any = {}
      if (filterObj.sortedInfo.order === 'ascend') {
        //升序
        param.sort = 1
        param.type = filterObj.sortedInfo.column.type
        if (
          filterObj.sortedInfo.column.type != 'create_time' &&
          filterObj.sortedInfo.column.type != 'update_time'
        ) {
          param.uuid = filterObj.sortedInfo.column.key
        }
      } else if (filterObj.sortedInfo.order === 'descend') {
        //降序
        param.sort = 2
        param.type = filterObj.sortedInfo.column.type
        if (
          filterObj.sortedInfo.column.type != 'create_time' &&
          filterObj.sortedInfo.column.type != 'update_time'
        ) {
          param.uuid = filterObj.sortedInfo.column.key
        }
      }
      const _test = filterAssemble(param, _customFilterParam, filterObj.sortedInfo)
      if (_test.isIn) {
        // 如果筛选数组中有则替换
        _customFilterParam[_test.index] = param
      } else {
        // 如果筛选数组中没有则添加
        _customFilterParam.push(param)
      }
    }
    setDetailLoading(true)
    // 请求回写明细
    const { nowAccount, nowUserId } = $store.getState()
    const _param: any = {
      baseFormId: baseFormId,
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      viewId: selectTab.id || '',
      userAccount: nowAccount,
      userId: nowUserId,
    }

    if (_customFilterParam.length > 0) {
      _param.screenModels = _customFilterParam
    }
    filterDatas({ data: _customFilterParam, pagination: pagination })
    businessWhiteBack(_param)
      .then((res: any) => {
        if (res.returnCode == 0) {
          setDetailData(res.data)
          setPagination({ ...pagination, total: res.data.totalElements })
        }
      })
      .finally(() => {
        setDetailLoading(false)
      })
  }, [filterObj])

  //筛选完成
  const handleFilter = (selectVals: any, confirm: any, clearFilters?: any) => {
    confirm()
    setCustomFilter(selectVals, clearFilters)
    setFilterParam('')
    filterDatas('')
    clearFilters ? clearFilters() : ''
  }

  //表格筛选
  const tableChangeEvent = (
    _pagination: any,
    _filters: any,
    sorter: any,
    extra: { currentDataSource: any; action: string }
  ) => {
    if (extra.action === 'sort') {
      setFilterObj({
        ...filterObj,
        sortedInfo: sorter,
        isSort: true,
      })
    }
  }

  //处理自定义筛选
  const setCustomFilter = (selectVals: any, clearFilters?: any) => {
    const _newArr = filterObj.filteredInfo
    const _isFilter = filterAssemble(selectVals[0], filterObj.filteredInfo, filterObj.sortedInfo, clearFilters)
    if (clearFilters) {
      // 重置筛选数组中当前项
      if (_isFilter.isIn) {
        _newArr.splice(_isFilter.index, 1)
      }
    } else {
      // 添加
      if (_newArr.length === 0) {
        _newArr.push(selectVals[0])
      } else {
        if (_isFilter.isIn) {
          // 如果筛选数组中有则替换
          _newArr[_isFilter.index] = selectVals[0]
        } else {
          // 如果筛选数组中没有则添加
          _newArr.push(selectVals[0])
        }
      }
    }

    setFilterObj({
      filteredInfo: _newArr,
      isSort: false,
      sortedInfo: _isFilter.delSor ? null : filterObj.sortedInfo,
    })
  }

  /**
   *
   * @param selectVals 当前筛选数据
   * @param arr 组合筛选数组
   */
  const filterAssemble = (selectVals: any, arr: any, filterSortArr?: any, clearFilters?: any) => {
    let isIn = false
    let _index = 0
    const _colId = selectVals.uuid
    const _type = selectVals.type
    const delSor = false
    // arr中是否有排序
    const _hasSort = filterSortArr ? true : false
    for (let i = 0; i < arr.length; i++) {
      if (
        (arr[i].uuid && _colId && arr[i].uuid == _colId && !_hasSort) ||
        ((_colId == null || _colId == undefined) && _type && arr[i].type == _type && !_hasSort)
      ) {
        // 添加筛选条件
        isIn = true
        _index = i
        break
      }
      if (clearFilters) {
        // 重置
        if (
          (arr[i].uuid && _colId && arr[i].uuid == _colId) ||
          ((_colId == null || _colId == undefined) && _type && arr[i].type == _type)
        ) {
          isIn = true
          _index = i
          break
        }
      }
    }
    // if (_hasSort && filterObj.sortedInfo.column.type == _type) {
    //   // 如果先排序后又换成自定义筛选则删除排序
    //   delSor = true
    // }
    return {
      isIn: isIn,
      index: _index,
      delSor: delSor,
    }
  }

  //所有回写表单名称
  if (filterObj.filteredInfo.length == 0 && !filterObj.sortedInfo) {
    allFormsNames = []
    detailData &&
      detailData.backWaiteLogModels &&
      detailData.backWaiteLogModels.map((item: any) => {
        if (JSON.stringify(allFormsNames).indexOf(item['backFormId']) == -1) {
          allFormsNames.push({
            label: item['back_form_name'],
            value: `${item['backFormId']}`,
          })
        }
      })
  }

  //冲销穿透
  const writeOff = (arr: any[]) => {
    if (selectTab.isPenetrate) {
      //查看详情
      $store.dispatch({ type: 'SET_OPERATEAPPROVALID', data: { isQueryAll: true, ids: arr } })
      $tools.createWindow('ApprovalOnlyDetail')
    } else {
      message.error('暂无穿透权限')
    }
  }

  let columnsInfo: any[] = []

  if (detailData) {
    if (detailData.viewTitleModels) {
      if (detailData.viewTitleModels[0].type === 'form_serial_number') {
        columnsInfo = detailData.viewTitleModels
      } else {
        columnsInfo = detailData.viewTitleModels.concat([]).reverse()
      }
    }
  }

  //详情列
  const columns =
    detailData &&
    columnsInfo.map((item: { title: any; uuid: any; type: string }) => {
      const filterParam: any = {
        title: item.title,
        dataIndex: item.uuid,
        key: item.uuid,
        width: 200,
        align: 'center',
        type: item.type,
        filterIcon: (filtered: any) => {
          // return <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
          return <em className={`Search_filter ${filtered ? 'hover' : ''}`}></em>
        },
        render: (text: any, record: any) => {
          if (record[item.uuid] && $tools.isJsonString(record[item.uuid])) {
            if (item.type === 'peoSel') {
              //人员选择
              return JSON.parse(record[item.uuid])
                .map((idx: { userName: string }) => {
                  return idx.userName
                })
                .join('、')
            } else if (item.type === 'deptSel') {
              //部门选择
              return JSON.parse(record[item.uuid])
                .map((idx: { deptName: string }) => {
                  return idx.deptName
                })
                .join('、')
            } else if (item.type === 'roleSel') {
              return JSON.parse(record[item.uuid])
                .map((idx: { deptName: string; roleName: string }) => {
                  return idx.deptName + '-' + idx.roleName
                })
                .join('、')
            } else if (item.type === 'numval' && record.chargeAgainst && record.chargeAgainst[item.uuid]) {
              return (
                <span
                  style={{ color: '#4285f4', textDecoration: 'underline' }}
                  onClick={e => {
                    e.stopPropagation()
                    e.preventDefault()
                    writeOff(record.chargeAgainst[item.uuid])
                  }}
                >
                  {record[item.uuid]}
                </span>
              )
            } else {
              if (item.type == 'textarea') {
                return (
                  <Tooltip title={record[item.uuid]}>
                    <span className="td_line_text">{record[item.uuid]}</span>
                  </Tooltip>
                )
              } else {
                return record[item.uuid]
              }
            }
          } else if (record[item.type]) {
            if (item.type == 'textarea') {
              return (
                <Tooltip title={record[item.type]}>
                  <span className="td_line_text">{record[item.type]}</span>
                </Tooltip>
              )
            } else {
              return record[item.type]
            }
          } else {
            if (item.type == 'textarea') {
              return (
                <Tooltip title={text}>
                  <span className="td_line_text">{text}</span>
                </Tooltip>
              )
            } else {
              return text
            }
          }
        },
      }
      if (
        item.type != 'peoSel' &&
        item.type != 'deptSel' &&
        item.type != 'roleSel' &&
        item.type != 'apply_person_dept' &&
        item.type != 'input_person' &&
        item.type != 'apply_person' &&
        item.type != 'back_form_name'
      ) {
        filterParam.sorter = true
        filterParam.sortOrder = filterObj.sortedInfo
          ? ((item.uuid && filterObj.sortedInfo.columnKey === item.uuid) ||
              (filterObj.sortedInfo.column && !item.uuid && filterObj.sortedInfo.column.type === item.type)) &&
            filterObj.sortedInfo.order
          : null
      }
      if (item.type !== 'formula' && item.type !== 'numval' && item.type !== 'back_form_name') {
        filterParam.filterDropdown = (props: any) => {
          return (
            <RenderFilterModal
              {...props}
              handleFunc={handleFilter}
              teamId={teamId}
              type={item.type}
              uuid={item.uuid}
            />
          )
        }
      }
      if (item.type === 'back_form_name') {
        filterParam.filterDropdown = ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: any) => {
          return (
            <FileterParam
              selectedKeys={selectedKeys}
              setSelectedKeys={setSelectedKeys}
              confirm={confirm}
              handleFilter={handleFilter}
              item={item}
              clearFilters={clearFilters}
            />
          )
        }
      }

      return filterParam
    })
  //详情展示数据
  const tableData =
    detailData &&
    detailData.backWaiteLogModels &&
    detailData.backWaiteLogModels.map(
      (item: { backWaiteDataMap: any; chargeAgainstIdMap: any }, index: number) => {
        return {
          ...item,
          ...item.backWaiteDataMap,
          chargeAgainst: item.chargeAgainstIdMap,
          key: index,
        }
      }
    )
  //补齐空白行
  if (tableData && tableData.length < pagination.pageSize) {
    const newLen = Number(pagination.pageSize - tableData.length)
    for (let i = 0; i < newLen; i++) {
      tableData.push(getNoneTableData(detailData.viewTitleModels, tableData.length))
    }
  }

  //点击表格行
  const clickTableRow = (record: any) => {
    if (!record.approvalId) {
      return
    }
    if (selectTab.isPenetrate) {
      //查看详情
      $store.dispatch({ type: 'SET_OPERATEAPPROVALID', data: { isQueryAll: false, ids: record.approvalId } })
      $tools.createWindow('ApprovalOnlyDetail')
    } else {
      message.error('暂无穿透权限')
    }
  }

  return (
    <div style={{ height: 'calc(100% - 46px)' }}>
      <div className="business-table-container whiteBack-table-container">
        {detailData !== null && (
          <Table
            className="tableContent"
            bordered={true}
            loading={detailLoading}
            tableLayout={'auto'}
            scroll={{ x: 'max-content', y: windowHeight - 280 }}
            columns={columns}
            dataSource={tableData}
            onChange={tableChangeEvent}
            rowKey={record => record.id}
            onRow={record => {
              return {
                onClick: event => {
                  event.stopPropagation()
                  event.preventDefault()
                  clickTableRow(record)
                },
              }
            }}
            // pagination={false}
            pagination={
              detailData
                ? {
                    position: ['bottomCenter'],
                    current: pagination.pageNo + 1,
                    pageSize: pagination.pageSize,
                    pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
                    total: pagination.total,
                    showSizeChanger: true,
                    onChange: (current, pageSize) => {
                      setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 10 })
                    },
                    onShowSizeChange: (current, pageSize) => {
                      setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 10 })
                    },
                  }
                : false
            }
          />
        )}
        {detailData === null && (
          <NoneData
            imgSrc={$tools.asAssetsPath('/images/common/report_list_icon.svg')}
            showTxt="暂无数据~"
            imgStyle={{ width: 98, height: 71 }}
          />
        )}
      </div>
      {/* {detailData && (
        <Pagination
          showSizeChanger
          current={pagination.pageNo + 1}
          pageSize={pagination.pageSize}
          pageSizeOptions={['5', '10', '20', '30', '50', '100']}
          total={pagination.total}
          onChange={(current, pageSize) => {
            setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 10 })
          }}
          onShowSizeChange={(current, pageSize) => {
            setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 10 })
          }}
        />
      )} */}
    </div>
  )
}
export default WhiteBckTableData

//渲染自定义筛选弹窗
const RenderFilterModal = ({
  setSelectedKeys,
  selectedKeys,
  confirm,
  handleFunc,
  type,
  uuid,
  teamId,
  clearFilters,
}: {
  setSelectedKeys: any
  selectedKeys: any
  confirm: any
  handleFunc: any
  type: string
  uuid: string
  teamId: number
  clearFilters: any
}) => {
  //是否显示包含不包含
  const showSelect =
    type === 'input' ||
    type === 'textarea' ||
    type === 'input_person' ||
    type === 'deptSel' ||
    type === 'roleSel' ||
    type === 'peoSel' ||
    type === 'form_serial_number' ||
    type === 'apply_person_dept' ||
    type === 'apply_person' ||
    type === 'back_form_name'
      ? true
      : false
  //是否显示日期输入框
  const showDateInput =
    type === 'time' ||
    type === 'dateRange' ||
    type === 'input_time' ||
    type === 'update_time' ||
    type === 'create_time'
  //是否包含
  const [isContain, setIsContain] = useState('0')
  //是否显示选择人员弹窗
  const [visible, setVisible] = useState(false)
  //选择类型
  const [findType, setFindType] = useState(0)

  //修改包含不包含赋值
  useEffect(() => {
    if (showSelect && selectedKeys.length !== 0) {
      setSelectedKeys([{ ...selectedKeys[0], contain: isContain }])
    }
  }, [isContain])

  //弹窗选择类型
  const showSelectModal = (type: string) => {
    if (type === 'input_person' || type === 'peoSel' || type === 'apply_person') {
      setFindType(0)
    } else if (type === 'deptSel' || type === 'apply_person_dept') {
      setFindType(3)
    } else {
      setFindType(31)
    }
    setVisible(true)
  }

  //确定选择人员
  const selectedChange = (data: any) => {
    const valueArr: any = []
    const filterArr = data.map((item: any) => {
      if (type === 'deptSel' || type === 'apply_person_dept') {
        valueArr.push(`"deptId":"${item.curId}"`)
        return {
          deptId: item.curId,
          deptName: item.curName,
        }
      } else if (type === 'roleSel') {
        valueArr.push(`"roleId":"${item.curId}"`)
        return {
          deptId: item.deptId,
          deptName: item.deptName,
          roleId: item.roleId,
          roleName: item.roleName,
        }
      } else if (type === 'input_person' || type === 'apply_person') {
        valueArr.push(`${item.curId}`)
        return {
          userId: item.userId,
          userName: item.userName,
          account: item.account,
        }
      } else {
        valueArr.push(`"userId":"${item.curId}"`)
        return {
          userId: item.userId,
          userName: item.userName,
          account: item.account,
        }
      }
    })
    const realVal = type === 'input_person' ? valueArr.join(',') : valueArr.join('<#separate#>')
    setSelectedKeys([{ contain: isContain, type, uuid, value: realVal, filterArr }])
    setVisible(false)
  }

  //外部删除已选择
  const delSelectUser = (delId: number, type: string) => {
    const newValue: any = []
    let newSelectKeys = []
    if (type === 'deptSel' || type === 'apply_person_dept') {
      newSelectKeys = selectedKeys[0].filterArr.filter((item: { deptId: number }) => item.deptId !== delId)
    } else if (type === 'roleSel') {
      newSelectKeys = selectedKeys[0].filterArr.filter((item: { roleId: number }) => item.roleId !== delId)
    } else {
      newSelectKeys = selectedKeys[0].filterArr.filter((item: { userId: number }) => item.userId !== delId)
    }
    newSelectKeys.map((item: any) => {
      if (type === 'deptSel' || type === 'apply_person_dept') {
        newValue.push(`"deptId":"${item.deptId}"`)
      } else if (type === 'roleSel') {
        newValue.push(`"roleId":"${item.roleId}"`)
      } else if (type === 'input_person') {
        newValue.push(`${item.roleId}`)
      } else {
        newValue.push(`"userId":"${item.userId}"`)
      }
    })
    setSelectedKeys([
      {
        contain: isContain,
        type,
        uuid,
        value: type === 'input_person' ? newValue.join(',') : newValue.join('<#separate#>'),
        filterArr: newSelectKeys,
      },
    ])
  }
  //处理回显数据
  const showSelectUsers =
    selectedKeys.length !== 0 &&
    (type === 'input_person' ||
      type === 'deptSel' ||
      type === 'roleSel' ||
      type === 'peoSel' ||
      type === 'apply_person' ||
      type === 'apply_person_dept')
      ? getShowUsers(selectedKeys[0].filterArr, type)
      : []
  let showTypeTxt = '联系人'
  if (findType == 3) {
    showTypeTxt = '部门'
  } else if (findType == 31) {
    showTypeTxt = '岗位'
  }
  return (
    <div style={{ padding: 8, overflow: 'hidden' }}>
      <div className="title" style={{ height: 40, display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1, fontWeight: 'bold', fontSize: 14 }}>{getNameBytype(type)}</span>
        {showSelect && (
          <Select
            bordered={false}
            value={selectedKeys.length !== 0 ? selectedKeys[0].contain : isContain}
            onChange={value => setIsContain(value)}
            style={{ float: 'right', width: 75 }}
          >
            <Select.Option value="0">包含</Select.Option>
            <Select.Option value="1">不包含</Select.Option>
          </Select>
        )}
      </div>
      {showDateInput && (
        <RangePicker
          style={{ display: 'flex' }}
          format={'YYYY/MM/DD'}
          value={
            selectedKeys.length !== 0
              ? [
                  moment(selectedKeys[0].value.split('-')[0], 'YYYY/MM/DD'),
                  moment(selectedKeys[0].value.split('-')[1], 'YYYY/MM/DD'),
                ]
              : null
          }
          allowClear={false}
          onChange={(_dates, dateStrings) => {
            setSelectedKeys([{ type, uuid, value: dateStrings.join('-') }])
          }}
        />
      )}
      {(type === 'input_person' ||
        type === 'deptSel' ||
        type === 'roleSel' ||
        type === 'peoSel' ||
        type === 'apply_person_dept' ||
        type === 'apply_person') && (
        <div
          onClick={() => {
            showSelectModal(type)
          }}
          style={{ width: 250, minHeight: 60, padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
        >
          {showSelectUsers.length !== 0 &&
            showSelectUsers.map((item: any) => {
              return (
                <Tag
                  key={item.curId}
                  onClose={(e: { preventDefault: () => void }) => {
                    e.preventDefault()
                    delSelectUser(item.curId, type)
                  }}
                  closable
                  style={{ marginBottom: 6 }}
                >
                  {item.curName}
                </Tag>
              )
            })}
        </div>
      )}
      {(type === 'input' || type === 'textarea' || type === 'form_serial_number') && (
        <Input
          placeholder={'请输入关键字筛选'}
          value={selectedKeys.length !== 0 ? selectedKeys[0].value : ''}
          onChange={e => setSelectedKeys([{ contain: isContain, type, uuid, value: e.target.value }])}
        />
      )}
      <Button
        type="primary"
        onClick={e => {
          e.preventDefault()
          handleFunc(selectedKeys, confirm)
        }}
        style={{ float: 'right', marginTop: 8 }}
      >
        确定
      </Button>
      <Button
        onClick={e => {
          e.preventDefault()
          handleFunc([{ type: type, uuid: uuid, value: '' }], confirm, clearFilters)
          setIsContain('0')
        }}
        style={{ float: 'right', marginTop: 8, marginRight: 10 }}
      >
        重置
      </Button>
      {visible && (
        <SelectMemberOrg
          param={{
            visible: visible,
            allowTeamId: [teamId],
            selectList: showSelectUsers,
            findType: findType,
            fliterByType: {
              '1': {
                show: true,
                text: '按组织架构选择',
              },
              '2': {
                show: findType != 3 && findType != 31,
                text: '按角色选择',
              },
              '3': {
                show: true,
              },
              '4': {
                show: true,
                text: `常用${showTypeTxt}`,
              },
            },
            onSure: (datas: any) => {
              selectedChange(datas)
            },
          }}
          action={{
            setModalShow: setVisible,
          }}
        />
      )}
    </div>
  )
}

//筛选
const FileterParam = ({ selectedKeys, setSelectedKeys, confirm, handleFilter, item, clearFilters }: any) => {
  //是否包含
  const [isContain, setIsContain] = useState('0')
  const changeCheck = (selectValus: any) => {
    setSelectedKeys([{ ...selectedKeys[0], contain: isContain, type: item.type, value: selectValus.join(',') }])
  }
  //修改包含不包含赋值
  useEffect(() => {
    setSelectedKeys([{ ...selectedKeys[0], contain: isContain }])
  }, [isContain])
  const checkSelecteds = selectedKeys.map((item: { value: any }) => {
    return item.value
  })
  return (
    <div style={{ padding: 8, overflow: 'hidden' }}>
      <div className="title" style={{ height: 40, display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1, fontWeight: 'bold', fontSize: 14 }}>回写表单名称</span>
        <Select
          bordered={false}
          value={isContain}
          onChange={value => setIsContain(value)}
          style={{ float: 'right', width: 75 }}
        >
          <Select.Option value="0">包含</Select.Option>
          <Select.Option value="1">不包含</Select.Option>
        </Select>
      </div>
      <Checkbox.Group
        style={{ display: 'flex' }}
        options={allFormsNames}
        value={checkSelecteds.length > 0 ? checkSelecteds[0]?.split(',') : checkSelecteds}
        onChange={changeCheck}
      ></Checkbox.Group>
      <Button
        type="primary"
        onClick={e => {
          e.preventDefault()
          handleFilter(selectedKeys, confirm)
        }}
        style={{ float: 'right', marginTop: 8 }}
      >
        确定
      </Button>
      <Button
        onClick={e => {
          e.preventDefault()
          handleFilter([{ type: 'back_form_name', uuid: null, value: '' }], confirm, clearFilters)
        }}
        style={{ float: 'right', marginTop: 8, marginRight: 10 }}
      >
        重置
      </Button>
    </div>
  )
}

//填充空白行
const getNoneTableData = (headerData: any[], startIndex: number) => {
  const param: any = {}
  headerData.map((item, i) => {
    if (item.uuid) {
      param[item.uuid] = ''
    } else {
      param[item.type] = ''
    }
    param.key = startIndex + i
  })
  return param
}

//处理数据参数，回显选择人员部门岗位
const getShowUsers = (arr: any, type: string) => {
  if (!arr) {
    return []
  }
  const newArr = arr.map((item: any) => {
    if (type === 'deptSel' || type === 'apply_person_dept') {
      return {
        curId: item.deptId,
        curName: item.deptName,
        deptId: item.deptId,
        deptName: item.deptName,
      }
    } else if (type === 'roleSel') {
      return {
        curId: item.roleId,
        curName: item.roleName,
        roleId: item.roleId,
        roleName: item.roleName,
        deptId: item.deptId,
        deptName: item.deptName,
      }
    } else {
      return {
        curId: item.userId,
        curName: item.userName,
        userId: item.userId,
        userName: item.userName,
        account: item.account,
      }
    }
  })
  return newArr
}

/**
 * 筛选标题
 */
const getNameBytype = (type: string) => {
  if (type === 'input' || type === 'textarea' || type === 'form_serial_number') {
    return '文字'
  } else if (type === 'time' || type === 'dateRange' || type === 'input_time' || type === 'update_time') {
    return '时间'
  } else if (type === 'peoSel' || type === 'input_person' || type === 'apply_person') {
    return '人员'
  } else if (type === 'deptSel' || type === 'apply_person_dept') {
    return '部门'
  } else if (type === 'roleSel') {
    return '岗位'
  } else if (type === 'back_form_name') {
    return '回写表单'
  } else if (type === 'create_time') {
    return '发起时间'
  }
}

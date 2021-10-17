import React, { useEffect, useRef, useState } from 'react'
import { message, List, Tooltip, Avatar, Input, Modal, Spin, Table, Radio, DatePicker } from 'antd'
import { getOnlyTableData, getOutBackData } from '../getData/getData'
import NoneData from '../../none-data/none-data'
import * as Maths from '@/src/common/js/math'
import { getFormElementUuid } from '../getData/approvalHandle'

const { RangePicker } = DatePicker

let filterObjRef: any = {
  dateType: 0,
  startTime: '',
  endTime: '',
}
//唯一标识弹窗
const OnlySymbolModal = ({ visible, onClose, eventId, onSure, uuid, parentUuId }: any) => {
  //表格loading
  const [loading, setLoading] = useState(false)
  //表格滚动容器
  const scrollRef = useRef<any>(null)
  //表格列定义
  const [columns, setColumns] = useState<any>([])
  const [tableData, settableData] = useState<any>([])
  const tableDataRef = useRef<any>(null)
  const [selApprovalId, setSelApprovalId] = useState<any>([])
  //分页
  const pageNoRef = useRef<any>(0)
  //isScroll
  const isScroll = useRef<any>(true)

  //初始化滚动加载事件监听
  useEffect(() => {
    if (scrollRef.current && tableDataRef.current) {
      const tableBody = scrollRef.current.querySelector('.ant-table-body')
      let _scrollTop = 0 //保存上次滚动距离
      let isRun = false //是否执行查询
      tableBody.addEventListener('scroll', async () => {
        if (tableBody.scrollTop === 0) {
          _scrollTop = 0
        }
        // 上一次滚动高度与当前滚动高度不同则是纵向滚动
        if (_scrollTop != tableBody.scrollTop) {
          //是否滑动到距离底部40px的位置
          const scorll = _scrollTop >= tableBody.scrollHeight - tableBody.clientHeight - 40
          //isRun为true时 代表已经执行查询
          if (isRun && scorll) {
            return
          }
          //_scrollTop < tableBody.scrollTop 判断是否向下滑动
          isRun = _scrollTop < tableBody.scrollTop && scorll
          //保存当前滚动位置
          _scrollTop = tableBody.scrollTop
          if (isRun && isScroll.current) {
            pageNoRef.current += 1
            const { newTableData } = await getTableData(pageNoRef.current)
            settableData([...tableDataRef.current, ...newTableData])
          }
        }
      })
    }
  }, [scrollRef.current])

  //记录表格数据
  useEffect(() => {
    tableDataRef.current = tableData
  }, [tableData])

  useEffect(() => {
    if (visible) {
      //查询唯一标识筛选
      filterObjRef = {
        uniqueTag: '',
        dataType: 0,
        startTime: '',
        endTime: '',
      }
    }
  }, [visible])

  useEffect(() => {
    getByFilter()
  }, [])

  //筛选条件查询
  const getByFilter = async () => {
    isScroll.current = true
    pageNoRef.current = 0
    const { columnArr, newTableData, selectApprovalIds } = await getTableData(pageNoRef.current)
    setColumns(columnArr)
    settableData(newTableData)
    setSelApprovalId(selectApprovalIds)
    const dom = jQuery('.ant-table-body')
    if (dom) {
      dom[0].scrollTop = 0
    }
  }

  //查询唯一标识数据
  const getTableData = async (pageNo: number) => {
    setLoading(true)
    const _uuid = parentUuId ? parentUuId : uuid //重复行查唯一标识传父级id
    return new Promise<any>((resolve, reject) => {
      getOnlyTableData(eventId, filterObjRef, _uuid, pageNo)
        .then(resData => {
          if (resData.baseFormElementModels && resData.baseFormElementModels.length < 20) {
            isScroll.current = false
          }
          //已选择表单编号
          const { elementRelationDataList } = $store.getState()
          const selectApprovalIds: any[] = []
          for (const key in elementRelationDataList) {
            const element = elementRelationDataList[key].dataId
            if (element) {
              selectApprovalIds.push(element)
            }
          }
          const columnArr =
            resData.viewTitleModels &&
            resData.viewTitleModels.map((item: any) => {
              return {
                title: item.title,
                dataIndex: item.uuid,
                key: item.uuid,
                ellipsis: true,
                dataFormIds: item.formElementUuid,
                render: (_text: any, record: any) => {
                  let showTxt = ''
                  if (!record[item.uuid]) {
                    return showTxt
                  }
                  const fillValue = record[item.uuid].fillValue
                  if ($tools.isJsonString(fillValue) && JSON.parse(fillValue) instanceof Array) {
                    const showArr = JSON.parse(fillValue)
                    showTxt = showArr
                      .map((item: any) => {
                        if (item.userName) {
                          return item.userName
                        } else if (item.roleName) {
                          return `${item.deptName}-${item.roleName}`
                        } else if (item.deptName) {
                          return item.deptName
                        }
                      })
                      .join('、')
                  } else {
                    showTxt = record[item.uuid].fillValue
                  }
                  return showTxt
                },
              }
            })

          const tableData =
            resData.baseFormElementModels &&
            resData.baseFormElementModels.map((item: any) => {
              for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                  const element = item[key]
                  element.formElementUuid = getFormElementUuid(resData.viewTitleModels, key)
                }
              }
              return {
                ...item,
                key: Maths.uuid(),
              }
            })
          //数据
          resolve({ columnArr, newTableData: tableData, selectApprovalIds })
        })
        .catch(err => {
          reject(err)
        })
        .finally(() => {
          setLoading(false)
        })
    })
  }

  //切换筛选方式
  const changeFilter = (e: any) => {
    filterObjRef = {
      dateType: e.target.value,
      startTime: '',
      endTime: '',
      uniqueTag: filterObjRef.uniqueTag ? filterObjRef.uniqueTag : '',
    }
    getByFilter()
  }
  //选择日期筛选
  const changeCustomDate = (dates: any, dateStrings: any) => {
    const { dateType } = filterObjRef
    filterObjRef = {
      dateType: dateType,
      startTime: dateStrings[0],
      endTime: dateStrings[1],
    }
    getByFilter()
  }
  //自定义模糊搜索
  const changeInputKeyword = (e: any) => {
    const { dateType, startTime, endTime } = filterObjRef
    filterObjRef = {
      dateType: dateType,
      startTime: startTime,
      endTime: endTime,
      uniqueTag: e.target.value,
    }
    getByFilter()
  }
  //点击表格行
  const clickTableRow = (record: any) => {
    onSure(record)
  }
  //设置tr的class
  const setRowClassName = (record: any) => {
    let _type = false
    //已选择表单编号,置灰不可选
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        if (selApprovalId.includes(record[key].baseFormDataId)) {
          _type = true
          break
        }
      }
    }
    return _type ? 'hasSelected' : ''
  }
  return (
    <Modal
      className="select-only-symbol-modal"
      title={'请选择'}
      centered={true}
      visible={visible}
      width={850}
      footer={false}
      onCancel={onClose}
    >
      <Input placeholder={'支持对唯一标识信息进行模糊搜索'} onPressEnter={changeInputKeyword} />
      <div className="select_range_time">
        <span>请选择时间范围：</span>
        <Radio.Group
          className="flex-1"
          style={{ width: 'auto' }}
          value={filterObjRef.dateType || 0}
          options={[
            { label: '全部', value: 0 },
            { label: '本周', value: 1 },
            { label: '本月', value: 2 },
            { label: '自定义', value: 3 },
          ]}
          onChange={changeFilter}
        ></Radio.Group>
        {filterObjRef.dateType === 3 && <RangePicker onChange={changeCustomDate} allowClear={false} />}
      </div>
      {(!tableData || (tableData && tableData.length == 0)) && (
        <Spin className="flex center" style={{ height: 420 }} spinning={loading}>
          <NoneData />
        </Spin>
      )}
      {tableData && tableData.length !== 0 && (
        <div ref={scrollRef}>
          <Table
            className="onlySymbol_box"
            bordered={true}
            loading={loading}
            tableLayout="fixed"
            scroll={{ x: 'max-content', y: 400 }}
            columns={columns}
            dataSource={tableData}
            pagination={false}
            rowClassName={setRowClassName}
            onRow={record => {
              return {
                onClick: event => {
                  event.preventDefault()
                  clickTableRow(record)
                },
              }
            }}
          ></Table>
        </div>
      )}
    </Modal>
  )
}

export default OnlySymbolModal

import React, { useEffect, useRef, useState } from 'react'
import { Modal, Spin, Table } from 'antd'
import { getOutBackData } from '../getData/getData'
import NoneData from '../../none-data/none-data'
import * as Maths from '@/src/common/js/math'
//聚焦-点击搜索框展示分类查询模块

//选择表单号弹窗
const OutBackModal = ({ visible, onClose, eventId, onSure, uuid, parentUuId, filterObjRef }: any) => {
  //表格loading
  const [loading, setLoading] = useState(false)
  //表格滚动容器
  const scrollRef = useRef<any>(null)
  //表格列定义
  const [columns, setColumns] = useState<any>([])
  const [tableData, settableData] = useState<any>([])
  const tableDataRef = useRef<any>(null)
  //记录选中的类型
  const selctTypes = useRef<any>([])
  const [selApprovalId, setSelApprovalId] = useState<any>([])
  //记录表格数据
  useEffect(() => {
    tableDataRef.current = tableData
  }, [tableData])

  useEffect(() => {
    getByFilter()
  }, [])

  //筛选条件查询
  const getByFilter = async () => {
    const { columnArr, newTableData, selectApprovalIds } = await getTableData()
    setColumns(columnArr)
    settableData(newTableData)
    setSelApprovalId(selectApprovalIds)
  }

  const findBaseId = (uuid: string) => {
    const { onlyElementData } = $store.getState()
    let _dataId = ''
    for (let i = 0; i < onlyElementData.length; i++) {
      if (onlyElementData[i].uuid === uuid && onlyElementData[i].onlyUuId) {
        _dataId = getBaseId(
          typeof onlyElementData[i].onlyUuId === 'string'
            ? onlyElementData[i].onlyUuId
            : onlyElementData[i].onlyUuId[0]
        )
        break
      }
    }
    return _dataId
  }

  const getBaseId = (ids: any) => {
    let _dataId = ''
    const { elementRelationDataList } = $store.getState()
    elementRelationDataList?.map((item: { uuid: any; dataId: any }) => {
      if (item.uuid === ids) {
        //判断当前控件，如果是该控件对应的唯一标识，则可编辑
        _dataId = item.dataId
        return false
      }
    })
    return _dataId
  }

  //查询唯一标识数据
  const getTableData = async () => {
    setLoading(true)
    const _baseFormDataId = findBaseId(uuid)
    return new Promise<any>((resolve, reject) => {
      getOutBackData(eventId, filterObjRef, _baseFormDataId, uuid)
        .then(resData => {
          const columnArr =
            resData.viewTitleModels &&
            resData.viewTitleModels.map((item: any, index: number) => {
              selctTypes.current.push({ uuid: item.uuid || item.type, formElementUuid: item.formElementUuid })
              return {
                title: item.title,
                dataIndex: item.uuid || item.type,
                key: index,
                ellipsis: true,
                render: (_text: any, record: any) => {
                  let showTxt = ''
                  if (!record[item.uuid] && !record[item.type]) {
                    return showTxt
                  }
                  showTxt = record[item.uuid] || record[item.type]
                  return showTxt
                },
              }
            })
          //已选择表单编号
          const { outBackData } = $store.getState()
          const selectApprovalIds: any[] = []
          for (const key in outBackData) {
            const element = outBackData[key]
            if (element) {
              selectApprovalIds.push(element)
            }
          }

          const tableData =
            resData.backWaiteLogModels &&
            resData.backWaiteLogModels
              // .filter((item: { approvalId: any }) => !selectApprovalIds.includes(item.approvalId))
              .map((item: any) => {
                return {
                  ...item,
                  ...item.backWaiteDataMap,
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
  //点击表格行
  const clickTableRow = (record: any) => {
    onSure(record, selctTypes.current)
  }
  //设置tr的class
  const setRowClassName = (record: any) => {
    let _type = false
    //已选择表单编号,置灰不可选
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        if (selApprovalId.includes(record.approvalId)) {
          _type = true
          break
        }
      }
    }
    return _type ? 'hasSelected' : ''
  }
  //关闭弹窗
  //   const closeSymbolModal = () => {
  //     setVisible(false)
  //   }
  return (
    <Modal
      className="select-only-symbol-modal"
      title={'选择表单编号'}
      centered={true}
      visible={visible}
      width={850}
      footer={false}
      onCancel={onClose}
    >
      {(!tableData || (tableData && tableData.length == 0)) && (
        <Spin className="flex center" style={{ height: 500 }} spinning={loading}>
          <NoneData />
        </Spin>
      )}
      {tableData && tableData.length !== 0 && (
        <div ref={scrollRef}>
          <Table
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

export default OutBackModal

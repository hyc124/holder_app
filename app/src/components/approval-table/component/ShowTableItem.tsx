import React from 'react'
import { getShowFormItemByType } from './getShowFormItemByType'

const ShowTableItem = (
  props: any,
  repeatRows: any,
  selectApprovalTab: any,
  isApprovalSend: any,
  state: any,
  nowTableElementsRef: any,
  tableMergeArrRef: any,
  colNum: any,
  tableRef: any,
  param: any,
  heightArr: any,
  teamId: any,
  eventId: any
) => {
  if (!props.value) {
    return null
  }
  //重复行数据
  const repeatData = repeatRows.current
    ? repeatRows.current.filter((item: { startRow: string }) => item.startRow == props.row)
    : []
  //表格坐标
  const coord = props.row + ',' + props.col
  //是否显示重复行添加按钮
  let hasReportBtn =
    (selectApprovalTab === 'triggerApproval' || isApprovalSend) && repeatData.length !== 0 && props.col === 0
  if (state && state !== 7) {
    hasReportBtn = false
  }
  //优化性能加载
  if (props.value && props.value.formElementModel) {
    return (
      <div
        className="tableRow"
        data-elementid={props.value.id}
        data-uuid={props.value.formElementModel.uuId}
        data-newadd={props.value.isCopyRow}
        data-coord={coord}
        style={{ backgroundColor: props.value.color }}
      >
        {/* {hasReportBtn &&
          repeatData[0].type === 'add' &&
          renderRepeatBtn(
            '添加',
            props.row,
            parseInt(repeatData[0].rowspan),
            parseInt(repeatData[0].parentRow),
            nowTableElementsRef,
            tableMergeArrRef,
            repeatRows,
            colNum,
            tableRef,
            param,
            heightArr
          )}
        {hasReportBtn &&
          repeatData[0].type === 'del' &&
          renderRepeatBtn(
            '删除',
            props.row,
            parseInt(repeatData[0].rowspan),
            parseInt(repeatData[0].parentRow),
            nowTableElementsRef,
            tableMergeArrRef,
            repeatRows,
            colNum,
            tableRef,
            param,
            heightArr
          )} */}
        {getShowFormItemByType(
          props.value.formElementModel,
          teamId,
          eventId,
          props.onChange,
          props.name,
          props.state,
          coord
        )}
      </div>
    )
  } else {
    return (
      <div
        className="tableRow none-data"
        data-elementid={props.value.id}
        data-newadd={props.value.newadd}
        data-coord={coord}
        style={{ backgroundColor: props.value.color }}
      >
        {/* {hasReportBtn &&
          repeatData[0].type === 'add' &&
          renderRepeatBtn(
            '添加',
            props.row,
            parseInt(repeatData[0].rowspan),
            parseInt(repeatData[0].parentRow),
            nowTableElementsRef,
            tableMergeArrRef,
            repeatRows,
            colNum,
            tableRef,
            param,
            heightArr
          )}
        {hasReportBtn &&
          repeatData[0].type === 'del' &&
          renderRepeatBtn(
            '删除',
            props.row,
            parseInt(repeatData[0].rowspan),
            parseInt(repeatData[0].parentRow),
            nowTableElementsRef,
            tableMergeArrRef,
            repeatRows,
            colNum,
            tableRef,
            param,
            heightArr
          )} */}
      </div>
    )
  }
}

export default ShowTableItem

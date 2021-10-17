// import React, { useEffect, useRef } from 'react'
// import 'handsontable/dist/handsontable.full.css'
// import { HotTable, HotColumn } from '@handsontable/react'
// import $c from 'classnames'
// import './ApprovalTable.less'
// import Handsontable from 'handsontable'
// import * as Maths from '@/src/common/js/math'
// import { FormElementModelProps, TableElementsItemProps } from '@/src/views/approval/components/ApprovalDettail'
// //单独处理表格
// const RenderTable = ({
//   formElementModel,
//   teamId,
//   eventId,
//   changeData,
//   name,
//   state,
// }: {
//   formElementModel: FormElementModelProps
//   teamId: number
//   eventId: number
//   changeData?: (item: any, value: string, content?: string) => void
//   name?: string
//   state?: number
// }) => {
//   //表格列数 行数 数据
//   const { colNum, tableElements, widthArrPx, tableArr, duplicate, heightArr } = formElementModel
//   const { selectApprovalTab, isApprovalSend } = $store.getState()
//   const tableData: TableElementsItemProps[][] = []
//   //合并行信息
//   const tableMergeArrRef = useRef<any>(null)
//   tableMergeArrRef.current = JSON.parse(tableArr)
//   let param: TableElementsItemProps[] = []
//   //私有化表格数据
//   const nowTableElementsRef = useRef<any>(tableElements)
//   //记录滚动
//   const scrollTopNum = useRef<any>(0)
//   //是否有重复行信息
//   const repeatRows = useRef<any>(duplicate ? JSON.parse(duplicate) : null)
//   //有添加重复行时
//   let paddingLeftPx =
//     (selectApprovalTab === 'triggerApproval' || isApprovalSend) && repeatRows.current?.length != 0 ? 50 : 10
//   if (state && state !== 7) {
//     paddingLeftPx = 0
//   }
//   useEffect(() => {
//     nowTableElementsRef.current = tableElements
//     const { executeData } = $store.getState()
//     if (executeData && executeData.outBackAllUuid) {
//       //保存可冲销id集合
//       const outUuids = {}
//       outUuids[executeData.outBackAllUuid[0]] = executeData.outBackAllUuid
//       $store.dispatch({ type: 'SET_OUT_BACK_IDS', data: outUuids })
//     }
//     $('.ant-tabs-content-holder').on('scroll', function() {
//       scrollTopNum.current = $(this).scrollTop()
//     })
//   }, [tableElements])

//   //处理表格数据为可展示数据
//   tableElements
//     .filter((item: { coord: string }) => parseInt(item.coord.split(',')[1]) < colNum)
//     .map((item: TableElementsItemProps, index: number) => {
//       if (item.formElementModel && !item.formElementModel.uuId) {
//         item.formElementModel.uuId = Maths.uuid()
//       }
//       if (index % colNum < colNum - 1) {
//         param.push(item)
//       } else {
//         param.push(item)
//         tableData.push(param)
//         param = []
//       }
//     })
//   //添加重复行后更新缓存
//   const changeTableCopyInfo = () => {
//     console.log('aaaaaaaaaa')

//     //处理重复行后数据更新
//     const copyRows: any = []
//     repeatRows.current
//       ?.filter((idx: { type: string }) => idx.type === 'del')
//       .map((item: { startRow: any; rowspan: any }) => {
//         if (Number(item.rowspan) < 1) {
//           copyRows.push(item.startRow)
//         }
//         for (let i = 0; i < item.rowspan; i++) {
//           // 处理重复行内 多行合并行
//           copyRows.push(item.startRow + i)
//         }
//       })
//     const valueArr: any = []
//     const { nowFormulaInfo } = $store.getState()
//     nowTableElementsRef.current.map((item: { coord: string; formElementModel: any }) => {
//       const nowCoord = parseInt(item.coord.split(',')[0])
//       if (copyRows?.includes(nowCoord)) {
//         if (!item.formElementModel) {
//           valueArr.push({
//             uuId: Maths.uuid(),
//             elementValue: '',
//             valueContent: '',
//           })
//         } else {
//           const valueObjArr = nowFormulaInfo.newaddValues.filter(idx => idx.uuId === item.formElementModel.uuId)
//           valueArr.push({
//             uuId: item.formElementModel.uuId,
//             elementValue:
//               valueObjArr.length > 0 ? valueObjArr[0].elementValue : item.formElementModel.value || '',
//             valueContent:
//               valueObjArr.length > 0 ? valueObjArr[0].valueContent : item.formElementModel.value || '',
//           })
//         }
//       }
//     })
//     //更新添加重复行之后公式
//     nowTableElementsRef.current.map((item: { formElementModel: { uuId: any; designFormulas: string } }) => {
//       if (item.formElementModel) {
//         const newDesignFormula = formulaInfo.filter(
//           idx => item.formElementModel && idx.formlaId === item.formElementModel.uuId
//         )
//         if (newDesignFormula.length !== 0) {
//           item.formElementModel.designFormulas = JSON.stringify(newDesignFormula[0])
//         }
//       }
//       return item
//     })
//     //更新公式坐标

//     formulaInfo = formulaInfo.map(item => {
//       item.variable.map((idx: { coord: string; id: any }) => {
//         idx.coord = $(`.tableRow[data-uuid="${idx.id}"]`).attr('data-coord') || idx.coord
//       })
//       item.coord = $(`.tableRow[data-uuid="${item.formlaId}"]`).attr('data-coord') || item.coord
//       return item
//     })
//     //处理表格数据为可展示数据
//     const tableDataNum: any[][] = []
//     nowTableElementsRef.current
//       .filter((item: { coord: string }) => parseInt(item.coord.split(',')[1]) < colNum)
//       .map((item: TableElementsItemProps, index: number) => {
//         if (item.formElementModel && !item.formElementModel.uuId) {
//           item.formElementModel.uuId = Maths.uuid()
//         }
//         if (index % colNum < colNum - 1) {
//           param.push(item)
//         } else {
//           param.push(item)
//           tableDataNum.push(param)
//           param = []
//         }
//       })
//     //存储重复行相关
//     $store.dispatch({
//       type: 'SET_APPROVAL_FORMULA_INFO',
//       data: {
//         formulaInfo,
//         newaddValues: valueArr,
//         rowNum: tableDataNum.length,
//         tableArr: JSON.stringify(tableMergeArrRef.current),
//         heightArr,
//         tableElements: nowTableElementsRef.current,
//       },
//     })
//   }

//   //更新重新发起公式的值
//   useEffect(() => {
//     const timer = setTimeout(async () => {
//       //筛选重复的行
//       const delRows = repeatRows.current?.filter((idx: { type: string }) => idx.type === 'del')
//       //剔除重复行的没用废物公式
//       if (delRows?.length > 0) {
//         formulaInfo = formulaInfo.filter(
//           idx => $(`.tableRow[data-uuid="${idx.formlaId}"]`).attr('data-newadd') === '0'
//         )
//       }
//       delRows?.map((item: { rowspan: any; startRow: any; parentRow: any }) => {
//         //是否多行
//         const rowspan = item.rowspan
//         //当前行行坐标
//         const row = item.startRow
//         //父亲行坐标
//         const parentRowNum = item.parentRow
//         //当前重复行的父亲行，也就是复制行的来源
//         const parentRowObj = nowTableElementsRef.current.filter(
//           (idx: { coord: string }) => parseInt(idx.coord.split(',')[0]) === parentRowNum
//         )
//         //重复行的信息
//         const copyRowInfo = nowTableElementsRef.current.filter(
//           (idx: any) => parseInt(idx.coord.split(',')[0]) === row
//         )
//         //新生成重复行
//         const newRow = parentRowObj.map((idx: { coord: string; formElementModel: any }) => {
//           const nowCoordCol = parseInt(idx.coord.split(',')[1])
//           const newCoord = row + ',' + nowCoordCol
//           const newUuid = copyRowInfo[nowCoordCol].formElementModel
//             ? copyRowInfo[nowCoordCol].formElementModel.uuId
//             : ''
//           const newDesignFormula = formulaInfo.filter(
//             idx =>
//               parentRowObj[nowCoordCol].formElementModel &&
//               idx.formlaId === parentRowObj[nowCoordCol].formElementModel.uuId
//           )
//           if (!idx.formElementModel) {
//             return {
//               ...idx,
//               formElementModel: null,
//               coord: newCoord,
//               isCopyRow: true,
//             }
//           }
//           return {
//             ...idx,
//             formElementModel: {
//               ...idx.formElementModel,
//               designFormulas: newDesignFormula.length > 0 ? JSON.stringify(newDesignFormula[0]) : '',
//               value: '', //唯一标识数据复制
//               uuId: newUuid,
//               parentUuId: parentRowObj[nowCoordCol].formElementModel
//                 ? parentRowObj[nowCoordCol].formElementModel.uuId
//                 : '',
//             },
//             coord: newCoord,
//             isCopyRow: true,
//           }
//         })
//         //修改复制后公式的计算值
//         newRow.map((item: any) => {
//           if (item.formElementModel && item.formElementModel.type === 'formula') {
//             const newFormulaInfoItem = JSON.parse(
//               JSON.stringify(JSON.parse(item.formElementModel.designFormulas))
//             )
//             newFormulaInfoItem.variable.map((idx: { plugType: string; coord: string; id: string }) => {
//               //修改复制公式中对应数值控件的uuid
//               if (idx.plugType === 'table') {
//                 const coordNow = $(`.tableRow[data-uuid="${idx.id}"]`).attr('data-coord') || idx.coord
//                 const nowRowCoord = parseInt(coordNow.split(',')[0])
//                 const nowColCoord = parseInt(coordNow.split(',')[1])
//                 const newCoord = nowRowCoord + rowspan + ',' + nowColCoord
//                 if (nowRowCoord >= parentRowNum && nowRowCoord < parentRowNum + rowspan) {
//                   idx.coord = newCoord
//                   idx.id = newRow[nowColCoord].formElementModel.uuId
//                 }
//               }
//               return idx
//             })
//             newFormulaInfoItem.formlaId = item.formElementModel.uuId
//             newFormulaInfoItem.coord = item.coord
//             formulaInfo.push(newFormulaInfoItem)
//           }
//         })
//         handleCopyTableFormula(parentRowObj, newRow)
//       })
//       //重新触发计算
//       //获取所有输入框
//       if (delRows?.length > 0) {
//         let inputNumvals: any = []
//         formulaInfo.map(item => {
//           inputNumvals = inputNumvals.concat(item.variable)
//         })
//         inputNumvals.map((item: { id: string }) => {
//           changeFormulaByFormula(item.id, changeData)
//         })
//       }
//       changeTableCopyInfo()
//     }, 200)

//     return () => {
//       clearTimeout(timer)
//     }
//   }, [])

//   const testnowParentRow = (startRow: any, type: string) => {
//     const newRepeatRow = repeatRows.current.map((item: any) => {
//       let _parentRow = item.parentRow
//       if (startRow <= item.startRow && item.type == 'del') {
//         _parentRow = type === 'add' ? _parentRow + 1 : _parentRow - 1
//         return {
//           ...item,
//           parentRow: _parentRow,
//         }
//       } else {
//         return { ...item }
//       }
//     })
//     repeatRows.current = [...newRepeatRow]
//   }
//   /**
//    * 点击添加重复行
//    * @param row 点击的行
//    */
//   //记录重复行添加了几行
//   let repeatAddArr: any[] = []
//   const addCopyRow = async (row: number, rowspan: number) => {
//     const brotherArr = repeatAddArr.filter(idx => idx.startRow === row)
//     const nowParentRow = row

//     //没有则记录
//     if (brotherArr.length === 0) {
//       repeatAddArr.push({
//         startRow: row,
//         hasChild: 0,
//       })
//     } else {
//       repeatAddArr = repeatAddArr.map(idx => {
//         // 当前重复行

//         if (idx.startRow === row) {
//           idx.hasChild += 1
//         }
//         if (idx.startRow > row) {
//           testnowParentRow(idx.startRow, 'add')

//           // 重复行时，当前重复行以后的重复行行数+1
//           idx.startRow += 1
//         }
//         return idx
//       })
//     }
//     //之前是否添加了节点  brotherArr[0].hasChild * rowspan 乘以重复行的合并行数
//     const brotherNum = brotherArr.length === 0 ? 0 : brotherArr[0].hasChild * rowspan
//     //行号加上前面的
//     row += brotherNum

//     //复制行的原始数据
//     const parentRow = nowTableElementsRef.current.filter(
//       (item: { coord: string }) =>
//         parseInt(item.coord.split(',')[0]) >= nowParentRow &&
//         parseInt(item.coord.split(',')[0]) <= nowParentRow + rowspan - 1
//     )

//     //处理复制后的行
//     const newRow: any = getNewRow(parentRow, brotherArr, formulaInfo, row, rowspan, repeatAddArr)

//     // 检查重复行是否有唯一标识、冲销、回写控件，有则添加到维护集合
//     checkRepeatOnly(newRow, parentRow)

//     //添加重复行的前半部分表格数据
//     const prevTableData = nowTableElementsRef.current
//       .filter((item: { coord: string }) => parseInt(item.coord.split(',')[0]) <= row + rowspan - 1)
//       .map((item: { formElementModel: { type: string; designFormulas: string } }) => {
//         let newDesignFormula = null
//         if (item.formElementModel && item.formElementModel.type === 'formula') {
//           const oldDesigns = JSON.parse(item.formElementModel.designFormulas)
//           const newVariable = oldDesigns.variable.map((idx: { coord: string }) => {
//             const variableRowCoord = parseInt(idx.coord?.split(',')[0])
//             const variableColCoord = parseInt(idx.coord?.split(',')[1])
//             if (variableRowCoord > row + rowspan - 1) {
//               idx.coord = variableRowCoord + rowspan + ',' + variableColCoord
//             }
//             return idx
//           })
//           oldDesigns.variable = newVariable
//           newDesignFormula = oldDesigns
//         }
//         if (!newDesignFormula) {
//           return {
//             ...item,
//           }
//         }
//         return {
//           ...item,
//           formElementModel: {
//             ...item.formElementModel,
//             designFormulas: JSON.stringify(newDesignFormula),
//           },
//         }
//       })
//     //添加重复行的后半部分表格数据
//     const nextTableData = nowTableElementsRef.current
//       .filter((item: { coord: string }) => parseInt(item.coord.split(',')[0]) > row + rowspan - 1)
//       .map((item: { coord: string; formElementModel: { type: string; designFormulas: string } }) => {
//         const nowCoordRow = parseInt(item.coord.split(',')[0])
//         const nowCoordCol = parseInt(item.coord.split(',')[1])
//         const newCoord = nowCoordRow + rowspan + ',' + nowCoordCol
//         let newDesignFormula = null
//         if (item.formElementModel && item.formElementModel.type === 'formula') {
//           const oldDesigns = JSON.parse(item.formElementModel.designFormulas)
//           oldDesigns.coord = newCoord
//           const newVariable = oldDesigns.variable.map((idx: { coord: string }) => {
//             const variableRowCoord = parseInt(idx?.coord?.split(',')[0])
//             const variableColCoord = parseInt(idx?.coord?.split(',')[1])
//             if (variableRowCoord > row + rowspan - 1) {
//               idx.coord = variableRowCoord + rowspan + ',' + variableColCoord
//             }
//             return idx
//           })
//           oldDesigns.variable = newVariable
//           newDesignFormula = oldDesigns
//         }
//         if (!newDesignFormula) {
//           return {
//             ...item,
//             coord: newCoord,
//           }
//         }
//         return {
//           ...item,
//           formElementModel: {
//             ...item.formElementModel,
//             designFormulas: JSON.stringify(newDesignFormula),
//           },
//           coord: newCoord,
//         }
//       })
//     //新增后的新表格数据,处理公式
//     const newMergeArr: any[] = []
//     tableMergeArrRef.current.map((item: { row: number; col: any; rowspan: any; colspan: any }) => {
//       if (item.row >= row && item.row < row + rowspan) {
//         const newMerge = {
//           row: item.row + rowspan,
//           col: item.col,
//           rowspan: item.rowspan,
//           colspan: item.colspan,
//         }
//         newMergeArr.push(newMerge)
//       }
//       if (item.row >= row + rowspan) {
//         item.row = item.row + rowspan
//       }
//       return item
//     })
//     tableMergeArrRef.current = [...tableMergeArrRef.current, ...newMergeArr]
//     const newTableData = [...prevTableData, ...newRow, ...nextTableData]
//     nowTableElementsRef.current = newTableData
//     //修改复制后公式的计算值
//     newRow.map((item: any) => {
//       if (item.formElementModel && item.formElementModel.type === 'formula') {
//         const newFormulaInfoItem = JSON.parse(item.formElementModel.designFormulas)
//         newFormulaInfoItem.variable.map((idx: { plugType: string; coord: string; id: string }) => {
//           //修改复制公式中对应数值控件的uuid
//           if (idx.plugType === 'table') {
//             const nowRowCoord = parseInt(idx.coord.split(',')[0])
//             const nowColCoord = parseInt(idx.coord.split(',')[1])
//             const newCoord = nowRowCoord + rowspan + ',' + nowColCoord
//             if (nowRowCoord >= nowParentRow && nowRowCoord < nowParentRow + rowspan) {
//               idx.coord = newCoord
//               idx.id = newRow[nowColCoord].formElementModel.uuId
//             }
//           }
//           return idx
//         })
//         newFormulaInfoItem.formlaId = item.formElementModel.uuId
//         newFormulaInfoItem.coord = item.coord
//         formulaInfo.push(newFormulaInfoItem)
//       }
//     })

//     await handleCopyTableFormula(parentRow, newRow)
//     //更新重复行按钮
//     const newRepeatRow = repeatRows.current.map((item: { startRow: any }) => {
//       const rowNum = Number(item.startRow)

//       if (rowNum > row) {
//         return {
//           ...item,
//           startRow: rowNum + rowspan,
//         }
//       } else {
//         return { ...item }
//       }
//     })
//     scrollTopNum.current = $('.approval-detail-content .ant-tabs-content-holder').scrollTop()
//     const nowTableDataInfo: any[] = []
//     let nowParam: any = []
//     //处理表格数据为可展示数据
//     nowTableElementsRef.current
//       .filter((item: { coord: string }) => parseInt(item.coord.split(',')[1]) < colNum)
//       .map((item: TableElementsItemProps, index: number) => {
//         if (index % colNum < colNum - 1) {
//           nowParam.push(item)
//         } else {
//           nowParam.push(item)
//           nowTableDataInfo.push(nowParam)
//           nowParam = []
//         }
//       })

//     repeatRows.current = [
//       ...newRepeatRow,
//       {
//         startRow: row + rowspan,
//         rowspan: rowspan,
//         type: 'del',
//         parentRow: nowParentRow,
//       },
//     ]
//     console.log('更新表格')

//     //更新表格
//     tableRef.current?.hotInstance.updateSettings({
//       mergeCells: tableMergeArrRef.current,
//       data: nowTableDataInfo,
//     })
//     //保持滚动高度
//     $('.approval-detail-content .ant-tabs-content-holder').animate({ scrollTop: scrollTopNum.current }, 0)
//     changeTableCopyInfo()
//   }

//   /**
//    * 点击删除重复行
//    * @param row
//    */
//   const delCopyRow = async (row: number, rowspan: number, parentRow?: number | undefined) => {
//     //删除记录
//     repeatAddArr = repeatAddArr.map(idx => {
//       if (idx.startRow === parentRow) {
//         idx.hasChild -= 1
//       }
//       if (Number(idx.startRow) > Number(parentRow)) {
//         testnowParentRow(idx.startRow, 'del')
//       }
//       if (idx.startRow > row) {
//         // 重复行时，当前重复行以后的重复行行数-1
//         idx.startRow -= 1
//       }
//       return idx
//     })
//     //删除重复行的前半部分表格数据
//     const prevTableData = nowTableElementsRef.current.filter(
//       (item: { coord: string }) => parseInt(item.coord.split(',')[0]) < row
//     )
//     //要删除的行
//     // const delTableData = nowTableElementsRef.current.filter((item: { coord: string }) => {
//     //   parseInt(item.coord.split(',')[0]) >= row && parseInt(item.coord.split(',')[0]) <= row + rowspan - 1
//     // })
//     //要删除的行
//     const delTableData = nowTableElementsRef.current.filter(
//       (item: { coord: string }) =>
//         parseInt(item.coord.split(',')[0]) >= row && parseInt(item.coord.split(',')[0]) <= row + rowspan - 1
//     )
//     //删除重复行的后半部分表格数据
//     const nextTableData = nowTableElementsRef.current
//       .filter((item: { coord: string }) => parseInt(item.coord.split(',')[0]) > row + rowspan - 1)
//       .map((item: { coord: string }) => {
//         const nowCoordRow = parseInt(item.coord.split(',')[0])
//         const nowCoordCol = parseInt(item.coord.split(',')[1])
//         return {
//           ...item,
//           coord: nowCoordRow - rowspan + ',' + nowCoordCol,
//         }
//       })
//     //删除后的新表格数据,设置公式
//     const newTableData = [...prevTableData, ...nextTableData]
//     nowTableElementsRef.current = newTableData
//     await handleDelFormula(delTableData)
//     const { outBackData } = $store.getState()
//     //删除行清除冲销数据
//     delTableData.map((item: any) => {
//       if (item.formElementModel) {
//         const uuId = item.formElementModel.uuId
//         if (outBackData[uuId]) {
//           outBackData[uuId] = null
//         }
//         // 删除已选唯一标识
//         delOnlySymble(uuId)
//       }
//     })
//     const newRepeatRows = repeatRows.current
//       .filter((item: { startRow: number }) => item.startRow !== row)
//       .map((item: { startRow: number }) => {
//         if (item.startRow > row) {
//           return {
//             ...item,
//             startRow: item.startRow - rowspan,
//           }
//         }
//         return { ...item }
//       })
//     scrollTopNum.current = $('.approval-detail-content .ant-tabs-content-holder').scrollTop()
//     // setRepeatRows(newRepeatRows)
//     const nowTableDataInfo: any[] = []
//     let nowParam: any = []
//     //处理表格数据为可展示数据
//     nowTableElementsRef.current
//       .filter((item: { coord: string }) => parseInt(item.coord.split(',')[1]) < colNum)
//       .map((item: TableElementsItemProps, index: number) => {
//         if (index % colNum < colNum - 1) {
//           nowParam.push(item)
//         } else {
//           nowParam.push(item)
//           nowTableDataInfo.push(nowParam)
//           nowParam = []
//         }
//       })
//     repeatRows.current = newRepeatRows
//     //更新表格
//     tableMergeArrRef.current = tableMergeArrRef.current
//       .filter((idx: { row: number }) => idx.row !== row)
//       .map((item: { row: number }) => {
//         if (item.row > row) {
//           item.row = item.row - rowspan
//         }
//         return item
//       })
//     changeTableCopyInfo()
//     //更新表格
//     tableRef.current?.hotInstance.updateSettings(
//       {
//         mergeCells: tableMergeArrRef.current,
//         data: nowTableDataInfo,
//       },
//       false
//     )
//     //保持滚动高度
//     $('.approval-detail-content .ant-tabs-content-holder').animate({ scrollTop: scrollTopNum.current }, 0)
//   }

//   //渲染重复行添加删除按钮
//   const renderRepeatBtn = (title: string, row: number, rowspan: number, parentRow: number | undefined) => {
//     return (
//       <div
//         className="addTableRow"
//         onClick={() => {
//           title === '添加' ? addCopyRow(row, rowspan) : delCopyRow(row, rowspan, parentRow)
//         }}
//       >
//         {title}
//       </div>
//     )
//   }
//   //渲染审批表单表格内控件
//   const ShowTableItem = (props: any) => {
//     if (!props.value) {
//       return null
//     }
//     //重复行数据
//     const repeatData = repeatRows.current
//       ? repeatRows.current.filter((item: { startRow: string }) => item.startRow == props.row)
//       : []
//     //表格坐标
//     const coord = props.row + ',' + props.col
//     //是否显示重复行添加按钮
//     let hasReportBtn =
//       (selectApprovalTab === 'triggerApproval' || isApprovalSend) && repeatData.length !== 0 && props.col === 0
//     if (state && state !== 7) {
//       hasReportBtn = false
//     }

//     //优化性能加载
//     if (props.value && props.value.formElementModel) {
//       return (
//         <div
//           className="tableRow"
//           data-elementid={props.value.id}
//           data-uuid={props.value.formElementModel.uuId}
//           data-newadd={props.value.isCopyRow}
//           data-coord={coord}
//           style={{ backgroundColor: props.value.color }}
//         >
//           {hasReportBtn &&
//             repeatData[0].type === 'add' &&
//             renderRepeatBtn(
//               '添加',
//               props.row,
//               parseInt(repeatData[0].rowspan),
//               parseInt(repeatData[0].parentRow)
//             )}
//           {hasReportBtn &&
//             repeatData[0].type === 'del' &&
//             renderRepeatBtn(
//               '删除',
//               props.row,
//               parseInt(repeatData[0].rowspan),
//               parseInt(repeatData[0].parentRow)
//             )}
//           {getShowFormItemByType(
//             props.value.formElementModel,
//             teamId,
//             eventId,
//             props.onChange,
//             props.name,
//             props.state,
//             coord
//           )}
//         </div>
//       )
//     } else {
//       return (
//         <div
//           className="tableRow none-data"
//           data-elementid={props.value.id}
//           data-newadd={props.value.newadd}
//           data-coord={coord}
//           style={{ backgroundColor: props.value.color }}
//         >
//           {hasReportBtn &&
//             repeatData[0].type === 'add' &&
//             renderRepeatBtn(
//               '添加',
//               props.row,
//               parseInt(repeatData[0].rowspan),
//               parseInt(repeatData[0].parentRow)
//             )}
//           {hasReportBtn &&
//             repeatData[0].type === 'del' &&
//             renderRepeatBtn(
//               '删除',
//               props.row,
//               parseInt(repeatData[0].rowspan),
//               parseInt(repeatData[0].parentRow)
//             )}
//         </div>
//       )
//     }
//   }
//   //生成指定长度数组并赋值
//   const getList = (len: number) => [...new Array(len).keys()]
//   //表单表格设置
//   const hotSettings: Handsontable.GridSettings = {
//     data: tableData,
//     licenseKey: 'non-commercial-and-evaluation',
//     colHeaders: false,
//     allowEmpty: true,
//     readOnly: true,
//     stretchH: 'none',
//     className: 'formTableTd',
//     autoColumnSize: false,
//     autoRowSize: false,
//     outsideClickDeselects: false,
//     mergeCells: tableMergeArrRef.current,
//     viewportRowRenderingOffset: 200,
//     copyPaste: false,
//     height: 'auto',
//     beforeOnCellMouseDown: (e: any) => {
//       const _con = $('.ant-select') // 设置目标区域
//       if (e !== null && !_con.is(e.target) && _con.has(e.target).length === 0) {
//         e.stopImmediatePropagation()
//       }
//     },
//   }
//   const parseWidths = widthArrPx ? JSON.parse(widthArrPx) : []
//   const tableRef = useRef<HotTable>(null)
//   return (
//     <div id="form-table" key={formElementModel.id} style={{ paddingLeft: paddingLeftPx }}>
//       <HotTable ref={tableRef} settings={hotSettings}>
//         {getList(colNum).map((_item, index: number) => (
//           <HotColumn
//             key={index}
//             currentColClassName="form-col"
//             className="form-td"
//             width={parseWidths[index] || 200}
//             readOnly={true}
//             allowHtml={true}
//           >
//             <ShowTableItem hot-renderer name={name} state={state} onChange={changeData} />
//           </HotColumn>
//         ))}
//       </HotTable>
//     </div>
//   )
// }
// export default RenderTable

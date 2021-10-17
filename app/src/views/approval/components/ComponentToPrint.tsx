import * as React from 'react'
import { ApprovalDetailProps, FormElementModelProps, TableElementsItemProps } from './ApprovalDettail'
import $c from 'classnames'
import { compare } from '@/src/components/approval-table/getData/approvalHandle'
interface Props {
  data: ApprovalDetailProps
  type: string
  name: string
  triggerData: any
  selstate?: any
}

//计算两个时间得时间差
const timeFunc = (startTime: string, endTime: string) => {
  const dateBegin = new Date(startTime).getTime()
  const dateEnd = new Date(endTime).getTime()
  const dateDiff = dateEnd - dateBegin //时间差的毫秒数
  const dayDiff = Math.floor(dateDiff / (24 * 3600 * 1000)) //计算出相差天数
  const leave1 = dateDiff % (24 * 3600 * 1000) //计算天数后剩余的毫秒数
  const hours = Math.floor(leave1 / (3600 * 1000)) //计算出小时数
  return {
    day: dayDiff,
    hour: hours,
  }
}

//处理表格数据展示
const handleData = (formElementModel: FormElementModelProps) => {
  let elementVal = ''
  if (!formElementModel.value || formElementModel.value === '') {
    return elementVal
  }
  switch (formElementModel.type) {
    case 'select':
      elementVal = JSON.parse(formElementModel.value)[0].val
      break
    case 'radio':
      elementVal = JSON.parse(formElementModel.value)[0].val
      break
    case 'checkbox':
      JSON.parse(formElementModel.value).map((m: { val: string }) => {
        elementVal += `${m.val}  `
      })
      break
    case 'peoSel':
      elementVal = ''
      JSON.parse(formElementModel.value).map((m: { userName: string }) => {
        elementVal += `${m.userName}  `
      })
      break
    case 'deptSel':
      elementVal = ''
      JSON.parse(formElementModel.value).map((m: { deptName: string }) => {
        elementVal += `${m.deptName}  `
      })
      break
    case 'roleSel':
      elementVal = ''
      JSON.parse(formElementModel.value).map((m: { deptName: string; roleName: string }) => {
        elementVal += `${m.deptName}-${m.roleName}  `
      })
      break
    case 'time':
      let timeTxt = formElementModel.value.split(',')[0] || ''
      if (formElementModel.dateType == 2) {
        timeTxt = timeTxt && timeTxt.length > 5 ? timeTxt.split(' ')[1] : timeTxt
      }
      elementVal = timeTxt
      break
    case 'dateRange':
      let startTime = formElementModel.value.split(',')[0] || ''
      let endTime = formElementModel.value.split(',')[1] || ''
      if (formElementModel.dateType == 2) {
        startTime = startTime && startTime.length > 5 ? startTime.split(' ')[1] : startTime
        endTime = endTime && endTime.length > 5 ? endTime.split(' ')[1] : endTime
      }
      elementVal = startTime + '-' + endTime
      if (formElementModel && formElementModel.totalTime == 1 && startTime != '' && endTime != '') {
        const totalRange = timeFunc(startTime, endTime)
        if (formElementModel.dateType == 2) {
          elementVal += ` 合计：${totalRange.hour + '小时'}`
        } else {
          elementVal += ` 合计：${totalRange.day}天${
            formElementModel.dateType == 1 ? totalRange.hour + '小时' : ''
          }`
        }
      }
      break
    case 'attachment':
      let realAttch = JSON.parse(formElementModel.value)
      if (realAttch.length == 0) {
        realAttch = formElementModel.approvalFormElementContentModels || []
        realAttch.map((m: { content: string }) => {
          elementVal += `${m.content} `
        })
      } else {
        realAttch.map((m: { fileName: string }) => {
          elementVal += `${m.fileName} `
        })
      }
      break
    default:
      elementVal = `${formElementModel.value}${formElementModel.unit || ''}`
      break
  }

  return elementVal
}

/**获取表格行类型和字段 */
const getRowType = (arr: any[]) => {
  let typeStr = ''
  let rowLen = 0
  arr.map(item => {
    if (item.formElementModel && item.formElementModel.name && item.formElementModel.type != 'text') {
      typeStr += item.formElementModel.name + item.formElementModel.type
      rowLen += 1
    }
  })
  return {
    str: typeStr,
    len: rowLen,
  }
}

//处理表格中需要合并得行
const SetTableInfo = ({ tableInfo }: { tableInfo: FormElementModelProps }) => {
  let row: TableElementsItemProps[] = []
  const rows: any[] = [] //将表格数据分行处理
  tableInfo.tableElements.map((item, index) => {
    if (index % tableInfo.colNum == 0) {
      row = []
      rows.push(row)
    }
    if (index % tableInfo.colNum < tableInfo.colNum) {
      row.push(item)
    }
  })
  let repeatRow: any[] = [] //重复行行号
  //获取重复行行号
  rows.map((item, i) => {
    rows.map((idx, j) => {
      if (i != j) {
        const itemTypeStr = getRowType(item)
        const idxTypeStr = getRowType(idx)
        if (itemTypeStr.str === idxTypeStr.str && itemTypeStr.len === idxTypeStr.len) {
          repeatRow.push(
            {
              row: i,
              len: itemTypeStr.len,
            },
            {
              row: j,
              len: itemTypeStr.len,
            }
          )
        }
      }
    })
  })
  repeatRow = [...new Set(repeatRow)]
  let useCoor = '' //使用得行
  let mxNum = 0 //重复行明细数字
  //排除不需要展示得
  const realList = tableInfo.tableElements.filter(
    item =>
      item.formElementModel &&
      item.formElementModel.visible === 1 &&
      item.formElementModel.type &&
      item.formElementModel.type !== 'text' &&
      item.formElementModel.type !== 'CuttingLine' &&
      item.formElementModel.type.indexOf('_table') === -1
  )
  const showTr = (item: TableElementsItemProps, index: number) => {
    const nowCoor = item.coord.split(',')[0]
    const showVal = handleData(item.formElementModel)
    //是否有合并行
    const isInRepeat = isInRepeatRow(repeatRow, nowCoor)
    const title = item.formElementModel.name
    if (isInRepeat.isIn && nowCoor !== useCoor) {
      useCoor = nowCoor
      mxNum += 1
      return (
        <tr className="print_tr" key={index}>
          <td className="print_title" rowSpan={isInRepeat.rowLen}>
            明细{mxNum}
          </td>
          <td className="print_title" dangerouslySetInnerHTML={{ __html: title }}></td>
          <td className="print_value" colSpan={5}>
            {showVal}
          </td>
        </tr>
      )
    } else if (isInRepeat.isIn && nowCoor === useCoor) {
      return (
        <tr className="print_tr" key={index}>
          <td className="print_title" dangerouslySetInnerHTML={{ __html: title }}></td>
          <td className="print_value" colSpan={5}>
            {showVal}
          </td>
        </tr>
      )
    } else {
      return (
        <tr className="print_tr" key={index}>
          <td className="print_title" colSpan={2} dangerouslySetInnerHTML={{ __html: title }}></td>
          <td className="print_value" colSpan={5}>
            {showVal}
          </td>
        </tr>
      )
    }
  }
  return (
    <>
      {realList.map((item, index) => {
        return showTr(item, index)
      })}
    </>
  )
}

/**
 * 是否在重复行中
 */
const isInRepeatRow = (arr: any[], idx: string) => {
  let isIn = false
  let rowLen = 0
  arr.map(item => {
    if (item.row === parseInt(idx)) {
      isIn = true
      rowLen = item.len
      return false
    }
  })
  return {
    isIn: isIn,
    rowLen: rowLen,
  }
}

//自定义显示打印数据
const getFormItem = (formElementModel: any) => {
  const type = formElementModel.type
  if (type === 'text') {
    let showName = formElementModel.name
    if ($tools.isJsonString(formElementModel.name)) {
      const newName = JSON.parse(formElementModel.name)
      showName = newName[0].txt
      newName.map((item: { txt: string | RegExp; color: any; size: any }) => {
        const reg = new RegExp(item.txt)
        const replaceTxt = showName.match(reg) || showName
        showName = showName.replace(
          reg,
          `<span style="color:${item.color};font-size:${item.size || 12}px;">${replaceTxt}</span>`
        )
      })
    }
    return (
      <pre
        key={formElementModel.id}
        style={{ background: '#fff', border: 0 }}
        className="text-row"
        dangerouslySetInnerHTML={{ __html: showName }}
      ></pre>
    )
  } else if (type === 'CuttingLine') {
    return null
  } else if (type === 'table') {
    return renderPrintTable(formElementModel)
  } else {
    const showType = formElementModel.type
    let showVal = formElementModel.value
    if (showType === 'select') {
      showVal = formElementModel.value ? JSON.parse(formElementModel.value)[0]?.val : ''
    } else if (showType === 'peoSel') {
      const selectPerson = formElementModel.value ? JSON.parse(formElementModel.value) : []
      showVal = selectPerson.map((m: { userName: string }) => {
        return m.userName + ' '
      })
    } else if (showType === 'deptSel') {
      const selectPerson = formElementModel.value ? JSON.parse(formElementModel.value) : []
      showVal = selectPerson.map((m: { deptName: string }) => {
        return m.deptName + ' '
      })
    } else if (showType === 'roleSel') {
      const selectPerson = formElementModel.value ? JSON.parse(formElementModel.value) : []
      showVal = selectPerson.map((m: { deptName: string; roleName: string }) => {
        return m.deptName + '-' + m.roleName + ' '
      })
    } else if (showType === 'attachment') {
      const selectPerson = formElementModel.value ? JSON.parse(formElementModel.value) : []
      showVal = selectPerson.map((m: { fileName: string }) => {
        return m.fileName + ' '
      })
    } else if (showType === 'radio') {
      showVal =
        formElementModel.value && JSON.parse(formElementModel.value).length !== 0
          ? JSON.parse(formElementModel.value)[0].val
          : ''
    } else if (showType === 'checkbox') {
      const selectPerson = formElementModel.value ? JSON.parse(formElementModel.value) : []
      showVal = selectPerson.map((m: { val: string }) => {
        return m.val + ' '
      })
    }
    return (
      <div className="print-row" key={formElementModel.id}>
        <div className="title">{formElementModel.name}</div>
        <div className="print-value">{showVal}</div>
      </div>
    )
  }
}

//当前样式表单表格处理
const renderPrintTable = (formElementModel: any) => {
  const { colNum, tableElements, tableArr } = formElementModel
  let param: TableElementsItemProps[] = []
  const tableData: TableElementsItemProps[][] = []
  tableElements
    .filter((item: { coord: string }) => parseInt(item.coord.split(',')[1]) < colNum)
    .map((item: TableElementsItemProps, index: number) => {
      if (index % colNum < colNum - 1) {
        param.push(item)
      } else {
        param.push(item)
        tableData.push(param)
        param = []
      }
    })
  const mergerCells = JSON.parse(tableArr)
  const isInMerge = (row: any, col: any) => {
    let mergeInfo = {
      rowspan: 1,
      colspan: 1,
    }
    mergerCells.map((item: { row: any; col: any; rowspan: any; colspan: any }) => {
      if (item.row == row && item.col == col) {
        mergeInfo = {
          rowspan: item.rowspan,
          colspan: item.colspan,
        }
        return false
      }
    })
    return mergeInfo
  }

  // 当前坐标是否在合并项里面,true：不显示
  const isInMergerCells = (idx: string) => {
    let _isIn = false
    const _row = Number(idx.split(',')[0])
    const _col = Number(idx.split(',')[1])
    mergerCells.map((item: { row: any; col: any; rowspan: any; colspan: any }) => {
      if (
        _row >= item.row && //开始行
        item.rowspan + item.row - 1 >= _row && //结束行
        _col >= item.col && //开始列
        item.col + item.colspan - 1 >= _col //结束列
      ) {
        _isIn = true
      }
    })
    return _isIn
  }

  return (
    <table key={formElementModel.id} className="approval-print-table">
      <tbody>
        {tableData.map((item, index) => (
          <tr key={index}>
            {item.map((idx, indexchild) => {
              const mergeInfo = isInMerge(index, indexchild)
              if (idx.formElementModel) {
                const showType = idx.formElementModel.type
                let showVal: any = idx.formElementModel.value
                if (showType === 'text') {
                  let showName = idx.formElementModel.name
                  if ($tools.isJsonString(idx.formElementModel.name)) {
                    const newName = JSON.parse(idx.formElementModel.name)
                    showName = newName[0].txt
                    newName.map((item: { txt: string | RegExp; color: any; size: any }) => {
                      const reg = new RegExp(item.txt)
                      const replaceTxt = showName.match(reg) || showName
                      showName = showName.replace(
                        reg,
                        `<span style="color:${item.color};font-size:${item.size || 12}px;">${replaceTxt}</span>`
                      )
                    })
                  }
                  showVal = showName
                } else if (showType === 'select') {
                  showVal = idx.formElementModel.value ? JSON.parse(idx.formElementModel.value)[0]?.val : ''
                } else if (showType === 'peoSel') {
                  const selectPerson = idx.formElementModel.value ? JSON.parse(idx.formElementModel.value) : []
                  showVal = selectPerson.map((m: { userName: string }) => {
                    return m.userName + ' '
                  })
                } else if (showType === 'deptSel') {
                  const selectPerson = idx.formElementModel.value ? JSON.parse(idx.formElementModel.value) : []
                  showVal = selectPerson.map((m: { deptName: string }) => {
                    return m.deptName + ' '
                  })
                } else if (showType === 'roleSel') {
                  const selectPerson = idx.formElementModel.value ? JSON.parse(idx.formElementModel.value) : []
                  showVal = selectPerson.map((m: { deptName: string; roleName: string }) => {
                    return m.deptName + '-' + m.roleName + ' '
                  })
                } else if (showType === 'attachment') {
                  const selectPerson = idx.formElementModel.value ? JSON.parse(idx.formElementModel.value) : []
                  showVal = selectPerson.map((m: { fileName: string }) => {
                    return m.fileName + ' '
                  })
                } else if (showType === 'radio') {
                  showVal =
                    idx.formElementModel.value && JSON.parse(idx.formElementModel.value).length !== 0
                      ? JSON.parse(idx.formElementModel.value)[0].val
                      : ''
                } else if (showType === 'checkbox') {
                  const selectPerson = idx.formElementModel.value ? JSON.parse(idx.formElementModel.value) : []
                  showVal = selectPerson.map((m: { val: string }) => {
                    return m.val + ' '
                  })
                }
                return (
                  <td rowSpan={mergeInfo.rowspan} colSpan={mergeInfo.colspan} key={indexchild}>
                    <div className="table-row">
                      {showType !== 'text' && showType !== 'CuttingLine' && (
                        <div className={$c('left', { hideName: idx.formElementModel.showName === 0 })}>
                          {idx.formElementModel.name}
                        </div>
                      )}
                      <pre
                        className="right"
                        // dangerouslySetInnerHTML={{ __html: isNaN(showVal) ? '' : showVal }}
                        dangerouslySetInnerHTML={{ __html: showVal == 'NaN' ? '' : showVal }}
                      ></pre>
                    </div>
                  </td>
                )
              } else {
                return (
                  // 当前项不在mergerCells 中，就应该要显示？
                  <td
                    data-coord={idx.coord}
                    rowSpan={mergeInfo.rowspan}
                    colSpan={mergeInfo.colspan}
                    // style={{
                    //   display:
                    //     mergerCells.length === 0 || (mergerCells.length !== 0 && mergeInfo.colspan !== 1)
                    //       ? ''
                    //       : 'none',
                    // }}
                    style={{
                      display: isInMergerCells(idx.coord) ? 'none' : '',
                    }}
                    key={indexchild}
                  >
                    <div style={{ minHeight: 20, minWidth: 20 }}></div>
                  </td>
                )
              }
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

//自定义按当前样式打印
const renderPrintForm = (dataSource: any, name: string, selstate: any) => {
  return (
    <div className="print-form">
      {(name !== 'triggerApproval' || (selstate && selstate != 7 && name === 'triggerApproval')) &&
        dataSource.map((item: any) => item.formElementModel && getFormItem(item.formElementModel))}
      {name === 'triggerApproval' &&
        selstate &&
        selstate == 7 &&
        dataSource.map((item: any) => getFormItem(item))}
    </div>
  )
}

const getTrailModels = (data: any) => {
  let showHtml = `<tr className="print_tr">
    <td className="print_title">${data.username}</td>
    <td className="print_value border-right">发起申请</td>
    <td className="print_title no-border">${data.time}</td>
  </tr>`
  data.trailModels.map((item: any) => {
    if (item.approvers.length > 0) {
      item.approvers.map((idx: any) => {
        let title = ''
        const status = idx.status
        if (status == 0) {
          title = '待审批'
        } else if (status == 1) {
          title = '审批通过'
        } else if (status == 2) {
          title = '审批拒绝'
        } else if (status == 3) {
          title = '协同'
        } else if (status == 4) {
          title = '回退中'
        } else if (status == 7) {
          title = '等待发起'
        } else if (status == 8) {
          title = '知会'
        } else if (status == 10) {
          title = '暂存待办'
        }
        if (status == 3 && !data.activitiProcessId) {
          title = '放弃'
        }
        if (status == 3 && data.activitiProcessId) {
          title = '协同'
        }
        //回复展示
        let messageHtml = ''
        if (idx.messageModel != null && idx.messageModel.length != 0) {
          $.each(idx.messageModel, (m, n) => {
            messageHtml += `<span class="message_answer">${n.username}回复${idx.username}: ${n.content}     ${n.createTime}</span>`
            if (n.childComments && n.childComments.length != 0) {
              messageHtml += findChildComments(n.childComments, n.username)
            }
          })
        }
        showHtml += `<tr className="print_tr">
            <td className="print_title">${idx.username}</td>
            <td className="print_value border-right">
              ${title} ${idx.reason || ''} ${messageHtml}
            </td>
            <td className="print_title no-border">${idx.time}</td>
          </tr>`
      })
    }
  })
  return showHtml
}

const findChildComments = (data: any, username: any) => {
  let messageHtml = ''
  $.each(data, (m, n) => {
    messageHtml += `<span class="message_answer">${n.username}回复${username}: ${n.content}     ${n.createTime}</span>`
    if (n.childComments && n.childComments.length != 0) {
      messageHtml += findChildComments(n.childComments, n.username)
    }
  })
  return messageHtml
}

//打印内容
export class ComponentToPrint extends React.PureComponent<Props> {
  constructor(props: any) {
    super(props)
    this.state = {
      fresh: false,
    }
  }
  componentDidMount() {
    //更新使表格加载完
    this.setState({ fresh: true })
  }
  public render() {
    const { data, type, name, triggerData, selstate } = this.props
    const { nowUser } = $store.getState()
    //打印时间
    const printTime = $tools.formatDate(new Date(), 'YYYY-MM-DD H:I:S')
    //打印数据
    const newData: any = data.formContentModels.sort(compare('elementPosition'))

    const printData = name === 'triggerApproval' && selstate && selstate == 7 ? triggerData : newData
    return (
      <div className="print-body-container" style={{ padding: '20px' }}>
        <div className="print-msg-body">
          <div className="print-msg-header">
            <div
              className="header-name"
              style={{
                width: '100%',
                minHeight: 22,
                lineHeight: 1,
                fontSize: 16,
                textAlign: 'center',
                fontWeight: 'bold',
                marginBottom: 16,
                padding: '0 70px',
              }}
            >
              {data?.username}申请【{$tools.htmlDecodeByRegExp(data?.title)}】的审批
            </div>
            {data?.state === 1 && (
              <img
                style={{
                  position: 'absolute',
                  right: '30px',
                  top: '50px',
                  width: '110px',
                  height: '90px',
                }}
                src={$tools.asAssetsPath('/images/common/pass.png')}
              />
            )}
            {data?.state === 2 && (
              <img
                style={{
                  position: 'absolute',
                  right: '30px',
                  top: '50px',
                  width: '110px',
                  height: '90px',
                }}
                src={$tools.asAssetsPath('/images/common/refuse.png')}
              />
            )}
            <div className="print-info" style={{ display: 'flex', marginBottom: 12, padding: '0 5px' }}>
              <div className="send-name text-ellipsis" style={{ flex: 1 }}>
                发起人部门-岗位：{data?.teamName} {this.getRoleList(data?.roleList)}
              </div>
              <div className="print-name text-ellipsis" style={{ marginRight: 30 }}>
                打印人：{nowUser}
              </div>
              <div className="print-time text-ellipsis">打印时间：{printTime}</div>
            </div>
          </div>
          {type === 'style' && renderPrintForm(printData, name, selstate)}
          {type === 'table' && this.printByTable(name, triggerData, data.formContentModels, selstate)}
          {data.trailModels && data.trailModels.length > 0 && (
            <div className="print-info-box">
              <p>审批流程信息</p>
              <table className="table_print_content">
                <tbody dangerouslySetInnerHTML={{ __html: getTrailModels(data) }}></tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }
  //渲染表格形式打印
  printByTable = (name: any, triggerData: any, dataSource: any, selstate: any) => {
    let dataList = dataSource
    if (name === 'triggerApproval' && selstate && selstate == 7) {
      dataList = triggerData.map((item: any) => {
        return {
          ...item,
          formElementModel: { ...item },
        }
      })
    }
    //排除不需要展示得
    const realList = dataList.filter(
      (item: any) =>
        item.formElementModel.visible === 1 &&
        item.type !== 'text' &&
        item.type !== 'CuttingLine' &&
        item.type.indexOf('_table') === -1
    )
    return (
      <table className="table_print_content">
        <tbody>
          {realList.map((item: any, index: number) => {
            if (item.type !== 'table') {
              let elementName = item.elementName
              if (item.formElementModel != null) {
                elementName = item.formElementModel.name
                if ($tools.isJsonString(item.formElementModel.name)) {
                  const newName = JSON.parse(item.formElementModel.name)
                  elementName = newName[0].txt
                }
              }
              const showValue = handleData(item.formElementModel)
              return (
                <tr className="print_tr" key={index}>
                  <td className="print_title" colSpan={2}>
                    {elementName}
                  </td>
                  <td className="print_value" colSpan={5}>
                    {showValue}
                  </td>
                </tr>
              )
            } else {
              return <SetTableInfo tableInfo={item.formElementModel} key={index} />
            }
          })}
        </tbody>
      </table>
    )
  }
  //渲染发起人部门岗位
  getRoleList = (list: { teamName: string; roleName: string }[]) => {
    let roleStr = ''
    list?.map(item => {
      roleStr += item.teamName + '-' + item.roleName + '  '
    })
    return roleStr
  }
}

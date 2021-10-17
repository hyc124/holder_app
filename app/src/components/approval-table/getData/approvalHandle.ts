import React from 'react'
import 'handsontable/dist/handsontable.full.css'
import { message } from 'antd'
import * as Maths from '@/src/common/js/math'
import { ActModelProps } from '@/src/views/approval/components/ApprovalDettail'
export const renderOutBack = React.createContext({})
/**
 * 重复行相关处理方法
 */

//是否关联唯一标识
export const isRelationOnyElement = (uuid: string, isedit: any) => {
  const { executeData } = $store.getState()
  const { onlyElementData } = $store.getState()
  let isIn = false
  //是否唯一标识相关
  /**
   * type 0 普通读取控件
   *      1 唯一标识控件
   *      3 回写明细控件
   */
  onlyElementData &&
    onlyElementData.map((item: { uuid: string; type: number; parentUuid: any }) => {
      if (
        (item.uuid === uuid && item.type === 1 && isedit === 1) || //原始行
        (item.uuid === uuid && item.type === 1 && item.parentUuid) || //重复行
        (item.uuid === uuid && (item.type === 0 || item.type === 3))
      ) {
        //判断当前控件，如果是唯一标识且有编辑权限则可以选择，普通读取控件不可编辑
        isIn = true
        return false
      }
    })
  //冲销回写
  executeData &&
    executeData.outBackAllUuid &&
    executeData.outBackAllUuid.map((item: string) => {
      if (item === uuid) {
        isIn = true
        return false
      }
    })
  return isIn
}

// 检查添加重复行唯一标识是否有值
export const checkRepeatFlag = (parentRow: any, repeatAddArr: any) => {
  const { formulaNumvalObj } = $store.getState()
  let _repeatAddArr: any[] = repeatAddArr
  let _isValus = false
  let repeatRowVal = false //唯一标识行和冲销行，重复时不带数据
  // 添加重复行是否有唯一标识（唯一标识有没有选值）
  for (let i = 0; i < parentRow.length; i++) {
    const _isCheckRepeat = checkRepeat(parentRow[i].formElementModel?.uuId)

    if (_isCheckRepeat.isRepeatValue) {
      // 有唯一标识和冲销的重复行，重复行时不带数据(在组件渲染的时候用)
      repeatRowVal = _isCheckRepeat.isRepeatValue
    }

    // 重复行是否有值 (根据type来判断，值在formulaNumvalObj还是value)
    if (
      _isCheckRepeat.isonly &&
      ((parentRow[i].formElementModel?.type == 'numval' && !formulaNumvalObj[_isCheckRepeat.uid]) ||
        (parentRow[i].formElementModel?.type != 'numval' && parentRow[i].formElementModel?.value == '') ||
        !formulaNumvalObj[_isCheckRepeat.uid])
    ) {
      message.error('请选择数据')
      _repeatAddArr = []
      return
    } else if (
      _isCheckRepeat.isoutBack &&
      ((parentRow[i].formElementModel?.type == 'numval' && !formulaNumvalObj[_isCheckRepeat.uid]) ||
        (parentRow[i].formElementModel?.type != 'numval' && parentRow[i].formElementModel?.value == '') ||
        !formulaNumvalObj[_isCheckRepeat.uid])
    ) {
      //有回写，冲销是否有值
      message.error('请选择回写数据')
      _repeatAddArr = []
      return
    } else if (
      _isCheckRepeat.isTips &&
      ((parentRow[i].formElementModel?.type == 'numval' && !formulaNumvalObj[_isCheckRepeat.uid]) ||
        (parentRow[i].formElementModel?.type != 'numval' && parentRow[i].formElementModel?.value == '') ||
        !formulaNumvalObj[_isCheckRepeat.uid])
    ) {
      //普通回写控件是否有值
      message.error('请选择回写数据')
      _repeatAddArr = []
      return
    } else if (
      (_isCheckRepeat.isonly &&
        ((parentRow[i].formElementModel?.type == 'numval' && !formulaNumvalObj[_isCheckRepeat.uid]) ||
          (parentRow[i].formElementModel?.type != 'numval' && parentRow[i].formElementModel?.value == '') ||
          !formulaNumvalObj[_isCheckRepeat.uid])) ||
      (_isCheckRepeat.isoutBack &&
        ((parentRow[i].formElementModel?.type == 'numval' && !formulaNumvalObj[_isCheckRepeat.uid]) ||
          (parentRow[i].formElementModel?.type != 'numval' && parentRow[i].formElementModel?.value == '') ||
          !formulaNumvalObj[_isCheckRepeat.uid]))
    ) {
      // 有唯一标识和冲销的重复行，重复行时不带数据，唯一标识和冲销不在重复行时，重复行时将被重复行的数据带上
      _isValus = true
    }
  }

  return {
    repeatAddArr: _repeatAddArr,
    isValus: _isValus,
    repeatRowVal: repeatRowVal,
  }
}

// 检查添加重复行唯一标识是否有值
export const checkRepeat = (uid: any) => {
  const { onlyElementData } = $store.getState()
  let _isonly = false
  let _outBack = false
  let _uuid = ''
  let isTips = false
  let _isRepeatValue = false //是否是重复行和冲销行
  let _normalVal = true //当前控件是否是普通控件（除开唯一标识，冲销，回写控件提示的控件。重复行是不带被重复行的值）
  for (let j = 0; j < onlyElementData.length; j++) {
    // 是否是唯一标识
    if (uid === onlyElementData[j].uuid && onlyElementData[j].type === 1) {
      _isonly = true
      _uuid = uid
      _isRepeatValue = true
      _normalVal = false
      break
    }
    // 是否是冲销
    if (uid === onlyElementData[j].uuid && onlyElementData[j].type === 3) {
      _outBack = true
      _uuid = uid
      // _isRepeatValue = true
      _normalVal = false
      break
    }
    // 普通回写控件提示
    if (uid === onlyElementData[j].uuid && onlyElementData[j].type === 0 && onlyElementData[j].onlyUuId) {
      isTips = true
      _uuid = uid
      _normalVal = false
      break
    }
  }
  return {
    isonly: _isonly,
    isoutBack: _outBack,
    uid: _uuid,
    isTips: isTips,
    isRepeatValue: _isRepeatValue,
    normalVal: _normalVal,
  }
}

// 检查重复行是否有唯一标识、冲销、回写控件，有则添加到维护集合
export const checkRepeatOnly = (newRow: any, parentRow: any) => {
  const { onlyElementData } = $store.getState()
  const _newOnlyArr: any = []
  for (let i = 0; i < newRow.length; i++) {
    const _isCheckRepeat = checkRepeatAndOnlyUid(parentRow[i].formElementModel?.uuId, newRow)
    // 重复行是否有值
    if (_isCheckRepeat.item) {
      _newOnlyArr.push({
        uuid: newRow[i].formElementModel?.uuId, //新生成的重复行uuid（被重复行有唯一标识）
        type: _isCheckRepeat.item.type,
        typeFlag: _isCheckRepeat.item.typeFlag,
        onlyUuId: _isCheckRepeat.onlyUuId ? _isCheckRepeat.onlyUuId : _isCheckRepeat.item.onlyUuId,
        parentUuid: _isCheckRepeat.item.uuid, //重复行的parentId
      })
    }
    if (_newOnlyArr.length > 0) {
      $store.dispatch({
        type: 'SAVE_EVENT_FORM_RELATION_SET',
        data: { onlyElementData: [...onlyElementData, ..._newOnlyArr] },
      })
    }
  }
}

//处理复制后的行
export const getNewRow = (
  parentRow: any,
  brotherArr: any,
  formulaInfo: any,
  row: any,
  rowspan: any,
  repeatAddArr: any
) => {
  const { executeData, formulaNumvalObj } = $store.getState()
  const _test: any = checkRepeatFlag(parentRow, repeatAddArr)
  if (!_test) {
    return
  }
  //如果有重复行可冲销
  const copyBackIds: any[] = []
  const newRow = parentRow.map((item: { coord: string; formElementModel: any }, i: number) => {
    const nowCoordRow = parseInt(item.coord.split(',')[0])
    const nowCoordCol = parseInt(item.coord.split(',')[1])
    // 处理重复行内合并行的行号 将重复行行号减去被重复行的起始行，重复行内合并行的行号加上
    // _nowRowspanChildRow 重复行内合并行的每一行的行号
    const _nowRowspanChildRow =
      brotherArr.length === 0 ? nowCoordRow - row : nowCoordRow - brotherArr[0].startRow
    const newCoord = row + rowspan + _nowRowspanChildRow + ',' + nowCoordCol
    const newUuid = Maths.uuid()
    const _isRepeatValue = checkRepeat(item.formElementModel?.uuId)

    const newDesignFormula = formulaInfo.filter(
      (idx: { formlaId: any }) =>
        parentRow[nowCoordCol].formElementModel && idx.formlaId === parentRow[nowCoordCol].formElementModel.uuId
    )
    if (
      parentRow[nowCoordCol].formElementModel &&
      executeData.outBackAllUuid &&
      executeData.outBackAllUuid.includes(parentRow[nowCoordCol].formElementModel.uuId)
    ) {
      copyBackIds.push(newUuid)
    }
    if (!item.formElementModel) {
      return {
        ...item,
        formElementModel: null,
        coord: newCoord,
        isCopyRow: true,
      }
    }

    return {
      ...item,
      formElementModel: {
        ...item.formElementModel,
        designFormulas: newDesignFormula.length > 0 ? JSON.stringify(newDesignFormula[0]) : '',
        value:
          _isRepeatValue.isTips && !_test.repeatRowVal //普通回写控件带值(且不是唯一标识行)，
            ? formulaNumvalObj[parentRow[nowCoordCol].formElementModel.uuId]
            : '', //唯一标识数据复制 // value: '',
        uuId: newUuid,
        parentUuId: parentRow[nowCoordCol].formElementModel ? parentRow[nowCoordCol].formElementModel.uuId : '',
        repeatRowVal: _test.repeatRowVal, //repeatRowVal为true代表重复行有唯一标识和冲销（不带重复行数据），为false代表需要带重复行值
        repeatValue: _isRepeatValue.isonly || _isRepeatValue.isoutBack || _isRepeatValue.isTips ? true : false, //isonly 唯一标识/isoutBack冲销/isTips普通回写
        normalValue: _isRepeatValue.normalVal, //普通控件
      },
      coord: newCoord,
      isCopyRow: true,
    }
  })
  if (copyBackIds.length !== 0) {
    const { outBackIds } = $store.getState()
    //保存可冲销id集合
    const newKey = copyBackIds[0]
    outBackIds[newKey] = copyBackIds
    $store.dispatch({ type: 'SET_OUT_BACK_IDS', data: outBackIds })
  }
  return newRow
}

//添加重复行的前半部分表格数据
export const getRepeatRowPrev = (data: any) => {
  const { nowTableElementsRef, row, rowspan } = data
  const prevTableData = nowTableElementsRef.current
    .filter((item: { coord: string }) => parseInt(item.coord.split(',')[0]) <= row + rowspan - 1)
    .map((item: { formElementModel: { type: string; designFormulas: string } }) => {
      let newDesignFormula = null
      if (item.formElementModel && item.formElementModel.type === 'formula') {
        const oldDesigns = JSON.parse(item.formElementModel.designFormulas)
        const newVariable = oldDesigns.variable.map((idx: { coord: string }) => {
          const variableRowCoord = parseInt(idx.coord?.split(',')[0])
          const variableColCoord = parseInt(idx.coord?.split(',')[1])
          if (variableRowCoord > row + rowspan - 1) {
            idx.coord = variableRowCoord + rowspan + ',' + variableColCoord
          }
          return idx
        })
        oldDesigns.variable = newVariable
        newDesignFormula = oldDesigns
      }
      if (!newDesignFormula) {
        return {
          ...item,
        }
      }
      return {
        ...item,
        formElementModel: {
          ...item.formElementModel,
          designFormulas: JSON.stringify(newDesignFormula),
        },
      }
    })
  return prevTableData
}
//添加重复行的后半部分表格数据
export const getNextTableData = (data: any) => {
  const { nowTableElementsRef, row, rowspan } = data
  const nextTableData = nowTableElementsRef.current
    .filter((item: { coord: string }) => parseInt(item.coord.split(',')[0]) > row + rowspan - 1)
    .map((item: { coord: string; formElementModel: { type: string; designFormulas: string } }) => {
      const nowCoordRow = parseInt(item.coord.split(',')[0])
      const nowCoordCol = parseInt(item.coord.split(',')[1])
      const newCoord = nowCoordRow + rowspan + ',' + nowCoordCol
      let newDesignFormula = null
      if (item.formElementModel && item.formElementModel.type === 'formula') {
        const oldDesigns = JSON.parse(item.formElementModel.designFormulas)
        oldDesigns.coord = newCoord
        const newVariable = oldDesigns.variable.map((idx: { coord: string }) => {
          const variableRowCoord = parseInt(idx?.coord?.split(',')[0])
          const variableColCoord = parseInt(idx?.coord?.split(',')[1])
          if (variableRowCoord > row + rowspan - 1) {
            idx.coord = variableRowCoord + rowspan + ',' + variableColCoord
          }
          return idx
        })
        oldDesigns.variable = newVariable
        newDesignFormula = oldDesigns
      }
      if (!newDesignFormula) {
        return {
          ...item,
          coord: newCoord,
        }
      }
      return {
        ...item,
        formElementModel: {
          ...item.formElementModel,
          designFormulas: JSON.stringify(newDesignFormula),
        },
        coord: newCoord,
      }
    })

  return nextTableData
}

export const checkIsBackId = (uid: any, puid: any) => {
  const { onlyElementData } = $store.getState()
  let isIn = false
  onlyElementData &&
    onlyElementData.map((item: { uuid: any; type: number; typeFlag: string }) => {
      if (
        (item.uuid === uid || item.uuid === puid) &&
        item.type === 3 &&
        item.typeFlag === 'form_serial_number'
      ) {
        //判断当前控件，如果是唯一标识且有编辑权限则可以选择，普通读取控件不可编辑
        isIn = true
        return false
      }
    })
  return isIn
}

// 唯一标识获取（现在唯一标识是一个集合）
export const getOnlyElementUuid = (arr: any, uid: any) => {
  let _type = false
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].uuid === uid && arr[i].type === 1) {
      _type = true
      break
    }
  }
  return _type
}

// 冲销处理
export const isArr = (newArr: any, outBackData: any, formElementUuid: any, approvalId: any, index: any) => {
  for (let m = 0; m < newArr.length; m++) {
    // 行号相同，取对应的parentUuId
    const _parentUuId = newArr[m].formElementModel?.parentUuId
    // 当前选择数据匹配（重复行parentId是否在返回数据formElementUuid中，是则将值添加到对应的重复行uuid里面）
    if (formElementUuid[index] == _parentUuId) {
      const _nowId = newArr[m].formElementModel?.uuId
      outBackData[_nowId] = approvalId
    }
  }
}

// 对比当前uuid是否在唯一标识集合里面
export const isOnlyArr = (onlyElementData: any, elementRelationDataList: any, uuid: any) => {
  let isIn = true
  onlyElementData?.map((item: { uuid: any; onlyUuId: any }) => {
    if (item.uuid === uuid && item.onlyUuId && isOnlyUuId(elementRelationDataList, item.onlyUuId)) {
      //判断当前控件，如果是该控件对应的唯一标识，则可编辑
      isIn = false
      return false
    }
  })
  return isIn
}

// 对比当前uuid是否是回写关联的uuid
export const isOnlyUuId = (elementRelationDataList: any, uid: any) => {
  let isIn = false
  // 与关联关系做对比
  elementRelationDataList?.map((item: { uuid: any; onlyUuId: any }) => {
    if (uid.includes(item.uuid)) {
      isIn = true
      return false
    }
  })
  return isIn
}

export const setDoms = (selectTypes: any, i: any, showTxt: any, changeData: any) => {
  const updateData = {}
  for (let j = 0; j < selectTypes[i].formElementUuid.length; j++) {
    $(`.plugElementRow[data-uuid=${selectTypes[i].formElementUuid[j]}]`)
      .find('input')
      .val(showTxt)
    updateData[selectTypes[i].formElementUuid[j]] = showTxt
    // changeData && changeData({ uuId: selectTypes[i].formElementUuid[j] }, showTxt, showTxt)
  }
  changeData && changeData({ data: updateData, contentArr: showTxt })
}

/**
 *
 * @param formElementUuid 冲销控件uuid集合
 * @param approvalId 冲销id
 * @param isRepeat 是否是重复行
 * @param newArr 重复行数据
 */
export const saveOutBackData = (
  formElementUuid: any,
  approvalId: any,
  outBackData: any,
  isRepeat?: any,
  newArr?: any
) => {
  if (!isRepeat) {
    for (let i = 0; i < formElementUuid.length; i++) {
      outBackData[formElementUuid[i]] = approvalId
    }
  } else {
    for (let i = 0; i < formElementUuid.length; i++) {
      isArr(newArr, outBackData, formElementUuid, approvalId, i)
    }
  }

  $store.dispatch({
    type: 'SAVE_EVENT_FORM_RELATION_SET',
    data: { outBackData: outBackData },
  })
}

//重复行冲销处理
export const setRepeatDoms = (
  selectTypes: any,
  record: any,
  _newArr: any,
  _parentUuId: any,
  m: any,
  changeData: any,
  outBackData: any
) => {
  const updateData = {}
  let showTxt = ''
  for (let i = 0; i < selectTypes.length; i++) {
    // 当前选择冲销数据
    showTxt = record[selectTypes[i].uuid]
    // 当前选择冲销数据
    if (selectTypes[i].uuid === 'form_serial_number') {
      // 存储已选冲销单号
      saveOutBackData(selectTypes[i].formElementUuid, record.approvalId, outBackData, 'isRepeat', _newArr)
    }
    if (selectTypes[i].formElementUuid.includes(_parentUuId)) {
      const _nowId = _newArr[m].formElementModel?.uuId
      $(`.plugElementRow[data-uuid=${_nowId}]`)
        .find('input')
        .val(showTxt)
      updateData[_nowId] = showTxt
    }
  }
  changeData && changeData({ data: updateData, contentArr: showTxt })
}

// 重复行，唯一标识处理
export const checkRepeatAndOnlyUid = (uid: any, newRow?: any) => {
  const { onlyElementData } = $store.getState()
  let _isonly = false
  let _uuid = ''
  let _item
  let _onlyUuId
  for (let j = 0; j < onlyElementData.length; j++) {
    // 是否是唯一标识
    if (uid === onlyElementData[j].uuid) {
      _isonly = onlyElementData[j].type === 1 ? true : false
      _uuid = onlyElementData[j].uuid
      _item = onlyElementData[j]
      // break
    }

    if (uid === onlyElementData[j].uuid && onlyElementData[j].type === 3) {
      if (newRow) {
        const onlyUuId = onlyElementData[j].onlyUuId
        for (let i = 0; i < newRow.length; i++) {
          if (onlyUuId.includes(newRow[i].formElementModel?.parentUuId)) {
            _onlyUuId = newRow[i].formElementModel.uuId
          }
        }
      }
    }
  }
  return {
    isonly: _isonly,
    uid: _uuid,
    item: _item,
    onlyUuId: _onlyUuId,
  }
}

export const delOnlySymble = (uid: any) => {
  //已选择表单编号
  const { elementRelationDataList } = $store.getState()
  const _newArr = elementRelationDataList
  for (let i = 0; i < _newArr.length; i++) {
    if (elementRelationDataList[i].uuid === uid) {
      _newArr.splice(i, 1)
    }
  }
  $store.dispatch({
    type: 'SAVE_EVENT_FORM_RELATION_SET',
    data: { elementRelationDataList: _newArr },
  })
}

//计算审批花费时间
export const getExpend = (spend: number) => {
  //定义参数可返回当天的日期和时间
  const nMS = spend
  //定义参数 EndTime减去NowTime参数获得返回距 1970 年 1 月 1 日之间的毫秒数
  const nD = Math.floor(nMS / (1000 * 60 * 60 * 24))
  //定义参数 获得天数
  const nH = Math.floor(nMS / (1000 * 60 * 60)) % 24
  //定义参数 获得小时
  const nM = Math.floor(nMS / (1000 * 60)) % 60
  //定义参数 获得分钟
  const nS = Math.floor(nMS / 1000) % 60
  if (nD > 0) {
    return nD + '天' + nH + '小时'
  }
  if (nH > 0) {
    return nH + '小时' + nM + '分钟'
  }
  if (nM > 0) {
    return nM + '分钟' + nS + '秒'
  }
  if (nS > 0) {
    return nS + '秒'
  }
  return '0小时'
}

/**
 * 获取审批状态展示
 */
export const getProvideStatus = (status: number, activitiProcessId: string | null) => {
  let statusColor = '#4285f4'
  let statusTitle = '审批'
  switch (status) {
    case 0:
      statusColor = '#FBBC05'
      statusTitle = '待审批'
      break
    case 1:
      statusColor = '#34A853'
      statusTitle = '已同意'
      break
    case 2:
      statusColor = '#EA4335'
      statusTitle = '已拒绝'
      break
    case 4:
      statusColor = '#FBBC05'
      statusTitle = '已回退'
      break
    case 6:
      statusColor = '#EA4335'
      statusTitle = '已撤回'
      break
    case 7:
      statusColor = ''
      statusTitle = '等待发起'
      break
    case 8:
      statusTitle = '知会'
      break
    case 9:
      statusTitle = '替换节点'
      break
    case 10:
      statusColor = '#FBBC05'
      statusTitle = '暂存待办'
      break
    case 11:
      statusTitle = '替换成员'
      break
    case 12:
      statusTitle = '移交工作'
      break
    case 13:
      statusTitle = '备注'
      break
    case 18:
      statusTitle = '加签'
      break
    case 19:
      statusTitle = '协同'
      break
    default:
      break
  }
  if (status === 3 && !activitiProcessId) {
    statusColor = '#a8afad'
    statusTitle = '放弃'
  }
  if (status === 3 && activitiProcessId) {
    statusTitle = '协同'
  }
  return {
    color: statusColor,
    txt: statusTitle,
  }
}

/**
 * 对象型数组排序
 * @param {*} property
 * value1 - value2:正序,反之 倒序
 */
export const compare = (property: string) => {
  return function(a: any, b: any) {
    const value1 = parseInt(a[property])
    const value2 = parseInt(b[property])
    return value1 - value2
  }
}

export const isIn = (_id: any, _arr: any) => {
  let _isIn = false
  for (let i = 0; i < _arr.length; i++) {
    if (_arr[i].id === _id) {
      _isIn = true
      break
    }
  }
  return _isIn
}

//获取formelementuuid
export const getFormElementUuid = (arr: any[], uuid: string) => {
  let elementUuid = ''
  arr.map(item => {
    if (item.uuid === uuid) {
      elementUuid = item.formElementUuid
      return false
    }
  })
  return elementUuid
}

/**
 * 计算标题宽度自适应 特殊字符处理 '\./+~!@#$%^&*(_=<>`，
 * @param {*} str
 */
export const calculationWidth = (str: any) => {
  if (str) {
    let w = 0
    const num = str.match(/\d/g) //数字
    const ler = str.match(/[a-z]/gi) //字母
    const cna = str.match(/[^ -~]/g) //中文
    if (num !== null) w += num.length * 14.2
    if (ler !== null) w += ler.length * 13
    if (cna !== null) w += cna.length * 24
    w += _countStrWidth(str.match(/\:|;/g) || [], 7.5)
    w += _countStrWidth(str.match(/\.|!|`|'|\|/g) || [], 9)
    w += _countStrWidth(str.match(/\(|\)/g) || [], 10.5)
    w += _countStrWidth(str.match(/\*|_|\/|\\|\?/g) || [], 12)
    w += _countStrWidth(str.match(/\"/g) || [], 13.5)
    w += _countStrWidth(str.match(/\$|#|,|，|-/g) || [], 15)
    w += _countStrWidth(str.match(/\+|~|=|<|\[|\]|>|\^/g) || [], 18)
    w += _countStrWidth(str.match(/\@/g) || [], 21)
    w += _countStrWidth(str.match(/\%/g) || [], 22.5)
    w += _countStrWidth(str.match(/\@/g) || [], 24)
    w += _countStrWidth(str.match(/ /g) || [], 7)
    return w + 16
  }
  return 20
}

/**
 * 根据字符长度计算宽度
 */
export const _countStrWidth = (arr: string | any[], len: number) => {
  let strWdith = 0
  if (arr.length !== 0) {
    for (let i = arr.length; i--; ) {
      strWdith += len
    }
  }
  return strWdith
}
interface StateProps {
  processData: ActModelProps[]
  loading: boolean
  sendLoading: boolean
  nowCheckData: any[]
  selectTab: string
  pointManager: boolean
  pointManagerData: any[]
}

// 修改值后获取值
/**
 *
 * @param arr
 * @param uid
 * @param parId
 * @param normalvalue 父级id参与判断时，普通控件重复行时不带父级的值
 * @returns
 */
export const getChangeValueUuid = (arr: any, uid: any, parId?: any, normalvalue?: any) => {
  let _isIn = false
  let _isId = ''
  if (typeof arr == 'string') {
    if (arr == uid || (!normalvalue && parId && arr == parId)) {
      _isIn = true
      _isId = arr
    }
  } else if (Array.isArray(arr)) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == uid || (!normalvalue && parId && arr[i] == parId)) {
        _isIn = true
        _isId = arr[i]
        break
      }
    }
  }
  return {
    isIn: _isIn,
    isId: _isId,
  }
}

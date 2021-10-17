import React, { useState } from 'react'
import OutBackModal from './OutBackModal'
import { useSelector } from 'react-redux'
import { Input } from 'antd'
//聚焦-点击搜索框展示分类查询模块

const RenderOutBackInput = ({
  uuid,
  eventId,
  changeData,
  value,
  isEdit,
  parentUuId,
  coord,
}: // onlyElementData,
any) => {
  //是否显示选择表单号弹窗
  const { formulaNumvalObj } = $store.getState()
  const { elementRelationDataList, outBackData } = $store.getState()
  const onlyElementData = useSelector((store: StoreStates) => store.onlyElementData)
  const [visible, setVisible] = useState(false)
  //关闭弹窗
  const closeSymbolModal = () => {
    setVisible(false)
  }
  //获取表单编号
  const getFormNumber = () => {
    // 是否可以支持点击选择表单号
    if (isEdit === 1) {
      setVisible(true)
    }
  }

  //确定选择表单编号信息
  const sureSelectSymbol = (record: any, selectTypes: any) => {
    setSelectSymbolValue(parentUuId, coord, record, selectTypes, changeData)
    setVisible(false)
  }

  const setSelectSymbolValue = (
    parentUuId: any,
    coord: any,
    record: any,
    selectTypes: any,
    changeData: any
  ) => {
    const { nowFormulaInfo } = $store.getState()
    const updateData = {}
    let showTxt = ''
    if (!parentUuId) {
      // 非重复行
      for (let i = 0; i < selectTypes.length; i++) {
        showTxt = record[selectTypes[i].uuid]
        if (selectTypes[i].uuid === 'form_serial_number') {
          // 存储已选冲销单号
          saveOutBackData(selectTypes[i].formElementUuid, record.approvalId)
        }
        for (let j = 0; j < selectTypes[i].formElementUuid.length; j++) {
          $(`.plugElementRow[data-uuid=${selectTypes[i].formElementUuid[j]}]`)
            .find('input')
            .val(showTxt)
          updateData[selectTypes[i].formElementUuid[j]] = showTxt
          // changeData && changeData({ uuId: selectTypes[i].formElementUuid[j] }, showTxt, showTxt)
        }
      }
    } else {
      // 重复行（得到重复行数据）
      const _row = coord.split(',')[0]
      const _newArr = nowFormulaInfo.tableElements.filter(item => {
        const _repeatRow = item.coord.split(',')[0]
        if (_row == _repeatRow) {
          return item
        }
      })

      // 循环重复行
      for (let m = 0; m < _newArr.length; m++) {
        // 行号相同，取对应的parentUuId
        const _parentUuId = _newArr[m].formElementModel?.parentUuId
        for (let i = 0; i < selectTypes.length; i++) {
          // 当前选择冲销数据
          showTxt = record[selectTypes[i].uuid]
          // 当前选择冲销数据
          if (selectTypes[i].uuid === 'form_serial_number') {
            // 存储已选冲销单号
            saveOutBackData(selectTypes[i].formElementUuid, record.approvalId, 'isRepeat', _newArr)
          }
          if (selectTypes[i].formElementUuid.includes(_parentUuId)) {
            const _nowId = _newArr[m].formElementModel?.uuId
            $(`.plugElementRow[data-uuid=${_nowId}]`)
              .find('input')
              .val(showTxt)
            // changeData && changeData({ uuId: _nowId }, showTxt, showTxt)
            updateData[_nowId] = showTxt
          }
        }
      }
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
  const saveOutBackData = (formElementUuid: any, approvalId: any, isRepeat?: any, newArr?: any) => {
    if (!isRepeat) {
      for (let i = 0; i < formElementUuid.length; i++) {
        outBackData[formElementUuid[i]] = approvalId
      }
    } else {
      for (let i = 0; i < formElementUuid.length; i++) {
        for (let m = 0; m < newArr.length; m++) {
          // 行号相同，取对应的parentUuId
          const _parentUuId = newArr[m].formElementModel?.parentUuId
          // 当前选择数据匹配（重复行parentId是否在返回数据formElementUuid中，是则将值添加到对应的重复行uuid里面）
          if (formElementUuid[i] == _parentUuId) {
            const _nowId = newArr[m].formElementModel?.uuId
            outBackData[_nowId] = approvalId
          }
        }
        // isArr(newArr, outBackData, formElementUuid, approvalId, i)
      }
    }

    $store.dispatch({
      type: 'SAVE_EVENT_FORM_RELATION_SET',
      data: { outBackData: outBackData },
    })
  }

  // 对比当前uuid是否在唯一标识集合里面
  const isOnlyArr = () => {
    let isIn = true
    onlyElementData?.map((item: { uuid: any; onlyUuId: any }) => {
      if (item.uuid === uuid && item.onlyUuId && isOnlyUuId(item.onlyUuId)) {
        //判断当前控件，如果是该控件对应的唯一标识，则可编辑
        isIn = false
        return false
      }
    })
    return isIn
  }

  // 对比当前uuid是否是回写关联的uuid
  const isOnlyUuId = (uid: any) => {
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

  return (
    <>
      <Input
        onClick={() => {
          getFormNumber()
        }}
        value={formulaNumvalObj[uuid] || formulaNumvalObj[uuid] == '' ? formulaNumvalObj[uuid] : value}
        disabled={isOnlyArr() && isEdit === 1} //可编辑
        className={!isOnlyArr() && isEdit === 1 ? '' : 'disabledClick'}
        style={{ backgroundColor: '#f5f5f5', outline: 'none', cursor: 'pointer' }}
      />
      {visible && (
        <OutBackModal
          visible={visible}
          onClose={closeSymbolModal}
          onSure={sureSelectSymbol}
          eventId={eventId}
          uuid={uuid}
          parentUuId={parentUuId}
        />
      )}
    </>
  )
}

export default RenderOutBackInput

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

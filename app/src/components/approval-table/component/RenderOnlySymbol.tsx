import React, { useState } from 'react'
import OnlySymbolModal from './OnlySymbolModal'

//选择表单号弹窗
const RenderOnlySymbol = ({ eventId, changeData, uuid, parentUuId, coord }: any) => {
  //是否显示选择唯一标识弹窗
  const [visible, setVisible] = useState(false)
  const { nowFormulaInfo } = $store.getState()
  const { onlyElementData, elementRelationDataList, outBackData } = $store.getState()
  //显示弹窗
  const showOnlyModal = () => {
    setVisible(true)
  }

  //关闭弹窗
  const closeSymbolModal = () => {
    setVisible(false)
  }

  //确定选择唯一标识信息
  const sureSelectSymbol = (record: any) => {
    for (const key in record) {
      if (key !== 'key' && Object.prototype.hasOwnProperty.call(record, key)) {
        //显示contentvalue
        let showTxt = ''
        const fillValue = record[key].fillValue
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
          showTxt = record[key].fillValue
        }
        const realKey = record[key].formElementUuid

        const _row = coord?.split(',')[0]
        isRealKeyData(realKey, _row, showTxt, fillValue)

        if (record[key].baseFormDataId) {
          //缓存baseFormDataID
          if (record[key].isOnly === 1) {
            // 判断唯一标识
            // 唯一标识集合 record[key].formElementUuid
            const _newArr = elementRelationDataList || []
            for (let j = 0; j < record[key].formElementUuid.length; j++) {
              // parentUuId 重复行父级id
              const _check: any = checkOnlyData(parentUuId ? uuid : record[key].formElementUuid[j], _newArr)
              if (!_check.isin) {
                _newArr.push({
                  uuid: parentUuId ? uuid : record[key].formElementUuid[j],
                  dataId: record[key].baseFormDataId,
                })
              } else {
                _newArr[_check.index].dataId = record[key].baseFormDataId
              }
            }
            $store.dispatch({
              type: 'SAVE_EVENT_FORM_RELATION_SET',
              data: { elementRelationDataList: _newArr },
            })
          }
        }
      }
    }
    setVisible(false)
  }

  const isRealKeyData = (realKey: any, _row: any, showTxt: any, fillValue: any) => {
    for (let i = 0; i < realKey.length; i++) {
      const elementType = $(`.plugElementRow[data-uuid=${realKey[i]}]`).attr('data-type')
      // 填入值
      // 更改唯一标识
      changeOnlyFormDataId(uuid)
      if (parentUuId) {
        // 重复行（得到重复行数据）
        const _newArr = nowFormulaInfo.tableElements.filter(item => {
          const _repeatRow = item.coord.split(',')[0]
          if (_row == _repeatRow) {
            return item
          }
        })
        // 循环重复行
        isRepeatData(_newArr, realKey[i], elementType, showTxt, fillValue)
      } else {
        setOnlySelDoms(elementType, showTxt, realKey, fillValue)
      }
    }
  }

  const isRepeatData = (_newArr: any, key: any, elementType: any, showTxt: any, fillValue: any) => {
    // let _key = ''
    for (let m = 0; m < _newArr.length; m++) {
      // 行号相同，取对应的parentUuId
      const _parentUuId = _newArr[m].formElementModel?.parentUuId
      if (_parentUuId === key) {
        // _key = _newArr[m].formElementModel?.uuId
        setOnlySelDoms(elementType, showTxt, _newArr[m].formElementModel?.uuId, fillValue)
      }
    }
  }

  const changeOnlyFormDataId = (uuid: string) => {
    // 重复行（得到重复行数据）
    let changeBack = false
    for (let i = 0; i < onlyElementData.length; i++) {
      if (
        (onlyElementData[i].type == 3 || onlyElementData[i].type == 0) &&
        onlyElementData[i].onlyUuId &&
        onlyElementData[i].onlyUuId.includes(uuid)
      ) {
        if (onlyElementData[i].type == 3) {
          $store.dispatch({
            type: 'SET_FORMULA_NUMVAL_OBJ',
            data: { key: onlyElementData[i].uuid, value: '' },
          })
        }
        if (outBackData[onlyElementData[i].uuid]) {
          outBackData[onlyElementData[i].uuid] = null
          changeBack = true
        }
      }
    }
    if (changeBack) {
      $store.dispatch({
        type: 'SAVE_EVENT_FORM_RELATION_SET',
        data: { outBackData: outBackData },
      })
    }
  }

  const setOnlySelDoms = (elementType: any, val: any, uuid: any, fillValue?: any) => {
    const itemUuId = typeof uuid == 'string' ? new Array(uuid) : uuid
    const updateData = {}
    for (let i = 0; i < itemUuId.length; i++) {
      if (elementType === 'textarea') {
        $(`.plugElementRow[data-uuid=${itemUuId[i]}]`)
          .find('textarea')
          .val('')
          .val(val)
      } else {
        $(`.plugElementRow[data-uuid=${itemUuId[i]}]`)
          .find('input')
          .val('')
          .val(val)
          .addClass('maxFontNum')
      }
      console.log(itemUuId[i], fillValue, val)
      updateData[itemUuId[i]] = fillValue
    }
    changeData && changeData({ data: updateData, contentArr: fillValue, symbolVal: val })
  }

  // 检查唯一标识
  /**
   *
   * @param uids  当前选择唯一标识数组
   * @param arr 唯一标识数组
   */
  const checkOnlyData = (uid: any, arr: any) => {
    let _isIn = false
    let _index = 0
    if (!arr) {
      return {
        isin: _isIn,
        index: _index,
      }
    }
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].uuid == uid) {
        _isIn = true
        _index = i
        break
      }
    }
    return {
      isin: _isIn,
      index: _index,
    }
  }

  return (
    <>
      <span
        className="only-symbol"
        onClick={() => {
          showOnlyModal()
        }}
      ></span>
      {visible && (
        <OnlySymbolModal
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

export default RenderOnlySymbol

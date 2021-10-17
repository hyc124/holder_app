import { Input } from 'antd'
import $c from 'classnames'
import React, { CSSProperties } from 'react'
import RenderOnlySymbol from './RenderOnlySymbol'
import RenderOutBackInput from './RenderOutBack'
import * as Maths from '@/src/common/js/math'

import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import { checkIsBackId, getOnlyElementUuid, isRelationOnyElement } from '../getData/approvalHandle'

const RenderInput = ({
  formElementModel,
  formItemStyles,
  isAuth,
  eventId,
  name,
  changeData,
  coord,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  isAuth: boolean
  eventId: number
  name?: string
  changeData?: (item: any, value?: string, content?: string) => void
  coord: any
}) => {
  const { formulaNumvalObj, onlyElementData } = $store.getState()
  // 普通值填入
  let inputVal = ''
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    inputVal = formulaNumvalObj[formElementModel.uuId]
  } else {
    inputVal = formElementModel.value || ''
  }
  //修改输入框
  const changeInputVal = (e: any) => {
    const updateData = { [formElementModel.uuId]: e.target.value }
    changeData && changeData({ data: updateData, contentArr: e.target.value })
  }

  if (formElementModel.repeatValue && !formElementModel.repeatRowVal) {
    // 重复行没有唯一标识，但有冲销和普通回写控件，重复时带父级的值
    inputVal = formulaNumvalObj[formElementModel.parentUuId] || formElementModel.value || ''
  }

  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={'input'}
      data-uuid={formElementModel.uuId}
      data-mark={formElementModel.condition}
      data-isauth={formElementModel.edit === 0 ? false : true}
      data-isdef={formElementModel.isDefault === 1 ? true : false}
      data-isedit={formElementModel.special === 1 ? true : false}
      data-datetype={formElementModel.dateType}
      data-parentuuid={formElementModel.parentUuId}
      data-onlyflag={formElementModel.repeatRowVal}
      data-normalvalue={formElementModel.normalValue}
    >
      <div className={$c('plugRowLeft', { hideName: formElementModel.showName === 0 })}>
        {formElementModel.name}
      </div>
      <div className="plugRowRight">
        {onlyElementData && checkIsBackId(formElementModel.uuId, formElementModel.parentUuId) ? (
          <RenderOutBackInput
            uuid={formElementModel.uuId}
            value={formElementModel.value}
            eventId={eventId}
            changeData={changeData}
            isEdit={formElementModel.edit}
            parentUuId={formElementModel.parentUuId}
            coord={coord}
          />
        ) : (
          <>
            <Input
              disabled={!isAuth}
              key={Maths.uuid()}
              onChange={changeInputVal}
              defaultValue={
                Number(inputVal.length) > formElementModel.textNumber
                  ? inputVal.substring(0, formElementModel.textNumber)
                  : inputVal
              }
              placeholder={formElementModel.placeholder}
              maxLength={formElementModel.textNumber || 20}
            />
            {formElementModel.unit && <span className="unit">{formElementModel.unit}</span>}
          </>
        )}
        {/* 唯一标识 */}
        {(name === 'triggerApproval' || name === 'waitApproval') &&
          // !formElementModel.parentUuId && 重复行有唯一标识不显示
          onlyElementData &&
          isRelationOnyElement(formElementModel.uuId, formElementModel.edit) &&
          getOnlyElementUuid(onlyElementData, formElementModel.uuId) && (
            <RenderOnlySymbol
              eventId={eventId}
              changeData={changeData}
              uuid={formElementModel.uuId}
              parentUuId={formElementModel.parentUuId}
              coord={coord}
            />
          )}
      </div>
    </div>
  )
}

export default RenderInput

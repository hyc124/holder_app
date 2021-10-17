import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import { Input } from 'antd'
import $c from 'classnames'
import React, { CSSProperties } from 'react'
import RenderOnlySymbol from './RenderOnlySymbol'
import * as Maths from '@/src/common/js/math'
import { getOnlyElementUuid, isRelationOnyElement } from '../getData/approvalHandle'

/**多行输入控件 */
const RenderTextArea = ({
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
  //取缓存值
  const { formulaNumvalObj } = $store.getState()
  const { onlyElementData } = $store.getState()
  let textareaVal = ''
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    textareaVal = formulaNumvalObj[formElementModel.uuId]
  } else {
    textareaVal = formElementModel.value || ''
  }
  if (formElementModel.repeatValue && !formElementModel.repeatRowVal) {
    // 重复行没有唯一标识，但有冲销和普通回写控件，重复时带父级的值
    textareaVal = formulaNumvalObj[formElementModel.parentUuId] || formElementModel.value || ''
  }

  const changeAreaVal = (e: any) => {
    const updateData = { [formElementModel.uuId]: e.target.value }
    changeData && changeData({ data: updateData, contentArr: e.target.value })
    // changeData && changeData(formElementModel, e.target.value, e.target.value)
  }

  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={'textarea'}
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
        <Input.TextArea
          style={{ resize: 'none' }}
          autoSize={true}
          disabled={!isAuth}
          onChange={changeAreaVal}
          defaultValue={textareaVal}
          placeholder={formElementModel.placeholder}
          key={Maths.uuid()}
        ></Input.TextArea>
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
export default RenderTextArea

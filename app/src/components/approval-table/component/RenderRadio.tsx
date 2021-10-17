import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import Radio, { RadioChangeEvent } from 'antd/lib/radio'
import { CSSProperties } from 'react'
import $c from 'classnames'
import React from 'react'

//单独渲染单选组件
const RenderRadio = ({
  formElementModel,
  formItemStyles,
  isAuth,
  changeData,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  isAuth: boolean
  changeData?: (item: any, value?: string, content?: string) => void
  coord: any
}) => {
  const { formulaNumvalObj } = $store.getState()
  let selectRadioId =
    formElementModel.value && JSON.parse(formElementModel.value).length > 0
      ? JSON.parse(formElementModel.value)[0].id
      : ''
  // : formElementModel.approvalFormElementContentModels[0].elementId

  if (formulaNumvalObj[formElementModel.uuId]) {
    selectRadioId = JSON.parse(formulaNumvalObj[formElementModel.uuId])[0].id
  }
  const changeRadioVal = (e: RadioChangeEvent) => {
    const { value } = e.target
    const showVal = JSON.stringify([{ id: value, val: e.target['data-name'] }])
    const updateData = { [formElementModel.uuId]: showVal }
    changeData && changeData({ data: updateData, contentArr: e.target['data-name'] })
    // changeData && changeData(formElementModel, showVal, e.target['data-name'])
  }

  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={'radio'}
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
        <Radio.Group disabled={!isAuth} defaultValue={Number(selectRadioId)} onChange={changeRadioVal}>
          {formElementModel.approvalFormElementContentModels.map(
            (item: { elementId: number; content: string }) => (
              <Radio key={item.elementId} value={item.elementId} data-name={item.content}>
                {item.content}
              </Radio>
            )
          )}
        </Radio.Group>
      </div>
    </div>
  )
}
export default RenderRadio

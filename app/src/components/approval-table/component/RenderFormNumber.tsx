import React, { CSSProperties } from 'react'
import $c from 'classnames'
import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import { Input } from 'antd'
import * as Maths from '@/src/common/js/math'

//单独渲表单号
const RenderFormNumber = ({
  formElementModel,
  formItemStyles,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
}) => {
  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-mark={formElementModel.condition}
    >
      <div className={$c('plugRowLeft', { hideName: formElementModel.showName === 0 })}>
        {formElementModel.name}
      </div>
      <div className="plugRowRight">
        <Input
          maxLength={50}
          disabled={true}
          defaultValue={formElementModel.value}
          placeholder={formElementModel.placeholder}
          key={Maths.uuid()}
        />
      </div>
    </div>
  )
}
export default RenderFormNumber

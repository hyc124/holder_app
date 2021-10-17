import React, { CSSProperties } from 'react'
import $c from 'classnames'
import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'

//单独渲分割线
const RenderCuttingLine = ({
  formElementModel,
  formItemStyles,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
}) => (
  <div
    className={$c('plugElementRow', {
      hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
    })}
    key={formElementModel.id}
    style={formItemStyles}
    data-mark={formElementModel.condition}
  >
    <div className="form-cuttingLine"></div>
  </div>
)
export default RenderCuttingLine

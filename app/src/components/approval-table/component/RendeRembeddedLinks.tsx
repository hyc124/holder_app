import React, { CSSProperties } from 'react'
import $c from 'classnames'
import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'

//单独渲表单号
const RendeRembeddedLinks = ({
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
        <div className="embedded_links">
          <iframe
            frameBorder="0"
            sandbox="allow-scripts allow-same-origin allow-top-navigation"
            // scrolling="no"
            src={formElementModel.value}
            style={{ width: '100%', height: '100%' }}
            height="100%"
            className="embedded_links_iframe"
          ></iframe>
        </div>
      </div>
    </div>
  )
}
export default RendeRembeddedLinks

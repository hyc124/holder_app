import React from 'react'
import $c from 'classnames'
/**
 * 审批流程信息自定义图标
 */
const setApprovalInfoHeader = (panelProps: any) => {
  const { isActive } = panelProps
  return (
    <>
      <div className="approval-header-collspse">{panelProps['data-expendTime']}</div>
      <div className={$c('approval-info-btn', { slideUp: !isActive })}>历史审批轨迹</div>
    </>
  )
}
export default setApprovalInfoHeader

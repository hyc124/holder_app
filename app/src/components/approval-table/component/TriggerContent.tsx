import React, { useState } from 'react'
import { Button } from 'antd'
import $c from 'classnames'

//触发审批详情按钮
const TriggerContent = ({ touchLogModel }: any) => {
  const [triggerLoading, setTriggerLoading] = useState(false)
  //查看触发审批详情
  const lookApprovalDetal = (operatApprovalId: number) => {
    setTriggerLoading(true)
    $store.dispatch({ type: 'SET_OPERATEAPPROVALID', data: { isQueryAll: false, ids: operatApprovalId } })
    $tools.createWindow('ApprovalOnlyDetail').finally(() => {
      setTriggerLoading(false)
    })
  }
  return (
    <div className="trajectory-box">
      <span className="trajectory-title">审批来源</span>
      <Button
        loading={triggerLoading}
        onClick={(e: { preventDefault: () => void }) => {
          e.preventDefault()
          touchLogModel.operatApprovalId !== null && lookApprovalDetal(touchLogModel.operatApprovalId)
        }}
        className={$c('content', { hasHover: touchLogModel.operatApprovalId !== null })}
      >
        {touchLogModel.content}
      </Button>
    </div>
  )
}
export default TriggerContent

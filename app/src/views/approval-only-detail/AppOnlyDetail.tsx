/**
 * 触发审批查看审批详情，只做展示
 */
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import '@/src/views/approval/components/ApprovalDetail.less'
import './AppOnlyDetail.less'
import RenderApprovalDetails from './ApprovalDetailsOnly'

/**
 * 触发的审批查看详情
 */
const AppOnlyDetail = () => {
  //获取需要查询的审批id
  const businessDataObj = useSelector((store: StoreStates) => store.operateApprovalId)

  useEffect(() => {
    document.title = '审批详情'
  }, [])

  return <RenderApprovalDetails approvalId={businessDataObj.ids} queryAll={businessDataObj.isQueryAll} />
}

export default AppOnlyDetail

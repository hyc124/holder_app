import React, { useEffect, useRef } from 'react'
import {
  getHistroyProcess,
  getApprovalActModel,
  getBranchVarList,
} from '../approval/components/ApprovalDettail'
import { message, Spin, Tabs, Button } from 'antd'
const { TabPane } = Tabs
import { getStatusTxtByState } from '../approval/components/ApprovalList'
import ApprovalTable from '@/src/components/approval-table/ApprovalTable'
import ApprovalWorkFlow from '@/src/components/approval-workflow/ApprovalWorkFlow'
import { useMergeState } from '../approval-execute/ApprovalExecute'

//查询审批详情
const getApprovalById = (id: number) => {
  return new Promise<any>((resolve, reject) => {
    const { nowUserId, loginToken } = $store.getState()
    const param = {
      id,
      userId: nowUserId,
      noticeId: 0,
      isCopy: 0,
    }
    $api
      .request('/approval/approval/findApprovalById', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        $store.dispatch({ type: 'IS_APPROVAL_SEND', data: false })
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//抽离审批详情展示
const RenderApprovalDetails = ({ approvalId, queryAll }: { approvalId: any; queryAll: boolean }) => {
  const initStates = {
    loading: false, //loading
    approvalDetailData: null, //审批详情数据
    historyProcess: [],
    processData: null, //流程图数据
    showProcess: false, //是否显示流程图
    isFirst: true,
    isLast: true,
    branchVarLists: [],
  }
  const [detailState, setDetailState] = useMergeState(initStates)
  const detailPageRef = useRef<number>(1)

  //监听切换上一张下一张
  useEffect(() => {
    if (Array.isArray(approvalId)) {
      detailPageRef.current = 1
      setDetailState({ loading: true, isLast: false })
      getApprovalById(approvalId[detailPageRef.current - 1])
        .then(async resData => {
          setDetailState({ approvalDetailData: resData })
          //是否查询流程图
          if (resData.activitiProcessId && resData.activitiProcessId.length !== 0) {
            const historyData = await getHistroyProcess(resData.activitiProcessId)
            const processData = await getApprovalActModel(approvalId[detailPageRef.current - 1])
            const branchVarList = await getBranchVarList(approvalId[detailPageRef.current - 1])
            setDetailState({
              showProcess: true,
              historyProcess: historyData,
              processData: processData,
              branchVarLists: branchVarList,
            })
          } else {
            setDetailState({ showProcess: false })
          }
        })
        .catch(err => {
          message.error(err.returnMessage || '查询审批详情失败')
        })
        .finally(() => {
          setDetailState({ loading: false })
        })
    } else {
      setDetailState({ loading: true })
      getApprovalById(approvalId)
        .then(async resData => {
          setDetailState({ approvalDetailData: resData })
          //是否查询流程图
          if (resData.activitiProcessId && resData.activitiProcessId.length !== 0) {
            const historyData = await getHistroyProcess(resData.activitiProcessId)
            const processData = await getApprovalActModel(approvalId)
            const branchVarList = await getBranchVarList(approvalId[detailPageRef.current - 1])
            setDetailState({
              showProcess: true,
              historyProcess: historyData,
              processData: processData,
              branchVarLists: branchVarList,
            })
          } else {
            setDetailState({ showProcess: false })
          }
        })
        .catch(err => {
          message.error(err.returnMessage || '查询审批详情失败')
        })
        .finally(() => {
          setDetailState({ loading: false })
        })
    }
  }, [detailPageRef.current, approvalId])

  //上一张
  const prevDetail = () => {
    detailPageRef.current -= 1
    setDetailState({
      isLast: false,
    })
    if (detailPageRef.current === 1) {
      setDetailState({
        isFirst: true,
      })
      return
    }
  }

  //下一张
  const nextDetail = () => {
    detailPageRef.current += 1
    setDetailState({
      isFirst: false,
    })
    if (detailPageRef.current === approvalId.length) {
      setDetailState({
        isLast: true,
      })
      return
    }
  }

  //渲染发起人部门岗位
  const getRoleList = (list: { teamName: string; roleName: string }[]) => {
    let roleStr = ''
    if (!list) {
      return ''
    }
    list.map(item => {
      roleStr += item.teamName + '-' + item.roleName + '  '
    })
    return roleStr
  }

  //解决bug14726,公式合计显示问题
  const changeTableData = (handleItem: any) => {
    console.log('handleItem', handleItem)
    const { data } = handleItem
    for (const key in data) {
      $(`.plugElementRow[data-uuid=${key}]`).removeClass('hight')
      $store.dispatch({ type: 'SET_FORMULA_NUMVAL_OBJ', data: { key: key, value: data[key] } })
    }
  }

  return (
    <Spin spinning={detailState.loading} wrapperClassName="app-only-detail-container send-approval-content">
      <div className="main-panel">
        <div className="approval-main-container">
          {detailState.approvalDetailData && (
            <>
              <div className="approval-header">
                <div className="approval-title-name text-ellipsis">
                  {detailState.approvalDetailData?.username}申请【【触发】
                  {detailState.approvalDetailData?.title}
                  {detailState.approvalDetailData.custom && detailState.approvalDetailData.custom !== ''
                    ? `【${detailState.approvalDetailData.custom}】`
                    : ''}
                  】的审批
                </div>
                <div className="approval-source">
                  发起人部门-岗位：{detailState.approvalDetailData?.teamName}{' '}
                  {getRoleList(detailState.approvalDetailData?.roleList)}
                </div>
                {detailState.approvalDetailData.state !== 2 && detailState.approvalDetailData.state !== 1 && (
                  <div
                    className="approval-status-icon"
                    style={{ color: getStatusTxtByState(detailState.approvalDetailData.state).color }}
                  >
                    {getStatusTxtByState(detailState.approvalDetailData.state).txt}
                  </div>
                )}
                {queryAll && (
                  <div className="handle-btn-group">
                    <Button disabled={detailState.isFirst} type="primary" onClick={prevDetail}>
                      上一张
                    </Button>
                    <Button disabled={detailState.isLast} type="primary" onClick={nextDetail}>
                      下一张
                    </Button>
                  </div>
                )}
                {detailState.approvalDetailData.state === 2 && <div className="reject-img"></div>}
                {detailState.approvalDetailData.state === 1 && <div className="success-img"></div>}
              </div>
              <Tabs className="approval-detail-content" defaultActiveKey={'0'}>
                <TabPane tab={'审批内容'} key="0" className="approval-detail-pane-content" forceRender={true}>
                  <ApprovalTable
                    changeTableData={changeTableData}
                    dataSource={detailState.approvalDetailData}
                    disabled={true}
                  />
                </TabPane>
                {detailState.showProcess && detailState.processData && (
                  <TabPane tab={'流程图'} key="1" forceRender={true}>
                    {detailState.processData.childShapes.length !== 0 && (
                      <ApprovalWorkFlow
                        approvalId={approvalId}
                        dataSource={detailState.processData.childShapes}
                        historyProcess={detailState.historyProcess}
                        branchVarLists={detailState.branchVarLists}
                      />
                    )}
                  </TabPane>
                )}
              </Tabs>
            </>
          )}
        </div>
      </div>
    </Spin>
  )
}

export default RenderApprovalDetails

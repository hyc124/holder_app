import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import './riskSection.less'
import $c from 'classnames'
// import { requestApi } from '@/src/common/js/ajax'
import { OkrFollowUpModal } from '@/src/views/modals/okrFollowUp/okrFollowUpModal'

const RenderRiskSectionCom = ({
  domObj,
  dataObj,
  okrFollowUpModalRef,
  queryParam,
}: {
  domObj: {
    type?: number //1风险项 2更新率
    className?: string
    title?: string
    bottomLabel?: string
  }
  dataObj: {
    number: number
    addNum: number
    reduceNum?: number
  }
  queryParam: any
  okrFollowUpModalRef: any
}) => {
  const {
    type,
    className,
    title,
    //  bottomLabel
  } = domObj
  const { number, addNum, reduceNum } = dataObj
  return (
    <div
      className={$c('riskContainer flex between', className)}
      onClick={() => {
        okrFollowUpModalRef.current &&
          okrFollowUpModalRef.current.setState({
            visible: true,
            findType: domObj.type == 1 ? 'risk' : 'updateRate',
            queryParam,
          })
      }}
    >
      <div className="title">{title || '风险项'}</div>
      <div className="right-box flex">
        <div className="body flex-1 my_ellipsis">{number}</div>
        <div className="footer">
          {/* <span className="flabel">{bottomLabel || '较昨日'}</span> */}
          <span className="addNum">+{addNum}</span>
          {type == 1 && <span className="reduceNum">-{reduceNum}</span>}
        </div>
      </div>
    </div>
  )
}

const RiskSection = forwardRef((props: any, ref) => {
  // const {
  //   // sortType,
  //   statusList,
  //   searchTexe,
  //   planTypeActive,
  //   periodId,
  //   teamId,
  //   ascriptionId,
  //   ascriptionType,
  // } = props.filterMoules
  const {
    riskItemVo: { riskItem, addToday, reduceToday },
    okrUpdateRateVo: { updateRate, updateToday },
  } = props.sourceData

  // 跟进列表弹框
  const okrFollowUpModalRef = useRef<any>({})
  useImperativeHandle(ref, () => ({
    // 外部调用刷新数据
    // refreshRiskSectionData: updateStateDataFn,
  }))

  return (
    <div className="riskSection flex column between center">
      <RenderRiskSectionCom
        key="riskBox"
        domObj={{
          type: 1,
          className: 'riskBox',
          title: '风险项',
          bottomLabel: '较昨日',
        }}
        dataObj={{
          number: riskItem,
          addNum: addToday,
          reduceNum: reduceToday,
        }}
        okrFollowUpModalRef={okrFollowUpModalRef}
        queryParam={props.filterMoules}
      />
      <div className="cell-line"></div>
      <RenderRiskSectionCom
        key="updeteBox"
        domObj={{
          type: 2,
          className: 'updeteBox',
          title: '近7天更新率',
          bottomLabel: '今日新增',
        }}
        dataObj={{
          number: updateRate,
          addNum: updateToday,
        }}
        queryParam={props.filterMoules}
        okrFollowUpModalRef={okrFollowUpModalRef}
      />
      {/* okr跟进列表弹框 */}
      <OkrFollowUpModal ref={okrFollowUpModalRef} />
    </div>
  )
})

export default RiskSection

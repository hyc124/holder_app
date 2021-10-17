import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import './generalView.less'
// import $c from 'classnames'
import { requestApi } from '@/src/common/js/ajax'
// import { OkrFollowUpModal } from '@/src/views/modals/okrFollowUp/okrFollowUpModal'
import Tabs from 'antd/lib/tabs'
import RiskSection from '../riskSection/riskSection'
import { StateDistribution } from '../stateDistribution/stateDistribution'
import { AverageChart } from '../averageChart/averageChart'
import { ProcessChart } from '../averageChart/ProcessChart'
import { ipcRenderer } from 'electron'
import { AllAveProChart } from '../averageChart/allAveProChart'
import { queryOkrSummaryGraphyApi } from './generalViewApi'
const { TabPane } = Tabs

// 缓存当前请求参数
let queryParam: any = null

const GeneralView = forwardRef((props: any, ref) => {
  const {
    // sortType,
    statusList,
    searchTexe,
    planTypeActive,
    periodId,
    teamId,
    ascriptionId,
    ascriptionType,
    grades,
    processStates,
    scores,
    cci,
  } = props.filterMoules

  const [state, setState] = useState<any>({
    refresh: 0,
    sourceData: {
      riskItemVo: {
        //风险项数据
        riskItem: 0,
        addToday: 0,
        reduceToday: 0,
      },
      okrUpdateRateVo: {
        //更新率数据
        updateRate: 0,
        updateToday: 0,
      },
      processStatusPieChartVo: {
        //状态分布数据
        normal: 0,
        risk: 0,
        ahead: 0,
        lazy: 0,
      },
      cciTrendModel: {
        //信心指数
      },
      processTrendModel: {
        //进度更新
      },
    },
  })
  let isUnmounted = false

  useImperativeHandle(ref, () => ({
    // 外部调用刷新数据
    // refreshGeneralViewFn: () => {
    //   setState({ refresh: ++state.refresh })
    // },
  }))

  useEffect(() => {
    ipcRenderer.on('refresh_okrList_generalView', ipcOnFn)
    return () => {
      isUnmounted = true
      queryParam = null
    }
  }, [])

  // 监听加载
  useEffect(() => {
    isUnmounted = false
    // 跟进列表筛选接口参数
    queryParam = {
      keyword: searchTexe,
      status: statusList.length > 0 ? statusList : [1, 2, 3, 4, 5],
      mySelf: teamId ? 0 : planTypeActive || 0,
      teamId,
      periodId,
      ascriptionId,
      ascriptionType,
      grades,
      processStates,
      scores,
      cci,
    }
    queryOkrSummaryGraphyData()
    console.log(teamId)
  }, [statusList, searchTexe, planTypeActive, periodId, teamId, ascriptionId, ascriptionType])
  // 订阅刷新概况统计消息
  const ipcOnFn = (_: any, data: any) => {
    const { refresh } = data
    if (refresh && queryParam) {
      queryOkrSummaryGraphyData()
    }
  }
  /**
   * tab切换
   */
  const tabsChange = (key: any) => {
    setState({ ...state, nowTab: key })
  }

  //查询okr统计图概况数据
  const queryOkrSummaryGraphyData = () => {
    queryOkrSummaryGraphyApi({ ...queryParam }).then((res: any) => {
      // console.log(res)
      if (!isUnmounted && res.returnCode == 0) {
        const {
          riskItemVo,
          okrUpdateRateVo,
          processStatusPieChartVo,
          cciTrendModel,
          processTrendModel,
        } = res.data
        setState({
          ...state,
          sourceData: {
            ...state.sourceData,
            riskItemVo: {
              ...riskItemVo,
            },

            okrUpdateRateVo: {
              ...okrUpdateRateVo,
            },

            processStatusPieChartVo: {
              ...processStatusPieChartVo,
            },
            cciTrendModel: [...cciTrendModel],
            processTrendModel: [...processTrendModel],
          },
          refresh: ++state.refresh,
        })
      }
    })
  }

  return (
    <div className="generalViewContaier flex-1">
      <Tabs className="tabs-container flex-1" key={1} activeKey={state.nowTab || '1'} onChange={tabsChange}>
        {/* <TabPane tab={'概况'} key="1" className="flex"> */}
        {/* 风险项、更新率统计 */}
        <RiskSection
          key="riskSection"
          // refresh={state.refresh}
          filterMoules={{
            ...queryParam,
          }}
          sourceData={{
            riskItemVo: state.sourceData.riskItemVo,
            okrUpdateRateVo: state.sourceData.okrUpdateRateVo,
          }}
        />
        {/* 状态分布 */}
        <StateDistribution
          key="stateDistribution"
          refresh={state.refresh}
          filterMoules={{
            ...queryParam,
          }}
          sourceData={{ processStatusPieChartVo: state.sourceData.processStatusPieChartVo }}
        />
        {queryParam?.periodId != 0 && (
          <>
            {/* 信心指数均值折线图 */}
            <AverageChart
              key="averageChart"
              // refresh={state.refresh}
              filterMoules={{ ...queryParam }}
              sourceData={{ cciTrendModel: state.sourceData.cciTrendModel }}
            ></AverageChart>
            {/* 进度均值折线图 */}
            <ProcessChart
              key="processChart"
              // refresh={state.refresh}
              filterMoules={{ ...queryParam }}
              sourceData={{ processTrendModel: state.sourceData.processTrendModel }}
            ></ProcessChart>
            {/* 信心指数和进度均值 */}
            {/* <AllAveProChart
              key="processChart"
              // refresh={state.refresh}
              filterMoules={{ ...queryParam }}
              sourceData={{
                processTrendModel: state.sourceData.processTrendModel,
                cciTrendModel: state.sourceData.cciTrendModel,
              }}
            ></AllAveProChart> */}
          </>
        )}
        {/* </TabPane> */}

        {/* <TabPane tab={'KPIs'} key="2"></TabPane>
        <TabPane tab={'关键节点'} key="3"></TabPane> */}
      </Tabs>
    </div>
  )
})

export default GeneralView

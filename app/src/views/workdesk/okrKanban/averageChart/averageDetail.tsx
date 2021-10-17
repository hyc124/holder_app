import { key } from '@/src/common/js/jsmind/jsmind'
import Avatar from 'antd/lib/avatar/avatar'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import './averageChart.less'
import { findCciDynamicApi, findProcessDynamicApi } from './averageChartApi'
export const AverageChartDetail = forwardRef((props: any, ref: any) => {
  const [state, setState] = useState<any>({
    visible: false,
    filterMoules: {},
    aveDetail: [], //详情数据
    type: '', //herat---信心指数均值, process----进度进展
  })
  useEffect(() => {
    if (state.visible) {
      getInit()
    }
  }, [state.visible, state.type, state.filterMoules.queryTime])
  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    /**
     * 刷新方法
     */
    setState: (paramObj: any) => {
      setState({ ...state, ...paramObj })
    },
  }))
  //从后台获取数据
  const getInit = () => {
    const param = {
      ...state.filterMoules,
    }
    console.log(param)
    if (state.type == 'process') {
      findProcessDynamicApi(param).then((res: any) => {
        setState({ ...state, aveDetail: res.dataList })
      })
    } else {
      findCciDynamicApi(param).then((res: any) => {
        console.log(res)
        console.log(res.dataList)
        setState({ ...state, aveDetail: res.dataList })
      })
    }
  }
  return (
    <>
      {state.visible && (
        <div className="chart_detail_box">
          {state.aveDetail &&
            state.aveDetail.length > 0 &&
            state.aveDetail.map((item: any, key: React.Key) => {
              return (
                <div key={key}>
                  <div className="title_box flex">
                    <Avatar
                      size={32}
                      src={item.userProfile}
                      style={{ backgroundColor: '#4285f4', fontSize: 12, marginRight: 12 }}
                    >
                      {item.username && item.username.substr(-2, 2)}
                    </Avatar>
                    <div className="user_name_box">
                      <div className="user_name_title">{item.description}</div>
                      <span className="user_date">{item.createTime}</span>
                    </div>
                  </div>
                  {/* okr标题和变化信心值和进度值 */}
                  <div className="content_box flex">
                    <div className="content_left flex center-v">
                      <em className={`okr-icon ${item.workPlanType == 3 ? 'kr' : ''}`}></em>
                      <span className="okr_title_text my_ellipsis">{item.name}</span>
                    </div>
                    <div className="okr_right_box">
                      {item.contentList &&
                        item.contentList.map((it: any, num: any) => {
                          return (
                            <div key={num}>
                              {state.type == 'heart' && it.type == 27 && (
                                <>
                                  <i></i>
                                  <span>{it.before}</span>
                                  <i className="right_change_icon"></i>
                                  <i></i>
                                  <span>{it.after}</span>
                                </>
                              )}
                              {state.type == 'process' && it.type == 17 && (
                                <>
                                  <span>{it.before}</span>
                                  <i className="right_change_icon"></i>
                                  <span>{it.after}</span>
                                </>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                  {/* 进展描述 */}
                  {/* {item.content && (
                    <div className="okr_descipt">
                      <span className="okr_descipt_title">【进展描述】</span>
                      <p>
                        与和胜实业销售部门王钢关于任务管理的沟通：
                        用户已经在长时间的业务管理中形成了一套成熟的管理方式：按照时间维度季度、月、周天拆分目标及标准，不进行具体的任务拆分（认为销售任务相对更关注结果，过程较自由
                        自由 。
                      </p>
                    </div>
                  )} */}
                </div>
              )
            })}
          {state.aveDetail.length < 1 && <div className="noDataText">暂无详细信息</div>}
        </div>
      )}
    </>
  )
})

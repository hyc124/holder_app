import React, { useEffect, useState, useRef } from 'react'
import ReactEcharts from 'echarts-for-react'
import { AverageChartDetail } from './averageDetail'
import './averageChart.less'

export const AverageChart = (props: any) => {
  const { cciTrendModel } = props.sourceData
  const [state, setState] = useState<any>({
    showDetail: false, //显示折点详情
    chartList: [], //后台数据
    xList: [], //x轴数据
    showChart: false, //有数据后显示图标
    updateTime: '', //当前点击时间
  })
  let detailLogRef: any = useRef<any>(null)
  useEffect(() => {
    return () => {
      detailLogRef = null
    }
  }, [])
  useEffect(() => {
    initChartDatasFn(cciTrendModel)
  }, [cciTrendModel])
  useEffect(() => {
    docEvent()
  }, [state.chartList, state.xList])

  const docEvent = () => {
    $('body')
      .off('click')
      .on('click', function(e) {
        hideDetail()
      })
  }
  //监听鼠标修改事件
  const hideDetail = () => {
    setState({ ...state, showDetail: false })
    detailLogRef?.current &&
      detailLogRef.current.setState({
        visible: false,
      })
  }

  // 组装数据
  const initChartDatasFn = (chartArr: any) => {
    const seriesList =
      chartArr?.length > 0
        ? chartArr.map((t: any) => {
            return {
              updateTime: t.updateTime,
              value: t.avgValue,
            }
          })
        : []
    const xList = chartArr?.length > 0 ? chartArr.map((t: any) => t.updateTime.substring(5)) : []
    setState({ ...state, chartList: seriesList, xList, showChart: xList.length > 0 ? true : false })
  }

  //初始化chart图标
  const getOption = () => {
    const option = {
      //图表标题
      title: {
        text: '信心指数均值',
        left: 0,
        top: 0,
        padding: 0,
        textStyle: {
          color: '#191f25',
          textBorderColor: 'red',
          fontSize: '14px',
          fontWeight: 400,
        },
      },
      position: function(
        point: any[],
        params: any,
        dom: any,
        rect: any,
        size: { contentSize: any[]; viewSize: any[] }
      ) {
        // 鼠标坐标和提示框位置的参考坐标系是：以外层div的左上角那一点为原点，x轴向右，y轴向下
        // 提示框位置
        let x = 0 // x坐标位置
        let y = 0 // y坐标位置

        // 当前鼠标位置
        const pointX = point[0]
        const pointY = point[1]

        // 外层div大小
        const viewWidth = size.viewSize[0]
        const viewHeight = size.viewSize[1]

        // 提示框大小
        const boxWidth = size.contentSize[0]
        const boxHeight = size.contentSize[1]

        //pointX + boxWidth > viewWidth  右侧放不下
        if (pointX + boxWidth + 10 > viewWidth) {
          x = pointX - boxWidth - 20
        } else {
          x = pointX + 10
        }

        // boxHeight > pointY 说明鼠标上边放不下提示框
        if (boxHeight > pointY) {
          y = 5
        } else {
          // 上边放得下
          y = pointY - boxHeight
        }

        return [x, y]
      },
      tooltip: {
        //提示框组件
        trigger: 'axis',
        backgroundColor: '#3A455E',
        borderColor: '#3A455E',
        textStyle: {
          color: '#FFFFFF',
        },
        extraCssText: 'z-index: 999;',
        formatter: function(param: { name: string; value: string }) {
          const val = param[0].data.value ? param[0].data.value : '无'

          return (
            '<div style="color：‘#FFFFFF’ "> ' +
            param[0].data.updateTime +
            '<br>' +
            '信心指数均值：' +
            val +
            '<br>'
          )
          '</div>'
        },
      },
      grid: {
        left: '0',
        right: '7%',
        top: '25%',
        bottom: '0',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        axisLabel: {
          show: true,
          interval: 0,
          // rotate: 40,
          textStyle: {
            fontSize: 10,
            color: '9A9AA2',
          },
        },
        //X轴坐标值
        boundaryGap: false,
        data: state.xList,
        nameTextStyle: {
          color: '#9A9AA2',
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: '#E7E7E9',
          },
        },
      },
      yAxis: {
        type: 'value', //数值轴，适用于连续数据
        max: 10,
        min: 0,
        scale: true,
        splitNumber: 2, //刻度分段数
        data: [0, 5, 10],
        axisLabel: {
          textStyle: {
            fontSize: 10,
          },
        },
      },
      series: [
        {
          name: '信心指数', //坐标点名称
          type: 'line', //线类型
          data: state.chartList, //坐标点数据
          connectNulls: true, //支持null值
          showSymbol: false, //去掉折线图折点圆点
          smooth: true, //平滑折线图
          symbolSize: 8, //拐点大小
          cursor: 'pointer',
          animation: false,
          emphasis: {
            scale: false,
          },
          markLine: {
            //平均线设置
            silent: true, //true 去掉鼠标悬浮该线上的动画
            symbol: 'none', //该线无样式
            label: {
              show: false, //该线上的值去掉
            },
            lineStyle: {
              //设置该线样式
              normal: {
                type: 'dashed',
                color: '#4285F4',
              },
            },
            data: [
              {
                yAxis: 5, //线的值
              },
            ],
          },
          formatter: function(params: { value: number }) {
            if (!params.value) {
              return params.value
            } else {
              return ''
            }
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(66, 133, 244, 0.3)', // 0% 处的颜色
                },
                {
                  offset: 1,
                  color: 'rgba(66, 133, 244, 0)', // 100% 处的颜色
                },
              ],
              global: false, // 缺省为 false
            },
          },
        },
      ],
    }

    return option
  }
  //点击折点显示详情
  const onclick = {
    click: (param: any) => {
      console.log(param)
      docEvent()
      detailLogRef?.current &&
        detailLogRef.current.setState({
          filterMoules: { ...props.filterMoules, queryTime: param.data.updateTime },
          visible: !state.showDetail,
          type: 'heart',
        })
      setState({
        ...state,
        showDetail: !state.showDetail,
        updateTime: param.data.updateTime,
      })
    },
  }
  return (
    <div className="charts_box heart">
      {/* <header className="header_text">信心指数均值</header> */}
      <div className="charts_content" id="mainEchart">
        {state.showChart && (
          <ReactEcharts style={{ height: '100%', width: '100%' }} option={getOption()} onEvents={onclick} />
        )}
      </div>
      {<AverageChartDetail key="averageChartDetail" ref={detailLogRef}></AverageChartDetail>}
    </div>
  )
}

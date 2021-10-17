import React, { useEffect, useState, useRef } from 'react'
import ReactEcharts from 'echarts-for-react'
import { AverageChartDetail } from './averageDetail'

import './averageChart.less'

export const ProcessChart = (props: any) => {
  const { processTrendModel } = props.sourceData
  const [state, setState] = useState<any>({
    showDetail: false, //显示折点详情
    chartList: [], //实际进度均值数据
    defaultChartList: [], //默认进度均值数据
    xList: [], //x轴数据
    showChart: false, //有数据后显示图标
  })
  let detailLogRef: any = useRef<any>(null)
  useEffect(() => {
    return () => {
      detailLogRef = null
    }
  }, [])
  useEffect(() => {
    initChartDatasFn(processTrendModel)
  }, [processTrendModel])
  useEffect(() => {
    docEvent()
  }, [state.chartList, state.xList, state.defaultChartList])

  const docEvent = () => {
    $(document)
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

  // 初始数据
  const initChartDatasFn = (chartArr: any[]) => {
    const seriesList = chartArr?.length > 0 ? chartArr : []
    const defaultChartList =
      chartArr?.length > 0
        ? chartArr.map((t: any) => {
            return {
              updateTime: t.updateTime || '',
              value: t.defaultValue || '',
            }
          })
        : []
    const xList = chartArr?.length > 0 ? chartArr.map((t: any) => t.updateTime.substring(5)) : []
    setState({ ...state, chartList: seriesList, defaultChartList, xList, showChart: true })
  }

  //初始化chart图标
  const getOption = () => {
    const option = {
      //图表标题
      title: {
        text: '进度均值',
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
      tooltip: {
        //提示框组件
        trigger: 'axis',
        backgroundColor: '#3A455E',
        borderColor: '#3A455E',
        textStyle: {
          color: '#FFFFFF',
        },
        // confine: true,
        // extraCssText: 'z-index: 9999;',
        // enterable: true,
        // position: function(
        //   point: number[],
        //   params: any,
        //   dom: any,
        //   rect: any,
        //   size: { contentSize: number[]; viewSize: number[] }
        // ) {
        //   // point: 鼠标位置
        //   const tipHeight = point[1] + size.contentSize[1] // contentSize: 提示dom 窗口大小
        //   if (tipHeight > size.viewSize[1]) {
        //     // viewSize: echarts 容器大小
        //     return [point[0] + 40, '40%']
        //   } else if (point[1] < size.contentSize[1]) {
        //     return [point[0] + 40, '40%']
        //   } else {
        //     return point
        //   }
        // },
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
        formatter: function(param: { name: string; value: string }) {
          const val = param[0].data.value || param[0].data.value == 0 ? param[0].data.value : '无'
          const valPre = param[0].data.value || param[0].data.value == 0 ? '%' : ''
          const valDef =
            param[0].data.defaultValue || param[0].data.defaultValue == 0 ? param[0].data.defaultValue : '无'
          const valDefPre = param[0].data.defaultValue || param[0].data.defaultValue == 0 ? '%' : ''

          return (
            '<div style="color：‘#FFFFFF’ "> ' +
            param[0].data.updateTime +
            '<br>' +
            '进度实际均值：' +
            val +
            valPre +
            '<br>' +
            '进度参考均值：' +
            valDef +
            valDefPre +
            '</div>'
          )
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
        splitNumber: 7,
        interval: 0,
        axisLabel: {
          show: true,
          interval: 0,
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
        max: 100,
        min: 0,
        scale: true,
        splitNumber: 2, //刻度分段数
        data: [0, 50, 100],
        axisLabel: {
          textStyle: {
            fontSize: 10,
          },
          formatter: function(value: any) {
            return value + '%'
          },
        },
      },
      series: [
        {
          name: '进度均值', //坐标点名称
          type: 'line', //线类型
          connectNulls: true, //支持null值
          data: state.chartList, //坐标点数据
          showSymbol: false, //去掉折线图折点圆点
          smooth: true, //平滑折线图
          symbolSize: 8, //拐点大小
          cursor: 'pointer',
          color: '#FFAA00',
          animation: false,
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
                  color: 'rgba(255, 194, 0, 0.3)', // 30% 处的颜色
                },
                {
                  offset: 1,
                  color: 'rgba(255, 194, 0, 0)', // 0% 处的颜色
                },
              ],
              global: false, // 缺省为 false
            },
          },
          lineStyle: {
            color: '#FFAA00', //改变折线颜色
          },
        },
        {
          name: '标准均值', //坐标点名称
          type: 'line', //线类型
          data: state.defaultChartList, //坐标点数据
          connectNulls: true, //支持null值
          animation: false,
          symbolSize: 8, //拐点大小
          showSymbol: false, //去掉折线图折点圆点
          color: '#FFAA00',
          legendHoverLink: false,
          smooth: true, //平滑折线图
          // lineStyle: {
          //   type: 'dashed', //折线样式
          //   color: '#FFAA00', //改变折线颜色
          //   with: 1, //线宽
          // },
          select: {
            label: {
              show: false,
            },
          },
          itemStyle: {
            normal: {
              lineStyle: {
                //折线颜色大小
                type: 'dashed', //'dotted'虚线 'solid'实线 dashed
                width: 1,
              },
            },
          },
          formatter: function(params: { value: number }) {
            if (!params.value) {
              return params.value
            } else {
              return ''
            }
          },
        },
      ],
    }
    // console.log('进度所有配置项', option.series)

    return option
  }
  //点击折点显示详情
  const onclick = {
    click: (param: any) => {
      // console.log(param)
      docEvent()
      detailLogRef?.current &&
        detailLogRef.current.setState({
          filterMoules: { ...props.filterMoules, queryTime: param.data.updateTime },
          visible: !state.showDetail,
          type: 'process',
        })
      setState({
        ...state,
        showDetail: !state.showDetail,
        updateTime: param.data.updateTime,
      })
    },
  }
  return (
    <div className="charts_box average">
      {/* <header className="header_text">进度均值</header> */}
      <div className="charts_content" id="mainEchart">
        {state.showChart && (
          <ReactEcharts style={{ height: '100%', width: '100%' }} option={getOption()} onEvents={onclick} />
        )}
      </div>
      {<AverageChartDetail key="processChartDetail" ref={detailLogRef}></AverageChartDetail>}
    </div>
  )
}

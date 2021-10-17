import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import ReactEcharts from 'echarts-for-react'
import { AverageChartDetail } from './averageDetail'
import { findAvgCciTrendApi } from './averageChartApi'
import '@/src/common/js/jquery.resize'
import './averageChart.less'

// export let refreshAverageChartData: any = null

export const AllAveProChart = (props: any) => {
  const { cciTrendModel, processTrendModel } = props.sourceData
  const [state, setState] = useState<any>({
    showDetail: false, //显示折点详情
    iccList: [], //后台数据
    processList: [], //进度均值
    defaultProcessList: [], //进度均值标准值
    xList: [], //x轴数据
    showChart: false, //有数据后显示图标
    updateTime: '', //当前点击时间
  })
  let detailLogRef: any = useRef<any>(null)
  useEffect(() => {
    return () => {
      // refreshAverageChartData = null
      detailLogRef = null
      console.log('huhuhu')
    }
  }, [])
  useEffect(() => {
    // getData()
    initChartDatasFn(cciTrendModel, processTrendModel)
  }, [cciTrendModel, processTrendModel])
  useEffect(() => {
    docEvent()
  }, [state.chartList, state.xList])
  // 监听窗口变化
  useLayoutEffect(() => {
    console.log('qiiqiiq')
    onResize
  }, [])

  const docEvent = () => {
    $('body')
      .off('click')
      .on('click', function(e) {
        hideDetail()
      })
  }
  //监听窗口变化
  const onResize = () => {
    // $('.generalViewContaier')
    //   .off('resize')
    //   .on('resize', () => {
    //     $('.taskManageListContainer .taskManageListTable .ant-table-body').removeClass('hidescroll')
    //   })
    const _dom = $('.generalViewContaier')
    _dom &&
      _dom.off('resize').on('resize', () => {
        const bodyWidth: any = $('body').width() || 0
        console.log(bodyWidth)
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
  const initChartDatasFn = (chartArr: any, processChart: any) => {
    const iccList =
      chartArr?.length > 0
        ? chartArr.map((t: any) => {
            return {
              updateTime: t.updateTime,
              value: t.avgValue,
            }
          })
        : []
    const defaultProcessList =
      processChart?.length > 0
        ? processChart.map((t: any) => {
            return {
              updateTime: t.updateTime,
              value: t.avgValue,
            }
          })
        : []
    const xList = chartArr?.length > 0 ? chartArr.map((t: any) => t.updateTime.substring(5)) : []
    console.log(iccList, defaultProcessList, xList)

    setState({
      ...state,
      iccList,
      processList: processChart,
      defaultProcessList,
      xList,
      showChart: xList.length > 0 ? true : false,
    })
  }

  // refreshAverageChartData = getData
  //初始化chart图标
  const getOption = () => {
    const option = {
      //图表标题
      // title: {
      //   text: '信心指数均值',
      //   left: 0,
      //   top: 0,
      //   padding: 0,
      //   textStyle: {
      //     color: '#191f25',
      //     textBorderColor: 'red',
      //     fontSize: '14px',
      //     fontWeight: 400,
      //   },
      // },
      tooltip: {
        //提示框组件
        trigger: 'axis',
        backgroundColor: '#3A455E',
        borderColor: '#3A455E',
        textStyle: {
          color: '#FFFFFF',
        },
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
      yAxis: [
        {
          name: '信心指数均值',
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
        {
          name: '进度均值',
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
      ],
      series: [
        {
          name: '信心指数', //坐标点名称
          type: 'line', //线类型
          data: state.iccList, //坐标点数据
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
        {
          name: '进度均值', //坐标点名称
          type: 'line', //线类型
          connectNulls: true, //支持null值
          data: state.processList, //坐标点数据
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
    // console.log('信心指数所有配置项', option)

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
    <div className="charts_box heart allCharts">
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

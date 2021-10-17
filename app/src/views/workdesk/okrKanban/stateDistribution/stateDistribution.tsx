import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import ReactEcharts from 'echarts-for-react'
import { OkrFollowUpModal } from '@/src/views/modals/okrFollowUp/okrFollowUpModal'
import './stateDistribution.less'

// 缓存圆心点
let axis = '35%'
// 缓存当前数据状态
let isEmpty = false
export const StateDistribution = (props: any) => {
  const {
    processStatusPieChartVo: { normal, risk, ahead, lazy },
  } = props.sourceData
  isEmpty = !normal && !risk && !ahead && !lazy ? true : false
  const [, setReload] = useState<any>({})

  // 跟进列表弹框
  const okrFollowUpModalRef = useRef<any>({})

  // 监听数据变化，动态调整圆心
  useEffect(() => {
    calcPieCirleFn()
  }, [props.refresh])
  // 监听窗口变化，调整饼图圆心点
  useLayoutEffect(() => {
    resizePieCirleFn()
  }, [])

  // 计算圆心
  const calcPieCirleFn = () => {
    let isReload = false
    if (isEmpty) {
      if (axis != '50%') {
        axis = '50%'
        isReload = true
      }
    } else {
      if (axis == '50%') {
        const bodyWidth: any = $('body').width() || 0
        axis = bodyWidth < 1500 ? '35%' : '45%'
        isReload = true
      }
    }
    isReload && setReload({})
  }

  // 动态重置画布 饼图圆心点
  const resizePieCirleFn = () => {
    // 窗口改变事件
    const _dom = $('.stateDistributionContainer')
    _dom &&
      _dom.off('resize').on('resize', () => {
        const bodyWidth: any = $('body').width() || 0
        if (isEmpty) {
          axis = '50%'
        } else {
          if (bodyWidth < 1500) {
            axis = '35%'
          } else {
            axis = '45%'
          }
        }

        setReload({})
      })
  }

  // 获取画布参数
  const getOption = () => {
    const option = {
      backgroundColor: '#F6FAFF',

      //图表标题
      title: {
        text: '状态分布',
        left: 13,
        top: 13,
        // subtext: '',
        // width: '12rem',
        // height: '24rem',
        textStyle: {
          color: '#191f25',
          textBorderColor: 'red',
          fontSize: '14px',
          fontWeight: 400,
        },
      },
      tooltip: {
        //提示框组件
        trigger: 'item',
        backgroundColor: '#3A455E',
        borderColor: '#3A455E',
        textStyle: {
          color: '#FFFFFF',
        },
        formatter: '{b}',
      },
      legend: {
        show: !isEmpty,
        top: 10,
        right: 6,
        orient: 'vertical',
        left: 'right',
        selectedMode: false,
      },
      series: [
        {
          //   name: '有风险',
          //图表类型
          type: 'pie',
          radius: '45%',
          selectedMode: 'onmouseover',
          //图表位置
          center: [axis, '55%'],
          data: packagePieDatas(props.sourceData.processStatusPieChartVo || {}),
          //   .sort(function(a, b) {
          //     return a.value - b.value
          //   })
          labelLine: {
            lineStyle: {
              color: 'transparent',
            },
            smooth: 0.2,
            length: 5,
            length2: 5,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    }
    return option
  }

  return (
    <>
      <div className={`stateDistributionContainer`} style={{ width: '20%' }}>
        <div
          style={{ height: '150px', width: '100%' }}
          onClick={() => {
            okrFollowUpModalRef.current &&
              okrFollowUpModalRef.current.setState({
                visible: true,
                findType: 'state',
                queryParam: { ...props.filterMoules },
                // status: getStatusFn(e),
              })
          }}
        >
          <ReactEcharts style={{ height: '100%' }} option={getOption()} />
        </div>
      </div>
      {/* okr跟进列表弹框 */}
      <OkrFollowUpModal ref={okrFollowUpModalRef} />
    </>
  )
}

// 打开okr穿透列表
const getStatusFn = (e: any) => {
  let status = 1
  const innerText = e.currentTarget.innerText

  if (innerText.includes('风险')) {
    status = 1
  } else if (innerText.includes('延迟')) {
    status = 3
  } else if (innerText.includes('正常')) {
    status = 0
  } else if (innerText.includes('超前')) {
    status = 2
  }
  return status
}

// 组装单项数据
const packageProcess = (process: number, type: string, isEmpty: boolean) => {
  const res = {
    value: 0,
    name: '',
    selected: false,
    itemStyle: {
      color: '#c3c6ca',
    },
    label: {
      show: false,
      color: '#FFC200',
      fontSize: 10,
    },
  }
  const _process = cusFloadNum(process)
  switch (type) {
    case 'normal':
      res.value = isEmpty ? 40 : _process
      res.name = renderLable(type, _process)
      res.itemStyle.color = isEmpty ? '#E2E5E8' : '#4285F4'
      res.label.color = '#4285F4'
      break
    case 'risk':
      res.value = isEmpty ? 30 : _process
      res.name = renderLable(type, _process)
      res.itemStyle.color = isEmpty ? '#c3c6ca' : '#FFC200'
      res.label.color = '#FFC200'
      break
    case 'ahead':
      res.value = isEmpty ? 20 : _process
      res.name = renderLable(type, _process)
      res.itemStyle.color = isEmpty ? '#EBEDF0' : '#01D0B6'
      res.label.color = '#01D0B6'
      break
    case 'lazy':
      res.value = isEmpty ? 10 : _process
      res.name = renderLable(type, _process)
      res.itemStyle.color = isEmpty ? '#CDD0D4' : '#F54A45'
      res.label.color = '#F54A45'
      break

    default:
      break
  }
  return {
    ...res,
  }
}
//渲染饼图文案
const renderLable = (type: string, process: number) => {
  let name = ''
  switch (type) {
    case 'normal':
      name = `正常${process}%`
      break
    case 'risk':
      name = `有风险${process}%`

      break
    case 'ahead':
      name = `超前${process}%`

      break
    case 'lazy':
      name = `延迟${process}%`
      break

    default:
      break
  }
  return name
}

// 判断进度数据类型
const judgeProcessType = (str: string) => {
  if (str.includes('正常')) {
    return 'normal'
  }
  if (str.includes('风险')) {
    return 'risk'
  }
  if (str.includes('超前')) {
    return 'ahead'
  }
  if (str.includes('延迟')) {
    return 'lazy'
  }
  return ''
}

// 转换数据
const cusFloadNum = (num: number) => {
  const numFloat = Number(num * 100)
  return String(numFloat).indexOf('.') == -1 ? numFloat : Number(numFloat.toFixed(1))
}

// 组装饼图所需数据
const packagePieDatas = (obj: any[]) => {
  const processStatusData: any[] = []
  const processStatusPieChartVo = { ...obj }
  // 组装画布设置数据
  for (const key in processStatusPieChartVo) {
    if (isEmpty) {
      processStatusData.push(packageProcess(0, key, isEmpty))
    } else {
      if (processStatusPieChartVo[key]) {
        processStatusData.push(packageProcess(processStatusPieChartVo[key], key, isEmpty))
      }
    }
  }
  // 进度状态百分比（最后一位补充至100）
  if (!isEmpty && processStatusData.length > 1) {
    let total = 0
    for (let i = 0; i < processStatusData.length - 1; i++) {
      total += processStatusData[i].value
    }
    processStatusData[processStatusData.length - 1].value = Number((100 - total).toFixed(1))
    processStatusData[processStatusData.length - 1].name = renderLable(
      judgeProcessType(processStatusData[processStatusData.length - 1].name),
      Number((100 - total).toFixed(1))
    )
  }
  return processStatusData
}

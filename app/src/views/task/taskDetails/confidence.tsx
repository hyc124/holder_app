import React, { useEffect, useState, useRef, useContext } from 'react'
// import echarts from 'echarts/lib/echarts'
// import 'echarts/lib/chart/line'
// // // 引入提示框和标题组件
// import 'echarts/lib/component/tooltip'
// import 'echarts/lib/component/title'
// import 'echarts/lib/component/legend'
// import 'echarts/lib/component/markPoint'
import ReactEcharts from 'echarts-for-react'
import { HeartFilled } from '@ant-design/icons'
import './detailAttach.less'
import { message, Rate } from 'antd'
import { DetailContext, taskDetailContext } from './detailRight'
import { ipcRenderer } from 'electron'

export const Confidence = (props: any) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { singleRefresh } = taskDetailObj
  const { cci, process, processStatus, id } = taskDetailObj.mainData
  const { editOKRSave } = taskDetailObj
  const { cciList, dataState } = props
  const [state, setState] = useState<any>({
    heart: null, //暂存信心指数
  })
  const [showHeart, setShowHeart] = useState<any>(false)
  const heartRef = useRef<any>()
  //添加进展汇报后刷新
  useEffect(() => {
    // 监听汇报修改KR信心指数刷新
    ipcRenderer.on('refresh_operated_task', (_: any, data: any) => {
      const { taskIds } = data.data
      taskDetailObj.mainData

      // 判断汇报变更是否包含当前O,不存在则右侧无数据，无需更新
      if (!taskIds || !taskIds.includes(dataState.id)) return

      singleRefresh({ taskId: taskIds[0] }).then((resData: any) => {
        // setState({ ...state, dataState: resData, heart: resData.cci / 2 })
        // 刷新动态日志
        // refreshTaskLogDetails && refreshTaskLogDetails()
      })
    })
  }, [dataState.id])
  useEffect(() => {
    setState({ ...state, heart: cci / 2 })
    if (cciList.length > 0) {
      setShowHeart(true)
    } else {
      setShowHeart(false)
    }
  }, [cciList, cci])
  const getOption = () => {
    const xList = cciList?.length > 0 ? cciList.map((t: any) => t.updateTime.substring(5)) : []
    const option = {
      tooltip: {
        //提示框组件
        trigger: 'axis',
        backgroundColor: '#3A455E',
        borderColor: '#3A455E',
        textStyle: {
          color: '#FFFFFF',
        },
        formatter: function(param: { name: string; value: string }) {
          // console.log(JSON.stringify(param))
          // console.log(param.name)
          const val = param[0].data.value ? param[0].data.value : '无'

          return (
            '<div style="color：‘#FFFFFF’ "> ' + param[0].data.updateTime + '<br>' + '信心指数：' + val + '<br>'
          )
          '</div>'
        },
      },
      grid: {
        left: '0',
        right: '7%',
        top: '12px',
        bottom: '16px',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        axisLabel: {
          interval: 0,
          // rotate: 40,
          textStyle: {
            fontSize: 10,
            color: '9A9AA2',
          },
        },
        //X轴坐标值
        boundaryGap: false,
        data: xList,
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
        data: [0, 2, 4, 6, 8, 10],
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
          data: cciList, //坐标点数据
          showSymbol: false, //去掉折线图折点圆点
          smooth: true, //平滑折线图
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
                color: '#FFAA00',
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
  // 编辑信心指数
  const editHeart = (heart: any) => {
    const refreshParam = {
      refreshTree: true,
      optType: 'editHeart',
      noQuery: true,
      // callBack: () => {
      //   message.success('编辑成功')
      // },
    }
    editOKRSave({ cci: heart * 2, process, processStatus }, refreshParam).then(() => {
      taskDetailObj.singleRefresh({ ...refreshParam, taskId: dataState.id }).then((resData: any) => {
        message.success('编辑成功')
        // setState({ ...state, dataState: { ...resData } })
      })
    })
  }
  return (
    <>
      <div className={`attachCont`}>
        <header className="attachSecHeader flex between center-v">
          <div className="headerTit">
            <span className="tit_txt">信心指数:{state.heart * 2}</span>
          </div>
          {/* <div className="actionBtn">
            <span></span>
          </div> */}
          <div className={`kr_heart_box`}>
            <Rate
              allowHalf
              className="heard_heart"
              character={
                <HeartFilled
                  style={{
                    fontSize: '14px',
                  }}
                />
              }
              defaultValue={2.5}
              value={cci / 2}
              onChange={(val: number) => {
                if (val || (val == 0 && state.heart == 0.5)) {
                  editHeart(val)
                }
              }}
              onHoverChange={(val: number) => {
                console.log(val)
                if (val) {
                  setState({ ...state, heart: val })
                } else {
                  setState({ ...state, heart: cci / 2 })
                }
              }}
            />
            {/* <span className="heartVal">{state.heart * 2}</span> */}
          </div>
        </header>
        <div className={`showListBox`}>
          <div style={{ height: '200px', width: '100%' }} id="mainEchart">
            {showHeart && <ReactEcharts ref={heartRef} style={{ height: '100%' }} option={getOption()} />}
          </div>
        </div>
      </div>
    </>
  )
}

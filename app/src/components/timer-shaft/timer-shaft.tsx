import React, { useState } from 'react'
import './index.less'

const TimerShaft = (props: any) => {
  const defaults = {
    nowAccount: $store.getState().nowAccount,
    nowUserName: $store.getState().nowUser,
    nowUserId: $store.getState().nowUserId,
    titleText: '强制汇报',
    timershaftEleobj: '', //父元素
    timershaftDataType: '1', //处理数据类型(1:根据时间轴类型和所选时间节点 2:具体的时间点对象(后台时间 2018/10/01 6:30))
    timershaftType: 1, //时间轴类型(1:天 2:周 21:隔周 3:月)
    timershafTime: '', //所选时间节点(隔周:1,2#3,4 第一周-第二周)
    timershaftTimeArray: {}, //时间对象(可支持具体得时间节点对象)
    timershaftStart: '', //任务预估开始时间
    timershaftFinish: '', //任务预估结束时间
    timershaftMinWidth: 100, //每一天格子最小宽度
    timershaftIsShowTime: true, //是否显示计划时间
    timershaftIsShowStart: true, //是否显示开始时间
    timershaftIsShowFinish: true, //是否显示结束时间
    timershaftHours: '', //小时分钟
  }
  // 显示关闭
  const [visible, setVisible] = useState(false)
  // 外部参数
  const getParam = props.param
  // 外部方法
  const action = props.action
  // 合并参数
  return <div>...</div>
}
export default TimerShaft

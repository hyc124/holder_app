import React, { useEffect, useState, useReducer } from 'react'
import { Modal, Select, Checkbox, DatePicker, Tabs, InputNumber, TimePicker, message } from 'antd'
import './index.less'
import moment from 'moment'
const { Option } = Select

//解码后台循环配置
export const loopTaskListDataShow = (data: any) => {
  let dimensionality = ''
  let cyclePeriod = ''
  const cycleModel = data
  let cycletext = ''
  if (cycleModel == null || cycleModel == undefined || cycleModel == '' || JSON.stringify(cycleModel) == '{}') {
    cycletext = ''
  } else {
    if (cycleModel.flag == 1) {
      cycletext = ''
    } else {
      const _cycleTime = cycleModel.cycleTime != '' ? JSON.parse(cycleModel.cycleTime) : ''
      let TimeText = ''
      let minutesText = ''
      if (cycleModel.cycleType == 1) {
        cyclePeriod = '每天'
      } else if (cycleModel.cycleType == 2) {
        cyclePeriod = '每周'
        dimensionality = '星期' + _cycleTime.join(',')
      } else if (cycleModel.cycleType == 3) {
        cyclePeriod = '每月'
        dimensionality = _cycleTime.join(',') + '号'
      } else if (cycleModel.cycleType == 4) {
        cyclePeriod = '每季度'
        for (const i in _cycleTime) {
          dimensionality += ' 第' + i + '月 ' + _cycleTime[i].join(',') + '号'
        }
      } else if (cycleModel.cycleType == 5) {
        cyclePeriod = '每半年'
        dimensionality = _cycleTime.join(',') + '号'
      } else if (cycleModel.cycleType == 6) {
        cyclePeriod = '每一年'
        dimensionality = _cycleTime.join(',') + '号'
      } else if (cycleModel.cycleType == 21) {
        cyclePeriod = '隔周'
        for (const ii in _cycleTime) {
          dimensionality += ' 第' + ii + '周' + ' 星期' + _cycleTime[ii].join(',')
        }
      } else if (cycleModel.cycleType == 71) {
        cyclePeriod = '自定义 每隔' + cycleModel.cycleTimeNum + '天'
      } else if (cycleModel.cycleType == 72) {
        cyclePeriod = '自定义 每隔' + cycleModel.cycleTimeNum + '周'
        dimensionality = '星期' + _cycleTime.join(',')
      } else if (cycleModel.cycleType == 73) {
        cyclePeriod = '自定义 每隔' + cycleModel.cycleTimeNum + '月'
        dimensionality = _cycleTime.join(',') + '号'
      } else if (cycleModel.cycleType == 76) {
        cyclePeriod = '自定义 每隔' + cycleModel.cycleTimeNum + '年'
        for (const iii in _cycleTime) {
          dimensionality += ' 第' + iii + '月 ' + _cycleTime[iii].join(',') + '号'
        }
      }
      // 开始时间 结束时间
      if (cycleModel.startTime || cycleModel.endTime) {
        if (cycleModel.endTime && !cycleModel.startTime) {
          TimeText = '(' + cycleModel.endTime + '截止)'
        } else if (cycleModel.startTime && !cycleModel.endTime) {
          TimeText = '(' + cycleModel.startTime + '开始)'
        } else {
          TimeText = '(' + cycleModel.startTime + '-' + cycleModel.endTime + ')'
        }
      }
      // 小时分钟
      if (cycleModel.triggerTime != '00:00' && !!cycleModel.triggerTime) {
        minutesText = ' ' + cycleModel.triggerTime
      }
      cycletext = '(' + cyclePeriod + ')' + dimensionality + minutesText + '循环' + TimeText
    }
  }
  return cycletext
}

const initStates = {
  looptype: 0, //循环类型
  startTime: '', //开始时间
  endTime: '', //结束时间
  triggerTime: '', //触发时间
  custom: {
    //自定义循环
    cycleTimeNum: '1', //自定义间隔时间
    types: 71, //71,72,73,76自定义 天 周 月 年
  },
  weekdata: [1], //周数据
  monthdata: [1], //月数据
  intervalWeek: { num1: [1], num2: [1] }, //隔周数据
  intervalMonth: { num1: [1], num2: [1], num3: [1] }, //季度数据
  intervalYear: {
    num1: [1],
    num2: [1],
    num3: [1],
    num4: [1],
    num5: [1],
    num6: [1],
    num7: [1],
    num8: [1],
    num9: [1],
    num10: [1],
    num11: [1],
    num12: [1],
  }, //自定义年数据
}
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'looptype':
      return { ...state, looptype: action.data }
    case 'custom':
      return { ...state, custom: action.data }
    case 'startTime':
      return { ...state, startTime: action.data }
    case 'endTime':
      return { ...state, endTime: action.data }
    case 'triggerTime':
      return { ...state, triggerTime: action.data }
    case 'weekdata':
      return { ...state, weekdata: action.data }
    case 'monthdata':
      return { ...state, monthdata: action.data }
    case 'intervalWeek':
      return { ...state, intervalWeek: action.data }
    case 'intervalMonth':
      return { ...state, intervalMonth: action.data }
    case 'intervalYear':
      return { ...state, intervalYear: action.data }
    default:
      return state
  }
}
const LoopsTask = (props: any) => {
  const [state, dispatch] = useReducer(reducer, initStates)
  const defaults = {
    nowAccount: $store.getState().nowAccount,
    nowUserName: $store.getState().nowUser,
    nowUserId: $store.getState().nowUserId,
    titleText: '设置循环任务时间',
  }
  // 显示关闭弹框
  const [visible, setVisible] = useState(false)
  //季度当前选中月份
  const [tabskey, setTabskey] = useState('num1')
  //季度所选月份（1-3月份）
  const [tablist, setTablist] = useState<any>([1])
  //自定义年当前选中月份
  const [yearkey, setYearkey] = useState<any>('num1')
  //自定义年所选月份（1-12月份）
  const [yearlist, setYearlist] = useState<any>([1])
  // 外部参数
  const getParam = props.param
  // 外部方法
  const action = props.action
  // 合并参数
  const options = { ...defaults, ...getParam }
  // 监听弹框显示状态
  useEffect(() => {
    setVisible(getParam.visible)
    initdatas(getParam.initdatas)
  }, [getParam.visible])
  //清除默认数据
  const clearinit = () => {
    dispatch({
      type: 'weekdata',
      data: [1],
    })
    dispatch({
      type: 'monthdata',
      data: [1],
    })
    dispatch({
      type: 'intervalWeek',
      data: { num1: [1], num2: [1] },
    })
    dispatch({
      type: 'intervalMonth',
      data: { num1: [1], num2: [1], num3: [1] },
    })
    dispatch({
      type: 'intervalYear',
      data: {
        num1: [1],
        num2: [1],
        num3: [1],
        num4: [1],
        num5: [1],
        num6: [1],
        num7: [1],
        num8: [1],
        num9: [1],
        num10: [1],
        num11: [1],
        num12: [1],
      },
    })
    setTablist([1])
    setYearlist([1])
  }
  //遍历星期 *****************************************************
  const Setweek = (param: any) => {
    const types = param.type
    const pitchs = param.pitch
    const weekNum = param.weekNum
    const itemNode = []
    const itemCH = ['一', '二', '三', '四', '五', '六', '天']
    const pitchsFn = (index: number) => {
      let classname = ''
      for (let j = 0; j < pitchs.length; j++) {
        if (index == pitchs[j]) {
          classname = 'on'
          break
        }
      }
      return classname
    }
    for (let i = 1; i <= 7; i++) {
      itemNode.push(
        <li
          key={i}
          data-val={i}
          className={pitchsFn(i)}
          onClick={() => {
            setPitch(types, {
              val: i,
              weekNum: weekNum,
            })
          }}
        >
          {itemCH[i - 1]}
        </li>
      )
    }
    return (
      <ul className={param.class || ''} key={types}>
        {itemNode}
      </ul>
    )
  }
  //遍历月 *****************************************************
  const Setmonth = (param: any) => {
    const types = param.type
    const pitchs = param.pitch
    const weekNum = param.weekNum
    const pitchsFn = (index: number) => {
      let classname = ''
      for (let j = 0; j < pitchs.length; j++) {
        if (index == pitchs[j]) {
          classname = 'on'
          break
        }
      }
      return classname
    }
    const itemNode = []
    for (let i = 1; i <= 31; i++) {
      itemNode.push(
        <li
          key={i}
          data-val={i}
          className={pitchsFn(i)}
          onClick={() => {
            setPitch(types, {
              val: i,
              weekNum: weekNum,
            })
          }}
        >
          {i}
        </li>
      )
    }
    return (
      <ul className={param.class || ''} key={types}>
        {itemNode}
      </ul>
    )
  }
  //设置不同状态节点 *****************************************************
  const SetTypeHtml = (param: any) => {
    const _html = []
    const types = param.type
    if (types == 2) {
      //每周循环 ---------------------
      _html.push(
        <div className="week" key={types + 1}>
          <Setweek type={types} pitch={state.weekdata}></Setweek>
        </div>
      )
    } else if (types == 21) {
      //隔周循环 ---------------------
      _html.push(
        <div className="" key={types + 1}>
          <div className="hint_text">第一周</div>
          <Setweek type={types} class={'one_week'} weekNum={'num1'} pitch={state.intervalWeek.num1}></Setweek>
          <div className="hint_text">第二周</div>
          <Setweek type={types} class={'two_week'} weekNum={'num2'} pitch={state.intervalWeek.num2}></Setweek>
        </div>
      )
    } else if (types == 3 || types == 5 || types == 6) {
      //每月、半年、一年循环 ---------------------
      _html.push(
        <div className="" key={types + 1}>
          <Setmonth type={types} pitch={state.monthdata}></Setmonth>
        </div>
      )
    } else if (types == 4) {
      //每季度循环 ---------------------
      const pitchs = tablist
      const itemNode = []
      const pitchsFn = (index: number) => {
        let classname = ''
        for (let j = 0; j < pitchs.length; j++) {
          if (index == pitchs[j]) {
            classname = 'on'
            break
          }
        }
        return classname
      }
      const settablist = (index: any) => {
        const newArr = [...tablist]
        if (newArr.findIndex(item => item === index) == -1) {
          //不重复添加
          newArr.push(index)
        }
        setTablist(newArr)
      }
      for (let i = 1; i <= 3; i++) {
        itemNode.push(
          <span
            key={i}
            data-val={i}
            className={pitchsFn(i)}
            onClick={() => {
              setTabskey(`num${i}`)
              settablist(i)
              if (state.intervalMonth[tabskey].length == 0) {
                state.intervalMonth[tabskey] = [1]
                dispatch({
                  type: 'intervalMonth',
                  data: state.intervalMonth,
                })
              }
            }}
          >
            第{i}个月
          </span>
        )
      }
      _html.push(
        <div className="" key={types + 1}>
          <div className="month-data quarter-data">
            <ul>{itemNode}</ul>
          </div>
          <div className="custom-month-data">
            <Setmonth type={types} weekNum={tabskey} pitch={state.intervalMonth[tabskey]}></Setmonth>
          </div>
        </div>
      )
    } else if (types == 8) {
      //自定义循环 ---------------------
      _html.push(
        <div className="" key={types}>
          <span className="ml-50">每</span>
          <InputNumber
            min={1}
            max={999}
            defaultValue={1}
            value={state.custom.cycleTimeNum}
            onChange={(value: any) => {
              dispatch({
                type: 'custom',
                data: {
                  types: state.custom.types,
                  cycleTimeNum: value,
                },
              })
            }}
          />
          <Select
            defaultValue="71"
            className="customtype"
            value={String(state.custom.types)}
            style={{ width: 178 }}
            onChange={(value: any) => {
              dispatch({
                type: 'custom',
                data: {
                  types: value,
                  cycleTimeNum: state.custom.cycleTimeNum,
                },
              })
            }}
          >
            <Option value="71">天</Option>
            <Option value="72">周</Option>
            <Option value="73">月</Option>
            <Option value="76">年</Option>
          </Select>
          <Customtype className="" data={state.custom.types}></Customtype>
        </div>
      )
    } else {
      return <div></div>
    }
    return <div className="add-loop-data">{_html}</div>
  }
  //自定义周月年 *****************************************************
  const Customtype = (param: any) => {
    const _html = []
    const types = param.data
    if (types == 72) {
      //周
      _html.push(<Setweek type={types} key={types + 1} pitch={state.weekdata}></Setweek>)
    } else if (types == 73) {
      //月
      _html.push(
        <div className="" key={types + 1}>
          <Setmonth type={types} pitch={state.monthdata}></Setmonth>
        </div>
      )
    } else if (types == 76) {
      //年
      const itemNode = []
      const pitchs = yearlist
      const pitchsFn = (index: number) => {
        let classname = ''
        for (let j = 0; j < pitchs.length; j++) {
          if (index == pitchs[j]) {
            classname = 'on'
            break
          }
        }
        return classname
      }
      const settablist = (index: any) => {
        const newArr = [...yearlist]
        if (newArr.findIndex(item => item === index) == -1) {
          //不重复添加
          newArr.push(index)
        }
        setYearlist(newArr)
      }
      for (let i = 1; i <= 12; i++) {
        itemNode.push(
          <span
            key={i}
            data-val={i}
            className={pitchsFn(i)}
            onClick={() => {
              setYearkey(`num${i}`)
              settablist(i)
              if (state.intervalYear[yearkey].length == 0) {
                state.intervalYear[yearkey] = [1]
                dispatch({
                  type: 'intervalYear',
                  data: state.intervalYear,
                })
              }
            }}
          >
            {i}月
          </span>
        )
      }
      _html.push(
        <div className="" key={types + 1}>
          <div className="month-data">
            <ul>{itemNode}</ul>
          </div>
          <div className="custom-month-data">
            <Setmonth type={types} weekNum={yearkey} pitch={state.intervalYear[yearkey]}></Setmonth>
          </div>
        </div>
      )
    }
    return <div className="">{_html}</div>
  }
  //处理数据 *****************************************************
  const setPitch = (types: any, param: any) => {
    const val = param.val
    const weekNum = param.weekNum
    if (types == 2 || types == 72) {
      //每周 -----------------
      const weekArr = [...state.weekdata]
      if (weekArr.findIndex(item => item == val) == -1) {
        //不重复添加
        weekArr.push(val)
      } else {
        //重复删除
        if (weekArr.length != 1) {
          weekArr.splice(
            weekArr.findIndex(item => item == val),
            1
          )
        }
      }
      dispatch({
        type: 'weekdata',
        data: weekArr,
      })
    } else if (types == 21) {
      //隔周 -----------------
      const weekArr = state.intervalWeek[weekNum]
      if (weekArr.findIndex((item: any) => item == val) == -1) {
        //不重复添加
        weekArr.push(val)
      } else {
        //重复删除
        if (
          (state.intervalWeek.num1.length == 0 && state.intervalWeek.num2.length == 1) ||
          (state.intervalWeek.num2.length == 0 && state.intervalWeek.num1.length == 1)
        ) {
        } else {
          weekArr.splice(
            weekArr.findIndex((item: any) => item == val),
            1
          )
        }
      }
      state.intervalWeek[weekNum] = weekArr
      dispatch({
        type: 'intervalWeek',
        data: state.intervalWeek,
      })
    } else if (types == 3 || types == 5 || types == 6 || types == 73) {
      //每月、半年、一年循环 ---------------------
      const weekArr = [...state.monthdata]
      if (weekArr.findIndex(item => item == val) == -1) {
        //不重复添加
        weekArr.push(val)
      } else {
        //重复删除
        if (weekArr.length != 1) {
          weekArr.splice(
            weekArr.findIndex(item => item == val),
            1
          )
        }
      }
      dispatch({
        type: 'monthdata',
        data: weekArr,
      })
    } else if (types == 4) {
      //季度 -----------------
      const weekArr = state.intervalMonth[weekNum]
      if (weekArr.findIndex((item: any) => item == val) == -1) {
        //不重复添加
        weekArr.push(val)
      } else {
        //重复删除
        if (tablist.length == 1 && weekArr.length == 1) {
        } else {
          weekArr.splice(
            weekArr.findIndex((item: any) => item == val),
            1
          )
        }
        //删除所有天数 取消选中tab
        if (weekArr.length == 0) {
          const val = tabskey.split('m')[1]
          const arr = [...tablist]
          arr.splice(
            arr.findIndex((item: any) => item == val),
            1
          )
          setTablist(arr)
        }
      }
      state.intervalMonth[weekNum] = weekArr
      dispatch({
        type: 'intervalMonth',
        data: state.intervalMonth,
      })
    } else if (types == 76) {
      //自定义年 -----------------
      const weekArr = state.intervalYear[weekNum]
      if (weekArr.findIndex((item: any) => item == val) == -1) {
        //不重复添加
        weekArr.push(val)
      } else {
        //重复删除
        if (yearlist.length == 1 && weekArr.length == 1) {
        } else {
          weekArr.splice(
            weekArr.findIndex((item: any) => item == val),
            1
          )
        }
        //删除所有天数 取消选中tab
        if (weekArr.length == 0) {
          const val = yearkey.split('m')[1]
          const arr = [...yearlist]
          arr.splice(
            arr.findIndex((item: any) => item == val),
            1
          )
          setYearlist(arr)
        }
      }
      state.intervalYear[weekNum] = weekArr
      dispatch({
        type: 'intervalYear',
        data: state.intervalYear,
      })
    }
  }
  // 点击取消 *****************************************************
  const handleCancel = () => {
    action.setModalShow(false)
  }
  // 点击确定 *****************************************************
  const handleOk = () => {
    if (checkData()) {
      saveLoopData()
    }
  }
  // 验证 ***************************
  const checkData = () => {
    if (state.endTime && state.startTime && state.startTime > state.endTime) {
      message.warning('开始时间不能大于结束时间')
      return false
    }
    if (state.looptype == 8) {
      //自定义
      if (state.custom.cycleTimeNum == '') {
        message.warning('自定义必须选择时间点')
        return false
      }
    }
    return true
  }
  //保存时间转化为后台所需格式
  const saveLoopData = () => {
    const cycleModelData = {
      flag: state.looptype == 0 ? 1 : 0, //类型：0正常 1删除
      createUser: $store.getState().nowUserId, //创建人
      cycleType: state.looptype == 8 ? state.custom.types : state.looptype, //循环类型:1天,2周,3月,4季度,5半年,6年 21隔周 71,72,73,76自定义 天 周 月 年
      cycleTime: '["0"]', //具体时间
      startTime: state.startTime, //开始时间
      endTime: state.endTime, //结束时间
      triggerTime: state.triggerTime || '00:00', //触发时间
      cycleTimeNum: state.looptype == 8 ? state.custom.cycleTimeNum : '', //自定义间隔时间
    }
    if (state.looptype == 2 || (state.looptype == 8 && state.custom.types == 72)) {
      //周
      cycleModelData.cycleTime = JSON.stringify(state.weekdata)
    } else if (
      state.looptype == 3 ||
      state.looptype == 5 ||
      state.looptype == 6 ||
      (state.looptype == 8 && state.custom.types == 73)
    ) {
      //月
      cycleModelData.cycleTime = JSON.stringify(state.monthdata)
    } else if (state.looptype == 21) {
      //隔周
      cycleModelData.cycleTime = JSON.stringify(state.intervalWeek).replace(/num/g, '')
    } else if (state.looptype == 4) {
      //季度
      const cycleTimeObj = {}
      for (let i = 0; i < tablist.length; i++) {
        cycleTimeObj[tablist[i]] = state.intervalMonth[`num${tablist[i]}`]
      }
      cycleModelData.cycleTime = JSON.stringify(cycleTimeObj)
    } else if (state.looptype == 8 && state.custom.types == 76) {
      //年
      const cycleTimeObj = {}
      for (let i = 0; i < yearlist.length; i++) {
        cycleTimeObj[yearlist[i]] = state.intervalYear[`num${yearlist[i]}`]
      }
      cycleModelData.cycleTime = JSON.stringify(cycleTimeObj)
    }
    action.onOk(cycleModelData)
    action.setModalShow(false)
  }
  //反显循环信息*****************************************************
  const initdatas = (initdatas: any) => {
    if (initdatas && JSON.stringify(initdatas) != '{}' && initdatas.flag != 1) {
      let cycleType: any = ''
      if (
        initdatas.cycleType == 71 ||
        initdatas.cycleType == 72 ||
        initdatas.cycleType == 73 ||
        initdatas.cycleType == 76
      ) {
        cycleType = 8
        dispatch({
          type: 'custom',
          data: {
            cycleTimeNum: initdatas.cycleTimeNum, //自定义间隔时间
            types: initdatas.cycleType, //71,72,73,76自定义 天 周 月 年
          },
        })
      } else {
        cycleType = initdatas.cycleType
      }
      dispatch({
        type: 'looptype',
        data: cycleType,
      })
      dispatch({
        type: 'startTime',
        data: initdatas.startTime,
      })
      dispatch({
        type: 'endTime',
        data: initdatas.endTime,
      })
      dispatch({
        type: 'triggerTime',
        data: initdatas.triggerTime,
      })
      if (initdatas.cycleType == 2 || initdatas.cycleType == 72) {
        //周
        dispatch({
          type: 'weekdata',
          data: JSON.parse(initdatas.cycleTime),
        })
      } else if (
        initdatas.cycleType == 3 ||
        initdatas.cycleType == 5 ||
        initdatas.cycleType == 6 ||
        initdatas.cycleType == 73
      ) {
        //月
        dispatch({
          type: 'monthdata',
          data: JSON.parse(initdatas.cycleTime),
        })
      } else if (initdatas.cycleType == 21) {
        //隔周
        dispatch({
          type: 'intervalWeek',
          data: {
            num1: JSON.parse(initdatas.cycleTime)[1],
            num2: JSON.parse(initdatas.cycleTime)[2],
          },
        })
      } else if (initdatas.cycleType == 4 || initdatas.cycleType == 76) {
        //季度 自定义每年
        const newArr = JSON.parse(initdatas.cycleTime) || []
        const tabs = []
        for (const key in newArr) {
          tabs.push(Number(key))
          const months: any = []
          for (let i = 0; i < newArr[key].length; i++) {
            months.push(Number(newArr[key][i]))
          }
          if (initdatas.cycleType == 4) {
            state.intervalMonth[`num${key}`] = months
          } else {
            state.intervalYear[`num${key}`] = months
          }
        }
        let types = ''
        if (initdatas.cycleType == 4) {
          types = 'intervalMonth'
          setTablist(tabs)
          dispatch({
            type: types,
            data: state.intervalMonth,
          })
        } else {
          types = 'intervalYear'
          setYearlist(tabs)
          dispatch({
            type: types,
            data: state.intervalYear,
          })
        }
      }
    } else {
      clearinit()
    }
  }

  return (
    <Modal
      className="loopTaskDate"
      title={options.titleText}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div className="loopTaskcontent">
        <div className="loop-row">
          <div className="loops-text">
            <span className="frequency">频率</span>
          </div>
          <div className="loops-content">
            <Select
              defaultValue="1"
              style={{ width: 295 }}
              value={String(state.looptype)}
              onChange={(value: any) => {
                clearinit()
                dispatch({
                  type: 'looptype',
                  data: value,
                })
              }}
            >
              <Option value="0">不循环</Option>
              <Option value="1">每天循环</Option>
              <Option value="2">每周循环</Option>
              <Option value="21">隔周循环</Option>
              <Option value="3">每月循环</Option>
              <Option value="4">每季度循环</Option>
              <Option value="5">每半年循环</Option>
              <Option value="6">每一年循环</Option>
              <Option value="8">自定义</Option>
            </Select>
          </div>
        </div>
        <div className="loop-row loops-renewal">
          <div className="loops-text"></div>
          <div className="loops-content">
            <SetTypeHtml type={state.looptype}></SetTypeHtml>
          </div>
        </div>
        <div className={`loop-row ${state.looptype == 0 ? 'forcedHide' : ''}`}>
          <div className="loops-text">循环任务更新时间点：循环当天的</div>
          <div className="loops-content">
            <TimePicker
              className="times"
              defaultValue={moment(state.triggerTime || '00:00', 'HH:mm')}
              format={'HH:mm'}
              allowClear={false}
              style={{ width: 162 }}
              minuteStep={10}
              onChange={(time: any, timeString: any) => {
                dispatch({
                  type: 'triggerTime',
                  data: timeString,
                })
              }}
            />
          </div>
        </div>
        <div className={`loop-row ${state.looptype == 0 ? 'forcedHide' : ''}`}>
          <div className="loops-text">
            <span>循环开始时间</span>
          </div>
          <div className="loops-content loops-times">
            <DatePicker
              onChange={(date: any, dateString: any) => {
                dispatch({
                  type: 'startTime',
                  data: dateString,
                })
              }}
              value={state.startTime ? moment(state.startTime) : null}
              format={'YYYY/MM/DD'}
              style={{ width: 267 }}
            />
          </div>
        </div>
        <div className={`loop-row ${state.looptype == 0 ? 'forcedHide' : ''}`}>
          <div className="loops-text">
            <span>循环结束时间</span>
          </div>
          <div className="loops-content loops-times">
            <DatePicker
              onChange={(date: any, dateString: any) => {
                dispatch({
                  type: 'endTime',
                  data: dateString,
                })
              }}
              value={state.endTime ? moment(state.endTime) : null}
              format={'YYYY/MM/DD'}
              style={{ width: 267 }}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
export default LoopsTask

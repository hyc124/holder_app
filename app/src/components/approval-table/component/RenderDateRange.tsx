import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import React from 'react'
import { CSSProperties, useEffect, useState } from 'react'
import $c from 'classnames'
import { DatePicker, Input, TimePicker } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import moment from 'moment'

/**日期区间控件 */
const RenderDateRange = ({
  formElementModel,
  formItemStyles,
  isAuth,
  changeData,
  name,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  isAuth: boolean
  changeData?: (item: any, value?: string, content?: string) => void
  name: any
}) => {
  //获取缓存
  const { formulaNumvalObj } = $store.getState()
  let rangeDate: any = null
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    rangeDate = formulaNumvalObj[formElementModel.uuId]
  } else {
    rangeDate = formElementModel.value || undefined
  }
  //合计时间
  const [totalObj, setTotalObj] = useState({
    day: 0,
    hour: 0,
  })
  let dateFormat = 'YYYY/MM/DD'
  if (formElementModel.dateType === 1) {
    dateFormat = 'YYYY/MM/DD HH:mm'
  } else if (formElementModel.dateType === 2) {
    dateFormat = 'HH:mm'
  }

  let startTime = rangeDate ? (rangeDate.includes(',') ? rangeDate.split(',')[0] : rangeDate.split('-')[0]) : ''
  let endTime = rangeDate ? (rangeDate.includes(',') ? rangeDate.split(',')[1] : rangeDate.split('-')[1]) : ''
  useEffect(() => {
    setTotalObj(setTotalTime(startTime, endTime, formElementModel.dateType))
  }, [startTime, endTime])
  if (formElementModel.dateType === 2 && rangeDate) {
    startTime = startTime.split(' ')[1]
    endTime = endTime.split(' ')[1]
  }
  //修改时间回调
  const changeRangeTime = (_dates: any, dateStrings: string[]) => {
    let sendVal = dateStrings[0] + ',' + dateStrings[1]
    if (dateStrings[0] === '') {
      sendVal = ''
    }
    if (formElementModel.dateType === 2) {
      const nowDate = $tools.getMyDate().split(' ')[0]
      sendVal = nowDate + ' ' + dateStrings[0] + ',' + nowDate + ' ' + dateStrings[1]
    }
    //设置合计时间
    setTotalObj(setTotalTime(dateStrings[0], dateStrings[1], formElementModel.dateType))
    // changeData && changeData(formElementModel, sendVal, sendVal)
    const updateData = { [formElementModel.uuId]: sendVal }
    changeData && changeData({ data: updateData, contentArr: sendVal })
  }
  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={'dateRange'}
      data-uuid={formElementModel.uuId}
      data-mark={formElementModel.condition}
      data-isauth={formElementModel.edit === 0 ? false : true}
      data-isdef={formElementModel.isDefault === 1 ? true : false}
      data-isedit={formElementModel.special === 1 ? true : false}
      data-datetype={formElementModel.dateType}
      data-parentuuid={formElementModel.parentUuId}
      data-onlyflag={formElementModel.repeatRowVal}
      data-normalvalue={formElementModel.normalValue}
    >
      <div className={$c('plugRowLeft', { hideName: formElementModel.showName === 0 })}>
        {formElementModel.name}
      </div>
      <div className="plugRowRight">
        {formElementModel.dateType !== 2 && (
          <DatePicker.RangePicker
            disabled={[!isAuth, !isAuth]}
            suffixIcon={isAuth ? <CalendarOutlined /> : false}
            value={startTime && endTime ? [moment(startTime, dateFormat), moment(endTime, dateFormat)] : null}
            showTime={formElementModel.dateType === 1}
            style={{ width: formElementModel.dateType === 1 ? '270px' : '' }}
            format={dateFormat}
            onChange={changeRangeTime}
          ></DatePicker.RangePicker>
        )}
        {formElementModel.dateType === 2 && (
          // @ts-ignore
          <TimePicker.RangePicker
            disabled={[!isAuth, !isAuth]}
            value={startTime && endTime ? [moment(startTime, dateFormat), moment(endTime, dateFormat)] : null}
            suffixIcon={isAuth ? <CalendarOutlined /> : false}
            format={dateFormat}
            showNow={true}
            order={false}
            onChange={changeRangeTime}
          ></TimePicker.RangePicker>
        )}
        {formElementModel.totalTime === 1 && (
          <div className="time_range_amount flex center-v">
            {formElementModel.dateType === 2 && (
              <>
                <span>合计</span>
                <Input disabled value={totalObj.hour} />
                <span>小时</span>
              </>
            )}
            {formElementModel.dateType !== 2 && (
              <>
                <span>合计</span>
                <Input disabled value={totalObj.day} />
                <span>天</span>
                {formElementModel.dateType === 1 && (
                  <>
                    <Input disabled value={totalObj.hour} />
                    <span>小时</span>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default RenderDateRange

// =================求两个日期的间隔===============//
const diffTime = (startDate: string, endDate: string, dateType: number) => {
  let stime = new Date(startDate).getTime()
  let etime = new Date(endDate).getTime()
  if (!startDate) {
    stime = new Date().getTime()
  }
  if (!endDate) {
    etime = new Date().getTime()
  }
  const usedTime = etime - stime //两个时间戳相差的毫秒数
  let days = Math.floor(usedTime / (24 * 3600 * 1000))
  //计算出小时数
  const leave1 = usedTime % (24 * 3600 * 1000) //计算天数后剩余的毫秒数
  let hours = Math.floor(leave1 / (3600 * 1000))
  //计算相差分钟数
  const leave2 = leave1 % (3600 * 1000) //计算小时数后剩余的毫秒数
  const minutes = Math.floor(leave2 / (60 * 1000))

  if (dateType == 1) {
    // 日期格式为年月日 时分时，当分钟数大于等于30向上取整，小于30向下取整

    if (diffHour(minutes)) {
      hours += 1
    }
    if (hours == 24) {
      days += 1
      hours = 0
    }
  }

  return { day: days, hour: hours, minute: minutes }
}

/**
 * 计算合计时间
 */
const setTotalTime = (startTime: string, endTime: string, dateType: number) => {
  let day = 0,
    hour = 0
  if (startTime === '' || endTime === '' || startTime === undefined || endTime === undefined) {
    return {
      day,
      hour,
    }
  }

  if (dateType == 2) {
    // 时分

    const _startTimeSplit: any =
      startTime && startTime.length > 5 ? startTime.split(' ')[1].split(':') : startTime.split(':')
    const _endTimeSplit: any =
      endTime && endTime.length > 5 ? endTime.split(' ')[1].split(':') : endTime.split(':')

    const _startTime = _startTimeSplit[0] * (60000 * 60) + _startTimeSplit[1] * 60000
    const _endTime = _endTimeSplit[0] * (60000 * 60) + _endTimeSplit[1] * 60000

    const usedTime = _endTime - _startTime
    //计算出小时数
    const leave1 = usedTime % (24 * 3600 * 1000) //计算天数后剩余的毫秒数
    const hours = Math.floor(leave1 / (3600 * 1000))
    if (_startTime > _endTime) {
      hour = 24 - Math.abs(hours) //若选择的开始时间大于结束时间，则结束时间表示次日，统计时也按到次日的时长进行统计；
    } else if (_startTime == _endTime) {
      hour = 0 //测试讨论之后决定一样的时候就合计0，不管是直接填入提供的当前时间，还是用户手动选择一次结束时间
    } else {
      hour = Math.abs(hours) //若选择的开始时间大于结束时间，则结束时间表示次日，统计时也按到次日的时长进行统计；
    }
    if (_startTime != _endTime && diffs(Number(_startTimeSplit[1]), Number(_endTimeSplit[1]))) {
      hour += 1
    }
  } else {
    const difftime = diffTime(startTime, endTime, dateType)
    if (dateType == 1) {
      //显示小时
      day = difftime.day
      hour = difftime.hour
    } else {
      if (startTime == endTime) {
        day = 1
      } else {
        day = difftime.day + 1
      }
    }
  }
  return {
    day: day,
    hour: hour,
  }
}

const diffs = (s: number, e: number) => {
  // 时分时，当分钟数大于等于30向上取整，小于30向下取整
  const _diff = 30
  const _num = 60
  let type = false
  if ((s < e && Number(e - s) >= _diff) || (s > e && Math.abs(e - s) <= _num)) {
    type = true
  }
  return type
}

const diffHour = (m: number) => {
  const _diff = 30
  let type = false

  if (Number(m) >= Number(_diff)) {
    type = true
  }
  return type
}

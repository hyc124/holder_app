import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import React from 'react'
import { CSSProperties, useEffect, useState } from 'react'
import $c from 'classnames'
import { Button, DatePicker, Input, message, TimePicker } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import moment from 'moment'
import { shallowEqual, useSelector } from 'react-redux'
import { getElementValue } from '../getData/getData'
import { useMergeState } from '@/src/views/approval-execute/ApprovalExecute'

/**请假日期区间控件 */
const RenderLeaveDateRange = ({
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
  const [dataAuth, setDataAuth] = useState(isAuth)
  const [state, setState] = useMergeState({
    openStartTime: false,
    openEndTime: false,
    startTime: '',
    startAmPm: '',
    endTime: '',
    endAmPm: '',
  })
  const approvalCheckData = useSelector((state: StoreStates) => state.approvalCheckData, shallowEqual)
  const { formulaNumvalObj } = $store.getState()
  let rangeDate: any = null
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    rangeDate = formulaNumvalObj[formElementModel.uuId]
  } else {
    rangeDate = formElementModel.value || undefined
  }
  let startTime = rangeDate ? JSON.parse(rangeDate).startTime : ''
  let endTime = rangeDate ? JSON.parse(rangeDate).endTime : ''
  let startAmPm = rangeDate ? JSON.parse(rangeDate).startTimeTag : ''
  let endAmPm = rangeDate ? JSON.parse(rangeDate).endTimeTag : ''
  const [timeType, setTimeType] = useState(rangeDate ? JSON.parse(rangeDate).timeType : 'day')
  let dateFormat: any = 'YYYY/MM/DD'
  if (timeType === 'hour') {
    dateFormat = 'YYYY/MM/DD HH:mm'
  }
  //修改时间回调
  const changeRangeTime = (_dates: any, dateStrings: string[]) => {
    let sendVal = dateStrings[0] + '-' + dateStrings[1]
    let elementValue: any = {
      startTime: dateStrings[0],
      startTimeTag: '',
      endTime: dateStrings[1],
      endTimeTag: '',
      timeType: 'hour',
    }
    if (timeType == 'day') {
      sendVal = dateStrings[0] + ' 00:00' + '-' + dateStrings[1] + ' 00:00'
      elementValue = {
        startTime: dateStrings[0] + ' 00:00',
        startTimeTag: '',
        endTime: dateStrings[1] + ' 00:00',
        endTimeTag: '',
        timeType: 'day',
      }
    }
    if (dateStrings[0] === '') {
      sendVal = ''
      elementValue = ''
    }
    const updateData = { [formElementModel.uuId]: JSON.stringify(elementValue) }
    changeData && changeData({ data: updateData, contentArr: sendVal })
  }

  const beInfluences = approvalCheckData.filter(
    idx => formElementModel.beInfluenceUuid && formElementModel.beInfluenceUuid.includes(idx.uuId)
  )
  const beInVals = beInfluences
    .map(idx => {
      return idx.valueContent
    })
    .toString()
  //控件组控制权限
  useEffect(() => {
    if (formElementModel.beInfluenceUuid) {
      let newAuth = true
      beInfluences.map(item => {
        if (!item.valueContent) {
          newAuth = false
        }
      })
      ;(async () => {
        //如果选择了人员请求下拉框数据
        if (newAuth && beInfluences.length != 0) {
          setTimeType(beInfluences[0].leaveDateRangeType || 'day')
        }
        setDataAuth(newAuth)
      })()
    }
  }, [beInVals])

  const listenerFunc = (e: any) => {
    const _con = $('.ant-picker-dropdown,.ant-picker-focused') // 设置目标区域
    if (!_con.is(e.target) && _con.has(e.target).length === 0) {
      if (!state.openStartTime && !state.openEndTime) {
        return
      }
      if (
        (state.openEndTime && (!state.endTime || !state.endAmPm)) ||
        (state.openStartTime && (!state.startTime || !state.startAmPm))
      ) {
        message.error('必须选择当前日期上午或者下午')
        return
      }
      setState({
        openStartTime: false,
        openEndTime: false,
      })
      let _start = state.startTime.replace(/[\u4e00-\u9fa5]/g, '') + ' 00:00'
      let _end = state.endTime.replace(/[\u4e00-\u9fa5]/g, '') + ' 00:00'
      if (_start > _end || (_start == _end && state.startAmPm == 'PM' && state.endAmPm == 'AM')) {
        message.error('开始时间不能大于等于结束时间')
        return
      }
      let sendVal = _start + '-' + _end
      let elementValue: any = {
        startTime: _start,
        startTimeTag: state.startAmPm,
        endTime: _end,
        endTimeTag: state.endAmPm,
        timeType: 'half_day',
      }
      const updateData = { [formElementModel.uuId]: JSON.stringify(elementValue) }
      changeData && changeData({ data: updateData, contentArr: sendVal })
    }
  }

  useEffect(() => {
    if (timeType == 'half_day') {
      document.addEventListener('click', listenerFunc)
    } else {
      document.removeEventListener('click', listenerFunc)
    }
    return () => {
      document.removeEventListener('click', listenerFunc)
    }
  }, [timeType])

  //开始弹出和关闭日历
  const openStartTime = (open: any) => {
    open &&
      setState({
        openStartTime: open,
        openEndTime: false,
      })
  }
  //开始时间变化
  const changeStartTime = (date: any, dateStrings: string) => {
    if (dateStrings == '') {
      const updateData = { [formElementModel.uuId]: '' }
      changeData && changeData({ data: updateData, contentArr: '' })
    }
    setState({
      startTime: dateStrings,
    })
  }
  //开始时间上午
  const selectStartAm = () => {
    if (!state.startTime) {
      message.error('请先选择开始时间')
      return
    }
    if (!state.endTime) {
      setState({
        startAmPm: 'AM',
        openStartTime: false,
      })
      return
    }
    let _start = state.startTime.replace(/[\u4e00-\u9fa5]/g, '')
    let _end = state.endTime.replace(/[\u4e00-\u9fa5]/g, '')
    if (_start > _end) {
      message.error('开始时间不能大于等于结束时间')
      setState({
        startTime: null,
      })
      const updateData = { [formElementModel.uuId]: '' }
      changeData && changeData({ data: updateData, contentArr: '' })
      return
    }
    let sendVal =
      _start + '上午' + '-' + _end + (state.endAmPm ? (state.endAmPm == 'AM' ? '上午' : '下午') : '')
    let elementValue: any = {
      startTime: _start + ' 00:00',
      startTimeTag: 'AM',
      endTime: _end + ' 00:00',
      endTimeTag: state.endAmPm,
      timeType: 'half_day',
    }
    const updateData = { [formElementModel.uuId]: JSON.stringify(elementValue) }
    changeData && changeData({ data: updateData, contentArr: sendVal })
    setState({
      startAmPm: 'AM',
      openStartTime: false,
    })
  }
  //开始时间下午
  const selectStartPm = () => {
    if (!state.startTime) {
      message.error('请先选择开始时间')
      return
    }
    if (!state.endTime) {
      setState({
        startAmPm: 'PM',
        openStartTime: false,
      })
      return
    }
    let _start = state.startTime.replace(/[\u4e00-\u9fa5]/g, '')
    let _end = state.endTime.replace(/[\u4e00-\u9fa5]/g, '')
    if (_start > _end || (_start == _end && state.endAmPm == 'AM')) {
      message.error('开始时间不能大于等于结束时间')
      setState({
        startTime: null,
      })
      const updateData = { [formElementModel.uuId]: '' }
      changeData && changeData({ data: updateData, contentArr: '' })
      return
    }
    let sendVal =
      _start + '下午' + '-' + _end + (state.endAmPm ? (state.endAmPm == 'AM' ? '上午' : '下午') : '')
    let elementValue: any = {
      startTime: _start + ' 00:00',
      startTimeTag: 'PM',
      endTime: _end + ' 00:00',
      endTimeTag: state.endAmPm,
      timeType: 'half_day',
    }
    const updateData = { [formElementModel.uuId]: JSON.stringify(elementValue) }
    changeData && changeData({ data: updateData, contentArr: sendVal })
    setState({
      startAmPm: 'PM',
      openStartTime: false,
    })
  }
  //结束弹出和关闭日历
  const openEndTime = (open: any) => {
    open &&
      setState({
        openEndTime: open,
        openStartTime: false,
      })
  }
  //结束时间变化
  const changeEndTime = (date: any, dateStrings: string) => {
    if (dateStrings == '') {
      const updateData = { [formElementModel.uuId]: '' }
      changeData && changeData({ data: updateData, contentArr: '' })
    }
    setState({
      endTime: dateStrings,
    })
  }
  //结束时间上午
  const selectEndAm = () => {
    if (!state.endTime) {
      message.error('请先选择日期')
      return
    }
    if (!state.startTime) {
      message.error('请先选择开始时间')
      return
    }
    let _start = state.startTime.replace(/[\u4e00-\u9fa5]/g, '')
    let _end = state.endTime.replace(/[\u4e00-\u9fa5]/g, '')
    if (_start > _end || (_start == _end && state.startAmPm == 'PM')) {
      message.error('开始时间不能大于等于结束时间')
      setState({
        endTime: null,
      })
      const updateData = { [formElementModel.uuId]: '' }
      changeData && changeData({ data: updateData, contentArr: '' })
      return
    }
    let sendVal =
      _start + (state.startAmPm ? (state.startAmPm == 'AM' ? '上午' : '下午') : '') + '-' + _end + '上午'
    let elementValue: any = {
      startTime: _start + ' 00:00',
      startTimeTag: state.startAmPm,
      endTime: _end + ' 00:00',
      endTimeTag: 'AM',
      timeType: 'half_day',
    }
    const updateData = { [formElementModel.uuId]: JSON.stringify(elementValue) }
    changeData && changeData({ data: updateData, contentArr: sendVal })
    setState({
      endAmPm: 'AM',
      openEndTime: false,
    })
  }
  //结束时间下午
  const selectEndPm = () => {
    if (!state.endTime) {
      message.error('请先选择日期')
      return
    }
    if (!state.startTime) {
      message.error('请先选择开始时间')
      return
    }
    let _start = state.startTime.replace(/[\u4e00-\u9fa5]/g, '')
    let _end = state.endTime.replace(/[\u4e00-\u9fa5]/g, '')
    if (_start > _end) {
      message.error('开始时间不能大于结束时间')
      setState({
        endTime: null,
      })
      const updateData = { [formElementModel.uuId]: '' }
      changeData && changeData({ data: updateData, contentArr: '' })
      return
    }
    let sendVal =
      _start + (state.startAmPm ? (state.startAmPm == 'AM' ? '上午' : '下午') : '') + '-' + _end + '下午'
    let elementValue: any = {
      startTime: _start + ' 00:00',
      startTimeTag: state.startAmPm,
      endTime: _end + ' 00:00',
      endTimeTag: 'PM',
      timeType: 'half_day',
    }
    const updateData = { [formElementModel.uuId]: JSON.stringify(elementValue) }
    changeData && changeData({ data: updateData, contentArr: sendVal })
    setState({
      endAmPm: 'PM',
      openEndTime: false,
    })
  }
  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={'leaveDateRange'}
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
        {timeType === 'day' && (
          <DatePicker.RangePicker
            disabled={[!dataAuth, !dataAuth]}
            suffixIcon={dataAuth ? <CalendarOutlined /> : false}
            value={startTime && endTime ? [moment(startTime, dateFormat), moment(endTime, dateFormat)] : null}
            showTime={formElementModel.dateType === 1}
            style={{ width: formElementModel.dateType === 1 ? '270px' : '' }}
            format={dateFormat}
            onChange={changeRangeTime}
          ></DatePicker.RangePicker>
        )}
        {timeType === 'hour' && (
          // @ts-ignore
          <DatePicker.RangePicker
            disabled={[!dataAuth, !dataAuth]}
            value={startTime && endTime ? [moment(startTime, dateFormat), moment(endTime, dateFormat)] : null}
            suffixIcon={dataAuth ? <CalendarOutlined /> : false}
            format={dateFormat}
            showNow={true}
            order={false}
            showTime
            showSecond={false}
            style={{ width: 300 }}
            onChange={changeRangeTime}
          ></DatePicker.RangePicker>
        )}
        {timeType === 'half_day' && (
          // @ts-ignore
          <>
            <DatePicker
              disabled={!dataAuth}
              suffixIcon={dataAuth ? <CalendarOutlined /> : false}
              showToday={false}
              open={state.openStartTime}
              renderExtraFooter={() => (
                <>
                  <Button style={{ marginRight: 5 }} onClick={selectStartAm}>
                    上午
                  </Button>
                  <Button onClick={selectStartPm}>下午</Button>
                </>
              )}
              value={
                state.startTime
                  ? moment(state.startTime, 'YYYY/MM/DD')
                  : startTime
                  ? moment(startTime, 'YYYY/MM/DD')
                  : null
              }
              format={(value: any) => {
                return `${value.format('YYYY/MM/DD')}${
                  state.startAmPm
                    ? state.startAmPm == 'PM'
                      ? '下午'
                      : '上午'
                    : startAmPm
                    ? startAmPm == 'PM'
                      ? '下午'
                      : '上午'
                    : ''
                }`
              }}
              onChange={changeStartTime}
              onOpenChange={openStartTime}
            ></DatePicker>
            <DatePicker
              disabled={!dataAuth}
              suffixIcon={dataAuth ? <CalendarOutlined /> : false}
              renderExtraFooter={() => (
                <>
                  <Button style={{ marginRight: 5 }} onClick={selectEndAm}>
                    上午
                  </Button>
                  <Button onClick={selectEndPm}>下午</Button>
                </>
              )}
              value={
                state.endTime
                  ? moment(state.endTime, 'YYYY/MM/DD')
                  : endTime
                  ? moment(endTime, 'YYYY/MM/DD')
                  : null
              }
              open={state.openEndTime}
              showToday={false}
              format={(value: any) =>
                `${value.format('YYYY/MM/DD')}${
                  state.endAmPm
                    ? state.endAmPm == 'PM'
                      ? '下午'
                      : '上午'
                    : endAmPm
                    ? endAmPm == 'PM'
                      ? '下午'
                      : '上午'
                    : ''
                }`
              }
              onChange={changeEndTime}
              onOpenChange={openEndTime}
            ></DatePicker>
          </>
        )}
      </div>
    </div>
  )
}
export default RenderLeaveDateRange

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

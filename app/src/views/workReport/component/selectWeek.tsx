import { useEffect, useState } from 'react'
import moment from 'moment'
import React from 'react'
import { Select } from 'antd'

// const getWeeks = (currentTime: any) => {
//   //JS获取当前周第一天
//   const currentDate = new Date(currentTime)
//   const timesStamp = currentDate.getTime()
//   const currenDay = currentDate.getDay()
//   const dates = []
//   for (let i = 0; i < 7; i++) {
//     if (i == 0 || i == 6) {
//       dates.push(
//         moment(new Date(timesStamp + 24 * 60 * 60 * 1000 * (i - ((currenDay + 7) % 7)))).format('YYYY/MM/DD')
//       )
//     }
//   }
//   return dates
// }

function getWeekStartAndEnd(timestamp: any) {
  const oneDayTime = 1000 * 60 * 60 * 24 // 一天里一共的毫秒数
  const today = timestamp ? new Date(timestamp) : new Date()
  const todayDay = today.getDay() || 7 // 若那一天是周末时，则强制赋值为7
  const dates = []
  const startDate = moment(new Date(today.getTime() - oneDayTime * (todayDay - 1))).format('YYYY/MM/DD')
  const endDate = moment(new Date(today.getTime() + oneDayTime * (7 - todayDay))).format('YYYY/MM/DD')
  dates.push(startDate)
  dates.push(endDate)
  return dates
}

const SelectWeek = ({
  changeWeek,
  selectWeek,
  disabled,
}: {
  changeWeek: (value: string) => void
  selectWeek: string
  disabled: boolean
}) => {
  const [selWeek, setSelWeek] = useState('本周')
  const nowDate = new Date()
  const nowYear = new Date().getFullYear()
  const lastYear = new Date().getFullYear() - 1
  const nowWeek = getWeekStartAndEnd(nowDate) //获取当前周开始和结束时间
  const lastDay = new Date()
  lastDay.setDate(nowDate.getDate() - 7)
  const lastWeek = getWeekStartAndEnd(lastDay) //获取上周开始和结束时间
  const lastDay1 = new Date()
  lastDay1.setDate(nowDate.getDate() - 14)
  const lastWeek1 = getWeekStartAndEnd(lastDay1) //获取上上周开始和结束时间
  const lastDay2 = new Date()
  lastDay2.setDate(nowDate.getDate() - 21)
  const lastWeek2 = getWeekStartAndEnd(lastDay2) //获取上上上周开始和结束时间
  const lastDay3 = new Date()
  lastDay3.setDate(nowDate.getDate() - 28)
  const lastWeek3 = getWeekStartAndEnd(lastDay3) //获取上上上上周开始和结束时间

  useEffect(() => {
    changeWeek(nowWeek[0])
  }, [])
  useEffect(() => {
    if (selectWeek === nowWeek[0]) {
      setSelWeek('本周')
    }
    if (selectWeek === lastWeek[0]) {
      setSelWeek('上周')
    }
    if (selectWeek === lastWeek1[0]) {
      setSelWeek(lastWeek1[0] + '-' + lastWeek1[1])
    }
    if (selectWeek === lastWeek2[0]) {
      setSelWeek(lastWeek2[0] + '-' + lastWeek2[1])
    }
    if (selectWeek === lastWeek3[0]) {
      setSelWeek(lastWeek3[0] + '-' + lastWeek3[1])
    }
  }, [selectWeek])

  const changeTime = (value: string, Option: any) => {
    setSelWeek(value)
    changeWeek(Option.data)
  }
  return (
    <Select
      className="select-month-box"
      value={selWeek}
      style={{ width: 170 }}
      onChange={changeTime}
      disabled={disabled}
    >
      <Select.Option data={nowWeek[0]} value="本周">
        本周
      </Select.Option>
      <Select.Option data={lastWeek[0]} value="上周">
        上周
      </Select.Option>
      <Select.Option data={lastWeek1[0] + '-' + lastWeek1[1]} value={lastWeek1[0] + '-' + lastWeek1[1]}>
        {lastWeek1[0]}-{lastWeek1[1]}
      </Select.Option>
      <Select.Option data={lastWeek2[0] + '-' + lastWeek2[1]} value={lastWeek2[0] + '-' + lastWeek2[1]}>
        {lastWeek2[0]}-{lastWeek2[1]}
      </Select.Option>
      <Select.Option data={lastWeek3[0] + '-' + lastWeek3[1]} value={lastWeek3[0] + '-' + lastWeek3[1]}>
        {lastWeek3[0]}-{lastWeek3[1]}
      </Select.Option>
    </Select>
  )
}

export default SelectWeek

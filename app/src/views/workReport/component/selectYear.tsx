import { useEffect, useState } from 'react'
import moment from 'moment'
import React from 'react'
import { Select } from 'antd'

const SelectYear = ({
  changeYear,
  selectYear,
  disabled,
}: {
  changeYear: (value: string) => void
  selectYear: string
  disabled: boolean
}) => {
  // const nowYear = new Date().getFullYear()
  const [nowYear, setNowYear] = useState(new Date().getFullYear())
  const lastYear = new Date().getFullYear() - 1
  const nowMonth = new Date().getMonth() + 1
  const [selValue, setSelValue] = useState(nowYear)

  // 默认值
  // useEffect(() => {
  //   changeYear(nowYear + '')
  // }, [])

  useEffect(() => {
    if (selectYear) {
      setSelValue(Number(selectYear))
    }
  }, [selectYear])

  const getNowYears = (value: string) => {
    const _val = value.split('年')[0]
    changeYear(_val)
    // setSelValue(Number(value))
  }

  return (
    <div>
      <Select
        className="select-month-box"
        value={selValue + '年'}
        style={{ width: 120 }}
        onChange={getNowYears}
        disabled={disabled}
      >
        <Select.Option value={nowYear + '年'}>{nowYear + '年'}</Select.Option>
        <Select.Option value={lastYear + '年'}>{lastYear + '年'}</Select.Option>
      </Select>
    </div>
  )
}
export default SelectYear

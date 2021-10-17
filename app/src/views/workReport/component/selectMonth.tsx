import { useEffect, useState } from 'react'
import moment from 'moment'
import React from 'react'
import { Select } from 'antd'

/**计算该月有多少天 */
export const getMonthDate = (nowMonth: any, nowYear: any) => {
  let moreDate
  if (
    nowMonth == 1 ||
    nowMonth == 3 ||
    nowMonth == 5 ||
    nowMonth == 7 ||
    nowMonth == 8 ||
    nowMonth == 10 ||
    nowMonth == 12
  ) {
    moreDate = 31
  } else if (nowMonth == 2) {
    if ((nowYear % 4 == 0 && nowYear % 100 != 0) || nowYear % 400 == 0) {
      moreDate = 29
    } else {
      moreDate = 28
    }
  } else {
    moreDate = 30
  }

  return moreDate
}
const SelectMonth = ({
  changeMonth,
  selectYear,
  changeDatas,
  nowSelMonth,
  disabled,
}: {
  changeMonth: (value: string, nowSelMonth: string) => void
  selectYear: string
  changeDatas: boolean
  nowSelMonth: string
  disabled: boolean
}) => {
  //获取当前月 7
  let nowMonth = new Date().getMonth() + 1
  // 编辑获取时间
  const monthArr: any = []

  const nowYear = new Date().getFullYear()

  const [defaultValue, setDeafultValue] = useState<string>(
    (Number(nowMonth) < 10 ? '0' + nowMonth : nowMonth) + '月'
  )

  if (Number(selectYear) < nowYear) {
    // 根据选择的年份来判断月
    nowMonth = 12
  }

  // 年份改变，月份跟着改变
  useEffect(() => {
    if (selectYear) {
      if (Number(selectYear) < nowYear) {
        // 根据选择的年份来判断月
        nowMonth = 12
      }
      let _nowselmonth =
        typeof nowSelMonth === 'string' ? Number(nowSelMonth.split('/')[1]) : Number(nowSelMonth)
      if (_nowselmonth > nowMonth) {
        // 月份比较，eg:2019 --12月到2020 --09月
        _nowselmonth = nowMonth
      }

      setDeafultValue((_nowselmonth < 10 ? '0' + _nowselmonth : _nowselmonth) + '月')
    }
  }, [selectYear])

  useEffect(() => {
    if (nowSelMonth !== '') {
      setDeafultValue(nowSelMonth === 'string' ? nowSelMonth.split('/')[1] + '月' : nowSelMonth)
    }
  }, [nowSelMonth])

  for (let i = 1; i <= nowMonth; i++) {
    monthArr.push(i)
  }
  // 默认值
  useEffect(() => {
    const _mon = Number(nowMonth) < 10 ? '0' + nowMonth : nowMonth
    const _getMonthDay = getMonthDate(nowMonth, selectYear)
    changeMonth(_mon + '/01' + ',' + _mon + '/' + _getMonthDay, _mon + '_' + _getMonthDay)
  }, [])

  const getMonths = (val: string) => {
    const value = val.split('月')[0]
    // const _mon = Number(value) < 10 ? '0' + value : value
    const _mon = value
    const _getMonthDay = getMonthDate(value, selectYear)
    changeMonth(_mon + '/01' + ',' + _mon + '/' + _getMonthDay, _mon + '_' + _getMonthDay)
    setDeafultValue(_mon + '月')
  }

  return (
    <div>
      <Select
        className="select-month-box"
        defaultValue={defaultValue}
        style={{ width: 120 }}
        onChange={getMonths}
        value={defaultValue}
        disabled={disabled}
      >
        {monthArr.map((item: any, i: number) => {
          const _val = Number(item) < 10 ? '0' + item : item
          return (
            <Select.Option key={_val} value={_val + '月'}>
              {_val + '月'}
            </Select.Option>
          )
        })}
      </Select>
    </div>
  )
}

export default SelectMonth

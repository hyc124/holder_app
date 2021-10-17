import { useEffect, useState } from 'react'
import moment from 'moment'
import React from 'react'
import { Select } from 'antd'

export const quertQuater = (quartorNum: number, selectQuarter: any) => {
  const _sQuater = selectQuarter.split('/')
  const _selQuater = '/' + _sQuater[1] + '/' + _sQuater[2]
  let _txt = ''
  let _data = ''
  if (_selQuater === '/01/01' || _selQuater <= '/03/31') {
    _txt = '第一季度'
    _data = '01/01,/03/31'
  }
  if (_selQuater === '/04/01' || (_selQuater <= '/06/30' && _selQuater >= '04/01')) {
    // setDeafultValue('第二季度')
    if (quartorNum < 3) {
      _txt = '第一季度'
      _data = '01/01,/03/31'
    } else {
      _txt = '第二季度'
      _data = '04/01,06/30'
    }

    if (quartorNum === 2) {
      _txt = '第二季度'
      _data = '04/01,06/30'
    }
  }
  if (_selQuater === '/07/01' || (_selQuater <= '09/30' && _selQuater >= '/07/01')) {
    if (quartorNum < 3) {
      _txt = '第二季度'
      _data = '04/01,06/30'
    } else {
      _txt = '第三季度'
      _data = '/07/01,09/30'
    }
  }
  if (_selQuater === '/10/01' || (_selQuater <= '12/31' && _selQuater >= '/10/01')) {
    if (quartorNum < 4) {
      _txt = '第三季度'
      _data = '/07/01,09/30'
    } else {
      _txt = '第四季度'
      _data = '/10/01,12/31'
    }
  }
  return {
    title: _txt,
    data: _data,
  }
}
const SelectQuarter = ({
  changeQuarter,
  selectYear,
  selectQuarter,
  disabled,
}: {
  changeQuarter: (value: string) => void
  selectYear: string
  selectQuarter: string
  disabled: boolean
}) => {
  //获取当前月
  const nowYear = new Date().getFullYear()
  const nowMonth = new Date().getMonth() + 1
  let quartorNum = Math.ceil(nowMonth / 3)
  const quarterArr = []
  let noQuartor = '一'
  let showDate = ''
  let showEndDate = ''

  const [defaultValue, setDeafultValue] = useState<string>('第' + noQuartor + '季度')
  if (Number(selectYear) < nowYear) {
    // 根据选择的年份来判断季度
    quartorNum = 4
  }

  for (let i = 1; i <= quartorNum; i++) {
    if (i == 1) {
      ;(noQuartor = '一'),
        (showDate = '01/01'),
        (showEndDate = '03/31'),
        quarterArr.push({
          showQua: '一',
          showDate: '01/01',
          showEndDate: '03/31',
        })
    } else if (i == 2) {
      ;(noQuartor = '二'),
        (showDate = '04/01'),
        (showEndDate = '06/30'),
        quarterArr.push({
          showQua: '二',
          showDate: '04/01',
          showEndDate: '06/30',
        })
    } else if (i == 3) {
      ;(noQuartor = '三'),
        (showDate = '07/01'),
        (showEndDate = '09/30'),
        quarterArr.push({
          showQua: '三',
          showDate: '07/01',
          showEndDate: '09/30',
        })
    } else {
      ;(noQuartor = '四'),
        (showDate = '10/01'),
        (showEndDate = '12/31'),
        quarterArr.push({
          showQua: '四',
          showDate: '10/01',
          showEndDate: '12/31',
        })
    }
  }
  // 默认值
  useEffect(() => {
    const _mon = Number(nowMonth) < 10 ? '0' + nowMonth : nowMonth
    changeQuarter(showDate + ',' + showEndDate)
    setDeafultValue('第' + noQuartor + '季度')
  }, [])

  // 年份改变，季度跟着改变
  useEffect(() => {
    if (selectYear) {
      setDeafultValue(quertQuater(quartorNum, selectQuarter).title)
      // setDeafultValue('第' + noQuartor + '季度')
    }
  }, [selectYear])

  // 编辑
  useEffect(() => {
    setDeafultValue(quertQuater(quartorNum, selectQuarter).title)
  }, [selectQuarter])

  const getQuarters = (value: string, option: any) => {
    changeQuarter(option.data)
    setDeafultValue(value)
  }
  return (
    <div>
      <Select
        className="select-month-box"
        defaultValue={'第' + noQuartor + '季度'}
        value={defaultValue}
        style={{ width: 120 }}
        onChange={getQuarters}
        disabled={disabled}
      >
        {quarterArr.map((item: any, i: number) => {
          return (
            <Select.Option
              key={i}
              data={item.showDate + ',' + item.showEndDate}
              value={'第' + item.showQua + '季度'}
            >
              {'第' + item.showQua + '季度'}
            </Select.Option>
          )
        })}
      </Select>
    </div>
  )
}
export default SelectQuarter

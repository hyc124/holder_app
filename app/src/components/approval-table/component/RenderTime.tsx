import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import React from 'react'
import { CSSProperties, useEffect, useState } from 'react'
import $c from 'classnames'
import { DatePicker, TimePicker } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import moment from 'moment'

/**time控件 */
const RenderTime = ({
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
  let timeVal: any = null
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    timeVal = formulaNumvalObj[formElementModel.uuId]
  } else {
    timeVal = formElementModel.value || undefined
  }
  const [editTime, setEditTime] = useState(timeVal)
  useEffect(() => {
    // 时间改变，bug：11113
    timeVal = editTime
    if (formElementModel.dateType === 2) {
      timeVal = editTime ? editTime.split(' ')[1] : editTime
    }
  }, [editTime])
  //修改时间
  const changeTimeVal = (_date: any, dateString: string) => {
    let sendTime = dateString
    if (formElementModel.dateType === 2) {
      sendTime = $tools.getMyDate().split(' ')[0] + ' ' + dateString
    }
    setEditTime(sendTime)
    const updateData = { [formElementModel.uuId]: sendTime }
    changeData && changeData({ data: updateData, contentArr: sendTime })
    // changeData && changeData(formElementModel, sendTime, sendTime)
  }
  let dateFormat = 'YYYY/MM/DD'
  if (formElementModel.dateType === 1) {
    dateFormat = 'YYYY/MM/DD HH:mm'
  } else if (formElementModel.dateType === 2) {
    dateFormat = 'HH:mm'
  }
  if (formElementModel.dateType === 2 && formElementModel.value) {
    timeVal = timeVal.split(' ')[1]
  }
  //自动获取时间
  if (formElementModel.selfMade === 1 && !formElementModel.value && formElementModel.edit !== 0) {
    const nowDate = $tools.getMyDate()
    if (formElementModel.dateType === 2) {
      timeVal = nowDate.split(' ')[1]
    } else {
      timeVal = nowDate
    }
    const updateData = { [formElementModel.uuId]: nowDate }
    changeData && changeData({ data: updateData, contentArr: nowDate })
    // changeData && changeData(formElementModel, nowDate, nowDate)
  }
  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={'time'}
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
        {(formElementModel.dateType === 0 || formElementModel.dateType === 1) && (
          <DatePicker
            disabled={!isAuth || formElementModel.selfMade === 1}
            value={timeVal ? moment(timeVal, dateFormat) : undefined}
            onChange={changeTimeVal}
            format={dateFormat}
            suffixIcon={isAuth && formElementModel.selfMade !== 1 ? <CalendarOutlined /> : false}
            showTime={formElementModel.dateType === 1}
          />
        )}
        {formElementModel.dateType === 2 && (
          <TimePicker
            disabled={!isAuth || formElementModel.selfMade === 1}
            value={
              timeVal
                ? moment(
                    timeVal.length > 7
                      ? timeVal.split(' ')[1] === ''
                        ? '00:00'
                        : timeVal.split(' ')[1]
                      : timeVal,
                    dateFormat
                  )
                : undefined
            }
            onChange={changeTimeVal}
            suffixIcon={isAuth && formElementModel.selfMade !== 1 ? <CalendarOutlined /> : false}
            format={dateFormat}
          />
        )}
      </div>
    </div>
  )
}
export default RenderTime

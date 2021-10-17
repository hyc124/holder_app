import React, { useEffect, useState, useRef } from 'react'
import { Modal, Button, Checkbox, Select } from 'antd'
import $c from 'classnames'

const ReportListSetting = ({
  setSettingVisible,
  visibleType,
}: {
  setSettingVisible: (value: boolean) => void
  visibleType: boolean
}) => {
  //编辑模块弹窗是否显示
  const { nowUserId, loginToken } = $store.getState()
  // 保存后台返回的设置模板
  const [settingListData, setListDataArr] = useState<any>([])
  // 保存已经设置过的数据
  const [settingSaveData, setListSaveDataArr] = useState<any>([])
  const [setList, setListPop] = useState(false)

  //点击确定后保存的参数集合
  const [saveParam, setSaveParam] = useState<any>([])

  const [setChecked, setCheckedStatus] = useState<any>(['1'])

  const [triggerTime, setTriggerTime] = useState({ time: '18', min: '00' })

  useEffect(() => {
    if (visibleType) {
      ;(async () => {
        const listDataArr = await setReport()
        const saveDataArr = await findScheduleRemindsByUserId()
        setListSaveDataArr(saveDataArr)
        setListDataArr(listDataArr)
        setListPop(true)
        if (saveDataArr) {
        }
      })()
    }
  }, [visibleType])

  const setReport = () => {
    return new Promise(resolve => {
      const param = {
        userId: nowUserId,
      }
      $api
        .request('public/scheduleRemind/getAllEnumsSelect', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(resData => {
          resolve(resData.data)
        })
    })
  }

  const findScheduleRemindsByUserId = () => {
    return new Promise(resolve => {
      const param = {
        userId: nowUserId,
        type: 3, //工作报告
      }
      $api
        .request('/public/scheduleRemind/findScheduleRemindsByUserId', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(resData => {
          const datas = resData.data
          // 设置提醒方式
          if (datas && datas.length > 0) {
            setCheckedStatus(datas[0].remindNoticeType === 3 ? '1,2' : String(datas[0].remindNoticeType))
            if (datas[0].triggerTime.split(' ')[1] != '00:00:00') {
              //时间选中
              const getHours = datas[0].triggerTime.split(' ')[1].split(':')[0]
              const getMinutes = datas[0].triggerTime.split(' ')[1].split(':')[1]
              setTriggerTime({
                time: getHours,
                min: getMinutes,
              })
            }
          }

          resolve(datas)
        })
    })
  }

  //   保存选中
  const selectSet = () => {
    // setListPop(false)
    // setSettingVisible(false)
    const sendNoticeType = setChecked.length > 1 ? 3 : setChecked[0]
    const getFullYear = new Date().getFullYear()
    const getMonth =
      new Date().getMonth() + 1 < 10 ? '0' + (new Date().getMonth() + 1) : new Date().getMonth() + 1
    const getDate = new Date().getDate() < 10 ? '0' + new Date().getDate() : new Date().getDate()
    const sendTriggerTime = `${getFullYear}/${getMonth}/${getDate} ${triggerTime.time}:${triggerTime.min}:00`
    const sendParam = saveParam
      .filter((item: { triggerPeriod: string }) => item.triggerPeriod !== '0')
      .map((item: any) => {
        return {
          ...item,
          remindNoticeType: sendNoticeType,
          userId: nowUserId,
          scheduleType: 3,
          flag: 1,
          triggerTime: sendTriggerTime,
        }
      })
    const param = {
      key: sendParam,
    }
    $api
      .request('/public/scheduleRemind/save', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        setSettingVisible(false)
      })
  }

  const cancelSet = () => {
    setListPop(false)
    setSettingVisible(false)
  }
  //   const setSettingVisible(value:boolean)=>{
  //     setListPop(false)
  //   }

  const ReturnTime = ({ len, dataType, onChange }: any) => {
    const arr = []
    for (let i = 0; i < len; i++) {
      arr.push(i)
    }
    return (
      <Select
        className="select-hour-box"
        defaultValue={dataType == 'hour' ? triggerTime.time : triggerTime.min}
        style={{ width: 76 }}
        onChange={onChange}
      >
        {arr.map((item: any, i: number) => {
          return (
            <Select.Option key={item} value={item < 10 ? '0' + item : item}>
              {item < 10 ? '0' + item : item}
            </Select.Option>
          )
        })}
      </Select>
    )
  }

  const remindNoticeType = (checkedValue: any) => {
    setCheckedStatus(checkedValue)
  }

  /**
   * 获取模板操作数据
   */
  const getTemplateData = (fixData: any[], customData: any[]) => {
    const fixedParam = fixData
      .filter(item => item.triggerPeriod && item.triggerPeriod !== '')
      .map(item => {
        return {
          triggerType: item.code,
          triggerPeriod: item.triggerPeriod,
        }
      })
    const customParam = customData
      .filter(item => item.triggerPeriod && item.triggerPeriod !== '')
      .map(item => {
        return {
          templateIds: item.id,
          teamplateName: item.name,
          triggerType: item.triggerType,
          triggerPeriod: item.triggerPeriod,
        }
      })
    setSaveParam([...fixedParam, ...customParam])
  }

  const hintTypeCheckBox = [
    { label: '应用内提醒', value: '1' },
    { label: '短信/邮件提醒', value: '2' },
  ]

  const changeTime = (value: string) => {
    setTriggerTime({
      ...triggerTime,
      time: value,
    })
  }

  const changeMin = (value: string) => {
    setTriggerTime({
      ...triggerTime,
      min: value,
    })
  }

  return (
    <Modal
      className="report_set_pop"
      centered
      visible={setList}
      title="设置"
      maskClosable={false}
      onOk={selectSet}
      onCancel={cancelSet}
      footer={
        <div className="modalFooter">
          <div className="report_remind_hint">
            <span className="report_hint_hours">
              <span>提醒方式：</span>
              {<ReturnTime dataType="hour" len={24} onChange={changeTime} />}
              <span>时</span>
              {<ReturnTime dataType="min" len={60} onChange={changeMin} />}
              <span>分</span>
            </span>
            <div className="report_hint_type">
              <Checkbox.Group
                defaultValue={setChecked}
                options={hintTypeCheckBox}
                onChange={remindNoticeType}
              ></Checkbox.Group>
            </div>
          </div>
          <div style={{ width: '160px' }}>
            <Button type="ghost" onClick={cancelSet}>
              取消
            </Button>
            <Button type="primary" onClick={selectSet}>
              确定
            </Button>
          </div>
        </div>
      }
    >
      <div className="tits">工作报告设置：</div>
      <SettingTemplate
        dataSource={settingListData}
        savedData={settingSaveData}
        getTemplateData={getTemplateData}
      />
    </Modal>
  )
}
export default ReportListSetting

//保存参数类型
interface TriggerDataProps {
  triggerPeriod: string
  triggerType: number
  templateIds?: string
  teamplateName?: string
}

//工作报告设置模板
const SettingTemplate = (props: {
  dataSource: any
  savedData: any
  getTemplateData: (fixData: any, customData: any) => void
}) => {
  const { dataSource, getTemplateData, savedData } = props
  //处理固定模板数据
  const fixedTemplate: {
    code: number //3(日报)4时(周报)1或者2或者5时(年报，月报，季报)
    name: string //日报(3)...
    select: { code: number; name: string }[]
    triggerPeriod?: string
  }[] = dataSource.triggerType.map((item: { code: number }) => {
    const backData = savedData.filter(
      (idx: { templateIds: any; triggerType: number }) => !idx.templateIds && idx.triggerType === item.code
    )
    if (item.code === 3) {
      //日报 值有(1,2,3,4,5,6,7) ，代表日报类型的周一至周日
      return {
        ...item,
        triggerPeriod: backData.length > 0 ? backData[0].triggerPeriod : '',
        select: dataSource.dailySelect,
      }
    } else if (item.code === 4) {
      // 周报 值有(11,12,13,14,15,16,17) 代表周报类型的周一至周日
      return {
        ...item,
        triggerPeriod: backData.length > 0 ? backData[0].triggerPeriod : '',
        select: dataSource.weeklySelect,
      }
    } else {
      //年报 1，月报 2，季报 5 ，值有（21,22,23,24）依次代表第一天，第三天，倒数第三天，最后一天
      return {
        ...item,
        triggerPeriod: backData.length > 0 ? backData[0].triggerPeriod : '',
        select: dataSource.otherSelect,
      }
    }
  })
  const customTemplate: {
    id: string
    name: string
    showWeekDay: boolean
    showMonthBox: boolean
    triggerType?: number
    triggerPeriod?: string
    templateIds: string
  }[] = dataSource.customTemplate.map((item: any[]) => {
    const backData = savedData.filter(
      (idx: { templateIds: any; triggerType: number }) => idx.templateIds && idx.templateIds === item[1]
    )
    return {
      id: item[1],
      name: item[0],
      showWeekDay: backData.length > 0 && backData[0].triggerType === 4 ? true : false,
      showMonthBox: backData.length > 0 && backData[0].triggerType === 2 ? true : false,
      triggerPeriod: backData.length > 0 ? backData[0].triggerPeriod : '',
      triggerType: backData.length > 0 ? backData[0].triggerType : 0,
    }
  })
  //固定模板数据
  const [fixedTemplateData, setFixedTemplateData] = useState(fixedTemplate)
  //自定义模板数据
  const [customTemplateData, setCustomTemplateData] = useState(customTemplate)
  //自定义模板下拉菜单
  const customWorkReportSelect: { code: number; name: string }[] = dataSource.customWorkReportSelect

  // 自定义模板 每月
  const [customTemplateMonthData, setCustomTemplateMonthData] = useState('')
  //保存的参数集合
  const [triggerData, setTriggerData] = useState<Array<TriggerDataProps>>([])

  useEffect(() => {
    getTemplateData(fixedTemplateData, customTemplateData)
  }, [fixedTemplateData, customTemplateData])

  //获取日报选中 type 0 固定模板  1自定义模板
  const changeDayCheck = (type: number, checkedValue: any[], templateId?: string) => {
    const triggerPeriod = checkedValue.join(',')
    if (type === 0) {
      const newFixTemplateData = fixedTemplateData.map(item => {
        if (item.code === 3) {
          return {
            ...item,
            triggerPeriod,
          }
        }
        return item
      })
      setFixedTemplateData(newFixTemplateData)
    } else {
      const newCustomTemplateData = customTemplateData.map(item => {
        if (item.id === templateId) {
          return {
            ...item,
            triggerType: 4,
            triggerPeriod,
          }
        }
        return item
      })
      setCustomTemplateData(newCustomTemplateData)
    }
  }

  //展示日报的多选框  type 0 固定模板  1自定义模板  templateId自定义模板id
  const getDayCheckBox = (
    type: number,
    data: { code: number; name: string }[],
    triggerPeriod?: string,
    templateId?: string
  ) => {
    const checkBoxOptions = data.map(item => {
      return {
        label: item.name,
        value: String(item.code),
      }
    })
    const defaultCheck = triggerPeriod && triggerPeriod !== '' ? triggerPeriod.split(',') : []
    return (
      <Checkbox.Group
        options={checkBoxOptions}
        defaultValue={defaultCheck}
        onChange={(checkedValue: any[]) => {
          changeDayCheck(type, checkedValue, templateId)
        }}
      />
    )
  }

  //切换周报季报年报月报下拉
  const onChangeSelect = (value: string, options: any) => {
    const triggerPeriod = value
    const newFixTemplateData = fixedTemplateData.map(item => {
      if (String(item.code) === options) {
        return {
          ...item,
          triggerType: item.code,
          triggerPeriod: value,
        }
      }
      return item
    })
    setFixedTemplateData(newFixTemplateData)
  }
  //展示周报的下拉
  const getSelect = (
    type: string,
    data: { code: number; name: string }[],
    triggerType: string,
    triggerPeriod?: string
  ) => {
    const defaultSel = data.filter(item => item.code !== 0 && item.code === Number(triggerPeriod))
    return (
      <Select
        className="select-month-box"
        defaultValue={defaultSel.length > 0 ? type + defaultSel[0].name : '无'}
        style={{ width: 120 }}
        onChange={(value: string) => onChangeSelect(value, triggerType)}
      >
        {data.map(item => {
          return (
            <Select.Option key={item.code} value={String(item.code)}>
              {item.code === 0 ? item.name : type + item.name}
            </Select.Option>
          )
        })}
      </Select>
    )
  }

  //切换自定义下拉
  const changeCustomSelect = (triggerType: number, id: string) => {
    const newCustomTemplateData = customTemplateData.map(item => {
      if (item.id === id) {
        return {
          ...item,
          showWeekDay: triggerType === 4 ? true : false,
          showMonthBox: triggerType === 2 ? true : false,
          triggerPeriod: '',
        }
      }
      return item
    })
    setCustomTemplateData(newCustomTemplateData)
  }

  const changeCanleder = (id: string, triggerPeriod: string) => {
    const newCustomTemplateData = customTemplateData.map(item => {
      if (item.id === id) {
        return {
          ...item,
          triggerPeriod: triggerPeriod,
        }
      }
      return item
    })

    setCustomTemplateData(newCustomTemplateData)
  }

  return (
    <ul className="setList">
      {fixedTemplateData.map(item => (
        <li key={item.code}>
          <span className="tit">{item.name + '报'}</span>
          <div className="cont">
            <span className="c_tit">报告时间：</span>
            {item.code === 3 && getDayCheckBox(0, item.select, item.triggerPeriod)}
            {item.code === 4 && getSelect('每周', item.select, String(item.code), item.triggerPeriod)}
            {item.code === 2 && getSelect('每月', item.select, String(item.code), item.triggerPeriod)}
            {item.code === 5 && getSelect('每季', item.select, String(item.code), item.triggerPeriod)}
            {item.code === 1 && getSelect('每年', item.select, String(item.code), item.triggerPeriod)}
          </div>
        </li>
      ))}
      {customTemplateData.map(item => (
        <li key={item.id}>
          <span className="tit">{item.name}</span>
          <div className="cont">
            <span className="c_tit">报告时间：</span>
            <Select
              className="select-month-box"
              defaultValue={item.triggerType || 0}
              style={{ width: 120 }}
              onChange={(value: number) => changeCustomSelect(value, item.id)}
            >
              {customWorkReportSelect.map(item => (
                <Select.Option key={item.code} value={item.code}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
            {item.showWeekDay && getDayCheckBox(1, dataSource.dailySelect, item.triggerPeriod, item.id)}
            {item.showMonthBox && (
              <div className="custom">
                <MonthDom id={item.id} triggerPeriod={item.triggerPeriod} changeData={changeCanleder} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

//生成选择日历
const MonthDom = ({
  id,
  triggerPeriod,
  changeData,
}: {
  id: string
  triggerPeriod: any
  changeData: (id: string, triggerPeriod: string) => void
}) => {
  //是否显示日历
  const [showCanleder, setShowCanleder] = useState(false)
  const selectArr = triggerPeriod.split(',')
  const [showSelect, setShowSelect] = useState<Array<string>>(selectArr)
  const monthRef = useRef<any>(null)
  const spanRef = useRef<any>(null)
  const ulRef = useRef<any>(null)

  // useEffect(() => {
  //   document.addEventListener('click', ev => hideCanleder(ev))
  //   return () => {
  //     document.removeEventListener('click', ev => hideCanleder(ev))
  //   }
  // }, [showSelect])

  // const hideCanleder = (ev: any) => {
  //   if (monthRef.current !== ev.target && spanRef.current !== ev.target && ulRef.current !== ev.target) {
  //     setShowCanleder(false)
  //     changeData(id, showSelect.join(','))
  //   }
  // }

  //生成指定长度数组并赋值
  const getList = (len: number) => [...new Array(len).keys()]
  // 获取选中日期
  const getSelectMonth = (value: number, id: string) => {
    const newSelect = showSelect.includes(String(value))
      ? showSelect.filter(item => item !== String(value))
      : [...showSelect, String(value)]
    setShowSelect(
      newSelect.sort((a, b) => {
        return parseInt(a) - parseInt(b)
      })
    )
  }
  return (
    <div
      className="month_style_box"
      ref={monthRef}
      onClick={e => {
        e.preventDefault()
        setShowCanleder(true)
      }}
    >
      <span ref={spanRef}>{showSelect.join(',')}</span>
      <ul ref={ulRef} className={`month_style ${showCanleder ? '' : 'hide'}`}>
        {getList(31).map((item: any, i: number) => {
          return (
            <li
              key={i}
              className={$c({ active: showSelect.includes(String(i + 1)) })}
              onClick={e => {
                e.nativeEvent.stopImmediatePropagation()
                getSelectMonth(i + 1, id)
              }}
            >
              {item + 1}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

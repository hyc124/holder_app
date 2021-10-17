import React, { useState, useEffect } from 'react'
import { Modal, Radio, Rate, InputNumber, Progress, TimePicker, message, Spin } from 'antd'
import moment from 'moment'
import './taskManageSet.less'
import { requestApi } from '../../../common/js/ajax'
import { getAuthStatus } from '../../../common/js/api-com'
import { refreshListFn as refreshTaskManageList } from '../taskManage/TaskManageList'
const { confirm } = Modal
const format = 'HH:mm'
import $c from 'classnames'

const startArr = [
  { level: 6, count: 6, label: 1 },
  { level: 5, count: 5, label: 1 },
  { level: 4, count: 4, label: 1 },
  { level: 3, count: 3, label: 1 },
  { level: 2, count: 2, label: 1 },
  { level: 1, count: 1, label: 1 },
]
const customArr = [
  { level: 1, color: 'red' },
  { level: 2, color: 'red' },
  { level: 3, color: 'yellow' },
  { level: 4, color: 'yellow' },
  { level: 5, color: 'blue' },
  { level: 6, color: 'blue' },
  { level: 7, color: 'blue' },
  { level: 8, color: 'green' },
  { level: 9, color: 'green' },
  { level: 10, color: 'green' },
]

interface ModalProps {
  visible: boolean
  closeTaskManageSetModal: () => void
}
interface WorkHoursProps {
  teamInfoId: any
  amStart: string
  amEnd: string
  pmStart: string
  pmEnd: string
  hours: string | number
}
const initWorkHours = {
  teamInfoId: null,
  amStart: '00.00',
  amEnd: '00.00',
  pmStart: '00.00',
  pmEnd: '00.00',
  hours: '00.00',
}

const InitTableValue = (priorityAuth: boolean, progressColorAuth: boolean, workHoursAuth: boolean) => {
  if (priorityAuth) {
    return 0
  } else if (priorityAuth == false && progressColorAuth) {
    return 1
  } else if (priorityAuth == false && progressColorAuth == false && workHoursAuth) {
    return 2
  } else {
    return 3
  }
}

const TaskManageSetModal = ({ visible, closeTaskManageSetModal }: ModalProps) => {
  //优先级设置
  const priorityAuth = getAuthStatus('taskGlodSet')
  //进度颜色设置
  const progressColorAuth = getAuthStatus('taskProgressColorSet')
  //工作时长
  const workHoursAuth = getAuthStatus('taskWorkTimeSet')

  const nowSelectNode = $store.getState().taskManageTreeInfo.orgInfo //获取点击公司节点信息
  const [tabValue, setTabValue] = useState(InitTableValue(priorityAuth, progressColorAuth, workHoursAuth))
  const [isChange, setIsChange] = useState(false) //记录是否修改
  const [priorityLevelValue, setPriorityLevelValue] = useState(0) //优先级 radio
  const [progressList, setProgressList] = useState([]) //进度颜色数据
  const [workHours, setWorkHours] = useState<WorkHoursProps>(initWorkHours) //工作时间数据
  const [loading, setLoading] = useState(false)
  const [timeType, setTimeType] = useState('') //时间类型

  useEffect(() => {
    if (!visible) return
    getPriority()
  }, [visible])

  useEffect(() => {
    if (tabValue == 0) getPriority()
    if (tabValue == 1) getProgressColor()
    if (tabValue == 2) getWorkHours()
  }, [tabValue])

  const handleOk = () => {
    if (!isChange) return closeTaskManageSetModal()

    if (tabValue == 0) savePriority()
    if (tabValue == 1) saveProgressColor()

    if (tabValue == 2) {
      const msg: any = regTime(workHours)
      if (msg) return message.error(msg)
      saveWorkHours() // 验证数据
    }
  }

  const handleCancle = () => {
    if (isChange) {
      confirm({
        title: '提醒',
        content: '修改还未保存，确定离开吗？',
        className: 'confirmModal',
        centered: true,
        width: 400,
        onOk: () => {
          setIsChange(false)
          closeTaskManageSetModal()
        },
        onCancel: () => {
          // console.log('Cancel')
        },
      })
      return
    }
    closeTaskManageSetModal()
  }

  // 禁选过滤小时数据
  const disBeginHouse = () => {
    const hours = []
    if (timeType == 'amStart') {
      const amEndHours = Number(workHours.amEnd.split(':')[0])
      // 过滤掉结束小时之后的数据
      for (let i = 0; i < 24; i++) {
        if (i > amEndHours) {
          hours.push(i)
        }
      }
    } else if (timeType == 'amEnd') {
      const amStartHours = Number(workHours.amStart.split(':')[0])
      // 过滤掉开始小时之前的数据
      for (let i = 0; i < 24; i++) {
        if (i < amStartHours) {
          hours.push(i)
        }
      }
    } else if (timeType == 'pmEnd') {
      const pmStartHours = Number(workHours.pmStart.split(':')[0])
      // 过滤掉 下午 开始小时之前的数据
      for (let i = 0; i < 24; i++) {
        if (i < pmStartHours) {
          hours.push(i)
        }
      }
    } else if (timeType == 'pmStart') {
      const pmEndHours = Number(workHours.pmEnd.split(':')[0])
      const amEndHours = Number(workHours.amEnd.split(':')[0])
      // 过滤掉 下午 结束小时之后的数据 和上午结束之前
      for (let i = 0; i < 24; i++) {
        if (i > pmEndHours || i < amEndHours) {
          hours.push(i)
        }
      }
    }
    return hours
  }

  // 禁选过滤分钟数据
  const disabledMinutes = () => {
    const minutes: any = []
    for (let i = 1; i < 60; i++) {
      if (i != 30) {
        minutes.push(i)
      }
    }

    return minutes
  }
  // 验证数据
  const regTime = (obj: any) => {
    const amStart: any = obj.amStart
    const amEnd: any = obj.amEnd
    const pmStart: any = obj.pmStart
    const pmEndr: any = obj.pmEnd
    // const amHours = Math.abs(Number(obj.amEnd.split(':')[0]) - Number(obj.amStart.split(':')[0]))
    // const amMinut = Number(
    //   ((Number(obj.amEnd.split(':')[1]) - Number(obj.amStart.split(':')[1])) / 60).toFixed(1)
    // )
    // const pmHours = Math.abs(Number(obj.pmEnd.split(':')[0]) - Number(obj.pmStart.split(':')[0]))
    // const pmMinut = Number(
    //   ((Number(obj.pmEnd.split(':')[1]) - Number(obj.pmStart.split(':')[1])) / 60).toFixed(1)
    // )

    if (amStart == amEnd || pmStart == pmEndr) return '结束时间不能小于等于开始时间'

    // if (amHours + amMinut > pmHours + pmMinut) return '下午时间不能小于上午时间'
  }
  // tab选择变化
  const onTabChange = (e: object) => {
    const vlaue: any = e

    isChange ? showConfirm(vlaue.target.value) : setTabValue(vlaue.target.value)
  }
  const InputNumberChange = (vlaue: number, index: number) => {
    setIsChange(true)
    const newArr: any = [...progressList]
    newArr[index][0] = Math.round(vlaue)
    setProgressList(newArr)
  }
  // 优先级 选择radio 变化
  const priorityLevelChange = (e: object) => {
    const vlaue: any = e
    setIsChange(true)
    setPriorityLevelValue(vlaue.target.value)
  }

  // 时间选择变化
  const onTimeChange = (time: any, timeString: string, key: string) => {
    setIsChange(true)
    const nowWorkHours = { ...workHours }
    nowWorkHours[key] = timeString
    setWorkHours(nowWorkHours)
    // 计算时间差
    calcTime(nowWorkHours)
  }

  const calcTime = (obj: any) => {
    const amStartArr: any = obj.amStart.split(':')
    const amEndArr: any = obj.amEnd.split(':')
    const pmStartArr: any = obj.pmStart.split(':')
    const pmEndArr: any = obj.pmEnd.split(':')
    const amHour = Math.abs(Number(amEndArr[0]) - Number(amStartArr[0]))
    const amMinut = Number(amEndArr[1]) - Number(amStartArr[1])
    const pmHour = Math.abs(Number(pmEndArr[0]) - Number(pmStartArr[0]))
    const pmMinut = Number(pmEndArr[1]) - Number(pmStartArr[1])
    const res = amHour + pmHour + Number(((amMinut + pmMinut) / 60).toFixed(1))
    obj.hours = res
    setWorkHours(obj)
  }

  const showConfirm = (value: number) => {
    confirm({
      title: '提醒',
      content: '修改还未保存，确定离开吗？',
      width: 400,
      centered: true,
      className: 'confirmModal',
      onOk: () => {
        setTabValue(value)
        setIsChange(false)
      },
      onCancel: () => {
        console.log('Cancel')
      },
    })
  }

  // 获取优先级数据
  const getPriority = () => {
    if (!nowSelectNode.cmyId) {
      return
    }
    const param = { enterpriseId: nowSelectNode.cmyId, typeId: nowSelectNode.cmyId }
    setLoading(true)
    requestApi({
      url: '/task/attach/findPriority',
      param: param,
      json: false,
    }).then((res: any) => {
      setLoading(false)
      if (res.success) {
        setPriorityLevelValue(res.data.data.setType)
      }
    })
  }
  // 保存优先级数据
  const savePriority = () => {
    const param = { teamId: nowSelectNode.cmyId, setType: priorityLevelValue }
    setLoading(true)
    requestApi({
      url: '/task/config/savePriority',
      param: param,
      json: false,
    }).then((res: any) => {
      setLoading(false)
      if (res.success) {
        message.success('修改成功！')
        setIsChange(false)
        closeTaskManageSetModal()
        refreshTaskManageList({ optType: 'editPriority', attachInfo: { priType: priorityLevelValue } })
      }
    })
  }
  // 获取进度颜色数据
  const getProgressColor = () => {
    const param = { teamInfoId: nowSelectNode.cmyId }
    setLoading(true)
    requestApi({
      url: '/task/config/getProgressColor',
      param: param,
      json: false,
    }).then((res: any) => {
      setLoading(false)
      if (res.success) {
        setProgressList(res.data.dataList)
      }
    })
  }
  // 保存进度颜色数据
  const saveProgressColor = () => {
    // 检测是否为空
    const _isEmpty = isEmpty(progressList)
    if (_isEmpty) return message.warning('天数不能为空！')
    // 检测是否存在相同
    const _isRepeat = isRepeat(progressList)
    if (_isRepeat) return message.warning('天数不能重复！')

    const param = {
      teamInfoId: nowSelectNode.cmyId,
      colors: [...progressList],
    }
    setLoading(true)
    requestApi({
      url: '/task/config/saveProgressColor',
      param: param,
      json: true,
    }).then((res: any) => {
      setLoading(false)
      if (res.success) {
        message.success('修改成功！')
        setIsChange(false)
        closeTaskManageSetModal()
      }
    })
  }
  // 保存工作时长数据
  const saveWorkHours = () => {
    const param: WorkHoursProps = { ...workHours }
    param.teamInfoId = nowSelectNode.cmyId
    setLoading(true)
    requestApi({
      url: '/task/config/saveWorkHours',
      param: param,
      json: true,
    }).then((res: any) => {
      setLoading(false)
      if (res.success) {
        message.success('修改成功！')
        setIsChange(false)
        closeTaskManageSetModal()
      }
    })
  }
  // 获取工作时长数据
  const getWorkHours = () => {
    const param = { teamInfoId: nowSelectNode.cmyId }
    setLoading(true)
    requestApi({
      url: '/task/config/getWorkHours',
      param: param,
      json: false,
    }).then((res: any) => {
      setLoading(false)
      if (res.success) {
        setWorkHours(res.data.data)
      }
    })
  }
  // 严重元素是否为空
  const isEmpty = (arr: any) => {
    const nowArr = arr.filter((item: any) => {
      if (item[0] == 0) {
        console.log(item[0])
        return item
      }
    })

    if (nowArr.length > 0) return true
    return false
  }
  // 验证重复元素，有重复返回true；否则返回false
  const isRepeat = (arr: any) => {
    const hash = {}
    const nowArr = arr.map((item: any) => item[0])
    for (const i in nowArr) {
      if (hash[nowArr[i]]) {
        return true
      }
      // 不存在该元素，则赋值为true，可以赋任意值，相应的修改if判断条件即可
      hash[nowArr[i]] = true
    }
    return false
  }
  const RenderStar = () => {
    return (
      <div className={$c('rate-content', { none: priorityLevelValue != 0 })}>
        {startArr.map((item: any, index: number) => (
          <div className={$c('rate-item')} key={index}>
            {item.level} <span className="m-3">优先级</span>
            <Rate value={item.count} disabled /> <span>{item.label}个</span>
          </div>
        ))}
      </div>
    )
  }
  const RenderCustom = () => {
    return (
      <>
        <div className={$c('custom-content', { none: priorityLevelValue != 1 })}>
          {customArr.map((item: any, index: number) => (
            <span className={$c('popu', item.color)} key={index}>
              {item.level}
            </span>
          ))}
        </div>
      </>
    )
  }

  //过滤 inputNumber 只能输入正整数
  const limitDecimals = (value: any) => {
    return value.replace(/^(0+)|[^\d]+/g, '')
  }

  const RenderProgress = () => {
    return (
      <div className="progress-content">
        {progressList.map((item: any, index: number) => (
          <div className="progress-item" key={index}>
            <InputNumber
              size="middle"
              min={0}
              max={99}
              defaultValue={item[0]}
              formatter={limitDecimals}
              parser={limitDecimals}
              onBlur={e => InputNumberChange(Number(e.target.value), index)}
            />
            <span className="">天</span>
            <span className="tip">进度未更新设置颜色为</span>
            <Progress
              percent={70}
              showInfo={false}
              size="small"
              strokeColor={
                index == 0
                  ? 'rgba(66, 133, 244, 1)'
                  : index == 1
                  ? '#34a853'
                  : index == 2
                  ? '#fbbc05'
                  : '#ea4335'
              }
              trailColor={
                index == 0
                  ? 'rgba(172, 202, 247, 1)'
                  : index == 1
                  ? 'rgba(205, 234, 213, 1)'
                  : index == 2
                  ? 'rgba(252, 236, 197, 1)'
                  : 'rgba(250, 209, 206, 1)'
              }
            />
          </div>
        ))}
      </div>
    )
  }
  const RenderTime = () => {
    return (
      <>
        <div className="time-box">
          <span className="work-label">上班时间</span>
          <div className="time-left">
            <TimePicker
              showNow={false}
              onMouseEnter={() => {
                setTimeType('amStart')
              }}
              clearIcon={false}
              hideDisabledOptions={true}
              defaultValue={moment(workHours.amStart, format)}
              format={format}
              disabledHours={disBeginHouse}
              disabledMinutes={disabledMinutes}
              onChange={(time, timeString) => {
                onTimeChange(time, timeString, 'amStart')
              }}
            />
            <span className="cell">-</span>
            <TimePicker
              showNow={false}
              onMouseEnter={() => {
                setTimeType('amEnd')
              }}
              clearIcon={false}
              hideDisabledOptions={true}
              defaultValue={moment(workHours.amEnd, format)}
              format={format}
              disabledHours={disBeginHouse}
              disabledMinutes={disabledMinutes}
              onChange={(time, timeString) => {
                onTimeChange(time, timeString, 'amEnd')
              }}
            />
            <span className="area">上午</span>
          </div>
          <div className="time-right">
            <TimePicker
              onMouseEnter={() => {
                setTimeType('pmStart')
              }}
              showNow={false}
              clearIcon={false}
              hideDisabledOptions={true}
              defaultValue={moment(workHours.pmStart, format)}
              format={format}
              disabledHours={disBeginHouse}
              disabledMinutes={disabledMinutes}
              onChange={(time, timeString) => {
                onTimeChange(time, timeString, 'pmStart')
              }}
            />
            <span className="cell">-</span>
            <TimePicker
              showNow={false}
              onMouseEnter={() => {
                setTimeType('pmEnd')
              }}
              clearIcon={false}
              hideDisabledOptions={true}
              defaultValue={moment(workHours.pmEnd, format)}
              format={format}
              disabledHours={disBeginHouse}
              disabledMinutes={disabledMinutes}
              onChange={(time, timeString) => {
                onTimeChange(time, timeString, 'pmEnd')
              }}
            />
            <span className="area">下午</span>
          </div>
        </div>
      </>
    )
  }
  return (
    <Spin spinning={loading}>
      <Modal
        title="设置"
        okText="保存"
        className="taskManageSetModal"
        width={850}
        visible={visible}
        onOk={() => {
          handleOk()
        }}
        onCancel={() => {
          handleCancle()
        }}
      >
        <Radio.Group
          buttonStyle="solid"
          value={tabValue}
          onChange={e => {
            onTabChange(e)
          }}
          style={{ marginBottom: 16 }}
        >
          {priorityAuth && (
            <Radio.Button value={0}>
              <i
                className={$c(
                  'tab-setting-tab-icon',
                  { priorityLevelIcon: tabValue != 0 },
                  { priorityLevelActiveIcon: tabValue == 0 }
                )}
              ></i>
              优先级
            </Radio.Button>
          )}
          {progressColorAuth && (
            <Radio.Button value={1}>
              <i
                className={$c(
                  'tab-setting-tab-icon',
                  { progressIcon: tabValue != 1 },
                  { progressActiveIcon: tabValue == 1 }
                )}
              ></i>
              进度颜色
            </Radio.Button>
          )}
          {workHoursAuth && (
            <Radio.Button value={2}>
              <i
                className={$c(
                  'tab-setting-tab-icon',
                  { workTimeIcon: tabValue != 2 },
                  { workTimeActiveIcon: tabValue == 2 }
                )}
              ></i>
              工作时长
            </Radio.Button>
          )}
        </Radio.Group>

        <div className="container">
          <div className={$c('desc-cont', { none: tabValue != 0 })}>
            <div className="conpany-title">{nowSelectNode.cmyName}</div>
            <Radio.Group
              onChange={(e: object) => {
                priorityLevelChange(e)
              }}
              value={priorityLevelValue}
            >
              <Radio value={0} className="priority-radio">
                六点优先工作法 <span>(只能有6个优先级任务)</span>
              </Radio>
              <Radio value={1}>自定义</Radio>
            </Radio.Group>
            <RenderStar />
            <RenderCustom />
          </div>
          <div className={$c('desc-cont ', { none: tabValue != 1 })}>
            <p>注：进度未更新设置颜色变化</p>
            <RenderProgress />
          </div>
          <div className={$c('desc-cont', { none: tabValue != 2 })}>
            <div className="total-box">
              <span className="work-label">工作时长</span>
              <span className="number">{workHours.hours}小时/天</span>
            </div>
            <RenderTime />
          </div>
        </div>
      </Modal>
    </Spin>
  )
}

export default TaskManageSetModal

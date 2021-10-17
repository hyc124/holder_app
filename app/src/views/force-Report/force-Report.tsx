/* eslint-disable react/jsx-no-undef */
import React, { useState, useEffect } from 'react'
import { Modal, Select, TimePicker, Checkbox, message, Spin, DatePicker } from 'antd'
import '../force-Report/force-Report.less'
import moment from 'moment'
import TextArea from 'antd/lib/input/TextArea'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { arrObjDuplicate, dateFormats } from '@/src/common/js/common'
import { requestApi } from '@/src/common/js/ajax'
import { refreshReport } from '../workdesk/component/collectedReport'
const { Option } = Select
// 获取当前时间
export const getNowTime = () => {
  const d = new Date()
  const time = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`
  return time
}
//获取汇报时间文本
export const getforceTime = (
  timeType: number,
  timePeriod: string,
  triggerTime: string,
  isReportList?: boolean
) => {
  let text = ''
  const reportMsg = isReportList ? '' : '汇报'
  if (!timePeriod) {
    return text
  }
  if (timeType == 1) {
    text = `每天 ${triggerTime}${reportMsg}`
  } else if (timeType == 2) {
    text = `每周汇报 每周${timePeriod.replace(/0/g, '7')} ${triggerTime}${reportMsg}`
  } else if (timeType == 21) {
    text = `隔周汇报 第一周${timePeriod
      .split('#')[0]
      .replace(/0/g, '7')} ${triggerTime} 第二周${timePeriod
      .split('#')[1]
      .replace(/0/g, '7')} ${triggerTime}${reportMsg}`
  } else if (timeType == 3) {
    text = `每月汇报 每月${timePeriod} ${triggerTime}${reportMsg}`
  }
  return text
}
export const getforceType = (status: string) => {
  let text = ''
  let name = ''
  if (!status) {
    return text
  }
  $.each(status.split(','), function(index: number, item: any) {
    switch (item) {
      case '1':
        name = '开始时'
        break
      case '2':
        name = '结束时'
        break
      case '3':
        name = '延期时'
        break
      case '4':
        name = '变更时'
        break
    }
    status.split(',').length - 1 == index ? (text += name) : (text += name + '、')
  })
  return text
}
const Forcereport = (props: any) => {
  const { datas } = props
  const { nowUserId, nowUser, loginToken } = $store.getState()
  //是否为详情 1详情 0设置 2编辑
  const [isdetail, setIsdetail] = useState('0')
  //选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //选人插件初始化
  const [selMemberOrg, setSelMemberOrg] = useState({})
  //选择成员类型
  const [selectusertype, setSelectusertype] = useState()
  // 显示关闭
  const [visible, setVisible] = useState(false)
  // 汇报时间类型
  const [optiontype, setOptiontype] = useState<any>('2')
  // 周
  const [weekdata, setweekdata] = useState([5])
  // 隔周
  const [intervalWeek, setIntervalWeek] = useState<any>({ num1: [1], num2: [1] })
  // 月
  const [monthdata, setMonthdata] = useState([1])
  // 任务相关信息
  const [taskinit, setTaskinit] = useState<any>({
    id: '',
    taskid: '',
    startTime: '',
    endTime: '',
    teamId: '',
    reportid: '',
    createTime: '',
  })
  //汇报节点
  const [reportTime, setReportTime] = useState<any>([])
  //状态
  const [statusrepor, setStatusrepor] = useState<any>([])
  //时间
  const [triggerTime, settriggerTime] = useState<any>('18:30')
  //汇报要求
  const [describe, setDescribe] = useState('')
  //加载
  const [loading, setLoading] = useState(false)
  //汇报人
  const [reporperson, setReporperson] = useState<any>([])
  //汇报对象
  const [receiverPerson, setReceiverPerson] = useState<any>([])
  // 抄送对象
  const [copyPerson, setCopyPerson] = useState<any>([])
  // 强制汇报开始时间
  const [reportStartTime, setReportStartTime] = useState('')

  //任务状态 2为草稿（可以不填汇报开始时间）
  const [taskFlags, setTaskFlags] = useState(0)

  //是否有删除 编辑权限-
  const [editAuth, seteditAuth] = useState(true)
  //隔周 (1:第一周 2:第二周)
  let across = 1
  const reportTimes: any = []
  // 缓存干系人数据
  const [stakeholderList, setStakeholderList] = useState<any[]>([])

  useEffect(() => {
    setVisible(props.visible)
    setIsdetail(props.datas.isdetail)
    // 查询干系人数据
    queryStakeholderList(props.datas.taskid || '')
    judgeForceRepoerType()
  }, [props.visible])

  // 判断打开弹窗类型，初始数据
  const judgeForceRepoerType = () => {
    //1详情 0设置 2编辑
    if (props.datas.isdetail == 1 || props.datas.isdetail == 2) {
      reportDetails(props.datas.reportid)
    } else if (props.datas.isdetail == 0) {
      getWorkHours(props.datas.teamId)
      setReportStartInit(props.datas.startTime)
      setTaskinit({
        id: '',
        taskid: props.datas.taskid,
        startTime:
          props.datas.from == 'taskManage_detail'
            ? $store.getState().taskdetail.startTime
            : props.datas.startTime,
        endTime:
          props.datas.from == 'taskManage_detail' ? $store.getState().taskdetail.endTime : props.datas.endTime,
        teamId: props.datas.teamId,
        reportid: props.datas.reportid,
      })
    }
  }
  // 获取工作时长数据、新建汇报设置默认企业下班时间
  const getWorkHours = (id: any) => {
    const param = { teamInfoId: id }
    requestApi({
      url: '/task/config/getWorkHours',
      param: param,
      json: false,
    }).then((res: any) => {
      if (res.success) {
        const { returnCode, data } = res.data
        if (returnCode == 0) settriggerTime(data.pmEnd)
      }
    })
  }
  // 初始汇报开始时间
  const setReportStartInit = (time: any) => {
    let reportStartTime
    const nowTime = getNowTime()
    if (time) {
      reportStartTime = time < nowTime ? nowTime : time
    } else {
      reportStartTime = getNowTime()
    }

    if (props.datas.taskFlag) {
      setTaskFlags(props.datas.taskFlag)
      if (props.datas.taskFlag == 2) {
        reportStartTime = ''
      }
    }
    setReportStartTime(reportStartTime)
  }

  // 查询干系人数据
  const queryStakeholderList = (taskId?: any) => {
    const _taskid = !taskId || taskId === 0 ? '' : taskId
    const param = {
      id: _taskid,
      type: 1,
    }
    $api
      .request('/task/selectPerson', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then((resData: any) => {
        if (resData.returnCode == 0) {
          const datas = resData.dataList || []
          const _newDatas: any = []

          datas.map((item: any) => {
            const obj = {
              curId: item.userId,
              curName: item.username,
              curType: 0,
              profile: item.profile,
              account: item.account,
              codeList: item.codeList,
            }
            if (item.userId) _newDatas.push(obj)
          })
          // 拼接传递过来的 指派人 责任人 、督办人、企业联系人等数据 ,去重处理
          let allData: any[] = [..._newDatas].concat(
            props.datas.reportPerson || [],
            props.datas.receiverPerson || [],
            props.datas.copyPerson || [],
            props.datas.teamConcatPerson || []
          )
          allData = arrObjDuplicate(allData, 'curId')
          setStakeholderList([...allData])
          props.datas.isdetail == 2 ? null : setPersonData(datas)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }

  // 新建汇报时 查询任务干系人 过滤处理，设置默认： 指派人、责任人、督办人
  const setPersonData = (arr: any[]) => {
    const report = props.datas.reportPerson || []
    const receiver = props.datas.receiverPerson || []
    const copy = props.datas.copyPerson || []
    const _reportPerson: any[] = []
    const _receiverPerson: any[] = []
    const _copyPerson: any[] = []
    arr.map((item: any) => {
      item.codeList.map((sitem: any) => {
        const type = sitem == '执行人' ? 0 : sitem == '指派人' || sitem == '领导责任人' ? 1 : 2
        const obj: any = {
          account: item.account,
          type,
          username: item.username,
          curName: item.username,
          userid: item.userId,
          curId: item.userId,
          curType: 0,
        }
        if (sitem == '执行人' && item.userId) _reportPerson.push(obj)
        if ((sitem == '指派人' || sitem == '领导责任人') && item.userId) _receiverPerson.push(obj)
        if ((sitem == '关注人' || sitem == '督办人') && item.userId) _copyPerson.push(obj)
      })
    })

    const _report = [...report].concat(_reportPerson)
    const _receiver = [...receiver].concat(_receiverPerson)
    const _copy = [...copy].concat(_copyPerson)
    setReporperson(arrObjDuplicate(_report, 'curId'))
    setReceiverPerson(arrObjDuplicate(_receiver, 'curId'))
    setCopyPerson(arrObjDuplicate(_copy, 'curId'))
  }

  //详情 ----------------------------------------------------------------
  //查询汇报详情
  const reportDetails = (reportid: any) => {
    setLoading(true)
    const param = {
      id: reportid,
      userId: nowUserId,
    }
    $api
      .request('/task/force/report/query', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        setLoading(false)
        const resDatas = resData.data
        setReportDetails(resDatas)
        if (resData.data.flag == 1) {
          // 已删除
          props.setModalShow(false)
          message.error('该数据已删除！')
        }
      })
      .catch(function(res) {
        setLoading(false)
        message.error(res.returnMessage)
        props.setModalShow(false)
      })
  }
  // 更 新设置数据
  const updateUserDatas = (arr: any[]) => {
    const _arr: any = []
    if (arr.length !== 0) {
      for (let i = 0; i < arr.length; i++) {
        _arr.push({
          account: arr[i].account,
          type: arr[i].type,
          userId: arr[i].userId,
          username: arr[i].username,
          curId: arr[i].userId,
          curName: arr[i].username,
          curType: 0,
        })
      }
    }
    return _arr
  }
  //设置状态
  const setReportDetails = (resDatas: any) => {
    setTaskinit({
      id: resDatas.id,
      taskid: resDatas.taskId || props.datas.taskid,
      startTime: props.datas.startTime || resDatas.startTime,
      endTime: props.datas.endTime || resDatas.endTime,
      teamId: props.datas.teamId,
      reportid: resDatas.id,
      createTime: props.datas.createTime,
      operateDescription: resDatas.operateDescription,
      taskName: resDatas.taskName,
      forceText: getforceTime(resDatas.timeType, resDatas.timePeriod, resDatas.triggerTime),
      status: resDatas.status,
    })
    setDescribe(resDatas.content || '')
    const reporperson = updateUserDatas(resDatas.reporter || [])
    setReporperson([...reporperson])
    const receiverPerson = updateUserDatas(resDatas.receiver || [])
    setReceiverPerson([...receiverPerson])
    const copyPerson = updateUserDatas(resDatas.copyUser || [])
    setCopyPerson([...copyPerson])

    const newStartTime = resDatas.startTime ? dateFormats('yyyy/MM/dd HH:mm', resDatas.startTime) : ''
    setReportStartTime(newStartTime)
    if (props.datas.taskFlag) {
      setTaskFlags(props.datas.taskFlag)
      if (props.datas.taskFlag == 2) {
        setReportStartTime('')
      }
    }
    settriggerTime(resDatas.triggerTime)
    setStatusrepor(resDatas.status.split(','))
    setOptiontype(String(resDatas.timeType))
    if (resDatas.timeType == 2) {
      //周
      setweekdata(resDatas.timePeriod.split(','))
    } else if (resDatas.timeType == 3) {
      //月
      setMonthdata(resDatas.timePeriod.split(','))
    } else if (resDatas.timeType == 21) {
      //隔周
      setIntervalWeek({
        num1: resDatas.timePeriod.split('#')[0].split(','),
        num2: resDatas.timePeriod.split('#')[1].split(','),
      })
    }
    //权限 设置强制汇报及汇报对象可编辑
    if (nowUserId == resDatas.receiver || nowUserId == resDatas.operateUser) {
      seteditAuth(true)
    } else {
      seteditAuth(false)
    }
  }
  //删除
  const confirm = () => {
    Modal.confirm({
      title: '操作提示',
      icon: <ExclamationCircleOutlined />,
      content: '确定删除吗?',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        constraintTaskRemove()
      },
    })
  }
  //删除强制汇报
  const constraintTaskRemove = () => {
    setLoading(true)
    const param = {
      id: taskinit.reportid,
      operateUser: nowUserId,
      operateUserName: nowUser,
    }
    $api
      .request('/task/force/report/cancel', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        setLoading(false)
        message.success('已成功')
        props.setModalShow(false)
        props.onOk && props.onOk(resData)
        datas.onOk && datas.onOk(resData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
        setLoading(false)
      })
  }
  //设置编辑 ----------------------------------------------------------------

  /**
   * 强制汇报任务状态
   */

  //保存
  const handleOk = () => {
    if (isdetail == '1') {
      props.setModalShow(false)
      //详情
      return
    }
    setLoading(true)

    if (reporperson.length == 0) {
      message.error('请先选择汇报人')
      setLoading(false)
      return
    }
    if (receiverPerson.length == 0) {
      message.error('接收人不能为空！')
      setLoading(false)
      return
    }
    if (!reportStartTime && taskFlags != 2) {
      message.error('汇报开始时间不能为空!')
      setLoading(false)
      return
    }
    // 如果汇报开始时间存在，则判断是否在结束区间内
    // if (reportStartTime && reportStartTime > taskinit.endTime) {
    //   message.error('开始汇报时间不能晚于任务结束时间！')
    //   setLoading(false)
    //   return
    // }
    setReportTime([])
    //获取汇报时间点
    getReportTime()
    const reporter = updateDatas(reporperson)
    const receiver: any = updateDatas(receiverPerson)
    const copyUser: any = updateDatas(copyPerson)
    const timePeriod = gettimePeriod()

    const param = {
      reporter, //汇报人
      receiver, //接收人
      copyUser, //抄送人
      startTime: reportStartTime, //强制汇报开始时间
      content: describe, //汇报要求
      id: taskinit.id, //强制Id
      operateUser: nowUserId, //操作人
      operateUserName: nowUser, //操作人姓名
      reportTime: reportTimes, //强制汇报时间段数组[2019/09/09 18:00,..] 后台可能不要了，备注一个

      status: statusrepor.toString(), //状态：1开启、2完成、3延迟、4变更
      taskId: taskinit.taskid || 0, //任务id
      timePeriod, //所选时间节点(隔周:1,2#3,4 第一周-第二周)
      timeType: optiontype, //时间类型 天 周 隔周 月
      triggerTime: triggerTime, //小时分钟
    }

    $api
      .request('/task/force/report/save', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then((resData: any) => {
        // 如果是私密任务，汇报对象、汇报人非任务相关角色：提示无效
        message.success('设置成功')
        setLoading(false)
        // 如果是创建任务,创建临时汇报
        if (props.datas.from === 'createTask' || props.datas.from === 'taskdetailLeft') {
          const time = getforceTime(optiontype, timePeriod, triggerTime, true)
          const type = getforceType(param.status)
          const forceTime = type ? `${time} ${type}` : time
          const reportDatas = {
            id: resData.data,
            reporter: updateReportNames(reporter, 'username'),
            receiver: updateReportNames(receiver, 'username'),
            forceTime,
            taskid: taskinit.taskid,
          }
          props.getReports && props.getReports(reportDatas)
          if (isdetail == '2') {
            props.updateReportId && props.updateReportId(resData.data)
          }
          if (props.datas.from == 'taskdetailLeft') {
            // props.onOk()
            refreshReport()
          }
        }

        props.setModalShow && props.setModalShow(false)

        props.onOk && props.onOk(resData)
        datas.onOk && datas.onOk(resData)
      })
      .catch(function(res) {
        if (res.returnMessage) {
          message.error(res.returnMessage)
        }
        setLoading(false)
      })
  }

  //拼接汇报字段
  const updateReportNames = (arr: any[], findKey: string) => {
    const names: any = []
    arr.map((item: any) => {
      names.push(item[findKey])
    })
    return names
  }

  const handleCancel = () => {
    props.setModalShow(false)
  }

  // 过滤处理 保存强制汇报数据
  const updateDatas = (arr: any[]) => {
    const newArr = []
    for (let i = 0; i < arr.length; i++) {
      newArr.push({
        account: arr[i].account,
        type: arr[i].type,
        userId: arr[i].curId,
        username: arr[i].curName,
      })
    }
    return newArr
  }
  //所选时间节点获取
  const gettimePeriod = () => {
    let timePeriod = ''
    if (optiontype == 1) {
      //天
      timePeriod = '0'
    } else if (optiontype == 2) {
      //周
      timePeriod = weekdata.toString()
    } else if (optiontype == 3) {
      //月
      timePeriod = monthdata.toString()
    } else if (optiontype == 21) {
      //隔周
      timePeriod = intervalWeek.num1.toString() + '#' + intervalWeek.num2.toString()
    }
    return timePeriod
  }
  //循环周
  const Setweek = (param: any) => {
    const types = param.type
    const pitchs = param.pitch
    const weekNum = param.weekNum
    const itemNode = []
    const itemCH = ['天', '一', '二', '三', '四', '五', '六']
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
    for (let i = 0; i <= 6; i++) {
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
          {itemCH[i]}
        </li>
      )
    }
    return (
      <ul className={param.class || ''} key={types}>
        {itemNode}
      </ul>
    )
  }
  //循环月
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
  //设置任务时间汇报
  const setPitch = (types: any, param: any) => {
    const val = param.val
    const weekNum = param.weekNum
    if (types == 2) {
      //每周 -----------------
      const weekArr = [...weekdata]
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
      setweekdata(weekArr)
    } else if (types == 21) {
      //隔周 -----------------
      const weekArr = intervalWeek[weekNum]
      if (weekArr.findIndex((item: any) => item == val) == -1) {
        //不重复添加
        weekArr.push(val)
      } else {
        //重复删除
        if (weekArr.length != 1) {
          weekArr.splice(
            weekArr.findIndex((item: any) => item == val),
            1
          )
        }
      }
      intervalWeek[weekNum] = weekArr
      setIntervalWeek({ ...intervalWeek })
    } else if (types == 3) {
      //每月
      const weekArr = [...monthdata]
      if (weekArr.findIndex(item => item === val) == -1) {
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
      setMonthdata(weekArr)
    }
  }
  //任务时间类型
  const SetTypeHtml = (param: any) => {
    const _html = []
    const types = param.type
    if (types == 2) {
      _html.push(
        <div className="week" key={types + 1}>
          <Setweek type={types} pitch={weekdata}></Setweek>
        </div>
      )
    } else if (types == 21) {
      //隔周循环 ---------------------
      _html.push(
        <div className="" key={types + 1}>
          <div className="week-set">
            <div className="hint_text">第一周</div>
            <Setweek type={types} class={'one_week'} weekNum={'num1'} pitch={intervalWeek.num1}></Setweek>
          </div>
          <div className="week-set">
            <div className="hint_text">第二周</div>
            <Setweek type={types} class={'two_week'} weekNum={'num2'} pitch={intervalWeek.num2}></Setweek>
          </div>
        </div>
      )
    } else if (types == 3) {
      //每月、半年、一年循环 ---------------------
      _html.push(
        <div className="" key={types + 1}>
          <Setmonth type={types} pitch={monthdata}></Setmonth>
        </div>
      )
    } else {
      return <div></div>
    }
    return <div className="timePeriod">{_html}</div>
  }
  //计算强制汇报时间节点
  const getReportTime = () => {
    const types = optiontype

    const start = new Date(reportStartTime.split(' ')[0]) //开始时间
    const finish = new Date(taskinit.endTime.split(' ')[0]) //结束时间
    const date = (finish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) /*不用考虑闰年 计算总天数*/
    let nextDay = ''
    for (let i = 0; i <= date; i++) {
      //循环开始到结束时间段
      if (i == 0) {
        nextDay = reportStartTime.split(' ')[1] ? reportStartTime.split(' ')[0] : reportStartTime //开始时间
      } else {
        nextDay = getNextDate(nextDay, 1) //下一天日期
      }
      //判断最后一天是否需要添加到强制汇报节点
      const tasktimes = taskinit.endTime.split(' ')[1]
      if (i == date && triggerTime > tasktimes) {
        return
      }
      const _weeks = srtWeeks(nextDay) //周(根据时间获取星期几)
      const _Date = new Date(nextDay).getDate() //号(根据时间获取几号)
      //确定第一周/第二周
      if (i == 0 && _weeks <= 7) {
        across = 1
      } else {
        if (_weeks == 1) {
          across = across == 1 ? 2 : 1
        }
      }
      //判断类型
      if (types == 2) {
        // 周
        addReportTime(types, _weeks, weekdata, nextDay, '')
      } else if (types == 1) {
        // 天
        addReportTime(types, '', '', nextDay, '')
      } else if (types == 3) {
        // 月
        addReportTime(types, _Date, monthdata, nextDay, '')
      } else if (types == 21) {
        // 隔周
        addReportTime(types, _weeks, intervalWeek, nextDay, across)
      }
    }
  }
  //添加汇报时间点
  const addReportTime = (types: any, datas: any, selweekArr: any, nextDay: any, across: any) => {
    if (types == 2) {
      //周
      for (let i = 0; i < selweekArr.length; i++) {
        if (datas == selweekArr[i]) {
          reportTimes.push(nextDay + ' ' + triggerTime)
        }
      }
    } else if (types == 1) {
      //天
      reportTimes.push(nextDay + ' ' + triggerTime)
    } else if (types == 3) {
      //月
      for (let i = 0; i < selweekArr.length; i++) {
        if (datas == selweekArr[i]) {
          reportTimes.push(nextDay + ' ' + triggerTime)
        }
      }
    } else if (types == 21) {
      //隔周
      if (across == 1) {
        //第一周
        for (let i = 0; i < intervalWeek.num1.length; i++) {
          if (datas == intervalWeek.num1[i]) {
            reportTimes.push(nextDay + ' ' + triggerTime)
          }
        }
      } else {
        //第二周
        for (let j = 0; j < intervalWeek.num2.length; j++) {
          if (datas == intervalWeek.num2[j]) {
            reportTimes.push(nextDay + ' ' + triggerTime)
          }
        }
      }
    }
    setReportTime(reportTimes)
  }
  //计算时间的下一天(day 传-1表始前一天，传1表始后一天)
  const getNextDate = (date: any, day: any) => {
    const dd = new Date(date)
    dd.setDate(dd.getDate() + day)
    const y = dd.getFullYear()
    const m = dd.getMonth() + 1 < 10 ? '0' + (dd.getMonth() + 1) : dd.getMonth() + 1
    const d = dd.getDate() < 10 ? '0' + dd.getDate() : dd.getDate()
    return y + '/' + m + '/' + d
  }
  //根据时间获取星期
  const srtWeeks = (nextDay: any) => {
    const weekArray = [0, 1, 2, 3, 4, 5, 6]
    const week = new Date(nextDay).getDay()
    return weekArray[week]
  }
  //获取状态
  const getstatusrepor = (val: any) => {
    setStatusrepor(val)
  }

  //选择成员插件
  const selectUser = (type: any) => {
    setMemberOrgShow(true)
    setSelectusertype(type)
    const orgBotList = [...stakeholderList].map((item: any) => {
      return {
        ...item,
        disable: false,
      }
    })
    let initSelMemberOrg: any = {}
    initSelMemberOrg = {
      teamId: taskinit.teamId,
      sourceType: '', //操作类型
      allowTeamId: [taskinit.teamId],

      checkboxType: 'checkbox',
      permissionType: 3, //组织架构通讯录范围控制
      orgBotInfo: {
        type: 'report',
        title: '任务干系人',
        subTit: '',
        titleSub: '',
      },
      findType: 0,
      orgBotList: [...orgBotList],
    }

    const _selectList = type == 0 ? reporperson : type == 1 ? receiverPerson : copyPerson
    initSelMemberOrg.selectList = [..._selectList]

    setSelMemberOrg(initSelMemberOrg)
  }
  //选择成员
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const datas = dataList
    const arr = []

    //汇报人
    for (let i = 0; i < datas.length; i++) {
      arr.push({
        account: datas[i].account,
        type: selectusertype,
        userId: datas[i].userId || datas[i].curId,
        username: datas[i].userName || datas[i].username || datas[i].curName,
        curId: datas[i].userId || datas[i].curId,
        curName: datas[i].userName || datas[i].username || datas[i].curName,
        curType: 0,
      })
    }
    selectusertype == 0
      ? setReporperson(arr)
      : selectusertype == 1
      ? setReceiverPerson(arr)
      : setCopyPerson(arr)
  }

  //删除汇报人/收汇报人、抄送人
  /***
   * id ：当前删除id
   * type:删除类型 0:汇报人 1:收汇报人 2:抄送人
   */
  const removeUser = (id: any, type: number) => {
    const nowArr = type == 0 ? reporperson : type == 1 ? receiverPerson : copyPerson
    const newArr = nowArr.filter((item: { curId: any }) => item.curId !== id)
    type == 0 ? setReporperson(newArr) : type == 1 ? setReceiverPerson(newArr) : setCopyPerson(newArr)
  }

  return (
    <Modal
      className="force-report"
      title={'汇报设置'}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      {isdetail == '1' ? (
        <Spin spinning={loading} tip={'加载中，请耐心等待'}>
          <div className="forces-detail">
            <div className="constraint_task">
              <p className="constraint_task_title">
                <span className="constraint_task_name">{taskinit.taskName}</span>
                {editAuth && (
                  <span className="constraint_task_eidt mr">
                    <i id="constraintTaskRemove" onClick={confirm}>
                      删除
                    </i>
                    <i
                      id="constraintTaskEidt"
                      onClick={() => {
                        setIsdetail('2')
                      }}
                    >
                      编辑
                    </i>
                  </span>
                )}
              </p>
              <p className="constraint_task_rest">
                <span className="ml">{taskinit.operateDescription}</span>
                <span className="mr">{taskinit.createTime}</span>
              </p>
            </div>
            <div className="constraint_li">
              <span className="constraint_text">计划:</span>
              <span className="constraint_content">{taskinit.startTime + '-' + taskinit.endTime}</span>
            </div>
            <div className="constraint_li">
              <span className="constraint_text">汇报节点:</span>
              <span className="constraint_content">
                <p className="constraint_content_time">
                  <span>{'任务时间  ' + taskinit.forceText}</span>
                  <br />

                  <span> {'任务状态  ' + getforceType(taskinit.status)}</span>
                </p>
              </span>
            </div>
            <div className="constraint_li">
              <span className="constraint_text">汇报要求:</span>
              <span className="constraint_content">{describe}</span>
            </div>
          </div>
        </Spin>
      ) : (
        <Spin spinning={loading} tip={'加载中，请耐心等待'}>
          <div
            className="force-content"
            style={{
              overflow: 'auto',
              height: '460px',
              paddingTop: 4,
            }}
          >
            <div className="force-row isrequre">
              <div className="force-text">汇报对象：</div>
              <div className="force-items selpeople">
                <span
                  className="staff-icon"
                  onClick={() => {
                    selectUser(0)
                  }}
                ></span>
                <div className="staff-object">
                  {reporperson.map((item: any, index: number) => {
                    return (
                      <span key={index}>
                        {item.username}{' '}
                        <em
                          className="img_icon del_icon"
                          onClick={() => {
                            const id = item.curId || item.userId || item.userId
                            removeUser(id, 0)
                          }}
                        ></em>
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="force-row isrequre">
              <div className="force-text">收汇报对象：</div>
              <div className="force-items selpeople">
                <span
                  className="staff-icon"
                  onClick={() => {
                    selectUser(1)
                  }}
                ></span>
                <div className="staff-object">
                  {receiverPerson.map((item: any, index: number) => {
                    return (
                      <span key={index}>
                        {item.username}
                        <em
                          className="img_icon del_icon"
                          onClick={() => {
                            const id = item.curId || item.userId || item.userId
                            removeUser(id, 1)
                          }}
                        ></em>
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="force-row">
              <div className="force-text">抄送对象：</div>
              <div className="force-items selpeople">
                <span
                  className="staff-icon"
                  onClick={() => {
                    selectUser(2)
                  }}
                ></span>
                <div className="staff-object">
                  {copyPerson.map((item: any, index: number) => {
                    return (
                      <span key={index}>
                        {item.username}
                        <em
                          className="img_icon del_icon"
                          onClick={() => {
                            const id = item.curId || item.userId || item.userId
                            removeUser(id, 2)
                          }}
                        ></em>
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className={`force-row ${taskFlags != 2 ? 'isrequre' : ''}`}>
              <div className="force-text">汇报开始时间：</div>
              <div className="force-items">
                <DatePicker
                  allowClear={true}
                  showTime={{ format: 'HH:mm' }}
                  // defaultValue={moment(getNowTime(), 'YYYY-MM-DD HH:mm:ss')}
                  value={
                    taskFlags == 2 || !reportStartTime ? undefined : moment(reportStartTime, 'YYYY/MM/DD HH:mm')
                  }
                  format="YYYY/MM/DD HH:mm"
                  placeholder="派发后生效"
                  onChange={(value: any, dateString: any) => {
                    setReportStartTime(dateString)
                  }}
                  disabled={taskFlags == 2 ? true : false}
                  style={{ width: 300, fontSize: 14, position: 'relative', left: -7 }}
                />
                {getNowTime() == reportStartTime && <span className="nowtip">当前时间</span>}
              </div>
            </div>
            <div className="force-row reportTimerShaft"></div>

            <div className="force-row isrequre reset">
              <div className="force-text">汇报方式：</div>
              <div className="force-items" style={{ width: 'calc( 100% - 110px' }}>
                <div className="force-row">
                  <div className="force-text gren-color" style={{ width: 160, marginLeft: 0 }}>
                    根据{props.datas?.type == 1 ? '项目' : '任务'}汇报时间汇报：
                  </div>
                  <div className="force-items">
                    <Select
                      defaultValue="2"
                      value={optiontype}
                      style={{ width: 200 }}
                      onChange={(value: any) => {
                        setOptiontype(value)
                      }}
                    >
                      <Option value="1">每天汇报</Option>
                      <Option value="2">每周汇报</Option>
                      <Option value="21">隔周汇报</Option>
                      <Option value="3">每月汇报</Option>
                      <Option value="0">无</Option>
                    </Select>
                    <TimePicker
                      className="times"
                      allowClear={false}
                      defaultValue={moment('18:30', 'HH:mm')}
                      value={moment(triggerTime, 'HH:mm')}
                      format={'HH:mm'}
                      style={{ width: 130 }}
                      onChange={(time: any, timeString: any) => {
                        settriggerTime(timeString)
                      }}
                    />
                    <SetTypeHtml type={optiontype}></SetTypeHtml>
                  </div>
                </div>
                <div className="force-row">
                  <div className="force-text gren-color" style={{ width: 160, marginLeft: 0 }}>
                    根据{props.datas?.type == 1 ? '项目' : '任务'}状态汇报：
                  </div>
                  <div className="force-items">
                    <Checkbox.Group
                      style={{ width: '100%' }}
                      value={statusrepor || []}
                      onChange={(value: any) => {
                        getstatusrepor(value)
                      }}
                    >
                      <Checkbox
                        value="1"
                        onClick={(e: any) => {
                          e.stopPropagation()
                        }}
                      >
                        开启时
                      </Checkbox>
                      <Checkbox
                        value="2"
                        onClick={(e: any) => {
                          e.stopPropagation()
                        }}
                      >
                        结束时
                      </Checkbox>
                      <Checkbox
                        value="4"
                        onClick={(e: any) => {
                          e.stopPropagation()
                        }}
                      >
                        变更时
                      </Checkbox>
                      <Checkbox
                        value="3"
                        onClick={(e: any) => {
                          e.stopPropagation()
                        }}
                      >
                        延期时
                      </Checkbox>
                    </Checkbox.Group>
                  </div>
                </div>
                <div className="force-row">
                  <div className="force-text gren-color" style={{ width: 160, marginLeft: 0 }}>
                    汇报要求(非必填)：
                  </div>
                  <div className="force-items">
                    <TextArea
                      rows={4}
                      value={describe}
                      style={{ width: 526 }}
                      placeholder="请在此填写汇报要求~"
                      onChange={e => {
                        setDescribe(e.target.value)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Spin>
      )}

      {/* 选人插件 */}
      {memberOrgShow && (
        <SelectMemberOrg
          param={{
            visible: memberOrgShow,
            ...selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
            // 点击确认
            onSure: selMemberSure,
          }}
        />
      )}
    </Modal>
  )
}
export default Forcereport

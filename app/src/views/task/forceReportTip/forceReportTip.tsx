import React, { useEffect, useState } from 'react'
import { Modal, Select, Button, message } from 'antd'
import './ForceReportTip.less'
import $c from 'classnames'
import { requestApi } from '../../../common/js/ajax'
import { useSelector } from 'react-redux'
// import { ipcRenderer } from 'electron'
import { dateFormats } from '@/src/common/js/common'
import { refreshPage } from '../../workdesk/TaskListData'
const { Option } = Select
// 判断是否刷新红色汇报数据
const judgeDelayMsg = (arr: any) => {
  let flag = false
  arr.forEach((item: any) => {
    if (item.noticeType == 'force_time_delay_list_refresh') {
      flag = true
    }
  })
  return flag
}
// 过滤 及时强制汇报msg
const filterMsg = (arr: any) => {
  if (arr.length == 0) return []
  const newArr: any = []
  arr.forEach((item: any) => {
    if (item.noticeType == 'force_report_time_out' || item.noticeType == 'force_report_delay_time_out') {
      newArr.push(item)
    }
  })
  const _nowArr = distinct(newArr)
  return _nowArr
}
// 去重
const distinct = (arr: any) => {
  const hash = {}
  const newArray = arr.reduce((item: any, next: any) => {
    hash[next.noticeTypeId] ? '' : (hash[next.noticeTypeId] = true && item.push(next))
    return item
  }, [])
  return newArray
}
// 过滤汇报id
const filterForceIds = (arr: any[]) => {
  const ids: any[] = []
  if (arr.length == 0) return ids
  arr.forEach((item: any) => ids.push(item.noticeTypeId))
  return ids
}
// 获取未操作延迟数据
const getNoDelayData = (arr1: any, arr2: any) => {
  const myArr = []
  for (let i = 0; i < arr1.length; i++) {
    let isExt = false
    const item = arr1[i]
    const noticeTypeId = arr1[i].noticeTypeId
    for (let j = 0; j < arr2.length; j++) {
      const noticeTypeId2 = arr2[j].noticeTypeId
      if (noticeTypeId === noticeTypeId2) {
        isExt = true
        break
      }
    }
    if (!isExt) {
      myArr.push(item)
    }
  }
  return myArr
}
const ForceReportTip = () => {
  const { nowUserId } = $store.getState()

  const sysReportListData = useSelector((store: StoreStates) => store.reportListData) //居中弹窗数据

  const delayListData = useSelector((state: any) => state.delayListData) //红色延迟列表数据
  const [stateDatas, setState] = useState({
    reportModalShow: false, //任务汇报提示框 居中
    delay: false, //记录是否延迟处理 红色显示
    delaying: false, //记录是否延迟处理中
    timeValue: '10', //时间选择器
    dataList: [], //提示框数据
  })

  // 判断是否存在变化
  const NoticeState = () => {
    let change = false
    if (sysReportListData.dataList.length > 0) {
      change = true
    } else {
      change = false
    }
    return change
  }

  useEffect(() => {
    // 判断系统推送消息，是否存在变化
    if (NoticeState()) {
      // 如果数据中，存在刷新红色条数据消息提醒，则请求刷新红色条数据
      judgeDelayMsg([...sysReportListData.dataList]) ? getDelayList('refrsh') : ''
      // 过滤需要处理汇报数据，打开居中窗口，及时渲染数据
      const newArr = filterMsg([...sysReportListData.dataList])

      if (newArr.length > 0) {
        setState({
          ...stateDatas,
          dataList: newArr,
          reportModalShow: true, // 打开中间弹窗
        })
      }
    }
  }, [sysReportListData])

  useEffect(() => {
    getDelayList()
  }, [])

  // 红色提示框
  useEffect(() => {
    if (!delayListData || !delayListData.dataList) return
    setState({ ...stateDatas, delay: delayListData.dataList.length > 0 })
  }, [delayListData])

  //时间选择器变化
  const onTimeChange = (vlaue: string) => {
    setState({ ...stateDatas, timeValue: vlaue })
  }

  // 打开汇报编辑框
  const openReportEditorModal = (noticeTypeId?: any) => {
    setState({ ...stateDatas, reportModalShow: false })
    $store.dispatch({
      type: 'FORCE_LIST_REPORT',
      data: {
        id: '',
        noticeTypeId: noticeTypeId || '',
      },
    })
    $tools.createWindow('createForceReport')
  }

  // 关闭提示模态框
  const closeTipModal = (dataList?: any[]) => {
    $store.dispatch({
      type: 'FORCE_REPORT_DATA',
      data: {
        dataList: dataList || [],
      },
    })

    setState({ ...stateDatas, delaying: false, delay: true, reportModalShow: false })
    getDelayList()
    // 刷新工作台代办
    refreshPage && refreshPage()
    // 刷新工作台代收汇报
    $(".ant-tabs-tab-active .moduleElement[data-code='wait_receive']")?.click()
  }

  // 发送延迟请求:针对处理异常处理：说明当前传递汇报都被清空或被删除,toast 提示用户
  const saveDelayTime = (dataList: any[]) => {
    const forceTimeIds: any = filterForceIds(dataList)

    const params = {
      forceTimeIds,
      timeType: stateDatas.timeValue,
      userId: nowUserId,
    }

    requestApi({
      url: '/task/force/report/setForceReportDelay',
      param: params,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        message.success('请求成功')
      }
      // 刷新居中提示全局数据
      const newSysReportListData = getNoDelayData(sysReportListData.dataList, dataList)
      closeTipModal(newSysReportListData)
    })
  }

  //获取红色 延时任务列表
  const getDelayList = (refreshCode?: string) => {
    const params = {
      userId: nowUserId,
    }

    requestApi({
      url: '/task/force/report/findForceReportDelay',
      param: params,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        const dataList = res.data.dataList || []
        // console.log(dataList)
        $store.dispatch({
          type: 'DELAY_LIST_DATA',
          data: { dataList },
        })
        // 如果收到刷新code/则需要刷新工作台代收汇报、右侧代办事项、写强制汇报 页面数据
        // if (refreshCode) {
        //   console.log(111)
        //   const noticeTypeId = dataList.length > 0 ? dataList[0].forceTimeId : ''
        //   $store.dispatch({
        //     type: 'FORCE_LIST_REPORT',
        //     data: {
        //       id: '',
        //       noticeTypeId: noticeTypeId,
        //     },
        //   })
        // }
        // ipcRenderer.send('close_notice_window')
        //强制汇报存在多个 循环调用关闭对应弹窗
        // dataList.map((item: any) => {
        //   ipcRenderer.send('handle_messages_option', ['force_report_time_out', item.forceTimeId, 'force_report_time_out'])
        // })
      }
    })
  }
  // 判断当前汇报是否有效
  const findNormalReportTimeId = () => {
    const forceTimeIds: any = filterForceIds(stateDatas.dataList)
    const params = {
      userId: nowUserId,
      forceTimeIds: forceTimeIds,
    }
    requestApi({
      url: '/task/force/report/findNormalReportTimeId',
      param: params,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        console.log(res)
        if (res.data.dataList && res.data.dataList.length !== 0) {
          openReportEditorModal(res.data.dataList[0])
        } else {
          message.error('汇报时间已被清空或删除！')
        }
        closeTipModal()
      }
    })
  }
  return (
    // <div ref={refComplete}>
    <div className="">
      {/* 底部红色条 */}
      {stateDatas.delay && delayListData.dataList.length > 0 && (
        <div className={$c('Mandatory_reporting_shelve', 'ng-scope')}>
          <div className="content">
            <p data-id="17036">{delayListData.dataList[0].describe}</p>

            <span
              className="Mandatory_reporting_shelve_eidt"
              onClick={() => {
                openReportEditorModal(delayListData.dataList[0].forceTimeId)
              }}
            >
              <span>立即汇报</span>
              <i>{delayListData.dataList.length}</i>
              <b>&gt;</b>
            </span>
          </div>
        </div>
      )}
      {/* 居中提示窗 */}
      {stateDatas.reportModalShow && (
        <Modal
          title="强制汇报"
          className="reportTipModal"
          visible={stateDatas.reportModalShow}
          maskClosable={false}
          footer={null}
          onOk={() => {
            setState({ ...stateDatas, reportModalShow: false })
          }}
          onCancel={() => {
            closeTipModal()
          }}
        >
          <div className="content-box">
            {stateDatas.dataList.map((item: any, index: number) => (
              <p className="tip-text" key={index}>
                {item.content}
                {item.receiveTimeMill && (
                  <span className="tip-time">{dateFormats('yyyy/MM/dd HH:mm', item.receiveTimeMill)}</span>
                )}
              </p>
            ))}
          </div>

          {stateDatas.dataList.length > 1 && <span className="number">共{stateDatas.dataList.length}条</span>}
          {!stateDatas.delaying && (
            <div className="btn-box">
              <Button
                onClick={() => {
                  setState({ ...stateDatas, delaying: true })
                }}
              >
                稍后汇报
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  findNormalReportTimeId()
                }}
              >
                立即汇报
              </Button>
            </div>
          )}
          {stateDatas.delaying && (
            <div className="btn-box">
              <Select
                defaultValue={stateDatas.timeValue}
                dropdownClassName="reportSelect"
                style={{ width: 150 }}
                onChange={onTimeChange}
              >
                <Option value="10">5分钟后提醒我</Option>
                <Option value="20">15分钟后提醒我</Option>
                <Option value="30">30分钟后提醒我</Option>
                <Option value="40">一小时后提醒我</Option>
              </Select>
              <Button
                type="primary"
                onClick={() => {
                  saveDelayTime(stateDatas.dataList)
                }}
              >
                确定
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default ForceReportTip

import React, { useState, useEffect } from 'react'
import { Dropdown, Switch, Menu, Avatar, Tag, Modal } from 'antd'
import { DownOutlined, CheckOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { saveDateDisplay } from '@/src/views/fourQuadrant/getfourData'
import './okrDate.less'
import moment from 'moment'

const OkrDateModule = (props: any) => {
  const { isEdit, hideAllperiod } = props //hideAllperiod:是否隐藏全部周期
  const [state, setState] = useState<any>({
    timeList: {},
    periodList: null,
    nowDateId: '',
    nowHository: false,
  })

  //更新选择数据
  useEffect(() => {
    if (props) {
      if (props.periodList && props.periodList.length > 0) {
        const obj: any = []
        let num = 0
        // 过滤出 全部 字段数据
        const _periodList = [...props.periodList].filter((item: any) => {
          if (item.periodId != 0) return item
        })
        console.log(props.periodList)

        _periodList.forEach((item: any) => {
          if (!obj[item.startYear]) {
            num++
            if (hideAllperiod) {
              obj[item.startYear] = [item]
            } else {
              obj[item.startYear] = [props.periodList[0], item]
            }
          } else {
            obj[item.startYear].push(item)
          }
          if (num == 1) {
            state.timeList = {
              text: item.startYear,
              list: obj[item.startYear],
            }
          }
          if (item.startYear != item.endYear) {
            if (!obj[item.endYear]) {
              num++
              obj[item.endYear] = [item]
            } else {
              obj[item.endYear].push(item)
            }
          }
          // }
        })
        state.periodList = obj
      }
      state.nowDateId = props.periodId
      state.nowHository = props.nowHository
      setState({ ...state })
    }
  }, [props.periodList, props.nowHository])
  //更新选择数据
  useEffect(() => {
    setState({ ...state, nowDateId: props.periodId })
  }, [props.periodId])

  return (
    <Menu style={{ width: 320, maxHeight: 312 }} className="menu_time_list">
      <div className="small_time_list">
        <Dropdown
          overlay={
            <Menu style={{ width: 120 }}>
              {state.periodList?.map((item: any, index: number) => (
                <Menu.Item
                  key={index}
                  onClick={(e: any) => {
                    e.domEvent.stopPropagation()
                    setState({
                      ...state,
                      timeList: {
                        text: index,
                        list: item,
                      },
                    })
                  }}
                >
                  <a>{$intl.get('IndexYear', { index })}</a>
                </Menu.Item>
              ))}
            </Menu>
          }
        >
          <a>
            <span>{$intl.get('IndexYear', { index: state.timeList.text })}</span>
            {/* <DownOutlined /> */}
            <em className="period_date_down" style={{ marginTop: '14px' }}></em>
          </a>
        </Dropdown>
      </div>
      <Menu.Item className="small_time_show flex between">
        <span>{$intl.get('showHistoryCycle')}</span>
        <div className="switch_date">
          <Switch
            size="small"
            style={{ height: '5px', width: '32px' }}
            className="okr_period_list"
            checked={state.nowHository}
            onClick={(checked: boolean, event: any) => {
              event.stopPropagation()
              saveDateDisplay(checked ? 1 : 0, 'date').then((res: any) => {
                setState({ ...state, nowHository: checked })
                props.changeListData(1)
              })
            }}
          />
        </div>
      </Menu.Item>
      <Menu className="small_time_data">
        {state.timeList.list &&
          state.timeList.list.length > 0 &&
          state.timeList.list.map((data: any, index: number) => (
            <Menu.Item
              key={index}
              onClick={(e: any) => {
                e.domEvent.stopPropagation()
                if (state.nowDateId == data.periodId) {
                  return false
                }
                if (isEdit) {
                  Modal.confirm({
                    title: '提醒',
                    icon: <ExclamationCircleOutlined />,
                    content: '修改周期会取消已存在的对齐关系，确认修改？',
                    centered: true,
                    onOk() {
                      setState({ ...state, nowDateId: data.periodId })

                      //更新选择数据
                      props.AfterchoseeData(data)
                    },
                  })
                } else {
                  setState({ ...state, nowDateId: data.periodId })
                  console.log(data)

                  //更新选择数据
                  props.AfterchoseeData(data)
                }
              }}
              // status==1:失效周期-禁用
              className={`${state.nowDateId == data.periodId ? 'active' : ''}`}
            >
              <a>
                <Avatar
                  className="img_icon logoLeftIcon root"
                  src={
                    data.periodId == 0
                      ? $tools.asAssetsPath('/images/common/period_all.svg')
                      : data.profile || $tools.asAssetsPath('/images/common/company_default.png')
                  }
                  size={24}
                ></Avatar>
                {data.periodText}
                <span className="date_show">({data.count})</span>
                {getPeriodTag(data)}
              </a>
              <span className={`${state.nowDateId == data.periodId ? 'small_time_active' : 'none'}`}>
                <CheckOutlined style={{ color: '#4285F4' }} />
              </span>
            </Menu.Item>
          ))}
      </Menu>
      {/* </div> */}
    </Menu>
  )
}
//显示当前
export const getPeriodTag = (val: any) => {
  const tagList: any = []
  const nowDate = moment(new Date()).format('YYYY/MM/DD') + ' 00:00'
  const runTime = Date.parse(nowDate) - Date.parse(val.endTime)
  const startTime = Date.parse(nowDate) - Date.parse(val.startTime)
  let getNOw = false
  if (startTime >= 0 && runTime <= 0) {
    getNOw = true
  }

  // 失效
  if (val.status == 1) {
    tagList.push(<Tag className="invalid_tag">失效</Tag>)
  } else if (getNOw) {
    tagList.push(<Tag>{$intl.get('current')}</Tag>)
  }
  return tagList
}
export { OkrDateModule }

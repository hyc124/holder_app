import { useEffect, useState } from 'react'
import moment from 'moment'
import React from 'react'
import { DatePicker, Select } from 'antd'
import { CaretDownOutlined } from '@ant-design/icons'
import './MettingFilter.less'
import { findAllCompanyApi } from '../../task/creatTask/getData'
const { RangePicker } = DatePicker
interface CmpListProps {
  id: number
  teamId: null
  name: string
  shortName: string
  type: number
  responsibleUserId: number
  attachInfoId: null
  responsibleUserAccount: string
  hasAuth: number
  unreadNotice: number
  logo: string
  isLast: number
  followId: null
  userModel: null
  profile: null
  businessDataAddress: string
  waitHandleCount: number
}
//暴露刷新列表方法
let resetfilterParam: any = null
export const resetParamPage = () => {
  resetfilterParam ? resetfilterParam() : ''
}
const FilterInfo = ({ datas, ChangeFilter }: { datas: any; ChangeFilter: (value: any) => void }) => {
  // const filterType = datas.listType
  const { nowAccount, nowUserId, loginToken } = $store.getState()
  const dateFormat = 'YYYY/MM/DD'

  const filterInit = {
    mettingStatusRecived: [
      {
        status: '',
        name: '所有',
      },
      {
        status: '1',
        name: '参加',
      },
      {
        status: '2',
        name: '请假',
      },
      {
        status: '0',
        name: '待确认',
      },
      {
        status: '-1',
        name: '已过期',
      },
      {
        status: '3',
        name: '已取消',
      },
    ],
    mettingStatusStart: [
      {
        status: '',
        name: '所有',
      },
      {
        status: '1',
        name: '已生效',
      },
      {
        status: '0',
        name: '已取消',
      },
      {
        status: '2',
        name: '审核中',
      },
      {
        status: '3',
        name: '审批拒绝',
      },
      {
        status: '4',
        name: '审批撤回',
      },
    ],
    mettingConcludedStart: [
      {
        status: '',
        name: '所有',
      },
      {
        status: '1',
        name: '已填写',
      },
      {
        status: '0',
        name: '未填写',
      },
    ],
    stateInit: {
      startTime: '',
      endTime: '',
      teamId: '',
      joinStatus: '',
      type: datas.listType,
      status: '',
      isConcluded: '',
    },
    teamName: '',
  }
  const filterParam = JSON.parse(JSON.stringify(filterInit))
  //   企业数据
  const [cmpList, setCmpList] = useState<Array<any>>([])
  //   当前选择企业名称
  const [orgName, setOrgName] = useState(filterParam.teamName)
  //   日期格式

  const [statusList, setStatusList] = useState(
    Number(datas.listType) === 0 ? filterParam.mettingStatusRecived : filterParam.mettingStatusStart
  )
  const [mettingConcluded, setMettingConcluded] = useState(filterParam.mettingConcludedStart)
  const [mettingFilterParam, setmettingFilterParam] = useState(filterParam.stateInit)
  // 默认值
  useEffect(() => {
    findAllCompanyApi({
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }).then((data: any) => {
      setCmpList(data)
      setOrgName('')
    })
    const arr = Number(datas.listType) === 0 ? filterInit.mettingStatusRecived : filterInit.mettingStatusStart
    setStatusList([...arr])

    setMettingConcluded([...filterInit.mettingConcludedStart])
    setmettingFilterParam({ ...filterInit.stateInit })
  }, [datas.listType])

  resetfilterParam = () => {
    resstFilter()
  }

  // 重置筛选
  const resstFilter = () => {
    setmettingFilterParam({
      startTime: '',
      endTime: '',
      teamId: '',
      joinStatus: '',
      type: datas.listType,
      status: '',
      isConcluded: '',
    })
    const sendParam = {
      startTime: '',
      endTime: '',
      teamId: '',
      joinStatus: '',
      type: datas.listType,
      status: '',
      isConcluded: '',
    }
    ChangeFilter(sendParam)
    setStatusList(
      Number(datas.listType) === 0 ? filterParam.mettingStatusRecived : filterParam.mettingStatusStart
    )
    setMettingConcluded(filterParam.mettingConcludedStart)
    setmettingFilterParam(filterParam.stateInit)
    setOrgName(filterParam.teamName)
  }

  //   切换企业
  const changeOrg = (value: string, option: any) => {
    setmettingFilterParam({
      ...mettingFilterParam,
      teamId: option.key,
    })
    const sendParam = {
      ...mettingFilterParam,
      teamId: option.key,
    }
    setOrgName(value)
    ChangeFilter(sendParam)
  }

  // 时间筛选
  const timePickerChange = (_dates: any, dateStrings: string[]) => {
    const sendParam = {
      ...mettingFilterParam,
      startTime: dateStrings[0] + ' 00:00',
      endTime: dateStrings[1] + ' 23:59',
    }
    setmettingFilterParam({
      ...mettingFilterParam,
      startTime: dateStrings[0] + ' 00:00',
      endTime: dateStrings[1] + ' 23:59',
    })
    ChangeFilter(sendParam)
  }

  /**
   * 会议状态
   * @param index
   */
  const statusChange = (index: number) => {
    let thisCode = ''
    statusList.map((item: any, i: number) => {
      if (i == index) {
        item.active = true
        thisCode = item.status
      } else {
        item.active = false
      }
    })
    // 设置选中
    setStatusList([...statusList])
    let sendParam
    if (Number(datas.listType) === 0) {
      setmettingFilterParam(
        JSON.parse(
          JSON.stringify({
            ...mettingFilterParam,
            joinStatus: String(thisCode),
          })
        )
      )
      sendParam = {
        ...mettingFilterParam,
        joinStatus: String(thisCode),
      }
    } else {
      setmettingFilterParam({
        ...mettingFilterParam,
        status: String(thisCode),
      })
      sendParam = {
        ...mettingFilterParam,
        status: String(thisCode),
      }
    }

    ChangeFilter(sendParam)
  }
  const conclusion = (index: number) => {
    let thisCode = ''
    mettingConcluded.map((item: any, i: number) => {
      if (i == index) {
        item.active = true
        thisCode = item.status
      } else {
        item.active = false
      }
    })
    // 设置选中
    setMettingConcluded([...mettingConcluded])
    const sendParam = {
      ...mettingFilterParam,
      isConcluded: thisCode,
    }
    setmettingFilterParam({
      ...mettingFilterParam,
      isConcluded: thisCode,
    })
    ChangeFilter(sendParam)
  }
  return (
    <div
      className="filtersTermBox filtersTermMettingBox"
      style={{ display: datas.visibleFilter ? 'block' : 'none' }}
    >
      <header className="filtersHeader">
        <div className="filter-reset-box" onClick={resstFilter}>
          <span className="filter-reset-icon"></span>
          <span>重置条件</span>
        </div>
      </header>
      <div className="filtersCon">
        <section className="filtersItem">
          <div className="filters-item-tit">
            <span>会议状态</span>
          </div>
          <div className="filters-item-con">
            <div className="filters-item-in">
              <div className="filter-status">
                <ul className="filter-status-small">
                  {statusList?.map((item: any, i: number) => {
                    return (
                      <li
                        key={i}
                        className={`${item.active ? 'active' : ''}`}
                        onClick={(e: any) => {
                          e.stopPropagation()
                          statusChange(i)
                        }}
                      >
                        {item.name}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section>
          <div className="filters-item-tit">
            <span>所属组织</span>
          </div>
          <div className="filters-item-con">
            <Select className="org-box" value={orgName} onChange={changeOrg} suffixIcon={<CaretDownOutlined />}>
              {cmpList?.map((item: any) => {
                return (
                  <Select.Option key={item.id} value={item.shortName}>
                    {item.shortName}
                  </Select.Option>
                )
              })}
            </Select>
          </div>
        </section>
        <section className="filtersItem">
          <div className="filters-item-tit">
            <span>会议时间</span>
          </div>
          <div className="filters-item-con">
            <div className="filters-item-in">
              <RangePicker
                dropdownClassName="select-time-picker"
                format="YYYY/MM/DD"
                onChange={timePickerChange}
                allowClear={false}
                value={
                  mettingFilterParam.startTime == ''
                    ? null
                    : [
                        moment(mettingFilterParam.startTime, dateFormat),
                        moment(mettingFilterParam.endTime, dateFormat),
                      ]
                }
              />
            </div>
          </div>
        </section>
        {Number(datas.listType) === 1 && (
          <section className="filtersItem">
            <div className="filter_cont_item sendMeetConclu">
              <div className="filters-item-tit">会议结论</div>
              <div className="filters-item-con">
                <ul className="status_mid_ul filter-status-small">
                  {mettingConcluded.map((item: any, i: number) => {
                    return (
                      <li
                        key={i}
                        className={`${item.active ? 'active' : ''}`}
                        onClick={(e: any) => {
                          e.stopPropagation()
                          conclusion(i)
                        }}
                      >
                        {item.name}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default FilterInfo

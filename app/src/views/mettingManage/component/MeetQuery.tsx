import { useEffect, useState } from 'react'
import React from 'react'
import './MeetQuery.less'
import { Select, Avatar, Button, Checkbox, message, Pagination, Spin } from 'antd'
const { Option } = Select

// datas {
//   typeId: number
//   listType: number
// }
const MeetQuery = (datas: any) => {
  const props = datas.datas
  const { nowUserId, loginToken } = $store.getState()
  const [processType, setProcessType] = useState<number>(0)
  const [listDtas, setListDatas] = useState<any>([])
  const [disabledBtn, setDisabledBtn] = useState(false)
  const [setChecked, setCheckedStatus] = useState<any>([])

  const [loading, setLoading] = useState(false)
  const hintTypeCheckBox = [
    { label: '应用内提醒', value: '0' },
    { label: '短信/邮件提醒', value: '1' },
  ]
  //页码
  const [pagination, setPagination] = useState({
    pageNo: 0,
    pageSize: 10,
    total: 0,
  })

  useEffect(() => {
    attend()
  }, [processType, pagination.pageNo, pagination.pageSize])
  const attend = () => {
    const param = {
      type: processType, //进度查询成员类型 0 参会成员 1 列席成员
      meetingId: props.queryId,
      page: pagination.pageNo,
      pageSize: pagination.pageSize,
    }
    setLoading(true)
    $api
      .request('/public/meeting/process', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then((resData: any) => {
        const _datas = resData.data.content
        setListDatas(_datas)
        for (let i = 0; i < _datas.length; i++) {
          if (
            (_datas[i].status != 1 || _datas[i].joinStatus == 1 || _datas[i].noticeTime != '') &&
            _datas[i].userId != nowUserId
          ) {
            // setDisabledBtn(true)
            break
          }
        }
        //设置分页
        setPagination({
          ...pagination,
          total: resData.data.totalElements || 0,
        })
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  const onChange = (value: string) => {
    setProcessType(Number(value))
  }
  const remindNoticeType = (checkedValue: any) => {
    setCheckedStatus(checkedValue)
  }

  const getStatus = (joinStatus: number, noticeTime: string, status: number, uid: number) => {
    let statusHtm = ''
    let statusClass = ''
    if (joinStatus == 0 && (noticeTime == null || noticeTime == '')) {
      statusClass = 'dont_sure'
      statusHtm = '待确认'
    } else if (joinStatus == 1) {
      statusClass = 'ask_sure'
      statusHtm = '已确认'
    } else if (joinStatus == 2) {
      statusClass = 'ask_for_leave'
      statusHtm = '请假'
    } else if (joinStatus == 3) {
      statusHtm = '会议取消'
    } else {
      statusHtm = '过期未确认'
    }
    if (joinStatus == 0 && noticeTime != null && noticeTime != '') {
      statusClass = 'dont_sure'
      statusHtm = '待确认'
    }
    return <span className={`process_meet_status ${statusClass}`}>{statusHtm}</span>
  }

  const ShowRightBtn = ({
    joinStatus,
    noticeTime,
    status,
    uid,
    notes,
  }: {
    joinStatus: any
    noticeTime: any
    status: any
    uid: any
    notes: any
  }) => {
    let showRight: any = (
      <Button className="right_box_btn disabled" disabled>
        提醒
      </Button>
    )
    if (joinStatus === 0 && (noticeTime == '' || noticeTime == '')) {
      if (nowUserId != uid) {
        //会议发起者不能提醒自己
        showRight = (
          <Button
            className="right_box_btn"
            disabled={status != 1 ? true : false}
            onClick={() => {
              notice(uid)
            }}
          >
            提醒
          </Button>
        )
      } else {
        showRight = ''
      }
    } else if (Number(joinStatus) === 2) {
      showRight = <span>备注:{notes || '无'}</span>
    }
    if (joinStatus == 0 && noticeTime != '' && noticeTime != null) {
      showRight = (
        <div>
          <span className="act_tips">{noticeTime}后可再次提醒</span>
          <button className="right_box_btn disabled" disabled>
            已提醒
          </button>
        </div>
      )
    }
    return showRight
  }

  /**
   * 进度查询中提醒所有人
   * 有_id时提醒单个
   */
  const notice = (uid?: number) => {
    const toUsers = []
    if (uid) {
      toUsers.push(uid)
    }
    if (setChecked.length == 0) {
      message.error('未选择提醒方式')
      return
    }
    const param = {
      meetingId: props.queryId, //会议id
      noticeType: setChecked, //提醒类型
      userIds: toUsers, //提醒所有人传空
    }
    setLoading(true)
    $api
      .request('public/meeting/notice', param, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then((resData: any) => {
        if (resData.returnCode == 0) {
          message.success('提醒成功')
          attend()
          // setDisabledBtn(true)
        }
        setLoading(false)
      })
      .catch(res => {
        message.error(res.returnMessage)
        setLoading(false)
      })
  }
  return (
    <Spin spinning={loading} size="small" wrapperClassName="workReport-handle-content">
      <div className="meet_query_box meet_details_content_box">
        <div className="meetQueryCont meet_details_content">
          <Select style={{ width: 200 }} onChange={onChange} defaultValue="参会成员">
            <Option value="0">参会成员</Option>
            <Option value="1">列席成员</Option>
          </Select>
          <ul className="meet_process_list">
            {listDtas &&
              listDtas.map((item: any, index: number) => {
                return (
                  <li key={index}>
                    <div className="name_and_status">
                      <Avatar className="oa-avatar" src={item.profile}>
                        {' '}
                        {item.username && item.username.length > 2 ? item.username.slice(-2) : item.username}
                      </Avatar>
                      <div className="process_meet_username">
                        {' '}
                        {item.username && item.username.length > 2 ? item.username.slice(-2) : item.username}
                      </div>
                      <div className="process_meet_status dont_sure">
                        {getStatus(item.joinStatus, item.noticeTime, item.status, item.userId)}
                      </div>
                    </div>
                    <div className="right_leave_box" title="" data-toggle="tooltip" data-original-title="">
                      <ShowRightBtn
                        joinStatus={item.joinStatus}
                        noticeTime={item.noticeTime}
                        status={item.status}
                        uid={item.userId}
                        notes={item.notes}
                      />
                    </div>
                  </li>
                )
              })}
          </ul>
          {/* 分页 */}
          {pagination.total > 0 && (
            <Pagination
              className="flex report_page"
              size="small"
              total={pagination.total}
              current={pagination.pageNo + 1}
              showSizeChanger
              onChange={(page, pageSize) => {
                setPagination({ ...pagination, pageNo: page - 1, pageSize: pageSize || 10 })
              }}
            />
          )}
        </div>
        <div className="meetQueryFooter meet_details_footer_box">
          <div className="meetDetailFooter">
            <div className="zone_remind_box">
              <span className="zone_remind_type">提醒方式</span>
              <div className="zone_hint_type">
                <Checkbox.Group
                  defaultValue={setChecked}
                  options={hintTypeCheckBox}
                  onChange={remindNoticeType}
                ></Checkbox.Group>
              </div>
            </div>
            <div className="sendBtn_box">
              <Button
                className="cancleSend"
                onClick={() => {
                  notice()
                }}
                disabled={props.isMeetType || disabledBtn}
              >
                提醒所有
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Spin>
  )
}

export default MeetQuery

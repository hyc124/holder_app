import { useState, useReducer, useEffect } from 'react'
import React from 'react'
import { Button, message, Checkbox, List, Avatar, Radio } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import TextArea from 'antd/lib/input/TextArea'
import { DatePicker } from 'antd'

const { RangePicker } = DatePicker
import './MeetAddRoomSelect.less'
import moment from 'moment'

export const initStates = {
  meetingRoomId: '', //会议室ID
  meetingRoomName: '', //会议室NAME
  meetingRoomImage: '', //会议室图片
  startTime: '', //会议开始时间
  endTime: '', //会议结束时间
}

// state初始化initStates参数 action为dispatch传参
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'meetingRoomId':
      return { ...state, meetingRoomId: action.data }
    case 'meetingRoomName':
      return { ...state, meetingRoomName: action.data }
    case 'meetingRoomImage':
      return { ...state, meetingRoomImage: action.data }
    case 'startTime':
      return { ...state, startTime: action.data }
    case 'endTime':
      return { ...state, endTime: action.data }
    default:
      return state
  }
}

interface RoomInfo {
  id: number
  name: string
  peopleNum: number
  isValid: number
  teamId: null
  teamName: null
  meetingByRoomModels: []
  files: []
  userId: null
  username: null
  url: string
}

const MeetAddRoomSelect = ({
  datas,
  visibleSelectRoom,
}: {
  datas: any
  visibleSelectRoom: (value: boolean, changeStatus: boolean, param?: any) => void
}) => {
  const { nowUserId, loginToken } = $store.getState()
  const [state, dispatch] = useReducer(reducer, initStates)
  const [fileUrl, setFileUrl] = useState('')
  //会议室列表loading
  const [listLoading, setListLoading] = useState(false)
  // 会议室列表
  const [roomList, setRoomList] = useState<any>([])
  // 单个会议室信息
  const [roomInfo, setRoomInfo] = useState<any>([])

  //是否显示会议室占用冲突状态
  const [meetStatus, setMeetStatus] = useState(false)
  const onHideModal = () => {
    visibleSelectRoom(false, false)
    // visibleSelectRoom(false, false, {
    //   meetingRoomId: '', //会议室ID
    //   meetingRoomName: '', //会议室NAME
    //   meetingRoomImage: '', //会议室图片
    //   startTime: '', //会议开始时间
    //   endTime: '', //会议结束时间
    // })
  }

  //初始化
  useEffect(() => {
    dispatch({
      type: 'startTime',
      data: datas.startTime,
    })
    dispatch({
      type: 'endTime',
      data: datas.endTime,
    })
    dispatch({
      type: 'meetingRoomName',
      data: datas.meetingRoomName,
    })
    dispatch({
      type: 'meetingRoomId',
      data: datas.meetingRoomId,
    })
    dispatch({
      type: 'meetingRoomImage',
      data: datas.meetingRoomImage,
    })

    findRoom()
      .then(data => {
        setRoomList(data)
      })
      .finally(() => {
        setListLoading(false)
      })
  }, [])

  //选择会议室和预约时间
  const findRoom = () => {
    setListLoading(true)
    return new Promise<RoomInfo>(resolve => {
      const param = {
        teamId: datas.selOrgId,
        startTime: datas.startTime || '',
        endTime: datas.endTime || '',
        meetingId: datas.openType === 'create' ? '' : datas.meetingId || '',
      }
      $api
        .request('/public/meetingRoom/find', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(resData => {
          resolve(resData.dataList)
          setListLoading(false)
        })
        .catch(err => {
          setListLoading(false)
        })
    })
  }

  useEffect(() => {
    if (state.meetingRoomId) {
      findByMeetingRoom(state.meetingRoomId)
    }
  }, [state.meetingRoomId])
  // 查询单个会议室信息
  const findByMeetingRoom = (_id: number) => {
    const param = {
      meetingRoomId: _id,
      meetingId: datas.openType === 'create' ? '' : datas.meetingId || '',
    }
    $api
      .request('/public/meeting/findByMeetingRoom', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        setRoomInfo(resData.dataList)
        setListLoading(false)
      })
      .catch(err => {
        setListLoading(false)
      })
  }

  //编辑时间
  const editTimes = (value: any, type: any) => {
    setMeetStatus(false)

    let times: any = ''
    if (value) {
      times = moment(value).format('YYYY/MM/DD HH:mm')
    }
    dispatch({
      type: type,
      data: times,
    })
    // dispatch({
    //   type: 'startTime',
    //   data: dateString[0],
    // })
    // dispatch({
    //   type: 'endTime',
    //   data: dateString[1],
    // })
  }
  // 重置
  const reset = () => {
    setMeetStatus(false)
    dispatch({
      type: 'startTime',
      data: '',
    })
    dispatch({
      type: 'endTime',
      data: '',
    })
    dispatch({
      type: 'meetingRoomName',
      data: '',
    })
    dispatch({
      type: 'meetingRoomId',
      data: '',
    })
    dispatch({
      type: 'meetingRoomImage',
      data: '',
    })
  }
  // 确定选择会议室
  const meetRoomCommit = () => {
    if (state.startTime === '' || state.endTime === '') {
      message.error('会议时间不能为空！')
      return
    }

    if (state.meetingRoomName === '' || state.meetingRoomId === '') {
      message.error('请先选择会议室!')
      return
    }
    if (meetStatus) {
      message.error('该时间段与其他会议有冲突，该会议室不可用！')
      return
    }
    if (state.endTime && state.startTime && state.startTime > state.endTime) {
      message.error('开始时间不能大于结束时间')
      return false
    }
    visibleSelectRoom(false, true, state)
  }
  // 选择会议室
  const selectRoom = (e: any) => {
    const _id = e.target.value
    setMeetStatus(false)
    dispatch({
      type: 'meetingRoomName',
      data: e.target['data-name'],
    })
    dispatch({
      type: 'meetingRoomImage',
      data: e.target['data-img'],
    })
    dispatch({
      type: 'meetingRoomId',
      data: e.target.value,
    })
  }
  useEffect(() => {
    queryRoomUsed()
  }, [state.startTime, state.endTime, roomInfo])
  // 查询当前选择会议室 时间段是否可用
  const queryRoomUsed = () => {
    roomInfo.map((item: any, index: number) => {
      const startTime = new Date(item.startTime).getTime()
      const endTime = new Date(item.endTime).getTime()
      const selStartTime = state.startTime !== '' ? new Date(state.startTime).getTime() : 0
      const selEndTime = state.endTime !== '' ? new Date(state.endTime).getTime() : 0
      if (selStartTime <= endTime && selEndTime >= startTime) {
        //选择的开始时间小于占用的结束时间 并且 选择的结束时间大于占用的开始时间
        setMeetStatus(true)
      }
    })
  }
  const dataSource = [
    {
      title: '其他（地点另行通知）',
    },
  ]

  return (
    <Modal
      visible={datas.selectRoomVisible}
      title="选择会议室和会议时间"
      width={850}
      className="meetRoomSelectPop"
      footer={[
        <Button key="back" onClick={reset}>
          重置
        </Button>,
        <Button key="submit" type="primary" onClick={meetRoomCommit}>
          确定
        </Button>,
      ]}
      onCancel={onHideModal}
    >
      <div className="meet_room_select_pop">
        <div className="room_select_list">
          {roomList.length > 0 && (
            <List
              className="room_list"
              itemLayout="horizontal"
              dataSource={roomList}
              renderItem={(item: any) => (
                <List.Item>
                  <div className="list_cont_box">
                    <Radio.Group key={item.id} onChange={selectRoom} value={state.meetingRoomId}>
                      <Radio
                        value={item.id}
                        data-name={item.name}
                        data-img={item.url}
                        checked={state.meetingRoomId === item.id ? true : false}
                      >
                        {' '}
                      </Radio>
                    </Radio.Group>
                    <Avatar
                      shape="square"
                      className="oa-avatar room_avatar"
                      src={
                        item.url == null
                          ? $tools.asAssetsPath('/images/mettingManage/cmpDefault.svg')
                          : item.url
                      }
                    ></Avatar>
                    <div className="flex info_box">
                      <div className="tit_box">
                        <span className="meet-room-name text-ellipsis">{item.name}</span>
                        <span className="meet-room-num">（{item.peopleNum}）</span>
                      </div>
                      <span style={{ display: 'none' }} className="meet-room-site text-ellipsis">
                        海普区域第一间
                      </span>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
          <List
            className="room_list"
            dataSource={dataSource}
            renderItem={() => (
              <List.Item>
                <div className="list_cont_box">
                  <Radio.Group onChange={selectRoom} value={state.meetingRoomId}>
                    <Radio
                      value={-1}
                      data-name="其他（地点另行通知）"
                      checked={Number(state.meetingRoomId) === -1 ? true : false}
                    >
                      {' '}
                    </Radio>
                  </Radio.Group>
                  <Avatar
                    shape="square"
                    className="oa-avatar room_avatar"
                    src={$tools.asAssetsPath('/images/mettingManage/cmpDefault.svg')}
                  ></Avatar>
                  <div className="flex info_box">
                    <div className="tit_box">
                      <span className="meet-room-name text-ellipsis">其他（地点另行通知）</span>
                    </div>
                    <span style={{ display: 'none' }} className="meet-room-site text-ellipsis">
                      海普区域第一间
                    </span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
        <div className="room_select_time">
          <div className="room_info_box">
            <Avatar
              shape="square"
              className="oa-avatar"
              src={fileUrl === '' ? $tools.asAssetsPath('/images/mettingManage/cmpDefault.svg') : fileUrl}
            ></Avatar>
            <div className="sel_time">
              <div className="tit">{state.meetingRoomName === '' ? '未选择会议室' : state.meetingRoomName}</div>
              {/* <div className="date-times">
                <RangePicker
                  allowClear={false}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY/MM/DD HH:mm"
                  value={
                    state.startTime == ''
                      ? null
                      : [moment(state.startTime, 'YYYY/MM/DD HH:mm'), moment(state.endTime, 'YYYY/MM/DD HH:mm')]
                  }
                  onChange={editTimes}
                />
              </div> */}
              <div className="date-times">
                <DatePicker
                  allowClear={false}
                  showNow={false}
                  showTime={{ format: 'HH:mm' }}
                  placeholder="开始时间"
                  format={'YYYY/MM/DD HH:mm'}
                  value={state.startTime ? moment(state.startTime) : null}
                  // onChange={(value: any) => {
                  //   editTimes(value, 'startTime')
                  // }}
                  onOk={(value: any) => {
                    editTimes(value, 'startTime')
                  }}
                />
                <span className="line"></span>
                <DatePicker
                  showNow={false}
                  showTime={{ format: 'HH:mm' }}
                  placeholder="截至时间"
                  value={state.endTime ? moment(state.endTime) : null}
                  allowClear={false}
                  format={'YYYY/MM/DD HH:mm'}
                  // onChange={(value: any) => {
                  //   editTimes(value, 'endTime')
                  // }}
                  onOk={(value: any) => {
                    editTimes(value, 'endTime')
                  }}
                />
              </div>
            </div>
          </div>
          <div className="room_info_list">
            {/* {meetStatus && (
              <div>
                <span className="tips_icon"></span>
                <span className="tips_cont_used">
                  {state.meetingRoomName}在该时间段与其他会议有冲突，不可用您可另选其他时间或更换其他会议室。
                </span>
              </div>
            )} */}

            <div
              className={`meet_room_use_detail_info ${
                state.meetingRoomId === -1 || state.meetingRoomName === '' ? 'meet_none_info' : ''
              } ${roomInfo.length === 0 ? 'meet_free_info' : 'meet_used_info'}`}
            >
              {(state.meetingRoomId === -1 || state.meetingRoomName === '') && (
                <div className="meet_status_tips none_sel_room">
                  <span></span>
                  <div className="tips_cont">暂无会议室信息</div>
                </div>
              )}
              {roomInfo.length === 0 && state.meetingRoomName !== '' && state.meetingRoomId !== -1 && (
                <div className="meet_status_tips can_use">
                  <span></span>
                  <div className="tips_cont">{state.meetingRoomName}空闲，可选择任意会议时间</div>
                </div>
              )}
              {roomInfo.length !== 0 && state.meetingRoomName !== '' && (
                <div>
                  <div className="meet_status_tips used_room">
                    <span></span>
                    <div className="tips_cont">
                      {state.meetingRoomName}已有占用（选择会议时间请避开以下时间段）
                    </div>
                  </div>
                  <div className="used_meet_room_list">
                    {roomInfo?.map((item: any, index: number) => {
                      return (
                        <div className="used_room_item" key={index}>
                          <span></span>
                          <div className={`used_time_info ${index != roomInfo.length - 1 ? 'hasDash' : ''}`}>
                            <p className="used_time">
                              {item.startTime} - {item.endTime}
                            </p>
                            <p>
                              {item.departName ? `【${item.departName}】-` : ''}【{item.originator}】-
                              {item.name}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default MeetAddRoomSelect

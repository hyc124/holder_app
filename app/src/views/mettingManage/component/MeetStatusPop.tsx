import { useState, useEffect } from 'react'
import React from 'react'
import { Button, message, Divider, Select, Checkbox } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import TextArea from 'antd/lib/input/TextArea'
import './MeetStatusPop.less'
import { useSelector } from 'react-redux'
import { ipcRenderer } from 'electron'
import { refreshPage } from '../../workdesk/TaskListData'
import { resetParamPage } from './MettingFilter'

interface DetailsProps {
  meetId: number
  type?: number // 请假 2  参加 1
  remindType?: any
}

const MeetStatusPop = ({
  visibleDetails,
  datas,
  visibleMeetStatusPop,
}: {
  visibleDetails: boolean
  datas: DetailsProps
  visibleMeetStatusPop: (
    value: {
      state: boolean //代办和推送 点击请假/参加 然后取消，不关闭详情
      isSuc: boolean
    },
    isQuery?: string
  ) => void
}) => {
  const { nowUserId, loginToken } = $store.getState()
  const [notes, setNotes] = useState('')
  //   参加会议提醒方式
  const [setChecked, setCheckedStatus] = useState<any>(['1'])

  const hintTypeCheckBox = [
    { label: '应用内提醒', value: '1' },
    { label: '短信/邮件提醒', value: '2' },
  ]

  //   提醒方式
  const remindNoticeType = (checkedValue: any) => {
    setCheckedStatus(checkedValue)
  }

  // 设置提醒方式
  const onChangeType = (value: string, options: any) => {
    console.log(value, options)
  }

  // 取消请假/参加
  const cancleCavate = () => {
    visibleMeetStatusPop({
      state: false,
      isSuc: false,
    })
  }

  //   请假原因
  const inpRemark = (e: any) => {
    setNotes(e.target.value)
  }
  useEffect(() => {}, [])
  //确定请假/参加
  const attend = () => {
    if (datas.type == 2 && notes === '') {
      message.error('请假需填写备注哦~')
      return false
    }
    let tips = '参加会议成功！'
    if (datas.type == 2) {
      tips = '会议请假成功！'
    }
    const param = {
      meetingId: datas.meetId,
      userId: nowUserId,
      joinStatus: datas.type,
      notes: notes,
    }
    $api
      .request('/public/meeting/attend', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then((resData: any) => {
        if (resData.returnCode === 0) {
          message.success(tips)
          visibleMeetStatusPop({
            state: false,
            isSuc: true,
          })
          // visibleMeetStatusPop(false, 'queryList')
          $('.meet_recived_footer_box').hide()
          $store.dispatch({ type: 'REFRESH_MEET_LIST', data: { refreshMeetList: true } })
          // 成功关闭右小角弹窗
          ipcRenderer.send('handle_messages_option', [
            'unconfirmed_meeting',
            datas.meetId,
            'unconfirmed_meeting',
          ])
          refreshPage && refreshPage()
          // 刷新筛选
          resetParamPage()
        } else {
          message.error(resData.returnMessage)
        }
      })
      .catch(resData => {
        if (datas.type == 2 && resData.returnMessage == '请填写备注') {
          message.error('请填写请假原因')
        } else {
          message.error(resData.returnMessage)
        }
        visibleMeetStatusPop({
          state: false,
          isSuc: false,
        })
      })
  }

  return (
    <Modal
      visible={visibleDetails}
      title={datas.type === 2 ? '填写请假原因' : '确认参加'}
      width={395}
      className="meetStatusPop"
      onCancel={cancleCavate}
      footer={[
        <Button key="back" onClick={cancleCavate}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={attend}>
          {datas.type == 2 ? '请假' : '确定'}
        </Button>,
      ]}
    >
      {datas.type == 2 && <TextArea placeholder="请在此填写请假原因" rows={4} onChange={inpRemark} />}
      {datas.type == 1 && (
        <div className="joinMeetBox">
          <div className="titles">确认参加该会议？</div>
          <div className="zone_remind_box">
            <span className="zone_remind_type">提醒我</span>
            <div className="zone_remind_select">
              <Select
                className="select-type"
                defaultValue={'无提醒'}
                onChange={onChangeType}
                style={{ width: 96 }}
              >
                {/* {datas.remindType.length != 0 &&
                  datas.remindType.map((ritem: any, i: number) => {
                    return ( */}
                <Select.Option value="无提醒">无提醒</Select.Option>
                <Select.Option value="0分钟提醒">0分钟提醒</Select.Option>
                <Select.Option value="5分钟提醒">5分钟提醒</Select.Option>
                <Select.Option value="15分钟提醒">15分钟提醒</Select.Option>
                <Select.Option value="30分钟提醒">30分钟提醒</Select.Option>
                <Select.Option value="1小时提醒">1小时提醒</Select.Option>
                <Select.Option value="12小时提醒">12小时提醒</Select.Option>
                <Select.Option value="1天提醒">1天提醒</Select.Option>
                <Select.Option value="1周提醒">1周提醒</Select.Option>
              </Select>
              <div className="zone_hint_type">
                <Checkbox.Group
                  defaultValue={setChecked}
                  options={hintTypeCheckBox}
                  onChange={remindNoticeType}
                ></Checkbox.Group>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default MeetStatusPop

import { useEffect, useState } from 'react'
import React from 'react'
import './MeetCancle.less'
import { Select, message, Modal } from 'antd'
import { resetParamPage } from './MettingFilter'
const { Option } = Select

const MeetCancle = ({ datas, onHideAdd }: { datas: any; onHideAdd: (value: boolean) => void }) => {
  const { loginToken } = $store.getState()
  const handleCancel = () => {
    onHideAdd(false)
  }
  const meetCancel = () => {
    const param = {
      meetingId: datas.meetId,
    }
    $api
      .request('/public/meeting/cancel', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        message.success('取消会议成功！')
        resetParamPage()
        $store.dispatch({ type: 'REFRESH_MEET_LIST', data: { refreshMeetList: true } })
      })
  }
  return (
    <Modal
      className="meetCancelPop"
      width={395}
      title="操作提示"
      visible={datas.meetCanclePop}
      onOk={meetCancel}
      onCancel={handleCancel}
    >
      <p className="muc-tips">
        【取消会议】后，将同步取消参会成员在日程中的
        <br />
        【会议】事项。请谨慎操作！
      </p>
    </Modal>
  )
}

export default MeetCancle

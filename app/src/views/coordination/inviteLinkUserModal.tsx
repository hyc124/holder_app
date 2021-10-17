import React, { useState, useEffect } from 'react'
import { Modal, Avatar, Button, Spin, message } from 'antd'
import './inviteLinkUserModal.less'
import { operateInviteLinkUser } from '../system-notice-info/getData'

import { ReadCancelMsg } from '../workdesk/getData'
const InviteLinkUserModal = ({ paramsProps, visible, onclose }: any) => {
  const [loading, setLoading] = useState(false)
  const { nowUser, nowUserId, loginToken } = $store.getState()
  //   const [visible, setVisible] = useState(false)

  // 储存协同邀请信息
  const [inviteLinkUserInfo, setInviteLinkUserInfo] = useState({
    teamLogo: '',
    name: '',
    endTime: '',
    status: '',
  })

  // 监听协同邀请联系人模态框
  useEffect(() => {
    getInviteUserMsg()
  }, [])

  // 查询邀请信息
  const getInviteUserMsg = () => {
    const param = {
      id: paramsProps.noticeTypeId,
      userId: nowUserId,
    }
    setLoading(true)
    $mainApi
      .request('/task/query/id', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        setLoading(false)

        if (res.returnCode == 0) {
          setInviteLinkUserInfo(res.data?.MAIN)
        }
      })
      .catch(err => {
        onclose(false)
        setLoading(false)
        message.error(err.returnMessage)
        //异常自动处理
        ReadCancelMsg(paramsProps.id)
      })
  }
  const acceptInviteLinkUser = (option: number) => {
    const params = {
      taskId: paramsProps.noticeTypeId,
      userId: nowUserId,
      teamId: paramsProps.teamId,
      result: option, //0同意 1拒绝
    }
    setLoading(true)
    operateInviteLinkUser(params)
      .then(() => {
        setLoading(false)
        onclose(false)
        message.success('操作成功')
      })
      .catch(err => {
        setLoading(false)
        message.error(err)
      })
  }
  const getStatus = (status: any) => {
    if (status == 0) {
      return '未开启'
    } else if (status == 1) {
      return '已开启'
    } else if (status == 2) {
      return '已完成'
    } else if (status == 3) {
      return '已延迟'
    } else if (status == 4) {
      return '已变更'
    } else if (status == -1) {
      return '已删除'
    }
  }
  const defLogo = $tools.asAssetsPath('/images/common/company_default.png')
  return (
    <Modal
      title="邀请"
      visible={visible}
      footer={false}
      onCancel={() => onclose(false)}
      okText="接受"
      cancelText="拒绝"
      className="coordianaInviteModal"
    >
      <Spin spinning={loading}>
        <p className="inviteTit">
          Hi！{nowUser}，我邀请你作为企业【{paramsProps.teamName}】的联系人参与协同任务
        </p>
        <div className="taskSynergyCont">
          <li className="joinCmyItem">
            <div className="joinCmyLeft flex ver_center flex_auto">
              {inviteLinkUserInfo.teamLogo && (
                <span className="img_icon cmy_logo_icon ">
                  <Avatar
                    size={32}
                    src={inviteLinkUserInfo.teamLogo ? inviteLinkUserInfo.teamLogo : defLogo}
                    style={{ marginRight: 5 }}
                  ></Avatar>
                </span>
              )}
              <div className="task_info_box flex_auto">
                <div className="task_name baseDarkGrayColor">{inviteLinkUserInfo.name}</div>
                <div className="task_time_box comTaskStatus">
                  {inviteLinkUserInfo.endTime && (
                    <span className="task_time">{inviteLinkUserInfo.endTime} 止</span>
                  )}
                  <span className="task_status_txt">{getStatus(inviteLinkUserInfo.status)}</span>
                </div>
              </div>
            </div>
          </li>
        </div>
        <div className="footer-btn">
          <Button onClick={() => acceptInviteLinkUser(1)}>拒绝</Button>
          <Button
            type="primary"
            onClick={() => {
              acceptInviteLinkUser(0)
            }}
          >
            同意
          </Button>
        </div>
      </Spin>
    </Modal>
  )
}

export default InviteLinkUserModal

import React, { useMemo, useRef, useEffect } from 'react'
import { Modal, Input, Avatar, Button, message } from 'antd'
import CropperModal from '@/src/components/CropperModal/index'
import { SelectMemberOrg } from '../select-member/index'
import '../../styles/modals.less'
import { useMergeState } from '@/src/views/chat-history/ChatItem'

const CreatGroupModal = (props: any) => {
  const { title, visible, closeModal, onOk } = props
  // 基本信息
  const { nowUserId, nowUser, nowAccount, userInfo } = $store.getState()
  // 选择群成员模态框的引用
  let memberComponentRef: any = useRef<any>()
  const [globalState, setGlobalState] = useMergeState({
    profile: '', // 群头像
    subjectName: '', // 群名称
    profileModalVisible: false, // 设置群头像模态框
  })

  useEffect(() => {
    return () => {
      memberComponentRef = null
    }
  }, [])

  const uploadSuccess = (profile: string) => {
    setGlobalState({
      profile: profile,
      profileModalVisible: false,
    })
  }

  const handleOk = () => {
    const selData = memberComponentRef.current?.getDataTest()
    if (!globalState.subjectName) {
      message.info('请填写群名称')
      return
    }
    if (selData.length <= 1) {
      message.info('至少选择一个除自己外的其他成员')
      return
    }
    // 保存常用联系人
    memberComponentRef.current?.saveContacts()
    onOk(globalState.subjectName, selData, globalState.profile)
  }

  // 修改群聊名称
  const onChangeValue = (e: any) => {
    const value = e.target.value
    const newVal = value.replace(/\s*/g, '').replace(/%/g, '')
    setGlobalState({
      subjectName: newVal,
    })
  }

  // 发起讨论options
  const selectMember = {
    param: {
      visible: true,
      sourceType: 'chat_invit',
      title: '',
      selectList: [
        {
          chatUserType: 0, //群主
          curId: nowUserId,
          curName: nowUser,
          curType: 0,
          account: nowAccount,
          profile: userInfo.profile,
          disable: false,
        },
      ],
      showPrefix: {
        //是否显示成员的部门岗位前缀
        dept: false, //部门
        role: false, //岗位
        company: false, //企业前缀
      },
      comMember: true,
    },
  }

  const MemberModal = useMemo(() => {
    return <SelectMemberOrg ref={memberComponentRef} {...selectMember} />
  }, [])

  const openProfileVsible = () => {
    setGlobalState({
      profileModalVisible: true,
    })
  }

  const closeProfileVsible = () => {
    setGlobalState({
      profileModalVisible: false,
    })
  }

  return (
    <Modal
      title={title}
      className="creat_group_modal selectMemberOrgModal"
      visible={visible}
      width={850}
      maskClosable={false}
      keyboard={false}
      centered
      bodyStyle={{ height: '565px' }}
      onCancel={closeModal}
      onOk={handleOk}
      footer={[
        <Button key="back" onClick={closeModal}>
          {$intl.get('cancel')}
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          {$intl.get('sure')}
        </Button>,
      ]}
    >
      <div className="formItem">
        <span className="formTitle">群名称</span>
        <span className="formContent groupName">
          <Input
            maxLength={30}
            placeholder="输入群名称（必填）"
            value={globalState.subjectName}
            onChange={onChangeValue}
          />
          <span className="rule">{globalState.subjectName.length}/30</span>
        </span>
      </div>
      <div className="formItem">
        <span className="formTitle">群头像</span>
        {globalState.profile ? (
          <span className="formContent groupHeader">
            <i onClick={openProfileVsible}>
              <Avatar
                size={42}
                src={globalState.profile}
                className="user-avatar"
                style={{ color: '#fff', fontSize: '14px', backgroundColor: '#4285f4' }}
              ></Avatar>
            </i>
            <span onClick={() => setGlobalState({ profile: '' })}>恢复默认头像</span>
          </span>
        ) : (
          <span className="formContent groupHeader">
            <i onClick={openProfileVsible}></i>
            <span onClick={openProfileVsible}>编辑头像</span>
          </span>
        )}
      </div>
      <div className="formItem groupUserItem">
        <span className="formTitle">群成员</span>
        <span className="formContent groupUser">{MemberModal}</span>
      </div>

      {/* 上传头像模态框 */}
      {globalState.profileModalVisible && (
        <CropperModal
          uploadSuccess={uploadSuccess}
          visible={globalState.profileModalVisible}
          closeModal={closeProfileVsible}
        />
      )}
    </Modal>
  )
}

export default CreatGroupModal

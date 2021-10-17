import React, { useMemo, useRef, useEffect } from 'react'
import { Modal, Button, message } from 'antd'
import { SelectMemberOrg } from '../select-member/index'
import { useSelector } from 'react-redux'

const CreatGroupModal = (props: any) => {
  const { title, visible, closeModal, onOk, roomType } = props
  // 选择群成员模态框的引用
  let memberComponentRef: any = useRef<any>()

  useEffect(() => {
    return () => {
      memberComponentRef = null
    }
  }, [])

  const handleOk = () => {
    const selData = memberComponentRef.current?.getDataTest()
    const isMyself = selData.find((item: any) => {
      return item.curId == $store.getState().nowUserId
    })
    if ((isMyself && selData.length === 1) || !selData.length) {
      message.info('至少选择一个除自己外的其他成员')
      return
    }
    // 保存常用联系人
    memberComponentRef.current?.saveContacts()
    onOk(selData)
  }
  // 发起讨论options
  const selectMember: any = {
    param: {
      visible: true,
      sourceType: 'chat_invit',
      title: '',
      selectList: [],
      showPrefix: {
        //是否显示成员的部门岗位前缀
        dept: false, //部门
        role: false, //岗位
        company: false, //企业前缀
      },
      comMember: true,
    },
  }
  if (roomType === 4) {
    const { selectItem } = $store.getState()
    selectMember.param.chatDeptTeadIds = [selectItem.ascriptionId] //部门群需要得企业ID参数
  }
  const MemberModal = useMemo(() => {
    return <SelectMemberOrg ref={memberComponentRef} {...selectMember} />
  }, [])

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
      <div style={{ height: '100%' }}>{MemberModal}</div>
    </Modal>
  )
}

export default CreatGroupModal

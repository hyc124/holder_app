import React, { useEffect, useState, useRef } from 'react'
import { Modal, Checkbox, Input, Avatar, Button, message } from 'antd'
import { getChatUsers } from '../../getData/getData'
import { CloseCircleOutlined } from '@ant-design/icons'
import '../../styles/modals.less'

const SelectChatUserModal = (props: any) => {
  const { visible, selectedRoomId, closeModal, editType, handleSaveSelected } = props
  // 当前聊天室成员列表
  const [chatUserLists, setChatUserLists] = useState<Array<globalInterface.ChatMemberPorps>>([])
  // 右侧选中的成员
  const [selectedUser, setSelectedUser] = useState<Array<globalInterface.ChatMemberPorps>>([])
  // 搜索成员输入框
  const inputRef = useRef<any>()
  const [keywords, setKeywords] = useState('')

  useEffect(() => {
    getChatUsers({
      roomId: selectedRoomId,
      keywords: keywords,
    }).then((resData: any) => {
      const userModels = resData.dataList || []
      setChatUserLists(userModels)
      if (editType === 'groupLeader') {
        // 已设置的群主
        const data = userModels.filter((item: any) => {
          return item.memberType === 0
        })
        setSelectedUser(data)
      } else {
        // 已设置的管理员
        const data = userModels.filter((item: any) => {
          return item.memberType === 2
        })
        setSelectedUser(data)
      }
    })
  }, [keywords, selectedRoomId])

  const handleSelect = (record: globalInterface.ChatMemberPorps) => {
    if (editType === 'groupLeader') {
      // 修改群主只能单选
      setSelectedUser([record])
    } else {
      // 设置管理员可多选
      let isIn = false
      const dataCopy = [...selectedUser]
      dataCopy.map((item: any, index: number) => {
        if (item.userId === record.userId) {
          isIn = true
          dataCopy.splice(index, 1)
        }
      })
      if (!isIn) {
        setSelectedUser(origin => {
          return [...origin, record]
        })
      } else {
        setSelectedUser(dataCopy)
      }
    }
  }

  // 删除选中的人
  const deleteSelected = (record: any) => {
    const dataCopy = [...selectedUser]
    dataCopy.map((item: any, index: number) => {
      if (item.userId === record.userId) {
        dataCopy.splice(index, 1)
      }
    })
    setSelectedUser(dataCopy)
  }

  const handleOk = () => {
    if (!selectedUser.length) {
      message.error('没有选中任何成员')
      return
    }
    handleSaveSelected(selectedUser)
  }

  const searchChatMembers = (e: any) => {
    setKeywords(e.target.value)
  }

  return (
    <Modal
      className="selectChatUserModal"
      title={'设置群主'}
      visible={visible}
      width={850}
      bodyStyle={{ height: '515px' }}
      centered
      maskClosable={false}
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
      <div className="selectUsersContent">
        <div className="selectUsersLeft">
          <Input.Search
            className="search-input"
            placeholder="请输入姓名"
            onSearch={value => {
              setKeywords(value)
            }}
            onPressEnter={searchChatMembers}
            ref={inputRef}
          />
          <div className="title">群成员</div>
          <div className="Subtitle">已加入该主题讨论的成员~</div>
          <div className="dataListContent">
            <ul>
              {chatUserLists.map(item => {
                return (
                  <li key={item.userId} onClick={() => handleSelect(item)}>
                    <div>
                      <Avatar src={item.headPhoto || ''} className="showHead flex_shrink_0">
                        {item.userName?.substr(-2, 2)}
                      </Avatar>
                      <span className="username">{item.userName}</span>
                    </div>
                    <Checkbox
                      checked={selectedUser.some(a => {
                        return a.userId === item.userId
                      })}
                      key={item.userId}
                    ></Checkbox>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <div className="selectUsersRight">
          <div className="title">已选</div>
          <ul>
            {selectedUser.map(item => {
              return (
                <li key={item.userId}>
                  <div>
                    <Avatar src={item.headPhoto || ''} className="showHead flex_shrink_0">
                      {item.userName?.substr(-2, 2)}
                    </Avatar>
                    <span className="username">{item.userName}</span>
                  </div>
                  {editType !== 'groupLeader' && (
                    <div className="closeIcon" onClick={() => deleteSelected(item)}>
                      <CloseCircleOutlined style={{ fontSize: '16px', color: '#70707a' }} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Modal>
  )
}

export default SelectChatUserModal

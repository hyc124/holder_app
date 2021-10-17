import React, { useEffect, useState, Fragment, memo } from 'react'
import { Switch, message } from 'antd'
import { queryRobotSettingMessage, updateNoticeStatus, queryRobotMessage } from '../getData/getData'

const PublicSetting = (props: any) => {
  const { selectedRoomId } = props
  // 基本信息
  const { nowUserId } = $store.getState()
  // 获取设置的基本信息
  const [settingList, setSettingList] = useState([])
  // 获取设置的列表
  const getSettingList = () => {
    queryRobotSettingMessage({
      userId: nowUserId,
      mucRelationId: selectedRoomId,
    }).then((resData: any) => {
      setSettingList(resData)
    })
  }
  // 获取机器人的历史聊天记录
  const getRobotMessageList = () => {
    queryRobotMessage({
      pageNo: 0,
      size: 20,
      userId: nowUserId,
      mucRelationId: selectedRoomId,
    }).then((resData: any) => {
      const hasMore = resData.length === 20 ? true : false
      $store.dispatch({
        type: 'CHAT_ROOM_INFO',
        data: { messageHistory: resData },
      })
      $store.dispatch({ type: 'SET_HASMORE_HISTORYMESSAGE', data: hasMore })
      $store.dispatch({ type: 'SET_KEEP_SCROLL', data: false })
    })
  }
  useEffect(() => {
    getSettingList()
  }, [selectedRoomId])

  // 是否禁用选中行类型消息
  const handleChangeMsgType = (remindType: number, id: number) => {
    const value = {
      notice: remindType,
      id: id,
    }
    updateNoticeStatus(value)
      .then(() => {
        getRobotMessageList()
        getSettingList()
        message.success('设置成功')
      })
      .catch(() => {
        message.success('设置失败')
      })
  }

  return (
    <div className="system-msg-setting">
      <div className="setting_middle_title">消息接收设置</div>
      <div className="setting_show_box">
        <div className="setting_item" style={{ minHeight: '30px' }}>
          <div className="left_txt" style={{ paddingTop: '10px' }}>
            <p style={{ fontSize: '12px', color: '#9A9AA2' }}>类型</p>
            {/* <span>开启后不再收到推送消息，无红点展示</span> */}
          </div>
        </div>
        {settingList.map((item: any, index: number) => {
          return (
            <Fragment key={item.id}>
              <div className="setting_item" style={index == 0 ? { borderTop: 'none' } : {}}>
                <div className="left_txt">
                  <p>{item.belongSecondMessageTitle}</p>
                  {/* <span>开启后不再收到推送消息，无红点展示</span> */}
                </div>
                <Switch
                  checked={item.notice == 1 ? true : false}
                  onChange={checked => {
                    const remindType = checked ? 1 : 0
                    handleChangeMsgType(remindType, item.id)
                  }}
                />
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default memo(PublicSetting)

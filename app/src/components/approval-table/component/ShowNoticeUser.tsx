import React from 'react'
import { Avatar } from 'antd'
//显示抄送人
const ShowNoticeUser = ({ users, noticeType }: any) => {
  return (
    <div className="approval-notice-box">
      <div className="aproval-notice-title">
        知会人（{noticeType === 0 ? '发起审批时通知知会人）' : '结束审批时通知知会人）'}
      </div>
      <div className="approval-notice-user-list">
        {users.map((item: any, index: number) => {
          return (
            <div className="item" key={index}>
              <Avatar className="oa-avatar" src={item.userProfile}>
                {item.username.substr(-2, 2)}
              </Avatar>
              {item.username}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ShowNoticeUser

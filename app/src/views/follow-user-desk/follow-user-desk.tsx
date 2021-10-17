import React, { useEffect } from 'react'
// import WorkDesk from '@/src/views/workdesk/workdesk'
import MyWorkDesk from '@/src/views/myWorkDesk/myWorkDesk'

const FollowDesk = () => {
  const { followUserInfo } = $store.getState()
  useEffect(() => {
    getFollowDesk()
  }, [followUserInfo.userId])
  const getFollowDesk = () => {
    return <MyWorkDesk isFollow={true} />
  }
  return (
    <div className="follow_Wrap" style={{ width: '100%', height: '100%' }}>
      <div className="follow_wrap_content" style={{ width: '100%', height: '100%' }}>
        {getFollowDesk()}
      </div>
    </div>
  )
}

export default FollowDesk

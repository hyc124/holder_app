import React from 'react'
import NoneData from '@/src/components/none-data/none-data'
import './FocusUserList.less'
import { Menu, Button, Avatar, Tooltip } from 'antd'
import $c from 'classnames'

interface FollowerProps {
  userId: number
  followId: number
  username: string
  userProfile?: string
  account: string
  isAshPlacing: number
  isSuperior: number
}

const FocusUserList = ({
  dataSource,
  onSelect,
  followType,
}: {
  dataSource: Array<FollowerProps>
  onSelect: any
  followType: number
}) => {
  return (
    <div className="foucu-user-list flex column">
      {dataSource.length === 0 && <NoneData />}
      {dataSource.length !== 0 && (
        <>
          <div className="focus-user-header flex between center-v">
            <Menu mode={'horizontal'} defaultSelectedKeys={['0']} onSelect={onSelect}>
              <Menu.Item key="0">我关注的</Menu.Item>
              <Menu.Item key="1">关注我的</Menu.Item>
            </Menu>
            <Tooltip title={'添加关注'}>
              <Button
                type="link"
                icon={<img src={$tools.asAssetsPath('/images/workdesk/follow_add.png')} />}
              ></Button>
            </Tooltip>
          </div>
          <div className="focus-user-content flex-1 flex">
            {dataSource.map((item: FollowerProps, index: number) => {
              return (
                <div
                  key={index}
                  className={$c('user-item flex column center', { noneClick: item.isAshPlacing !== 0 })}
                >
                  <Avatar
                    size={42}
                    src={item.userProfile}
                    style={{ backgroundColor: '#4285f4', fontSize: 14, marginBottom: 7 }}
                  >
                    {item.username.substr(-2, 2)}
                  </Avatar>
                  <span className="show-user text-ellipsis">{item.username}</span>
                  <Tooltip title={followType === 0 ? '取消订阅' : '取消授权'}>
                    <span className="del-item-icon"></span>
                  </Tooltip>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default FocusUserList

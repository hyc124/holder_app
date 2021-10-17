import React, { useEffect, useState, useRef } from 'react'
import { Avatar, Menu, Tabs, Tooltip, Modal, message } from 'antd'
import { useSelector, shallowEqual } from 'react-redux'
import { queryFollowData, batchFollow, getAuthUserIds, cancelFollowAuth } from '../workdesk/getData'
import { ipcRenderer } from 'electron'
import { CloseOutlined } from '@ant-design/icons'
import './myWorkDeskHeader.less'
import { SelectMemberOrg } from '../../components/select-member-org/index'
interface FollowItemProps {
  account: string
  followId: number
  isAshPlacing: number
  isSuperior: number
  userId: number
  userProfile: string
  username: string
}
export const FollowUser = (props: any) => {
  const { isFollow, callbackFn } = props
  const { nowUserId, nowAccount, orgInfo } = $store.getState()
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId, shallowEqual)
  const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  const orgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const teamId = !isFollow ? selectTeamId : followSelectTeadId
  //显示选人组件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  let isUnmounted = false
  const [state, setState] = useState({
    activeKey: '0',
    followLen: 0, //关注数量
    fansLen: 0, //粉丝数量
    follData: [], //关注人粉丝数据
    fansData: [], //粉丝列表
    persons: [], //记录选中人员
    selMemberOrg: {}, //选人插件
    isLoad: false,
    // memberOrgShow: false, //显示选人组件
    user: '', //操作人
    userId: 0, //操作人id
    followId: 0, //跟随id
    visible: false, //删除提示模块
  })
  useEffect(() => {
    queryFollowLen(1)
    queryFollowLen(0)
    return () => {
      isUnmounted = true
    }
  }, [state.isLoad, teamId])
  useEffect(() => {
    queryFollowLen(state.activeKey)
  }, [state.activeKey])
  //tab值改变
  const tabChange = (activeKey: string) => {
    setState({
      ...state,
      activeKey,
    })
  }

  const selectAttention = (type: string, key: React.Key) => {
    if (type == 'follow' && key == 0) {
      //添加
      followUser(1)
    }
  }
  //关注人列表
  const queryFollowLen = (type?: any) => {
    queryFollowData(type, isFollow).then((data: any) => {
      if (type == 1) {
        state.fansLen = data.length
        state.fansData = data
        setState({ ...state })
      } else {
        state.followLen = data.length
        state.follData = data
        state.persons = handleData(data)
        setState({ ...state })
      }
    })
  }
  //查询关注人工作台
  const lookWorkbench = (item: any) => {
    if (item.isAshPlacing !== 0 || state.activeKey == '1') {
      return false
    }
    const { followUserInfo } = $store.getState()
    if (item.userId == nowUserId) {
      return message.error('无法查看自己的工作台')
    }
    if (followUserInfo.followOrgId) {
      //已经是关注人工作台继续点击关注人
      ipcRenderer.send('close_goalgo_follow')
    }
    $store.dispatch({
      type: 'FOLLOW_USER_INFO',
      data: {
        followStatus: true,
        userId: item.userId,
        userProfile: item.userProfile || '',
        account: item.account,
        name: item.username,
        followOrgId: selectTeamId == -1 || isNaN(selectTeamId) ? '' : selectTeamId,
      },
    })
    console.log($store.getState())

    $tools.createWindow('FollowWorkDesk')
  }
  //添加关注人
  const followUser = (isFollow: number) => {
    const teamId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
    if (!isFollow) {
      getAuthUserIds({
        orgId: teamId,
        account: nowAccount,
      })
        .then(() => {
          openUseriframe()
        })
        .catch(() => {
          message.error('查询关注人权限列表')
        })
    } else {
      openUseriframe()
    }
  }
  //打开人员选择器
  const openUseriframe = () => {
    const orgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
    const selectOrg = orgInfo.filter((item: any) => item.id === selectTeamId)
    const orgName = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectOrg[0].name
    const $personOption = {
      teamId: orgId,
      selectList: state.persons,
      allowTeamId: [],
      onSure: (dataList: any) => {
        const ids: any = []
        dataList.forEach((item: any) => {
          ids.push(item.curId)
        })
        batchFollow({
          userId: nowUserId,
          followId: ids,
          followType: 'user',
          belong: 'org',
          belongId: orgId,
          belongName: orgName,
        }).then(() => {
          message.success('操作成功')
          setState({ ...state, isLoad: !state.isLoad })
        })
      },
    }
    setState({
      ...state,
      selMemberOrg: $personOption,
      // memberOrgShow: true,
    })
    setMemberOrgShow(true)
  }
  //组装人员选择器需要的数据格式
  const handleData = (list: any) => {
    const arr: any = []
    list.map((item: any) => {
      arr.push({
        curId: item.userId,
        curName: item.username,
      })
    })
    return arr
  }
  //弹框二次确认
  const sureCancelAuth = () => {
    const { userId, followId } = state
    const param: any = {
      loginUser: nowUserId,
    }
    if (selectTeamId !== -1 && !isNaN(selectTeamId)) {
      param.orgId = selectTeamId
    }
    if (state.activeKey == '0') {
      param.userId = nowUserId
      param.followUserId = userId
    } else {
      param.userId = userId
      param.followUserId = nowUserId
    }
    cancelFollowAuth(param).then((data: any) => {
      if (data.returnCode == 0) {
        message.success('操作成功！')
        const newData = state.follData.filter((item: FollowItemProps) => item.followId !== followId)
        if (state.activeKey == '0') {
          setState({
            ...state,
            followLen: newData.length,
            follData: newData,
            persons: handleData(newData),
            visible: false,
          })
        } else {
          setState({
            ...state,
            fansLen: newData.length,
            fansData: newData,
            persons: handleData(newData),
            visible: false,
          })
        }
      } else {
        setState({
          ...state,
          visible: false,
        })
        message.error(data.returnMessage)
      }
    })
  }
  const MenuList = (type: number) => {
    //type:1关注的工作台，2被关注

    const list = (type == 2 ? state.fansData : state.follData).map((item: any) => {
      return (
        <Menu.Item key={item.userId}>
          <div
            className={`menu_item_box flex column center ${item.isAshPlacing !== 0 ? 'noneClick' : ''}`}
            onClick={() => lookWorkbench(item)}
          >
            <Avatar
              size={42}
              src={item.userProfile}
              style={{
                color: '#fff',
                backgroundColor: '#4285f4',
                fontSize: 12,
                boxShadow: '0 3px 8px 0 rgba(66, 133, 244, 0.6)',
              }}
            >
              {item.username ? item.username.substr(-2, 2) : ''}
            </Avatar>
            <span className="add_att_txt">{item.username}</span>
            {item.isSuperior == 0 && orgId && !isFollow && (
              <Tooltip title={state.activeKey == '0' ? '取消订阅' : '取消授权'}>
                <span
                  className="del-item-icon"
                  onClick={e => {
                    e.stopPropagation()
                    setState({
                      ...state,
                      user: item.username,
                      userId: item.userId,
                      followId: item.followId,
                      visible: true,
                    })
                  }}
                ></span>
              </Tooltip>
            )}
          </div>
        </Menu.Item>
      )
    })
    return list
  }

  return (
    <div className="attention_box">
      <CloseOutlined
        className="att_close"
        onClick={(e: any) => {
          e.stopPropagation()
          callbackFn()
        }}
      />
      <Tabs activeKey={state.activeKey} onChange={tabChange}>
        <Tabs.TabPane tab={`关注的工作台(${state.followLen})`} key="0">
          <div className="follow_list_box">
            <Menu
              className="attention_menu flex"
              // style={{ width: '134px' }}
              onClick={props => {
                selectAttention('follow', props.key)
              }}
            >
              {!isFollow && orgId && (
                <Menu.Item key={0}>
                  <div className={`menu_item_box flex column center`}>
                    <img src={$tools.asAssetsPath('/images/myWorkDesk/header_attention.png')}></img>
                    <span className="add_att_txt">添加</span>
                  </div>
                </Menu.Item>
              )}
              {MenuList(1)}
            </Menu>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={`被关注(${state.fansLen})`} key="1">
          <div className="follow_list_box">
            <Menu
              className="attention_menu flex"
              // style={{ width: '134px' }}
              onClick={props => {
                selectAttention('fans', props.key)
              }}
            >
              {MenuList(2)}
            </Menu>
          </div>
        </Tabs.TabPane>
      </Tabs>
      {memberOrgShow && (
        <SelectMemberOrg
          param={{
            visible: memberOrgShow,
            showPrefix: {
              //是否显示成员的部门岗位前缀
              dept: false, //部门
              role: false, //岗位
              company: false, //企业前缀
            },
            ...state.selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
          }}
        />
      )}
      <Modal
        title="操作提示"
        centered={true}
        wrapClassName={'wrap-modal'}
        maskClosable={false}
        visible={state.visible}
        onOk={() => sureCancelAuth()}
        onCancel={() => setState({ ...state, visible: false })}
        width={400}
        bodyStyle={{ padding: '20px', height: '192px', display: 'flex', alignItems: 'center' }}
      >
        <div style={{ color: '#7a7a7a', fontSize: '14px', textAlign: 'center' }}>
          {state.activeKey == '0' ? (
            <p>
              <span>
                是否确认取消关注<span style={{ color: '#4285f4' }}>{state.user}</span>的工作台？
              </span>
              <span>取消之后需再次发起关注</span>
            </p>
          ) : (
            <p>
              <span>
                是否确认取消授权<span style={{ color: '#4285f4' }}>{state.user}</span>关注你的工作台？
              </span>
              <span>取消授权之后对方将看不到你的工作台</span>
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}

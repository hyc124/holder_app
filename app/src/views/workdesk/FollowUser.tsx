import React, { useEffect, useState } from 'react'
import { Avatar, Tooltip, Modal, message, Spin } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import { queryFollowData, cancelFollowAuth, getAuthUserIds, batchFollow } from './getData'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import $c from 'classnames'
import { ipcRenderer } from 'electron'
import { useSelector, shallowEqual } from 'react-redux'
import { useMergeState } from '../chat-history/chat-history'
interface FollowItemProps {
  account: string
  followId: number
  isAshPlacing: number
  isSuperior: number
  userId: number
  userProfile: string
  username: string
}
interface EnlargeProps {
  enlargeVisble: boolean
  enlargeModule: (state: any) => void
  isFollow?: boolean
}

let refresh: any = null
export const refreshFollowList = (type: any) => {
  refresh && refresh(type)
}
//*************工作台关注人模块**********//
export const FollowUser = (props: EnlargeProps) => {
  const { enlargeVisble, enlargeModule, isFollow } = props
  const { nowUserId, nowAccount, orgInfo } = $store.getState()
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId, shallowEqual)
  const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  const orgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const teamId = !isFollow ? selectTeamId : followSelectTeadId
  //各种状态
  const [isLoad, setIsLoad] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //记录当前操作的人员信息
  const [followInfo, setFollowInfo] = useState({
    user: '',
    userId: 0,
    followId: 0,
  })
  //组件变量值
  const [followParam, setFollowParam] = useMergeState({
    fType: 0, //关注人粉丝类型
    followLen: 0, //关注数量
    fansLen: 0, //粉丝数量
    follData: [], //关注人粉丝数据
    persons: [], //记录选中人员
    selMemberOrg: {}, //选人插件
  })

  let isUnmounted = false
  //初始化进入
  useEffect(() => {
    queryFollowLen(0)
    queryFollowLen(1)
  }, [teamId])

  useEffect(() => {
    queryFollowUser()
    return () => {
      isUnmounted = true
    }
  }, [followParam.fType, isLoad, teamId])

  const queryFollowUser = (type?: any) => {
    setLoading(true)
    queryFollowData(type ? type : followParam.fType, isFollow).then((data: any) => {
      setLoading(false)
      if (!isUnmounted && !type) {
        followParam.fType === 0
          ? setFollowParam({ followLen: data.length })
          : setFollowParam({ fansLen: data.length })
        setFollowParam({
          follData: data,
          persons: handleData(data),
        })
      }
      if (type) {
        // 推送：申请关注工作台时只需要查粉丝
        setFollowParam({
          follData: data,
          fansLen: data.length,
        })
      }
    })
  }
  refresh = (type: any) => {
    queryFollowUser(type)
    setFollowParam({ fType: type })
  }
  const queryFollowLen = (type: number) => {
    queryFollowData(type, isFollow).then((data: any) => {
      const len = data.length
      type === 0 ? setFollowParam({ followLen: len }) : setFollowParam({ fansLen: len })
    })
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
    const { userId, followId } = followInfo
    const param: any = {
      loginUser: nowUserId,
    }
    if (selectTeamId !== -1 && !isNaN(selectTeamId)) {
      param.orgId = selectTeamId
    }
    if (followParam.fType == 0) {
      param.userId = nowUserId
      param.followUserId = userId
    } else {
      param.userId = userId
      param.followUserId = nowUserId
    }
    setVisible(false)
    cancelFollowAuth(param).then((data: any) => {
      if (data.returnCode == 0) {
        message.success('操作成功！')
        const newData = followParam.follData.filter((item: FollowItemProps) => item.followId !== followId)
        setFollowParam({
          follData: newData,
          persons: handleData(newData),
        })
        if (followParam.fType == 0) {
          setFollowParam({ followLen: newData.length })
        } else {
          setFollowParam({ fansLen: newData.length })
        }
      } else {
        message.error(data.returnMessage)
      }
    })
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
      selectList: followParam.persons,
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
          setIsLoad(!isLoad)
        })
      },
    }
    setFollowParam({
      selMemberOrg: $personOption,
    })
    setMemberOrgShow(true)
  }
  //查看关注人详情
  const lookWorkbench = (item: FollowItemProps) => {
    if (item.isAshPlacing !== 0 || followParam.fType == 1) {
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
    $tools.createWindow('FollowWorkDesk')
  }
  const largScreen = () => {
    const showModal = !enlargeVisble ? true : false
    $store.dispatch({ type: 'SCREEN_PARAMS', data: { active: 1 } })
    enlargeModule(showModal)
  }
  const showAddBtn = 0 == followParam.fType && orgId && !isFollow
  return (
    <div className="follow_user_modal">
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
            ...followParam.selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
          }}
        />
      )}
      <div className="follow_navbar">
        <div className="flex-1">
          <span style={{ marginRight: '20px' }} className="span" onClick={() => setFollowParam({ fType: 0 })}>
            <label className={$c({ followNavActive: 0 == followParam.fType })}>关注</label>
            {followParam.followLen == 0 ? '' : `(${followParam.followLen})`}
          </span>
          <span className="span" onClick={() => setFollowParam({ fType: 1 })}>
            <label className={$c({ followNavActive: 1 == followParam.fType })}>粉丝</label>
            {followParam.fansLen == 0 ? '' : `(${followParam.fansLen})`}
          </span>
        </div>
        <div style={{ display: 'flex', width: '52px', alignItems: 'center' }}>
          <span
            className={$c('span', { 'enlarge-btn': !enlargeVisble, 'screen-enlarge-larg': enlargeVisble })}
            onClick={largScreen}
          ></span>
          {showAddBtn && <span className="span follow_add_btn" onClick={() => followUser(1)}></span>}
        </div>
      </div>
      <div className={`follow_list ${enlargeVisble ? 'is-full-follow-list' : ''}`}>
        {followParam.follData.map((item: FollowItemProps, index: number) => (
          <span
            key={index}
            className={$c('fp-item', { noneClick: item.isAshPlacing !== 0 })}
            onClick={() => lookWorkbench(item)}
          >
            <Avatar
              size={42}
              src={item.userProfile}
              style={{ color: '#fff', fontSize: '14px', backgroundColor: '#4285f4' }}
            >
              {item.username.substr(-2, 2)}
            </Avatar>
            <span className="my_ellipsis " style={{ color: '#9A9AA2', marginTop: '3px' }}>
              {item.username}
            </span>
            {item.isSuperior == 0 && !isFollow && (
              <Tooltip title={followParam.fType === 0 ? '取消订阅' : '取消授权'}>
                <span
                  className="del-item-icon"
                  onClick={e => {
                    e.stopPropagation()
                    setFollowInfo({
                      ...followInfo,
                      user: item.username,
                      userId: item.userId,
                      followId: item.followId,
                    })
                    setVisible(true)
                  }}
                ></span>
              </Tooltip>
            )}
          </span>
        ))}
        {loading && (
          <div className="example">
            <Spin />
          </div>
        )}
        {followParam.follData.length == 0 && (
          <NoneData
            className="threePosition"
            imgSrc={$tools.asAssetsPath('/images/noData/no_follows.png')}
            showTxt="关注对方能看到Ta的工作台哦~(*^▽^*)"
            imgStyle={{ width: 70, height: 66.5 }}
            containerStyle={{ zIndex: 0, marginTop: enlargeVisble ? 0 : 80 }}
          />
        )}
      </div>
      <Modal
        title="操作提示"
        centered={true}
        wrapClassName={'wrap-modal'}
        maskClosable={false}
        visible={visible}
        onOk={() => sureCancelAuth()}
        onCancel={() => setVisible(false)}
        width={400}
        bodyStyle={{ padding: '20px', height: '192px', display: 'flex', alignItems: 'center' }}
      >
        <div style={{ color: '#7a7a7a', fontSize: '14px', textAlign: 'center' }}>
          {followParam.fType === 0 ? (
            <p>
              <span>
                是否确认取消关注<span style={{ color: '#4285f4' }}>{followInfo.user}</span>的工作台？
              </span>
              <span>取消之后需再次发起关注</span>
            </p>
          ) : (
            <p>
              <span>
                是否确认取消授权<span style={{ color: '#4285f4' }}>{followInfo.user}</span>关注你的工作台？
              </span>
              <span>取消授权之后对方将看不到你的工作台</span>
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}

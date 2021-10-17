/**
 * 彩虹屁模块+个人人脉模块
 */
import React, { useEffect, useState } from 'react'
import { Avatar, Menu, Dropdown, Modal, List, Spin, Pagination } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { getThumbsData, getOrgProfileById, queryUsercalculation, queryCondolences, thumbRead } from './getData'
import { useSelector } from 'react-redux'
import { useMergeState } from '../chatwin/ChatWin'
import NoneData from '@/src/components/none-data/none-data'
import $c from 'classnames'
import ReportDetails from '../workReport/component/ReportDetails'
import './workDeskFbulous.less'

interface StarticProps {
  isFollow?: boolean
}
const FabulousType = {
  work_report: '工作报告',
  task_report: '任务汇报',
  plan_report: '规划汇报',
}
export const WorkDeskStatistics = ({ isFollow }: StarticProps) => {
  const { followUserInfo, nowUser, nowAvatar } = $store.getState()
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  const newOrgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const orgId = !isFollow ? selectTeamId : followSelectTeadId
  const [curState, setCurState] = useMergeState({
    reportId: 0, //汇报详情ID
    pageNo: 0, //页码
    pageSize: 5,
    totalPages: 0, //总页数
    totalElements: 0, //数据总条数
    loading: false, //加载状态
    hasMore: true,
    reportVisble: false, //工作报告详情框
    visible: false, //模态框是否隐藏
    dropvisible: false,
    thumbsData: [], //点赞数据
    userTitle: '', //彩虹屁标题
    sympathy: '', //彩虹屁
    timeImgSrc: '', //彩虹屁图标
    profileImg: '', //登陆人头像
    userName: '', //登陆人姓名
  })

  const [thumbsInfo, setThumbsUp] = useState({
    thumbsUpNum: 0,
    newThumbsUpNum: 0,
    contactsNum: 0,
    entryDays: 0,
    finishTaskNum: 0,
  })

  useEffect(() => {
    queryCulation()
    queryCondolen()
    setCurState({
      profileImg: nowAvatar,
      userName: nowUser,
    })
    if (isFollow) {
      const { userProfile, name } = followUserInfo
      setCurState({
        profileImg: userProfile,
        userName: name.substr(-2, 2),
      })
    }
  }, [orgId])

  useEffect(() => {
    queryPageInfo()
  }, [orgId, curState.pageNo, curState.pageSize])

  useEffect(() => {
    setCurState({ pageNo: 0, pageSize: 5 })
  }, [!curState.visible])

  //查询
  const queryCulation = () => {
    queryUsercalculation(isFollow).then((data: any) => {
      setThumbsUp(data)
    })
  }
  const queryCondolen = () => {
    queryCondolences(isFollow).then((data: any) => {
      const { name, describe, hour } = data
      setCurState({ userTitle: name, sympathy: describe })
      renderTimeIcon(hour)
    })
  }
  //根据当前时间展示相应的图标
  const renderTimeIcon = (hour: number) => {
    let dateIcon = ''
    if (hour >= 6 && hour < 11) {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_sw.png')
    } else if (hour >= 11 && hour < 13) {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_zw.png')
    } else if (hour >= 13 && hour < 19) {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_xw.png')
    } else if (hour >= 19 && hour < 23) {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_ws.png')
    } else {
      dateIcon = $tools.asAssetsPath('/images/workdesk/chp_icon_sy.png')
    }
    setCurState({ timeImgSrc: dateIcon })
  }

  //刷新列表
  const queryPageInfo = () => {
    setCurState({ loading: true })
    getThumbsData(curState.pageNo, curState.pageSize, isFollow).then((res: any) => {
      const { content, totalPages, totalElements } = res.data
      setCurState({
        loading: false,
        totalPages: totalPages,
        totalElements: totalElements,
        thumbsData: content,
      })
    })
  }
  //打开详情框后设置已读状态
  const openLargModal = () => {
    setCurState({ visible: true, dropvisible: false })
    thumbRead({
      userId: orgId,
    }).then((data: any) => {
      if (data.returnCode === 0) {
        queryCulation()
        queryPageInfo()
      }
    })
  }

  //分页切换
  const thumPageChange = (page: number, pageSize: any) => {
    const _page = page == 0 ? page : page - 1
    setCurState({ pageNo: _page, pageSize: pageSize })
  }
  const menu = (
    <Menu className="thumbsUp_small_wrap">
      <div className="handle_title">个人获赞</div>
      {curState.thumbsData.map((item: any, index: number) => {
        return (
          <Menu.Item key={index} onClick={() => openLargModal()}>
            <span className={$c({ redItem: item.readState == 0 })}>
              <Avatar
                size={32}
                src={newOrgId === -1 ? getOrgProfileById(item.belongId) : item.userProfile}
                style={{
                  color: '#fff',
                  backgroundColor: '#4285f4',
                  fontSize: 12,
                }}
              >
                {item.userName && item.userName.substr(-2, 2)}
              </Avatar>
            </span>
            <div className="userInfo">
              <span className="tips">
                <span className="pName" style={{ marginRight: '10px', color: '#4285f4' }}>
                  {item.userName}
                </span>
                做的很棒给你一个赞
                <span className="supIcon"></span>
              </span>
              <span className="supTime">{item.thumbsUpTime}</span>
            </div>
          </Menu.Item>
        )
      })}
      {curState.thumbsData.length === 0 && <NoneData />}
      {curState.thumbsData.length !== 0 && (
        <div className="handle_footer">
          <span className="spn" onClick={() => openLargModal()}>
            查看详情
            <RightOutlined />
          </span>
        </div>
      )}
    </Menu>
  )
  return (
    <div>
      <div className="desk_user_header">
        <div style={{ display: 'flex' }}>
          <div style={{ width: '42px' }}>
            <Avatar
              size={42}
              src={curState.profileImg}
              style={{
                color: '#fff',
                backgroundColor: '#4285f4',
                fontSize: 12,
                boxShadow: '0 3px 8px 0 rgba(66, 133, 244, 0.6)',
              }}
            >
              {curState.userName ? curState.userName.substr(-2, 2) : ''}
            </Avatar>
          </div>
          <div className="head_title">
            <span className="head_title_name">
              {curState.userTitle}
              <img src={curState.timeImgSrc} />
            </span>
            <span className="head_title_info">{curState.sympathy}</span>
          </div>
        </div>
        {!isFollow && (
          <div className="set_module_btn">
            <span
              className="edit_modal"
              onClick={e => {
                e.nativeEvent.stopImmediatePropagation()
                $store.dispatch({ type: 'SHOW_EDIT_MODAL', data: { visible: true } })
              }}
            ></span>
          </div>
        )}
      </div>
      <div className="desk_statistics_module">
        <div className="desk_statistics_module_item">
          <span className="statistics_title">个人获赞</span>
          <Dropdown
            arrow
            overlay={menu}
            trigger={['click']}
            visible={curState.dropvisible}
            onVisibleChange={(flag: boolean) => {
              setCurState({ dropvisible: flag })
            }}
          >
            <a
              className="ant-dropdown-link"
              onClick={() => setCurState({ dropvisible: true })}
              style={{ position: 'relative' }}
            >
              {thumbsInfo.thumbsUpNum}
              {thumbsInfo.newThumbsUpNum > 0 && <i>+{thumbsInfo.newThumbsUpNum}</i>}
              <DownOutlined />
            </a>
          </Dropdown>
        </div>
        <span className="l_line"></span>
        <div className="desk_statistics_module_item">
          <span className="statistics_title">收获人脉</span>
          <span className="statistics_num">{thumbsInfo.contactsNum}</span>
        </div>
        <span className="l_line"></span>
        <div className="desk_statistics_module_item">
          <span className="statistics_title">已入职(天)</span>
          <span className="statistics_num">{thumbsInfo.entryDays}</span>
        </div>
        <span className="l_line"></span>
        <div className="desk_statistics_module_item">
          <span className="statistics_title">完成任务</span>
          <span className="statistics_num">{thumbsInfo.finishTaskNum}</span>
        </div>
        <Modal
          title="个人获赞"
          centered={true}
          wrapClassName={'thumbs-detaile-modal'}
          maskClosable={false}
          visible={curState.visible}
          onOk={() => setCurState({ visible: false })}
          onCancel={() => setCurState({ visible: false })}
          width={850}
          bodyStyle={{ padding: '0px', height: '565px' }}
          footer={null}
        >
          <div className="r_modal">
            <List
              dataSource={curState.thumbsData}
              renderItem={(item: any, index: number) => (
                <List.Item
                  key={index}
                  onClick={() =>
                    setCurState({
                      reportVisble: true,
                      reportId: item.typeId,
                    })
                  }
                >
                  <div className={$c('show_fabulous_item', { readState: item.readState === 0 })}>
                    <div className="item_info">
                      <div className="headImg">
                        <Avatar
                          size={32}
                          src={newOrgId === -1 ? getOrgProfileById(item.belongId) : item.userProfile}
                          style={{
                            color: '#fff',
                            backgroundColor: '#4285f4',
                            fontSize: 12,
                            boxShadow: '0 3px 8px 0 rgba(66, 133, 244, 0.6)',
                          }}
                        >
                          {item.userName && item.userName.substr(-2, 2)}
                        </Avatar>
                        {item.readState === 0 && <i className="redSign"></i>}
                      </div>
                      <div style={{ marginLeft: '8px' }}>
                        <div>
                          {item.userName}
                          <span className="fabulousIcon"></span>
                          <span style={{ color: '#4285F4' }}>点赞</span>
                        </div>
                        <div className="fabulousTime">{item.thumbsUpTime}</div>
                      </div>
                    </div>
                    <div className={$c('item_title', { thumWhite: item.readState === 0 })}>
                      <span className="fabulousTitle">
                        【{FabulousType[item.type]}】
                        {item.content.length > 30 ? item.content.substr(0, 30) + '...' : item.content}
                      </span>
                      <div className="item_msg">
                        <span className="fabulousTime sourceTime">{item.typeTime}</span>
                        <span className="fabulousSource">来源于：{item.belongName}</span>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            >
              {curState.loading && curState.hasMore && (
                <div className="example">
                  <Spin />
                </div>
              )}
            </List>
          </div>

          {curState.totalPages > 0 && (
            <div className="thum_pagination">
              <Pagination
                current={curState.pageNo + 1}
                pageSize={curState.pageSize}
                showSizeChanger
                total={curState.totalElements}
                pageSizeOptions={['5', '10', '20', '30', '50', '100']}
                onChange={(page, pageSize) => thumPageChange(page, pageSize)}
              />
            </div>
          )}
          {curState.reportVisble && (
            <ReportDetails
              param={{ reportId: curState.reportId, isVisible: curState.reportVisble }}
              setvisible={(state: any) => setCurState({ reportVisble: state })}
            />
          )}
        </Modal>
      </div>
    </div>
  )
}

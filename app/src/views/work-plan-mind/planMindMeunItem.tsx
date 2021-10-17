import React, { useEffect, useState, useRef } from 'react'
import {
  getQuerySynergy,
  getfindWaitPlanList,
  getfindShareList,
  btnOptHandleApi,
  btnseventPlanSaveApi,
  MindMenuClickApi,
} from './getData'
import moment from 'moment'
import { Avatar, Spin, Modal, message, Dropdown, Button, Menu, Tooltip } from 'antd'
import { ShareToRoomModal } from '../workplan/WorkPlanModal'
import NoneData from '@/src/components/none-data/none-data'
import MovePlan from './movePlan'
import { useSelector } from 'react-redux'
import { DownOutlined } from '@ant-design/icons'
import TextArea from 'antd/lib/input/TextArea'
import InfiniteScroll from 'react-infinite-scroller'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import { shareToUserSave, findShareUsers } from '../workplan/WorkPlanOpt'
import CreatTask from '../task/creatTask/creatTask'
import { getReadInquire } from './getData'
import { refgetReadDatasFn } from './WorkPlanMindRightMeun'
// import { planCount } from './work-plan-mind'
import { ipcRenderer } from 'electron'
import { CreateTaskModal } from '../task/creatTask/createTaskModal'
let isinit = false
const PlanMindMeunItem = (props: any) => {
  const { nowUserId, nowUser, nowAccount, loginToken, selectTeamId } = $store.getState()
  //打开创建任务
  const [opencreattask, setOpencreattask] = useState(false)
  const [tsakid, setTsakid] = useState<any>('')
  //分享到工作组弹窗
  const [shareToRoomParam, setShareToRoomParam] = useState<any>({})
  //选择成员
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  //列表数据
  const [dataList, setdataList] = useState([])
  //待办计划数据
  const [WaitPlandataList, setWaitPlandataList] = useState([])
  const [loading, setLoading] = useState(true)
  //滚动加载初始化加载modal
  const [hasMore, setHasMore] = useState(true)
  //记录上一次点击的类型
  const [listtype, setListtype] = useState(0)
  //分页相关信息
  //当前页数
  const [listPageNo, setListPageNo] = useState({
    synergyF: 0, //发起的协同
    synergyS: 0, //收到的协同
    backlog: 0, //待办计划
    shareS: 0, //收到的共享
    shareF: 0, //发起的共享
  })
  //总页数
  const [totalPages, setTotalPages] = useState({
    synergyF: 0,
    synergyS: 0,
    backlog: 0,
    shareS: 0,
    shareF: 0,
  })
  //用于刷新的方法 true:刷新
  const isrefresh = useSelector(
    (store: StoreStates) => store.refreshFn.mindMapMeun && store.refreshFn.mindMapMeun.type
  )
  //移动规划弹窗
  const [moveplanshow, setMoveplanshow] = useState({
    type: false,
    id: '',
    datas: {},
  })
  //拒绝理由弹窗
  const [refuse, setRefuseOk] = useState(false)
  //拒绝理由文本
  const [refusetext, setRefusetext] = useState('')
  //操作按钮类型
  const [operation, setOperation] = useState('')
  //操作按钮数据
  const [operationdatas, setOperationdatas] = useState({
    id: '',
    synergyId: '',
    teamId: '',
  })
  //协同状态
  const [synergystatus, setSynergystatus] = useState(0)
  //标题
  const [title, setTitle] = useState('')
  //下拉菜单文字
  const [menuTitle, setMenuTitle] = useState('全部')
  // 创建任务弹框组件
  const createTaskRef = useRef<any>({})
  //初始化
  useEffect(() => {
    if (props.info.time != '') {
      setdataList([])
      setMenuTitle('全部')
      setSynergystatus(0)
      information('Pages')
      contentList('init')
      isinit = true
    }
  }, [props.info.time, props.info.type])
  //刷新
  useEffect(() => {
    //界面初始化状态
    information()
    contentList()
  }, [isrefresh == true, listPageNo])
  //清除界面相关数据
  const information = (types?: string) => {
    setListtype(props.info.type)
    if (props.info.type != listtype || types == 'Pages') {
      //初始化滚动
      setListPageNo({
        synergyF: 0, //发起的协同
        synergyS: 0, //收到的协同
        backlog: 0, //待办计划
        shareS: 0, //收到的共享
        shareF: 0, //发起的共享
      })
      setdataList([])
      setHasMore(true)
    }
    //清除刷新脑图
    const refreshFn = $store.getState().refreshFn
    $store.dispatch({
      type: 'REFRESHFN',
      data: {
        ...refreshFn,
        mindMapMeun: {
          type: false,
          datas: null,
        },
      },
    })
    //更新title
    setTitle(props.info.name)
  }
  //设置列表数据
  const contentList = (types?: string) => {
    setLoading(true)
    //外层消息更新
    refgetReadDatasFn()
    if (props.info.type == 0 || props.info.type == 1) {
      //发起的协同1、收到的协同0
      const findType = props.info.type == 0 ? 1 : 0
      const params = {
        status: synergystatus, //状态：0所有 1待支持、2已拒绝、21已忽略、3已接受
        sourceType: findType, //findType 0发起的  1收到的
        pageTime: '',
        pageSize: 100,
        operateUser: $store.getState().nowUserId,
        operateAccount: $store.getState().nowAccount,
      }
      //收到的协同
      getQuerySynergy(params).then((list: any) => {
        const dataList = list.dataList
        setLoading(false)
        setdataList(dataList)
      })
    } else if (props.info.type == 2) {
      //待办计划2
      const params = {
        pageNo: types == 'init' ? 0 : listPageNo.backlog,
        pageSize: 10,
        userId: $store.getState().nowUserId,
      }
      getfindWaitPlanList(params).then((list: any) => {
        const dataLists = list.data.content
        setTotalPages({ ...totalPages, backlog: list.data.totalPages })
        setLoading(false)
        if (isinit) {
          setdataList(dataLists)
        } else {
          setdataList(dataList.concat(dataLists))
        }
      })
    } else if (props.info.type == 3 || props.info.type == 4) {
      //收到的共享3 发起的共享4
      const findType = props.info.type == 3 ? 1 : 0
      const params = {
        sourceType: findType,
        pageTime: '',
        pageSize: 100,
        operateUser: $store.getState().nowUserId,
        operateAccount: $store.getState().nowAccount,
      }
      getfindShareList(params).then((list: any) => {
        const dataList = list.dataList
        setLoading(false)
        setdataList(dataList)
      })
    } else {
      setLoading(false)
      setdataList([])
    }
  }

  //设置html节点
  const SetTypeHtml = (Param: any) => {
    if (Param.type == 0 || Param.type == 1) {
      //发起的协同、收到的协同
      return (
        <div className="contentList">
          {Param.datas && Param.datas.length !== 0 ? (
            querySynergyHtml(Param.datas, Param.type)
          ) : (
            <NoneData
              className={`threePosition`}
              imgSrc={
                Param.type == 1
                  ? $tools.asAssetsPath(`/images/noData/plan_right_send.png`)
                  : $tools.asAssetsPath(`/images/noData/plan_right_recive.png`)
              }
              showTxt={props.type == 1 ? '怎么还不邀请小伙伴来协同你呢' : '还没有收到协同哦'}
              containerStyle={{ zIndex: 0 }}
              textStyle={{ fontSize: 16 }}
            />
          )}
        </div>
      )
    } else if (props.info.type == 2) {
      //待办计划
      return (
        <div className="contentList">
          <InfiniteScroll
            initialLoad={false}
            pageStart={0}
            hasMore={!loading && hasMore}
            loadMore={handleInfiniteOnLoad}
            useWindow={false}
            className="contentListScroll"
          >
            {Param.datas.length !== 0 ? (
              findWaitHtml(Param.datas)
            ) : (
              <NoneData
                className={`threePosition`}
                imgSrc={$tools.asAssetsPath(`/images/noData/plan_unprepair.png`)}
                showTxt={'怎么还不邀请小伙伴来协同你呢'}
                containerStyle={{ zIndex: 0 }}
                textStyle={{ fontSize: 16 }}
              />
            )}
          </InfiniteScroll>
        </div>
      )
    } else if (props.info.type == 3 || props.info.type == 4) {
      //收到的共享、发出的共享
      return (
        <div className="contentList">
          {Param.datas.length !== 0 ? (
            findShareList(Param.datas, Param.type)
          ) : (
            <NoneData
              className={`threePosition`}
              imgSrc={
                props.info.type == 3
                  ? $tools.asAssetsPath(`/images/noData/plan_recshare.png`)
                  : $tools.asAssetsPath(`/images/noData/plan_sendshare.png`)
              }
              showTxt={'还没有收到共享哦'}
              containerStyle={{ zIndex: 0 }}
              textStyle={{ fontSize: 16 }}
            />
          )}
        </div>
      )
    } else {
      return <NoneData />
    }
  }
  //收到的协同0、发起的协同1
  const querySynergyHtml = (datas: any, type: any) => {
    const findType = type == 0 ? 1 : 0
    return datas.map((item: any, index: number) => {
      let percentHtm = null //进度
      const status = item.status
      // 拒绝理由
      let refuseReason = null
      // 催办图标
      let urgeIcon = null
      // 会议图标
      let meetIcon = null
      // 沟通图标
      let chatIcon = null
      // 握手图标
      let handsonIcon = ''
      // 是否置灰不可用
      let disable = ''
      let statusTxt = '',
        statusClass = ''
      if (status == 2) {
        statusTxt = '已拒绝'
        statusClass = 'no_disb'
        percentHtm = ''
        disable = 'disable'
        if (findType == 0) {
          //发起的协同被拒绝显示红色
          statusClass = 'refuse_disb'
        }
      } else if (status == 21) {
        statusTxt = '已忽略'
        statusClass = 'no_disb'
        percentHtm = ''
      } else if (status == 3) {
        statusTxt = '已接受'
        statusClass = 'finish'
        handsonIcon = 'accept'
      } else {
        //status=1：待支持
        statusTxt = '待支持'
        statusClass = 'wait_disb'
        percentHtm = ''
      }
      //发起的协同 待支持需要催一下图标
      if (findType == 0 && status == 1) {
        urgeIcon = (
          <Tooltip title="提醒Ta赶紧协同我">
            <i
              className="img_icon urge_icon"
              onClick={() => {
                MindMenuClick('催一下', item)
              }}
            ></i>
          </Tooltip>
        )
      }
      //拒绝理由
      if (status == 2 || status == 21) {
        refuseReason = (
          <div className="refuse_reason">
            拒绝理由：
            {item.excuse || '无'}
          </div>
        )
      }
      // 会议图标
      if (item.meetings) {
        meetIcon = (
          <i
            className="img_icon look_meet_icon"
            onClick={() => {
              null
            }}
          ></i>
        )
      }
      // 发起聊天图标
      if (item.themes) {
        chatIcon = <i className="img_icon look_chat_icon"></i>
      }
      let rigFrom = null
      // 收到的协同展示来源信息
      let fromTxt = null
      let noshow = 'noshow'
      if (findType == 1) {
        noshow = item.isRead ? 'noshow' : ''
        // 收到的协同，右侧展示来源信息
        const createTime = moment(item.createTime).format('YYYY/MM/DD HH:mm')
        rigFrom = (
          <div className="row_top_rig f-right">
            <span className="cooper_time">{createTime}</span>
            <span className="from_txt">来自</span>
            <span className="from_msg my_ellipsis" style={createTime?{maxWidth:'40px'}:{}}>{item.username || ''}</span>
            <i className="img_icon chat_icon" data-name="发起聊天"></i>
          </div>
        )
      } else {
        // 发起的协同，已拒绝状态，右侧来源信息处显示忽略按钮
        if (status == 2) {
          fromTxt = (
            <span
              className="cooper_ignore"
              data-name="忽略"
              onClick={(e: any) => {
                e.stopPropagation()
                btnsevent('ignore', item)
              }}
            >
              忽略
            </span>
          )
        }
        rigFrom = <div className="row_top_rig f-right">{fromTxt}</div>
      }
      let mainId = item.mainId
      if (mainId == undefined) {
        mainId = ''
      }
      // 企业名
      let cmyInfoRow = null
      if (item.teamName) {
        cmyInfoRow = <div className="teaminfo_row">{item.teamName || ''}</div>
      }
      // 列表按钮
      const titName = findType == 1 ? 'acceptCooperate' : 'sendCooperate'
      const listBtns = getListBtns(titName, item)
      const getUserName = findType == 1 ? item.username : item.username
      const profile = item.userProfile
      //节点html
      return (
        <div
          key={index}
          className={`contItem cooperateItem ${disable} ${statusClass}`}
          data-id={item.id || ''}
          data-synid={item.synergyId || ''}
          data-mainid={mainId}
          data-status={status}
          data-genrestatus={item.taskType}
          onMouseDown={(e: any) => {
            if (e.button == 2 && findType == 0) {
              rigMenuHtm(e, 'sendCooperate', item)
            }
          }}
        >
          <div className="contItemIn">
            <div className="row_top">
              <span className={`distribute_sign ${statusClass}`}>{statusTxt}</span>
              {rigFrom}
            </div>
            <div className="cont_row ver_center space_between">
              <div className="cont_left flex ver_center">
                <div className="userHeadBox relative">
                  <span className={`img_icon cooper_status_icon ${handsonIcon}`}></span>
                  <div className="comUserHead synergy_head flex_shrink_0">
                    <Avatar className="oa-avatar" src={profile} size={34}>
                      {getUserName ? getUserName.substr(-2, 2) : '?'}
                    </Avatar>
                  </div>
                </div>
                <div className="synergyContLeft">
                  <div className="cont_txt_box flex ver_center">
                    <span className={`red_dot ${noshow}`}></span>
                    <span className="cont_name_txt">{item.name || ''}</span>
                    {urgeIcon}
                    {meetIcon}
                    {chatIcon}
                  </div>
                  <div className="time_row">
                    <span className="team_name">{item.ascriptionName || ''}</span>
                    <span className="cooper_time">{moment(item.endTime).format('MM/DD HH:mm')}</span>
                    <span className="cooper_count_time">
                      <span className="">{item.day || 0}</span>天
                    </span>
                  </div>
                </div>
              </div>
              {percentHtm}
            </div>
            {cmyInfoRow}
            {refuseReason}
            {listBtns}
          </div>
        </div>
      )
    })
  }
  //待办计划
  const findWaitHtml = (datas: any) => {
    return datas.map((item: any, index: number) => {
      const endTime = moment(item.endTime).format('MM/DD HH:mm')
      const genreStatus = item.taskType
      let genreClass = null
      let genreText = null
      const percentHtm = null
      if (genreStatus == 0) {
        //0目标、1临时 、2职能、3项目
        genreText = '任务'
        genreClass = 'wait_mb'
      } else if (genreStatus == 1) {
        genreText = '项目'
        genreClass = 'wait_xm'
      }
      let cmyInfoRow = null
      if (item.teamName) {
        cmyInfoRow = <div className="teaminfo_row">{item.teamName || ''}</div>
      }
      return (
        <div
          key={index}
          className={`contItem waitPlanItem dragItem ${genreClass}`}
          data-id={item.id || ''}
          data-teamid={item.ascriptionId}
          data-teamname={item.nodeText}
          data-property={item.property}
          data-genrestatus={genreStatus}
          data-ascriptiontype={item.ascriptionType}
          data-name={item.name}
        >
          <div className="contItemIn">
            <div className="row_top">
              <span className={`distribute_sign ${genreClass}`}>{genreText}</span>
            </div>
            <div className="cont_row ver_center space_between">
              <div className="cont_left flex ver_center">
                <div className="userHeadBox relative">
                  <div className="comUserHead synergy_head flex_shrink_0">
                    <Avatar className="oa-avatar" src={item.liableUserProfile} size={34}>
                      {item.liableUsername ? item.liableUsername.substr(-2, 2) : '?'}
                    </Avatar>
                  </div>
                </div>
                <div className="synergyContLeft">
                  <div className="cont_txt_box flex ver_center">
                    <span className="cont_name_txt">{item.name}</span>
                  </div>
                  <div className="time_row">
                    <span className="team_name">{item.nodeText || ''}</span>
                    <span className="cooper_time">{endTime}</span>
                    <span className="cooper_count_time">
                      <span className="">{item.day || 0}</span>天
                    </span>
                  </div>
                </div>
              </div>
              {percentHtm}
            </div>
            {cmyInfoRow}
            <ul className="operate_row flex ver_center ">
              <li
                className="optBtnItem join_project"
                data-name="加入规划"
                onClick={(e: any) => {
                  e.stopPropagation()
                  btnsevent('join', item)
                }}
              >
                加入规划
              </li>
              <li
                className="optBtnItem transfer_project"
                data-name="转为规划"
                onClick={(e: any) => {
                  e.stopPropagation()
                  btnsevent('conversion', item)
                }}
              >
                转为规划
              </li>
            </ul>
          </div>
        </div>
      )
    })
  }
  //收到的共享3、发出的共享4
  const findShareList = (datas: any, type: any) => {
    const findType = type
    return datas.map((item: any, index: number) => {
      let fromTxt = '共享给'
      if (findType == 3) {
        fromTxt = '来自'
      }
      let statusTxt = '',
        statusClass = ''
      const status = item.status
      if (status == 3) {
        statusTxt = '部分派发'
        statusClass = 'yes_disb'
      } else if (status == 4) {
        statusTxt = '已派发'
        statusClass = 'yes_disb'
      } else if (status == 2) {
        statusTxt = '审核中'
        statusClass = 'review'
      } else if (status == 5) {
        statusTxt = '已完成'
        statusClass = 'finish'
      } else {
        statusTxt = '草稿'
        statusClass = 'no_disb'
      }
      let noshow = 'noshow'
      if (findType == 3) {
        noshow = item.isRead ? 'noshow' : ''
      }
      // 企业名
      let cmyInfoRow = null
      if (item.teamName) {
        cmyInfoRow = <div className="teaminfo_row">{item.teamName || ''}</div>
      }
      return (
        <div
          key={index}
          className="contItem shareItem"
          data-id={item.id || ''}
          data-shareid={item.shareId || ''}
          data-mainid={item.mainId || ''}
          data-teamname={item.teamName}
          data-teamid={item.teamId}
          onClick={() => {
            return null
          }}
          onMouseDown={(e: any) => {
            if (e.button == 2 && findType == 4) {
              rigMenuHtm(e, 'sendShare', item)
            }
          }}
        >
          <div
            className="contItemIn"
            onClick={(e: any) => {
              e.stopPropagation()
              btnsevent('shareItme', item)
            }}
          >
            <div className="row_top">
              <span className={`distribute_sign ${statusClass}`}>{statusTxt}</span>
              <div className="row_top_rig f-right">
                {fromTxt}
                <span className="from_msg f-right my_ellipsis">{item.shareTypeName || ''}</span>
              </div>
            </div>
            <div className="cont_row">
              <span className={`red_dot ${noshow}`}></span>
              <span className={`user_head ${item.liableUsername ? '' : 'noshow'}`}>
                <Avatar className="oa-avatar" src={item.liableUserProfile} size={34}>
                  {item.liableUsername ? item.liableUsername.substr(-2, 2) : '?'}
                </Avatar>
              </span>
              <span className="cont_name_txt">{item.name || ''}</span>
            </div>
            <div className="progress_box">
              <div className="progress_bar">
                <span className="progress_bar_in" style={{ width: `${item.process || 0}%` }}></span>
              </div>
              <span className="progress_num">{item.process || 0}%</span>
            </div>
            {cmyInfoRow}
          </div>
        </div>
      )
    })
  }
  //列表按钮渲染
  const getListBtns = (titName: string, itemData: any) => {
    let content = null
    const status = itemData.status || ''
    if (titName == 'acceptCooperate') {
      //收到的协同
      if (status == 1) {
        //待支持
        content = (
          <ul className={`operate_row flex ver_center ${itemData ? '' : 'noshow'}`}>
            <li
              className="optBtnItem"
              data-name="支持"
              onClick={(e: any) => {
                e.stopPropagation()
                btnsevent('move', itemData)
              }}
            >
              支持
            </li>
            <li
              className="optBtnItem"
              data-name="发起聊天"
              onClick={(e: any) => {
                e.stopPropagation()
                openMucRoom(itemData)
              }}
            >
              发起聊天
            </li>
            <li
              className="optBtnItem"
              data-name="拒绝"
              onClick={(e: any) => {
                e.stopPropagation()
                btnsevent('refuse', itemData)
              }}
            >
              拒绝
            </li>
          </ul>
        )
      } else if (status == 3) {
        //已接受
        content = (
          <ul className={`operate_row flex ver_center ${itemData ? '' : 'noshow'}`}>
            <li
              className="optBtnItem"
              data-name="发起聊天"
              onClick={(e: any) => {
                e.stopPropagation()
                openMucRoom(itemData)
              }}
            >
              发起聊天
            </li>
            <li
              className="optBtnItem"
              data-name="发起会议"
              onClick={e => {
                e.stopPropagation()
                openMeeting()
              }}
            >
              发起会议
            </li>
          </ul>
        )
      }
    } else if (titName == 'sendCooperate') {
      //发出的协同
      if (status == 1) {
        //待支持
        content = (
          <ul className={`operate_row flex ver_center ${itemData ? '' : 'noshow'}`}>
            <li
              className="optBtnItem"
              data-name="发起聊天"
              onClick={e => {
                e.stopPropagation()
                openMucRoom(itemData)
              }}
            >
              发起聊天
            </li>
            <li
              className="optBtnItem"
              data-name="发起会议"
              onClick={e => {
                e.stopPropagation()
                openMeeting()
              }}
            >
              发起会议
            </li>
            <li
              className="optBtnItem"
              data-name="撤回派发"
              onClick={(e: any) => {
                btnsevent('synergy', itemData)
              }}
            >
              撤回协同
            </li>
          </ul>
        )
      } else if (status == 2) {
        //已拒绝
        content = (
          <ul className={`operate_row flex ver_center ${itemData ? '' : 'noshow'}`}>
            <li
              className="optBtnItem"
              data-name="发起聊天"
              onClick={(e: any) => {
                e.stopPropagation()
                openMucRoom(itemData)
              }}
            >
              发起聊天
            </li>
            <li
              className="optBtnItem"
              data-name="发起会议"
              onClick={e => {
                e.stopPropagation()
                openMeeting()
              }}
            >
              发起会议
            </li>
            <li
              className="optBtnItem"
              data-name="重新派发"
              onClick={(e: any) => {
                btnsevent('anewpayout', itemData)
              }}
            >
              重新派发
            </li>
          </ul>
        )
      } else if (status == 3) {
        //已接受
        content = (
          <ul className={`operate_row flex ver_center ${itemData ? '' : 'noshow'}`}>
            <li className="optBtnItem" data-name="发起聊天">
              发起聊天
            </li>
            <li
              className="optBtnItem"
              data-name="发起会议"
              onClick={e => {
                e.stopPropagation()
                openMeeting()
              }}
            >
              发起会议
            </li>
          </ul>
        )
      }
    }
    return content
  }
  //按钮事件处理
  const btnsevent = (type: string, itemData: any) => {
    if (type == 'move') {
      setOperation('move')
      //协同加入(移动规划)
      setMoveplanshow({
        type: true,
        id: itemData.id,
        datas: {
          fromCode: 1,
          fromId: itemData.synergyId, //协同id
          findId: itemData.id,
          fromName: itemData.name,
          fromTypeId: itemData.typeId,
          fromMainId: itemData.mainId,
          teamId: itemData.teamId,
          teamName: itemData.teamName,
          genreStatus: itemData.taskType,
        },
      })
      readHandle({
        type: 0,
        id: itemData.synergyId,
      })
      $('.WorkPlanMindRightMeun').addClass('hide_animate')
    } else if (type == 'join') {
      setOperation('join')
      //加入规划
      setMoveplanshow({
        type: true,
        id: itemData.id,
        datas: {
          fromCode: 5,
          fromId: '', //协同id
          findId: '',
          fromName: itemData.name,
          fromTypeId: itemData.id,
          taskType: 1,
          fromMainId: '',
          ascriptionType: itemData.ascriptionType,
          genreStatus: itemData.taskType,
        },
      })
      $('.WorkPlanMindRightMeun').addClass('hide_animate')
    } else if (type == 'refuse') {
      //拒绝
      setOperation('refuse')
      setRefuseOk(true)
      setOperationdatas({
        id: itemData.id,
        synergyId: itemData.synergyId,
        teamId: itemData.teamId,
      })
    } else if (type == 'synergy') {
      //撤回协同
      setOperation('synergy')
      setRefuseOk(true)
      setOperationdatas({
        id: itemData.id,
        synergyId: itemData.synergyId,
        teamId: itemData.teamId,
      })
    } else if (type == 'anewpayout' || type == 'ignore') {
      //重新派发 忽略
      setOperation(type)
      setOperationdatas({
        id: itemData.id,
        synergyId: itemData.synergyId,
        teamId: itemData.teamId,
      })
      if (type == 'anewpayout') {
        refuseOk(1)
      } else if (type == 'ignore') {
        refuseOk(21)
      }
    } else if (type == 'conversion') {
      //转为规划
      setOperation('conversion')
      const url = '/task/work/plan/becomePlan'
      const params = {
        id: itemData.id,
        operateUser: $store.getState().nowUserId,
      }
      btnseventPlanSaveApi(params, url).then((resDatas: any) => {
        const { fromPlanTotype } = $store.getState()
        $store.dispatch({
          type: 'MINDMAPDATA',
          data: {
            id: resDatas.data,
            typeId: itemData.id,
            name: itemData.name,
            teamName: itemData.teamName,
            teamId: itemData.teamId,
            status: 1,
            mainId: '',
            type: 2,
          },
        })
        $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
        $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 })
        $tools.createWindow('workplanMind')
        //刷新右侧数据
        const refreshFn = $store.getState().refreshFn
        //外层消息更新
        refgetReadDatasFn()
        $store.dispatch({
          type: 'REFRESHFN',
          data: {
            ...refreshFn,
            mindMapMeun: {
              type: true,
              datas: null,
            },
          },
        })
        // 刷新规划列表
        ipcRenderer.send('refresh_plan_list_main')
      })
      $('.WorkPlanMindRightMeun').addClass('hide_animate')
    } else if (type == 'shareItme') {
      //共享
      setOperation('shareItme')
      const { fromPlanTotype } = $store.getState()
      $store.dispatch({
        type: 'MINDMAPDATA',
        data: {
          id: itemData.id,
          typeId: itemData.typeId,
          name: itemData.name,
          teamName: itemData.teamName,
          teamId: itemData.teamId,
          status: itemData.status,
          mainId: '',
          type: itemData.type,
        },
      })
      $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 })
      $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
      $tools.createWindow('workplanMind')
      $('.WorkPlanMindRightMeun').addClass('hide_animate')
      if (itemData.isRead == 0) {
        readHandle({
          type: 1,
          id: itemData.shareId,
        })
      }
    } else if (type == 'remove') {
      //删除
      setOperation(type)
      setOperationdatas({
        id: itemData.id,
        synergyId: itemData.synergyId,
        teamId: itemData.teamId,
      })
      refuseOk(4)
    }
  }
  //读取消息
  const readHandle = (infoObj: any) => {
    let url = ''
    let param = {}
    if (infoObj.type == 0) {
      //协同
      url = '/task/work/plan/readSynergy'
      //组装参数
      param = {
        synergyId: infoObj.id,
        userId: $store.getState().nowUserId,
      }
    } else if (infoObj.type == 1) {
      //共享计划
      url = '/task/work/plan/readShare'
      param = {
        shareId: infoObj.id,
        userId: $store.getState().nowUserId,
      }
    } else if (infoObj.type == 2) {
      //首页计划列表
      url = '/task/work/plan/readWorkPlan'
      param = {
        id: infoObj.id,
        userId: $store.getState().nowUserId,
      }
    }
    getReadInquire(param, url).then((resdata: any) => {
      //外层消息更新
      refgetReadDatasFn()
      // 更新左侧导航工作计划统计
      // planCount()
    })
  }
  //按钮操作集合处理
  // optType 操作：1重新派发、2拒绝、21忽略、3接受、4删除、5撤回
  const refuseOk = (types: any) => {
    setRefuseOk(false)
    let optType: number | null = null
    let excuseText = null
    if (types) {
      //重新派发、忽略
      optType = types
      excuseText = undefined
    } else {
      if (operation == 'refuse') {
        //拒绝
        optType = 2
        excuseText = refusetext
      } else if (operation == 'synergy') {
        //撤回协同
        optType = 5
        excuseText = undefined
      }
    }
    const url = '/task/work/plan/setSynergy'
    const params = {
      id: operationdatas.id, //节点id
      synergyId: operationdatas.synergyId || '', //协同id
      operation: optType,
      operateUser: $store.getState().nowUserId,
      operateUserName: $store.getState().nowUser,
      teamId: operationdatas.teamId,
      excuse: excuseText,
    }
    //请求接口
    btnOptHandleApi(params, url).then(() => {
      let msg = ''
      if (optType == 1) {
        msg = '已重新派发'
      } else if (optType == 2) {
        msg = '已拒绝'
      } else if (optType == 21) {
        msg = '已忽略'
      } else if (optType == 3) {
        msg = '已接受协同'
      } else if (optType == 4) {
        msg = '已删除'
      } else if (optType == 5) {
        msg = '已撤回'
      }
      message.success(msg)
      //刷新右侧数据
      const refreshFn = $store.getState().refreshFn
      $store.dispatch({
        type: 'REFRESHFN',
        data: {
          ...refreshFn,
          mindMapMeun: {
            type: true,
            datas: null,
          },
        },
      })
    })
  }
  //右键事件
  const MindMenuClick = (types: any, item: any) => {
    if (types == '催一下') {
      const getId = item.synergyId || '' //协同id
      const param = {
        synergyId: getId,
        operateUser: nowUserId,
        operateUserName: nowUser,
      }
      const url = '/task/work/plan/sendNoticeBySynergy'
      MindMenuClickApi(param, url).then((desdata: any) => {
        if (desdata.returnCode == -1) {
          message.error(desdata.returnMessage)
          return
        } else {
          message.success('提醒成功')
        }
        //刷新右侧数据
        const refreshFn = $store.getState().refreshFn
        $store.dispatch({
          type: 'REFRESHFN',
          data: {
            ...refreshFn,
            mindMapMeun: {
              type: true,
              datas: null,
            },
          },
        })
      })
    } else if (types == '取消共享') {
      //取消共享
      const param = {
        shareId: item.shareId,
        id: item.id,
        sourceType: 0,
        operateAccount: nowAccount,
        operateUser: nowUserId,
        name: item.name,
      }
      const url = '/task/work/plan/cancelShare'
      MindMenuClickApi(param, url).then((desdata: any) => {
        if (desdata.returnCode == -1) {
          message.error(desdata.returnMessage)
          return
        } else {
          message.success('已撤回')
        }
        //刷新右侧数据
        const refreshFn = $store.getState().refreshFn
        $store.dispatch({
          type: 'REFRESHFN',
          data: {
            ...refreshFn,
            mindMapMeun: {
              type: true,
              datas: null,
            },
          },
        })
      })
    }
  }
  //收到的协同下拉筛选
  const handleMenuClick = (props: any) => {
    setSynergystatus(props.key)
    const mapArr = ['全部', '待支持', '已拒绝', '已接受']
    if (props.key == 21) {
      setMenuTitle('已忽略')
    } else {
      setMenuTitle(mapArr[props.key])
    }
    //刷新右侧数据
    const refreshFn = $store.getState().refreshFn
    $store.dispatch({
      type: 'REFRESHFN',
      data: {
        ...refreshFn,
        mindMapMeun: {
          type: true,
          datas: null,
        },
      },
    })
  }

  //打开聊天窗口
  const openMucRoom = (data: any) => {
    const { selectItem } = $store.getState()
    ipcRenderer.send('show_commuciate_muc', [
      selectItem,
      {
        id: data.userId,
        username: data.username,
        account: data.userAccount,
      },
    ])
  }

  //打开会议
  const openMeeting = () => {
    message.info('敬请期待')
  }
  //滚动加载
  const handleInfiniteOnLoad = () => {
    setLoading(true)
    if (props.info.type == 2) {
      //待办计划
      if (listPageNo.backlog + 1 >= totalPages.backlog) {
        setLoading(false)
        setHasMore(false)
        return
      }
      isinit = false
      setListPageNo({ ...listPageNo, backlog: listPageNo.backlog + 1 })
    }
  }
  //右键操作
  const rigMenuHtm = (e: any, titName: any, itemData: any) => {
    e.stopPropagation()
    jQuery('.mindMenuList').show()
    let _pageX = e.pageX
    if (document.body.clientWidth - e.pageX <= 100) {
      _pageX = e.pageX - 110
    }
    setPos({
      left: _pageX,
      top: e.pageY,
      items: itemData,
      types: titName,
    })
    //点击空白处
    jQuery('.WorkPlanMindRightMeun')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.mindMenuList') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          jQuery('.mindMenuList').hide()
        }
      })
  }
  //共享到人
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const datas = dataList[0]
    if (!datas) {
      return
    }
    const { sourceItem, quoteMsg, shareFormType } = $store.getState().planModalObj || {}
    const typeIds: any = []
    dataList.map((item: any) => {
      typeIds.push(item.curId)
    })
    //共享到人-------------------
    if (shareFormType == 'mind-map') {
      shareToUserSave({
        id: sourceItem.id, //节点id
        type: 1, //类型：0个人 1项目组
        typeIds: typeIds, //类型id
        name: sourceItem.name,
        mainId: sourceItem.mainId,
        typeId: sourceItem.typeId,
      })
    }
  }

  let setPos: any = null
  //右键菜单
  const MindMenuList = () => {
    const [rigMenu, setrigMenu] = useState<any>({
      left: '',
      top: '',
      items: {},
      types: '',
    })
    const types = rigMenu.types
    const itemss = rigMenu.items
    const status = rigMenu.items.status || ''
    const shareType = rigMenu.items.shareType || 0
    const HtmlList: any = []
    setPos = (rigMenus: any) => {
      setrigMenu(rigMenus)
    }
    if (types == 'sendCooperate') {
      //发起的协同
      if (status == 1) {
        //待支持
        HtmlList.push(
          <ul key={status}>
            <li className="optBtnItem" data-name="发起会议">
              发起会议
            </li>
            <li
              className="optBtnItem"
              data-name="催一下"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                MindMenuClick('催一下', itemss)
              }}
            >
              催一下
            </li>
            <li
              className="optBtnItem"
              data-name="编辑"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                setTsakid(itemss.typeId)
                openCreateTask()
              }}
            >
              编辑
            </li>
            <li
              className="optBtnItem"
              data-name="撤回派发"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                btnsevent('synergy', itemss)
              }}
            >
              撤回派发
            </li>
          </ul>
        )
      } else if (status == 2) {
        //已拒绝
        HtmlList.push(
          <ul key={status}>
            <li className="optBtnItem" data-name="发起会议">
              发起会议
            </li>
            <li
              className="optBtnItem"
              data-name="编辑"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                setTsakid(itemss.typeId)
                openCreateTask()
              }}
            >
              编辑
            </li>
            <li
              className="optBtnItem"
              data-name="重新派发"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                btnsevent('anewpayout', itemss)
              }}
            >
              重新派发
            </li>
            <li
              className="optBtnItem"
              data-name="删除"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                btnsevent('remove', itemss)
              }}
            >
              删除
            </li>
          </ul>
        )
      } else if (status == 21) {
        //已忽略
        HtmlList.push(
          <ul key={status}>
            <li
              className="optBtnItem"
              data-name="删除"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                btnsevent('remove', itemss)
              }}
            >
              删除
            </li>
          </ul>
        )
      } else if (status == 3) {
        //已接受
        HtmlList.push(
          <ul key={status}>
            <li className="optBtnItem" data-name="发起会议">
              发起会议
            </li>
          </ul>
        )
      }
    } else if (types == 'sendShare') {
      //发起的共享
      if (shareType == 1) {
        HtmlList.push(
          <ul key={shareType}>
            <li
              className="optBtnItem"
              data-name="查看共享项目组"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                $store.dispatch({
                  type: 'WORKPLAN_MODAL',
                  data: {
                    sourceItem: itemss || {},
                    shareFormType: 'mind-map',
                  },
                })
                setShareToRoomParam({
                  shareToRoomModalShow: true,
                  titName: '共享任务',
                  onOk: () => {
                    message.success('共享成功')
                  },
                })
              }}
            >
              查看共享项目组
            </li>
            <li
              className="optBtnItem"
              data-name="取消共享"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                MindMenuClick('取消共享', itemss)
              }}
            >
              取消共享
            </li>
          </ul>
        )
      } else {
        HtmlList.push(
          <ul key={shareType}>
            <li
              className="optBtnItem"
              data-name="查看共享人"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                $store.dispatch({
                  type: 'WORKPLAN_MODAL',
                  data: {
                    sourceItem: itemss || {},
                    shareFormType: 'mind-map',
                  },
                })
                findShareUsers({
                  id: itemss.id,
                }).then((dataList: any) => {
                  const newList: any = []
                  dataList.map((item: any) => {
                    const obj = {
                      curId: item.id,
                      curName: item.name,
                      curType: 0,
                      account: item.account || '',
                      profile: item.profile,
                    }
                    newList.push(obj)
                  })
                  let initSelMemberOrg: any = {}
                  initSelMemberOrg = {
                    teamId: itemss.teamId,
                    sourceType: 'shareToUser', //操作类型
                    allowTeamId: [itemss.teamId],
                    selectList: newList, //选人插件已选成员
                    checkboxType: 'checkbox',
                    permissionType: 3, //组织架构通讯录范围控制
                    showPrefix: false, //不显示部门岗位前缀
                    visible: true,
                  }
                  setSelMemberOrg(initSelMemberOrg)
                })
              }}
            >
              查看共享人
            </li>
            <li
              className="optBtnItem"
              data-name="取消共享"
              onClick={() => {
                jQuery('.mindMenuList').hide()
                MindMenuClick('取消共享', itemss)
              }}
            >
              取消共享
            </li>
          </ul>
        )
      }
    }
    return (
      <div className="mindMenuList" style={{ top: rigMenu.top, left: rigMenu.left }}>
        {HtmlList}
      </div>
    )
  }

  //刷新右侧列表
  const refList = () => {
    isinit = true
    contentList()
  }

  //收到的协同菜单
  const menu = (
    //0所有 1待支持、2已拒绝、21已忽略、3已接受
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="0">全部</Menu.Item>
      <Menu.Item key="1">待支持</Menu.Item>
      <Menu.Item key="2">已拒绝</Menu.Item>
      <Menu.Item key="3">已接受</Menu.Item>
      {props.info.type == 1 && <Menu.Item key="21">已忽略</Menu.Item>}
    </Menu>
  )
  /**
   * 打开创建任务
   */
  const openCreateTask = () => {
    const param = {
      visible: true,
      from: 'work-plan', //来源
      createType: 'edit',
      id: tsakid, //任务id
      nowType: 0, //0个人任务 2企业任务 3部门任务
      taskType: 0,
      callbacks: (_: any) => {
        refList()
      },
    }
    createTaskRef.current && createTaskRef.current.setState(param)
  }
  return (
    <div className="areaItemBox" key={props.info.type}>
      <header className="areaHeader">
        <p className="header_left nav_name">
          {props.info.name ? props.info.name : title}
          {props.info.type == 0 && <span className="support_count">0待支持</span>}
          {(props.info.type == 0 || props.info.type == 1) && (
            <Dropdown overlay={menu} trigger={['click']} className="synergy_dropdown">
              <Button>
                {menuTitle} <DownOutlined />
              </Button>
            </Dropdown>
          )}
        </p>
      </header>
      <Spin spinning={loading} tip={'加载中，请耐心等待'}>
        <SetTypeHtml datas={dataList} type={props.info.type} />
      </Spin>
      {/* 右键 */}
      {/* {rightmodal && <MindMenuList params={rigMenu} />} */}
      <MindMenuList />
      {/* 分享到工作组 */}
      <ShareToRoomModal
        props={{
          param: { ...shareToRoomParam },
          action: {
            setShareToRoomModalShow: (flag: boolean) => {
              setShareToRoomParam({ ...shareToRoomParam, shareToRoomModalShow: flag })
            },
          },
        }}
        isclcallback={false}
        isclcallbackFn={() => {}}
      />
      {/* 共享到人 */}
      {selMemberOrg.visible && (
        <SelectMemberOrg
          param={{
            ...selMemberOrg,
          }}
          action={{
            setModalShow: (visible: any) => {
              setSelMemberOrg({ ...selMemberOrg, visible: visible })
            },
            // 点击确认
            onSure: selMemberSure,
          }}
        />
      )}
      {/* 编辑任务 */}
      {opencreattask && (
        <CreatTask
          param={{ visible: opencreattask }}
          datas={{
            from: 'work-plan', //来源
            isCreate: 1, //创建0 编辑1
            taskid: tsakid, //任务id
            nowType: 0, //0个人任务 2企业任务 3部门任务
            teaminfo: '', //企业信息
          }}
          setvisible={(state: any) => {
            setOpencreattask(state)
          }}
          callbacks={(code: any) => {
            refList()
          }}
        ></CreatTask>
      )}
      <CreateTaskModal ref={createTaskRef} />
      {/* 移动规划 */}
      {moveplanshow && (
        <MovePlan
          type={moveplanshow.type}
          id={moveplanshow.id}
          datas={moveplanshow.datas}
          setType={(state: any) => {
            setMoveplanshow({
              type: state,
              id: moveplanshow.id,
              datas: moveplanshow.datas,
            })
          }}
          openMode={() => {
            refList()
          }}
        ></MovePlan>
      )}
      {/* 拒绝理由 */}
      {refuse && (
        <Modal
          title="操作提示"
          className="refusePlanCooperateModal"
          visible={refuse}
          onOk={() => {
            refuseOk('')
          }}
          onCancel={() => {
            setRefuseOk(false)
          }}
        >
          {operation == 'refuse' && (
            <>
              <p>确认拒绝该计划协同？</p>
              <div>
                <span className="text_reason">理由:</span>
                <TextArea
                  rows={4}
                  onChange={e => {
                    setRefusetext(e.target.value)
                  }}
                />
              </div>
            </>
          )}
          {operation == 'synergy' && (
            <>
              <p>确定撤回派发此计划？</p>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

export default PlanMindMeunItem

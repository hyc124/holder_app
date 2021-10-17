import React, { useState, useEffect, useRef } from 'react'
import { Avatar, Button, message, Menu, Dropdown, Spin } from 'antd'
import { CaretDownOutlined, LoadingOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import ReportList from '../workReport/component/ReportList'
import MettingList from '../mettingManage/MettingList'
import CreatTask from '../task/creatTask/creatTask'
import WorkPlanMindModal from '@/src/views/work-plan-mind/addPlan'
import AddModal from '../../views/announce/addModal'
import MettingDetailsPop from '../mettingManage/component/MettingDetailsPop'
import { getCompanylist } from '../announce/actions'
import $c from 'classnames'
import { ipcRenderer } from 'electron'
import { refreshOpenPanle } from './component/TaskList'
import OkrListCard from '../okr-four/list-card-four/okr-workplan'
import OKRmind from '../okr-list/okr-mind'
import Axios from 'axios'
import { useMergeState } from '../chat-history/chat-history'
import { CreateTaskModal } from '../task/creatTask/createTaskModal'
interface DeskHederProps {
  updateNums: () => void
  isFollow?: boolean
  wuTongAuth?: boolean
}
const WorkDeskHeader = (props: DeskHederProps) => {
  const { updateNums, isFollow, wuTongAuth } = props
  //全局缓存信息
  const { orgInfo, followUserInfo, selectTeamName, newTeamList, nowAccount, nowUserId } = $store.getState()
  //当前企业ID
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  //当前选中的企业信息
  const selTeamItem = orgInfo.filter((item: { id: number }) => item.id === selectTeamId)
  //关注人信息
  const followInfo = useSelector((state: any) => state.followUserInfo)
  //工作报告弹窗状态
  const [isShowAddPlan, setIsShowAddPlan] = useState(false)
  //创建任务弹窗状态
  const [opencreattask, setOpencreattask] = useState(false)
  //汇报弹窗状态
  const [showReportListModal, setShowReportListModal] = useState(false)
  //会议模块状态
  const [showMettingListModal, setShowMettingListModal] = useState(false)
  //OKR模块状态
  const [showOkrListModal, setShowOkrListModal] = useState(false)
  //脑图状态
  const [showOkrMind, setShowOkrMind] = useState(false)
  //发布会议状态
  const [meetAdd, setMeetAdd] = useState(false)
  //公告状态
  const [addModalVisble, setAddModalVisble] = useState(false)
  //企业列表
  const [orgList, setOrgList] = useState([])
  //入口loading
  const [entranceVisble, setEntranceVisble] = useMergeState({
    visible: false, //下拉框状态
    report: false, //写报告
    approval: false, //发布审批
    addMoadal: false, //发布公告
    cloudStand: false, //云台账
    project: false, //新建项目
  })
  //企业信息
  const [org, setOrg] = useState({
    orgName: '',
    orgImg: '',
  })
  //红点状态
  const [redDot, setRedDot] = useState(false)
  // 创建任务弹框组件
  const createTaskRef = useRef<any>({})
  //关闭汇报列表
  const antIcon = <LoadingOutlined style={{ fontSize: 20 }} spin />
  const hideReportList = () => {
    setShowReportListModal(false)
  }
  // 关闭会议弹窗
  const hideMettingList = () => {
    setShowMettingListModal(false)
  }
  useEffect(() => {
    ipcRenderer.removeAllListeners('report_content_read').on('report_content_read', (e, args) => {
      const dotState = args !== 0 ? true : false
      setRedDot(dotState)
    })
  }, [])
  //加载关注人工作台的企业下拉
  useEffect(() => {
    getTeamInfo({
      userId: followInfo.userId || nowUserId,
      loginUserId: nowUserId,
    }).then((data: any) => {
      if (data.returnCode === 0) {
        if (data.dataList !== null && data.dataList.length !== 0) {
          const orgList = data.dataList || []
          setOrgList(orgList)
          const setlectOrg = orgList.filter((item: { id: number }) => item.id === selectTeamId)
          if (followUserInfo.followStatus) {
            if (setlectOrg.length === 0) {
              setOrg({
                orgName: orgList[0].shortName || '',
                orgImg: orgList[0].logo || '',
              })
              $store.dispatch({
                type: 'SET_FOLSEL_ORGID',
                data: {
                  followSelectTeadId: orgList[0].id,
                },
              })
            } else {
              setOrg({
                orgName: setlectOrg[0].shortName || '',
                orgImg: setlectOrg[0].logo || '',
              })
              $store.dispatch({
                type: 'SET_FOLSEL_ORGID',
                data: {
                  followSelectTeadId: setlectOrg[0].id,
                },
              })
            }
          }
        }
      } else {
        message.error(data.returnMessage)
      }
    })
  }, [followUserInfo.userId])

  const createWuTongWindow = (selectTeamId: any) => {
    for (let i = 0; i < newTeamList.length; i++) {
      if (newTeamList[i].id == selectTeamId) {
        // 吾同外部访问地址拼接
        const _https = `${newTeamList[i].businessDataAddress}/api/wuts/index?company_id=${newTeamList[i].id}&user_account=${nowAccount}`
        wutsRequest(_https)
      }
    }
  }
  // 根据返回状态判断是否打开吾同体育窗口
  const wutsRequest = (url: any) => {
    Axios.get(url).then(res => {
      if (res.data.returnCode == 0 && res.data.data.url != '') {
        const _url = res.data.data.url
        $store.dispatch({
          type: 'WU_TONG_URL',
          data: {
            url: _url,
          },
        })
        $tools.createWindow('WuTongWindow')
      } else {
        message.error('外部应用连接异常')
      }
    })
  }

  const getTeamInfo = (params: any) => {
    const { loginToken } = $store.getState()
    return new Promise((resolve, reject) => {
      $api
        .request('/team/enterpriseInfo/findFollowUserOrg', params, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(res => {
          resolve(res)
        })
    })
  }
  //关注人工作台企业切换
  const changeOrg = (item: any) => {
    setOrg({
      orgName: item.shortName,
      orgImg: item.logo,
    })
    $store.dispatch({
      type: 'SET_FOLSEL_ORGID',
      data: {
        followSelectTeadId: item.id,
      },
    })
  }
  const selectHandleItem = (key: React.ReactText) => {
    if (key == '0') {
      //工作报告
      setEntranceVisble({
        report: true,
      })
      $store.dispatch({
        type: 'WORKREPORT_TYPE',
        data: {
          wortReportType: 'create',
          wortReportTtime: Math.floor(Math.random() * Math.floor(1000)),
        },
      })
      $tools.createWindow('WorkReport').finally(() => {
        setEntranceVisble({
          visible: false,
          report: false,
        })
      })
    } else if (key == '1') {
      //发起会议
      setMeetAdd(true)
      setEntranceVisble({
        visible: false,
      })
    } else if (key == '2') {
      //发起审批
      setEntranceVisble({
        approval: true,
      })
      $tools.createWindow('Approval').finally(() => {
        setEntranceVisble({
          visible: false,
          approval: false,
        })
      })
    } else if (key == '4') {
      createTaskRef.current &&
        createTaskRef.current.setState({ visible: true, createType: 'add', from: 'workbench', taskType: 5 })
      setEntranceVisble({
        visible: false,
        project: false,
      })
    } else {
      //发布公告
      setEntranceVisble({
        addMoadal: true,
      })
      getCompanylist({ userId: nowUserId }).then((res: any) => {
        if (res.returnCode === 0) {
          // setAddModalVisble(true)
          ipcRenderer.send('close_addModal_window')
          $store.dispatch({
            type: 'ADD_MODAL_MSG',
            data: {
              companyId: 0, //企业id,
              groupId: undefined, //分组id
              enterpriseList: undefined,
              editNoticeData: '',
            },
          })
          $tools.createWindow('AddModalWin').finally(() => {
            setEntranceVisble({
              visible: false,
              addMoadal: false,
            })
          })
        } else {
          message.error(res.returnMessage || '没有权限，请联系管理员')
        }
      })
    }
  }
  //发布内容
  const menu = (
    <Menu
      className="publishMenu"
      style={{ width: '134px' }}
      onClick={props => {
        selectHandleItem(props.key)
      }}
    >
      <Menu.Item
        key="4"
        icon={
          <img
            style={{ marginRight: 6, marginTop: -2 }}
            src={$tools.asAssetsPath('/images/workdesk/report/xbg.svg')}
          />
        }
      >
        <Spin
          className="menu_button_spin"
          indicator={<LoadingOutlined style={{ fontSize: 14, color: '#9a9aa2' }} spin />}
          size="small"
          spinning={entranceVisble.project}
        />
        <Button className="menu_button_i">新建项目</Button>
      </Menu.Item>
      <Menu.Item
        key="0"
        icon={
          <img
            style={{ marginRight: 6, marginTop: -2 }}
            src={$tools.asAssetsPath('/images/workdesk/report/project.svg')}
          />
        }
      >
        <Spin
          className="menu_button_spin"
          indicator={<LoadingOutlined style={{ fontSize: 14, color: '#9a9aa2' }} spin />}
          size="small"
          spinning={entranceVisble.report}
        />
        <Button className="menu_button_i">写报告</Button>
      </Menu.Item>

      <Menu.Item
        key="1"
        icon={
          <img
            style={{ marginRight: 6, marginTop: -2 }}
            src={$tools.asAssetsPath('/images/workdesk//report/fqhy.svg')}
          />
        }
      >
        <Button className="menu_button_i">发布会议</Button>
      </Menu.Item>

      <Menu.Item
        key="2"
        icon={
          <img
            style={{ marginRight: 6, marginTop: -2 }}
            src={$tools.asAssetsPath('/images/workdesk//report/fqsp.svg')}
          />
        }
      >
        <Spin
          className="menu_button_spin"
          indicator={<LoadingOutlined style={{ fontSize: 14, color: '#9a9aa2' }} spin />}
          size="small"
          spinning={entranceVisble.approval}
        />
        <Button className="menu_button_i">发起审批</Button>
      </Menu.Item>
      <Menu.Item
        key="3"
        icon={
          <img
            style={{ marginRight: 6, marginTop: -2 }}
            src={$tools.asAssetsPath('/images/workdesk/report/fbgg.svg')}
          />
        }
      >
        <Spin
          className="menu_button_spin"
          indicator={<LoadingOutlined style={{ fontSize: 14, color: '#9a9aa2' }} spin />}
          size="small"
          spinning={entranceVisble.addMoadal}
        />
        <Button className="menu_button_i">发布公告</Button>
      </Menu.Item>
    </Menu>
  )

  // 打开四象限创建目标任务
  const openPlanWindow = (_selectTeamId?: any, _selectTeamName?: any) => {
    const TeamId = _selectTeamId ? _selectTeamId : selectTeamId
    const TeamName = _selectTeamName ? _selectTeamName : selectTeamName
    $store.dispatch({
      type: 'FROM_PLAN_TYPE',
      data: { createType: 0, fromToType: 1 },
    })
    $store.dispatch({ type: 'PLANOKRMAININFO', data: { isMyPlan: true } })
    $store.dispatch({ type: 'DIFFERENT_OkR', data: 1 })
    $store.dispatch({
      type: 'MYPLAN_ORG',
      data: { cmyId: TeamId, curType: -1, cmyName: TeamName, curId: TeamId },
    })
    $store.dispatch({
      type: 'MINDMAPOKRDATA',
      data: {
        id: 0,
        typeId: 0,
        name: '', //目标Objective
        teamName: TeamName,
        teamId: TeamId,
        status: 1,
        mainId: '',
        type: 2,
        ascriptionType: -1,
      },
    })
    $tools.createWindow('okrFourquadrant')
  }

  /**
   * 打开创建任务
   */
  const openCreateTask = () => {
    const param = {
      visible: true,
      createType: 'add',
      from: 'workbench',
      taskType: 0,
      nowType: 0, //0个人任务 2企业任务 3部门任务
      teaminfo: selTeamItem, //企业信息
      callbacks: (param: any, code: any) => {
        const orgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
        if (param.data.ascriptionId === selectTeamId || orgId == '') {
          $('[data-code=' + code.code + ']').click()
          console.log($('[data-code=' + code.code + ']'))
          refreshOpenPanle(code)
          updateNums()
        }
      },
    }
    createTaskRef.current && createTaskRef.current.setState(param)
  }
  //按钮
  const onselect = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault()
    setEntranceVisble({ visible: true })
  }
  return (
    <div className="workdesk-header">
      {isFollow && (
        <Dropdown
          overlay={
            <Menu>
              {orgList.map((item: any, index: number) => (
                <Menu.Item key={index} onClick={() => changeOrg(item)}>
                  <div>{item.shortName}</div>
                </Menu.Item>
              ))}
            </Menu>
          }
          trigger={['click']}
        >
          <div className="follow_org">
            <div className="orgImg">
              <Avatar src={org.orgImg} style={{ marginRight: 5 }}></Avatar>
            </div>
            <div className="orgName">{org.orgName}</div>
            <CaretDownOutlined className="org_d_icon" />
          </div>
        </Dropdown>
      )}
      {!isFollow && (
        <div className="workdesk-header-left">
          <span
            className={$c('handler-icon', { 'red-span': redDot })}
            onClick={e => {
              e.preventDefault()
              setShowReportListModal(true)
            }}
          >
            <i></i>汇报
          </span>
          <span
            className="handler-icon"
            onClick={e => {
              e.preventDefault()
              setShowMettingListModal(true)
            }}
          >
            <i></i>会议
          </span>
          <span
            className="handler-icon"
            onClick={() => {
              setEntranceVisble({ cloudStand: true })
              $store.dispatch({ type: 'SET_BUSINESS_INFO', data: null })
              $tools.createWindow('BusinessData').finally(() => {
                setEntranceVisble({ cloudStand: false })
              })
            }}
          >
            <Spin
              className="menu_button_spin"
              indicator={antIcon}
              size="small"
              spinning={entranceVisble.cloudStand}
            />
            <i></i>
            云台账
          </span>
          {/* 吾同体育入口权限校验 */}
          {selectTeamId != -1 && wuTongAuth && (
            <span
              className="handler-icon"
              onClick={() => {
                createWuTongWindow(selectTeamId)
              }}
            >
              <i className="wt_icon"></i>
              吾同体育
            </span>
          )}
        </div>
      )}
      {!isFollow && (
        <div className="workdesk-header-right">
          <Button
            className="create_task_btn create_object_btn"
            style={{ fontSize: '14px', marginRight: '20px' }}
            type="primary"
            shape="round"
            onClick={() => {
              if (selectTeamId === -1) {
                //所有企业
                if (orgInfo.length == 2) {
                  openPlanWindow(orgInfo[0].id, orgInfo[0].name)
                } else {
                  setIsShowAddPlan(true)
                }
              } else {
                //直接创建OKR
                openPlanWindow()
              }
            }}
          >
            创建目标
          </Button>
          <Button
            className="create_task_btn p_create_task_btn forcedHide"
            style={{
              fontSize: '14px',
              boxShadow: 'none',
              border: '1px solid #4285f4',
              color: '#4285f4',
              textShadow: 'none',
              backgroundColor: 'transparent',
              padding: 0,
            }}
            type="primary"
            shape="round"
            onClick={() => {
              setOpencreattask(true)
            }}
          >
            创建任务
          </Button>
          <Button
            className="create_task_btn p_create_task_btn"
            style={{
              fontSize: '14px',
              boxShadow: 'none',
              border: '1px solid #4285f4',
              color: '#4285f4',
              textShadow: 'none',
              backgroundColor: 'transparent',
              padding: 0,
            }}
            type="primary"
            shape="round"
            onClick={() => {
              openCreateTask()
            }}
          >
            创建任务
          </Button>
          <Dropdown
            overlay={menu}
            trigger={['click']}
            arrow={true}
            visible={entranceVisble.visible}
            onVisibleChange={e => setEntranceVisble({ visible: e })}
          >
            <div className="release_cont_btn" onClick={() => setEntranceVisble({ visible: true })}>
              <i className="add_icon"></i>
            </div>
          </Dropdown>
        </div>
      )}
      {showReportListModal && <ReportList visible={showReportListModal} onHideModal={hideReportList} />}
      {showMettingListModal && <MettingList visible={showMettingListModal} onHideModal={hideMettingList} />}
      {/* 创建任务 */}
      {/* {opencreattask && (
        <CreatTask
          param={{ visible: opencreattask }}
          datas={{
            from: 'workbench', //来源
            isCreate: 0, //创建0 编辑1
            nowType: 0, //0个人任务 2企业任务 3部门任务
            teaminfo: selTeamItem, //企业信息
          }}
          setvisible={(state: any) => {
            setOpencreattask(state)
          }}
          callbacks={(param: any, code: any) => {
            const orgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
            if (param.data.ascriptionId === selectTeamId || orgId == '') {
              $('[data-code=' + code.code + ']').click()
              console.log($('[data-code=' + code.code + ']'))
              refreshOpenPanle(code)
              updateNums()
            }
          }}
        ></CreatTask>
      )} */}

      {meetAdd && (
        <MettingDetailsPop
          datas={{
            listType: -1,
            typeId: -1,
            visibleDetails: meetAdd,
            openType: 'create',
            nowStatus: -1,
            isMeetType: false,
            isDeskIn: true,
          }}
          isVisibleDetails={(flag: boolean) => {
            setMeetAdd(flag)
          }}
        />
      )}

      {addModalVisble && (
        <AddModal
          companyId={0}
          hideAddModal={() => {
            setAddModalVisble(false)
          }}
          addModalVisble={addModalVisble}
          publishSuccess={() => {
            setAddModalVisble(false)
          }}
          editNoticeData={''}
        />
      )}
      {showOkrListModal && (
        <OkrListCard
          visible={showOkrListModal}
          changeVisible={(value: boolean) => {
            setShowOkrListModal(value)
          }}
        />
      )}
      {showOkrMind && (
        <OKRmind
          visible={showOkrMind}
          changeVisible={(value: boolean) => {
            setShowOkrMind(value)
          }}
        />
      )}
      {/* 选择企业 */}
      {isShowAddPlan && (
        <WorkPlanMindModal
          isOkr={true}
          visible={isShowAddPlan}
          state={0}
          isShowAddPlan={(state: any) => {
            setIsShowAddPlan(state)
          }}
          handleOk={(teamid: any, teamname: any) => {
            openPlanWindow(teamid, teamname)
          }}
        ></WorkPlanMindModal>
      )}
      <CreateTaskModal ref={createTaskRef} />
    </div>
  )
}

export default WorkDeskHeader

/**
 * 目标看板组件
 */
import React, { useEffect, useState } from 'react'
import {
  Table,
  Avatar,
  Slider,
  Progress,
  Spin,
  message,
  Pagination,
  Tooltip,
  InputNumber,
  Dropdown,
  Tag,
  Row,
  Col,
} from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import './TargetKanban.less'
import $c from 'classnames'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import { useSelector } from 'react-redux'
import TaskListOpt from './TaskListOpt'
import { quickCreateTask } from '../../task/taskComApi'
import Okrdetail from '../../work-plan-mind/okrdetail'
import { cancleTaskFollow, taskFollow, findOneTargetTaskDetail, getOrgProfileById } from '../getData'
import { setListRoleHtml } from './TaskList'
import TaskDelayModal from './taskModule/taskDelayModal'
// import { relative } from 'path'
import { ipcRenderer } from 'electron'

//查询一级树形结构
export const initDataTreeApi = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const showData = resData

        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}
//查询子集树
export const getDataTreeNodeApi = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}

//刷新
let refreshDetail: any = null
export const refreshDetails = () => {
  if (refreshDetail) refreshDetail()
}
const ProgressColors = [
  ['#4285f4', '#e9f2ff'], //蓝色
  ['#34a853', '#cdead5'], //绿色
  ['#fbbc05', '#fcecc5'], //黄色
  ['#ea4335', '#fad1ce'], //红色
  ['#d7d7d9', '#d7d7d9'], //成功
]
//渲染任务进度
export const getTaskProgress = (progress: any, type: any) => {
  const colorIndex = progress == 100 ? 4 : progress.color > 0 ? progress.color - 1 : progress.color
  //进度条的色彩
  const strokeColor = ProgressColors[colorIndex][0]
  //未完成的分段的颜色
  const trailColor = ProgressColors[colorIndex][1]
  return (
    <Progress
      strokeColor={strokeColor}
      trailColor={trailColor}
      percent={progress.percent}
      format={percent => `${percent}%`}
      width={32}
      type={type}
      strokeWidth={12}
      className={$c('ant_slider_defalt', { circleHover: type == 'circle' })}
    ></Progress>
  )
}
interface ItemProps {
  id: number
  name: string
  ascriptionType: number
  ascriptionId: number
  ascriptionName: string
  status?: number
  flag?: number
  approvalStatus?: number
  endTime?: string
  level?: number
  property?: number
  cycleNum: number
  icon?: string
  progress?: {
    percent?: number
    color?: number
  }
  children?: ItemProps
  subTaskCount?: number
  type?: number
  planType?: number
  planId?: number
  today?: false
  importRole?: any[]
  maxRole?: number
  delayCount?: any
  cci?: string
  profile?: string
  liableUsername?: string
  taskType?: any
  isFirst?: boolean
  executeTime?: string
  isFollow?: boolean
  followNames?: any[]
}
interface DataItemProps {
  item: ItemProps
  key: number
  children: any
  subTaskCount: number
  progress?: any
  taskName: string
  liableUser?: string
  executeTime?: string
  endTime?: string
  handleBtn?: any
}
const code = 'target_kanban'
//目标看板组件
const TargetKanban = ({ params }: any) => {
  const { moduleType, isFollow } = params
  const { nowUserId, loginToken, selectTeamId, followUserInfo } = $store.getState()
  //全屏状态
  const isFullScreen = useSelector((state: any) => state.showFullScreen)
  //全屏 页码
  const [fullCurrentPage, setFullCurrentPage] = useState(0)
  //全屏 总条数
  const [totalElements, setTotalElements] = useState(0)
  //显示隐藏任务详情
  const [opentaskdetail, setTaskdetail] = useState(false)
  //延期弹窗 查看任务列表
  const [delayModal, setDelayModal] = useState(false)
  // 延期弹窗 储存当前查看主任务数据
  const [masterTask, setMasterTask] = useState({ name: '目标任务' })

  // 储存当前查看任务数据 查看详情
  const [currentTaskDetail, setCurrentTaskDetail] = useState<any>({ id: '' })

  //请求参数
  // const queryParams = useSelector((state: any) => state.targetKanbanParams)
  const queryParams = useSelector((state: any) => state.selectTeam)
  //默认展开行
  const [defaultExpandedRowKeys, setDefaultExpandedRowKeys] = useState<string[]>([])
  //OKR详情
  const [okrdetail, setokrDetail] = useState<any>()

  const [loading, setLoading] = useState(false)
  const contextMenuCallback = (params?: any) => {
    queryOneTask(params.taskId, params.optType)
  }

  const [datas, setDatas] = useState<DataItemProps[]>([])
  // 检测 参数变化 、 页码变化、全屏、初始数据
  useEffect(() => {
    initDataTree()
  }, [queryParams, selectTeamId])

  // 检测全屏变化
  useEffect(() => {
    if (!isFullScreen) {
      $store.dispatch({
        type: 'TARGET_KANBAN_QUERY',
        data: {
          ...queryParams,
          ascriptionId: '0',
          ascriptionType: '0',
          pageNo: 0,
          pageSize: 10,
        },
      })
    }
  }, [isFullScreen])
  //刷新
  refreshDetail = () => {
    initDataTree()
  }
  //初始化查询tree
  const initDataTree = () => {
    setLoading(true)
    const { pageNo, pageSize } = queryParams
    const param = {
      // teamId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
      // ascriptionId: ascriptionId,
      // ascriptionType: ascriptionType,
      // operateUser: nowUserId,
      pageNo: pageNo || 0,
      pageSize: pageSize || 10,
      userId: !isFollow ? nowUserId : followUserInfo.userId,
      listType: 22,
      loginUserId: nowUserId,
      // account: nowAccount,
      enterpriseId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
    }
    const url = '/task/workbench'

    initDataTreeApi(param, url).then((res: any) => {
      setLoading(false)
      const contentData: ItemProps[] = (res.data && res.data.content) || []
      const newTableData: any = []
      contentData.map((item: ItemProps) => {
        newTableData.push({
          item: item,
          progress: {
            ...item.progress,
            endTime: item.endTime,
            id: item.id,
            planId: item.planId,
            status: item.status,
            flag: item.flag,
            approvalStatus: item.approvalStatus,
            taskType: item.taskType,
            planType: item.planType,
            executeTime: item.executeTime,
            isFollow: item.isFollow,
            ascriptionName: item.ascriptionName,
            ascriptionId: item.ascriptionId,
          },
          key: item.id,
          subTaskCount: item.subTaskCount,
          children: item.subTaskCount == 0 ? undefined : item.children || [],
        })
      })

      setDatas(newTableData)
      const total = (res.data && res.data.totalElements) || 0
      setTotalElements(total)
    })
  }
  const getTooltipText = (tool: any) => {
    let text = '导入的任务: '
    tool.forEach((item: any) => {
      switch (item) {
        case 2:
          text += '我协同的 '
          break
        case -1:
          text += '我关注的 '
          break
        case 1:
          text += '我指派的 '
          break
        case 6:
          text += '我督办的 '
          break
        default:
          break
      }
    })
    return text
  }
  //查看工作计划详情
  const examinePlan = (item: any) => {
    //工作规划
    $store.dispatch({
      type: 'MINDMAPDATA',
      data: {
        id: item.id,
        typeId: item.id,
        name: item.name,
        form: 'workbench',
        isPlan: item.planId ? 1 : 0,
      },
    })
    //跳转到脑图
    const { fromPlanTotype } = $store.getState()
    $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 })
    $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
    $tools.createWindow('workplanMind')
  }

  // 打开延迟列表弹窗
  const openDelayList = (item: any) => {
    setMasterTask(item)
    setDelayModal(true)
  }

  //取消关注
  const cancleFollowTask = (taskId: number) => {
    cancleTaskFollow({
      taskId: taskId,
      userId: nowUserId,
    }).then(
      () => {
        message.success('取消关注成功！')
        queryOneTask(taskId, 'canclefollow')
      },
      msg => {
        message.error(msg)
      }
    )
  }
  //关注
  const followTask = (id: number, ascriptionId: number, ascriptionName: string) => {
    const { selectTeamId, selectTeamName } = $store.getState()
    let teamId = selectTeamId
    let belongName: any = selectTeamName
    if (ascriptionId) {
      teamId = ascriptionId
      belongName = ascriptionName
    }
    taskFollow({
      belong: 'org',
      belongId: teamId,
      belongName: belongName,
      userId: nowUserId,
      followType: 'task',
      followId: id,
    }).then(
      () => {
        message.success('关注成功！')
        queryOneTask(id, 'follow')
      },
      msg => message.error(msg)
    )
  }
  //获取当前最新的数据（单条任务查询）
  const queryOneTask = (taskId: number, type?: any, taskKey?: string) => {
    findOneTargetTaskDetail({
      taskIds: taskId,
      loginUserId: nowUserId,
    }).then((data: any) => {
      const taskData = data.dataList

      const dataItemArr: Array<DataItemProps> = taskData.map((item: any) => {
        return {
          item: item,
          key: item.id,
          taskName: { ...item },
          liableUser: { name: item.executorUsername, profile: item.profile, executorId: item.executorUser },
          executeTime: item.executeTime,
          endTime: item.endTime,
          subTaskCount: item.subTaskCount,
          handleBtn: { ...item },
          children: item.subTaskCount === 0 ? undefined : item.children || [],
          progress: {
            ...item.progress,
            endTime: item.endTime,
            id: item.id,
            planId: item.planId,
            status: item.status,
            flag: item.flag,
            approvalStatus: item.approvalStatus,
            taskType: item.taskType,
            planType: item.planType,
            executeTime: item.executeTime,
            isFollow: item.isFollow,
            ascriptionName: item.ascriptionName,
            ascriptionId: item.ascriptionId,
          },
        }
      })
      //动态添加任务子任务
      const newTable = datas.concat([])
      updateNowTaskData(newTable, taskId, dataItemArr, type)
      setDatas(newTable)
      if (type && type == 'createChild' && taskKey) {
        setDefaultExpandedRowKeys([taskKey])
      }
    })
  }
  //递归替换当前行数据2
  const types = [
    'unfinish',
    'start',
    'unfreeze',
    'freeze',
    'replay',
    'changeBelong',
    'edit',
    'follower',
    'transfer',
    'assign',
  ]
  const updateNowTaskData = (
    tableData: any,
    taskId: number,
    dataItemArr: Array<DataItemProps>,
    type?: string
  ) => {
    const delDataFn = (index: number) => {
      tableData.splice(index, 1)
      const num = $(`.${code}_num`).text()
      if (tableData.children && tableData.children.length > 0) {
        const len = tableData.children.length + 1
        const newNum = parseInt(num) - len
        $(`.${code}_num`).text(newNum)
      } else {
        $(`.${code}_num`).text(parseInt(num) - 1)
      }
    }
    tableData.map((_item: DataItemProps, index: number) => {
      if (_item.key === taskId) {
        const moreType = ['finish', 'editProgress']
        const { percent } = dataItemArr[0].progress
        const { item, key, taskName, liableUser, executeTime, endTime, progress, handleBtn } = dataItemArr[0]
        if (type === 'archive' || type === 'del') {
          //归档 关注 取消关注
          delDataFn(index)
          //一键完成 取消完成 启动 解冻 冻结 不操作子元素刷新
        } else if (type && types.includes(type)) {
          _item.item = item
          _item.key = key
          _item.taskName = taskName
          _item.liableUser = liableUser
          _item.executeTime = executeTime
          _item.endTime = endTime
          _item.progress = progress
          _item.handleBtn = handleBtn
          //冻结 解冻 子任务跟着变化START(需优化加载速度)
          if (type === 'freeze' || type === 'unfreeze') {
            if (_item.children.length !== 0) {
              for (let i = _item.children.length; i--; ) {
                queryOneTask(_item.children[i].key, type, code)
              }
            }
          }
          //冻结 解冻 子任务跟着变化OVER
        } else if (type && moreType.includes(type) && percent === 100) {
          //修改 目标，项目，临时，职能任务 需要将选项移除且给出提示
          // $('[data-row-key=' + _item.key + ']').fadeOut(1000, () => {
          //   delDataFn(index)
          // })
          const thisTr = $(`.${code}_module`).find('[data-row-key=' + _item.key + ']')
          $(thisTr).fadeOut(1000, () => {
            delDataFn(index)
            //校验本地仓库是否存在此用户ID，如果不存在弹框引导提示
            const userMsg: any = localStorage.getItem('TASK_INFO_MSG')
            const userMsgInfo: any[] = JSON.parse(userMsg)
            if (userMsg) {
              if (!storageHasUser(nowUserId, userMsgInfo)) {
                ipcRenderer.send('task_finish_visble', 1) //提示引导弹框
                userMsgInfo.push(nowUserId)
                localStorage.setItem('TASK_INFO_MSG', JSON.stringify(userMsgInfo))
              }
            } else {
              localStorage.setItem('TASK_INFO_MSG', JSON.stringify([nowUserId]))
            }
          })
        } else {
          const { subTaskCount, children } = dataItemArr[0]
          _item.item = item
          _item.key = key
          _item.taskName = taskName
          _item.liableUser = liableUser
          _item.executeTime = executeTime
          _item.endTime = endTime
          _item.progress = progress
          _item.subTaskCount = subTaskCount
          _item.handleBtn = handleBtn
          _item.children = children
        }
      }
      if (_item.children && _item.children.length > 0) {
        updateNowTaskData(_item.children, taskId, dataItemArr, type)
      }
    })
  }
  //校验本地仓库是否存储了当前操作的用户ID
  const storageHasUser = (userId: any, userInfo: Array<any>) => {
    let hasUser = false
    for (let i = userInfo.length; i--; ) {
      if (userInfo[i] == userId) {
        hasUser = true
        break
      }
    }
    return hasUser
  }
  /**************************************************************table ****************************************************/

  const ProgressCom = ({ progressItem }: any) => {
    const [progressValue, setProgressValue] = useState(progressItem.percent)
    const [progressType, setProgressType] = useState('line')
    const [iptVisible, setIptVisible] = useState(false)

    useEffect(() => {
      moduleType == 0 && !isFullScreen ? setProgressType('circle') : setProgressType('line')
    }, [moduleType])

    //拖动结束后修改任务进度
    const afterChangeProgress = (process: any) => {
      const param = {
        taskId: progressItem.id,
        userId: nowUserId,
        process,
        operateUser: nowUserId,
      }

      $api
        .request('/task/log/addTaskLog', param, {
          headers: {
            loginToken: loginToken,
            'Content-Type': 'application/json;charset=UTF-8',
          },
        })
        .then(() => {
          message.success('修改进度成功')
          setProgressValue(process)
          setIptVisible(false)
          // 刷新数据
          // queryOneTask(progressItem.id, 'progress')
          queryOneTask(progressItem.id, 'editProgress')
        })
        .catch(err => {
          setIptVisible(false)
          message.error(err.returnMessage)
        })
    }
    //过滤 inputNumber 只能输入正整数
    const limitDecimals = (value: any) => {
      return value.replace(/^(0+)|[^\d]+/g, '')
    }

    /**
     * 任务状态 status： 0未开启 1开启 2完成 3延迟 4变更 -1删除
     * flag：0正常 1冻结 2修改备份 3归档
     *  approvalState： 0无审批 1审批中
     */
    return (
      <>
        {progressType == 'line' && (
          // <div style={{ position: 'relative' }}>
          //   <Slider
          //     className={$c('ant_slider_option')}
          //     disabled={progressItem.status == 2 || progressItem.flag == 1 || progressValue == 100}
          //     defaultValue={progressValue}
          //     onAfterChange={(value: any) => afterChangeProgress(value)}
          //   ></Slider>
          //   <span
          //     className="slider_value ant_slider_option"
          //     style={{ color: 'rgba(0, 0, 0, 0.45)', position: 'absolute', right: '0', top: '1px' }}
          //   >
          //     {progressValue}%
          //   </span>
          // </div>
          <Slider
            className={$c('ant_slider_option')}
            disabled={progressItem.status == 2 || progressItem.flag == 1 || progressValue == 100}
            defaultValue={progressValue}
            tipFormatter={() => {
              return `${progressValue}%`
            }}
            onAfterChange={(value: any) => afterChangeProgress(value)}
          ></Slider>
        )}
        {iptVisible && (
          <InputNumber
            size="small"
            className="progress_input"
            autoFocus
            min={0}
            max={100}
            minLength={1}
            maxLength={3}
            defaultValue={progressValue}
            formatter={limitDecimals}
            parser={limitDecimals}
            onPressEnter={e => {
              e.stopPropagation()
              const _e: any = e
              afterChangeProgress(_e.target.value)
            }}
            onBlur={e => {
              e.stopPropagation()
              afterChangeProgress(e.target.value)
            }}
          />
        )}
        <div
          className="pregressCom"
          onClick={(e: any) => {
            e.stopPropagation()
            if (progressType == 'circle') {
              if (progressValue == 100) {
                return message.warning('已完成的任务无法修改任务进度!')
              }
              setIptVisible(true)
            }
          }}
        >
          {getTaskProgress({ ...progressItem, percent: progressValue }, progressType)}
          {progressType == 'circle' && <div className="show_progress"></div>}
        </div>
      </>
    )
  }
  //获取OKR图标
  const showProfile = (planyType: any, profile: any) => {
    if (planyType !== 3) {
      return profile
    }
    if (profile) {
      return profile
    } else {
      return `${$tools.asAssetsPath('/images/workplan/OKR/nodepotrait.png')}`
    }
  }
  /*列渲染抽离<防止右键按钮异常>*/
  //任务名称
  const renderOneColums = (item: ItemProps) => {
    // console.log(item)
    const typeStatus = moduleType == 0 && !isFullScreen
    if (typeStatus) {
      return (
        <div className={$c('secend_container', { finishedTaskColor: item.status == 2 })}>
          <div className="one_box">
            {selectTeamId == -1 && (
              <Avatar
                className="company_icon"
                size={moduleType != 0 || isFullScreen ? 24 : 16}
                src={getOrgProfileById(item.ascriptionId)}
                style={{ marginRight: 5 }}
              ></Avatar>
            )}
            {item.planType == 2 && <span className="tree_node_per">O</span>}
            {item.planType == 3 && <span className="tree_node_per">KR</span>}
            <span className={$c('tree_node_name', { finishedTask: item.status === 2 })}>{item.name}</span>
            {item.flag === 1 && <span className="ant-tag com-tag com-tag-d">冻</span>}
            {item.cycleNum === 0 && <Tag className="com-tag com-tag-x">循</Tag>}
            {item.cycleNum > 0 && <Tag className="ant-tag long-tag com-tag-x">循 {item.cycleNum}</Tag>}
            {item.delayCount > 0 && (
              <span
                className="tree_node_delay"
                onClick={e => {
                  e.stopPropagation()
                  openDelayList(item)
                }}
              >
                延<span style={{ marginLeft: '3px' }}>{item.delayCount}</span>
              </span>
            )}
            {/* 信心指数 */}
            {item.planType == 3 && item.cci && <span className="tree_plan tree_plan_s">{item.cci}/10</span>}
          </div>
          <div className="two_box">
            <Avatar
              size={24}
              src={showProfile(item.planType, item.profile)}
              style={{ backgroundColor: '#4285f4', fontSize: 12, marginRight: 5 }}
            >
              {item.liableUsername && item.liableUsername.substr(-2, 2)}
            </Avatar>
            {item.endTime != undefined && (
              <span className={$c('end_time')}>{item.endTime.split(' ')[0].substr(5, 9)} 截止</span>
            )}
            {(item.maxRole == 1 || item.maxRole == 4 || item.maxRole == 5) &&
              setListRoleHtml({
                code: item.maxRole,
                mType: moduleType,
                screen: !isFullScreen,
                status: item.status,
              })}

            {item.importRole && item.importRole.length > 0 && (
              <Tooltip title={getTooltipText(item.importRole)}>
                <span className="import_icon"></span>
              </Tooltip>
            )}
            {item.isFirst && (
              <span
                className="tree_plan"
                onClick={e => {
                  e.stopPropagation()
                  examinePlan(item)
                }}
              >
                查看计划
              </span>
            )}
          </div>
        </div>
      )
    }
    return (
      <div className={$c('tree_node_left', { finishedTaskColor: item.status == 2 })}>
        {selectTeamId == -1 && (
          <Avatar
            className="company_icon"
            // size={moduleType != 0 || isFullScreen ? 24 : 16}
            size={16}
            src={getOrgProfileById(item.ascriptionId)}
            style={{ marginRight: 5 }}
          ></Avatar>
        )}
        {item.planType == 2 && <span className="tree_node_per">O</span>}
        {item.planType == 3 && <span className="tree_node_per">KR</span>}
        <span className={$c('tree_node_name', { finishedTask: item.status === 2 })}>{item.name}</span>
        {item.flag === 1 && <span className="ant-tag com-tag com-tag-d">冻</span>}
        {item.cycleNum == 0 && <Tag className="com-tag com-tag-x">循</Tag>}
        {item.cycleNum > 0 && <Tag className="ant-tag long-tag com-tag-x">循 {item.cycleNum}</Tag>}
        {item.importRole && item.importRole.length > 0 && (
          <Tooltip title={getTooltipText(item.importRole)}>
            <span className="import_icon"></span>
          </Tooltip>
        )}
        {(item.maxRole == 1 || item.maxRole == 4 || item.maxRole == 5) &&
          setListRoleHtml({
            code: item.maxRole,
            mType: moduleType,
            screen: !isFullScreen,
            status: item.status,
          })}
      </div>
    )
  }
  //查看计划
  const renderTwoColums = (item: ItemProps) => {
    const typeStatus = moduleType == 0 && !isFullScreen
    if (typeStatus) {
      return ''
    }
    return (
      <div className={$c('tree_node_middle', { finishedTaskColor: item.status == 2 })}>
        {item.delayCount > 0 ? (
          <span
            className="tree_node_delay"
            onClick={e => {
              e.stopPropagation()
              openDelayList(item)
            }}
          >
            延<span style={{ marginLeft: '3px' }}>{item.delayCount}</span>
          </span>
        ) : (
          <span style={{ width: '42px', height: '1px' }}></span>
        )}
        {item.isFirst && (
          <span
            className="tree_plan"
            onClick={e => {
              e.stopPropagation()
              examinePlan(item)
            }}
          >
            查看计划
          </span>
        )}
        {/* 信心指数 */}
        {item.planType == 3 && item.cci && <span className="tree_plan tree_plan_s">{item.cci}/10</span>}
      </div>
    )
  }
  //执行人
  const RenderThreeColums = (item: ItemProps) => {
    const typeStatus = moduleType == 0 && !isFullScreen
    const [taskOptShow, setTaskOptShow] = useState(false)
    return (
      <>
        {!typeStatus && (
          <div
            className={$c('tree_node_right', {
              finishedTaskColor: item.status == 2,
              OKR: item.planType == 2 || item.planType == 3,
            })}
          >
            <span>
              <Avatar
                size={24}
                src={showProfile(item.planType, item.profile)}
                style={{ backgroundColor: '#4285f4', fontSize: 12, marginRight: 5 }}
              >
                {item.liableUsername && item.liableUsername.substr(-2, 2)}
              </Avatar>

              {item.liableUsername && (
                <Tooltip title={item.liableUsername}>
                  <span className="user_name">{item.liableUsername}</span>
                </Tooltip>
              )}
            </span>
            {item.endTime != undefined && (
              <span className={$c('end_time')}>{item.endTime.split(' ')[0].substr(5, 9)} 截止</span>
            )}
          </div>
        )}

        {/* 行hover 快捷操作 */}
        {item.planType != 2 && item.planType != 3 && (
          <div className="taskOptBtnGroup">
            <>
              <Tooltip title="汇报">
                <span className="report_icon"></span>
              </Tooltip>
              <Tooltip title="新增子任务">
                <span className="add_child_icon"></span>
              </Tooltip>
              <Tooltip title={item.isFollow ? '取消关注' : '关注'}>
                <span
                  className={$c('collect_icon', { nofollowIcon: item.isFollow })}
                  onClick={e => {
                    e.stopPropagation()
                    console.log(item.ascriptionName)
                    item.isFollow
                      ? cancleFollowTask(item.id)
                      : followTask(item.id, item.ascriptionId, item.ascriptionName)
                  }}
                ></span>
              </Tooltip>
              <Tooltip title="更多">
                <Dropdown
                  className="work_more_drop"
                  visible={taskOptShow}
                  onVisibleChange={(flag: boolean) => {
                    setTaskOptShow(flag)
                  }}
                  overlay={
                    <TaskListOpt
                      taskOptData={{
                        rowObj: item,
                        fromType: 'desk-working_team_task',
                      }}
                      code={code}
                      callback={contextMenuCallback}
                      outVisible={taskOptShow} //外部控制菜单显示隐藏
                      setVisible={(flag: boolean) => {
                        setTaskOptShow(flag)
                      }}
                      isWorkDeskIn={true}
                    />
                  }
                  trigger={['click']}
                >
                  <span className="more_icon"></span>
                </Dropdown>
              </Tooltip>
            </>
          </div>
        )}
      </>
    )
  }
  //执行进度
  const renderFourColums = (progress: any) => {
    //是否显示进度条
    const isSmallScreen = !isFullScreen && moduleType == 0
    //进度条宽度
    const w = isSmallScreen ? '36px' : '100%'
    const isLarg = moduleType === 1 || isFullScreen
    return (
      <div
        className={$c('tree_pregress_box', {
          finishedTaskColor: progress.status == 2,
          'ant-progress-none': isSmallScreen && !progress.executeTime,
          'ant-line-none': !isSmallScreen && !progress.executeTime,
        })}
      >
        {progress.color != undefined && progress.percent != undefined && (
          <div className={$c('tree_pregress', { smallPress: !isLarg, largPress: isLarg })}>
            <div className="tree_pretress_box">
              {(progress.planType == 2 || progress.planType == 3 || progress.executeTime) && (
                <ProgressCom progressItem={progress} />
              )}
              {/* {progress.planType != 2 && progress.planType != 3 && !progress.executeTime && (
                <div style={{ width: 36, textAlign: 'center' }}>-/-</div>
              )} */}
              {isSmallScreen && progress.planType != 2 && progress.planType != 3 && !progress.executeTime && (
                <Progress width={32} type="circle" percent={0} format={() => '-/-'} />
              )}
              {!isSmallScreen && progress.planType != 2 && progress.planType != 3 && !progress.executeTime && (
                <div className="ant_item_progress" style={{ width: w, textAlign: 'center' }}>
                  <Progress percent={0} status="exception" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  const getScreenInfo = () => {
    if (moduleType === 0 && !isFullScreen) {
      return {
        columnW: [18, 2, 2, 2],
        showClass: true,
      }
    } else {
      return {
        columnW: [10, 5, 5, 4],
        showClass: false,
      }
    }
  }
  //渲染列表行
  const RenderListItem = (item: ItemProps) => {
    //右键是否展示
    const [taskOptShow, setTaskOptShow] = useState(false)
    const screenParam = getScreenInfo()
    const isLarg = moduleType === 1 || isFullScreen
    const progressParams = {
      ...item.progress,
      endTime: item.endTime,
      id: item.id,
      planId: item.planId,
      status: item.status,
      flag: item.flag,
      approvalStatus: item.approvalStatus,
      taskType: item.taskType,
      planType: item.planType,
      executeTime: item.executeTime,
      isFollow: item.isFollow,
      ascriptionName: item.ascriptionName,
      ascriptionId: item.ascriptionId,
    }
    const renderRow = () => {
      return (
        <Row>
          <Col span={screenParam.columnW[0]}> {renderOneColums(item)}</Col>
          <Col span={screenParam.columnW[1]}>{renderTwoColums(item)}</Col>
          <Col span={screenParam.columnW[2]}> {RenderThreeColums(item)}</Col>
          <Col span={screenParam.columnW[3]} className={$c({ columnProgress: screenParam.showClass })}>
            {renderFourColums(progressParams)}
          </Col>
        </Row>
      )
    }
    if (item.planType === 3 || item.planType === 2) {
      return renderRow()
    }
    return (
      <Dropdown
        visible={taskOptShow}
        onVisibleChange={(flag: boolean) => {
          setTaskOptShow(flag)
        }}
        overlay={
          <TaskListOpt
            taskOptData={{
              rowObj: item,
              fromType: 'desk-working_team_task',
            }}
            code={code}
            callback={contextMenuCallback}
            outVisible={taskOptShow} //外部控制菜单显示隐藏
            setVisible={(flag: boolean) => {
              setTaskOptShow(flag)
            }}
            isWorkDeskIn={true}
          />
        }
        trigger={['contextMenu']}
      >
        {renderRow()}
      </Dropdown>
    )
  }
  const columns = [
    {
      title: '任务名称',
      dataIndex: 'item',
      key: 'item',
      className: 'one_colums',
      render: (item: ItemProps) => RenderListItem(item),
    },
  ]
  //监听所有展开的节点key
  const setRowClassName = (record: any) => {
    if (record.subTaskCount === 0) {
      return 'noExpandable'
    } else {
      return ''
    }
  }
  //展开行
  const expandedRow = (expanded: any, record: any) => {
    loadChildData(record)
  }
  // 查询任务子级
  const loadChildData = (record: any) => {
    if (record.children && record.children.length > 0) {
      return
    }
    const nowTaskId = record.key
    const param = {
      loginUserId: nowUserId,
      taskId: record.item.id,
    }
    const url = 'task/workbench/sub'
    getDataTreeNodeApi(param, url).then((resData: any) => {
      if (resData.dataList) {
        const childTaskData = resData.dataList
        const childDataItemArr: Array<DataItemProps> = childTaskData.map((item: ItemProps, index: number) => {
          return {
            item: item,
            progress: {
              ...item.progress,
              endTime: item.endTime,
              id: item.id,
              planId: item.planId,
              status: item.status,
              flag: item.flag,
              approvalStatus: item.approvalStatus,
              taskType: item.taskType,
              planType: item.planType,
              executeTime: item.executeTime,
              isFollow: item.isFollow,
              ascriptionName: item.ascriptionName,
              ascriptionId: item.ascriptionId,
            },
            key: item.id,
            subTaskCount: item.subTaskCount,
            children: item.subTaskCount == 0 ? undefined : item.children || [],
          }
        })
        //动态添加任务子任务
        const newTable = datas.concat([])
        updateTaskData(newTable, nowTaskId, childDataItemArr)

        setDatas(newTable)
      }
    })
  }
  //递归插入任务列表子元素
  const updateTaskData = (tableData: any, parentId: number, childData: Array<DataItemProps>) => {
    tableData.find((item: DataItemProps) => {
      if (item.key === parentId) {
        item.children = childData
        return tableData
      }
      if (item.children && item.children.length > 0) {
        updateTaskData(item.children, parentId, childData)
      }
    })
  }
  // 行事件
  const setRowEvent = (record: any) => {
    return {
      onClick: (e: any) => {
        e.stopPropagation()
        const className = e.target.className
        if (typeof className !== 'string') {
          return
        }
        if (className.includes('more_icon')) {
        } else if (className.includes('start_task')) {
          message.info('开启任务')
        } else if (className.includes('report_icon ant-tooltip-open')) {
          $store.dispatch({
            type: 'TASK_LIST_ROW',
            data: {
              handleBtn: {
                ...record.item,
                time: Math.floor(Math.random() * Math.floor(1000)),
              },
              type: 0,
            },
          })
          $tools.createWindow('DailySummary')
        } else if (className.includes('add_child_icon')) {
          addChildShow(event, record.item, record.key)
        } else if (jQuery(e.target).parents('.ant-table-row').length !== 0 && !className.includes('ant-menu')) {
          if (className.includes('ant-slider') || className.includes('ant_item_progress')) {
            return false
          }
          toTaskDetail(record.item)
        }
      },
      onMouseEnter: (e: any) => {
        e.stopPropagation()
      },
      onMouseLeave: (e: any) => {
        e.stopPropagation()
      },
    }
  }
  //新增子任务
  const addChildShow = (e: any, rowData: any, rowKey: any) => {
    const thisTr = jQuery(e.target).parents('tr')
    const addTr = `<tr class="addChildTaskTr"  id="addChildTaskTr"><td class="taskNameTd">
      <div class="cellCont">
        <div class="boardTaskName">
          <input type="text" class="addChildTaskInp"/>
          <div class="create_task_btn_box">
            <div
            class="sure_create_btn"></div>
            <div
            class="cancel_create_btn"
            ></div>
          </div>
        </div>
      </div>
    </td></tr>`
    if (document.getElementById('addChildTaskTr')) {
      jQuery('#addChildTaskTr').remove()
    }
    thisTr.after(addTr)
    $('.addChildTaskInp').focus()
    // 事件绑定
    jQuery('#addChildTaskTr')
      .find('.sure_create_btn')
      .off()
      .on('click', (e: any) => {
        const newName =
          jQuery(e.target)
            .parents('td')
            .find('.addChildTaskInp')
            .val() + ''
        addChildTask(rowData, newName || '', rowKey)
        jQuery(e.target)
          .parents('tr')
          .remove()
      })
    jQuery('#addChildTaskTr')
      .find('.cancel_create_btn')
      .off()
      .on('click', (e: any) => {
        jQuery(e.target)
          .parents('tr')
          .remove()
      })
  }
  //快速创建子任务
  const addChildTask = (rowData: any, newName: string, rowKey: any) => {
    quickCreateTask({
      ascriptionId: rowData.ascriptionId,
      ascriptionName: rowData.ascriptionName,
      parentId: rowData.id,
      name: newName,
      createType: 0, //0快速创建 1弹窗创建
      type: rowData.type || 0,
    }).then((res: any) => {
      const childTaskData = [res.data.data]
      const createChildArr: any = childTaskData.map((item: any) => {
        return {
          item: item,
          key: item.id,
          taskName: { ...item },
          liableUser: { name: item.executorUsername, profile: item.profile, executorId: item.executorUser },
          executeTime: item.executeTime,
          endTime: item.endTime,
          progress: {
            ...item.progress,
            executeTime: item.executeTime,
            taskId: item.id,
            endTime: item.endTime,
            id: item.id,
            planId: item.planId,
            status: item.status,
            flag: item.flag,
            approvalStatus: item.approvalStatus,
            taskType: item.taskType,
            planType: item.planType,
            isFollow: item.isFollow,
            ascriptionName: item.ascriptionName,
            ascriptionId: item.ascriptionId,
          },
          subTaskCount: item.subTaskCount,
          handleBtn: { ...item },
          children: item.subTaskCount == 0 ? undefined : item.children || [],
        }
      })
      const newTable: any = datas.concat([])
      createRowDataUpdate(newTable, rowData.id, createChildArr)
      setDatas(newTable)
      queryOneTask(rowData.id, 'createChild', rowKey)
    })
  }
  //新增子任务更新行数据
  const createRowDataUpdate = (tableData: any, parentId: number, childData: Array<DataItemProps>) => {
    tableData.map((item: DataItemProps) => {
      if (item.key === parentId) {
        if (item.children == undefined) {
          item.children = []
        }
        item.children.push(childData[0])
      }
      if (item.children && item.children.length > 0) {
        createRowDataUpdate(item.children, parentId, childData)
      }
    })
  }

  /**************************************************************table ****************************************************/

  // 前往任务详情页
  const toTaskDetail = (item: any) => {
    setCurrentTaskDetail(item)
    if (item.planType == 2 || item.planType == 3) {
      //okr类型节点专用详情弹框
      setokrDetail(true)
    } else {
      // 跳转计划详情
      setTaskdetail(true)
    }
  }

  if (datas.length == 0) {
    return <NoneData imgSrc={$tools.asAssetsPath('/images/common/none_img_icon_4.svg')} />
  }

  return (
    <>
      <Spin tip="加载中，请稍后..." spinning={loading}>
        <div className={$c('targetKanban', { isFullScreenHeight: isFullScreen })}>
          <Table
            showHeader={false}
            pagination={false}
            columns={columns}
            // loading={loading}
            dataSource={datas}
            tableLayout={'fixed'}
            onExpand={expandedRow}
            rowClassName={setRowClassName}
            defaultExpandedRowKeys={defaultExpandedRowKeys}
            onRow={setRowEvent}
            className={$c(
              'tree_node',
              { secendContaier: moduleType == 0 && !isFullScreen },
              { isFullScreen: isFullScreen || moduleType != 0 }
            )}
          />
        </div>
      </Spin>
      {/* 全屏显示页码选择 */}
      {isFullScreen && (
        <Pagination
          current={fullCurrentPage + 1}
          showSizeChanger
          className="customPagination"
          total={totalElements}
          onChange={(page, size) => {
            $store.dispatch({
              type: 'TARGET_KANBAN_QUERY',
              data: { ...queryParams, pageNo: page - 1, pageSize: size },
            })
            console.log(page)
            setFullCurrentPage(page - 1)
          }}
        />
      )}
      {/* 任务延迟列表弹窗 */}
      {delayModal && (
        <TaskDelayModal
          param={{
            masterTask: masterTask,
            visible: delayModal,
            action: {
              close: (state: any) => {
                setDelayModal(state)
              },
              openTaskDetail: (obj: any) => {
                toTaskDetail(obj)
              },
            },
          }}
        />
      )}
      {/* 任务详情页 */}
      {opentaskdetail && (
        <DetailModal
          param={{
            visible: opentaskdetail,
            from: 'workbench',
            code: 'target_kanban',
            id: currentTaskDetail.id,
            taskData: currentTaskDetail,
          }}
          setvisible={(state: any) => {
            setTaskdetail(state)
          }}
          callbackFn={(params: any) => {
            queryOneTask(currentTaskDetail.id, 'TaskDetails', params && params.types)
          }}
        ></DetailModal>
      )}
      {/* o 、kr 详情页 */}

      {okrdetail && (
        <Okrdetail
          visible={okrdetail}
          datas={{
            typeId: currentTaskDetail.id,
            id: currentTaskDetail.planId,
          }}
          mindId={currentTaskDetail.mindId}
          setvisible={(start: any) => {
            setokrDetail(start)
          }}
          openMode={(resData: any) => {
            queryOneTask(currentTaskDetail.id)
          }}
        ></Okrdetail>
      )}
    </>
  )
}
export default TargetKanban

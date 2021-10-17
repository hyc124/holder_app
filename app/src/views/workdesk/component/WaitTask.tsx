import React, { useEffect, useState } from 'react'
import { message, Progress, Avatar, Tag, Pagination, Spin } from 'antd'
import { useSelector } from 'react-redux'
import $c from 'classnames'
import NoneData from '@/src/components/none-data/none-data'
import { getOrgProfileById } from '../getData'
import { filterTaskType, ProgressColors, getDividerLine } from './TaskList'
import './wait-task.less'
// import DetailModal from '@/src/views/task/taskDetails/detailModal'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
interface ItemProps {
  id: number
  name: string
  ascriptionType: number
  ascriptionId: number
  ascriptionName: string
  status: number
  flag: number
  approvalStatus: number
  startTime: string
  endTime: string
  level: number
  property: number
  cycleNum: number
  progress: {
    percent: number
    color: number
  }
  subTaskCount: number
  type: number
  maxRole: number
  executorUser: number
  executorUsername: string
  profile: string
  today: boolean
  icon?: any
  goldModel?: any
  assignName?: any
  tagList?: []
  reportCount?: any
  opinionCount?: any
}
interface WaitModulProps {
  code: string
  moduleType: number
  isFollow: any
}
export const queryWaitData = (params: any) => {
  return new Promise((resolve, reject) => {
    $api
      .request('/task/bench/findWattingTaskList', params, {
        headers: {
          loginToken: $store.getState().loginToken,
          'Content-Type': 'application/json',
        },
      })
      .then(res => {
        if (res.returnCode == 0) {
          resolve(res)
        } else {
          reject(res)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}
//渲染进度
export const renderProgress = (progress: any, type: string) => {
  const colorIndex = progress.color > 0 ? progress.color - 1 : progress.color
  //进度条的色彩
  const strokeColor =
    ProgressColors[colorIndex] && ProgressColors[colorIndex][0] ? ProgressColors[colorIndex][0] : ''
  //未完成的分段的颜色
  const trailColor =
    ProgressColors[colorIndex] && ProgressColors[colorIndex][1] ? ProgressColors[colorIndex][1] : ''
  return (
    <Progress
      strokeColor={strokeColor}
      trailColor={trailColor}
      type={type == 'line' ? 'line' : 'circle'}
      percent={progress.percent}
      width={32}
      strokeWidth={12}
    ></Progress>
  )
}
let refresh: any = null
export const refreshWaitTask = () => {
  if (refresh) refresh()
}
const WaitTaskModul = ({ code, moduleType, isFollow }: WaitModulProps) => {
  // const [windowHeight, setWindowHeight] = useState(0)
  const { nowUserId, selectTeamId, followUserInfo, followSelectTeadId } = $store.getState()
  const selectOrgId = selectTeamId == -1 || isNaN(selectTeamId) ? '' : selectTeamId
  let followOrgId = followSelectTeadId === -1 ? '' : followSelectTeadId
  //是否处于全屏状态
  const isFullScreen = useSelector((state: any) => state.showFullScreen)
  const [taskData, setTaskData] = useState<any>([])
  //表格loading
  const [loading, setLoading] = useState(false)
  //任务id
  const [taskId, setTaskId] = useState(0)
  //数据总数
  const [totalElements, setTotalElements] = useState(0)
  //任务详情框
  const [opentaskdetail, setOpentaskdetail] = useState(false)
  //分页参数
  const [queryParam, setQueryParam] = useState({
    pageNo: 0,
    pageSize: 10,
    isConcise: 0,
  })
  const [freshPage, setFreshPage] = useState(false)
  //数据请求
  useEffect(() => {
    queryWaitTask()
  }, [queryParam, !freshPage, selectTeamId])
  //监听页面宽高适应T表格适配
  // useEffect(() => {
  //   // setWindowHeight(window.innerHeight)
  //   window.addEventListener('resize', function() {
  //     // setWindowHeight(this.window.innerHeight)
  //   })
  //   return () => {
  //     window.removeEventListener('resize', function() {
  //       // setWindowHeight(this.window.innerHeight)
  //     })
  //   }
  // }, [])
  const queryWaitTask = () => {
    setLoading(true)

    if (followOrgId == '') {
      followOrgId = selectOrgId
    }
    queryWaitData({
      ...queryParam,
      teamId: isFollow ? followOrgId : selectOrgId,
      userId: !isFollow ? nowUserId : followUserInfo.userId,
    }).then(
      (data: any) => {
        setLoading(false)
        const dataList = data.data ? data.data.content : []
        const totalElements = data.data ? data.data.totalElements : 0
        setTotalElements(totalElements)
        setTaskData(dataList)
      },
      err => {
        message.error('查询今日待办失败')
        setLoading(false)
      }
    )
  }
  refresh = () => {
    queryWaitTask()
  }
  //渲染标签
  const renderTags = (item: ItemProps) => {
    return (
      <div className="tag-list">
        {item.property === 1 && <Tag className="com-tag com-tag-m">密</Tag>}
        {item.status === 3 && <Tag className="com-tag com-tag-y">延</Tag>}
        {item.flag === 3 && <Tag className="com-tag com-tag-g">归</Tag>}
        {/* {item.approvalStatus !== 0 && <Tag className="com-tag com-tag-s">审</Tag>} */}
        {item.flag === 1 && <Tag className="com-tag com-tag-d">冻</Tag>}
        {item.goldModel != null && (
          <Tag className="boardTaskType circleNum">{item.goldModel.star || ''}星任务</Tag>
        )}
        {item.cycleNum === 0 && <Tag className="boardTaskType circleNum com-tag-x">循</Tag>}
        {item.cycleNum > 0 && <Tag className="long-tag com-tag-x">循 {item.cycleNum}</Tag>}
        {item.assignName && item.assignName && (
          <Tag color={'#E7E7E9'} className="long-tag">
            由{item.assignName}指派
          </Tag>
        )}
        {item.reportCount && item.reportCount !== 0 && (
          <Tag color={'#E7E7E9'} className="long-tag">
            汇报:{item.reportCount}
          </Tag>
        )}
        {item.opinionCount && item.opinionCount !== 0 && (
          <Tag color={'#E7E7E9'} className="long-tag">
            备注:{item.opinionCount}
          </Tag>
        )}
        {item.today === true && (
          <Tag icon={<img src={$tools.asAssetsPath('/images/common/today_task.png')} />}></Tag>
        )}
        {item.tagList && item.tagList.length !== 0 && (
          <div className="com-tag-content">
            {item.tagList.map((item: any, index: number) => (
              <span key={index} className="com-list-tag">
                {item.content}
                {getDividerLine(index, item.tagList?.length)}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }
  const lookTaskDtail = (e: any, taskId: number) => {
    e.stopPropagation()
    setTaskId(taskId)
    setOpentaskdetail(true)
  }
  return (
    <Spin tip="加载中，请稍后..." spinning={loading}>
      <div className="wait_task_wrap ">
        {taskData.length !== 0 && (
          <div className={$c('wait_task_list', { wrapRelate: isFullScreen })}>
            {taskData.map((item: ItemProps, index: number) => (
              <div
                key={index}
                className="common-task-item text-ellipsis"
                onClick={e => lookTaskDtail(e, item.id)}
              >
                {moduleType == 0 && !isFullScreen ? (
                  <div className="common-task-l-sml flex-1 flex">
                    <div className="item_top">
                      {!selectOrgId && (
                        <Avatar
                          size={16}
                          src={getOrgProfileById(item.ascriptionId)}
                          style={{ marginRight: 10 }}
                        ></Avatar>
                      )}
                      {item.icon && (
                        <img
                          className="boardTaskLabel"
                          src={$tools.asAssetsPath(`/images/task/${item.icon}.png`)}
                        />
                      )}
                      <span className="common-task-name text-ellipsis">{item.name}</span>
                      {renderTags(item)}
                    </div>
                    <div className="item_btm">
                      {filterTaskType({
                        type: item.type,
                        code: code,
                        mType: moduleType,
                        screen: isFullScreen,
                        status: item.status,
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="common-task-l flex-1 flex">
                    {!selectOrgId && (
                      <Avatar
                        size={16}
                        src={getOrgProfileById(item.ascriptionId)}
                        style={{ marginRight: 10 }}
                      ></Avatar>
                    )}
                    <span className="common-task-name text-ellipsis">{item.name}</span>
                    {item.icon && (
                      <img
                        className="boardTaskLabel"
                        src={$tools.asAssetsPath(`/images/task/${item.icon}.png`)}
                      />
                    )}
                    {filterTaskType({
                      type: item.type,
                      code: code,
                      mType: moduleType,
                      screen: isFullScreen,
                      status: item.status,
                    })}
                    {renderTags(item)}
                  </div>
                )}
                <div className="common-task-r" style={{ width: '30%' }}>
                  {!isFullScreen && moduleType == 0
                    ? renderProgress(item.progress, 'circle')
                    : renderProgress(item.progress, 'line')}
                </div>
              </div>
            ))}
            {isFullScreen && (
              <div className="wait_task_footer">
                <Pagination
                  showSizeChanger
                  current={queryParam.pageNo + 1}
                  pageSize={queryParam.pageSize}
                  total={totalElements}
                  pageSizeOptions={['5', '10', '20', '30', '50', '100']}
                  onShowSizeChange={(current, size) => {
                    setQueryParam({
                      ...queryParam,
                      pageNo: current - 1,
                      pageSize: size || 20,
                    })
                  }}
                  onChange={(page, pageSize) => {
                    setQueryParam({
                      ...queryParam,
                      pageNo: page - 1,
                      pageSize: pageSize || 20,
                    })
                  }}
                />
              </div>
            )}
          </div>
        )}
        {taskData.length == 0 && (
          <NoneData imgSrc={$tools.asAssetsPath('/images/common/none_img_icon_4.svg')} />
        )}
        {opentaskdetail && (
          <DetailModal
            param={{
              visible: opentaskdetail,
              from: '',
              id: taskId,
            }}
            setvisible={(state: any) => {
              setOpentaskdetail(state)
            }}
            callbackFn={() => {
              setFreshPage(!freshPage)
            }}
          ></DetailModal>
        )}
      </div>
    </Spin>
  )
}
export default WaitTaskModul

import React, { useEffect, useRef, useState } from 'react'
import NoneData from '@/src/components/none-data/none-data'
import './TaskList.less'
import { Avatar, Alert, List, Pagination, Spin } from 'antd'
import { useSelector, shallowEqual } from 'react-redux'
import $c from 'classnames'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import { setListRoleHtml } from './TaskList'
import { getCheckTask } from '../getData'
interface ItemProps {
  taskId: number
  taskName: string
  executorUsername: string
  profile: string
  status: number
  totalChoose: number
  finishChoose: number
  maxRole: number
}
interface Parmsprops {
  moduleType: number
  isFollow?: boolean
  refreshCode?: string
  refresh?: any
}
let refreshFn: any = null
export const refreshCheckTask = () => {
  if (refreshFn) refreshFn()
}
const CheckTask = ({ moduleType, isFollow, refreshCode, refresh }: Parmsprops) => {
  const [listdata, setListData] = useState<Array<ItemProps>>([])
  //显示隐藏任务详情
  const [opentaskdetail, setTaskdetail] = useState({ visible: false })
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId, shallowEqual)
  const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  const teamId = !isFollow ? selectTeamId : followSelectTeadId
  const isFullScreen = useSelector((state: any) => state.showFullScreen)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [queryParam, setQueryParam] = useState({
    pageNo: 0,
    pageSize: 10,
  })
  const refeshRef = useRef<any>()
  //分页查询
  useEffect(() => {
    queryList()
  }, [queryParam, teamId])

  useEffect(() => {
    if (refreshCode == 'check_task') {
      queryList()
    }
  }, [refresh])

  const queryList = () => {
    setLoading(true)
    getCheckTask(queryParam).then((data: any) => {
      setTotalElements(data.totalElements)
      const contentData: ItemProps[] = data.content
      const newTableData: Array<ItemProps> = []
      contentData.map((item: ItemProps) => {
        newTableData.push({
          taskId: item.taskId,
          taskName: item.taskName,
          executorUsername: item.executorUsername || '',
          profile: item.profile,
          status: item.status,
          totalChoose: item.totalChoose || 0,
          finishChoose: item.finishChoose || 0,
          maxRole: item.maxRole,
        })
      })
      setListData(newTableData)
      setLoading(false)
    })
  }
  refreshFn = () => {
    queryList()
  }
  //查看任务详情
  const lookTaskDetail = async (e: any, taskId: any) => {
    opentaskdetail.visible = true
    await setTaskdetail({ visible: true })
    const param = {
      visible: true,
      from: 'workbench',
      id: taskId,
      taskData: { id: taskId },
      defaultActiveKey: '4',
    }
    refeshRef.current && refeshRef.current.setState(param)
    e.stopPropagation()
    console.log(opentaskdetail)
  }
  const small = (item: ItemProps) => {
    const itemStatus = item.status == 2
    return (
      <List.Item key={item.taskId} className="small_list_item" onClick={e => lookTaskDetail(e, item.taskId)}>
        <span className={$c('status_icon', { 'finish-icon': itemStatus })}></span>
        <div className="check_item_content" style={{ flexDirection: 'column' }}>
          <span className={`${$c({ finish: itemStatus })} text-ellipsis`}>{item.taskName}</span>
          <span className={$c('check_item', { finish: itemStatus })}>
            <Avatar
              src={item.profile}
              size={24}
              style={{ background: '#4285f4', opacity: `${itemStatus ? '0.5' : '1'}`, marginRight: '12px' }}
            >
              {item.executorUsername?.substr(-2, 2)}
            </Avatar>
            负责检查项：
            <em className={$c({ finish: itemStatus })}>
              {item.finishChoose || 0}/{item.totalChoose || 0}
            </em>
            {setListRoleHtml({
              code: item.maxRole,
              mType: moduleType,
              screen: isFullScreen,
            })}
          </span>
        </div>
      </List.Item>
    )
  }

  const large = (item: ItemProps) => {
    const itemStatus = item.status == 2
    return (
      <List.Item key={item.taskId} onClick={e => lookTaskDetail(e, item.taskId)} className="">
        {/* <div> */}
        {itemStatus && <span className={$c('status_icon', { 'finish-icon': itemStatus })}></span>}
        <div className="check_item_content">
          <span className={`checklist_tit ${$c({ finish: itemStatus })} text-ellipsis`}>
            {item.taskName}
            {setListRoleHtml({
              code: item.maxRole,
              mType: moduleType,
              screen: isFullScreen,
            })}
          </span>
          <span className={$c('check_item', { finish: itemStatus })}>
            负责检查项：
            <em className={$c({ finish: itemStatus })}>
              {item.finishChoose || 0}/{item.totalChoose || 0}
            </em>
          </span>
        </div>
        {/* </div> */}
        {/* <div> */}
        <Avatar src={item.profile} style={{ background: '#4285f4', opacity: `${itemStatus ? '0.5' : '1'}` }}>
          {item.executorUsername?.substr(-2, 2)}
        </Avatar>
        <span
          className="avatar_name text-ellipsis"
          style={{ fontSize: '12px', color: `${itemStatus ? '#9A9AA2' : '#191F25'}` }}
        >
          {item.executorUsername}
        </span>
        {/* </div> */}
      </List.Item>
    )
  }
  return (
    <Spin tip="加载中，请稍后..." spinning={loading}>
      <div className="check_task_wrap">
        <div className="check_task_container" style={{ height: isFullScreen ? 'calc(100% - 50px)' : '100%' }}>
          <Alert
            message="提示：当被添加为任务检查项负责人的时候，将展示相关任务在此"
            className="check_task_tips"
            type="warning"
            showIcon
            closable
          />
          {listdata.length > 0 && (
            <List>
              {listdata.map((item: any) => {
                return !isFullScreen && moduleType == 0 ? small(item) : large(item)
              })}
            </List>
          )}
          {<DetailModal ref={refeshRef} param={{}}></DetailModal>}
          {listdata.length == 0 && (
            <NoneData imgSrc={$tools.asAssetsPath('/images/common/none_img_icon_4.svg')} />
          )}
          {isFullScreen && (
            <div className="check_footer">
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
      </div>
    </Spin>
  )
}
export default CheckTask

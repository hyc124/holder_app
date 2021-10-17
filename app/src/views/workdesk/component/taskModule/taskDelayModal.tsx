import { Avatar, Empty, Pagination, Spin, Tabs } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import React, { useEffect, useState } from 'react'
import { getTaskProgress } from '../TargetKanban'
import { getOrgProfileById } from '../../getData'
const { TabPane } = Tabs
import $c from 'classnames'

const tabsNav = [
  { title: '已完成', key: '2' },
  { title: '未完成', key: '6' },
  { title: '已延迟', key: '3' },
]

interface StateProps {
  isLoading: boolean
  filters: {
    currentTaskType: string //延期弹窗 当前任务类型
    currentPage: number //当前选择页码

    pageSize: number // 延期弹窗 页码大小
  }
  totals: number //延期弹窗 总页码
  dataList: any[]
}
const TaskDelyModal = ({ param }: any) => {
  const { nowUserId, loginToken, selectTeamId } = $store.getState()
  const { masterTask, visible, action } = param
  const [state, setState] = useState<StateProps>({
    isLoading: false,
    filters: {
      currentTaskType: '3', //延期弹窗 当前任务类型
      currentPage: 0, //当前选择页码
      pageSize: 10, // 延期弹窗 页码大小
    },
    totals: 0, //延期弹窗 总页码
    dataList: [],
  })
  // 检测任务类型变化，获取数据
  const onTabsChange = (key: string) => {
    setState({
      ...state,
      filters: {
        ...state.filters,
        currentTaskType: key,
        currentPage: 0,
      },
    })
  }

  // 监测任务模态框打开，获取任务详情列表数据
  useEffect(() => {
    getDelayList(masterTask)
  }, [state.filters])

  // 获取任务延迟列表
  const getDelayList = (item: any) => {
    const param = {
      userId: nowUserId,
      status: state.filters.currentTaskType,
      pageNo: state.filters.currentPage,
      pageSize: state.filters.pageSize,
      planId: item.planId,
      id: item.id,
    }
    setState({ ...state, isLoading: true })
    $api
      .request('/task/work/plan/workbenchDetailsStatus', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json;charset=UTF-8' },
      })
      .then(res => {
        if (res.returnCode == 0) {
          const totals = (res.data && res.data.totalElements) || 0

          const resdata: any = (res.data && res.data.content) || []
          // const dataList = state.filters.currentPage != 0 ? [...state.dataList].concat(resdata) : resdata
          const dataList = resdata

          setState({ ...state, dataList, isLoading: false, totals })
        }
      })
  }
  // 模块框详情列表项
  const RenderDetailItem = ({ ObjItem }: any) => {
    return (
      <div className="show_detail_item" onClick={() => action.openTaskDetail(ObjItem)}>
        <div className="taskCmyLogoBox ">
          {!selectTeamId && (
            <Avatar src={getOrgProfileById(ObjItem.ascriptionId)} style={{ marginRight: 10 }}></Avatar>
          )}
        </div>
        <div className="detail_left">
          <div className="task_name">
            <span className="name">{ObjItem.name}</span>
            {ObjItem.icon && (
              <img className="boardTaskLabel" src={$tools.asAssetsPath(`/images/task/${ObjItem.icon}.png`)} />
            )}
            {ObjItem.status == 3 ? <span className="boardTaskType lateShow">延</span> : ''}
            {ObjItem.flag == 3 && <span className="boardTaskType trialShow">归</span>}
            {ObjItem.property == 1 ? <span className="boardTaskType privateTag privateShow">密</span> : ''}
            {ObjItem.approvalStatus && ObjItem.approvalStatus != 0 ? (
              <span className="boardTaskType trialShow">审</span>
            ) : (
              ''
            )}
            {ObjItem.flag == 1 && <span className="boardTaskType frozenShow">冻</span>}
            {ObjItem.goldModel != null && <span className="boardTaskType star_task">星任务</span>}
            {ObjItem.cycleNum == 0 && <span className="boardTaskType circleShow">循</span>}
            {ObjItem.cycleNum > 0 && <span className="boardTaskType circleNum">循 {ObjItem.cycleNum}</span>}
            {ObjItem.forceCount > 0 && <span className="boardTaskLabel force_icon"></span>}
            {ObjItem.assignName && (
              <span className="taskMiddleLabel">
                由<i>${ObjItem.assignName}</i>指派
              </span>
            )}
            {ObjItem.reportCount > 0 && <span className="taskMiddleLabel ">汇报:{ObjItem.reportCount}</span>}
            {ObjItem.planCount > 0 && <span className="taskMiddleLabel">问题:{ObjItem.planCount}</span>}
            {ObjItem.opinionCount > 0 && <span className="taskMiddleLabel ">备注:{ObjItem.opinionCount}</span>}
            {ObjItem.today && <span className="boardTaskType today_task"></span>}
          </div>
          <div className="label_box">
            {ObjItem.tagList &&
              ObjItem.tagList.map((item: any, index: number) => (
                <span className="taskBigLabel" style={{ color: item.color, background: item.rgb }} key={index}>
                  {item.content}
                </span>
              ))}
          </div>
        </div>
        {ObjItem.executeTime && (
          <div className="percentCircleCon process_color2">{getTaskProgress(ObjItem.progress, 'circle')}</div>
        )}
        {!ObjItem.executeTime && <div style={{ width: 36, textAlign: 'center' }}>-/-</div>}
      </div>
    )
  }
  return (
    <Modal
      title={masterTask.name}
      visible={visible}
      className="taskListModal"
      width="850"
      onOk={() => action.close(false)}
      onCancel={() => action.close(false)}
      footer={null}
    >
      <Spin spinning={visible && state.isLoading} tip="加载中，请耐心等待">
        <Tabs defaultActiveKey={state.filters.currentTaskType} onChange={key => onTabsChange(key)}>
          {tabsNav.map((item: any) => (
            // eslint-disable-next-line react/jsx-no-undef
            <TabPane tab={item.title} key={item.key}>
              <div
                className={$c('show_detail_content')}
                style={{ height: state.dataList.length != 0 ? 450 : 474 }}
              >
                {state.dataList.map((item: any, index: number) => (
                  <RenderDetailItem ObjItem={item} key={index} />
                ))}
                {state.dataList.length == 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              </div>
            </TabPane>
          ))}
        </Tabs>

        {state.dataList.length != 0 && (
          <Pagination
            size="small"
            current={state.filters.currentPage + 1}
            showSizeChanger
            total={state.totals}
            className={$c('customPagination')}
            onChange={(page, size) => {
              setState({ ...state, filters: { ...state.filters, currentPage: page - 1, pageSize: size || 10 } })
            }}
          />
        )}
      </Spin>
    </Modal>
  )
}

export default TaskDelyModal

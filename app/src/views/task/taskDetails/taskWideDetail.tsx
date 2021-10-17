import React, { useEffect, useState, useImperativeHandle, useRef } from 'react'
import DetailCont from './detailCont'
import { DetailExp } from './detailRight'
import './detail.less'
import './taskWideDetail.less'

/**
 * 任务宽详情
 * @param props
 */
const TaskWideDetails = React.forwardRef(({ param }: any, ref) => {
  const { id, refresh } = param
  const [state, setState] = useState<any>({
    visible: false,
    id: '',
    refresh: 0,
    from: '',
    taskData: {},
    callbackFn: null,
  })
  const detailRef = useRef<DetailExp>({})
  /**
   * 刷新详情
   */
  useEffect(() => {
    setState({
      ...state,
      id,
      refresh: refresh,
    })
  }, [refresh])

  // ***********************暴露给父组件的方法 start**************************//
  useImperativeHandle(ref, () => ({
    /**
     * 获取当前列表是否初始化查询
     */
    wideRefreshFn: ({ id }: { id: number | string }) => {
      setState({
        ...state,
        id,
        refresh: state.refresh + 1,
      })
    },
  }))

  return (
    <DetailCont
      from="taskManage_wideDetail"
      ref={detailRef}
      taskId={state.id}
      refresh={state.refresh}
      callbackFn={state.callbackFn}
    />
  )
})

export default TaskWideDetails

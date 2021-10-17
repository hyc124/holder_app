import React, { useEffect, useRef, useState } from 'react'
import './detail.less'
import DetailOrg from './detailOrg'
import DetailRight, { DetailExp } from './detailRight'

interface DetailQuery {
  id: number | string
  query: number
}

/**
 * 任务详情内容
 */
const DetailCont = React.forwardRef(
  (
    {
      from,
      taskId,
      refresh,
      callbackFn,
      setModalState,
      defaultActiveKey,
    }: {
      from?: string
      taskId?: string | number
      refresh?: number
      callbackFn: any
      setModalState?: any
      defaultActiveKey?: string
    },
    ref
  ) => {
    const [detailQuery, setQuery] = useState<DetailQuery>({
      id: '',
      query: 0,
    })
    const leftRef = useRef<any>({})
    const rightRef = useRef<DetailExp>({})
    /**
     * 监听外部传入refresh情况下的刷新(用于兼容老版引入组件方式)
     */
    useEffect(() => {
      setQuery({ ...detailQuery, query: detailQuery.query + 1, id: taskId ? taskId : detailQuery.id })
    }, [refresh])

    /**
     * 刷新详情右侧
     */
    const refreshRight = ({ id }: { id: number | string }) => {
      rightRef.current && rightRef.current.setQuery({ id })
    }
    /**
     * 刷新详情左侧树形任务链
     */
    const refreshTaskTree = (paramObj: any) => {
      leftRef.current && leftRef.current.refreshTaskTree && leftRef.current.refreshTaskTree(paramObj)
    }
    return (
      <section className="taskDetailContainer flex h100">
        {/* 子任务组织架构 */}
        {from?.includes('wideDetail') ? (
          ''
        ) : (
          <DetailOrg
            ref={leftRef}
            taskId={detailQuery.id}
            query={detailQuery.query}
            refreshRight={refreshRight}
          />
        )}
        {/* 详情区 */}
        <DetailRight
          from={from || ''}
          ref={rightRef}
          taskId={detailQuery.id}
          refresh={detailQuery.query}
          refreshTaskTree={refreshTaskTree}
          callbackFn={callbackFn}
          setModalState={setModalState}
          defaultActiveKey={defaultActiveKey}
        />
      </section>
    )
  }
)

export default DetailCont

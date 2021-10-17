import React, { useEffect, useRef, useState } from 'react'
import DetailRight, { DetailExp } from '../taskDetails/detailRight'
import '../taskDetails/detail.less'
import OkrListOrg from '../../okr-four/work-okr-mind/okr-list-org'
import { TempOData } from '../../fourQuadrant/fourQuadrant'
import { CreateTaskModal } from '../creatTask/createTaskModal'

interface DetailQuery {
  id: number | string
  query: number
  taskData?: any
}

/**
 * 任务详情内容
 */
const OKRDetailCont = React.forwardRef(
  (
    {
      from,
      taskId,
      refresh,
      callbackFn,
      taskData,
      setModalState,
      noCloseBtn,
      okrHeaderRef,
    }: {
      from?: string
      taskId?: string | number
      taskData?: any
      refresh?: number
      callbackFn?: any
      setModalState?: any
      noCloseBtn?: boolean
      className?: string
      okrHeaderRef?: any
    },
    ref
  ) => {
    //添加ref,解决console.log报错 forwardRef render functions accept exactly two parameters: props and ref
    const [detailQuery, setQuery] = useState<DetailQuery>({
      id: '',
      query: 0,
      taskData: {},
    })
    const leftRef = useRef<any>({})
    const rightRef = useRef<DetailExp>({})
    //打开创建任务（草稿任务）
    const [opencreattask] = useState({
      visible: false,
      orgInfo: {},
      type: 0,
      taskId: '',
      taskFlag: 0,
    })
    // 创建任务弹框组件
    const createTaskRef = useRef<any>({})

    /**
     * 监听外部传入refresh情况下的刷新(用于兼容老版引入组件方式)
     */
    useEffect(() => {
      setQuery({ ...detailQuery, query: detailQuery.query + 1, id: taskId ? taskId : detailQuery.id, taskData })
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
      leftRef.current && leftRef.current.refreshTaskTree(paramObj)
    }
    // okr 数据组织结构操作
    const handleOkrList = (paramObj: any) => {
      const { type, typeId, taskFlag, hasAuth } = paramObj

      // 如果草稿任务、有权限则弹出创建任务窗口
      if (type == 1 && taskFlag == 2 && hasAuth) {
        //打开草稿详情
        openCreateTask({
          type: 1,
          taskId: typeId,
          taskFlag,
        })
        return
      }
    }
    /**
     * 打开创建任务
     */
    const openCreateTask = (infoObj: any) => {
      const createType = infoObj.type == 1 ? 'edit' : infoObj.type == 2 ? 'addChild' : 'add'
      const param: any = {
        visible: true,
        from: 'work-plan', //来源
        createType,
        endTime: '',
        addHandly: TempOData.createPlan,
        taskFlag: infoObj.taskFlag, //2草稿任务
        taskmanageData: {
          orgInfo: opencreattask.orgInfo,
        },
        id: infoObj.taskId, //任务id
        taskType: 0,
        callbacks: (_: any) => {
          // leftTreeRef &&
          //   leftTreeRef.current &&
          //   leftTreeRef.current.refreshTaskTree({ optType: 'editorTask', taskIds: [opencreattask.taskId] })
        },
      }
      if (createType == 'addChild') {
        param.parentId = TempOData.createPlan.typeId
        param.parentId = { parentId: TempOData.createPlan.typeId, parentTaskName: TempOData.createPlan.name }
        param.mainId = TempOData.mainId
      }
      createTaskRef.current && createTaskRef.current.setState(param)
    }
    return (
      <section className="taskDetailContainer flex h100">
        {/* 子任务组织架构 */}
        {from?.includes('wideDetail') && detailQuery.taskData ? (
          ''
        ) : (
          <aside className="childOrgContainer okrOrgContainer">
            <OkrListOrg
              ref={leftRef}
              data={detailQuery.taskData ? [detailQuery.taskData] : []}
              // chooseData={detailQuery.taskData}
              handleOkrList={handleOkrList}
              refreshRight={refreshRight}
              isModal={setModalState ? true : false}
              setModalState={setModalState}
              // refresh={detailQuery.query}
            />
          </aside>
        )}
        {/* 详情区 */}
        <DetailRight
          from={from || ''}
          ref={rightRef}
          taskId={detailQuery.id}
          refresh={detailQuery.query}
          refreshTaskTree={refreshTaskTree}
          callbackFn={callbackFn}
          className={`${from?.includes('OKR') ? 'OKRDetailContent' : ''}`}
          setModalState={setModalState}
          leftOrgRef={leftRef}
          noCloseBtn={noCloseBtn}
          okrHeaderRef={okrHeaderRef}
        />
        {/* 创建任务窗口 */}
        <CreateTaskModal ref={createTaskRef} />
      </section>
    )
  }
)

export default OKRDetailCont

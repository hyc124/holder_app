import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import { Modal } from 'antd'
import DetailCont from './detailCont'
import './detailModal.less'
import { DetailExp } from './detailRight'
import OKRDetailCont from '../OKRDetails/okrDetailCont'

// 控制关闭窗口
export let detailModalHandle: any = null

// 外部调用详情弹框所需传的参数
export interface DetailModalExp {
  setState?: any
  taskData?: {
    taskId: any
    type: number //2、3-okr 其他-任务详情
    from: string //'apiInit'-详情左侧初始化时请求接口方式渲染数据
  }
  [propName: string]: any
}
/**
 * 任务详情弹框
 */
const DetailModal = forwardRef(
  (
    {
      param,
      setvisible,
      callbackFn,
      setActiveKey,
    }: {
      param?: {
        visible?: boolean
        from?: string
        id?: number | string
        taskData?: any
        [propName: string]: any
        defaultActiveKey?: string
      }
      setvisible?: any
      callbackFn?: any
      setActiveKey?: (activeKey: string) => void
    },
    ref
  ) => {
    const { visible, id, from } = param || {}
    const [state, setState] = useState<any>({
      visible: false,
      id: '',
      refresh: 0,
      from: '',
      taskData: {},
      setvisible: null,
      callbackFn: null,
      taskType: '', //okr:okr弹框
      defaultActiveKey: '1',
    })
    const detailRef = useRef<DetailExp>({})
    /**
     * 弹框显示时初始化设置
     */
    const detailModalInit = (paramObj: any) => {
      if (paramObj.visible) {
        // okr详情中四象限初始化时createType需为1才会请求接口初始化（位置：fourQuadrant.tsx 1133行getPlanList）
        const { fromPlanTotype } = $store.getState()
        $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
      }
      const { id } = paramObj
      const getId = paramObj.id ? paramObj.id : id
      // 兼容旧版显示隐藏方式:setvisible
      const newState: any = { ...state, taskType: '', ...paramObj, from: from || '', setvisible }
      if (getId) {
        newState.id = getId
        newState.refresh = new Date().getTime().toString()
      }
      setState({ ...newState })
    }
    // *********详情弹框显示隐藏的3种方式**********//
    /**
     * 方式1：监听外部传入的visible状态（用于兼容老版引入详情组件的入口方式）
     */
    useEffect(() => {
      if (visible) {
        detailModalInit({ visible, id, callbackFn })
      } else if (visible !== undefined) {
        setState({ ...state, visible: false })
      }
    }, [param])
    /**
     * 初始化监听
     */
    useEffect(() => {
      // 方式2：用于没有父子和兄弟关系的组件调用详情弹框，设置state
      detailModalHandle = (paramObj: { visible: boolean }) => {
        const getVisible = paramObj.visible
        if (getVisible) {
          detailModalInit(paramObj)
        } else {
          if (setvisible) {
            setvisible(getVisible)
            setState({ ...state, visible: false })
          } else {
            setState({ ...state, visible: false })
          }
        }
      }
    }, [])
    // ***********************暴露给父组件的方法**************************//
    useImperativeHandle(
      ref,
      (): DetailModalExp => ({
        /**
         * 方式3：使用ref方法设置详情state
         */
        setState: (paramObj: any) => {
          // console.log('打开模态框参数：', paramObj)

          if (paramObj.visible) {
            // okr详情中四象限初始化时createType需为1才会请求接口初始化（位置：fourQuadrant.tsx 1133行getPlanList）
            const { fromPlanTotype } = $store.getState()
            $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
          }
          const refresh = new Date().getTime().toString()
          const newParm = paramObj
          if (from) {
            newParm.from = from
          }
          let taskType =
            newParm.taskData && (newParm.taskData.type == 2 || newParm.taskData.type == 3) ? 'okr' : ''
          if (newParm.taskType) {
            taskType = newParm.taskType
          }
          setState({ ...state, ...newParm, taskType, refresh })
        },
      })
    )
    /**
     * 点击弹框自由关闭按钮关闭弹框
     */
    const handleCancel = () => {
      const ev: any = event
      if ($(ev.target) && $(ev.target)[0].tagName == 'INPUT') {
        return
      }

      if (setvisible) {
        setvisible(false)
      }
      setState({ ...state, visible: false })
    }

    /**
     * 点击任务备注关闭按钮关闭弹框
     */
    const closeModal = () => {
      const ev: any = event
      if ($(ev.target) && $(ev.target)[0].tagName == 'INPUT') {
        return
      }
      if (setvisible) {
        setvisible(false)
      }
      if (setActiveKey) {
        setActiveKey('')
      }
      setState({ ...state, visible: false })
    }

    return (
      <>
        {state.visible ? (
          <Modal
            title={false}
            visible={state.visible}
            onCancel={handleCancel}
            maskClosable={true}
            keyboard={false}
            className={`taskDetailModal ${state.taskType == 'okr' ? 'okrDetailModal' : ''}`}
            footer={null}
            confirmLoading={true}
          >
            {/* 任务类型弹框 */}
            {state.visible && state.taskType != 'okr' && (
              <DetailCont
                from={state.from || ''}
                ref={detailRef}
                taskId={state.id}
                refresh={state.refresh}
                callbackFn={state.callbackFn}
                defaultActiveKey={state.defaultActiveKey}
                setModalState={closeModal}
              />
            )}
            {/* okr弹框 */}
            {state.visible && state.taskType == 'okr' && (
              <OKRDetailCont
                from={state.from + '_OKR'}
                ref={detailRef}
                taskId={state.id}
                taskData={state.taskData}
                refresh={state.refresh}
                callbackFn={state.callbackFn}
                setModalState={closeModal}
              />
            )}
          </Modal>
        ) : (
          ''
        )}
      </>
    )
  }
)
export default DetailModal

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Button, Modal } from 'antd'
import { OkrTableList } from '../../okr-four/okrTableList/okrTableList'
import './okrFollowUpModal.less'
import './okrFollowUpHeader.less'
/**
 * okr跟进穿透列表弹框
 */
export const OkrFollowUpModal = forwardRef(
  ({ refreshRiskSectionData }: { refreshRiskSectionData?: () => void }, ref) => {
    const [state, setState] = useState<any>({
      visible: false,
      refresh: 0,
      columns: [],
      contentList: [],
      findType: 'risk',
      queryParam: {},
    })
    // 表格组件
    const tableRef = useRef<any>({})
    // 头部组件
    const headerRef = useRef<any>({})
    // 监听弹框显示时初始化列表
    useEffect(() => {
      if (state.visible) {
        tableRef.current &&
          tableRef.current.initFn({ findType: state.findType, state: 0, queryParam: state.queryParam })
        headerRef.current &&
          headerRef.current.initFn({ findType: state.findType, queryParam: state.queryParam })
      }
    }, [state.visible])
    /**
     * 点击弹框自由关闭按钮关闭弹框
     */
    const handleCancel = () => {
      setState({ ...state, visible: false })
    }
    /**
     * 暴露给父组件的方法
     */
    useImperativeHandle(ref, () => ({
      /**
       * 刷新方法
       */
      setState: (paramObj: any) => {
        setState({ ...state, ...paramObj })
        console.log('1----------------', paramObj)
      },
    }))
    return (
      <Modal
        className="okrFollowUpModal"
        width={1200}
        title={
          <OkrFollowUpHeader
            ref={headerRef}
            tableRef={tableRef}
            visible={state.visible}
            findType={state.findType}
            queryParam={state.queryParam}
          />
        }
        visible={state.visible}
        onCancel={handleCancel}
        keyboard={false}
        maskClosable={false}
        footer={[
          <Button
            key="back"
            className="defaut-primary-btn"
            onClick={() => {
              setState({ ...state, visible: false })
            }}
          >
            取消
          </Button>,
        ]}
        destroyOnClose={false}
      >
        <OkrTableList ref={tableRef} initType="ref" sourceKey={'okrFollowUpModalTable'} />
      </Modal>
    )
  }
)
/**
 * 根据列表面板头部
 */
export const OkrFollowUpHeader = forwardRef(({ tableRef }: any, ref) => {
  const [state, setState] = useState<any>({
    active: 0,
    findType: 'risk',
    okrNavList: [],
  })

  // useEffect(() => {
  // }, [])

  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    /**
     * 刷新方法
     */
    initFn: (paramObj: any) => {
      initFn(paramObj)
    },
  }))
  /**
   * 初始化方法
   */
  const initFn = ({ findType, queryParam }: any) => {
    let okrRiskList: any = [
      { content: '全部', status: 0 },
      { content: '信心低于5', status: 1 },
      { content: '有风险', status: 2 },
      { content: '已延迟', status: 3 },
    ]
    if (findType == 'updateRate') {
      okrRiskList = [
        { content: '未更新', status: 0 },
        { content: '已更新', status: 1 },
      ]
    } else if (findType == 'state') {
      okrRiskList = [
        { content: '有风险', status: 1 },
        { content: '延迟', status: 3 },
        { content: '正常', status: 0 },
        { content: '超前', status: 2 },
      ]
    }
    const activeKey = 0
    setState({
      ...state,
      active: activeKey || 0,
      findType,
      okrNavList: [...okrRiskList],
      queryParam,
    })
  }
  return (
    <header className="okrFollowUpHeader">
      <ul className="flex center-v okrRiskFollowUp">
        {state.okrNavList.map((item: any, i: number) => {
          return (
            <li
              key={i}
              className={`${state.active == i ? 'active' : ''}`}
              onClick={() => {
                setState({ ...state, active: i })
                tableRef.current &&
                  tableRef.current.initFn({
                    status: item.status,
                    findType: state.findType,
                    queryParam: state.queryParam,
                  })
              }}
            >
              <span>{item.content}</span>
              <em className="bot_line"></em>
            </li>
          )
        })}
      </ul>
    </header>
  )
})

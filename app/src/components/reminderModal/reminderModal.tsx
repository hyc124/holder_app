import React, { useEffect, useImperativeHandle, useState } from 'react'
import { Button, Modal } from 'antd'
import './reminderModal.less'
interface RemindState {
  visible: boolean //弹框显示
  content: string //提示内容
  title?: string //标题
  sureBtn?: boolean //确定按钮显示
  cancelBtn?: boolean //取消按钮显示
  sureTxt?: string //确定按钮文本
  cancelTxt?: string //取消按钮文本
  onSure?: any //点击确定后的回调
  onCancel?: any //点击取消后的回调
  onClose?: any //点击确定或取消后弹框关闭的回调
  className?: string
  autoClose?: boolean
  zIndex?: number
}

export let setReminder: any = null
export let reminderModalVisible = false
/**
 * 二次提醒弹框
 */
const ReminderModal = React.forwardRef(({ className }: { className?: string }, ref) => {
  const stateInit = {
    visible: false,
    content: '',
    sureBtn: true,
    cancelBtn: true,
    autoClose: true,
    zIndex: 99999999999,
  }
  const classNames = className || ''
  const [state, setState] = useState<RemindState>(stateInit)

  useEffect(() => {
    setReminder = (paramObj: RemindState) => {
      // 已经显示则不再显示
      // if (paramObj.visible && state.visible) {
      //   return
      // }
      // if (paramObj.autoClose == undefined) {
      //   paramObj.autoClose = true
      // }
      setState({ ...state, ...paramObj })
    }
  }, [])
  // ***********************暴露给父组件的方法**************************//
  useImperativeHandle(ref, () => ({
    setState: (paramObj: RemindState) => {
      // 已经显示则不再显示
      // if (paramObj.visible && state.visible) {
      //   return
      // }
      // if (paramObj.autoClose == undefined) {
      //   paramObj.autoClose = true
      // }
      setState({ ...state, ...paramObj })
    },
  }))

  /**
   * 点击确定
   */
  const handleOk = () => {
    reminderModalVisible = false
    if (state.onSure) {
      state.onSure()
    }
    if (state.onClose) {
      state.onClose({ handle: 'sure' })
    }
    if (state.autoClose != undefined && state.autoClose) {
      setState({ ...state, visible: false })
    }
  }
  /**
   * 点击取消
   */
  const handleCancel = () => {
    reminderModalVisible = false
    if (state.onCancel) {
      state.onCancel()
    }
    if (state.onClose) {
      state.onClose({ handle: 'cancel' })
    }
    // if (state.autoClose != undefined && state.autoClose) {
    setState({ ...state, visible: false })
    // }
  }
  return (
    <Modal
      className={`baseModal radius16 reminderModal ${state.className ? state.className : classNames}`}
      // maskTransitionName="none"
      // destroyOnClose={true}
      width={398}
      visible={state.visible}
      title={state.title || '操作提示'}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      keyboard={false}
      zIndex={state.zIndex || 9}
      footer={[
        <Button
          className={`cancelBtn ${state.cancelBtn ? '' : 'forcedHide'}`}
          key="cancel"
          onClick={handleCancel}
        >
          {state.cancelTxt || '取消'}
        </Button>,
        <Button
          className={`sureBtn ${state.sureBtn ? '' : 'forcedHide'}`}
          key="submit"
          type="primary"
          onClick={handleOk}
        >
          {state.sureTxt || '确定'}
        </Button>,
      ]}
    >
      <p className="remind_content">{state.content || ''}</p>
    </Modal>
  )
})

export default ReminderModal

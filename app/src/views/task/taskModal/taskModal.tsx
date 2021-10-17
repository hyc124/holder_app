import React from 'react'
import { Modal, Button } from 'antd'
import './taskModal.less'
/**
 * 设置优先级时被占用时的二次提醒弹框
 */
export const PriorityWarn = (props: {
  param: { visible: boolean; taskName: string; person: string; star: number; onOk: () => void }
  action: any
}) => {
  const { param, action } = props
  const { visible, taskName, person, star, onOk } = param
  // 弹框显示隐藏
  // ========点击确认===========//
  const handleOk = () => {
    action.setVisible(false)
    onOk()
  }
  // ========点击取消===========//
  const handleCancel = () => {
    action.setVisible(false)
  }
  return (
    <Modal
      className="baseModal taskPriorityWarn"
      visible={visible}
      title="提醒"
      onOk={handleOk}
      onCancel={handleCancel}
      width={395}
      centered={true}
      footer={[
        <Button key="back" onClick={handleOk}>
          仍要使用
        </Button>,
        <Button key="submit" type="primary" onClick={handleCancel}>
          放弃使用
        </Button>,
      ]}
    >
      <div className="priority_task">
        <p className="priority_task_name">
          <span>{taskName}</span>
          <em>
            {star}
            <i className="img_icon"></i>
          </em>
        </p>
        <p className="priority_task_duty">责任人：{person}</p>
      </div>
      <div className="priority_tips">
        <span>{star}星优先级已被该任务占用，如果仍要使用该优先级，则此任务的优 先级将去除！仍要使用吗？</span>
      </div>
    </Modal>
  )
}

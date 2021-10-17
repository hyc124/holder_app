import React, { useState, useEffect } from 'react'
import { Modal, Button } from 'antd'
import './fileDetailModal.less'

import { FilesList } from '../fileDetail/fileDetail'
/**
 * 附件详情弹框
 */
export const FileDetailModal = ({
  param,
  action,
}: {
  param: { visible: boolean; taskId: string; ascriptionId: string; titName: string }
  action: any
}) => {
  const { visible, taskId, ascriptionId, titName } = param
  // 弹框显示隐藏
  const [modalVisible, setVisible] = useState(false)
  // 附件列表参数
  const [fileParam, setFileParam] = useState<any>({
    taskId,
    ascriptionId,
  })
  // ========点击确认===========//
  const handleOk = () => {
    action.setVisible(false)
  }
  // ========点击取消===========//
  const handleCancel = () => {
    action.setVisible(false)
  }
  useEffect(() => {
    setVisible(visible)
    if (visible) {
      setFileParam({
        taskId,
        ascriptionId,
      })
    }
  }, [visible])

  return (
    <Modal
      className="baseModal fileDetailModal"
      visible={modalVisible}
      title={titName}
      onOk={handleOk}
      onCancel={handleCancel}
      width={850}
      centered={true}
      footer={[
        <Button key="back" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          确定
        </Button>,
      ]}
    >
      {/* 附件列表 */}
      <FilesList param={fileParam} />
    </Modal>
  )
}

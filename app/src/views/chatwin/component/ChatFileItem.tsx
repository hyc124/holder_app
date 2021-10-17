import React, { useState, useEffect, memo } from 'react'
import { Tooltip, Button, Avatar, Modal } from 'antd'
import { getFileIcon, sendToMessage } from '../getData/ChatHandle'
import { downloadFile } from '@/src/components/download-footer/downloadFile'
interface FileItemProps {
  index?: number
  dir: string
  src?: string
  fileKey: string
  fileName: string
  fileSize: number
  username: string
  time: string
  type: number
  timestamp: string
  btnLoading?: any
  mobileOfficeUrl?: any
  fileGuid?: string
  downloadUrl?: string
}

const CollectFileItem: React.FC<FileItemProps> = ({
  dir,
  src,
  fileName,
  fileSize,
  username,
  time,
  type,
  timestamp,
  mobileOfficeUrl,
  fileGuid,
  downloadUrl,
}) => {
  //发送到群弹窗
  const [visible, setVisible] = useState(false)
  //弹窗异步loading
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [btnLoading, setBtnLoading] = useState(false)

  const [fileUrl, setFileUrl] = useState('')
  const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
  const ext = fileName
    .toLowerCase()
    .split('.')
    .splice(-1)[0]

  //显示发送到群弹窗
  const showModal = () => {
    setVisible(true)
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const sureSendToRoom = () => {
    setConfirmLoading(true)
    const value = {
      type: 2,
      subType: 2,
      fileUrl: fileUrl,
      fileName: fileName,
      fileSize: fileSize,
      fileGUID: fileGuid,
      officeUrl: src,
      mobileOfficeUrl: mobileOfficeUrl ? mobileOfficeUrl : '',
      downloadUrl: downloadUrl ? downloadUrl : '',
      fileKey: fileGuid,
      time: new Date().getTime(),
    }
    // 发送消息
    const { selectItem } = $store.getState()
    sendToMessage(value, selectItem)
    // 关闭弹窗和loading
    setTimeout(() => {
      setVisible(false)
      setConfirmLoading(false)
    }, 2000)
  }

  // 渲染提示信息
  const renderNotice = () => {
    let newCont = ''
    if (!$tools.imgFormatArr.includes(ext)) {
      newCont = `确定将【文件】${fileName} 发送到群?`
    } else {
      newCont = `确定将【图片】${fileName} 发送到群?`
    }
    return newCont
  }

  //渲染附件列表
  useEffect(() => {
    if (imgFormatArr.includes(ext) && src) {
      setFileUrl(src)
    } else {
      setFileUrl(getFileIcon(ext))
    }
  }, [])

  return (
    <>
      <Avatar className="file-avatar" shape={'square'} src={fileUrl}></Avatar>
      <div className="collect-info">
        <span className="collect-title text-ellipsis">{fileName}</span>
        <div className="show_handle">
          <span className="username">{username}</span>
          <div className="right-info flex center">
            <Tooltip title="发送到群">
              <Button type="ghost" className="send-btn" onClick={showModal}></Button>
            </Tooltip>
            <Tooltip title="下载">
              <Button
                type="ghost"
                className="file-download"
                onClick={() => {
                  setBtnLoading(true)
                  downloadFile({
                    fileName,
                    fileKey: fileGuid ? fileGuid : '',
                    fileSize,
                    dir: dir || '',
                    fromType: 'chatwin',
                  })
                  setTimeout(() => {
                    setBtnLoading(false)
                  }, 3000)
                }}
                loading={btnLoading}
                value={[timestamp, type + '']}
              ></Button>
            </Tooltip>
            <span className="time">{time}</span>
          </div>
        </div>
      </div>
      {visible && (
        <Modal
          className="collect-modal"
          width={380}
          title="提示"
          visible={visible}
          centered={true}
          onOk={sureSendToRoom}
          confirmLoading={confirmLoading}
          onCancel={handleCancel}
        >
          {renderNotice()}
        </Modal>
      )}
    </>
  )
}

export default memo(CollectFileItem)

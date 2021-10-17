import React from 'react'
import { shell } from 'electron'
import { Modal, Button } from 'antd'
//文件被删除后的弹窗
const NoneFindFileModal = ({ visible, path, onClose }: any) => {
  //打开默认下载文件夹
  const openNormalFolder = () => {
    const isMac = process.platform === 'darwin'
    if (isMac) {
      const _path: any = path.slice(0, path.lastIndexOf(`/`))
      shell.openExternal(_path)
    } else {
      shell.openExternal('C:\\oaDownLoad\\.')
    }
  }
  return (
    <Modal
      title={'操作提示'}
      width={400}
      centered
      visible={visible}
      onCancel={onClose}
      className="none-file-modal"
      footer={
        <>
          <Button className="open-folder" type="default" onClick={openNormalFolder}>
            打开文件夹
          </Button>
          <Button type="default" onClick={onClose}>
            取消
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 14, textAlign: 'center' }}>
        文件夹无该文件，可能被删除或移动。
        <br />
        是否继续打开文件夹查看其它文件？
      </p>
    </Modal>
  )
}

export default NoneFindFileModal

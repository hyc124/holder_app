/**
 * @description 其他文件渲染
 * @module ApplyAttachment
 */
import { addBrowse, useMergeState } from '@/src/views/chat-history/ChatItem'
import PdfModal from '@/src/views/mettingManage/component/PdfTest'
import { message, Progress, Spin } from 'antd'
import React, { memo } from 'react'
import { getFileIcon } from '../../getData/ChatHandle'
import { suffix } from './common'

interface Attachment {
  attachParam: {
    sendstate?: any
    name: string
    process?: number
    fileGUID: string
    downloadUrl: string
    officeUrl: string
    isReply?: boolean
  }
}

const ApplyAttachment: React.FC<Attachment> = props => {
  const { sendstate, name, process, fileGUID, officeUrl, downloadUrl, isReply } = props.attachParam
  const $suffix = suffix(name)
  //附件预览需要的参数
  const [attach, attachSet] = useMergeState({
    visible: false,
    pdfUrl: '',
    pdfTiele: '',
  })
  const attachPreview = () => {
    if (sendstate !== '-1') {
      const $suffix = suffix(name)
      if (!$tools.fileFormatArr.includes($suffix)) {
        return message.warning('该文件类型不支持预览')
      }
      addBrowse(fileGUID || '') //预览需要调用此接口
      if ($suffix === 'pdf') {
        attachSet({
          visible: true,
          pdfUrl: downloadUrl,
        })
      } else {
        const a = document.createElement('a')
        a.href = officeUrl + '&holderView=1'
        a.target = '_blank'
        a.click()
      }
    }
  }
  return (
    <div className="" style={{ position: 'relative' }}>
      {!$tools.imgFormatArr.includes($suffix) && (
        <div className="file-item-box flex center-v" onClick={attachPreview} onDoubleClick={() => null}>
          <img src={getFileIcon($suffix, '')} />
          <span className="file-name">{name}</span>
          {!isReply && process && process >= 0 && process < 100 && (
            <Progress
              type="line"
              strokeColor={{
                from: '#108ee9',
                to: '#87d068',
              }}
              strokeWidth={6}
              percent={process}
            ></Progress>
          )}
        </div>
      )}
      {attach.visible && (
        <PdfModal
          pdfUrl={attach.pdfUrl}
          visible={attach.visible}
          setVsible={(state: boolean) => {
            attachSet({ visible: state })
          }}
        />
      )}
    </div>
  )
}
export default memo(ApplyAttachment)

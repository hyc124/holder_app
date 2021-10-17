import React, { useState, memo } from 'react'
import { Spin, message } from 'antd'
import { getFileIcon } from '../getData/ChatHandle'
import { addBrowse } from '../../chat-history/ChatItem'
import { useMergeState } from '../chatwin'
import PdfModal from '../../mettingManage/component/PdfTest'

interface ReplyFileMsgProps {
  fileGUID: string
  fileName: string
  fileUrl: string
  downloadUrl: string
  fileExt: string
}

const ReplyFileMsg: React.FC<ReplyFileMsgProps> = ({ fileGUID, fileName, fileUrl, downloadUrl, fileExt }) => {
  //   预览加载状态
  const [btnLoad, setBtnLoad] = useState(false)
  //pdf预览参数
  const [pdfInfo, setPdfInfo] = useMergeState({
    preFileVisible: false,
    preFileUrl: '',
    preTitle: '',
  })
  return (
    <div className="message-info" style={{ position: 'relative' }}>
      {!$tools.imgFormatArr.includes(fileExt) && (
        <Spin spinning={btnLoad}>
          <div
            className="file-item-box"
            onClick={() => {
              const ext = fileName
                .toLowerCase()
                .split('.')
                .splice(-1)[0]
              if ($tools.fileFormatArr.includes(ext)) {
                addBrowse(fileGUID || '') //预览需要调用此接口
                if (ext === 'pdf') {
                  setPdfInfo({
                    preFileVisible: true,
                    preFileUrl: downloadUrl,
                  })
                } else {
                  setBtnLoad(true)

                  $store.dispatch({
                    type: 'SET_FILE_OFFICE_URL',
                    data: {
                      url: fileUrl,
                      fileName: fileName,
                    },
                  })
                  $tools.createWindow('fileWindow').finally(() => {
                    setBtnLoad(false)
                  })
                }
              } else {
                message.warning('该文件类型不支持预览')
              }
            }}
          >
            <img src={getFileIcon(fileExt, '')} />
            <span className="file-name">{fileName}</span>
          </div>
        </Spin>
      )}
      {pdfInfo.preFileVisible && (
        <PdfModal
          pdfUrl={pdfInfo.preFileUrl}
          visible={pdfInfo.preFileVisible}
          setVsible={(state: boolean) => {
            setPdfInfo({ preFileVisible: state })
          }}
        />
      )}
    </div>
  )
}

export default memo(ReplyFileMsg)

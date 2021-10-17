import { ImgscaleBtn } from '@/src/views/mettingManage/component/RenderUplodFile'
import { Tooltip } from 'antd'
import { ipcRenderer } from 'electron'
import React, { useEffect, useState } from 'react'

export const WinTitleBar = ({
  changeImgKey,
  params,
  changeImgSize,
  changeRotate,
  photoDownLoadFn,
  changeRestoreSize,
  closePageHandle,
}: any) => {
  const [state, setState] = useState<any>({
    restoreFlag: 0, //0自适应窗口状态，1还原图片原本大小
    fromType: '', //从哪个页面来的
  })
  const isMac = process.platform == 'darwin'
  const handleWinBtn = (type: string) => {
    if (type == 'win_close') {
      closePageHandle()
    }

    setTimeout(() => {
      const winHash = window.location.hash.split('/')[1]
      ipcRenderer.send(type, { winHash })
    }, 100)
  }
  useEffect(() => {
    if (params?.fileList?.length > 0) {
      const { fileObj } = $store.getState()
      setState({ ...state, fromType: fileObj?.fromType })
    }
  }, [params.fileList])
  return (
    <div className="win_titleBar win-drag flex between center-v">
      <div className="flex center-v titleLeft">
        {/* 上一页下一页 */}
        <div className={`back_next_box flex center-v ${isMac ? 'back_next_box_mac' : ''}`}>
          <span
            className={`handle_btn win-no-drag back_page ${params.currentIndex < 1 ? 'back_disable' : ''}`}
            onClick={e => {
              if (params.currentIndex < 1) {
                e.preventDefault()
              } else {
                changeImgKey(-1)
              }
            }}
          ></span>
          <span
            className={`handle_btn win-no-drag next_page ${
              params.currentIndex < params.fileList.length - 1 ? '' : 'next_disable'
            }`}
            onClick={e => {
              if (params.currentIndex < params.fileList.length - 1) {
                changeImgKey(1)
              } else {
                e.preventDefault()
              }
            }}
          ></span>
        </div>
        {/* 竖分割线 */}
        <span className="titleLeft_line"></span>
        {/* 操作按钮 */}
        <div>
          {/* 放大 */}
          <span
            className="handle_btn mr24 win-no-drag to_max_pic"
            onClick={() => {
              changeImgSize(1)
            }}
          ></span>
          {/* 缩小 */}
          <span
            className="handle_btn  mr24 win-no-drag to_min_pic"
            onClick={() => {
              changeImgSize(-1)
            }}
          ></span>
          {/* 还原图片大小 */}
          <Tooltip placement="bottom" title={state.restoreFlag ? '原始尺寸' : '适应页面'}>
            <span
              className="handle_btn  mr24 win-no-drag to_restore_pic"
              onClick={() => {
                const flag = state.restoreFlag == 0 ? 1 : 0
                setState({ ...state, restoreFlag: flag })
                changeRestoreSize(flag)
              }}
            ></span>
          </Tooltip>

          {/* 旋转 */}
          <span
            className="handle_btn  mr24 win-no-drag to_rotate_pic"
            onClick={() => {
              changeRotate()
            }}
          ></span>
          {/* 下载 */}
          {state.fromType != 'richText' && state.fromType != 'chatWinRichText' && (
            <span
              className="handle_btn win-no-drag to_download_pic"
              onClick={() => {
                photoDownLoadFn()
              }}
            ></span>
          )}
        </div>
      </div>
      {isMac ? (
        ''
      ) : (
        <div className="titleRigth">
          <span
            className="win_btn win-min win-no-drag"
            onClick={() => {
              handleWinBtn('window_min')
            }}
          ></span>
          <span
            className="win_btn win-allSreen win-no-drag"
            onClick={() => {
              handleWinBtn('window_restore')
            }}
          ></span>
          <span
            className="win_btn win-close win-no-drag"
            onClick={() => {
              handleWinBtn('win_close')
            }}
          ></span>
        </div>
      )}
    </div>
  )
}

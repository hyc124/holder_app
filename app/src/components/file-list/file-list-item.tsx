import React, { useState, useEffect } from 'react'
import { getFileIcon } from '@/src/common/js/math'
// import { PhotoConsumer } from 'react-photo-view'
import { PreviewModal } from '../upload-file'
import { downloadFile } from '../download-footer/downloadFile'
import { Imgscale, DragImg, reZR, CheckRes } from '@/src/components/upload-file/index'
// import { Progress } from 'antd'
import '@/src/styles/task-com.less'
import { message } from 'antd'
interface FileListItemProps {
  fileName: string
  fileKey: string
  fileSize: number
  dir: string
  index: number
  uploadUser: string
  uploadDate: string
  progress?: number //当前附件上传进度(上传附件展示时使用，fileProgress需为true)
  photosRef?: any
  getPhotosRef: any
  fileStyle?: string
  canDel?: boolean //是否可删除
  delFile?: any
  fileProgress?: boolean //是否显示进度(上传附件展示时使用)
  fileGUID?: string
  downloadUrl?: string
}

// 进度更新的定时器
const timersObj: any = {}
//处理文件大小
export const getFileShowSize = (fileSize: number) => {
  const mSize: any = Number(((fileSize / (1024 * 1024)) * 100).toFixed(0)) / 100
  let showSize = ''
  if (mSize == 0) {
    showSize = Number(((fileSize / 1024) * 100).toFixed(0)) / 100 + 'KB'
  } else {
    showSize = mSize + 'M'
  }
  return showSize
}

//根据hash判断附件下载来源1111111
export const getLocationFormType = (hash: string) => {
  const realHash = hash.split('/')[1]
  if (realHash === 'approval' || realHash === 'chatwin' || realHash === 'approval-execute') {
    //审批窗口
    return realHash
  } else {
    //沟通窗口
    return 'mainWin'
  }
}

/**
 * 附件
 */
const FileListItem = (props: FileListItemProps) => {
  const {
    fileName,
    fileGUID,
    dir,
    index,
    fileSize,
    progress,
    getPhotosRef,
    fileStyle,
    canDel,
    delFile,
    fileProgress,
    downloadUrl,
  } = props
  const fileKey = fileGUID ? fileGUID : props.fileKey
  const [fileUrl, setFileUrl] = useState('')
  const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
  const ext = fileName
    .toLowerCase()
    .split('.')
    .splice(-1)[0]
  //显示预览弹窗
  const [showPreview, setShowPreview] = useState(false)
  //预览详情
  const [previewInfo] = useState<any>(null)
  //渲染附件列表
  useEffect(() => {
    let isUnmounted = false
    if (imgFormatArr.includes(ext)) {
      if (downloadUrl) {
        setFileUrl(downloadUrl)
      } else {
        $tools.getUrlByKey(fileKey, dir).then((url: string) => {
          !isUnmounted && setFileUrl(url)
        })
      }
    } else {
      setFileUrl(getFileIcon(ext))
    }
    return () => {
      isUnmounted = true
    }
  }, [fileKey])

  const setFileInfo = (fileInfo: any) => {
    return {
      fileName: fileInfo.fileName,
      fileKey: fileInfo.fileKey,
      fileSize: fileInfo.fileSize || 0,
      dir: fileInfo.dir,
      uploadUser: fileInfo.uploadUser || '',
      uploadDate: fileInfo.uploadDate || '',
    }
  }
  //关闭预览弹窗
  const closePreviewModal = () => {
    setShowPreview(false)
  }
  //图片放大缩小
  const scaleFn = () => {
    Imgscale()
    DragImg()
    CheckRes()
    reZR()
  }
  const judegFile = (e: any) => {
    // 判断文件类型 支持预览重新打开页面
    const fileFormatArr = ['ppt', 'pptx', 'xlsx', 'xls', 'doc', 'docx', 'txt', 'pdf']
    if (fileFormatArr.includes(ext)) {
      const getFileInfo = setFileInfo(props)
      // const photoRef = getPhotosRef()
      // photoRef.current.onPreviewImg({
      //   nowSrc: fileUrl,
      //   areaDom: $(e.currentTarget).parents('.file-container'),
      //   fileinfo: getFileInfo,
      // })
      $store.dispatch({ type: 'SET_SP_VALUE', data: getFileInfo })
      $tools.createWindow('seeFileWin', { sendOptions: [] }).then(() => {})
    } else {
      message.warning('该文件类型不支持预览')
    }
  }
  const fromType = getLocationFormType(window.location.hash)
  return (
    <>
      {fileUrl !== '' && imgFormatArr.includes(ext) && (
        // <PhotoConsumer key={index} src={fileUrl} intro={fileName}>
        <div
          className={`file-item ${fileStyle || ''}`}
          onClick={(e: any) => {
            const photoRef = getPhotosRef()
            photoRef.current.onPreviewImg({
              nowSrc: fileUrl,
              areaDom: $(e.currentTarget).parents('.file-container'),
              fileinfo: setFileInfo(props),
            })
            scaleFn()
          }}
        >
          <div className="imgBox">
            {/* 上传图片过程中头像隐藏 */}
            <div className="preview_img_box">
              {fileProgress && progress !== undefined && progress < 100 ? (
                ''
              ) : (
                <img className="img-around" src={fileUrl} />
              )}
            </div>
            {/* 图片上下载按钮(使用delStyle时挂载) */}
            <span
              className={`download_btn img_icon ${fileStyle == 'delStyle' ? '' : 'forcedHide'}`}
              onClick={e => {
                e.stopPropagation()
                downloadFile({ ...props, fromType })
              }}
            ></span>
            {/* 图片上进度 */}
            {fileProgress && progress !== undefined ? (
              <UploadProgress key={fileKey + '_0'} id={fileKey + '_1'} progress={progress || 0} />
            ) : (
              ''
            )}
          </div>

          <span>
            <p className="file_name">{fileName}</p>
            <p className="file_size">{getFileShowSize(fileSize)}</p>
          </span>
          {/* 删除按钮(使用delStyle时挂载) */}
          {fileStyle == 'delStyle' && canDel ? (
            <div
              className="img_icon del_item_icon cross"
              onClick={e => {
                e.stopPropagation()
                delFile && delFile({ fileKey })
              }}
            ></div>
          ) : fileStyle != 'delStyle' ? (
            <div
              className="download"
              onClick={e => {
                e.stopPropagation()
                downloadFile({ ...props, fromType })
              }}
            ></div>
          ) : (
            ''
          )}
        </div>
        // </PhotoConsumer>
        // </PhotoProvider>
      )}
      {fileUrl !== '' && !imgFormatArr.includes(ext) && (
        <div
          className={`file-item  ${fileStyle || ''}`}
          onClick={(e: any) => {
            // showFilePreview(props)

            judegFile(e)
          }}
        >
          <div className="imgBox">
            {/* 上传图片过程中头像隐藏 */}
            <div className="preview_img_box">
              {fileProgress && progress !== undefined && progress < 100 ? (
                ''
              ) : (
                <img className="img-around" src={fileUrl} />
              )}
            </div>
            {/* 图片上下载按钮(使用delStyle时挂载) */}
            <span
              className={`download_btn img_icon dd ${fileStyle == 'delStyle' ? '' : 'forcedHide'}`}
              onClick={e => {
                e.stopPropagation()
                downloadFile({ ...props, fromType })
              }}
            ></span>
            {/* 图片上进度 */}
            {fileProgress && progress !== undefined ? (
              <UploadProgress key={fileKey + '_1'} id={fileKey + '_1'} progress={progress || 0} />
            ) : (
              ''
            )}
          </div>
          <span>
            <p className="file_name">{fileName}</p>
            <p className="file_size">{getFileShowSize(fileSize)}</p>
          </span>
          {/* 删除按钮(使用delStyle时挂载) */}
          {fileStyle == 'delStyle' && canDel ? (
            <div
              className="img_icon del_item_icon cross"
              onClick={e => {
                e.stopPropagation()
                delFile && delFile({ fileKey })
              }}
            ></div>
          ) : fileStyle != 'delStyle' ? (
            <div
              className="download"
              onClick={e => {
                e.stopPropagation()
                downloadFile({ ...props, fromType })
              }}
            ></div>
          ) : (
            ''
          )}
        </div>
      )}
      {fileUrl === '' && <div className="file-item"></div>}
      {showPreview && <PreviewModal visible={showPreview} onCancel={closePreviewModal} {...previewInfo} />}
    </>
  )
}
/**
 * 进度组件
 */
const UploadProgress = ({ id, progress }: { id: any; progress: number }) => {
  const [percent, setPercent] = useState(0)
  const { rotateLeft, rotateRig } = getRotate(percent)
  const idName = id.replace(/\./g, '')
  useEffect(() => {
    // 组件初始化时开启定时器，手动定时更新进度
    timersObj[id] = setInterval(() => {
      const getPercent: any =
        $(`#${idName}`)
          .find('.percentCircleCon .text-circle')
          .text() || 0
      if (getPercent < 90) {
        // setPercent(percent + 20)
        const rotateInfo = getRotate(Number(getPercent || 0) + 10)
        const newRotateLeft = rotateInfo.rotateLeft
        const newRotateRig = rotateInfo.rotateRig
        $(`#${idName}`)
          .find('.percent-circle .left-content')
          .css({ ...newRotateLeft })
        $(`#${idName}`)
          .find('.percent-circle .right-content')
          .css({ ...newRotateRig })
        $(`#${idName}`)
          .find('.percentCircleCon .text-circle')
          .text(Number(getPercent) + 10)
      } else if (getPercent >= 100) {
        clearInterval(timersObj[id])
      }
    }, 1000)
  }, [])
  useEffect(() => {
    // 外部传入的进度已完成，则清除手动更新进度的定时器
    if (progress >= 100) {
      clearInterval(timersObj[id])
      setPercent(100)
    }
    // else {
    //   setPercent(progress)
    // }
  }, [progress])

  return (
    <span className={`progressBox ${percent < 100 ? '' : 'forcedHide'}`} id={idName}>
      {/* <Progress width={32} strokeLinecap="square" type="circle" percent={percent} /> */}
      <div className="percentCircleCon process_color1">
        <div className="percent-circle percent-circle-left">
          <div className="percentCircleIn left-content" style={rotateLeft}></div>
          <div className="percentCircleIn left-content" style={rotateLeft}></div>
        </div>
        <div className="percent-circle percent-circle-right">
          <div className="percentCircleIn right-content" style={rotateRig}></div>
        </div>
        <div className="text-circle">{percent}</div>
      </div>
    </span>
  )
}
/**
 * 获取自定义进度旋转角度
 * @param percent
 */
const getRotate = (percent: number) => {
  let rotateLeft: any = {}
  let rotateRig: any = {}
  let leftDeg: any = ''
  let rightDeg: any = ''
  let progress = percent
  if (percent <= 50) {
    const deg = progress * 3.6 + 45
    rotateRig = { transform: `rotate(${deg}deg)` }
    rightDeg = deg
  } else {
    progress = percent - 50
    const deg = progress * 3.6 + 45
    rotateRig = { transform: 'rotate(225deg)' }
    rotateLeft = { transform: `rotate(${deg}deg)` }
    leftDeg = deg
    rightDeg = 225
  }
  return {
    rotateLeft,
    rotateRig,
    leftDeg,
    rightDeg,
  }
}
export default FileListItem

import React, { Fragment, useState, useEffect, useRef, useLayoutEffect } from 'react'
import axios from 'axios'
import { Row, Col, Upload, Button, Modal, message } from 'antd'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { PhotoSlider, PhotoProvider, PhotoConsumer } from 'react-photo-view'
import { getFileSize, getFileIcon, imgesGatter, formatDateTime } from '@/src/common/js/math'
import { FileModelsItemProps } from '@/src/views/announce/addModal'
import { getPictureUrl, getPreviewUrl } from './actions'
import './index.less'
import { downloadFile } from '../download-footer/downloadFile'
import { getLocationFormType } from '../file-list/file-list-item'
const API_HOST = process.env.API_HOST
const API_PROTOCOL = process.env.API_PROTOCOL

const CancelToken = axios.CancelToken
let source = CancelToken.source()

let Zoom: any,
  Rotate: any = 0

interface OrgProps {
  fileModels: any[]
  fileChange?: (fileListRes: any) => void
  dir: string
  showText?: string
  showIcon?: boolean
  showUploadList?: boolean
  fileUploaded?: any //单个文件上传完毕
  filesUploaded?: any //所有文件上传完毕
  beforeUpload?: any
  fileIcon?: any
  windowfrom?: any
  removefile?: (file: any) => void
}
//上传完后的所有新上传文件
let addFilesList: any = []
// 本次新增文件数量
let newFileNum = 0
const protocol = process.env.API_PROTOCOL
const host = process.env.API_HOST
let photoIndexKey = ''

const UploadFile = ({
  fileModels,
  fileChange,
  dir,
  showText,
  showIcon,
  showUploadList,
  fileUploaded,
  filesUploaded,
  beforeUpload,
  fileIcon,
  windowfrom,
  removefile,
}: OrgProps) => {
  // 附件预览-模态框显隐
  // const [previewVisible, setPreviewVisible] = useState(false)
  // 图片预览-模态框显隐
  const [imgModalVisible, setImgModalVisible] = useState(false)
  // 附件预-览文件信息
  const [previewInfo, setPreviewInfo] = useState<any>(null)
  // 初始化和上传后展示的文件列表数据
  const [fileList, setFileList] = useState<any[]>([])
  useEffect(() => {
    //修改url的值 把icon图标给到url值中
    const newFileLists = fileModels?.map((item: FileModelsItemProps) => {
      const fileName = item.fileName || item.name
      const fileSuffix = fileName
        .toLowerCase()
        .split('.')
        .splice(-1)[0]
      //文件为图片-获取文件地址
      let imgIcon = ''
      if (imgesGatter.includes(fileSuffix)) {
        imgIcon =
          item.src ||
          `${API_PROTOCOL}${API_HOST}/tools/oss/downloadFile?fileKey=${item.fileKey}&fileName=${fileName}&dir=${dir}`
      } else {
        imgIcon = getFileIcon(fileSuffix)
      }
      item.uid = item.id || item.fileKey
      item.name = item.fileName
      item.url = imgIcon
      return item
    })
    setFileList(newFileLists || [])
  }, [fileModels])

  // 图片上传-同时上传多张图片
  const getMultiplePicture = async (file: any) => {
    return new Promise(resolve => {
      const formDatas: any = new FormData()
      const size = file.size //总大小
      const shardSize = 2 * 1024 * 1024 //以2MB为一个分片
      const shardCount: any = Math.ceil(size / shardSize) //总片数
      formDatas.append('name', file.name)
      formDatas.append('chunks', shardCount) //总片数
      formDatas.append('dir', dir)
      formDatas.append('key', file.uid)
      const imgItem = {
        uid: file.uid,
        name: file.name,
        url: '',
        status: 'uploading',
        fileSize: file.size,
        uploadUser: $store.getState().nowUser,
        uploadDate: formatDateTime(new Date().getTime()),
      }
      if (shardCount == 0) {
        resolve({ returnCode: -1, msg: 'error' })
        return
      }
      async function fetchData() {
        for (let i = 0; i < shardCount; ++i) {
          if (imgItem.status == 'removed') return
          //计算每一片的起始与结束位置
          const start = i * shardSize
          const end = Math.min(size, start + shardSize)
          formDatas.set('chunk', i) //当前是第几片
          formDatas.set('multipartFile', file.slice(start, end)) //slice方法用于切出文件的一部分
          imgItem['percent'] = Math.floor((i / shardCount) * 100)
          setFileList(origin => {
            const result = origin.filter(item => {
              if (item.status !== 'removed') {
                return item.uid !== imgItem.uid
              }
            })
            return [...result, imgItem]
          })
          await axios({
            method: 'post',
            url: `${protocol}${host}/tools/oss/multipartUploadFiles`,
            headers: {
              loginToken: $store.getState().loginToken,
            },
            cancelToken: source.token,
            //processData : false,
            //contentType: false
            data: formDatas,
          }).then((res: any) => {
            if (i === shardCount - 1) {
              resolve(res.data)
            }
          })
        }
      }
      fetchData()
    })
  }

  // 上传文件
  async function customRequestUpload({ file }: any) {
    source = CancelToken.source()
    newFileNum++
    getMultiplePicture(file).then((res: any) => {
      const fileName = file.name
      const fileSuffix = fileName
        .toLowerCase()
        .split('.')
        .splice(-1)[0]
      const fileKey = file.uid + '.' + fileSuffix
      // 单个文件上传完毕
      const fileItem = {
        id: '',
        fileKey: fileKey,
        fileName: file.name,
        fileSize: file.size,
        dir,
        uploadUser: $store.getState().nowUser,
        uploadDate: formatDateTime(new Date().getTime()),
      }
      if (res.returnCode === 0) {
        //文件为图片-获取文件地址
        let imgIcon = ''
        async function getUrl() {
          if (imgesGatter.includes(fileSuffix)) {
            const resData: any = await getPictureUrl({ fileName: fileKey, dir })
            imgIcon = resData
          } else {
            imgIcon = getFileIcon(fileSuffix)
          }
          // 单个文件上传完毕
          fileUploaded &&
            fileUploaded({
              fileItem,
              imgUrl: imgIcon,
            })
          // 保存新添加附件
          addFilesList.push({
            fileItem,
            imgUrl: imgIcon,
          })
          // 检测是否所有新添加附件都已上传完毕
          if (addFilesList.length == newFileNum) {
            filesUploaded && filesUploaded([...addFilesList])
            addFilesList = []
            newFileNum = 0
          }
          setFileList(origin => {
            const result = origin.filter(item => {
              return item.uid !== file.uid
            })
            return [
              ...result,
              {
                uid: file.uid,
                name: file.name,
                fileSize: file.size,
                url: imgIcon,
                status: 'done',
                uploadUser: $store.getState().nowUser,
                uploadDate: formatDateTime(new Date().getTime()),
              },
            ]
          })
        }
        getUrl()
      } else if (res.msg == 'error') {
        // 保存上传失败的新添加附件
        addFilesList.push({
          fileItem,
          imgUrl: '',
        })
        // 检测是否所有新添加附件都已上传完毕
        if (addFilesList.length == newFileNum) {
          filesUploaded && filesUploaded([...addFilesList])
          addFilesList = []
          newFileNum = 0
        }
      }
    })
  }

  // 预览
  const handleFilePreview = async (file: any, e?: any) => {
    const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
    const _e: any = event
    const ext = file.name
      .toLowerCase()
      .split('.')
      .splice(-1)[0]
    if (_e && _e.target.className == 'ant-upload-list-item-thumbnail') {
      //下载 -------------
      const files = {
        fileName: file.fileName || file.name,
        fileKey: file.fileKey || `${file.uid}.${ext}`,
        fileSize: file.fileSize || 0,
        dir: file.dir,
        fromType: windowfrom,
      }
      if (file.fileName) {
        //后台返回附件才支持下载
        downloadFile({ ...file, fromType: windowfrom })
      }
      return
    }
    if (imgFormatArr.includes(ext)) {
      // 图片预览
      setImgModalVisible(true)
      photoIndexKey = file.fileKey ? file.fileKey : `${file.uid}.${ext}`
    } else {
      // 附件预览   进行判断附件是否重新打开窗口或者给出tips信息
      const fileInfo = {
        fileName: file.fileName || file.name,
        fileKey: file.fileKey || `${file.uid}.${ext}`,
        fileSize: file.fileSize || 0,
        dir: file.dir ? file.dir : dir,
        uploadUser: file.uploadUser || '',
        uploadDate: file.uploadDate || '',
        uid: file.uid,
      }
      setPreviewInfo(fileInfo)
      judegFile(fileInfo)
      // setPreviewVisible(true)
    }
  }
  const judegFile = (a: any) => {
    // 判断文件类型 支持预览重新打开页面
    const fileFormatArr = ['ppt', 'pptx', 'xlsx', 'xls', 'doc', 'docx', 'txt', 'pdf']
    const ext = a.fileName
      .toLowerCase()
      .split('.')
      .splice(-1)[0]
    if (fileFormatArr.includes(ext)) {
      $store.dispatch({ type: 'SET_SP_VALUE', data: a })
      $tools.createWindow('seeFileWin', { sendOptions: [] }).then(() => {})
    } else {
      message.warning('该文件类型不支持预览')
    }
  }

  // 删除上传
  const handleRemove = (file: any) => {
    let isreject = true
    // if (file.status && file.status !== 'done') {
    // isreject = false
    // message.warning('上传过程中不能删除')
    // }

    // for (let i = 0; i < fileList.length; i++) {
    //   if (fileList[i].percent < 100 && fileList[i].status !== 'done') {
    //     message.warning('上传过程中不能删除')
    //     isreject = false
    //     break
    //   }
    // }
    if (removefile) {
      removefile(file) //设置高度
    }
    return isreject
  }

  //关闭附件预览
  // const closePreviewModal = () => {
  //   setPreviewVisible(false)
  // }
  /**
   * 封装单个附件对象
   */
  const packFiles = (files: any, attachObj?: any) => {
    const infoObj = attachObj ? attachObj : {}
    const fileList: any = []
    files?.map((file: any) => {
      const fileName = file.name
      const fileSuffix = fileName
        .toLowerCase()
        .split('.')
        .splice(-1)[0]
      const fileKey = file.uid + '.' + fileSuffix
      const fileItem: any = {
        id: '',
        fileKey: fileKey,
        fileName: file.name,
        fileSize: file.size,
        dir,
        uploadUser: $store.getState().nowUser,
        uploadDate: formatDateTime(new Date().getTime()),
      }
      // 初始上传进度都为0
      if (infoObj.type == 'beforeUpload') {
        fileItem.progress = 0
      }
      fileList.push(fileItem)
    })
    return fileList
  }
  return (
    <Fragment>
      <Upload
        listType="picture"
        className="upload-list-inline"
        multiple
        fileList={!showUploadList ? [] : fileList}
        showUploadList={
          !showUploadList
            ? false
            : {
                // @ts-ignore
                removeIcon: <i className="remove-file-icon"></i>,
              }
        }
        onPreview={handleFilePreview}
        onChange={({ fileList: fileListRes, file, event }: any) => {
          // 筛选文件大小为0的取消上传并给提示
          if (file.size == 0) {
            message.warning('文件大小不能为空，已取消上传')
          }
          let listData = fileListRes.filter((v: any) => v.size !== 0)
          setFileList(listData)
          if (fileChange) {
            fileChange(listData)
          }
        }}
        customRequest={customRequestUpload}
        onRemove={handleRemove}
        beforeUpload={(file: any, fileList: any) => {
          const files = packFiles(fileList, { type: 'beforeUpload' })
          beforeUpload && beforeUpload(file, files)
          return true
        }}
      >
        {fileList.length >= 100 ? null : fileIcon ? (
          fileIcon
        ) : (
          <>
            {showIcon && (
              <Button>
                <UploadOutlined />
              </Button>
            )}
            {showText && <Button>{showText}</Button>}
          </>
        )}
      </Upload>
      {/* 附件预览模态框 */}
      {/* {previewVisible && (
        <PreviewModal visible={previewVisible} onCancel={closePreviewModal} {...previewInfo} />
      )} */}
      {/* 图片预览 */}
      {imgModalVisible && (
        <ImagePreviewModal
          fileList={fileList}
          visible={imgModalVisible}
          handleVisile={() => {
            setImgModalVisible(false)
          }}
        />
      )}
    </Fragment>
  )
}

export default UploadFile

/**
 *图片预览
 *
 */

interface ImgModalProps {
  visible: boolean
  fileList: any
  handleVisile: () => void
}

export const ImagePreviewModal = ({ visible, fileList, handleVisile }: ImgModalProps) => {
  const [photoIndex, setPhotoIndex] = React.useState(0)
  const [imgList, setImgList] = useState<any>([])
  const refComplete = useRef(null)
  useEffect(() => {
    const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
    const imgPreviewList: any = []
    fileList.map((item: any, index: number) => {
      const fileExt = item.name
        .toLowerCase()
        .split('.')
        .splice(-1)[0]
      if (imgFormatArr.includes(fileExt)) {
        const res = item.name.split('.')
        const suffix = res[res.length - 1]
        const fileKey = item.fileKey ? item.fileKey : `${item.uid}.${suffix}`
        const obj = {
          id: item.id ? item.id : '',
          fileKey,
          fileName: item.name,
          fileSize: item.size,
          fileUrl: item.url,
          uploadUser: item.uploadUser,
          uploadDate: item.uploadDate,
          dir: 'notice',
        }
        imgPreviewList.push(obj)
        // if (fileKey == photoIndexKey) {
        //   setPhotoIndex(index)
        // }
      }
    })
    imgPreviewList.map((item: any, index: number) => {
      if (item.fileKey == photoIndexKey) {
        setPhotoIndex(index)
      }
    })
    setImgList(imgPreviewList)
  }, [])
  //dom更新完后放大缩小
  useLayoutEffect(() => {
    const refCompleteObj: any = refComplete
    if (refCompleteObj.current.props.images.length > 0) {
      Zoom = 1
      Rotate = 0
      jQuery('.PhotoView__PhotoWrap img').css({
        transform: `translate3d(0px, 0px, 0px) scale(${Zoom}) rotate(${Rotate}deg)`,
      })
      Imgscale()
      CheckRes()
      DragImg()
    }
  }, [refComplete.current])
  return (
    //当前图片的zoom和角度存下来
    <PhotoSlider
      ref={refComplete}
      images={imgList.map((item: any) => ({ src: item.fileUrl }))}
      visible={visible}
      onClose={handleVisile}
      index={photoIndex}
      onIndexChange={setPhotoIndex}
      maskClosable={false}
      bannerVisible={true}
      toolbarRender={({ rotate, onRotate }) => {
        return (
          <>
            <svg
              className="PhotoView-PhotoSlider__toolbarIcon"
              onClick={e => {
                // onRotate(rotate + 90)
                Rotate += 90
                let idx2
                if (photoIndex > 1) {
                  idx2 = 1
                } else {
                  idx2 = photoIndex
                }
                jQuery('.PhotoView-SlideWrap .PhotoView__PhotoWrap')
                  .eq(idx2)
                  .children()
                  .find('img')
                  .css({
                    transform: `translate3d(0px, 0px, 0px) scale(${Zoom}) rotate(${Rotate}deg)`,
                  })
              }}
              width="44"
              height="44"
              fill="white"
              viewBox="0 0 768 768"
            >
              <path d="M565.5 202.5l75-75v225h-225l103.5-103.5c-34.5-34.5-82.5-57-135-57-106.5 0-192 85.5-192 192s85.5 192 192 192c84 0 156-52.5 181.5-127.5h66c-28.5 111-127.5 192-247.5 192-141 0-255-115.5-255-256.5s114-256.5 255-256.5c70.5 0 135 28.5 181.5 75z" />
            </svg>
          </>
        )
      }}
    />
  )
}
//拖拽图片
let iX: any, iY: any, oX: any, oY: any
export const DragImg = () => {
  let dragging = false
  setTimeout(() => {
    jQuery('.PhotoView__PhotoWrap').on('mousedown', (e: any) => {
      dragging = true
      iX =
        e.clientX -
        jQuery(e.target)
          .next()
          .find('img')[0].offsetLeft
      iY =
        e.clientY -
        jQuery(e.target)
          .next()
          .find('img')[0].offsetTop

      return false
    })
  }, 500)
  setTimeout(() => {
    jQuery('.PhotoView-SlideWrap').on('mousemove', function(e: any) {
      if (dragging) {
        oX = e.clientX - iX
        oY = e.clientY - iY

        jQuery(e.target)
          .next()
          .find('img')
          .css({
            left: oX + 'px',
            top: oY + 'px',
          })
        return false
      }
    })
  }, 500)
  setTimeout(() => {
    jQuery('.PhotoView-SlideWrap').on('mouseup', function(e: any) {
      dragging = false

      e.cancelBubble = true
    })
  }, 500)
}
//图片放大缩小 ----
export const Imgscale = () => {
  setTimeout(() => {
    jQuery('.PhotoView-SlideWrap').on('mousewheel DOMMouseScroll', '.PhotoView__PhotoWrap', function(e: any) {
      const el: any = window.event
      let zoom = getStyle(e).Zoom
      const rotate = getStyle(e).Rotate
      // let zoom = Zoom == '' ? 1 : Zoom
      zoom = Number(zoom.toFixed(3))
      el.wheelDelta > 0 ? (zoom += 0.15) : (zoom -= 0.15)
      if (zoom < 5 && zoom > 0.1) {
        Zoom = zoom
        Rotate = rotate
        jQuery(e.target)
          .next()
          .find('img')
          .css({
            transform: `translate3d(0px, 0px, 0px) scale(${zoom}) rotate(${rotate}deg)`,
            transition: `transform 0.3s linear`,
          })
      }
    })
  }, 0)
}
//获取图片的Zoom，Rotate
export const getStyle = (e: any) => {
  const elstyle: any = jQuery(e.target)
    .next()
    .find('img')
    .attr('style')
  const zoom: any =
    Number(
      elstyle
        ?.split(' ')[4]
        .split('scale(')[1]
        .split(')')[0]
    ) || 1
  const rotate: any = Number(
    elstyle
      ?.split(' ')[5]
      .split('rotate(')[1]
      .split('deg)')[0]
  )
  return {
    Zoom: zoom,
    Rotate: rotate,
  }
}
//重置Zoom，Rotate
export const reZR = () => {
  Zoom = 1
  Rotate = 0
}
//获取全局的Zoom，Rotate
export const getZR = () => {
  return {
    Zoom: Zoom,
    Rotate: Rotate,
  }
}
//判断是否点了左右 点了左右的要复原大小位置和旋转todo1111
export const CheckRes = () => {
  setTimeout(() => {
    jQuery('.PhotoView-SlideWrap').on('mousedown', function(e: any) {
      jQuery('.PhotoView-PhotoSlider__ArrowRight')
        .off()
        .on('click', (e: any) => {
          Zoom = 1
          Rotate = 0
          jQuery('.PhotoView__PhotoBox img').css({
            transform: `translate3d(0px, 0px, 0px) scale(${Zoom}) rotate(${Rotate}deg)`,
          })
          DragImg()
        })
      jQuery('.PhotoView-PhotoSlider__ArrowLeft')
        .off()
        .on('click', (e: any) => {
          Zoom = 1
          Rotate = 0
          jQuery('.PhotoView__PhotoBox img').css({
            transform: `translate3d(0px, 0px, 0px) scale(${Zoom}) rotate(${Rotate}deg)`,
          })
          DragImg()
        })
    })
  }, 500)
}
/**
 * 附件预览
 */

interface PreviewModalProps {
  visible: boolean
  onCancel: () => void
  fileUrl?: string
  fileName: string
  fileKey: string
  fileSize: number | string
  dir: string
  uploadUser: string
  uploadDate: string
  uid?: string
}
export const PreviewModal = ({
  visible,
  onCancel,
  fileUrl,
  fileName,
  fileKey,
  fileSize,
  dir,
  uploadUser,
  uploadDate,
  uid,
}: PreviewModalProps) => {
  const [fileSrc, setFileSrc] = useState('')
  const [fileType, setFileType] = useState('')
  useEffect(() => {
    ;(async () => {
      const fileSuffix = fileName
        ?.toLowerCase()
        .split('.')
        .splice(-1)[0]
      if (fileSize > 10 * 1024 * 1000) {
        setFileType('unknown')
      } else {
        if (
          fileSuffix == 'xlsx' ||
          fileSuffix == 'xls' ||
          fileSuffix == 'doc' ||
          fileSuffix == 'docx' ||
          fileSuffix == 'ppt' ||
          fileSuffix == 'pptx' ||
          fileSuffix == 'txt' ||
          fileSuffix == 'pdf'
        ) {
          const params = {
            fileName: fileKey ? fileKey : `${uid}.${fileSuffix}`,
            dir,
          }
          const viewUrl: any = fileUrl ? fileUrl : await getPreviewUrl(params)
          const nowfileSrc = `http://110.185.107.104:8001/doceditor.aspx?editorsMode=fillForms&fileUrl=${viewUrl}`
          setFileSrc(nowfileSrc)
          setFileType('file')
        } else {
          setFileType('unknown')
        }
      }
    })()
  }, [])
  const fromType = getLocationFormType(window.location.hash)
  $tools.createWindow('seeFileWin', { sendOptions: [] }).then(() => {})
  return (
    <Modal
      className="previewModal"
      visible={visible}
      title={fileName}
      footer={null}
      onCancel={onCancel}
      width={'95%'}
      centered={true}
    >
      <Row style={{ height: '100%' }}>
        <Col span={18} className="filePreviewContent">
          {fileType === 'unknown' ? (
            <div className="notPreview">
              <img src={$tools.asAssetsPath('/images/fileIcon/not-preview.png')} />
              <div>当前文件不支持预览</div>
              <div>
                <DownloadOutlined
                  onClick={() => {
                    const value = { fileName, fileKey, fileSize: fileSize, dir, fromType }
                    downloadFile(value)
                  }}
                />
                下载<span>{getFileSize(fileSize)}</span>
              </div>
            </div>
          ) : (
            <iframe id="pdfIframe" src={fileSrc} width="100%" height="100%" frameBorder={0}></iframe>
          )}
        </Col>
        <Col span={5} offset={1} className="fileInfoContent">
          <div className="fileInfoItem">文件信息</div>
          <div className="fileInfoItem">
            类型<span>文档</span>
          </div>
          <div className="fileInfoItem">
            上传者<span>{uploadUser}</span>
          </div>
          <div className="fileInfoItem">
            文件大小<span>{getFileSize(fileSize)}</span>
          </div>
          <div className="fileInfoItem">
            上传时间<span>{uploadDate}</span>
          </div>
          <div className="fileInfoItem">
            下载
            <span>
              <DownloadOutlined
                onClick={() => {
                  const value = { fileName, fileKey, fileSize: fileSize, dir, fromType }
                  downloadFile(value)
                }}
              />
            </span>
          </div>
        </Col>
      </Row>
    </Modal>
  )
}

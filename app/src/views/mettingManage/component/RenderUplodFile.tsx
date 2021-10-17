/**
 * 新版本附件组件抽离(附件上传，附件渲染)
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Modal, message, Image, Spin } from 'antd'
import $c from 'classnames'
import { getFileIcon, imgesGatter } from '@/src/common/js/math'
import { deleteByguid, queryFileList } from '../../workdesk/getData'
import { PhotoSlider } from 'react-photo-view'
import { getFileShowSize, getLocationFormType } from '@/src/components/file-list/file-list-item'
import { downloadFile } from '@/src/components/download-footer/downloadFile'
import { getStyle } from '@/src/components/upload-file'
import { useMergeState } from '../../chat-history/chat-history'
import PdfModal from './PdfTest'
import { addBrowse } from '../../chat-history/ChatItem'
import VerticalAlignBottomOutlined from '@ant-design/icons/lib/icons/VerticalAlignBottomOutlined'
import { getImgSize } from '@/src/common/js/common'
const fileFormatArr = ['ppt', 'pptx', 'xlsx', 'xls', 'doc', 'docx', 'pdf']
const pathSux =
  'M565.5 202.5l75-75v225h-225l103.5-103.5c-34.5-34.5-82.5-57-135-57-106.5 0-192 85.5-192 192s85.5 192 192 192c84 0 156-52.5 181.5-127.5h66c-28.5 111-127.5 192-247.5 192-141 0-255-115.5-255-256.5s114-256.5 255-256.5c70.5 0 135 28.5 181.5 75z'
const downLoad =
  'M859.9 780H164.1c-4.5 0-8.1 3.6-8.1 8v60c0 4.4 3.6 8 8.1 8h695.8c4.5 0 8.1-3.6 8.1-8v-60c0-4.4-3.6-8-8.1-8zM505.7 669a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V176c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8z'
let photoIndexKey = ''
let Zoom: any
let Rotate: any = 0
const FILEHOST = process.env.API_FILE_HOST
interface UploadProps {
  visible: boolean //控制上传弹窗显示
  leftDown: boolean //左侧下载按钮
  canDel: boolean //是否显示删除按钮
  filelist: any[] //附件集合
  allFilelist?: any[] //任务和okr详情中所有附件集合用作预览
  teamId: any //企业ID
  fileId: string //上传对应的UUID
  defaultFiles: any[] //编辑回显的附件信息
  setVsible: (state: boolean) => void
  fileChange: (list: Array<object>, delGuid?: string, isDel?: boolean, delGuidFromSql?: string) => void
  loadTime: any
  isPrivacy?: boolean
  isApproval?: boolean //审批管理进入
  className?: string
}

interface RenderFileListProps {
  list: any[]
  large?: boolean
  leftDown?: boolean
  fileSize?: boolean
  canDel?: boolean
  teamId?: any
  fileChange?: (list: Array<object>) => void
  isApproval?: boolean
  className?: string
  hideDown?: boolean //增加此参数主要考虑公告详情下载权限
  // isDownload && type !== 0 && type !== 2
}

interface ImgModalProps {
  visible: boolean
  fileList: any
  photoIndex_Key: any
  from?: string
  handleVisile: () => void
}
//=====================================附件渲染加附件上传=================================================//
export const RenderUplodFile: React.FC<UploadProps> = props => {
  const [fileList, setFileList] = useState<Array<any>>([])
  const [imgModalVisible, setImgModalVisible] = useState(false)
  const { nowUserId, nowUser } = $store.getState()
  //PDF组件需要的参数
  const [pdfInfo, setPdfInfo] = useMergeState({
    preFileVisible: false,
    preFileUrl: '',
    preTitle: '',
  })
  //初始化
  useEffect(() => {
    let isUnmounted = false
    if (!isUnmounted) {
      const list = handelPropsData([...props.filelist, ...props.defaultFiles])
      setFileList(list)
    }
    return () => {
      isUnmounted = true
    }
  }, [props.filelist, props.defaultFiles])

  const handelPropsData = (arr: Array<any>) => {
    const newFileList = arr.map((item: any, i: number) => {
      if (item) {
        const params = {
          ...item,
          uid: item.fileGUID,
          name: item.displayName,
          url: item.officeUrl,
          status: 'done',
          uploadUser: nowUser,
          uploadDate: item.addTime,
        }
        if (!item.hasOwnProperty('displayName')) {
          params.displayName = item.fileName
        }
        if (!item.hasOwnProperty('fileGUID')) {
          params.fileGUID = item.fileKey
        }
        return {
          ...item,
          ...params,
        }
      }
    })
    return removalData(newFileList)
  }

  //去除重复数据
  const removalData = (arr: Array<any>) => {
    const keyArr: any = []
    arr.forEach((element, index) => {
      keyArr.push(element.fileGUID) // 通过key来判断
    })
    const newArr: any = []
    const newKey = new Set(keyArr) // k`ey去重
    newKey.forEach(item => {
      const index = keyArr.findIndex((item2: any) => item2 === item)
      newArr.push(arr[index])
    })
    return newArr
  }

  //查询阿里云附件
  const queryServiceFile = async () => {
    await queryFileList({
      companyId: props.teamId,
      userId: nowUserId,
      requestSource: 1, //1PC端  2移动端
      fileId: props.fileId,
      isPrivacy: props.isPrivacy ? 1 : 0,
    })
      .then((res: any) => {
        const dataList: any[] = res.data || []
        // 上传文件、直接关闭窗口
        if (dataList.length != 0) {
          //给新增的附件添加一个标识符isNewFile
          const newList = dataList.map(item => {
            return {
              ...item,
              isNewFile: true,
            }
          })
          props.fileChange(newList, '')
        }

        props.setVsible(false)
      })
      .catch(err => {
        message.error('查询附件失败')
        props.setVsible(false)
      })
  }

  /**
   * 渲染单个附件
   * @returns
   */
  const RenderItem: React.FC<{ item: any }> = ({ item }) => {
    const [btnLoading, setBtnLoading] = useState(false)
    const suffix = fileIcon(item).suffix
    const handelOption = (e: any, type: number, item: any) => {
      e.stopPropagation()
      if (type === 0) {
        //预览
        if (imgesGatter.includes(suffix)) {
          // setImgModalVisible(true) // 图片预览
          const fromType = getLocationFormType(window.location.hash)
          photoIndexKey = item.fileKey ? item.fileKey : `${item.uid}`
          setBtnLoading(true)
          let imgWidthH: any = {}
          getImgSize(item.url).then(res => {
            let list = []
            if (props.allFilelist) {
              list = handelPropsData([...props.allFilelist, ...props.defaultFiles])
            } else {
              list = fileList
            }
            imgWidthH = res
            $store.dispatch({
              type: 'SET_FILE_OBJ',
              data: {
                imgWidthH,
                fromType,
                fileType: 'img',
                fileList: list,
                photoIndexKey: photoIndexKey,
              },
            })
            $tools.createWindow('fileWindow').finally(() => {
              setBtnLoading(false)
            })
          })
        } else {
          // 判断文件类型 支持预览重新打开页面 ,附件预览,进行判断附件是否重新打开窗口或者给出tips信息
          // const timeStamp = new Date().getTime().toString()
          // const officeUrl = item.officeUrl ? `${item.officeUrl}&time=${timeStamp}` : ''
          const officeUrl = item.officeUrl
          if (fileFormatArr.includes(suffix)) {
            addBrowse(item.fileGUID)
            console.log(item)
            //打开附件预览窗口
            if (suffix === 'pdf') {
              setBtnLoading(true)
              setPdfInfo({
                preFileVisible: true,
                preFileUrl: officeUrl,
                preTitle: item.displayName,
              })
            } else {
              //fword,exlce
              setBtnLoading(true)
              //2021-08-06 用a标签预览附件
              const a = document.createElement('a')
              a.href = officeUrl + '&holderView=1'
              a.target = '_blank'
              a.click()
              setBtnLoading(false)
            }
          } else {
            message.warning('该文件类型不支持预览')
          }
        }
      } else if (type === 1) {
        //附件删除
        //删除的时候校验附件身上的isAdd是否为true 为true则需要从数据库删除
        const isNewCreat = item.hasOwnProperty('isNewFile')
        const fileArray = props.filelist.filter((_item: any) => _item.fileGUID !== item.fileGUID)
        if (!isNewCreat) {
          //需要记录ID
          props.fileChange(fileArray, item.fileGUID, true)
        } else {
          deleteByguid({
            companyId: item.companyId || props.teamId,
            userId: nowUserId,
            fileGuid: item.fileGUID,
          })
            .then((res: any) => {
              //TODO
              if (res.code === 1) {
                props.fileChange(fileArray, '', true, item.fileGUID)
              }
            })
            .catch(() => {
              message.error('操作失败')
            })
        }
      } else {
        //附件下载
        const fromType = getLocationFormType(window.location.hash)
        downloadFile({
          url: item.downloadUrl,
          fileName: item.displayName,
          fileKey: item.fileGUID,
          dir: 'notice',
          fileSize: item.fileSize,
          fromType: fromType,
          companyId: item.companyId || props.teamId,
        })
      }
    }
    return (
      <div
        className={$c('fileItem', { fileItemHover: props.leftDown })}
        onClick={(e: any) => handelOption(e, 0, item)}
      >
        <Image className="fileImage" preview={false} width={28} height={30} src={fileIcon(item).imgIcon} />
        <div className="fileName">
          <span className="file_title">{item.displayName}</span>
          {!props.canDel && <span className="fileSize">{getFileShowSize(item.fileSize || 0)}</span>}
        </div>
        {props.canDel && <span className="delIcon" onClick={(e: any) => handelOption(e, 1, item)}></span>}
        {!props.canDel && <a className="downIcon" onClick={(e: any) => handelOption(e, 2, item)}></a>}
        <span className="left_down_box" onClick={(e: any) => handelOption(e, 2, item)}>
          <span className="left_down_icon"></span>
        </span>
        {fileFormatArr.includes(suffix) && <Spin spinning={btnLoading} className="loadSpin" />}
      </div>
    )
  }

  //防止上传页面多次刷新
  const uploadMain = useMemo(() => {
    return (
      <iframe
        sandbox="allow-scripts allow-same-origin allow-top-navigation allow-modals"
        name="uploadIframe"
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        src={`${FILEHOST}/FileUpload.html?companyId=${props.teamId}&userId=${nowUserId}&fileId=${
          props.fileId
        }&isPrivacy=${props.isPrivacy ? 1 : 0}&fileUUid=${props.loadTime}`}
      ></iframe>
    )
  }, [props.loadTime])

  return (
    <div
      className={$c(`newFileWrap ${props.className ? props.className : ''}`, { detileFileWrap: !props.canDel })}
    >
      {fileList.map((item: any, index: number) => (
        <RenderItem key={index} item={item} />
      ))}
      <Modal
        centered
        closable={true}
        className="new_upload_wrap"
        bodyStyle={{
          width: '1000px',
          height: '530px',
        }}
        maskStyle={{
          background: 'rgba(0, 0, 0, 0.75)',
        }}
        visible={props.visible}
        footer={null}
        onCancel={() => queryServiceFile()}
        width={1000}
      >
        {uploadMain}
      </Modal>
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

//=====================================单独渲染附件=================================================//
export const RenderFileList: React.FC<RenderFileListProps> = props => {
  const [imgModalVisible, setImgModalVisible] = useState(false)
  const [fileList, setFileList] = useState<Array<any>>([])

  const [pdfInfo, setPdfInfo] = useMergeState({
    preFileVisible: false,
    preFileUrl: '',
    preTitle: '',
  })

  useEffect(() => {
    let isUnmounted = false
    if (!isUnmounted) {
      handelPropsData(props.list)
    }
    return () => {
      isUnmounted = true
    }
  }, [props.list])

  const handelPropsData = (arr: Array<any>) => {
    const newFileList = arr.map((item: any) => {
      const params: any = {
        uid: item.fileGUID,
        name: item.displayName,
        url: item.officeUrl,
        status: 'done',
        uploadUser: $store.getState().nowUser,
        uploadDate: item.addTime,
      }
      if (!item.hasOwnProperty('displayName')) params.displayName = item.fileName
      if (!item.hasOwnProperty('fileGUID')) params.fileGUID = item.fileKey
      return {
        ...item,
        ...params,
      }
    })
    setFileList(newFileList)
  }

  const handelDown = (item: any) => {
    const fromType = getLocationFormType(window.location.hash)
    downloadFile({
      url: item.downloadUrl,
      fileName: item.displayName,
      fileKey: item.fileGUID,
      dir: 'notice',
      fileSize: item.fileSize,
      fromType: fromType,
      companyId: item.companyId || props.teamId,
    })
  }

  const RenderFileItem = ({ item }: { item: any }) => {
    const [btnLoading, setBtnLoading] = useState(false)
    const suffix = fileIcon(item).suffix
    const preFileFn = (e: any, item: any) => {
      e.stopPropagation()
      if (imgesGatter.includes(suffix)) {
        // setImgModalVisible(true) // 图片预览
        const fromType = getLocationFormType(window.location.hash)
        photoIndexKey = item.fileKey ? item.fileKey : `${item.uid}`
        setBtnLoading(true)
        let imgWidthH: any = {}
        getImgSize(item.url).then(res => {
          imgWidthH = res
          $store.dispatch({
            type: 'SET_FILE_OBJ',
            data: {
              imgWidthH,
              fromType,
              fileType: 'img',
              fileList: fileList,
              photoIndexKey: photoIndexKey,
            },
          })
          console.log('416超多也图片', fileList)

          $tools.createWindow('fileWindow').finally(() => {
            setBtnLoading(false)
          })
        })
      } else {
        // 判断文件类型 支持预览重新打开页面 ,附件预览,进行判断附件是否重新打开窗口或者给出tips信息
        // const timeStamp = new Date().getTime().toString()
        // const officeUrl = item.officeUrl ? `${item.officeUrl}&time=${timeStamp}` : ''
        const officeUrl = item.officeUrl
        if (fileFormatArr.includes(suffix)) {
          addBrowse(item.fileGUID)
          console.log(item)
          if (suffix === 'pdf') {
            setBtnLoading(true)
            setPdfInfo({
              preFileVisible: true,
              preFileUrl: officeUrl,
              preTitle: item.displayName,
            })
          } else {
            setBtnLoading(true)
            //2021-08-06 用a标签预览附件
            const a = document.createElement('a')
            a.href = officeUrl + '&holderView=1'
            a.target = '_blank'
            a.click()
            setBtnLoading(false)
          }
        } else {
          message.warning('该文件类型不支持预览')
        }
      }
    }
    const removeFile = (e: any, item: any) => {
      e.stopPropagation()
      deleteByguid({
        companyId: item.companyId || props.teamId,
        userId: $store.getState().nowUserId,
        fileGuid: item.fileGUID,
      })
        .then((res: any) => {
          //TODO
          if (res.code === 1) {
            if (props.fileChange) {
              props.fileChange(item.fileGUID)
            }
          }
        })
        .catch(() => {
          console.log('操作失败...')
        })
    }

    return (
      <div
        className={$c('fileItem', { fileItemHover: props.leftDown })}
        onClick={(e: any) => preFileFn(e, item)}
      >
        <Image className="fileImage" preview={false} width={28} src={fileIcon(item).imgIcon} />
        <div className="fileName">
          <span className="file_title">{item.displayName}</span>
          {props.fileSize && <span className="fileSize">{getFileShowSize(item.fileSize || 0)}</span>}
        </div>

        {!props.leftDown && !props.hideDown && (
          <span
            className="downIcon"
            onClick={(e: any) => {
              e.stopPropagation()
              handelDown(item)
            }}
          ></span>
        )}
        {props.canDel && <span className="delIcon" onClick={(e: any) => removeFile(e, item)}></span>}
        {props.leftDown && (
          <span
            className="left_down_box"
            onClick={(e: any) => {
              e.stopPropagation()
              handelDown(item)
            }}
          >
            <span className="left_down_icon"></span>
          </span>
        )}
        <Spin spinning={btnLoading} className="loadSpin" />
        {fileFormatArr.includes(suffix) && <Spin spinning={btnLoading} className="loadSpin" />}
      </div>
    )
  }
  return (
    <div
      className={$c(`newFileWrap ${props.className ? props.className : ''}`, { detileFileWrap: props.large })}
    >
      {fileList.map((item: any, index: number) => (
        <RenderFileItem key={index} item={item} />
      ))}

      {pdfInfo.preFileVisible && (
        <PdfModal
          visible={pdfInfo.preFileVisible}
          pdfUrl={pdfInfo.preFileUrl}
          setVsible={(state: boolean) => setPdfInfo({ preFileVisible: state })}
        />
      )}
    </div>
  )
}

//文件为图片-获取文件地址
export const fileIcon = (item: any) => {
  const fileName = item.hasOwnProperty('fileName') && item.fileName ? item.fileName : ''
  const fileSuffix = fileName
    .toLowerCase()
    .split('.')
    .splice(-1)[0]
  //文件为图片-获取文件地址
  const imgIcon = imgesGatter.includes(fileSuffix) ? item.officeUrl : getFileIcon(fileSuffix)
  return {
    imgIcon: imgIcon,
    suffix: fileSuffix,
  }
}

//=========================================================预览组件===========================================================//

export const ImagePreviewModal = ({ visible, fileList, handleVisile, photoIndex_Key, from }: ImgModalProps) => {
  const [photoIndex, setPhotoIndex] = React.useState(0)
  const [imgList, setImgList] = useState<any>([])
  const refComplete = useRef(null)
  useEffect(() => {
    const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
    const imgPreviewList: Array<any> = []
    photoIndexKey = photoIndex_Key

    fileList.map((item: any, index: any) => {
      if (typeof item === 'string') {
        //旧版聊天室内预览只传入了url数组
        imgPreviewList.push({ fileKey: index, fileUrl: item })
      } else {
        const fileExt = item.displayName
          .toLowerCase()
          .split('.')
          .splice(-1)[0]
        if (imgFormatArr.includes(fileExt)) {
          const res = item.displayName.split('.')
          const suffix = res[res.length - 1]
          const fileKey = item.fileKey || item.fileKey == 0 ? item.fileKey : `${item.uid}`

          imgPreviewList.push({
            id: item.id ? item.id : '',
            fileKey,
            fileName: item.displayName,
            fileSize: item.fileSize,
            companyId: item.companyId,
            fileUrl: item.url || item.officeUrl,
            uploadUser: item.uploadUser || '',
            uploadDate: item.uploadDate || '',
            dir: 'notice',
          })
        }
      }
    })
    for (let i = 0; i < imgPreviewList.length; i++) {
      const item = imgPreviewList[i]
      if (typeof item.fileKey === 'number' && item.fileKey == photoIndexKey) {
        // 云文档调用时传入key是数字
        setPhotoIndex(i)
      } else if (
        typeof item.fileKey === 'string' &&
        item.fileKey?.toLowerCase() == photoIndexKey?.toLowerCase()
      ) {
        setPhotoIndex(i)
      }
    }
    setImgList(imgPreviewList)
  }, [visible])
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
  // 旋转
  const photoViewFn = () => {
    Rotate += 90
    const idx2 = photoIndex > 1 ? 1 : photoIndex
    jQuery('.PhotoView-SlideWrap .PhotoView__PhotoWrap')
      .eq(idx2)
      .children()
      .find('img')
      .css({
        transform: `translate3d(0px, 0px, 0px) scale(${Zoom}) rotate(${Rotate}deg)`,
      })
    let height: any = jQuery('.PhotoView-SlideWrap .PhotoView__PhotoWrap')
      .eq(idx2)
      .children()
      .find('img')
      .height()
    height = height % 2 == 0 ? height : height + 1
    jQuery('.PhotoView-SlideWrap .PhotoView__PhotoWrap')
      .eq(idx2)
      .children()
      .find('img')
      .attr({ height })
    let width: any = jQuery('.PhotoView-SlideWrap .PhotoView__PhotoWrap')
      .eq(idx2)
      .children()
      .find('img')
      .width()
    width = width % 2 == 0 ? width : width + 1
    jQuery('.PhotoView-SlideWrap .PhotoView__PhotoWrap')
      .eq(idx2)
      .children()
      .find('img')
      .attr({ width })
  }
  //下载图片
  const photoDownLoadFn = () => {
    const { fileObj } = $store.getState()
    const { dir, fromType } = fileObj

    imgList.forEach((item: any, index: any) => {
      if (index == photoIndex) {
        downloadFile({
          url: item.officeUrl,
          fileName: item.fileName,
          fileKey: item.fileKey,
          dir: dir ? dir : 'notice',
          fileSize: item.fileSize,
          fromType: fromType,
          companyId: item.companyId || '',
        })
      }
    })
  }

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
      maskClassName={'mask_bgm'}
      introVisible={false}
      toolbarRender={() => {
        return (
          <>
            <svg
              className="PhotoView-PhotoSlider__toolbarIcon"
              onClick={() => photoViewFn()}
              width="44"
              height="44"
              fill="white"
              viewBox="0 0 768 768"
            >
              <path d={pathSux} />
            </svg>
            <svg
              className="PhotoView-PhotoSlider__toolbarIcon"
              onClick={() => photoDownLoadFn()}
              width="44"
              height="44"
              fill="white"
              viewBox="64 64 896 896"
            >
              <path d={downLoad} />
            </svg>
            {/* <VerticalAlignBottomOutlined style={{ width: '24px', height: '24px' }} /> */}
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
      console.log(zoom)
      console.log(jQuery(e.target))
      console.log('所有图片', jQuery('.PhotoView__PhotoWrap').eq(1))

      const rotate = getStyle(e).Rotate
      zoom = Number(zoom.toFixed(3))
      el.wheelDelta > 0 ? (zoom += 0.3) : (zoom -= 0.3)
      if (zoom < 5 && zoom > 0.1) {
        Zoom = zoom
        Rotate = rotate
        jQuery(e.target)
          .next()
          .find('img')
          .css({
            transform: `translate3d(0px, 0px, 0px) scale(${zoom}) rotate(${rotate}deg)`,
          })
      }
    })
  }, 500)
}
export const ImgscaleBtn = () => {
  setTimeout(() => {
    jQuery('.PhotoView-SlideWrap').on('mousewheel DOMMouseScroll', '.PhotoView__PhotoWrap', function(e: any) {
      const el: any = window.event
      let zoom = getStyle(e).Zoom
      console.log(zoom)
      console.log(jQuery(e.target))

      const rotate = getStyle(e).Rotate
      zoom = Number(zoom.toFixed(3))
      el.wheelDelta > 0 ? (zoom += 0.3) : (zoom -= 0.3)
      if (zoom < 5 && zoom > 0.1) {
        Zoom = zoom
        Rotate = rotate
        jQuery(e.target)
          .next()
          .find('img')
          .css({
            transform: `translate3d(0px, 0px, 0px) scale(${zoom}) rotate(${rotate}deg)`,
          })
      }
    })
  }, 500)
}
//判断是否点了左右 点了左右的要复原大小位置和旋转todo1111
export const CheckRes = () => {
  setTimeout(() => {
    jQuery('.PhotoView-SlideWrap').on('mousedown', function() {
      jQuery('.PhotoView-PhotoSlider__ArrowRight')
        .off()
        .on('click', () => {
          Zoom = 1
          Rotate = 0
          jQuery('.PhotoView__PhotoBox img').css({
            transform: `translate3d(0px, 0px, 0px) scale(${Zoom}) rotate(${Rotate}deg)`,
          })
          DragImg()
        })
      jQuery('.PhotoView-PhotoSlider__ArrowLeft')
        .off()
        .on('click', () => {
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

//过滤fileGUID重复的附件
export const deWeight = (arr: any, initArr: any = []) => {
  arr.forEach((item: any) => {
    const isFind = initArr.find((cell: any) => cell.fileGUID === item.fileGUID)
    if (!isFind) {
      initArr.push(item)
    }
  })
  return initArr
}

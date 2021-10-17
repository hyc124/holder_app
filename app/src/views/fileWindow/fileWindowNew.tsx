import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import { downloadFile } from '@/src/components/download-footer/downloadFile'
import { WinTitleBar } from '@/src/components/win-titlebar'
import LeftOutlined from '@ant-design/icons/lib/icons/LeftOutlined'
import RightOutlined from '@ant-design/icons/lib/icons/RightOutlined'
import { ipcRenderer } from 'electron'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
// import { ImagePreviewModal } from '../mettingManage/component/RenderUplodFile'
const init = {
  fileType: '',
  fileList: [],
  photoIndexKey: '',
  pdfUrl: '',
  fromType: '',
  currentIndex: 0,
  refresh: true,
}
const FileWindow = () => {
  const fileObj = useSelector((store: any) => store.fileObj, shallowEqual)
  const [state, setState] = useState<any>(init)
  useEffect(() => {
    const obj = $store.getState().fileObj
    if (obj?.fileList?.length > 0) {
      const { fileList, currentIndex } = initFileList(obj)
      state.currentIndex = currentIndex
      state.fileList = fileList
      setState({ ...state, ...obj, fileList, currentIndex })
    }

    //监听窗口显示时调用初始化方法刷新界面
    ipcRenderer.on('window-show', () => {
      // 窗口每次打开都刷新
      setState({ ...state, refresh: false })
      //使用了页面缓存需要通过显示隐藏刷新组件
      const obj = $store.getState().fileObj
      const { fileList, currentIndex } = initFileList(obj)
      state.currentIndex = currentIndex
      state.fileList = fileList
      setState({ ...state, ...obj, fileList, currentIndex, refresh: true })
    })
    ipcRenderer.on('win_close_ed', () => {
      setState({ ...init })
    })
  }, [])
  //dom更新完后鼠标滚动放大缩小拖拽
  useLayoutEffect(() => {
    setTimeout(() => {
      jQuery('.img_item_box')
        .off('mousewheel DOMMouseScroll')
        .on('mousewheel DOMMouseScroll', function(e) {
          const el: any = window.event
          const type = el.wheelDelta > 0 ? 1 : -1
          $tools.throttle(changeImgSize(type), 50)
        })
    }, 500)
    changePosition()
    // 监听键盘左右翻页
    $(document)
      .off('keydown')
      .on('keydown', function(event) {
        const e = event || window.event || arguments.callee.caller.arguments[0]
        if (e.keyCode == 37) {
          // 上一页
          state.currentIndex > 0 && changeImgKey(-1)
        } else if (e.keyCode == 39) {
          // 下一页
          state.currentIndex < state.fileList.length - 1 && changeImgKey(1)
        }
      })
  }, [state.fileList, state.photoIndexKey, state.currentIndex])
  // 过滤想要的图片出列表
  const initFileList = (fileObj: any) => {
    const { fileList, photoIndexKey, fromType } = fileObj
    const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
    const imgPreviewList: Array<any> = []
    let currentIndex: any = ''
    if (fromType == 'richText' || fromType == 'chatWinRichText') {
      // 富文本中预览传的参数fileList['url1','url2'],不支持下载

      fileList.forEach((item: any, index: any) => {
        imgPreviewList.push({
          fileKey: index,
          fileUrl: item,
        })
      })
    } else {
      fileList.forEach((item: any, index: any) => {
        const fileExt = item.displayName
          .toLowerCase()
          .split('.')
          .splice(-1)[0]
        if (imgFormatArr.includes(fileExt)) {
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
      })
    }
    for (let i = 0; i < imgPreviewList.length; i++) {
      const item = imgPreviewList[i]
      if (typeof item.fileKey === 'number' && item.fileKey == photoIndexKey) {
        // 进展汇报富文本框调用时传入key是数字
        currentIndex = i
      } else if (
        typeof item.fileKey === 'string' &&
        item.fileKey?.toLowerCase() == photoIndexKey?.toLowerCase()
      ) {
        currentIndex = i
      }
    }
    return { fileList: imgPreviewList, currentIndex }
  }
  // 上一页下一页
  const changeImgKey = (type: number) => {
    // type 上一页-1，下一页1
    if (state.currentIndex >= 0 && state.currentIndex < state.fileList.length) {
      const changeIndex = state.currentIndex + type
      setState({ ...state, currentIndex: changeIndex })
    }
  }
  //获取图片的Zoom，Rotate
  const getStyle = () => {
    const elstyle: any = jQuery('.img_item_box .img_item').attr('style')
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
  // 放大缩小
  const changeImgSize = (type: any) => {
    let { Zoom } = getStyle()
    const { Rotate } = getStyle()
    Zoom = Number(Zoom.toFixed(3))
    type > 0 ? (Zoom += 0.2) : (Zoom -= 0.2)
    if (Zoom < 5 && Zoom > 0.1) {
      jQuery('.img_item_box .img_item').css({
        transform: `translate3d(-50%, -50%, 0px) scale(${Zoom}) rotate(${Rotate}deg)`,
      })
    }
  }
  // 旋转
  const changeRotate = () => {
    const { Zoom } = getStyle()
    let { Rotate } = getStyle()
    Rotate += 90
    jQuery('.img_item_box .img_item').css({
      transform: `translate3d(-50%, -50%, 0px) scale(${Zoom}) rotate(${Rotate}deg)`,
    })
  }
  //拖拽图片
  let iX: any, iY: any, oX: any, oY: any
  const changePosition = () => {
    let dragging = false
    setTimeout(() => {
      jQuery('.img_item_box').on('mousedown', (e: any) => {
        dragging = true
        iX = e.clientX - jQuery('.img_item_box .img_item')[0].offsetLeft
        iY = e.clientY - jQuery('.img_item_box .img_item')[0].offsetTop
        return false
      })
    }, 500)
    setTimeout(() => {
      jQuery('.img_item_box').on('mousemove', function(e: any) {
        if (dragging) {
          oX = e.clientX - iX
          oY = e.clientY - iY
          jQuery('.img_item_box .img_item').css({
            left: oX + 'px',
            top: oY + 'px',
          })
          return false
        }
      })
    }, 500)
    setTimeout(() => {
      jQuery('.img_item_box').on('mouseup', function(e: any) {
        dragging = false
        e.cancelBubble = true
      })
    }, 500)
  }
  //下载图片
  const photoDownLoadFn = () => {
    const { fileObj } = $store.getState()
    const { dir, fromType } = fileObj

    state.fileList.forEach((item: any, index: any) => {
      if (index == state.currentIndex) {
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
  // 还原图片大小
  const changeRestoreSize = (type: any) => {
    const { Rotate } = getStyle()
    let newRotate
    if (Rotate > 360) {
      const RotateMore = Rotate % 360
      newRotate = Rotate - RotateMore
    } else if (Rotate == 360) {
      newRotate = Rotate
    } else {
      newRotate = 0
    }

    if (type) {
      //图片原始大小
      jQuery('.img_item_box .img_item').css({
        transform: `translate3d(-50%, -50%, 0px) scale(1) rotate(${newRotate}deg)`,
        maxHeight: 'none',
        maxWidth: 'none',
      })
    } else {
      // 自适应页面
      jQuery('.img_item_box .img_item').css({
        transform: `translate3d(-50%, -50%, 0px) scale(1) rotate(${newRotate}deg)`,
        maxHeight: '100%',
        maxWidth: '100%',
      })
    }
  }
  // 关闭窗口时清空图片缓存、
  const closePageHandle = () => {
    setState({ ...init })
  }
  return (
    <div className="file_win_Contair">
      {state.refresh && (
        <WinTitleBar
          params={{ fileList: state.fileList, currentIndex: state.currentIndex }}
          changeImgKey={changeImgKey}
          changeImgSize={changeImgSize}
          changeRotate={changeRotate}
          photoDownLoadFn={photoDownLoadFn}
          changeRestoreSize={changeRestoreSize}
          closePageHandle={closePageHandle}
        ></WinTitleBar>
      )}
      {state.refresh && (
        <div className="img_Contain">
          {state.fileType && state.fileType == 'img' && (
            <div className="img_Contair">
              {state.fileList.map((item: any, index: any) => {
                return (
                  <>
                    {index == state.currentIndex && (
                      <div key={index} className="img_item_box">
                        <img
                          className="img_item"
                          src={item.fileUrl}
                          style={{ transform: 'translate3d(-50%, -50%, 0px) scale(1) rotate(0deg)' }}
                        />
                      </div>
                    )}
                  </>
                )
              })}
            </div>
          )}
          {state.currentIndex > 0 && (
            <span
              className="change_img_icon back_icon"
              onClick={() => {
                changeImgKey(-1)
              }}
            >
              <LeftOutlined style={{ color: '#FFFFFF' }} />
            </span>
          )}
          {state.currentIndex < state.fileList.length - 1 && (
            <span
              className="change_img_icon next_icon"
              onClick={() => {
                changeImgKey(1)
              }}
            >
              <RightOutlined style={{ color: '#FFFFFF' }} />
            </span>
          )}
        </div>
      )}
      {/* <DownLoadFileFooter fromType={state.fromType == 'chatwin' ? state.fromType : 'mainWin'} /> */}
    </div>
  )
}
export default FileWindow

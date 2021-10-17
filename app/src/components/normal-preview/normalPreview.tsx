// ******************普通图片预览*********************//
import React, { useState, useImperativeHandle, useLayoutEffect } from 'react'
import HtmlToReact, { Parser } from 'html-to-react'
import { PhotoSlider } from 'react-photo-view'
import { PreviewModal } from '@/src/components/upload-file/index'
import 'react-photo-view/dist/index.css'
import { Imgscale, DragImg, CheckRes } from '@/src/components/upload-file/index'
import { getImgSize } from '@/src/common/js/common'

const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
/**
 * 替换富文本内容中图片为可点击节点
 * 方法1：转换为react节点1111
 * content:html内容
 * onPreviewImg：预览图片方法
 * parentNode:当前所传html是否已经包含父节点
 */
export const RenderPreImgs = ({
  content,
  photosRef,
  parentNode,
  htmlParentClass,
}: {
  content: string
  photosRef?: any
  parentNode?: boolean
  htmlParentClass?: string
}) => {
  // 替换img
  const reg = /<img [^>]*src=['"]([^'"]+)[^>]*>/g
  const regContentedit = /contenteditable="false"/gi
  const newCont = content
    ? content.replace(regContentedit, '').replace(reg, function(word: string, regStr: any) {
        return `<span class="img_box preview_img_box" datasrc="${regStr}">${word}</span>`
      })
    : ''
  const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React)
  const isValidNode = () => {
    return true
  }
  const preprocessingInstructions = [
    {
      // 检查img_box节点
      shouldPreprocessNode: function(node: { tagName: string; attribs: { class: string } }) {
        // return node.tagName && node.tagName === 'span'
        return node.attribs && node.attribs.class && node.attribs.class.includes('preview_img_box')
      },
      //   预设置img_box节点的属性
      preprocessNode: function(node: { attribs: { className: string; onClick: any; datasrc: string } }) {
        node.attribs = {
          ...node.attribs,
          // className: 'img_box',
          onClick: (e: any) => {
            e.stopPropagation()
            if (photosRef) {
              scaleFn()
              const params: any = {
                content: newCont,
                nowSrc: node.attribs.datasrc,
              }

              if (htmlParentClass) {
                params.areaDom = $(e.currentTarget).parents(`.${htmlParentClass}`)
              }
              photosRef.current.onPreviewImg(params)
            }
          },
        }
      },
    },
  ]
  const processingInstructions = [
    // {
    //   shouldProcessNode: function(node: { attribs: { class: string } }) {
    //     return node.attribs && node.attribs.class === 'img_box'
    //   },
    //   processNode: function(node: any, children: any, index: number) {
    //     // const newNode = { ...node, attribs: { ...node.attribs, onClick: handleClick } }
    //     return React.createElement('img', {
    //       key: index,
    //       src: node.attribs.src,
    //       className: 'img-around',
    //       onClick: e => {
    //         e.stopPropagation()
    //         message.info('666')
    //       },
    //     })
    //   },
    // },
    {
      shouldProcessNode: function() {
        return true
      },
      processNode: processNodeDefinitions.processDefaultNode,
    },
  ]
  const htmlToReactParser = new Parser()
  const reactComponent = htmlToReactParser.parseWithInstructions(
    newCont,
    isValidNode,
    processingInstructions,
    preprocessingInstructions
  )
  // 存在父节点直接返回子内容
  if (parentNode) {
    return reactComponent
  } else {
    return <div className="content_row">{reactComponent}</div>
  }
}

//图片放大缩小
const scaleFn = () => {
  Imgscale()
  DragImg()
  CheckRes()
}
/**
 * 替换富文本内容中图片为可点击节点
 * 方法2：html节点
 * content:html内容
 */
export const renderPreviewImgs = ({ content }: { content: string }) => {
  // 替换img
  const reg = /<img [^>]*src=['"]([^'"]+)[^>]*>/g
  const newCont = content.replace(reg, '<span class="preview_img_box" datasrc="$1"><img src="$1" /></span>')
  return newCont
}

/***
 * 图片预览
 * previewArea:自定义预览区域，可传class(.class名)、id(#id名)格式，
 * 传此参数后将查询自定义预览范围内图片，覆盖默认预览范围
 */
export const PhotosPreview = React.forwardRef(({ previewArea }: { previewArea?: string }, ref) => {
  // const [photoImages, setPhotoImages] = useState([]) //预览图片集合
  // const [imgVisible, setImgVisible] = useState(false) //图片预览
  // const [photoIndex, setPhotoIndex] = useState(0)
  // const [photoInfo, setPhotoInfo] = useState<any>({
  //   index: 0,
  //   visible: false,
  //   photoImages: [],
  // })
  //显示预览弹窗
  const [showPreview, setShowPreview] = useState(false)
  //预览详情
  const [previewInfo, setPreviewInfo] = useState<any>(null)
  // ***********************暴露给父组件的方法 start**************************//
  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(ref, () => ({
    /**
     * 预览图片调用方法
     */
    onPreviewImg,
  }))
  // ***********************暴露给父组件的方法 end**************************//

  // 预览图片显示
  const onPreviewImg = ({
    content,
    nowSrc,
    areaDom,
    fileinfo,
  }: {
    content?: any
    nowSrc: string
    areaDom?: any
    fileinfo?: any
  }) => {
    // 图片类型附件列表
    const data: any = []
    let showIndex = 0
    // 当前点击附件的数据信息1
    let fileInfo: any = ''
    // 当前点击附件的后缀名（没有fileinfo时默认为图片预览）
    let nowExt = ''
    // 自定义预览区域：所传区域节点内所有图片
    const previewsArea = areaDom ? areaDom : previewArea
    if (previewsArea) {
      $(previewsArea)
        .find('.preview_img_box>img,.img_box>img')
        .each((i, item) => {
          const handleSrc = $tools.htmlDecodeByRegExp($(item).attr('src') || '')

          data.push(handleSrc)
          if (handleSrc == nowSrc) {
            showIndex = i
            // 非图片附件类型
            if (handleSrc.includes('assets\\images\\fileIcon')) {
              nowExt = handleSrc.split('.')[0].split('assets\\images\\fileIcon')[1]
            }
            if (fileinfo) {
              fileInfo = fileinfo
            } else if (
              $(item).attr('fileinfo') &&
              $(item)
                .attr('fileinfo')
                ?.includes('{')
            ) {
              fileInfo = JSON.parse($(item).attr('fileinfo') || '')
            }
            if (fileInfo && fileInfo.fileName) {
              // 判断附件类型
              nowExt = fileInfo.fileName
                .toLowerCase()
                .split('.')
                .splice(-1)[0]
            }
          }
        })
    }
    // 默认预览区域：所解析content中所有图片
    else {
      content.replace(/<img [^>]*src=['"]([^'"]+)[^>]*>/g, function(regStr: any, srcStr: any) {
        const handleSrc = $tools.htmlDecodeByRegExp(srcStr)
        if (!handleSrc.includes('assets\\images\\fileIcon\\')) {
          data.push(handleSrc)
        }
        if (handleSrc == nowSrc) {
          // 缓存图片
          $('#previewTmp').html(regStr)
          // 查询和保存图片数据信息
          const imgNode = $('#previewTmp').find('img')
          const fileInfoStr = imgNode?.attr('fileinfo') || ''
          if (fileInfoStr && fileInfoStr.includes('{')) {
            fileInfo = JSON.parse(fileInfoStr)
            nowExt = fileInfo.fileName
              .toLowerCase()
              .split('.')
              .splice(-1)[0]
          }
          // 非图片附件类型
          if (handleSrc.includes('assets\\images\\fileIcon\\')) {
            nowExt = handleSrc.split('.')[0].split('assets\\images\\fileIcon')[1]
          }
        }
      })
    }
    // 判断附件类型
    // 非图片调用在线预览弹框（没有fileinfo时只能默认为图片预览）11111
    if (nowExt && !imgFormatArr.includes(nowExt) && fileInfo) {
      setShowPreview(true)
      setPreviewInfo({
        fileName: fileInfo.fileName,
        fileKey: fileInfo.fileKey,
        fileSize: fileInfo.fileSize || 0,
        dir: fileInfo.dir,
        uploadUser: fileInfo.uploadUser || '',
        uploadDate: fileInfo.uploadDate || '',
      })
    }
    // 图片文件调用图片预览
    else {
      for (let i = 0; i < data.length; i++) {
        const item: any = data[i]
        if (item.includes('assets\\images\\fileIcon\\')) {
          data.splice(i, 1)
          i--
        }
      }

      showIndex = data.indexOf(nowSrc)
      let imgWidthH: any = {}
      getImgSize(nowSrc).then(res => {
        console.log('图片的宽高', res)
        imgWidthH = res
        $store.dispatch({
          type: 'SET_FILE_OBJ',
          data: {
            imgWidthH,
            fromType: 'richText',
            fileType: 'img',
            fileList: [...data],
            photoIndexKey: showIndex,
          },
        })
        $tools.createWindow('fileWindow')
      })
    }
  }

  //获取图片的Zoom，Rotate
  const getStyle = (photoIndex: any) => {
    const elstyle: any = jQuery('.PhotoView-SlideWrap .PhotoView__PhotoWrap')
      .eq(photoIndex)
      .children()
      .find('img')
      .attr('style')
    const zoom: any =
      Number(
        elstyle
          .split(' ')[4]
          .split('scale(')[1]
          .split(')')[0]
      ) || 1
    const rotate: any = Number(
      elstyle
        .split(' ')[5]
        .split('rotate(')[1]
        .split('deg)')[0]
    )
    return {
      Zoom: zoom,
      Rotate: rotate,
    }
  }

  return (
    <section>
      {/* 图片附件 */}
      {/* 非图片附件预览 */}
      {showPreview && (
        <PreviewModal
          visible={showPreview}
          onCancel={() => {
            setShowPreview(false)
          }}
          {...previewInfo}
        />
      )}
      {/* 缓存内容 */}
      <div id="previewTmp" className="forcedHide"></div>
    </section>
  )
})

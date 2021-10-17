import React, { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import axios from 'axios'
import { message } from 'antd'
import ReactSummernote from 'react-summernote'
import 'react-summernote/lang/summernote-zh-CN'
import 'react-summernote/dist/react-summernote.css'
// Import bootstrap(v3 or v4) dependencies
import 'bootstrap/js/modal'
import 'bootstrap/js/dropdown'
import 'bootstrap/js/tooltip'
import 'bootstrap/dist/css/bootstrap.css'
import './index.less'
// import ImgPreviewModal from '@/src/components/img-preview/index'
import { renderPreviewImgs, PhotosPreview } from '@/src/components/normal-preview/normalPreview'
import * as Maths from '@/src/common/js/math'
import fs from 'fs'
import { setCaretEnd } from '@/src/common/js/common'
// import Tribute from '@/src/common/js/tribute'
const Tribute = require('../../common/js/tribute')

// let imageNodes: any[] = [] //缓存富文本图片节点

const fontNames = [
  '宋体',
  '微软雅黑',
  '楷体',
  '黑体',
  '隶书',
  'Arial',
  'Arial Black',
  'Comic Sans MS',
  'Courier New',
  'Helvetica Neue',
  'Helvetica',
  'Impact',
  'Lucida Grande',
  'Tahoma',
  'Times New Roman',
  'Verdana',
]

const IMAGES_SUFFIX = [
  'jpg',
  'png',
  'svgz',
  'pjp',
  'jfif',
  'xbm',
  'bmp',
  'pjpeg',
  'webp',
  'jpeg',
  'ico',
  'svg',
  'tif',
  'gif',
  'tiff',
]

interface SumerNoteProps {
  editorContent: any
  editorChange: (content: string) => void
  tools?: Array<Array<any>>
  minHeight?: number
  maxHeight?: number
  placeholder?: string
  height?: number | string
  onKeyUp?: (content: any) => void
  getEditor?: (editor: any) => void
  editorOnInit?: (note: any) => void
  onFocus?: (e?: any) => void
  onBlur?: (e?: any) => void
  showText?: boolean
  noInitUpdate?: boolean //初始化后不再更新
  id?: string
  className?: string //外部传入类名
  atEnable?: boolean //at功能可用
  previewArea?: string //图片预览区域
  visible?: any //富文本初始化显示时
  autoFocus?: any //自动获取焦点
}

let editorNode: any = null
// 正在输入(自动获取焦点时使用，避免输入后光标自动跑到最后)
let focusInputCheck = false
function ReactSummernoteContent({
  editorContent,
  editorChange,
  minHeight = 120,
  maxHeight,
  placeholder = '',
  tools = [],
  height,
  onKeyUp,
  editorOnInit,
  onFocus,
  onBlur,
  showText,
  noInitUpdate,
  className,
  id,
  atEnable,
  previewArea,
  autoFocus,
}: SumerNoteProps) {
  // 图片预览框组件
  const photosRef = useRef<any>(null)
  const noteRef = useRef<any>(null)
  // const [state, setState] = useState({
  //   editorContent,
  // })
  // useLayoutEffect(() => {
  //   if (atEnable && id) {
  //     atHandle({ idName: id })
  //   }
  // }, [id])

  // 富文本上传图片
  const uploadNoteFiles = (files: any) => {
    return new Promise<string>(resolve => {
      files.forEach((item: any) => {
        const fileNames = item.name.split('.')
        const suffix = fileNames[fileNames.length - 1]
        if (item.size > 1024 * 1024 * 100 || !IMAGES_SUFFIX.includes(suffix)) {
          message.warn('仅支持不大于100m的图片')
        } else {
          const uuid = Maths.uuid()
          const formDatas = new FormData()
          formDatas.append('file', item)
          formDatas.append('fileName', uuid)
          formDatas.append('dir', 'taskReport')
          const protocol = process.env.API_PROTOCOL
          const host = process.env.API_HOST
          axios({
            method: 'post',
            url: `${protocol}${host}/tools/oss/uploadFiles`,
            headers: {
              loginToken: $store.getState().loginToken,
            },
            data: formDatas,
          })
            .then(async (res: any) => {
              if (res.data.returnCode === 0) {
                const fileName = item.name
                const fileLastName = fileName
                  .toLowerCase()
                  .split('.')
                  .splice(-1)[0]
                const fileKey = uuid + '.' + fileLastName
                //获取地址
                const url = await $tools.getUrlByKey(fileKey, 'taskReport')
                resolve(url)
              }
            })
            .catch(err => {
              message.error(err.returnMessage)
            })
        }
      })
    })
  }

  //富文本上传图片
  const imageUpload = async (files: any) => {
    const imgUrl = await uploadNoteFiles(files)
    const img: any = document.createElement('img')
    img.contentEditable = false
    img.setAttribute('src', imgUrl)
    // 预览图片外添加父元素，父元素可以点击进入预览
    const box: any = document.createElement('span')
    box.contentEditable = false
    box.className = 'preview_img_box'
    box.setAttribute('datasrc', imgUrl)
    box.appendChild(img)
    ReactSummernote.insertNode(box)
    // previewSize()
  }

  const onInit = (note: any) => {
    editorNode = note
    //清空图片粘贴缓存节点
    // imageNodes = []
    // const handleContent = renderPreviewImgs({ content: editorContent || '' })
    let handleContent
    if (editorContent == '') {
      handleContent = renderPreviewImgs({ content: editorContent })
      note.replace(editorContent)
    } else {
      handleContent = editorContent
    }
    // noInitUpdate：是否不再重复更新，任务描述处使用，修复：任务描述移动端解析成字符串，insertText处理后显示的是字符串而非html
    if (handleContent) {
      // note.reset()
      const regex = /(\<\w*)((\s\/\>)|(.*\<\/\w*\>))/i
      if (handleContent.match(regex) !== null || noInitUpdate) {
        note.replace(handleContent)
      } else if (!noInitUpdate) {
        note.insertText(handleContent)
      }
    }
    // note.focus()
    if (editorOnInit) {
      editorOnInit(note)
    }

    // 绑定图片预览事件
    // if (previewArea) {
    //   $(previewArea)
    //     .find('.note-editor .preview_img_box')
    //     .off('click')
    //     .on('click', (e: any) => {
    //       photosRef.current.onPreviewImg({ nowSrc: $(e.currentTarget).attr('datasrc') })
    //     })
    // }
    // previewSize()
  }
  /**
   * 手动预览改变图片宽度 图片放大缩小点击偶现，取消图片放大操作
   */
  // const previewSize = () => {
  // 绑定图片预览事件
  // if (previewArea) {
  //   $(previewArea)
  //     .find('.note-editor .preview_img_box')
  //     .off('click')
  //     .on('click', (eve: any) => {
  //     if ($(eve.target).find('.choose_img_box').length > 0) {
  //       $(previewArea)
  //         .find('.note-editor .preview_img_box .choose_img_box')
  //         .remove()
  //     }
  //展示浮窗

  // $(eve.target).append(
  //   '<div class="note-popover popover in note-image-popover bottom choose_img_box">' +
  //     '<div class="arrow"></div>' +
  //     '<div class="popover-content note-children-container">' +
  //     '<div class="note-btn-group btn-group note-imagesize">' +
  //     '<button class="note-btn btn btn-default btn-sm" ><span class="bl">100%</span></button>' +
  //     '<button class="note-btn btn btn-default btn-sm" ><span class="bl">50%</span></button>' +
  //     '<button class="note-btn btn btn-default btn-sm" ><span class="bl">25%</span></button><div></div></div>'
  // )
  // 点击空白处隐藏
  // $('body')
  //   .off()
  //   .on('click', (e: any) => {
  //     const _con = $(previewArea).find('.note-editor .preview_img_box') // 设置目标区域
  //     if (!_con.is(e.target) && _con.has(e.target).length === 0) {
  //       $(previewArea)
  //         .find('.note-editor .preview_img_box .choose_img_box')
  //         .remove()
  //       $('body').off('click')
  //     }
  //   })

  // $('.choose_img_box').css({
  //   display: 'block',
  //   right: '20px',
  //   bottom: '20px',
  //   top: 'auto',
  //   left: 'auto',
  // })
  // $('.preview_img_box').css({
  //   position: 'relative',
  // })

  //监听choose_img_box的点击事件确定图片的尺寸大小
  // $('.choose_img_box')
  //   .off('click')
  //   .on('click', (e: any) => {
  //     //阻止冒泡
  //     e.stopPropagation()
  //     //判断100% 50% 25%
  //     // if (e.target.innerText.replace(/%/g, '') == 100) {
  //     // $(eve.target).attr('style', 'display:block;')
  //     $(eve.target)
  //       .parents('.preview_img_box')
  //       .attr('style', 'width:' + e.target.innerText)
  //     $(eve.target).attr('style', 'width:' + e.target.innerText)
  //     // }
  //     $(eve.target)
  //       .find('img')
  //       .attr('style', 'width:100%;max-width: 100%;')
  //     $(previewArea)
  //       .find('.note-editor .preview_img_box .choose_img_box')
  //       .remove()
  //     editorNode.insertText('')
  //   })

  // photosRef.current.onPreviewImg({ nowSrc: $(eve.currentTarget).attr('datasrc') })
  // })
  // }
  // }
  /**
   * 自动获取焦点处理
   */
  const autoFocusHandle = () => {
    if (autoFocus && !focusInputCheck) {
      const timer = setInterval(() => {
        if (noteRef) {
          setCaretEnd($(noteRef.current.noteEditable))
          clearInterval(timer)
        }
      }, 500)
    }
  }
  autoFocusHandle()
  return (
    <Fragment>
      <ReactSummernote
        ref={noteRef}
        id={`${id ? id : ''}`}
        className={`editorContent ${className ? className : ''} ${atEnable ? id : ''}`}
        value={editorContent}
        onInit={onInit}
        onFocus={(e: any) => {
          onFocus && onFocus(e)
        }}
        onBlur={() => {
          focusInputCheck = false
          onBlur && onBlur()
        }}
        options={{
          lang: 'zh-CN',
          placeholder,
          maxHeight,
          minHeight,
          height,
          fontNames,
          toolbar: [
            ['fontname', ['fontname']],
            ['font', ['fontsize', 'color', 'bold', 'italic', 'underline', 'strikethrough']],
            ['insert', ['fileBtn', 'link', 'picture']],
            ['para', ['ol', 'ul', 'paragraph', 'table', 'height']],
            ...tools,
          ],
          dialogsInBody: true, //模态框使用
        }}
        onImageUpload={(files: any) => imageUpload(files)}
        onChange={(content: string) => {
          // 匹配注释
          // const reg = /<!--(.|[\r\n])*?-->/g
          editorChange(content)
          // let node: any = {}
          // if (className) {
          //   node = $(`.${className}`).find('.note-editor .note-editable')
          // }
          // moveEnd(node)
        }}
        onPaste={(e: any) => {
          const item = (e.originalEvent || e).clipboardData.items[1]
          if (showText) {
            // 去除格式只显示文本
            e.preventDefault()
            const text = (e.originalEvent || e).clipboardData.getData('text/plain')
            document.execCommand('insertText', false, text)
          } else if (item) {
            e.preventDefault()
            if (item.kind == 'string') {
              item.getAsString(async (str: any) => {
                let htm = str
                if (htm.includes('<IMG') || htm.includes('<img')) {
                  const matchs = htm.match(/<img [^>]*src=['"]([^'"]+)[^>]*>/g)
                  const srcReg = /src=[\'\"]?([^\'\"]*)[\'\"]?/i
                  const newMatchs = await Promise.all(
                    matchs.map(async (idx: string) => {
                      const imgIdx: any[] = idx.match(srcReg) || []
                      if (imgIdx.length < 2) {
                        return ''
                      }
                      const url = imgIdx[1].split('///')[1]
                      const data = fs.readFileSync(url)
                      const files = new File([data], 'image.png', { type: 'image/png' })
                      const imgUrl = await uploadNoteFiles([files])
                      return imgUrl
                    })
                  )
                  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
                  let index: number = -1
                  const newHtm = htm.replace(/<img [^>]*src=['"]([^'"]+)[^>]*>/gi, function() {
                    index += 1
                    return `<img src="${newMatchs[index]}"/>`
                  })
                  document.execCommand('insertHTML', false, newHtm)
                  // previewSize()
                } else {
                  htm = renderPreviewImgs({ content: htm })
                  document.execCommand('insertHTML', false, htm)
                  // previewSize()
                }
              })
            }
          }
        }}
        onKeyUp={(content: any) => {
          // focusInputCheck = true
          onKeyUp && onKeyUp(content)
        }}
        onKeyDown={() => {
          focusInputCheck = true
        }}
        disableDragAndDrop={true}
      />

      <PhotosPreview ref={photosRef} previewArea={previewArea + ' .note-editor'} />
      <div id="noteEditorTmp" hidden></div>
    </Fragment>
  )
}
export default ReactSummernoteContent

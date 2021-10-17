import React, { useEffect } from 'react'
import { Modal, Tooltip } from 'antd'
import { pdfjs } from 'react-pdf'
import './PdfFile.less'
import { useMergeState } from '../../chat-history/chat-history'
import { FileSyncOutlined, FileSearchOutlined, BackwardOutlined, ForwardOutlined } from '@ant-design/icons'
pdfjs.GlobalWorkerOptions.workerSrc = `./pdfjs-dist/pdf.worker.js`
interface PdfProps {
  from?: string
  pdfUrl: string
  visible: boolean
  setVsible: (state: boolean) => void
  title?: string
}
let canvas: any = null
let pdfDoc: any = null
let largHeight = 0
const PdfModal: React.FC<PdfProps> = props => {
  const [pdfState, setPdfState] = useMergeState({
    Total: 0,
    PerviousPage: 1,
    LastPage: 1,
    pageNum: 1,
    pageRendering: false,
    pageNumPending: null,
    isFirstDisabled: true,
    isLastDisabled: false,
    fullscreen: false,
  })

  const [pxInfo, setPxInfo] = useMergeState({
    width: 960,
    height: 600,
    scale: 1.4,
  })

  useEffect(() => {
    const _h = window.innerHeight - 100
    pdfjs
      .getDocument({
        url: props.pdfUrl,
        cMapUrl: './pdfjs-dist/cmaps/', //加载pdf.js提供的字体文件
        cMapPacked: true, // 此参数需要设为true
      })
      .promise.then((pdfDoc_: any) => {
        pdfDoc = pdfDoc_
        setPdfState({
          Total: pdfDoc_._pdfInfo.numPages,
        })
        //初始化第一页文件
        renderPage(pdfState.pageNum, window.innerWidth, _h, pxInfo.scale)
        setPxInfo({
          ...pxInfo,
          height: _h,
        })
      })
  }, [])

  //获取canvas实例
  const setCanvas = (el: any) => {
    canvas = el
  }

  const renderPage = (num: any, _width: number, _height: number, scale: number) => {
    const ncanvas = canvas
    setPdfState({
      pageRendering: true,
    })
    //使用promise来获取页数
    pdfDoc.getPage(num).then((page: any) => {
      const viewport = page.getViewport({ scale })
      // const ptDom: any = $(ncanvas).parent('.canvas_room')
      // const maxWid = ptDom.width() - 60
      // console.log(viewport)
      ncanvas.height = _height
      ncanvas.width = viewport.width
      // ncanvas.width = viewport.width > maxWid ? maxWid : viewport.width
      largHeight = viewport.height

      setPxInfo({
        ...pxInfo,
        height: _height,
      })
      const renderContext = {
        canvasContext: ncanvas.getContext('2d'),
        viewport: viewport,
      }
      const renderTask = page.render(renderContext)
      // 等待渲染完成
      renderTask.promise.then(() => {
        setPdfState({
          pageRendering: false,
          isFirstDisabled: num > 1 ? false : true,
          isLastDisabled: num === pdfState.Total ? true : false,
        })
        if (pdfState.pageNumPending !== null) {
          setPdfState({
            pageNumPending: null,
          })
        }
      })
    })
    //改变页数计算
    setPdfState({
      pageNumPending: num,
    })
  }
  const queueRenderPage = (num: any) => {
    const { width, height, scale } = pxInfo
    if (pdfState.pageRendering) {
      setPdfState({
        pageNumPending: num,
      })
    } else {
      renderPage(num, width, height, scale)
    }
  }

  const onPrevPage = (e: any) => {
    e.stopPropagation()
    if (pdfState.PerviousPage <= 1) {
      return
    }
    const { PerviousPage } = pdfState
    const newPage = PerviousPage - 1
    queueRenderPage(newPage)
    setPdfState({
      PerviousPage: newPage,
    })
  }
  const onNextPage = (e: any) => {
    e.stopPropagation()
    if (pdfState.PerviousPage >= pdfDoc.numPages) {
      return
    }
    const { PerviousPage } = pdfState
    const newPage = PerviousPage + 1
    queueRenderPage(newPage)
    setPdfState({
      PerviousPage: newPage,
    })
  }

  const pageFullscreen = (e: any) => {
    e.stopPropagation()
    const { width, scale } = pxInfo
    if (!pdfState.fullscreen) {
      setPdfState({ fullscreen: true })
      setPxInfo({
        ...pxInfo,
        height: largHeight,
      })
      renderPage(pdfState.PerviousPage, width, largHeight, scale)
    } else {
      setPdfState({ fullscreen: false })
      setPxInfo({
        ...pxInfo,
        height: window.innerHeight - 100,
      })
      renderPage(pdfState.PerviousPage, width, window.innerHeight - 100, scale)
    }
  }

  return (
    <Modal
      centered
      className="pdf_wrap_pre_2"
      closable={props.from == 'fileWindow' ? false : true}
      maskStyle={{
        background: 'rgba(0, 0, 0, 0.75)',
      }}
      visible={props.visible}
      footer={null}
      width={'100%'}
      onCancel={() => props.setVsible(false)}
    >
      {/* <span
        className="pdf_close_btn"
        onClick={e => {
          e.stopPropagation()
          props.setVsible(false)
        }}
      >
        <CloseOutlined />
      </span> */}
      <div className="canvas_room" style={{ height: `${pxInfo.height}px` }}>
        <canvas id="pdfCanvas" ref={setCanvas} />
      </div>
      <div className="pageTool" style={{ bottom: `${!pdfState.fullscreen ? '25px' : '8px'}` }}>
        <Tooltip title={pdfState.PerviousPage == 1 ? '已是第一页' : '上一页'}>
          {/* <Button type="primary" onClick={onPrevPage}>上一页</Button> */}
          <BackwardOutlined className="font28" onClick={onPrevPage} />
        </Tooltip>
        <span>{pdfState.PerviousPage}</span>/<span>{pdfState.Total}</span>
        <Tooltip title={pdfState.PerviousPage == pdfState.numPages ? '已是最后一页' : '下一页'}>
          {/* <Button type="primary" onClick={onNextPage}>下一页</Button> */}
          <ForwardOutlined className="font28" onClick={onNextPage} />
        </Tooltip>
        <Tooltip title={pdfState.fullscreen ? '适应窗口' : '加载全部'}>
          {pdfState.fullscreen ? (
            <FileSyncOutlined onClick={pageFullscreen} />
          ) : (
            <FileSearchOutlined onClick={pageFullscreen} />
          )}
        </Tooltip>
      </div>
    </Modal>
  )
}

export default PdfModal

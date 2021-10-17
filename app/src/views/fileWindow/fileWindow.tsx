import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import { ipcRenderer } from 'electron'
import React, { useEffect, useState } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import PdfModal from '../mettingManage/component/PdfTest'
import { ImagePreviewModal } from '../mettingManage/component/RenderUplodFile'
const FileWindow = () => {
  const fileObj = useSelector((store: any) => store.fileObj, shallowEqual)
  const [state, setState] = useState<any>({
    fileType: fileObj.fileType,
    fileList: fileObj.fileList,
    photoIndexKey: fileObj.photoIndexKey,
    pdfUrl: fileObj.pdfUrl,
    visible: false,
    fromType: '',
  })
  useEffect(() => {
    state.visible = true
    setState({ ...state })
    // document.title = fileObj.fileName || '查看文件'
    // setFileUrl(fileObj.url)
    //监听窗口显示时调用初始化方法刷新界面
    ipcRenderer.on('window-show', () => {
      //使用了页面缓存需要通过显示隐藏刷新组件
      state.visible = false
      setState({ ...state })
      const obj = $store.getState().fileObj

      state.visible = true
      setState({ ...state, ...obj, visible: true })
    })
  }, [])
  const handleVisileClose = () => {
    state.visible = false
    setState({ ...state })
    ipcRenderer.send('close_file_window')
  }
  return (
    <div className="file_win_Contair">
      {state.fileType && state.fileType == 'img' && (
        <ImagePreviewModal
          from="imgWin"
          fileList={state.fileList}
          photoIndex_Key={state.photoIndexKey}
          visible={state.visible}
          handleVisile={() => {
            handleVisileClose()
          }}
        />
      )}
      {state.fileType && state.fileType == 'pdf' && (
        <PdfModal
          from={'fileWindow'}
          pdfUrl={state.pdfUrl}
          visible={state.visible}
          setVsible={(state: boolean) => {
            handleVisileClose()
          }}
        />
      )}
      <DownLoadFileFooter fromType={state.fromType == 'chatwin' ? state.fromType : 'mainWin'} />
    </div>
  )
}
export default FileWindow

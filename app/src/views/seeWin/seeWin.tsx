import React, { Fragment, useEffect, useState } from 'react'
import { ipcRenderer } from 'electron'
import { useSelector } from 'react-redux'
const seeFileWin = () => {
  // 附件预-览文件信息
  const [fileSrc, setFileSrc] = useState('')
  // const nowfileSrc = `http://192.168.100.105:56929/List.html?companyId=2&userId=9&fileId=Rw123456789`
  // setFileSrc(nowfileSrc)
  const fileViewData = useSelector((store: any) => store.fileViewData)
  // const newUrl = `http://192.168.100.105:56929/List.html?companyId=${fileViewData.companyId}&userId=${fileViewData.userId}&fileId=${fileViewData.fileId}`
  const newUrl = `http://192.168.102.170:5551/List.html?companyId=${fileViewData.companyId}&userId=${fileViewData.userId}&fileId=${fileViewData.fileId}`
  console.log(newUrl);
  console.log(fileViewData, 211);
  return (

    <div style={{ width: '100%' }}>
      <iframe id="pdfIframe" src={newUrl} width="100%" height="100%" frameBorder={0}></iframe>
    </div>
    // <div onClick={() => {
    //     const dialog = electron.remote.dialog
    //     dialog.showSaveDialog(
    //         {
    //             title: '另存文件',
    //             defaultPath: "C:\\自定义文件名.txt",
    //         },

    //     )
    // }}>
    //     11111
    // </div>
  )
}
export default seeFileWin

import React, { Fragment, useState, useEffect, useRef, useLayoutEffect } from 'react'
export const seeWin = import('../../views/seeWin/seeWin')
import './index.less'
import { getFileToken, getfileList } from './actions'
import { ipcRenderer } from 'electron'
import { openWindow } from '@/src/views/chatwin/getData/getData'
interface OrgProps {
  fileId: string
}
const OfficeUploadFile = ({ fileId }: OrgProps) => {
  const { nowUserId, selectTeamId } = $store.getState()

  // useEffect(() => {
  //     let data = {
  //         companyId: selectTeamId,
  //         userId: nowUserId
  //     }
  //     getFileToken(data).then((res: any) => {
  //         getFileListData(res.data.token)
  //     })
  // }, [fileId])
  // 获取文件list
  const getFileListData = (val: any) => {
    let data = {
      companyId: selectTeamId,
      userId: nowUserId,
      token: val,
      fileId: fileId,
    }
    getfileList(data).then((res: any) => {
      console.log(res, '收到')
    })
  }
  const openWindow = () => {
    let data = {
      companyId: selectTeamId,
      userId: nowUserId,
      fileId: fileId,
    }
    $store.dispatch({ type: 'SEE_FILE_VALUE', data: data })
    $tools.createWindow('seeWin')
  }
  return (
    <div>
      <span
        onClick={() => {
          openWindow()
        }}
      >
        添加附件
      </span>
      <div className="fileList">
        <div>111</div>
        <div>111</div>
        <div>111</div>
        <div>111</div>
        <div>111</div>
        <div>111</div>
        <div>111</div>
      </div>
    </div>
  )
}
export default OfficeUploadFile

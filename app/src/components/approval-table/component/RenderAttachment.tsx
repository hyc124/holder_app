import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import { CSSProperties } from 'react'
import React, { useState, useEffect } from 'react'
import $c from 'classnames'
import { UploadOutlined } from '@ant-design/icons'
import { RenderUplodFile, RenderFileList } from '@/src/views/mettingManage/component/RenderUplodFile'

//单独渲染附件
const RenderAttachment = ({
  formElementModel,
  formItemStyles,
  isAuth,
  changeData,
  coord,
  teamId,
  pageUuid,
  isExeEnter,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  isAuth: boolean
  changeData?: (item: any, value?: string, content?: string, pageUuid?: any, delFileIds?: any) => void
  coord: any
  teamId: any
  pageUuid: string
  isExeEnter?: boolean
}) => {
  const { formulaNumvalObj } = $store.getState()

  //新版附件需要的参数
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [defaultFiles, setDefaultFiles] = useState<Array<any>>([])
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])

  const attachVal = formElementModel.value || formulaNumvalObj[formElementModel.uuId] || '[]'
  const formvalue: any[] = JSON.parse(attachVal)
  // let approvalAttachList: any[] = []
  //设置url
  //组装新版附件组件需要的数据格式（审批特殊处理）
  //默认附件模板

  useEffect(() => {
    setNewFileList([])
    if (formElementModel.fileTemplate === 1) {
      const approvalAttachList = formElementModel.approvalFormElementContentModels.map(item => {
        return JSON.parse(item.contentValue)[0]
      })
      setDefaultFiles(approvalAttachList)
    } else {
      // approvalAttachList = formvalue
      setDefaultFiles(formvalue)
    }
  }, [formElementModel])

  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={'attachment'}
      data-uuid={formElementModel.uuId}
      data-mark={formElementModel.condition}
      data-isauth={formElementModel.edit === 0 ? false : true}
      data-isdef={formElementModel.isDefault === 1 ? true : false}
      data-isedit={formElementModel.special === 1 ? true : false}
      data-datetype={formElementModel.dateType}
      data-parentuuid={formElementModel.parentUuId}
      data-onlyflag={formElementModel.repeatRowVal}
      data-normalvalue={formElementModel.normalValue}
    >
      <div className={$c('plugRowLeft', { hideName: formElementModel.showName === 0 })}>
        {formElementModel.name}
      </div>
      <div className="plugRowRight">
        {isAuth && formElementModel.edit !== 0 && formElementModel.fileTemplate !== 1 && (
          <>
            {formElementModel.edit !== 0 && (
              <span
                className="formIcon file"
                onClick={() => {
                  setUploadVisible(true)
                  setLoadTime(new Date().getTime())
                }}
              >
                <UploadOutlined />
              </span>
            )}
            <RenderUplodFile
              visible={uploadVisible}
              leftDown={true}
              canDel={true}
              filelist={newFileList || []}
              teamId={teamId}
              fileId={`${pageUuid},${formElementModel.uuId}`}
              defaultFiles={defaultFiles || []}
              setVsible={state => setUploadVisible(state)}
              loadTime={loadTime}
              fileChange={(list: any, delGuid?: string) => {
                const { nowUser } = $store.getState()
                const contentArr: string[] = []
                let newList = []
                let files = [...defaultFiles]
                //删除了本身就存在的附件
                if (delGuid !== '') {
                  files = defaultFiles.filter((item: any) => item.fileKey !== delGuid)
                  setDefaultFiles(files)
                  const delInfo = [...delFileIds]
                  delInfo.push(delGuid)
                  setDelFileIds(delInfo)
                }
                newList = [...files, ...list]
                const valueStrArr = newList.map(item => {
                  contentArr.push(item.name)
                  return {
                    fileName: item.displayName,
                    displayName: item.displayName,
                    fileKey: item.fileGUID,
                    fileGUID: item.fileGUID,
                    fileSize: item.fileSize,
                    fileExt: item.fileExt,
                    downloadUrl: item.downloadUrl,
                    addTime: item.addTime,
                    officeUrl: item.officeUrl,
                    mobileOfficeUrl: item.mobileOfficeUrl,
                    dir: 'approval',
                    sourceType: 0,
                    uploadUser: nowUser,
                    uploadDate: $tools.getMyDate(new Date(), '/'),
                  }
                })
                const updateData = { [formElementModel.uuId]: JSON.stringify(valueStrArr) }
                changeData &&
                  changeData({
                    formElementModel: formElementModel,
                    data: updateData,
                    contentArr: contentArr.join(','),
                    pageUuid: pageUuid,
                    oldFile: files,
                    elementId: formElementModel.uuId,
                  })
                setNewFileList(list)
              }}
              isApproval={true}
            />
          </>
        )}
        {(formElementModel.fileTemplate === 1 || !isAuth) && (
          <RenderFileList list={defaultFiles || []} teamId={teamId} isApproval={true} />
        )}
      </div>
    </div>
  )
}
export default RenderAttachment

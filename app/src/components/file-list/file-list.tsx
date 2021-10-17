import React, { useRef } from 'react'
import { PhotoProvider } from 'react-photo-view'

import './file-list.less'
import FileListItem from './file-list-item'
import { PhotosPreview } from '../normal-preview/normalPreview'

interface FileListItemProps {
  fileName: string //文件名
  fileKey: string //文件key
  fileSize: number //文件大小
  dir: string //文件夹名称
  uploadUser: string //上传人名称
  uploadDate: string //上传时间
  fileGUID?: string
}

interface FileListProps {
  list: FileListItemProps[]
  fileStyle?: string
  canDel?: boolean //是否可删除
  delFile?: any //当前所删除附件的回调
  fileProgress?: boolean //是否显示进度(上传附件展示时使用)
}
const FileList = ({ list, fileStyle, delFile, canDel, fileProgress }: FileListProps) => {
  const photosRef = useRef<any>(null)
  if (list?.length === 0) {
    return null
  }
  return (
    <div className="file-container">
      {/* <PhotoProvider
        toolbarRender={({ rotate, onRotate }) => {
          return (
            <>
              <svg
                className="PhotoView-PhotoSlider__toolbarIcon"
                onClick={() => onRotate(rotate + 90)}
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
      > */}
      {list?.map((item, index) => (
        <FileListItem
          key={index}
          index={index}
          {...item}
          fileGUID={item.fileGUID ? item.fileGUID : item.fileKey}
          photosRef={photosRef}
          getPhotosRef={() => {
            return photosRef
          }}
          fileStyle={fileStyle}
          canDel={canDel}
          delFile={delFile}
          fileProgress={fileProgress}
        />
      ))}
      {/* </PhotoProvider> */}

      <PhotosPreview ref={photosRef} />
    </div>
  )
}

export default FileList

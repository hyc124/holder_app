import { findRepeat } from '@/src/common/js/common'
import { message, Modal } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { addMarksApi } from '../task/taskComApi'
import { CommentEditor } from '../task/taskSynergy/commentEditor'
// 外部调用弹框
export let editMarkModalHandle: any = null
let editMarkMsgRef: any = null
let editMarkFileList: any = []
/**
 * 添加备注弹框
 */
export const AddRemarkModal = ({
  cycleMNum,
  taskId,
  addMarksOk,
  teamId,
  from,
}: {
  cycleMNum: number
  taskId: any
  addMarksOk?: any
  teamId?: any
  from?: string
}) => {
  // *********************************备注*****************************//
  const [editMarkModal, setEditMarkModal] = useState<any>({
    visible: false,
    content: '',
    source: '',
    uuid: '',
  })
  // 编辑备注
  const editMarkRef = useRef<any>(null)
  const [msgTxtRef, setMsgTxtRef] = useState<any>(null)
  // useEffect(() => {
  editMarkModalHandle = setEditMarkModal
  // }, [])
  useEffect(() => {
    if (editMarkRef.current) {
      setMsgTxtRef(editMarkRef.current.getEditor())
    }
  }, [editMarkModal.visible])
  /**
   * 获取内容中的at人和文件
   */
  const getContentInfo = (ref: any, sortFiles: any) => {
    const atUsers: any = [],
      files: any = []
    if (ref) {
      // at人员
      $(ref)
        .find('.atUser')
        .each((i: number, item: any) => {
          atUsers.push($(item).attr('data-userid'))
        })
      // 附件
      $(ref)
        .find('.fileAdd,.img-around')
        .each((i: number, item: any) => {
          const fileKey = $(item).attr('data-filekey')
          // 查找是否已经存在附件
          const findItem = findRepeat({
            keyName: 'fileKey',
            keyVal: fileKey,
            list: sortFiles,
          })
          if (findItem) {
            files.push(findItem)
          }
        })
    }

    return {
      atUsers,
      files,
    }
  }

  /**
   * 获取表情图名字
   */
  const replaceImg = (ref: any) => {
    if (ref) {
      $(ref)
        .find('.emoji_icon')
        .each((i: number, item: any) => {
          const name = $(item).attr('data-name')
          $(item).prop('outerHTML', `[bq_${name}]`)
        })
      $(ref)
        .find('.fileAdd')
        .each((i: number, item: any) => {
          $(item).remove()
        })
    }
  }
  /**
   * 添加备注发布
   */
  const addMarksSave = () => {
    const sendVal = msgTxtRef.current.innerHTML
    if (sendVal === '') {
      message.warning('备注不能为空')
      return
    }
    const getInfo = getContentInfo(msgTxtRef.current, editMarkFileList)
    replaceImg(msgTxtRef.current)
    // 去除首尾空格
    const marksContent = msgTxtRef.current.innerHTML.replace(/(^\s*)|(\s*$)/g, '')
    const param = {
      taskId,
      opinion: marksContent,
      cycleNum: cycleMNum,
      toUsers: [],
      files: getInfo.files,
      atUserIds: getInfo.atUsers,
      temporaryId: editMarkModal.uuid,
    }
    addMarksApi(param).then((res: any) => {
      if (res.success) {
        msgTxtRef.current.innerHTML = ''
        editMarkFileList = []
        addMarksOk && addMarksOk()
      }
    })
  }
  return (
    <Modal
      className="baseModal remarkModel"
      visible={editMarkModal.visible}
      title="备注"
      onOk={() => {
        setEditMarkModal({ visible: false })
        addMarksSave()
      }}
      onCancel={() => {
        setEditMarkModal({ visible: false })
      }}
      width={400}
      centered={true}
      style={{ width: 450, height: 340 }}
    >
      <CommentEditor
        ref={editMarkRef}
        className="mark_edit_container"
        getEditor={(ref: any) => {
          editMarkMsgRef = ref
          // setEditMarkMsgRef(ref)
        }}
        param={{
          sourceType: 'markEdit',
          taskId,
          replay: { replayTip: '' },
          // addMarksSave,
          content: editMarkModal.content,
          handleBtn: {
            emoji: true,
            file: true,
            sendMsg: false,
          },
          forbidRelation: editMarkModal.source == 'okr' ? true : false, //是否禁止@
          teamId,
          pageUuid: editMarkModal.uuid,
          files: [],
          // changeAtUserIds: setAtUserIds,
          setFileList: ({ fileItem, imgUrl }: any) => {
            // setEditMarkFileList([...editMarkFileList, fileItem])
            editMarkFileList = [...editMarkFileList, fileItem]
            editMarkMsgRef.current.innerHTML += `<img class="fileAdd" src="${imgUrl}" data-filekey="${fileItem.fileKey}">`
          },
          // delCommentTxt,
        }}
      />
    </Modal>
  )
}

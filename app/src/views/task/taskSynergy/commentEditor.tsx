import React, { useState, useEffect, useRef, useImperativeHandle } from 'react'
import { Button, Avatar } from 'antd'
import './commentEditor.less'
import { queryTaskTypeUsersApi } from '../creatTask/getData'
import ChatEmoji from '@/src/components/chat-emoji/chat-emoji'
import { Diff } from 'diff'
import { RenderUplodFile } from '../../mettingManage/component/RenderUplodFile'
import { imgesGatter, getFileIcon } from '@/src/common/js/math'
import { SelectMemberOrg } from '@/src/components/select-member-org/index'

/**
 * 发送消息输入框
 */
let inputContent = ''
let cntindex = 0
let onKeyDown8 = false
export const CommentEditor = React.forwardRef(
  ({ param, className, getEditor }: { param: any; className?: string; getEditor?: any }, ref) => {
    const {
      taskId,
      replay,
      addMarksSave,
      replayCancel,
      content,
      setFileList,
      delCommentTxt,
      teamId,
      pageUuid,
      files,
      setFileInfo,
      showBtn,
    } = param
    const defaults = {
      handleBtn: {
        emoji: true,
        file: true,
        sendMsg: true,
      },
    }
    //   合并参数
    const options = { ...defaults, ...param }
    const handleBtn = options.handleBtn || {}
    const msgTxtRef = useRef<any>(null)
    //查询可以被@的人
    const [taskTypeUsers, setTaskTypeUsers] = useState<any>([])
    //获取@成员
    const [atUserIds, setAtUserIds] = useState<any>([])
    //@成员弹框显示
    // const [typeUsersshow, setTypeUsersShow] = useState(false)

    //选人插件反选信息
    const [selMemberOrg, setSelMemberOrg] = useState({})
    //选人插件
    const [memberOrgShow, setMemberOrgShow] = useState(false)
    //@成员弹框显示
    const [usersShow, setUsersShow] = useState(false)

    const [newFileList, setNewFileList] = useState<Array<any>>([])
    const [uploadVisible, setUploadVisible] = useState<boolean>(false)
    const [loadTime, setLoadTime] = useState<any>('')
    const [defaultFiles, setDefaultFiles] = useState<Array<any>>(files)
    const [delFileIds, setDelFileIds] = useState<Array<any>>([])
    // 监听
    useEffect(() => {
      queryTaskTypeUsers()
      if (getEditor) {
        getEditor(msgTxtRef)
      }
    }, [taskId])
    useEffect(() => {
      setDefaultFiles(files)
      setNewFileList([])
      setDelFileIds([])
    }, [pageUuid])
    // useEffect(() => {
    //   cursorloct(msgTxtRef.current)
    //   inputContent = msgTxtRef.current.innerText
    // }, [])
    // ***********************暴露给父组件的方法 start**************************//
    // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
    useImperativeHandle(ref, () => ({
      /**
       * 获取评论输入框组件
       */
      getEditor: () => {
        return msgTxtRef
      },
    }))
    // ***********************暴露给父组件的方法 end**************************//

    const setTypeUsersshow = (flag: boolean) => {
      console.log(flag)
    }
    /**
     * 自动获取焦点处理
     */
    const autoFocusHandle = () => {
      const timer = setInterval(() => {
        if (msgTxtRef) {
          clearInterval(timer)
          cursorloct(msgTxtRef.current)
        }
      }, 500)
    }
    autoFocusHandle()
    //查询可以被@的人
    const queryTaskTypeUsers = () => {
      const param = {
        taskId: taskId,
      }
      queryTaskTypeUsersApi(param).then((_: any) => {
        // setTaskTypeUsers(resData.dataList)
      })
    }
    //点击@人员
    // const downTaskTypeUsers = (e: any, item: any, types: string) => {
    //   setTypeUsersshow(false)
    //   let html
    //   if (types == 'all') {
    //     html = `<span style="color: #4285F4" contenteditable='false'
    //     class="atUser chatAt" data-userid="0">@所有人</span>&nbsp;`
    //   } else {
    //     html = `<span style="color: #4285F4" contenteditable='false'
    //     class="atUser chatAt" data-userid="${item.userId}">@${item.userName}</span>&nbsp;`
    //   }
    //   let str = msgTxtRef.current.innerHTML
    //   if (str.lastIndexOf('@') != -1) {
    //     //替换指定位置@
    //     // insertHtml()
    //     str = $tools.replaceChat(str, $tools.findstr(str, '@', cntindex), html, 1)
    //   }
    //   cntindex = 0
    //   msgTxtRef.current.innerHTML = str
    //   inputContent = msgTxtRef.current.innerText
    //   // setStatus(msgTxtRef.current.innerText)
    //   types == 'all' ? setAtUserIds([...atUserIds, 0]) : setAtUserIds([...atUserIds, item.userId])
    //   msgTxtRef.current.focus()

    //   //=============================================================================================
    //   // if (types == 'all') {
    //   //   //@所有人
    //   //   msgTxtRef.current.innerHTML +=
    //   //     '<span style="color: #4285F4" contenteditable="false" class="atUser" data-userid="0">所有人</span>'
    //   //   setAtUserIds([...atUserIds, 0])
    //   //   // changeAtUserIds([...atUserIds, 0])
    //   // } else {
    //   //   msgTxtRef.current.innerHTML += `<span style="color: #4285F4" contenteditable='false' class="atUser" data-userid="${item.userId}">${item.userName}</span>`
    //   //   setAtUserIds([...atUserIds, item.userId])
    //   //   // changeAtUserIds([...atUserIds, item.userId])
    //   // }
    // }
    const blankClick = () => {
      $('.taskManageContainer')
        .off('click')
        .on('click', (e: any) => {
          const _con = $('.select_at_user_list ') // 设置目标区域
          if (!_con.is(e.target) && _con.has(e.target).length === 0) {
            $('.taskManageContainer').off('click')
            setTypeUsersshow(false)
          }
        })
      $('.ant-modal-wrap')
        .off()
        .on('click', (e: any) => {
          const _con = $('.select_at_user_list') // 设置目标区域
          if (!_con.is(e.target) && _con.has(e.target).length === 0) {
            setTypeUsersshow(false)
            $('.ant-modal-wrap').off('click')
          }
        })
    }
    //绑定@事件
    const chatEventAt = (event: any) => {
      event.persist()
      const innerText = event.target.innerText
      const characterDiff = new Diff()
      const d = characterDiff.diff(inputContent, innerText)
      let isAt = false
      if (d.length !== 0) {
        for (let i = 0; i < d.length; i++) {
          const value = d[i].value || ''
          //判断当前输入@并且不是回退所影响
          if (value.trimLeft('') == '@' && onKeyDown8 == false) {
            // confidenPortrait(event) //@人中-常用联系人查询
            // console.log('value====', value)
            blankClick() //失焦收起
            isAt = true
            //计算当前是第几个at
            const arr1 = inputContent.split('')
            const arr2 = innerText.split('')
            for (let m = 0, n = 0; m < arr1.length > arr2.length ? arr2.length : arr1.length; m++, n++) {
              if (arr1[m] == arr2[n]) {
                if (arr2[m] == '@') {
                  cntindex++
                }
              } else {
                // cntindex++
                break
              }
            }
          }
        }
      }
      inputContent = innerText
      if (isAt && !options.forbidRelation) {
        // setTypeUsersshow(true)
        setMemberOrgShow(true)
        // 设置显示位置为光标的位置
        // setAtPostion()
      } else {
        // setTypeUsersshow(false)
        setUsersShow(false)
      }
      // const lastText = event.target.innerText.substr(event.target.innerText.length - 1)
      // if (lastText == '@') {
      //   setTypeUsersshow(true)
      //   blankClick()
      // } else {
      //   setTypeUsersshow(false)
      // }
    }
    //绑定输入框事件监听
    const changeSendVal = (e: any) => {
      e.persist()
      msgTxtRef.current.focus()
      chatEventAt(e)
    }

    // let sel: any = ''
    // let range: any = ''
    // let textContent: any = ''
    //失去焦点时获取光标的位置
    // const onblurEvent = () => {
    //   // sel = window.getSelection()
    //   // range = sel.getRangeAt(0)
    //   // range.deleteContents()
    // }
    // const insertHtmlAtCaret = (html: any) => {
    //   const windowRange: any = window.getSelection
    //   let d: any = document
    //   const dSelection: any = d.selection
    //   if (windowRange) {
    //     // IE9 and non-IE
    //     if (sel.getRangeAt && sel.rangeCount) {
    //       var el = document.createElement('div')
    //       el.innerHTML = html
    //       var frag: any = document.createDocumentFragment(),
    //         node,
    //         lastNode
    //       while ((node = el.firstChild)) {
    //         lastNode = frag.appendChild(node)
    //       }
    //       range.insertNode(frag)
    //       // Preserve the selection
    //       if (lastNode) {
    //         range = range.cloneRange()
    //         range.setStartAfter(lastNode)
    //         range.collapse(true)
    //         sel.removeAllRanges()
    //         sel.addRange(range)
    //       }
    //     }
    //   } else if (dSelection && dSelection.type != 'Control') {
    //     // IE < 9
    //     dSelection.createRange().pasteHTML(html)
    //   }
    //   // textContent = $('.fxAnswer').html()
    // }

    // const fileModelss: any = []
    /**
     * 处理附件数据
     */
    // const fileDataHandle = (list: any, dir: string) => {
    //   const fileModels: any = []
    //   list.map((item: any) => {
    //     const res = item.name.split('.')
    //     const suffix = res[res.length - 1]
    //     const obj = {
    //       id: item.id ? item.id : '',
    //       fileKey: item.fileKey ? item.fileKey : `${item.uid}.${suffix}`,
    //       fileName: item.name,
    //       fileSize: item.size,
    //       dir: dir,
    //       uploadUser: $store.getState().nowUser,
    //       uploadDate: dateFormats('yyyy/MM/dd hh:mm:ss'),
    //     }
    //     fileModels.push(obj)
    //   })
    // }

    /***
     * 输入框换行代码11
     * 光标处插入html代码，参数是String类型的html代码，例子："<p>猪头诺</p>"1
     */
    const insertHtml = (html: any) => {
      let sel: any, range
      const doc: any = document
      if (window.getSelection) {
        // IE9 或 非IE浏览器
        sel = window.getSelection()
        if (sel.getRangeAt && sel.rangeCount) {
          range = sel.getRangeAt(0)
          range.deleteContents()
          // Range.createContextualFragment() would be useful here but is
          // non-standard and not supported in all browsers (IE9, for one)
          const el = doc.createElement('div')
          el.innerHTML = html
          const frag = doc.createDocumentFragment()
          let node, lastNode
          while ((node = el.firstChild)) {
            lastNode = frag.appendChild(node)
          }
          range.insertNode(frag)
          // Preserve the selection
          if (lastNode) {
            range = range.cloneRange()
            range.setStartAfter(lastNode)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          }
        }
      } else if (doc.selection && doc.selection.type != 'Control') {
        // IE < 9
        doc.selection.createRange().pasteHTML(html)
      }
    }

    //选择成员设置数据
    const selMemberSure = (dataList: any, info: { sourceType: string }) => {
      const datas = dataList
      // console.log('成员参数', dataList)
      setUsersShow(false)
      for (let i = 0; i < datas.length; i++) {
        const html = `<span style="color: #4285F4" contenteditable='false' class="atUser" data-userid="${datas[i].userId}">@${datas[i].userName}</span>&nbsp;`
        let str = msgTxtRef.current.innerHTML
        if (str.lastIndexOf('@') != -1) {
          const idx = str.lastIndexOf('@')
          //替换指定位置@
          // str = $tools.replaceChat(str, idx, html, 1)
          // console.log('当前cntinde个数', cntindex)
          if (i < datas.length - 1)
            str = $tools.replaceChat(str, $tools.findstr(str, '@', cntindex), html + '@', 1)
          else str = $tools.replaceChat(str, $tools.findstr(str, '@', cntindex), html, 1)
        }
        msgTxtRef.current.innerHTML = str
        inputContent = msgTxtRef.current.innerText
        // setStatus(msgTxtRef.current.innerText)
        // setAtUserIds([...atUserIds, datas[i].userId])
        atUserIds.push(datas[i].userId)
        cntindex++
      }
      cntindex = 0
      // console.log('多选成员如下', atUserIds)
      cursorloct(msgTxtRef.current)
    }

    // 取消人员选择
    const selMemberClose = (visible: any) => {
      setMemberOrgShow(visible)
      cursorloct(msgTxtRef.current)
      // msgTxtRef.current.focus()
      // nameRef.focus()
    }

    return (
      <div className={`commentEditorBox msg-send ${className}`}>
        <div
          ref={msgTxtRef}
          className="msg-txt commentMsgEditor fxAnswer"
          contentEditable={true}
          dangerouslySetInnerHTML={{ __html: content ? content : '' }}
          onInput={changeSendVal}
          // onBlur={onblurEvent}
          onPaste={(e: any) => {
            // 去除格式只显示文本
            e.preventDefault()
            const text = (e.originalEvent || e).clipboardData.getData('text/plain')
            document.execCommand('insertText', false, text)
          }}
          onFocus={() => {
            queryTaskTypeUsers()
          }}
          placeholder={replay.replayTip ? replay.replayTip : '@提及他人，按Enter快速发布(Ctrl+Enter换行)'}
          onKeyDown={(e: any) => {
            if (e.keyCode == 8) {
              onKeyDown8 = true
              //调用delCommentTxt() 暂时不知道干啥的
              if (delCommentTxt) {
                delCommentTxt()
              }
              //判断当前是否删除到@人的模块 不然就删除
              console.log('当前的输入字符串', msgTxtRef.current)
              //todo暂未删除@人的情况
            } else {
              onKeyDown8 = false
              if (e.keyCode == 13 && !e.ctrlKey) {
                e.cancelBubble = true
                e.preventDefault()
                e.stopPropagation()
                addMarksSave()
              } else if (e.keyCode == 13 && e.ctrlKey) {
                //ctrl+enter换行
                insertHtml('<br/>')
                //如果是在每行最后换行多加一个br
                const win: any = window
                if (win.getSelection().focusOffset != 0) {
                  insertHtml('<br/>')
                }
              }
            }
          }}
        ></div>
        <div className={`handle-btn-group flex between ${handleBtn ? '' : 'forcedHide'}`}>
          <div className="fileRoom" style={{ width: '100%', height: '86px', overflow: 'overlay' }}>
            <RenderUplodFile
              visible={uploadVisible}
              leftDown={false}
              canDel={true}
              filelist={newFileList}
              teamId={teamId}
              fileId={pageUuid}
              defaultFiles={defaultFiles}
              setVsible={state => setUploadVisible(state)}
              loadTime={loadTime}
              fileChange={(list: any, delGuid?: string) => {
                if (delGuid !== '') {
                  const files = defaultFiles.filter((item: any) => item.fileGUID !== delGuid)
                  setDefaultFiles(files)
                  const delInfo = [...delFileIds]
                  delInfo.push(delGuid)
                  setDelFileIds(delInfo)
                  setFileInfo && setFileInfo(delInfo)
                }
                setNewFileList(list)
                cursorloct(msgTxtRef.current)
              }}
            />
          </div>
          <div className="msg-btn-option">
            <div>
              <Button
                className="msg-handle-btn file_icon"
                onClick={() => {
                  setUploadVisible(true)
                  setLoadTime(new Date().getTime())
                }}
              ></Button>
            </div>
            <div className={`${handleBtn.sendMsg ? '' : 'forcedHide'}`}>
              <Button className={`${replay.replayTip ? '' : 'forcedHide'}`} onClick={replayCancel}>
                取消
              </Button>
              <Button type="primary" className="send_msg_btn" onClick={addMarksSave}>
                {replay.replayTip ? '回复' : '发布'}
              </Button>
            </div>
          </div>
        </div>

        {/* 选人插件 */}
        {memberOrgShow && (
          <SelectMemberOrg
            param={{
              // checkboxType: 'checkbox',
              visible: memberOrgShow,
              teamId: teamId ? teamId : 0,
              allowTeamId: [teamId],
              ...selMemberOrg,
            }}
            action={{
              setModalShow: selMemberClose,
              // 点击确认
              onSure: selMemberSure,
            }}
          />
        )}
      </div>
    )
  }
)
//选择表情
export const selectEmojiCallback = ({
  value,
  insertHtmlAtCaret,
}: {
  value: string
  insertHtmlAtCaret: any
}) => {
  const imgUrl = $tools.asAssetsPath(`/emoji/${value}`)
  // msgTxtRef.current.innerHTML += `<img class="emoji_icon" src="${imgUrl}.png" data-name="${value}"/>`
  // cursorloct(msgTxtRef.current)
  insertHtmlAtCaret(`<img class="emoji_icon" src="${imgUrl}.png" data-name="${value}"/>`)
}
//光标定位最后
const cursorloct = (obj: any) => {
  if (!obj) return
  if (window.getSelection) {
    //ie11 10 9 ff safari
    $(obj).focus() //解决ff不获取焦点无法定位问题
    const range: any = window.getSelection() //创建range
    if (range) {
      range.selectAllChildren($(obj)[0]) //range 选择obj下所有子内容
      range.collapseToEnd() //光标移至最后
    }
  }
}

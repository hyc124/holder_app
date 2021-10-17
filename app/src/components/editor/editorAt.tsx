import React, { useState, useEffect } from 'react'
// import { differStr, differArr } from '@/src/common/js/common'
import { SelectMemberOrg } from '@/src/components/select-member-org/index'
// import { setNodeCaretPos } from '@/src/common/js/common'
import * as Maths from '@/src/common/js/math'
// 富文本框内容改变前记录的内容
export let oldEditorCont = ''
// 缓存记录输入@时的位置信息
const inputAtInfo: any = {
  endOffset: 0,
  startContainer: {},
}
export const setOldEditorTxt = (content: string | '') => {
  oldEditorCont = content
}
// 检测触发@的方法
let checkAt: any = null
// 富文本输入框节点
let getNode: any
/**
 * 查询新增的字符
 * @param str1
 * @param str2
 */
const newAddStr = (newStr: string, oldStr: string) => {
  let newAdd = ''
  for (let i = 0; i < newStr.length; i++) {
    if (((newStr[i] != ' ' || oldStr[i] != ' ') && newStr[i] != oldStr[i]) || i == oldStr.length) {
      newAdd = newStr[i]
      break
    }
  }
  return {
    newChat: newAdd,
  }
}

// 富文本框内容改变
// export const editorAtChange = ({
//   conHtml,
//   allowTeamId,
//   editor,
//   node,
//   joinMembers,
//   sourceType,
// }: {
//   conHtml: any
//   allowTeamId: any
//   editor?: any
//   node: any
//   joinMembers?: any
//   sourceType?: string
// }) => {
//   //光标定位最后
//   const cursorloct = (obj: any) => {
//     if (window.getSelection) {
//       //ie11 10 9 ff safari
//       obj.focus() //解决ff不获取焦点无法定位问题
//       const range: any = window.getSelection() //创建range
//       if (range) {
//         range.selectAllChildren(obj) //range 选择obj下所有子内容
//         range.collapseToEnd() //光标移至最后
//       }
//     }
//   }
//   getNode = node
//   console.log(conHtml, allowTeamId, editor, node, joinMembers, sourceType)
//   $('#editorTmpNode').html(conHtml)
//   const newTxt = $('#editorTmpNode').text()
//   // const res = differStr(newTxt, oldEditorTxt)
//   $('#editorTmpNode').html(oldEditorCont)
//   const oldEditorTxt = $('#editorTmpNode').text()
//   const newAddChar = newAddStr(newTxt, oldEditorTxt)
//   // const lastText = newTxt.substr(newTxt.length - 1)
//   if (newTxt.length > oldEditorTxt.length && newAddChar.newChat == '@') {
//     const getNowText = $(node).html()
//     let newText: any =
//       getNowText.substring(0, getNowText.lastIndexOf('@')) +
//       getNowText.substring(getNowText.lastIndexOf('@') + 1)
//     $(node).html(newText)
//     cursorloct(node[0])
//     checkAt({
//       isAt: true,
//       allowTeamId,
//       editor,
//       node,
//       joinMembers,
//       sourceType,
//     })
//   }
//   oldEditorCont = newTxt
// }
export const editorAtChange = (paramObj: {
  conHtml: any
  allowTeamId: any
  editor?: any
  node: any
  joinMembers?: any
  sourceType?: string
  itemData?: { contentKey: string; item: any } //当前项 contentKey：富文本展示内容的键名 item：当前项数据对象
}) => {
  const { conHtml, node } = paramObj
  getNode = node
  // console.log(conHtml, allowTeamId, editor, node, joinMembers, sourceType)
  // 缓存内容到缓存节点
  $('#editorTmpNode').html(conHtml)
  const newTxt = $('#editorTmpNode').text()
  // const res = differStr(newTxt, oldEditorTxt)
  $('#editorTmpNode').html(oldEditorCont)
  const oldEditorTxt = $('#editorTmpNode').text()
  const newAddChar = newAddStr(newTxt, oldEditorTxt)
  // const lastText = newTxt.substr(newTxt.length - 1)
  if (newTxt.length > oldEditorTxt.length && newAddChar.newChat == '@') {
    const win: any = window
    const selection = win.getSelection()
    const range = selection.getRangeAt(0)
    // 存取当前输入@的位置
    inputAtInfo.endOffset = range.endOffset
    inputAtInfo.startContainer = range.startContainer
    checkAt({
      ...paramObj,
      isAt: true,
    })
  }
  oldEditorCont = newTxt
}
/**
 * 获取at人员
 */
export const getAtUsers = ({ content }: { content: string }) => {
  const atUsers: any = []
  $('#editorTmpNode').html(content)
  // at人员
  $('#editorTmpNode')
    .find('.atUser')
    .each((_: number, item: any) => {
      atUsers.push({
        id: $(item).attr('data-userid'),
        username: $(item).text(),
      })
    })
  // 去重
  const atUsersDiffer = atUsers.reduce(
    (prev: any, cur: any) => (prev.some((item: any) => item['id'] == cur['id']) ? prev : [...prev, cur]),
    []
  )
  return atUsersDiffer
}
// const moveEnd = (obj: any) => {
//   if (window.getSelection) {
//     //ie11 10 9 ff safari
//     obj.focus() //解决ff不获取焦点无法定位问题
//     const range: any = window.getSelection() //创建range
//     if (range) {
//       range.selectAllChildren(obj[0]) //range 选择obj下所有子内容
//       range.collapseToEnd() //光标移至最后
//     }
//   }
// }
const EditorAt = () => {
  //选人插件
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  const body: any = $('body')
  checkAt = ({
    isAt,
    allowTeamId,
    editor,
    node,
    joinMembers,
    sourceType,
    itemData,
  }: {
    isAt: boolean
    allowTeamId: any
    editor: any
    node: any
    joinMembers?: any
    sourceType?: string
    itemData?: { contentKey: string; item: any } //当前项 contentKey：富文本展示内容的键名 item：当前项数据对象
  }) => {
    getNode = node
    if (isAt) {
      node.focus()
      // 输入@选择人员时阻止浏览器默认行为，防止富文本失去焦点
      body.off('mousedown').on('mousedown', (e: any) => {
        e.preventDefault()
      })
      const orgBotList: any = []
      if (joinMembers) {
        joinMembers.map((titem: any) => {
          orgBotList.push({
            curId: titem.userId,
            curName: titem.username,
            curType: 0,
            cmyId: titem.teamId,
            cmyName: titem.teamName,
            profile: titem.profile,
          })
        })
      }
      //
      const win: any = window
      const selection = win.getSelection()
      const range: any = document.createRange()
      const selectedElem = selection.anchorNode
      // 当前有效区域:range中anchorNode字符串
      let effectiveRange: any = null
      if (selectedElem != null) {
        const workingNodeContent = selectedElem.textContent
        const selectStartOffset = selection.getRangeAt(0).startOffset

        if (workingNodeContent && selectStartOffset >= 0) {
          effectiveRange = workingNodeContent.substring(0, selectStartOffset)
        }
      }
      // anchorNode 有效字符串中@的位置
      const mostRecentTriggerCharPos = effectiveRange.lastIndexOf('@')
      // const mentionText = effectiveRange.substring(mostRecentTriggerCharPos + 1, effectiveRange.length)
      // anchorNod红输入@的位置
      range.setStart(selection.anchorNode, mostRecentTriggerCharPos)
      range.setEnd(selection.anchorNode, mostRecentTriggerCharPos + 1)
      // range = range.cloneRange()
      const memberOrg: any = {
        visible: true,
        selectList: [],
        allowTeamId: allowTeamId,
        checkboxType: 'checkbox',
        onSure: (dataList: any) => {
          // 删除@符号
          range.deleteContents()
          // uuid
          const uuId = Maths.uuid()
          // 所有at人父节点容器
          const ptDom: any = document.createElement('span')
          let lastNode: any
          dataList?.map((item: any, i: number) => {
            let showName = item.curName
            if (i != dataList.length - 1) {
              showName += '&nbsp;'
            }
            // 创建at人节点
            const _dom: any = document.createElement('span')
            _dom.style = 'color: #4285F4'
            _dom.innerHTML = '@' + showName
            _dom.contentEditable = false
            _dom.className = 'atUser'
            _dom.id = uuId
            _dom.setAttribute('data-userid', item.curId)
            lastNode = ptDom.appendChild(_dom)
          })
          // 插入@人员
          range.insertNode(ptDom)
          // ****1 删除输入的@*****//
          // 清除输入的@符号
          // range.startContainer.nodeValue = range.startContainer.nodeValue.replace('@', '')
          // 保存最新内容到缓存节点
          $('#editorTmpNode').html($(node).html())
          // 方法1
          // setTimeout(() => {
          //   const lastNode = ptDom.lastChild
          //   // 替换内容为清除@后的文本
          //   editor.replace($('#editorTmpNode').html())
          //   // 外部使用数据保存
          //   if (itemData) {
          //     itemData.item[itemData.contentKey] = $('#editorTmpNode').html()
          //   }
          //   const selection = win.getSelection()
          //   const range = selection.getRangeAt(0)
          //   // Before
          //   range.setStartBefore(lastNode)
          //   // range.setEndBefore(lastNode)
          //   // range.setStart(lastNode, endOffset)
          //   // range.setEnd(lastNode, endOffset)
          //   // 删除选中的文本-@符号
          //   // doc.execCommand('Delete')
          //   range.collapse(true)
          //   selection.removeAllRanges()
          //   selection.addRange(range)
          //   // 缓存记录当前最新内容
          //   oldEditorCont = $('#editorTmpNode').html()
          // }, 50)

          // 方法2
          // 替换内容为清除@后的文本
          editor.replace($('#editorTmpNode').html())
          // 外部使用数据保存
          if (itemData) {
            itemData.item[itemData.contentKey] = $('#editorTmpNode').html()
          }
          // range = range.cloneRange()
          // 设置光标位置在插入节点后
          if (lastNode) {
            range.setStartAfter(lastNode)
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
          }
          // 缓存记录当前最新内容
          oldEditorCont = $('#editorTmpNode').html()
        },
      }
      // 底部参与企业展示
      if (sourceType == 'report') {
        memberOrg.orgBotInfo = {
          type: 'joinTeam',
          title: '参与企业联系人（该任务链条下的企业联系人）',
        }
        memberOrg.orgBotList = orgBotList
      }
      setSelMemberOrg(memberOrg)
    }
  }
  useEffect(() => {
    if (selMemberOrg.visible) {
      $(getNode).focus()
      setTimeout(() => {
        $(getNode).focus()
      }, 1000)
    } else {
      body.off('mousedown')
    }
  }, [selMemberOrg.visible])

  return (
    <section>
      {/* 用于缓存字符的节点 */}
      <div id="editorTmpNode" className="forcedHide"></div>
      {/* 选人弹窗 */}
      {selMemberOrg.visible && (
        <SelectMemberOrg
          param={...selMemberOrg}
          action={{
            setModalShow: (flag: boolean) => {
              setSelMemberOrg({ ...selMemberOrg, visible: flag })
            },
          }}
        />
      )}
    </section>
  )
}

const pasteHtml = (html: any, startPos: any, endPos: any) => {
  let range: any
  const sel: any = window.getSelection()
  // const range = selection.getRangeAt(0)
  range = document.createRange()
  range.setStart(sel.anchorNode, startPos)
  range.setEnd(sel.anchorNode, endPos)
  range.deleteContents()
  const el: any = document.createElement('div')
  el.innerHTML = html
  const frag: any = document.createDocumentFragment()
  let node: any, lastNode: any

  while ((node = el.firstChild)) {
    lastNode = frag.appendChild(node)
  }

  range.insertNode(frag) // Preserve the selection

  if (lastNode) {
    range = range.cloneRange()
    range.setStartAfter(lastNode)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

export default EditorAt

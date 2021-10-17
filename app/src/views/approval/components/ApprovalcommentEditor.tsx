import React, { useState, useEffect, useRef, useImperativeHandle, useReducer } from 'react'
import { Button, Avatar, Tooltip } from 'antd'
import './AddSignModal.less'
import { confidenPortraitApi } from '../getData/getData'
import UploadFile from '@/src/components/upload-file/index'
import { SelectMemberOrg } from '@/src/components/select-member-org/index'
import { Diff } from 'diff'
import { RenderUplodFile } from '../../mettingManage/component/RenderUplodFile'
import * as Maths from '@/src/common/js/math'
import { setCaretEnd, setNodeCaretPos } from '@/src/common/js/common'
import { ipcRenderer } from 'electron'
/**
 * 发送消息输入框
 */
const initStates = {
  setPortraitlist: [], //常用联系人列表
}
// state初始化initStates参数 action为dispatch传参
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'setPortraitlist':
      return { ...state, setPortraitlist: action.data }
    default:
      return state
  }
}
let inputContent = ''
let cntindex = 0
export const ApprovalcommentEditor = React.forwardRef(
  (
    {
      param,
      className,
      getEditor,
      source,
    }: { param: any; className?: string; getEditor?: any; source?: string },
    ref
  ) => {
    // const { replay, addMarksSave, replayCancel, content, setFileList, delCommentTxt } = param
    const {
      replay,
      content,
      setFileList,
      setStatus,
      delCommentTxt,
      compCommentHight,
      teamId,
      atUserIds,
      addFiles,
      setAtUserIds,
      setAddFiles,
      fileModelss,
      currentType,
      item,
      getFileId,
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
    //选人插件反选信息
    const [selMemberOrg, setSelMemberOrg] = useState({})
    //选人插件
    const [memberOrgShow, setMemberOrgShow] = useState(false)
    //@成员弹框显示
    const [usersShow, setUsersShow] = useState(false)
    // reducer初始化参数
    const [state, dispatch] = useReducer(reducer, initStates)

    const [uploadVisible, setUploadVisible] = useState<boolean>(false)
    const [loadTime, setLoadTime] = useState<any>('')
    const [pageUuid, setPageUuid] = useState('')
    const [commentState, setCommentState] = useState({
      content,
    })

    useEffect(() => {
      // 提交备注后，清空上一次输入的值
      ipcRenderer.on('clear_inp_val', (event, args) => {        
        inputContent = ''
      })
    },[])

    // 监听
    useEffect(() => {
      if (getEditor) {
        getEditor(msgTxtRef)
      }
    }, [msgTxtRef])

    useEffect(() => {
      msgTxtRef.current.focus()
      inputContent = msgTxtRef.current.innerText
      setPageUuid(Maths.uuid())
    }, [])
    useEffect(() => {
      setCommentState({ ...commentState, content })
    }, [content])
    useEffect(() => {
      if (msgTxtRef && msgTxtRef.current) {
        setCaretEnd($(msgTxtRef.current))
      }
    }, [commentState.content])
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
    const blankClick = () => {
      $('.approval-conatainer')
        .off()
        .on('click', (e: any) => {
          const _con = $('.select_at_user_list ') // 设置目标区域
          if (!_con.is(e.target) && _con.has(e.target).length === 0) {
            $('.ApprovalcommentEditor').off('click')
            setUsersShow(false)
          }
        })
      if (msgTxtRef.current.blur()) {
        setUsersShow(false)
      }
      $('.ant-modal-wrap')
        .off()
        .on('click', (e: any) => {
          const _con = $('.select_at_user_list') // 设置目标区域
          if (!_con.is(e.target) && _con.has(e.target).length === 0) {
            $('.ant-modal-wrap').off('click')
          }
        })
    }
    //@人中-常用联系人查询
    const confidenPortrait = (e: any) => {
      const param = {
        userId: $store.getState().nowUserId,
        account: $store.getState().nowAccount,
        onlyUser: 1, //0不查岗位 1 查
        permissionType: 3, //0子管理 1任务 2关注人
        pageSize: 10,
        teamId: teamId,
        type: 0, //查询类型  1 团队  2 企业
      }
      const url = '/team/teamUserInfo/findContacts'
      confidenPortraitApi(param, url).then((resdata: any) => {
        const datas = resdata.dataList
        dispatch({
          type: 'setPortraitlist',
          data: datas,
        })
      })
    }

    //========================================================================================================
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
          if (value.trimLeft('') == '@') {
            confidenPortrait(event)
            blankClick()
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
                break
              }
            }
          }
          if (d[i].removed) {
            // 解决：删除@时弹选择成员窗口，（解决：添加或者删除@字符后一个字符时弹窗）
            isAt = false
            msgTxtRef.current.focus()
          }
        }
      }
      inputContent = innerText
      if (isAt) {
        // @直接展示组织架构
        setMemberOrgShow(true)
        // setUsersShow(true)
        // 设置显示位置为光标的位置
        // setAtPostion()
      } else {
        setUsersShow(false)
      }
    }
    //组织架构选人
    const selectUser = () => {
      const selectLists: any = []
      let initSelMemberOrg: any = {}
      setMemberOrgShow(true)
      initSelMemberOrg = {
        teamId: teamId,
        sourceType: '', //操作类型
        allowTeamId: [teamId],
        selectList: selectLists, //选人插件已选成员
        checkboxType: 'checkbox',
        isDel: false, //是否可以删除 true可以删除
        permissionType: 3, //组织架构通讯录范围控制
        checkableType: [0], //部门 企业 人员都可选择
      }
      setSelMemberOrg(initSelMemberOrg)
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
        setStatus(msgTxtRef.current.innerText)
        // setAtUserIds([...atUserIds, datas[i].userId])
        atUserIds.push(datas[i].userId)
        cntindex++
      }
      cntindex = 0
      // console.log('多选成员如下', atUserIds)
      cursorloct(msgTxtRef.current)
    }
    //绑定输入框事件监听
    const changeSendVal = (e: any) => {
      msgTxtRef.current.focus()
      e.persist()
      if (source == 'taskReportDetail') {
        setStatus(e.target.innerText) // 修改为这样@ 成员可高亮显示
        // $('.ApprovalcommentEditor .commentMsgEditor').text(e.target.innerText)
        chatEventAt(e)
      } else {
        chatEventAt(e)
        // msgTxtRef.current.focus()
        setStatus(e.target.innerText)
      }
      // setStatus(e.target.innerText)
    }

    // 取消人员选择
    const selMemberClose = (visible: any) => {
      setMemberOrgShow(visible)
      cursorloct(msgTxtRef.current)
      // msgTxtRef.current.focus()
      // nameRef.focus()
    }

    //光标定位最后
    const cursorloct = (obj: any) => {
      if (window.getSelection) {
        //ie11 10 9 ff safari
        obj.focus() //解决ff不获取焦点无法定位问题
        const range: any = window.getSelection() //创建range
        if (range) {
          range.selectAllChildren(obj) //range 选择obj下所有子内容
          range.collapseToEnd() //光标移至最后
        }
      }
    }
    let commentContent = commentState.content
    // currentType == 'replaytrail'
    //   ? commentState.content
    //     ? commentState.content
    //     : `<span style="color: #4285F4" contenteditable='false' class="atUser Myself" data-userid="${item.userId}">@${item.username} </span>&nbsp;`
    //   : commentState.content
    //   ? commentState.content
    //   : ''
    if (currentType == 'replaytrail' && commentState.content) {
      commentContent = `<span style="color: #4285F4" contenteditable='false' class="atUser Myself" data-userid="${item.userId}">@${item.username} </span>&nbsp;`
    }
    return (
      <div className="ApprovalcommentEditor commentEditorBox msg-send">
        <div
          ref={msgTxtRef}
          className="msg-txt commentMsgEditor"
          contentEditable={true}
          dangerouslySetInnerHTML={{
            __html: commentContent,
          }}
          placeholder={replay.replayTip ? replay.replayTip : '请在此处评论,@提及他人'}
          onInput={changeSendVal}
          onPaste={(e: any) => {
            // 去除格式只显示文本
            e.preventDefault()
            const text = (e.originalEvent || e).clipboardData.getData('text/plain')
            document.execCommand('insertText', false, text)
          }}
          // onFocus={(e: any) => {
          //   cursorloct(msgTxtRef.current)
          // }}
        ></div>
        {currentType == 'replaytrail' && <div style={{ height: '175px' }}></div>}
        <div className={`handle-btn-group flex between ${handleBtn ? '' : 'forcedHide'}`}>
          <div>
            {(currentType === 'replaytrail' || currentType === 'replayRepoert') && (
              <RenderUplodFile
                visible={uploadVisible}
                leftDown={false}
                canDel={true}
                filelist={addFiles || []}
                teamId={teamId}
                fileId={pageUuid}
                defaultFiles={[]}
                setVsible={state => setUploadVisible(state)}
                loadTime={loadTime}
                fileChange={(list: any, delGuid?: string, isDel?: boolean) => {
                  if (isDel) {
                    if (currentType == 'replaytrail' || currentType === 'replayRepoert') {
                      let currentWidth = jQuery('.approval-flow-list .ApprovalcommentEditor').outerWidth()
                      currentWidth = currentWidth ? currentWidth : 0
                      //判断一行放几个
                      const cnt = Math.floor(currentWidth / 200)
                      //轨迹回复  && list.length % cnt == 0
                      if (list.length >= 0 && list.length % cnt == 0) {
                        let tmp = jQuery('.approval-flow-list .ApprovalcommentEditor').outerHeight()
                        tmp = (tmp ? tmp : 0) - 32
                        // console.log('tmp', tmp)
                        jQuery('.approval-flow-list .ApprovalcommentEditor').css({
                          height: tmp,
                        })
                        let tmp2 = jQuery('.new-comment-box').outerHeight()
                        tmp2 = (tmp2 ? tmp2 : 0) - 32
                        jQuery('.new-comment-box').css({
                          height: tmp2,
                        })
                      }
                    }
                    //审批右侧添加样式修改
                    else if (currentType == 'replayright') {
                      jQuery(
                        '.send-approval-content .right-panel .upload-list-inline .ant-upload-list'
                      ).removeAttr('style')
                    }
                  } else {
                    if (currentType == 'replaytrail' || currentType == 'replayRepoert') {
                      let currentWidth = jQuery('.approval-flow-list .ApprovalcommentEditor').outerWidth()
                      currentWidth = currentWidth ? currentWidth : 0
                      //判断一行放几个
                      const cnt = Math.floor(currentWidth / 200)
                      const line = Math.floor(list.length / cnt)
                      // && list.length % cnt == 1
                      //轨迹回复
                      if (list.length > 1) {
                        let tmp = jQuery('.approval-flow-list .ApprovalcommentEditor').outerHeight()
                        tmp = (tmp ? tmp : 0) + 32 * line
                        // console.log('tmp', tmp)
                        jQuery('.approval-flow-list .ApprovalcommentEditor').css({
                          height: tmp,
                        })
                        let tmp2 = jQuery('.new-comment-box').outerHeight()
                        tmp2 = (tmp2 ? tmp2 : 0) + 32 * line
                        jQuery('.new-comment-box').css({
                          height: tmp2,
                        })
                      }
                    } else if (currentType == 'replayright') {
                      let currentheight: any
                      currentheight = jQuery('.right-panel .approval-handle-btn-group').offset()?.top
                      currentheight = currentheight
                      // console.log('当前相聚高度', currentheight, window.innerHeight - currentheight)
                      if (window.innerHeight - currentheight < 100) {
                        jQuery('.send-approval-content .right-panel .upload-list-inline .ant-upload-list').css({
                          height: currentheight - 500,
                          'overflow-y': 'auto',
                        })
                      }
                    }
                  }
                  setAddFiles(list)
                  getFileId(pageUuid)
                }}
              />
            )}
            {(currentType === 'replaytrail' || currentType === 'replayRepoert') && (
              <Button
                className="msg-handle-btn file_icon"
                onClick={() => {
                  setUploadVisible(true)
                  setLoadTime(new Date().getTime())
                }}
              ></Button>
            )}
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
        {/* 常用联系人 */}
        {
          <div
            // style={{ left: atPosition[0], top: atPosition[1] }}
            // id="at-container"
            className={`select_at_user_list portrait_okrMain ${usersShow ? '' : 'forcedHide'}`}
          >
            <h5>常用联系人</h5>
            <div className="okr_linkman">
              <ul>
                {state.setPortraitlist.map((item: any, index: number) => {
                  return (
                    <li
                      key={index}
                      onClick={() => {
                        const html = `<span style="color: #4285F4" contenteditable='false' class="atUser" data-userid="${item.contactsUser}">@${item.contactsUsername}</span>&nbsp;`
                        let str = msgTxtRef.current.innerHTML
                        if (str.lastIndexOf('@') != -1) {
                          //替换指定位置@
                          // insertHtml()
                          str = $tools.replaceChat(str, $tools.findstr(str, '@', cntindex), html, 1)
                        }
                        cntindex = 0
                        msgTxtRef.current.innerHTML = str
                        inputContent = msgTxtRef.current.innerText
                        setStatus(msgTxtRef.current.innerText)
                        setUsersShow(false)
                        setAtUserIds([...atUserIds, item.contactsUser])
                        msgTxtRef.current.focus()
                      }}
                    >
                      <div className="left_box">
                        <Tooltip title={item.contactsUsername}>
                          <Avatar className="oa-avatar" src={item.profile} size={34}>
                            {item.contactsUsername ? item.contactsUsername.substr(-2, 2) : '?'}
                          </Avatar>
                        </Tooltip>
                      </div>
                      <div className="right_box">
                        <span className="name">{item.contactsUsername}</span>
                        <span>{item.contactsRoleName}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
            <h5>更多联系人</h5>
            <div
              className="more_linkman"
              onClick={() => {
                selectUser()
                setUsersShow(false)
              }}
            >
              <div className="left_box">
                <span></span>
              </div>
              <div className="right_box">组织架构</div>
            </div>
          </div>
        }
      </div>
    )
  }
)

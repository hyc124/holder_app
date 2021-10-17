import React, { useEffect, useState, Fragment, useRef, forwardRef } from 'react'
import { Button, Input, message, Avatar } from 'antd'
import { addCommentMsg } from '../../../components/notice-details/actions'
import { inquireCheckApi } from '../taskDetail/getData'

import { RenderPreImgs, PhotosPreview } from '@/src/components/normal-preview/normalPreview'
import { SelectMemberOrg } from '@/src/components/select-member-org/index'
import { Diff } from 'diff'
import { getContentInfo } from '../taskSynergy/commentOut'
import { isCheckHeaderShow } from '../taskDetails/detailRight'
import { RenderUplodFile, RenderFileList } from '../../mettingManage/component/RenderUplodFile'
import * as Maths from '@/src/common/js/math'
import { useImperativeHandle } from 'react'
interface CommentItemProps {
  id: number
  userId: number
  username: string
  profile?: string
  content: string
  createTime: string
  parentId: null
  rootId: null
  type?: number
  childComments: []
  files?: null
  updateState?: 0
  fileReturnModels?: any[]
}
//是否点击了@成员
let isUsersshow = false
let isfileclick = false
let isemoji = false
let checkempty = false //用来判断是否已经点过空白了
let inputContent = ''
let cntindex = 0
let onKeyDown8 = false
// 新增附件缓存
const markFileList: any = []
// 评论回复的父级的数据
// const init = { rootId: null, parentId: '' }
// 缓存评论的父级信息
let commentParentInfo: any = null
const Taskcomment = forwardRef((props: any, ref) => {
  //添加ref,解决console.log报错 forwardRef render functions accept exactly two parameters: props and ref
  const { callback } = props
  const { containerRef, contentRef, checkHeaderDom, headerRef } = props.param.scrollNeedDom
  const { teamid } = props.param.belongData
  const { isInfoShow, setChecklist } = props.param //是否获取焦点显示编辑框
  const [initData, setInitData] = useState<any>([])
  //显示影藏回复框1112
  const [themeshow, setThemeshow] = useState(false)

  //获取@成员
  const [atUserIds, setAtUserIds] = useState<any>([])

  //选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)

  //回复的内容
  const [inputcontent, setContent] = useState('')
  //评论回复所需参顺
  const [paramdata, setParamdata] = useState<any>()
  const { nowUserId, nowUser, nowAccount } = $store.getState()
  // 名字输入框节点
  const [nameRef, setNameRef] = useState<any>(null)

  //点击回复显示默认文本
  const [placeholdertext, setplaceholdertext] = useState('留言评论@人，enter发送')
  // 图片预览框组件
  const photosRef = useRef<any>(null)

  //新版附件需要的参数
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState<string>('')

  //获取输入框焦点
  useEffect(() => {
    setPageUuid(Maths.uuid())
    setNewFileList([])
    const ref: any = nameRef
    // 获取焦点
    if (ref) {
      ref.focus()
    }
  }, [themeshow])
  //获取输入框焦点
  useEffect(() => {
    if (isInfoShow) {
      setThemeshow(true)
    } else {
      setThemeshow(false)
    }
  }, [isInfoShow])
  useEffect(() => {
    setParamdata({
      _typeId: props.param.belongData.typeid,
      _teamid: props.param.belongData.teamid,
      _teamName: props.param.belongData.teamName,
      _taskid: props.param.belongData.taskid,
      _checknames: props.param.belongData.names,
    })
    jQuery('#send_now_msg').html('')
  }, [props.param.belongData.typeid])
  useEffect(() => {
    setInitData(props.param.initDatas || [])
  }, [props.param.initDatas])
  useEffect(() => {
    jQuery('#send_now_msg').html('')
  }, [props.param.belongData.taskid])

  // ***********************暴露给父组件的方法 start**************************//
  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(ref, () => ({
    /**
     * 设置当前评论父级信息
     */
    setCommentParentInfoFn: (item: any) => {
      commentParentInfo = item
    },
  }))
  // ***********************暴露给父组件的方法 end**************************//

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
          console.log('arr1', arr1)
          const arr2 = innerText.split('')
          console.log('arr2', arr2)
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
    if (isAt) {
      // setTypeUsersshow(true)
      // @直接展示组织架构
      setMemberOrgShow(true)
    } else {
      // setTypeUsersshow(false)
      // setUsersShow(false)
    }
  }
  const blankClick = () => {
    $('.ant-modal-wrap')
      .off()
      .on('click', (e: any) => {
        const _con = $('.select_at_user_list') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          // setTypeUsersshow(false)
          $('.ant-modal-wrap').off('click')
        }
      })
  }

  //子评论
  const renderComment = (datas: CommentItemProps[], username: any) => {
    return datas.map((item: CommentItemProps) => {
      return (
        <Fragment key={item.id}>
          <div
            className="chlidItem rows"
            onClick={(e: any) => {
              commentParentInfo = item
              setChecklist ? setChecklist() : setThemeshow(true)
              $(e.target)
                .parents('.comment-content')
                .find('.theme-msg-send')
                .html('')
            }}
          >
            <pre>
              <RenderPreImgs
                content={
                  `<span style="color: #191F25">${item.username}</span>：<span style="color: #70707A; margin-right: 6px">回复</span><span style="color: #191F25">${username}</span>：` +
                  item.content
                }
                photosRef={photosRef}
                htmlParentClass={'chlidItem'}
              />
            </pre>
            <RenderFileList list={item.fileReturnModels || []} large={true} teamId={teamid} />
            <div className="time">
              {/* <span>时间：{item.createTime}</span> */}
              {props.param.type == 'checklist' && <span>{item.createTime}</span>}
              {!props.param.type && <span>时间：{item.createTime}</span>}
            </div>
          </div>
          {item.childComments.length > 0 && renderComment(item.childComments, item.username)}
        </Fragment>
      )
    })
  }
  //发送评论
  const sendComment = (_text: any, msgDom: any) => {
    if (!inputcontent && !_text) {
      message.warn('您未填写评论内容')
      return
    }

    let parentId: any = ''
    let userId: any = ''
    let userAccount: any = ''
    let rootId: any = ''
    if (commentParentInfo) {
      parentId = commentParentInfo.parentId
      userId = commentParentInfo.userId
      userAccount = commentParentInfo.userAccount
      rootId = commentParentInfo.rootId
    }
    const pushContent = `${nowUser}评论了检查项【${paramdata._checknames}】:${inputcontent}`
    const getInfo = getContentInfo(msgDom, markFileList)
    const value: any = {
      userId: nowUserId, //评论人id
      userName: nowUser, //评论人姓名
      userAccount: nowAccount, //评论人账号
      content: _text || inputcontent, //TODO: 评论内容
      typeId: paramdata._typeId, //评论主题id
      type: 13, //报告类型 0任务汇报 1工作报告 2制度 4公告 13任务详情 11备注
      parentId: parentId || '', //TODO: 评论父id
      rootId: rootId ? rootId : parentId ? parentId : undefined, //TODO: 根评论id
      userIds: userId ? [userId] : [], //需要发通知的用户id集合
      userNames: userAccount ? [userAccount] : [], //需要发通知的账号集合
      belongId: paramdata._teamid, //归属id
      belongName: paramdata._teamName, //归属名称
      belongType: 2, //归属类型企业类型2 工作组类型4 部门3
      pushContent: pushContent, //推送内容
      atUserIds: atUserIds, //获取@推荐人
      taskId: paramdata._taskid,
      fileDetailModels: getInfo.files,
    }
    console.log(value)
    if (!!newFileList) {
      value.temporaryId = pageUuid //新版附件需要的uuid
    }
    addCommentMsg(value).then((res: any) => {
      if (res.returnCode === 0) {
        message.success('发送评论成功')
        setChecklist ? setChecklist() : setThemeshow(false)
        inquireCheck()
        commentParentInfo = null
      } else {
        message.error(res.returnMessage)
      }
    })
  }

  //查询检查项评论
  const inquireCheck = () => {
    const url = '/task/check/list'
    const param = {
      taskId: paramdata._taskid,
      userId: nowUserId,
    }
    inquireCheckApi(param, url).then((resData: any) => {
      if (resData.dataList) {
        const resdatas = resData.dataList
        for (let i = 0; i < resdatas.length; i++) {
          if (resdatas[i].id == paramdata._typeId) {
            setInitData(resdatas[i].commentMessageModels || [])
            // callback({ newData: resdatas[i].commentMessageModels || [] })
            break
          }
        }
        isCheckHeaderShow(containerRef, contentRef, checkHeaderDom, headerRef)
      }
      callback()
    })
  }
  //聚焦绑定shi
  //失去焦点
  const onBlurFn = (e: any) => {
    // console.log('失去焦点111', jQuery(e.relatedTarget).parents('.theme_handle_group').length)
    setContent(e.target.innerHTML)
    // setTypeUsersshow(false)
    jQuery('.file_icon')
      .off()
      .click(function() {
        checkempty = false
        // console.log('当前的checkempty1', checkempty, isfileclick)
        isfileclick = true
      })
    jQuery('.face_emoji')
      .off()
      .click(function() {
        checkempty = false
        isemoji = true
        // console.log('当前的checkempty2', checkempty, isemoji)
      })
    if (jQuery(e.relatedTarget).parents('.theme_handle_group').length == 0 && isemoji == true) {
      checkempty = true
      // console.log('点了表情又点空白', checkempty, isfileclick, isemoji)
      // isfileclick = false
    }
    if (jQuery(e.relatedTarget).parents('.theme_handle_group').length == 0 && isfileclick == true) {
      checkempty = true
      // console.log('点了表情又点空白', checkempty, isfileclick, isemoji)
      // isfileclick = false
    }
    if (
      jQuery(e.relatedTarget).parents('.theme_handle_group').length == 1 ||
      isUsersshow == true ||
      isemoji ||
      isfileclick
    ) {
      setThemeshow(true)
      isUsersshow = false
      jQuery('.theme-msg-send').focus()
    } else {
      // setThemeshow(false)
      isemoji = false
      checkempty = false
      isfileclick = false
    }
    if (checkempty) {
      // console.log('checkempty收缩')
      // setThemeshow(false)
      isemoji = false
      checkempty = false
      isfileclick = false
    }
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
  /***
   * 输入框换行代码
   * 光标处插入html代码，参数是String类型的html代码，例子："<p>猪头诺</p>"
   */
  const insertHtml = (html: any) => {
    let sel: any, range: any
    if (window.getSelection) {
      // IE9 或 非IE浏览器
      sel = window.getSelection()
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0)
        range.deleteContents()
        const el = document.createElement('div')
        el.innerHTML = html
        const frag = document.createDocumentFragment()
        let node: any = null
        let lastNode: any = null
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
    }
  }

  //选择成员设置数据
  const selMemberSure = (dataList: any) => {
    const datas = dataList
    // console.log('成员参数', dataList)
    // setUsersShow(false)
    for (let i = 0; i < datas.length; i++) {
      const html = `<span style="color: #4285F4" contenteditable='false' class="atUser" data-userid="${datas[i].userId}">@${datas[i].userName}</span>&nbsp;`
      let str = nameRef.innerHTML
      if (str.lastIndexOf('@') != -1) {
        // const idx = str.lastIndexOf('@')
        //替换指定位置@
        // str = $tools.replaceChat(str, idx, html, 1)
        // console.log('当前cntinde个数', cntindex)
        if (i < datas.length - 1)
          str = $tools.replaceChat(str, $tools.findstr(str, '@', cntindex), html + '@', 1)
        else str = $tools.replaceChat(str, $tools.findstr(str, '@', cntindex), html, 1)
      }
      nameRef.innerHTML = str
      inputContent = nameRef.innerText
      // setStatus(msgTxtRef.current.innerText)
      // setAtUserIds([...atUserIds, datas[i].userId])
      atUserIds.push(datas[i].userId)
      cntindex++
    }
    cntindex = 0
    // console.log('多选成员如下', atUserIds)
    cursorloct(nameRef)
    // nameRef.focus()
  }

  // 取消人员选择
  const selMemberClose = (visible: any) => {
    setMemberOrgShow(visible)
    cursorloct(nameRef)
    // nameRef.focus()
  }

  return (
    <div className="comment-content" style={{ paddingTop: '12px' }}>
      {initData.map((item: CommentItemProps) => {
        const { id, username, profile, content, childComments } = item
        const fileReturnModels: any = item.fileReturnModels || []
        const items: any = {
          id: item.id,
          username: item.username,
          createTime: item.createTime,
          profile: item.profile,
          content: item.content,
          childComments: item.childComments,
          parentId: item.id,
          userId: item.userId,
          rootId: item.id,
        }

        return (
          <div className="infoItemBox" key={id}>
            <div className="listBox rows">
              <div>
                {/* <pre
                  dangerouslySetInnerHTML={{
                    __html: `<span class="username names blue">${username}</span> ：<span class="content" style="width: 400px;">${content}</span>`,
                  }}
                ></pre> */}
                <div
                  className="theme_title flex center-v"
                  style={{ cursor: 'pointer' }}
                  onClick={(e: any) => {
                    commentParentInfo = items
                    setChecklist ? setChecklist() : setThemeshow(true)
                    setplaceholdertext(`回复${username}`)
                    jQuery(e.target)
                      .parents('.comment-content')
                      .find('.theme-msg-send')
                      .html('')
                  }}
                >
                  <Avatar className="oa-avatar" src={profile}>
                    {username.substr(-2, 2)}
                  </Avatar>
                  <div className="header_rig">
                    <div className="name_content">
                      {/* <Tooltip title={`${username}`}>
                        <span className="username">{username.substr(0, 4)}：</span>
                      </Tooltip> */}
                      <RenderPreImgs
                        content={`<pre><span class="content" style="width: 100%;">${username}：${content}</span></pre>`}
                        photosRef={photosRef}
                        parentNode={true}
                        htmlParentClass={'content'}
                      />
                    </div>
                    <div className="time flex between">
                      {props.param.type == 'checklist' && <span>{item.createTime}</span>}
                      {!props.param.type && <span>时间：{item.createTime}</span>}
                    </div>
                  </div>
                </div>
                {/* <FileList list={fileReturnModels || []} /> */}
                <RenderFileList list={fileReturnModels || []} large={true} teamId={teamid} />
              </div>
            </div>
            {childComments.length > 0 && (
              <div className="replyContent" style={{ marginTop: '-2px', marginBottom: '-2px' }}>
                {renderComment(childComments, username)}
              </div>
            )}
          </div>
        )
      })}
      {/* 评论回复 */}
      <div className={`task_theme_answer_box`}>
        <div className={`task_theme_answer ${themeshow ? '' : 'hide'}`}>
          <div className="send_theme_chat_box">
            {/* 文本框 */}
            <div
              className="theme-msg-send"
              id="send_now_msg"
              contentEditable="true"
              ref={(el: any) => setNameRef(el)}
              onInput={(e: any) => {
                console.log('onInput')
                chatEventAt(e)
                if (jQuery(e.target).text().length > 500) {
                  message.warning('最大只能输入500字符')
                  e.target.innerHTML = e.target.innerHTML.substring(0, 500)
                }
              }}
              // onFocus={(e: any) => {
              //   // console.log('聚焦')
              // }}
              onBlur={(e: any) => {
                onBlurFn(e)
              }}
              onPaste={(e: any) => {
                e.preventDefault()
                const text = (e.originalEvent || e).clipboardData.getData('text/plain')
                document.execCommand('insertText', false, text)
              }}
              onKeyDown={(e: any) => {
                if (e.keyCode == 8) {
                  onKeyDown8 = true
                } else {
                  onKeyDown8 = false
                  if (e.keyCode == 13 && !e.ctrlKey) {
                    e.cancelBubble = true
                    e.preventDefault()
                    e.stopPropagation()
                    setContent(e.target.innerHTML)
                    sendComment(e.target.innerHTML, $(e.target))
                    const dom = $(e.target)
                      .parents('.send_theme_chat_box')
                      .find('.theme-msg-send')
                    dom.html('')
                  }
                  if (e.keyCode == 13 && e.ctrlKey) {
                    insertHtml('<br>')
                  }
                }
              }}
              placeholder={placeholdertext}
            ></div>
            <div style={{ width: '100%', height: '70px', overflow: 'overlay' }}>
              <RenderUplodFile
                visible={uploadVisible}
                leftDown={false}
                canDel={true}
                filelist={newFileList}
                teamId={teamid}
                fileId={pageUuid}
                defaultFiles={[]}
                setVsible={state => setUploadVisible(state)}
                loadTime={loadTime}
                className="task_theme_answer_file"
                fileChange={(list: any) => {
                  // if (delGuid !== '') {
                  //   const files = defaultFiles.filter((item: any) => item.fileGUID !== delGuid)
                  //   setDefaultFiles(files)
                  //   const delInfo = [...delFileIds]
                  //   delInfo.push(delGuid)
                  //   setDelFileIds(delInfo)
                  // }
                  // setFileList({ fileItem, imgUrl }) 1
                  nameRef.focus()
                  // setThemeshow(true)
                  isUsersshow = false
                  cursorloct(nameRef)
                  isfileclick = false
                  setNewFileList(list)
                }}
              />
            </div>
            {/* 标枪 附件 回复 */}
            <div className="theme_handle_group msg-send">
              <div className="left_btn handle-btn-group">
                <Button
                  className="msg-handle-btn file_icon"
                  onClick={() => {
                    setUploadVisible(true)
                    setLoadTime(new Date().getTime())
                  }}
                ></Button>
              </div>
              <div>
                <Button
                  style={{ marginRight: '6px' }}
                  onClick={(e: any) => {
                    setChecklist ? setChecklist() : setThemeshow(false)
                    isemoji = false
                    checkempty = false
                    isfileclick = false
                    $(e.target)
                      .parents('.send_theme_chat_box')
                      .find('.theme-msg-send')
                      .html('')
                  }}
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  onClick={(e: any) => {
                    console.log(1111)

                    const dom = $(e.target)
                      .parents('.send_theme_chat_box')
                      .find('.theme-msg-send')
                    sendComment('', dom)
                    dom.html('')
                  }}
                >
                  回复
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* 选人插件 */}
        {memberOrgShow && (
          <SelectMemberOrg
            param={{
              // checkboxType: 'checkbox',
              visible: memberOrgShow,
              teamId: teamid ? teamid : 0,
              allowTeamId: [teamid],
              // ...selMemberOrg,
            }}
            action={{
              setModalShow: selMemberClose,
              // 点击确认
              onSure: selMemberSure,
            }}
          />
        )}
        <Input
          placeholder="回复"
          className={`task_theme_answer_input ${themeshow ? 'hide' : ''}`}
          style={{ marginTop: '15px' }}
          onFocus={() => {
            setChecklist ? setChecklist(initData, true) : setThemeshow(true)
            //查询可以被@的人
            // queryTaskTypeUsers()
            setAtUserIds([])
            setplaceholdertext('留言评论@人，enter发送')
          }}
        />
      </div>
      {/* 预览图片 */}
      <PhotosPreview ref={photosRef} />
    </div>
  )
})
export default Taskcomment

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Avatar, Modal, Spin, Input } from 'antd'
import './taskSynergy.less'
import { queryThemeList, delMarkCommentApi, editMarkCommentApi } from '../taskComApi'
import { refreshFiles } from '../fileDetail/fileDetail'
import { CommentEditor } from './commentEditor'
import FileList from '@/src/components/file-list/file-list'
import { findRepeat, differArr } from '@/src/common/js/common'
import NoneData from '@/src/components/none-data/none-data'
import { getFileIcon, imgesGatter } from '@/src/common/js/math'
import { ThemeChilds } from './ThemeChilds'
import { CommentOut } from './commentOut'
import { isCheckHeaderShow, setHeaderShowFn } from '../taskDetails/detailRight'
import { RenderFileList } from '../../mettingManage/component/RenderUplodFile'
import * as Maths from '@/src/common/js/math'
//外部调用刷新
export let refreshTheme: any = null
// 只刷新备注列表
export let refreshFindThemeList: any = null
/**
 * 任务协同
 */
let editMarkMsgRef: any = null
let editMarkFileList: any = [],
  markFileList: any = []
// 编辑备注前附件列表
let editFilesOld: any = []
// 缓存当前筛选组件状态
let synergyHeaderDom: any

//附件需要的uuid
let pageUuid: any = ''
let delfileids: any = []
export const TaskSynergy = ({ param }: { param: any }) => {
  //flag == 3 判断为归档状态
  const {
    ascriptionId,
    ascriptionName,
    cutkey,
    flag,
    onFileTime,
    updateTabsThemeNumber,
    workPlanType,
    type,
  } = param
  const taskId = param.id
  const cycleModel = param.cycleModel || {}
  const cycleMNum = cycleModel.cycleNum || 0
  const addRemark = param.addRemark
  const { nowUserId } = $store.getState()
  // 编辑备注
  const editMarkRef = useRef<any>(null)
  // 主题列表
  const [themeList, setThemeList] = useState<any>([])
  const [isLoading, setIsLoading] = useState(false) //记录加载状态
  // 拖动到不同类型弹框
  const [delMarkModal, setDelMarkModal] = useState<any>({
    visible: false,
    content: '',
  })

  // 拖动到不同类型弹框
  const [editMarkModal, setEditMarkModal] = useState<any>({
    visible: false,
    content: '',
    files: [],
  })

  // 是否回复状态
  const [replay, setReplay] = useState<any>({ replayTip: '' })
  const containerRef: any = useRef(null)
  const contentRef: any = useRef(null)
  const headerRef: any = useRef(null)

  useLayoutEffect(() => {
    synergyHeaderDom = $('.task-synergy-header')
    setHeaderShowFn(
      '.taskSynergyContainer',
      '.synergyContent',
      synergyHeaderDom,
      containerRef,
      contentRef,
      headerRef
    )
  }, [])
  useEffect(() => {
    findThemeList()
  }, [taskId])

  useEffect(() => {
    if (cutkey == '2') {
      isCheckHeaderShow(containerRef, contentRef, synergyHeaderDom, headerRef)
    }
  }, [cutkey, themeList])

  const [InputHide, setInputHide] = useState<any>({
    opinionId: '',
    visibleId: '',
    visible: false,
  })
  /**
   * 刷新方法
   */
  refreshTheme = () => {
    findThemeList()
    // 刷新附件预览
    refreshFiles && refreshFiles()
    // 刷新详情tab统计
    updateTabsThemeNumber && updateTabsThemeNumber()
  }

  const changeShoweditor = () => {
    setInputHide({
      opinionId: '',
      visible: false,
      visibleId: '',
    })
  }
  /**
   * 查询备注列表
   */
  const findThemeList = () => {
    setIsLoading(true)
    queryThemeList(taskId)
      .then((res: any) => {
        setThemeList(res.data.dataList || [])
        // $('.processCont  #rc-tabs-5-tab-2').text(`${$intl.get('taskRemark')}(${res.data.dataList.length || 0})`)
        // 刷新tabs 备注数量
        // updateTabsThemeNumber && updateTabsThemeNumber(res.data.dataList.length || 0)
        setIsLoading(false)
        // isCheckHeaderShow(containerRef, contentRef, synergyHeaderDom, headerRef)
      })
      .catch((err: any) => {
        console.log('err==', err)
        setIsLoading(false)
      })
  }
  refreshFindThemeList = findThemeList

  /**
   * 检查内容替换表情字符串为表情图标，普通文本不变
   * type:0 返回react节点 1：html代码
   */
  const getContent = (content: string, type: number): any => {
    let html = ''
    const reg = /\[bq_(\w+)\]/gi,
      ret = []
    let lastIndex = 0,
      i = 0,
      match: any
    while ((match = reg.exec(content))) {
      // 文本
      if (match.index !== lastIndex) {
        const txt = content.slice(lastIndex, match.index)
        if (type == 1) {
          html += txt
        } else {
          ret.push(txt)
        }
      }
      if (type == 1) {
        // $tools.asAssetsPath(`/emoji/${match[1]}.png`)
        html += `<img class="emoji_icon" src="${$tools.asAssetsPath(`/emoji/${match[1]}.png`)}" />`
      } else {
        //   表情包替换
        ret.push(
          <img key={i++} className="emoji_icon" src={`${$tools.asAssetsPath(`/emoji/${match[1]}.png`)}`} />
        )
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex !== content.length) {
      const txt = content.slice(lastIndex)
      if (type == 1) {
        html += txt
      } else {
        ret.push(txt)
      }
    }
    return type == 1 ? html : ret
  }

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
      atUsers: atUsers,
      files: files,
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
   * 获取附件id
   * @param props
   */
  const getFileIds = (files: any) => {
    const fileIds: any = []
    files.map((item: any) => {
      item.id && fileIds.push(item.id)
    })
    return fileIds
  }

  /**
   * 删除评论回复
   * opinionId备注id 回复评论id
   * type 0 备注 1回复
   */
  const delMarkComment = (opinionId: string, type: number) => {
    let content = '确定希望永久删除这条备注？'
    let title = '删除备注'
    if (type == 1) {
      title = '删除评论'
      content = '确定删除这条评论？'
    }
    setDelMarkModal({
      visible: true,
      title: title,
      content: content,
      onSure: () => {
        delMarkCommentApi({
          opinionId,
          type: type,
        }).then((res: any) => {
          if (res) {
            refreshTheme()
          }
        })
      },
    })
  }

  /**
   * 回复
   */
  const replayComment = ({
    info,
    opinionId,
    parentUserId,
  }: {
    info: any
    opinionId: string
    parentUserId?: string
  }) => {
    markFileList = []
    setReplay({
      replayTip: `回复  ${info.userName || info.username}`,
      parentId: info.id,
      rootId: info.id,
      toUserName: info.userName || info.username,
      toUserId: info.userId || info.userid,
      parentUserId: parentUserId,
      markCommentId: opinionId,
    })
  }
  /**
   * 编辑备注
   */
  const editMarkComment = (info: any) => {
    editMarkFileList = []
    editFilesOld = []
    const content = info.opinion
      // .replace(
      //   /\[bq_(\w+)\]/gi,
      //   '<img class="emoji_icon" src="../../../../assets/emoji/$1.png"  data-name="$1">'
      // )
      .replace(/\[bq_(\w+)\]/gi, function(_: string, regStr: any) {
        const imgUrl = $tools.asAssetsPath(`/emoji/${regStr}`)
        return `<img class="emoji_icon" src="${imgUrl}.png"  data-name="${regStr}">`
      })
    const setState = {
      visible: true,
      content: content,
      onSure: () => {
        // const sendVal = editMarkMsg.current.innerHTML
        // const newOpinion = sendVal
        //   .replace()
        //   .replace(/<img class="emoji_icon"[^>]*\/([^d\.]+)\.[^\"\']+[\"\']?[^>]*>/gi, '[bq_$1]')
        //   .replace(/<img class="fileAdd"[^>]*>/g, '')
        // 获取最新所有附件 editMarkFileList是编辑框所有附件
        const getInfo = getContentInfo(editMarkMsgRef.current, editMarkFileList)
        // 新增的附件
        const addFiles = differArr({
          arr1: [...getInfo.files],
          arr2: editFilesOld,
          json: true,
          keyName: 'fileKey',
        })
        // 删除的附件
        const delFiles = differArr({
          arr1: editFilesOld,
          arr2: getInfo.files,
          json: true,
          keyName: 'fileKey',
        })
        const delFileIds: any = getFileIds(delFiles)
        replaceImg(editMarkMsgRef.current)
        // 去除首尾空格
        const newOpinion = editMarkMsgRef.current.innerHTML.replace(/(^\s*)|(\s*$)/g, '')
        editMarkCommentApi({
          opinionId: info.opinionId,
          opinion: newOpinion,
          deleteFileId: delFileIds,
          files: addFiles,
          atUserIds: getInfo.atUsers,
          uuid: pageUuid,
          delfileids: delfileids,
        }).then((res: any) => {
          if (res) {
            refreshTheme()
          }
        })
      },
    }

    setEditMarkModal(setState)
    pageUuid = Maths.uuid()
    delfileids = []
    const fileList: any[] = info.fileReturnModels || []
    // let filesHtml: any = ''
    const newContent = content
    // fileList.forEach(item => {
    //   const fileSuffix = item.displayName
    //     .toLowerCase()
    //     .split('.')
    //     .splice(-1)[0]
    //   editMarkFileList.push(item)
    //   editFilesOld.push(item)
    //   let imgSrc: any = ''
    //   if (imgesGatter.includes(fileSuffix)) {
    //     imgSrc = item.officeUrl
    //   } else {
    //     imgSrc = getFileIcon(fileSuffix)
    //   }
    //   filesHtml = `<img class="fileAdd" src="${imgSrc}" data-filekey="${item.fileKey}">`
    //   newContent += filesHtml
    //   setEditMarkModal({ ...setState, content: newContent })
    // });
    setEditMarkModal({ ...setState, content: newContent, files: fileList })

    // async function getFiles() {
    //   await fileList.map((item: any) => {
    //     async function getUrl() {
    //       const fileSuffix = item.fileName
    //         .toLowerCase()
    //         .split('.')
    //         .splice(-1)[0]
    //       editMarkFileList.push(item)
    //       editFilesOld.push(item)
    //       let imgSrc: any = ''
    //       if (imgesGatter.includes(fileSuffix)) {
    //         const url: any = await $tools.getUrlByKey(item.fileKey, item.dir)
    //         imgSrc = url
    //       } else {
    //         imgSrc = getFileIcon(fileSuffix)
    //       }
    //       filesHtml = `<img class="fileAdd" src="${imgSrc}" data-filekey="${item.fileKey}">`
    //       newContent += filesHtml
    //       setEditMarkModal({ ...setState, content: newContent })
    //     }
    //     getUrl()
    //   })
    //   // setEditMarkModal({ ...setState, content: content + filesHtml })
    // }
    // getFiles()
  }
  /**
   * 输入框删除文本
   * sourceType 0备注评论框 1编辑备注
   */
  const delCommentTxt = (sourceType: number) => {
    let editorNode: any = null,
      sortFiles: any = []
    const files: any = []
    // 编辑备注
    if (sourceType == 1) {
      editorNode = editMarkMsgRef.current
      sortFiles = editMarkFileList
    } else {
      sortFiles = markFileList
    }
    // 附件
    $(editorNode)
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
    // 编辑备注
    if (sourceType == 1) {
      editMarkFileList = files
    } else {
      markFileList = files
    }
  }

  return (
    <Spin spinning={isLoading} tip="加载中，请耐心等待">
      <section className="taskSynergyContainer flex column h100" ref={containerRef}>
        {/* 缓存评论内容 */}
        <div id="commentTmp" className="forcedHide"></div>
        <div
          ref={headerRef}
          className={`my-dynamic-header task-synergy-header flex between margin_20
`}
        >
          <div className="left">
            <span>
              共{themeList.length}篇{workPlanType == 2 || workPlanType == 3 ? '' : type == 1 ? '项目' : '任务'}
              备注
            </span>
          </div>
          {param.flag != 3 && (
            <div className="right">
              <span
                className={`opt_btn check_btn`}
                onClick={() => {
                  addRemark()
                }}
              >
                <span className="img_icon add_cross_icon"></span>
                <span className="opt_txt">添加备注</span>
              </span>
            </div>
          )}
        </div>
        <div className="synergyContent flex column pad_hor pad_top_47" ref={contentRef}>
          {/* <div className="theme_header">
            <span className="theme_tit">备注动态</span>
          </div> */}

          {/* 主题消息列表 */}
          <ul className="themeList">
            {themeList?.map((item: any, i: number) => {
              return (
                <li key={i} className="themeItem">
                  {/* 主评论消息 */}
                  <div className="theme_main_box flex">
                    {/* 右侧内容 */}
                    <div className="themeRight flex-1">
                      <div
                        className={`theme_msg_show ${
                          item.commentMessages?.length != null && item.commentMessages?.length != 0
                            ? 'border-none'
                            : ''
                        }`}
                      >
                        {/* 用户 */}
                        <Avatar className="oa-avatar" src={item.profile || ''}>
                          {item.userName && item.userName.substr(-2, 2)}
                        </Avatar>
                        <div className="user_text">
                          <div>
                            <span className="user_name">{item.userName}</span>
                            <span className="user_role">{item.userRole ? `(${item.userRole})` : ''}</span>
                          </div>
                          <div className="theme_msg_time">{item.createTime}</div>
                        </div>

                        {/* 消息内容 */}
                        <div className="theme_msg_cont">
                          <div
                            className="comContent"
                            dangerouslySetInnerHTML={{ __html: getContent(item.opinion || '', 1) }}
                          ></div>
                          <div className="taskFilesList overflow_hidden">
                            {/* <FileList list={item.files || []} /> */}
                            <RenderFileList
                              list={item.fileReturnModels || []}
                              large={true}
                              teamId={ascriptionId}
                            />
                          </div>
                        </div>
                        {/* 消息操作按钮 */}
                        <div className="flex between margBtm10">
                          <div className="theme_handle">
                            <span
                              className="theme_handle_btn reply_btn padL0"
                              onClick={() => {
                                setInputHide({
                                  visible: true,
                                  visibleId: item.opinionId,
                                  optionId: item.opinionId,
                                })
                                replayComment({
                                  info: item,
                                  opinionId: item.opinionId,
                                })
                              }}
                            >
                              <span className="theme_handle_btn_tip huifu"></span>
                              回复
                            </span>
                            <span
                              className={`theme_handle_btn ${
                                item.updateState &&
                                item.userId == nowUserId &&
                                (flag != 3 || (flag == 3 && new Date(onFileTime) < new Date(item.createTime)))
                                  ? ''
                                  : 'forcedHide'
                              }`}
                              onClick={() => {
                                delMarkComment(item.opinionId, 0)
                              }}
                            >
                              <span className="theme_handle_btn_tip shangchu"></span>
                              删除
                            </span>
                            <span
                              className={`theme_handle_btn ${
                                item.updateState &&
                                item.userId == nowUserId &&
                                (flag != 3 || (flag == 3 && new Date(onFileTime) < new Date(item.createTime)))
                                  ? ''
                                  : 'forcedHide'
                              }`}
                              onClick={() => {
                                editMarkComment(item)
                              }}
                            >
                              <span className="theme_handle_btn_tip bianji"></span>
                              编辑
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* 子评论消息列表 */}
                      {item.commentMessages && item.commentMessages.length != 0 ? (
                        <ThemeChilds
                          dataList={item.commentMessages || []}
                          parentUserName={item.userName}
                          parentUserId={item.userId}
                          opinionId={item.opinionId}
                          type={0}
                          itemInfo={item}
                          // conform_props={conform_props}
                          refreshTheme={refreshTheme}
                          taskId={taskId}
                          cycleMNum={cycleMNum}
                          ascriptionId={ascriptionId}
                          ascriptionName={ascriptionName}
                          findThemeList={findThemeList}
                          flag={flag} //归档判断
                          onFileTime={onFileTime} //归档时间
                          replayInfo={replayComment} //回复评论
                          setInputInfo={setInputHide}
                        />
                      ) : (
                        ''
                      )}

                      {/* 评论引导框 */}
                      {!InputHide.visible && (
                        <Input
                          type="text"
                          placeholder="写下你的评论..."
                          readOnly={true}
                          onClick={() => {
                            setInputHide({
                              opinionId: item.opinionId,
                              visible: true,
                              visibleId: item.opinionId,
                            })
                            replayComment({
                              info: item,
                              opinionId: item.opinionId,
                            })
                          }}
                          style={{ margin: '12px 0' }}
                        />
                      )}
                      {/* 汇报 评论框 */}
                      {InputHide.visibleId == item.opinionId ? (
                        <CommentOut
                          param={{
                            taskId: taskId,
                            cycleMNum: cycleMNum,
                            ascriptionId: ascriptionId,
                            ascriptionName: ascriptionName,
                            showeditor: InputHide.visible,
                            showid: InputHide.opinionId,
                            replay: replay,
                            findThemeList,
                            refreshTheme,
                            changeShoweditor,
                          }}
                        />
                      ) : (
                        ''
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
            {themeList.length == 0 ? (
              <NoneData
                imgSrc={$tools.asAssetsPath('/images/noData/OKR-remark.png')}
                showTxt="你可以在此备注你的任务或@他人进行交流~"
                imgStyle={{ width: 85, height: 69 }}
                containerStyle={{ height: 300 }}
              />
            ) : (
              ''
            )}
          </ul>
        </div>

        {/* 拖动不同类型任务的二次提醒弹框 */}
        <Modal
          className="baseModal "
          visible={delMarkModal.visible}
          title={delMarkModal.title}
          onOk={() => {
            setDelMarkModal({ visible: false })
            if (delMarkModal.onSure) {
              delMarkModal.onSure()
            }
          }}
          onCancel={() => {
            setDelMarkModal({ visible: false })
          }}
          width={395}
          centered={true}
        >
          <p className="msg_tit">{delMarkModal.content}</p>
        </Modal>
        {/* 编辑备注弹框 */}
        <Modal
          className="baseModal remarkModel" //remarkModel 改变编辑备注弹窗的样式
          visible={editMarkModal.visible}
          title="备注"
          onOk={() => {
            setEditMarkModal({ visible: false })
            if (editMarkModal.onSure) {
              editMarkModal.onSure()
            }
          }}
          onCancel={() => {
            setEditMarkModal({ visible: false })
          }}
          width={400}
          centered={true}
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
              replay,
              content: editMarkModal.content,
              handleBtn: {
                emoji: true,
                file: true,
                sendMsg: false,
              },
              teamId: ascriptionId,
              pageUuid: pageUuid,
              files: editMarkModal.files || [],
              // changeAtUserIds: setAtUserIds,
              setFileList: ({ fileItem, imgUrl }: any) => {
                // setEditMarkFileList([...editMarkFileList, fileItem])
                editMarkFileList = [...editMarkFileList, fileItem]
                editMarkMsgRef.current.innerHTML += `<img class="fileAdd" src="${imgUrl}" data-filekey="${fileItem.fileKey}">`
              },
              setFileInfo: (delFileIds: any) => {
                delfileids = delFileIds
              },
              delCommentTxt,
            }}
          />
        </Modal>
      </section>
    </Spin>
  )
}

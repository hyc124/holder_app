import React, { useState, useReducer, Fragment, useEffect } from 'react'
import { Input, Button, Checkbox, Tooltip, Row, Col, message, Select } from 'antd'
import SelectMember from '@/src/components/select-member/index'
import Editor from '@/src/components/editor/index'
import { RenderUplodFile } from '../mettingManage/component/RenderUplodFile'
import * as Maths from '@/src/common/js/math'
import NoticePreviewModal from '../announce/noticePreviewModal'
import { getCompanylist, getGrouplist, getNoticeUrl, publishNotice } from '../announce/actions'
import { ipcRenderer } from 'electron'
import { useSelector } from 'react-redux'
import WrapContent from './officeWrap'
const { Option } = Select
const { TextArea } = Input
interface NoticeTypeListProps {
  id: number
  name: string
  operate: number
}
interface CompanyListProps {
  name: string
  id: number
}
export interface DetailsItemProps {
  id: number
  name: string
  content: string
  userId: number
  username: string
  userProfile: string
  type: number
  isDiscuss: number
  apply: number
  isReceipt: number
  groupId: number
  groupName: string
  read: number
  unread: number
  time: string
  template: number
  relationModels: RelationModelItemProps[]
  fileModels: FileModelsItemProps[]
  fileReturnModels: Array<any>[]
  isRead: number
  isManager: number
  belongId: number
  belongType: number
  belongName: string
  isDownload: 0
}

export interface RelationModelItemProps {
  id: number
  type: number
  typeId: number
  typeName: string
  includeChild: number
  roleName: string
  key: number
  name: string
  deptName: string
  // rid: number
}
export interface FileModelsItemProps {
  id: number
  fileName: string
  fileKey: string
  fileSize: number
  dir: string
  fromType: null
  fromName: null
  uploadUser: string
  uploadDate: string
  custom: null
  collectType: number
  profile: string
  url: string
  uid: number | string
  name: string
  size: number
  src: string
}

const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'IS_RECEIPT':
      return { ...state, isReceipt: action.data }
    case 'IS_DOWNLOAD':
      return { ...state, isDownload: action.data }
    case 'NOTICE_TITLE':
      return { ...state, name: action.data }
    case 'APPLY_TYPE':
      return { ...state, apply: action.data }
    case 'NOTICE_TYPE_ID':
      return { ...state, groupId: action.data }
    case 'ASCRIPTION_Id':
      return { ...state, ascriptionId: action.data }
    case 'GROUPLIST':
      return { ...state, groupList: action.data }
    case 'COMPANY_LISY':
      return { ...state, companyList: action.data }
    case 'NOTICE_OFFICE':
      return { ...state, officeInfo: action.data }
    case 'INIT_STATE':
      return { ...state, ...action.data }
    default:
      return state
  }
}

const AddModal = () => {
  const { nowUserId, nowUser } = $store.getState()
  const addModalMsg = useSelector((store: StoreStates) => store.addModalMsg)

  const [modalParam, setModalParam] = useState<any>({
    companyId: 0, //企业id,
    groupId: undefined, //分组id
    enterpriseList: undefined,
    editNoticeData: '',
  })

  //新版附件需要的参数
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')
  const [defaultFiles, setDefaultFiles] = useState<any>([])
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])

  // 适用范围显隐状态
  const [memberModalVisible, setMemberModalVisible] = useState(false)
  // 适用范围选中的成员
  const [checkedMember, setCheckedMember] = useState<Array<RelationModelItemProps>>([])
  // 公告内容
  const [editorContent, setEitorContent] = useState<string | HTMLElement>('')
  // 公告预览
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  //按钮loading
  const [btnLoad, setBtnLoad] = useState({
    opinion: false, //意见征集loading
    manuscript: false, //草稿loading
    submit: false, //发布按钮loading
  })
  const initialState = {
    companyList: [],
    ascriptionId: '',
    groupId: '',
    apply: 0, //适用范围
    isDownload: 0,
    isReceipt: 0,
    name: '',
    groupList: [],
    officeInfo: {
      noticeFileUrl: '', //office在线编辑url
      noticeUuid: '', //对应的UUID
    },
  }
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => {
    setPageUuid(Maths.uuid())
    //窗口第二次被打开时清除缓存
    ipcRenderer.on('window-show', () => {
      console.log('第二次进')
      setNewFileList([])
      setDefaultFiles([])
      setCheckedMember([])
      dispatch({
        type: ' INIT_STATE',
        data: initialState,
      })
    })
  }, [])

  useEffect(() => {
    const { companyId, groupId, enterpriseList, editNoticeData } = addModalMsg
    // console.log('editNoticeData----------', editNoticeData)
    setModalParam({
      companyId: companyId, //企业id,
      groupId: groupId, //分组id
      enterpriseList: enterpriseList,
      editNoticeData: editNoticeData,
    })
    dispatch({
      type: 'APPLY_TYPE',
      data: editNoticeData ? editNoticeData.type : 0,
    })
    dispatch({
      type: 'IS_DOWNLOAD',
      data: editNoticeData ? editNoticeData.isDownload : 0,
    })
    dispatch({
      type: 'IS_RECEIPT',
      data: editNoticeData ? editNoticeData.isReceipt : 0,
    })
    dispatch({
      type: 'NOTICE_TITLE',
      data: editNoticeData ? editNoticeData.name : '',
    })

    if (editNoticeData) {
      const { relationModels, content, fileReturnModels, belongId } = editNoticeData
      relationModels &&
        relationModels.map((item: RelationModelItemProps) => {
          if (!item.key) {
            item.key = item.id
            if (item.type === 6) {
              item.roleName = item.typeName
            } else {
              item.name = item.typeName
            }
          }
        })
      setCheckedMember(relationModels || [])
      setEitorContent(content)
      setDefaultFiles(fileReturnModels)
      setModalParam({
        companyId: belongId, //企业id,
        groupId: groupId, //分组id
        enterpriseList: enterpriseList,
        editNoticeData: editNoticeData,
      })
    }

    if (editNoticeData) {
      // 公告编辑
      getCompanylist({ userId: nowUserId }).then((res: any) => {
        // 企业列表
        dispatch({ type: 'COMPANY_LISY', data: res.dataList })
        // 公司id
        dispatch({ type: 'ASCRIPTION_Id', data: editNoticeData.belongId })
      })
      // 筛选出operate为1的数据
      const currentCompany =
        enterpriseList &&
        enterpriseList.filter((item: NoticeTypeListProps) => {
          return editNoticeData.belongId == item.id
        })
      const groupList =
        currentCompany &&
        currentCompany[0]['groupList'].filter((item: NoticeTypeListProps) => {
          return item.operate === 1
        })
      // 分组列表
      dispatch({ type: 'GROUPLIST', data: groupList })
      // 分组id
      dispatch({
        type: 'NOTICE_TYPE_ID',
        data: editNoticeData.groupId,
      })
      dispatch({
        type: 'NOTICE_OFFICE',
        data: {
          noticeFileUrl: editNoticeData.noticeUrl, //office在线编辑url
          noticeUuid: '', //对应的UUID
        },
      })
    } else if (companyId) {
      //选中某一个企业
      // 筛选出operate为1的数据
      const currentCompany =
        enterpriseList &&
        enterpriseList.filter((item: NoticeTypeListProps) => {
          return companyId == item.id
        })
      const groupList =
        currentCompany?.length &&
        currentCompany[0]['groupList'].filter((item: NoticeTypeListProps) => {
          return item.operate === 1
        })
      // 公司列表
      dispatch({ type: 'COMPANY_LISY', data: currentCompany })
      // 公司id
      dispatch({ type: 'ASCRIPTION_Id', data: companyId })
      // 分组列表
      dispatch({ type: 'GROUPLIST', data: groupList })
      // 分组id
      dispatch({
        type: 'NOTICE_TYPE_ID',
        data: groupId ? groupId : groupList.length > 0 && groupList[0].id,
      })
    } else {
      // 选中所有公告
      getCompanylist({ userId: nowUserId }).then((res: any) => {
        const data = res.dataList
        // 企业列表
        dispatch({ type: 'COMPANY_LISY', data })
        // 企业id
        dispatch({ type: 'ASCRIPTION_Id', data: data[0].id })
        //请求office在线预览Url(编辑的时候不需要查询)
        if (!modalParam.editNoticeData) {
          getNoticeUrl({
            companyId: data[0].id,
            userId: nowUserId,
          })
            .then((data: any) => {
              if (data.returnCode === 0) {
                dispatch({
                  type: 'NOTICE_OFFICE',
                  data: data.data,
                })
              }
            })
            .catch((err: any) => {
              message.error(err.returnMessage)
            })
        }
      })
    }
  }, [addModalMsg])
  // 点击显示适用范围弹窗
  function checkMemberVisible(isVisible: boolean) {
    setMemberModalVisible(isVisible)
  }

  // 富文本框数据改变的回调
  function editorChange(html: string) {
    setEitorContent(html)
  }

  // 适用范围成员删除
  function delApplyMember(record: RelationModelItemProps) {
    setCheckedMember(origin => {
      return origin.filter(item => {
        return item.key !== record.key
      })
    })
  }

  // 表单提交
  function formSubmit(submitType: number) {
    if (!state.name) {
      message.error('请输入公告名称')
      return
    } else if (checkedMember.length === 0) {
      message.error('请选择适用范围')
      return
    }

    if (!state.officeInfo.noticeFileUrl) {
      if (!editorContent) {
        message.error('请填写公告内容')
        return
      }
    }

    const relationModels: object[] = []
    const fileModels: object[] = []

    if (submitType === 0) {
      setBtnLoad({
        opinion: false,
        manuscript: true,
        submit: false,
      })
    } else if (submitType === 1) {
      setBtnLoad({
        opinion: true,
        manuscript: false,
        submit: false,
      })
    } else {
      setBtnLoad({
        opinion: false,
        manuscript: false,
        submit: true,
      })
    }
    checkedMember.map((item: RelationModelItemProps) => {
      const type = item.type
      const obj = {
        // typeId: editNoticeData.id ? item.typeId : type === 0 ? item.rid : item.id,
        typeId: item.typeId ? item.typeId : item.id,
        type: type === 0 ? '4' : type === 31 ? '5' : type, // 2企业 3部门 4成员 5岗位 6角色
        typeName: type === 31 ? `${item.deptName}-${item.name}` : item.name ? item.name : item.roleName,
        includeChild: item.includeChild || '1', //是否包含子部门
      }
      relationModels.push(obj)
    })
    const params = {
      name: state.name,
      userId: nowUserId,
      username: nowUser,
      isManager: 0, //isManager === 'company' ? 1 : 0
      id: modalParam.editNoticeData ? modalParam.editNoticeData.id : '', // 编辑id
      type: submitType, //发布类型  0草稿、1意见征集中、2审批中、3已发布
      groupId: state.groupId,
      content: editorContent,
      fileModels, //文件列表
      apply: state.apply, //适用范围0或1
      relationModels, //适用范围
      isReceipt: state.isReceipt ? '1' : '0',
      isDownload: state.isDownload ? '1' : '0',
      temporaryId: pageUuid, //新版附件需要的uuid
      fileGuidList: delFileIds,
      noticeUuid: state.officeInfo.noticeUuid,
    }
    publishNotice(params)
      .then(() => {
        ipcRenderer.send('refresh_publish_success', [modalParam.editNoticeData])
        ipcRenderer.send('close_addModal_window')
      })
      .finally(() => {
        setBtnLoad({
          opinion: false,
          manuscript: false,
          submit: false,
        })
        setNewFileList([])
        setDefaultFiles([])
      })
  }

  // 切换选择公告
  const changeCompany = (data: number) => {
    setCheckedMember([])
    dispatch({ type: 'ASCRIPTION_Id', data })
  }

  // 关闭预览模态框
  const closePreviewModal = () => {
    setPreviewModalVisible(false)
  }

  useEffect(() => {
    //针对所有公告-根据企业列表查询分组列表
    if (!modalParam.companyId && state.ascriptionId) {
      getGrouplist({ userId: nowUserId, teamId: state.ascriptionId }).then((res: any) => {
        // 分组列表
        dispatch({ type: 'GROUPLIST', data: res.dataList })
        // 分组id
        if (modalParam.editNoticeData) {
          dispatch({ type: 'NOTICE_TYPE_ID', data: modalParam.editNoticeData.groupId })
        } else {
          dispatch({ type: 'NOTICE_TYPE_ID', data: res.dataList[0]?.id })
        }
      })
    }
  }, [state.ascriptionId])

  const fileModal = Array.isArray(defaultFiles) ? defaultFiles : []

  return (
    <div className="add_member_modal">
      <div className="add_member_left">
        <Fragment>
          <div className="context" style={{ height: '100%' }}>
            {state.officeInfo.noticeFileUrl && <WrapContent dataurl={state.officeInfo.noticeFileUrl} />}
            {!state.officeInfo.noticeFileUrl && (
              <Editor
                editorContent={editorContent}
                editorChange={editorChange}
                previewArea=".detailDesEditor"
                minHeight={240}
                height={240}
                className="detailDesEditor"
                placeholder="请输入公告内容"
              />
            )}
          </div>
        </Fragment>
      </div>
      <div className="add_member_right" style={{ width: 360 }}>
        <Fragment>
          <div className="addMemberModal" style={{ width: '100%' }}>
            <Row className="title">
              <Col>
                <span className="formIcon org"></span>
                <Select
                  style={{ width: '100%', height: 36 }}
                  value={state.ascriptionId && parseInt(state.ascriptionId)}
                  disabled={modalParam.companyId ? true : false}
                  onChange={value => changeCompany(value)}
                >
                  {state.companyList.map((item: CompanyListProps) => {
                    return (
                      <Option key={item.id} title={item.name} value={item.id}>
                        {item.name}
                      </Option>
                    )
                  })}
                </Select>
              </Col>
            </Row>
            <Row className="title">
              <Col>
                <span className="formIcon type"></span>
                <Select
                  style={{ width: '100%', height: 36 }}
                  value={state.groupId}
                  onChange={value => {
                    dispatch({
                      type: 'NOTICE_TYPE_ID',
                      data: value,
                    })
                  }}
                >
                  {state.groupList.map((item: NoticeTypeListProps) => {
                    return (
                      <Option key={item.id} value={item.id}>
                        {item.name}
                      </Option>
                    )
                  })}
                </Select>
              </Col>
            </Row>
            <Fragment>
              <div className="title">
                <span className="formIcon name" style={{ marginRight: 4 }}></span>
                <span className="require">*&nbsp;</span>公告名称
              </div>
              <div className="context" style={{ marginLeft: 10 }}>
                <TextArea
                  className="modal_name_area"
                  value={state.name}
                  maxLength={100}
                  rows={4}
                  placeholder="请输入公告名称（100字以内）"
                  onChange={(e: any) => {
                    dispatch({ type: 'NOTICE_TITLE', data: e['target']['value'] })
                  }}
                />
              </div>
            </Fragment>
            <Fragment>
              <div className="title fileTitle">
                <span style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                  <span className="formIcon file" style={{ marginRight: 11 }}></span>
                  <span
                    style={{ cursor: 'pointer', padding: '5px' }}
                    onClick={() => {
                      setUploadVisible(true)
                      setLoadTime(new Date().getTime())
                    }}
                  >
                    添加附件
                  </span>
                </span>
                <RenderUplodFile
                  visible={uploadVisible}
                  leftDown={false}
                  canDel={true}
                  filelist={newFileList || []}
                  teamId={state.ascriptionId}
                  fileId={pageUuid}
                  defaultFiles={defaultFiles || []}
                  setVsible={state => setUploadVisible(state)}
                  loadTime={loadTime}
                  fileChange={(list: any, delGuid?: string) => {
                    if (delGuid !== '') {
                      const files = defaultFiles.filter((item: any) => item.fileGUID !== delGuid)
                      setDefaultFiles(files)
                      const delInfo = [...delFileIds]
                      delInfo.push(delGuid)
                      setDelFileIds(delInfo)
                    }
                    setNewFileList(list)
                  }}
                />
              </div>
              <div className="context"></div>
            </Fragment>
            <Fragment>
              <Row className="title">
                <Col>
                  <span className="formIcon member" style={{ marginRight: 4 }}></span>
                  <span className="require">*&nbsp;</span>
                  <Tooltip
                    placement="right"
                    title={
                      !state.apply
                        ? '仅适用部门当前包含的成员查看'
                        : '新加入适用部门、岗位、角色的成员可查看，退出适用部门、岗位、角色不可查看'
                    }
                  >
                    <span onClick={() => checkMemberVisible(true)} style={{ cursor: 'pointer' }}>
                      适用范围
                    </span>
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <div className="rangDataBox">
                  {checkedMember.map((item: any) => {
                    return (
                      <div key={item.key}>
                        <span className="text">
                          {item.type === 6
                            ? item['roleName']
                            : item.type === 31
                            ? `${item.deptName}-${item.name}`
                            : item['name']}
                        </span>
                        <div className="delIcon" onClick={() => delApplyMember(item)}></div>
                      </div>
                    )
                  })}
                </div>
              </Row>
              <Row className="title">
                <Col>
                  <span className="formIcon set"></span>
                  <span>其他设置</span>
                </Col>
              </Row>
              <Row>
                <div className="context" style={{ paddingLeft: 30 }}>
                  <Tooltip title='勾选后，适用范围的成员需要点击"我已知晓"才会将公告设为已读'>
                    <Checkbox
                      onChange={e => {
                        dispatch({
                          type: 'IS_RECEIPT',
                          data: e.target.checked ? 1 : 0,
                        })
                      }}
                      checked={state.isReceipt === 1 ? true : false}
                    >
                      需要回执
                    </Checkbox>
                  </Tooltip>
                  <Tooltip title="勾选后，适用范围的成员查阅详情时，可以下载和复制公告内容">
                    <Checkbox
                      onChange={e => {
                        dispatch({
                          type: 'IS_DOWNLOAD',
                          data: e.target.checked ? 1 : 0,
                        })
                      }}
                      checked={state.isDownload === 1 ? true : false}
                    >
                      允许下载
                    </Checkbox>
                  </Tooltip>
                </div>
              </Row>
            </Fragment>

            {memberModalVisible && (
              <SelectMember
                visible={memberModalVisible}
                checkMemberVisible={checkMemberVisible}
                enterpriseId={state.ascriptionId}
                setMemberData={data => setCheckedMember(data)}
                applyChange={data => dispatch({ type: 'APPLY_TYPE', data })}
                apply={state.apply}
                checkedMember={checkedMember}
              />
            )}
          </div>
          <div className="addModalFooter ant-modal-footer">
            <div className="option">
              <span
                style={{ marginRight: 12 }}
                className="previewDetails"
                onClick={() => setPreviewModalVisible(true)}
              >
                <span className="preview_box">
                  <span className="preview_icon"></span>预览
                </span>
              </span>
              <Button type="ghost" loading={btnLoad.opinion} onClick={() => formSubmit(1)}>
                意见征集
              </Button>
              <Button type="ghost" loading={btnLoad.manuscript} onClick={() => formSubmit(0)}>
                存为草稿
              </Button>
              <Button type="primary" loading={btnLoad.submit} onClick={() => formSubmit(3)}>
                发布
              </Button>
            </div>
          </div>

          {previewModalVisible && (
            <NoticePreviewModal
              enterpriseList={modalParam.enterpriseList || state.companyList}
              groupList={state.groupList}
              visible={previewModalVisible}
              closePreviewModal={closePreviewModal}
              isDownLoad={state.isDownload === 1 ? false : true}
              data={{
                fileModels: [...fileModal, ...newFileList],
                relationModels: checkedMember,
                content: editorContent,
                apply: state.apply,
                name: state.name,
                ascriptionId: state.ascriptionId,
                groupId: state.groupId,
                officeUrl: state.officeInfo.noticeFileUrl,
              }}
            />
          )}
        </Fragment>
      </div>
    </div>
  )
}

export default React.memo(AddModal)

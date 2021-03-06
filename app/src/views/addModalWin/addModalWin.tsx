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
    companyId: 0, //??????id,
    groupId: undefined, //??????id
    enterpriseList: undefined,
    editNoticeData: '',
  })

  //???????????????????????????
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')
  const [defaultFiles, setDefaultFiles] = useState<any>([])
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])

  // ????????????????????????
  const [memberModalVisible, setMemberModalVisible] = useState(false)
  // ???????????????????????????
  const [checkedMember, setCheckedMember] = useState<Array<RelationModelItemProps>>([])
  // ????????????
  const [editorContent, setEitorContent] = useState<string | HTMLElement>('')
  // ????????????
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  //??????loading
  const [btnLoad, setBtnLoad] = useState({
    opinion: false, //????????????loading
    manuscript: false, //??????loading
    submit: false, //????????????loading
  })
  const initialState = {
    companyList: [],
    ascriptionId: '',
    groupId: '',
    apply: 0, //????????????
    isDownload: 0,
    isReceipt: 0,
    name: '',
    groupList: [],
    officeInfo: {
      noticeFileUrl: '', //office????????????url
      noticeUuid: '', //?????????UUID
    },
  }
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => {
    setPageUuid(Maths.uuid())
    //???????????????????????????????????????
    ipcRenderer.on('window-show', () => {
      console.log('????????????')
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
      companyId: companyId, //??????id,
      groupId: groupId, //??????id
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
        companyId: belongId, //??????id,
        groupId: groupId, //??????id
        enterpriseList: enterpriseList,
        editNoticeData: editNoticeData,
      })
    }

    if (editNoticeData) {
      // ????????????
      getCompanylist({ userId: nowUserId }).then((res: any) => {
        // ????????????
        dispatch({ type: 'COMPANY_LISY', data: res.dataList })
        // ??????id
        dispatch({ type: 'ASCRIPTION_Id', data: editNoticeData.belongId })
      })
      // ?????????operate???1?????????
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
      // ????????????
      dispatch({ type: 'GROUPLIST', data: groupList })
      // ??????id
      dispatch({
        type: 'NOTICE_TYPE_ID',
        data: editNoticeData.groupId,
      })
      dispatch({
        type: 'NOTICE_OFFICE',
        data: {
          noticeFileUrl: editNoticeData.noticeUrl, //office????????????url
          noticeUuid: '', //?????????UUID
        },
      })
    } else if (companyId) {
      //?????????????????????
      // ?????????operate???1?????????
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
      // ????????????
      dispatch({ type: 'COMPANY_LISY', data: currentCompany })
      // ??????id
      dispatch({ type: 'ASCRIPTION_Id', data: companyId })
      // ????????????
      dispatch({ type: 'GROUPLIST', data: groupList })
      // ??????id
      dispatch({
        type: 'NOTICE_TYPE_ID',
        data: groupId ? groupId : groupList.length > 0 && groupList[0].id,
      })
    } else {
      // ??????????????????
      getCompanylist({ userId: nowUserId }).then((res: any) => {
        const data = res.dataList
        // ????????????
        dispatch({ type: 'COMPANY_LISY', data })
        // ??????id
        dispatch({ type: 'ASCRIPTION_Id', data: data[0].id })
        //??????office????????????Url(??????????????????????????????)
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
  // ??????????????????????????????
  function checkMemberVisible(isVisible: boolean) {
    setMemberModalVisible(isVisible)
  }

  // ?????????????????????????????????
  function editorChange(html: string) {
    setEitorContent(html)
  }

  // ????????????????????????
  function delApplyMember(record: RelationModelItemProps) {
    setCheckedMember(origin => {
      return origin.filter(item => {
        return item.key !== record.key
      })
    })
  }

  // ????????????
  function formSubmit(submitType: number) {
    if (!state.name) {
      message.error('?????????????????????')
      return
    } else if (checkedMember.length === 0) {
      message.error('?????????????????????')
      return
    }

    if (!state.officeInfo.noticeFileUrl) {
      if (!editorContent) {
        message.error('?????????????????????')
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
        type: type === 0 ? '4' : type === 31 ? '5' : type, // 2?????? 3?????? 4?????? 5?????? 6??????
        typeName: type === 31 ? `${item.deptName}-${item.name}` : item.name ? item.name : item.roleName,
        includeChild: item.includeChild || '1', //?????????????????????
      }
      relationModels.push(obj)
    })
    const params = {
      name: state.name,
      userId: nowUserId,
      username: nowUser,
      isManager: 0, //isManager === 'company' ? 1 : 0
      id: modalParam.editNoticeData ? modalParam.editNoticeData.id : '', // ??????id
      type: submitType, //????????????  0?????????1??????????????????2????????????3?????????
      groupId: state.groupId,
      content: editorContent,
      fileModels, //????????????
      apply: state.apply, //????????????0???1
      relationModels, //????????????
      isReceipt: state.isReceipt ? '1' : '0',
      isDownload: state.isDownload ? '1' : '0',
      temporaryId: pageUuid, //?????????????????????uuid
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

  // ??????????????????
  const changeCompany = (data: number) => {
    setCheckedMember([])
    dispatch({ type: 'ASCRIPTION_Id', data })
  }

  // ?????????????????????
  const closePreviewModal = () => {
    setPreviewModalVisible(false)
  }

  useEffect(() => {
    //??????????????????-????????????????????????????????????
    if (!modalParam.companyId && state.ascriptionId) {
      getGrouplist({ userId: nowUserId, teamId: state.ascriptionId }).then((res: any) => {
        // ????????????
        dispatch({ type: 'GROUPLIST', data: res.dataList })
        // ??????id
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
                placeholder="?????????????????????"
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
                <span className="require">*&nbsp;</span>????????????
              </div>
              <div className="context" style={{ marginLeft: 10 }}>
                <TextArea
                  className="modal_name_area"
                  value={state.name}
                  maxLength={100}
                  rows={4}
                  placeholder="????????????????????????100????????????"
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
                    ????????????
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
                        ? '??????????????????????????????????????????'
                        : '????????????????????????????????????????????????????????????????????????????????????????????????????????????'
                    }
                  >
                    <span onClick={() => checkMemberVisible(true)} style={{ cursor: 'pointer' }}>
                      ????????????
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
                  <span>????????????</span>
                </Col>
              </Row>
              <Row>
                <div className="context" style={{ paddingLeft: 30 }}>
                  <Tooltip title='?????????????????????????????????????????????"????????????"???????????????????????????'>
                    <Checkbox
                      onChange={e => {
                        dispatch({
                          type: 'IS_RECEIPT',
                          data: e.target.checked ? 1 : 0,
                        })
                      }}
                      checked={state.isReceipt === 1 ? true : false}
                    >
                      ????????????
                    </Checkbox>
                  </Tooltip>
                  <Tooltip title="????????????????????????????????????????????????????????????????????????????????????">
                    <Checkbox
                      onChange={e => {
                        dispatch({
                          type: 'IS_DOWNLOAD',
                          data: e.target.checked ? 1 : 0,
                        })
                      }}
                      checked={state.isDownload === 1 ? true : false}
                    >
                      ????????????
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
                  <span className="preview_icon"></span>??????
                </span>
              </span>
              <Button type="ghost" loading={btnLoad.opinion} onClick={() => formSubmit(1)}>
                ????????????
              </Button>
              <Button type="ghost" loading={btnLoad.manuscript} onClick={() => formSubmit(0)}>
                ????????????
              </Button>
              <Button type="primary" loading={btnLoad.submit} onClick={() => formSubmit(3)}>
                ??????
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

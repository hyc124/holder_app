import React, { useState, useReducer, Fragment, useEffect } from 'react'
import { Modal, Input, Button, Checkbox, Tooltip, Row, Col, message, Select } from 'antd'
import { MinusCircleOutlined } from '@ant-design/icons'
import SelectMember from '@/src/components/select-member/index'
import Editor from '@/src/components/editor/index'
import { publishNotice } from './actions'
import NoticePreviewModal from './noticePreviewModal'
import { getCompanylist, getGrouplist } from './actions'
import { RenderUplodFile } from '../mettingManage/component/RenderUplodFile'
import * as Maths from '@/src/common/js/math'
const { Option } = Select
interface NoticeTypeListProps {
  id: number
  name: string
  operate: number
}
interface NoticeDataProps {
  enterpriseList?: NoticeTypeListProps[]
  companyId: number
  groupId?: number | string
  editNoticeData: DetailsItemProps | ''
  addModalVisble: boolean
  hideAddModal: () => void
  publishSuccess: (data: object) => void
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
    default:
      return state
  }
}

const AddModal = ({
  addModalVisble,
  companyId,
  groupId,
  enterpriseList,
  editNoticeData,
  hideAddModal,
  publishSuccess,
}: NoticeDataProps) => {
  const { nowUserId, nowUser } = $store.getState()
  // ???????????????????????????
  // const [fileList, setFileList] = useState<Array<FileModelsItemProps>>([])
  //???????????????????????????
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')
  const [defaultFiles, setDefaultFiles] = useState<Array<any>>([])
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])

  // ????????????????????????
  const [memberModalVisible, setMemberModalVisible] = useState(false)
  // ???????????????????????????
  const [checkedMember, setCheckedMember] = useState<Array<RelationModelItemProps>>([])
  // ????????????
  const [editorContent, setEitorContent] = useState<string | HTMLElement>('')
  // ????????????
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [btnLoading, setTableLoading] = useState(false)

  // ??????????????????
  // let initialState = {
  //   companyList: [],
  //   ascriptionId: '',
  //   groupId: '',
  //   apply: 0, //????????????
  //   isDownload: 0,
  //   isReceipt: 0,
  //   name: '',
  //   groupList: [],
  // }
  const initialState = {
    companyList: [],
    ascriptionId: '',
    groupId: '',
    apply: editNoticeData ? editNoticeData.type : 0, //????????????
    isDownload: editNoticeData ? editNoticeData.isDownload : 0,
    isReceipt: editNoticeData ? editNoticeData.isReceipt : 0,
    name: editNoticeData ? editNoticeData.name : '',
    groupList: [],
  }
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    setPageUuid(Maths.uuid())
  }, [])

  useEffect(() => {
    if (editNoticeData) {
      const { relationModels, content, fileReturnModels } = editNoticeData
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
      // setFileList(fileModels)
      setDefaultFiles(fileReturnModels)
    }
  }, [editNoticeData])

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
    } else if (!editorContent) {
      message.error('?????????????????????')
      return
    } else if (checkedMember.length === 0) {
      message.error('?????????????????????')
      return
    }
    const relationModels: object[] = []
    const fileModels: object[] = []
    setTableLoading(true)
    // fileList.map((item: any) => {
    //   const res = item.name.split('.')
    //   const suffix = res[res.length - 1]?.toLowerCase()
    //   const obj = {
    //     id: item.id ? item.id : '',
    //     fileKey: item.fileKey ? item.fileKey : `${item.uid}.${suffix}`,
    //     fileName: item.fileName ? item.fileName : item.name,
    //     fileSize: item.fileSize ? item.fileSize : item.size,
    //     uploadUser: item.uploadUser,
    //     uploadDate: item.uploadDate,
    //     dir: 'notice',
    //   }
    //   fileModels.push(obj)
    // })

    checkedMember.map((item: RelationModelItemProps) => {
      const type = item.type
      const obj = {
        // typeId: editNoticeData.id ? item.typeId : type === 0 ? item.rid : item.id,
        typeId: item.typeId ? item.typeId : item.id,
        type: type === 0 ? '4' : type === 31 ? '5' : type, // 2?????? 3?????? 4?????? 5?????? 6??????
        typeName: type === 31 ? `${item.deptName}-${item.name}` : item.name ? item.name : item.roleName,
        includeChild: item.includeChild || '1', //TODO: ?????????????????????
      }
      relationModels.push(obj)
    })
    const params = {
      name: state.name,
      userId: nowUserId,
      username: nowUser,
      isManager: 0, //TODO: isManager === 'company' ? 1 : 0
      id: editNoticeData ? editNoticeData.id : '', //TODO: ??????id
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
    }
    publishNotice(params)
      .then(() => {
        publishSuccess(params)
      })
      .finally(() => {
        setTableLoading(false)
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
    if (!companyId && state.ascriptionId) {
      getGrouplist({ userId: nowUserId, teamId: state.ascriptionId }).then((res: any) => {
        // ????????????
        dispatch({ type: 'GROUPLIST', data: res.dataList })
        // ??????id
        if (editNoticeData) {
          dispatch({ type: 'NOTICE_TYPE_ID', data: editNoticeData.groupId })
        } else {
          dispatch({ type: 'NOTICE_TYPE_ID', data: res.dataList[0].id })
        }
      })
    }
  }, [state.ascriptionId])

  useEffect(() => {
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
      })
    }
  }, [])

  // const renderUploadEle = useMemo(() => {
  //   return (
  //     <Fragment>
  //       <div className="title fileTitle">
  //         <span className="formIcon file"></span>
  //         <UploadFile
  //           fileModels={editNoticeData ? editNoticeData.fileModels : fileList}
  //           fileChange={fileListRes => {
  //             setFileList(fileListRes)
  //           }}
  //           showUploadList={true}
  //           dir="notice"
  //           showText="????????????"
  //           showIcon={false}
  //           windowfrom={'mainWin'}
  //         />
  //       </div>
  //       <div className="context"></div>
  //     </Fragment>
  //   )
  // }, [])

  return (
    <Fragment>
      <Modal
        className="addMemberModal"
        visible={addModalVisble}
        maskClosable={false}
        title={
          <Select
            style={{ width: '200px' }}
            value={state.ascriptionId && parseInt(state.ascriptionId)}
            disabled={companyId ? true : false}
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
        }
        onOk={() => hideAddModal()}
        onCancel={() => hideAddModal()}
        destroyOnClose={true}
        width={1000}
        bodyStyle={{ maxHeight: '700px', overflowY: 'auto' }}
        // okButtonProps={{ disabled: true }}
        // cancelButtonProps={{ disabled: true }}
        footer={
          <div className="addModalFooter">
            <div>
              <Tooltip title='?????????????????????????????????????????????"????????????"???????????????????????????'>
                <Checkbox
                  onChange={e => dispatch({ type: 'IS_RECEIPT', data: e['target']['checked'] })}
                  defaultChecked={state.isReceipt === 1 ? true : false}
                >
                  ????????????
                </Checkbox>
              </Tooltip>
              <Tooltip title="????????????????????????????????????????????????????????????????????????????????????">
                <Checkbox
                  onChange={e => dispatch({ type: 'IS_DOWNLOAD', data: e['target']['checked'] })}
                  defaultChecked={state.isDownload === 1 ? true : false}
                >
                  ????????????
                </Checkbox>
              </Tooltip>
            </div>
            <div>
              <span className="previewDetails" onClick={() => setPreviewModalVisible(true)}>
                ??????
              </span>
              <Button type="ghost" loading={btnLoading} onClick={() => formSubmit(1)}>
                ????????????
              </Button>
              <Button type="ghost" loading={btnLoading} onClick={() => formSubmit(0)}>
                ????????????
              </Button>
              <Button type="primary" loading={btnLoading} onClick={() => formSubmit(3)}>
                ??????
              </Button>
            </div>
          </div>
        }
      >
        <Row className="title">
          <Col>
            <span className="formIcon type"></span>
            <Select
              style={{ width: '200px' }}
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
            <span className="formIcon name"></span>
            <span className="require">*&nbsp;</span>????????????
          </div>
          <div className="context">
            <Input
              defaultValue={state.name}
              onChange={e => dispatch({ type: 'NOTICE_TITLE', data: e['target']['value'] })}
              placeholder="????????????????????????100????????????"
              maxLength={100}
            />
          </div>
        </Fragment>

        <Fragment>
          <div className="title">
            <span className="formIcon content"></span>
            <span className="require">*&nbsp;</span>????????????
          </div>
          <div className="context">
            <Editor
              editorContent={editorContent}
              editorChange={editorChange}
              previewArea=".detailDesEditor"
              minHeight={240}
              // maxHeight={240}
              height={240}
              className="detailDesEditor"
              placeholder="?????????????????????"
            />
          </div>
        </Fragment>
        {/* {renderUploadEle} */}
        <Fragment>
          <div className="title fileTitle">
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span className="formIcon file"></span>
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
                console.log('???????????????', delGuid)
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
          <div className="title">
            <span className="formIcon member"></span>
            <span className="require">*&nbsp;</span>
            <span onClick={() => checkMemberVisible(true)} style={{ cursor: 'pointer' }}>
              ????????????
              {!state.apply
                ? '????????????????????????????????????????????????'
                : '??????????????????????????????????????????????????????????????????????????????????????????????????????????????????'}
            </span>
          </div>
          <div className="context">
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
                    <div className="delIcon" onClick={() => delApplyMember(item)}>
                      <MinusCircleOutlined />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
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
      </Modal>

      {previewModalVisible && (
        <NoticePreviewModal
          enterpriseList={enterpriseList || state.companyList}
          groupList={state.groupList}
          visible={previewModalVisible}
          closePreviewModal={closePreviewModal}
          isDownLoad={false}
          data={{
            fileModels: [...defaultFiles, ...newFileList],
            relationModels: checkedMember,
            content: editorContent,
            apply: state.apply,
            name: state.name,
            ascriptionId: state.ascriptionId,
            groupId: state.groupId,
          }}
        />
      )}
    </Fragment>
  )
}

export default React.memo(AddModal)

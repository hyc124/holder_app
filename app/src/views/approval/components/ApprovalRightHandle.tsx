import React, { useState, useRef, useReducer, useEffect } from 'react'
import { Input, Menu, Row, Button, Dropdown, Tooltip, Avatar } from 'antd'
import $c from 'classnames'
import { ApprovalBtnsProps } from './ApprovalDettail'
// import UploadFile from '@/src/components/upload-file/index'
// import { PaperClipOutlined } from '@ant-design/icons';
import { auto } from 'async'
import { confidenPortraitApi } from '../getData/getData'
import { SelectMemberOrg } from '@/src/components/select-member-org/index'
import { ApprovalcommentEditor } from '@/src/views/approval/components/ApprovalcommentEditor'
import { RenderUplodFile } from '../../mettingManage/component/RenderUplodFile'
import * as Maths from '@/src/common/js/math'
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
// const fileModelss: any = []
//审批右侧组件
const ApprovalRightHandle = ({
  btns,
  disableInput,
  onHandle,
  teamId,
  curAppId,
  clearData,
  isDisabled,
}: {
  btns: ApprovalBtnsProps[]
  disableInput: boolean
  onHandle: (type: string, result: string, atUserIds?: any[], addFiles?: any[], pageUuid?: string) => void
  teamId: number
  curAppId: any
  clearData: boolean
  isDisabled: boolean
}) => {
  // reducer初始化参数
  const [state, dispatch] = useReducer(reducer, initStates)
  const [fileModelss, setfileModelss] = useState<any>([])

  //右侧是否收起
  const [closeRight, setCloseRight] = useState(false)
  const [usersShow, setUsersShow] = useState(false)
  //审批意见
  const [result, setResult] = useState('')
  //审批右侧收起展开
  const toggleRightPane = () => {
    setCloseRight(!closeRight)
  }
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState({})
  //选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //获取@成员
  const [atUserIds, setAtUserIds] = useState<any>([])
  //获取添加的附件
  const [addFiles, setAddFiles] = useState<any>([])
  //备注信息
  const changeResult = (e: any) => {
    e.persist()
    chatEventAt(e)
    e.stopPropagation()
    setResult(e.target.value)
  }
  //绑定@事件
  const chatEventAt = (event: any) => {
    event.persist()
    const lastText = event.target.value.substr(event.target.value.length - 1)
    if (lastText == '@') {
      confidenPortrait(event)
      setUsersShow(true)
      // blankClick()
    } else {
      setUsersShow(false)
    }
  }
  //@人中-常用联系人查询
  const confidenPortrait = (e: any) => {
    //判断权限
    const param = {
      userId: $store.getState().nowUserId,
      account: $store.getState().nowAccount,
      onlyUser: 0, //0不查岗位 1 查
      permissionType: 1, //0子管理 1任务 2关注人
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
      checkboxType: 'radio',
      isDel: false, //是否可以删除 true可以删除
      permissionType: 3, //组织架构通讯录范围控制
      checkableType: [0, 2, 3], //部门 企业 人员都可选择
    }
    setSelMemberOrg(initSelMemberOrg)
  }
  //选择成员设置数据
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const datas = dataList[0]
    let tmp: any
    tmp = result + datas.userName + ''
    tmp = tmp
    setResult(tmp)
    setUsersShow(false)
    setAtUserIds([...atUserIds, datas.userId])
  }
  useEffect(() => {
    if (clearData == true) {
      setResult('')
      setAtUserIds([])
      setAddFiles([])
      setfileModelss([])
      msgTxtRef && msgTxtRef.current ? (msgTxtRef.current.innerHTML = '') : ''
    }
  }, [clearData])

  const editorRef = useRef<any>()
  const [msgTxtRef, setMsgTxtRef] = useState<any>(null)
  //输入变化状态
  const [status, setStatus] = useState<any>()
  // 是否回复状态
  // let editMarkMsgRef: any = null
  const [replay, setReplay] = useState<any>({ replayTip: '' })
  const [visible, setVisible] = useState(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')

  useEffect(() => {
    setMsgTxtRef(editorRef.current.getEditor())
  }, [status])
  useEffect(() => {
    //清空输入
    setResult('')
    setAtUserIds([])
    setAddFiles([])
    setfileModelss([])
    setPageUuid(Maths.uuid())
    jQuery('.commentMsgEditor').empty()
  }, [curAppId])
  //点击按钮
  const onBtnHandle = (type: string) => {
    onHandle(type, msgTxtRef.current.innerHTML, atUserIds, addFiles, pageUuid)
    setPageUuid(Maths.uuid()) //提交备注以后需要重新生成uuid
    const checkType = ['agree', 'reject', 'prevapostille', 'nextapostille']
    if (!checkType.includes(type)) {
      setResult('')
      setAtUserIds([])
      setAddFiles([])
      setfileModelss([])
      msgTxtRef.current.innerHTML = ''
    }
  }
  return (
    <div className={$c('right-panel', { closePane: closeRight })}>
      <div style={{ position: 'relative' }}>
        <ApprovalcommentEditor
          ref={editorRef}
          param={{
            sourceType: 'synergyMain',
            currentType: 'replayright',
            handleBtnShow: true,
            replay,
            teamId: teamId,
            setFileList: ({ fileItem, imgUrl }: any) => {},
            delCommentTxt: () => {},
            compCommentHight: () => {},
            setStatus,
            atUserIds,
            addFiles,
            setAtUserIds,
            setAddFiles,
            fileModelss,
          }}
        />
        <Button
          style={{ position: 'absolute', left: '6px', bottom: '2px' }}
          className="msg-handle-btn file_icon"
          onClick={() => {
            setVisible(true)
            setLoadTime(new Date().getTime())
          }}
        ></Button>
      </div>
      <RenderUplodFile
        visible={visible}
        leftDown={false}
        canDel={true}
        filelist={addFiles || []}
        teamId={teamId}
        fileId={pageUuid}
        defaultFiles={[]}
        setVsible={state => setVisible(state)}
        loadTime={loadTime}
        fileChange={(list: any, delGuid?: string, isDel?: boolean) => {
          setAddFiles(list)
        }}
      />
      <RenderRightBtnGroup btns={btns} onHandle={onBtnHandle} isDisabled={isDisabled} />
      <div className="right-side-button" onClick={toggleRightPane}></div>
    </div>
  )
}

//审批右侧按钮展示
const RenderRightBtnGroup = ({
  btns,
  onHandle,
  isDisabled,
}: {
  btns: ApprovalBtnsProps[]
  onHandle: (type: string) => void
  isDisabled: boolean
}) => {
  //点击审批右侧下拉菜单按钮组
  const handleMenuClick = (e: any) => {
    onHandle(e.key)
  }
  //点击操作按钮
  const handleBtnClick = (type: string) => {
    onHandle(type)
  }
  const showBtns = btns.filter(item => item.visible)
  let btnMenu: any = null
  let backMenu: any = null
  let showPreBtns: ApprovalBtnsProps[] = []
  if (showBtns.length > 4) {
    //超过四个按钮时只显示两个操作按钮，剩下的显示更多
    showPreBtns = showBtns.filter((_item, index) => index < 3)
    const menuBtns = showBtns.filter((_item, index) => index >= 3 && index < 5)
    backMenu = (
      <Menu onClick={handleMenuClick} className="handle-approval-btns">
        <Menu.Item key={'backtoperson'} disabled={isDisabled} className="overrule">
          回退至发起人
        </Menu.Item>
        <Menu.Item key={'backtoprevnode'} disabled={isDisabled} className="overrule">
          回退至上一节点审批
        </Menu.Item>
      </Menu>
    )
    btnMenu = (
      <Menu onClick={handleMenuClick} className="handle-approval-btns">
        {menuBtns.map(item => {
          if (item.key === 'apostille') {
            //加签按钮可选
            return (
              <Menu.SubMenu key={item.key} title={item.name} className="apostille">
                <Menu.Item key={'prevapostille'}>事前加签</Menu.Item>
                <Menu.Item key={'nextapostille'}>事后加签</Menu.Item>
              </Menu.SubMenu>
            )
          } else {
            return (
              <Menu.Item key={item.key} className={item.key} disabled={item.disabled}>
                {item.name}
              </Menu.Item>
            )
          }
        })}
      </Menu>
    )
  }
  return (
    <Row className="approval-handle-btn-group">
      {showBtns.length <= 4 &&
        showBtns.map(item => (
          <button
            disabled={item.disabled || false}
            key={item.key}
            onClick={() => {
              handleBtnClick(item.key)
            }}
          >
            {item.name}
          </button>
        ))}
      {showBtns.length > 4 && (
        <>
          {showPreBtns.map((item, index) => {
            if (index < 2) {
              return (
                <button
                  key={item.key}
                  disabled={item.disabled || false}
                  onClick={() => {
                    handleBtnClick(item.key)
                  }}
                >
                  {item.name}
                </button>
              )
            } else {
              return (
                <Dropdown overlay={backMenu} trigger={['click']} placement="bottomCenter">
                  <Button className="back_step" key={item.key} disabled={item.disabled || false}>
                    {item.name}
                  </Button>
                </Dropdown>
              )
            }
          })}
          <Dropdown overlay={btnMenu} trigger={['click']}>
            <Button className="show_more" icon={<span className="approval-btn-more"></span>}>
              更多
            </Button>
          </Dropdown>
        </>
      )}
    </Row>
  )
}

export default ApprovalRightHandle

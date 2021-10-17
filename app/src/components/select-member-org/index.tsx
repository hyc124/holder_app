import React, { useState, useEffect, useImperativeHandle, useRef, useContext } from 'react'
import { Modal, Button, Tree, Input, Avatar, Radio, Checkbox, Dropdown, Spin, message } from 'antd'
import { LeftOutlined, SearchOutlined } from '@ant-design/icons'
import { requestApi } from '../../common/js/ajax'
import { findAuthList, findProfileApi } from '../../common/js/api-com'
// import { CheckAvatar } from '@/src/views/task/task-com/TaskCom'
import { findRepeatIndex, cutName, arrObjDuplicate } from '@/src/common/js/common'
import './org-modal.less'
import NoneData from '../none-data/none-data'
import { color } from 'html2canvas/dist/types/css/types/color'
// 创建弹框上下文
export const modalContext = React.createContext({})
/**
 * 根据筛选类型显示的组织架构内容
 */
interface DataNode {
  title: string
  key: string
  isLeaf?: boolean
  children?: DataNode[]
}
/**
 * 已选人员单项对象格式
 */
interface SelectItem {
  curId: string | number
  curName: string
  curType: number
  parentId?: string
  parentName?: string
  deptId?: string
  deptName?: string
  roleId?: string
  roleName?: string
  profile?: string
  disable?: boolean //是否可选中或删除
  partakeMember?: boolean //是否是参与企业联系人
  forceReportUser?: boolean //发起工作报告区分强制汇报人
}
/**
 * 外部传入属性参数
 */
interface PropParam {
  visible: boolean
  teamId?: string | number
  allowTeamId?: Array<number>
  findType?: number
  selectList?: Array<SelectItem>
  title?: any
  isDel?: boolean
  notAccount?: string
  notChildAccount?: string
  permissionType?: number
  defaultLevel?: number
  isQueryAll?: number
  contacts?: any
  checkboxType?: string
  sourceType?: string
  showPrefix?: any
  fliterByType?: any
  checkableType?: Array<number>
  cascadeMember?: boolean
  orgBotInfo?: {
    type: string
    title?: string
    titleSub?: string
    subTit?: string
  }
  inMyself?: any
  orgBotList?: boolean | Array<SelectItem>
  disableList?: Array<SelectItem>
  onSure?: any
  onClose?: any
  comMember?: boolean
  isOuterSystem?: number // 为1时查询外部系统数据
  approvalObj?: { approvalId: any; eventId: number; uuid: string; elementType: string } //外部数据
  useExternal?: boolean //是否勾选上级元素 check选项情况
}

let setSearchListRes: any = null
let authList: any = []
// 默认参数
export const defaults: any = {
  nowAccount: '',
  nowUserName: '',
  nowUserId: '',
  teamId: '', //可不传，从allowTeamId中取teamId
  allowTeamId: [], //允许显示的企业id
  findType: 0, //查询类型 0人员 3部门 31岗位 310岗位人员
  selectList: [], //已选择人员
  isDel: true, //是否可删除选中数据
  title: '选择成员',
  notAccount: '', //排除的账号
  notChildAccount: '', //排除的子账号
  permissionType: 3, //组织架构数据通讯录范围
  defaultLevel: 3, //默认查询层级
  isQueryAll: 0, //传0或者不传 表示不查询所有
  contacts: {
    //常用联系人参数
    onlyUser: 1, //常用联系人是否查岗位，0不查岗位 1查
    notRole: false, //常用联系人排除的岗位
  },
  inMyself: false, //控制搜索不包含自己
  checkboxType: 'checkbox', //单选：radio，多选:checkbox
  sourceType: '', //操作类型/来源
  showPrefix: {
    //是否显示成员的部门岗位前缀
    dept: true, //部门
    role: true, //岗位
    company: true, //企业前缀
  },
  // 类型菜单配置
  fliterByType: {
    '1': {
      show: true,
      text: '按组织架构选择',
    },
    '2': {
      show: true,
      text: '按角色选择',
    },
    '3': {
      show: true,
    },
    '4': {
      show: true,
      text: '常用联系人',
    },
  }, //控制显示的筛选类型（按组织架构，角色，一级部门，常用联系人）
  /**
   * 配置哪些类型添加单/复选框，并且可选中，选中后显示在右侧（非级联人员，级联人员选中非人员时不会展示右侧），
   * 数组，可传多个，0人员 3部门 31岗位，默认只可选人员
   */
  checkableType: [0],
  //是否级联选中成员（选中父级部门、企业可级联选中成员）
  cascadeMember: false,
  // 组织架构类型选择下面的成员展示类型
  orgBotInfo: {
    type: 'chat',
    title: '主题讨论成员',
    subTit: '已加入该主题讨论的成员',
    titleSub: '',
  },
  addShowOkrText: '',
  // 组织架构类型选择下面的成员展示,false默认不展示
  orgBotList: false,
  // 置灰选中的成员数据，但右侧不展示
  disableList: [],
  //不同企业部门下同一成员是否全需要选中
  comMember: true,
  //审批查询外部数据标识
  isOuterSystem: 0,
  //审批外部数据需要参数
  approvalObj: null,
  useExternal: false,
  //点击确认后回调
  onSure: () => {
    return {}
  },
  //点击确认后回调
  onClose: () => {
    return {}
  },
}
/**
 * 选择人员或部门
 */
export const SelectMemberOrg = React.memo((props: { param: PropParam; action?: any }) => {
  defaults.nowAccount = $store.getState().nowAccount
  defaults.nowUserName = $store.getState().nowUser
  defaults.nowUserId = $store.getState().nowUserId
  defaults.title = $intl.get('selectMembers')
  defaults.fliterByType = {
    '1': {
      show: true,
      text: $intl.get('chooseByOrg'),
    },
    '2': {
      show: true,
      text: $intl.get('chooseByRole'),
    },
    '3': {
      show: true,
    },
    '4': {
      show: true,
      text: $intl.get('topContacts'),
    },
  }
  defaults.orgBotInfo = {
    type: 'chat',
    title: $intl.get('subjectChatMembers'),
    subTit: $intl.get('joinedChatMembers'),
    titleSub: '',
  }

  // 外部传入的参数
  const getParam = props.param
  //   外部方法
  const action = props.action
  const { visible } = getParam
  // 设置默认可选类型，默认添加复选框的类型跟查询类型findType一致
  if (!getParam.checkableType) {
    const findType = getParam.findType ? getParam.findType : 0
    defaults.checkableType = [findType]
  }
  const initSelectList = JSON.parse(JSON.stringify(getParam.selectList || []))
  //   合并参数
  const options = { ...defaults, ...getParam, selectList: [...initSelectList] }
  //   组件架构容器组件
  const orgLeftRef: any = useRef({})
  //   右侧数据展示容器组件
  const rigConRef: any = useRef({})

  const [state, setState] = useState<any>({ visible: false })
  useEffect(() => {
    const typeId = options.allowTeamId ? options.allowTeamId[0] : ''
    if (options.visible) {
      async function findAuth() {
        authList = await findAuthList({
          typeId,
          customAuthList: [],
        })
      }
      findAuth()
    }
    // 修复bug初始加载没有重置，转换为内部state初始化一次
    setState({ ...state, visible: options.visible })
    return () => {
      authList = []
    }
  }, [options.visible])
  //   loading显示状态
  // const [orgLoading, setLoading] = useState(false)
  // 设置右侧选中数据
  const setSelectData = (list: any) => {
    rigConRef.current.setSelectData(list)
    // 如果是单选状态
    if (options.checkboxType == 'radio') orgLeftRef?.current?.initOrgBotList(list)
  }
  //   点击确认
  const handleOk = () => {
    const selectData = rigConRef.current.getSelectData()
    if (options.sourceType === 'chat_invit') {
      if (options.title !== 'string') {
        const inputELe: any = document.getElementById('chatDiscussTitle')
        if (inputELe && !inputELe.value) {
          message.error($intl.get('inputSubjectTip'))
          return
        }
      }
      const result = selectData.filter((item: any) => {
        return item.curId !== $store.getState().nowUserId
      })
      if (!result.length) {
        message.error($intl.get('leastOtherMembersTip'))
        return
      }
    }
    action.setModalShow(false)
    saveContacts()
    if (action.onSure) {
      action.onSure(selectData, {
        sourceType: options.sourceType,
      })
    }
    if (options.onSure) {
      options.onSure(selectData, {
        sourceType: options.sourceType,
      })
    }
  }
  //   点击取消
  const handleCancel = () => {
    if (options.onClose) {
      options.onClose(false)
    }
    action.setModalShow(false)
  }
  //   *************************************函数方法*******************************//

  /**
   * 设置保存选中的数据
   */
  const onSetSelData = (list: any) => {
    setSelectData([...list])
  }
  /**
   * 获取选中的数据
   */
  const getSelData = () => {
    const selectData = rigConRef.current.getSelectData()
    return selectData
  }
  /**
   * 删除数据
   */
  const delData = (_: any, item: any, index: number) => {
    const selectData = rigConRef.current.getSelectData()
    selectData.splice(index, 1)
    // 刷新右侧数据
    setSelectData([...selectData])
    // 调用子组件方法刷新左侧组织架构数据
    orgLeftRef.current.delByType(item)
  }

  // ***********************搜索************************//

  /**
   * 保存常用联系人
   */
  const saveContacts = () => {
    // 获取已选数据
    const selData = getSelData()
    const saveData: any = []
    let canSave = true
    for (let i = 0; i < selData.length; i++) {
      if (i > 9) {
        //限制最多十个常用联系人
        break
      }
      let canPush = true
      const item = selData[i]
      const deptId = item.deptId || ''
      const deptName = item.deptName || ''
      let roleId = ''
      let roleName = ''
      // 查询联系人带有岗位时传岗位参数
      // if (options.findType == 310 || options.findType == 31 || options.contacts.onlyUser == 1) {
      //   deptId = item.deptId || ''
      //   deptName = item.deptName || ''
      //   if (options.findType == 310 || options.findType == 0) {
      //     roleId = item.parentId || ''
      //     roleName = item.parentName || ''
      //   } else {
      //     roleId = item.roleId || ''
      //     roleName = item.roleName || ''
      //   }
      // }
      if (options.findType == 310 || options.findType == 0) {
        roleId = item.parentId || ''
        roleName = item.parentName || ''
      } else {
        roleId = item.roleId || ''
        roleName = item.roleName || ''
      }
      const saveItem = {
        contactsUser: item.curId,
        contactsAccount: item.account || '',
        contactsUsername: item.curName,
        contactsDeptId: deptId,
        contactsDeptName: deptName,
        contactsRoleId: roleId,
        contactsRoleName: roleName,
      }
      // 不能存储联系人的情况：1-当前类型为人员且id为空时
      if (
        (item.curType == 0 && (!item.curId || item.curId == 'undefined')) ||
        item.curType != options.findType
      ) {
        canPush = false
      }
      if (canPush) {
        saveData.push(saveItem)
      }
    }
    // 不保存情况：多企业
    if (
      (options.allowTeamId && options.allowTeamId.length != 1) ||
      !options.allowTeamId ||
      saveData.length == 0
    ) {
      canSave = false
    }
    if (!canSave) {
      return
    }
    const contactsType = options.findType == 310 || options.findType == 0 ? 0 : options.findType
    const teamId =
      options.allowTeamId && options.allowTeamId.length > 0 ? options.allowTeamId[0] : options.teamId
    const param = {
      ownerUser: $store.getState().nowUserId,
      contactsTeamId: teamId,
      contactsType: contactsType,
      modelList: saveData,
    }
    requestApi({
      url: '/team/teamUserInfo/saveContacts',
      param: param,
      json: true,
    })
  }

  // 上下文数据
  const contextObj = {
    setLoading: () => {
      return {}
    },
    options: options,
  }
  return (
    <modalContext.Provider value={contextObj}>
      <Modal
        className="baseModal selectMemberOrgModal"
        width={850}
        visible={visible}
        title={options.title}
        onOk={handleOk}
        onCancel={handleCancel}
        maskClosable={false}
        keyboard={false}
        centered
        footer={[
          <Button key="back" onClick={handleCancel}>
            {$intl.get('cancel') || '取消'}
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            {$intl.get('sure') || '确定'}
          </Button>,
        ]}
      >
        <Spin spinning={false} wrapperClassName="selMemberOrgModalLoading">
          {state.visible && (
            <section className="orgBody flex">
              <MemberOrgLeft
                ref={orgLeftRef}
                options={options}
                action={{
                  onSetSelData,
                  getSelData,
                }}
              />
              <div className="orgBodyRight  flex column">
                <div className="rigShowTit">{$intl.get('alwaysChoose')}</div>
                <RightContent ref={rigConRef} options={{ ...options }} delData={delData} />
              </div>
            </section>
          )}
        </Spin>
      </Modal>
    </modalContext.Provider>
  )
})

/**
 * 查询所有企业
 */
const findCompany = (options: any, setCmyList: any) => {
  const param = {
    username: options.nowAccount,
    userId: options.nowUserId,
    type: -1,
  }
  requestApi({
    url: '/team/enterpriseInfo/findByTypeAndUser',
    param: param,
    json: true,
  }).then(res => {
    if (res.success) {
      const list = res.data.dataList || []
      let allowTeams: any = []
      // 限制显示的企业
      let allowTeamId: any =
        options.allowTeamId && options.allowTeamId.length > 0 ? options.allowTeamId : undefined
      if (!allowTeamId && options.teamId) {
        allowTeamId = [options.teamId]
      }
      if (allowTeamId) {
        list.map((item: any) => {
          allowTeamId.map((teamId: any) => {
            if (item.id == teamId) {
              allowTeams.push(item)
            }
          })
        })
      }
      // 展示所有企业
      else {
        allowTeams = list
      }
      setCmyList(allowTeams)
    }
  })
}

/**
 * 左侧组件容器
 */

export const MemberOrgLeft = React.forwardRef((props: { ref?: any; options?: any; action: any }, ref) => {
  defaults.nowAccount = $store.getState().nowAccount
  defaults.nowUserName = $store.getState().nowUser
  defaults.nowUserId = $store.getState().nowUserId
  //   企业默认logo
  // const defLogo = $tools.asAssetsPath('/images/common/app_logo_b.png')
  const defLogo = $tools.asAssetsPath('/images/common/company_default.png')
  // 继承的父组件方法
  const ptAction = props.action || {}
  // 继承的options参数
  const options = { ...defaults, ...props.options }
  const fliterByType = options.fliterByType
  const { onSetSelData, getSelData } = ptAction
  //   组件架构容器组件
  const orgConRef: any = useRef({})
  // 组织架构下方成员列表
  const [orgBotList, setOrgBotList] = useState<any>([])
  //   所有企业数据
  const [companyList, setCmyList] = useState<any>([])
  //   组织架构显示状态
  const [orgShowObj, setOrgShowObj] = useState({
    showType: 0, //组织架构类型：0根目录 1按组织架构 2按角色 3按第一层部门 4常用联系人
    isShow: false, //组织架构是否显示
  })
  // 搜索显示
  const [searchShow, setSearchShow] = useState<boolean>(false)
  // 搜索值存贮
  const [searchParam, setSearchParam] = useState<any>()
  // ***********************暴露给父组件的方法 start**************************//
  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(ref, () => ({
    // 按类型查询第一层组织架构树
    findByType: (type: number, paramObj: any, attachObj: { checkableType: Array<number> }) => {
      checkableType = attachObj.checkableType || []
      orgConRef.current.findByType(type, paramObj)
    },
    /**
     * 按类型刷新左侧
     */
    delByType: (paramObj: any) => {
      orgConRef.current.delByType(orgShowObj.showType, paramObj)
      setOrgBotList([...orgBotList])
    },
    // 刷新底部参与联系人数据
    initOrgBotList: (list?: any[]) => {
      if (orgBotList?.length == 0) return
      if (list?.length == 1) {
        const _item = list[0]
        orgBotList.forEach((item: any) => {
          if (item.curId == _item.curId) {
            item.checked = _item.checked
          } else {
            item.checked = false
          }
        })
      } else {
        orgBotList.forEach((item: any) => (item.checked = false))
      }
    },
  }))
  // ***********************暴露给父组件的方法 end**************************//
  /**
   * 点击筛选类型
   * code:筛选类型code： 1按组织架构 2按角色 3按第一层部门 4常用联系人
   * cmyItem:当前企业数据
   * isSearchParam : 跨店资源搜索展示树结构
   */
  const clickOrgType = (code: number, item: any, isSearchParam?: any) => {
    setOrgShowObj({
      isShow: true,
      showType: code,
    })

    let param: any = {}
    if (code == 1) {
      //企业组织架构
      param = {
        findId: item.id,
        findName: item.name,
        findType: item.type,
        teamId: item.id,
        teamName: item.shortName,
        notAccount: options.notAccount,
      }
    } else if (code == 3) {
      //一级部门组织架构
      param = {
        findId: item.id,
        findName: item.name,
        findType: item.type,
        teamId: item.teamId,
        teamName: item.teamName,
        hasChild: item.hasChild,
        notAccount: options.notAccount,
      }
    } else if (code == 2 || code == 4) {
      //角色组织架构、常用联系人
      param = {
        teamId: item.id,
        teamName: item.shortName,
        notAccount: options.notAccount,
      }
    }
    // 编辑任务归属需要查询权限列表（新版5.2.4不再控制权限）
    orgConRef.current.findByType(code, param, {
      checkableType: options.checkableType,
    })
  }
  // *********************************底部列表数据(主题讨论成员、参与企业联系人,任务干系人)*********************************//
  /**
   * 底部列表数据单/复选框选中
   * item当前所选数据
   * type:radio单选 checkbox复选框
   */
  const onBotMemberChange = (e: any, item: any) => {
    let selData = getSelData()
    const checkedItem: any = item
    const showName = checkedItem.curName
    checkedItem.showName = showName
    if (e.target.type == 'radio') {
      selData = [checkedItem]
      // 设置单选框选中状态
      for (const i in orgBotList) {
        if (checkedItem.parentId && orgBotList[i].parentId) {
          if (orgBotList[i].curId == checkedItem.curId && orgBotList[i].parentId == checkedItem.parentId) {
            orgBotList[i].checked = true
          } else {
            orgBotList[i].checked = false
          }
        } else {
          if (orgBotList[i].curId == checkedItem.curId) {
            orgBotList[i].checked = true
          } else {
            orgBotList[i].checked = false
          }
        }
      }
    } else {
      if (e.target.checked) {
        selData.push(checkedItem)
      } else {
        for (const i in selData) {
          if (selData[i].curId == checkedItem.curId) {
            selData.splice(i, 1)
            break
          }
        }
      }
      // 设置复选框框选中状态
      for (const i in orgBotList) {
        if (orgBotList[i].curId == checkedItem.curId) {
          orgBotList[i].checked = e.target.checked
        }
      }
    }
    setOrgBotList([...orgBotList])
    // 设置被选中数据
    onSetSelData(selData)
    // 刷新常用联系人数据
    orgConRef.current.setContactsDataChange(e.target.checked, checkedItem.curId)
  }
  // 跨店资源搜索
  const searchOuterSystemData = (val: any) => {
    const param = {
      approvalId: options.approvalObj.approvalId || null,
      eventId: options.approvalObj.eventId,
      teamId: options.allowTeamId ? options.allowTeamId[0] : '',
      userAccount: options.nowAccount,
      uuid: options.approvalObj.uuid,
      elementType: options.approvalObj.elementType,
      key_words: val,
      isSearch: true,
    }
    setSearchParam(param)
  }

  //   监听弹框显示状态
  useEffect(() => {
    if (options.visible) {
      // 初始右侧数据显示
      // 初始展示组织架构下方成员列表
      // 根据已选人员/部门设置单/复选框选中状态
      let orgBottomList: any = []
      const disableList = options.disableList || []
      const selList = options.selectList || []
      if (options.orgBotList) {
        orgBottomList = options.orgBotList || []
        for (const i in orgBottomList) {
          const thisItem: any = orgBottomList[i]
          // 1 查询已选人员
          const findItem: any = selList.find((v: any) => {
            let judge = false
            // 有父级信息时，要判断父级是否满足
            if (v.parentId) {
              judge =
                v.curId == thisItem.curId && v.curType == thisItem.curType && v.parentId == thisItem.parentId
            } else {
              judge = v.curId == thisItem.curId && v.curType == thisItem.curType
            }
            return judge
          })
          // 设置当前是否需要选中
          if (findItem && findItem.curId == thisItem.curId && findItem.curType == thisItem.curType) {
            thisItem.checked = true
          }
          // 2 获取置灰选中成员数据，设置置灰选中效果
          const dItem: any = disableList.find((v: any) => {
            return v.curId == thisItem.curId && v.curType == thisItem.curType
          })
          if (dItem) {
            thisItem.disabled = true
          }
        }
      }
      // setSelectData(options.selectList || [])
      setOrgBotList([...orgBottomList])
      findCompany(options, setCmyList)
      setOrgShowObj({
        isShow: false,
        showType: 0,
      })

      // 是否有部门导航
      // if (options.findType == 3 || (options.checkableType && options.checkableType.includes(3))) {
      //   navListInit.unshift({
      //     active: true,
      //     name: '部门',
      //     code: 0,
      //   })
      //   navListInit[1].active = false
      //   setSearchCode(0)
      // }
    }
  }, [options.visible])

  /**
   * 查询部门筛选类型的一级部门信息
   */
  const FindFirstDept = React.memo((props: any) => {
    //   一级部门信息
    const [firstDept, setFirstDept] = useState<any>({
      teamId: '',
      teamName: '',
      deptName: '',
    })
    const cmyItem = props.itemData
    const param = {
      ascriptionId: cmyItem.id,
      userId: options.nowUserId,
    }
    useEffect(() => {
      let isUnmounted = false

      //校验是否传了tabKey 如果存在则校验tabKey的值是否为2
      if (options.hasOwnProperty('tabKey')) {
        if (options.tabKey == 2) {
          _requestApi()
        }
      } else {
        _requestApi()
      }

      function _requestApi() {
        requestApi({
          url: '/team/enterpriseUser/findUserMainPostAndDepartment',
          param: param,
        }).then(res => {
          if (!isUnmounted) {
            if (res.success) {
              const getData = res.data.data || {}
              if (getData.type != 2 && getData.departmentId) {
                const deptObj = {
                  teamId: cmyItem.id,
                  teamName: cmyItem.shortName,
                  id: getData.departmentId,
                  name: getData.departName,
                  type: getData.type,
                  profile: getData.profile || '',
                  hasChild: getData.hasChild,
                }
                setFirstDept(deptObj)
              }
            }
          }
        })
      }
      return () => {
        isUnmounted = true
      }
    }, [])

    return (
      <li
        className={`${!firstDept.name || (fliterByType['3'] && !fliterByType['3'].show) ? 'forcedHide' : ''}`}
        onClick={() => {
          clickOrgType(3, firstDept)
        }}
      >
        <em className="img_icon leaf_icon"></em>
        {firstDept.name}
      </li>
    )
  })
  return (
    <div className="orgBodyLeft flex column" style={options?.style}>
      <div className="orgTopCon flex-1">
        {/* 类型选择页 */}
        <div className={`orgTypeSelCon flex column ${orgShowObj.isShow ? 'forcedHide' : ''}`}>
          <div className={`searchContOut ${searchShow ? 'h100' : ''}`}>
            <SearchContent
              options={options}
              onSetSelData={onSetSelData}
              companyList={companyList}
              getSelData={getSelData}
              searchShow={searchShow}
              setSearchShowPt={setSearchShow}
              searchOuterSystemData={searchOuterSystemData}
            />
          </div>
          <ul className="companyList flex-1">
            {companyList.map((item: any, i: number) => {
              return (
                <li key={i}>
                  <div className="company_top">
                    <Avatar className="cmy_avatar" src={item.logo ? item.logo : defLogo}></Avatar>
                    <span>{item.shortName}</span>
                  </div>
                  <ul className="orgTypeList">
                    <li
                      className={`${fliterByType['1'] && !fliterByType['1'].show ? 'forcedHide' : ''}`}
                      onClick={() => {
                        clickOrgType(1, item, searchParam)
                      }}
                    >
                      <em className="img_icon leaf_icon"></em>{' '}
                      {fliterByType['1'] && fliterByType['1'].text
                        ? fliterByType['1'].text
                        : $intl.get('chooseByOrg')}
                    </li>
                    <li
                      className={`${fliterByType['2'] && !fliterByType['2'].show ? 'forcedHide' : ''}`}
                      onClick={() => {
                        clickOrgType(2, item)
                      }}
                    >
                      <em className="img_icon leaf_icon"></em>
                      {fliterByType['2'] && fliterByType['2'].text
                        ? fliterByType['2'].text
                        : $intl.get('chooseByRole')}
                    </li>
                    <FindFirstDept itemData={item} />
                    <li
                      className={`${fliterByType['4'] && !fliterByType['4'].show ? 'forcedHide' : ''}`}
                      onClick={() => {
                        clickOrgType(4, item)
                      }}
                    >
                      <em className="img_icon leaf_icon"></em>
                      {fliterByType['4'] && fliterByType['4'].text
                        ? fliterByType['4'].text
                        : $intl.get('topContacts')}
                    </li>
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>
        {/* 组织架构 */}
        <div className={`orgShowConOut flex column ${orgShowObj.isShow ? '' : 'forcedHide'}`}>
          <span
            className="backOrgBtn"
            onClick={() => {
              setOrgShowObj({
                isShow: false,
                showType: 0,
              })
            }}
          >
            <LeftOutlined />
            {$intl.get('返回')}
          </span>
          {/* 组织架构 */}
          <OrgShowCon
            ref={orgConRef}
            param={{
              orgShow: orgShowObj.isShow,
              showType: orgShowObj.showType,
              options: options,
            }}
            action={{
              setSelData: onSetSelData,
              getSelData: getSelData,
              setOrgBotList: setOrgBotList,
            }}
          />
        </div>
      </div>
      <div
        className={`orgBotCon flex-1 flex column ${
          options.orgBotList instanceof Array && options.orgBotList.length > 0 ? '' : 'forcedHide'
        }`}
      >
        <header className="orgBotHeader">
          <p className={`bot_tit ${options.orgBotInfo.title ? '' : 'forcedHide'}`}>
            <span>{options.orgBotInfo.title}</span>
            <span style={{ color: '#ACADAF', fontWeight: 'normal' }}>{options.orgBotInfo.titleSub || ''}</span>
          </p>
          <p className={`bot_sub_tit ${options.orgBotInfo.subTit ? '' : 'forcedHide'}`}>
            {options.orgBotInfo.subTit}
          </p>
        </header>
        <ul className="orgBotList">
          {orgBotList &&
            orgBotList?.map((item: any, i: number) => {
              const userName = cutName(item.curName || '', 2, -1) || ''
              let showUserName = ''
              if (options.orgBotInfo.type == 'joinTeam') {
                showUserName = $intl.get('personInCharge') + ':' + item.curName
              } else {
                showUserName = item.curName || ''
              }

              const codeText = item.codeList && item.codeList.length > 0 ? item.codeList.join('、') : ''

              return (
                <li key={i} className="flex between center-v">
                  <div className="show_left flex center-v overflow_hidden">
                    <Avatar src={item.profile || ''} className="showHead flex_shrink_0">
                      {userName}
                    </Avatar>
                    <div className="flex column">
                      <span className="my_ellipsis">{item.cmyName || ''}</span>
                      <span className="my_ellipsis">{showUserName}</span>
                    </div>
                    {codeText && (
                      <span className="my_ellipsis" style={{ color: '#9A9AA2', marginLeft: 8 }}>
                        {codeText}
                      </span>
                    )}
                  </div>
                  <div className="show_right">
                    {options.checkboxType == 'radio' ? (
                      <Radio
                        value={item.curId}
                        checked={item.checked}
                        disabled={item.disabled || false}
                        onChange={(e: any) => {
                          e.stopPropagation()
                          onBotMemberChange(e, item)
                        }}
                      ></Radio>
                    ) : (
                      <Checkbox
                        value={item.curId}
                        checked={item.checked}
                        disabled={item.disabled || false}
                        onChange={(e: any) => {
                          e.stopPropagation()
                          onBotMemberChange(e, item)
                        }}
                      ></Checkbox>
                    )}
                  </div>
                </li>
              )
            })}
        </ul>
      </div>
    </div>
  )
})
// 记录树形结构展开节点
let treeExpandedKeys: any = []
/**
 * 根据选中类型展示内容组件
 */
let checkableType: Array<number> = []
export const OrgShowCon = React.forwardRef((props: { ref?: any; param: any; action: any }, ref) => {
  // 弹框上下文数据
  const modalContextObj: any = useContext(modalContext)
  // 继承父组件参数
  const ptParam = props.param || {}
  // 继承的父组件方法
  const ptAction = props.action || {}
  // 继承的options参数
  const options = props.param.options || {}
  // 组织架构树
  // const [treeData, setTreeData] = useState<any>([])
  const [treeData, setTreeData] = useState<any>({
    orgData: [],
    expandedKeys: [],
  })
  const [checkedKeys, setCheckedKeys] = useState<any>([])
  // 企业部门树展开的节点
  // const [cmyExpandedKeys, setCmyExpandedKeys] = useState<any>([])
  // 常用联系人
  const [contactsData, setContactsData] = useState<any>([])
  // 按角色选择
  // const [roleOrgData, setRoleOrgData] = useState<any>([])
  const [roleOrgInfo, setRoleOrgInfo] = useState<any>({
    orgData: [],
    expandedKeys: [],
  })
  const [roleCheckedKeys, setRoleCheckedKeys] = useState<any>([])

  // checkable 或单选状态下节点选择是否完全受控（为true父子节点选中状态不再关联）
  let checkStrictly = false
  if (options.checkableType || options.checkboxType == 'radio') {
    checkStrictly = true
  }

  // 记录选中的数据
  const selectData: any = []
  // ***********************暴露给父组件的方法 start**************************//
  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(ref, () => ({
    // 设置树形结构数据
    setTreeData: (data: any) => {
      setTreeData(data)
    },
    /**
     * 点击确定后返回给父元素的选中数据
     */
    getSelData: () => {
      return selectData
    },
    // 按类型查询第一层组织架构树
    findByType: (type: number, paramObj: any, attachObj: { checkableType: Array<number> }) => {
      checkableType = attachObj.checkableType || []
      findByType(type, paramObj)
    },
    /**
     * 按类型刷新左侧
     */
    delByType: (type: number, paramObj: any) => {
      delByType(type, paramObj)
    },
    // 刷新常用联系人数据选择状态
    setContactsDataChange: (checked: boolean, curId: any) => {
      if (contactsData.length === 0) return
      for (const i in contactsData) {
        if (contactsData[i].contactsUser == curId) {
          contactsData[i].checked = checked
        }
      }
      setContactsData([...contactsData])
    },
  }))
  // ***********************暴露给父组件的方法 end**************************//
  /**
   * 按类型筛选
   * @param type 组织架构展示类型：0按组织架构 1按角色 2按第一层部门 3常用联系人
   */
  const findByType = (type: number, paramObj: any) => {
    switch (type) {
      case 1: //企业组织架构
      case 3: //首层部门组织架构
        findOrgTree(paramObj)
        break
      case 2: //角色组织架构
        findRoleOrg(paramObj)
        break
      case 4: //常用联系人
        findContacts(paramObj)
        break
      default:
        break
    }
  }

  /**
   * 按类型删除和刷新左侧组织架构数据选中状态
   * @param type 组织架构展示类型：1按组织架构 2按角色 3按第一层部门 4常用联系人
   */
  const delByType = (type: number, paramObj: any) => {
    if (options.orgBotInfo.type == 'report') {
      //任务干系人
      for (const i in options.orgBotList) {
        if (options.orgBotList[i].curId == paramObj.curId) {
          options.orgBotList[i].checked = false
        }
      }
    }
    switch (type) {
      case 2: //角色组织架构
        for (let i = 0; i < roleCheckedKeys.length; i++) {
          const thisTree = getTreeParam(roleCheckedKeys[i])
          if (thisTree.curId == paramObj.curId && thisTree.curType == paramObj.curType) {
            roleCheckedKeys.splice(i, 1)
            i--
          }
        }
        setRoleCheckedKeys([...roleCheckedKeys])
        break
      case 1: //企业组织架构
      case 3: //首层部门组织架构
        for (let i = 0; i < checkedKeys.length; i++) {
          const thisTree = getTreeParam(checkedKeys[i])
          if (thisTree.curId == paramObj.curId && thisTree.curType == paramObj.curType) {
            checkedKeys.splice(i, 1)
            i--
          }
          if (
            options.cascadeMember &&
            thisTree.curId == paramObj.parentId &&
            thisTree.curType == paramObj.parentType
          ) {
            checkedKeys.splice(i, 1)
            i--
          }
        }
        setCheckedKeys([...checkedKeys])
        break
      case 4: //常用联系人
        for (const i in contactsData) {
          if (contactsData[i].contactsUser == paramObj.curId) {
            contactsData[i].checked = false
          }
        }
        setContactsData([...contactsData])
        break
      default:
        break
    }
  }

  /**
   * 获取当前企业、部门、成员信息
   * nodeInfo 树结构当前节点组装key
   * parent：父级链信息
   */
  const getTreeParam = (nodeInfo: any, parent?: any) => {
    /**
     * getType: 保存当前选中类型 (2企业 3部门 31岗位)
     * curType：保存当前选中类型(2企业 3部门 31岗位)
     * curId:当前选中id
     * curName:当前选中名字
     * parentType：保存直属上级type
     * parentId:保存直属上级id
     * parentName:保存直属上级名字
     * cmyId：保存当前选中企业id
     * cmyName：保存当前选中企业id
     * deptId：选中部门id
     * roleId：选中岗位id
     */
    let curType = 0
    let curTypeName = ''
    let curId = ''
    let curName = ''
    let parentType = ''
    let parentId = ''
    let parentName = ''
    let cmyId = ''
    let cmyName = ''
    let deptId = ''
    let deptName = ''
    let roleId = ''
    let roleName = ''
    let characterId = '', //角色id
      characterName = '' //角色名
    let userId = '',
      userName = '',
      account = ''
    const params: any = nodeInfo
    if (params) {
      if (params.split('_')[2].indexOf('2') != -1 && params.split('_')[2].indexOf('##') == -1) {
        //选择企业
        cmyId = params.split('_')[1] // 保存企业id
        cmyName = params.split('_')[3] // 保存企业名
        curId = params.split('_')[1]
        curName = params.split('_')[3] //保存当前选中类型（企业/部门/岗位）
        curType = params.split('_')[2]
        curTypeName = params.split('_')[0]
      } else {
        const pArr = params.split('##')
        pArr.map((pitem: any, i: number) => {
          const infoArr = pitem.split('_')
          if (i == 0) {
            curId = pitem.split('_')[1]
            curName = pitem.split('_')[3] //保存当前选中类型（企业/部门/岗位）
            curType = pitem.split('_')[2]
            curTypeName = params.split('_')[0]
          }
          if (infoArr[0] == 'company') {
            cmyId = infoArr[1]
            cmyName = infoArr[3]
          } else if (infoArr[0] == 'parentId') {
            parentId = infoArr[1]
            parentName = infoArr[3]
            parentType = infoArr[2]
          } else if (infoArr[0] == 'role') {
            roleId = infoArr[1]
            roleName = infoArr[3]
          } else if (infoArr[0] == 'account') {
            //人员
            userId = infoArr[1]
            userName = infoArr[3]
            account = infoArr[4] || ''
          } else if (infoArr[0] == 'character') {
            //角色
            characterId = infoArr[1]
            characterName = infoArr[3]
          }
        })
      }
      curType = Number(curType)
      if (curType == 3) {
        deptId = curId
        deptName = curName
      } else if (curType == 31) {
        roleId = curId
        roleName = curName
      }
      // 查询父级信息里部门岗位的递归方法,已查到就不在往上级查询
      const findDeptRole = (parents: any) => {
        if (parents.type == 3 && !deptId && parents.id) {
          deptId = parents.id
          deptName = parents.name
        } else if (parents.type == 31) {
          roleId = parents.id
          roleName = parents.name
        }
        if (parents.parent) {
          findDeptRole(parents.parent)
        }
      }
      // 查询部门岗位
      if (parent) {
        findDeptRole(parent)
      }
    }

    return {
      curId: curId,
      curType: curType,
      curTypeName: curTypeName,
      curName: curName,
      parentId: parentId,
      parentName: parentName,
      parentType: parentType,
      cmyId: cmyId,
      cmyName: cmyName,
      deptId: deptId,
      deptName: deptName,
      roleId: roleId,
      roleName: roleName,
      userId: userId,
      userName: userName,
      account: account,
      characterId: characterId,
      characterName: characterName,
    }
  }
  //   =============================查询方法=========================//
  /**
   * 查询组织架构第一层
   */
  const findOrgTree = (paramObj: {
    findId: string
    findType: number
    findName: string
    hasChild?: number
    teamId: string
    teamName: string
    findChild?: boolean
    treeKey?: any
    isSearch?: boolean
    key_words?: string
  }) => {
    treeExpandedKeys = []
    const defaultLevel = options.defaultLevel
    let param: any = {
      id: paramObj.findId,
      type: paramObj.findType,
      teamId: paramObj.teamId,
      account: options.nowAccount,
      permissionType: options.permissionType,
      isQueryAll: options.isQueryAll ? 1 : 0,
      inMyself: 1, //是否包含自己
      notAccount: options.notAccount,
      defaultLevel: defaultLevel,
      view: '2#3#31#0#',
    }

    if (options.findType == 3) {
      param.view = '2#3#'
    } else if (options.findType == 31) {
      param.view = '2#3#31#'
    }
    let url = '/team/permission/findEnterpriseTree'
    if (options.isOuterSystem === 1) {
      //审批请求外部数据
      param = {
        approvalId: options.approvalObj.approvalId || null,
        eventId: options.approvalObj.eventId,
        teamId: paramObj.teamId,
        userAccount: options.nowAccount,
        uuid: options.approvalObj.uuid,
        elementType: options.approvalObj.elementType,
      }
      // if (paramObj.isSearch && paramObj.key_words != '') {
      //   param.key_words = paramObj.key_words
      // }
      url = '/approval/businessSystem/outerSystemData'
    }
    requestApi({
      url: url,
      param: param,
      json: options.isOuterSystem === 1 ? false : true,
      setLoadState: modalContextObj.setLoading,
    }).then(res => {
      if (res.success) {
        const selData = ptAction.getSelData()
        // 默认展开的节点
        const expandedKeys: any = []
        // 默认选中的节点
        const selectKeys: any = []
        let getData: any = []
        // 企业信息
        let teamObj = {}
        if (options.isOuterSystem === 1) {
          const getObj = res.data.data.enterpriseTreeModel || {}
          //外部数据
          getData = [res.data.data.enterpriseTreeModel || {}]
          teamObj = {
            teamId: getObj.id,
            teamName: getObj.name,
          }
        } else {
          if (paramObj.findType == 2) {
            const getObj = res.data.data || {}
            getData = [res.data.data || {}]
            teamObj = {
              teamId: getObj.id,
              teamName: getObj.name,
            }
          } else {
            const childs = res.data.data.childs || []
            getData = [
              {
                id: paramObj.findId,
                name: paramObj.findName,
                type: paramObj.findType,
                hasChild: paramObj.hasChild,
                childs: childs,
              },
            ]
            teamObj = {
              teamId: paramObj.teamId,
              teamName: paramObj.teamName,
            }
          }
        }

        memberRenderTreeData(
          {
            array: getData,
            idKey: 'id',
            nameKey: 'name',
            hasChildKey: 'hasChild',
          },
          {
            findType: '0',
            teamObj: teamObj,
            options: options,
            checkedKeys: selectKeys,
            selectData: selData,
            expandedKeys: expandedKeys,
          }
        )
        setTreeData({
          orgData: [...getData],
          expandedKeys: expandedKeys,
        })
        // 更新单复选框选中状态
        setCheckedKeys([...selectKeys])
      }
    })
  }
  // 点击查询组织架构子级
  const queryTreeChild = (treeNode: any, resolve?: () => void) => {
    const treeInfo: any = getTreeParam(treeNode.key, treeNode.parent)
    const param = {
      id: treeInfo.curId,
      type: treeInfo.curType,
      teamId: treeInfo.cmyId,
      account: options.nowAccount,
      permissionType: options.permissionType,
      isQueryAll: options.isQueryAll ? 1 : 0,
      inMyself: 1,
      notAccount: options.notAccount,
      defaultLevel: 1,
    }
    requestApi({
      url: '/team/permission/findEnterpriseTree',
      param: param,
      json: true,
    }).then(res => {
      if (res.success) {
        const selData = ptAction.getSelData()
        const childData = res.data.data.childs || []
        memberRenderTreeData(
          {
            array: childData,
            idKey: 'id',
            nameKey: 'name',
            hasChildKey: 'hasChild',
            id: treeInfo.curId,
            name: treeInfo.curName,
            type: treeInfo.curType,
          },

          {
            findType: '0',
            teamObj: {
              teamId: treeInfo.cmyId,
              teamName: treeInfo.cmyName,
            },
            options: options,
            checkedKeys: checkedKeys,
            selectData: selData,
            parent: {
              id: treeNode.id,
              name: treeNode.name,
              type: treeNode.type,
              parent: treeNode.parent,
            },
          }
        )
        const setData = setTreeChild(treeData.orgData, treeNode.key, childData)
        // 重新设置 expandedKeys
        setTimeout(() => {
          setTreeData({
            ...treeData,
            orgData: [...setData],
            expandedKeys: [...treeExpandedKeys],
          })
        }, 300)
        // setTreeData([...setData])
        // 更新单复选框选中状态
        setCheckedKeys([...checkedKeys])
        if (resolve) {
          resolve()
        }
      }
    })
  }
  // =======================树形组件事件======================//
  /**
   * 添加子级到当前点击的树节点中
   * @param list 组织架构树数据
   * @param key 当前点击的节点key值
   * @param children 要添加的子级数据
   */
  const setTreeChild = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] => {
    return list.map(node => {
      if (node.key === key) {
        // node.children = children
        return {
          ...node,
          children: children,
        }
      } else if (node.children) {
        return {
          ...node,
          children: setTreeChild(node.children, key, children),
        }
      }
      return node
    })
  }

  /**
   * 点击展开按钮加载子节点时
   * @param treeNode 当前点击的树节点
   */
  const onLoadData = (treeNode: any): Promise<void> => {
    return new Promise(resolve => {
      if (treeNode.children && treeNode.children.length > 0) {
        resolve()
        return
      }
      // const treeInfo = getTreeParam(treeNode.key)
      // findOrgTree({
      //   findId: treeInfo.curId,
      //   findName: treeInfo.curName,
      //   findType: 3,
      //   teamId: treeInfo.cmyId,
      //   teamName: treeInfo.cmyName,
      //   findChild: true,
      //   treeKey: treeNode.key,
      // })
      queryTreeChild(treeNode, resolve)
    })
  }
  /**
   * 点击组织架构展开节点
   * @param checkedKeys
   * @param e
   * @param attachInfo
   */
  const onExpandCmy = (expandedKeys: any, e: { expanded: boolean; node: any }, type: string | number) => {
    treeExpandedKeys = [...expandedKeys]
    // const getExpandedKeys = expandedKeys
    // tree不使用expandedKeys时需要注释部分
    // if (e.expanded) {
    //   getExpandedKeys.push(e.node.key)
    // } else {
    //   for (const i in getExpandedKeys) {
    //     if (getExpandedKeys[i] == e.node.key) {
    //       getExpandedKeys.splice(i, 1)
    //       break
    //     }
    //   }
    // }
    // setCmyExpandedKeys([...getExpandedKeys])
    // 角色
    if (type == 'character') {
      setRoleOrgInfo({
        ...roleOrgInfo,
        expandedKeys: [...expandedKeys],
      })
    } else {
      setTreeData({
        ...treeData,
        expandedKeys: [...expandedKeys],
      })
    }
  }
  /**
   * 递归查询满足的key值并存取
   * @param dataList
   * @param findId
   * @param findType
   * @param myCheckedKeys
   */
  const findNextsKey = (dataList: any, findId: string, findType: number, myCheckedKeys: any) => {
    // 存取所有被选中成员
    dataList.map((titem: any) => {
      if (titem.id == findId && titem.type == findType && !myCheckedKeys.includes(titem.key)) {
        myCheckedKeys.push(titem.key)
      }
      if (titem.children) {
        findNextsKey(titem.children || [], findId, findType, myCheckedKeys)
      }
    })
  }

  /**
   * 企业部门组织架构点击复选框触发
   * @param treeNode 当前点击的树节点
   */
  const onCheck = (checkedKeys: any, e: any, attachInfo: { source: string; preCheckedKeys: any }) => {
    let selData = ptAction.getSelData()
    const checkedNode: any = e.node
    // 单/复选框选中的节点key
    let myCheckedKeys: any = []
    // 单/复选框选中状态
    if (options.checkboxType == 'radio') {
      myCheckedKeys = [checkedNode.key]
    } else {
      myCheckedKeys = checkedKeys.checked
    }
    let checkedItem: any = {}
    let showName = ''

    // 级联选择人员时，排除掉checkedKeys中的部门岗位
    if (options.cascadeMember) {
      const newSelData: any = []
      // 选中人员
      if (e.checked) {
        checkedKeys.map((citem: any) => {
          const thisItem: any = getTreeParam(citem, checkedNode.parent)
          if (thisItem.curType == 0) {
            // 查找是否已经存在重复成员
            const isRepeat = findRepeatIndex({
              keyName: 'curId',
              keyVal: thisItem.curId,
              list: selData,
            })
            if (isRepeat == -1) {
              newSelData.push(thisItem)
            }
          }
        })
        // 存取所有被选中成员
        findNextsKey(treeData.orgData, e.node.id, e.node.type, myCheckedKeys)
      } else {
        //取消选中人员
        // 获取删除的人员
        const delKeys = attachInfo.preCheckedKeys.filter((d: any) => !checkedKeys.includes(d))
        for (let i = 0; i < selData.length; i++) {
          for (const d in delKeys) {
            const delItem: any = getTreeParam(delKeys[d])
            if (selData[i].curId == Number(delItem.curId)) {
              selData.splice(i, 1)
              i--
              break
            }
          }
        }
        // 删除所有取消选中成员
        for (let c = 0; c < myCheckedKeys.length; c++) {
          const item: any = getTreeParam(myCheckedKeys[c])
          if (item.curId == e.node.id) {
            myCheckedKeys.splice(c, 1)
            break
          }
        }
      }
      selData = [...selData, ...newSelData]
    } else {
      // useExternal判断是否父组件传入 多选check
      if (attachInfo.source == 'character' && !options.useExternal) {
        const treeInfo: any = getTreeParam(checkedNode.key)
        checkedItem = {
          curId: checkedNode.userId || '',
          curType: 0,
          curName: checkedNode.username || '',
          parentId: checkedNode.roleId,
          parentName: checkedNode.roleName,
          parentType: 31,
          cmyId: treeInfo.cmyId,
          cmyName: treeInfo.cmyName,
          deptId: checkedNode.deptId || '',
          deptName: checkedNode.deptName || '',
          roleId: checkedNode.roleId || '',
          roleName: checkedNode.roleName || '',
          account: checkedNode.account || '',
        }
        showName = `${checkedNode.deptName || checkedItem.cmyName}-${checkedNode.roleName}${
          checkedNode.username ? '-' : ''
        }${checkedNode.username || ''}`
      } else {
        checkedItem = getTreeParam(checkedNode.key, checkedNode.parent)
        if (checkedItem.parentId == checkedItem.cmyId && checkedItem.parentType == 2) {
          showName = `${checkedItem.cmyName}-${checkedItem.curName}`
        } else {
          showName = `${checkedItem.cmyName}-${checkedItem.parentName}-${checkedItem.curName}`
        }
      }

      checkedItem.showName = showName
      // 头像
      checkedItem.profile = checkedNode.profile || ''
      // =======单选=======//
      if (options.checkboxType == 'radio') {
        selData = [checkedItem]
      }
      // =======多选=======//
      else {
        if (e.checked) {
          selData.push(checkedItem)
          // 存取所有被选中成员
          findNextsKey(treeData.orgData, e.node.id, e.node.type, myCheckedKeys)
        } else {
          for (const i in selData) {
            if (selData[i].curId == checkedItem.curId) {
              selData.splice(i, 1)
              break
            }
          }
          // 删除所有取消选中成员
          for (let c = 0; c < myCheckedKeys.length; c++) {
            const item: any = getTreeParam(myCheckedKeys[c])
            if (item.curId == e.node.id) {
              myCheckedKeys.splice(c, 1)
              break
            }
          }
        }
      }
    }
    // 单/复选框选中状态
    // 更新单复选框选中状态
    // 按角色选择
    if (attachInfo.source == 'character') {
      setRoleCheckedKeys(myCheckedKeys)
    } else {
      setCheckedKeys(myCheckedKeys)
    }
    // 设置被选中数据
    ptAction.setSelData(selData, e.checked)
  }

  // *********************************常用联系人*********************************//
  /**
   * 查询常用联系人
   */
  const findContacts = (paramObj: { teamId: string }) => {
    const param: any = {
      teamId: paramObj.teamId,
      userId: options.nowUserId,
      type: options.findType,
      notInIds: [],
      notAccount: options.notAccount,
      notChildAccount: options.notChildAccount,
      onlyUser: options.contacts.onlyUser, //0不查岗位 1 查
      account: options.nowAccount,
      permissionType: options.permissionType,
    }
    if (options.contacts.notRole) {
      param.notRole = options.contacts.notRole
    }
    requestApi({
      url: '/team/teamUserInfo/findContacts',
      param: param,
      json: true,
    }).then(res => {
      if (res.success) {
        const dataList = res.data.dataList || []
        // 获取已被选中数据
        const selData = ptAction.getSelData()
        // 设置选中状态
        dataList.map((item: any) => {
          item.disabled = options.disableList.some((items: any) => {
            const $userId = items.userId ? items.userId : items.curId
            return $userId === item.contactsUser
          })
          selData.map((sitem: any) => {
            if (item.contactsUser == sitem.curId && item.contactsType == sitem.curType) {
              if (options.comMember == 'team') {
                if (item.contactsTeamId == sitem.cmyId) {
                  item.checked = true
                } else {
                  item.checked = false
                }
              } else {
                item.checked = true
              }
              if (sitem.disable) {
                item.disabled = true
              }
            }
          })
        })
        setContactsData(dataList)
      }
    })
  }

  /**
   * 常用联系人单/复选框
   * item当前所选数据
   * type:radio单选 checkbox复选框
   */
  const onContactsChange = ({ type, checked, item }: { type: string; checked: boolean; item: any }) => {
    const thisChecked = checked ? false : true
    let selData = ptAction.getSelData()
    let parentId = '',
      parentName = '',
      parentType = 3
    if (item.contactsType == 0) {
      parentId = item.contactsRoleId || ''
      parentName = item.contactsRoleName || ''
      parentType = 31
    } else if (item.contactsType == 31) {
      parentId = item.contactsDeptId || ''
      parentName = item.contactsDeptName || ''
      parentType = 3
    } else if (item.contactsType == 3) {
      parentId = item.contactsTeamId || ''
      parentName = item.contactsTeamName || ''
      parentType = 2
    }
    const checkedItem: any = {
      curId: item.contactsUser || '',
      curType: item.contactsType || 0,
      curName: item.contactsUsername || '',
      userId: item.contactsUser || '',
      userName: item.contactsUsername || '',
      account: item.contactsAccount || '',
      parentId: parentId,
      parentName: parentName,
      parentType: parentType,
      cmyId: item.contactsTeamId,
      cmyName: item.contactsTeamName,
      deptId: item.contactsDeptId || '',
      deptName: item.contactsDeptName || '',
      roleId: item.contactsRoleId || '',
      roleName: item.contactsRoleName || '',
      profile: item.profile || '',
    }
    let showName = ''
    if (checkedItem.parentId == checkedItem.cmyId && checkedItem.parentType == 2) {
      showName = `${checkedItem.cmyName}-${checkedItem.curName}`
    } else {
      showName = `${checkedItem.cmyName}-${checkedItem.parentName}-${checkedItem.curName}`
    }
    checkedItem.showName = showName
    if (type == 'radio') {
      selData = [checkedItem]
      // 设置单选框选中状态
      for (const i in contactsData) {
        if (contactsData[i].contactsUser == checkedItem.curId) {
          contactsData[i].checked = true
        } else {
          contactsData[i].checked = false
        }
      }
    } else {
      if (thisChecked) {
        selData.push(checkedItem)
      } else {
        for (const i in selData) {
          if (selData[i].curId == checkedItem.curId) {
            selData.splice(i, 1)
            break
          }
        }
      }
      // 设置复选框框选中状态
      for (const i in contactsData) {
        if (contactsData[i].contactsUser == checkedItem.curId) {
          contactsData[i].checked = thisChecked
        }
      }
      // 设置任务干系人被选中数据
      if (options.orgBotList) {
        for (const i in options.orgBotList) {
          if (options.orgBotList[i].curId == checkedItem.curId) {
            options.orgBotList[i].checked = thisChecked
          }
        }
      }
    }

    setContactsData([...contactsData])
    // 设置被选中数据
    ptAction.setSelData(selData, thisChecked)
    // 刷新任务干系人选择状态
    options.orgBotList && ptAction.setOrgBotList([...options.orgBotList])
  }

  // *********************************按角色选择********** **************************//
  /**
   * 角色组织架构
   * @param paramObj
   */
  const findRoleOrg = (paramObj: { teamId: string; teamName: string }) => {
    treeExpandedKeys = []
    const param: any = {
      teamId: paramObj.teamId,
      account: options.nowAccount,
      permissionType: options.permissionType,
    }
    requestApi({
      url: '/team/enterpriseRole/findRolesByPermission',
      param: param,
      setLoadState: modalContextObj.setLoading,
    }).then(res => {
      if (res.success) {
        const selData = ptAction.getSelData()
        const getData = res.data.dataList || []
        // 默认展开的节点
        const expandedKeys: any = []
        const teamObj = {
          teamId: paramObj.teamId,
          teamName: paramObj.teamName,
        }
        memberRenderTreeData(
          {
            array: getData,
            idKey: 'id',
            nameKey: 'roleName',
            hasChildKey: 'userNum',
            // 父级信息
            id: paramObj.teamId,
            name: paramObj.teamName,
            type: 2,
          },
          {
            findType: options.findType,
            teamObj: teamObj,
            options: options,
            findByType: 'character',
            propType: 4,
            checkedKeys: roleCheckedKeys,
            selectData: selData,
            expandedKeys: expandedKeys,
          }
        )
        setRoleOrgInfo({
          orgData: getData,
        })
        // 更新单复选框选中状态
        setCheckedKeys([...roleCheckedKeys])
        // 初始加载时设置默认展开节点
        // setCmyExpandedKeys(expandedKeys)
      }
    })
  }

  // 点击查询组织架构子级
  const queryRoleTreeChild = (treeNode: any, resolve?: () => void) => {
    // 获取当前节点信息
    const treeInfo: any = getTreeParam(treeNode.key)
    const param: any = {
      roleId: treeInfo.curId,
      account: options.nowAccount,
      permissionType: options.permissionType,
    }
    requestApi({
      url: '/team/enterpriseRole/findRolePermissionUsers',
      param: param,
    }).then(res => {
      if (res.success) {
        const selData = ptAction.getSelData()
        const childData = res.data.dataList || []
        for (const i in childData) {
          if (!childData[i].username) {
            childData.splice(i, 1)
            break
          }
        }
        memberRenderTreeData(
          {
            array: childData,
            idKey: 'userId',
            nameKey: 'username',
            hasChildKey: 'userNum',
            // 父级信息
            id: treeInfo.curId,
            name: treeInfo.curName,
            type: treeInfo.curType,
          },
          {
            findType: options.findType,
            teamObj: {
              teamId: treeInfo.cmyId,
              teamName: treeInfo.cmyName,
            },
            options: options,
            findByType: 'character',
            propType: 0,
            checkedKeys: roleCheckedKeys,
            selectData: selData,
          }
        )

        const setData = setTreeChild(roleOrgInfo.orgData, treeNode.key, childData)
        // setRoleOrgData([...setData])
        setTimeout(() => {
          setRoleOrgInfo({
            ...roleOrgInfo,
            orgData: [...setData],
            expandedKeys: [...treeExpandedKeys],
          })
        }, 300)
        // 更新单复选框选中状态
        setRoleCheckedKeys([...roleCheckedKeys])
        if (resolve) {
          resolve()
        }
      }
    })
  }
  /**
   * 点击展开按钮加载子节点时
   * @param treeNode 当前点击的树节点
   */
  const onRoleOrgLoadData = (treeNode: any): Promise<void> => {
    return new Promise(resolve => {
      if (treeNode.children && treeNode.children.length > 0) {
        resolve()
        return
      }
      queryRoleTreeChild(treeNode, resolve)
    })
  }

  //文案修改
  let showNoneTxt = $intl.get('contacts')
  if (options.findType == '3') {
    showNoneTxt = $intl.get('Department')
  } else if (options.findType == '31') {
    showNoneTxt = $intl.get('Station')
  }

  return (
    <div className={`orgShowCon flex-1 ${options.checkboxType == 'radio' ? 'orgRadio' : ''}`}>
      {/* 企业部门组织架构展示 */}
      {ptParam.showType == 1 || ptParam.showType == 3 ? (
        <Tree
          multiple
          checkable
          // selectable={false}
          loadData={onLoadData}
          treeData={treeData.orgData}
          checkedKeys={checkedKeys}
          onExpand={(expKeys: any, e: any) => {
            onExpandCmy(expKeys, e, 'team')
          }}
          expandedKeys={treeData.expandedKeys}
          blockNode={true}
          checkStrictly={checkStrictly}
          onCheck={(onCheckedKeys: any, e: any) => {
            onCheck(onCheckedKeys, e, {
              source: 'base',
              preCheckedKeys: checkedKeys,
            })
          }}
          onSelect={(expKeys: any, e: any) => {
            onExpandCmy(expKeys, e, 'team')
          }}
          selectedKeys={treeData.expandedKeys ? treeData.expandedKeys : []}
        />
      ) : (
        ''
      )}
      {/* 常用联系人展示 */}
      {ptParam.showType == 4 ? (
        <ul className="contactsList">
          {contactsData.length > 0
            ? contactsData.map((item: any, i: number) => {
                let showName = ''
                //查询岗位时
                if (options.findType == 3) {
                  showName = `${item.contactsDeptName || item.contactsUsername}`
                } else if (options.findType == 31) {
                  showName = `${
                    item.contactsDeptName ? item.contactsDeptName + '-' : ''
                  }${item.contactsRoleName || item.contactsUsername}`
                } else if (options.contacts.onlyUser == 1) {
                  showName = `${item.contactsDeptName ? item.contactsDeptName + '-' : ''}${
                    item.contactsRoleName ? item.contactsRoleName + '-' : ''
                  }${item.contactsUsername}`
                } else {
                  showName = `${item.contactsDeptName ? item.contactsDeptName + '-' : ''}${
                    item.contactsUsername
                  }`
                }
                return (
                  <li
                    key={i}
                    className="flex between center-v"
                    onClick={() => {
                      // 判断是否能够修改
                      if (!item.disabled) {
                        onContactsChange({
                          type: options.checkboxType,
                          checked: item.checked,
                          item,
                        })
                      }
                    }}
                  >
                    <div className="show_left flex center-v overflow_hidden">
                      <em className="img_icon user_icon"></em>
                      <span className="my_ellipsis">{showName}</span>
                    </div>
                    <div className="show_right">
                      {options.checkboxType == 'radio' ? (
                        <Radio
                          value={item.id}
                          checked={item.checked}
                          disabled={item.disabled}
                          onClick={(e: any) => {
                            e.stopPropagation()
                          }}
                        ></Radio>
                      ) : (
                        <Checkbox value={item.id} checked={item.checked} disabled={item.disabled}></Checkbox>
                      )}
                    </div>
                  </li>
                )
              })
            : `${$intl.get('currentNoTopSome')}${showNoneTxt}`}
        </ul>
      ) : (
        ''
      )}
      {/* 按角色选择组织架构 */}
      {ptParam.showType == 2 ? (
        <Tree
          multiple
          checkable
          // selectable={false}
          loadData={onRoleOrgLoadData}
          treeData={roleOrgInfo.orgData}
          checkedKeys={roleCheckedKeys}
          blockNode={true}
          checkStrictly={checkStrictly}
          onCheck={(checkedKeys: any, e: any) => {
            onCheck(checkedKeys, e, {
              source: 'character', //角色
              preCheckedKeys: roleCheckedKeys,
            })
          }}
          onExpand={(expKeys: any, e: any) => {
            onExpandCmy(expKeys, e, 'character')
          }}
          expandedKeys={roleOrgInfo.expandedKeys}
          onSelect={(expKeys: any, e: any) => {
            onExpandCmy(expKeys, e, 'character')
          }}
          selectedKeys={roleOrgInfo.expandedKeys ? roleOrgInfo.expandedKeys : []}
        />
      ) : (
        ''
      )}
    </div>
  )
})

/**
 * 搜索数据展示(下拉展示)
 */
export const SearchContentDrop = React.forwardRef(
  (
    {
      options,
      onSetSelData,
      companyList,
      getSelData,
    }: { options: any; onSetSelData: any; companyList: any; getSelData: any; ref: any },
    ref
  ) => {
    // //   所有企业数据
    const [searchList, setSearchList] = useState<any>([])
    // 搜索类型 0部门 1成员
    const [searchCode, setSearchCode] = useState(1)
    // 搜索菜单显示
    const [searchVisible, searchVisibleChange] = useState(false)
    // 搜索关键字
    let searchVal = ''
    // 搜索导航列表
    const navListInit = [
      {
        active: true,
        name: $intl.get('Members'),
        code: 1,
      },
    ]
    const [navList, setNavList] = useState(navListInit)

    useEffect(() => {
      if (options.visible) {
        // 是否有部门导航
        if (options.findType == 3 || (options.checkableType && options.checkableType.includes(3))) {
          navListInit.unshift({
            active: true,
            name: $intl.get('Department'),
            code: 0,
          })
          navListInit[1].active = false
          setSearchCode(0)
        }
      }
    }, [options.visible])

    /**
     * 选中搜索选项
     * type0部门 1成员
     */
    const searchItemSure = (checkedNode: any) => {
      const type = searchCode
      // const myCheckedKeys=[]
      let selData = getSelData()
      const checkedItem: any = {
        curId: type == 1 ? checkedNode.userId : checkedNode.deptId,
        curType: type == 1 ? 0 : 3,
        curName: type == 1 ? checkedNode.username : checkedNode.deptName,
        account: checkedNode.account,
        userId: type == 1 ? checkedNode.userId : '',
        userName: type == 1 ? checkedNode.username : '',
        parentId: type == 1 ? checkedNode.roleId : checkedNode.teamId,
        parentName: type == 1 ? checkedNode.roleName : checkedNode.teamName,
        parentType: type == 1 ? 31 : 2,
        cmyId: checkedNode.teamId,
        cmyName: checkedNode.teamName,
        deptId: checkedNode.deptId || '',
        deptName: checkedNode.deptName || '',
        roleId: checkedNode.roleId || '',
        roleName: checkedNode.roleName || '',
        profile: checkedNode.profile || '',
      }
      // 单选按钮
      if (options.checkboxType == 'radio') {
        selData = [checkedItem]
      } else {
        selData.push(checkedItem)
      }
      // 更新单复选框选中状态
      // setCheckedKeys(myCheckedKeys)
      // 设置被选中数据
      onSetSelData(selData)
    }

    setSearchListRes = (data: any) => {
      setSearchList(data)
    }
    // ***********************暴露给父组件的方法 start**************************//
    useImperativeHandle(ref, () => ({
      // 设置选中数据
      setSearchList: (data: any) => {
        setSearchList(data)
      },
    }))
    // ***********************暴露给父组件的方法 end**************************//
    /**
     * 组织架构搜索列表展示
     */
    const SearchMenu = () => {
      /**
       * 切换导航菜单
       * @param index
       */
      const navChange = (index: number) => {
        let thisCode = 0
        navList.map((item: any, i: number) => {
          if (i == index) {
            item.active = true
            thisCode = item.code
          } else {
            item.active = false
          }
        })
        setSearchCode(thisCode)
        // 设置选中
        setNavList([...navList])
        // 查询列表数据
        findSearchList({
          keywords: searchVal,
          code: thisCode,
        })
      }
      return (
        <div className="selMemberOrgSearch">
          <ul className="searchHeader flex center-v">
            {navList.map((item: any, i: number) => {
              return (
                <li
                  key={i}
                  className={`${item.active ? 'active' : ''}`}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    navChange(i)
                  }}
                >
                  {item.name}
                </li>
              )
            })}
          </ul>
          <div className="searchList">
            {searchList.map((item: any, i: number) => {
              let belongInfo = item.teamName || ''
              if (searchCode == 1) {
                belongInfo = `${item.teamName ? item.teamName : ''}${item.deptName ? '-' + item.deptName : ''}${
                  item.roleName ? '-' + item.roleName : ''
                }`
              }
              const showUserName = cutName(item.username || '', 2, -1) || ''
              return (
                <div
                  key={i}
                  className="searchItem flex center-v"
                  onClick={() => {
                    searchItemSure(item)
                  }}
                >
                  {searchCode == 1 ? (
                    <Avatar className="oa-avatar" src={item.profile || ''}>
                      {showUserName}
                    </Avatar>
                  ) : (
                    ''
                  )}
                  <div className="right_cont flex-1">
                    <p className="user_info">{searchCode == 1 ? item.username : item.deptName}</p>
                    <p className="belong_info my_ellipsis">{belongInfo}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    /**
     * 组织架构搜索下拉
     */
    const searchMenuDrop = () => {
      return <SearchMenu />
    }
    /**
     * 搜索
     */
    const findSearchList = (paramObj: { keywords: string; teamIds?: any; code?: number }) => {
      const findCode = paramObj.code != undefined ? paramObj.code : searchCode
      // 搜索部门
      let url = '/team/permission/findAuthDepts'
      const param: any = {
        account: $store.getState().nowAccount,
        permissionType: options.permissionType,
        keywords: paramObj.keywords,
      }
      // 搜索成员
      if (findCode == 1) {
        url = '/team/permission/findAuthUsers'
        const teamIds: any = []
        companyList &&
          companyList.map((tItem: any) => {
            teamIds.push(tItem.id)
          })
        param.teamIds = teamIds
      } else if (companyList.length == 1) {
        param.teamId = companyList[0].id
      }
      requestApi({
        url: url,
        param: param,
        json: findCode == 1 ? true : false,
      }).then(res => {
        if (res.success) {
          const dataList = res.data.dataList || []
          setSearchListRes([...dataList])
        }
      })
    }
    //文案修改
    let showNoneTxt = $intl.get('membersOfSearch')
    if (options.findType == '3') {
      showNoneTxt = $intl.get('deptOfSearch')
    } else if (options.findType == '31') {
      showNoneTxt = $intl.get('stationOfSearch')
    }
    return (
      <Dropdown
        overlay={searchMenuDrop}
        trigger={['click']}
        placement="bottomRight"
        visible={searchVisible}
        onVisibleChange={searchVisibleChange}
      >
        <Input.Search
          placeholder={`${$intl.get('searchValue')}${showNoneTxt}`}
          className="baseSearch w100"
          onKeyUp={(e: any) => {
            searchVal = e.target.value
            if (e.keyCode == 13) {
              searchVisibleChange(true)
              findSearchList({
                keywords: e.target.value,
              })
            }
          }}
          onFocus={(e: any) => {
            findSearchList({
              keywords: e.target.value,
            })
          }}
          onSearch={(value: string) => {
            searchVisibleChange(true)
            findSearchList({
              keywords: value,
            })
          }}
        />
      </Dropdown>
    )
  }
)

/**
 * 搜索数据展示（覆盖组织架构展示方式）
 */
const SearchContent = React.forwardRef(
  (
    {
      options,
      onSetSelData,
      companyList,
      getSelData,
      setSearchShowPt,
      searchShow,
    }: {
      options: any
      onSetSelData: any
      companyList: any
      getSelData: any
      setSearchShowPt: any
      searchShow: boolean
      ref: any
      searchOuterSystemData: any
    },
    nowRef //解决forwardRef 必须接受两个参数 props and ref
  ) => {
    // 搜索类型整合
    const searchTypes = options.checkableType ? [...options.checkableType] : []
    if (!options.checkableType.includes(options.findType)) {
      searchTypes.push(options.findType)
    }
    const removeI = searchTypes.indexOf(2)
    if (removeI != -1) {
      searchTypes.splice(removeI, 1)
    }
    // ======================state状态=================//
    // 搜索框
    const searchRef = useRef<any>(null)
    // 搜索数据
    const [searchState, setSearchState] = useState<{
      deptList: any
      roleList?: any
      memberList: any
    }>({
      deptList: [],
      roleList: [],
      memberList: [],
    })

    /**
     * 选中搜索选项
     * type0部门 1成员
     */
    const searchItemSure = (checkedNode: any, type: number) => {
      let selData = getSelData()
      let curId = checkedNode.userId
      let curName = checkedNode.username
      let parentId = checkedNode.roleId
      let parentName = checkedNode.roleName
      let parentType = 31
      if (type == 3) {
        curId = checkedNode.deptId
        curName = checkedNode.deptName
        parentId = checkedNode.teamId
        parentName = checkedNode.teamName
        parentType = 2
      } else if (type == 31) {
        curId = checkedNode.roleId
        curName = checkedNode.roleName
        parentId = checkedNode.deptId
        parentName = checkedNode.deptName
        parentType = 3
      }
      const checkedItem: any = {
        curId,
        curType: type,
        curName,
        account: checkedNode.account,
        userId: type == 0 ? checkedNode.userId : '',
        userName: type == 0 ? checkedNode.username : '',
        parentId,
        parentName,
        parentType,
        cmyId: checkedNode.teamId,
        cmyName: checkedNode.teamName,
        deptId: checkedNode.deptId || '',
        deptName: checkedNode.deptName || '',
        roleId: checkedNode.roleId || '',
        roleName: checkedNode.roleName || '',
        profile: checkedNode.profile || '',
      }
      // 单选按钮
      if (options.checkboxType == 'radio') {
        selData = [checkedItem]
      } else {
        selData.push(checkedItem)
      }
      // 设置被选中数据
      onSetSelData(removalSel(selData))
    }
    setSearchListRes = (data: any) => {
      setSearchState({
        ...searchState,
        memberList: data[0] || [],
        deptList: data[3] || [],
        roleList: data[31] || [],
      })
    }

    //去重
    const removalSel = (arr: any) => {
      const hash = {}
      const selectList = arr.reduce((preVal: any, curVal: any) => {
        hash[curVal.curId] ? '' : (hash[curVal.curId] = true && preVal.push(curVal))
        return preVal
      }, [])
      return selectList
    }
    /**
     * 搜索列表单行数据
     */
    const SearchItem = ({ item, showType }: { item: any; showType: number }) => {
      let userInfo = ''
      const belongInfo = `${item.teamName ? item.teamName : ''}${item.deptName ? '-' + item.deptName : ''}${
        item.roleName ? '-' + item.roleName : ''
      }`

      if (showType == 3) {
        userInfo = item.deptName
      } else if (showType == 31) {
        userInfo = item.roleName
      } else {
        userInfo = item.username
      }
      const avatarName = cutName(userInfo || '', 2, -1) || ''
      return (
        <div
          className="searchItem flex center-v"
          onClick={() => {
            // 置灰成员搜索不可以点击选择
            if (!options.disableList.some((items: any) => items.userId === item.userId)) {
              searchItemSure(item, showType)
            }
          }}
        >
          {searchTypes.includes(0) ? (
            <Avatar className="oa-avatar" src={item.profile || ''}>
              {avatarName}
            </Avatar>
          ) : (
            ''
          )}
          <div className="right_cont flex-1">
            <p className="user_info">{userInfo}</p>
            <p className="belong_info my_ellipsis">{belongInfo}</p>
          </div>
        </div>
      )
    }
    /**
     * 组织架构搜索列表展示
     */
    const SearchMenu = () => {
      const { nowUserId } = $store.getState()
      return (
        <div className={`selMemberOrgSearch ${searchShow ? '' : 'forcedHide'}`}>
          <div className={`searchTit ${searchTypes.includes(3) ? '' : 'forcedHide'}`}>部门</div>
          <div className={`searchList ${searchTypes.includes(3) ? '' : 'forcedHide'}`}>
            {searchState.deptList?.map((item: any, i: number) => {
              return <SearchItem key={i} item={item} showType={3} />
            })}
            {searchState.deptList.length == 0 ? (
              <NoneData
                searchValue={searchRef.current ? searchRef.current.state.value : ''}
                imgSrc={$tools.asAssetsPath(`/images/noData/no_task_org_child.png`)}
                imgStyle={{ width: 100, height: 100 }}
              />
            ) : (
              ''
            )}
          </div>
          <div className={`searchTit ${searchTypes.includes(31) ? '' : 'forcedHide'}`}>
            {$intl.get('Station')}
          </div>
          <div className={`searchList ${searchTypes.includes(31) ? '' : 'forcedHide'}`}>
            {searchState.roleList?.map((item: any, i: number) => {
              return <SearchItem key={i} item={item} showType={31} />
            })}
            {searchState.roleList.length == 0 ? (
              <NoneData
                searchValue={searchRef.current ? searchRef.current.state.value : ''}
                imgSrc={$tools.asAssetsPath(`/images/noData/no_task_org_child.png`)}
                imgStyle={{ width: 100, height: 100 }}
              />
            ) : (
              ''
            )}
          </div>
          <div className={`searchTit ${searchTypes.includes(0) ? '' : 'forcedHide'}`}>
            {$intl.get('Members')}
          </div>
          <div className={`searchList ${searchTypes.includes(0) ? '' : 'forcedHide'}`}>
            {searchState.memberList.map((item: any, i: number) => {
              // 过滤掉自己，修复自己转发自己的bug inMyself---true搜索不展示自己
              if ((options.inMyself && item.userId !== nowUserId) || !options.inMyself) {
                return <SearchItem key={i} item={item} showType={0} />
              }
            })}
            {searchState.memberList.length == 0 ? (
              <NoneData
                searchValue={searchRef.current ? searchRef.current.state.value : ''}
                imgSrc={$tools.asAssetsPath(`/images/noData/no_task_org_child.png`)}
                imgStyle={{ width: 100, height: 100 }}
              />
            ) : (
              ''
            )}
          </div>
        </div>
      )
    }
    /**
     * 搜索
     */
    const findSearchList = ({ keywords }: { keywords: string; teamIds?: any; code?: number }) => {
      const { nowUserId }: any = $store.getState()
      // 新版接口
      let url = '/team/permission/findAuthData'
      const teamIds: any = []
      companyList &&
        companyList.map((tItem: any) => {
          teamIds.push(tItem.id)
        })
      let param: any = {
        permissionType: options.permissionType,
        keywords: keywords,
        teamIds,
        userId: nowUserId,
        searchType: searchTypes,
      }
      if (options.isOuterSystem === 1) {
        //审批请求外部数据
        param = {
          approvalId: options.approvalObj.approvalId || null,
          eventId: options.approvalObj.eventId,
          teamId: options.allowTeamId ? options.allowTeamId[0] : '',
          userAccount: options.nowAccount,
          uuid: options.approvalObj.uuid,
          elementType: options.approvalObj.elementType,
          key_words: keywords,
        }
        url = '/approval/businessSystem/outerSystemData'
      }
      requestApi({
        url: url,
        param: param,
        json: options.isOuterSystem === 1 ? false : true,
      }).then((res: any) => {
        if (res.success) {
          const dataObj = res.data.data || []
          setSearchListRes(dataObj)
          if (keywords != '') {
            setSearchShowPt(true)
          } else {
            setSearchShowPt(false)
          }
        }
      })
    }
    /**
     * 获取搜索placeholder checkableType
     */
    const searchPlaceholder = (options: any) => {
      let text = ''
      if (options.checkableType.includes(3)) {
        text += $intl.get('deptOfSearch')
      }
      if (options.checkableType.includes(31)) {
        if (text) {
          text += '/' + $intl.get('Station')
        } else {
          text += $intl.get('stationOfSearch')
        }
      }
      if (options.checkableType.includes(0)) {
        if (text) {
          text += '/' + $intl.get('Members')
        } else {
          text += $intl.get('membersOfSearch')
        }
      }
      text = $intl.get('searchValue') + text
      return text
    }
    return (
      <>
        <Input
          ref={searchRef}
          placeholder={searchPlaceholder(options)}
          className="baseSearch radius16 w100"
          allowClear
          prefix={
            <SearchOutlined
              onClick={(e: any) => {
                e.stopPropagation()
                findSearchList({
                  keywords: searchRef.current.state.value,
                })
              }}
            />
          }
          onPressEnter={() => {
            findSearchList({
              keywords: searchRef.current.state.value,
            })
          }}
          onChange={(e: any) => {
            if (e.target.value == '') {
              findSearchList({
                keywords: e.target.value,
              })
            }
          }}
        />
        <SearchMenu />
      </>
    )
  }
)

/**
 * 右侧数据展示
 */
const RightContent = React.forwardRef(({ options, delData }: { options: any; delData: any; ref: any }, ref) => {
  // 记录选中数据
  const [selectData, setSelectData] = useState<any>([])
  /**
   * 查询头像
   */
  const findProfiles = () => {
    // 不查询头像
    if (options.noQueryProfile || options.sourceType == 'taskBelong') {
      setSelectData(options.selectList || [])
      return
    }
    const userIds: any = []
    options.selectList?.map((item: any) => {
      const type = item.curType != undefined ? item.curType : options.findType
      if (type == 0 && !item.profile) {
        userIds.push(item.curId)
      }
    })
    // 有反选的人员时查询头像
    if (userIds.length > 0) {
      findProfileApi({ userIds }).then((res: any) => {
        if (res) {
          const profiles = res.data.data || {}
          options.selectList.map((rItem: any) => {
            if (!rItem.profile && profiles[rItem.curId]) {
              rItem.profile = profiles[rItem.curId]
            }
          })
        }
        setSelectData(options.selectList || [])
      })
    } else {
      setSelectData(options.selectList || [])
    }
  }
  //   监听弹框显示状态
  useEffect(() => {
    if (options.visible) {
      // 初始右侧数据显示
      findProfiles()
    }
  }, [options.visible])
  // ***********************暴露给父组件的方法 start**************************//
  useImperativeHandle(ref, () => ({
    // 设置选中数据
    setSelectData: (data: any) => {
      let newData = [...data]
      // 去重处理:人员去重
      if (options.findType == 0) {
        newData = arrObjDuplicate(newData, 'curId')
      }
      setSelectData([...newData])
    },
    /**
     * 返回给父元素的选中数据
     */
    getSelectData: () => {
      return selectData
    },
  }))
  // ***********************暴露给父组件的方法 end**************************//

  return (
    <ul className="rigSelectData flex-1">
      {selectData &&
        selectData.map((item: any, i: number) => {
          // 右侧树显示
          const headName = cutName(item.curName || '', 2, -1) || ''
          let showName = item.curName || ''
          // 是否显示前缀
          if (options.showPrefix) {
            const prefix = options.showPrefix || {}
            if (item.parentId == item.cmyId && item.parentType == 2) {
              showName = `${prefix.company && item.cmyName ? item.cmyName + '-' : ''}${item.curName}`
            } else {
              showName = `${prefix.company && item.cmyName ? item.cmyName + '-' : ''}${
                (prefix.dept && item.parentName) || (prefix.role && item.parentName)
                  ? item.parentName + (item.curName ? '-' : '')
                  : ''
              }${item.curName}`
            }
          }

          let isDel: boolean = options.isDel
          if (item.disable) {
            isDel = false
          }
          let getTypeName = '个人目标'
          if (item.curType == 2) {
            getTypeName = '企业目标'
          } else if (item.curType == 3) {
            getTypeName = '部门目标 - ' + item.curName
          }
          return (
            <li key={i} className="flex between center-v">
              <div className="rowLeft flex center-v overflow_hidden">
                {[1].map(() => {
                  return (
                    <Avatar
                      src={item.profile}
                      key={i}
                      className="showHead flex_shrink_0"
                      size={options.addShowOkrText == 'okr' ? 34 : 32}
                    >
                      {headName}
                    </Avatar>
                  )
                })}
                {options.addShowOkrText == 'okr' ? (
                  <div style={{ display: 'flex', flexFlow: 'column' }}>
                    <span style={{ color: '#191F25', fontSize: '14px' }}>{getTypeName}</span>
                    <span className="my_ellipsis">{item.cmyName}</span>
                  </div>
                ) : (
                  <span className="my_ellipsis">{showName}</span>
                )}
              </div>
              <div className="rowRight">
                <em
                  className={`img_icon del_icon ${isDel ? '' : 'forcedHide'}`}
                  onClick={(e: any) => {
                    delData(e, item, i)
                  }}
                ></em>
              </div>
            </li>
          )
        })}
    </ul>
  )
})

/**
 * 检查是否有单/复选框
 */
const setCheckable = (options: any, itemType: number): boolean => {
  let checkable = false
  if (options.cascadeMember) {
    checkable = true
  } else if (checkableType && checkableType.length > 0) {
    if (checkableType.includes(itemType)) {
      checkable = true
    }
  } else if (options.findType == 0) {
    if (itemType == 0) {
      checkable = true
    } else {
      checkable = false
    }
  }
  // 判断是否父组件传入 多选check
  if (options.useExternal && itemType != 2) {
    checkable = true
  }
  return checkable
}
/**
 * 选择人员插件组织架构树更改数据为Tree可渲染数据格式
 * 有些接口中返回的id是rid，所以定义一个idKey nameKey便于不同键名的值的获取
 * @param  data
 * data{
 * idKey:key值键名，
 * nameKey：name值键名，
 * }
 * attachInfo:{
 * teamObj:企业数据,
 * findType:查询类型 0默认只可选中人员
 * findByType: 'role'：按角色查询 的组织架构，默认按企业部门组织架构
 * propType:属性类型 0成员 1角色（findByType=='role'时使用）
 * checkedKeys 单复选框选中状态
 * }
 */
export const memberRenderTreeData = (
  data: {
    idKey: string //key值键名
    nameKey: string //name值键名
    hasChildKey: string //是否有子级
    array: any
    id?: string //父级id
    name?: string //父级名字
    type?: number //父级类型
  },
  attachInfo: {
    findType: string
    teamObj?: { teamId?: any; teamName?: any }
    options: any
    findByType?: string
    propType?: number
    checkedKeys: any
    selectData: any
    expandedKeys?: any
    parent?: any //父级链条信息
    // checkableType?: Array<number>
  }
) => {
  // 获取外部传入参数
  const options = attachInfo.options || {}
  const { disableList } = options
  // 组织架构选中的key列表
  const checkedKeys = attachInfo.checkedKeys || []
  // 右侧展示数据列表
  const selectData = attachInfo.selectData || []
  // 组织架构展开的key列表
  const expandedKeys = attachInfo.expandedKeys || []
  let cmyObj: any = attachInfo.teamObj ? attachInfo.teamObj : {}
  // 可添加单复选框的类型
  // const checkableType = attachInfo.checkableType || []
  //父级链条信息
  const preParent: any = attachInfo.parent ? attachInfo.parent : null
  if (data.array && data.array.length > 0) {
    for (const i in data.array) {
      const item: any = data.array[i]
      const thisId = item[data.idKey]
      const thisName = item[data.nameKey]
      let account = ''
      let thisType: any = 0
      let typeName = ''
      let showName = thisName
      let thisNodeId = ''
      let thisText: any = showName
      // 名字左侧的图标
      let nameLeftIcon: any
      // ====character为角色查询标识====//
      if (attachInfo.findByType != 'character') {
        thisType = item.type
        let roleInfo = ''
        if (item.type == 0) {
          typeName = 'account_'
          showName = `${item.name || name}${item.roleName ? '-' + item.roleName : ''}`
          roleInfo = `##role_${item.roleId || ''}_31_${item.roleName || ''}`
        } else if (item.type == 3) {
          typeName = 'department_'
        } else {
          typeName = 'duties_'
        }
        if (item.type == 2) {
          //企业数据信息
          thisNodeId = `company_${thisId}_2_${thisName}`
          cmyObj = { teamId: thisId, teamName: thisName }
          //企业根节点
          nameLeftIcon = <span className="img_icon nameLeftIcon root"></span>
        } else {
          if (item.type == 0) {
            account = `_${item.account || ''}`
          }
          // 上一层data中id为本层的父级id
          thisNodeId = `${typeName}${thisId}_${item.type}_${thisName}${account}##parentId_${data.id ||
            ''}_${data.type || ''}_${data.name || ''}##company_${cmyObj.teamId}_2_${
            cmyObj.teamName
          }${roleInfo}_${i}`
          nameLeftIcon = <span className="img_icon nameLeftIcon child"></span>
        }
        //   是否可选中单/复选框
        const checkable = setCheckable(options, item.type)
        item.checkable = checkable

        thisText = showName
      } else {
        thisType = attachInfo.propType
        //角色查询
        if (attachInfo.propType == 0) {
          //成员
          typeName = 'account_'
          nameLeftIcon = <span className="img_icon nameLeftIcon root"></span>
          let cutUser = thisName
          if (thisName.length > 2) {
            cutUser = cutName(thisName || '', 2, -1) || ''
          }
          thisText = (
            <div className="org_tree_row flex center-v between">
              <div className="row_left flex center-v">
                <Avatar className="user_head" src={item.profile || ''}>
                  {cutUser}
                </Avatar>
                <span className="org_tree_text my_ellipsis">{thisName}</span>
              </div>
            </div>
          )
        } else if (attachInfo.propType == 4) {
          //角色
          typeName = 'character_'
          nameLeftIcon = <span className="img_icon nameLeftIcon child"></span>
        }
        if (attachInfo.propType == 0) {
          account = `_${item.account || ''}`
        }
        thisNodeId = `${typeName}${thisId}_${attachInfo.propType}_${thisName}${account}##parentId_${data.id ||
          ''}_${data.type || ''}_${data.name || ''}##company_${cmyObj.teamId}_2_${cmyObj.teamName}_${i}`
        //   是否可选中单/复选框
        const checkable = setCheckable(options, attachInfo.propType || 0)
        item.checkable = checkable
      }
      //1 设置key和显示名
      item.key = thisNodeId
      item.title = thisText
      //2 设置父级链信息
      const thisInfo = {
        id: item.id,
        name: item.name,
        type: item.type,
      }
      item.cmyInfo = cmyObj
      let parent: any = {}
      if (item.type != 2) {
        // 设置当前节点的父级链（上级封装完成传来的即为本级父级链）
        item.parent = preParent
        // 传递给子级新的父级链
        parent = { ...thisInfo, parent: preParent }
      } else {
        // 企业是最高级，不设置当前父级链，只传递给子级新的父级链
        parent = thisInfo
      }
      const sItem: any = selectData.find((v: any) => {
        const type = v.curType != undefined ? v.curType : options.findType
        // 不同企业部门下同一个人员是否全选中
        if (!options.comMember || options.comMember == 'only') {
          const ptItem = item.parent ? item.parent : item
          return v.curId == thisId && type == thisType && v.parentId == ptItem.id
        } else if (options.comMember == 'team') {
          // 同企业下选中
          return v.curId == thisId && type == thisType && v.cmyId == item.cmyInfo?.teamId
        } else {
          return v.curId == thisId && type == thisType
        }
      })
      if (sItem) {
        if (!checkedKeys.includes(thisNodeId)) {
          checkedKeys.push(thisNodeId)
        }
        if (sItem.disable) {
          item.disableCheckbox = true
        }
      }
      // 3.2 获取置灰选中成员数据，设置置灰选中效果
      const dItem: any = disableList.find((v: any) => {
        const type = v.curType != undefined ? v.curType : options.findType
        return v.curId == thisId && type == thisType
      })
      if (dItem) {
        if (!checkedKeys.includes(thisNodeId)) {
          checkedKeys.push(thisNodeId)
        }
        item.disableCheckbox = true
      }
      // 4 存储展开的节点 之展开第一层
      if (item.childs && item.childs.length > 0 && !item.parent) {
        expandedKeys.push(item.key)
      }
      //   ======更新附属信息============//
      const attachObj = { ...attachInfo, ...{ teamObj: cmyObj }, parent: parent }
      if ((item.childs && item.childs.length > 0) || item[data.hasChildKey]) {
        item.icon = nameLeftIcon
        item.children = item.childs || []
        //存在子数组
        memberRenderTreeData(
          {
            array: item.children,
            idKey: data.idKey,
            nameKey: data.nameKey,
            hasChildKey: data.hasChildKey,
            id: thisId,
            name: thisName,
            type: item.type,
          },
          attachObj
        )
      } else {
        const nameLeftIcon = <span className="img_icon nameLeftIcon null"></span>
        item.icon = nameLeftIcon
        item.isLeaf = true
      }
    }
  }
}

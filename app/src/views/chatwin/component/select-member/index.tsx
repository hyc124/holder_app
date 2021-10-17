import React, { useState, useEffect, useImperativeHandle, useRef, Fragment } from 'react'
import { Avatar, Radio, Spin } from 'antd'
import { requestApi } from '../../../../common/js/ajax'
import { findAuthList, findProfileApi } from '../../../../common/js/api-com'
import { cutName, arrObjDuplicate } from '@/src/common/js/common'
import './org-modal.less'
import MemberOrgLeft from './MemberOrgLeft'
import Modal from 'antd/lib/modal/Modal'
import { findCompany } from './getData'

// 创建弹框上下文
export const modalContext = React.createContext({})

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
  orgBotList?: boolean | Array<SelectItem>
  disableList?: Array<SelectItem>
  onSure?: any
  onClose?: any
  comMember?: boolean
  isOuterSystem?: number // 为1时查询外部系统数据
  approvalObj?: { approvalId: any; eventId: number; uuid: string; elementType: string } //外部数据
  useExternal?: boolean //是否勾选上级元素 check选项情况
  chatDeptTeadIds?: Array<number>
}

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
 * 右侧数据展示
 */
const RightContent = React.forwardRef(({ options, delData }: { options: any; delData: any; ref: any }, ref) => {
  // 获取聊天室负责人
  const { roomManager } = $store.getState()
  // 记录选中数据
  const [selectData, setSelectData] = useState<any>([])
  // 选择企业模态框
  const [modalVisible, setModalVisible] = useState(false)
  // 企业列表
  const [companyList, setCompanyList] = useState<any[]>([])
  // 当前群主的企业
  const [belongCompany, setBelongCompany] = useState(0)
  /**
   * 查询头像
   */
  const findProfiles = () => {
    const userIds: any = []
    const dataList = options.selectList
    dataList?.forEach((item: any) => {
      const type = item.curType != undefined ? item.curType : options.findType
      if (type == 0 && !item.profile) {
        userIds.push(item.curId)
      }
      selectData.map((tItem: any) => {
        if (item.curId === tItem.curId) {
          item.cmyId = tItem.cmyId
          item.cmyName = tItem.cmyName
        }
      })
    })
    // 有反选的人员时查询头像
    if (userIds.length > 0) {
      findProfileApi({ userIds }).then((res: any) => {
        const profiles = res.data.data || {}
        dataList.map((rItem: any) => {
          if (!rItem.profile && profiles[rItem.curId]) {
            rItem.profile = profiles[rItem.curId]
          }
        })
      })
    }
    setSelectData(dataList || [])
  }

  // 监听弹框显示状态
  useEffect(() => {
    if (options.visible) {
      // 初始右侧数据显示
      findProfiles()
    }
  }, [options])

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
    // 返回给父元素的选中数据
    getSelectData: () => {
      return selectData
    },
  }))
  // ***********************暴露给父组件的方法 end**************************//

  const getCompanyList = () => {
    findCompany(options).then((resData: any) => {
      setModalVisible(true)
      setCompanyList(resData)
      setBelongCompany(selectData[0].cmyId)
    })
  }

  // 修改群主的企业
  const changeCmy = (e: any) => {
    const cmyId = e.target.value
    // const currentCmy = companyList.find(item => {
    //   return item.id === cmyId
    // })
    // if (currentCmy) {
    //   selectData.forEach((item: any) => {
    //     if (item.chatUserType === 0) {
    //       item.cmyId = currentCmy.id
    //       item.cmyName = currentCmy.shortName
    //     }
    //   })
    //   setSelectData(selectData)

    // }
    setBelongCompany(cmyId)
  }

  return (
    <Fragment>
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

            return (
              <li
                key={i}
                className="flex between center-v"
                style={{ cursor: item.curId == roomManager.userId ? 'default' : 'pointer' }}
              >
                <div className="rowLeft flex center-v overflow_hidden">
                  {/* 检查图片url是否有效 */}
                  {[1].map(() => {
                    return (
                      <Avatar src={item.profile} key={i} className="showHead flex_shrink_0">
                        {headName}
                      </Avatar>
                    )
                  })}
                  <div>
                    <span className="my_ellipsis">
                      {showName}
                      {item.curId == roomManager.userId && (
                        <span
                          style={{
                            color: '#FFAA00',
                            width: '30px',
                            height: '16px',
                            background: '#FFF6E1',
                            borderRadius: '2px',
                            textAlign: 'center',
                            marginLeft: '4px',
                            fontSize: '10px',
                          }}
                        >
                          群主
                        </span>
                      )}
                    </span>
                    <div>
                      {item.cmyName}
                      {options.sourceType !== 'chat_invit' && item.curId == defaults.nowUserId && (
                        <span className="change_cmy_icon" onClick={getCompanyList}></span>
                      )}
                    </div>
                  </div>
                </div>
                {item.chatUserType !== 0 && item.curId != defaults.nowUserId && (
                  <div className="rowRight">
                    <em
                      className={`img_icon del_icon ${isDel ? '' : 'forcedHide'}`}
                      onClick={(e: any) => {
                        delData(e, item, i)
                      }}
                    ></em>
                  </div>
                )}
              </li>
            )
          })}
      </ul>
      {modalVisible && (
        <Modal
          width={400}
          bodyStyle={{ height: '200px' }}
          title="选择企业身份"
          visible={modalVisible}
          centered
          onCancel={() => setModalVisible(false)}
          onOk={() => {
            const currentCmy = companyList.find(item => {
              return item.id === belongCompany
            })
            if (currentCmy) {
              selectData.forEach((item: any) => {
                if (item.chatUserType === 0) {
                  item.cmyId = currentCmy.id
                  item.cmyName = currentCmy.shortName
                }
              })
              setSelectData(selectData)
            }
            setModalVisible(false)
          }}
        >
          <Radio.Group
            onChange={e => changeCmy(e)}
            style={{ height: '100%', overflowY: 'auto' }}
            value={Number(belongCompany)}
          >
            {companyList.map(item => {
              return (
                <Radio key={item.id} style={{ display: 'block', marginBottom: '15px' }} value={item.id}>
                  {item.shortName}
                </Radio>
              )
            })}
          </Radio.Group>
        </Modal>
      )}
    </Fragment>
  )
})

/**
 * 选择人员或部门
 */
export const SelectMemberOrg = React.forwardRef((props: { param: PropParam; action?: any }, ref: any) => {
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
  // const action = props.action
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

  useImperativeHandle(ref, () => ({
    getDataTest: () => {
      const selectData = rigConRef.current.getSelectData()
      return selectData
    },
    saveContacts: () => {
      saveContacts()
    },
  }))

  useEffect(() => {
    if (options.visible) {
      async function findAuth() {
        authList = await findAuthList({
          typeId: options.allowTeamId ? options.allowTeamId[0] : '',
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

  // 设置右侧选中数据
  const handleSetSelectData = (list: any) => {
    rigConRef.current.setSelectData(list)
  }

  //   点击确认
  // const handleOk = () => {
  //   const selectData = rigConRef.current.getSelectData()
  //   if (options.sourceType === 'chat_invit') {
  //     if (options.title !== 'string') {
  //       const inputELe: any = document.getElementById('chatDiscussTitle')
  //       if (inputELe && !inputELe.value) {
  //         message.error($intl.get('inputSubjectTip'))
  //         return
  //       }
  //     }
  //     const result = selectData.filter((item: any) => {
  //       return item.curId !== $store.getState().nowUserId
  //     })
  //     if (!result.length) {
  //       message.error($intl.get('leastOtherMembersTip'))
  //       return
  //     }
  //   }
  //   action.setModalShow(false)
  //   saveContacts()
  //   if (action.onSure) {
  //     action.onSure(selectData, {
  //       sourceType: options.sourceType,
  //     })
  //   }
  //   if (options.onSure) {
  //     options.onSure(selectData, {
  //       sourceType: options.sourceType,
  //     })
  //   }
  // }
  //   点击取消
  // const handleCancel = () => {
  //   if (options.onClose) {
  //     options.onClose(false)
  //   }
  //   action.setModalShow(false)
  // }
  //   *************************************函数方法*******************************//

  /**
   * 设置保存选中的数据
   */
  const onSetSelData = (list: any) => {
    handleSetSelectData([...list])
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
    handleSetSelectData([...selectData])
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
      {/* <Modal
        className="baseModal selectMemberOrgModal"
        width={850}
        visible={visible}
        title={options.title}
        onOk={handleOk}
        onCancel={handleCancel}
        maskClosable={false}
        keyboard={false}
        footer={[
          <Button key="back" onClick={handleCancel}>
            {$intl.get('cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            {$intl.get('sure')}
          </Button>,
        ]}
      > */}
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
              authList={authList}
              handleSetSelectData={handleSetSelectData}
            />
            <div className="orgBodyRight  flex column">
              <div className="rigShowTit">{$intl.get('alwaysChoose')}</div>
              <RightContent ref={rigConRef} options={{ ...options }} delData={delData} />
            </div>
          </section>
        )}
      </Spin>
      {/* </Modal> */}
    </modalContext.Provider>
  )
})

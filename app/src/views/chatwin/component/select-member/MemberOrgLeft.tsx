import React, { useRef, useState, useEffect, useImperativeHandle } from 'react'
import { findAuthList, getAuthStatus } from '../../../../common/js/api-com'
import { Avatar, Radio, Checkbox } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { requestApi } from '../../../../common/js/ajax'
import SearchContent from './SearchContent'
import { cutName } from '@/src/common/js/common'
import OrgShowCon from './OrgShowCon'
import { defaults } from './index'

// 根据选中类型展示内容组件
let checkableType: Array<number> = []
interface MemberOrgLeftProps {
  handleSetSelectData: (list: any[]) => void
  authList: any
  ref?: any
  options?: any
  action: any
}
const MemberOrgLeft = React.forwardRef((props: MemberOrgLeftProps, ref) => {
  let authList = props.authList
  defaults.nowAccount = $store.getState().nowAccount
  defaults.nowUserName = $store.getState().nowUser
  defaults.nowUserId = $store.getState().nowUserId
  // 企业默认logo
  const defLogo = $tools.asAssetsPath('/images/common/company_default.png')
  // 继承的父组件方法
  const ptAction = props.action || {}
  // 继承的options参数
  const options = { ...defaults, ...props.options }
  const fliterByType = options.fliterByType
  const { onSetSelData, getSelData } = ptAction
  // 组件架构容器组件
  const orgConRef: any = useRef({})
  // 组织架构下方成员列表
  const [orgBotList, setOrgBotList] = useState<any>([])
  // 所有企业数据
  const [companyList, setCmyList] = useState<any>([])
  // 组织架构显示状态
  const [orgShowObj, setOrgShowObj] = useState({
    showType: 0, //组织架构类型：0根目录 1按组织架构 2按角色 3按第一层部门 4常用联系人
    isShow: false, //组织架构是否显示
  })
  // 搜索显示
  const [searchShow, setSearchShow] = useState<boolean>(false)
  // ***********************暴露给父组件的方法 start**************************//
  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(ref, () => ({
    // 按类型查询第一层组织架构树
    findByType: (type: number, paramObj: any, attachObj: { checkableType: Array<number> }) => {
      checkableType = attachObj.checkableType || []
      orgConRef.current.findByType(type, paramObj)
    },
    // 按类型刷新左侧
    delByType: (paramObj: any) => {
      orgConRef.current.delByType(orgShowObj.showType, paramObj)
      setOrgBotList([...orgBotList])
    },
  }))
  // ***********************暴露给父组件的方法 end**************************//
  /**
   * 点击筛选类型
   * code:筛选类型code： 1按组织架构 2按角色 3按第一层部门 4常用联系人
   * cmyItem:当前企业数据
   */
  const clickOrgType = (code: number, item: any) => {
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
      }
    } else if (code == 2 || code == 4) {
      //角色组织架构、常用联系人
      param = {
        teamId: item.id,
        teamName: item.shortName,
      }
    }
    // 编辑任务归属需要查询权限列表
    if (options.sourceType && options.sourceType.includes('taskBelong')) {
      const checkableType = [...options.checkableType]
      async function findAuth() {
        authList = await findAuthList({
          typeId: param.teamId,
          customAuthList: [],
        })
        const addOrgTask = getAuthStatus('taskOrgAdd', authList || []) //添加企业任务权限
        const addDeptTask = getAuthStatus('taskDeptAdd', authList || []) //添加部门任务权限
        if (!addOrgTask) {
          const index = checkableType.indexOf(2)
          if (index > -1) {
            checkableType.splice(index, 1)
          }
        }
        if (!addDeptTask) {
          const index = checkableType.indexOf(3)
          if (index > -1) {
            checkableType.splice(index, 1)
          }
        }
        orgConRef.current.findByType(code, param, {
          checkableType,
        })
      }
      findAuth()
    } else {
      orgConRef.current.findByType(code, param, {
        checkableType: options.checkableType,
      })
    }
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

  /**
   * 查询所有企业
   */
  const findCompany = (options: any, setCompanyList: any) => {
    console.log(options)
    const param: any = {
      username: options.nowAccount,
      userId: options.nowUserId,
      type: -1,
    }
    //沟通部门群添加群成员需要传递群主所对应得企业ID
    if (options.hasOwnProperty('chatDeptTeadIds')) {
      param.teamIds = options.chatDeptTeadIds
      param.type = 2
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
        // 沟通默认第一个企业下的数据为默认的群组的数据
        if (options.sourceType && options.sourceType.includes('chat_invit')) {
          const dataUser = [...options.selectList]
          dataUser.forEach((item: any) => {
            if (item.chatUserType === 0) {
              item.cmyId = allowTeams[0].id
              item.cmyName = allowTeams[0]?.shortName || allowTeams[0].name
            }
          })
          props.handleSetSelectData(dataUser)
        }
        setCompanyList(allowTeams)
      }
    })
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
      setOrgBotList([...orgBottomList])
      const setCompanyList = setCmyList
      findCompany(options, setCompanyList)
      setOrgShowObj({
        isShow: false,
        showType: 0,
      })
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
              authList={authList}
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
                        clickOrgType(1, item)
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
            checkableType={checkableType}
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

export default MemberOrgLeft

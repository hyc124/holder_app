import React, { useRef, useState } from 'react'
import { Avatar, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { requestApi } from '../../../../common/js/ajax'
import { cutName } from '@/src/common/js/common'
import NoneData from '../../../../components/none-data/none-data'
import { getAuthStatus } from '../../../../common/js/api-com'

interface SearchContentProps {
  options: any
  onSetSelData: any
  companyList: any
  getSelData: any
  setSearchShowPt: any
  searchShow: boolean
  ref: any
  authList: any
}

let setSearchListRes: any = null
/**
 * 搜索数据展示（覆盖组织架构展示方式）
 */
const SearchContent = React.forwardRef((props: SearchContentProps, ref) => {
  const { options, onSetSelData, companyList, getSelData, setSearchShowPt, searchShow, authList } = props
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
      if (options.sourceType && options.sourceType.includes('chat_invit')) {
        let isLeader = false
        selData.forEach((item: any, index: number) => {
          if (item.curId == curId) {
            isLeader = true
            selData[index] = checkedItem
          }
        })
        if (!isLeader) {
          selData.push(checkedItem)
        }
      } else {
        selData.push(checkedItem)
      }
    }
    // 设置被选中数据
    onSetSelData(selData)
  }
  setSearchListRes = (data: any) => {
    setSearchState({
      ...searchState,
      memberList: data[0] || [],
      deptList: data[3] || [],
      roleList: data[31] || [],
    })
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
   * 根据权限获取可选类型
   */
  const checkboxTypeAuth = (checkableType: any) => {
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
    return checkableType
  }

  /**
   * 组织架构搜索列表展示
   */
  const SearchMenu = () => {
    checkboxTypeAuth(searchTypes)
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
        <div className={`searchTit ${searchTypes.includes(0) ? '' : 'forcedHide'}`}>{$intl.get('Members')}</div>
        <div className={`searchList ${searchTypes.includes(0) ? '' : 'forcedHide'}`}>
          {searchState.memberList.map((item: any, i: number) => {
            return <SearchItem key={i} item={item} showType={0} />
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
    checkboxTypeAuth(searchTypes)
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
})

export default SearchContent

import React, { useEffect, useState } from 'react'
import { Menu, Avatar, Input } from 'antd'
import { OrgSearchList } from '../../task/taskManage/TaskOrg'
import { getTreeParam } from '@/src/common/js/tree-com'
import { btnOptHandleApi } from '../../work-plan-mind/getData'
const initStates = {
  moreMenu: [],
  classData: {},
  searchText: '',
  delText: '',
}
// 新增菜单
const ChooseMenu = (taskList: any) => {
  const [listData, setTableData] = useState<any>(initStates) //用来存储编辑后的数据
  //loading
  // let tmpStyle = {}
  useEffect(() => {
    if (taskList) {
      listData.classData = taskList.classData
      listData.moreMenu = taskList.btnList
      listData.searchText = ''
      listData.delText = ''
      setTableData({ ...listData })
    }
    // if (taskList.showStyle) {
    //   tmpStyle = {}
    // } else {
    //   tmpStyle = {
    //     position: 'absolute',
    //     left: `${listData.classData.pageX}px`,
    //     top: `${listData.classData.pageY}px`,
    //     display: 'block',
    //   }
    // }
  }, [taskList])

  const chooseClick = (e: any) => {
    e.domEvent.stopPropagation()
    if (e.key != -1 && e.key != -2) {
      const dataes = listData.moreMenu[e.key]
      taskList.menuClick(1, {
        liable: {
          deptId: dataes.contactsDeptId,
          deptName: dataes.contactsDeptName,
          roleId: dataes.contactsRoleId,
          roleName: dataes.contactsRoleName,
          userId: dataes.contactsUser,
          username: dataes.contactsUsername,
          profile: dataes.profile,
        },
        attach: { star: '', type: 0, typeId: dataes.contactsUser },
        id: listData.classData.row ? listData.classData.row.typeId : '',
        operateUser: dataes.contactsUser,
        operateUserName: dataes.contactsUsername,
        ascriptionType: listData.classData.row.ascriptionType || 0,
      })
    } else if (e.key == -1) {
      taskList.menuClick(2, { id: listData.classData.row ? listData.classData.row.typeId : '' })
    }
  }
  const getDataClick = (teamObj: any) => {
    const getData = getTreeParam(teamObj.treeId)
    let getcontact = false
    listData.moreMenu.map((el: any) => {
      if (el.contactsUser == getData.curId && el.parentId == getData.parentId) {
        getcontact = true
      }
    })
    taskList.menuClick(1, {
      liable: {
        deptId: getData.parentId,
        deptName: getData.parentName,
        roleId: getData.roleId,
        roleName: getData.roleName,
        userId: getData.curId,
        username: getData.curName,
        profile: teamObj.profile,
      },
      attach: { star: '', type: 0, typeId: getData.curId },
      id: listData.classData.row ? listData.classData.row.typeId : '',
      operateUser: getData.curId,
      operateUserName: getData.curName,
      ascriptionType: listData.classData.row.ascriptionType || 0,
    })
    if (!getcontact) {
      const param = {
        ownerUser: $store.getState().nowUserId,
        contactsTeamId: getData.cmyId,
        contactsType: 0,
        modelList: [
          {
            contactsUser: getData.curId,
            contactsAccount: teamObj.account,
            contactsUsername: getData.curName,
            contactsDeptId: getData.parentId,
            contactsDeptName: getData.parentName,
            contactsRoleId: getData.roleId,
            contactsRoleName: getData.roleName,
          },
        ],
      }
      btnOptHandleApi(param, '/team/teamUserInfo/saveContacts')
    }
  }
  const orgIcon: any = $tools.asAssetsPath('/images/workplan/OKR/organization.png')
  return (
    <Menu
      style={
        taskList.showStyle
          ? undefined
          : {
              position: 'absolute',
              left: `${listData.classData.pageX}px`,
              top: `${listData.classData.pageY}px`,
              display: 'block',
            }
      }
      className="portrait_fourQuar"
      onClick={chooseClick}
    >
      <Menu.Item key={-2}>
        <Input
          allowClear
          placeholder="搜索"
          value={listData.delText}
          className="org_menu_okr baseInput radius16 border0 bg_gray"
          suffix={
            <span
              className="search-icon-boxs"
              onClick={(e: any) => {
                e.stopPropagation()
                listData.searchText = listData.delText
                setTableData({ ...listData })
              }}
            >
              <em className="search-icon-defalt"></em>
            </span>
          }
          onClick={(e: any) => {
            e.stopPropagation()
          }}
          onChange={(e: any) => {
            e.stopPropagation()
            listData.delText = e.target.value
            setTableData({ ...listData })
          }}
          onPressEnter={(e: any) => {
            e.stopPropagation()
            listData.searchText = e.target.value
            setTableData({ ...listData })
          }}
        />
      </Menu.Item>
      {/* 搜索列表 */}
      <div className={`searchList_box ${listData.searchText == '' ? 'forcedHide' : ''}`}>
        <div className={`orgSearchList flex-1`}>
          <OrgSearchList
            param={{
              allCompanyIds: listData.classData.row
                ? [listData.classData.row.enterpriseId || listData.classData.row.teamId]
                : [],
              allCompany: [
                {
                  name: listData.classData.row
                    ? listData.classData.row.enterpriseName || listData.classData.row.teamName
                    : '',
                  id: listData.classData.row
                    ? listData.classData.row.enterpriseId || listData.classData.row.teamId
                    : '',
                },
              ],
            }}
            searchVal={listData.searchText}
            searchSelect={getDataClick}
            serchType={'chooseLiber'}
          />
        </div>
      </div>
      <p className={`okr_linkman ${listData.searchText != '' ? 'forcedHide' : ''}`}>
        {$intl.get('topContacts')}
      </p>
      {listData.moreMenu && listData.moreMenu.length > 0 && (
        <Menu
          className={`okr_linkman_item ${listData.searchText != '' ? 'forcedHide' : ''}`}
          onClick={chooseClick}
        >
          {listData.moreMenu.map((item: any, index: number) => (
            <Menu.Item key={index}>
              <div className="left_box">
                <Avatar
                  size={34}
                  src={item.profile || ''}
                  style={{
                    color: '#fff',
                    background: '#4285f4',
                  }}
                >
                  {' '}
                  {item.contactsUsername ? item.contactsUsername.substr(-2, 2) : ''}
                </Avatar>
              </div>
              <div className="right_box">
                <p className="name">{item.contactsUsername}</p>
                <p>{item.contactsRoleName}</p>
              </div>
            </Menu.Item>
          ))}
        </Menu>
      )}

      <p className={`okr_linkman ${listData.searchText != '' ? 'forcedHide' : ''}`}>
        {$intl.get('contactMore')}
      </p>
      <Menu.Item key={-1} className={`${listData.searchText != '' ? 'forcedHide' : ''}`}>
        <div className="left_box addOrgDefalut">
          <Avatar
            size={34}
            src={orgIcon}
            style={{
              background: '#4285f4',
            }}
          ></Avatar>
        </div>
        <div className="right_box">
          <span style={{ lineHeight: '40px' }}>{$intl.get('organizational')}</span>
        </div>
      </Menu.Item>
    </Menu>
  )
}
export default ChooseMenu

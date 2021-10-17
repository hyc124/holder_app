import { SelectMemberOrg } from '@/src/components/select-member-org'
import { Avatar } from 'antd'
import React, { useContext, useState } from 'react'
import { DetailContext, taskDetailContext, _okrModeActive } from '../taskDetails/detailRight'
export const MainUser = () => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { mainData, detailData, editOKRAffInfo, singleRefresh } = taskDetailObj
  const [state, setState] = useState({
    visible: false,
  })
  /**
   * 选择责任人
   */
  const selectLiable = () => {
    const selectList: any = []
    if (mainData.liableUser) {
      selectList.push({
        curId: mainData.liableUser || '',
        curName: mainData.liableUsername || '',
        account: '',
        curType: 0,
      })
    }

    const memberOrg: any = {
      visible: true,
      selectList,
      allowTeamId: [mainData.ascriptionId || ''],
      checkboxType: 'radio',
      isDel: false,
      permissionType: 3, //组织架构通讯录范围控制
      onSure: (dataList: any) => {
        editMembers(dataList, 1)
      },
    }
    setState(memberOrg)
  }
  /**
   * 编辑人员
   */
  const editMembers = (dataList: any, type: number) => {
    if (dataList.length == 0) {
      return
    }
    const userObj = dataList[0] || {}
    const param = {
      ascriptionId: userObj.userId || userObj.curId,
      ascriptionType: userObj.curType || 0,
      deptId: userObj.deptId,
      roleId: userObj.roleId,
      userId: userObj.userId,
      account: userObj.account || '',
      onlyUser: type,
    }
    // 目标O的详情，当前是四象限模式下时，不查询详情全局刷新，要局部刷新
    if (detailData.workPlanType == 2 && _okrModeActive == '0') {
      const refreshParam = { optType: 'editBelong', refreshTree: true, noQuery: true }
      editOKRAffInfo(param, refreshParam).then((res: any) => {
        if (res) {
          singleRefresh({ ...refreshParam, taskId: detailData.id }).then((resData: any) => {
            // setState({ ...state, detailData: { ...resData } })
          })
        }
      })
    } else {
      editOKRAffInfo(param, { optType: 'editBelong', refreshTree: true })
    }
  }

  return (
    <div className="flex between center-v attachCont mainUser_attachCont">
      <span>责任人</span>
      {!detailData.liableUsername && (
        <div className="actionBtn">
          <span
            className={`img_icon add_cross_icon`}
            onClick={() => {
              const memberOrg: any = {
                visible: true,
                selectList: [],
                allowTeamId: [mainData.ascriptionId || ''],
                checkboxType: 'radio',
                isDel: false,
                permissionType: 3, //组织架构通讯录范围控制
                onSure: (dataList: any) => {
                  editMembers(dataList, 1)
                },
              }
              setState(memberOrg)
            }}
          ></span>
        </div>
      )}
      {detailData.liableUsername && (
        <div
          className="handleUser"
          onClick={() => {
            selectLiable()
          }}
        >
          <Avatar
            key="liable"
            src={detailData.liableUserProfile}
            size={18}
            style={{
              width: '18px',
              height: '18px',
              marginRight: '4px',
              backgroundColor: !detailData.liableUsername ? 'inherit' : '#3949AB',
            }}
          >
            {detailData.liableUsername ? detailData.liableUsername.substr(-1, 1) : ''}
          </Avatar>
          <span> {detailData.liableUsername ? detailData.liableUsername.split(-2, 2) : ''}</span>
        </div>
      )}

      {/* 选择人员弹框 */}
      {state.visible ? (
        <SelectMemberOrg
          param={{ ...state }}
          action={{
            setModalShow: (flag: boolean) => {
              setState({ ...state, visible: flag })
            },
          }}
        />
      ) : (
        ''
      )}
    </div>
  )
}

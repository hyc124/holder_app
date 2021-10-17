import { SelectMemberOrg } from '@/src/components/select-member-org'
import React from 'react'
import { useState } from 'react'
import { useContext } from 'react'
import { DetailContext, taskDetailContext, _okrModeActive } from '../taskDetails/detailRight'

export const BelongUser = ({ from }: { from: string }) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { attach, workPlanType } = taskDetailObj.mainData
  const { editAuth } = taskDetailObj.detailData
  const { mainData, detailData, editOKRAffInfo, singleRefresh } = taskDetailObj
  const [state, setState] = useState({
    visible: false,
  })
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
  /**
   * 选择归属
   */
  const selectAffiliation = () => {
    const selectList: any = []
    const attachobj = mainData.attach || {}
    const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
    const belongTxt = (attachobj.typeName ? attachobj.typeName + '-' : '') + mainData.ascriptionName
    const profile = attachobj.profile || ''
    // if (attachobj.type == 2) {
    //   profile = attachobj.profile || ''
    // } else if (attachobj.type == 3) {
    //   profile = attachobj.profile || ''
    // } else {
    //   // 为个人目标时部门
    //   profile = attachobj.profile || ''
    // }
    if (attachobj.typeId && attachobj.typeId != -1) {
      selectList.push({
        curId: attachobj.type == 0 ? '' : attachobj.typeId,
        curName: attachobj.typeName,
        cmyName: mainData.ascriptionName,
        cmyId: mainData.ascriptionId,
        account: '',
        curType: attachobj.type || 0, //3:部门、2：企业、1：个人
        profile,
      })
    }
    console.log(selectList)

    const memberOrg: any = {
      title: '选择归属',
      sourceType: 'taskBelong',
      addShowOkrText: 'okr',
      comMember: 'team',
      visible: true,
      selectList,
      allowTeamId: [mainData.ascriptionId || ''],
      checkboxType: 'radio',
      permissionType: 1, //组织架构通讯录范围控制
      checkableType: [0, 2, 3],
      isDel: false,
      noQueryProfile: true, //初始进入不查询头像
      onSure: (dataList: any) => {
        editMembers(dataList, 0)
      },
    }
    setState(memberOrg)
  }

  return (
    <div className="attachCont belongUser">
      <div className="flex between center-v belongUserContent">
        {attach && attach.type != -1 && (
          <div className="belongDept">
            <span>{attach.type == 3 ? '部门目标' : attach.type == 2 ? '企业目标' : '个人目标'}</span>
            {attach.type == 3 && <span>-</span>}
            {attach.type == 3 || attach.type == 2 ? <span>{attach.typeName}</span> : ''}
          </div>
        )}
        {editAuth && <em onClick={selectAffiliation} className="belongIcon"></em>}
      </div>
      <div>{taskDetailObj.mainData.ascriptionName}</div>
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

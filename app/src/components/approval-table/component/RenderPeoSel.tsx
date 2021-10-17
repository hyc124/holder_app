import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import { Button } from 'antd/lib/radio'
import { CSSProperties, useEffect, useState } from 'react'
import $c from 'classnames'
import React from 'react'
import { useSelector } from 'react-redux'
import { SelectMemberOrg } from '../../select-member-org'
import { Tag, Tooltip } from 'antd'
import RenderOnlySymbol from './RenderOnlySymbol'
import { getOnlyElementUuid, isRelationOnyElement } from '../getData/approvalHandle'

//单独渲染人员选择
const RenderPeoSel = ({
  formElementModel,
  formItemStyles,
  isAuth,
  teamId,
  eventId,
  name,
  changeData,
  coord,
  fresh,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  isAuth: boolean
  teamId: number
  eventId: number
  name?: string
  changeData?: (item: any, value?: string, content?: string) => void
  coord: any
  fresh: any
}) => {
  //选择人员默认值
  const { approvalDetailInfo } = $store.getState()
  const { onlyElementData } = $store.getState()
  const formulaNumvalObj = useSelector((store: StoreStates) => store.formulaNumvalObj)
  let selectPerson: any[] = []
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    //有缓存值 formElementModel.parentUuId重复行
    selectPerson = JSON.parse(formulaNumvalObj[formElementModel.uuId])
  } else if (formElementModel.value && !formulaNumvalObj[formElementModel.uuId]) {
    selectPerson = JSON.parse(formElementModel.value)
  }

  // 重复行控件是否填值
  if (formElementModel.repeatValue && !formElementModel.repeatRowVal) {
    // 重复行没有唯一标识，但有冲销和普通回写控件，重复时带父级的值
    if (formElementModel.parentUuId && formulaNumvalObj[formElementModel.parentUuId]) {
      selectPerson = JSON.parse(formElementModel.parentUuId && formulaNumvalObj[formElementModel.parentUuId])
    } else if (formElementModel.value) {
      selectPerson = JSON.parse(formElementModel.value)
    }
  }
  //处理已选择成员展示
  let nodeSelecteds: any[] = selectPerson.map((item: any) => {
    return {
      userId: item.userId,
      userName: item.userName,
      account: item.account,
      curId: parseInt(item.userId),
      curName: item.userName || '',
      curType: 0,
      parentId: item.roleId || '',
      parentName: item.roleName || '',
      deptId: item.deptId || '',
      deptName: item.deptName || '',
      roleId: item.roleId || '',
      roleName: item.roleName || '',
      profile: item.profile || '',
      cmyId: item.teamId,
      cmyName: item.teamName,
    }
  })
  //显示选择的人员列表
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    //是否显示默认人员
    if (
      (name === 'triggerApproval' || name === 'waitApproval') &&
      formElementModel.isDefault === 1 &&
      formElementModel.edit === 1 &&
      nodeSelecteds.length === 0
    ) {
      const { nowUserId, nowUser, nowAccount, userInfo } = $store.getState()
      // eslint-disable-next-line react-hooks/exhaustive-deps
      nodeSelecteds = [
        {
          userId: nowUserId,
          userName: nowUser,
          account: nowAccount,
          candel: true,
          curId: nowUserId,
          curName: nowUser || '',
          curType: 0,
          parentId: '',
          parentName: '',
          deptId: '',
          deptName: '',
          roleId: '',
          roleName: '',
          profile: '',
          cmyId: teamId,
          cmyName: '',
        },
      ]
      const formData = [
        {
          userId: nowUserId.toString(),
          userName: nowUser,
          account: nowAccount,
          profile: userInfo.profile,
        },
      ]
      const valueStr = nowUser
      setTimeout(() => {
        const updateData = { [formElementModel.uuId]: JSON.stringify(formData) }
        changeData && changeData({ data: updateData, contentArr: valueStr })
        // changeData && changeData(formElementModel, JSON.stringify(formData), valueStr)
      }, 1000)
    }
  }, [fresh])
  //选择人员后回调
  const peoSelChange = (data: any) => {
    nodeSelecteds = data
    const formData = data.map((item: { curId: any; curName: any; account: any; profile: any }) => {
      return {
        userId: item.curId.toString(),
        userName: item.curName,
        account: item.account,
        profile: item.profile,
      }
    })
    const valueStr = data
      .map((item: { userName: string }) => {
        return item.userName
      })
      .join('')
    const updateData = { [formElementModel.uuId]: JSON.stringify(formData) }
    changeData && changeData({ data: updateData, contentArr: valueStr })
    // changeData && changeData(formElementModel, JSON.stringify(formData), valueStr)
    setVisible(false)
  }
  //点击打开选择人员弹窗
  const openSelModal = () => {
    setVisible(true)
  }
  //外部删除选择人员
  const delPeoSel = (id: number) => {
    const newData = nodeSelecteds.filter((item: { userId: number }) => item.userId !== id)
    nodeSelecteds = newData
    const formData = newData.map((item: { userId: any; userName: any; account: any }) => {
      return {
        userId: item.userId,
        userName: item.userName,
        account: item.account,
      }
    })
    const valueStr = newData
      .map((item: { userName: string }) => {
        return item.userName
      })
      .join('')
    const updateData = { [formElementModel.uuId]: JSON.stringify(formData) }
    changeData && changeData({ data: updateData, contentArr: valueStr })
    //清空受影响的
    formElementModel.influenceUuid?.map(item => {
      const updateData = { [item]: '' }
      changeData && changeData({ data: updateData, contentArr: '' })
    })
    // changeData && changeData(formElementModel, JSON.stringify(formData), valueStr)
  }
  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={formElementModel.type}
      data-uuid={formElementModel.uuId}
      data-mark={formElementModel.condition}
      data-isauth={formElementModel.edit === 0 ? false : true}
      data-isdef={formElementModel.isDefault === 1 ? true : false}
      data-isedit={formElementModel.special === 1 ? true : false}
      data-datetype={formElementModel.dateType}
      data-parentuuid={formElementModel.parentUuId}
      data-onlyflag={formElementModel.repeatRowVal}
      data-normalvalue={formElementModel.normalValue}
    >
      <div className={$c('plugRowLeft', { hideName: formElementModel.showName === 0 })}>
        {formElementModel.name}
      </div>
      <div className="plugRowRight">
        {isAuth && (
          <>
            <Button className="approval-add-btn" onClick={openSelModal}></Button>
            {visible && (
              <SelectMemberOrg
                param={{
                  visible: visible,
                  allowTeamId: [teamId],
                  checkboxType: formElementModel.isRadio == 1 ? 'checkbox' : 'radio',
                  fliterByType: {
                    '1': {
                      show: true,
                      text: '按组织架构选择',
                    },
                    '2': {
                      show: formElementModel.businessSystemRelation === 0,
                      text: '按角色选择',
                    },
                    '3': {
                      show: formElementModel.businessSystemRelation === 0,
                    },
                    '4': {
                      show: formElementModel.businessSystemRelation === 0,
                      text: '常用联系人',
                    },
                  },
                  selectList: nodeSelecteds,
                  isOuterSystem: formElementModel.businessSystemRelation || 0,
                  approvalObj: {
                    approvalId: approvalDetailInfo ? approvalDetailInfo.id : '',
                    eventId: eventId,
                    uuid: formElementModel.copyUuid || formElementModel.parentUuId || formElementModel.uuId,
                    elementType: 'peoSel',
                  },
                  showPrefix: {
                    //是否显示成员的部门岗位前缀
                    dept: false, //部门
                    role: false, //岗位
                    company: false, //企业前缀
                  },
                  onSure: (datas: any) => {
                    peoSelChange(datas)
                  },
                }}
                action={{
                  setModalShow: setVisible,
                }}
              />
            )}
          </>
        )}
        {nodeSelecteds.length !== 0 &&
          nodeSelecteds.map(
            (item: { userId: number; userName: string; account: string; candel?: boolean }, index: number) => (
              <Tooltip key={index} title={item.userName}>
                <Tag
                  closable={isAuth || item.candel}
                  onClose={(e: any) => {
                    e.preventDefault()
                    delPeoSel(item.userId)
                  }}
                  style={{ border: !isAuth ? 0 : '1px solid #dcdcdc' }}
                >
                  <span className="txt">{item.userName}</span>
                </Tag>
              </Tooltip>
            )
          )}
        {/* 唯一标识 */}
        {(name === 'triggerApproval' || name === 'waitApproval') &&
          // executeData &&
          // executeData.onlyElementUuid &&
          // !formElementModel.parentUuId && 重复行有唯一标识不显示
          onlyElementData &&
          isRelationOnyElement(formElementModel.uuId, formElementModel.edit) &&
          getOnlyElementUuid(onlyElementData, formElementModel.uuId) && (
            <RenderOnlySymbol
              eventId={eventId}
              changeData={changeData}
              uuid={formElementModel.uuId}
              parentUuId={formElementModel.parentUuId}
              coord={coord}
            />
          )}
      </div>
    </div>
  )
}
export default RenderPeoSel

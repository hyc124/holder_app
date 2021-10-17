import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import React from 'react'
import $c from 'classnames'
import RenderAttachment from './RenderAttachment'
import RenderCheckboxForm from './RenderCheckboxForm'
import RenderCuttingLine from './RenderCuttingLine'
import RenderDateRange from './RenderDateRange'
import RendeRembeddedLinks from './RendeRembeddedLinks'
import RenderFormNumber from './RenderFormNumber'
// import RenderFormula from './RenderFormula'
import RenderInput from './RenderInput'
// import RenderNumVal from './RenderNumVal'
import RenderRadio from './RenderRadio'
import RenderRoleSel from './RenderRoleSel'
import RenderSelect from './RenderSelect'
import RenderTextArea from './RenderTextArea'
import RenderTime from './RenderTime'
// import RenderTable from './RenderTable'
import RenderPeoSel from './RenderRoleSel'
import RenderDeptSel from './RenderDeptSel'
import * as Maths from '@/src/common/js/math'
import { isRelationOnyElement } from '../getData/approvalHandle'

export const getShowFormItemByType = (
  item: FormElementModelProps,
  teamId: number,
  eventId: number,
  changeData?: (item: any, value?: string, content?: string) => void,
  name?: string,
  state?: number,
  coord?: string,
  isExeEnter?: boolean,
  isRefresh?: boolean //重置（公式）
) => {
  const formElementModel = item
  const formType = item.type
  //公共样式处理
  const formItemStyles: any = {}
  //半行整行
  if (formElementModel.length === 1) {
    formItemStyles.width = '100%'
  } else {
    formItemStyles.width = '50%'
  }
  //可见不可见
  if (formElementModel.visible === 1) {
    formItemStyles.display = 'flex'
  } else {
    formItemStyles.display = 'none'
  }
  // let isAuth =
  //   formElementModel.edit === 0 ||
  //   (name !== 'waitApproval' && name !== 'triggerApproval') ||
  //   isRelationOnyElement(formElementModel.uuId, formElementModel.edit) ||
  //   isRelationOnyElement(formElementModel.parentUuId, formElementModel.edit)
  //     ? false
  //     : true

  let isAuth = false
  // 带我审批、等待发起、发起审批
  if (name === 'waitApproval' || name === 'triggerApproval') {
    if (
      formElementModel.edit === 1 &&
      !isRelationOnyElement(formElementModel.uuId, formElementModel.edit) &&
      !isRelationOnyElement(formElementModel.parentUuId, formElementModel.edit)
    ) {
      // 有编辑权限且不在回写数组中
      isAuth = true
    }
  }

  if (state && state !== 7) {
    isAuth = false
  }
  switch (formType) {
    case 'text':
      if (formElementModel.align === 0) {
        formItemStyles.alignItems = 'flex-start'
        formItemStyles.textAlign = 'left'
      } else if (formElementModel.align === 1) {
        formItemStyles.alignItems = 'center'
        formItemStyles.textAlign = 'center'
      } else {
        formItemStyles.alignItems = 'flex-end'
        formItemStyles.textAlign = 'right'
      }
      if (formElementModel.textProperty && formElementModel.textProperty.includes('0')) {
        formItemStyles.fontWeight = 'bold'
      }
      if (formElementModel.textProperty && formElementModel.textProperty.includes('1')) {
        formItemStyles.fontStyle = 'italic'
      }
      if (formElementModel.textProperty && formElementModel.textProperty.includes('2')) {
        formItemStyles.textDecoration = 'underline'
      }
      let showName = formElementModel.name
      if ($tools.isJsonString(formElementModel.name)) {
        const newName = JSON.parse(formElementModel.name)
        showName = newName[0].txt
        newName.map((item: { txt: string | RegExp; color: any; size: any }) => {
          const reg = new RegExp(item.txt)
          const replaceTxt = showName.match(reg) || showName
          showName = showName.replace(
            reg,
            `<span style="color:${item.color};font-size:${item.size || 12}px;">${replaceTxt}</span>`
          )
        })
      }
      return (
        <div
          key={formElementModel.id}
          className={$c('plugElementRow textRow', {
            hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
          })}
          style={formItemStyles}
          data-elementid={formElementModel.id}
          data-type={formType}
          data-uuid={formElementModel.uuId}
          data-mark={formElementModel.condition}
          data-isauth={formElementModel.edit === 0 ? false : true}
          data-isdef={formElementModel.isDefault === 1 ? true : false}
          data-isedit={formElementModel.special === 1 ? true : false}
          data-datetype={formElementModel.dateType}
        >
          <div className="textPlugRowCont">
            <pre className="plugTit textPlugTit" dangerouslySetInnerHTML={{ __html: showName }}></pre>
          </div>
        </div>
      )
    case 'select':
      return (
        <RenderSelect
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          eventId={eventId}
          teamId={teamId}
          coord={coord}
          name={name}
        />
      )
    case 'time':
      return (
        <RenderTime
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          name={name}
        />
      )
    case 'dateRange':
      return (
        <RenderDateRange
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          name={name}
        />
      )
    case 'input':
      return (
        <RenderInput
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          eventId={eventId}
          name={name}
          coord={coord}
        />
      )

    case 'textarea':
      return (
        <RenderTextArea
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          eventId={eventId}
          name={name}
          coord={coord}
        />
      )
    // case 'numval':
    //   return (
    //     <RenderNumVal
    //       key={formElementModel.id}
    //       formElementModel={formElementModel}
    //       formItemStyles={formItemStyles}
    //       changeData={changeData}
    //       isAuth={isAuth}
    //       eventId={eventId}
    //       name={name}
    //       coord={coord}
    //     />
    //   )
    // case 'formula':
    //   return (
    //     <RenderFormula
    //       key={formElementModel.id}
    //       formElementModel={formElementModel}
    //       formItemStyles={formItemStyles}
    //       coord={coord}
    //     />
    //   )
    case 'attachment':
      return (
        <RenderAttachment
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          coord={coord}
          teamId={teamId}
          pageUuid={Maths.uuid()}
          isExeEnter={isExeEnter ? true : false}
        />
      )
    case 'CuttingLine':
      return (
        <RenderCuttingLine
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
        />
      )
    case 'radio':
      return (
        <RenderRadio
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          coord={coord}
        />
      )
    case 'checkbox':
      return (
        <RenderCheckboxForm
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          eventId={eventId}
          teamId={teamId}
          coord={coord}
        />
      )
    case 'peoSel':
      return (
        <RenderPeoSel
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          eventId={eventId}
          teamId={teamId}
          name={name}
          coord={coord}
        />
      )
    case 'deptSel':
      return (
        <RenderDeptSel
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          eventId={eventId}
          teamId={teamId}
          name={name}
          coord={coord}
        />
      )
    case 'roleSel':
      return (
        <RenderRoleSel
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          eventId={eventId}
          teamId={teamId}
          name={name}
          coord={coord}
        />
      )
    case 'formNumber':
      return (
        <RenderFormNumber
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
        />
      )
    case 'embedded_links':
      return (
        <RendeRembeddedLinks
          key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
        />
      )
    // case 'table':
    //   return (
    //     <RenderTable
    //       key={formElementModel.id}
    //       formElementModel={formElementModel}
    //       teamId={teamId}
    //       eventId={eventId}
    //       changeData={changeData}
    //       name={name}
    //       state={state}
    //     />
    //   )
    default:
      break
  }
}

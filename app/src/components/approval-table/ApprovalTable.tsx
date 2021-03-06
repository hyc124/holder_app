import React, { useEffect, CSSProperties, useRef } from 'react'
import 'handsontable/dist/handsontable.full.css'
import { Input, Collapse, InputNumber, Spin } from 'antd'
import { HotTable, HotColumn } from '@handsontable/react'
import {
  FormContentModelProps,
  FormElementModelProps,
  TableElementsItemProps,
  ApprovalDetailProps,
} from '@/src/views/approval/components/ApprovalDettail'
import { create, all } from 'mathjs'
const { Panel } = Collapse
import $c from 'classnames'
import './ApprovalTable.less'
import Handsontable from 'handsontable'
import * as Maths from '@/src/common/js/math'
import { ArabiaToChinese, toFixedTool } from '@/core/tools/utils'
import { CustomWork } from '@/src/views/approval-execute/ApprovalExecute'
import RenderOnlySymbol from './component/RenderOnlySymbol'
import RenderRadio from './component/RenderRadio'
import RenderInput from './component/RenderInput'
import RenderTextArea from './component/RenderTextArea'
import RenderTime from './component/RenderTime'
import RenderSelect from './component/RenderSelect'
import RenderDateRange from './component/RenderDateRange'
import RenderCheckboxForm from './component/RenderCheckboxForm'
import RenderPeoSel from './component/RenderPeoSel'
import RenderDeptSel from './component/RenderDeptSel'
import RenderRoleSel from './component/RenderRoleSel'
import TriggerContent from './component/triggerContent'
import RenderMeetingDetail from './component/RenderMeetingDetail'
import RenderRuleDetail from './component/RenderRuleDetail'
import RenderRoleAuthDetail from './component/RenderRoleAuthDetail'
import RenderProvideInfo from './component/RenderProvideInfo'
import setApprovalInfoHeader from './component/setApprovalInfoHeader'
import RenderAttachment from './component/RenderAttachment'
import {
  checkRepeatAndOnlyUid,
  checkRepeatOnly,
  compare,
  delOnlySymble,
  getExpend,
  getNewRow,
  getNextTableData,
  getOnlyElementUuid,
  getRepeatRowPrev,
  isIn,
  isRelationOnyElement,
} from './getData/approvalHandle'

// const config =
const math: any = create(all, {
  epsilon: 1e-12,
  matrix: 'Matrix',
  number: 'BigNumber', // ????????????number BigNumber
  precision: 64,
  // predictable: false,
  // randomSeed: null,
})
import Decimal from 'decimal.js'
import { useState } from 'react'
import RenderLeaveDateRange from './component/RenderLeaveDateRange'
import { getElementValue } from './getData/getData'
import { shallowEqual, useSelector } from 'react-redux'
export const renderOutBack = React.createContext({})
interface ApprovalTableProps {
  dataSource: ApprovalDetailProps
  changeTableData?: (id: number, value?: string, content?: string) => void
  sendAuthInfo?: (data: any) => void
  name?: string
  triggerFormData?: FormElementModelProps[]
  disabled?: boolean //????????????
  hasProcess?: boolean
  setInfo?: any
}

//??????????????????
let formulaInfo: any[] = []

/**
 * ??????????????????
 * @param props
 */
const ApprovalTable = (props: ApprovalTableProps) => {
  const {
    dataSource,
    name,
    triggerFormData,
    changeTableData,
    sendAuthInfo,
    disabled,
    hasProcess,
    setInfo,
  } = props

  const formData = dataSource.formContentModels
  const newData: FormContentModelProps[] = formData.sort(compare('elementPosition'))

  //??????????????????
  useEffect(() => {
    $('.detail-container').animate({ scrollTop: 0 }, 100)
  }, [])

  formulaInfo = []
  return (
    <div className="detail-container" key={Maths.uuid()}>
      <div className="form-info">
        {/* ??????????????? */}
        {dataSource.eventType === 'others' &&
          newData.map(
            (item: FormContentModelProps) =>
              item.formElementModel &&
              getShowFormItemByType(
                item.formElementModel,
                dataSource.teamId,
                dataSource.eventId,
                changeTableData,
                name,
                dataSource.state
              )
          )}
        {name === 'triggerApproval' &&
          triggerFormData &&
          triggerFormData.map((item: FormElementModelProps) =>
            getShowFormItemByType(
              item,
              dataSource.teamId,
              dataSource.eventId,
              changeTableData,
              name,
              dataSource.state
            )
          )}
        {/* ???????????? */}
        {dataSource.eventType === 'rule' && <RenderRuleDetail meetId={dataSource.infoId} showInfo={newData} />}
        {/* ?????????????????? ??? ?????????????????? */}
        {(dataSource.eventType === 'role_authorization' || dataSource.eventType === 'my_permission') && (
          <RenderRoleAuthDetail
            showInfo={newData}
            infoContent={dataSource.infoContent}
            teamId={dataSource.teamId}
            selectName={name}
            showAuthInfo={sendAuthInfo}
          />
        )}
        {/* ???????????? */}
        {dataSource.eventType === 'meeting_add' && (
          <RenderMeetingDetail showInfo={newData} infoContent={dataSource.infoContent} />
        )}
      </div>
      {dataSource.touchLogModel && <TriggerContent touchLogModel={dataSource.touchLogModel} />}
      {dataSource.trailModels && dataSource.trailModels.length != 0 && (
        <Collapse
          ghost
          defaultActiveKey={[0]}
          expandIcon={setApprovalInfoHeader}
          className="approval-collspse-title"
        >
          {dataSource.trailModels.map((item, index) => (
            <Panel
              key={index}
              header={''}
              data-expendTime={'????????????????????????' + getExpend(dataSource.spendTime)}
            >
              <RenderProvideInfo sendInfo={dataSource} provideInfo={item} disabled={disabled} index={index} />
            </Panel>
          ))}
        </Collapse>
      )}
      {name === 'triggerApproval' && dataSource.touchLogModel && !hasProcess && (
        <CustomWork teamId={dataSource.teamId} setInfo={setInfo} />
      )}
    </div>
  )
}

//????????????
export const getShowFormItemByType = (
  item: FormElementModelProps,
  teamId: number,
  eventId: number,
  changeData?: (item: any, value?: string, content?: string, pageUuid?: any, delFileIds?: any) => void,
  name?: string,
  state?: number,
  coord?: string,
  isExeEnter?: boolean,
  isRefresh?: boolean //??????????????????
) => {
  if (isRefresh) {
    // ?????????????????????????????????'????????????'????????????????????????????????????????????????????????????????????????????????????
    formulaInfo = []
  }

  const formElementModel = item
  const formType = item.type
  //??????????????????
  const formItemStyles: any = {}
  //????????????
  if (formElementModel.length === 1) {
    formItemStyles.width = '100%'
  } else {
    formItemStyles.width = '50%'
  }
  //???????????????
  if (formElementModel.visible === 1) {
    formItemStyles.display = 'flex'
  } else {
    formItemStyles.display = 'none'
  }
  let isAuth = false
  // ??????????????????????????????????????????
  if (name === 'waitApproval' || name === 'triggerApproval') {
    if (
      formElementModel.edit === 1 &&
      !isRelationOnyElement(formElementModel.uuId, formElementModel.edit) &&
      !isRelationOnyElement(formElementModel.parentUuId, formElementModel.edit)
    ) {
      // ???????????????????????????????????????
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
        showName = newName[0] ? newName[0].txt : newName
        if (newName[0]) {
          newName?.map((item: { txt: string | RegExp; color: any; size: any }) => {
            const reg = new RegExp(item.txt)
            const replaceTxt = showName.match(reg) || showName
            showName = showName.replace(
              reg,
              `<span style="color:${item.color};font-size:${item.size || 12}px;">${replaceTxt}</span>`
            )
          })
        } else {
          showName = `<span style="font-size:${12}px;">${showName}</span>`
        }
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
    case 'leaveDateRange':
      return (
        <RenderLeaveDateRange
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
    case 'numval':
      return (
        <RenderNumVal
          key={Maths.uuid()}
          // key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          changeData={changeData}
          isAuth={isAuth}
          eventId={eventId}
          name={name}
          coord={coord}
          teamId={teamId}
        />
      )
    case 'formula':
      return (
        <RenderFormula
          // key={formElementModel.id}
          formElementModel={formElementModel}
          formItemStyles={formItemStyles}
          name={name}
          key={Maths.uuid()}
        />
      )
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
        <div
          className={$c('plugElementRow', {
            hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
          })}
          key={formElementModel.id}
          style={formItemStyles}
          data-mark={formElementModel.condition}
        >
          <div className="form-cuttingLine"></div>
        </div>
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
          fresh={Maths.uuid()}
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
        <div
          className={$c('plugElementRow', {
            hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
          })}
          key={formElementModel.id}
          style={formItemStyles}
          data-mark={formElementModel.condition}
        >
          <div className={$c('plugRowLeft', { hideName: formElementModel.showName === 0 })}>
            {formElementModel.name}
          </div>
          <div className="plugRowRight">
            <Input
              maxLength={50}
              disabled={true}
              defaultValue={formElementModel.value}
              placeholder={formElementModel.placeholder}
              key={Maths.uuid()}
            />
          </div>
        </div>
      )
    case 'embedded_links':
      return (
        <div
          className={$c('plugElementRow', {
            hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
          })}
          key={formElementModel.id}
          style={formItemStyles}
          data-mark={formElementModel.condition}
        >
          <div className={$c('plugRowLeft', { hideName: formElementModel.showName === 0 })}>
            {formElementModel.name}
          </div>
          <div className="plugRowRight">
            <div className="embedded_links">
              <iframe
                frameBorder="0"
                sandbox="allow-scripts allow-same-origin allow-top-navigation"
                // scrolling="no"
                src={formElementModel.value}
                style={{ width: '100%', height: '100%' }}
                height="100%"
                className="embedded_links_iframe"
              ></iframe>
            </div>
          </div>
        </div>
      )
    case 'table':
      return (
        <RenderTable
          key={formElementModel.id}
          formElementModel={formElementModel}
          teamId={teamId}
          eventId={eventId}
          changeData={changeData}
          name={name}
          state={state}
        />
      )
    default:
      break
  }
}

//???????????????
const changeNumval = (value: any, formElementModel: FormElementModelProps, changeData?: any, _type?: any) => {
  if (isNaN(value)) {
    //?????????
    return
  }
  const inputval = value !== '' ? String(value) : ''
  // numvalValue = inputval
  //?????????????????????????????????uuid
  const nowNumvalUuId = formElementModel.uuId
  $(`.plugElementRow[data-uuid="${nowNumvalUuId}"]`)
    .find('input')
    .attr({ 'data-value': inputval, value: inputval })

  const updateData = { [nowNumvalUuId]: inputval }
  changeFormulaByFormula({
    uuId: nowNumvalUuId,
    changeData: changeData,
    updateData: updateData,
    istype: _type,
  })
  const { approvalCheckData } = $store.getState()
  changeData && changeData({ elementType: 'numType', data: updateData })
  const otherFormElement = approvalCheckData.filter(
    item => item.type == 'numval' && item.uuId != nowNumvalUuId && item.elementGroupParamId
  )
  if (formElementModel.elementGroupParamName == 'day' && otherFormElement.length != 0) {
    changeData &&
      changeData({
        elementType: 'numType',
        data: {
          [otherFormElement[0].uuId]: (value * 8).toString(),
        },
      })
  } else if (formElementModel.elementGroupParamName == 'hour' && otherFormElement.length != 0) {
    changeData &&
      changeData({
        elementType: 'numType',
        data: {
          [otherFormElement[0].uuId]: (value / 8).toFixed(1).toString(),
        },
      })
  }
}

/**
 * ??????????????????????????????
 */
const changeFormulaByFormula = (data: any) => {
  //??????????????????
  const { uuId, istype, updateData, changeData } = data

  formulaInfo.map(item => {
    //??????????????????
    const formulaMode = parseInt(item.formulaMode)
    //???????????????????????????????????????

    const isUse = item.variable.filter((item: { id: string }) => item.id === uuId).length > 0
    if (!isUse && istype != 'recalculation') return

    let totalSum = 0
    const totalArr: number[] = []
    let productVal = 1

    item.variable.map((vitem: { id: string }) => {
      const { formulaNumvalObj } = $store.getState()
      const _getVal =
        $(`.plugElementRow[data-uuid="${vitem.id}"]`)
          .find('input')
          .attr('data-value') ||
        $(`.plugElementRow[data-uuid="${vitem.id}"]`)
          .find('input')
          .attr('value')

      const nowVal: string | undefined = _getVal || '0'
      if (nowVal && !isNaN(parseFloat(nowVal))) {
        //??????
        // totalSum += parseFloat(nowVal)
        totalSum = new Decimal(totalSum).add(new Decimal(parseFloat(nowVal))).toNumber()
        //??????
        // productVal = productVal * parseFloat(nowVal)
        productVal = new Decimal(productVal).mul(new Decimal(parseFloat(nowVal))).toNumber()
        totalArr.push(parseFloat(nowVal))
      } else {
        //?????????0??????
        totalSum += 0
        productVal = productVal * 0
        totalArr.push(0)
      }
    })
    //??????????????????
    let formulaVal: string | number = 0
    if (formulaMode === 0) {
      //??????

      formulaVal = totalSum
    } else if (formulaMode === 1) {
      //?????????

      formulaVal = totalSum / item.variable.length
    } else if (formulaMode === 2) {
      //?????????

      formulaVal = Math.max.apply(null, totalArr)
    } else if (formulaMode === 3) {
      //?????????

      formulaVal = Math.min.apply(null, totalArr)
    } else if (formulaMode === 4) {
      //??????
      if (item.formula != '') {
        // ???????????????????????????
        const computedValArr = item.variable.map((item: { id: string }) => {
          const value =
            $(`input[name="${item.id}"]`).attr('data-numval') ||
            $(`input[name="${item.id}"]`)
              .val()
              ?.toString() ||
            '0'
          return isNaN(parseFloat(value)) ? 0 : value
        })
        const realComputedFormula = item.formula.replace(/v(\d{1,9})/g, function(
          _str: any,
          $1: string | number
        ) {
          return computedValArr[$1] < 0 ? `(${computedValArr[$1]})` : computedValArr[$1]
        })

        formulaVal = eval(realComputedFormula)
      } else {
        formulaVal = productVal
      }
    } else if (formulaMode === 5) {
      //??????
      formulaVal = item.variable.length
    } else if (formulaMode === 6) {
      //?????????
      //????????????????????????????????????
      const computedValArr = item.variable.map((item: { id: string }) => {
        const value =
          $(`input[name="${item.id}"]`).attr('data-numval') ||
          $(`input[name="${item.id}"]`)
            .val()
            ?.toString() ||
          '0'
        return isNaN(parseFloat(value)) ? 0 : value
      })
      //??????????????????

      const realComputedFormula = item.formula.replace(/v(\d{1,9})/g, function(_str: any, $1: string | number) {
        if (computedValArr[$1] === undefined) {
          computedValArr[$1] = 0
        }
        return computedValArr[$1] < 0 ? `(${computedValArr[$1]})` : computedValArr[$1]
      })

      // formulaVal = eval(realComputedFormula)
      formulaVal = math.evaluate(realComputedFormula).toNumber()
    }
    let showValue: any = ''
    //???????????????
    if (item.numberTransform === 1) {
      showValue = showValue = ArabiaToChinese(toFixedTool(Number(formulaVal), item.decimals))
    } else {
      showValue = String(toFixedTool(formulaVal, item.decimals))
    }
    const _formVal = toFixedTool(formulaVal, item.decimals)
    $(`input[name="${item.formlaId}"]`)
      .val(showValue)
      .attr({ 'data-numval': _formVal })
      .attr({ 'data-value': _formVal })
    updateData ? (updateData[item.formlaId] = showValue) : ''
    //??????????????????????????????
    changeFormulaByFormula({ uuId: item.formlaId, changeData: changeData, updateData: updateData })
  })
}

/**
 * ????????????????????????
 */
const RenderNumVal = ({
  formElementModel,
  formItemStyles,
  isAuth,
  eventId,
  name,
  teamId,
  changeData,
  coord,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  isAuth: boolean
  eventId: number
  name?: string
  teamId?: number
  changeData?: (item: any, value?: string, content?: string) => void
  coord: any
}) => {
  const [dataAuth, setDataAuth] = useState(isAuth)
  //????????????
  const { formulaNumvalObj } = $store.getState()
  const { onlyElementData } = $store.getState()
  const approvalCheckData = useSelector((state: StoreStates) => state.approvalCheckData, shallowEqual)
  const numvalRef = useRef<any>(null)
  const showValue = useRef<any>(null)
  const showInput = useRef<any>(null)
  const nowFocusRef = useRef<any>(null)
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    showValue.current = formulaNumvalObj[formElementModel.uuId]
  } else {
    showValue.current = formElementModel.value || ''
  }
  if (formElementModel.repeatValue && !formElementModel.repeatRowVal) {
    // ??????????????????????????????????????????????????????????????????????????????????????????
    showValue.current = formulaNumvalObj[formElementModel.parentUuId] || formElementModel.value || ''
  }
  if (isNaN(showValue.current)) {
    showValue.current = '0'
  }
  const onlyNonNegative = (e: any) => {
    let value = e.target.value
    if (value != '' && value.substr(0, 1) == '.') {
      value = ''
    }
    //????????????????????????.??????????????????
    value = value.replace(/[^\d.]/g, '')
    //??????????????????. ???????????????
    value = value.replace(/\.{2,}/g, '.')
    value = value
      .replace('.', '$#$')
      .replace(/\./g, '')
      .replace('$#$', '.')

    const num: any = Number(formElementModel.decimals)
    const reg: any = new RegExp('^(0|([1-9]d*))(.\\d{1,' + num + '})?$', 'g')
    if (!reg.test(value) && value.includes('.')) {
      value = value.substring(0, value.indexOf('.') + num + 1)
      const n: any = value.split('.').length - 1
      if (n > 1) {
        value = value.substring(0, value.indexOf('.'))
      }
    }

    //??????????????????????????????????????????????????????????????????????????????????????? 01???02
    if (value.indexOf('.') < 0 && value != '') {
      if (value.substr(0, 1) == '0' && value.length == 2) {
        value = value.substr(1, value.length)
      }
    }
    e.target.value = value
  }
  const beInfluences = approvalCheckData.filter(
    (idx: { uuId: string }) =>
      formElementModel.beInfluenceUuid && formElementModel.beInfluenceUuid.includes(idx.uuId)
  )
  const beInVals = beInfluences
    .map((idx: { valueContent: any }) => {
      return idx.valueContent
    })
    .toString()

  //?????????????????????
  useEffect(() => {
    if (formElementModel.beInfluenceUuid) {
      let newAuth = true
      beInfluences.map((item: { valueContent: any; type: any; leaveDateRangeType: any }) => {
        if (!item.valueContent) {
          newAuth = false
          const updateData = { [formElementModel.uuId]: '' }
          changeData && changeData({ data: updateData, contentArr: '' })
        }
        if (item.type == 'select') {
          showInput.current = item.leaveDateRangeType
        }
      })
      ;(async () => {
        //??????????????????????????????????????????
        if (newAuth) {
          let paramModelList: any[] = []
          beInfluences.map((item: { elementGroupParamId: any; elementValue: any; type: any }) => {
            paramModelList.push({
              elementGroupParamId: item.elementGroupParamId,
              paramValue: getElementValue(item),
            })
          })
          if (paramModelList.length != 0) {
            const dataList = await getDateData(paramModelList)
            const filterVal = dataList.filter(
              (idx: { elementGroupParamId: number | undefined }) =>
                idx.elementGroupParamId == formElementModel.elementGroupParamId
            )
            if (filterVal.length != 0) {
              let Value = filterVal[0].paramValue
              const updateData = { [formElementModel.uuId]: Value }
              changeData && changeData({ data: updateData, contentArr: Value })
            }
          }
        }
        setDataAuth(false)
      })()
    }
  }, [beInVals])
  useEffect(() => {
    if (formElementModel.beInfluenceUuid && formulaNumvalObj[formElementModel.uuId] == null) {
      setDataAuth(true)
    }
  }, [formulaNumvalObj[formElementModel.uuId]])

  //??????????????????
  const getDateData = (paramModelList: any[]) => {
    return new Promise<any>((resolve, reject) => {
      const { loginToken } = $store.getState()
      let param = {
        elementGroupId: formElementModel.elementGroupId,
        paramModelList: paramModelList,
        teamId: teamId,
      }
      $api
        .request('/approval/elementGroupController/getElementGroupValueModel', param, {
          headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        })
        .then(res => {
          if (res.returnCode === 0) {
            resolve(res.dataList)
          } else {
            reject()
          }
        })
        .catch(() => {
          reject()
        })
    })
  }
  const hiddenNumval = showInput.current && !showInput.current?.includes(formElementModel.elementGroupParamName)
  if (hiddenNumval) {
    formItemStyles = {
      ...formItemStyles,
      display: 'none',
    }
    $store.dispatch({ type: 'SET_APP_HIDDEN_UUIDS', data: [formElementModel.uuId] })
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
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', height: '40px' }}>
          <Input
            ref={numvalRef}
            name={formElementModel.uuId}
            maxLength={20}
            onInput={(e: any) => {
              if (formElementModel.decimals) {
                onlyNonNegative(e)
              } else {
                e.target.value = e.target.value.replace(/[^0-9]/g, '')
              }
            }}
            type="text"
            disabled={!dataAuth}
            onBlur={(e: any) => {
              nowFocusRef.current = false
              if (showValue.current !== e.target.value) {
                changeNumval(e.target.value, formElementModel, changeData)
              }
            }}
            autoFocus={nowFocusRef.current}
            onFocus={e => {
              nowFocusRef.current = true
            }}
            // precision={formElementModel.decimals || 0}
            defaultValue={showValue.current}
            placeholder={formElementModel.placeholder}
            key={Maths.uuid()}
            data-value={showValue.current}
          />
          {formElementModel.unit && <span className="unit">{formElementModel.unit}</span>}
          {/* ???????????? */}
          {(name === 'triggerApproval' || name === 'waitApproval') &&
            // executeData &&
            // executeData.onlyElementUuid &&
            // !formElementModel.parentUuId && ?????????????????????????????????
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
    </div>
  )
}
const getNowTest = (num: any) => {
  let name = '\\d'
  for (let i = 0; i < num; i++) {
    name += '\\d'
  }
  return name
}
/**???????????? */
const RenderFormula = ({
  formElementModel,
  formItemStyles,
  name,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  name: any
}) => {
  //????????????
  const { formulaNumvalObj } = $store.getState()
  const formulaRef = useRef<any>(null)
  //push??????????????????
  const formulaFix = formElementModel.decimals || 0
  const getFormula = formElementModel.designFormulas ? JSON.parse(formElementModel.designFormulas) : {}

  if (formElementModel.designFormulas) {
    getFormula.decimals = formulaFix
    getFormula.formlaId = formElementModel.uuId
    getFormula.numberTransform = formElementModel.numberTransform
  }
  if (formulaInfo.filter(item => item.formlaId === formElementModel.uuId).length === 0) {
    formulaInfo.push(getFormula)
  } else {
    const designs = JSON.parse(formElementModel.designFormulas)
    formulaInfo = formulaInfo.map(item => {
      if (item.formlaId === formElementModel.uuId) {
        return {
          ...item,
          coord: $(`.tableRow[data-uuid="${designs.formlaId}"]`).attr('data-coord') || designs.coord,
        }
      }
      return { ...item }
    })
  }

  //??????????????????
  let showFormulaVal = ''
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    showFormulaVal = formulaNumvalObj[formElementModel.uuId]
  } else {
    showFormulaVal = formElementModel.value || ''
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
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', height: '40px' }}>
          <Input
            ref={formulaRef}
            name={formElementModel.uuId}
            maxLength={50}
            disabled={true}
            value={showFormulaVal}
            placeholder={formElementModel.placeholder}
          />
          {formElementModel.unit && <span className="unit">{formElementModel.unit}</span>}
        </div>
      </div>
    </div>
  )
}

/**
 * ???????????????????????????
 */
const handleCopyTableFormula = (parentRow: any, newRow: any) => {
  formulaInfo = formulaInfo.map(item => {
    if (item.plugType === 'table') {
      if (item.formulaMode !== '4' && item.formulaMode !== '6') {
        //???????????????????????????????????????????????????
        item.variable.map((idx: { id: string; coord: string }) => {
          //????????????????????????????????????
          const hasRowArr = parentRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )
          if (hasRowArr.length !== 0 && idx.coord.split(',')[0] != item.coord.split(',')[0]) {
            const copyRow = hasRowArr[0].coord.split(',')[1]
            const newVariableItem = {
              id: newRow[copyRow].formElementModel.uuId,
              name: newRow[copyRow].formElementModel.name,
              plugType: 'table',
              sort: item.variable.length,
              coord: newRow[copyRow].coord,
            }

            if (!isIn(newRow[copyRow].formElementModel.uuId, item.variable)) {
              // ??????uuId??????????????????
              item.variable.push(newVariableItem)
            }
          }
        })
      } else if (item.formulaMode === '4') {
        //????????????????????????????????????????????????????????????????????? v0 * v1  --> (v0 + v2) * v1
        item.formulaMode = '6'
        let newFormula = ''
        item.variable.map((_item: any, index: number) => {
          if (index < item.variable.length - 1) {
            newFormula += `v${index}*`
          } else {
            newFormula += `v${index}`
          }
        })
        item.formula = newFormula
        item.variable.map((idx: { id: string; coord: string }, index: number) => {
          //????????????????????????????????????
          const hasRowArr = parentRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )
          if (hasRowArr.length !== 0 && idx.coord.split(',')[0] != item.coord.split(',')[0]) {
            const copyRow = hasRowArr[0].coord.split(',')[1]
            const newVariableItem = {
              id: newRow[copyRow].formElementModel.uuId,
              name: newRow[copyRow].formElementModel.name,
              plugType: 'table',
              sort: item.variable.length,
              coord: newRow[copyRow].coord,
            }
            item.variable.push(newVariableItem)
            const regStr = new RegExp('v' + index, 'g')
            item.formula = item.formula.replace(regStr, `(v${index}+v${item.variable.length - 1})`)
            // let regStr = new RegExp('v' + m, 'g')
            // val.formula = val.formula.replace(regStr, `(v${m}+v${_len})`)
          }
        })
      } else if (item.formulaMode === '6') {
        item.variable.map((idx: { id: string; coord: string }, index: number) => {
          //????????????????????????????????????
          const hasRowArr = parentRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )
          if (hasRowArr.length !== 0 && idx.coord.split(',')[0] != item.coord.split(',')[0]) {
            const copyRow = hasRowArr[0].coord.split(',')[1]
            const newVariableItem = {
              id: newRow[copyRow].formElementModel.uuId,
              name: newRow[copyRow].formElementModel.name,
              plugType: 'table',
              sort: item.variable.length,
              coord: newRow[copyRow].coord,
            }

            item.variable.push(newVariableItem)
            // const regStr = new RegExp('v' + index, 'g')
            const regStr = 'v' + index + '(?![0-9])'
            const reg = new RegExp(regStr, 'g')

            item.formula = item.formula.replace(reg, `(v${index}+v${item.variable.length - 1})`)
          }
        })
      }
    } else {
      // ?????????????????????
      if (item.formulaMode !== '4' && item.formulaMode !== '6') {
        //???????????????????????????????????????????????????
        item.variable.map((idx: { id: string; coord: string }) => {
          //????????????????????????????????????
          const hasRowArr = parentRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )
          if (hasRowArr.length !== 0) {
            const copyRow = hasRowArr[0].coord.split(',')[1]
            const newVariableItem = {
              id: newRow[copyRow].formElementModel.uuId,
              name: newRow[copyRow].formElementModel.name,
              plugType: 'table',
              sort: item.variable.length,
              coord: newRow[copyRow].coord,
            }

            item.variable.push(newVariableItem)
          }
        })
      } else if (item.formulaMode === '4') {
        //????????????????????????????????????????????????????????????????????? v0 * v1  --> (v0 + v2) * v1
        item.formulaMode = '6'
        let newFormula = ''
        item.variable.map((_item: any, index: number) => {
          if (index < item.variable.length - 1) {
            newFormula += `v${index}*`
          } else {
            newFormula += `v${index}`
          }
        })
        item.formula = newFormula
        item.variable.map((idx: { id: string; coord: string }, index: number) => {
          //????????????????????????????????????
          const hasRowArr = parentRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )
          if (hasRowArr.length !== 0) {
            const copyRow = hasRowArr[0].coord.split(',')[1]
            const newVariableItem = {
              id: newRow[copyRow].formElementModel.uuId,
              name: newRow[copyRow].formElementModel.name,
              plugType: 'table',
              sort: item.variable.length,
              coord: newRow[copyRow].coord,
            }
            item.variable.push(newVariableItem)
            const regStr = new RegExp('v' + index, 'g')
            item.formula = item.formula.replace(regStr, `(v${index}+v${item.variable.length - 1})`)
          }
        })
      } else if (item.formulaMode === '6') {
        item.variable.map((idx: { id: string; coord: string }, index: number) => {
          //????????????????????????????????????
          const hasRowArr = parentRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )
          if (hasRowArr.length !== 0) {
            const copyRow = hasRowArr[0].coord.split(',')[1]
            const newVariableItem = {
              id: newRow[copyRow].formElementModel.uuId,
              name: newRow[copyRow].formElementModel.name,
              plugType: 'table',
              sort: item.variable.length,
              coord: newRow[copyRow].coord,
            }

            item.variable.push(newVariableItem)
            const regStr = 'v' + index + '(?![0-9])'
            const reg = new RegExp(regStr, 'g')
            // const regStr = new RegExp('v' + index, 'g')

            item.formula = item.formula.replace(reg, `(v${index}+v${item.variable.length - 1})`)
          }
        })
      }
    }

    return item
  })
}

/**
 * ????????????????????????
 */
const handleDelFormula = (delRow: any) => {
  //????????????????????????

  formulaInfo = formulaInfo.map(item => {
    let newDeisgnVariable = item.variable
    if (item.plugType === 'table') {
      if (item.formulaMode !== '6') {
        //????????????????????????
        item.variable.map((idx: { id: string; coord: string }) => {
          const hasRowArr = delRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )
          if (hasRowArr.length !== 0 && idx.coord.split(',')[0] != item.coord.split(',')[0]) {
            newDeisgnVariable = newDeisgnVariable.filter((d: any) => d.id != hasRowArr[0].formElementModel.uuId)
            return false
          }
        })
      } else {
        //?????????????????????????????????
        let splicV: number | null = null //?????????????????????
        item.variable.map((idx: { id: string; coord: string }, index: number) => {
          const hasRowArr = delRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )
          if (hasRowArr.length !== 0 && idx.coord.split(',')[0] != item.coord.split(',')[0]) {
            newDeisgnVariable = newDeisgnVariable.filter((d: any) => d.id != hasRowArr[0].formElementModel.uuId)
            splicV = index
            return false
          }
        })
        if (splicV) {
          const regStr = new RegExp(`\\+v${splicV}`, 'g')
          item.formula = item.formula
            .replace(regStr, '')
            .replace(/v(\d{1,9})/g, function(str: any, $1: string | number) {
              if (splicV && $1 > splicV) {
                return 'v' + (Number($1) - 1)
              }
              return str
            })
        }
      }
    } else {
      if (item.formulaMode !== '6') {
        //????????????????????????
        item.variable.map((idx: { id: string; coord: string }) => {
          const hasRowArr = delRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )

          if (hasRowArr.length !== 0) {
            newDeisgnVariable = newDeisgnVariable.filter((d: any) => d.id != hasRowArr[0].formElementModel.uuId)
            return false
          }
        })
      } else {
        //?????????????????????????????????
        let splicV: number | null = null //?????????????????????
        item.variable.map((idx: { id: string; coord: string }, index: number) => {
          const hasRowArr = delRow.filter(
            (child: { formElementModel: { uuId: string } }) =>
              child.formElementModel && child.formElementModel.uuId === idx.id
          )
          if (hasRowArr.length !== 0) {
            newDeisgnVariable = newDeisgnVariable.filter((d: any) => d.id != hasRowArr[0].formElementModel.uuId)
            splicV = index
            return false
          }
        })
        if (splicV) {
          const regStr = new RegExp(`\\+v${splicV}`, 'g')
          item.formula = item.formula
            .replace(regStr, '')
            .replace(/v(\d{1,9})/g, function(str: any, $1: string | number) {
              if (splicV && $1 > splicV) {
                return 'v' + (Number($1) - 1)
              }
              return str
            })
        }
      }
    }

    item.variable = newDeisgnVariable

    return item
  })

  //????????????????????????
  delRow.map((item: { formElementModel: { type: string; uuId: any } }) => {
    if (item.formElementModel && item.formElementModel.type === 'formula') {
      formulaInfo = formulaInfo.filter(idx => idx.formlaId !== item.formElementModel.uuId)
      return false
    }
  })
}

//??????????????????
const RenderTable = ({
  formElementModel,
  teamId,
  eventId,
  changeData,
  name,
  state,
}: {
  formElementModel: FormElementModelProps
  teamId: number
  eventId: number
  changeData?: (item: any, value?: string, content?: string) => void
  name?: string
  state?: number
}) => {
  //???????????? ?????? ??????
  const { colNum, tableElements, widthArrPx, tableArr, duplicate, heightArr } = formElementModel
  const { selectApprovalTab, isApprovalSend } = $store.getState()
  const tableData: TableElementsItemProps[][] = []
  //???????????????
  const tableMergeArrRef = useRef<any>(null)
  tableMergeArrRef.current = JSON.parse(tableArr)
  let param: TableElementsItemProps[] = []
  //?????????????????????
  const nowTableElementsRef = useRef<any>(tableElements)
  //????????????
  const scrollTopNum = useRef<any>(0)
  //????????????????????????
  const repeatRows = useRef<any>(duplicate ? JSON.parse(duplicate) : null)
  //?????????????????????
  let paddingLeftPx =
    (selectApprovalTab === 'triggerApproval' || isApprovalSend) && repeatRows.current?.length != 0 ? 50 : 10
  if (state && state !== 7) {
    paddingLeftPx = 0
  }
  useEffect(() => {
    nowTableElementsRef.current = tableElements
    const { executeData } = $store.getState()
    if (executeData && executeData.outBackAllUuid) {
      //???????????????id??????
      const outUuids = {}
      outUuids[executeData.outBackAllUuid[0]] = executeData.outBackAllUuid
      $store.dispatch({ type: 'SET_OUT_BACK_IDS', data: outUuids })
    }
  }, [tableElements])

  useEffect(() => {
    $('.ant-tabs-content-holder').on('scroll', function() {
      scrollTopNum.current = $(this).scrollTop()
    })
    return () => {
      $('.ant-tabs-content-holder').remove('scroll')
    }
  }, [])

  //????????????????????????????????????
  tableElements
    .filter((item: { coord: string }) => parseInt(item.coord.split(',')[1]) < colNum)
    .map((item: TableElementsItemProps, index: number) => {
      if (item.formElementModel && !item.formElementModel.uuId) {
        item.formElementModel.uuId = Maths.uuid()
      }
      if (index % colNum < colNum - 1) {
        param.push(item)
      } else {
        param.push(item)
        tableData.push(param)
        param = []
      }
    })

  //??????????????????????????????
  useEffect(() => {
    const timer = setTimeout(async () => {
      //??????????????????
      const delRows = repeatRows.current?.filter((idx: { type: string }) => idx.type === 'del')
      //????????????????????????????????????
      if (delRows?.length > 0) {
        formulaInfo = formulaInfo.filter(
          idx => $(`.tableRow[data-uuid="${idx.formlaId}"]`).attr('data-newadd') === '0'
        )
      }
      delRows?.map((item: { rowspan: any; startRow: any; parentRow: any }) => {
        //????????????
        const rowspan = item.rowspan
        //??????????????????
        const row = item.startRow
        //???????????????
        const parentRowNum = item.parentRow
        //?????????????????????????????????????????????????????????
        const parentRowObj = nowTableElementsRef.current.filter(
          (idx: { coord: string }) => parseInt(idx.coord.split(',')[0]) === parentRowNum
        )
        //??????????????????
        const copyRowInfo = nowTableElementsRef.current.filter(
          (idx: any) => parseInt(idx.coord.split(',')[0]) === row
        )
        //??????????????????
        const newRow = parentRowObj.map((idx: { coord: string; formElementModel: any }) => {
          const nowCoordCol = parseInt(idx.coord.split(',')[1])
          const newCoord = row + ',' + nowCoordCol
          const newUuid = copyRowInfo[nowCoordCol].formElementModel
            ? copyRowInfo[nowCoordCol].formElementModel.uuId
            : ''
          const newDesignFormula = formulaInfo.filter(
            idx =>
              parentRowObj[nowCoordCol].formElementModel &&
              idx.formlaId === parentRowObj[nowCoordCol].formElementModel.uuId
          )
          if (!idx.formElementModel) {
            return {
              ...idx,
              formElementModel: null,
              coord: newCoord,
              isCopyRow: true,
            }
          }
          return {
            ...idx,
            formElementModel: {
              ...idx.formElementModel,
              designFormulas: newDesignFormula.length > 0 ? JSON.stringify(newDesignFormula[0]) : '',
              value: '', //????????????????????????
              uuId: newUuid,
              parentUuId: parentRowObj[nowCoordCol].formElementModel
                ? parentRowObj[nowCoordCol].formElementModel.uuId
                : '',
            },
            coord: newCoord,
            isCopyRow: true,
          }
        })
        //?????????????????????????????????
        newRow.map((item: any) => {
          if (item.formElementModel && item.formElementModel.type === 'formula') {
            const newFormulaInfoItem = JSON.parse(
              JSON.stringify(JSON.parse(item.formElementModel.designFormulas))
            )
            newFormulaInfoItem.variable.map((idx: { plugType: string; coord: string; id: string }) => {
              //??????????????????????????????????????????uuid
              if (idx.plugType === 'table') {
                const coordNow = $(`.tableRow[data-uuid="${idx.id}"]`).attr('data-coord') || idx.coord
                const nowRowCoord = parseInt(coordNow.split(',')[0])
                const nowColCoord = parseInt(coordNow.split(',')[1])
                const newCoord = nowRowCoord + rowspan + ',' + nowColCoord
                if (nowRowCoord >= parentRowNum && nowRowCoord < parentRowNum + rowspan) {
                  idx.coord = newCoord
                  idx.id = newRow[nowColCoord].formElementModel.uuId
                }
              }
              return idx
            })
            newFormulaInfoItem.formlaId = item.formElementModel.uuId
            newFormulaInfoItem.coord = item.coord
            formulaInfo.push(newFormulaInfoItem)
          }
        })
        handleCopyTableFormula(parentRowObj, newRow)
      })
      //??????????????????
      //?????????????????????
      const updateData = {}
      let inputNumvals: any = []
      if (delRows?.length > 0) {
        formulaInfo.map(item => {
          inputNumvals = inputNumvals.concat(item.variable)
        })
        // inputNumvals.map((item: { id: string }) => {
        //   changeFormulaByFormula({ uuId: item.id, changeData: changeData, updateData: updateData })
        // })
      }
      changeTableCopyInfo({ repeatRows, nowTableElementsRef, colNum, tableMergeArrRef, heightArr })
      changeFormulaByFormula({
        uuId: '',
        changeData: changeData,
        updateData: updateData,
        istype: 'recalculation',
      })
      changeData && changeData({ data: updateData })
    }, 200)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  const testnowParentRow = (startRow: any, type: string) => {
    const newRepeatRow = repeatRows.current.map((item: any) => {
      let _parentRow = item.parentRow
      if (startRow <= item.startRow && item.type == 'del') {
        _parentRow = type === 'add' ? _parentRow + 1 : _parentRow - 1
        return {
          ...item,
          parentRow: _parentRow,
        }
      } else {
        return { ...item }
      }
    })
    repeatRows.current = [...newRepeatRow]
  }
  /**
   * ?????????????????????
   * @param row ????????????
   */
  //??????????????????????????????
  let repeatAddArr: any[] = []
  const addCopyRow = async (_row: number, rowspan: number) => {
    let row = _row
    const brotherArr = repeatAddArr.filter(idx => idx.startRow === row)
    const nowParentRow = row
    //???????????????
    if (brotherArr.length === 0) {
      repeatAddArr.push({
        startRow: row,
        hasChild: 0,
      })
    } else {
      repeatAddArr = repeatAddArr.map(idx => {
        // ???????????????

        if (idx.startRow === row) {
          idx.hasChild += 1
        }
        if (idx.startRow > row) {
          testnowParentRow(idx.startRow, 'add')

          // ??????????????????????????????????????????????????????+1
          idx.startRow += 1
        }
        return idx
      })
    }
    //???????????????????????????  brotherArr[0].hasChild * rowspan ??????????????????????????????
    const brotherNum = brotherArr.length === 0 ? 0 : brotherArr[0].hasChild * rowspan
    //?????????????????????
    row += brotherNum

    //????????????????????????
    const parentRow = nowTableElementsRef.current.filter(
      (item: { coord: string }) =>
        parseInt(item.coord.split(',')[0]) >= nowParentRow &&
        parseInt(item.coord.split(',')[0]) <= nowParentRow + rowspan - 1
    )

    //?????????????????????
    const newRow: any = getNewRow(parentRow, brotherArr, formulaInfo, row, rowspan, repeatAddArr)
    if (!newRow) {
      if (brotherArr.length === 0) {
        repeatAddArr = []
      } else {
        repeatAddArr = repeatAddArr.map(idx => {
          // ???????????????
          if (idx.startRow === row) {
            idx.hasChild = idx.hasChild - 1
          }
          return idx
        })
      }
      return false
    }
    // ??????????????????????????????????????????????????????????????????????????????????????????
    checkRepeatOnly(newRow, parentRow)

    //??????????????????????????????????????????
    const prevTableData = getRepeatRowPrev({ nowTableElementsRef, row, rowspan })
    //??????????????????????????????????????????
    const nextTableData = getNextTableData({ nowTableElementsRef, row, rowspan })
    //???????????????????????????,????????????
    const newMergeArr: any[] = []
    tableMergeArrRef.current.map((item: { row: number; col: any; rowspan: any; colspan: any }) => {
      if (item.row >= row && item.row < row + rowspan) {
        const newMerge = {
          row: item.row + rowspan,
          col: item.col,
          rowspan: item.rowspan,
          colspan: item.colspan,
        }
        newMergeArr.push(newMerge)
      }
      if (item.row >= row + rowspan) {
        item.row = item.row + rowspan
      }
      return item
    })
    tableMergeArrRef.current = [...tableMergeArrRef.current, ...newMergeArr]
    const newTableData = [...prevTableData, ...newRow, ...nextTableData]
    nowTableElementsRef.current = newTableData

    //?????????????????????????????????
    newRow.map((item: any) => {
      if (item.formElementModel && item.formElementModel.type === 'formula') {
        const newFormulaInfoItem = JSON.parse(item.formElementModel.designFormulas)
        newFormulaInfoItem.variable.map((idx: { plugType: string; coord: string; id: string }) => {
          //??????????????????????????????????????????uuid
          if (idx.plugType === 'table') {
            const nowRowCoord = parseInt(idx.coord.split(',')[0])
            const nowColCoord = parseInt(idx.coord.split(',')[1])
            const newCoord = nowRowCoord + rowspan + ',' + nowColCoord
            if (nowRowCoord >= nowParentRow && nowRowCoord < nowParentRow + rowspan) {
              idx.coord = newCoord
              idx.id = newRow[nowColCoord].formElementModel.uuId
            }
          }
          return idx
        })
        newFormulaInfoItem.formlaId = item.formElementModel.uuId
        newFormulaInfoItem.coord = item.coord
        formulaInfo.push(newFormulaInfoItem)
      }
    })
    await handleCopyTableFormula(parentRow, newRow)
    //?????????????????????
    const newRepeatRow = repeatRows.current.map((item: { startRow: any }) => {
      const rowNum = Number(item.startRow)

      if (rowNum > row) {
        return {
          ...item,
          startRow: rowNum + rowspan,
        }
      } else {
        return { ...item }
      }
    })
    scrollTopNum.current = $('.approval-detail-content .ant-tabs-content-holder').scrollTop()
    const nowTableDataInfo: any[] = []
    let nowParam: any = []
    //????????????????????????????????????
    nowTableElementsRef.current
      .filter((item: { coord: string }) => parseInt(item.coord.split(',')[1]) < colNum)
      .map((item: TableElementsItemProps, index: number) => {
        if (index % colNum < colNum - 1) {
          nowParam.push(item)
        } else {
          nowParam.push(item)
          nowTableDataInfo.push(nowParam)
          nowParam = []
        }
      })

    repeatRows.current = [
      ...newRepeatRow,
      {
        startRow: row + rowspan,
        rowspan: rowspan,
        type: 'del',
        parentRow: nowParentRow,
      },
    ]
    // ??????????????????
    tableRef.current?.hotInstance.updateSettings(
      {
        mergeCells: tableMergeArrRef.current,
        data: nowTableDataInfo,
      },
      false
    )
    //??????????????????
    $('.approval-detail-content .ant-tabs-content-holder').animate({ scrollTop: scrollTopNum.current }, 0)
    //????????????
    const nowTimer = setTimeout(() => {
      changeTableCopyInfo({ repeatRows, nowTableElementsRef, colNum, tableMergeArrRef, heightArr })
      changeNumval('0', formElementModel, changeData, 'recalculation')
      nowTimer && clearTimeout(nowTimer)
    }, 200)
  }

  /**
   * ?????????????????????
   * @param row
   */
  const delCopyRow = async (row: number, rowspan: number, parentRow?: number | undefined) => {
    //????????????
    repeatAddArr = repeatAddArr.map(idx => {
      if (idx.startRow === parentRow) {
        idx.hasChild -= 1
      }
      if (Number(idx.startRow) > Number(parentRow)) {
        testnowParentRow(idx.startRow, 'del')
      }
      if (idx.startRow > row) {
        // ??????????????????????????????????????????????????????-1
        idx.startRow -= 1
      }
      return idx
    })
    //??????????????????????????????????????????
    const prevTableData = nowTableElementsRef.current.filter(
      (item: { coord: string }) => parseInt(item.coord.split(',')[0]) < row
    )
    //???????????????
    const delTableData = nowTableElementsRef.current.filter(
      (item: { coord: string }) =>
        parseInt(item.coord.split(',')[0]) >= row && parseInt(item.coord.split(',')[0]) <= row + rowspan - 1
    )
    //??????????????????????????????????????????
    const nextTableData = nowTableElementsRef.current
      .filter((item: { coord: string }) => parseInt(item.coord.split(',')[0]) > row + rowspan - 1)
      .map((item: { coord: string }) => {
        const nowCoordRow = parseInt(item.coord.split(',')[0])
        const nowCoordCol = parseInt(item.coord.split(',')[1])
        return {
          ...item,
          coord: nowCoordRow - rowspan + ',' + nowCoordCol,
        }
      })
    //???????????????????????????,????????????
    const newTableData = [...prevTableData, ...nextTableData]
    nowTableElementsRef.current = newTableData
    // tableRef.current?.hotInstance.alter('remove_row', row, 1)
    await handleDelFormula(delTableData)
    const { outBackData } = $store.getState()
    //???????????????????????????
    const updateData = {}
    delTableData.map((item: any) => {
      if (item.formElementModel) {
        // ??????????????????
        // changeNumval('', item.formElementModel, changeData, 'recalculation')

        changeFormulaByFormula({
          uuId: item.formElementModel.uuId,
          changeData: changeData,
          istype: 'recalculation',
          updateData: updateData,
        })
        const uuId = item.formElementModel.uuId
        if (outBackData[uuId]) {
          outBackData[uuId] = null
        }
        // ????????????????????????
        delOnlySymble(uuId)
      }
    })
    const newRepeatRows = repeatRows.current
      .filter((item: { startRow: number }) => item.startRow !== row)
      .map((item: { startRow: number }) => {
        if (item.startRow > row) {
          return {
            ...item,
            startRow: item.startRow - rowspan,
          }
        }
        return { ...item }
      })
    scrollTopNum.current = $('.approval-detail-content .ant-tabs-content-holder').scrollTop()
    // setRepeatRows(newRepeatRows)
    const nowTableDataInfo: any[] = []
    let nowParam: any = []
    //????????????????????????????????????
    nowTableElementsRef.current
      .filter((item: { coord: string }) => parseInt(item.coord.split(',')[1]) < colNum)
      .map((item: TableElementsItemProps, index: number) => {
        if (index % colNum < colNum - 1) {
          nowParam.push(item)
        } else {
          nowParam.push(item)
          nowTableDataInfo.push(nowParam)
          nowParam = []
        }
      })
    repeatRows.current = newRepeatRows
    //????????????
    tableMergeArrRef.current = tableMergeArrRef.current
      .filter((idx: { row: number }) => idx.row !== row)
      .map((item: { row: number }) => {
        if (item.row > row) {
          item.row = item.row - rowspan
        }
        return item
      })
    //????????????
    tableRef.current?.hotInstance.updateSettings(
      {
        mergeCells: tableMergeArrRef.current,
        data: nowTableDataInfo,
      },
      false
    )
    //??????????????????
    $('.approval-detail-content .ant-tabs-content-holder').animate({ scrollTop: scrollTopNum.current }, 0)
    //????????????
    const nowTimer = setTimeout(() => {
      changeTableCopyInfo({ repeatRows, nowTableElementsRef, colNum, tableMergeArrRef, heightArr })
      changeData && changeData({ data: updateData })

      nowTimer && clearTimeout(nowTimer)
    }, 50)
  }
  //?????????????????????????????????
  const renderRepeatBtn = (title: string, row: number, rowspan: number, parentRow: number | undefined) => {
    return (
      <div
        className="addTableRow"
        onClick={() => {
          title === '??????' ? addCopyRow(row, rowspan) : delCopyRow(row, rowspan, parentRow)
        }}
      >
        {title}
      </div>
    )
  }
  //?????????????????????????????????
  const ShowTableItem = (props: any) => {
    if (!props.value) {
      return null
    }
    //???????????????
    const repeatData = repeatRows.current
      ? repeatRows.current.filter((item: { startRow: string }) => item.startRow == props.row)
      : []
    //????????????
    const coord = props.row + ',' + props.col
    //?????????????????????????????????
    let hasReportBtn =
      (selectApprovalTab === 'triggerApproval' || isApprovalSend) && repeatData.length !== 0 && props.col === 0
    if (state && state !== 7) {
      hasReportBtn = false
    }
    //??????????????????
    if (props.value && props.value.formElementModel) {
      return (
        <div
          className="tableRow"
          data-elementid={props.value.id}
          data-uuid={props.value.formElementModel.uuId}
          data-newadd={props.value.isCopyRow}
          data-coord={coord}
          style={{ backgroundColor: props.value.color }}
        >
          {hasReportBtn &&
            repeatData[0].type === 'add' &&
            renderRepeatBtn(
              '??????',
              props.row,
              parseInt(repeatData[0].rowspan),
              parseInt(repeatData[0].parentRow)
            )}
          {hasReportBtn &&
            repeatData[0].type === 'del' &&
            renderRepeatBtn(
              '??????',
              props.row,
              parseInt(repeatData[0].rowspan),
              parseInt(repeatData[0].parentRow)
            )}
          {getShowFormItemByType(
            props.value.formElementModel,
            teamId,
            eventId,
            props.onChange,
            props.name,
            props.state,
            coord
          )}
        </div>
      )
    } else {
      return (
        <div
          className="tableRow none-data"
          data-elementid={props.value.id}
          data-newadd={props.value.newadd}
          data-coord={coord}
          style={{ backgroundColor: props.value.color }}
        >
          {hasReportBtn &&
            repeatData[0].type === 'add' &&
            renderRepeatBtn(
              '??????',
              props.row,
              parseInt(repeatData[0].rowspan),
              parseInt(repeatData[0].parentRow)
            )}
          {hasReportBtn &&
            repeatData[0].type === 'del' &&
            renderRepeatBtn(
              '??????',
              props.row,
              parseInt(repeatData[0].rowspan),
              parseInt(repeatData[0].parentRow)
            )}
        </div>
      )
    }
  }
  //?????????????????????????????????
  const getList = (len: number) => [...new Array(len).keys()]
  const tableColumns: any[] = []
  //??????????????????
  const hotSettings: Handsontable.GridSettings = {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: false,
    allowEmpty: true,
    readOnly: true,
    stretchH: 'none',
    className: 'formTableTd',
    autoColumnSize: false,
    autoRowSize: false,
    outsideClickDeselects: false,
    mergeCells: tableMergeArrRef.current,
    viewportRowRenderingOffset: 200,
    copyPaste: false,
    height: 'auto',
    beforeOnCellMouseDown: (e: any) => {
      e.stopImmediatePropagation()
    },
  }
  const parseWidths = widthArrPx ? JSON.parse(widthArrPx) : []
  const tableRef = useRef<HotTable>(null)
  return (
    <div id="form-table" key={formElementModel.id} style={{ paddingLeft: paddingLeftPx }}>
      <HotTable ref={tableRef} settings={hotSettings}>
        {getList(colNum).map((_item, index: number) => (
          <HotColumn
            key={index}
            currentColClassName="form-col"
            className="form-td"
            width={parseWidths[index] || 200}
            readOnly={true}
            allowHtml={true}
          >
            <ShowTableItem hot-renderer name={name} state={state} onChange={changeData} />
          </HotColumn>
        ))}
      </HotTable>
    </div>
  )
}

export default ApprovalTable

//??????????????????????????????
export const changeTableCopyInfo = (data: any) => {
  let param: TableElementsItemProps[] = []
  const { repeatRows, nowTableElementsRef, colNum, tableMergeArrRef, heightArr } = data

  //??????????????????????????????
  const copyRows: any = []
  repeatRows.current
    ?.filter((idx: { type: string }) => idx.type === 'del')
    .map((item: { startRow: any; rowspan: any }) => {
      if (Number(item.rowspan) < 1) {
        copyRows.push(item.startRow)
      }
      for (let i = 0; i < item.rowspan; i++) {
        // ?????????????????? ???????????????
        copyRows.push(item.startRow + i)
      }
    })
  const valueArr: any = []
  const { nowFormulaInfo } = $store.getState()
  nowTableElementsRef.current.map((item: { coord: string; formElementModel: any }) => {
    const nowCoord = parseInt(item.coord.split(',')[0])
    if (copyRows?.includes(nowCoord)) {
      if (!item.formElementModel) {
        valueArr.push({
          uuId: Maths.uuid(),
          elementValue: '',
          valueContent: '',
        })
      } else {
        const valueObjArr = nowFormulaInfo.newaddValues.filter(idx => idx.uuId === item.formElementModel.uuId)
        valueArr.push({
          uuId: item.formElementModel.uuId,
          elementValue:
            valueObjArr.length > 0 ? valueObjArr[0].elementValue : item.formElementModel.value || '',
          valueContent:
            valueObjArr.length > 0 ? valueObjArr[0].valueContent : item.formElementModel.value || '',
        })
      }
    }
  })
  //?????????????????????????????????
  nowTableElementsRef.current.map((item: { formElementModel: { uuId: any; designFormulas: string } }) => {
    if (item.formElementModel) {
      const newDesignFormula = formulaInfo.filter(
        idx => item.formElementModel && idx.formlaId === item.formElementModel.uuId
      )
      if (newDesignFormula.length !== 0) {
        item.formElementModel.designFormulas = JSON.stringify(newDesignFormula[0])
      }
    }
    return item
  })
  //??????????????????

  formulaInfo = formulaInfo.map(item => {
    item.variable.map((idx: { coord: string; id: any }) => {
      idx.coord = $(`.tableRow[data-uuid="${idx.id}"]`).attr('data-coord') || idx.coord
    })
    item.coord = $(`.tableRow[data-uuid="${item.formlaId}"]`).attr('data-coord') || item.coord
    return item
  })
  //????????????????????????????????????
  const tableDataNum: any[][] = []
  nowTableElementsRef.current
    .filter((item: { coord: string }) => parseInt(item.coord.split(',')[1]) < colNum)
    .map((item: TableElementsItemProps, index: number) => {
      if (item.formElementModel && !item.formElementModel.uuId) {
        item.formElementModel.uuId = Maths.uuid()
      }
      if (index % colNum < colNum - 1) {
        param.push(item)
      } else {
        param.push(item)
        tableDataNum.push(param)
        param = []
      }
    })

  //?????????????????????
  $store.dispatch({
    type: 'SET_APPROVAL_FORMULA_INFO',
    data: {
      formulaInfo,
      newaddValues: valueArr,
      rowNum: tableDataNum.length,
      tableArr: JSON.stringify(tableMergeArrRef.current),
      heightArr,
      tableElements: nowTableElementsRef.current,
    },
  })
}

import { message } from 'antd'
import React, { useRef, useState } from 'react'
import { Set, Rect, Text } from 'react-raphael'

export interface NodeProps {
  width: number
  height: number
  position: {
    x: number
    y: number
  }
  text: string
  name: string
  type: string
  nodeType: string
  condition: string
  variable: string
  noticeUsers: any
  approvalType: number
  resourceId: string
  id: string
  value: string
  approvalName: string
  relationEvent: string
  childShapes: any
  hasRedBorder?: boolean
  outId: { resourceId: string }[]
  approvalId?: any
  mouseover?: any
  mouseleave?: any
  historyProcess: any
}

interface InsertTextProps {
  x: number
  y: number
  width: number
  height: number
  str: string
  color?: string
  fillColor?: string
}

//流程节点组件
const ProcessNode = (props: NodeProps) => {
  const {
    width,
    height,
    position,
    text,
    type,
    hasRedBorder,
    resourceId,
    approvalId,
    approvalName,
    mouseover,
    mouseleave,
    historyProcess,
  } = props
  const hoverRef = useRef<any>(null)
  //计算文字居中位置
  const center = {
    x: position.x + width / 2,
    y: position.y + height / 2,
  }
  //文本样式
  const textFillObj = {
    fill: '#fff',
    'font-size': 12,
  }
  //设置节点基础样式
  let rectFillObj = {}
  if (type === 'StartNoneEvent') {
    rectFillObj = {
      fill: '#4285f4',
      stroke: '#4285f4',
      'stroke-width': 2,
    }
  } else if (type === 'EndNoneEvent') {
    rectFillObj = {
      fill: '#ccc',
      stroke: '#b3b3b3',
      'stroke-width': 2,
    }
  } else {
    rectFillObj = {
      fill: '#fff',
      stroke: '#e6e6e6',
      'stroke-width': 1,
    }
  }
  // historyProcess.currentHighlight 当前审批节点颜色高亮

  return (
    <Set>
      <Rect
        width={width + 6}
        height={height + 6}
        x={position.x - 3}
        y={position.y - 3}
        r={8}
        attr={{
          stroke: historyProcess?.currentHighlight?.includes(resourceId) ? 'rgb(251, 188, 5)' : '#f77e7a',
          'stroke-width': historyProcess?.currentHighlight?.includes(resourceId) ? 2.5 : 2,
        }}
        hide={!hasRedBorder}
      />
      <Rect width={width} height={height} x={position.x} y={position.y} r={8} attr={rectFillObj} />
      <Text toBack={true} x={center.x} y={center.y} text={text} attr={textFillObj} hide={text === ''} />
      {type !== 'StartNoneEvent' && type !== 'EndNoneEvent' && (
        <>
          <RenderUserNode {...props} />
          <Rect
            ref={hoverRef}
            width={width + 6}
            height={height + 6}
            x={position.x - 3}
            y={position.y - 3}
            r={8}
            attr={{ stroke: 'transparent', fill: 'transparent' }}
            toFront={true}
            mouseover={(e: any) => {
              mouseover(e.x, e.y, resourceId, approvalName, approvalId)
            }}
            mouseout={() => {
              mouseleave()
            }}
          />
        </>
      )}
    </Set>
  )
}

//给矩形节点添加居中文本节点
const InsertRectText = (props: InsertTextProps) => {
  const { x, y, width, height, str, color, fillColor } = props
  let newStr = ''
  if (str.length * 12 > 132) {
    newStr = str.substring(0, 11) + '…'
  } else {
    newStr = str
  }
  console.log(window.location.hash)
  return (
    <Set toBack={true}>
      <Rect
        x={x}
        y={window.location.hash == '#/approval' ? y : y - 4}
        width={width}
        height={height}
        r={2}
        attr={{ stroke: color || 'none', fill: fillColor || 'none', dy: 0, 'fill-opacity': '1', opacity: '1' }}
      ></Rect>
      <Text
        x={x + width / 2}
        y={y + height / 2}
        text={newStr}
        attr={{
          fill: color || '#4285f4',
          'font-size': '12px',
          transform: ' matrix(1, 0, 0, 1, 0, -3)',
          'fill-opacity': '1',
          opacity: '1',
        }}
      ></Text>
    </Set>
  )
}

//给矩形增加居左文字
const InsertRectTextLeft = (props: InsertTextProps) => {
  const { x, y, height, str, color } = props
  let newStr = ''
  let ellispisLen = 0
  if (str.length > 8) {
    newStr = str.substring(0, 8) + '…'
    ellispisLen = 1
  } else {
    newStr = str
  }
  const numLen = newStr.replace(/[^0-9]/gi, '').length
  const stringLen = newStr.replace(/[^a-zA-Z]/gi, '').length
  const symbolLen = newStr.replace(/[^,|\(\))]/gi, '').length
  const longLen = newStr.length - numLen - stringLen - symbolLen
  const newX = x + (longLen - ellispisLen) * 6 + (numLen + stringLen) * 4 + symbolLen * 3 + 30
  return (
    <Text
      toBack={true}
      x={newX}
      y={y + height / 2}
      text={newStr}
      attr={{ fill: color || '#808080', 'font-size': '12px' }}
    ></Text>
  )
}

//渲染审批节点中显示的内容
const RenderUserNode = (props: NodeProps) => {
  const {
    width,
    position,
    nodeType,
    noticeUsers,
    approvalName,
    name,
    childShapes,
    relationEvent,
    approvalType,
    resourceId,
  } = props

  //审批节点类型展示
  const isRelation = relationEvent
  let showTypeTxt = ''
  if (nodeType === 'None') {
    showTypeTxt = isRelation !== null && isRelation !== '' ? '核定' : '或签'
  } else if (nodeType === 'Parallel' && approvalType === 0) {
    showTypeTxt = '会签'
  } else if (nodeType === 'Parallel' && approvalType === 1) {
    showTypeTxt = '协同'
  } else if (nodeType == 'DefineUser') {
    showTypeTxt = '指定'
  } else {
    showTypeTxt = '自定义'
  }
  //显示审批类型
  let showApprovalTypeTxt = '审'
  if (approvalType == 1) {
    showApprovalTypeTxt = '协'
  }
  //审批节点的y坐标
  let approvalNodePosY = position.y + 8
  if (noticeUsers && noticeUsers.length !== 0) {
    approvalNodePosY = position.y
  }
  //加签节点y坐标
  let addSignH = approvalNodePosY + 47
  if (childShapes && childShapes.length !== 0 && noticeUsers && noticeUsers.length !== 0) {
    addSignH = approvalNodePosY + 67
  }
  return (
    <Set toBack={true}>
      <Rect
        x={position.x}
        y={position.y}
        width={width}
        height={30}
        r={8}
        attr={{ fill: '#4285f4', stroke: 'none' }}
      />
      <Rect
        x={position.x}
        y={position.y + 22}
        width={8}
        height={8}
        attr={{ fill: '#4285f4', stroke: 'none' }}
      ></Rect>
      <Rect
        x={position.x + 160}
        y={position.y + 22}
        width={8}
        height={8}
        attr={{ fill: '#4285f4', stroke: 'none' }}
      ></Rect>
      <Text
        x={position.x + width / 2}
        y={position.y + 20}
        text={name}
        attr={{ fill: '#fff', 'font-size': 12 }}
      />
      {/* 审批节点 */}
      <InsertRectText
        x={position.x + 8}
        y={approvalNodePosY + 40}
        width={16}
        height={16}
        color={'#4285f4'}
        str={showApprovalTypeTxt}
      />
      <InsertRectTextLeft
        x={position.x}
        y={approvalNodePosY + 27}
        width={width}
        height={42}
        str={approvalName}
      />
      {/* 知会节点 */}
      {noticeUsers && noticeUsers.length !== 0 && (
        <>
          <InsertRectText
            x={position.x + 8}
            y={approvalNodePosY + 60}
            width={16}
            height={16}
            color={'#4285f4'}
            str={'知'}
          />
          <InsertRectTextLeft
            x={position.x}
            y={approvalNodePosY + 47}
            width={width}
            height={42}
            str={noticeUsers
              .map((idx: string) => {
                return idx.split('#')[2]
              })
              .join(',')}
          />
        </>
      )}
      {/* 加签节点 */}
      {childShapes && childShapes.length !== 0 && childShapes[0].split('#').length == 3 && (
        <>
          <InsertRectText
            x={position.x + 8}
            y={addSignH + 13}
            width={16}
            height={16}
            color={'#4285f4'}
            str={'加'}
          />
          <InsertRectTextLeft
            x={position.x}
            y={addSignH}
            width={width}
            height={42}
            str={childShapes[0].split('#')[2] || ''}
          />
        </>
      )}
      <InsertRectText
        x={position.x + 126}
        y={position.y + 72}
        width={36}
        height={22}
        str={showTypeTxt}
        fillColor={'#eff8ff'}
      />
    </Set>
  )
}

export default ProcessNode

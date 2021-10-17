import React, { useRef, useEffect, useMemo, useState } from 'react'
import { Paper, Path, Image } from 'react-raphael'
import './ApprovalWorkFlow.less'
import { ActModelProps } from '@/src/views/approval/components/ApprovalDettail'
import ProcessNode from './process-node'
import { message, Modal, Spin, Tooltip } from 'antd'
import { useMergeState } from '@/src/views/approval-execute/ApprovalExecute'
import { Rnd } from 'react-rnd'
import * as Maths from '@/src/common/js/math'
interface ParentProp {
  dataSource: ActModelProps[]
  historyProcess: any
  approvalId?: number
  branchVarLists?: any //处理审批流程展示icon的详情列表---数据类型处理
  trigger?: any //触发审批时--无mouseNode接口查询
  selectkey?: any
}

interface PathProps {
  id: string
  pathStr: string
  pathColor: string
}
let branchInfoModelList: any = []
/**
 * 判断元素是否在数组中存在
 */
const isInSequence = (arr: { resourceId: string }[], val: string) => {
  let isIn = false
  $.each(arr, (i, item) => {
    if (item.resourceId == val) {
      isIn = true
      return
    }
  })
  return isIn
}

/**
 * 判断元素是否在数组中
 */
const isInArray = (arr: any[], val: any) => {
  let isIn = false
  $.each(arr, (i, item) => {
    if (item == val) {
      isIn = true
      return
    }
  })
  return isIn
}
/**
 * 根据线条数据匹配节点
 */
const getDataInfoByFlow = async (arr: any[]) => {
  return new Promise(resolve => {
    const newArr = arr.concat([])
    const handleDataInfo: any[] = []
    //遍历数组
    if ($.isEmptyObject(startNode)) {
      return handleDataInfo
    }
    //获取分组数量
    const groupNums: any[] = []
    //是否有加签
    const addSignArr: any[] = []
    //
    $.each(newArr, (i, item) => {
      if (
        item.level &&
        item.stencil.id == 'UserTask' &&
        item.level != '' &&
        !isInArray(groupNums, item.level.split('###')[0])
      ) {
        groupNums.push(item.level.split('###')[0])
      }
      if (
        item.stencil.id == 'UserTask' &&
        item.childShapes &&
        item.childShapes.length !== 0 &&
        item.childShapes[0] !== '事后加签'
      ) {
        addSignArr.push(item.resourceId)
      }
    })
    if (groupNums.length != 0) {
      //处理后数据集合
      $.each(groupNums, (i, idx) => {
        const nowData: any = []
        $.each(newArr, (j, item) => {
          if (item.stencil.id == 'UserTask' && item.level && item.level.split('###')[0] == idx) {
            const isHasChild = item.level.split('###')[1] || []
            let childData = null
            if (isHasChild && isHasChild !== '[]' && isHasChild.length !== 0) {
              childData = updateChildShapes(JSON.parse(isHasChild), newArr)
            }
            const newObj = {
              childrenData: childData || [],
              ...item,
            }
            nowData.push(newObj)
          }
        })
        handleDataInfo.push(nowData)
      })
    }
    handleDataInfo.map(item => {
      //比对加签节点
      setChildShapes(item, addSignArr, newArr)
    })
    resolve(handleDataInfo)
  })
}

//更新多层节点事前加签
const updateChildShapes = (childrenData: any[], nodeArr: any[]) => {
  const newChildrenData = childrenData.concat([])
  newChildrenData.map((item: any) => {
    const newItem = item.map((idx: any) => {
      const newChildShapes = nodeArr.filter(m => m.resourceId === idx.resourceId)[0].childShapes
      idx.childShapes = newChildShapes
      if (idx.childrenData.length !== 0) {
        idx.childrenData = updateChildShapes(idx.childrenData, nodeArr)
      }
      return idx
    })
    return newItem
  })
  return newChildrenData
}

//手动设置加签节点
const setChildShapes = (nodeArr: any, addSignArr: string[], newArr: any[]) => {
  if ($.isArray(nodeArr)) {
    try {
      nodeArr.forEach(function(item, i) {
        if (item.childrenData && item.childrenData.length !== 0) {
          //递归
          item.childrenData.map((idx: any) => {
            setChildShapes(idx, addSignArr, newArr)
          })
        } else if (addSignArr.includes(item.resourceId)) {
          const childItemId = addSignArr.filter(idx => idx !== item.resourceId)
          const childNodes = newArr.filter(idx => idx.resourceId === childItemId[0])
          const nowItem = newArr.filter(idx => idx.resourceId === item.resourceId)
          //更新childShapes
          if (nowItem.length !== 0) {
            item.childShapes = nowItem[0].childShapes
          }
          if (
            item.name !== '事后加签' &&
            item.childrenData &&
            item.childrenData.length === 0 &&
            childNodes.length != 0
          ) {
            item.childrenData.unshift(childNodes)
          }
          throw Error()
        } else if (item.name) {
          const nowItem = newArr.filter(idx => idx.resourceId === item.resourceId)
          if (
            nowItem.length !== 0 &&
            item.value != nowItem[0].properties.usertaskassignment.assignment.candidateUsers[0].value
          ) {
            const newValue = nowItem[0].properties.usertaskassignment.assignment.candidateUsers[0].value
            const newValueArr = newValue.split('#')
            item.value = newValue
            item.approvalName = newValueArr[2]
            item.id = newValueArr[0] + '#' + newValueArr[1]
          }
        }
      })
    } catch (e) {
      console.log(e)
    }
  }
}
/**
 * 计算所有节点的总高度
 */
const getNodeAllHeight = (data: any, _num?: number) => {
  const len = data.length
  const num = _num ? _num : 0
  _allTop += 164 * (len - num)
  $.each(data, (i, item) => {
    if (item && item.childrenData && item.childrenData.length != 0) {
      const maxChild = getMaxLenChild(item.childrenData)
      getNodeAllHeight(maxChild, 1)
    }
  })
  return _allTop
}

/**
 * 获取最多元素的节点
 */
const getMaxLenChild = (childData: any) => {
  let maxLen = 0
  let maxItem: any[] = []
  $.each(childData, (i, item) => {
    if (Array.isArray(item) && item.length > maxLen) {
      maxLen = item.length
      maxItem = item
    }
  })
  return maxItem
}

/**
 * 获取所有子元素的宽度
 * @param data
 * isLevel 是否是平级的节点
 */
const getChildAllWidth = (data: any) => {
  let _finalwidth = 0
  $.each(data, (i, item) => {
    let _width = data.length > 1 ? 245 * data.length : 245
    if (Array.isArray(item)) {
      $.each(item, (j, idx) => {
        if (idx.childrenData && idx.childrenData.length > 0) {
          _width += getChildAllWidth(idx.childrenData)
        }
      })
    }
    if (_width > _finalwidth) {
      _finalwidth = _width
    }
  })
  return _finalwidth
}

//初始数据
const rectApprovalWidth = 168 //审批节点宽度
const rectApprovalHeight = 100 //审批节点高度
const arrowWidth = 77 //箭头长度
//转换数据为可展示数据
let showData: any[] = []
//设置
let _parentX = 30 + 100 + 77
let _parentY = 250
let minTop = 0
let maxTop = 0
//开始节点
let startNode: any = null
//结束节点
let endNode: any = null
//所有节点高度
let _allTop: any = null
//层级
let _level = 0
//end节点x
let endX = 0
//end节点的父节点
let endPid: any[]
//设置流程图节点信息
const setProcessPos = (
  moke: any,
  groupIndex: any,
  commonOut?: any,
  parentTop?: any,
  parentLeft?: any,
  parentMid?: any,
  parentLevel?: any
) => {
  _allTop = 0
  if (!parentLevel) {
    _level = 0
  }
  if (moke.length === 1) {
    const newEnd = endPid
    let nowEndArr: any[] = []
    //串行
    let cLeft = _parentX
    if (parentLeft && parentLeft != 0) {
      cLeft = parentLeft
    }
    let cTop = _parentY - rectApprovalHeight * 0.5 //串行节点的y坐标
    if (parentTop && parentTop != 0) {
      cTop = parseInt(parentTop)
    }
    let midHeight: any = 0
    if (parentMid) {
      midHeight = parentMid
    }
    $.each(moke, (i, item) => {
      const nowTop = cTop
      if (nowTop < minTop) {
        minTop = nowTop
      }
      if (nowTop > maxTop) {
        maxTop = nowTop
      }
      /**
       * 对比确定end节点x坐标
       */
      if (cLeft + rectApprovalWidth + 154 > endX) {
        if (commonOut) {
          endX = cLeft + 77 * (_level + 1) + rectApprovalWidth
        } else {
          endX = cLeft + 77 + rectApprovalWidth
        }
      }
      //记录坐标
      if (cLeft + rectApprovalWidth + 77 > _parentX && !parentLeft) {
        _parentX = cLeft + rectApprovalWidth + 77
      }
      if (cLeft + rectApprovalWidth + 77 * _level > _parentX && parentLeft) {
        _parentX = cLeft + rectApprovalWidth + 77 * (_level + 1)
      }
      const _type = commonOut ? 1 : 0
      endPid = [item.resourceId]
      //如果串行下包含并行
      let nowPid
      if (item.childrenData && item.childrenData.length != 0 && item.childrenData[0].length != 0) {
        //并行中包含并行
        let showLe = 0
        item.childrenData.map((idx: string | any[], j: number) => {
          let parentL = cLeft + (rectApprovalWidth + arrowWidth) * (j + 1) + showLe * 77
          if (idx.length > 1) {
            showLe = 1
            parentL = parentL - 77
          }
          nowPid = setProcessPos(idx, undefined, item, nowTop, parentL, midHeight, _level)
        })
      } else {
        nowPid = [item.resourceId]
      }
      //记录审批节点位置
      const _val = item.properties ? item.properties.usertaskassignment.assignment.candidateUsers[0].value : ''
      const showId = _val ? _val.split('#')[0] + '#' + _val.split('#')[1] : ''

      showData.push({
        width: rectApprovalWidth,
        height: rectApprovalHeight,
        position: {
          x: cLeft,
          y: cTop,
        },
        pId: newEnd,
        approvalNodeType: _type, //节点类型
        realType: 0,
        level: _level,
        groupName: groupIndex,
        midHeight: midHeight,
        type: 'UserTask',
        approvalName: item.properties ? item.properties.name.split('#')[1] : '',
        name: item.properties ? item.properties.name.split('#')[0] : '',
        nodeType: item.properties ? item.properties.multiinstance_type : '',
        condition: item.properties ? item.properties.multiinstance_condition : '',
        variable: item.properties ? item.properties.multiinstance_variable : '',
        noticeUsers: item.noticeUsers || [],
        value: _val,
        id: showId,
        resourceId: item.resourceId,
        outId: item.outgoing,
        childrenData: [],
        relationEvent: item.relationEvent,
        touchRelationEvents: item.touchRelationEvents,
        approvalType: item.approvalType || 0,
        ...item,
      })
      nowEndArr = nowEndArr.concat(nowPid)
    })
    endPid = nowEndArr
    if (commonOut) {
      return nowEndArr
    }
  } else {
    //并行
    const newEnd = endPid
    let nowEndArr: any[] = []
    let bLeft = _parentX
    if (parentLeft && parentLeft != 0) {
      bLeft = parentLeft + 77
    }
    const allHeight = getNodeAllHeight(moke)
    let bTop = _parentY - (allHeight - 64) * 0.5
    if (parentTop && parentTop != 0) {
      bTop = parentTop + rectApprovalHeight * 0.5 - (allHeight - 64) * 0.5
    }
    let newTop = bTop
    let midHeight = newTop + (allHeight - 64) * 0.5 + '/' + moke[0].resourceId
    if (parentMid) {
      midHeight = midHeight + '#' + parentMid
    }
    $.each(moke, (i, item) => {
      let nowTop = newTop
      _allTop = 0
      if (item.childrenData && item.childrenData.length != 0 && item.childrenData[0].length > 0) {
        const maxLenChild = getMaxLenChild(item.childrenData)
        const childHeight = getNodeAllHeight(maxLenChild)
        nowTop = childHeight > 0 ? newTop + (childHeight - 164) / 2 : newTop
        newTop = nowTop + (childHeight - 164) / 2 + 164
      } else {
        newTop = nowTop + 164
      }
      if (nowTop < minTop) {
        minTop = nowTop
      }
      if (nowTop > maxTop) {
        maxTop = nowTop
      }
      /**
       * 对比确定end节点x坐标
       */
      if (bLeft + rectApprovalWidth + 77 * (_level + 3) > _parentX) {
        _parentX = bLeft + rectApprovalWidth + 77 * (_level + 3)
      }
      if (_parentX > endX) {
        endX = _parentX
      }
      let nowPid
      if (item.childrenData && item.childrenData.length != 0 && item.childrenData[0].length != 0) {
        endPid = [item.resourceId]
        //并行中包含并行
        let showLe = 0
        let moreLen = 0 //超出长度记录
        $.each(item.childrenData, (j, idx) => {
          let parentL = bLeft + rectApprovalWidth + arrowWidth + moreLen
          _level = parentLevel ? parentLevel + 1 : 1
          if (idx.length > 1) {
            showLe = 2
            moreLen += showLe * 77 + rectApprovalWidth + arrowWidth
            let childLenMax = 0
            $.each(idx, (m, n) => {
              if (n.childrenData && n.childrenData.length != 0) {
                const childL = getChildAllWidth(n.childrenData)
                childL > childLenMax ? (childLenMax = childL) : ''
              }
            })
            moreLen += childLenMax
          } else {
            showLe = 0
            moreLen += rectApprovalWidth + arrowWidth
            parentL = parentL + 77
          }
          nowPid = setProcessPos(idx, undefined, item, nowTop, parentL, midHeight, _level)
        })
      } else {
        nowPid = [item.resourceId]
      }
      const _val = item.properties ? item.properties.usertaskassignment.assignment.candidateUsers[0].value : ''
      const showId = _val ? _val.split('#')[0] + '#' + _val.split('#')[1] : ''
      showData.push({
        width: rectApprovalWidth,
        height: rectApprovalHeight,
        approvalNodeType: 1, //节点类型
        realType: 1,
        position: {
          x: bLeft + arrowWidth,
          y: nowTop,
        },
        pId: newEnd,
        level: _level,
        groupName: groupIndex,
        midHeight: midHeight,
        showMoreLine: true,
        type: 'UserTask',
        approvalName: item.properties ? item.properties.name.split('#')[1] : '',
        name: item.properties ? item.properties.name.split('#')[0] : '',
        nodeType: item.properties ? item.properties.multiinstance_type : '',
        condition: item.properties ? item.properties.multiinstance_condition : '',
        variable: item.properties ? item.properties.multiinstance_variable : '',
        noticeUsers: item.noticeUsers || [],
        value: _val,
        id: showId,
        resourceId: item.resourceId,
        outId: item.outgoing,
        childrenData: [],
        relationEvent: item.relationEvent,
        touchRelationEvents: item.touchRelationEvents,
        approvalType: item.approvalType || 0,
        ...item,
      })
      nowEndArr = nowEndArr.concat(nowPid)
    })
    endPid = nowEndArr
    if (commonOut) {
      return nowEndArr
    }
  }
}

//绘制线条
const moveArrowToRightConcurren = (prevNode: any, nextNode: any) => {
  const x = prevNode.position.x
  const y = prevNode.position.y
  const w = prevNode.width
  const h = prevNode.height
  const xNew = x + w
  const yNew = y + h * 0.5
  const xEnd = nextNode.position.x
  let xTo = xEnd - arrowWidth
  const yTop = nextNode.position.y + nextNode.height / 2
  let _path =
    'M' + xNew + ',' + yNew + 'L' + xTo + ',' + yNew + 'L' + xTo + ',' + yTop + 'L' + xEnd + ',' + yTop
  if (xNew > xTo) {
    _path = 'M' + xTo + ',' + yNew + 'L' + xNew + ',' + yNew + 'L' + xNew + ',' + yTop + 'L' + xEnd + ',' + yTop
  }
  if (Math.abs(xTo - xNew) < 30) {
    _path = 'M' + xTo + ',' + yNew + 'L' + xEnd + ',' + yTop
  }
  const isShowPrev = nextNode.showMoreLine
  const rectPrevMid = prevNode.midHeight
  const rectNextMid = nextNode.midHeight
  const prevGroupName = prevNode.groupName
  const nextGroupName = nextNode.groupName
  const prevRealType = prevNode.realType
  const nextRealType = nextNode.realType
  if (isShowPrev) {
    //并行前新增节点到并行中
    const mid = rectNextMid
      .toString()
      .split('#')[0]
      .split('/')[0]
    if (xTo <= xNew + arrowWidth * 2) {
      _path =
        'M' +
        xNew +
        ',' +
        yNew +
        'L' +
        (xTo - arrowWidth) +
        ',' +
        yNew +
        'L' +
        (xTo - arrowWidth) +
        ',' +
        mid +
        'L' +
        xTo +
        ',' +
        mid +
        'L' +
        xTo +
        ',' +
        yTop +
        'L' +
        xEnd +
        ',' +
        yTop
    }
  }
  //如果前一个节点是并行， 后一个节点是end节点
  if (prevNode.approvalNodeType == 1 && nextNode.text == 'END') {
    if (xTo < xNew + arrowWidth * 2 && rectPrevMid && !prevGroupName) {
      const mid = rectPrevMid
        .toString()
        .split('#')[0]
        .split('/')[0]
      _path =
        'M' +
        xNew +
        ',' +
        yNew +
        'L' +
        xTo +
        ',' +
        yNew +
        'L' +
        xTo +
        ',' +
        mid +
        'L' +
        xTo +
        ',' +
        yTop +
        'L' +
        xEnd +
        ',' +
        yTop
    } else if (xTo == xNew + arrowWidth * 2 && rectPrevMid && !prevGroupName) {
      const mid = rectPrevMid
        .toString()
        .split('#')[0]
        .split('/')[0]
      _path =
        'M' +
        xNew +
        ',' +
        yNew +
        'L' +
        (xTo - arrowWidth) +
        ',' +
        yNew +
        'L' +
        (xTo - arrowWidth) +
        ',' +
        mid +
        'L' +
        xTo +
        ',' +
        mid +
        'L' +
        xTo +
        ',' +
        yTop +
        'L' +
        xEnd +
        ',' +
        yTop
    } else if (xTo > xNew + arrowWidth * 2 && rectPrevMid && !prevGroupName && prevRealType != 0) {
      const mid = rectPrevMid
        .toString()
        .split('#')[0]
        .split('/')[0]
      const midArr = rectPrevMid.toString().split('#')
      if (midArr.length >= 2) {
        const prevxMid = xTo - arrowWidth * (midArr.length - 1)
        _path = 'M' + xNew + ',' + yNew + 'L' + prevxMid + ',' + yNew
        let prevyCoor = 0 //缓存上次的y值
        $.each(midArr, (m: number, n) => {
          const _x = prevxMid + arrowWidth * m
          const yCoor = parseInt(n.split('/')[0])
          if (m < midArr.length) {
            if (m == midArr.length - 1) {
              //最后一个补足长度
              _path += 'L' + _x + ',' + prevyCoor
            }
            _path += 'L' + _x + ',' + yCoor + 'L' + (_x + arrowWidth) + ',' + yCoor
            prevyCoor = yCoor
          }
        })
        _path += 'L' + xTo + ',' + yTop + 'L' + xEnd + ',' + yTop
      } else {
        _path =
          'M' +
          xNew +
          ',' +
          yNew +
          'L' +
          (xTo - arrowWidth) +
          ',' +
          yNew +
          'L' +
          (xTo - arrowWidth) +
          ',' +
          mid +
          'L' +
          xTo +
          ',' +
          mid +
          'L' +
          xTo +
          ',' +
          yTop +
          'L' +
          xEnd +
          ',' +
          yTop
      }
    } else if (xTo > xNew + arrowWidth * 2 && rectPrevMid && !prevGroupName && prevRealType == 0) {
      const level = prevNode.level
      if (level > 1) {
        //多层嵌套
        const midArr = rectPrevMid.toString().split('#')
        const prevxMid = xTo - arrowWidth * (midArr.length - 1)
        _path = 'M' + xNew + ',' + yNew + 'L' + prevxMid + ',' + yNew
        $.each(midArr, (m: number, n) => {
          const _x = prevxMid + arrowWidth * m
          const yCoor = parseInt(n.split('/')[0])
          if (m < level) {
            _path += 'L' + _x + ',' + yCoor + 'L' + (_x + arrowWidth) + ',' + yCoor
          }
        })
        _path += 'L' + xTo + ',' + yTop + 'L' + xEnd + ',' + yTop
      }
    }
  }
  //前一组节点属于并行中，后一个节点为串行节点时
  if (prevGroupName != nextGroupName && prevNode.approvalNodeType == 1 && nextNode.approvalNodeType == 0) {
    if (xTo < xNew + arrowWidth * 2 && rectPrevMid) {
      const mid = rectPrevMid
        .toString()
        .split('#')[0]
        .split('/')[0]
      _path = 'M' + xNew + ',' + yNew + 'L' + xTo + ',' + yNew + 'L' + xTo + ',' + mid + 'L' + xEnd + ',' + mid
    } else if (xTo == xNew + arrowWidth * 2 && rectPrevMid) {
      const mid = rectPrevMid
        .toString()
        .split('#')[0]
        .split('/')[0]
      const nextyMid = rectPrevMid
        .toString()
        .split('#')[1]
        .split('/')[0]
      _path =
        'M' +
        xNew +
        ',' +
        yNew +
        'L' +
        (xNew + arrowWidth) +
        ',' +
        yNew +
        'L' +
        (xNew + arrowWidth) +
        ',' +
        mid +
        'L' +
        xTo +
        ',' +
        mid +
        'L' +
        xTo +
        ',' +
        nextyMid +
        'L' +
        xEnd +
        ',' +
        yTop
    } else if (xTo > xNew + arrowWidth * 2 && rectPrevMid && prevRealType != 0) {
      const midArr = rectPrevMid.toString().split('#')
      if (midArr.length > 2) {
        const prevxMid = xTo - arrowWidth * (midArr.length - 1)
        const level = prevNode.level
        _path = 'M' + xNew + ',' + yNew + 'L' + prevxMid + ',' + yNew
        let prevyCoor = 0 //缓存上次的y值
        $.each(midArr, (m: number, n) => {
          const _x = prevxMid + arrowWidth * m
          const yCoor = parseInt(n.split('/')[0])
          if (m < level) {
            if (m == level - 1) {
              //最后一个补足长度
              _path += 'L' + _x + ',' + prevyCoor
            }
            _path += 'L' + _x + ',' + yCoor + 'L' + (_x + arrowWidth) + ',' + yCoor
            prevyCoor = yCoor
          }
        })
        _path += 'L' + xTo + ',' + yTop + 'L' + xEnd + ',' + yTop
      } else if (midArr.length == 2) {
        const _prevX = xTo - arrowWidth
        const yCoor = parseInt(midArr[0].split('/')[0])
        _path =
          'M' +
          xNew +
          ',' +
          yNew +
          'L' +
          _prevX +
          ',' +
          yNew +
          'L' +
          _prevX +
          ',' +
          yCoor +
          'L' +
          (_prevX + arrowWidth) +
          ',' +
          yCoor +
          'L' +
          xTo +
          ',' +
          yTop +
          'L' +
          xEnd +
          ',' +
          yTop
      } else {
        _path =
          'M' + xNew + ',' + yNew + 'L' + xTo + ',' + yNew + 'L' + xTo + ',' + yTop + 'L' + xEnd + ',' + yTop
      }
    } else if (xTo > xNew + arrowWidth * 2 && rectPrevMid && !prevGroupName && prevRealType == 0) {
      const level = prevNode.level
      if (level > 1) {
        //多层嵌套
        const midArr = rectPrevMid.toString().split('#')
        const prevxMid = xTo - arrowWidth * (level - 1)
        _path = 'M' + xNew + ',' + yNew + 'L' + prevxMid + ',' + yNew
        $.each(midArr, (m: number, n) => {
          const _x = prevxMid + arrowWidth * m
          const yCoor = parseInt(n.split('/')[0])
          if (m < level) {
            _path += 'L' + _x + ',' + yCoor + 'L' + (_x + arrowWidth) + ',' + yCoor
          }
        })
        _path += 'L' + xTo + ',' + yTop + 'L' + xEnd + ',' + yTop
      }
    }
  }
  //前后节点组都是并行节点
  if (prevNode.approvalNodeType == 1 && nextNode.approvalNodeType == 1 && nextRealType == 1) {
    if (xTo == xNew) {
      //串行中的两个并行节点
      _path = 'M' + xNew + ',' + yNew + 'L' + xEnd + ',' + yTop
    } else if (xTo > xNew + arrowWidth * 2 && rectPrevMid && rectNextMid) {
      const midArr = rectPrevMid.toString().split('#')
      xTo = xEnd - arrowWidth * 2
      const nextyMid = rectNextMid
        .toString()
        .split('#')[0]
        .split('/')[0]
      midArr.pop()
      if (midArr.length > 1) {
        const prevxMid = xTo - arrowWidth * midArr.length
        const level = prevNode.level
        _path = 'M' + xNew + ',' + yNew + 'L' + prevxMid + ',' + yNew
        let prevyCoor = 0 //缓存上次的y值
        $.each(midArr, (m: number, n) => {
          const _x = prevxMid + arrowWidth * m
          const yCoor = parseInt(n.split('/')[0])
          if (m < level) {
            if (m == level - 1) {
              //最后一个补足长度
              _path += 'L' + _x + ',' + prevyCoor
            }
            _path += 'L' + _x + ',' + yCoor + 'L' + (_x + arrowWidth) + ',' + yCoor
            prevyCoor = yCoor
          }
        })
        _path += 'L' + xTo + ',' + nextyMid
      } else {
        _path = 'M' + xNew + ',' + yNew + 'L' + xTo + ',' + yNew
        if (midArr.length != 0) {
          const midY = midArr[0].split('/')[0]
          _path += 'L' + xTo + ',' + midY + 'L' + xTo + ',' + nextyMid + 'L' + xTo + ',' + nextyMid
        } else {
          _path += 'L' + xTo + ',' + yNew + 'L' + xTo + ',' + nextyMid + 'L' + xTo + ',' + nextyMid
        }
      }

      _path +=
        'L' +
        (xTo + arrowWidth) +
        ',' +
        nextyMid +
        'L' +
        (xTo + arrowWidth) +
        ',' +
        yTop +
        'L' +
        xEnd +
        ',' +
        yTop
    }
  }
  //并行中的并行节点与串行节点相连
  if (prevNode.approvalNodeType == 1 && nextNode.approvalNodeType == 1 && nextRealType == 0) {
    if (xTo == xNew) {
      //串行中的两个并行节点
      _path = 'M' + xNew + ',' + yNew + 'L' + xEnd + ',' + yTop
    } else if (xTo == xNew + arrowWidth * 2 && rectPrevMid) {
      const mid = rectPrevMid
        .toString()
        .split('#')[0]
        .split('/')[0]
      const nextyMid = rectPrevMid
        .toString()
        .split('#')[1]
        .split('/')[0]
      _path =
        'M' +
        xNew +
        ',' +
        yNew +
        'L' +
        (xNew + arrowWidth) +
        ',' +
        yNew +
        'L' +
        (xNew + arrowWidth) +
        ',' +
        mid +
        'L' +
        xTo +
        ',' +
        mid +
        'L' +
        xTo +
        ',' +
        nextyMid +
        'L' +
        xEnd +
        ',' +
        yTop
    } else if (xTo > xNew + arrowWidth * 2 && rectPrevMid && rectNextMid) {
      const mid = rectPrevMid
        .toString()
        .split('#')[0]
        .split('/')[0]
      const midArr = rectPrevMid.toString().split('#')
      midArr.pop()
      if (midArr.length > 2) {
        const prevxMid = xTo - arrowWidth * (midArr.length - 1)
        const level = prevNode.level
        _path = 'M' + xNew + ',' + yNew + 'L' + prevxMid + ',' + yNew
        $.each(midArr, (m: number, n) => {
          const _x = prevxMid + arrowWidth * m
          const yCoor = parseInt(n.split('/')[0])
          if (m < level) {
            _path += 'L' + _x + ',' + yCoor + 'L' + (_x + arrowWidth) + ',' + yCoor
          }
        })
        _path += 'L' + xTo + ',' + yTop + 'L' + xEnd + ',' + yTop
      } else if (midArr.length == 2) {
        const _prevX = xTo
        const yCoor = parseInt(midArr[0].split('/')[0])
        _path =
          'M' +
          xNew +
          ',' +
          yNew +
          'L' +
          _prevX +
          ',' +
          yNew +
          'L' +
          _prevX +
          ',' +
          yCoor +
          'L' +
          (_prevX + arrowWidth) +
          ',' +
          yCoor +
          'L' +
          xTo +
          ',' +
          yTop +
          'L' +
          xEnd +
          ',' +
          yTop
      } else {
        _path =
          'M' +
          xNew +
          ',' +
          yNew +
          'L' +
          xTo +
          ',' +
          yNew +
          'L' +
          xTo +
          ',' +
          mid +
          'L' +
          xTo +
          ',' +
          mid +
          'L' +
          xTo +
          ',' +
          yTop +
          'L' +
          xEnd +
          ',' +
          yTop
      }
    }
  }
  return _path
}

//查询流程节点成员
const getTaskUserInfoList = (approvalId: number, currentTaskKey: string) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken } = $store.getState()
    const param = {
      approvalId,
      currentTaskKey,
    }
    $api
      .request('/approval/findTaskUserInfoList', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.dataList || [])
      })
      .catch(err => {
        reject(err)
      })
  })
}
let renderCount = 0
//绘制流程图
const ApprovalWorkFlow = ({
  dataSource,
  historyProcess,
  approvalId,
  branchVarLists,
  trigger,
  selectkey,
}: ParentProp) => {
  const initStates = {
    pathArrObj: [], //线条集合
    svgProps: {
      //画布默认大小
      width: 500,
      height: 500,
    },
    imagePath: [], //存储界面的编辑节点
    showNodeData: [], //可渲染为审批节点数据
    loading: true,
  }
  const [showModel, setShowModel] = useState({
    visible: false,
    showNodeModelList: '',
    title: {
      endName: '',
      startName: '',
    },
  })
  const [flowState, setFlowState] = useMergeState(initStates)
  //箭头节点集合
  const sequenceArr: any[] = dataSource
    .filter(item => item.stencil.id === 'SequenceFlow')
    .map(idx => {
      return {
        id: idx.resourceId,
        outId: idx.outgoing[0].resourceId,
      }
    })
  //配置分支条件
  const branchArr: any[] = dataSource
    .filter(item => item.stencil.id === 'SequenceFlow' && item.properties.conditionsequenceflow)
    .map(idx => {
      return {
        id: idx.resourceId,
        outId: idx.outgoing[0].resourceId,
        branchList: idx.properties.conditionsequenceflow,
      }
    })
  const processRef = useRef<any>(null)
  const PaperRef = useRef<any>(null)
  //发起者和END节点y坐标
  const baseStartY = flowState.svgProps.height / 2 - 30
  //节点数据集合
  const userTaskArr: any[] = []
  const [userData, setUserData] = useState<any>(null)

  //重置
  useEffect(() => {
    maxTop = minTop = 0
    setFlowState(initStates)
  }, [selectkey])
  //初始化
  useEffect(() => {
    setTimeout(async () => {
      const height = flowState.svgProps.height
      const { pathList, nowPathObjArr, showData } = await hanldeData()
      if (height === 500) {
        setFlowState({
          svgProps: {
            width: endX + 600,
            height: maxTop - minTop + 500,
          },
          imagePath: pathList,
          showNodeData: showData,
          pathArrObj: nowPathObjArr,
        })
      } else {
        setFlowState({
          svgProps: {
            width: endX + 600,
            height: height,
          },
          imagePath: pathList,
          showNodeData: showData,
          pathArrObj: nowPathObjArr,
          loading: false,
        })
      }
    }, 0)
  }, [flowState.svgProps.height])

  //异步处理数据
  const hanldeData = async () => {
    return new Promise<any>(async resolve => {
      showData = []
      dataSource.map(item => {
        if (item.stencil.id == 'StartNoneEvent') {
          //开始节点
          startNode = item
        } else if (item.stencil.id == 'UserTask' || item.stencil.id == 'SequenceFlow') {
          //审批节点及线条

          userTaskArr.push(item)
        } else if (item.stencil.id == 'EndNoneEvent') {
          //end节点
          endNode = item
        }
      })
      //转换查询的数据为前端需要的数据
      const handleData = await getDataInfoByFlow(userTaskArr)

      //开始节点
      showData.push({
        width: 100,
        height: 60,
        position: {
          x: 30,
          y: baseStartY,
        },
        approvalNodeType: 'start',
        text: '发起者',
        resourceId: startNode.resourceId,
        selectId: '',
        properties: startNode.properties,
        type: startNode.stencil.id,
        outId: startNode.outgoing,
        relationEvent: startNode.relationEvent,
        approvalType: startNode.approvalType,
      })
      endX = 207
      endPid = [startNode.resourceId]
      //循环审批节点
      $.each(handleData, (i: number, item) => {
        if (i === 0) {
          _parentX = 130 + arrowWidth
          _parentY = flowState.svgProps.height / 2
          minTop = maxTop = _parentY
        }
        setProcessPos(item, i + 1)
      })
      //添加结束节点
      showData = [
        ...showData,
        {
          width: 100,
          height: 60,
          position: {
            x: endX,
            y: baseStartY,
          },
          pId: endPid,
          text: 'END',
          approvalNodeType: 'end',
          resourceId: endNode.resourceId,
          selectId: '',
          properties: endNode.properties,
          type: endNode.stencil.id,
          outId: endNode.outgoing,
          relationEvent: endNode.relationEvent,
          approvalType: endNode.approvalType,
        },
      ]
      /**
       *获取当前线条id
       */
      const getLineNowId = (prevId: any, nextId: any) => {
        let lineId = ''

        $.each(sequenceArr, (i, item) => {
          if (
            item.outId == nextId &&
            (!item.prevId || prevId == item.prevId) &&
            !allLineIds.includes(item.id) //已经添加过的id不在添加
          ) {
            lineId = item.id
            return false
          }
        })
        if (lineId == '') {
          lineId = 'sid-' + Maths.uuid()
        }
        return lineId
      }

      //绘制线条
      const nowPathObjArr: React.SetStateAction<PathProps[]> = []
      let noneMatch = false
      const allLineIds: any[] = []
      const pathList: any[] = []
      let nowGetId: any[] = []
      branchInfoModelList = []
      $.each(showData, (i, item) => {
        $.each(showData, (j, idx) => {
          if (item.outId && idx.pId && idx.pId.indexOf(item.resourceId) != -1) {
            const pathStr = moveArrowToRightConcurren(item, idx)

            let nowLineId = getLineNowId(item.resourceId, idx.resourceId)

            if (!isInArray(allLineIds, nowLineId)) {
              allLineIds.push(nowLineId)
            } else {
              nowLineId = 'sid-' + Maths.uuid()
              allLineIds.push(nowLineId)
            }

            const pathColor = historyProcess?.historyHighlight?.includes(nowLineId) ? '#F77E7A' : '#AED2F2'

            if (historyProcess?.historyHighlight?.includes(nowLineId)) {
              //描红的放后面
              nowPathObjArr.push({
                id: nowLineId,
                pathStr: pathStr,
                pathColor: pathColor,
              })
            } else {
              nowPathObjArr.unshift({
                id: nowLineId,
                pathStr: pathStr,
                pathColor: pathColor,
              })
            }
            noneMatch = true
            $.each(branchArr, (m, datas) => {
              if (datas.outId == idx.resourceId && !nowGetId.includes(datas.outId)) {
                pathList.push({
                  x: idx.position.x - arrowWidth / 2 - 10,
                  y: idx.position.y + idx.height / 2 - 10,
                  id: datas.outId,
                  prevName: idx.pId && idx.pId.length > 1 ? '并行分支' : item.text || item.name,
                  nextName: idx.name || idx.text,
                })
                nowGetId.push(datas.outId)
                showBranchHandle(datas).then((res: any) => {
                  branchInfoModelList[datas.outId] = res
                })
              }
            })
            return
          }
        })
        if (noneMatch) {
          return
        }
      })
      resolve({
        showData: showData,
        pathList: pathList,
        nowPathObjArr: nowPathObjArr,
      })
    })
  }
  /***
   * 显示分支条件
   */
  let showBranchHandle = (item: any) => {
    return new Promise<any>(async resolve => {
      //条件判断表达式
      let branchList = item.branchList
      //解析字符串正则
      let reg = /\(\(.+?\)\)/g
      //获取所有分支条件表达式
      let handBranch = branchList.match(reg)
      if (handBranch == null) {
        handBranch = branchList.match(/\((.+?)\)/g)
      }
      if (handBranch == null) {
        handBranch = branchList
      }
      //获取所有链接符号
      let symbolArr = branchList.replace(/\([^\)]*\)/g, '').match(/([&]{2})|([|]{2})/g)
      if (symbolArr != null) {
        //判空，当只有一个条件的时候不用加”“
        symbolArr.splice(0, 0, '')
      } else {
        symbolArr = ['']
      }
      let newbranchInfoList: any = []
      $.each(handBranch, (j, idx) => {
        //获取小括号内的内容
        let trueName = idx
        //如果是多选（包含不包含条件，需要进行数据处理）
        if (trueName.includes('contains')) {
          trueName = branchTransform(trueName)
        }
        //获取小括号内符号组
        let trueSymbol = trueName.match(/([&]{2})|([|]{2})/g)
        //获取条件值集合
        let infoDetail = trueName.split(' ')
        infoDetail = infoDetail.filter((k: any) => k && k.trim())
        //转换分支符号值
        let showBranchVal = 0
        //变量值
        let infoRealDetail = infoDetail[1].split('_')[0]
        //显示的变量名
        let showBranchName = getShowBranchName(infoRealDetail) || ''
        //获取展示变量类型
        let showBranchType = getShowBranchType(infoRealDetail) || ''
        if (showBranchType == 'peoSel') {
          // 修改标记
          infoDetail = branchTransformPorsen(idx)
        }
        //链接符号解析
        let connectSym = ''
        if ($.trim(symbolArr[j]) != '') {
          connectSym = symbolArr[j] == '&&' ? 'and' : 'or'
        }
        //正常分支
        if (
          showBranchType == 'input' ||
          showBranchType == 'numval' ||
          showBranchType == 'formula' ||
          showBranchType == 'dateRange' ||
          showBranchType == 'checkbox'
        ) {
          //根据类型
          let contain = infoDetail[2].includes('in###in')
          let notContain = infoDetail[2].includes('notin###notin')
          if (
            trueSymbol != null &&
            trueSymbol.indexOf('&&') != -1 &&
            infoDetail[1] == infoDetail[5] &&
            !infoDetail[2].includes('==') &&
            !infoDetail[6].includes('==') &&
            !contain &&
            !notContain
          ) {
            //介于条件时
            newbranchInfoList.push({
              branchName: infoRealDetail,
              branchShowName: showBranchName,
              branchType: showBranchType,
              bracketL: infoDetail[0],
              bracketR: infoDetail[8],
              branchIf: 7,
              branchVal: infoDetail[3] + '#' + infoDetail[7],
              branchAnd: connectSym,
              between_branchIf: infoDetail[2] + '#' + infoDetail[6],
            })
          } else if (trueSymbol == null && infoDetail[3] == 'null') {
            //为空时 不为空时
            newbranchInfoList.push({
              branchName: infoRealDetail,
              branchShowName: showBranchName,
              branchType: showBranchType,
              bracketL: infoDetail[0],
              bracketR: infoDetail[4],
              branchIf: infoDetail[2] == '==' ? 8 : 9,
              branchVal: infoDetail[3],
              branchAnd: connectSym,
              between_branchIf: infoDetail[2] + '#' + infoDetail[6],
            })
          } else if (contain || notContain) {
            //包含 不包含
            showBranchVal = contain ? 10 : 11
            let newDetail = infoDetail.concat([]).splice(1, infoDetail.length - 2)
            let nowVal = ''
            let spliceNum = 0
            //处理数据
            $.each(newDetail, (k: any, val: any) => {
              if (k % 4 == 2 && k == newDetail.length - 1) {
                nowVal += `${val}_`
                spliceNum = k
              }
              if (k % 4 == 2 && k != newDetail.length - 1) {
                nowVal += `${val}_#`
                spliceNum = k
              }
              //截断数组
              if (k % 4 == 3 && val != '||' && val != '&&' && k != 0) {
                spliceNum = k
                nowVal = nowVal.replace(/^(\s|#)+|(\s|#)+$/g, '')
                return false
              }
            })
            newbranchInfoList.push({
              branchName: infoRealDetail,
              branchShowName: showBranchName,
              branchType: showBranchType,
              bracketL: infoDetail[0],
              bracketR: infoDetail[spliceNum + 2],
              branchIf: showBranchVal,
              branchVal: nowVal.replace(/\'/g, ''),
              branchAnd: connectSym,
              between_branchIf: '',
            })
            //递归拆分
            let nextDetail = infoDetail.concat([]).splice(spliceNum + 2)
            if (spliceNum != 0 && nextDetail.length > 3) {
              let newBranchList = splitBrachnFunc(nextDetail)
              newbranchInfoList = newbranchInfoList.concat(newBranchList)
            }
          } else {
            let operate = infoDetail[2]
            if (operate == '==') {
              //等于
              showBranchVal = 1
            } else if (operate == '!=') {
              //不等于
              showBranchVal = 2
            } else if (operate == '<') {
              //小于
              showBranchVal = 3
            } else if (operate == '>') {
              //大于
              showBranchVal = 4
            } else if (operate == '<=') {
              //小于等于
              showBranchVal = 5
            } else if (operate == '>=') {
              //大于等于
              showBranchVal = 6
            }
            newbranchInfoList.push({
              branchName: infoRealDetail,
              branchShowName: showBranchName,
              branchType: showBranchType,
              bracketL: infoDetail[0],
              bracketR: infoDetail[4],
              branchIf: showBranchVal,
              branchVal: infoDetail[3].replace(/\'/g, ''),
              branchAnd: connectSym,
              between_branchIf: '',
            })
            //拆分多个条件合并
            let newDetail = infoDetail.concat([]).splice(4, infoDetail.length - 3)
            if (newDetail.length > 3) {
              let newBranchList = splitBrachnFunc(newDetail, newDetail[1])
              newbranchInfoList = newbranchInfoList.concat(newBranchList)
            }
          }
        }
        if (showBranchType == 'select' || showBranchType == 'radio') {
          let newDetail = infoDetail.concat([]).splice(1, infoDetail.length - 2)
          let showBranchVal = 0
          if (newDetail[1] == '==') {
            //等于
            showBranchVal = 1
          } else if (newDetail[1] == '!=') {
            //不等于
            showBranchVal = 2
          }
          let nowVal = ''
          let spliceNum = 0
          //处理数据
          $.each(newDetail, (k: any, val: any) => {
            if (k % 4 == 2 && k == newDetail.length - 1) {
              nowVal += `${val}_`
              spliceNum = k
            }
            if (k % 4 == 2 && k != newDetail.length - 1) {
              nowVal += `${val}_#`
              spliceNum = k
            }
            //截断数组
            if (k % 4 == 3 && val != '||' && val != '&&' && k != 0) {
              spliceNum = k
              nowVal = nowVal.replace(/^(\s|#)+|(\s|#)+$/g, '')
              return false
            }
          })
          let _obj = {
            branchName: infoRealDetail,
            branchShowName: showBranchName,
            branchType: showBranchType,
            bracketL: infoDetail[0],
            bracketR: infoDetail[spliceNum + 2],
            branchIf: showBranchVal,
            branchVal: nowVal.replace(/\'/g, ''),
            branchAnd: connectSym,
            between_branchIf: '',
          }
          let _nowVal = nowVal.replace(/\'/g, '')

          if (_nowVal == 'null_') {
            if (showBranchVal == 1) {
              //为空
              _obj.branchIf = 8
            } else if (showBranchVal == 2) {
              //不为空
              _obj.branchIf = 9
            }
          }
          newbranchInfoList.push(_obj)
          //递归拆分
          let nextDetail = infoDetail.concat([]).splice(spliceNum + 2)
          if (spliceNum != 0 && nextDetail.length > 3) {
            let newBranchList = splitBrachnFunc(nextDetail)
            newbranchInfoList = newbranchInfoList.concat(newBranchList)
          }
        }
        if (showBranchType == 'peoSel') {
          //人员选择
          let newDetail = infoDetail.concat([]).splice(1, infoDetail.length - 2)
          let showBranchVal = 0
          let nowVal = ''
          let showSymbol = 0
          let spliceNum = 0
          //处理数据
          $.each(newDetail, (k: any, val: any) => {
            let _symbol: any = 0
            // 去除空格后的，每三个元素为一组公式，
            if (k % 3 == 2) {
              let exp = newDetail[k - 1].includes('notin###notin')
                ? '(不包含子部门)'
                : newDetail[k - 1].includes('in###in')
                ? '(包含子部门)'
                : ''
              if (
                newDetail[k - 1].includes('notin###notin') ||
                newDetail[k - 1].includes('in###in') ||
                newDetail[k - 1].includes('other')
              ) {
                // 主体内容类型：是否包含子部门等
                _symbol = newDetail[k - 2].split('_')[1]
                if (_symbol == 'post') {
                  showSymbol = 31
                } else if (_symbol == 'postdept' || _symbol == 'parentDept') {
                  showSymbol = 3
                } else if (_symbol == 'role') {
                  showSymbol = 5
                } else if (_symbol == 'manager') {
                  if (newDetail[k - 2].split('_')[2] == 'direct') {
                    showSymbol = 6
                  } else if (newDetail[k - 2].split('_')[2] == 'indirect') {
                    showSymbol = 7
                  } else {
                    showSymbol = 8
                  }
                } else if (_symbol == 'self') {
                  showSymbol = 9
                } else if (_symbol == 'branch') {
                  showSymbol = 10
                } else if (_symbol == 'dept') {
                  showSymbol = 11
                } else if (_symbol == 'org') {
                  showSymbol = 12
                }
                // 判断前一个元素包含notin、in、other则是运算符，那么k对应的val即为显示文本,k-2则为主体内容
                // 注：首字母不加#
                nowVal += `${nowVal == '' ? '' : '#'}${val}${exp}_${showSymbol}`
                // 最后人员下标位置
                if (k != 0 && val != '||' && val != '&&' && val != '') {
                  spliceNum = k
                }
              }
              // 当前分组下拉应该显示的包含类型
              if (newDetail[k - 2].includes('!')) {
                //不包含
                showBranchVal = 2
              } else {
                //包含
                showBranchVal = 1
              }
            }
          })
          if (nowVal != '') {
            newbranchInfoList.push({
              branchName: infoRealDetail,
              branchShowName: showBranchName,
              branchType: showBranchType,
              bracketL: infoDetail[0],
              bracketR: infoDetail[spliceNum + 2].includes(')') ? ')' : '',
              branchIf: showBranchVal,
              branchVal: nowVal.replace(/\'/g, ''),
              branchAnd: connectSym,
              between_branchIf: '',
            })
          }
          //递归拆分
          if (spliceNum + 3 < newDetail.length - 1) {
            let nextDetail = infoDetail.concat([]).splice(spliceNum + 2)
            if (nextDetail.length > 3) {
              let newBranchList = splitBrachnFunc(nextDetail)
              newbranchInfoList = newbranchInfoList.concat(newBranchList)
            }
          }
        }
        //条件被删除时也展示
        if (showBranchType == '') {
          let noneBracketR = infoDetail[4]
          if (trueSymbol != null && trueSymbol.indexOf('&&') != -1 && infoDetail[1] == infoDetail[5]) {
            noneBracketR = infoDetail[8]
          }
          newbranchInfoList.push({
            branchName: infoRealDetail,
            branchShowName: showBranchName,
            branchType: showBranchType,
            bracketL: infoDetail[0],
            bracketR: noneBracketR,
            branchIf: 0,
            branchVal: '',
            branchAnd: connectSym,
            between_branchIf: '',
          })
        }
      })
      resolve(newbranchInfoList)
    })
  }
  /**
   * 打开Model框分支条件回显
   */
  let showBranchList = (branchVarList: any, startName: any, endName: any) => {
    //定义要拼接html字符串
    let htm = ''
    //是否有高级设置
    let isHasMaster = false
    $.each(branchVarList, (i, item) => {
      if (item.bracketR?.indexOf(')') == -1) {
        isHasMaster = true
      }
    })
    if (branchVarList?.length != 0) {
      $.each(branchVarList, (i, item) => {
        //显示条件名
        let showIfTxt = ''
        //显示条件值
        let showVal = ''
        let getNowText = item.branchVal
        //是否有数值和公式位数
        // let dotLen = null
        // if (item.branchType == 'formula' || item.branchType == 'numval') {
        //   dotLen = getNewDecimals(item.branchName)
        // }
        //选择人员展示修改
        // let userShowData: any = []
        if (item.branchIf == 1) {
          //包含（原值为等于）
          showIfTxt = '等于'
          if (item.branchType == 'select' || item.branchType == 'radio') {
            let realVal = '{' + item.branchVal.replace(/_.*?#/gi, '}or{') + '}'
            realVal = realVal.replace(/_(\d){0,2}/g, '')
            let userArr = item.branchVal.split('#')
            // $.each(userArr, (j, idx) => {
            //   userShowData.push({
            //     content: idx.split('_')[0],
            //   })
            // })
            getNowText = realVal
            showVal += `<div class="select_condition_category_down mySelPlug"><span class="role-span">
                      <span class="sel-show-txt-dow" >${realVal}</span></span>
                   </div>`
          } else if (item.branchType == 'checkbox') {
            let userArr = item.branchVal.split(',')
            // $.each(userArr, (j, idx) => {
            //   userShowData.push({
            //     content: idx,
            //   })
            // })
            showVal += `<div class="select_condition_category_down mySelPlug"><span class="role-span" >
                      <span class="sel-show-txt-dow">${item.branchVal}</span></span>
                      </div>`
          } else if (item.branchType == 'input') {
            showVal = `<div class="showUserInput">${item.branchVal}</div>`
          } else if (item.branchType == 'peoSel') {
            showIfTxt = '包含'
            let realVal = '{' + item.branchVal.replace(/_.*?#/gi, '}or{') + '}'
            //将结尾数字类型去掉
            realVal = realVal.replace(/_(\d){0,2}/g, '')
            let userArr = item.branchVal.split('#')
            // $.each(userArr, (j, idx) => {
            //   userShowData.push({
            //     name: idx.split('_')[0],
            //     type: idx.split('_')[1],
            //   })
            // })
            showVal = `<div class="showUserInput">${realVal}</div>`
            getNowText = realVal
          } else if (
            item.branchType == 'numval' ||
            item.branchType == 'formula' ||
            item.branchType == 'dateRange'
          ) {
            showVal = `<div class="showUserInput">${item.branchVal}</div>`
          }
        } else if (item.branchIf == 2) {
          //不包含（原值为不等于）
          showIfTxt = '不等于'
          if (item.branchType == 'select' || item.branchType == 'radio') {
            let realVal = '{' + item.branchVal.replace(/_.*?#/gi, '}and{') + '}'
            realVal = realVal.replace(/_(\d){0,2}/g, '')
            let userArr = item.branchVal.split('#')
            // $.each(userArr, (j, idx) => {
            //   userShowData.push({
            //     content: idx.split('_')[0],
            //   })
            // })
            getNowText = realVal
            showVal += `<div class="select_condition_category_down mySelPlug"><span class="role-span" >
                      <span class="sel-show-txt-dow"  >${realVal}</span></span>
                     </div>`
          } else if (item.branchType == 'checkbox') {
            let userArr = item.branchVal.split(',')
            // $.each(userArr, (j, idx) => {
            //   userShowData.push({
            //     content: idx,
            //   })
            // })
            showVal += `<div class="select_condition_category_down mySelPlug"><span class="role-span">
                      <span class="sel-show-txt-dow" >${item.branchVal}</span></span></div>`
          } else if (item.branchType == 'input') {
            showVal = `<div class="showUserInput">${item.branchVal}</div>`
          } else if (item.branchType == 'peoSel') {
            showIfTxt = '不包含'
            let realVal = '{' + item.branchVal.replace(/_.*?#/gi, '}and{') + '}'
            //将结尾数字类型去掉
            realVal = realVal.replace(/_(\d){0,2}/g, '')
            let userArr = item.branchVal.split('#')
            // $.each(userArr, (j, idx) => {
            //   userShowData.push({
            //     name: idx.split('_')[0],
            //     type: idx.split('_')[1],
            //   })
            // })
            showVal = `<div class="showUserInput">${realVal}</div>`
            getNowText = realVal
          } else if (
            item.branchType == 'numval' ||
            item.branchType == 'formula' ||
            item.branchType == 'dateRange'
          ) {
            showVal = `<div class="showUserInput">${item.branchVal}</div>`
          }
        } else if (item.branchIf == 3) {
          //小于
          showIfTxt = '小于'
          showVal = `<div class="showUserInput">${item.branchVal}</div>`
          if (item.branchType == 'numval' || item.branchType == 'formula' || item.branchType == 'dateRange') {
            showVal = `<div class="showUserInput">${item.branchVal}</div>`
          }
        } else if (item.branchIf == 4) {
          //大于
          showIfTxt = '大于'
          showVal = `<div class="showUserInput">${item.branchVal}</div>`
          if (item.branchType == 'numval' || item.branchType == 'formula' || item.branchType == 'dateRange') {
            showVal = `<div class="showUserInput">${item.branchVal}</div>`
          }
        } else if (item.branchIf == 5) {
          //小于等于
          showIfTxt = '小于等于'
          showVal = `<div class="showUserInput">${item.branchVal}</div>`
          if (item.branchType == 'numval' || item.branchType == 'formula' || item.branchType == 'dateRange') {
            showVal = `<div class="showUserInput">${item.branchVal}</div>`
          }
        } else if (item.branchIf == 6) {
          //大于等于
          showIfTxt = '大于等于'
          showVal = `<div class="showUserInput">${item.branchVal}</div>`
          if (item.branchType == 'numval' || item.branchType == 'formula' || item.branchType == 'dateRange') {
            showVal = `<div class="showUserInput">${item.branchVal}</div>`
          }
        } else if (item.branchIf == 7) {
          //介于
          showIfTxt = '介于（两个数之间）'
          //介于显示的符号
          let showSymbolNow = item.between_branchIf.split('#')
          //介于显示的值
          let showNum = item.branchVal.split('#')
          //大于的符号
          let symBolTxt1 = ''
          //小于的符号
          let symBolTxt2 = ''
          if (showSymbolNow[0] == '>') {
            symBolTxt1 = '＞'
          } else {
            symBolTxt1 = '≥'
          }
          if (showSymbolNow[1] == '<') {
            symBolTxt2 = '＜'
          } else {
            symBolTxt2 = '≤'
          }
          getNowText = ''
          showVal = `<div class="between_box">
                      <div class="select_big mySelPlug">
                          <span class="role-span" ><span class="sel-show-txt" >${symBolTxt1}</span></span>
                      </div>
                      <span class="big_num check_val">${showNum[0]}</span><span class="fg_icon">&</span><div class="select_small mySelPlug">
                          <span class="role-span" ><span class="sel-show-txt" >${symBolTxt2}</span></span>
                      </div>
                      <span class="small_num check_val">${showNum[1]}</span>
                  </div>`
          if (item.branchType == 'numval' || item.branchType == 'formula' || item.branchType == 'dateRange') {
            showVal = `<div class="between_box">
                      <div class="select_big mySelPlug">
                          <span class="role-span"><span class="sel-show-txt" >${symBolTxt1}</span></span>
                      </div>
                      <span class="big_num check_val">${showNum[0]}</span>
                      <span class="fg_icon">&</span><div class="select_small mySelPlug">
                          <span class="role-span"><span class="sel-show-txt" >${symBolTxt2}</span></span>
                      </div>
                      <span class="small_num check_val">${showNum[1]}</span>
                  </div>`
          }
        } else if (item.branchIf == 8) {
          //为空
          showIfTxt = '为空'
          showVal = `<div class="showUserInput">当前判断条件不需要输入变量值</div>`
          getNowText = '当前判断条件不需要输入变量值'
        } else if (item.branchIf == 9) {
          //不为空
          showIfTxt = '不为空'
          showVal = `<div class="showUserInput">当前判断条件不需要输入变量值</div>`
          getNowText = '当前判断条件不需要输入变量值'
        } else if (item.branchIf == 10 || item.branchIf == 11) {
          //包含 不包含
          showIfTxt = item.branchIf == 10 ? '包含' : '不包含'
          if (item.branchType == 'numval' || item.branchType == 'formula' || item.branchType == 'dateRange') {
            showIfTxt = item.branchIf == 10 ? '等于' : '不等于'
            const val = item.branchVal.replace(/_/g, '')
            showVal = `<div class="showUserInput">${val || '请输入数字'}</div>`
            getNowText = val || '请输入数字'
          } else {
            let linkNum = item.branchIf == 10 ? 'or' : 'and'
            let realVal = '{' + item.branchVal.replace(/_.*?#/gi, '}' + linkNum + '{') + '}'
            realVal = realVal.replace(/_(\d){0,2}/g, '')
            let userArr = item.branchVal.split('#')
            // $.each(userArr, (j, idx) => {
            //   userShowData.push({
            //     content: idx.split('_')[0],
            //   })
            // })
            getNowText = realVal
            showVal += `<div class="select_condition_category_down mySelPlug"><span class="role-span" >
                      <span class="sel-show-txt-dow" >${realVal}</span></span>
                     </div>`
          }
        }
        let showRightLeft = item.bracketL.indexOf('(') == -1
        htm += `${
          $.trim(item.branchAnd) != ''
            ? `<div class="fg_line"><span class="fg_name">${$.trim(
                item.branchAnd
              )}</span><span class="dashed_line"></span></div>`
            : ''
        }
                <section>
                <div class="condition_bracket condition_bracket_l ${showRightLeft ? 'none_bracket' : ''} ${
          isHasMaster ? 'active' : ''
        } 
               ">(</div><span class="condition_text">当</span>
                <div class="select_condition_name mySelPlug ${
                  showRightLeft || isHasMaster ? '' : 'select_condition_max'
                }">
                    <span class="role-span" >
                        <span class="sel-show-txt">${item.branchType ? item.branchShowName : '请选择变量'}
                        </span></i>
                    </span>
                </div>
                <div class="select_condition_category mySelPlug">
                    <span class="role-span">
                        <span class="sel-show-txt" >${item.branchType ? showIfTxt : '请选择'}</span></i>
                    </span>
                </div>
                <div class="select_condition_value">
                ${
                  item.branchType
                    ? `<div data-toggle="tooltip" data-html="ture"
                    title="${getNowText}"
                    >${showVal}</div>`
                    : `<div data-toggle="tooltip"
                    title="${item.branchVal || '请先选择变量条件'}"
                    data-html="ture">
                      <div class="showUserInput">${item.branchVal || '请先选择变量条件'}</div>
                    </div>`
                }
                    
                </div>
                <div class="condition_bracket condition_bracket_r ${
                  item.bracketR?.indexOf(')') == -1 ? 'none_bracket' : ''
                } ${isHasMaster ? 'active' : ''}">)</div>
                </section>`
      })
    }

    showModel.visible = true
    showModel.showNodeModelList = `<div class="condition-title-box">分支条件</div>` + htm
    showModel.title = {
      endName: endName,
      startName: startName,
    }
    $('.select_condition_value').ready(function() {
      let name: any = $('[data-toggle="tooltip"]')
      name.tooltip({
        container: $('.setBranchCondition'),
      })
    })
    setShowModel({ ...showModel })
  }
  /**
   * 拆分多个条件合并
   * @param {分支条件数据} infoDetail
   */
  let splitBrachnFunc = (newInfoDetail: any, branchVal?: any) => {
    let branchName = branchVal ? branchVal : newInfoDetail[1].split('_')[0]
    let newBranchList: any = []
    //分支条件类型
    let showBranchType = getShowBranchType(branchName)
    //分支条件名称
    let showBranchName = getShowBranchName(branchName)
    //合并分支条件字符串
    let branchStr = newInfoDetail.join(' ')
    //剩余分支符号组
    let trueSymbol = branchStr.match(/([&]{2})|([|]{2})/g)
    //连接符号
    let connectSym = ''
    if (newInfoDetail[0] != '') {
      connectSym = newInfoDetail[0] == '&&' ? 'and' : 'or'
    }
    //正常分支
    if (
      showBranchType == 'select' ||
      showBranchType == 'input' ||
      showBranchType == 'radio' ||
      showBranchType == 'checkbox' ||
      showBranchType == 'numval' ||
      showBranchType == 'formula' ||
      showBranchType == 'dateRange'
    ) {
      if (
        trueSymbol != null &&
        trueSymbol.indexOf('&&') != -1 &&
        newInfoDetail.length > 7 &&
        newInfoDetail[1] == newInfoDetail[5] &&
        !newInfoDetail[2].includes('==') &&
        !newInfoDetail[6].includes('==')
      ) {
        newBranchList.push({
          branchName: branchName,
          branchShowName: showBranchName,
          branchType: showBranchType,
          bracketL: newInfoDetail[0],
          bracketR: newInfoDetail[8],
          branchIf: 7,
          branchVal: newInfoDetail[3] + '#' + newInfoDetail[7],
          branchAnd: connectSym,
          between_branchIf: newInfoDetail[2] + '#' + newInfoDetail[6],
        })
      } else if (newInfoDetail[4] == "''") {
        //为空不为空时
        newBranchList.push({
          branchName: branchName,
          branchShowName: showBranchName,
          branchType: showBranchType,
          bracketL: newInfoDetail[0],
          bracketR: newInfoDetail[4],
          branchIf: newInfoDetail[2] == '==' ? 8 : 9,
          branchVal: newInfoDetail[3],
          branchAnd: connectSym,
          between_branchIf: newInfoDetail[2],
        })
      } else {
        //转换分支符号值
        let showBranchVal = 0
        let operate = newInfoDetail[2]
        if (operate == '==') {
          //等于
          showBranchVal = 1
        } else if (operate == '!=') {
          //不等于
          showBranchVal = 2
        } else if (operate == '<') {
          //小于
          showBranchVal = 3
        } else if (operate == '>') {
          //大于
          showBranchVal = 4
        } else if (operate == '<=') {
          //小于等于
          showBranchVal = 5
        } else if (operate == '>=') {
          //大于等于
          showBranchVal = 6
        }
        newBranchList.push({
          branchName: branchName,
          branchShowName: showBranchName,
          branchType: showBranchType,
          bracketL: newInfoDetail[0],
          bracketR: newInfoDetail[4],
          branchIf: showBranchVal,
          branchVal: newInfoDetail[3].replace(/\'/g, ''),
          branchAnd: connectSym,
          between_branchIf: '',
        })
        //拆分多个条件合并
        let newDetail = newInfoDetail.concat([]).splice(5, newInfoDetail.length - 4)
        if (newDetail.length > 3) {
          let moreBranchList: any = splitBrachnFunc(newDetail, newDetail[1])
          newBranchList = newBranchList.concat(moreBranchList)
        }
      }
    }
    if (showBranchType == 'peoSel') {
      //人员选择
      let newDetail = newInfoDetail.concat([]).splice(1, newInfoDetail.length - 1)
      let showBranchVal = 0
      // if (newDetail[2] == '==') { //等于
      //     showBranchVal = 1
      // } else if (newDetail[2] == '!=') { //不等于
      //     showBranchVal = 2
      // }
      let nowVal = ''
      let showSymbol = 0
      let spliceNum = 0
      let splitName = '' //记录名字相同为一组
      //处理数据
      $.each(newDetail, (k: any, val: any) => {
        let _symbol: any = 0
        if (k % 3 == 2) {
          let exp = newDetail[k - 1].includes('notin###notin')
            ? '(不包含子部门)'
            : newDetail[k - 1].includes('in###in')
            ? '(包含子部门)'
            : ''
          // 去除空格后的，每三个元素为一组公式
          if (
            newDetail[k - 1].includes('notin###notin') ||
            newDetail[k - 1].includes('in###in') ||
            newDetail[k - 1].includes('other')
          ) {
            // 主体内容类型：是否包含子部门等
            _symbol = newDetail[k - 2].split('_')[1]
            if (_symbol == 'post') {
              showSymbol = 31
            } else if (_symbol == 'postdept' || _symbol == 'parentDept') {
              showSymbol = 3
            } else if (_symbol == 'role') {
              showSymbol = 5
            } else if (_symbol == 'manager') {
              if (newDetail[k - 2].split('_')[2] == 'direct') {
                showSymbol = 6
              } else if (newDetail[k - 2].split('_')[2] == 'indirect') {
                showSymbol = 7
              } else {
                showSymbol = 8
              }
            } else if (_symbol == 'self') {
              showSymbol = 9
            } else if (_symbol == 'branch') {
              showSymbol = 10
            } else if (_symbol == 'dept') {
              showSymbol = 11
            } else if (_symbol == 'org') {
              showSymbol = 12
            }
            nowVal += `${nowVal == '' ? '' : '#'}${val}${exp}_${showSymbol}`
            // 判断前一个元素包含notin、in、other则是运算符，那么k对应的val即为显示文本,k-2则为主体内容
            // 注：首字母不加#
            if (k != 0 && val != '||' && val != '&&' && val != '') {
              spliceNum = k
            }
          }
          if (newDetail[k - 2].includes('!')) {
            //不包含
            showBranchVal = 2
          } else {
            //包含
            showBranchVal = 1
          }
        }
      })
      newBranchList.push({
        branchName: branchName,
        branchShowName: showBranchName,
        branchType: showBranchType,
        bracketL: newInfoDetail[0],
        bracketR: newInfoDetail[spliceNum + 2].includes(')') ? ')' : '',
        branchIf: showBranchVal,
        branchVal: nowVal.replace(/\'/g, ''),
        branchAnd: connectSym,
        between_branchIf: '',
      })
      //递归拆分
      if (spliceNum + 3 < newDetail.length - 1) {
        let nextDetail = newInfoDetail.concat([]).splice(spliceNum + 2)
        if (nextDetail.length > 3) {
          let newList: any = splitBrachnFunc(nextDetail)
          newBranchList = newBranchList.concat(newList)
        }
      }
    }
    //条件被删除时也展示
    if (showBranchType == '') {
      let noneBracketR = newInfoDetail[4]
      if (
        trueSymbol != null &&
        trueSymbol.indexOf('&&') != -1 &&
        newInfoDetail.length > 6 &&
        newInfoDetail[1] == newInfoDetail[5]
      ) {
        noneBracketR = newInfoDetail[8]
      }
      newBranchList.push({
        branchName: branchName,
        branchShowName: showBranchName,
        branchType: showBranchType,
        bracketL: newInfoDetail[0],
        bracketR: noneBracketR,
        branchIf: 0,
        branchVal: '',
        branchAnd: connectSym,
        between_branchIf: '',
      })
    }
    return newBranchList
  }
  /**
   * 人员多选条件解析
   */
  let branchTransform = (branchStr: any) => {
    let str = '',
      contain = ''
    let bracketNum = branchStr.match(/([&]{2})|([|]{2})/g)
    let isNot = false
    if (!branchStr.includes('!')) {
      contain = ' in###in '
    } else {
      contain = ' notin###notin '
      isNot = true
    }
    if (bracketNum) {
      str = bracketNum[0] == '&&' ? branchStr.replace(/!/g, '') : branchStr
    } else {
      str = !isNot ? branchStr : branchStr.replace(/!/g, '')
    }

    str = str.replace(/.contains/g, contain)
    str = str.replace(/\[|]/g, '')
    return str
  }

  /**
   * 根据变量名获取变量显示名称
   */
  let getShowBranchName = (_condition: any) => {
    let showName = ''
    $.each(branchVarLists, (i, item) => {
      if (item.condition == _condition.replace(/!/g, '')) {
        showName = `【${item.typeName}】${item.name}`
        return false
      }
    })
    return showName
  }
  /**
   * 根据变量名获取变量类型
   */
  let getShowBranchType = (_condition: any) => {
    let showType = ''
    $.each(branchVarLists, (i, item) => {
      if (item.condition == _condition.replace(/!/g, '')) {
        showType = item.type
        return false
      }
    })
    return showType
  }
  /**
   * 人员控件条件解析
   */
  let branchTransformPorsen = (branchStr: any) => {
    let contain = ''
    // 记录上个主体内容和运算符
    let preInfo: any = {
      mainTxt: '',
      mainIndex: 0, //主体下标
      optIndex: 0, //运算符下标位置
      optTxt: '',
    }
    // 按空格拆分数组
    const splitSpace = branchStr.split(' ')
    $.each(splitSpace, (i: any, item) => {
      if (item.includes('contains')) {
        //人员控件
        if (item.includes('_parentDept')) {
          //包含子部门
          contain = ' in###in '
        } else if (item.includes('_postdept')) {
          //不包含子部门
          contain = ' notin###notin '
        } else {
          contain = ' other '
          // if(item.includes("!")){//人员（默认）(creater)不包含子部门
          //     contain = ' notin###notin '
          // }else{//人员（默认）(creater)包含子部门
          //     contain = ' in###in '
          // }
        }
        // 注：第一组控件不做比对
        // 前后都是人员控件时，如果下标相距小于4，则是同一个控件的值，则进行合并，去除中间运算符
        if (preInfo.mainTxt && preInfo.mainTxt.includes('contains') && i - preInfo.mainIndex < 4) {
          // 去除中间运算符
          splitSpace[preInfo.optIndex] = ''
        }
        // 记录前一个主体元素信息
        preInfo.mainTxt = item
        preInfo.mainIndex = i
      } else {
        //非人员控件
        contain = ' other '
        // 记录前一个运算符信息
        if (item.includes('&') || item.includes('||')) {
          preInfo.optTxt = item
          preInfo.optIndex = i
        }
      }
      splitSpace[i] = item.replace(/.contains/g, contain)
    })
    // .replace(/!/g, '')
    const newArr = splitSpace
      .join(' ')
      .replace(/\[|]/g, '')
      .split(' ')
      .filter((k: any) => k && k.trim())
    return newArr
  }

  //自动更新修改后的小数位数
  let getNewDecimals = (branchName: any) => {
    let decimals = 0
    $.each(branchVarLists, (i, item) => {
      if (item.condition == branchName) {
        decimals = item.decimals
        return false
      }
    })
    return decimals
  }
  //mouseover
  const mouseOverNode = (x: number, y: number, id: string, text: string, approvalId: any) => {
    if (trigger) {
      return false
    }
    if (approvalId) {
      //传了approvalid的才查询人员列表
      getTaskUserInfoList(approvalId, id)
        .then(resData => {
          const showObj = {
            userList: resData,
            text,
            x,
            y,
          }
          setUserData(showObj)
        })
        .catch(err => {
          message.error(err.returnMessage)
          setUserData(null)
        })
    }
  }
  //mouseleave
  const mouseLeaveNode = () => {
    setUserData(null)
  }

  const renderFlow = useMemo(() => {
    if (flowState.showNodeData.length === 0) {
      return null
    }
    return (
      <Rnd>
        <Paper
          ref={PaperRef}
          width={flowState.svgProps.width}
          height={flowState.svgProps.height}
          container={{ className: 'approval-flow-conatiner' }}
        >
          {flowState.showNodeData.map((item: any, idx: number) => {
            const hasRedBorder =
              historyProcess?.historyHighlight?.includes(item.resourceId) && item.text !== '发起者'
            return (
              <ProcessNode
                key={idx}
                {...item}
                historyProcess={historyProcess}
                hasRedBorder={hasRedBorder}
                approvalId={approvalId}
                mouseover={mouseOverNode}
                mouseleave={mouseLeaveNode}
              />
            )
          })}

          {flowState.pathArrObj.map((item: { id: string; pathStr: any; pathColor: string }, idx: number) => {
            return (
              <Path
                key={idx}
                d={item.pathStr}
                attr={{ stroke: item.pathColor, 'stroke-width': 2, 'arrow-end': 'classic-wide-long' }}
              />
            )
          })}
          {flowState.imagePath.map((item: any, idx: number) => {
            return (
              <Image
                key={idx}
                src={$tools.asAssetsPath('/images/workplan/OKR/branch_icon.jpg')}
                x={item.x}
                y={item.y}
                width={20}
                toFront={true}
                height={20}
                attr={{ cursor: 'pointer' }}
                click={(e: any) => {
                  e.stopPropagation()
                  showBranchList(branchInfoModelList[item.id], item.prevName, item.nextName)
                }}
              />
            )
          })}
        </Paper>
      </Rnd>
    )
  }, [flowState.svgProps.height, flowState.showNodeData, flowState.pathArrObj])

  if (flowState.showNodeData.length === 0) {
    return null
  }
  return (
    <>
      {flowState.loading && (
        <Spin
          tip={'流程图加载中，请稍候...'}
          style={{
            width: '100%',
            height: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexFlow: 'column',
          }}
          spinning={true}
        ></Spin>
      )}
      {!flowState.loading && (
        <div
          className="detail-container flow-container"
          style={{ height: flowState.svgProps.height }}
          ref={processRef}
        >
          {renderFlow}
          {userData && userData.userList.length !== 0 && (
            <div className="showUserBox" style={{ left: userData.x, top: userData.y }}>
              <div className="title">{userData.text}</div>
              <div className="user_list">
                {userData.userList.map((item: { username: string; state: number }, index: number) => {
                  return (
                    <li key={index}>
                      <span className="user_name">{item.username}</span>
                      {item.state === 2 && <span className="back_symbol">驳</span>}
                      {item.state === 1 && <span className="had_checked"></span>}
                      {item.state === 3 && <span className="storage_checked"></span>}
                      {item.state === 4 && <span className="isRead">已读</span>}
                    </li>
                  )
                })}
              </div>
            </div>
          )}
          {/* 定位 */}
          <ScaleBtns />
          {showModel.visible && (
            <Modal
              title="分支条件详情"
              visible={true}
              width={850}
              bodyStyle={{ height: '564px' }}
              onCancel={() => {
                showModel.visible = false
                setShowModel({ ...showModel })
              }}
              footer={null}
              className="setBranchCondition"
              maskClosable={false}
            >
              <div className="set-condition-node">
                {showModel.title.startName}
                <span className="branch_arrow"></span>
                <span style={{ color: '#191F25' }}>{showModel.title.endName}</span>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: showModel.showNodeModelList || '' }}
                className="condition-info-box"
              ></div>
            </Modal>
          )}
        </div>
      )}
    </>
  )
}

export default ApprovalWorkFlow

//缩放按钮
export const ScaleBtns = () => {
  const [scale, setScale] = useState(1)
  //重置
  const resize = () => {
    setScale(1)
    $('.approval-flow-conatiner>svg').css({ transform: 'scale(1)', left: 0 })
    $('.flow-container .react-draggable').css({ transform: 'translate(0, 0)' })
  }

  //放大
  const scaleMax = () => {
    setScale(scale + 0.1)
    $('.approval-flow-conatiner>svg').css({
      transform: `scale(${scale})`,
      left: scale * 200 + 'px',
    })
  }

  //缩小
  const scaleMin = () => {
    setScale(scale - 0.1)
    $('.approval-flow-conatiner>svg').css({
      transform: `scale(${scale})`,
      left: scale * 200 + 'px',
    })
  }
  return (
    <div
      className="postil_scale"
      style={{ left: Number($('.send-approval-content .left-panel').width() || 0) + 60 }}
    >
      <div
        className="scale-location"
        onClick={() => {
          resize()
        }}
      >
        <span></span>
      </div>
      <div className="scale-zoom">
        <span
          className="scale-zoom-plus"
          onClick={() => {
            scaleMax()
          }}
        ></span>
        <i>{parseInt(String(scale * 100))}%</i>
        <span
          className="scale-zoom-minus"
          onClick={() => {
            scaleMin()
          }}
        ></span>
      </div>
    </div>
  )
}

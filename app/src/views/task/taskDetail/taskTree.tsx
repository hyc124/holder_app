import React, { useEffect, useState } from 'react'
import { Tree } from 'antd'
import { initDataTreeApi } from './getData'
import { useSelector } from 'react-redux'
import $c from 'classnames'

//刷新
export let refreshChildTree: any = null
let treeData: any = []
const TaskTree = (props: any) => {
  const { nowUserId, nowAccount, selectTeamId, loginToken } = $store.getState()
  const editdetailid = useSelector((store: StoreStates) => store.editdetailid)
  const [datas, setDatas] = useState<any[]>([])
  //默认展开的节点
  const [defaultExpanded, setDefaultExpanded] = useState<any>([])
  useEffect(() => {
    treeData = []
    initDataTree()
  }, [])
  useEffect(() => {
    if (editdetailid) {
      refreshDetree(editdetailid)
    }
    // type:1 局部刷新 2全局刷新
    refreshChildTree = ({ type, operateId }: { type: number; operateId: number | string }) => {
      if (type == 1) {
        refreshDetree(operateId)
      } else {
        initDataTree()
      }
    }
  }, [editdetailid])
  //局部刷新节点
  const refreshDetree = (editdetailid: any) => {
    const param = {
      id: editdetailid,
      hasError: 0,
      userId: nowUserId,
      nextLevel: 1,
    }
    const url = '/task/queryChildTask'
    initDataTreeApi(param, url).then((resData: any) => {
      console.log(resData.data)
      if (resData.data) {
        const info: any = []
        info.push(resData.data)
        const newArr: any = [...treeData]
        function jsonRecursionChild(items: any) {
          for (let i = 0; i < items.length; i++) {
            const objArr: any[] = []
            const _taskId = items[i].key
            if (editdetailid == _taskId) {
              const childrenData = info[0].chlids
              items[i] = getItemsFun(info[0].subtaskNum, info[0], false) //替换当前节点
              childrenData.map((item: any) => {
                const _hasChild = item.subtaskNum
                objArr.push(getItemsFun(_hasChild, item, false))
              })
              items[i].children = objArr //替换子节点
              break
            }
            //有childs的时候递归
            if (
              items[i].children != undefined &&
              items[i].children != '' &&
              items[i].children != null &&
              items[i].children instanceof Array
            ) {
              jsonRecursionChild(items[i].children)
            }
          }
        }
        jsonRecursionChild(newArr)
        setDatas(newArr)
        treeData = [...newArr]
      }
    })
    $store.dispatch({ type: 'EDIT_DETAIL_ID', data: null })
  }
  //初始化查询tree
  const initDataTree = () => {
    const param = {
      id: props.datas.taskId,
      hasError: 0, //是否查询异常 1:查询异常（延期/冻结）
      userId: nowUserId,
      nextLevel: 2, //默认查询前三层的任务
    }
    const url = '/task/queryChildTask'
    initDataTreeApi(param, url).then((resData: any) => {
      console.log(resData.data)
      if (resData.data) {
        const info = []
        info.push(resData.data)
        const nodeArray = jsonRecursion(info, '')
        setDatas(nodeArray)
        treeData = [...nodeArray]
      }
    })
  }
  //初始化处理数据
  const jsonRecursion = (item: any, children: any) => {
    let newarr = []
    if (children) {
      newarr = children
    }
    for (let i = 0; i < item.length; i++) {
      const _hasChild = item[i].subtaskNum
      const obj: any = getItemsFun(_hasChild, item[i], true)
      //有childs的时候递归
      if (
        item[i].chlids != undefined &&
        item[i].chlids != '' &&
        item[i].chlids != null &&
        item[i].chlids instanceof Array
      ) {
        obj.children = [] //有childs不断扩充新的children对象
        newarr.push(obj)
        jsonRecursion(item[i].chlids, obj.children)
      } else {
        newarr.push(obj)
      }
    }
    return newarr
  }
  //公共数据节点
  const arr: any[] = []
  const getItemsFun = (_hasChild: any, item: any, expanded: any) => {
    if (expanded) {
      //是否需要默认展开
      arr.push(item.id)
      setDefaultExpanded(arr)
    }
    const obj: any = {
      title: taskLavelIcon(item),
      key: item.id,
      startTime: null,
      endTime: item.endTime,
      executeTime: item.executeTime,
      percent: item.percent,
      level: item.level,
      liableUsername: item.liableUsername,
      priority: item.priority,
      status: item.status,
      flag: item.flag,
      subtaskNum: item.subtaskNum,
      approval: item.approval,
      isPrivate: item.isPrivate,
      icon: item.icon,
      cycleNum: item.cycleNum,
      parentId: item.parentId,
      tagList: item.tagList,
    }
    if (_hasChild > 0) {
    } else {
      //是否需要展示点击的加减号
      obj.isLeaf = true
    }
    return obj
  }
  //获取图标及任务相关属性
  const taskLavelIcon = (item: any) => {
    const taskLavelIconHtml = []
    const xunIcon = $tools.asAssetsPath('/images/common/xun.png')
    const shenIcon = $tools.asAssetsPath('/images/common/shen.png')
    const yanIcon = $tools.asAssetsPath('/images/common/yan.png')
    const addIcon = $tools.asAssetsPath(`/images/task/${item.icon}.png`)
    //添加循环图标
    if (item.cycleNum >= 0) {
      if (item.cycleNum == 0) {
        taskLavelIconHtml.push(
          <span
            key={item.id + 1}
            className="icons"
            // style={{ backgroundImage: `url(${xunIcon})` }}
          >
            <img
              src={xunIcon}
              style={{
                width: '100%',
              }}
            />
          </span>
        )
      } else {
        taskLavelIconHtml.push(<span className="circleNum">循 {item.cycleNum}</span>)
      }
    }
    //添加审批图标
    if (item.approval > 0) {
      taskLavelIconHtml.push(
        <span key={item.id + 2} className="icons" style={{ backgroundImage: `url(${shenIcon})` }}>
          <img
            src={shenIcon}
            style={{
              width: '100%',
            }}
          />
        </span>
      )
    }
    //添加延迟图标
    if (item.status == 3) {
      taskLavelIconHtml.push(
        <span
          key={item.id + 3}
          className="icons"
          // style={{ backgroundImage: `url(${yanIcon})` }}
        >
          <img
            src={yanIcon}
            style={{
              width: '100%',
            }}
          />
        </span>
      )
    }
    //添加私密图标
    if (item.isPrivate > 0) {
      taskLavelIconHtml.push(
        <span
          key={item.id + 4}
          className="icons"
          // style={{ backgroundImage: `url(${$tools.asAssetsPath('/images/common/si.png')})` }}
        >
          <img
            src={$tools.asAssetsPath('/images/common/si.png')}
            style={{
              width: '100%',
            }}
          />
        </span>
      )
    }
    //添加冻结图标
    if (item.flag == 1) {
      taskLavelIconHtml.push(
        <span
          key={item.id + 5}
          className="icons"
          // style={{ backgroundImage: `url(${$tools.asAssetsPath('/images/common/dong.png')})` }}
        >
          <img
            src={$tools.asAssetsPath('/images/common/dong.png')}
            style={{
              width: '100%',
            }}
          />
        </span>
      )
    }
    //添加归档图标
    if (item.flag == 3) {
      taskLavelIconHtml.push(
        <span
          key={item.id + 6}
          className="icons"
          // style={{ backgroundImage: `url(${$tools.asAssetsPath('/images/common/gui.png')})` }}
        >
          <img
            src={$tools.asAssetsPath('/images/common/gui.png')}
            style={{
              width: '100%',
            }}
          />
        </span>
      )
    }
    //添加图标
    if (item.icon) {
      taskLavelIconHtml.push(
        <span
          key={item.id + 7}
          className="icons"
          // style={{ backgroundImage: `url(${addIcon})` }}
        >
          <img
            src={addIcon}
            style={{
              width: '100%',
            }}
          />
        </span>
      )
    }
    //添加标签
    const iconItem = []
    if (item.tagList) {
      for (let i = 0; i < item.tagList.length; i++) {
        iconItem.push(
          <b key={i} style={{ backgroundImage: `${item.tagList[i].rgb}` }}>
            {item.tagList[i].content}
          </b>
        )
      }
      taskLavelIconHtml.push(<em>{iconItem}</em>)
    }
    return (
      <div className="names" key={item.id + 1}>
        <span className={$c('nameLeftIcon')}></span>
        <span className={$c({ finishedTask: item.status === 2 })}>{item.name}</span>
        {taskLavelIconHtml}
      </div>
    )
  }
  // 点击展开按钮加载子节点时
  const onLoadData = (treeNode: any): Promise<void> => {
    return new Promise(resolve => {
      if (treeNode.children && treeNode.children.length > 0) {
        resolve()
        return
      }
      queryTreeChild(treeNode, resolve)
    })
  }
  // 查询组织架构子级
  const queryTreeChild = (treeNode: any, resolve?: () => void) => {
    const parameterId = treeNode.key
    const param = {
      id: treeNode.key,
      hasError: 0,
      userId: nowUserId,
      nextLevel: 1,
    }
    const url = '/task/queryChildTask'
    initDataTreeApi(param, url).then((resData: any) => {
      console.log(resData.data)
      if (resData.data) {
        const info: any = []
        info.push(resData.data)
        const newArr = [...treeData]
        function jsonRecursionChild(items: any) {
          for (let i = 0; i < items.length; i++) {
            const objArr: any[] = []
            const _taskId = items[i].key
            const newTreeId = parameterId
            if (newTreeId == _taskId) {
              const childrenData = info[0].chlids
              childrenData.map((item: any) => {
                const _hasChild = item.subtaskNum
                objArr.push(getItemsFun(_hasChild, item, false))
              })
              items[i].children = objArr //替换子节点
              break
            }
            //有childs的时候递归
            if (
              items[i].children != undefined &&
              items[i].children != '' &&
              items[i].children != null &&
              items[i].children instanceof Array
            ) {
              jsonRecursionChild(items[i].children)
            }
          }
        }
        jsonRecursionChild(newArr)
        setDatas(newArr)
        treeData = [...newArr]
        if (resolve) {
          resolve()
        }
      }
    })
  }
  //加载完成之后
  const onLoad = (loadedKeys: any) => {
    setDefaultExpanded(defaultExpanded)
  }
  //点击节点
  const onSelect = (loadedKeys: any) => {
    if (loadedKeys.length == 0) {
      return
    }
    console.log(loadedKeys)
    props.ascertain(loadedKeys[0], false)
  }
  //点击收起展开记录
  const onExpand = (expandedKeys: any) => {
    const getExpandedKeys = expandedKeys
    setDefaultExpanded(getExpandedKeys)
  }
  return (
    <div className="taskTree">
      <Tree
        expandedKeys={defaultExpanded}
        loadData={onLoadData}
        treeData={datas}
        onExpand={onExpand}
        // onLoad={onLoad}
        onSelect={onSelect}
      />
    </div>
  )
}
export default TaskTree

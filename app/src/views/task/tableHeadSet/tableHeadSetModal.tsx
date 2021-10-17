import React, { useRef, useReducer, useState, useEffect } from 'react'
import { Modal, Button, Checkbox, Row, Col, Input, message } from 'antd'
import './TableHeadSet.less'
import $c from 'classnames'
import { requestApi } from '../../../common/js/ajax'
import { useDrop, useDrag, DndProvider, DragSourceMonitor } from 'react-dnd'
import { SortPositon } from '../tagsManage/tagComon'

const TableHeadSetModal = ({ visible, closeModal }: any) => {
  const refreshTask = $store.getState().taskManage.refreshTaskFn //刷新 父页面 表头信息
  const nowSelectNode = $store.getState().taskManageTreeInfo.orgInfo //获取点击公司节点信息
  //   const [visible, setVisible] = useState(false)
  const [optionalList, setOptionalList] = useState([]) //表头数据
  const [selectList, setSelectList] = useState([]) //右侧展示数据
  const [selects, setSelects] = useState([]) //默认选择数据

  const handleOk = () => {
    saveTaskFormSetting()
  }

  useEffect(() => {
    if (!visible) return
    getTaskFormSetting()
  }, [visible])

  //监听 可选区域 选择变化
  useEffect(() => {
    setSelectList(optionalList.filter((item: any) => item.isCheck === 1).sort(SortPositon('ordinal')))

    setSelects(filterSelects(optionalList))
  }, [optionalList])

  //过滤选择数据
  const filterSelects = (arr: any) => {
    const res: any = []
    const selects = arr.filter((item: any) => item.isCheck === 1)
    selects.forEach((item: any) => res.push(item.defaultName))
    return res
  }
  //已选区域 拖动排序
  const dragChangeSort = (sourceItem: any, targetItem: any) => {
    const nowArr: any = [...selectList]
    //拖拽目标的Index
    let dragIndex = 0
    // 放置目标Index
    let TargetIndex = 0

    for (let i = 0; i < nowArr.length; i++) {
      if (sourceItem.id === nowArr[i].id) {
        dragIndex = i
      }
      if (targetItem.id === nowArr[i].id) {
        TargetIndex = i
      }
    }
    const temp: any = nowArr[dragIndex]
    nowArr.splice(dragIndex, 1) //移除拖拽项
    nowArr.splice(TargetIndex, 0, temp) //插入放置项
    setSelectList(
      nowArr.map((item: any, index: number) => {
        if (item.ordinal != -1) item.ordinal = index
        return item
      })
    )
  }

  // 恢复默认
  const reset = () => {
    const resetData = [...optionalList]
    resetData.forEach((item: any, index: number) => {
      item.name = item.defaultName
      item.isCheck = 1
      if (item.ordinal != -1) item.ordinal = index
    })
    setOptionalList(resetData)
  }
  // 获取表头数据
  const getTaskFormSetting = () => {
    const param = { teamInfoId: nowSelectNode.cmyId }
    requestApi({
      url: '/task/taskForm/findTaskFormSettingByTeamInfoId',
      param: param,
      json: false,
    }).then((res: any) => {
      if (res.success) {
        const taskFormSettings: any = [...res.data.data.taskFormSettings]

        taskFormSettings.forEach((item: any) => (item.teamInfoId = nowSelectNode.cmyId))
        setOptionalList(taskFormSettings)
      }
    })
  }

  // 保存表头数据
  const saveTaskFormSetting = () => {
    const param = {
      teamInfoId: nowSelectNode.cmyId,
      taskFormConfigs: [...selectList],
    }
    // console.log(param)
    requestApi({
      url: '/task/taskForm/saveTaskFormSetting',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        message.success('保存成功！')
        // 关闭修改模态框
        closeModal()
        // 刷新页面表头数据
        refreshTask('tableHead')
      }
    })
  }

  const RenderCheckboxItem = ({ item }: any) => {
    const [isEditor, setIsEditor] = useState(false)

    // 更新表头数据
    const updateName = (id: number, value: string) => {
      if (!value) return setIsEditor(false)
      const nowArr = [...optionalList]
      nowArr.forEach((item: any) => {
        if (item.id === id) item.name = value
      })
      setOptionalList(nowArr)
      setIsEditor(false)
    }
    // 更新表头数据选择状态
    const updateChecked = (obj: any, value: boolean) => {
      const nowArr = [...optionalList]
      nowArr.forEach((item: any) => {
        if (item.id === obj.id) item.isCheck = Number(value)
      })
      setOptionalList(nowArr)
    }

    return (
      <Col span={6}>
        <Checkbox
          value={item.defaultName}
          disabled={item.isEnable === 0}
          onChange={(e: any) => {
            updateChecked(item, e.target.checked)
          }}
        >
          {isEditor ? (
            <Input
              className="editor-input"
              autoFocus
              maxLength={6}
              defaultValue={item.name}
              onBlur={e => updateName(item.id, e.target.value)}
            />
          ) : (
            <>
              <span className="checkbox-name">{item.name}</span>
            </>
          )}
        </Checkbox>
        <i className={$c('editor-icon', { none: isEditor })} onClick={() => setIsEditor(true)}></i>
      </Col>
    )
  }

  const RenderSelectsItem = ({ item }: any) => {
    const [, drag] = useDrag({
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
      //   begin: monitor => {
      //     console.log(monitor.getItem())
      //   },

      item: { type: 'dropItem', itemData: item },
    })
    const [, drop] = useDrop({
      accept: 'dropItem',

      drop: (dragItem, DropTargetMonitor) => {
        const sourceItem = DropTargetMonitor.getItem().itemData //拖动源数据
        const targetItem = JSON.parse(dragRef.current.dataset.itemdata) //目标源数据

        if (sourceItem.ordinal == -1 || targetItem.ordinal == -1) return

        dragChangeSort(sourceItem, targetItem)
      },
    })
    const dragRef: any = useRef({})
    drag(drop(dragRef))
    return (
      <li
        className={$c('group-item', { isDragItem: item.ordinal != -1 })}
        ref={dragRef}
        data-itemdata={JSON.stringify(item)}
      >
        {item.name}
      </li>
    )
  }
  return (
    <Modal
      className="table_head_set_modal"
      title="选择表头显示内容"
      visible={visible}
      onOk={handleOk}
      onCancel={() => {
        closeModal()
      }}
    >
      <div className="setting-container">
        <div className="optional-contaier">
          <div className="header-title">可选字段({optionalList.length - selectList.length})</div>
          <Checkbox.Group style={{ width: '100%' }} value={selects}>
            <Row>
              {optionalList.map((item: any, index: number) => (
                <RenderCheckboxItem item={item} key={index} />
              ))}
            </Row>
          </Checkbox.Group>
        </div>
        <div className="selects-contaier">
          <div className="header-title">已选字段({selectList.length})</div>
          <ul>
            {selectList.map((item: any, index: number) => (
              <RenderSelectsItem item={item} key={index} />
            ))}
          </ul>
        </div>
      </div>
      <Button className="reset-btn" onClick={() => reset()}>
        恢复默认
      </Button>
    </Modal>
  )
}

export default TableHeadSetModal

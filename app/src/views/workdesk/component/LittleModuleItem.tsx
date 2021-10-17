import React, { useEffect, useState, useRef } from 'react'
import $c from 'classnames'
import './LittleModuleItem.less'
import { CaretDownOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Button, Dropdown, Menu, Input, Modal, Tooltip, message } from 'antd'
import { useDrag, useDrop, DragSourceMonitor, DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
const { confirm } = Modal
interface ItemProps {
  moduleId: number
  moduleName: string
  modulePosition: number
  moduleType: number
  elementModels: ElementItemProps[]
  elements: ElementItemProps[]
}

interface ElementItemProps {
  id?: number
  moduleId?: number
  elementId: number
  elementCode: string
  elementName: string
  elementTypeName: string
  elementPosition: number
  status: number
  count: number
}

interface ItemType {
  id: string
  name: string
  elementCode: string
  position: string
}
interface LittleProps {
  data: any
  moduleTheme: any
  editModal: (type: string, obj: any) => void
}
interface ModuleItemProps {
  item: ItemProps
  editModal: (type: string, obj: any) => void
  index: number
}
interface ModuleItemDropProps {
  item: ItemType
  editModal: (type: string, obj: any) => void
}
const ModuleItemDrop = ({ item, editModal }: ModuleItemDropProps) => {
  const [tagMove, setTagMove] = useState(false)
  const [{ opacity }, drag] = useDrag({
    begin: () => setTagMove(true),
    end: () => setTagMove(false),
    collect: (monitor: DragSourceMonitor) => ({
      opacity: monitor.isDragging() ? 0.4 : 1,
    }),
    item: { type: 'drop-item', itemData: item },
  })
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: 'drop-item',
    drop: (dragItem, DropTargetMonitor) => {
      const sourceItem = DropTargetMonitor.getItem().itemData
      const targetItem = JSON.parse(dragRef.current.dataset.itemdata)
      //左侧待选区拖动的元素
      if (sourceItem.hasOwnProperty('isDisabled') && !sourceItem.isDisabled) {
        if (targetItem.elementCode == '') {
          //当选取为空时可放入
          const sourceObj = { ...sourceItem }
          delete sourceObj.isDisabled //删除不需要的属性
          sourceObj.elementPosition = parseInt(targetItem.id)
          //OKR只能拖动到通屏
          const _dragRefDom = $(dragRef.current)
            .parents('.moduleSetItem')
            .attr('data-itemdata')
          if (_dragRefDom) {
            if (
              JSON.parse(_dragRefDom).moduleType == 0 &&
              (sourceItem.elementCode == 'okr' || sourceItem.elementCode == 'focus_okr')
            ) {
              message.warning('OKR只能拖动到通屏哦~')
              return
            }
          }
          editModal('dropRef', {
            item: sourceObj,
            param: targetItem,
          })
        }
      } else {
        //自身拖动-没有再一个模块中不能进行拖动
        if (sourceItem.position !== targetItem.position) {
          return
        }
        //自身不能与自身进行数据交互（性能优化）
        if (sourceItem.id == targetItem.id) {
          return
        }
        //同一模块中空元素不能被填充
        if (targetItem.elementCode == '') {
          return
        }
        editModal('dropSModal', {
          sourceItem: sourceItem, //拖拽源
          targetItem: targetItem, //目标源
        })
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })
  const isActive = canDrop && isOver
  let border = ''
  if (isActive) {
    border = '1px dashed #4285f4'
  } else if (canDrop) {
    border = '1px dashed #ffffff'
  }
  const dragRef: any = useRef({})
  drag(drop(dragRef))
  return (
    <div
      ref={dragRef}
      data-itemdata={JSON.stringify(item)}
      className={$c({
        moduleItem: item.elementCode !== '',
        moduleNoneItem: item.elementCode === '',
      })}
      key={item.id}
      style={{ opacity, border }}
    >
      {item.name}
      {!tagMove && (
        <div
          className="del-item-icon"
          onClick={() => {
            editModal('delTag', {
              position: item.position,
              code: item.elementCode,
            })
          }}
        ></div>
      )}
    </div>
  )
}
//组装数据
const fillArray = (len: number, elementModels: Array<any>) => {
  return elementModels.concat(
    new Array(len - elementModels.length).fill({
      moduleId: null,
      elementId: 0,
      elementCode: '',
      elementName: '',
      elementTypeName: '',
      elementPosition: 0,
      status: 0,
      count: 0,
    })
  )
}

//小模块组件
const ModuleItem = ({ item, editModal, index }: ModuleItemProps) => {
  // ************************拖动功能 start**********************//
  const [moduleName, setModuleName] = useState(item.moduleName)
  const [isMove, setIsMove] = useState(false) //模块是否处于拖动状态
  const [isEdit, setIsEdit] = useState(false)
  const [{ opacity }, drag, preview] = useDrag({
    begin: () => setIsMove(true),
    end: () => setIsMove(false),
    collect: (monitor: DragSourceMonitor) => ({
      opacity: monitor.isDragging() ? 0.4 : 1,
    }),
    item: { type: 'modalItem', itemData: item, index },
  })
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: 'modalItem',
    drop: (dragItem, minoter) => {
      const sourceItem = minoter.getItem().itemData
      const targetItem = JSON.parse(dropRef.current.dataset.itemdata)
      editModal('dropModal', {
        sPosition: targetItem.modulePosition, //拖拽源position
        tPosition: sourceItem.modulePosition, //目标position
      })
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })
  const isActive = canDrop && isOver
  let border = ''
  if (isActive) {
    border = '1px dashed #4285f4'
  } else if (canDrop) {
    border = '1px dashed #c3c7c4'
  }
  const dropRef = useRef<any>(null)
  // 使用 drag 和 drop 对 ref 进行包裹，则组件既可以进行拖拽也可以接收拖拽组件
  drag(drop(dropRef))
  // ************************拖动功能 end**********************//
  const elementModels = item.elements || item.elementModels
  const len = elementModels?.length == 5 ? 5 : 4
  const nowElementModels = fillArray(len, elementModels)

  const listData: Array<ItemType> = []
  nowElementModels.map((_item, index) => {
    listData.push({
      id: `${index}`,
      name: _item.elementName,
      elementCode: _item.elementCode,
      position: `${item.modulePosition}`,
    })
  })

  //通屏二分屏切换 moduleType0二分屏1通屏
  const changeScreen = (moduleType: number) => {
    if (moduleType == 1) {
      //切换为小屏的时候 elementModels 包含 okr 且不能执行
      const elementModels = item.elements || item.elementModels
      const isokrModel = elementModels.some(item => item.elementCode == 'okr')
      const isfocusModel = elementModels.some(item => item.elementCode == 'focus_okr')
      if (isokrModel || isfocusModel) {
        message.warning('OKR只能为通屏哦~')
        return
      }
    }
    editModal('modalType', {
      position: item.modulePosition,
      type: moduleType == 0 ? 1 : 0,
    })
  }
  const sureOk = () => {
    editModal('modalName', {
      position: item.modulePosition,
      name: moduleName,
    })
    setIsEdit(false)
  }

  const isOkrModel = elementModels.some(
    (item: any) => item.elementCode == 'okr' || item.elementCode == 'focus_okr'
  )
  return (
    <div
      className={$c('moduleSetItem', { throughScreen: item.moduleType == 1 || isOkrModel })}
      ref={dropRef}
      data-itemdata={JSON.stringify(item)}
      style={{ opacity, border }}
    >
      <div className="moduleSetTitle" data-itemdata={JSON.stringify(item)}>
        <div className="moduleNameBox" data-itemdata={JSON.stringify(item)}>
          <span className="moduleName" data-itemdata={JSON.stringify(item)}>
            {item.moduleName}
          </span>
          <i></i>
        </div>
        {!isMove && (
          <span
            className="edit_item"
            onClick={(e: any) => {
              const target = e.target
              const module = $(target).parents('.moduleSetItem')
              $(module).attr('draggable', 'false')
              setIsEdit(true)
            }}
            data-itemdata={JSON.stringify(item)}
          ></span>
        )}
        {!isMove && (
          <Tooltip title={item.moduleType == 0 ? '切换成通屏' : '切换成二分屏'}>
            <span
              className="change_item"
              onClick={() => changeScreen(item.moduleType)}
              data-itemdata={JSON.stringify(item)}
            ></span>
          </Tooltip>
        )}
        <span className="move_item" ref={drag} data-itemdata={JSON.stringify(item)}></span>
        {isEdit && !isMove && (
          <div className="edit_modal_box">
            <Input
              placeholder="请输入模块名称 "
              defaultValue={item.moduleName}
              maxLength={9}
              onChange={e => setModuleName(e.target.value)}
              autoFocus
            />
            <span
              className="edit_icon"
              onClick={(e: any) => {
                const target = e.target
                const module = $(target).parents('.moduleSetItem')
                $(module).attr('draggable', 'true')
                sureOk()
              }}
              data-itemdata={JSON.stringify(item)}
            ></span>
          </div>
        )}
      </div>
      <div className={$c('moduleSetContent', { modalSetScreen: item.moduleType == 1 || isOkrModel })}>
        {listData.map((_item: ItemType) => (
          <ModuleItemDrop item={_item} key={_item.id} editModal={editModal} />
        ))}
      </div>
      {!isMove && (
        <div
          className="del-item-icon"
          onClick={() =>
            confirm({
              title: '是否确认删除此功能模块？',
              centered: true,
              icon: <ExclamationCircleOutlined />,
              content: '',
              onOk() {
                editModal('removeModels', {
                  position: item.modulePosition,
                })
              },
            })
          }
        ></div>
      )}
    </div>
  )
}

//模块编辑器小模块组件
const LittleModuleItem = ({ data, moduleTheme, editModal }: LittleProps) => {
  const [modalData, setModalData] = useState([])
  useEffect(() => {
    setModalData(data)
  }, [data])
  //添加模块按钮下拉选项
  const dropMenu = (
    <Menu
      onClick={params => {
        editModal('addModal', { key: params.key })
      }}
    >
      <Menu.Item key="1">添加通屏</Menu.Item>
      <Menu.Item key="0">添加二分屏</Menu.Item>
    </Menu>
  )
  return (
    <div>
      <div className="module-set-tips flex center-v">
        <p>你可以通过拖放组件库来自定义界面模块，按照自己喜爱顺序进行排列</p>
        <Button
          className="defaut-primary-btn"
          style={{ border: 'none', boxShadow: 'none' }}
          onClick={() => editModal('recovery', 1)}
        >
          恢复默认
        </Button>
        <Dropdown overlay={dropMenu} trigger={['click']}>
          <Button
            style={{ marginLeft: 12, background: '#4285f4', color: '#fff', width: '90px', height: '32px' }}
          >
            添加模块 <CaretDownOutlined />
          </Button>
        </Dropdown>
      </div>
      <DndProvider backend={HTML5Backend}>
        <div className={$c('module-set-content flex-1', moduleTheme)}>
          <div className="module-set-box">
            <div style={{ paddingRight: '13px' }}>
              <div
                className="rightSet flex-1"
                style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}
              >
                {modalData.map((item: ItemProps, index: number) => {
                  const modulePosition = item.modulePosition || index
                  return (
                    <ModuleItem
                      key={index}
                      item={{ ...item, modulePosition }}
                      editModal={editModal}
                      index={index}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </DndProvider>
    </div>
  )
}

export default LittleModuleItem

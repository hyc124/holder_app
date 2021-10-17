import React, { useRef } from 'react'
import { useDrag, useDrop, DragSourceMonitor } from 'react-dnd'
import $c from 'classnames'

interface TagProps {
  dropArea: string
  tag: any
  canDeleteTag?: boolean
  handleChange: (tag: any) => void
  deleteTag?: (tag: any) => void
  dragChangeSort?: (sourceItem: any, targetItem: any) => void
}

const TagItem = ({ dropArea, tag, canDeleteTag, deleteTag, dragChangeSort }: any) => {
  const [, drag] = useDrag({
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: (monitor: any) => {
      let drag = true
      if (dragRef?.current.innerHTML == '已归档') {
        drag = false
      }
      return drag
    },
    item: { type: 'dropItem', itemData: tag },
  })
  const [, drop] = useDrop({
    accept: 'dropItem',

    drop: (dragItem, DropTargetMonitor) => {
      const sourceItem = DropTargetMonitor.getItem().itemData //拖动源数据
      const targetItem = JSON.parse(dragRef.current.dataset.itemdata) //目标源数据
      // 排序拖动是自定义标签区域(已归档标签不支持拖动排序)
      if (dropArea == 'CustomContainer' || targetItem.id == -2) return

      //一类区 拖动的元素排序
      dragChangeSort(sourceItem, targetItem)
    },
  })
  const dragRef: any = useRef({})
  drag(drop(dragRef))

  return (
    <span
      ref={dragRef}
      className={$c('tag-style', { ban: !canDeleteTag && tag.isSelect })}
      data-itemdata={JSON.stringify(tag)}
    >
      {tag.content}
      {canDeleteTag && tag.type !== 1 && (
        <span
          className="del-icon"
          onClick={() => {
            deleteTag(tag)
          }}
        ></span>
      )}
    </span>
  )
}

export default TagItem

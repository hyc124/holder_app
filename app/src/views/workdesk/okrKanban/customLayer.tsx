import React, { DragLayer } from 'react-dnd'
import { useState, useEffect } from 'react'
const layerStyles: any = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
}
function getItemStyles(props: any) {
  const { initialOffset, currentOffset } = props
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    }
  }
  let { x, y } = currentOffset
  if (props.snapToGrid) {
    x -= initialOffset.x
    y -= initialOffset.y
    ;[x, y] = snapToGrid(x, y)
    x += initialOffset.x
    y += initialOffset.y
  }
  const transform = `translate(${x}px, ${y}px)`
  return {
    transform,
    WebkitTransform: transform,
  }
}
const snapToGrid = (x: any, y: any) => {
  const snappedX = Math.round(x / 32) * 32
  const snappedY = Math.round(y / 32) * 32
  return [snappedX, snappedY]
}

export const BoxDragPreview = ({ title }: { title: any }) => {
  const [tickTock, setTickTock] = useState(false)
  useEffect(
    function subscribeToIntervalTick() {
      const interval = setInterval(() => {
        setTickTock(!tickTock)
      }, 500)
      return () => clearInterval(interval)
    },
    [tickTock]
  )
  const backgroundColor = tickTock ? 'yellow' : 'white'
  const styles: any = {
    border: '1px dashed gray',
    padding: '0.5rem 1rem',
    cursor: 'move',
  }
  return (
    <div
      style={{
        display: 'inline-block',
        transform: 'rotate(-7deg)',
        WebkitTransform: 'rotate(-7deg)',
      }}
      role="BoxPreview"
    >
      <div style={{ ...styles, backgroundColor }}>{title}</div>
    </div>
  )
}

const CustomDragLayer = (props: any) => {
  const { item, itemType, isDragging } = props
  function renderItem() {
    switch (itemType) {
      case 'box':
        return <BoxDragPreview title={item.title} />
      default:
        return null
    }
  }
  if (!isDragging) {
    return null
  }
  return (
    <div style={layerStyles}>
      <div style={getItemStyles(props)}>{renderItem()}</div>
    </div>
  )
}
export default DragLayer(monitor => ({
  item: monitor.getItem(),
  itemType: monitor.getItemType(),
  initialOffset: monitor.getInitialSourceClientOffset(),
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging(),
}))(CustomDragLayer)

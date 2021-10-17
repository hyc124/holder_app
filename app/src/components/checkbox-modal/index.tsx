/**
 * 表单多选模态框
 */
import React, { useState, useEffect } from 'react'
import { Checkbox, Row, Modal, Col } from 'antd'
import './index.less'

interface CheckBoxModalProps {
  list: { id: number; val: string }[]
  visible: boolean
  selected: { id: string; val: string }[]
  onOk: (selectIds: string[]) => void
  onCancel: () => void
}

const CheckboxModal = (props: CheckBoxModalProps) => {
  const { visible, onOk, list, onCancel, selected } = props
  //选中的项
  const [selectIds, setSelectIds] = useState<Array<any>>([])
  useEffect(() => {
    setSelectIds(selected)
  }, [selected])
  //选择多选后处理
  const changeCheckBoxSel = (checkedValue: any[]) => {
    const checkSel = list.filter(item => checkedValue.includes(String(item.id)))
    setSelectIds(checkSel)
  }
  //默认选中的项
  const defaultValues = selectIds.map(item => {
    return String(item.id)
  })
  return (
    <Modal
      visible={visible}
      className="checkbox-select-modal"
      width={400}
      onCancel={onCancel}
      onOk={() => {
        onOk(selectIds)
      }}
      title={'请选择'}
      centered
      closable
      destroyOnClose
    >
      <Checkbox.Group onChange={changeCheckBoxSel} value={defaultValues}>
        {list.map((item, index) => (
          <Row key={index}>
            <Col>
              <Checkbox value={`${item.id}`}>{item.val}</Checkbox>
            </Col>
          </Row>
        ))}
      </Checkbox.Group>
    </Modal>
  )
}

export default CheckboxModal

import React from 'react'
import { Modal, Button, message } from 'antd'
import { deskFollow } from '../workdesk/getData'
interface FollowPropPop {
  datas: any,
  onclose: (state: boolean) => void
}
const deskFollowPop = ({ datas, onclose }: FollowPropPop) => {
  const props = datas.currentData

  const handleFollow = (state: number) => {
    deskFollow({ id: props.noticeTypeId, state: state })
      .then((res: any) => {
        if (res.returnCode == 0) {
          message.success('操作成功！')
        } else {
          message.error(res.returnMessage)
        }
        onclose(false)
      })
      .catch(err => {
        message.error(err.returnMessage)
        onclose(false)
      })
  }
  return (
    <Modal
      visible={datas.visiblePop}
      title="操作提示"
      width={395}
      className="desk-follow-pop"
      onCancel={() => onclose(false)}
      footer={[
        <Button
          key="back"
          onClick={() => {
            handleFollow(1)
          }}
        >
          拒绝
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => {
            handleFollow(0)
          }}
        >
          同意
        </Button>,
      ]}
    >
      <p>{props.content}</p>
    </Modal>
  )
}

export default deskFollowPop

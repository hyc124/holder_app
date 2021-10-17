import React, { useRef, useCallback, useEffect, useState } from 'react'
import './PrintModal.less'
import { useReactToPrint } from 'react-to-print'
import { Button, Divider, message, Modal, Timeline } from 'antd'
import { ApprovalDetailProps } from '@/src/views/approval/components/ApprovalDettail'
import { ComponentToPrint } from '@/src/views/approval/components/ComponentToPrint'
import { addApprovalPrintLog, findApprovalPrintLog } from '@/src/views/workdesk/getData'

interface PrintProps {
  data?: ApprovalDetailProps
  type?: string
  name?: string
  triggerData?: any
  children?: any
  onClose: () => void
  selstate?: any
}

//打印审批
const PrintModal = ({ data, type, name, triggerData, children, onClose, selstate }: PrintProps) => {
  const componentRef = useRef<any>()
  const [printTimes, setPrintTimes] = useState(false)
  const [printTimesData, setPrintTimesData] = useState([])
  const { nowUserId } = $store.getState()
  useEffect(() => {
    if (data) {
      // 只有审批打印才记录打印次数
      queryApprovalPrintLog()
    }
  }, [data])
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    removeAfterPrint: true,
    onAfterPrint: () => {
      if (data && data?.id) {
        // 记录打印次数
        addApprovalPrintLog({ approvalId: data?.id, userId: nowUserId })
          .then(() => {
            queryApprovalPrintLog()
            console.log(componentRef.current)
          })
          .catch(err => {
            message.error(err.returnMessage)
          })
      }
    },
  })

  const showPrintTimes = () => {
    setPrintTimes(true)
  }

  // 查询打印次数
  const queryApprovalPrintLog = () => {
    findApprovalPrintLog({ approvalId: data?.id })
      .then((res: any) => {
        setPrintTimesData(res.dataList)
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }

  return (
    <div className="print-modal-container">
      <span className="close-print" onClick={onClose}></span>
      <div className="print-modal-content">
        <div className="print-header-box">
          {data && (
            <Button
              type="default"
              className={`${printTimesData.length === 0 ? 'gray_btn' : 'bule_btn'}`}
              onClick={showPrintTimes}
              disabled={printTimesData.length === 0 ? true : false}
            >
              打印次数{printTimesData.length === 0 ? '' : `(${printTimesData.length})`}
            </Button>
          )}
          <Button type="primary" onClick={handlePrint}>
            打印
          </Button>
        </div>
        {data?.state === 1 && (
          <img
            style={{
              position: 'absolute',
              right: '30px',
              top: '50px',
              width: '110px',
              height: '90px',
            }}
            src={$tools.asAssetsPath('/images/common/pass.png')}
          />
        )}
        {data?.state === 2 && (
          <img
            style={{
              position: 'absolute',
              right: '30px',
              top: '50px',
              width: '110px',
              height: '90px',
            }}
            src={$tools.asAssetsPath('/images/common/refuse.png')}
          />
        )}

        {!children && name && data && type && (
          <ComponentToPrint
            ref={componentRef}
            name={name}
            data={data}
            triggerData={triggerData}
            type={type}
            selstate={selstate}
          />
        )}
        {children && (
          <div style={{ padding: '20px 20px' }} ref={componentRef}>
            {children}
          </div>
        )}
      </div>
      {printTimes && (
        <Modal
          className="cancleSend-modal "
          width={400}
          visible={printTimes}
          title="打印日志"
          centered={true}
          footer={null}
          onCancel={() => {
            setPrintTimes(false)
          }}
          bodyStyle={{
            display: 'flex',
            alignItems: 'center',
            padding: 0,
            overflow: 'hidden',
            height: '246px',
          }}
        >
          <Timeline className="printTimeLine">
            {printTimesData.map((item: any, index: number) => {
              return (
                <Timeline.Item className="printInfoBox" key={index}>
                  <span className="printTime">{item.printTime}</span>
                  <span className="printUser">
                    {item.deptName == null || item.deptName == 'null' ? '' : item.deptName + '-'}
                    {item.username}
                  </span>
                </Timeline.Item>
              )
            })}
          </Timeline>
        </Modal>
      )}
    </div>
  )
}

export default PrintModal

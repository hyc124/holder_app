import { useEffect, useState } from 'react'
import React from 'react'
import './MeetConculsion.less'
import { Button, Radio, message } from 'antd'
import NoneData from '@/src/components/none-data/none-data'

// datas {
//   typeId: number
//   listType: number
// }
const MeetConculsion = (datas: any) => {
  const props = datas.datas
  const { nowUserId, loginToken } = $store.getState()
  const [contCon, setContCon] = useState('')
  const [tips, setTips] = useState<any>(2)
  const [cont, setCont] = useState('')

  useEffect(() => {
    getConclusion()
  }, [])
  const getConclusion = () => {
    const param = {
      meetingId: props.queryId,
    }
    $api
      .request('/public/meeting/getConclusion', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then((resData: any) => {
        const _datas = resData.data.conclusion
        setContCon(_datas)
      })
      .catch(() => {
        console.log('/public/meeting/getConclusion:', param)
      })
  }

  const remindNoticeType = (e: any) => {
    setTips(e.target.value)
  }

  const getContent = (e: any) => {
    setCont(e.target.value)
  }

  const conclude = () => {
    const param = {
      meetingId: props.queryId,
      flag: tips,
      conclusion: cont,
    }
    if (cont === '') {
      return false
    }
    $api
      .request('/public/meeting/conclude', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then((resData: any) => {
        if (resData.returnCode == 0) {
          getConclusion()
          message.success('保存会议结论成功！')
        } else {
          message.success(resData.returnMessage)
        }
      })
      .catch(() => {
        console.log('/public/meeting/getConclusion:', param)
      })
  }

  return (
    <div className="meet_cnculsion_box meet_details_content_box">
      <div className="MeetConculsionCont meet_details_content">
        {props.nowStatus != 2 && (
          <div className="noneConclu">
            <div className="meetConcluTitle">
              <span>会议结论</span>
              <span>（填写并保存后，会议信息无法修改，且结论会同步到参会成员的日程中）</span>
            </div>
            {contCon !== '' && (
              <div className="conclu-detail-show" dangerouslySetInnerHTML={{ __html: contCon }}></div>
            )}
            {(contCon == null || contCon === '') && (
              <div className="isCommonUser">
                <span className="tit"> 是否将结论同步给【列席成员】</span>
                <div>
                  <Radio.Group onChange={remindNoticeType} defaultValue={tips}>
                    <Radio value={1}>是</Radio>
                    <Radio value={2}>否</Radio>
                  </Radio.Group>
                </div>
              </div>
            )}
            {(contCon == null || contCon === '') && (
              <textarea
                className="conclu-text"
                maxLength={10000}
                onChange={getContent}
                placeholder="请输入会议格式，建议格式：1.会议的总结和结论； 2.进一步需要讨论的问题； 3.谁来承担什么责任，包括启动下次会议； 4.下一步的努力方向和目标"
              ></textarea>
            )}
          </div>
        )}
        {props.nowStatus == 2 && <NoneData />}
      </div>
      {(contCon == null || contCon === '') && props.nowStatus != 2 && (
        <div className="meetConculsionFooter meet_details_footer_box">
          <div className="conculsion_details_footer">
            <div className="sendBtn_box">
              <Button
                className="cancleSend"
                onClick={() => {
                  console.log('保存')
                  conclude()
                }}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MeetConculsion

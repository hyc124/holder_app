import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import PlanMindMeunItem from './planMindMeunItem'
import { getReadInquire } from './getData'
let refgetReadDatas: any = null
export const refgetReadDatasFn = () => {
  refgetReadDatas()
}
const WorkPlanMindRightMeun = () => {
  const [iteminfo, setIteminfo] = useState<any>({
    type: 0,
    name: '',
    time: '',
  })
  const [itemRead, setItemRead] = useState<any>([
    { type: 0, allNum: 0, unreadNum: 0 }, //收到的协同
    { type: 1, allNum: 0, unreadNum: 0 }, //发出的协同
    { type: 2, allNum: 0, unreadNum: 0 }, //收到的共享
    { type: 3, allNum: 0, unreadNum: 0 }, //发送的共享
    { type: 4, allNum: 0, unreadNum: 0 }, //待办计划
  ])
  const refComplete = useRef(null)
  useEffect(() => {
    getReadDatas() //获取已读未读信息
  }, [iteminfo.type])
  //点击对应的类型
  const setItem = (type: number, name: string, event: any) => {
    jQuery('.optBtnMoreList,.portrait_okrMain,.eidt_Kr_Process,.mindmap_datepickr').hide()
    setIteminfo({
      type: type,
      name: name,
      time: Date.parse(new Date().toString()),
    })
    jQuery('.WorkPlanMindRightMeun').removeClass('hide_animate')
    //点击空白处
    jQuery('.work_plan_mind_content,.workPlanContainer')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.WorkPlanMindRightMeun') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          $('.WorkPlanMindRightMeun').addClass('hide_animate')
          jQuery('.work_plan_mind_content,.workPlanContainer').off('click')
        }
      })
    jQuery('.WorkPlanMindRightMeun .tabItem')
      .off()
      .click(function() {
        jQuery('.WorkPlanMindRightMeun').removeClass('hide_animate')
      })
  }
  refgetReadDatas = () => {
    getReadDatas()
  }
  //获取已读未读信息
  const getReadDatas = () => {
    const url = '/task/work/plan/countRight'
    const param = {
      userId: $store.getState().nowUserId,
      account: $store.getState().nowAccount,
    }
    getReadInquire(param, url).then((resData: any) => {
      const list = resData.data || []
      const origin: { type: any; allNum: any; unreadNum: any }[] = []
      itemRead.map((item: any) => {
        list.map((items: any) => {
          if (item.type == items.type) {
            origin.push({
              type: items.type,
              allNum: items.allNum,
              unreadNum: items.unreadNum,
            })
          }
        })
      })
      origin && setItemRead(origin)
    })
  }

  return (
    <div className="WorkPlanMindRightMeun hide_animate" ref={refComplete}>
      <div className="leftTabBox">
        <div
          key="0"
          data-name="acceptCooperate"
          className={`tabItem ${iteminfo.type == 0 ? 'active' : ''}`}
          onClick={e => {
            setItem(0, '收到的协同', e)
          }}
        >
          <span className={`red_count ${itemRead[0].unreadNum == 0 && 'noshow'}`}>{itemRead[0].unreadNum}</span>
          <span className="tab_txt">收到的协同</span>
          <span className={`total_count ${itemRead[0].allNum == 0 && 'noshow'}`}>({itemRead[0].allNum})</span>
        </div>
        <div
          key="1"
          onClick={e => {
            setItem(1, '发起协同', e)
          }}
          data-name="sendCooperate"
          className={`tabItem ${iteminfo.type == 1 ? 'active' : ''}`}
        >
          <span className={`red_count ${itemRead[1].unreadNum == 0 && 'noshow'}`}>{itemRead[1].unreadNum}</span>
          <span className="tab_txt">发起协同</span>
          <span className={`total_count ${itemRead[1].allNum == 0 && 'noshow'}`}>({itemRead[1].allNum})</span>
        </div>
        <div
          key="2"
          onClick={e => {
            setItem(2, '待办计划', e)
          }}
          data-name="waitPlan"
          className={`tabItem ${iteminfo.type == 2 ? 'active' : ''}`}
        >
          <span className={`red_count ${itemRead[4].unreadNum == 0 && 'noshow'}`}>{itemRead[4].unreadNum}</span>
          <span className="tab_txt">待办计划</span>
          <span className={`total_count ${itemRead[4].allNum == 0 && 'noshow'}`}>({itemRead[4].allNum})</span>
        </div>
        <div
          key="3"
          onClick={e => {
            setItem(3, '收到的共享', e)
          }}
          data-name="acceptShare"
          className={`tabItem ${iteminfo.type == 3 ? 'active' : ''}`}
        >
          <span className={`red_count ${itemRead[2].unreadNum == 0 && 'noshow'}`}>{itemRead[2].unreadNum}</span>
          <span className="tab_txt">收到的共享</span>
          <span className={`total_count ${itemRead[2].allNum == 0 && 'noshow'}`}>({itemRead[2].allNum})</span>
        </div>
        <div
          key="4"
          onClick={e => {
            setItem(4, '发起的共享', e)
          }}
          data-name="sendShare"
          className={`tabItem ${iteminfo.type == 4 ? 'active' : ''}`}
        >
          <span className={`red_count ${itemRead[3].unreadNum == 0 && 'noshow'}`}>{itemRead[3].unreadNum}</span>
          <span className="tab_txt">发起的共享</span>
          <span className={`total_count ${itemRead[3].allNum == 0 && 'noshow'}`}>({itemRead[3].allNum})</span>
        </div>
      </div>
      <div className="rightCon">
        <PlanMindMeunItem info={iteminfo}></PlanMindMeunItem>
      </div>
    </div>
  )
}

export default WorkPlanMindRightMeun

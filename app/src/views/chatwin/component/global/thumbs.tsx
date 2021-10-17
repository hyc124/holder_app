/**
 * 渲染沟通消息=点赞信息
 */
import React from 'react'
interface ThumbProps {
  data: [] //点赞数据
  itemEvent: (key: string) => void //表情点击事件 key:表情对应的标识符
}

const ThumbMember: React.FC<ThumbProps> = ({ data, itemEvent }) => {
  const handelClick = (e: React.MouseEvent<HTMLLIElement, MouseEvent>, emojiKey: string) => {
    e.stopPropagation()
    itemEvent(emojiKey)
  }
  return (
    <ul className={`${data.length ? 'thumbIcons' : ''}`}>
      {data.map((item: globalInterface.EmojiAppraiseProps, index: number) => {
        return (
          <li key={index} onClick={e => handelClick(e, item.emoticonName)}>
            <img src={$tools.asAssetsPath(`/emoji/${item.emoticonName}.svg`)} />
            {item.operateUsername}
          </li>
        )
      })}
    </ul>
  )
}

export default React.memo(ThumbMember)

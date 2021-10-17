import React from 'react'
import './chat-emoji.less'
import EmojiMenu from './emoji.json'

interface State {
  visible: boolean
}

//点赞图标组件
class ChatEmoji extends React.Component<any, State> {
  render() {
    const { selectEmoji } = this.props
    return (
      <div className="emoji-main-content emoji-like">
        {EmojiMenu.emojiLike.map(item => (
          <span
            className="emoji-item"
            key={item.title}
            onClick={() => {
              selectEmoji(item.key)
            }}
          >
            <img src={$tools.asAssetsPath(`/emoji/${item.key}.svg`)} />
          </span>
        ))}
      </div>
    )
  }
}

export default ChatEmoji

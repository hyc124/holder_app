import React from 'react'
import Lottie from 'react-lottie'
import * as animationData from './animation.json'

export default class LottieViews extends React.PureComponent {
  render() {
    const defaultOptions: any = {
      loop: true,
      autoplay: true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
      },
    }
    return (
      <div className="lottieBox">
        <Lottie
          width={200}
          height={200}
          options={{
            animationData: animationData,
          }}
        />
      </div>
    )
  }
}

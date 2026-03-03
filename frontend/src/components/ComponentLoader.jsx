import React from 'react'
import Lottie from 'lottie-react';
import trailLoading from "../assets/animation/TrailLoading.json";

export default function ComponentLoader() {
  return (
    <div className='w-full sm:w-1/2 font-bold flex justify-center items-center flex-col'>

        <div className='w-30 h-30'>
            <Lottie animationData={trailLoading} loop={true} />
        </div>
    
      Jugaad chalu hai bhai...
    </div>
  )
}

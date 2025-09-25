import React from 'react'
type Likes={
  likes:number;
}
const Likes:React.FC<Likes> = ({likes}) => {
  return (
    <div className='relative w-[100px] h-[100px]'>
<div className="absolute inset-0 bg-black flex items-center justify-center">

        <span className='text-white font-bold'>{likes}</span>
      </div>
      
    </div>
  )
}

export default Likes

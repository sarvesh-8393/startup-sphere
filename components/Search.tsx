'use client'
import { useState } from 'react'
import { MagnifyingGlassIcon,XMarkIcon } from '@heroicons/react/24/solid'
import React from 'react'
import { useRouter } from 'next/navigation'

const Search = () => {
   const [searchTerm,setSearchTerm]=useState<string>('')
   const router=useRouter()

   const handleClick=(): void=>{
    if(searchTerm.trim()=='') return
    router.push(`/?query=${encodeURIComponent(searchTerm)}`)
   }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value)
  } 

    
  return (
    <div className='flex items-center justify-center mt-6 sm:mt-10 relative px-4 w-full max-w-[600px]'>
        <input className='border-6 border-black h-16 sm:h-20 w-full p-4 rounded-full bg-pink-100 text-base sm:text-lg placeholder:font-bold focus:outline-none font-semibold'

        placeholder='Search'
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleClick();
          }
        }}
        />
<MagnifyingGlassIcon
  className="h-12 w-12 text-white bg-black p-3 rounded-full font-bold absolute right-6 top-1/2 transform -translate-y-1/2 cursor-pointer"
  onClick={handleClick}
/>
{searchTerm ? (
  <XMarkIcon
    className="h-12 w-12 text-white bg-black p-3 rounded-full font-bold absolute right-20 top-1/2 transform -translate-y-1/2 cursor-pointer"
    onClick={() => {router.push(`/`)
      setSearchTerm("");
    }
  }
  />
) : null}





    </div>
  )

}
export default Search

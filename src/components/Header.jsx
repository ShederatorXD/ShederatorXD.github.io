import React from 'react'

export default function Header({handleToggle}) {
  return (
    <header>
      <button className='open-nav-button' onClick={handleToggle} >
        <i className="fa-solid fa-bars"></i>
      </button>
      <h1 className='text-gradient'>Pokédex</h1>
    </header>
  )
}

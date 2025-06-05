import React, { useState } from 'react'
import { first151Pokemon, getFullPokedexNumber } from "../utils"

export default function SideNav({setSelect,handleToggle,showSideNav,setShowSideNav}) {
  const [search,setSearch] = useState('')

  const filtered = first151Pokemon.map((pokemon, index) => ({
    name: pokemon,
    index: index
  })).filter(({name, index}) => {
    if(toString(getFullPokedexNumber(index)).includes(search))
      return true
    if(name.toLowerCase().includes(search.toLowerCase()))
      return true
    return false
  })

  return (
    <nav className={''+(showSideNav? "open" : '')}>
      <div className={"header "+(showSideNav? "open" : '')}>
        <button onClick={handleToggle} className='open-nav-button'>
         <i className="fa-solid fa-left-long"></i>
        </button>
        <h1 className='text-gradient'>Pokémon</h1>
      </div>
      <input placeholder='Eg. 001 or Bulba...' value={search} onChange={(event)=>{setSearch(event.target.value)}}/>
      {filtered.map(({name, index}) => (
        <button key={index} className={'nav-card'} onClick={() => {
          setSelect(index)
          setShowSideNav(false)
        }}>
          <p>{getFullPokedexNumber(index)}</p>
          <p>{name}</p>
        </button>
      ))}
    </nav>
   )
}

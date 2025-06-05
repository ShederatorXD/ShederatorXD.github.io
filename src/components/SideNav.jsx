import React, { useState } from 'react'
import { first151Pokemon, getFullPokedexNumber } from "../utils"

export default function SideNav({setSelect,handleToggle,showSideNav,setShowSideNav}) {
  const [search,setSearch] = useState('')

  const filtered = first151Pokemon.filter((val,i) =>{
    if(toString(getFullPokedexNumber(i)).includes(search))
      return true
    if(val.toLowerCase().includes(search.toLowerCase()))
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
      {filtered.map((pokemon,index)=>{
        const truePokemonIndex = first151Pokemon.indexOf(pokemon)
        return(
          <button key={index} className={'nav-card'} onClick={() => {
            setSelect(truePokemonIndex+1)
            setShowSideNav(false)
            }}>
            <p>{getFullPokedexNumber(truePokemonIndex)}</p>
            <p>{pokemon}</p>
          </button>
        )
      })}
    </nav>
   )
}

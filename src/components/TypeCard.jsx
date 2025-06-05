import React from 'react'
import { pokemonTypeColors } from '../utils'

export default function TypeCard({type}) {
  return (
    <div className='type-tile' style={{backgroundColor: pokemonTypeColors[type.name].color, background: pokemonTypeColors[type.name].background}}>
        <p>{type.name}</p>
    </div>
  )
}


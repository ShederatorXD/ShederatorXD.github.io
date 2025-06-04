import React from 'react'
import '../index.css'
import '../fanta.css'


export default function Header({todos}) {
  const isPlural = todos.length !== 1
  return (
    <header>
        <h1 className='text-gradient'>You have {todos.length} total {isPlural ? 'tasks' : 'task'}.</h1>
    </header>
  )
}

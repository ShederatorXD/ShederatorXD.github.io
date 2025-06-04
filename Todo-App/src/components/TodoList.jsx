import React from 'react'
import TodoCard from './TodoCard'
import { useState } from 'react'

export default function TodoList({todos,tab,setTodos,SaveToStorage}) {

  
  const filter = tab === 'All'? 

  todos : 
  tab === 'Completed'?
  todos.filter((val)=>{return val.completed}) :
  todos.filter((val)=>{return !val.completed})
  return (
    <>
    {filter.map((todo,i)=>{
      return(
        <TodoCard todo={todo} key={i} i={i} filter={filter} setTodos={setTodos} SaveToStorage={SaveToStorage}/>
      )
    })}
    </>
  )
}

import React from 'react'

export default function TodoCard({todo, i, filter, setTodos,SaveToStorage}) {

  const toggleTodo = () => {
    const newTodos = [...filter]
    newTodos[i] = {...newTodos[i], completed: true}
    SaveToStorage(newTodos)
    setTodos(newTodos)
  }
  const Delete = () => {
    const Og = [...filter]
    const Deleted = Og.filter((val,index)=>{return index!==i})
    SaveToStorage(Deleted)
    setTodos(Deleted)
  }

  return (
    <div className='card todo-item'>
      <p>{todo.name}</p>
      <div className='todo-buttons'>
        <button disabled={todo.completed} onClick={toggleTodo}>
           Done
        </button>
        <button onClick={Delete}>Delete</button>
      </div>
    </div>
  )
}

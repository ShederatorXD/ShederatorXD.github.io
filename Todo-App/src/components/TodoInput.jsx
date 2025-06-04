import React from 'react'

export default function TodoInput({todos, setTodos,SaveToStorage}) {
  
  const AddToList = (event) => {
    event.preventDefault()
    let val = {name: event.target[0].value, completed: false}
    let list = [...todos, val]
    if(event.target[0].value === '')
      alert('Name cant be empty')
    else if (search(event.target[0].value))
      {
        alert('Task already present')
        event.target[0].value = ''
      }
    else
      setTodos(list)
      SaveToStorage(list)
      event.target[0].value = ''
  }

  const search = (name) => {
    let matching = -1
    todos.map((val,i)=>{
      if (val.name === name)
        matching = i
      return val
    })
    if(matching===-1)
      return false
    return true
  }

  return (
    <div>
      <form onSubmit={(e) => AddToList(e)} className='input-container'>
        <input placeholder='Add Task'/>
        <button>
          <i className="fa-solid fa-plus"></i>
        </button>
      </form>
    </div>
  )
}

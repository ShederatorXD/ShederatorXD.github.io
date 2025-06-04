import { useState, useEffect } from 'react'
import './App.css'
import Tabs from './components/Tabs'
import TodoList from './components/TodoList'
import TodoInput from './components/TodoInput'
import Header from './components/Header'

function App() {
  const [tab, setTab] = useState('All')
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos')
    return savedTodos ? JSON.parse(savedTodos) : [
      {name: 'Share and follow Aryan', completed: false}
    ]
  })

  const SaveToStorage = (items) => {
    localStorage.setItem('todos', JSON.stringify(items))
  }

  

  return (
    <>
      <Header todos={todos}/>
      <Tabs todos={todos} tab={tab} setTab={setTab}/>
      <TodoList 
      todos={todos} 
      tab={tab} setTodos={setTodos} SaveToStorage={SaveToStorage}/>
      <TodoInput todos={todos} setTodos={setTodos} SaveToStorage={SaveToStorage}/>
    </>
  )
}

export default App

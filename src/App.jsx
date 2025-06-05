import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/Header'
import SideNav from './components/SideNav'
import PokeCard from './components/PokeCard'

function App() {
  const [select, setSelect] = useState(1)
  const [showSideNav, setShowSideNav] = useState(false)

function handleToggle() {
  setShowSideNav(!showSideNav)
}

  return (
    <>
      <Header handleToggle={handleToggle}/>
      <SideNav select={select} setSelect={setSelect} handleToggle={handleToggle} showSideNav={showSideNav} setShowSideNav={setShowSideNav}/>
      <PokeCard select={select}/>
    </>
  )
}

export default App

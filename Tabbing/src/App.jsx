import { useState } from 'react'
import Tab from './tab.jsx'
import data from './data.jsx'
import './tabbing.css'
import TabContent from './tab-content.jsx'

function App() {
  const [description, setDescription] = useState(data[0].description)
  const [activeTab, setActiveTab] = useState(data[0].id)
  const buttons = data.map((item) => {
    return (
      <div key={item.id} >
        <Tab item={item} activeTab={activeTab} setActiveTab={setActiveTab} setDescription={setDescription}/>
      </div>
    )
  })

  return (
    <>
      <div className='tab-buttons'>
        {buttons}
      </div>
      <div className='tab-content'>
        <TabContent description={description}/>
      </div>
    </>
  )
}

export default App

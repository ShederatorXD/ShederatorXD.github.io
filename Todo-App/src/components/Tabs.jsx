import React from 'react'

export default function Tabs({todos,tab,setTab}) {
  const tabs = ['All','Open','Completed']

  const number = todos.filter((val)=>{
    return val.completed
  }).length

  return (
    <div className='tab-container'>
      {
        tabs.map((tab,index)=>{
          return(
            <button key={index} className='tab-button' onClick={()=>{setTab(tab)}}>
              <h4>
                {tab} 
                <span>({tab === 'All' ? todos.length : tab === 'Open' ? todos.length - number : number})</span>
              </h4>
            </button>
          )
        })
      }
    </div>
  )
}

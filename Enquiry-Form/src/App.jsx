import { useState } from 'react'
import List from './List'
import './App.css'

export default function App() {
  const [FormData, setFormData] = useState({
    uname: '',
    uemail: '',
    uphone: '',
    umessage: '',
    index: ''
  })
  const [UserData, setUserData] = useState([])

  let getValue = (event) => {
    let oldData = { ...FormData }
    let inputName = event.target.name;
    let inputValue = event.target.value;
    oldData[inputName] = inputValue;
    setFormData(oldData);
  }

  let addToList = (event) => {
    event.preventDefault();
    if(FormData.index===''){
      let matching = -1;
      UserData.map((v, i) => {
        if (v.uname === FormData.uname || v.uemail === FormData.uemail)
          matching = i;
      })
      if (matching === -1) {
        let list = [...UserData, FormData];
        setUserData(list);
        setFormData({
          uname: '',
          uemail: '',
          uphone: '',
          umessage: '',
          index: ''
        })
      } else {
        alert("User with this username or email already exists");
        matching = -1;
      }
    }
    else{
      let matching = -1;
      UserData.map((v, i) => {
        if ((v.uname === FormData.uname || v.uemail === FormData.uemail) && i !== parseInt(FormData.index))
          matching = i;
      })
      if (matching === -1) {
        let list = [...UserData];
        list[FormData.index] = FormData;
        setUserData(list);
        setFormData({
          uname: '',
          uemail: '',
          uphone: '',
          umessage: '',
          index: ''
        })
      } else {
        alert("User with this username or email already exists");
        matching = -1;
      }
    }
  }

  let onEdit = (index) => {
    setFormData({
      ...UserData[index],
      index: index.toString()
    });
  }

  return (
    <div className="container">
      <div className="App">
        <h1>Enquiry Form</h1>
        <form onSubmit={addToList}>
          <div>
            <p>Username</p>
            <input 
              onChange={getValue} 
              type="text" 
              name="uname" 
              value={FormData.uname}
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <p>Email</p>
            <input 
              onChange={getValue} 
              type="email" 
              name="uemail" 
              value={FormData.uemail}
              placeholder="Enter email"
              required
            />
          </div>
          <div>
            <p>Phone</p>
            <input 
              onChange={getValue} 
              type="tel" 
              name="uphone" 
              value={FormData.uphone}
              placeholder="Enter phone number"
              required
            />
          </div>
          <div>
            <p>Message</p>
            <input 
              onChange={getValue} 
              type="text" 
              name="umessage" 
              value={FormData.umessage}
              placeholder="Enter your message"
              required
            />
          </div>
          <div className="form-buttons">
            <button type="submit" onClick={addToList}>
              {FormData.index === '' ? "Add User" : "Update User"}
            </button>
            {FormData.index !== '' && (
              <button 
                type="button" 
                onClick={() => setFormData({
                  uname: '',
                  uemail: '',
                  uphone: '',
                  umessage: '',
                  index: ''
                })}
                className="cancel-btn"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      <List 
        UserData={UserData} 
        setUserData={setUserData} 
        onEdit={onEdit} 
      />
    </div>
  )
}
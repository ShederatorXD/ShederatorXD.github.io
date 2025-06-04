import React from 'react'

function List({ UserData, setUserData, onEdit }) {

  const Delete = (indexToDelete) => {
    const Updated = UserData.filter((v, index) => index !== indexToDelete);
    setUserData(Updated);
  }

  return (
    <div className="list-container">
      {UserData.map((v, i) => (
        <div key={i} className="user-item">
          <div className="user-info">
            <p>{v.uname}</p>
            <p>{v.uemail}</p>
            <p>{v.uphone}</p>
            <p>{v.umessage}</p>
          </div>
          <div className="action-buttons">
            <button onClick={() => onEdit(i)} className="edit-btn">
              Edit
            </button>
            <button onClick={() => Delete(i)} className="delete-btn">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default List

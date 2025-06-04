export default function Tab({item, activeTab, setActiveTab, setDescription}) {
    return (
        <div>
            <button 
                className={activeTab === item.id ? 'active' : ''}
                onClick={() => {
                    setActiveTab(item.id);
                    setDescription(item.description);
                }}
            >
                {item.title}
            </button>
        </div>
    )
}

import {useEffect, useState} from "react";
import styles from "@/app/page.module.css";
import {useCreateGroup} from "@/common/services/insideFunctions/useSendMessage";

export function SettingsModal({ isOpen, onClose, findUser, suggestions, findUsers, selectedUsers, setSelectedUsers, currentContact, createNewSession, currentUsername}) {

    const [innerInput, setInnerInput] = useState('');
    const [groupName, setGroupName] = useState('');
    const isCreateDisabled =
        selectedUsers.length > 1 && !groupName;

    useEffect(() => {
        if(currentContact && isOpen && selectedUsers.length === 0){
            setSelectedUsers([]);
        }
        if(!isOpen){
            setInnerInput('');
            setSelectedUsers([]);
        }
    }, [currentContact, isOpen]);

    const handleAddUser = (user) => {
        if (selectedUsers.find(selectedUser => selectedUser.id === user.id) === undefined) {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    useEffect(() => {
        if(innerInput !== ''){
            findUser(innerInput);
        }
    }, [innerInput]);

    const handleCreate = () => {
        if(selectedUsers.length > 1) {
            createNewSession(selectedUsers.map(user => user.id), groupName);
        } else {
            createNewSession(selectedUsers.map(user => user.id));
        }
        onClose();
    };

    if (!isOpen) return null;

    const handleDeleteUser = (userToDelete) => {
        setSelectedUsers(selectedUsers.filter(user => user.id !== userToDelete.id));
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '30px' }}>Create {selectedUsers.length > 2 ? 'Group' : 'Chat'}</span>
                <input
                    type="text"
                    value={innerInput}
                    onChange={e => setInnerInput(e.target.value)}
                    placeholder="Search users"
                    style={{ width: '100%', height: '50px', fontSize: '20px' }}
                />
                <ul style={{ fontSize: '20px', flex: '1', overflow: 'auto' }}>
                    {findUsers.map(user => (
                        <li style={{ margin: '5px', cursor: 'pointer' }} key={user.id} onClick={() => handleAddUser(user)}>
                            {user.username}
                        </li>
                    ))}
                </ul>
                {/*<div style={{ maxWidth: 400, fontSize: '20px', color: "green" }}>Selected Users: {selectedUsers.map(user => user.username).join(', ')}</div>*/}
                <div style={{ maxWidth: 400, fontSize: '20px', color: "green" }}>
                    Selected Users: {selectedUsers.map(user => (
                    <span style={{marginLeft: '10px'}} key={user.id}>
                        {user.username}
                        <button style={{outline:"none", cursor:"pointer"}} onClick={() => handleDeleteUser(user)}>❌</button>
                    </span>
                ))}
                </div>
                {selectedUsers.length > 1 &&
                    <input
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        placeholder="Enter group namee"
                        style={{ width: '100%', height: '50px', fontSize: '20px' }}
                    />
                }
                <div style={{ display:'flex', flexDirection: 'column' }}>
                    <button disabled={isCreateDisabled} style={{ height: '100px', fontSize: '25px', cursor: 'pointer' }} onClick={handleCreate}>Create {selectedUsers.length > 2 ? 'Group' : 'Chat'}</button>
                    <button style={{ height: '40px', fontSize: '25px', cursor: 'pointer' }} onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
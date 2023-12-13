// useSendMessage.js
import {useCallback, useEffect, useRef} from 'react';

export function useSendMessage(myInfo, message, webSocket, currentContact, setMessage, setMessagesHook, lastAutomatedMessage, type, bottomSimpleExport) {
    return useCallback(() => {
        // console.log('useSendMessage', scrollToBottom);
        if (message && currentContact && webSocket) {
            let newMessage;
            if(currentContact?.tableType === 'GroupTable') {
                newMessage = {
                    from: myInfo?.name, recipientUserId: currentContact.id, text: message, tableType: 'GroupTable',
                    createdAt: new Date(), messageType: 'inputTextMessage',
                    id: generateMessageId(localStorage.getItem("userId"), currentContact.id)
                }
            } else {
                newMessage = {
                    from: myInfo?.name, text: message, recipientUserId: currentContact.id, recipientUserName: currentContact.username,
                    messageType: 'inputTextMessage', sessionId: currentContact.sessionId, createdAt: new Date(), type: type || 'inputTextMessage',
                    isAutomated: lastAutomatedMessage != null, automatedDestination: lastAutomatedMessage?.actionId,
                    automatedMessageType: lastAutomatedMessage?.automatedMessageType, id: generateMessageId(localStorage.getItem("userId"), currentContact.id)
                };
            }
            webSocket.send(JSON.stringify(newMessage));
            setMessagesHook(prevMessages => ({
                ...prevMessages,
                [currentContact.id]: [...(prevMessages[currentContact.id] || []), newMessage]
            }), currentContact.id);
            setMessage(''); 
        }
    }, [message, currentContact, webSocket]);
}

function generateMessageId(fromUser, toUser) {
    const now = new Date();
    const formattedDate = now.toISOString()
        .replace(/-/g, '')   // Remove dashes
        .replace(/:/g, '')   // Remove colons
    return `${formattedDate}_${fromUser}_${toUser}`;
}


export function useMessageAcknowledged(webSocket) {
    return useCallback((messageId, contacts, username, stateType, from) => {
        if (webSocket && messageId) {
            let acknowledgment;
            if (typeof messageId === 'object') {
                acknowledgment = { input:{groupMessageIds: messageId.groupMessageIds, singleMessageIds: messageId.singleMessageIds}, isAutomated: true, automatedMessageType: 'MESSAGES_RECEIVED', stateType: stateType};
            } else{
                 acknowledgment = { id: messageId, isAutomated: true, automatedMessageType: 'messageReceived', stateType: stateType};
            }
            webSocket.send(JSON.stringify(acknowledgment));
        }
    }, [webSocket]);
}

export function useFaceToFace(webSocket) {
    return (previousSession, currentContact) => {
        if (webSocket && currentContact && currentContact?.username !== previousSession?.username) {
            let object = { id: generateMessageId(localStorage.getItem("userId"), currentContact.id), recipientUserId: currentContact.id, from: localStorage.getItem('username'), input:{sessionId: currentContact?.sessionId, previousSessionId: previousSession?.sessionId, activityStatus: previousSession?.activityStatus}, automatedMessageType: 'FACE_TO_FACE', isAutomated: true};
            webSocket.send(JSON.stringify(object));
        }
    }
}

export function useCreateNewSession(webSocket) {
    return (listOfUsers, groupName) => {
        if (webSocket && listOfUsers) {
            let object = {from: localStorage.getItem('username'), input:{listOfUsers: listOfUsers, groupName: groupName}, automatedMessageType: 'CREATE_NEW_SESSION', isAutomated: true};
            webSocket.send(JSON.stringify(object));
        }
    }
}

// export function useInWindow(webSocket) {
//     return (currentContact, inWindow) => {
//         if (webSocket && currentContact) {
//             let object = { recipientUserId: currentContact.id, from: localStorage.getItem('username'), input:{sessionId: currentContact?.sessionId, inWindow: inWindow}, automatedMessageType: 'In_Window', isAutomated: true};
//             webSocket.send(JSON.stringify(object));
//         }
//     }
// }

export function useLogin(webSocket) {
    return useCallback(() => {
        if (webSocket) {
            let username = localStorage.getItem('username');
            let token = localStorage.getItem('token');
            let userId = localStorage.getItem('userId');
            let object = { input: {username: username, token: token}, automatedMessageType: 'login', isAutomated: true };
            webSocket.send(JSON.stringify(object));
        }
    }, [webSocket]);
}

export function useGetContacts(webSocket) {
    return useCallback(() => {
        if (webSocket) {
            let username = localStorage.getItem('username');
            let token = localStorage.getItem('token');
            let object = { input: {username: username, token: token}, id: generateMessageId(localStorage.getItem("userId"), null), automatedMessageType: 'getContacts', isAutomated: true };
            webSocket.send(JSON.stringify(object));
        }
    }, [webSocket]);
}

export function useSelectContact(setCurrentContact, faceToFace, currentContact, activeContacts){
    return useCallback((newContact) => {
        // if(activeContacts[newContact?.username]){
        faceToFace(currentContact, newContact);
        // }
        setCurrentContact(newContact);
    }, [setCurrentContact, faceToFace, currentContact]);
}

export function useInWindow(faceToFace){
    return useCallback(() => {
        faceToFace(currentContact, null);
    }, [faceToFace]);
}

export function bottomSimpleExport(dummyDiv){
    dummyDiv.current?.scrollIntoView({ behavior: 'smooth' });
}

export function typing(webSocket, currentUsername, currentContact, isTyping, setWriting, isThinking) {
    if (webSocket && currentContact && currentUsername && isTyping != null) {
        setWriting(isTyping);
        let object = { id: generateMessageId(localStorage.getItem("userId"), currentContact.id), input: {isTyping: isTyping, isThinking: isThinking}, sessionId: currentContact.sessionId, automatedMessageType: 'TYPING', isAutomated: true, recipientUserId: currentContact.id, from: currentUsername, recipientUserName: currentContact.username};
        webSocket.send(JSON.stringify(object));
    }
}

export function sendInputFocused(webSocket, currentUsername, currentContact, isThinking) {
    if (webSocket && currentContact && currentUsername && isThinking != null) {
        let object = { id: generateMessageId(localStorage.getItem("userId"), currentContact.id), input: {inputFocused: isThinking}, sessionId: currentContact.sessionId, automatedMessageType: 'TYPING', isAutomated: true, recipientUserId: currentContact.id, from: currentUsername, recipientUserName: currentContact.username};
        webSocket.send(JSON.stringify(object));
    }
}

export function useFindUser(webSocket){
    return useCallback((username) => {
        if (webSocket && webSocket.readyState === 1) {
            let object = {from: localStorage.getItem('username'), input:{username: username}, automatedMessageType: 'FIND_USERS', isAutomated: true };
            webSocket.send(JSON.stringify(object));
        }
    }, [webSocket]);
}
// useSendMessage.js
import {useCallback, useEffect, useRef} from 'react';

export function useSendMessage(myInfo, message, webSocket, currentContact, setMessage, setMessagesHook, lastAutomatedMessage, type, bottomSimpleExport) {
    return useCallback(() => {
        // console.log('useSendMessage', scrollToBottom);
        if (message && currentContact && webSocket) {
            const newMessage = {
                from: myInfo?.name, text: message, recipientUserId: currentContact.id, recipientUserName: currentContact.username,
                messageType: 'inputTextMessage', sessionId: currentContact.sessionId, createdAt: new Date(), type: type || 'inputTextMessage',
                isAutomated: lastAutomatedMessage != null, automatedDestination: lastAutomatedMessage?.actionId,
                automatedMessageType: lastAutomatedMessage?.automatedMessageType, id: generateMessageId(myInfo?.name, currentContact.username)
            };
            webSocket.send(JSON.stringify(newMessage));
            setMessagesHook(prevMessages => ({
                ...prevMessages,
                [currentContact.username]: [...(prevMessages[currentContact.username] || []), newMessage]
            }), currentContact.username);
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
    return useCallback((messageId) => {
        if (webSocket && messageId) {
            let acknowledgment = { id: messageId, isAutomated: true, automatedMessageType: 'messageReceived' };
            webSocket.send(JSON.stringify(acknowledgment));
        }
    }, [webSocket]);
}

export function useLogin(webSocket) {
    return useCallback(() => {
        if (webSocket) {
            let username = localStorage.getItem('username');
            let token = localStorage.getItem('token');
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
            let object = { input: {username: username, token: token}, automatedMessageType: 'getContacts', isAutomated: true };
            webSocket.send(JSON.stringify(object));
        }
    }, [webSocket]);
}

export function bottomSimpleExport(dummyDiv){
    dummyDiv.current?.scrollIntoView({ behavior: 'smooth' });
}

export function typing(webSocket, currentUsername, currentContact, isTyping, setWriting, isThinking) {
    if (webSocket && currentContact && currentUsername && isTyping != null) {
        setWriting(isTyping);
        let object = { input: {isTyping: isTyping, isThinking: isThinking}, sessionId: currentContact.sessionId, automatedMessageType: 'TYPING', isAutomated: true, from: currentUsername};
        webSocket.send(JSON.stringify(object));
    }
}

export function sendInputFocused(webSocket, currentUsername, currentContact, isThinking) {
    if (webSocket && currentContact && currentUsername && isThinking != null) {
        let object = { input: {inputFocused: isThinking}, sessionId: currentContact.sessionId, automatedMessageType: 'TYPING', isAutomated: true, from: currentUsername};
        webSocket.send(JSON.stringify(object));
    }
}
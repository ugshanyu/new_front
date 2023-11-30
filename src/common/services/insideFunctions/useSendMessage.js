// useSendMessage.js
import {useCallback} from 'react';

export function useSendMessage(myInfo, message, webSocket, currentContact, setMessage, setMessages, lastAutomatedMessage, type) {
    return useCallback(() => {
        if (message && currentContact && webSocket) {
            const newMessage = {
                from: myInfo?.name, text: message, recipientUserId: currentContact.id, recipientUserName: currentContact.username,
                messageType: 'inputTextMessage', sessionId: currentContact.sessionId, createdAt: new Date(), type: type || 'inputTextMessage',
                isAutomated: lastAutomatedMessage != null, automatedDestination: lastAutomatedMessage?.actionId,
                automatedMessageType: lastAutomatedMessage?.automatedMessageType
            };
            webSocket.send(JSON.stringify(newMessage));
            setMessages(prevMessages => ({
                ...prevMessages,
                [currentContact.username]: [...(prevMessages[currentContact.username] || []), newMessage]
            }));
            setMessage('');
        }
    }, [message, currentContact, webSocket]);
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
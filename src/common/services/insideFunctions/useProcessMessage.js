import {useCallback, useEffect} from "react";
import {bottomSimpleExport, inputFocused, useGetContacts} from "@/common/services/insideFunctions/useSendMessage";

export function useProcessMessage(setMessages, setCurrentContact, setContacts, setLastAutomatedMessage, webSocket, goLogin, getContacts, messageAcknowledged, currentContact, contacts) {
    const processMessage = useCallback((event) => {
        const incomingMessage = JSON.parse(event.data);
        switch (incomingMessage.messageType) {
            case 'loginContact':
                if (incomingMessage.contacts && incomingMessage.contacts.length > 0){
                    let loginContact = incomingMessage.contacts[0]
                    setCurrentContact(loginContact);
                    setContacts(incomingMessage.contacts);
                    setLastAutomatedMessage(loginContact?.greetingMessage);
                    console.log('loginContact?.greetingMessage', loginContact?.greetingMessage)
                    setMessages(prevMessages => ({
                        ...prevMessages,
                        [loginContact.username]: [...(prevMessages[loginContact.username] || []), loginContact?.greetingMessage ? loginContact?.greetingMessage : '']
                    }));
                }
                break;
            case 'UPDATE_ONLINE_USERS':
                getContacts();
                break;
            case 'updateContacts':
                if (incomingMessage.contacts && incomingMessage.contacts.length > 0){
                    let lastContacted = incomingMessage.contacts[0]
                    setCurrentContact(lastContacted);
                    setContacts(incomingMessage.contacts);
                    setLastAutomatedMessage(lastContacted?.greetingMessage);
                    setMessages(prevMessages => ({
                        ...prevMessages,
                        [lastContacted.id]: [...(prevMessages[lastContacted.id] || []), lastContacted?.greetingMessage ? lastContacted?.greetingMessage : {text:null}]
                    }));
                }
                break;
            case 'inputTextMessage':
                messageAcknowledged(incomingMessage.id);
                setMessages(prevMessages => ({
                    ...prevMessages,
                    [incomingMessage.from]: [...(prevMessages[incomingMessage.from] || []), incomingMessage]
                }));
                break;
            case 'contactUpdate':
                // Process contact update
                // This is an example, you'll need to adjust based on your application's needs
                setCurrentContact(incomingMessage.updatedContact);
                break;
            // Add more cases as needed for different message types
            case 'setLogin':
                if(incomingMessage.successfull) {
                    var userName = incomingMessage.input?.userName;
                    var temporaryToken = incomingMessage.input?.temporaryToken;
                    localStorage.setItem('username', userName);
                    localStorage.setItem('token', temporaryToken);
                    //reload page
                    window.location.reload();
                }
                    setMessages(prevMessages => ({
                        ...prevMessages,
                        [incomingMessage.roomID]: [...(prevMessages[incomingMessage.roomID] || []), incomingMessage]
                    }));

                break;
            case 'TYPING':
                let typing = incomingMessage?.input?.isTyping;
                let inputFocused = incomingMessage?.input?.inputFocused;
                // console.log('typing', typing)
                if(typing !== undefined) {
                    contacts.forEach((contact) => {
                        if (contact.username === incomingMessage?.from) {
                            contact.typing = typing;
                        }
                    })
                    if (currentContact?.username === incomingMessage?.from) {
                        setCurrentContact({...currentContact, typing: typing});
                    }
                }
                if(inputFocused !== undefined) {
                    // console.log('inputFocused', inputFocused)
                    contacts.forEach((contact) => {
                        if (contact.username === incomingMessage?.from) {
                            contact.inputFocused = inputFocused;
                        }
                    })
                    if (currentContact?.username === incomingMessage?.from) {
                        setCurrentContact({...currentContact, inputFocused: inputFocused});
                    }
                }

                break;
            default:
                // Handle unknown message type
                console.warn('Received unknown message type:', incomingMessage.type);
        }
    }, [setMessages, setCurrentContact, goLogin, getContacts, messageAcknowledged, currentContact, contacts]);

    useEffect(() => {
        if (webSocket) {
            webSocket.addEventListener('message', processMessage);
        }
        return () => {
            webSocket?.removeEventListener('message', processMessage);
        }
    }, [webSocket, processMessage]);

}
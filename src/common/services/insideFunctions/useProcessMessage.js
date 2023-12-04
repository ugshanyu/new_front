import {useCallback, useEffect} from "react";
import {bottomSimpleExport, inputFocused, useGetContacts} from "@/common/services/insideFunctions/useSendMessage";

export function useProcessMessage(setMessages, setCurrentContact, setContacts, setLastAutomatedMessage, webSocket, goLogin, getContacts, messageAcknowledged, currentContact, contacts, currentContactMessages, setCurrentContactMessages, activeContacts, setActiveContacts){
    const processMessage = useCallback((event) => {
        const incomingMessage = JSON.parse(event.data);
        switch (incomingMessage.messageType) {
            case 'loginContact':
                if (incomingMessage.contacts && incomingMessage.contacts.length > 0){
                    let loginContact = incomingMessage.contacts[0]
                    setCurrentContact(loginContact);
                    setContacts(incomingMessage.contacts);
                    setLastAutomatedMessage(loginContact?.greetingMessage);
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
                if(currentContact && currentContact.username === incomingMessage.from) {
                    messageAcknowledged(incomingMessage.id, contacts, localStorage.getItem('username'), "RECIPIENT_SEEN", incomingMessage.from);
                } else {
                    messageAcknowledged(incomingMessage.id, contacts, localStorage.getItem('username'), "RECIPIENT_RECEIVED", incomingMessage.from);
                }
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
                    // contacts.forEach((contact) => {
                    //     if (contact.username === incomingMessage?.from) {
                    //         contact.inputFocused = inputFocused;
                    //     }
                    // })
                    if (currentContact?.username === incomingMessage?.from) {
                        setCurrentContact({...currentContact, inputFocused: inputFocused});
                    }
                }

                break;
            case "STATE_CHANGED":
                if (incomingMessage.id && incomingMessage.stateType) {
                    setMessages(prevMessages => {
                        let updatedMessages = { ...prevMessages };
                        let fromUserMessages = updatedMessages[incomingMessage.from];
                        if (fromUserMessages) {
                            updatedMessages[incomingMessage.from] = fromUserMessages.map(msg =>
                                msg.id === incomingMessage.id ? { ...msg, stateType: incomingMessage.stateType } : msg
                            );
                        }
                        return updatedMessages;
                    });
                }
                break;
            case "FACE_TO_FACE":
                // Assuming incomingMessage and incomingMessage.from are defined
                if(incomingMessage?.input?.faceToFace !== undefined) {
                    const username = incomingMessage.from;
                    let copyActiveContacts = {...activeContacts};
                    copyActiveContacts[username] = incomingMessage?.input?.faceToFace
                    setActiveContacts(copyActiveContacts);

                    setMessages(prevMessages => {
                        let updatedMessages = { ...prevMessages };
                        let fromUserMessages = updatedMessages[incomingMessage.from];
                        if (fromUserMessages) {
                            updatedMessages[incomingMessage.from] = fromUserMessages.map(msg =>
                                msg.id === incomingMessage.id ? { ...msg, faceToFace: incomingMessage?.input?.faceToFace } : msg
                            );
                        }
                        return updatedMessages;
                    });
                }
                break;


                // console.log('FACE_TO_FACE', incomingMessage)
                // if it is comming from the current contact then we need to update the current contact
                // if(contacts && contacts.length > 0) {
                //     contacts.forEach((contact) => {
                //         if (contact.username === incomingMessage?.from) {
                //             contact.faceToFace = incomingMessage?.input?.faceToFace;
                //         }
                //     })
                //     setContacts(contacts);
                // }
                // if (currentContact?.username === incomingMessage?.from) {
                //     setCurrentContact({...currentContact, faceToFace: incomingMessage?.input?.faceToFace});
                // }

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
"use client";

import {useCallback, useEffect, useRef, useState} from 'react';
import styles from './page.module.css';
import {getLogin, login} from "@/common/services/apiCalls/login"
import {getLogoUrl} from "@/common/utils/base";
import {useLogin, useSendMessage, useGetContacts, useMessageAcknowledged, useScrollToBottom, ScrollToBottom, bottomSimpleExport, typing, thinkingStatus, sendInputFocused, faceToFace, useFaceToFace, useSelectContact, useInWindow, useFindUser, useCreateGroup, useCreateNewSession} from "@/common/services/insideFunctions/useSendMessage";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import {useProcessMessage} from "@/common/services/insideFunctions/useProcessMessage";
import {SettingsModal} from "@/component/SettingsModal";
import { useReactMediaRecorder } from "react-media-recorder";
import io from 'socket.io-client';


export default function Home() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [contacts, setContacts] = useState([{id:"Usion", username:"Usion", avatarUrl:"https://i.ibb.co/fnfKddK/DALL-E-2023-11-20-11-35-35-A-modern-and-vibrant-logo-for-a-super-chat-application-called-Super-Conne.png"}, {id:"transparent", username:"Шилэн", avatarUrl:"https://i.ibb.co/x3PNBTt/big.png"}]);
    const [activeContacts, setActiveContacts] = useState(null);
    const [currentContact, setCurrentContact] = useState();
    const [messages, setMessages] = useState({});
    const [message, setMessage] = useState('');
    const [webSocket, setWebSocket] = useState(null);
    const [lastAutomatedMessage, setLastAutomatedMessage] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [writing, setWriting] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
    const [inWindow, setInWindow] = useState(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [currentContactMessages, setCurrentContactMessages] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const findUser = useFindUser(webSocket);
    const [findUsers, setFindUsers] = useState([]);
    const currentUsername = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    const myInfo = { id: 0, name: currentUsername, avatar: getLogoUrl() };
    const goLogin = useLogin(webSocket);
    const faceToFace = useFaceToFace(webSocket);
    const createNewSession = useCreateNewSession(webSocket);
    // const inWindow = useInWindow(webSocket);
    const dummyDiv = useRef(null);
    const messageAcknowledged = useMessageAcknowledged(webSocket);
    const getContacts = useGetContacts(webSocket);
    const selectContact = useSelectContact(setCurrentContact, faceToFace, currentContact, activeContacts)
    //setUsersInfos
    const [usersInfos, setUsersInfos] = useState([]);
    // const [isRecording, setIsRecording] = useState(false);
    const [showInputField, setShowInputField] = useState(true);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [socket, setSocket] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [partialMessage, setPartialMessage] = useState('');
    const [previosMessage, setPreviosMessage] = useState('');
    const [messageEnd, setMessageEnd] = useState(true);

    const {
        status,
        startRecording,
        stopRecording,
        pauseRecording,
        mediaBlobUrl
      } = useReactMediaRecorder({
        video: false,
        audio: true,
        echoCancellation: true
      });

    //set the current contact to the first contact in the list
    useEffect(() => {
        if (contacts.length > 0 && !currentContact) {
            console.log("we are the champions", contacts[0])
            setCurrentContact(contacts[0]);
        }
    }, [contacts]);

    useEffect(() => {
        if(partialMessage && messageEnd){
            setPartialMessage('')
            setMessageEnd(true)
            //if partial message is only one word and its length is more that 30 then skip the message
            if(partialMessage.split(' ').length === 1 && partialMessage.length > 30){
                return
            }
            setMessages(prevMessages => ({...prevMessages, [currentContact.id]: [...prevMessages[currentContact.id], {from: currentContact.id, text: partialMessage}]}));
        }
    }, [messageEnd]);


    useEffect(() => {
        if(currentContact != null && currentContact.id == "transparent" && messages[currentContact.id] == null){
            console.log('currentContactMessages', currentContactMessages)
            setMessages(prevMessages => ({...prevMessages, [currentContact.id]: [{from: currentContact.id, text: "Сайн байна уу? Хотын газар олголттой холбоотой нээлттэй мэдээллээс та асуулт асууна уу?"}]}));
        }
    }, [currentContact]);


    const processMessage = useProcessMessage(setMessages, null, setContacts, setLastAutomatedMessage, webSocket, goLogin, getContacts, messageAcknowledged, currentContact, contacts, currentContactMessages, setCurrentContactMessages, activeContacts, setActiveContacts, setFindUsers, messages, setUsersInfos)
    const sendMessage = useSendMessage(myInfo, message, socket, currentContact, setMessage, setMessages, lastAutomatedMessage, processMessage);
    const typingTimer = useRef(null);

    useEffect(() => {
        if (currentContact && messages[currentContact.id]) {
            setCurrentContactMessages(messages[currentContact.id]);
        } else {
            setCurrentContactMessages([]);
        }
    }, [messages, currentContact]);

    useEffect(() => {
        const newSocket = io('https://50mn4bkwpgwrwv-8080.proxy.runpod.net/');


        newSocket.on('connect', () => {
            console.log('Connected to server');
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        // Event handler for receiving a message
        newSocket.on('my_response', (data) => {
            setMessageEnd(false);
            if (data.data === '<end>') {
                setMessageEnd(true);
            } else {
                setPartialMessage((prevPartialMessage) => prevPartialMessage + data.data);
            }
            bottomSimpleExport(dummyDiv);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        const savedMessages = localStorage.getItem('messages');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        }
    }, []);

    useEffect(() => {
        console.log('messages', messages);
    } , [messages]);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('messages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        bottomSimpleExport(dummyDiv);
    }, [currentContactMessages, currentContact, messages]);


    const handleSendMessage = () => {
        
        if(currentContact.bot){
            console.log('sendMessage')
            // sendMessageToBot()
        } else{
            sendMessage()
        }
    }


    return (
        <div className={styles.container}>
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                findUser={findUser}
                suggestions={suggestions}
                findUsers={findUsers}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                currentContact={currentContact}
                createNewSession={createNewSession}
                currentUsername={currentUsername}
            />
            <aside className={styles.sidebar}>
                {contacts.map((contact, index) => (
                    <div
                        key={index}
                        className={`${styles.contact} ${currentContact?.username === contact.username ? styles.activeContact : ''}`}
                        onClick={() => selectContact(contact)}
                    >
                        {/* <img src='https://i.ibb.co/fnfKddK/DALL-E-2023-11-20-11-35-35-A-modern-and-vibrant-logo-for-a-super-chat-application-called-Super-Conne.png' alt={`${contact.firstName}'s avatar`} className={styles.avatar} /> */}
                        {contact.avatarUrl ? <img src={contact.avatarUrl} alt={`${contact.username}'s avatar`} className={styles.avatar} /> : null}
                        <div className={styles.contactDetails}>
                            <div className={styles.contactName}>{contact.username}</div>
                            {/* <div className={styles.activity}> {contact.activityStatus}</div> */}
                        </div>
                    </div>
                ))}
            </aside>
            <main className={styles.chat}>
                <header className={styles.chatHeader}>
                    {/* Active contact information */}
                    {currentContact && (
                        <div className={styles.activeContactHeader}>
                            <img src={currentContact?.avatarUrl ? currentContact.avatarUrl : 'https://i.ibb.co/fnfKddK/DALL-E-2023-11-20-11-35-35-A-modern-and-vibrant-logo-for-a-super-chat-application-called-Super-Conne.png'} alt={`${currentContact.firstName}'s avatar`} className={styles.avatar} />
                            <div className={styles.contactName}>{currentContact?.username}</div>
                            {/* <div className={styles.activity}> {currentContact?.activityStatus}</div> */}
                            {/* <div className={styles.activity}> {   activeContacts[currentContact.username] ? "Face2Face" : ""}</div> */}
                        </div>
                    )}
                    {/* {currentContact && (<div className={styles.settings} onClick={() => setIsSettingsModalOpen(true)}>⚙️</div>)} */}
                </header>
                <div className={styles.messages}>
                    {currentContactMessages.map((msg, index) => {
                        const isSentMessage = msg?.from === currentUsername;
                        return (
                            msg?.text && (
                                <div key={index} className={`${styles.message} ${isSentMessage ? styles.sentMessage : styles.receivedMessage}`}>
                                    <div className={styles.messageContent}>{msg.text}</div>
                                </div>
                            )
                        );
                    })}
                    {partialMessage && (
                        <div className={styles.message + ' ' + styles.receivedMessage}>
                            <div className={styles.messageContent}>{partialMessage}</div>
                        </div>
                    )}
                    <div ref={dummyDiv}></div>
                </div>
                <div>
            {currentContact && messageEnd == true && (
                <>
                    {showInputField && (
                        <div className={styles.messageInput}>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        sendMessage();
                                    }
                                }}
                                placeholder="Type a message..."
                            />
                            <button onClick={sendMessage}>Send</button>
                        </div>
                    )}
                </>
            )}
        </div>
            </main>
        </div>
    );
}

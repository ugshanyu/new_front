"use client";

import {useCallback, useEffect, useRef, useState} from 'react';
import styles from './page.module.css';
import {getLogin, login} from "@/common/services/apiCalls/login"
import {getLogoUrl} from "@/common/utils/base";
import {useLogin, useSendMessage, useGetContacts, useMessageAcknowledged, useScrollToBottom, ScrollToBottom, bottomSimpleExport, typing, thinkingStatus, sendInputFocused, faceToFace, useFaceToFace, useSelectContact, useInWindow, useFindUser, useCreateGroup, useCreateNewSession} from "@/common/services/insideFunctions/useSendMessage";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import {useProcessMessage} from "@/common/services/insideFunctions/useProcessMessage";
import {SettingsModal} from "@/component/SettingsModal";

export default function Home() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [activeContacts, setActiveContacts] = useState({});
    const [currentContact, setCurrentContact] = useState(null);
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
    const myInfo = { id: 0, name: currentUsername, avatar: getLogoUrl() };
    const goLogin = useLogin(webSocket);
    const faceToFace = useFaceToFace(webSocket);
    const createNewSession = useCreateNewSession(webSocket);
    // const inWindow = useInWindow(webSocket);
    const dummyDiv = useRef(null);
    const messageAcknowledged = useMessageAcknowledged(webSocket);
    const getContacts = useGetContacts(webSocket);
    const selectContact = useSelectContact(setCurrentContact, faceToFace, currentContact)


    window.addEventListener("blur", () => {
        if(inWindow){
            setInWindow(false)
        }
    });
    window.addEventListener("focus", () => {
        if(!inWindow){
            setInWindow(true)
        }
    });

    const processMessage = useProcessMessage(setMessages, selectContact, setContacts, setLastAutomatedMessage, webSocket, goLogin, getContacts, messageAcknowledged, currentContact, contacts, currentContactMessages, setCurrentContactMessages, activeContacts, setActiveContacts, setFindUsers)
    const sendMessage = useSendMessage(myInfo, message, webSocket, currentContact, setMessage, setMessages, lastAutomatedMessage);
    const typingTimer = useRef(null);

    useEffect(() => {
        if (currentContact && messages[currentContact.username]) {
            setCurrentContactMessages(messages[currentContact.username]);
        } else {
            setCurrentContactMessages([]);
        }
    }, [messages, currentContact]);

    useEffect(() => {
        if (webSocket) {
            return;
        } else {
            const ws = new WebSocket('ws://localhost:8080/chat');
            ws.onopen = () => {
                console.log('Connected to the chat server');
                setWsConnected(true);
            }
            ws.onmessage = processMessage;
            ws.onclose = () => {
                console.log('Disconnected from the chat server');
                setWsConnected(false);
            }
            setWebSocket(ws);
        }
        return () => {
            webSocket?.close();
        }
    }, [webSocket, processMessage, goLogin]);

    useEffect(() => {
        if (webSocket && wsConnected) {
            getContacts();
        }
    }, [webSocket, wsConnected, goLogin]);

    useEffect(() => {
        const savedMessages = localStorage.getItem('messages');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        }
    }, []);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('messages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        bottomSimpleExport(dummyDiv);
    }, [currentContactMessages, currentContact]);

    useEffect(() => {
        if (!writing && message !== '') {
            typing(webSocket, currentUsername, currentContact, true, setWriting);
        }
        if(message !== '') {
            typingTimer.current = setTimeout(() => {
                typing(webSocket, currentUsername, currentContact, false, setWriting);
            }, 1000);
            if(!thinking){
                setThinking(true)
            }
        } else {
            setThinking(false)
            typing(webSocket, currentUsername, currentContact, false, setWriting);
        }
        return () => clearTimeout(typingTimer.current);
    }, [message]);


    useEffect(() => {
        if(thinking){
            sendInputFocused(webSocket, currentUsername, currentContact, inputFocused);
        } else {
            sendInputFocused(webSocket, currentUsername, currentContact, false);
        }
    },[inputFocused, thinking]);

    //focused is false then thinking is false
    //if focused is true and writing is true then writing is true
    //if focused is true and writing is false then thinking is true
    const renderTypingStatus = () => {
        // console.log("currentContact?.inputFocused", currentContact?.inputFocused)
        // console.log("currentContact?.typing", currentContact?.typing)
        if(currentContact?.inputFocused) {
            if(currentContact?.typing) {
                return <div className={styles.typing}>Typing...</div>
            } else {
                return <div className={styles.typing}>Thinking...</div>
            }
        } else {
            return null;
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
                <div
                    className={`${styles.contact}`}
                    onClick={() => setIsSettingsModalOpen(true)}
                >
                    <img src='https://i.ibb.co/fnfKddK/DALL-E-2023-11-20-11-35-35-A-modern-and-vibrant-logo-for-a-super-chat-application-called-Super-Conne.png' className={styles.avatar} />
                    <div className={styles.contactDetails}>
                        <div className={styles.contactName}>
                            {currentUsername} ➕
                        </div>
                    </div>
                </div>
                {contacts.map((contact, index) => (
                    <div
                        key={index}
                        className={`${styles.contact} ${currentContact.username === contact.username ? styles.activeContact : ''}`}
                        onClick={() => selectContact(contact)}
                    >
                        <img src='https://i.ibb.co/fnfKddK/DALL-E-2023-11-20-11-35-35-A-modern-and-vibrant-logo-for-a-super-chat-application-called-Super-Conne.png' alt={`${contact.firstName}'s avatar`} className={styles.avatar} />
                        <div className={styles.contactDetails}>
                            <div className={styles.contactName}>{contact.username}</div>
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
                            <div className={styles.contactName}>{currentContact.username}</div>
                            <div className={styles.activity}> {   activeContacts[currentContact.username] ? "Face2Face" : "Online"}</div>

                        </div>
                    )}
                    {currentContact && (<div className={styles.settings} onClick={() => setIsSettingsModalOpen(true)}>⚙️</div>)}
                </header>
                <div className={styles.messages}>
                    {currentContactMessages.map((msg, index) => {
                        const isSentMessage = msg?.from === currentUsername;
                        return (
                            msg.text && (
                                <div key={index} className={`${styles.message} ${isSentMessage ? styles.sentMessage : styles.receivedMessage}`}>
                                    <div className={styles.messageContent}>{msg.text}</div>
                                    <div className={styles.messageStatus}>{msg?.stateType}</div>
                                </div>
                            )
                        );
                    })}
                    {renderTypingStatus()}
                    <div ref={dummyDiv}></div>
                </div>
                {currentContact && (
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
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            placeholder="Type a message..."
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                )}
            </main>
        </div>
    );
}

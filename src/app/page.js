"use client";

import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';
import {getLogin, login} from "@/common/services/apiCalls/login"
import {getLogoUrl} from "@/common/utils/base";
import {useLogin, useSendMessage, useGetContacts, useMessageAcknowledged} from "@/common/services/insideFunctions/useSendMessage";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import {useProcessMessage} from "@/common/services/insideFunctions/useProcessMessage";

export default function Home() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [currentContact, setCurrentContact] = useState(null);
    const [messages, setMessages] = useState({});
    const [message, setMessage] = useState('');
    const [webSocket, setWebSocket] = useState(null);
    const [lastAutomatedMessage, setLastAutomatedMessage] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);
    const currentUsername = localStorage.getItem('username');
    const myInfo = { id: 0, name: currentUsername, avatar: getLogoUrl() };
    const goLogin = useLogin(webSocket);
    const messageAcknowledged = useMessageAcknowledged(webSocket);
    const getContacts = useGetContacts(webSocket);
    const processMessage = useProcessMessage(setMessages, setCurrentContact, setContacts, setLastAutomatedMessage, webSocket, goLogin, getContacts, messageAcknowledged);
    const sendMessage = useSendMessage(myInfo, message, webSocket, currentContact, setMessage, setMessages, lastAutomatedMessage);

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


    // const updateMessages = useCallback((update) => {
    //     setMessages(prevMessages => {
    //         // You can add custom logic here if needed
    //         return { ...prevMessages, ...update };
    //     });
    // }, []);


    const selectContact = useCallback((contact) => {
        setCurrentContact(contact);
    }, []);


    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                {/* You might want to add a user avatar and last message preview here */}
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
                        </div>
                    )}
                </header>
                <div className={styles.messages}>
                    {currentContact && messages[currentContact.username]?.length > 0 && messages[currentContact.username]?.map((msg, index) => {
                        const isSentMessage = msg?.from === currentUsername;
                        return (
                            msg.text && (
                                <div key={index} className={`${styles.message} ${isSentMessage ? styles.sentMessage : styles.receivedMessage}`}>
                                    <div className={styles.messageContent}>{msg.text}</div>
                                    {/*<div className={styles.messageTimestamp}>{msg.timestamp}</div>*/}
                                </div>
                            )
                        );
                    })}
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
                            placeholder="Type a message..."
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                )}
            </main>
        </div>
    );
}

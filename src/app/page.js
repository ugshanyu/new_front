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
    const [isRecording, setIsRecording] = useState(false);
    const [showInputField, setShowInputField] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
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

      const handleStartRecording = () => {
        setIsRecording(true)
        startRecording()
      }
      
      const handleStopRecording = () => {
        setIsRecording(false)
        stopRecording();
        // downloadAudio();
    };

    useEffect(() => {
        const sendAudioForTranscription = async () => {
            if (mediaBlobUrl) {
                try {
                    // Fetch the audio blob from the blob URL
                    const response = await fetch(mediaBlobUrl);
                    const audioBlob = await response.blob();

                    // Prepare the audio blob for sending
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'recording.ogg');

                    // Send the audio file to your Flask API
                    const transcriptionResponse = await fetch("http://127.0.0.1:5001/upload_audio", {
                        method: 'POST',
                        body: formData,
                        // The 'Content-Type' header is set automatically by FormData
                    });

                    if (!transcriptionResponse.ok) {
                        throw new Error(`Error: ${transcriptionResponse.status}`);
                    }

                    // const transcriptionText = await transcriptionResponse.text();
                    // const parsed = JSON.parse(transcriptionText);

                    const responseData = await transcriptionResponse.json();

                    // Assuming the JSON object has 'transcription' and 'synthesized_audio' fields
                    const transcription = responseData.transcription;
                    const synthesizedAudioBase64 = responseData?.synthesized_audio;
                    const generated = responseData.generated;

                    if(synthesizedAudioBase64){
                        // Convert Base64 to Blob
                        const audioBlobResponse = base64ToBlob(synthesizedAudioBase64, 'audio/ogg');
                        const audioUrl = URL.createObjectURL(audioBlobResponse);

                        // Create an audio element and set its source
                        const audio = new Audio(audioUrl);
                        audio.play();
                    }

                    // Function to convert Base64 to Blob
                    function base64ToBlob(base64, mimeType) {
                        const byteCharacters = atob(base64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        return new Blob([byteArray], {type: mimeType});
                    }

                    const newMessage = {from:currentUsername, messageType: "inputTextMessage", text: transcription}

                    setMessages(prevMessages => ({
                        ...prevMessages,
                        [currentContact.id]: [...(prevMessages[currentContact.id] || []), newMessage]
                    }));

                    const generatedMessage = {from:'sever', messageType: "inputTextMessage", text: generated}

                    setMessages(prevMessages => ({
                        ...prevMessages,
                        [currentContact.id]: [...(prevMessages[currentContact.id] || []), generatedMessage]
                    }));

                } catch (error) {
                    console.error('Error during transcription:', error);
                }
            }
        };

        sendAudioForTranscription();
    }, [mediaBlobUrl]);

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

    const processMessage = useProcessMessage(setMessages, selectContact, setContacts, setLastAutomatedMessage, webSocket, goLogin, getContacts, messageAcknowledged, currentContact, contacts, currentContactMessages, setCurrentContactMessages, activeContacts, setActiveContacts, setFindUsers, messages, setUsersInfos)
    const sendMessage = useSendMessage(myInfo, message, webSocket, currentContact, setMessage, setMessages, lastAutomatedMessage, processMessage);
    const typingTimer = useRef(null);

    useEffect(() => {
        if (currentContact && messages[currentContact.id]) {
            setCurrentContactMessages(messages[currentContact.id]);
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
        if(currentContact?.activityStatus === "FACE_TO_FACE") {
            if (!writing && message !== '') {
                typing(webSocket, currentUsername, currentContact, true, setWriting);
            }
            if (message !== '') {
                typingTimer.current = setTimeout(() => {
                    typing(webSocket, currentUsername, currentContact, false, setWriting);
                }, 1000);
                if (!thinking) {
                    setThinking(true)
                }
            } else {
                setThinking(false)
                typing(webSocket, currentUsername, currentContact, false, setWriting);
            }
            return () => clearTimeout(typingTimer.current);
        }
    }, [message]);


    useEffect(() => {
        if(currentContact?.activityStatus === "FACE_TO_FACE") {
            if (thinking) {
                sendInputFocused(webSocket, currentUsername, currentContact, inputFocused);
            } else {
                sendInputFocused(webSocket, currentUsername, currentContact, false);
            }
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
                <div
                    className={`${styles.contact}`}
                    onClick={() => setIsSettingsModalOpen(true)}
                >
                    <img src='https://i.postimg.cc/KKhdzjM9/me.jpg' className={styles.avatar} />
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
                            <div className={styles.contactName}>{currentContact.username}</div>
                            {/* <div className={styles.activity}> {currentContact?.activityStatus}</div> */}
                            {/* <div className={styles.activity}> {   activeContacts[currentContact.username] ? "Face2Face" : ""}</div> */}
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
                <div>
            {currentContact && (
                <>
                {
                    !showInputField && (
                        <div className={styles.messageInput} style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <button
                            onMouseDown={handleStartRecording}
                            onMouseUp={handleStopRecording}
                            disabled={showInputField}
                            style={{
                                width: "80px",
                                marginRight: "10px",
                                fontSize: "55px",
                                padding: "3px",
                                backgroundColor: isRecording ? 'red' : '#06483c', // Red background when recording
                                color: isRecording ? 'white' : 'black', // White text when recording
                                // border: isRecording ? 'none' : 'none', // No border when recording
                                transition: 'all 0.3s ease' // Smooth transition for the color change
                            }}
                            >
                                🎙️
                                {/* {isRecording ? "Recording..." : "Record"} */}
                            </button>
                            <button 
                                onClick={() => setShowInputField(true)}
                                style={{width:"80px", fontSize:"55px", padding: "3px"}}
                            >
                            ⌨️
                            </button>
                        </div>
                    )
                }
                    {showInputField && (
                        <div className={styles.messageInput}>
                            <button onClick={() => setShowInputField(false)} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '10px', marginRight: '5px', fontSize: '20px' }}>
                            ⬅️
                            </button>
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

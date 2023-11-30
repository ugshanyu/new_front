// import { useCallback } from 'react';
// import {getLogin} from "@/common/services/login";
//
// export const useGetLogin = (setCurrentContact, setContacts, setMessages, setLastAutomatedMessage) => {
//     getLogin().then((value) => {
//         if (value && value.data && value.data.length > 0) {
//             const firstContact = value.data[0];
//             setCurrentContact(firstContact);
//             setContacts(value.data);
//             setMessages(prevMessages => ({...prevMessages, [firstContact.id]: [firstContact.greetingMessage]}));
//             setLastAutomatedMessage(firstContact.greetingMessage);
//         }
//     }).catch(error => {
//         // Handle errors here
//         console.error('Login failed', error);
//     });
// };
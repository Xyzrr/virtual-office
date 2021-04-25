import React from 'react';
import firebase from 'firebase';

export const firebaseConfig = {
  apiKey: 'AIzaSyA89oz2--yQCG8AieZNa_7j-gPcJsBFyEA',
  authDomain: 'harbor-chat.firebaseapp.com',
  projectId: 'harbor-chat',
  storageBucket: 'harbor-chat.appspot.com',
  messagingSenderId: '222349427903',
  appId: '1:222349427903:web:6433be4de99f7c5df5720a',
  measurementId: 'G-5C5J3GGJ06',
};

interface FirebaseContextValue {
  app: firebase.app.App;
  user: firebase.User | null;
}

export const FirebaseContext = React.createContext<FirebaseContextValue>(null!);

export const FirebaseContextProvider: React.FC = ({ children }) => {
  const app = React.useMemo(() => firebase.initializeApp(firebaseConfig), []);
  const [user, setUser] = React.useState<firebase.User | null>(null);

  app.auth().onAuthStateChanged((u) => {
    setUser(u);
  });

  return (
    <FirebaseContext.Provider value={{ app, user }}>
      {children}
    </FirebaseContext.Provider>
  );
};

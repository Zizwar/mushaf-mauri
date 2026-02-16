import Firebase from 'firebase';  
const config = {
    apiKey: "AIzaSyCRwSSbnZZwV8YS4Uwe28_mq0n1sBoKRxg",
    authDomain: "newagent-2ffd7.firebaseapp.com",
    databaseURL: "https://newagent-2ffd7.firebaseio.com",
    projectId: "newagent-2ffd7",
    storageBucket: "newagent-2ffd7.appspot.com",
    messagingSenderId: "570936787748"
  };
const app = Firebase.initializeApp(config);  
export const fireBase = app.database();  
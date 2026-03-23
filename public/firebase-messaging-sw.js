importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDx6852_7g8PhB7Ugnch6hfULRosE_uw6c",
  authDomain: "gen-lang-client-0611756149.firebaseapp.com",
  projectId: "gen-lang-client-0611756149",
  storageBucket: "gen-lang-client-0611756149.firebasestorage.app",
  messagingSenderId: "466716758805",
  appId: "1:466716758805:web:bd9c686d3e552385458f1c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

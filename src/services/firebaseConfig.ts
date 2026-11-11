export const firebaseConfig = {
  apiKey: "AIzaSyCF-ozgZR3xWAghqxWtUf-pWRZcoOsFPc4",
  authDomain: "th5-a7e16.firebaseapp.com",
  databaseURL: "https://th5-a7e16-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "th5-a7e16",
  storageBucket: "th5-a7e16.firebasestorage.app",
  messagingSenderId: "765987122517",
  appId: "1:765987122517:web:a6217a113b2fd2ce8bd3dc",
};


export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey.startsWith('AIza')
  );
};

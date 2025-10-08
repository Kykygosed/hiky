// Configuration Firebase — à remplacer par tes propres clés
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "TON_PROJET",
  storageBucket: "TON_PROJET.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Références aux éléments DOM
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');

const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const loginError = document.getElementById('login-error');

const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');

const contactsUl = document.getElementById('contacts-ul');
const addContactEmailInput = document.getElementById('add-contact-email');
const addContactBtn = document.getElementById('add-contact-btn');

const chatWithSpan = document.getElementById('chat-with');
const messagesContainer = document.getElementById('messages-container');
const messageInputArea = document.getElementById('message-input-area');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');

// Variables d’état
let currentUser = null;
let currentChatContact = null;
let unsubscribeMessagesListener = null;

// Auth : login / signup
signupBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      currentUser = userCredential.user;
      showChatScreen();
    })
    .catch(error => {
      loginError.textContent = error.message;
    });
});

loginBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      currentUser = userCredential.user;
      showChatScreen();
    })
    .catch(error => {
      loginError.textContent = error.message;
    });
});

// Déconnexion
logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => {
    currentUser = null;
    showLoginScreen();
  });
});

// Surveiller l’état de connexion
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    showChatScreen();
  } else {
    showLoginScreen();
  }
});

// Afficher écrans
function showLoginScreen() {
  loginScreen.classList.remove('hidden');
  chatScreen.classList.add('hidden');
  emailInput.value = passwordInput.value = '';
  loginError.textContent = '';
}

function showChatScreen() {
  loginScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  userEmailSpan.textContent = currentUser.email;
  loadContacts();
}

// Gestion des contacts
function loadContacts() {
  contactsUl.innerHTML = '';
  // On suppose une collection “users” et chaque user a un champ “contacts”: array d’emails ou d’IDs
  db.collection('users').doc(currentUser.uid).get()
    .then(docSnap => {
      if (!docSnap.exists) {
        // Créer user doc si inexistant
        db.collection('users').doc(currentUser.uid).set({
          email: currentUser.email,
          contacts: []
        });
        return { contacts: [] };
      } else {
        return docSnap.data();
      }
    })
    .then(userData => {
      const contacts = userData.contacts || [];
      contacts.forEach(contactUid => {
        // récupérer données de contact pour afficher email
        db.collection('users').doc(contactUid).get()
          .then(contactSnap => {
            const c = contactSnap.data();
            const li = document.createElement('li');
            li.textContent = c.email;
            li.dataset.uid = contactUid;
            li.addEventListener('click', () => {
              openChatWith(contactUid, c.email);
            });
            contactsUl.appendChild(li);
          });
      });
    });
}

// Ajouter un contact
addContactBtn.addEventListener('click', () => {
  const contactEmail = addContactEmailInput.value.trim();
  if (!contactEmail) return;
  // Trouver l'utilisateur avec cet email
  db.collection('users').where('email', '==', contactEmail).get()
    .then(querySnap => {
      if (querySnap.empty) {
        alert("Aucun utilisateur avec cet email.");
      } else {
        const contactDoc = querySnap.docs[0];
        const contactUid = contactDoc.id;
        // Mettre à jour les contacts de currentUser
        const userRef = db.collection('users').doc(currentUser.uid);
        userRef.update({
          contacts: firebase.firestore.FieldValue.arrayUnion(contactUid)
        })
        .then(() => {
          loadContacts();
          addContactEmailInput.value = '';
        });
      }
    });
});

// Ouvrir un chat
function openChatWith(contactUid, contactEmail) {
  currentChatContact = { uid: contactUid, email: contactEmail };
  chatWithSpan.textContent = contactEmail;
  messagesContainer.innerHTML = '';
  messageInputArea.classList.remove('hidden');

  // Si déjà un listener, désabonner
  if (unsubscribeMessagesListener) {
    unsubscribeMessagesListener();
  }

  // On suppose une collection “chats” où chaque chat a un id fixe, ex : `chat_user1_user2`
  const chatId = getChatId(currentUser.uid, contactUid);
  const messagesRef = db.collection('chats').doc(chatId).collection('messages')
    .orderBy('timestamp');

  unsubscribeMessagesListener = messagesRef.onSnapshot(snapshot => {
    // effacer messages affichés
    messagesContainer.innerHTML = '';
    snapshot.forEach(doc => {
      const msg = doc.data();
      const msgEl = document.createElement('div');
      msgEl.classList.add('message');
      if (msg.sender === currentUser.uid) {
        msgEl.classList.add('sent');
      } else {
        msgEl.classList.add('received');
      }
      msgEl.textContent = msg.text;
      messagesContainer.appendChild(msgEl);
    });
    // scroller vers le bas
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

// Envoyer message
sendMessageBtn.addEventListener('click', () => {
  const text = messageInput.value.trim();
  if (!text || !currentChatContact) return;
  const chatId = getChatId(currentUser.uid, currentChatContact.uid);
  const msgObj = {
    text: text,
    sender: currentUser.uid,
    receiver: currentChatContact.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  db.collection('chats').doc(chatId).collection('messages').add(msgObj)
    .then(() => {
      messageInput.value = '';
    });
});

// Utility : générer un ID de chat stable entre deux utilisateurs
function getChatId(uid1, uid2) {
  // pour que ce soit le même quel que soit l’ordre
  return uid1 < uid2 ? uid1 + '_' + uid2 : uid2 + '_' + uid1;
}

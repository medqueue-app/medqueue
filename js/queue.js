// queue.js - LocalStorage State Management + Firebase Sync for MedQueue

// 1. Inject Firebase SDKs dynamically
function loadFirebase() {
    return new Promise((resolve) => {
        if (window.firebase) {
            resolve();
            return;// queue.js - LocalStorage State Management + Firebase Sync for MedQueue

// 1. Inject Firebase SDKs dynamically with Anti-Crash system
function loadFirebase() {
    return new Promise((resolve) => {
        if (window.firebase) {
            resolve();
            return;
        }
        const scriptApp = document.createElement('script');
        scriptApp.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
        document.head.appendChild(scriptApp);

        scriptApp.onload = () => {
            const scriptDb = document.createElement('script');
            scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
            document.head.appendChild(scriptDb);
            
            scriptDb.onload = () => {
                const firebaseConfig = {
                  apiKey: "AIzaSyD3fKpibWcvijbMnIRbvaUzDYyA7fyhaT0",
                  authDomain: "antreanmedqueue.firebaseapp.com",
                  databaseURL: "https://antreanmedqueue-default-rtdb.asia-southeast1.firebasedatabase.app", 
                  projectId: "antreanmedqueue",
                  storageBucket: "antreanmedqueue.firebasestorage.app",
                  messagingSenderId: "627313956418",
                  appId: "1:627313956418:web:5c74ce3e33dab6896a7fdb"
                };
                
                try {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }
                    
                    const db = firebase.database();
                    
                    if (window.pendingFirebaseSave) {
                        db.ref('medqueue_data').set(window.pendingFirebaseSave).catch(e => console.log("Gagal simpan tertunda", e));
                        window.pendingFirebaseSave = null;
                    }

                    db.ref('medqueue_data').on('value', (snapshot) => {
                        const data = snapshot.val();
                        if (data && !window.pendingFirebaseSave) {
                            localStorage.setItem('medqueue_data', JSON.stringify(data));
                        }
                    });
                    
                    window.firebaseReady = true; // Tandai bahwa Firebase sukses dan aman
                    resolve();
                } catch(e) {
                    console.error("Firebase init error:", e);
                    resolve(); // Tetap jalankan aplikasi meski Firebase gagal
                }
            };
            
            scriptDb.onerror = resolve; // Jika internet mati, jangan biarkan aplikasi macet
        };
        scriptApp.onerror = resolve;
    });
}

function initQueueDB() {
    if (!localStorage.getItem('medqueue_data')) {
        const initialData = {
            queues: [
                { id: 'B-10', patientName: 'Budi Santoso', poliName: 'Poli Umum', status: 'Selesai', timestamp: new Date(Date.now() - 3600000).toISOString() },
                { id: 'B-11', patientName: 'Siti Rahma', poliName: 'Poli Umum', status: 'Dilayani', timestamp: new Date(Date.now() - 1800000).toISOString() },
                { id: 'B-12', patientName: 'Ahmad Riyadi', poliName: 'Poli Umum', status: 'Hampir Tiba', timestamp: new Date().toISOString() }
            ],
            currentCalling: {
                'Poli Umum': 'B-11',
                'Poli Anak': 'A-05',
                'Poli Gigi': 'G-02',
                'Poli Mata': 'M-01'
            }
        };
        localStorage.setItem('medqueue_data', JSON.stringify(initialData));
        
        if (window.firebaseReady) {
            try { firebase.database().ref('medqueue_data').set(initialData); } catch(e){}
        } else {
            window.pendingFirebaseSave = initialData;
        }
    }
}

function getQueueDB() {
    let data;
    try {
        data = JSON.parse(localStorage.getItem('medqueue_data'));
        if (!data || !Array.isArray(data.queues) || !data.currentCalling) {
            throw new Error("Invalid format");
        }
    } catch (e) {
        localStorage.removeItem('medqueue_data');
        initQueueDB();
        data = JSON.parse(localStorage.getItem('medqueue_data'));
    }
    return data;
}

function saveQueueDB(data) {
    localStorage.setItem('medqueue_data', JSON.stringify(data));
    
    if (window.firebaseReady) {
        try { 
            firebase.database().ref('medqueue_data').set(data).catch(err => {
                console.error("Gagal sinkron ke Firebase", err);
            });
        } catch(e){}
    } else {
        window.pendingFirebaseSave = data;
    }
}

function addPatientQueue(patientName, poliName) {
    const db = getQueueDB();
    let prefix = 'B'; 
    if (poliName.includes('Anak')) prefix = 'A';
    if (poliName.includes('Gigi')) prefix = 'G';
    if (poliName.includes('Mata')) prefix = 'M';
    
    const samePoliQueues = db.queues.filter(q => q.id.startsWith(prefix));
    let nextNum = samePoliQueues.length + 10; 
    let nextId = `${prefix}-${nextNum}`;
    
    while (db.queues.some(q => q.id === nextId)) {
        nextNum++;
        nextId = `${prefix}-${nextNum}`;
    }
    
    const newQueue = {
        id: nextId,
        patientName: patientName,
        poliName: poliName,
        status: 'Menunggu',
        timestamp: new Date().toISOString()
    };
    
    db.queues.push(newQueue);
    saveQueueDB(db);
    localStorage.setItem('activeQueueId', nextId);
    return newQueue;
}

function getActiveQueue() {
    const activeId = localStorage.getItem('activeQueueId');
    if (!activeId) return null;
    const db = getQueueDB();
    return db.queues.find(q => q.id === activeId) || null;
}

function updateQueueStatus(queueId, newStatus) {
    const db = getQueueDB();
    const queue = db.queues.find(q => q.id === queueId);
    if (queue) {
        queue.status = newStatus;
        if (newStatus === 'Dilayani') {
            db.currentCalling[queue.poliName] = queueId;
        }
        saveQueueDB(db);
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('activeQueueId');
    window.location.href = 'penutup.html';
}

function clearActiveQueue() {
    localStorage.removeItem('activeQueueId');
}

loadFirebase().then(() => {
    if (!localStorage.getItem('medqueue_data')) {
        initQueueDB();
    }
});
        }
        const scriptApp = document.createElement('script');
        scriptApp.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
        document.head.appendChild(scriptApp);

        scriptApp.onload = () => {
            const scriptDb = document.createElement('script');
            scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
            document.head.appendChild(scriptDb);
            
            scriptDb.onload = () => {
                const firebaseConfig = {
                  apiKey: "AIzaSyD3fKpibWcvijbMnIRbvaUzDYyA7fyhaT0",
                  authDomain: "antreanmedqueue.firebaseapp.com",
                  // INI ADALAH LINK DATABASE SINGAPURA ANDA YANG BENAR:
                  databaseURL: "https://antreanmedqueue-default-rtdb.asia-southeast1.firebasedatabase.app", 
                  projectId: "antreanmedqueue",
                  storageBucket: "antreanmedqueue.firebasestorage.app",
                  messagingSenderId: "627313956418",
                  appId: "1:627313956418:web:5c74ce3e33dab6896a7fdb",
                  measurementId: "G-B8X0DXEQ85"
                };
                
                try {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }
                    
                    const db = firebase.database();
                    
                    if (window.pendingFirebaseSave) {
                        db.ref('medqueue_data').set(window.pendingFirebaseSave);
                        window.pendingFirebaseSave = null;
                    }

                    db.ref('medqueue_data').on('value', (snapshot) => {
                        const data = snapshot.val();
                        if (data && !window.pendingFirebaseSave) {
                            localStorage.setItem('medqueue_data', JSON.stringify(data));
                        }
                    });
                    
                    resolve();
                } catch(e) {
                    console.error("Firebase init error:", e);
                    resolve();
                }
            };
        };
    });
}

function initQueueDB() {
    if (!localStorage.getItem('medqueue_data')) {
        const initialData = {
            queues: [
                { id: 'B-10', patientName: 'Budi Santoso', poliName: 'Poli Umum', status: 'Selesai', timestamp: new Date(Date.now() - 3600000).toISOString() },
                { id: 'B-11', patientName: 'Siti Rahma', poliName: 'Poli Umum', status: 'Dilayani', timestamp: new Date(Date.now() - 1800000).toISOString() },
                { id: 'B-12', patientName: 'Ahmad Riyadi', poliName: 'Poli Umum', status: 'Hampir Tiba', timestamp: new Date().toISOString() }
            ],
            currentCalling: {
                'Poli Umum': 'B-11',
                'Poli Anak': 'A-05',
                'Poli Gigi': 'G-02',
                'Poli Mata': 'M-01'
            }
        };
        localStorage.setItem('medqueue_data', JSON.stringify(initialData));
        
        if (window.firebase && firebase.database) {
            firebase.database().ref('medqueue_data').set(initialData);
        } else {
            window.pendingFirebaseSave = initialData;
        }
    }
}

function getQueueDB() {
    let data;
    try {
        data = JSON.parse(localStorage.getItem('medqueue_data'));
        if (!data || !Array.isArray(data.queues) || !data.currentCalling) {
            throw new Error("Invalid format");
        }
    } catch (e) {
        localStorage.removeItem('medqueue_data');
        initQueueDB();
        data = JSON.parse(localStorage.getItem('medqueue_data'));
    }
    return data;
}

function saveQueueDB(data) {
    localStorage.setItem('medqueue_data', JSON.stringify(data));
    
    if (window.firebase && firebase.database) {
        firebase.database().ref('medqueue_data').set(data).catch(err => {
            console.error("Gagal sinkron ke Firebase", err);
        });
    } else {
        window.pendingFirebaseSave = data;
    }
}

function addPatientQueue(patientName, poliName) {
    const db = getQueueDB();
    let prefix = 'B'; 
    if (poliName.includes('Anak')) prefix = 'A';
    if (poliName.includes('Gigi')) prefix = 'G';
    if (poliName.includes('Mata')) prefix = 'M';
    
    const samePoliQueues = db.queues.filter(q => q.id.startsWith(prefix));
    let nextNum = samePoliQueues.length + 10; 
    let nextId = `${prefix}-${nextNum}`;
    
    while (db.queues.some(q => q.id === nextId)) {
        nextNum++;
        nextId = `${prefix}-${nextNum}`;
    }
    
    const newQueue = {
        id: nextId,
        patientName: patientName,
        poliName: poliName,
        status: 'Menunggu',
        timestamp: new Date().toISOString()
    };
    
    db.queues.push(newQueue);
    saveQueueDB(db);
    localStorage.setItem('activeQueueId', nextId);
    return newQueue;
}

function getActiveQueue() {
    const activeId = localStorage.getItem('activeQueueId');
    if (!activeId) return null;
    const db = getQueueDB();
    return db.queues.find(q => q.id === activeId) || null;
}

function updateQueueStatus(queueId, newStatus) {
    const db = getQueueDB();
    const queue = db.queues.find(q => q.id === queueId);
    if (queue) {
        queue.status = newStatus;
        if (newStatus === 'Dilayani') {
            db.currentCalling[queue.poliName] = queueId;
        }
        saveQueueDB(db);
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('activeQueueId');
    window.location.href = 'penutup.html';
}

function clearActiveQueue() {
    localStorage.removeItem('activeQueueId');
}

loadFirebase().then(() => {
    if (!localStorage.getItem('medqueue_data')) {
        initQueueDB();
    }
});

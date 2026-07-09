// queue.js - LocalStorage State Management + Firebase Sync for MedQueue

// 1. Inject Firebase SDKs dynamically
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
                  // Jika database tidak mau terhubung, URL ini bisa diganti dengan versi .asia-southeast1
                  databaseURL: "https://antreanmedqueue-default-rtdb.firebaseio.com", 
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
                    
                    // Jika ada data yang tertahan untuk disimpan (race condition fix)
                    if (window.pendingFirebaseSave) {
                        db.ref('medqueue_data').set(window.pendingFirebaseSave);
                        window.pendingFirebaseSave = null;
                    }

                    // Dengarkan perubahan dari Firebase dan SINKRONKAN ke LocalStorage HP
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

// Initialize queue database if it doesn't exist
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

// Get the entire database safely
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

// Save the database (LocalStorage + Firebase Sync)
function saveQueueDB(data) {
    localStorage.setItem('medqueue_data', JSON.stringify(data));
    
    // Sinkronkan secara otomatis ke Firebase Realtime Database
    if (window.firebase && firebase.database) {
        firebase.database().ref('medqueue_data').set(data).catch(err => {
            console.error("Gagal sinkron ke Firebase", err);
        });
    } else {
        window.pendingFirebaseSave = data;
    }
}

// Add a new queue for a patient
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

// Get current active queue for the current logged-in patient
function getActiveQueue() {
    const activeId = localStorage.getItem('activeQueueId');
    if (!activeId) return null;
    const db = getQueueDB();
    return db.queues.find(q => q.id === activeId) || null;
}

// Update queue status (called by Admin)
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

// Log out user
function logout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('activeQueueId');
    window.location.href = 'penutup.html';
}

function clearActiveQueue() {
    localStorage.removeItem('activeQueueId');
}

// Mulai jalankan sistem Firebase saat file diload
loadFirebase().then(() => {
    if (!localStorage.getItem('medqueue_data')) {
        initQueueDB();
    }
});

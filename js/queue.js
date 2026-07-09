// queue.js - LocalStorage State Management for MedQueue

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
    }
}

// Get the entire database
function getQueueDB() {
    initQueueDB();
    return JSON.parse(localStorage.getItem('medqueue_data'));
}

// Save the database
function saveQueueDB(data) {
    localStorage.setItem('medqueue_data', JSON.stringify(data));
}

// Add a new queue for a patient
function addPatientQueue(patientName, poliName) {
    const db = getQueueDB();
    
    // Generate letter prefix based on poliName
    let prefix = 'B'; // Default B (Poli Umum)
    if (poliName.includes('Anak')) prefix = 'A';
    if (poliName.includes('Gigi')) prefix = 'G';
    if (poliName.includes('Mata')) prefix = 'M';
    
    // Calculate new number
    const samePoliQueues = db.queues.filter(q => q.id.startsWith(prefix));
    let nextNum = samePoliQueues.length + 10; // Start at 10 for aesthetics
    let nextId = `${prefix}-${nextNum}`;
    
    // Check for collisions and increment if needed
    while (db.queues.some(q => q.id === nextId)) {
        nextNum++;
        nextId = `${prefix}-${nextNum}`;
    }
    
    const newQueue = {
        id: nextId,
        patientName: patientName,
        poliName: poliName,
        status: 'Menunggu', // Menunggu, Hampir Tiba, Dilayani, Selesai
        timestamp: new Date().toISOString()
    };
    
    db.queues.push(newQueue);
    saveQueueDB(db);
    
    // Save this patient's active queue ID to their local session
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
        
        // If the status is "Dilayani" (Serving), update current calling for this poli
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
    localStorage.removeItem('activeQueueId');// queue.js - LocalStorage State Management for MedQueue

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
    }
}

// Get the entire database safely (auto-heals if corrupt)
function getQueueDB() {
    initQueueDB();
    let data;
    try {
        data = JSON.parse(localStorage.getItem('medqueue_data'));
        if (!data || !Array.isArray(data.queues) || !data.currentCalling) {
            throw new Error("Invalid format");
        }
    } catch (e) {
        // If data is corrupt or in old format, reset it
        localStorage.removeItem('medqueue_data');
        initQueueDB();
        data = JSON.parse(localStorage.getItem('medqueue_data'));
    }
    return data;
}

// Save the database
function saveQueueDB(data) {
    localStorage.setItem('medqueue_data', JSON.stringify(data));
}

// Add a new queue for a patient
function addPatientQueue(patientName, poliName) {
    const db = getQueueDB();
    
    // Generate letter prefix based on poliName
    let prefix = 'B'; // Default B (Poli Umum)
    if (poliName.includes('Anak')) prefix = 'A';
    if (poliName.includes('Gigi')) prefix = 'G';
    if (poliName.includes('Mata')) prefix = 'M';
    
    // Calculate new number
    const samePoliQueues = db.queues.filter(q => q.id.startsWith(prefix));
    let nextNum = samePoliQueues.length + 10; // Start at 10 for aesthetics
    let nextId = `${prefix}-${nextNum}`;
    
    // Check for collisions and increment if needed
    while (db.queues.some(q => q.id === nextId)) {
        nextNum++;
        nextId = `${prefix}-${nextNum}`;
    }
    
    const newQueue = {
        id: nextId,
        patientName: patientName,
        poliName: poliName,
        status: 'Menunggu', // Menunggu, Hampir Tiba, Dilayani, Selesai
        timestamp: new Date().toISOString()
    };
    
    db.queues.push(newQueue);
    saveQueueDB(db);
    
    // Save this patient's active queue ID to their local session
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
        
        // If the status is "Dilayani" (Serving), update current calling for this poli
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

// Clear active queue session
function clearActiveQueue() {
    localStorage.removeItem('activeQueueId');
}

// Auto-run init on import
initQueueDB();
    window.location.href = 'penutup.html';
}

// Clear active queue session
function clearActiveQueue() {
    localStorage.removeItem('activeQueueId');
}

// Auto-run init on import
initQueueDB();

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN HALAMAN ---
    const loginPage = document.getElementById('login-page');
    const attendancePage = document.getElementById('attendance-page');
    
    // --- ELEMEN LOGIN ---
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const userNameSpan = document.getElementById('user-name');
    
    // --- ELEMEN KEHADIRAN ---
    const attendanceType = document.getElementById('attendance-type');
    const reasonInput = document.getElementById('reason-input');
    const submitAttendanceBtn = document.getElementById('submit-attendance-btn');
    const attendanceList = document.getElementById('attendance-list');
    const logoutBtn = document.getElementById('logout-btn');
    
    // --- TAB & SECTION ---
    const dailyTab = document.getElementById('daily-tab');
    const fullListTab = document.getElementById('full-list-tab');
    const studentsTab = document.getElementById('students-tab');
    const reportTab = document.getElementById('report-tab');
    const dailySection = document.getElementById('daily-section');
    const fullListSection = document.getElementById('full-list-section');
    const studentsSection = document.getElementById('students-section');
    const reportSection = document.getElementById('report-section');
    
    // --- DAFTAR LENGKAP ---
    const fullAttendanceList = document.getElementById('full-attendance-list');
    const studentStatusBody = document.getElementById('student-status-body');
    const dateFilter = document.getElementById('date-filter');
    const typeFilter = document.getElementById('type-filter');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    
    // --- LAPORAN ---
    const monthFilter = document.getElementById('month-filter');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const reportBody = document.getElementById('report-body');
    
    // --- MANAJEMEN SISWA ---
    const studentsBody = document.getElementById('students-body');
    const addStudentBtn = document.getElementById('add-student-btn');
    const studentModal = document.getElementById('student-modal');
    const closeModal = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const studentName = document.getElementById('student-name');
    const studentUsername = document.getElementById('student-username');
    const studentClassInput = document.getElementById('student-class');
    const saveStudentBtn = document.getElementById('save-student-btn');
    
    // --- KAMERA ---
    const cameraSection = document.getElementById('camera-section');
    const openCameraBtn = document.getElementById('open-camera-btn');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const cameraError = document.getElementById('camera-error');
    
    // --- KONSTANTA & STATE ---
    const KELAS = '12 TPTU 1';
    let currentUser = null;
    let attendanceRecords = JSON.parse(localStorage.getItem('attendance')) || [];
    let students = JSON.parse(localStorage.getItem('students')) || [
        { name: 'Dion', username: 'dion', class: KELAS },
        { name: 'Mulki', username: 'mulki', class: KELAS },
        { name: 'Haikal', username: 'haikal', class: KELAS },
        { name: 'Farok', username: 'farok', class: KELAS },
        { name: 'Ilham', username: 'ilham', class: KELAS },
        { name: 'Dimas', username: 'dimas', class: KELAS },
        { name: 'Yogi', username: 'yogi', class: KELAS },
        { name: 'Albar', username: 'albar', class: KELAS }
    ];
    let stream = null;
    let selfieData = null;
    let editingStudentIndex = null;
    let currentReportData = [];

    // --- FITUR BARU: TOMBOL UNDUH LAPORAN PERSENTASE ---
    // Membuat elemen tombol secara dinamis jika belum ada di HTML
    let exportReportBtn = document.getElementById('export-report-btn');
    if (!exportReportBtn) {
        exportReportBtn = document.createElement('button');
        exportReportBtn.id = 'export-report-btn';
        exportReportBtn.textContent = 'Unduh Laporan Persentase (CSV)';
        // Styling sederhana untuk tombol
        exportReportBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; font-size: 14px;';
        
        // Mencari container untuk meletakkan tombol
        const reportActions = document.querySelector('#report-section .action-bar');
        if (reportActions) {
            reportActions.appendChild(exportReportBtn);
        } else {
            // Fallback jika tidak ada action bar
            reportSection.insertBefore(exportReportBtn, generateReportBtn.nextSibling);
        }
    }

    // --- FUNGSI BANTUAN: KOMPRESI GAMBAR ---
    // Mengubah ukuran gambar menjadi lebih kecil agar tidak memenuhi localStorage
    function compressImage(sourceCanvas) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Maksimum lebar 300px (ukuran thumbnail)
        const MAX_WIDTH = 300;
        let width = sourceCanvas.videoWidth || sourceCanvas.width;
        let height = sourceCanvas.videoHeight || sourceCanvas.height;

        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        
        // Gambar ulang ke canvas baru dengan ukuran lebih kecil
        // Kita gambar video atau canvas sumber ke canvas tujuan
        if (sourceCanvas.tagName === 'VIDEO') {
            ctx.drawImage(sourceCanvas, 0, 0, width, height);
        } else {
            ctx.drawImage(sourceCanvas, 0, 0, width, height);
        }

        // Kembalikan sebagai data URL dengan kualitas 0.6 (60%)
        return canvas.toDataURL('image/jpeg', 0.6);
    }

    // --- LOGIN ---
    loginBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const user = students.find(stu => stu.username === username);
        
        if (user && password === '12345') {
            currentUser = username;
            userNameSpan.textContent = user.name;
            loginPage.classList.remove('active');
            attendancePage.classList.add('active');
            loadAttendance();
            loadFullList();
            loadStudentStatus();
            requestNotificationPermission();
            setReminder();
        } else {
            loginError.textContent = 'Username atau password salah!';
        }
    });

    // --- LOGOUT ---
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        loginPage.classList.add('active');
        attendancePage.classList.remove('active');
        usernameInput.value = '';
        passwordInput.value = '';
        loginError.textContent = '';
        stopCamera(); // Matikan kamera saat logout
    });

    // --- TAB SWITCHING ---
    dailyTab.addEventListener('click', () => setActiveTab(dailyTab, dailySection));
    fullListTab.addEventListener('click', () => {
        setActiveTab(fullListTab, fullListSection);
        loadFullList();
        loadStudentStatus();
    });
    studentsTab.addEventListener('click', () => {
        setActiveTab(studentsTab, studentsSection);
        loadStudents();
    });
    reportTab.addEventListener('click', () => setActiveTab(reportTab, reportSection));

    function setActiveTab(tab, section) {
        [dailyTab, fullListTab, studentsTab, reportTab].forEach(t => t.classList.remove('active'));
        [dailySection, fullListSection, studentsSection, reportSection].forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        section.classList.add('active');
    }

    // --- KAMERA & KEHADIRAN ---
    attendanceType.addEventListener('change', () => {
        if (attendanceType.value === 'hadir') {
            reasonInput.style.display = 'none';
            cameraSection.classList.remove('camera-hidden');
        } else {
            reasonInput.style.display = 'block';
            cameraSection.classList.add('camera-hidden');
            stopCamera(); // Matikan kamera jika tidak hadir
        }
    });

    openCameraBtn.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            video.srcObject = stream;
            cameraSection.classList.add('camera-active');
            openCameraBtn.classList.add('hidden');
            captureBtn.classList.add('visible');
            cameraError.textContent = '';
        } catch (err) {
            cameraError.textContent = 'Kamera tidak tersedia atau izin ditolak: ' + err.message;
        }
    });

    captureBtn.addEventListener('click', () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // GAMBAR KE CANVAS SEMENTARA
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = video.videoWidth;
            tempCanvas.height = video.videoHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // KOMPRES GAMBAR SEBELUM DISIMPAN
            selfieData = compressImage(tempCanvas);
            
            stopCamera();
            captureBtn.classList.remove('visible');
            retakeBtn.classList.add('visible');
            
            // Tampilkan preview kecil (opsional)
            const preview = document.createElement('img');
            preview.src = selfieData;
            preview.style.maxWidth = '100px';
            preview.style.marginTop = '10px';
            preview.style.borderRadius = '4px';
            preview.style.border = '2px solid #28a745';
            // Hapus preview lama jika ada
            const existingPreview = cameraSection.querySelector('.selfie-preview');
            if(existingPreview) existingPreview.remove();
            preview.className = 'selfie-preview';
            cameraSection.appendChild(preview);
        }
    });

    retakeBtn.addEventListener('click', () => {
        selfieData = null;
        retakeBtn.classList.remove('visible');
        openCameraBtn.classList.remove('hidden');
        cameraSection.classList.remove('camera-active');
        const preview = cameraSection.querySelector('.selfie-preview');
        if(preview) preview.remove();
    });

    submitAttendanceBtn.addEventListener('click', () => {
        const type = attendanceType.value;
        const reason = reasonInput.value.trim();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        let record = {
            user: currentUser,
            type: type === 'hadir' ? 'Check-In' : (type === 'izin' ? 'Izin' : 'Sakit'),
            time: now.toLocaleString(),
            date: today,
            reason: reason || '-'
        };

        if (type === 'hadir') {
            const existingCheckIn = attendanceRecords.find(r => r.user === currentUser && r.date === today && (r.type === 'Check-In' || r.type === 'Check-Out') && !r.checkOutTime);
            
            // Logika Check-Out Otomatis
            if (existingCheckIn && existingCheckIn.type === 'Check-In') {
                existingCheckIn.checkOutTime = now.toLocaleString();
                existingCheckIn.type = 'Check-Out';
                saveData();
                loadAttendance();
                loadStudentStatus();
                alert('Check-Out berhasil! selfie tidak diperlukan.');
                return;
            }

            // Validasi Selfie
            if (!selfieData) {
                alert('Ambil selfie terlebih dahulu!');
                return;
            }
            record.selfie = selfieData;
            
            // Reset State
            selfieData = null;
            retakeBtn.classList.remove('visible');
            openCameraBtn.classList.remove('hidden');
            cameraSection.classList.remove('camera-active');
            const preview = cameraSection.querySelector('.selfie-preview');
            if(preview) preview.remove();
        }

        attendanceRecords.push(record);
        try {
            saveData();
            loadAttendance();
            loadStudentStatus();
            alert('Kehadiran berhasil disubmit!');
        } catch (e) {
            alert('Gagal menyimpan: Kuota penyimpanan penuh! Hapus data lama atau gunakan foto dengan resolusi lebih rendah.');
            console.error(e);
        }
    });

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        video.srcObject = null;
    }

    function saveData() {
        localStorage.setItem('attendance', JSON.stringify(attendanceRecords));
    }

    // --- FILTER & LIST ---
    dateFilter.addEventListener('change', loadFullList);
    typeFilter.addEventListener('change', loadFullList);
    clearFilterBtn.addEventListener('click', () => {
        dateFilter.value = '';
        typeFilter.value = '';
        loadFullList();
    });

    // Export CSV Lengkap
    exportCsvBtn.addEventListener('click', () => {
        const csvContent = 'data:text/csv;charset=utf-8,' + 
            'User,Type,Time,Date,Reason,Check-Out\n' + 
            attendanceRecords.map(r => `${r.user},${r.type},${r.time},${r.date},${r.reason || ''},${r.checkOutTime || ''}`).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'attendance_records.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- LAPORAN BULANAN ---
    generateReportBtn.addEventListener('click', () => {
        const month = monthFilter.value;
        if (!month) {
            alert('Pilih bulan terlebih dahulu!');
            return;
        }
        const [year, monthNum] = month.split('-');
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0);
        
        const monthlyRecords = attendanceRecords.filter(r => {
            const recordDate = new Date(r.date);
            return recordDate >= startDate && recordDate <= endDate;
        });

        reportBody.innerHTML = '';
        currentReportData = [];

        students.forEach(student => {
            const studentRecords = monthlyRecords.filter(r => r.user === student.username);
            
            // Hitung jumlah per kategori
            // Catatan: Check-In dan Check-Out dihitung sebagai 1 kali kehadiran aktif
            const hadirCount = studentRecords.filter(r => r.type === 'Check-In' || r.type === 'Check-Out').length;
            const izinCount = studentRecords.filter(r => r.type === 'Izin').length;
            const sakitCount = studentRecords.filter(r => r.type === 'Sakit').length;
            
            const total = hadirCount + izinCount + sakitCount;
            
            let percentage = 0;
            if (total > 0) {
                percentage = ((hadirCount / total) * 100).toFixed(2);
            }

            currentReportData.push({
                name: student.name,
                class: KELAS,
                hadir: hadirCount,
                izin: izinCount,
                sakit: sakitCount,
                total: total,
                percentage: percentage + '%'
            });

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${KELAS}</td>
                <td>${hadirCount}</td>
                <td>${izinCount}</td>
                <td>${sakitCount}</td>
                <td>${total}</td>
                <td><strong>${percentage}%</strong></td>
            `;
            reportBody.appendChild(row);
        });
    });

    // --- UNDUH LAPORAN PERSENTASE ---
    exportReportBtn.addEventListener('click', () => {
        if (currentReportData.length === 0) {
            alert('Silakan generate laporan terlebih dahulu!');
            return;
        }

        let csvContent = 'data:text/csv;charset=utf-8,Nama,Kelas,Hadir,Izin,Sakit,Total,Persentase\n';
        
        currentReportData.forEach(row => {
            // Menghilangkan koma pada data jika ada untuk mencegah error CSV
            const safeName = row.name.replace(/,/g, '');
            const rowString = `${safeName},${row.class},${row.hadir},${row.izin},${row.sakit},${row.total},${row.percentage}`;
            csvContent += rowString + '\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `laporan_persentase_${monthFilter.value}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- LOAD DATA ---
    function loadAttendance() {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = attendanceRecords.filter(record => record.date === today && record.user === currentUser);
        attendanceList.innerHTML = '';
        todayRecords.forEach(record => {
            const li = document.createElement('li');
            li.innerHTML = `<b>${record.type}</b> pada ${record.time}${record.checkOutTime ? ' - Check-Out: ' + record.checkOutTime : ''} <br> Alasan: ${record.reason}`;
            if (record.selfie) {
                const img = document.createElement('img');
                img.src = record.selfie;
                img.className = 'selfie';
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.marginTop = '5px';
                img.style.borderRadius = '4px';
                li.appendChild(img);
            }
            attendanceList.appendChild(li);
        });
    }

    function loadFullList() {
        const selectedDate = dateFilter.value;
        const selectedType = typeFilter.value;
        const filteredRecords = attendanceRecords.filter(record => {
            const dateMatch = !selectedDate || record.date === selectedDate;
            const typeMatch = !selectedType || record.type === selectedType;
            return dateMatch && typeMatch;
        });
        fullAttendanceList.innerHTML = '';
        filteredRecords.forEach(record => {
            const li = document.createElement('li');
            li.textContent = `${record.user} - ${record.type} (${record.date}) - ${record.time}`;
            if (record.selfie) {
                const img = document.createElement('img');
                img.src = record.selfie;
                img.style.maxWidth = '50px';
                img.style.maxHeight = '50px';
                li.appendChild(img);
            }
            fullAttendanceList.appendChild(li);
        });
    }

    function loadStudentStatus() {
        const today = new Date().toISOString().split('T')[0];
        studentStatusBody.innerHTML = '';
        students.forEach(student => {
            const todayRecord = attendanceRecords.find(record => record.user === student.username && record.date === today);
            let status = 'Absen';
            let time = '-';
            if (todayRecord) {
                if (todayRecord.type === 'Check-In') { status = 'Hadir'; time = todayRecord.time; }
                else if (todayRecord.type === 'Check-Out') { status = 'Pulang'; time = todayRecord.checkOutTime || todayRecord.time; }
                else if (todayRecord.type === 'Izin') { status = 'Izin'; time = '-'; }
                else if (todayRecord.type === 'Sakit') { status = 'Sakit'; time = '-'; }
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${KELAS}</td>
                <td class="status-${status.toLowerCase()}">${status}</td>
                <td>${time}</td>
            `;
            studentStatusBody.appendChild(row);
        });
    }

    function loadStudents() {
        studentsBody.innerHTML = '';
        students.forEach((student, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${student.username}</td>
                <td>${KELAS}</td>
                <td>
                    <button onclick="editStudent(${index})" style="margin-right:5px;">Edit</button>
                    <button onclick="deleteStudent(${index})" style="background-color:#dc3545; color:white;">Hapus</button>
                </td>
            `;
            studentsBody.appendChild(row);
        });
    }

    // --- MANAJEMEN SISWA ---
    addStudentBtn.addEventListener('click', () => {
        editingStudentIndex = null;
        modalTitle.textContent = 'Tambah Siswa';
        studentName.value = '';
        studentUsername.value = '';
        studentClassInput.value = KELAS;
        studentClassInput.disabled = true;
        studentModal.classList.remove('hidden');
    });

    window.editStudent = (index) => {
        editingStudentIndex = index;
        const student = students[index];
        modalTitle.textContent = 'Edit Siswa';
        studentName.value = student.name;
        studentUsername.value = student.username;
        studentClassInput.value = KELAS;
        studentClassInput.disabled = true;
        studentModal.classList.remove('hidden');
    };

    window.deleteStudent = (index) => {
        if (confirm('Yakin hapus siswa ini?')) {
            students.splice(index, 1);
            localStorage.setItem('students', JSON.stringify(students));
            loadStudents();
            loadStudentStatus();
        }
    };

    saveStudentBtn.addEventListener('click', () => {
        const name = studentName.value.trim();
        const username = studentUsername.value.trim();
        const classValue = KELAS;
        if (!name || !username) {
            alert('Nama dan username harus diisi!');
            return;
        }
        if (editingStudentIndex !== null) {
            students[editingStudentIndex] = { name, username, class: classValue };
        } else {
            students.push({ name, username, class: classValue });
        }
        localStorage.setItem('students', JSON.stringify(students));
        studentModal.classList.add('hidden');
        loadStudents();
        loadStudentStatus();
    });

    closeModal.addEventListener('click', () => {
        studentModal.classList.add('hidden');
    });

    // --- NOTIFIKASI ---
    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }

    function setReminder() {
        const now = new Date();
        const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 30, 0); // Jam 7:30 pagi
        if (now > reminderTime) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }
        const timeUntilReminder = reminderTime - now;
        setTimeout(() => {
            if (Notification.permission === 'granted') {
                new Notification('Pengingat Kehadiran', {
                    body: 'Jangan lupa untuk melakukan kehadiran hari ini!',
                    icon: '' // Bisa diisi URL ikon
                });
            }
            setReminder();
        }, timeUntilReminder);
    }

    // Inisialisasi awal
    loadStudents();
});
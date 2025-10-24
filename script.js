// !! แทนที่ด้วย URL ของคุณที่ได้จาก Apps Script !!
const GAS_URL = "https://script.google.com/macros/s/AKfycbzQvvN9ePgaaRjLEi6XgMCXXYjMlBbzeIg83KIy7FnujfGM8YXQb7kDpRA-tGG3ya5V/exec"; 

// --- องค์ประกอบหน้าหลัก ---
const totalAmountEl = document.getElementById('total-amount');
const transferListEl = document.getElementById('transfer-list');
const loadingEl = document.getElementById('loading');
const uploadForm = document.getElementById('upload-form');

// --- องค์ประกอบ Modal 1: โอนเงิน ---
const transferModal = document.getElementById('transfer-modal');
const openModalBtn = document.getElementById('open-transfer-modal');
const closeModalBtn = document.querySelector('.close');

// --- องค์ประกอบ Modal 2: แจ้งเตือน (Alert) ---
const alertModalOverlay = document.getElementById('alert-modal-overlay');
const alertModalContent = document.getElementById('alert-modal-content');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const alertOkBtn = document.getElementById('alert-ok-btn');

// --- องค์ประกอบ Modal 3: แสดงสลิป ---
const slipModalOverlay = document.getElementById('slip-modal-overlay');
const slipModalImage = document.getElementById('slip-modal-image');
const slipModalCloseBtn = document.getElementById('slip-modal-close-btn');

// --- ฟังก์ชันสำหรับแสดง Modal แจ้งเตือน (แทน alert) ---
function showAlert(message, type = 'info') { // type: 'success', 'error', 'info'
    alertMessage.textContent = message;
    alertModalContent.classList.remove('success', 'error');

    if (type === 'success') {
        alertTitle.textContent = "สำเร็จ!";
        alertModalContent.classList.add('success');
    } else if (type === 'error') {
        alertTitle.textContent = "เกิดข้อผิดพลาด";
        alertModalContent.classList.add('error');
    } else {
        alertTitle.textContent = "แจ้งเตือน";
    }
    alertModalOverlay.style.display = 'flex';
}

// --- ฟังก์ชันแปลงลิงก์ Google Drive (สำหรับแสดงสลิป) ---
function getDirectDriveUrl(sharingUrl) {
    if (!sharingUrl) return "";
    const match = sharingUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        const fileId = match[1];
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return sharingUrl;
}

// --- ฟังก์ชันสำหรับแสดง Modal สลิป (แทน window.open) ---
function showSlipModal(imageUrl) {
    const directUrl = getDirectDriveUrl(imageUrl);
    slipModalImage.src = ""; // ล้างรูปเก่า
    slipModalImage.alt = "กำลังโหลดรูปภาพ...";
    slipModalImage.src = directUrl; // ตั้งค่า URL ใหม่
    slipModalImage.alt = "Slip Image";
    slipModalOverlay.style.display = 'flex';
}


// 1. โหลดข้อมูลเมื่อเปิดหน้า
window.addEventListener('load', () => {
    fetchTotal();
    fetchList();
});

// 2. ดึงยอดรวม
function fetchTotal() {
    fetch(GAS_URL + "?action=getTotal")
        .then(res => res.json())
        .then(data => {
            totalAmountEl.textContent = parseFloat(data.total).toFixed(2);
        });
}

// 3. ดึงรายการโอน (แก้ไข)
function fetchList() {
    transferListEl.innerHTML = "<p>กำลังโหลด...</p>";
    fetch(GAS_URL + "?action=getList")
        .then(res => res.json())
        .then(data => {
            transferListEl.innerHTML = ""; // Clear
            if (data.length === 0) {
                transferListEl.innerHTML = "<p>ยังไม่มีรายการโอน</p>";
                return;
            }
            data.forEach(item => {
                const date = new Date(item.date).toLocaleString('th-TH');
                const itemEl = document.createElement('div');
                itemEl.className = 'transfer-list-item';
                
                // (แก้ไข) เพิ่มป้ายสถานะ
                let statusText;
                if (item.status === 'Confirmed') statusText = '<span class="status-badge status-Confirmed">ยืนยันแล้ว</span>';
                else if (item.status === 'Rejected') statusText = '<span class="status-badge status-Rejected">ถูกปฏิเสธ</span>';
                else statusText = '<span class="status-badge status-Pending">รอตรวจสอบ</span>';

                // (แก้ไข) เปลี่ยนปุ่ม "ดูสลิป" ให้เรียก Modal
                itemEl.innerHTML = `
                    <span>${date} ${statusText}</span>
                    <button class="btn-slip" onclick="showSlipModal('${item.slip}')">ดูสลิป</button>
                `;
                transferListEl.appendChild(itemEl);
            });
        });
}

// 4. จัดการ Modal
openModalBtn.onclick = () => { transferModal.style.display = "flex"; };
closeModalBtn.onclick = () => { transferModal.style.display = "none"; };
alertOkBtn.onclick = () => { alertModalOverlay.style.display = "none"; };
slipModalCloseBtn.onclick = () => { slipModalOverlay.style.display = "none"; };

window.onclick = (event) => {
    if (event.target == transferModal) {
        transferModal.style.display = "none";
    }
    if (event.target == alertModalOverlay) {
        alertModalOverlay.style.display = "none";
    }
    if (event.target == slipModalOverlay) {
        slipModalOverlay.style.display = "none";
    }
};

// 5. จัดการการอัปโหลดสลิป (แก้ไข)
uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loadingEl.style.display = 'block';

    const amount = document.getElementById('amount').value;
    const file = document.getElementById('slip-upload').files[0];
    
    if (!file || !amount) {
        // (แก้ไข) เปลี่ยนจาก alert()
        showAlert("กรุณากรอกข้อมูลให้ครบ", 'error');
        loadingEl.style.display = 'none';
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const fileData = reader.result;
        const fileInfo = {
            amount: amount,
            fileName: file.name,
            fileType: file.type,
            file: fileData
        };

        // ส่งข้อมูลไปที่ Google Apps Script
        fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify(fileInfo)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // (แก้ไข) เปลี่ยนจาก alert()
                showAlert("อัปโหลดสำเร็จ! รอการตรวจสอบ", 'success');
                transferModal.style.display = 'none';
                uploadForm.reset();
                fetchTotal(); // (เพิ่ม) อัปเดตยอดรวม
                fetchList();  // รีเฟรชรายการ
            } else {
                // (แก้ไข) เปลี่ยนจาก alert()
                showAlert("อัปโหลดไม่สำเร็จ: " + data.message, 'error');
            }
            loadingEl.style.display = 'none';
        })
        .catch(err => {
            // (แก้ไข) เปลี่ยนจาก alert()
            showAlert("เกิดข้อผิดพลาด: " + err, 'error');
            loadingEl.style.display = 'none';
        });
    };
});
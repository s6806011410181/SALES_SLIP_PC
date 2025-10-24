// !! แทนที่ด้วย URL ของคุณ !!
const GAS_URL = "https://script.google.com/macros/s/AKfycbzQvvN9ePgaaRjLEi6XgMCXXYjMlBbzeIg83KIy7FnujfGM8YXQb7kDpRA-tGG3ya5V/exec";
// !! ตั้งรหัสผ่านของคุณที่นี่ (ไม่ปลอดภัย) !!
const ADMIN_PASSWORD = "admin14528"; 

// --- องค์ประกอบ HTML (หน้าแอดมิน) ---
const adminContent = document.getElementById('admin-content');
const adminTableBody = document.getElementById('admin-table-body');

// --- องค์ประกอบ HTML (Modal รหัสผ่าน) ---
const passwordModal = document.getElementById('password-modal-overlay');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('admin-password-input');
const passwordError = document.getElementById('password-error');

// --- องค์ประกอบ HTML (Modal ยืนยัน) ---
const confirmModalOverlay = document.getElementById('confirmation-modal-overlay');
const confirmModalMessage = document.getElementById('confirmation-message');
const confirmBtn = document.getElementById('confirm-action-btn');
const cancelBtn = document.getElementById('cancel-action-btn');

// --- องค์ประกอบ HTML (Modal แจ้งเตือน) ---
const alertModalOverlay = document.getElementById('alert-modal-overlay');
const alertModalContent = document.getElementById('alert-modal-content');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const alertOkBtn = document.getElementById('alert-ok-btn');

// --- องค์ประกอบ HTML (Modal แสดงสลิป) ---
const slipModalOverlay = document.getElementById('slip-modal-overlay');
const slipModalImage = document.getElementById('slip-modal-image');
const slipModalCloseBtn = document.getElementById('slip-modal-close-btn');

// --- ฟังก์ชันสำหรับแสดง Modal แจ้งเตือน ---
function showAdminAlert(message, type = 'info') { 
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

// --- (ใหม่) ฟังก์ชันแปลงลิงก์ Google Drive ---
function getDirectDriveUrl(sharingUrl) {
    if (!sharingUrl) return "";
    
    // ตรวจสอบว่ามี ID หรือไม่ (ป้องกัน error)
    // ลิงก์จะมีหน้าตาประมาณ: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const match = sharingUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);
    
    if (match && match[1]) {
        const fileId = match[1];
        // แปลงเป็นลิงก์ที่ <img> ใช้งานได้
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    
    // ถ้าไม่ตรงฟอร์แมต (อาจจะเป็นลิงก์ตรงอยู่แล้ว หรือมาจากที่อื่น)
    return sharingUrl;
}

// --- ฟังก์ชันสำหรับแสดง Modal สลิป (แก้ไข) ---
function showSlipModal(imageUrl) {
    // (เพิ่ม) เรียกใช้ฟังก์ชันแปลงลิงก์ก่อน
    const directUrl = getDirectDriveUrl(imageUrl);
    
    // ล้างรูปเก่าและแสดงข้อความ "กำลังโหลด"
    slipModalImage.src = ""; 
    slipModalImage.alt = "กำลังโหลดรูปภาพ...";
    
    // ตั้งค่า URL ของรูปภาพที่จะแสดง
    slipModalImage.src = directUrl; 
    slipModalImage.alt = "Slip Image";
    
    slipModalOverlay.style.display = 'flex'; // แสดง Modal
}


// 1. ตรวจสอบรหัสผ่าน
function handleLoginAttempt(event) {
    event.preventDefault(); 
    const pass = passwordInput.value;

    if (pass === ADMIN_PASSWORD) {
        passwordModal.style.display = 'none';  
        adminContent.style.display = 'block'; 
        loadAdminList(); 
    } else {
        passwordError.style.display = 'block'; 
        passwordInput.value = ""; 
        passwordInput.focus(); 
    }
}

// 2. โหลดรายการทั้งหมดสำหรับแอดมิน (เหมือนเดิม)
// (ฟังก์ชัน showSlipModal() จะถูกเรียกจาก HTML ที่สร้างโดย innerHTML)
function loadAdminList() {
    adminTableBody.innerHTML = '<tr><td colspan="5">กำลังโหลด...</td></tr>';
    fetch(GAS_URL + "?action=getAdminList")
        .then(res => res.json())
        .then(data => {
            adminTableBody.innerHTML = ""; // Clear
            data.forEach(item => {
                const date = new Date(item.date).toLocaleString('th-TH');
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${parseFloat(item.amount).toFixed(2)}</td>
                    <td><span class="status-${item.status}">${item.status}</span></td>
                    <td>
                        <button class="btn-slip" onclick="showSlipModal('${item.slip}')">ดูสลิป</button>
                    </td>
                    <td>
                        ${item.status === 'Pending' ? `
                            <button class="btn-confirm" onclick="updateStatus('${item.id}', 'Confirmed')">ยืนยัน</button>
                            <button class="btn-reject" onclick="updateStatus('${item.id}', 'Rejected')">ปฏิเสธ</button>
                        ` : 'จัดการแล้ว'}
                    </td>
                `;
                adminTableBody.appendChild(row);
            });
        });
}

// 3. ฟังก์ชันอัปเดตสถานะ
function updateStatus(id, newStatus) {
    const actionText = newStatus === 'Confirmed' ? 'ยืนยัน' : 'ปฏิเสธ';
    
    confirmModalMessage.innerHTML = `คุณต้องการ <strong>${actionText}</strong> รายการนี้ใช่หรือไม่?`;
    confirmBtn.textContent = actionText;
    
    confirmBtn.className = ''; 
    confirmBtn.classList.add(newStatus === 'Confirmed' ? 'btn-confirm' : 'btn-reject');

    confirmBtn.dataset.id = id;
    confirmBtn.dataset.newStatus = newStatus;

    confirmModalOverlay.style.display = 'flex';
}

// 4. ฟังก์ชันทำงานจริงเมื่อกดยืนยันใน Modal
function executeStatusUpdate() {
    const id = confirmBtn.dataset.id;
    const newStatus = confirmBtn.dataset.newStatus;
    
    confirmModalOverlay.style.display = 'none';

    const url = `${GAS_URL}?action=updateStatus&id=${id}&status=${newStatus}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showAdminAlert("อัปเดตสถานะสำเร็จ!", 'success');
                loadAdminList(); 
            } else {
                showAdminAlert("อัปเดตไม่สำเร็จ: " + data.message, 'error');
            }
        })
        .catch(err => {
            showAdminAlert("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + err, 'error');
        });
}


// --- จุดเริ่มต้นการทำงาน ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. จัดการ Modal รหัสผ่าน
    passwordForm.addEventListener('submit', handleLoginAttempt);
    passwordInput.focus(); 

    // 2. จัดการ Modal ยืนยัน
    cancelBtn.addEventListener('click', () => {
        confirmModalOverlay.style.display = 'none';
    });
    confirmBtn.addEventListener('click', executeStatusUpdate);

    // 3. จัดการ Modal แจ้งเตือน
    alertOkBtn.addEventListener('click', () => {
        alertModalOverlay.style.display = 'none';
    });

    // 4. จัดการ Modal แสดงสลิป
    slipModalCloseBtn.addEventListener('click', () => {
        slipModalOverlay.style.display = 'none';
    });
    slipModalOverlay.addEventListener('click', (event) => {
        if (event.target === slipModalOverlay) {
             slipModalOverlay.style.display = 'none';
        }
    });
});
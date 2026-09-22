import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// BẠN CẦN THAY THẾ ĐOẠN CẤU HÌNH DƯỚI ĐÂY
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBGdw7YMNWQL9cQwjAePrWzrz1qA5NSEYw",
  authDomain: "graduation-guestbook-40d3c.firebaseapp.com",
  projectId: "graduation-guestbook-40d3c",
  storageBucket: "graduation-guestbook-40d3c.firebasestorage.app",
  messagingSenderId: "976131039761",
  appId: "1:976131039761:web:7ee663d6301dbf337487b0",
  measurementId: "G-VVPRR486QR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Personalized Greeting
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('name');
    const greetingEl = document.getElementById('greeting');
    const gbDescEl = document.getElementById('gb-desc');
    
    if (guestName) {
        greetingEl.textContent = `Xin chào, ${guestName}!`;
        if (gbDescEl) gbDescEl.textContent = `${guestName} hãy để lại một vài lời nhắn gửi cho Trang nhé!`;
    } else {
        greetingEl.textContent = `Xin chào, Bạn!`;
    }

    // 2. Guestbook Form Submission
    const form = document.getElementById('guestbook-form');
    const messageInput = document.getElementById('gb-message');
    const messagesList = document.getElementById('messages-list');
    
    // Check if it's admin (Trang) to view messages
    const isAdmin = urlParams.get('admin') === 'trang2026';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = guestName || 'Khách vô danh';
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi...';

        try {
            // Save to Firebase Firestore
            await addDoc(collection(db, "messages"), {
                name: name,
                message: message,
                timestamp: serverTimestamp()
            });

            alert('Cảm ơn bạn! Lời nhắn đã được lưu lại cho Trang.');
            messageInput.value = '';
            
            if (isAdmin) {
                loadMessages(); // refresh list if admin
            }
        } catch (error) {
            console.error('Error:', error);
            if(error.code === 'permission-denied') {
                alert('Không có quyền lưu. Hãy đảm bảo bạn đã tạo Database và mở quyền đọc/ghi trên Firebase.');
            } else if(error.message.includes('API key not valid')) {
                alert('Bạn chưa cài đặt mã cấu hình Firebase. Hãy cập nhật file main.js');
            } else {
                alert('Có lỗi xảy ra khi gửi. Vui lòng thử lại.');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gửi Lời Nhắn';
        }
    });

    // 3. Load messages (Only if admin)
    async function loadMessages() {
        if (!isAdmin) return;
        
        try {
            document.getElementById('loading').style.display = 'block';
            
            const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            
            messagesList.innerHTML = ''; // clear current
            document.getElementById('loading').style.display = 'none';

            if (querySnapshot.empty) {
                messagesList.innerHTML = '<p>Chưa có lời nhắn nào.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const msg = doc.data();
                const dateObj = msg.timestamp ? msg.timestamp.toDate() : new Date();
                const date = dateObj.toLocaleString('vi-VN');
                
                const item = document.createElement('div');
                item.className = 'message-item';
                
                item.innerHTML = `
                    <div class="message-header">
                        <span>${escapeHtml(msg.name)}</span>
                        <span class="message-time">${date}</span>
                    </div>
                    <div class="message-content">
                        ${escapeHtml(msg.message).replace(/\n/g, '<br>')}
                    </div>
                `;
                
                messagesList.appendChild(item);
            });
            
        } catch (error) {
            console.error('Error loading messages:', error);
            document.getElementById('loading').style.display = 'none';
            if(error.message.includes('API key not valid')) {
                messagesList.innerHTML = '<p style="color:red;">Lỗi: Bạn chưa cài đặt mã cấu hình Firebase trong file main.js.</p>';
            } else {
                messagesList.innerHTML = '<p>Lỗi tải danh sách lời nhắn. Có thể do chưa mở quyền database.</p>';
            }
        }
    }

    const adminSection = document.getElementById('admin-section');

    if (isAdmin) {
        adminSection.classList.remove('hidden');
        loadMessages();

        // Link Generator Logic
        const adminGuestName = document.getElementById('admin-guest-name');
        const generateBtn = document.getElementById('admin-generate-btn');
        const linkResult = document.getElementById('admin-link-result');
        
        generateBtn.addEventListener('click', () => {
            const name = adminGuestName.value.trim();
            if (!name) {
                alert('Vui lòng nhập tên người mời!');
                return;
            }
            const link = `${window.location.origin}${window.location.pathname}?name=${encodeURIComponent(name)}`;
            
            navigator.clipboard.writeText(link).then(() => {
                linkResult.innerHTML = `Đã copy link: <a href="${link}" target="_blank">${link}</a>`;
            }).catch(() => {
                linkResult.innerHTML = `Link: <a href="${link}" target="_blank">${link}</a> (Vui lòng bôi đen copy)`;
            });
        });
    } else {
        // Hide messages list for normal users
        messagesList.style.display = 'none';
        const loadingEl = document.getElementById('loading');
        if(loadingEl) loadingEl.style.display = 'none';
    }
});

// Utility to prevent XSS
function escapeHtml(unsafe) {
    if(!unsafe) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

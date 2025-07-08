import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, writeBatch, query, where, addDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';


/**
 * LƯU Ý QUAN TRỌNG:
 * Đây là tệp cấu hình Firebase. Bạn CẦN thay thế các giá trị placeholder 
 * ("YOUR_...") bằng thông tin cấu hình thực tế từ dự án Firebase của bạn.
 * Bạn có thể tìm thấy các thông tin này trong phần cài đặt dự án trên Firebase Console.
 * 
 * Để ứng dụng hoạt động, bạn cũng cần:
 * 1. Kích hoạt Firebase Authentication với phương thức "Email/Password".
 * 2. Tạo tài khoản người dùng, ví dụ:
 *    - admin@test.com (mật khẩu: admin123)
 *    - user@test.com (mật khẩu: password123)
 * 3. Kích hoạt Firestore và thiết lập các quy tắc bảo mật (Security Rules) phù hợp.
 *    Đối với môi trường phát triển, bạn có thể bắt đầu với các quy tắc cho phép đọc/ghi 
 *    khi đã xác thực, nhưng hãy thiết lập các quy tắc chặt chẽ hơn cho môi trường production.
 *    ví dụ:
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /{document=**} {
 *          allow read, write: if request.auth != null;
 *        }
 *      }
 *    }
 */
const firebaseConfig = {
  apiKey: "AIzaSyBy2xA1eqmvzj2k2ws3ef_uwrWBpFzeIRw",
  authDomain: "mindx-cms-61fd1.firebaseapp.com",
  projectId: "mindx-cms-61fd1",
  storageBucket: "mindx-cms-61fd1.firebasestorage.app",
  messagingSenderId: "551206496810",
  appId: "1:551206496810:web:8bb3d75b20e3998e5bb153",
  measurementId: "G-NRMFF88KPK"
};

// Khởi tạo Firebase một cách an toàn để tránh khởi tạo lại
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);


// Xuất các dịch vụ Firebase đã khởi tạo để sử dụng trong ứng dụng
export const db = getFirestore(app);
export const auth = getAuth(app);

// Xuất các hàm và kiểu dữ liệu cần thiết từ SDK
export type { FirebaseUser };
export { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    writeBatch,
    setDoc,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    query, 
    where, 
    addDoc, 
    updateDoc, 
    deleteDoc
};
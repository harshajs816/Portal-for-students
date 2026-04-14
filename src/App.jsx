
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse'; 
import { initializeApp } from "firebase/app";
import { FIXED_STUDENT_LIST } from './studentsData';
// Yahan 'doc' ko import karna zaroori hai 👇
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
// ==========================================
// 1. FIREBASE CONFIGURATION (Yahan apni keys daalein)
// ==========================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA4MbCtDmCZzyYaO8P8oq7VF3js-pfAhBA",
  authDomain: "data-91b7e.firebaseapp.com",
  projectId: "data-91b7e",
  storageBucket: "data-91b7e.firebasestorage.app",
  messagingSenderId: "971847967707",
  appId: "1:971847967707:web:3917aabee4b07efadbfdfe",
  measurementId: "G-RQW8YHW77B"
};

const IMGBB_API_KEY = "08ea1f818d257843ff866cc286cab150"; // ImgBB se mili key yahan daalein
const ADMIN_PIN = "6602"; // Apna pasandida password yahan set karein

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function StudentPortal() {
  
  // --- STATES ---
const [allStudents, setAllStudents] = useState(FIXED_STUDENT_LIST);
  
  const [paidStudents, setPaidStudents] = useState({});
  const [fullName, setFullName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LIVE LISTENER (ID ke saath data fetch karna) ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "fees_submissions"), (snapshot) => {
      const paidData = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name) {
          // Sabse zaroori: doc.id ko object mein save kar rahe hain delete ke liye
          paidData[data.name.toLowerCase().trim()] = { 
            ...data, 
            id: doc.id 
          }; 
        }
      });
      setPaidStudents(paidData);
    });
    return () => unsubscribe();
  }, []);

  // --- SECURED BULK UPLOAD ---
  const handleBulkUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const pin = window.prompt("⚠️ Admin PIN daalein nayi list load karne ke liye:");
      if (pin === ADMIN_PIN) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const formatted = results.data.map((item, index) => ({
              id: index + 1,
              name: (item.name || "").trim(),
              rollNo: (item.rollNo || "").trim()
            }));
            setAllStudents(formatted);
            localStorage.setItem("studentsList", JSON.stringify(formatted));
            alert("✅ Students loaded successfully!");
          },
        });
      } else {
        alert("❌ Galat PIN!");
        event.target.value = ""; 
      }
    }
  };

  // --- SECURED CLEAR ALL (CSV list hatane ke liye) ---
  const clearAllData = () => {
    const pin = window.prompt("⚠️ Dashboard list khali karne ke liye PIN daalein:");
    if (pin === ADMIN_PIN) {
      if (window.confirm("Kya aap sach mein Dashboard list clear karna chahte hain? (Firebase data delete nahi hoga)")) {
        setAllStudents([]);
        localStorage.removeItem("studentsList");
      }
    } else if (pin !== null) alert("❌ Galat PIN!");
  };

 
const deleteSubmission = async (studentName) => {
    const enteredPin = window.prompt(`⚠️ ${studentName} ki entry delete karne ke liye PIN daalein:`);
    
    // Agar user ne "Cancel" dabaya toh enteredPin null hoga, wahi se return ho jao
    if (enteredPin === null) return;

    // Ab check karein ki PIN sahi hai ya nahi
    if (enteredPin == ADMIN_PIN) {
      // ✅ PIN SAHI HAI - Ab delete logic shuru hoga
      try {
        const cleanName = studentName.toLowerCase().trim();
        const submission = paidStudents[cleanName];

        if (submission && submission.id) {
          if (window.confirm(`Kya aap sach mein ${studentName} ka data hatana chahte hain?`)) {
            const docRef = doc(db, "fees_submissions", submission.id); 
            await deleteDoc(docRef);
            alert("✅ Entry Deleted!");
          }
        } else {
          alert("❌ Error: Is entry ki database ID nahi mili.");
        }
      } catch (err) {
        alert("❌ Delete failed: " + err.message);
      }
    } 
    else {
      // ❌ PIN GALAT HAI
      alert("❌ Galat PIN! Entry delete nahi hui.");
    }
  };
  // --- FORM SUBMIT LOGIC ---
  const submitFeeDetails = async (e) => {
    e.preventDefault();
    const cleanInputName = fullName.toLowerCase().trim();

    if (!fullName || !rollNo || !imageFile) {
      alert("⚠️ Saari details bharein aur Photo select karein!");
      return;
    }

    const isNameInList = allStudents.some(s => s.name.toLowerCase().trim() === cleanInputName);
    if (!isNameInList) {
      alert("❌ Aapka naam list mein nahi hai! Sahi naam daalein.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. ImgBB Upload
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();
      
      if (resData.success) {
        // 2. Firestore Save
        await addDoc(collection(db, "fees_submissions"), {
          name: cleanInputName,
          originalName: fullName.trim(),
          rollNo: rollNo.trim(),
          receiptUrl: resData.data.url,
          timestamp: serverTimestamp()
        });
        alert("✅ Fees submitted successfully!");
        setFullName(""); setRollNo(""); setImageFile(null);
        document.getElementById('receipt-input').value = "";
      } else {
        throw new Error("ImgBB upload failed");
      }
    } catch (err) {
      alert("❌ Submission error! Check internet or API key.");
    } finally {
      setIsSubmitting(false);
    }
  };

 return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container-xxl">
        <div className="row g-5">
          
          {/* LEFT: ADMIN & SUBMISSION */}
          <div className="col-lg-5 d-flex flex-column gap-4">
            
            <div className="card border-0 shadow rounded-4">
              <div className="card-body p-5">
                <h2 className="fw-bolder text-dark mb-1">Submit Receipt</h2>
                <p className="text-muted mb-4 small">Kripya apni sahi details aur photo upload karein.</p>
                
                <form onSubmit={submitFeeDetails}>
                  <div className="mb-4">
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Full Name (as per list)" 
                      className="form-control form-control-lg bg-light border-0 px-4 py-3 rounded-3" 
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <input 
                      type="text" 
                      value={rollNo} 
                      onChange={(e) => setRollNo(e.target.value)} 
                      placeholder="Roll Number" 
                      className="form-control form-control-lg bg-light border-0 px-4 py-3 rounded-3" 
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <div className="position-relative border border-2 border-dashed rounded-3 bg-light p-4 text-center">
                      <input 
                        type="file" 
                        id="receipt-input" 
                        accept="image/*" 
                        onChange={(e) => setImageFile(e.target.files[0])} 
                        className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                        style={{ cursor: 'pointer' }}
                        required
                      />
                      <span className="fw-bold text-success d-block mb-1">Select Image File</span>
                      <small className="text-muted d-block">
                        {imageFile ? imageFile.name : "No file selected"}
                      </small>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className={`btn btn-lg w-100 py-3 rounded-3 fw-bold text-white shadow-sm ${isSubmitting ? 'btn-secondary' : 'btn-success'}`}
                  >
                    {isSubmitting ? "UPLOADING..." : "SUBMIT NOW"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE STATUS */}
          <div className="col-lg-7">
            <div className="card border-0 shadow rounded-4 h-100">
              <div className="card-body p-5 d-flex flex-column">
                
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-end mb-4">
                  <div>
                    <h2 className="fw-bolder text-dark mb-0">Live Status</h2>
                    <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                      Real-time database sync
                    </span>
                  </div>
                  <div className="text-end">
                    <h2 className="text-success fw-black mb-0 display-6 fw-bold">
                      {Object.keys(paidStudents || {}).length}
                    </h2>
                    <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                      Paid Students
                    </span>
                  </div>
                </div>

                {/* Table Section */}
                <div className="table-responsive flex-grow-1 border rounded-3">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-uppercase text-muted fw-bold py-3 px-4" style={{ fontSize: '0.75rem' }}>Roll</th>
                        <th className="text-uppercase text-muted fw-bold py-3 px-4" style={{ fontSize: '0.75rem' }}>Student Name</th>
                        <th className="text-uppercase text-muted fw-bold py-3 px-4" style={{ fontSize: '0.75rem' }}>Status</th>
                        <th className="text-uppercase text-muted fw-bold py-3 px-4" style={{ fontSize: '0.75rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="border-top-0">
                      {!allStudents || allStudents.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center p-5 text-muted fst-italic">
                            No students loaded yet.
                          </td>
                        </tr>
                      ) : (
                        allStudents.map((s) => {
                          const data = paidStudents[s.name.toLowerCase().trim()];
                          return (
                            <tr key={s.id}>
                              <td className="text-muted px-4 py-3">{s.rollNo}</td>
                              <td className="fw-bold text-dark px-4 py-3">{s.name}</td>
                              <td className="px-4 py-3">
                                {data ? (
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill text-uppercase">
                                    Paid
                                  </span>
                                ) : (
                                  <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-3 py-2 rounded-pill text-uppercase">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {data ? (
                                  <div className="d-flex align-items-center gap-3">
                                    <a href={data.receiptUrl} target="_blank" rel="noreferrer" className="text-primary text-decoration-none fw-bold small text-uppercase">
                                      Receipt
                                    </a>
                                    <button 
                                      onClick={() => deleteSubmission(s.name)} 
                                      className="btn btn-link text-danger p-0"
                                      title="Delete"
                                    >
                                      {/* SVG Delete Icon */}
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

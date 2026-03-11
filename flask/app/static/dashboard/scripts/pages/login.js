import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { showDashboardAlert } from "../alert.js";
            
const firebaseConfig = {
    apiKey: "AIzaSyAp5Ct2eXlUQZbS9rENOEuL4LhSlSVQQ4Q",
    authDomain: "topstyle-28cb7.firebaseapp.com",
    projectId: "topstyle-28cb7",
    storageBucket: "topstyle-28cb7.firebasestorage.app",
    messagingSenderId: "36365301413",
    appId: "1:36365301413:web:0ef7fc87074600056f7f4c",
    measurementId: "G-FWJJ6YP94T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember").checked;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        const response = await fetch("/dashboard/login-session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ idToken, remember })
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            showDashboardAlert(responseData.message || responseData.error || "Login failed.");
            return;
        }

        window.location.href = "/dashboard";

    } catch (error) {
        try {
            const fallbackResponse = await fetch("/dashboard/login-fallback", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const fallbackData = await fallbackResponse.json().catch(() => ({}));
            showDashboardAlert(fallbackData.message || fallbackData.error || "Login failed.");
        } catch (fallbackError) {
            showDashboardAlert("Login failed.");
        }
    }
})
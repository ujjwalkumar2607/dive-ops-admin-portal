// src/components/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DiveOpsLogo from "../assets/Dive_Ops_Logo.png";
import coverImg from "../assets/cover-bg.png";
import { saveAuthToken } from "../services/authService";

export default function Login() {
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        const { data } = await axios.post("/api/login", form);
        saveAuthToken(data.token);

        navigate("/"); // ← go to the cover screen
        } catch (err) {
            console.error("Login failed:", err);
            alert("Invalid username or password");
    }
    };

return (
  <div
    className="h-screen w-full bg-cover bg-center flex flex-col items-center"
    style={{ backgroundImage: `url(${coverImg})` }}
  >
    <div className="w-full flex flex-col items-center">
      <img src={DiveOpsLogo} alt="Dive Ops Logo" className="w-64  " />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm md:max-w-lg bg-white p-6 rounded shadow"
      >
        <h2 className="text-2xl font-semibold text-center mb-6">Sign In</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
            className="w-full border rounded px-3 py-2 focus:ring focus:outline-none"
            required
          />
        </div>
        <div className="mb-6 relative">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            className="w-full border rounded px-3 py-2 pr-10 focus:ring focus:outline-none"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-600"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 mt-4"
        >
          Log In
        </button>
      </form>
    </div>
  </div>
);
}

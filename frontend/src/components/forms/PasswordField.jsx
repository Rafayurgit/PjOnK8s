import React from "react";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function PasswordField({
  label = "Password",
  value,
  onChange,
  name,
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          name={name}
          type={show ? "text" : "password"}
          onChange={onChange}
          value={value}
          required
          className="Input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2B55] transition"
          placeholder="Enter Password"
        />
        <button
          type="button"
          aria-label="Toggle password visibility"
          onClick={() => setShow((prev) => !prev)}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import Icon from "./Icon.jsx";

// Password field with a show/hide (eye) button.
export default function PasswordInput({ className = "", ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`input pr-11 ${className}`} />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-brand-dark">
        <Icon name={show ? "eyeoff" : "eye"} size={19} />
      </button>
    </div>
  );
}

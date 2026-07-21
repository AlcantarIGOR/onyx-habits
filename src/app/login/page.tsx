"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const controls = useAnimation();

  useEffect(() => {
    // Submit PIN automatically when 4 digits are entered
    if (pin.length === 4) {
      handleLogin(pin);
    }
  }, [pin]);

  const handleLogin = async (enteredPin: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: enteredPin }),
      });

      if (res.ok) {
        // Redirect to dashboard
        router.push("/");
        router.refresh();
      } else {
        // Shake animation
        setError(true);
        setPin("");
        controls.start({
          x: [-10, 10, -10, 10, 0],
          transition: { duration: 0.4 },
        });
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4 && !loading) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !loading) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-foreground">
      <div className="w-full max-w-sm flex flex-col items-center space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-card-dark border border-border-dark/50 flex items-center justify-center text-primary">
            <Lock className="w-5 h-5 text-primary/70" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Mi Espacio</h1>
          <p className="text-xs text-text-muted">Introduce tu PIN de acceso</p>
        </div>

        {/* PIN Indicators */}
        <motion.div animate={controls} className="flex gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                index < pin.length
                  ? "bg-primary border-primary"
                  : error
                  ? "border-accent-rose bg-accent-rose/10"
                  : "border-border-dark/60 bg-transparent"
              }`}
            />
          ))}
        </motion.div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[260px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={loading}
              className="w-16 h-16 rounded-full bg-card-dark/40 hover:bg-card-dark/80 border border-border-dark/30 flex items-center justify-center text-lg font-medium transition active:scale-95 cursor-pointer select-none"
            >
              {num}
            </button>
          ))}
          <div /> {/* empty spacer */}
          <button
            onClick={() => handleKeyPress("0")}
            disabled={loading}
            className="w-16 h-16 rounded-full bg-card-dark/40 hover:bg-card-dark/80 border border-border-dark/30 flex items-center justify-center text-lg font-medium transition active:scale-95 cursor-pointer select-none"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={loading}
            className="w-16 h-16 rounded-full flex items-center justify-center text-xs font-mono text-text-muted hover:text-foreground transition active:scale-95 cursor-pointer select-none"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}

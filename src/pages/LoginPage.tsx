import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Import the Logo component
import { Logo } from "../components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { verifyEmail, login } = useAuth();

  const handleEmailVerification = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    if (verifying) return;

    try {
      setVerifying(true);
      const isValid = await verifyEmail(email);
      if (isValid) {
        setIsEmailVerified(true);
        toast.success("Email verified successfully!");
      } else {
        toast.error(
          <div>
            You don't have access. Contact{" "}
            <a href="mailto:Swami.cs@Bigbasket.com" className="underline">
              Swami.cs@Bigbasket.com
            </a>
          </div>
        );
      }
    } catch (error) {
      toast.error("Error verifying email");
    } finally {
      setVerifying(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      toast.error("The password you entered is incorrect");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!isEmailVerified) {
        handleEmailVerification();
      } else {
        handleLogin(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F67A2C] flex flex-col items-center justify-center p-4 relative">
      {/* Logo */}
      <div className="absolute top-8 left-8">
        {/* Replace static image with Logo component */}
        <Logo className="w-48 h-auto" />
      </div>

      {/* Lets Audit Text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 w-full"
      >
        <h1 className="text-5xl font-extrabold text-white tracking-tight text-left">
          Lets Audit.
        </h1>
      </motion.div>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-lg p-10 space-y-8"
      >
        <form
          onSubmit={!isEmailVerified ? handleEmailVerification : handleLogin}
          className="space-y-6"
        >
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isEmailVerified}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#F67A2C] focus:border-transparent transition-all pl-10"
                placeholder="Enter your email"
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {!isEmailVerified && (
            <motion.button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#F67A2C] text-white py-3 rounded-lg hover:bg-[#F67A2C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={verifying}
            >
              {verifying ? "Verifying..." : "Verify Email ID"}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}

          {isEmailVerified && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-6"
            >
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#F67A2C] focus:border-transparent transition-all pl-10"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <motion.button
                type="submit"
                className="w-full bg-[#F67A2C] text-white py-3 rounded-lg hover:bg-[#F67A2C]/90 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Login
              </motion.button>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}

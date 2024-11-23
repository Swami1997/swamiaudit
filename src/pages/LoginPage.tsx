import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Process Audit Tool
          </h1>
        </motion.div>

        <form
          onSubmit={!isEmailVerified ? handleEmailVerification : handleLogin}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isEmailVerified}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-10"
                placeholder="Enter your email"
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {!isEmailVerified && (
            <motion.button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-10"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <motion.button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
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

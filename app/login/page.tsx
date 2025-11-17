"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaLock, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import Image from "next/image";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect to dashboard after successful login
            router.push("/dashboard");
        } catch (err: any) {
            setError("Invalid email or password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-black">Sign In</h1>
                </div>

                <div className="flex justify-center mb-4">
                        <Image 
                            src="/dcash.png" 
                            alt="DCash" 
                            width={240} 
                            height={240}
                            className=""
                        />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-500/20 border border-red-500 rounded text-red-100 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full pl-10 pr-4 py-3 bg-gray-100/50 text-white border border-gray-700 rounded-4xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-gray-300 text-sm font-medium">
                                Password
                            </label>
                            <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-gray-100/50 text-white border border-gray-700 rounded-4xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Remember Me & Sign In Button */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800/50"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                                Remember me
                            </label>
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-4xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>

            

                {/* Sign Up Link */}
                <div className="text-center mt-6">
                    <p className="text-gray-400 text-sm">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center">
                            <FaUserPlus className="mr-1" /> Sign up now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

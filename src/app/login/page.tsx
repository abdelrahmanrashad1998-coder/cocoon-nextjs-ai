"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        displayName: "",
    });
    const router = useRouter();
    const { signIn, signUp } = useAuth();

    const toggleMode = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsLogin(!isLogin);
            setIsAnimating(false);
        }, 150);
    };

    const validatePasswords = () => {
        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validate passwords match for signup
        if (!validatePasswords()) {
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                // Sign in
                await signIn(formData.email, formData.password);
                router.push("/dashboard");
            } else {
                // Sign up
                await signUp(
                    formData.email,
                    formData.password,
                    formData.displayName
                );
                router.push("/dashboard");
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-card flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-card border-2 border-[#A72036] shadow-2xl shadow-red-50">
                <CardHeader className="text-center pb-8">
                    <div className="text-5xl font-bold text-[#A72036] mb-12 mt-8 tracking-wide flex items-center justify-center">
                        <Image
                            className="h-[180px]"
                            alt="Cocoon Logo"
                            src="/images/logo.jpg"
                            width={180}
                            height={180}
                            priority
                        />
                    </div>
                    <div className="w-16 h-1 bg-[#A72036] mx-auto "></div>
                    <CardTitle
                        className={`text-2xl text-foreground font-semibold transition-all duration-300 ease-in-out ${
                            isAnimating
                                ? "opacity-0 transform scale-95"
                                : "opacity-100 transform scale-100"
                        }`}
                    >
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </CardTitle>
                    <CardDescription
                        className={`text-muted-foreground mt-2 transition-all duration-300 ease-in-out ${
                            isAnimating
                                ? "opacity-0 transform scale-95"
                                : "opacity-100 transform scale-100"
                        }`}
                    >
                        {isLogin
                            ? "Sign in to your account"
                            : "Sign up for a new account"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div
                            className={`space-y-2 transition-all duration-300 ease-in-out overflow-hidden ${
                                isLogin
                                    ? "max-h-0 opacity-0 transform -translate-y-2"
                                    : "max-h-20 opacity-100 transform translate-y-0"
                            }`}
                        >
                            <Label
                                htmlFor="displayName"
                                className="text-muted-foreground font-medium"
                            >
                                Display Name
                            </Label>
                            <Input
                                id="displayName"
                                value={formData.displayName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        displayName: e.target.value,
                                    })
                                }
                                required={!isLogin}
                                className="border-border focus:border-primary h-12 bg-card"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-muted-foreground font-medium"
                            >
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value,
                                    })
                                }
                                required
                                className="border-border focus:border-primary h-12 bg-card"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="password"
                                className="text-muted-foreground font-medium"
                            >
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                                required
                                className="border-border focus:border-primary h-12 bg-card"
                            />
                        </div>
                        <div
                            className={`space-y-2 transition-all duration-300 ease-in-out overflow-hidden ${
                                isLogin
                                    ? "max-h-0 opacity-0 transform -translate-y-2"
                                    : "max-h-20 opacity-100 transform translate-y-0"
                            }`}
                        >
                            <Label
                                htmlFor="confirmPassword"
                                className="text-muted-foreground font-medium"
                            >
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        confirmPassword: e.target.value,
                                    })
                                }
                                required={!isLogin}
                                className="border-border focus:border-primary h-12 bg-card"
                            />
                        </div>
                        {error && (
                            <div className="bg-destructive/5 border-destructive/20 text-primary text-sm text-center py-3 px-4 rounded-md">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:cursor-pointer"
                            disabled={loading}
                        >
                            <span
                                className={`transition-all duration-300 ease-in-out ${
                                    isAnimating
                                        ? "opacity-0 transform scale-95"
                                        : "opacity-100 transform scale-100"
                                }`}
                            >
                                {loading
                                    ? "Please wait..."
                                    : isLogin
                                    ? "Sign In"
                                    : "Sign Up"}
                            </span>
                        </Button>
                    </form>
                    <div className="text-center mt-6 pt-6 border-t border-border">
                        <div
                            className={`transition-all duration-300 ease-in-out ${
                                isAnimating
                                    ? "opacity-0 transform scale-95"
                                    : "opacity-100 transform scale-100"
                            }`}
                        >
                            {isLogin ? (
                                <span>
                                    Need an account?{" "}
                                    <button
                                        type="button"
                                        onClick={toggleMode}
                                        className="hover:underline text-sm font-medium transition-colors duration-200 hover:cursor-pointer"
                                    >
                                        <span className="text-[#A72036] hover:text-[#A72036]">
                                            Sign up
                                        </span>
                                    </button>
                                </span>
                            ) : (
                                <span>
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={toggleMode}
                                        className="hover:underline text-sm font-medium transition-colors duration-200 hover:cursor-pointer"
                                    >
                                        <span className="text-[#A72036] hover:text-[#A72036]">
                                            Sign in
                                        </span>
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

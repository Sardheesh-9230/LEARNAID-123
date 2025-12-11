'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaArrowRight, FaRocket, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa'
import Scene from '../3d/Scene'

export default function ModernHero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 to-indigo-900 text-white">
            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
                <Scene />
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900 z-0 pointer-events-none" />

            {/* Content */}
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-6"
                    >
                        <span className="px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium backdrop-blur-sm">
                            Next-Gen Academic Management
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400"
                    >
                        LearnAid <span className="text-indigo-500">RealOne</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl leading-relaxed"
                    >
                        Empowering institutions with intelligent tools for seamless administration,
                        advanced analytics, and enhanced learning experiences.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <Link
                            href="/login"
                            className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2 group"
                        >
                            Get Started <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="#features"
                            className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg backdrop-blur-sm border border-white/10 transition-all hover:scale-105"
                        >
                            Explore Features
                        </Link>
                    </motion.div>

                    {/* Stats / Features Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl"
                    >
                        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 mx-auto text-blue-400">
                                <FaRocket size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Fast & Efficient</h3>
                            <p className="text-gray-400 text-sm">Streamlined workflows for rapid administrative tasks.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 mx-auto text-purple-400">
                                <FaChalkboardTeacher size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Faculty Focused</h3>
                            <p className="text-gray-400 text-sm">Tools designed to empower educators and simplify grading.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 mx-auto text-green-400">
                                <FaUserGraduate size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Student Success</h3>
                            <p className="text-gray-400 text-sm">Comprehensive tracking to ensure every student thrives.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

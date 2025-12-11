'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

function Shape({ position, rotation, scale, color, geometry }: any) {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (!meshRef.current) return
        const time = state.clock.getElapsedTime()
        meshRef.current.rotation.x = rotation[0] + Math.sin(time * 0.2) * 0.2
        meshRef.current.rotation.y = rotation[1] + Math.cos(time * 0.2) * 0.2
    })

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={meshRef} position={position} scale={scale}>
                {geometry === 'box' && <boxGeometry args={[1, 1, 1]} />}
                {geometry === 'sphere' && <sphereGeometry args={[0.7, 32, 32]} />}
                {geometry === 'torus' && <torusGeometry args={[0.6, 0.2, 16, 32]} />}
                {geometry === 'octahedron' && <octahedronGeometry args={[0.8]} />}
                <meshStandardMaterial
                    color={color}
                    roughness={0.3}
                    metalness={0.8}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
            </mesh>
        </Float>
    )
}

export default function FloatingShapes() {
    return (
        <group>
            <Shape
                position={[-4, 2, -5]}
                rotation={[0, 0, 0]}
                scale={[1.5, 1.5, 1.5]}
                color="#4f46e5"
                geometry="box"
            />
            <Shape
                position={[4, -2, -3]}
                rotation={[0.5, 0.5, 0]}
                scale={[1.2, 1.2, 1.2]}
                color="#ec4899"
                geometry="torus"
            />
            <Shape
                position={[-3, -3, -6]}
                rotation={[0, 0.5, 0]}
                scale={[1, 1, 1]}
                color="#06b6d4"
                geometry="octahedron"
            />
            <Shape
                position={[5, 3, -8]}
                rotation={[0.5, 0, 0]}
                scale={[2, 2, 2]}
                color="#8b5cf6"
                geometry="sphere"
            />
            <Shape
                position={[0, 0, -10]}
                rotation={[0, 0, 0]}
                scale={[0.5, 0.5, 0.5]}
                color="#10b981"
                geometry="box"
            />
        </group>
    )
}

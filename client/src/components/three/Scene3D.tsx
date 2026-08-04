import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useDeviceTier } from '../../hooks/useDeviceTier';
import { useSceneColors, type SceneColors } from './useSceneColors';

export type SceneVariant =
  | 'orbital'
  | 'crystal'
  | 'helix'
  | 'core'
  | 'spheregrid'
  | 'shards'
  | 'waveform'
  | 'holoring'
  | 'papers'
  | 'podium'
  | 'terrain'
  | 'vault';

interface Scene3DProps {
  variant: SceneVariant;
  className?: string;
  intensity?: number;
  interactive?: boolean;
  disabled?: boolean;
  data?: { xpRatio?: number; streak?: number; progress?: number; top3?: number[]; amplitude?: number; isActive?: boolean };
  children?: React.ReactNode;
}

const Particles = ({ color, count = 800, radius = 6, size = 0.018 }: { color: string; count?: number; radius?: number; size?: number }) => {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * radius * 2;
      arr[i * 3 + 1] = (Math.random() - 0.5) * radius * 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
    }
    return arr;
  }, [count, radius]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

function OrbitalScene({ colors, intensity }: { colors: SceneColors; intensity: number }) {
  const group = useRef<THREE.Group>(null);
  const ring1 = useRef<THREE.Group>(null);
  const ring2 = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.1 * intensity;
    }
    if (ring1.current) ring1.current.rotation.y += delta * 0.3;
    if (ring2.current) ring2.current.rotation.y -= delta * 0.2;
  });

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Icosahedron args={[1.2, 1]}>
          <meshStandardMaterial
            color={colors.violet}
            wireframe
            transparent
            opacity={0.35}
            emissive={colors.violet}
            emissiveIntensity={0.3}
          />
        </Icosahedron>
      </Float>

      <group ref={ring1}>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 2.8, 0, Math.sin(angle) * 2.8]}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshStandardMaterial color={colors.cyan} emissive={colors.cyan} emissiveIntensity={0.5} />
            </mesh>
          );
        })}
      </group>

      <group ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 3.6, Math.sin(angle) * 3.6, 0]}>
              <boxGeometry args={[0.09, 0.09, 0.09]} />
              <meshStandardMaterial color={colors.violet} emissive={colors.violet} emissiveIntensity={0.5} />
            </mesh>
          );
        })}
      </group>

      <Particles color={colors.accent} count={500} radius={5} size={0.03} />
    </group>
  );
}

function CrystalScene({ colors }: { colors: SceneColors }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.15;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={group}>
      <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
        <Icosahedron args={[1.4, 1]}>
          <meshStandardMaterial
            color={colors.cyan}
            wireframe
            transparent
            opacity={0.4}
            emissive={colors.cyan}
            emissiveIntensity={0.4}
          />
        </Icosahedron>
      </Float>
      <mesh>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshStandardMaterial
          color={colors.violet}
          transparent
          opacity={0.08}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <Particles color={colors.accent} count={300} radius={4} size={0.02} />
    </group>
  );
}

function HelixScene({ colors, progress = 0 }: { colors: SceneColors; progress?: number }) {
  const group = useRef<THREE.Group>(null);
  const turns = 4;
  const particlesPerTurn = 12;
  const total = turns * particlesPerTurn;
  const activeCount = Math.max(2, Math.floor(total * progress));

  const positions = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < total; i++) {
      const t = i / total;
      const angle = t * Math.PI * 2 * turns;
      const radius = 1.2;
      arr.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        (t - 0.5) * 4,
        Math.sin(angle) * radius
      ));
    }
    return arr;
  }, [total, turns]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={group}>
      {positions.slice(0, activeCount).map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? colors.violet : colors.cyan}
            emissive={i % 2 === 0 ? colors.violet : colors.cyan}
            emissiveIntensity={0.6}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      <Particles color={colors.accent} count={200} radius={3} size={0.02} />
    </group>
  );
}

function CoreScene({ colors, xpRatio, streak }: { colors: SceneColors; xpRatio: number; streak: number }) {
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);

  const intensity = 0.4 + xpRatio * 0.6;

  useFrame((state, delta) => {
    if (core.current) {
      core.current.rotation.x += delta * 0.4;
      core.current.rotation.y += delta * 0.3;
      const scale = 0.9 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      core.current.scale.set(scale, scale, scale);
    }
    if (ring.current) ring.current.rotation.z += delta * 0.5;
  });

  return (
    <group>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial
          color={colors.violet}
          emissive={colors.violet}
          emissiveIntensity={intensity * 1.5}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
      <group ref={ring} rotation={[Math.PI / 2.5, 0, 0]}>
        <mesh>
          <torusGeometry args={[1.8, 0.05, 16, 100]} />
          <meshStandardMaterial
            color={colors.cyan}
            emissive={colors.cyan}
            emissiveIntensity={0.8 * intensity}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
      {streak > 0 && Array.from({ length: Math.min(streak, 6) }).map((_, i) => (
        <Float key={i} speed={1 + i * 0.2} rotationIntensity={0.4} floatIntensity={1}>
          <mesh position={[Math.cos((i / 6) * Math.PI * 2) * 2.6, Math.sin((i / 6) * Math.PI * 2) * 2.6, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={colors.amber} emissive={colors.amber} emissiveIntensity={0.8} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function SphereGridScene({ colors }: { colors: SceneColors }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={group}>
      {Array.from({ length: 5 }).map((_, i) =>
        Array.from({ length: 5 }).map((_, j) => {
          const x = (i - 2) * 1.1;
          const y = (j - 2) * 1.1;
          const dist = Math.sqrt(x * x + y * y);
          return (
            <Float key={`${i}-${j}`} speed={1.5} rotationIntensity={0.3} floatIntensity={dist * 0.3}>
              <mesh position={[x, y, 0]}>
                <sphereGeometry args={[0.35, 20, 20]} />
                <meshStandardMaterial
                  color={(i + j) % 2 === 0 ? colors.violet : colors.cyan}
                  emissive={(i + j) % 2 === 0 ? colors.violet : colors.cyan}
                  emissiveIntensity={0.4}
                  roughness={0.3}
                  metalness={0.5}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </Float>
          );
        })
      )}
    </group>
  );
}

function ShardsScene({ colors }: { colors: SceneColors }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={group}>
      {Array.from({ length: 30 }).map((_, i) => (
        <Float key={i} speed={0.5 + (i % 5) * 0.2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh
            position={[(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3]}
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
          >
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? colors.violet : colors.cyan}
              emissive={i % 3 === 0 ? colors.violet : colors.cyan}
              emissiveIntensity={0.6}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function WaveformScene({ colors, amplitude = 0, isActive = false }: { colors: SceneColors; amplitude?: number; isActive?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const ringsRef = useRef<Array<THREE.Mesh>>([]);

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.2;
    const t = state.clock.elapsedTime;
    ringsRef.current.forEach((ring, i) => {
      const base = 0.4 + i * 0.35;
      const pulse = isActive ? amplitude * 0.5 : 0;
      const target = base + pulse + Math.sin(t * 1.5 + i) * 0.08;
      ring.scale.set(target, target, 1);
      const mat = ring.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.35 - i * 0.04 + (isActive ? 0.15 : 0);
    });
  });

  return (
    <group ref={group}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) ringsRef.current[i] = el; }}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[1, 0.02, 8, 100]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? colors.cyan : colors.violet}
            emissive={i % 2 === 0 ? colors.cyan : colors.violet}
            emissiveIntensity={0.6}
            transparent
            opacity={0.3}
            wireframe={false}
          />
        </mesh>
      ))}
      <Sphere args={[0.3, 24, 24]}>
        <meshStandardMaterial color={colors.violet} emissive={colors.violet} emissiveIntensity={0.8} />
      </Sphere>
    </group>
  );
}

function HoloRingScene({ colors, isActive = false }: { colors: SceneColors; isActive?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const outerRing = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.3;
    }
    if (outerRing.current) {
      const target = 1 + (isActive ? 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.05 : 0);
      outerRing.current.scale.set(target, target, target);
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial
          color={colors.violet}
          emissive={colors.violet}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh ref={outerRing}>
        <torusGeometry args={[1.4, 0.04, 16, 100]} />
        <meshStandardMaterial color={colors.cyan} emissive={colors.cyan} emissiveIntensity={0.7} transparent opacity={0.7} />
      </mesh>
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} rotation={[i * (Math.PI / 3) + Math.PI / 6, 0, 0]}>
          <torusGeometry args={[1.2, 0.015, 8, 80]} />
          <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.4} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function PapersScene({ colors }: { colors: SceneColors }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.15;
    }
  });

  const papers = [
    { pos: [0, 0, 0] as const, rot: [0.1, 0.1, 0] as const, color: '#ffffff' },
    { pos: [0.5, 0.4, 0.3] as const, rot: [-0.2, 0.3, 0.1] as const, color: '#e2e8f0' },
    { pos: [-0.5, 0.2, -0.2] as const, rot: [0.3, -0.2, 0] as const, color: '#f1f5f9' },
  ];

  return (
    <group ref={group}>
      {papers.map((p, i) => (
        <Float key={i} speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
          <mesh position={p.pos} rotation={p.rot}>
            <boxGeometry args={[1.6, 2.2, 0.04]} />
            <meshStandardMaterial color={p.color} roughness={0.6} metalness={0.1} transparent opacity={0.9} />
          </mesh>
        </Float>
      ))}
      <Particles color={colors.accent} count={250} radius={4} size={0.02} />
    </group>
  );
}

function PodiumScene({ colors, top3 = [75, 55, 35] }: { colors: SceneColors; top3?: number[] }) {
  const barsRef = useRef<Array<THREE.Mesh>>([]);

  useFrame(() => {
    barsRef.current.forEach((bar, i) => {
      if (bar) {
        const target = 0.3 + (top3[i] / 100) * 2.5;
        bar.scale.y += (target - bar.scale.y) * 0.06;
      }
    });
  });

  const heights = top3.map((v) => 0.3 + (v / 100) * 2.5);

  return (
    <group position={[0, -1, 0]}>
      {heights.map((h, i) => (
        <mesh
          key={i}
          position={[(i - 1) * 1.3, h / 2, 0]}
          ref={(el) => { if (el) barsRef.current[i] = el; }}
        >
          <boxGeometry args={[0.9, 1, 0.9]} />
          <meshStandardMaterial
            color={i === 0 ? colors.amber : i === 1 ? colors.accent : colors.cyan}
            emissive={i === 0 ? colors.amber : i === 1 ? colors.accent : colors.cyan}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[4, 0.1, 3]} />
        <meshStandardMaterial color={colors.violet} emissive={colors.violet} emissiveIntensity={0.2} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function TerrainScene({ colors, heightData = [] }: { colors: SceneColors; heightData?: number[] }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.08;
  });

  const defaultHeights = Array.from({ length: 64 }, () => 0.3 + Math.random() * 0.7);
  const heights = heightData.length ? heightData : defaultHeights;

  return (
    <group ref={group} position={[0, -1.5, 0]}>
      {Array.from({ length: 8 }).map((_, i) =>
        Array.from({ length: 8 }).map((__, j) => {
          const idx = i * 8 + j;
          const h = heights[idx % heights.length] * 1.5;
          return (
            <mesh key={`${i}-${j}`} position={[(i - 3.5) * 0.8, h / 2, (j - 3.5) * 0.8]}>
              <boxGeometry args={[0.7, 1, 0.7]} />
              <meshStandardMaterial
                color={(i + j) % 2 === 0 ? colors.violet : colors.cyan}
                emissive={(i + j) % 2 === 0 ? colors.violet : colors.cyan}
                emissiveIntensity={0.35}
                transparent
                opacity={0.7}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function VaultScene({ colors }: { colors: SceneColors }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
    }
  });

  return (
    <group ref={group}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Float key={i} speed={1 + i * 0.15} rotationIntensity={0.3} floatIntensity={0.4}>
          <mesh
            position={[(i - 1.5) * 1.4, 0, 0]}
            rotation={[0.1 * i, 0.2 * i, 0]}
          >
            <boxGeometry args={[0.9, 0.6, 0.06]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? colors.violet : colors.cyan}
              emissive={i % 2 === 0 ? colors.violet : colors.cyan}
              emissiveIntensity={0.4}
              transparent
              opacity={0.8}
            />
          </mesh>
        </Float>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.04, 16, 100]} />
        <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export function Scene3D({
  variant,
  className = '',
  intensity = 1,
  interactive = true,
  disabled,
  data,
  children,
}: Scene3DProps) {
  const { tier, prefersReducedMotion } = useDeviceTier();
  const colors = useSceneColors();

  const shouldRender = !disabled && tier !== 'low' && !prefersReducedMotion;

  const renderScene = () => {
    switch (variant) {
      case 'orbital': return <OrbitalScene colors={colors} intensity={intensity} />;
      case 'crystal': return <CrystalScene colors={colors} />;
      case 'helix': return <HelixScene colors={colors} progress={data?.progress ?? 0} />;
      case 'core': return <CoreScene colors={colors} xpRatio={data?.xpRatio ?? 0.5} streak={data?.streak ?? 0} />;
      case 'spheregrid': return <SphereGridScene colors={colors} />;
      case 'shards': return <ShardsScene colors={colors} />;
      case 'waveform': return <WaveformScene colors={colors} amplitude={data?.amplitude ?? 0} isActive={data?.isActive ?? false} />;
      case 'holoring': return <HoloRingScene colors={colors} isActive={data?.isActive ?? false} />;
      case 'papers': return <PapersScene colors={colors} />;
      case 'podium': return <PodiumScene colors={colors} top3={data?.top3 ?? [75, 55, 35]} />;
      case 'terrain': return <TerrainScene colors={colors} />;
      case 'vault': return <VaultScene colors={colors} />;
      default: return <OrbitalScene colors={colors} intensity={intensity} />;
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`relative ${className}`}
      style={{ touchAction: interactive ? 'pan-y' : 'none' }}
    >
      <Canvas
        dpr={[1, tier === 'high' ? 2 : 1.5]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: tier === 'high', alpha: true, powerPreference: 'high-performance' }}
        frameloop={tier === 'high' ? 'always' : 'demand'}
        className="w-full h-full"
        aria-label={`${variant} 3D scene`}
      >
        <color attach="background" args={['transparent']} />
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color={colors.cyan} />
        <pointLight position={[-5, -3, 2]} intensity={0.8} color={colors.violet} />
        <Stars radius={40} depth={20} count={400} factor={3} saturation={0} fade speed={0.5} />
        {renderScene()}
        {children}
      </Canvas>
    </div>
  );
}

export default Scene3D;
export type { Scene3DProps };
export { Particles };
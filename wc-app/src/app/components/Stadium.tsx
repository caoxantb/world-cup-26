"use client";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { Environment, useGLTF } from "@react-three/drei";
import { Material, Mesh, TextureLoader, SRGBColorSpace } from "three";
import { GLTF } from "three-stdlib";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getColorPercentages } from "../utils/getColorDistribution";
import { useLoader } from "@react-three/fiber";

type StadiumProps = {
  flag: string;
};

const checkWebGLSupport = () => {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
};

// Extend GLTF typing for our model
type StadiumGLTF = GLTF & {
  nodes: Record<string, any>;
  materials: Record<string, Material>;
};

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc,#f1f5f9,#e5e7eb)]">
    <div className="absolute inset-0 animate-pulse bg-slate-200/30" />
    <div className="flex h-full w-full items-end">
      <div className="flex flex-col gap-1 px-6 pb-6 text-slate-500">
        <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
        <div className="h-7 w-72 animate-pulse rounded-md bg-slate-200" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200" />
      </div>
    </div>
  </div>
);

const ErrorOverlay = ({ message }: { message: string }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 text-red-50">
    <div className="rounded-lg border border-red-400/60 bg-red-900/60 px-6 py-4 text-center shadow-lg shadow-red-900/40">
      <p className="text-lg font-semibold">Stadium unavailable</p>
      <p className="mt-2 text-sm text-red-100/90">{message}</p>
    </div>
  </div>
);

const InfoOverlay = () => (
  <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end gap-1 bg-gradient-to-t from-black/70 via-black/10 to-transparent px-6 pb-6 text-white">
    <p className="text-xs uppercase tracking-[0.4em] text-white/80">
      Home ground
    </p>
    <p className="text-2xl font-semibold tracking-wide">
      My Dinh National Stadium
    </p>
    <p className="text-sm text-white/80">Hanoi, Vietnam</p>
  </div>
);

function StadiumScene({
  flag,
  onReady,
}: {
  flag: string;
  onReady: () => void;
}) {
  const { scene } = useGLTF("/3d/stadium.glb") as StadiumGLTF;

  const newScreenTexture = useLoader(TextureLoader, flag);
  newScreenTexture.colorSpace = SRGBColorSpace;

  const stadiumPositionalKey: { [key: string]: string } = {
    Circle014: "topInterior",
    Cube: "topInterior",
    Cube003: "topInterior",
    Tessellation005_2: "innerLeftWing",
    Tessellation008_1: "innerRightWing",
    Tessellation001: "topInterior",
    Tessellation: "topExterior",
    Tessellation002: "outerBody",
    Tessellation009: "outerUpper",
  };

  // Apply seat color and screen texture after model loads
  useEffect(() => {
    (async () => {
      try {
        const colors = await getColorPercentages(flag);

        scene.traverse((child) => {
          if (child instanceof Mesh) {
            // SEAT MATERIALS
            if (stadiumPositionalKey[child.name]) {
              const oldMat = child.material;
              const newMat = oldMat.clone();
              oldMat.dispose();

              newMat.map = null;
              newMat.color.set(colors[stadiumPositionalKey[child.name]]);
              child.material = newMat;
            }

            // SCREEN MATERIAL
            if (child.name.startsWith("Cube001_1")) {
              const oldMat = child.material;
              const newMat = oldMat.clone();
              oldMat.dispose();

              newMat.map = newScreenTexture;
              newMat.emissiveMap = newScreenTexture;
              newMat.map.flipY = false;
              child.material = newMat;
            }
          }
        });
      } finally {
        onReady();
      }
    })();
  }, [flag, newScreenTexture, onReady, scene]);

  return (
    <>
      <ambientLight intensity={3} /> {/* very bright general illumination */}
      <directionalLight position={[20, 30, 20]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={1} />
      <pointLight position={[10, 10, -10]} intensity={1} />
      <Environment preset="sunset" />
      <OrbitControls
        target={[0, 0, 0]} // look roughly at the center of the field
        minDistance={5} // prevent zooming into the field too much
        maxDistance={50} // limit how far you can zoom out
        enablePan={false}
        minPolarAngle={0.2} // limit vertical rotation so you don’t look under the floor
        maxPolarAngle={Math.PI / 2.2} // limit vertical rotation upward
      />
      <primitive object={scene} />
    </>
  );
}

export default function Stadium({ flag }: StadiumProps) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    setModelReady(false);
  }, [flag]);

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
  }, []);

  const handleReady = useCallback(() => setModelReady(true), []);

  if (!webglSupported) {
    return (
      <div className="relative inline-block aspect-[16/9] w-full overflow-hidden">
        <ErrorOverlay message="WebGL is unavailable. Enable hardware acceleration to view the 3D stadium." />
      </div>
    );
  }

  return (
    <div className="relative inline-block aspect-[16/9] w-full overflow-hidden">
      <Canvas
        camera={{
          position: [8, 2.5, -7],
          fov: 75,
          near: 0.1,
          far: 500,
        }}
      >
        <Suspense fallback={null}>
          <StadiumScene flag={flag} onReady={handleReady} />
        </Suspense>
      </Canvas>

      {!modelReady && <LoadingOverlay />}
      {modelReady && <InfoOverlay />}
    </div>
  );
}

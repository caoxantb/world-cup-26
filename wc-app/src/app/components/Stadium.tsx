"use client";
import React, { useEffect } from "react";
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

// Extend GLTF typing for our model
type StadiumGLTF = GLTF & {
  nodes: Record<string, any>;
  materials: Record<string, Material>;
};

export default function Stadium({ flag }: StadiumProps) {
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
    })();
  }, [flag]);

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
      </Canvas>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end gap-1 bg-gradient-to-t from-black/70 via-black/10 to-transparent px-6 pb-6 text-white">
        <p className="text-xs uppercase tracking-[0.4em] text-white/80">
          Home ground
        </p>
        <p className="text-2xl font-semibold tracking-wide">
          My Dinh National Stadium
        </p>
        <p className="text-sm text-white/80">Hanoi, Vietnam</p>
      </div>
    </div>
  );
}

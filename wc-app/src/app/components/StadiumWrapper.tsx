"use client";

import dynamic from "next/dynamic";

const Stadium = dynamic(() => import("@/app/components/Stadium"), {
  ssr: false,
});

export default function StadiumWrapper({ flag }: { flag: string }) {
  return <Stadium flag={flag} />;
}

import Image from "next/image";
import StadiumWrapper from "@/app/components/StadiumWrapper";
import TeamPerformanceChart from "@/app/components/TeamPerformanceChart";
import VersusHistory from "@/app/components/VersusHistory";
import TimelinePanel from "@/app/components/TimelinePanel";

export default async function Team({
  params,
}: {
  params: Promise<{ id: string; code: string }>;
}) {
  const { id, code } = await params;
  console.log(id, code);

  return (
    <>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="grid grid-cols-8 gap-8">
            <div className="col-span-8 lg:col-span-2 flex flex-col items-center gap-8 text-center">
              <div className="flex w-full flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  National flag
                </p>
                <Image
                  src={
                    "https://res.cloudinary.com/caoxantb/image/upload/v1716011517/flag/VIE.png"
                  }
                  alt="VIE"
                  width={150}
                  height={300}
                  priority
                />
              </div>
              <div className="flex w-full flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Federation emblem
                </p>
                <Image
                  src={
                    "https://res.cloudinary.com/caoxantb/image/upload/v1716011517/logo/VIE.png"
                  }
                  alt="VIE"
                  width={150}
                  height={150}
                />
              </div>
              <div className="flex w-full flex-col items-center gap-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  match kits
                </p>
                <div className="flex gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Image
                      src={
                        "https://res.cloudinary.com/caoxantb/image/upload/v1716011517/kits/VIE_home.png"
                      }
                      alt="VIE home kit"
                      width={75}
                      height={100}
                    />
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      home
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Image
                      src={
                        "https://res.cloudinary.com/caoxantb/image/upload/v1716011517/kits/VIE_away.png"
                      }
                      alt="VIE away kit"
                      width={75}
                      height={100}
                    />
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      away
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-8 lg:col-span-6 flex flex-col items-start gap-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.5em] text-muted-foreground">
                  Fifa World Cup 2026 Qualifiers - AFC
                </p>
                <div className="flex flex-wrap items-baseline gap-4">
                  <h1 className="text-6xl font-black tracking-tight text-balance uppercase">
                    Vietnam
                  </h1>
                  <span className="text-sm font-semibold uppercase tracking-[0.8em] text-muted-foreground">
                    VIE
                  </span>
                </div>
              </div>
              <div className="w-full overflow-hidden rounded-[2.5rem] border border-border shadow-lg">
                <StadiumWrapper
                  flag={
                    "https://res.cloudinary.com/caoxantb/image/upload/v1716011517/flag/VIE.png"
                  }
                />
              </div>
            </div>
          </div>
          <TeamPerformanceChart />
        </div>
        <div className="col-span-4 flex flex-col items-center gap-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Next match
          </p>
          <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                kick-off
              </p>
              <p className="text-2xl font-semibold">18:00 (GMT+7)</p>
              <p className="text-lg font-medium text-muted-foreground">
                December 19th, 2025
              </p>
              <p className="text-sm font-light text-muted-foreground">
                My Dinh National Stadium, Hanoi
              </p>
            </div>
            <div className="flex w-full flex-row items-center justify-between gap-4 rounded-xl p-4">
              <div className="flex flex-1 flex-col items-center gap-2">
                <Image
                  src={
                    "https://res.cloudinary.com/caoxantb/image/upload/v1716011517/flag/VIE.png"
                  }
                  alt="VIE"
                  width={80}
                  height={160}
                  priority
                />
                <p className="text-sm font-semibold uppercase tracking-wide">
                  Viet Nam
                </p>
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                vs
              </div>
              <div className="flex flex-1 flex-col items-center gap-2">
                <Image
                  src={
                    "https://res.cloudinary.com/caoxantb/image/upload/v1716011517/flag/THA.png"
                  }
                  alt="THA"
                  width={80}
                  height={160}
                  priority
                />
                <p className="text-sm font-semibold uppercase tracking-wide">
                  Thailand
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                competition
              </p>
              <p className="text-base font-semibold">
                AFC World Cup Qualifiers • Round 3
              </p>
            </div>
          </div>
          <VersusHistory />
          <TimelinePanel />
        </div>
      </div>
    </>
  );
}

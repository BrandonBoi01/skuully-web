import {
  Activity,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

import { SkuullyLogo } from "@/components/brand/skuully-logo";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { LiveActivityTicker } from "@/components/dashboard/live-activity-ticker";
import { PageSpotlight } from "@/components/effects/page-spotlight";
import { AdminCommandBar } from "@/components/dashboard/admin-command-bar";

const navItems = [
  { label: "Control Center", icon: LayoutDashboard, active: true },
  { label: "Attendance", icon: Activity, active: false },
  { label: "Students", icon: GraduationCap, active: false },
  { label: "Staff", icon: Users, active: false },
  { label: "Programs", icon: WalletCards, active: false },
  { label: "Messaging", icon: MessageSquare, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden text-white">
      <AmbientBackground />
      <PageSpotlight />

      <div className="mx-auto flex h-screen max-w-[1600px]">
        <aside className="hidden h-screen w-72 shrink-0 border-r border-white/10 bg-white/5 backdrop-blur-xl lg:block">
          <div className="sticky top-0 flex h-screen flex-col p-6">
            <div className="mb-10">
              <SkuullyLogo size={38} showText />
            </div>

            <nav className="space-y-2 overflow-y-auto pr-1">
              {navItems.map((item) => {
                const Icon = item.icon;

                if (item.active) {
                  return (
                    <div
                      key={item.label}
                      className="group relative overflow-hidden rounded-2xl border border-[rgba(54,97,225,0.28)] bg-[linear-gradient(135deg,rgba(54,97,225,0.16),rgba(88,66,171,0.12))] px-4 py-3 text-sm text-[#dbe4ff] shadow-[0_0_24px_rgba(54,97,225,0.14)]"
                    >
                      <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-[linear-gradient(180deg,#3661E1,#A55E95)] shadow-[0_0_16px_rgba(54,97,225,0.55)]" />
                      <div className="flex items-center gap-3 pl-2">
                        <Icon className="h-4 w-4 text-[#9bb4ff]" />
                        <span>{item.label}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.label}
                    className="hover-lift rounded-2xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white/85"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-white/45" />
                      <span>{item.label}</span>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(6,8,22,0.72)] backdrop-blur-2xl">
            <div className="flex flex-col gap-4 px-4 py-4 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <AdminCommandBar />
                <LiveActivityTicker />
              </div>
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-8 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
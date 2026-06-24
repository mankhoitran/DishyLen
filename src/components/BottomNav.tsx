import { Home, ScanLine, User, Clock } from "lucide-react";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showHistory?: boolean;
}

const BottomNav = ({ activeTab, onTabChange, showHistory = false }: Props) => {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "scan", icon: ScanLine, label: "Scan" },
    { id: "profile", icon: User, label: "Profile" },
    ...(showHistory ? [{ id: "history", icon: Clock, label: "History" }] : []),
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-lg border-t border-border px-4 py-2 z-50">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

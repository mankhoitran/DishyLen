import { X, Zap, ImagePlus, Sparkles } from "lucide-react";

const ScannerScreen = ({ onCapture, onClose }: { onCapture: () => void; onClose: () => void }) => {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, hsl(120 15% 30%), hsl(80 15% 35%), hsl(40 20% 40%))" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-foreground/20 flex items-center justify-center backdrop-blur-sm">
          <X size={18} className="text-primary-foreground" />
        </button>
        <div className="bg-primary px-4 py-1.5 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
          <span className="text-primary-foreground text-xs font-bold tracking-wider uppercase">DishyLen</span>
        </div>
        <button className="w-10 h-10 rounded-full bg-foreground/20 flex items-center justify-center backdrop-blur-sm">
          <Zap size={18} className="text-primary-foreground" />
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex items-center justify-center px-8 relative">
        {/* Corner brackets */}
        <div className="absolute inset-x-12 inset-y-8">
          <div className="scanner-corner absolute top-0 left-0 border-t border-l rounded-tl-md" />
          <div className="scanner-corner absolute top-0 right-0 border-t border-r rounded-tr-md" />
          <div className="scanner-corner absolute bottom-0 left-0 border-b border-l rounded-bl-md" />
          <div className="scanner-corner absolute bottom-0 right-0 border-b border-r rounded-br-md" />
        </div>

        <div className="bg-foreground/20 backdrop-blur-sm px-4 py-3 rounded-xl">
          <p className="text-primary-foreground/80 text-sm text-center">Align menu within frame</p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-8 space-y-4">
        <div className="flex items-center justify-between px-4">
          <div className="flex flex-col items-center gap-1">
            <button className="w-14 h-14 rounded-2xl bg-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <ImagePlus size={22} className="text-primary-foreground" />
            </button>
            <span className="text-primary-foreground/70 text-[10px] uppercase tracking-wider">Upload</span>
          </div>

          <button
            onClick={onCapture}
            className="w-20 h-20 rounded-full border-4 border-primary-foreground/40 flex items-center justify-center active:scale-90 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-primary-foreground shadow-lg" />
          </button>

          <div className="flex flex-col items-center gap-1">
            <button className="w-14 h-14 rounded-2xl bg-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles size={22} className="text-primary-foreground" />
            </button>
            <span className="text-primary-foreground/70 text-[10px] uppercase tracking-wider">Auto</span>
          </div>
        </div>

        <p className="text-center text-primary-foreground/60 text-xs font-bold tracking-[0.15em] uppercase">Menu</p>
      </div>
    </div>
  );
};

export default ScannerScreen;

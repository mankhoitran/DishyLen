import { X, Zap, ImagePlus, Sparkles } from "lucide-react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { useRef } from "react";
import { imageDataUrlToFile } from "@/lib/dishyApi";

interface Props {
  onCapture: (payload: { file: File; previewUrl: string }) => void;
  onClose: () => void;
}

const ScannerScreen = ({ onCapture, onClose }: Props) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const handleWebFile = (file?: File) => {
    if (!file) return;
    onCapture({ file, previewUrl: URL.createObjectURL(file) });
  };

  const pickImage = async (source: CameraSource) => {
    if (!Capacitor.isNativePlatform()) {
      if (source === CameraSource.Camera) cameraInputRef.current?.click();
      else libraryInputRef.current?.click();
      return;
    }

    try {
      await Camera.requestPermissions({
        permissions: source === CameraSource.Camera ? ["camera"] : ["photos"],
      });

      const photo = await Camera.getPhoto({
        source,
        resultType: CameraResultType.DataUrl,
        quality: 90,
        allowEditing: false,
        correctOrientation: true,
      });

      if (!photo.dataUrl) return;
      const file = await imageDataUrlToFile(photo.dataUrl, `menu-${Date.now()}.jpg`);
      onCapture({ file, previewUrl: photo.dataUrl });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("cancel")) return;
      console.error("Image selection failed", error);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, hsl(120 15% 30%), hsl(80 15% 35%), hsl(40 20% 40%))" }}>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleWebFile(event.target.files?.[0])}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleWebFile(event.target.files?.[0])}
      />

      {/* Top bar */}
      <h1 className="sr-only">Scan a restaurant menu with DishyLen</h1>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
        <button onClick={onClose} aria-label="Close scanner" className="w-10 h-10 rounded-full bg-foreground/20 flex items-center justify-center backdrop-blur-sm">
          <X size={18} className="text-primary-foreground" />
        </button>
        <div className="bg-primary px-4 py-1.5 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
          <span className="text-primary-foreground text-xs font-bold tracking-wider uppercase">DishyLen</span>
        </div>
        <button aria-label="Toggle camera flash" className="w-10 h-10 rounded-full bg-foreground/20 flex items-center justify-center backdrop-blur-sm">
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
            <button
              onClick={() => pickImage(CameraSource.Photos)}
              aria-label="Upload menu photo from library"
              className="w-14 h-14 rounded-2xl bg-foreground/20 backdrop-blur-sm flex items-center justify-center"
            >
              <ImagePlus size={22} className="text-primary-foreground" />
            </button>
            <span className="text-primary-foreground/70 text-[10px] uppercase tracking-wider">Upload</span>
          </div>

          <button
            onClick={() => pickImage(CameraSource.Camera)}
            aria-label="Capture menu photo"
            className="w-20 h-20 rounded-full border-4 border-primary-foreground/40 flex items-center justify-center active:scale-90 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-primary-foreground shadow-lg" />
          </button>

          <div className="flex flex-col items-center gap-1">
            <button aria-label="Toggle auto-detect mode" className="w-14 h-14 rounded-2xl bg-foreground/20 backdrop-blur-sm flex items-center justify-center">
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

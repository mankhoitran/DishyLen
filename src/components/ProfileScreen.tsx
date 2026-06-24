import { useState, useEffect } from "react";
import { User, ShieldAlert, Globe, LogOut } from "lucide-react";
import { getAuthUser, setAuthUser, updateUserProfile, logoutUser, type AuthUser } from "@/lib/dishyApi";

interface Props {
  language: string;
  onLanguageChange: (lang: string) => void;
}

const ProfileScreen = ({ language, onLanguageChange }: Props) => {
  const [user, setUserState] = useState<AuthUser | undefined>(() => getAuthUser() ?? undefined);
  const [allergies, setAllergies] = useState(user?.allergies || "");
  const [isSaved, setIsSaved] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // If user state updates, sync local state
    if (user?.allergies) {
      setAllergies(user.allergies);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Send the update to the backend
      const updatedUser = await updateUserProfile({ allergies });
      setUserState(updatedUser);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error("Failed to sync allergies to backend", error);
      // Fallback: save locally even if backend fails
      const localUpdated = { ...user, allergies };
      setAuthUser(localUpdated);
      setUserState(localUpdated);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background bg-gradient-to-b from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary/10 backdrop-blur-md border-b border-primary/20 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
            <User size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground text-lg">User Profile</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Manage your personal info and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8 pb-32">
        {/* User Info Section */}
        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
            Account Details
          </h2>
          
          <div className="flex items-center gap-4">
            {user?.picture ? (
              <img src={user.picture} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={32} className="text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold text-lg text-foreground">{user?.name || "Guest User"}</p>
              {user?.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
        </section>

        {/* Dietary Preferences & Allergies */}
        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert size={16} className="text-destructive" />
             Allergies
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Note down what you are allergic to. DishyLen will keep this in mind when analyzing menus.
          </p>
          
          <textarea
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                target.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 300);
            }}
            placeholder="e.g., Peanuts, shellfish, dairy, gluten-free..."
            className="w-full h-32 p-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-4"
          />
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-md active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : isSaved ? "Saved Successfully!" : "Save Preferences"}
          </button>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
            <Globe size={16} className="text-primary" />
            Translation Language
          </h2>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full appearance-none bg-muted text-foreground p-4 rounded-xl font-semibold border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="en">English</option>
              <option value="vi">Vietnamese</option>
              <option value="zh">Chinese</option>
              <option value="es">Spanish</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
              ▼
            </div>
          </div>
        </section>

        {/* Logout */}
        <section className="pt-4">
          <button
            onClick={async () => {
              await logoutUser();
              window.location.replace("/login");
            }}
            className="w-full flex justify-center items-center gap-2 py-4 rounded-xl text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 transition-all"
          >
            <LogOut size={18} />
            Log out
          </button>
        </section>
      </div>
    </div>
  );
};

export default ProfileScreen;

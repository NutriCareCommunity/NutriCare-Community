import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, getDocs, addDoc } from "firebase/firestore";

interface AppContextType {
  user: FirebaseUser | null;
  profile: any;
  familyMembers: any[];
  careAlerts: any[];
  devices: any[];
  loading: boolean;
  language: string;
  appMode: "standard" | "child" | "elder";
  theme: "light" | "dark" | "device";
  activeTrackerModule: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setActiveTrackerModule: (id: string) => void;
  setAppMode: (mode: "standard" | "child" | "elder") => void;
  setLanguage: (lang: string) => void;
  setTheme: (theme: "light" | "dark" | "device") => void;
  refreshProfile: () => Promise<void>;
  addCareAlert: (alert: any) => void;
  connectDevice: (device: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [careAlerts, setCareAlerts] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(localStorage.getItem("app_lang") || "en");
  const [appMode, setAppMode] = useState<"standard" | "child" | "elder">("standard");
  const [theme, setThemeState] = useState<"light" | "dark" | "device">(
    (localStorage.getItem("app_theme") as "light" | "dark" | "device") || "device"
  );
  const [activeTrackerModule, setActiveTrackerModule] = useState("overview");
  const [activeTab, setActiveTab] = useState("home");

  // Hook to handle dynamic theme injection
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (currentTheme: "light" | "dark" | "device") => {
      root.classList.remove("theme-light", "theme-dark");
      if (currentTheme === "device") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(isDark ? "theme-dark" : "theme-light");
      } else {
        root.classList.add(currentTheme === "light" ? "theme-light" : "theme-dark");
      }
    };

    applyTheme(theme);
    localStorage.setItem("app_theme", theme);

    if (theme === "device") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        root.classList.remove("theme-light", "theme-dark");
        root.classList.add(e.matches ? "theme-dark" : "theme-light");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (t: "light" | "dark" | "device") => {
    setThemeState(t);
  };

  const fetchProfile = async (uid: string) => {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (data.language) setLanguage(data.language);
        if (data.appMode) setAppMode(data.appMode as any);
      } else {
        setProfile(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  const fetchFamily = async (uid: string) => {
    // In a real app we'd query a family subcollection or joint table
    // BUG 4: Fallbacks should only be shown in development mode
    if (import.meta.env.DEV) {
      const mockFamily = [
        { id: "f1", name: "Parents", icon: "👨‍🦳", status: "Healthy" },
        { id: "f2", name: "Child", icon: "👶", status: "Needs Iron" }
      ];
      setFamilyMembers(mockFamily);
    } else {
      setFamilyMembers([]);
    }
  };

  const fetchDevices = async (uid: string) => {
    const path = `users/${uid}/devices`;
    try {
      const q = query(collection(db, "users", uid, "devices"));
      const snap = await getDocs(q);
      const devList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (devList.length === 0) {
        // BUG 4: Fallbacks should only be shown in development mode
        if (import.meta.env.DEV) {
          setDevices([
            { id: "d1", deviceName: "SmartWatch Pro", deviceType: "Watch", status: "connected", batteryLevel: 85, lastSync: "2 min ago" },
            { id: "d2", deviceName: "Family Scale", deviceType: "Scale", status: "connected", batteryLevel: 42, lastSync: "1h ago" }
          ]);
        } else {
          setDevices([]);
        }
      } else {
        setDevices(devList);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchProfile(u.uid);
        await fetchFamily(u.uid);
        await fetchDevices(u.uid);
      } else {
        setProfile(null);
        setFamilyMembers([]);
        setDevices([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem("app_lang", language);
  }, [language]);

  const addCareAlert = (alert: any) => {
    setCareAlerts(prev => [alert, ...prev].slice(0, 5));
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  const connectDevice = async (device: any) => {
    if (!user) return;
    const path = `users/${user.uid}/devices`;
    try {
      await addDoc(collection(db, "users", user.uid, "devices"), {
        ...device,
        userId: user.uid,
        status: "connected",
        lastSync: new Date().toISOString(),
        batteryLevel: 100
      });
      await fetchDevices(user.uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      profile, 
      familyMembers, 
      careAlerts, 
      devices,
      loading, 
      language, 
      appMode,
      theme,
      activeTrackerModule,
      activeTab,
      setActiveTab,
      setActiveTrackerModule,
      setAppMode,
      setLanguage, 
      setTheme,
      refreshProfile,
      addCareAlert,
      connectDevice
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

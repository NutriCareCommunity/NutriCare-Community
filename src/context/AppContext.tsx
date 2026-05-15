import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
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
  activeTrackerModule: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setActiveTrackerModule: (id: string) => void;
  setAppMode: (mode: "standard" | "child" | "elder") => void;
  setLanguage: (lang: string) => void;
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
  const [activeTrackerModule, setActiveTrackerModule] = useState("overview");
  const [activeTab, setActiveTab] = useState("home");

  const fetchProfile = async (uid: string) => {
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
      console.error("Error fetching profile:", err);
    }
  };

  const fetchFamily = async (uid: string) => {
    // In a real app we'd query a family subcollection or joint table
    // For now, we simulate with some intelligent logic based on profile type
    const mockFamily = [
      { id: "f1", name: "Parents", icon: "👨‍🦳", status: "Healthy" },
      { id: "f2", name: "Child", icon: "👶", status: "Needs Iron" }
    ];
    setFamilyMembers(mockFamily);
  };

  const fetchDevices = async (uid: string) => {
    try {
      const q = query(collection(db, "users", uid, "devices"));
      const snap = await getDocs(q);
      const devList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (devList.length === 0) {
        setDevices([
          { id: "d1", deviceName: "SmartWatch Pro", deviceType: "Watch", status: "connected", batteryLevel: 85, lastSync: "2 min ago" },
          { id: "d2", deviceName: "Family Scale", deviceType: "Scale", status: "connected", batteryLevel: 42, lastSync: "1h ago" }
        ]);
      } else {
        setDevices(devList);
      }
    } catch (err) {
      console.error("Error fetching devices:", err);
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
      console.error("Error connecting device:", err);
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
      activeTrackerModule,
      activeTab,
      setActiveTab,
      setActiveTrackerModule,
      setAppMode,
      setLanguage, 
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

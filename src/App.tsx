/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  YarnRecord, 
  ProductionRecord, 
  GloveVariety, 
  OperationType, 
  UserProfile 
} from './types';
import { handleFirestoreError } from './utils';
import { 
  Package, 
  Truck, 
  History, 
  Plus, 
  LogOut, 
  User as UserIcon, 
  AlertCircle,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'yarn' | 'production' | 'history'>('yarn');
  const [yarnRecords, setYarnRecords] = useState<YarnRecord[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [yarnForm, setYarnForm] = useState({ date: new Date().toISOString().split('T')[0], bags: '', weight: '', notes: '' });
  const [prodForm, setProdForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    variety: 'Medium Half' as GloveVariety, 
    dozens: '', 
    weight: '', 
    notes: '' 
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check/Create Profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              role: currentUser.email === 'farmanullahkhaksar87@gmail.com' ? 'admin' : 'user'
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(userDoc.data() as UserProfile);
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const yarnQuery = query(collection(db, 'yarn_records'), orderBy('date', 'desc'));
    const prodQuery = query(collection(db, 'production_records'), orderBy('date', 'desc'));

    const unsubYarn = onSnapshot(yarnQuery, (snapshot) => {
      setYarnRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YarnRecord)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'yarn_records'));

    const unsubProd = onSnapshot(prodQuery, (snapshot) => {
      setProductionRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductionRecord)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'production_records'));

    return () => {
      unsubYarn();
      unsubProd();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("لاگ ان میں غلطی ہوئی۔ دوبارہ کوشش کریں۔");
    }
  };

  const handleLogout = () => signOut(auth);

  const submitYarn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'yarn_records'), {
        ...yarnForm,
        bags: Number(yarnForm.bags),
        weight: Number(yarnForm.weight),
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      });
      setYarnForm({ date: new Date().toISOString().split('T')[0], bags: '', weight: '', notes: '' });
      alert("دھاگے کا ریکارڈ محفوظ ہو گیا!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'yarn_records');
    }
  };

  const submitProd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'production_records'), {
        ...prodForm,
        dozens: Number(prodForm.dozens),
        weight: Number(prodForm.weight),
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      });
      setProdForm({ date: new Date().toISOString().split('T')[0], variety: 'Medium Half', dozens: '', weight: '', notes: '' });
      alert("پیداوار کا ریکارڈ محفوظ ہو گیا!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'production_records');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
        >
          <div className="bg-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Package className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">دستانہ فیکٹری مینیجر</h1>
          <p className="text-slate-500 mb-8">اپنے فیکٹری کے ریکارڈز کو محفوظ طریقے سے مینیج کریں</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            گوگل کے ساتھ لاگ ان کریں
          </button>
          {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans mb-20 md:mb-0" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Package className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">فیکٹری مینیجر</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 bg-white border-l border-slate-200 p-6 flex-col gap-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Package className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900">فیکٹری مینیجر</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem 
            active={activeTab === 'yarn'} 
            onClick={() => setActiveTab('yarn')} 
            icon={<Truck />} 
            label="دھاگے کا اندراج" 
          />
          <NavItem 
            active={activeTab === 'production'} 
            onClick={() => setActiveTab('production')} 
            icon={<LayoutDashboard />} 
            label="پیداوار کا اندراج" 
          />
          <NavItem 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<History />} 
            label="تاریخچہ (ریکارڈز)" 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <UserIcon className="text-slate-500 w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.role === 'admin' ? 'ایڈمن' : 'صارف'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            لاگ آؤٹ
          </button>
        </div>
      </aside>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <MobileNavItem 
          active={activeTab === 'yarn'} 
          onClick={() => setActiveTab('yarn')} 
          icon={<Truck />} 
          label="دھاگہ" 
        />
        <MobileNavItem 
          active={activeTab === 'production'} 
          onClick={() => setActiveTab('production')} 
          icon={<LayoutDashboard />} 
          label="پیداوار" 
        />
        <MobileNavItem 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<History />} 
          label="ریکارڈز" 
        />
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'yarn' && (
              <motion.div
                key="yarn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <header className="mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">دھاگے کا اندراج</h2>
                  <p className="text-sm md:text-base text-slate-500">فیکٹری بھیجے گئے دھاگے کا ریکارڈ یہاں درج کریں</p>
                </header>

                <form onSubmit={submitYarn} className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-sm font-semibold text-slate-700">تاریخ</label>
                    <input 
                      type="date" 
                      required
                      value={yarnForm.date}
                      onChange={e => setYarnForm({...yarnForm, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-sm font-semibold text-slate-700">بوریوں کی تعداد</label>
                    <input 
                      type="number" 
                      required
                      inputMode="numeric"
                      placeholder="مثلاً 10"
                      value={yarnForm.bags}
                      onChange={e => setYarnForm({...yarnForm, bags: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-sm font-semibold text-slate-700">کل وزن (کلو)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      inputMode="decimal"
                      placeholder="مثلاً 250.5"
                      value={yarnForm.weight}
                      onChange={e => setYarnForm({...yarnForm, weight: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-sm font-semibold text-slate-700">مزید معلومات (اختیاری)</label>
                    <input 
                      type="text" 
                      placeholder="کوئی خاص بات..."
                      value={yarnForm.notes}
                      onChange={e => setYarnForm({...yarnForm, notes: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                    />
                  </div>
                  <div className="md:col-span-2 pt-2 md:pt-4">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" />
                      ریکارڈ محفوظ کریں
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'production' && (
              <motion.div
                key="prod"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <header className="mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">پیداوار کا اندراج</h2>
                  <p className="text-sm md:text-base text-slate-500">فیکٹری سے وصول شدہ مال کا ریکارڈ یہاں درج کریں</p>
                </header>

                <form onSubmit={submitProd} className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-sm font-semibold text-slate-700">تاریخ</label>
                    <input 
                      type="date" 
                      required
                      value={prodForm.date}
                      onChange={e => setProdForm({...prodForm, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-sm font-semibold text-slate-700">ورائٹی</label>
                    <div className="relative">
                      <select 
                        value={prodForm.variety}
                        onChange={e => setProdForm({...prodForm, variety: e.target.value as GloveVariety})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white text-base"
                      >
                        <option value="Small Half">Small Half</option>
                        <option value="Medium Half">Medium Half</option>
                        <option value="Large Half">Large Half</option>
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-sm font-semibold text-slate-700">تعداد (درجن)</label>
                    <input 
                      type="number" 
                      required
                      inputMode="numeric"
                      placeholder="مثلاً 100"
                      value={prodForm.dozens}
                      onChange={e => setProdForm({...prodForm, dozens: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-sm font-semibold text-slate-700">کل وزن (کلو)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      inputMode="decimal"
                      placeholder="مثلاً 50.2"
                      value={prodForm.weight}
                      onChange={e => setProdForm({...prodForm, weight: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5 md:space-y-2">
                    <label className="text-sm font-semibold text-slate-700">مزید معلومات (اختیاری)</label>
                    <input 
                      type="text" 
                      placeholder="کوئی خاص بات..."
                      value={prodForm.notes}
                      onChange={e => setProdForm({...prodForm, notes: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                    />
                  </div>
                  <div className="md:col-span-2 pt-2 md:pt-4">
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" />
                      پیداوار محفوظ کریں
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <header className="mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">ریکارڈز کی تاریخ</h2>
                  <p className="text-sm md:text-base text-slate-500">تمام سابقہ ریکارڈز کی تفصیل یہاں دیکھیں</p>
                </header>

                <div className="space-y-8 md:space-y-12">
                  <section>
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                      <Truck className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
                      <h3 className="text-lg md:text-xl font-bold text-slate-800">دھاگے کا ریکارڈ</h3>
                    </div>
                    <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-[400px]">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-700 text-sm md:text-base">تاریخ</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-700 text-sm md:text-base">بوریاں</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-700 text-sm md:text-base">وزن</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-700 text-sm md:text-base">نوٹس</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {yarnRecords.map(record => (
                              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 md:px-6 py-3 md:py-4 text-slate-600 text-sm md:text-base">{record.date}</td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-slate-900 font-medium text-sm md:text-base">{record.bags}</td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-slate-900 font-medium text-sm md:text-base">{record.weight}</td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-slate-500 text-xs md:text-sm">{record.notes || '-'}</td>
                              </tr>
                            ))}
                            {yarnRecords.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">کوئی ریکارڈ موجود نہیں ہے</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                      <LayoutDashboard className="text-indigo-600 w-5 h-5 md:w-6 md:h-6" />
                      <h3 className="text-lg md:text-xl font-bold text-slate-800">پیداوار کا ریکارڈ</h3>
                    </div>
                    <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-[400px]">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-700 text-sm md:text-base">تاریخ</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-700 text-sm md:text-base">ورائٹی</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-700 text-sm md:text-base">درجن</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-700 text-sm md:text-base">وزن</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {productionRecords.map(record => (
                              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 md:px-6 py-3 md:py-4 text-slate-600 text-sm md:text-base">{record.date}</td>
                                <td className="px-4 md:px-6 py-3 md:py-4">
                                  <span className="px-2 md:px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap">
                                    {record.variety}
                                  </span>
                                </td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-slate-900 font-medium text-sm md:text-base">{record.dozens}</td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-slate-900 font-medium text-sm md:text-base">{record.weight}</td>
                              </tr>
                            ))}
                            {productionRecords.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">کوئی ریکارڈ موجود نہیں ہے</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
        ${active 
          ? 'bg-blue-50 text-blue-600 shadow-sm' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
      `}
    >
      <span className={active ? 'text-blue-600' : 'text-slate-400'}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </span>
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all flex-1
        ${active ? 'text-blue-600' : 'text-slate-400'}
      `}
    >
      <div className={`p-1 rounded-lg ${active ? 'bg-blue-50' : ''}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

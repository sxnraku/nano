import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText, Lock, Globe } from 'lucide-react';
import { translations, type Language } from '../services/localizationService';

interface LegalDocsProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export function LegalDocs({ isOpen, onClose, language = 'en' }: LegalDocsProps) {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-zinc-900 border-4 border-white shadow-[0_0_50px_rgba(255,255,255,0.1)] rounded-xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-black p-4 border-b-4 border-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="bg-yellow-400 p-2 border-2 border-white shadow-[4px_4px_0_#fff] -rotate-3">
                  <Shield className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-marker text-white uppercase tracking-wider">{t.legal_title}</h2>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{t.legal_protocols}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="relative z-10 p-2 bg-red-600 text-white border-2 border-white hover:bg-red-500 transition-colors shadow-[4px_4px_0_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-4 border-white bg-black">
              <button
                onClick={() => setActiveTab('terms')}
                className={`flex-1 py-4 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'terms'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800'
                  }`}
              >
                <FileText className="w-4 h-4" />
                {t.legal_terms_tab}
              </button>
              <div className="w-1 bg-white" />
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 py-4 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'privacy'
                  ? 'bg-cyan-400 text-black'
                  : 'bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800'
                  }`}
              >
                <Lock className="w-4 h-4" />
                {t.legal_privacy_tab}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-900 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none" />

              <div className="relative z-10 prose prose-invert prose-sm max-w-none">
                {activeTab === 'terms' ? (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-xl font-black text-yellow-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-yellow-400 text-black px-2 text-sm">01</span> {t.legal_acceptance_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_acceptance_desc}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-black text-yellow-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-yellow-400 text-black px-2 text-sm">02</span> {t.legal_ai_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_ai_desc}
                      </p>
                      <ul className="list-disc pl-5 space-y-2 mt-2 text-zinc-400 marker:text-yellow-400">
                        <li>{t.legal_ai_list1}</li>
                        <li>{t.legal_ai_list2}</li>
                        <li>{t.legal_ai_list3}</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-xl font-black text-yellow-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-yellow-400 text-black px-2 text-sm">03</span> {t.legal_ip_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_ip_desc}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-black text-yellow-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-yellow-400 text-black px-2 text-sm">04</span> {t.legal_disclaimer_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_disclaimer_desc}
                      </p>
                    </section>
                    <section>
                      <h3 className="text-xl font-black text-yellow-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-yellow-400 text-black px-2 text-sm">05</span> {t.legal_virtual_items_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_virtual_items_desc}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-black text-yellow-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-yellow-400 text-black px-2 text-sm">06</span> {t.legal_user_conduct_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_user_conduct_desc}
                      </p>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-xl font-black text-cyan-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-cyan-400 text-black px-2 text-sm">01</span> {t.legal_data_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_data_desc}
                      </p>
                      <ul className="list-disc pl-5 space-y-2 mt-2 text-zinc-400 marker:text-cyan-400">
                        <li>{t.legal_data_list1}</li>
                        <li>{t.legal_data_list2}</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-xl font-black text-cyan-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-cyan-400 text-black px-2 text-sm">02</span> {t.legal_third_party_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_third_party_desc}
                      </p>
                      <div className="mt-4 bg-black/50 p-4 border border-zinc-700 rounded-lg flex items-center gap-3">
                        <Globe className="w-8 h-8 text-zinc-500" />
                        <div>
                          <h4 className="font-bold text-white">Google Services</h4>
                          <p className="text-xs text-zinc-500 font-mono uppercase tracking-tighter">Firebase • Gemini • AdMob</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-black text-cyan-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-cyan-400 text-black px-2 text-sm">03</span> {t.legal_storage_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_storage_desc}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-black text-cyan-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-cyan-400 text-black px-2 text-sm">04</span> {t.legal_data_rights_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_data_rights_desc}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-black text-cyan-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-cyan-400 text-black px-2 text-sm">05</span> {t.legal_children_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_children_desc}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-black text-cyan-400 uppercase mb-2 flex items-center gap-2">
                        <span className="bg-cyan-400 text-black px-2 text-sm">06</span> {t.legal_contact_title}
                      </h3>
                      <p className="text-zinc-300 leading-relaxed">
                        {t.legal_contact_desc}
                      </p>
                    </section>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black p-4 border-t-4 border-white text-center">
              <p className="text-[10px] text-zinc-500 font-mono uppercase">
                NanoVerse © 2026. All rights reserved.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

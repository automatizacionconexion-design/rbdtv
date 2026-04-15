import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { AppMode } from '../types';

interface OverlayProps {
  isVisible: boolean;
  mode: AppMode;
  programName: string;
}

export const Overlay: React.FC<OverlayProps> = ({ isVisible, mode, programName }) => {
  if (mode === 'OFF_AIR' || mode === 'LOADING') return null;

  const isVideo = mode === 'VIDEO';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 pointer-events-none"
        >
          {/* Top Right: EN VIVO Badge */}
          {isVideo && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-10 right-10"
            >
              <div className="bg-[#ff0000] text-white px-6 py-2 rounded-sm font-black text-[1.4rem] tracking-[4px] shadow-[0_0_30px_rgba(255,0,0,0.6)] flex items-center gap-3">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                EN VIVO
              </div>
            </motion.div>
          )}

          {/* Bottom Container */}
          <div className="absolute bottom-32 left-12 right-12 flex justify-between items-end">
            {/* Bottom Left: Program Info */}
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-black/90 p-[40px_50px] border-l-[8px] border-l-[#ff0000] backdrop-blur-[20px] rounded-r-xl max-w-[700px] shadow-2xl"
            >
              <p className="text-[#ff0000] text-[1rem] uppercase tracking-[0.4em] font-black mb-3">
                {isVideo ? 'ESTÁS VIENDO' : 'ESTÁS ESCUCHANDO'}
              </p>
              <h1 className="text-[4.5rem] font-black m-0 leading-[1] text-white uppercase tracking-tighter mb-4">
                {programName}
              </h1>
              <div className="flex items-center gap-4 opacity-80">
                <p className="text-[1.6rem] font-light m-0">
                  RBD RADIO
                </p>
                <div className="w-2 h-2 bg-[#ff0000] rounded-full" />
                <p className="text-[0.9rem] uppercase tracking-[2px] font-medium">
                  Las 24 horas haciendo radio
                </p>
              </div>
            </motion.div>

            {/* Bottom Right: WhatsApp QR */}
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, rotate: 10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-4 rounded-3xl flex flex-col items-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-white"
            >
              <div className="bg-black p-2 rounded-2xl mb-3">
                <QRCodeSVG 
                  value="https://wa.me/5491122573782" 
                  size={140}
                  level="H"
                  includeMargin={false}
                  fgColor="#FFFFFF"
                  bgColor="#000000"
                />
              </div>
              <p className="text-black font-black text-[0.8rem] tracking-tight">+54 9 11 2257 3782</p>
              <p className="text-black/40 text-[0.6rem] font-bold uppercase tracking-widest mt-1">WhatsApp</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Loader: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Glow */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute w-[600px] h-[600px] bg-[#ff0000] rounded-full blur-[150px] opacity-20"
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.22, 1, 0.36, 1]
          }}
          className="relative mb-12"
        >
          <motion.img 
            src="https://rbdradio.com/rbdlogo.png" 
            alt="RBD Logo" 
            className="w-64 drop-shadow-[0_0_30px_rgba(255,0,0,0.4)]"
            referrerPolicy="no-referrer"
            animate={{ 
              filter: ["drop-shadow(0 0 20px rgba(255,0,0,0.2))", "drop-shadow(0 0 40px rgba(255,0,0,0.5))", "drop-shadow(0 0 20px rgba(255,0,0,0.2))"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* Loading Bar & Text */}
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-white text-[0.8rem] font-black tracking-[0.5em] uppercase opacity-60">
              Iniciando Transmisión
            </p>
            <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-[#ff0000] shadow-[0_0_10px_#ff0000]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: 3, 
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.5 }}
            className="text-white text-[0.6rem] uppercase tracking-[0.3em] font-medium"
          >
            RBD RADIO | BUENOS AIRES
          </motion.p>
        </div>
      </div>

      {/* Subtle Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </motion.div>
  );
};

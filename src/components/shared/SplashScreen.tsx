// src/components/shared/SplashScreen.tsx
import React, { useEffect } from 'react';
import LogoE4C from '../../assets/Logo E4C.png';

interface SplashScreenProps {
  onAnimationEnd: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationEnd }) => {
  useEffect(() => {
    // Total animation duration for now. We can fine-tune this after all animations are in.
    const totalAnimationDuration = 2500; // 2.5 seconds, as per recommendation
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, totalAnimationDuration);
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom right, #ffffff, #e0f2f7)', // Subtle gradient
        animation: 'bgPulse 15s infinite ease-in-out', // Dynamic background
        backgroundSize: '200% 200%',
      }}
    >
      {/* Logo with fade-in and scale animation, plus subtle shadow */}
      <img
        src={LogoE4C}
        alt="Logo E4C"
        className="w-1/3 max-w-xs drop-shadow-lg"
        style={{ animation: 'fadeInScale 1s ease-out forwards' }}
      />

      {/* Subtitle with slide-up and fade-in animation */}
      <p
        className="mt-4 text-gray-600 text-lg font-light tracking-wide" // Refined typography
        style={{ animation: 'slideInUp 1s ease-out forwards 0.5s', opacity: 0 }} // Delayed animation
      >
        Cargando el acceso libre a la cultura.
      </p>

      {/* Thematic Loading Indicator (Hexagonal bars - simulated for now) */}
      <div className="mt-8 w-64 h-2 bg-gray-300 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600" // Thematic color
          style={{ animation: 'loadProgress 1.5s ease-out forwards 1s', width: '100%' }} // Animated progress
        ></div>
      </div>
    </div>
  );
};

export default SplashScreen;
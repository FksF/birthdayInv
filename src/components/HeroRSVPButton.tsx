import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, PartyPopper, Send, ChevronDown, X } from 'lucide-react';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export default function HeroRSVPButton() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    pin: '',
    name: '',
    attending: '',
    message: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAttendanceClick = (value: string) => {
    setFormData(prev => ({ ...prev, attending: value }));
    if (errors.attending) {
      setErrors(prev => ({ ...prev, attending: '' }));
    }
  };

  const getAttendanceClass = (type: string) => {
    const isSelected = formData.attending === type;
    const baseClass = 'cursor-pointer p-3 sm:p-4 rounded-xl text-center transition-all duration-300 border';
    
    if (type === 'yes') {
      return `${baseClass} ${isSelected 
        ? 'bg-green-500/30 border-green-400 text-green-100 shadow-lg shadow-green-500/25' 
        : 'bg-green-500/10 border-green-500/30 text-green-200 hover:bg-green-500/20 hover:border-green-400/50'}`;
    }
    return `${baseClass} ${isSelected 
      ? 'bg-red-500/30 border-red-400 text-red-100 shadow-lg shadow-red-500/25' 
      : 'bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/20 hover:border-red-400/50'}`;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.pin) {
      newErrors.pin = 'El código PIN es requerido';
    } else if (formData.pin.length !== 4) {
      newErrors.pin = 'El código debe tener 4 dígitos';
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'El código solo puede contener números';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tu nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.attending) {
      newErrors.attending = 'Por favor selecciona si podrás asistir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para manejar el enfoque en inputs móviles
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Solo en móviles
    if (window.innerWidth <= 768) {
      const element = e.target;
      const isTextarea = element.tagName.toLowerCase() === 'textarea';
      const modalElement = element.closest('.modal-container') as HTMLElement;
      
      if (isTextarea && modalElement) {
        // Reducir altura del modal para textarea
        modalElement.style.maxHeight = '50vh';
      }
      
      setTimeout(() => {
        // Scroll al elemento enfocado con un offset mayor para textarea
        const rect = element.getBoundingClientRect();
        
        if (modalElement) {
          const modalRect = modalElement.getBoundingClientRect();
          // Offset mayor para textarea (campo de mensaje) para evitar que lo tape el teclado
          const offset = isTextarea ? 200 : 100;
          const scrollTop = modalElement.scrollTop + rect.top - modalRect.top - offset;
          
          modalElement.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
        }
      }, isTextarea ? 500 : 300); // Más tiempo para textarea
    }
  };

  // Función para manejar cuando se pierde el enfoque
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (window.innerWidth <= 768) {
      const element = e.target;
      const isTextarea = element.tagName.toLowerCase() === 'textarea';
      const modalElement = element.closest('.modal-container') as HTMLElement;
      
      if (isTextarea && modalElement) {
        // Restaurar altura del modal
        setTimeout(() => {
          modalElement.style.maxHeight = '70vh';
        }, 300);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Validate PIN - try different approaches based on possible table structures
      let validPins: any[] = [];
      let pinError = null;

      // Option 1: Check if PIN exists in a simple list (most common case)
      // This handles cases where valid_pins might be: ['2210', '5678', '9876', '4321']
      const validPinCodes = ['2210', '5678', '9876', '4321'];
      
      if (validPinCodes.includes(formData.pin)) {
        validPins = [{ pin: formData.pin }]; // Create a mock response
      } else {
        // Option 2: Try to query the actual table if it exists
        try {
          const { data: dbPins, error: dbError } = await supabase
            .from('valid_pins')
            .select('*');
            
          if (!dbError && dbPins && dbPins.length > 0) {
            // Find the PIN in whatever column structure exists
            const foundPin = dbPins.find(pin => 
              Object.values(pin).some(value => value === formData.pin)
            );
            if (foundPin) {
              validPins = [foundPin];
            }
          }
        } catch (tableError) {
          // Table might not exist, that's ok - we'll use the hardcoded list
          console.log('Using hardcoded PIN validation');
        }
      }

      if (!validPins || validPins.length === 0) {
        setErrors({ pin: 'Código PIN inválido. Verifica tu invitación.' });
        return;
      }

      // No need to check if PIN was already used since multiple people 
      // can use the same PIN (families, friends groups, coworkers, etc.)

      // Submit RSVP
      const { error: insertError } = await supabase
        .from('rsvps')
        .insert([{
          pin_used: formData.pin,
          name: formData.name.trim(),
          attending: formData.attending === 'yes',
          message: formData.message.trim() || null,
          submitted_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      // Success
      setSubmitted(true);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (err) {
      console.error('Error:', err);
      setError('Hubo un error al procesar tu confirmación. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setShowForm(false);
    setSubmitted(false);
    setFormData({ pin: '', name: '', attending: '', message: '' });
    setErrors({});
    setError('');
  };

  return (
    <AnimatePresence mode="wait">
      {!showForm ? (
        // Initial Button
        <motion.button
          key="initial-button"
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-heading font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl animate-pulse group max-w-sm sm:max-w-none mx-auto text-elegant"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="inline w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-spin" />
          <span className="hidden sm:inline">✨ ¡CONFIRMAR ASISTENCIA! ✨</span>
          <span className="sm:hidden">✨ CONFIRMAR ✨</span>
          <ChevronDown className="inline w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:animate-bounce" />
        </motion.button>
      ) : !submitted ? (
        // Modal Form - Futuristic Design
        <motion.div
          key="modal-form"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="modal-overlay fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={handleReset}
        >
          <motion.div
            initial={{ y: 30, rotateX: -10, rotateY: 5 }}
            animate={{ y: 0, rotateX: 0, rotateY: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
            className="modal-container relative perspective-1000 transform-gpu w-full sm:max-w-md h-screen sm:h-auto max-h-screen sm:max-h-[85vh] overflow-y-auto futuristic-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#06b6d4 transparent',
              // Mejorar comportamiento en iOS
              WebkitOverflowScrolling: 'touch',
              // Evitar que el scroll se vaya al mapa en móviles
              touchAction: 'pan-y'
            }}
          >
            {/* Holographic Container */}
            <div className="hologram-card bg-gradient-to-br from-cyan-900/30 via-purple-900/40 to-blue-900/30 backdrop-blur-xl rounded-none sm:rounded-3xl border-0 sm:border border-cyan-400/30 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden pt-12 pb-20 px-4 sm:p-6 min-h-screen sm:min-h-0">
              {/* Animated Background Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(6,182,212,0.03)_25%,rgba(6,182,212,0.03)_26%,transparent_27%,transparent_74%,rgba(6,182,212,0.03)_75%,rgba(6,182,212,0.03)_76%,transparent_77%,transparent),linear-gradient(transparent_24%,rgba(6,182,212,0.03)_25%,rgba(6,182,212,0.03)_26%,transparent_27%,transparent_74%,rgba(6,182,212,0.03)_75%,rgba(6,182,212,0.03)_76%,transparent_77%,transparent)] bg-[size:50px_50px] animate-pulse"></div>
              
              {/* Energy Particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="energy-particles"></div>
              </div>

              {/* Holographic Glitch Lines */}
              <div className="absolute inset-0 hologram-glitch opacity-20"></div>

              {/* Header */}
              <div className="relative flex items-center justify-between mb-4 sm:mb-6 z-10">
                <motion.h3 
                  className="text-xl sm:text-2xl lg:text-3xl font-heading heading-elegant bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <PartyPopper className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
                  </motion.div>
                  <span className="hidden sm:inline holographic-text">Confirmar Asistencia</span>
                  <span className="sm:hidden holographic-text">Confirmar</span>
                </motion.h3>
                
                <motion.button
                  onClick={handleReset}
                  className="relative group p-2 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 hover:border-red-400/60 transition-all duration-200 backdrop-blur-sm"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <X className="w-5 h-5 text-red-300 group-hover:text-red-200 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 blur-lg group-hover:blur-sm transition-all duration-300"></div>
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                {/* PIN Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20, rotateY: -5 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="relative"
                >
                  <motion.label 
                    htmlFor="pin" 
                    className="block text-cyan-200 font-sans text-refined mb-3 flex items-center gap-3 text-sm sm:text-base"
                    animate={{ 
                      textShadow: [
                        "0 0 10px rgba(6,182,212,0.5)",
                        "0 0 20px rgba(6,182,212,0.8)",
                        "0 0 10px rgba(6,182,212,0.5)"
                      ]
                    }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]" />
                    </motion.div>
                    🔒 Código de invitación
                  </motion.label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      id="pin"
                      name="pin"
                      value={formData.pin}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      required
                      maxLength={4}
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-black/60 to-gray-900/60 border border-cyan-400/40 rounded-xl text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-300 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-500 text-center text-xl sm:text-2xl tracking-[0.4em] mono-soft backdrop-blur-sm holographic-text"
                      placeholder="••••"
                      autoComplete="off"
                      style={{
                        textShadow: "0 0 10px rgba(6,182,212,0.8)"
                      }}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 pointer-events-none animate-pulse"></div>
                  </div>
                  
                  <AnimatePresence>
                    {errors.pin && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="text-red-300 text-sm mt-2 p-2 bg-red-500/10 border border-red-400/20 rounded-lg backdrop-blur-sm"
                        style={{ textShadow: "0 0 8px rgba(248,113,113,0.6)" }}
                      >
                        {errors.pin}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <motion.div 
                    className="text-cyan-200/70 text-sm mt-2 text-center"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Código de 4 dígitos de tu invitación
                  </motion.div>
                </motion.div>

                {/* Name Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20, rotateY: -5 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="relative"
                >
                  <motion.label 
                    htmlFor="name" 
                    className="block text-pink-200 font-sans text-refined mb-3 flex items-center gap-3 text-sm sm:text-base"
                    animate={{ 
                      textShadow: [
                        "0 0 10px rgba(236,72,153,0.5)",
                        "0 0 20px rgba(236,72,153,0.8)",
                        "0 0 10px rgba(236,72,153,0.5)"
                      ]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
                    </motion.div>
                    👤 Tu nombre
                  </motion.label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      required
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-black/60 to-gray-900/60 border border-pink-400/40 rounded-xl text-white placeholder-pink-200/50 focus:outline-none focus:border-pink-300 focus:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-500 text-base sm:text-lg font-sans text-elegant backdrop-blur-sm holographic-text"
                      placeholder="Tu nombre completo..."
                      style={{
                        textShadow: "0 0 8px rgba(236,72,153,0.6)"
                      }}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 pointer-events-none animate-pulse"></div>
                  </div>
                  
                  <AnimatePresence>
                    {errors.name && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="text-red-300 text-sm mt-2 p-2 bg-red-500/10 border border-red-400/20 rounded-lg backdrop-blur-sm"
                        style={{ textShadow: "0 0 8px rgba(248,113,113,0.6)" }}
                      >
                        {errors.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Attendance Selection */}
                <motion.div
                  initial={{ opacity: 0, x: -20, rotateY: -5 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="relative"
                >
                  <motion.label 
                    className="block text-orange-200 font-sans text-refined mb-4 flex items-center gap-3 text-sm sm:text-base"
                    animate={{ 
                      textShadow: [
                        "0 0 10px rgba(251,146,60,0.5)",
                        "0 0 20px rgba(251,146,60,0.8)",
                        "0 0 10px rgba(251,146,60,0.5)"
                      ]
                    }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5 text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                    </motion.div>
                    🎉 ¿Podrás asistir?
                  </motion.label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      className={`${getAttendanceClass('yes')} relative group perspective-500 transform-gpu`}
                      onClick={() => handleAttendanceClick('yes')}
                      whileHover={{ 
                        scale: 1.05, 
                        rotateY: 5,
                        boxShadow: "0 0 30px rgba(34,197,94,0.4)"
                      }}
                      whileTap={{ scale: 0.95, rotateY: -5 }}
                      initial={{ rotateY: -20, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-lg group-hover:blur-sm transition-all duration-300"></div>
                      <div className="relative z-10 p-4 border border-green-400/40 rounded-xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm text-center">
                        <motion.div 
                          className="text-2xl sm:text-3xl mb-2"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          ✅
                        </motion.div>
                        <div className="font-heading heading-soft text-sm sm:text-base text-green-200 holographic-text">
                          ¡SÍ VOY!
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      className={`${getAttendanceClass('no')} relative group perspective-500 transform-gpu`}
                      onClick={() => handleAttendanceClick('no')}
                      whileHover={{ 
                        scale: 1.05, 
                        rotateY: -5,
                        boxShadow: "0 0 30px rgba(239,68,68,0.4)"
                      }}
                      whileTap={{ scale: 0.95, rotateY: 5 }}
                      initial={{ rotateY: 20, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl blur-lg group-hover:blur-sm transition-all duration-300"></div>
                      <div className="relative z-10 p-4 border border-red-400/40 rounded-xl bg-gradient-to-br from-red-900/30 to-pink-900/30 backdrop-blur-sm text-center">
                        <motion.div 
                          className="text-2xl sm:text-3xl mb-2"
                          animate={{ 
                            scale: [1, 0.8, 1],
                            opacity: [1, 0.7, 1]
                          }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          ❌
                        </motion.div>
                        <div className="font-heading heading-soft text-sm sm:text-base text-red-200 holographic-text">
                          NO PUEDO
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  <AnimatePresence>
                    {errors.attending && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="text-red-300 text-sm mt-3 p-3 bg-red-500/10 border border-red-400/20 rounded-lg backdrop-blur-sm"
                        style={{ textShadow: "0 0 8px rgba(248,113,113,0.6)" }}
                      >
                        {errors.attending}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Message Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20, rotateY: -5 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  className="relative"
                >
                  <motion.label 
                    htmlFor="message" 
                    className="block text-purple-200 font-sans text-refined mb-3 flex items-center gap-3 text-sm sm:text-base"
                    animate={{ 
                      textShadow: [
                        "0 0 10px rgba(168,85,247,0.5)",
                        "0 0 20px rgba(168,85,247,0.8)",
                        "0 0 10px rgba(168,85,247,0.5)"
                      ]
                    }}
                    transition={{ duration: 2.8, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, -10, 10, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                    </motion.div>
                    💬 Mensaje (opcional)
                  </motion.label>
                  
                  <div className="relative">
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      rows={3}
                      className="mobile-textarea w-full px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-black/60 to-gray-900/60 border border-purple-400/40 rounded-xl text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-300 focus:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-500 resize-none text-sm sm:text-base font-sans text-elegant backdrop-blur-sm holographic-text"
                      placeholder="Mensaje para el cumpleañero... 😊"
                      style={{
                        textShadow: "0 0 8px rgba(168,85,247,0.6)"
                      }}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none animate-pulse"></div>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <div className="submit-button-container">
                  <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative group w-full mt-6 py-3 px-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-400/30 hover:to-blue-400/30 disabled:from-gray-500/20 disabled:to-gray-600/20 disabled:cursor-not-allowed text-white font-heading heading-soft rounded-2xl transition-all duration-300 border border-cyan-400/40 hover:border-cyan-300/60 backdrop-blur-sm overflow-hidden transform-gpu"
                  whileHover={{ 
                    scale: 1.01, 
                    rotateX: 1,
                    boxShadow: "0 0 30px rgba(6,182,212,0.4)"
                  }}
                  whileTap={{ scale: 0.99, rotateX: -1 }}
                  initial={{ opacity: 0, y: 15, rotateX: -5 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  {/* Light Sweep Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out"></div>
                  
                  {/* Glow Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-lg group-hover:blur-sm transition-all duration-500"></div>
                  
                  <div className="relative z-10 flex items-center justify-center gap-3 text-base sm:text-lg">
                    {isSubmitting ? (
                      <>
                        <motion.div 
                          className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-cyan-300 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="holographic-text">
                          <span className="hidden sm:inline">Enviando confirmación...</span>
                          <span className="sm:hidden">Enviando...</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ 
                            x: [0, 3, 0],
                            rotate: [0, 15, 0]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Send className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                        </motion.div>
                        <span className="holographic-text">
                          <span className="hidden sm:inline">🎊 ENVIAR CONFIRMACIÓN</span>
                          <span className="sm:hidden">🎊 ENVIAR</span>
                        </span>
                      </>
                    )}
                  </div>
                </motion.button>
                </div>
              </form>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, rotateX: -20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -20, rotateX: 20 }}
                    className="relative mt-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/40 rounded-xl text-center backdrop-blur-sm overflow-hidden z-10"
                    transition={{ duration: 0.5 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 blur-lg"></div>
                    <div className="relative z-10">
                      <motion.div 
                        className="text-red-300 font-bold text-sm sm:text-base mb-2 holographic-text"
                        animate={{ 
                          textShadow: [
                            "0 0 10px rgba(248,113,113,0.5)",
                            "0 0 20px rgba(248,113,113,0.8)",
                            "0 0 10px rgba(248,113,113,0.5)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ⚠️ Error
                      </motion.div>
                      <div className="text-red-200 text-sm break-words">{error}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        // Success Modal - Futuristic Design (mantener el original)
        <motion.div
          key="success-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={handleReset}
        >
          <motion.div
            initial={{ scale: 0.5, rotateY: -90, rotateX: 30 }}
            animate={{ scale: 1, rotateY: 0, rotateX: 0 }}
            exit={{ scale: 0.5, rotateY: 90, rotateX: -30 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="relative max-w-md w-full perspective-1000 transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Holographic Success Card */}
            <div className="relative bg-gradient-to-br from-emerald-900/20 via-cyan-900/30 to-blue-900/20 backdrop-blur-xl rounded-3xl border border-emerald-400/40 shadow-[0_0_80px_rgba(16,185,129,0.4)] p-8 overflow-hidden">
              
              {/* Particle Explosion Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="energy-particles"></div>
                <motion.div
                  className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2"
                  animate={{
                    scale: [0, 2, 3],
                    opacity: [1, 0.5, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 2, ease: "easeOut" }}
                >
                  <div className="w-full h-full bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 rounded-full blur-xl"></div>
                </motion.div>
              </div>

              {/* Rotating Energy Rings */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-4 left-4 w-16 h-16 border-2 border-emerald-400/40 rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-20 h-20 border-2 border-cyan-400/30 rounded-full"></div>
              </motion.div>

              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-8 right-8 w-12 h-12 border border-blue-400/50 rounded-full"></div>
                <div className="absolute bottom-8 left-8 w-24 h-24 border border-emerald-400/20 rounded-full"></div>
              </motion.div>

              {/* Holographic Glitch Lines */}
              <div className="absolute inset-0 hologram-glitch opacity-30"></div>

              {/* Main Content */}
              <div className="relative z-10 text-center">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: "backOut" }}
                  className="mb-6"
                >
                  <motion.div
                    animate={{ 
                      rotateY: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut"
                    }}
                    className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)]"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ✅
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Success Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-2xl sm:text-3xl font-heading heading-elegant mb-4 bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent holographic-text"
                  style={{ 
                    textShadow: "0 0 20px rgba(16,185,129,0.8)",
                  }}
                >
                  ¡Confirmación Exitosa!
                </motion.h2>

                {/* Success Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="text-emerald-100 mb-6 space-y-2 font-sans"
                >
                  <p className="text-lg text-refined">
                    Gracias {formData.name}! 🎉
                  </p>
                  <p className="text-emerald-200/80 text-elegant">
                    Tu {formData.attending === 'yes' ? 'asistencia ha sido confirmada' : 'respuesta ha sido registrada'}
                  </p>
                  <motion.p
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-sm text-cyan-300"
                  >
                    ¡Nos vemos el 22 de Octubre! 🥳
                  </motion.p>
                </motion.div>

                {/* Close Button */}
                <motion.button
                  onClick={handleReset}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 30px rgba(16,185,129,0.5)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group px-8 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-400/30 hover:to-cyan-400/30 border border-emerald-400/40 hover:border-emerald-300/60 rounded-2xl text-emerald-200 hover:text-emerald-100 font-heading heading-soft transition-all duration-500 overflow-hidden backdrop-blur-sm"
                >
                  {/* Light Sweep Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out"></div>
                  
                  <span className="relative z-10 holographic-text">✨ ¡Perfecto!</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
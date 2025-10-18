import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, PartyPopper, Send, ChevronDown } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

// Animaciones simplificadas y optimizadas
const expandAnimation = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3 }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

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
  
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when submission is successful
  useEffect(() => {
    if (submitted && containerRef.current) {
      containerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [submitted]);

  // Optimizar con useCallback
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleAttendanceClick = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, attending: value }));
    if (errors.attending) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.attending;
        return newErrors;
      });
    }
  }, [errors.attending]);

  const getAttendanceClass = useCallback((type: string) => {
    const isSelected = formData.attending === type;
    const baseClass = 'cursor-pointer p-3 sm:p-4 rounded-xl text-center transition-colors duration-200 border';
    
    if (type === 'yes') {
      return `${baseClass} ${isSelected 
        ? 'bg-green-500/30 border-green-400 text-green-100 shadow-lg' 
        : 'bg-green-500/10 border-green-500/30 text-green-200 hover:bg-green-500/20'}`;
    }
    return `${baseClass} ${isSelected 
      ? 'bg-red-500/30 border-red-400 text-red-100 shadow-lg' 
      : 'bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/20'}`;
  }, [formData.attending]);

  const validateForm = useCallback(() => {
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
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const validPinCodes = ['2210', '5678', '9876', '4321'];
      
      if (!validPinCodes.includes(formData.pin)) {
        setErrors({ pin: 'Código PIN inválido. Verifica tu invitación.' });
        setIsSubmitting(false);
        return;
      }

      const supabase = getSupabaseClient();
      
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

      setSubmitted(true);
      
      // Lanzar confetti desde múltiples posiciones para mejor visibilidad
      if (!prefersReducedMotion) {
        // Confetti desde el centro
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.5, x: 0.5 }
        });
        
        // Confetti desde los lados con un pequeño delay
        setTimeout(() => {
          confetti({
            particleCount: 30,
            angle: 60,
            spread: 55,
            origin: { y: 0.5, x: 0 }
          });
          confetti({
            particleCount: 30,
            angle: 120,
            spread: 55,
            origin: { y: 0.5, x: 1 }
          });
        }, 100);
      }

    } catch (err) {
      console.error('Error:', err);
      setError('Hubo un error al procesar tu confirmación. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, prefersReducedMotion]);

  const handleReset = useCallback(() => {
    setShowForm(false);
    setSubmitted(false);
    setFormData({ pin: '', name: '', attending: '', message: '' });
    setErrors({});
    setError('');
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <div className="w-full">
            {/* Button simplificado */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-heading font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-base sm:text-lg transition-colors duration-200 shadow-lg group text-elegant"
              style={{
                animation: showForm ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            >
              <Sparkles className="inline w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">
                {showForm ? '✨ OCULTAR FORMULARIO ✨' : '✨ ¡CONFIRMAR ASISTENCIA! ✨'}
              </span>
              <span className="sm:hidden">
                {showForm ? '✨ OCULTAR ✨' : '✨ CONFIRMAR ✨'}
              </span>
              <ChevronDown 
                className="inline w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform duration-200" 
                style={{ transform: showForm ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {/* Formulario expandible */}
            <AnimatePresence>
              {showForm && (
                <motion.div {...expandAnimation} className="overflow-hidden">
                  <div className="mt-6 bg-gradient-to-br from-cyan-900/30 via-purple-900/40 to-blue-900/30 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-lg relative p-6">
                    
                    {/* Efectos visuales de fondo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-3xl pointer-events-none"></div>
                    
                    {/* Header simplificado */}
                    <div className="relative flex items-center justify-between mb-6 z-10">
                      <h3 className="text-xl sm:text-2xl font-heading bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent flex items-center gap-3">
                        <PartyPopper className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
                        <span className="hidden sm:inline">Confirmar Asistencia</span>
                        <span className="sm:hidden">Confirmar</span>
                      </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="relative space-y-4 z-10">
                      {/* PIN Input */}
                      <div>
                        <label htmlFor="pin" className="block text-cyan-200 font-sans mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          🔒 Código de invitación
                        </label>
                        
                        <input
                          type="text"
                          id="pin"
                          name="pin"
                          value={formData.pin}
                          onChange={handleInputChange}
                          required
                          maxLength={4}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full px-4 py-3 bg-black/60 border border-cyan-400/40 rounded-xl text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-300 transition-colors duration-200 text-center text-xl tracking-widest"
                          placeholder="••••"
                          autoComplete="off"
                        />
                        
                        {errors.pin && (
                          <div className="text-red-300 text-sm mt-2 p-2 bg-red-500/10 border border-red-400/20 rounded-lg">
                            {errors.pin}
                          </div>
                        )}
                        
                        <div className="text-cyan-200/70 text-sm mt-2 text-center">
                          Código de 4 dígitos de tu invitación
                        </div>
                      </div>

                      {/* Name Input */}
                      <div>
                        <label htmlFor="name" className="block text-pink-200 font-sans mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <Heart className="w-4 h-4 text-pink-400" />
                          👤 Tu nombre
                        </label>
                        
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-black/60 border border-pink-400/40 rounded-xl text-white placeholder-pink-200/50 focus:outline-none focus:border-pink-300 transition-colors duration-200 text-base sm:text-lg"
                          placeholder="Tu nombre completo..."
                        />
                        
                        {errors.name && (
                          <div className="text-red-300 text-sm mt-2 p-2 bg-red-500/10 border border-red-400/20 rounded-lg">
                            {errors.name}
                          </div>
                        )}
                      </div>

                      {/* Attendance Selection */}
                      <div>
                        <label className="block text-orange-200 font-sans mb-3 flex items-center gap-2 text-sm sm:text-base">
                          <PartyPopper className="w-4 h-4 text-orange-400" />
                          🎉 ¿Podrás asistir?
                        </label>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div
                            className={getAttendanceClass('yes')}
                            onClick={() => handleAttendanceClick('yes')}
                          >
                            <div className="text-2xl sm:text-3xl mb-2">✅</div>
                            <div className="font-heading text-sm sm:text-base">¡SÍ VOY!</div>
                          </div>
                          
                          <div
                            className={getAttendanceClass('no')}
                            onClick={() => handleAttendanceClick('no')}
                          >
                            <div className="text-2xl sm:text-3xl mb-2">❌</div>
                            <div className="font-heading text-sm sm:text-base">NO PUEDO</div>
                          </div>
                        </div>
                        
                        {errors.attending && (
                          <div className="text-red-300 text-sm mt-3 p-2 bg-red-500/10 border border-red-400/20 rounded-lg">
                            {errors.attending}
                          </div>
                        )}
                      </div>

                      {/* Message Input */}
                      <div>
                        <label htmlFor="message" className="block text-purple-200 font-sans mb-2 flex items-center gap-2 text-sm sm:text-base">
                          💬 Mensaje para mi o sugerencia sobre el tono ? Igual no se tomara en cuenta pero ya lo escribiste XD (opcional)
                        </label>
                        
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 bg-black/60 border border-purple-400/40 rounded-xl text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-300 transition-colors duration-200 resize-none text-sm sm:text-base"
                          placeholder="cri cri cri ... 😊"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-400/30 hover:to-blue-400/30 disabled:from-gray-500/20 disabled:to-gray-600/20 disabled:cursor-not-allowed text-white font-heading rounded-2xl transition-colors duration-200 border border-cyan-400/40 hover:border-cyan-300/60 shadow-lg"
                      >
                        <div className="flex items-center justify-center gap-3 text-base sm:text-lg">
                          {isSubmitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                              <span>Enviando...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 text-cyan-300" />
                              <span>🎊 ENVIAR CONFIRMACIÓN</span>
                            </>
                          )}
                        </div>
                      </button>
                    </form>

                    {/* Error Message */}
                    {error && (
                      <div className="relative mt-6 p-4 bg-red-500/20 border border-red-400/40 rounded-xl text-center z-10">
                        <div className="text-red-300 font-bold text-sm sm:text-base mb-2">
                          ⚠️ Error
                        </div>
                        <div className="text-red-200 text-sm">{error}</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          // Success Card
          <motion.div {...fadeIn} className="w-full mt-6">
            <div className="bg-gradient-to-br from-emerald-900/20 via-cyan-900/30 to-blue-900/20 backdrop-blur-xl rounded-3xl border border-emerald-400/40 shadow-lg p-6 sm:p-8">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg mb-6 overflow-hidden">
                  <img 
                    src="/videos/beer-german.gif" 
                    alt="Celebración" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <h2 className="text-2xl sm:text-3xl font-heading mb-4 bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  {formData.attending === 'yes' 
                    ? '¡Buena bocina! Sabia decisión' 
                    : '¡Igual no pensaba invitarte! XD chistín chistín'}
                </h2>

                <div className="text-emerald-100 mb-6 space-y-2">
                  <p className="text-lg">Gracias {formData.name}! 🎉</p>
                  <p className="text-emerald-200/80">
                    Tu {formData.attending === 'yes' ? 'asistencia ha sido confirmada' : 'respuesta ha sido registrada'}
                  </p>
                  {formData.attending === 'yes' && (
                    <p className="text-sm text-cyan-300">
                      ¡Nos vemos el 22 de Octubre! 🥳
                    </p>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-400/30 hover:to-cyan-400/30 border border-emerald-400/40 hover:border-emerald-300/60 rounded-2xl text-emerald-200 hover:text-emerald-100 font-heading transition-colors duration-200"
                >
                  ✨ ¡Perfecto!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export default function RSVPForm() {
  const [formData, setFormData] = useState({
    pin: '',
    name: '',
    attending: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Format PIN input
    if (name === 'pin') {
      const formattedValue = value.replace(/[^0-9]/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when user starts typing
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

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.pin || formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'Ingresa el código de 4 dígitos que recibiste';
    }
    
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Por favor, ingresa tu nombre';
    }
    
    if (!formData.attending) {
      newErrors.attending = 'Por favor, selecciona una opción';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setErrors({});
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate PIN
      const { data: validPins, error: pinError } = await supabase
        .from('valid_pins')
        .select('pin_code')
        .eq('pin_code', formData.pin)
        .eq('is_active', true)
        .single();

      if (pinError || !validPins) {
        throw new Error('Código de invitación incorrecto. Verifica el código de 4 dígitos que recibiste.');
      }

      // Submit RSVP
      const { error: submitError } = await supabase
        .from('rsvps')
        .insert([{
          name: formData.name.trim(),
          attending: formData.attending === 'yes',
          message: formData.message.trim() || null,
          pin_used: formData.pin,
          submitted_at: new Date().toISOString()
        }]);

      if (submitError) throw submitError;

      setSubmitted(true);
      setFormData({ pin: '', name: '', attending: '', message: '' });
      
    } catch (err: any) {
      console.error('Error submitting RSVP:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttendanceClass = (value: string) => {
    const baseClasses = 'p-6 rounded-lg text-center transition-all duration-300 transform hover:scale-105 border-2 cursor-pointer';
    
    if (formData.attending === value) {
      return value === 'yes' 
        ? `${baseClasses} bg-green-500/20 border-green-500 text-green-400`
        : `${baseClasses} bg-red-500/20 border-red-500 text-red-400`;
    }
    
    return `${baseClasses} bg-black/30 border-purple-400/50 text-purple-200 hover:border-purple-400`;
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PIN Input */}
        <div>
          <label htmlFor="pin" className="block text-purple-200 font-medium mb-2">
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
            className="w-full px-4 py-3 bg-black/50 border border-purple-400/50 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 text-center text-2xl tracking-widest font-mono"
            placeholder="••••"
            autoComplete="off"
          />
          {errors.pin && (
            <div className="text-red-400 text-sm mt-1">{errors.pin}</div>
          )}
          <div className="text-purple-300 text-xs mt-1">
            💡 Ingresa el código de 4 dígitos que recibiste con la invitación
          </div>
        </div>

        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-purple-200 font-medium mb-2">
            👤 Tu nombre
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-black/50 border border-purple-400/50 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
            placeholder="Escribe tu nombre aquí..."
          />
          {errors.name && (
            <div className="text-red-400 text-sm mt-1">{errors.name}</div>
          )}
        </div>

        {/* Attendance Selection */}
        <div>
          <label className="block text-purple-200 font-medium mb-4">
            🎉 ¿Podrás asistir?
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={getAttendanceClass('yes')}
              onClick={() => handleAttendanceClick('yes')}
            >
              <div className="text-2xl mb-2">✅</div>
              <div className="font-semibold">¡SÍ, AHÍ ESTARÉ!</div>
            </div>
            
            <div
              className={getAttendanceClass('no')}
              onClick={() => handleAttendanceClick('no')}
            >
              <div className="text-2xl mb-2">❌</div>
              <div className="font-semibold">NO PUEDO IR</div>
            </div>
          </div>
          {errors.attending && (
            <div className="text-red-400 text-sm mt-2">{errors.attending}</div>
          )}
        </div>

        {/* Message Input */}
        <div>
          <label htmlFor="message" className="block text-purple-200 font-medium mb-2">
            💬 Mensaje (opcional)
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 bg-black/50 border border-purple-400/50 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 resize-none"
            placeholder="¿Algún mensaje para el cumpleañero? 😊"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? '⏳ Enviando...' : '🎊 CONFIRMAR ASISTENCIA'}
        </button>
      </form>

      {/* Success Message */}
      {submitted && (
        <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-center">
          <div className="text-2xl mb-2">🎉</div>
          <div className="text-green-400 font-semibold">¡Confirmación enviada!</div>
          <div className="text-green-300 text-sm">Gracias por confirmar tu asistencia</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-center">
          <div className="text-red-400 font-semibold">Error al enviar</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

interface RSVP {
  id: number;
  name: string;
  attending: boolean;
  message: string | null;
  pin_used: string;
  submitted_at: string;
}

interface Stats {
  attending: number;
  notAttending: number;
  total: number;
}

export default function AdminDashboard() {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [stats, setStats] = useState<Stats>({ attending: 0, notAttending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRSVPs();
  }, []);

  const loadRSVPs = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('rsvps')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRsvps(data || []);
      
      // Calculate stats
      const attending = data?.filter(r => r.attending).length || 0;
      const notAttending = data?.filter(r => !r.attending).length || 0;
      const total = data?.length || 0;
      
      setStats({ attending, notAttending, total });
      
    } catch (err: any) {
      console.error('Error loading RSVPs:', err);
      setError(`Error al cargar las respuestas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            📊 Respuestas de Invitación
          </div>
          <div className="text-purple-200 text-xl">Cargando respuestas... ⏳</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
          📊 Respuestas de Invitación
        </h1>
        <p className="text-purple-200 text-xl">
          Lista de confirmaciones para el cumpleaños
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-400">{stats.attending}</div>
          <div className="text-green-200">Confirmaron</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30 text-center">
          <div className="text-3xl mb-2">❌</div>
          <div className="text-2xl font-bold text-red-400">{stats.notAttending}</div>
          <div className="text-red-200">No vienen</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 text-center">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold text-purple-400">{stats.total}</div>
          <div className="text-purple-200">Total</div>
        </div>
      </div>

      {/* RSVP List */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden">
        <div className="p-6 border-b border-purple-500/30">
          <h2 className="text-2xl font-bold text-white">Lista de Respuestas</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/50">
              <tr>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">Nombre</th>
                <th className="px-6 py-4 text-center text-purple-200 font-semibold">Asistencia</th>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">Mensaje</th>
                <th className="px-6 py-4 text-center text-purple-200 font-semibold">PIN</th>
                <th className="px-6 py-4 text-center text-purple-200 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/20">
              {error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : rsvps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-purple-300">
                    No hay respuestas todavía 📭
                  </td>
                </tr>
              ) : (
                rsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{rsvp.name}</td>
                    <td className={`px-6 py-4 text-center ${rsvp.attending ? 'text-green-400' : 'text-red-400'}`}>
                      {rsvp.attending ? '✅ Sí va' : '❌ No va'}
                    </td>
                    <td className="px-6 py-4 text-purple-200">
                      {rsvp.message ? (
                        <span>{rsvp.message}</span>
                      ) : (
                        <em>Sin mensaje</em>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-yellow-400 font-mono text-lg">
                      {rsvp.pin_used}
                    </td>
                    <td className="px-6 py-4 text-center text-purple-300 text-sm">
                      {formatDate(rsvp.submitted_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center mt-8">
        <a 
          href="/" 
          className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
        >
          ← Volver a la invitación
        </a>
      </div>
    </div>
  );
}
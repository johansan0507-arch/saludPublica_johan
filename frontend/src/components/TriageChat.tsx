import React, { useState } from 'react';
import { analyzeSymptomsWithGemini } from '../services/geminiService';
import { TriageAnalysis } from '../types';
import { Bot, Send, Sparkles, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

interface TriageChatProps {
  onSelectSpecialtyForBooking: (specialtyName: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  analysis?: TriageAnalysis;
  timestamp: string;
}

export const TriageChat: React.FC<TriageChatProps> = ({ onSelectSpecialtyForBooking }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '¡Hola! Soy tu Asistente Inteligente de Triaje Médico impulsado por Google Gemini. Por favor cuéntame qué síntomas presentas, desde cuándo los sientes y con qué intensidad, para orientarte a la especialidad médica indicada.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await analyzeSymptomsWithGemini(userText);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `He analizado tus síntomas. Te recomiendo agendar consulta con el servicio de ${result.recommendedSpecialty}.`,
        analysis: result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Ocurrió un inconveniente al procesar tus síntomas con el servicio de IA. Te sugerimos acudir a Medicina General para una primera evaluación.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Tengo dolor intenso en una muela inferior y encía inflamada desde ayer',
    'Mi hijo de 5 años tiene fiebre de 38.5 y tos seca persistente',
    'Siento opresión fuerte en el pecho y palpitaciones rápidas',
    'Tengo dolor abdominal tipo cólico y náuseas leves tras comer',
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header Clinical Impeccable */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-clinical-50 text-clinical-700 border border-clinical-200">
            <Sparkles className="h-3.5 w-3.5 text-clinical-600" />
            Impulsado por Google Gemini AI
          </span>
          <span className="text-xs text-slate-500 font-medium">Triaje Clínico Automatizado</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Orientación Médica Inteligente
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Describe tus síntomas en lenguaje natural. Nuestra IA clasificará la urgencia y te sugerirá la especialidad más adecuada para tu turno médico de 20 minutos.
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col h-[560px] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clinical-600 text-white shadow-xs">
                  <Bot className="h-5 w-5" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-clinical-600 text-white rounded-br-xs shadow-xs font-medium'
                    : 'bg-slate-50 text-slate-900 border border-slate-200/70 rounded-bl-xs'
                }`}
              >
                <p>{msg.text}</p>

                {/* Analysis Card if available */}
                {msg.analysis && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    
                    {/* Urgency Badge & Specialty */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Especialidad:</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-clinical-100 text-clinical-900 border border-clinical-200">
                          {msg.analysis.recommendedSpecialty}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-500">Prioridad:</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                            msg.analysis.urgency === 'Alta'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : msg.analysis.urgency === 'Media'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {msg.analysis.urgency === 'Alta' ? (
                            <ShieldAlert className="h-3 w-3" />
                          ) : msg.analysis.urgency === 'Media' ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {msg.analysis.urgency}
                        </span>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80">
                      <p className="font-semibold text-slate-900 mb-1">Criterio clínico:</p>
                      <p>{msg.analysis.reasoning}</p>
                    </div>

                    {/* Recommendations */}
                    {msg.analysis.recommendations && msg.analysis.recommendations.length > 0 && (
                      <div className="text-xs text-slate-600 bg-slate-100/70 p-3 rounded-xl">
                        <p className="font-semibold text-slate-800 mb-1">Pautas preventivas inmediatas:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {msg.analysis.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Button: Book in this specialty */}
                    <button
                      onClick={() => onSelectSpecialtyForBooking(msg.analysis!.recommendedSpecialty)}
                      className="mt-2 w-full flex items-center justify-center gap-2 bg-clinical-600 hover:bg-clinical-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-colors group"
                    >
                      <span>Agendar turno en {msg.analysis.recommendedSpecialty}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                )}

                <span
                  className={`mt-1.5 block text-[10px] ${
                    msg.sender === 'user' ? 'text-clinical-100 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Loading Skeleton Indicator */}
          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clinical-600 text-white animate-pulse">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-clinical-600" />
                <span>Google Gemini analizando cuadro clínico y especialidad...</span>
              </div>
            </div>
          )}
        </div>

        {/* Example Quick Prompts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/60 overflow-x-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
            <span className="font-medium text-slate-700">Ejemplos rápidos:</span>
            {samplePrompts.map((sample, i) => (
              <button
                key={i}
                onClick={() => setInput(sample)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs transition-colors active:scale-98"
              >
                {sample.slice(0, 32)}...
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe lo que sientes (ej: dolor de muela, fiebre en mi hijo, palpitaciones)..."
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-clinical-600 focus:outline-none transition-colors disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-clinical-600 hover:bg-clinical-700 disabled:bg-slate-300 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Evaluar</span>
          </button>
        </form>
      </div>
    </div>
  );
};

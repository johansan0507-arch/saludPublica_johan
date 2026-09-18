import { TriageAnalysis } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function analyzeSymptomsWithGemini(symptoms: string): Promise<TriageAnalysis> {
  // 1. Si la API Key de Google Gemini está configurada, llamar a la API de Gemini
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'tu_api_key_aqui' && GEMINI_API_KEY !== 'tu_api_key_de_google_ai') {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const prompt = `
Eres el Asistente Experto de Triaje Clínico de "SaludPública Connect" para centros de salud públicos.
Tu labor es orientar al paciente hacia la especialidad médica adecuada analizando sus síntomas.

Las 5 únicas especialidades médicas disponibles en el centro de salud son:
1. "Medicina General" (dolores comunes, resfriados, malestar general, dolor abdominal, chequeos).
2. "Pediatría" (síntomas en bebés, niños y adolescentes menores de 18 años).
3. "Odontología" (dolor dental, muelas, encías, problemas bucales, caries).
4. "Ginecología" (salud sexual y reproductiva femenina, ciclo menstrual, embarazo).
5. "Cardiología" (palpitaciones, dolor o presión en el pecho, hipertensión, fatiga severa).

Síntomas reportados por el paciente:
"${symptoms}"

Debes responder ÚNICAMENTE con un objeto JSON válido (sin formato markdown adicional ni bloques \`\`\`json) con esta estructura exacta:
{
  "recommendedSpecialty": "Nombre exacto de la especialidad",
  "urgency": "Baja" | "Media" | "Alta",
  "reasoning": "Explicación empática y clara de por qué se recomienda esta consulta médica.",
  "recommendations": ["Recomendación preventiva 1", "Recomendación preventiva 2"]
}
`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          const parsed = JSON.parse(textResponse) as TriageAnalysis;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Fallo en la llamada directa a Gemini API, usando triaje heurístico de respaldo:', err);
    }
  }

  // 2. Triaje Heurístico Clínico de Respaldo (Garantiza funcionamiento siempre, incluso offline o sin API Key)
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simula tiempo de procesamiento de IA

  const text = symptoms.toLowerCase();

  if (text.includes('diente') || text.includes('muela') || text.includes('boca') || text.includes('encia') || text.includes('caries')) {
    return {
      recommendedSpecialty: 'Odontología',
      urgency: text.includes('fuerte') || text.includes('insoportable') || text.includes('hinch') ? 'Media' : 'Baja',
      reasoning: 'Tus síntomas están localizados en la cavidad oral y piezas dentales. Es indispensable la valoración por un odontólogo para evaluar caries, encías o posibles infecciones.',
      recommendations: [
        'Evita alimentos o bebidas extremadamente frías, calientes o azucaradas.',
        'No coloques analgésicos o sustancias directamente sobre la muela o encía.',
        'Realiza enjuagues suaves con agua tibia y sal de forma preventiva.'
      ],
    };
  }

  if (text.includes('niño') || text.includes('bebe') || text.includes('hijo') || text.includes('hija') || text.includes('pediatra')) {
    return {
      recommendedSpecialty: 'Pediatría',
      urgency: text.includes('fiebre') || text.includes('vomito') ? 'Media' : 'Baja',
      reasoning: 'Los pacientes pediátricos requieren una evaluación especializada para su etapa de desarrollo y dosificación precisa según su peso y edad.',
      recommendations: [
        'Mantén al menor hidratado con suero oral o agua según su edad.',
        'Monitorea la temperatura con termómetro cada 4 a 6 horas.',
        'Si presenta dificultad para respirar o letargo, acude a urgencias inmediatamente.'
      ],
    };
  }

  if (text.includes('pecho') || text.includes('corazon') || text.includes('palpitacion') || text.includes('presion') || text.includes('taquicardia')) {
    return {
      recommendedSpecialty: 'Cardiología',
      urgency: 'Alta',
      reasoning: 'Los síntomas relacionados con opresión torácica, palpitaciones o presión arterial deben ser evaluados prioritariamente por un especialista en cardiología.',
      recommendations: [
        'Guarda reposo sentado en un lugar ventilado y evita esfuerzos físicos.',
        'Si el dolor se irradia hacia el brazo izquierdo, cuello o mandíbula, trasládate de inmediato a urgencias.',
        'Evita el consumo de bebidas con cafeína, energizantes o tabaco.'
      ],
    };
  }

  if (text.includes('embarazo') || text.includes('menstruac') || text.includes('regla') || text.includes('ovario') || text.includes('mujer') || text.includes('vaginal')) {
    return {
      recommendedSpecialty: 'Ginecología',
      urgency: text.includes('sangrado') || text.includes('dolor agudo') ? 'Media' : 'Baja',
      reasoning: 'Tus síntomas corresponden a la salud reproductiva y hormonal femenina, la cual debe ser atendida por el servicio de Ginecología.',
      recommendations: [
        'Anota la fecha de tu última menstruación para facilitarle el historial al especialista.',
        'Evita automedicarte con analgésicos fuertes antes de la revisión.',
        'Lleva un registro de los días y características del malestar.'
      ],
    };
  }

  // Por defecto: Medicina General
  return {
    recommendedSpecialty: 'Medicina General',
    urgency: text.includes('fiebre alta') || text.includes('dolor severo') ? 'Media' : 'Baja',
    reasoning: 'Tus síntomas corresponden a una consulta de atención primaria. El médico general realizará el diagnóstico inicial y, de ser necesario, te derivará a la especialidad correspondiente.',
    recommendations: [
      'Mantén una adecuada hidratación y descanso.',
      'No tomes antibióticos sin una fórmula médica expresa.',
      'Lleva un registro de los síntomas y su hora de inicio para el día de la cita.'
    ],
  };
}

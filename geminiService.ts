import { GoogleGenAI } from "@google/genai";

type PracticeTextResult = {
  text: string;
  source: "ai" | "local";
  note?: string;
};

type FeedbackOptions = {
  allowAI?: boolean;
};

const USAGE_KEY = "typemaster.gemini.usage.v2";
const WINDOW_MS = 60_000;
const DEFAULT_MODEL = "gemini-flash-latest";
const DEFAULT_PER_MINUTE_LIMIT = 15;

const LOCAL_PARAGRAPHS = [
  "No modo treino, mantenha os dedos em asdf jkl; e digite no ritmo da respiracao para ganhar consistencia.",
  "Uma equipe gamer entrou no mapa secreto e precisou escrever comandos rapidos para abrir cada portal.",
  "Em uma cidade digital, cada tecla certa ativa um drone de apoio, enquanto cada erro pede calma e foco.",
  "No desafio de {theme}, voce alterna velocidade e precisao para manter combo alto ate o fim da fase.",
  "Quando errar, ajuste postura, volte ao centro do teclado e retome o fluxo sem pressa.",
  "Seu objetivo e completar textos maiores sem quebrar o ritmo, com maos leves e olhos na tela.",
];

function readEnv(...keys: string[]): string {
  const metaEnv = ((import.meta as any).env || {}) as Record<string, string | undefined>;
  const procEnv = ((typeof process !== "undefined" ? process.env : {}) || {}) as Record<string, string | undefined>;

  for (const key of keys) {
    const raw = metaEnv[key] ?? procEnv[key];
    if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  }
  return "";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class GeminiService {
  private ai: GoogleGenAI;
  private model: string;
  private requestsPerMinute: number;
  private enabled: boolean;
  private memoryUsageTimestamps: number[] = [];

  constructor() {
    const apiKey = readEnv("GEMINI_API_KEY", "VITE_GEMINI_API_KEY", "API_KEY");
    this.model = readEnv("GEMINI_MODEL", "VITE_GEMINI_MODEL") || DEFAULT_MODEL;

    const perMinuteRaw = readEnv(
      "GEMINI_PER_MINUTE_LIMIT",
      "VITE_GEMINI_PER_MINUTE_LIMIT",
      "GEMINI_RATE_LIMIT_PER_MINUTE"
    );
    const parsed = Number.parseInt(perMinuteRaw, 10);
    this.requestsPerMinute = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PER_MINUTE_LIMIT;

    this.enabled = Boolean(apiKey);
    this.ai = new GoogleGenAI({ apiKey });
  }

  private readUsageTimestamps(): number[] {
    try {
      const raw = localStorage.getItem(USAGE_KEY);
      if (!raw) return this.memoryUsageTimestamps;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return this.memoryUsageTimestamps;
      return parsed.filter((x): x is number => Number.isFinite(x) && x > 0);
    } catch {
      return this.memoryUsageTimestamps;
    }
  }

  private saveUsageTimestamps(timestamps: number[]) {
    this.memoryUsageTimestamps = timestamps;
    try {
      localStorage.setItem(USAGE_KEY, JSON.stringify(timestamps));
    } catch {
      // ignore storage issues and keep memory fallback
    }
  }

  private pruneWindow(timestamps: number[], now: number): number[] {
    return timestamps.filter((ts) => now - ts < WINDOW_MS);
  }

  private tryConsumeQuota(): { ok: boolean; reason?: "no_api_key" | "rate_limited"; retryAfterSec?: number } {
    if (!this.enabled) return { ok: false, reason: "no_api_key" };

    const now = Date.now();
    const timestamps = this.pruneWindow(this.readUsageTimestamps(), now);

    if (timestamps.length >= this.requestsPerMinute) {
      const oldest = timestamps[0];
      const msUntilNext = Math.max(1, WINDOW_MS - (now - oldest));
      const retryAfterSec = Math.ceil(msUntilNext / 1000);
      this.saveUsageTimestamps(timestamps);
      return { ok: false, reason: "rate_limited", retryAfterSec };
    }

    timestamps.push(now);
    this.saveUsageTimestamps(timestamps);
    return { ok: true };
  }

  private buildLocalPracticeText(theme: string, minChars: number): string {
    const safeMinChars = Math.max(260, minChars);
    const chunks: string[] = [
      `Tema atual: ${theme}.`,
      "Desafio longo em modo local para economizar chamadas da IA.",
    ];

    while (chunks.join(" ").length < safeMinChars) {
      chunks.push(pick(LOCAL_PARAGRAPHS).replaceAll("{theme}", theme));
    }

    return chunks.join(" ");
  }

  private localFeedback(wpm: number, accuracy: number): string {
    if (accuracy >= 96 && wpm >= 55) return "Run forte: ritmo alto e precisao alta. Mantem esse padrao.";
    if (accuracy < 90) return "Prioriza precisao por 2 runs. Velocidade vem logo depois.";
    if (wpm < 35) return "Boa base. Agora tenta aumentar ritmo sem perder controle.";
    return "Progresso consistente. Respira, foco no centro e continua.";
  }

  private quotaNote(reason: "no_api_key" | "rate_limited", retryAfterSec?: number) {
    if (reason === "rate_limited") {
      const wait = retryAfterSec ? ` Aguarda ${retryAfterSec}s e tenta de novo.` : "";
      return `Modo local ativo: limite de ${this.requestsPerMinute} chamadas por minuto atingido.${wait}`;
    }
    return "Modo local ativo: configure GEMINI_API_KEY no .env.local.";
  }

  async generatePracticeText(theme: string = "science fiction", minChars = 520): Promise<PracticeTextResult> {
    const safeTheme = theme.trim() || "ficcao cientifica";
    const localText = this.buildLocalPracticeText(safeTheme, minChars);

    const quota = this.tryConsumeQuota();
    if (!quota.ok) {
      return {
        text: localText,
        source: "local",
        note: this.quotaNote(quota.reason as "no_api_key" | "rate_limited", quota.retryAfterSec),
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `Generate a fun, engaging practice paragraph for a teenager learning to type.
                  Theme: ${safeTheme}.
                  Requirements: Between ${minChars}-${minChars + 180} characters. Use common words but include some punctuation.
                  Language: Portuguese (BR).`,
        config: {
          temperature: 0.8,
        },
      });

      const text = response.text?.trim();
      if (!text) {
        return {
          text: localText,
          source: "local",
          note: "Modo local ativo: resposta vazia da IA.",
        };
      }

      return {
        text: text.length >= minChars ? text : `${text} ${localText}`,
        source: "ai",
      };
    } catch (error) {
      console.error("Error generating text:", error);
      return {
        text: localText,
        source: "local",
        note: "Modo local ativo: falha temporaria da IA.",
      };
    }
  }

  async getFeedback(wpm: number, accuracy: number, options: FeedbackOptions = {}): Promise<string> {
    const fallback = this.localFeedback(wpm, accuracy);
    if (!options.allowAI) return fallback;

    const quota = this.tryConsumeQuota();
    if (!quota.ok) return fallback;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `Give a very short, cool, and encouraging feedback in Portuguese (BR) for a teenager typing at ${wpm} WPM with ${accuracy}% accuracy. Use gamer slang if appropriate.`,
      });
      return response.text?.trim() || fallback;
    } catch {
      return fallback;
    }
  }
}

export const geminiService = new GeminiService();

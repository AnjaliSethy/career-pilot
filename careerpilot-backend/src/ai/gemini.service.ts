import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { ZodType, ZodTypeDef } from 'zod';
import { PrismaService } from '../prisma/prisma.service';

export interface StructuredRequest<T> {
  userId: string;
  purpose: string;
  systemInstruction: string;
  prompt: string;
  schema: ZodType<T, ZodTypeDef, unknown>;
  temperature?: number;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenAI | null = null;

  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {
    const key = this.config.get<string>('GEMINI_API_KEY');
    if (key) this.client = new GoogleGenAI({ apiKey: key });
    else this.logger.warn('GEMINI_API_KEY not set: AI features are disabled');
  }

  get model(): string {
    return this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Calls Gemini in JSON mode and validates the result with Zod.
   * Malformed JSON or schema violations are retried (bounded); every attempt is usage-logged.
   */
  async generateStructured<T>(req: StructuredRequest<T>): Promise<T> {
    if (!this.client) throw new ServiceUnavailableException('Gemini is not configured. Set GEMINI_API_KEY.');
    const maxRetries = Number(this.config.get('GEMINI_MAX_RETRIES') ?? 2);
    const timeout = Number(this.config.get('GEMINI_TIMEOUT_MS') ?? 60000);
    let lastError = 'unknown';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const started = Date.now();
      try {
        const res = await this.client.models.generateContent({
          model: this.model,
          contents: req.prompt,
          config: {
            systemInstruction: req.systemInstruction,
            responseMimeType: 'application/json',
            temperature: req.temperature ?? 0.1,
            httpOptions: { timeout },
          },
        });
        const text = res.text ?? '';
        const parsed = req.schema.safeParse(JSON.parse(stripFences(text)));
        if (!parsed.success) throw new Error(`Schema validation failed: ${parsed.error.issues[0]?.message}`);
        await this.logUsage(req, started, true, res.usageMetadata);
        return parsed.data;
      } catch (e) {
        lastError = (e as Error).message;
        await this.logUsage(req, started, false, undefined, lastError);
        this.logger.warn(`Gemini ${req.purpose} attempt ${attempt + 1} failed: ${lastError}`);
        if (attempt < maxRetries) await sleep(500 * 2 ** attempt);
      }
    }
    throw new ServiceUnavailableException('AI request failed after retries. Please try again.');
  }

  private logUsage(
    req: StructuredRequest<unknown>,
    started: number,
    success: boolean,
    usage?: { promptTokenCount?: number; candidatesTokenCount?: number },
    error?: string,
  ) {
    return this.prisma.aiUsageLog
      .create({
        data: {
          userId: req.userId,
          purpose: req.purpose,
          model: this.model,
          inputTokens: usage?.promptTokenCount,
          outputTokens: usage?.candidatesTokenCount,
          latencyMs: Date.now() - started,
          success,
          error: error?.slice(0, 500),
        },
      })
      .catch((e) => this.logger.error('Failed to log AI usage', e));
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stripFences = (s: string) => s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
  }

  async suggestTags(title: string, description: string): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a tagging assistant for an exam preparation platform. Given a question title and description, suggest 3-5 relevant tags. Return ONLY a JSON array of lowercase strings. Example: ["calculus","integration","jee"]',
          },
          { role: 'user', content: `Title: ${title}\n\nDescription: ${description.slice(0, 500)}` },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content?.trim() || '[]';
      return JSON.parse(content);
    } catch (error) {
      // H-4 fix: log the raw error internally but never expose API details to clients
      this.logger.error('Tag suggestion failed', error instanceof Error ? error.message : error);
      return []; // graceful fallback — tag suggestion is non-critical
    }
  }

  async suggestAnswer(questionTitle: string, questionDescription: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert exam preparation assistant. Provide a detailed, well-structured answer to the given exam question. Use markdown formatting with headings, steps, and formulas where appropriate.',
          },
          {
            role: 'user',
            content: `Question: ${questionTitle}\n\nDetails: ${questionDescription.slice(0, 1000)}\n\nProvide a comprehensive answer:`,
          },
        ],
        max_tokens: 800,
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      // H-4 fix: wrap raw error in a safe HTTP exception
      this.logger.error('Answer suggestion failed', error instanceof Error ? error.message : error);
      throw new ServiceUnavailableException('AI service is temporarily unavailable. Please try again later.');
    }
  }

  async improveAnswer(answerBody: string, context: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert editor. Improve the given answer by making it clearer, more complete, and better structured. Keep the core content but enhance the explanation.',
          },
          {
            role: 'user',
            content: `Context: ${context.slice(0, 300)}\n\nOriginal answer:\n${answerBody.slice(0, 1500)}\n\nImproved version:`,
          },
        ],
        max_tokens: 800,
        temperature: 0.4,
      });

      return response.choices[0]?.message?.content?.trim() || answerBody;
    } catch (error) {
      // H-4 fix: wrap raw error in a safe HTTP exception
      this.logger.error('Answer improvement failed', error instanceof Error ? error.message : error);
      throw new ServiceUnavailableException('AI service is temporarily unavailable. Please try again later.');
    }
  }
}

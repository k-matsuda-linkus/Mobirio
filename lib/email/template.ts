export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function baseTemplate(content: string, title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">${content}</body></html>`;
}

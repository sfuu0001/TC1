import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

// The API key is injected at build time by vite.config.ts via `define`
// (read from .env.local -> GEMINI_API_KEY). In the browser bundle the
// `process.env.GEMINI_API_KEY` token is replaced with the literal string.
const API_KEY = process.env.GEMINI_API_KEY ?? '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

type ChatMessage = { role: 'user' | 'model'; text: string };

const MODEL = 'gemini-2.0-flash';

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    if (!API_KEY) {
      alert('未检测到 GEMINI_API_KEY。请在项目根目录的 .env.local 中设置 GEMINI_API_KEY=你的key，然后重启 dev server。');
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setInput('');
    setBusy(true);

    try {
      const contents = nextMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
      });

      const reply = response.text ?? '(空响应)';
      setMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: `调用 Gemini 出错：${message}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Nomad Travel Planner</h1>
        <p className="app__subtitle">Powered by Google Gemini · {MODEL}</p>
      </header>

      <div className="chat">
        {messages.length === 0 && (
          <div className="chat__empty">输入一条消息开始和 Gemini Agent 对话。</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.role}`}>
            <span className="bubble__role">{m.role === 'user' ? '你' : 'Gemini'}</span>
            <div className="bubble__text">{m.text}</div>
          </div>
        ))}
        {busy && <div className="chat__typing">Gemini 正在思考…</div>}
      </div>

      <div className="composer">
        <textarea
          className="composer__input"
          placeholder="问点什么，比如：帮我规划一周的日本关西旅行"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="composer__send" onClick={send} disabled={busy || !input.trim()}>
          {busy ? '发送中…' : '发送'}
        </button>
      </div>
    </div>
  );
}

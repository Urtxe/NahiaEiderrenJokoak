import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { tr } from '../data/i18n';
import type { Language } from '../types';

type Notice = { id: number; correct: boolean; detail?: string; advance?: () => void };
type Feedback = {
  advancing: boolean;
  showFeedback: (correct: boolean, detail?: string, advance?: () => void) => void;
};

const AnswerFeedbackContext = createContext<Feedback | null>(null);

export function useAnswerFeedback() {
  const feedback = useContext(AnswerFeedbackContext);
  if (!feedback) throw new Error('Answer feedback requires its provider');
  return feedback;
}

export function AnswerFeedbackProvider({ lang, blocked, children }: { lang: Language; blocked: boolean; children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice || blocked) return;
    const timer = window.setTimeout(() => {
      setNotice(null);
      notice.advance?.();
    }, notice.advance ? 1100 : notice.correct ? 1600 : 2500);
    return () => window.clearTimeout(timer);
  }, [blocked, notice]);

  const showFeedback: Feedback['showFeedback'] = (correct, detail, advance) => {
    if (blocked) return;
    setNotice(current => current?.advance ? current : { id: (current?.id ?? 0) + 1, correct, detail, advance });
  };

  return <AnswerFeedbackContext.Provider value={{ advancing: blocked || !!notice?.advance, showFeedback }}>
    {children}
    <div className="answer-notice-region" role="status" aria-atomic="true">
      {notice && !blocked && <div className={`answer-notice ${notice.correct ? 'success' : 'retry'}`} key={notice.id}>
        <strong><span aria-hidden="true">{notice.correct ? '✓' : '↻'}</span> {notice.correct ? (lang === 'eu' ? 'Ondo!' : '¡Muy bien!') : tr(lang, 'tryAgain')}</strong>
        {notice.detail && <p>{notice.detail}</p>}
      </div>}
    </div>
  </AnswerFeedbackContext.Provider>;
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';

type Role = 'assistant' | 'user';

interface Message {
  id: string;
  role: Role;
  content: string;
}

interface PromptAnswer {
  key: keyof PromptAnswers;
  value: string;
}

interface PromptQuestion {
  key: keyof PromptAnswers;
  title: string;
  question: string;
  helper?: string;
}

interface PromptAnswers {
  objetivo: string;
  publico: string;
  contexto: string;
  entregaveis: string;
  estilo: string;
  restricoes: string;
  recursos: string;
}

const QUESTIONS: PromptQuestion[] = [
  {
    key: 'objetivo',
    title: 'Objetivo Principal',
    question:
      'Qual é o objetivo central do prompt? Descreva o resultado ideal que você espera.',
    helper: 'Ex.: criar um roteiro de vídeo educativo, analisar dados de vendas, escrever um email persuasivo.'
  },
  {
    key: 'publico',
    title: 'Público-alvo',
    question:
      'Quem é o público ou persona que deve ser considerado? Inclua nível de conhecimento, tom ideal ou preferências.',
    helper: 'Ex.: iniciantes em programação, executivos de marketing, estudantes universitários.'
  },
  {
    key: 'contexto',
    title: 'Contexto Essencial',
    question:
      'Quais informações de contexto o assistente precisa saber para gerar a resposta correta?',
    helper: 'Ex.: dados disponíveis, histórico do projeto, limitações técnicas, referências existentes.'
  },
  {
    key: 'entregaveis',
    title: 'Entregáveis e Formato',
    question:
      'Que formato ou estrutura você espera na resposta? Liste itens específicos ou etapas se necessário.',
    helper: 'Ex.: lista numerada, tabela comparativa, plano em etapas com prazos.'
  },
  {
    key: 'estilo',
    title: 'Estilo e Tom',
    question:
      'Qual estilo de comunicação deve ser adotado? Descreva tom, voz e nível de profundidade desejado.',
    helper: 'Ex.: formal e objetivo, inspirador e motivador, técnico e detalhado.'
  },
  {
    key: 'restricoes',
    title: 'Restrições Críticas',
    question:
      'Existem restrições, regras ou pontos que devem ser evitados? Inclua limites de tempo, referências proibidas, etc.',
    helper: 'Ex.: evitar jargões, limitar a 500 palavras, usar apenas dados fornecidos.'
  },
  {
    key: 'recursos',
    title: 'Recursos e Ferramentas',
    question:
      'Há ferramentas, frameworks ou fontes específicas que devem ser utilizadas ou consultadas?',
    helper: 'Ex.: usar API interna X, consultar documentação do produto, seguir guideline da marca.'
  }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'intro',
    role: 'assistant',
    content:
      'Olá! Eu sou seu assistente para criação de prompts complexos. Vou fazer algumas perguntas rápidas para entender melhor sua necessidade e então montar um prompt poderoso para você.'
  }
];

function buildPrompt(answers: PromptAnswers) {
  const sections: { label: string; value: string }[] = [
    { label: 'Objetivo principal', value: answers.objetivo },
    { label: 'Público-alvo e persona', value: answers.publico },
    { label: 'Contexto essencial', value: answers.contexto },
    { label: 'Formato e entregáveis', value: answers.entregaveis },
    { label: 'Estilo e tom', value: answers.estilo },
    { label: 'Restrições críticas', value: answers.restricoes },
    { label: 'Recursos obrigatórios', value: answers.recursos }
  ];

  const formattedSections = sections
    .filter((section) => section.value.trim().length > 0)
    .map((section) => `- ${section.label}: ${section.value.trim()}`)
    .join('\n');

  return `Você é um assistente especialista em gerar resultados excepcionais. Siga as diretrizes a seguir com atenção:
${formattedSections}

Antes de responder, valide se possui informações suficientes. Se algo estiver faltando, peça esclarecimentos. Em seguida, produza a melhor resposta possível.`;
}

export default function PromptBuilderPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const firstQuestion = QUESTIONS[0];
    return [
      ...INITIAL_MESSAGES,
      {
        id: `assistant-${firstQuestion.key}`,
        role: 'assistant',
        content: `${firstQuestion.title}: ${firstQuestion.question}`
      }
    ];
  });
  const [answers, setAnswers] = useState<PromptAnswers>({
    objetivo: '',
    publico: '',
    contexto: '',
    entregaveis: '',
    estilo: '',
    restricoes: '',
    recursos: ''
  });
  const [inputValue, setInputValue] = useState('');
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const answeredKeys = useMemo(
    () =>
      Object.entries(answers)
        .filter(([, value]) => value.trim().length > 0)
        .map(([key]) => key as keyof PromptAnswers),
    [answers]
  );

  const handleAnswer = (value: string) => {
    const currentQuestion = QUESTIONS[activeQuestionIndex];
    if (!currentQuestion) {
      return;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    const newAnswer: PromptAnswer = {
      key: currentQuestion.key,
      value: trimmedValue
    };

    setAnswers((prev) => ({
      ...prev,
      [newAnswer.key]: newAnswer.value
    }));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${currentQuestion.key}-${Date.now()}`,
        role: 'user',
        content: trimmedValue
      }
    ]);

    const nextIndex = activeQuestionIndex + 1;
    const nextQuestion = QUESTIONS[nextIndex];

    if (nextQuestion) {
      const acknowledgement = `Perfeito, entendi sobre ${currentQuestion.title.toLowerCase()}.`;
      const assistantMessage = `${acknowledgement}\n\n${nextQuestion.title}: ${nextQuestion.question}`;
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${nextQuestion.key}-${Date.now()}`,
            role: 'assistant',
            content: assistantMessage
          }
        ]);
      }, 250);
      setActiveQuestionIndex(nextIndex);
    } else {
      setTimeout(() => {
        const builtPrompt = buildPrompt({
          ...answers,
          [newAnswer.key]: newAnswer.value
        });
        setFinalPrompt(builtPrompt);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-summary-${Date.now()}`,
            role: 'assistant',
            content:
              'Excelente! Compilei todas as informações e gerei um prompt completo abaixo. Fique à vontade para revisá-lo ou ajustar algum ponto.'
          }
        ]);
      }, 350);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputValue;
    setInputValue('');
    handleAnswer(value);
  };

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const resetFlow = () => {
    const firstQuestion = QUESTIONS[0];
    setAnswers({
      objetivo: '',
      publico: '',
      contexto: '',
      entregaveis: '',
      estilo: '',
      restricoes: '',
      recursos: ''
    });
    setMessages([
      ...INITIAL_MESSAGES,
      {
        id: `assistant-${firstQuestion.key}-${Date.now()}`,
        role: 'assistant',
        content: `${firstQuestion.title}: ${firstQuestion.question}`
      }
    ]);
    setActiveQuestionIndex(0);
    setFinalPrompt(null);
    setInputValue('');
    setCopied(false);
  };

  const pendingQuestion = QUESTIONS[activeQuestionIndex];
  const helperText = pendingQuestion?.helper;

  const handleCopy = async () => {
    if (!finalPrompt) return;
    try {
      await navigator.clipboard.writeText(finalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  const completionRatio = answeredKeys.length / QUESTIONS.length;
  const progressPercentage = Math.round(completionRatio * 100);

  return (
    <main>
      <div className="page">
        <section className="conversation">
          <header className="header">
            <div>
              <h1>Construtor de Prompt Inteligente</h1>
              <p>
                Responda às perguntas estratégicas e obtenha um prompt final sob medida para seu
                objetivo.
              </p>
            </div>
            <button type="button" className="reset" onClick={resetFlow}>
              Reiniciar Fluxo
            </button>
          </header>

          <div className="progressBar" aria-label="Progresso da coleta de requisitos">
            <div className="progress" style={{ width: `${progressPercentage}%` }} />
            <span>{progressPercentage}% completo</span>
          </div>

          <div className="messages" role="log" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="bubble">
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {helperText && (
            <aside className="helper">
              <strong>Dica rápida:</strong>
              <p>{helperText}</p>
            </aside>
          )}

          <form className="composer" onSubmit={handleSubmit}>
            <label htmlFor="prompt-input" className="sr-only">
              Resposta
            </label>
            <textarea
              ref={inputRef}
              id="prompt-input"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Digite sua resposta aqui..."
              rows={3}
              required
              disabled={Boolean(finalPrompt)}
            />
            <div className="composerActions">
              <button type="submit" className="send" disabled={Boolean(finalPrompt)}>
                Enviar resposta
              </button>
            </div>
          </form>
        </section>

        <section className="summary" aria-label="Resumo das respostas">
          <div className="summaryHeader">
            <h2>Mapa do Prompt</h2>
            <p>Acompanhe em tempo real os elementos já capturados.</p>
          </div>
          <ul>
            {QUESTIONS.map((question) => (
              <li key={question.key} className={answers[question.key] ? 'filled' : 'pending'}>
                <header>
                  <span>{question.title}</span>
                  <small>{answers[question.key] ? 'Definido' : 'Pendente'}</small>
                </header>
                <p>{answers[question.key] || 'Aguardando sua resposta.'}</p>
              </li>
            ))}
          </ul>

          {finalPrompt && (
            <div className="finalPrompt">
              <h3>Prompt Final</h3>
              <pre>{finalPrompt}</pre>
              <div className="finalActions">
                <button type="button" onClick={handleCopy}>
                  {copied ? 'Copiado!' : 'Copiar prompt'}
                </button>
                <button type="button" onClick={resetFlow}>
                  Criar novo prompt
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

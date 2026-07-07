/**
 * Mock data do M1 — simula as respostas da IA (Professor e Avaliador)
 * pra validar a UI do loop principal antes da integração real (M2).
 * Tudo aqui será substituído pelas rotas /api/explain e /api/evaluate.
 */

export interface MockTopic {
  id: string;
  title: string;
  explanation: string;
  analogy: string;
  /** Base usada pelo avaliador fake */
  evaluation: {
    whatWasRight: string;
    confusionPoints: string[];
  };
}

export interface MockEvaluation {
  completenessScore: number;
  whatWasRight: string;
  confusionPoints: string[];
}

export const MOCK_TOPICS: MockTopic[] = [
  {
    id: "recursao-em-programacao",
    title: "Recursão em programação",
    explanation:
      "Recursão é quando uma função chama a si mesma pra resolver um problema. A ideia é quebrar um problema grande em versões menores do mesmo problema, até chegar num caso tão simples que dá pra responder direto — esse é o chamado caso base. Sem o caso base, a função se chamaria pra sempre e o programa travaria. Cada chamada espera a resposta da chamada seguinte, e quando o caso base é atingido, as respostas voltam em cadeia, uma completando a outra, até formar a resposta final do problema original.",
    analogy:
      "Imagine que você está numa fila enorme e quer saber sua posição. Em vez de contar todo mundo, você pergunta pra pessoa da frente: \"qual a sua posição?\". Ela pergunta pra da frente dela, e assim por diante, até chegar na primeira pessoa, que responde \"sou a primeira!\". A resposta volta de pessoa em pessoa, cada uma somando 1, até chegar em você com o número exato.",
    evaluation: {
      whatWasRight:
        "Você entendeu bem a ideia central: uma função que chama a si mesma pra quebrar um problema grande em pedaços menores. A noção de que as respostas 'voltam' acumulando também apareceu na sua explicação.",
      confusionPoints: [
        "Você não mencionou o caso base — sem ele a recursão nunca para. É a parte mais importante do conceito.",
        "Ficou vago o que acontece na 'volta' das chamadas: cada chamada usa o resultado da seguinte pra montar o seu próprio.",
        "Vale citar um exemplo concreto (fatorial, Fibonacci) pra mostrar domínio prático.",
      ],
    },
  },
  {
    id: "closures-em-javascript",
    title: "Closures em JavaScript",
    explanation:
      "Uma closure acontece quando uma função \"lembra\" das variáveis do lugar onde foi criada, mesmo depois que esse lugar já terminou de executar. Em JavaScript, toda função carrega consigo uma mochila invisível com as variáveis do escopo onde nasceu. Se você cria uma função dentro de outra e a devolve, essa função interna continua acessando as variáveis da função externa — mesmo que a externa já tenha retornado. É assim que dá pra criar contadores privados, funções de fábrica e esconder dados sem precisar de classes.",
    analogy:
      "Pense num garçom que anota seu pedido num bloquinho e leva pra cozinha. Mesmo que você vá embora do restaurante, o bloquinho continua com o pedido anotado — o garçom não precisa te encontrar de novo pra saber o que você pediu. A função interna é o garçom: ela carrega o bloquinho (as variáveis do escopo original) pra onde for.",
    evaluation: {
      whatWasRight:
        "Você captou que a função interna continua acessando variáveis da função externa depois que ela retornou — esse é exatamente o coração do conceito de closure.",
      confusionPoints: [
        "Você misturou escopo com hoisting — são mecanismos diferentes: closure é sobre onde a função nasce, não sobre a ordem de declaração.",
        "Faltou dizer que cada chamada da função externa cria uma closure nova e independente (dois contadores não dividem o mesmo valor).",
      ],
    },
  },
  {
    id: "programacao-orientada-a-objetos",
    title: "Programação Orientada a Objetos",
    explanation:
      "Programação Orientada a Objetos (POO) é uma forma de organizar código juntando dados e comportamentos numa mesma \"peça\", chamada objeto. Em vez de espalhar variáveis e funções soltas, você cria moldes (classes) que descrevem o que algo tem (atributos) e o que algo faz (métodos). A partir de um molde, você fabrica quantos objetos quiser. Os quatro pilares são: encapsulamento (esconder o interno), herança (reaproveitar moldes), polimorfismo (o mesmo comando age diferente em objetos diferentes) e abstração (expor só o essencial).",
    analogy:
      "Uma classe é como a planta de uma casa: define quantos quartos tem e como a porta abre. A casa construída é o objeto — dá pra construir várias casas iguais a partir da mesma planta, cada uma com seus próprios moradores dentro. Você não precisa saber como o encanamento passa por dentro das paredes pra abrir a torneira: isso é o encapsulamento.",
    evaluation: {
      whatWasRight:
        "Você explicou bem a relação classe → objeto (molde → coisa construída) e entendeu que POO junta dados e comportamento no mesmo lugar.",
      confusionPoints: [
        "Você citou herança mas descreveu composição — herança é 'ser um tipo de', composição é 'ter um'.",
        "Polimorfismo ficou de fora da sua explicação — é um dos quatro pilares.",
        "Encapsulamento não é só 'deixar privado': é expor uma interface estável e esconder o detalhe que pode mudar.",
      ],
    },
  },
];

export function getMockTopic(id: string): MockTopic | undefined {
  return MOCK_TOPICS.find((t) => t.id === id);
}

/** Conta palavras do jeito que o PRD define o aviso de resposta curta (< 20). */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const MIN_WORDS = 20;

/**
 * Avaliador fake: gera um score determinístico a partir do texto
 * (mais palavras ⇒ score maior, com variação pelo conteúdo) e monta a
 * avaliação com os pontos canned do tópico. Regra do PRD: confusion_points
 * nunca vazio se score < 90.
 */
export function mockEvaluate(topic: MockTopic, userText: string): MockEvaluation {
  const words = countWords(userText);
  // hash simples pro score não ser idêntico entre textos do mesmo tamanho
  let hash = 0;
  for (let i = 0; i < userText.length; i++) {
    hash = (hash * 31 + userText.charCodeAt(i)) % 997;
  }
  const base = Math.min(92, 30 + words * 1.4);
  const score = Math.max(15, Math.min(98, Math.round(base + (hash % 13) - 6)));

  const points = topic.evaluation.confusionPoints;
  const confusionPoints =
    score >= 90 ? points.slice(0, 1) : score >= 70 ? points.slice(0, 2) : points;

  return {
    completenessScore: score,
    whatWasRight: topic.evaluation.whatWasRight,
    confusionPoints,
  };
}

/**
 * Tópicos criados pelo usuário na sessão (tela "novo tópico") — vivem em
 * sessionStorage só pra UI ser navegável de ponta a ponta sem banco.
 */
const SESSION_KEY = "feynman-session-topics";

const GENERIC_EXPLANATION = (title: string) =>
  `Esta é uma explicação de exemplo sobre "${title}". No M2, o professor IA vai gerar aqui uma explicação simples, sem jargão, como se você nunca tivesse ouvido falar do assunto — em no máximo 150 palavras, seguida de uma analogia concreta do dia a dia. Por enquanto, este texto só valida o layout: leia, finja que aprendeu algo novo e tente reexplicar com as suas palavras no campo ao lado.`;

const GENERIC_ANALOGY =
  "É como testar uma receita nova cozinhando pra alguém: só quando você prepara o prato sozinho — sem olhar o livro — descobre se realmente aprendeu ou se só acompanhou os passos.";

export function createSessionTopic(title: string): MockTopic {
  const id = `sessao-${Date.now().toString(36)}`;
  const topic: MockTopic = {
    id,
    title,
    explanation: GENERIC_EXPLANATION(title),
    analogy: GENERIC_ANALOGY,
    evaluation: {
      whatWasRight:
        "Você estruturou a reexplicação com as próprias palavras e manteve a ideia central do conceito — é exatamente esse o exercício da Técnica de Feynman.",
      confusionPoints: [
        "Alguns trechos repetiram a explicação original em vez de traduzi-la — tente usar um exemplo seu.",
        "A explicação ficaria mais completa dizendo quando o conceito é útil na prática.",
      ],
    },
  };
  const existing = readSessionTopics();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...existing, topic]));
  return topic;
}

export function readSessionTopics(): MockTopic[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]") as MockTopic[];
  } catch {
    return [];
  }
}

export function getAnyTopic(id: string): MockTopic | undefined {
  return getMockTopic(id) ?? readSessionTopics().find((t) => t.id === id);
}

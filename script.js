import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

document.addEventListener('DOMContentLoaded', async function() {
  const userQuestionInput = document.getElementById('user-question-input');
  const sendQuestionButton = document.getElementById('send-question-button');
  const chatbotHistory = document.getElementById('chatbot-history');
  const minimizeMaximizeButton = document.getElementById('minimize-maximize-button');
  const chatbotContainer = document.getElementById('chatbot-container');
  const loadingIndicator = document.getElementById('loading-indicator'); // Elemento de carregamento
  const scrollAnchor = document.getElementById('scroll-anchor'); // Div âncora

  let isMinimized = false; // Estado inicial: chatbot não está minimizado

  // Evento de clique no botão Min/Max
  minimizeMaximizeButton.addEventListener('click', function() {
    if (isMinimized) {
      chatbotContainer.style.height = '420px'; // Altura desejada quando maximizado
      minimizeMaximizeButton.textContent = 'Min'; // Altera o texto do botão para "Min"
      isMinimized = false;
    } else {
      chatbotContainer.style.height = '48px'; // Altura mínima quando minimizado
      minimizeMaximizeButton.textContent = 'Max'; // Altera o texto do botão para "Max"
      isMinimized = true;
    }
  });

  let apiKey = '';
  let genAI = null;
  const MODEL_NAME = "gemini-1.0-pro";

  // Função para fazer a requisição AJAX e obter a API Key
  async function getApiKey() {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            const receivedApiKey = xhr.responseText;
            resolve(receivedApiKey);
          } else {
            console.error('Erro ao obter API Key:', xhr.status);
            reject('Erro ao obter API Key');
          }
        }
      };
      xhr.open('GET', 'get_api_key.php');
      xhr.send();
    });
  }

  // Função para iniciar o GoogleGenerativeAI e o chatbot
  async function initChatbot() {
    try {
      // Obtém a API Key
      apiKey = await getApiKey();

      // Inicia o GoogleGenerativeAI e o chatbot após obter a chave de API
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      // Configurações do chatbot
      const generationConfig = { temperature: 1, topK: 0, topP: 0.95, maxOutputTokens: 8192 };
      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
      ];

      const chat = model.startChat({ generationConfig, safetySettings, history: [] });

      // Evento de clique no botão de enviar pergunta
      sendQuestionButton.addEventListener('click', async () => {
        await sendMessage();
      });

      // Evento de pressionar a tecla Enter
      userQuestionInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
          event.preventDefault(); // Impede a ação padrão do Enter (enviar o formulário)
          await sendMessage();
        }
      });

      // Evento de scroll na área de conversa
      chatbotHistory.addEventListener('scroll', () => {
        // Calcula a posição do indicador de carregamento com base no scroll
        const scrollTop = chatbotHistory.scrollTop;
        const scrollHeight = chatbotHistory.scrollHeight - chatbotHistory.clientHeight;
        const scrollFraction = scrollTop / scrollHeight;
        const indicatorHeight = loadingIndicator.clientHeight;
        const bottomOffset = 50; // Ajuste fino para a posição do indicador
        const bottomPosition = scrollFraction * (chatbotHistory.clientHeight - indicatorHeight - bottomOffset);
        loadingIndicator.style.bottom = `${bottomPosition}px`; // Define a posição correta
      });

      // Função para enviar a pergunta ao chatbot
      async function sendMessage() {
        const userQuestion = userQuestionInput.value.trim();
        if (userQuestion) {
          // Mostra o indicador de carregamento
          loadingIndicator.style.display = 'block';

          // Limpa o campo de pergunta
          userQuestionInput.value = '';

          // Cria o elemento de mensagem do usuário
          const userMessageElement = document.createElement('div');
          userMessageElement.classList.add('chatbot-message', 'user-message');
          userMessageElement.textContent = userQuestion;
          chatbotHistory.appendChild(userMessageElement);

          // Envia a pergunta para o chatbot e processa a resposta
          const result = await chat.sendMessage(userQuestion);
          const response = result.response;

          // Cria o elemento de mensagem do chatbot
          const geminiMessageElement = document.createElement('div');
          geminiMessageElement.classList.add('chatbot-message', 'gemini-message');
          geminiMessageElement.textContent = response.text();
          chatbotHistory.appendChild(geminiMessageElement);

          // Esconde o indicador de carregamento após receber a resposta
          loadingIndicator.style.display = 'none';

          // Rola a área de conversa para baixo para mostrar a nova mensagem
          chatbotHistory.scrollTop = chatbotHistory.scrollHeight;

          // Move a âncora para manter o scroll no final da conversa
          scrollAnchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar o chatbot:', error);
    }
  }

  // Inicia o chatbot após o carregamento da página
  initChatbot();
});

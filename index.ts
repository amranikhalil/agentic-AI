import express from 'express';
import cors from 'cors';
import { Ollama } from 'ollama';

// 1. Initialisation du client (Spécifie l'URL Ngrok de Kaggle ou localhost)
const NGROK_URL = 'https://bakeshop-finite-subarctic.ngrok-free.dev'; // Replace with your Ngrok URL or http://localhost:11434

const app =express()
app.use(cors())
app.use(express.json())
const ollama = new Ollama({ 
  host: NGROK_URL
});

// Le nom du modèle que tu as créé dans Kaggle
const MODEL_NAME = 'qwen35-uncensored';

// Structure de l'état partagé entre les agents
interface AgentState {
  userInput: string;
  researchNotes?: string;
  finalOutput?: string;
}

// ============================================================================
// AGENT 1 : LE CHERCHEUR / ANALYSTE
// ============================================================================
async function researcherAgent(state: AgentState): Promise<AgentState> {
  console.log("🔍 [Agent 1 - Chercheur] Analyse du problème et extraction des concepts clés...");

  const response = await ollama.chat({
    model: MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: `Tu es un Agent Chercheur Expert. Ton rôle est de décomposer la demande de l'utilisateur, d'extraire les points clés techniques et de fournir un plan structuré sous forme de notes explicites. Sois très précis et technique.`
      },
      {
        role: 'user',
        content: state.userInput
      }
    ],
    options: { temperature: 0.2 } // Basse température pour de la rigueur
  });

  const researchNotes = response.message.content;
  console.log("\n✅ [Agent 1 - Chercheur] Notes de recherche générées !\n");

  return {
    ...state,
    researchNotes
  };
}

// ============================================================================
// AGENT 2 : LE RÉDACTEUR / SYNTHÉTISEUR
// ============================================================================
async function writerAgent(state: AgentState): Promise<AgentState> {
  console.log("✍️ [Agent 2 - Rédacteur] Rédaction du rapport final basé sur les notes du chercheur...");

  const response = await ollama.chat({
    model: MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: `Tu es un Agent Rédacteur Technique. Ton rôle est de prendre les notes d'analyse d'un chercheur et de créer une explication finale claire, professionnelle et parfaitement structurée en Markdown pour l'utilisateur.`
      },
      {
        role: 'user',
        content: `Demande initiale de l'utilisateur: "${state.userInput}"\n\nNotes fournies par l'Agent Chercheur:\n${state.researchNotes}`
      }
    ],
    options: { temperature: 0.7 } // Température plus élevée pour une rédaction plus fluide
  });

  const finalOutput = response.message.content;
  console.log("\n✅ [Agent 2 - Rédacteur] Rapport final rédigé !\n");

  return {
    ...state,
    finalOutput
  };
}

// ============================================================================
// ORCHESTRATEUR (L'Agent Workflow)
// ============================================================================
async function runMultiAgentPipeline(prompt: string) {
  console.log("=================================================");
  console.log("🚀 Lancement du Pipeline Multi-Agents");
  console.log(`Prompt utilisateur: "${prompt}"`);
  console.log("=================================================\n");

  let state: AgentState = { userInput: prompt };

  // Étape 1 : Passage par le chercheur
  state = await researcherAgent(state);

  // Étape 2 : Passage du résultat au rédacteur
  state = await writerAgent(state);

  // Étape 3 : Résultat final
  console.log("=================================================");
  console.log("📄 RÉSULTAT FINAL DU PIPELINE :");
  console.log("=================================================\n");
  console.log(state.finalOutput);
}

// Test de notre pipeline
const testPrompt = "Explique comment sécuriser une API Node.js/Express connectée à une base de données PostgreSQL.";
runMultiAgentPipeline(testPrompt).catch(console.error);
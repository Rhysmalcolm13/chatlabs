import { LLM } from "@/types"

export const DEEPSEEK_LLM_LIST: LLM[] = [
    {
        modelId: "deepseek-chat",
        hostedId: "deepseek-chat",
        provider: "deepseek",
        modelName: "DeepSeek Chat",
        contextLength: 16384,
        tools: false,
        imageInput: false,
      },
    {
        modelId: "deepseek-reasoner",
        hostedId: "deepseek-reasoner",
        provider: "deepseek",
        modelName: "DeepSeek Reasoner",
        contextLength: 16384,
        tools: false,
        imageInput: false,
    },
]

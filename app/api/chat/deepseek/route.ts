import {
  checkApiKey,
  getServerProfile,
  validateModelAndMessageCount
} from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
    const json = await request.json()
    const { chatSettings, messages } = json as {
        chatSettings: ChatSettings
        messages: any[]
    }

    try {
      const profile = await getServerProfile()

      checkApiKey(profile.deepseek_api_key, "DeepSeek")

      await validateModelAndMessageCount(chatSettings.model, new Date())


      const deepseek = new OpenAI({
          apiKey: profile.deepseek_api_key || "",
          baseURL: 'https://api.deepseek.com/v1' // Replace with the actual DeepSeek API base URL if different
      })


    const response = await deepseek.chat.completions.create({
        model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
        messages: messages as ChatCompletionCreateParamsBase["messages"],
        temperature: chatSettings.temperature,
        stream: true
    })


      const stream = OpenAIStream(response)


      return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500


    if (errorMessage.toLowerCase().includes("api key not found")) {
        errorMessage = "DeepSeek API Key not found. Please set it in your profile settings."
    }  else if (errorCode === 401) {
      errorMessage = "DeepSeek API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}

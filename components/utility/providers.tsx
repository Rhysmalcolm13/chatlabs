"use client"

import { isUsingEnvironmentKey } from "@/lib/envs"
import { EnvKey } from "@/types/key-type"
import { VALID_ENV_KEYS } from "@/types/valid-keys"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

interface ProvidersProps {}

export const Providers: FC<ProvidersProps> = ({}) => {
  const { t } = useTranslation()

  const envKeyMap: Record<string, VALID_ENV_KEYS> = {
    azure: VALID_ENV_KEYS.AZURE_OPENAI_API_KEY,
    openai: VALID_ENV_KEYS.OPENAI_API_KEY,
    google: VALID_ENV_KEYS.GOOGLE_GEMINI_API_KEY,
    anthropic: VALID_ENV_KEYS.ANTHROPIC_API_KEY,
    mistral: VALID_ENV_KEYS.MISTRAL_API_KEY,
    groq: VALID_ENV_KEYS.GROQ_API_KEY,
    perplexity: VALID_ENV_KEYS.PERPLEXITY_API_KEY,
    openrouter: VALID_ENV_KEYS.OPENROUTER_API_KEY,
    deepseek: VALID_ENV_KEYS.DEEPSEEK_API_KEY,

    openai_organization_id: VALID_ENV_KEYS.OPENAI_ORGANIZATION_ID,

    azure_openai_endpoint: VALID_ENV_KEYS.AZURE_OPENAI_ENDPOINT,
    azure_gpt_35_turbo_name: VALID_ENV_KEYS.AZURE_GPT_35_TURBO_NAME,
    azure_gpt_45_vision_name: VALID_ENV_KEYS.AZURE_GPT_45_VISION_NAME,
    azure_gpt_45_turbo_name: VALID_ENV_KEYS.AZURE_GPT_45_TURBO_NAME,
    azure_embeddings_name: VALID_ENV_KEYS.AZURE_EMBEDDINGS_NAME
  }

  return (
    <div className="mt-4 flex w-full flex-col space-y-4">
      <div className="flex flex-col space-y-1">
        <Label htmlFor="deepseek-api-key">{t("DeepSeek API Key")}</Label>
        <Input
          id="deepseek-api-key"
          type="password"
          placeholder={t("Enter your DeepSeek API Key...")}
          disabled={isUsingEnvironmentKey(envKeyMap.deepseek as EnvKey)}
        />
      </div>
    </div>
  )
}

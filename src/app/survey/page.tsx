import { getUIConfig } from "@/lib/getUIConfig";
import SurveyClient from "./surveyClient";

export default async function SurveyPage() {
  const uiConfig = await getUIConfig("survey");

  return <SurveyClient uiConfig={uiConfig} />;
}

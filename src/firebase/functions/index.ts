import { onCallGenkit } from "firebase-functions/https";
import { menuSuggestionFlow, faqChatFlow } from "./genkit/flows";

export const menuSuggestion = onCallGenkit({}, menuSuggestionFlow);
export const faqChat = onCallGenkit({}, faqChatFlow);

import { onCallGenkit } from "firebase-functions/https";
import { menuSuggestionFlow } from "./genkit/flows";

export const menuSuggestion = onCallGenkit({}, menuSuggestionFlow);

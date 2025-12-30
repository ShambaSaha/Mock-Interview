import Vapi from "@vapi-ai/web";

// The Web SDK expects the Public Key (Web Token) as a simple string.
// Ensure NEXT_PUBLIC_VAPI_WEB_TOKEN is your "Public Key" from the Vapi Dashboard.
export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN as string);
import { envServer } from "./env.server";

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Normalizes an Indian or international mobile number into WAHA WhatsApp chatId format.
 * (e.g., 9876543210 -> 919876543210@c.us)
 */
export function formatWhatsAppChatId(phone: string): string {
  let digits = phone.trim().replace(/\D/g, "");

  // If 10 digits (standard Indian mobile number), prepend India country code 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = `91${digits.slice(1)}`;
  }

  return digits.endsWith("@c.us") ? digits : `${digits}@c.us`;
}

/**
 * Sends a 6-digit OTP code to the recipient's WhatsApp number using the WAHA service.
 * Calls WAHA endpoint: POST /api/sendText
 *
 * @param number - The recipient's mobile number (e.g. 9876543210 or +919876543210)
 * @param otp - The generated 6-digit verification code
 */
export const sendOtp = async (
  number: string,
  otp: string
): Promise<SendOtpResponse> => {
  const baseUrl = envServer.WAHA_BASE_URL || envServer.API_BASE_URL;
  const apiKey = envServer.WAHA_API_KEY;
  const session = envServer.WAHA_SESSION;

  const chatId = formatWhatsAppChatId(number);

  // Debug Mode Only
  if (envServer.NODE_ENV != "production") {
    return {
      success: true,
      message: "OTP sent to WhatsApp successfully.",
    };
  }

  const appName = envServer.NEXT_PUBLIC_APP_NAME;
  const messageText = `*${appName}* 🌸

Your registration verification code is: *${otp}*

⏱️ This code is valid for 10 minutes.
🔒 Please do not share this code with anyone.`;

  if (!baseUrl) {
    return {
      success: false,
      error: "WhatsApp service URL is not configured.",
    };
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/api/sendText`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        session,
        chatId,
        text: messageText,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.error ||
        `WAHA service returned status ${response.status}`;
      console.error(`[WAHA Error] [${response.status}]:`, errorMsg, data);
      return {
        success: false,
        error: errorMsg,
        data,
      };
    }

    return {
      success: true,
      message: "OTP sent to WhatsApp successfully.",
      data,
    };
  } catch (error: any) {
    console.error("[WAHA Network Error]:", error);
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "WhatsApp service timed out. Please try again.",
      };
    }
    return {
      success: false,
      error: error?.message || "Failed to reach WhatsApp service.",
    };
  }
};
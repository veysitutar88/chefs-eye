import { accountFetch, AccountScope } from './accountScope';

import { Order } from "../types";

const PROXY_URL = '/api/gemini/parse';

// Helper to convert file to base64 (browser-side, no SDK needed)
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Extract text from a Gemini REST API response
const extractText = (data: any): string => {
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini proxy");
  return text;
};

// Send a request through the server-side Gemini proxy
const geminiRequest = async (
  model: string,
  parts: any[],
  schema: object,
  scope: AccountScope
): Promise<string> => {
  const response = await accountFetch(scope, PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      // REST API requires contents to be an array of content objects
      contents: [{ parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Gemini proxy error ${response.status}`);
  }

  const data = await response.json();
  return extractText(data);
};

// Shared JSON schema for order extraction (Gemini REST API format — uppercase types)
const ORDER_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      client_name: { type: 'STRING' },
      order_date: { type: 'STRING' },
      delivery_datetime: { type: 'STRING' },
      guests_count: { type: 'NUMBER' },
      table_number: { type: 'STRING' },
      total_amount: { type: 'NUMBER' },
      menu_type: { type: 'STRING' },
      language: { type: 'STRING', enum: ['DE', 'RU', 'EN'] },
      discounts_offers: { type: 'STRING' },
      items: {
        type: 'OBJECT',
        properties: {
          dishes_gerichte: { type: 'ARRAY', items: { type: 'STRING' } },
          'drinks_getränke': { type: 'ARRAY', items: { type: 'STRING' } },
          service: { type: 'ARRAY', items: { type: 'STRING' } },
        },
      },
      transcription: { type: 'STRING' },
      notes: { type: 'STRING' },
      confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    },
    required: ['client_name', 'items', 'guests_count', 'delivery_datetime'],
  },
};

// Map raw Gemini response data to a partial Order
const mapParsedOrder = (data: any, fallbackTranscription = ''): Partial<Order> => {
  const dishes = data.items?.dishes_gerichte || [];
  const drinks = data.items?.['drinks_getränke'] || [];
  const service = data.items?.service || [];
  return {
    clientName: data.client_name || 'Walk-in',
    orderDate: data.order_date || new Date().toISOString(),
    deliveryDateTime: data.delivery_datetime || new Date().toISOString(),
    guestsCount: data.guests_count || 1,
    tableNumber: data.table_number || '-',
    amount: data.total_amount || 0,
    menuType: data.menu_type || 'Standard',
    language: data.language || 'DE',
    discounts: data.discounts_offers || '',
    items: { dishes, drinks, service },
    totalItems: dishes.length + drinks.length,
    transcription: data.transcription || fallbackTranscription,
    confidence: data.confidence || 'medium',
    notes: data.notes || '',
  };
};

export const parseOrderFromText = async (
  text: string,
  modelName: 'gemini-3-flash-preview' | 'gemini-3-pro-preview',
  scope: AccountScope
): Promise<Partial<Order>[]> => {
  try {
    const parts = [
      {
        text: `You are a world-class restaurant management AI. Analyze this transcribed voice order.
            Extract EVERY individual order as a separate object in the list.

            Transcribed Text: "${text}"

            Strict Extraction Guidelines:
            1. **Client Name**: Identify guest names, company names, or nicknames.
            2. **Event/Delivery Date & Time**: CRITICAL. Search for specific dates and times.
               - If only a time is found, assume current day. 
               - If only a date is found, assume a default time of 12:00. 
               - Format as ISO 8601 string.
            3. **Guest Count**: Search for number of guests.
            4. **Table Number**: Identify table identifiers.
            5. **Items**: Group dishes, drinks, and special requests separately.
            6. **Menu Type**: Detect 'Lunch', 'Bankett', 'A la carte', 'Wedding', etc.
            7. **Confidence**: Set confidence based on clarity.
            `
      }
    ];

    const resultText = await geminiRequest(modelName, parts, ORDER_SCHEMA, scope);
    const parsedArray = JSON.parse(resultText);
    return parsedArray.map((data: any) => mapParsedOrder(data, text));
  } catch (error) {
    console.error("Gemini Text API Error:", error);
    throw error;
  }
};

export const parseOrderFromImage = async (
  base64Image: string,
  mimeType: string,
  modelName: 'gemini-3-flash-preview' | 'gemini-3-pro-preview',
  scope: AccountScope
): Promise<Partial<Order>[]> => {
  try {
    const parts = [
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
      {
        text: `You are a world-class restaurant management AI. Analyze this image of orders (handwritten notes, receipts, or screenshots).
            Extract EVERY individual order as a separate object in the list.

            Strict Extraction Guidelines:
            1. **Client Name**: Identify guest names, company names, or nicknames.
            2. **Event/Delivery Date & Time**: CRITICAL. Search for specific dates and times. Look for keywords like 'am', 'um', 'Date', 'Time', 'Datum', 'Uhrzeit', 'Дата', 'Время'. 
               - If only a time is found, assume current day. 
               - If only a date is found, assume a default time of 12:00. 
               - Format as ISO 8601 string (e.g., 2024-05-20T18:30:00Z).
            3. **Guest Count**: Search for 'Pax', 'P.', 'Pers.', 'Guests', 'Gäste', 'чел', 'человек'.
            4. **Table Number**: Identify 'Tisch', 'Table', 'T.', 'Стол', '#'.
            5. **Items**: Group dishes, drinks, and special requests separately.
            6. **Menu Type**: Detect 'Lunch', 'Bankett', 'A la carte', 'Wedding', etc.
            7. **Confidence**: Be honest. If the date or name is blurry, set confidence to 'low'.
            `
      }
    ];

    const resultText = await geminiRequest(modelName, parts, ORDER_SCHEMA, scope);
    const parsedArray = JSON.parse(resultText);
    return parsedArray.map((data: any) => ({
      ...mapParsedOrder(data),
      originalImage: `data:${mimeType};base64,${base64Image}`,
    }));
  } catch (error) {
    console.error("Gemini Image API Error:", error);
    throw error;
  }
};
